"""Count clock of the reference (Dft1ZqUtnGS, @roadtojannahfirdaus, "Istighfar x100", 84.4 s, 1080x1920 30 fps).

    cd studio && .venv/bin/python -I remotion/src/istighfarknit/intake.py <job dir>

The reference's counter ring (x 785-935, y 935-1005) changes digits exactly 100 times; this finds each change frame by frame
(mean absolute difference > 4 grey levels, changes closer than 6 frames merged) and writes counts.json next to this file:
T[k-1] = the time the counter shows k. Measured: 1.500 s for 1, 75.933 s for 100, about 0.73 s apart with a longer gap
(about 1.07 s) after every tenth count. The reference audio is wordless music (faster-whisper medium, Arabic: only «موسيقى»).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

job = Path(sys.argv[1])
w, h = 150, 70
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(job / 'src/ref.mp4'), '-vf', f'crop={w}:{h}:785:935,format=gray',
                      '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(float)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
ev = []
for i in np.where(d > 4)[0] + 1:
    if not ev or i - ev[-1] > 5:
        ev.append(int(i))
assert len(ev) == 100, len(ev)
T = [round(e / 30, 4) for e in ev]
out = {'fps': 30, 'duration': 84.4, 'frames': 2532, 'T': T}
(Path(__file__).resolve().parent / 'counts.json').write_text(json.dumps(out) + '\n')
print(len(T), T[0], T[-1])
