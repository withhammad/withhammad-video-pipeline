"""Split the two HeyGen takes (guy = HAMMAD YOUSUF clone, Claude = Annie) into per-line WAVs, by Whisper word timings
matched to the script's word counts. Writes take/lines/NN.wav (48 kHz mono) and take/words_raw.json."""
import json, re, subprocess, numpy as np
from faster_whisper import WhisperModel
L = json.load(open('standin/lines.json'))
m = WhisperModel('small.en', compute_type='int8')
out = {}
for who, f in (('G', 'take/guy_hammad_v2.mp3'), ('C', 'take/claude_hammad.mp3')):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True, language='en')
    ww = [w for s in segs for w in s.words]
    idx = [i for i, (w, t) in enumerate(L) if w == who]
    counts = [len(re.findall(r"[A-Za-z0-9'\-]+", L[i][1])) for i in idx]
    print(who, 'whisper words', len(ww), 'script words', sum(counts))
    norm = lambda x: re.sub(r"[^a-z0-9']", '', x.lower())
    ALIAS = {'six': ['six', '6'], 'ugh': ['ugh', 'oh', 'uh', 'ah'], 'okay': ['okay', 'ok'], 'um': ['um', 'umm', 'hmm', 'uh']}
    firsts = [norm(re.findall(r"[A-Za-z0-9'\-]+", L[i][1])[0]) for i in idx]
    starts = [0]; p = 1
    for k, fw in enumerate(firsts[1:]):
        ok = ALIAS.get(fw, [fw]); p = max(p, starts[-1] + max(1, counts[k] - 3))
        while p < len(ww) and norm(ww[p].word) not in ok: p += 1
        assert p < len(ww), (who, fw)
        starts.append(p); p += 1
    bounds = [(a, (starts[k + 1] - 1 if k + 1 < len(starts) else len(ww) - 1)) for k, a in enumerate(starts)]
    lasts = [norm(re.findall(r"[A-Za-z0-9'\-]+", L[i][1])[-1]) for i in idx]
    NUM = {'six': '6', 'cars': 'cars'}
    for k, (a, b) in enumerate(bounds):
        lw = lasts[k]; bb = b
        while bb > a and norm(ww[bb].word) not in (lw, NUM.get(lw, lw)): bb -= 1
        if bb > a or norm(ww[a].word) in (lw, NUM.get(lw, lw)): bounds[k] = (a, bb)
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]))
    for k, (i, (a, b)) in enumerate(zip(idx, bounds)):
        s = ww[a].start - 0.06 if k else max(0, ww[a].start - 0.06)
        e = ww[b].end + 0.12
        if k + 1 < len(bounds): e = min(e, ww[bounds[k + 1][0]].start - 0.03)
        s = max(0, s)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-ss', f'{s:.3f}', '-to', f'{e:.3f}', '-ar', '48000', '-ac', '1',
                        '-af', 'afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse', f'take/lines/{i:02d}.wav'], check=True)
        out[i] = dict(text=L[i][1], heard=' '.join(w.word.strip() for w in ww[a:b + 1]), start=round(s, 3), end=round(e, 3))
json.dump(out, open('take/split.json', 'w'), indent=1)
for i in sorted(out): print(i, round(out[i]['end'] - out[i]['start'], 2), '|', out[i]['heard'])
