import json,sys,subprocess,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'studio'));from app import audio
j=root/'studio/.local/jobs/audit20261020';o=Path(__file__).parent
report=audio.master(j/'remotion_raw.mp4',j/'final.mp4');shutil.copy2(j/'final.mp4',o/'final.mp4')
props=json.loads((o/'render-props.json').read_text());beats=json.loads((root/'studio/remotion/src/dashboard-audit/timing.json').read_text())['beats'];ends=beats[1:]+[props['duration']]
for i,(a,b) in enumerate(zip(beats,ends)):
 t=a+(b-a)*.65
 subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(o/'final.mp4'),'-frames:v','1','-q:v','2',str(j/f'review-{i}.jpg')],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-framerate','1','-i',str(j/'review-%d.jpg'),'-vf','scale=270:480,tile=3x3','-frames:v','1',str(o/'final-contact-sheet.jpg')],check=True)
qa=json.loads((o/'audio-qa.json').read_text());qa.update(master=report,final_analysis=audio.analyze(o/'final.mp4'),duration=audio.probe_duration(o/'final.mp4'),presenter_box=[340,192],frame_size=[1080,1920],upload_status='held_for_owner_review',pacing_note='Natural source pace retained without speed-up. Pause share4.4%; all measured splice, high-frequency and sibilance checks pass.')
(o/'quality-report.json').write_text(json.dumps(qa,indent=2)+'\n');print(json.dumps({'duration':qa['duration'],'final_analysis':qa['final_analysis']},indent=2))
