"""Original music and delivery encoding for the silent infographic adaptation.

Reuses the pipeline's own plucked-chord score, synthesized at 100 BPM so each
3.6-second teaching card is six beats. No stock recording, cloned voice or paid
generation. Run through studio/heavy.sh after render_mini_harness.mjs --full.
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/reference-mini-harness'
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Mini-Harness')
SR, BPM, DURATION = 48000, 100, 62.4
n = round((DURATION + 2) * SR)
t = np.arange(n) / SR
mix = np.zeros((n, 2))
beat = 60 / BPM
chords = [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]]


def tone(freq, length, attack, decay, harmonics=(1, .25, .08)):
    clock = np.arange(round(length * SR)) / SR
    env = np.minimum(clock / attack, 1) * np.exp(-clock * decay)
    return env * sum(a * np.sin(2 * np.pi * freq * (k + 1) * clock) for k, a in enumerate(harmonics))


def place(sound, start, pan=.5):
    i = round(start * SR)
    end = min(n, i + len(sound))
    if i < n:
        mix[i:end, 0] += sound[:end - i] * (1 - pan)
        mix[i:end, 1] += sound[:end - i] * pan


for bar in range(int((DURATION + 2) / (beat * 4)) + 1):
    chord = chords[bar % 4]
    start = bar * beat * 4
    pad = sum(tone(261.63 * 2 ** ((s - 12) / 12), beat * 4 + .4, .4, .6, (1, .12)) for s in chord) * .05
    place(pad, start)
    for k in range(8):
        note = chord[k % 3] + (12 if k % 4 == 3 else 0)
        pluck = tone(261.63 * 2 ** (note / 12), .5, .004, 7.5) * .09
        place(pluck, start + k * beat / 2, .5 + .25 * np.sin(k))
mix *= np.minimum(t / .025, 1)[:, None]
mix /= np.abs(mix).max() / .5
bed = WORK / 'music.wav'
with wave.open(str(bed), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())


def run(args):
    return subprocess.run([str(a) for a in args], check=True, capture_output=True, text=True)


def loudness(file, target=-14):
    result = run(['ffmpeg', '-hide_banner', '-nostats', '-i', file, '-t', DURATION,
                  '-af', f'loudnorm=I={target}:TP=-1.8:LRA=11:print_format=json', '-f', 'null', '-'])
    return json.JSONDecoder().raw_decode(result.stderr[result.stderr.rfind('{'):])[0]


proof = {'duration': DURATION, 'frames': 1872, 'music': 'Original pipeline plucked-chord score, 100 BPM',
         'voice': 'None: source is a static infographic', 'outputs': {}}
# The owner's master prompt fixes the delivery target at -14 LUFS for this
# pipeline, overriding the generic skill's older LinkedIn -12 suggestion.
for name, filename, target in [('MiniHarness', 'HARNESS-edit.mp4', -14), ('MiniHarnessLinkedIn', 'HARNESS-linkedin.mp4', -14)]:
    measured = loudness(bed, target)
    normal = (f'loudnorm=I={target}:TP=-1.8:LRA=11:measured_I={measured["input_i"]}:'
              f'measured_TP={measured["input_tp"]}:measured_LRA={measured["input_lra"]}:'
              f'measured_thresh={measured["input_thresh"]}:offset={measured["target_offset"]}:linear=true')
    dest = OUT / filename
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', WORK / f'{name}-silent.mp4', '-i', bed,
         '-map', '0:v', '-map', '1:a', '-t', DURATION, '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p',
         '-af', normal + ',aresample=48000,afade=t=out:st=62.39:d=0.01',
         '-c:v', 'libx264', '-crf', 18, '-preset', 'fast', '-color_range', 'tv', '-colorspace', 'bt709',
         '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dest])
    actual = loudness(dest, target)
    if not (-15 <= float(actual['input_i']) <= -13 and float(actual['input_tp']) <= -1.5):
        raise ValueError(f'Audio delivery gate failed for {filename}: {actual}')
    probe = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', dest]).stdout)
    proof['outputs'][filename] = {'loudness': actual, 'probe': probe}
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', dest,
         '-vf', 'fps=1,scale=162:288,tile=9x7', '-frames:v', 1, OUT / f'{name}-contact-sheet.jpg'])
    print(f'{filename}: {actual["input_i"]} LUFS, {actual["input_tp"]} dBTP')
(OUT / 'technical-checks.json').write_text(json.dumps(proof, indent=2))
