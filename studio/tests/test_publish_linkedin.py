"""LinkedIn publisher: every test runs against httpx.MockTransport; nothing reaches LinkedIn."""
import hashlib
import itertools
import json
import math
import os
import time

import httpx
import pytest

from app import publish_linkedin as li

TOKEN = 'AQX_test_SECRET_token_123'
OWNER = li.OWNER_SUB
VIDEO_URN = 'urn:li:video:C5505AQH-test'
POST_URN = 'urn:li:share:7380000000000000001'
SIZE = 200_000
LESSON = {'topic_title': 'Reverse-engineer a feature', 'captions': {'linkedin': 'Use it (carefully) #claudecode'}}
PROBE = {'streams': [{'index': 0, 'codec_type': 'video', 'codec_name': 'h264', 'width': 720, 'height': 1280,
                      'sample_aspect_ratio': '1:1'},
                     {'index': 1, 'codec_type': 'audio', 'codec_name': 'aac'}],
         'format': {'format_name': 'mov,mp4,m4a,3gp,3g2,mj2', 'duration': '21.867', 'size': str(SIZE),
                    'tags': {'major_brand': 'isom'}}}
FAR_FUTURE_MS = int((time.time() + 30 * 86400) * 1000)
THUMB_UPLOAD_URL = 'https://www.linkedin.com/dms-uploads/C5505AQH/uploadedThumbnail/thumb?sau=SIGNED-THUMB'


class FakeLinkedIn:
    """Routes requests like LinkedIn would; `fail` maps a request key to a one-shot Response or exception."""

    def __init__(self, sub=OWNER, parts=2, statuses=('PROCESSING', 'AVAILABLE'), fail=None, video_urn=VIDEO_URN):
        self.sub, self.parts, self.statuses, self.video_urn = sub, parts, list(statuses), video_urn
        self.fail = dict(fail or {})
        self.requests = []

    @staticmethod
    def key(request):
        if request.url.host == 'www.linkedin.com':
            return 'put' + request.url.path.rsplit('/', 1)[-1]
        path = request.url.path
        if path == '/v2/userinfo':
            return 'userinfo'
        if path == '/rest/videos':
            return {'initializeUpload': 'init', 'finalizeUpload': 'finalize'}[request.url.params['action']]
        if path.startswith('/rest/videos/'):
            return 'video'
        if path == '/rest/posts':
            return 'post'
        raise AssertionError(f'unexpected request {request.method} {request.url}')

    def sequence(self):
        return [(r.method, self.key(r)) for r in self.requests]

    def body(self, key):
        return json.loads(next(r for r in self.requests if self.key(r) == key).content)

    def __call__(self, request):
        self.requests.append(request)
        key = self.key(request)
        if key in self.fail:
            outcome = self.fail.pop(key)
            if isinstance(outcome, Exception):
                raise outcome
            return outcome
        if key == 'userinfo':
            return httpx.Response(200, json={'sub': self.sub, 'name': 'Hammad Yousuf', 'locale': 'en-US'})
        if key == 'init':
            chunk = math.ceil(SIZE / self.parts)
            value = {
                'uploadUrlsExpireAt': FAR_FUTURE_MS, 'video': self.video_urn, 'uploadToken': 'utok-1',
                'uploadInstructions': [{'uploadUrl': f'https://www.linkedin.com/dms-uploads/C5505AQH/uploadedVideo/{i}'
                                                     f'?sau=SIGNED-{i}',
                                        'firstByte': i * chunk, 'lastByte': min((i + 1) * chunk, SIZE) - 1}
                                       for i in range(self.parts)]}
            if json.loads(request.content)['initializeUploadRequest']['uploadThumbnail']:
                value['thumbnailUploadUrl'] = THUMB_UPLOAD_URL
            return httpx.Response(200, json={'value': value})
        if key == 'putthumb':
            return httpx.Response(201)
        if key.startswith('put'):
            return httpx.Response(200, headers={'etag': f'"etag-{key[3:]}"'})
        if key == 'finalize':
            return httpx.Response(200)
        if key == 'video':
            status = self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]
            body = {'id': self.video_urn, 'status': status, 'owner': f'urn:li:person:{OWNER}'}
            if status == 'PROCESSING_FAILED':
                body['processingFailureReason'] = 'UNSUPPORTED_FORMAT'
            return httpx.Response(200, json=body)
        if key == 'post':
            return httpx.Response(201, headers={'x-restli-id': POST_URN})


def explode(request):
    raise AssertionError(f'no request expected, got {request.method} {request.url}')


@pytest.fixture
def video(tmp_path):
    path = tmp_path / 'final.mp4'
    path.write_bytes((bytes(range(256)) * (SIZE // 256 + 1))[:SIZE])
    return path


@pytest.fixture
def creds(tmp_path):
    path = tmp_path / 'linkedin-oauth.json'
    path.write_text(json.dumps({'access_token': TOKEN, 'client_id': 'cid', 'member_name': 'Hammad Yousuf',
                                'member_sub': OWNER, 'expires_at_unix': time.time() + 60 * 86400,
                                'scopes': ['openid', 'profile', 'w_member_social']}))
    return path


@pytest.fixture
def run(video, creds, tmp_path):
    state = tmp_path / 'state.json'

    def _run(fake, **kwargs):
        kwargs.setdefault('state_path', state)
        kwargs.setdefault('sleep', lambda s: None)
        return li.publish(video, kwargs.pop('lesson', LESSON), credentials_path=creds,
                          transport=httpx.MockTransport(fake), probe=lambda p: PROBE, **kwargs)
    _run.state = state
    return _run


def read_state(path):
    return json.loads(path.read_text())


# ---------------------------------------------------------------- dry run

@pytest.mark.parametrize('flag', ['omitted', True, None, 0, 'no'])
def test_dry_run_sends_only_the_identity_get_and_returns_the_plan(run, flag):
    fake = FakeLinkedIn()
    result = run(fake) if flag == 'omitted' else run(fake, dry_run=flag)
    assert [(r.method, str(r.url)) for r in fake.requests] == [('GET', li.USERINFO_URL)]
    assert not run.state.exists()
    assert result['dry_run'] is True and result['status'] == 'planned'
    assert result['identity'] == {'sub': OWNER, 'name': 'Hammad Yousuf', 'verified': True}
    plan = result['requests']
    assert [s['step'] for s in plan] == ['initialize_upload', 'upload_part', 'finalize_upload',
                                         'wait_until_available', 'create_post']
    assert [s['method'] for s in plan] == ['POST', 'PUT', 'POST', 'GET', 'POST']
    assert plan[0]['url'] == 'https://api.linkedin.com/rest/videos?action=initializeUpload'
    assert plan[0]['json'] == {'initializeUploadRequest': {'owner': f'urn:li:person:{OWNER}', 'fileSizeBytes': SIZE,
                                                           'uploadCaptions': False, 'uploadThumbnail': False}}
    assert plan[0]['headers'] == {'Authorization': 'Bearer <redacted>', 'Linkedin-Version': '202610',
                                  'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json'}
    assert plan[1]['bytes'] == f'0-{SIZE - 1}' and plan[1]['size'] == SIZE
    assert 'Authorization' not in plan[1]['headers']
    post = plan[-1]['json']
    assert post['commentary'] == r'Use it \(carefully\) #claudecode'
    assert post['visibility'] == 'PUBLIC' and post['distribution']['feedDistribution'] == 'MAIN_FEED'
    assert post['lifecycleState'] == 'PUBLISHED' and post['author'] == f'urn:li:person:{OWNER}'
    assert TOKEN not in json.dumps(result)


# ---------------------------------------------------------------- real path (mocked)

def test_publish_happy_path_request_sequence_bodies_and_state(run, video):
    fake = FakeLinkedIn(parts=2)
    result = run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('POST', 'init'), ('PUT', 'put0'), ('PUT', 'put1'),
                               ('POST', 'finalize'), ('GET', 'video'), ('GET', 'video'), ('POST', 'post')]
    data = video.read_bytes()
    puts = [r for r in fake.requests if r.method == 'PUT']
    assert b''.join(r.content for r in puts) == data
    for r in puts:
        assert 'authorization' not in r.headers and r.headers['content-type'] == 'application/octet-stream'
    for r in fake.requests:
        if r.url.path.startswith('/rest/'):
            assert r.headers['linkedin-version'] == '202610'
            assert r.headers['x-restli-protocol-version'] == '2.0.0'
            assert r.headers['authorization'] == f'Bearer {TOKEN}'
    assert b'/rest/videos/urn%3Ali%3Avideo%3AC5505AQH-test' in next(
        r for r in fake.requests if fake.key(r) == 'video').url.raw_path
    assert fake.body('init') == {'initializeUploadRequest': {'owner': f'urn:li:person:{OWNER}', 'fileSizeBytes': SIZE,
                                                             'uploadCaptions': False, 'uploadThumbnail': False}}
    assert fake.body('finalize') == {'finalizeUploadRequest': {'video': VIDEO_URN, 'uploadToken': 'utok-1',
                                                               'uploadedPartIds': ['etag-0', 'etag-1']}}
    assert fake.body('post') == {
        'author': f'urn:li:person:{OWNER}', 'commentary': r'Use it \(carefully\) #claudecode', 'visibility': 'PUBLIC',
        'distribution': {'feedDistribution': 'MAIN_FEED', 'targetEntities': [], 'thirdPartyDistributionChannels': []},
        'content': {'media': {'title': 'Reverse-engineer a feature', 'id': VIDEO_URN}},
        'lifecycleState': 'PUBLISHED', 'isReshareDisabledByAuthor': False}
    assert result['status'] == 'published' and result['post_urn'] == POST_URN
    assert result['post_url'] == f'https://www.linkedin.com/feed/update/{POST_URN}/'
    assert [e['step'] for e in result['requests']][0] == 'initialize_upload'
    dumped = json.dumps(result)
    assert TOKEN not in dumped and 'SIGNED' not in dumped
    state_text = run.state.read_text()
    state = json.loads(state_text)
    assert state['status'] == 'published' and state['post_urn'] == POST_URN
    assert state['upload']['video_urn'] == VIDEO_URN and state['finalized'] is True
    assert state['video_sha256'] == hashlib.sha256(data).hexdigest()
    assert 'post_attempt' not in state
    assert TOKEN not in state_text
    assert oct(os.stat(run.state).st_mode & 0o777) == '0o600'


def test_rerun_after_publish_returns_saved_post_without_any_request(run):
    run(FakeLinkedIn(), dry_run=False)
    for flag in (False, True):
        result = run(explode, dry_run=flag)
        assert result['status'] == 'already_published' and result['post_urn'] == POST_URN
        assert result['requests'] == []


def test_state_saved_after_each_remote_id_and_resume_uploads_only_missing_parts(run, video):
    broken = FakeLinkedIn(parts=2, fail={'put1': httpx.Response(500, json={'status': 500, 'message': 'boom'})})
    with pytest.raises(li.LinkedInAPIError, match='HTTP 500'):
        run(broken, dry_run=False)
    state = read_state(run.state)
    assert state['upload']['video_urn'] == VIDEO_URN and state['upload']['etags'] == ['etag-0', None]
    assert state['finalized'] is False and 'status' not in state

    dry_fake = FakeLinkedIn(statuses=('WAITING_UPLOAD',))
    planned = run(dry_fake)
    assert dry_fake.sequence() == [('GET', 'userinfo')]      # a dry run on a resumable state still writes nothing
    assert [s['step'] for s in planned['requests']] == ['video_status', 'upload_part', 'finalize_upload',
                                                        'wait_until_available', 'create_post']
    assert planned['requests'][1]['part'] == '2/2'
    assert planned['requests'][1]['url'].endswith('uploadedVideo/1?<redacted>')
    assert planned['requests'][2]['json']['finalizeUploadRequest']['uploadedPartIds'] == ['etag-0', '<ETag of part 2>']
    assert read_state(run.state) == state     # dry run never writes

    fake = FakeLinkedIn(statuses=('WAITING_UPLOAD', 'AVAILABLE'))
    result = run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('PUT', 'put1'), ('POST', 'finalize'),
                               ('GET', 'video'), ('POST', 'post')]
    assert fake.requests[2].content == video.read_bytes()[SIZE // 2:]
    assert fake.body('finalize')['finalizeUploadRequest']['uploadedPartIds'] == ['etag-0', 'etag-1']
    assert result['status'] == 'published'


def test_resume_skips_upload_when_linkedin_already_has_the_file(run):
    with pytest.raises(li.LinkedInTransportError):
        run(FakeLinkedIn(fail={'finalize': httpx.ReadTimeout('timed out')}), dry_run=False)
    fake = FakeLinkedIn(statuses=('PROCESSING', 'AVAILABLE'))
    run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('GET', 'video'), ('POST', 'post')]


# ---------------------------------------------------------------- refusals before any write

def test_identity_mismatch_aborts_before_any_write(run):
    fake = FakeLinkedIn(sub='someoneElse')
    with pytest.raises(li.IdentityMismatchError, match='someoneElse'):
        run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo')]
    assert not run.state.exists()


def test_credential_for_another_member_aborts_before_any_request(run, creds):
    data = json.loads(creds.read_text())
    creds.write_text(json.dumps({**data, 'member_sub': 'someoneElse'}))
    with pytest.raises(li.IdentityMismatchError):
        run(explode, dry_run=False)


def test_expired_token_aborts_before_any_request(run, creds):
    data = json.loads(creds.read_text())
    creds.write_text(json.dumps({**data, 'expires_at_unix': time.time() + 60}))
    with pytest.raises(li.CredentialError, match='renew') as caught:
        run(explode)
    assert TOKEN not in str(caught.value)


def test_missing_scope_aborts_before_any_request(run, creds):
    data = json.loads(creds.read_text())
    creds.write_text(json.dumps({**data, 'scopes': ['openid', 'profile']}))
    with pytest.raises(li.CredentialError, match='w_member_social'):
        run(explode)


def test_missing_linkedin_caption_is_rejected(run):
    with pytest.raises(li.LinkedInError, match='captions.linkedin'):
        run(explode, lesson={'captions': {'linkedin': '  '}})


def test_state_for_a_different_video_is_refused(run, video):
    run.state.write_text(json.dumps({'author': f'urn:li:person:{OWNER}', 'video_sha256': 'f' * 64, 'finalized': False,
                                     'upload': {'video_urn': VIDEO_URN, 'upload_token': 't', 'expires_at_ms': FAR_FUTURE_MS,
                                                'instructions': [], 'etags': []}}))
    with pytest.raises(li.StateError, match='different video'):
        run(explode, dry_run=False)


# ---------------------------------------------------------------- API errors

def test_api_error_surfaces_code_and_message_but_never_the_token(run):
    leak = httpx.Response(403, json={'status': 403, 'serviceErrorCode': 100, 'code': 'ACCESS_DENIED',
                                     'message': f'Not enough permissions to access: partnerApiVideos.ACTION ({TOKEN})'})
    with pytest.raises(li.LinkedInAPIError) as caught:
        run(FakeLinkedIn(fail={'init': leak}), dry_run=False)
    error = caught.value
    assert (error.status, error.code, error.service_error_code) == (403, 'ACCESS_DENIED', 100)
    text = str(error)
    assert 'initialize_upload' in text and 'ACCESS_DENIED' in text and 'Not enough permissions' in text
    assert TOKEN not in text and TOKEN not in repr(error.args) and TOKEN not in (error.message or '')
    assert not run.state.exists()     # no remote id was obtained, so nothing to resume


def test_invalid_token_on_identity_check_is_reported(run):
    bad = httpx.Response(401, json={'serviceErrorCode': 65600, 'message': 'Invalid access token', 'status': 401})
    with pytest.raises(li.LinkedInAPIError, match='65600.*Invalid access token') as caught:
        run(FakeLinkedIn(fail={'userinfo': bad}))
    assert caught.value.status == 401 and TOKEN not in str(caught.value)


def test_transport_error_never_leaks_signed_upload_url(run):
    with pytest.raises(li.LinkedInTransportError) as caught:
        run(FakeLinkedIn(parts=1, fail={'put0': httpx.ConnectError('cannot reach https://www.linkedin.com/x?sau=SIGNED-0')}),
            dry_run=False)
    assert 'SIGNED' not in str(caught.value) and TOKEN not in str(caught.value)


# ---------------------------------------------------------------- never double-post

def test_rejected_post_clears_the_attempt_so_a_retry_can_post(run):
    rejected = httpx.Response(422, json={'status': 422, 'code': 'UNPROCESSABLE_ENTITY', 'message': 'bad commentary'})
    with pytest.raises(li.LinkedInAPIError, match='UNPROCESSABLE_ENTITY'):
        run(FakeLinkedIn(fail={'post': rejected}), dry_run=False)
    state = read_state(run.state)
    assert 'post_attempt' not in state and state['video_status'] == 'AVAILABLE' and 'UNPROCESSABLE' in state['last_error']
    fake = FakeLinkedIn(statuses=('AVAILABLE',))
    assert run(fake, dry_run=False)['post_urn'] == POST_URN
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('POST', 'post')]


@pytest.mark.parametrize('failure', [httpx.Response(500, json={'status': 500, 'message': 'Internal error'}),
                                     httpx.ReadTimeout('timed out')])
def test_unknown_post_outcome_blocks_retry_until_owner_confirms(run, failure):
    with pytest.raises(li.UncertainPostError, match='confirm_not_posted'):
        run(FakeLinkedIn(fail={'post': failure}), dry_run=False)
    assert 'post_attempt' in read_state(run.state)

    blocked = FakeLinkedIn()
    with pytest.raises(li.UncertainPostError):
        run(blocked, dry_run=False)
    assert blocked.sequence() == [('GET', 'userinfo')]
    assert 'confirm_not_posted' in run(FakeLinkedIn())['warnings'][0]

    fake = FakeLinkedIn(statuses=('AVAILABLE',))
    assert run(fake, dry_run=False, confirm_not_posted=True)['status'] == 'published'
    assert [k for m, k in fake.sequence() if m == 'POST'] == ['post']


# ---------------------------------------------------------------- processing

def test_processing_failure_abandons_the_video_and_next_run_starts_fresh(run):
    with pytest.raises(li.VideoProcessingError, match='UNSUPPORTED_FORMAT'):
        run(FakeLinkedIn(statuses=('PROCESSING_FAILED',)), dry_run=False)
    state = read_state(run.state)
    assert 'upload' not in state and state['abandoned_videos'][0]['video_urn'] == VIDEO_URN
    fake = FakeLinkedIn(video_urn='urn:li:video:second', statuses=('AVAILABLE',))
    assert run(fake, dry_run=False)['video_urn'] == 'urn:li:video:second'
    assert ('POST', 'init') in fake.sequence()


def test_processing_timeout_keeps_state_for_a_later_resume(run):
    ticks = itertools.count(0, 100)
    with pytest.raises(li.VideoProcessingError, match='still PROCESSING'):
        run(FakeLinkedIn(statuses=('PROCESSING',)), dry_run=False, clock=lambda: next(ticks), processing_timeout=250)
    state = read_state(run.state)
    assert state['finalized'] is True and state['upload']['video_urn'] == VIDEO_URN
    fake = FakeLinkedIn(statuses=('AVAILABLE',))
    run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('POST', 'post')]


def test_expired_upload_urls_start_a_new_upload(run, video):
    run.state.write_text(json.dumps({
        'author': f'urn:li:person:{OWNER}', 'video_sha256': hashlib.sha256(video.read_bytes()).hexdigest(),
        'finalized': False, 'upload': {'video_urn': 'urn:li:video:old', 'upload_token': 't', 'expires_at_ms': 1000,
                                       'instructions': [{'url': 'https://www.linkedin.com/u/0?sau=x', 'first': 0,
                                                         'last': SIZE - 1}], 'etags': [None]}}))
    fake = FakeLinkedIn(statuses=('AVAILABLE',))
    run(fake, dry_run=False)
    assert fake.sequence()[:2] == [('GET', 'userinfo'), ('POST', 'init')]
    assert read_state(run.state)['abandoned_videos'][0]['video_urn'] == 'urn:li:video:old'


def test_expired_upload_url_on_put_abandons_upload_so_rerun_starts_fresh(run):
    expired = httpx.Response(401, text='Unauthorized')
    with pytest.raises(li.LinkedInAPIError, match='HTTP 401'):
        run(FakeLinkedIn(parts=2, fail={'put1': expired}), dry_run=False)
    state = read_state(run.state)
    assert 'upload' not in state and state['abandoned_videos'][0]['video_urn'] == VIDEO_URN
    fake = FakeLinkedIn(video_urn='urn:li:video:fresh', statuses=('AVAILABLE',))
    assert run(fake, dry_run=False)['video_urn'] == 'urn:li:video:fresh'
    assert fake.sequence()[:2] == [('GET', 'userinfo'), ('POST', 'init')]


def test_finalize_401_is_a_token_problem_and_keeps_the_upload(run):
    with pytest.raises(li.LinkedInAPIError, match='HTTP 401'):
        run(FakeLinkedIn(fail={'finalize': httpx.Response(401, json={'status': 401, 'message': 'Invalid token'})}),
            dry_run=False)
    state = read_state(run.state)
    assert state['upload']['video_urn'] == VIDEO_URN and state['upload']['etags'] == ['etag-0', 'etag-1']


# ---------------------------------------------------------------- status GET refused (w_member_social is write-only)

FORBIDDEN = httpx.Response(403, json={'status': 403, 'serviceErrorCode': 100, 'code': 'ACCESS_DENIED',
                                      'message': 'Not enough permissions to access: partnerApiVideos.GET'})


def test_forbidden_status_check_waits_a_fixed_time_then_posts_once(run):
    slept = []
    fake = FakeLinkedIn(fail={'video': FORBIDDEN})
    result = run(fake, dry_run=False, sleep=slept.append, status_forbidden_wait=42)
    assert fake.sequence() == [('GET', 'userinfo'), ('POST', 'init'), ('PUT', 'put0'), ('PUT', 'put1'),
                               ('POST', 'finalize'), ('GET', 'video'), ('POST', 'post')]
    assert slept == [42]
    assert result['status'] == 'published' and '403' in result['warnings'][0]
    assert read_state(run.state)['video_status'] == 'UNCONFIRMED'


def test_forbidden_status_then_post_refused_as_still_processing_allows_a_clean_retry(run):
    waiting = httpx.Response(400, json={'status': 400, 'code': 'MEDIA_ASSET_WAITING_UPLOAD',
                                        'message': 'Media asset is waiting upload'})
    with pytest.raises(li.LinkedInAPIError, match='MEDIA_ASSET_WAITING_UPLOAD'):
        run(FakeLinkedIn(fail={'video': FORBIDDEN, 'post': waiting}), dry_run=False)
    assert 'post_attempt' not in read_state(run.state)
    fake = FakeLinkedIn(fail={'video': FORBIDDEN})
    assert run(fake, dry_run=False)['status'] == 'published'
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('POST', 'post')]


def test_forbidden_status_on_resume_uploads_the_missing_parts(run, video):
    with pytest.raises(li.LinkedInAPIError):
        run(FakeLinkedIn(parts=2, fail={'put1': httpx.Response(500)}), dry_run=False)
    fake = FakeLinkedIn(fail={'video': FORBIDDEN}, statuses=('AVAILABLE',))
    run(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('GET', 'video'), ('PUT', 'put1'), ('POST', 'finalize'),
                               ('GET', 'video'), ('POST', 'post')]


def test_status_errors_other_than_403_still_stop_before_posting(run):
    with pytest.raises(li.LinkedInAPIError, match='HTTP 404'):
        run(FakeLinkedIn(fail={'video': httpx.Response(404, json={'status': 404, 'code': 'NOT_FOUND'})}),
            dry_run=False)
    assert 'post_attempt' not in read_state(run.state)


def test_polling_backs_off_to_the_cap(run):
    slept = []
    statuses = ('PROCESSING',) * 6 + ('AVAILABLE',)
    run(FakeLinkedIn(statuses=statuses), dry_run=False, sleep=slept.append, poll_seconds=5)
    assert slept == [5, 10, 20, 30, 30, 30]


# ---------------------------------------------------------------- concurrency and post ids

def test_a_second_real_run_is_refused_while_one_holds_the_lock(run):
    import fcntl
    lock = run.state.with_name(run.state.name + '.lock')
    fd = os.open(lock, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        with pytest.raises(li.StateError, match='already running'):
            run(explode, dry_run=False)
        assert run(FakeLinkedIn())['status'] == 'planned'      # dry runs never take the lock
    finally:
        os.close(fd)
    assert run(FakeLinkedIn(), dry_run=False)['status'] == 'published'


def test_percent_encoded_post_id_header_is_decoded(run):
    encoded = httpx.Response(201, headers={'x-restli-id': 'urn%3Ali%3Ashare%3A7380000000000000001'})
    result = run(FakeLinkedIn(fail={'post': encoded}), dry_run=False)
    assert result['post_urn'] == POST_URN and result['post_url'].endswith(f'/{POST_URN}/')


def test_already_published_warns_when_the_video_file_changed(run, video):
    run(FakeLinkedIn(), dry_run=False)
    video.write_bytes(video.read_bytes()[::-1])
    result = run(explode, dry_run=False)
    assert result['status'] == 'already_published' and result['requests'] == []
    assert 'second LinkedIn post' in result['warnings'][0]


# ---------------------------------------------------------------- video and text checks

@pytest.mark.parametrize('change, message', [
    (lambda p: p['streams'][0].update(codec_name='hevc'), 'video codec must be h264'),
    (lambda p: p['streams'][0].update(width=1280, height=720), 'aspect ratio must be 9:16'),
    (lambda p: p['format'].update(duration='2.0'), 'duration 2.00 s'),
    (lambda p: p['format'].update(duration='1900'), 'duration 1900.00 s'),
    (lambda p: p['streams'].pop(1), 'no audio stream'),
    (lambda p: p['streams'][1].update(codec_name='mp3'), 'audio codec must be aac'),
    (lambda p: p['format']['tags'].update(major_brand='qt  '), 'container must be MP4'),
    (lambda p: p['format'].update(format_name='matroska,webm'), 'container must be MP4'),
])
def test_video_validation_rejects_bad_input_before_any_request(run, change, message):
    probe = json.loads(json.dumps(PROBE))
    change(probe)
    with pytest.raises(li.VideoValidationError, match=message):
        li.validate_video(run.state.parent / 'final.mp4', probe)


def test_video_validation_checks_file_size(tmp_path):
    tiny = tmp_path / 'tiny.mp4'
    tiny.write_bytes(b'x' * 1000)
    with pytest.raises(li.VideoValidationError, match='file size 1000 bytes'):
        li.validate_video(tiny, PROBE)


def test_invalid_video_stops_publish_before_network(video, creds, tmp_path):
    probe = json.loads(json.dumps(PROBE))
    probe['streams'][0]['codec_name'] = 'vp9'
    with pytest.raises(li.VideoValidationError):
        li.publish(video, LESSON, dry_run=False, state_path=tmp_path / 's.json', credentials_path=creds,
                   transport=httpx.MockTransport(explode), probe=lambda p: probe)


def test_escape_little_escapes_reserved_characters_but_keeps_hashtags():
    text = 'Ship it (today) #buildinpublic, C# and a_b @me [x] {y} <z> | * ~ \\ #2026'
    assert li.escape_little(text) == (r'Ship it \(today\) #buildinpublic, C\# and a\_b \@me \[x\] \{y\} \<z\> \| '
                                      r'\* \~ \\ \#2026')
    assert li.escape_little('plain words, quotes "ok" and colons: fine.') == 'plain words, quotes "ok" and colons: fine.'


def test_real_ffprobe_reads_a_generated_clip(tmp_path):
    import shutil
    import subprocess
    if not shutil.which('ffmpeg'):
        pytest.skip('ffmpeg not installed')
    clip = tmp_path / 'clip.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30', '-f', 'lavfi',
                    '-i', 'sine=frequency=440', '-t', '4', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                    '-shortest', str(clip)], check=True)
    info = li.ffprobe(clip)
    if clip.stat().st_size < li.MIN_BYTES:
        pytest.skip('generated clip is under LinkedIn minimum size')
    summary = li.validate_video(clip, info)
    assert (summary['width'], summary['height'], summary['video_codec'], summary['audio_codec']) == (360, 640, 'h264', 'aac')


# ---------------------------------------------------------------- thumbnail (uploadThumbnail)

@pytest.fixture
def cover(tmp_path):
    path = tmp_path / 'cover_720x1280.jpg'
    path.write_bytes(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00' + bytes(range(256)) * 4 + b'\xff\xd9')
    return path


def test_dry_run_plans_the_thumbnail_put_before_finalize(run, cover):
    fake = FakeLinkedIn()
    result = run(fake, thumbnail_path=cover)
    assert [(r.method, str(r.url)) for r in fake.requests] == [('GET', li.USERINFO_URL)]
    plan = result['requests']
    assert [s['step'] for s in plan] == ['initialize_upload', 'upload_part', 'upload_thumbnail', 'finalize_upload',
                                         'wait_until_available', 'create_post']
    assert plan[0]['json']['initializeUploadRequest']['uploadThumbnail'] is True
    thumb = plan[2]
    assert thumb['method'] == 'PUT' and thumb['url'] == '<thumbnailUploadUrl from initializeUpload>'
    assert thumb['headers'] == {'Content-Type': 'application/octet-stream', 'media-type-family': 'STILLIMAGE'}
    assert thumb['size'] == cover.stat().st_size and result['thumbnail']['path'] == str(cover)


def test_thumbnail_is_uploaded_before_finalize_and_recorded(run, cover):
    fake = FakeLinkedIn(parts=2)
    result = run(fake, dry_run=False, thumbnail_path=cover)
    assert fake.sequence() == [('GET', 'userinfo'), ('POST', 'init'), ('PUT', 'put0'), ('PUT', 'put1'),
                               ('PUT', 'putthumb'), ('POST', 'finalize'), ('GET', 'video'), ('GET', 'video'),
                               ('POST', 'post')]
    assert fake.body('init')['initializeUploadRequest']['uploadThumbnail'] is True
    put = next(r for r in fake.requests if fake.key(r) == 'putthumb')
    assert str(put.url) == THUMB_UPLOAD_URL and put.content == cover.read_bytes()
    assert put.headers['content-type'] == 'application/octet-stream'
    assert put.headers['media-type-family'] == 'STILLIMAGE' and 'authorization' not in put.headers
    assert result['status'] == 'published' and result['warnings'] == []
    logged = next(e for e in result['requests'] if e['step'] == 'upload_thumbnail')
    assert logged['status'] == 201 and logged['url'].endswith('/uploadedThumbnail/thumb?<redacted>')
    assert 'SIGNED' not in json.dumps(result) and TOKEN not in json.dumps(result)
    upload = read_state(run.state)['upload']
    assert upload['thumbnail_uploaded'] is True and upload['thumbnail_sha256'] == hashlib.sha256(
        cover.read_bytes()).hexdigest()


@pytest.mark.parametrize('failure', [
    httpx.Response(400, json={'message': f'bad image at {THUMB_UPLOAD_URL}', 'status': 400}),
    httpx.Response(500),
    httpx.ConnectError(f'reset while sending to {THUMB_UPLOAD_URL}'),
    httpx.InvalidURL(f'invalid URL {THUMB_UPLOAD_URL}'),   # not an httpx.HTTPError: still only a warning
    ValueError(f'unexpected failure for {THUMB_UPLOAD_URL}')])
def test_thumbnail_failure_never_blocks_the_post(run, cover, failure):
    fake = FakeLinkedIn(parts=1, fail={'putthumb': failure})
    result = run(fake, dry_run=False, thumbnail_path=cover)
    assert fake.sequence()[-5:] == [('PUT', 'putthumb'), ('POST', 'finalize'), ('GET', 'video'), ('GET', 'video'),
                                    ('POST', 'post')]
    assert result['status'] == 'published' and result['post_urn'] == POST_URN
    assert len(result['warnings']) == 1 and 'thumbnail not uploaded' in result['warnings'][0]
    upload = read_state(run.state)['upload']
    # The state file keeps signed URLs only as resume targets (mode 600); the error text and the result never do.
    dumped = json.dumps(result) + upload['thumbnail_error']
    assert 'SIGNED' not in dumped and TOKEN not in dumped
    assert 'thumbnail_uploaded' not in upload


def test_unusable_thumbnail_is_skipped_and_the_post_goes_out(run, tmp_path):
    png = tmp_path / 'cover.png'
    png.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 40)
    fake = FakeLinkedIn(parts=1)
    result = run(fake, dry_run=False, thumbnail_path=png)
    assert fake.body('init')['initializeUploadRequest']['uploadThumbnail'] is False
    assert 'putthumb' not in [k for _, k in fake.sequence()] and result['status'] == 'published'
    assert result['warnings'] == ['LinkedIn thumbnail skipped: cover.png is not a JPEG']


def test_resumed_upload_started_without_thumbnail_warns_and_posts(run, cover):
    broken = httpx.Response(500, json={'message': 'try later'})
    with pytest.raises(li.LinkedInAPIError):
        run(FakeLinkedIn(parts=1, fail={'finalize': broken}), dry_run=False)   # no thumbnail asked for
    fake = FakeLinkedIn(parts=1, statuses=('WAITING_UPLOAD', 'AVAILABLE'))
    result = run(fake, dry_run=False, thumbnail_path=cover)
    assert 'init' not in [k for _, k in fake.sequence()] and 'putthumb' not in [k for _, k in fake.sequence()]
    assert result['status'] == 'published'
    assert any('started without uploadThumbnail' in w for w in result['warnings'])


def test_thumbnail_put_answered_200_counts_as_uploaded(run, cover):
    fake = FakeLinkedIn(parts=1, fail={'putthumb': httpx.Response(200)})   # same upload host as the parts (200/201)
    result = run(fake, dry_run=False, thumbnail_path=cover)
    assert result['status'] == 'published' and result['warnings'] == []
    upload = read_state(run.state)['upload']
    assert upload['thumbnail_uploaded'] is True and 'thumbnail_error' not in upload


def test_thumbnail_sends_the_bytes_that_were_checked(run, cover, monkeypatch):
    original = cover.read_bytes()
    checked = li.validate_thumbnail(cover)
    assert json.loads(json.dumps(checked[0])) == {'path': str(cover), 'size': len(original),
                                                  'sha256': hashlib.sha256(original).hexdigest()}   # no bytes in JSON
    real_upload_part = li.LinkedInClient.upload_part

    def upload_part(self, url, data, step='upload_part'):
        cover.write_bytes(b'\xff\xd8\xff re-exported while the video uploads')   # a later cover build
        return real_upload_part(self, url, data, step)
    monkeypatch.setattr(li.LinkedInClient, 'upload_part', upload_part)
    fake = FakeLinkedIn(parts=1)
    run(fake, dry_run=False, thumbnail_path=cover)
    put = next(r for r in fake.requests if fake.key(r) == 'putthumb')
    assert put.content == original
    assert read_state(run.state)['upload']['thumbnail_sha256'] == hashlib.sha256(original).hexdigest()


def test_captions_uploaded_before_finalize_and_post(run, tmp_path):
    caption = tmp_path / 'en.srt'
    caption.write_text('1\n00:00:00,000 --> 00:00:01,000\nHello\n')
    class CaptionsFake(FakeLinkedIn):
        def __call__(self, request):
            if request.url.path.endswith('/captions'):
                self.requests.append(request)
                assert request.method == 'POST'
                assert b'Hello' in request.content and b'USER_PROVIDED' in request.content
                assert 'multipart/form-data' in request.headers['content-type']
                return httpx.Response(201)
            response = super().__call__(request)
            if self.key(request) == 'init':
                body = response.json()
                assert json.loads(request.content)['initializeUploadRequest']['uploadCaptions']
                body['value']['captionsUploadUrl'] = 'https://www.linkedin.com/dms-mpf-uploads/captions'
                return httpx.Response(200, json=body)
            return response
    fake = CaptionsFake(parts=1)
    result = run(fake, dry_run=False, lesson=dict(LESSON, caption_file=str(caption)))
    assert result['status'] == 'published'
    assert read_state(run.state)['captions_uploaded']
    steps = [fake.key(r) for r in fake.requests]
    assert steps.index('putcaptions') < steps.index('finalize') < steps.index('post')


def test_long_form_landscape_is_explicit(video):
    info = json.loads(json.dumps(PROBE))
    info['streams'][0].update(width=1920, height=1080)
    info['format']['duration'] = '1742.453'
    assert li.validate_video(video, info, long_form=True)['duration_s'] == 1742.453
    with pytest.raises(li.VideoValidationError):
        li.validate_video(video, info)
    info['format']['duration'] = '1801'
    with pytest.raises(li.VideoValidationError, match='duration'):
        li.validate_video(video, info, long_form=True)


# ---------------------------------------------------------------- document (PDF carousel) posts

DOC_URN = 'urn:li:document:D5510AQ-test'
DOC_UPLOAD_URL = 'https://www.linkedin.com/dms-uploads/D5510AQ/ads-uploadedDocument/0?ut=SIGNED-DOC'


class FakeDocuments:
    def __init__(self, statuses=('PROCESSING', 'AVAILABLE'), fail=None, expires=None):
        self.statuses, self.fail, self.requests = list(statuses), dict(fail or {}), []
        self.expires = FAR_FUTURE_MS if expires is None else expires

    @staticmethod
    def key(request):
        if request.url.host == 'www.linkedin.com':
            return 'put'
        path = request.url.path
        if path == '/v2/userinfo':
            return 'userinfo'
        if path == '/rest/documents' and request.url.params.get('action') == 'initializeUpload':
            return 'init'
        if path.startswith('/rest/documents/'):
            return 'status'
        if path == '/rest/posts':
            return 'post'
        raise AssertionError(f'unexpected request {request.method} {request.url}')

    def sequence(self):
        return [(r.method, self.key(r)) for r in self.requests]

    def __call__(self, request):
        self.requests.append(request)
        key = self.key(request)
        if key in self.fail:
            outcome = self.fail.pop(key)
            if isinstance(outcome, Exception):
                raise outcome
            return outcome
        if key == 'userinfo':
            return httpx.Response(200, json={'sub': OWNER, 'name': 'Hammad Yousuf'})
        if key == 'init':
            return httpx.Response(200, json={'value': {'uploadUrlExpiresAt': self.expires, 'uploadUrl': DOC_UPLOAD_URL,
                                                       'document': DOC_URN}})
        if key == 'put':
            return httpx.Response(201)
        if key == 'status':
            status = self.statuses.pop(0) if len(self.statuses) > 1 else self.statuses[0]
            return httpx.Response(200, json={'id': DOC_URN, 'status': status})
        if key == 'post':
            return httpx.Response(201, headers={'x-restli-id': POST_URN})


@pytest.fixture
def pdf(tmp_path):
    path = tmp_path / 'carousel' / 'carousel-linkedin.pdf'
    path.parent.mkdir()
    path.write_bytes(b'%PDF-1.7\n' + b'1 0 obj << /Type /Page >> endobj\n' * 10 + b'%%EOF\n')
    return path


@pytest.fixture
def run_doc(pdf, creds, tmp_path):
    state = tmp_path / 'publish_linkedin_carousel.json'

    def _run(fake, **kwargs):
        kwargs.setdefault('state_path', state)
        kwargs.setdefault('sleep', lambda s: None)
        return li.publish_document(pdf, kwargs.pop('lesson', LESSON), credentials_path=creds,
                                   transport=httpx.MockTransport(fake), **kwargs)
    _run.state = state
    return _run


def test_document_dry_run_sends_only_the_identity_get(run_doc):
    fake = FakeDocuments()
    plan = run_doc(fake, title='AI traffic in GA4')
    assert fake.sequence() == [('GET', 'userinfo')] and not run_doc.state.exists()
    assert plan['status'] == 'planned' and plan['kind'] == 'document' and plan['document']['pages'] == 10
    assert [r['step'] for r in plan['requests']] == ['initialize_document_upload', 'upload_document',
                                                     'wait_until_available', 'create_post']
    post = plan['requests'][-1]['json']
    assert post['content']['media']['title'] == 'AI traffic in GA4'
    assert post['commentary'] == 'Use it \\(carefully\\) #claudecode'
    assert TOKEN not in json.dumps(plan)


def test_document_post_initializes_uploads_waits_and_posts_once(run_doc, pdf):
    fake = FakeDocuments()
    result = run_doc(fake, dry_run=False)
    assert fake.sequence() == [('GET', 'userinfo'), ('POST', 'init'), ('PUT', 'put'), ('GET', 'status'),
                               ('GET', 'status'), ('POST', 'post')]
    init = json.loads(fake.requests[1].content)
    assert init == {'initializeUploadRequest': {'owner': f'urn:li:person:{OWNER}'}}
    put = fake.requests[2]
    assert put.content == pdf.read_bytes() and put.headers['authorization'] == f'Bearer {TOKEN}'
    status = fake.requests[3]
    assert status.url.raw_path.decode().endswith('urn%3Ali%3Adocument%3AD5510AQ-test')
    assert status.headers['linkedin-version'] == li.LINKEDIN_VERSION
    body = json.loads(fake.requests[-1].content)
    assert body['content'] == {'media': {'title': LESSON['topic_title'], 'id': DOC_URN}}
    assert body['author'] == f'urn:li:person:{OWNER}' and body['lifecycleState'] == 'PUBLISHED'
    assert result['status'] == 'published' and result['post_urn'] == POST_URN and result['document_urn'] == DOC_URN
    state = read_state(run_doc.state)
    assert state['status'] == 'published' and state['document']['uploaded'] and 'upload_url' not in state['document']
    assert 'post_attempt' not in state and TOKEN not in run_doc.state.read_text()
    again = run_doc(FakeDocuments(), dry_run=False)
    assert again['status'] == 'already_published' and again['post_urn'] == POST_URN


def test_document_unknown_post_outcome_needs_the_owner(run_doc):
    fake = FakeDocuments(fail={'post': httpx.Response(502, json={'message': 'gateway'})})
    with pytest.raises(li.UncertainPostError):
        run_doc(fake, dry_run=False)
    assert read_state(run_doc.state)['post_attempt']['document_urn'] == DOC_URN
    blocked = FakeDocuments()
    with pytest.raises(li.UncertainPostError):
        run_doc(blocked, dry_run=False)
    assert ('POST', 'post') not in blocked.sequence()
    resumed = FakeDocuments(statuses=("AVAILABLE",))
    result = run_doc(resumed, dry_run=False, confirm_not_posted=True)
    assert result['status'] == 'published'
    assert resumed.sequence() == [('GET', 'userinfo'), ('GET', 'status'), ('POST', 'post')]   # no second upload


def test_document_expired_upload_url_starts_over_and_processing_failure_abandons(run_doc):
    fake = FakeDocuments(fail={'put': httpx.Response(401, text='expired')})
    with pytest.raises(li.LinkedInAPIError):
        run_doc(fake, dry_run=False)
    state = read_state(run_doc.state)
    assert 'document' not in state and state['abandoned_documents'][0]['urn'] == DOC_URN
    failing = FakeDocuments(statuses=('PROCESSING_FAILED',))
    with pytest.raises(li.VideoProcessingError):
        run_doc(failing, dry_run=False)
    assert 'document' not in read_state(run_doc.state)
    ok = run_doc(FakeDocuments(), dry_run=False)
    assert ok['status'] == 'published'


def test_document_status_403_waits_then_posts(run_doc):
    waits = []
    fake = FakeDocuments(fail={'status': httpx.Response(403, json={'message': 'forbidden'})})
    result = run_doc(fake, dry_run=False, sleep=waits.append, status_forbidden_wait=7)
    assert result['status'] == 'published' and waits == [7]
    assert any('403' in w for w in result['warnings'])


def test_document_validation(tmp_path, run_doc, pdf):
    bad = tmp_path / 'x.pdf'
    bad.write_bytes(b'not a pdf')
    with pytest.raises(li.LinkedInError, match='not a PDF'):
        li.validate_document(bad)
    with pytest.raises(li.LinkedInError, match='title'):
        run_doc(FakeDocuments(), lesson={'captions': {'linkedin': 'x'}})
    pdf.write_bytes(b'%PDF-1.7\n' + b'<< /Type /Page >>\n' * 301)
    with pytest.raises(li.LinkedInError, match='301 pages'):
        li.validate_document(pdf)
