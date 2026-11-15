"""Public files for the private knitted Yunus reel (YUNUS-KNIT). Run after the Blender plate frames exist:

    studio/.venv/bin/python -I studio/remotion/src/yunusknit/prep.py <job dir> [cover frame]

Writes <job>/knit/public/:
  plate.mp4     the Blender frames (<job>/knit/blender/frames/f0000.jpg ...) at 30 fps, H.264 crf 12
  geom.json     the per-frame screen anchors build.py exported (moon, lantern, sun) for the glows
  cover_bg.jpg  one plate frame for the cover (default: the breach at frame 66)
  audio.wav     the reference audio: the 48 kHz stereo track of source.mp4, through a lookahead-compensated peak limiter at
                -2.5 dBFS (alimiter latency=1: the limiter's delay is taken out, so the recitation stays on its clock), padded
                with silence to the last frame (57.067 s, 1712 frames). Nothing else: no cut, no time-stretch, no speed or pitch
                change, no EQ, no fade. app.audio.master (finish.py) then applies one gain to -14 LUFS / -1.5 dBTP.
"""
import shutil
import subprocess
import sys
from pathlib import Path

job = Path(sys.argv[1])
cover_f = int(sys.argv[2]) if len(sys.argv) > 2 else 66
knit = job / 'knit'
pub = knit / 'public'
pub.mkdir(parents=True, exist_ok=True)
frames = knit / 'blender' / 'frames'
n = len(list(frames.glob('f*.jpg')))
assert n == 1712, f'{n} plate frames, expected 1712'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', str(frames / 'f%04d.jpg'), '-c:v', 'libx264', '-crf', '12', '-preset', 'slow',
                '-pix_fmt', 'yuv420p', '-vf', 'scale=1080:1920:out_range=tv', '-color_range', 'tv', '-colorspace', 'bt709', str(pub / 'plate.mp4')],
               check=True)
shutil.copy(knit / 'blender' / 'geom.json', pub / 'geom.json')
shutil.copy(frames / f'f{cover_f:04d}.jpg', pub / 'cover_bg.jpg')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-af',
                'alimiter=limit=0.7499:attack=5:release=60:level=disabled:latency=1,apad=whole_dur=57.0667',
                '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(pub / 'audio.wav')], check=True)
print('plate', n, 'frames; audio', pub / 'audio.wav')
