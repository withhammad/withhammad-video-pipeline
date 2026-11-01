"""Repost queue: put already-made reels on accounts that never got them.

Owner 2026-11-01: every AI reel goes out again from the new Instagram @withhammad.ai (Collab invites to
@with.hammad + @hammadagentic.ai), and the reels LinkedIn never got are posted there too. The daily queue in
publish_reel would upload a second YouTube Short, so these posts live in their own file:
outputs/video-pipeline/repost-queue.json. Each entry is one post on one platform at one slot.

State files are new per platform (publish_instagram_withhammad_ai.json, publish_linkedin_repost.json), so the
old @with.hammad posts never make the publisher think this one is already out. Videos are hosted under a
per-job slug (repost-<job>) because two reels share one resource page.

    python -m app.repost_queue status
    python -m app.repost_queue run-due [--now ISO]      # dry run: what would post now
    python -m app.repost_queue run-due --live           # post what is due (the scheduled task runs this)
"""
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import publish_reel as pr

ROOT = Path(__file__).resolve().parents[2]
QUEUE = ROOT / 'outputs' / 'video-pipeline' / 'repost-queue.json'
JOBS = ROOT / 'studio' / '.local' / 'jobs'
IG_ACCOUNT = 'withhammad.ai'
STATE = {'instagram': 'publish_instagram_withhammad_ai.json', 'linkedin': 'publish_linkedin_repost.json',
         'facebook': 'publish_facebook_page.json', 'youtube': 'publish_youtube_repost.json'}
LATE_LIMIT = timedelta(hours=6)


def load(path=QUEUE):
    return json.loads(Path(path).read_text())


def save(data, path=QUEUE):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def _utc(text):
    return datetime.fromisoformat(text.replace('Z', '+00:00'))


def due(entries, now):
    """Pending entries whose slot has passed and is less than LATE_LIMIT old; older pending ones are 'missed'."""
    ready, missed = [], []
    for e in entries:
        if e.get('status') != 'pending':
            continue
        slot = _utc(e['slot_utc'])
        if slot <= now < slot + LATE_LIMIT:
            ready.append(e)
        elif now >= slot + LATE_LIMIT:
            missed.append(e)
    return ready, missed


def post(entry, rt, live):
    jdir = JOBS / entry['job']
    lesson = json.loads((jdir / 'lesson.json').read_text())
    if entry['platform'] == 'instagram':
        lesson = {**lesson, 'captions': {**(lesson.get('captions') or {}), 'instagram': entry['caption']}}
        urls = pr.hosted_urls(entry['host_slug'])
        if live:
            pr.host_instagram_media(jdir, entry['host_slug'], entry.get('keyword'), rt)
        result = rt.instagram_publish(jdir / 'final_ig.mp4', lesson, dry_run=not live,
                                      state_path=jdir / STATE['instagram'] if live else None,
                                      expected_username=IG_ACCOUNT, collaborators=entry.get('collaborators'),
                                      url_provider=urls['video_url'], cover_url=urls['cover_url'],
                                      cover_path=jdir / 'cover_1080x1920.jpg', ai_generated=True)
        return {'url': result.get('permalink'), 'media_id': result.get('media_id'), 'status': result.get('status'),
                'collaborators': result.get('collaborators')}
    if entry['platform'] == 'youtube':
        seo = json.loads((jdir / 'seo' / 'seo.json').read_text()).get('youtube') or {}
        captions = {**(lesson.get('captions') or {}), 'youtube_title': seo.get('title') or entry['title'],
                    'youtube_description': entry['caption']}
        lesson = {**lesson, 'captions': captions, 'hashtags': seo.get('tags') or lesson.get('hashtags') or []}
        result = rt.youtube_publish(jdir / 'final.mp4', lesson, dry_run=not live,
                                    state_path=jdir / STATE['youtube'] if live else None,
                                    privacy_status='public', thumbnail_path=jdir / 'cover_1080x1920.jpg',
                                    contains_synthetic_media=True)
        vid = result.get('video_id')
        return {'url': f'https://www.youtube.com/shorts/{vid}' if vid else None, 'video_id': vid,
                'status': result.get('status'), 'warnings': result.get('warnings')}
    if entry['platform'] == 'facebook':
        from app import publish_facebook
        lesson = {**lesson, 'captions': {**(lesson.get('captions') or {}), 'facebook': entry['caption']}}
        urls = pr.hosted_urls(entry['host_slug'])
        if live:
            pr.host_instagram_media(jdir, entry['host_slug'], entry.get('keyword'), rt)   # idempotent: same bytes, no new commit
        result = publish_facebook.publish(urls['video_url'], lesson, dry_run=not live,
                                          state_path=jdir / STATE['facebook'] if live else None)
        return {'url': result.get('permalink'), 'video_id': result.get('video_id'), 'status': result.get('status'),
                'warnings': result.get('warnings')}
    lesson = {**lesson, 'captions': {**(lesson.get('captions') or {}), 'linkedin': entry['caption']}}
    result = rt.linkedin_publish(jdir / 'final.mp4', lesson, dry_run=not live,
                                 state_path=jdir / STATE['linkedin'] if live else None,
                                 thumbnail_path=jdir / 'cover_720x1280.jpg')
    return {'url': result.get('post_url'), 'post_urn': result.get('post_urn'), 'status': result.get('status')}


def run_due(now=None, live=False, rt=None, path=QUEUE):
    rt = rt or pr.Runtime()
    now = now or datetime.now(timezone.utc)
    data = load(path)
    ready, missed = due(data['entries'], now)
    report = {'now': now.isoformat(), 'live': live, 'posted': [], 'failed': [], 'missed': [e['id'] for e in missed]}
    for e in missed:
        if live:
            e['status'] = 'missed'
    for e in ready:
        try:
            out = post(e, rt, live)
        except Exception as error:  # one failure must not stop the other due posts
            report['failed'].append({'id': e['id'], 'error': str(error)[:300]})
            if live:
                e.update(status='failed', error=str(error)[:300])
            continue
        report['posted'].append({'id': e['id'], **out})
        if live:
            if out.get('status') not in ('published', 'already_published'):
                e.update(status='failed', error=f"publisher status {out.get('status')!r}")
            else:
                e.update(status='posted', url=out.get('url'), posted_at=now.strftime('%Y-%m-%dT%H:%M:%SZ'))
    if live:
        save(data, path)
    return report


PLAN = ROOT / 'outputs' / 'video-pipeline' / 'repost-plan.json'
GST_OFFSET = timedelta(hours=4)


def _slot(date, hhmm):
    local = datetime.fromisoformat(f'{date}T{hhmm}:00').replace(tzinfo=timezone(GST_OFFSET))
    return local.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), f'{date} {hhmm} GST'


def seo_caption(job, platform):
    """The researched per-platform copy for a job; refuses a pack without research (owner rule 2026-11-01)."""
    seo = json.loads((JOBS / job / 'seo' / 'seo.json').read_text())
    if not seo.get('researched_at') or not seo.get('sources'):
        raise ValueError(f'{job}: seo/seo.json has no researched_at/sources; research it before queueing')
    section = seo.get(platform) or {}
    text = section.get('caption') or section.get('text') or section.get('description') or ''
    if not text.strip():
        raise ValueError(f'{job}: seo/seo.json has no {platform} copy')
    if platform == 'instagram' and '@withhammad.ai' not in text:
        raise ValueError(f'{job}: Instagram caption must ask to follow @withhammad.ai')
    if platform != 'linkedin' and ('@with.hammad' in text or '@hammadagentic.ai' in text):
        raise ValueError(f'{job}: {platform} copy still names a retired account')
    return text.strip(), seo


def build(plan_path=PLAN, path=QUEUE):
    """Rebuild repost-queue.json from the plan + each job's seo.json. Entries already posted/failed are kept as is."""
    plan = json.loads(Path(plan_path).read_text())
    old = {e['id']: e for e in (load(path)['entries'] if Path(path).exists() else [])}
    entries = []

    def add(job, platform, date, hhmm):
        lesson = json.loads((JOBS / job / 'lesson.json').read_text())
        text, seo = seo_caption(job, platform)
        slot, local = _slot(date, hhmm)
        eid = f'{platform[:2]}-{job}'
        prev = old.get(eid)
        if prev and prev.get('status') in ('posted', 'failed', 'missed'):
            entries.append(prev); return
        entries.append({'id': eid, 'job': job, 'platform': platform, 'slot_utc': slot, 'local': local,
                        'keyword': lesson.get('manychat_keyword') or seo.get('keyword'),
                        'title': lesson.get('topic_title') or lesson.get('title') or job, 'caption': text,
                        'primary_keyword': seo.get('primary_keyword'), 'host_slug': f'repost-{job}',
                        'collaborators': None, 'status': 'pending'})
    for day in plan['days']:
        for hhmm, job in zip(plan['instagram_times'], day['instagram']):
            add(job, 'instagram', day['date'], hhmm)
        for hhmm, job in zip(plan['facebook_times'], day['instagram']):
            add(job, 'facebook', day['date'], hhmm)
        for hhmm, job in zip(plan['linkedin_times'], day.get('linkedin', [])):
            add(job, 'linkedin', day['date'], hhmm)
        for hhmm, job in zip(plan.get('youtube_times', []), day.get('youtube', [])):
            add(job, 'youtube', day['date'], hhmm)
    entries.sort(key=lambda e: e['slot_utc'])
    save({'_about': 'Built by app.repost_queue build from repost-plan.json; captions from each job seo/seo.json. '
                    'Runner: python -m app.repost_queue run-due --live (scheduled task repost-queue-run-due).',
          'built_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'entries': entries}, path)
    return entries


def status(path=QUEUE):
    rows = []
    for e in load(path)['entries']:
        rows.append(f"{e['local']:17} {e['platform']:9} {e['keyword'] or '-':10} {e['status']:8} {e['title'][:48]}"
                    + (f"  {e['url']}" if e.get('url') else ''))
    return '\n'.join(rows)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('status')
    sub.add_parser('build', help='rebuild the queue from repost-plan.json + each job seo/seo.json')
    r = sub.add_parser('run-due')
    r.add_argument('--live', action='store_true')
    r.add_argument('--now', help='dry runs only: ISO time')
    args = parser.parse_args(argv)
    if args.cmd == 'status':
        print(status())
        return 0
    if args.cmd == 'build':
        entries = build()
        print(f'{len(entries)} entries'); print(status())
        return 0
    if args.live and args.now:
        parser.error('--live always uses the real clock')
    report = run_due(_utc(args.now) if args.now else None, live=args.live)
    json.dump(report, sys.stdout, indent=2, ensure_ascii=False); print()
    return 1 if report['failed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
