"""Parts for the private knitted "Purify your heart" reel (HEART-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/heartknit/prep.py <job dir>

Reads <job>/knit/keyed/heart.png + doily.png (green-keyed with studio/.local/gift-knitted/key.py), <job>/knit/gen/bead.png
(five felted beads on magenta) and <job>/knit/gen/darkwool.png (tangled black wool texture). Writes to <job>/knit/public/parts:
heart.png (the red crocheted heart), dark.png (the same heart, blackened and tangled, pixel-aligned with heart.png so the
dark layer can come off it stitch by stitch), doily.png, bead1..5.png. Writes cells.ts next to this file: the knit-stitch
(chevron) cells of the dark layer and the count (1-100) at which each one comes off, growing from the aorta down with a
ragged front and a few islands that open later, as in the reference.
"""
import heapq
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

job = Path(sys.argv[1])
pub = job / 'knit' / 'public' / 'parts'
pub.mkdir(parents=True, exist_ok=True)
here = Path(__file__).resolve().parent
rng = np.random.default_rng(1447)

# --- red heart + its blackened twin -------------------------------------------------------------------------------
heart = Image.open(job / 'knit' / 'keyed' / 'heart.png').convert('RGBA')
heart.save(pub / 'heart.png')
W, H = heart.size
a = np.asarray(heart).astype(np.float32) / 255
rgb, alpha = a[..., :3], a[..., 3]
lum = rgb @ np.array([0.3, 0.59, 0.11], np.float32)
inside = alpha > 0.5
lo, hi = np.percentile(lum[inside], [2, 98])
l = np.clip((lum - lo) / (hi - lo), 0, 1)
blur = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
detail = lum - blur                                                       # the stitches and vessel ridges
edge = np.clip((alpha - 0.25) / 0.6, 0, 1)                                # keyed edge pixels carry no real colour
l, detail = l * edge, detail * edge

wool = Image.open(job / 'knit' / 'gen' / 'darkwool.png').convert('RGB')
s = max(W / wool.size[0], H / wool.size[1])
wool = wool.resize((round(wool.size[0] * s) + 1, round(wool.size[1] * s) + 1), Image.LANCZOS)
ox, oy = (wool.size[0] - W) // 2, (wool.size[1] - H) // 2
tex = np.asarray(wool.crop((ox, oy, ox + W, oy + H))).astype(np.float32) / 255
tex_l = tex @ np.array([0.3, 0.59, 0.11], np.float32)
tex = (tex - tex_l[..., None]) * 0.5 + tex_l[..., None]                     # half desaturated
dark = tex * (0.48 + 0.95 * l[..., None] ** 1.1) + detail[..., None] * 0.55
dark = dark * np.array([0.96, 0.98, 1.02], np.float32)                     # cool ash
dark = np.clip(dark, 0, 1)
# the dark layer reaches 2 px past the red one, so no red fringe shows round a fully dark heart
a_dark = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))).astype(np.float32) / 255
out = np.dstack([dark, a_dark])
Image.fromarray((out * 255).astype(np.uint8), 'RGBA').save(pub / 'dark.png')

# --- knit-stitch cells and their order ------------------------------------------------------------------------------
CW, CH, CD = 64, 52, 22                     # chevron width, height, V depth (source px)
cols, rows = int(np.ceil(W / CW)), int(np.ceil((H + CD) / CH)) + 1
cells = {}
for j in range(-1, rows):
    for i in range(cols):
        x0, y0 = i * CW, j * CH
        ya, yb = max(0, y0 + CD // 2), min(H, y0 + CH + CD // 2)
        xa, xb = max(0, x0), min(W, x0 + CW)
        if ya >= yb or xa >= xb:
            continue
        cov = a_dark[ya:yb, xa:xb].mean()
        if cov > 0.03:
            cells[(i, j)] = {'i': i, 'j': j, 'x': x0, 'y': y0, 'cov': float(cov)}
keys = list(cells)
NB = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1))
W8 = {(k, n): rng.lognormal(0.0, 1.1) for k in keys for n in NB}            # heavy-tailed: a ragged front with fingers


def grow(seeds):
    dist = {k: np.inf for k in keys}
    pq = []
    for k, d0 in seeds:
        dist[k] = d0; heapq.heappush(pq, (d0, k))
    while pq:
        d, k = heapq.heappop(pq)
        if d > dist[k]:
            continue
        for nb in NB:
            n = (k[0] + nb[0], k[1] + nb[1])
            if n in cells:
                nd = d + W8[(k, nb)] * (1.3 if nb[1] else 1.0) + 0.2
                if nd < dist[n]:
                    dist[n] = nd; heapq.heappush(pq, (nd, n))
    return dist


top = sorted(keys, key=lambda k: k[1])[:3]
d_top = grow([(k, 0.0) for k in top])
dmax = max(d_top.values())
# islands: patches lower down that open early, like the red spots in the reference's coal
seeds = [(k, 0.0) for k in top]
cand = [k for k in keys if cells[k]['cov'] > 0.9 and cells[k]['y'] > H * 0.4]
for q in (0.22, 0.32, 0.42, 0.5, 0.6):
    pool = [k for k in cand if d_top[k] > dmax * (q + 0.25)]
    if pool:
        kk = pool[rng.integers(len(pool))]; seeds.append((kk, dmax * q))
dist = grow(seeds)
order = sorted(keys, key=lambda k: dist[k])
N = len(order)
rows_out = []
for r, k in enumerate(order):
    c = cells[k]
    count = min(100, r * 100 // N + 1)
    rows_out.append([c['x'], c['y'], count])
# stagger within a count, in the order they come off
by = {}
for row in rows_out:
    by.setdefault(row[2], []).append(row)
final = []
for cnt in sorted(by):
    for m, row in enumerate(by[cnt]):
        final.append([row[0], row[1], cnt, round(0.03 + 0.08 * m, 2)])
(here / 'cells.ts').write_text(
    '// Generated by prep.py: knit-stitch cells of the dark layer, [x, y, count, delay s] in heart.png pixels.\n'
    f'export const SRC_W = {W}, SRC_H = {H}, CW = {CW}, CH = {CH}, CD = {CD};\n'
    f'export const CELLS: [number, number, number, number][] = {json.dumps(final, separators=(",", ":"))};\n')
print('cells', N, 'per count', round(N / 100, 2))

# --- doily -----------------------------------------------------------------------------------------------------------
Image.open(job / 'knit' / 'keyed' / 'doily.png').save(pub / 'doily.png')

# --- felted beads off magenta ----------------------------------------------------------------------------------------
b = np.asarray(Image.open(job / 'knit' / 'gen' / 'bead.png').convert('RGB')).astype(np.float32)
mag = np.minimum(b[..., 0], b[..., 2]) - b[..., 1]
ba = np.clip(1 - (mag - 40) / 80, 0, 1)
b[..., 0] = np.minimum(b[..., 0], b[..., 1] + 40); b[..., 2] = np.minimum(b[..., 2], b[..., 1] + 40)   # despill
colmask = (ba > 0.5).any(axis=0)
runs, start = [], None
for x, v in enumerate(list(colmask) + [False]):
    if v and start is None:
        start = x
    if not v and start is not None:
        if x - start > 20:
            runs.append((start, x))
        start = None
img = Image.fromarray(b.astype(np.uint8)).convert('RGBA')
img.putalpha(Image.fromarray((ba * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)))
for n, (x0, x1) in enumerate(runs[:5], 1):
    ys = np.where((ba[:, x0:x1] > 0.5).any(axis=1))[0]
    img.crop((x0 - 3, ys[0] - 3, x1 + 3, ys[-1] + 4)).save(pub / f'bead{n}.png')
print('beads', len(runs))
