"""Parts for the private knitted Tasbeeh Fatimah reel (TASBEEH-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/tasbeehknit/prep.py <job dir>

Reads <job>/knit/gen/{scene,beads,orb,gates,blooms}.png (parts on chroma green; keyed here the same way as
studio/.local/gift-knitted/key.py). Writes <job>/knit/public/: bg.jpg (the knitted night scene at 1080x1920) and parts/:
bead_{lav,gold,rose}{0..4}.png, orb_{cream,lav,gold,rose}.png (the crochet counter medallion, tinted per phase),
gate{0,1,2}.png (the three mihrab patches) and bloom{0..5}.png (crochet flowers for the ending).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

job = Path(sys.argv[1])
gen, pub = job / 'knit' / 'gen', job / 'knit' / 'public'
parts = pub / 'parts'
parts.mkdir(parents=True, exist_ok=True)


def key(path):
    """Chroma-key green to an RGBA float array (soft edge, green spill removed)."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
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
    """[start, stop) runs where a 1-D occupancy profile is on, bridging gaps shorter than min_gap."""
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
    """The parts sit on a grid with clear green gaps: split into row bands, then column bands; reading order."""
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


# --- the scene ---------------------------------------------------------------------------------------------------
sc = Image.open(gen / 'scene.png').convert('RGB').resize((1080, 1919), Image.LANCZOS)
bg = Image.new('RGB', (1080, 1920)); bg.paste(sc, (0, 0)); bg.paste(sc.crop((0, 1918, 1080, 1919)), (0, 1919))
bg.save(pub / 'bg.jpg', quality=94)

# --- beads: rows lavender, gold, rose ------------------------------------------------------------------------------
b = key(gen / 'beads.png')
for n, s in enumerate(blobs(b, 15)):
    name = ['lav', 'gold', 'rose'][n // 5]
    print('bead', name, n % 5, save(crop(b, s), parts / f'bead_{name}{n % 5}.png'))

# --- gates ---------------------------------------------------------------------------------------------------------
g = key(gen / 'gates.png')
for n, s in enumerate(blobs(g, 3)):
    print('gate', n, save(crop(g, s), parts / f'gate{n}.png'))

# --- the counter medallion, tinted per phase (multiply on the cream felt, highlights kept) --------------------------
o = key(gen / 'orb.png')
s = blobs(o, 1)[0]
oc = crop(o, s)
save(oc, parts / 'orb_cream.png')
TINT = {'lav': (0.80, 0.74, 1.0), 'gold': (1.0, 0.80, 0.42), 'rose': (1.0, 0.72, 0.80)}
for name, c in TINT.items():
    t = oc.copy()
    lum = t[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32)
    hi = np.clip((lum - 0.86) / 0.14, 0, 1)[..., None]                    # the brightest felt keeps a little white
    t[..., :3] = t[..., :3] * np.array(c, np.float32) * (1 - 0.35 * hi) + t[..., :3] * 0.35 * hi
    print('orb', name, save(t, parts / f'orb_{name}.png'))

# --- crochet flowers ---------------------------------------------------------------------------------------------
if (gen / 'blooms.png').exists():
    f = key(gen / 'blooms.png')
    for n, s in enumerate(blobs(f, 6)):
        print('bloom', n, save(crop(f, s), parts / f'bloom{n}.png'))
