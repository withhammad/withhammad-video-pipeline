"""Extract an actual take frame and matte it with the installed video-effects engine."""
import importlib.util,json,subprocess,sys
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[2];keyword=sys.argv[1] if len(sys.argv)>1 else 'HIGGS';job={'HIGGS':'ee41d72bf8cd','ADVISOR':'62eec03e1e93','FABLE':'c5bc128a0a8d','CLONE':'0e375e205e9d'}[keyword];time=float(sys.argv[2]) if len(sys.argv)>2 else (4.24 if keyword=='HIGGS' else 27.0 if keyword=='ADVISOR' else None);
if time is None:raise ValueError('FABLE/CLONE need an explicitly inspected avatar frame time')
out=root/'studio/.local/jobs'/job/'referral-v4/covers';out.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-y','-v','error','-ss',str(time),'-i',str(out.parent/'avatar.mp4'),'-frames:v','1',str(out/'pose-original.png')],check=True)
stream=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=r_frame_rate','-of','json',str(out.parent/'avatar.mp4')]))['streams'][0]
num,den=stream['r_frame_rate'].split('/');native_fps=float(num)/float(den)
spec=importlib.util.spec_from_file_location('effectprep','/Users/hammad/.codex/skills/video-effects/prep.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
im=np.asarray(Image.open(out/'pose-original.png').convert('RGB'));alpha=mod.fill_holes(mod.Matte()(im,settle=True))
Image.fromarray(np.dstack([im,alpha]),'RGBA').resize((1072,1920),Image.Resampling.LANCZOS).save(out/'pose-cutout.png')
(out/'provenance.json').write_text(json.dumps({'source':'../avatar.mp4','frameTime':time,'frame':round(time*native_fps),'nativeFps':native_fps,'selection':'Open eyes and smiling expression in inspected 4fps filmstrip','matte':'Installed charlie947/video-effects prep.Matte, RobustVideoMatting resnet50; no regenerated face','template':'Existing brand GlowCover and GlowWide components; headline limits from glowCovers.ts'},indent=2)+'\n')
print(out/'pose-cutout.png')
