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
from urllib.request import Request, urlopen

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
    body = urlencode(data).encode() if data is not None else None
    with urlopen(Request(url, data=body), timeout=30) as response:
        return json.load(response)


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


def make_handler(state, expected, outcome):
    class Callback(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # authorization codes must not reach logs

        def do_GET(self):
            parsed = urlparse(self.path)
            fields = parse_qs(parsed.query)
            if parsed.path != '/instagram/callback' or fields.get('state', [''])[0] != state:
                self.send_error(400, 'Invalid callback')
                return
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
                self.respond(400, 'Instagram connection failed: ' + str(error))

        def respond(self, status, message):
            body = ('<html><body><h2>' + message + '</h2></body></html>').encode()
            self.send_response(status)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
    return Callback


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--account', required=True, help='expected Instagram username')
    parser.add_argument('--no-open', action='store_true', help='print the URL, do not open Chrome')
    parser.add_argument('--timeout', type=int, default=300)
    parser.add_argument('--force-reauth', action='store_true',
                        help='force a fresh Instagram login (use to switch accounts)')
    args = parser.parse_args()
    expected = args.account.lower().lstrip('@')
    ensure_cert()
    state = secrets.token_urlsafe(24)
    outcome = {}
    server = HTTPServer(('127.0.0.1', 8766), make_handler(state, expected, outcome))
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(str(CERT), str(KEY))
    server.socket = context.wrap_socket(server.socket, server_side=True)
    params = {'client_id': CLIENT_ID, 'redirect_uri': REDIRECT, 'response_type': 'code',
              'scope': ','.join(SCOPES), 'state': state}
    if args.force_reauth:
        params['force_reauth'] = 'true'  # demands a fresh password login; owner types it
    url = 'https://www.instagram.com/oauth/authorize?' + urlencode(params)
    if args.no_open:
        print(url, flush=True)
    else:
        subprocess.run(['open', '-a', 'Google Chrome', url], check=True)
    print(f'Waiting for @{expected} authorization in Chrome.', flush=True)
    deadline = time.monotonic() + args.timeout
    server.timeout = 5
    while 'result' not in outcome and 'error' not in outcome and time.monotonic() < deadline:
        server.handle_request()  # TLS handshake failures (e.g. the cert warning) return silently
    if 'result' in outcome:
        print(json.dumps(outcome['result']), flush=True)
        return 0
    print('Instagram authorization failed: ' + outcome.get('error', 'timed out'), flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
