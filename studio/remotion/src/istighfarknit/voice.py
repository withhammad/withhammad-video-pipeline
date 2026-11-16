"""Spoken-dhikr layer of the private knitted "Istighfar x100" reel (ISTIGHFAR-KNIT): a soft female Arabic voice says
«أستغفر الله» in sync with the counts, over the reference's own track (wordless music, which stays underneath unchanged).

    cd studio && .venv/bin/python -I remotion/src/istighfarknit/voice.py <job dir> [--check] [--db 10]

Voice: Lamia (ElevenLabs v3 in the owner's HeyGen account, owner-approved 2026-11-15), the two «أستغفر الله» takes already
recorded in scratchpad/dhikr-voice/Lamia.mp3 (13.55-14.95 s and 14.95-16.27 s of that sample, cut in the pauses between
phrases). No new takes are generated. Each take is ~1.03 s of speech, longer than the 0.72 s between counts, so one phrase
is placed on every other count (1, 3, ..., 99: 50 phrases), its first sound on the count's own time (counts.json, the
reference's counter measured frame by frame); the two takes alternate in a seeded, uneven order (never three alike in a row)
with a +-0.6 dB spread.
Per take: trimmed to the speech (within 55 dB of its loudest 5 ms, 20 ms before, 60 ms after), 6 ms fade in, 30 ms fade out,
matched in speech level. Only gain and fades on the voice; the bed (public/audio.wav, the reference track) is not touched; no
pitch or time change to either. Voice sits --db (default 10) dB over the bed's RMS around each phrase.
Writes <job>/knit/mix.wav (bed + voice, float, unmastered: finish.py limits and masters) and <job>/knit/voice_alone.wav.
--check: faster-whisper medium, Arabic, offline: every placed phrase, alone and in the mix, must read «أستغفر الله»
(diacritics and spaces ignored); exits 1 if one does not.
"""
import json
import os
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np

args = sys.argv[1:]
job = Path(args[0])
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
KNIT = job / 'knit'
DB = float(opt('--db', 10))
SR = 48000
HERE = Path(__file__).resolve().parent
LAMIA = Path('/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/dhikr-voice/Lamia.mp3')
CUTS = [(13.55, 14.95), (14.95, 16.274)]
T = json.loads((HERE / 'counts.json').read_text())['T']


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def decode(p, ch=1, sr=SR):
    return np.frombuffer(run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', str(ch), '-ar', str(sr), '-f', 'f32le', '-']).stdout,
                         np.float32).reshape(-1, ch).astype(np.float64)


def write(x, path):
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_f32le', str(path)],
        input=x.astype('<f4').tobytes())


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
src = decode(LAMIA)[:, 0]
takes = []
for n, (a0, a1) in enumerate(CUTS):
    a = src[int(a0 * SR):int(a1 * SR)]
    env = np.convolve(np.abs(a), np.ones(240) / 240, 'same')
    on = np.where(env > env.max() * 10 ** (-55 / 20))[0]
    s0, s1 = max(0, on[0] - int(0.02 * SR)), min(len(a), on[-1] + int(0.06 * SR))
    x = a[s0:s1].copy()
    fi, fo = int(0.006 * SR), int(0.03 * SR)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo) ** 2
    lead = (on[0] - s0) / SR
    takes.append({'name': f'Lamia astaghfirullah {n + 1} ({a0:.2f}-{a1:.2f} s)', 'x': x, 'lead': lead, 'rms': rms(x[int(lead * SR):])})
    print(takes[-1]['name'], f'{len(x) / SR:.2f} s with tail, lead {lead * 1000:.0f} ms')

counts = list(range(1, 101, 2))
bed = decode(KNIT / 'public' / 'audio.wav', 2)
bed_db = rms(bed[int(T[0] * SR):int(T[-1] * SR)])
rng = np.random.default_rng(71)
order, last = [], [-1, -1]
for _ in counts:
    c = int(rng.integers(len(takes)))
    if last[0] == last[1] == c:
        c = 1 - c
    order.append(c); last = [last[1], c]
voice = np.zeros_like(bed)
prev_end, placed = -1.0, []
for j, k in enumerate(counts):
    tk = takes[order[j]]
    t = T[k - 1]
    t0 = t - tk['lead']
    local = rms(bed[int(t * SR):int(t * SR) + len(tk['x'])])
    level = min(bed_db + 4, max(bed_db, local)) + DB + float(rng.uniform(-0.6, 0.6))
    seg = tk['x'] * 10 ** ((level - tk['rms']) / 20)
    assert t0 >= prev_end, f'phrase at count {k} would overlap the previous one'
    assert t0 + len(seg) / SR <= T[k] + 0.75, f'phrase at count {k} runs past the next phrase slot'
    i0 = int(round(t0 * SR)); voice[i0:i0 + len(seg)] += seg[:, None]
    prev_end = t0 + len(seg) / SR
    placed.append((k, t, tk['name']))
print(f'{len(placed)} phrases on counts 1, 3, ..., 99; bed {bed_db:.1f} dB RMS; voice {DB:+.1f} dB over the bed around each phrase')
write(bed + voice, KNIT / 'mix.wav')
write(voice, KNIT / 'voice_alone.wav')
json.dump([{'count': k, 't': t, 'take': n} for k, t, n in placed], open(KNIT / 'voice_placed.json', 'w'), indent=0)

if '--check' in args:
    os.environ['HF_HUB_OFFLINE'] = '1'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8')
    plain = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').replace(' ', '').strip('.،,!؟')
    target = plain('أستغفر الله')
    bad = []
    for name in ('voice_alone.wav', 'mix.wav'):
        a = decode(KNIT / name, 1, 16000)[:, 0].astype(np.float32)
        for k, t, tk in placed:
            w = np.concatenate([np.zeros(8000, np.float32), a[int((t - 0.15) * 16000):int((t + 1.25) * 16000)], np.zeros(8000, np.float32)])
            segs, _ = model.transcribe(w, language='ar', beam_size=5, vad_filter=False, condition_on_previous_text=False)
            txt = ' '.join(s.text.strip() for s in segs)
            if plain(txt).replace('أ', 'ا').replace('إ', 'ا') != target.replace('أ', 'ا'):
                bad.append((name, k, tk, txt))
        print(f'Whisper medium (Arabic), {name}: {len(placed) - sum(b[0] == name for b in bad)}/{len(placed)} phrases read "أستغفر الله"')
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit(1)
