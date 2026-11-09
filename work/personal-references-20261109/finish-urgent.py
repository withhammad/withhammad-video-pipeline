"""Package the full urgent personal reference without changing its audio."""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).resolve().parent/'DdS2umGNd5m'
OUT=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Dikhawa')
OUT.mkdir(exist_ok=True)
final=OUT/'Dikhawa-full-video.mp4'
def run(args):return subprocess.check_output(args,text=True)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def packets(p):return json.loads(run(['ffprobe','-v','error','-select_streams','a:0','-show_packets','-show_data_hash','sha256','-show_entries','packet=data_hash,pts_time','-of','json',str(p)]))['packets']
subprocess.run(['ffmpeg','-v','error','-y','-i',str(WORK/'picture.mp4'),'-i',str(WORK/'source.mp4'),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(final)],check=True)
a,b=packets(WORK/'source.mp4'),packets(final)
assert [p['data_hash'] for p in a]==[p['data_hash'] for p in b]
assert abs(float(a[0]['pts_time'])-float(b[0]['pts_time']))<.001
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(final)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video')
assert v['codec_name']=='h264' and v['width']==1080 and v['height']==1920 and v['pix_fmt']=='yuv420p' and v['color_range']=='tv'
assert int(v['nb_frames'])==356
srt='''1
00:00:00,000 --> 00:00:03,720
دکھاوا

2
00:00:03,720 --> 00:00:07,320
اور منافقت اتنی بری چیز ہے کہ

3
00:00:07,320 --> 00:00:10,200
ان پر عمل کرنے والا شخص

4
00:00:10,200 --> 00:00:11,863
گھاٹے ہی میں رہتا ہے
'''
(OUT/'Dikhawa-captions.srt').write_text(srt)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(final),'-vf','fps=1,scale=270:480,tile=6x2','-frames:v','1',str(WORK/'final-sheet.jpg')],check=True)
for t in ['0','5','11.4']:
 subprocess.run(['ffmpeg','-v','error','-y','-ss',t,'-i',str(final),'-frames:v','1',str(WORK/f'final-{t}.jpg')],check=True)
proof={'status':'full_personal_video_exported','scope':'personal only; no upload or scheduling','reference':'https://www.instagram.com/reel/DdS2umGNd5m/','file':str(final),'image':str(OUT/'Dikhawa-status.png'),'video_sha256':digest(final),'image_sha256':digest(OUT/'Dikhawa-status.png'),'source_seconds':11.86254,'picture_seconds':356/30,'audio_packets_unchanged':len(a),'full_audio_hash_sequence_equal':True,'original_audio_start_preserved':True,'probe':probe,'treatment':'New photorealistic personal artwork, slow camera push and timed Urdu captions. Animated image; no claim of character walking animation.','heygen_credits':0,'external_paid_generation_submitted':False,'publishing':False}
(OUT/'proof.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
dest=Path.home()/'Downloads/9 November/Personal'
dest.mkdir(parents=True,exist_ok=True)
for name in ['Dikhawa-full-video.mp4','Dikhawa-status.png','Dikhawa-captions.srt']:
 shutil.copy2(OUT/name,dest/name)
review=ROOT/'outputs/personal/reviews/2026-11-09-dikhawa.json';review.parent.mkdir(parents=True,exist_ok=True);review.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'outputs/personal/reference-inbox.json';d=json.loads(p.read_text());e=next(x for x in d['links'] if x['id']=='DdS2umGNd5m');e.update(status='finished_for_personal_use',video=str(final),review=str(review.relative_to(ROOT)));p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'video':str(final),'duration':probe['format']['duration'],'audio_packets_unchanged':len(a)},indent=2))
