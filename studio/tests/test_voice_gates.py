"""Voice gates: pause share in the brief's metric, clipped endings on the processed audio, top-end balance, the
table and --strict."""
import io
import shutil

import numpy as np
import pytest

from app import audio, tighten, voice_gates

needs_ffmpeg = pytest.mark.skipif(not shutil.which('ffmpeg'), reason='ffmpeg not on PATH')
SR = 48000


def _talk(layout, seed=1, floor=2e-4, amp=0.1):
    """layout: [(start_ms, end_ms)] of 140 Hz 'speech' over a quiet floor; returns mono float."""
    rng = np.random.default_rng(seed)
    n = int(SR * (layout[-1][1] + 300) / 1000)
    x = rng.normal(0, floor, n)
    for a, b in layout:
        i, j = int(a * SR / 1000), int(b * SR / 1000)
        t = np.arange(j - i) / SR
        x[i:j] += amp * sum(np.sin(2 * np.pi * 140 * k * t) / k for k in range(1, 20)) * audio.edges(j - i, 0.01, 0.02)
    return x


def _wav(tmp_path, name, x):
    return audio.write_wav(tmp_path / name, np.stack([x, x], 1))


def _layout(gaps, word_ms=900, t=100):
    out = []
    for g in gaps + [0]:
        out.append((t, t + word_ms))
        t += word_ms + g
    return out


def test_pause_stats_count_only_pauses_of_150_ms_or_more():
    layout = _layout([100, 200, 100, 300, 100, 120, 250])
    p = voice_gates.pause_stats(layout)
    span = layout[-1][1] - layout[0][0]
    assert p['count'] == 3 and p['longest_ms'] == 300
    assert p['share'] == pytest.approx((200 + 300 + 250) / span, abs=1e-4)


@needs_ffmpeg
def test_pause_share_is_the_briefs_metric_on_the_stem(tmp_path):
    # the gate must read what the brief's VAD reads (audio.voice_activity, -40 dBFS on a -19 LUFS stem, min gap 100):
    # the 3-5 % target and the 2-4 % reference are in that metric
    x = _talk(_layout([100, 200, 100, 300, 100, 120, 250]))
    wav = _wav(tmp_path, 'v.wav', x)
    got = voice_gates.stem_pauses(wav)
    brief = audio.voice_activity(wav, min_gap_ms=100)                   # verify_quickwin.py's call
    assert got['spans'] == [tuple(s) for s in brief] and got['count'] == 3
    assert got['share'] == voice_gates.pause_stats(brief)['share']
    # a stem far from the -19 LUFS the metric was set at is flagged in the table
    rows = voice_gates.run(_wav(tmp_path, 'quiet.wav', x * 0.1))
    assert 'metric set at -19' in rows[0]['value']


@needs_ffmpeg
def test_a_lone_release_burst_does_not_split_a_pause(tmp_path):
    # HeyGen's late /t/: a 20 ms burst 130 ms into a 400 ms gap. The brief's VAD drops spans under 60 ms, so the
    # pause still counts as 400 ms (the first gate split it into two short ones and read 0.55-0.6x of the brief)
    x = _talk([(100, 1000), (1400, 2400)])
    i = int(1130 * SR / 1000)
    x[i:i + 960] += np.random.default_rng(0).normal(0, 0.03, 960)
    p = voice_gates.stem_pauses(_wav(tmp_path, 'b.wav', x))
    assert p['count'] == 1 and p['longest_ms'] >= 380


def _hf_noise(n, level, seed=4):
    return voice_gates._bandpass(np.random.default_rng(seed).normal(0, level, n), 3500, 9000)


def test_splice_checks_see_breath_and_weak_fricatives_on_the_processed_audio():
    # word 100-1000 ms, next word 1600-2400. Kept audio is judged on the stem; removed audio on the source as the
    # listener hears it (here source_chain = the source itself, already 'processed')
    src = _talk([(100, 1000), (1600, 2400)])
    i = int(1040 * SR / 1000)
    src[i:i + int(0.06 * SR)] += _hf_noise(int(0.06 * SR), 0.004)      # weak /s/ 40-100 ms after the word: HF only
    lv = tighten.levels_db(src, 5)
    aud = tighten.audibility(src)
    k = 1050 // 5
    assert lv[k] < aud['bb_line'] and aud['hf'][k] > aud['hf_line']   # invisible to a broadband detector
    stem = _talk([(100, 1000), (1300, 2100)])
    clean = {'at_ms': 1150, 'audio_at_ms': 1150, 'src_ms': [1160, 1460], 'audio_src_ms': [1160, 1460], 'word_end_ms': 1000}
    clipped = dict(clean, audio_src_ms=[1070, 1370])                    # removes the end of the /s/
    mid_word = dict(clean, at_ms=950, audio_at_ms=950)                  # stem splice inside a word
    rows = voice_gates.splice_checks(stem, [clean, clipped, mid_word], source=src, source_chain=src)
    assert [r['ok'] for r in rows] == [True, False, False]
    assert rows[1]['removed_tail_over_db'][1] > 0 >= rows[1]['removed_tail_over_db'][0]   # caught by 2.5-12 kHz
    assert rows[2]['stem_splice_over_db'][0] > 0
    # stem only: a splice inside a word is caught, one in a pause passes
    assert [r['ok'] for r in voice_gates.splice_checks(stem, [{'at_ms': 500}, {'at_ms': 1150}])] == [False, True]


def test_splice_checks_flag_removed_speech_level_sound():
    src = _talk([(100, 1000), (1600, 2400)])
    src[int(1300 * SR / 1000):int(1360 * SR / 1000)] += 0.05            # a loud click/word the VAD missed
    stem = _talk([(100, 1000), (1300, 2100)])
    row = voice_gates.splice_checks(stem, [{'at_ms': 1150, 'audio_src_ms': [1200, 1440], 'word_end_ms': 1000}],
                                    source=src, source_chain=src)[0]
    assert row['removed_speech_db'] > tighten.LOUD_REL_DB and not row['ok']


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
    wav = _wav(tmp_path, 'v.wav', x)
    out = io.StringIO()
    res = voice_gates.check(wav, out=out)
    text = out.getvalue()
    assert 'pause share' in text and 'FAIL' in text and '8-16 kHz vs reference' in text
    assert 'pause share (pauses >= 150 ms)' in res['failed']
    with pytest.raises(voice_gates.GateFailure):
        voice_gates.check(wav, strict=True, out=io.StringIO())
    assert voice_gates.main(['--voice', str(wav), '--strict']) == 1
    assert voice_gates.main(['--voice', str(wav)]) == 0


def test_check_job_passes_the_tighten_av_offset(tmp_path, monkeypatch):
    import json
    vg = voice_gates
    # cuts.json times are on the corrected sound (av_offset_ms), so the source take is shifted the same way.
    (tmp_path / 'cuts.json').write_text(json.dumps({'cuts': [], 'av_offset_ms': -100.0}))
    seen = {}
    monkeypatch.setattr(vg, 'check', lambda voice, **kw: seen.update(kw) or {'rows': [], 'failed': []})
    vg.check_job(tmp_path)
    assert seen['av_offset_ms'] == -100.0
