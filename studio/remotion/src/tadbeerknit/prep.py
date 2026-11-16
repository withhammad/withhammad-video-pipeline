"""Parts for the private knitted "Tadbeer" reel (TADBEER-KNIT, 2D motion graphics only, no Blender). Run after gen.sh (GPT Image 2):

    studio/.venv/bin/python -I studio/remotion/src/tadbeerknit/prep.py <job dir>

Reads <job>/knit/gen/*.png. Writes <job>/knit/public/:
  plates/<scene>.jpg    farm, living, livingafter, garage, kitchen, kitchenafter, street: 941x1672 GPT plates -> 1080x1920 (LANCZOS,
                        light unsharp mask)
  sprites/<name>.png    every character pose and prop, keyed and trimmed: green-screen parts through the shared
                        studio/.local/gift-knitted/key.py (pure-green greenness key with despill), parts that came back already
                        transparent keep their own alpha; the prop sheets are split into single props in reading order
  boyclose.jpg          the close-up plate of the last shot
  fonts/                Amiri Regular and Bold (the label and the caption line; no Quran text is drawn) and Instrument Serif
  audio.wav             the reference's own 44.1 kHz stereo track from ref/ref.mp4 (not the 16 kHz intake copy), untouched:
                        PCM, padded with silence to the last frame. Gain, limiter and master happen in finish.py.
  meta.json             sprite sizes
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

job = Path(sys.argv[1])
knit = job / 'knit'
gen, keyin, keyed, pub = knit / 'gen', knit / 'keyin', knit / 'keyed', knit / 'public'
for d in (keyin, keyed, pub / 'plates', pub / 'sprites', pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
studio = Path(__file__).resolve().parents[3]
FRAMES = 855                                     # 28.5 s at 30 fps
meta = {}

# --- plates ------------------------------------------------------------------------------------------------------------
for n in ('farm', 'living', 'livingafter', 'garage', 'kitchen', 'kitchenafter', 'street', 'boyclose'):
    p = gen / f'{n}.png'
    if not p.exists():
        print('missing plate', n); continue
    im = Image.open(p).convert('RGB').resize((1080, 1920), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    im.save(pub / ('plates' if n != 'boyclose' else '.') / f'{n}.jpg', quality=93)
    print('plate', n)

# --- sprites -----------------------------------------------------------------------------------------------------------
SINGLE = ['bale', 'fan', 'car', 'beams', 'boy1b'] + [f'{c}{k}' for c in ('farmer', 'man', 'mech', 'woman', 'boy') for k in (1, 2, 3, 4)]
SHEETS = {'props': ['glass', 'radio', 'spanner', 'keys'], 'stands': ['standL', 'standR']}
for f in keyin.glob('*.png'):
    f.unlink()
for n in SINGLE + list(SHEETS):
    p = gen / f'{n}.png'
    if not p.exists():
        print('missing part', n); continue
    im = Image.open(p)
    if im.mode == 'RGBA' and (np.asarray(im)[..., 3] < 128).mean() > 0.2:      # came back transparent: keep its alpha
        a = np.asarray(im).copy()
        al = Image.fromarray(a[..., 3]).filter(ImageFilter.GaussianBlur(0.6))
        out = Image.fromarray(a).convert('RGBA'); out.putalpha(al)
        out.crop(al.point(lambda v: 255 if v > 20 else 0).getbbox()).save(keyed / f'{n}.png')
        print('alpha', n)
    else:
        im.convert('RGB').save(keyin / f'{n}.png')
subprocess.run([sys.executable, '-I', str(studio / '.local/gift-knitted/key.py'), str(keyin), str(keyed)], check=True)


def runs(occ, min_len=20, min_gap=10):
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


def split_cols(im, n):
    m = np.asarray(im)[..., 3] > 100
    cols = runs(m.sum(0) > 2)
    cols = sorted(sorted(cols, key=lambda c: -(c[1] - c[0]))[:n])
    parts = []
    for x0, x1 in cols:
        sub = m[:, x0:x1]
        ys = np.where(sub.sum(1) > 0)[0]
        parts.append(im.crop((max(0, x0 - 4), max(0, ys[0] - 4), min(im.width, x1 + 4), min(im.height, ys[-1] + 5))))
    return parts


def split_cc(im, n, k=4):
    """the n largest connected parts (on a 1/k grid, slightly dilated), left to right, each cut out with only its own pixels"""
    a = np.asarray(im)
    m = a[..., 3] > 60
    h, w = m.shape
    g = m[:h - h % k, :w - w % k].reshape(h // k, k, w // k, k).any(axis=(1, 3))
    gd = g.copy()
    gd[1:] |= g[:-1]; gd[:-1] |= g[1:]; gd[:, 1:] |= g[:, :-1]; gd[:, :-1] |= g[:, 1:]
    lab = np.zeros(gd.shape, np.int32)
    sizes = []
    for y0, x0 in zip(*np.nonzero(gd)):
        if lab[y0, x0]:
            continue
        sizes.append(0)
        L = len(sizes)
        stack = [(y0, x0)]
        lab[y0, x0] = L
        while stack:
            y, x = stack.pop()
            sizes[-1] += 1
            for yy, xx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= yy < gd.shape[0] and 0 <= xx < gd.shape[1] and gd[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = L
                    stack.append((yy, xx))
    keep = sorted(range(1, len(sizes) + 1), key=lambda L: -sizes[L - 1])[:n]
    full = np.zeros((h, w), np.int32)
    full[:h - h % k, :w - w % k] = np.repeat(np.repeat(lab, k, 0), k, 1)
    out = []
    for L in keep:
        mm = (full == L) & (a[..., 3] > 0)
        ys, xs = np.nonzero(mm)
        b = a.copy()
        b[..., 3] = np.where(mm, a[..., 3], 0)
        crop = Image.fromarray(b).crop((max(0, xs.min() - 4), max(0, ys.min() - 4), min(w, xs.max() + 5), min(h, ys.max() + 5)))
        out.append((xs.mean(), crop))
    return [c for _, c in sorted(out, key=lambda t: t[0])]


for sheet, names in SHEETS.items():
    p = keyed / f'{sheet}.png'
    if not p.exists():
        continue
    parts = split_cc(Image.open(p).convert('RGBA'), len(names))
    assert len(parts) == len(names), (sheet, len(parts))
    for nm, part in zip(names, parts):
        part.save(pub / 'sprites' / f'{nm}.png'); meta[nm] = part.size; print('split', nm, part.size)
for n in SINGLE:
    p = keyed / f'{n}.png'
    if p.exists():
        im = Image.open(p)
        im.save(pub / 'sprites' / f'{n}.png'); meta[n] = im.size

# --- fonts -------------------------------------------------------------------------------------------------------------
jobs = studio / '.local/jobs'
for f in ('14977f878767/knit/public/fonts/instrument-serif-latin-400-italic.woff2', '14977f878767/knit/public/fonts/Amiri-Bold.ttf',
          '62eec03e1e93/referral-v4/render-public/fonts/Amiri-Regular.ttf'):
    shutil.copy(jobs / f, pub / 'fonts' / Path(f).name)

# --- audio: the reference's own stereo track, untouched (PCM), padded to the last frame -------------------------------------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'ref' / 'ref.mp4'), '-map', '0:a:0', '-af', f'apad=whole_dur={FRAMES / 30}',
                '-t', str(FRAMES / 30), '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
json.dump(meta, open(pub / 'meta.json', 'w'), indent=0)
json.dump(meta, open(Path(__file__).resolve().parent / 'sprites.json', 'w'), indent=0)
print('done', len(meta), 'sprites')
