"""Synthesized SFX track (no third-party sounds) on the reel's events, mixed with the dialogue -> mix.wav (48 kHz mono).
whoosh on every cut, pop on cards/pills, key clicks while text types, stamp thud, city rumble, car-drop thuds, confetti chirps."""
import json, wave, subprocess, sys
D = sys.argv[1] if len(sys.argv) > 1 else 'standin'
import numpy as np
SR = 48000
tl = json.load(open(f'{D}/timeline.json')); shots = json.load(open('blender/shots.json'))
dur = tl['total']; n = int(dur * SR) + SR
out = np.zeros(n); rng = np.random.default_rng(4)
def add(sig, t, g):
    i = int(t * SR); j = min(n, i + len(sig)); out[i:j] += g * sig[:j - i]
def env(L, a, d):
    t = np.arange(int(L * SR)) / SR; return np.minimum(t / a, 1) * np.exp(-t * d), t
def whoosh(L=0.35):
    e, t = env(L, 0.08, 9); x = rng.standard_normal(len(t)); y = np.zeros_like(x); a = 0
    for k in range(len(x)):
        c = 0.02 + 0.25 * (k / len(x)); a += c * (x[k] - a); y[k] = a
    return e * y / (np.abs(y).max() + 1e-9)
def pop(f=880):
    e, t = env(0.12, 0.003, 35); return e * np.sin(2 * np.pi * (f + 600 * np.exp(-t * 40)) * t)
def click():
    e, t = env(0.02, 0.0005, 300); return e * rng.standard_normal(len(t))
def thud(f=70, L=0.4):
    e, t = env(L, 0.004, 9); return e * (np.sin(2 * np.pi * f * t * (1 + np.exp(-t * 20))) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t * 40))
def chirp():
    e, t = env(0.09, 0.002, 30); f = rng.uniform(1800, 3200); return e * np.sin(2 * np.pi * f * t)
F = lambda fr: (fr - 1) / 30
W = {(w['line'], w['w'].lower().strip('.,?!')): w['s'] for w in tl['words']}
cuts = sorted(a for a, b in shots.values())
for c in cuts[1:]: add(whoosh(), F(c) - 0.12, 0.28)
for name in ('close_sad',): add(pop(700), 0.5, 0.35)
for name in ('wide_panel', 'two_mid', 'city_grow', 'claude_s4', 'laptop_s5', 'claude_cost', 'laptop_ots'):
    add(pop(), F(shots[name][0]) + 0.05, 0.3)
add(pop(1200), W[(2, 'millions.')] if (2, 'millions.') in W else W.get((2, 'millions'), 5), 0.4)
# typing: the one line + the code card
l7 = tl['lines'][7]
for t in np.arange(W[(7, 'what')], l7['end'], 0.065): add(click(), t, 0.12)
a, b = shots['city_grow']
for t in np.arange(F(a) + 0.07, F(b) - 0.2, 0.05): add(click(), t, 0.1)
add(thud(60, 0.6), W[(11, 'not')], 0.7)                         # stamp
e, t = env(2.4, 0.3, 1.2); add(e * np.convolve(rng.standard_normal(len(t)), np.ones(300) / 300, 'same') * 8, F(a), 0.5)  # city rising rumble
a, b = shots['city_cars']
for k in range(40): add(pop(500 + 20 * k), F(a) + 0.1 + k * (F(b) - F(a) - 0.4) / 40, 0.08)
tv = tl['payoff']['start'] + 0.85
for k in range(12): add(thud(rng.uniform(55, 90), 0.5), tv + rng.uniform(0, 0.12), 0.25)
a, b = shots['wide_end']
for k in range(40): add(chirp(), F(a) + rng.uniform(0, 1.2), 0.12)
add(pop(1000), W.get((15, 'fix'), F(shots['claude_s4'][0]) + 1), 0.35)
add(pop(1300), W[(20, 'five')], 0.45)
# dialogue
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', f'{D}/voice.wav', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'])
v = np.frombuffer(raw, np.float32).astype(float); v = v / (np.abs(v).max() + 1e-9) * 0.7
mix = np.zeros(n); mix[:len(v)] += v[:n]; mix += out * 0.5
mix = mix[:int(dur * SR)]; mix /= max(1.0, np.abs(mix).max() / 0.95)
with wave.open('mix.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('mix.wav', round(dur, 2))
