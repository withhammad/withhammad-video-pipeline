"""Check and refresh the Instagram Login long-lived tokens in work/.secrets. Run by hand; nothing here schedules itself.

  python -m app.instagram_tokens status                         # account, expiry, days left, live identity check
  python -m app.instagram_tokens refresh --account with.hammad
  python -m app.instagram_tokens refresh --all

Token files are work/.secrets/instagram-<account>-oauth.json, written by outputs/video-pipeline/instagram_oauth.py
(access_token, expires_in, id, username, account_type, scopes). A refresh adds refreshed_at and expires_at (UTC);
for a file without them the issue time is the file's modification time.

Meta, Instagram API with Instagram Login ("Refresh a long-lived token"):
  GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>
  -> {access_token, token_type, expires_in}. The token must be unexpired and at least 24 h old; the new one lasts
  60 days from the refresh.
A token whose Instagram web session ended fails every call with error 190 (session invalidated). Refreshing cannot
revive it; only the OAuth consent can, so the file is kept and the re-authorize steps are printed.

Requests go through /usr/bin/curl with the whole request, URL included, in a --config on stdin: python.org builds on
macOS ship without CA roots, and a token in argv would show in `ps`. No output, log line or exception carries a token.
"""
import argparse
import calendar
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.parse import urlencode

HOST = 'https://graph.instagram.com'
SECRETS = Path(os.environ.get('STUDIO_IG_SECRETS', str(Path(__file__).resolve().parents[2] / 'work' / '.secrets')))
OAUTH_SCRIPT = 'outputs/video-pipeline/instagram_oauth.py'
# AGENTS.md: the owner's main Chrome profile stays signed in to @with.hammad; any other account is authorized in a
# separate Chrome profile, because switching the main profile ends the @with.hammad session and kills its token.
BROWSER_ACCOUNT = 'with.hammad'
MIN_AGE_SECONDS = 24 * 3600
DAY = 86400
REDACTED = '<redacted>'
INVALID_TOKEN_CODE = 190


class TokenError(RuntimeError):
    """A token problem for one account. `reauthorize` means only a new OAuth consent fixes it."""

    def __init__(self, message, *, code=None, subcode=None, reauthorize=False):
        super().__init__(message)
        self.code, self.subcode, self.reauthorize = code, subcode, reauthorize


def scrub(text, *tokens):
    text = str(text)
    for token in tokens:
        if token:
            text = text.replace(token, REDACTED)
    return re.sub(r'(access_token=)[^&\s"\']+', r'\1' + REDACTED, text)


def curl_transport(url, timeout=30):
    """GET `url`; the URL travels in curl's stdin config, never in argv. Returns (http_status, parsed JSON or None)."""
    if any(c in url for c in '"\\\n\r'):
        raise TokenError('refusing to build a curl config from a URL with quotes or line breaks')
    config = ('silent\nshow-error\nproto = "=https"\n'
              f'max-time = {int(timeout)}\n'
              f'url = "{url}"\n'
              'write-out = "\\n%{http_code}"\n')
    try:
        process = subprocess.run(['/usr/bin/curl', '--config', '-'], input=config, text=True,
                                 capture_output=True, timeout=timeout + 5)
    except subprocess.TimeoutExpired:
        raise TokenError(f'request to {HOST} timed out after {timeout} s') from None
    if process.returncode:
        raise TokenError(scrub(f'request to {HOST} failed (curl exit {process.returncode}): '
                               f'{process.stderr.strip()[:200]}'))
    body, _, status = process.stdout.rpartition('\n')
    try:
        payload = json.loads(body) if body.strip() else None
    except ValueError:
        payload = None
    return int(status or 0), payload


def _get(transport, path, params, token):
    """One Graph API GET. Errors name the path only; the URL (which holds the token) never reaches a message."""
    try:
        status, body = transport(HOST + path + '?' + urlencode(params))
    except TokenError as exc:
        raise TokenError(scrub(f'GET {path}: {exc}', token)) from None
    error = body.get('error') if isinstance(body, dict) else None
    if isinstance(error, dict):
        code, subcode = error.get('code'), error.get('error_subcode')
        raise TokenError(scrub(f"GET {path} failed (HTTP {status}, code {code}"
                               f"{'/' + str(subcode) if subcode else ''}): {error.get('message')}", token),
                         code=code, subcode=subcode, reauthorize=code == INVALID_TOKEN_CODE)
    if status >= 400 or not isinstance(body, dict):
        raise TokenError(f'GET {path} failed (HTTP {status}, no usable JSON body)')
    return body


def identity(token, transport):
    return _get(transport, '/me', {'fields': 'id,username,account_type', 'access_token': token}, token)


def _confirm(me, data):
    expected = str(data.get('username') or '').lower()
    actual = str(me.get('username') or '').lower()
    if actual != expected or (data.get('id') and str(me.get('id')) != str(data['id'])):
        raise TokenError(f'token belongs to @{actual or "?"}, not @{expected}; nothing stored', reauthorize=True)


# --- files ----------------------------------------------------------------------------------------------------------

def account_file(account, secrets_dir=None):
    name = account.strip().lstrip('@').lower().replace('.', '-')
    return Path(secrets_dir or SECRETS) / f'instagram-{name}-oauth.json'


def token_files(secrets_dir=None):
    return sorted(Path(secrets_dir or SECRETS).glob('instagram-*-oauth.json'))


def load(path):
    try:
        data = json.loads(Path(path).read_text())
    except FileNotFoundError:
        raise TokenError(f'token file is missing: {Path(path).name}', reauthorize=True) from None
    except ValueError:
        raise TokenError(f'token file is not valid JSON: {Path(path).name}') from None
    if not isinstance(data, dict) or not str(data.get('access_token') or '').strip():
        raise TokenError(f'token file has no access_token: {Path(path).name}', reauthorize=True)
    return data


def _iso(epoch):
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(epoch))


def _epoch(iso):
    try:
        return calendar.timegm(time.strptime(iso, '%Y-%m-%dT%H:%M:%SZ'))
    except (TypeError, ValueError):
        return None


def issued_at(data, path):
    return _epoch(data.get('refreshed_at')) or Path(path).stat().st_mtime


def expires_at(data, path):
    stored = _epoch(data.get('expires_at'))
    if stored:
        return stored
    try:
        return issued_at(data, path) + int(data['expires_in'])
    except (KeyError, TypeError, ValueError):
        return None


def write_atomic(path, data):
    """Temp file in the same folder (0600 from creation), fsync, then rename over the old file."""
    path = Path(path)
    fd, temp = tempfile.mkstemp(prefix=f'.{path.name}.', suffix='.tmp', dir=path.parent)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'w') as output:
            json.dump(data, output)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temp, path)
    except BaseException:
        try:
            os.unlink(temp)
        except FileNotFoundError:
            pass
        raise
    folder = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(folder)
    finally:
        os.close(folder)


# --- commands -------------------------------------------------------------------------------------------------------

def reauthorize_steps(account):
    account = account.lstrip('@')
    if account == BROWSER_ACCOUNT:
        return (f'Re-authorize @{account}: run `python3 {OAUTH_SCRIPT} --account {account}`; Chrome opens the consent '
                f'page. If Instagram asks to log in, use "Log in with Facebook" (Chrome autofills the wrong account\'s '
                'password), the owner enters the 2FA code, then approve. The old token file stays until the new '
                'consent replaces it.')
    return (f'Re-authorize @{account}: run `python3 {OAUTH_SCRIPT} --account {account} --no-open` and open the printed '
            f'link in a separate Chrome profile (never log the main profile out of @{BROWSER_ACCOUNT}: that kills '
            f'its token). Log in as @{account} by typing the username, the owner enters any 2FA code, then approve. '
            'The old token file stays until the new consent replaces it.')


def _username(path):
    try:
        return load(path).get('username') or Path(path).name
    except TokenError:
        return Path(path).name


def check(path, transport=curl_transport, clock=time.time):
    """Read-only: expiry from the file, validity from a live /me call that must return the stored username."""
    now = clock()
    result = {'file': Path(path).name, 'account': Path(path).stem[len('instagram-'):-len('-oauth')],
              'expires_at': None, 'days_left': None, 'refreshable_at': None, 'valid': None, 'detail': ''}
    try:
        data = load(path)
        result['account'] = data.get('username') or result['account']
        expiry = expires_at(data, path)
        if expiry:
            result['expires_at'], result['days_left'] = _iso(expiry), (expiry - now) / DAY
        result['refreshable_at'] = _iso(issued_at(data, path) + MIN_AGE_SECONDS)
        if expiry and expiry <= now:
            raise TokenError('token expired', reauthorize=True)
        _confirm(identity(data['access_token'], transport), data)
        result['valid'], result['detail'] = True, f"identity confirmed (@{data.get('username')})"
    except TokenError as exc:
        result['valid'] = False if exc.reauthorize else None  # network or rate-limit trouble proves nothing
        result['detail'] = str(exc)
        result['reauthorize'] = exc.reauthorize
    return result


def refresh(path, transport=curl_transport, clock=time.time):
    """Refresh one token file in place. Returns {'action': 'refreshed'|'skipped', ...}; raises TokenError."""
    data = load(path)
    account = data.get('username') or Path(path).name
    now = clock()
    age = now - issued_at(data, path)
    if age < MIN_AGE_SECONDS:
        return {'action': 'skipped', 'account': account,
                'detail': f'token is {age / 3600:.1f} h old; Meta refreshes tokens at least 24 h old. '
                          f'Try after {_iso(now - age + MIN_AGE_SECONDS)}.'}
    expiry = expires_at(data, path)
    if expiry and expiry <= now:
        raise TokenError(f'token expired at {_iso(expiry)}; a refresh cannot revive it', reauthorize=True)
    old = data['access_token']
    body = _get(transport, '/refresh_access_token', {'grant_type': 'ig_refresh_token', 'access_token': old}, old)
    new = str(body.get('access_token') or '').strip()
    try:
        lifetime = int(body['expires_in'])
    except (KeyError, TypeError, ValueError):
        lifetime = 0
    if not new or lifetime <= 0:
        raise TokenError('refresh response had no access_token or expires_in; file kept')
    try:
        try:
            me = identity(new, transport)
        except TokenError as exc:
            if exc.code is not None:
                raise
            me = identity(new, transport)  # one retry on a network failure, so a hiccup does not lose the new token
        _confirm(me, data)
    except TokenError as exc:
        raise TokenError(scrub(f'refreshed token failed the identity check, file kept: {exc}', new, old),
                         code=exc.code, subcode=exc.subcode, reauthorize=exc.reauthorize) from None
    refreshed = {**data, 'access_token': new, 'expires_in': lifetime,
                 'refreshed_at': _iso(now), 'expires_at': _iso(now + lifetime)}
    write_atomic(path, refreshed)
    return {'action': 'refreshed', 'account': account, 'expires_at': refreshed['expires_at'],
            'detail': f"new token valid to {refreshed['expires_at']} ({lifetime / DAY:.0f} days)"}


def _left(days):
    if days is None:
        return 'expiry unknown'
    if days < 0:
        return f'EXPIRED {-days:.1f} days ago'
    return f'{int(days)} days left' if days >= 1 else f'{days * 24:.1f} hours left'


def cmd_status(transport, clock):
    files = token_files()
    if not files:
        print(f'No Instagram token files in {SECRETS}.')
        return 1
    healthy = True
    for path in files:
        row = check(path, transport, clock)
        expiry = (row['expires_at'] or '?')[:10]
        state = {True: 'valid', False: 'INVALID', None: 'UNKNOWN'}[row['valid']]
        print(f"@{row['account']:<18} expires {expiry} ({_left(row['days_left'])})  {state}: {row['detail']}")
        if row['valid'] and row['refreshable_at'] > _iso(clock()):
            print(f"    refreshable from {row['refreshable_at']} (Meta needs a token at least 24 h old)")
        if row.get('reauthorize'):
            print('    ' + reauthorize_steps(row['account']))
        healthy = healthy and row['valid'] is True
    return 0 if healthy else 1


def cmd_refresh(targets, transport, clock):
    """targets: (account, path) pairs; the account name is what the re-authorize steps pass to the OAuth script."""
    failed = False
    for account, path in targets:
        try:
            outcome = refresh(path, transport, clock)
            print(f"@{outcome['account']}: {outcome['action']} - {outcome['detail']}")
        except TokenError as exc:
            failed = True
            print(f'@{account}: NOT refreshed - {exc}')
            if exc.reauthorize:
                print('    ' + reauthorize_steps(account))
    return 1 if failed else 0


def main(argv=None, transport=curl_transport, clock=time.time):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('status', help='expiry, days left and a live identity check per token file')
    refresh_cmd = sub.add_parser('refresh', help='exchange tokens for new 60-day tokens')
    which = refresh_cmd.add_mutually_exclusive_group(required=True)
    which.add_argument('--account', help='Instagram username, e.g. with.hammad')
    which.add_argument('--all', action='store_true', help='every instagram-*-oauth.json in work/.secrets')
    args = parser.parse_args(argv)
    if args.command == 'status':
        return cmd_status(transport, clock)
    if args.all:
        targets = [(_username(path), path) for path in token_files()]
    else:
        targets = [(args.account.strip().lstrip('@').lower(), account_file(args.account))]
    if not targets:
        print(f'No Instagram token files in {SECRETS}.')
        return 1
    return cmd_refresh(targets, transport, clock)


if __name__ == '__main__':
    sys.exit(main())
