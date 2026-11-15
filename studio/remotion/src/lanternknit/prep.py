"""Parts for the private knitted "Three lanterns" dhikr reel (LANTERN-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/lanternknit/prep.py <job dir>

Reads <job>/knit/gen/{scene,lanterns,beads,parts,knit}.png (parts on pure #00FF00, keyed here the same way as
studio/.local/gift-knitted/key.py) and <job>/source.mp4 (the reference audio). Writes <job>/knit/public/:
  bg.png        the knitted riad arch at 1080x1920 with the green arch opening keyed out (the sky is drawn in the reel)
  knit.jpg      a grey stockinette relief (high-passed, mid-grey) laid over the drawn sky so it reads as knitted
  parts/lantern{0,1,2}.png  the three crochet fanoos frames (turquoise, coral, saffron trim), hole{k}.png the see-through
                parts inside each frame (white, alpha = hole) for the inner light, win{k}.png the front window only
  parts/bead_{tq,co,go}{0..4}.png  felted temari beads; crescent, tassel, star_big, star_{cr,go,tq}, flower_{co,cr}
  layout.json   sizes, the arch opening box and each lantern's window box (fractions of its frame)
  audio.wav     the reference soundtrack, stereo 48 kHz, untouched
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

job = Path(sys.argv[1])
gen, pub = job / 'knit' / 'gen', job / 'knit' / 'public'
parts = pub / 'parts'
parts.mkdir(parents=True, exist_ok=True)
layout = {}


def key(img):
    """Chroma-key pure green to an RGBA float array (soft edge, green spill removed)."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    alpha = np.clip(1 - ((g - np.maximum(r, b)) - 30) / 60, 0, 1)
    a[..., 1] = np.minimum(g, np.maximum(r, b) + 12)
    m = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    return np.dstack([a / 255, m])


def to_img(rgba):
    return Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA')


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


def blobs(rgba, n, row_h=120):
    """Parts sit on a grid with clear green gaps: row bands, then column bands; the n biggest, in reading order."""
    m = rgba[..., 3] > 0.5
    boxes = []
    for y0, y1 in runs(m.sum(1) > 3):
        for x0, x1 in runs(m[y0:y1].sum(0) > 3):
            yy = runs(m[y0:y1, x0:x1].sum(1) > 3)
            boxes.append((y0 + yy[0][0], y0 + yy[-1][1], x0, x1))
    boxes.sort(key=lambda q: -(q[1] - q[0]) * (q[3] - q[2]))
    return sorted(boxes[:n], key=lambda q: (round(q[0] / row_h), q[2]))


def crop(rgba, box, pad=10):
    y0, y1, x0, x1 = box
    return rgba[max(0, y0 - pad):min(rgba.shape[0], y1 + pad), max(0, x0 - pad):min(rgba.shape[1], x1 + pad)].copy()


def save(rgba, name):
    to_img(rgba).save(parts / f'{name}.png')
    print(f'{name:12} {rgba.shape[1]}x{rgba.shape[0]}')
    return rgba.shape[1], rgba.shape[0]


# --- the scene: scale to 1080 wide (aspect kept), key the arch opening -------------------------------------------------
sc = Image.open(gen / 'scene.png').convert('RGB')
s = 1080 / sc.width
sc = sc.resize((1080, round(sc.height * s)), Image.LANCZOS)
canvas = Image.new('RGB', (1080, 1920))
canvas.paste(sc, (0, 0))
if sc.height < 1920:
    canvas.paste(sc.crop((0, sc.height - 1, 1080, sc.height)).resize((1080, 1920 - sc.height)), (0, sc.height))
bg = key(canvas)
solid = bg[..., 3:] > 0.98                      # the sage tiles keep their own green; only the soft edge is despilled
bg[..., :3] = np.where(solid, np.asarray(canvas).astype(np.float32) / 255, bg[..., :3])
op = bg[..., 3] < 0.5
ys, xs = np.where(op)
layout['opening'] = {'x0': int(xs.min()), 'x1': int(xs.max()) + 1, 'y0': int(ys.min()), 'y1': int(ys.max()) + 1}
to_img(bg).save(pub / 'bg.png', optimize=True)
print('bg 1080x1920, opening', layout['opening'])

# --- knit relief for the sky: luminance high-pass round mid-grey, scaled to ~36 px stitches --------------------------------
k = Image.open(gen / 'knit.png').convert('L')
k = k.resize((round(k.width * 0.83), round(k.height * 0.83)), Image.LANCZOS)
kl = np.asarray(k).astype(np.float32)
hp = kl - np.asarray(k.filter(ImageFilter.GaussianBlur(40))).astype(np.float32)
hp = np.clip(128 + hp * (46 / (hp.std() + 1e-6)), 0, 255).astype(np.uint8)
Image.fromarray(hp).convert('RGB').save(pub / 'knit.jpg', quality=92)
layout['knit'] = {'w': k.width, 'h': k.height}
print('knit', k.size)

# --- lanterns: three frames, their see-through holes and the front window ---------------------------------------------
L = key(Image.open(gen / 'lanterns.png'))
layout['lanterns'] = []
for n, box in enumerate(blobs(L, 3)):
    c = crop(L, box, pad=12)
    h, w = c.shape[:2]
    # transparent pixels not reachable from the border are holes (windows, lace, the crown lattice)
    tr = Image.fromarray(np.where(c[..., 3] < 0.5, 255, 0).astype(np.uint8)).copy()   # copy: floodfill skips a shared numpy buffer
    ImageDraw.floodfill(tr, (0, 0), 100)
    hole = np.asarray(tr) == 255
    # the front window: the hole component that holds the body's centre, found by filling it
    win_img = Image.fromarray(np.where(hole, 255, 0).astype(np.uint8)).copy()
    seeds = [(w // 2, int(h * f)) for f in (0.62, 0.58, 0.66, 0.55, 0.70)]
    seed = next(p for p in seeds if hole[p[1], p[0]])
    ImageDraw.floodfill(win_img, seed, 60)
    win = np.asarray(win_img) == 60
    wy, wx = np.where(win)
    wb = {'x0': wx.min() / w, 'x1': (wx.max() + 1) / w, 'y0': wy.min() / h, 'y1': (wy.max() + 1) / h}
    save(c, f'lantern{n}')
    for name, m, grow in ((f'hole{n}', hole, 3), (f'win{n}', win, 3)):
        mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * grow + 1)).filter(ImageFilter.GaussianBlur(1))
        a = np.asarray(mi).astype(np.float32) / 255
        to_img(np.dstack([np.ones((h, w, 3), np.float32), a])).save(parts / f'{name}.png')
    layout['lanterns'].append({'w': w, 'h': h, 'win': {k2: round(float(v), 4) for k2, v in wb.items()}, 'hole_px': int(hole.sum()),
                               'win_px': int(win.sum())})
    print(f'  window {wb}, holes {hole.sum()} px, window {win.sum()} px')

# --- beads: rows turquoise, coral, saffron-gold -------------------------------------------------------------------------
B = key(Image.open(gen / 'beads.png'))
for n, box in enumerate(blobs(B, 15)):
    save(crop(B, box, pad=4), f'bead_{["tq", "co", "go"][n // 5]}{n % 5}')

# --- crescent, tassel, stars, flowers -----------------------------------------------------------------------------------
P = key(Image.open(gen / 'parts.png'))
names = ['crescent', 'tassel', 'star_big', 'star_cr', 'star_go', 'star_tq', 'flower_co', 'flower_cr']
for name, box in zip(names, blobs(P, 8, row_h=400)):
    save(crop(P, box, pad=6), name)

(pub / 'layout.json').write_text(json.dumps(layout, indent=1) + '\n')

# --- the reference soundtrack (stereo, untouched) -------------------------------------------------------------------------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s24le',
                str(pub / 'audio.wav')], check=True)
print('audio.wav from source.mp4')
