from pathlib import Path
import json,os
from datetime import datetime,timezone
R=Path('/Users/hammad/withhammad-video-pipeline');Q=R/'outputs/video-pipeline/repost-queue.json';O=R/'work/reference-20261110-batch/release-20261111';L=R/'work/.run-due.lock'
L.mkdir()
try:
 d=json.loads(Q.read_text());now=datetime.now(timezone.utc).isoformat(); changes=[]
 for ident,utc,local,reason in [('xx-g2-edit-videos-guide','2026-11-15T10:00:00Z','2026-11-15 14:00 GST','Observed X native scheduled list after in-place save: Will send on Sun, Nov 15, 2026 at 2:00 PM. EDIT38sec caption unchanged.'),('tt-62eec03e1e93','2026-11-11T16:15:00Z','2026-11-11 20:15 GST','Existing TikTok EDIT17:00 cannot reschedule in place: only Download/Delete exposed; preserve it under no-delete/repost. ADVISOR20:15 leaves3h15 gap.')]:
  e=next(e for e in d['entries'] if e['id']==ident);before={k:e.get(k) for k in ('id','local','slot_utc','status')}; e.setdefault('schedule_history',[]).append({'changed_at_utc':now,'original_slot_utc':e['slot_utc'],'original_local':e['local'],'new_slot_utc':utc,'new_local':local,'reason':reason});e.update(slot_utc=utc,local=local);changes.append({'before':before,'after':{k:e.get(k) for k in before},'evidence':reason})
 payload=json.dumps(d,indent=2,ensure_ascii=False)+'\n';tmp=Q.with_suffix('.json.release-tmp');tmp.write_text(payload);os.replace(tmp,Q)
 O.joinpath('native-edit-reconciliation.json').write_text(json.dumps({'at_utc':now,'changes':changes,'tiktok_preserved':{'id':'tt-g2-edit-videos-guide','url':'https://www.tiktok.com/@withhammad/video/7705478342039932161','local':'2026-11-11 17:00 GST','observed_menu':['Download','Delete']},'existing_native_other':[{'platform':'x','keyword':'PLANE','local':'2026-11-12 18:00 GST'},{'platform':'x','keyword':'PROMPT','local':'2026-11-14 14:00 GST'},{'platform':'tiktok','keyword':'PLANE','local':'2026-11-12 14:00 GST','url':'https://www.tiktok.com/@withhammad/video/7705382432094178612'},{'platform':'tiktok','keyword':'PROMPT','local':'2026-11-14 14:00 GST','url':'https://www.tiktok.com/@withhammad/video/7705478708181699892'}]},indent=2)+'\n');print('Reconciled X EDIT and revised pending TikTok ADVISOR; lock released.')
finally:L.rmdir()
