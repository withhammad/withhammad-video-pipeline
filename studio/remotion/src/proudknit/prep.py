"""Parts for the private knitted "Don't be proud" reel (PROUD-KNIT, 2D motion graphics only, no Blender). Run after gen.sh:

    studio/.venv/bin/python -I studio/remotion/src/proudknit/prep.py <job dir>

Reads <job>/knit/gen/*.png (GPT Image 2). Writes <job>/knit/public/:
  plates/dusk.jpg, plates/night.jpg   the two knitted plates -> 1080x1920 (LANCZOS, light unsharp mask)
  sprites/<name>.png    the doll poses and the gold props, keyed and trimmed through the shared studio/.local/gift-knitted/key.py
                        (pure-green greenness key with despill); parts that came back already transparent keep their own alpha
  fonts/                Amiri Quran (the Arabic line), Fredoka 700 (the English line), Instrument Serif (the cover)
  audio.wav             the reference's own 44.1 kHz stereo track from ref/ref.mp4, untouched: PCM, same rate, no stretch, no
                        pitch change, padded with silence to the last frame. Encoding happens in finish.py.
  meta.json             sprite sizes (also copied next to this file as sprites.json for the composition)
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
FRAMES = 645                                     # 21.5 s at 30 fps (the reference: 21.50 s, 60 fps)
meta = {}

for n in ('dusk', 'night'):
    im = Image.open(gen / f'{n}.png').convert('RGB').resize((1080, 1920), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    im.save(pub / 'plates' / f'{n}.jpg', quality=93)

SINGLE = ['man_stand', 'man_proud', 'man_admire', 'man_flex', 'man_front', 'child', 'man_reach', 'man_bow', 'man_heart', 'man_kneel',
          'man_sujood', 'coins', 'mirror', 'car', 'mansion', 'city', 'hand']
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
        print('alpha', n)
    else:
        im.convert('RGB').save(keyin / f'{n}.png')
subprocess.run([sys.executable, '-I', str(studio / '.local/gift-knitted/key.py'), str(keyin), str(keyed)], check=True)
for n in SINGLE:
    p = keyed / f'{n}.png'
    if p.exists():
        im = Image.open(p)
        im.save(pub / 'sprites' / f'{n}.png'); meta[n] = list(im.size)

jobs = studio / '.local/jobs'
for f in (jobs / 'wife-Dfw7YNesQ1h/knit/public/fonts/AmiriQuran.ttf', studio / 'remotion/public/fonts/fredoka-latin-700-normal.woff2',
          studio / 'remotion/public/fonts/instrument-serif-latin-400-italic.woff2', studio / 'remotion/public/fonts/instrument-serif-latin-400-normal.woff2'):
    shutil.copy(f, pub / 'fonts' / f.name)

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'ref' / 'ref.mp4'), '-map', '0:a:0', '-af', f'apad=whole_dur={FRAMES / 30}',
                '-t', str(FRAMES / 30), '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
json.dump(meta, open(pub / 'meta.json', 'w'), indent=0)
json.dump(meta, open(Path(__file__).resolve().parent / 'sprites.json', 'w'), indent=0)
print('done', meta)
