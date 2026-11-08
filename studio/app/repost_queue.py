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
    python -m app.repost_queue chrome                   # TikTok + X entries still to schedule in Chrome (no free API)
    python -m app.repost_queue mark <id> <url> [--scheduled]   # record a Chrome post or a native scheduled post
    python -m app.repost_queue sounds [--date YYYY-MM-DD]      # today's Instagram reels to post in the app with a trending sound

Trending sounds (owner 2026-11-03): the APIs cannot attach a library sound, so each Instagram reel waits APP_GRACE after
its slot for the owner to post it from the app with a trending sound under the voice (then `mark`); if he has not,
run-due posts it by API without the sound, so the cadence never breaks.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app import publish_reel as pr

ROOT = Path(__file__).resolve().parents[2]
QUEUE = ROOT / 'outputs' / 'video-pipeline' / 'repost-queue.json'
JOBS = ROOT / 'studio' / '.local' / 'jobs'
IG_ACCOUNT = 'withhammad.ai'
STATE = {'instagram': 'publish_instagram_withhammad_ai.json', 'linkedin': 'publish_linkedin_repost.json',
         'facebook': 'publish_facebook_page.json', 'youtube': 'publish_youtube_repost.json',
         'instagram_carousel': 'publish_instagram_carousel_withhammad_ai.json',
         'facebook_carousel': 'publish_facebook_album.json', 'linkedin_carousel': 'publish_linkedin_carousel_repost.json'}
CAROUSELS = ('instagram_carousel', 'facebook_carousel', 'linkedin_carousel')
ID_PREFIX = {'instagram_carousel': 'ic', 'facebook_carousel': 'fc', 'linkedin_carousel': 'lc',
             'instagram_guide': 'ig', 'facebook_guide': 'fg', 'linkedin_guide': 'lg'}
# guide carousels (outputs/guides/<slug>, the AI Central template) post through the carousel publishers
GUIDES = ROOT / 'outputs' / 'guides'
GUIDE_LANES = {'instagram_guide': 'instagram_carousel', 'facebook_guide': 'facebook_carousel',
               'linkedin_guide': 'linkedin_carousel'}
# TikTok and X have no free posting API: their entries are scheduled ahead in TikTok Studio / X's own scheduler
# through Claude in Chrome (owner 2026-11-02 "add them now"), then recorded with `mark`. run-due never touches them.
CHROME_LANES = ('tiktok', 'x', 'tiktok_guide', 'x_guide')
ID_PREFIX.update(tiktok='tt', x='xx', youtube_guide='yg', tiktok_guide='tg', x_guide='xg')
# Owner 2026-11-02 (red line: 2-3 posts a day on every platform): each guide also goes out as a 9:16 slide video
# (python -m app.guide short <slug> -> outputs/guides/<slug>/short.mp4) on YouTube Shorts (API), TikTok and X (Chrome).
GUIDE_VIDEO_LANES = ('youtube_guide', 'tiktok_guide', 'x_guide')
LATE_LIMIT = timedelta(hours=6)
APP_SOUND_LANES = ('instagram', 'youtube')   # reels/Shorts the owner may post from the app with a trending sound (YouTube: owner 2026-11-05)
APP_GRACE = timedelta(hours=2)
SOUNDS = ROOT / 'outputs' / 'video-pipeline' / 'trending-sounds.json'


def load(path=QUEUE):
    return json.loads(Path(path).read_text())


def save(data, path=QUEUE):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def _utc(text):
    return datetime.fromisoformat(text.replace('Z', '+00:00'))


def page_live(url, _cache={}):
    """True when the reel's withhammad.com resource page answers 200 (the keyword DM links there)."""
    if url not in _cache:
        try:
            import httpx
            _cache[url] = httpx.get(url, timeout=20, follow_redirects=True).status_code == 200
        except Exception:
            _cache[url] = False
    return _cache[url]


def due(entries, now, page_check=None):
    """Pending entries whose slot has passed and is less than LATE_LIMIT old; older pending ones are 'missed'.
    An entry with a resource_url waits (stays pending) until that page is live, so no post links to a 404."""
    page_check = page_check or page_live
    ready, missed = [], []
    for e in entries:
        if e.get('status') != 'pending' or e['platform'] in CHROME_LANES:
            continue
        if e.get('resource_url') and not page_check(e['resource_url']):
            if now >= _utc(e['slot_utc']) + LATE_LIMIT:
                missed.append(e)
            continue
        slot = _utc(e['slot_utc'])
        start = slot + APP_GRACE if e['platform'] in APP_SOUND_LANES else slot
        if start <= now < slot + LATE_LIMIT:
            ready.append(e)
        elif now >= slot + LATE_LIMIT:
            missed.append(e)
    return ready, missed


def _carousel_urls(jdir, entry, rt, live):
    """Hosted slide URLs and byte sizes. Live: one idempotent site commit; dry run: the URLs they will have."""
    files = pr.carousel_files(jdir) or {}
    slides = files.get('instagram') or []
    if not slides:
        raise ValueError(f"{entry['job']}: no carousel/instagram-NN.png slides; render the carousel first")
    if live:
        hosted = pr.host_carousel_media(jdir, entry['host_slug'], entry.get('keyword'), rt)
        return hosted['image_urls'], hosted.get('image_bytes')
    return pr.hosted_carousel_urls(entry['host_slug'], len(slides)), None


def post_carousel(entry, jdir, lesson, rt, live):
    pf = entry['platform']
    caps = dict(lesson.get('captions') or {})
    if pf == 'linkedin_carousel':
        pdf = jdir / 'carousel' / 'carousel-linkedin.pdf'
        if not pdf.exists():
            raise ValueError(f"{entry['job']}: carousel-linkedin.pdf missing; run app.carousel build")
        result = rt.linkedin_document_publish(pdf, {**lesson, 'captions': {**caps, 'linkedin': entry['caption']}},
                                              dry_run=not live, title=entry.get('doc_title') or entry['title'],
                                              state_path=jdir / STATE[pf] if live else None)
        return {'url': result.get('post_url'), 'post_urn': result.get('post_urn'), 'status': result.get('status')}
    urls, sizes = _carousel_urls(jdir, entry, rt, live)
    if pf == 'facebook_carousel':
        from app import publish_facebook
        result = publish_facebook.publish_album(urls, {**lesson, 'captions': {**caps, 'facebook': entry['caption']}},
                                                dry_run=not live, state_path=jdir / STATE[pf] if live else None)
        return {'url': result.get('permalink'), 'post_id': result.get('post_id'), 'status': result.get('status')}
    result = _collab_retry(lambda collabs: rt.instagram_carousel_publish(
        urls, {**lesson, 'captions': {**caps, 'instagram': entry['caption']}}, dry_run=not live,
        state_path=jdir / STATE[pf] if live else None, expected_username=IG_ACCOUNT, image_sizes=sizes, ai_generated=True,
        **({} if collabs is None else {'collaborators': collabs})), entry.get('collaborators'))
    return {'url': result.get('permalink'), 'media_id': result.get('media_id'), 'status': result.get('status'),
            'collaborators': result.get('collaborators')}


# The owner's main Instagram has flipped between @with.hammad and @with.hamad (2 Nov, 5 Nov); a stale handle makes Meta
# refuse the whole post (code 2207018 "Invalid user id"). Try the other spelling, then post with @hammadagentic.ai alone.
COLLAB_FALLBACKS = (['with.hammad', 'hammadagentic.ai'], ['with.hamad', 'hammadagentic.ai'], ['hammadagentic.ai'])


def _collab_retry(publish, collaborators):
    tries = [collaborators] + [c for c in COLLAB_FALLBACKS if c != collaborators]
    for i, collabs in enumerate(tries):
        try:
            return publish(collabs)
        except Exception as error:
            if i == len(tries) - 1 or not re.search(r'2207018|Invalid user id', str(error)):
                raise


def _guide_stage(slug, base=None):
    """<guide>/.host/carousel/ holding the rendered pages under the names the carousel hosting code expects
    (instagram-NN.png, carousel-linkedin.pdf); the publishers' state files live in <guide>/.host too."""
    import shutil
    g = Path(base or GUIDES) / slug
    stage = g / '.host'
    folder = stage / 'carousel'
    folder.mkdir(parents=True, exist_ok=True)
    wanted = sorted(g.glob('instagram-[0-9][0-9].png')) + [g / 'carousel-linkedin.pdf']
    for old in folder.iterdir():
        if old.name not in {w.name for w in wanted}:
            old.unlink()
    for src in wanted:
        if not src.exists():
            raise ValueError(f'{slug}: {src.name} missing; render the guide and run app.guide build')
        dest = folder / src.name
        if not dest.exists() or dest.read_bytes() != src.read_bytes():
            shutil.copyfile(src, dest)
    return stage


def post(entry, rt, live):
    if entry['platform'] == 'youtube_guide':
        gdir = GUIDES / entry['guide']
        lesson = {'captions': {'youtube_title': entry['title'], 'youtube_description': entry['caption']}, 'hashtags': []}
        result = rt.youtube_publish(gdir / 'short.mp4', lesson, dry_run=not live,
                                    state_path=gdir / 'publish_youtube_guide.json' if live else None,
                                    privacy_status='public', contains_synthetic_media=False)
        vid = result.get('video_id')
        return {'url': f'https://www.youtube.com/shorts/{vid}' if vid else None, 'video_id': vid,
                'status': result.get('status'), 'warnings': result.get('warnings')}
    if entry['platform'] in GUIDE_LANES:
        stage = _guide_stage(entry['guide'])
        return post_carousel({**entry, 'platform': GUIDE_LANES[entry['platform']]}, stage, {'captions': {}}, rt, live)
    jdir = JOBS / entry['job']
    lesson = json.loads((jdir / 'lesson.json').read_text())
    if entry['platform'] in CAROUSELS:
        return post_carousel(entry, jdir, lesson, rt, live)
    if entry['platform'] == 'instagram':
        lesson = {**lesson, 'captions': {**(lesson.get('captions') or {}), 'instagram': entry['caption']}}
        urls = pr.hosted_urls(entry['host_slug'])
        if live:
            pr.host_instagram_media(jdir, entry['host_slug'], entry.get('keyword'), rt)
        result = _collab_retry(lambda collabs: rt.instagram_publish(
            jdir / 'final_ig.mp4', lesson, dry_run=not live, state_path=jdir / STATE['instagram'] if live else None,
            expected_username=IG_ACCOUNT, collaborators=collabs, url_provider=urls['video_url'],
            cover_url=urls['cover_url'], cover_path=jdir / 'cover_1080x1920.jpg', ai_generated=True),
            entry.get('collaborators'))
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
    variant = entry.get('video_variant', 'default')
    if variant not in ('default', 'linkedin'):
        raise ValueError(f"{entry['job']}: unsupported LinkedIn video_variant {variant!r}")
    video = jdir / ('final_linkedin.mp4' if variant == 'linkedin' else 'final.mp4')
    if variant == 'linkedin' and not video.is_file():
        raise ValueError(f"{entry['job']}: approved LinkedIn variant final_linkedin.mp4 is missing")
    if variant == 'linkedin' and lesson.get('caption_file'):
        captions = jdir / 'captions_linkedin.srt'
        if not captions.is_file():
            raise ValueError(f"{entry['job']}: approved LinkedIn variant captions_linkedin.srt is missing")
        lesson = {**lesson, 'caption_file': str(captions)}
    result = rt.linkedin_publish(video, lesson, dry_run=not live,
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
    text = section.get('caption') or section.get('text') or section.get('post') or section.get('description') or ''
    if not text.strip():
        raise ValueError(f'{job}: seo/seo.json has no {platform} copy')
    if platform == 'instagram' and '@withhammad.ai' not in text:
        raise ValueError(f'{job}: Instagram caption must ask to follow @withhammad.ai')
    if platform != 'linkedin' and ('@with.hammad' in text or '@hammadagentic.ai' in text):
        raise ValueError(f'{job}: {platform} copy still names a retired account')
    return text.strip(), seo


def carousel_caption(job, platform):
    """The carousel caption for one platform from carousel/captions.json, only when app.carousel check passes."""
    from app import carousel
    report = carousel.check(job)
    if report['errors']:
        raise ValueError(f"{job}: carousel check fails: {report['errors'][:3]}")
    caps = json.loads((JOBS / job / 'carousel' / 'captions.json').read_text())
    return caps[platform.replace('_carousel', '')].strip(), caps


def build(plan_path=PLAN, path=QUEUE):
    """Rebuild repost-queue.json from the plan + each job's seo.json. Entries already posted/failed are kept as is."""
    plan = json.loads(Path(plan_path).read_text())
    old = {e['id']: e for e in (load(path)['entries'] if Path(path).exists() else [])}
    entries = []

    def add(job, platform, date, hhmm):
        lesson = json.loads((JOBS / job / 'lesson.json').read_text())
        if platform in CAROUSELS:
            text, caps = carousel_caption(job, platform)
            seo = {'primary_keyword': None, 'doc_title': caps.get('title')}
        else:
            text, seo = seo_caption(job, platform)
        slot, local = _slot(date, hhmm)
        eid = f"{ID_PREFIX.get(platform, platform[:2])}-{job}"
        prev = old.get(eid)
        if prev and prev.get('status') in ('posted', 'scheduled', 'failed', 'missed'):
            entries.append(prev); return
        entries.append({'id': eid, 'job': job, 'platform': platform, 'slot_utc': slot, 'local': local,
                        'keyword': lesson.get('manychat_keyword') or seo.get('keyword'),
                        'title': lesson.get('topic_title') or lesson.get('title') or job, 'caption': text,
                        'primary_keyword': seo.get('primary_keyword'), 'host_slug': f'repost-{job}',
                        'collaborators': None, 'status': 'pending',
                        **({'doc_title': seo['doc_title']} if seo.get('doc_title') else {})})
    def add_guide(slug, platform, date, hhmm):
        from app import guide
        report = guide.check(slug)
        if report['errors']:
            raise ValueError(f"guide {slug}: check fails: {report['errors'][:3]}")
        spec = json.loads((GUIDES / slug / 'guide.json').read_text())
        caps = json.loads((GUIDES / slug / 'captions.json').read_text())
        slot, local = _slot(date, hhmm)
        eid = f'{ID_PREFIX[platform]}-{slug}'
        prev = old.get(eid)
        if prev and prev.get('status') in ('posted', 'scheduled', 'failed', 'missed'):
            entries.append(prev); return
        entries.append({'id': eid, 'guide': slug, 'job': None, 'platform': platform, 'slot_utc': slot, 'local': local,
                        'keyword': spec['keyword'],
                        'title': (caps.get('youtube_title') if platform == 'youtube_guide' else None) or caps.get('title') or spec['docTitle'],
                        'doc_title': caps.get('title') or spec['docTitle'],
                        'caption': caps[platform.replace('_guide', '')].strip(), 'primary_keyword': None,
                        'host_slug': f'guide-{slug}', 'collaborators': None, 'status': 'pending'})
    for day in plan['days']:
        for hhmm, slug in zip(plan.get('guide_times', []), day.get('guides', [])):
            for platform in GUIDE_LANES:   # one guide goes to IG, the FB Page and LinkedIn at the same slot
                add_guide(slug, platform, day['date'], hhmm)
        for hhmm, slug in zip(plan.get('guide_video_times', []), day.get('guides', [])):
            for platform in GUIDE_VIDEO_LANES:   # and as a slide video on YouTube, TikTok and X
                add_guide(slug, platform, day['date'], hhmm)
        for hhmm, job in zip(plan['instagram_times'], day['instagram']):
            add(job, 'instagram', day['date'], hhmm)
        for hhmm, job in zip(plan['facebook_times'], day['instagram']):
            add(job, 'facebook', day['date'], hhmm)
        for hhmm, job in zip(plan['linkedin_times'], day.get('linkedin', [])):
            add(job, 'linkedin', day['date'], hhmm)
        for hhmm, job in zip(plan.get('youtube_times', []), day.get('youtube', [])):
            add(job, 'youtube', day['date'], hhmm)
        for platform in CHROME_LANES:
            for hhmm, job in zip(plan.get(f'{platform}_times', []), day.get(platform, [])):
                add(job, platform, day['date'], hhmm)
        for hhmm, job in zip(plan.get('carousel_times', []), day.get('carousels', [])):
            for platform in CAROUSELS:      # one guide carousel goes to IG, the FB Page and LinkedIn at the same slot
                add(job, platform, day['date'], hhmm)
    entries.sort(key=lambda e: e['slot_utc'])
    save({'_about': 'Built by app.repost_queue build from repost-plan.json; captions from each job seo/seo.json. '
                    'Runner: python -m app.repost_queue run-due --live (scheduled task repost-queue-run-due).',
          'built_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'entries': entries}, path)
    return entries


def chrome_todo(path=QUEUE):
    """Pending TikTok/X entries, oldest slot first, with what Chrome needs: the file, the copy and the slot."""
    out = []
    for e in load(path)['entries']:
        if e['platform'] in CHROME_LANES and e.get('status') == 'pending':
            out.append({'id': e['id'], 'platform': e['platform'], 'local': e['local'], 'slot_utc': e['slot_utc'],
                        'video': str(GUIDES / e['guide'] / 'short.mp4') if e.get('guide') else str(JOBS / e['job'] / 'final_social.mp4'),
                        'keyword': e['keyword'], 'caption': e['caption']})
    return out


def sound_brief(day=None, path=QUEUE, sounds_path=SOUNDS):
    """The Instagram reels and YouTube Shorts of one GST day for the owner to post in the app with a trending sound."""
    day = day or datetime.now(timezone(timedelta(hours=4))).strftime('%Y-%m-%d')
    try:
        sounds = json.loads(Path(sounds_path).read_text())
    except FileNotFoundError:
        sounds = {}
    reels = []
    for e in sorted(load(path)['entries'], key=lambda e: e['slot_utc']):
        if e['platform'] in APP_SOUND_LANES and e.get('status') == 'pending' and e['local'].startswith(day):
            jdir = JOBS / e['job']
            names = ('final_ig.mp4', 'final.mp4', 'final_social.mp4') if e['platform'] == 'instagram' else ('final.mp4', 'final_social.mp4')
            video = next((str(jdir / n) for n in names if (jdir / n).exists()), str(jdir / names[0]))
            fallback = (_utc(e['slot_utc']) + APP_GRACE).astimezone(timezone(timedelta(hours=4))).strftime('%H:%M')
            row = {'id': e['id'], 'platform': e['platform'], 'post_at_gst': e['local'][11:16], 'api_fallback_gst': fallback,
                   'keyword': e['keyword'], 'video': video, 'cover': str(jdir / 'cover_glow' / 'cover_1080x1920.jpg'),
                   'caption': e['caption'], 'after_posting': f"python -m app.repost_queue mark {e['id']} <post url>"}
            if e['platform'] == 'instagram':
                row['collaborators'] = list(e.get('collaborators') or ('with.hammad', 'hammadagentic.ai'))
            else:
                row['title'] = e['title']
            reels.append(row)
    per = {pf: {'how': (sounds.get(pf) or sounds).get('how', ''), 'sounds': (sounds.get(pf) or sounds).get('sounds', [])}
           for pf in APP_SOUND_LANES}
    return {'day': day, 'checked': sounds.get('checked'), **per['instagram'], 'platforms': per, 'reels': reels}


def mark(entry_id, url, scheduled=False, path=QUEUE):
    data = load(path)
    for e in data['entries']:
        if e['id'] == entry_id:
            e.update(status='scheduled' if scheduled else 'posted', url=url,
                     **{'scheduled_at' if scheduled else 'posted_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')})
            save(data, path)
            return e
    raise SystemExit(f'no queue entry {entry_id}')


def status(path=QUEUE):
    rows = []
    for e in load(path)['entries']:
        rows.append(f"{e['local']:17} {e['platform']:18} {e['keyword'] or '-':10} {e['status']:8} {e['title'][:48]}"
                    + (f"  {e['url']}" if e.get('url') else ''))
    return '\n'.join(rows)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('status')
    sub.add_parser('build', help='rebuild the queue from repost-plan.json + each job seo/seo.json')
    sub.add_parser('chrome', help='TikTok + X entries still to schedule in Chrome')
    m = sub.add_parser('mark', help='record a Chrome post (or a native scheduled post with --scheduled)')
    m.add_argument('id'); m.add_argument('url'); m.add_argument('--scheduled', action='store_true')
    sd = sub.add_parser('sounds', help="today's Instagram reels to post in the app with a trending sound")
    sd.add_argument('--date')
    r = sub.add_parser('run-due')
    r.add_argument('--live', action='store_true')
    r.add_argument('--now', help='dry runs only: ISO time')
    args = parser.parse_args(argv)
    if args.cmd == 'status':
        print(status())
        return 0
    if args.cmd == 'chrome':
        json.dump(chrome_todo(), sys.stdout, indent=2, ensure_ascii=False); print()
        return 0
    if args.cmd == 'sounds':
        json.dump(sound_brief(args.date), sys.stdout, indent=2, ensure_ascii=False); print()
        return 0
    if args.cmd == 'mark':
        e = mark(args.id, args.url, args.scheduled)
        print(f"{e['id']} {e['status']} {e['url']}")
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
