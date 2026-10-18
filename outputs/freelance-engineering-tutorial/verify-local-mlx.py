"""Local multilingual ASR audit using a larger, Apple-Silicon-optimized Whisper model."""
from pathlib import Path
import json,re,difflib,time,sys,subprocess
import numpy as np
import mlx.core as mx
from mlx_audio.stt.utils import load_model
P=Path(__file__).resolve().parent;J=P.parents[1]/'studio/.local/freelance-engineering-final/local-speech'
model=load_model('mlx-community/whisper-large-v3-turbo-asr-4bit')
manifest=json.loads((J/'manifest.json').read_text())
if '--sample' in sys.argv:manifest=manifest[:1]
def norm(x):return re.sub(r'[^\w\s]','',x).split()
while True:
 for c in manifest:
  f=J/(c['key']+'.wav');out=J/(c['key']+'.asr.json')
  if not f.exists() or not f.with_suffix('.json').exists():continue
  if out.exists() and json.loads(out.read_text()).get('engine')=='whisper-large-v3-turbo-mlx':continue
  a=np.frombuffer(subprocess.check_output(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-v','error','-i',str(f),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32).copy()
  started=time.time();result=model.generate(a,language='hi',word_timestamps=True,condition_on_previous_text=False,temperature=0,verbose=None)
  text=result.text;score=difflib.SequenceMatcher(None,norm(c['text']),norm(text)).ratio()
  data={'expected':c['text'],'transcript':text,'match_score':score,'segments':result.segments,'engine':'whisper-large-v3-turbo-mlx','seconds':time.time()-started}
  out.write_text(json.dumps(data,ensure_ascii=False,indent=2,default=lambda x:x.item() if hasattr(x,'item') else str(x))+'\n')
  print(c['key'],round(score,3),round(data['seconds'],1),text[:130],flush=True);mx.clear_cache()
 if '--watch' not in sys.argv or all((J/(c['key']+'.asr.json')).exists() and json.loads((J/(c['key']+'.asr.json')).read_text()).get('engine')=='whisper-large-v3-turbo-mlx' for c in manifest):break
 time.sleep(3)
