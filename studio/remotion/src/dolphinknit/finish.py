"""Final mux for the private knitted golden-dolphin salawat reel: the Remotion picture + the reference's own nasheed, mastered.

    cd studio && .venv/bin/python -I remotion/src/dolphinknit/finish.py <job dir> <render.mp4>

1. The picture (H.264 re-encoded to limited range BT.709) and public/audio.wav (the reference's 44.1 kHz stereo track, PCM,
   padded to the last frame) are muxed through one safety limiter only: alimiter at -2.0 dBFS with latency=true, so its
   lookahead is compensated and nothing moves in time. The track is a sung salawat nasheed (no Quran recitation); its own peaks
   may pass -1.5 dBTP, so the limiter is what lets the master stay a single linear gain.
2. One static gain toward -14 LUFS, capped so the true peak stays at or under -1.6 dBTP, 48 kHz, AAC 192k.
   No cut, no time-stretch, no speed or pitch change, no EQ.
3. A 720p review copy under 2.5 MB (two-pass x264 to a 2.2 MB budget, AAC 96k).
Writes <job>/knit/final.mp4, <job>/knit/preview720.mp4 and <job>/knit/master.json.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

job, render = Path(sys.argv[1]), Path(sys.argv[2])
knit = job / 'knit'
DUR = 302 / 30
run = lambda *a: subprocess.run(a, check=True, capture_output=True, text=True)
mux = knit / 'mux.mov'
run('ffmpeg', '-v', 'error', '-y', '-i', str(render), '-i', str(knit / 'public/audio.wav'), '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709',
    '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-af', f'alimiter=limit=0.7943:level=false:latency=true:attack=1:release=50,apad=whole_dur={DUR}', '-t', str(DUR),
    '-c:a', 'pcm_s16le', '-ar', '44100', str(mux))
# one linear gain: toward -14 LUFS, but never past -1.6 dBTP (loudnorm's linear mode falls back to dynamic here, because the
# track's own true peak leaves no headroom for the +0.3 dB it wants, and a dynamic pass would reshape the nasheed)
m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', run('ffmpeg', '-hide_banner', '-nostats', '-i', str(mux), '-map', '0:a:0', '-af',
               'loudnorm=I=-14:TP=-1.5:print_format=json', '-f', 'null', '-').stderr).group(0))
gain = round(min(-14.0 - float(m['input_i']), -1.6 - float(m['input_tp'])), 2)
run('ffmpeg', '-y', '-v', 'error', '-i', str(mux), '-map', '0:v:0', '-map', '0:a:0', '-c:v', 'copy', '-af', f'volume={gain}dB',
    '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(knit / 'final.mp4'))
eb = run('ffmpeg', '-hide_banner', '-nostats', '-i', str(knit / 'final.mp4'), '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
info = {'input': m, 'normalization_type': 'linear (one static gain)', 'gain_db': gain,
        'output': {'lufs': float(re.findall(r'I:\s+(-?[\d.]+) LUFS', eb)[-1]), 'true_peak_dbtp': float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', eb)[-1])}}
json.dump(info, open(knit / 'master.json', 'w'), indent=1)
print('master', info)
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
