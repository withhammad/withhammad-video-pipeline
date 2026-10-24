import json
import os
import shutil
import struct
import subprocess

import httpx
import pytest

from app import publish_instagram as ig

TOKEN = 'IGAAtestSECRETtoken0123456789'
IG_ID = '17841416366504874'
V = ig.API_VERSION
VIDEO_URL = 'https://media.example.test/reels/final.mp4'
LESSON = {'captions': {'instagram': 'Learn the pattern, build your own.\n\nComment BLUEPRINT.\n\n#claudecode #aitools'}}
CAPTION = LESSON['captions']['instagram']


def box(kind, payload=b''):
    return struct.pack('>I4s', 8 + len(payload), kind.encode()) + payload


def write_mp4(path, moov_first=True, edit_list=False):
    moov = box('moov', box('trak', box('edts', box('elst', b'\0' * 8)) if edit_list else b''))
    mdat = box('mdat', b'\0' * 64)
    path.write_bytes(box('ftyp', b'isom\0\0\0\0') + (moov + mdat if moov_first else mdat + moov))
    return path


def probe_ok(**overrides):
    video = {'codec_type': 'video', 'codec_name': 'h264', 'width': 720, 'height': 1280, 'avg_frame_rate': '30/1',
             'pix_fmt': 'yuv420p', 'field_order': 'progressive', 'bit_rate': '2000000', 'sample_aspect_ratio': '1:1'}
    audio = {'codec_type': 'audio', 'codec_name': 'aac', 'sample_rate': '48000', 'channels': 2, 'bit_rate': '128000'}
    fmt = {'format_name': 'mov,mp4,m4a,3gp,3g2,mj2', 'duration': '21.867'}
    video.update(overrides.get('video', {}))
    audio.update(overrides.get('audio', {}))
    fmt.update(overrides.get('format', {}))
    return lambda path: {'streams': [video, audio], 'format': fmt}


@pytest.fixture
def video(tmp_path):
    return write_mp4(tmp_path / 'final.mp4')


class FakeProvider:
    def __init__(self, url=VIDEO_URL):
        self.url, self.hosted, self.released = url, [], []

    def describe(self, path):
        return self.url

    def url_for(self, path):
        self.hosted.append(str(path))
        return self.url

    def release(self, url):
        self.released.append(url)


class FakeMeta:
    """graph.instagram.com plus the public file host, recording every request."""

    def __init__(self, video_size, username='hammadagentic.ai', statuses=('IN_PROGRESS', 'FINISHED'), quota=(1, 100)):
        self.requests, self.video_size, self.username = [], video_size, username
        self.statuses, self.quota = list(statuses), quota
        self.overrides = {}

    def handler(self, request):
        self.requests.append(request)
        key = (request.method, request.url.path)
        if key in self.overrides:
            result = self.overrides[key]
            return result(request) if callable(result) else result
        if request.url.host == 'media.example.test':
            return httpx.Response(200, headers={'content-length': str(self.video_size), 'content-type': 'video/mp4'})
        if key == ('GET', f'/{V}/me'):
            return httpx.Response(200, json={'user_id': IG_ID, 'username': self.username,
                                             'account_type': 'MEDIA_CREATOR', 'id': '2827'})
        if key == ('GET', f'/{V}/{IG_ID}/content_publishing_limit'):
            return httpx.Response(200, json={'data': [{'quota_usage': self.quota[0],
                                                       'config': {'quota_total': self.quota[1], 'quota_duration': 86400}}]})
        if key == ('POST', f'/{V}/{IG_ID}/media'):
            return httpx.Response(200, json={'id': 'C1'})
        if request.method == 'GET' and request.url.path.startswith(f'/{V}/C'):
            status = self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]
            return httpx.Response(200, json={'id': request.url.path.rsplit('/', 1)[1], 'status_code': status,
                                             'status': status})
        if key == ('POST', f'/{V}/{IG_ID}/media_publish'):
            return httpx.Response(200, json={'id': 'M1'})
        if key == ('GET', f'/{V}/M1'):
            return httpx.Response(200, json={'id': 'M1', 'permalink': 'https://www.instagram.com/reel/ABC/',
                                             'shortcode': 'ABC', 'timestamp': '2026-10-17T13:00:00+0000'})
        return httpx.Response(404, json={'error': {'message': f'unexpected {key}', 'type': 'Test', 'code': 1}})

    def calls(self):
        return [(r.method, r.url.host, r.url.path) for r in self.requests]

    def writes(self):
        return [c for c in self.calls() if c[0] not in ('GET', 'HEAD')]


def run(video, meta, **kwargs):
    kwargs.setdefault('probe', probe_ok())
    kwargs.setdefault('sleep', lambda s: None)
    return ig.publish(video, LESSON, token=TOKEN, transport=httpx.MockTransport(meta.handler), **kwargs)


def test_dry_run_sends_only_gets_and_returns_the_ordered_plan(video, tmp_path):
    meta, provider = FakeMeta(video.stat().st_size), FakeProvider()
    state = tmp_path / 'ig_state.json'
    plan = run(video, meta, url_provider=provider, state_path=state)  # dry_run defaults to True
    assert meta.writes() == [] and provider.hosted == [] and not state.exists()
    assert [c[2] for c in meta.calls()] == [f'/{V}/me', f'/{V}/{IG_ID}/content_publishing_limit']
    assert plan['dry_run'] is True and plan['status'] == 'planned' and plan['blockers'] == []
    steps = [(r['step'], r['method'], r.get('executed')) for r in plan['requests']]
    assert steps == [('identity', 'GET', True), ('publishing_limit', 'GET', True), ('host_video', 'HOST', False),
                     ('check_public_url', 'HEAD', False), ('create_container', 'POST', False),
                     ('container_status', 'GET', False), ('publish', 'POST', False), ('permalink', 'GET', False)]
    create = plan['requests'][4]
    assert create['url'] == f'https://graph.instagram.com/{V}/{IG_ID}/media'
    assert create['json'] == {'media_type': 'REELS', 'video_url': VIDEO_URL, 'caption': CAPTION,
                              'share_to_feed': True, 'is_ai_generated': True,
                              'collaborators': ['with.hammad']}
    assert create['headers']['Authorization'] == 'Bearer <redacted>' and create['file_size'] == video.stat().st_size
    assert plan['requests'][6]['json'] == {'creation_id': '<IG_CONTAINER_ID>'}
    assert plan['account'] == {'username': 'hammadagentic.ai', 'ig_user_id': IG_ID, 'account_type': 'MEDIA_CREATOR'}
    assert plan['publishing_limit'] == {'quota_usage': 1, 'quota_total': 100, 'quota_duration_s': 86400}
    assert TOKEN not in json.dumps(plan)


@pytest.mark.parametrize('flag', [True, None, 0, 'no', 'false'])
def test_only_dry_run_false_can_write(video, flag):
    meta, provider = FakeMeta(video.stat().st_size), FakeProvider()
    run(video, meta, url_provider=provider, dry_run=flag)
    assert meta.writes() == [] and provider.hosted == [] and provider.released == []
    assert all(c[1] == 'graph.instagram.com' for c in meta.calls())  # not even the HEAD on the file host


def test_dry_run_without_provider_reports_the_hosting_blocker(video):
    meta = FakeMeta(video.stat().st_size)
    plan = run(video, meta)
    assert plan['status'] == 'blocked' and 'public HTTPS URL' in plan['blockers'][0]
    assert [r['step'] for r in plan['requests']][2:5] == ['host_video', 'check_public_url', 'create_container']
    assert plan['requests'][4]['json']['video_url'] == '<PUBLIC_HTTPS_VIDEO_URL>' and meta.writes() == []


def test_happy_path_sequence_bodies_and_state(video, tmp_path):
    meta, provider, slept = FakeMeta(video.stat().st_size), FakeProvider(), []
    state_path = tmp_path / 'ig_state.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=provider, sleep=slept.append,
                 poll_seconds=7)
    assert meta.calls() == [
        ('GET', 'graph.instagram.com', f'/{V}/me'),
        ('GET', 'graph.instagram.com', f'/{V}/{IG_ID}/content_publishing_limit'),
        ('HEAD', 'media.example.test', '/reels/final.mp4'),
        ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media'),
        ('GET', 'graph.instagram.com', f'/{V}/C1'),
        ('GET', 'graph.instagram.com', f'/{V}/C1'),
        ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish'),
        ('GET', 'graph.instagram.com', f'/{V}/M1')]
    reqs = meta.requests
    assert all(r.headers['authorization'] == f'Bearer {TOKEN}' for r in reqs if r.url.host == 'graph.instagram.com')
    assert 'authorization' not in reqs[2].headers  # the token never goes to the file host
    assert all('access_token' not in str(r.url) for r in reqs)
    assert json.loads(reqs[3].content) == {'media_type': 'REELS', 'video_url': VIDEO_URL, 'caption': CAPTION,
                                           'share_to_feed': True, 'is_ai_generated': True,
                              'collaborators': ['with.hammad']}
    assert json.loads(reqs[6].content) == {'creation_id': 'C1'}
    assert dict(reqs[0].url.params) == {'fields': 'user_id,username,account_type'}
    assert dict(reqs[4].url.params) == {'fields': 'id,status,status_code'}
    assert slept == [7]
    assert result['status'] == 'published' and result['media_id'] == 'M1'
    assert result['permalink'] == 'https://www.instagram.com/reel/ABC/' and result['container_id'] == 'C1'
    state = json.loads(state_path.read_text())
    assert state['status'] == 'published' and state['container_id'] == 'C1' and state['media_id'] == 'M1'
    assert state['video_url'] == VIDEO_URL and state['account']['ig_user_id'] == IG_ID
    assert provider.hosted == [str(video)] and provider.released == [VIDEO_URL]
    assert TOKEN not in state_path.read_text() and TOKEN not in json.dumps(result)


def test_state_is_saved_as_soon_as_the_container_id_exists(video, tmp_path):
    meta = FakeMeta(video.stat().st_size, statuses=('ERROR',))
    state_path = tmp_path / 'ig_state.json'
    with pytest.raises(ig.InstagramPublishError, match='container C1 is ERROR'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    state = json.loads(state_path.read_text())
    assert state['container_id'] == 'C1' and state['container_status'] == 'ERROR' and 'media_id' not in state
    # the rerun sees the dead container and makes a fresh one instead of publishing the broken one
    meta.statuses = ['ERROR', 'FINISHED']
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'id': 'C2'})
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert result['status'] == 'published' and result['container_id'] == 'C2'
    state = json.loads(state_path.read_text())
    assert state['previous_containers'][0]['id'] == 'C1' and state['container_id'] == 'C2'


def test_resume_finished_container_publishes_without_recreating(video, tmp_path):
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    state_path = tmp_path / 'ig_state.json'
    run(video, FakeMeta(video.stat().st_size), dry_run=False, state_path=state_path, url_provider=FakeProvider())
    state = json.loads(state_path.read_text())
    for key in ('media_id', 'permalink', 'shortcode', 'published_at'):
        state.pop(key, None)
    state['status'] = 'container_created'
    state_path.write_text(json.dumps(state))
    provider = FakeProvider()
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=provider)
    assert ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media') not in meta.calls()
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish')]
    assert provider.hosted == [] and result['media_id'] == 'M1' and result['resume']['status_code'] == 'FINISHED'


def test_already_published_state_returns_without_any_request(video, tmp_path):
    state_path = tmp_path / 'ig_state.json'
    state_path.write_text(json.dumps({'status': 'published', 'media_id': 'M9', 'container_id': 'C9',
                                      'permalink': 'https://www.instagram.com/reel/XYZ/'}))

    def explode(request):
        raise AssertionError(f'no request expected, got {request.method} {request.url}')
    result = ig.publish(video, LESSON, dry_run=False, state_path=state_path, token=TOKEN, probe=probe_ok(),
                        transport=httpx.MockTransport(explode), url_provider=FakeProvider())
    assert result['status'] == 'already_published' and result['media_id'] == 'M9' and result['requests'] == []


def test_lost_publish_response_is_reconciled_not_reposted(video, tmp_path):
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    state_path = tmp_path / 'ig_state.json'

    def drop(request):
        raise httpx.ReadTimeout('timed out', request=request)
    meta.overrides[('POST', f'/{V}/{IG_ID}/media_publish')] = drop
    with pytest.raises(ig.InstagramPublishError, match='outcome is unknown') as err:
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert TOKEN not in str(err.value)
    assert json.loads(state_path.read_text())['status'] == 'publishing'
    # Meta did publish it: the rerun finds the post by caption instead of calling media_publish again
    meta.requests.clear()
    meta.statuses = ['PUBLISHED']
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M0', 'caption': 'older post', 'permalink': 'https://www.instagram.com/reel/OLD/'},
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/',
         'timestamp': '2026-10-17T13:00:00+0000'}]})
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert meta.writes() == [] and result['status'] == 'already_published' and result['media_id'] == 'M7'
    assert json.loads(state_path.read_text())['media_id'] == 'M7'


def test_identity_mismatch_aborts_before_any_write(video, tmp_path):
    meta, provider = FakeMeta(video.stat().st_size, username='with.hammad'), FakeProvider()
    state_path = tmp_path / 'ig_state.json'
    with pytest.raises(ig.IdentityMismatchError, match='@with.hammad, expected @hammadagentic.ai'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=provider)
    assert meta.calls() == [('GET', 'graph.instagram.com', f'/{V}/me')]
    assert provider.hosted == [] and not state_path.exists()


def test_state_from_another_account_aborts(video, tmp_path):
    state_path = tmp_path / 'ig_state.json'
    state_path.write_text(json.dumps({'account': {'username': 'x', 'ig_user_id': '999'}, 'container_id': 'C5'}))
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.IdentityMismatchError, match='different Instagram account'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert meta.writes() == []


def test_api_error_surfaces_code_subcode_message_and_hint(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(400, json={'error': {
        'message': 'The media could not be fetched from this uri', 'type': 'OAuthException', 'code': 9004,
        'error_subcode': 2207052, 'error_user_title': 'Media download has failed.',
        'error_user_msg': 'The media could not be fetched.', 'fbtrace_id': 'AbC123'}})
    with pytest.raises(ig.InstagramPublishError) as err:
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider())
    text = str(err.value)
    assert err.value.code == 9004 and err.value.subcode == 2207052 and err.value.http_status == 400
    assert err.value.step == 'create_container' and err.value.fbtrace_id == 'AbC123'
    assert 'code 9004/2207052' in text and 'could not be fetched from this uri' in text and 'public HTTPS' in text
    assert ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish') not in meta.calls()


def test_token_never_appears_in_errors(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    meta.overrides[('GET', f'/{V}/me')] = httpx.Response(400, json={'error': {
        'message': f'Invalid OAuth access token - Cannot parse access token {TOKEN}', 'type': 'OAuthException',
        'code': 190, 'fbtrace_id': 'T1'}})
    with pytest.raises(ig.InstagramPublishError) as err:
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider())
    assert TOKEN not in str(err.value) and '<redacted>' in str(err.value) and 'redo the Instagram OAuth' in str(err.value)
    assert err.value.code == 190

    def boom(request):
        raise httpx.ConnectError(f'cannot connect, Authorization: Bearer {TOKEN}', request=request)
    meta.overrides[('GET', f'/{V}/me')] = boom
    with pytest.raises(ig.InstagramPublishError) as err:
        run(video, meta, url_provider=FakeProvider())
    assert TOKEN not in str(err.value) and err.value.retriable is True
    assert TOKEN not in repr(err.value.__cause__) and err.value.__suppress_context__


def test_publishing_limit_reached_blocks_before_writes(video, tmp_path):
    meta, provider = FakeMeta(video.stat().st_size, quota=(100, 100)), FakeProvider()
    with pytest.raises(ig.PublishingLimitError, match='100/100'):
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=provider)
    assert meta.writes() == [] and provider.hosted == []
    plan = run(video, FakeMeta(video.stat().st_size, quota=(100, 100)), url_provider=provider)
    assert plan['status'] == 'blocked' and '100/100' in plan['blockers'][0]


def test_live_publish_needs_state_path_and_a_provider(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.InstagramPublishError, match='needs a state_path'):
        run(video, meta, dry_run=False, url_provider=FakeProvider())
    assert meta.requests == []
    with pytest.raises(ig.InstagramPublishError, match='public HTTPS URL'):
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json')
    assert meta.writes() == []


def test_unreachable_public_url_stops_before_the_container(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    meta.overrides[('HEAD', '/reels/final.mp4')] = httpx.Response(404)
    with pytest.raises(ig.InstagramPublishError, match='answered HTTP 404'):
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider())
    assert meta.writes() == []
    with pytest.raises(ig.InstagramPublishError, match='https://'):
        ig.StaticUrlProvider('http://127.0.0.1:8080/final.mp4')


@pytest.mark.parametrize('overrides, message', [
    ({'video': {'codec_name': 'vp9'}}, 'not H.264/HEVC'),
    ({'video': {'width': 1280, 'height': 720}}, 'not 9:16'),
    ({'audio': {'codec_name': 'opus'}}, 'not AAC'),
    ({'format': {'duration': '2.5'}}, 'outside 3 s to 15 min'),
    ({'video': {'avg_frame_rate': '15/1'}}, 'outside 23-60 fps'),
    ({'format': {'format_name': 'matroska,webm'}}, 'not MP4/MOV'),
])
def test_invalid_video_fails_before_any_request(video, overrides, message):
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.VideoValidationError, match=message):
        run(video, meta, probe=probe_ok(**overrides), url_provider=FakeProvider())
    assert meta.requests == []


def test_moov_after_mdat_fails_and_edit_lists_warn(tmp_path):
    with pytest.raises(ig.VideoValidationError, match='faststart'):
        ig.validate_video(write_mp4(tmp_path / 'late.mp4', moov_first=False), probe=probe_ok())
    summary = ig.validate_video(write_mp4(tmp_path / 'el.mp4', edit_list=True), probe=probe_ok())
    assert summary['moov_first'] is True and summary['edit_lists'] is True
    assert any('edit lists' in w for w in summary['warnings'])


def test_caption_limits():
    with pytest.raises(ig.InstagramPublishError, match='31 hashtags'):
        ig.caption_for({'captions': {'instagram': ' '.join(f'#t{i}' for i in range(31))}})
    with pytest.raises(ig.InstagramPublishError, match='empty'):
        ig.caption_for({'captions': {}})
    assert ig.caption_for(LESSON) == CAPTION


def test_credentials_file_checks(tmp_path):
    path = tmp_path / 'creds.json'
    path.write_text(json.dumps({'access_token': TOKEN, 'scopes': ['instagram_business_basic']}))
    with pytest.raises(ig.InstagramPublishError, match='instagram_business_content_publish') as err:
        ig.load_credentials(path)
    assert TOKEN not in str(err.value)
    with pytest.raises(ig.InstagramPublishError, match='missing'):
        ig.load_credentials(tmp_path / 'nope.json')


@pytest.mark.skipif(not (shutil.which('ffmpeg') and shutil.which('ffprobe')), reason='ffmpeg not installed')
def test_real_ffprobe_accepts_a_reel_shaped_file(tmp_path):
    out = tmp_path / 'clip.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=white:s=720x1280:r=30:d=3.5',
                    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=3.5',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest',
                    '-movflags', '+faststart', str(out)], check=True, timeout=60)
    summary = ig.validate_video(out)
    assert summary['video_codec'] == 'h264' and summary['audio_codec'] == 'aac'
    assert (summary['width'], summary['height']) == (720, 1280) and summary['moov_first'] is True


def _lost_publish_state(video, tmp_path):
    """A live run whose media_publish response was lost: the state says 'publishing' with container C1."""
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    state_path = tmp_path / 'ig_state.json'

    def drop(request):
        raise httpx.ReadTimeout('timed out', request=request)
    meta.overrides[('POST', f'/{V}/{IG_ID}/media_publish')] = drop
    with pytest.raises(ig.InstagramPublishError, match='outcome is unknown'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    return state_path


@pytest.mark.parametrize('dry_run', [False, True])
def test_changed_caption_after_lost_publish_never_posts_twice(video, tmp_path, dry_run):
    state_path = _lost_publish_state(video, tmp_path)
    meta = FakeMeta(video.stat().st_size, statuses=('PUBLISHED',))  # Meta did publish C1
    provider = FakeProvider()
    lesson = {'captions': {'instagram': CAPTION + ' (edited)'}}
    with pytest.raises(ig.InstagramPublishError, match='already PUBLISHED; nothing was posted again'):
        ig.publish(video, lesson, dry_run=dry_run, state_path=state_path, token=TOKEN, probe=probe_ok(),
                   sleep=lambda s: None, transport=httpx.MockTransport(meta.handler), url_provider=provider)
    assert meta.writes() == [] and provider.hosted == []
    assert json.loads(state_path.read_text())['container_id'] == 'C1'


def test_changed_caption_with_unpublished_container_makes_a_new_one(video, tmp_path):
    state_path = _lost_publish_state(video, tmp_path)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))  # C1 was never published
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'id': 'C2'})
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M0', 'caption': 'older post'}]})
    lesson = {'captions': {'instagram': CAPTION + ' (edited)'}}
    result = ig.publish(video, lesson, dry_run=False, state_path=state_path, token=TOKEN, probe=probe_ok(),
                        sleep=lambda s: None, transport=httpx.MockTransport(meta.handler), url_provider=FakeProvider())
    assert result['status'] == 'published' and result['container_id'] == 'C2'
    state = json.loads(state_path.read_text())
    assert state['previous_containers'][0]['id'] == 'C1' and 'superseded' in state['previous_containers'][0]['reason']
    # the unknown outcome of the first media_publish is checked first, even though the caption changed
    assert ('GET', 'graph.instagram.com', f'/{V}/{IG_ID}/media') in meta.calls()
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media'),
                             ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish')]


def test_changed_caption_after_a_lost_publish_that_went_through_is_not_posted_again(video, tmp_path):
    state_path = _lost_publish_state(video, tmp_path)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))   # the status lags; the post is on the profile
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/'}]})
    lesson = {'captions': {'instagram': CAPTION + ' (edited)'}}
    result = ig.publish(video, lesson, dry_run=False, state_path=state_path, token=TOKEN, probe=probe_ok(),
                        sleep=lambda s: None, transport=httpx.MockTransport(meta.handler), url_provider=FakeProvider())
    assert meta.writes() == [] and result['status'] == 'already_published' and result['media_id'] == 'M7'
    assert any('was not posted' in w for w in result['warnings'])


def test_unknown_outcome_finds_the_post_even_if_container_status_lags(video, tmp_path):
    state_path = _lost_publish_state(video, tmp_path)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))  # status not yet PUBLISHED, but the post exists
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/'}]})
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert meta.writes() == [] and result['status'] == 'already_published' and result['media_id'] == 'M7'
    assert json.loads(state_path.read_text())['status'] == 'published'


def test_unknown_outcome_republishes_when_no_post_exists(video, tmp_path):
    state_path = _lost_publish_state(video, tmp_path)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M0', 'caption': 'older post'}]})
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish')]
    assert result['status'] == 'published' and result['container_id'] == 'C1'


def test_a_second_live_run_on_the_same_state_is_refused(video, tmp_path):
    state_path = tmp_path / 'ig_state.json'
    lock = tmp_path / 'ig_state.json.lock'
    lock.write_text(str(os.getpid()))  # a live process holds it
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.InstagramPublishError, match='another publish run'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert meta.requests == [] and lock.exists()
    plan = run(video, meta, state_path=state_path, url_provider=FakeProvider())  # a dry run does not need the lock
    assert plan['status'] == 'planned'
    dead = subprocess.Popen(['true'])
    dead.wait()
    lock.write_text(str(dead.pid))  # left behind by a crashed run
    result = run(video, FakeMeta(video.stat().st_size), dry_run=False, state_path=state_path,
                 url_provider=FakeProvider())
    assert result['status'] == 'published' and not lock.exists()


def test_thumb_offset_outside_the_video_fails_before_any_request(video):
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.InstagramPublishError, match='thumb_offset_ms 30000'):
        run(video, meta, url_provider=FakeProvider(), thumb_offset_ms=30000)
    assert meta.requests == []
    plan = run(video, meta, url_provider=FakeProvider(), thumb_offset_ms=1500)
    assert plan['requests'][4]['json']['thumb_offset'] == 1500


def test_html_page_at_the_video_url_stops_before_the_container(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    meta.overrides[('HEAD', '/reels/final.mp4')] = httpx.Response(200, headers={'content-type': 'text/html'})
    with pytest.raises(ig.InstagramPublishError, match='served as text/html'):
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider())
    assert meta.writes() == []


def test_corrupt_state_file_is_a_readable_error(video, tmp_path):
    state_path = tmp_path / 'ig_state.json'
    state_path.write_text('{not json')
    with pytest.raises(ig.InstagramPublishError, match='not valid JSON'):
        run(video, FakeMeta(video.stat().st_size), dry_run=False, state_path=state_path, url_provider=FakeProvider())
    assert not (tmp_path / 'ig_state.json.lock').exists()


def test_resolve_collaborators_defaults_to_the_other_owner_account():
    assert ig.resolve_collaborators(None, 'with.hammad') == ['hammadagentic.ai']
    assert ig.resolve_collaborators(None, '@Hammadagentic.ai') == ['with.hammad']
    assert ig.resolve_collaborators(None, 'someone.else') == []


def test_resolve_collaborators_explicit_lists_are_cleaned():
    assert ig.resolve_collaborators([], 'with.hammad') == []          # explicit opt-out
    assert ig.resolve_collaborators(['@a', ' A ', 'b', '', '@with.hammad'], 'with.hammad') == ['a', 'b']
    with pytest.raises(ig.InstagramPublishError, match='at most 3 collaborators'):
        ig.resolve_collaborators(['a', 'b', 'c', 'd'], 'with.hammad')


def test_default_collab_lands_in_the_container_body(video):
    meta, provider = FakeMeta(video.stat().st_size, username='with.hammad'), FakeProvider()
    plan = run(video, meta, dry_run=True, url_provider=provider, expected_username='with.hammad')
    create = next(r for r in plan['requests'] if r['step'] == 'create_container')
    assert create['json']['collaborators'] == ['hammadagentic.ai']
    assert plan['collaborators'] == ['hammadagentic.ai'] and meta.writes() == []


def test_empty_collaborators_list_posts_without_collab(video):
    meta, provider = FakeMeta(video.stat().st_size), FakeProvider()
    plan = run(video, meta, dry_run=True, url_provider=provider, collaborators=[])
    create = next(r for r in plan['requests'] if r['step'] == 'create_container')
    assert 'collaborators' not in create['json'] and plan['collaborators'] == []



# ---------------------------------------------------------------- cover_url

COVER_URL = 'https://media.example.test/covers/blueprint.jpg'


@pytest.fixture
def cover(tmp_path):
    path = tmp_path / 'cover_1080x1920.jpg'
    path.write_bytes(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00' + bytes(range(256)) * 4 + b'\xff\xd9')
    return path


def serve_cover(meta, size, content_type='image/jpeg', status=200):
    meta.overrides[('HEAD', '/covers/blueprint.jpg')] = httpx.Response(
        status, headers={'content-type': content_type, 'content-length': str(size)})


def test_cover_url_is_hosted_head_checked_and_sent_in_the_container(video, cover, tmp_path):
    meta, provider, cover_host = FakeMeta(video.stat().st_size), FakeProvider(), FakeProvider(COVER_URL)
    serve_cover(meta, cover.stat().st_size)
    state_path = tmp_path / 'ig_state.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=provider, cover_url=cover_host,
                 cover_path=cover)
    calls = meta.calls()
    head = calls.index(('HEAD', 'media.example.test', '/covers/blueprint.jpg'))
    assert head < calls.index(('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media'))
    assert 'authorization' not in meta.requests[head].headers   # the token never goes to the file host
    create = next(r for r in meta.requests if r.method == 'POST' and r.url.path.endswith('/media'))
    body = json.loads(create.content)
    assert body['cover_url'] == COVER_URL and 'thumb_offset' not in body and body['video_url'] == VIDEO_URL
    assert cover_host.hosted == [str(cover)] and result['status'] == 'published'
    assert result['cover']['url'] == COVER_URL and result['cover']['size'] == cover.stat().st_size
    state = json.loads(state_path.read_text())
    assert state['cover_url'] == COVER_URL and state['cover_key'] == ig.validate_cover(cover)['sha256']
    assert TOKEN not in json.dumps(result) and TOKEN not in state_path.read_text()


def test_dry_run_lists_the_cover_and_drops_thumb_offset_with_a_warning(video, cover):
    meta = FakeMeta(video.stat().st_size)
    plan = run(video, meta, url_provider=FakeProvider(), cover_url=COVER_URL, cover_path=cover, thumb_offset_ms=1500)
    assert meta.writes() == [] and all(c[1] == 'graph.instagram.com' for c in meta.calls())
    steps = [(r['step'], r['method'], r.get('executed')) for r in plan['requests']]
    assert ('host_cover', 'HOST', False) in steps and ('check_cover_url', 'HEAD', False) in steps
    check = next(r for r in plan['requests'] if r['step'] == 'check_cover_url')
    assert check['expect'] == {'status': 200, 'content_type': 'image/jpeg', 'max_bytes': 8_000_000,
                               'content_length': cover.stat().st_size}
    create = next(r for r in plan['requests'] if r['step'] == 'create_container')
    assert create['json']['cover_url'] == COVER_URL and 'thumb_offset' not in create['json']
    assert any('thumb_offset_ms 1500 dropped' in w for w in plan['warnings'])


@pytest.mark.parametrize('url', ['http://media.example.test/covers/blueprint.jpg', 'https://localhost/c.jpg', ''])
def test_cover_url_must_be_public_https(video, cover, url):
    meta = FakeMeta(video.stat().st_size)
    with pytest.raises(ig.InstagramPublishError, match='cover_url') as error:
        run(video, meta, url_provider=FakeProvider(), cover_url=url or 'ftp://x', cover_path=cover,
            cover_required=True)
    assert error.value.step == 'host_cover' and meta.requests == []
    plan = run(video, meta, url_provider=FakeProvider(), cover_url=url or 'ftp://x', cover_path=cover)
    create = next(r for r in plan['requests'] if r['step'] == 'create_container')
    assert 'cover_url' not in create['json'] and plan['status'] == 'planned' and plan['cover']['status'] == 'dropped'
    assert any(w.startswith('Instagram cover dropped') and 'cover_url' in w for w in plan['warnings'])


@pytest.mark.parametrize('content_type, size, message', [('image/png', 1000, 'served as image/png'),
                                                         ('image/jpeg', 9_000_000, '8 MB'),
                                                         ('image/jpeg', 12, 'local file is')])
def test_cover_head_check_stops_before_the_container(video, cover, tmp_path, content_type, size, message):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, size, content_type)
    with pytest.raises(ig.InstagramPublishError, match=message) as error:
        run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider(),
            cover_url=COVER_URL, cover_path=cover, cover_required=True)
    assert error.value.step == 'check_cover_url' and meta.writes() == []


@pytest.mark.parametrize('content_type, size, message', [('image/png', 1000, 'served as image/png'),
                                                         ('image/jpeg', 12, 'local file is')])
def test_failed_cover_check_posts_without_the_cover_and_restores_thumb_offset(video, cover, tmp_path, content_type,
                                                                             size, message):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, size, content_type)
    state_path = tmp_path / 's.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(),
                 cover_url=COVER_URL, cover_path=cover, thumb_offset_ms=1500)
    create = next(r for r in meta.requests if r.method == 'POST' and r.url.path.endswith('/media'))
    body = json.loads(create.content)
    assert 'cover_url' not in body and body['thumb_offset'] == 1500 and result['status'] == 'published'
    assert result['cover']['status'] == 'dropped' and message in result['cover']['error']
    dropped = [w for w in result['warnings'] if w.startswith('Instagram cover dropped')]
    assert len(dropped) == 1 and 'thumb_offset_ms 1500 picks the frame instead' in dropped[0]
    assert 'cover_key' not in json.loads(state_path.read_text())   # the container carries no cover


def test_cover_host_failure_posts_without_the_cover(video, cover, tmp_path):
    class BrokenHost(FakeProvider):
        def url_for(self, path):
            raise OSError('upload to https://bucket.example.test/c.jpg?X-Signature=SECRETSIG failed')
    meta = FakeMeta(video.stat().st_size)
    result = run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider(),
                 cover_url=BrokenHost(COVER_URL), cover_path=cover)
    assert result['status'] == 'published' and result['cover']['status'] == 'dropped'
    assert 'cover_url' not in json.loads(next(r for r in meta.requests if r.url.path.endswith('/media')).content)
    assert 'could not host the cover' in result['cover']['error'] and 'SECRETSIG' not in json.dumps(result)


def test_local_cover_must_be_a_jpeg_and_a_provider_needs_the_file(video, tmp_path):
    png = tmp_path / 'cover.png'
    png.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 40)
    jpeg = tmp_path / 'other.jpg'
    jpeg.write_bytes(b'\xff\xd8\xff\xe0' + b'1' * 64)
    meta = FakeMeta(video.stat().st_size)
    cases = [('not a JPEG', {'cover_url': COVER_URL, 'cover_path': png}),
             ('pass cover_path', {'cover_url': FakeProvider(COVER_URL)}),
             ('without cover_url', {'cover_path': jpeg})]
    for message, cover_options in cases:
        with pytest.raises(ig.InstagramPublishError, match=message):
            run(video, meta, url_provider=FakeProvider(), cover_required=True, **cover_options)
    assert meta.requests == []
    for message, cover_options in cases:   # by default: a warning, and the plan has no cover
        plan = run(video, meta, url_provider=FakeProvider(), **cover_options)
        create = next(r for r in plan['requests'] if r['step'] == 'create_container')
        assert 'cover_url' not in create['json'] and any(message in w for w in plan['warnings'])
    assert meta.writes() == []


def test_static_cover_url_without_local_file_is_still_head_checked(video, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, 180_000)
    result = run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=FakeProvider(),
                 cover_url=COVER_URL)
    assert ('HEAD', 'media.example.test', '/covers/blueprint.jpg') in meta.calls()
    create = next(r for r in meta.requests if r.method == 'POST' and r.url.path.endswith('/media'))
    assert json.loads(create.content)['cover_url'] == COVER_URL and result['status'] == 'published'
    assert json.loads((tmp_path / 's.json').read_text())['cover_key'] == f'url:{COVER_URL}'


def test_changed_cover_with_unpublished_container_makes_a_new_one(video, cover, tmp_path):
    state_path = tmp_path / 'ig_state.json'
    meta = FakeMeta(video.stat().st_size, statuses=('ERROR',))
    serve_cover(meta, cover.stat().st_size)
    with pytest.raises(ig.InstagramPublishError, match='ERROR'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
            cover_path=cover, cover_required=True)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))   # C1 finished, but with the old cover
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'id': 'C2'})
    new_cover = tmp_path / 'cover_2.jpg'
    new_cover.write_bytes(cover.read_bytes() + b'\x00')
    serve_cover(meta, new_cover.stat().st_size)
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
                 cover_path=new_cover)
    assert result['container_id'] == 'C2' and result['status'] == 'published'
    state = json.loads(state_path.read_text())
    assert 'superseded' in state['previous_containers'][0]['reason']
    assert state['cover_key'] == ig.validate_cover(new_cover)['sha256']


# ---------------------------------------------------------------- cover: double-post guards, fallbacks, cleanup

def _lost_publish_with_cover(video, tmp_path, cover):
    """A live run with a cover whose media_publish response was lost: state 'publishing', container C1 FINISHED."""
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    serve_cover(meta, cover.stat().st_size)
    state_path = tmp_path / 'ig_state.json'

    def drop(request):
        raise httpx.ReadTimeout('timed out', request=request)
    meta.overrides[('POST', f'/{V}/{IG_ID}/media_publish')] = drop
    with pytest.raises(ig.InstagramPublishError, match='outcome is unknown'):
        run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
            cover_path=cover)
    assert json.loads(state_path.read_text())['status'] == 'publishing'
    return state_path


@pytest.mark.parametrize('change', ['same cover', 'new cover', 'state without cover_key'])
def test_lost_publish_then_a_changed_cover_never_posts_twice(video, cover, tmp_path, change):
    state_path = _lost_publish_with_cover(video, tmp_path, cover)
    new_cover = cover
    if change == 'new cover':   # the owner re-picks the cover (thumbnail build --pick 2) before the rerun
        new_cover = tmp_path / 'cover_2.jpg'
        new_cover.write_bytes(cover.read_bytes() + b'\x00')
    if change == 'state without cover_key':   # a state file written before covers existed
        state = json.loads(state_path.read_text())
        state.pop('cover_key')
        state_path.write_text(json.dumps(state))
    # Meta DID publish C1 (M7 is on the profile) but the container status still reads FINISHED (status lag)
    meta = FakeMeta(video.stat().st_size, statuses=('FINISHED',))
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/'}]})
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'id': 'C2'})
    serve_cover(meta, new_cover.stat().st_size)
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
                 cover_path=new_cover)
    assert meta.writes() == [] and result['status'] == 'already_published' and result['media_id'] == 'M7'
    state = json.loads(state_path.read_text())
    assert state['media_id'] == 'M7' and state['status'] == 'published' and state['container_id'] == 'C1'


def test_published_container_with_a_new_cover_is_reconciled_with_a_warning(video, cover, tmp_path):
    state_path = _lost_publish_with_cover(video, tmp_path, cover)
    new_cover = tmp_path / 'cover_2.jpg'
    new_cover.write_bytes(cover.read_bytes() + b'\x00')
    meta = FakeMeta(video.stat().st_size, statuses=('PUBLISHED',))
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/'}]})
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
                 cover_path=new_cover)
    assert meta.writes() == [] and result['media_id'] == 'M7'
    assert any("can't be changed by API" in w for w in result['warnings'])


def test_url_only_cover_key_and_logs_ignore_the_query_string(video, tmp_path):
    signed = COVER_URL + '?X-Amz-Signature=SECRETSIG&X-Amz-Expires=600'
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, 180_000)
    state_path = tmp_path / 's.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=signed)
    create = next(r for r in meta.requests if r.method == 'POST' and r.url.path.endswith('/media'))
    assert json.loads(create.content)['cover_url'] == signed            # Meta gets the full URL
    state = json.loads(state_path.read_text())
    assert state['cover_key'] == f'url:{COVER_URL}'
    assert 'SECRETSIG' not in json.dumps(result) and result['cover']['url'] == COVER_URL + '?<redacted>'
    plan = run(video, FakeMeta(video.stat().st_size), url_provider=FakeProvider(), cover_url=signed)
    assert 'SECRETSIG' not in json.dumps(plan)
    serve = FakeMeta(video.stat().st_size)
    serve.overrides[('HEAD', '/covers/blueprint.jpg')] = httpx.Response(404)
    with pytest.raises(ig.InstagramPublishError, match='answered HTTP 404') as error:
        run(video, serve, dry_run=False, state_path=tmp_path / 's2.json', url_provider=FakeProvider(),
            cover_url=signed, cover_required=True)
    assert 'SECRETSIG' not in str(error.value)


def test_meta_rejecting_cover_url_retries_the_container_without_it(video, cover, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, cover.stat().st_size)
    bodies = []

    def create(request):
        bodies.append(json.loads(request.content))
        if 'cover_url' in bodies[-1]:
            return httpx.Response(400, json={'error': {'message': 'Invalid parameter', 'type': 'OAuthException',
                                                       'code': 100, 'error_user_msg': 'cover_url is not supported'}})
        return httpx.Response(200, json={'id': 'C1'})
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = create
    state_path = tmp_path / 's.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
                 cover_path=cover, thumb_offset_ms=2000)
    assert [('cover_url' in b, b.get('thumb_offset')) for b in bodies] == [(True, None), (False, 2000)]
    assert result['status'] == 'published' and result['cover']['status'] == 'dropped'
    assert any('cover_url is not supported' in w for w in result['warnings'])
    assert 'cover_key' not in json.loads(state_path.read_text())
    # a token, limit or video-format error is not blamed on the cover: no second container request
    for code in (190, 9, 352):
        meta = FakeMeta(video.stat().st_size)
        serve_cover(meta, cover.stat().st_size)
        meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = httpx.Response(400, json={'error': {
            'message': 'nope', 'type': 'OAuthException', 'code': code}})
        with pytest.raises(ig.InstagramPublishError, match='nope'):
            run(video, meta, dry_run=False, state_path=tmp_path / f's{code}.json', url_provider=FakeProvider(),
                cover_url=COVER_URL, cover_path=cover)
        assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media')]
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, cover.stat().st_size)
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = create
    with pytest.raises(ig.InstagramPublishError, match='Invalid parameter'):   # strict: no fallback
        run(video, meta, dry_run=False, state_path=tmp_path / 'strict.json', url_provider=FakeProvider(),
            cover_url=COVER_URL, cover_path=cover, cover_required=True)


def test_container_error_with_a_cover_gets_one_more_container_without_it(video, cover, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, cover.stat().st_size)
    created = []

    def create(request):
        created.append(json.loads(request.content))
        return httpx.Response(200, json={'id': f'C{len(created)}'})

    def status(request):
        cid = request.url.path.rsplit('/', 1)[1]
        code = 'ERROR' if cid == 'C1' else 'FINISHED'
        return httpx.Response(200, json={'id': cid, 'status_code': code, 'status': f'{code}: test'})
    meta.overrides[('POST', f'/{V}/{IG_ID}/media')] = create
    meta.overrides[('GET', f'/{V}/C1')] = status
    meta.overrides[('GET', f'/{V}/C2')] = status
    state_path = tmp_path / 's.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=FakeProvider(), cover_url=COVER_URL,
                 cover_path=cover)
    assert ['cover_url' in body for body in created] == [True, False]
    assert result['status'] == 'published' and result['container_id'] == 'C2'
    state = json.loads(state_path.read_text())
    assert state['previous_containers'][0] == {**state['previous_containers'][0], 'id': 'C1',
                                               'reason': 'ERROR with cover_url; made again without the cover'}
    assert any('C1 is ERROR' in w for w in result['warnings']) and 'cover_key' not in state
    # without a cover (or with cover_required) an ERROR container still fails the run as before
    meta = FakeMeta(video.stat().st_size, statuses=('ERROR',))
    serve_cover(meta, cover.stat().st_size)
    with pytest.raises(ig.ContainerFailedError, match='ERROR'):
        run(video, meta, dry_run=False, state_path=tmp_path / 'strict.json', url_provider=FakeProvider(),
            cover_url=COVER_URL, cover_path=cover, cover_required=True)
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media')]


def test_hosted_cover_is_released_after_the_post(video, cover, tmp_path):
    meta, video_host, cover_host = FakeMeta(video.stat().st_size), FakeProvider(), FakeProvider(COVER_URL)
    serve_cover(meta, cover.stat().st_size)
    result = run(video, meta, dry_run=False, state_path=tmp_path / 's.json', url_provider=video_host,
                 cover_url=cover_host, cover_path=cover)
    assert video_host.released == [VIDEO_URL] and cover_host.released == [COVER_URL] and result['warnings'] == []

    class StuckHost(FakeProvider):
        def release(self, url):
            raise RuntimeError(f'cannot delete {url}?sig=SECRETSIG')
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, cover.stat().st_size)
    result = run(video, meta, dry_run=False, state_path=tmp_path / 's2.json', url_provider=FakeProvider(),
                 cover_url=StuckHost(COVER_URL), cover_path=cover)
    assert result['status'] == 'published'
    assert any('could not release the hosted cover' in w for w in result['warnings'])
    assert 'SECRETSIG' not in json.dumps(result)


def test_lost_publish_reconcile_releases_both_hosted_files(video, cover, tmp_path):
    state_path = _lost_publish_with_cover(video, tmp_path, cover)
    meta, video_host, cover_host = FakeMeta(video.stat().st_size, statuses=('PUBLISHED',)), FakeProvider(), \
        FakeProvider(COVER_URL)
    meta.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'M7', 'caption': CAPTION, 'permalink': 'https://www.instagram.com/reel/NEW/'}]})
    run(video, meta, dry_run=False, state_path=state_path, url_provider=video_host, cover_url=cover_host,
        cover_path=cover)
    assert video_host.released == [VIDEO_URL] and cover_host.released == [COVER_URL]


def test_stop_after_container_never_publishes(video, cover, tmp_path):
    meta = FakeMeta(video.stat().st_size)
    serve_cover(meta, cover.stat().st_size)
    state_path = tmp_path / 'cover_test.json'
    result = run(video, meta, dry_run=False, state_path=state_path, url_provider=VIDEO_URL, cover_url=COVER_URL,
                 cover_path=cover, stop_after='container')
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media')]
    assert result['status'] == 'container_ready' and result['container_id'] == 'C1'
    assert result['cover']['status'] == 'sent' and 'media_id' not in result
    state = json.loads(state_path.read_text())
    assert state['container_id'] == 'C1' and state['container_status'] == 'FINISHED' and 'media_id' not in state
    plan = run(video, FakeMeta(video.stat().st_size), url_provider=VIDEO_URL, cover_url=COVER_URL, cover_path=cover,
               stop_after='container')
    assert [r['step'] for r in plan['requests']][-1] == 'container_status' and plan['status'] == 'planned'
    with pytest.raises(ValueError, match='stop_after'):
        run(video, meta, stop_after='publish')


def test_cli_is_a_dry_run_and_live_only_stops_after_the_container(monkeypatch, tmp_path, capsys):
    lesson_path = tmp_path / 'lesson.json'
    lesson_path.write_text(json.dumps(LESSON))
    calls = []
    monkeypatch.setattr(ig, 'publish', lambda *a, **kw: calls.append((a, kw)) or {'status': 'planned'})
    base = ['final.mp4', str(lesson_path), '--video-url', VIDEO_URL, '--cover-url', COVER_URL, '--cover', 'c.jpg']
    assert ig.main(base) == 0
    assert calls[0][1]['dry_run'] is True and calls[0][1]['expected_username'] == 'with.hammad'
    assert calls[0][1]['credentials_path'].name == 'instagram-with-hammad-oauth.json'
    assert ig.main(base + ['--live', '--stop-after', 'container', '--state', 's.json']) == 0
    assert calls[1][1]['dry_run'] is False and calls[1][1]['stop_after'] == 'container'
    with pytest.raises(SystemExit):
        ig.main(base + ['--live'])   # the command line never posts a reel
    assert len(calls) == 2 and '"planned"' in capsys.readouterr().out


def test_short_reel_aac_overhead_is_not_an_audio_bitrate_warning(tmp_path):
    # app.exports encodes AAC at 128k; ffprobe reports ~135 kbps on a 10 s reel (priming and packet overhead)
    short = ig.validate_video(write_mp4(tmp_path / 'short.mp4'),
                              probe=probe_ok(audio={'bit_rate': '134916'}, format={'duration': '10.5'}))
    assert not any('audio bitrate' in w for w in short['warnings'])
    loud = ig.validate_video(write_mp4(tmp_path / 'loud.mp4'), probe=probe_ok(audio={'bit_rate': '192000'}))
    assert any('audio bitrate 192 kbps' in w for w in loud['warnings'])


def test_trial_reel_adds_trial_params_next_to_the_collab(video, tmp_path):
    meta, provider = FakeMeta(video.stat().st_size), FakeProvider()
    plan = run(video, meta, url_provider=provider, state_path=tmp_path / 's.json', trial='SS_PERFORMANCE')
    create = next(r for r in plan['requests'] if r['step'] == 'create_container')
    assert create['json']['trial_params'] == {'graduation_strategy': 'SS_PERFORMANCE'}
    assert create['json']['collaborators'] == ['with.hammad'] and plan['trial'] == 'SS_PERFORMANCE'
    plain = run(video, FakeMeta(video.stat().st_size), url_provider=FakeProvider(), state_path=tmp_path / 't.json')
    assert 'trial_params' not in next(r for r in plain['requests'] if r['step'] == 'create_container')['json']
    with pytest.raises(ValueError, match='trial must be one of'):
        run(video, meta, url_provider=provider, state_path=tmp_path / 'u.json', trial='AUTO')


# --- carousels --------------------------------------------------------------------------------------------------------

SLIDES = [f'https://img.example.test/carousels/ai-traffic-ga4/{i:02d}.jpg' for i in range(1, 4)]
SLIDE_SIZE = 4321


class FakeCarouselMeta(FakeMeta):
    """FakeMeta plus distinct child container ids (K1, K2, ...) and a JPEG image host."""

    def __init__(self, **kwargs):
        super().__init__(SLIDE_SIZE, **kwargs)
        self.children = 0
        self.image_type = 'image/jpeg'

    def handler(self, request):
        key = (request.method, request.url.path)
        if key not in self.overrides:
            if request.url.host == 'img.example.test':
                self.requests.append(request)
                return httpx.Response(200, headers={'content-length': str(SLIDE_SIZE), 'content-type': self.image_type})
            if key == ('POST', f'/{V}/{IG_ID}/media') and json.loads(request.content).get('is_carousel_item'):
                self.requests.append(request)
                self.children += 1
                return httpx.Response(200, json={'id': f'K{self.children}'})
            if request.method == 'GET' and request.url.path.startswith(f'/{V}/K'):
                self.requests.append(request)
                return httpx.Response(200, json={'id': request.url.path.rsplit('/', 1)[1], 'status_code': 'FINISHED'})
            if key == ('GET', f'/{V}/M1'):
                self.requests.append(request)
                return httpx.Response(200, json={'id': 'M1', 'permalink': 'https://www.instagram.com/p/CAR/'})
        return super().handler(request)

    def bodies(self, path_end='/media'):
        return [json.loads(r.content) for r in self.requests if r.method == 'POST' and r.url.path.endswith(path_end)]


CAROUSEL_LESSON = {'captions': {'instagram': 'Track AI traffic in GA4.\n\nFull guide: withhammad.com/resources/x\n#GA4'}}


def run_carousel(meta, **kwargs):
    kwargs.setdefault('sleep', lambda s: None)
    kwargs.setdefault('image_sizes', [SLIDE_SIZE] * len(kwargs.get('urls', SLIDES)))
    urls = kwargs.pop('urls', SLIDES)
    return ig.publish_carousel(urls, kwargs.pop('lesson', CAROUSEL_LESSON), token=TOKEN,
                               transport=httpx.MockTransport(meta.handler), **kwargs)


def test_carousel_dry_run_sends_only_gets_and_plans_children_then_the_carousel(tmp_path):
    meta = FakeCarouselMeta()
    state = tmp_path / 'c.json'
    plan = run_carousel(meta, state_path=state)
    assert meta.writes() == [] and not state.exists() and plan['status'] == 'planned'
    steps = [r['step'] for r in plan['requests']]
    assert steps == ['identity', 'publishing_limit', 'check_image_url', 'check_image_url', 'check_image_url',
                     'create_child', 'create_child', 'create_child', 'child_status', 'child_status', 'child_status',
                     'create_container', 'container_status', 'publish', 'permalink']
    carousel = next(r for r in plan['requests'] if r['step'] == 'create_container')['json']
    assert carousel == {'media_type': 'CAROUSEL', 'children': '<CHILD_CONTAINER_ID_1>,<CHILD_CONTAINER_ID_2>,'
                                                              '<CHILD_CONTAINER_ID_3>',
                        'caption': CAROUSEL_LESSON['captions']['instagram'], 'collaborators': ['with.hammad'],
                        'is_ai_generated': True}
    assert plan['trial'] is None and 'trial_params' not in json.dumps(plan)


def test_carousel_publishes_children_then_the_carousel_once(tmp_path):
    meta = FakeCarouselMeta()
    state = tmp_path / 'c.json'
    result = run_carousel(meta, state_path=state, dry_run=False)
    assert result['status'] == 'published' and result['media_id'] == 'M1'
    assert result['permalink'] == 'https://www.instagram.com/p/CAR/'
    children, carousel = meta.bodies()[:3], meta.bodies()[3]
    assert children == [{'image_url': u, 'is_carousel_item': True} for u in SLIDES]   # no caption, no AI flag on a child
    assert carousel['children'] == 'K1,K2,K3' and carousel['media_type'] == 'CAROUSEL'
    assert carousel['collaborators'] == ['with.hammad'] and carousel['is_ai_generated'] is True
    assert 'trial_params' not in carousel
    assert meta.bodies('/media_publish') == [{'creation_id': 'C1'}]
    assert [c for c in meta.calls() if c[1] == 'img.example.test'] == [('HEAD', 'img.example.test', p.split(
        'img.example.test', 1)[1]) for p in SLIDES]
    saved = json.loads(state.read_text())
    assert saved['status'] == 'published' and [c['container_id'] for c in saved['children']] == ['K1', 'K2', 'K3']
    assert TOKEN not in state.read_text()
    again_meta = FakeCarouselMeta()
    again = run_carousel(again_meta, state_path=state, dry_run=False)
    assert again['status'] == 'already_published' and again_meta.requests == []


def test_carousel_lost_publish_is_reconciled_by_carousel_media_only(tmp_path):
    meta = FakeCarouselMeta(statuses=('FINISHED',))
    meta.overrides[('POST', f'/{V}/{IG_ID}/media_publish')] = httpx.Response(500, json={'error': {
        'message': 'oops', 'type': 'OAuthException', 'code': 2, 'is_transient': True}})
    state = tmp_path / 'c.json'
    with pytest.raises(ig.InstagramPublishError):
        run_carousel(meta, state_path=state, dry_run=False)
    assert json.loads(state.read_text())['status'] == 'publishing'
    caption = CAROUSEL_LESSON['captions']['instagram']
    meta2 = FakeCarouselMeta(statuses=('PUBLISHED',))
    meta2.overrides[('GET', f'/{V}/{IG_ID}/media')] = httpx.Response(200, json={'data': [
        {'id': 'R9', 'caption': caption, 'media_type': 'VIDEO', 'permalink': 'https://www.instagram.com/reel/R9/'},
        {'id': 'M7', 'caption': caption, 'media_type': 'CAROUSEL_ALBUM', 'permalink': 'https://www.instagram.com/p/M7/'}]})
    result = run_carousel(meta2, state_path=state, dry_run=False)
    assert result['status'] == 'already_published' and result['media_id'] == 'M7'     # never the reel's twin caption
    assert meta2.writes() == []


def test_carousel_resume_reuses_finished_children(tmp_path):
    meta = FakeCarouselMeta(statuses=('ERROR',))
    state = tmp_path / 'c.json'
    with pytest.raises(ig.ContainerFailedError):
        run_carousel(meta, state_path=state, dry_run=False)
    meta2 = FakeCarouselMeta(statuses=('ERROR', 'FINISHED'))      # the old carousel container is still ERROR
    result = run_carousel(meta2, state_path=state, dry_run=False)
    assert result['status'] == 'published'
    assert json.loads(state.read_text())['previous_containers'][0]['id'] == 'C1'
    bodies = meta2.bodies()
    assert len(bodies) == 1 and bodies[0]['children'] == 'K1,K2,K3'      # only a new carousel container


def test_carousel_input_checks(tmp_path):
    meta = FakeCarouselMeta()
    with pytest.raises(ig.InstagramPublishError, match='2-20 images'):
        run_carousel(meta, urls=SLIDES[:1])
    with pytest.raises(ig.InstagramPublishError, match='2-20 images'):
        run_carousel(meta, urls=[f'https://img.example.test/{i}.jpg' for i in range(21)])
    with pytest.raises(ig.InstagramPublishError, match='https'):
        run_carousel(meta, urls=['http://img.example.test/1.jpg', SLIDES[1]])
    meta.image_type = 'image/png'
    with pytest.raises(ig.InstagramPublishError, match='JPEG only'):
        run_carousel(meta, state_path=tmp_path / 'c.json', dry_run=False)
    assert [w for w in meta.writes() if w[2].endswith('/media')] == []
    with pytest.raises(ig.InstagramPublishError, match='bytes but the local file'):
        run_carousel(FakeCarouselMeta(), state_path=tmp_path / 'd.json', dry_run=False, image_sizes=[1, 2, 3])
