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
    from app import exports
    exported = []
    monkeypatch.setattr(exports, 'platform_exports', lambda final: exported.append(final) or {'final_social': 'x'})
    monkeypatch.chdir(tmp_path)
    (tmp_path / 'job').mkdir()
    stats = ex.render('job', out='job/final.mp4')
    cmd, kw = calls[0]
    assert kw['cwd'] == ex.REMOTION
    assert Path(cmd[4]).is_absolute() and cmd[5].startswith('--props=/')
    # rendered as final.mp4, it also writes final_ig.mp4 and final_social.mp4 (X, TikTok, Facebook upload that one)
    assert exported == [tmp_path.resolve() / 'job' / 'final.mp4'] and stats['exports'] == {'final_social': 'x'}
    exported.clear()
    ex.render('job')                                   # final_explainer.mp4: not the published file, no exports
    assert exported == []


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


def test_hook_caption_keeps_clear_of_the_inverted_face():
    studio, full_body = [0.33, 0.19, 0.38, 0.33], [0.39, 0.105, 0.18, 0.14]
    for face in (studio, None, full_body, [0.3, 0.05, 0.4, 0.8]):
        y = ex.flip_caption_y(face)
        fy, fh = (face or ex.DEFAULT_FACE_BOX)[1], (face or ex.DEFAULT_FACE_BOX)[3]
        top, bot = (1 - fy - fh) * ex.CANVAS_H, (1 - fy) * ex.CANVAS_H          # the face turned 180 degrees
        band = (y * ex.CANVAS_H - ex.HOOK_CAPTION_HALF_PX, y * ex.CANVAS_H + ex.HOOK_CAPTION_HALF_PX)
        assert band[0] >= ex.SAFE_TOP_PX - 1
        if face != [0.3, 0.05, 0.4, 0.8]:                                         # a face filling the frame: best effort
            assert band[1] <= top or band[0] >= bot, (face, y)
    assert ex.flip_caption_y(studio) < 0.48 - ex.HOOK_CAPTION_HALF_PX / ex.CANVAS_H   # above the chin, on the shirt
    assert ex.flip_caption_y(full_body) == ex.HOOK_CAPTION_Y                          # 0.69H already clear: unchanged
    spec = json.loads(json.dumps(SPEC))
    spec['heygen'] = {'take_A': {'face_box': studio}}
    u1 = scene(build(spec=spec), 'U1')
    assert u1['flipIn'] and u1['flipCaptionY'] == ex.flip_caption_y(studio)


def test_fine_print_chip_is_held_across_the_next_talking_head():
    caps = make_caps()
    spec = json.loads(json.dumps(SPEC))
    u2 = spec['beats'][1]['units'][0]
    u2.update(overlay='Small fine-print chip: "Community pack by A. Author (not the vendor)"', overlay_at_ms=200, overlay_hold_ms=9000)
    p = build(caps, spec=spec)
    s2, s3 = scene(p, 'U2'), scene(p, 'U3')
    ov = s2['overlay']
    assert ov['kind'] == 'chip' and ov['atMs'] == 200 and '_holdMs' not in ov
    # runs on over the talking head (no overlay of its own) and stops before U4, which has its own stat + chip
    assert ov['untilMs'] == s3['endMs'] - s2['startMs'] and 'fadeOutMs' not in ov
    assert ov['moves'] == [{'atMs': s3['startMs'] - s2['startMs'], 'y': ex.CHIP_Y_TALK}]   # above the talk captions
    u2['overlay_hold_ms'] = (s2['endMs'] - s2['startMs']) + 100                             # ends inside U3: fades there
    ov = scene(build(caps, spec=spec), 'U2')['overlay']
    assert ov['untilMs'] == 200 + (s2['endMs'] - s2['startMs']) + 100 and ov['fadeOutMs'] == 200   # pop + hold
    u2['overlay_hold_ms'] = 300                                                             # fits its own scene
    ov = scene(build(caps, spec=spec), 'U2')['overlay']
    assert 'untilMs' not in ov and 'moves' not in ov
    assert any(abs(x['atMs'] - (s2['startMs'] + 200)) <= ex.POP_SNAP_MS for x in p['sfx'] if 'pop' in x['src'])


# ----------------------------------------------------------------------------------------------- theme "harvest"

HSPEC = {
    'job': 'h', 'theme': 'harvest', 'keyword': 'HARVEST',
    'beats': [
        {'name': 'hook', 'ref_window': [0.0, 3.8], 'line': 'Astra can now wake up every morning and hand you a fresh list!',
         'on_screen_text': 'ASTRA | CAN NOW WAKE UP / *every morning* | AND HAND | {teal}YOU A FRESH LIST',
         'units': [
             {'id': 'U1', 't': [0.0, 1.5], 'type': 'avatar + text card', 'card': {'kind': 'title', 'text': 'GPT-6', 'accent': 'ASTRA'}, 'tone': 'dark'},
             {'id': 'U2', 't': [1.5, 3.8], 'type': 'recording full', 'screenrec': 'R1', 'anchor': 'and', 'use': 'R1 0.0-2.4 s', 'tone': 'light'},
         ]},
        {'name': 'proof', 'ref_window': [3.8, 6.6], 'line': 'It has over thirty-one thousand stars on GitHub.',
         'on_screen_text': 'IT HAS OVER | {teal}31,000+ STARS | *on GitHub*',
         'units': [
             {'id': 'U3', 't': [3.8, 4.6], 'type': 'avatar full-frame'},
             {'id': 'U4', 't': [4.6, 6.6], 'type': 'stat card', 'anchor': 'thirty-one', 'caption_y': 0.66,
              'card': {'kind': 'stars', 'owner': 'o', 'repo': 'r', 'from': 31000, 'to': 31844}},
         ]},
        {'name': 'prompt', 'ref_window': [6.6, 12.5], 'line': 'Like, find me two hundred shops and put them in a sheet.',
         'on_screen_text': '',
         'units': [
             {'id': 'U5', 't': [6.6, 6.9], 'type': 'avatar full-frame'},
             {'id': 'U6', 't': [6.9, 12.5], 'type': 'recording + pip', 'screenrec': 'R3', 'anchor': 'find', 'crop_top': 0.28, 'use': 'R3 0.5-4.0 s'},
         ]},
        {'name': 'daily', 'ref_window': [12.5, 15.0], 'line': 'Then run it every morning on your own laptop.',
         'on_screen_text': 'THEN RUN IT | {red}EVERY MORNING / {white}*on your own laptop*',
         'units': [
             {'id': 'U7', 't': [12.5, 15.0], 'type': 'avatar + recording', 'screenrec': 'R1', 'focus_y': 0.0, 'fx': {'check': True},
              'mask': [{'box': [0, 0, 0.13, 0.075], 'color': '#000000'}], 'use': 'R1 2.4-6.0 s'},
         ]},
        {'name': 'cta_keyword', 'ref_window': [15.0, 16.7], 'line': "Comment harvest and I'll send it!", 'on_screen_text': '',
         'units': [{'id': 'U8', 't': [15.0, 16.7], 'type': 'avatar full-frame'}]},
    ],
}


def hcaps():
    return make_caps(words=' '.join(b['line'] for b in HSPEC['beats']).split())


def hbuild(caps=None, spec=None, **kw):
    kw.setdefault('plans', PLANS)
    kw.setdefault('probe', lambda p: None)
    return ex.build_props('/nonexistent', spec or HSPEC, caps or hcaps(), durations=DURATIONS, **kw)


def test_harvest_theme_reaches_the_props_and_the_default_stays_untouched():
    p = hbuild()
    assert p['theme'] == 'harvest' and p['meta']['theme'] == 'harvest'
    assert p['headlines'] == [] and p['chunks'] and p['tail'] is None
    assert not any(k.startswith('_') for s in p['scenes'] for k in s)
    d = build()
    assert 'theme' not in d and 'chunks' not in d and d['scenes'][0].get('flipIn') is True


def test_harvest_units_map_to_reference_scene_types():
    p = hbuild()
    assert [s['type'] for s in p['scenes']] == ['split', 'card', 'avatar', 'stat', 'avatar', 'pip', 'split', 'avatar']
    u1, u4, u6, u7 = (scene(p, x) for x in ('U1', 'U4', 'U6', 'U7'))
    assert u1['card'] == {'kind': 'title', 'text': 'GPT-6', 'accent': 'ASTRA'} and u1['tone'] == 'dark' and 'recording' not in u1
    assert u4['card']['kind'] == 'stars' and u4['captionY'] == 0.66 and 'recording' not in u4
    assert u6['recording']['src'] == 'job/shots/R3.mp4' and u6['recording']['cropTop'] == 0.28
    assert u7['recording']['focusY'] == 0.0 and u7['fx'] == {'check': True}
    assert u7['recording']['masks'] == [{'box': [0.0, 0.0, 0.13, 0.075], 'color': '#000000'}]
    assert not any(s.get('flipIn') for s in p['scenes'])                  # the reference opens on a split
    assert 'focusY' not in (scene(build(), 'U2')['recording'])             # default specs carry no framing


def test_harvest_chunks_hard_cut_on_our_words_with_colours_and_serif_lines():
    caps = hcaps()
    pages = ex.caption_pages('{teal}OF COMPANIES / *to reach out to* | {white}*website* | {red}NOT PAYING')
    assert pages[0] == [{'words': ['OF', 'COMPANIES'], 'serif': False, 'color': 'teal'},
                        {'words': ['to', 'reach', 'out', 'to'], 'serif': True, 'color': 'teal'}]
    assert pages[1][0]['color'] == 'white' and pages[1][0]['serif'] and pages[2][0]['color'] == 'red'
    p = hbuild(caps)
    ch = p['chunks']
    wake = next(c for c in ch if c['lines'][0]['text'] == 'CAN NOW WAKE UP')
    # "ASTRA" alone is said in 220 ms: it holds CHUNK_MIN_MS and the next chunk starts that much later
    assert wake['startMs'] == max(start_of(caps, 'can'), start_of(caps, 'Astra') + ex.CHUNK_MIN_MS)
    assert wake['lines'][1]['startMs'] == start_of(caps, 'every')                 # the serif joins later
    assert wake['lines'][1]['serif'] and wake['lines'][1]['color'] == 'teal'
    stars = next(c for c in ch if c['lines'][0]['text'] == '31,000+ STARS')
    # "31,000+" rides on the spoken number, not on "stars", and starts with its scene (snapped onto the cut 20 ms before)
    assert stars['startMs'] == scene(p, 'U4')['startMs'] and 0 < start_of(caps, 'thirty-one') - stars['startMs'] <= ex.CHUNK_SNAP_MS
    assert all(a['endMs'] <= b['startMs'] for a, b in zip(ch, ch[1:]))
    for c in ch:                                                   # never stale: gone within the hold after its words
        last = max(w['endMs'] for w in caps if w['startMs'] < c['endMs'])
        assert c['endMs'] <= last + ex.CHUNK_HOLD_MS
    assert not any(c['startMs'] < scene(p, 'U7')['endMs'] and c['endMs'] > scene(p, 'U7')['endMs'] for c in ch)   # beat end
    assert all(c['endMs'] <= p['cta']['atMs'] for c in ch)         # the composer types the keyword: no captions
    assert not any('find' in l['text'].lower() for c in ch for l in c['lines'])   # typed prompt: no burned captions


def test_harvest_scene_changes_take_the_jump_cuts_and_the_cta_waits_for_the_close_up():
    caps = hcaps()
    base = hbuild(caps)
    u3 = scene(base, 'U3')
    c1 = u3['startMs'] + 70                                        # a cut just after a scene change: the change moves onto it
    c2 = scene(base, 'U6')['startMs'] + 40                         # just after the PiP starts: "Like," joins the talking head
    p = hbuild(caps, cuts=[c1, c2])
    assert scene(p, 'U3')['startMs'] == c1 and scene(p, 'U6')['startMs'] == c2
    talk = [{'id': 'A', 'type': 'avatar', 'startMs': 0, 'endMs': 900}, {'id': 'B', 'type': 'avatar', 'startMs': 900, 'endMs': 1240},
            {'id': 'C', 'type': 'pip', 'startMs': 1240, 'endMs': 5000}]
    merged = ex._snap_to_cuts(ex._merge_same_shots(talk), [1280])   # "like," (340 ms) is the same shot as the head before it
    assert [(x['id'], x['startMs'], x['endMs']) for x in merged] == [('A', 0, 1280), ('C', 1280, 5000)]
    assert all(a['endMs'] == b['startMs'] and b['endMs'] > b['startMs'] for a, b in zip(p['scenes'], p['scenes'][1:]))
    p2 = hbuild(caps, cuts=[scene(base, 'U7')['startMs']])         # a cut exactly on a scene change: nothing to split
    assert len(p2['scenes']) == len(base['scenes'])
    assert p['cta']['keyword'] == 'HARVEST' and p['cta']['atMs'] == start_of(caps, 'Comment')


def test_harvest_reel_never_runs_past_the_take():
    caps = hcaps()
    take = caps[-1]['endMs'] + 300
    p = hbuild(caps, probe=lambda path: take if str(path).endswith('avatar_main.mp4') else None)
    assert p['durationMs'] == take // 40 * 40 == p['scenes'][-1]['endMs']
    assert hbuild(caps)['durationMs'] == caps[-1]['endMs'] + ex.END_HOLD_MS        # take length unknown: the usual hold


def test_harvest_content_swap_splits_a_recording_scene_at_its_word():
    caps = hcaps()
    spec = json.loads(json.dumps(HSPEC))
    u7 = spec['beats'][3]['units'][0]
    u7['swap'] = {'at': 'every', 'focus_y': 1.0}                  # same recording: the 2.4-6.0 s range is shared
    p = hbuild(caps, spec=spec)
    a, b = scene(p, 'U7'), scene(p, 'U7b')
    assert a['endMs'] == b['startMs'] == cut_before(caps, 'every', 2) and b['swap'] is True and 'swap' not in a
    assert a['type'] == b['type'] == 'split' and 'fx' not in b and a['fx'] == {'check': True}   # the check plays once
    assert b['recording']['src'] == a['recording']['src'] and b['recording']['focusY'] == 1.0 and a['recording']['focusY'] == 0.0
    out_a = a['recording']['inMs'] + (a['endMs'] - a['startMs']) * a['recording'].get('playbackRate', 1.0)
    assert abs(out_a - b['recording']['inMs']) <= 2                # the second part picks up where the first left off
    assert a['recording']['inMs'] == 2400 and abs(window(b)[1] - 6000) <= 2
    u7['swap'] = {'at': 'every', 'screenrec': 'R3', 'use': 'R3 1.0-3.0 s', 'tone': 'dark'}   # another recording
    p = hbuild(caps, spec=spec)
    a, b = scene(p, 'U7'), scene(p, 'U7b')
    assert b['recording']['src'] == 'job/shots/R3.mp4' and b['recording']['inMs'] == 1000 and b['tone'] == 'dark'
    assert abs(window(a)[1] - 6000) <= 2 and abs(window(b)[1] - 3000) <= 2
    assert not any(x['src'].endswith('whoosh.wav') and abs(x['atMs'] + ex.WHOOSH_LEAD_MS - b['startMs']) < 5 for x in p['sfx'])
    u7['swap'] = {'at': 'banana'}                                  # not said in the scene: nothing changes
    assert [s['id'] for s in hbuild(caps, spec=spec)['scenes']] == [s['id'] for s in hbuild(caps)['scenes']]


def test_harvest_short_chunks_hold_or_merge_and_snap_onto_scene_changes():
    line = lambda text, t, **kw: {'text': text, 'startMs': t, 'serif': False, 'color': 'white', **kw}
    chunks = [{'startMs': 0, 'endMs': 250, 'lines': [line('RUN IT', 0)]},
              {'startMs': 250, 'endMs': 900, 'lines': [line('EVERY DAY', 250)]},
              {'startMs': 900, 'endMs': 1160, 'lines': [line('AND BECAUSE', 900)]},
              {'startMs': 1160, 'endMs': 1900, 'lines': [line('IT CAN RUN', 1160), line('locally', 1400, serif=True, color='teal')]}]
    out = ex.hold_short_chunks(chunks)
    assert out[0]['lines'][0]['text'] == 'RUN IT EVERY DAY' and out[0]['endMs'] == 900      # fits one line: merged
    held, nxt = out[1], out[2]
    assert held['lines'][0]['text'] == 'AND BECAUSE' and held['endMs'] == 900 + ex.CHUNK_MIN_MS == nxt['startMs']
    assert nxt['lines'][0]['startMs'] == nxt['startMs'] and nxt['lines'][1]['startMs'] == 1400  # the serif keeps its word
    assert all(c['endMs'] - c['startMs'] >= ex.CHUNK_MIN_MS for c in out)
    # Snap: an edge within 3 frames of a scene change moves onto it, with the line that opened the chunk.
    snapped = ex.snap_chunks([{'startMs': 1000, 'endMs': 1560, 'lines': [line('A', 1000)]},
                              {'startMs': 1560, 'endMs': 2400, 'lines': [line('B', 1560), line('c', 1900, serif=True)]}], [1480, 2000])
    assert [(c['startMs'], c['endMs']) for c in snapped] == [(1000, 1480), (1480, 2400)]
    assert snapped[1]['lines'][0]['startMs'] == 1480 and snapped[1]['lines'][1]['startMs'] == 1900
    one = ex.snap_chunks([{'startMs': 1900, 'endMs': 2150, 'lines': [line('X', 1900)]}], [2000])
    assert [(c['startMs'], c['endMs']) for c in one] == [(2000, 2150)]                       # keeps its larger side
    short = ex.snap_chunks([{'startMs': 0, 'endMs': 700, 'lines': [line('A', 0)]},
                            {'startMs': 700, 'endMs': 1100, 'lines': [line('B', 700)]},
                            {'startMs': 1100, 'endMs': 1800, 'lines': [line('C', 1100)]}], [1010])
    assert short[1]['startMs'] == 1010 - ex.CHUNK_MIN_MS and short[1]['endMs'] == 1010 == short[2]['startMs']
    assert short[0]['endMs'] == short[1]['startMs'] and short[1]['lines'][0]['startMs'] == short[1]['startMs']


def test_harvest_chunks_never_flash_across_a_cut_or_under_the_minimum():
    caps = hcaps()
    p = hbuild(caps)
    bounds = [s['startMs'] for s in p['scenes'][1:]]
    for c in p['chunks']:
        assert c['endMs'] - c['startMs'] >= ex.CHUNK_MIN_MS or any(c['endMs'] == b for b in bounds)
        assert min(l['startMs'] for l in c['lines']) == c['startMs']          # never an empty first frame
        for b in bounds:
            assert not (c['startMs'] < b < c['endMs'] and min(b - c['startMs'], c['endMs'] - b) <= ex.CHUNK_SNAP_MS)


def test_harvest_zooms_never_crop_into_the_page_content():
    w, h = 100, 60
    bg, ink = (13, 17, 23), (230, 237, 243)
    buf = bytearray(bytes(bg) * (w * h))
    for y in range(20, 40):
        for x in list(range(8, 30)) + list(range(50, 91)):
            buf[3 * (y * w + x):3 * (y * w + x) + 3] = bytes(ink)
    assert ex.content_span(bytes(buf), w, h) == [0.08, 0.91]
    assert ex.content_span(bytes(buf), w, h, 0.0, 0.3) is None or ex.content_span(bytes(buf), w, h, 0.0, 0.3) == [0.08, 0.91]
    assert ex.content_span(bytes(buf), w, h, 0.7, 1.0) is None
    zs = ex.harvest_zooms([{'atMs': 0, 'endMs': 900, 'scale': 1.6, 'box': [0.3, 0.4, 0.2, 0.05], 'content': [0.08, 0.91]},
                           {'atMs': 0, 'endMs': 900, 'scale': 1.6, 'box': [0.3, 0.4, 0.2, 0.05], 'content': [0.02, 0.99]},
                           {'atMs': 0, 'endMs': 900, 'scale': 1.4, 'box': [0.3, 0.4, 0.2, 0.05]}])
    assert len(zs) == 2
    assert zs[0]['scale'] == round(1 / (0.83 + 2 * ex.CONTENT_PAD), 3) and zs[0]['content'] == [0.08, 0.91]
    assert zs[1]['scale'] == round(1 + 0.4 * ex.HARVEST_PUSH, 3)        # no span known: the usual half depth
    plan = {'actions': [{'highlight': {'selector': 'x', 'ms': 1000}}]}
    plain = bytes((13, 17, 23)) * (ex.HL_W * ex.HL_H)
    hl = ex.highlight_boxes(__file__, plan, grab=lambda v, t: plain)
    assert hl[0]['box'] is None and 'content' not in hl[0]              # no outline: no zoom, no span
    framed = _frame_with_outline(ex.HL_W, ex.HL_H, (100, 300, 300, 340))
    hl = ex.highlight_boxes(__file__, plan, grab=lambda v, t: framed)
    x0, x1 = hl[0]['content']
    assert hl[0]['box'] and x0 <= 100 / ex.HL_W + 0.01 and x1 >= 300 / ex.HL_W - 0.01   # the span holds the box


def test_harvest_sfx_keeps_pops_off_words_and_the_cta_tick_under_the_voice():
    caps = hcaps()
    p = hbuild(caps)
    words = [(c['startMs'], c['endMs']) for c in caps]
    for x in p['sfx']:
        if x['src'].endswith('pop.wav') and x['volume'] == ex.POP_VOLUME:
            assert not any(a < x['atMs'] < b for a, b in words)
    tick = next(x for x in p['sfx'] if x['src'].endswith('tick.wav'))
    tap = p['cta']['atMs'] + p['cta']['timing']['tapMs']
    assert tick['volume'] == ex.CTA_TICK_VOLUME == 0.12 and tick['atMs'] == tap // ex.FRAME_MS * ex.FRAME_MS
    scenes = [{'id': 'A', 'type': 'avatar', 'startMs': 0, 'endMs': 1000},
              {'id': 'B', 'type': 'stat', 'startMs': 1000, 'endMs': 3000, 'card': {'kind': 'stars'}}]
    on_word = ex._harvest_sfx(scenes, None, [(0, 2000)])                 # the card lands mid-word: no pop at all
    assert not any(x['src'].endswith('pop.wav') for x in on_word)
    in_gap = ex._harvest_sfx(scenes, None, [(0, 950), (1300, 2000)])
    assert [x['volume'] for x in in_gap if x['src'].endswith('pop.wav')] == [ex.POP_VOLUME]


def test_harvest_cta_timing_matches_the_reference_motion_and_drives_the_sfx():
    t = ex.cta_timing('HARVEST')
    type_end = t['typeStartMs'] + 7 * t['charMs']
    assert t['charMs'] <= 50 and type_end <= 400                       # typed in ~0.33 s like the reference
    assert t['handStartMs'] == type_end and t['handAtMs'] - t['handStartMs'] == 300   # the hand rises as typing ends
    assert t['tapMs'] - t['handAtMs'] == 60                            # no parked hand before the tap
    assert t['notifMs'] - t['shrinkMs'] == ex.CTA_SHRINK_MS and t['shrinkMs'] > t['tapMs']
    assert 850 <= t['notifMs'] <= 950                                  # the notification lands ~0.9 s after the composer
    assert ex.cta_timing('GO')['notifMs'] < t['notifMs']               # a shorter keyword types faster
    p = hbuild()
    assert p['cta']['timing'] == t
    at = p['cta']['atMs']
    # Speech runs on through the notification: its pop is dropped (masked anyway); in a gap it plays there.
    on_word = ex._harvest_sfx([], p['cta'], [(at - 500, at + 3000)])
    assert [x['src'] for x in on_word] == ['job/sfx_tick.wav']
    in_gap = ex._harvest_sfx([], p['cta'], [(at - 500, at + t['notifMs'] - 100), (at + t['notifMs'] + 200, at + 3000)])
    pops = [x for x in in_gap if x['src'].endswith('pop.wav')]
    assert len(pops) == 1 and abs(pops[0]['atMs'] - (at + t['notifMs'])) <= ex.POP_SNAP_MS


def test_harvest_card_pop_never_plays_before_its_card_and_sfx_start_on_frames():
    # The gap before the next word ends 10 ms after the cut: the pop moves onto the cut frame (its tail meets the word).
    assert ex.card_pop_time(8760, [(8000, 8600), (8770, 9500)]) == 8760
    # ...but not when the word starts right on the cut (the pop's head would sit on it).
    assert ex.card_pop_time(8760, [(8000, 8600), (8755, 9500)]) is None
    assert ex.card_pop_time(1000, [(0, 950), (1300, 2000)]) >= 1000   # a gap after the cut: as before
    scenes = [{'id': 'A', 'type': 'avatar', 'startMs': 0, 'endMs': 8760},
              {'id': 'B', 'type': 'text', 'startMs': 8760, 'endMs': 10000, 'card': {'kind': 'logo', 'name': 'X'}},
              {'id': 'C', 'type': 'avatar', 'startMs': 10000, 'endMs': 35895},
              {'id': 'D', 'type': 'text', 'startMs': 35895, 'endMs': 37000, 'card': {'kind': 'kinetic', 'small': 'a', 'big': 'b'}}]
    sfx = ex._harvest_sfx(scenes, None, [(0, 8600), (8770, 35700), (35910, 37000)])
    pops = [x['atMs'] for x in sfx if x['src'].endswith('pop.wav')]
    assert pops[0] == 8760 and all(x['atMs'] % ex.FRAME_MS == 0 for x in sfx)
    assert pops[1] == 35880 and pops[1] + ex.POP_HEAD_MS <= 35910       # floored onto a frame, never later


def _env_from(spans, total_ms, loud=-18.0, quiet=-70.0, hop=ex.ONSET_HOP_MS):
    env = [quiet] * (total_ms // hop)
    for a, b in spans:
        for k in range(a // hop, min(len(env), b // hop)):
            env[k] = loud
    return env


def test_refine_word_starts_moves_words_whisper_opened_on_the_pause():
    caps = [{'text': ' AI,', 'startMs': 0, 'endMs': 500}, {'text': ' and', 'startMs': 500, 'endMs': 1170},
            {'text': ' it', 'startMs': 1170, 'endMs': 1300}]
    env = _env_from([(0, 520), (870, 1300)], 1500)                     # the voice pauses 520-870 after "AI,"
    out, moved = ex.refine_word_starts(caps, env)
    assert out[1]['startMs'] == 870 - ex.ONSET_LEAD_MS and out[1]['endMs'] == 1170 and moved == [(1, 500, 840)]
    assert caps[1]['startMs'] == 500                                   # the input is not touched
    # Whisper put the word on the previous word's tail and left the pause after it: it moves into the pause's end.
    caps2 = [{'text': ' seven,', 'startMs': 0, 'endMs': 480}, {'text': ' and', 'startMs': 480, 'endMs': 520},
             {'text': ' keep', 'startMs': 1000, 'endMs': 1300}]
    out2, _ = ex.refine_word_starts(caps2, _env_from([(0, 520), (950, 1300)], 1500))
    assert out2[1]['startMs'] == 920 and out2[1]['endMs'] == 980 and out2[2]['startMs'] == 1000
    # A word that really starts on its time (a rise) or a stop-consonant gap (< ONSET_MIN_SIL_MS) stays.
    caps3 = [{'text': ' pages,', 'startMs': 0, 'endMs': 400}, {'text': ' and', 'startMs': 600, 'endMs': 800},
             {'text': ' keep', 'startMs': 800, 'endMs': 1100}]
    assert ex.refine_word_starts(caps3, _env_from([(0, 400), (600, 1100)], 1500))[1] == []
    assert ex.refine_word_starts(caps, _env_from([(0, 520), (600, 1300)], 1500))[1] == []
    # Only clause openers are candidates: "and" after "AI," in the script (Whisper dropped the comma).
    beats = [{'line': 'It is called ScrapeGraph AI, and it already has stars.'}]
    words = [{'text': f' {w}', 'startMs': 100 * i, 'endMs': 100 * i + 90} for i, w in enumerate('It is called ScrapeGraph AI and it already has stars.'.split())]
    assert ex.clause_starts(beats, words) == {5}
    assert ex.refine_word_starts(caps, env, candidates={2})[1] == []


def test_harvest_captions_and_cuts_follow_the_measured_onset():
    real = hcaps()
    i = next(k for k, c in enumerate(real) if ex.clean(c['text']) == 'and')
    for c in real[i:]:                                                 # the voice pauses 420 ms before "and"
        c['startMs'] += 400
        c['endMs'] += 400
    env = _env_from([(c['startMs'], c['endMs'] + 20) for c in real], real[-1]['endMs'] + 500)
    whisper = [dict(c) for c in real]
    whisper[i]['startMs'] = whisper[i - 1]['endMs']                    # Whisper opens "and" on the pause
    spec = json.loads(json.dumps(HSPEC))
    spec['beats'][0]['line'] = 'Astra can now wake up every morning, and hand you a fresh list!'
    plain = hbuild(whisper, spec=spec, envelope=False)
    p = hbuild(whisper, spec=spec, envelope=env)
    onset = real[i]['startMs'] - ex.ONSET_LEAD_MS
    assert p['meta']['onsets'] == [{'word': 'and', 'fromMs': whisper[i]['startMs'], 'toMs': onset}]
    u2 = scene(p, 'U2')
    assert u2['startMs'] >= onset - ex.LEAD_MS and u2['startMs'] - scene(plain, 'U2')['startMs'] >= 300
    chunk = next(c for c in p['chunks'] if c['lines'][0]['text'].startswith('AND HAND'))
    assert chunk['startMs'] == u2['startMs']                           # the caption still changes on the cut
    before = next(c for c in p['chunks'] if c['endMs'] == chunk['startMs'])
    assert before['lines'][0]['text'] == 'CAN NOW WAKE UP'             # the previous chunk holds until then


def test_harvest_full_bleed_screen_pill_override_and_recording_size():
    spec = json.loads(json.dumps(HSPEC))
    u2 = spec['beats'][0]['units'][1]
    u2.update({'layout': 'bleed', 'push': 1.04})
    spec['beats'][3]['units'][0]['caption_pill'] = 'dark'
    p = hbuild(spec=spec, sizes={'R1': (1080, 1920), 'R3': (1080, 1350)})
    s2, s6, s7 = scene(p, 'U2'), scene(p, 'U6'), scene(p, 'U7')
    assert s2['bleed'] is True and s2['push'] == 1.04 and s2['recording']['size'] == [1080, 1920]
    assert 'size' not in s6['recording']                               # the usual 4:5 recordings carry no size
    assert s7['pill'] == 'dark' and 'pill' not in s2
    assert not any('bleed' in s for s in hbuild()['scenes'])
    split = json.loads(json.dumps(HSPEC))
    split['beats'][3]['units'][0]['layout'] = 'bleed'                  # only a full-frame recording can bleed
    assert 'bleed' not in scene(hbuild(spec=split), 'U7')
    assert hbuild()['music']['duckTo'] == 0.08
