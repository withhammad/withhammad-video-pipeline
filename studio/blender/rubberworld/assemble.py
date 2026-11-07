"""Place the dialogue lines on one timeline; word timings per line via faster-whisper, snapped to the script words.
Swap-in: replace lines/NN.wav with the real voice lines (same numbering) and re-run; everything downstream re-times."""
import json, subprocess, re, sys
from faster_whisper import WhisperModel
L = json.load(open('lines.json'))
GAP = {0: 0.25}  # gap BEFORE line i (s); default below
PAYOFF_BEFORE = 21; PAYOFF_LEN = 2.6   # rubber clip plays before the CTA line
m = WhisperModel('base.en', compute_type='int8')
t = 0.15; out = []; words = []
for i, (who, text) in enumerate(L):
    d = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'lines/{i:02d}.wav']))
    gap = 0.32 if i else 0.15
    if i > 0 and L[i-1][0] == who: gap = 0.22
    if i == PAYOFF_BEFORE: gap = PAYOFF_LEN
    t += gap if i else 0
    import numpy as np
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',f'lines/{i:02d}.wav','-f','f32le','-ac','1','-ar','16000','-'])
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True, language='en')
    ww = [w for s in segs for w in s.words]
    script = re.findall(r"[A-Za-z0-9'\-]+[.,?!]?", text)
    # map whisper words onto script tokens proportionally (keeps exact script spelling)
    if len(ww) == len(script):
        tim = [(w.start, w.end) for w in ww]
    else:
        tot = sum(len(x) for x in script); acc = 0; tim = []
        for x in script:
            s0 = acc / tot * d; acc += len(x); tim.append((s0, acc / tot * d))
    for x, (s0, e0) in zip(script, tim):
        words.append(dict(w=x, s=round(t + s0, 3), e=round(t + e0, 3), who=who, line=i))
    out.append(dict(i=i, who=who, text=text, start=round(t, 3), end=round(t + d, 3)))
    t += d
total = t + 1.4
json.dump(dict(lines=out, words=words, total=round(total, 3), payoff=dict(start=round(out[PAYOFF_BEFORE-1]['end'] + 0.1, 3), end=out[PAYOFF_BEFORE]['start'] - 0.1)), open('timeline.json', 'w'), indent=1)
# mix
inputs = []; filt = []
for o in out:
    inputs += ['-i', f'lines/{o["i"]:02d}.wav']
    filt.append(f'[{o["i"]}]adelay={int(o["start"]*1000)}:all=1[a{o["i"]}]')
filt.append(''.join(f'[a{o["i"]}]' for o in out) + f'amix=inputs={len(out)}:normalize=0,apad=whole_dur={total}[m]')
subprocess.run(['ffmpeg','-v','error','-y',*inputs,'-filter_complex',';'.join(filt),'-map','[m]','-ar','48000','-ac','1','voice.wav'], check=True)
print('total', round(total, 2), 'payoff', json.load(open('timeline.json'))['payoff'])
