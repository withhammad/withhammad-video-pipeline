"""Final mux for the private knitted Yunus (as-Saffat 37:139-146) reel: the Remotion picture + the reference audio, mastered.

    cd studio && .venv/bin/python -I remotion/src/yunusknit/finish.py <job dir> <render.mp4>

1. The picture from the Remotion render (H.264, re-encoded only if it is not limited range) and public/audio.wav (the
   reference's 48 kHz stereo track, lookahead-limited, from prep.py) are muxed with no audio processing at all.
2. app.audio.master: two-pass loudnorm in linear mode (a single gain) to -14 LUFS / -1.5 dBTP, resampled to 48 kHz, AAC
   192k. No time-stretch, no speed or pitch change.
3. A 720p review copy under 2.5 MB (scale 720x1280, two-pass x264 at 270 kb/s, AAC 64k).
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
# 57 s of knit texture does not fit 2.5 MB at any sane crf: two-pass 270k video + 64k AAC lands at ~2.46 MB
log = str(knit / 'x264pass')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(knit / 'final.mp4'), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-b:v', '270k', '-pass', '1',
                '-preset', 'slow', '-passlogfile', log, '-an', '-f', 'mp4', os.devnull], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(knit / 'final.mp4'), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-b:v', '270k', '-pass', '2',
                '-preset', 'slow', '-passlogfile', log, '-pix_fmt', 'yuv420p', '-color_range', 'tv', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart',
                str(prev)], check=True)
assert prev.stat().st_size < 2.5e6, prev.stat().st_size
print('preview', prev.stat().st_size)
