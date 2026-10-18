"""Jump-cut tightening: pause caps, protected word endings judged on the processed audio, frame-accurate A/V sync
(any input sample rate or start offset, with or without the speed-up), caption remapping."""
import json
import shutil
import subprocess

import numpy as np
import pytest

from app import audio, tighten, voice_gates

needs_ffmpeg = pytest.mark.skipif(not (shutil.which('ffmpeg') and shutil.which('ffprobe')),
                                  reason='ffmpeg/ffprobe not on PATH')
SR, FPS, W, H = 48000, 25, 160, 288
BITS = 12
# (start_ms, end_ms, caption text): mid pause 400, sentence end 600 (+ a late /t/ release 130 ms after the word),
# a short 150 ms pause, a long sentence end 700 ms
WORDS = [(300, 700, 'Hello,'), (1100, 1500, 'world.'), (2100, 2500, 'This'), (2650, 3100, 'works!'), (3800, 4300, 'Bye.')]
BURST = (1630, 1650)
DURATION_MS = 4800


def _code_frame(i):
    img = np.full((H, W), 90, np.uint8)
    for b in range(BITS):
        r, c = divmod(b, 4)
        img[20 + r * 40:20 + r * 40 + 30, 10 + c * 36:10 + c * 36 + 30] = 255 if (i >> b) & 1 else 0
    return img


def _read_code(img):
    v = 0
    for b in range(BITS):
        r, c = divmod(b, 4)
        if img[25 + r * 40:45 + r * 40, 15 + c * 36:35 + c * 36].mean() > 128:
            v |= 1 << b
    return v


def _speech_like(n_ms, rng):
    """A voiced word: 140 Hz harmonic complex with a syllable wobble and 15/30 ms raised-cosine edges."""
    n = int(SR * n_ms / 1000)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * 140 * k * t + rng.uniform(0, 6.28)) / k for k in range(1, 25))
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * 5 * t) ** 2
    return 0.15 * x * _edges(n)


def _noise_word(n_ms, rng):
    """An unvoiced 'word': 200-4000 Hz noise, every 20 ms unique (for the speed-up's short-window sync check)."""
    n = int(SR * n_ms / 1000)
    return voice_gates._bandpass(rng.normal(0, 0.12, n), 200, 4000) * _edges(n)


def _edges(n):
    env = np.ones(n)
    a, r = int(0.015 * SR), int(0.03 * SR)
    env[:a] = audio.ramp(a)
    env[-r:] = audio.ramp(r, rising=False)
    return env


def _make_clip(folder, name, sig, duration_ms, extra=()):
    wav = audio.write_wav(folder / f'{name}.wav', np.stack([sig, sig], 1))
    frames = np.stack([_code_frame(i) for i in range(duration_ms * FPS // 1000)])
    src = folder / f'{name}.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(FPS),
                    '-i', '-', '-i', str(wav), '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                    '-b:a', '256k', *extra, '-shortest', str(src)], input=frames.tobytes(), check=True)
    return src


def _caps(words):
    return [{'text': (' ' if i else '') + w, 'startMs': a, 'endMs': b, 'timestampMs': (a + b) // 2, 'confidence': 1.0}
            for i, (a, b, w) in enumerate(words)]


@pytest.fixture(scope='module')
def clip(tmp_path_factory):
    folder = tmp_path_factory.mktemp('tighten')
    rng = np.random.default_rng(5)
    sig = rng.normal(0, 3e-4, int(SR * DURATION_MS / 1000))       # room floor, about -70 dBFS
    for a, b, _ in WORDS:
        sig[int(a * SR / 1000):int(b * SR / 1000)] += _speech_like(b - a, rng)
    b0, b1 = (int(v * SR / 1000) for v in BURST)
    sig[b0:b1] += rng.normal(0, 0.05, b1 - b0)                     # late release burst, about -26 dBFS
    return {'folder': folder, 'src': _make_clip(folder, 'take', sig, DURATION_MS), 'caps': _caps(WORDS)}


@pytest.fixture(scope='module')
def tightened(clip):
    out = clip['folder'] / 'tight.mp4'
    return out, tighten.tighten(clip['src'], out, clip['caps'])


def _frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W)


def _assert_in_sync(src, out, r):
    """Independent of measure_sync: every output frame shows the source frame the time map says (decoded frame
    numbers), and the audio in the middle of each kept segment is the source audio of the same instant."""
    s = r['sync']
    assert s['max_offset_ms'] is not None and s['max_offset_ms'] < 10 and s['segments_measured'] >= 3
    assert s['duration_diff_ms'] <= 1.0 and s['start_time_s'] == {'video': 0.0, 'audio': 0.0}
    codes = [_read_code(f) for f in _frames(out)]
    xs = tighten.decode_on_video_clock(src, tighten.probe(src)['v_start'])
    xo = tighten.decode_on_video_clock(out)
    for a, b, d in r['time_map']:
        for k in range(int(d) // 40, int(d + b - a) // 40):
            assert codes[k] == int(a + k * 40 - d) // 40
        mid_o, mid_s = int((d + (b - a) / 2) * SR / 1000), int((a + (b - a) / 2) * SR / 1000)
        seg_o, seg_s = xo[mid_o - 960:mid_o + 960], xs[mid_s - 960:mid_s + 960]
        if np.std(seg_s) > 1e-3:
            assert np.corrcoef(seg_o, seg_s)[0, 1] > 0.99


# ----------------------------------------------------------------------------- the synthetic take

@needs_ffmpeg
def test_cuts_are_whole_frames_never_shorter_than_min_cut(tightened):
    _, r = tightened
    assert r['cuts'], 'the 400/600/700 ms pauses must be cut'
    for c in r['cuts']:
        assert c['removed_ms'] >= tighten.MIN_CUT_MS and c['removed_ms'] % 40 == 0
        assert c['src_ms'][0] % 40 == 0 and c['src_ms'][1] % 40 == 0
        a0, a1 = c['audio_src_ms']                     # sound: the same length, within half a frame of the picture
        assert a1 - a0 == c['removed_ms'] and abs(a0 - c['src_ms'][0]) <= 20
    assert [p['kind'] for p in r['pauses']] == ['mid', 'end', 'mid', 'end']   # from the caption punctuation
    assert r['pauses'][2]['removed_ms'] == 0                                   # 150 ms pause: within cap + min cut


@needs_ffmpeg
def test_pauses_are_capped_from_the_word_end_and_the_late_release_survives(tightened):
    out, r = tightened
    x = tighten.decode_on_video_clock(out)
    lv = tighten.levels_db(x, 5)
    b0 = tighten.remap_ms(BURST[0], r['time_map'])
    assert lv[b0 // 5:(b0 + 20) // 5].max() > float(np.percentile(lv, 95)) - 26     # the /t/ burst, full level
    for p in r['pauses']:
        e0, s1 = p['src_ms']
        kept = tighten.remap_ms(s1, r['time_map']) - tighten.remap_ms(e0, r['time_map'])
        if p['why'] == 'cut':   # the cap (from the VAD end) or what the tail + lead rules need, + < 1 frame of rounding
            assert p['tail_ms'] + p['lead_ms'] <= kept < p['keep_ms'] + 40
    world = r['pauses'][1]       # 'world.' + release at +130: the release, then 100 ms of silence, then 'This'
    assert world['release_ms'] == 130 and world['why'] == 'cut'
    after = tighten.remap_ms(WORDS[2][0], r['time_map']) - tighten.remap_ms(BURST[1], r['time_map'])
    assert tighten.RELEASE_GAP_END_MS <= after <= tighten.RELEASE_GAP_END_MS + 60
    assert r['duration_out_ms'] < DURATION_MS - 600


@needs_ffmpeg
def test_no_word_ending_is_clipped_on_the_processed_audio(tightened, clip, tmp_path):
    out, r = tightened
    stem = tmp_path / 'stem.mp4'
    audio.enhance_voice(out, stem)
    rows = voice_gates.splice_checks(voice_gates._mono(stem), r['cuts'], tighten.decode_on_video_clock(clip['src']),
                                     audio.voice_chain_pcm(clip['src']))
    assert rows and all(row['ok'] for row in rows), rows
    for c in r['cuts']:
        if c['kind'] == 'end':                      # sentence ends keep the critic's full 150 ms after the VAD end
            assert c['audio_src_ms'][0] - c['word_end_ms'] >= tighten.TAIL_KEEP_MS


@needs_ffmpeg
def test_audio_and_video_stay_in_sync(tightened, clip):
    out, r = tightened
    _assert_in_sync(clip['src'], out, r)


@needs_ffmpeg
def test_captions_and_speech_are_remapped_onto_the_cut(tightened, clip):
    out, r = tightened
    onsets = [a for a, _ in audio.voice_activity(out, min_gap_ms=50)]   # a release 80 ms before a word: own span
    for cap in r['captions']:
        assert min(abs(cap['startMs'] - o) for o in onsets) <= 15
        assert cap['endMs'] > cap['startMs'] and cap['timestampMs'] == (cap['startMs'] + cap['endMs']) // 2
    assert len(r['speech']) == len(r['speech_src'])
    assert r['captions'][0]['startMs'] == WORDS[0][0] - r['lead_trim_ms']


@needs_ffmpeg
def test_a_44k_source_keeps_lip_sync(clip):
    # atrim counts samples at the input's own rate: a 44.1 kHz take used to come out 25-170 ms (last segment 2.7 s)
    # off. The audio is resampled to 48 kHz on the presentation clock before it is trimmed.
    src = clip['folder'] / 'take_44k.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip['src']), '-c:v', 'copy', '-c:a', 'aac', '-ar', '44100',
                    '-b:a', '256k', str(src)], check=True)
    assert tighten.probe(src)['a_sr'] == 44100
    out = clip['folder'] / 'tight_44k.mp4'
    r = tighten.tighten(src, out, clip['caps'])
    assert len(r['cuts']) >= 3
    _assert_in_sync(src, out, r)


@needs_ffmpeg
def test_a_late_audio_stream_keeps_lip_sync_and_caption_times(clip):
    # a phone recording can start its audio after the picture: Whisper times are on the audio clock
    src = clip['folder'] / 'take_late_audio.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip['src']), '-itsoffset', '0.1', '-i', str(clip['src']),
                    '-map', '0:v', '-map', '1:a', '-c', 'copy', str(src)], check=True)
    pr = tighten.probe(src)
    assert pr['a_start'] - pr['v_start'] > 0.05
    # Whisper would time the words from the first decoded sample of this file (copying the stream also keeps the
    # 21 ms AAC priming as samples), so the captions are measured on that clock here
    shift = audio.voice_activity(src)[0][0] - WORDS[0][0]
    caps = [{**c, 'startMs': c['startMs'] + shift, 'endMs': c['endMs'] + shift} for c in clip['caps']]
    out = clip['folder'] / 'tight_late_audio.mp4'
    r = tighten.tighten(src, out, caps)
    assert r['clock']['shift_ms'] > 50 and r['sync']['max_offset_ms'] < 10 and r['sync']['duration_diff_ms'] <= 1.0
    onsets = [a for a, _ in audio.voice_activity(out, min_gap_ms=50)]   # a release 80 ms before a word: own span
    for cap in r['captions']:
        assert min(abs(cap['startMs'] - o) for o in onsets) <= 15


@needs_ffmpeg
@pytest.mark.parametrize('offset', [-100, 60])
def test_provider_av_offset_moves_the_sound_against_the_picture(clip, tmp_path, offset):
    # HeyGen takes come with the voice ~100 ms behind the lips: av_offset_ms moves the sound (negative = earlier)
    # before anything is measured, so cuts, captions and the sync check all run on the corrected clock.
    out = tmp_path / f'tight_{offset}.mp4'
    r = tighten.tighten(clip['src'], out, clip['caps'], av_offset_ms=offset)
    assert r['av_offset_ms'] == offset and r['clock']['av_offset_ms'] == offset
    s = r['sync']
    assert s['av_offset_ms'] == offset and s['max_offset_ms'] < 10 and s['duration_diff_ms'] <= 1.0
    assert len(r['cuts']) >= 3
    codes = [_read_code(f) for f in _frames(out)]
    xs = tighten.decode_on_video_clock(clip['src'])
    xo = tighten.decode_on_video_clock(out)
    for a, b, d in r['time_map']:
        for k in range(int(d) // 40, int(d + b - a) // 40):
            assert codes[k] == int(a + k * 40 - d) // 40                 # the picture is untouched...
        mid_o, mid_s = int((d + (b - a) / 2) * SR / 1000), int((a + (b - a) / 2 - offset) * SR / 1000)
        seg_o, seg_s = xo[mid_o - 960:mid_o + 960], xs[mid_s - 960:mid_s + 960]
        if np.std(seg_s) > 1e-3 and np.std(seg_o) > 1e-3:
            assert np.corrcoef(seg_o, seg_s)[0, 1] > 0.99               # ...the sound comes from offset ms away
    onsets = [a for a, _ in audio.voice_activity(out, min_gap_ms=50)]
    for cap in r['captions']:                                            # captions follow the moved voice
        assert min(abs(cap['startMs'] - o) for o in onsets) <= 15
    keep = json.loads(tighten.write_cuts(tmp_path, r).read_text())
    assert keep['av_offset_ms'] == offset


def test_shift_pcm_keeps_the_length():
    x = np.arange(10, dtype=float)
    assert list(tighten.shift_pcm(x, -2, sr=1000)) == [2, 3, 4, 5, 6, 7, 8, 9, 0, 0]
    assert list(tighten.shift_pcm(x, 3, sr=1000)) == [0, 0, 0, 0, 1, 2, 3, 4, 5, 6]
    assert tighten.shift_pcm(x, 0) is x
    assert tighten.PROVIDER_AV_OFFSET_MS['heygen'] < 0


@needs_ffmpeg
def test_optional_speed_up_keeps_sync(tmp_path):
    rng = np.random.default_rng(9)
    words = [(300, 900, 'One,'), (1400, 2000, 'two.'), (2700, 3300, 'Three.')]
    sig = rng.normal(0, 3e-4, int(SR * 3800 / 1000))
    for a, b, _ in words:
        sig[int(a * SR / 1000):int(b * SR / 1000)] += _noise_word(b - a, rng)
    src = _make_clip(tmp_path, 'noise', sig, 3800)
    out = tmp_path / 'fast.mp4'
    r = tighten.tighten(src, out, _caps(words), speed=1.05)
    s = r['sync']
    assert r['cuts'] and s['segments_measured'] >= 2
    assert s['max_offset_ms'] < tighten.SPEED_SYNC_MS                       # incl. the picture's frame quantisation
    assert s['duration_diff_ms'] <= 1.0                                      # atempo's short output is padded
    kept = sum(b - x for x, b, _ in r['time_map'])
    assert r['duration_out_ms'] == round(round(kept / 40 / 1.05) * 40) == round(s['video_s'] * 1000)
    assert r['captions'][-1]['startMs'] == tighten.remap_ms(words[-1][0], r['time_map'], 1.05)


@needs_ffmpeg
def test_weak_fricative_onset_and_mid_sentence_breath_survive_the_cut(tmp_path):
    # 'and' + an HF breath 60-160 ms after it (mid pause 600 ms) | 'free' opening with a 70 ms /f/ that only the
    # 2.5-12 kHz band sees (broadband under the VAD and under the audible line)
    rng = np.random.default_rng(11)
    words = [(300, 700, 'and'), (1300, 1800, 'free'), (2300, 2700, 'now.')]
    sig = rng.normal(0, 3e-4, int(SR * 3200 / 1000))
    for a, b, _ in words:
        sig[int(a * SR / 1000):int(b * SR / 1000)] += _speech_like(b - a, rng)
    breath = (760, 860)
    fric = (1230, 1300)
    for (a, b), level in ((breath, 0.006), (fric, 0.0025)):
        n = int((b - a) * SR / 1000)
        sig[int(a * SR / 1000):int(a * SR / 1000) + n] += voice_gates._bandpass(rng.normal(0, level, n), 3000, 9000) * _edges(n)
    src = _make_clip(tmp_path, 'hard', sig, 3200)
    xc = audio.voice_chain_pcm(src)
    aud = tighten.audibility(xc)
    k = (fric[0] + 35) // 5
    assert aud['lv'][k] < aud['bb_line'] < aud['lv'][(words[1][0] + 100) // 5] and aud['hf'][k] > aud['hf_line']
    out = tmp_path / 'hard_tight.mp4'
    r = tighten.tighten(src, out, _caps(words))
    mid = r['pauses'][0]
    assert mid['why'] == 'cut' and mid['src_ms'][1] == words[1][0]
    cut = next(c for c in r['cuts'] if c['word_end_ms'] == mid['src_ms'][0])
    a0, a1 = cut['audio_src_ms']
    assert a0 >= breath[1] and a1 <= fric[0] - 5          # the breath stays whole, the /f/ rise is kept
    assert mid['lead_ms'] >= words[1][0] - fric[0]
    stem = tmp_path / 'hard_stem.mp4'
    audio.enhance_voice(out, stem)
    rows = voice_gates.splice_checks(voice_gates._mono(stem), r['cuts'], tighten.decode_on_video_clock(src), xc)
    assert all(row['ok'] for row in rows), rows


def test_remap_ms_moves_removed_time_onto_the_cut():
    tm = [[280, 1000, 0], [1200, 2000, 720]]
    assert tighten.remap_ms(0, tm) == 0
    assert tighten.remap_ms(500, tm) == 220
    assert tighten.remap_ms(1100, tm) == 720          # inside the removed span -> the cut
    assert tighten.remap_ms(1500, tm) == 1020
    assert tighten.remap_ms(5000, tm) == 1520         # past the end -> the end
    assert tighten.remap_ms(1500, tm, speed=1.02) == 1000
    caps = tighten.remap_captions([{'text': 'a', 'startMs': 900, 'endMs': 1300, 'timestampMs': 0}], tm)
    assert caps[0]['startMs'] == 620 and caps[0]['endMs'] == 820


# ----------------------------------------------------------------------------- the planner on level tracks

def _plan(segments, spans, kinds, total_ms=2000, n_frames=50, hf_only=(), **kw):
    """plan_cuts on a synthetic 5 ms level track: segments [(a, b, dBFS)], audible = over -44 dBFS (+ hf_only spans)."""
    lv = np.full(total_ms // 5, -70.0)
    for a, b, level in segments:
        lv[a // 5:b // 5] = level
    aud = lv > -44
    for a, b in hf_only:
        aud[a // 5:b // 5] = True
    return tighten.plan_cuts(lv, aud, spans, kinds, 40.0, n_frames, loud_db=-38.0, **kw)


def test_plan_never_cuts_a_short_excess_or_a_missed_word():
    # pause of 260 ms after a sentence end: 40 ms over the cap, a cut would be < 120 ms -> no cut
    _, cuts, pauses = _plan([(0, 500, -12), (760, 1200, -12)], [(0, 500), (760, 1200)], ['end'], n_frames=30)
    assert cuts == [] and pauses[0]['why'].startswith('within cap + min cut / 2')
    # a 150 ms mid pause is 30 ms over its cap: a 120 ms cut would leave 30 ms, so it stays
    _, cuts, pauses = _plan([(0, 500, -12), (650, 1200, -12)], [(0, 500), (650, 1200)], ['mid'], n_frames=30)
    assert cuts == [] and pauses[0]['removed_ms'] == 0
    # a quiet word the VAD missed (-30 dB) in the middle of a long pause is kept: the cut avoids it
    _, cuts, _ = _plan([(0, 400, -12), (700, 800, -30), (1400, 1800, -12)], [(0, 400), (1400, 1800)], ['mid'])
    assert cuts and all(not (c['audio_ms'][0] < 800 and c['audio_ms'][1] > 700) for c in cuts)


def test_plan_counts_the_cap_from_the_word_end_and_keeps_a_late_release():
    # HeyGen holds a final /p/ /t/ closure 130 ms, then bursts: the burst and its decay are kept, but the pause is
    # measured from the vowel's VAD end (the first version counted the cap from the burst: 160 + 120 ms mid)
    _, cuts, pauses = _plan([(0, 400, -12), (530, 560, -24), (1300, 1700, -12)], [(0, 400), (1300, 1700)], ['mid'])
    p = pauses[0]
    assert p['release_ms'] == 130 and p['tail_ms'] == 160 + tighten.GUARD_MS
    a, b = cuts[0]['audio_ms']
    kept = 900 - (b - a)
    assert a >= 560 + tighten.GUARD_MS and p['tail_ms'] + p['lead_ms'] <= kept < p['keep_ms'] + 40 <= 160 + 120 + 40
    # at a sentence end the release also gets 100 ms of silence after it, so it cannot attach to the next sentence
    _, cuts, pauses = _plan([(0, 400, -12), (530, 560, -24), (1300, 1700, -12)], [(0, 400), (1300, 1700)], ['end'])
    p = pauses[0]
    assert p['tail_ms'] == 160 + tighten.RELEASE_GAP_END_MS and cuts[0]['audio_ms'][0] >= 400 + p['tail_ms']
    assert p['keep_ms'] == p['tail_ms'] + p['lead_ms'] <= 900 - (cuts[0]['audio_ms'][1] - cuts[0]['audio_ms'][0]) < p['keep_ms'] + 40


def test_plan_sentence_end_keeps_the_full_150_ms():
    _, cuts, pauses = _plan([(0, 400, -12), (1000, 1400, -12)], [(0, 400), (1000, 1400)], ['end'])
    assert pauses[0]['tail_ms'] == tighten.TAIL_KEEP_MS and cuts[0]['audio_ms'][0] >= 400 + tighten.TAIL_KEEP_MS


def test_plan_mid_sentence_keeps_the_audible_decay_and_a_breath_but_cuts_silence():
    # the rule chosen for mid pauses: everything audible that starts within 150 ms of the word end is kept until it
    # decays (+10 ms); silence inside the 150 ms may go (a literal 150 ms would leave every mid pause at 170-190 ms)
    _, cuts, pauses = _plan([(0, 400, -12), (400, 460, -40), (1000, 1400, -12)], [(0, 400), (1000, 1400)], ['mid'])
    assert pauses[0]['tail_ms'] == 70
    a, b = cuts[0]['audio_ms']
    assert a >= 470 and 600 - (b - a) <= tighten.MID_CAP_MS
    # a breath starting 80 ms after the word is kept whole, not chopped
    _, cuts, pauses = _plan([(0, 400, -12), (480, 600, -36), (1200, 1600, -12)], [(0, 400), (1200, 1600)], ['mid'])
    assert pauses[0]['tail_ms'] == 210 and cuts[0]['audio_ms'][0] >= 610


def test_plan_keeps_an_onset_only_the_hf_band_hears():
    _, cuts, pauses = _plan([(0, 400, -12), (1000, 1400, -12)], [(0, 400), (1000, 1400)], ['mid'], hf_only=[(940, 1000)])
    assert pauses[0]['lead_ms'] == 60 + tighten.GUARD_MS
    assert cuts[0]['audio_ms'][1] <= 940 - tighten.GUARD_MS


def test_plan_places_the_audio_splice_between_frame_edges_when_that_fits_the_min_cut():
    # audible decay to 440 ms (tail 50), an HF rise from 590 before the word at 610 (lead 30): 130 ms of room from 450
    # to 580. Only 2 whole frames fit between frame edges (480-560), but a 3-frame audio run fits; the picture
    # cuts the nearest 3 frames, at most half a frame away
    _, cuts, pauses = _plan([(0, 400, -12), (400, 440, -40), (610, 900, -12)], [(0, 400), (610, 900)], ['mid'],
                            total_ms=1000, hf_only=[(590, 610)])
    assert (pauses[0]['tail_ms'], pauses[0]['lead_ms']) == (50, 30)
    assert int(580 // 40) - int(-(-450 // 40)) == 2
    (f0, f1), (a, b) = cuts[0]['frames'], cuts[0]['audio_ms']
    assert f1 - f0 == 3 and b - a == 120 and abs(a - f0 * 40) <= 20
    assert a >= 450 and b <= 580


def test_sync_problem_names_what_is_wrong():
    ok = {'max_offset_ms': 0.0, 'duration_diff_ms': 0.0}
    assert tighten.sync_problem(ok) is None
    assert 'could not be measured' in tighten.sync_problem({'max_offset_ms': None})
    assert '>= 10' in tighten.sync_problem({'max_offset_ms': 12.5, 'duration_diff_ms': 0})
    assert 'differ' in tighten.sync_problem({'max_offset_ms': 0.0, 'duration_diff_ms': 41.0})


# ----------------------------------------------------------------------------- the reel build

def _job(clip, tmp_path):
    job = tmp_path / 'job'
    (job / 'takes').mkdir(parents=True)
    shutil.copy2(clip['src'], job / 'takes' / 'take.mp4')
    (job / 'plan.json').write_text(json.dumps({
        'take': 'takes/take.mp4', 'emphasis': [], 'music_preset': 'glow',
        'templates': [{'anchor': None, 'scene': {'type': 'title', 'line1': 'A', 'line2': 'B', 'image': 'job/x.png'}},
                      {'anchor': 'works', 'scene': {'type': 'end', 'word': 'bye'}}],
        # measured on the old trim_lead_in avatar.mp4 (lead-in cut at the first onset - 40 ms)
        'caption_overrides': {'take': 'takes/take.mp4', 'words': [{'word': 'bye', 'startMs': 3800 - 260}]}}))
    return job


@needs_ffmpeg
def test_reel_build_tightens_the_take_before_voice_captions_and_edit(clip, tmp_path, monkeypatch):
    from app import reel
    job = _job(clip, tmp_path)
    seen = []
    monkeypatch.setattr(reel, 'transcribe_words', lambda video, prompt='': seen.append(str(video)) or clip['caps'])
    monkeypatch.setattr(reel, 'REMOTION', tmp_path / 'remotion')
    result = reel.build(job, render=False)
    assert seen == [str(job / 'takes' / 'take.mp4')]                      # Whisper once, on the take
    cuts = json.loads((job / 'cuts.json').read_text())
    assert result['cuts'] == len(cuts['cuts']) >= 3 and result['lip_sync_ms'] < 10
    assert abs(audio.probe_duration(job / 'avatar.mp4') * 1000 - cuts['duration_out_ms']) <= 25
    assert audio.probe_duration(job / 'avatar_enhanced.mp4') < DURATION_MS / 1000 - 0.6
    caps = json.loads((job / 'captions.json').read_text())
    speech = json.loads((job / 'speech.json').read_text())
    assert caps[-1]['startMs'] == tighten.remap_ms(3800, cuts['time_map'])  # the override, remapped onto the cut
    assert abs(caps[1]['startMs'] - speech[1][0]) <= 20                      # captions sit on the tightened voice
    edit = json.loads((job / 'edit.json').read_text())
    assert edit['durationMs'] == result['durationMs'] and len(edit['jumpCuts']) >= 1
    assert all(j['scale'] in (1.0, 1.06) for j in edit['jumpCuts'])
    assert (tmp_path / 'remotion' / 'public' / 'job' / 'avatar_enhanced.mp4').exists()


@needs_ffmpeg
def test_reel_build_stops_when_tighten_breaks_lip_sync(clip, tmp_path, monkeypatch):
    from app import reel
    job = _job(clip, tmp_path)
    monkeypatch.setattr(reel, 'transcribe_words', lambda video, prompt='': clip['caps'])
    monkeypatch.setattr(reel, 'REMOTION', tmp_path / 'remotion')
    monkeypatch.setattr(tighten, 'measure_sync', lambda *a, **k: {'max_offset_ms': 134.0, 'duration_diff_ms': 0.0})
    with pytest.raises(RuntimeError, match='lip-sync offset 134.0 ms'):
        reel.build(job, render=False)
    assert not (job / 'avatar_enhanced.mp4').exists()                       # nothing built on the drifted clip


@needs_ffmpeg
def test_speed_up_of_a_tightened_clip_keeps_sync_and_moves_cuts_to_their_frames(tmp_path):
    rng = np.random.default_rng(13)
    words = [(300, 900, 'One,'), (1400, 2000, 'two.'), (2700, 3300, 'Three.')]
    sig = rng.normal(0, 3e-4, int(SR * 3800 / 1000))
    for a, b, _ in words:
        sig[int(a * SR / 1000):int(b * SR / 1000)] += _noise_word(b - a, rng)
    src = _make_clip(tmp_path, 'tight', sig, 3800)
    out = tmp_path / 'fast.mp4'
    r = tighten.speed_up(src, out, 1.1, captions=_caps(words), cuts=[1000, 2400])
    s = r['sync']
    assert s['segments_measured'] >= 1 and s['max_offset_ms'] < tighten.SPEED_SYNC_MS and s['duration_diff_ms'] <= 1.0
    assert r['duration_out_ms'] == round(round(3800 / 40 / 1.1) * 40) == round(s['video_s'] * 1000)
    assert r['captions'][1]['startMs'] == round(1400 / 1.1)
    frames = _frames(out)
    for c, at in zip([1000, 2400], r['cuts']):
        k = at // 40                              # the first output frame at or after the source frame of the cut
        assert _read_code(frames[k]) >= c // 40 and _read_code(frames[k - 1]) < c // 40
