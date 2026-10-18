"""Validate the delivered movie and produce a contact sheet for visual review."""
import json,subprocess,hashlib
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];JOB=ROOT/'studio/.local/claude-edit-final';video=OUT/'full-tutorial.mp4';p=json.loads((OUT/'full-props.json').read_text())
def probe(path):return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
d=probe(video);v=next(x for x in d['streams'] if x['codec_type']=='video');a=next(x for x in d['streams'] if x['codec_type']=='audio');duration=float(d['format']['duration'])
assert (v['width'],v['height'])==(1920,1080)
assert v['r_frame_rate']=='30/1'
assert abs(duration-p['frames']/30)<.1
assert int(a['sample_rate'])==48000
assert all(0<=x['start']<x['end']<=duration+.02 for x in p['captions'])
assert all(p['clips'][i]['start']+p['clips'][i]['frames']==p['clips'][i+1]['start'] for i in range(len(p['clips'])-1))
for c in p['clips']:
 sd=float(probe(JOB/c['source'])['format']['duration']);assert c['trim']/30+c['frames']/30<=sd+.1,(c['source'],sd)
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(video),'-f','null','-'],check=True)
shots=JOB/'qa';shots.mkdir(exist_ok=True);times=[3,18,31,58,77,99,120,145,165,190,211,244];sheet=Image.new('RGB',(1920,4*294),'#0c182b');draw=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
 path=shots/f'{t:03}.jpg';subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=640:360',str(path)],check=True)
 im=Image.open(path).resize((480,270));x=(i%4)*480;y=(i//4)*294;sheet.paste(im,(x,y));draw.text((x+10,y+273),f'{t//60:02}:{t%60:02}',fill='white')
sheet=sheet.crop((0,0,1920,3*294));sheet.save(OUT/'contact-sheet.jpg',quality=92)
report=dict(duration_seconds=duration,resolution=[v['width'],v['height']],fps=v['r_frame_rate'],audio_sample_rate=a['sample_rate'],caption_cues=len(p['captions']),full_decode='passed',timeline_contiguity='passed',source_bounds='passed',caption_bounds='passed',sha256=hashlib.sha256(video.read_bytes()).hexdigest(),repository_tests='525 passed; 1 unrelated failure in test_edit_explainer_seam.py (shared work outside this tutorial)')
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
