"""Audio post for stage 5: voice polish, original music beds and SFX, loudness master, analysis.

All music and SFX are synthesized here with numpy (band-limited oscillators, ADSR envelopes,
filtered noise, a Freeverb-style reverb). No samples, loops or third-party recordings are used,
so every bed is original. ffmpeg does the voice chain and the two-pass -14 LUFS master.

Edit contract (edit.json; every src is relative to studio/remotion/public/):
  "avatar": "job/avatar_enhanced.mp4"
  "music":  {"src": "job/music.wav", "volume": 0.14, "fadeInMs": 400, "fadeOutMs": 1500, "duckTo": 0.09}
  "sfx":    [{"src": "job/sfx_whoosh.wav", "atMs": 5000, "volume": 0.35}]
Level calibration behind those numbers: enhance_voice() leaves the voice at VOICE_LUFS and every
bed peaks at -6 dBFS, so the bed sits well under the voice at `duckTo` and a little closer in the
pauses at `volume`. master() then lifts the finished mix to -14 LUFS / -1 dBTP.

CLI:  .venv/bin/python -m app.audio build <job_dir>   (avatar_enhanced.mp4 + audio/*)
"""
import argparse
import json
import math
import re
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

SR = 48000
VOICE_LUFS = -19.0           # enhanced voice level before the mix; master() adds the last few dB
BED_PEAK_DBFS = -6.0
SFX_PEAK_DBFS = -3.0
MASTER_TARGET = {'I': -14.0, 'TP': -1.0, 'LRA': 11.0}
MUSIC_DEFAULTS = {'volume': 0.14, 'duckTo': 0.09, 'fadeInMs': 400, 'fadeOutMs': 1500}
SMOOTH_MS = 150
VOICE_BAND = (1000.0, 4000.0)
OCTAVE_BANDS = ((31, 63), (63, 125), (125, 250), (250, 500), (500, 1000),
                (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000))

# The HeyGen clone measured ~10 dB short of a natural voice at 1-2 kHz, ~5 dB short at 2-4 kHz
# and ~5 dB heavy at 63-125 Hz (job 09a9d211fff0 vs the reference reel), so the chain trims the
# boom, keeps the 125-250 Hz body (the warmth) and opens clarity/presence instead of adding lows.
# Of five measured variants this one landed closest to the natural voice's octave balance
# (mean deviation 6.4 dB -> 2.6 dB) without exceeding it in any band.
VOICE_CHAIN = (
    'highpass=f=90:poles=2',
    'lowshelf=f=160:g=-4:t=q:w=0.7',
    'equalizer=f=300:t=q:w=1.2:g=-4',      # critic pass: 250-500 Hz read +2.6 dB boxy vs the reference
    'equalizer=f=1200:t=q:w=0.7:g=5',
    'equalizer=f=3500:t=q:w=1.2:g=2',
    'highshelf=f=7500:g=1:t=q:w=0.7',      # critic pass: +3 dB exposed TTS hiss on earbuds
    'deesser=i=0.3:m=0.5:f=0.5',
    'acompressor=threshold=0.08:ratio=2.2:attack=15:release=180:knee=3',
)
VOICE_ROOM_DB = -20.0     # wet level of a 0.3 s small-room IR; None skips it (measured: no clarity cost)
VOICE_CREST_DB = 12.0     # limiter ceiling above VOICE_LUFS, keeps master() in linear mode


# ----------------------------------------------------------------------------- tools and I/O

def run(cmd, timeout=900):
    """Run a tool and return the CompletedProcess (text mode); raise with the stderr tail."""
    process = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, timeout=timeout)
    if process.returncode:
        tail = (process.stderr or process.stdout).strip().splitlines()[-3:]
        raise RuntimeError(f'{cmd[0]} failed (exit {process.returncode}): ' + ' | '.join(tail))
    return process


def decode(path, sr=SR, channels=2):
    """Audio of any media file as float64 (n, channels) at sr."""
    process = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0', '-ac', str(channels),
                              '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, timeout=300)
    if process.returncode:
        raise RuntimeError('ffmpeg decode failed: ' + process.stderr.decode(errors='replace')[-300:])
    return np.frombuffer(process.stdout, '<f4').astype(np.float64).reshape(-1, channels)


def probe_duration(path):
    out = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of',
               'default=noprint_wrappers=1:nokey=1', path], timeout=60).stdout
    return float(out.strip())


def write_wav(path, audio, sr=SR, seed=0):
    """16-bit PCM WAV with TPDF dither (Remotion and every browser decode it)."""
    a = np.asarray(audio, np.float64)
    if a.ndim == 1:
        a = a[:, None]
    rng = np.random.default_rng(seed)
    dither = rng.random(a.shape) - rng.random(a.shape)
    q = np.clip(np.round(a * 32767.0 + dither), -32768, 32767).astype('<i2')
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as fh:
        fh.setnchannels(a.shape[1])
        fh.setsampwidth(2)
        fh.setframerate(sr)
        fh.writeframes(q.tobytes())
    return path


def read_wav(path):
    with wave.open(str(path), 'rb') as fh:
        channels, width, sr, n = fh.getnchannels(), fh.getsampwidth(), fh.getframerate(), fh.getnframes()
        if width != 2:
            raise ValueError(f'{path}: only 16-bit PCM is supported')
        data = np.frombuffer(fh.readframes(n), '<i2').astype(np.float64) / 32768.0
    return data.reshape(-1, channels), sr


def db(x):
    return 20.0 * math.log10(max(float(x), 1e-12))


def undb(d):
    return 10.0 ** (np.asarray(d, np.float64) / 20.0)


def midi_hz(note):
    return 440.0 * 2.0 ** ((np.asarray(note, np.float64) - 69.0) / 12.0)


# ----------------------------------------------------------------------------- DSP building blocks

def ramp(n, rising=True):
    """Raised-cosine ramp of n samples from exactly 0 to exactly 1 (or the reverse)."""
    if n <= 0:
        return np.zeros(0)
    if n == 1:
        return np.array([1.0 if rising else 0.0])
    r = 0.5 - 0.5 * np.cos(np.linspace(0.0, math.pi, n))
    return r if rising else r[::-1]


def adsr(n, a=0.01, d=0.1, s=0.8, r=0.1, sr=SR):
    """ADSR envelope exactly n samples long (release included); first and last sample are 0."""
    na, nd, nr = (max(1, int(round(v * sr))) for v in (a, d, r))
    if na + nd + nr > n:  # short note: squeeze the stages but keep both edges
        k = n / (na + nd + nr)
        na, nd = max(1, int(na * k)), int(nd * k)
        nr = max(1, n - na - nd)
    ns = max(0, n - na - nd - nr)
    env = np.empty(n)
    env[:na] = ramp(na)
    if nd:
        env[na:na + nd] = s + (1.0 - s) * ramp(nd + 1, rising=False)[1:]
    env[na + nd:na + nd + ns] = s
    env[n - nr:] = s * ramp(nr + 1, rising=False)[1:]
    return env


def edges(n, attack, release, sr=SR):
    """Flat envelope with raised-cosine edges: guarantees a click-free start and end."""
    env = np.ones(n)
    na, nr = min(n, max(1, int(attack * sr))), min(n, max(1, int(release * sr)))
    env[:na] *= ramp(na)
    env[n - nr:] *= ramp(nr, rising=False)
    return env


def running_phase(freq, n, sr=SR):
    """Unwrapped phase in radians for a scalar or per-sample frequency, starting at 0."""
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    ph = np.empty(n)
    ph[0] = 0.0
    np.cumsum(f[:-1], out=ph[1:])
    return ph * (2.0 * math.pi / sr)


def phase(freq, n, sr=SR, phase0=0.0):
    """Running phase in cycles (wrapped to [0, 1)) and per-sample increment for a scalar or array freq."""
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    inc = f / sr
    ph = np.empty(n)
    ph[0] = 0.0
    np.cumsum(inc[:-1], out=ph[1:])
    return (ph + phase0) % 1.0, inc


def polyblep_saw(freq, n, sr=SR, phase0=0.0):
    """Band-limited sawtooth: naive ramp minus a polyBLEP residual at each wrap (kills most aliasing)."""
    ph, dt = phase(freq, n, sr, phase0)
    y = 2.0 * ph - 1.0
    lo = ph < dt
    t = ph[lo] / dt[lo]
    y[lo] -= t + t - t * t - 1.0
    hi = ph > 1.0 - dt
    t = (ph[hi] - 1.0) / dt[hi]
    y[hi] -= t * t + t + t + 1.0
    return y


def lowpass(f, fc, order=2):
    return 1.0 / np.sqrt(1.0 + (np.asarray(f) / fc) ** (2 * order))


def highpass(f, fc, order=2):
    r = (np.asarray(f) / fc) ** (2 * order)
    return np.sqrt(r / (1.0 + r))


def bell(f, fc, gain_db, octaves=1.0):
    """Smooth log-frequency bell (Gaussian in octaves, `octaves` = standard deviation)."""
    x = np.log2(np.maximum(np.asarray(f, np.float64), 1.0) / fc) / octaves
    return undb(gain_db * np.exp(-0.5 * x * x))


def spectral(x, gain_fn, sr=SR, pad=8192):
    """Zero-phase static filter: multiply the spectrum by gain_fn(freqs). x is (n,) or (n, ch)."""
    x = np.asarray(x, np.float64)
    mono = x.ndim == 1
    x2 = x[:, None] if mono else x
    n = x2.shape[0]
    nfft = 1 << int(math.ceil(math.log2(n + 2 * pad)))
    buf = np.zeros((nfft, x2.shape[1]))
    buf[pad:pad + n] = x2
    spec = np.fft.rfft(buf, axis=0)
    spec *= gain_fn(np.fft.rfftfreq(nfft, 1.0 / sr))[:, None]
    y = np.fft.irfft(spec, n=nfft, axis=0)[pad:pad + n]
    return y[:, 0] if mono else y


def soft_clip(x, knee=0.7):
    """Linear below `knee`, tanh-shaped above it (continuous slope), asymptote 1."""
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    y[over] = np.sign(x[over]) * (knee + (1.0 - knee) * np.tanh((a[over] - knee) / (1.0 - knee)))
    return y


def _comb(x, delay, feedback, damp):
    """Freeverb comb with a 2-tap damping filter, solved `delay` samples at a time (vectorized).
    v[i] = x[i] + fb * ((1-damp) v[i-D] + damp v[i-D-1]); output v[i-D]."""
    n, d = len(x), int(delay)
    hist = np.zeros(n + d + 1)  # hist[j] = v[j - d - 1]; leading zeros are the past
    for s in range(0, n, d):
        m = min(d, n - s)
        hist[s + d + 1:s + d + 1 + m] = x[s:s + m] + feedback * (
            (1.0 - damp) * hist[s + 1:s + 1 + m] + damp * hist[s:s + m])
    return hist[1:n + 1]


def _allpass(x, delay, feedback=0.5):
    """Freeverb allpass: v[i] = x[i] + g v[i-D]; output v[i-D] - x[i]."""
    n, d = len(x), int(delay)
    hist = np.zeros(n + d)  # hist[j] = v[j - d]
    for s in range(0, n, d):
        m = min(d, n - s)
        hist[s + d:s + d + m] = x[s:s + m] + feedback * hist[s:s + m]
    return hist[:n] - x


FREEVERB_COMBS = (1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617)
FREEVERB_ALLPASSES = (556, 441, 341, 225)


def reverb(x, room=0.7, damp=0.5, width=1.0, sr=SR):
    """Freeverb-style stereo reverb (8 damped combs + 4 allpasses per side). Returns the wet signal."""
    x = np.asarray(x, np.float64)
    mono = (x.mean(axis=1) if x.ndim == 2 else x) * 0.015
    scale = sr / 44100.0
    feedback, damping = room * 0.28 + 0.7, damp * 0.4
    sides = []
    for spread in (0, 23):
        acc = sum(_comb(mono, round((c + spread) * scale), feedback, damping) for c in FREEVERB_COMBS)
        for a in FREEVERB_ALLPASSES:
            acc = _allpass(acc, round((a + spread) * scale))
        sides.append(acc)
    wet1, wet2 = 3.0 * (width / 2 + 0.5), 3.0 * ((1 - width) / 2)
    left, right = sides
    return np.stack([left * wet1 + right * wet2, right * wet1 + left * wet2], axis=1)


def echo(x, delay_s, feedback=0.3, damp=0.5, sr=SR):
    """Damped feedback delay (echoes only, no dry)."""
    return _comb(np.asarray(x, np.float64), round(delay_s * sr), feedback, damp)


def pump(n, beat_s, depth=0.45, attack_s=0.006, release=0.55, sr=SR):
    """Sidechain-pump gain: dips to 1-depth on every beat (over attack_s) and swells back to 1
    over release*beat with a (1-x)^2 curve, so the pad breathes with the kick."""
    pos = np.mod(np.arange(n) / sr, beat_s)
    x = np.clip((pos - attack_s) / (release * beat_s), 0.0, 1.0)
    g = 1.0 - depth * (1.0 - x) ** 2
    att = pos < attack_s
    g[att] = 1.0 - depth * pos[att] / attack_s
    return g


def place(buf, sig, at_s, gain=1.0, pan=0.0, sr=SR):
    """Mix a mono (constant-power panned) or stereo one-shot into buf (n, 2) at at_s."""
    i = int(round(at_s * sr))
    if i >= len(buf) or gain == 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    seg = sig[:len(buf) - i]
    if seg.ndim == 1:
        a = (pan + 1.0) * math.pi / 4.0
        buf[i:i + len(seg), 0] += seg * (gain * math.cos(a) * math.sqrt(2.0))
        buf[i:i + len(seg), 1] += seg * (gain * math.sin(a) * math.sqrt(2.0))
    else:
        buf[i:i + len(seg)] += seg * gain


def swing_time(pos_beats, swing, grid=0.5):
    """Delay every second note of a grid: with grid 0.5 the 'and' moves from 0.5 to `swing` beats."""
    k = round(pos_beats / grid)
    if abs(pos_beats - k * grid) < 1e-9 and k % 2 == 1:
        return (k - 1) * grid + 2.0 * grid * swing
    return pos_beats


# ----------------------------------------------------------------------------- instruments

def pad_chord(notes, dur_s, cutoff, rng, voices=3, detune_cents=10.0, attack=0.45, decay=0.8,
              sustain=0.85, release=0.7, sr=SR):
    """Warm detuned polyBLEP-saw pad: per note one centre saw shared by both sides (keeps it
    solid in mono on a phone) plus voices-1 detuned saws per side for width; low-passed, ADSR'd."""
    n = int(dur_s * sr)
    y = np.zeros((n, 2))
    for note in notes:
        hz = float(midi_hz(note))
        y += polyblep_saw(hz, n, sr, rng.random())[:, None]
        for ch in (0, 1):
            cents = np.linspace(-detune_cents, detune_cents, voices - 1) + rng.uniform(-detune_cents / 3,
                                                                                       detune_cents / 3, voices - 1)
            for c in cents:
                y[:, ch] += polyblep_saw(hz * 2.0 ** (c / 1200.0), n, sr, rng.random())
    y /= voices * len(notes)
    y = spectral(y, lambda f: lowpass(f, cutoff, 3) * highpass(f, 110, 2))
    return y * adsr(n, attack, decay, sustain, release, sr)[:, None]


def bass_note(hz, dur_s, sr=SR):
    """Soft sub bass: sine with a little 2nd/3rd harmonic (so phones still hint at it), tanh-warmed."""
    n = int(dur_s * sr)
    ph = 2.0 * math.pi * hz * np.arange(n) / sr
    y = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    y = np.tanh(1.5 * y)
    return y / np.max(np.abs(y)) * adsr(n, 0.008, 0.18, 0.75, 0.05, sr)


def kick(rng, f_start=150.0, f_end=48.0, pitch_tau=0.032, amp_tau=0.24, length=0.45, click=0.06, sr=SR):
    """Soft kick: sine with an exponential pitch drop, a whisper of low-passed click, gentle tanh."""
    n = int(length * sr)
    t = np.arange(n) / sr
    ph = 2.0 * math.pi * (f_end * t + (f_start - f_end) * pitch_tau * (1.0 - np.exp(-t / pitch_tau)))
    body = np.sin(ph) * np.exp(-t / amp_tau)
    tick = spectral(rng.standard_normal(n) * np.exp(-t / 0.004), lambda f: lowpass(f, 3500, 2)) * click
    y = np.tanh(1.3 * (body + tick)) * edges(n, 0.0015, 0.04, sr)
    return y / np.max(np.abs(y))


def hat(rng, decay=0.02, length=0.09, hp_hz=7000.0, sr=SR):
    """Closed hat: high-passed noise with a fast exponential decay (all energy above the voice band)."""
    n = int(length * sr)
    t = np.arange(n) / sr
    y = spectral(rng.standard_normal(n), lambda f: highpass(f, hp_hz, 3) * lowpass(f, 15000, 2))
    y = y * np.exp(-t / decay) * edges(n, 0.0006, 0.015, sr)
    return y / np.max(np.abs(y))


def snare_soft(rng, length=0.25, sr=SR):
    """Dusty, low-passed snare: 185 Hz body plus band-limited noise kept under ~2.5 kHz."""
    n = int(length * sr)
    t = np.arange(n) / sr
    body = np.sin(2 * math.pi * 185 * t) * np.exp(-t / 0.05)
    noise = spectral(rng.standard_normal(n), lambda f: highpass(f, 600, 2) * lowpass(f, 2400, 3)) * np.exp(-t / 0.09)
    y = (0.8 * body + 0.6 * noise / np.max(np.abs(noise))) * edges(n, 0.001, 0.04, sr)
    return y / np.max(np.abs(y))


def pluck(hz, dur_s, rng, bright=1.0, sr=SR):
    """Additive pluck: saw-like partials whose decay speeds up with partial number (a closing
    low-pass), only partials below 9 kHz, so it is alias-free by construction."""
    n = int(dur_s * sr)
    t = np.arange(n) / sr
    y = np.zeros(n)
    for k in range(1, max(1, min(14, int(9000 / hz))) + 1):
        rate = 2.2 + 7.0 * (k - 1) ** 1.25 / bright
        y += k ** -1.15 * np.exp(-rate * t) * np.sin(2 * math.pi * k * hz * t + rng.random() * 2 * math.pi)
    return y * adsr(n, 0.002, 0.001, 1.0, 0.08, sr)


def epiano(hz, dur_s, vel=1.0, freq_mod=None, sr=SR):
    """Rhodes-like 1:1 FM tone: bright bark on the attack that mellows as it decays."""
    n = int(dur_s * sr)
    t = np.arange(n) / sr
    ph = running_phase(hz * (freq_mod[:n] if freq_mod is not None else 1.0), n, sr)
    index = 0.25 + 1.3 * vel * np.exp(-t / 0.35)
    y = np.sin(ph + index * np.sin(ph)) + 0.12 * np.sin(2 * ph) * np.exp(-t / 0.2)
    return y * np.exp(-t / 1.6) * edges(n, 0.003, 0.12, sr)


def vinyl(n, rng, crackles_per_s=7.0, sr=SR):
    """Very quiet vinyl texture: windowed micro-crackles (never a hard step) plus soft hiss."""
    y = np.zeros(n)
    w = np.hanning(24)
    count = rng.poisson(crackles_per_s * n / sr)
    for p, a in zip(rng.integers(0, max(1, n - 24), count), rng.lognormal(-1.0, 0.8, count)):
        y[p:p + 24] += a * w * rng.standard_normal(24)
    y = spectral(y, lambda f: highpass(f, 1500, 2) * lowpass(f, 7000, 2))
    hiss = spectral(rng.standard_normal(n), lambda f: highpass(f, 300, 1) * lowpass(f, 5000, 1))
    y = y / (np.max(np.abs(y)) or 1.0) + 0.08 * hiss / (np.max(np.abs(hiss)) or 1.0)
    return y / np.max(np.abs(y))


# ----------------------------------------------------------------------------- music presets

PRESETS = {
    # C major, vi-IV-I-V colours; light four-on-floor, off-beat bass, pumping pad, 16th shaker.
    'pulse': {'bpm': 100, 'swing': 0.54, 'cutoff': 1500.0, 'lowpass': 12000.0,
              'chords': [(33, [57, 60, 64, 67]), (29, [53, 57, 60, 64]),
                         (36, [55, 59, 60, 64]), (31, [55, 59, 62, 64])],
              'gains': {'kick': -6.0, 'bass': -9.0, 'pad': 0.0, 'hats': -15.0, 'reverb': -9.0}},
    # F major ii-V-I-vi with 9ths/13ths; FM e-piano with tape wow, swung boom-bap, vinyl dust.
    'lofi': {'bpm': 85, 'swing': 0.62, 'lowpass': 6500.0,
             'chords': [(31, [65, 69, 70, 74]), (36, [64, 69, 70, 74]),
                        (29, [64, 67, 69, 72]), (38, [65, 69, 72, 76])],
             'gains': {'kick': -7.0, 'snare': -14.0, 'bass': -9.0, 'keys': 0.0, 'hats': -17.0,
                       'vinyl': -38.0, 'reverb': -8.0}},
    # D major Gmaj9-Dmaj9-Bm9-A add9; airy pad, 8th-note pluck arpeggio with echoes, half-time kick.
    'glow': {'bpm': 110, 'swing': 0.53, 'cutoff': 1300.0, 'lowpass': 14000.0,
             'chords': [(31, [54, 57, 59, 62]), (38, [54, 57, 61, 64]),
                        (35, [54, 57, 61, 62]), (33, [52, 57, 59, 61])],
             'gains': {'kick': -7.0, 'bass': -10.0, 'pad': -4.0, 'arp': -6.0, 'hats': -16.0, 'reverb': -8.0}},
}


def _opening(bar_index, bars_to_open=2):
    """Pad filter opens over the first bars (a gentle build), then stays put."""
    return min(1.0, 0.55 + 0.45 * bar_index / bars_to_open)


def _pulse(n, beat, bar, bars, p, rng, sr):
    stems = {k: np.zeros((n, 2)) for k in ('kick', 'bass', 'pad', 'hats')}
    k1, hats = kick(rng), [hat(rng, decay=d) for d in (0.016, 0.02, 0.025)]
    ghost = hat(rng, decay=0.012, hp_hz=8500)
    for b in range(bars):
        root, notes = p['chords'][b % 4]
        t0 = b * bar
        place(stems['pad'], pad_chord(notes, bar + 0.7, p['cutoff'] * _opening(b), rng), t0)
        for q in range(4):
            place(stems['kick'], k1, t0 + q * beat, 0.9 if q % 2 == 0 else 0.78)
            hz = float(midi_hz(root + (12 if q == 3 else 0)))
            place(stems['bass'], bass_note(hz, 0.42 * beat), t0 + (q + 0.5) * beat + rng.normal(0, 0.002), 0.9)
            place(stems['hats'], hats[rng.integers(3)], t0 + (q + 0.5) * beat + rng.normal(0, 0.002),
                  rng.uniform(0.75, 0.9), pan=0.15)
            for s in (0.25, 0.75):
                at = swing_time(q + s, p['swing'], grid=0.25)
                place(stems['hats'], ghost, t0 + at * beat + rng.normal(0, 0.003), rng.uniform(0.2, 0.32), pan=-0.3)
    stems['pad'] *= pump(n, beat, depth=0.5, sr=sr)[:, None]
    stems['reverb'] = reverb(stems['pad'] * 0.6 + stems['hats'] * 0.3, room=0.75, damp=0.5, sr=sr)
    return stems


def _lofi(n, beat, bar, bars, p, rng, sr):
    stems = {k: np.zeros((n, 2)) for k in ('kick', 'snare', 'bass', 'keys', 'hats')}
    t = np.arange(n + int(4 * bar * sr)) / sr
    wow = 2.0 ** ((6.0 * np.sin(2 * math.pi * 0.4 * t) + 1.5 * np.sin(2 * math.pi * 5.3 * t + 1.0)) / 1200.0)
    trem = 0.13 * np.sin(2 * math.pi * 4.2 * np.arange(n) / sr)
    k1, sn = kick(rng, f_start=120.0, f_end=50.0, amp_tau=0.2, click=0.03), snare_soft(rng)
    hats = [hat(rng, decay=d, hp_hz=6500) for d in (0.014, 0.018, 0.024)]
    and3 = swing_time(2.5, p['swing'])
    for b in range(bars):
        root, notes = p['chords'][b % 4]
        t0 = b * bar
        for at, dur, vel in ((0.0, 2.4, 0.9), (and3, 1.3, 0.6)):
            for j, note in enumerate(sorted(notes)):  # gentle strum, low to high
                s = max(0.0, t0 + at * beat + j * 0.014 + rng.normal(0, 0.003))
                i = int(s * sr)
                tone = epiano(float(midi_hz(note)), dur * beat, vel * rng.uniform(0.9, 1.05), wow[i:])
                place(stems['keys'], tone, s, vel / len(notes), pan=-0.25 + 0.5 * j / (len(notes) - 1))
        for at, dur, semis in ((0.0, 1.5, 0), (and3, 0.8, 0), (swing_time(3.5, p['swing']), 0.3, 7)):
            place(stems['bass'], bass_note(float(midi_hz(root + semis)), dur * beat), t0 + at * beat, 0.9)
        for at, vel in ((0.0, 1.0), (and3, 0.75)):
            place(stems['kick'], k1, t0 + at * beat + rng.normal(0, 0.002), vel)
        for q in (1, 3):
            place(stems['snare'], sn, t0 + q * beat + 0.012 + rng.normal(0, 0.003), rng.uniform(0.8, 0.95))
        for e in range(8):
            at = swing_time(e * 0.5, p['swing'])
            vel = (0.62 if e % 2 == 0 else 0.42) * rng.uniform(0.85, 1.1)
            place(stems['hats'], hats[rng.integers(3)], t0 + at * beat + rng.normal(0, 0.004), vel, pan=0.2)
    stems['keys'] *= np.stack([1.0 + trem, 1.0 - trem], axis=1)  # Rhodes-style auto-pan
    stems['vinyl'] = np.stack([vinyl(n, rng), vinyl(n, rng)], axis=1)
    stems['reverb'] = reverb(stems['keys'] * 0.7 + stems['snare'] * 0.3, room=0.6, damp=0.65, sr=sr)
    return stems


def _glow(n, beat, bar, bars, p, rng, sr):
    stems = {k: np.zeros((n, 2)) for k in ('kick', 'bass', 'pad', 'arp', 'hats')}
    k1, hats = kick(rng, f_start=160.0, f_end=46.0), [hat(rng, decay=d, hp_hz=7500) for d in (0.012, 0.016, 0.02)]
    pattern = (0, 1, 2, 3, 1, 2, 3, 2)
    for b in range(bars):
        root, notes = p['chords'][b % 4]
        t0 = b * bar
        place(stems['pad'], pad_chord(notes, bar + 0.9, p['cutoff'] * _opening(b), rng, voices=3,
                                      detune_cents=13.0, attack=0.6, release=0.9), t0)
        tones = sorted(notes)
        for e, idx in enumerate(pattern):
            at = swing_time(e * 0.5, p['swing'])
            vel = (0.95 if e % 2 == 0 else 0.7) * rng.uniform(0.9, 1.05)
            place(stems['arp'], pluck(float(midi_hz(tones[idx] + 12)), 0.55, rng), t0 + at * beat, vel,
                  pan=0.35 * (1 if e % 2 else -1))
        for at, vel in ((0.0, 1.0), (1.5, 0.55), (2.0, 0.9)):
            place(stems['kick'], k1, t0 + at * beat, vel)
        for at, dur in ((0.0, 1.35), (1.5, 0.4), (2.0, 1.8)):
            place(stems['bass'], bass_note(float(midi_hz(root)), dur * beat), t0 + at * beat, 0.9)
        for e in range(8):
            at = swing_time(e * 0.5, p['swing'])
            place(stems['hats'], hats[rng.integers(3)], t0 + at * beat + rng.normal(0, 0.002),
                  (0.5 if e % 2 == 0 else 0.34) * rng.uniform(0.85, 1.1), pan=0.25)
    stems['pad'] *= pump(n, 2 * beat, depth=0.4, release=0.6, sr=sr)[:, None]  # half-time breathe
    arp = stems['arp']
    stems['arp'] = arp + 0.35 * np.stack([echo(arp[:, 1], 0.75 * beat, 0.3), echo(arp[:, 0], 1.0 * beat, 0.3)], 1)
    stems['reverb'] = reverb(stems['pad'] * 0.6 + stems['arp'] * 0.8, room=0.85, damp=0.45, sr=sr)
    return stems


ARRANGERS = {'pulse': _pulse, 'lofi': _lofi, 'glow': _glow}


def make_music(style='pulse', duration_s=23.5, bpm=None, seed=7, out_wav=None, sr=SR, return_stems=False):
    """Render an original background bed: 48 kHz stereo float (n, 2), peak BED_PEAK_DBFS, a 10 ms
    fade-in and a 1.5 s fade tail. The arrangement is a 4-chord, 4-bar loop on a fixed grid (only
    the first two bars open the pad filter), so from bar 3 on any 4-bar window loops musically;
    the file itself is a one-shot. Writes a 16-bit WAV when out_wav is given."""
    if style not in PRESETS:
        raise ValueError(f'unknown music style {style!r}; choose from {sorted(PRESETS)}')
    p = PRESETS[style]
    bpm = float(bpm or p['bpm'])
    beat = 60.0 / bpm
    bar = 4 * beat
    n = int(round(duration_s * sr))
    bars = int(math.ceil(duration_s / bar)) + 1
    rng = np.random.default_rng(seed)
    stems = ARRANGERS[style](n, beat, bar, bars, p, rng, sr)
    for name, stem in stems.items():  # each stem to a common RMS before the preset's balance
        rms = math.sqrt(float(np.mean(stem ** 2))) or 1.0
        stems[name] = stem * (0.1 / rms) * float(undb(p['gains'][name]))
    mix = sum(stems.values())
    # Bus: rumble cut, a -5 dB pocket around 1-4 kHz for the voice, preset top end.
    mix = spectral(mix, lambda f: highpass(f, 28, 2) * lowpass(f, p['lowpass'], 2) * bell(f, 2200, -5.0, 0.8))
    mix = soft_clip(mix / np.percentile(np.abs(mix), 99.9) * 0.8, knee=0.7)
    mix *= edges(n, 0.01, 1.5, sr)[:, None]
    mix *= float(undb(BED_PEAK_DBFS)) / np.max(np.abs(mix))
    if out_wav:
        write_wav(out_wav, mix, sr, seed)
    return (mix, stems) if return_stems else mix


# ----------------------------------------------------------------------------- SFX

def _swept_noise(n, centers_hz, width_oct, rng, sr=SR, frame=1024):
    """Noise through a band-pass whose centre follows centers_hz (one value per sample), done as
    sqrt-Hann STFT overlap-add at 75 % overlap (the windows sum to a constant, no frame seams)."""
    hop = frame // 4
    win = np.sqrt(0.5 - 0.5 * np.cos(2 * math.pi * np.arange(frame) / frame))
    total = n + 2 * frame
    x = rng.standard_normal(total)
    y = np.zeros(total)
    freqs = np.fft.rfftfreq(frame, 1.0 / sr)
    centers = np.concatenate([np.full(frame, centers_hz[0]), centers_hz, np.full(frame, centers_hz[-1])])
    for s in range(0, total - frame, hop):
        fc = centers[s + frame // 2]
        g = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1.0) / fc) / width_oct) ** 2)
        y[s:s + frame] += np.fft.irfft(np.fft.rfft(x[s:s + frame] * win) * g, n=frame) * win
    return y[frame:frame + n] / 2.0


def make_sfx(kind, out_wav=None, seed=3, sr=SR):
    """Procedural transition sounds, 48 kHz stereo, peak SFX_PEAK_DBFS, zero at both ends:
    whoosh (~350 ms band-pass noise sweep, panned L->R), pop (~90 ms sine blip with a pitch drop),
    tick (~40 ms UI click), riser (~1.2 s noise + tone climbing into a cut)."""
    rng = np.random.default_rng(seed)
    if kind == 'whoosh':
        n = int(0.36 * sr)
        u = np.linspace(0.0, 1.0, n)
        rise = np.clip(u / 0.6, 0, 1)
        centers = np.exp(np.log(300) + (np.log(2600) - np.log(300)) * np.sin(0.5 * math.pi * rise))
        centers[u > 0.6] = np.exp(np.log(2600) + (np.log(700) - np.log(2600)) * (u[u > 0.6] - 0.6) / 0.4)
        body = np.stack([_swept_noise(n, centers, 0.6, rng, sr), _swept_noise(n, centers, 0.6, rng, sr)], 1)
        amp = np.where(u < 0.6, np.sin(0.5 * math.pi * np.minimum(u, 0.6) / 0.6) ** 2,
                       np.cos(0.5 * math.pi * np.clip(u - 0.6, 0.0, 0.4) / 0.4) ** 1.5)
        pan = (u * 2 - 1) * 0.7
        a = (pan + 1) * math.pi / 4
        y = body * (amp * edges(n, 0.004, 0.01, sr))[:, None] * np.stack([np.cos(a), np.sin(a)], 1) * math.sqrt(2)
    elif kind == 'pop':
        n = int(0.09 * sr)
        t = np.arange(n) / sr
        ph = running_phase(380.0 + 520.0 * np.exp(-t / 0.018), n, sr)
        y = (np.sin(ph) + 0.2 * np.sin(2 * ph) * np.exp(-t / 0.01)) * np.exp(-t / 0.025)
        y = np.repeat((y * edges(n, 0.001, 0.02, sr))[:, None], 2, 1)
    elif kind == 'tick':
        n = int(0.04 * sr)
        t = np.arange(n) / sr
        noise = spectral(rng.standard_normal(n), lambda f: highpass(f, 2500, 2) * lowpass(f, 9000, 2))
        y = (0.6 * np.sin(2 * math.pi * 3200 * t) * np.exp(-t / 0.004)
             + 0.4 * np.sin(2 * math.pi * 1800 * t) * np.exp(-t / 0.008)
             + 0.3 * noise / np.max(np.abs(noise)) * np.exp(-t / 0.002))
        y = np.repeat((y * edges(n, 0.0008, 0.008, sr))[:, None], 2, 1)
    elif kind == 'riser':
        n = int(1.2 * sr)
        u = np.linspace(0.0, 1.0, n)
        centers = 300.0 * (7000.0 / 300.0) ** u
        noise = np.stack([_swept_noise(n, centers, 0.8, rng, sr), _swept_noise(n, centers, 0.8, rng, sr)], 1)
        ph = running_phase(220.0 * 4.0 ** u * (1 + 0.006 * u * np.sin(2 * math.pi * 7.2 * u)), n, sr)
        tone = np.sin(ph) + 0.35 * np.sin(1.5 * ph)
        tone = spectral(tone, lambda fr: lowpass(fr, 3000, 2))
        y = (noise / np.max(np.abs(noise)) + 0.45 * tone[:, None] / np.max(np.abs(tone)))
        y *= (u ** 2.2 * edges(n, 0.25, 0.025, sr))[:, None]
    else:
        raise ValueError(f'unknown sfx {kind!r}; choose whoosh, pop, tick or riser')
    y *= float(undb(SFX_PEAK_DBFS)) / np.max(np.abs(y))
    if out_wav:
        write_wav(out_wav, y, sr, seed)
    return y


SFX_KINDS = ('whoosh', 'pop', 'tick', 'riser')


# ----------------------------------------------------------------------------- ducking (edit contract)

def speech_mask(captions, n, sr=SR):
    """1 while any caption word is being spoken (startMs <= t < endMs), else 0."""
    m = np.zeros(n)
    for c in captions:
        a, b = int(c['startMs'] * sr / 1000), int(c['endMs'] * sr / 1000)
        m[max(a, 0):min(b, n)] = 1.0
    return m


def duck_curve(captions, duration_ms, volume=0.14, duck_to=0.09, fade_in_ms=400, fade_out_ms=1500,
               smooth_ms=SMOOTH_MS, sr=SR):
    """Music gain per sample exactly as edit.json's "music" block defines it: duck_to while a word
    is spoken, volume otherwise, the step smoothed by a centred smooth_ms moving average, then a
    linear fade-in from 0 and a linear fade-out to 0 at duration_ms."""
    n = int(round(duration_ms * sr / 1000))
    m = speech_mask(captions, n, sr)
    k = max(1, int(round(smooth_ms * sr / 1000)))
    padded = np.pad(m, (k // 2, k - 1 - k // 2), mode='edge')
    c = np.concatenate(([0.0], np.cumsum(padded)))
    smooth = (c[k:] - c[:-k]) / k
    gain = volume + (duck_to - volume) * smooth
    t_ms = np.arange(n) * 1000.0 / sr
    fade = np.clip(t_ms / max(fade_in_ms, 1e-9), 0, 1) * np.clip((duration_ms - t_ms) / max(fade_out_ms, 1e-9), 0, 1)
    return gain * fade


# ----------------------------------------------------------------------------- ffmpeg stages

PHONE_SIM = 'highpass=f=250:poles=2,highpass=f=250:poles=2'  # small phone speaker: little below 250 Hz


def _ebur128(path, pre=''):
    err = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-map', '0:a:0',
               '-af', f'{pre}ebur128=peak=true:framelog=quiet', '-f', 'null', '-']).stderr
    summary = err[err.rfind('Summary:'):]

    def grab(pattern):
        m = re.search(pattern, summary, re.S)
        return float(m.group(1)) if m and m.group(1) != '-inf' else float('-inf')
    return {'lufs': grab(r'I:\s+(-?[\d.]+|-inf) LUFS'), 'lra': grab(r'LRA:\s+(-?[\d.]+) LU'),
            'true_peak_dbtp': grab(r'True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS')}


def analyze(path):
    """Loudness (ffmpeg ebur128: integrated LUFS, LRA, true peak) plus numpy spectrum stats:
    sample peak, clipped-sample count, spectral centroid, share of 20 Hz-20 kHz energy in
    1-4 kHz (the band speech intelligibility lives in) and octave-band levels re total.
    lufs_phone is the integrated loudness after a 24 dB/oct 250 Hz high-pass (what a phone
    speaker roughly reproduces), the fairer way to compare a bass-heavy bed with a voice."""
    out = _ebur128(path)
    out['lufs_phone'] = _ebur128(path, PHONE_SIM + ',')['lufs']
    x = decode(path)
    out['duration_s'] = round(len(x) / SR, 3)
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    out['sample_peak_dbfs'] = round(db(peak), 2)
    out['clipped_samples'] = int(np.sum(np.abs(x) >= 0.9999))
    out['rms_dbfs'] = round(db(math.sqrt(float(np.mean(x ** 2)))) if len(x) else -240.0, 2)
    mono = x.mean(axis=1)
    frame = 4096
    if len(mono) < frame:
        mono = np.pad(mono, (0, frame - len(mono)))
    frames = np.lib.stride_tricks.sliding_window_view(mono, frame)[::frame // 2] * np.hanning(frame)
    power = np.mean(np.abs(np.fft.rfft(frames, axis=1)) ** 2, axis=0)
    f = np.fft.rfftfreq(frame, 1.0 / SR)
    audible = (f >= 20) & (f <= 20000)
    total = float(power[audible].sum()) or 1e-30
    out['centroid_hz'] = round(float((f[audible] * power[audible]).sum() / total), 1)
    band = (f >= VOICE_BAND[0]) & (f < VOICE_BAND[1])
    out['share_1_4k'] = round(float(power[band].sum()) / total, 4)
    out['bands_db'] = {f'{a}-{b}': round(10 * math.log10(max(float(power[(f >= a) & (f < b)].sum()), 1e-30) / total), 1)
                       for a, b in OCTAVE_BANDS}
    return out


def room_ir(path, rt60=0.32, predelay_s=0.006, seed=11, sr=SR):
    """Small-room impulse response (decorrelated stereo noise, exponential decay, 250 Hz-5 kHz).
    Written at peak 0.9; returns (path, dB to add so the wet path has unit energy gain)."""
    rng = np.random.default_rng(seed)
    n = int((rt60 + 0.08) * sr)
    t = np.arange(n) / sr
    ir = rng.standard_normal((n, 2)) * np.exp(-6.91 * t / rt60)[:, None]
    ir[:int(predelay_s * sr)] = 0.0
    ir = spectral(ir, lambda f: highpass(f, 250, 2) * lowpass(f, 5000, 2))
    ir *= edges(n, 0.0005, 0.02, sr)[:, None]
    ir /= math.sqrt(float(np.max(np.sum(ir ** 2, axis=0))))
    peak = float(np.max(np.abs(ir)))
    write_wav(path, ir * (0.9 / peak), sr, seed)
    return Path(path), db(peak / 0.9)


def enhance_voice(in_video, out_video, target_lufs=VOICE_LUFS, chain=VOICE_CHAIN, room_db=VOICE_ROOM_DB,
                  crest_db=VOICE_CREST_DB):
    """Warmer, clearer voice: VOICE_CHAIN (EQ, light de-ess, gentle compression), an optional
    very low small-room send, a fixed gain to target_lufs (measured in a first pass) and a
    lookahead limiter crest_db above it (latency-compensated, so sync is untouched).
    Video stream copied untouched; audio AAC 48 kHz stereo."""
    Path(out_video).parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        inputs = ['-i', str(in_video)]
        graph = '[0:a:0]' + ','.join(chain)
        if room_db is not None:
            ir, ir_gain = room_ir(Path(tmp) / 'room.wav')
            inputs += ['-i', str(ir)]
            graph += (f',asplit=2[dry][send];[send][1:a]afir=irnorm=-1:irgain=1,volume={room_db + ir_gain:.2f}dB[wet];'
                      '[dry][wet]amix=inputs=2:normalize=0:duration=first')
        err = run(['ffmpeg', '-hide_banner', '-nostats', *inputs, '-filter_complex',
                   graph + ',ebur128=framelog=quiet[m]', '-map', '[m]', '-f', 'null', '-']).stderr
        m = re.search(r'I:\s+(-?[\d.]+) LUFS', err[err.rfind('Summary:'):])
        gain = target_lufs - float(m.group(1)) if m else 0.0
        ceiling = float(min(1.0, undb(target_lufs + crest_db)))
        final = (f'{graph},volume={gain:.2f}dB,'
                 f'alimiter=limit={ceiling:.4f}:attack=5:release=60:level=0:latency=1,aresample=48000[a]')
        run(['ffmpeg', '-y', '-hide_banner', '-nostats', *inputs, '-filter_complex', final, '-map', '0:v?',
             '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
             '-movflags', '+faststart', str(out_video)])
    return {'gain_db': round(gain, 2), 'room_db': room_db, 'limit_dbfs': round(target_lufs + crest_db, 1),
            'chain': ','.join(chain)}


def _loudnorm_json(stderr):
    blocks = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', stderr, re.S)
    if not blocks:
        raise RuntimeError('loudnorm printed no stats')
    return json.loads(blocks[-1])


def master(in_video, out_video, I=MASTER_TARGET['I'], TP=MASTER_TARGET['TP'], LRA=MASTER_TARGET['LRA']):
    """Two-pass EBU R128 loudnorm (linear when possible) to I LUFS / TP dBTP, video copied.
    If AAC encoding pushes the true peak over TP, pass 2 is redone once with the overshoot
    taken off the peak target."""
    base = f'loudnorm=I={I}:TP={TP}:LRA={LRA}'
    m = _loudnorm_json(run(['ffmpeg', '-hide_banner', '-nostats', '-i', in_video, '-map', '0:a:0',
                            '-af', base + ':print_format=json', '-f', 'null', '-']).stderr)
    codec = (['-c:a', 'pcm_s16le'] if str(out_video).endswith('.wav')
             else ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'])
    tp_target, stats, after = TP, {}, {}
    for _ in range(2):
        second = (f'loudnorm=I={I}:TP={tp_target}:LRA={LRA}:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}'
                  f':measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}'
                  f':offset={m["target_offset"]}:linear=true:print_format=json')
        stats = _loudnorm_json(run(['ffmpeg', '-y', '-hide_banner', '-nostats', '-i', in_video, '-map', '0:v?',
                                    '-map', '0:a:0', '-c:v', 'copy', '-af', second, '-ar', '48000', *codec,
                                    out_video]).stderr)
        after = _ebur128(out_video)
        if after['true_peak_dbtp'] <= TP + 0.05:
            break
        tp_target = round(max(-9.0, tp_target - (after['true_peak_dbtp'] - TP) - 0.1), 2)
    return {'input': m, 'normalization_type': stats.get('normalization_type'), 'tp_target_used': tp_target,
            'output': after}


def mix_preview(voice_video, music_wav, captions, out_video, music=None, workdir=None):
    """Voice + ducked bed (gain curve from duck_curve(), the same rule the Remotion edit uses),
    mixed at unity with amix normalize=0, then mastered. For the owner to audition a bed."""
    music = {**MUSIC_DEFAULTS, **(music or {})}
    duration_ms = probe_duration(voice_video) * 1000.0
    bed, sr = read_wav(music_wav)
    gain = duck_curve(captions, duration_ms, music['volume'], music['duckTo'], music['fadeInMs'], music['fadeOutMs'], sr=sr)
    n = len(gain)
    bed = np.pad(bed, ((0, max(0, n - len(bed))), (0, 0)))[:n] * gain[:, None]
    with tempfile.TemporaryDirectory(dir=workdir) as tmp:
        ducked = write_wav(Path(tmp) / 'ducked.wav', bed, sr)
        mixed = Path(tmp) / 'mixed.mp4'
        run(['ffmpeg', '-y', '-hide_banner', '-nostats', '-i', voice_video, '-i', ducked, '-filter_complex',
             '[0:a][1:a]amix=inputs=2:duration=first:normalize=0[a]', '-map', '0:v?', '-map', '[a]',
             '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', mixed])
        return master(mixed, out_video)


# ----------------------------------------------------------------------------- job build

def build_job(job_dir, presets=tuple(PRESETS), music_tail_s=1.65):
    """Produce every audio asset for a job folder: avatar_enhanced.mp4, audio/music_<preset>.wav,
    audio/sfx_<kind>.wav, audio/preview_<preset>.mp4 and audio/analysis.json."""
    job = Path(job_dir)
    out = job / 'audio'
    out.mkdir(parents=True, exist_ok=True)
    report = {'voice_before': analyze(job / 'avatar.mp4')}
    report['enhance'] = enhance_voice(job / 'avatar.mp4', job / 'avatar_enhanced.mp4')
    report['voice_after'] = analyze(job / 'avatar_enhanced.mp4')
    duration = round(probe_duration(job / 'avatar.mp4') + music_tail_s, 1)
    captions = json.loads((job / 'captions.json').read_text())
    report['beds'], report['previews'], report['sfx'] = {}, {}, {}
    for preset in presets:
        wav = out / f'music_{preset}.wav'
        make_music(preset, duration, out_wav=wav)
        bed = analyze(wav)
        bed['under_voice_lu'] = {k: round(report['voice_after']['lufs'] - (bed['lufs'] + db(MUSIC_DEFAULTS[k])), 1)
                                 for k in ('duckTo', 'volume')}
        bed['bpm'] = PRESETS[preset]['bpm']
        bed['loop_s'] = round(4 * 4 * 60.0 / PRESETS[preset]['bpm'], 3)
        report['beds'][preset] = bed
        master_stats = mix_preview(job / 'avatar_enhanced.mp4', wav, captions, out / f'preview_{preset}.mp4')
        report['previews'][preset] = {'normalization_type': master_stats['normalization_type'],
                                      **analyze(out / f'preview_{preset}.mp4')}
    for kind in SFX_KINDS:
        make_sfx(kind, out / f'sfx_{kind}.wav')
        report['sfx'][kind] = analyze(out / f'sfx_{kind}.wav')
    voice_share = report['voice_after']['share_1_4k']
    report['checks'] = {preset: {'share_below_voice': bed['share_1_4k'] < voice_share,
                                 'no_clipping': bed['clipped_samples'] == 0 and bed['sample_peak_dbfs'] <= -5.9}
                        for preset, bed in report['beds'].items()}
    (out / 'analysis.json').write_text(json.dumps(report, indent=1))
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(prog='python -m app.audio')
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build', help='enhance the voice, render beds, SFX and previews for a job folder')
    b.add_argument('job_dir')
    b.add_argument('--presets', nargs='*', default=list(PRESETS))
    a = sub.add_parser('analyze', help='print loudness/spectrum stats for media files')
    a.add_argument('paths', nargs='+')
    m = sub.add_parser('master', help='two-pass loudnorm to -14 LUFS / -1 dBTP, video copied')
    m.add_argument('src')
    m.add_argument('dst')
    args = parser.parse_args(argv)
    if args.cmd == 'build':
        print(json.dumps(build_job(args.job_dir, tuple(args.presets)), indent=1))
    elif args.cmd == 'analyze':
        print(json.dumps({p: analyze(p) for p in args.paths}, indent=1))
    else:
        print(json.dumps(master(args.src, args.dst), indent=1))


if __name__ == '__main__':
    main()


# ----------------------------------------------------------------------------- voice activity

def voice_activity(path, threshold_dbfs=-40.0, frame_ms=10, min_gap_ms=120, min_span_ms=60):
    """Speech spans [(start_ms, end_ms)] from the voice track's 10 ms RMS. Whisper word times fold pauses
    into the next word, so captions, ducking and SFX placement use these measured spans instead."""
    x = decode(path, sr=16000, channels=1)
    x = x.reshape(-1) if x.ndim > 1 else x
    hop = int(16000 * frame_ms / 1000)
    n = len(x) // hop
    if n == 0:
        return []
    rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    active = 20 * np.log10(rms) > threshold_dbfs
    spans, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        elif not a and start is not None:
            spans.append([start * frame_ms, i * frame_ms]); start = None
    if start is not None:
        spans.append([start * frame_ms, n * frame_ms])
    merged = []
    for s0, s1 in spans:
        if merged and s0 - merged[-1][1] < min_gap_ms:
            merged[-1][1] = s1
        else:
            merged.append([s0, s1])
    return [tuple(s) for s in merged if s[1] - s[0] >= min_span_ms]


def trim_lead_in(in_video, out_video, keep_ms=40):
    """Cut the silent lead-in (HeyGen starts ~300 ms before the first word) so the hook starts on frame 0."""
    spans = voice_activity(in_video)
    start_s = max(0.0, (spans[0][0] - keep_ms) / 1000) if spans else 0.0
    run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{start_s:.3f}', '-i', str(in_video), '-c:v', 'libx264',
         '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', str(out_video)])
    return start_s
