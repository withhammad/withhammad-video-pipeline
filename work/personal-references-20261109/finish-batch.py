"""Local personal-video renders. Run under studio/heavy.sh, one film at a time.

No publishing, APIs, new voices or credit spending. Audio is remuxed unchanged,
except one reference given a constant -1 dB gain to meet the true-peak ceiling.
The final files still require visual review before being marked delivered.
"""
from pathlib import Path
import hashlib,json,math,subprocess,sys

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent
REMOTION=ROOT/'studio/remotion'
OUT=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Poetry')
OUT.mkdir(exist_ok=True)
CLIPS=REMOTION/'public/personal-poetry/clips';CLIPS.mkdir(exist_ok=True)
AUDIO_GAIN_DB={'DfLqb8qtYRh':-1.0} # source peak -0.88 dBTP; preserve pace and mix
subprocess.run(['node',str(WORK/'export-poems.cjs')],check=True)
poems=json.loads((WORK/'poems.json').read_text())
selected=[p for p in poems if not sys.argv[1:] or p['id'] in sys.argv[1:]]
def capture(args):return subprocess.check_output(args,text=True)
def probe(path):return json.loads(capture(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
def packets(path):return json.loads(capture(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash,pts_time','-of','json',str(path)]))['packets']
def ts(seconds):
 ms=round(seconds*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'

for poem in selected:
 ident=poem['id'];folder=WORK/ident;src=folder/'source.mp4';picture=folder/'picture.mp4'
 comp='Poetry-'+ident.replace('_','X');print('BUILD',ident,flush=True)
 if 'crop' in poem:
  x,y,w,h=poem['crop'];clip=CLIPS/(ident+'.mp4')
  if not clip.exists():
   subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-an','-vf',f'crop={w}:{h}:{x}:{y}:exact=1,scale=972:546:flags=lanczos,setsar=1',
     '-c:v','libx264','-crf','17','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(clip)],check=True)
 if not picture.exists():
  with (folder/'render.log').open('w') as log:
   subprocess.run(['npx','remotion','render','src/personal-iqbal/poetry.tsx',comp,str(picture),'--codec=h264','--crf=18','--concurrency=2','--overwrite'],cwd=REMOTION,stdout=log,stderr=subprocess.STDOUT,check=True)
 final=OUT/(poem['slug']+'.mp4')
 gain=AUDIO_GAIN_DB.get(ident)
 codecs=['-c','copy'] if gain is None else ['-c:v','copy','-af',f'volume={gain}dB','-c:a','aac','-b:a','192k']
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(picture),'-i',str(src),'-map','0:v:0','-map','1:a:0',*codecs,'-movflags','+faststart',str(final)],check=True)
 a,b=packets(src),packets(final)
 if gain is None:
  assert [p['data_hash'] for p in a]==[p['data_hash'] for p in b],ident+' audio changed'
  assert abs(float(a[0]['pts_time'])-float(b[0]['pts_time']))<.001,ident+' audio offset changed'
 meta=probe(final);v=next(s for s in meta['streams'] if s['codec_type']=='video')
 frames=math.ceil(poem['duration']*30)
 assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'],v['color_range'],int(v['nb_frames']))==('h264',1080,1920,'yuv420p','tv',frames)
 assert abs(float(meta['format']['duration'])-poem['duration'])<.07
 captions=[]
 for i,line in enumerate(poem['verses']):
  end=poem['verses'][i+1]['start'] if i+1<len(poem['verses']) else poem['duration']
  captions.append(f"{i+1}\n{ts(line['start'])} --> {ts(end)}\n{line['ur']}\n{line['en']}\n")
 (OUT/(poem['slug']+'.srt')).write_text('\n'.join(captions))
 rows=math.ceil(poem['duration']/6)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(final),'-vf',f'fps=1,scale=216:384,tile=6x{rows}','-frames:v','1',str(folder/'final-sheet.jpg')],check=True)
 for second in [0,round(poem['duration']/2,2),round(poem['duration']-.2,2)]:
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(second),'-i',str(final),'-frames:v','1',str(folder/f'final-{second}.jpg')],check=True)
 proof={'id':ident,'file':str(final),'status':'rendered_awaiting_visual_review','source':'https://www.instagram.com/reel/'+ident+'/',
  'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'source_seconds':poem['duration'],'duration':meta['format']['duration'],'frames':frames,
  'audio_packets_unchanged':len(a) if gain is None else 0,'all_audio_packet_hashes_equal':gain is None,'original_audio_start_preserved':gain is None,'constant_audio_gain_db':gain,'video':v,
  'treatment':'Original moving reference inserts with new photorealistic Hammad backdrop and timed bilingual captions' if poem.get('crop') else 'Photorealistic Hammad scenes with camera motion and timed bilingual captions',
  'scope':'Personal only; no publishing, scheduling, website or business queue','heygen_credits':0,
  'notes':['The supplied source ends mid-verse; its full available audio is preserved.'] if ident=='DfBVYpUMJAw' else []}
 (folder/'proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
 print('RENDERED',poem['slug'],proof['duration'],len(a),'original AAC packets' if gain is None else f'source packets; constant {gain} dB gain',flush=True)
