"""Package the separate personal edit; no pipeline registration or publishing."""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = Path(__file__).parent
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal')
OUT.mkdir(parents=True, exist_ok=True)
FINAL = OUT / 'Andalus-personal-edit.mp4'

def run(args):
    p = subprocess.run(args, capture_output=True, check=True)
    return p

run(['ffmpeg','-y','-i',str(WORK/'picture.mp4'),'-i',str(WORK/'reference.mp4'),
     '-map','0:v:0','-map','1:a:0','-c','copy','-map_metadata','-1','-movflags','+faststart',
     '-metadata','title=Andalus — Allama Iqbal (personal edit)',str(FINAL)])
probe=json.loads(run(['ffprobe','-v','error','-show_entries',
    'stream=codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate,nb_frames:format=duration,size',
    '-of','json',str(FINAL)]).stdout)
meter=run(['ffmpeg','-hide_banner','-i',str(FINAL),'-vn','-af',
    'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json','-f','null','-']).stderr.decode()
audio=json.loads(meter[meter.rfind('{'):meter.rfind('}')+1])
def audio_hash(p):
    return hashlib.sha256(run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0',
        '-c:a','copy','-f','adts','pipe:1']).stdout).hexdigest()
source_audio=audio_hash(WORK/'reference.mp4')
final_audio=audio_hash(FINAL)
assert source_audio == final_audio, 'Source audio was changed'
v=probe['streams'][0]
assert (v['codec_name'],v['width'],v['height'],v['pix_fmt'],v['color_range'],v['nb_frames']) == ('h264',1920,1080,'yuv420p','tv','885'), v
assert -15 <= float(audio['input_i']) <= -13 and float(audio['input_tp']) <= -1.5, audio
run(['ffmpeg','-y','-i',str(FINAL),'-vf','fps=1,scale=320:180,tile=6x6','-frames:v','1',str(OUT/'filmstrip.jpg')])
run(['ffmpeg','-y','-ss','32.8','-i',str(FINAL),'-frames:v','1','-q:v','2',str(OUT/'cover.jpg')])

lines=[
 ('00:00:00,000','00:00:05,760','يا بستان الأندلس، أتذكر تلك الأيام؟','Ae gulistan-e-Andalus, woh din hain yaad tujh ko','O garden of Andalus, do you remember those days?'),
 ('00:00:05,760','00:00:10,600','حين كان عشنا بين أغصانك','Tha teri daaliyon par jab aashiyaan hamaara','When our nest rested among your branches?'),
 ('00:00:10,600','00:00:15,360','يا أمواج دجلة، ألا تزالين تعرفيننا؟','Ae mauj-e-Dijla, tu bhi pehchaanti hai hum ko','O waves of the Tigris, do you still recognise us?'),
 ('00:00:15,360','00:00:19,800','لا يزال نهرك يروي حكايتنا','Ab tak hai tera darya afsaana-khwaan hamaara','Your river still tells our story.'),
 ('00:00:19,800','00:00:24,240','يا أرض الطهر، بذلنا أرواحنا صونًا لحرمتك','Ae arz-e-paak, teri hurmat pe kat mare hum','O sacred land, we gave our lives for your honour.'),
 ('00:00:24,240','00:00:30,720','لا يزال دمنا يجري في عروقك','Hai khoon teri ragon mein ab tak rawaan hamaara','Our blood still flows through your veins.'),
]
(OUT/'captions.srt').write_text('\n\n'.join(f'{i}\n{start} --> {end}\n{ar}\n{roman}\n{en}' for i,(start,end,ar,roman,en) in enumerate(lines,1))+'\n')
proof={'scope':'separate personal video; excluded from business queue','status':'ready_for_owner_review',
       'reference':'https://www.instagram.com/reel/DfgtetEsqUB/','source_credit':'@multazimmominx',
       'new_work':'Animated opening and closing card, re-typeset and corrected three-language subtitles; source footage and audio retained.',
       'heygen_credits':0,'published':False,'probe':probe,'audio_lufs':float(audio['input_i']),
       'true_peak_dbtp':float(audio['input_tp']),'source_audio_sha256':source_audio,'final_audio_sha256':final_audio,
       'sha256':hashlib.sha256(FINAL.read_bytes()).hexdigest()}
(OUT/'quality-report.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
(OUT/'README.md').write_text('''# Andalus — personal edit

35-second landscape edit of the supplied @multazimmominx reel. The original travel footage, recitation and music are retained and credited. This is not a new shoot or Hammad voice generation. Added animated titles and closing card; corrected and re-typeset Arabic, Roman Urdu and English subtitles. The audio stream is byte-identical to the reference.

No HeyGen credits spent. No posting or scheduling. Excluded from the withhammad business pipeline.

Poem: Allama Iqbal, Tarana-e-Milli. Attribution checked against [Iqbal Academy Pakistan](https://allamaiqbal.com/poetry.php?bookbup=22&conType=ur&lang=4&lang_code=ur&orderno=102).
''')
downloads=Path('/Users/hammad/Downloads/9 November/Personal');downloads.mkdir(parents=True,exist_ok=True)
shutil.copy2(FINAL,downloads/FINAL.name)
shutil.copy2(OUT/'captions.srt',downloads/'Andalus-personal-edit.srt')
shutil.copy2(OUT/'cover.jpg',downloads/'Andalus-cover.jpg')
print(json.dumps(proof,ensure_ascii=False,indent=2))
