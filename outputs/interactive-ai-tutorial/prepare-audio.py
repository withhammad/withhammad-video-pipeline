import concurrent.futures,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];JOB=ROOT/'studio/.local/jobs/fdb2463f9d21';A=JOB/'narration'
def get(p):
 d=json.loads(p.read_text());out=p.with_suffix('.wav')
 if not out.exists():subprocess.run(['curl','--fail','--silent','--show-error',d['audio_url'],'-o',str(out)],check=True)
 return out.name
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(get,sorted(A.glob('*.json'))):print(result,flush=True)
