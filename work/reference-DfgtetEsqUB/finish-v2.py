"""Package the owner's personal photo animation, preserving the reference audio."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).parent
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal')
FINAL = OUT / 'Andalus-personal-photos.mp4'

def run(args):
    return subprocess.run(args, capture_output=True, check=True)

def audio_hash(path):
    return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0',
        '-c:a','copy','-f','adts','pipe:1']).stdout).hexdigest()

OUT.mkdir(parents=True, exist_ok=True)
run(['ffmpeg','-y','-i',str(WORK/'picture-v2.mp4'),'-i',str(WORK/'reference.mp4'),
     '-map','0:v:0','-map','1:a:0','-c','copy','-map_metadata','-1','-movflags','+faststart',
     '-metadata','title=Andalus — personal photo animation',str(FINAL)])
probe = json.loads(run(['ffprobe','-v','error','-show_entries',
    'stream=codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate,nb_frames:format=duration,size',
    '-of','json',str(FINAL)]).stdout)
meter = run(['ffmpeg','-hide_banner','-i',str(FINAL),'-vn','-af',
    'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr.decode()
audio = json.loads(meter[meter.rfind('{'):meter.rfind('}')+1])
source_hash, final_hash = audio_hash(WORK/'reference.mp4'), audio_hash(FINAL)
assert source_hash == final_hash, 'Reference audio was changed'
v = probe['streams'][0]
assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'],v['color_range'],v['nb_frames']) == ('h264',1920,1080,'yuv420p','tv','885'), v
assert -15 <= float(audio['input_i']) <= -13 and float(audio['input_tp']) <= -1.5, audio
run(['ffmpeg','-y','-i',str(FINAL),'-vf','fps=1,scale=320:180,tile=6x6','-frames:v','1',str(OUT/'photos-filmstrip.jpg')])
for name, time in [('photos-cover.jpg','1'),('photos-river.jpg','12'),('photos-last-frame.jpg','35.35')]:
    run(['ffmpeg','-y','-ss',time,'-i',str(FINAL),'-frames:v','1','-q:v','2',str(OUT/name)])

srt = (OUT/'captions.srt').read_text().replace('00:00:30,720','00:00:35,400')
(OUT/'photos-captions.srt').write_text(srt)
photos = ROOT/'studio/remotion/public/personal-iqbal-v2'
proof = {
    'scope':'separate personal video; excluded from business inbox, queue, website and keyword bots',
    'status':'ready_for_owner_review', 'reference':'https://www.instagram.com/reel/DfgtetEsqUB/',
    'owner_correction':'Animate my photos, no HeyGen. Remove the existing footage; retain audio and captions.',
    'source_credit':'Audio supplied in @multazimmominx reference; poem by Allama Iqbal',
    'new_work':'Three generated photo scenes preserving Hammad identity, six verse-timed camera moves, cleaned Arabic/Roman Urdu/English captions. No source video imagery, title cards, haze, lip sync or business branding.',
    'animation_type':'frame-driven pan and zoom of still photos; not character animation',
    'photos':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(photos.glob('*.png'))},
    'heygen_credits':0, 'published':False, 'probe':probe,
    'audio_lufs':float(audio['input_i']), 'true_peak_dbtp':float(audio['input_tp']),
    'source_audio_sha256':source_hash, 'final_audio_sha256':final_hash,
    'sha256':hashlib.sha256(FINAL.read_bytes()).hexdigest(),
    'supersedes':'Andalus-personal-edit.mp4 (rejected visual treatment; retained only as history)',
}
(OUT/'photos-quality-report.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
(OUT/'README.md').write_text('''# Andalus — personal photo animation

Current cut: **Andalus-personal-photos.mp4**. The earlier `Andalus-personal-edit.mp4` is superseded and is not the requested edit.

Hammad appears in three AI-generated photo scenes based on his saved portrait, animated with gentle camera pushes, pulls and pans across six verse beats. This is photo animation, not a speaking avatar or live character performance. All original reference video imagery is removed. There are no title cards, haze effects or business labels. Only the Arabic, Roman Urdu and English captions appear over the imagery.

The supplied recitation and music are unchanged: the encoded audio payload matches the reference byte for byte. The final caption and courtyard photo hold through the music tail. Landscape 1920×1080, 25 fps, 35.409 seconds. No HeyGen credits used; no publication or scheduling.

This personal project is excluded from the withhammad business pipeline. Audio source: the owner-supplied [@multazimmominx reel](https://www.instagram.com/reel/DfgtetEsqUB/). Poem: Allama Iqbal, Tarana-e-Milli, checked against [Iqbal Academy Pakistan](https://allamaiqbal.com/poetry.php?bookbup=22&conType=ur&lang=4&lang_code=ur&orderno=102). Imagery is a creative depiction, not documentary evidence of a visit.

Source images and their generation prompts are saved in the repository under `studio/remotion/public/personal-iqbal-v2/` and `work/reference-DfgtetEsqUB/image-prompts-v2.json`. Quality measurements, filmstrip, last frame and SRT are beside the video.
''')
downloads=Path('/Users/hammad/Downloads/9 November/Personal')
downloads.mkdir(parents=True,exist_ok=True)
for name in [FINAL.name,'photos-captions.srt','photos-cover.jpg']:
    shutil.copy2(OUT/name, downloads/name)
print(json.dumps(proof,ensure_ascii=False,indent=2))
