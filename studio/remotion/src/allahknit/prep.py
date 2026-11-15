"""Public files for the private knitted "Allah, Allah" reel (ALLAH-KNIT). Run after the Blender plate frames exist:

    python3 -I studio/remotion/src/allahknit/prep.py <job dir> [cover frame]

Writes <job>/knit/public/:
  plate.mp4     the Blender frames (<job>/knit/blender/plate/frames/f0000.jpg ...) at 30 fps, H.264 crf 12, limited range
  cover_bg.jpg  one plate frame for the cover (default 100: the heart half black, half clean)
  audio.wav     the reference's audio track as recorded (44.1 kHz stereo PCM): no cut, no stretch, no pitch change, no EQ
and copies the plate's geom.json (the heart's screen anchors per frame) next to this file for AllahKnit.tsx.
"""
import shutil
import subprocess
import sys
from pathlib import Path

job = Path(sys.argv[1])
cover_f = int(sys.argv[2]) if len(sys.argv) > 2 else 100
knit = job / 'knit'
pub = knit / 'public'
pub.mkdir(parents=True, exist_ok=True)
plate = knit / 'blender' / 'plate'
n = len(list((plate / 'frames').glob('f*.jpg')))
assert n == 300, f'{n} plate frames, expected 300'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', str(plate / 'frames' / 'f%04d.jpg'), '-c:v', 'libx264', '-crf', '12',
                '-preset', 'slow', '-pix_fmt', 'yuv420p', '-vf', 'scale=1080:1920:out_range=tv', '-color_range', 'tv', '-colorspace', 'bt709',
                str(pub / 'plate.mp4')], check=True)
shutil.copy(plate / 'frames' / f'f{cover_f:04d}.jpg', pub / 'cover_bg.jpg')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'ref' / 'ref.mp4'), '-vn', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
shutil.copy(plate / 'geom.json', Path(__file__).resolve().parent / 'geom.json')
print('public ready', pub)
