"""Extract every fourth-second avatar frame for root review. Grants no approval."""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess,json,math
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'studio/.local/jobs/0e375e205e9d/referral-v4';qa=out/'qa';frames=qa/'avatar-4fps';frames.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'avatar.mp4'),'-vf','fps=4,scale=180:320','-q:v','2',str(frames/'frame-%04d.jpg')],check=True)
files=sorted(frames.glob('frame-*.jpg'));sheets=[]
for page in range(math.ceil(len(files)/45)):
 sheet=Image.new('RGB',(1620,1720),'#111');draw=ImageDraw.Draw(sheet)
 for local,p in enumerate(files[page*45:(page+1)*45]):
  idx=page*45+local;x=local%9*180;y=local//9*344;sheet.paste(Image.open(p),(x,y));draw.text((x+5,y+323),f'{idx/4:.2f}s  frame {idx+1}',fill='white')
 file=qa/f'avatar-sheet-{page+1:02d}.jpg';sheet.save(file,quality=95);sheets.append(str(file));print(file,flush=True)
opening=qa/'avatar-opening-4fps.jpg'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(out/'avatar.mp4'),'-t','3','-vf','fps=4,scale=270:480,tile=12x1','-frames:v','1','-q:v','2',str(opening)],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'avatar.mp4')]))
(out/'avatar-filmstrip-manifest.json').write_text(json.dumps({'fps':4,'frames':len(files),'framesPerSheet':45,'sheets':sheets,'opening':str(opening),'probe':probe,'visualReviewPerformed':False,'avatarApproved':False},indent=2)+'\n')
print(opening,flush=True);print('Frames:',len(files))
