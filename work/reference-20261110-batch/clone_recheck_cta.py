import json,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'studio'))
from app.reel import transcribe_words
p=root/'studio/.local/jobs/0e375e205e9d/referral-v4'
subprocess.run(['ffmpeg','-v','error','-y','-ss','50.6','-i',str(p/'narration_original.mp3'),'-t','3.7','-c:a','pcm_s16le',str(p/'cta-recheck.wav')],check=True)
w=transcribe_words(p/'cta-recheck.wav')
(p/'cta-independent-transcript.json').write_text(json.dumps(w,indent=2)+'\n');print(json.dumps(w,indent=2))
