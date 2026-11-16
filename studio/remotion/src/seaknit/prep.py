"""Public dir for the private knitted "The sea split in two" reel (SEA-KNIT). Run after the Blender plate:

    studio/.venv/bin/python -I studio/remotion/src/seaknit/prep.py <job dir> [cover frame]

Reads <job>/knit/blender/frames/f0000.jpg ... and geom.json (studio/blender/seaknit/build.py). Writes <job>/knit/public/:
  blender/f0000.jpg ...   the 3D plate (copied), blender/cover.jpg (the cover frame, default 228), and the composition's geom.json
  fonts/                  Amiri Quran (plain build) and Instrument Serif, copied in by hand from earlier knitted jobs
  audio.wav               the reference's own 44.1 kHz stereo track from source.mp4 (not the 16 kHz intake copy), untouched:
                          PCM 24-bit, padded with silence to the last frame. Limiter and master happen in finish.py.
"""
import shutil
import subprocess
import sys
from pathlib import Path

job = Path(sys.argv[1])
cover = int(sys.argv[2]) if len(sys.argv) > 2 else 228
knit = job / 'knit'
src, pub = knit / 'blender', knit / 'public'
(pub / 'blender').mkdir(parents=True, exist_ok=True)
FRAMES = 416
missing = [f for f in range(FRAMES) if not (src / 'frames' / f'f{f:04d}.jpg').exists()]
assert not missing, f'missing Blender frames: {missing[:10]}...'
for f in range(FRAMES):
    shutil.copy2(src / 'frames' / f'f{f:04d}.jpg', pub / 'blender' / f'f{f:04d}.jpg')
shutil.copy2(src / 'frames' / f'f{cover:04d}.jpg', pub / 'blender' / 'cover.jpg')
shutil.copy2(src / 'geom.json', Path(__file__).resolve().parent / 'geom.json')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-vn', '-c:a', 'pcm_s24le', '-ar', '44100',
                '-ac', '2', '-af', f'apad=whole_dur={FRAMES / 30}', str(pub / 'audio.wav')], check=True)
print('public ready:', FRAMES, 'frames, cover', cover, ', audio.wav from source.mp4 (stereo, 44.1 kHz, padded to', FRAMES / 30, 's)')
