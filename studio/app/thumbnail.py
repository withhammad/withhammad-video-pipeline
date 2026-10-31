"""Daily routine step 4: a cover/thumbnail for every reel, built from the avatar take and the lesson's cover copy.

  python -m app.thumbnail build <job_dir> [--take FILE] [--pick 1|2|3]

1. pick_frames(): samples the take at 5 fps (numpy + ffmpeg only) and scores each frame on face sharpness (variance
   of a 3x3 Laplacian), low motion, a smile proxy (share of bright teeth pixels in the mouth box) and a pause bonus
   (the frame falls between two words in captions.json, so the mouth is at rest). Blinks and the first/last 0.5 s are
   excluded: an open eye shows dark iris pixels with bright sclera on both sides, which brows and the lash line of a
   closed eye do not, so a frame whose iris count falls below 35 % of the median of the surrounding +-1 s is a blink
   (searched in a box larger than the eyes, so head movement does not read as a blink). The best frame is pick 1;
   picks 2 and 3 are the next best at least 1.5 s apart that are also at rest: a pause between words that scores
   above the take's average, or a held smile (teeth in the take's top 10 %). A talking face shows teeth too, but less
   (on the REA take a mid-word frame sat at the 65th-80th percentile, the smiles at the 95th-99th), so a mid-word
   face is not offered as an equal choice. A take with no such frame gets fewer picks.
2. Each pick is extracted at 2x (1440x2560, lanczos + light unsharp) to studio/remotion/public/job/cover_face_<n>.png;
   the head is centred and placed under the text from the hair line found against the light wall.
3. One `remotion bundle`, then `remotion still` renders the chosen pick's Cover Still (studio/remotion/src/Cover.tsx)
   and the CoverSheet Still: every pick at full size plus its 3:4, 4:5 and 1:1 grid crops, for the approval message
   (thumbs/cover_sheet.png). About 10 s in all; each still costs ~3 s, so the other picks render only on the sheet.
4. The chosen pick (default 1; the owner can answer "cover 2" -> --pick 2) is exported into the job folder as
   cover_1080x1920.jpg (YouTube, Instagram, TikTok, Facebook) and cover_720x1280.jpg (LinkedIn: the video's own size),
   baseline JPEG, sRGB (JFIF without a profile), at most 2 MB each. cover.json records the pick times, scores and paths.

The copy comes from lesson.json "cover" ({kicker, hook, pill_strong, pill_serif}, see app/lesson.py SCHEMA). The
kicker must be factually accurate: only claims the lesson verified in sources_checked. plan.json "cover_dark": true
picks the dark variant for reels that open dark.

Stills reels (app.edit_deskreel: no video take): `--still <png>` (up to 3, in pick order), or deskreel.json
"cover_still" (a path or a list, job-relative) when the job has no take, makes each still a pick: no frame scoring,
each still is cover-cropped to 1440x2560 like a take frame and its head placed by the same hair-line rule. The copy
then comes from lesson.json "cover", or from deskreel.json "cover" when the lesson has none. The take path is
unchanged.
"""
import argparse
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import numpy as np

from .lesson import SCHEMA

STUDIO = Path(__file__).resolve().parents[1]
REMOTION = STUDIO / 'remotion'

FPS = 5
ANALYSIS_W, ANALYSIS_H = 360, 640
PICKS = 3
MIN_GAP_S = 1.5
EDGE_S = 0.5
PAUSE_PAD_S = 0.06
TEETH_LEVEL, HAIR_DARK_LEVEL = 175, 70
# Blinks: a pixel counts as open iris when it is darker than IRIS_DARK and the pixels IRIS_GAP (share of the frame
# width, 6 px at 360) to its left AND right are brighter than SCLERA_BRIGHT. Measured on three daylight takes
# (2026-10-18): every real blink (5 events) fell below 35 % of the local median, open eyes never did.
IRIS_DARK, SCLERA_BRIGHT, IRIS_GAP = 70, 110, 1 / 60
EYE_SEARCH_PAD = (0.042, 0.025, 0.042, 0.016)   # the eye box grown by (left, top, right, bottom) shares of the frame
BLINK_RATIO, BLINK_WINDOW_S = 0.35, 1.0
# Subprocess limits: a stuck ffmpeg or headless Chrome must not hang the reel build after the render.
FFMPEG_TIMEOUT_S, REMOTION_TIMEOUT_S = 120, 240
# Boxes as fractions of the frame (x0, y0, x1, y1). HeyGen framing is fixed per look; these fit the current
# daylight look. A plan.json "cover_boxes" {"face": [...], "mouth": [...], "eyes": [...]} overrides them.
BOXES = {'face': (0.278, 0.234, 0.750, 0.5625), 'mouth': (0.431, 0.4375, 0.597, 0.500),
         'eyes': (0.403, 0.332, 0.625, 0.375)}
WEIGHTS = {'motion': 0.7, 'teeth': 0.6, 'pause': 0.8}
SMILE_PERCENTILE = 90       # picks 2 and 3: a pause that scores >= 0, or teeth at least this percentile of the take

# Must match studio/remotion/src/Cover.tsx.
COVER_W, COVER_H = 1080, 1920
FACE_W, FACE_H = 1440, 2560
SAFE_TOP, SAFE_BOTTOM, SIDE_MARGIN = 420, 1500, 70
BASE_SCALE = 0.75           # the 1440x2560 face drawn exactly 1080 px wide
HAIR_Y = 790                # hair line just under the blue pill (pill bottom ~788)
DEFAULT_FACE_TOP = 467
MAX_SHIFT = 24
EXPORTS = {'cover_1080x1920': (1080, 1920), 'cover_720x1280': (720, 1280)}
MAX_JPEG_BYTES = 2 * 1024 * 1024
COVER_LIMITS = {key: spec['maxLength'] for key, spec in SCHEMA['properties']['cover']['properties'].items()}


class CoverError(RuntimeError):
    """The cover could not be built; the message says what to fix."""


# ---------------------------------------------------------------- frame picker

def _run(cmd, timeout=FFMPEG_TIMEOUT_S, **kw):
    try:
        return subprocess.run(cmd, check=True, capture_output=True, timeout=timeout, **kw)
    except FileNotFoundError:
        raise CoverError(f'{cmd[0]} is not installed') from None
    except subprocess.TimeoutExpired:
        what = ' '.join([Path(cmd[0]).name, *cmd[1:2]])
        raise CoverError(f'{what} did not finish in {timeout} s') from None
    except subprocess.CalledProcessError as error:
        tail = error.stderr or error.stdout or b''   # Remotion prints some errors on stdout
        tail = tail.decode(errors='replace') if isinstance(tail, bytes) else tail
        what = ' '.join(Path(part).name if i == 0 else part for i, part in enumerate(cmd[:3]))
        raise CoverError(f'{what} failed (exit {error.returncode}): '
                         f'{" | ".join(tail.strip().splitlines()[-3:]) or "no output"}') from None


_PTS_TIME = re.compile(r'Parsed_showinfo.*?pts_time:\s*([-\d.]+)')


def sample_frames(take, fps=FPS):
    """Grayscale frames of the take about every 1/fps s, scaled to 360x640 (float32, n x H x W), and the source
    timestamp of each. `select` keeps real frames (an fps filter would retime them by up to a frame or two), so
    the frame scored is exactly the frame extracted later with -ss."""
    step = 1 / fps - 0.001
    process = _run(['ffmpeg', '-hide_banner', '-v', 'info', '-i', str(take), '-vf',
                    f"select='isnan(prev_selected_t)+gte(t-prev_selected_t,{step:.3f})',"
                    f'scale={ANALYSIS_W}:{ANALYSIS_H}:flags=area,showinfo',
                    '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'])
    frames = np.frombuffer(process.stdout, np.uint8)
    if not frames.size or frames.size % (ANALYSIS_W * ANALYSIS_H):
        raise CoverError(f'could not decode frames from {take}')
    frames = frames.reshape(-1, ANALYSIS_H, ANALYSIS_W).astype(np.float32)
    times = [round(float(t), 3) for t in _PTS_TIME.findall(process.stderr.decode(errors='replace'))]
    if len(times) != len(frames):   # no showinfo output: fall back to the nominal sample times
        times = [round(i / fps, 3) for i in range(len(frames))]
    return frames, times


def _box(frame, box):
    x0, y0, x1, y1 = box
    h, w = frame.shape
    return frame[round(y0 * h):round(y1 * h), round(x0 * w):round(x1 * w)]


def eyes_open(frame, box):
    """Open-iris pixels in a box around the eyes: dark, with bright sclera (or skin) IRIS_GAP to the left AND the
    right. Brows and the lash line of a closed eye are horizontal dark bands, so they never count."""
    h, w = frame.shape
    k = max(2, round(IRIS_GAP * w))
    x0 = max(k, round((box[0] - EYE_SEARCH_PAD[0]) * w))
    x1 = min(w - k, round((box[2] + EYE_SEARCH_PAD[2]) * w))
    y0 = max(0, round((box[1] - EYE_SEARCH_PAD[1]) * h))
    y1 = min(h, round((box[3] + EYE_SEARCH_PAD[3]) * h))
    centre = frame[y0:y1, x0:x1]
    left, right = frame[y0:y1, x0 - k:x1 - k], frame[y0:y1, x0 + k:x1 + k]
    return int(((centre < IRIS_DARK) & (left > SCLERA_BRIGHT) & (right > SCLERA_BRIGHT)).sum())


def _laplacian_var(gray):
    return float((gray[:-2, 1:-1] + gray[2:, 1:-1] + gray[1:-1, :-2] + gray[1:-1, 2:] - 4 * gray[1:-1, 1:-1]).var())


def _pauses(words):
    """(start_s, end_s) gaps between spoken words, padded so the mouth has settled."""
    spans = []
    timed = [w for w in words or [] if 'startMs' in w and 'endMs' in w]
    for a, b in zip(timed, timed[1:]):
        start, end = a['endMs'] / 1000 + PAUSE_PAD_S, b['startMs'] / 1000 - PAUSE_PAD_S
        if end > start:
            spans.append((start, end))
    if timed:
        spans.append((timed[-1]['endMs'] / 1000 + PAUSE_PAD_S, float('inf')))
    return spans


def _z(values):
    std = values.std()
    return (values - values.mean()) / (std if std > 1e-9 else 1.0)


def pick_frames(take, captions=None, *, count=PICKS, fps=FPS, min_gap=MIN_GAP_S, edge=EDGE_S, boxes=None,
                sampled=None):
    """Score every sampled frame and return up to `count` picks at least `min_gap` seconds apart.

    Blinks and the first/last `edge` seconds are never picked, and picks after the first must be at rest (see the
    module docstring). Returns {'fps', 'frames', 'duration_s', 'picks': [...], 'rows': [...]}; each row has t,
    score, sharpness, motion, teeth, eyes_open, pause, blink, edge (and at_rest once scored)."""
    boxes = {**BOXES, **(boxes or {})}
    frames, times = sample_frames(take, fps) if sampled is None else sampled
    duration = (times[-1] + 1 / fps) if times else 0.0
    pauses = _pauses(captions)
    rows = []
    for i, frame in enumerate(frames):
        t = times[i]
        face = _box(frame, boxes['face'])
        prev = _box(frames[i - 1], boxes['face']) if i else face
        rows.append({'t': t, 'sharpness': _laplacian_var(face), 'motion': float(np.abs(face - prev).mean()),
                     'teeth': float((_box(frame, boxes['mouth']) > TEETH_LEVEL).mean()),
                     'eyes_open': eyes_open(frame, boxes['eyes']),
                     'pause': any(a <= t <= b for a, b in pauses),
                     'edge': t < edge or t > duration - edge})
    t_all = np.array([r['t'] for r in rows], dtype=float)
    opens = np.array([r['eyes_open'] for r in rows], dtype=float)
    for row in rows:   # compared with the surrounding second, so a slow change in pose or light is not a blink
        local = float(np.median(opens[np.abs(t_all - row['t']) <= BLINK_WINDOW_S]))
        row['blink'] = bool(local > 0 and row['eyes_open'] < BLINK_RATIO * local)
    eligible = [r for r in rows if not r['edge'] and not r['blink']]
    if not eligible:
        raise CoverError(f'no usable frame in {take}: the take is shorter than {2 * edge:g} s or every frame is a blink')
    metrics = {key: _z(np.array([r[key] for r in eligible], dtype=float)) for key in ('sharpness', 'motion', 'teeth')}
    teeth = [r['teeth'] for r in eligible]
    teeth_median, smile_level = float(np.median(teeth)), float(np.percentile(teeth, SMILE_PERCENTILE))
    for i, row in enumerate(eligible):
        row['score'] = round(float(metrics['sharpness'][i] - WEIGHTS['motion'] * metrics['motion'][i]
                                   + WEIGHTS['teeth'] * metrics['teeth'][i] + (WEIGHTS['pause'] if row['pause'] else 0)), 3)
        # the face at rest: a good pause between words, or a held smile. Picks 2 and 3 must be; pick 1 is the best frame
        row['at_rest'] = bool((row['pause'] and row['score'] >= 0)
                              or (row['teeth'] >= smile_level and row['teeth'] > teeth_median))
    picks = []
    for row in sorted(eligible, key=lambda r: (-r['score'], r['t'])):
        if picks and not row['at_rest']:
            continue
        if all(abs(row['t'] - p['t']) >= min_gap for p in picks):
            picks.append(row)
        if len(picks) == count:
            break
    clean = [{k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()} for r in rows]
    by_time = {row['t']: row for row in clean}
    return {'fps': fps, 'frames': len(rows), 'duration_s': round(duration, 3),
            'picks': [dict(by_time[p['t']]) for p in picks], 'rows': clean}


# ---------------------------------------------------------------- face placement

def head_geometry(frame):
    """(hair_top, centre_x) as fractions of the frame, from dark hair against the light wall; None when not found."""
    h, w = frame.shape
    x0, x1 = round(0.3 * w), round(0.7 * w)
    dark_rows = (frame[:, x0:x1] < HAIR_DARK_LEVEL).mean(axis=1)
    hair = None
    for y in range(round(0.08 * h), round(0.5 * h) - 3):
        if (dark_rows[y:y + 3] > 0.3).all():
            hair = y
            break
    if hair is None or hair < 0.1 * h or hair > 0.45 * h:
        return None, None
    band = frame[hair:hair + round(0.06 * h), round(0.15 * w):round(0.85 * w)] < HAIR_DARK_LEVEL
    ys, xs = np.nonzero(band)
    centre = (xs.mean() + round(0.15 * w)) / w if xs.size else None
    return hair / h, centre


def face_layout(hair_frac, centre_frac):
    """faceTop / faceScale / faceShiftX props: hair line just under the pill, head centred within +-24 px.

    The face is enlarged just enough that a shift never reveals the background at the sides."""
    shift = 0
    if centre_frac is not None:
        shift = int(max(-MAX_SHIFT, min(MAX_SHIFT, round((0.5 - centre_frac) * FACE_W * BASE_SCALE))))
    scale = math.ceil(BASE_SCALE * (COVER_W + 2 * abs(shift)) / COVER_W * 10000) / 10000   # never a sliver short
    top = DEFAULT_FACE_TOP if hair_frac is None else round(HAIR_Y - hair_frac * FACE_H * scale)
    return {'faceTop': int(max(300, min(700, top))), 'faceScale': scale, 'faceShiftX': shift}


def extract_face(take, t, out_png):
    """The frame scored at time t (an exact source timestamp, rounded to 1 ms) as a 1440x2560 PNG. Seeking half a
    millisecond early keeps a timestamp that was rounded up from skipping to the next frame."""
    out_png.parent.mkdir(parents=True, exist_ok=True)
    _run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0.0, t - 0.0005):.4f}', '-i', str(take), '-frames:v', '1', '-vf',
          f'scale={FACE_W}:{FACE_H}:force_original_aspect_ratio=increase:flags=lanczos,crop={FACE_W}:{FACE_H},'
          'unsharp=5:5:0.6:5:5:0', str(out_png)])
    return out_png


# ---------------------------------------------------------------- copy

def cover_copy(lesson, dark=False):
    """The lesson's cover object, checked against the schema's limits, as Cover props. `dark` picks the dark
    variant (plan.json "cover_dark": true, for reels that open dark)."""
    cover = (lesson or {}).get('cover')
    if not isinstance(cover, dict):
        raise CoverError('lesson.json has no "cover" object. Add {"kicker", "hook", "pill_strong", "pill_serif"} '
                         '(limits 36/18/8/12 characters, see studio/app/lesson.py SCHEMA); the kicker must only '
                         'state facts the lesson verified in sources_checked.')
    problems = []
    for key, limit in COVER_LIMITS.items():
        value = cover.get(key)
        if not isinstance(value, str) or not value.strip():
            problems.append(f'{key} is missing')
        elif len(value) > limit:
            problems.append(f'{key} is {len(value)} characters (max {limit})')
    if problems:
        raise CoverError('lesson.json cover: ' + '; '.join(problems))
    return {'kicker': cover['kicker'].strip(), 'hook': cover['hook'].strip(), 'pillStrong': cover['pill_strong'].strip(),
            'pillSerif': cover['pill_serif'].strip(), 'dark': bool(dark)}


# ---------------------------------------------------------------- render and export

def browser_executable(remotion=REMOTION):
    """The chrome-headless-shell the reel render already downloaded, so a still never triggers a new download."""
    for path in sorted((remotion / 'node_modules' / '.remotion' / 'chrome-headless-shell').glob('*/*/chrome-headless-shell')):
        if path.is_file():
            return path
    return None


def _npx():
    npx = shutil.which('npx')
    if not npx:
        raise CoverError('npx not found: install Node.js (the Remotion project in studio/remotion renders the cover)')
    return npx


def render_stills(jobs, remotion=REMOTION):
    """jobs: [(composition_id, props_json_path, out_png)]. One bundle, then one `remotion still` per job."""
    npx = _npx()
    browser = browser_executable(remotion)
    extra = [f'--browser-executable={browser}'] if browser else []
    with tempfile.TemporaryDirectory(prefix='cover-bundle-') as tmp:
        bundle = Path(tmp) / 'bundle'
        _run([npx, 'remotion', 'bundle', 'src/index.ts', f'--out-dir={bundle}', '--log=error'], cwd=remotion, text=True,
             timeout=REMOTION_TIMEOUT_S)
        for composition, props, out in jobs:
            out.parent.mkdir(parents=True, exist_ok=True)
            _run([npx, 'remotion', 'still', str(bundle), composition, str(out), f'--props={props}',
                  '--image-format=png', '--overwrite', '--log=error', *extra], cwd=remotion, text=True,
                 timeout=REMOTION_TIMEOUT_S)
            if not out.is_file():
                raise CoverError(f'remotion still {composition} wrote no file at {out}')


def probe_image(path):
    out = _run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name',
                '-of', 'json', str(path)], text=True).stdout
    stream = (json.loads(out).get('streams') or [{}])[0]
    return int(stream.get('width') or 0), int(stream.get('height') or 0), stream.get('codec_name')


def _sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def is_baseline_jpeg(data):
    """True for a JFIF/Exif JPEG whose frame header is SOF0/SOF1 (baseline/extended sequential), not progressive."""
    if data[:3] != b'\xff\xd8\xff':
        return False
    i = 2
    while i + 4 <= len(data):
        if data[i] != 0xFF:
            return False
        marker = data[i + 1]
        if marker in (0xC0, 0xC1):
            return True
        if marker in (0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            return False
        if marker == 0xD9:
            return False
        i += 2 + int.from_bytes(data[i + 2:i + 4], 'big')
    return False


def export_jpeg(png, out, size, max_bytes=MAX_JPEG_BYTES):
    """PNG -> baseline JPEG at exactly `size`, full-range BT.601 (JFIF, read as sRGB), shrinking quality to fit."""
    width, height = size
    for quality in (2, 3, 4, 5, 7, 9, 12):
        _run(['ffmpeg', '-v', 'error', '-y', '-i', str(png), '-vf',
              f'scale={width}:{height}:flags=lanczos,format=yuvj420p', '-c:v', 'mjpeg', '-q:v', str(quality),
              '-frames:v', '1', str(out)])
        if out.stat().st_size <= max_bytes:
            break
    else:
        raise CoverError(f'{out.name} is still over {max_bytes} bytes at the lowest quality')
    w, h, codec = probe_image(out)
    data = out.read_bytes()
    if (w, h) != (width, height) or codec != 'mjpeg' or not is_baseline_jpeg(data):
        raise CoverError(f'{out.name} came out as {w}x{h} {codec}; expected a {width}x{height} baseline JPEG')
    return {'path': str(out), 'width': w, 'height': h, 'bytes': len(data), 'quality': quality,
            'sha256': hashlib.sha256(data).hexdigest()}


# ---------------------------------------------------------------- build

def _load_json(path, default=None):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return default
    except ValueError as error:
        raise CoverError(f'{Path(path).name} is not valid JSON ({error})') from None


def _default_take(job, plan):
    # avatar.mp4 is the trimmed take that captions.json was transcribed from, so the pause timings line up.
    if (job / 'avatar.mp4').is_file():
        return job / 'avatar.mp4'
    if plan.get('take') and (job / plan['take']).is_file():
        return job / plan['take']
    if (job / 'timeline.json').is_file() and (job / 'avatar_main.mp4').is_file():
        return job / 'avatar_main.mp4'           # a sped-up or two-take job: the main take starts the timeline
    raise CoverError(f'no take found in {job}: expected avatar.mp4 (run app.reel build first) or pass --take')


def captions_fit_take(job, take):
    """True when captions.json is timed to `take`: the trimmed avatar.mp4, or avatar_main.mp4 of a job without one
    whose timeline.json puts the main take at the start of the timeline (the speed-up and two-take jobs transcribe
    the final avatar_main.mp4 timeline, e.g. job 91ac50635d3d, where dropping them offered a mid-word face)."""
    take = Path(take).resolve()
    if take == (job / 'avatar.mp4').resolve():
        return True
    return (take == (job / 'avatar_main.mp4').resolve() and not (job / 'avatar.mp4').exists()
            and (job / 'timeline.json').is_file())


# ---------------------------------------------------------------- stacked-box cover (CoverStack.tsx)

STACK_FILE = 'cover_layout.json'
STACK_LIMITS = {'box1': 22, 'box2': 24, 'kicker': 48}
STACK_HEAD_TOP, STACK_CHIN = 230, 1060     # cover px: head top ~12 %, chin ~55 % (a 720p take stays sharp enough)
STACK_FACE_BOX = (0.32, 0.145, 0.41, 0.33)


def stack_layout(job):
    """The job's stacked-box cover settings (<job>/cover_layout.json, layout "stacked"), checked, or None.

    {"layout": "stacked", "t_s": [s, ...] (face picks on the take, in pick order), "box1", "box2", "kicker" (verified
    facts only), "face_box"?: [x, y, w, h] fractions of the take, hair top to chin, "head_top"?/"chin"?: cover px,
    "badge": job-relative square-ish headshot image, "badge_box"?: [x, y, w, h] fractions of it}."""
    cfg = _load_json(job / STACK_FILE)
    if not cfg or cfg.get('layout') != 'stacked':
        return None
    problems = [f'{k} is missing' for k in ('box1', 'box2', 'kicker', 't_s', 'badge') if not cfg.get(k)]
    problems += [f'{k} is {len(cfg[k])} characters (max {n})' for k, n in STACK_LIMITS.items() if len(str(cfg.get(k) or '')) > n]
    if not problems and not (job / cfg['badge']).is_file():
        problems.append(f"badge {cfg['badge']} not found in the job")
    if problems:
        raise CoverError(f'{STACK_FILE}: ' + '; '.join(problems))
    cfg['t_s'] = [float(t) for t in (cfg['t_s'] if isinstance(cfg['t_s'], list) else [cfg['t_s']])][:PICKS]
    return cfg


def stack_face_props(cfg):
    """faceTop / faceScale / faceShiftX for CoverStack: the take's head (face_box) from head_top to chin, centred."""
    fx, fy, fw, fh = cfg.get('face_box') or STACK_FACE_BOX
    top, chin = float(cfg.get('head_top', STACK_HEAD_TOP)), float(cfg.get('chin', STACK_CHIN))
    s = (chin - top) / (fh * 1280)                    # scale of the 720x1280 take
    scale = s / 2                                     # the extracted frame is 2x (1440x2560)
    shift = COVER_W / 2 - (fx + fw / 2) * 720 * s - (COVER_W - FACE_W * scale) / 2
    return {'faceTop': round(top - fy * 1280 * s), 'faceScale': round(scale, 4), 'faceShiftX': round(shift)}


def extract_badge(src, box, out_png, size=240):
    """A square headshot for the badge: box [x, y, w, h] fractions of the image (default the centre square)."""
    out_png.parent.mkdir(parents=True, exist_ok=True)
    crop = (f'crop=iw*{box[2]}:ih*{box[3]}:iw*{box[0]}:ih*{box[1]},' if box else 'crop=min(iw\\,ih):min(iw\\,ih),')
    _run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-frames:v', '1', '-vf',
          f'{crop}scale={size}:{size}:flags=lanczos', str(out_png)])
    return out_png


def still_gray(png):
    """A still as one 360x640 grayscale frame in the cover geometry of the take frames (for head_geometry)."""
    process = _run(['ffmpeg', '-v', 'error', '-i', str(png), '-frames:v', '1', '-vf',
                    f'scale={ANALYSIS_W}:{ANALYSIS_H}:force_original_aspect_ratio=increase:flags=area,'
                    f'crop={ANALYSIS_W}:{ANALYSIS_H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'])
    frame = np.frombuffer(process.stdout, np.uint8)
    if frame.size != ANALYSIS_W * ANALYSIS_H:
        raise CoverError(f'could not decode {png}')
    return frame.reshape(ANALYSIS_H, ANALYSIS_W).astype(np.float32)


def extract_still_face(png, out_png):
    """A still cover-cropped to 1440x2560 with the same lanczos + unsharp as extract_face."""
    out_png.parent.mkdir(parents=True, exist_ok=True)
    _run(['ffmpeg', '-v', 'error', '-y', '-i', str(png), '-frames:v', '1', '-vf',
          f'scale={FACE_W}:{FACE_H}:force_original_aspect_ratio=increase:flags=lanczos,crop={FACE_W}:{FACE_H},'
          'unsharp=5:5:0.6:5:5:0', str(out_png)])
    return out_png


def _still_path(job, p):
    """An absolute path as is; a relative one against the job folder (the deskreel.json form), or against the
    current directory when only that exists (`--still .local/jobs/<id>/stills/x.png` typed from studio/)."""
    p = Path(p)
    if p.is_absolute():
        return p
    if not (job / p).is_file() and p.is_file():
        return p.resolve()
    return job / p


def cover_stills(job, stills=None):
    """The stills to offer as cover picks: the explicit list, else deskreel.json "cover_still" (str or list).
    Paths are absolute, job-relative or relative to the current directory (_still_path); at most PICKS."""
    if not stills:
        spec = _load_json(job / 'deskreel.json', {}) or {}
        stills = spec.get('cover_still') or []
        stills = [stills] if isinstance(stills, str) else list(stills)
    paths = [_still_path(job, p) for p in stills][:PICKS]
    for path in paths:
        if not path.is_file():
            raise CoverError(f'cover still not found: {path}')
    return [path.resolve() for path in paths]


def _has_take(job, plan):
    return (job / 'avatar.mp4').is_file() or bool(plan.get('take') and (job / plan['take']).is_file())


def build(job, take=None, pick=1, *, render=True, remotion=REMOTION, public_dir=None, stills=None):
    """Pick faces, render the covers and the approval sheet, export the chosen cover. Returns the cover.json dict.
    stills: cover from these images instead of a take (a stills reel; see the module docstring)."""
    started = time.monotonic()
    job = Path(job).resolve()
    if not job.is_dir():
        raise CoverError(f'job folder not found: {job}')
    lesson = _load_json(job / 'lesson.json')
    plan = _load_json(job / 'plan.json', {}) or {}
    still_paths = cover_stills(job, stills) if stills or (not take and not _has_take(job, plan)) else []
    if still_paths and not (lesson or {}).get('cover'):
        lesson = {'cover': (_load_json(job / 'deskreel.json', {}) or {}).get('cover')}   # a stills reel's own copy
    if lesson is None:
        raise CoverError(f'{job / "lesson.json"} not found')
    copy = cover_copy(lesson, dark=plan.get('cover_dark', False))
    warnings = []
    if still_paths:
        if not 1 <= int(pick) <= len(still_paths):
            raise CoverError(f'--pick {pick} is not available: {len(still_paths)} cover still(s) given')
        picks = [{'n': n, 'still': str(path), 'label': f'Pick {n} - {path.name}',
                  'extract': (lambda out, path=path: extract_still_face(path, out)),
                  'frame': (lambda path=path: still_gray(path))} for n, path in enumerate(still_paths, 1)]
        meta = {'stills': [str(path) for path in still_paths]}
        return _finish(job, picks, meta, copy, pick, warnings, started, render=render, remotion=remotion,
                       public_dir=public_dir)
    take = Path(take).resolve() if take else _default_take(job, plan).resolve()
    if not take.is_file():
        raise CoverError(f'take not found: {take}')
    captions = _load_json(job / 'captions.json', []) or []
    if captions and not captions_fit_take(job, take):
        # captions.json is timed to the trimmed avatar.mp4; on any other file its pauses point at the wrong frames
        warnings.append(f'caption pauses not used: captions.json is timed to avatar.mp4, not {take.name}')
        captions = []
    stack = stack_layout(job)
    if stack:
        if not 1 <= int(pick) <= len(stack['t_s']):
            raise CoverError(f"--pick {pick} is not available: {STACK_FILE} lists {len(stack['t_s'])} face time(s)")
        public_root = (Path(remotion) / 'public').resolve()
        badge = extract_badge(job / stack['badge'], stack.get('badge_box'),
                              (Path(public_dir).resolve() if public_dir else public_root / 'job') / 'cover_badge.png')
        badge_rel = badge.relative_to(public_root).as_posix() if badge.is_relative_to(public_root) else str(badge)
        base = {'layout': 'stacked', **stack_face_props(stack), 'badge': badge_rel,
                **{k: stack[k] for k in ('box1', 'box2', 'kicker')}}
        picks = [{'n': n, 't': t, 'label': f'Pick {n} - {t:.2f} s (stacked cover)', 'composition': 'CoverStack',
                  'props': base, 'extract': (lambda out, t=t: extract_face(take, t, out))}
                 for n, t in enumerate(stack['t_s'], 1)]
        meta = {'take': str(take), 'layout': 'stacked', 'layout_file': str(job / STACK_FILE)}
        return _finish(job, picks, meta, {k: stack[k] for k in ('box1', 'box2', 'kicker')}, pick, warnings, started,
                       render=render, remotion=remotion, public_dir=public_dir)
    boxes = {k: tuple(v) for k, v in (plan.get('cover_boxes') or {}).items() if k in BOXES}

    frames, times = sample_frames(take)
    picked = pick_frames(take, captions, boxes=boxes, sampled=(frames, times))
    if not 1 <= int(pick) <= len(picked['picks']):
        raise CoverError(f'--pick {pick} is not available: the picker found {len(picked["picks"])} pick(s)')
    picks = [{'n': n, 't': row['t'], 'score': row['score'],
              'metrics': {k: row[k] for k in ('sharpness', 'motion', 'teeth', 'eyes_open', 'pause', 'at_rest')},
              'label': f'Pick {n} - {row["t"]:.1f} s - score {row["score"]:.2f}',
              'extract': (lambda out, t=row['t']: extract_face(take, t, out)),
              'frame': (lambda t=row['t']: frames[times.index(t)])} for n, row in enumerate(picked['picks'], 1)]
    meta = {'take': str(take), 'duration_s': picked['duration_s'], 'sample_fps': picked['fps']}
    return _finish(job, picks, meta, copy, pick, warnings, started, render=render, remotion=remotion,
                   public_dir=public_dir, frames_json=picked)


def _finish(job, picks, meta, copy, pick, warnings, started, *, render, remotion, public_dir, frames_json=None):
    """Shared tail of build(): faces into public/job, Cover props per pick, the sheet, the render and the exports."""
    t_pick = time.monotonic()
    thumbs = job / 'thumbs'
    thumbs.mkdir(parents=True, exist_ok=True)
    if frames_json is not None:
        (thumbs / 'frames.json').write_text(json.dumps(frames_json, indent=1))
    public_root = (Path(remotion) / 'public').resolve()
    public_dir = Path(public_dir).resolve() if public_dir else public_root / 'job'
    if render and not public_dir.is_relative_to(public_root):
        raise CoverError(f'public_dir {public_dir} must be inside {public_root}: Remotion serves the faces from there')
    stills, entries = [], []
    for row in picks:
        n = row['n']
        face_png = row['extract'](public_dir / f'cover_face_{n}.png')
        face = face_png.relative_to(public_root).as_posix() if face_png.is_relative_to(public_root) else str(face_png)
        if row.get('props'):                     # the stacked-box cover: placed from its face box, not the hair line
            props = {'face': face, **row['props']}
        else:
            hair, centre = head_geometry(row['frame']())
            props = {'face': face, **face_layout(hair, centre), **copy}
        props_path = thumbs / f'cover_{n}.json'
        props_path.write_text(json.dumps(props, indent=1, ensure_ascii=False))
        entry = {k: row[k] for k in ('n', 't', 'score', 'metrics', 'still') if k in row}
        entry.update({'face': str(face_png), 'props_path': str(props_path), 'props': props})
        if n == int(pick):   # each still costs ~3 s; the sheet already shows the other picks, so only this one renders
            entry['png'] = str(thumbs / f'cover_{n}.png')
            stills.append((row.get('composition', 'Cover'), props_path, Path(entry['png'])))
        entries.append((entry, row['label']))
    others = ' or '.join(f'"cover {e["n"]}"' for e, _ in entries if e['n'] != int(pick))
    sheet_props = {'title': f'Cover picks - {job.name}',
                   'subtitle': f'Pick {int(pick)} is exported.' + (f' Reply {others} to switch.' if others else ''),
                   'items': [{'label': label + ('  (chosen)' if e['n'] == int(pick) else ''), 'cover': e['props']}
                             for e, label in entries]}
    sheet_props_path = thumbs / 'cover_sheet.json'
    sheet_props_path.write_text(json.dumps(sheet_props, indent=1, ensure_ascii=False))
    sheet = thumbs / 'cover_sheet.png'
    result = {'version': 1, 'built_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'job': str(job),
              **meta, 'chosen': int(pick), 'copy': copy, 'picks': [e for e, _ in entries], 'files': {},
              'warnings': warnings}
    if render:
        render_stills(stills + [('CoverSheet', sheet_props_path, sheet)], remotion)
        t_render = time.monotonic()
        chosen = thumbs / f'cover_{int(pick)}.png'
        for name, size in EXPORTS.items():
            result['files'][name] = export_jpeg(chosen, job / f'{name}.jpg', size)
        w, h, _ = probe_image(sheet)
        result['files']['cover_sheet'] = {'path': str(sheet), 'width': w, 'height': h, 'bytes': sheet.stat().st_size,
                                          'sha256': _sha256(sheet)}
        result['timings_s'] = {'pick': round(t_pick - started, 2), 'render': round(t_render - t_pick, 2),
                               'export': round(time.monotonic() - t_render, 2)}
    result['timings_s'] = {**result.get('timings_s', {}), 'total': round(time.monotonic() - started, 2)}
    (job / 'cover.json').write_text(json.dumps(result, indent=2, ensure_ascii=False))
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build', help='pick faces, render covers + approval sheet, export the chosen cover')
    b.add_argument('job')
    b.add_argument('--take', help='video to pick faces from (default: <job>/avatar.mp4; another file gets no caption '
                                  'pause bonus, because captions.json is timed to avatar.mp4)')
    b.add_argument('--pick', type=int, default=1, choices=(1, 2, 3), help='which pick to export (default 1)')
    b.add_argument('--still', action='append', default=[],
                   help='a stills reel: cover from this image instead of a take (repeat for picks 2 and 3; '
                        'default deskreel.json "cover_still" when the job has no take). Absolute, job-relative '
                        '(stills/x.png) or relative to the current directory')
    args = parser.parse_args(argv)
    try:
        result = build(args.job, args.take, args.pick, stills=args.still or None)
    except CoverError as error:
        print(f'cover: {error}', file=sys.stderr)
        return 1
    summary = {'chosen': result['chosen'], 'picks': [{k: e[k] for k in ('n', 't', 'score', 'still') if k in e} for e in result['picks']],
               'files': {k: v['path'] for k, v in result['files'].items()}, 'timings_s': result['timings_s'],
               'warnings': result['warnings'], 'cover_json': str(Path(result['job']) / 'cover.json')}
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
