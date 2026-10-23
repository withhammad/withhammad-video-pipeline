import json,subprocess,wave,re,shutil
from pathlib import Path
import numpy as np
R=Path(__file__).resolve().parents[2];O=R/'outputs/ai-returns-review';P=R/'studio/remotion/public/review-20261023';S=R/'studio/remotion/src/review-20261023'
source=O/'avatar-source-captioned.mp4';shutil.copy2(source,P/'returns.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le',str(O/'voice-source.wav')],check=True)
with wave.open(str(O/'voice-source.wav')) as w: sr=w.getframerate();a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16)
pads=[(16.2,4.8,'prompt1'),(40.5,4.8,'prompt2'),(66.4,3.32,'returns-ending')]; clips=[];chunks=[];src=0;out=0
for end,pad,kind in pads:
 dur=end-src;clips.append({'from':round(out*30),'duration':round(dur*30),'start':src,'end':end,'kind':'take'});chunks.append(a[round(src*sr):round(end*sr)]);out+=dur
 clips.append({'from':round(out*30),'duration':round(pad*30),'start':end,'end':end,'kind':kind});chunks.append(np.zeros(round(pad*sr),np.int16));out+=pad;src=end
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(min(end,66.32)),'-i',str(source),'-frames:v','1',str(P/f'{kind}-hold.jpg')],check=True)
with wave.open(str(P/'returns-voice.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(np.concatenate(chunks).tobytes())
def t(s):
 h,m,x=s.replace(',','.').split(':');return int(h)*3600+int(m)*60+float(x)
def shift(v):return v+sum(d for cut,d,k in pads if v>=cut)
caps=[]
for b in (O/'avatar-source.srt').read_text().strip().split('\n\n'):
 lines=b.splitlines()
 if len(lines)<3:continue
 x,y=lines[1].split(' --> ');caps.append({'startMs':round(shift(t(x))*1000),'endMs':round(shift(t(y))*1000),'text':' '.join(lines[2:])})
d={'fps':30,'duration':out,'clips':clips,'captions':caps};(O/'timing.json').write_text(json.dumps(d,indent=2)+'\n');(S/'returns-data.json').write_text(json.dumps(d,indent=2)+'\n')
def stamp(ms):return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(O/'captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["startMs"])} --> {stamp(c["endMs"])}\n{c["text"]}' for i,c in enumerate(caps))+'\n')
for name in ['ai-returns-review','coding-comedy-review']:
 f=R/'outputs'/name/'heygen_submission.json';d=json.loads(f.read_text());d['status']='completed_downloaded';d['source_file']='avatar-source-captioned.mp4' if name=='ai-returns-review' else 'avatar-source.mp4';d['download_note']='Captioned source; original bottom caption band excluded from final frame with a lower-edge mask; new safe-zone captions use source SRT.' if name=='ai-returns-review' else 'Clean source downloaded from HeyGen UI.';f.write_text(json.dumps(d,indent=2)+'\n')
print('Returns',out,'seconds; original speech, no time scaling')
