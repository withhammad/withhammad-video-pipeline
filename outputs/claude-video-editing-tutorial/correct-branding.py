"""Replace the affected screen recording with a freshly captured personal-account walkthrough."""
from pathlib import Path
import subprocess,json,hashlib
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[1];JOB=ROOT/'studio/.local/claude-edit-final'
source=OUT/'full-tutorial.mp4';target=OUT/'full-tutorial-corrected.mp4'
recording=JOB/'claude-clean-replacement.mp4'
filters="[1:v]trim=start=0:duration=33,setpts=PTS-STARTPTS+92/TB,scale=1920:874:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=1920:876:(ow-iw)/2:(oh-ih)/2:color=0xeef2f7,setsar=1[clean];[0:v][clean]overlay=0:74:eof_action=pass:enable='gte(t,92)*lt(t,125)'[v]"
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-i',str(recording),'-filter_complex',filters,'-map','[v]','-map','0:a','-c:v','libx264','-preset','fast','-crf','18','-c:a','copy','-movflags','+faststart',str(target)],check=True)
report={'input_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'output':target.name,'replacement_recording':str(recording),'interval_seconds':[92,125],'recording':'Fresh Chrome walkthrough after owner changed personal account name; sidebar hidden','audio':'unchanged','timing':'unchanged','status':'rendered_pending_privacy_review'}
(OUT/'branding-correction.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
