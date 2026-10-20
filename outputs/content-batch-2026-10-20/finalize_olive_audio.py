"""Finish the selected olive-shirt takes using measured EQ and conservative silence cuts.

The additional shelf compensates these two unusually dull source recordings only.
No narration speed change. Evaluate cut audibility using the same chain as output.
"""
import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'studio'))
from app import audio,tighten,edit_plan,voice_gates
j=Path(sys.argv[1]);words=json.loads((j/'captions_raw.json').read_text())
chain=audio.VOICE_CHAIN + ('highshelf=f=10000:t=q:w=0.7:g=13',)
original_pcm=audio.voice_chain_pcm
audio.voice_chain_pcm=lambda media, *_args, **kw: original_pcm(media,chain=chain,**kw)
r=tighten.tighten(j/'avatar_raw.mp4',j/'avatar.mp4',words,end_cap_ms=(120 if j.name=="7123480a28ca" else 160),mid_cap_ms=100,min_cut_ms=120,av_offset_ms=-100)
tighten.write_cuts(j,r)
audio.enhance_voice(j/'avatar.mp4',j/'avatar_enhanced.mp4',chain=chain)
speech=audio.voice_activity(j/'avatar_enhanced.mp4');caps=edit_plan.snap_onsets(r['captions'],speech)
for w in caps:
 w['text']=w['text'].replace('advance.','advanced.')
 if w['text'].strip().lower()=='drop':w['text']=w['text'].replace('drop','draft')
(j/'captions.json').write_text(json.dumps(caps,indent=2)+'\n');(j/'speech.json').write_text(json.dumps(speech,indent=2)+'\n')
report=voice_gates.check_job(j)
(j/'audio-qa.json').write_text(json.dumps({'chain':chain,'sync':r['sync'],'gates':report},indent=2)+'\n')
