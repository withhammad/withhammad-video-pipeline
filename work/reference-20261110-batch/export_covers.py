"""Create platform-sized covers and review crops without mutating source images."""
from pathlib import Path
import json,sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
keyword=sys.argv[1];job={'HIGGS':'ee41d72bf8cd','ADVISOR':'62eec03e1e93','FABLE':'c5bc128a0a8d','CLONE':'0e375e205e9d','BENCH':'e25d352a1b20'}[keyword]
p=ROOT/'studio/.local/jobs'/job/'referral-v4/covers'
portrait=Image.open(p/'cover.png').convert('RGB');wide=Image.open(p/'wide.png').convert('RGB')
spec={'instagram':(portrait,(1080,1920)),'facebook':(portrait,(1080,1920)),'tiktok':(portrait,(1080,1920)),'linkedin':(portrait,(720,1280)),'youtube':(wide,(1280,720)),'x':(wide,(1280,720))}
manifest={}
for name,(im,size) in spec.items():
 im.resize(size,Image.Resampling.LANCZOS).save(p/(name+'.jpg'),quality=95)
 manifest[name]={'file':name+'.jpg','width':size[0],'height':size[1]}
for name,(im,size) in {'cover_1080x1920':(portrait,(1080,1920)),'cover_720x1280':(portrait,(720,1280)),'cover_1280x720':(wide,(1280,720))}.items():im.resize(size,Image.Resampling.LANCZOS).save(p/(name+'.jpg'),quality=95)
crops={'3x4':[0,240,1080,1680],'4x5':[0,260,1080,1610],'1x1':[0,260,1080,1340]}
panels=[('Portrait',portrait),('3:4',portrait.crop(crops['3x4'])),('4:5',portrait.crop(crops['4x5'])),('1:1',portrait.crop(crops['1x1'])),('YouTube / X',wide)]
sheet=Image.new('RGB',(1500,600),'#eee');draw=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(panels):
 thumb=im.copy();thumb.thumbnail((284,550));sheet.paste(thumb,(i*300+8,38));draw.text((i*300+8,10),name,fill='black')
sheet.save(p/'cover_sheet.jpg',quality=95)
(p/'platform-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(p/'crop-recommendations.json').write_text(json.dumps({'note':'Use these crop positions to retain both headline lines and the whole head. Square is intentionally above center.','source':[1080,1920],'crops':crops,'visuallyInspected':False},indent=2)+'\n')
print(p/'cover_sheet.jpg')
