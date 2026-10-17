"""YouTube publisher: every Google endpoint is faked with httpx.MockTransport; nothing leaves the machine."""
import datetime
import fcntl
import hashlib
import json
import os
import shutil
import subprocess
import traceback

import httpx
import pytest

from app import publish_youtube as yt

CHANNEL = 'UCJtrEDGg1R3kNe7t7PQFiEw'
ACCESS = 'ya29.ACCESS-TOKEN-must-never-leak'
REFRESH = '1//REFRESH-TOKEN-must-never-leak'
CLIENT_SECRET = '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k'
CLIENT_ID = '1234567890-fake.apps.googleusercontent.com'
UPLOAD_ID = 'UPLOAD-SESSION-ID-must-never-leak'
SESSION = f'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id={UPLOAD_ID}'
SECRET_VALUES = (ACCESS, REFRESH, CLIENT_SECRET, CLIENT_ID, UPLOAD_ID)
SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload'
LESSON = {
    'language': 'en',
    'captions': {'youtube_title': 'Reverse-engineer any feature with Claude Code (the right way)',
                 'youtube_description': 'REA is a free tool.\n\nThis video uses an AI avatar of Hammad Yousuf.'},
    'hashtags': ['#claudecode', '#aitools', '#opensource', '#claudecode'],
}


def probe_result(**over):
    video = {'codec_type': 'video', 'codec_name': 'h264', 'width': 720, 'height': 1280,
             'sample_aspect_ratio': '1:1', 'r_frame_rate': '30/1', 'duration': '21.866667'}
    audio = {'codec_type': 'audio', 'codec_name': 'aac', 'duration': '21.867000'}
    fmt = {'format_name': 'mov,mp4,m4a,3gp,3g2,mj2', 'duration': '21.867000'}
    video.update(over.pop('video', {}))
    audio.update(over.pop('audio', {}))
    fmt.update(over.pop('format', {}))
    streams = over.pop('streams', [video, audio])
    return lambda path: {'format': fmt, 'streams': streams}


class FakeGoogle:
    """Routes requests to queues of response factories; records every request with its body."""

    def __init__(self):
        self.calls = []
        self.queues = {}
        self.on('token', lambda r, b: httpx.Response(200, json={'access_token': ACCESS, 'expires_in': 3599,
                                                                 'scope': SCOPES, 'token_type': 'Bearer'}))
        self.on('channels', lambda r, b: httpx.Response(200, json={'items': [
            {'id': CHANNEL, 'snippet': {'title': 'HAMMAD YOUSUF', 'customUrl': '@with.hammad'}}]}))
        self.on('categories', lambda r, b: httpx.Response(200, json={'items': [
            {'id': '28', 'snippet': {'title': 'Science & Technology', 'assignable': True}}]}))
        self.on('init', lambda r, b: httpx.Response(200, headers={'Location': SESSION}))
        self.on('session', lambda r, b: httpx.Response(201, json={
            'id': 'vid123', 'status': {'uploadStatus': 'uploaded', 'privacyStatus': 'private'}}))
        self.on('thumbnail', lambda r, b: httpx.Response(200, json={'kind': 'youtube#thumbnailSetResponse', 'items': [
            {'default': {'url': 'https://i.ytimg.com/vi/vid123/default.jpg', 'width': 120, 'height': 90},
             'high': {'url': 'https://i.ytimg.com/vi/vid123/hqdefault.jpg', 'width': 480, 'height': 360}}]}))

    def on(self, key, *factories):
        self.queues[key] = list(factories)

    @staticmethod
    def route(request):
        url = request.url
        if url.host == 'oauth2.googleapis.com':
            return 'token'
        if url.path == '/youtube/v3/channels':
            return 'channels'
        if url.path == '/youtube/v3/videoCategories':
            return 'categories'
        if url.path == '/youtube/v3/videos':
            return 'videos'
        if url.path == '/upload/youtube/v3/videos':
            return 'session' if 'upload_id' in url.params else 'init'
        if url.path == '/upload/youtube/v3/thumbnails/set':
            return 'thumbnail'
        return 'unknown'

    def __call__(self, request):
        body = request.read()
        key = self.route(request)
        self.calls.append({'key': key, 'method': request.method, 'url': str(request.url),
                           'headers': dict(request.headers), 'body': body})
        queue = self.queues.get(key)
        if not queue:
            return httpx.Response(599, json={'error': {'message': f'unexpected {key}'}})
        factory = queue.pop(0) if len(queue) > 1 else queue[0]
        return factory(request, body)

    def keys(self):
        return [(c['method'], c['key']) for c in self.calls]


@pytest.fixture
def creds(tmp_path):
    client = tmp_path / 'client.json'
    client.write_text(json.dumps({'installed': {'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET}}))
    oauth = tmp_path / 'youtube-oauth.json'
    oauth.write_text(json.dumps({'refresh_token': REFRESH, 'channel_id': CHANNEL, 'channel_title': 'HAMMAD YOUSUF',
                                 'client_file': str(client), 'scopes': SCOPES.split()}))
    return oauth


@pytest.fixture
def video(tmp_path):
    path = tmp_path / 'final.mp4'
    path.write_bytes(bytes(range(256)) * 4)  # 1024 bytes
    return path


def run(video, creds, server, **kw):
    kw.setdefault('probe', probe_result())
    kw.setdefault('sleep', lambda s: None)
    return yt.publish(video, LESSON, oauth_file=creds, transport=httpx.MockTransport(server), **kw)


def assert_no_secrets(*texts):
    for text in texts:
        for secret in SECRET_VALUES:
            assert secret not in text, f'{secret[:12]}... leaked'


# ---------------------------------------------------------------- metadata and validation

def test_metadata_appends_shorts_and_builds_tags():
    resource, warnings = yt.build_video_resource(LESSON)
    assert resource['snippet']['title'] == LESSON['captions']['youtube_title'] + ' #Shorts'
    assert resource['snippet']['description'] == LESSON['captions']['youtube_description']
    assert resource['snippet']['tags'] == ['claudecode', 'aitools', 'opensource']
    assert resource['snippet']['categoryId'] == '28'
    assert resource['snippet']['defaultLanguage'] == resource['snippet']['defaultAudioLanguage'] == 'en'
    assert resource['status'] == {'privacyStatus': 'private', 'selfDeclaredMadeForKids': False,
                                  'containsSyntheticMedia': True}
    assert warnings == []


def test_metadata_limits():
    long_title = dict(LESSON, captions=dict(LESSON['captions'], youtube_title='x' * 95))
    resource, warnings = yt.build_video_resource(long_title)
    assert resource['snippet']['title'] == 'x' * 95 and 'Shorts' in warnings[0]
    with pytest.raises(yt.MetadataError, match='101 characters'):
        yt.build_video_resource(dict(LESSON, captions=dict(LESSON['captions'], youtube_title='y' * 101)))
    with pytest.raises(yt.MetadataError, match='"<" and ">"'):
        yt.build_video_resource(dict(LESSON, captions=dict(LESSON['captions'], youtube_description='a <b>')))
    with pytest.raises(yt.MetadataError, match='privacy_status'):
        yt.build_video_resource(LESSON, privacy_status='friends')
    with pytest.raises(yt.MetadataError, match='publish_at'):
        yt.build_video_resource(LESSON, privacy_status='public', publish_at='2026-10-20T10:00:00Z')
    many = dict(LESSON, hashtags=[f'#tag{i:03d}word' for i in range(60)])
    resource, warnings = yt.build_video_resource(many)
    assert yt._tags_length(resource['snippet']['tags']) <= 500 and any('500' in w for w in warnings)


@pytest.mark.parametrize('over, message', [
    ({'video': {'codec_name': 'hevc'}}, 'expected h264'),
    ({'audio': {'codec_name': 'mp3'}}, 'expected aac'),
    ({'video': {'width': 1280, 'height': 720}}, '9:16'),
    ({'format': {'duration': '181.0'}}, '180 s'),
    ({'format': {'format_name': 'matroska,webm'}}, 'expected MP4'),
    ({'streams': [{'codec_type': 'video', 'codec_name': 'h264', 'width': 720, 'height': 1280}]}, 'No audio'),
])
def test_validate_video_rejects(video, over, message):
    with pytest.raises(yt.VideoValidationError, match=message):
        yt.validate_video(video, probe_result(**over))


def test_validate_video_accepts_rotated_landscape_storage(video):
    info = yt.validate_video(video, probe_result(video={'width': 1280, 'height': 720,
                                                        'side_data_list': [{'rotation': -90}]}))
    assert info['size_bytes'] == 1024 and len(info['sha256']) == 64


@pytest.mark.skipif(not shutil.which('ffmpeg') or not shutil.which('ffprobe'), reason='ffmpeg not installed')
def test_validate_video_with_real_ffprobe(tmp_path):
    clip = tmp_path / 'tiny.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=white:s=180x320:d=1:r=30',
                    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-shortest', str(clip)], check=True, timeout=60)
    info = yt.validate_video(clip)
    assert (info['width'], info['height'], info['video_codec'], info['audio_codec']) == (180, 320, 'h264', 'aac')
    assert 0.5 < info['duration_s'] < 1.5


# ---------------------------------------------------------------- dry run

def test_dry_run_sends_no_youtube_writes(video, creds):
    server = FakeGoogle()
    result = run(video, creds, server)
    assert result['dry_run'] is True and result['status'] == 'planned'
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'categories')]
    non_get = [c for c in server.calls if c['method'] != 'GET']
    assert [c['url'] for c in non_get] == ['https://oauth2.googleapis.com/token']  # mints a token, creates nothing
    assert not [c for c in server.calls if '/upload/' in c['url']]
    assert [step['method'] for step in result['plan']] == ['POST', 'PUT']
    init = result['plan'][0]
    assert init['url'] == ('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable'
                           '&part=snippet%2Cstatus&notifySubscribers=true')
    assert init['headers']['Authorization'] == 'Bearer ***'
    assert init['headers']['X-Upload-Content-Length'] == '1024'
    assert init['headers']['X-Upload-Content-Type'] == 'video/mp4'
    assert init['json']['status']['containsSyntheticMedia'] is True
    assert result['plan'][1]['headers']['Content-Length'] == '1024'
    assert result['channel'] == {'channel_id': CHANNEL, 'title': 'HAMMAD YOUSUF', 'custom_url': '@with.hammad'}
    assert result['preflight_requests'][0]['form'] == {'grant_type': 'refresh_token', 'client_id': '***',
                                                       'client_secret': '***', 'refresh_token': '***'}
    assert_no_secrets(json.dumps(result))


def test_dry_run_is_the_default_and_must_be_a_bool(video, creds):
    server = FakeGoogle()
    assert yt.publish.__kwdefaults__['dry_run'] is True
    with pytest.raises(TypeError):
        run(video, creds, server, dry_run=0)
    with pytest.raises(ValueError, match='state_path'):
        run(video, creds, server, dry_run=False)
    assert server.calls == []


# ---------------------------------------------------------------- live upload

def test_happy_path_sequence_bodies_and_state(video, creds, tmp_path):
    state_path = tmp_path / 'publish_state.json'
    planned = run(video, creds, FakeGoogle())['plan']
    server = FakeGoogle()
    seen_state = {}

    def upload(request, body):
        seen_state.update(json.loads(state_path.read_text())['youtube'])  # session saved before bytes go out
        return httpx.Response(201, json={'id': 'vid123', 'status': {'uploadStatus': 'uploaded',
                                                                     'privacyStatus': 'private'}})
    server.on('session', upload)
    result = run(video, creds, server, dry_run=False, state_path=state_path)

    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'categories'), ('POST', 'init'),
                             ('PUT', 'session')]
    init, put = server.calls[3], server.calls[4]
    assert init['url'] == planned[0]['url']
    assert json.loads(init['body']) == planned[0]['json']
    assert init['headers']['authorization'] == f'Bearer {ACCESS}'
    assert init['headers']['content-type'] == 'application/json; charset=UTF-8'
    assert init['headers']['x-upload-content-length'] == '1024'
    assert init['headers']['x-upload-content-type'] == 'video/mp4'
    assert put['url'] == SESSION and put['body'] == video.read_bytes()
    assert put['headers']['content-length'] == '1024' and 'content-range' not in put['headers']
    assert seen_state['status'] == 'uploading' and seen_state['upload_url'] == SESSION

    assert result['status'] == 'published' and result['video_id'] == 'vid123'
    assert result['url'] == 'https://www.youtube.com/shorts/vid123'
    saved = json.loads(state_path.read_text())['youtube']
    assert saved['status'] == 'published' and saved['video_id'] == 'vid123' and 'upload_url' not in saved
    assert oct(state_path.stat().st_mode & 0o777) == '0o600'
    assert_no_secrets(json.dumps(result), state_path.read_text())


def test_published_state_returns_without_any_request(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    run(video, creds, FakeGoogle(), dry_run=False, state_path=state_path)
    server = FakeGoogle()
    for dry in (False, True):
        result = run(video, creds, server, dry_run=dry, state_path=state_path)
        assert result['already_published'] is True and result['video_id'] == 'vid123'
    assert server.calls == []


def test_state_for_another_file_is_refused(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    run(video, creds, FakeGoogle(), dry_run=False, state_path=state_path)
    video.write_bytes(b'a different cut' * 10)
    server = FakeGoogle()
    with pytest.raises(yt.StateConflictError, match='different video'):
        run(video, creds, server, dry_run=False, state_path=state_path)
    assert server.calls == []


def test_other_platform_sections_are_kept(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    state_path.write_text(json.dumps({'tiktok': {'publish_id': 'p1'}}))
    run(video, creds, FakeGoogle(), dry_run=False, state_path=state_path)
    data = json.loads(state_path.read_text())
    assert data['tiktok'] == {'publish_id': 'p1'} and data['youtube']['video_id'] == 'vid123'


def write_session_state(state_path, video):
    info = yt.validate_video(video, probe_result())
    yt.save_state(state_path, {'platform': 'youtube', 'status': 'uploading', 'upload_url': SESSION,
                               'channel_id': CHANNEL, 'video_sha256': info['sha256'], 'video_size': 1024})


def test_resume_from_saved_session(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    write_session_state(state_path, video)
    server = FakeGoogle()
    server.on('session',
              lambda r, b: httpx.Response(308, headers={'Range': 'bytes=0-99'}),
              lambda r, b: httpx.Response(201, json={'id': 'vid456', 'status': {'privacyStatus': 'private'}}))
    planned = run(video, creds, FakeGoogle(), state_path=state_path)
    assert planned['status'] == 'resume_planned'
    assert [p['step'] for p in planned['plan']] == ['check_upload_status', 'resume_upload']
    assert UPLOAD_ID not in json.dumps(planned)

    result = run(video, creds, server, dry_run=False, state_path=state_path)
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'categories'), ('PUT', 'session'),
                             ('PUT', 'session')]
    check, resume = server.calls[3], server.calls[4]
    assert check['headers']['content-range'] == 'bytes */1024' and check['body'] == b''
    assert resume['headers']['content-range'] == 'bytes 100-1023/1024'
    assert resume['headers']['content-length'] == '924' and resume['body'] == video.read_bytes()[100:]
    assert result['video_id'] == 'vid456'


def test_resume_finds_finished_upload_and_sends_no_bytes(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    write_session_state(state_path, video)
    server = FakeGoogle()
    server.on('session', lambda r, b: httpx.Response(200, json={'id': 'vid789', 'status': {}}))
    result = run(video, creds, server, dry_run=False, state_path=state_path)
    assert [c['body'] for c in server.calls if c['key'] == 'session'] == [b'']
    assert result['video_id'] == 'vid789'


def test_transient_error_then_resume(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    server = FakeGoogle()
    server.on('session',
              lambda r, b: httpx.Response(503, json={'error': {'code': 503, 'message': 'backend error'}}),
              lambda r, b: httpx.Response(308, headers={'Range': 'bytes=0-511'}),
              lambda r, b: httpx.Response(201, json={'id': 'vidR', 'status': {}}))
    sleeps = []
    result = run(video, creds, server, dry_run=False, state_path=state_path, sleep=sleeps.append)
    sessions = [c for c in server.calls if c['key'] == 'session']
    assert len(sessions) == 3 and sessions[2]['headers']['content-range'] == 'bytes 512-1023/1024'
    assert sessions[2]['body'] == video.read_bytes()[512:]
    assert result['video_id'] == 'vidR' and sleeps == [2]
    assert [c['key'] for c in server.calls].count('init') == 1


def test_expired_session_aborts_without_new_upload(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    write_session_state(state_path, video)
    server = FakeGoogle()
    server.on('session', lambda r, b: httpx.Response(404, json={'error': {'code': 404, 'message': 'Not Found'}}))
    with pytest.raises(yt.UploadSessionExpired) as error:
        run(video, creds, server, dry_run=False, state_path=state_path)
    assert 'YouTube Studio' in str(error.value)
    assert 'init' not in [c['key'] for c in server.calls]
    assert json.loads(state_path.read_text())['youtube']['session_expired'] is True
    server = FakeGoogle()
    result = run(video, creds, server, dry_run=False, state_path=state_path, restart_expired_session=True)
    assert [c['key'] for c in server.calls].count('init') == 1 and result['video_id'] == 'vid123'


# ---------------------------------------------------------------- identity and errors

def test_identity_mismatch_aborts_before_any_write(video, creds, tmp_path):
    server = FakeGoogle()
    server.on('channels', lambda r, b: httpx.Response(200, json={'items': [{'id': 'UCsomeoneElse000000000000'}]}))
    with pytest.raises(yt.IdentityMismatchError, match='UCsomeoneElse'):
        run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json')
    assert server.keys() == [('POST', 'token'), ('GET', 'channels')]
    assert not (tmp_path / 'state.json').exists()


def test_credentials_for_another_channel_abort_before_any_request(video, creds):
    server = FakeGoogle()
    with pytest.raises(yt.IdentityMismatchError, match='OAuth file'):
        run(video, creds, server, expected_channel_id='UCanotherChannel00000000')
    assert server.calls == []


def test_api_error_surfaces_code_reason_and_message(video, creds, tmp_path):
    server = FakeGoogle()
    server.on('init', lambda r, b: httpx.Response(403, json={'error': {
        'code': 403, 'message': 'The request cannot be completed because you have exceeded your quota.',
        'errors': [{'reason': 'quotaExceeded', 'domain': 'youtube.quota'}]}}))
    with pytest.raises(yt.ApiError) as error:
        run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json')
    assert error.value.status == 403 and error.value.reason == 'quotaExceeded'
    assert 'HTTP 403' in str(error.value) and 'exceeded your quota' in str(error.value)
    assert_no_secrets(str(error.value))


def test_token_refresh_error_is_typed_and_clean(video, creds):
    server = FakeGoogle()
    server.on('token', lambda r, b: httpx.Response(400, json={
        'error': 'invalid_grant', 'error_description': f'Bad grant {REFRESH}'}))  # even if Google echoed it
    with pytest.raises(yt.AuthError) as error:
        run(video, creds, server)
    assert error.value.reason == 'invalid_grant' and 'youtube_oauth.py' in str(error.value)
    assert_no_secrets(str(error.value), str(error.value.platform_message))


def test_token_never_appears_in_errors_from_echoing_server(video, creds, tmp_path):
    server = FakeGoogle()
    server.on('session', lambda r, b: httpx.Response(400, json={'error': {
        'code': 400, 'message': f'bad request for {r.headers["authorization"]} at {r.url}',
        'errors': [{'reason': 'invalidMetadata'}]}}))
    with pytest.raises(yt.ApiError) as error:
        run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json')
    assert error.value.reason == 'invalidMetadata'
    assert_no_secrets(str(error.value))


def test_network_errors_are_retried_then_reported_cleanly(video, creds, tmp_path):
    def drop(request, body):
        raise httpx.WriteError(f'connection reset while sending {request.url}')
    server = FakeGoogle()
    server.on('session', drop)
    with pytest.raises(yt.YouTubePublishError, match='rerun publish to resume') as error:
        run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json', max_retries=2)
    assert len([c for c in server.calls if c['key'] == 'session']) == 3
    assert json.loads((tmp_path / 'state.json').read_text())['youtube']['status'] == 'uploading'
    assert_no_secrets(str(error.value))
    # A logged traceback must not print the chained httpx error, which quoted the session URI.
    assert_no_secrets(''.join(traceback.format_exception(error.value)))


# ---------------------------------------------------------------- review additions

def test_dry_run_with_state_path_writes_nothing(video, creds, tmp_path):
    state_path = tmp_path / 'jobs' / 'state.json'
    result = run(video, creds, FakeGoogle(), state_path=state_path)
    assert result['status'] == 'planned'
    assert not state_path.parent.exists()  # no state file, no lock file, not even the folder


def test_unauthorized_mid_upload_refreshes_token_then_checks_status(video, creds, tmp_path):
    server = FakeGoogle()
    server.on('session',
              lambda r, b: httpx.Response(401, json={'error': {'code': 401, 'message': 'Invalid Credentials'}}),
              lambda r, b: httpx.Response(308, headers={'Range': 'bytes=0-1023', 'Retry-After': '7'}),
              lambda r, b: httpx.Response(201, json={'id': 'vid401', 'status': {}}))
    sleeps = []
    result = run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json', sleep=sleeps.append)
    assert server.keys()[3:] == [('POST', 'init'), ('PUT', 'session'), ('POST', 'token'), ('PUT', 'session'),
                                 ('PUT', 'session')]
    check = server.calls[6]
    assert check['headers']['content-range'] == 'bytes */1024' and check['body'] == b''
    # The server held every byte but had not answered: the code waits Retry-After, backs off and asks again
    # rather than starting a new upload.
    assert result['video_id'] == 'vid401' and 7 in sleeps
    assert [c['key'] for c in server.calls].count('init') == 1


def test_resume_without_range_header_restarts_from_byte_zero(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    write_session_state(state_path, video)
    server = FakeGoogle()
    server.on('session', lambda r, b: httpx.Response(308),
              lambda r, b: httpx.Response(201, json={'id': 'vid0', 'status': {}}))
    result = run(video, creds, server, dry_run=False, state_path=state_path)
    resume = [c for c in server.calls if c['key'] == 'session'][1]
    assert resume['headers']['content-range'] == 'bytes 0-1023/1024' and resume['body'] == video.read_bytes()
    assert result['video_id'] == 'vid0'


def test_publish_at_must_be_a_future_iso_timestamp():
    future = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).replace(microsecond=0)
    resource, _ = yt.build_video_resource(LESSON, publish_at=future.isoformat())
    assert resource['status']['publishAt'] == future.strftime('%Y-%m-%dT%H:%M:%SZ')
    for bad, message in (('2020-01-01T00:00:00Z', 'past'), ('tomorrow', 'ISO 8601'),
                         ('2099-01-01T10:00:00', 'timezone')):
        with pytest.raises(yt.MetadataError, match=message):
            yt.build_video_resource(LESSON, publish_at=bad)


@pytest.mark.parametrize('scope, ok', [('https://www.googleapis.com/auth/youtube', True),
                                       ('https://www.googleapis.com/auth/youtube.force-ssl', True),
                                       ('https://www.googleapis.com/auth/youtube.readonly', False)])
def test_any_scope_that_authorizes_videos_insert_is_accepted(video, creds, scope, ok):
    server = FakeGoogle()
    server.on('token', lambda r, b: httpx.Response(200, json={'access_token': ACCESS, 'expires_in': 3599,
                                                              'scope': scope, 'token_type': 'Bearer'}))
    if ok:
        assert run(video, creds, server)['status'] == 'planned'
    else:
        with pytest.raises(yt.AuthError, match='youtube.upload'):
            run(video, creds, server)


def test_second_live_run_is_refused_while_one_holds_the_lock(video, creds, tmp_path):
    state_path = tmp_path / 'state.json'
    fd = os.open(f'{state_path}.lock', os.O_CREAT | os.O_RDWR, 0o600)
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    try:
        server = FakeGoogle()
        with pytest.raises(yt.StateConflictError, match='already running'):
            run(video, creds, server, dry_run=False, state_path=state_path)
        assert server.calls == []
        assert run(video, creds, FakeGoogle(), state_path=state_path)['status'] == 'planned'  # dry run unaffected
    finally:
        os.close(fd)
    assert run(video, creds, FakeGoogle(), dry_run=False, state_path=state_path)['video_id'] == 'vid123'


def test_video_status_reports_processing_outcome(creds):
    server = FakeGoogle()
    server.on('videos', lambda r, b: httpx.Response(200, json={'items': [{'id': 'vid123', 'status': {
        'uploadStatus': 'rejected', 'rejectionReason': 'duplicate', 'privacyStatus': 'private'},
        'processingDetails': {'processingStatus': 'terminated'}}]}))
    result = yt.video_status('vid123', oauth_file=creds, transport=httpx.MockTransport(server))
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'videos')]
    assert 'part=status%2CprocessingDetails' in server.calls[2]['url'] and 'id=vid123' in server.calls[2]['url']
    assert result['done'] is True and result['ok'] is False and result['rejection_reason'] == 'duplicate'
    server.on('videos', lambda r, b: httpx.Response(200, json={'items': [{'id': 'vid123', 'status': {
        'uploadStatus': 'uploaded'}, 'processingDetails': {'processingStatus': 'processing'}}]}))
    result = yt.video_status('vid123', oauth_file=creds, transport=httpx.MockTransport(server))
    assert result['done'] is False and result['processing_status'] == 'processing'
    assert_no_secrets(json.dumps(result))


# ---------------------------------------------------------------- custom thumbnail (thumbnails.set)

THUMB_URL = 'https://www.googleapis.com/upload/youtube/v3/thumbnails/set'
FORBIDDEN = {'error': {'code': 403, 'message': 'The authenticated user does not have permission to upload and set '
                                               'custom video thumbnails.', 'errors': [{'reason': 'forbidden'}]}}


@pytest.fixture
def cover(tmp_path):
    path = tmp_path / 'cover_1080x1920.jpg'
    path.write_bytes(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00' + bytes(range(256)) * 8 + b'\xff\xd9')
    return path


def test_dry_run_plans_thumbnails_set_after_the_upload(video, creds, cover):
    server = FakeGoogle()
    result = run(video, creds, server, thumbnail_path=cover)
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'categories')]
    step = result['plan'][-1]
    assert [p['step'] for p in result['plan']] == ['start_upload_session', 'upload_file', 'set_thumbnail']
    assert step['method'] == 'POST'
    assert step['url'] == f'{THUMB_URL}?videoId=<video id from the upload>&uploadType=media'
    assert step['headers'] == {'Authorization': 'Bearer ***', 'Content-Type': 'image/jpeg',
                               'Content-Length': str(cover.stat().st_size)}
    assert step['body']['sha256'] == yt.validate_thumbnail(cover)['sha256'] and 'youtube.com/verify' in step['expect']
    assert_no_secrets(json.dumps(result))


def test_live_upload_sets_the_thumbnail_once_and_records_its_sha(video, creds, cover, tmp_path):
    state_path = tmp_path / 'state.json'
    server = FakeGoogle()
    result = run(video, creds, server, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'categories'), ('POST', 'init'),
                             ('PUT', 'session'), ('POST', 'thumbnail')]
    call = server.calls[-1]
    assert call['url'] == f'{THUMB_URL}?videoId=vid123&uploadType=media'
    assert call['headers']['content-type'] == 'image/jpeg' and call['headers']['authorization'] == f'Bearer {ACCESS}'
    assert call['body'] == cover.read_bytes()
    assert result['status'] == 'published' and result['thumbnail']['status'] == 'set' and result['warnings'] == []
    assert result['thumbnail']['urls']['high'] == 'https://i.ytimg.com/vi/vid123/hqdefault.jpg'
    saved = json.loads(state_path.read_text())['youtube']
    assert saved['thumbnail']['sha256'] == yt.validate_thumbnail(cover)['sha256'] and saved['thumbnail']['set_at']
    assert saved['thumbnail']['video_id'] == 'vid123' and saved['status'] == 'published'
    assert_no_secrets(json.dumps(result), state_path.read_text())

    rerun = FakeGoogle()
    for dry in (False, True):
        again = run(video, creds, rerun, dry_run=dry, state_path=state_path, thumbnail_path=cover)
        assert again['already_published'] is True and again['thumbnail']['status'] == 'already_set'
    assert rerun.calls == []   # same video, same JPEG: nothing is sent at all


def test_thumbnail_403_is_a_warning_and_a_rerun_sets_only_the_thumbnail(video, creds, cover, tmp_path):
    state_path = tmp_path / 'state.json'
    server = FakeGoogle()
    server.on('thumbnail', lambda r, b: httpx.Response(403, json=FORBIDDEN))
    result = run(video, creds, server, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert result['status'] == 'published' and result['video_id'] == 'vid123'
    assert result['thumbnail']['status'] == 'failed'
    assert len(result['warnings']) == 1 and 'HTTP 403' in result['warnings'][0]
    assert 'https://www.youtube.com/verify' in result['warnings'][0]
    assert 'thumbnail vid123' in result['warnings'][0]   # the exact retro-fix command
    saved = json.loads(state_path.read_text())['youtube']
    assert saved['status'] == 'published' and 'thumbnail' not in saved
    assert_no_secrets(json.dumps(result))

    planned = run(video, creds, FakeGoogle(), state_path=state_path, thumbnail_path=cover)
    assert planned['already_published'] is True and planned['thumbnail']['status'] == 'planned'
    assert [p['step'] for p in planned['plan']] == ['set_thumbnail']
    assert planned['plan'][0]['url'] == f'{THUMB_URL}?videoId=vid123&uploadType=media'

    rerun = FakeGoogle()
    again = run(video, creds, rerun, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert rerun.keys() == [('POST', 'token'), ('GET', 'channels'), ('POST', 'thumbnail')]   # no second upload
    assert again['thumbnail']['status'] == 'set' and again['already_published'] is True
    assert json.loads(state_path.read_text())['youtube']['thumbnail']['video_id'] == 'vid123'


def test_network_error_on_thumbnail_is_a_warning(video, creds, cover, tmp_path):
    def drop(request, body):
        raise httpx.ConnectError(f'reset while sending {request.headers["authorization"]}')
    server = FakeGoogle()
    server.on('thumbnail', drop)
    result = run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json', thumbnail_path=cover)
    assert result['status'] == 'published' and result['thumbnail']['status'] == 'failed'
    assert 'ConnectError' in result['warnings'][0]
    assert_no_secrets(json.dumps(result))


@pytest.mark.parametrize('content, message', [(b'\x89PNG\r\n\x1a\n' + b'0' * 50, 'not a JPEG'),
                                              (b'\xff\xd8\xff' + b'0' * (2 * 1024 * 1024), 'at most 2 MB')])
def test_unusable_thumbnail_is_skipped_with_a_warning(video, creds, tmp_path, content, message):
    bad = tmp_path / 'cover.jpg'
    bad.write_bytes(content)
    with pytest.raises(yt.ThumbnailError, match=message):
        yt.validate_thumbnail(bad)
    server = FakeGoogle()
    result = run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json', thumbnail_path=bad)
    assert result['status'] == 'published' and 'thumbnail' not in [c['key'] for c in server.calls]
    assert any(message in w for w in result['warnings'])


def test_set_thumbnail_on_an_existing_short(creds, cover, tmp_path):
    def owner(channel):
        return lambda r, b: httpx.Response(200, json={'items': [{'id': 'HClAkG74r6A', 'snippet': {'channelId': channel}}]})
    server = FakeGoogle()
    server.on('videos', owner(CHANNEL))
    planned = yt.set_thumbnail('HClAkG74r6A', cover, oauth_file=creds, transport=httpx.MockTransport(server))
    assert server.keys() == [('POST', 'token'), ('GET', 'channels'), ('GET', 'videos')]
    assert planned['status'] == 'planned'
    assert planned['plan'][0]['url'] == f'{THUMB_URL}?videoId=HClAkG74r6A&uploadType=media'
    assert 'id=HClAkG74r6A' in server.calls[2]['url']

    state_path = tmp_path / 'publish_youtube.json'
    yt.save_state(state_path, {'status': 'published', 'video_id': 'HClAkG74r6A', 'channel_id': CHANNEL})
    server = FakeGoogle()
    server.on('videos', owner(CHANNEL))
    done = yt.set_thumbnail('HClAkG74r6A', cover, dry_run=False, state_path=state_path, oauth_file=creds,
                            transport=httpx.MockTransport(server))
    assert server.keys()[-1] == ('POST', 'thumbnail') and done['status'] == 'set'
    saved = json.loads(state_path.read_text())['youtube']
    assert saved['status'] == 'published' and saved['thumbnail']['sha256'] == done['thumbnail']['sha256']
    assert_no_secrets(json.dumps(done), state_path.read_text())

    server = FakeGoogle()
    again = yt.set_thumbnail('HClAkG74r6A', cover, dry_run=False, state_path=state_path, oauth_file=creds,
                             transport=httpx.MockTransport(server))
    assert again['status'] == 'already_set' and server.calls == []

    with pytest.raises(yt.StateConflictError, match='HClAkG74r6A'):
        yt.set_thumbnail('otherVideo1', cover, dry_run=False, state_path=state_path, oauth_file=creds,
                         transport=httpx.MockTransport(FakeGoogle()))


def test_set_thumbnail_refuses_a_video_on_another_channel_and_raises_on_403(creds, cover):
    server = FakeGoogle()
    server.on('videos', lambda r, b: httpx.Response(200, json={'items': [
        {'id': 'x', 'snippet': {'channelId': 'UCsomeoneElse000000000000'}}]}))
    with pytest.raises(yt.IdentityMismatchError, match='not on channel'):
        yt.set_thumbnail('x', cover, dry_run=False, oauth_file=creds, transport=httpx.MockTransport(server))
    assert 'thumbnail' not in [c['key'] for c in server.calls]
    server = FakeGoogle()
    server.on('videos', lambda r, b: httpx.Response(200, json={'items': [{'id': 'x', 'snippet': {'channelId': CHANNEL}}]}))
    server.on('thumbnail', lambda r, b: httpx.Response(403, json=FORBIDDEN))
    with pytest.raises(yt.ThumbnailError, match='youtube.com/verify') as error:
        yt.set_thumbnail('x', cover, dry_run=False, oauth_file=creds, transport=httpx.MockTransport(server))
    assert error.value.status == 403 and error.value.reason == 'forbidden'
    assert_no_secrets(str(error.value))


def test_thumbnail_cli_is_a_dry_run_unless_live(monkeypatch, cover, capsys):
    calls = []
    monkeypatch.setattr(yt, 'set_thumbnail', lambda *a, **kw: calls.append((a, kw)) or {'status': 'planned'})
    assert yt.main(['thumbnail', 'HClAkG74r6A', str(cover)]) == 0
    assert yt.main(['thumbnail', 'HClAkG74r6A', str(cover), '--live', '--state', 'publish_youtube.json']) == 0
    assert calls[0] == (('HClAkG74r6A', str(cover)), {'dry_run': True, 'state_path': None})
    assert calls[1] == (('HClAkG74r6A', str(cover)), {'dry_run': False, 'state_path': 'publish_youtube.json'})
    assert '"planned"' in capsys.readouterr().out


def test_dry_run_on_a_published_short_with_a_new_cover_leaves_the_state_untouched(video, creds, cover, tmp_path):
    state_path = tmp_path / 'state.json'
    yt.save_state(state_path, {'status': 'published', 'video_id': 'vid123', 'channel_id': CHANNEL})
    before = state_path.read_bytes()
    server = FakeGoogle()
    result = run(video, creds, server, dry_run=True, state_path=state_path, thumbnail_path=cover)
    assert state_path.read_bytes() == before and result['thumbnail']['status'] == 'planned'
    assert server.keys() == [('POST', 'token'), ('GET', 'channels')]   # token refresh + identity check only


def test_thumbnail_401_refreshes_the_token_once_and_retries(video, creds, cover, tmp_path):
    server = FakeGoogle()
    server.on('thumbnail', lambda r, b: httpx.Response(401, json={'error': {'code': 401, 'message': 'expired'}}),
              lambda r, b: httpx.Response(200, json={'items': [{'high': {'url': 'https://i.ytimg.com/h.jpg'}}]}))
    result = run(video, creds, server, dry_run=False, state_path=tmp_path / 'state.json', thumbnail_path=cover)
    assert server.keys()[-3:] == [('POST', 'thumbnail'), ('POST', 'token'), ('POST', 'thumbnail')]
    assert result['thumbnail']['status'] == 'set'
    assert result['thumbnail']['urls'] == {'high': 'https://i.ytimg.com/h.jpg'}
    assert result['warnings'] == []


@pytest.mark.parametrize('failure', ['raise', 'items-null'])
def test_unexpected_thumbnail_failure_after_the_upload_only_warns(video, creds, cover, tmp_path, failure):
    def boom(request, body):
        raise RuntimeError(f'proxy exploded with {request.headers["authorization"]}')
    server = FakeGoogle()
    if failure == 'raise':
        server.on('thumbnail', boom)
    else:
        server.on('thumbnail', lambda r, b: httpx.Response(200, json={'items': [None]}))
    state_path = tmp_path / 'state.json'
    result = run(video, creds, server, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert result['status'] == 'published' and result['video_id'] == 'vid123'
    if failure == 'raise':
        assert result['thumbnail']['status'] == 'failed' and 'RuntimeError' in result['warnings'][0]
    else:   # an odd but successful body: the thumbnail is set, there are just no URLs to report
        assert result['thumbnail']['status'] == 'set' and result['thumbnail']['urls'] == {}
    assert json.loads(state_path.read_text())['youtube']['status'] == 'published'
    assert_no_secrets(json.dumps(result))


def test_cover_changed_or_removed_during_the_upload_still_sends_the_checked_bytes(video, creds, cover, tmp_path):
    original = cover.read_bytes()
    server = FakeGoogle()

    def finish(request, body):   # the cover is re-exported, then removed, while the video bytes upload
        cover.write_bytes(b'\xff\xd8\xff different bytes')
        cover.unlink()
        return httpx.Response(201, json={'id': 'vid123', 'status': {'uploadStatus': 'uploaded'}})
    server.on('session', finish)
    state_path = tmp_path / 'state.json'
    result = run(video, creds, server, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert result['status'] == 'published' and result['thumbnail']['status'] == 'set'
    assert server.calls[-1]['body'] == original
    assert json.loads(state_path.read_text())['youtube']['thumbnail']['sha256'] == hashlib.sha256(original).hexdigest()


def test_checked_thumbnail_serializes_without_its_bytes(cover):
    thumb = yt.validate_thumbnail(cover)
    assert thumb.data == cover.read_bytes()
    assert json.loads(json.dumps(thumb)) == {'path': str(cover), 'bytes': cover.stat().st_size,
                                             'sha256': hashlib.sha256(cover.read_bytes()).hexdigest(),
                                             'mime_type': 'image/jpeg'}


def test_identity_mismatch_on_a_published_short_only_warns(video, creds, cover, tmp_path):
    state_path = tmp_path / 'state.json'
    yt.save_state(state_path, {'status': 'published', 'video_id': 'vid123', 'channel_id': CHANNEL})
    before = state_path.read_bytes()
    server = FakeGoogle()
    server.on('channels', lambda r, b: httpx.Response(200, json={'items': [{'id': 'UCsomeoneElse', 'snippet': {}}]}))
    result = run(video, creds, server, dry_run=False, state_path=state_path, thumbnail_path=cover)
    assert result['already_published'] is True and result['video_id'] == 'vid123'
    assert result['thumbnail']['status'] == 'failed' and 'UCsomeoneElse' in result['warnings'][0]
    assert 'thumbnail' not in [c['key'] for c in server.calls] and state_path.read_bytes() == before
