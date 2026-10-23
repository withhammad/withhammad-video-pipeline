import json,subprocess,wave
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2]; O=R/'outputs/coding-comedy-review'; P=R/'studio/remotion/public/review-20261023'; S=R/'studio/remotion/src/review-20261023'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(O/'avatar-source.mp4'),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(O/'voice-source.wav')],check=True)
with wave.open(str(O/'voice-source.wav')) as w: sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)
# Cuts fall in measured silence. Speech is unsped; extra beats are visual reactions.
pads=[(3.2,3.0,'cascade'),(13.2,1.2,'languages'),(21.2,1.3,'database'),(25.6,1.3,'profile'),(31.2,1.8,'error'),(34.8,2.0,'cascade2'),(36.64,2.0,'ending')]
clips=[];chunks=[];src=0;out=0
for end,pad,kind in pads:
 dur=end-src;clips.append({'from':round(out*30),'duration':round(dur*30),'start':src,'end':end,'kind':'take'});chunks.append(a[round(src*sr):round(end*sr)]);out+=dur
 clips.append({'from':round(out*30),'duration':round(pad*30),'start':end,'end':end,'kind':kind});chunks.append(np.zeros(round(pad*sr),np.int16));out+=pad;src=end
full=np.concatenate(chunks)
with wave.open(str(P/'comedy-voice.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(full.tobytes())
def offset(t):return sum(d for cut,d,k in pads if t>=cut)
def time(t):return t+offset(t)
raw=json.loads((O/'transcript.json').read_text());words=[w for s in raw['segments'] for w in s['words']]
# Align first word after a pause to measured audio onset where Whisper bridged the gap.
fix={'24':3.45,'for':None}
for w in words:
 if w['word'].strip()=='24': w['start']=3.45
 if w['start']==8.44:w['start']=9.63
 if w['start']==16.36:w['start']=17.24
 if w['start']==18.42:w['start']=19.45
 if w['start']==23.16:w['start']=23.91
 if w['start']==28.02:w['start']=28.81
# Dialogue-based caption phrases; retain punctuation from the approved script.
lines=[(.12,1.86,'Rename this button'),(.94,1.86,'to Start, please.'),(2.08,2.98,'Already building.'),(3.45,4.58,'Twenty-four files?'),(5.37,6.53,'I asked for one word.'),(7.11,8.63,'I added translation support.'),(9.63,10.33,'For one word?'),(10.58,11.5,'Every button,'),(11.69,12.79,'in thirty languages.'),(13.45,14.79,'This is a one-page demo.'),(15.32,16.42,'You can expand now.'),(17.24,18.68,'And this customer database?'),(19.45,21.0,'It saves their preferred language.'),(21.46,23.29,'Fine. Show me Start.'),(23.91,25.21,"You'll need a profile first."),(25.91,26.65,'A profile,'),(26.99,28.16,'just to read my button?'),(28.81,30.05,'And a verified email.'),(30.57,30.97,'Ah.'),(31.65,33.38,'Nobody connected the mail service.'),(33.78,34.53,"I'll handle that."),(34.93,36.42,'Stop renovating the internet!')]
# The opening is one readable phrase instead of overlapping short fragments.
lines[:2]=[(.0,1.95,'Rename this button to Start, please.')]
captions=[{'startMs':round(time(a)*1000),'endMs':round(time(b)*1000),'text':t} for a,b,t in lines]
(O/'timing.json').write_text(json.dumps({'fps':30,'duration':out,'clips':clips,'captions':captions},indent=2)+'\n')
(S/'comedy-data.json').write_text(json.dumps({'fps':30,'duration':out,'clips':clips,'captions':captions},indent=2)+'\n')
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(O/'captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["startMs"]/1000)} --> {stamp(c["endMs"]/1000)}\n{c["text"]}' for i,c in enumerate(captions))+'\n')
for cut,d,k in pads:
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(min(cut,36.5)),'-i',str(O/'avatar-source.mp4'),'-frames:v','1',str(P/f'{k}-hold.jpg')],check=True)
print('Comedy',out,'seconds;',len(clips),'clips; natural source audio preserved')
