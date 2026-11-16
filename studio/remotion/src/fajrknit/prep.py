"""Parts for the private knitted Fajr "needle and candle" reel (FAJR-KNIT, 2D motion graphics only, no Blender). Run after gen.sh:

    cd studio && .venv/bin/python -I remotion/src/fajrknit/prep.py <job dir>

Reads <job>/knit/gen/*.png (GPT Image 2) and <job>/src/ref.mp4. Writes <job>/knit/public/:
  room.jpg, bedroom.jpg   the two knitted plates, 941x1672 -> 1080x1920 (LANCZOS, light unsharp mask)
  sprites/<n>.png         oldsit, oldsleep, oldpray, candle, plate, phone: keyed with studio/.local/gift-knitted/key.py, trimmed
  fonts/                  Amiri Quran (all Arabic), Fredoka 700, Instrument Serif italic
  audio.wav               the reference's own stereo track, PCM, untouched (no cut, gain, stretch or pitch); level in finish.py
  meta.json               sprite sizes, and the pinch hand of oldsit (leftmost opaque point of the arm, sprite pixels)
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
for d in (green, keyed, pub / 'sprites', pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
studio = Path(__file__).resolve().parents[3]
SPR = ['oldsit', 'oldsleep', 'oldpray', 'candle', 'plate', 'phone']
meta = {}
for n in ('room', 'bedroom'):
    im = Image.open(gen / f'{n}.png').convert('RGB').resize((1080, 1920), Image.LANCZOS)
    im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2)).save(pub / f'{n}.jpg', quality=93)
for n in SPR:
    shutil.copy(gen / f'{n}.png', green / f'{n}.png')
subprocess.run([sys.executable, '-I', str(studio / '.local/gift-knitted/key.py'), str(green), str(keyed)], check=True)
for n in SPR:
    s = Image.open(keyed / f'{n}.png')
    s.save(pub / 'sprites' / f'{n}.png')
    meta[n] = {'w': s.width, 'h': s.height}
al = np.asarray(Image.open(pub / 'sprites/oldsit.png'))[..., 3] > 128
cols = np.where(al.any(axis=0))[0]
x = int(cols[0]) + 25
ys = np.where(al[:, x])[0]
meta['oldsit']['hand'] = {'x': int(cols[0]), 'y': int(ys.mean())}
for f in (studio / '.local/jobs/wife-Dfw7YNesQ1h/knit/public/fonts/AmiriQuran.ttf', studio / 'remotion/public/fonts/fredoka-latin-700-normal.woff2',
          studio / 'remotion/public/fonts/instrument-serif-latin-400-italic.woff2'):
    shutil.copy(f, pub / 'fonts' / f.name)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'src/ref.mp4'), '-map', '0:a:0', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
(pub / 'meta.json').write_text(json.dumps(meta, indent=1))
(Path(__file__).resolve().parent / 'meta.json').write_text(json.dumps(meta, indent=1) + '\n')
print(meta)
