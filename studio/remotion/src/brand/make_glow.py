"""Glow-template covers -> job folders + Instagram profile-grid mock.

  python3 src/brand/make_glow.py            (after: node src/brand/render-glow.mjs)

Reads studio/.local/brand-samples/glow/<job>/{cover,wide}.png and writes, per job,
studio/.local/jobs/<job>/cover_glow/cover_1080x1920.jpg, cover_720x1280.jpg, cover_1280x720.jpg
(never touches the job's own cover_1080x1920.jpg). Then studio/.local/brand-samples/glow_grid_mock.png:
every cover at the 3:4 profile-grid crop, 3 columns, newest first (order of glowCovers.ts).
"""
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
STUDIO = HERE.parents[2]
SRC = STUDIO / '.local/brand-samples/glow'
JOBS = STUDIO / '.local/jobs'
order = re.findall(r"\{job: '([^']+)'", (HERE / 'glowCovers.ts').read_text())

for job in order:
    d = JOBS / job / 'cover_glow'
    d.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC / job / 'cover.png').convert('RGB')
    im.save(d / 'cover_1080x1920.jpg', quality=93, optimize=True, progressive=True)
    im.resize((720, 1280), Image.LANCZOS).save(d / 'cover_720x1280.jpg', quality=92, optimize=True, progressive=True)
    Image.open(SRC / job / 'wide.png').convert('RGB').save(d / 'cover_1280x720.jpg', quality=93, optimize=True, progressive=True)
    print('wrote', d)

# Profile grid: 3:4 crop of the 1080x1920 cover = y 240..1680 (tokens.CROPS_9x16.grid3x4).
TW, TH, GAP, TOP = 360, 480, 3, 96
rows = (len(order) + 2) // 3
grid = Image.new('RGB', (3 * TW + 2 * GAP, TOP + rows * (TH + GAP)), (0, 0, 0))
draw = ImageDraw.Draw(grid)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 34)
except OSError:
    font = ImageFont.load_default()
draw.text((24, 28), 'with.hammad  ·  Reels grid (3:4 crop, newest first)', fill=(240, 240, 240), font=font)
for i, job in enumerate(order):
    im = Image.open(SRC / job / 'cover.png').convert('RGB').crop((0, 240, 1080, 1680)).resize((TW, TH), Image.LANCZOS)
    grid.paste(im, ((i % 3) * (TW + GAP), TOP + (i // 3) * (TH + GAP)))
out = STUDIO / '.local/brand-samples/glow_grid_mock.png'
grid.save(out, optimize=True)
print('wrote', out, grid.size)
