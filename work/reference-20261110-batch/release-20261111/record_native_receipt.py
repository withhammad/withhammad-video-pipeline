"""Mark only an already-observed native schedule, under the poster's lock. Never publishes."""
import argparse,json,os
from pathlib import Path
from datetime import datetime,timezone
p=argparse.ArgumentParser();p.add_argument('--id',required=True);p.add_argument('--url',required=True);p.add_argument('--expected-local',required=True);p.add_argument('--evidence',required=True);a=p.parse_args()
R=Path('/Users/hammad/withhammad-video-pipeline');Q=R/'outputs/video-pipeline/repost-queue.json';L=R/'work/.run-due.lock';O=R/'work/reference-20261110-batch/release-20261111'
assert a.url.startswith(('https://x.com/','https://www.tiktok.com/'));assert a.evidence.strip()
L.mkdir() # Busy => stop. Never remove another holder's lock.
try:
 d=json.loads(Q.read_text());e=next(x for x in d['entries'] if x['id']==a.id)
 assert e['platform'] in ('x','tiktok');assert e['local']==a.expected_local
 assert e['status']=='pending',f"Do not resubmit: {e['status']}"
 now=datetime.now(timezone.utc).isoformat();proof={'id':a.id,'local':a.expected_local,'url':a.url,'observed_at_utc':now,'evidence':a.evidence}
 e.update(status='scheduled',url=a.url,scheduled_at=now,native_receipt=proof)
 tmp=Q.with_suffix('.json.release-tmp');tmp.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n');os.replace(tmp,Q)
 O.joinpath('receipt-'+a.id+'.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof,indent=2))
finally:L.rmdir()
