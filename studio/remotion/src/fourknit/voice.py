"""Spoken dhikr for the private knitted "Say each one 10 times" reel (FOUR-KNIT, her Instagram @heal.ingthroughquran).
The reference (DfuFl02h2dr, @dhikrnest) has NO voice: a soft pad, a bead tick on every count and a chime after every tenth
(Whisper medium, Arabic, VAD: no speech anywhere). So the owner's chosen voice speaks each dhikr over it: Lamia, a native
Arabic female voice made with ElevenLabs (v4) in his HeyGen account, takes cut at their pauses (never stretched or pitched).
The picture is rendered silent; this script builds the whole soundtrack and muxes it in ONE command:

    studio/.venv/bin/python -I studio/remotion/src/fourknit/voice.py studio/.local/jobs/0aeeb99aef7f --check --deliver

Takes: <job>/knit/voice/{subhanallah,alhamdulillah,allahuakbar,lailahaillallah}_NN.wav (--takes <dir> to change).
The bed: source.mp4's stereo track at 48 kHz, untouched (knit/master.wav); only gain, fades and one latency-compensated
lookahead limiter on the sum.

Per take: trimmed to the speech (within 55 dB of its loudest 5 ms, 20 ms before, 60 ms after), 6 ms fade in, 30 ms fade out.
Per set: the reference ticks are 0.85 s apart (1.00 s in the La ilaha illallah set), shorter than any phrase, so one phrase
per N counts with the smallest N for which at least one take fits between two phrase starts (minus 20 ms); takes that do not
fit at that N are left out of that set (never shortened). The first sound of each phrase lands on the audio tick of its count
(measured onsets, the counter steps on the same frame), from count 1. With two or more takes the order is seeded and uneven
(never three alike in a row) with a +-0.6 dB spread; each phrase DB (default 11) over the bed around it. Phrases never overlap.
--check: Whisper medium (Arabic, offline) on every phrase, alone and in the mix; stops before muxing if one does not read its
dhikr. Writes knit/voice_mix.wav, voice_alone.wav, voice_check.json, final.mp4 (-14 LUFS / -1.5 dBTP) and final_720.mp4
(720p, under 2.5 MB, audio pre-limited); --deliver copies them, cover.jpg, thumb_4x5.jpg and captions.txt to ~/Downloads.
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
DB = float(opt('--db', 11))
SR = 48000
here = Path(__file__).resolve().parent
STUDIO = here.parents[2]
NAME = 'Personal - Say each one 10 times knitted (wife, heal.ingthroughquran)'
TX = json.loads((here / 'texts.json').read_text())

# audio tick onsets of the reference (1 ms envelope, > 15 dB jump), seconds; the counter steps on the same frame
TICKS = [[round(1.400 + 0.85 * k, 3) for k in range(10)], [round(12.250 + 0.85 * k, 3) for k in range(10)],
         [round(23.100 + 0.85 * k, 3) for k in range(10)], [round(33.950 + 1.00 * k, 3) for k in range(10)]]
SETS = [('subhanallah', TX['sub']), ('alhamdulillah', TX['hamd']), ('allahuakbar', TX['akbar']), ('lailahaillallah', TX['tahlil'])]
SKIP = {'subhanallah_03.wav'}     # Whisper heard «سبحانك» under music on this take (2026-11-15): never used


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
    s = re.sub('[ً-ٰٟۖ-ۭ]', '', s)        # harakat, dagger alif, Quranic marks
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
    return re.sub('[^ء-ي]', '', s)


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
if not (KNIT / 'master.wav').exists():                      # the reference stereo track, 48 kHz, nothing else
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(job / 'source.mp4'), '-vn', '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_s24le', str(KNIT / 'master.wav')])
bed = decode(KNIT / 'master.wav', 2)
span = bed[int(TICKS[0][0] * SR):int((TICKS[3][-1] + 1.0) * SR)]
bed_db = rms(span)
rng = np.random.default_rng(104)
voice = np.zeros_like(bed)
placed, prev_end, plan = [], -1.0, []
for (key, text), ticks in zip(SETS, TICKS):
    files = sorted(f for f in TAKES_DIR.glob(f'{key}_*') if f.suffix.lower() in ('.wav', '.mp3', '.m4a', '.flac') and f.name not in SKIP)
    if not files:
        sys.exit(f'no {key} takes in {TAKES_DIR}')
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
        takes.append({'name': f.name, 'x': x, 'lead': lead, 'len': len(x) / SR - lead, 'rms': rms(x[int(lead * SR):])})
    tk = np.array(ticks)
    room = lambda n: (tk[n:] - tk[:-n]).min() - 0.02
    every = next(n for n in (1, 2, 3, 4, 5) if any(t['len'] <= room(n) for t in takes))
    use = [t for t in takes if t['len'] <= room(every)]
    counts = list(range(0, len(ticks), every))
    line = (f'{key}: {len(takes)} take(s) {", ".join(f"{t["name"]} {t["len"]:.2f}s" for t in takes)}; one phrase every {every} count(s) '
            f'({room(every):.2f} s room) -> uses {", ".join(t["name"] for t in use)}; counts {", ".join(str(c + 1) for c in counts)}')
    print(line); plan.append(line)
    order, last = [], [-1, -1]
    for _ in counts:
        c = int(rng.integers(len(use)))
        if len(use) > 1 and last[0] == last[1] == c:
            c = (c + 1) % len(use)
        order.append(c); last = [last[1], c]
    for j, i in enumerate(counts):
        t_ = use[order[j]]
        t = ticks[i]                                                       # the first sound on the bead tick
        t0, sp = t - t_['lead'], t_['x'][int(t_['lead'] * SR):]
        local = rms(bed[int(t * SR):int(t * SR) + len(sp)])
        level = min(bed_db + 4, max(bed_db, local)) + DB + float(rng.uniform(-0.6, 0.6))
        seg = t_['x'] * 10 ** ((level - t_['rms']) / 20)
        assert t0 >= prev_end, f'{key} at count {i + 1} would overlap the previous phrase'
        i0 = int(round(t0 * SR)); voice[i0:i0 + len(seg)] += seg[:, None]
        prev_end = t0 + len(seg) / SR
        placed.append({'set': key, 'text': text, 'count': i + 1, 't': round(t, 3), 'take': t_['name'], 'end': round(prev_end, 3),
                       'gap_to_next_tick_s': round((ticks[i + every] if i + every < len(ticks) else 99) - prev_end, 3)})
print(f'bed {bed_db:.1f} dB RMS over the counting; voice {DB:+.1f} dB over the bed around each phrase; {len(placed)} phrases')

tmp = KNIT / 'voice_mix.f32.wav'
mix = bed + voice
write(mix, tmp); I0, _ = loud(tmp)
g = 10 ** ((-16.5 - I0) / 20); mix *= g
I = -16.5
for _ in range(4):
    write(mix, KNIT / 'voice_mix.wav', f'alimiter=limit={min(1.0, 10 ** ((I + 11.3) / 20)):.4f}:attack=5:release=60:level=false:latency=true')
    I2, tp2 = loud(KNIT / 'voice_mix.wav')
    if tp2 - I2 <= 12.0:
        break
    I -= (tp2 - I2) - 11.8
write(voice * g, KNIT / 'voice_alone.wav')
tmp.unlink()
print(f'voice_mix.wav {I2:.1f} LUFS, true peak {tp2:.1f} dBTP')
# the limiter's lookahead is compensated (latency=true): check the ticks did not move
a0 = decode(KNIT / 'master.wav')[:, 0]; a1 = decode(KNIT / 'voice_mix.wav')[:, 0]
w0 = a0[int(1.2 * SR):int(1.7 * SR)]; w1 = a1[int(1.2 * SR):int(1.7 * SR)]
lag = int(np.argmax(np.correlate(w1, w0, 'full'))) - (len(w0) - 1)
print(f'mix vs reference lag at the first tick: {lag / SR * 1000:+.2f} ms')

if '--check' in args:
    os.environ['HF_HUB_OFFLINE'] = '1'
    from faster_whisper import WhisperModel
    model = WhisperModel('medium', device='cpu', compute_type='int8')
    starts = [p['t'] for p in placed] + [len(bed) / SR]
    bad = []
    for src in ('voice_alone.wav', 'voice_mix.wav'):
        a = decode(KNIT / src, 1, 16000)[:, 0].astype(np.float32)
        for p, nxt in zip(placed, starts[1:]):
            end = min(p['end'] + 0.05, nxt - 0.05)
            w = np.concatenate([np.zeros(8000, np.float32), a[int((p['t'] - 0.15) * 16000):int(end * 16000)], np.zeros(8000, np.float32)])
            segs, _ = model.transcribe(w, language='ar', beam_size=5, vad_filter=False, condition_on_previous_text=False)
            txt = ' '.join(s.text.strip() for s in segs)
            p['heard_' + src.split('.')[0]] = txt
            if letters(txt) != letters(p['text']):
                bad.append((src, p['set'], p['count'], p['take'], txt))
        print(f'Whisper medium, {src}: {len(placed) - sum(b[0] == src for b in bad)}/{len(placed)} phrases read their dhikr')
    (KNIT / 'voice_check.json').write_text(json.dumps({'plan': plan, 'lag_ms': lag / SR * 1000, 'phrases': placed}, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: fix or replace the takes above, then run again')

raw, out = KNIT / 'render.mp4', KNIT / 'final.mp4'
if not raw.exists():
    sys.exit(f'{raw} not rendered yet: soundtrack written, nothing muxed')
run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-i', str(KNIT / 'voice_mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
     '-c:a', 'aac', '-b:a', '320k', '-shortest', str(KNIT / 'final_raw.mp4')])
sys.path.insert(0, str(STUDIO))
from app import audio  # noqa: E402
m = audio.master(str(KNIT / 'final_raw.mp4'), str(out), I=-14.0, TP=-1.5)
(KNIT / 'final_raw.mp4').unlink()
print('master:', json.dumps({k: m[k] for k in ('normalization_type', 'output')}))
prev = KNIT / 'final_720.mp4'
for p in (1, 2):
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '330k',
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
    for src, name in (('cover.jpg', 'cover.jpg'), ('thumb_4x5.jpg', 'thumbnail 4x5.jpg'), ('captions.txt', 'captions and SEO.txt')):
        if (KNIT / src).exists():
            shutil.copy(KNIT / src, dl / f'{NAME} - {name}')
    print('delivered to', dl)
