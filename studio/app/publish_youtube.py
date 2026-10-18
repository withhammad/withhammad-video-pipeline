"""Publish a Short or explicitly marked long video to the verified YouTube channel (YouTube Data API v3, resumable upload).

Verified against the official documentation on 2026-10-17 (developers.google.com pages "Last updated 2026-10-15"):
  POST https://oauth2.googleapis.com/token  (form) grant_type=refresh_token, client_id, client_secret, refresh_token
       -> {access_token, expires_in, scope, token_type}; error "invalid_grant" = refresh token expired or revoked.
  GET  https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true        identity (1 quota unit)
  GET  https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=<id>      snippet.assignable
  POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
       headers Authorization, Content-Type: application/json; charset=UTF-8, X-Upload-Content-Length,
       X-Upload-Content-Type (video/* or application/octet-stream); body = video resource
       -> 200 OK + Location: <session URI>. No video exists until the bytes arrive.
  PUT  <session URI>  Content-Length = file size, Content-Type = X-Upload-Content-Type, body = the file
       -> 201 Created + video resource. 500/502/503/504 or a dropped connection are resumable.
  PUT  <session URI>  Content-Length: 0, Content-Range: bytes */TOTAL
       -> 308 (Range: bytes=0-N, absent = nothing received) | 200/201 finished | 404 session expired.
       Resume with Content-Range: bytes FIRST-LAST/TOTAL and the remaining bytes only.
  video resource: snippet.title <= 100 characters, no "<" or ">"; snippet.description <= 5000 bytes;
  snippet.tags combined <= 500 characters (commas count; a tag containing a space counts its quotes);
  status.privacyStatus private|public|unlisted (omitted = public, so it is always sent);
  status.selfDeclaredMadeForKids; status.containsSyntheticMedia (boolean: the channel owner's disclosure of
  realistic altered or synthetic content); status.publishAt only with privacyStatus private (ISO 8601; a past
  value publishes at once, so it must be at least 15 minutes ahead).
  videos.insert: 1 unit from the Video Uploads quota bucket ("100 calls per day").
  GET  https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=<id>   after the upload:
       uploadStatus uploaded -> processed | failed (failureReason) | rejected (rejectionReason) | deleted.
  POST https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=<id>&uploadType=media
       Content-Type: image/jpeg, body = the JPEG (at most 2 MB) -> 200 {items: [{default, medium, high, ...}]}.
       Any of the videos.insert scopes; 50 quota units. 403 = the channel may not set custom thumbnails yet
       (verify it at youtube.com/verify). After an upload this step only ever warns: the Short is already live.
YouTube Help 12779649: a square or vertical upload of up to 3 minutes is a Short; "#Shorts" is optional.

Dry run (the default) sends only the OAuth token refresh (a POST to Google's authorization server that mints a
short-lived access token and creates nothing on YouTube) and read-only GETs, then returns the exact writes it
would send. A live upload needs dry_run=False and a state_path; the state file is written the moment the
session URI and the video id are known, so a rerun resumes instead of uploading twice; a lock file beside the
state file stops two live runs at once. status "published" means the upload finished: the video is only
visible to others when privacyStatus is public, and video_status() reports whether processing succeeded."""
import contextlib
import datetime
import fcntl
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
OAUTH_FILE = Path(os.environ.get('STUDIO_YOUTUBE_OAUTH_FILE', str(ROOT / 'work/.secrets/youtube-oauth.json')))
EXPECTED_CHANNEL_ID = os.environ.get('STUDIO_YOUTUBE_CHANNEL_ID', 'UCJtrEDGg1R3kNe7t7PQFiEw')
TOKEN_URL = 'https://oauth2.googleapis.com/token'
API = 'https://www.googleapis.com/youtube/v3'
UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos'
THUMBNAIL_URL = 'https://www.googleapis.com/upload/youtube/v3/thumbnails/set'
THUMBNAIL_MIME = 'image/jpeg'
THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024
VERIFY_URL = 'https://www.youtube.com/verify'
UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload'
# videos.insert "Authorization": any one of these scopes (developers.google.com/youtube/v3/docs/videos/insert).
INSERT_SCOPES = (UPLOAD_SCOPE, 'https://www.googleapis.com/auth/youtube',
                 'https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/youtube.force-ssl')
# 28 = Science & Technology. The videos teach AI developer tools (Claude Code, open-source utilities), so the
# subject category fits better than 27 (Education), which describes the format. Checked live: must be assignable.
CATEGORY_ID = os.environ.get('STUDIO_YOUTUBE_CATEGORY_ID', '28')
PRIVACY_VALUES = ('private', 'unlisted', 'public')
TITLE_MAX_CHARS = 100
DESCRIPTION_MAX_BYTES = 5000
TAGS_MAX_CHARS = 500
SHORTS_MAX_SECONDS = 180.0
MAX_FILE_BYTES = 256 * 1024 ** 3
VIDEO_MIME = 'video/mp4'
RETRYABLE_STATUS = (500, 502, 503, 504)
REDACTED = '***'
STATE_KEY = 'youtube'


class YouTubePublishError(RuntimeError):
    """Base error. Carries YouTube's HTTP status, reason and message, never a credential."""

    def __init__(self, message, *, step=None, status=None, reason=None, platform_message=None):
        super().__init__(message)
        self.step = step
        self.status = status
        self.reason = reason
        self.platform_message = platform_message


class VideoValidationError(YouTubePublishError):
    pass


class MetadataError(YouTubePublishError):
    pass


class CredentialsError(YouTubePublishError):
    pass


class AuthError(YouTubePublishError):
    pass


class IdentityMismatchError(YouTubePublishError):
    pass


class ApiError(YouTubePublishError):
    pass


class UploadSessionExpired(YouTubePublishError):
    pass


class StateConflictError(YouTubePublishError):
    pass


class ThumbnailError(YouTubePublishError):
    pass


class _Transient(Exception):
    pass


# ---------------------------------------------------------------- redaction

class _Secrets:
    """Every credential value seen in this run; scrubbed from any text or structure we hand back."""

    def __init__(self):
        self.values = set()

    def add(self, *values):
        for value in values:
            if isinstance(value, str) and len(value) >= 6:
                self.values.add(value)

    def text(self, value):
        value = str(value)
        for secret in sorted(self.values, key=len, reverse=True):
            value = value.replace(secret, REDACTED)
        return value

    def deep(self, obj):
        if isinstance(obj, dict):
            return {key: self.deep(item) for key, item in obj.items()}
        if isinstance(obj, list):
            return [self.deep(item) for item in obj]
        if isinstance(obj, str):
            return self.text(obj)
        return obj


def _display_url(url):
    """A URL safe to show: the resumable session's upload_id is a capability, so it is masked."""
    parsed = httpx.URL(str(url))
    if 'upload_id' in parsed.params:
        parsed = parsed.copy_set_param('upload_id', REDACTED)
    return str(parsed)


def _redact_headers(headers):
    return {key: ('Bearer ' + REDACTED if key.lower() == 'authorization' else value) for key, value in headers.items()}


# ---------------------------------------------------------------- HTTP

class _Http:
    def __init__(self, secrets, transport=None, timeout=None):
        self.secrets = secrets
        self.sent = []
        self.client = httpx.Client(transport=transport, follow_redirects=False,
                                   timeout=timeout or httpx.Timeout(120.0, connect=30.0))

    def request(self, step, method, url, *, params=None, headers=None, content=None, data=None, body_note=None):
        full = httpx.URL(url, params=params) if params else httpx.URL(url)
        record = {'step': step, 'method': method, 'url': _display_url(full)}
        if headers:
            record['headers'] = _redact_headers(headers)
        if data is not None:
            record['form'] = {key: (value if key == 'grant_type' else REDACTED) for key, value in data.items()}
        if body_note is not None:
            record['body'] = body_note
        self.sent.append(record)
        response = self.client.request(method, full, headers=headers, content=content, data=data)
        record['status'] = response.status_code
        return response

    def close(self):
        self.client.close()


def _api_error(step, response, secrets, cls=ApiError, hint=''):
    status = response.status_code
    reason = message = None
    try:
        payload = response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict):
        error = payload.get('error')
        if isinstance(error, dict):  # YouTube Data API: {"error": {"code", "message", "errors": [{"reason"}]}}
            message = error.get('message')
            errors = error.get('errors') or []
            if errors and isinstance(errors[0], dict):
                reason = errors[0].get('reason')
            reason = reason or error.get('status')
        elif isinstance(error, str):  # OAuth token endpoint: {"error": "invalid_grant", "error_description"}
            reason, message = error, payload.get('error_description')
    if not message:
        message = (response.text or '').strip()[:300] or response.reason_phrase
    text = f'YouTube {step} failed (HTTP {status}) {reason or "error"}: {message}'
    if hint:
        text += f'. {hint}'
    return cls(secrets.text(text), step=step, status=status, reason=reason, platform_message=secrets.text(message))


def _json(response, step, secrets):
    try:
        return response.json()
    except ValueError:
        raise ApiError(secrets.text(f'YouTube {step} returned HTTP {response.status_code} without JSON'),
                       step=step, status=response.status_code) from None


# ---------------------------------------------------------------- inputs

def probe_video(path):
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams',
                              str(path)], capture_output=True, text=True, timeout=60)
    except FileNotFoundError:
        raise VideoValidationError('ffprobe is not installed (brew install ffmpeg)') from None
    if out.returncode:
        raise VideoValidationError(f'ffprobe could not read {path}: {out.stderr.strip()[:300]}')
    return json.loads(out.stdout)


def _ratio(value):
    try:
        num, den = (float(part) for part in str(value).split(':'))
        return num / den if num > 0 and den > 0 else 1.0
    except (ValueError, ZeroDivisionError):
        return 1.0


def _rotation(stream):
    for side in stream.get('side_data_list') or []:
        if 'rotation' in side:
            return int(float(side['rotation']))
    try:
        return int(float((stream.get('tags') or {}).get('rotate', 0)))
    except ValueError:
        return 0


def _sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def validate_video(video_path, probe=None, *, long_form=False):
    """Validate codecs and duration; long_form opts into regular YouTube video limits."""
    path = Path(video_path)
    if not path.is_file():
        raise VideoValidationError(f'Video not found: {path}')
    size = path.stat().st_size
    if size == 0:
        raise VideoValidationError(f'Video is empty: {path}')
    if size > MAX_FILE_BYTES:
        raise VideoValidationError(f'Video is {size} bytes; YouTube accepts at most 256 GB')
    if path.suffix.lower() != '.mp4':
        raise VideoValidationError(f'Expected an .mp4 file, got {path.name}')
    info = (probe or probe_video)(path)
    fmt = info.get('format') or {}
    if 'mp4' not in (fmt.get('format_name') or '').split(','):
        raise VideoValidationError(f'Container is {fmt.get("format_name")!r}; expected MP4')
    streams = info.get('streams') or []
    videos = [s for s in streams if s.get('codec_type') == 'video' and not (s.get('disposition') or {}).get('attached_pic')]
    audios = [s for s in streams if s.get('codec_type') == 'audio']
    if not videos:
        raise VideoValidationError('No video stream found')
    stream = videos[0]
    if stream.get('codec_name') != 'h264':
        raise VideoValidationError(f'Video codec is {stream.get("codec_name")}; expected h264')
    if not audios:
        raise VideoValidationError('No audio track; expected the AAC voice-over')
    if audios[0].get('codec_name') != 'aac':
        raise VideoValidationError(f'Audio codec is {audios[0].get("codec_name")}; expected aac')
    width, height = int(stream.get('width') or 0), int(stream.get('height') or 0)
    if not width or not height:
        raise VideoValidationError('ffprobe reported no frame size')
    shown_w, shown_h = width * _ratio(stream.get('sample_aspect_ratio') or '1:1'), float(height)
    if abs(_rotation(stream)) % 180 == 90:
        shown_w, shown_h = shown_h, shown_w
    aspect = shown_w / shown_h
    if not long_form and abs(aspect - 9 / 16) > 0.01:
        raise VideoValidationError(f'Frame is {width}x{height} (aspect {aspect:.3f}); a Short here must be 9:16 vertical')
    try:
        duration = float(fmt.get('duration') or stream.get('duration') or 0)
    except ValueError:
        duration = 0.0
    if duration <= 0:
        raise VideoValidationError('ffprobe reported no duration')
    if long_form and duration > 12 * 60 * 60:
        raise VideoValidationError("YouTube videos may not exceed 12 hours")
    if not long_form and duration > SHORTS_MAX_SECONDS:
        raise VideoValidationError(f'Video is {duration:.1f} s; YouTube Shorts allow at most {SHORTS_MAX_SECONDS:.0f} s')
    return {'path': str(path), 'size_bytes': size, 'duration_s': round(duration, 3), 'width': width, 'height': height,
            'video_codec': 'h264', 'audio_codec': 'aac', 'fps': stream.get('r_frame_rate'),
            'container': fmt.get('format_name'), 'mime_type': VIDEO_MIME, 'sha256': _sha256(path)}


PUBLISH_AT_MIN_LEAD = datetime.timedelta(minutes=15)


def _normalize_publish_at(value, now=None):
    """ISO 8601 with a timezone, at least 15 minutes ahead, as UTC "YYYY-MM-DDTHH:MM:SSZ".

    The videos reference says a publishAt in the past publishes the video right away, so a stale or mistyped
    schedule would make the video public without anyone choosing that; the lead time keeps it in the future
    by the time the upload finishes."""
    try:
        moment = datetime.datetime.fromisoformat(str(value).strip().replace('Z', '+00:00'))
    except ValueError:
        raise MetadataError(f'publish_at {value!r} is not an ISO 8601 date-time') from None
    if moment.tzinfo is None:
        raise MetadataError(f'publish_at {value!r} has no timezone; use e.g. 2026-10-20T10:00:00Z')
    moment = moment.astimezone(datetime.timezone.utc)
    current = now or datetime.datetime.now(datetime.timezone.utc)
    if moment < current + PUBLISH_AT_MIN_LEAD:
        raise MetadataError(f'publish_at {value} is in the past or less than 15 minutes away; YouTube publishes a '
                            'video with a past publishAt right away')
    return moment.strftime('%Y-%m-%dT%H:%M:%SZ')


def _tags_length(tags):
    return sum(len(tag) + (2 if ' ' in tag else 0) for tag in tags) + max(len(tags) - 1, 0)


def build_video_resource(lesson, *, privacy_status='private', category_id=CATEGORY_ID, contains_synthetic_media=True,
                         made_for_kids=False, publish_at=None):
    """The videos.insert body (parts snippet,status) and any warnings, from the lesson package."""
    captions = lesson.get('captions') or {}
    title = ' '.join(str(captions.get('youtube_title') or '').split())
    description = str(captions.get('youtube_description') or '').strip()
    if not title:
        raise MetadataError('lesson.captions.youtube_title is empty')
    if not description:
        raise MetadataError('lesson.captions.youtube_description is empty')
    for name, value in (('title', title), ('description', description)):
        if '<' in value or '>' in value:
            raise MetadataError(f'YouTube rejects "<" and ">" in the {name}')
    if len(title) > TITLE_MAX_CHARS:
        raise MetadataError(f'captions.youtube_title is {len(title)} characters; YouTube allows {TITLE_MAX_CHARS}')
    warnings = []
    if lesson.get('youtube_format') != 'long' and '#shorts' not in title.lower():
        if len(title) + len(' #Shorts') <= TITLE_MAX_CHARS:
            title += ' #Shorts'
        else:
            warnings.append('"#Shorts" left out of the title: it would exceed 100 characters (it is optional)')
    if len(description.encode('utf-8')) > DESCRIPTION_MAX_BYTES:
        raise MetadataError(f'captions.youtube_description is {len(description.encode("utf-8"))} bytes; '
                            f'YouTube allows {DESCRIPTION_MAX_BYTES}')
    tags, seen = [], set()
    for raw in lesson.get('hashtags') or []:
        tag = ' '.join(str(raw).strip().lstrip('#').split())
        if not tag or tag.lower() in seen:
            continue
        if '<' in tag or '>' in tag or ',' in tag:
            warnings.append(f'tag {tag!r} dropped: contains "<", ">" or ","')
            continue
        if _tags_length(tags + [tag]) > TAGS_MAX_CHARS:
            warnings.append(f'tag {tag!r} dropped: tags would exceed {TAGS_MAX_CHARS} characters')
            continue
        tags.append(tag)
        seen.add(tag.lower())
    if privacy_status not in PRIVACY_VALUES:
        raise MetadataError(f'privacy_status must be one of {", ".join(PRIVACY_VALUES)}')
    if publish_at and privacy_status != 'private':
        raise MetadataError('publish_at (scheduled publishing) requires privacy_status="private"')
    if publish_at:
        publish_at = _normalize_publish_at(publish_at)
    snippet = {'title': title, 'description': description, 'tags': tags, 'categoryId': str(category_id)}
    language = lesson.get('language')
    if isinstance(language, str) and language.strip():
        snippet['defaultLanguage'] = language.strip()
        snippet['defaultAudioLanguage'] = language.strip()
    status = {'privacyStatus': privacy_status, 'selfDeclaredMadeForKids': bool(made_for_kids),
              'containsSyntheticMedia': bool(contains_synthetic_media)}
    if publish_at:
        status['publishAt'] = publish_at
    return {'snippet': snippet, 'status': status}, warnings


def load_credentials(oauth_file=None):
    path = Path(oauth_file or OAUTH_FILE)
    try:
        record = json.loads(path.read_text())
    except FileNotFoundError:
        raise CredentialsError(f'YouTube OAuth file not found: {path}. Connect the channel with '
                               'outputs/video-pipeline/youtube_oauth.py') from None
    except ValueError:
        raise CredentialsError(f'YouTube OAuth file is not valid JSON: {path}') from None
    missing = [key for key in ('refresh_token', 'channel_id', 'client_file') if not record.get(key)]
    if missing:
        raise CredentialsError(f'YouTube OAuth file {path} is missing {", ".join(missing)}')
    if record.get('scopes') and not set(INSERT_SCOPES) & set(record['scopes']):
        raise CredentialsError(f'YouTube OAuth file {path} was not granted youtube.upload; reconnect the channel')
    client_path = Path(record['client_file'])
    try:
        client = json.loads(client_path.read_text())
    except FileNotFoundError:
        raise CredentialsError(f'Google OAuth client file not found: {client_path}') from None
    except ValueError:
        raise CredentialsError(f'Google OAuth client file is not valid JSON: {client_path}') from None
    installed = client.get('installed') or client.get('web') or {}
    if not installed.get('client_id') or not installed.get('client_secret'):
        raise CredentialsError(f'Google OAuth client file {client_path} has no client_id/client_secret')
    return {'refresh_token': record['refresh_token'], 'channel_id': record['channel_id'],
            'channel_title': record.get('channel_title'), 'client_id': installed['client_id'],
            'client_secret': installed['client_secret']}


# ---------------------------------------------------------------- state

def _now():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


def _read_state_file(path):
    if not path or not Path(path).exists():
        return {}
    try:
        data = json.loads(Path(path).read_text() or '{}')
    except ValueError:
        raise StateConflictError(f'State file {path} is not valid JSON; fix or move it before retrying') from None
    if not isinstance(data, dict):
        raise StateConflictError(f'State file {path} does not hold a JSON object')
    return data


def load_state(path):
    """This publisher's section of the state file ({} when there is none)."""
    return dict(_read_state_file(path).get(STATE_KEY) or {})


def save_state(path, section):
    """Atomically write this publisher's section (mode 600), keeping any other platform's section."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = _read_state_file(path)
    data[STATE_KEY] = dict(section, updated_at=_now())
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f'.{path.name}.', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w') as fh:
            json.dump(data, fh, indent=2)
        os.chmod(tmp, 0o600)
        os.replace(tmp, path)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


@contextlib.contextmanager
def _state_lock(path):
    """Exclusive, non-blocking lock beside the state file for the whole live run.

    Without it, two live runs started together both see "no session yet" and each starts an upload, which
    posts the video twice."""
    lock_path = Path(f'{path}.lock')
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise StateConflictError(f'Another live YouTube publish is already running with state file {path}; '
                                     'wait for it to finish, then rerun') from None
        yield
    finally:
        os.close(fd)  # closing the descriptor releases the lock


def _check_state(state, video, expected_channel_id):
    if state.get('video_sha256') and state['video_sha256'] != video['sha256']:
        raise StateConflictError('The state file already tracks a different video file '
                                 f'(video id {state.get("video_id") or "not yet assigned"}); use one state file per video')
    if state.get('channel_id') and state['channel_id'] != expected_channel_id:
        raise StateConflictError(f'The state file belongs to channel {state["channel_id"]}, not {expected_channel_id}')


def _urls(video_id):
    return f'https://www.youtube.com/shorts/{video_id}', f'https://www.youtube.com/watch?v={video_id}'


# ---------------------------------------------------------------- requests

def _auth(token):
    return {'Authorization': f'Bearer {token}'}


def _init_request(resource, video, notify_subscribers, token):
    body = json.dumps(resource, ensure_ascii=False).encode('utf-8')
    params = {'uploadType': 'resumable', 'part': 'snippet,status',
              'notifySubscribers': 'true' if notify_subscribers else 'false'}
    headers = {**_auth(token), 'Content-Type': 'application/json; charset=UTF-8', 'Content-Length': str(len(body)),
               'X-Upload-Content-Length': str(video['size_bytes']), 'X-Upload-Content-Type': VIDEO_MIME}
    return str(httpx.URL(UPLOAD_URL, params=params)), headers, body


def _status_check_headers(token, total):
    return {**_auth(token), 'Content-Length': '0', 'Content-Range': f'bytes */{total}'}


def _upload_headers(token, total, offset, resuming):
    headers = {**_auth(token), 'Content-Length': str(total - offset), 'Content-Type': VIDEO_MIME}
    if resuming:
        headers['Content-Range'] = f'bytes {offset}-{total - 1}/{total}'
    return headers


def _plan(resource, video, notify_subscribers, upload_url):
    total = video['size_bytes']
    file_note = {'file': video['path'], 'bytes': total, 'sha256': video['sha256']}
    if upload_url:
        url = _display_url(upload_url)
        return [
            {'step': 'check_upload_status', 'method': 'PUT', 'url': url,
             'headers': _redact_headers(_status_check_headers(REDACTED, total)),
             'expect': '308 + Range -> resume from the next byte; 200/201 -> already uploaded, nothing resent; '
                       '404 -> session expired, abort without uploading'},
            {'step': 'resume_upload', 'method': 'PUT', 'url': url,
             'headers': {'Authorization': 'Bearer ' + REDACTED, 'Content-Length': f'{total} - <next byte>',
                         'Content-Type': VIDEO_MIME, 'Content-Range': f'bytes <next byte>-{total - 1}/{total}'},
             'body': dict(file_note, from_byte='<next byte from the Range header>'),
             'expect': '201 Created + video resource; id saved to state_path at once'}]
    url, headers, body = _init_request(resource, video, notify_subscribers, REDACTED)
    return [
        {'step': 'start_upload_session', 'method': 'POST', 'url': url, 'headers': _redact_headers(headers),
         'json': resource, 'expect': '200 OK + Location: session URI, saved to state_path before any bytes are sent'},
        {'step': 'upload_file', 'method': 'PUT', 'url': '<session URI from the Location header of step 1>',
         'headers': _redact_headers(_upload_headers(REDACTED, total, 0, False)), 'body': file_note,
         'expect': '201 Created + video resource; id saved to state_path at once'}]


class _Session:
    def __init__(self, http, creds, secrets):
        self.http, self.creds, self.secrets = http, creds, secrets
        self.token = None

    def refresh(self):
        response = self.http.request('refresh_access_token', 'POST', TOKEN_URL, headers={'Accept': 'application/json'},
                                     data={'grant_type': 'refresh_token', 'client_id': self.creds['client_id'],
                                           'client_secret': self.creds['client_secret'],
                                           'refresh_token': self.creds['refresh_token']})
        if response.status_code != 200:
            raise _api_error('token refresh', response, self.secrets, AuthError,
                             hint='Reconnect the channel with outputs/video-pipeline/youtube_oauth.py')
        payload = _json(response, 'token refresh', self.secrets)
        token = payload.get('access_token')
        if not token:
            raise AuthError('YouTube token refresh returned no access_token', step='token refresh')
        self.secrets.add(token)
        granted = (payload.get('scope') or '').split()
        if granted and not set(INSERT_SCOPES) & set(granted):
            raise AuthError('The refresh token does not grant youtube.upload; reconnect the channel', step='token refresh')
        self.token = token
        return token

    def get(self, step, url, params):
        response = self.http.request(step, 'GET', url, params=params, headers=_auth(self.token))
        if response.status_code != 200:
            raise _api_error(step, response, self.secrets)
        return _json(response, step, self.secrets)


def verify_channel(session, expected_channel_id):
    payload = session.get('channels.list (identity check)', f'{API}/channels', {'part': 'id,snippet', 'mine': 'true'})
    items = payload.get('items') or []
    ids = [item.get('id') for item in items]
    if ids != [expected_channel_id]:
        raise IdentityMismatchError(f'The token is authorized for channel {", ".join(map(str, ids)) or "(none)"}, '
                                    f'expected {expected_channel_id}; nothing was uploaded', step='identity check')
    snippet = items[0].get('snippet') or {}
    return {'channel_id': ids[0], 'title': snippet.get('title'), 'custom_url': snippet.get('customUrl')}


def verify_category(session, category_id):
    payload = session.get('videoCategories.list', f'{API}/videoCategories', {'part': 'snippet', 'id': str(category_id)})
    items = payload.get('items') or []
    snippet = (items[0].get('snippet') or {}) if items else {}
    if not snippet.get('assignable'):
        raise MetadataError(f'YouTube category {category_id} does not exist or is not assignable to uploads',
                            step='videoCategories.list')
    return {'id': str(category_id), 'title': snippet.get('title')}


def _file_chunks(path, offset, size=1024 * 1024):
    with open(path, 'rb') as fh:
        fh.seek(offset)
        for chunk in iter(lambda: fh.read(size), b''):
            yield chunk


def _next_byte(range_header):
    if not range_header:
        return 0
    return int(range_header.split('=')[-1].split('-')[-1]) + 1


def _retry_after(response):
    try:
        return min(float(response.headers.get('Retry-After', 0)), 120.0)
    except ValueError:
        return 0.0


def _expired(status):
    return UploadSessionExpired(
        f'The YouTube upload session expired (HTTP {status}). If an earlier attempt finished, the video is already '
        'on the channel: check YouTube Studio first, then rerun with restart_expired_session=True to start a new '
        'session.', step='upload', status=status)


def _upload(session, upload_url, video, *, check_first, sleep, max_retries):
    """PUT the file to the session URI; on 5xx or a dropped connection ask what arrived and resume."""
    total, path = video['size_bytes'], video['path']
    offset, need_check, resuming, failures = 0, check_first, check_first, 0

    def failed(reason):
        nonlocal failures, need_check, resuming
        failures += 1
        if failures > max_retries:
            # "from None": the chained httpx error can quote the session URI or headers, and a logged traceback
            # would print it.
            raise YouTubePublishError(session.secrets.text(
                f'YouTube upload interrupted {failures} times (last: {reason}); the session is saved in the state '
                'file, rerun publish to resume'), step='upload') from None
        need_check = resuming = True

    while True:
        try:
            if need_check:
                response = session.http.request('check_upload_status', 'PUT', upload_url,
                                                headers=_status_check_headers(session.token, total))
                if response.status_code in (200, 201):
                    return _json(response, 'upload', session.secrets)
                if response.status_code == 308:
                    offset = _next_byte(response.headers.get('Range'))
                    if response.headers.get('Retry-After'):
                        sleep(_retry_after(response))
                elif response.status_code in (404, 410):
                    raise _expired(response.status_code)
                elif response.status_code == 401:
                    session.refresh()
                    failed('HTTP 401')
                    continue
                elif response.status_code in RETRYABLE_STATUS:
                    raise _Transient(f'HTTP {response.status_code}')
                else:
                    raise _api_error('upload status check', response, session.secrets)
                need_check = False
                if offset >= total:
                    raise _Transient('server holds every byte but has not finished the upload')
            response = session.http.request(
                'resume_upload' if resuming else 'upload_file', 'PUT', upload_url,
                headers=_upload_headers(session.token, total, offset, resuming), content=_file_chunks(path, offset),
                body_note={'file': path, 'from_byte': offset, 'bytes': total - offset})
            if response.status_code in (200, 201):
                return _json(response, 'upload', session.secrets)
            if response.status_code in (404, 410):
                raise _expired(response.status_code)
            if response.status_code == 401:
                session.refresh()
                failed('HTTP 401')
                continue
            if response.status_code == 308 or response.status_code in RETRYABLE_STATUS:
                raise _Transient(f'HTTP {response.status_code}')
            raise _api_error('videos.insert upload', response, session.secrets)
        except (httpx.TransportError, _Transient) as error:
            failed(error.__class__.__name__ if isinstance(error, httpx.TransportError) else str(error))
            sleep(min(2 ** failures, 64))


def _start_session(session, resource, video, notify_subscribers):
    url, headers, body = _init_request(resource, video, notify_subscribers, session.token)
    response = session.http.request('start_upload_session', 'POST', url, headers=headers, content=body,
                                    body_note=resource)
    if response.status_code != 200:
        raise _api_error('videos.insert (start upload session)', response, session.secrets)
    location = response.headers.get('Location')
    if not location:
        raise ApiError('YouTube started the upload session without a Location header', step='start upload session')
    session.secrets.add(httpx.URL(location).params.get('upload_id'))
    return location


# ---------------------------------------------------------------- custom thumbnail

class _Thumbnail(dict):
    """The checked cover: a plain dict for plans, results and state, plus `.data`, the exact bytes that were checked.
    Those bytes are what thumbnails.set sends, so the sha256 in state always matches what YouTube received, even if
    the file is re-exported or removed while the video uploads. dict(thumb) and JSON never carry the bytes."""
    data = b''


def validate_thumbnail(path):
    """The cover JPEG for thumbnails.set: a JPEG file of at most 2 MB (app.thumbnail exports cover_1080x1920.jpg)."""
    path = Path(path)
    if not path.is_file():
        raise ThumbnailError(f'Thumbnail not found: {path}', step='thumbnail')
    data = path.read_bytes()
    if not data.startswith(b'\xff\xd8\xff'):
        raise ThumbnailError(f'{path.name} is not a JPEG; thumbnails.set is sent as image/jpeg', step='thumbnail')
    if len(data) > THUMBNAIL_MAX_BYTES:
        raise ThumbnailError(f'{path.name} is {len(data)} bytes; YouTube thumbnails must be at most 2 MB',
                             step='thumbnail')
    thumb = _Thumbnail(path=str(path), bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                       mime_type=THUMBNAIL_MIME)
    thumb.data = data
    return thumb


def _thumbnail_request(video_id, thumb, token):
    params = {'videoId': str(video_id), 'uploadType': 'media'}
    headers = {**_auth(token), 'Content-Type': THUMBNAIL_MIME, 'Content-Length': str(thumb['bytes'])}
    return str(httpx.URL(THUMBNAIL_URL, params=params)), headers


def _thumbnail_plan(video_id, thumb):
    url, headers = _thumbnail_request(video_id, thumb, REDACTED)
    if str(video_id).startswith('<'):   # dry run before the upload: the id comes from the upload response
        url = f'{THUMBNAIL_URL}?videoId={video_id}&uploadType=media'
    return {'step': 'set_thumbnail', 'method': 'POST', 'url': url, 'headers': _redact_headers(headers),
            'body': {'file': thumb['path'], 'bytes': thumb['bytes'], 'sha256': thumb['sha256']},
            'expect': '200 + thumbnail URLs; sha256 saved to state_path. A failure is a warning, not a failed '
                      f'publish (403: verify the channel at {VERIFY_URL}).'}


def _thumbnail_hint(video_id, thumb_path):
    return (f'Verify the channel at {VERIFY_URL} (phone, about 1 minute), then run: python -m app.publish_youtube '
            f'thumbnail {video_id} {thumb_path} --live')


def _set_thumbnail(session, video_id, thumb):
    """POST the checked JPEG bytes to thumbnails.set (one retry after a 401 token refresh). Returns the thumbnail
    URLs."""
    data = getattr(thumb, 'data', None) or Path(thumb['path']).read_bytes()
    for attempt in range(2):
        url, headers = _thumbnail_request(video_id, thumb, session.token)
        response = session.http.request('set_thumbnail', 'POST', url, headers=headers, content=data,
                                        body_note={'file': thumb['path'], 'bytes': thumb['bytes']})
        if response.status_code == 401 and not attempt:
            session.refresh()
            continue
        if response.status_code != 200:
            hint = _thumbnail_hint(video_id, thumb['path']) if response.status_code == 403 else ''
            raise _api_error('thumbnails.set', response, session.secrets, ThumbnailError, hint=hint)
        payload = _json(response, 'thumbnails.set', session.secrets)
        items = payload.get('items') if isinstance(payload, dict) else None
        first = items[0] if isinstance(items, list) and items and isinstance(items[0], dict) else {}
        return {size: info.get('url') for size, info in first.items() if isinstance(info, dict)}
    raise ThumbnailError('YouTube thumbnails.set kept answering HTTP 401', step='thumbnails.set', status=401)


def _thumbnail_done(state, video_id, thumb):
    done = state.get('thumbnail') or {}
    return done.get('sha256') == thumb['sha256'] and done.get('video_id') in (None, video_id)


def _apply_thumbnail(session, state_path, section, video_id, thumb, warnings):
    """Set the thumbnail after the upload; any failure becomes a warning because the Short is already live."""
    try:
        urls = _set_thumbnail(session, video_id, thumb)
    except Exception as error:   # whatever goes wrong here, the caller still gets the live Short's id and URL
        if isinstance(error, YouTubePublishError):
            message = str(error)
        elif isinstance(error, httpx.TransportError):
            message = f'network error ({error.__class__.__name__})'
        else:
            message = f'{error.__class__.__name__}: {_display_url_text(str(error))}'
        message = session.secrets.text(message)
        warnings.append(f'Custom thumbnail not set: {message}')
        return {'status': 'failed', 'error': message, 'sha256': thumb['sha256'], 'path': thumb['path']}
    record = {'sha256': thumb['sha256'], 'set_at': _now(), 'path': thumb['path'], 'video_id': video_id}
    section['thumbnail'] = record
    if state_path:
        save_state(state_path, section)
    return dict(record, status='set', urls=urls)


@contextlib.contextmanager
def _verified_session(expected_channel_id, oauth_file, transport):
    """A refreshed token whose channel is the expected one; yields (session, identity)."""
    creds = load_credentials(oauth_file)
    if creds['channel_id'] != expected_channel_id:
        raise IdentityMismatchError(f'The OAuth file is for channel {creds["channel_id"]}, expected '
                                    f'{expected_channel_id}; nothing was sent', step='credentials')
    secrets = _Secrets()
    secrets.add(creds['refresh_token'], creds['client_secret'], creds['client_id'])
    http = _Http(secrets, transport)
    session = _Session(http, creds, secrets)
    try:
        session.refresh()
        yield session, verify_channel(session, expected_channel_id)
    except httpx.TransportError as error:
        raise YouTubePublishError(secrets.text(f'Network error talking to Google ({error.__class__.__name__}); '
                                               'rerun to retry')) from None
    finally:
        http.close()


def _thumbnail_on_published(state, state_path, thumb, dry_run, result, warnings, expected_channel_id, oauth_file,
                            transport):
    """A rerun after the Short is up but before this cover is on it: set (or plan) only the thumbnail."""
    video_id = state['video_id']
    try:
        with _verified_session(expected_channel_id, oauth_file, transport) as (session, identity):
            result['channel'] = identity
            if dry_run:
                result['plan'] = [_thumbnail_plan(video_id, thumb)]
                result['preflight_requests'] = session.http.sent
                return {'status': 'planned', 'sha256': thumb['sha256'], 'path': thumb['path']}
            thumbnail = _apply_thumbnail(session, state_path, dict(state), video_id, thumb, warnings)
            result['requests_sent'] = session.http.sent
            return session.secrets.deep(thumbnail)
    except YouTubePublishError as error:
        # the Short is live and nothing was sent (an identity mismatch included): the cover can be retried later
        warnings.append(f'Custom thumbnail not set: {error}')
        return {'status': 'failed', 'error': str(error), 'sha256': thumb['sha256'], 'path': thumb['path']}


def set_thumbnail(video_id, jpg, *, dry_run=True, state_path=None, expected_channel_id=EXPECTED_CHANNEL_ID,
                  oauth_file=None, transport=None):
    """Set the custom thumbnail of a Short already on the channel (a retro-fix, or a Short posted from the phone).

    dry_run=True (default): token refresh, identity check and a videos.list check that the video belongs to the
    channel; returns the planned thumbnails.set request. Live: sends it and, with a state_path, records the JPEG's
    sha256 so a rerun skips. Unlike the step inside publish(), a failure here raises (it is the whole job)."""
    if not isinstance(dry_run, bool):
        raise TypeError('dry_run must be True or False')
    thumb = validate_thumbnail(jpg)
    with contextlib.nullcontext() if dry_run or not state_path else _state_lock(state_path):
        state = load_state(state_path)
        if state.get('video_id') not in (None, video_id):
            raise StateConflictError(f'The state file tracks video {state["video_id"]}, not {video_id}')
        base = {'platform': 'youtube', 'dry_run': dry_run, 'video_id': video_id, 'thumbnail': thumb,
                'state_path': str(state_path) if state_path else None}
        if _thumbnail_done(state, video_id, thumb):
            return dict(base, status='already_set', set_at=state['thumbnail'].get('set_at'), requests_sent=[])
        with _verified_session(expected_channel_id, oauth_file, transport) as (session, identity):
            payload = session.get('videos.list (owner check)', f'{API}/videos', {'part': 'snippet', 'id': str(video_id)})
            items = payload.get('items') or []
            owner = ((items[0].get('snippet') or {}).get('channelId')) if items else None
            if owner != expected_channel_id:
                raise IdentityMismatchError(f'Video {video_id} is not on channel {expected_channel_id} '
                                            f'(found: {owner or "no such video"}); nothing was sent', step='videos.list')
            if dry_run:
                return session.secrets.deep(dict(base, status='planned', channel=identity,
                                                 preflight_requests=session.http.sent,
                                                 plan=[_thumbnail_plan(video_id, thumb)]))
            urls = _set_thumbnail(session, video_id, thumb)
            record = {'sha256': thumb['sha256'], 'set_at': _now(), 'path': thumb['path'], 'video_id': video_id}
            if state_path:
                save_state(state_path, dict(state, thumbnail=record))
            return session.secrets.deep(dict(base, status='set', channel=identity, set_at=record['set_at'], urls=urls,
                                             requests_sent=session.http.sent))


# ---------------------------------------------------------------- entry point

def publish(video_path, lesson, *, dry_run=True, state_path=None, privacy_status='private', category_id=CATEGORY_ID,
            contains_synthetic_media=True, made_for_kids=False, publish_at=None, notify_subscribers=True,
            expected_channel_id=EXPECTED_CHANNEL_ID, oauth_file=None, restart_expired_session=False,
            transport=None, probe=None, sleep=time.sleep, max_retries=5, thumbnail_path=None):
    """Upload a Short, or a regular video when lesson.youtube_format is "long".

    dry_run=True (default): token refresh + read-only GETs, returns the plan.

    thumbnail_path (the reel's cover_1080x1920.jpg) is set with thumbnails.set right after the upload. A thumbnail
    problem is only a warning: the Short is live either way, and a rerun with the same state file sets the cover
    without uploading again (it is skipped once the state records that JPEG's sha256).

    contains_synthetic_media defaults to True: the avatar is a realistic AI likeness of Hammad performing a
    take he never filmed, which YouTube's altered-or-synthetic policy asks creators to disclose (only cloning
    one's own voice for a voice-over is listed as exempt). privacy_status defaults to private."""
    if not isinstance(dry_run, bool):
        raise TypeError('dry_run must be True or False')
    if not dry_run and not state_path:
        raise ValueError('A live upload needs state_path so a retry resumes instead of uploading twice')
    # A live run holds the state lock from its first state read to its last write; a dry run writes nothing.
    with contextlib.nullcontext() if dry_run else _state_lock(state_path):
        return _publish(video_path, lesson, dry_run=dry_run, state_path=state_path, privacy_status=privacy_status,
                        category_id=category_id, contains_synthetic_media=contains_synthetic_media,
                        made_for_kids=made_for_kids, publish_at=publish_at, notify_subscribers=notify_subscribers,
                        expected_channel_id=expected_channel_id, oauth_file=oauth_file,
                        restart_expired_session=restart_expired_session, transport=transport, probe=probe,
                        sleep=sleep, max_retries=max_retries, thumbnail_path=thumbnail_path)


def _publish(video_path, lesson, *, dry_run, state_path, privacy_status, category_id, contains_synthetic_media,
             made_for_kids, publish_at, notify_subscribers, expected_channel_id, oauth_file, restart_expired_session,
             transport, probe, sleep, max_retries, thumbnail_path=None):
    video = validate_video(video_path, probe, long_form=lesson.get('youtube_format') == 'long')
    resource, warnings = build_video_resource(lesson, privacy_status=privacy_status, category_id=category_id,
                                              contains_synthetic_media=contains_synthetic_media,
                                              made_for_kids=made_for_kids, publish_at=publish_at)
    thumb = None
    if thumbnail_path:
        try:
            thumb = validate_thumbnail(thumbnail_path)
        except ThumbnailError as error:
            warnings.append(f'Custom thumbnail skipped: {error}')
    state = load_state(state_path)
    _check_state(state, video, expected_channel_id)
    if state.get('status') == 'published' and state.get('video_id'):
        result = {'platform': 'youtube', 'dry_run': dry_run, 'status': 'published', 'already_published': True,
                  'video_id': state['video_id'], 'url': state.get('url'), 'watch_url': state.get('watch_url'),
                  'privacy_status': state.get('privacy_status'), 'channel': {'channel_id': state.get('channel_id')},
                  'title': state.get('title'), 'plan': [], 'requests_sent': [], 'warnings': warnings,
                  'state_path': str(state_path) if state_path else None}
        if thumb and _thumbnail_done(state, state['video_id'], thumb):
            result['thumbnail'] = dict(state['thumbnail'], status='already_set')
        elif thumb:   # uploaded earlier, but this cover is not on it yet: set it now, nothing is uploaded again
            result['thumbnail'] = _thumbnail_on_published(state, state_path, thumb, dry_run, result, warnings,
                                                         expected_channel_id, oauth_file, transport)
        return result
    creds = load_credentials(oauth_file)
    if creds['channel_id'] != expected_channel_id:
        raise IdentityMismatchError(f'The OAuth file is for channel {creds["channel_id"]}, expected '
                                    f'{expected_channel_id}; nothing was uploaded', step='credentials')
    secrets = _Secrets()
    secrets.add(creds['refresh_token'], creds['client_secret'], creds['client_id'])
    upload_url = state.get('upload_url')
    if upload_url:
        secrets.add(httpx.URL(upload_url).params.get('upload_id'))
    http = _Http(secrets, transport)
    session = _Session(http, creds, secrets)
    try:
        session.refresh()
        identity = verify_channel(session, expected_channel_id)
        category = verify_category(session, category_id)
        if upload_url and state.get('session_expired'):
            if restart_expired_session:
                upload_url = None
            else:
                warnings.append('The saved upload session expired. Check YouTube Studio for this video, then rerun '
                                'with restart_expired_session=True to start a new session.')
        if dry_run:
            return secrets.deep({
                'platform': 'youtube', 'dry_run': True, 'status': 'resume_planned' if upload_url else 'planned',
                'channel': identity, 'category': category, 'video': video, 'metadata': resource,
                'warnings': warnings, 'preflight_requests': http.sent,
                'plan': _plan(resource, video, notify_subscribers, upload_url)
                        + ([_thumbnail_plan('<video id from the upload>', thumb)] if thumb else []),
                'state_path': str(state_path) if state_path else None,
                'notes': ['Only the OAuth token refresh (POST to oauth2.googleapis.com, creates nothing) and GETs '
                          'were sent. Run with dry_run=False and a state_path to upload.']})
        section = dict(state, platform='youtube', channel_id=identity['channel_id'], video_sha256=video['sha256'],
                       video_size=video['size_bytes'], video_path=video['path'], title=resource['snippet']['title'],
                       privacy_status=privacy_status)
        try:
            if upload_url:
                uploaded = _upload(session, upload_url, video, check_first=True, sleep=sleep, max_retries=max_retries)
            else:
                upload_url = _start_session(session, resource, video, notify_subscribers)
                section.update(status='uploading', upload_url=upload_url, session_started_at=_now(),
                               session_expired=False)
                save_state(state_path, section)
                uploaded = _upload(session, upload_url, video, check_first=False, sleep=sleep, max_retries=max_retries)
        except UploadSessionExpired:
            section['session_expired'] = True
            save_state(state_path, section)
            raise
        video_id = uploaded.get('id')
        if not video_id:
            raise ApiError('YouTube finished the upload without returning a video id', step='upload')
        short_url, watch_url = _urls(video_id)
        if lesson.get('youtube_format') == 'long':
            short_url = watch_url
        uploaded_status = uploaded.get('status') or {}
        section.pop('upload_url', None)
        section.update(status='published', video_id=video_id, url=short_url, watch_url=watch_url,
                       upload_status=uploaded_status.get('uploadStatus'),
                       privacy_status=uploaded_status.get('privacyStatus', privacy_status), published_at=_now())
        save_state(state_path, section)
        thumbnail = _apply_thumbnail(session, state_path, section, video_id, thumb, warnings) if thumb else None
        return secrets.deep({
            'platform': 'youtube', 'dry_run': False, 'status': 'published', 'already_published': False,
            'video_id': video_id, 'url': short_url, 'watch_url': watch_url,
            'privacy_status': section['privacy_status'], 'upload_status': section['upload_status'],
            'channel': identity, 'title': resource['snippet']['title'], 'warnings': warnings,
            'thumbnail': thumbnail, 'requests_sent': http.sent, 'state_path': str(state_path)})
    except httpx.TransportError as error:
        raise YouTubePublishError(secrets.text(f'Network error talking to Google ({error.__class__.__name__}: '
                                               f'{_display_url_text(str(error))}); rerun to resume')) from None
    finally:
        http.close()


FINAL_UPLOAD_STATUSES = ('processed', 'failed', 'rejected', 'deleted')


def video_status(video_id, *, expected_channel_id=EXPECTED_CHANNEL_ID, oauth_file=None, transport=None):
    """Read-only check after an upload: GET videos?part=status,processingDetails&id=<id> (1 quota unit).

    The 201 that ends the upload only means the bytes arrived (status.uploadStatus "uploaded"). Processing can
    still fail (status.failureReason) or YouTube can reject the video (status.rejectionReason, e.g. "duplicate"),
    so poll this until `done` is True before telling anyone the Short is up. processingDetails is only
    returned to the video's owner."""
    creds = load_credentials(oauth_file)
    if creds['channel_id'] != expected_channel_id:
        raise IdentityMismatchError(f'The OAuth file is for channel {creds["channel_id"]}, expected '
                                    f'{expected_channel_id}', step='credentials')
    secrets = _Secrets()
    secrets.add(creds['refresh_token'], creds['client_secret'], creds['client_id'])
    http = _Http(secrets, transport)
    session = _Session(http, creds, secrets)
    try:
        session.refresh()
        verify_channel(session, expected_channel_id)
        payload = session.get('videos.list (status)', f'{API}/videos',
                              {'part': 'status,processingDetails', 'id': str(video_id)})
        items = payload.get('items') or []
        if not items:
            return {'video_id': video_id, 'found': False, 'done': False, 'ok': False, 'upload_status': None}
        status = items[0].get('status') or {}
        processing = items[0].get('processingDetails') or {}
        upload_status = status.get('uploadStatus')
        return secrets.deep({
            'video_id': video_id, 'found': True, 'upload_status': upload_status,
            'done': upload_status in FINAL_UPLOAD_STATUSES, 'ok': upload_status == 'processed',
            'failure_reason': status.get('failureReason'), 'rejection_reason': status.get('rejectionReason'),
            'privacy_status': status.get('privacyStatus'), 'publish_at': status.get('publishAt'),
            'processing_status': processing.get('processingStatus'),
            'processing_failure_reason': processing.get('processingFailureReason')})
    except httpx.TransportError as error:
        raise YouTubePublishError(secrets.text(f'Network error talking to Google ({error.__class__.__name__}); '
                                               'retry the status check')) from None
    finally:
        http.close()


def _display_url_text(text):
    """Mask upload_id=<value> inside free text (transport errors can quote the URL)."""
    return re.sub(r'(upload_id=)[^&\s\'"]+', r'\1' + REDACTED, text)


def main(argv=None):
    """Two commands:
      python -m app.publish_youtube <video.mp4> <lesson.json> [--state F] [--privacy P] [--thumbnail JPG]
          dry run of an upload: read-only checks, then the exact requests a live upload would send
      python -m app.publish_youtube thumbnail <video_id> <jpg> [--state F] [--live]
          set the custom thumbnail of a Short already on the channel (dry run unless --live)"""
    import argparse
    import sys
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv[:1] == ['thumbnail']:
        parser = argparse.ArgumentParser(prog='python -m app.publish_youtube thumbnail',
                                         description='Set the custom thumbnail (thumbnails.set) of a Short on the '
                                                     'verified channel. Dry run unless --live.')
        parser.add_argument('video_id')
        parser.add_argument('jpg')
        parser.add_argument('--state', default=None, help='publish_youtube.json of the job (records the sha256)')
        parser.add_argument('--live', action='store_true', help='send thumbnails.set (changes the live Short)')
        args = parser.parse_args(argv[1:])
        try:
            result = set_thumbnail(args.video_id, args.jpg, dry_run=not args.live, state_path=args.state)
        except YouTubePublishError as error:
            print(f'thumbnail: {error}', file=sys.stderr)
            return 1
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    parser = argparse.ArgumentParser(description='Dry-run a YouTube Shorts upload: read-only identity checks, then '
                                                 'print the exact requests a live upload would send.')
    parser.add_argument('video')
    parser.add_argument('lesson')
    parser.add_argument('--state', default=None)
    parser.add_argument('--privacy', default='private', choices=PRIVACY_VALUES)
    parser.add_argument('--thumbnail', default=None, help='cover JPEG to set after the upload (cover_1080x1920.jpg)')
    args = parser.parse_args(argv)
    result = publish(args.video, json.loads(Path(args.lesson).read_text()), dry_run=True, state_path=args.state,
                     privacy_status=args.privacy, thumbnail_path=args.thumbnail)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
