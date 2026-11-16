"""Final mux and delivery for the private knitted "Istighfar x100" reel (ISTIGHFAR-KNIT).

    cd studio && .venv/bin/python -I remotion/src/istighfarknit/finish.py <job dir> <render.mp4> [--deliver]

1. The silent Remotion picture (re-encoded H.264 High, yuv420p, limited range BT.709) + <job>/knit/mix.wav (voice.py: the
   reference track untouched + the Lamia «أستغفر الله» phrases) through one lookahead limiter only (alimiter at -2 dBFS,
   latency=true so nothing moves in time), padded/cut to the 84.4 s of the reference.
2. app.audio.master: two-pass loudnorm in linear mode (one gain) to -14 LUFS / -1.5 dBTP. No cut, stretch, pitch or EQ.
3. A 720p review copy under 2.6 MB (two-pass x264 to a 2.3 MB budget, AAC 64k).
--deliver copies to ~/Downloads as "Personal - Istighfar x100 knitted (wife, heal.ingthroughquran) - ...": 1080x1920.mp4 and
preview 720p.mp4 (cover, thumbnail and captions are copied by the caller from <job>/knit).
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from app.audio import master  # noqa: E402

job, render = Path(sys.argv[1]), Path(sys.argv[2])
knit = job / 'knit'
DUR = 2532 / 30
NAME = 'Personal - Istighfar x100 knitted (wife, heal.ingthroughquran)'
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
mux = knit / 'mux.mov'
run('ffmpeg', '-v', 'error', '-y', '-i', str(render), '-i', str(knit / 'mix.wav'), '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-af', f'alimiter=limit=0.7943:level=false:latency=true:attack=1:release=50,apad=whole_dur={DUR}', '-t', str(DUR),
    '-c:a', 'pcm_s24le', '-ar', '48000', str(mux))
final = knit / 'final.mp4'
info = master(str(mux), str(final), I=-14, TP=-1.5)
json.dump(info, open(knit / 'master.json', 'w'), indent=1)
print('master', info['normalization_type'], info['output'])
os.remove(mux)

prev = knit / 'preview720.mp4'
vk = int((2.3 * 8 * 1000 * 1000 / DUR - 64000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
plog = str(knit / 'p720')
run('ffmpeg', '-y', '-v', 'error', '-i', str(final), *common, '-pass', '1', '-passlogfile', plog, '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(final), *common, '-pass', '2', '-passlogfile', plog,
    '-af', 'alimiter=limit=0.6310:attack=5:release=60:level=false:latency=true', '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(prev))
for f in knit.glob('p720*'):
    f.unlink()
print('preview', round(prev.stat().st_size / 1e6, 2), 'MB', vk, 'kbps')
if '--deliver' in sys.argv:
    dl = Path.home() / 'Downloads'
    shutil.copy(final, dl / f'{NAME} - 1080x1920.mp4')
    shutil.copy(prev, dl / f'{NAME} - preview 720p.mp4')
    print('delivered to', dl)
