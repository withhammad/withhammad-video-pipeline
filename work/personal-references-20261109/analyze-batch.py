"""Local transcription and reference filmstrips, without APIs or business jobs."""
from pathlib import Path
import json,sys,subprocess
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'studio'))
from faster_whisper import WhisperModel
from app.media import decode_pcm
model=WhisperModel('medium',device='cpu',compute_type='int8',local_files_only=True)
items=json.loads((ROOT/'outputs/personal/reference-inbox.json').read_text())['links']
for item in items:
 if item['id']=='DdS2umGNd5m':continue
 p=Path(__file__).resolve().parent/item['id'];src=p/'source.mp4'
 if not (p/'transcript-medium.json').exists():
  seg,info=model.transcribe(decode_pcm(src),language='ur',word_timestamps=True,vad_filter=True,beam_size=5)
  data=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'start':w.start,'end':w.end,'word':w.word} for w in s.words]} for s in seg]
  (p/'transcript-medium.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 else:data=json.loads((p/'transcript-medium.json').read_text())
 if not (p/'source-sheet.jpg').exists():
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-vf','fps=1/3,scale=360:640,tile=4x6','-frames:v','1',str(p/'source-sheet.jpg')],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-ss','3','-i',str(src),'-frames:v','1',str(p/'source-first.jpg')],check=True)
 print(item['id'],json.dumps([{'s':s['start'],'e':s['end'],'text':s['text']} for s in data],ensure_ascii=False),flush=True)
