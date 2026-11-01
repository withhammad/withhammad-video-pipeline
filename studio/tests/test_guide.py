import json

from app import guide


def make(tmp_path, **over):
    d = tmp_path / 'guides' / 'g'; d.mkdir(parents=True)
    pub = tmp_path / 'public'; (pub / 's').mkdir(parents=True); (pub / 's' / 'a.png').write_bytes(b'x')
    item = {'kind': 'item', 'n': 1, 'title': 't', 'what': 'w', 'bestFor': 'b', 'shot': 's/a.png'}
    pages = [{'kind': 'cover'}] + [item] * 5 + [{'kind': 'cta', 'stamp1': 'Comment KEY', 'stamp2': 'x'}]
    spec = {'docTitle': 'D', 'keyword': 'KEY', 'source': 'site, 1 Nov 2026', 'instagram': pages, 'linkedin': pages, **over}
    (d / 'guide.json').write_text(json.dumps(spec))
    (d / 'captions.json').write_text(json.dumps({'title': 'T', 'instagram': 'Comment KEY. Follow @withhammad.ai #a',
                                                 'facebook': 'https://withhammad.com/x', 'linkedin': 'https://withhammad.com/x'}))
    return tmp_path / 'guides', pub


def test_good_guide_passes(tmp_path):
    base, pub = make(tmp_path)
    assert guide.check('g', base, pub)['errors'] == []


def test_missing_screenshot_keyword_and_cta_fail(tmp_path):
    bad = [{'kind': 'cover'}] + [{'kind': 'item', 'n': 1, 'title': 't', 'what': 'w', 'bestFor': 'b', 'shot': 's/missing.png'}] * 5 + [{'kind': 'more'}]
    base, pub = make(tmp_path, instagram=bad)
    errs = ' '.join(guide.check('g', base, pub)['errors'])
    assert 'not found' in errs and 'last page must be the cta' in errs


def test_item_needs_shot_or_prompt(tmp_path):
    pages = [{'kind': 'cover'}] + [{'kind': 'item', 'n': 1, 'title': 't', 'what': 'w', 'bestFor': 'b'}] * 5 + [{'kind': 'cta', 'stamp1': 'KEY'}]
    base, pub = make(tmp_path, linkedin=pages)
    assert any('screenshot' in e for e in guide.check('g', base, pub)['errors'])
