"""Soft female dhikr voice for the private knitted Tasbeeh Fatimah reel (owner request 2026-11-15: "subhanallah, alhamdulillah,
Allahu Akbar with the sound should be there, background sound"). The reel has no Quran recitation; this only voices the counts.

    studio/.venv/bin/python -I studio/remotion/src/tasbeehknit/voice.py <job dir>

1. edge-tts (free), voice ar-SA-ZariyahNeural, fully voweled text in the pausal (waqf) form people use when counting:
   سُبْحَانَ اللَّهْ / الْحَمْدُ لِلَّهْ / اللَّهُ أَكْبَرْ  (the words of texts.json; only the last vowel becomes a sukun for the stop).
   Rate +20 % so each phrase (~0.85 s) fits between counts (0.93 s); three takes per phrase at slightly different pitch.
2. Every take is transcribed back with faster-whisper (medium, Arabic); a take whose letters do not match the phrase is rejected.
3. Each count gets one take, rotated, starting on the reference bead tick; the voice is warmed (high-pass, soft de-ess, a short
   room), then laid over the reference track, which is kept as it is, 4 dB lower. Output: <job>/knit/voice/mix.wav (48 kHz stereo).
   Mastering (app.audio.master, TP -1.5) happens when it is muxed onto the picture.
"""
import asyncio
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

job = Path(sys.argv[1])
vd = job / 'knit' / 'voice'
vd.mkdir(parents=True, exist_ok=True)
here = Path(__file__).resolve().parent
TX = json.loads((here / 'texts.json').read_text())
SUKUN = chr(0x0652)
VOWELS = {chr(c) for c in (0x064B, 0x064C, 0x064D, 0x064E, 0x064F, 0x0650)}


def waqf(s):
    """pausal form: the final short vowel of the last word becomes a sukun"""
    return s[:-1] + SUKUN if s[-1] in VOWELS else s


PHRASES = {'sub': waqf(TX['sub']), 'hamd': waqf(TX['hamd']), 'akbar': waqf(TX['akbar'])}
TAKES = [('+20%', '-2Hz'), ('+20%', '+0Hz'), ('+20%', '+3Hz')]
SR = 48000

# the reference clock: the frames where the counter steps (TasbeehKnit.tsx), 30 fps
P1 = [95, 123, 152, 180, 207, 235, 263, 292, 319, 347, 376, 403, 431, 459, 487, 515, 543, 571, 599, 627, 655, 683, 711, 739, 767, 795, 823,
      851, 879, 907, 935, 963, 991]
P2 = [1063, 1091, 1119, 1147, 1175, 1203, 1231, 1259, 1287, 1315, 1343, 1371, 1399, 1427, 1455, 1483, 1511, 1539, 1567, 1595, 1623, 1651,
      1679, 1707, 1735, 1763, 1791, 1819, 1847, 1875, 1903, 1931, 1959]
P3 = [2013, 2041, 2069, 2097, 2125, 2153, 2181, 2209, 2237, 2265, 2293, 2321, 2349, 2377, 2405, 2433, 2461, 2489, 2517, 2545, 2573, 2601,
      2629, 2657, 2685, 2713, 2741, 2769, 2797, 2825, 2853, 2881, 2909, 2937]
TICK_LEAD = 0.03          # the audio tick lands about one frame before the counter steps


def run(*a):
    return subprocess.run(a, capture_output=True, check=True)


def load(path, sr=SR):
    """decode any file to float32 mono at sr"""
    raw = run('ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-').stdout
    return np.frombuffer(raw, np.float32).copy()


def trim(x, db=-45, sr=SR):
    a = np.abs(x); thr = 10 ** (db / 20) * a.max()
    idx = np.where(a > thr)[0]
    return x[max(0, idx[0] - int(0.01 * sr)): idx[-1] + int(0.03 * sr)]


def letters(s):
    s = re.sub('[ً-ٰٟۖ-ۭ]', '', s)        # harakat, dagger alif, Quranic marks
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
    return re.sub('[^ء-ي]', '', s)


async def synth():
    import edge_tts
    for k, txt in PHRASES.items():
        for n, (rate, pitch) in enumerate(TAKES):
            f = vd / f'{k}{n}.mp3'
            if not f.exists():
                await edge_tts.Communicate(txt, 'ar-SA-ZariyahNeural', rate=rate, pitch=pitch).save(str(f))


asyncio.run(synth())

from faster_whisper import WhisperModel      # noqa: E402

model = WhisperModel('medium', device='cpu', compute_type='int8')
takes, report = {}, []
for k, txt in PHRASES.items():
    takes[k] = []
    for n in range(len(TAKES)):
        x = trim(load(vd / f'{k}{n}.mp3'))
        x16 = trim(load(vd / f'{k}{n}.mp3', 16000), sr=16000)
        segs, _ = model.transcribe(np.pad(x16, (8000, 8000)), language='ar', beam_size=5, vad_filter=False)
        heard = ' '.join(s.text.strip() for s in segs)
        ok = letters(heard) == letters(txt)
        report.append({'take': f'{k}{n}', 'text': txt, 'heard': heard, 'match': ok, 'dur': round(len(x) / SR, 3)})
        print(f'{k}{n}: {len(x) / SR:.2f}s heard "{heard}" -> {"OK" if ok else "REJECT"}')
        if ok:
            takes[k].append(x)
    assert takes[k], f'no clean take for {k}'
(vd / 'whisper_check.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))

# --- the voice track -------------------------------------------------------------------------------------------------
ref = load(job / 'knit' / 'master.wav')
voice = np.zeros(len(ref) + SR, np.float32)
for k, frames in zip(('sub', 'hamd', 'akbar'), (P1, P2, P3)):
    for i, fr in enumerate(frames):
        x = takes[k][i % len(takes[k])]
        x = x * np.minimum(1, np.linspace(0, len(x) / (0.015 * SR), len(x))) * np.minimum(1, np.linspace(len(x) / (0.04 * SR), 0, len(x)))
        s = int(round((fr / 30 - TICK_LEAD) * SR))
        voice[s:s + len(x)] += x
voice = voice[:len(ref)]
gaps = []
for k, frames in zip(('sub', 'hamd', 'akbar'), (P1, P2, P3)):
    longest = max(len(x) for x in takes[k]) / SR
    gaps.append(min(np.diff(frames)) / 30 - longest)
print('smallest gap between phrases: %.3f s' % min(gaps))
tmp = vd / 'voice_raw.wav'
with wave.open(str(tmp), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(voice / max(1e-6, np.abs(voice).max()) * 0.7, -1, 1) * 32767).astype(np.int16).tobytes())
# warm, soft voice: high-pass, gentle de-ess, a small room; then the reference 4 dB under it
run('ffmpeg', '-v', 'error', '-y', '-i', str(tmp), '-i', str(job / 'knit' / 'master.wav'), '-filter_complex',
    '[0:a]highpass=f=110,equalizer=f=6500:t=q:w=1.4:g=-4,equalizer=f=250:t=q:w=1:g=1.5,'
    'aecho=0.8:0.6:38|71:0.18|0.10[v];[1:a]volume=-4dB[m]',
    '-map', '[v]', '-c:a', 'pcm_s24le', str(vd / 'voice_proc.wav'), '-map', '[m]', '-c:a', 'pcm_s24le', str(vd / 'bed.wav'))


def lufs(path):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', err)[-1])


# one static gain puts the voice 4 LU above the bed (both gated integrated loudness), so it sits clearly on top
lv, lb = lufs(vd / 'voice_proc.wav'), lufs(vd / 'bed.wav')
g = (lb + 4.0) - lv
print(f'voice {lv:.1f} LUFS, bed {lb:.1f} LUFS -> voice gain {g:+.1f} dB')
run('ffmpeg', '-v', 'error', '-y', '-i', str(vd / 'bed.wav'), '-i', str(vd / 'voice_proc.wav'), '-filter_complex',
    f'[1:a]volume={g:.2f}dB,aformat=channel_layouts=stereo[v];[0:a][v]amix=inputs=2:duration=first:normalize=0,'
    'alimiter=limit=0.7:attack=4:release=80:level=false:latency=true[o]',          # peaks only; latency-compensated, no shift
    '-map', '[o]', '-c:a', 'pcm_s24le', str(vd / 'mix.wav'))
print('wrote', vd / 'mix.wav')
