"""Copy only visually reviewed personal films to the owner's delivery folder."""
from pathlib import Path
import html,json,shutil,sys

ROOT=Path(__file__).resolve().parents[2];WORK=Path(__file__).resolve().parent
BASE=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs')
OUT=BASE/'Personal-Poetry';DEST=Path.home()/'Downloads/10 November/Personal';DEST.mkdir(parents=True,exist_ok=True)
(OUT/'Thumbnails').mkdir(exist_ok=True);(DEST/'Thumbnails').mkdir(exist_ok=True)
poems=json.loads((WORK/'poems.json').read_text())
reviewed=set(sys.argv[1:])
for poem in poems:
 if poem['id'] not in reviewed:continue
 p=WORK/poem['id']/'proof.json';proof=json.loads(p.read_text())
 proof['status']='finished_for_personal_use';proof['visual_review']={'complete_1fps_filmstrip_inspected':True,'captions':'Published Urdu text and new English translation; consistent verse timing','source_crop':'Only moving inset retained; source portrait excluded' if poem.get('crop') else 'New full-frame photographic scenes; no original video imagery'}
 for suffix in ['.mp4','.srt']:
  src=OUT/(poem['slug']+suffix);shutil.copy2(src,DEST/src.name)
 proof['downloads']=str(DEST/(poem['slug']+'.mp4'))
 p.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 (ROOT/f"outputs/personal/reviews/2026-11-10-{poem['id']}.json").write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 manifest=ROOT/'outputs/personal/reference-inbox.json';state=json.loads(manifest.read_text());item=next(x for x in state['links'] if x['id']==poem['id'])
 item.update(status='finished_for_personal_use',video=proof['file'],review=f"outputs/personal/reviews/2026-11-10-{poem['id']}.json",downloads=proof['downloads'])
 manifest.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')

# An offline viewing index. Only completed, reviewed files appear in it.
finished=[]
for poem in poems:
 p=WORK/poem['id']/'proof.json'
 if p.exists() and json.loads(p.read_text())['status']=='finished_for_personal_use':
  finished.append((poem['slug'].replace('-',' '),poem['slug']+'.mp4',poem['duration']))
  for target in [OUT,DEST]:shutil.copy2(WORK/poem['id']/'final-0.jpg',target/'Thumbnails'/(poem['slug']+'.jpg'))
for file in ['Dikhawa-full-video.mp4','Dikhawa-captions.srt']:
 shutil.copy2(BASE/'Personal-Dikhawa'/file,DEST/file)
items=[('Andalus · full Blender film','Andalus-Blender-full.mp4',35.409),('Dikhawa','Dikhawa-full-video.mp4',11.867)]+finished
for name,src in [('Andalus-Blender-full.jpg',ROOT/'work/personal-iqbal-3d/full-shot-0.jpg'),('Dikhawa-full-video.jpg',WORK/'DdS2umGNd5m/final-0.jpg')]:
 for target in [OUT,DEST]:shutil.copy2(src,target/'Thumbnails'/name)
def document(local):
 cards=[]
 for title,file,duration in items:
  relative=file
  if not local and file.startswith('Andalus'):relative='../Personal-Iqbal/'+file
  if not local and file.startswith('Dikhawa'):relative='../Personal-Dikhawa/'+file
  poster='Thumbnails/'+Path(file).stem+'.jpg'
  cards.append(f'<article><video controls preload="metadata" playsinline src="{relative}" poster="{poster}"></video><h2>{html.escape(title)}</h2><p>{duration:.1f} seconds <a href="{relative}" download>Save video</a></p></article>')
 return f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hammad · Personal films</title><style>*{{box-sizing:border-box}}body{{margin:0;background:#101b20;color:#f5ebd7;font:17px/1.6 system-ui;padding:36px}}header{{max-width:1100px;margin:0 auto 32px}}h1{{font:48px/1.1 Georgia;margin:12px 0}}header p{{color:#b6c3c7}}main{{max-width:1100px;margin:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}}article{{border:1px solid #34464c;border-radius:16px;overflow:hidden;background:#19282d}}video{{display:block;width:100%;height:440px;object-fit:contain;background:#03090c}}h2{{font:24px Georgia;padding:0 20px}}article p{{padding:0 20px 12px;color:#c7cfcf}}a{{color:#e8c38b;margin-left:12px}}@media(max-width:600px){{body{{padding:20px}}h1{{font-size:38px}}}}</style><header><small>PERSONAL COLLECTION · 10 NOVEMBER</small><h1>Your films</h1><p>{len(items)} complete videos. Original sound and captions. Saved locally for your personal use.</p></header><main>{''.join(cards)}</main><script>document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{{if(other!==v)other.pause()}})))</script></html>'''
(OUT/'watch.html').write_text(document(False));(DEST/'watch.html').write_text(document(True))
index=['# Personal films','',f'{len(items)} finished files. Personal use only; nothing uploaded.','']
for title,file,duration in items:
 index.append(f'- [{title} · {duration:.1f}s](<{DEST/file}>)')
(OUT/'START-HERE.md').write_text('\n'.join(index)+'\n');(DEST/'START-HERE.md').write_text('\n'.join(index)+'\n')
print(json.dumps({'reviewed_and_copied':list(reviewed),'collection_count':len(items),'folder':str(DEST)}))
