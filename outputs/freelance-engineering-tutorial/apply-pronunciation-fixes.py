"""Apply reviewed wording fixes and invalidate only their generated audio and captions."""
from pathlib import Path
import json,shutil
P=Path(__file__).resolve().parent;J=P.parents[1]/'studio/.local/freelance-engineering-final/local-speech'
fixes=json.loads((P/'pronunciation-fixes.json').read_text());manifest=json.loads((J/'manifest.json').read_text());backup=J/'superseded';backup.mkdir(exist_ok=True)
for c in manifest:
 if c['key'] not in fixes:continue
 source=P/'scripts'/f"{c['chapter']}.txt";script=source.read_text();changed=False
 for old,new in fixes[c['key']]['replacements'].items():
  if old in c['text']:
   assert old in script,(c['key'],old)
   c['text']=c['text'].replace(old,new);script=script.replace(old,new);changed=True
 if changed:
  source.write_text(script)
  for suffix in ['.wav','.json','.asr.json']:
   f=J/(c['key']+suffix)
   if f.exists():shutil.move(str(f),str(backup/f.name))
  print('Queued corrected segment',c['key'])
(J/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
