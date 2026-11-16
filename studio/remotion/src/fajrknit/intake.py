"""Sound clock of the reference (DfQMDFSufy_, @kaynlkhir, Fajr needle and candle, 28.35 s audio, 1080x1920 30 fps).

    cd studio && .venv/bin/python -I remotion/src/fajrknit/intake.py <job dir>

The reference track is wordless sound design (faster-whisper large-v3 in Arabic hears only the stock end-of-clip hallucination
«اشتركوا في القناة» over the phone buzz; spectrogram: room tone with a 250 Hz hum, cloth rustle, a metal ting, digital silence,
phone vibration). This measures the beats the picture has to land on and writes beats.json next to this file:
  needle   the needle-into-candle tap (the first broadband transient, 1-2.5 s)
  drop     the needle's first hit on the brass plate, bounce = the ringing second hit (12.5-14 s)
  buzz     [start, end] of each phone vibration burst (80-250 Hz band > -30 dBFS for > 0.25 s), 18.5 s on
  cuts     the reference's picture cuts (ffmpeg scene > 0.12)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

job = Path(sys.argv[1])
SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', str(job / 'src/ref.mp4'), '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32)
dur = len(a) / SR
hop = SR // 100
env = lambda x: 20 * np.log10(np.array([np.sqrt((x[i:i + hop] ** 2).mean()) for i in range(0, len(x) - hop, hop)]) + 1e-9)
full = env(a)
spec = np.fft.rfft(a)
f = np.fft.rfftfreq(len(a), 1 / SR)
low = np.fft.irfft(spec * ((f > 80) & (f < 250)), len(a)).astype(np.float32)
le = env(low)


def first_peak(lo, hi):
    seg = full[int(lo * 100):int(hi * 100)]
    return round(lo + int(np.argmax(np.diff(seg))) / 100 + 0.01, 2)


needle = first_peak(1.0, 2.5)
on = [i / 100 for i in range(1250, 1400) if full[i] > -40 and full[i - 1] <= -40]
drop, bounce = round(on[0], 2), round(on[-1], 2)
buzz, s0 = [], None
for i in range(1850, len(le)):
    hit = le[i] > -30
    if hit and s0 is None: s0 = i
    if (not hit or i == len(le) - 1) and s0 is not None:
        if i - s0 > 25: buzz.append([round(s0 / 100, 2), round(i / 100, 2)])
        s0 = None
sc = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(job / 'src/ref.mp4'), '-vf', "select='gt(scene,0.12)',showinfo", '-f', 'null', '-'],
                    capture_output=True, text=True).stderr
cuts = [round(float(x.split(':')[1]), 3) for x in sc.split() if x.startswith('pts_time:')]
out = {'fps': 30, 'audio': round(dur, 3), 'frames': int(np.ceil(dur * 30)), 'needle': needle, 'drop': drop, 'bounce': bounce, 'buzz': buzz, 'cuts': cuts}
(Path(__file__).resolve().parent / 'beats.json').write_text(json.dumps(out) + '\n')
print(out)
