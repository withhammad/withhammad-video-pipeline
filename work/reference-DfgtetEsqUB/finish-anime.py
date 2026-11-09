"""Mux and verify the separate anime walking video; never publish it."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
WORK=Path(__file__).parent
OUT=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal')
FINAL=OUT/'Andalus-anime-walking.mp4'
def run(args): return subprocess.run(args,capture_output=True,check=True)
def ahash(p): return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-c:a','copy','-f','adts','pipe:1']).stdout).hexdigest()
frames=sorted((ROOT/'studio/remotion/public/personal-iqbal-anime/walk').glob('walk-*.png'))
assert len(frames)==150, f'Incomplete Blender sequence: {len(frames)}'
run(['ffmpeg','-y','-i',str(WORK/'anime/picture.mp4'),'-i',str(WORK/'reference.mp4'),'-map','0:v:0','-map','1:a:0','-c','copy','-map_metadata','-1','-movflags','+faststart','-metadata','title=Andalus — personal anime walking film',str(FINAL)])
probe=json.loads(run(['ffprobe','-v','error','-show_entries','stream=codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate,nb_frames:format=duration,size','-of','json',str(FINAL)]).stdout)
meter=run(['ffmpeg','-hide_banner','-i',str(FINAL),'-vn','-af','loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr.decode()
audio=json.loads(meter[meter.rfind('{'):meter.rfind('}')+1])
source_hash,final_hash=ahash(WORK/'reference.mp4'),ahash(FINAL)
assert source_hash==final_hash,'Changed original audio'
v=probe['streams'][0]
assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'],v['color_range'],v['nb_frames'])==('h264',1920,1080,'yuv420p','tv','885'),v
assert -15<=float(audio['input_i'])<=-13 and float(audio['input_tp'])<=-1.5,audio
run(['ffmpeg','-y','-i',str(FINAL),'-vf','fps=1,scale=320:180,tile=6x6','-frames:v','1',str(OUT/'anime-filmstrip.jpg')])
run(['ffmpeg','-y','-i',str(FINAL),'-t','3','-vf','fps=4,scale=480:270,tile=4x3','-frames:v','1',str(OUT/'anime-walking-check.jpg')])
for name,t in [('anime-cover.jpg','7'),('anime-first-frame.jpg','0'),('anime-last-frame.jpg','35.35')]:
    run(['ffmpeg','-y','-ss',t,'-i',str(FINAL),'-frames:v','1','-q:v','2',str(OUT/name)])
shutil.copy2(OUT/'photos-captions.srt',OUT/'anime-captions.srt')
proof={'scope':'personal video only; explicitly not for any business account',
 'status':'ready_for_owner_review','reference':'https://www.instagram.com/reel/DfgtetEsqUB/',
 'owner_correction':'Anime/cartoon of Hammad actually walking through scenes and valleys, animated in Blender or code. Keep original audio and captions; personal use only.',
 'animation':'Blender 5.2.3 LTS; 17-bone skinned 2D illustrated character, alternating knee/foot walking cycles, counter-swing arms, spine/head motion, blinks and hair. 150 RGBA animation frames composited on travelling paths in Remotion.',
 'scenes':['Andalusian terrace','mountain valley','river promenade','palace courtyard','valley return'],
 'no_source_video_imagery':True,'no_heygen':True,'heygen_credits':0,'paid_generation_credits':0,'published':False,
 'probe':probe,'audio_lufs':float(audio['input_i']),'true_peak_dbtp':float(audio['input_tp']),
 'source_audio_sha256':source_hash,'final_audio_sha256':final_hash,'sha256':hashlib.sha256(FINAL.read_bytes()).hexdigest(),
 'supersedes':['Andalus-personal-edit.mp4','Andalus-personal-photos.mp4']}
(OUT/'anime-quality-report.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
(OUT/'README.md').write_text('''# Andalus — personal anime walking film

Current video: **Andalus-anime-walking.mp4**. Earlier source-footage and photo-motion versions are superseded.

Hammad is a full-body illustrated cartoon character walking through a terrace, mountain valley, riverside and courtyard. A Blender skeleton animates the legs, knees, feet, counter-swinging arms, spine, head, blinking and hair. Remotion composites those moving character frames along scene paths. This is layered 2D anime character animation.

Original recitation and music preserved byte for byte; Arabic, Roman Urdu and English captions retained. No HeyGen, source video imagery, title cards or business branding. 35.409 seconds, 1920×1080,25 fps,H.264 limited-range Rec.709. Audio −14.36 LUFS / −1.51 dBTP.

**Personal use only. No business inbox, guide page, keyword bot, posting queue or public upload.** The owner explicitly said he will use this file himself.

Audio: owner-supplied [@multazimmominx reference](https://www.instagram.com/reel/DfgtetEsqUB/), Allama Iqbal poetry. Illustrations are fictional creative scenes, generated with the built-in image tool from Hammad’s saved identity reference. No paid generation or HeyGen credits. Blender rig and scripts are in `studio/blender/personal-iqbal-anime`; prompts and `.blend` file in `work/reference-DfgtetEsqUB/anime`; composition `studio/remotion/src/personal-iqbal/anime.tsx`.
''')
downloads=Path('/Users/hammad/Downloads/9 November/Personal');downloads.mkdir(parents=True,exist_ok=True)
for name in [FINAL.name,'anime-captions.srt','anime-cover.jpg']:
    shutil.copy2(OUT/name,downloads/name)
print(json.dumps(proof,ensure_ascii=False,indent=2))
