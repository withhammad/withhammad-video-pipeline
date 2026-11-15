"""Parts for the private knitted "Say each one 10 times" reel (FOUR-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/fourknit/prep.py <job dir>

Reads <job>/knit/gen/: scene.png (the knitted window nook, the round window filled with pure green #00FF00), sky1..4.png (the
view through the window at dawn, midday, golden afternoon and evening), beads.png (4 rows x 5 crocheted beads on green),
tassel.png and curtain.png (on green). Keys green the same way as tasbeehknit/prep.py and writes <job>/knit/public/:
room.png (1080x1920, the window cut out), sky{1..4}.jpg (square, the view), parts/bead_{pearl,emerald,amber,sapphire}{0..4}.png,
parts/tassel.png, parts/curtain.png; and src/fourknit/geom.json (the window centre and radii on the 1080x1920 frame).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

job = Path(sys.argv[1])
gen, pub = job / 'knit' / 'gen', job / 'knit' / 'public'
parts = pub / 'parts'
parts.mkdir(parents=True, exist_ok=True)
here = Path(__file__).resolve().parent


def key(img):
    """Chroma-key green to an RGBA float array (soft edge, green spill removed)."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alpha = np.clip(1 - ((g - np.maximum(r, b)) - 30) / 60, 0, 1)
    a[..., 1] = np.minimum(g, np.maximum(r, b) + 12)
    m = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    return np.dstack([a / 255, m])


def save(rgba, path, pad=4):
    m = rgba[..., 3] > 0.08
    ys, xs = np.where(m)
    y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad + 1, max(0, xs.min() - pad), xs.max() + pad + 1
    Image.fromarray((np.clip(rgba[y0:y1, x0:x1], 0, 1) * 255).astype(np.uint8), 'RGBA').save(path)
    return x1 - x0, y1 - y0


def runs(occ, min_len=20, min_gap=8):
    out, start, gap = [], None, 0
    for i, v in enumerate(list(occ) + [False] * (min_gap + 1)):
        if v:
            if start is None: start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                if i - gap + 1 - start >= min_len: out.append((start, i - gap + 1))
                start, gap = None, 0
    return out


def blobs(rgba, n):
    m = rgba[..., 3] > 0.5
    boxes = []
    for y0, y1 in runs(m.sum(1) > 3):
        for x0, x1 in runs(m[y0:y1].sum(0) > 3):
            yy = runs(m[y0:y1, x0:x1].sum(1) > 3)
            boxes.append((slice(y0 + yy[0][0], y0 + yy[-1][1]), slice(x0, x1)))
    boxes.sort(key=lambda q: -(q[0].stop - q[0].start) * (q[1].stop - q[1].start))
    boxes = boxes[:n]
    return sorted(boxes, key=lambda q: (round(q[0].start / 120), q[1].start))


def crop(rgba, s, pad=10):
    y0, y1 = max(0, s[0].start - pad), min(rgba.shape[0], s[0].stop + pad)
    x0, x1 = max(0, s[1].start - pad), min(rgba.shape[1], s[1].stop + pad)
    return rgba[y0:y1, x0:x1].copy()


# --- the room: fill the frame height, centre the window horizontally, cut the window out ------------------------------
sc = Image.open(gen / 'scene.png').convert('RGB')
W, H = sc.size
k = key(sc)
green = k[..., 3] < 0.5
ys, xs = np.where(green)
# the window is the biggest green region; its centre and radius from its area (robust to small leaks at the frame)
cx, cy = xs.mean(), ys.mean()
r_in = float(np.sqrt(green.sum() / np.pi))
s = 1920 / H
ox = 540 - cx * s
assert ox <= 0 and ox + W * s >= 1080, f'window too far off-centre (cx {cx:.0f} of {W})'
big = sc.resize((round(W * s), 1920), Image.LANCZOS)
kb = key(big)
yy, xx = np.mgrid[0:1920, 0:big.size[0]]
d = np.hypot(xx - cx * s, yy - cy * s)
hole = np.clip((d - (r_in * s - 2)) / 3, 0, 1)                 # cut the circle (2 px into the frame), soft 3 px edge
kb[..., 3] = np.minimum(kb[..., 3], hole)
room = kb[:, int(round(-ox)):int(round(-ox)) + 1080]
# the window came out bigger than asked (63 % of the width): move the room down SHIFT px so the dhikr text fits above the
# window; the top SHIFT px (under the Reels header) repeat a plain stretch of cable knit from just under the star band
SHIFT = 80
room = np.concatenate([room[110:110 + SHIFT], room[:1920 - SHIFT]], 0)
Image.fromarray((np.clip(room, 0, 1) * 255).astype(np.uint8), 'RGBA').save(pub / 'room.png')
geom = {'cx': 540.0, 'cy': round(cy * s + SHIFT, 1), 'rIn': round(r_in * s, 1)}
print('window', geom, f'(scene {W}x{H}, centre {cx:.0f},{cy:.0f}, scale {s:.3f}, crop x {-ox:.0f})')

# --- skies: square, centred ------------------------------------------------------------------------------------------
for i in range(1, 5):
    p = gen / f'sky{i}.png'
    if p.exists():
        im = Image.open(p).convert('RGB')
        m = min(im.size)
        im = im.crop(((im.size[0] - m) // 2, (im.size[1] - m) // 2, (im.size[0] + m) // 2, (im.size[1] + m) // 2)).resize((1024, 1024), Image.LANCZOS)
        im.save(pub / f'sky{i}.jpg', quality=93)

# --- beads: rows pearl, emerald, amber, sapphire ---------------------------------------------------------------------
b = key(Image.open(gen / 'beads.png'))
sizes = []
for n, s_ in enumerate(blobs(b, 20)):
    name = ['pearl', 'emerald', 'amber', 'sapphire'][n // 5]
    sizes.append(save(crop(b, s_), parts / f'bead_{name}{n % 5}.png'))
print('beads', sizes)

t = key(Image.open(gen / 'tassel.png'))
print('tassel', save(t, parts / 'tassel.png'))
c = key(Image.open(gen / 'curtain.png'))
print('curtain', save(c, parts / 'curtain.png'))
(here / 'geom.json').write_text(json.dumps(geom) + '\n')
