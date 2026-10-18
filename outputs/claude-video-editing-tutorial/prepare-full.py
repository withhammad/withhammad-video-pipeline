"""Build the full lesson timeline from measured narration and actual recordings."""
import json,re,shutil,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent;JOB=ROOT/'studio/.local/claude-edit-final';PUBLIC=ROOT/'studio/remotion/public/claude-edit'
def srt(p):
 def sec(x):
  h,m,s=x.replace(',','.').split(':');return int(h)*3600+int(m)*60+float(s)
 result=[]
 for b in p.read_text().strip().split('\n\n'):
  lines=b.splitlines();a,z=lines[1].split(' --> ');result.append(dict(start=sec(a),end=sec(z),text=' '.join(lines[2:])))
 return result
speech=json.loads((JOB/'speech.json').read_text());words=[w for w in speech['word_timestamps'] if not w['word'].startswith('<')]
voice=[];line=[]
for w in words:
 line.append(w)
 if len(line)>=8 or (len(line)>=3 and re.search('[।.!?]$',w['word'])):
  voice.append(dict(start=line[0]['start'],end=line[-1]['end'],text=' '.join(x['word'] for x in line)));line=[]
if line:voice.append(dict(start=line[0]['start'],end=line[-1]['end'],text=' '.join(x['word'] for x in line)))
pres=srt(JOB/'presenter.srt')
for index,first,end,second,start in [(15,'دیکھ سکیں۔',25.2,'اب ہمارے پاس',25.51),(29,'سمجھانی بھی چاہیے۔',47.3,'اب',47.916),(35,'ہیں۔',55.58,'آخر میں فائل',56.384)]:
 old=pres[index];pres[index]={**old,'end':end,'text':first};pres.append(dict(start=start,end=old['end'],text=second))
pres.sort(key=lambda x:x['start'])
demo=srt(JOB/'source-avatar.srt');clips=[];captions=[];cursor=0
# Boundaries are at phrase transitions, never accelerated to fit the reference.
def add(kind,source,a,b,title,subtitle='',cards=None,audio=None,audioTrim=0,caps=None):
 global cursor
 n=round((b-a)*30);offset=audioTrim if audio else a
 c=dict(start=cursor,frames=n,source=source,trim=round(a*30),kind=kind,title=title,subtitle=subtitle)
 if cards:c['cards']=cards
 if audio:c.update(audio=audio,audioTrim=round(audioTrim*30))
 clips.append(c)
 for w in caps or []:
  st=max(w['start'],offset);en=min(w['end'],offset+n/30)
  if en>st:captions.append(dict(start=cursor/30+st-offset,end=cursor/30+en-offset,text=w['text']))
 cursor+=n
add('presenter','presenter.mp4',0,25.2,'Claude se video editing','A complete Urdu/Hindi walkthrough with my AI avatar and cloned voice.',['Plan the visuals','Build the edit','Review the actual export'],caps=pres)
add('screen','chatgpt-final.mov',0,44.4,'01 / ChatGPT — plan the visual direction',audio='walkthrough.wav',audioTrim=0,caps=voice)
add('presenter','presenter.mp4',25.2,47.6,'An equivalent editing workflow','The reference’s private skill was unavailable. This lesson uses our own installed editing skill.',['Original source footage','Measured caption timings','An editable Remotion project'],caps=pres)
add('screen','claude-setup.mov',0,30,'02 / Claude — model, skill and source files',audio='walkthrough.wav',audioTrim=44.4,caps=voice)
add('screen','claude-generation.mov',0,19.5,'03 / Submit the editing instructions',audio='walkthrough.wav',audioTrim=74.4,caps=voice)
add('screen','export-review.mov',0,44.55,'04 / Preview, export and check the file',audio='walkthrough.wav',audioTrim=93.9,caps=voice)
add('presenter','presenter.mp4',47.6,56.1,'Watch the completed example','Original Urdu narration with ten timed graphic moments.',caps=pres)
add('demo','claude-output.mp4',0,42.1333333333,'05 / Completed example — full playback',caps=demo)
add('presenter','presenter.mp4',56.1,70.776,'Review before publishing','Check the exported file from beginning to end.',['Voice and readable text','Timing and picture quality','Human review of every claim'],caps=pres)
props=dict(frames=cursor,clips=clips,captions=captions)
(OUT/'full-props.json').write_text(json.dumps(props,ensure_ascii=False,indent=2))
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
(OUT/'full-tutorial.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(captions))+'\n')
(OUT/'chapters.json').write_text(json.dumps([dict(start=c['start']/30,title=c['title']) for c in clips],indent=2))
for name in set(c['source'] for c in clips):
 if not (JOB/name).exists():print('Missing recording:',name)
 else:shutil.copy2(JOB/name,PUBLIC/name)
print('Full lesson:',cursor/30,'seconds;',len(captions),'caption cues')
