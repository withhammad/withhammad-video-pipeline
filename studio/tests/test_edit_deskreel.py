"""DeskReel (app.edit_deskreel): typewriter timing, text fit, spec validation, the props shape, the camera mirror,
still alignment on synthetic shifted images, the stills cover path and the shared platform exports."""
import json
import shutil
import struct
import subprocess
import zlib
from pathlib import Path

import numpy as np
import pytest

from app import audio, edit_deskreel as dr
from app import exports, thumbnail

HAS_FFMPEG = bool(shutil.which('ffmpeg') and shutil.which('ffprobe'))
needs_ffmpeg = pytest.mark.skipif(not HAS_FFMPEG, reason='ffmpeg not installed')
NODE = shutil.which('node')
needs_node = pytest.mark.skipif(not NODE, reason='node not installed')
TYPES_TS = dr.REMOTION / 'src' / 'deskreel' / 'types.ts'


def write_png(path, gray):
    """A grayscale 8-bit PNG from a 2-D array (stdlib only)."""
    gray = np.clip(gray, 0, 255).astype(np.uint8)
    h, w = gray.shape
    raw = b''.join(b'\x00' + gray[y].tobytes() for y in range(h))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 0, 0, 0, 0))
                           + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b''))
    return Path(path)


def texture(h=640, w=360, seed=0):
    rng = np.random.default_rng(seed)
    t = np.cumsum(np.cumsum(rng.standard_normal((h, w)), 0), 1)
    t -= t.min()
    return (t / t.max() * 255).astype(np.float32)


def text(text_, size=40, font='Archivo Black', **kw):
    return {'text': text_, 'font': font, 'size': size, 'fill': '#FFFFFF', **kw}


@pytest.fixture
def job(tmp_path):
    j = tmp_path / 'job'
    for name in ('a', 'b'):
        write_png(j / 'stills' / f'{name}.png', np.full((2752 // 8, 1536 // 8), 128))
    (j / 'shots').mkdir()
    (j / 'shots' / 'rec.mp4').write_bytes(b'fake')
    (j / 'audio').mkdir()
    (j / 'audio' / 'music.wav').write_bytes(b'fake')
    return j


FACE = {'x': 119, 'y': 104, 'w': 48, 'h': 17}


def spec_ok():
    return {
        'durationMs': 3000,
        'cover_still': 'stills/a.png',
        '_note': 'spec-only keys never reach the props',
        # the head boxes sit right of the overlays (still px of the 192x344 fixture stills); b is aligned onto a's view
        'stills': [{'id': 'a', 'src': 'stills/a.png', 'face': FACE},
                   {'id': 'b', 'src': 'stills/b.png', 'fit': {'scale': 1.02, 'dx': 3}, 'face': FACE,
                    'align': {'ref': 'a', 'score': 0.8, 'residualPx': 1.0, 'ok': True}}],
        'poses': [{'startMs': 0, 'endMs': 1500, 'still': 'a'}, {'startMs': 1500, 'endMs': 3000, 'still': 'b'}],
        'camera': [{'startMs': 0, 'endMs': 1000, 'keys': [{'ms': 0, 'scale': 1.3, 'rot': -5, 'x': -20, 'blurPx': 12},
                                                          {'ms': 170, 'scale': 1.08, 'rot': 0, 'x': 0, 'blurPx': 0, 'ease': 'easeOut'}],
                    'shake': {'ampPx': 10, 'rotDeg': 1, 'decayMs': 100, 'seed': 2}},
                   {'startMs': 1000, 'endMs': 3000, 'keys': [{'ms': 1000, 'scale': 1.05}, {'ms': 2000, 'scale': 1.07, 'y': 20, 'ease': 'easeInOut'}]}],
        'overlays': [
            {'type': 'text', 'startMs': 0, 'endMs': 1000, 'x': 5, 'y': 15, 'w': 90,
             'lines': [text('6 weeks plan', 58, stroke={'px': 3, 'color': '#000'})]},
            {'type': 'chip', 'startMs': 167, 'endMs': 1000, 'x': 14, 'y': 57, 'w': 32, 'h': 10, 'text': 'Acme AI', 'size': 40},
            {'type': 'text', 'startMs': 1000, 'endMs': 2500, 'x': 5, 'y': 22, 'w': 90,
             'lines': [text('AI startup', 70, font='Titan One')],
             'appear': {'mode': 'typewriter', 'startMs': 1033, 'msPerChar': 40}, 'fadeOut': {'startMs': 2300, 'endMs': 2500}},
            {'type': 'inset', 'startMs': 1000, 'endMs': 2500, 'x': 14.4, 'y': 50, 'w': 71.1,
             'source': {'src': 'shots/rec.mp4', 'hold': True}, 'swaps': [{'atMs': 1300, 'src': 'shots/rec.mp4', 'startFromMs': 500}]},
            {'type': 'statcard', 'startMs': 1200, 'endMs': 2500, 'x': 15, 'y': 36, 'w': 42, 'headline': 'One in four\nis a placeholder',
             'source': 'Source: test', 'align': 'left'},
            {'type': 'image', 'startMs': 2500, 'endMs': 3000, 'x': 30, 'y': 60, 'w': 40, 'h': 20, 'src': 'stills/a.png'},
        ],
        'music': {'src': 'audio/music.wav', 'volume': 0.9},
        'sfx': [{'src': 'audio/music.wav', 'atMs': 167, 'volume': 0.2}],
        'grade': {'grain': 0.3, 'vignette': 0.4, 'warmth': 0.1},
    }


# ----------------------------------------------------------------------------------------------- typewriter

def test_typewriter_times_give_a_space_the_next_characters_time():
    times = dr.typewriter_times(['AI startup'], 33, 40)
    assert len(times) == len('AI startup')
    assert times[:4] == [33, 73, 113, 113]      # "A", "AI", then " s" together (the reference's "AI s" frame)
    assert times[-1] == 33 + 8 * 40
    assert all(b >= a for a, b in zip(times, times[1:]))


def test_typewriter_reveals_in_place_line_by_line():
    lines = ['Week', 'Two']
    times = dr.typewriter_times(lines, 1000, 100)    # 7 characters, one every 100 ms (3 frames)
    assert dr.visible_text(lines, times, dr.to_frame(960)) == ['', '']        # frame 29; the W lands on frame 30
    assert dr.visible_text(lines, times, dr.to_frame(1000)) == ['W', '']
    assert dr.visible_text(lines, times, dr.to_frame(1350)) == ['Week', '']
    assert dr.visible_text(lines, times, dr.to_frame(1400)) == ['Week', 'T']
    assert dr.visible_text(lines, times, dr.to_frame(5000)) == ['Week', 'Two']


def test_to_frame_matches_javascript_math_round():
    assert dr.to_frame(50) == 2          # 1.5 frames rounds up like Math.round
    assert dr.to_frame(216.6667) == 7    # 6.5 -> 7 in JS, 6 with Python's round()
    # camera.ts computes Math.round((ms / 1000) * 30): these land on 61.4999.. / 253.4999.. there, not on .5
    assert [dr.to_frame(ms) for ms in (2050, 8450, 16150, 16650)] == [61, 253, 484, 499]
    assert dr.js_round(0.49999999999999994) == 0 and dr.js_round(-0.5) == 0 and dr.js_round(2.5) == 3


@needs_node
def test_to_frame_agrees_with_node_over_20_seconds():
    script = 'const o=[];for(let i=0;i<=200000;i++){o.push(Math.round(((i/10)/1000)*30));}process.stdout.write(o.join(","))'
    js = [int(v) for v in subprocess.run([NODE, '-e', script], capture_output=True, text=True, check=True).stdout.split(',')]
    py = [dr.to_frame(i / 10) for i in range(200001)]
    assert py == js


# ----------------------------------------------------------------------------------------------- text fit

def test_text_width_uses_the_real_fonts_and_counts_the_outline():
    w = dr.text_width('6 weeks plan', 'Archivo Black', 58)
    assert 380 < w < 450            # measured on the smoke render: 418 px with a 3 px outline
    assert dr.text_width('6 weeks plan', 'Archivo Black', 58, stroke_px=3) == pytest.approx(w + 6)
    assert dr.text_width('iiii', 'Inter', 40, weight=800) < dr.text_width('WWWW', 'Inter', 40, weight=800)
    assert dr.text_width('🔥', 'Inter', 20, weight=800) == pytest.approx(20 * dr.EMOJI_EM)
    with pytest.raises(KeyError):
        dr.text_width('x', 'Comic Sans', 20)


# ----------------------------------------------------------------------------------------------- validation

def test_valid_spec_passes(job):
    errors, warnings = dr.validate(spec_ok(), job)
    assert errors == [] and warnings == []


@pytest.mark.parametrize('mutate, expected', [
    (lambda s: s['overlays'].insert(0, s['overlays'].pop(2)), 'sorted by startMs'),
    (lambda s: s['poses'][1].update(startMs=1600), 'without gaps'),
    (lambda s: s['poses'][1].update(endMs=2800), 'the last pose ends at frame'),
    (lambda s: s['poses'][1].update(still='zzz'), 'not in stills'),
    (lambda s: s['stills'][0].update(src='stills/missing.png'), 'not found'),
    (lambda s: s['camera'][0]['keys'].append({'ms': 1500}), 'outside the shot'),
    (lambda s: s['camera'][0]['keys'][0].update(scale=1.0), 'uncovers a frame corner'),
    (lambda s: s['camera'][1].update(startMs=900), 'overlaps the previous shot'),
    (lambda s: s['overlays'][0]['lines'][0].update(size=90), 'its box is 648 px'),
    (lambda s: s['overlays'][0]['lines'][0].update(font='Comic Sans'), 'is not loaded'),
    (lambda s: s['overlays'][1].update(text='A very long wordmark'), 'Acme' and 'overflow'),
    (lambda s: s['overlays'][2].update(appear={'mode': 'typewriter', 'charTimesMs': [1033, 1073]}), '2 times for 10 characters'),
    (lambda s: s['overlays'][2].update(fadeOut={'startMs': 2400, 'endMs': 2600}), 'fadeOut must sit inside'),
    (lambda s: s['overlays'][3]['swaps'][0].update(atMs=2600), 'inside the inset window'),
    (lambda s: s['overlays'][3].update(y=90), 'leaves the frame'),
    (lambda s: s['overlays'][4].update(headline='A headline far too long for this narrow card'), 'headline'),
    (lambda s: s['overlays'][0].update(endMs=3500), 'outside the reel'),
    (lambda s: s['music'].update(src='audio/none.wav'), 'music'),
    (lambda s: s['grade'].update(grain=2), 'grade.grain'),
])
def test_validation_catches(job, mutate, expected):
    spec = spec_ok()
    mutate(spec)
    errors, _ = dr.validate(spec, job)
    assert any(expected in e for e in errors), errors


def test_unfinished_typing_is_a_warning_not_an_error(job):
    spec = spec_ok()
    spec['overlays'][2]['appear']['msPerChar'] = 400     # 10 characters need 3.6 s, the overlay is up 1.5 s
    errors, warnings = dr.validate(spec, job)
    assert errors == [] and any('not finished' in w for w in warnings)


def test_shake_margin_decays():
    shake = {'ampPx': 20, 'decayMs': 100}
    assert dr.shake_envelope(shake, 0, 0) == 1.0
    assert dr.shake_envelope(shake, 300, 0) == pytest.approx(np.exp(-3))
    assert dr.shake_envelope(shake, -10, 0) == 0.0
    assert dr.shake_envelope(None, 50, 0) == 0.0


# ----------------------------------------------------------------------------------------------- camera mirror

def test_camera_eases_and_holds():
    shot = {'startMs': 0, 'endMs': 1000, 'keys': [{'ms': 0, 'x': 0, 'scale': 1.0}, {'ms': 500, 'x': 100, 'ease': 'linear'},
                                                   {'ms': 800, 'x': 0, 'ease': 'hold'}]}
    assert dr.camera_at(shot, 250)['x'] == pytest.approx(50)
    assert dr.camera_at(shot, 700)['x'] == pytest.approx(100)     # "hold" keeps the previous value until its key
    assert dr.camera_at(shot, 800)['x'] == pytest.approx(0)
    assert dr.camera_at(shot, 250)['scale'] == pytest.approx(1.0)   # a missing field carries over
    assert dr.ease('easeOut', 0.5) > 0.5 > dr.ease('easeIn', 0.5)
    assert dr.ease([0.42, 0, 0.58, 1], 0.5) == pytest.approx(0.5, abs=1e-6)


def test_coverage_needs_scale_for_a_roll():
    size = (1536, 2752)
    ident = {'x': 0, 'y': 0, 'scale': 1.0, 'rot': 0}
    assert dr.uncovered({}, ident, size) <= 0
    assert dr.uncovered({}, {**ident, 'rot': 5}, size) > 0
    assert dr.uncovered({}, {**ident, 'rot': 5, 'scale': 1.2}, size) <= 0
    assert dr.uncovered({}, ident, size, margin_px=5) > 0          # a shake needs slack too


# ----------------------------------------------------------------------------------------------- props shape

def test_props_shape(job, tmp_path):
    public = tmp_path / 'public'
    props = dr.build_props(spec_ok(), job, public=public, probe=lambda path: 4321)
    assert set(props) <= set(dr.PROPS_KEYS) and 'cover_still' not in props and '_note' not in props
    for s in props['stills']:
        assert s['src'].startswith('job/deskreel/') and (public / s['src']).is_file()
    assert props['stills'][1]['fit'] == {'scale': 1.02, 'dx': 3}
    typed = props['overlays'][2]['appear']
    assert typed['mode'] == 'typewriter' and len(typed['charTimesMs']) == len('AI startup') and typed['charTimesMs'][0] == 1033
    inset = props['overlays'][3]
    assert inset['source']['durationMs'] == 4321 and inset['source']['hold'] is True
    assert inset['swaps'][0]['src'] == inset['source']['src'] and inset['swaps'][0]['startFromMs'] == 500
    assert props['music']['src'].startswith('job/deskreel/') and props['sfx'][0]['src'] == props['music']['src']
    json.dumps(props)     # plain JSON for --props


def test_props_field_names_match_types_ts():
    ts = TYPES_TS.read_text()
    for field in ('durationMs', 'stills', 'poses', 'camera', 'overlays', 'music', 'sfx', 'grade', 'allowMissingAudio',
                  'charTimesMs', 'fadeOut', 'startFromMs', 'swaps', 'hold', 'durationMs', 'headline', 'dek', 'source',
                  'blurPx', 'blurAxis', 'ampPx', 'rotDeg', 'decayMs', 'softShadow', 'letterSpacing', 'focusY'):
        assert f'{field}?:' in ts or f'{field}:' in ts, field
    for kind in dr.OVERLAY_TYPES:
        assert f'type: "{kind}"' in ts
    for name in dr.EASES:
        assert f'"{name}"' in ts


def test_fonts_in_metrics_are_vendored_with_licences():
    fonts = dr.REMOTION / 'public' / 'fonts'
    for name in ('archivo-black-latin-400-normal', 'titan-one-latin-400-normal', 'comfortaa-latin-400-normal',
                 'comfortaa-latin-700-normal', 'source-serif-4-latin-700-normal', 'source-serif-4-latin-700-italic',
                 'lilita-one-latin-400-normal', 'noto-color-emoji-400-normal'):
        assert (fonts / f'{name}.woff2').is_file()
    for lic in ('OFL-ArchivoBlack.txt', 'OFL-TitanOne.txt', 'OFL-Comfortaa.txt', 'OFL-SourceSerif4.txt',
                'OFL-LilitaOne.txt', 'OFL-NotoColorEmoji.txt'):
        assert 'SIL Open Font License' in (fonts / lic).read_text()
    # each licence names the font's real copyright holder (Source Serif 4 is Adobe's, not Google's)
    assert (fonts / 'OFL-SourceSerif4.txt').read_text().startswith('Copyright 2014 - 2021 Adobe Systems Incorporated')
    loaded = (dr.REMOTION / 'src' / 'deskreel' / 'fonts.ts').read_text() + (dr.REMOTION / 'src' / 'fonts.ts').read_text()
    for key in dr.FONTS:
        assert f'"{key.split("|")[0]}"' in loaded, key
    assert dr.EMOJI_FONT['family'] == 'Noto Color Emoji' and 'EMOJI_FAMILY = "Noto Color Emoji"' in loaded
    assert 'Apple Color Emoji' not in loaded


def test_build_writes_props_and_refuses_a_bad_spec(job, tmp_path):
    (job / 'deskreel.json').write_text(json.dumps(spec_ok()))
    assert dr.main(['check', str(job)]) == 0
    summary = dr.build(job, public=tmp_path / 'public', probe=lambda path: 1000)
    props = json.loads((job / 'edit_deskreel.props.json').read_text())
    assert summary['overlays'] == len(props['overlays']) == 6 and props['durationMs'] == 3000
    bad = spec_ok()
    bad['poses'][1]['startMs'] = 1700
    (job / 'deskreel.json').write_text(json.dumps(bad))
    with pytest.raises(dr.DeskReelError, match='without gaps'):
        dr.build(job, public=tmp_path / 'public')
    assert dr.main(['check', str(job)]) == 1


# ----------------------------------------------------------------------------------------------- alignment

def test_estimate_fit_recovers_a_synthetic_shift_scale_and_roll():
    # mov(q) = ref(d + s R q): the fit F(q) = d + s R q lays mov back onto ref
    ref, mov = shifted_pair((6.0, -4.0), seed=0, scale=1.05, rot=0.8)
    est = dr.estimate_fit(ref, mov)
    assert est['scale'] == pytest.approx(1.05, abs=0.006)
    assert est['rot'] == pytest.approx(0.8, abs=0.3)
    assert est['dx'] == pytest.approx(6.0, abs=0.5) and est['dy'] == pytest.approx(-4.0, abs=0.5)
    assert est['score'] > 0.9


def shifted_pair(d, seed, scale=1.0, rot=0.0, h=320, w=180, pad=24):
    """ref and mov(q) = ref(d + s R q), both cropped from larger frames so neither has a black border (a real
    still never does, and a border's edge would be matched instead of the picture)."""
    big = texture(h + 2 * pad, w + 2 * pad, seed=seed)
    mov, _ = dr.warp_affine(big, dr.similarity(scale, rot), d)
    return big[pad:pad + h, pad:pad + w].copy(), mov[pad:pad + h, pad:pad + w].copy()


def test_estimate_fit_ignores_a_moving_presenter():
    ref, mov = shifted_pair((-8.0, 5.0), seed=1)
    rng = np.random.default_rng(5)
    mov[60:320, 50:130] = rng.random((260, 80)) * 255     # a "presenter" in a new pose, inside the exclude box
    est = dr.estimate_fit(ref, mov)
    assert est['dx'] == pytest.approx(-8.0, abs=0.7) and est['dy'] == pytest.approx(5.0, abs=0.7)


def test_masked_ncc_does_not_prefer_zero_shift():
    ref = texture(160, 90, seed=2)
    mov = np.roll(ref, (7, -5), (0, 1))     # mov(p) = ref(p - (-5, 7))  ->  ref(p) = mov(p + (-5, 7))
    mask = np.ones(ref.shape, bool)
    mask[:, 30:60] = False
    (dx, dy), peak = dr.masked_ncc(ref, mask, mov, np.ones(ref.shape, bool))
    assert (round(dx), round(dy)) == (5, -7) and peak > 0.9


def test_compose_and_cover_safe():
    assert dr.compose_fit({}, {'scale': 1.1, 'dx': 4, 'dy': -2, 'rot': 1}) == pytest.approx(
        {'scale': 1.1, 'dx': 4, 'dy': -2, 'rot': 1})
    outer = {'scale': 2.0, 'dx': 10, 'dy': 0, 'rot': 0}
    assert dr.compose_fit(outer, {'dx': 5, 'dy': 0})['dx'] == pytest.approx(20)
    fit, raised = dr.cover_safe({'scale': 0.95, 'dx': 20, 'dy': 0, 'rot': 0}, (1536, 2752))
    assert raised and fit['scale'] > 1.0 and dr.uncovered(fit, {'x': 0, 'y': 0, 'scale': 1, 'rot': 0}, (1536, 2752)) <= 1e-6
    same, raised = dr.cover_safe({'scale': 1.1, 'dx': 0, 'dy': 0, 'rot': 0}, (1536, 2752))
    assert not raised and same['scale'] == 1.1


@needs_ffmpeg
def test_align_writes_fits_into_the_spec(tmp_path):
    j = tmp_path / 'job'
    big = texture(1280, 720, seed=3)
    write_png(j / 'stills' / 'ref.png', big)
    moved, _ = dr.warp_affine(big, dr.similarity(1.0, 0.0), (-24.0, 16.0))   # the pose still sits 24/16 px off
    write_png(j / 'stills' / 'pose.png', moved)
    spec = {'durationMs': 1000, 'stills': [{'id': 'ref', 'src': 'stills/ref.png'}, {'id': 'pose', 'src': 'stills/pose.png'}]}
    (j / 'deskreel.json').write_text(json.dumps(spec))
    result = dr.align(j, 'ref', ['pose'], exclude=None, region=(0, 0, 1, 1), cover=True)
    fit = json.loads((j / 'deskreel.json').read_text())['stills'][1]['fit']
    assert fit == {k: result['pose'][k] for k in ('scale', 'dx', 'dy', 'rot')}
    # laid out by the fit, the pose's content lands back on the reference: F(q) = q + (-24, 16) undone
    assert fit['dx'] == pytest.approx(-24, abs=3) and fit['dy'] == pytest.approx(16, abs=3)
    assert fit['scale'] >= 1.0      # raised by cover_safe so the shifted still never shows black edges


# ----------------------------------------------------------------------------------------------- cover + exports

@needs_ffmpeg
def test_cover_from_stills_without_a_take(tmp_path):
    j = tmp_path / 'job'
    img = np.full((2752 // 4, 1536 // 4), 225.0)
    img[150:260, 150:240] = 30           # dark "hair" against a light wall
    write_png(j / 'stills' / 'raw_2.png', img)
    cover = {'kicker': 'Smoke test', 'hook': 'Desk reel', 'pill_strong': 'STILLS', 'pill_serif': 'smoke'}
    (j / 'deskreel.json').write_text(json.dumps({'cover_still': 'stills/raw_2.png', 'cover': cover}))
    result = thumbnail.build(j, render=False, public_dir=tmp_path / 'pub')
    assert result['stills'] == [str((j / 'stills' / 'raw_2.png').resolve())]
    assert result['picks'][0]['still'].endswith('raw_2.png') and 't' not in result['picks'][0]
    assert (tmp_path / 'pub' / 'cover_face_1.png').is_file()
    assert result['copy']['hook'] == 'Desk reel'
    assert thumbnail.probe_image(tmp_path / 'pub' / 'cover_face_1.png')[:2] == (thumbnail.FACE_W, thumbnail.FACE_H)
    with pytest.raises(thumbnail.CoverError, match='not available'):
        thumbnail.build(j, render=False, public_dir=tmp_path / 'pub', pick=2)
    with pytest.raises(thumbnail.CoverError, match='cover still not found'):
        thumbnail.build(j, render=False, public_dir=tmp_path / 'pub', stills=['stills/none.png'])


def test_platform_exports_use_the_shared_flags(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(exports.audio, 'run', lambda cmd: calls.append(cmd))
    out = exports.platform_exports(tmp_path / 'final.mp4')
    assert out == {'final_ig': str(tmp_path / 'final_ig.mp4'), 'final_social': str(tmp_path / 'final_social.mp4')}
    ig, social = calls
    for cmd in (ig, social):
        joined = ' '.join(cmd)
        assert '-bf 0' in joined and '-b:a 128k' in joined and '-ar 48000' in joined
        assert '-movflags +faststart' in joined and '-use_editlist 0' in joined
    assert '-crf 17' in ' '.join(ig)
    assert '-b:v 1250k -maxrate 1800k -bufsize 3600k' in ' '.join(social)



# ----------------------------------------------------------------------------------------------- review fixes

GRAPHEME_CASES = ['AI startup', '🔥hottest job', 'ok 👍🏽 done', '👨‍💻 dev', '🇦🇪 UAE', 'café', '1️⃣ step', 'é x',
                  '🏳️‍🌈', 'a‍b']


@needs_node
def test_graphemes_match_intl_segmenter():
    script = ('const s=new Intl.Segmenter(undefined,{granularity:"grapheme"});'
              'const cases=JSON.parse(process.argv[1]);'
              'process.stdout.write(JSON.stringify(cases.map(c=>Array.from(s.segment(c),x=>x.segment))))')
    js = json.loads(subprocess.run([NODE, '-e', script, json.dumps(GRAPHEME_CASES)], capture_output=True, text=True,
                                   check=True).stdout)
    assert [dr.graphemes(c) for c in GRAPHEME_CASES] == js


def test_typewriter_counts_an_emoji_as_one_character():
    lines = ['🔥hottest job']
    times = dr.typewriter_times(lines, 0, 100)
    assert len(times) == dr.char_count(lines) == 12          # 13 UTF-16 units in JS, 12 graphemes
    assert dr.visible_text(lines, times, 0) == ['🔥']         # never half a surrogate pair
    assert dr.visible_text(lines, times, dr.to_frame(times[-1])) == lines   # the last letter does appear
    sk = dr.typewriter_times(['👍🏽ok'], 0, 100)
    assert len(sk) == 3 and dr.visible_text(['👍🏽ok'], sk, 0) == ['👍🏽']


def test_trailing_space_gets_the_last_time_and_validates(job):
    assert dr.typewriter_times(['Hello '], 100, 40) == [100, 140, 180, 220, 260, 260]
    spec = spec_ok()
    spec['overlays'][2]['lines'][0]['text'] = 'AI startup '
    errors, _ = dr.validate(spec, job)
    assert errors == []


def test_fade_shorter_than_a_frame_is_refused(job):
    spec = spec_ok()
    spec['overlays'][2]['fadeOut'] = {'startMs': 2400, 'endMs': 2410}     # both ends on frame 72
    errors, _ = dr.validate(spec, job)
    assert any('shorter than one frame' in e and 'fadeOut' in e for e in errors), errors


def test_pose_gap_at_a_js_rounding_edge_is_caught(job):
    spec = spec_ok()
    spec['poses'] = [{'startMs': 0, 'endMs': 2050, 'still': 'a'}, {'startMs': 2060, 'endMs': 3000, 'still': 'b'}]
    errors, _ = dr.validate(spec, job)
    assert any('without gaps' in e for e in errors), errors   # frame 61 would render black


def test_frames_outside_every_shot_are_checked_with_the_identity_camera(job):
    spec = spec_ok()
    spec['camera'] = spec['camera'][:1]                       # nothing holds 1000-3000 ms
    spec['stills'][1]['fit'] = {'dx': 30}
    errors, _ = dr.validate(spec, job)
    assert any('no shot holds this frame' in e for e in errors), errors
    spec['camera'] = []
    spec['stills'][1]['fit'] = {'scale': 0.9}
    errors, _ = dr.validate(spec, job)
    assert any('identity camera' in e for e in errors), errors


def test_overlay_over_the_head_is_refused_and_a_missing_face_warns(job):
    spec = spec_ok()
    spec['overlays'][1].update(x=60, y=29, w=30, h=6)         # the chip onto the head box (62-87 %, ~30-35 %)
    errors, _ = dr.validate(spec, job)
    assert any("covers the presenter's head" in e and 'chip' in e for e in errors), errors
    spec = spec_ok()
    del spec['stills'][0]['face']
    errors, warnings = dr.validate(spec, job)
    assert errors == [] and any('no "face" box' in w for w in warnings)


def test_face_rect_follows_the_cover_fit_and_the_camera():
    size = (1536, 2752)
    face = {'x': 0, 'y': 0, 'w': 1536, 'h': 2752}           # the whole still: the cover-fitted picture
    x0, y0, x1, y1 = dr.face_rect(face, size, {}, dr.IDENTITY_CAM)
    assert (x0, x1) == pytest.approx((0, 720)) and (y0 + y1) / 2 == pytest.approx(640)
    zoomed = dr.face_rect({'x': 768, 'y': 1376, 'w': 0, 'h': 0}, size, {}, {**dr.IDENTITY_CAM, 'scale': 2.0, 'y': 50})
    assert zoomed[:2] == pytest.approx((360, 690))            # the centre stays put under a zoom, then moves by y


def test_glyphs_no_vendored_font_draws_are_refused(job):
    spec = spec_ok()
    spec['overlays'][0]['lines'][0]['text'] = '6 weeks → plan'
    errors, _ = dr.validate(spec, job)
    assert any('U+2192' in e for e in errors), errors
    spec['overlays'][0]['lines'][0]['text'] = '6 weeks 🔥 plan'     # Noto Color Emoji draws this
    errors, _ = dr.validate(spec, job)
    assert errors == []
    assert dr.missing_glyphs('➡ ok', 'Inter', 800) == [] and dr.missing_glyphs('a→b', 'Inter', 800) == ['→']


def test_swaps_between_views_warn_unless_aligned_cut_or_blurred(job):
    spec = spec_ok()
    del spec['stills'][1]['align']                            # b no longer shares a's view
    spec['camera'] = [{'startMs': 0, 'endMs': 3000, 'keys': [{'ms': 0, 'scale': 1.08}]}]
    _, warnings = dr.validate(spec, job)
    assert any('a -> b at 1500 ms' in w for w in warnings), warnings
    spec['camera'][0]['keys'] += [{'ms': 1467, 'blurPx': 0}, {'ms': 1500, 'blurPx': 12, 'blurAxis': 'x'},
                                  {'ms': 1567, 'blurPx': 0}]
    _, warnings = dr.validate(spec, job)
    assert not any('->' in w for w in warnings), warnings    # hidden under the whip
    spec = spec_ok()
    del spec['stills'][1]['align']
    spec['camera'] = [{'startMs': 0, 'endMs': 1500, 'keys': [{'ms': 0, 'scale': 1.08}]},
                      {'startMs': 1500, 'endMs': 3000, 'keys': [{'ms': 1500, 'scale': 1.08}]}]
    _, warnings = dr.validate(spec, job)
    assert not any('->' in w for w in warnings), warnings    # a hard cut may change the view
    spec['stills'][1]['align'] = {'ref': 'a', 'ok': False}
    assert dr.plate_of({s['id']: s for s in spec['stills']}, 'b') == 'b'


def test_blur_axis_is_checked(job):
    spec = spec_ok()
    spec['camera'][0]['keys'][0]['blurAxis'] = 'motion'
    assert dr.validate(spec, job)[0] == []
    spec['camera'][0]['keys'][0]['blurAxis'] = 'diagonal'
    assert any('blurAxis' in e for e in dr.validate(spec, job)[0])


def test_spec_only_still_keys_never_reach_the_props(job, tmp_path):
    props = dr.build_props(spec_ok(), job, public=tmp_path / 'public', probe=lambda path: 1000)
    assert all('face' not in s and 'align' not in s for s in props['stills'])


def test_background_residual_tells_a_plate_from_parallax():
    ref, mov = shifted_pair((5.0, -3.0), seed=4)
    est = dr.estimate_fit(ref, mov)
    assert est['residual'] is not None and est['residual'] < 0.6       # one static plate: nothing left
    # parallax: the top band (the far wall) moved 6 px more than the rest after the same camera move
    ref2, mov2 = shifted_pair((5.0, -3.0), seed=6)
    big = texture(320 + 48, 180 + 48, seed=6)
    far, _ = dr.warp_affine(big, dr.similarity(1.0, 0.0), (11.0, -3.0))
    mov2[:110] = far[24:134, 24:204]
    est2 = dr.estimate_fit(ref2, mov2)
    assert est2['residual'] is not None and est2['residual'] > 1.0      # > 4 frame px: flagged by align


def test_render_enforces_an_audio_track(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(dr.subprocess, 'run', lambda cmd, **kw: calls.append(cmd))
    monkeypatch.setattr(audio, 'master', lambda raw, out: {'output': {'lufs': -14.0}})
    out = dr.render(tmp_path, props_path=tmp_path / 'p.json', out=tmp_path / 'other.mp4')
    assert '--enforce-audio-track' in calls[0] and out['files'] == {'final': str(tmp_path / 'other.mp4')}


@needs_ffmpeg
def test_master_keeps_a_silent_track_instead_of_failing(tmp_path):
    raw = tmp_path / 'raw.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=0.5:r=30', '-f', 'lavfi',
                    '-i', 'anullsrc=r=48000:cl=stereo', '-t', '0.5', '-c:v', 'libx264', '-c:a', 'aac', '-shortest',
                    str(raw)], check=True)
    stats = audio.master(str(raw), str(tmp_path / 'final.mp4'))
    assert stats['normalization_type'] == 'silent' and (tmp_path / 'final.mp4').is_file()


def test_statcard_defaults_match_overlays_tsx():
    tsx = (dr.REMOTION / 'src' / 'deskreel' / 'Overlays.tsx').read_text()
    for key in ('headlineSize', 'dekSize', 'sourceSize', 'padding'):
        assert f'{key}: {dr.STATCARD[key]:g}' in tsx, key
    assert dr.STATCARD['sourceSize'] >= 14 and dr.STATCARD['dekSize'] >= 14


def test_still_paths_resolve_from_the_job_or_the_current_directory(tmp_path, monkeypatch):
    job = tmp_path / 'job'
    write_png(job / 'stills' / 'x.png', np.full((8, 8), 100))
    monkeypatch.chdir(tmp_path)
    assert thumbnail._still_path(job, 'stills/x.png') == job / 'stills' / 'x.png'
    assert thumbnail._still_path(job, 'job/stills/x.png') == (job / 'stills' / 'x.png').resolve()
    assert thumbnail._still_path(job, 'none.png') == job / 'none.png'     # reported as not found by cover_stills
