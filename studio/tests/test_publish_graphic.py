import hashlib
import json

import httpx
import pytest

from app import publish_graphic as g, repost_queue as rq


@pytest.fixture
def package(tmp_path, monkeypatch):
    monkeypatch.setattr(g, 'GRAPHICS', tmp_path)
    image=tmp_path/'image.png';image.write_bytes(b'approved pixels')
    p={'owner_approved':True,'publishing_authorized':True,'source_image':str(image),
       'image_sha256':hashlib.sha256(image.read_bytes()).hexdigest(),
       'platform_copy':{'instagram':'Comment MAP. Follow @withhammad.ai','facebook':'Comment MAP','linkedin':'Comment MAP'},
       'keyword':'MAP','guide_url':'https://withhammad.com/resources/map','alt':'An approved diagram',
       'image_url':'https://withhammad.com/media/map.png','jpeg_url':'https://withhammad.com/media/map.jpg','jpeg_bytes':100}
    folder=tmp_path/'map';folder.mkdir();(folder/'package.json').write_text(json.dumps(p))
    monkeypatch.setattr(g.dm_rules,'load',lambda:{'rules':[{'keyword':'MAP','link':p['guide_url']}]})
    monkeypatch.setattr(g.ig,'load_credentials',lambda *a:{'access_token':'fake'})
    monkeypatch.setattr(g.fb,'load_credentials',lambda *a:{'access_token':'fake'})
    monkeypatch.setattr(g.li,'load_credentials',lambda *a:{'access_token':'fake','member_sub':g.li.OWNER_SUB})
    return p,folder


def entry(p, platform):
    return {'platform':platform+'_image','graphic':'map','caption':p['platform_copy'][platform],
            'keyword':'MAP','resource_url':p['guide_url'],'collaborators':['with.hammad','hammadagentic.ai']}


def transport(calls, *, wrong_identity=False, fail_post=False, guide=200):
    def handle(request):
        calls.append(request)
        path=request.url.path
        if request.url.host=='withhammad.com':
            if path.endswith('.jpg'):return httpx.Response(200,headers={'content-type':'image/jpeg','content-length':'100'})
            return httpx.Response(guide,text='Guide')
        if path.endswith('/userinfo'):return httpx.Response(200,json={'sub':'wrong' if wrong_identity else g.li.OWNER_SUB,'name':'Hammad'})
        if path.endswith('/me'):
            if request.url.host=='graph.instagram.com':return httpx.Response(200,json={'username':'wrong' if wrong_identity else 'withhammad.ai','user_id':'123','account_type':'BUSINESS'})
            return httpx.Response(200,json={'id':'wrong' if wrong_identity else g.fb.PAGE_ID,'name':'Hammad'})
        if path.endswith('/content_publishing_limit'):return httpx.Response(200,json={'data':[{'quota_usage':0,'config':{'quota_total':100}}]})
        if path.endswith('/media'):return httpx.Response(200,json={'id':'container'})
        if path.endswith('/container'):return httpx.Response(200,json={'status_code':'FINISHED'})
        if path.endswith('/images'):return httpx.Response(200,json={'value':{'image':'urn:li:image:abc','uploadUrl':'https://www.linkedin.com/upload'}})
        if path=='/upload':return httpx.Response(201)
        if request.method=='POST' and (path.endswith('/photos') or path.endswith('/posts') or path.endswith('/media_publish')):
            if fail_post:raise httpx.ReadTimeout('lost response',request=request)
            if path.endswith('/posts'):return httpx.Response(201,headers={'x-restli-id':'urn:li:share:987'})
            if path.endswith('/photos'):return httpx.Response(200,json={'id':'photo','post_id':'page_post'})
            return httpx.Response(200,json={'id':'media'})
        if path.endswith('/media'):return httpx.Response(200,json={'permalink':'https://www.instagram.com/p/test/'})
        raise AssertionError(str(request.url))
    return httpx.MockTransport(handle)


@pytest.mark.parametrize('platform',['instagram','facebook','linkedin'])
def test_dry_run_reads_identity_and_never_writes(package,platform):
    p,folder=package;calls=[]
    assert g.publish(entry(p,platform),transport=transport(calls))['status']=='planned'
    assert all(r.method in ('GET','HEAD') for r in calls)
    assert not (folder/(platform+'_image.json')).exists()


@pytest.mark.parametrize('platform',['instagram','facebook','linkedin'])
def test_wrong_account_cannot_upload_or_post(package,platform):
    p,_=package;calls=[]
    with pytest.raises((ValueError,g.ig.IdentityMismatchError)):
        g.publish(entry(p,platform),live=True,transport=transport(calls,wrong_identity=True))
    assert all(r.method in ('GET','HEAD') for r in calls)


@pytest.mark.parametrize('platform',['instagram','facebook','linkedin'])
def test_lost_publish_response_blocks_automatic_retry(package,platform):
    p,folder=package;calls=[]
    with pytest.raises(Exception):g.publish(entry(p,platform),live=True,transport=transport(calls,fail_post=True),sleep=lambda _:None)
    assert json.loads((folder/(platform+'_image.json')).read_text())['attempt']
    before=len(calls)
    with pytest.raises(RuntimeError,match='uncertain'):
        g.publish(entry(p,platform),live=True,transport=transport(calls),sleep=lambda _:None)
    assert len(calls)==before


def test_changed_approved_image_or_copy_is_rejected(package):
    p,_=package;e=entry(p,'facebook');e['caption']='different'
    with pytest.raises(ValueError,match='copy'):g.publish(e)
    e=entry(p,'facebook');open(p['source_image'],'wb').write(b'changed')
    with pytest.raises(ValueError,match='changed'):g.publish(e)


def test_missing_rule_and_dead_guide_block_writes(package,monkeypatch):
    p,_=package;calls=[]
    with pytest.raises(ValueError,match='not live'):
        g.publish(entry(p,'facebook'),live=True,transport=transport(calls,guide=404))
    assert all(r.method=='GET' for r in calls)
    monkeypatch.setattr(g.dm_rules,'load',lambda:{'rules':[]})
    with pytest.raises(ValueError,match='rule'):g.publish(entry(p,'facebook'))


def test_published_image_is_not_posted_twice(package):
    p,folder=package;calls=[];e=entry(p,'facebook')
    result=g.publish(e,live=True,transport=transport(calls),sleep=lambda _:None)
    assert result['post_id']=='page_post'
    body=calls[-1].content.decode()
    assert 'url=' in body and 'attached_media' not in body
    before=len(calls)
    assert g.publish(e,live=True,transport=transport(calls))['status']=='already_published'
    assert len(calls)==before


def test_image_queue_dispatch_and_native_lane_exclusion(package,monkeypatch):
    p,_=package;e=entry(p,'facebook')
    monkeypatch.setattr(g,'publish',lambda actual,**kw:{'status':'planned','entry':actual,'live':kw['live']})
    assert rq.post(e,object(),False)=={'status':'planned','entry':e,'live':False}
    assert all(x+'_image' in rq.CHROME_LANES for x in ['youtube','tiktok','x'])
    assert not any(x+'_image' in rq.APP_SOUND_LANES for x in ['instagram','youtube'])


def test_chrome_image_todo_never_points_to_nonexistent_video(package,tmp_path):
    p,_=package
    e={**entry(p,'facebook'),'id':'x-map','platform':'x_image','job':'graphic-map','image_path':p['source_image'],
       'status':'pending','local':'2026-11-09 19:00 GST','slot_utc':'2026-11-09T15:00:00Z'}
    q=tmp_path/'queue.json';q.write_text(json.dumps({'entries':[e]}))
    [todo]=rq.chrome_todo(q)
    assert todo['image']==p['source_image'] and 'video' not in todo


def test_community_watchlist_excludes_unapproved_future_or_missing_posts(package,monkeypatch):
    from datetime import datetime,timezone
    from app import youtube_community as community,linkedin_keyword
    monkeypatch.setattr(linkedin_keyword,'load_state',lambda *a:{'replied':{}})
    base={'id':'yt-map','platform':'youtube_image','url':'https://youtube.com/post/a','keyword':'MAP',
          'slot_utc':'2026-11-09T04:30:00Z','status':'scheduled'}
    entries=[base,{**base,'id':'future','slot_utc':'2026-11-10T04:30:00Z'},
             {**base,'id':'held','status':'held'},{**base,'id':'missing','url':None}]
    report=community.watchlist(datetime(2026,11,9,5,tzinfo=timezone.utc),entries)
    assert [p['id'] for p in report['posts']]==['yt-map']
