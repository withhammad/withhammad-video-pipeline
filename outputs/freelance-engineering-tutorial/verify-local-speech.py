"""Transcribe local synthesis for missing/repeated speech checks and subtitle timing."""
from pathlib import Path
import json,sys,re,difflib,time,subprocess
import numpy as np
from faster_whisper import WhisperModel
P=Path(__file__).resolve().parent;J=P.parents[1]/'studio/.local/freelance-engineering-final/local-speech'
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4)
manifest=json.loads((J/'manifest.json').read_text())
def norm(x):return re.sub(r'[^\w\s]','',x).split()
while True:
 for c in manifest:
  f=J/(c['key']+'.wav');out=J/(c['key']+'.asr.json')
  if not f.exists() or out.exists():continue
  audio=np.frombuffer(subprocess.check_output(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
  segments,info=model.transcribe(audio,language='hi',beam_size=3,word_timestamps=True,vad_filter=False,condition_on_previous_text=False)
  data=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'word':w.word,'start':w.start,'end':w.end} for w in s.words]} for s in segments]
  text=' '.join(s['text'] for s in data);score=difflib.SequenceMatcher(None,norm(c['text']),norm(text)).ratio()
  out.write_text(json.dumps({'expected':c['text'],'transcript':text,'match_score':score,'segments':data},ensure_ascii=False,indent=2)+'\n')
  print(c['key'],round(score,3),text[:110],flush=True)
 if '--watch' not in sys.argv or all((J/(c['key']+'.asr.json')).exists() for c in manifest):break
 time.sleep(3)
