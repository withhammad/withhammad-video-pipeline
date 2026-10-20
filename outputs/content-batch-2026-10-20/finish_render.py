"""Master a completed Remotion render and create local review artifacts; never upload."""
import json
import shutil
import subprocess
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'studio'))
from app import audio
kind=sys.argv[1]
job,folder=('c9d9bd2b786c','ai-engineering-projects-reel') if kind=='projects' else ('7123480a28ca','claude-job-search-reel')
j=root/'studio/.local/jobs'/job;o=root/'outputs'/folder
report=audio.master(j/'remotion_raw.mp4',j/'final.mp4')
shutil.copy2(j/'final.mp4',o/'final.mp4')
props=json.loads((o/'render-props.json').read_text())
starts=props['beats'];ends=starts[1:]+[props['duration']]
frames=[]
for i,(start,end) in enumerate(zip(starts,ends)):
 t=min(end-0.1,start+max(0.4,(end-start)*0.6))
 p=j/f'review-{i}.jpg'
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(j/'final.mp4'),'-frames:v','1','-q:v','2',str(p)],check=True)
 frames.append(str(p))
subprocess.run(['ffmpeg','-y','-v','error','-framerate','1','-i',str(j/'review-%d.jpg'),'-vf',f'scale=270:480,tile=3x{(len(frames)+2)//3}', '-frames:v','1',str(o/'final-contact-sheet.jpg')],check=True)
qa=json.loads((j/'audio-qa.json').read_text());qa.update(master=report,final_analysis=audio.analyze(o/'final.mp4'),selected_avatar_id='5dfa03f53ae54f919040a26a953b7f4b',frame_size=[1080,1920],presenter_frame=[360,203],upload_status='held_for_owner_review')
(o/'quality-report.json').write_text(json.dumps(qa,indent=2)+'\n')
print(json.dumps({'final':str(o/'final.mp4'),'duration':audio.probe_duration(o/'final.mp4'),'audio':qa['final_analysis']},indent=2))
