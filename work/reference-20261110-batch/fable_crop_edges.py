from PIL import Image,ImageDraw
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parents[2]; manifest=json.loads((root/'studio/.local/jobs/c5bc128a0a8d/analysis/fable-assets.json').read_text());manifest=[x for x in manifest if x.get('usedInComposition',True)];out=root/'work/reference-20261110-batch/fable-crop-edges';out.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1050,len(manifest)*230),'#222');d=ImageDraw.Draw(sheet)
for i,item in enumerate(manifest):
 length=item['source_seconds'][1]-item['source_seconds'][0]
 for k,t in enumerate([.08,length/2,length-.08]):
  f=out/f'{item["name"]}-{k}.jpg'
  if item.get('renderMode')=='midpoint still':
   Image.open(Path(item['path']).with_suffix('.jpg')).save(f)
  else: subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',item['path'],'-frames:v','1',str(f)],check=True)
  im=Image.open(f);im.thumbnail((340,190));sheet.paste(im,(k*350,i*230));d.text((k*350+8,i*230+198),f'{item["name"]} {t:.2f}s',fill='white')
sheet.save(out/'edges.jpg')
