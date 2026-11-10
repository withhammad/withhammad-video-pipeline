"""Inspect the five supplied references at one frame per second."""
import json
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
JOBS = ('ee41d72bf8cd', '62eec03e1e93', 'c5bc128a0a8d', '0e375e205e9d', 'e25d352a1b20')
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 18)
for job in JOBS:
    folder = ROOT / 'studio/.local/jobs' / job
    out = folder / 'analysis'
    frames = out / 'reference-1fps'
    frames.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'source.mp4'),'-vf',
                    'fps=1,scale=180:320:force_original_aspect_ratio=decrease,pad=180:320:(ow-iw)/2:(oh-ih)/2',
                    '-q:v','3',str(frames/'%04d.jpg')],check=True)
    files = sorted(frames.glob('*.jpg'))
    for page in range(math.ceil(len(files)/40)):
        block = files[page*40:(page+1)*40]
        sheet = Image.new('RGB',(180*8,346*math.ceil(len(block)/8)), '#151515')
        draw = ImageDraw.Draw(sheet)
        for i,p in enumerate(block):
            x,y = (i%8)*180,(i//8)*346
            sheet.paste(Image.open(p),(x,y))
            draw.text((x+5,y+322),f'{page*40+i:03d}s',font=font,fill='white')
        sheet.save(out/f'reference-sheet-{page+1}.jpg', quality=90)
    print(json.dumps({'job':job,'frames':len(files),'sheets':math.ceil(len(files)/40)}),flush=True)
