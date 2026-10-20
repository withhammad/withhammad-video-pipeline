import json,sys,re,shutil
from pathlib import Path
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r/'studio'));from app import audio
j=r/'studio/.local/jobs/audit20261020';o=Path(__file__).parent;pub=r/'studio/remotion/public/dashboard-audit'
caps=json.loads((j/'captions.json').read_text())
for w in caps:
 if w['text'].strip().lower()=="it's":w['text']=' its'
(j/'captions.json').write_text(json.dumps(caps,indent=2)+'\n')
beats=[0];cursor=0
for word in ['In','Before','Check','Review','reconcile','Now','This','Comment']:
 idx=next(i for i in range(cursor,len(caps)) if re.sub('[^a-z]','',caps[i]['text'].lower())==word.lower());beats.append(caps[idx]['startMs']/1000);cursor=idx+1
# Shift only visual cuts to a nearby silent audio splice (<=120ms) when possible.
cuts=json.loads((j/'cuts.json').read_text())
cut_times=[c['at_ms']/1000 for c in cuts['cuts']]
for i in range(1,len(beats)):
 near=min(cut_times,key=lambda t:abs(t-beats[i]))
 if abs(near-beats[i])<=.12:beats[i]=near
duration=audio.probe_duration(j/'avatar_enhanced.mp4');shutil.copy2(j/'avatar_enhanced.mp4',pub/'avatar.mp4');audio.make_music('glow',duration_s=duration+.2,out_wav=j/'music.wav');shutil.copy2(j/'music.wav',pub/'music.wav')
props={'avatar':'dashboard-audit/avatar.mp4','duration':duration,'music':'dashboard-audit/music.wav'};(o/'render-props.json').write_text(json.dumps(props,indent=2)+'\n');(r/'studio/remotion/src/dashboard-audit/timing.json').write_text(json.dumps({'beats':beats,'captions':caps,'cuts':cut_times},indent=2)+'\n')
p=r/'studio/remotion/src/dashboard-audit/index.tsx';t=p.read_text().replace("defaultProps={{avatar:'',duration:36,music:''}}",f"defaultProps={{{{avatar:'dashboard-audit/avatar.mp4',duration:{duration},music:'dashboard-audit/music.wav'}}}}");p.write_text(t)
groups=[];g=[]
for w in caps:
 g.append(w)
 if len(g)==3 or w['text'].strip().endswith(('.',',','!','?')):groups.append(g);g=[]
if g:groups.append(g)
def ts(ms):
 n=round(ms);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
srt='\n\n'.join(f'{i+1}\n{ts(g[0]["startMs"])} --> {ts(g[-1]["endMs"])}\n'+ ' '.join(w['text'].strip() for w in g) for i,g in enumerate(groups))+'\n'
for p in [j/'captions.srt',o/'captions.srt']:p.write_text(srt)
sub=json.loads((o/'heygen_submission.json').read_text());sub['status']='completed_downloaded';(o/'heygen_submission.json').write_text(json.dumps(sub,indent=2)+'\n')
print(json.dumps({'duration':duration,'beats':beats}))
