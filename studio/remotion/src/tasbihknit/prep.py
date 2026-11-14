"""Parts for the private knitted "Subhan Allah x100" reel (TASBIH-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/tasbihknit/prep.py <job dir>

Reads <job>/knit/gen: bg.png (plum knitted blanket), beadsA.png (12 felted beads on chroma green), beadsB.png (6 green-family
felted beads on magenta), medallion.png, scroll.png, tassel.png (green screen). Writes <job>/knit/public: bg.jpg (1080x1920),
parts/bead-<colour>.png (one felted bead each, 160 px), parts/medallion.png, scroll.png, tassel.png (keyed with
studio/.local/gift-knitted/key.py, trimmed), fonts/, and audio.wav: the reference audio (source.mp4, stereo) with +3 dB and a limiter only (no cut, no time or
pitch change), so app.audio.master brings the render to -14 LUFS / -1.5 dBTP with a linear gain.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

job = Path(sys.argv[1])
gen, keyed, pub = job / 'knit' / 'gen', job / 'knit' / 'keyed', job / 'knit' / 'public'
parts = pub / 'parts'
for d in (keyed, parts, pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
repo = Path(__file__).resolve().parents[4]

# --- green-screen parts --------------------------------------------------------------------------------------------
green = job / 'knit' / 'green'
green.mkdir(exist_ok=True)
for n in ('medallion', 'scroll', 'tassel'):
    if (gen / f'{n}.png').exists():
        shutil.copy(gen / f'{n}.png', green / f'{n}.png')
subprocess.run([sys.executable, '-I', str(repo / 'studio/.local/gift-knitted/key.py'), str(green), str(keyed)], check=True)
for n in ('medallion', 'scroll', 'tassel'):
    if (keyed / f'{n}.png').exists():
        shutil.copy(keyed / f'{n}.png', parts / f'{n}.png')

# --- felted beads: one PNG per colour ------------------------------------------------------------------------------
NAMES = {'beadsA': ['red', 'orange', 'mustard', 'rose', 'fuchsia', 'violet', 'royal', 'sky', 'cream', 'gold', 'ivory', 'brown'],
         'beadsB': ['emerald', 'lime', 'teal', 'turquoise', 'mint', 'olive']}
for sheet, names in NAMES.items():
    a = np.asarray(Image.open(gen / f'{sheet}.png').convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if sheet == 'beadsA':                                   # chroma green
        key = g - np.maximum(r, b); a[..., 1] = np.minimum(g, np.maximum(r, b) + 14)
    else:                                                   # magenta
        key = np.minimum(r, b) - g; a[..., 0] = np.minimum(r, g + 40); a[..., 2] = np.minimum(b, g + 40)
    alpha = np.clip(1 - (key - 30) / 60, 0, 1)
    solid = alpha > 0.5
    # beads sit on a regular grid: split by empty rows and columns
    def runs(v):
        out, s = [], None
        for i, x in enumerate(list(v) + [False]):
            if x and s is None: s = i
            if not x and s is not None:
                if i - s > 30: out.append((s, i))
                s = None
        return out
    rows = runs(solid.any(axis=1))
    k = 0
    for y0, y1 in rows:
        for x0, x1 in runs(solid[y0:y1].any(axis=0)):
            ys = np.where(solid[y0:y1, x0:x1].any(axis=1))[0]
            box = (x0 - 4, y0 + ys[0] - 4, x1 + 4, y0 + ys[-1] + 5)
            img = Image.fromarray(a.astype(np.uint8)).convert('RGBA')
            img.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0)))
            img.crop(box).resize((160, 160), Image.LANCZOS).save(parts / f'bead-{names[k]}.png')
            k += 1
    print(sheet, 'beads', k)

# --- background ----------------------------------------------------------------------------------------------------
bg = Image.open(gen / 'bg.png').convert('RGB')
s = max(1080 / bg.size[0], 1920 / bg.size[1])
bg = bg.resize((round(bg.size[0] * s), round(bg.size[1] * s)), Image.LANCZOS)
ox, oy = (bg.size[0] - 1080) // 2, (bg.size[1] - 1920) // 2
bg.crop((ox, oy, ox + 1080, oy + 1920)).save(pub / 'bg.jpg', quality=93)

# --- fonts ---------------------------------------------------------------------------------------------------------
fonts = repo / 'studio/remotion/public/fonts'
for f in ('Amiri-Bold.ttf', 'instrument-serif-latin-400-italic.woff2', 'fredoka-latin-700-normal.woff2'):
    shutil.copy(fonts / f, pub / 'fonts' / f)

# --- audio: the reference exactly, gain + limiter only ------------------------------------------------------------
# from source.mp4 (44.1 kHz stereo): the intake's audio.m4a is a 16 kHz mono copy made for transcription
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-af',
                'volume=3dB,alimiter=limit=0.65:attack=5:release=80:level=false', '-ar', '48000', '-c:a', 'pcm_s24le',
                str(pub / 'audio.wav')], check=True)
print('done')
