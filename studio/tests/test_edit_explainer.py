import json
from pathlib import Path

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
# Screen recording plans (screenrec/record.mjs): the last highlight is the proof each card must reach.
PLANS = {
    'R1': {'actions': [{'wait': 500}, {'move': {'selector': 'a', 'ms': 600}}, {'highlight': {'selector': 'a', 'ms': 1100}},
                       {'move': {'selector': 'b', 'ms': 600}}, {'highlight': {'selector': 'b', 'ms': 1000}},
                       {'move': {'selector': 'c', 'ms': 500}}, {'highlight': {'selector': 'c', 'ms': 1000}},
                       {'zoom': {'scale': 1.35, 'ms': 700}}, {'wait': 600}, {'zoom': {'scale': 1, 'ms': 400}}]},
    'R3': {'actions': [{'scroll': {'to': 'x', 'ms': 1300}}, {'highlight': {'selector': 'r1', 'ms': 700}},
                       {'scrollBy': {'y': 380, 'ms': 1900}}, {'highlight': {'selector': 'r11', 'ms': 800}}]},
}


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


def build(caps=None, spec=None, **kw):
    kw.setdefault('plans', PLANS)
    return ex.build_props('/nonexistent', spec or SPEC, caps or make_caps(), durations=DURATIONS, **kw)


def window(s):
    """(first, last) source ms a scene's recording shows."""
    r = s['recording']
    return r['inMs'], r['inMs'] + (s['endMs'] - s['startMs']) * r.get('playbackRate', 1.0)


def boundary_word(caps, t):
    """The caption word spoken last before a scene boundary at t."""
    return [c for c in caps if c['startMs'] < t][-1]['text']


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
    # "from 2.4 s" in a 1.5 s scene: up to 1.6x, and the HEAD goes, so the scene ends on the proof, not mid-scroll.
    first, last = window(u4)
    start, ready = ex.key_action(PLANS['R1'], 8400)
    assert u4['recording']['durationMs'] == 8400 and u4['recording']['playbackRate'] <= ex.FIT_RATE_MAX
    assert 2400 < first <= start - 150 + 1 and ready < last <= 8400 - ex.TAIL_KEEP_MS
    p2 = build(caps, plans={})                          # no plan: the scene ends TAIL_KEEP_MS before the source end
    first, last = window(scene(p2, 'U4'))
    assert first > 2400 and last == pytest.approx(8400 - ex.TAIL_KEEP_MS, abs=2)
    d6 = u6['endMs'] - u6['startMs']
    assert u6['recording']['playbackRate'] == pytest.approx(min(2.5, max(0.6, 5800 / d6)), abs=1e-3)   # whole R3, speed to fit
    assert u6['cardSlide'] == 'up' and u6['label'] == '/yt-script'


def test_key_action_times_follow_the_recorder():
    acts = ex.plan_actions(PLANS['R3'], 5800)
    nominal = 1300 + 700 + 260 + 1900 + 800 + 260
    k = 5800 / (nominal + ex.RECORDER_TAIL_MS)
    assert acts[-1] == ('highlight', pytest.approx((nominal - 1060) * k), pytest.approx(nominal * k))
    assert ex.key_action(PLANS['R3'], 5800) == (round((nominal - 1060) * k), round((nominal - 1060) * k + ex.KEY_READ_MS))
    typed = {'actions': [{'wait': 300}, {'type': {'selector': 't', 'text': 'x' * 45, 'cps': 45}}]}
    assert ex.key_action(typed) == (300, 1300)          # a typed line is ready when the typing ends


def test_every_recording_reaches_its_last_highlight():
    """Short scenes over long recordings (no "speed to fit", no range) still show the plan's last highlight."""
    for step in (220, 160, 120):                       # faster takes squeeze the cards harder
        caps = make_caps(step=step)
        p = build(caps)
        for src, rid in (('job/shots/R1.mp4', 'R1'), ('job/shots/R3.mp4', 'R3')):
            start, ready = ex.key_action(PLANS[rid], DURATIONS[rid])
            shown = [window(s) for s in p['scenes'] if (s.get('recording') or {}).get('src') == src]
            assert any(a <= start + 1 and b >= ready - 1 for a, b in shown), (step, rid, shown, (start, ready))
    # One recording, one short scene: the window moves to the proof.
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][2]['units'][1]['use'] = 'R3: box on the last row'
    p = build(make_caps(), spec=spec)
    start, ready = ex.key_action(PLANS['R3'], DURATIONS['R3'])
    a, b = window(scene(p, 'U6'))
    assert a <= start and b >= ready and scene(p, 'U6')['recording']['playbackRate'] <= ex.FIT_RATE_MAX


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


def test_scene_boundaries_never_fall_mid_clause():
    for step in (160, 220, 340, 420):
        caps = make_caps(step=step)
        p = build(caps)
        for a, b in zip(p['scenes'], p['scenes'][1:]):
            if b.get('system') == 'talk' and b['type'] == 'split':
                continue                            # the talking-head caption page runs on across it
            assert ex.ends_clause(boundary_word(caps, b['startMs'])), (step, a['id'], b['id'])


def test_long_bridge_without_a_clause_end_stays_whole():
    caps = make_caps(step=340)                     # "And it's not one big prompt." runs ~2.4 s, no comma
    p = build(caps)
    ids = [x['id'] for x in p['scenes']]
    assert ids[ids.index('U5') + 1] == 'U6'
    u5 = scene(p, 'U5')
    assert ex.BREATHER_MIN_CAP_MS < u5['endMs'] - u5['startMs'] <= ex.BRIDGE_WHOLE_MAX_MS
    assert boundary_word(caps, u5['endMs']) == ' prompt.'


def test_long_bridge_splits_at_a_clause_with_the_incoming_recording():
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][2]['line'] = "And honestly, it's not one big prompt. It's eleven separate skills."
    caps = make_caps(step=420, words=' '.join(b['line'] for b in spec['beats']).split())
    p = build(caps, spec=spec)
    ids = [x['id'] for x in p['scenes']]
    assert ids[ids.index('U5') + 1] == 'U6-split'
    u5, split, u6 = scene(p, 'U5'), scene(p, 'U6-split'), scene(p, 'U6')
    assert boundary_word(caps, split['startMs']) == ' honestly,'            # cut where the clause ends
    assert split['system'] == 'explainer' and 'cardSlide' not in split          # the split scales in, never slides
    assert split['recording']['src'] == 'job/shots/R3.mp4' and split['recording']['inMs'] == 0
    assert 'playbackRate' not in split['recording']                              # the head plays at 1x...
    assert u6['recording']['inMs'] == split['endMs'] - split['startMs']        # ...and the card continues it
    assert u5['endMs'] == split['startMs'] and split['endMs'] == u6['startMs']
    page = next(h for h in p['headlines'] if h['startMs'] >= split['startMs'])
    # Shown from the clause start in the split until the next page takes over (its lead lands on the U6 cut).
    assert page['startMs'] == start_of(caps, "it's") and page['endMs'] == start_of(caps, "It's", 2)
    assert [w['text'] for ln in page['lines'] for w in ln['words']] == ['Not', 'one', 'big', 'prompt']


def test_very_long_bridge_without_a_clause_keeps_talk_captions_on_the_split():
    caps = make_caps(step=420)                     # ~2.9 s with no comma: longer than BRIDGE_WHOLE_MAX_MS
    p = build(caps)
    u5, split, u6 = scene(p, 'U5'), scene(p, 'U6-split'), scene(p, 'U6')
    assert u5['endMs'] - u5['startMs'] <= ex.BRIDGE_WHOLE_MAX_MS
    assert split['type'] == 'split' and split['system'] == 'talk' and split['beat'] == u5['beat']
    assert u6['recording']['inMs'] == split['endMs'] - split['startMs']


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


def test_ost_pages_parse_lines_italics_and_notes():
    pages = ex.ost_pages('Script: 5 hooks / *from 21 formulas, scored* | Open source / *MIT licence* + stat FREE + MIT'
                         ' | open *Claude Code* / paste the repo link / *ask it to install*')
    assert pages[0] == [[('Script:', False), ('5', False), ('hooks', False)],
                        [('from', True), ('21', True), ('formulas,', True), ('scored', True)]]
    assert pages[1] == [[('Open', False), ('source', False)], [('MIT', True), ('licence', True)]]
    assert pages[2] == [[('open', False), ('Claude', True), ('Code', True)], [('paste', False), ('the', False), ('repo', False), ('link', False)]]
    assert pages[3] == [[('ask', True), ('it', True), ('to', True), ('install', True)]]      # a third line turns the page


def test_headlines_follow_the_curated_text_and_our_word_times():
    caps = make_caps()
    p = build(caps)
    heads = p['headlines']
    text = [[' '.join(w['text'] for w in ln['words']) for ln in h['lines']] for h in heads]
    # "Even better?" is spoken on the talking head (U3): it has no headline. Card pages keep ':' and ',' as written.
    assert text == [['Meet the', 'agent skill'], ['Open source', 'MIT licence'], ['Eleven separate skills']]
    meet, open_, eleven = heads
    assert meet['startMs'] == start_of(caps, 'Meet') and meet['endMs'] == scene(p, 'U2')['endMs']
    assert [w['startMs'] for w in meet['lines'][1]['words']] == [start_of(caps, 'agent'), start_of(caps, 'skill.')]
    assert meet['lines'][1]['italic'] and not meet['lines'][0]['italic']
    assert open_['startMs'] == start_of(caps, 'Open') and open_['endMs'] == scene(p, 'U4')['endMs']
    # "It's eleven separate skills": the page takes over (the old one clears) at the clause start, but "Eleven" only
    # shows when it is said, never ahead of the voice.
    assert eleven['startMs'] == start_of(caps, "It's", 2)
    assert eleven['lines'][0]['words'][0]['startMs'] == start_of(caps, 'eleven', 2) > eleven['startMs']
    assert eleven['lines'][0]['words'][1]['startMs'] == start_of(caps, 'separate')


def test_headline_pages_span_contiguous_cards_of_a_beat():
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][1]['units'][1] = {'id': 'U3', 't': [5.0, 5.8], 'type': 'recording full', 'screenrec': 'R1', 'use': 'R1 from 1.2 s'}
    spec['beats'][1]['on_screen_text'] = 'Meet the / *agent skill* | Even better? Open source / *MIT licence*'
    p = build(make_caps(), spec=spec)
    assert [s['type'] for s in p['scenes'][1:4]] == ['card', 'card', 'stat']
    page = p['headlines'][0]
    assert page['endMs'] == p['headlines'][1]['startMs'] == start_of(make_caps(), 'Even')
    assert page['startMs'] < scene(p, 'U3')['startMs'] < page['endMs']       # no reset at the U2/U3 cut


def test_end_card_holds_long_enough_to_read():
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][3]['units'].append({'id': 'U8', 't': [16.0, 16.7], 'type': 'text card (end card)', 'footage': 'pill "FREE GUIDE"'})
    p = build(make_caps(), spec=spec)
    end = p['scenes'][-1]
    assert end['type'] == 'endcard' and end['endMs'] - end['startMs'] >= ex.ENDCARD_MIN_MS == 3200
    assert p['durationMs'] == end['endMs']


def test_stage_reports_assets_the_job_does_not_have(tmp_path, monkeypatch):
    job = tmp_path / 'job'
    (job / 'shots').mkdir(parents=True)
    (job / 'avatar_main.mp4').write_bytes(b'x')
    (job / 'shots' / 'R1.mp4').write_bytes(b'x')
    monkeypatch.setattr(ex, 'REMOTION', tmp_path / 'remotion')
    props = build(music=False)
    props['sfx'] = []
    copied, missing = ex.stage(job, props)
    assert copied == ['job/avatar_main.mp4', 'job/shots/R1.mp4'] and missing == ['job/shots/R3.mp4']
    assert (tmp_path / 'remotion' / 'public' / 'job' / 'shots' / 'R1.mp4').exists()


def test_cli_reads_recording_plans_next_to_the_spec(tmp_path):
    job = tmp_path / 'job2'
    plans = job / 'analysis' / 'screenrec' / 'plans'
    plans.mkdir(parents=True)
    for rid, plan in PLANS.items():
        (plans / f'{rid}.json').write_text(json.dumps(plan))
    spec = json.loads(json.dumps(SPEC))
    spec['screenrec'] = {'test_durations_s': {k: v / 1000 for k, v in DURATIONS.items()}}
    (job / 'analysis' / 'spec.json').write_text(json.dumps(spec))
    (job / 'captions.json').write_text(json.dumps(make_caps()))
    assert set(ex.recording_plans(job)) == {'R1', 'R3'}
    assert ex.main(['build', str(job), '--no-music']) == 0
    props = json.loads((job / 'edit_explainer.json').read_text())
    assert props['scenes'] == build(make_caps(), music=False)['scenes']


def test_render_passes_absolute_paths_to_remotion(tmp_path, monkeypatch):
    from app import edit_explainer as ex
    calls = []
    monkeypatch.setattr(ex.subprocess, 'run', lambda cmd, **kw: calls.append((cmd, kw)))
    monkeypatch.setattr(ex, 'master', lambda raw, out: {'I': -14.0})
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'job').mkdir()
    ex.render('job', out='job/final.mp4')
    cmd, kw = calls[0]
    assert kw['cwd'] == ex.REMOTION
    assert Path(cmd[4]).is_absolute() and cmd[5].startswith('--props=/')


# ----------------------------------------------------------------------------------------------- verification round 1

def tail_spec(endcard_t=16.0):
    """SPEC with a second-setup tail: "Wait" on take B, then the site plug and an end card."""
    spec = json.loads(json.dumps(SPEC))
    spec['heygen'] = {'take_A': {'face_box': [0.33, 0.19, 0.38, 0.33]}, 'take_B': {'face_box': [0.39, 0.105, 0.18, 0.14]}}
    spec['beats'].append({'name': 'tail', 'ref_window': [16.7, 22.0], 'line': 'Wait, all my free guides are on withhammad dot com, link in my bio.',
                          'on_screen_text': 'Wait! | *withhammad.com* / link in bio', 'emphasis': ['free guides'],
                          'units': [{'id': 'U8', 't': [16.7, 17.5], 'type': 'avatar full-frame (second setup)',
                                     'overlay': 'Giant green serif "Wait!" behind or beside the head'},
                                    {'id': 'U9', 't': [17.5, 18.5], 'type': 'avatar + overlay cards', 'overlay': 'Chip: "withhammad.com"'},
                                    {'id': 'U10', 't': [18.5, 22.0], 'type': 'text card (end card)', 'footage': 'pill "FREE GUIDE"'}]})
    return spec


def tail_caps(spec):
    return make_caps(words=' '.join(b['line'] for b in spec['beats']).replace('withhammad dot com', 'withhammad .com').split())


def test_scene_cuts_land_on_the_jump_cut_and_short_bridges_stay_whole():
    assert ex.COVER_PAD_MS == 0
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][2]['line'] = "And no, it's not one big prompt. It's eleven separate skills."
    caps = make_caps(words=' '.join(b['line'] for b in spec['beats']).split())
    cut = start_of(caps, 'And', 2)                              # "source and MIT" is the first one
    p = build(caps, spec=spec, cuts=[cut])
    u4, u5 = scene(p, 'U4'), scene(p, 'U5')
    assert u4['endMs'] == u5['startMs'] == cut                  # the recording reaches exactly to the cut
    # "And no," alone would be a 0.5 s talking head: the bridge keeps the whole phrase on the face, no split
    assert 'U6-split' not in [s['id'] for s in p['scenes']]
    assert boundary_word(caps, u5['endMs']) == ' prompt.'


def test_headline_pages_never_flash():
    caps = make_caps()
    first_words = lambda p: [h['lines'][0]['words'][0]['text'] for h in p['headlines']]
    assert 'Meet' in first_words(build(caps))
    # U3 pinned to "the": the U2 card is cut 200 ms after "Meet" appears, so that page would only flash: dropped
    short = build(caps, anchors={'U3': 'the'})
    assert scene(short, 'U2')['endMs'] - start_of(caps, 'Meet') < ex.HEADLINE_MIN_MS
    assert 'Meet' not in first_words(short)
    for h in short['headlines']:
        assert h['endMs'] - min(w['startMs'] for ln in h['lines'] for w in ln['words']) >= ex.HEADLINE_MIN_MS


def test_cta_keyword_keeps_the_spec_casing_and_a_split_domain_is_one_word():
    words = ' '.join(b['line'] for b in SPEC['beats']).replace('Comment ELEVEN', 'Comment Eleven').split()
    p = build(make_caps(words=words))
    shown = [w['text'] for w in p['captions']['words']]
    assert shown.count('ELEVEN') == 1 and shown[shown.index('ELEVEN') - 1] == 'Comment'   # only after "comment"
    out = ex.display_words([{'text': ' on', 'startMs': 0, 'endMs': 100}, {'text': ' withhammad', 'startMs': 100, 'endMs': 500},
                            {'text': ' .com', 'startMs': 500, 'endMs': 800}])
    assert [w['text'] for w in out] == ['on', 'withhammad.com'] and out[1]['endMs'] == 800


def test_end_card_waits_for_the_last_word_and_shows_the_site():
    spec = tail_spec()
    caps = tail_caps(spec)
    p = ex.build_props('/nonexistent', spec, caps, durations=DURATIONS, plans=PLANS, tail='job/avatar_wait.mp4')
    end, before = p['scenes'][-1], p['scenes'][-2]
    last = caps[-1]['endMs']
    assert end['type'] == 'endcard' and end['startMs'] == before['endMs'] == last + ex.ENDCARD_GAP_MS
    assert end['endMs'] - last >= ex.ENDCARD_MIN_MS and p['durationMs'] == end['endMs']
    assert end['site'] == 'withhammad.com' and end['siteNote'] == 'link in bio'
    talk_words = [w for w in p['captions']['words'] if before['startMs'] <= w['startMs'] < before['endMs']]
    assert talk_words[-1]['text'] == 'bio.'                    # every spoken word is captioned on the talking head
    chip = before['overlay']
    assert chip['kind'] == 'chip' and chip['y'] == ex.CHIP_Y_TALK
    said = next(w for w in p['captions']['words'] if w['text'].startswith('withhammad.com'))
    assert chip['atMs'] == said['startMs'] - before['startMs'] - 80   # pops as the site is said


def test_display_word_is_placed_clear_of_the_face():
    full_body = [0.39, 0.105, 0.18, 0.14]
    for face in (full_body, None, [0.33, 0.19, 0.38, 0.33]):
        for y in (0.18, 0.3):
            pl = ex.place_display_word('Wait!', y, face)
            size = pl['size']
            box = ex._display_box('Wait!', size, pl['x'] * ex.CANVAS_W, pl['y'] * ex.CANVAS_H)
            assert not ex._overlaps(box, ex.face_box_px(face)), (face, y, pl)
            assert box[1] >= ex.SAFE_TOP_PX - 1 and box[2] <= ex.SAFE_RIGHT * ex.CANVAS_W + 1 and size >= ex.DISPLAY_MIN_PX
    beside = ex.place_display_word('Wait!', 0.18, full_body)   # head at 0.10H: no room above, so beside the head
    assert beside['x'] < 0.39 and 0.105 < beside['y'] < 0.245
    clear = ex.place_display_word('Wait!', 0.6, full_body)     # asked-for place already clear: unchanged
    assert clear['x'] == 0.5 and clear['y'] == 0.6


def test_bigtext_on_the_tail_uses_the_tail_face_box():
    spec = tail_spec()
    p = ex.build_props('/nonexistent', spec, tail_caps(spec), durations=DURATIONS, plans=PLANS, tail='job/avatar_wait.mp4')
    assert p['tail']['faceBox'] == [0.39, 0.105, 0.18, 0.14] and p['avatar']['faceBox'] == [0.33, 0.19, 0.38, 0.33]
    ov = scene(p, 'U8')['overlay']
    assert ov['kind'] == 'bigtext' and ov == {**ov, **ex.place_display_word('Wait!', 0.18, [0.39, 0.105, 0.18, 0.14])}


def _frame_with_outline(w, h, box, extra=()):
    """rgb24 frame: dark page, a rounded #FFD60A outline (2 px) around box (px), plus small gold specks."""
    buf = bytearray(bytes((13, 17, 23)) * (w * h))

    def put(x, y, c=(255, 214, 10)):
        if 0 <= x < w and 0 <= y < h:
            buf[3 * (y * w + x):3 * (y * w + x) + 3] = bytes(c)
    x0, y0, x1, y1 = box
    for x in range(x0 + 3, x1 - 2):
        for t in range(2):
            put(x, y0 + t)
            put(x, y1 - t)
    for y in range(y0 + 3, y1 - 2):
        for t in range(2):
            put(x0 + t, y)
            put(x1 - t, y)
    for ex_, ey in extra:                       # e.g. a gold "18" count: short runs only
        for k in range(12):
            put(ex_ + k, ey, (242, 204, 96))
    return bytes(buf)


def test_highlight_outline_is_found_and_small_yellow_marks_are_ignored():
    w, h = 270, 338
    rgb = _frame_with_outline(w, h, (30, 120, 220, 160), extra=[(200, 20), (200, 21), (40, 300)])
    x, y, bw, bh = ex.yellow_box(rgb, w, h, min_run=20)
    # the top and bottom edges give the box (inside the rounded corners: within 4 px)
    assert abs(x * w - 30) <= 4 and abs(y * h - 120) <= 1 and abs((x + bw) * w - 221) <= 4 and abs((y + bh) * h - 161) <= 1
    assert ex.yellow_box(_frame_with_outline(w, h, (0, 0, 0, 0))[:0] + bytes((13, 17, 23)) * (w * h), w, h) is None
    assert ex.PUSH_MIN <= ex.push_scale([0.06, 0.6, 0.13, 0.046]) <= ex.PUSH_MAX   # one line of GitHub text
    assert ex.push_scale(None) == 1.5


def test_highlights_get_push_ins_inside_their_scene_and_keys_land_on_words():
    hl = {'R1': [{'startMs': 1151, 'endMs': 2573, 'box': [0.24, 0.10, 0.23, 0.055]},
                 {'startMs': 3201, 'endMs': 4519, 'box': [0.06, 0.60, 0.13, 0.046]},
                 {'startMs': 5042, 'endMs': 6360, 'box': [0.02, 0.67, 0.15, 0.052]}]}
    caps = make_caps()
    p = build(caps, highlights=hl)
    for sid in ('U2', 'U4'):
        s = scene(p, sid)
        dur = s['endMs'] - s['startMs']
        for z in s['recording'].get('zooms', []):
            assert 0 <= z['atMs'] < z['endMs'] <= dur + 400 and ex.PUSH_MIN <= z['scale'] <= ex.PUSH_MAX
    spec = json.loads(json.dumps(SPEC))
    spec['beats'][1]['units'][2]['key'] = {'highlight': 'b', 'word': 'MIT'}       # PLANS R1: highlight 'b' = 2nd box
    p = build(caps, spec=spec, highlights=hl)
    u4 = scene(p, 'U4')
    rec = u4['recording']
    k = ex._keyed_highlight({'highlight': 'b'}, PLANS['R1'], DURATIONS['R1'])
    on_screen = u4['startMs'] + (k['startMs'] - rec['inMs']) / rec.get('playbackRate', 1.0)
    assert abs(on_screen - (start_of(caps, 'MIT') - 100)) <= 2                  # the box is up as the word starts
    assert any(abs(z['box'][1] - 0.60) < 1e-6 for z in rec['zooms'])
    spec['beats'][1]['units'][2]['key'] = {'highlight': 1, 'end': True}
    u4 = scene(build(caps, spec=spec, highlights=hl), 'U4')
    k = ex._keyed_highlight({'highlight': 1}, PLANS['R1'], DURATIONS['R1'])
    out = u4['recording']['inMs'] + (u4['endMs'] - u4['startMs']) * u4['recording'].get('playbackRate', 1.0)
    assert abs(out - k['endMs']) <= 2                                             # the scene ends as the box fades


def test_pops_go_into_word_gaps_or_play_softer():
    spans = [(0, 500), (560, 900), (1300, 2000)]
    assert ex.pop_time(520, spans) == (505, True)          # a 60 ms gap: the pop starts in it
    assert ex.pop_time(1000, spans) == (1000, True)        # already in a gap and it fits
    assert ex.pop_time(1600, spans) == (1600, False)       # mid-word, no gap within 150 ms: softer
    p = build(make_caps())
    for x in p['sfx']:
        if 'pop' in x['src']:
            assert x['volume'] in (ex.POP_VOLUME, ex.POP_VOLUME_ON_WORD)


def test_music_ducks_and_holds_short_gaps():
    m = build(make_caps())['music']
    assert m['duckTo'] == 0.08 and m['holdGapMs'] == 500 and m['fadeInMs'] > 0


def test_load_cuts_reads_a_list_or_tighten_cuts_json(tmp_path):
    (tmp_path / 'a.json').write_text('[3120, 8720]')
    (tmp_path / 'b.json').write_text(json.dumps({'cuts': [{'at_ms': 3120.4}, {'at_ms': 8720}], 'av_offset_ms': -100}))
    assert ex.load_cuts(tmp_path / 'a.json') == ex.load_cuts(tmp_path / 'b.json') == [3120, 8720]
