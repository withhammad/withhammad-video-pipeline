"""Build a continuous original bed and master without changing voice pitch or pace.

One static narration gain, music 12 LU below the narration, peak-only limiting.
No paid generation, no speech regeneration, no normalizer chasing individual words.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
from app import audio

V = ROOT / 'studio/.local/jobs/3f33678db749/referral-v4'
SR = 48000


def run(*args):
    subprocess.run([str(a) for a in args], check=True)


def main():
    data = json.loads((V / 'edit.json').read_text())
    dur = data['frames'] / data['fps']
    n = round(dur * SR)
    beat = 60 / 96
    bar = beat * 4
    out = np.zeros((n, 2))
    chords = [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]]

    def tone(freq, length, attack, decay, harmonics=(1, .25, .08)):
        t = np.arange(round(length * SR)) / SR
        env = np.minimum(t / attack, 1) * np.exp(-t * decay)
        return env * sum(a * np.sin(2 * np.pi * freq * (i + 1) * t) for i, a in enumerate(harmonics))

    def add(sig, start, pan=.5):
        i = round(start * SR)
        j = min(n, i + len(sig))
        if i < n:
            out[i:j, 0] += sig[:j-i] * (1-pan)
            out[i:j, 1] += sig[:j-i] * pan

    freq = lambda s: 261.63 * 2 ** (s / 12)
    for b in range(math.ceil(dur/bar)):
        ch = chords[b % 4]
        pad = sum(tone(freq(s-12), bar + .2, .2, 0, (1, .12)) for s in ch) * .06
        tail = round(.2 * SR)
        pad[-tail:] *= np.linspace(1, 0, tail)
        add(pad, b*bar)
        for k in range(8):
            pl = tone(freq(ch[k%3] + (12 if k%4 == 3 else 0)), .5, .004, 7.5) * .09
            add(pl, b*bar + k*beat/2, .5 + .25*np.sin(k))
    # Millisecond edge ramps prevent clicks. The music stays at its set level to the last frame.
    edge = round(.005 * SR)
    out[:edge] *= np.linspace(0, 1, edge)[:, None]
    out[-edge:] *= np.linspace(1, 0, edge)[:, None]
    out /= np.abs(out).max() / .5
    raw = V / 'bed-raw.f32'
    out.astype('<f4').tofile(raw)
    run('ffmpeg','-v','error','-y','-f','f32le','-ar',SR,'-ac',2,'-i',raw,
        '-c:a','pcm_s24le',V/'bed-raw.wav')
    voice_meter = audio._ebur128(str(V/'voice.wav'))
    bed_meter = audio._ebur128(str(V/'bed-raw.wav'))
    bed_gain = voice_meter['lufs'] - 12 - bed_meter['lufs']
    run('ffmpeg','-v','error','-y','-i',V/'bed-raw.wav','-af',f'volume={bed_gain}dB',
        '-c:a','pcm_s24le',V/'music-bed.wav')
    run('ffmpeg','-v','error','-y','-i',V/'voice.wav','-i',V/'music-bed.wav',
        '-filter_complex',f'[0:a]apad=whole_dur={dur:.6f}[v];[v][1:a]amix=inputs=2:duration=longest:normalize=0[a]',
        '-map','[a]','-ar',SR,'-c:a','pcm_s24le',V/'mix-raw.wav')
    mix_meter = audio._ebur128(str(V/'mix-raw.wav'))
    gain = -14 - mix_meter['lufs']
    for name, extra in [('mix.wav', 0), ('mix-linkedin.wav', 2)]:
        run('ffmpeg','-v','error','-y','-i',V/'mix-raw.wav','-af',
            f'volume={gain+extra}dB,aresample=192000,alimiter=limit=0.794328:attack=3:release=80:level=false:latency=true,aresample=48000',
            '-c:a','pcm_s24le',V/name)
    bed = audio.decode(V/'music-bed.wav', channels=2)
    if bed.ndim == 1:
        bed = bed.reshape(-1, 2)
    levels = [20*np.log10(max(1e-12, np.sqrt(np.mean(bed[i*SR:(i+1)*SR]**2)))) for i in range(int(dur))]
    median = float(np.median(levels))
    report = {'duration_s':dur, 'narration':voice_meter, 'bed_gain_db':bed_gain,
        'music':audio._ebur128(str(V/'music-bed.wav')), 'master_static_gain_db':gain,
        'master':audio._ebur128(str(V/'mix.wav')),
        'linkedin_master':audio._ebur128(str(V/'mix-linkedin.wav')),
        'music_seconds_below_median_by_3db':[i for i,x in enumerate(levels) if x < median-3],
        'music_per_second_rms_db':[round(x,2) for x in levels],
        'voice_processing':'Static gain and final peak-only limiting; no pitch shift, speed change, EQ or per-word normalization.',
        'music_source':'Original synthesized 96 BPM plucks and pad, same composition as prior Blender edit; no purchased assets.'}
    (V/'audio-review.json').write_text(json.dumps(report, indent=2)+'\n')
    raw.unlink()
    print(json.dumps({k:v for k,v in report.items() if k!='music_per_second_rms_db'}, indent=2))


if __name__ == '__main__':
    main()
