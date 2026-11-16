"""Parts for the private knitted "Istighfar x100" reel (ISTIGHFAR-KNIT, 2D motion graphics only, no Blender). Run after gen.sh:

    cd studio && .venv/bin/python -I remotion/src/istighfarknit/prep.py <job dir>

Reads <job>/knit/gen/*.png (GPT Image 2) and <job>/src/ref.mp4 (the reference). Writes <job>/knit/public/:
  plate.jpg            the knitted dawn desert, 941x1672 -> 1080x1920 (LANCZOS, light unsharp mask)
  sprites/<n>.png      man1..man5, free, bowl, front: keyed with studio/.local/gift-knitted/key.py (greenness key, despill), trimmed
  pebbles/p<k>.png     the nine felted "sin" balls, split from the 3x3 sheet, each trimmed square
  bead.png             the felted gold tasbih bead of the earlier Subhan Allah x100 build (job 808c92b7fc32), reused
  fonts/               Amiri Quran (all Arabic), Amiri Bold, Instrument Serif italic, Fredoka (numbers)
  audio.wav            the reference's own stereo track, PCM, untouched (no cut, gain, stretch or pitch); level work in finish.py
  meta.json            sprite sizes and the bowl rim of each carrying pose (sprite pixels): the sins are heaped on that rim
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
gen, green, keyed, pub = knit / 'gen', knit / 'green', knit / 'keyed', knit / 'public'
for d in (green, keyed, pub / 'sprites', pub / 'pebbles', pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
local = Path(__file__).resolve().parents[3] / '.local'
CARRY = ['man1', 'man2', 'man3', 'man4', 'man5']
meta = {}

im = Image.open(gen / 'plate.png').convert('RGB').resize((1080, 1920), Image.LANCZOS)
im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2)).save(pub / 'plate.jpg', quality=93)

for n in CARRY + ['free', 'bowl', 'front']:
    shutil.copy(gen / f'{n}.png', green / f'{n}.png')
subprocess.run([sys.executable, '-I', str(local / 'gift-knitted/key.py'), str(green), str(keyed)], check=True)
for n in CARRY + ['free', 'bowl', 'front']:
    s = Image.open(keyed / f'{n}.png')
    s.save(pub / 'sprites' / f'{n}.png')
    meta[n] = {'w': s.width, 'h': s.height}
    if n in CARRY:
        a = np.asarray(s).astype(int)
        r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
        brown = (al > 200) & (r > 80) & (r < 200) & (r - b > 55) & (r - g > 30) & (g < 120)
        rows = np.where(brown.any(axis=1))[0]
        y0 = int(rows[0])
        band = brown[y0:y0 + int(0.035 * s.width)]
        xs = np.where(band.any(axis=0))[0]
        meta[n]['rim'] = {'x0': int(xs[0]), 'x1': int(xs[-1]), 'y': y0}
    print(n, meta[n])

# the nine felted balls: split the 3x3 sheet on its empty rows and columns
a = np.asarray(Image.open(gen / 'pebbles.png').convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
alpha = np.clip(1 - ((g - np.maximum(r, b)) - 30) / 60, 0, 1)
a[..., 1] = np.minimum(g, np.maximum(r, b) + 12)
solid = alpha > 0.5


def runs(v):
    out, s0 = [], None
    for i, x in enumerate(list(v) + [False]):
        if x and s0 is None: s0 = i
        if not x and s0 is not None:
            if i - s0 > 40: out.append((s0, i))
            s0 = None
    return out


rgba = Image.fromarray(a.astype(np.uint8)).convert('RGBA')
rgba.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)))
k = 0
for y0, y1 in runs(solid.any(axis=1)):
    for x0, x1 in runs(solid[y0:y1].any(axis=0)):
        rgba.crop((x0 - 4, y0 - 4, x1 + 4, y1 + 4)).resize((150, 150), Image.LANCZOS).save(pub / 'pebbles' / f'p{k}.png'); k += 1
assert k == 9, k
meta['pebbles'] = k

shutil.copy(local / 'jobs/808c92b7fc32/knit/public/parts/bead-gold.png', pub / 'bead.png')
for f in ('jobs/wife-Dfw7YNesQ1h/knit/public/fonts/AmiriQuran.ttf', 'jobs/808c92b7fc32/knit/public/fonts/Amiri-Bold.ttf',
          'jobs/808c92b7fc32/knit/public/fonts/instrument-serif-latin-400-italic.woff2',
          'jobs/808c92b7fc32/knit/public/fonts/fredoka-latin-700-normal.woff2'):
    shutil.copy(local / f, pub / 'fonts' / Path(f).name)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'src/ref.mp4'), '-map', '0:a:0', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
(pub / 'meta.json').write_text(json.dumps(meta, indent=1))
(Path(__file__).resolve().parent / 'meta.json').write_text(json.dumps(meta, indent=1) + '\n')
print('ok')
