"""Prepare the GPT Image 2 stills for the Quran Beat "Has harm touched you?" reel (QB-HARM).
  s0*.png  the bedroom with the owner in four poses -> LANCZOS fit to 1296x2304 (1.2x the frame, room for the slow push)
           with a light unsharp mask, colour kept as generated
  h-*.png  the hearts on chroma green -> keyed RGBA PNGs (green-dominance matte, despill), cropped to the heart; the broken
           heart is also split into its two halves (the two largest connected parts of the matte), for the mend
python3 studio/remotion/src/qbharm/prep.py <gen dir> <public dir>"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

gen, pub = Path(sys.argv[1]), Path(sys.argv[2])
(pub / 'shots').mkdir(parents=True, exist_ok=True)
(pub / 'hearts').mkdir(parents=True, exist_ok=True)
for src in sorted(gen.glob('s0*.png')):
    out = pub / 'shots' / f'{src.stem}.jpg'
    im = ImageOps.fit(Image.open(src).convert('RGB'), (1296, 2304), Image.LANCZOS, centering=(0.5, 0.5))
    im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2)).save(out, quality=93)
    print(out)


def key(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    spill = g - np.maximum(r, b)                       # >0 where green dominates
    alpha = np.clip(1 - (spill - 20) / 80, 0, 1)       # full background at spill >= 100
    g2 = np.minimum(g, np.maximum(r, b))               # despill: green never above max(r, b)
    rgba = np.dstack([r, g2, b, alpha * 255]).astype(np.uint8)
    return rgba


def bbox(alpha, pad=24):
    ys, xs = np.where(alpha > 8)
    return max(0, xs.min() - pad), max(0, ys.min() - pad), min(alpha.shape[1], xs.max() + pad), min(alpha.shape[0], ys.max() + pad)


boxes = {}
for name in ('h-broken', 'h-mended'):
    rgba = key(gen / f'{name}.png')
    x0, y0, x1, y1 = bbox(rgba[..., 3])
    boxes[name] = (x0, y0, x1, y1)
    Image.fromarray(rgba[y0:y1, x0:x1]).save(pub / 'hearts' / f'{name}.png')
    print(name, (x1 - x0, y1 - y0))

# the two halves of the broken heart: label the matte, keep the two largest parts, left and right
rgba = key(gen / 'h-broken.png')
x0, y0, x1, y1 = boxes['h-broken']
rgba = rgba[y0:y1, x0:x1]
solid = rgba[..., 3] > 128
from collections import deque  # noqa: E402
lab = np.zeros(solid.shape, np.int32)
sizes, n = {}, 0
for y, x in zip(*np.where(solid)):
    if lab[y, x]:
        continue
    n += 1
    q = deque([(y, x)]); lab[y, x] = n; c = 0
    while q:
        cy, cx = q.popleft(); c += 1
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < solid.shape[0] and 0 <= nx < solid.shape[1] and solid[ny, nx] and not lab[ny, nx]:
                lab[ny, nx] = n; q.append((ny, nx))
    sizes[n] = c
big = sorted(sizes, key=sizes.get, reverse=True)[:2]
assert len(big) == 2 and sizes[big[1]] > 0.3 * sizes[big[0]], f'broken heart is not two halves: {sorted(sizes.values())[-4:]}'
cx = {k: np.where(lab == k)[1].mean() for k in big}
left, right = sorted(big, key=cx.get)
# soft edge: the anti-aliased rim (alpha <= 128) goes to the nearest half, by column against the crack
ys, xs = np.where(lab == left); split = {y: 0 for y in range(solid.shape[0])}
for y, x in zip(ys, xs):
    split[y] = max(split[y], x)
for nm, k in (('h-half-l', left), ('h-half-r', right)):
    m = np.zeros(solid.shape, bool)
    m[lab == k] = True
    rim = (rgba[..., 3] > 0) & ~solid
    cols = np.arange(solid.shape[1])[None, :]
    lim = np.array([split[y] for y in range(solid.shape[0])])[:, None]
    m |= rim & ((cols <= lim + 2) if nm == 'h-half-l' else (cols > lim + 2))
    half = rgba.copy(); half[..., 3] = np.where(m, rgba[..., 3], 0)
    Image.fromarray(half).save(pub / 'hearts' / f'{nm}.png')
    print(nm, 'pixels', int(m.sum()))
print('broken box', rgba.shape[1], rgba.shape[0])
