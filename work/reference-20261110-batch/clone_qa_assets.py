from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2]
p=root/'studio/remotion/public/batchnov10/0e375e205e9d'
files=sorted(p.glob('*-mid.jpg')); sheet=Image.new('RGB',(1200,len(files)*245),'#151515');d=ImageDraw.Draw(sheet)
for row,f in enumerate(files):
 for col,suffix in enumerate(['first','mid','last']):
  im=Image.open(p/(f.name.replace('-mid',f'-{suffix}')));im.thumbnail((390,210));sheet.paste(im,(col*400,row*245+30));d.text((col*400+5,row*245+7),f'{f.stem.replace("-mid","")} / {suffix}',fill='white')
sheet.save(root/'work/reference-20261110-batch/clone-source-check/crop-edges.jpg')
