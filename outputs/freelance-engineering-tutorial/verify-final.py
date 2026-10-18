"""Verify the complete local export, captions, audio levels, and sampled privacy frames."""
from pathlib import Path
import json,subprocess,re,hashlib,concurrent.futures
P=Path(__file__).resolve().parent;J=P.parents[1]/'studio/.local/freelance-engineering-final';F='/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';FP='/opt/homebrew/opt/ffmpeg-full/bin/ffprobe'
v=P/'full-video.mp4';info=json.loads(subprocess.check_output([FP,'-v','error','-show_streams','-show_format','-of','json',str(v)]));video=next(s for s in info['streams'] if s['codec_type']=='video');audio=next(s for s in info['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'])==(1920,1080);assert video['codec_name']=='h264';assert audio['codec_name']=='aac'
expected=18.24+sum(json.loads((J/(n+'.json')).read_text())['duration'] for n in ['01-two-models','02-enterprise-and-buyers'])+sum(json.loads((J/'local-speech'/f"{c['key']}.json").read_text())['duration'] for c in json.loads((J/'local-speech/manifest.json').read_text()))
duration=float(info['format']['duration']);assert abs(duration-expected)<.15,(duration,expected)
frames=J/'final-audit';frames.mkdir(exist_ok=True)
subprocess.run([F,'-hide_banner','-loglevel','error','-i',str(v),'-vf','fps=1/20','-q:v','2','-y',str(frames/'%04d.jpg')],check=True)
analysis=subprocess.run([F,'-hide_banner','-i',str(v),'-vn','-af','loudnorm=I=-18:TP=-1:LRA=8:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
(J/'audio-analysis.log').write_text(analysis.stderr)
m=re.findall(r'\{\s*"input_i".*?\}',analysis.stderr,re.S);levels=json.loads(m[-1]);assert -24<float(levels['input_i'])<-12,levels;assert float(levels['input_tp'])<0,levels
files=sorted(frames.glob('*.jpg'))
def ocr(f):
 r=subprocess.run(['tesseract',str(f),'stdout'],capture_output=True,text=True,check=True)
 return {'frame':f.name,'restricted_match':any(x in r.stdout.lower() for x in ['promat','promet'])}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:checks=list(pool.map(ocr,files))
assert len(checks)>=49;assert not any(c['restricted_match'] for c in checks)
c=json.loads((J/'caption-timing.json').read_text());assert all(0<=x['start']<x['end']<=duration+.05 for x in c)
assert all(c[i]['end']<=c[i+1]['start']+.10 for i in range(len(c)-1))
result={'status':'passed','video':'full-video.mp4','duration_seconds':duration,'size_bytes':v.stat().st_size,'sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'resolution':[1920,1080],'fps':video['r_frame_rate'],'video_codec':video['codec_name'],'audio_codec':audio['codec_name'],'integrated_loudness_lufs':float(levels['input_i']),'true_peak_dbtp':float(levels['input_tp']),'decoded_full_video':True,'decoded_full_audio':True,'frames_ocr_checked':len(checks),'restricted_brand_matches':0,'caption_cues':len(c),'expected_duration_seconds':expected,'checks':checks}
(P/'final-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
