"""Theme "seam" of the Explainer: the news split-screen format (job 91ac50635d3d) built from a units spec."""
import json
from pathlib import Path

import pytest

from app import edit_explainer as ex

STUDIO = Path(__file__).resolve().parents[1]

SSPEC = {
    'job': 's', 'theme': 'seam', 'keyword': 'PITCH',
    'heygen': {'take_A': {'face_box': [0.32, 0.145, 0.41, 0.33]}},
    'beats': [
        {'name': 'hook', 'ref_window_s': [0.0, 2.2], 'line': 'Got a media idea? The UAE could fund it!', 'captions': [],
         'units': [{'id': 'S1', 't': [0.0, 2.2], 'screenrec': 'R1', 'use': '0.0-2.0 s',
                    'overlays': [{'kind': 'hook', 'box': '$10,000 FOR 100 IDEAS', 'bar': 'Got A Media Idea? The UAE Could Fund It'}]}]},
        {'name': 'value', 'ref_window_s': [2.2, 9.4], 'line': 'Get picked and you get ten thousand dollars and six weeks with the team.',
         'captions': ['GET PICKED', 'AND YOU GET', '$10,000', 'AND SIX WEEKS', 'WITH THE TEAM'], 'emphasis': ['$10,000', 'AND SIX WEEKS'],
         'units': [
             {'id': 'S2', 't': [2.2, 3.3], 'screenrec': 'R1', 'anchor': 'Get', 'use': '2.0-3.0 s'},
             {'id': 'S3', 't': [3.3, 5.1], 'screenrec': 'R1', 'anchor': 'ten', 'use': '3.0-4.0 s',
              'overlays': [{'kind': 'count', 'to': 10000, 'prefix': '$', 'steps': [4000, 8500], 'at': 'ten', 'land': 'dollars',
                            'pill': 'Each · if selected'}]},
             {'id': 'S4', 't': [5.1, 9.4], 'screenrec': 'R1', 'anchor': {'word': 'and', 'occurrence': 1}, 'use': '4.0-6.0 s',
              'overlays': [{'kind': 'pill', 'text': '6-week kickstart', 'at': 'six'},
                           {'kind': 'pill', 'text': 'Simon Squibb · Dream team', 'at': 'team'},
                           {'kind': 'pill', 'text': 'never said', 'at': 'banana'}]},
         ]},
        {'name': 'proof', 'ref_window_s': [9.4, 12.5], 'line': "It's called 100 Dreams, a $1 million programme.",
         'captions': ["IT'S CALLED", '100 DREAMS', 'A $1 MILLION', 'PROGRAMME'], 'emphasis': ['100 DREAMS', 'A $1 MILLION'],
         'units': [{'id': 'S5', 't': [9.4, 12.5], 'layout': 'B', 'screenrec': 'R3', 'use': '0.0-3.0 s',
                    'overlays': [{'kind': 'marker', 'highlight': 1, 'at': '$1'}, {'kind': 'marker', 'highlight': 2},
                                 {'kind': 'ellipse', 'box_px': [108, 540, 540, 108], 'at': 'programme'}]}]},
        {'name': 'twist', 'ref_window_s': [12.5, 15.4], 'line': "Best part, it's open worldwide.", 'emphasis': ['worldwide'],
         'units': [{'id': 'S6', 't': [12.5, 15.4], 'screenrec': 'R1', 'use': '6.0-8.0 s',
                    'overlays': [{'kind': 'punch', 'at': 'Best'}, {'kind': 'pill', 'text': 'Worldwide · 18+', 'at': 'worldwide'},
                                 {'kind': 'ripple', 'point_px': [540, 420], 'at_rec_ms': 6500}]}]},
        {'name': 'cta', 'ref_window_s': [15.4, 18.0], 'line': "Comment PITCH and I'll send you the link!",
         'units': [{'id': 'S7', 't': [15.4, 18.0], 'screenrec': 'R1', 'plate': {'still_ms': 1500},
                    'overlays': [{'kind': 'cta', 'at': 'PITCH', 'strip': 'Get the official link',
                                  'fine': 'Apply only on the official site'}]}]},
    ],
}
PLANS = {
    'R1': {'actions': [{'wait': 500}, {'highlight': {'selector': 'a', 'ms': 1100}}, {'wait': 6000}]},
    'R3': {'actions': [{'wait': 400}, {'highlight': {'selector': 'h1', 'ms': 900}}, {'highlight': {'selector': 'p', 'ms': 1200}}, {'wait': 600}]},
}
DURATIONS = {'R1': 8400, 'R3': 5800}
SIZES = {'R1': (1080, 840), 'R3': (1080, 1080)}
MEASURED = {'R3': [{'startMs': 700, 'endMs': 1600, 'box': [0.1, 0.3, 0.6, 0.1]}, {'startMs': 1800, 'endMs': 3000}]}
HSPEC_MIN = {'job': 'h', 'theme': 'harvest', 'keyword': 'HARVEST', 'beats': [
    {'name': 'hook', 'ref_window': [0.0, 3.8], 'line': 'Astra can now wake up every morning!', 'on_screen_text': 'ASTRA | CAN NOW WAKE UP',
     'units': [{'id': 'U1', 't': [0.0, 1.5], 'type': 'avatar + recording', 'screenrec': 'R1', 'layout': 'B', 'use': 'R1 0.0-2.4 s'},
               {'id': 'U2', 't': [1.5, 3.8], 'type': 'avatar full-frame', 'anchor': 'wake'}]}]}
DETECTED = {'R3': [{'startMs': 400, 'endMs': 1560, 'box': [0.1, 0.3, 0.6, 0.1]}, {'startMs': 1560, 'endMs': 3020, 'box': [0.05, 0.6, 0.8, 0.2]}]}


def make_caps(spec=SSPEC, step=220):
    words = ' '.join(b['line'] for b in spec['beats']).split()
    caps, t = [], 100
    for w in words:
        caps.append({'text': (' ' if caps else '') + w, 'startMs': t, 'endMs': t + step - 20, 'timestampMs': t, 'confidence': 1})
        t += step
        if w[-1] in '.!?':
            t += 400
        elif w[-1] in ',:':
            t += 150
    return caps


def start_of(caps, word, occurrence=1):
    hits = [c['startMs'] for c in caps if ex.clean(c['text']) == ex.clean(word)]
    return hits[occurrence - 1]


def sbuild(spec=None, caps=None, **kw):
    kw.setdefault('plans', PLANS)
    kw.setdefault('probe', lambda p: None)
    kw.setdefault('sizes', SIZES)
    kw.setdefault('highlights', DETECTED)
    kw.setdefault('measured', MEASURED)
    return ex.build_props('/nonexistent', spec or SSPEC, caps or make_caps(spec or SSPEC), durations=DURATIONS, **kw)


def scene(p, sid):
    return next(s for s in p['scenes'] if s['id'] == sid)


def ov(p, sid, kind, n=0):
    return [o for o in scene(p, sid).get('overlays', []) if o['kind'] == kind][n]


def test_seam_theme_reaches_the_props_and_reel_two_stays_untouched():
    p = sbuild()
    assert p['theme'] == 'seam' and p['meta']['theme'] == 'seam' and p['cta'] is None and p['headlines'] == []
    assert [s['type'] for s in p['scenes']] == ['split'] * 7
    assert [bool(s.get('flip')) for s in p['scenes']] == [False, False, False, False, True, False, False]
    assert p['seam']['y'] == ex.SEAM_Y == 560 and p['seam']['captionPx'] == ex.SEAM_CAP_PX
    assert not any(k.startswith('_') for s in p['scenes'] for k in s)
    assert all(a['endMs'] == b['startMs'] for a, b in zip(p['scenes'], p['scenes'][1:]))
    assert scene(p, 'S2')['recording']['size'] == [1080, 840] and scene(p, 'S5')['recording']['size'] == [1080, 1080]
    assert not any('zooms' in s.get('recording', {}) for s in p['scenes'])   # recordings are made at the panel size
    # The harvest spec (reel #2) keeps its own theme and gains nothing from this one.
    h = ex.build_props('/nonexistent', HSPEC_MIN, make_caps(HSPEC_MIN), durations={'R1': 8400}, plans=PLANS, probe=lambda p: None)
    assert h['theme'] == 'harvest' and 'seam' not in h and not any('flip' in s or 'overlays' in s for s in h['scenes'])


def test_seam_framing_keeps_the_face_clear_of_the_seam_and_covers_its_panel():
    for face in (None, [0.32, 0.145, 0.41, 0.33], [0.28, 0.12, 0.44, 0.36], [0.3, 0.3, 0.4, 0.3]):
        f = ex.seam_framing(face)
        fx, fy, fw, fh = face or ex.SEAM_FACE_BOX
        a, b = f['A'], f['B']
        assert a['y'] <= 560 and a['y'] + 1280 * a['scale'] >= 1280 and a['x'] <= 0 <= a['x'] + 720 * a['scale'] - 720
        assert a['y'] + fy * 1280 * a['scale'] >= 560 + ex.SEAM_HAIR_GAP - 0.1 or a['y'] == 560
        assert b['y'] <= 0 and b['y'] + 1280 * b['scale'] >= 560 and b['x'] <= 0 and b['x'] + 720 * b['scale'] >= 720
        assert b['y'] + (fy + fh) * 1280 * b['scale'] <= 560 - ex.SEAM_CHIN_GAP + 0.1 or b['y'] == 560 - 1280 * b['scale']
        assert b['scale'] > a['scale']                                   # B is the tighter crop
    f = ex.seam_framing([0.32, 0.145, 0.41, 0.33])
    assert abs(f['A']['cy'] - (560 + 0.42 * 720)) < 1                     # face centre at 42 % of the bottom panel


def test_seam_jump_cuts_step_the_presenter_and_the_twist_punch_takes_its_cut():
    assert ex.seam_punches([1000, 2000, 3000], [{'atMs': 2000, 'endMs': 3000, 'scale': 1.14}], 5000) == [
        {'atMs': 0, 'scale': 1}, {'atMs': 1000, 'scale': 1.06}, {'atMs': 2000, 'scale': 1.14}, {'atMs': 3000, 'scale': 1.06}]
    caps = make_caps()
    base = sbuild(caps=caps)
    s6 = scene(base, 'S6')
    cut = s6['startMs'] + 30                     # a jump cut on the twist: the punch lands on it, one hard step
    p = sbuild(caps=caps, cuts=[1200, cut])
    s6 = scene(p, 'S6')
    assert s6['startMs'] == cut                  # the scene change moved onto the cut
    pts = p['seam']['punches']
    assert {'atMs': 1200, 'scale': 1.06} in pts and {'atMs': cut, 'scale': ex.SEAM_TWIST_PUNCH} in pts
    after = [x for x in pts if x['atMs'] > cut]
    assert after and after[0]['atMs'] == s6['endMs']                      # held to the scene end
    assert all(a['scale'] != b['scale'] for a, b in zip(pts, pts[1:]))
    assert len(p['scenes']) == len(base['scenes'])                        # a cut never splits a seam scene


def test_seam_captions_come_from_the_authored_chunks_with_yellow_emphasis():
    beat = SSPEC['beats'][1]
    assert ex.seam_caption_text(beat) == 'GET PICKED | AND YOU GET | {yellow}$10,000 | {yellow}AND SIX WEEKS | WITH THE TEAM'
    assert ex.seam_caption_text(SSPEC['beats'][0]) == ''                  # the hook bar holds the seam slot
    assert ex.seam_caption_text({'line': "Best part, it's open worldwide.", 'emphasis': ['worldwide']}) == \
        "Best part | {yellow}it's open worldwide"
    caps = make_caps()
    p = sbuild(caps=caps)
    ch = p['chunks']
    texts = [c['lines'][0]['text'] for c in ch]
    assert texts[:5] == ['GET PICKED', 'AND YOU GET', '$10,000', 'AND SIX WEEKS', 'WITH THE TEAM']
    assert [c['lines'][0]['color'] for c in ch[:5]] == ['white', 'white', 'yellow', 'yellow', 'white']
    hook = scene(p, 'S1')
    assert all(c['startMs'] >= hook['endMs'] for c in ch)                  # nothing under the title bar
    assert ch[0]['startMs'] == scene(p, 'S2')['startMs']
    assert all(a['endMs'] <= b['startMs'] for a, b in zip(ch, ch[1:]))
    upper = [t.upper() for t in texts]                                    # Remotion sets every chunk in caps
    assert 'COMMENT PITCH' in upper and any(t.startswith("AND I'LL") for t in upper)   # captions run through the CTA


@pytest.mark.parametrize('line', [
    "Get picked and you get ten thousand dollars, a UAE company licence, Golden Visa support if approved, and six weeks with Simon Squibb's team.",
    "It has to be a media idea, think creator brands, film studios or media apps.",
    "You'd set up a UAE company, be in Dubai for January's summit and do all six weeks.",
    "Comment PITCH and I'll send you the official link and my pitch checklist!",
    "If your raw idea is in content creation, digital media or the economy they will fund it.",
])
def test_phrase_chunks_cut_on_phrases_within_the_limits(line):
    chunks = ex.phrase_chunks(line, ['media idea'])
    assert ' '.join(t for t, _ in chunks).replace(',', '') == ex._strip_punct(line).replace(',', '').replace('!', '').replace('.', '')
    for text, _ in chunks:
        words = text.split()
        assert len(text) <= ex.SEAM_CHUNK_MAX_CHARS or len(words) == 1
        assert len(words) <= 3 or (len(words) == 4 and len(text) <= ex.SEAM_CHUNK_SHORT_CHARS)
    # the reference's flaw: a chunk ending on an article or preposition mid-clause ("MENTORSHIP A", "A 6")
    clause_ends = {ex._strip_punct(w).lower() for w in line.split() if ex.ends_clause(w)}
    for text, _ in chunks[:-1]:
        last = text.split()[-1].lower()
        assert last not in {'a', 'an', 'the', 'to', 'of', 'with'} or last in clause_ends


def test_phrase_chunks_mark_numbers_and_emphasis_yellow():
    out = dict(ex.phrase_chunks('Applications open November 20 and close December 11, so register now.', ['register']))
    assert out['November 20'] and out['December 11'] and not out['Applications open']
    assert any(y for t, y in ex.phrase_chunks('so register your interest now', ['register']) if 'register' in t)


def test_seam_overlays_land_on_their_words_and_the_recording_clock():
    caps = make_caps()
    p = sbuild(caps=caps)
    s4 = scene(p, 'S4')
    a, b = [o for o in s4['overlays'] if o['kind'] == 'pill']
    assert a['atMs'] == start_of(caps, 'six') - s4['startMs'] and a['untilMs'] == b['atMs']      # the next pill replaces it
    assert a['text'] == '6-WEEK KICKSTART' and a['y'] == 560 - ex.SEAM_PILL_GAP and a['tone'] == 'yellow'
    assert any("'banana' is not said" in w for w in p['meta']['warnings'])                       # dropped, reported
    m1, m2 = [o for o in scene(p, 'S5')['overlays'] if o['kind'] == 'marker']
    s5 = scene(p, 'S5')
    assert m1['atMs'] == start_of(caps, '$1') - s5['startMs']                  # "$1", never the "one" of "100"
    assert m1['box'] == [0.1, 0.3, 0.6, 0.1] and m1['color'] == ex.SEAM_MINT and m1['style'] == 'fill'
    rec = s5['recording']
    assert m2['atMs'] == round((1800 - rec['inMs']) / rec.get('playbackRate', 1.0))   # the measured highlight time...
    assert m2['box'] == [0.05, 0.6, 0.8, 0.2]                                        # ...and the box found in the shot
    el = ov(p, 'S5', 'ellipse')
    assert el['box'] == [0.1, 0.5, 0.5, 0.1] and el['fill'] == ex.SEAM_MINT and el['atMs'] == start_of(caps, 'programme') - s5['startMs']
    rp, s6 = ov(p, 'S6', 'ripple'), scene(p, 'S6')
    r6 = s6['recording']
    assert rp['point'] == [0.5, 0.5] and rp['atMs'] == round((6500 - r6['inMs']) / r6.get('playbackRate', 1.0))
    hook = ov(p, 'S1', 'hook')
    assert hook['boxText'] == '$10,000 FOR 100 IDEAS' and hook['atMs'] == 0 and hook['barLines'] == ['Got A Media Idea? The UAE Could Fund It']
    assert ex.SEAM_HOOK_BAR_MIN_PX <= hook['barSize'] <= ex.SEAM_HOOK_BAR_PX
    assert not any(o['kind'] == 'punch' for s in p['scenes'] for o in s.get('overlays', []))     # punches go to the take


def test_seam_count_up_lands_on_its_word_and_never_too_fast():
    caps = make_caps()
    p = sbuild(caps=caps)
    c, s3 = ov(p, 'S3', 'count'), scene(p, 'S3')
    assert c['to'] == 10000 and c['steps'] == [4000, 8500] and c['prefix'] == '$' and c['pill'] == 'EACH · IF SELECTED'
    assert c['landMs'] == max(start_of(caps, 'dollars') - s3['startMs'], c['atMs'] + ex.SEAM_COUNT_MIN_MS)
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][1]['units'][1]['overlays'][0]['land'] = 'thousand'          # said 220 ms after "ten"
    c2 = ov(sbuild(spec=spec, caps=caps), 'S3', 'count')
    assert c2['landMs'] - c2['atMs'] == ex.SEAM_COUNT_MIN_MS
    assert c['size'] <= ex.SEAM_COUNT_PX and ex.seam_text_width('$10,000', c['size']) <= ex.SEAM_COUNT_MAX_W + 0.5


def test_seam_cta_plate_types_the_keyword_then_the_strip_and_arrow():
    caps = make_caps()
    p = sbuild(caps=caps)
    s7 = scene(p, 'S7')
    assert s7['plate'] == {'blur': 14.0, 'darken': 0.25} and s7['recording']['inMs'] == 1500 and 'playbackRate' not in s7['recording']
    c = ov(p, 'S7', 'cta')
    assert c['keyword'] == 'PITCH' and c['atMs'] == start_of(caps, 'PITCH') - s7['startMs']
    assert c['stripAtMs'] == c['atMs'] + 5 * ex.SEAM_TYPE_CHAR_MS + ex.SEAM_STRIP_AFTER_MS
    assert c['arrowAtMs'] == c['stripAtMs'] + ex.SEAM_ARROW_AFTER_MS and c['strip'] == 'GET THE OFFICIAL LINK'
    assert c['keyW'] > 0 and c['stripSize'] <= ex.SEAM_STRIP_PX
    ticks = [x for x in p['sfx'] if x['volume'] == ex.SEAM_TICK_VOLUME]
    assert len(ticks) == 5 and all(x['atMs'] % ex.FRAME_MS == 0 for x in p['sfx'])
    land = ov(p, 'S3', 'count')['landMs'] + scene(p, 'S3')['startMs']
    assert {'src': 'job/sfx_tick.wav', 'atMs': land // 40 * 40, 'volume': ex.SEAM_LAND_VOLUME} in p['sfx']


def test_seam_warns_about_off_aspect_recordings_long_pills_and_missing_glyphs():
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][2]['units'][0]['layout'] = 'A'                    # a 1080x1080 page in the 720x560 panel
    spec['beats'][1]['units'][2]['overlays'][0]['text'] = 'A VERY LONG PILL THAT NEVER FITS ON ONE LINE AT ALL OK'
    spec['beats'][1]['units'][2]['overlays'][1]['text'] = 'SIMON → TEAM'
    w = sbuild(spec=spec)['meta']['warnings']
    assert any('R3.mp4 is 1080x1080, layout A shows 720x560' in x for x in w)
    assert any('only fits at' in x for x in w)
    assert any('Inter 900 does not draw: →' in x for x in w)
    assert sbuild()['meta']['warnings'] == ["S4: pill at 'banana' is not said in the scene; dropped"]


def test_seam_spec_fields_normalise_and_layout_aliases():
    n = ex.seam_normalise({'beats': [{'name': 'x', 'ref_window_s': [1.0, 2.0], 'line': 'Hi there.', 'units': [
        {'id': 'A', 'screenrec': 'R1', 'type': 'split: recording top / avatar bottom'}, {'id': 'B', 'plate': {}, 'screenrec': 'R1'}, {'id': 'C'}]}]})
    b = n['beats'][0]
    assert b['ref_window'] == [1.0, 2.0] and [u['type'] for u in b['units']] == ['avatar + recording', 'avatar + plate', 'avatar full-frame']
    assert all(u['t'] == [1.0, 2.0] for u in b['units']) and b['on_screen_text'] == 'Hi there'
    assert [ex.seam_layout({'layout': v}) for v in ('A', 'b', 'avatar_top', 'flip', None, 'rec_top')] == ['A', 'B', 'B', 'B', 'A', 'A']


def test_seam_measured_highlights_read_recordings_json(tmp_path):
    shots = tmp_path / 'shots'
    shots.mkdir()
    (shots / 'recordings.json').write_text(json.dumps({
        'R2': {'highlight_ms': [[1000, 4240]], 'checked': {'duration_ms': 5360}},
        'R3': {'highlight_on_s': [[0.76, 1.8]]},
        'R4': {'width': 1080, 'height': 840, 'highlights': [{'start_ms': 600, 'end_ms': 1760, 'box': [108, 84, 540, 84]}, {'on_s': 2.0}]},
        'R5': {'highlight_ms': []},
    }))
    m = ex.seam_measured_highlights(tmp_path, grab=lambda *a: None)
    assert m['R2'] == [{'startMs': 1000, 'endMs': 4240}] and m['R3'] == [{'startMs': 760, 'endMs': 1800}]
    assert m['R4'] == [{'startMs': 600, 'endMs': 1760, 'box': [0.1, 0.1, 0.5, 0.1]}, {'startMs': 2000, 'endMs': 3000}]
    assert m['R5'] == [] and ex.seam_measured_highlights(tmp_path / 'none') == {}


def test_load_cuts_reads_cuts_final_and_the_cli_prefers_it(tmp_path):
    (tmp_path / 'c.json').write_text(json.dumps({'cuts_ms': [1240, 2480], 'note': 'final timeline'}))
    assert ex.load_cuts(tmp_path / 'c.json') == [1240, 2480]
    job = tmp_path / 'job'
    (job / 'analysis').mkdir(parents=True)
    (job / 'analysis' / 'spec.json').write_text(json.dumps(SSPEC))
    (job / 'captions.json').write_text(json.dumps(make_caps()))
    (job / 'cuts.json').write_text(json.dumps({'cuts': [{'at_ms': 999}]}))          # the pre-speed-up timeline
    (job / 'cuts_final.json').write_text(json.dumps({'cuts_ms': [1240]}))
    assert ex.main(['build', str(job), '--no-music']) == 0
    props = json.loads((job / 'edit_explainer.json').read_text())
    assert props['meta']['cuts'] == [1240] and props['theme'] == 'seam'


def test_recording_plans_prefer_the_shots_plans(tmp_path):
    for d, wait in (('shots/plans', 1), ('analysis/screenrec/plans', 2)):
        (tmp_path / d).mkdir(parents=True)
        (tmp_path / d / 'R1.json').write_text(json.dumps({'actions': [{'wait': wait}]}))
    (tmp_path / 'analysis/screenrec/plans/R9.json').write_text(json.dumps({'actions': []}))
    plans = ex.recording_plans(tmp_path)
    assert plans['R1']['actions'] == [{'wait': 1}] and 'R9' in plans


def test_seam_fonts_are_vendored_with_licences_and_cover_the_captions():
    fonts = STUDIO / 'remotion' / 'public' / 'fonts'
    for f in (f'doto-latin-{ex.SEAM_CAP_WEIGHT}-normal.woff2', 'inter-latin-900-normal.woff2', 'OFL-Doto.txt', 'OFL-Inter.txt'):
        assert (fonts / f).exists(), f
    assert 'SIL Open Font License' in (fonts / 'OFL-Doto.txt').read_text()
    m = ex.seam_metrics()
    assert m[ex.SEAM_CAP_FONT]['avg'] == ex.SEAM_CAP_EM
    assert ex.seam_missing_glyphs("COMMENT \"PITCH\" $10,000 · 18+ JANUARY'S 20TH", ex.SEAM_CAP_FONT) == []
    fonts_ts = (STUDIO / 'remotion' / 'src' / 'explainer' / 'seam' / 'fonts.ts').read_text()
    assert f'doto-latin-{ex.SEAM_CAP_WEIGHT}-normal.woff2' in fonts_ts
    assert ex.seam_fit('X' * 80, 30, 600) < 30 and ex.seam_fit('OK', 30, 600) == 30


def test_scene_changes_snap_onto_a_jump_cut_within_seam_snap_ms():
    # A unit start Whisper put up to 7 frames off the pause's cut moves onto it (the jump hides under the swap).
    start = scene(sbuild(), 'S2')['startMs']
    p = sbuild(cuts=[start - 200])
    assert scene(p, 'S2')['startMs'] == start - 200 and ex.SNAP_MS < 200 <= ex.SEAM_SNAP_MS
    far = start - ex.SEAM_SNAP_MS - 40
    assert scene(sbuild(cuts=[far]), 'S2')['startMs'] == start


def test_seam_short_chunks_join_a_neighbour_instead_of_delaying_the_next():
    line = lambda text, t, color='white': {'text': text, 'startMs': t, 'serif': False, 'color': color}
    chunks = [{'startMs': 0, 'endMs': 500, 'lines': [line('A MEDIA IDEA', 0, 'yellow')]},
              {'startMs': 500, 'endMs': 610, 'lines': [line('THINK', 500)]},
              {'startMs': 610, 'endMs': 1200, 'lines': [line('CREATOR BRANDS', 610, 'yellow')]},
              {'startMs': 1200, 'endMs': 1800, 'lines': [line('AND SIX WEEKS', 1200)]},
              {'startMs': 1800, 'endMs': 1900, 'lines': [line('WITH', 1800)]},
              {'startMs': 1900, 'endMs': 2600, 'lines': [line("SIMON SQUIBB'S TEAM", 1900)]}]
    out = ex.seam_hold_short_chunks(chunks)
    texts = [[l['text'] for l in c['lines']] for c in out]
    # "THINK" + "CREATOR BRANDS" fit one caption: one chunk whose second line comes up on its own word, on time.
    assert ['THINK', 'CREATOR BRANDS'] in texts and out[1]['lines'][1]['startMs'] == 610
    # "WITH" + "SIMON SQUIBB'S TEAM" is 24 characters, and appended to "AND SIX WEEKS" it would leave that chunk
    # dangling on a function word (review r3): it stays on its own and the name starts within a frame of its word.
    assert ['AND SIX WEEKS'] in texts and ['WITH'] in texts and ['AND SIX WEEKS', 'WITH'] not in texts
    assert 0 <= out[-1]['startMs'] - 1900 <= ex.FRAME_MS
    assert all(a['endMs'] <= b['startMs'] for a, b in zip(out, out[1:]))
    # Nothing to join: it holds only as long as the next chunk still starts within a frame of its word.
    lone = [{'startMs': 0, 'endMs': 100, 'lines': [line('A' * 12, 0)]}, {'startMs': 100, 'endMs': 900, 'lines': [line('B' * 12, 100)]}]
    held = ex.seam_hold_short_chunks(lone)
    assert held[1]['startMs'] - 100 <= ex.FRAME_MS and held[0]['endMs'] == held[1]['startMs']


def test_seam_cta_fine_print_breaks_on_bars_and_the_count_draws_an_underline():
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][-1]['units'][0]['overlays'][0]['fine'] = 'Apply only via the official link | Nobody asks for fees in DMs'
    p = sbuild(spec=spec)
    c = ov(p, 'S7', 'cta')
    assert c['fineLines'] == ['Apply only via the official link', 'Nobody asks for fees in DMs'] and '|' not in c['fine']
    assert c['fineSize'] <= ex.SEAM_FINE_PX
    assert ov(p, 'S3', 'count')['underline'] is True
    assert p['seam']['captionWeight'] == ex.SEAM_CAP_WEIGHT == 500
    spec['beats'][3]['units'][0]['overlays'][1].update(x=500, y=110)      # a pill moved onto blank page space
    w = ov(sbuild(spec=spec), 'S6', 'pill')
    assert (w['x'], w['y']) == (500, 110) and 'x' not in ov(p, 'S6', 'pill')


def test_seam_panel_framing_scale_origin_and_fade_reach_the_scene():
    spec = json.loads(json.dumps(SSPEC))
    u = spec['beats'][2]['units'][0]
    u.update(scale=0.92, origin=[0.5, -0.2], fade=[556, 586])
    spec['beats'][1]['units'][0].update(fade=[460, 420], fade_color='#F7F7F7', scale=1.0)
    p = sbuild(spec=spec)
    s5, s2 = scene(p, 'S5'), scene(p, 'S2')
    assert s5['recScale'] == 0.92 and s5['recOrigin'] == [0.5, 0.0]                 # origin clamped into the panel
    assert s5['fade'] == {'fromPx': 556, 'toPx': 586, 'color': '#FFFFFF'}
    assert s2['fade'] == {'fromPx': 460, 'toPx': 420, 'color': '#F7F7F7'} and 'recScale' not in s2   # 1.0 is no scale
    assert not any(k in scene(p, 'S1') for k in ('recScale', 'recOrigin', 'fade'))
    assert ex.seam_panel_framing({'fade': [500, 500]}) == {}                        # an empty veil is dropped


def test_seam_count_blur_ellipse_shape_and_fine_print_size():
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][1]['units'][1]['overlays'][0]['blur'] = 4
    spec['beats'][2]['units'][0]['overlays'][2].update(power=4, tilt=-1.5)
    p = sbuild(spec=spec)
    assert ov(p, 'S3', 'count')['blur'] == 4.0 and ov(sbuild(), 'S3', 'count')['blur'] == 0.0
    el = ov(p, 'S5', 'ellipse')
    assert el['power'] == 4.0 and el['tilt'] == -1.5 and 'power' not in ov(sbuild(), 'S5', 'ellipse')
    assert ov(sbuild(), 'S7', 'cta')['fineSize'] == ex.SEAM_FINE_PX >= 22               # readable on a phone by default
    spec['beats'][-1]['units'][0]['overlays'][0].update(fine='Apply only via the one link on the official website of the summit in Dubai', fine_px=30)
    p2 = sbuild(spec=spec)
    assert ov(p2, 'S7', 'cta')['fineSize'] < 22 and any('fine print only fits' in w for w in p2['meta']['warnings'])


def test_seam_plate_saturation_reaches_the_scene():
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][-1]['units'][0]['plate'] = {'still_ms': 1200, 'blur': 16, 'darken': 0.55, 'saturate': 0.2}
    s7 = scene(sbuild(spec=spec), 'S7')
    assert s7['plate'] == {'blur': 16.0, 'darken': 0.55, 'saturate': 0.2} and s7['recording']['inMs'] == 1200
    assert 'saturate' not in scene(sbuild(), 'S7')['plate']


def test_seam_subtitles_use_the_scripted_spelling_and_cover_split_numbers(tmp_path):
    spec = json.loads(json.dumps(SSPEC))
    spec['beats'][1]['line'] = 'Get picked and you get $10,000, a UAE company licence.'
    caps = make_caps(spec)
    for c in caps:                     # what Whisper writes: American spelling, the number split in two tokens
        c['text'] = c['text'].replace('licence', 'license')
    i = next(k for k, c in enumerate(caps) if '$10,000' in c['text'])
    caps[i:i + 1] = [{**caps[i], 'text': ' $10', 'endMs': caps[i]['startMs'] + 90},
                     {**caps[i], 'text': ' ,000,', 'startMs': caps[i]['startMs'] + 90}]
    p = sbuild(spec=spec, caps=caps)
    subs = p['meta']['subtitles']
    texts = [x['text'] for x in subs]
    assert 'Get picked and you get $10,000,' in texts and 'a UAE company licence.' in texts
    money = subs[texts.index('Get picked and you get $10,000,')]
    assert money['endMs'] == caps[i + 1]['endMs']                    # the clause runs on to ",000,"
    assert all(a['startMs'] < a['endMs'] <= b['startMs'] for a, b in zip(subs, subs[1:]))
    path = ex.write_srt(tmp_path, p)
    srt = path.read_text()
    assert path.name == 'captions.srt' and '$10,000' in srt and 'licence' in srt and 'license' not in srt
    assert srt.startswith('1\n00:00:00,')
    assert ex.write_srt(tmp_path, {'captions': {'words': []}}) is None
