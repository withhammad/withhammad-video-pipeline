"""Final mux for the private knitted "Allah, Allah" heart reel: the Remotion picture + the reference audio, mastered.

    cd studio && .venv/bin/python -I remotion/src/allahknit/finish.py <job dir> <render.mp4>

1. The picture from the Remotion render (re-encoded to limited-range H.264) and public/audio.wav (the reference's own 44.1 kHz
   stereo track, untouched, from prep.py) are muxed with no audio processing at all; -shortest ends it on the last frame.
2. app.audio.master: two-pass loudnorm in linear mode (a single gain) to -14 LUFS / -1.5 dBTP, resampled to 48 kHz, AAC
   192k. No time-stretch, no speed or pitch change.
3. A 720p review copy under 2.5 MB (scale 720x1280, crf 28 preset veryslow, AAC 128k, 96k past crf 32; crf goes up until it fits).
Writes <job>/knit/final.mp4, <job>/knit/preview720.mp4 and <job>/knit/master.json.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from app.audio import master  # noqa: E402

job, render = Path(sys.argv[1]), Path(sys.argv[2])
knit = job / 'knit'
mux = knit / 'mux.mov'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(render), '-i', str(knit / 'public/audio.wav'), '-map', '0:v:0', '-map', '1:a:0',
                '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p',
                '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
                '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'pcm_s16le', '-shortest', str(mux)], check=True)
info = master(str(mux), str(knit / 'final.mp4'), I=-14, TP=-1.5)
json.dump(info, open(knit / 'master.json', 'w'), indent=1)
print('master', info['normalization_type'], info['output'])
os.remove(mux)

prev = knit / 'preview720.mp4'
for crf in (28, 30, 32, 34, 36, 38, 40):           # 10 s of knit texture: the crf climbs until the copy fits under 2.5 MB
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(knit / 'final.mp4'), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-crf', str(crf),
                    '-preset', 'veryslow', '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '96k' if crf > 32 else '128k',
                    '-movflags', '+faststart', str(prev)], check=True)
    if prev.stat().st_size < 2.5e6:
        break
print('preview', crf, prev.stat().st_size)
