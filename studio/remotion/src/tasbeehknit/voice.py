"""Spoken dhikr for the private knitted Tasbeeh Fatimah reel (owner request 2026-11-15: "subhanallah, alhamdulillah,
Allahu Akbar with the sound should be there, background sound"). The reel has no Quran recitation; this only voices the counts.
The first voice (edge-tts ar-SA-ZariyahNeural) was rejected; the owner chose Lamia, a native Arabic female voice made with
ElevenLabs in his HeyGen account (takes cut from its sample at the pauses, not stretched or pitched). Drop the takes in and
run ONE command; the picture is not rendered again (render2.mp4 is re-muxed with the new soundtrack):

    cp <takes> studio/.local/jobs/14977f878767/knit/voice/   # subhanallah_01.wav, alhamdulillah_01.wav, allahuakbar_01.wav, ...
    studio/.venv/bin/python -I studio/remotion/src/tasbeehknit/voice.py studio/.local/jobs/14977f878767 --check --deliver

Options: --takes <dir> (default <job>/knit/voice), --db X (voice level over the bed around it, default 10), --check (Whisper
medium, Arabic, offline: every phrase, alone and in the mix, must read its dhikr; stops before delivering if one does not),
--deliver (copies the master and a 720p preview under 2.5 MB over the delivered pair in ~/Downloads), --out <name>
(default final_voice).

Per take: trims to the speech (within 55 dB of its loudest 5 ms, 20 ms before, 60 ms after), 6 ms fade in, 30 ms fade out.
Per dhikr: one phrase per count when its longest take fits the shortest gap between counts (27 frames, 0.90 s), else one per
2 counts (else 3), starting on the first count of its set, with its first sound on the reference bead tick (TICK_LEAD before
the counter steps) and never overlapping the previous phrase; with two or more takes the order is seeded and uneven (never
three alike in a row) with a +-0.6 dB spread, each phrase DB over the bed around it. The reference track (knit/master.wav)
stays underneath unchanged; only gain, fades and one latency-compensated lookahead limiter on the sum, so app.audio.master
reaches -14 LUFS / -1.5 dBTP with a linear gain. Writes <job>/knit/voice_mix.wav, voice_alone.wav, voice_check.json,
<out>.mp4 and <out>_720.mp4.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

args = sys.argv[1:]
job = Path(args[0])
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
KNIT = job / 'knit'
TAKES_DIR = Path(opt('--takes', KNIT / 'voice'))
DB, OUT = float(opt('--db', 10)), opt('--out', 'final_voice')
SR, FPS = 48000, 30
here = Path(__file__).resolve().parent
STUDIO = here.parents[2]
NAME = 'Personal - Tasbeeh Fatimah knitted (wife, heal.ingthroughquran)'
TX = json.loads((here / 'texts.json').read_text())

# the reference clock: the frames where the counter steps (TasbeehKnit.tsx), 30 fps
P1 = [95, 123, 152, 180, 207, 235, 263, 292, 319, 347, 376, 403, 431, 459, 487, 515, 543, 571, 599, 627, 655, 683, 711, 739, 767, 795, 823,
      851, 879, 907, 935, 963, 991]
P2 = [1063, 1091, 1119, 1147, 1175, 1203, 1231, 1259, 1287, 1315, 1343, 1371, 1399, 1427, 1455, 1483, 1511, 1539, 1567, 1595, 1623, 1651,
      1679, 1707, 1735, 1763, 1791, 1819, 1847, 1875, 1903, 1931, 1959]
P3 = [2013, 2041, 2069, 2097, 2125, 2153, 2181, 2209, 2237, 2265, 2293, 2321, 2349, 2377, 2405, 2433, 2461, 2489, 2517, 2545, 2573, 2601,
      2629, 2657, 2685, 2713, 2741, 2769, 2797, 2825, 2853, 2881, 2909, 2937]
TICK_LEAD = 0.03          # the audio tick lands about one frame before the counter steps
SETS = [('subhanallah', TX['sub'], P1), ('alhamdulillah', TX['hamd'], P2), ('allahuakbar', TX['akbar'], P3)]


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def decode(p, ch=1, sr=SR):
    return np.frombuffer(run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', str(ch), '-ar', str(sr), '-f', 'f32le', '-']).stdout,
                         np.float32).reshape(-1, ch).astype(np.float64)


def write(x, path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-'] + (['-af', af] if af else [])
    run(cmd + ['-c:a', 'pcm_f32le' if str(path).endswith('.f32.wav') else 'pcm_s24le', str(path)], input=x.astype('<f4').tobytes())


def loud(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr.split('Summary:')[-1]
    num = lambda key: float(r.split(key)[1].split()[0])
    return num('I:'), num('Peak:')


def letters(s):
    s = re.sub('[\u064B-\u065F\u0670\u06D6-\u06ED]', '', s)        # harakat, dagger alif, Quranic marks
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
    return re.sub('[^ء-ي]', '', s)


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
bed = decode(KNIT / 'master.wav', 2)
span = bed[int((P1[0] / FPS - TICK_LEAD) * SR):int((P3[-1] / FPS + 1.0) * SR)]
bed_db = rms(span)
rng = np.random.default_rng(100)
voice = np.zeros_like(bed)
placed, prev_end = [], -1.0
for key, text, frames in SETS:
    files = sorted(f for f in TAKES_DIR.glob(f'{key}_*') if f.suffix.lower() in ('.wav', '.mp3', '.m4a', '.flac', '.aac', '.ogg'))
    if not files:
        sys.exit(f'no {key} takes in {TAKES_DIR}: add {key}_01.wav, ... first')
    takes = []
    for f in files:
        a = decode(f)[:, 0]
        env = np.convolve(np.abs(a), np.ones(240) / 240, 'same')
        on = np.where(env > env.max() * 10 ** (-55 / 20))[0]
        s0, s1 = max(0, on[0] - int(0.02 * SR)), min(len(a), on[-1] + int(0.06 * SR))
        x = a[s0:s1].copy()
        fi, fo = int(0.006 * SR), int(0.03 * SR)
        x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo) ** 2
        lead = (on[0] - s0) / SR
        takes.append({'name': f.name, 'x': x, 'lead': lead, 'rms': rms(x[int(lead * SR):])})
    longest = max(len(t['x']) / SR - t['lead'] for t in takes)
    fr = np.array(frames)
    every = next(n for n in (1, 2, 3) if longest <= (fr[n:] - fr[:-n]).min() / FPS - 0.02)
    counts = list(range(0, len(frames), every))
    print(f'{key}: {len(takes)} take(s), longest {longest:.2f} s with its tail -> one phrase every {every} count(s): '
          f'{len(counts)} phrases on counts {", ".join(str(c + 1) for c in counts[:4])} ... {counts[-1] + 1}')
    order, last = [], [-1, -1]
    for _ in counts:
        c = int(rng.integers(len(takes)))
        if len(takes) > 1 and last[0] == last[1] == c:
            c = (c + 1) % len(takes)
        order.append(c); last = [last[1], c]
    for j, i in enumerate(counts):
        tk = takes[order[j]]
        t = frames[i] / FPS - TICK_LEAD                                    # the first sound on the bead tick
        t0, sp = t - tk['lead'], tk['x'][int(tk['lead'] * SR):]
        local = rms(bed[int(t * SR):int(t * SR) + len(sp)])
        level = min(bed_db + 4, max(bed_db, local)) + DB + float(rng.uniform(-0.6, 0.6))
        seg = tk['x'] * 10 ** ((level - tk['rms']) / 20)
        assert t0 >= prev_end, f'{key} at count {i + 1} would overlap the previous phrase'
        i0 = int(round(t0 * SR)); voice[i0:i0 + len(seg)] += seg[:, None]
        prev_end = t0 + len(seg) / SR
        placed.append({'set': key, 'text': text, 'count': i + 1, 't': round(t, 3), 'take': tk['name'], 'end': round(prev_end, 3)})
print(f'bed {bed_db:.1f} dB RMS over the counting; voice {DB:+.1f} dB over the bed around each phrase; {len(placed)} phrases')

# the sum, gain-staged, then one latency-compensated lookahead limiter so the peak-to-loudness ratio fits a linear master
tmp = KNIT / 'voice_mix.f32.wav'
mix = bed + voice
write(mix, tmp); I0, _ = loud(tmp)
g = 10 ** ((-16.5 - I0) / 20); mix *= g
I = -16.5
for _ in range(4):
    write(mix, KNIT / 'voice_mix.wav', f'alimiter=limit={min(1.0, 10 ** ((I + 11.3) / 20)):.4f}:attack=5:release=60:level=false:latency=true')
    I2, tp2 = loud(KNIT / 'voice_mix.wav')
    if tp2 - I2 <= 12.0:                     # 0.5 dB under what a linear -14 / -1.5 master allows, for the AAC overshoot
        break
    I -= (tp2 - I2) - 11.8
write(voice * g, KNIT / 'voice_alone.wav')
tmp.unlink()
print(f'voice_mix.wav {I2:.1f} LUFS, true peak {tp2:.1f} dBTP')

if '--check' in args:
    os.environ['HF_HUB_OFFLINE'] = '1'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8')
    starts = [p['t'] for p in placed] + [len(bed) / SR]
    bad = []
    for src in ('voice_alone.wav', 'voice_mix.wav'):
        a = decode(KNIT / src, 1, 16000)[:, 0].astype(np.float32)
        for p, nxt in zip(placed, starts[1:]):
            end = min(p['t'] + 2.0, nxt - 0.05)
            w = np.concatenate([np.zeros(8000, np.float32), a[int((p['t'] - 0.15) * 16000):int(end * 16000)], np.zeros(8000, np.float32)])
            segs, _ = model.transcribe(w, language='ar', beam_size=5, vad_filter=False, condition_on_previous_text=False)
            txt = ' '.join(s.text.strip() for s in segs)
            p['heard_' + src.split('.')[0]] = txt
            if letters(txt) != letters(p['text']):
                bad.append((src, p['set'], p['count'], p['take'], txt))
        print(f'Whisper medium, {src}: {len(placed) - sum(b[0] == src for b in bad)}/{len(placed)} phrases read their dhikr')
    (KNIT / 'voice_check.json').write_text(json.dumps(placed, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: fix or replace the takes above, then run again')

# re-mux the rendered picture (unchanged) with the new soundtrack, then master
raw, out = KNIT / 'render2.mp4', KNIT / f'{OUT}.mp4'
run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-i', str(KNIT / 'voice_mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
     '-c:a', 'aac', '-b:a', '320k', '-shortest', str(KNIT / f'{OUT}_raw.mp4')])
sys.path.insert(0, str(STUDIO))
from app import audio  # noqa: E402
m = audio.master(str(KNIT / f'{OUT}_raw.mp4'), str(out), I=-14.0, TP=-1.5)
(KNIT / f'{OUT}_raw.mp4').unlink()
print('master:', json.dumps({k: m[k] for k in ('normalization_type', 'output')}))
prev = KNIT / f'{OUT}_720.mp4'
for p in (1, 2):
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '115k',
         '-pass', str(p), '-passlogfile', str(KNIT / 'p720v')] + (['-an', '-f', 'mp4', os.devnull] if p == 1 else
         ['-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-af', 'alimiter=limit=0.5309:attack=5:release=60:level=false:latency=true',   # -5.5 dB: low-bitrate AAC overshoots ~3 dB
          '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(prev)]))
for f in KNIT.glob('p720v*'):
    f.unlink()
print(f'{out} ({out.stat().st_size / 1e6:.1f} MB), {prev} ({prev.stat().st_size / 1e6:.2f} MB)')
if '--deliver' in args:
    dl = Path.home() / 'Downloads'
    shutil.copy(out, dl / f'{NAME} - 1080x1920.mp4')
    shutil.copy(prev, dl / f'{NAME} - preview 720p.mp4')
    print('delivered to', dl)
