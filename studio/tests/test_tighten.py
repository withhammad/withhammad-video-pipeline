"""Jump-cut tightening: pause caps, protected word tails, frame-accurate A/V sync, caption remapping."""
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
    env = np.ones(n)
    a, r = int(0.015 * SR), int(0.03 * SR)
    env[:a] = audio.ramp(a)
    env[-r:] = audio.ramp(r, rising=False)
    return 0.15 * x * env


@pytest.fixture(scope='module')
def clip(tmp_path_factory):
    folder = tmp_path_factory.mktemp('tighten')
    rng = np.random.default_rng(5)
    n = int(SR * DURATION_MS / 1000)
    sig = rng.normal(0, 3e-4, n)                                   # room floor, about -70 dBFS
    for a, b, _ in WORDS:
        sig[int(a * SR / 1000):int(b * SR / 1000)] += _speech_like(b - a, rng)
    b0, b1 = (int(v * SR / 1000) for v in BURST)
    sig[b0:b1] += rng.normal(0, 0.05, b1 - b0)                     # late release burst, about -26 dBFS
    wav = audio.write_wav(folder / 'voice.wav', np.stack([sig, sig], 1))
    frames = np.stack([_code_frame(i) for i in range(DURATION_MS * FPS // 1000)])
    src = folder / 'take.mp4'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(FPS),
                    '-i', '-', '-i', str(wav), '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                    '-b:a', '256k', '-shortest', str(src)], input=frames.tobytes(), check=True)
    caps = [{'text': (' ' if i else '') + w, 'startMs': a, 'endMs': b, 'timestampMs': (a + b) // 2, 'confidence': 1.0}
            for i, (a, b, w) in enumerate(WORDS)]
    return {'folder': folder, 'src': src, 'caps': caps}


@pytest.fixture(scope='module')
def tightened(clip):
    out = clip['folder'] / 'tight.mp4'
    return out, tighten.tighten(clip['src'], out, clip['caps'])


def _frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W)


@needs_ffmpeg
def test_cuts_are_whole_frames_never_shorter_than_min_cut(tightened):
    _, r = tightened
    assert r['cuts'], 'the 400/600/700 ms pauses must be cut'
    for c in r['cuts']:
        assert c['removed_ms'] >= tighten.MIN_CUT_MS and c['removed_ms'] % 40 == 0
        assert c['src_ms'][0] % 40 == 0 and c['src_ms'][1] % 40 == 0
    assert [p['kind'] for p in r['pauses']] == ['mid', 'end', 'mid', 'end']   # from the caption punctuation
    assert r['pauses'][2]['removed_ms'] == 0                                   # 150 ms pause: within cap + min cut


@needs_ffmpeg
def test_caps_pauses_and_keeps_the_late_release(tightened, clip):
    out, r = tightened
    x = audio.decode(out, sr=SR, channels=1).reshape(-1)
    lv = tighten.levels_db(x, 5)
    p95 = float(np.percentile(lv, 95))
    # the /t/ burst survives at its remapped position, at full level
    b0 = tighten.remap_ms(BURST[0], r['time_map'])
    assert lv[b0 // 5:(b0 + 20) // 5].max() > p95 - 26
    # measured pauses on the output: mid <= ~120 ms (+ one frame of rounding), sentence ends <= ~220 ms after the
    # word's real end (the burst), and every original pause got shorter or stayed under its cap
    spans = voice_gates.pauses(x)['spans']
    gaps = [b[0] - a[1] for a, b in zip(spans, spans[1:])]
    assert max(gaps) <= tighten.END_CAP_MS + 40
    assert r['duration_out_ms'] < DURATION_MS - 600
    w = [tighten.remap_ms(a, r['time_map']) for a, _, _ in WORDS]
    assert w[1] - tighten.remap_ms(WORDS[0][1], r['time_map']) <= tighten.MID_CAP_MS + 40
    assert w[4] - tighten.remap_ms(WORDS[3][1], r['time_map']) <= tighten.END_CAP_MS + 40
    # protected tail: nothing within tail_keep_ms after the measured end of a sentence-final word (its VAD end, or
    # the late release when there is one) was removed
    for c in r['cuts']:
        if c['kind'] == 'end':
            end = max(b for _, b in r['speech_src'] if b <= c['src_ms'][0])
            if end < BURST[0] < c['src_ms'][0]:
                end = BURST[1]
            assert c['src_ms'][0] - end >= tighten.TAIL_KEEP_MS


@needs_ffmpeg
def test_audio_and_video_stay_in_sync(tightened, clip):
    out, r = tightened
    s = r['sync']
    assert s['max_offset_ms'] is not None and s['max_offset_ms'] < 10
    assert s['duration_diff_ms'] <= 1.0 and s['start_time_s'] == {'video': 0.0, 'audio': 0.0}
    # independent check: every output frame shows the source frame the time map says, and the audio at that
    # frame is the source audio of the same instant
    codes = [_read_code(f) for f in _frames(out)]
    xs = audio.decode(clip['src'], sr=SR, channels=1).reshape(-1)
    xo = audio.decode(out, sr=SR, channels=1).reshape(-1)
    for a, b, d in r['time_map']:
        for k in range(int(d) // 40, int(d + b - a) // 40):
            assert codes[k] == int(a + k * 40 - d) // 40
        mid_o, mid_s = int((d + (b - a) / 2) * SR / 1000), int((a + (b - a) / 2) * SR / 1000)
        seg_o, seg_s = xo[mid_o - 960:mid_o + 960], xs[mid_s - 960:mid_s + 960]
        if np.std(seg_s) > 1e-3:
            assert np.corrcoef(seg_o, seg_s)[0, 1] > 0.99


@needs_ffmpeg
def test_captions_and_speech_are_remapped_onto_the_cut(tightened, clip):
    out, r = tightened
    x = audio.decode(out, sr=SR, channels=1).reshape(-1)
    onsets = [a for a, _ in voice_gates.pauses(x)['spans']]
    for cap in r['captions']:
        assert min(abs(cap['startMs'] - o) for o in onsets) <= 15
        assert cap['endMs'] > cap['startMs'] and cap['timestampMs'] == (cap['startMs'] + cap['endMs']) // 2
    assert len(r['speech']) == len(r['speech_src'])
    assert r['captions'][0]['startMs'] == WORDS[0][0] - r['lead_trim_ms']


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


def _levels_with(segments, total_ms=2000, floor=-70.0):
    lv = np.full(total_ms // 5, floor)
    for a, b, level in segments:
        lv[a // 5:b // 5] = level
    return lv


def test_plan_never_cuts_a_short_excess_or_a_missed_word():
    kw = dict(silence_db=-44.0, loud_db=-38.0)
    # pause of 260 ms after a sentence end: 40 ms over the cap, a cut would be < 120 ms -> no cut
    lv = _levels_with([(0, 500, -12), (760, 1200, -12)])
    _, cuts, pauses = tighten.plan_cuts(lv, [(0, 500), (760, 1200)], ['end'], 40.0, 30, **kw)
    assert cuts == [] and pauses[0]['why'].startswith('protected')
    # a quiet word the VAD missed (-30 dB) in the middle of a long pause is kept: the cut avoids it
    lv = _levels_with([(0, 400, -12), (700, 800, -30), (1400, 1800, -12)])
    _, cuts, _ = tighten.plan_cuts(lv, [(0, 400), (1400, 1800)], ['mid'], 40.0, 50, **kw)
    assert cuts and all(not (a * 40 < 800 and b * 40 > 700) for a, b, *_ in cuts)


def test_plan_keeps_a_late_release_and_measures_the_pause_after_it():
    kw = dict(silence_db=-44.0, loud_db=-38.0)
    lv = _levels_with([(0, 400, -12), (530, 560, -24), (1300, 1700, -12)])   # burst 130-160 ms after the word
    _, cuts, pauses = tighten.plan_cuts(lv, [(0, 400), (1300, 1700)], ['end'], 40.0, 45, **kw)
    assert pauses[0]['word_end_ms'] >= 160
    a, b, kind, _ = cuts[0]
    assert a * 40 >= 560 + tighten.TAIL_KEEP_MS and kind == 'end'
    assert 1300 - 400 - (b - a) * 40 <= pauses[0]['word_end_ms'] + tighten.END_CAP_MS + 40


@needs_ffmpeg
def test_optional_speed_up_keeps_sync(clip):
    out = clip['folder'] / 'fast.mp4'
    r = tighten.tighten(clip['src'], out, clip['caps'], speed=1.05)
    v, a = (float(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', f'{k}:0', '-show_entries', 'stream=duration',
                                  '-of', 'csv=p=0', str(out)], capture_output=True, text=True, check=True).stdout)
            for k in ('v', 'a'))
    kept = sum(b - x for x, b, _ in r['time_map'])
    assert r['duration_out_ms'] == round(round(kept / 40 / 1.05) * 40)
    assert abs(v * 1000 - r['duration_out_ms']) <= 1 and abs(a * 1000 - r['duration_out_ms']) <= 1
    assert r['captions'][-1]['startMs'] == tighten.remap_ms(WORDS[-1][0], r['time_map'], 1.05)


@needs_ffmpeg
def test_reel_build_tightens_the_take_before_voice_captions_and_edit(clip, tmp_path, monkeypatch):
    from app import reel
    job = tmp_path / 'job'
    (job / 'takes').mkdir(parents=True)
    shutil.copy2(clip['src'], job / 'takes' / 'take.mp4')
    (job / 'plan.json').write_text(json.dumps({
        'take': 'takes/take.mp4', 'emphasis': [], 'music_preset': 'glow',
        'templates': [{'anchor': None, 'scene': {'type': 'title', 'line1': 'A', 'line2': 'B', 'image': 'job/x.png'}},
                      {'anchor': 'works', 'scene': {'type': 'end', 'word': 'bye'}}],
        # measured on the old trim_lead_in avatar.mp4 (lead-in cut at the first onset - 40 ms)
        'caption_overrides': {'take': 'takes/take.mp4', 'words': [{'word': 'bye', 'startMs': 3800 - 260}]}}))
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
