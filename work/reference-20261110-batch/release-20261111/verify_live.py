from pathlib import Path
import urllib.parse,hashlib,hmac,json,re,datetime,subprocess
root=Path('/Users/hammad/withhammad-video-pipeline');out=Path(__file__).parent
base='https://withhammad.com'
def request(url,data=None,headers=None):
    cfg='url = '+json.dumps(url)+'\n'
    for k,v in (headers or {}).items():cfg+='header = '+json.dumps(k+': '+v)+'\n'
    if data is not None:cfg+='data = '+json.dumps(data)+'\n'
    r=subprocess.run(['curl','--silent','--show-error','--max-time','40','--config','-','--write-out','\n%{http_code}'],input=cfg,capture_output=True,text=True)
    if r.returncode:raise RuntimeError('HTTP transfer failed; no credentials logged')
    body,status=r.stdout.rsplit('\n',1);return int(status),body
proof={}
for key,slug in [('HIGGS','claude-higgsfield-video-setup'),('ADVISOR','claude-fable-advisor-setup')]:
    u=base+'/resources/'+slug;status,body=request(u);(out/(key.lower()+'-production.html')).write_text(body)
    def find(pattern):
        m=re.search(pattern,body);return m.group(1) if m else None
    proof[key]={'url':u,'http':status,'title':find(r'<title>(.*?)</title>'),'h1Count':len(re.findall(r'<h1\b',body)),'canonical':find(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"'),'description':find(r'<meta[^>]*name="description"[^>]*content="([^"]+)"'),'ogImage':find(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"'),'faqSchema':'FAQPage' in body}
token=(root/'work/.secrets/instagram-webhook-verify-token.txt').read_text().strip();secret=(root/'work/.secrets/instagram-client-secret.txt').read_text().strip();challenge='release-20261111-connectivity'
query=urllib.parse.urlencode({'hub.mode':'subscribe','hub.verify_token':token,'hub.challenge':challenge});status,body=request(base+'/api/instagram/webhook?'+query);proof['handshake']={'http':status,'challengeMatches':body==challenge}
for obj in ['instagram','page']:
    data=json.dumps({'object':obj,'entry':[]},separators=(',',':'));signature='sha256='+hmac.new(secret.encode(),data.encode(),hashlib.sha256).hexdigest();status,body=request(base+'/api/instagram/webhook',data,{'Content-Type':'application/json','X-Hub-Signature-256':signature});proof[obj+'EmptyEvent']={'http':status,'response':json.loads(body)}
proof['actualCustomerDelivery']='Not tested; no customer comments or messages fabricated.';proof['checkedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'production-http-webhook.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof,indent=2))
