"""Voice gates: pause share, clipped endings, top-end balance, sibilance, the table and --strict."""
import io
import shutil

import numpy as np
import pytest

from app import audio, voice_gates

needs_ffmpeg = pytest.mark.skipif(not shutil.which('ffmpeg'), reason='ffmpeg not on PATH')
SR = 48000


def _talk(layout, seed=1, floor=2e-4):
    """layout: [(start_ms, end_ms)] of 140 Hz 'speech' over a quiet floor; returns mono float."""
    rng = np.random.default_rng(seed)
    n = int(SR * (layout[-1][1] + 300) / 1000)
    x = rng.normal(0, floor, n)
    for a, b in layout:
        i, j = int(a * SR / 1000), int(b * SR / 1000)
        t = np.arange(j - i) / SR
        x[i:j] += 0.1 * sum(np.sin(2 * np.pi * 140 * k * t) / k for k in range(1, 20)) * audio.edges(j - i, 0.01, 0.02)
    return x


def test_pause_share_counts_only_pauses_of_150_ms_or_more():
    # 8 words of 900 ms: gaps 100, 200, 100, 300, 100, 120, 250 ms
    gaps = [100, 200, 100, 300, 100, 120, 250]
    layout, t = [], 100
    for g in gaps + [0]:
        layout.append((t, t + 900))
        t += 900 + g
    p = voice_gates.pauses(_talk(layout))
    span = layout[-1][1] - layout[0][0]
    assert p['count'] == 3 and p['longest_ms'] == pytest.approx(300, abs=20)
    assert p['share'] == pytest.approx((200 + 300 + 250) / span, abs=0.006)


def test_late_release_counts_as_sound_not_pause():
    x = _talk([(100, 1000), (1400, 2400)])
    i = int(1130 * SR / 1000)
    x[i:i + 960] += np.random.default_rng(0).normal(0, 0.03, 960)    # 20 ms /t/ burst 130 ms after the word
    p = voice_gates.pauses(x)
    assert p['count'] == 1 and p['longest_ms'] < 300                   # 400 ms gap split by the burst


def test_splice_checks_flag_a_clipped_tail_and_a_mid_sound_splice():
    src = _talk([(100, 1000), (1600, 2400)])
    i = int(1120 * SR / 1000)
    src[i:i + 960] += np.random.default_rng(0).normal(0, 0.03, 960)  # release burst at 1120-1140 ms
    stem = _talk([(100, 1000), (1300, 2100)])
    clean = {'at_ms': 1150, 'src_ms': [1160, 1460]}                   # after the burst, in silence
    clipped = {'at_ms': 1150, 'src_ms': [1080, 1380]}                 # removes the burst
    mid_word = {'at_ms': 950, 'src_ms': [950, 1250]}                  # splices inside the word
    rows = voice_gates.splice_checks(stem, [clean, clipped, mid_word], source=src)
    assert [r['ok'] for r in rows] == [True, False, False]
    assert rows[1]['removed_tail_db'] > voice_gates.AUDIBLE_REL_DB
    assert rows[2]['splice_db'] > voice_gates.SPEECH_REL_DB
    # stem only: a splice inside a word is caught, one in a pause passes
    assert [r['ok'] for r in voice_gates.splice_checks(stem, [{'at_ms': 500}, {'at_ms': 1150}])] == [False, True]


def test_hf_balance_tracks_a_treble_change_and_ignores_pauses():
    rng = np.random.default_rng(2)
    x = _talk([(100, 2000), (2600, 4000)])
    hiss = voice_gates._bandpass(rng.normal(0, 0.01, len(x)), 8000, 15000) * (np.abs(x) > 0.001)
    base = voice_gates.hf_balance(x + hiss)
    assert voice_gates.hf_balance(x + 2 * hiss) - base == pytest.approx(6.0, abs=0.7)
    padded = np.concatenate([x + hiss, np.zeros(SR * 2)])               # more silence: same answer
    assert voice_gates.hf_balance(padded) == pytest.approx(base, abs=0.3)


@needs_ffmpeg
def test_table_and_strict(tmp_path):
    x = _talk([(100, 900), (1400, 2200), (2700, 3500)])                 # two 500 ms pauses: share far over 5 %
    wav = audio.write_wav(tmp_path / 'v.wav', np.stack([x, x], 1))
    out = io.StringIO()
    res = voice_gates.check(wav, out=out)
    text = out.getvalue()
    assert 'pause share' in text and 'FAIL' in text and '8-16 kHz vs reference' in text
    assert 'pause share (pauses >= 150 ms)' in res['failed']
    with pytest.raises(voice_gates.GateFailure):
        voice_gates.check(wav, strict=True, out=io.StringIO())
    assert voice_gates.main(['--voice', str(wav), '--strict']) == 1
    assert voice_gates.main(['--voice', str(wav)]) == 0
