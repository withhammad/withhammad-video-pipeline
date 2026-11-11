from pathlib import Path
import json, hashlib, os
from datetime import datetime, timezone
ROOT=Path('/Users/hammad/withhammad-video-pipeline')
Q=ROOT/'outputs/video-pipeline/repost-queue.json'
OUT=ROOT/'work/reference-20261110-batch/release-20261111'
LOCK=ROOT/'work/.run-due.lock'
MOVES={'in-e5c7bfbcd56c':('2026-11-17T13:00:00Z','2026-11-17 17:00 GST'), 'yo-85fb47b66b4b':('2026-11-15T05:00:00Z','2026-11-15 09:00 GST')}
LOCK.mkdir() # fail closed if occupied; never delete another process's lock
try:
 raw=Q.read_bytes(); data=json.loads(raw); now=datetime.now(timezone.utc).isoformat(); changes=[]
 for ident,(utc,local) in MOVES.items():
  e=next(e for e in data['entries'] if e['id']==ident)
  assert e['status']=='pending', (ident,e['status'])
  assert e['local'].startswith('2026-11-11'),(ident,e['local'])
  old={k:e[k] for k in ('id','platform','status','slot_utc','local')}
  event={'changed_at_utc':now,'original_slot_utc':e['slot_utc'],'original_local':e['local'],'new_slot_utc':utc,'new_local':local,'reason':'Owner explicitly prioritized five business batch and authorized moving older bookings later. Urgent fallback protection; selected vacant later lane after existing bookings, preserving 3h real spacing and 2h phone window.'}
  e.setdefault('schedule_history',[]).append(event); e['slot_utc']=utc; e['local']=local
  changes.append({'before':old,'after':{k:e[k] for k in old},'audit':event})
 OUT.joinpath('urgent-older-before.json').write_bytes(raw)
 payload=(json.dumps(data,indent=2,ensure_ascii=False)+'\n').encode();tmp=Q.with_suffix('.json.release-tmp');tmp.write_bytes(payload);os.replace(tmp,Q)
 proof={'at_utc':now,'before_sha256':hashlib.sha256(raw).hexdigest(),'after_sha256':hashlib.sha256(payload).hexdigest(),'changes':changes,'scope':'Only two pending slot/local fields plus append-only schedule_history; no publishing, status or native edits.'}
 OUT.joinpath('urgent-older-moves.json').write_text(json.dumps(proof,indent=2)+'\n'); print(json.dumps(proof,indent=2))
finally: LOCK.rmdir()
