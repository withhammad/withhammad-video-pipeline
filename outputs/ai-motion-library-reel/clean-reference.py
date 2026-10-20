"""Remove source-presenter pixels before retiming, including cut guard frames."""
from pathlib import Path
import subprocess,json
r=Path(__file__).resolve().parents[2];pub=r/'studio/remotion/public/motion-library'
split=[(0,3.10),(7.60,11.00),(12.35,18.65),(19.20,21.20)]
full=[(18.20,19.70),(25.75,30)]
filters=[f"drawbox=x=0:y=980:w=iw:h=ih-980:color=0x101820:t=fill:enable='between(t,{a},{b})'" for a,b in split]
filters += [f"drawbox=x=0:y=0:w=iw:h=ih:color=0x101820:t=fill:enable='between(t,{a},{b})'" for a,b in full]
subprocess.run(['ffmpeg','-y','-v','error','-i',str(pub/'reference.mp4'),'-an','-vf',','.join(['scale=1080:1920']+filters),'-c:v','libx264','-crf','17',str(pub/'reference-clean.mp4')],check=True)
(Path(__file__).parent/'face-removal-receipt.json').write_text(json.dumps({'source':'reference.mp4','clean':'reference-clean.mp4','split_mask_y':980,'split_source_seconds':split,'full_source_seconds':full,'method':'Opaque source-frame removal before retiming; no original presenter layer behind avatar','status':'pending_visual_validation'},indent=2)+'\n')
