#!/usr/bin/env python3
"""Authorize one Instagram professional account through Chrome.

Starts a local HTTPS listener on the registered redirect (https://127.0.0.1:8766), opens the
Instagram consent page, exchanges the returned code for a long-lived token, verifies the
username matches --account and stores the token in work/.secrets. Nothing is printed except
account metadata. Chrome shows a self-signed-certificate warning on the redirect; proceed
through it (the request never leaves this machine).

  python3 instagram_oauth.py --account hammadagentic.ai
  python3 instagram_oauth.py --account with.hammad --no-open    # print URL instead of opening
"""
import argparse
import json
import os
import secrets
import ssl
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

ROOT = Path(__file__).resolve().parents[2]
SECRETS = ROOT / 'work' / '.secrets'
CLIENT_ID = '2225240621741205'
REDIRECT = 'https://127.0.0.1:8766/instagram/callback'
SCOPES = ['instagram_business_basic', 'instagram_business_content_publish']
CERT = SECRETS / 'localhost-cert.pem'
KEY = SECRETS / 'localhost-key.pem'


def ensure_cert():
    if CERT.exists() and KEY.exists():
        return
    subprocess.run(['/usr/bin/openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                    '-keyout', str(KEY), '-out', str(CERT), '-days', '3650',
                    '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'],
                   check=True, capture_output=True)
    os.chmod(KEY, 0o600)


def request_json(url, data=None):
    """GET or form-POST through /usr/bin/curl: python.org builds on macOS ship without CA roots."""
    config = 'silent\nshow-error\nfail-with-body\nmax-time = 30\n'
    if data is not None:
        config += 'request = "POST"\nheader = "Content-Type: application/x-www-form-urlencoded"\n'
        config += 'data = "' + urlencode(data).replace('"', '%22') + '"\n'
    process = subprocess.run(['/usr/bin/curl', '--config', '-', url], input=config,
                             text=True, capture_output=True, timeout=35)
    try:
        payload = json.loads(process.stdout) if process.stdout else {}
    except json.JSONDecodeError:
        payload = {}
    if process.returncode:
        detail = payload.get('error_message') or payload.get('error', {}).get('message') \
            if isinstance(payload, dict) else None
        raise RuntimeError(f'Provider request failed (curl exit {process.returncode})'
                           + (f': {detail}' if detail else ''))
    return payload


def exchange(code, expected):
    secret = (SECRETS / 'instagram-client-secret.txt').read_text().strip()
    short = request_json('https://api.instagram.com/oauth/access_token', {
        'client_id': CLIENT_ID, 'client_secret': secret, 'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT, 'code': code,
    })
    if 'data' in short:
        if len(short['data']) != 1:
            raise RuntimeError('Instagram returned ambiguous token data')
        short = short['data'][0]
    long = request_json('https://graph.instagram.com/access_token?' + urlencode({
        'grant_type': 'ig_exchange_token', 'client_secret': secret,
        'access_token': short['access_token'],
    }))
    token = long['access_token']
    me = request_json('https://graph.instagram.com/me?' + urlencode({
        'fields': 'id,username,account_type', 'access_token': token,
    }))
    if me.get('username', '').lower() != expected:
        raise RuntimeError(f"Wrong Instagram account authorized: @{me.get('username')} "
                           f"(expected @{expected}). Token not stored.")
    path = SECRETS / f"instagram-{expected.replace('.', '-')}-oauth.json"
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump({'access_token': token, 'expires_in': long.get('expires_in'),
                   'id': me['id'], 'username': me['username'],
                   'account_type': me.get('account_type'), 'scopes': SCOPES}, output)
    return {'connected': True, 'username': me['username'], 'id': me['id'],
            'account_type': me.get('account_type'), 'expires_in': long.get('expires_in')}


def note(message):
    """Timestamped progress line for the log. Never pass codes, tokens or full callback URLs."""
    print(time.strftime('%H:%M:%S ') + message, flush=True)


def make_handler(state, expected, outcome):
    class Callback(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # authorization codes must not reach logs

        def do_GET(self):
            parsed = urlparse(self.path)
            fields = parse_qs(parsed.query)
            if parsed.path != '/instagram/callback':
                note(f'Ignored a request for {parsed.path[:40]} (not the Instagram callback).')
                self.send_error(400, 'Invalid callback')
                return
            if fields.get('state', [''])[0] != state:
                note('Ignored a callback from an older login link (state mismatch). Use the newest link.')
                self.respond(400, 'This login link is from an earlier attempt. Open the newest link and '
                                  'authorize again.')
                return
            note('Callback for the current link received.')
            if 'error' in fields or 'error_reason' in fields:
                outcome['error'] = str(fields.get('error_reason', fields.get('error')))
                self.respond(400, 'Instagram authorization was declined.')
                return
            code = fields.get('code', [''])[0]
            if not code:
                outcome['error'] = 'no authorization code'
                self.respond(400, 'Instagram returned no authorization code.')
                return
            try:
                outcome['result'] = exchange(code, expected)
                self.respond(200, f'Instagram @{expected} connected. You can close this tab.')
            except Exception as error:  # noqa: BLE001 - surfaced to the caller
                outcome['error'] = str(error)
                hint = ''
                if 'Wrong Instagram account' in str(error):
                    hint = (f' This browser window is signed in to another Instagram account. Log out of it here '
                            f'(or use an Incognito window), log in as @{expected} by typing the username yourself, '
                            f'and open a new login link.')
                self.respond(400, 'Instagram connection failed: ' + str(error) + hint)

        def respond(self, status, message):
            body = ('<html><body><h2>' + message + '</h2></body></html>').encode()
            self.send_response(status)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
    return Callback


class CallbackServer(HTTPServer):
    """Logs TLS handshakes the browser abandons: that is the self-signed-certificate warning page."""
    warned = False

    def get_request(self):
        try:
            return super().get_request()
        except ssl.SSLError:
            if not self.warned:
                note('The browser reached the listener and is showing the certificate warning: '
                     'click Advanced, then Proceed to 127.0.0.1.')
                self.warned = True
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--account', required=True, help='expected Instagram username')
    parser.add_argument('--no-open', action='store_true', help='print the URL, do not open Chrome')
    parser.add_argument('--timeout', type=int, default=300)
    parser.add_argument('--force-reauth', action='store_true',
                        help='force a fresh Instagram login (use to switch accounts)')
    parser.add_argument('--scopes', default=','.join(SCOPES),
                        help='comma-separated scopes (default: basic + content_publish; add '
                             'instagram_business_manage_comments,instagram_business_manage_messages '
                             'for the keyword-DM webhook)')
    parser.add_argument('--state', help='reuse a state from an earlier run whose listener '
                        'was gone when the redirect arrived; then reload that redirect tab')
    args = parser.parse_args()
    expected = args.account.lower().lstrip('@')
    ensure_cert()
    state = args.state or secrets.token_urlsafe(24)
    outcome = {}
    server = CallbackServer(('127.0.0.1', 8766), make_handler(state, expected, outcome))
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(str(CERT), str(KEY))
    server.socket = context.wrap_socket(server.socket, server_side=True)
    SCOPES[:] = [scope.strip() for scope in args.scopes.split(',') if scope.strip()]
    params = {'client_id': CLIENT_ID, 'redirect_uri': REDIRECT, 'response_type': 'code',
              'scope': ','.join(SCOPES), 'state': state}
    if args.force_reauth:
        params['force_reauth'] = 'true'  # demands a fresh password login; owner types it
    url = 'https://www.instagram.com/oauth/authorize?' + urlencode(params)
    if args.no_open:
        print(url, flush=True)
    else:
        subprocess.run(['open', '-a', 'Google Chrome', url], check=True)
    note(f'Waiting for @{expected} authorization (listener open for {args.timeout} s).')
    deadline = time.monotonic() + args.timeout
    server.timeout = 5
    while 'result' not in outcome and 'error' not in outcome and time.monotonic() < deadline:
        server.handle_request()  # TLS handshake failures (e.g. the cert warning) return silently
    if 'result' in outcome:
        print(json.dumps(outcome['result']), flush=True)
        return 0
    note('Instagram authorization failed: ' + outcome.get('error', 'timed out'))
    return 1


if __name__ == '__main__':
    sys.exit(main())
