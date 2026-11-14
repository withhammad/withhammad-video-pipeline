"""Bridge from the Mac keyword routines (TikTok, LinkedIn) to the withhammad.cloud Automations dashboard.

The dashboard is the one place where keyword rules are edited and switched on/off. The Chrome routines
keep doing the typing (no API can comment for us on TikTok or a personal LinkedIn profile), but they:
  * read their rules from https://api.withhammad.cloud/automations/rules?platform=<tiktok|linkedin>
  * report every reply to /automations/events, so it shows in the dashboard's Activity log.

Nothing here may break a routine: if the dashboard cannot be reached, `rules_for()` returns None and the
caller falls back to the local dm-rules.json, and a report that cannot be sent is kept in an outbox
file and retried on the next call.

The API key lives in ~/.config/withhammad-cloud/automations-token (created on the server with
`cli.js create-key mac-automations`); it is never printed.
"""
import json
import os
import subprocess
import time
from pathlib import Path

BASE = os.environ.get('WHC_API', 'https://api.withhammad.cloud').rstrip('/')
TOKEN_FILE = Path(os.environ.get('WHC_AUTOMATIONS_TOKEN_FILE', Path.home() / '.config' / 'withhammad-cloud' / 'automations-token'))
OUTBOX = Path(__file__).resolve().parents[1] / '.local' / 'automations-outbox.json'


def _token():
    try:
        token = TOKEN_FILE.read_text().strip()
    except OSError:
        return None
    return token if token.startswith('whc_') else None


def _call(method, path, body=None, timeout=20):
    """curl with the key in a config on stdin (never on the command line). Returns (status, parsed JSON or None)."""
    token = _token()
    if not token:
        return 0, None
    cfg = f'header = "Authorization: Bearer {token}"\nheader = "Content-Type: application/json"\n'
    args = ['/usr/bin/curl', '--silent', '--show-error', '--max-time', str(timeout), '--config', '-', '-X', method,
            '-w', '\n%{http_code}', BASE + path]
    if body is not None:
        args[-1:-1] = ['--data-binary', json.dumps(body)]
    try:
        result = subprocess.run(args, input=cfg, capture_output=True, text=True, timeout=timeout + 5)
    except (OSError, subprocess.TimeoutExpired):
        return 0, None
    out, _, code = result.stdout.rpartition('\n')
    try:
        return int(code or 0), json.loads(out) if out.strip() else None
    except ValueError:
        return int(code or 0), None


def rules_for(platform):
    """The dashboard's active rules for a platform in dm-rules.json shape (one entry per keyword), or None."""
    status, data = _call('GET', f'/automations/rules?platform={platform}')
    if status != 200 or not isinstance(data, dict) or not isinstance(data.get('rules'), list):
        return None
    out = []
    for rule in data['rules']:
        if not rule.get('link'):
            continue
        for keyword in rule.get('keywords') or []:
            out.append({'keyword': keyword, 'link': rule['link'], 'dm': rule.get('dm'), 'reply': rule.get('reply'),
                        'automation_id': rule.get('id'), 'match': rule.get('matchType', 'word'),
                        'posts': [p.get('url') or p.get('postId') for p in rule.get('posts') or []]})
    return out


def _load_outbox():
    try:
        return json.loads(OUTBOX.read_text())
    except (OSError, ValueError):
        return []


def report(platform, comment_key, *, post=None, author=None, text=None, keyword=None, automation_id=None, status='sent',
           message=None):
    """Record a reply in the dashboard's Activity log. Never raises; unsent events wait in the outbox."""
    event = {'platform': platform, 'commentId': str(comment_key)[:300], 'action': 'public_reply', 'status': status,
             'postId': (post or None) and str(post)[:300], 'userHandle': (author or None) and str(author)[:200],
             'text': (text or None) and str(text)[:2000], 'keyword': keyword, 'automationId': automation_id,
             'detail': {'via': 'mac-chrome-routine', 'message': message}, 'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    batch = _load_outbox() + [event]
    code, _ = _call('POST', '/automations/events', batch[-200:])
    if code == 201:
        if OUTBOX.exists():
            OUTBOX.unlink()
        return True
    OUTBOX.parent.mkdir(parents=True, exist_ok=True)
    OUTBOX.write_text(json.dumps(batch[-500:], ensure_ascii=False))
    return False
