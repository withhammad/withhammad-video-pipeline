import json

import httpx
import pytest

from app import publish_facebook as fb

LESSON = {'captions': {'facebook': 'Own Facebook caption with https://withhammad.com/resources/x #AI'}}


@pytest.fixture
def cred(tmp_path):
    p = tmp_path / 'fb.json'
    p.write_text(json.dumps({'access_token': 'tok', 'page_id': fb.PAGE_ID,
                             'scopes': ['pages_show_list', 'pages_manage_posts', 'publish_video']}))
    return p


def transport(log, *, page_id=fb.PAGE_ID, statuses=None):
    statuses = list(statuses or [{'status': {'video_status': 'ready', 'publishing_phase': {'status': 'complete'}},
                                  'permalink_url': '/reel/123'}])

    def handler(request):
        log.append((request.method, request.url.host, request.url.path, dict(request.headers).get('file_url')))
        if request.url.path.endswith('/me'):
            return httpx.Response(200, json={'id': page_id, 'name': 'With Hammad AI'})
        if request.url.host == 'rupload.facebook.com':
            return httpx.Response(200, json={'success': True})
        if request.url.path.endswith('/video_reels'):
            return httpx.Response(200, json={'video_id': 'vid1', 'upload_url': 'https://rupload.facebook.com/x', 'success': True})
        if request.url.path.endswith('/vid1'):
            return httpx.Response(200, json=statuses.pop(0) if len(statuses) > 1 else statuses[0])
        return httpx.Response(404, json={'error': {'message': 'nope'}})
    return httpx.MockTransport(handler)


def test_dry_run_sends_only_identity(cred):
    log = []
    out = fb.publish('https://withhammad.com/media/reels/x.mp4', LESSON, credential=cred, transport=transport(log))
    assert out['status'] == 'planned' and out['warnings'] == []
    assert [p for _, _, p, _ in log] == [f'/{fb.API_VERSION}/me']


def test_dry_run_warns_without_publish_scopes(tmp_path):
    p = tmp_path / 'fb.json'
    p.write_text(json.dumps({'access_token': 'tok', 'scopes': ['pages_show_list']}))
    out = fb.publish('https://h/x.mp4', LESSON, credential=p, transport=transport([]))
    assert 'pages_manage_posts' in out['warnings'][0]
    with pytest.raises(fb.FacebookPublishError, match='lacks'):
        fb.publish('https://h/x.mp4', LESSON, dry_run=False, state_path=tmp_path / 's.json', credential=p, transport=transport([]))


def test_live_publishes_once_and_resumes(cred, tmp_path):
    log = []
    state = tmp_path / 'state.json'
    out = fb.publish('https://h/x.mp4', LESSON, dry_run=False, state_path=state, credential=cred, transport=transport(log),
                     sleep=lambda s: None)
    assert out['status'] == 'published' and out['permalink'] == 'https://www.facebook.com/reel/123'
    assert [h for _, h, _, _ in log].count('rupload.facebook.com') == 1 and log[2][3] == 'https://h/x.mp4'
    again = fb.publish('https://h/x.mp4', LESSON, dry_run=False, state_path=state, credential=cred, transport=transport(log),
                       sleep=lambda s: None)
    assert again['status'] == 'already_published' and again['video_id'] == 'vid1'


def test_identity_mismatch_refuses(tmp_path, cred):
    with pytest.raises(fb.FacebookPublishError, match='not With Hammad AI'):
        fb.publish('https://h/x.mp4', LESSON, credential=cred, transport=transport([], page_id='999'))


def test_processing_error_raises(cred, tmp_path):
    bad = [{'status': {'video_status': 'error', 'publishing_phase': {'status': 'error'}}}]
    with pytest.raises(fb.FacebookPublishError, match='processing failed'):
        fb.publish('https://h/x.mp4', LESSON, dry_run=False, state_path=tmp_path / 's.json', credential=cred,
                   transport=transport([], statuses=bad), sleep=lambda s: None)
