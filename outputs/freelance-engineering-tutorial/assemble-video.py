"""Assemble verified narration, fresh slide exports, and the already-generated intro."""
from pathlib import Path
import subprocess,json,sys,concurrent.futures,math
P=Path(__file__).resolve().parent;ROOT=P.parents[1];J=ROOT/'studio/.local/freelance-engineering-final';SEG=J/'segments';SEG.mkdir(exist_ok=True)
FPS=25

def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def probe(path):return float(subprocess.check_output(['/opt/homebrew/opt/ffmpeg-full/bin/ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
timeline=json.loads((J/'first-two-timing.json').read_text())
complete='--prepare-only' not in sys.argv
if (J/'local-speech/manifest.json').exists():
 manifest=json.loads((J/'local-speech/manifest.json').read_text());offset=timeline[-1]['start']+timeline[-1]['duration']
 for sid in range(13,34):
  cs=[c for c in manifest if c['slide']==sid];duration=0
  if not all((J/'local-speech'/f"{c['key']}.wav").exists() and (J/'local-speech'/f"{c['key']}.json").exists() for c in cs):
   if complete:raise RuntimeError(f'Missing narration for slide {sid}')
   break
  for c in cs:
   f=J/'local-speech'/f"{c['key']}.wav";assert f.exists(),f
   duration+=json.loads(f.with_suffix('.json').read_text())['duration']
  timeline.append({'slide':sid,'chapter':cs[0]['chapter'],'start':offset,'duration':duration});offset+=duration
(J/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n')

def render(s):
 frames=round((s['start']+s['duration'])*FPS)-round(s['start']*FPS);target=SEG/f"slide-{s['slide']:02d}.mp4"
 if target.exists() and abs(probe(target)-frames/FPS)<.005:return target
 run(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-hide_banner','-loglevel','error','-loop','1','-framerate',str(FPS),'-i',str(P/'slides/png'/f"{s['slide']:02d}.png"),'-vf','fade=t=in:st=0:d=0.2:color=0x0a102b,format=yuv420p','-frames:v',str(frames),'-c:v','libx264','-preset','veryfast','-crf','19','-threads','2','-an','-y',str(target)])
 print('Rendered slide',s['slide'],flush=True);return target
intro=SEG/'intro-branded.mp4'
if not intro.exists():
 run(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-hide_banner','-loglevel','error','-loop','1','-i',str(P/'slides/intro.png'),'-i',str(J/'intro.mp4'),'-filter_complex','[1:v]crop=400:720:440:0,scale=500:900,fps=25[p];[0:v][p]overlay=1280:94:shortest=1,fps=25,setsar=1,format=yuv420p[v]','-map','[v]','-an','-frames:v','456','-c:v','libx264','-preset','veryfast','-crf','19','-y',str(intro)])
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:paths=list(pool.map(render,timeline))
if not complete:print('Prepared intro and',len(timeline),'slide segments');sys.exit()
# Normalize each narration segment separately, preserving its duration and natural pace.
audios=[J/'intro.mp4',J/'01-two-models.wav',J/'02-enterprise-and-buyers.wav']+[J/'local-speech'/f"{c['key']}.wav" for c in manifest]
audio_dir=J/'normalized';audio_dir.mkdir(exist_ok=True);audio_paths=[]
for i,a in enumerate(audios):
 o=audio_dir/f'{i:03d}.wav'
 if not o.exists():
  filt='loudnorm=I=-18:TP=-2:LRA=8,aresample=48000'
  if i==0:filt+=',apad,atrim=duration=18.24'
  run(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-hide_banner','-loglevel','error','-i',str(a),'-vn','-af',filt,'-ar','48000','-ac','2','-c:a','pcm_s16le','-y',str(o)])
 audio_paths.append(o)
def concatlist(name,paths):
 f=J/name;f.write_text(''.join("file '"+str(p).replace("'","'\\''")+"'\n" for p in paths));return f
vl=concatlist('video-concat.txt',[intro]+paths);al=concatlist('audio-concat.txt',audio_paths)
run(['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(al),'-c:a','pcm_s16le','-y',str(J/'narration.wav')])
length=probe(J/'narration.wav');music=ROOT/'studio/.local/claude-edit-final/quiet-music.wav'
args=['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg','-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',str(vl),'-i',str(J/'narration.wav'),'-stream_loop','-1','-i',str(music),'-filter_complex',f'[2:a]volume=0.065,afade=t=in:d=3,afade=t=out:st={max(0,length-4)}:d=4[m];[1:a][m]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89[a]','-map','0:v','-map','[a]','-vf',f"ass={P/'full-video.ass'}",'-c:v','libx264','-preset','veryfast','-crf','19','-threads','4','-c:a','aac','-b:a','192k','-t',str(length),'-movflags','+faststart','-y',str(P/'full-video.mp4')]
run(args);print('Finished full video:',length,'seconds',flush=True)
