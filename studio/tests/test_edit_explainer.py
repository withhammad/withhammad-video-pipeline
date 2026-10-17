import json

import pytest

from app import edit_explainer as ex

SPEC = {
    'job': 'test',
    'keyword': 'ELEVEN',
    'beats': [
        {'name': 'hook', 'ref_window': [0.0, 3.2], 'line': 'Eleven free skills turn Claude into your producer!',
         'on_screen_text': '11 FREE SKILLS / TURN CLAUDE INTO / YOUR PRODUCER', 'emphasis': ['CLAUDE'],
         'units': [{'id': 'U1', 't': [0.0, 3.2], 'type': 'avatar full-frame'}]},
        {'name': 'tool', 'ref_window': [3.2, 8.3], 'line': 'Meet the agent skill. Even better? Open source and MIT licence.',
         'on_screen_text': 'Meet the / *agent skill* | Even better? | Open source / *MIT licence*', 'emphasis': ['MIT'],
         'units': [
             {'id': 'U2', 't': [3.2, 5.0], 'type': 'recording full', 'screenrec': 'R1', 'use': 'R1 0.0-2.4 s: box on the repo name',
              'footage': 'https://github.com/x/y'},
             {'id': 'U3', 't': [5.0, 5.8], 'type': 'avatar full-frame'},
             {'id': 'U4', 't': [5.8, 8.3], 'type': 'recording full + stat pop', 'screenrec': 'R1', 'use': 'R1 from 2.4 s: box on MIT',
              'overlay': 'Giant light-green #9EC96E stat "FREE + MIT" at 0.69H. Small fine-print chip: "Skills: free."'},
         ]},
        {'name': 'twist', 'ref_window': [8.3, 13.5], 'line': "And it's not one big prompt. It's eleven separate skills.",
         'on_screen_text': 'Not one big prompt | *Eleven* separate skills', 'emphasis': ['not one'],
         'units': [
             {'id': 'U5', 't': [8.3, 9.7], 'type': 'avatar full-frame'},
             {'id': 'U6', 't': [9.7, 13.5], 'type': 'recording full', 'screenrec': 'R3',
              'use': 'whole R3 (5.8 s, speed to fit). Card slides up from the bottom edge in Remotion',
              'footage': 'https://github.com/x/y/blob/main/skills/yt-script/SKILL.md'},
         ]},
        {'name': 'cta_keyword', 'ref_window': [13.5, 16.7], 'line': "Comment ELEVEN and I'll send you the guide!",
         'on_screen_text': 'Comment / *"ELEVEN"*', 'emphasis': ['ELEVEN'],
         'units': [{'id': 'U7', 't': [13.5, 16.7], 'type': 'avatar full-frame'}]},
    ],
}
DURATIONS = {'R1': 8400, 'R3': 5800}


def make_caps(step=220, words=None):
    """Word timings: `step` ms per word, +400 ms after a sentence, +150 ms after a comma or colon."""
    words = words or ' '.join(b['line'] for b in SPEC['beats']).split()
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
    seen = 0
    for c in caps:
        if ex.clean(c['text']) == ex.clean(word):
            seen += 1
            if seen == occurrence:
                return c['startMs']
    raise KeyError(word)


def cut_before(caps, word, occurrence=1):
    s = start_of(caps, word, occurrence)
    i = next(k for k, c in enumerate(caps) if c['startMs'] == s)
    return min(s, max(caps[i - 1]['endMs'], s - ex.LEAD_MS))


def scene(props, sid):
    return next(s for s in props['scenes'] if s.get('id') == sid)


def build(caps=None, **kw):
    return ex.build_props('/nonexistent', SPEC, caps or make_caps(), durations=DURATIONS, **kw)


def test_units_land_on_our_words_not_reference_times():
    caps = make_caps()
    p = build(caps)
    s = p['scenes']
    assert [x['id'] for x in s] == ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7']
    assert [x['type'] for x in s] == ['avatar', 'card', 'avatar', 'stat', 'avatar', 'card', 'avatar']
    assert s[0]['startMs'] == 0 and s[0]['flipIn'] is True and s[0]['system'] == 'hook'
    assert scene(p, 'U2')['startMs'] == cut_before(caps, 'Meet')
    assert scene(p, 'U3')['startMs'] == cut_before(caps, 'Even')           # phrase "Even better?"
    assert scene(p, 'U4')['startMs'] == cut_before(caps, 'Open')           # phrase "Open source / MIT licence"
    assert scene(p, 'U5')['startMs'] == cut_before(caps, 'And', 2)         # not the "and" in "source and MIT"
    assert scene(p, 'U6')['startMs'] == cut_before(caps, "It's", 2)        # "*Eleven* separate" backs off to its sentence
    assert scene(p, 'U7')['startMs'] == cut_before(caps, 'Comment')
    assert all(a['endMs'] == b['startMs'] for a, b in zip(s, s[1:]))      # contiguous, no gaps, no overlaps
    assert p['durationMs'] == s[-1]['endMs'] == caps[-1]['endMs'] + ex.END_HOLD_MS
    assert scene(p, 'U3')['system'] == 'talk' and scene(p, 'U2')['system'] == 'explainer'


def test_recording_in_points_rates_and_entrances():
    caps = make_caps()
    p = build(caps)
    u2, u4, u6 = scene(p, 'U2'), scene(p, 'U4'), scene(p, 'U6')
    d2 = u2['endMs'] - u2['startMs']
    assert u2['recording']['src'] == 'job/shots/R1.mp4' and u2['recording']['inMs'] == 0
    assert u2['recording']['playbackRate'] == pytest.approx(min(2.5, max(0.6, 2400 / d2)), abs=1e-3)   # "0.0-2.4 s" fills U2
    assert u4['recording']['inMs'] == 2400 and u4['recording']['durationMs'] == 8400
    d6 = u6['endMs'] - u6['startMs']
    assert u6['recording']['playbackRate'] == pytest.approx(min(2.5, max(0.6, 5800 / d6)), abs=1e-3)   # whole R3, speed to fit
    assert u6['cardSlide'] == 'up' and u6['label'] == '/yt-script'


def test_overlays_display_text_emphasis_and_cta():
    caps = make_caps()
    p = build(caps)
    assert scene(p, 'U4')['overlay'] == {'kind': 'stat', 'text': 'FREE + MIT', 'color': ex.STAT_GREEN, 'y': 0.70}
    words = p['captions']['words']
    texts = [w['text'] for w in words]
    assert texts[0] == '11'                       # "Eleven" in the hook shows as a digit
    assert 'ELEVEN' in texts                      # the keyword after "Comment" stays a word
    assert "It's" in texts and '11' in texts[texts.index("It's"):]
    assert [w['text'] for w in words if w.get('em')] == ['Claude', 'MIT', 'not', 'one', 'ELEVEN']
    assert p['cta'] == {'keyword': 'ELEVEN', 'atMs': start_of(caps, 'Comment'), 'handle': 'with.hammad', 'reply': 'Here you go!'}
    assert {x['src'] for x in p['sfx']} >= {'job/sfx_pop.wav', 'job/sfx_tick.wav'}
    assert p['music']['src'] == 'job/music.wav'


def test_alignment_survives_whisper_spelling():
    words = ' '.join(b['line'] for b in SPEC['beats']).split()
    whisper = [{'Eleven': '11', 'licence.': 'license.', 'eleven': '11'}.get(w, w) for w in words]
    caps = make_caps(words=whisper)
    p = build(caps)
    assert scene(p, 'U2')['startMs'] == cut_before(caps, 'Meet')
    assert scene(p, 'U7')['startMs'] == cut_before(caps, 'Comment')


def test_long_bridge_becomes_split_with_the_incoming_recording():
    caps = make_caps(step=420)                     # a slow take: "And it's not one big prompt." runs ~3 s
    p = build(caps)
    ids = [x['id'] for x in p['scenes']]
    assert ids[ids.index('U5') + 1] == 'U6-split'
    u5, split, u6 = scene(p, 'U5'), scene(p, 'U6-split'), scene(p, 'U6')
    assert u5['endMs'] - u5['startMs'] <= max(1400 + ex.BREATHER_SLACK_MS, ex.BREATHER_MIN_CAP_MS)
    assert split['type'] == 'split' and split['recording']['src'] == 'job/shots/R3.mp4' and split['recording']['inMs'] == 0
    assert u6['recording']['inMs'] == split['endMs'] - split['startMs']      # the card continues the recording
    assert u5['endMs'] == split['startMs'] and split['endMs'] == u6['startMs']


def test_cuts_hide_under_recordings_first_then_alternate_punch():
    caps = make_caps()
    base = build(caps)
    u3 = scene(base, 'U3')
    near = u3['startMs'] + 150                     # a jump cut just after the card -> avatar cut
    far = start_of(caps, 'send')                   # inside the CTA talking head, far from any recording
    inside_card = scene(base, 'U6')['startMs'] + 500
    p = build(caps, cuts=[near, far, inside_card])
    assert scene(p, 'U2')['endMs'] == scene(p, 'U3')['startMs'] == near + ex.COVER_PAD_MS
    ids = [x['id'] for x in p['scenes']]
    assert ids == ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U7b']
    assert scene(p, 'U7')['endMs'] == scene(p, 'U7b')['startMs'] == far
    assert 'punch' not in scene(p, 'U7') and scene(p, 'U7b')['punch'] == 1.06
    assert scene(p, 'U6') == scene(base, 'U6')


def test_anchor_pins_a_unit_to_a_word():
    caps = make_caps()
    p = build(caps, anchors={'U4': 'MIT'})
    assert scene(p, 'U4')['startMs'] == cut_before(caps, 'MIT')


def test_tail_starts_the_second_look_and_switches_caption_variant():
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][3]['units'][0]['type'] = 'avatar full-frame (second setup)'
    caps = make_caps()
    p = ex.build_props('/nonexistent', spec, caps, durations=DURATIONS, tail='job/avatar_wait.mp4', loop=True)
    assert p['tail'] == {'src': 'job/avatar_wait.mp4', 'startMs': scene(p, 'U7')['startMs'], 'loop': True}
    assert p['avatar'] == {'src': 'job/avatar_main.mp4', 'loop': True}


def test_monotone_match_keeps_order():
    assert ex.monotone_match([10, 50], [0, 12, 40, 90]) == [1, 2]
    assert ex.monotone_match([5], [100, 6, 7]) == [1]


def test_number_words_and_tokens():
    assert ex.num_words(21) == 'twenty one' and ex.num_words(1500) == 'fifteen hundred'
    assert ex.tokens('Script: 5 hooks, 1,500+ stars') == ['script', 'five', 'hooks', 'fifteen', 'hundred', 'stars']
    shown = ex.display_words([{'text': w, 'startMs': i * 100, 'endMs': i * 100 + 90} for i, w in
                              enumerate(['over', 'fifteen', 'hundred', 'stars,', 'twenty-one', 'formulas', 'one', 'job'])])
    assert [w['text'] for w in shown] == ['over', '1,500', 'stars,', '21', 'formulas', 'one', 'job']
    assert shown[1]['endMs'] == 290


def test_cli_build_writes_props_into_the_job(tmp_path):
    job = tmp_path / 'job1'
    (job / 'analysis').mkdir(parents=True)
    (job / 'analysis' / 'spec.json').write_text(json.dumps(SPEC))
    (job / 'captions.json').write_text(json.dumps(make_caps()))
    assert ex.main(['build', str(job), '--no-music', '--cuts', '200']) == 0
    props = json.loads((job / 'edit_explainer.json').read_text())
    assert props['music'] is None and props['meta']['cuts'] == [200]
    assert props['scenes'][0]['type'] == 'avatar' and props['scenes'][-1]['endMs'] == props['durationMs']
    assert not any(k.startswith('_') for s in props['scenes'] for k in s)


def test_synth_captions_are_placeholders_for_the_whole_script():
    caps = ex.synth_captions(SPEC, wpm=196)
    assert len(caps) == sum(len(b['line'].split()) for b in SPEC['beats'])
    assert all(a['startMs'] < b['startMs'] for a, b in zip(caps, caps[1:]))
