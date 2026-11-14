"""Swappable spoken-dhikr layer of the private knitted "Subhan Allah x100" reel (TASBIH-KNIT). The owner asked on 15 Nov
for a voice saying «سُبْحَانَ اللّٰهِ» over the reference audio (which stays underneath unchanged); the edge-tts voice
was rejected ("its accent is not that good"), so a human or native voice is being arranged. Drop its takes in and run
ONE command; the picture is not rendered again (raw.mp4 is re-muxed with the new soundtrack):

    cp <takes> studio/.local/jobs/808c92b7fc32/knit/voice/          # subhanallah_01.wav, subhanallah_02.wav, ... (wav/mp3/m4a/flac)
    studio/.venv/bin/python -I studio/remotion/src/tasbihknit/voice.py studio/.local/jobs/808c92b7fc32 --check --deliver

Options: --takes <dir> (default <job>/knit/voice), --every N (counts per phrase; default: 1 if every take fits the
0.6 s between counts, else 2, else 3), --db X (voice level over the bed around it, default 10), --check (Whisper medium,
Arabic, offline: every phrase, alone and in the mix, must read "سبحان الله"; stops before delivering if one does not),
--deliver (copies the master and a 720p preview under 2.5 MB to ~/Downloads), --out <name> (default final_voice).

What it does, per take: trims to the speech (12 ms before, 60 ms after), 6 ms fade in and 30 ms fade out, matches the takes'
speech level, and places one phrase per N counts with its first sound on the count's own time (count k at
3.0 + 0.6 (k - 1) s, the reference tick), never overlapping the previous phrase; with two or more takes the order is
seeded and uneven (never three alike in a row) with a +-0.6 dB spread. Only gain, fades and one lookahead limiter on the
sum (so app.audio.master reaches -14 LUFS / -1.5 dBTP with a linear gain); no pitch or time change to voice or bed.
Writes <job>/knit/public/mix.wav, <job>/knit/voice_alone.wav, <job>/knit/<out>.mp4 and <out>_720.mp4.
"""
import json
import os
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np

args = sys.argv[1:]
job = Path(args[0])
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
KNIT = job / 'knit'
TAKES_DIR = Path(opt('--takes', KNIT / 'voice'))
DB, OUT = float(opt('--db', 10)), opt('--out', 'final_voice')
SR = 48000
STUDIO = Path(__file__).resolve().parents[3]
NAME = 'Personal - Subhan Allah x100 knitted (wife, heal.ingthroughquran)'


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


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
files = sorted(f for f in TAKES_DIR.glob('*') if f.is_file() and f.suffix.lower() in ('.wav', '.mp3', '.m4a', '.flac', '.aac', '.ogg'))
if not files:
    sys.exit(f'no takes in {TAKES_DIR}: add subhanallah_01.wav, ... first')

takes = []
for f in files:
    a = decode(f)[:, 0]
    env = np.convolve(np.abs(a), np.ones(240) / 240, 'same')
    on = np.where(env > env.max() * 10 ** (-40 / 20))[0]                  # speech: within 40 dB of the take's loudest 5 ms
    s0, s1 = max(0, on[0] - int(0.012 * SR)), min(len(a), on[-1] + int(0.06 * SR))
    x = a[s0:s1].copy()
    fi, fo = int(0.006 * SR), int(0.03 * SR)
    x[:fi] *= np.linspace(0, 1, fi); x[-fo:] *= np.linspace(1, 0, fo) ** 2
    lead = (on[0] - s0) / SR
    takes.append({'name': f.name, 'x': x, 'lead': lead, 'speech': (on[-1] - on[0]) / SR, 'rms': rms(x[int(lead * SR):])})
longest = max(len(t['x']) / SR - t['lead'] for t in takes)
every = int(opt('--every', 1 if longest <= 0.58 else 2 if longest <= 1.18 else 3))
assert longest <= 0.6 * every - 0.02, f'the longest take ({longest:.2f} s) does not fit {every} count(s) of 0.6 s'
counts = list(range(1, 101, every))
print(f'{len(takes)} take(s), longest {longest:.2f} s with its tail -> one phrase every {every} count(s): {len(counts)} phrases')

bed = decode(KNIT / 'public' / 'audio.wav', 2)
bed_db = rms(bed[int(3.0 * SR):int(62.4 * SR)])
rng = np.random.default_rng(100)
order, last = [], [-1, -1]
for _ in counts:
    c = int(rng.integers(len(takes)))
    if len(takes) > 1 and last[0] == last[1] == c:
        c = (c + 1) % len(takes)
    order.append(c); last = [last[1], c]
voice = np.zeros_like(bed)
prev_end, placed = -1.0, []
for j, k in enumerate(counts):
    tk = takes[order[j]]
    t = 3.0 + 0.6 * (k - 1)
    t0, sp = t - tk['lead'], tk['x'][int(tk['lead'] * SR):]
    local = rms(bed[int(t * SR):int(t * SR) + len(sp)])
    level = min(bed_db + 4, max(bed_db, local)) + DB + float(rng.uniform(-0.6, 0.6))
    seg = tk['x'] * 10 ** ((level - tk['rms']) / 20)
    assert t0 >= prev_end, f'phrase at count {k} would overlap the previous one'
    i0 = int(round(t0 * SR)); voice[i0:i0 + len(seg)] += seg[:, None]
    prev_end = t0 + len(seg) / SR
    placed.append((k, t, tk['name']))
print(f'bed {bed_db:.1f} dB RMS over the count; voice {DB:+.1f} dB over the bed around each phrase')

# the sum, gain-staged, then one lookahead limiter so the peak-to-loudness ratio fits a linear master to -14 / -1.5
tmp = KNIT / 'voice_mix.f32.wav'
mix = bed + voice
write(mix, tmp); I0, _ = loud(tmp)
g = 10 ** ((-16.5 - I0) / 20); mix *= g
I = -16.5
for _ in range(4):
    write(mix, KNIT / 'public' / 'mix.wav', f'alimiter=limit={min(1.0, 10 ** ((I + 11.8) / 20)):.4f}:attack=5:release=60:level=false')
    I2, tp2 = loud(KNIT / 'public' / 'mix.wav')
    if tp2 - I2 <= 12.4:
        break
    I -= (tp2 - I2) - 12.2
write(voice * g, KNIT / 'voice_alone.wav')
tmp.unlink()
print(f'mix.wav {I2:.1f} LUFS, true peak {tp2:.1f} dBTP')

if '--check' in args:
    os.environ['HF_HUB_OFFLINE'] = '1'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8')
    plain = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').replace(' ', '').strip('.،,!؟')
    src_ts = (Path(__file__).resolve().parent / 'text.ts').read_text()
    target = plain(json.loads(src_ts.split('export const DHIKR = ')[1].split(';')[0]))     # سبحانالله, from text.ts
    bad = []
    for src in ('voice_alone.wav', 'public/mix.wav'):
        a = decode(KNIT / src, 1, 16000)[:, 0].astype(np.float32)
        for k, t, name in placed:
            w = np.concatenate([np.zeros(8000, np.float32), a[int((t - 0.15) * 16000):int((t + 0.6 * every - 0.05) * 16000)], np.zeros(8000, np.float32)])
            segs, _ = model.transcribe(w, language='ar', beam_size=5, vad_filter=False, condition_on_previous_text=False)
            txt = ' '.join(s.text.strip() for s in segs)
            if plain(txt) != target:
                bad.append((src, k, name, txt))
        print(f'Whisper medium, {src}: {len(placed) - sum(b[0] == src for b in bad)}/{len(placed)} phrases read "سبحان الله"')
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: fix or replace the takes above, then run again')

# re-mux the rendered picture (unchanged) with the new soundtrack, then master
raw, out = KNIT / 'raw.mp4', KNIT / f'{OUT}.mp4'
run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-i', str(KNIT / 'public' / 'mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
     '-c:a', 'aac', '-b:a', '320k', '-shortest', str(KNIT / f'{OUT}_raw.mp4')])
sys.path.insert(0, str(STUDIO))
from app import audio  # noqa: E402
m = audio.master(str(KNIT / f'{OUT}_raw.mp4'), str(out), I=-14.0, TP=-1.5)
(KNIT / f'{OUT}_raw.mp4').unlink()
print('master:', json.dumps({k: m[k] for k in ('normalization_type', 'output')}))
prev = KNIT / f'{OUT}_720.mp4'
for p in (1, 2):
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '190k',
         '-pass', str(p), '-passlogfile', str(KNIT / 'p720v')] + (['-an', '-f', 'mp4', os.devnull] if p == 1 else
         ['-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-c:a', 'aac', '-b:a', '48k', '-movflags', '+faststart', str(prev)]))
for f in KNIT.glob('p720v*'):
    f.unlink()
print(f'{out} ({out.stat().st_size / 1e6:.1f} MB), {prev} ({prev.stat().st_size / 1e6:.2f} MB)')
if '--deliver' in args:
    dl = Path.home() / 'Downloads'
    shutil.copy(out, dl / f'{NAME} - 1080x1920.mp4')
    shutil.copy(prev, dl / f'{NAME} - preview 720p.mp4')
    print('delivered to', dl, '(the "no voice yet" files there can be deleted)')
