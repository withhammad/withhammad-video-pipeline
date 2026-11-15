"""Word clock for the private knitted Yunus reel (YUNUS-KNIT): faster-whisper large-v3 on the reference recitation.

    studio/heavy.sh studio/.venv/bin/python -I studio/remotion/src/yunusknit/align.py <job dir>

The faster-whisper file loader breaks here, so the audio goes in as a numpy array: source.mp4's first audio track -> ffmpeg
16 kHz mono s16 wav -> the wave module -> float32. Two passes, both Arabic with word timestamps:
  whisper_ar_large_v3.json         unprompted (the honest identification of what is recited)
  whisper_ar_large_v3_prompt.json  prompted with the imla'i text of as-Saffat 37:139-146 (tighter word edges)
Written to <job>/knit/src/. Nothing here touches the audio that goes into the reel.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
src.mkdir(parents=True, exist_ok=True)
wav = src / 'ref16k.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-map', '0:a:0', '-ac', '1', '-ar', '16000',
                '-c:a', 'pcm_s16le', str(wav)], check=True)
with wave.open(str(wav)) as w:
    assert w.getframerate() == 16000 and w.getnchannels() == 1 and w.getsampwidth() == 2
    audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768.0
print('audio', len(audio) / 16000, 's')
prompt = ' '.join(json.loads((src / f'qc_37_{k}.json').read_text())['verse']['text_imlaei'] for k in range(139, 147))
model = WhisperModel('large-v3', device='cpu', compute_type='int8')
for name, kw in (('whisper_ar_large_v3', {}), ('whisper_ar_large_v3_prompt', {'initial_prompt': prompt})):
    segs, info = model.transcribe(audio, language='ar', word_timestamps=True, beam_size=5, vad_filter=False,
                                  condition_on_previous_text=False, **kw)
    out = {'segments': [], 'words': []}
    for s in segs:
        out['segments'].append([round(s.start, 3), round(s.end, 3), s.text.strip()])
        for wd in s.words:
            out['words'].append([round(wd.start, 3), round(wd.end, 3), wd.word.strip(), round(wd.probability, 3)])
    (src / f'{name}.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(name)
    for s in out['segments']:
        print(f'  {s[0]:6.2f} {s[1]:6.2f} {s[2]}')
