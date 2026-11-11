from pathlib import Path
import json,hashlib,os,sys
from datetime import datetime,timezone,timedelta
ROOT=Path('/Users/hammad/withhammad-video-pipeline');sys.path.insert(0,str(ROOT/'studio'))
from app import repost_queue as rq
OUT=ROOT/'work/reference-20261110-batch/release-20261111';Q=rq.QUEUE;LOCK=ROOT/'work/.run-due.lock'; GST=timezone(timedelta(hours=4))
now=datetime.now(timezone.utc); assert now < datetime(2026,11,11,9,tzinfo=timezone.utc),'13:00 full phone window missed; stop'
# Exact approved packages, production PR21 proof, no live poster.
a=json.loads((ROOT/'work/reference-20261110-batch/owner-approvals-20261111.json').read_text())
for job in ['ee41d72bf8cd','62eec03e1e93']:
 ap=next(x for x in a['packages'] if x['job']==job)
 assert hashlib.sha256((rq.JOBS/job/'final.mp4').read_bytes()).hexdigest()==ap['video_sha256']
assert (OUT/'pr21-live-rules-proof.json').exists()
LOCK.mkdir()
try:
 raw=Q.read_bytes();data=json.loads(raw); entries=data['entries'];changes=[];added=[]
 # Defer remaining older pending rows today. Leave every held/posted/failed row untouched.
 # Vacant 18+Nov slots are beyond the existing queue, so no other bookings displaced.
 counters={}
 for e in entries:
  if e['status']!='pending' or not e['local'].startswith('2026-11-11'):continue
  pf=e['platform'];base=pf.split('_')[0];n=counters.get(base,0);counters[base]=n+1
  hours=[9,15] if base in ('instagram','youtube') else [9,13,17]
  day=18+n//len(hours);hour=hours[n%len(hours)];slot,local=rq._slot(f'2026-11-{day:02}',f'{hour:02}:00')
  before={k:e.get(k) for k in ('id','platform','status','slot_utc','local')}
  e.setdefault('schedule_history',[]).append({'changed_at_utc':now.isoformat(),'original_slot_utc':e['slot_utc'],'original_local':e['local'],'new_slot_utc':slot,'new_local':local,'reason':'Owner prioritized five business batch and explicitly authorized moving older unposted bookings later. Vacant later slots; preserve phone windows and real spacing.'})
  e.update(slot_utc=slot,local=local); changes.append({'before':before,'after':{k:e.get(k) for k in before}})
 for job,keyword,url in [('ee41d72bf8cd','HIGGS','https://withhammad.com/resources/claude-higgsfield-video-setup'),('62eec03e1e93','ADVISOR','https://withhammad.com/resources/claude-fable-advisor-setup')]:
  first=keyword=='HIGGS'; lesson=json.loads((rq.JOBS/job/'lesson.json').read_text())
  for pf in ['instagram','youtube','facebook','linkedin','tiktok','x']:
   ident=f'{rq.ID_PREFIX.get(pf,pf[:2])}-{job}';assert not any(e['id']==ident for e in entries),ident
   hh=('13:00' if first else '18:15') if pf in rq.APP_SOUND_LANES else (('15:00' if first else '19:00') if pf in ('facebook','linkedin') else ('14:00' if first else '18:00'))
   slot,local=rq._slot('2026-11-11',hh);caption,seo=rq.seo_caption(job,pf)
   e={'id':ident,'job':job,'platform':pf,'slot_utc':slot,'local':local,'keyword':keyword,'title':lesson.get('topic_title') or lesson.get('title') or job,'caption':caption,'primary_keyword':seo.get('primary_keyword'),'host_slug':f'repost-{job}','collaborators':None,'status':'pending','resource_url':url,'release_audit':{'booked_at_utc':now.isoformat(),'authorization':'Exact package approved; PR21 merged, live guides and deployed reply-rule provenance verified; owner prioritizes batch and permits older moves. Native TikTok/X still require observed schedule receipt.','phone_window_gst':('13:00–15:00' if first else '18:15–20:15') if pf in rq.APP_SOUND_LANES else None,'expected_runner_gst':('15:03' if first else '21:03') if pf in rq.APP_SOUND_LANES else ('15:03' if first else '19:03') if pf in ('facebook','linkedin') else None}}
   entries.append(e);added.append({k:e[k] for k in ('id','platform','local','status','resource_url')})
 OUT.joinpath('first-two-before.json').write_bytes(raw);payload=(json.dumps(data,indent=2,ensure_ascii=False)+'\n').encode();tmp=Q.with_suffix('.json.release-tmp');tmp.write_bytes(payload);os.replace(tmp,Q)
 proof={'at_utc':now.isoformat(),'queue_before_sha256':hashlib.sha256(raw).hexdigest(),'queue_after_sha256':hashlib.sha256(payload).hexdigest(),'older_moves':changes,'added':added,'native_note':'Native rows pending; no false scheduled status. EDIT native move has separate receipt.'};OUT.joinpath('first-two-booking-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof,indent=2))
finally:LOCK.rmdir()
