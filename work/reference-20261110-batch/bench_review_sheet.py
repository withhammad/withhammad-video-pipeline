"""Build a reference/editorial comparison sheet from inspected render framing stills."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2];job=ROOT/'studio/.local/jobs/e25d352a1b20';qa=job/'referral-v4/qa'
times=[0,5.5,10,16,20.5,25,30,35,42,46,50,54,64,66.9]
sheet=Image.new('RGB',(1380,((len(times)+2)//3)*440),'#202125');d=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 x=(i%3)*460;y=(i//3)*440
 source=job/f'analysis/reference-1fps/{int(t)+1:04}.jpg';final=qa/f'reference-{t}.jpg'
 for k,p in enumerate([source,final]):
  im=Image.open(p).convert('RGB');im.thumbnail((216,384));sheet.paste(im,(x+k*228,y+32))
 d.text((x+5,y+5),f'Reference ~{t}s | BENCH mapped frame',fill='white')
 d.text((x+5,y+417),'Source nearest 1fps sample; original audio unchanged',fill='white')
sheet.save(qa/'reference-side-by-side.jpg',quality=95)
print(qa/'reference-side-by-side.jpg')
# Full one-fps comparison uses the decoded final contact sheet, not draft frames.
# ffmpeg fps=1 selects near the middle of each second; label that sample clock explicitly.
import json,math
contact=qa/'contact-sheet.jpg'
if contact.exists():
 p=json.loads((job/'referral-v4/recorded.props.json').read_text());master=Image.open(contact).convert('RGB')
 count=math.floor(p['duration']);tw,th=216,384
 for page in range(math.ceil(count/50)):
  sheet=Image.new('RGB',(1600,2820),'#202125');d=ImageDraw.Draw(sheet)
  for n in range(page*50,min(count,(page+1)*50)):
   t=n+.5;s=next((s for s in p['segments'] if s['start']<=t<s['end']),p['segments'][-1]);r=s['ref'][0]+(t-s['start'])/(s['end']-s['start'])*(s['ref'][1]-s['ref'][0])
   idx=n-page*50;x=idx%5*320;y=idx//5*282
   source=Image.open(job/f'analysis/reference-1fps/{min(67,int(r)+1):04}.jpg').convert('RGB')
   target=master.crop((n%10*tw,n//10*th,n%10*tw+tw,n//10*th+th))
   for k,im in enumerate([source,target]):
    im.thumbnail((150,256));sheet.paste(im,(x+k*160,y+23))
   d.text((x+3,y+5),f'Ref ~{r:.1f}s | Final ~{t:.1f}s',fill='white')
  dest=qa/f'reference-full-{page+1:02}.jpg';sheet.save(dest,quality=95);print(dest)
