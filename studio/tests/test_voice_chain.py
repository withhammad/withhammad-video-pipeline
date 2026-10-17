"""Voice chain C2b: the filter graph builds and renders, it is dry, and its de-esser cuts esses and nothing else."""
import shutil
import subprocess

import numpy as np
import pytest

from app import audio, voice_gates

needs_ffmpeg = pytest.mark.skipif(not (shutil.which('ffmpeg') and shutil.which('ffprobe')),
                                  reason='ffmpeg/ffprobe not on PATH')
SR = 48000


def _vowels_and_esses(seconds=4.0, seed=3):
    """Alternating 300 ms 'vowels' (150 Hz harmonic complex) and 120 ms 'esses' (5-9 kHz noise) with short gaps."""
    rng = np.random.default_rng(seed)
    n = int(SR * seconds)
    x = rng.normal(0, 2e-4, n)
    marks, t = [], 0.1
    while t + 0.6 < seconds:
        a, b = int(t * SR), int((t + 0.3) * SR)
        tt = np.arange(b - a) / SR
        x[a:b] += 0.12 * sum(np.sin(2 * np.pi * 150 * k * tt) / k for k in range(1, 30)) * audio.edges(b - a, 0.01, 0.02)
        marks.append(('vowel', a, b))
        a, b = int((t + 0.34) * SR), int((t + 0.46) * SR)
        x[a:b] += voice_gates._bandpass(rng.normal(0, 0.12, b - a), 5000, 9000) * audio.edges(b - a, 0.005, 0.01)
        marks.append(('ess', a, b))
        t += 0.6
    return x, marks


def _render(x, chain, tmp_path, name):
    src = audio.write_wav(tmp_path / f'{name}_in.wav', np.stack([x, x], 1))
    out = tmp_path / f'{name}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(src), '-filter_complex', '[0:a]' + ','.join(chain) + '[a]',
                    '-map', '[a]', '-ac', '1', '-c:a', 'pcm_f32le', str(out)], check=True)
    return audio.decode(out, sr=SR, channels=1).reshape(-1)


def test_chain_is_c2b_and_dry():
    chain = ','.join(audio.VOICE_CHAIN)
    assert audio.VOICE_ROOM_DB is None
    assert 'highshelf=f=9000' in chain and 'g=-5' in chain.split('highshelf=f=9000')[1].split(',')[0]
    assert 'acrossover=split=4800' in chain and 'deesser=' not in chain
    assert 'equalizer=f=10000' not in chain               # the refuted 10 kHz cut is gone


@needs_ffmpeg
def test_deesser_cuts_esses_and_leaves_vowels(tmp_path):
    x, marks = _vowels_and_esses()
    without = tuple(c for c in audio.VOICE_CHAIN if not c.startswith(('acrossover', 'acompressor')))
    with_ds = tuple(c for c in audio.VOICE_CHAIN if not c.startswith('acompressor'))
    a, b = _render(x, without, tmp_path, 'a'), _render(x, with_ds, tmp_path, 'b')

    def level(sig, kind):
        return 10 * np.log10(np.mean(np.concatenate([sig[s:e] ** 2 for k, s, e in marks if k == kind])))
    assert level(b, 'ess') - level(a, 'ess') < -2.0                # esses come down
    assert abs(level(b, 'vowel') - level(a, 'vowel')) < 0.3        # vowels untouched


@needs_ffmpeg
def test_enhance_voice_renders_the_chain_on_a_clip(tmp_path):
    x, _ = _vowels_and_esses(seconds=3.0)
    wav = audio.write_wav(tmp_path / 'v.wav', np.stack([x, x], 1))
    clip = tmp_path / 'clip.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=160x288:rate=25:duration=3',
                    '-i', str(wav), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'flac', '-shortest', str(clip)],
                   check=True)
    out = tmp_path / 'enh.mp4'
    info = audio.enhance_voice(clip, out)
    assert info['room_db'] is None and 'acrossover' in info['chain']
    a = audio.analyze(out)
    assert a['lufs'] == pytest.approx(audio.VOICE_LUFS, abs=1.0) and a['clipped_samples'] == 0
    assert abs(audio.probe_duration(out) - audio.probe_duration(clip)) < 0.05
    # the chain sees the level it was tuned at, whatever the take's level
    quiet = tmp_path / 'quiet.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip), '-c:v', 'copy', '-af', 'volume=-9dB', '-c:a', 'flac',
                    str(quiet)], check=True)
    info_q = audio.enhance_voice(quiet, tmp_path / 'enh_q.mp4')
    assert info_q['pre_gain_db'] == pytest.approx(info['pre_gain_db'] + 9, abs=0.3)
