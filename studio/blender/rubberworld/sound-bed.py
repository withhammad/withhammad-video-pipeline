"""Original music bed for the Rubber World reel (video-sound skill: one level to the last frame, ~12 dB under the voice).

Soft plucked chords and a light pad, 92 BPM, I-V-vi-IV in C major, synthesized here (no third-party recording).
Writes bed.wav (48 kHz stereo) the length of the reel.  python3 sound-bed.py <seconds>
"""
import sys, wave
import numpy as np

SR, BPM = 48000, 112
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 70.44
beat = 60 / BPM
n = int(DUR * SR)
out = np.zeros((n, 2))
rng = np.random.default_rng(11)
A3 = 261.63  # C4 root
semis = lambda s: A3 * 2 ** (s / 12)
chords = [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]]  # C, G, Am, F

def tone(freq, length, attack, decay, harm=(1, .25, .08)):
    t = np.arange(int(length * SR)) / SR
    env = np.minimum(t / attack, 1) * np.exp(-t * decay)
    return env * sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harm))

bar = 4 * beat
for b in range(int(DUR / bar) + 1):
    ch = chords[b % 4]
    start = b * bar
    pad = sum(tone(semis(s - 12), bar + 0.4, 0.4, 0.6, (1, .12)) for s in ch) * 0.05
    i = int(start * SR); j = min(n, i + len(pad))
    if i < n:
        out[i:j, 0] += pad[:j - i]; out[i:j, 1] += pad[:j - i]
    for k in range(8):  # eighth-note pluck arpeggio, panned gently
        s = ch[k % 3] + (12 if k % 4 == 3 else 0)
        pl = tone(semis(s), 0.5, 0.004, 7.5) * 0.09
        i = int((start + k * beat / 2) * SR); j = min(n, i + len(pl))
        if i < n:
            pan = 0.5 + 0.25 * np.sin(k)
            out[i:j, 0] += pl[:j - i] * (1 - pan); out[i:j, 1] += pl[:j - i] * pan
fade = np.minimum(np.arange(n) / (0.3 * SR), 1) * np.minimum((n - np.arange(n)) / (0.6 * SR), 1)
out *= fade[:, None]
out /= np.abs(out).max() / 0.5
with wave.open('bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print(f'bed.wav {DUR:.2f} s, {BPM} BPM')
