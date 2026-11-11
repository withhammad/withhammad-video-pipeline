"""Presenter-free CLONE reference inserts. Run through studio/heavy.sh."""
import json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
JOB=ROOT/'studio/.local/jobs/0e375e205e9d'
OUT=ROOT/'studio/remotion/public/batchnov10/0e375e205e9d'
OUT.mkdir(parents=True,exist_ok=True)
clips=[
 ('creator-projects',9.2,13.5,35,215,480,110),
 ('model',15.35,15.75,120,280,300,230),
 ('topic',16.7,17.8,35,160,470,320),
 ('research',18.3,20.8,20,180,510,220),
 ('structure',21,22.1,65,70,440,410),
 ('skill',32.25,33.0,20,245,500,285),
 ('skill-menu',33.1,34.0,40,45,460,485),
 ('connectors',34.75,35.2,45,160,450,390),
 ('consent',35.82,36.4,130,165,365,370),
 ('study',37.2,43.6,0,90,540,420),
]
manifest=[]
for name,a,b,x,y,w,h in clips:
 out=OUT/f'{name}.mp4'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-i',str(JOB/'source.mp4'),'-t',str(b-a),'-an','-vf',f'crop={w}:{h}:{x}:{y},fps=30,scale=1080:-2:flags=lanczos','-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-movflags','+faststart',str(out)],check=True)
 for suffix,at in [('first',0),('mid',(b-a)/2),('last',b-a-.067)]:
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(at),'-i',str(out),'-frames:v','1',str(OUT/f'{name}-{suffix}.jpg')],check=True)
 manifest.append({'name':name,'path':str(out),'source':str(JOB/'source.mp4'),'sourceURL':'https://www.instagram.com/reel/DfjiRwPOxa3/','creator':'Arshman Khalid','source_seconds':[a,b],'crop_source_px':[x,y,w,h],'audio':'removed','permission_basis':'Owner supplied reference and instructed suitable short inserts (8 Nov); not general ownership/license.','credit':'Source demo · Arshman Khalid','claim_scope':'Creator demonstration; not Hammad test or results.','review':'Edge/midpoint audit required'})
 print(name,flush=True)
manifest.append({'name':'saved-look','path':str(OUT/'saved-look.webp'),'source':'studio/.local/jobs/762cf7fb383a/matching-look/look1-draft-audit.json','avatarState':'8700cc25063b4aa8a8a149ac0f6d94c9','use':'Existing approved static look; labelled Saved avatar look; no new generation'})
(JOB/'analysis/clone-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
