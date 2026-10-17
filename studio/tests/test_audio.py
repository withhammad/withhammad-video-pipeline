"""Audio post: synthesis hygiene (clicks, peaks, durations), ducking/pump math, ffmpeg stages."""
import json
import math
import shutil
import subprocess

import numpy as np
import pytest

from app import audio

SR = audio.SR
needs_ffmpeg = pytest.mark.skipif(not (shutil.which('ffmpeg') and shutil.which('ffprobe')),
                                  reason='ffmpeg/ffprobe not on PATH')


def edge_steps(y, k=12):
    """Peak-normalised (first sample, last sample, largest step across the first/last k samples
    including the step in from / out to silence, largest step anywhere)."""
    y = np.asarray(y, float)
    y = (y if y.ndim == 2 else y[:, None]) / np.max(np.abs(y))
    z = np.zeros((1, y.shape[1]))
    head = np.abs(np.diff(np.vstack([z, y[:k]]), axis=0)).max()
    tail = np.abs(np.diff(np.vstack([y[-k:], z]), axis=0)).max()
    return np.abs(y[0]).max(), np.abs(y[-1]).max(), max(head, tail), np.abs(np.diff(y, axis=0)).max()


# ----------------------------------------------------------------------------- envelopes and clicks

@pytest.mark.parametrize('n,a,d,s,r', [(48000, 0.01, 0.1, 0.8, 0.1), (2000, 0.01, 0.1, 0.8, 0.1), (300, 0.05, 0.0, 1.0, 0.05)])
def test_adsr_starts_and_ends_at_zero_and_never_jumps(n, a, d, s, r):
    env = audio.adsr(n, a, d, s, r)
    assert len(env) == n
    assert env[0] == 0.0 and env[-1] == 0.0
    assert env.min() >= 0.0 and env.max() <= 1.0 + 1e-12
    squeeze = min(1.0, n / ((a + max(d, 1 / SR) + r) * SR))       # short notes squeeze every stage
    shortest_stage = min(a, r) * SR * squeeze
    assert np.abs(np.diff(env)).max() <= math.pi / (2 * (shortest_stage - 2)) + 1e-9


def _instruments():
    rng = np.random.default_rng(0)
    return {
        'pad': audio.pad_chord([57, 60, 64, 67], 1.0, 1500.0, rng),
        'bass': audio.bass_note(55.0, 0.3),
        'kick': audio.kick(rng),
        'hat': audio.hat(rng),
        'snare': audio.snare_soft(rng),
        'pluck': audio.pluck(440.0, 0.5, rng),
        'epiano': audio.epiano(330.0, 1.0, 0.9),
        **{f'sfx_{k}': audio.make_sfx(k) for k in audio.SFX_KINDS},
    }


@pytest.mark.parametrize('name', list(_instruments()))
def test_every_note_and_sfx_edge_is_click_free(name):
    first, last, edge, body = edge_steps(_instruments()[name])
    assert first < 1e-9 and last < 1e-9            # every note starts and ends exactly at zero
    assert edge <= 0.25 * body                      # the edges are gentler than the sound itself
    if not name.startswith(('hat', 'sfx_')):        # tonal notes: absolute bound too
        assert edge <= 0.03


def test_unenveloped_control_would_fail_the_click_check():
    first, last, edge, body = edge_steps(audio.polyblep_saw(220.0, 4801, phase0=0.3))
    assert first > 0.1 and edge > 0.1               # proves the check can see a click


def test_placing_a_note_into_a_bed_adds_no_step():
    buf = np.zeros((SR, 2))
    note = audio.bass_note(55.0, 0.25)
    audio.place(buf, note, 0.3, gain=0.9)
    i = int(round(0.3 * SR))
    assert np.abs(buf[i - 1]).max() == 0.0
    assert np.abs(np.diff(buf[i - 2:i + 12], axis=0)).max() < 0.01
    end = i + len(note)
    assert np.abs(np.diff(buf[end - 12:end + 2], axis=0)).max() < 0.01


# ----------------------------------------------------------------------------- oscillators and effects

def test_polyblep_saw_has_far_less_aliasing_than_a_naive_saw():
    n, f0 = SR, 3517.0
    t = np.arange(n) / SR
    naive = 2.0 * ((f0 * t) % 1.0) - 1.0
    blep = audio.polyblep_saw(f0, n)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    harmonic = np.zeros(len(freqs), bool)
    for k in range(1, int(SR / 2 / f0) + 1):
        harmonic |= np.abs(freqs - k * f0) <= 3.0
    win = np.hanning(n)

    def alias_ratio(x):
        p = np.abs(np.fft.rfft(x * win)) ** 2
        return p[~harmonic].sum() / p[harmonic].sum()
    assert alias_ratio(blep) < 0.3 * alias_ratio(naive)


def _comb_reference(x, d, fb, damp):
    v = np.zeros(len(x))
    out = np.zeros(len(x))
    for i in range(len(x)):
        a = v[i - d] if i - d >= 0 else 0.0
        b = v[i - d - 1] if i - d - 1 >= 0 else 0.0
        v[i] = x[i] + fb * ((1 - damp) * a + damp * b)
        out[i] = a
    return out


def _allpass_reference(x, d, g):
    v = np.zeros(len(x))
    out = np.zeros(len(x))
    for i in range(len(x)):
        a = v[i - d] if i - d >= 0 else 0.0
        v[i] = x[i] + g * a
        out[i] = a - x[i]
    return out


def test_vectorized_comb_and_allpass_match_the_sample_loop():
    x = np.random.default_rng(1).standard_normal(3000)
    assert np.allclose(audio._comb(x, 37, 0.84, 0.2), _comb_reference(x, 37, 0.84, 0.2))
    assert np.allclose(audio._allpass(x, 29, 0.5), _allpass_reference(x, 29, 0.5))


def test_reverb_is_stable_and_decays():
    x = np.zeros((3 * SR, 2))
    x[0] = 1.0
    wet = audio.reverb(x, room=0.75, damp=0.5)
    assert np.all(np.isfinite(wet))
    early, late = np.sum(wet[:SR // 2] ** 2), np.sum(wet[-SR // 2:] ** 2)
    assert late < 1e-3 * early


def test_swing_moves_only_the_offbeats():
    assert audio.swing_time(0.0, 0.62) == 0.0
    assert audio.swing_time(0.5, 0.62) == pytest.approx(0.62)
    assert audio.swing_time(1.0, 0.62) == 1.0
    assert audio.swing_time(3.5, 0.62) == pytest.approx(3.62)
    assert audio.swing_time(0.25, 0.54, grid=0.25) == pytest.approx(0.27)


# ----------------------------------------------------------------------------- sidechain math

def test_pump_dips_on_the_beat_and_recovers_smoothly():
    beat, depth, attack = 0.6, 0.5, 0.006
    g = audio.pump(int(3 * beat * SR), beat, depth=depth, attack_s=attack, release=0.55)
    a = int(attack * SR)
    assert g[0] == pytest.approx(1.0)
    assert g[a] == pytest.approx(1.0 - depth, abs=1e-3)
    assert g.min() == pytest.approx(1.0 - depth, abs=1e-3)
    assert g[int((attack + 0.56 * beat) * SR)] == pytest.approx(1.0)
    assert g[int(beat * SR) - 1] == pytest.approx(1.0)       # fully back before the next kick
    assert np.abs(np.diff(g)).max() <= depth / (attack * SR) + 1e-9


CAPTIONS = [
    {'text': ' Claude', 'startMs': 1000, 'endMs': 3000, 'timestampMs': 2000, 'confidence': 0.9},
    {'text': ' Code', 'startMs': 5000, 'endMs': 5100, 'timestampMs': 5050, 'confidence': 0.9},
]


def test_duck_curve_follows_the_edit_contract():
    vol, duck = audio.MUSIC_DEFAULTS['volume'], audio.MUSIC_DEFAULTS['duckTo']
    g = audio.duck_curve(CAPTIONS, 8000, volume=vol, duck_to=duck, fade_in_ms=400, fade_out_ms=1500)
    at = lambda ms: g[int(ms * SR / 1000)]
    assert len(g) == 8 * SR
    assert at(0) == 0.0                                   # fade-in starts silent
    assert at(200) == pytest.approx(vol * 0.5)            # half way up the 400 ms fade, no speech
    assert at(600) == pytest.approx(vol)                  # pause level
    assert at(2000) == pytest.approx(duck)                # mid-word: ducked
    assert at(4000) == pytest.approx(vol)                 # gap: back up
    assert at(1000) == pytest.approx((vol + duck) / 2, abs=2e-4)   # centred 150 ms smoothing
    assert at(924) == pytest.approx(vol) and at(1076) == pytest.approx(duck)
    assert duck < at(5050) < vol                          # a 100 ms word only ducks part way
    assert at(7250) == pytest.approx(vol * 0.5)           # half way down the 1500 ms fade-out
    assert g[-1] < 1e-3 and g.min() >= 0.0 and g.max() <= vol + 1e-12
    step = (vol - duck) / (audio.SMOOTH_MS * SR / 1000) + vol / (0.4 * SR)
    assert np.abs(np.diff(g)).max() <= step + 1e-9      # no gain steps, only ramps


def test_speech_mask_uses_caption_spans():
    m = audio.speech_mask(CAPTIONS, 6 * SR)
    assert m[int(0.999 * SR)] == 0 and m[SR] == 1 and m[int(2.999 * SR)] == 1 and m[3 * SR] == 0


# ----------------------------------------------------------------------------- music beds

@pytest.mark.parametrize('preset', list(audio.PRESETS))
def test_music_bed_duration_peak_and_edges(preset, tmp_path):
    y = audio.make_music(preset, duration_s=4.0, seed=5, out_wav=tmp_path / 'bed.wav')
    assert y.shape == (4 * SR, 2)
    assert np.all(np.isfinite(y))
    assert audio.db(np.max(np.abs(y))) == pytest.approx(audio.BED_PEAK_DBFS, abs=0.01)
    assert np.abs(y[0]).max() < 1e-9 and np.abs(y[-1]).max() < 1e-9    # fade-in and fade tail
    back, sr = audio.read_wav(tmp_path / 'bed.wav')
    assert sr == SR and back.shape == y.shape
    assert audio.db(np.max(np.abs(back))) <= audio.BED_PEAK_DBFS + 0.01
    assert np.allclose(audio.make_music(preset, duration_s=4.0, seed=5), y)   # deterministic


@pytest.mark.parametrize('preset', list(audio.PRESETS))
def test_music_bed_stays_out_of_the_voice_band(preset):
    y = audio.make_music(preset, duration_s=6.0, seed=2).mean(axis=1)
    p = np.abs(np.fft.rfft(y)) ** 2
    f = np.fft.rfftfreq(len(y), 1.0 / SR)
    share = p[(f >= 1000) & (f < 4000)].sum() / p[(f >= 20) & (f <= 20000)].sum()
    assert share < 0.04     # enhanced voice measures ~0.07 on job 09a9d211fff0


def test_sfx_lengths_and_peaks():
    expected = {'whoosh': 0.36, 'pop': 0.09, 'tick': 0.04, 'riser': 1.2}
    for kind, seconds in expected.items():
        y = audio.make_sfx(kind)
        assert y.shape == (int(seconds * SR), 2)
        assert audio.db(np.max(np.abs(y))) == pytest.approx(audio.SFX_PEAK_DBFS, abs=0.01)
    with pytest.raises(ValueError):
        audio.make_sfx('boom')
    with pytest.raises(ValueError):
        audio.make_music('dubstep', 1.0)


def test_wav_roundtrip(tmp_path):
    x = np.random.default_rng(4).uniform(-0.5, 0.5, (1000, 2))
    back, sr = audio.read_wav(audio.write_wav(tmp_path / 'x.wav', x))
    assert sr == SR and np.abs(back - x).max() < 3 / 32768


# ----------------------------------------------------------------------------- ffmpeg integration

def _clip(path, seconds=2):
    """2 s synthetic talking-head stand-in: test-pattern video; audio = a syllable-modulated buzz
    (voice-like lows), a 300 Hz->5 kHz chirp (aperiodic, so sync can be measured) and pink noise."""
    voice = (f"aevalsrc=exprs='0.3*(sin(2*PI*140*t)+0.5*sin(2*PI*280*t))*(0.55+0.45*sin(2*PI*4*t))"
             f"+0.12*sin(2*PI*(300*t+1175*t*t))':s=48000:d={seconds}")
    subprocess.run(['ffmpeg', '-y', '-v', 'error',
                    '-f', 'lavfi', '-i', f'testsrc2=size=320x240:rate=25:duration={seconds}',
                    '-f', 'lavfi', '-i', voice,
                    '-f', 'lavfi', '-i', f'anoisesrc=color=pink:amplitude=0.02:sample_rate=48000:duration={seconds}',
                    '-filter_complex', '[1:a][2:a]amix=inputs=2:normalize=0[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                    '-ar', '48000', '-ac', '2', '-shortest', str(path)], check=True)
    return path


def _video_md5(path):
    return subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v', '-c', 'copy', '-f', 'md5', '-'],
                          capture_output=True, text=True, check=True).stdout.strip()


def _streams(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,sample_rate,channels',
                          '-of', 'json', str(path)], capture_output=True, text=True, check=True).stdout
    return {s['codec_type']: s for s in json.loads(out)['streams']}


@needs_ffmpeg
def test_enhance_voice_and_master_on_a_synthetic_clip(tmp_path):
    src = _clip(tmp_path / 'clip.mp4')
    enhanced = tmp_path / 'enhanced.mp4'
    info = audio.enhance_voice(src, enhanced)
    assert _video_md5(enhanced) == _video_md5(src)                 # video stream copied untouched
    s = _streams(enhanced)['audio']
    assert s['codec_name'] == 'aac' and s['sample_rate'] == '48000' and s['channels'] == 2
    a = audio.analyze(enhanced)
    assert a['lufs'] == pytest.approx(audio.VOICE_LUFS, abs=1.0)
    assert a['true_peak_dbtp'] <= info['limit_dbfs'] + 0.6         # limiter ceiling (AAC overshoot allowed)
    assert a['clipped_samples'] == 0
    # audio stays in sync: cross-correlate the (aperiodic, noise-led) 1-6 kHz band of both
    band = lambda f: audio.highpass(f, 1000, 2) * audio.lowpass(f, 6000, 2)
    x, y = (audio.spectral(audio.decode(p).mean(1), band) for p in (src, enhanced))
    n = min(len(x), len(y))
    spec = np.fft.rfft(x[:n], 2 * n) * np.conj(np.fft.rfft(y[:n], 2 * n))
    xc = np.fft.irfft(spec)
    lag = int(np.argmax(np.abs(np.concatenate([xc[-480:], xc[:481]])))) - 480
    assert abs(lag) <= 48                                          # within 1 ms

    mastered = tmp_path / 'mastered.mp4'
    stats = audio.master(enhanced, mastered)
    assert _video_md5(mastered) == _video_md5(src)
    m = audio.analyze(mastered)
    assert m['lufs'] == pytest.approx(-14.0, abs=1.0)
    assert m['true_peak_dbtp'] <= -1.0 + 0.1
    assert stats['normalization_type'] in ('linear', 'dynamic')


@needs_ffmpeg
def test_preview_mix_and_build_job_end_to_end(tmp_path):
    job = tmp_path / 'job'
    job.mkdir()
    _clip(job / 'avatar.mp4')
    (job / 'captions.json').write_text(json.dumps([
        {'text': ' Hello', 'startMs': 100, 'endMs': 700, 'timestampMs': 400, 'confidence': 1.0},
        {'text': ' there', 'startMs': 1100, 'endMs': 1800, 'timestampMs': 1450, 'confidence': 1.0}]))
    report = audio.build_job(job, presets=('pulse',))
    for name in ('avatar_enhanced.mp4', 'audio/music_pulse.wav', 'audio/preview_pulse.mp4', 'audio/analysis.json',
                 *(f'audio/sfx_{k}.wav' for k in audio.SFX_KINDS)):
        assert (job / name).exists(), name
    assert _video_md5(job / 'audio/preview_pulse.mp4') == _video_md5(job / 'avatar.mp4')
    preview = report['previews']['pulse']
    assert preview['lufs'] == pytest.approx(-14.0, abs=1.0) and preview['true_peak_dbtp'] <= -0.9
    assert report['checks']['pulse'] == {'share_below_voice': True, 'no_clipping': True}
    assert report['beds']['pulse']['sample_peak_dbfs'] <= -5.99
