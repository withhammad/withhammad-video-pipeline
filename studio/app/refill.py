"""Content refill: keep the feed full so posting never stops (owner rule 2026-11-01).

Daily minimum (owner): 2 reels, 3 posts (carousels / text posts), 1 long video. The queue must hold at least
TARGET_DAYS of each, built from the owner's reference links in outputs/video-pipeline/reference-inbox.json.

    python -m app.refill add <url> [--note TEXT]   # put a reference link in the inbox
    python -m app.refill status [--now ISO]         # days ahead per type + inbox + what to do today (JSON)
    python -m app.refill next                       # the links the daily routine should process today
    python -m app.refill mark <url> <status> [--job JOB]   # pending -> in_progress -> awaiting_approval -> queued / rejected

The scheduled task content-refill runs `status` every morning, takes `next`, runs docs/PIPELINE_PROMPT.md on each
link up to the owner-approval gate, and reports. Nothing is queued for posting without the owner's OK.
"""
import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INBOX = ROOT / 'outputs' / 'video-pipeline' / 'reference-inbox.json'
QUEUE = ROOT / 'outputs' / 'video-pipeline' / 'repost-queue.json'
GST = timezone(timedelta(hours=4))
TARGET_DAYS = 7
DAILY_MIN = {'reels': 2, 'posts': 3, 'long': 1}
STATUSES = ('pending', 'in_progress', 'awaiting_approval', 'queued', 'rejected')
REELS_PER_LINK = 1


def _read(path, default):
    try:
        return json.loads(Path(path).read_text())
    except (FileNotFoundError, ValueError):
        return default


def _write(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def load_inbox(path=INBOX):
    return _read(path, {'_about': 'Owner reference links for the refill (app.refill). Statuses: ' + ', '.join(STATUSES),
                        'links': []})


def add(url, note='', path=INBOX, today=None):
    inbox = load_inbox(path)
    if any(l['url'] == url for l in inbox['links']):
        return {'status': 'already_in_inbox', 'url': url}
    inbox['links'].append({'url': url, 'note': note, 'added': str(today or date.today()), 'status': 'pending', 'job': None})
    _write(path, inbox)
    return {'status': 'added', 'url': url, 'pending': sum(l['status'] == 'pending' for l in inbox['links'])}


def mark(url, status, job=None, path=INBOX):
    if status not in STATUSES:
        raise ValueError(f'status must be one of {STATUSES}')
    inbox = load_inbox(path)
    for l in inbox['links']:
        if l['url'] == url:
            l['status'] = status
            if job:
                l['job'] = job
            _write(path, inbox)
            return l
    raise KeyError(f'{url} is not in the inbox')


def _day(entry):
    return entry['local'][:10]


def coverage(entries, today):
    """Per type: the GST days from today on that meet the daily minimum, and the first day that does not."""
    reels, posts, long_ = {}, {}, {}
    for e in entries:
        if e.get('status') not in ('pending', 'posted'):
            continue
        d = _day(e)
        if e['platform'] == 'instagram':
            reels[d] = reels.get(d, 0) + 1
        elif e['platform'] in ('instagram_carousel', 'linkedin_carousel', 'linkedin_post', 'x_post'):
            posts[d] = posts.get(d, 0) + 1
        elif e['platform'] == 'youtube_long':
            long_[d] = long_.get(d, 0) + 1
    out = {}
    for name, counts in (('reels', reels), ('posts', posts), ('long', long_)):
        ahead, first_gap = 0, None
        for i in range(TARGET_DAYS + 7):
            d = str(today + timedelta(days=i))
            if counts.get(d, 0) >= DAILY_MIN[name]:
                if first_gap is None:
                    ahead += 1
            elif first_gap is None:
                first_gap = d
        out[name] = {'days_ahead': ahead, 'first_gap': first_gap, 'daily_min': DAILY_MIN[name]}
    return out


def status(now=None, inbox_path=INBOX, queue_path=QUEUE):
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(GST).date()
    entries = _read(queue_path, {'entries': []})['entries']
    cov = coverage(entries, today)
    inbox = load_inbox(inbox_path)
    counts = {s: sum(l['status'] == s for l in inbox['links']) for s in STATUSES}
    reel_short = max(0, TARGET_DAYS - cov['reels']['days_ahead'])
    in_flight = counts['in_progress'] + counts['awaiting_approval']
    need_links = max(0, reel_short * DAILY_MIN['reels'] - in_flight * REELS_PER_LINK)
    actions = []
    if need_links:
        actions.append(f"process {min(need_links, 2)} reference link(s) today (reels are {cov['reels']['days_ahead']} "
                       f"day(s) ahead, target {TARGET_DAYS})")
    if need_links > counts['pending']:
        actions.append(f"ask the owner for {need_links - counts['pending']} more reference link(s): the inbox has "
                       f"{counts['pending']} pending")
    if cov['posts']['days_ahead'] < TARGET_DAYS:
        actions.append('posts lane: no carousel/text-post builder exists yet (gap, see docs/PIPELINE_V2.md)')
    if cov['long']['days_ahead'] < TARGET_DAYS:
        actions.append('long-video lane: no daily long-video lane exists yet (gap)')
    return {'today_gst': str(today), 'target_days': TARGET_DAYS, 'coverage': cov, 'inbox': counts,
            'links_needed': need_links, 'actions': actions}


def next_links(limit=2, inbox_path=INBOX, queue_path=QUEUE, now=None):
    st = status(now, inbox_path, queue_path)
    n = min(limit, st['links_needed'])
    pending = [l for l in load_inbox(inbox_path)['links'] if l['status'] == 'pending']
    return pending[:n]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('add'); a.add_argument('url'); a.add_argument('--note', default='')
    s = sub.add_parser('status'); s.add_argument('--now')
    sub.add_parser('next')
    m = sub.add_parser('mark'); m.add_argument('url'); m.add_argument('status'); m.add_argument('--job')
    args = parser.parse_args(argv)
    if args.cmd == 'add':
        out = add(args.url, args.note)
    elif args.cmd == 'status':
        out = status(datetime.fromisoformat(args.now.replace('Z', '+00:00')) if args.now else None)
    elif args.cmd == 'next':
        out = next_links()
    else:
        out = mark(args.url, args.status, args.job)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False); print()


if __name__ == '__main__':
    main()
