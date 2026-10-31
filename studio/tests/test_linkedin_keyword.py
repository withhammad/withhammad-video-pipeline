import json
import time
from datetime import datetime, timezone

import pytest

from app import linkedin_keyword as lk

RULES = [{'keyword': 'SCOPE', 'link': 'https://withhammad.com/resources/scope', 'dm': '', 'reply': '', 'media_ids': []}]


@pytest.fixture
def cred(tmp_path):
    p = tmp_path / 'linkedin-oauth.json'
    p.write_text(json.dumps({'access_token': 'tok', 'expires_at_unix': time.time() + 10 ** 6,
                             'member_sub': 'yWP7me7dep', 'scopes': ['openid', 'profile', 'w_member_social']}))
    return p


def test_watched_posts_window_and_manual(tmp_path):
    jobs = tmp_path / 'jobs'
    for name, at in (('old', '2026-09-01'), ('new', '2026-10-25')):
        d = jobs / name; d.mkdir(parents=True)
        (d / 'published.json').write_text(json.dumps({'x': {'linkedin': {'urn': f'urn:li:ugcPost:{name}', 'at': at}}}))
    state = {'replied': {}, 'extra_posts': [{'urn': 'urn:li:ugcPost:manual', 'url': None, 'at': '2026-10-30'}]}
    posts = lk.watched_posts(jobs, state=state, now=datetime(2026, 10, 31, tzinfo=timezone.utc))
    assert [p['urn'] for p in posts] == ['urn:li:ugcPost:new', 'urn:li:ugcPost:manual']
    assert posts[1]['url'] == 'https://www.linkedin.com/feed/update/urn:li:ugcPost:manual/'


def test_match_is_whole_word_case_insensitive():
    assert lk.match('scope please', RULES)['keyword'] == 'SCOPE'
    assert lk.match('telescope', RULES) is None
    assert lk.match('', RULES) is None


def test_reply_defaults_to_chrome_even_with_a_comment_urn(tmp_path, cred, monkeypatch):
    monkeypatch.setattr(lk, 'API_REPLY', False)
    out = lk.reply('urn:li:ugcPost:1', 'urn:li:comment:(urn:li:ugcPost:1,9)', 'Sara Ali', 'SCOPE',
                   state_path=tmp_path / 's.json', credential=cred, send=lambda *a: (201, '{}'), rules=RULES)
    assert out['status'] == 'type_in_chrome'


def test_reply_posts_once_and_records_state(tmp_path, cred, monkeypatch):
    monkeypatch.setattr(lk, 'API_REPLY', True)
    calls = []

    def send(url, headers, body):
        calls.append((url, headers, body)); return 201, '{"id":"c1"}'

    state = tmp_path / 'state.json'
    out = lk.reply('urn:li:ugcPost:1', 'urn:li:comment:(urn:li:ugcPost:1,9)', 'Sara Ali', 'SCOPE',
                   state_path=state, credential=cred, send=send, rules=RULES)
    assert out['status'] == 'replied' and out['message'].startswith('Sara, sent it: https://withhammad.com/resources/scope')
    url, headers, body = calls[0]
    assert url == 'https://api.linkedin.com/rest/socialActions/urn%3Ali%3AugcPost%3A1/comments'
    assert headers['Linkedin-Version'] == lk.LINKEDIN_VERSION and body['parentComment'].startswith('urn:li:comment')
    again = lk.reply('urn:li:ugcPost:1', 'urn:li:comment:(urn:li:ugcPost:1,9)', 'Sara Ali', 'SCOPE',
                     state_path=state, credential=cred, send=send, rules=RULES)
    assert again['status'] == 'already_replied' and len(calls) == 1
    assert lk.reply('urn:li:ugcPost:1', 'urn:li:comment:(urn:li:ugcPost:1,10)', 'X', 'nice reel',
                    state_path=state, credential=cred, send=send, rules=RULES)['status'] == 'no_keyword'


def test_reply_without_urn_hands_message_to_chrome_then_marks(tmp_path, cred):
    state = tmp_path / 's.json'
    boom = lambda *a: (_ for _ in ()).throw(AssertionError('API must not be called'))
    first = lk.reply('urn:li:ugcPost:1', '', 'Omar K', 'scope', state_path=state, credential=cred, send=boom, rules=RULES)
    assert first['status'] == 'type_in_chrome' and first['message'].startswith('Omar, sent it:')
    marked = lk.reply('urn:li:ugcPost:1', '', 'Omar K', 'scope', state_path=state, credential=cred, send=boom, rules=RULES,
                      mark_only=True)
    assert marked['status'] == 'replied' and marked['via'] == 'chrome'
    assert lk.reply('urn:li:ugcPost:1', '', 'omar k', 'SCOPE', state_path=state, credential=cred, send=boom,
                    rules=RULES)['status'] == 'already_replied'


def test_reply_raises_on_api_error(tmp_path, cred, monkeypatch):
    monkeypatch.setattr(lk, 'API_REPLY', True)
    with pytest.raises(RuntimeError):
        lk.reply('urn:li:ugcPost:1', 'urn:li:comment:(urn:li:ugcPost:1,9)', 'A', 'SCOPE', state_path=tmp_path / 's.json',
                 credential=cred, send=lambda *a: (403, '{"message":"no"}'), rules=RULES)
