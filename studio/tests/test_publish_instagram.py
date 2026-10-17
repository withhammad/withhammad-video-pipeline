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
    lesson = {'captions': {'instagram': CAPTION + ' (edited)'}}
    result = ig.publish(video, lesson, dry_run=False, state_path=state_path, token=TOKEN, probe=probe_ok(),
                        sleep=lambda s: None, transport=httpx.MockTransport(meta.handler), url_provider=FakeProvider())
    assert result['status'] == 'published' and result['container_id'] == 'C2'
    state = json.loads(state_path.read_text())
    assert state['previous_containers'][0]['id'] == 'C1' and 'superseded' in state['previous_containers'][0]['reason']
    assert meta.writes() == [('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media'),
                             ('POST', 'graph.instagram.com', f'/{V}/{IG_ID}/media_publish')]


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

