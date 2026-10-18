"""Resume local Hindi voice-clone narration; no API, subscriptions, or cloud upload."""
from pathlib import Path
import json,re,time,sys
import numpy as np
import soundfile as sf
import mlx.core as mx
import mlx.nn as nn
from mlx_audio.tts.models.chatterbox.chatterbox import Model
from mlx_audio.utils import resample_audio
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[1]
JOB=ROOT/'studio/.local/freelance-engineering-final'
DEST=JOB/'local-speech';DEST.mkdir(exist_ok=True)
slides=json.loads((OUT/'slides/slides.json').read_text())
chunks=[]
for s in slides:
 if s['id']<13:continue
 sentences=[x.strip() for x in re.split(r'(?<=[।!?])\s+',s['narration']) if x.strip()]
 groups=[];current=''
 for sentence in sentences:
  if current and len((current+' '+sentence).split())>45:
   groups.append(current);current=''
  current=(current+' '+sentence).strip()
 if current:groups.append(current)
 for i,t in enumerate(groups):chunks.append({'key':f"s{s['id']:02d}-{i:02d}",'slide':s['id'],'chapter':s['chapter'],'text':t})
if (DEST/'manifest.json').exists():chunks=json.loads((DEST/'manifest.json').read_text())
else:(DEST/'manifest.json').write_text(json.dumps(chunks,ensure_ascii=False,indent=2)+'\n')
if '--manifest-only' in sys.argv:print(len(chunks),'chunks');sys.exit()
model=Model.from_pretrained(ROOT/'studio/.local/chatterbox-multilingual-v3')
nn.quantize(model.t3,bits=8,group_size=64,class_predicate=lambda path,m: isinstance(m,(nn.Linear,nn.Embedding)) and m.weight.shape[-1]%64==0)
mx.eval(model.t3.parameters())
conds=model.prepare_conditionals(str(JOB/'hammad-reference.wav'),24000,0.25)
items=chunks[:1] if '--test' in sys.argv else chunks
selection=next((a.split('=',1)[1].split(',') for a in sys.argv if a.startswith('--keys=')),None)
if selection:items=[c for c in chunks if c['key'] in selection]
for c in items:
 path=DEST/(c['key']+'.wav');receipt=path.with_suffix('.json')
 if path.exists() and receipt.exists():continue
 started=time.time();mx.random.seed(1800+c['slide']*10+int(c['key'][-2:]))
 result=next(model.generate(c['text'],conds=conds,lang_code='hi',exaggeration=0.25,temperature=0.65,cfg_weight=0.5,repetition_penalty=1.2,max_new_tokens=1400,verbose=False))
 a=np.array(result.audio).squeeze();sf.write(path,a,result.sample_rate,subtype='PCM_16')
 generated_emb=model.ve.embeds_from_wavs([resample_audio(mx.array(a),result.sample_rate,16000)],sample_rate=16000)
 v=np.array(mx.mean(generated_emb,axis=0)).flatten();ref=np.array(conds.t3.speaker_emb).flatten()
 similarity=float(np.dot(v,ref)/(np.linalg.norm(v)*np.linalg.norm(ref)))
 info={**c,'sample_rate':result.sample_rate,'duration':len(a)/result.sample_rate,'elapsed':time.time()-started,'engine':'Chatterbox multilingual v3 / MLX local','t3_precision':'8-bit','speaker_embedding_cosine':similarity,'seed':1800+c['slide']*10+int(c['key'][-2:])}
 receipt.write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
 print(c['key'],round(info['duration'],2),'seconds; generated in',round(info['elapsed'],1),flush=True)
 mx.clear_cache()
print('Generation complete',flush=True)
