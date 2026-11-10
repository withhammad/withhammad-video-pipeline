"""Prepare credited, presenter-free reference inserts for the first two edits."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT/'studio/remotion/public/batchnov10'
CLIPS = {
 'ee41d72bf8cd': [
  ('launch',0,2.6,540,300,0,120), ('model-list',3,5.1,540,390,0,0),
  ('prompt',12.4,13.9,516,364,24,246), ('flight',14,14.85,540,720,0,0),
  ('settings',17.1,20.8,540,420,0,0), ('blueprint',22.1,23,540,740,0,0),
  ('aircraft',23,25.7,540,450,0,130), ('meadow',30.2,31.65,540,720,0,0)
 ],
 '62eec03e1e93': [
  ('collage',0,5.6,470,204,36,240), ('comparison-a',5.9,7.9,480,620,30,20),
  ('comparison-b',8,9.6,480,620,30,20), ('usage',13.2,14.6,436,338,52,114),
  ('model',19.2,22.7,420,334,60,116), ('advisor',23.8,25.3,420,334,60,116),
  ('comparison-c',26,29.7,480,650,30,20), ('costs',30.1,34.8,436,338,52,114),
  ('advising',36.1,38.7,420,334,60,116), ('result',39.2,40,430,280,55,50)
 ]
}
for job,clips in CLIPS.items():
    folder=ROOT/'studio/.local/jobs'/job
    target=PUBLIC/job
    target.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for name,a,b,w,h,x,y in clips:
        out=target/(name+'.mp4')
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(a),'-i',str(folder/'source.mp4'),
                        '-t',str(b-a),'-an','-vf',f'crop={w}:{h}:{x}:{y},fps=30,scale=1080:-2:flags=lanczos',
                        '-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p',
                        '-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709',
                        '-movflags','+faststart',str(out)],check=True)
        manifest.append({'name':name,'path':str(out),'source':str(folder/'source.mp4'),
                         'source_seconds':[a,b],'crop_source_px':[x,y,w,h],
                         'audio':'removed','use':'Owner-requested reference demonstration excerpt; attribution in copy; final face-contamination check required.',
                         'permission_basis':'Owner supplied reference and specifically instructed cutting usable inserts into the edit on 8 Nov. Not a claim of third-party ownership or a general license.'})
    (folder/'analysis/assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(job,len(clips),'inserts prepared',flush=True)
