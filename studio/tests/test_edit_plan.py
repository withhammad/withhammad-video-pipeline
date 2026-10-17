import pytest

from app import edit_plan

CAPS = [{'text': w, 'startMs': i * 500, 'endMs': i * 500 + 400, 'timestampMs': i * 500 + 200, 'confidence': 1}
        for i, w in enumerate(['Hello', 'there.', "It's", 'called', 'REA.', 'Then', 'build', 'it.', 'Comment', 'NOW', 'and', 'it', 'works'])]
TEMPLATES = [
    {'anchor': None, 'scene': {'type': 'title', 'line1': 'A', 'line2': 'B', 'image': 'job/repo.png'}},
    {'anchor': "it's", 'scene': {'type': 'split', 'image': 'job/site.png', 'highlight': {'x': 1, 'y': 2, 'w': 3, 'h': 4, 'atWord': 'rea'}}},
    {'anchor': 'then', 'scene': {'type': 'broll', 'image': 'job/x.png'}},
    {'anchor': 'comment', 'scene': {'type': 'end', 'word': 'comment', 'keyword': 'NOW'}},
]


def test_scenes_are_contiguous_anchored_and_cover_the_last_frame():
    e = edit_plan.build(CAPS, TEMPLATES, 7000, title_insert='job/title.webm')
    s = e['scenes']
    assert [x['startMs'] for x in s] == [0, 1000, 2500, 4000]
    assert all(a['endMs'] == b['startMs'] for a, b in zip(s, s[1:]))
    assert s[-1]['endMs'] > 7000 and s[-1]['keyword'] == 'NOW'
    assert s[0]['hideText'] is True and e['inserts'][0]['src'] == 'job/title.webm' and e['inserts'][0]['startMs'] == -600


def test_highlight_at_word_becomes_delay():
    s = edit_plan.build(CAPS, TEMPLATES, 7000)['scenes'][1]
    assert s['highlight'] == {'x': 1, 'y': 2, 'w': 3, 'h': 4, 'delayMs': 1000}   # 'REA.' at 2000 - scene 1000


def test_sfx_follow_cuts_whoosh_peaks_on_cut():
    sfx = edit_plan.build(CAPS, TEMPLATES, 7000)['sfx']
    assert sfx[0]['src'].endswith('pop.wav') and sfx[0]['atMs'] == 160
    assert [x['atMs'] for x in sfx if 'whoosh' in x['src']] == [1000 - 270, 2500 - 270]
    assert sfx[-1]['src'].endswith('riser.wav') and sfx[-1]['atMs'] == 4000 - 1200


def test_cut_inside_continuous_speech_gets_no_sfx():
    speech = [(0, 600), (900, 6500)]   # gap before the 1000 ms cut ends at 900 (inside the whoosh window); none before 2500
    sfx = edit_plan.build(CAPS, TEMPLATES, 7000, speech=speech)['sfx']
    assert [x['src'].split('_')[-1] for x in sfx] == ['pop.wav', 'riser.wav']
    sfx = edit_plan.build(CAPS, TEMPLATES, 7000, speech=[(0, 650), (1000, 6500)])['sfx']   # [730, 940] is free
    assert [x['src'].split('_')[-1] for x in sfx] == ['pop.wav', 'whoosh.wav', 'riser.wav']


def test_missing_anchor_raises():
    with pytest.raises(ValueError, match='not found'):
        edit_plan.build(CAPS, [{'anchor': None, 'scene': {'type': 'end', 'word': 'x'}}, {'anchor': 'zzz', 'scene': {'type': 'end', 'word': 'y'}}], 7000)


def test_snap_onsets_moves_early_words_to_voice_onsets():
    caps = [{'text': 'free,', 'startMs': 1000, 'endMs': 1600}, {'text': 'open', 'startMs': 1600, 'endMs': 2000}]
    out = edit_plan.snap_onsets(caps, [(1180, 1500), (1650, 2100)])
    assert out[0]['startMs'] == 1180 and out[0]['endMs'] == 1500
    assert out[1]['startMs'] == 1650


def test_srt_cues_break_at_sentences_and_extend_last():
    srt = edit_plan.to_srt(CAPS, duration_ms=7000)
    cues = srt.strip().split('\n\n')
    assert cues[0] == '1\n00:00:00,000 --> 00:00:00,900\nHello there.'
    assert cues[1].endswith("It's called REA.") and cues[2].endswith('Then build it.')
    assert cues[-1].split('\n')[1].endswith('00:00:07,000') and 'Comment NOW and it works' in cues[-1]


def test_srt_wraps_long_cues_to_two_lines():
    words = 'Then it helps you rebuild that feature in your own product today.'.split()
    caps = [{'text': w, 'startMs': i * 300, 'endMs': i * 300 + 250} for i, w in enumerate(words)]
    body = edit_plan.to_srt(caps).split('\n', 2)[2].strip()
    lines = body.split('\n')
    assert len(lines) == 2 and all(len(l) <= 42 for l in lines)


def test_srt_merge_never_builds_giant_cues():
    words = 'Your Claude Code can now take apart an app on your computer and show you exactly how any feature works.'.split()
    caps = [{'text': w, 'startMs': i * 200, 'endMs': i * 200 + 180} for i, w in enumerate(words)]
    caps += [{'text': "It's", 'startMs': 5000, 'endMs': 5200}, {'text': 'called', 'startMs': 5200, 'endMs': 5400},
             {'text': 'REA,', 'startMs': 5400, 'endMs': 5600}, {'text': 'free,', 'startMs': 6000, 'endMs': 6200},
             {'text': 'open', 'startMs': 6400, 'endMs': 6600}, {'text': 'source.', 'startMs': 6600, 'endMs': 6900}]
    blocks = edit_plan.to_srt(caps).strip().split('\n\n')
    cues = [c.split('\n', 2)[2].replace('\n', ' ') for c in blocks]
    assert all(len(c) <= 84 for c in cues)
    assert cues[-2:] == ["It's called REA,", 'free, open source.']
    assert blocks[-2].split('\n')[1] == '00:00:05,000 --> 00:00:05,800'   # 600 ms cue extended to 0.8 s


def test_closeup_beat_gets_a_cut_sound_not_a_riser():
    t = [TEMPLATES[0], {'anchor': 'called', 'scene': {'type': 'end', 'word': ''}}, TEMPLATES[3]]
    kinds = [x['src'].split('_')[-1] for x in edit_plan.build(CAPS, t, 7000)['sfx']]
    assert kinds == ['pop.wav', 'whoosh.wav', 'riser.wav']


def test_snap_moves_word_back_over_untranscribed_speech():
    caps = [{'text': 'product.', 'startMs': 1000, 'endMs': 1500}, {'text': 'Comment', 'startMs': 3500, 'endMs': 3900}]
    out = edit_plan.snap_onsets(caps, [(1000, 1500), (2000, 2450), (3500, 3900)])
    assert out[1]['startMs'] == 2000


def test_overrides_fix_specific_words():
    out = edit_plan.apply_overrides(CAPS, [{'word': 'it', 'occurrence': 2, 'startMs': 5555}])
    assert [c['startMs'] for c in out if c['text'] == 'it'] == [5500] or out[11]['startMs'] == 5555


def test_long_cue_splits_at_largest_pause():
    words = 'or an Android app you are allowed to inspect and it traces every single step'.split()
    caps, t = [], 0
    for w in words:
        if w == 'and':
            t += 420   # the real pause
        caps.append({'text': w, 'startMs': t, 'endMs': t + 250}); t += 280
    cues = [c.split('\n', 2)[2].replace('\n', ' ') for c in edit_plan.to_srt(caps).strip().split('\n\n')]
    assert cues[0].endswith('inspect') and cues[1].startswith('and it traces')
