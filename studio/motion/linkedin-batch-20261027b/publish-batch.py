"""Only the six owner-approved reference-format posts; durable no-duplicate receipts."""
from pathlib import Path
import sys,json,time,hashlib,argparse
from datetime import datetime,timezone
R=Path(__file__).resolve().parents[3];sys.path.insert(0,str(R/'studio'))
from app import publish_linkedin as li
O=R/'outputs/linkedin-batch-20261027b';S=R/'studio/.local/jobs/li-batch-20261027b/publish'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def due(items,now):return [x for x in items if x['approval'] and datetime.fromisoformat(x['publish_at'])<=now]
def client():
 c=li.LinkedInClient(li.load_credentials(li.CREDENTIALS_PATH)['access_token'])
 if c.userinfo().get('sub')!=li.OWNER_SUB:raise RuntimeError('LinkedIn owner mismatch')
 return c
def process(item,prepare=False):
 path=O/item['file'];statepath=S/f"post-{item['number']:02}.json"
 if digest(path)!=item['sha256']:raise RuntimeError('Approved asset changed; refusing to publish')
 with li._exclusive(statepath):
  st=li._load_state(statepath)
  if st.get('status')=='published':return {k:st.get(k) for k in ['status','post_url','published_at']}
  if st.get('post_attempt'):raise RuntimeError('Uncertain prior post attempt; inspect profile before any retry')
  if not prepare and (datetime.now(timezone.utc)-datetime.fromisoformat(item['publish_at'])).total_seconds()>7200:
   return {'status':'missed_slot_needs_rescheduling','number':item['number']}
  c=client()
  try:
   kind=item['kind']
   if not st.get('uploaded'):
    if kind=='video':
     v=c.initialize_upload(li.initialize_body(path.stat().st_size));parts=[]
     with path.open('rb') as f:
      for chunk in v['uploadInstructions']:
       f.seek(chunk['firstByte']);parts.append(c.upload_part(chunk['uploadUrl'],f.read(chunk['lastByte']-chunk['firstByte']+1)))
     c.finalize_upload(li.finalize_body(v['video'],v['uploadToken'],parts));urn=v['video']
    elif kind=='document':
     li.validate_document(path);v=c.initialize_document_upload({'initializeUploadRequest':{'owner':li.author_urn()}});c.upload_document(v['uploadUrl'],path.read_bytes());urn=v['document']
    else:
     resp=c.send('initialize_image','POST',li.API+'/rest/images?action=initializeUpload',headers=c.rest_headers(True),json_body={'initializeUploadRequest':{'owner':li.author_urn()}})
     v=resp.json()['value'];c.send('upload_image','PUT',v['uploadUrl'],headers={'Authorization':'Bearer '+c._token,'Content-Type':'application/octet-stream'},content=path.read_bytes());urn=v['image']
    st.update(uploaded=True,media_urn=urn,uploaded_at=time.time(),asset_sha256=item['sha256'],status='uploaded');li._save_state(statepath,st)
   if prepare:return {'status':'uploaded','number':item['number']}
   if time.time()-st['uploaded_at']<120:return {'status':'processing','number':item['number']}
   if kind=='video':
    try:
     status=c.get_video(st['media_urn']).get('status')
     if status!='AVAILABLE':raise RuntimeError('Video status '+str(status))
    except li.LinkedInAPIError as e:
     if e.status!=403:raise
   li._create_post(c,st,statepath,st['media_urn'],li.escape_little(item['caption']),item['title'],[],urn_key='media_urn')
   return {k:st.get(k) for k in ['status','post_url','published_at']}
  finally:c.close()
def main():
 a=argparse.ArgumentParser();a.add_argument('mode',choices=['prepare','run-due','status']);args=a.parse_args();items=json.loads((O/'approved-schedule.json').read_text())['items'];results=[]
 selected=items if args.mode!='run-due' else due(items,datetime.now(timezone.utc))
 for item in selected:
  if args.mode=='status':
   st=li._load_state(S/f"post-{item['number']:02}.json");result={k:st.get(k) for k in ['status','post_url','published_at']}
  else:result=process(item,args.mode=='prepare')
  results.append({'number':item['number'],'title':item['title'],'publish_at':item['publish_at'],**result})
 (O/'publishing-receipts.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
if __name__=='__main__':main()
