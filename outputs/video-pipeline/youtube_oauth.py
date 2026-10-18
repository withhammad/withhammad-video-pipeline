"""Authorize the local YouTube desktop OAuth client through Google Chrome."""
import json
import os
import secrets
import sys
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

ROOT = Path(__file__).resolve().parents[2]
SECRET_DIR = ROOT / 'work/.secrets'
CLIENT = json.loads((SECRET_DIR / 'youtube-client.json').read_text())['installed']
REDIRECT = 'http://127.0.0.1:8765/youtube/callback'
EXPECTED_CHANNEL = 'UCJtrEDGg1R3kNe7t7PQFiEw'
STATE = secrets.token_urlsafe(32)
SCOPES = ['https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/youtube.upload']
if '--captions' in sys.argv:
    SCOPES.append('https://www.googleapis.com/auth/youtube.force-ssl')


def curl(url, *, post=None, bearer=None):
    config = 'silent\nshow-error\nfail\nmax-time = 30\n'
    if post is not None:
        config += 'request = "POST"\nheader = "Content-Type: application/x-www-form-urlencoded"\n'
        config += 'data = "' + urlencode(post).replace('"', '%22') + '"\n'
    if bearer:
        config += 'header = "Authorization: Bearer ' + bearer + '"\n'
    process = subprocess.run(['/usr/bin/curl', '--config', '-', url], input=config,
                             text=True, capture_output=True, timeout=35)
    if process.returncode:
        raise RuntimeError('Provider request failed (curl exit ' + str(process.returncode) + ')')
    return json.loads(process.stdout)


class Callback(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # OAuth codes must not appear in logs.

    def do_GET(self):
        parsed = urlparse(self.path)
        fields = parse_qs(parsed.query)
        if parsed.path != '/youtube/callback' or fields.get('state', [''])[0] != STATE:
            self.send_error(400, 'Invalid callback')
            return
        if 'error' in fields:
            self.respond(400, 'Google authorization was declined.')
            return
        code = fields.get('code', [''])[0]
        if not code:
            self.respond(400, 'Google returned no authorization code.')
            return
        try:
            token = curl('https://oauth2.googleapis.com/token', post={
                'grant_type': 'authorization_code', 'code': code,
                'client_id': CLIENT['client_id'], 'client_secret': CLIENT['client_secret'],
                'redirect_uri': REDIRECT,
            })
            if not token.get('refresh_token') or not token.get('access_token'):
                raise RuntimeError('Google did not return both access and refresh tokens')
            channels = curl('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
                            bearer=token['access_token'])
            item = (channels.get('items') or [None])[0]
            if not item:
                raise RuntimeError('The selected Google account has no YouTube channel')
            if item['id'] != EXPECTED_CHANNEL:
                raise RuntimeError('Wrong YouTube channel selected: ' + item['id'])
            record = {'refresh_token': token['refresh_token'], 'channel_id': item['id'],
                      'channel_title': item['snippet']['title'], 'client_file': str(SECRET_DIR / 'youtube-client.json'),
                      'scopes': SCOPES}
            path = SECRET_DIR / 'youtube-oauth.json'
            fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            with os.fdopen(fd, 'w') as output:
                json.dump(record, output)
            path.chmod(0o600)
            print(json.dumps({'connected': True, 'channel_id': item['id'],
                              'channel_title': item['snippet']['title']}), flush=True)
            self.respond(200, 'YouTube connected to Codex. You can close this tab.')
        except Exception as error:
            print('YouTube authorization failed: ' + str(error), flush=True)
            self.respond(400, 'YouTube connection failed: ' + str(error))

    def respond(self, status, message):
        body = ('<html><body><h2>' + message + '</h2></body></html>').encode()
        self.send_response(status)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    params = {'client_id': CLIENT['client_id'], 'redirect_uri': REDIRECT,
              'response_type': 'code', 'scope': ' '.join(SCOPES), 'access_type': 'offline',
              'prompt': 'consent', 'state': STATE}
    server = HTTPServer(('127.0.0.1', 8765), Callback)
    print('Waiting for Google authorization in Chrome.', flush=True)
    subprocess.run(['open', '-a', 'Google Chrome',
                    'https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params)], check=True)
    server.timeout = 180
    server.handle_request()
