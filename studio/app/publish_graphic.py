"""Publish an approved single image through the existing queue, identities and API clients.

Dry runs make only identity/hosting GETs. A durable attempt marker prevents blind retries
after an ambiguous response. These entries have no reel sound grace window.
"""
import hashlib
import json
import time
from contextlib import nullcontext
from pathlib import Path
from urllib.parse import unquote, urlparse

import httpx

from app import dm_rules, instagram_tokens
from app import publish_instagram as ig, publish_facebook as fb, publish_linkedin as li

ROOT = Path(__file__).resolve().parents[2]
GRAPHICS = ROOT / 'studio/.local/graphics'
LANES = ('instagram_image', 'facebook_image', 'linkedin_image')


def validate(entry, package):
    platform = entry['platform'].removesuffix('_image')
    if entry['platform'] not in LANES:
        raise ValueError('Unsupported single-image destination')
    if not package.get('owner_approved') or not package.get('publishing_authorized'):
        raise ValueError('Graphic has no owner publication approval')
    if entry['caption'] != package['platform_copy'][platform]:
        raise ValueError('Queued copy differs from the approved package')
    image = Path(package['source_image'])
    if hashlib.sha256(image.read_bytes()).hexdigest() != package['image_sha256']:
        raise ValueError('Approved graphic changed; refusing publication')
    if entry['resource_url'] != package['guide_url'] or entry['keyword'] != package['keyword']:
        raise ValueError('Queued guide or keyword differs from approval')
    rules = dm_rules.load()['rules']
    rule = next((r for r in rules if r['keyword'] == entry['keyword']), None)
    if not rule or rule['link'] != entry['resource_url'] or rule.get('media_ids'):
        raise ValueError('The shared keyword rule is missing, mismatched or restricted to other posts')
    return image


def publish(entry, *, live=False, transport=None, sleep=time.sleep):
    slug = entry['graphic']
    if not slug or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in slug):
        raise ValueError('Invalid graphic slug')
    folder = GRAPHICS / slug
    package = json.loads((folder / 'package.json').read_text())
    image = validate(entry, package)
    state_path = folder / (entry['platform'] + '.json')
    with li._exclusive(state_path) if live else nullcontext():
        state = li._load_state(state_path)
        if state.get('status') == 'published':
            return {**state['result'], 'status': 'already_published'}
        if state.get('attempt'):
            raise RuntimeError('Earlier image publish outcome is uncertain; verify the account before retrying')
        key = hashlib.sha256(json.dumps([package['image_sha256'], entry['caption'], entry['platform']],
                                       ensure_ascii=False).encode()).hexdigest()
        if state.get('input_key') not in (None, key):
            raise ValueError('Publish state belongs to different image or copy')
        state['input_key'] = key
        with httpx.Client(transport=transport, timeout=30, follow_redirects=True) as public:
            response = public.get(entry['resource_url'])
            if response.status_code != 200:
                raise ValueError(f'Guide is not live: HTTP {response.status_code}')
        fn = {'instagram_image': _instagram, 'facebook_image': _facebook, 'linkedin_image': _linkedin}[entry['platform']]
        return fn(entry, package, image, state, state_path, live, transport, sleep)


def _attempt(state, path):
    state['attempt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    li._save_state(path, state)


def _finish(state, path, **result):
    result = {'status': 'published', **result}
    state.update(status='published', result=result)
    state.pop('attempt', None)
    li._save_state(path, state)
    return result


def _instagram(e, p, image, state, path, live, transport, sleep):
    caption = ig.caption_for({'captions': {'instagram': e['caption']}})
    token = ig.load_credentials(instagram_tokens.account_file('withhammad.ai'))['access_token']
    client = ig.InstagramClient(token, transport=transport)
    try:
        steps = ig._Steps(client, live)
        report = {'warnings': [], 'blockers': []}
        identity = ig._identity_and_quota(steps, client, 'withhammad.ai', {}, report, live)
        url = p['jpeg_url']
        ig._check_public_url(url, 'image_url', 'image')
        ig.check_public_image(client, url, p['jpeg_bytes'])
        if not live:
            return {'status': 'planned', 'identity': identity, 'collaborators': e['collaborators'],
                    'kind': 'single_image', 'blockers': report['blockers']}
        if not state.get('container_id'):
            body = {'image_url': url, 'caption': caption, 'alt_text': p['alt'],
                    'collaborators': e['collaborators'], 'is_ai_generated': True}
            created = client.call('POST', client.path(identity['ig_user_id'], 'media'), 'create_image', json_body=body)
            state['container_id'] = str(created['id'])
            li._save_state(path, state)
        cid = state['container_id']
        for _ in range(12):
            status = client.call('GET', client.path(cid), 'image_status', params={'fields':'status_code,status'})
            if status.get('status_code') == 'FINISHED': break
            if status.get('status_code') in ('ERROR', 'EXPIRED', 'PUBLISHED'):
                raise RuntimeError(f'Image container {cid}: {status}; inspect before retry')
            sleep(5)
        else: raise RuntimeError('Image container is still processing')
        _attempt(state, path)
        posted = client.call('POST', client.path(identity['ig_user_id'], 'media_publish'), 'publish_image', json_body={'creation_id':cid})
        mid = str(posted['id'])
        _finish(state, path, media_id=mid, url=None, collaborators=e['collaborators'])
        # Save the id before permalink lookup; a failed read must never cause another post.
        media = client.call('GET', client.path(mid), 'permalink', params={'fields':'id,permalink'})
        return _finish(state, path, media_id=mid, url=media.get('permalink'), collaborators=e['collaborators'])
    finally:
        client.close()


def _facebook(e, p, image, state, path, live, transport, sleep):
    caption = fb.caption_for({'captions': {'facebook':e['caption']}})
    creds = fb.load_credentials()
    client = fb.Client(creds['access_token'], transport)
    try:
        me = client.graph('GET','me',fields='id,name')
        if me.get('id') != fb.PAGE_ID:
            raise ValueError('Facebook token is not the approved Page')
        if not live: return {'status':'planned','identity':me,'kind':'single_image'}
        _attempt(state, path)
        posted = client.graph('POST',f'{fb.PAGE_ID}/photos',url=p['image_url'],caption=caption,
                              alt_text_custom=p['alt'],published='true')
        pid = str(posted.get('post_id') or posted['id'])
        return _finish(state,path,post_id=pid,photo_id=str(posted['id']),url='https://www.facebook.com/'+pid)
    finally:
        client.http.close()


def _linkedin(e, p, image, state, path, live, transport, sleep):
    caption = li.build_commentary({'captions': {'linkedin':e['caption']}})
    creds = li.load_credentials(li.CREDENTIALS_PATH)
    client = li.LinkedInClient(creds['access_token'], transport=transport)
    try:
        me = client.userinfo()
        if me.get('sub') != li.OWNER_SUB:
            raise ValueError('LinkedIn token is not Hammad Yousuf')
        if not live: return {'status':'planned','identity':{'sub':me['sub'],'name':me.get('name')},'kind':'single_image'}
        if not state.get('image_urn'):
            response = client.send('initialize_image','POST','https://api.linkedin.com/rest/images?action=initializeUpload',
                headers=client.rest_headers(True),json_body={'initializeUploadRequest':{'owner':li.author_urn()}},expect=(200,201))
            upload = response.json()['value']
            target = urlparse(upload['uploadUrl'])
            if target.scheme != 'https' or not target.hostname or not target.hostname.endswith('.linkedin.com'):
                raise ValueError('Unexpected LinkedIn upload host')
            client.send('upload_image','PUT',upload['uploadUrl'],headers={'Authorization':'Bearer '+creds['access_token'],
                'Content-Type':'application/octet-stream'},content=image.read_bytes(),expect=(200,201))
            state['image_urn'] = upload['image']
            li._save_state(path,state)
            # Free w_member_social is write-only for versioned image GETs. The upload is asynchronous.
            sleep(3)
        body = li.post_body(state['image_urn'],caption)
        body['content']['media']['altText'] = p['alt']
        _attempt(state,path)
        response = client.create_post(body)
        urn = unquote(response.headers.get('x-restli-id') or '')
        if not urn: raise RuntimeError('LinkedIn accepted the image post without an id; inspect before retry')
        result = _finish(state,path,post_urn=urn,url=li.post_url(urn))
        from app import linkedin_keyword as keyword
        watched=keyword.load_state()
        if not any(x['urn']==urn for x in watched['extra_posts']):
            watched['extra_posts'].append({'urn':urn,'url':result['url'],'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
            keyword.save_state(watched)
        return result
    finally:
        client.close()
