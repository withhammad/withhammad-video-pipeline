"""Final mux for the private knitted "Grace of Allah" reel: the Remotion picture + the reference's own soundtrack, mastered.

    cd studio && .venv/bin/python -I remotion/src/lutfknit/finish.py <job dir> <render.mp4>

1. The picture (H.264 re-encoded to limited range BT.709) and public/audio.wav (the reference's 44.1 kHz stereo track, PCM,
   padded to the last frame) are muxed through one safety limiter only: alimiter at -2.0 dBFS with latency=true, so its
   lookahead is compensated and nothing moves in time. The track is music and impact sounds (no recitation); its own peaks
   reach -0.5 dBTP, so the limiter is what lets the master stay a single linear gain.
2. app.audio.master: two-pass loudnorm in linear mode (one gain) to -14 LUFS / -1.5 dBTP, 48 kHz, AAC 192k.
   No cut, no time-stretch, no speed or pitch change, no EQ.
3. A 720p review copy under 2.5 MB (two-pass x264 to a 2.2 MB budget, AAC 96k).
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
DUR = 855 / 30
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
mux = knit / 'mux.mov'
run('ffmpeg', '-v', 'error', '-y', '-i', str(render), '-i', str(knit / 'public/audio.wav'), '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-af', f'alimiter=limit=0.7943:level=false:latency=true:attack=1:release=50,apad=whole_dur={DUR}', '-t', str(DUR),
    '-c:a', 'pcm_s16le', '-ar', '44100', str(mux))
info = master(str(mux), str(knit / 'final.mp4'), I=-14, TP=-1.5)
json.dump(info, open(knit / 'master.json', 'w'), indent=1)
print('master', info['normalization_type'], info['output'])
os.remove(mux)

prev = knit / 'preview720.mp4'
dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(knit / 'final.mp4')).stdout)
vk = int((2.2 * 8 * 1000 * 1000 / dur - 96000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
plog = str(knit / 'p720')
run('ffmpeg', '-y', '-v', 'error', '-i', str(knit / 'final.mp4'), *common, '-pass', '1', '-passlogfile', plog, '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(knit / 'final.mp4'), *common, '-pass', '2', '-passlogfile', plog,
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(prev))
for f in knit.glob('p720*'):
    f.unlink()
print('preview', prev.stat().st_size / 1e6, 'MB', vk, 'kbps')
