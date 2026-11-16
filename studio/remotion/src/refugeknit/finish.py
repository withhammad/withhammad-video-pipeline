"""Final mux for the private knitted "Make prayer your refuge" reel (REFUGE-KNIT): the Remotion picture + the reference's own soundtrack.

    cd studio && .venv/bin/python -I remotion/src/refugeknit/finish.py <job dir> <render.mp4>

The reference track (a wordless melodic bed + footstep foley; no Quran, no words) measures -14.0 LUFS integrated and
-7.3 dBTP true peak, so it is NOT processed: no limiter, no EQ, no loudnorm, no stretch, no pitch or speed change, same
44.1 kHz rate. It is only encoded to AAC 256k (the static-gain guard below only acts if the encode overshoots -1.5 dBTP).
Nothing is laid over it.
1. The picture: H.264 High, CRF 16, re-encoded to limited range BT.709 yuv420p, 1080x1920, 30 fps.
2. A 720p review copy under 2.6 MB (two-pass x264 to a 2.2 MB budget, AAC 96k).
Writes <job>/knit/final.mp4, <job>/knit/preview720.mp4 and <job>/knit/master.json.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

job, render = Path(sys.argv[1]), Path(sys.argv[2])
knit = job / 'knit'
DUR = 430 / 30
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)


def loud(f):
    e = run('ffmpeg', '-hide_banner', '-nostats', '-i', str(f), '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
    tail = e[e.rfind('Summary:'):]
    return {'lufs': float(re.search(r'I:\s+(-?[\d.]+) LUFS', tail).group(1)), 'true_peak_dbtp': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', tail).group(1))}


final = knit / 'final.mp4'
gain = 0.0
for _ in range(3):
    af = ['-af', f'volume={gain:.2f}dB'] if gain else []
    run('ffmpeg', '-v', 'error', '-y', '-i', str(render), '-i', str(knit / 'public/audio.wav'), '-map', '0:v:0', '-map', '1:a:0',
        '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', '30',
        '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', *af, '-c:a', 'aac', '-b:a', '256k', '-ar', '44100',
        '-t', str(DUR), '-movflags', '+faststart', str(final))
    out = loud(final)
    if out['true_peak_dbtp'] <= -1.5:
        break
    gain = round(gain - (out['true_peak_dbtp'] + 1.5) - 0.1, 2)
info = {'source': loud(knit / 'public/audio.wav'), 'static_gain_db': gain, 'output': out,
        'processing': 'none (AAC encode only)' if not gain else f'one static gain of {gain} dB'}
json.dump(info, open(knit / 'master.json', 'w'), indent=1)
print('master', info)

prev = knit / 'preview720.mp4'
vk = int((2.2 * 8 * 1000 * 1000 / DUR - 96000) / 1000)
common = ['-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{vk}k', '-pix_fmt', 'yuv420p',
          '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709']
plog = str(knit / 'p720')
run('ffmpeg', '-y', '-v', 'error', '-i', str(final), *common, '-pass', '1', '-passlogfile', plog, '-an', '-f', 'mp4', '/dev/null')
run('ffmpeg', '-y', '-v', 'error', '-i', str(final), *common, '-pass', '2', '-passlogfile', plog,
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', str(prev))
for f in knit.glob('p720*'):
    f.unlink()
print('preview', prev.stat().st_size / 1e6, 'MB', vk, 'kbps')
