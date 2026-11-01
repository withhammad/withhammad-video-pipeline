"""Pipeline dashboard data: one JSON per table, from the pipeline's own files (no platform API calls).

    python -m app.dashboard_data            # writes outputs/video-pipeline/dashboard/*.json and prints a summary

Tables: posts (one row per post the pipeline made or has queued, every platform), queue_daily (per day:
pending/posted/failed), replies (keyword replies sent per platform), rules (keyword DM rules), reels (one row
per finished reel: platforms it is on, SEO researched, blog live), tasks (scheduled routines).
The Claude task repost-queue-run-due uploads these to the dashboard after each run.
"""
import glob
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JOBS = ROOT / 'studio' / '.local' / 'jobs'
OUT = ROOT / 'outputs' / 'video-pipeline' / 'dashboard'
QUEUE = ROOT / 'outputs' / 'video-pipeline' / 'repost-queue.json'
LOCAL = ROOT / 'studio' / '.local'
RULES = ROOT / 'work' / 'site' / 'withhammad-rebuild' / 'src' / 'content' / 'dm-rules.json'
BLOG = ROOT / 'work' / 'site' / 'withhammad-rebuild' / 'src' / 'content' / 'blog-posts'
URL_PATTERNS = {'youtube': r'youtube\.com/(?:shorts|watch)[^"\s]*', 'linkedin': r'linkedin\.com/(?:feed/update|posts)/[^"\s]*',
                'instagram': r'instagram\.com/reel/[A-Za-z0-9_-]+', 'tiktok': r'tiktok\.com/@[^/]+/video/\d+',
                'facebook': r'facebook\.com/[^"\s]*(?:videos|reel|posts)[^"\s]*', 'x': r'(?:x|twitter)\.com/[^/"\s]+/status/\d+'}


def _read(path, default):
    try:
        return json.loads(Path(path).read_text())
    except (FileNotFoundError, ValueError):
        return default


def reels():
    rows = []
    for jdir in sorted(JOBS.iterdir()):
        lesson = _read(jdir / 'lesson.json', None)
        if not lesson or not (jdir / 'final.mp4').exists():
            continue
        blob = ''.join(Path(f).read_text() for f in glob.glob(str(jdir / 'publish*.json')))
        seo = _read(jdir / 'seo' / 'seo.json', {})
        slug = (lesson.get('resource_page') or {}).get('slug') or ''
        row = {'job': jdir.name, 'title': (lesson.get('topic_title') or lesson.get('title') or jdir.name)[:70],
               'keyword': lesson.get('manychat_keyword') or '', 'slug': slug,
               'seo_researched': 'yes' if seo.get('researched_at') and seo.get('sources') else 'no',
               'blog_live': 'yes' if slug and (BLOG / f'{slug}.ts').exists() else 'no'}
        for platform, pat in URL_PATTERNS.items():
            row[platform] = 'yes' if re.search(pat, blob) else 'no'
        row['platforms_on'] = sum(row[p] == 'yes' for p in URL_PATTERNS)
        rows.append(row)
    return rows


def posts():
    rows = []
    for jdir in sorted(JOBS.iterdir()):
        for f in glob.glob(str(jdir / 'publish*.json')):
            data = _read(f, {})
            name = Path(f).stem
            platform = next((p for p in URL_PATTERNS if p in name), None)
            url = data.get('permalink') or data.get('post_url') or data.get('url') or ''
            if not platform or not url:
                continue
            rows.append({'job': jdir.name, 'platform': platform, 'url': url, 'status': 'posted',
                         'when': (data.get('published_at') or data.get('at') or '')[:10],
                         'account': 'withhammad.ai' if 'withhammad_ai' in name else ('page' if 'page' in name else '')})
    for e in _read(QUEUE, {}).get('entries', []):
        if e['status'] == 'posted':
            continue   # its state file above already lists it
        rows.append({'job': e['job'], 'platform': e['platform'], 'url': e.get('url') or '', 'status': e['status'],
                     'when': e['local'][:10], 'account': 'withhammad.ai' if e['platform'] == 'instagram' else ''})
    return rows


def queue_daily():
    days = {}
    for e in _read(QUEUE, {}).get('entries', []):
        d = days.setdefault(e['local'][:10], {'day': e['local'][:10], 'pending': 0, 'posted': 0, 'failed': 0, 'missed': 0})
        d[e['status']] = d.get(e['status'], 0) + 1
    return list(days.values())


def replies():
    rows = []
    for platform in ('linkedin', 'x', 'tiktok', 'youtube'):
        state = _read(LOCAL / f'{platform}-keyword-state.json', {})
        for key, r in (state.get('replied') or {}).items():
            rows.append({'platform': platform, 'keyword': r.get('keyword', ''), 'author': r.get('author', ''),
                         'at': (r.get('at') or '')[:10], 'via': r.get('via', 'api')})
    return rows


def rules():
    return [{'keyword': r['keyword'], 'link': r['link']} for r in _read(RULES, {}).get('rules', [])]


def tasks():
    rows = []
    for skill in sorted(Path.home().glob('.claude/scheduled-tasks/*/SKILL.md')):
        text = skill.read_text()
        m = re.search(r'^(?:cron|cronExpression|schedule):\s*"?([^"\n]+)"?', text, re.M)
        en = re.search(r'^enabled:\s*(\w+)', text, re.M)
        rows.append({'task': skill.parent.name, 'schedule': (m.group(1) if m else '').strip(),
                     'enabled': (en.group(1) if en else 'unknown')})
    return rows


def main(argv=None):
    OUT.mkdir(parents=True, exist_ok=True)
    tables = {'reels': reels(), 'posts': posts(), 'queue_daily': queue_daily(), 'replies': replies(),
              'rules': rules(), 'tasks': tasks()}
    stamp = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    for name, rows in tables.items():
        (OUT / f'{name}.json').write_text(json.dumps({'updated_at': stamp, 'rows': rows}, indent=1, ensure_ascii=False) + '\n')
    summary = {k: len(v) for k, v in tables.items()}
    summary['posted'] = sum(1 for p in tables['posts'] if p['status'] == 'posted')
    summary['pending'] = sum(1 for p in tables['posts'] if p['status'] == 'pending')
    json.dump({'updated_at': stamp, **summary}, sys.stdout, indent=2); print()


if __name__ == '__main__':
    main()
