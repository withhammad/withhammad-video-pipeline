"""Publish a Reel to @hammadagentic.ai with the Instagram API with Instagram Login (graph.instagram.com).

Verified against Meta's docs on 2026-10-17 (developers.facebook.com/documentation/instagram-platform/…):
  GET  /me?fields=user_id,username,account_type        user_id = the professional account id <IG_ID>  [instagram-api-with-instagram-login/get-started]
  GET  /<IG_ID>/content_publishing_limit?fields=quota_usage,config   data[0].quota_usage, config.quota_total/quota_duration
  POST /<IG_ID>/media   media_type=REELS, video_url, caption, share_to_feed, thumb_offset, is_ai_generated -> {id}  [ig-user/media]
       cover_url = a public JPEG (at most 8 MB) used as the Reel's cover; it beats thumb_offset, so thumb_offset is
       dropped when both are given. Hosted like the video (a PublicUrlProvider) and HEAD-checked first. A cover
       problem only warns (the reel posts without it, as YouTube and LinkedIn do) unless cover_required=True.
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
latest posts before media_publish is sent again, whatever changed in between (a new cover only decides whether the
container can be reused, never whether this is a different post). Logged URLs have their query string masked.
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
from urllib.parse import urlsplit, urlunsplit

import httpx

HOST = 'https://graph.instagram.com'
API_VERSION = os.environ.get('STUDIO_IG_API_VERSION', 'v25.0')
EXPECTED_USERNAME = os.environ.get('STUDIO_IG_USERNAME', 'hammadagentic.ai')
CREDENTIALS_FILE = Path(os.environ.get(
    'STUDIO_IG_CREDENTIALS',
    str(Path(__file__).resolve().parents[2] / 'work' / '.secrets' / 'instagram-hammadagentic-ai-oauth.json')))
# Trial Reel graduation strategies Meta accepts in trial_params (None = a normal reel).
TRIAL_STRATEGIES = (None, 'MANUAL', 'SS_PERFORMANCE')
# Owner rule (2026-10-17): every reel goes out as a Collab between the owner's two accounts, so it shows on both.
DEFAULT_COLLABORATORS = {'with.hammad': ('hammadagentic.ai',), 'hammadagentic.ai': ('with.hammad',)}
MAX_COLLABORATORS = 3
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
COVER_MAX_BYTES = 8 * 1000 * 1000
COVER_MIME = 'image/jpeg'
SPEC_AUDIO_BPS = 128_000
AUDIO_OVERHEAD_BPS = 8_000      # container/priming overhead ffprobe adds on top of the 128k encode (short clips)
TARGET_ASPECT, ASPECT_TOLERANCE = 9 / 16, 0.01
CAPTION_MAX, HASHTAG_MAX, MENTION_MAX = 2200, 30, 20
HASHTAG_RE = re.compile(r'(?<![\w&])#\w+')
MENTION_RE = re.compile(r'(?<![\w@])@[A-Za-z0-9._]+')
PUBLISHED_STATES = {'published', 'published_media_id_unknown'}
RETRY_PUBLISH_SUBCODES = {2207027, 2207008}  # "not ready" / "builder does not exist": documented as retry-later
# A 400 on a container request that carried cover_url is retried without the cover, except for errors that are
# clearly not about it: rate limit (4), publishing limit (9), restricted account (25), token (190), video format (352).
NOT_COVER_ERROR_CODES = {4, 9, 25, 190, 352}
URL_FIELDS = ('video_url', 'cover_url', 'image_url')
REEL_MEDIA_TYPES = ('VIDEO', 'REELS')
CAROUSEL_MEDIA_TYPES = ('CAROUSEL_ALBUM',)
CAROUSEL_MIN, CAROUSEL_MAX = 2, 20
IMAGE_MAX_BYTES = 8 * 1000 * 1000
IMAGE_MIME = 'image/jpeg'
_URL_QUERY = re.compile(r'(https?://[^\s?#\'"]+)\?[^\s\'")]+')
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


class ContainerFailedError(InstagramPublishError):
    """The container ended ERROR or EXPIRED (container_status says which)."""
    container_status = None


def safe_url(url):
    """A URL fit for logs, messages and keys: a query string (a presigned URL's signature) is masked."""
    parts = urlsplit(str(url))
    if not parts.query and not parts.fragment:
        return str(url)
    return urlunsplit(parts._replace(query=REDACTED if parts.query else '', fragment=''))


def _mask_urls(text):
    """Mask the query string of every URL inside free text (an error message from a host or provider)."""
    return _URL_QUERY.sub(lambda m: m.group(1) + '?' + REDACTED, str(text))


# --- public URL providers -------------------------------------------------------------------------------------------

class StaticUrlProvider:
    """The MP4 is already served at `url` (for example a Caddy file_server on the VPS). Nothing is uploaded.

    Any provider needs: describe(path) -> str with no side effects (used by dry runs), url_for(path) -> str that makes
    the file reachable and returns its public HTTPS URL, and optionally release(url) to take it down after publishing."""

    def __init__(self, url, label='video_url', step='host_video'):
        self.url = _check_public_url(url, label, step)

    def describe(self, video_path):
        return self.url

    def url_for(self, video_path):
        return self.url

    def release(self, url):
        return None


def _check_public_url(url, label='video_url', step='host_video'):
    url = str(url or '').strip()
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.netloc:
        raise InstagramPublishError(f'{label} must be an https:// URL Meta can fetch publicly, got '
                                    f'{safe_url(url)[:120]!r}', step=step)
    if not url.isascii():
        raise InstagramPublishError(f'{label} must contain only US-ASCII characters (Meta recommendation)', step=step)
    if parts.hostname in ('localhost', '127.0.0.1', '::1') or (parts.hostname or '').endswith(('.local', '.localhost')):
        raise InstagramPublishError(f'{label} host {parts.hostname} is not reachable from Meta', step=step)
    return url


def _provider(url_provider, label='url_provider', url_label='video_url', step='host_video'):
    if url_provider is None or hasattr(url_provider, 'url_for'):
        return url_provider
    if isinstance(url_provider, str):
        return StaticUrlProvider(url_provider, url_label, step)
    raise TypeError(f'{label} must be None, an https URL string or an object with describe/url_for')


def validate_cover(cover_path):
    """The local cover JPEG (app.thumbnail's cover_1080x1920.jpg): a JPEG of at most 8 MB."""
    path = Path(cover_path)
    if not path.is_file():
        raise InstagramPublishError(f'cover not found: {path}', step='cover')
    data = path.read_bytes()
    if not data.startswith(b'\xff\xd8\xff'):
        raise InstagramPublishError(f'{path.name} is not a JPEG; Instagram cover_url must serve image/jpeg', step='cover')
    if len(data) > COVER_MAX_BYTES:
        raise InstagramPublishError(f'{path.name} is {len(data)} bytes; the Reels cover limit is 8 MB', step='cover')
    return {'path': str(path), 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


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
        # app.exports encodes AAC at exactly 128k, yet ffprobe's bit_rate counts the priming and packet overhead,
        # which weighs more on a short clip (an 8-10 s reel measures ~135 kbps, a 49 s one ~132 kbps): allow 8 kbps
        if int(a.get('bit_rate') or 0) > SPEC_AUDIO_BPS + AUDIO_OVERHEAD_BPS:
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
            raise InstagramPublishError(f'hosted video {safe_url(url)} is not reachable ({type(exc).__name__}: '
                                        f'{_mask_urls(exc)})', step='check_public_url') from None
        if response.status_code not in (200, 206):
            raise InstagramPublishError(f'hosted video {safe_url(url)} answered HTTP {response.status_code}; '
                                        'Meta needs 200', step='check_public_url')
        content_type = (response.headers.get('content-type') or '').split(';')[0].strip().lower()
        if content_type.startswith('text/') or content_type in ('application/json', 'application/xml'):
            raise InstagramPublishError(f'hosted video {safe_url(url)} is served as {content_type}, not a video file',
                                        step='check_public_url')
        length = response.headers.get('content-length')
        if response.status_code == 206:
            length = (response.headers.get('content-range') or '').rpartition('/')[2] or None
        if length and length.isdigit() and int(length) != expected_size:
            raise InstagramPublishError(f'hosted video {safe_url(url)} is {length} bytes but the local file is '
                                        f'{expected_size}', step='check_public_url')
        return {'status': response.status_code, 'content_length': int(length) if length and length.isdigit() else None,
                'content_type': response.headers.get('content-type')}

    def check_public_cover(self, url, expected_size=None, max_bytes=COVER_MAX_BYTES):
        """HEAD (or a one-byte GET) on the hosted cover, with no credentials: 200, image/jpeg, at most 8 MB."""
        shown = safe_url(url)
        try:
            response = self.public.head(url)
            if response.status_code in (403, 405, 501):
                response = self.public.get(url, headers={'Range': 'bytes=0-0'})
        except httpx.HTTPError as exc:
            raise InstagramPublishError(f'hosted cover {shown} is not reachable ({type(exc).__name__})',
                                        step='check_cover_url') from None
        if response.status_code not in (200, 206):
            raise InstagramPublishError(f'hosted cover {shown} answered HTTP {response.status_code}; Meta needs 200',
                                        step='check_cover_url')
        content_type = (response.headers.get('content-type') or '').split(';')[0].strip().lower()
        if content_type != COVER_MIME:
            raise InstagramPublishError(f'hosted cover {shown} is served as {content_type or "no content type"}, '
                                        f'not {COVER_MIME}', step='check_cover_url')
        length = response.headers.get('content-length')
        if response.status_code == 206:
            length = (response.headers.get('content-range') or '').rpartition('/')[2] or None
        size = int(length) if length and length.isdigit() else None
        if size is not None and size > max_bytes:
            raise InstagramPublishError(f'hosted cover {shown} is {size} bytes; the Reels cover limit is 8 MB',
                                        step='check_cover_url')
        if size is not None and expected_size is not None and size != expected_size:
            raise InstagramPublishError(f'hosted cover {shown} is {size} bytes but the local file is {expected_size}',
                                        step='check_cover_url')
        return {'status': response.status_code, 'content_length': size, 'content_type': content_type}


def _identity_and_quota(steps, client, expected_username, state, result, live):
    """GET /me (the token must belong to the expected professional account before anything is written), then the
    publishing quota. Returns the identity; raises on a mismatch or (live) on a used-up quota."""
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
    return identity


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
        if body is not None:   # what is logged: URL query strings masked (the request itself carries the full URL)
            entry['json'] = {k: safe_url(v) if k in URL_FIELDS and isinstance(v, str) else v for k, v in body.items()}
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
        if isinstance(fields.get('url'), str):
            fields['url'] = safe_url(fields['url'])
        entry = {'step': step, 'method': method, **fields}
        self.log.append(entry)
        return entry


# --- the publisher --------------------------------------------------------------------------------------------------

def resolve_collaborators(collaborators, account):
    """Collab invitees for a reel posted by `account`. None means the owner's standing default
    (DEFAULT_COLLABORATORS); an empty list means explicitly no Collab. Handles are cleaned of '@',
    deduplicated case-insensitively, and the posting account itself is dropped."""
    account = str(account or '').lstrip('@').strip().lower()
    if collaborators is None:
        collaborators = DEFAULT_COLLABORATORS.get(account, ())
    names, seen = [], {account}
    for handle in collaborators:
        name = str(handle).lstrip('@').strip()
        if name and name.lower() not in seen:
            seen.add(name.lower())
            names.append(name)
    if len(names) > MAX_COLLABORATORS:
        raise InstagramPublishError(f'Instagram allows at most {MAX_COLLABORATORS} collaborators',
                                    step='collaborators')
    return names


def publish(video_path, lesson, *, dry_run=True, state_path=None, **options):
    """Publish `video_path` as a Reel. Anything other than dry_run=False is a dry run: GETs only (identity, limit and,
    with a state file, the earlier container), and the return value lists every request that would be sent (tokens
    redacted, URL query strings masked). Progress is saved to state_path after every remote id, so a rerun resumes
    and never posts twice.

    options: url_provider, credentials_path, token, transport, probe, sleep, clock, expected_username, share_to_feed,
    ai_generated, thumb_offset_ms, poll_seconds, timeout, api_version, collaborators (None = the owner's default
    Collab for the posting account, [] = no Collab), trial (None, 'MANUAL' or 'SS_PERFORMANCE': a Trial Reel shown to
    non-followers first, graduated by hand in the app or by Meta when it performs well; owner rule 2026-10-24),
    cover_url (an https URL already serving the cover JPEG, or a
    provider object hosting cover_path the way url_provider hosts the video), cover_path (the local
    cover_1080x1920.jpg; checked, and compared with the hosted size), cover_required and stop_after.

    The cover never blocks the post (the rule the YouTube and LinkedIn publishers follow too): a cover that fails the
    local check, can't be hosted, fails the HEAD check or is rejected by Meta (HTTP 400 on the container, or a
    container that ends ERROR) is dropped with a warning and the reel goes out without it; thumb_offset_ms, when
    given, then picks the frame. cover_required=True makes any of these stop the run instead. A posted reel's cover
    can't be changed by API.
    stop_after='container' hosts and checks the files, creates the container, waits for FINISHED, records it in the
    state file and returns status 'container_ready' without calling media_publish (the one-time cover_url test)."""
    live = dry_run is False
    if live and not state_path:
        raise InstagramPublishError('publishing needs a state_path: it records every remote id so a retry never '
                                    'posts twice', step='state')
    with _StateLock(state_path) if live else contextlib.nullcontext():
        return _publish(video_path, lesson, live=live, state_path=state_path, **options)


def _publish(video_path, lesson, *, live, state_path, url_provider=None, credentials_path=None,
             token=None, transport=None, probe=None, sleep=time.sleep, clock=time.monotonic,
             expected_username=EXPECTED_USERNAME, share_to_feed=True, ai_generated=True, thumb_offset_ms=None,
             poll_seconds=POLL_SECONDS, timeout=PROCESS_TIMEOUT, api_version=API_VERSION, collaborators=None,
             trial=None, cover_url=None, cover_path=None, cover_required=False, stop_after=None):
    if stop_after not in (None, 'container'):
        raise ValueError("stop_after must be None or 'container'")
    if trial not in TRIAL_STRATEGIES:
        raise ValueError(f'trial must be one of {TRIAL_STRATEGIES}')
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
    # the cover is checked before anything is sent; a problem drops it with a warning (or stops a cover_required run)
    offset = thumb_offset_ms     # sent only when no cover goes out
    cover_provider, cover = _prepare_cover(cover_url, cover_path, cover_required, result, offset)
    if cover_provider is not None and offset is not None:
        result['warnings'].append(f'thumb_offset_ms {offset} dropped: cover_url sets the cover and Meta would ignore '
                                  'thumb_offset anyway (it is used again if the cover is dropped)')
    cover_key = _cover_key(cover_provider, cover)

    if state.get('status') in PUBLISHED_STATES or state.get('media_id'):
        if state.get('video', {}).get('sha256') not in (None, video['sha256']):
            result['warnings'].append('state shows an earlier post of a different file; nothing was posted again')
        result.update(status='already_published', media_id=state.get('media_id'), permalink=state.get('permalink'),
                      container_id=state.get('container_id'), requests=[])
        return result

    if token is None:
        token = load_credentials(credentials_path)['access_token']
    provider = _provider(url_provider)
    hosts = (provider, cover_provider)
    client = InstagramClient(token, transport=transport, version=api_version)
    steps = _Steps(client, live)
    result['requests'] = steps.log
    caption_sha = _caption_sha(caption)
    try:
        # 1. identity: the token must belong to the expected professional account before anything is written
        # 2. publishing quota
        identity = _identity_and_quota(steps, client, expected_username, state, result, live)
        ig_id = identity['ig_user_id']

        # 3. an earlier container is checked before anything is written. It is resumed only when it carries this exact
        #    file, caption and cover; the cover decides only whether the container can be reused, never whether this
        #    is a different post.
        same_post = (state.get('video', {}).get('sha256') == video['sha256']
                     and state.get('caption_sha256') == caption_sha)
        same_cover = state.get('cover_key') == cover_key
        same_input = same_post and same_cover
        container_id = None
        old = state.get('container_id')
        if old:
            # checked even when the input changed: if a lost publish response left it PUBLISHED, a fresh container
            # would post the reel a second time
            status = steps.get('container_status', client.path(old), {'fields': 'id,status,status_code'})
            code = status.get('status_code')
            result['resume'] = {'container_id': old, 'status_code': code, 'same_input': same_input,
                                'same_cover': same_cover}
            if code == 'PUBLISHED':
                if not same_post:
                    raise InstagramPublishError(f'container {old} for an earlier version of this video/caption is '
                                                'already PUBLISHED; nothing was posted again (use a new state file to '
                                                'post a changed version on purpose)', step='resume')
                if not same_cover:
                    result['warnings'].append('this reel was already posted with an earlier cover, so the new cover '
                                              "was not used (a posted reel's cover can't be changed by API; use Edit "
                                              'cover in the Instagram app)')
                return _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live, hosts=hosts)
            if state.get('status') == 'publishing':
                # media_publish was sent, its outcome is unknown and the container status may lag. Whatever changed
                # since (cover, caption or file), look for the post before this container is reused or replaced.
                found = _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live,
                                   required=False, hosts=hosts, earlier_caption_sha=state.get('caption_sha256'))
                if found:
                    if not same_input:
                        found['warnings'].append('the earlier publish went through, so the changed cover, caption or '
                                                 'file was not posted')
                    return found
            if same_input and code in ('FINISHED', 'IN_PROGRESS'):
                container_id = old
            else:
                _archive_container(state, old, code if same_input else
                                   f"superseded ({code}): {'cover' if same_post else 'video or caption'} changed")
        if state.get('video', {}).get('sha256') != video['sha256']:
            state.pop('video_url', None)  # a hosted copy of an older file must never be reused
        state.update({'platform': 'instagram', 'account': {'username': identity['username'], 'ig_user_id': ig_id},
                      'video': {'path': video['path'], 'size': video['size'], 'sha256': video['sha256']},
                      'caption_sha256': caption_sha})
        if live:
            save_state(state_path, state)

        # 4. host the file, check it is public, create the container
        base_body = None
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
            base_body = {'media_type': 'REELS', 'video_url': video_url, 'caption': caption,
                         'share_to_feed': bool(share_to_feed)}
            if ai_generated:
                base_body['is_ai_generated'] = True
            names = resolve_collaborators(collaborators, expected_username)
            if names:   # Collab invite; each account must accept before the reel shows on its profile
                base_body['collaborators'] = names
            result['collaborators'] = names
            if trial:   # Trial Reel: Meta shows it to non-followers first [ig-user/media trial_params]
                base_body['trial_params'] = {'graduation_strategy': trial}
            result['trial'] = trial
            hosted_cover = None
            if cover_provider is not None:
                try:
                    hosted_cover = _host_cover(steps, client, cover_provider, cover, state, state_path, live)
                except InstagramPublishError as error:
                    _drop_cover(result, error, cover_required, offset)
            container_id = _create_container(steps, client, ig_id, base_body, video['size'], hosted_cover, cover_key,
                                             offset, cover_required, state, state_path, result, live)

        # 5. wait until Meta has fetched and processed the video
        result['container_id'] = container_id
        try:
            outcome = _wait_for_container(steps, client, container_id, state, state_path, live, sleep, clock,
                                          poll_seconds, timeout)
        except ContainerFailedError as error:
            # a container made in this run with cover_url ended ERROR: Meta may not take the cover, so the reel gets
            # one more container without it (a video problem fails again, with Meta's own message)
            if base_body is None or not state.get('cover_key') or error.container_status != 'ERROR':
                raise
            _drop_cover(result, error, cover_required, offset)
            _archive_container(state, container_id, 'ERROR with cover_url; made again without the cover')
            container_id = _create_container(steps, client, ig_id, base_body, video['size'], None, None, offset,
                                             cover_required, state, state_path, result, live)
            result['container_id'] = container_id
            outcome = _wait_for_container(steps, client, container_id, state, state_path, live, sleep, clock,
                                          poll_seconds, timeout)
        if outcome == 'PUBLISHED':
            return _reconcile(steps, client, ig_id, container_id, caption, state, state_path, result, live,
                              hosts=hosts)
        if stop_after == 'container':
            result['status'] = 'container_ready' if live else ('blocked' if result['blockers'] else 'planned')
            result['notes'] = ['stop_after=container: media_publish was not called. The container stays unpublished '
                               'and expires 24 h after it was made; nothing appears on the profile.']
            return result

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
        _finish(steps, client, media_id, hosts, state, state_path, result, live)
        if not live and result['blockers']:
            result['status'] = 'blocked'
        return result
    finally:
        client.close()


# --- the cover ------------------------------------------------------------------------------------------------------

def _prepare_cover(cover_url, cover_path, cover_required, result, offset):
    """(provider, local cover info) for this run, checked before anything is sent. A cover that can't be used is
    dropped with a warning ((None, None) comes back), or stops the run when cover_required."""
    if cover_url is None and not cover_path:
        return None, None
    try:
        provider = _provider(cover_url, 'cover_url', 'cover_url', 'host_cover')
        cover = validate_cover(cover_path) if cover_path else None
        if provider is None:
            raise InstagramPublishError('cover_path was given without cover_url: Meta must fetch the cover from a '
                                        'public HTTPS URL (pass cover_url=<https URL> or a provider object)',
                                        step='cover')
        if cover is None and not isinstance(provider, StaticUrlProvider):
            raise InstagramPublishError('a cover_url provider hosts a local file: pass cover_path too', step='cover')
    except InstagramPublishError as error:
        _drop_cover(result, error, cover_required, offset)
        return None, None
    result['cover'] = {'provider': type(provider).__name__, **(cover or {}), 'status': 'planned'}
    return provider, cover


def _drop_cover(result, error, cover_required, offset):
    """Go on without the cover (a warning), or re-raise when the caller asked for cover_required."""
    if cover_required:
        raise error
    message = _mask_urls(str(error))
    fallback = (f'thumb_offset_ms {offset} picks the frame instead' if offset is not None
                else 'Instagram picks the frame')
    result['warnings'].append(f'Instagram cover dropped, the reel posts without it ({fallback}): {message}')
    result['cover'] = {**(result.get('cover') or {}), 'status': 'dropped', 'error': message}


def _cover_key(provider, cover):
    """Which cover a container carries: the local JPEG's sha256 or, for a URL-only cover, scheme://host/path (a new
    signature on the same URL is not a new cover)."""
    if cover:
        return cover['sha256']
    if provider is None:
        return None
    return 'url:' + urlunsplit(urlsplit(provider.describe(None))._replace(query='', fragment=''))


def _host_cover(steps, client, provider, cover, state, state_path, live):
    """Make the cover JPEG public (like the video) and HEAD-check it before Meta is asked to fetch it. Raises
    InstagramPublishError (step host_cover or check_cover_url) when the cover can't be served."""
    local = Path(cover['path']) if cover else None
    if live:
        try:
            hosted = provider.url_for(local)
        except InstagramPublishError:
            raise
        except Exception as exc:   # a hosting hiccup: the caller drops the cover and posts without it
            raise InstagramPublishError(client.scrub(_mask_urls(f'could not host the cover ({type(exc).__name__}: '
                                                                f'{exc})')), step='host_cover') from None
        url = _check_public_url(hosted, 'cover_url', 'host_cover')
        state.update(cover_url=url, cover_url_provider=type(provider).__name__)
        save_state(state_path, state)
    else:
        url = provider.describe(local)
    steps.note('host_cover', 'HOST', provider=type(provider).__name__, url=url,
               file_size=cover['size'] if cover else None, executed=live)
    check = steps.note('check_cover_url', 'HEAD', url=url, headers={},
                       expect={'status': 200, 'content_type': COVER_MIME, 'max_bytes': COVER_MAX_BYTES,
                               'content_length': cover['size'] if cover else None}, executed=live)
    if live:
        check['result'] = client.check_public_cover(url, cover['size'] if cover else None)
    return url


def _create_container(steps, client, ig_id, base_body, file_size, cover_url, cover_key, offset, cover_required, state,
                      state_path, result, live):
    """POST /media with cover_url (or thumb_offset when no cover goes out) and record the container. When Meta answers
    HTTP 400 to a request that carried cover_url and the error is not about the token, the limits or the video
    format, the cover is the likely cause: the container is requested once more without it."""
    body = dict(base_body)
    if cover_url:
        body['cover_url'] = cover_url
    elif offset is not None:
        body['thumb_offset'] = int(offset)
    try:
        created = steps.post('create_container', client.path(ig_id, 'media'), body, file_size=file_size)
    except InstagramPublishError as error:
        if not cover_url or error.http_status != 400 or error.code in NOT_COVER_ERROR_CODES:
            raise
        _drop_cover(result, error, cover_required, offset)
        return _create_container(steps, client, ig_id, base_body, file_size, None, None, offset, cover_required,
                                 state, state_path, result, live)
    if cover_url:
        result['cover'].update(url=safe_url(cover_url), status='sent' if live else 'planned')
    container_id = str(created['id']) if live else '<IG_CONTAINER_ID>'
    if live:
        state.update(container_id=container_id, container_created_at=_now(), status='container_created',
                     container_status='IN_PROGRESS')
        if cover_url:
            state['cover_key'] = cover_key
        else:
            state.pop('cover_key', None)
        save_state(state_path, state)
    return container_id


# --- containers and the post ----------------------------------------------------------------------------------------

def _caption_sha(caption):
    return hashlib.sha256(caption.encode()).hexdigest()


def _archive_container(state, container_id, reason):
    state.setdefault('previous_containers', []).append({'id': container_id, 'reason': reason, 'at': _now()})
    for key in ('container_id', 'container_created_at', 'container_status', 'cover_key'):
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
            error = ContainerFailedError(f"Instagram container {container_id} is {code}: {status.get('status')} "
                                         '(a rerun creates a fresh container)', step='container_status')
            error.container_status = code
            raise error
        if clock() >= deadline:
            raise InstagramPublishError(f'Instagram container {container_id} is still {code} after {timeout:g}s; '
                                        'rerun with the same state file to keep waiting', step='container_status',
                                        retriable=True)
        sleep(poll_seconds)


def _reconcile(steps, client, ig_id, container_id, caption, state, state_path, result, live, required=True,
               hosts=(None, None), earlier_caption_sha=None, media_types=REEL_MEDIA_TYPES):
    """The container is (or may be) PUBLISHED but its media id was never recorded: find the post (by this caption or
    by the caption of the earlier attempt) instead of posting again. With required=False a miss returns None so the
    caller can go on. A post whose media_type is not one of media_types never matches (a carousel can carry the
    reel's caption on the same account); a post without media_type in the answer is judged by its caption alone."""
    recent = steps.get('reconcile', client.path(ig_id, 'media'),
                       {'fields': 'id,caption,media_type,permalink,timestamp', 'limit': 10})
    wanted = {_caption_sha(caption), earlier_caption_sha} - {None}
    match = next((m for m in recent.get('data') or []
                  if _caption_sha((m.get('caption') or '').strip()) in wanted
                  and (not m.get('media_type') or m['media_type'] in media_types)), None)
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
        _release_hosted(state, hosts, result['warnings'])
    result.update(status='already_published', media_id=str(match['id']), permalink=match.get('permalink'))
    return result


def _finish(steps, client, media_id, hosts, state, state_path, result, live):
    media = steps.get('permalink', client.path(media_id), {'fields': 'id,permalink,shortcode,timestamp'}, run=live)
    result.update(status='published' if live else 'planned', media_id=media_id,
                  permalink=(media or {}).get('permalink'))
    if not live:
        return
    state.update(permalink=media.get('permalink'), shortcode=media.get('shortcode'))
    save_state(state_path, state)
    _release_hosted(state, hosts, result['warnings'])


def _release_hosted(state, hosts, warnings):
    """The post is live: take the hosted video and cover down through their providers' release()."""
    for label, provider, key in (('video', hosts[0], 'video_url'), ('cover', hosts[1], 'cover_url')):
        url = state.get(key)
        if provider is None or not url or not hasattr(provider, 'release'):
            continue
        try:
            provider.release(url)
        except Exception as exc:  # the post is live; a hosting cleanup failure is only worth a warning
            warnings.append(f'could not release the hosted {label}: {_mask_urls(str(exc))}')


# --- carousels -------------------------------------------------------------------------------------------------------
# Verified against Meta's docs on 2026-10-24 (developers.facebook.com/docs/instagram-platform/content-publishing and
# instagram-graph-api/reference/ig-user/media):
#   POST /<IG_ID>/media  image_url, is_carousel_item=true             -> one item container per slide (no caption:
#        "Not supported on images or videos in carousels"; is_ai_generated on a child "will result in an error")
#   POST /<IG_ID>/media  media_type=CAROUSEL, children=<id,id,...>, caption, collaborators, is_ai_generated
#        ("For carousels, only the carousel container needs to have the is_ai_generated parameter set to true";
#        collaborators: "For Feed image, Reels and Carousels only", up to 3)
#   POST /<IG_ID>/media_publish  creation_id=<carousel container>    ("Carousels count as a single post")
# Up to 20 items; images JPEG only, at most 8 MB, aspect 4:5 to 1.91:1. trial_params needs media_type REELS ("The
# media_type must be REELS if this parameter is included"), so a carousel is never a Trial post.

def validate_carousel_images(image_urls, image_sizes=None):
    """2-20 public https JPEG URLs (sizes, when given, are the local byte counts the hosted files must match)."""
    urls = [_check_public_url(u, f'image_url {i + 1}', 'carousel_images') for i, u in enumerate(image_urls or [])]
    if not CAROUSEL_MIN <= len(urls) <= CAROUSEL_MAX:
        raise InstagramPublishError(f'a carousel takes {CAROUSEL_MIN}-{CAROUSEL_MAX} images, got {len(urls)}',
                                    step='carousel_images')
    if len(set(urls)) != len(urls):
        raise InstagramPublishError('the carousel image URLs repeat a slide', step='carousel_images')
    sizes = list(image_sizes) if image_sizes is not None else [None] * len(urls)
    if len(sizes) != len(urls):
        raise InstagramPublishError(f'{len(sizes)} image sizes for {len(urls)} images', step='carousel_images')
    for i, size in enumerate(sizes):
        if size is not None and size > IMAGE_MAX_BYTES:
            raise InstagramPublishError(f'slide {i + 1} is {size} bytes; Instagram images are at most 8 MB',
                                        step='carousel_images')
    return urls, sizes


def check_public_image(client, url, expected_size=None, index=None):
    """HEAD (or a one-byte GET) on a hosted slide, with no credentials: 200, image/jpeg, at most 8 MB, the local size."""
    shown, name = safe_url(url), f'slide {index}' if index else 'image'
    try:
        response = client.public.head(url)
        if response.status_code in (403, 405, 501):
            response = client.public.get(url, headers={'Range': 'bytes=0-0'})
    except httpx.HTTPError as exc:
        raise InstagramPublishError(f'hosted {name} {shown} is not reachable ({type(exc).__name__})',
                                    step='check_image_url') from None
    if response.status_code not in (200, 206):
        raise InstagramPublishError(f'hosted {name} {shown} answered HTTP {response.status_code}; Meta needs 200',
                                    step='check_image_url')
    content_type = (response.headers.get('content-type') or '').split(';')[0].strip().lower()
    if content_type != IMAGE_MIME:
        raise InstagramPublishError(f'hosted {name} {shown} is served as {content_type or "no content type"}, not '
                                    f'{IMAGE_MIME} (Instagram takes JPEG only)', step='check_image_url')
    length = response.headers.get('content-length')
    if response.status_code == 206:
        length = (response.headers.get('content-range') or '').rpartition('/')[2] or None
    size = int(length) if length and length.isdigit() else None
    if size is not None and size > IMAGE_MAX_BYTES:
        raise InstagramPublishError(f'hosted {name} {shown} is {size} bytes; the limit is 8 MB', step='check_image_url')
    if size is not None and expected_size is not None and size != expected_size:
        raise InstagramPublishError(f'hosted {name} {shown} is {size} bytes but the local file is {expected_size}',
                                    step='check_image_url')
    return {'status': response.status_code, 'content_length': size, 'content_type': content_type}


def _carousel_key(urls, sizes, caption):
    blob = json.dumps({'urls': urls, 'sizes': sizes, 'caption': _caption_sha(caption)}, sort_keys=True)
    return hashlib.sha256(blob.encode()).hexdigest()


def publish_carousel(image_urls, lesson, *, dry_run=True, state_path=None, **options):
    """Publish an image carousel (slides already served at public https URLs, in order) with
    lesson['captions']['instagram'] as the caption. Anything other than dry_run=False is a dry run: GETs only, and
    the return value lists every request that would be sent. Progress (each child container, the carousel container,
    the publish attempt) is saved to state_path, so a rerun resumes and never posts twice.

    options: image_sizes (local byte count per slide, compared with the hosted Content-Length), credentials_path,
    token, transport, sleep, clock, expected_username, collaborators (None = the owner's default Collab for the posting
    account, [] = none), ai_generated (sets is_ai_generated on the carousel container only), poll_seconds, timeout,
    api_version. There is no trial option: Meta accepts trial_params only with media_type REELS."""
    live = dry_run is False
    if live and not state_path:
        raise InstagramPublishError('publishing needs a state_path: it records every remote id so a retry never '
                                    'posts twice', step='state')
    with _StateLock(state_path) if live else contextlib.nullcontext():
        return _publish_carousel(image_urls, lesson, live=live, state_path=state_path, **options)


def _publish_carousel(image_urls, lesson, *, live, state_path, image_sizes=None, credentials_path=None, token=None,
                      transport=None, sleep=time.sleep, clock=time.monotonic, expected_username=EXPECTED_USERNAME,
                      collaborators=None, ai_generated=True, poll_seconds=POLL_SECONDS, timeout=PROCESS_TIMEOUT,
                      api_version=API_VERSION):
    caption = caption_for(lesson)
    urls, sizes = validate_carousel_images(image_urls, image_sizes)
    names = resolve_collaborators(collaborators, expected_username)
    key = _carousel_key(urls, sizes, caption)
    state = load_state(state_path)
    result = {'platform': 'instagram', 'kind': 'carousel', 'dry_run': not live,
              'state_path': str(state_path) if state_path else None, 'slides': len(urls),
              'caption': {'text': caption, 'length': len(caption), 'hashtags': len(HASHTAG_RE.findall(caption)),
                          'mentions': len(MENTION_RE.findall(caption))},
              'collaborators': names, 'trial': None, 'warnings': [], 'blockers': []}
    if state.get('status') in PUBLISHED_STATES or state.get('media_id'):
        if state.get('carousel_key') not in (None, key):
            result['warnings'].append('state shows an earlier carousel with other slides or caption; nothing was '
                                      'posted again')
        result.update(status='already_published', media_id=state.get('media_id'), permalink=state.get('permalink'),
                      container_id=state.get('container_id'), requests=[])
        return result
    if token is None:
        token = load_credentials(credentials_path)['access_token']
    client = InstagramClient(token, transport=transport, version=api_version)
    steps = _Steps(client, live)
    result['requests'] = steps.log
    try:
        identity = _identity_and_quota(steps, client, expected_username, state, result, live)
        ig_id = identity['ig_user_id']
        same_input = state.get('carousel_key') == key
        old = state.get('container_id')
        container_id = None
        if old:
            status = steps.get('container_status', client.path(old), {'fields': 'id,status,status_code'})
            code = status.get('status_code')
            result['resume'] = {'container_id': old, 'status_code': code, 'same_input': same_input}
            if code == 'PUBLISHED':
                return _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live,
                                  media_types=CAROUSEL_MEDIA_TYPES,
                                  earlier_caption_sha=state.get('caption_sha256'))
            if state.get('status') == 'publishing':
                found = _reconcile(steps, client, ig_id, old, caption, state, state_path, result, live,
                                   required=False, media_types=CAROUSEL_MEDIA_TYPES,
                                   earlier_caption_sha=state.get('caption_sha256'))
                if found:
                    if not same_input:
                        found['warnings'].append('the earlier publish went through, so the changed slides or '
                                                 'caption were not posted')
                    return found
            if same_input and code in ('FINISHED', 'IN_PROGRESS'):
                container_id = old
            else:
                _archive_container(state, old, code if same_input else f'superseded ({code}): slides or caption changed')
        if not same_input:
            if state.get('children'):
                state.setdefault('previous_children', []).append(
                    {'ids': [c.get('container_id') for c in state['children']], 'reason': 'slides or caption changed',
                     'at': _now()})
            state['children'] = []
        state.update({'platform': 'instagram', 'kind': 'carousel',
                      'account': {'username': identity['username'], 'ig_user_id': ig_id},
                      'carousel_key': key, 'caption_sha256': _caption_sha(caption), 'image_urls': urls})
        if live:
            save_state(state_path, state)

        if not container_id:
            # 3. the slides must be public JPEGs before Meta is asked to fetch them
            for i, (url, size) in enumerate(zip(urls, sizes), 1):
                check = steps.note('check_image_url', 'HEAD', url=url, headers={}, slide=i,
                                   expect={'status': 200, 'content_type': IMAGE_MIME, 'max_bytes': IMAGE_MAX_BYTES,
                                           'content_length': size}, executed=live)
                if live:
                    check['result'] = check_public_image(client, url, size, i)
            # 4. one item container per slide (kept across reruns while FINISHED / IN_PROGRESS)
            children = state.setdefault('children', [])
            while len(children) < len(urls):
                children.append({})
            child_ids = []
            for i, url in enumerate(urls):
                child = children[i]
                if child.get('container_id') and child.get('image_url') == url:
                    status = steps.get('child_status', client.path(child['container_id']),
                                       {'fields': 'id,status,status_code'}, run=live)
                    code = (status or {}).get('status_code')
                    if code in ('FINISHED', 'IN_PROGRESS'):
                        child_ids.append(child['container_id'])
                        continue
                    state.setdefault('previous_children', []).append(
                        {'ids': [child['container_id']], 'reason': f'slide {i + 1} {code}', 'at': _now()})
                created = steps.post('create_child', client.path(ig_id, 'media'),
                                     {'image_url': url, 'is_carousel_item': True}, slide=i + 1)
                child_id = str(created['id']) if live else f'<CHILD_CONTAINER_ID_{i + 1}>'
                children[i] = {'image_url': url, 'container_id': child_id, 'created_at': _now()}
                child_ids.append(child_id)
                if live:
                    state['status'] = 'children_created'
                    save_state(state_path, state)
            # image containers are usually FINISHED at once; wait for each before the carousel references it
            for i, child_id in enumerate(child_ids):
                _wait_for_child(steps, client, child_id, i + 1, live, sleep, clock, poll_seconds, timeout)
            # 5. the carousel container
            body = {'media_type': 'CAROUSEL', 'children': ','.join(child_ids), 'caption': caption}
            if names:
                body['collaborators'] = names
            if ai_generated:
                body['is_ai_generated'] = True
            created = steps.post('create_container', client.path(ig_id, 'media'), body)
            container_id = str(created['id']) if live else '<IG_CAROUSEL_CONTAINER_ID>'
            if live:
                state.update(container_id=container_id, container_created_at=_now(), status='container_created',
                             container_status='IN_PROGRESS')
                save_state(state_path, state)
        result['container_id'] = container_id
        outcome = _wait_for_container(steps, client, container_id, state, state_path, live, sleep, clock,
                                      poll_seconds, timeout)
        if outcome == 'PUBLISHED':
            return _reconcile(steps, client, ig_id, container_id, caption, state, state_path, result, live,
                              media_types=CAROUSEL_MEDIA_TYPES)
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
        _finish(steps, client, media_id, (None, None), state, state_path, result, live)
        if not live and result['blockers']:
            result['status'] = 'blocked'
        return result
    finally:
        client.close()


def _wait_for_child(steps, client, child_id, index, live, sleep, clock, poll_seconds, timeout):
    if not live:
        steps.get('child_status', client.path(child_id), {'fields': 'id,status,status_code'}, run=False)
        steps.log[-1]['repeat'] = f'until status_code is FINISHED (max {timeout:g}s)'
        return
    deadline = clock() + timeout
    while True:
        status = steps.get('child_status', client.path(child_id), {'fields': 'id,status,status_code'})
        code = status.get('status_code')
        if code == 'FINISHED':
            return
        if code in ('ERROR', 'EXPIRED', 'PUBLISHED'):
            error = ContainerFailedError(f"carousel slide {index} container {child_id} is {code}: "
                                         f"{status.get('status')} (a rerun makes that slide again)",
                                         step='child_status')
            error.container_status = code
            raise error
        if clock() >= deadline:
            raise InstagramPublishError(f'carousel slide {index} container {child_id} is still {code} after '
                                        f'{timeout:g}s; rerun with the same state file to keep waiting',
                                        step='child_status', retriable=True)
        sleep(poll_seconds)


# --- command line ---------------------------------------------------------------------------------------------------

def main(argv=None):
    """python -m app.publish_instagram <video.mp4> <lesson.json> --video-url URL [--cover-url URL --cover JPG]
           [--account with.hammad] [--trial MANUAL|SS_PERFORMANCE] [--state FILE] [--stop-after container]
           [--cover-required] [--live]

    A dry run unless --live, and --live only together with --stop-after container: this command never posts a reel
    (a post goes through publish() after the owner's explicit OK). Its job is the one-time cover_url check in
    docs/PENDING.md: create ONE container with cover_url, wait for FINISHED, record it in the state file, stop."""
    import argparse
    import sys
    from . import instagram_tokens
    parser = argparse.ArgumentParser(prog='python -m app.publish_instagram', description=main.__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('video')
    parser.add_argument('lesson', help='lesson.json (its captions.instagram is the caption)')
    parser.add_argument('--account', default='with.hammad',
                        help='posting account; the token is work/.secrets/instagram-<account>-oauth.json')
    parser.add_argument('--video-url', required=True, help='public https URL already serving the video')
    parser.add_argument('--cover-url', help='public https URL already serving the cover JPEG')
    parser.add_argument('--cover', help='the local cover JPEG (compared with the hosted size)')
    parser.add_argument('--state', help='state file; use a scratch file for the cover test')
    parser.add_argument('--stop-after', choices=('container',), help='never call media_publish')
    parser.add_argument('--cover-required', action='store_true', help='stop instead of dropping a cover that fails')
    parser.add_argument('--trial', choices=('MANUAL', 'SS_PERFORMANCE'), help='Trial Reel graduation strategy')
    parser.add_argument('--live', action='store_true', help='send the writes (needs --stop-after container)')
    args = parser.parse_args(argv)
    if args.live and args.stop_after != 'container':
        parser.error('--live needs --stop-after container: this command never posts a reel')
    account = args.account.lstrip('@')
    try:
        result = publish(args.video, json.loads(Path(args.lesson).read_text()), dry_run=not args.live,
                         state_path=args.state, url_provider=args.video_url, cover_url=args.cover_url,
                         cover_path=args.cover, expected_username=account,
                         credentials_path=instagram_tokens.account_file(account),
                         cover_required=args.cover_required, stop_after=args.stop_after, trial=args.trial)
    except InstagramPublishError as error:
        print(f'instagram: {error}', file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
