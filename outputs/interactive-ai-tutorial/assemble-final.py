import concurrent.futures,json,math,re,subprocess,time
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=Path(__file__).resolve().parent;JOB=ROOT/'studio/.local/jobs/fdb2463f9d21';REC=JOB/'recordings-final';A=JOB/'narration';P=JOB/'presenter-parts';E=JOB/'edit-final';E.mkdir(exist_ok=True)
TITLES=['The workflow','Newsletter: build the editor','Newsletter: test and export','Tasks: make the next action clear','Tasks: prepare a delegation draft','Revenue: check the calculations','Revenue: compare scenarios','Packaging: explore the concept','Packaging: review and handoff','Bonus: choose an idea','Bonus: prepare a presentation','Build better tools']
def stamp(t,ass=False):
 t=max(0,t);h=int(t//3600);m=int(t%3600//60);s=int(t%60);fraction=round((t-int(t))*(100 if ass else 1000))
 if fraction==(100 if ass else 1000):return stamp(round(t+0.001,2 if ass else 3),ass)
 return f'{h}:{m:02}:{s:02}.{fraction:02}' if ass else f'{h:02}:{m:02}:{s:02},{fraction:03}'
def cues(words):
 ws=[w for w in words if w.get('word') and not w['word'].startswith('<') and w['end']>w['start']];result=[];line=[]
 for w in ws:
  line.append(w)
  if len(line)>=7 or (len(line)>=3 and re.search(r'[.!?]$',w['word'])):
   result.append((line[0]['start'],line[-1]['end'],' '.join(x['word'] for x in line)));line=[]
 if line:result.append((line[0]['start'],line[-1]['end'],' '.join(x['word'] for x in line)))
 return result
ASS='''[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Default,Arial,38,&H00FFFFFF,&H00FFFFFF,&H00142B27,&H00142B27,-1,0,0,0,100,100,0,0,3,10,0,2,70,70,22,1\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n'''
def writecaptions(name,items):
 (E/(name+'.srt')).write_text('\n\n'.join(f'{i+1}\n{stamp(s)} --> {stamp(e)}\n{t}' for i,(s,e,t) in enumerate(items))+'\n')
 (E/(name+'.ass')).write_text(ASS+''.join(f'Dialogue: 0,{stamp(s,True)},{stamp(e,True)},Default,,0,0,0,,{t}\n' for s,e,t in items))
def strip(name,items,duration,title):
 folder=E/(name+'-captions');folder.mkdir(exist_ok=True)
 font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf',38);small=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)
 def png(text,key):
  path=folder/(str(key)+'.png');im=Image.new('RGB',(1920,120),'#122b27');draw=ImageDraw.Draw(im);draw.text((40,9),title,font=small,fill='#85e6ba');draw.text((960,68),text,font=font,fill='white',anchor='mm');im.save(path);return path
 blank=png('','blank');lines=[];cursor=0
 def add(path,seconds):
  if seconds>0.001:lines.extend(["file '"+str(path)+"'",'duration '+str(seconds)])
 for i,(a,b,text) in enumerate(items):
  a=max(cursor,a);b=min(duration,b)
  if b<=a:continue
  add(blank,a-cursor);add(png(text,i),b-a);cursor=b
 add(blank,duration-cursor);lines.append("file '"+str(blank)+"'")
 file=folder/'frames.txt';file.write_text('\n'.join(lines));return file
def encode(args,name):
 with (E/(name+'.log')).open('w') as log:subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error',*args,'-c:v','libx264','-preset','veryfast','-crf','21','-threads','2','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-movflags','+faststart',str(E/(name+'.mp4'))],stdout=log,stderr=log,check=True)
 print('Encoded',name,flush=True)
def screen(id):
 d=json.loads((A/(id+'.json')).read_text());duration=math.ceil(d['duration']*30)/30;items=cues(d['word_timestamps']);writecaptions(id,items);title=TITLES[int(id[:2])-1]
 (E/(id+'.title')).write_text(title)
 frames=strip(id,items,duration,title)
 encode(['-i',str(REC/(id+'.mp4')),'-i',str(A/(id+'.wav')),'-f','concat','-safe','0','-i',str(frames),'-filter_complex','[0:v]setsar=1[screen];[2:v]fps=30,format=yuv420p[cap];[screen][cap]vstack=inputs=2[v]','-map','[v]','-map','1:a:0','-af','highpass=f=65,equalizer=f=9000:t=q:w=0.7:g=-3,loudnorm=I=-16:TP=-1.5:LRA=11,apad','-t',str(duration)],id)
 return {'name':id,'duration':duration,'title':title,'captions':items}
def parse_srt(path):
 def sec(s):h,m,x=s.replace(',','.').split(':');return int(h)*3600+int(m)*60+float(x)
 out=[]
 for block in path.read_text().strip().split('\n\n'):
  lines=block.splitlines();a,b=lines[1].split(' --> ');out.append((sec(a),sec(b),' '.join(lines[2:])))
 return out
ALLP=parse_srt(JOB/'selected-presenter.srt')
def presenter(part):
 id,trim,seconds,title,*_=part;name='p-'+id;duration=round(seconds*30)/30;items=[(max(0,a-trim-.1),min(duration,b-trim-.1),t) for a,b,t in ALLP if a>=trim and a<trim+duration];items=[x for x in items if x[1]>x[0]];writecaptions(name,items)
 frames=strip(name,items,duration,'WITHHAMMAD / '+title)
 encode(['-i',str(P/(id+'.mp4')),'-ss',str(trim+.1),'-i',str(JOB/'selected-presenter.mp4'),'-f','concat','-safe','0','-i',str(frames),'-filter_complex','[0:v]crop=1920:960:0:0,setsar=1[screen];[2:v]fps=30,format=yuv420p[cap];[screen][cap]vstack=inputs=2[v]','-map','[v]','-map','1:a:0','-af','highpass=f=65,equalizer=f=9000:t=q:w=0.7:g=-3,loudnorm=I=-16:TP=-1.5:LRA=11,apad','-t',str(duration)],name)
 return {'name':name,'duration':duration,'title':title,'captions':items}
def ready(path):
 if not path.exists():return False
 r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)],capture_output=True,text=True)
 return r.returncode==0 and bool(r.stdout.strip())
def main():
 ids=['01-introduction']+[p.stem for p in sorted((OUT/'scripts').glob('*.txt'))];parts=json.loads((P/'parts.json').read_text());done={};futures={};deadline=time.time()+2700
 # Resume completed chapter encodes after a missing narration is supplied.
 for name,title in [(id,TITLES[int(id[:2])-1]) for id in ids]+[('p-'+p[0],p[3]) for p in parts]:
  path=E/(name+'.mp4');captions=E/(name+'.srt')
  if ready(path) and captions.exists():
   duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
   done[name]={'name':name,'duration':duration,'title':title,'captions':parse_srt(captions)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  while len(done)<len(ids)+len(parts):
   if time.time()>deadline:raise RuntimeError('Assets are still missing; no incomplete final was made')
   active=set(futures.values())
   for id in ids:
    if len(futures)>=2:break
    if id not in done and id not in active and (A/(id+'.json')).exists() and ready(A/(id+'.wav')) and ready(REC/(id+'.mp4')) and '"seconds"' in (REC/(id+'.log')).read_text():futures[pool.submit(screen,id)]=id
   for part in parts:
    name='p-'+part[0]
    if len(futures)>=2:break
    if name not in done and name not in active and ready(P/(part[0]+'.mp4')):futures[pool.submit(presenter,part)]=name
   for f in list(futures):
    if f.done():name=futures.pop(f);done[name]=f.result()
   time.sleep(3)
 order=['p-opening',ids[0],'p-newsletter',*ids[1:3],'p-tasks',*ids[3:5],'p-revenue',*ids[5:7],'p-packaging',*ids[7:9],'p-bonus',*ids[9:],'p-closing']
 concat=E/'concat.txt';concat.write_text('\n'.join("file '"+str(E/(n+'.mp4'))+"'" for n in order))
 chapter=[];allcaps=[];elapsed=0
 for n in order:
  item=done[n];chapter.append({'start':elapsed,'title':item['title'],'asset':n});allcaps.extend([(s+elapsed,e+elapsed,t) for s,e,t in item['captions']]);elapsed+=item['duration']
 writecaptions('full-tutorial',allcaps)
 import shutil;shutil.copy2(E/'full-tutorial.srt',OUT/'full-tutorial.srt')
 (OUT/'chapters.json').write_text(json.dumps(chapter,indent=2));(OUT/'edit-manifest.json').write_text(json.dumps({'duration_seconds':elapsed,'order':order,'assets':done},indent=2))
 subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(OUT/'full-tutorial.mp4')],check=True)
 print('FINAL',elapsed,str(OUT/'full-tutorial.mp4'),flush=True)
if __name__=='__main__':main()
