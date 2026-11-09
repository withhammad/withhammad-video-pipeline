"""Prepare the single Blender narration take locally; never calls a paid service."""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import parselmouth

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
from app import audio, reel, tighten, voice_gates

JOB = ROOT / 'studio/.local/jobs/3f33678db749'
V = JOB / 'referral-v4'

def run(*args):
    subprocess.run([str(a) for a in args], check=True)

source = V / 'heygen-original.mp3'
caps_file = V / 'raw-captions.json'
if not caps_file.exists():
    caps_file.write_text(json.dumps(reel.transcribe_words(source, (V / 'script.txt').read_text()), indent=2) + '\n')
caps = json.loads(caps_file.read_text())
run('ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=black:s=32x32:r=30',
    '-i', source, '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'flac', V / 'voice-source.mp4')
cut = tighten.tighten(V / 'voice-source.mp4', V / 'voice-tight.mp4', caps,
                      measure=False, av_offset_ms=0, speed=1, end_cap_ms=120, min_cut_ms=40)
(V / 'cuts.json').write_text(json.dumps(cut, indent=2) + '\n')
run('ffmpeg', '-v', 'error', '-y', '-i', V / 'voice-tight.mp4', '-vn', '-ar', '48000',
    '-c:a', 'pcm_s24le', V / 'voice-tight.wav')
gain = -19 - audio._ebur128(str(V / 'voice-tight.wav'))['lufs']
run('ffmpeg', '-v', 'error', '-y', '-i', V / 'voice-tight.wav', '-af', f'volume={gain}dB',
    '-ar', '48000', '-c:a', 'pcm_s24le', V / 'voice.wav')
(V / 'captions.json').write_text(json.dumps(cut['captions'], indent=2) + '\n')
words = [{'w': c['text'].strip(), 's': c['startMs'] / 1000, 'e': c['endMs'] / 1000}
         for c in cut['captions'] if c['endMs'] > c['startMs']]
(V / 'words.json').write_text(json.dumps(words, indent=2) + '\n')

def profile(path):
    x = audio.decode(path, channels=1).reshape(-1)
    pitch = parselmouth.Sound(x, 48000).to_pitch_ac(time_step=.01, pitch_floor=75, pitch_ceiling=500)
    f = pitch.selected_array['frequency']; f = f[f > 0]
    meter = audio._ebur128(str(path))
    return {'duration_s': round(len(x) / 48000, 3), 'median_hz': round(float(np.median(f)), 2),
            'pitch_p5_p95_semitones': round(float(12 * np.log2(np.percentile(f, 95) / np.percentile(f, 5))), 2),
            'hf_8_16k_re_250_4k_db': voice_gates.hf_balance(x),
            'sib_5_9k_p99_re_lufs_db': voice_gates.sibilance_p99(x, meter['lufs']),
            'meter': meter, 'pauses': voice_gates.stem_pauses(path)}

ref = ROOT / 'studio/.local/jobs/33d9c1e97156/take/heygen_raw.mp4'
profiles = {'referral': profile(ref), 'blender_v4': profile(V / 'voice.wav')}
rows = voice_gates.run(V / 'voice.wav', captions=cut['captions'], cuts=cut['cuts'],
                       source=cut['source'], reference=profiles['referral'])
report = {'profiles': profiles, 'voice_gates': rows, 'processing': {'speed': 1, 'pitch_shift': 0,
          'static_gain_db': gain, 'pause_cuts': len(cut['cuts']), 'removed_ms': cut['removed_ms']},
          'note': 'Same REFERRAL voice settings. Acoustic measurements alone do not prove perceived likeness.'}
(V / 'voice-review.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'profiles': profiles, 'voice_gates': [{k:v for k,v in r.items() if k!='detail'} for r in rows],
                  'processing': report['processing']}, indent=2))
