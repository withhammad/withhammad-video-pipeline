"""Publish a Reel to @hammadagentic.ai with the Instagram API with Instagram Login (graph.instagram.com).

Verified against Meta's docs on 2026-10-17 (developers.facebook.com/documentation/instagram-platform/…):
  GET  /me?fields=user_id,username,account_type        user_id = the professional account id <IG_ID>  [instagram-api-with-instagram-login/get-started]
  GET  /<IG_ID>/content_publishing_limit?fields=quota_usage,config   data[0].quota_usage, config.quota_total/quota_duration
  POST /<IG_ID>/media   media_type=REELS, video_url, caption, share_to_feed, thumb_offset, is_ai_generated -> {id}  [ig-user/media]
  GET  /<IG_CONTAINER_ID>?fields=id,status,status_code  EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED   [ig-container]
  POST /<IG_ID>/media_publish   creation_id -> {id: <IG_MEDIA_ID>}                                            [ig-user/media_publish]
  GET  /<IG_MEDIA_ID>?fields=id,permalink,shortcode,timestamp                                                 [reference/instagram-media]
  GET  /<IG_ID>/media?fields=id,caption,permalink,timestamp   (only to reconcile a publish whose response was lost)
Host graph.instagram.com; the Instagram User token travels in an "Authorization: Bearer" header (as in the guide's
examples), never in a URL. API version v25.0 is the one the Instagram Platform reference names (v26.0 also exists).

Upload method: the guide's endpoint list marks upload_type=resumable (rupload.facebook.com) "Only for apps that have
implemented Facebook Login for Business", and the Instagram Login host list is graph.instagram.com only. With an
Instagram Login token Meta must therefore cURL the video from a PUBLIC HTTPS URL ("the media must be hosted on a
publicly accessible server at the time of the attempt"). That URL comes from a pluggable PublicUrlProvider.

Reel spec checked before any request: MOV/MP4 with the moov atom first (edit lists only warned), H.264/HEVC progressive
4:2:0, 23-60 fps, at most 1920 px wide, AAC at most 48 kHz with 1-2 channels, 3 s to 15 min, at most 300 MB; our own
rule adds 9:16. Caption: at most 2200 characters, 30 hashtags and 20 @ tags. Limits: the guide says 100 API posts per
24 h while the content_publishing_limit and media_publish references say 50, so the code trusts the quota_total the
limit endpoint returns; containers expire after 24 h. The guide suggests polling a container once a minute for at most
5 minutes; the defaults here are 20 s and 10 min (STUDIO_IG_POLL_SECONDS / _TIMEOUT).
Double-post guards: a live run holds <state>.lock (one run per state file), an earlier container is always checked
before a new one is made (PUBLISHED -> reconcile or refuse), and an unknown publish outcome is reconciled against the
latest posts before media_publish is sent again.
"""
import contextlib
import hashlib
import json
import os
import re
import struct
import subprocess
import time
from pathlib import Path
from urllib.parse import urlsplit

import httpx

HOST = 'https://graph.instagram.com'
API_VERSION = os.environ.get('STUDIO_IG_API_VERSION', 'v25.0')
EXPECTED_USERNAME = os.environ.get('STUDIO_IG_USERNAME', 'hammadagentic.ai')
CREDENTIALS_FILE = Path(os.environ.get(
    'STUDIO_IG_CREDENTIALS',
    str(Path(__file__).resolve().parents[2] / 'work' / '.secrets' / 'instagram-hammadagentic-ai-oauth.json')))
POLL_SECONDS = float(os.environ.get('STUDIO_IG_POLL_SECONDS', '20'))
PROCESS_TIMEOUT = float(os.environ.get('STUDIO_IG_TIMEOUT', '600'))
PUBLISH_SCOPE = 'instagram_business_content_publish'
PUBLISHING_ACCOUNT_TYPES = {'BUSINESS', 'MEDIA_CREATOR'}
REDACTED = '<redacted>'

MIN_SECONDS, MAX_SECONDS = 3.0, 15 * 60.0
MAX_BYTES = 300 * 1000 * 1000
MAX_WIDTH = 1920
MIN_FPS, MAX_FPS = 23.0, 60.0
MAX_VIDEO_BPS = 25_000_000
MAX_AUDIO_HZ = 48_000
SPEC_AUDIO_BPS = 128_000
TARGET_ASPECT, ASPECT_TOLERANCE = 9 / 16, 0.01
CAPTION_MAX, HASHTAG_MAX, MENTION_MAX = 2200, 30, 20
HASHTAG_RE = re.compile(r'(?<![\w&])#\w+')
MENTION_RE = re.compile(r'(?<![\w@])@[A-Za-z0-9._]+')
PUBLISHED_STATES = {'published', 'published_media_id_unknown'}
RETRY_PUBLISH_SUBCODES = {2207027, 2207008}  # "not ready" / "builder does not exist": documented as retry-later
HINTS = {
    190: 'the access token is invalid or expired: redo the Instagram OAuth consent and replace the token file',
    (9, 2207042): 'the daily publishing limit is used up: try again after the 24 h window',
    (9004, 2207052): 'Meta could not fetch video_url: it must be a public HTTPS URL serving the MP4 without auth',
    (352, 2207026): 'unsupported video format: export MP4 H.264/AAC with +faststart',
    (4, 2207051): 'Instagram flagged the action as possible spam: wait, then publish from the app or contact Meta',
    (25, 2207050): 'the Instagram account is restricted: sign in to the app and clear the checkpoint',
}


class InstagramPublishError(RuntimeError):
    """Readable failure carrying Meta's error fields; the message never contains the access token."""

    def __init__(self, message, *, step=None, http_status=None, code=None, subcode=None, error_type=None,
                 fbtrace_id=None, user_message=None, retriable=False):
        super().__init__(message)
        self.step, self.http_status, self.code, self.subcode = step, http_status, code, subcode
        self.error_type, self.fbtrace_id, self.user_message, self.retriable = error_type, fbtrace_id, user_message, retriable


class VideoValidationError(InstagramPublishError):
    pass


class IdentityMismatchError(InstagramPublishError):
    pass


class PublishingLimitError(InstagramPublishError):
    pass


# --- public URL providers -------------------------------------------------------------------------------------------

class StaticUrlProvider:
    """The MP4 is already served at `url` (for example a Caddy file_server on the VPS). Nothing is uploaded.

    Any provider needs: describe(path) -> str with no side effects (used by dry runs), url_for(path) -> str that makes
    the file reachable and returns its public HTTPS URL, and optionally release(url) to take it down after publishing."""

    def __init__(self, url):
        self.url = _check_public_url(url)

    def describe(self, video_path):
        return self.url

    def url_for(self, video_path):
        return self.url

    def release(self, url):
        return None


def _check_public_url(url):
    url = str(url or '').strip()
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.netloc:
        raise InstagramPublishError(f'video_url must be an https:// URL Meta can fetch publicly, got {url[:120]!r}',
                                    step='host_video')
    if not url.isascii():
        raise InstagramPublishError('video_url must contain only US-ASCII characters (Meta recommendation)',
                                    step='host_video')
    if parts.hostname in ('localhost', '127.0.0.1', '::1') or (parts.hostname or '').endswith(('.local', '.localhost')):
        raise InstagramPublishError(f'video_url host {parts.hostname} is not reachable from Meta', step='host_video')
    return url


def _provider(url_provider):
    if url_provider is None or hasattr(url_provider, 'url_for'):
        return url_provider
    if isinstance(url_provider, str):
        return StaticUrlProvider(url_provider)
    raise TypeError('url_provider must be None, an https URL string or an object with describe/url_for')


# --- input checks ---------------------------------------------------------------------------------------------------

def ffprobe(path):
    cmd = ['ffprobe', '-v', 'error', '-show_entries',
           'format=format_name,duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,'
           'avg_frame_rate,r_frame_rate,pix_fmt,field_order,bit_rate,sample_rate,channels,sample_aspect_ratio',
           '-of', 'json', str(path)]
    try:
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except FileNotFoundError:
        raise VideoValidationError('ffprobe is not installed (brew install ffmpeg)', step='validate_video') from None
    if process.returncode:
        tail = ' | '.join((process.stderr or '').strip().splitlines()[-2:])
        raise VideoValidationError(f'ffprobe could not read {path}: {tail}', step='validate_video')
    return json.loads(process.stdout or '{}')


def _mp4_layout(path):
    """Top-level box order plus whether any track carries an edit list (moov/trak/edts/elst)."""
    order, edit_lists = [], False
    size_total = os.path.getsize(path)
    with open(path, 'rb') as fh:
        def walk(start, end, depth):
            nonlocal edit_lists
            pos = start
            while pos + 8 <= end:
                fh.seek(pos)
                size, kind = struct.unpack('>I4s', fh.read(8))
                header = 8
                if size == 1:
                    size, header = struct.unpack('>Q', fh.read(8))[0], 16
                elif size == 0:
                    size = end - pos
                if size < header:
                    break
                kind = kind.decode('latin-1')
                if depth == 0:
                    order.append(kind)
                if kind == 'elst':
                    edit_lists = True
                if kind in ('moov', 'trak', 'edts') and depth < 3:
                    walk(pos + header, pos + size, depth + 1)
                pos += size
        walk(0, size_total, 0)
    return order, edit_lists


def _rate(value):
    try:
        num, den = str(value).split('/')
        return float(num) / float(den) if float(den) else 0.0
    except (ValueError, ZeroDivisionError):
        return 0.0


def _sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def validate_video(video_path, probe=None):
    """Check the file against the Reels spec (and our 9:16 rule); raise VideoValidationError listing every problem."""
    path = Path(video_path)
    if not path.is_file():
        raise VideoValidationError(f'video not found: {path}', step='validate_video')
    info = (probe or ffprobe)(path)
    fmt = info.get('format') or {}
    streams = info.get('streams') or []
    video = [s for s in streams if s.get('codec_type') == 'video']
    audio = [s for s in streams if s.get('codec_type') == 'audio']
    problems, warnings = [], []
    size = path.stat().st_size
    duration = float(fmt.get('duration') or 0)
    names = set((fmt.get('format_name') or '').split(','))
    if not names & {'mov', 'mp4'}:
        problems.append(f"container {fmt.get('format_name')!r} is not MP4/MOV")
    if size > MAX_BYTES:
        problems.append(f'file is {size / 1e6:.1f} MB; the Reels limit is 300 MB')
    if not MIN_SECONDS <= duration <= MAX_SECONDS:
        problems.append(f'duration {duration:.2f}s is outside 3 s to 15 min')
    summary = {'path': str(path), 'size': size, 'duration_s': round(duration, 3)}
    if len(video) != 1:
        problems.append(f'expected exactly one video stream, found {len(video)}')
    else:
        v = video[0]
        width, height = int(v.get('width') or 0), int(v.get('height') or 0)
        sar = _rate((v.get('sample_aspect_ratio') or '1:1').replace(':', '/')) or 1.0
        fps = _rate(v.get('avg_frame_rate')) or _rate(v.get('r_frame_rate'))
        aspect = (width * sar / height) if height else 0
        summary.update(video_codec=v.get('codec_name'), width=width, height=height, fps=round(fps, 3),
                       pix_fmt=v.get('pix_fmt'))
        if v.get('codec_name') not in ('h264', 'hevc'):
            problems.append(f"video codec {v.get('codec_name')!r} is not H.264/HEVC")
        if not str(v.get('pix_fmt') or '').startswith(('yuv420p', 'yuvj420p', 'nv12')):
            problems.append(f"pixel format {v.get('pix_fmt')!r} is not 4:2:0")
        if v.get('field_order') not in (None, '', 'progressive', 'unknown'):
            problems.append(f"video is interlaced ({v.get('field_order')}); Reels need progressive scan")
        if not MIN_FPS <= fps <= MAX_FPS:
            problems.append(f'frame rate {fps:.2f} is outside 23-60 fps')
        if width > MAX_WIDTH:
            problems.append(f'width {width}px is over the 1920 px maximum')
        if abs(aspect - TARGET_ASPECT) > ASPECT_TOLERANCE:
            problems.append(f'aspect ratio {width}x{height} is not 9:16')
        if int(v.get('bit_rate') or 0) > MAX_VIDEO_BPS:
            problems.append(f"video bitrate {int(v['bit_rate']) / 1e6:.1f} Mbps is over 25 Mbps")
    if len(audio) != 1:
        problems.append(f'expected exactly one audio stream (the voice), found {len(audio)}')
    else:
        a = audio[0]
        summary.update(audio_codec=a.get('codec_name'), audio_sample_rate=int(a.get('sample_rate') or 0),
                       audio_channels=int(a.get('channels') or 0))
        if a.get('codec_name') != 'aac':
            problems.append(f"audio codec {a.get('codec_name')!r} is not AAC")
        if summary['audio_sample_rate'] > MAX_AUDIO_HZ:
            problems.append(f"audio sample rate {summary['audio_sample_rate']} Hz is over 48 kHz")
        if summary['audio_channels'] not in (1, 2):
            problems.append(f"audio has {summary['audio_channels']} channels; Reels take mono or stereo")
        if int(a.get('bit_rate') or 0) > SPEC_AUDIO_BPS * 1.05:
            warnings.append(f"audio bitrate {int(a['bit_rate']) // 1000} kbps is above the 128 kbps in Meta's spec")
    try:
        order, edit_lists = _mp4_layout(path)
    except (OSError, struct.error) as exc:
        order, edit_lists = [], False
        problems.append(f'could not read the MP4 box layout ({exc})')
    if 'moov' in order and 'mdat' in order and order.index('moov') > order.index('mdat'):
        problems.append('moov atom is after the media data; remux with: ffmpeg -i in.mp4 -c copy -movflags +faststart out.mp4')
    if edit_lists:
        warnings.append("file has edit lists (ffmpeg's default); Meta's spec says none: "
                        'if Meta rejects it, remux with: ffmpeg -i in.mp4 -c copy -use_editlist 0 -movflags +faststart out.mp4')
    if problems:
        raise VideoValidationError(f'{path.name} does not meet the Reels spec: ' + '; '.join(problems),
                                   step='validate_video')
    moov_first = 'moov' in order and ('mdat' not in order or order.index('moov') < order.index('mdat'))
    summary.update(sha256=_sha256(path), moov_first=moov_first, edit_lists=edit_lists, warnings=warnings)
    return summary


def caption_for(lesson):
    caption = ((lesson or {}).get('captions') or {}).get('instagram') or ''
    caption = caption.strip()
    if not caption:
        raise InstagramPublishError('lesson.captions.instagram is empty', step='caption')
    problems = []
    if len(caption) > CAPTION_MAX:
        problems.append(f'{len(caption)} characters (max {CAPTION_MAX})')
    if len(HASHTAG_RE.findall(caption)) > HASHTAG_MAX:
        problems.append(f'{len(HASHTAG_RE.findall(caption))} hashtags (max {HASHTAG_MAX})')
    if len(MENTION_RE.findall(caption)) > MENTION_MAX:
        problems.append(f'{len(MENTION_RE.findall(caption))} @ tags (max {MENTION_MAX})')
    if problems:
        raise InstagramPublishError('Instagram caption is too long: ' + ', '.join(problems), step='caption')
    return caption


def load_credentials(path=None):
    path = Path(path or CREDENTIALS_FILE)
    try:
        data = json.loads(path.read_text())
    except FileNotFoundError:
        raise InstagramPublishError(f'Instagram token file is missing: {path}', step='credentials') from None
    except ValueError:
        raise InstagramPublishError(f'Instagram token file is not valid JSON: {path}', step='credentials') from None
    if not str(data.get('access_token') or '').strip():
        raise InstagramPublishError(f'Instagram token file has no access_token: {path}', step='credentials')
    scopes = data.get('scopes')
    if scopes is not None and PUBLISH_SCOPE not in scopes:
        raise InstagramPublishError(f'the stored token was not granted {PUBLISH_SCOPE}; redo the consent',
                                    step='credentials')
    return data


# --- state ----------------------------------------------------------------------------------------------------------

def _now():
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())


def load_state(state_path):
    if not state_path or not Path(state_path).exists():
        return {}
    try:
        return json.loads(Path(state_path).read_text() or '{}')
    except ValueError:
        raise InstagramPublishError(f'state file {state_path} is not valid JSON; it records remote ids, so fix it by '
                                    'hand instead of deleting it', step='state') from None


def _pid_alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


class _StateLock:
    """One live run per state file: two parallel runs (UI + CLI) would each create and publish a container."""

    def __init__(self, state_path):
        self.path = Path(str(state_path) + '.lock')
        self.held = False

    def __enter__(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        for _ in range(2):
            try:
                fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            except FileExistsError:
                try:
                    pid = int(self.path.read_text().strip() or 0)
                    age = time.time() - self.path.stat().st_mtime
                except (OSError, ValueError):
                    pid, age = 0, 0.0
                if (pid and _pid_alive(pid)) or (not pid and age < 10):
                    raise InstagramPublishError(f'another publish run (pid {pid or "?"}) holds {self.path}; wait for '
                                                'it to finish', step='state') from None
                self.path.unlink(missing_ok=True)  # left behind by a run that crashed
                continue
            with os.fdopen(fd, 'w') as fh:
                fh.write(str(os.getpid()))
            self.held = True
            return self
        raise InstagramPublishError(f'could not take the publish lock {self.path}', step='state')

    def __exit__(self, *exc):
        if self.held:
            self.path.unlink(missing_ok=True)
            self.held = False
        return False


def save_state(state_path, state):
    if not state_path:
        return
    path = Path(state_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    state['updated_at'] = _now()
    temp = path.with_name(path.name + '.tmp')
    temp.write_text(json.dumps(state, indent=2))
    os.replace(temp, path)


# --- HTTP -----------------------------------------------------------------------------------------------------------

class InstagramClient:
    """graph.instagram.com with the token in a header. `public` has no credentials and only checks the hosted video."""

    def __init__(self, token, transport=None, version=API_VERSION, timeout=60):
        token = str(token or '').strip()
        if not token:
            raise InstagramPublishError('Instagram access token is empty', step='credentials')
        self._token = token
        self.version = version
        self.http = httpx.Client(base_url=HOST, transport=transport, timeout=timeout,
                                 headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
        self.public = httpx.Client(transport=transport, timeout=30, follow_redirects=True)

    def close(self):
        self.http.close()
        self.public.close()

    def scrub(self, text):
        text = str(text).replace(self._token, REDACTED)
        return re.sub(r'(access_token=|Bearer |OAuth )[A-Za-z0-9._\-|%]+', r'\1' + REDACTED, text)

    def path(self, *parts):
        return '/' + '/'.join([self.version, *[str(p) for p in parts]])

    def call(self, method, path, step, params=None, json_body=None):
        try:
            response = self.http.request(method, path, params=params, json=json_body)
        except httpx.HTTPError as exc:
            raise InstagramPublishError(self.scrub(f'Instagram {method} {path} did not complete '
                                                   f'({type(exc).__name__}: {exc})'), step=step, retriable=True) from None
        try:
            body = response.json()
        except ValueError:
            body = None
        error = body.get('error') if isinstance(body, dict) else None
        if response.status_code >= 400 or error:
            raise self._error(method, path, step, response, error)
        if not isinstance(body, dict):
            raise InstagramPublishError(self.scrub(f'Instagram {method} {path} returned a non-JSON body '
                                                   f'(HTTP {response.status_code}): {response.text[:200]}'), step=step)
        return body

    def _error(self, method, path, step, response, error):
        if not isinstance(error, dict):
            return InstagramPublishError(self.scrub(f'Instagram {method} {path} failed (HTTP {response.status_code}): '
                                                    f'{response.text[:300]}'), step=step,
                                         http_status=response.status_code, retriable=response.status_code >= 500)
        code, subcode = error.get('code'), error.get('error_subcode')
        hint = HINTS.get((code, subcode)) or HINTS.get(code)
        detail = ' '.join(x for x in (error.get('error_user_title'), error.get('error_user_msg')) if x)
        text = (f"Instagram {method} {path} failed (HTTP {response.status_code}, code {code}"
                f"{'/' + str(subcode) if subcode else ''}, {error.get('type')}): {error.get('message')}"
                f"{' - ' + detail if detail else ''}{' -> ' + hint if hint else ''}"
                f"{' [fbtrace_id ' + str(error.get('fbtrace_id')) + ']' if error.get('fbtrace_id') else ''}")
        return InstagramPublishError(self.scrub(text), step=step, http_status=response.status_code, code=code,
                                     subcode=subcode, error_type=error.get('type'), fbtrace_id=error.get('fbtrace_id'),
                                     user_message=self.scrub(error.get('error_user_msg') or ''),
                                     retriable=bool(error.get('is_transient')) or response.status_code >= 500)

    def check_public_url(self, url, expected_size):
        """HEAD (or a one-byte GET) on the hosted file, with no credentials, before Meta is asked to fetch it."""
        try:
            response = self.public.head(url)
            if response.status_code in (403, 405, 501):
                response = self.public.get(url, headers={'Range': 'bytes=0-0'})
        except httpx.HTTPError as exc:
            raise InstagramPublishError(f'hosted video {url} is not reachable ({type(exc).__name__}: {exc})',
                                        step='check_public_url') from None
        if response.status_code not in (200, 206):
            raise InstagramPublishError(f'hosted video {url} answered HTTP {response.status_code}; Meta needs 200',
                                        step='check_public_url')
        content_type = (response.headers.get('content-type') or '').split(';')[0].strip().lower()
        if content_type.startswith('text/') or content_type in ('application/json', 'application/xml'):
            raise InstagramPublishError(f'hosted video {url} is served as {content_type}, not a video file',
                                        step='check_public_url')
        length = response.headers.get('content-length')
        if response.status_code == 206:
            length = (response.headers.get('content-range') or '').rpartition('/')[2] or None
        if length and length.isdigit() and int(length) != expected_size:
            raise InstagramPublishError(f'hosted video {url} is {length} bytes but the local file is {expected_size}',
                                        step='check_public_url')
        return {'status': response.status_code, 'content_length': int(length) if length and length.isdigit() else None,
                'content_type': response.headers.get('content-type')}


class _Steps:
    """Runs the publishing sequence or, in a dry run, records what would be sent. Only GETs ever run in a dry run."""

    def __init__(self, client, live):
        self.client, self.live, self.log = client, live, []

    def _entry(self, step, method, path, params=None, body=None, **extra):
        headers = {'Authorization': f'Bearer {REDACTED}'}
        if body is not None:
            headers['Content-Type'] = 'application/json'
        entry = {'step': step, 'method': method, 'url': HOST + path, 'headers': headers}
        if params:
            entry['params'] = dict(params)
        if body is not None:
            entry['json'] = dict(body)
        entry.update(extra)
        self.log.append(entry)
        return entry

    def get(self, step, path, params=None, run=True):
        entry = self._entry(step, 'GET', path, params)
        entry['executed'] = bool(run)
        return self.client.call('GET', path, step, params=params) if run else None

    def post(self, step, path, body, **extra):
        entry = self._entry(step, 'POST', path, body=body, **extra)
        entry['executed'] = self.live
        return self.client.call('POST', path, step, json_body=body) if self.live else None

    def note(self, step, method, **fields):
        entry = {'step': step, 'method': method, **fields}
        self.log.append(entry)
        return entry


# --- the publisher --------------------------------------------------------------------------------------------------

def publish(video_path, lesson, *, dry_run=True, state_path=None, **options):
    """Publish `video_path` as a Reel. Anything other than dry_run=False is a dry run: GETs only (identity, limit and,
    with a state file, the earlier container), and the return value lists every request that would be sent (tokens
    redacted). Progress is saved to state_path after every remote id, so a rerun resumes and never posts twice.

    options: url_provider, credentials_path, token, transport, probe, sleep, clock, expected_username, share_to_feed,
    ai_generated, thumb_offset_ms, poll_seconds, timeout, api_version, collaborators."""
    live = dry_run is False
    if live and not state_path:
        raise InstagramPublishError('publishing needs a state_path: it records every remote id so a retry never '
                                    'posts twice', step='state')
    with _StateLock(state_path) if live else contextlib.nullcontext():
        return _publish(video_path, lesson, live=live, state_path=state_path, **options)


def _publish(video_path, lesson, *, live, state_path, url_provider=None, credentials_path=None,
             token=None, transport=None, probe=None, sleep=time.sleep, clock=time.monotonic,
             expected_username=EXPECTED_USERNAME, share_to_feed=True, ai_generated=True, thumb_offset_ms=None,
             poll_seconds=POLL_SECONDS, timeout=PROCESS_TIMEOUT, api_version=API_VERSION, collaborators=None):
    caption = caption_for(lesson)
    video = validate_video(video_path, probe=probe)
    if thumb_offset_ms is not None and not 0 <= int(thumb_offset_ms) < video['duration_s'] * 1000:
        raise InstagramPublishError(f'thumb_offset_ms {thumb_offset_ms} must be >= 0 and below the video length '
                                    f"({video['duration_s'] * 1000:.0f} ms); Meta rejects it (2207057)",
                                    step='thumb_offset')
    state = load_state(state_path)
    result = {'platform': 'instagram', 'dry_run': not live, 'state_path': str(state_path) if state_path else None,
              'video': video, 'caption': {'text': caption, 'length': len(caption),
                                          'hashtags': len(HASHTAG_RE.findall(caption)),
                                          'mentions': len(MENTION_RE.findall(caption))},
              'upload_method': 'video_url', 'warnings': list(video['warnings']), 'blockers': []}

    if state.get('status') in PUBLISHED_STATES or state.get('media_id'):
        if state.get('video', {}).get('sha256') not in (None, video['sha256']):
            result['warnings'].append('state shows an earlier post of a different file; nothing was posted again')
        result.update(status='already_published', media_id=state.get('media_id'), permalink=state.get('permalink'),
                      container_id=state.get('container_id'), requests=[])
        return result

    if token is None:
        token = load_credentials(credentials_path)['access_token']
    provider = _provider(url_provider)
    client = InstagramClient(token, transport=transport, version=api_version)
    steps = _Steps(client, live)
    result['requests'] = steps.log
    caption_sha = hashlib.sha256(caption.encode()).hexdigest()
    try:
        # 1. identity: the token must belong to the expected professional account before anything is written
        me = steps.get('identity', client.path('me'), {'fields': 'user_id,username,account_type'})
        if isinstance(me.get('data'), list) and me['data']:
            me = me['data'][0]
        identity = {'username': me.get('username'), 'ig_user_id': str(me.get('user_id') or ''),
                    'account_type': me.get('account_type')}
        result['account'] = identity
        if identity['username'] != expected_username:
            raise IdentityMismatchError(f"token belongs to @{identity['username']}, expected @{expected_username}; "
                                        'nothing was written', step='identity')
        if not identity['ig_user_id']:
            raise IdentityMismatchError('GET /me returned no user_id (IG professional account id)', step='identity')
        if identity['account_type'] and str(identity['account_type']).upper() not in PUBLISHING_ACCOUNT_TYPES:
            raise IdentityMismatchError(f"@{identity['username']} is a {identity['account_type']} account; "
                                        'only Business/Creator accounts can publish', step='identity')
        if state.get('account', {}).get('ig_user_id') not in (None, identity['ig_user_id']):
            raise IdentityMismatchError('the state file belongs to a different Instagram account', step='identity')
        ig_id = identity['ig_user_id']

        # 2. publishing quota
        limit = steps.get('publishing_limit', client.path(ig_id, 'content_publishing_limit'),
                          {'fields': 'quota_usage,config'})
        row = (limit.get('data') or [{}])[0]
        usage, total = row.get('quota_usage'), (row.get('config') or {}).get('quota_total')
        result['publishing_limit'] = {'quota_usage': usage, 'quota_total': total,
                                      'quota_duration_s': (row.get('config') or {}).get('quota_duration')}
        if isinstance(usage, int) and isinstance(total, int) and usage >= total:
            message = f'publishing limit reached ({usage}/{total} in the last 24 h)'
            if live:
                raise PublishingLimitError(message, step='publishing_limit', retriable=True)
            result['blockers'].append(message)

        # 3. an earlier container for this exact file and caption is resumed, never duplicated
        same_input = (state.get('video', {}).get('sha256') == video['sha256']
                      and state.get('caption_sha256') == caption_sha)
        container_id = None
        old = state.get('container_id')
        if old:
            # checked even when the video or caption changed: if a lost publish response left it PUBLISHED, a fresh
            # container would post the reel a second time
            status = steps.get('container_status', client.path(old), {'fields': 'id,status,status_code'})
            code = status.get('status_code')
            result['resume'] = {'container_id': old, 'status_code': code, 'same_input': same_input}
            if code == 'PUBLISHED':
                if same_input:
                    return _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live)
                raise InstagramPublishError(f'container {old} for an earlier version of this video/caption is already '
                                            'PUBLISHED; nothing was posted again (use a new state file to post a '
                                            'changed version on purpose)', step='resume')
            if same_input and code in ('FINISHED', 'IN_PROGRESS'):
                if state.get('status') == 'publishing':
                    # the last media_publish outcome is unknown and the container status may lag: look for the post
                    found = _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live,
                                       required=False)
                    if found:
                        return found
                container_id = old
            else:
                _archive_container(state, old, code if same_input else f'superseded ({code}): video or caption changed')
        if state.get('video', {}).get('sha256') != video['sha256']:
            state.pop('video_url', None)  # a hosted copy of an older file must never be reused
        state.update({'platform': 'instagram', 'account': {'username': identity['username'], 'ig_user_id': ig_id},
                      'video': {'path': video['path'], 'size': video['size'], 'sha256': video['sha256']},
                      'caption_sha256': caption_sha})
        if live:
            save_state(state_path, state)

        # 4. host the file, check it is public, create the container
        if not container_id:
            if provider is not None:
                if live:
                    video_url = _check_public_url(provider.url_for(Path(video['path'])))
                    state.update(video_url=video_url, video_url_provider=type(provider).__name__,
                                 status='hosted', hosted_at=_now())
                    save_state(state_path, state)
                else:
                    video_url = provider.describe(Path(video['path']))
                steps.note('host_video', 'HOST', provider=type(provider).__name__, url=video_url,
                           file_size=video['size'], executed=live)
            elif state.get('video_url'):
                video_url = state['video_url']
                steps.note('host_video', 'HOST', provider='state (hosted earlier)', url=video_url,
                           file_size=video['size'], executed=False)
            else:
                result['blockers'].append(
                    'no public URL provider: Instagram Login cannot use resumable upload, so Meta must download the '
                    'MP4 from a public HTTPS URL (plain GET, no auth, US-ASCII, reachable until the container is '
                    'FINISHED). Pass url_provider=<https URL> or a provider object.')
                if live:
                    raise InstagramPublishError(result['blockers'][-1], step='host_video')
                video_url = '<PUBLIC_HTTPS_VIDEO_URL>'
                steps.note('host_video', 'HOST', provider=None, url=video_url, file_size=video['size'],
                           executed=False, note='required: no public URL provider configured')
            check = steps.note('check_public_url', 'HEAD', url=video_url, headers={},
                               expect={'status': 200, 'content_length': video['size']}, executed=live)
            if live:
                check['result'] = client.check_public_url(video_url, video['size'])
            body = {'media_type': 'REELS', 'video_url': video_url, 'caption': caption,
                    'share_to_feed': bool(share_to_feed)}
            if ai_generated:
                body['is_ai_generated'] = True
            if thumb_offset_ms is not None:
                body['thumb_offset'] = int(thumb_offset_ms)
            if collaborators:   # Collab invite; each account must accept before it shows on their profile
                names = [str(u).lstrip('@').strip() for u in collaborators if str(u).strip()]
                if len(names) > 3:
                    raise InstagramPublishError('Instagram allows at most 3 collaborators', step='collaborators')
                body['collaborators'] = names
            created = steps.post('create_container', client.path(ig_id, 'media'), body, file_size=video['size'])
            container_id = str(created['id']) if live else '<IG_CONTAINER_ID>'
            if live:
                state.update(container_id=container_id, container_created_at=_now(), status='container_created',
                             container_status='IN_PROGRESS')
                save_state(state_path, state)

        # 5. wait until Meta has fetched and processed the video
        result['container_id'] = container_id
        if _wait_for_container(steps, client, container_id, state, state_path, live, sleep, clock,
                               poll_seconds, timeout) == 'PUBLISHED':
            return _reconcile(steps, client, ig_id, container_id, caption, state, state_path, result, live)

        # 6. publish (the attempt is recorded first so a lost response is reconciled, not re-posted)
        if live:
            state.update(status='publishing', publish_attempted_at=_now())
            save_state(state_path, state)
        published = None
        for attempt in range(3):
            try:
                published = steps.post('publish', client.path(ig_id, 'media_publish'), {'creation_id': container_id})
                break
            except InstagramPublishError as exc:
                if exc.subcode in RETRY_PUBLISH_SUBCODES and attempt < 2:
                    sleep(poll_seconds)
                    continue
                if exc.http_status is None:
                    exc.args = (f'{exc.args[0]}; the publish outcome is unknown - rerun with the same state file to '
                                'reconcile (it checks the container before posting again)',)
                raise
        media_id = str(published['id']) if live else '<IG_MEDIA_ID>'
        if live:
            state.update(media_id=media_id, status='published', published_at=_now())
            save_state(state_path, state)
        _finish(steps, client, media_id, provider, state, state_path, result, live)
        if not live and result['blockers']:
            result['status'] = 'blocked'
        return result
    finally:
        client.close()


def _archive_container(state, container_id, reason):
    state.setdefault('previous_containers', []).append({'id': container_id, 'reason': reason, 'at': _now()})
    for key in ('container_id', 'container_created_at', 'container_status'):
        state.pop(key, None)


def _wait_for_container(steps, client, container_id, state, state_path, live, sleep, clock, poll_seconds, timeout):
    if not live:
        steps.get('container_status', client.path(container_id), {'fields': 'id,status,status_code'}, run=False)
        steps.log[-1]['repeat'] = f'every {poll_seconds:g}s until status_code is FINISHED (max {timeout:g}s)'
        return 'FINISHED'
    deadline = clock() + timeout
    while True:
        status = steps.get('container_status', client.path(container_id), {'fields': 'id,status,status_code'})
        code = status.get('status_code')
        if code != state.get('container_status'):
            state['container_status'] = code
            save_state(state_path, state)
        if code in ('FINISHED', 'PUBLISHED'):
            return code
        if code in ('ERROR', 'EXPIRED'):
            raise InstagramPublishError(f"Instagram container {container_id} is {code}: {status.get('status')} "
                                        '(a rerun creates a fresh container)', step='container_status')
        if clock() >= deadline:
            raise InstagramPublishError(f'Instagram container {container_id} is still {code} after {timeout:g}s; '
                                        'rerun with the same state file to keep waiting', step='container_status',
                                        retriable=True)
        sleep(poll_seconds)


def _reconcile(steps, client, ig_id, container_id, caption, state, state_path, result, live, required=True):
    """The container is (or may be) PUBLISHED but its media id was never recorded: find the post instead of posting
    again. With required=False a miss returns None so the caller can go on."""
    recent = steps.get('reconcile', client.path(ig_id, 'media'),
                       {'fields': 'id,caption,permalink,timestamp', 'limit': 10})
    match = next((m for m in recent.get('data') or [] if (m.get('caption') or '').strip() == caption), None)
    if not match and not required:
        return None
    result['container_id'] = container_id
    if not match:
        if live:
            state.update(status='published_media_id_unknown')
            save_state(state_path, state)
        raise InstagramPublishError(f'container {container_id} is already PUBLISHED but the post was not found among '
                                    'the latest 10; check the profile - it will not be posted again', step='reconcile')
    if live:
        state.update(media_id=str(match['id']), permalink=match.get('permalink'), status='published',
                     published_at=state.get('published_at') or match.get('timestamp') or _now())
        save_state(state_path, state)
    result.update(status='already_published', media_id=str(match['id']), permalink=match.get('permalink'))
    return result


def _finish(steps, client, media_id, provider, state, state_path, result, live):
    media = steps.get('permalink', client.path(media_id), {'fields': 'id,permalink,shortcode,timestamp'}, run=live)
    result.update(status='published' if live else 'planned', media_id=media_id,
                  permalink=(media or {}).get('permalink'))
    if not live:
        return
    state.update(permalink=media.get('permalink'), shortcode=media.get('shortcode'))
    save_state(state_path, state)
    if provider is not None and hasattr(provider, 'release') and state.get('video_url'):
        try:
            provider.release(state['video_url'])
        except Exception as exc:  # the post is live; a hosting cleanup failure is only worth a warning
            result['warnings'].append(f'could not release the hosted video: {exc}')
