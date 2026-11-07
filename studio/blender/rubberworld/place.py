"""Place the real HeyGen lines on the existing (already rendered) timeline: each line may start up to 0.4 s early,
uses neighbours' slack, and is sped up at most 1.18x; overflow pushes the next line. Writes take/timeline.json (same
shape as standin/timeline.json, real word timings) and take/voice.wav."""
import json, subprocess, re, numpy as np
from faster_whisper import WhisperModel
tl = json.load(open('standin/timeline.json')); L = tl['lines']; P0 = tl['payoff']['start']
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
D = [dur(f'take/lines/{k:02d}.wav') for k in range(len(L))]
out = []; prev_end = 0.0
for k, l in enumerate(L):
    s = max(prev_end + (0.12 if k else 0.1), l['start'] - 0.4)
    if k == 21: s = max(s, l['start'] - 0.1)
    latest_end = (L[k + 1]['start'] + 0.25 - 0.12) if k + 1 < len(L) else tl['total'] - 0.4
    if k == 20: latest_end = P0 - 0.05
    tempo = min(1.18, max(1.0, D[k] / max(0.1, latest_end - s)))
    e = s + D[k] / tempo
    out.append(dict(i=k, who=l['who'], text=l['text'], start=round(s, 3), end=round(e, 3), tempo=round(tempo, 3),
                    drift=round(s - l['start'], 3)))
    prev_end = e
for o in out: print(o['i'], o['who'], 'start', o['start'], 'drift', o['drift'], 'tempo', o['tempo'], 'end', o['end'])
assert out[20]['end'] < P0 + 0.15, 'line 20 runs into the payoff'
# word timings per line (Whisper on each placed line), scaled by tempo
m = WhisperModel('small.en', compute_type='int8'); words = []
for o in out:
    k = o['i']
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f'take/lines/{k:02d}.wav', '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True, language='en')
    ww = [w for sg in segs for w in sg.words]
    script = re.findall(r"[A-Za-z0-9'\-]+[.,?!]?", o['text'])
    if len(ww) == len(script):
        tim = [(w.start, w.end) for w in ww]
    else:  # spread script words over the voiced span, weighted by length
        a, b = (ww[0].start, ww[-1].end) if ww else (0, D[k]); tot = sum(len(x) for x in script); acc = 0; tim = []
        for x in script: s0 = a + (b - a) * acc / tot; acc += len(x); tim.append((s0, a + (b - a) * acc / tot))
    for x, (s0, e0) in zip(script, tim):
        words.append(dict(w=x, s=round(o['start'] + s0 / o['tempo'], 3), e=round(o['start'] + e0 / o['tempo'], 3), who=o['who'], line=k))
json.dump(dict(lines=out, words=words, total=tl['total'], payoff=tl['payoff'], voice={'G': 'HeyGen clone HAMMAD YOUSUF, Excited', 'C': 'HeyGen clone HAMMAD YOUSUF, Excited'}),
          open('take/timeline.json', 'w'), indent=1)
inputs = []; filt = []
for o in out:
    inputs += ['-i', f'take/lines/{o["i"]:02d}.wav']
    t = f'atempo={o["tempo"]},' if o['tempo'] > 1.001 else ''
    target = -15.0   # one voice (owner 2026-11-07: my voice only), every line at the same level
    meas = subprocess.run(['ffmpeg', '-nostats', '-i', f'take/lines/{o["i"]:02d}.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    li = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', meas)[-1])
    g = f'volume={target - li:.2f}dB'
    filt.append(f'[{o["i"]}]{t}{g},adelay={int(o["start"]*1000)}:all=1[a{o["i"]}]')
filt.append(''.join(f'[a{o["i"]}]' for o in out) + f'amix=inputs={len(out)}:normalize=0,apad=whole_dur={tl["total"]}[m]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filt), '-map', '[m]', '-ar', '48000', '-ac', '1', '-t', str(tl['total']), 'take/voice.wav'], check=True)
print('voice.wav written')
