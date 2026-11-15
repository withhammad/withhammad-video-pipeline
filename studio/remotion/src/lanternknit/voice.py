"""Spoken dhikr and the final soundtrack for the private knitted "Three lanterns" reel (LANTERN-KNIT). The owner's brief: a voice
says "SubhanAllah, SubhanAllah..." while the first lantern fills, then Alhamdulillah, then Allahu Akbar, over the reference's own
music. The voice is Lamia (ElevenLabs inside the owner's HeyGen account, his choice; edge-tts was rejected): ready-cut, Whisper-
checked 48 kHz takes, never re-generated here, never stretched or pitched. There is no Quran recitation in this reel. ONE command,
after the silent picture is rendered to <job>/knit/render.mp4:

    studio/.venv/bin/python -I studio/remotion/src/lanternknit/voice.py studio/.local/jobs/2fe6dca9a831 --check --deliver

Options: --takes <dir> (default <job>/knit/voice: subhanallah_01/02, alhamdulillah_01..03, allahuakbar_01..03), --db X (voice level
over the music around it, default 11), --check (Whisper medium, Arabic, offline: every phrase alone, in the mix and in the
delivered master must read its dhikr; stops before delivering if one does not), --deliver (copies the master and a 720p preview
under 2.5 MB to ~/Downloads), --out <name> (default final).

Per take: trims to the speech (within 55 dB of its loudest 5 ms, 20 ms before, 60 ms after), 6 ms fade in, 30 ms fade out.
Each phrase sits DB over the music under it (held within -2.5 / +4 dB of the counting's average). Per set: one phrase per count when its longest take fits the shortest gap between counts (24 frames, 0.80 s), else one per 2
counts (else 3), from the first count of the set, its first sound on the reference's landing tick (TICK_LEAD before the counter
steps), never overlapping the previous phrase; the take order is seeded and uneven (never three alike in a row) with a +-0.6 dB
spread. The reference track (public/audio.wav = source.mp4's stereo track) stays underneath unchanged; only gain, fades and one
latency-compensated lookahead limiter on the sum, so app.audio.master reaches -14 LUFS / -1.5 dBTP with a linear gain.
Writes <job>/knit/voice_mix.wav, voice_alone.wav, voice_check.json, <out>.mp4 and <out>_720.mp4.
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
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
KNIT = job / 'knit'
TAKES_DIR = Path(opt('--takes', KNIT / 'voice'))
DB, OUT = float(opt('--db', 11)), opt('--out', 'final')
SR, FPS = 48000, 30
here = Path(__file__).resolve().parent
STUDIO = here.parents[2]
NAME = 'Personal - Three lanterns knitted (wife, heal.ingthroughquran)'
TX = json.loads((here / 'texts.json').read_text())

# the reference clock: the frames where the counter steps (LanternKnit.tsx SETS), 30 fps
SETS_F = [
    [59, 85, 110, 136, 161, 186, 212, 237, 263, 288, 313, 339, 364, 390, 415, 440, 466, 491, 516, 541, 567, 592, 618, 643, 668, 694, 719,
     744, 769, 795, 820, 846, 870],
    [936, 962, 987, 1012, 1038, 1063, 1088, 1114, 1139, 1164, 1190, 1215, 1241, 1266, 1291, 1316, 1342, 1367, 1392, 1418, 1443, 1469, 1494,
     1519, 1544, 1570, 1596, 1620, 1646, 1671, 1697, 1722, 1747],
    [1838, 1864, 1889, 1915, 1940, 1965, 1991, 2016, 2042, 2067, 2092, 2118, 2143, 2169, 2194, 2219, 2245, 2270, 2295, 2320, 2346, 2371, 2397,
     2422, 2447, 2473, 2498, 2523, 2548, 2574, 2599, 2625, 2650],
]
TICK_LEAD = 0.02          # the reference's landing tick sounds ~0.02 s before its counter steps (onsets 1.95 / 2.80 / 3.65 s ...)
SETS = [('subhanallah', TX['sub'], SETS_F[0]), ('alhamdulillah', TX['hamd'], SETS_F[1]), ('allahuakbar', TX['akbar'], SETS_F[2])]


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


def wav16k(src):
    """16 kHz mono through a WAV file read with the wave module (no decoder inside Whisper)."""
    tmp = KNIT / '_w16.wav'
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-map', '0:a:0', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', str(tmp)])
    with wave.open(str(tmp), 'rb') as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    tmp.unlink()
    return a


def letters(s):
    s = re.sub('[ً-ٰٟۖ-ۭ]', '', s)        # harakat, dagger alif, Quranic marks
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
    return re.sub('[^ء-ي]', '', s)


rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
bed = decode(KNIT / 'public' / 'audio.wav', 2)
span = bed[int((SETS_F[0][0] / FPS - TICK_LEAD) * SR):int((SETS_F[2][-1] / FPS + 1.0) * SR)]
bed_db = rms(span)
rng = np.random.default_rng(99)
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
    print(f'{key}: {len(takes)} take(s) ({", ".join(t["name"] for t in takes)}), longest {longest:.2f} s with its tail; shortest '
          f'{every}-count gap {(fr[every:] - fr[:-every]).min() / FPS:.2f} s -> one phrase every {every} count(s): {len(counts)} phrases on counts '
          f'{", ".join(str(c + 1) for c in counts[:4])} ... {counts[-1] + 1}')
    order, last = [], [-1, -1]
    for _ in counts:
        c = int(rng.integers(len(takes)))
        if len(takes) > 1 and last[0] == last[1] == c:
            c = (c + 1) % len(takes)
        order.append(c); last = [last[1], c]
    for j, i in enumerate(counts):
        tk = takes[order[j]]
        t = frames[i] / FPS - TICK_LEAD                                    # the first sound on the landing tick
        t0, sp = t - tk['lead'], tk['x'][int(tk['lead'] * SR):]
        local = rms(bed[int(t * SR):int(t * SR) + len(sp)])
        # DB over the music right under the phrase, held within -2.5 / +4 dB of the counting's average so a quiet bar never buries it
        level = min(bed_db + 4, max(bed_db - 2.5, local)) + DB + float(rng.uniform(-0.6, 0.6))
        seg = tk['x'] * 10 ** ((level - tk['rms']) / 20)
        assert t0 >= prev_end, f'{key} at count {i + 1} would overlap the previous phrase'
        i0 = int(round(t0 * SR)); voice[i0:i0 + len(seg)] += seg[:, None]
        gap = t0 - prev_end
        prev_end = t0 + len(seg) / SR
        placed.append({'set': key, 'text': text, 'count': i + 1 + 33 * [s[0] for s in SETS].index(key), 'set_count': i + 1, 't': round(t, 3),
                       'take': tk['name'], 'end': round(prev_end, 3), 'gap_before': round(gap, 3) if j else None,
                       'db_over_bed': round(level - local, 1)})
gaps = [p['gap_before'] for p in placed if p['gap_before'] is not None]
print(f'bed {bed_db:.1f} dB RMS over the counting; voice {DB:+.1f} dB over the bed around each phrase '
      f'(measured over the music under each phrase: {min(p["db_over_bed"] for p in placed):+.1f} .. {max(p["db_over_bed"] for p in placed):+.1f} dB, '
      f'median {np.median([p["db_over_bed"] for p in placed]):+.1f}, {sum(10 <= p["db_over_bed"] <= 12.5 for p in placed)}/{len(placed)} within 10-12.5); {len(placed)} phrases; '
      f'silence between phrases {min(gaps):.2f} .. {max(gaps):.2f} s (none overlap)')

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

model = None


def whisper_pass(label, a):
    """Each placed phrase cut out of `a` (16 kHz mono), padded, transcribed in Arabic; returns the misreads."""
    global model
    if model is None:
        os.environ['HF_HUB_OFFLINE'] = '1'
        from faster_whisper import WhisperModel
        model = WhisperModel('medium', device='cpu', compute_type='int8')
    starts = [p['t'] for p in placed] + [len(a) / 16000]
    bad = []
    for p, nxt in zip(placed, starts[1:]):
        end = min(p['t'] + 2.0, nxt - 0.05)
        w = np.concatenate([np.zeros(8000, np.float32), a[int((p['t'] - 0.15) * 16000):int(end * 16000)], np.zeros(8000, np.float32)])
        segs, _ = model.transcribe(w, language='ar', beam_size=5, vad_filter=False, condition_on_previous_text=False)
        txt = ' '.join(s.text.strip() for s in segs)
        p['heard_' + label] = txt
        if letters(txt) != letters(p['text']):
            bad.append((label, p['set'], p['count'], p['take'], txt))
    print(f'Whisper medium, {label}: {len(placed) - len(bad)}/{len(placed)} phrases read their dhikr')
    return bad


if '--check' in args:
    bad = whisper_pass('voice_alone', wav16k(KNIT / 'voice_alone.wav')) + whisper_pass('voice_mix', wav16k(KNIT / 'voice_mix.wav'))
    (KNIT / 'voice_check.json').write_text(json.dumps(placed, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: fix or replace the takes above, then run again')

# mux the rendered picture (unchanged) with the soundtrack, then master
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
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(out), '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '115k',
         '-pass', str(p), '-passlogfile', str(KNIT / 'p720v')] + (['-an', '-f', 'mp4', os.devnull] if p == 1 else
         ['-pix_fmt', 'yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
          '-af', 'alimiter=limit=0.5309:attack=5:release=60:level=false:latency=true',   # -5.5 dB: low-bitrate AAC overshoots ~3 dB
          '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', str(prev)]))
for f in KNIT.glob('p720v*'):
    f.unlink()
pI, pTP = loud(prev)
print(f'{out} ({out.stat().st_size / 1e6:.1f} MB), {prev} ({prev.stat().st_size / 1e6:.2f} MB, {pI:.1f} LUFS, {pTP:.1f} dBTP)')
if '--check' in args:
    bad = whisper_pass('master', wav16k(out))
    (KNIT / 'voice_check.json').write_text(json.dumps(placed, ensure_ascii=False, indent=1))
    for b in bad:
        print('  not:', b)
    if bad:
        sys.exit('stopped: the delivered master misreads a phrase')
if '--deliver' in args:
    dl = Path.home() / 'Downloads'
    shutil.copy(out, dl / f'{NAME} - 1080x1920.mp4')
    shutil.copy(prev, dl / f'{NAME} - preview 720p.mp4')
    print('delivered to', dl)
