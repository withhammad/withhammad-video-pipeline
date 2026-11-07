#!/bin/zsh
# Step 5b exact-copy check: reference vs our cut, 1 frame/s, side by side with second labels -> qa/sidebyside_{1,2}.jpg
set -e; cd "$(dirname "$0")"; rm -rf qa/sbs; mkdir -p qa/sbs
ffmpeg -v error -y -i source.mp4 -vf "fps=1,scale=240:426" qa/sbs/r_%03d.png
ffmpeg -v error -y -i "${1:-final.mp4}" -vf "fps=1,scale=240:426" qa/sbs/o_%03d.png
python3 - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import glob
f = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)
r = sorted(glob.glob('qa/sbs/r_*.png')); o = sorted(glob.glob('qa/sbs/o_*.png')); n = max(len(r), len(o))
pairs = []
for i in range(n):
    p = Image.new('RGB', (490, 456), (0, 0, 0)); d = ImageDraw.Draw(p)
    if i < len(r): p.paste(Image.open(r[i]), (0, 30))
    if i < len(o): p.paste(Image.open(o[i]), (250, 30))
    d.text((4, 4), f'REF {i}s', font=f, fill=(255, 255, 255)); d.text((254, 4), f'OURS {i}s', font=f, fill=(255, 210, 31))
    pairs.append(p)
for k in range(0, n, 32):
    chunk = pairs[k:k + 32]; cols = 8; rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 500, rows * 466), (30, 30, 30))
    for j, p in enumerate(chunk): sheet.paste(p, ((j % cols) * 500, (j // cols) * 466))
    sheet.save(f'qa/sidebyside_{k // 32 + 1}.jpg', quality=85)
print('ref', len(r), 'ours', len(o))
PY
