import json,sys,shutil,re
from pathlib import Path
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'studio'))
from app import audio,voice_gates
out=Path(__file__).parent;j=root/'studio/.local/jobs/website20261020';pub=root/'studio/remotion/public/website-transformation'
words=json.loads((j/'captions.json').read_text());phrases=[];group=[]
for w in words:
 text=w['text'].strip()
 if text.lower().strip('.,!?')=='design' and w['startMs']>22000:text='DESIGN'
 group.append({'text':text,'start':w['startMs']/1000,'end':w['endMs']/1000})
 if len(group)>=3 or text.endswith(('.',',','?','!')):
  phrases.append({'start':group[0]['start'],'end':group[-1]['end'],'text':' '.join(x['text'] for x in group),'words':group});group=[]
if group:phrases.append({'start':group[0]['start'],'end':group[-1]['end'],'text':' '.join(x['text'] for x in group),'words':group})
beats=[0];cursor=0
for a in ['Change','Here','First','then','Replace','Finally','This','Comment']:
 i=next(i for i in range(cursor,len(words)) if re.sub('[^a-z]','',words[i]['text'].lower())==a.lower());beats.append(words[i]['startMs']/1000);cursor=i+1
shutil.copy2(j/'avatar_enhanced.mp4',pub/'avatar.mp4');duration=audio.probe_duration(j/'avatar_enhanced.mp4');audio.make_music('glow',duration_s=duration+1,out_wav=j/'music.wav');shutil.copy2(j/'music.wav',pub/'music.wav')
props={'avatar':'website-transformation/avatar.mp4','duration':duration,'captions':phrases,'beats':beats,'draftMode':False,'music':'website-transformation/music.wav'};(out/'render-props.json').write_text(json.dumps(props,indent=2)+'\n')
def stamp(s):
 n=round(s*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
srt='\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(phrases))+'\n'
for p in [out/'captions.srt',j/'captions.srt']:p.write_text(srt)
report=voice_gates.check_job(j);(out/'voice-check.json').write_text(json.dumps(report,indent=2)+'\n')
submission=json.loads((out/'heygen_submission.json').read_text());submission['status']='completed_downloaded';(out/'heygen_submission.json').write_text(json.dumps(submission,indent=2)+'\n')
print(json.dumps({'duration':duration,'beats':beats,'gates':report},indent=2))
