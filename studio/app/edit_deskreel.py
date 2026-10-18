"""DeskReel edit: a SILENT desk b-roll reel (the techwithprateek format: reference jobs 6cff0a62569f "FDE" and
6f8f4ad316a3 "stack", analysis/visual.md in each) made of animated STILLS of the owner's avatar, rendered by the
Remotion composition "DeskReel" (studio/remotion/src/deskreel, props in deskreel/types.ts).

  python -m app.edit_deskreel build <job> [--spec deskreel.json]     # validate, stage assets, write the props
  python -m app.edit_deskreel render <job> [--out final.mp4]         # Remotion + -14 LUFS master + platform exports
  python -m app.edit_deskreel align <job> <ref_still> <still>... [--spec deskreel.json] [--region x,y,w,h]
  python -m app.edit_deskreel check <job> [--spec deskreel.json]     # validation only

The spec, <job>/deskreel.json, is written by the agent session in the props shape (types.ts) with JOB-RELATIVE (or
absolute) asset paths; every time is absolute ms on the reel timeline, positions are % of the 720x1280 frame and px
values are at 720 w. Spec-only conveniences:
  - text "appear": {"mode": "typewriter", "msPerChar": 45, "startMs": 2167} is expanded into charTimesMs
    (typewriter_times: a space appears with the character after it, like the reference's "AI s" frame);
  - "cover_still": "stills/candidates/raw_2.png" (or a list) and "cover": {kicker, hook, pill_strong, pill_serif}
    are read by app.thumbnail build for a stills reel; they never reach the props.

build validates everything a render cannot recover from (validate()): every window inside the reel (frames counted
exactly like camera.ts), overlays sorted by startMs, poses covering the reel without gaps, camera keys inside their
shot, the camera never uncovering a frame corner (every frame of the reel, the identity camera where no shot holds
it, against the pose's still and fit, plus the shake amplitude), stills/recordings/music on disk, text that fits its
box (advance widths of the real fonts, deskreel_fonts.json, plus the outline; no kerning, so the estimate is a few %
wide, never narrow), every character drawn by a vendored OFL face (the line's font or Noto Color Emoji: never a
system fallback), fades at least one frame long, and no overlay over the presenter's head on any frame: each still
may carry "face" {x, y, w, h} (still px: the head box, hair top to chin, ear to ear), carried through the cover fit,
its fit and the camera (plus shake) on every frame it is on screen. A still without one is a warning.
It warns about every pose swap inside a shot between stills that are not one aligned view (the background would
jump; "align" below), unless the swap sits under a camera blur (a whip hides it). It then copies every asset into
studio/remotion/public/job/deskreel/ (cleared first), probes inset video lengths (an inset holds its last frame
instead of running out) and writes <job>/edit_deskreel.props.json.

render runs `npx remotion render DeskReel` with absolute paths (Remotion runs from studio/remotion), masters to
-14 LUFS with app.audio.master into <job>/final.mp4, then writes final_ig.mp4 and final_social.mp4 (app.exports).

align computes stills[].fit {scale, dx, dy, rot} so the poses of one shot sit on the same static background: each
still is decoded with ffmpeg to a small grayscale array in the frame's cover geometry and compared as local-contrast
intensities above the desk, first without the presenter's usual box, then reweighted to the pixels that agree after
alignment (the wall, lamp and shelves; poses differ). A search over scale and roll, each with masked normalised
cross-correlation for the shift (numpy FFTs only), keeps the best peak. The fit is composed with the reference
still's own fit and written into the spec. Stills generated from slightly different viewpoints cannot line up everywhere (parallax): check the
red/cyan overlay or the rendered frames. So align also measures what is LEFT after the fit: the background is cut
into tiles and each tile's own shift is measured again (residualPx, frame px; the second-worst tile, so one arm in a
tile does not decide it). A fit with a low NCC peak or a residual above ALIGN_MAX_RESIDUAL_PX is flagged: drop it,
and give that pose its own shot or hide the swap under a whip. align records {ref, score, residualPx} in
stills[].align, which check reads to tell one view from another (spec-only, like "face").
Standard library + numpy only.
"""
import argparse
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
import unicodedata
from pathlib import Path

STUDIO = Path(__file__).resolve().parents[1]
REMOTION = STUDIO / 'remotion'
PUBLIC = REMOTION / 'public'
STAGE_DIR = 'job/deskreel'          # under remotion/public; cleared on every build
_METRICS = json.loads((Path(__file__).with_name('deskreel_fonts.json')).read_text())
FONTS = _METRICS['fonts']
EMOJI_FONT = _METRICS['emoji']     # Noto Color Emoji, second in every Overlays.tsx font stack

FPS = 30
W, H = 720, 1280
EMOJI_EM = EMOJI_FONT['advance']    # every Noto Color Emoji glyph: 1275/1024 em
# Must match studio/remotion/src/deskreel/camera.ts EASES.
EASES = {'linear': (0, 0, 1, 1), 'easeIn': (0.42, 0, 1, 1), 'easeOut': (0, 0, 0.58, 1),
         'easeInOut': (0.42, 0, 0.58, 1), 'expoOut': (0.16, 1, 0.3, 1)}
# Must match Overlays.tsx defaults.
INSET_FRAME = {'top': 10, 'side': 7, 'bottom': 7}
STATCARD = {'headlineSize': 22, 'dekSize': 14, 'sourceSize': 14, 'padding': 12}
STATCARD_LH = {'headline': 1.12, 'dek': 1.25, 'source': 1.2}
CHIP_PAD_PX = 8
BLUR_AXES = ('xy', 'x', 'y', 'motion')
STILL_SPEC_KEYS = ('face', 'align')  # spec-only still fields (validation and alignment), dropped from the props
FACE_MARGIN_PX = 6                  # clearance kept between any overlay and the head box
SWAP_BLUR_PX = 3                    # a pose swap under at least this much camera blur reads as part of the whip
PROPS_KEYS = ('durationMs', 'stills', 'poses', 'camera', 'overlays', 'music', 'sfx', 'grade', 'allowMissingAudio')
OVERLAY_TYPES = ('text', 'chip', 'inset', 'statcard', 'image')
IMAGE_EXT = ('.png', '.jpg', '.jpeg', '.webp')


class DeskReelError(ValueError):
    """The spec cannot render; the message lists every problem."""


def js_round(x):
    """JavaScript Math.round: half rounds up (towards +inf), computed exactly (floor(x + 0.5) is not, near .5)."""
    r = math.floor(x)
    return r + 1 if x - r >= 0.5 else r


def to_frame(ms):
    """camera.ts toFrame: Math.round((ms / 1000) * FPS), in that operation order: ms * FPS / 1000 rounds the
    float differently (2050 ms is 61.4999... frames in JavaScript, 61.5 the other way) and would approve windows
    the render drops or a pose gap it renders black."""
    return js_round((ms / 1000) * FPS)


# ----------------------------------------------------------------------------------------------- typewriter

def _extends(cp):
    """A code point that joins the cluster before it (UAX #29 Extend / SpacingMark / ZWJ, the emoji modifiers)."""
    return (cp == 0x200D or 0xFE00 <= cp <= 0xFE0F or 0x1F3FB <= cp <= 0x1F3FF or 0xE0020 <= cp <= 0xE007F
            or cp == 0x20E3 or unicodedata.category(chr(cp)) in ('Mn', 'Me', 'Mc'))


def _pictographic(cp):
    """Extended_Pictographic, closely enough for the emoji our fonts cover (the ZWJ-sequence rule)."""
    return (0x1F000 <= cp <= 0x1FAFF or 0x2600 <= cp <= 0x27BF or 0x2190 <= cp <= 0x21FF or 0x2300 <= cp <= 0x23FF
            or 0x2B00 <= cp <= 0x2BFF or 0x25A0 <= cp <= 0x25FF or 0x2900 <= cp <= 0x297F
            or cp in (0xA9, 0xAE, 0x203C, 0x2049, 0x2122, 0x2139, 0x3030, 0x303D, 0x3297, 0x3299))


def _regional(cp):
    return 0x1F1E6 <= cp <= 0x1F1FF


def graphemes(text):
    """Grapheme clusters: the unit a typewriter reveals, mirroring Overlays.tsx graphemes (Intl.Segmenter). A base
    character with its combining marks, variation selectors, skin tone, keycap or tag characters; a ZWJ emoji
    sequence; a flag (a regional-indicator pair). Enough of UAX #29 for Latin text and emoji."""
    out = []
    for ch in text:
        cp = ord(ch)
        if out:
            prev = out[-1]
            joins = (_extends(cp)
                     or (prev[-1] == '\u200d' and _pictographic(cp) and _pictographic(ord(prev[0])))
                     or (_regional(cp) and len(prev) == 1 and _regional(ord(prev))))
            if joins:
                out[-1] = prev + ch
                continue
        out.append(ch)
    return out


def typewriter_times(lines, start_ms, ms_per_char):
    """One absolute reveal time per character (grapheme) of the block (all lines in order, newlines excluded).
    Characters arrive one every ms_per_char; a space takes no slot of its own and appears with the character after
    it (a trailing space with the last character)."""
    chars = [g for line in lines for g in graphemes(line)]
    times, slot = [], 0
    for g in chars:
        if g.isspace():
            times.append(None)
            continue
        times.append(round(start_ms + slot * ms_per_char, 1))
        slot += 1
    nxt = next((t for t in reversed(times) if t is not None), start_ms)
    for i in range(len(times) - 1, -1, -1):     # a space takes the time of the next character (or the last one)
        if times[i] is None:
            times[i] = nxt
        else:
            nxt = times[i]
    return times


def char_count(lines):
    """Characters (graphemes) a typewriter block reveals: the length charTimesMs must have."""
    return sum(len(graphemes(line)) for line in lines)


def revealed_at(char_times, frame):
    """Characters shown on a frame: the rule Overlays.tsx revealedChars uses."""
    return sum(1 for t in char_times if to_frame(t) <= frame)


def visible_text(lines, char_times, frame):
    """The revealed prefix of each line on a frame (for checks and tests)."""
    n = revealed_at(char_times, frame)
    out = []
    for line in lines:
        chars = graphemes(line)
        out.append(''.join(chars[:max(0, min(len(chars), n))]))
        n -= len(chars)
    return out


# ----------------------------------------------------------------------------------------------- text fit

def font_key(font, weight=400, italic=False):
    return f'{font}|{int(weight)}|{"italic" if italic else "normal"}'


def _zero_width(cp):
    """Joiners, variation selectors, skin tones, keycap and tags: drawn inside the emoji before them."""
    return cp in (0xFE0F, 0xFE0E, 0x200D, 0x20E3) or 0x1F3FB <= cp <= 0x1F3FF or 0xE0020 <= cp <= 0xE007F


def _emoji_covers(cp):
    return any(lo <= cp <= hi for lo, hi in EMOJI_FONT['ranges'])


def _char_em(metrics, ch):
    if ch in metrics['w']:
        return metrics['w'][ch]
    cp = ord(ch)
    if _zero_width(cp):
        return 0.0
    if _emoji_covers(cp):                                       # Noto Color Emoji, next in the font stack
        return EMOJI_EM
    return metrics['avg']                                       # not drawable: _fits reports it


def missing_glyphs(text, font, weight=400, italic=False):
    """Characters neither the line's face nor Noto Color Emoji draws (the browser would fall back to a system font,
    which is neither OFL nor ours): '→' is one (latin subsets stop at U+2191/2193; use '➡')."""
    metrics = FONTS.get(font_key(font, weight, italic)) or {'w': {}}
    out = []
    for ch in text:
        cp = ord(ch)
        if ch not in metrics['w'] and not _zero_width(cp) and not _emoji_covers(cp) and ch not in out:
            out.append(ch)
    return out


def text_width(text, font, size, weight=400, italic=False, letter_spacing=0.0, stroke_px=0.0):
    """Estimated rendered width in px: advance widths (no kerning) + letter spacing + the outer outline."""
    metrics = FONTS.get(font_key(font, weight, italic))
    if metrics is None:
        raise KeyError(font_key(font, weight, italic))
    em = sum(_char_em(metrics, ch) for ch in text)
    return em * size + letter_spacing * len(text) + 2 * stroke_px


def _fits(errors, where, text, box_px, **font):
    try:
        width = text_width(text, **font)
    except KeyError as missing:
        errors.append(f'{where}: font {missing} is not loaded (fonts: {", ".join(sorted(FONTS))})')
        return
    missing = missing_glyphs(text, font['font'], font.get('weight', 400), font.get('italic', False))
    if missing:
        errors.append(f'{where}: no vendored font draws {", ".join(f"{c!r} (U+{ord(c):04X})" for c in missing)} '
                      f'({font["font"]} or Noto Color Emoji): use another character')
    if width > box_px + 0.5:
        errors.append(f'{where}: "{text}" is ~{width:.0f} px wide, its box is {box_px:.0f} px '
                      f'(overflow {width - box_px:.0f} px): shorten it, lower the size or widen the box')


# ----------------------------------------------------------------------------------------------- camera (mirror of camera.ts)

def bezier(curve, t):
    if t <= 0:
        return 0.0
    if t >= 1:
        return 1.0
    x1, y1, x2, y2 = curve
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        x = 3 * x1 * mid * (1 - mid) ** 2 + 3 * x2 * mid * mid * (1 - mid) + mid ** 3
        lo, hi = (mid, hi) if x < t else (lo, mid)
    u = (lo + hi) / 2
    return 3 * y1 * u * (1 - u) ** 2 + 3 * y2 * u * u * (1 - u) + u ** 3


def ease(name, t):
    if name == 'hold':
        return 1.0 if t >= 1 else 0.0
    return bezier(name if isinstance(name, (list, tuple)) else EASES.get(name or 'linear', EASES['linear']), t)


def fill_keys(keys):
    prev = {'x': 0.0, 'y': 0.0, 'scale': 1.0, 'rot': 0.0, 'blurPx': 0.0}
    out = []
    for k in sorted(keys, key=lambda k: k['ms']):
        cur = {f: float(k.get(f, prev[f])) for f in prev}
        out.append({**cur, 'ms': k['ms'], 'ease': k.get('ease')})
        prev = cur
    return out


def camera_at(shot, ms):
    """The shot's eased key state at ms (no shake: validation adds its amplitude as a margin)."""
    keys = fill_keys(shot.get('keys') or [])
    if not keys:
        return {'x': 0.0, 'y': 0.0, 'scale': 1.0, 'rot': 0.0, 'blurPx': 0.0}
    if ms <= keys[0]['ms']:
        return keys[0]
    if ms >= keys[-1]['ms']:
        return keys[-1]
    j = next(i for i, k in enumerate(keys) if k['ms'] > ms)
    a, b = keys[j - 1], keys[j]
    t = ease(b['ease'], (ms - a['ms']) / max(1e-6, b['ms'] - a['ms']))
    return {f: a[f] + (b[f] - a[f]) * t for f in ('x', 'y', 'scale', 'rot', 'blurPx')}


def needed_scale(fit, cam, still_size, margin_px=0.0, margin_rot=0.0):
    """The smallest camera scale (the rest of `cam` kept) at which the still covers the frame."""
    lo, hi = 0.5, 4.0
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if uncovered(fit, {**cam, 'scale': mid}, still_size, margin_px, margin_rot) <= 0 else (mid, hi)
    return hi


def shake_envelope(shake, ms, shot_start_ms):
    """camera.ts shakeAt's envelope: the most the shake can move the picture at ms, as a share of its amplitude."""
    if not shake:
        return 0.0
    t = ms - shake.get('startMs', shot_start_ms)
    return 0.0 if t < 0 else math.exp(-t / max(1.0, shake.get('decayMs', 1)))


def cover_size(img_w, img_h):
    """The still's displayed size when cover-fitted to the 720x1280 frame."""
    c = max(W / img_w, H / img_h)
    return img_w * c, img_h * c


def _apply(t, p):
    """Affine (dx, dy, scale, rot) about the frame centre, CSS order translate * rotate * scale."""
    a = math.radians(t['rot'])
    x, y = p[0] * t['scale'], p[1] * t['scale']
    return (x * math.cos(a) - y * math.sin(a) + t['dx'], x * math.sin(a) + y * math.cos(a) + t['dy'])


def _invert(t, p):
    a = math.radians(-t['rot'])
    x, y = p[0] - t['dx'], p[1] - t['dy']
    return ((x * math.cos(a) - y * math.sin(a)) / t['scale'], (x * math.sin(a) + y * math.cos(a)) / t['scale'])


def uncovered(fit, cam, still_size, margin_px=0.0, margin_rot=0.0):
    """How far (px) the worst frame corner falls outside the still after fit and camera; <= 0 means covered.
    margin_px / margin_rot: shake amplitude, applied in the worst direction."""
    sw, sh = cover_size(*still_size)
    f = {'dx': fit.get('dx', 0.0), 'dy': fit.get('dy', 0.0), 'scale': fit.get('scale', 1.0), 'rot': fit.get('rot', 0.0)}
    worst = -1e9
    for rot_m in ((-margin_rot, margin_rot) if margin_rot else (0.0,)):
        c = {'dx': cam['x'], 'dy': cam['y'], 'scale': cam['scale'], 'rot': cam['rot'] + rot_m}
        for corner in ((-W / 2, -H / 2), (W / 2, -H / 2), (W / 2, H / 2), (-W / 2, H / 2)):
            # the shake moves the picture by up to margin_px: a corner is safe only with that much slack
            q = _invert(f, _invert(c, corner))
            s = c['scale'] * f['scale']
            worst = max(worst, (abs(q[0]) - sw / 2) * s + margin_px, (abs(q[1]) - sh / 2) * s + margin_px)
    return worst


IDENTITY_CAM = {'x': 0.0, 'y': 0.0, 'scale': 1.0, 'rot': 0.0, 'blurPx': 0.0}


def shot_at(shots, frame):
    """The shot holding this frame (camera.ts cameraAt's rule), or None (the identity camera)."""
    return next((s for s in shots if isinstance(s.get('startMs'), (int, float)) and isinstance(s.get('endMs'), (int, float))
                 and to_frame(s['startMs']) <= frame < to_frame(s['endMs'])), None)


def camera_on_frame(shots, frame):
    """(camera state without shake, shake margin px, shake margin deg) on a frame: the identity outside every shot."""
    shot = shot_at(shots, frame)
    if shot is None:
        return dict(IDENTITY_CAM), 0.0, 0.0
    ms = frame * 1000 / FPS
    shake = shot.get('shake') or {}
    env = shake_envelope(shake, ms, shot['startMs'])
    return camera_at(shot, ms), float(shake.get('ampPx', 0)) * env, float(shake.get('rotDeg', 0)) * env


def pose_at(poses, frame):
    return next((p for p in poses if isinstance(p.get('startMs'), (int, float)) and isinstance(p.get('endMs'), (int, float))
                 and to_frame(p['startMs']) <= frame < to_frame(p['endMs'])), None)


def face_rect(face, still_size, fit, cam, margin_px=0.0, margin_rot=0.0):
    """The head box {x, y, w, h} (still px) on the frame, after the cover fit, the still's fit and the camera, as
    (x0, y0, x1, y1) frame px: the bounding box of its four corners, grown by the shake margin."""
    iw, ih = still_size
    sw, sh = cover_size(iw, ih)
    c = sw / iw
    ox, oy = (W - sw) / 2, (H - sh) / 2
    f = {'dx': fit.get('dx', 0.0), 'dy': fit.get('dy', 0.0), 'scale': fit.get('scale', 1.0), 'rot': fit.get('rot', 0.0)}
    xs, ys = [], []
    for rot_m in ((-margin_rot, margin_rot) if margin_rot else (0.0,)):
        cm = {'dx': cam['x'], 'dy': cam['y'], 'scale': cam['scale'], 'rot': cam['rot'] + rot_m}
        for px_, py_ in ((face['x'], face['y']), (face['x'] + face['w'], face['y']), (face['x'], face['y'] + face['h']),
                         (face['x'] + face['w'], face['y'] + face['h'])):
            q = _apply(cm, _apply(f, (ox + px_ * c - W / 2, oy + py_ * c - H / 2)))
            xs.append(q[0] + W / 2)
            ys.append(q[1] + H / 2)
    return (min(xs) - margin_px, min(ys) - margin_px, max(xs) + margin_px, max(ys) + margin_px)


def inset_height_px(o):
    fr = {**INSET_FRAME, **(o.get('frame') or {})}
    outer_w = o.get('w', 0) / 100 * W
    return fr['top'] + (outer_w - 2 * fr['side']) / o.get('aspect', 16 / 9) + fr['bottom']


def statcard_height_px(o):
    d = {**STATCARD, **{k: o[k] for k in STATCARD if k in o}}
    height = 2 * d['padding'] + d['headlineSize'] * STATCARD_LH['headline'] * len(o['headline'].split('\n'))
    if o.get('dek'):
        height += d['dekSize'] * STATCARD_LH['dek'] * len(o['dek'].split('\n')) + 5
    if o.get('source'):
        height += d['sourceSize'] * STATCARD_LH['source'] + 6
    return height


def overlay_rects(o, image_h_px=None):
    """The frame-px rectangles (x0, y0, x1, y1) an overlay paints: each text line where its glyphs sit (its
    estimated width placed by the block's align, the font size tall inside the line box, plus its outline), every
    other kind as its box. image_h_px: an image overlay's height when its spec gives none."""
    x0, y0, w = o['x'] / 100 * W, o['y'] / 100 * H, o['w'] / 100 * W
    if o['type'] == 'text':
        rects, top = [], y0
        for line in o.get('lines') or []:
            size, lh = line['size'], line['size'] * line.get('lineHeight', 1.15)
            stroke = (line.get('stroke') or {}).get('px', 0.0)
            try:
                width = min(w, text_width(line['text'], line['font'], size, line.get('weight', 400), bool(line.get('italic')),
                                          line.get('letterSpacing', 0.0), stroke))
            except KeyError:
                width = w
            align = o.get('align', 'center')
            left = x0 if align == 'left' else x0 + w - width if align == 'right' else x0 + (w - width) / 2
            pad = (lh - size) / 2
            rects.append((left, top + pad - stroke, left + width, top + lh - pad + stroke))
            top += lh
        return rects
    if o['type'] == 'chip':
        return [(x0, y0, x0 + w, y0 + o['h'] / 100 * H)]
    if o['type'] == 'inset':
        return [(x0, y0, x0 + w, y0 + inset_height_px(o))]
    if o['type'] == 'statcard':
        return [(x0, y0, x0 + w, y0 + statcard_height_px(o))]
    h = o['h'] / 100 * H if o.get('h') is not None else image_h_px
    return [(x0, y0, x0 + w, y0 + h)] if h else []


def _overlap(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def plate_of(stills_by_id, still_id):
    """The view a still shows: the reference still of a good alignment (align wrote stills[].align and kept the fit),
    else the still itself. Two stills with the same plate share one static background."""
    seen = set()
    while still_id not in seen:
        seen.add(still_id)
        s = stills_by_id.get(still_id) or {}
        a = s.get('align') or {}
        if not (s.get('fit') and a.get('ref') and a.get('ok')):
            return still_id
        still_id = a['ref']
    return still_id


# ----------------------------------------------------------------------------------------------- files

def resolve(job, path):
    p = Path(path)
    return p if p.is_absolute() else Path(job) / p


def image_size(path):
    """(w, h) of a PNG (header) or any image ffprobe reads."""
    data = Path(path).read_bytes()[:32]
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', data[16:24])
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                          '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout
    w, h = out.strip().split(',')[:2]
    return int(w), int(h)


def probe_ms(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()) * 1000)


# ----------------------------------------------------------------------------------------------- validation

def _window(errors, where, item, dur):
    s, e = item.get('startMs'), item.get('endMs')
    if not isinstance(s, (int, float)) or not isinstance(e, (int, float)):
        errors.append(f'{where}: startMs and endMs are required numbers')
        return False
    if s < 0 or e > dur + 0.5:
        errors.append(f'{where}: [{s}, {e}] ms is outside the reel [0, {dur}]')
    if to_frame(e) <= to_frame(s):
        errors.append(f'{where}: [{s}, {e}] ms is shorter than one frame')
        return False
    return True


def _box(errors, where, o, h_pct=None):
    x, y, w = o.get('x'), o.get('y'), o.get('w')
    if not all(isinstance(v, (int, float)) for v in (x, y, w)):
        errors.append(f'{where}: x, y and w (% of the frame) are required')
        return False
    h = h_pct if h_pct is not None else o.get('h', 0) or 0
    if x < -0.01 or y < -0.01 or x + w > 100.01 or y + h > 100.01 or w <= 0:
        errors.append(f'{where}: box x {x}, y {y}, w {w}, h {h:.1f} (%) leaves the frame')
    return True


def _text_lines(errors, where, o):
    box = o['w'] / 100 * W
    height = 0.0
    for i, line in enumerate(o.get('lines') or []):
        if not isinstance(line.get('text'), str) or not line.get('font') or not line.get('size'):
            errors.append(f'{where} line {i + 1}: text, font and size are required')
            continue
        _fits(errors, f'{where} line {i + 1}', line['text'], box, font=line['font'], size=line['size'],
              weight=line.get('weight', 400), italic=bool(line.get('italic')),
              letter_spacing=line.get('letterSpacing', 0.0), stroke_px=(line.get('stroke') or {}).get('px', 0.0))
        height += line['size'] * line.get('lineHeight', 1.15)
    return height


def expand_appear(o):
    """Spec typewriter {msPerChar, startMs?} -> props {mode, charTimesMs}; other forms pass through."""
    ap = o.get('appear')
    if not ap or ap.get('mode') != 'typewriter' or 'charTimesMs' in ap:
        return ap
    lines = [line['text'] for line in o['lines']]
    return {'mode': 'typewriter',
            'charTimesMs': typewriter_times(lines, ap.get('startMs', o['startMs']), ap.get('msPerChar', 45))}


def validate(spec, job):
    """(errors, warnings) for a spec in the props shape with job-relative paths. Nothing is written."""
    errors, warnings = [], []
    dur = spec.get('durationMs')
    if not isinstance(dur, (int, float)) or dur <= 0:
        return ['durationMs: a positive number of ms is required'], warnings
    # -- stills
    sizes = {}
    for i, s in enumerate(spec.get('stills') or []):
        where = f'stills[{i}] {s.get("id", "?")}'
        if not s.get('id') or not s.get('src'):
            errors.append(f'{where}: id and src are required')
            continue
        if s['id'] in sizes:
            errors.append(f'{where}: duplicate id')
        path = resolve(job, s['src'])
        if not path.is_file():
            errors.append(f'{where}: {path} not found')
            sizes[s['id']] = None
            continue
        sizes[s['id']] = image_size(path)
    if not sizes:
        errors.append('stills: at least one still is required')
    fits = {s['id']: s.get('fit') or {} for s in spec.get('stills') or [] if s.get('id')}
    # -- poses: contiguous, cover the reel
    poses = spec.get('poses') or []
    if not poses:
        errors.append('poses: at least one pose is required')
    end_f = 0
    for i, p in enumerate(poses):
        where = f'poses[{i}]'
        if not _window(errors, where, p, dur):
            continue
        if p.get('still') not in sizes:
            errors.append(f'{where}: still "{p.get("still")}" is not in stills')
        if to_frame(p['startMs']) != end_f:
            errors.append(f'{where}: starts at frame {to_frame(p["startMs"])}, the previous pose ends at frame {end_f} '
                          f'(poses must cover the reel without gaps or overlaps)')
        end_f = to_frame(p['endMs'])
    if poses and end_f != to_frame(dur):
        errors.append(f'poses: the last pose ends at frame {end_f}, the reel at frame {to_frame(dur)}')
    # -- camera: sorted shots, keys inside
    last_end = -1
    for i, shot in enumerate(spec.get('camera') or []):
        where = f'camera[{i}]'
        if not _window(errors, where, shot, dur):
            continue
        if to_frame(shot['startMs']) < last_end:
            errors.append(f'{where}: overlaps the previous shot (shots are sorted and never overlap)')
        last_end = to_frame(shot['endMs'])
        for k in shot.get('keys') or []:
            if not shot['startMs'] - 0.5 <= k.get('ms', -1) <= shot['endMs'] + 0.5:
                errors.append(f'{where}: key at {k.get("ms")} ms is outside the shot [{shot["startMs"]}, {shot["endMs"]}]')
            e = k.get('ease')
            if e is not None and e != 'hold' and e not in EASES and not (isinstance(e, list) and len(e) == 4):
                errors.append(f'{where}: key at {k.get("ms")} ms has an unknown ease {e!r}')
            if k.get('scale', 1) <= 0:
                errors.append(f'{where}: key at {k.get("ms")} ms has scale <= 0')
            if k.get('blurAxis') is not None and k['blurAxis'] not in BLUR_AXES:
                errors.append(f'{where}: key at {k.get("ms")} ms has blurAxis {k["blurAxis"]!r} (one of {", ".join(BLUR_AXES)})')
    # every frame of the reel, the identity camera where no shot holds it (cameraAt's rule): an aligned fit may
    # need the camera's scale to cover the corners, and a frame outside every shot gets none
    shots = [sh for sh in spec.get('camera') or [] if isinstance(sh, dict)]
    worst = {}
    for f in range(to_frame(dur)):
        pose = pose_at(poses, f)
        size = sizes.get(pose.get('still')) if pose else None
        if not size:
            continue
        cam, margin, margin_rot = camera_on_frame(shots, f)
        gap = uncovered(fits.get(pose['still'], {}), cam, size, margin, margin_rot)
        shot = shot_at(shots, f)
        key = shots.index(shot) if shot is not None else None
        if gap > 0.5 and (key not in worst or gap > worst[key][0]):
            worst[key] = (gap, f, pose['still'], needed_scale(fits.get(pose['still'], {}), cam, size, margin, margin_rot))
    for key, (gap, f, still, need) in worst.items():
        where = f'camera[{key}]' if key is not None else 'camera (no shot holds this frame: identity camera)'
        errors.append(f'{where}: the camera uncovers a frame corner by {gap:.0f} px at {f * 1000 / FPS:.0f} ms '
                      f'(still {still}): the camera scale there must be at least {need:.3f}'
                      + ('' if key is not None else '; add a camera shot over these frames'))
    # pose swaps inside a shot between different views: the background jumps (a real phone on a desk never moves)
    by_id = {st['id']: st for st in spec.get('stills') or [] if st.get('id')}
    for a, b in zip(poses, poses[1:]):
        if not all(isinstance(x.get('startMs'), (int, float)) for x in (a, b)) or a.get('still') == b.get('still'):
            continue
        f = to_frame(b['startMs'])
        shot = shot_at(shots, f)
        if shot is None or to_frame(shot['startMs']) == f:
            continue            # a hard cut to a new shot may change the view
        if plate_of(by_id, a.get('still')) == plate_of(by_id, b.get('still')):
            continue
        cam, _, _ = camera_on_frame(shots, f)
        if cam['blurPx'] >= SWAP_BLUR_PX:
            continue            # hidden under a whip
        warnings.append(f'poses: {a.get("still")} -> {b.get("still")} at {b["startMs"]} ms is a swap between two views '
                        f'inside one shot (no good alignment links them): the background jumps. Align them, start a new '
                        f'shot there, or hide the swap under a camera blur of {SWAP_BLUR_PX}+ px')
    # -- overlays
    last_start = -1
    for i, o in enumerate(spec.get('overlays') or []):
        where = f'overlays[{i}] {o.get("type", "?")}{" " + o["id"] if o.get("id") else ""}'
        if o.get('type') not in OVERLAY_TYPES:
            errors.append(f'{where}: type must be one of {", ".join(OVERLAY_TYPES)}')
            continue
        if not _window(errors, where, o, dur):
            continue
        if o['startMs'] < last_start:
            errors.append(f'{where}: overlays must be sorted by startMs ({o["startMs"]} after {last_start})')
        last_start = o['startMs']
        if o['type'] == 'text':
            if not _box(errors, where, o):
                continue
            height = _text_lines(errors, where, o)
            if o['y'] + height / H * 100 > 100.01:
                errors.append(f'{where}: the block runs off the bottom of the frame')
            ap = expand_appear(o)
            if ap and ap.get('mode') == 'typewriter':
                n = char_count([line['text'] for line in o['lines']])
                times = ap['charTimesMs']
                if any(not isinstance(t, (int, float)) for t in times):
                    errors.append(f'{where}: charTimesMs must be numbers')
                elif len(times) != n:
                    errors.append(f'{where}: charTimesMs has {len(times)} times for {n} characters')
                elif any(b < a for a, b in zip(times, times[1:])):
                    errors.append(f'{where}: charTimesMs must not decrease')
                elif times and to_frame(times[0]) < to_frame(o['startMs']):
                    errors.append(f'{where}: typing starts before the overlay')
                elif times and to_frame(times[-1]) >= to_frame(o['endMs']):
                    warnings.append(f'{where}: the typing is not finished when the overlay ends '
                                    f'({len(visible_text([line["text"] for line in o["lines"]], times, to_frame(o["endMs"]) - 1)[-1])} '
                                    f'of the last line shown)')
            elif ap and ap.get('mode') not in ('hard', None):
                errors.append(f'{where}: appear.mode must be "hard" or "typewriter"')
            fo = o.get('fadeOut')
            if fo and not (o['startMs'] <= fo.get('startMs', -1) < fo.get('endMs', -1) <= o['endMs'] + 0.5):
                errors.append(f'{where}: fadeOut must sit inside the overlay window')
            elif fo and to_frame(fo['endMs']) <= to_frame(fo['startMs']):
                errors.append(f'{where}: fadeOut [{fo["startMs"]}, {fo["endMs"]}] ms is shorter than one frame '
                              f'(both ends land on frame {to_frame(fo["startMs"])}): make it longer or drop it for a hard cut')
        elif o['type'] == 'chip':
            if not _box(errors, where, o) or not o.get('h') or not o.get('text'):
                errors.append(f'{where}: x, y, w, h and text are required')
                continue
            size = o.get('size', round(o['h'] / 100 * H * 0.52))
            _fits(errors, where, o['text'], o['w'] / 100 * W - 2 * CHIP_PAD_PX, font=o.get('font', 'Inter'), size=size,
                  weight=o.get('weight', 800), letter_spacing=o.get('letterSpacing', -0.5))
            if size * 1.0 > o['h'] / 100 * H:
                errors.append(f'{where}: text size {size} px is taller than the chip')
        elif o['type'] == 'inset':
            if not _box(errors, where, o, inset_height_px(o) / H * 100):
                continue
            states = [dict(o.get('source') or {}, atMs=o['startMs'])] + list(o.get('swaps') or [])
            for j, s in enumerate(states):
                w2 = f'{where} {"source" if j == 0 else f"swaps[{j - 1}]"}'
                if not s.get('src'):
                    errors.append(f'{w2}: src is required')
                    continue
                path = resolve(job, s['src'])
                if not path.is_file():
                    errors.append(f'{w2}: {path} not found')
                if j and not (o['startMs'] < s.get('atMs', -1) < o['endMs']):
                    errors.append(f'{w2}: atMs {s.get("atMs")} must be inside the inset window')
                if j and s.get('atMs', 0) < states[j - 1].get('atMs', 0):
                    errors.append(f'{w2}: swaps must be sorted by atMs')
                if s.get('startFromMs', 0) < 0:
                    errors.append(f'{w2}: startFromMs must be >= 0')
        elif o['type'] == 'statcard':
            if not _box(errors, where, o) or not o.get('headline'):
                errors.append(f'{where}: x, y, w and headline are required')
                continue
            d = {**STATCARD, **{k: o[k] for k in STATCARD if k in o}}
            inner = o['w'] / 100 * W - 2 * d['padding']
            for t in o['headline'].split('\n'):
                _fits(errors, f'{where} headline', t, inner, font='Source Serif 4', size=d['headlineSize'], weight=700,
                      italic=bool(o.get('italic')))
            for t in (o.get('dek') or '').split('\n') if o.get('dek') else []:
                _fits(errors, f'{where} dek', t, inner, font='Source Serif 4', size=d['dekSize'])
            if o.get('source'):
                _fits(errors, f'{where} source', o['source'], inner, font='Source Serif 4', size=d['sourceSize'])
            height = statcard_height_px(o)
            if o['y'] + height / H * 100 > 100.01:
                errors.append(f'{where}: the card runs off the bottom of the frame')
        elif o['type'] == 'image':
            _box(errors, where, o)
            if not o.get('src') or not resolve(job, o['src']).is_file():
                errors.append(f'{where}: {o.get("src")} not found')
                continue
        _face_clear(errors, where, o, spec, job, sizes, fits, poses, shots)
    # -- head boxes
    on_screen = {p.get('still') for p in poses}
    for i, st in enumerate(spec.get('stills') or []):
        face = st.get('face')
        if face is None:
            if st.get('id') in on_screen and spec.get('overlays'):
                warnings.append(f'stills[{i}] {st.get("id")}: no "face" box, so no overlay is checked against its head')
        elif not (isinstance(face, dict) and all(isinstance(face.get(k), (int, float)) for k in 'xywh') and face['w'] > 0 and face['h'] > 0):
            errors.append(f'stills[{i}] {st.get("id")}: face must be {{x, y, w, h}} in still px')
    # -- sound and grade
    music = spec.get('music')
    if music:
        if not resolve(job, music.get('src', '')).is_file():
            errors.append(f'music: {music.get("src")} not found')
        if not 0 <= music.get('volume', 0.9) <= 1:
            errors.append('music: volume must be 0-1')
    for i, x in enumerate(spec.get('sfx') or []):
        if not resolve(job, x.get('src', '')).is_file():
            errors.append(f'sfx[{i}]: {x.get("src")} not found')
        if not 0 <= x.get('atMs', -1) < dur:
            errors.append(f'sfx[{i}]: atMs must be inside the reel')
    grade = spec.get('grade') or {}
    for k, lo, hi in (('grain', 0, 1), ('vignette', 0, 1), ('warmth', -1, 1), ('soften', 0, 2)):
        if k in grade and not lo <= grade[k] <= hi:
            errors.append(f'grade.{k} must be {lo}-{hi}')
    return errors, warnings


def _face_clear(errors, where, o, spec, job, sizes, fits, poses, shots):
    """No overlay may cover the presenter's head on any frame it is on screen (stills[].face through the cover fit,
    the still's fit and the camera, grown by the shake and FACE_MARGIN_PX). One error per overlay: its first hit."""
    faces = {st['id']: st['face'] for st in spec.get('stills') or [] if st.get('id') and isinstance(st.get('face'), dict)
             and all(isinstance(st['face'].get(k), (int, float)) for k in 'xywh')}
    if not faces:
        return
    image_h = None
    if o['type'] == 'image' and o.get('h') is None:
        iw, ih = image_size(resolve(job, o['src']))
        image_h = o['w'] / 100 * W * ih / iw
    try:
        rects = overlay_rects(o, image_h)
    except (KeyError, TypeError, ValueError):
        return              # the overlay's own errors are reported above
    for f in range(to_frame(o['startMs']), min(to_frame(o['endMs']), to_frame(spec['durationMs']))):
        pose = pose_at(poses, f)
        if not pose or pose.get('still') not in faces or not sizes.get(pose['still']):
            continue
        cam, margin, margin_rot = camera_on_frame(shots, f)
        head = face_rect(faces[pose['still']], sizes[pose['still']], fits.get(pose['still'], {}), cam,
                         margin + FACE_MARGIN_PX, margin_rot)
        for r in rects:
            if _overlap(r, head):
                errors.append(f'{where}: covers the presenter\'s head at {f * 1000 / FPS:.0f} ms (still {pose["still"]}): '
                              f'its box y {r[1] / H * 100:.1f}-{r[3] / H * 100:.1f}%, x {r[0] / W * 100:.1f}-{r[2] / W * 100:.1f}%; '
                              f'the head y {head[1] / H * 100:.1f}-{head[3] / H * 100:.1f}%, x {head[0] / W * 100:.1f}-'
                              f'{head[2] / W * 100:.1f}%: move the overlay, or move or zoom the camera')
                return


# ----------------------------------------------------------------------------------------------- staging

def _public_name(path):
    path = Path(path).resolve()
    digest = hashlib.sha1(str(path).encode()).hexdigest()[:6]
    return f'{STAGE_DIR}/{path.stem}_{digest}{path.suffix.lower()}'


def build_props(spec, job, public=PUBLIC, copy=True, probe=probe_ms):
    """The props for DeskReel: spec-only keys dropped, typewriters expanded, every asset copied under
    public/job/deskreel and its src rewritten, inset video lengths probed. Assumes validate() passed."""
    job = Path(job)
    props = {k: json.loads(json.dumps(spec[k])) for k in PROPS_KEYS if k in spec}
    staged = {}

    def stage(src):
        path = resolve(job, src).resolve()
        if path not in staged:
            staged[path] = _public_name(path)
            if copy:
                dest = Path(public) / staged[path]
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, dest)
        return staged[path]

    if copy:
        shutil.rmtree(Path(public) / STAGE_DIR, ignore_errors=True)
    for s in props['stills']:
        for k in STILL_SPEC_KEYS:
            s.pop(k, None)
        s['src'] = stage(s['src'])
    for o in props['overlays']:
        if o['type'] == 'text':
            ap = expand_appear(o)
            if ap:
                o['appear'] = ap
        elif o['type'] == 'inset':
            for s in [o['source'], *(o.get('swaps') or [])]:
                path = resolve(job, s['src'])
                if path.suffix.lower() not in IMAGE_EXT and probe:
                    s['durationMs'] = probe(path)
                s['src'] = stage(s['src'])
        elif o['type'] == 'image':
            o['src'] = stage(o['src'])
    if props.get('music'):
        props['music']['src'] = stage(props['music']['src'])
    for x in props.get('sfx') or []:
        x['src'] = stage(x['src'])
    return props


def load_spec(job, spec_path=None):
    path = Path(spec_path) if spec_path else Path(job) / 'deskreel.json'
    if not path.is_file():
        raise DeskReelError(f'{path} not found: write the DeskReel spec first (see the app.edit_deskreel docstring)')
    return path, json.loads(path.read_text())


def build(job, spec_path=None, out=None, public=None, probe=None):
    """Validate, stage and write <job>/edit_deskreel.props.json. Raises DeskReelError listing every problem.
    public / probe: the Remotion public folder and the video-length probe (tests point them elsewhere)."""
    job = Path(job).resolve()
    path, spec = load_spec(job, spec_path)
    errors, warnings = validate(spec, job)
    if errors:
        raise DeskReelError(f'{path.name}: {len(errors)} problem(s):\n  - ' + '\n  - '.join(errors))
    props = build_props(spec, job, public=public or PUBLIC, probe=probe or probe_ms)
    out = Path(out) if out else job / 'edit_deskreel.props.json'
    out.write_text(json.dumps(props, indent=1, ensure_ascii=False))
    return {'props': str(out), 'durationMs': props['durationMs'], 'stills': len(props['stills']),
            'poses': len(props['poses']), 'shots': len(props['camera']), 'overlays': len(props['overlays']),
            'warnings': warnings}


def render(job, props_path=None, out=None, scale=None):
    """npx remotion render DeskReel, the -14 LUFS master into final.mp4, then final_ig.mp4 and final_social.mp4."""
    from app import audio, exports      # numpy lives in audio; keep this module importable without it
    job = Path(job).resolve()           # Remotion runs from studio/remotion, so every path must be absolute
    props_path = Path(props_path).resolve() if props_path else job / 'edit_deskreel.props.json'
    out = Path(out).resolve() if out else job / 'final.mp4'
    raw = out.with_name(out.stem + '.raw.mp4')
    # --enforce-audio-track: a reel without music or SFX still gets a (silent) audio stream, which app.audio.master
    # and every platform export need
    cmd = ['npx', 'remotion', 'render', 'DeskReel', str(raw), f'--props={props_path}', '--codec=h264', '--crf=18',
           '--enforce-audio-track', '--log=error']
    if scale:
        cmd.append(f'--scale={scale}')
    subprocess.run(cmd, cwd=REMOTION, check=True)
    stats = audio.master(str(raw), str(out))
    raw.unlink(missing_ok=True)
    files = {'final': str(out)}
    if out.name == 'final.mp4':
        files.update(exports.platform_exports(out))
    return {'files': files, 'master': stats['output']}


# ----------------------------------------------------------------------------------------------- alignment

ALIGN_W, ALIGN_H = 180, 320          # analysis size (the 720x1280 frame / 4)
ALIGN_REGION = (0.0, 0.0, 1.0, 0.7)        # compared area (x, y, w, h fractions): above the desk
ALIGN_EXCLUDE = (0.22, 0.16, 0.56, 0.84)   # the presenter's usual box, left out of the first round
ALIGN_LOW_SCORE = 0.6                      # below this NCC peak a fit is flagged (reel #3 stills: good 0.63-0.78, wrong view 0.56-0.58)
ALIGN_MAX_RESIDUAL_PX = 4.0                # above this background residual (frame px) a fit still jumps: flagged
ALIGN_TILES = (4, 6)                       # residual tiles over the compared region (columns, rows)


def decode_gray(path, w=ALIGN_W, h=ALIGN_H):
    """A still as float32 grayscale in the frame's cover geometry (scaled to cover w x h, centre crop)."""
    import numpy as np
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-frames:v', '1', '-vf',
                          f'scale={w}:{h}:force_original_aspect_ratio=increase:flags=area,crop={w}:{h},format=gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.uint8).reshape(h, w).astype(np.float32)


def warp_affine(img, a, t=(0.0, 0.0)):
    """out(p) = img(a @ p + t), coordinates about the image centre (y down), bilinear, 0 outside."""
    import numpy as np
    h, w = img.shape
    cy, cx = (h - 1) / 2, (w - 1) / 2
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float64)
    px, py = xs - cx, ys - cy
    sx = a[0][0] * px + a[0][1] * py + t[0] + cx
    sy = a[1][0] * px + a[1][1] * py + t[1] + cy
    x0, y0 = np.floor(sx).astype(int), np.floor(sy).astype(int)
    fx, fy = sx - x0, sy - y0
    out = np.zeros_like(img, dtype=np.float64)
    for dy, wy in ((0, 1 - fy), (1, fy)):
        for dx, wx in ((0, 1 - fx), (1, fx)):
            xi, yi = x0 + dx, y0 + dy
            ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
            out[ok] += (wx * wy)[ok] * img[yi[ok], xi[ok]]
    valid = (sx >= 0) & (sx <= w - 1) & (sy >= 0) & (sy <= h - 1)
    return out.astype(np.float32), valid


def similarity(scale, rot_deg):
    a = math.radians(rot_deg)
    return [[scale * math.cos(a), -scale * math.sin(a)], [scale * math.sin(a), scale * math.cos(a)]]


def _inverse(m):
    det = m[0][0] * m[1][1] - m[0][1] * m[1][0]
    return [[m[1][1] / det, -m[0][1] / det], [-m[1][0] / det, m[0][0] / det]]


def _box_blur(img, n=5, passes=2):
    import numpy as np
    k = np.ones(n, np.float32) / n
    out = img
    for _ in range(passes):
        out = np.apply_along_axis(lambda r: np.convolve(r, k, 'same'), 1, out)
        out = np.apply_along_axis(lambda c: np.convolve(c, k, 'same'), 0, out)
    return out


def _local_mean(img, n=15):
    """Box mean that stays unbiased at the borders (divided by the box's share inside the image): a zero-padded
    mean darkens every border the same way in both stills and pulls the match towards zero shift."""
    import numpy as np
    return _box_blur(img, n) / np.maximum(_box_blur(np.ones_like(img), n), 1e-6)


def _local_contrast(img):
    """Exposure-independent intensities: minus the local mean, over the local spread."""
    import numpy as np
    img = np.asarray(img, np.float64)
    mean = _local_mean(img)
    spread = np.sqrt(_local_mean((img - mean) ** 2)) + 4.0
    return (img - mean) / spread


def _box_mask(shape, box):
    import numpy as np
    h, w = shape
    m = np.zeros(shape, bool)
    m[round(box[1] * h):round((box[1] + box[3]) * h), round(box[0] * w):round((box[0] + box[2]) * w)] = True
    return m


def ncc_shape(shape, max_shift=(0.3, 0.3)):
    """FFT size for masked_ncc: the image plus the largest shift, rounded up to a multiple of 16."""
    h, w = shape
    return (-(-(h + math.ceil(max_shift[1] * h) + 1) // 16) * 16, -(-(w + math.ceil(max_shift[0] * w) + 1) // 16) * 16)


def masked_ncc(fixed, fixed_mask, moving, moving_mask, max_shift=(0.3, 0.3), min_overlap=0.3, _fixed_fft=None):
    """Masked normalised cross-correlation over every shift (Padfield 2012, by FFT with zero padding): the shift
    d = (dx, dy) with fixed(p) ~ moving(p - d), counting only pixels inside both masks. Returns (d, ncc peak -1..1).
    Unlike phase correlation, a mask on either side never pulls the answer towards zero shift."""
    import numpy as np
    h, w = fixed.shape
    shape = ncc_shape(fixed.shape, max_shift)   # padding only by the largest shift searched: no wrap-around inside it
    fft, ifft = np.fft.rfft2, np.fft.irfft2
    if _fixed_fft is None:
        f = fixed * fixed_mask
        _fixed_fft = (fft(f, shape), fft(f * f, shape), fft(fixed_mask.astype(np.float64), shape))
    F, F2, Mf = _fixed_fft
    m = moving * moving_mask
    M, M2, Mm = fft(m, shape), fft(m * m, shape), fft(moving_mask.astype(np.float64), shape)

    def corr(a, b):
        return ifft(a * np.conj(b), shape)
    overlap = np.maximum(corr(Mf, Mm), 0)
    sum_f, sum_m = corr(F, Mm), corr(Mf, M)
    num = corr(F, M) - sum_f * sum_m / np.maximum(overlap, 1e-6)
    var_f = corr(F2, Mm) - sum_f ** 2 / np.maximum(overlap, 1e-6)
    var_m = corr(Mf, M2) - sum_m ** 2 / np.maximum(overlap, 1e-6)
    ncc = num / np.sqrt(np.maximum(var_f * var_m, 1e-9))
    ys = np.fft.fftfreq(shape[0], 1 / shape[0])[:, None]
    xs = np.fft.fftfreq(shape[1], 1 / shape[1])[None, :]
    ok = ((overlap >= min_overlap * min(fixed_mask.sum(), moving_mask.sum()))
          & (np.abs(ys) <= max_shift[1] * h) & (np.abs(xs) <= max_shift[0] * w))
    ncc = np.where(ok, ncc, -2.0)
    iy, ix = np.unravel_index(int(np.argmax(ncc)), ncc.shape)

    def sub(c0, cm, cp):
        den = cm - 2 * c0 + cp
        return 0.0 if abs(den) < 1e-12 or cm < -1.5 or cp < -1.5 else max(-0.5, min(0.5, 0.5 * (cm - cp) / den))
    hh, ww = shape
    dy = ys[iy, 0] + sub(ncc[iy, ix], ncc[(iy - 1) % hh, ix], ncc[(iy + 1) % hh, ix])
    dx = xs[0, ix] + sub(ncc[iy, ix], ncc[iy, (ix - 1) % ww], ncc[iy, (ix + 1) % ww])
    return (float(dx), float(dy)), float(ncc[iy, ix])


def estimate_fit(ref, mov, region=ALIGN_REGION, exclude=ALIGN_EXCLUDE, scales=None, rots=None, iterations=3, keep=0.6,
                 max_shift=(0.15, 0.15)):
    """The fit F(q) = d + s R(rot) q (about the centre, analysis px) that lays `mov` onto `ref`.

    Only the static background should decide it: the comparison uses local-contrast intensities inside `region`
    minus `exclude` (x, y, w, h fractions; default the presenter's usual box), then `iterations` rounds of
    reweighting keep the `keep` share of pixels that agree best after alignment (the poses differ, the wall does
    not). Each round searches scale x roll (a grid, then halving steps around the best) with masked normalised
    cross-correlation for the shift. Returns {scale, rot, dx, dy, score} in analysis px; score is the NCC peak."""
    import numpy as np
    # local-contrast intensities: exposure-independent and band-limited (a sharp correlation peak); gradient
    # magnitude was tried and is too smooth on soft walls (a flat peak that settles at zero shift)
    ref_n, mov_n = _local_contrast(ref), _local_contrast(mov)
    base = _box_mask(ref.shape, region)
    if exclude:
        base &= ~_box_mask(ref.shape, exclude)
    mask = base.copy()
    base_f = base.astype(np.float32)
    scales = list(scales) if scales is not None else [round(0.90 + 0.02 * i, 3) for i in range(11)]
    rots = list(rots) if rots is not None else [-2.0, -1.0, 0.0, 1.0, 2.0]

    def warp(img, s, r, shift=(0.0, 0.0)):
        a = _inverse(similarity(s, r))
        return warp_affine(img, a, (-(a[0][0] * shift[0] + a[0][1] * shift[1]), -(a[1][0] * shift[0] + a[1][1] * shift[1])))

    best = None
    for it in range(iterations):
        f = ref_n * mask
        fixed_fft = tuple(np.fft.rfft2(x, ncc_shape(ref.shape, max_shift)) for x in (f, f * f, mask.astype(np.float64)))

        def score(s, r):
            # the moving side keeps its own background only: its region minus its presenter box, carried
            # through the same warp (the pose's presenter never stands in for the reference's wall)
            warped, valid = warp(mov_n, s, r)
            mov_mask = (warp(base_f, s, r)[0] > 0.5) & valid
            return masked_ncc(ref_n, mask, warped, mov_mask, max_shift=max_shift, _fixed_fft=fixed_fft)
        if it == 0:
            grid = [(s, r) for s in scales for r in rots]
            s_step = (scales[1] - scales[0]) if len(scales) > 1 else 0.02
            r_step = (rots[1] - rots[0]) if len(rots) > 1 else 1.0
        else:
            s_step, r_step = 0.01, 0.5
            grid = [(best[1] + i * s_step, best[2] + j * r_step) for i in (-1, 0, 1) for j in (-1, 0, 1)]
        best = None
        for s, r in grid:
            dd, sc = score(s, r)
            if best is None or sc > best[0]:
                best = (sc, s, r, dd)
        for _ in range(2):
            s_step, r_step = s_step / 2, r_step / 2
            s0, r0 = best[1], best[2]
            for s in (s0 - s_step, s0, s0 + s_step):
                for r in (r0 - r_step, r0, r0 + r_step):
                    dd, sc = score(s, r)
                    if sc > best[0]:
                        best = (sc, s, r, dd)
        if it + 1 < iterations:   # keep the pixels that agree after this alignment (the static background)
            aligned, valid = warp(mov_n, best[1], best[2], best[3])
            diff = np.abs(_box_blur(ref_n, 5, 1) - _box_blur(aligned, 5, 1))
            inside = base & valid
            if inside.sum() > 100:
                mask = inside & (diff <= np.quantile(diff[inside], keep))
    sc, s, r, (dx, dy) = best
    aligned, valid = warp(mov_n, s, r, (dx, dy))
    residual, tiles = background_residual(ref_n, aligned, base & valid)
    return {'scale': round(s, 4), 'rot': round(r, 3), 'dx': dx, 'dy': dy, 'score': round(sc, 4),
            'residual': None if residual is None else round(residual, 2), 'tiles': tiles}


def background_residual(ref_n, aligned_n, mask, tiles=ALIGN_TILES, min_peak=0.35):
    """What the fit leaves: the compared region cut into tiles, each tile's own shift between the reference and the
    ALIGNED still measured again (masked NCC, local-contrast intensities). A true static plate leaves ~0 in every
    tile; parallax (a lamp, a shelf and a wall at different depths) leaves tiles that disagree. Returns (the
    second-largest tile shift in analysis px, so one tile with an arm in it does not decide, or None when fewer
    than two tiles have texture; [[cx, cy, shift, peak], ...] per measured tile)."""
    import numpy as np
    ys, xs = np.nonzero(mask)
    if len(ys) < 200:
        return None, []
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    cols, rows = tiles
    out = []
    for j in range(rows):
        for i in range(cols):
            ty0, ty1 = y0 + (y1 - y0) * j // rows, y0 + (y1 - y0) * (j + 1) // rows
            tx0, tx1 = x0 + (x1 - x0) * i // cols, x0 + (x1 - x0) * (i + 1) // cols
            m = mask[ty0:ty1, tx0:tx1]
            if m.sum() < 0.4 * m.size or m.size < 300:
                continue
            a, b = ref_n[ty0:ty1, tx0:tx1], aligned_n[ty0:ty1, tx0:tx1]
            if a[m].std() < 0.25:
                continue            # a flat wall: no shift to measure
            (dx, dy), peak = masked_ncc(a, m, b, m, max_shift=(0.25, 0.25), min_overlap=0.5)
            if peak < min_peak:
                continue
            out.append([round(float((tx0 + tx1) / 2), 1), round(float((ty0 + ty1) / 2), 1), round(math.hypot(dx, dy), 2), round(peak, 3)])
    if len(out) < 2:
        return None, out
    shifts = sorted(t[2] for t in out)
    return shifts[-2], out


def compose_fit(outer, inner):
    """outer(inner(q)) for fits {scale, dx, dy, rot} (inner applied first)."""
    o = {'scale': outer.get('scale', 1.0), 'rot': outer.get('rot', 0.0), 'dx': outer.get('dx', 0.0), 'dy': outer.get('dy', 0.0)}
    d = _apply(o, (inner.get('dx', 0.0), inner.get('dy', 0.0)))
    return {'scale': o['scale'] * inner.get('scale', 1.0), 'rot': o['rot'] + inner.get('rot', 0.0), 'dx': d[0], 'dy': d[1]}


def _find_still(spec, job, key):
    for s in spec.get('stills') or []:
        if s.get('id') == key:
            return s
    target = resolve(job, key).resolve()
    for s in spec.get('stills') or []:
        if resolve(job, s['src']).resolve() == target:
            return s
    raise DeskReelError(f'"{key}" is neither a still id nor a still src in the spec')


def cover_safe(fit, still_size, cam=None):
    """The fit with its scale raised (if needed) so the still covers every frame corner under `cam` (default the
    identity camera). An aligned pose that has to shrink would show black edges; this keeps its centre and roll."""
    cam = cam or {'x': 0.0, 'y': 0.0, 'scale': 1.0, 'rot': 0.0}
    fit = dict(fit)
    if uncovered(fit, cam, still_size) <= 0:
        return fit, False
    lo, hi = fit.get('scale', 1.0), max(2.0, fit.get('scale', 1.0) * 2)
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (lo, mid) if uncovered({**fit, 'scale': mid}, cam, still_size) <= 0 else (mid, hi)
    fit['scale'] = hi
    return fit, True


def align(job, ref_key, keys, spec_path=None, region=ALIGN_REGION, write=True, exclude=ALIGN_EXCLUDE, cover=False):
    """Fit every still in keys onto ref_key's background and (write) store the fits in the spec. Returns them.
    A fit may leave frame corners uncovered on its own: the shot's camera scale covers them for every pose at once
    (validate() names the frame), which keeps the poses aligned. cover=True instead raises each fit's scale until
    its still covers the frame alone (cover_safe), at the cost of the alignment."""
    job = Path(job).resolve()
    path, spec = load_spec(job, spec_path)
    ref = _find_still(spec, job, ref_key)
    ref_img = decode_gray(resolve(job, ref['src']))
    k = W / ALIGN_W
    results = {}
    for key in keys:
        still = _find_still(spec, job, key)
        if still is ref:
            continue
        src = resolve(job, still['src'])
        est = estimate_fit(ref_img, decode_gray(src), region, exclude)
        rel = {'scale': est['scale'], 'rot': est['rot'], 'dx': est['dx'] * k, 'dy': est['dy'] * k}
        fit = compose_fit(ref.get('fit') or {}, rel)
        clamped = False
        if cover:
            fit, clamped = cover_safe(fit, image_size(src))
        still['fit'] = {'scale': round(fit['scale'] + (0.0005 if clamped else 0), 4), 'dx': round(fit['dx'], 1),
                        'dy': round(fit['dy'], 1), 'rot': round(fit['rot'], 2)}
        residual = None if est['residual'] is None else round(est['residual'] * k, 1)
        problems = []
        if est['score'] < ALIGN_LOW_SCORE:
            problems.append(f'low match ({est["score"]:.2f}): the backgrounds may not be the same view')
        if residual is None:
            problems.append('no residual: too little background texture to confirm the fit')
        elif residual > ALIGN_MAX_RESIDUAL_PX:
            problems.append(f'residual {residual:.0f} px: parts of the background still move after the fit (parallax, '
                            f'a different viewpoint), so the swap jumps')
        still['align'] = {'ref': ref['id'], 'score': est['score'], 'residualPx': residual, 'ok': not problems}
        results[still['id']] = {**still['fit'], 'score': est['score'], 'residualPx': residual,
                                **({'scale_raised_from': round(rel['scale'], 4)} if clamped else {})}
        if problems:
            results[still['id']]['warning'] = ('; '.join(problems) + ': drop this fit and give the pose its own shot, '
                                               'or hide the swap under a whip')
    if write:
        path.write_text(json.dumps(spec, indent=1, ensure_ascii=False) + '\n')
    return results


# ----------------------------------------------------------------------------------------------- CLI

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build', help='validate the spec, stage its assets, write <job>/edit_deskreel.props.json')
    b.add_argument('job')
    b.add_argument('--spec', help='default <job>/deskreel.json')
    b.add_argument('--out', help='default <job>/edit_deskreel.props.json')
    c = sub.add_parser('check', help='validate the spec only')
    c.add_argument('job')
    c.add_argument('--spec')
    r = sub.add_parser('render', help='render the props, master to -14 LUFS, write final_ig.mp4 and final_social.mp4')
    r.add_argument('job')
    r.add_argument('--props', help='default <job>/edit_deskreel.props.json')
    r.add_argument('--out', help='default <job>/final.mp4 (another name skips the platform exports)')
    r.add_argument('--scale', type=float)
    a = sub.add_parser('align', help='fit stills onto a reference still (writes stills[].fit into the spec)')
    a.add_argument('job')
    a.add_argument('ref', help='reference still: id or src')
    a.add_argument('stills', nargs='+', help='stills to fit: ids or srcs')
    a.add_argument('--spec')
    a.add_argument('--region', default=','.join(str(v) for v in ALIGN_REGION),
                   help='x,y,w,h fractions of the frame compared (default: everything above the desk)')
    a.add_argument('--exclude', default=','.join(str(v) for v in ALIGN_EXCLUDE),
                   help='x,y,w,h fractions left out of the first round (default: the presenter\'s usual box; "" for none)')
    a.add_argument('--dry-run', action='store_true', help='print the fits without writing the spec')
    a.add_argument('--cover', action='store_true',
                   help='raise each fit\'s scale until its still covers the frame alone (breaks the alignment; the '
                        'default leaves that to the shot\'s camera scale, which `check` verifies)')
    args = parser.parse_args(argv)
    try:
        if args.cmd == 'build':
            print(json.dumps(build(args.job, args.spec, args.out), indent=1))
        elif args.cmd == 'check':
            job = Path(args.job).resolve()
            path, spec = load_spec(job, args.spec)
            errors, warnings = validate(spec, job)
            print(json.dumps({'spec': str(path), 'errors': errors, 'warnings': warnings}, indent=1))
            return 1 if errors else 0
        elif args.cmd == 'render':
            print(json.dumps(render(args.job, args.props, args.out, args.scale), indent=1))
        else:
            region = tuple(float(v) for v in args.region.split(','))
            exclude = tuple(float(v) for v in args.exclude.split(',')) if args.exclude else None
            print(json.dumps(align(args.job, args.ref, args.stills, args.spec, region, write=not args.dry_run,
                                   exclude=exclude, cover=args.cover), indent=1))
    except DeskReelError as error:
        print(f'deskreel: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
