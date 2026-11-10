"""Isolated FABLE source crops. Run with studio/heavy.sh; no generated voice involved."""
import json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
JOB=ROOT/'studio/.local/jobs/c5bc128a0a8d'
OUT=ROOT/'studio/remotion/public/batchnov10/c5bc128a0a8d'
OUT.mkdir(parents=True,exist_ok=True)
# All crops are source-pixel coordinates on the 720x1280 supplied reference.
clips=[
 ('launch',0,1.8,0,0,720,300),
 ('collage',6.1,8.7,0,0,720,1280),
 ('dot',14.2,16,120,680,600,380),
 ('dot-day',19.1,20.7,0,420,720,400),
 ('dot-night',21.1,23,0,440,720,390),
 ('history',26.5,29.7,0,330,720,275),
 ('future',30.5,35.7,0,420,720,390),
 ('pattern-intro',37.8,39.7,0,470,720,140),
 ('pattern',43,46.8,0,360,720,440),
 ('project-a',75.25,75.75,0,0,720,575),
 ('project-b',76,76.6,0,0,720,575),
 ('project-c',77,77.9,0,0,720,575),
 ('cyber-a',85,87.7,0,440,720,400),
 ('cyber-b',88.5,92.7,0,0,720,575),
]
manifest=[]
for name,start,end,x,y,w,h in clips:
 out=OUT/f'{name}.mp4'
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(JOB/'source.mp4'),'-t',str(end-start),'-an','-vf',f'crop={w}:{h}:{x}:{y},fps=30,scale=1080:-2:flags=lanczos','-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709','-movflags','+faststart',str(out)],check=True)
 manifest.append({'name':name,'path':str(out),'source':str(JOB/'source.mp4'),'source_seconds':[start,end],'crop_source_px':[x,y,w,h],'audio':'removed','permission_basis':'Owner-requested short reference demonstration excerpts, credited to Sanjar Nai-Chien and original demo authors. No general license or original-test claim.','usedInComposition':name!='collage','renderMode':'midpoint still' if name=='project-a' else 'video','review':'Known source transition crops corrected; rerun edge review after regeneration. Original collage excluded and project-a midpoint still used.'})
 print(name,flush=True)
(JOB/'analysis/fable-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Prepare source stills for crop QA, cheap and deterministic.
for name,start,end,*_ in clips:
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str((end-start)/2),'-i',str(OUT/f'{name}.mp4'),'-frames:v','1',str(OUT/f'{name}.jpg')],check=True)
