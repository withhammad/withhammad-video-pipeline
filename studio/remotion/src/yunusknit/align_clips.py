"""Per-ayah word clock for YUNUS-KNIT: faster-whisper large-v3 on each recitation phrase cut at the reciter's own pauses
(found on the 300-3500 Hz voice-band envelope), prompted with that phrase's imla'i text. Short clips give much steadier word
edges than one 57 s pass (which drifts by up to 1.5 s against the pauses).

    studio/heavy.sh studio/.venv/bin/python -I studio/remotion/src/yunusknit/align_clips.py <job dir>

Reads <job>/knit/src/ref16k.wav (from align.py) and qc_37_*.json; writes <job>/knit/src/whisper_clips.json.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
with wave.open(str(src / 'ref16k.wav')) as w:
    audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
imla = {k: json.loads((src / f'qc_37_{k}.json').read_text())['verse']['text_imlaei'] for k in range(139, 147)}
CLIPS = [('139', 5.60, 11.00, [139]), ('140', 10.90, 17.95, [140]), ('141', 17.60, 22.60, [141]), ('142', 22.40, 27.60, [142]),
         ('143-144', 27.40, 40.45, [143, 144]), ('145', 40.30, 48.60, [145]), ('146', 48.80, 57.00, [146])]
model = WhisperModel('large-v3', device='cpu', compute_type='int8')
out = {}
for name, a, b, ks in CLIPS:
    clip = audio[int(a * 16000):int(b * 16000)]
    prompt = ' '.join(imla[k] for k in ks)
    segs, _ = model.transcribe(clip, language='ar', word_timestamps=True, beam_size=5, vad_filter=False,
                               condition_on_previous_text=False, initial_prompt=prompt)
    words = [[round(a + wd.start, 3), round(a + wd.end, 3), wd.word.strip(), round(wd.probability, 3)] for s in segs for wd in s.words]
    out[name] = {'clip': [a, b], 'words': words}
    print(name, ' '.join(f'{x[2]}[{x[0]:.2f}-{x[1]:.2f}]' for x in words), flush=True)
(src / 'whisper_clips.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
