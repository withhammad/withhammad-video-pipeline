"""Synthesized SFX for the voxel reel, timed from <dir>/lines.json + words.json (same anchors as hf/index.html).
Soft pop on every cut, a block-rush whoosh while the world assembles, a ding when the tee turns yellow, a chime on the CTA.
python3 sfx.py <dir> <seconds>  -> <dir>/sfx.wav (48 kHz stereo). Original sounds, no third-party samples."""
import sys, json, wave
import numpy as np
D, DUR = sys.argv[1], float(sys.argv[2]); SR = 48000
L = {l["id"]: l for l in json.load(open(f"{D}/lines.json"))}
W = json.load(open(f"{D}/words.json"))
n = int(DUR * SR); out = np.zeros(n); rng = np.random.default_rng(3)
def add(t, sig, g):
    i = int(t * SR); j = min(n, i + len(sig))
    if 0 <= i < n: out[i:j] += sig[: j - i] * g
def pop(f0=520):
    t = np.arange(int(.09 * SR)) / SR; f = f0 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40)
def whoosh(length):
    x = rng.standard_normal(int(length * SR)); k = np.ones(40) / 40; x = np.convolve(x, k, "same")
    t = np.arange(len(x)) / SR; return x * np.sin(np.pi * t / length) ** 2
def ding(f=1320, length=.6):
    t = np.arange(int(length * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 6)
cuts = ["course", "free", "step1", "step2", "aivideo", "step3", "step4", "step5", "code", "tell", "this", "too", "cta"]
for c in cuts: add(L[c]["s"] - .06, pop(), .22)
s3 = [w for w in W if w["line"] == "step3"]; b = s3[1]["s"] - .05
add(b, whoosh(L["step3"]["e"] - b), .05)
for k in range(14): add(b + .2 + k * (L["step3"]["e"] - b - .4) / 14, pop(300 + 40 * k), .12)  # blocks landing
tell = L["tell"]; add(tell["s"] + (tell["e"] - tell["s"]) * .55 + .25, ding(), .2)
add(L["cta"]["s"], ding(990, .9), .18); add(L["cta"]["s"] + .12, ding(1480, .9), .12)
fw = [w for w in W if w["line"] == "free"][5]["s"]; add(fw, pop(260), .35)  # FREE stamp
add(L["step3"]["s"], pop(220), .35)  # AI VIDEO x stamp
out = np.clip(out, -1, 1); st = (np.stack([out, out], 1) * 32767).astype(np.int16)
with wave.open(f"{D}/sfx.wav", "wb") as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(st.tobytes())
print("sfx.wav", DUR)
