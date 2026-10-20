"""Drive an explicitly selected Google Chrome tab using its visible DOM."""
import base64,json,subprocess,sys
from pathlib import Path
window,tab=int(sys.argv[1]),int(sys.argv[2])
def run(js):
 script=f'tell application "Google Chrome" to execute tab id {tab} of window id {window} javascript '+json.dumps(js)
 result=subprocess.run(['osascript'],input=script,text=True,capture_output=True,timeout=30)
 if result.returncode:raise RuntimeError(result.stderr)
 return result.stdout.strip()
if sys.argv[3]=='eval':print(run(sys.argv[4]))
elif sys.argv[3]=='file':print(run(Path(sys.argv[4]).read_text()))
elif sys.argv[3]=='upload':
 p=Path(sys.argv[4]);selector=sys.argv[5];b64=base64.b64encode(p.read_bytes()).decode()
 run('window.__uploadBytes="";"ready"')
 for i in range(0,len(b64),500000):run('window.__uploadBytes+='+json.dumps(b64[i:i+500000])+';"chunk"')
 mime={'.wav':'audio/wav','.mp4':'video/mp4','.png':'image/png','.jpg':'image/jpeg','.srt':'text/plain'}.get(p.suffix,'application/octet-stream')
 js='(()=>{const raw=atob(window.__uploadBytes);const dt=new DataTransfer();dt.items.add(new File([Uint8Array.from(raw,c=>c.charCodeAt(0))],'+json.dumps(p.name)+',{type:'+json.dumps(mime)+'}));let e=document.querySelector('+json.dumps(selector)+');if(!e)throw Error("Missing file input");e.files=dt.files;e.dispatchEvent(new Event("change",{bubbles:true}));delete window.__uploadBytes;return "file selected"})()'
 print(run(js))
