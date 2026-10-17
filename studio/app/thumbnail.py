"""Daily routine step 4: a cover/thumbnail for every reel, built from the avatar take and the lesson's cover copy.

  python -m app.thumbnail build <job_dir> [--take FILE] [--pick 1|2|3]

1. pick_frames(): samples the take at 5 fps (numpy + ffmpeg only) and scores each frame on face sharpness (variance
   of a 3x3 Laplacian), low motion, a smile proxy (share of bright teeth pixels in the mouth box) and a pause bonus
   (the frame falls between two words in captions.json, so the mouth is at rest). Blinks (dark-pixel share in the eye
   box below 60 % of the take's median) and the first/last 0.5 s are excluded. The top 3 frames at least 1.5 s apart
   become the picks, so the owner sees three different expressions.
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
BLINK_RATIO = 0.6
TEETH_LEVEL, EYES_DARK_LEVEL, HAIR_DARK_LEVEL = 175, 60, 70
# Boxes as fractions of the frame (x0, y0, x1, y1). HeyGen framing is fixed per look; these fit the current
# daylight look. A plan.json "cover_boxes" {"face": [...], "mouth": [...], "eyes": [...]} overrides them.
BOXES = {'face': (0.278, 0.234, 0.750, 0.5625), 'mouth': (0.431, 0.4375, 0.597, 0.500),
         'eyes': (0.403, 0.332, 0.625, 0.375)}
WEIGHTS = {'motion': 0.7, 'teeth': 0.6, 'pause': 0.8}

# Must match studio/remotion/src/Cover.tsx.
COVER_W, COVER_H = 1080, 1920
FACE_W, FACE_H = 1440, 2560
SAFE_TOP, SAFE_BOTTOM, SIDE_MARGIN = 420, 1500, 70
BASE_SCALE = 0.75           # the 1440x2560 face drawn exactly 1080 px wide
HAIR_Y = 776                # hair line just under the blue pill (pill bottom ~774)
DEFAULT_FACE_TOP = 453
MAX_SHIFT = 24
EXPORTS = {'cover_1080x1920': (1080, 1920), 'cover_720x1280': (720, 1280)}
MAX_JPEG_BYTES = 2 * 1024 * 1024
COVER_LIMITS = {key: spec['maxLength'] for key, spec in SCHEMA['properties']['cover']['properties'].items()}


class CoverError(RuntimeError):
    """The cover could not be built; the message says what to fix."""


# ---------------------------------------------------------------- frame picker

def _run(cmd, **kw):
    try:
        return subprocess.run(cmd, check=True, capture_output=True, **kw)
    except FileNotFoundError:
        raise CoverError(f'{cmd[0]} is not installed') from None
    except subprocess.CalledProcessError as error:
        tail = (error.stderr or b'')
        tail = tail.decode(errors='replace') if isinstance(tail, bytes) else tail
        raise CoverError(f'{Path(cmd[0]).name} failed: {" | ".join(tail.strip().splitlines()[-3:])}') from None


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
    """Score every sampled frame and return the top `count` picks at least `min_gap` seconds apart.

    Blinks and the first/last `edge` seconds are never picked. Returns {'fps', 'frames', 'duration_s',
    'eyes_median', 'picks': [...], 'rows': [...]}; each row has t, score, sharpness, motion, teeth, eyes_dark,
    pause, blink, edge."""
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
                     'eyes_dark': float((_box(frame, boxes['eyes']) < EYES_DARK_LEVEL).mean()),
                     'pause': any(a <= t <= b for a, b in pauses),
                     'edge': t < edge or t > duration - edge})
    eyes_median = float(np.median([r['eyes_dark'] for r in rows])) if rows else 0.0
    for row in rows:
        row['blink'] = eyes_median > 0 and row['eyes_dark'] < BLINK_RATIO * eyes_median
    eligible = [r for r in rows if not r['edge'] and not r['blink']]
    if not eligible:
        raise CoverError(f'no usable frame in {take}: the take is shorter than {2 * edge:g} s or every frame is a blink')
    metrics = {key: _z(np.array([r[key] for r in eligible], dtype=float)) for key in ('sharpness', 'motion', 'teeth')}
    for i, row in enumerate(eligible):
        row['score'] = round(float(metrics['sharpness'][i] - WEIGHTS['motion'] * metrics['motion'][i]
                                   + WEIGHTS['teeth'] * metrics['teeth'][i] + (WEIGHTS['pause'] if row['pause'] else 0)), 3)
    picks = []
    for row in sorted(eligible, key=lambda r: (-r['score'], r['t'])):
        if all(abs(row['t'] - p['t']) >= min_gap for p in picks):
            picks.append(row)
        if len(picks) == count:
            break
    clean = [{k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()} for r in rows]
    by_time = {row['t']: row for row in clean}
    return {'fps': fps, 'frames': len(rows), 'duration_s': round(duration, 3), 'eyes_median': round(eyes_median, 4),
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
        _run([npx, 'remotion', 'bundle', 'src/index.ts', f'--out-dir={bundle}', '--log=error'], cwd=remotion, text=True)
        for composition, props, out in jobs:
            out.parent.mkdir(parents=True, exist_ok=True)
            _run([npx, 'remotion', 'still', str(bundle), composition, str(out), f'--props={props}',
                  '--image-format=png', '--overwrite', '--log=error', *extra], cwd=remotion, text=True)
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


def _default_take(job, plan):
    # avatar.mp4 is the trimmed take that captions.json was transcribed from, so the pause timings line up.
    if (job / 'avatar.mp4').is_file():
        return job / 'avatar.mp4'
    if plan.get('take') and (job / plan['take']).is_file():
        return job / plan['take']
    raise CoverError(f'no take found in {job}: expected avatar.mp4 (run app.reel build first) or pass --take')


def build(job, take=None, pick=1, *, render=True, remotion=REMOTION, public_dir=None):
    """Pick faces, render the covers and the approval sheet, export the chosen cover. Returns the cover.json dict."""
    started = time.monotonic()
    job = Path(job).resolve()
    if not job.is_dir():
        raise CoverError(f'job folder not found: {job}')
    lesson = _load_json(job / 'lesson.json')
    if lesson is None:
        raise CoverError(f'{job / "lesson.json"} not found')
    plan = _load_json(job / 'plan.json', {}) or {}
    copy = cover_copy(lesson, dark=plan.get('cover_dark', False))
    take = Path(take).resolve() if take else _default_take(job, plan)
    if not take.is_file():
        raise CoverError(f'take not found: {take}')
    captions = _load_json(job / 'captions.json', []) or []
    boxes = {k: tuple(v) for k, v in (plan.get('cover_boxes') or {}).items() if k in BOXES}

    frames, times = sample_frames(take)
    picked = pick_frames(take, captions, boxes=boxes, sampled=(frames, times))
    picks = picked['picks']
    if not 1 <= int(pick) <= len(picks):
        raise CoverError(f'--pick {pick} is not available: the picker found {len(picks)} pick(s)')
    t_pick = time.monotonic()

    thumbs = job / 'thumbs'
    thumbs.mkdir(parents=True, exist_ok=True)
    (thumbs / 'frames.json').write_text(json.dumps(picked, indent=1))
    public_root = (Path(remotion) / 'public').resolve()
    public_dir = Path(public_dir).resolve() if public_dir else public_root / 'job'
    if render and not public_dir.is_relative_to(public_root):
        raise CoverError(f'public_dir {public_dir} must be inside {public_root}: Remotion serves the faces from there')
    stills, entries = [], []
    for n, row in enumerate(picks, 1):
        face_png = extract_face(take, row['t'], public_dir / f'cover_face_{n}.png')
        hair, centre = head_geometry(frames[times.index(row['t'])])
        face = face_png.relative_to(public_root).as_posix() if face_png.is_relative_to(public_root) else str(face_png)
        props = {'face': face, **face_layout(hair, centre), **copy}
        props_path = thumbs / f'cover_{n}.json'
        props_path.write_text(json.dumps(props, indent=1, ensure_ascii=False))
        entry = {'n': n, 't': row['t'], 'score': row['score'],
                 'metrics': {k: row[k] for k in ('sharpness', 'motion', 'teeth', 'eyes_dark', 'pause')},
                 'face': str(face_png), 'props_path': str(props_path), 'props': props}
        if n == int(pick):   # each still costs ~3 s; the sheet already shows the other picks, so only this one renders
            entry['png'] = str(thumbs / f'cover_{n}.png')
            stills.append(('Cover', props_path, Path(entry['png'])))
        entries.append(entry)
    others = ' or '.join(f'"cover {e["n"]}"' for e in entries if e['n'] != int(pick))
    sheet_props = {'title': f'Cover picks - {job.name}',
                   'subtitle': f'Pick {int(pick)} is exported.' + (f' Reply {others} to switch.' if others else ''),
                   'items': [{'label': f'Pick {e["n"]} - {e["t"]:.1f} s - score {e["score"]:.2f}'
                                       + ('  (chosen)' if e['n'] == int(pick) else ''), 'cover': e['props']}
                             for e in entries]}
    sheet_props_path = thumbs / 'cover_sheet.json'
    sheet_props_path.write_text(json.dumps(sheet_props, indent=1, ensure_ascii=False))
    sheet = thumbs / 'cover_sheet.png'
    result = {'version': 1, 'built_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'job': str(job),
              'take': str(take), 'duration_s': picked['duration_s'], 'sample_fps': picked['fps'],
              'chosen': int(pick), 'copy': copy, 'picks': entries, 'files': {}}
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
    b.add_argument('--take', help='video to pick faces from (default: <job>/avatar.mp4)')
    b.add_argument('--pick', type=int, default=1, choices=(1, 2, 3), help='which pick to export (default 1)')
    args = parser.parse_args(argv)
    try:
        result = build(args.job, args.take, args.pick)
    except CoverError as error:
        print(f'cover: {error}', file=sys.stderr)
        return 1
    summary = {'chosen': result['chosen'], 'picks': [{k: e[k] for k in ('n', 't', 'score')} for e in result['picks']],
               'files': {k: v['path'] for k, v in result['files'].items()}, 'timings_s': result['timings_s'],
               'cover_json': str(Path(result['job']) / 'cover.json')}
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
