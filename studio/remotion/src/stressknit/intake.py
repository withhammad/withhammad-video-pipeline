"""Clock of the reference (DfWnDR6T1YX, @lelahmenjauh, 99 Names dial, 99.61 s, 1080x1920 30 fps).

    cd studio && .venv/bin/python -I remotion/src/stressknit/intake.py <job dir>

The reference shows one Name at a time under its dial ("n / 99", Arabic, transliteration). This finds the frame where each new
Name card appears (mean absolute change of the name strip y 1240-1480, peaks over 2.0, merged when under 0.3 s apart: exactly
99 starts) and writes beats.json next to this file: {fps, audio (s), frames, starts [99 s], end (s, where the last card's
dial fades)}.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

job = Path(sys.argv[1])
ref = str(job / 'src/ref.mp4')
W, H = 540, 120
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ref, '-vf', 'crop=1080:240:0:1240,scale=540:120,format=gray', '-f', 'rawvideo', '-'],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
pk = [(i + 1) / 30 for i in range(1, len(d) - 1) if d[i] > 2.0 and d[i] >= d[i - 1] and d[i] >= d[i + 1]]
starts = [pk[0]]
for x in pk[1:]:
    if x - starts[-1] > 0.3:
        starts.append(x)
assert len(starts) == 99, len(starts)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=duration', '-of', 'csv=p=0', ref],
                           capture_output=True, text=True, check=True).stdout)
out = {'fps': 30, 'audio': round(dur, 3), 'frames': int(np.ceil(dur * 30)), 'starts': [round(s, 3) for s in starts],
       'end': round(starts[-1] + float(np.median(np.diff(starts))), 3)}
(Path(__file__).resolve().parent / 'beats.json').write_text(json.dumps(out) + '\n')
print(out)
