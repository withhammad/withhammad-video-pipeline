from pathlib import Path
import json
from datetime import datetime,timedelta,timezone
R=Path('/Users/hammad/withhammad-video-pipeline');O=R/'work/reference-20261110-batch/release-20261111';q=json.loads((R/'outputs/video-pipeline/repost-queue.json').read_text());entries=q['entries'];GST=timezone(timedelta(hours=4))
ids=['in-990543b928c4','in-comedy20261023','in-4a606d94c5cd','yo-4a606d94c5cd','yo-990543b928c4','fa-4a606d94c5cd','li-85fb47b66b4b','li-990543b928c4','tt-4a606d94c5cd','xx-4a606d94c5cd','in-d61788123d13','yo-fef5b7f3b5af','yo-df71c9d45658','fa-df71c9d45658','li-agentic-concepts','xx-df71c9d45658']
occupied={(e['platform'].split('_')[0],e['local'][:16]) for e in entries if e['status'] in ('pending','scheduled')}; moves=[]
for ident in ids:
 e=next(e for e in entries if e['id']==ident);assert e['status']=='pending';pf=e['platform'].split('_')[0]; found=None
 for day in range(18,26):
  for hour in ([9,15] if pf in ('instagram','youtube') else [9,13,17]):
   if pf=='linkedin' and datetime(2026,11,day).weekday()==4 and hour==13:continue
   local=f'2026-11-{day:02} {hour:02}:00';
   # all future reserved slots need >=3h; phone+fallback needs full envelope plus3h, so6h grid
   t=datetime(2026,11,day,hour,tzinfo=GST)
   nearby=[datetime.strptime(v,'%Y-%m-%d %H:%M').replace(tzinfo=GST) for p,v in occupied if p==pf]
   if any(abs((t-v).total_seconds())<(6 if pf in ('instagram','youtube') else 4)*3600 for v in nearby):continue
   found=t;break
  if found:break
 assert found
 local=found.strftime('%Y-%m-%d %H:%M GST');occupied.add((pf,local[:16]));moves.append({'id':ident,'platform':e['platform'],'keyword':e.get('keyword'),'old_local':e['local'],'old_slot_utc':e['slot_utc'],'new_local':local,'new_slot_utc':found.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),'status':'pending','reason':'Proposed only: displace conflicting older pending entry for approved-date-extension priority batch; leave native PLANE/PROMPT and held/posted intact.'})
new=[]
for keyword,job,date,phone,fbli,native in [('FABLE','c5bc128a0a8d','2026-11-12','08:00','09:00','10:45'),('CLONE','0e375e205e9d','2026-11-12','13:15','13:00',None),('BENCH','e25d352a1b20','2026-11-13','08:00','09:00','09:00')]:
 for pf in ['instagram','youtube','facebook','linkedin','tiktok','x']:
  hh=phone if pf in ('instagram','youtube') else fbli if pf in ('facebook','linkedin') else native or ('17:15' if pf=='tiktok' else '14:00')
  new.append({'keyword':keyword,'job':job,'platform':pf,'local':f'{date} {hh} GST','status':'PLAN_ONLY','fallback_gst':('10:03' if phone=='08:00' else '16:03') if pf in ('instagram','youtube') else None})
proof={'as_of_utc':datetime.now(timezone.utc).isoformat(),'mode':'PLAN ONLY — do not apply until owner authorizes date extension, each package approved and guide/reply rule production verified','max_guaranteed_complete_packages_11_nov':2,'guaranteed_completion_date':'2026-11-13','why':'Full2h IG/YT phone windows plus hourly :03 fallback and>=3h actual gaps permit two guaranteed releases after13:00 today and two tomorrow within08–21runner. Third remaining package requires13Nov. Manual receipts could permit tighter adaptive schedule but are not assumed.','new_rows':new,'older_moves':moves,'additional_native_moves_required':[],'preserved_native':[{'keyword':'EDIT','platform':'tiktok','local':'2026-11-11 17:00 GST'},{'keyword':'PLANE','platform':'tiktok','local':'2026-11-12 14:00 GST'},{'keyword':'PLANE','platform':'x','local':'2026-11-12 18:00 GST'},{'keyword':'PROMPT','platform':'tiktok+x','local':'2026-11-14 14:00 GST'},{'keyword':'EDIT','platform':'x','local':'2026-11-15 14:00 GST'}]}
O.joinpath('extension-plan-only.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(moves,indent=2))
