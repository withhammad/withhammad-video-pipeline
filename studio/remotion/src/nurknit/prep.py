"""Parts for the private knitted "Light upon light" reel (NUR-KNIT, 2D motion graphics only, no Blender). Run after gen.sh:

    studio/.venv/bin/python -I studio/remotion/src/nurknit/prep.py <job dir>

Reads <job>/knit/gen/*.png (GPT Image 2). Writes <job>/knit/public/:
  plates/sky.jpg, niche.jpg, olive.jpg, room.jpg   the knitted plates -> 1080x1920 (LANCZOS, light unsharp mask)
  sprites/<name>.png    the three dolls, the glass lamp, the oil bowl and the lantern, keyed and trimmed through the shared
                        studio/.local/gift-knitted/key.py (pure-green key with despill)
  fonts/                Amiri Quran (the ayah), Fredoka 700 (English), Instrument Serif (labels)
  audio.wav             the reference's own track from ref/ref.mp4, untouched: the full recitation of 24:35 + its reverb tail,
                        no cut, no stretch, no pitch change; only resampled 96 -> 48 kHz (sample-rate conversion, same pitch and
                        speed) and cut at 46.4 s = the last frame (the tail is below -75 dBFS there). Encoding happens in finish.py.
  meta.json             sprite sizes + each doll's hand point (fraction of the sprite), copied next to this file as sprites.json
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
FRAMES = 1392                                    # 46.4 s at 30 fps (the reference: 46.41 s)
meta = {}

for n in ('sky', 'niche', 'olive', 'room'):
    im = Image.open(gen / f'{n}.png').convert('RGB').resize((1080, 1920), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    im.save(pub / 'plates' / f'{n}.jpg', quality=93)

SINGLE = ['doll_a', 'doll_b', 'doll_c', 'lamp', 'bowl', 'lantern']
for f in keyin.glob('*.png'):
    f.unlink()
for n in SINGLE:
    p = gen / f'{n}.png'
    if not p.exists():
        print('missing part', n); continue
    im = Image.open(p)
    if im.mode == 'RGBA' and (np.asarray(im)[..., 3] < 128).mean() > 0.2:
        a = np.asarray(im).copy()
        al = Image.fromarray(a[..., 3]).filter(ImageFilter.GaussianBlur(0.6))
        out = Image.fromarray(a).convert('RGBA'); out.putalpha(al)
        out.crop(al.point(lambda v: 255 if v > 20 else 0).getbbox()).save(keyed / f'{n}.png')
    else:
        im.convert('RGB').save(keyin / f'{n}.png')
subprocess.run([sys.executable, '-I', str(studio / '.local/gift-knitted/key.py'), str(keyin), str(keyed)], check=True)
for n in SINGLE:
    p = keyed / f'{n}.png'
    if not p.exists():
        continue
    im = Image.open(p)
    im.save(pub / 'sprites' / f'{n}.png')
    meta[n] = list(im.size)
    if n.startswith('doll'):
        # the hands: the right-most opaque column between 25 % and 65 % of the height (the doll faces right, arms forward)
        al = np.asarray(im)[..., 3] > 128
        h = al.shape[0]
        band = al[int(h * 0.25):int(h * 0.65)]
        cols = np.where(band.any(axis=0))[0]
        x = int(cols.max())
        rows = np.where(band[:, max(0, x - 25):x + 1].any(axis=1))[0]
        y = int(h * 0.25 + rows.mean())
        meta[n + '_hand'] = [round(x / al.shape[1], 3), round(y / h, 3)]

jobs = studio / '.local/jobs'
for f in (jobs / 'wife-Dfw7YNesQ1h/knit/public/fonts/AmiriQuran.ttf', studio / 'remotion/public/fonts/fredoka-latin-700-normal.woff2',
          studio / 'remotion/public/fonts/instrument-serif-latin-400-italic.woff2', studio / 'remotion/public/fonts/instrument-serif-latin-400-normal.woff2'):
    shutil.copy(f, pub / 'fonts' / f.name)

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'ref' / 'ref.mp4'), '-map', '0:a:0', '-af', 'aresample=48000:filter_size=64:phase_shift=10:cutoff=0.97',
                '-t', str(FRAMES / 30), '-ac', '2', '-c:a', 'pcm_s24le', str(pub / 'audio.wav')], check=True)
json.dump(meta, open(pub / 'meta.json', 'w'), indent=0)
json.dump(meta, open(Path(__file__).resolve().parent / 'sprites.json', 'w'), indent=0)
print('done', meta)
