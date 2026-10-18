"""Fresh Chrome recording of the corrected personal-account setup area."""
import json,subprocess,time,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(__file__).resolve().parent
JOB=ROOT/'studio/.local/claude-edit-final'
control=OUT/'chrome-control.py'; env=dict(os.environ,HAMMAD_BROWSER_WINDOW='1913606211')
def js(code):
 r=subprocess.run(['python3',str(control),'eval',code],env=env,capture_output=True,text=True,check=True);return r.stdout.strip()
def upload(path):
 subprocess.run(['python3',str(control),'upload',str(path)],env=env,capture_output=True,text=True,check=True)
# Check only actually visible text, including ancestor visibility.
assert js('String(Array.from(document.querySelectorAll("body *")).some(e=>e.childElementCount===0&&/promat|promet/i.test(e.innerText||"")&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})))')=='false'
assert 'Hammad' in js('document.querySelector("main")?.innerText||document.body.innerText.slice(-400)')
rec=subprocess.Popen(['screencapture','-x','-v','-V','40','-R','0,154,1512,831',str(JOB/'claude-setup-clean-raw.mov')],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
start=time.monotonic(); actions=[]
def act(label,fn):
 actions.append({'time':round(time.monotonic()-start,2),'action':label});fn()
time.sleep(2)
act('Open model menu',lambda:js('document.querySelector("button[aria-label^=\"Model:\"]").click();"open"'))
time.sleep(3)
act('Choose Opus 5.5',lambda:js('(()=>{let e=Array.from(document.querySelectorAll("[role=menuitemradio],[role=menuitem],button")).find(e=>e.innerText.trim()==="Opus 5.5");if(e)e.click();else document.querySelector("button[aria-label^=\"Model:\"]").click();return "selected"})()'))
time.sleep(1)
act('Open add menu',lambda:js('document.querySelector("[aria-label=\"Add files, connectors, and more\"]").click();"open"'))
time.sleep(1)
act('Open Skills',lambda:js('document.querySelector("[data-testid=add-menu-skills]").click();"skills"'))
time.sleep(2)
act('Select own editing skill',lambda:js('Array.from(document.querySelectorAll("[role=menuitem]")).find(e=>e.innerText.includes("hammad-video-editing")).click();"selected"'))
time.sleep(1)
act('Upload captions',lambda:upload(JOB/'source-avatar.srt'))
act('Upload source video',lambda:upload(JOB/'source-avatar.mp4'))
act('Upload storyboard',lambda:upload(OUT/'storyboard-overview.jpg'))
act('Enter original editing request',lambda:js('(()=>{let e=document.querySelector("[contenteditable=true]");e.focus();document.execCommand("insertText",false," Edit my talking-head video into a short explainer. Keep the original voice and duration. Match graphics to the spoken points; use the storyboard and timed captions. Do not invent statistics or claims. Return the MP4 and editable project.");return "written"})()'))
while time.monotonic()-start<39:time.sleep(.3)
rec.wait(timeout=10)
assert rec.returncode==0,rec.stderr.read().decode()
(JOB/'rerecord-actions.json').write_text(json.dumps(actions,indent=2)+'\n')
print(json.dumps(actions))
