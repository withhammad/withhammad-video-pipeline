"""Instagram token status/refresh against a fake graph.instagram.com. No network, no real secrets."""
import json
import os
import stat
import subprocess
from urllib.parse import parse_qs, urlsplit

import pytest

from app import instagram_tokens as tokens

NOW = 1_800_000_000.0  # fixed clock
OLD_TOKEN = 'IGAAold-token-value-1234567890'
NEW_TOKEN = 'IGAAnew-token-value-0987654321'
DEAD_TOKEN = 'IGAAdead-token-value-5555555555'
SIXTY_DAYS = 60 * 86400
INVALIDATED = {'error': {'message': 'Error validating access token: The session has been invalidated because the user '
                                    'changed their password or Facebook has changed the session for security reasons.',
                         'type': 'OAuthException', 'code': 190, 'error_subcode': 460, 'fbtrace_id': 'Abc'}}


class FakeGraph:
    """Answers /refresh_access_token and /me; records each call as (path, query) so tests can check the token used."""

    def __init__(self, refresh=None, me=None):
        self.refresh = refresh or (200, {'access_token': NEW_TOKEN, 'token_type': 'bearer', 'expires_in': SIXTY_DAYS})
        self.me = me or (200, {'id': '1789', 'username': 'with.hammad', 'account_type': 'MEDIA_CREATOR'})
        self.calls = []

    def __call__(self, url):
        parts = urlsplit(url)
        assert parts.scheme == 'https' and parts.netloc == 'graph.instagram.com'
        query = {k: v[0] for k, v in parse_qs(parts.query).items()}
        self.calls.append((parts.path, query))
        if parts.path == '/refresh_access_token':
            assert query['grant_type'] == 'ig_refresh_token'
            return self.refresh
        if parts.path == '/me':
            return self.me(query) if callable(self.me) else self.me
        raise AssertionError(f'unexpected path {parts.path}')


@pytest.fixture
def secrets_dir(tmp_path, monkeypatch):
    folder = tmp_path / 'secrets'
    folder.mkdir(mode=0o700)
    monkeypatch.setattr(tokens, 'SECRETS', folder)
    return folder


def write_token(folder, username='with.hammad', user_id='1789', age_hours=72.0, token=OLD_TOKEN, **extra):
    path = folder / f"instagram-{username.replace('.', '-')}-oauth.json"
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump({'access_token': token, 'expires_in': SIXTY_DAYS, 'id': user_id, 'username': username,
                   'account_type': 'MEDIA_CREATOR',
                   'scopes': ['instagram_business_basic', 'instagram_business_content_publish'], **extra}, output)
    issued = NOW - age_hours * 3600
    os.utime(path, (issued, issued))
    return path


def run(argv, transport, capsys):
    code = tokens.main(argv, transport=transport, clock=lambda: NOW)
    out = capsys.readouterr()
    text = out.out + out.err
    assert not any(t in text for t in (OLD_TOKEN, NEW_TOKEN, DEAD_TOKEN))  # never print a token
    return code, text


def test_refresh_success_rewrites_file_atomically_with_0600(secrets_dir, capsys):
    path = write_token(secrets_dir)
    os.chmod(path, 0o644)  # even a loosened file comes back 0600
    graph = FakeGraph()
    code, text = run(['refresh', '--account', '@with.hammad'], graph, capsys)
    assert code == 0
    assert '@with.hammad: refreshed' in text
    data = json.loads(path.read_text())
    assert data['access_token'] == NEW_TOKEN
    assert data['expires_in'] == SIXTY_DAYS
    assert data['refreshed_at'] == tokens._iso(NOW)
    assert data['expires_at'] == tokens._iso(NOW + SIXTY_DAYS)
    assert data['username'] == 'with.hammad' and data['id'] == '1789' and data['scopes']  # other fields kept
    assert stat.S_IMODE(path.stat().st_mode) == 0o600
    assert [p.name for p in secrets_dir.iterdir()] == [path.name]  # no temp file left behind
    # refreshed with the old token, then the identity check ran on the new one
    assert graph.calls[0] == ('/refresh_access_token', {'grant_type': 'ig_refresh_token', 'access_token': OLD_TOKEN})
    assert graph.calls[1][0] == '/me' and graph.calls[1][1]['access_token'] == NEW_TOKEN


def test_refreshed_file_drives_the_next_expiry(secrets_dir, capsys):
    path = write_token(secrets_dir)
    tokens.refresh(path, FakeGraph(), clock=lambda: NOW)
    os.utime(path, (NOW + 5 * 86400, NOW + 5 * 86400))  # a later touch must not move the expiry
    row = tokens.check(path, FakeGraph(), clock=lambda: NOW + 10 * 86400)
    assert row['expires_at'] == tokens._iso(NOW + SIXTY_DAYS)
    assert round(row['days_left']) == 50
    assert row['valid'] is True


def test_too_young_token_is_skipped_without_a_request(secrets_dir, capsys):
    path = write_token(secrets_dir, age_hours=3)
    before = path.read_bytes()
    graph = FakeGraph()
    code, text = run(['refresh', '--account', 'with.hammad'], graph, capsys)
    assert code == 0
    assert 'skipped' in text and '24 h' in text and tokens._iso(NOW + 21 * 3600) in text
    assert graph.calls == []
    assert path.read_bytes() == before


def test_error_190_keeps_the_file_and_prints_reauthorize_steps(secrets_dir, capsys):
    path = write_token(secrets_dir, username='hammadagentic.ai', user_id='2827')
    before, mtime = path.read_bytes(), path.stat().st_mtime
    graph = FakeGraph(refresh=(400, INVALIDATED))
    code, text = run(['refresh', '--account', 'hammadagentic.ai'], graph, capsys)
    assert code == 1
    assert 'NOT refreshed' in text and 'code 190/460' in text and 'session has been invalidated' in text
    assert 'instagram_oauth.py --account hammadagentic.ai --no-open' in text
    assert 'separate Chrome profile' in text
    assert path.read_bytes() == before and path.stat().st_mtime == mtime
    assert [c[0] for c in graph.calls] == ['/refresh_access_token']  # no identity check on a dead token


def test_error_190_on_the_main_account_points_at_facebook_login(secrets_dir, capsys):
    write_token(secrets_dir)
    code, text = run(['refresh', '--all'], FakeGraph(refresh=(400, INVALIDATED)), capsys)
    assert code == 1
    assert 'instagram_oauth.py --account with.hammad`' in text and 'Log in with Facebook' in text


def test_identity_mismatch_after_refresh_stores_nothing(secrets_dir, capsys):
    path = write_token(secrets_dir)
    before = path.read_bytes()
    graph = FakeGraph(me=(200, {'id': '9', 'username': 'someone.else'}))
    code, text = run(['refresh', '--account', 'with.hammad'], graph, capsys)
    assert code == 1
    assert 'someone.else' in text and 'file kept' in text
    assert path.read_bytes() == before


def test_identity_check_retries_once_after_a_network_failure(secrets_dir):
    path = write_token(secrets_dir)
    attempts = []

    def flaky_me(query):
        attempts.append(query['access_token'])
        if len(attempts) == 1:
            raise tokens.TokenError('request to graph.instagram.com timed out after 30 s')
        return 200, {'id': '1789', 'username': 'with.hammad'}

    outcome = tokens.refresh(path, FakeGraph(me=flaky_me), clock=lambda: NOW)
    assert outcome['action'] == 'refreshed' and attempts == [NEW_TOKEN, NEW_TOKEN]
    assert json.loads(path.read_text())['access_token'] == NEW_TOKEN


def test_expired_token_is_not_sent(secrets_dir, capsys):
    path = write_token(secrets_dir, age_hours=61 * 24)
    graph = FakeGraph()
    with pytest.raises(tokens.TokenError) as caught:
        tokens.refresh(path, graph, clock=lambda: NOW)
    assert caught.value.reauthorize and graph.calls == []


def test_failed_write_leaves_the_old_file_and_no_temp(secrets_dir, monkeypatch):
    path = write_token(secrets_dir)
    before = path.read_bytes()

    def broken_replace(src, dst):
        raise OSError('disk full')

    monkeypatch.setattr(tokens.os, 'replace', broken_replace)
    with pytest.raises(OSError):
        tokens.refresh(path, FakeGraph(), clock=lambda: NOW)
    assert path.read_bytes() == before
    assert [p.name for p in secrets_dir.iterdir()] == [path.name]


def test_status_reports_days_left_validity_and_reauthorize(secrets_dir, capsys):
    write_token(secrets_dir, age_hours=24 * 1.5)
    write_token(secrets_dir, username='hammadagentic.ai', user_id='2827', age_hours=12, token=DEAD_TOKEN)
    graph = FakeGraph(me=lambda query: (400, INVALIDATED) if query['access_token'] == DEAD_TOKEN
                      else (200, {'id': '1789', 'username': 'with.hammad'}))
    code, text = run(['status'], graph, capsys)
    assert code == 1  # one token is dead
    lines = text.splitlines()
    dead = next(line for line in lines if line.startswith('@hammadagentic.ai'))
    live = next(line for line in lines if line.startswith('@with.hammad'))
    assert '59 days left' in dead and 'INVALID' in dead and 'code 190' in dead
    assert '58 days left' in live and 'valid: identity confirmed (@with.hammad)' in live
    assert 'instagram_oauth.py --account hammadagentic.ai --no-open' in text
    assert all(path == '/me' for path, _ in graph.calls)  # status never refreshes


def test_status_flags_a_token_for_another_account(secrets_dir, capsys):
    write_token(secrets_dir)
    code, text = run(['status'], FakeGraph(me=(200, {'id': '1789', 'username': 'hammadagentic.ai'})), capsys)
    assert code == 1 and 'INVALID' in text and 'belongs to @hammadagentic.ai' in text


def test_status_network_failure_is_unknown_not_invalid(secrets_dir, capsys):
    write_token(secrets_dir)

    def down(url):
        raise tokens.TokenError('request to https://graph.instagram.com failed (curl exit 6): Could not resolve host')

    code, text = run(['status'], down, capsys)
    assert code == 1 and 'UNKNOWN' in text and 'Re-authorize' not in text


def test_curl_transport_keeps_the_token_out_of_argv(monkeypatch):
    seen = {}

    def fake_run(args, input, text, capture_output, timeout):
        seen['args'], seen['input'] = args, input
        return subprocess.CompletedProcess(args, 0, stdout='{"id": "1789", "username": "with.hammad"}\n200', stderr='')

    monkeypatch.setattr(tokens.subprocess, 'run', fake_run)
    status, body = tokens.curl_transport(f'https://graph.instagram.com/me?fields=id&access_token={OLD_TOKEN}')
    assert (status, body) == (200, {'id': '1789', 'username': 'with.hammad'})
    assert seen['args'] == ['/usr/bin/curl', '--config', '-']
    assert OLD_TOKEN in seen['input'] and 'proto = "=https"' in seen['input']


def test_curl_transport_errors_are_scrubbed(monkeypatch):
    monkeypatch.setattr(tokens.subprocess, 'run', lambda *a, **k: subprocess.CompletedProcess(
        a, 35, stdout='', stderr=f'curl: (35) failed for access_token={OLD_TOKEN}'))
    with pytest.raises(tokens.TokenError) as caught:
        tokens.curl_transport(f'https://graph.instagram.com/me?access_token={OLD_TOKEN}')
    assert OLD_TOKEN not in str(caught.value) and 'curl exit 35' in str(caught.value)
