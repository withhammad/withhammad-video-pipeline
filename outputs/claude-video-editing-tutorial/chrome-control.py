import json, subprocess, sys, base64, os
from pathlib import Path
WINDOW=int(os.environ.get("HAMMAD_BROWSER_WINDOW", "1913606157"))

def run(js):
 s=f'tell application "Google Chrome" to execute tab 1 of window id {WINDOW} javascript '+json.dumps(js)
 r=subprocess.run(['osascript'],input=s,capture_output=True,text=True,timeout=20)
 if r.returncode: raise RuntimeError(r.stderr)
 return r.stdout.strip()

if sys.argv[1]=='eval': print(run(sys.argv[2]))
elif sys.argv[1]=='upload':
 p=Path(sys.argv[2]); selector=sys.argv[3] if len(sys.argv)>3 else 'input[data-testid=file-upload]'
 b64=base64.b64encode(p.read_bytes()).decode()
 run('window.__hammadUpload="";"ready"')
 for i in range(0,len(b64),750000): run('window.__hammadUpload+='+json.dumps(b64[i:i+750000])+';"chunk"')
 mime={'.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.zip':'application/zip','.txt':'text/plain','.srt':'text/plain'}.get(p.suffix,'application/octet-stream')
 js='''(()=>{const raw=atob(window.__hammadUpload);const file=new File([Uint8Array.from(raw,c=>c.charCodeAt(0))],NAME,{type:MIME});const dt=new DataTransfer();dt.items.add(file);const el=document.querySelector(SELECTOR);if(!el)throw new Error('Upload field missing');el.files=dt.files;el.dispatchEvent(new Event('change',{bubbles:true}));delete window.__hammadUpload;return 'File selected: '+NAME;})()'''.replace('NAME',json.dumps(p.name)).replace('MIME',json.dumps(mime)).replace('SELECTOR',json.dumps(selector))
 print(run(js))
