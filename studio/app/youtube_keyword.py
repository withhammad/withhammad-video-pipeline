"""YouTube keyword replies: comment a keyword under one of our videos, get the resource link back.

Pure Data API (no Chrome): `commentThreads.list` over the channel finds new top-level comments,
`comments.insert` posts the reply as the channel. Both need the youtube.force-ssl scope
(outputs/video-pipeline/youtube_oauth.py --captions). Rules are the same dm-rules.json the
Instagram/Facebook webhook and the LinkedIn routine use.

    python -m app.youtube_keyword run            # poll + reply (what the schedule calls)
    python -m app.youtube_keyword run --dry-run  # show what would be replied, post nothing
    python -m app.youtube_keyword state
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

from app import dm_rules
from app.linkedin_keyword import match
from app.publish_youtube import API, EXPECTED_CHANNEL_ID, TOKEN_URL, load_credentials

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / 'studio' / '.local' / 'youtube-keyword-state.json'
SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl'
REPLY = 'Here it is 👇 {link}\nSubscribe for the next one 🙌'
MAX_PAGES = 5


def load_state(path=STATE):
    try:
        return json.loads(Path(path).read_text())
    except FileNotFoundError:
        return {'replied': {}, 'last_run': None}


def save_state(state, path=STATE):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(state, indent=2, ensure_ascii=False) + '\n')


def _curl(method, url, *, bearer, body=None, form=None):
    cfg = 'silent\nshow-error\nmax-time = 30\n'
    if bearer:
        cfg += f'header = "Authorization: Bearer {bearer}"\n'
    args = ['/usr/bin/curl', '--config', '-', '-X', method, '-w', '\n%{http_code}', url]
    if body is not None:
        args += ['-H', 'Content-Type: application/json', '--data-binary', json.dumps(body)]
    if form is not None:
        args += ['--data', form]
    result = subprocess.run(args, input=cfg, capture_output=True, text=True)
    out, _, code = result.stdout.rpartition('\n')
    try:
        payload = json.loads(out) if out.strip() else {}
    except ValueError:
        payload = {'raw': out[:300]}
    return int(code or 0), payload


def access_token(credential=None, send=_curl):
    creds = load_credentials(credential)
    form = (f"client_id={creds['client_id']}&client_secret={creds['client_secret']}"
            f"&refresh_token={creds['refresh_token']}&grant_type=refresh_token")
    code, payload = send('POST', TOKEN_URL, bearer=None, form=form)
    if code != 200 or not payload.get('access_token'):
        raise RuntimeError(f'YouTube token refresh failed: HTTP {code}')
    if SCOPE not in (payload.get('scope') or ''):
        raise RuntimeError('YouTube token lacks youtube.force-ssl; run youtube_oauth.py --captions')
    return payload['access_token']


def list_threads(token, *, channel_id=EXPECTED_CHANNEL_ID, send=_curl, max_pages=MAX_PAGES):
    """Top-level comments on every video of the channel, newest first."""
    page, threads = None, []
    for _ in range(max_pages):
        url = (f'{API}/commentThreads?part=snippet&allThreadsRelatedToChannelId={channel_id}'
               f'&maxResults=100&order=time&textFormat=plainText' + (f'&pageToken={page}' if page else ''))
        code, payload = send('GET', url, bearer=token)
        if code != 200:
            raise RuntimeError(f'commentThreads.list failed: HTTP {code} {json.dumps(payload)[:200]}')
        for item in payload.get('items', []):
            top = item['snippet']['topLevelComment']['snippet']
            threads.append({'id': item['id'], 'video_id': top.get('videoId') or item['snippet'].get('videoId'),
                            'author': top.get('authorDisplayName', ''),
                            'author_channel': (top.get('authorChannelId') or {}).get('value'),
                            'text': top.get('textDisplay') or top.get('textOriginal') or '',
                            'replies': item['snippet'].get('totalReplyCount', 0),
                            'at': top.get('publishedAt')})
        page = payload.get('nextPageToken')
        if not page:
            break
    return threads


def post_reply(token, parent_id, text, *, send=_curl):
    code, payload = send('POST', f'{API}/comments?part=snippet', bearer=token,
                         body={'snippet': {'parentId': parent_id, 'textOriginal': text}})
    if code != 200:
        raise RuntimeError(f'comments.insert failed: HTTP {code} {json.dumps(payload)[:200]}')
    return payload.get('id')


def run(*, dry_run=False, state_path=STATE, credential=None, send=_curl, rules=None, channel_id=EXPECTED_CHANNEL_ID):
    rules = dm_rules.load()['rules'] if rules is None else rules
    state = load_state(state_path)
    token = access_token(credential, send=send)
    threads = list_threads(token, channel_id=channel_id, send=send)
    report = {'threads': len(threads), 'replied': [], 'skipped_own': 0, 'already': 0, 'dry_run': dry_run}
    for t in threads:
        if t['author_channel'] == channel_id:
            report['skipped_own'] += 1
            continue
        if t['id'] in state['replied']:
            report['already'] += 1
            continue
        rule = match(t['text'], rules)
        if not rule:
            continue
        text = REPLY.format(link=rule['link'])
        entry = {'video_id': t['video_id'], 'author': t['author'], 'keyword': rule['keyword'],
                 'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
        if not dry_run:
            entry['reply_id'] = post_reply(token, t['id'], text, send=send)
            state['replied'][t['id']] = entry
        report['replied'].append({**entry, 'comment': t['id'], 'text': text})
    state['last_run'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    if not dry_run:
        save_state(state, state_path)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    r = sub.add_parser('run'); r.add_argument('--dry-run', action='store_true')
    sub.add_parser('state')
    args = parser.parse_args(argv)
    out = load_state() if args.cmd == 'state' else run(dry_run=args.dry_run)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False); print()


if __name__ == '__main__':
    main()
