"""Export clean 1920×1080 slide PNGs using isolated headless Google Chrome."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,tempfile,json,sys
P=Path(__file__).resolve().parent
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
slides=json.loads((P/'slides/slides.json').read_text())
selection=next((set(map(int,a.split('=',1)[1].split(','))) for a in sys.argv if a.startswith('--only=')),None)
if selection:slides=[s for s in slides if s['id'] in selection]
out=P/'slides/png';out.mkdir(exist_ok=True)
def render(s):
 target=out/f"{s['id']:02d}.png"
 with tempfile.TemporaryDirectory(prefix='hammad-slide-') as profile:
  subprocess.run([CHROME,'--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',f'--user-data-dir={profile}','--window-size=1920,1080','--force-device-scale-factor=1','--virtual-time-budget=1500',f'--screenshot={target}',(P/'slides/index.html').as_uri()+f"?still=1#{s['id']}"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True,timeout=45)
 return target.name
with ThreadPoolExecutor(max_workers=3) as pool:
 for name in pool.map(render,slides):print(name,flush=True)
