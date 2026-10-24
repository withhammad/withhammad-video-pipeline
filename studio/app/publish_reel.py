"""The daily reel queue: one reel per GST day, each platform at its best slot (docs/BEST_TIMES.md).

Source of truth: outputs/video-pipeline/schedule.json (tracked). docs/SCHEDULE.md is rendered from it
(`render-md`). The slot table lives in app/slots.json; slot_utc(platform, date) turns it into the UTC moment.

From studio/ (every command is a dry run unless it says --live; nothing here enables a scheduler):

  .venv/bin/python -m app.publish_reel slots [--date 2026-10-19]
  .venv/bin/python -m app.publish_reel check <job>
  .venv/bin/python -m app.publish_reel apply-seo <job> [--dry-run]
  .venv/bin/python -m app.publish_reel queue <job> --date 2026-10-19 [--live]
  .venv/bin/python -m app.publish_reel run-due [--now 2026-10-19T13:05:00Z]          (dry run at a chosen time)
  .venv/bin/python -m app.publish_reel run-due --live [--platform linkedin] [--confirm-not-posted [JOB:]linkedin]
  .venv/bin/python -m app.publish_reel mark <job> tiktok <url> [--scheduled]
  .venv/bin/python -m app.publish_reel status [--now ISO]
  .venv/bin/python -m app.publish_reel render-md

queue --live: (1) uploads the Short now as private with publishAt = the YouTube slot (the day's backup slot when the
primary is under 30 min away; thumbnail + synthetic-media disclosure; YouTube makes it public itself), then one
read-only status call checks privacy and publishAt; (2) hosts final_ig.mp4 byte for byte (check refuses a file with
edit lists) and cover_1080x1920.jpg on withhammad.com/media through the git-ignored clone work/site/withhammad-rebuild
(pull --rebase, commit, push whenever local main is ahead of origin, wait for HTTP 200 with the right
Content-Length; this runs outside the schedule lock); (3) records every platform's slot and status in schedule.json.
A rerun resumes: a Short the publisher uploaded for this day before a crash is adopted, never uploaded again.
A queued reel whose nothing reached a platform (e.g. a YouTube quota failure) may be queued again on a later day.
run-due --live (always the real clock) posts LinkedIn and Instagram once their slot has passed: within
late_grace_minutes of the slot, else at the day's later backup slot (same grace), else (no later backup) up to
late_limit_hours late; after that the slot is marked missed. It is idempotent: the publishers' own state files
(<job>/publish_<platform>.json) decide whether a post exists, so a rerun after a crash records the post instead
of posting it again. An uncertain post needs the owner to check the profile, then --confirm-not-posted [JOB:]platform
(no post: inside the window it posts, past it the slot is marked missed) or `mark <job> <platform> <url>` (post found).
Exit codes: 0 ok / nothing due, 1 failure or uncertain post, 2 slot missed, 75 another run holds the lock.
TikTok, Facebook and X are scheduled by the owner in Chrome; `mark` records their URLs (`mark --scheduled` on
LinkedIn or Instagram hands that slot to Chrome, and run-due leaves it alone).

Tokens are read only by the publishers from work/.secrets; this module never reads, prints or stores one."""
import argparse
import contextlib
import copy
import datetime as dt
import fcntl
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
import time
import unicodedata
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
JOBS_ROOT = ROOT / 'studio' / '.local' / 'jobs'
SCHEDULE_PATH = ROOT / 'outputs' / 'video-pipeline' / 'schedule.json'
SCHEDULE_MD = ROOT / 'docs' / 'SCHEDULE.md'
SLOTS_PATH = Path(__file__).with_name('slots.json')
SITE_DIR = ROOT / 'work' / 'site' / 'withhammad-rebuild'
SITE_REMOTE = 'https://github.com/withhammad/withhammad-rebuild.git'
SITE_BRANCH = 'main'
SITE_BASE = 'https://withhammad.com'
# Owner rule 2026-10-24: reels go out on @hammadagentic.ai with @with.hammad as the Collab, and anything uploaded from
# @with.hammad goes out only as a Trial Reel. Each queued entry records its account and trial setting; entries queued
# before the rule carry account 'with.hammad' and post as they were queued.
IG_ACCOUNT = 'hammadagentic.ai'
LEGACY_IG_ACCOUNT = 'with.hammad'
TRIAL_FOR = {'with.hammad': 'SS_PERFORMANCE'}   # graduation strategy for uploads from that account (new queues)
# Owner choice 2026-10-24 (setup C): the main post on @hammadagentic.ai has no Collab (a Collab reaches @with.hammad's
# followers, and a Trial Reel cannot carry one); a separate Trial Reel on @with.hammad ('instagram_trial', same slot,
# same hosted media) carries the comment-keyword DM, because ManyChat runs on @with.hammad.
IG_TRIAL_ACCOUNT = 'with.hammad'
COMMIT_TRAILER = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'

PLATFORMS = ('youtube', 'linkedin', 'instagram', 'tiktok', 'facebook', 'x')
RUN_DUE_PLATFORMS = ('linkedin', 'instagram', 'instagram_trial')
IG_PLATFORMS = ('instagram', 'instagram_trial')
COMPOSER_PLATFORMS = ('tiktok', 'facebook', 'x')
STATE_FILES = {'youtube': 'publish_youtube.json', 'instagram': 'publish_instagram.json',
               'instagram_trial': 'publish_instagram_trial.json',
               'linkedin': 'publish_linkedin.json'}
FINAL_STATUSES = ('published', 'missed', 'skipped')
POSTABLE = ('pending', 'failed', 'uncertain', 'posting')   # run-due posts only API entries in one of these
REEL_STATE = 'publish_reel.json'       # <job>/publish_reel.json: the publishAt each YouTube upload session started with
LOCK_BUSY_EXIT = 75                    # EX_TEMPFAIL: another run holds the schedule lock (not a failed post)
RUN_DUE_LOCK_WAIT = 300                # run-due waits this long for a queue that holds the lock
YOUTUBE_CONFIRM_GRACE = dt.timedelta(minutes=30)
VIDEO_FILES = ('final.mp4', 'final_ig.mp4', 'final_social.mp4')
COVERS = {'cover_1080x1920.jpg': 2 * 1024 * 1024, 'cover_720x1280.jpg': 2 * 1024 * 1024}
X_MAX_WEIGHT = 280
X_MAX_SECONDS = 140.0
URL_HOSTS = {'youtube': ('youtube.com', 'youtu.be'), 'instagram': ('instagram.com',), 'instagram_trial': ('instagram.com',), 'linkedin': ('linkedin.com',),
             'tiktok': ('tiktok.com',), 'facebook': ('facebook.com', 'fb.watch'), 'x': ('x.com', 'twitter.com')}
USER_AGENT = {'User-Agent': 'withhammad-publish-reel/1'}
HOST_WAIT_SECONDS = 15 * 60
HOST_POLL_SECONDS = 15
DAY_KEYS = ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')
DAY_NAMES = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')

# lesson.json field <- seo/seo.json path (exactly what reel #2, f7da978d101e, applied by hand)
SEO_CAPTIONS = (('instagram', ('instagram', 'caption')), ('youtube_title', ('youtube', 'title')),
                ('youtube_description', ('youtube', 'description')), ('tiktok', ('tiktok', 'caption')),
                ('linkedin', ('linkedin', 'text')))
SEO_REQUIRED = {'youtube': ('title', 'description'), 'instagram': ('caption',), 'tiktok': ('caption',),
                'linkedin': ('text',), 'facebook': ('caption',), 'x': ('post',)}
LESSON_HASHTAGS_MAX = 8


class ReelError(RuntimeError):
    """A refusal or failure with a message meant for the owner."""


class LockBusy(ReelError):
    """Another publish_reel run holds the lock; nothing was attempted (exit LOCK_BUSY_EXIT, retry later)."""


# ---------------------------------------------------------------- slots

_SLOTS_CACHE = {}


def load_slots(path=None):
    path = Path(path or SLOTS_PATH)
    key = (str(path), path.stat().st_mtime_ns)
    if key not in _SLOTS_CACHE:
        _SLOTS_CACHE.clear()
        _SLOTS_CACHE[key] = json.loads(path.read_text())
    return _SLOTS_CACHE[key]


def gst():
    """Asia/Dubai: UTC+4 all year (the UAE has no daylight saving)."""
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(load_slots()['timezone'])
    except Exception:  # no tz database (slim container): the fixed offset is exact for Dubai
        return dt.timezone(dt.timedelta(hours=4), 'GST')


def _date(value):
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    try:
        return dt.date.fromisoformat(str(value).strip())
    except ValueError:
        raise ReelError(f'{value!r} is not a date (YYYY-MM-DD)') from None


def slot_time(platform, date, backup=False, slots=None):
    """'HH:MM' GST for platform on date: a weekday-specific rule (e.g. 'fri') beats weekend/weekday, which beat
    'default'. Raises ReelError when the table has no slot (LinkedIn has no weekend backup)."""
    slots = slots or load_slots()
    platform = 'instagram' if platform == 'instagram_trial' else platform   # the trial post shares the Instagram slot
    if platform not in slots['platforms']:
        raise ReelError(f'unknown platform {platform!r}; one of {", ".join(PLATFORMS)}')
    rules = slots['platforms'][platform]['backup' if backup else 'times']
    day = DAY_KEYS[_date(date).weekday()]
    kind = 'weekend' if day in slots['weekend'] else 'weekday'
    for key in (day, kind, 'default'):
        if key in rules:
            return rules[key]
    raise ReelError(f'{platform} has no {"backup " if backup else ""}slot on a {kind} ({day})')


def slot_local(platform, date, backup=False, slots=None):
    hour, minute = (int(part) for part in slot_time(platform, date, backup, slots).split(':'))
    day = _date(date)
    return dt.datetime(day.year, day.month, day.day, hour, minute, tzinfo=gst())


def slot_utc(platform, date, backup=False, slots=None):
    """The UTC datetime of platform's slot on the GST date (what the APIs and run-due compare against)."""
    return slot_local(platform, date, backup, slots).astimezone(dt.timezone.utc)


def iso_z(moment):
    return moment.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def parse_moment(value):
    """ISO 8601 -> aware UTC datetime. A value without a timezone is read as GST (the Mac's own clock)."""
    if isinstance(value, dt.datetime):
        moment = value
    else:
        try:
            moment = dt.datetime.fromisoformat(str(value).strip().replace('Z', '+00:00'))
        except ValueError:
            raise ReelError(f'{value!r} is not an ISO 8601 date-time') from None
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=gst())
    return moment.astimezone(dt.timezone.utc)


def local_label(moment):
    local = moment.astimezone(gst())
    return f'{DAY_NAMES[local.weekday()]} {local:%Y-%m-%d %H:%M} GST'


def day_slots(date, slots=None):
    slots = slots or load_slots()
    out = {}
    for platform in slots['order']:
        moment = slot_utc(platform, date, slots=slots)
        out[platform] = {'gst': slot_time(platform, date, slots=slots), 'utc': iso_z(moment),
                         'local': local_label(moment), 'via': slots['platforms'][platform]['via']}
    return out


# ---------------------------------------------------------------- runtime (everything that touches the outside)

class Runtime:
    """The real side effects. Tests pass a fake with the same methods; nothing else in this module does I/O
    beyond the job folder, schedule.json and the website clone."""

    def now(self):
        return dt.datetime.now(dt.timezone.utc)

    def sleep(self, seconds):
        time.sleep(seconds)

    # httpx (as in every publisher): it verifies TLS with certifi, while python.org builds of urllib may have no
    # CA bundle at all (CERTIFICATE_VERIFY_FAILED on a perfectly good site)
    def http_status(self, url):
        import httpx
        try:
            return httpx.get(url, follow_redirects=True, timeout=20, headers=USER_AGENT).status_code
        except httpx.HTTPError:
            return None

    def http_head(self, url):
        import httpx
        try:
            response = httpx.head(url, follow_redirects=True, timeout=20, headers=USER_AGENT)
        except httpx.HTTPError:
            return None, None
        length = response.headers.get('content-length')
        return response.status_code, int(length) if length and length.isdigit() else None

    def run(self, cmd, cwd=None):
        import subprocess
        process = subprocess.run([str(part) for part in cmd], cwd=cwd, capture_output=True, text=True, timeout=900)
        if process.returncode:
            tail = ' | '.join((process.stderr or process.stdout or '').strip().splitlines()[-3:])
            raise ReelError(f'{" ".join(str(c) for c in cmd[:3])} failed (exit {process.returncode}): {tail}')
        return process.stdout

    def probe(self, path):
        from . import publish_youtube
        return publish_youtube.probe_video(path)

    def validate(self, kind, path, info):
        """Raise the publisher's own validation error when path would be refused on that platform."""
        from . import publish_instagram, publish_linkedin, publish_youtube
        if kind == 'youtube':
            publish_youtube.validate_video(path, probe=lambda _p: info)
        elif kind == 'linkedin':
            publish_linkedin.validate_video(path, info)
        elif kind == 'instagram':
            publish_instagram.validate_video(path, probe=lambda _p: info)
        elif kind == 'social':
            publish_youtube.validate_video(path, probe=lambda _p: info)

    def mp4_edit_lists(self, path):
        from . import publish_instagram
        return publish_instagram._mp4_layout(path)[1]

    def youtube_publish(self, video_path, lesson, **options):
        from . import publish_youtube
        return publish_youtube.publish(video_path, lesson, **options)

    def youtube_status(self, video_id):
        from . import publish_youtube
        return publish_youtube.video_status(video_id)

    def instagram_publish(self, video_path, lesson, **options):
        from . import instagram_tokens, publish_instagram
        options.setdefault('credentials_path', instagram_tokens.account_file(options.get('expected_username', IG_ACCOUNT)))
        return publish_instagram.publish(video_path, lesson, **options)

    def linkedin_publish(self, video_path, lesson, **options):
        from . import publish_linkedin
        return publish_linkedin.publish(video_path, lesson, **options)


# ---------------------------------------------------------------- small file helpers

def _read_json(path, default=None):
    path = Path(path)
    if not path.exists():
        return copy.deepcopy(default)
    try:
        return json.loads(path.read_text() or 'null')
    except ValueError:
        raise ReelError(f'{path} is not valid JSON; fix it by hand (it may record remote post ids)') from None


def _write_json(path, data, indent=2, mode=None):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f'.{path.name}.', suffix='.tmp')
    try:
        with os.fdopen(fd, 'w') as fh:
            json.dump(data, fh, indent=indent, ensure_ascii=False)
            fh.write('\n')
        if mode is not None:
            os.chmod(tmp, mode)
        elif path.exists():
            os.chmod(tmp, path.stat().st_mode & 0o777)
        else:
            os.chmod(tmp, 0o644)
        os.replace(tmp, path)
    except BaseException:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp)
        raise


def _sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def job_dir(job):
    """A job id (folder under studio/.local/jobs) or a path to the job folder."""
    path = Path(str(job))
    if path.is_dir() and (path / 'lesson.json').exists():
        return path.resolve()
    candidate = Path(JOBS_ROOT) / str(job)
    if candidate.is_dir():
        return candidate
    raise ReelError(f'job {job!r} not found (looked in {JOBS_ROOT})')


def _get(data, keys):
    for key in keys:
        if not isinstance(data, dict):
            return None
        data = data.get(key)
    return data


def load_lesson(jdir):
    lesson = _read_json(Path(jdir) / 'lesson.json')
    if not isinstance(lesson, dict):
        raise ReelError(f'{jdir}/lesson.json is missing or not a JSON object')
    return lesson


def load_seo(jdir):
    seo = _read_json(Path(jdir) / 'seo' / 'seo.json')
    if not isinstance(seo, dict):
        raise ReelError(f'{jdir}/seo/seo.json is missing; run the seo-pack workflow first')
    return seo


def resource_url(lesson, seo=None):
    url = (seo or {}).get('resource_url')
    slug = _get(lesson, ('resource_page', 'slug'))
    return url or (f'{SITE_BASE}/resources/{slug}' if slug else None)


def hosted_urls(slug):
    return {'video_url': f'{SITE_BASE}/media/reels/{slug}.mp4', 'cover_url': f'{SITE_BASE}/media/covers/{slug}.jpg'}


# ---------------------------------------------------------------- SEO copy wins

def _clean_tags(tags):
    out, seen = [], set()
    for raw in tags or []:
        tag = ' '.join(str(raw).split())
        if tag and tag.lower() not in seen:
            seen.add(tag.lower())
            out.append(tag)
    return out[:LESSON_HASHTAGS_MAX]


def seo_lesson(lesson, seo):
    """lesson with the seo-pack copy in its captions (what every publisher reads) and the YouTube tags as hashtags
    (publish_youtube sends lesson.hashtags as snippet.tags; the schema keeps at most 8)."""
    merged = copy.deepcopy(lesson)
    captions = merged.setdefault('captions', {})
    for field, path in SEO_CAPTIONS:
        value = _get(seo, path)
        if isinstance(value, str) and value.strip():
            captions[field] = value
    tags = _clean_tags(_get(seo, ('youtube', 'tags')))
    if tags:
        merged['hashtags'] = tags
    return merged


def seo_differences(lesson, seo):
    merged = seo_lesson(lesson, seo)
    changed = [f'captions.{field}' for field, _ in SEO_CAPTIONS
               if (lesson.get('captions') or {}).get(field) != merged['captions'].get(field)]
    if lesson.get('hashtags') != merged.get('hashtags'):
        changed.append('hashtags')
    return changed


def apply_seo(job, write=True):
    """Merge seo/seo.json into lesson.json the way reel #2 was done by hand. The first time anything changes the
    untouched lesson is kept as lesson.pre_seo.json (never overwritten later)."""
    jdir = job_dir(job)
    lesson, seo = load_lesson(jdir), load_seo(jdir)
    merged = seo_lesson(lesson, seo)
    changed = seo_differences(lesson, seo)
    from . import lesson as lesson_schema
    problem = lesson_schema.schema_problem(merged)
    if problem:
        raise ReelError(f'the merged lesson would fail lesson.SCHEMA ({problem}); fix seo/seo.json')
    pre = jdir / 'lesson.pre_seo.json'
    result = {'job': jdir.name, 'changed': changed, 'dry_run': not write, 'pre_seo': str(pre),
              'pre_seo_created': False}
    if not changed or not write:
        return result
    if not pre.exists():
        shutil.copy2(jdir / 'lesson.json', pre)
        result['pre_seo_created'] = True
    (jdir / 'lesson.json').write_text(json.dumps(merged, ensure_ascii=False, indent=2))
    return result


# ---------------------------------------------------------------- X length

_X_URL = re.compile(r'https?://[^\s]+|(?<![@\w])(?:[a-z0-9-]+\.)+(?:com|net|org|ai|io|co|me|dev|app|so|xyz|uk|ae)'
                    r'(?:/[^\s]*)?', re.I)
_X_LIGHT = ((0, 4351), (8192, 8205), (8208, 8223), (8242, 8247))


def x_weighted_length(text):
    """twitter-text weighting: every URL counts 23, code points in the Latin ranges 1, everything else 2."""
    text = unicodedata.normalize('NFC', str(text or ''))
    urls = _X_URL.findall(text)
    rest = _X_URL.sub('', text)
    return 23 * len(urls) + sum(1 if any(lo <= ord(ch) <= hi for lo, hi in _X_LIGHT) else 2 for ch in rest)


# ---------------------------------------------------------------- readiness gate

def _blocker(items, code, message, platform=None):
    items.append({'code': code, 'platform': platform, 'message': message})


def publisher_state(jdir, platform):
    path = Path(jdir) / STATE_FILES[platform]
    data = _read_json(path, {}) or {}
    if platform == 'youtube':
        data = data.get('youtube') or {}
    return data


def posted_record(jdir, platform):
    """What the publisher's own state file says was posted, or None. This is the double-post guard."""
    if platform not in STATE_FILES:
        return None
    state = publisher_state(jdir, platform)
    if platform == 'youtube' and state.get('status') == 'published' and state.get('video_id'):
        return {'video_id': state['video_id'], 'url': state.get('url'), 'privacy': state.get('privacy_status')}
    if platform in IG_PLATFORMS and (state.get('media_id') or state.get('status') in
                                    ('published', 'published_media_id_unknown')):
        return {'media_id': state.get('media_id'), 'url': state.get('permalink'), 'status': state.get('status')}
    if platform == 'linkedin' and state.get('status') == 'published':
        return {'post_urn': state.get('post_urn'), 'url': state.get('post_url')}
    return None


def attempt_in_progress(jdir, platform):
    """True when the publisher started a post whose outcome it does not know (a crash mid-publish)."""
    state = publisher_state(jdir, platform) if platform in STATE_FILES else {}
    if platform == 'linkedin':
        return bool(state.get('post_attempt'))
    if platform in IG_PLATFORMS:
        return state.get('status') == 'publishing'
    return False


AI_DISCLOSURE = re.compile(r'\bAI (?:avatar|presenter)\b', re.I)
X_DISCLOSURE = 'ai avatar of me'
DISCLOSED_COPY = (('instagram', 'caption'), ('linkedin', 'text'), ('tiktok', 'caption'), ('facebook', 'caption'),
                  ('youtube', 'description'))


def _failed_checks(node, path='checks'):
    """Every seo.checks entry with ok: false, as (dotted path, detail). The seo pack nests them per platform or
    flattens them ('youtube.title_len'); both shapes are walked."""
    out = []
    if isinstance(node, dict):
        if node.get('ok') is False:
            out.append((path, node.get('detail')))
        for key, value in node.items():
            out.extend(_failed_checks(value, f'{path}.{key}'))
    return out


def _disclosure_checks(seo, url, blockers, warnings):
    """Require the resource link and explicit AI disclosure. Approved non-twin presenters may say
    "AI presenter" instead of claiming the avatar depicts the owner. API disclosure flags remain required."""
    post = _get(seo, ('x', 'post'))
    if isinstance(post, str) and post.strip():
        if X_DISCLOSURE not in post.lower() and not re.search(r'\bAI presenter\b', post, re.I):
            _blocker(blockers, 'disclosure', 'seo.json x.post lacks "AI avatar of me" or "AI presenter"', 'x')
        bare = re.sub(r'^https?://', '', url or '').rstrip('/')
        if not bare or bare.lower() not in post.lower():
            _blocker(blockers, 'x_link', f'seo.json x.post lacks the resource link {url or "(none)"}', 'x')
    for platform, field in DISCLOSED_COPY:
        value = _get(seo, (platform, field))
        if isinstance(value, str) and value.strip() and not AI_DISCLOSURE.search(value):
            _blocker(blockers, 'disclosure', f'seo.json {platform}.{field} has no AI-avatar disclosure line', platform)
    for path, detail in _failed_checks(seo.get('checks')):
        if 'disclosure' in path.lower():
            _blocker(blockers, 'disclosure', f'seo.json {path} is not ok: {detail}')
        elif 'resource_url' not in path.lower():     # resource URL checks are superseded by the live check below
            warnings.append(f'seo.json {path} is not ok: {_short(detail, 200)}')


def check_report(job, rt=None, ignore_posted=()):
    """Every reason the reel cannot enter the queue (blockers) plus warnings. ignore_posted: platforms this
    queue entry itself already scheduled or posted (a resumed queue)."""
    rt = rt or Runtime()
    jdir = job_dir(job)
    blockers, warnings = [], []
    # 1. videos: exist, probe, and pass each publisher's own check
    for name, kinds in (('final.mp4', ('youtube', 'linkedin')), ('final_ig.mp4', ('instagram',)),
                        ('final_social.mp4', ('social',))):
        path = jdir / name
        if not path.is_file() or path.stat().st_size == 0:
            _blocker(blockers, 'video_missing', f'{name} is missing (app.exports makes final_ig/final_social)')
            continue
        try:
            info = rt.probe(path)
        except Exception as error:
            _blocker(blockers, 'video_probe', f'{name}: ffprobe failed: {error}')
            continue
        for kind in kinds:
            try:
                rt.validate(kind, path, info)
            except Exception as error:
                _blocker(blockers, 'video_spec', f'{name} ({kind}): {error}', None if kind == 'social' else kind)
        if name == 'final_ig.mp4':
            # the hosted file must be byte-identical to final_ig.mp4 (publish_instagram compares the hosted
            # Content-Length with the local size), so a file with edit lists is fixed in the job, never on the host
            try:
                edit_lists = rt.mp4_edit_lists(path)
            except Exception as error:
                edit_lists = None
                warnings.append(f'final_ig.mp4: could not read its MP4 layout ({_short(error, 200)})')
            if edit_lists:
                _blocker(blockers, 'video_edit_lists', 'final_ig.mp4 has MP4 edit lists, which Meta rejects; run '
                                                       f'`.venv/bin/python -m app.exports {_rel(jdir)}/final.mp4` '
                                                       '(it writes -use_editlist 0)', 'instagram')
        if name == 'final_social.mp4':
            duration = float((info.get('format') or {}).get('duration') or 0)
            if duration > X_MAX_SECONDS:
                warnings.append(f'final_social.mp4 is {duration:.0f} s; X allows {X_MAX_SECONDS:.0f} s without Premium')
    # 2. covers
    for name, limit in COVERS.items():
        path = jdir / name
        if not path.is_file():
            _blocker(blockers, 'cover_missing', f'{name} is missing (app.thumbnail build)')
            continue
        data = path.read_bytes()[:3]
        if data != b'\xff\xd8\xff':
            _blocker(blockers, 'cover_format', f'{name} is not a JPEG')
        elif path.stat().st_size > limit:
            _blocker(blockers, 'cover_size', f'{name} is {path.stat().st_size} bytes (YouTube allows 2 MB)')
    cover_meta = _read_json(jdir / 'cover.json', {}) or {}
    for warning in cover_meta.get('warnings') or []:
        warnings.append(f'cover.json: {warning}')
    # 3. lesson
    try:
        lesson = load_lesson(jdir)
    except ReelError as error:
        _blocker(blockers, 'lesson', str(error))
        return {'job': jdir.name, 'blockers': blockers, 'warnings': warnings}
    from . import lesson as lesson_schema
    problem = lesson_schema.schema_problem(lesson)
    if problem:
        _blocker(blockers, 'lesson_schema', f'lesson.json fails lesson.SCHEMA: {problem}')
    # 4. SEO copy for all six platforms, and applied to the lesson
    try:
        seo = load_seo(jdir)
    except ReelError as error:
        seo = {}
        _blocker(blockers, 'seo_missing', str(error))
    if seo:
        for platform, fields in SEO_REQUIRED.items():
            for field in fields:
                value = _get(seo, (platform, field))
                if not (isinstance(value, str) and value.strip()):
                    _blocker(blockers, 'seo_copy', f'seo.json has no {platform}.{field}', platform)
        post = _get(seo, ('x', 'post'))
        if isinstance(post, str) and x_weighted_length(post) > X_MAX_WEIGHT:
            _blocker(blockers, 'x_length', f'seo.json x.post is {x_weighted_length(post)} weighted characters '
                                           f'(X allows {X_MAX_WEIGHT}, URLs count 23)', 'x')
        _disclosure_checks(seo, resource_url(lesson, seo), blockers, warnings)
        changed = seo_differences(lesson, seo)
        if changed:
            _blocker(blockers, 'seo_not_applied', f'lesson.json does not carry the SEO copy yet ({", ".join(changed)}); '
                                                  f'run: python -m app.publish_reel apply-seo {jdir.name}')
    # 5. the publishers' own metadata checks, on the copy that will actually be sent
    from . import publish_instagram, publish_linkedin, publish_youtube
    target = seo_lesson(lesson, seo) if seo else lesson
    for platform, func in (('youtube', lambda l: publish_youtube.build_video_resource(l)),
                           ('instagram', publish_instagram.caption_for), ('linkedin', publish_linkedin.build_commentary)):
        try:
            func(target)
        except Exception as error:
            _blocker(blockers, 'metadata', f'{platform}: {error}', platform)
    # 6. ManyChat keyword
    keyword = lesson.get('manychat_keyword')
    if not (isinstance(keyword, str) and re.fullmatch(r'[A-Z]{4,10}', keyword)):
        _blocker(blockers, 'manychat', f'lesson.manychat_keyword {keyword!r} must be one uppercase word of 4-10 letters')
    else:
        if seo.get('manychat_keyword') and seo['manychat_keyword'] != keyword:
            _blocker(blockers, 'manychat', f'lesson keyword {keyword} differs from seo.json {seo["manychat_keyword"]}')
        caption = (target.get('captions') or {}).get('instagram') or ''
        if not re.search(rf'\b{keyword}\b', caption):
            _blocker(blockers, 'manychat', f'the Instagram caption never asks for the keyword {keyword}', 'instagram')
    # 7. resource page live
    url = resource_url(lesson, seo)
    if not url:
        _blocker(blockers, 'resource_page', 'no resource page URL (seo.resource_url or lesson.resource_page.slug)')
    else:
        status = rt.http_status(url)
        if status != 200:
            _blocker(blockers, 'resource_page', f'{url} returned HTTP {status}; the page must be live first '
                                                '(AGENTS.md daily routine step 7)')
    # 8. nothing posted yet
    published = _read_json(jdir / 'published.json', {}) or {}
    for platform in PLATFORMS:
        if platform in ignore_posted:
            continue
        record = published.get(platform)
        if isinstance(record, dict) and (record.get('url') or record.get('video_id') or record.get('media_id')
                                         or record.get('post_urn')):
            _blocker(blockers, 'already_posted', f'published.json already records {platform}: '
                                                 f'{record.get("url") or record}', platform)
        elif posted_record(jdir, platform):
            _blocker(blockers, 'already_posted', f'{STATE_FILES[platform]} says {platform} was already posted',
                     platform)
    return {'job': jdir.name, 'resource_url': url, 'keyword': keyword, 'blockers': blockers, 'warnings': warnings}


def check(job, rt=None):
    """The readiness gate: a list of blocker messages (empty = the reel may enter the queue)."""
    return [item['message'] for item in check_report(job, rt)['blockers']]


# ---------------------------------------------------------------- schedule.json

def empty_schedule():
    slots = load_slots()
    return {'version': 1, 'timezone': slots['timezone'], 'rule': slots['rule'],
            'slots': 'studio/app/slots.json (from docs/BEST_TIMES.md)', 'history': [], 'queue': []}


def load_schedule(path=None):
    data = _read_json(path or SCHEDULE_PATH, None)
    if data is None:
        return empty_schedule()
    if not isinstance(data, dict) or not isinstance(data.get('queue'), list):
        raise ReelError(f'{path or SCHEDULE_PATH} does not look like a schedule (no "queue" list)')
    data.setdefault('history', [])
    return data


def save_schedule(data, path=None):
    _write_json(path or SCHEDULE_PATH, data, indent=2)


@contextlib.contextmanager
def _flock(lock, wait=0, rt=None, poll=5):
    """An exclusive flock on lock; waits up to `wait` seconds (polling), then raises LockBusy."""
    lock = Path(lock)
    lock.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(lock, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        waited = 0
        while True:
            try:
                fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if waited >= wait:
                    raise LockBusy(f'another publish_reel run holds {lock}; let it finish and rerun') from None
                (rt.sleep if rt else time.sleep)(poll)
                waited += poll
        yield
    finally:
        os.close(fd)


def schedule_lock(path=None, wait=0, rt=None):
    """One writer at a time (a run-due from a timer and a manual queue must never interleave)."""
    path = Path(path or SCHEDULE_PATH)
    return _flock(path.with_name(f'.{path.name}.lock'), wait=wait, rt=rt)


def site_lock(site_dir=None, wait=0, rt=None):
    """One writer at a time in the website clone (two queues must not commit/push there at once)."""
    site = Path(site_dir or SITE_DIR)
    return _flock(site.parent / f'.{site.name}.lock', wait=wait, rt=rt)


def _holds_short(entry):
    """A cancelled entry still holds its day while its Short is scheduled or live on YouTube."""
    yt = (entry.get('platforms') or {}).get('youtube') or {}
    return bool(yt.get('video_id')) and yt.get('status') in ('scheduled', 'published')


def date_holder(schedule, date):
    """The entry (queue or history) that owns this GST date, if any."""
    date = str(_date(date))
    for entry in schedule.get('history', []) + schedule.get('queue', []):
        if entry.get('date') == date and (entry.get('status') != 'cancelled' or _holds_short(entry)):
            return entry
    return None


def job_entry(schedule, jid):
    for entry in schedule.get('queue', []):
        if entry.get('job') == jid and entry.get('status') != 'cancelled':
            return entry
    return None


def _entry_status(entry):
    platforms = entry.get('platforms') or {}
    if platforms and all((platforms.get(p) or {}).get('status') in FINAL_STATUSES
                         for p in (*PLATFORMS, *(k for k in platforms if k not in PLATFORMS))):   # incl. instagram_trial
        return 'done'
    return entry.get('status')


def _refresh_status(entry):
    if _entry_status(entry) == 'done':
        entry['status'] = 'done'


def update_published(jdir, platform, record):
    """Merge one platform's record into <job>/published.json (the shape job 9d2d68af60d4 uses)."""
    path = Path(jdir) / 'published.json'
    data = _read_json(path, {}) or {}
    current = data.get(platform) if isinstance(data.get(platform), dict) else {}
    data[platform] = {**current, **{k: v for k, v in record.items() if v is not None}}
    _write_json(path, data, indent=1)
    return data[platform]


# ---------------------------------------------------------------- queue

def _with_hashtags(caption, hashtags):
    missing = [tag for tag in hashtags or [] if tag.lower() not in caption.lower()]
    return caption.rstrip() + ('\n' + ' '.join(missing) if missing else '')


def composer_entry(platform, seo, slot):
    """What the owner pastes into the composer, and when (GST as written: his Chrome runs on Asia/Dubai)."""
    section = seo.get(platform) or {}
    entry = {'via': 'composer', 'status': 'composer', 'slot_utc': slot['utc'], 'local_time': slot['local'],
             'video': 'final_social.mp4', 'ai_label': section.get('ai_label')}
    if platform == 'x':
        entry.update(text=section.get('post'), weighted_length=x_weighted_length(section.get('post') or ''),
                     cover=None, where='x.com/compose/post as @HammadYousufAI, Schedule')
    else:
        entry.update(text=_with_hashtags(section.get('caption') or '', section.get('hashtags')),
                     cover='cover_1080x1920.jpg (Edit cover > Upload cover)')
        if section.get('pinned_comment'):
            entry['pinned_comment'] = section['pinned_comment']
        if section.get('first_comment'):
            entry['first_comment'] = section['first_comment']
    return entry


def plan_entry(jdir, date, lesson, seo, youtube_at=None):
    slots = day_slots(date)
    slug = lesson['resource_page']['slug']
    platforms = {}
    for platform in PLATFORMS:
        slot = slots[platform]
        if platform in COMPOSER_PLATFORMS:
            platforms[platform] = composer_entry(platform, seo, slot)
            continue
        platforms[platform] = {'via': 'api', 'status': 'pending', 'slot_utc': slot['utc'], 'local_time': slot['local']}
    platforms['youtube'].update(privacy='private', publish_at=slots['youtube']['utc'])
    if youtube_at is not None and iso_z(youtube_at) != slots['youtube']['utc']:   # the backup slot of the day
        platforms['youtube'].update(slot_utc=iso_z(youtube_at), local_time=local_label(youtube_at),
                                    publish_at=iso_z(youtube_at), slot='backup')
    platforms['instagram'].update(account=IG_ACCOUNT, trial=TRIAL_FOR.get(IG_ACCOUNT), collaborators=[], **hosted_urls(slug),
                                  hosted=False)
    platforms['instagram_trial'] = dict(platforms['instagram'], account=IG_TRIAL_ACCOUNT, trial=TRIAL_FOR[IG_TRIAL_ACCOUNT],
                                        collaborators=[])
    day = _date(date)
    return {'date': str(day), 'day': DAY_NAMES[day.weekday()], 'job': jdir.name,
            'title': lesson.get('topic_title'), 'keyword': lesson.get('manychat_keyword'), 'slug': slug,
            'resource_url': resource_url(lesson, seo), 'status': 'queued', 'platforms': platforms}


def _movable(entry):
    """True when nothing of this entry reached a platform (no video id, no post, no hosting needed elsewhere, no
    Chrome schedule): it may move to another day, e.g. after a YouTube quota failure on its own day."""
    if entry.get('status') in ('done', 'cancelled'):
        return False
    for pe in (entry.get('platforms') or {}).values():
        pe = pe or {}
        if pe.get('status') not in (None, 'pending', 'composer', 'failed'):
            return False
        if any(pe.get(key) for key in ('video_id', 'media_id', 'post_urn', 'url')):
            return False
    return True


def _youtube_slot(day, now, lead):
    """The day's YouTube slot that is still at least `lead` ahead: the primary, else the backup (BEST_TIMES.md:
    the backup is used when the primary cannot be). Raises when neither is."""
    primary = slot_utc('youtube', day)
    if primary >= now + lead:
        return primary
    try:
        backup = slot_utc('youtube', day, backup=True)
    except ReelError:
        backup = None
    if backup and backup >= now + lead:
        return backup
    later = f' or its backup {local_label(backup)}' if backup and backup > primary else ''
    raise ReelError(f'the YouTube slot {local_label(primary)}{later} is less than {lead.seconds // 60} minutes away; '
                    'queue the reel on a later day (allowed while nothing of it was scheduled or posted)')


def reel_state(jdir):
    return _read_json(Path(jdir) / REEL_STATE, {}) or {}


def _save_reel_state(jdir, **values):
    data = reel_state(jdir)
    data.update(values)
    _write_json(Path(jdir) / REEL_STATE, data)


def _youtube_adoptable(jdir, day):
    """A Short the publisher already uploaded for this GST day (its state says published and publish_reel.json
    says the session started with one of this day's YouTube slots) whose schedule.json record was lost in a crash."""
    record = posted_record(jdir, 'youtube')
    started = reel_state(jdir).get('youtube_session_publish_at')
    if not record or not started:
        return None
    started = parse_moment(started)
    slots = [slot_utc('youtube', day)]
    with contextlib.suppress(ReelError):
        slots.append(slot_utc('youtube', day, backup=True))
    if started not in slots:
        return None
    return {**record, 'publish_at': iso_z(started)}


def queue(job, date, live=False, rt=None, schedule_path=None):
    """Put a verified reel on its GST date. Dry run by default: checks and returns the plan, writes nothing."""
    rt = rt or Runtime()
    jdir = job_dir(job)
    jid = jdir.name
    day = _date(date)
    slots_cfg = load_slots()
    with schedule_lock(schedule_path):
        schedule = load_schedule(schedule_path)
        holder = date_holder(schedule, day)
        if holder and holder.get('job') != jid:
            raise ReelError(f'one reel per day: {day} is already held by {holder.get("job") or holder.get("jobs")} '
                            f'({holder.get("keyword") or holder.get("title")}); pick the next free day')
        existing = job_entry(schedule, jid)
        if existing and existing.get('date') != str(day):
            if existing.get('status') != 'planned' and not _movable(existing):
                raise ReelError(f'{jid} is already queued on {existing["date"]} and something of it was scheduled or '
                                'posted there; a reel is queued once')
        now = rt.now()
        if day < now.astimezone(gst()).date():
            raise ReelError(f'{day} is in the past (today is {now.astimezone(gst()).date()} GST)')
        resume = bool(existing and existing.get('date') == str(day) and existing.get('platforms'))
        own = existing.get('platforms', {}) if resume else {}
        youtube_done = (own.get('youtube') or {}).get('status') in ('scheduled', 'published')
        adopt = None if youtube_done else _youtube_adoptable(jdir, day)
        lead = dt.timedelta(minutes=slots_cfg.get('youtube_min_lead_minutes', 30))
        if youtube_done:
            yt_at = parse_moment(own['youtube'].get('publish_at') or own['youtube']['slot_utc'])
        elif adopt:
            yt_at = parse_moment(adopt['publish_at'])
        else:
            yt_at = _youtube_slot(day, now, lead)
        if not resume:   # every run-due slot of the day must still be ahead (weekend LinkedIn is before YouTube)
            for platform in RUN_DUE_PLATFORMS:
                slot = slot_utc(platform, day)
                if slot < now + dt.timedelta(minutes=HOST_WAIT_SECONDS // 60):
                    raise ReelError(f'the {platform} slot {local_label(slot)} is already past or less than '
                                    f'{HOST_WAIT_SECONDS // 60} minutes away; queue the reel on a later day')
        ignore = [p for p, pe in own.items() if (pe or {}).get('status') not in (None, 'pending', 'composer')]
        if adopt:
            ignore.append('youtube')
        report = check_report(jdir, rt, ignore_posted=ignore)
        if report['blockers']:
            return {'job': jid, 'date': str(day), 'status': 'refused', 'dry_run': not live,
                    'blockers': [b['message'] for b in report['blockers']], 'warnings': report['warnings']}
        lesson, seo = load_lesson(jdir), load_seo(jdir)
        plan = plan_entry(jdir, day, lesson, seo, youtube_at=yt_at)
        if resume:   # keep everything this entry already did (ids, hosting, posts)
            for platform, pe in own.items():
                if platform == 'youtube' and not youtube_done:
                    continue      # a failed upload is retried on the slot chosen now (maybe the backup)
                if (pe or {}).get('status') not in (None, 'pending', 'composer') or (pe or {}).get('hosted'):
                    plan['platforms'][platform] = {**plan['platforms'].get(platform, {}), **pe}
        steps = _queue_steps(jdir, plan, youtube_done, bool((own.get('instagram') or {}).get('hosted')))
        if adopt:
            steps[0].update(skip=False, action=f'record the Short {adopt["video_id"]} the publisher already uploaded '
                                               f'for publishAt {adopt["publish_at"]} (nothing is uploaded again)')
        if not live:
            return {'job': jid, 'date': str(day), 'status': 'planned', 'dry_run': True, 'warnings': report['warnings'],
                    'steps': steps, 'entry': plan,
                    'notes': ['Dry run: nothing was uploaded, committed or written. Rerun with --live after the '
                              "owner's OK for this reel (AGENTS.md hard rule 5)."]}
        # live: hold the date first, so a crash later still blocks a second reel on it
        if existing:
            schedule['queue'].remove(existing)
        plan['status'] = 'queuing'
        plan['queued_at'] = iso_z(now)
        schedule['queue'].append(plan)
        schedule['queue'].sort(key=lambda e: e['date'])
        save_schedule(schedule, schedule_path)
        warnings, errors = list(report['warnings']), []
        if not youtube_done:
            try:
                if adopt:
                    _adopt_youtube(jdir, plan, adopt, rt)
                else:
                    _queue_youtube(jdir, plan, lesson, rt)
            except Exception as error:
                plan['platforms']['youtube'].update(status='failed', error=_short(error))
                errors.append(f'youtube: {_short(error)}')
            save_schedule(schedule, schedule_path)
        need_host = not plan['platforms']['instagram'].get('hosted')
    # the website push and the deploy wait take minutes: run them without the schedule lock, so a run-due at a
    # slot is not refused meanwhile (the date is already claimed above)
    hosted, hosting_error = None, None
    if need_host:
        try:
            with site_lock(rt=rt):
                hosted = host_instagram_media(jdir, plan['slug'], plan['keyword'], rt)
        except Exception as error:
            hosting_error = _short(error)
            errors.append(f'instagram hosting: {hosting_error}')
    with schedule_lock(schedule_path, wait=RUN_DUE_LOCK_WAIT, rt=rt):
        schedule = load_schedule(schedule_path)
        entry = next((e for e in schedule['queue'] if e.get('job') == jid and e.get('date') == str(day)
                      and e.get('status') != 'cancelled'), None)
        if entry is None:
            raise ReelError(f'the {jid} entry for {day} disappeared from schedule.json while hosting; rerun queue')
        ig = entry['platforms']['instagram']
        if hosted:
            for pe in (ig, entry['platforms'].get('instagram_trial')):
                if pe is not None:
                    pe.update(hosted=True, **hosted)
                    pe.pop('hosting_error', None)
        elif hosting_error:
            ig['hosting_error'] = hosting_error
        if entry['status'] in ('queuing', 'queue_incomplete', 'queued'):
            entry['status'] = 'queued' if not errors else 'queue_incomplete'
        save_schedule(schedule, schedule_path)
    return {'job': jid, 'date': str(day), 'dry_run': False, 'warnings': warnings, 'steps': steps,
            'status': entry['status'], 'errors': errors, 'entry': entry}


def _rel(path):
    try:
        return Path(path).relative_to(ROOT)
    except ValueError:
        return Path(path)


def _short(error, limit=400):
    text = ' '.join(str(error).split())
    return text[:limit]


def _queue_steps(jdir, plan, youtube_done, hosted):
    p = plan['platforms']
    steps = []
    steps.append({'step': 'youtube', 'skip': youtube_done,
                  'action': f'upload {jdir.name}/final.mp4 now as private, publishAt {p["youtube"]["publish_at"]} '
                            f'({p["youtube"]["local_time"]}{", the backup slot" if p["youtube"].get("slot") else ""}), '
                            'thumbnail cover_1080x1920.jpg, containsSyntheticMedia true; YouTube makes it public '
                            'itself; then one read-only status call checks publishAt'})
    steps.append({'step': 'host_instagram_media', 'skip': hosted,
                  'action': f'copy final_ig.mp4 (byte for byte) and cover_1080x1920.jpg into '
                            f'{_rel(SITE_DIR)}/public/media, commit "Host the {plan["keyword"]} reel video '
                            f'and cover for Instagram API publishing", push, wait for 200 at '
                            f'{p["instagram"]["video_url"]} and {p["instagram"]["cover_url"]}'})
    for platform in ('linkedin', 'instagram', 'instagram_trial'):
        if platform not in p:
            continue
        steps.append({'step': platform, 'action': f'run-due --live posts it at {p[platform]["local_time"]} '
                                                  f'({p[platform]["slot_utc"]}); the Mac must be awake'})
    for platform in COMPOSER_PLATFORMS:
        steps.append({'step': platform, 'action': f'owner schedules it in Chrome for {p[platform]["local_time"]}, then '
                                                  f'`mark {jdir.name} {platform} <url>`'})
    return steps


def _youtube_session_guard(jdir, publish_at):
    """publish_youtube sends publishAt only when an upload session starts; resuming a saved session keeps the
    publishAt it was started with. Refuse a resume whose publishAt is not this slot (or unknown), and record the
    publishAt before a new session starts."""
    state = publisher_state(jdir, 'youtube')
    if state.get('upload_url') and state.get('status') != 'published':
        started = reel_state(jdir).get('youtube_session_publish_at')
        if not started or parse_moment(started) != parse_moment(publish_at):
            raise ReelError(f'{STATE_FILES["youtube"]} holds an unfinished upload session started for publishAt '
                            f'{started or "(unknown)"}, not {publish_at}; resuming it would keep the old publishAt. '
                            f'Check YouTube Studio for a half-uploaded video, then move {STATE_FILES["youtube"]} '
                            'aside and rerun queue')
        return
    _save_reel_state(jdir, youtube_session_publish_at=publish_at)


def _verify_youtube_schedule(pe, rt):
    """One read-only status call: the Short must be private with publishAt = this slot (or already public once the
    slot has passed). Raises ReelError with YouTube's real values otherwise."""
    try:
        info = rt.youtube_status(pe['video_id'])
    except Exception as error:
        pe['publish_at_verified'] = False
        return [f'publishAt not verified (status call failed: {_short(error, 200)}); run-due checks it at the slot']
    privacy, actual = info.get('privacy_status'), info.get('publish_at')
    expected = parse_moment(pe['publish_at'])
    if info.get('found') is False or info.get('upload_status') in ('failed', 'rejected', 'deleted'):
        reason = info.get('rejection_reason') or info.get('failure_reason') or info.get('upload_status') or 'not found'
        raise ReelError(f'YouTube reports the upload {info.get("upload_status") or "missing"} ({reason})')
    if privacy == 'public' and rt.now() >= expected:
        pe['publish_at_verified'] = True
        return []
    if privacy != 'private' or not actual or parse_moment(actual) != expected:
        raise ReelError(f'YouTube reports privacy {privacy!r} and publishAt {actual!r}, expected private and '
                        f'{pe["publish_at"]}; fix the Short in YouTube Studio')
    pe['publish_at_verified'] = True
    return []


def _queue_youtube(jdir, plan, lesson, rt):
    pe = plan['platforms']['youtube']
    _youtube_session_guard(jdir, pe['publish_at'])
    result = rt.youtube_publish(jdir / 'final.mp4', lesson, dry_run=False, state_path=jdir / STATE_FILES['youtube'],
                                privacy_status='private', publish_at=pe['publish_at'],
                                thumbnail_path=jdir / 'cover_1080x1920.jpg', contains_synthetic_media=True)
    if result.get('status') != 'published' or not result.get('video_id'):
        raise ReelError(f'YouTube upload ended with status {result.get("status")!r}')
    thumb = result.get('thumbnail') or {}
    pe.update(video_id=result['video_id'], url=result.get('url'), privacy=result.get('privacy_status') or 'private',
              uploaded_at=iso_z(rt.now()), thumbnail=thumb.get('status'))
    _finish_youtube(jdir, pe, rt, [_short(w, 200) for w in result.get('warnings') or []], thumb.get('status'))


def _adopt_youtube(jdir, plan, record, rt):
    """Crash recovery: the publisher uploaded the Short for this slot but schedule.json never heard of it."""
    pe = plan['platforms']['youtube']
    thumb = (publisher_state(jdir, 'youtube').get('thumbnail') or {})
    thumb_status = thumb.get('status') or ('set' if thumb.get('sha256') else None)
    pe.update(video_id=record['video_id'], url=record.get('url'), privacy=record.get('privacy') or 'private',
              publish_at=record['publish_at'], slot_utc=record['publish_at'],
              local_time=local_label(parse_moment(record['publish_at'])), adopted_from_state=True,
              thumbnail=thumb_status)
    warnings = [] if thumb_status else ['the custom cover is not confirmed on this Short; set it with '
                                        f'`python -m app.publish_youtube thumbnail {record["video_id"]} '
                                        'cover_1080x1920.jpg --live`']
    _finish_youtube(jdir, pe, rt, warnings, thumb_status)


def _finish_youtube(jdir, pe, rt, warnings, thumb_status):
    record = {'url': pe.get('url'), 'video_id': pe['video_id'], 'publish_at': pe['publish_at'], 'via': 'api',
              'synthetic_media': True, 'thumbnail': 'custom cover set via thumbnails.set'
              if thumb_status in ('set', 'already_set') else thumb_status}
    try:
        warnings = warnings + _verify_youtube_schedule(pe, rt)
    except ReelError as error:
        update_published(jdir, 'youtube', {**record, 'privacy': f'NOT as scheduled: {error}'})
        raise
    pe.update(status='scheduled', warnings=warnings or None)
    pe.pop('error', None)
    update_published(jdir, 'youtube', {**record, 'privacy': f'private, scheduled public at {pe["publish_at"]} '
                                                            '(publishAt)'})


def _git_ahead(site, rt):
    out = rt.run(['git', 'rev-list', '--count', f'origin/{SITE_BRANCH}..HEAD'], cwd=site).strip()
    return int(out) if out.isdigit() else 0


def _push_site(site, rt, attempts=3):
    """Push local commits; a rejected push (another session pushed meanwhile, or the network) is retried after
    pull --rebase."""
    for attempt in range(1, attempts + 1):
        try:
            rt.run(['git', 'push', 'origin', f'HEAD:{SITE_BRANCH}'], cwd=site)
            return
        except ReelError:
            if attempt == attempts:
                raise
            rt.sleep(5 * attempt)
            rt.run(['git', 'pull', '--rebase'], cwd=site)


def host_instagram_media(jdir, slug, keyword, rt, site_dir=None):
    """Serve final_ig.mp4 and the cover at withhammad.com/media (Meta fetches the video from a public URL). The
    hosted video is byte-identical to final_ig.mp4: publish_instagram compares the hosted size with the local file."""
    site = Path(site_dir or SITE_DIR)
    source = Path(jdir) / 'final_ig.mp4'
    if rt.mp4_edit_lists(source):
        raise ReelError('final_ig.mp4 has MP4 edit lists, which Meta rejects; run app.exports on final.mp4 first')
    if not (site / '.git').exists():
        site.parent.mkdir(parents=True, exist_ok=True)
        rt.run(['git', 'clone', SITE_REMOTE, str(site)])
    branch = rt.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd=site).strip()
    if branch != SITE_BRANCH:
        raise ReelError(f'{site} is on branch {branch!r}, expected {SITE_BRANCH}; fix the clone by hand')
    rt.run(['git', 'pull', '--rebase'], cwd=site)
    video_rel, cover_rel = f'public/media/reels/{slug}.mp4', f'public/media/covers/{slug}.jpg'
    video_dest, cover_dest = site / video_rel, site / cover_rel
    video_dest.parent.mkdir(parents=True, exist_ok=True)
    cover_dest.parent.mkdir(parents=True, exist_ok=True)
    if not video_dest.exists() or _sha256(video_dest) != _sha256(source):
        shutil.copyfile(source, video_dest)
    cover_src = Path(jdir) / 'cover_1080x1920.jpg'
    if not cover_dest.exists() or _sha256(cover_dest) != _sha256(cover_src):
        shutil.copyfile(cover_src, cover_dest)
    if rt.run(['git', 'status', '--porcelain', '--', video_rel, cover_rel], cwd=site).strip():
        rt.run(['git', 'add', '--', video_rel, cover_rel], cwd=site)
        rt.run(['git', 'commit', '-m', f'Host the {keyword} reel video and cover for Instagram API publishing',
                '-m', COMMIT_TRAILER], cwd=site)
    commit = None
    # push whenever local main is ahead of origin, not only when this run committed: a commit whose push failed
    # last time (network, or a race with another push) must go out on the rerun
    if _git_ahead(site, rt):
        _push_site(site, rt)
        commit = rt.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=site).strip()
    urls = hosted_urls(slug)
    sizes = {'video_url': video_dest.stat().st_size, 'cover_url': cover_dest.stat().st_size}
    for key in ('video_url', 'cover_url'):
        wait_for_url(urls[key], sizes[key], rt)
    return {**urls, 'video_bytes': sizes['video_url'], 'cover_bytes': sizes['cover_url'], 'site_commit': commit,
            'hosted_at': iso_z(rt.now())}


def wait_for_url(url, size, rt, timeout=HOST_WAIT_SECONDS, interval=HOST_POLL_SECONDS):
    """Poll until the deploy serves url with HTTP 200 and exactly size bytes."""
    waited, last = 0.0, None
    while True:
        status, length = rt.http_head(url)
        last = (status, length)
        if status == 200 and length == size:
            return
        if waited >= timeout:
            raise ReelError(f'{url} still answers {last[0]} with Content-Length {last[1]} (expected 200 and {size}) '
                            f'after {timeout // 60:.0f} min; check the Vercel deploy')
        rt.sleep(interval)
        waited += interval


# ---------------------------------------------------------------- run-due

def ig_account(entry):
    """The Instagram account a queued entry posts from (entries queued before 2026-10-24 have @with.hammad)."""
    return ((entry.get('platforms') or {}).get('instagram') or {}).get('account') or LEGACY_IG_ACCOUNT


def _default_collaborators(account=IG_ACCOUNT):
    """The Collab run-due sends (publish_instagram's default for the posting account; run-due never overrides it)."""
    try:
        from . import publish_instagram
        return list(publish_instagram.DEFAULT_COLLABORATORS.get(account, ()))
    except Exception:
        return [a for a in ('hammadagentic.ai', 'with.hammad') if a != account][:1]


def _record_post(entry, platform, jdir, record, now):
    pe = entry['platforms'][platform]
    pe.update(status='published', url=record.get('url'), published_at=pe.get('published_at') or iso_z(now))
    for key in ('media_id', 'post_urn', 'video_id'):
        if record.get(key):
            pe[key] = record[key]
    pe.pop('error', None)
    if platform in IG_PLATFORMS:
        update_published(jdir, platform, {
            'url': record.get('url'), 'account': pe.get('account') or ig_account(entry), 'media_id': record.get('media_id'),
            'via': 'api', 'trial': pe.get('trial'),
            'collaborators_invited': record.get('collaborators'),
            'collab_status': 'invited, not yet accepted' if record.get('collaborators') else None,
            'ai_label': True, 'cover': f'cover_url ({pe.get("cover_url")})' if pe.get('cover_url') else None,
            'posted_at': pe['published_at']})
        pe['followups'] = _followups(entry, platform)
    elif platform == 'linkedin':
        update_published(jdir, 'linkedin', {'url': record.get('url'), 'post_urn': record.get('post_urn'),
                                            'via': 'api', 'thumbnail': 'cover_720x1280.jpg',
                                            'posted_at': pe['published_at']})
    elif platform == 'youtube':
        update_published(jdir, 'youtube', {'privacy': 'public', 'live_confirmed_at': pe['published_at']})
    _refresh_status(entry)


def _followups(entry, platform):
    if platform not in IG_PLATFORMS:
        return []
    pe = entry['platforms'][platform]
    url = pe.get('url') or 'the new reel'
    account = pe.get('account') or ig_account(entry)
    collabs = pe.get('collaborators')
    collabs = _default_collaborators(account) if collabs is None else collabs
    out = []
    if account == IG_TRIAL_ACCOUNT:   # ManyChat runs on @with.hammad
        out.append(f'ManyChat: Quick Automation "Auto-DM links from comments" on {url} with keyword {entry.get("keyword")}, '
                   f'link {entry.get("resource_url")}')
    if collabs:
        out.append(f'Owner: accept the Collab on @{collabs[0]} in the Instagram app')
    return out


def _publish_now(platform, jdir, entry, rt, confirm_not_posted):
    pe = entry['platforms'][platform]
    lesson = load_lesson(jdir)
    seo = _read_json(jdir / 'seo' / 'seo.json', None)
    if seo and seo_differences(lesson, seo):
        raise ReelError(f'lesson.json no longer carries the SEO copy; run apply-seo {jdir.name} first')
    if platform in IG_PLATFORMS:
        if not pe.get('hosted') or not pe.get('video_url'):
            raise ReelError('the Instagram video is not hosted yet; rerun queue for this job')
        if pe.get('caption'):   # a per-post caption (e.g. the guide link where the keyword DM cannot fire)
            lesson = {**lesson, 'captions': {**(lesson.get('captions') or {}), 'instagram': pe['caption']}}
        extra = {} if pe.get('collaborators') is None else {'collaborators': pe['collaborators']}
        result = rt.instagram_publish(jdir / 'final_ig.mp4', lesson, dry_run=False,
                                      state_path=jdir / STATE_FILES[platform],
                                      expected_username=pe.get('account') or ig_account(entry),
                                      trial=pe.get('trial'), **extra,
                                      url_provider=pe['video_url'], cover_url=pe.get('cover_url'),
                                      cover_path=jdir / 'cover_1080x1920.jpg', ai_generated=True)
        record = {'url': result.get('permalink'), 'media_id': result.get('media_id'),
                  'collaborators': result.get('collaborators')}
    else:
        result = rt.linkedin_publish(jdir / 'final.mp4', lesson, dry_run=False,
                                     state_path=jdir / STATE_FILES['linkedin'],
                                     thumbnail_path=jdir / 'cover_720x1280.jpg', confirm_not_posted=confirm_not_posted)
        record = {'url': result.get('post_url'), 'post_urn': result.get('post_urn')}
    if result.get('status') not in ('published', 'already_published'):
        raise ReelError(f'{platform} publisher returned status {result.get("status")!r}')
    return record, [_short(w, 200) for w in result.get('warnings') or []]


def parse_confirm(values):
    """--confirm-not-posted values: 'linkedin' / 'instagram' (every due entry) or 'JOB:platform' (one job)."""
    out = []
    for value in values or ():
        job, _, platform = str(value).rpartition(':')
        if platform not in RUN_DUE_PLATFORMS:
            raise ReelError(f'--confirm-not-posted {value!r}: use linkedin, instagram or JOB:linkedin / JOB:instagram')
        out.append((job or None, platform))
    return tuple(out)


def _confirmed(confirm, job, platform):
    return any(p == platform and (j is None or j == job) for j, p in confirm)


def post_window(platform, date, slot, now, slots=None):
    """('post' | 'wait' | 'missed', detail). Inside late_grace_minutes of the slot: post. Later, when the day has a
    later backup slot (BEST_TIMES.md: used when the primary cannot be), wait for it and post within the same grace;
    after that grace the slot is missed. Without a later backup a late post may still go out up to
    late_limit_hours after the slot."""
    slots = slots or load_slots()
    grace = dt.timedelta(minutes=slots.get('late_grace_minutes', 60))
    limit = dt.timedelta(hours=slots.get('late_limit_hours', 6))
    late = now - slot
    if late <= grace:
        return 'post', None
    try:
        backup = slot_utc(platform, date, backup=True, slots=slots)
    except ReelError:
        backup = None
    if backup and backup > slot:
        if now < backup:
            return 'wait', backup
        if now - backup <= grace:
            return 'post', backup
        return 'missed', f'the slot passed {late} ago and the backup {local_label(backup)} passed too'
    if late <= limit:
        return 'post', None
    return 'missed', f'slot passed {late} ago (limit {limit}); not posted late'


def run_due(now=None, live=False, platforms=None, confirm_not_posted=(), rt=None, schedule_path=None):
    """Post every API platform whose slot has passed. Returns {'results': [...], 'exit_code': n}:
    0 = nothing due or everything due went out, 1 = a failure or an uncertain post, 2 = a slot was missed.
    `now` is for dry runs only: a live run always uses the real clock."""
    rt = rt or Runtime()
    if live and now is not None:
        raise ReelError('--now is for dry runs and status only; a live run-due always uses the real clock')
    now = parse_moment(now) if now else rt.now()
    wanted = tuple(platforms or (*RUN_DUE_PLATFORMS, 'youtube'))
    confirm = parse_confirm(confirm_not_posted)
    slots_cfg = load_slots()
    results = []
    with schedule_lock(schedule_path, wait=RUN_DUE_LOCK_WAIT if live else 0, rt=rt):
        schedule = load_schedule(schedule_path)
        for entry in sorted(schedule['queue'], key=lambda e: e['date']):
            if entry.get('status') in ('planned', 'cancelled', 'done') or not entry.get('platforms'):
                continue
            jdir = job_dir(entry['job'])
            for platform in RUN_DUE_PLATFORMS:
                if platform not in wanted:
                    continue
                pe = entry['platforms'].get(platform) or {}
                # only API entries still to post: a Chrome-scheduled ('composer_scheduled'), published, missed or
                # skipped slot is never posted again through the API
                if pe.get('via', 'api') != 'api' or pe.get('status') not in POSTABLE:
                    continue
                slot = parse_moment(pe['slot_utc'])
                if slot > now:
                    continue
                base = {'job': entry['job'], 'date': entry['date'], 'platform': platform, 'slot_utc': pe['slot_utc']}
                posted = posted_record(jdir, platform)
                if posted:     # the publisher already posted it (e.g. a crash before schedule.json was written)
                    if platform in IG_PLATFORMS and posted.get('collaborators') is None and pe.get('collaborators') is None:
                        posted = {**posted, 'collaborators': _default_collaborators(pe.get('account') or ig_account(entry))}
                    if live:
                        _record_post(entry, platform, jdir, posted, now)
                        save_schedule(schedule, schedule_path)
                    results.append({**base, 'action': 'recorded' if live else 'would_record', 'url': posted.get('url'),
                                    'followups': _followups(entry, platform)})
                    continue
                window, detail = post_window('instagram' if platform == 'instagram_trial' else platform,
                                             str(slot.astimezone(gst()).date()), slot, now, slots_cfg)
                owner_confirmed = _confirmed(confirm, entry['job'], platform)
                if window == 'wait':
                    results.append({**base, 'action': 'waiting_for_backup', 'backup_utc': iso_z(detail),
                                    'message': f'the slot was missed; waiting for the backup {local_label(detail)}'})
                    continue
                if window == 'missed':
                    if attempt_in_progress(jdir, platform) and not owner_confirmed:
                        message = ('an earlier post attempt has no known outcome and the slot is past; check the '
                                   f'profile, then rerun with --confirm-not-posted {entry["job"]}:{platform} (no post '
                                   f'found) or `mark {entry["job"]} {platform} <url>` (post found)')
                        if live:
                            pe.update(status='uncertain', error=message)
                            save_schedule(schedule, schedule_path)
                        results.append({**base, 'action': 'uncertain', 'message': message})
                        continue
                    if live:
                        pe.update(status='missed', missed_at=iso_z(now), error=detail +
                                  ('; the owner confirmed the uncertain attempt did not post' if owner_confirmed
                                   and attempt_in_progress(jdir, platform) else ''))
                        _refresh_status(entry)
                        save_schedule(schedule, schedule_path)
                    results.append({**base, 'action': 'missed' if live else 'would_mark_missed', 'message': detail})
                    continue
                notes = []
                yt_status = (entry['platforms'].get('youtube') or {}).get('status')
                if yt_status in ('failed', 'pending'):
                    notes.append(f'YouTube for this reel is {yt_status}; requeue it (backup slot or a later day) or '
                                 'tell the owner')
                if not live:
                    results.append({**base, 'action': 'would_post', 'late_by': str(now - slot),
                                    **({'backup_slot': iso_z(detail)} if detail else {}),
                                    **({'warnings': notes} if notes else {})})
                    continue
                pe.update(status='posting', attempt_at=iso_z(now))
                save_schedule(schedule, schedule_path)
                try:
                    record, warnings = _publish_now(platform, jdir, entry, rt, owner_confirmed)
                except Exception as error:
                    uncertain = type(error).__name__ == 'UncertainPostError' or attempt_in_progress(jdir, platform)
                    pe.update(status='uncertain' if uncertain else 'failed', error=_short(error))
                    save_schedule(schedule, schedule_path)
                    results.append({**base, 'action': pe['status'], 'message': pe['error']})
                    continue
                _record_post(entry, platform, jdir, record, now)
                warnings = warnings + notes
                if detail:
                    pe['posted_at_backup'] = iso_z(detail)
                if warnings:
                    pe['warnings'] = warnings
                save_schedule(schedule, schedule_path)
                results.append({**base, 'action': 'posted', 'url': record.get('url'), 'warnings': warnings,
                                'followups': _followups(entry, platform)})
            yt = entry['platforms'].get('youtube') or {}
            if 'youtube' in wanted and yt.get('status') == 'scheduled' and parse_moment(yt['slot_utc']) <= now:
                results.append(_confirm_youtube(entry, jdir, yt, now, live, rt, schedule, schedule_path))
    actions = {r['action'] for r in results}
    code = 1 if actions & {'failed', 'uncertain', 'check_failed', 'not_public_late'} else \
        2 if 'missed' in actions else 0
    return {'now': iso_z(now), 'dry_run': not live, 'results': results, 'exit_code': code}


def _confirm_youtube(entry, jdir, yt, now, live, rt, schedule, schedule_path):
    """After publishAt: one read-only status call. Public = recorded; rejected/failed = failed (exit 1); still
    private past YOUTUBE_CONFIRM_GRACE = not_public_late (exit 1, stays 'scheduled' in case it is only slow)."""
    base = {'job': entry['job'], 'date': entry['date'], 'platform': 'youtube', 'slot_utc': yt['slot_utc']}
    if not live:
        return {**base, 'action': 'would_confirm_public'}
    try:
        info = rt.youtube_status(yt['video_id'])
    except Exception as error:
        return {**base, 'action': 'check_failed', 'message': _short(error)}
    upload_status = info.get('upload_status')
    if info.get('found') is False or upload_status in ('failed', 'rejected', 'deleted'):
        reason = (info.get('rejection_reason') or info.get('failure_reason') or
                  info.get('processing_failure_reason') or ('video not found' if info.get('found') is False
                                                            else upload_status))
        yt.update(status='failed', error=f'YouTube reports upload {upload_status or "missing"}: {reason}; check Studio')
        save_schedule(schedule, schedule_path)
        return {**base, 'action': 'failed', 'message': yt['error']}
    if info.get('privacy_status') == 'public':
        _record_post(entry, 'youtube', jdir, {'url': yt.get('url'), 'video_id': yt.get('video_id')}, now)
        save_schedule(schedule, schedule_path)
        return {**base, 'action': 'confirmed_public', 'url': yt.get('url')}
    late = now - parse_moment(yt['slot_utc'])
    detail = {'privacy': info.get('privacy_status'), 'upload_status': upload_status,
              'publish_at': info.get('publish_at')}
    if late > YOUTUBE_CONFIRM_GRACE:
        return {**base, 'action': 'not_public_late', **detail,
                'message': f'still {info.get("privacy_status")} {late} after publishAt (upload {upload_status}, '
                           f'publishAt {info.get("publish_at")}); check the Short in YouTube Studio'}
    return {**base, 'action': 'not_public_yet', **detail}


# ---------------------------------------------------------------- mark

def mark(job, platform, url, scheduled=False, rt=None, schedule_path=None):
    """Record a post made (or scheduled) in the owner's Chrome: schedule.json + published.json."""
    rt = rt or Runtime()
    if platform not in PLATFORMS:
        raise ReelError(f'platform must be one of {", ".join(PLATFORMS)}')
    parts = urlsplit(str(url))
    host = (parts.hostname or '').lower()
    if parts.scheme != 'https' or not any(host == h or host.endswith('.' + h) for h in URL_HOSTS[platform]):
        raise ReelError(f'{url!r} is not an https {platform} URL ({", ".join(URL_HOSTS[platform])})')
    jdir = job_dir(job)
    now = rt.now()
    with schedule_lock(schedule_path):
        schedule = load_schedule(schedule_path)
        entry = job_entry(schedule, jdir.name)
        if not entry:
            raise ReelError(f'{jdir.name} is not in the queue; queue it first')
        pe = entry.setdefault('platforms', {}).setdefault(platform, {'via': 'composer'})
        if pe.get('status') == 'published' and pe.get('url') and pe['url'] != url:
            raise ReelError(f'{platform} is already recorded as {pe["url"]}; edit schedule.json by hand to change it')
        api_post = posted_record(jdir, platform)
        if scheduled and api_post:
            raise ReelError(f'{STATE_FILES[platform]} says the API already posted {platform} '
                            f'({api_post.get("url") or api_post}); it cannot also be scheduled in Chrome')
        if scheduled and platform in STATE_FILES and pe.get('via') == 'api':
            # the owner took this slot over in Chrome: run-due must leave it alone (it posts only via == 'api')
            pe['via'] = 'composer'
            pe['taken_over_from_api'] = True
        pe.update(url=url, status='composer_scheduled' if scheduled else 'published', marked_at=iso_z(now))
        pe.pop('error', None)
        if not scheduled:
            pe['published_at'] = iso_z(now)
        _refresh_status(entry)
        save_schedule(schedule, schedule_path)
    record = {'url': url, 'via': 'chrome' if platform in COMPOSER_PLATFORMS else 'manual',
              'ai_label': True if platform in ('tiktok', 'facebook') else None,
              'cover': 'custom upload' if platform in ('tiktok', 'facebook') else None}
    if scheduled:
        record['status'] = f'scheduled in the composer for {pe.get("local_time")}'
    else:
        record['posted_at'] = str(now.astimezone(gst()).date())
    if platform == 'x':
        record['account'] = 'HammadYousufAI'
    update_published(jdir, platform, record)
    return {'job': jdir.name, 'platform': platform, 'status': pe['status'], 'url': url}


# ---------------------------------------------------------------- status and SCHEDULE.md

SHORT = {'pending': 'pending', 'scheduled': 'sched', 'published': 'posted', 'missed': 'MISSED', 'failed': 'FAILED',
         'uncertain': 'CHECK', 'posting': 'posting', 'composer': 'chrome', 'composer_scheduled': 'chrome-sched',
         'skipped': 'skip'}


def status_rows(schedule, now):
    rows = []
    for entry in schedule.get('history', []):
        rows.append({'date': entry['date'], 'day': DAY_NAMES[_date(entry['date']).weekday()],
                     'keyword': entry.get('keyword'), 'job': ' / '.join(entry.get('jobs') or [entry.get('job', '')]),
                     'status': entry.get('status'), 'platforms': {}})
    for entry in sorted(schedule.get('queue', []), key=lambda e: e['date']):
        rows.append({'date': entry['date'], 'day': DAY_NAMES[_date(entry['date']).weekday()],
                     'keyword': entry.get('keyword'), 'job': entry.get('job'),
                     'status': _entry_status(entry) or entry.get('status'),
                     'platforms': {p: (entry.get('platforms') or {}).get(p, {}).get('status') for p in PLATFORMS}})
    return rows


def next_due(schedule, now):
    """The earliest slot still to happen that something must act on."""
    best = None
    for entry in schedule.get('queue', []):
        for platform, pe in (entry.get('platforms') or {}).items():
            if pe.get('status') in FINAL_STATUSES or pe.get('status') == 'composer_scheduled':
                continue
            if pe.get('status') == 'scheduled':   # YouTube publishes itself
                continue
            slot = parse_moment(pe['slot_utc'])
            if slot > now and (best is None or slot < best[0]):
                best = (slot, entry['job'], entry.get('keyword'), platform, pe.get('status'))
    return best


def overdue(schedule, now):
    out = []
    for entry in schedule.get('queue', []):
        if entry.get('status') in ('cancelled', 'planned'):
            continue
        for platform, pe in (entry.get('platforms') or {}).items():
            if pe.get('status') in FINAL_STATUSES or pe.get('status') == 'composer_scheduled':
                continue
            if pe.get('status') == 'scheduled':     # a Short YouTube should have made public by now
                if parse_moment(pe['slot_utc']) + YOUTUBE_CONFIRM_GRACE <= now:
                    out.append((entry['job'], entry.get('keyword'), platform,
                                'scheduled, not confirmed public (run-due --live checks it)', pe['slot_utc']))
                continue
            if parse_moment(pe['slot_utc']) <= now:
                out.append((entry['job'], entry.get('keyword'), platform, pe.get('status'), pe['slot_utc']))
    return out


def format_status(schedule, now):
    rows = status_rows(schedule, now)
    head = ['Date', 'Day', 'Keyword', 'Job', 'Status', 'YT', 'LI', 'IG', 'TT', 'FB', 'X']
    table = [head]
    for row in rows:
        cells = [row['date'], row['day'], str(row['keyword'] or '-'), str(row['job']), str(row['status'] or '-')]
        cells += [SHORT.get(row['platforms'].get(p), row['platforms'].get(p) or '-') for p in PLATFORMS]
        table.append(cells)
    widths = [max(len(r[i]) for r in table) for i in range(len(head))]
    lines = ['  '.join(cell.ljust(widths[i]) for i, cell in enumerate(r)).rstrip() for r in table]
    lines.insert(1, '  '.join('-' * w for w in widths))
    nd = next_due(schedule, now)
    lines.append('')
    lines.append(f'Now: {local_label(now)} ({iso_z(now)})')
    if nd:
        slot, job, keyword, platform, status = nd
        how = 'run-due --live' if platform in RUN_DUE_PLATFORMS else 'owner in Chrome' \
            if platform in COMPOSER_PLATFORMS else 'queue'
        lines.append(f'Next due: {platform} for {keyword or job} at {local_label(slot)} ({iso_z(slot)}), {status}, '
                     f'{how}')
    else:
        lines.append('Next due: nothing queued')
    for job, keyword, platform, status, slot in overdue(schedule, now):
        lines.append(f'Overdue: {platform} for {keyword or job} (slot {slot}, status {status})')
    return '\n'.join(lines)


def render_md(schedule=None, slots=None):
    schedule = schedule or load_schedule()
    slots = slots or load_slots()
    out = ['# Publishing schedule', '',
           '<!-- Rendered from outputs/video-pipeline/schedule.json by `python -m app.publish_reel render-md` '
           '(from studio/). Edit the JSON, not this file. -->', '',
           'Owner rule 2026-10-18: one reel per day, scheduled at the best time per platform (docs/BEST_TIMES.md, '
           'measured from our own audience data). Never two reels on one day. A reel enters the queue only after '
           'its verification passes (`publish_reel check`: videos, covers, SEO copy applied, ManyChat keyword, '
           'resource page live, nothing posted yet).', '']
    if schedule.get('order_note'):
        out += [schedule['order_note'], '']
    out += ['| Date (GST) | Day | Reel | Job | Keyword | Status |', '|---|---|---|---|---|---|']
    for entry in schedule.get('history', []):
        out.append(f'| {entry["date"]} | {DAY_NAMES[_date(entry["date"]).weekday()]} | {entry.get("title", "")} | '
                   f'{" / ".join(entry.get("jobs") or [entry.get("job", "")])} | {entry.get("keyword") or ""} | '
                   f'{entry.get("status", "")} |')
    for entry in sorted(schedule.get('queue', []), key=lambda e: e['date']):
        status = _entry_status(entry) or ''
        if entry.get('note') and status == 'planned':
            status = f'planned ({entry["note"]})'
        out.append(f'| {entry["date"]} | {DAY_NAMES[_date(entry["date"]).weekday()]} | {entry.get("title") or ""} | '
                   f'{entry.get("job")} | {entry.get("keyword") or "(from its spec)"} | {status} |')
    queued = [e for e in sorted(schedule.get('queue', []), key=lambda e: e['date']) if e.get('platforms')]
    if queued:
        out += ['', 'Per-platform state of queued reels (GST; UTC for the APIs in schedule.json):', '',
                '| Date | Reel | ' + ' | '.join(slots['platforms'][p]['label'] for p in PLATFORMS) + ' |',
                '|---|---|' + '---|' * len(PLATFORMS)]
        for entry in queued:
            cells = []
            for platform in PLATFORMS:
                pe = entry['platforms'].get(platform) or {}
                local_slot = parse_moment(pe['slot_utc']).astimezone(gst()) if pe.get('slot_utc') else None
                hhmm = local_slot.strftime('%H:%M') if local_slot else ''
                if local_slot and str(local_slot.date()) != entry['date']:
                    hhmm = local_slot.strftime('%Y-%m-%d %H:%M')
                state = pe.get('status') or ''
                cells.append(f'{hhmm} {state}' + (f' ([link]({pe["url"]}))' if pe.get('url') else ''))
            out.append(f'| {entry["date"]} | {entry.get("keyword") or entry["job"]} | ' + ' | '.join(cells) + ' |')
    out += ['', 'Per-platform posting times (docs/BEST_TIMES.md, decided 2026-10-18 from our own audience data; '
                'review 3 Nov 2026):', '',
            '| Platform | Mon-Fri (GST) | Sat-Sun (GST) | Backup |', '|---|---|---|---|']
    for platform in slots['order']:
        times, backup = slots['platforms'][platform]['times'], slots['platforms'][platform]['backup']
        weekday = times.get('weekday', times.get('default'))
        weekday += f' (Fri {times["fri"]})' if 'fri' in times else ''
        weekend = times.get('weekend', times.get('default'))
        b = backup.get('weekday', backup.get('default'))
        b += f' (Fri {backup["fri"]})' if 'fri' in backup else ''
        b += ' weekdays' if 'weekday' in backup and 'default' not in backup else ''
        out.append(f'| {slots["platforms"][platform]["label"]} | {weekday} | {weekend} | {b} |')
    out += ['', 'How each platform goes out:', '']
    for platform in slots['order']:
        out.append(f'- {slots["platforms"][platform]["label"]}: {slots["platforms"][platform]["how"]}')
    out += ['', 'Commands (from studio/): `check <job>`, `apply-seo <job>`, `queue <job> --date YYYY-MM-DD [--live]`, '
                '`run-due [--live]`, `mark <job> <platform> <url>`, `status`, `render-md` '
                '(`.venv/bin/python -m app.publish_reel ...`). Nothing runs on a timer until the owner enables one.', '']
    return '\n'.join(out)


# ---------------------------------------------------------------- CLI

def _print(data):
    print(json.dumps(data, indent=2, ensure_ascii=False, default=str))


def main(argv=None, rt=None):
    parser = argparse.ArgumentParser(prog='python -m app.publish_reel', description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('slots', help='the six slots of a GST date')
    p.add_argument('--date', default=None)
    p = sub.add_parser('check', help='readiness gate; exit 1 when anything blocks')
    p.add_argument('job')
    p = sub.add_parser('apply-seo', help='merge seo/seo.json into lesson.json (keeps lesson.pre_seo.json once)')
    p.add_argument('job')
    p.add_argument('--dry-run', action='store_true')
    p = sub.add_parser('queue', help='put a verified reel on a date (dry run unless --live)')
    p.add_argument('job')
    p.add_argument('--date', required=True)
    p.add_argument('--live', action='store_true', help='upload to YouTube (scheduled), host the IG media, record')
    p = sub.add_parser('run-due', help='post LinkedIn/Instagram whose slot has passed (dry run unless --live)')
    p.add_argument('--now', default=None, help='dry runs only: ISO time (Z or offset; no offset = GST)')
    p.add_argument('--live', action='store_true', help='post for real, always on the real clock (not with --now)')
    p.add_argument('--platform', action='append', choices=(*RUN_DUE_PLATFORMS, 'youtube'))
    p.add_argument('--confirm-not-posted', action='append', default=[], metavar='[JOB:]PLATFORM',
                   help='linkedin or instagram, optionally for one job (JOB:linkedin); only after the owner checked '
                        'the profile and saw no post from the uncertain attempt. Inside the slot window it allows '
                        'the post; past it the slot is marked missed')
    p = sub.add_parser('mark', help='record a Chrome-scheduled or manual post')
    p.add_argument('job')
    p.add_argument('platform', choices=PLATFORMS)
    p.add_argument('url')
    p.add_argument('--scheduled', action='store_true', help='scheduled in the composer, not live yet')
    p = sub.add_parser('status', help='queue table and the next due slot')
    p.add_argument('--now', default=None)
    sub.add_parser('render-md', help='write docs/SCHEDULE.md from schedule.json')
    args = parser.parse_args(argv)
    rt = rt or Runtime()
    try:
        if args.command == 'slots':
            day = _date(args.date) if args.date else rt.now().astimezone(gst()).date()
            _print({'date': str(day), 'slots': day_slots(day)})
            return 0
        if args.command == 'check':
            report = check_report(args.job, rt)
            _print(report)
            return 1 if report['blockers'] else 0
        if args.command == 'apply-seo':
            _print(apply_seo(args.job, write=not args.dry_run))
            return 0
        if args.command == 'queue':
            result = queue(args.job, args.date, live=args.live, rt=rt)
            _print(result)
            if args.live:
                SCHEDULE_MD.write_text(render_md())
            return 0 if result['status'] in ('planned', 'queued') else 1
        if args.command == 'run-due':
            result = run_due(args.now, live=args.live, platforms=args.platform,
                             confirm_not_posted=tuple(args.confirm_not_posted), rt=rt)
            _print(result)
            if args.live and result['results']:
                SCHEDULE_MD.write_text(render_md())
            return result['exit_code']
        if args.command == 'mark':
            _print(mark(args.job, args.platform, args.url, scheduled=args.scheduled, rt=rt))
            SCHEDULE_MD.write_text(render_md())
            return 0
        if args.command == 'status':
            now = parse_moment(args.now) if args.now else rt.now()
            print(format_status(load_schedule(), now))
            return 0
        if args.command == 'render-md':
            SCHEDULE_MD.write_text(render_md())
            print(f'wrote {SCHEDULE_MD}')
            return 0
    except LockBusy as error:
        print(f'publish_reel: {error}', file=sys.stderr)
        return LOCK_BUSY_EXIT
    except ReelError as error:
        print(f'publish_reel: {error}', file=sys.stderr)
        return 1
    return 2


if __name__ == '__main__':
    raise SystemExit(main())
