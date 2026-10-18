"""Cover stage: the frame picker on a synthetic clip, the JPEG export, the lesson copy checks, the reel hook and
(when Node and the Remotion browser are installed) a real render. Nothing here touches a network service."""
import base64
import json
import shutil
import subprocess
import uuid
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

from app import thumbnail

HAS_FFMPEG = bool(shutil.which('ffmpeg') and shutil.which('ffprobe'))
needs_ffmpeg = pytest.mark.skipif(not HAS_FFMPEG, reason='ffmpeg not installed')
CAN_RENDER = bool(shutil.which('npx') and (thumbnail.REMOTION / 'node_modules' / 'remotion').exists()
                  and thumbnail.browser_executable())
needs_remotion = pytest.mark.skipif(not CAN_RENDER, reason='npx, studio/remotion/node_modules or its browser missing')

BLINK = (2.95, 3.65)   # lids closed: skin over both eyes and a dark lash line (samples 3.0-3.6 s)
SMILES = ((1.0, 1.6), (4.2, 4.8), (6.6, 7.4))   # held smiles: the picks that are "at rest"
SKIN = '0xB08A70'      # luma ~146: bright next to an iris, but below the teeth level
COVER = {'kicker': 'Open-source REA · MIT licence', 'hook': 'Reverse-engineer', 'pill_strong': 'ANY',
         'pill_serif': 'feature'}
# The blink is also a pause with the biggest bright "smile", so it would score high if blinks were not excluded.
CAPTIONS = [{'text': 'one', 'startMs': 0, 'endMs': 2800}, {'text': ' two', 'startMs': 3800, 'endMs': 8000}]


@pytest.fixture(scope='module')
def clip(tmp_path_factory):
    """8 s, 720x1280, 25 fps: testsrc2 texture, a skin patch with brows and two open eyes (white sclera, dark iris),
    a blink at 3.0-3.6 s (skin plus a lash line: horizontal dark bands like the brows), a big white 'smile' around
    the blink and three smaller held smiles."""
    if not HAS_FFMPEG:
        pytest.skip('ffmpeg not installed')
    out = tmp_path_factory.mktemp('clip') / 'avatar.mp4'
    boxes = ','.join([
        f'drawbox=x=240:y=380:w=260:h=130:color={SKIN}:t=fill',      # around the eyes
        f'drawbox=x=280:y=540:w=180:h=120:color={SKIN}:t=fill',      # around the mouth
        'drawbox=x=296:y=404:w=72:h=12:color=black:t=fill',          # brows
        'drawbox=x=376:y=404:w=72:h=12:color=black:t=fill',
        'drawbox=x=298:y=436:w=64:h=32:color=white:t=fill',          # sclera
        'drawbox=x=378:y=436:w=64:h=32:color=white:t=fill',
        'drawbox=x=322:y=440:w=16:h=24:color=black:t=fill',          # iris
        'drawbox=x=402:y=440:w=16:h=24:color=black:t=fill',
        f"drawbox=x=290:y=430:w=160:h=44:color={SKIN}:t=fill:enable='between(t,{BLINK[0]},{BLINK[1]})'",
        f"drawbox=x=298:y=450:w=144:h=4:color=black:t=fill:enable='between(t,{BLINK[0]},{BLINK[1]})'",
        "drawbox=x=310:y=560:w=120:h=80:color=white:t=fill:enable='between(t,2.9,3.7)'",
        *[f"drawbox=x=330:y=575:w=80:h=50:color=white:t=fill:enable='between(t,{a},{b})'" for a, b in SMILES]])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=720x1280:rate=25:duration=8',
                    '-vf', boxes, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-g', '25', str(out)], check=True, timeout=120)
    return out


def make_job(tmp_path, clip, cover=COVER):
    job = tmp_path / 'job'
    job.mkdir()
    shutil.copy2(clip, job / 'avatar.mp4')
    (job / 'captions.json').write_text(json.dumps(CAPTIONS))
    lesson = {'topic_title': 'T'}
    if cover is not None:
        lesson['cover'] = cover
    (job / 'lesson.json').write_text(json.dumps(lesson, ensure_ascii=False))
    (job / 'plan.json').write_text(json.dumps({'take': 'takes/raw.mp4'}))
    return job


def rgb(path):
    """Decode an image to an HxWx3 uint8 array with ffmpeg."""
    w, h, _ = thumbnail.probe_image(path)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3)


# ---------------------------------------------------------------- frame picker

@needs_ffmpeg
def test_picker_returns_three_spread_picks_and_never_the_blink_or_the_edges(clip):
    picked = thumbnail.pick_frames(clip, CAPTIONS)
    times = [p['t'] for p in picked['picks']]
    assert picked['fps'] == 5 and picked['frames'] == 40 and len(times) == 3
    assert all(abs(a - b) >= 1.5 for i, a in enumerate(times) for b in times[i + 1:])
    assert all(0.5 <= t <= 7.5 for t in times)
    rows = {r['t']: r for r in picked['rows']}
    blinks = {t for t, r in rows.items() if r['blink']}
    assert blinks == {3.0, 3.2, 3.4, 3.6} and not blinks & set(times)
    assert rows[3.2]['eyes_open'] == 0 and min(r['eyes_open'] for t, r in rows.items() if t not in blinks) > 20
    assert rows[3.2]['pause'] and not rows[1.0]['pause']
    # the trap is real: the blink frames are pauses with the brightest "smile" of the take
    assert min(rows[t]['teeth'] for t in blinks) >= max(r['teeth'] for r in picked['rows'])
    assert rows[0.0]['edge'] and rows[7.8]['edge'] and 'score' not in rows[3.2]
    assert picked['picks'] == sorted(picked['picks'], key=lambda p: -p['score'])
    # one pick from each held smile: picks 2 and 3 must be at rest, never a talking face
    assert sorted(next(i for i, (a, b) in enumerate(SMILES) if a <= t <= b) for t in times) == [0, 1, 2]
    assert all(p['at_rest'] for p in picked['picks'][1:])


@needs_ffmpeg
def test_picker_rejects_a_take_with_no_usable_frame(tmp_path):
    short = tmp_path / 'short.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=25:duration=0.8',
                    '-pix_fmt', 'yuv420p', str(short)], check=True, timeout=60)
    with pytest.raises(thumbnail.CoverError, match='no usable frame'):
        thumbnail.pick_frames(short)


def test_head_geometry_and_face_layout():
    frame = np.full((640, 360), 220, np.float32)
    frame[110:250, 140:220] = 20                       # dark hair/head against a light wall, centred
    hair, centre = thumbnail.head_geometry(frame)
    assert hair == pytest.approx(110 / 640) and centre == pytest.approx(0.5, abs=0.01)
    assert thumbnail.head_geometry(np.full((640, 360), 30, np.float32)) == (None, None)   # dark wall: no guess

    assert thumbnail.face_layout(None, None) == {'faceTop': thumbnail.DEFAULT_FACE_TOP, 'faceScale': 0.75,
                                                 'faceShiftX': 0}
    centred = thumbnail.face_layout(hair, 0.5)
    assert centred['faceShiftX'] == 0 and centred['faceTop'] == round(thumbnail.HAIR_Y - hair * 2560 * 0.75)
    off = thumbnail.face_layout(0.2, 0.40)             # head 10 % left of centre: nudge capped at 24 px
    assert off['faceShiftX'] == 24
    width = 1440 * off['faceScale']
    left = (1080 - width) / 2 + off['faceShiftX']
    assert left <= 0 and left + width >= 1080           # the enlarged face still covers the whole width


# ---------------------------------------------------------------- copy

def test_cover_copy_needs_the_lesson_cover_with_schema_limits():
    with pytest.raises(thumbnail.CoverError, match='no "cover" object.*sources_checked'):
        thumbnail.cover_copy({'topic_title': 'T'})
    with pytest.raises(thumbnail.CoverError, match='hook is 19 characters \\(max 18\\)'):
        thumbnail.cover_copy({'cover': dict(COVER, hook='x' * 19)})
    with pytest.raises(thumbnail.CoverError, match='pill_serif is missing'):
        thumbnail.cover_copy({'cover': dict(COVER, pill_serif=' ')})
    assert thumbnail.cover_copy({'cover': COVER}, dark=True) == {
        'kicker': COVER['kicker'], 'hook': 'Reverse-engineer', 'pillStrong': 'ANY', 'pillSerif': 'feature', 'dark': True}
    assert thumbnail.COVER_LIMITS == {'kicker': 36, 'hook': 18, 'pill_strong': 8, 'pill_serif': 12}


@needs_ffmpeg
def test_build_without_lesson_cover_fails_clearly_before_any_work(tmp_path, clip):
    job = make_job(tmp_path, clip, cover=None)
    with pytest.raises(thumbnail.CoverError, match='lesson.json has no "cover" object'):
        thumbnail.build(job, render=False, public_dir=tmp_path / 'public')
    assert not (job / 'thumbs').exists() and not (job / 'cover.json').exists()
    assert thumbnail.main(['build', str(job)]) == 1


@needs_ffmpeg
def test_build_without_render_writes_faces_props_and_cover_json(tmp_path, clip):
    job = make_job(tmp_path, clip)
    result = thumbnail.build(job, pick=2, render=False, public_dir=tmp_path / 'public')
    saved = json.loads((job / 'cover.json').read_text())
    assert saved['chosen'] == 2 and len(saved['picks']) == 3 and saved['files'] == {}
    assert saved['take'] == str((job / 'avatar.mp4').resolve()) and result['picks'] == saved['picks']
    for entry in saved['picks']:
        assert thumbnail.probe_image(entry['face'])[:2] == (1440, 2560)
        props = json.loads(Path(entry['props_path']).read_text())
        assert {k: props[k] for k in ('kicker', 'hook', 'pillStrong', 'pillSerif')} == {
            'kicker': COVER['kicker'], 'hook': COVER['hook'], 'pillStrong': 'ANY', 'pillSerif': 'feature'}
        assert set(props) == {'face', 'faceTop', 'faceScale', 'faceShiftX', 'kicker', 'hook', 'pillStrong',
                              'pillSerif', 'dark'}
    assert [('png' in e) for e in saved['picks']] == [False, True, False]   # only the chosen pick renders full size
    assert json.loads((job / 'thumbs' / 'frames.json').read_text())['frames'] == 40
    sheet = json.loads((job / 'thumbs' / 'cover_sheet.json').read_text())
    assert len(sheet['items']) == 3 and '(chosen)' in sheet['items'][1]['label']
    with pytest.raises(thumbnail.CoverError, match='--pick 4'):
        thumbnail.build(job, pick=4, render=False, public_dir=tmp_path / 'public')


# ---------------------------------------------------------------- export

@needs_ffmpeg
def test_jpeg_export_has_exact_size_baseline_srgb_and_stays_under_2mb(tmp_path):
    png = tmp_path / 'cover.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=1080x1920', '-frames:v', '1',
                    str(png)], check=True, timeout=60)
    for name, size in thumbnail.EXPORTS.items():
        out = thumbnail.export_jpeg(png, tmp_path / f'{name}.jpg', size)
        assert (out['width'], out['height']) == size and out['bytes'] <= 2 * 1024 * 1024
        assert thumbnail.is_baseline_jpeg((tmp_path / f'{name}.jpg').read_bytes())
    blue = tmp_path / 'blue.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x2f6bff:s=1080x1920', '-frames:v',
                    '1', str(blue)], check=True, timeout=60)
    thumbnail.export_jpeg(blue, tmp_path / 'blue.jpg', (1080, 1920))
    assert np.abs(rgb(tmp_path / 'blue.jpg')[960, 540].astype(int) - [0x2f, 0x6b, 0xff]).max() <= 6   # colours kept
    first = thumbnail.export_jpeg(png, tmp_path / 'first.jpg', (1080, 1920))
    assert first['quality'] == 2
    small = thumbnail.export_jpeg(png, tmp_path / 'small.jpg', (1080, 1920), max_bytes=first['bytes'] - 1)
    assert small['bytes'] < first['bytes'] and small['quality'] > 2   # quality steps down until it fits
    with pytest.raises(thumbnail.CoverError, match='still over'):
        thumbnail.export_jpeg(png, tmp_path / 'tiny.jpg', (1080, 1920), max_bytes=2_000)


def test_baseline_jpeg_check():
    app0 = b'\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
    assert thumbnail.is_baseline_jpeg(b'\xff\xd8' + app0 + b'\xff\xc0\x00\x11' + b'\x00' * 15)
    assert not thumbnail.is_baseline_jpeg(b'\xff\xd8' + app0 + b'\xff\xc2\x00\x11' + b'\x00' * 15)
    assert not thumbnail.is_baseline_jpeg(b'\x89PNG\r\n\x1a\n')


# ---------------------------------------------------------------- reel hook

def test_reel_build_makes_the_cover_after_final_mp4_and_no_cover_skips_it(tmp_path, monkeypatch):
    from app import audio, edit_plan, reel
    job = tmp_path / 'job'
    job.mkdir()
    (job / 'plan.json').write_text(json.dumps({'take': 'takes/t.mp4', 'templates': []}))
    order = []

    def touch(path, tag=None):
        if tag:
            order.append(tag)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_bytes(b'x')

    monkeypatch.setattr(audio, 'trim_lead_in', lambda src, out: touch(out))
    monkeypatch.setattr(audio, 'enhance_voice', lambda src, out: touch(out))
    monkeypatch.setattr(audio, 'voice_activity', lambda path: [])
    monkeypatch.setattr(audio, 'probe_duration', lambda path: 10.0)
    monkeypatch.setattr(audio, 'make_music', lambda preset, duration_s, out_wav: touch(out_wav))
    monkeypatch.setattr(audio, 'make_sfx', lambda kind, out_wav: touch(out_wav))
    monkeypatch.setattr(audio, 'master', lambda raw, out: touch(out, 'master'))
    monkeypatch.setattr(audio, 'run', lambda cmd: touch(cmd[-1], Path(cmd[-1]).stem))   # the platform exports
    monkeypatch.setattr(audio, 'analyze', lambda path: {})
    monkeypatch.setattr(reel, 'transcribe_words', lambda video, prompt='': [])
    from app import tighten, voice_gates   # the voice quick win runs before the edit; stub it like the rest
    monkeypatch.setattr(tighten, 'tighten', lambda take, out, words, **kw: (touch(out), {
        'fps': 25, 'speed': 1.0, 'sync': None, 'captions': [], 'cuts': [], 'removed_ms': 0})[1])
    monkeypatch.setattr(tighten, 'write_cuts', lambda job, cut: None)
    monkeypatch.setattr(tighten, 'sync_problem', lambda sync, fps, limit: None)
    monkeypatch.setattr(voice_gates, 'check_job', lambda job, strict=False: {'failed': []})
    monkeypatch.setattr(edit_plan, 'snap_onsets', lambda caps, speech: caps)
    monkeypatch.setattr(edit_plan, 'build', lambda *a, **k: {'inserts': [], 'scenes': []})
    monkeypatch.setattr(edit_plan, 'write', lambda job, edit: None)
    monkeypatch.setattr(reel, 'REMOTION', tmp_path / 'remotion')
    monkeypatch.setattr(reel, 'subprocess', SimpleNamespace(run=lambda cmd, **kw: order.append('render')))

    def fake_cover(job_dir):
        order.append('cover')
        assert all((Path(job_dir) / f).exists() for f in ('final.mp4', 'final_ig.mp4', 'final_social.mp4'))
        return {'chosen': 1, 'files': {'cover_1080x1920': {'path': 'c.jpg'}}, 'picks': [{'n': 1, 't': 6.0, 'score': 4.5}]}
    monkeypatch.setattr(thumbnail, 'build', fake_cover)
    result = reel.build(job)
    assert order == ['render', 'master', 'final_ig', 'final_social', 'cover']   # final_social: TikTok, Facebook, X
    assert result['final_social'].endswith('final_social.mp4')
    assert result['cover'] == {'chosen': 1, 'files': {'cover_1080x1920': 'c.jpg'}, 'picks': [{'n': 1, 't': 6.0, 'score': 4.5}]}

    order.clear()
    assert 'cover' not in reel.build(job, cover=False) and 'cover' not in order

    def no_copy(job_dir):
        raise thumbnail.CoverError('lesson.json has no "cover" object')
    monkeypatch.setattr(thumbnail, 'build', no_copy)
    assert reel.build(job)['cover'] == {'error': 'lesson.json has no "cover" object'}   # the render is kept

    def unexpected(job_dir):
        raise OSError('disk full')
    monkeypatch.setattr(thumbnail, 'build', unexpected)
    result = reel.build(job)   # any other failure is reported too, and the reel result still comes back
    assert result['cover'] == {'error': 'OSError: disk full'} and result['final'].endswith('final.mp4')


@needs_ffmpeg
def test_malformed_captions_json_is_a_cover_error(tmp_path, clip):
    job = make_job(tmp_path, clip)
    (job / 'captions.json').write_text('{not json')
    with pytest.raises(thumbnail.CoverError, match='captions.json is not valid JSON'):
        thumbnail.build(job, render=False, public_dir=tmp_path / 'public')


# ---------------------------------------------------------------- real render (Node + Remotion)

@pytest.fixture
def public_test_dir():
    folder = thumbnail.REMOTION / 'public' / f'test-cover-{uuid.uuid4().hex[:8]}'
    yield folder
    shutil.rmtree(folder, ignore_errors=True)


@needs_ffmpeg
@needs_remotion
def test_render_exports_both_covers_and_the_approval_sheet(tmp_path, clip, public_test_dir):
    job = make_job(tmp_path, clip)
    result = thumbnail.build(job, public_dir=public_test_dir)
    files = result['files']
    for name, size in thumbnail.EXPORTS.items():
        path = job / f'{name}.jpg'
        assert files[name]['path'] == str(path) and thumbnail.probe_image(path)[:2] == size
        assert path.stat().st_size <= 2 * 1024 * 1024 and thumbnail.is_baseline_jpeg(path.read_bytes())
    sheet = job / 'thumbs' / 'cover_sheet.png'
    assert files['cover_sheet']['path'] == str(sheet) and thumbnail.probe_image(sheet)[:2] == (1244, 1890)
    assert json.loads((job / 'cover.json').read_text())['files'] == files
    assert result['picks'][0]['props']['face'].startswith(public_test_dir.name + '/')


@needs_ffmpeg
@needs_remotion
def test_long_copy_shrinks_and_stays_inside_the_crop_safe_band(tmp_path):
    face = tmp_path / 'plain.png'   # a featureless light "face" so only the text is dark or blue
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0xe9edf2:s=36x64', '-frames:v', '1',
                    str(face)], check=True, timeout=60)
    base = {'face': 'data:image/png;base64,' + base64.b64encode(face.read_bytes()).decode(), 'faceTop': 467,
            'faceScale': 0.75, 'faceShiftX': 0, 'dark': False}
    jobs = []
    for name, copy in (('long', {'kicker': 'W' * 36, 'hook': 'W' * 18, 'pillStrong': 'W' * 8, 'pillSerif': 'm' * 12}),
                       # overhanging glyphs at both ends: the ink must stay inside the margins and centred
                       ('overhang', {'kicker': 'Open-source REA · MIT licence', 'hook': 'Try Claude Code Ty',
                                     'pillStrong': 'ANY', 'pillSerif': 'feature'})):
        props = tmp_path / f'{name}.json'
        props.write_text(json.dumps({**base, **copy}))
        jobs.append(('Cover', props, tmp_path / f'{name}.png'))
    thumbnail.render_stills(jobs)
    image = rgb(tmp_path / 'long.png').astype(int)
    luma = image @ np.array([0.299, 0.587, 0.114])
    ink = (luma < 100) | (image[..., 2] - image[..., 0] > 150)   # black text/chip or the blue pill
    ys, xs = np.nonzero(ink)
    assert ys.size > 10_000
    assert xs.min() >= thumbnail.SIDE_MARGIN and xs.max() <= 1080 - thumbnail.SIDE_MARGIN
    assert ys.min() >= thumbnail.SAFE_TOP and ys.max() <= thumbnail.SAFE_BOTTOM
    hook = rgb(tmp_path / 'overhang.png').astype(int)[510:654] @ np.array([0.299, 0.587, 0.114])
    hook_xs = np.nonzero(hook < 128)[1]
    left, right = int(hook_xs.min()), 1079 - int(hook_xs.max())
    assert left >= thumbnail.SIDE_MARGIN and right >= thumbnail.SIDE_MARGIN and abs(left - right) <= 8, (left, right)


# ---------------------------------------------------------------- picker units (no ffmpeg)

def face(eyes='open', brow_y=200):
    """A 360x640 analysis frame: skin, brows, and eyes that are open (sclera + iris), closed (lash line) or gone."""
    frame = np.full((640, 360), 150, np.float32)
    frame[brow_y:brow_y + 6, 148:184] = frame[brow_y:brow_y + 6, 188:224] = 20       # brows: horizontal bands
    if eyes in ('open', 'narrow'):
        frame[218:234, 149:181] = frame[218:234, 189:221] = 230                         # sclera
        rows = slice(220, 232) if eyes == 'open' else slice(220, 223)                   # a squint shows less iris
        frame[rows, 161:169] = frame[rows, 201:209] = 15                                # iris
    elif eyes == 'closed':
        frame[225:227, 149:221] = 15                                                     # lash line
    return frame


def test_eyes_open_counts_iris_not_brows_or_a_lash_line():
    box = thumbnail.BOXES['eyes']
    assert thumbnail.eyes_open(face('open'), box) > 20
    assert thumbnail.eyes_open(face('closed'), box) == 0
    assert thumbnail.eyes_open(face('none'), box) == 0
    # the head moves: brows dip into the eye box or the eyes sit lower; the iris is still found
    moved = np.roll(face('open', brow_y=212), 12, axis=0)
    assert thumbnail.eyes_open(moved, box) == thumbnail.eyes_open(face('open'), box)


def test_blink_is_judged_against_the_surrounding_second():
    frames = [face('open') for _ in range(30)]
    frames[7] = face('closed')                     # one blink at 1.4 s
    for i in range(20, 30):                        # a 2 s squint later: a quarter of the iris, but the eyes are open
        frames[i] = face('narrow')
    times = [round(i / 5, 3) for i in range(30)]
    counts = [thumbnail.eyes_open(f, thumbnail.BOXES['eyes']) for f in frames]
    assert counts[25] < thumbnail.BLINK_RATIO * np.median(counts)   # a take-wide median would call the squint a blink
    picked = thumbnail.pick_frames(None, sampled=(np.stack(frames), times))
    assert [r['t'] for r in picked['rows'] if r['blink']] == [1.4]


def test_without_a_pause_or_a_held_smile_only_the_best_frame_is_offered():
    rng = np.random.default_rng(7)
    frames = np.stack([face('open') + rng.normal(0, 4, (640, 360)).astype(np.float32) for _ in range(30)])
    times = [round(i / 5, 3) for i in range(30)]
    picked = thumbnail.pick_frames(None, sampled=(frames, times))   # no captions, no teeth anywhere
    assert len(picked['picks']) == 1 and not any(r.get('at_rest') for r in picked['rows'])


def test_a_stuck_tool_becomes_a_cover_error(monkeypatch):
    def hang(cmd, **kw):
        assert kw['timeout'] == thumbnail.FFMPEG_TIMEOUT_S
        raise subprocess.TimeoutExpired(cmd, kw['timeout'])
    monkeypatch.setattr(thumbnail.subprocess, 'run', hang)
    with pytest.raises(thumbnail.CoverError, match='did not finish in 120 s'):
        thumbnail._run(['ffmpeg', '-i', 'x'])


@needs_ffmpeg
def test_another_take_gets_no_caption_pauses_and_a_warning(tmp_path, clip, capsys):
    job = make_job(tmp_path, clip)
    other = tmp_path / 'raw_take.mp4'
    shutil.copy2(clip, other)
    result = thumbnail.build(job, take=other, render=False, public_dir=tmp_path / 'public')
    assert result['warnings'] == ['caption pauses not used: captions.json is timed to avatar.mp4, not raw_take.mp4']
    rows = json.loads((job / 'thumbs' / 'frames.json').read_text())['rows']
    assert not any(r['pause'] for r in rows)
    assert json.loads((job / 'cover.json').read_text())['warnings'] == result['warnings']
    assert thumbnail.build(job, render=False, public_dir=tmp_path / 'public')['warnings'] == []
