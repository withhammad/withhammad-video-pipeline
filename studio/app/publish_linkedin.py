"""Publish a finished reel to LinkedIn as a native feed video posted by the owner's member profile.

Verified against Microsoft Learn (LinkedIn Marketing docs) on 2026-10-17. The versioning page lists
202610 (October 2026) as the latest version; 202511 sunsets on 2026-11-16.
  community-management/shares/{videos-api, posts-api, post-api-schema, little-text-format}, versioning,
  consumer/integrations/self-serve/sign-in-with-linkedin-v2.

  GET  https://api.linkedin.com/v2/userinfo                         OIDC identity {sub, name, ...}
  POST https://api.linkedin.com/rest/videos?action=initializeUpload  {"initializeUploadRequest": {owner,
       fileSizeBytes, uploadCaptions, uploadThumbnail}} -> {"value": {video, uploadToken, uploadUrlsExpireAt,
       uploadInstructions: [{uploadUrl, firstByte, lastByte}]}}            (parts are 4 MB byte ranges)
  PUT  <uploadUrl>  Content-Type: application/octet-stream, the part's bytes -> ETag response header.
       The docs' video upload sample sends no Authorization header; expired upload URLs answer 401.
  PUT  <thumbnailUploadUrl>  (returned when uploadThumbnail is true) Content-Type: application/octet-stream,
       media-type-family: STILLIMAGE, the cover JPEG -> 201 in the docs' sample (200 is accepted too, as for the
       video parts on the same upload host); sent before finalizeUpload. The video's own size and
       aspect (cover_720x1280.jpg). A thumbnail failure is logged as a warning and never blocks the post.
  POST https://api.linkedin.com/rest/videos?action=finalizeUpload    {"finalizeUploadRequest": {video,
       uploadToken, uploadedPartIds: [ETag, ...] in upload-instruction order}}
  GET  https://api.linkedin.com/rest/videos/{url-encoded video URN}  status WAITING_UPLOAD | PROCESSING |
       AVAILABLE | PROCESSING_FAILED (+ processingFailureReason)
  POST https://api.linkedin.com/rest/posts  {author, commentary (little text), visibility, distribution
       {feedDistribution, targetEntities, thirdPartyDistributionChannels}, content {media {title, id}},
       lifecycleState, isReshareDisabledByAuthor} -> 201, post URN in the x-restli-id response header,
       viewable at https://www.linkedin.com/feed/update/{urn}/
  Every /rest call carries Linkedin-Version: YYYYMM and X-Restli-Protocol-Version: 2.0.0. Scope: w_member_social.
  Video limits on the Videos API page: MP4, 3 s to 30 min, 75 KB to 500 MB.
  The Images API page warns that w_member_social is write-only for versioned GETs ("tokens with only
  w_member_social permissions would be unable to perform a GET call for rest/images"). If GET /rest/videos/{urn}
  answers 403 for the same reason, the status checks fall back to a fixed wait and let the post call decide;
  a post refused with 4xx (e.g. MEDIA_ASSET_WAITING_UPLOAD) creates nothing and can be retried.

Nothing is posted unless publish() is called with dry_run=False. Progress is written to a state file
(mode 600, next to the video by default) right after every remote id, so a rerun resumes and never posts twice.
A real run holds an exclusive lock on <state>.lock, so two runs can never post the same video at once."""
import contextlib
import fcntl
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import time
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit, urlunsplit

import httpx

REPO_ROOT = Path(__file__).resolve().parents[2]
CREDENTIALS_PATH = Path(os.environ.get('STUDIO_LINKEDIN_CREDENTIALS', REPO_ROOT / 'work/.secrets/linkedin-oauth.json'))
LINKEDIN_VERSION = os.environ.get('STUDIO_LINKEDIN_VERSION', '202610')
OWNER_SUB = os.environ.get('STUDIO_LINKEDIN_MEMBER_SUB', 'yWP7me7dep')
PROFILE_ACTIVITY_URL = 'https://www.linkedin.com/in/withhammad/recent-activity/all/'
STATE_FILENAME = 'publish_linkedin.json'

API = 'https://api.linkedin.com'
USERINFO_URL = f'{API}/v2/userinfo'
VIDEOS_URL = f'{API}/rest/videos'
INITIALIZE_URL = f'{VIDEOS_URL}?action=initializeUpload'
FINALIZE_URL = f'{VIDEOS_URL}?action=finalizeUpload'
POSTS_URL = f'{API}/rest/posts'
REQUIRED_SCOPE = 'w_member_social'

PART_SIZE = 4 * 1024 * 1024
THUMBNAIL_HEADERS = {'Content-Type': 'application/octet-stream', 'media-type-family': 'STILLIMAGE'}
MIN_BYTES, MAX_BYTES = 75 * 1024, 500 * 1000 * 1000
MIN_SECONDS, MAX_SECONDS = 3.0, 30 * 60.0
ASPECT, ASPECT_TOLERANCE = 9 / 16, 0.01
EXPIRY_MARGIN_S = 3600          # refuse a token that expires within the hour a publish can take
UPLOAD_URL_MARGIN_MS = 10 * 60 * 1000
POLL_SECONDS = float(os.environ.get('STUDIO_LINKEDIN_POLL_SECONDS', '5'))
MAX_POLL_SECONDS = 30.0         # poll interval doubles up to this: member rate limits are per day and unpublished
PROCESSING_TIMEOUT = float(os.environ.get('STUDIO_LINKEDIN_PROCESSING_TIMEOUT', '900'))
STATUS_FORBIDDEN_WAIT = float(os.environ.get('STUDIO_LINKEDIN_STATUS_FORBIDDEN_WAIT', '90'))
REDACTED = '<redacted>'


class LinkedInError(RuntimeError):
    """Base class; messages never contain the access token."""


class VideoValidationError(LinkedInError):
    pass


class CredentialError(LinkedInError):
    pass


class IdentityMismatchError(LinkedInError):
    pass


class StateError(LinkedInError):
    pass


class UncertainPostError(StateError):
    """A post request may have reached LinkedIn without us learning the result; never retried automatically."""


class LinkedInTransportError(LinkedInError):
    pass


class VideoProcessingError(LinkedInError):
    pass


class LinkedInAPIError(LinkedInError):
    def __init__(self, step, method, url, status, code=None, service_error_code=None, message=None):
        self.step, self.method, self.url, self.status = step, method, url, status
        self.code, self.service_error_code, self.message = code, service_error_code, message
        detail = code or 'no code'
        if service_error_code is not None:
            detail += f' (serviceErrorCode {service_error_code})'
        super().__init__(f'LinkedIn {step} failed: {method} {url} -> HTTP {status} {detail}: {message or "no message"}')


# ---------------------------------------------------------------- helpers

def safe_url(url):
    """api.linkedin.com URLs carry no secrets in the query; upload URLs carry signatures, so drop their query."""
    parts = urlsplit(str(url))
    if parts.hostname == 'api.linkedin.com':
        return urlunsplit(parts._replace(fragment=''))
    return urlunsplit(parts._replace(query=REDACTED if parts.query else '', fragment=''))


_URL_QUERY = re.compile(r'(https?://[^\s?#\'"]+)\?[^\s\'")]+')


def _redact(text, *secrets):
    """Remove the given secrets and the query string of any URL (upload URLs carry signatures)."""
    text = str(text)
    for secret in secrets:
        if secret:
            text = text.replace(secret, REDACTED)
    return _URL_QUERY.sub(lambda m: m.group(1) + '?' + REDACTED, text)


def _public_headers(headers):
    return {k: ('Bearer ' + REDACTED if k.lower() == 'authorization' else v) for k, v in (headers or {}).items()}


_RESERVED = set('|{}@[]()<>#\\*_~')
_HASHTAG = re.compile(r'(?<!\S)#(?=[^\W\d_])')   # '#' at a word start followed by a letter = a hashtag


def escape_little(text):
    """Escape every little-format reserved character (| { } @ [ ] ( ) < > # \\ * _ ~) with a backslash, as the
    little Text Format page requires, but keep '#word' hashtags (the documented HashtagElement) intact."""
    keep = {m.start() for m in _HASHTAG.finditer(text)}
    return ''.join('\\' + ch if ch in _RESERVED and i not in keep else ch for i, ch in enumerate(text))


def build_commentary(lesson):
    text = ((lesson or {}).get('captions') or {}).get('linkedin') or ''
    if not text.strip():
        raise LinkedInError('lesson.captions.linkedin is empty; nothing to post as commentary')
    return escape_little(text.strip())


def ffprobe(path):
    binary = shutil.which('ffprobe') or '/opt/homebrew/bin/ffprobe'
    cmd = [binary, '-v', 'error', '-show_entries',
           'format=format_name,duration,size:format_tags=major_brand:'
           'stream=index,codec_type,codec_name,width,height,sample_aspect_ratio', '-of', 'json', str(path)]
    process = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if process.returncode:
        raise VideoValidationError(f'ffprobe could not read {path}: {process.stderr.strip()[-300:]}')
    return json.loads(process.stdout)


def _ratio(value, default=1.0):
    try:
        num, den = (float(x) for x in str(value).split(':'))
        return num / den if num and den else default
    except (TypeError, ValueError):
        return default


def validate_video(path, info, *, long_form=False):
    """Check the probe against LinkedIn's limits and our 9:16 reel format; raise with every problem at once."""
    path = Path(path)
    if not path.is_file():
        raise VideoValidationError(f'Video not found: {path}')
    size = path.stat().st_size
    fmt = info.get('format') or {}
    streams = info.get('streams') or []
    videos = [s for s in streams if s.get('codec_type') == 'video']
    audios = [s for s in streams if s.get('codec_type') == 'audio']
    problems = []
    if path.suffix.lower() != '.mp4' or 'mp4' not in (fmt.get('format_name') or '') \
            or (fmt.get('tags') or {}).get('major_brand', '').strip() == 'qt':
        problems.append(f"container must be MP4 (got {fmt.get('format_name')!r}, file {path.name})")
    if not MIN_BYTES <= size <= MAX_BYTES:
        problems.append(f'file size {size} bytes is outside LinkedIn limits {MIN_BYTES}..{MAX_BYTES}')
    duration = float(fmt.get('duration') or 0)
    if not MIN_SECONDS <= duration <= MAX_SECONDS:
        problems.append(f'duration {duration:.2f} s is outside LinkedIn limits {MIN_SECONDS:.0f} s..{MAX_SECONDS:.0f} s')
    width = height = None
    if len(videos) != 1:
        problems.append(f'expected exactly one video stream, found {len(videos)}')
    else:
        video = videos[0]
        if video.get('codec_name') != 'h264':
            problems.append(f"video codec must be h264 (got {video.get('codec_name')})")
        width, height = int(video.get('width') or 0), int(video.get('height') or 0)
        if not width or not height:
            problems.append('video stream has no dimensions')
        else:
            aspect = width * _ratio(video.get('sample_aspect_ratio')) / height
            if long_form and abs(aspect - 16 / 9) / (16 / 9) <= ASPECT_TOLERANCE:
                pass
            elif abs(aspect - ASPECT) / ASPECT > ASPECT_TOLERANCE:
                problems.append(f'aspect ratio must be 9:16 portrait (got {width}x{height}, {aspect:.3f})')
    if not audios:
        problems.append('no audio stream (the reel needs its voice track)')
    elif any(a.get('codec_name') != 'aac' for a in audios):
        problems.append(f"audio codec must be aac (got {', '.join(str(a.get('codec_name')) for a in audios)})")
    if problems:
        raise VideoValidationError(f'{path.name} cannot be posted to LinkedIn: ' + '; '.join(problems))
    return {'path': str(path), 'size': size, 'duration_s': round(duration, 3), 'width': width, 'height': height,
            'video_codec': 'h264', 'audio_codec': 'aac'}


def load_credentials(path, now=time.time):
    path = Path(path)
    try:
        data = json.loads(path.read_text())
    except FileNotFoundError:
        raise CredentialError(f'LinkedIn credential file is missing ({path.name}); authorize the LinkedIn app first') from None
    except ValueError:
        raise CredentialError(f'LinkedIn credential file {path.name} is not valid JSON') from None
    token = str(data.get('access_token') or '').strip()
    if not token:
        raise CredentialError(f'LinkedIn credential file {path.name} has no access_token')
    expires = float(data.get('expires_at_unix') or 0)
    if expires <= now() + EXPIRY_MARGIN_S:
        when = time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime(expires)) if expires else 'unknown'
        raise CredentialError(f'LinkedIn access token expires {when}; renew the authorization in Chrome before posting')
    if data.get('member_sub') != OWNER_SUB:
        raise IdentityMismatchError(f"LinkedIn credential belongs to member {data.get('member_sub')!r}, "
                                    f'not the owner {OWNER_SUB!r}; refusing to use it')
    scopes = data.get('scopes') or []
    if REQUIRED_SCOPE not in scopes:
        raise CredentialError(f'LinkedIn token lacks the {REQUIRED_SCOPE} scope (has {scopes})')
    return {'access_token': token, 'member_sub': data['member_sub'], 'scopes': scopes, 'expires_at_unix': expires}


def _sha256(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def _load_state(path):
    if not path or not Path(path).exists():
        return {}
    try:
        return json.loads(Path(path).read_text())
    except ValueError:
        raise StateError(f'State file {path} is not valid JSON; inspect it before retrying') from None


def _save_state(path, state):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    state['updated_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    tmp = path.with_name(path.name + '.tmp')
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as fh:
        json.dump(state, fh, indent=2)
    os.replace(tmp, path)


@contextlib.contextmanager
def _exclusive(state_path):
    """Hold an exclusive, non-blocking lock for the whole real run. The state is read only after the lock is held,
    so a second run can never act on a stale copy (two stale runs would each upload and post)."""
    lock_path = Path(state_path).with_name(Path(state_path).name + '.lock')
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(lock_path, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise StateError(f'Another LinkedIn publish is already running for {Path(state_path).name}; '
                             f'let it finish, then rerun') from None
        yield
    finally:
        os.close(fd)


def post_url(post_urn):
    return f'https://www.linkedin.com/feed/update/{post_urn}/' if post_urn else None


# ---------------------------------------------------------------- HTTP

class LinkedInClient:
    def __init__(self, token, version=LINKEDIN_VERSION, transport=None, timeout=120):
        if not re.fullmatch(r'\d{6}', str(version)):
            raise LinkedInError(f'Linkedin-Version must be YYYYMM, got {version!r}')
        self._token = token
        self.version = str(version)
        self.http = httpx.Client(timeout=timeout, transport=transport, follow_redirects=False)
        self.log = []

    def close(self):
        self.http.close()

    def rest_headers(self, json_body=False):
        headers = {'Authorization': f'Bearer {self._token}', 'Linkedin-Version': self.version,
                   'X-Restli-Protocol-Version': '2.0.0'}
        if json_body:
            headers['Content-Type'] = 'application/json'
        return headers

    def send(self, step, method, url, *, headers=None, json_body=None, content=None, expect=(200, 201, 204)):
        try:
            response = self.http.request(method, url, headers=headers, json=json_body, content=content)
        except httpx.HTTPError as exc:
            message = _redact(f'{type(exc).__name__}: {exc}', self._token, str(url))
            raise LinkedInTransportError(f'LinkedIn {step} did not complete: {method} {safe_url(url)} ({message})') from None
        self.log.append({'step': step, 'method': method, 'url': safe_url(url), 'status': response.status_code})
        if response.status_code not in expect:
            raise self._api_error(step, method, url, response)
        return response

    def _api_error(self, step, method, url, response):
        code = service = message = None
        try:
            body = response.json()
        except ValueError:
            body = None
        if isinstance(body, dict):
            code = body.get('code') or body.get('error')
            service = body.get('serviceErrorCode')
            message = body.get('message') or body.get('error_description')
        if message is None:
            message = response.text[:300] or response.reason_phrase
        return LinkedInAPIError(step, method, safe_url(url), response.status_code,
                                code=_redact(code, self._token) if code else None, service_error_code=service,
                                message=_redact(message, self._token, str(url)))

    @staticmethod
    def _json(response, step, key=None):
        try:
            body = response.json()
            return body[key] if key else body
        except (ValueError, KeyError, TypeError):
            raise LinkedInError(f'LinkedIn {step} returned an unexpected body (HTTP {response.status_code})') from None

    def userinfo(self):
        response = self.send('identity_check', 'GET', USERINFO_URL,
                             headers={'Authorization': f'Bearer {self._token}'}, expect=(200,))
        return self._json(response, 'identity_check')

    def initialize_upload(self, body):
        response = self.send('initialize_upload', 'POST', INITIALIZE_URL, headers=self.rest_headers(True),
                             json_body=body, expect=(200, 201))
        return self._json(response, 'initialize_upload', 'value')

    def upload_part(self, url, data, step='upload_part'):
        response = self.send(step, 'PUT', url, headers={'Content-Type': 'application/octet-stream'},
                             content=data, expect=(200, 201))
        etag = (response.headers.get('etag') or '').strip()
        if etag.startswith('W/'):
            etag = etag[2:]
        etag = etag.strip('"')
        if not etag:
            raise LinkedInError(f'LinkedIn {step} returned no ETag header; cannot finalize the upload')
        return etag

    def upload_thumbnail(self, url, data):
        self.send('upload_thumbnail', 'PUT', url, headers=dict(THUMBNAIL_HEADERS), content=data, expect=(200, 201))

    def finalize_upload(self, body):
        self.send('finalize_upload', 'POST', FINALIZE_URL, headers=self.rest_headers(True), json_body=body,
                  expect=(200, 201, 204))

    def get_video(self, video_urn, step='video_status'):
        response = self.send(step, 'GET', video_status_url(video_urn), headers=self.rest_headers(), expect=(200,))
        return self._json(response, step)

    def create_post(self, body):
        return self.send('create_post', 'POST', POSTS_URL, headers=self.rest_headers(True), json_body=body,
                         expect=(201,))


def video_status_url(video_urn):
    if video_urn.startswith('<'):                      # plan placeholder before initializeUpload has run
        return f'{VIDEOS_URL}/<url-encoded video URN>'
    return f"{VIDEOS_URL}/{quote(video_urn, safe='')}"


# ---------------------------------------------------------------- request bodies and plan

def author_urn():
    return f'urn:li:person:{OWNER_SUB}'


def initialize_body(file_size, thumbnail=False, captions=False):
    return {'initializeUploadRequest': {'owner': author_urn(), 'fileSizeBytes': file_size,
                                        'uploadCaptions': bool(captions), 'uploadThumbnail': bool(thumbnail)}}


class _Thumbnail(dict):
    """The checked cover: a plain dict for plans, results and state, plus `.data`, the exact bytes that were checked
    (and are sent), so thumbnail_sha256 always matches what LinkedIn received. JSON never carries the bytes."""
    data = b''


def validate_thumbnail(path):
    """The cover for the video (app.thumbnail's cover_720x1280.jpg): a JPEG file. Problems come back as text."""
    path = Path(path)
    if not path.is_file():
        return None, f'thumbnail not found: {path}'
    data = path.read_bytes()
    if not data.startswith(b'\xff\xd8\xff'):
        return None, f'{path.name} is not a JPEG'
    thumb = _Thumbnail(path=str(path), size=len(data), sha256=hashlib.sha256(data).hexdigest())
    thumb.data = data
    return thumb, None


def finalize_body(video_urn, upload_token, part_ids):
    return {'finalizeUploadRequest': {'video': video_urn, 'uploadToken': upload_token, 'uploadedPartIds': part_ids}}


def post_body(video_urn, commentary, title=None):
    media = {'id': video_urn}
    if title:
        media = {'title': title, 'id': video_urn}
    return {'author': author_urn(), 'commentary': commentary, 'visibility': 'PUBLIC',
            'distribution': {'feedDistribution': 'MAIN_FEED', 'targetEntities': [], 'thirdPartyDistributionChannels': []},
            'content': {'media': media}, 'lifecycleState': 'PUBLISHED', 'isReshareDisabledByAuthor': False}


def _upload_usable(upload, now_ms):
    return bool(upload) and (upload.get('expires_at_ms') or 0) - UPLOAD_URL_MARGIN_MS > now_ms


def _plan(client, state, video, commentary, title, now_ms, poll_seconds, processing_timeout, thumb=None, captions_path=None):
    """The ordered write-side requests a real run would send from this state (tokens redacted)."""
    rest_json, rest_get = _public_headers(client.rest_headers(True)), _public_headers(client.rest_headers())
    plan, upload, size = [], state.get('upload'), video['size']
    thumbnail_url = None
    finalized = bool(state.get('finalized')) and bool(upload)
    if upload and not finalized and _upload_usable(upload, now_ms):
        video_urn, token = upload['video_urn'], upload['upload_token']
        plan.append({'step': 'video_status', 'method': 'GET', 'url': video_status_url(video_urn), 'headers': rest_get,
                     'note': 'resume: skip upload and finalize if LinkedIn already has the file'})
        parts = [{'url': safe_url(p['url']), 'first': p['first'], 'last': p['last']} for p in upload['instructions']]
        done = upload.get('etags') or [None] * len(parts)
        if upload.get('thumbnail_url') and not upload.get('thumbnail_uploaded'):
            thumbnail_url = safe_url(upload['thumbnail_url'])
    elif not finalized:
        video_urn, token = '<video URN from initializeUpload>', '<uploadToken from initializeUpload>'
        plan.append({'step': 'initialize_upload', 'method': 'POST', 'url': INITIALIZE_URL, 'headers': rest_json,
                     'json': initialize_body(size, thumbnail=thumb, captions=captions_path)})
        thumbnail_url = '<thumbnailUploadUrl from initializeUpload>' if thumb else None
        count = max(1, math.ceil(size / PART_SIZE))
        parts = [{'url': f'<uploadInstructions[{i}].uploadUrl>', 'first': i * PART_SIZE,
                  'last': min((i + 1) * PART_SIZE, size) - 1} for i in range(count)]
        done = [None] * count
    else:
        video_urn, token, parts, done = upload['video_urn'], upload['upload_token'], [], []
    if not finalized:
        for i, part in enumerate(parts):
            if done[i]:
                continue
            plan.append({'step': 'upload_part', 'part': f'{i + 1}/{len(parts)}', 'method': 'PUT', 'url': part['url'],
                         'headers': {'Content-Type': 'application/octet-stream'},
                         'bytes': f"{part['first']}-{part['last']}", 'size': part['last'] - part['first'] + 1,
                         'source': video['path']})
        if thumb and thumbnail_url:
            plan.append({'step': 'upload_thumbnail', 'method': 'PUT', 'url': thumbnail_url,
                         'headers': dict(THUMBNAIL_HEADERS), 'size': thumb['size'], 'source': thumb['path'],
                         'expect': '201; a failure is a warning and the post still goes out'})
        if captions_path and not state.get('captions_uploaded'):
            plan.append({'step': 'upload_captions', 'method': 'POST', 'url': '<captionsUploadUrl from initializeUpload>',
                         'source': str(captions_path), 'format': 'SRT', 'language': 'en'})
        part_ids = [d or f'<ETag of part {i + 1}>' for i, d in enumerate(done)]
        plan.append({'step': 'finalize_upload', 'method': 'POST', 'url': FINALIZE_URL, 'headers': rest_json,
                     'json': finalize_body(video_urn, token, part_ids)})
    plan.append({'step': 'wait_until_available', 'method': 'GET', 'url': video_status_url(video_urn), 'headers': rest_get,
                 'repeat': f'from every {poll_seconds:g} s, doubling to at most {MAX_POLL_SECONDS:g} s, until status '
                           f'AVAILABLE (gives up after {processing_timeout:g} s); if LinkedIn refuses the status GET '
                           f'with 403, waits a fixed time instead and lets the post call decide'})
    plan.append({'step': 'create_post', 'method': 'POST', 'url': POSTS_URL, 'headers': rest_json,
                 'json': post_body(video_urn, commentary, title), 'expect': '201 with x-restli-id header'})
    return plan


# ---------------------------------------------------------------- publish

def publish(video_path, lesson: dict, *, dry_run=True, state_path=None, credentials_path=None, transport=None,
            probe=None, confirm_not_posted=False, version=None, poll_seconds=POLL_SECONDS,
            processing_timeout=PROCESSING_TIMEOUT, status_forbidden_wait=STATUS_FORBIDDEN_WAIT, sleep=time.sleep,
            clock=time.monotonic, now=time.time, thumbnail_path=None) -> dict:
    """Post video_path to the owner's LinkedIn feed with lesson['captions']['linkedin'] as commentary.

    dry_run (default True): only the read-only identity GET is sent; returns the ordered request plan.
    Posting happens only when dry_run is exactly False. state_path defaults to <video folder>/publish_linkedin.json.
    confirm_not_posted=True is needed only after an earlier post attempt ended without a clear answer and the owner
    has checked the profile and seen no post.
    thumbnail_path (the reel's cover_720x1280.jpg) asks initializeUpload for a thumbnail URL and PUTs the JPEG
    there before finalizeUpload. Any thumbnail problem is a warning: the post is never blocked by it."""
    dry = dry_run is not False
    video_path = Path(video_path)
    state_path = Path(state_path) if state_path else video_path.parent / STATE_FILENAME
    with (contextlib.nullcontext() if dry else _exclusive(state_path)):
        return _publish(video_path, lesson, dry, state_path, credentials_path, transport, probe, confirm_not_posted,
                        version, poll_seconds, processing_timeout, status_forbidden_wait, sleep, clock, now,
                        thumbnail_path)


def _publish(video_path, lesson, dry, state_path, credentials_path, transport, probe, confirm_not_posted, version,
             poll_seconds, processing_timeout, status_forbidden_wait, sleep, clock, now, thumbnail_path=None):
    state = _load_state(state_path)       # read under the lock (real runs), never before it
    if state.get('status') == 'published':
        warnings = []
        if state.get('video_sha256') and video_path.is_file() and _sha256(video_path) != state['video_sha256']:
            warnings.append(f'{video_path.name} changed after it was posted; the saved post is the earlier cut and '
                            f'nothing was sent. Posting the new cut would be a second LinkedIn post: it needs the '
                            f"owner's explicit OK and a new state_path.")
        return {'platform': 'linkedin', 'dry_run': dry, 'status': 'already_published', 'post_urn': state.get('post_urn'),
                'post_url': state.get('post_url'), 'video_urn': (state.get('upload') or {}).get('video_urn'),
                'published_at': state.get('published_at'), 'state_path': str(state_path), 'warnings': warnings,
                'requests': []}

    captions_path = Path(lesson['caption_file']) if lesson.get('caption_file') else None
    if captions_path and (not captions_path.is_file() or captions_path.suffix.lower() != '.srt'):
        raise LinkedInError('caption_file must be an existing English SRT file')
    commentary = build_commentary(lesson)
    title = str((lesson or {}).get('topic_title') or '').strip() or None
    video = validate_video(video_path, (probe or ffprobe)(video_path), long_form=lesson.get('video_format') == 'long')
    digest = _sha256(video_path)
    if state.get('author') and state['author'] != author_urn():
        raise StateError(f"State file {state_path.name} belongs to {state['author']}, not {author_urn()}")
    if state.get('upload') and state.get('video_sha256') not in (None, digest):
        raise StateError(f'State file {state_path.name} tracks a different video file (sha256 changed); '
                         f'use a new state path for a re-rendered video')
    credentials = load_credentials(credentials_path or CREDENTIALS_PATH, now=now)
    client = LinkedInClient(credentials['access_token'], version or LINKEDIN_VERSION, transport)
    try:
        identity = client.userinfo()
        if identity.get('sub') != credentials['member_sub']:
            raise IdentityMismatchError(f"LinkedIn token is signed in as {identity.get('name')!r} "
                                        f"(sub {identity.get('sub')!r}), not the owner (sub {OWNER_SUB!r}); nothing was sent")
        checks = list(client.log)
        warnings = []
        if state.get('post_attempt') and not confirm_not_posted:
            warnings.append(_uncertain_message(state['post_attempt']))
        thumb, problem = validate_thumbnail(thumbnail_path) if thumbnail_path else (None, None)
        notes = [f'LinkedIn thumbnail skipped: {problem}'] if problem else []
        if dry:
            plan = _plan(client, state, video, commentary, title, now() * 1000, poll_seconds, processing_timeout,
                         thumb, captions_path)
            return {'platform': 'linkedin', 'dry_run': True, 'status': 'planned', 'author': author_urn(),
                    'identity': {'sub': identity.get('sub'), 'name': identity.get('name'), 'verified': True},
                    'token_expires_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(credentials['expires_at_unix'])),
                    'linkedin_version': client.version, 'video': video, 'commentary': commentary,
                    'state_path': str(state_path), 'resume': bool(state.get('upload')),
                    'warnings': warnings + notes, 'thumbnail': thumb, 'checks_performed': checks, 'requests': plan}
        if warnings:
            raise UncertainPostError(warnings[0])
        state.setdefault('platform', 'linkedin')
        state['author'] = author_urn()
        state['video_path'], state['video_sha256'], state['video_size'] = str(video_path), digest, video['size']
        result = _execute(client, state, state_path, video_path, video, commentary, title, now, poll_seconds,
                          processing_timeout, sleep, clock, status_forbidden_wait, thumb, captions_path)
        result['warnings'] = notes + result['warnings']
        result['requests'] = client.log[len(checks):]
        result['checks_performed'] = checks
        return result
    finally:
        client.close()


def _uncertain_message(attempt):
    return (f"A LinkedIn post request sent at {attempt.get('at')} ended without a clear answer, so it may already be "
            f'live. Check {PROFILE_ACTIVITY_URL}; only if no post exists, rerun with confirm_not_posted=True.')


def _abandon_upload(state, state_path, reason):
    upload = state.pop('upload', None)
    state['finalized'] = False
    if upload:
        state.setdefault('abandoned_videos', []).append({'video_urn': upload.get('video_urn'), 'reason': reason})
    _save_state(state_path, state)


def _status_forbidden(error):
    """403 on GET /rest/videos/{urn}: the video is ours (identity was verified), so this is the scope gate the
    Images API page describes for w_member_social-only tokens, not a reason to stop."""
    return isinstance(error, LinkedInAPIError) and error.status == 403


def _upload_url_expired(error, put=False):
    """Videos API: 'Trying to upload to expired URLs would throw a 401 error'; error table: 400 EXPIRED_UPLOAD_URL.
    A 401 only means an expired URL on the signed upload PUT; on api.linkedin.com it means a bad access token."""
    return isinstance(error, LinkedInAPIError) and (
        (put and error.status == 401) or 'EXPIRED_UPLOAD_URL' in f'{error.code} {error.message}')


def _upload_thumbnail(client, state, state_path, upload, thumb, warnings):
    """PUT the cover to thumbnailUploadUrl before finalize. Never raises: the post goes out without it."""
    if upload.get('thumbnail_uploaded'):
        return
    url = upload.get('thumbnail_url')
    if not url:
        warnings.append('LinkedIn thumbnail skipped: this upload was started without uploadThumbnail '
                        '(no thumbnailUploadUrl), so LinkedIn picks the frame')
        return
    try:
        client.upload_thumbnail(url, getattr(thumb, 'data', None) or Path(thumb['path']).read_bytes())
    except Exception as error:   # never block the post: LinkedIn picks a frame instead
        message = _redact(str(error) if isinstance(error, LinkedInError) else f'{type(error).__name__}: {error}',
                          client._token, url)
        upload['thumbnail_error'] = message
        warnings.append(f'LinkedIn thumbnail not uploaded, posting without it: {message}')
    else:
        upload['thumbnail_uploaded'] = True
        upload['thumbnail_sha256'] = thumb['sha256']
        upload.pop('thumbnail_error', None)
    _save_state(state_path, state)


def _execute(client, state, state_path, video_path, video, commentary, title, now, poll_seconds,
             processing_timeout, sleep, clock, status_forbidden_wait=STATUS_FORBIDDEN_WAIT, thumb=None, captions_path=None):
    warnings = []
    upload = state.get('upload')
    if upload and not state.get('finalized'):
        if not _upload_usable(upload, now() * 1000):
            _abandon_upload(state, state_path, 'upload URLs expired before the upload finished')
        else:
            try:
                status = client.get_video(upload['video_urn']).get('status')
            except LinkedInAPIError as error:
                if not _status_forbidden(error):
                    raise
                status = None                  # unknown: upload the missing parts and finalize as planned
            if status in ('PROCESSING', 'AVAILABLE'):
                state['finalized'] = True
                _save_state(state_path, state)
            elif status == 'PROCESSING_FAILED':
                _abandon_upload(state, state_path, 'LinkedIn reported PROCESSING_FAILED')
    if not state.get('upload'):
        value = client.initialize_upload(initialize_body(video['size'], thumbnail=thumb, captions=captions_path))
        instructions = [{'url': p['uploadUrl'], 'first': int(p['firstByte']), 'last': int(p['lastByte'])}
                        for p in value.get('uploadInstructions') or []]
        if not instructions:
            raise LinkedInError('LinkedIn initializeUpload returned no uploadInstructions')
        state['upload'] = {'video_urn': value['video'], 'upload_token': value.get('uploadToken', ''),
                           'expires_at_ms': value.get('uploadUrlsExpireAt') or 0, 'instructions': instructions,
                           'etags': [None] * len(instructions)}
        if captions_path:
            state['upload']['captions_url'] = value.get('captionsUploadUrl')
        if thumb:
            state['upload']['thumbnail_url'] = value.get('thumbnailUploadUrl')
        state['finalized'] = False
        _save_state(state_path, state)
    upload = state['upload']
    if not state.get('finalized'):
        total = len(upload['instructions'])
        with video_path.open('rb') as fh:
            for i, part in enumerate(upload['instructions']):
                if upload['etags'][i]:
                    continue
                last = min(part['last'], video['size'] - 1)
                fh.seek(part['first'])
                data = fh.read(last - part['first'] + 1)
                try:
                    upload['etags'][i] = client.upload_part(part['url'], data, step=f'upload_part {i + 1}/{total}')
                except LinkedInAPIError as error:
                    if _upload_url_expired(error, put=True):   # same URLs fail on every rerun: start over next time
                        _abandon_upload(state, state_path, f'upload URL rejected (HTTP {error.status})')
                    raise
                _save_state(state_path, state)
        if captions_path and not state.get('captions_uploaded'):
            url = upload.get('captions_url')
            if not url:
                raise LinkedInError('LinkedIn did not return the requested captions upload URL')
            metadata = {'format': 'SRT', 'formattedForEasyReader': True, 'largeText': True,
                        'source': 'USER_PROVIDED', 'locale': {'variant': 'AMERICAN', 'country': 'US', 'language': 'EN'},
                        'transcriptType': 'CLOSED_CAPTION'}
            request = httpx.Request('POST', url, data={'metadata': json.dumps(metadata)},
                                    files={'file': (captions_path.name, captions_path.read_bytes(), 'text/plain')})
            data = request.read()
            client.send('upload_captions', 'POST', url,
                        headers={'Content-Type': request.headers['content-type']}, content=data, expect=(200, 201))
            state['captions_uploaded'] = True
            _save_state(state_path, state)
        if thumb:
            _upload_thumbnail(client, state, state_path, upload, thumb, warnings)
        try:
            client.finalize_upload(finalize_body(upload['video_urn'], upload['upload_token'], upload['etags']))
        except LinkedInAPIError as error:
            if _upload_url_expired(error):
                _abandon_upload(state, state_path, f'finalize rejected: {error.code or error.status}')
            raise
        state['finalized'] = True
        _save_state(state_path, state)

    deadline = clock() + processing_timeout
    interval, status = poll_seconds, None
    while True:
        try:
            info = client.get_video(upload['video_urn'], step='wait_until_available')
        except LinkedInAPIError as error:
            if not _status_forbidden(error):
                raise
            warnings.append(f'LinkedIn refused the video status check (HTTP 403; w_member_social is write-only for '
                            f'versioned GETs), so the post was sent after a fixed {status_forbidden_wait:g} s wait '
                            f'instead of after confirmed processing')
            sleep(status_forbidden_wait)
            status = 'UNCONFIRMED'
            break
        status = info.get('status')
        if status == 'AVAILABLE':
            break
        if status == 'PROCESSING_FAILED':
            reason = info.get('processingFailureReason') or 'no reason given'
            _abandon_upload(state, state_path, f'PROCESSING_FAILED: {reason}')
            raise VideoProcessingError(f"LinkedIn could not process video {upload['video_urn']}: {reason}. "
                                       f'A rerun starts a fresh upload.')
        if clock() >= deadline:
            raise VideoProcessingError(f"LinkedIn video {upload['video_urn']} still {status} after "
                                       f'{processing_timeout:g} s; rerun later to resume from the saved state')
        sleep(interval)
        interval = min(interval * 2, max(poll_seconds, MAX_POLL_SECONDS))
    state['video_status'] = status
    _save_state(state_path, state)

    state['post_attempt'] = {'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'video_urn': upload['video_urn']}
    _save_state(state_path, state)
    try:
        response = client.create_post(post_body(upload['video_urn'], commentary, title))
    except LinkedInAPIError as error:
        if 400 <= error.status < 500:          # LinkedIn answered and refused: nothing was created
            state.pop('post_attempt', None)
            state['last_error'] = str(error)
            _save_state(state_path, state)
            raise
        raise UncertainPostError(f'{error}. {_uncertain_message(state["post_attempt"])}') from None
    except LinkedInTransportError as error:
        raise UncertainPostError(f'{error}. {_uncertain_message(state["post_attempt"])}') from None
    post_urn = response.headers.get('x-restli-id')
    if not post_urn:
        try:
            post_urn = (response.json() or {}).get('id')
        except ValueError:
            post_urn = None
    post_urn = unquote(post_urn) if post_urn else None     # tolerate a percent-encoded URN in the header
    state.update({'status': 'published', 'post_urn': post_urn, 'post_url': post_url(post_urn),
                  'published_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
    state.pop('post_attempt', None)
    state.pop('last_error', None)
    _save_state(state_path, state)
    if not post_urn:
        warnings.append('201 Created without x-restli-id; post id unknown, check the profile')
    return {'platform': 'linkedin', 'dry_run': False, 'status': 'published', 'post_urn': post_urn,
            'post_url': post_url(post_urn), 'video_urn': upload['video_urn'], 'state_path': str(state_path),
            'warnings': warnings}


if __name__ == '__main__':   # dry run only: python -m app.publish_linkedin <video.mp4> <lesson.json>
    import sys
    print(json.dumps(publish(sys.argv[1], json.loads(Path(sys.argv[2]).read_text()), dry_run=True), indent=2))
