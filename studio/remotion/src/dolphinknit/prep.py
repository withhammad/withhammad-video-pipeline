"""Public dir for the private golden-dolphin reel: the reference's own audio (PCM copy of its AAC track, untouched) and the
Blender plate frames.  /usr/bin/python3 -I studio/remotion/src/dolphinknit/prep.py <job dir> [cover frame]"""
import shutil
import subprocess
import sys
from pathlib import Path

job = Path(sys.argv[1])
pub = job / 'knit' / 'public'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'ref' / 'ref.mp4'), '-vn', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
link = pub / 'blender'
if not link.exists():
    link.symlink_to(job / 'knit' / 'blender' / 'frames', target_is_directory=True)
if len(sys.argv) > 2:
    shutil.copy(job / 'knit' / 'blender' / 'frames' / f'f{int(sys.argv[2]):04d}.jpg', pub / 'cover_bg.jpg')
print('ok', sorted(p.name for p in pub.iterdir()))
