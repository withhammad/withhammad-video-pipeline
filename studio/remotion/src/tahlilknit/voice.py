"""Soundtrack, master and delivery for the private knitted "Say it 10 times" reel (TAHLIL-KNIT, her Instagram @heal.ingthroughquran).
The reference (DfOTKmjIIU2, @sabbih.ar) has NO voice: only a blackbird song (Diana Tudor, xeno-canto XC1059970, CC BY 4.0) under a
counter that steps every 5.0 s. The owner's chosen voice speaks the dhikr over it: Lamia (ElevenLabs v4 inside his HeyGen account,
voice 033e70e372284077883e538608b65b69; edge-tts was rejected), ONE take of texts.json "voice_script" (the dhikr three times, "..."
between), never re-generated here, never stretched or pitched.

    # 1. cut the HeyGen take at its pauses into <job>/knit/voice/tahlil_01..03.wav and Whisper-check each phrase
    studio/.venv/bin/python -I studio/remotion/src/tahlilknit/voice.py <job> cut <take.mp3>
    # 2. place, mix, master, check, deliver (after the silent picture is rendered to <job>/knit/render.mp4)
    studio/.venv/bin/python -I studio/remotion/src/tahlilknit/voice.py <job> mix --check --deliver
    # (mix --novoice: the reference soundtrack alone, for a picture check while the take is missing; never delivered)

Placement: the counter steps on the reference clock (geom.json "steps", 30 fps). One phrase per N counts with the smallest N for
which the longest take fits between two phrase starts (minus 0.2 s) and the last phrase ends before the reel does; each phrase's
first sound lands on the step of its count (the bead lands as she begins it), phrases never overlap; the take order is seeded and
uneven with a +-0.5 dB spread; each phrase sits --db (default 11) dB over the music under it (held within -2.5 / +4 dB of the
counting's average). The bed (public/audio.wav = source.mp4's stereo track, 48 kHz) is untouched: only gain, fades and one
latency-compensated lookahead limiter on the sum, then app.audio.master(I=-14, TP=-1.5).
--check: faster-whisper medium (Arabic, offline, numpy through the wave module) on every phrase alone and in the mix, and on the
delivered master; stops before delivering if one does not read the dhikr.
--deliver: ~/Downloads/"<NAME> - 1080x1920.mp4", "- preview 720p.mp4" (< 2.5 MB), "- cover 9x16.jpg", "thumbnail 4x5.jpg" and
"- captions.txt" (from <job>/knit: final.mp4, final_720.mp4, cover.jpg, thumb_4x5.jpg, captions.txt).
"""
import json
import os
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

args = sys.argv[1:]
job = Path(args[0])
mode = args[1] if len(args) > 1 else 'mix'
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
KNIT = job / 'knit'
VDIR = KNIT / 'voice'
DB = float(opt('--db', 11))
SR, FPS = 48000, 30
here = Path(__file__).resolve().parent
STUDIO = here.parents[2]
NAME = 'Personal - Say it 10 times knitted (wife, heal.ingthroughquran)'
TX = json.loads((here / 'texts.json').read_text())
G = json.loads((here / 'geom.json').read_text())
STEPS = G['steps']
NOVOICE = '--novoice' in args


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def decode(p, ch=1, sr=SR):
    return np.frombuffer(run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', str(ch), '-ar', str(sr), '-f', 'f32le', '-']).stdout,
                         np.float32).reshape(-1, ch).astype(np.float64)


def write(x, path, af=None, ch=2):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-'] + (['-af', af] if af else [])
    run(cmd + ['-c:a', 'pcm_f32le' if str(path).endswith('.f32.wav') else 'pcm_s24le', str(path)], input=x.astype('<f4').tobytes())


def loud(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr.split('Summary:')[-1]
    num = lambda key: float(r.split(key)[1].split()[0])
    return num('I:'), num('Peak:')


def wav16k(src):
    """16 kHz mono through a WAV file read with the wave module (no decoder inside Whisper)."""
    tmp = KNIT / '_w16.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', str(tmp)])
    with wave.open(str(tmp), 'rb') as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    tmp.unlink()
    return a


def letters(s):
    s = re.sub('[ً-ْٰـۖ-ۭ]', '', s)        # harakat, dagger alif, tatweel, Quranic marks
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ٱ', 'ا'), ('ى', 'ي')):
        s = s.replace(a, b)
    return re.sub('[^ء-ي]', '', s)


model = None


def whisper(a16):
    global model
    if model is None:
        os.environ['HF_HUB_OFFLINE'] = '1'
        from faster_whisper import WhisperModel
        model = WhisperModel('medium', device='cpu', compute_type='int8')
    pad = np.zeros(8000, np.float32)
    segs, _ = model.transcribe(np.concatenate([pad, a16.astype(np.float32), pad]), language='ar', beam_size=5, vad_filter=False,
                               condition_on_previous_text=False)
    return ' '.join(s.text.strip() for s in segs)


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
WANT = letters(TX['dhikr'])

# ------------------------------------------------------------------------------------------------------------------------- cut
if mode == 'cut':
    src = Path(args[2])
    VDIR.mkdir(parents=True, exist_ok=True)
    shutil.copy(src, VDIR / ('Lamia_tahlil' + src.suffix))
    a = decode(src)[:, 0]
    w, h = int(0.005 * SR), int(0.001 * SR)
    env = np.array([np.sqrt(np.mean(a[i:i + w] ** 2)) for i in range(0, len(a) - w, h)])
    r = 20 * np.log10(env + 1e-12) - 20 * np.log10(env.max() + 1e-12)      # dB re the loudest 5 ms, one value per ms
    sp = r > -45
    # pauses: runs of >= 350 ms under -45 dB between speech; the two longest inner pauses split the three phrases
    runs, i = [], 0
    while i < len(sp):
        if not sp[i]:
            j = i
            while j < len(sp) and not sp[j]:
                j += 1
            runs.append((i, j))
            i = j
        else:
            i += 1
    on, off = np.where(sp)[0][[0, -1]]
    inner = sorted([q for q in runs if q[0] > on and q[1] < off and q[1] - q[0] >= 350], key=lambda q: q[0] - q[1])[:2]
    inner.sort()
    assert len(inner) == 2, f'expected 3 phrases split by 2 long pauses, found pauses {runs}'
    cuts = [(on, inner[0][0]), (inner[0][1], inner[1][0]), (inner[1][1], off + 5)]
    meta, FADE = [], int(0.010 * SR)
    for k, (s0, s1) in enumerate(cuts, 1):
        s, e = max(0, s0 - 30), min(len(r), s1 + 60)
        x = a[s * h:e * h].copy()
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, FADE))
        x[:FADE] *= ramp
        x[-FADE:] *= ramp[::-1]
        f = VDIR / f'tahlil_{k:02d}.wav'
        with wave.open(str(f), 'wb') as wf:
            wf.setnchannels(1); wf.setsampwidth(3); wf.setframerate(SR)
            q = np.clip(np.round(x * 8388607), -8388608, 8388607).astype('<i4')
            wf.writeframes(q.view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
        heard = whisper(wav16k(f))
        ok = letters(heard) == WANT
        meta.append({'take': f.name, 'src_start': s / 1000, 'src_end': e / 1000, 'dur': round(len(x) / SR, 3), 'heard': heard, 'match': ok,
                     'level_at_cut_in_db': round(float(r[s]), 1), 'level_at_cut_out_db': round(float(r[min(e, len(r) - 1)]), 1)})
        print(json.dumps(meta[-1], ensure_ascii=False))
    (VDIR / 'cuts.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    bad = [m for m in meta if not m['match']]
    print(f'Whisper medium, takes alone: {len(meta) - len(bad)}/{len(meta)} read the dhikr')
    sys.exit(1 if bad else 0)

# ------------------------------------------------------------------------------------------------------------------------- mix
bed = decode(KNIT / 'public' / 'audio.wav', 2)
total = len(bed) / SR
span = bed[int(STEPS[0] / FPS * SR):int((STEPS[-1] / FPS + 3.0) * SR)]
bed_db = rms(span)
voice = np.zeros_like(bed)
placed = []
if not NOVOICE:
    files = sorted(VDIR.glob('tahlil_*.wav'))
    if not files:
        sys.exit(f'no takes in {VDIR}: run "cut <take.mp3>" first (or mix --novoice for a picture check, never delivered)')
    good = {m['take'] for m in json.loads((VDIR / 'cuts.json').read_text()) if m['match']}
    takes = []
    for f in files:
        if f.name not in good:
            print('skip (Whisper did not read it):', f.name)
            continue
        x = decode(f)[:, 0]
        env = np.convolve(np.abs(x), np.ones(240) / 240, 'same')
        on = np.where(env > env.max() * 10 ** (-50 / 20))[0]
        lead = on[0] / SR
        takes.append({'name': f.name, 'x': x, 'lead': lead, 'rms': rms(x[on[0]:on[-1]])})
    longest = max(len(t['x']) / SR - t['lead'] for t in takes)
    st = np.array(STEPS) / FPS
    N = next(n for n in (1, 2, 3, 5) if longest <= (st[n:] - st[:-n]).min() - 0.2 and st[::n][-1] + longest <= total - 0.3)
    counts = list(range(0, 10, N))
    print(f'{len(takes)} take(s), longest {longest:.2f} s with its tail; counts every {(st[1] - st[0]):.2f} s -> one phrase every {N} count(s): '
          f'{len(counts)} phrases on counts {", ".join(str(c + 1) for c in counts)}')
    rng = np.random.default_rng(10)
    order, last, prev_end = [], [-1, -1], -1.0
    for _ in counts:
        c = int(rng.integers(len(takes)))
        if len(takes) > 1 and last[0] == last[1] == c:
            c = (c + 1) % len(takes)
        order.append(c)
        last = [last[1], c]
    for j, i in enumerate(counts):
        tk = takes[order[j]]
        t = st[i]
        t0 = t - tk['lead']
        sp_ = tk['x'][int(tk['lead'] * SR):]
        local = rms(bed[int(t * SR):int(t * SR) + len(sp_)])
        level = min(bed_db + 4, max(bed_db - 2.5, local)) + DB + float(rng.uniform(-0.5, 0.5))
        seg = tk['x'] * 10 ** ((level - tk['rms']) / 20)
        assert t0 >= prev_end, f'count {i + 1} would overlap the previous phrase'
        i0 = int(round(t0 * SR))
        voice[i0:i0 + len(seg)] += seg[:, None]
        gap = t0 - prev_end
        prev_end = t0 + len(seg) / SR
        placed.append({'count': i + 1, 't': round(float(t), 3), 'take': tk['name'], 'end': round(prev_end, 3),
                       'gap_before': round(gap, 3) if j else None, 'db_over_bed': round(level - local, 1)})
    print(f'bed {bed_db:.1f} dB RMS over the counting; phrases {min(p["db_over_bed"] for p in placed):+.1f} .. '
          f'{max(p["db_over_bed"] for p in placed):+.1f} dB over the music under them; last phrase ends {placed[-1]["end"]:.2f} s of {total:.2f}')

tmp = KNIT / 'voice_mix.f32.wav'
mix = bed + voice
write(mix, tmp)
I0, _ = loud(tmp)
g = 10 ** ((-16.5 - I0) / 20)
mix *= g
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


def whisper_pass(label, a):
    bad = []
    for p in placed:
        w = a[int((p['t'] - 0.15) * 16000):int((p['end'] + 0.05) * 16000)]
        txt = whisper(w)
        p['heard_' + label] = txt
        if letters(txt) != WANT:
            bad.append((label, p['count'], p['take'], txt))
    print(f'Whisper medium, {label}: {len(placed) - len(bad)}/{len(placed)} phrases read the dhikr')
    return bad


if '--check' in args and placed:
    bad = whisper_pass('voice_alone', wav16k(KNIT / 'voice_alone.wav')) + whisper_pass('voice_mix', wav16k(KNIT / 'voice_mix.wav'))
    (KNIT / 'voice_check.json').write_text(json.dumps(placed, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: fix or replace the takes above, then run again')

OUT = 'novoice' if NOVOICE else 'final'
raw, out = KNIT / 'render.mp4', KNIT / f'{OUT}.mp4'
run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-i', str(KNIT / 'voice_mix.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
     '-c:a', 'aac', '-b:a', '320k', '-shortest', str(KNIT / f'{OUT}_raw.mp4')])
sys.path.insert(0, str(STUDIO))
from app import audio  # noqa: E402
m = audio.master(str(KNIT / f'{OUT}_raw.mp4'), str(out), I=-14.0, TP=-1.5)
(KNIT / f'{OUT}_raw.mp4').unlink()
print('master:', json.dumps({k: m[k] for k in ('normalization_type', 'output')}))
prev = KNIT / f'{OUT}_720.mp4'
for p in (1, 2):
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '270k',
         '-pass', str(p), '-passlogfile', str(KNIT / 'p720v')] + (['-an', '-f', 'mp4', os.devnull] if p == 1 else
         ['-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-af', 'alimiter=limit=0.5309:attack=5:release=60:level=false:latency=true',   # -5.5 dB: low-bitrate AAC overshoots ~3 dB
          '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(prev)]))
for f in KNIT.glob('p720v*'):
    f.unlink()
pI, pTP = loud(prev)
print(f'{out} ({out.stat().st_size / 1e6:.1f} MB), {prev} ({prev.stat().st_size / 1e6:.2f} MB, {pI:.1f} LUFS, {pTP:.1f} dBTP)')
if '--check' in args and placed:
    bad = whisper_pass('master', wav16k(out))
    (KNIT / 'voice_check.json').write_text(json.dumps(placed, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: the delivered master misreads a phrase')
if '--deliver' in args:
    if NOVOICE:
        sys.exit('not delivered: --novoice is a picture check only (every dhikr reel ships with the spoken dhikr)')
    assert prev.stat().st_size < 2.5e6, 'the 720p preview must stay under 2.5 MB'
    dl = Path.home() / 'Downloads'
    shutil.copy(out, dl / f'{NAME} - 1080x1920.mp4')
    shutil.copy(prev, dl / f'{NAME} - preview 720p.mp4')
    shutil.copy(KNIT / 'cover.jpg', dl / f'{NAME} - cover 9x16.jpg')
    shutil.copy(KNIT / 'thumb_4x5.jpg', dl / f'{NAME} - thumbnail 4x5.jpg')
    shutil.copy(KNIT / 'captions.txt', dl / f'{NAME} - captions.txt')
    print('delivered to', dl)
