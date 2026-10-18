"""Build accurate-script subtitles aligned to generated audio word timestamps."""
from pathlib import Path
import json,re,difflib,subprocess,sys
P=Path(__file__).resolve().parent;J=P.parents[1]/'studio/.local/freelance-engineering-final'
INTRO='फ्रीलांस इंजीनियरिंग में काम ढूँढने से पहले, यह समझिए कि क्लाइंट खरीद क्या रहा है। कभी उसे अपनी टीम के लिए एक इंजीनियर चाहिए, और कभी किसी साफ़ समस्या का पूरा समाधान। मैं हम्माद हूँ। इस वीडियो में हम कॉन्ट्रैक्ट, छोटे प्रोजेक्ट और मेंटेनेंस के इन अलग रास्तों को समझेंगे।'
if not (J/'intro-asr.json').exists():
 import numpy as np
 from faster_whisper import WhisperModel
 model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=3)
 a=np.frombuffer(subprocess.check_output(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-v','error','-i',str(J/'intro.mp4'),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
 ss,_=model.transcribe(a,language='hi',word_timestamps=True,beam_size=3,condition_on_previous_text=False)
 words=[{'word':w.word,'start':w.start,'end':w.end} for s in ss for w in s.words]
 (J/'intro-asr.json').write_text(json.dumps(words,ensure_ascii=False,indent=2))
 if '--intro-only' in sys.argv:print('Intro timestamps ready');sys.exit()
if '--intro-only' in sys.argv:print('Intro timestamps ready');sys.exit()
def norm(t):return re.sub(r'[^\w]','',t)
def align(text,words,duration):
 wanted=text.split();heard=[w for w in words if norm(w['word'])];assert heard
 mapping={};sm=difflib.SequenceMatcher(None,[norm(w) for w in wanted],[norm(w['word']) for w in heard],autojunk=False)
 for tag,a,b,c,d in sm.get_opcodes():
  if tag=='equal':
   for i,k in zip(range(a,b),range(c,d)):mapping[i]=(heard[k]['start'],heard[k]['end'])
  elif tag in ['replace','delete']:
   st=heard[c]['start'] if c<len(heard) else heard[-1]['end'];end=heard[d-1]['end'] if d>c else (heard[c]['start'] if c<len(heard) else duration)
   if end<=st:end=min(duration,st+.12*(b-a))
   for i in range(a,b):mapping[i]=(st+(end-st)*(i-a)/(b-a),st+(end-st)*(i-a+1)/(b-a))
 return [{'word':w,'start':mapping[i][0],'end':mapping[i][1]} for i,w in enumerate(wanted)]
cues=[]
def add(text,words,duration,offset):
 aligned=align(text,words,duration);group=[]
 for w in aligned:
  if group and (len(group)>=7 or len(' '.join(x['word'] for x in group)+w['word'])>65):
   cues.append({'start':offset+group[0]['start'],'end':offset+group[-1]['end'],'text':' '.join(x['word'] for x in group)});group=[]
  group.append(w)
 if group:cues.append({'start':offset+group[0]['start'],'end':offset+group[-1]['end'],'text':' '.join(x['word'] for x in group)})
add(INTRO,json.loads((J/'intro-asr.json').read_text()),18.24,0)
offset=18.24
for chapter in ['01-two-models','02-enterprise-and-buyers']:
 d=json.loads((J/(chapter+'.json')).read_text());words=[w for w in d['word_timestamps'] if w['word'] not in ['<start>','<end>']]
 add((P/'scripts'/f'{chapter}.txt').read_text(),words,d['duration'],offset);offset+=d['duration']
for c in json.loads((J/'local-speech/manifest.json').read_text()):
 d=json.loads((J/'local-speech'/f"{c['key']}.json").read_text());a=json.loads((J/'local-speech'/f"{c['key']}.asr.json").read_text());words=[w for s in a['segments'] for w in s['words']]
 add(c['text'],words,d['duration'],offset);offset+=d['duration']
cues.sort(key=lambda x:x['start'])
for i,c in enumerate(cues):
 c['end']=max(c['start']+.08,min(c['end']+.10,cues[i+1]['start']-.015 if i+1<len(cues) else offset))
def stamp(t,ass=False):
 t=max(0,t);h=int(t//3600);m=int(t%3600//60);s=t%60
 return f'{h}:{m:02d}:{s:05.2f}' if ass else f'{h:02d}:{m:02d}:{int(s):02d},{int((s-int(s))*1000):03d}'
(P/'full-video.srt').write_text('\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for i,c in enumerate(cues)))
header='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Kohinoor Devanagari,46,&H00FFFFFF,&H00FFFFFF,&H001B1008,&H801B1008,0,0,0,0,100,100,0,0,3,7,0,2,140,140,190,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
(P/'full-video.ass').write_text(header+'\n'.join(f"Dialogue: 0,{stamp(c['start'],True)},{stamp(c['end'],True)},Default,,0,0,0,,{c['text']}" for c in cues)+'\n')
(J/'caption-timing.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2)+'\n')
print(len(cues),'caption cues;',round(offset,2),'seconds')
