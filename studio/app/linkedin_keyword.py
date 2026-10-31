"""LinkedIn keyword bot: the data side of the scheduled Chrome run.

LinkedIn's free w_member_social scope cannot READ comments on our own posts (partnerApiSocialActions
is partner-only), so a scheduled Claude routine reads them in the owner's Chrome. This module gives
that routine everything else: the posts to watch, the keyword rules, the "already replied" state
and the API call that posts the reply (w_member_social CAN write comments).

    python -m app.linkedin_keyword watchlist            # posts (last 14 days) + rules, JSON
    python -m app.linkedin_keyword match "text"         # rule for a comment text, or null
    python -m app.linkedin_keyword reply --post URN --comment URN --author NAME --text "SCOPE"
    python -m app.linkedin_keyword reply --post URN --author NAME --text "SCOPE"          # no URN: message to type
    python -m app.linkedin_keyword reply --post URN --author NAME --text "SCOPE" --mark   # typed in Chrome, record it
    python -m app.linkedin_keyword watch --post URN     # add a post by hand
    python -m app.linkedin_keyword state
"""
import argparse
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import dm_rules
from app.publish_linkedin import LINKEDIN_VERSION, load_credentials

ROOT = Path(__file__).resolve().parents[2]
JOBS = ROOT / 'studio' / '.local' / 'jobs'
STATE = ROOT / 'studio' / '.local' / 'linkedin-keyword-state.json'
CREDENTIAL = ROOT / 'work' / '.secrets' / 'linkedin-oauth.json'
AUTHOR = 'urn:li:person:yWP7me7dep'
WINDOW_DAYS = 14
REPLY = '{author}, sent it: {link}\nFollow for the next one 🙌'


def load_state(path=STATE):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return {'replied': {}, 'extra_posts': []}


def save_state(state, path=STATE):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(state, indent=2, ensure_ascii=False) + '\n')


def _post_date(entry):
    raw = str(entry.get('at') or '')[:10]
    try:
        return datetime.strptime(raw, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def watched_posts(jobs=JOBS, state=None, now=None, window_days=WINDOW_DAYS):
    """LinkedIn posts from every job's published.json inside the window, plus hand-added ones."""
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=window_days)
    posts = {}
    for published in sorted(Path(jobs).glob('*/published.json')):
        try:
            data = json.loads(published.read_text())
        except ValueError:
            continue
        entries = data.values() if isinstance(data, dict) else data
        for entry in entries:
            li = entry.get('linkedin') if isinstance(entry, dict) else None
            if not li or not li.get('urn'):
                continue
            when = _post_date(li)
            if when and when < cutoff:
                continue
            posts[li['urn']] = {'urn': li['urn'], 'url': li.get('url') or f"https://www.linkedin.com/feed/update/{li['urn']}/",
                                'at': str(li.get('at') or ''), 'job': published.parent.name}
    for extra in (state or load_state()).get('extra_posts', []):
        posts.setdefault(extra['urn'], {'urn': extra['urn'], 'url': extra.get('url') or f"https://www.linkedin.com/feed/update/{extra['urn']}/",
                                        'at': extra.get('at', ''), 'job': 'manual'})
    return list(posts.values())


def match(text, rules=None):
    rules = dm_rules.load()['rules'] if rules is None else rules
    for rule in rules:
        if re.search(r'(?<![A-Za-z0-9])' + re.escape(rule['keyword']) + r'(?![A-Za-z0-9])', text or '', re.IGNORECASE):
            return rule
    return None


def reply_text(rule, author):
    first = (author or '').strip().split(' ')[0] or 'Hey'
    return REPLY.format(author=first, link=rule['link'])


def _curl(url, headers, body):
    cfg = ''.join(f'header = "{k}: {v}"\n' for k, v in headers.items())
    result = subprocess.run(['/usr/bin/curl', '--silent', '--show-error', '--max-time', '30', '--config', '-',
                             '-X', 'POST', '--data-binary', json.dumps(body), '-w', '\n%{http_code}', url],
                            input=cfg, capture_output=True, text=True)
    out, _, code = result.stdout.rpartition('\n')
    return int(code or 0), out


def post_reply(post_urn, comment_urn, text, *, credential=CREDENTIAL, send=_curl):
    """Reply to `comment_urn` under `post_urn` as the owner. Returns the API response JSON."""
    token = load_credentials(credential)['access_token']
    from urllib.parse import quote
    url = f'https://api.linkedin.com/rest/socialActions/{quote(post_urn, safe="")}/comments'
    headers = {'Authorization': f'Bearer {token}', 'Linkedin-Version': LINKEDIN_VERSION,
               'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json'}
    body = {'actor': AUTHOR, 'object': post_urn, 'parentComment': comment_urn, 'message': {'text': text}}
    code, out = send(url, headers, body)
    if code != 201:
        raise RuntimeError(f'LinkedIn comment reply failed: HTTP {code} {out[:300]}')
    return json.loads(out) if out.strip().startswith('{') else {}


def dedupe_key(post_urn, comment_urn, author, text):
    """Comment URN when Chrome exposed it, else a stable key from post + author + text."""
    return comment_urn or f'{post_urn}|{(author or "").strip().lower()}|{(text or "").strip().lower()[:80]}'


def reply(post_urn, comment_urn, author, text, *, state_path=STATE, credential=CREDENTIAL, send=_curl, rules=None,
          mark_only=False):
    """Keyword check + dedupe + reply; returns what happened.

    With a comment URN the reply goes through the API. Without one (Chrome did not expose it) the
    result is `type_in_chrome` with the message to type under the comment; the routine then calls
    again with mark_only=True once it has posted it, so the comment is never answered twice.
    """
    state = load_state(state_path)
    key = dedupe_key(post_urn, comment_urn, author, text)
    if key in state['replied']:
        return {'status': 'already_replied', 'key': key}
    rule = match(text, rules)
    if not rule:
        return {'status': 'no_keyword', 'key': key}
    message = reply_text(rule, author)
    record = {'post': post_urn, 'keyword': rule['keyword'], 'author': author,
              'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    if comment_urn and not mark_only:
        post_reply(post_urn, comment_urn, message, credential=credential, send=send)
        record['via'] = 'api'
    elif not mark_only:
        return {'status': 'type_in_chrome', 'key': key, 'keyword': rule['keyword'], 'message': message}
    else:
        record['via'] = 'chrome'
    state['replied'][key] = record
    save_state(state, state_path)
    return {'status': 'replied', 'key': key, 'keyword': rule['keyword'], 'message': message, 'via': record['via']}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('watchlist')
    sub.add_parser('state')
    m = sub.add_parser('match'); m.add_argument('text')
    w = sub.add_parser('watch'); w.add_argument('--post', required=True); w.add_argument('--url')
    r = sub.add_parser('reply')
    r.add_argument('--post', required=True); r.add_argument('--comment', default='')
    r.add_argument('--author', default=''); r.add_argument('--text', required=True)
    r.add_argument('--mark', action='store_true', help='record a reply already typed in Chrome')
    args = parser.parse_args(argv)
    if args.cmd == 'watchlist':
        out = {'posts': watched_posts(), 'rules': dm_rules.load()['rules'], 'replied': sorted(load_state()['replied'])}
    elif args.cmd == 'state':
        out = load_state()
    elif args.cmd == 'match':
        out = match(args.text)
    elif args.cmd == 'watch':
        state = load_state()
        state['extra_posts'] = [p for p in state['extra_posts'] if p['urn'] != args.post] + [
            {'urn': args.post, 'url': args.url, 'at': time.strftime('%Y-%m-%d')}]
        save_state(state); out = state['extra_posts']
    else:
        out = reply(args.post, args.comment, args.author, args.text, mark_only=args.mark)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False); print()


if __name__ == '__main__':
    main()
