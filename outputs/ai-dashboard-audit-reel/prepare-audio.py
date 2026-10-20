import json,sys,shutil,re
from pathlib import Path
r=Path(__file__).resolve().parents[2];sys.path.insert(0,str(r/'studio'))
from app import reel,audio,tighten,edit_plan,voice_gates
j=r/'studio/.local/jobs/audit20261020';o=Path(__file__).parent
if not (j/'captions_raw.json').exists():
 words=reel.transcribe_words(j/'avatar_raw.mp4',(o/'script.txt').read_text());(j/'captions_raw.json').write_text(json.dumps(words,indent=2)+'\n')
else:words=json.loads((j/'captions_raw.json').read_text())
chain=audio.VOICE_CHAIN+('highshelf=f=10000:t=q:w=0.7:g=17',)
original=audio.voice_chain_pcm;audio.voice_chain_pcm=lambda media,*a,**kw:original(media,chain=chain,**kw)
result=tighten.tighten(j/'avatar_raw.mp4',j/'avatar.mp4',words,end_cap_ms=220,mid_cap_ms=120,min_cut_ms=100,av_offset_ms=-100)
tighten.write_cuts(j,result);audio.enhance_voice(j/'avatar.mp4',j/'avatar_enhanced.mp4',chain=chain)
speech=audio.voice_activity(j/'avatar_enhanced.mp4');caps=edit_plan.snap_onsets(result['captions'],speech)
for n,d in [('captions.json',caps),('speech.json',speech)]: (j/n).write_text(json.dumps(d,indent=2)+'\n')
report=voice_gates.check_job(j);(o/'audio-qa.json').write_text(json.dumps({'chain':chain,'sync':result['sync'],'gates':report,'speed_change':False},indent=2)+'\n');print(json.dumps({'duration':audio.probe_duration(j/'avatar_enhanced.mp4'),'gates':report},indent=2))
