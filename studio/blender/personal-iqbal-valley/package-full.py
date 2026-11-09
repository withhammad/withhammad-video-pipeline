"""Package the approved walking treatment at the full reference length."""
from pathlib import Path
import hashlib,json,re,shutil,subprocess

ROOT=Path(__file__).resolve().parents[3]
WORK=ROOT/'work/personal-iqbal-3d'
SOURCE=ROOT/'work/reference-DfgtetEsqUB/reference.mp4'
OUT=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal')
final=OUT/'Andalus-Blender-full.mp4'
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'full-picture.mp4'),'-i',str(SOURCE),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(final)],check=True)
def packets(p):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash,pts_time','-of','json',str(p)]))['packets']
a,b=packets(SOURCE),packets(final);assert a==b
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(final)]))
v=next(s for s in meta['streams'] if s['codec_type']=='video')
assert (v['codec_name'],v['width'],v['height'],int(v['nb_frames']),v['color_range'])==('h264',1920,1080,885,'tv')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(final),'-vf','fps=1,scale=480:270,tile=6x6','-frames:v','1',str(WORK/'full-sheet.jpg')],check=True)
for i,t in enumerate([0,9,12,18,21,27,33]):
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(final),'-frames:v','1',str(WORK/f'full-shot-{i}.jpg')],check=True)
code=(ROOT/'studio/remotion/src/personal-iqbal/valley-film.tsx').read_text()
verses=re.findall(r"from:(\d+),to:(\d+),ar:'([^']+)',roman:'([^']+)',en:'([^']+)'",code)
def ts(frame):
 ms=round(int(frame)/25*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'
(OUT/'Andalus-Blender-full.srt').write_text('\n'.join(f'{i+1}\n{ts(fr)} --> {ts(to)}\n{ar}\n{roman}\n{en}\n' for i,(fr,to,ar,roman,en) in enumerate(verses)))
proof={'status':'full_render_awaiting_final_visual_review','scope':'Personal only; no publishing','file':str(final),
 'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'duration':meta['format']['duration'],'audio_packets_unchanged':len(a),
 'audio_packet_hashes_and_pts_equal':True,'video':v,'owner_sample_approval':'Use this for the full video',
 'treatment':'Approved 3D mesh and walking cycle across valley and courtyard; scenic river and terrace shots. Original audio and multilingual captions.',
 'heygen_credits':0,'external_paid_generation_submitted':False,'probe':meta}
(WORK/'full-proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'file':str(final),'duration':proof['duration'],'audio_packets_unchanged':len(a)}))
