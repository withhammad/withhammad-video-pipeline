"""Parts for the private knitted "Ya Hayyu Ya Qayyum" reel (HAYYU-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/hayyuknit/prep.py <job dir>

Reads <job>/knit/gen/{scene,tangle,balls,blooms}.png. The three green-screen parts are keyed by the shared
studio/.local/gift-knitted/key.py (into <job>/knit/keyed), then the sheets are split here into single parts.
Writes <job>/knit/public/: bg.jpg (the knitted still life at 1080x1920: the scene scaled to the frame width and moved down
DY px, with the plain knitted wall carried up to the top so the text sits on calm teal knit), parts/tangle.png,
parts/ball_{saffron,teal,rose}.png, parts/bloom0..5.png, fonts/, and audio.wav: the reference audio (the 44.1 kHz
stereo track of source.mp4, NOT the 16 kHz intake copy) through a peak limiter only, nothing else. The limiter leaves room
for app.audio.master to reach -14 LUFS / -1.5 dBTP with a linear gain.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

job = Path(sys.argv[1])
knit = job / 'knit'
gen, keyin, keyed, pub = knit / 'gen', knit / 'keyin', knit / 'keyed', knit / 'public'
parts = pub / 'parts'
for d in (keyin, keyed, parts, pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
studio = Path(__file__).resolve().parents[3]
DY = 210                                     # the scene sits this far down; must match DY in HayyuKnit.tsx

# --- key the green parts with the shared key.py ----------------------------------------------------------------------
for n in ('tangle', 'balls', 'blooms'):
    shutil.copy(gen / f'{n}.png', keyin / f'{n}.png')
subprocess.run([sys.executable, '-I', str(studio / '.local/gift-knitted/key.py'), str(keyin), str(keyed)], check=True)


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


def split(path, n):
    """Parts on a grid with clear gaps: row bands, then column bands; returned in reading order."""
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im)
    m = a[..., 3] > 128
    boxes = []
    for y0, y1 in runs(m.sum(1) > 3):
        for x0, x1 in runs(m[y0:y1].sum(0) > 3):
            yy = runs(m[y0:y1, x0:x1].sum(1) > 3)
            boxes.append((y0 + yy[0][0], y0 + yy[-1][1], x0, x1))
    boxes.sort(key=lambda b: -(b[1] - b[0]) * (b[3] - b[2]))
    boxes = sorted(boxes[:n], key=lambda b: (round(b[0] / 150), b[2]))
    out = []
    for y0, y1, x0, x1 in boxes:
        p = 6
        out.append(im.crop((max(0, x0 - p), max(0, y0 - p), min(im.width, x1 + p), min(im.height, y1 + p))))
    return out


shutil.copy(keyed / 'tangle.png', parts / 'tangle.png')
for name, im in zip(['saffron', 'teal', 'rose'], split(keyed / 'balls.png', 3)):
    im.save(parts / f'ball_{name}.png'); print('ball', name, im.size)
for k, im in enumerate(split(keyed / 'blooms.png', 6)):
    im.save(parts / f'bloom{k}.png'); print('bloom', k, im.size)

# --- the background --------------------------------------------------------------------------------------------------
sc = Image.open(gen / 'scene.png').convert('RGB')
S = 1080 / sc.width
sc = sc.resize((1080, round(sc.height * S)), Image.LANCZOS)
a = np.asarray(sc).astype(np.float32)
bg = np.zeros((1920, 1080, 3), np.float32)
h = min(1920 - DY, a.shape[0])
bg[DY:DY + h] = a[:h]
# carry the plain wall up: a clean band of wall (below the embroidered stars) fills the top, with a soft vertical blend
band0 = round(230 * S)                      # scene y 230 onward is plain knit
fill = DY + 60
bg[:fill] = a[band0:band0 + fill]
w = np.linspace(0, 1, 60)[:, None, None]
bg[DY:DY + 60] = a[band0 + DY:band0 + DY + 60] * (1 - w) + a[:60] * w
Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).save(pub / 'bg.jpg', quality=94)
print('bg', S, DY)

# --- fonts -----------------------------------------------------------------------------------------------------------
jobs = studio / '.local/jobs'
for f in ('14977f878767/knit/public/fonts/AmiriQuran.ttf', '14977f878767/knit/public/fonts/instrument-serif-latin-400-italic.woff2',
          '54442587c2b2/nasheed/public/fonts/nastaliq-400.woff2', '54442587c2b2/nasheed/public/fonts/nastaliq-700.woff2'):
    shutil.copy(jobs / f, pub / 'fonts' / Path(f).name)

# --- audio: the reference track at 44.1 kHz stereo, peak-limited only ----------------------------------------------------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-af',
                'alimiter=limit=0.7943:attack=5:release=60:level=disabled', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le',
                str(pub / 'audio.wav')], check=True)
print('audio', pub / 'audio.wav')
