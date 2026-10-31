#!/usr/bin/env python3
"""Authorize the Facebook Page through Chrome and store its long-lived Page token.

Same shape as instagram_oauth.py: a local HTTPS listener on https://127.0.0.1:8767, the Facebook
consent page for the parent app 1098576635873878, code -> long-lived user token -> /me/accounts ->
the Page named --page. Needs work/.secrets/facebook-app-secret.txt (the parent app's secret from
App settings -> Basic). Stores work/.secrets/facebook-page-oauth.json.

  python3 facebook_oauth.py --page "With Hammad AI" --no-open
"""
import argparse
import secrets
import ssl
import sys
import time
import webbrowser
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
from instagram_oauth import CERT, KEY, SECRETS, CallbackServer, ensure_cert, note, request_json  # noqa: E402

APP_ID = '1098576635873878'
REDIRECT = 'https://127.0.0.1:8767/facebook/callback'
SCOPES = ['pages_show_list', 'pages_manage_metadata', 'pages_messaging', 'pages_read_engagement',
          'pages_manage_engagement', 'pages_read_user_content']
GRAPH = 'https://graph.facebook.com/v25.0'
SECRET_FILE = SECRETS / 'facebook-app-secret.txt'
OUTPUT = SECRETS / 'facebook-page-oauth.json'
PAGE_ID = '1394106800452348'  # With Hammad AI (page asset id)


def exchange(code, page_name):
    secret = SECRET_FILE.read_text().strip()
    short = request_json(f'{GRAPH}/oauth/access_token?' + urlencode(
        {'client_id': APP_ID, 'redirect_uri': REDIRECT, 'client_secret': secret, 'code': code}))
    long = request_json(f'{GRAPH}/oauth/access_token?' + urlencode(
        {'grant_type': 'fb_exchange_token', 'client_id': APP_ID, 'client_secret': secret,
         'fb_exchange_token': short['access_token']}))
    user_token = long['access_token']
    granted = request_json(f'{GRAPH}/me/permissions?' + urlencode({'access_token': user_token}))
    note('Granted: ' + ', '.join(p['permission'] for p in granted.get('data', []) if p.get('status') == 'granted'))
    pages = request_json(f'{GRAPH}/me/accounts?' + urlencode(
        {'fields': 'id,name,access_token,tasks', 'access_token': user_token}))
    names = [p['name'] for p in pages.get('data', [])]
    page = next((p for p in pages.get('data', []) if p['name'] == page_name), None)
    if not page and PAGE_ID:
        # Business-portfolio Pages sometimes miss from /me/accounts; the Page node still answers.
        note(f'/me/accounts listed {names or "nothing"}; reading the Page {PAGE_ID} directly.')
        page = request_json(f'{GRAPH}/{PAGE_ID}?' + urlencode(
            {'fields': 'id,name,access_token', 'access_token': user_token}))
        if not page.get('access_token'):
            page = None
    if not page:
        raise RuntimeError(f'Page "{page_name}" not among the Pages this login manages: {names}')
    record = {'page_id': page['id'], 'page_name': page['name'], 'access_token': page['access_token'],
              'tasks': page.get('tasks'), 'scopes': SCOPES, 'app_id': APP_ID,
              'obtained_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
              'note': 'Page token from a long-lived user token: does not expire while the user token is valid'}
    OUTPUT.write_text(__import__('json').dumps(record, indent=2))
    OUTPUT.chmod(0o600)
    return {'connected': True, 'page_id': page['id'], 'page_name': page['name']}


def make_handler(state, page_name, outcome):
    class Callback(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            parsed = urlparse(self.path)
            fields = parse_qs(parsed.query)
            if parsed.path != '/facebook/callback' or fields.get('state', [''])[0] != state:
                self.respond(400, 'Not the current Facebook login link.')
                return
            note('Callback for the current link received.')
            code = fields.get('code', [''])[0]
            if not code:
                outcome['error'] = str(fields.get('error_description', fields.get('error', 'no code')))
                self.respond(400, 'Facebook authorization was declined.')
                return
            try:
                outcome['result'] = exchange(code, page_name)
                self.respond(200, f'Facebook Page "{page_name}" connected. You can close this tab.')
            except Exception as error:  # noqa: BLE001
                outcome['error'] = str(error)
                self.respond(400, 'Facebook connection failed: ' + str(error))

        def respond(self, status, message):
            body = ('<html><body><h2>' + message + '</h2></body></html>').encode()
            self.send_response(status)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
    return Callback


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--page', default='With Hammad AI')
    parser.add_argument('--no-open', action='store_true')
    parser.add_argument('--timeout', type=int, default=900)
    args = parser.parse_args()
    if not SECRET_FILE.exists():
        sys.exit(f'Missing {SECRET_FILE}: paste the parent app secret (App settings -> Basic -> Show) into it.')
    ensure_cert()
    state = secrets.token_urlsafe(24)
    url = 'https://www.facebook.com/v25.0/dialog/oauth?' + urlencode(
        {'client_id': APP_ID, 'redirect_uri': REDIRECT, 'response_type': 'code', 'scope': ','.join(SCOPES),
         'state': state})
    outcome = {}
    server = CallbackServer(('127.0.0.1', 8767), make_handler(state, args.page, outcome))
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(str(CERT), str(KEY))
    server.socket = context.wrap_socket(server.socket, server_side=True)
    server.timeout = 1
    print(url, flush=True)
    if not args.no_open:
        webbrowser.open(url)
    note(f'Waiting for Facebook Page "{args.page}" authorization (listener open for {args.timeout} s).')
    deadline = time.time() + args.timeout
    while time.time() < deadline and not outcome:
        try:
            server.handle_request()
        except ssl.SSLError:
            continue
    server.server_close()
    if 'result' in outcome:
        print(__import__('json').dumps(outcome['result']), flush=True)
        return 0
    print('Facebook authorization failed: ' + outcome.get('error', 'timed out'), flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
