"""Parts for the private knitted Fussilat 41:30 reel (FUSSILAT-KNIT). Run once after the GPT Image 2 parts exist:

    studio/.venv/bin/python -I studio/remotion/src/fussilatknit/prep.py <job dir>

Reads <job>/knit/gen/{scene,heart,flowers,leaves,rainbow}.png (GPT Image 2 through the tagged gen2.sh wrapper).
Writes <job>/knit/public/:
  bg.jpg      the knitted Soq Valley waterfall, a 1:3 panorama (724 x 2172) scaled to 1080 x 3240 for the tilt-up
  bg_raw.jpg  the same scene as undyed wool (cream and grey, dimmer): what the valley is before the colour pours in
  parts/heart.png (the crochet anatomical heart of the reference's "Allah" line), parts/flower0..5.png, parts/leaf0..1.png,
              parts/rainbow.png (a knitted rainbow arch, generated on black and keyed here on darkness, with no despill so the
              green band stays green)
  fonts/      Amiri Quran (plain build, no colour layers), Noto Nastaliq Urdu, Instrument Serif
  audio.wav   the reference audio: the 44.1 kHz stereo track of source.mp4 (NOT the 16 kHz intake copy; it decodes to
              14.096 s once the AAC priming is dropped), through a latency-compensated peak limiter at -2.5 dBFS and a 146 ms gain fade on the
              bed after the voice has ended (13.84 s), padded with 4 ms of silence to the last frame (14.1 s, 423 frames,
              the reference's own length). Nothing else: no re-voicing, no time-stretch, no speed or pitch change, no EQ.
The green parts are keyed by the shared studio/.local/gift-knitted/key.py; the leaves (green yarn) came back on blue and are
keyed here on blueness.
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
parts = pub / 'parts'
for d in (keyin, keyed, parts, pub / 'fonts'):
    d.mkdir(parents=True, exist_ok=True)
studio = Path(__file__).resolve().parents[3]

# --- the scene ---------------------------------------------------------------------------------------------------------
sc = Image.open(gen / 'scene.png').convert('RGB')
W = 1080
H = round(sc.height * W / sc.width)
bg = sc.resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
bg.save(pub / 'bg.jpg', quality=93)
a = np.asarray(bg).astype(np.float32) / 255
lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2])[..., None]
lum = 0.5 + (lum - 0.5) * 0.8                                   # flatter, like one undyed yarn
wool = np.array([0.93, 0.88, 0.80])                             # cream wool
raw = np.clip(lum * wool * 0.78 + 0.04, 0, 1)
Image.fromarray((raw * 255).astype(np.uint8)).save(pub / 'bg_raw.jpg', quality=92)
print('bg', W, H)

# --- green parts through the shared key.py ---------------------------------------------------------------------------------
for n in ('heart', 'flowers'):
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


def split(im, n):
    """Parts on a grid with clear gaps: row bands, then column bands; returned in reading order."""
    m = np.asarray(im)[..., 3] > 128
    boxes = []
    for y0, y1 in runs(m.sum(1) > 3):
        for x0, x1 in runs(m[y0:y1].sum(0) > 3):
            yy = runs(m[y0:y1, x0:x1].sum(1) > 3)
            boxes.append((y0 + yy[0][0], y0 + yy[-1][1], x0, x1))
    boxes.sort(key=lambda b: -(b[1] - b[0]) * (b[3] - b[2]))
    boxes = sorted(boxes[:n], key=lambda b: (round(b[0] / 150), b[2]))
    p = 6
    return [im.crop((max(0, x0 - p), max(0, y0 - p), min(im.width, x1 + p), min(im.height, y1 + p))) for y0, y1, x0, x1 in boxes]


h = Image.open(keyed / 'heart.png'); h.thumbnail((420, 420), Image.LANCZOS); h.save(parts / 'heart.png'); print('heart', h.size)
rbv = np.asarray(Image.open(gen / 'rainbow.png').convert('RGB'))
ra = Image.fromarray((np.clip((rbv.max(axis=2).astype(np.float32) - 18) / 40, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
rb = Image.fromarray(rbv).convert('RGBA'); rb.putalpha(ra); rb = rb.crop(ra.point(lambda v: 255 if v > 20 else 0).getbbox())
rb = rb.resize((1100, round(rb.height * 1100 / rb.width)), Image.LANCZOS); rb.save(parts / 'rainbow.png'); print('rainbow', rb.size)
for k, im in enumerate(split(Image.open(keyed / 'flowers.png').convert('RGBA'), 6)):
    im.thumbnail((200, 200), Image.LANCZOS); im.save(parts / f'flower{k}.png'); print('flower', k, im.size)

# --- the leaves came back on blue: key on blueness -----------------------------------------------------------------------
lv = np.asarray(Image.open(gen / 'leaves.png').convert('RGB')).astype(np.float32)
r, g, b = lv[..., 0], lv[..., 1], lv[..., 2]
blue = b - np.maximum(r, g)
alpha = np.clip(1 - (blue - 30) / 60, 0, 1)
lv[..., 2] = np.minimum(b, np.maximum(r, g) + 12)              # despill
m = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
im = Image.fromarray(lv.astype(np.uint8)).convert('RGBA'); im.putalpha(m)
for k, part in enumerate(split(im, 2)):
    part.save(parts / f'leaf{k}.png'); print('leaf', k, part.size)

# --- fonts -----------------------------------------------------------------------------------------------------------
jobs = studio / '.local/jobs'
for f in ('14977f878767/knit/public/fonts/AmiriQuran.ttf', '14977f878767/knit/public/fonts/instrument-serif-latin-400-italic.woff2',
          '54442587c2b2/nasheed/public/fonts/nastaliq-400.woff2', '54442587c2b2/nasheed/public/fonts/nastaliq-700.woff2'):
    shutil.copy(jobs / f, pub / 'fonts' / Path(f).name)

# --- audio: the reference track at 44.1 kHz stereo, peak-limited, the bed faded after the voice ----------------------------
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-af',
                'alimiter=limit=0.7499:attack=5:release=60:level=disabled:latency=1,afade=t=out:st=13.95:d=0.146,apad=whole_dur=14.1',
                '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
json.dump({'bg': [W, H]}, open(pub / 'meta.json', 'w'))
print('audio', pub / 'audio.wav')
