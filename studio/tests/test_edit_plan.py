import pytest

from app import edit_plan

CAPS = [{'text': w, 'startMs': i * 500, 'endMs': i * 500 + 400, 'timestampMs': i * 500 + 200, 'confidence': 1}
        for i, w in enumerate(['Hello', 'there.', "It's", 'called', 'REA.', 'Then', 'build', 'it.', 'Comment', 'NOW', 'and', 'it', 'works'])]
TEMPLATES = [
    {'anchor': None, 'scene': {'type': 'title', 'line1': 'A', 'line2': 'B', 'image': 'job/repo.png'}},
    {'anchor': "it's", 'scene': {'type': 'split', 'image': 'job/site.png'}},
    {'anchor': 'then', 'scene': {'type': 'broll', 'image': 'job/x.png'}},
    {'anchor': 'comment', 'scene': {'type': 'end', 'word': 'comment'}},
]


def test_scenes_are_contiguous_and_anchored():
    e = edit_plan.build(CAPS, TEMPLATES, 7000, title_insert='job/title.webm')
    s = e['scenes']
    assert [x['startMs'] for x in s] == [0, 1000, 2500, 4000]
    assert all(a['endMs'] == b['startMs'] for a, b in zip(s, s[1:])) and s[-1]['endMs'] == 7000
    assert s[0]['hideText'] is True and e['inserts'][0]['src'] == 'job/title.webm'


def test_sfx_follow_cuts():
    sfx = edit_plan.build(CAPS, TEMPLATES, 7000)['sfx']
    assert sfx[0]['src'].endswith('pop.wav') and sfx[0]['atMs'] == 160
    assert [x['atMs'] for x in sfx if 'whoosh' in x['src']] == [900, 2400]
    assert sfx[-1]['src'].endswith('riser.wav') and sfx[-1]['atMs'] == 4000 - 1200


def test_missing_anchor_raises():
    with pytest.raises(ValueError, match='not found'):
        edit_plan.build(CAPS, [{'anchor': None, 'scene': {'type': 'end', 'word': 'x'}}, {'anchor': 'zzz', 'scene': {'type': 'end', 'word': 'y'}}], 7000)


def test_srt_cues():
    srt = edit_plan.to_srt(CAPS)
    assert srt.startswith("1\n00:00:00,000 --> 00:00:02,400\nHello there. It's called REA.")
    assert srt.count('-->') == 3 and 'Comment NOW and it works' in srt
