import json
import time

import pytest

from app import youtube_keyword as yk

CHANNEL = 'UCJtrEDGg1R3kNe7t7PQFiEw'
RULES = [{'keyword': 'SCOPE', 'link': 'https://withhammad.com/resources/scope', 'dm': '', 'reply': '', 'media_ids': []}]


@pytest.fixture
def cred(tmp_path):
    client = tmp_path / 'client.json'
    client.write_text(json.dumps({'installed': {'client_id': 'cid', 'client_secret': 'sec'}}))
    oauth = tmp_path / 'yt.json'
    oauth.write_text(json.dumps({'refresh_token': 'rt', 'channel_id': CHANNEL, 'client_file': str(client),
                                 'scopes': ['https://www.googleapis.com/auth/youtube.upload', yk.SCOPE]}))
    return oauth


def thread(cid, author, text, author_channel='UCother', video='vid1'):
    return {'id': cid, 'snippet': {'videoId': video, 'totalReplyCount': 0, 'topLevelComment': {'snippet': {
        'videoId': video, 'authorDisplayName': author, 'authorChannelId': {'value': author_channel},
        'textDisplay': text, 'publishedAt': '2026-11-01T00:00:00Z'}}}}


def make_send(threads, log):
    def send(method, url, *, bearer, body=None, form=None):
        log.append((method, url, body))
        if url == yk.TOKEN_URL:
            return 200, {'access_token': 'tok', 'scope': f'{yk.SCOPE} other'}
        if '/commentThreads' in url:
            assert bearer == 'tok'
            return 200, {'items': threads}
        if '/comments?part=snippet' in url:
            return 200, {'id': 'reply-' + body['snippet']['parentId']}
        raise AssertionError(url)
    return send


def test_run_replies_once_skips_own_and_non_keyword(tmp_path, cred):
    log = []
    threads = [thread('c1', 'Sara', 'scope pls'), thread('c2', 'Me', 'SCOPE', author_channel=CHANNEL),
               thread('c3', 'Omar', 'great video'), thread('c4', 'Lee', 'Telescope')]
    state = tmp_path / 's.json'
    report = yk.run(state_path=state, credential=cred, send=make_send(threads, log), rules=RULES)
    assert [r['comment'] for r in report['replied']] == ['c1'] and report['skipped_own'] == 1
    posted = [b for m, u, b in log if m == 'POST' and b]
    assert posted == [{'snippet': {'parentId': 'c1', 'textOriginal': yk.REPLY.format(link=RULES[0]['link'])}}]
    assert json.loads(state.read_text())['replied']['c1']['reply_id'] == 'reply-c1'
    again = yk.run(state_path=state, credential=cred, send=make_send(threads, log), rules=RULES)
    assert again['replied'] == [] and again['already'] == 1


def test_dry_run_posts_nothing(tmp_path, cred):
    log = []
    report = yk.run(dry_run=True, state_path=tmp_path / 's.json', credential=cred,
                    send=make_send([thread('c1', 'Sara', 'SCOPE')], log), rules=RULES)
    assert len(report['replied']) == 1 and not [1 for m, u, b in log if '/comments?part' in u]
    assert not (tmp_path / 's.json').exists()


def test_missing_scope_is_refused(tmp_path, cred):
    def send(method, url, *, bearer, body=None, form=None):
        return 200, {'access_token': 'tok', 'scope': 'https://www.googleapis.com/auth/youtube.upload'}
    with pytest.raises(RuntimeError, match='force-ssl'):
        yk.run(state_path=tmp_path / 's.json', credential=cred, send=send, rules=RULES)
