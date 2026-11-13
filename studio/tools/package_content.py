#!/usr/bin/env python3
"""Copy every finished business video, its covers and paste-ready SEO into ~/Downloads/content-claude.

One folder per video, numbered oldest first, plus INDEX.md / INDEX.csv with posting status from the repost queue.
Videos are APFS clones (cp -c): they take no extra disk space. Private personal videos are never included.

    python3 studio/tools/package_content.py [--dest ~/Downloads/content]
"""
import csv, glob, json, os, re, shutil, subprocess, sys
from datetime import datetime

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JOBS = os.path.join(REPO, 'studio/.local/jobs')
OUT = os.path.join(REPO, 'outputs')
DEST = os.path.expanduser(sys.argv[sys.argv.index('--dest') + 1] if '--dest' in sys.argv else '~/Downloads/content-claude')
# personal or separate-account videos: never in the business folder
PRIVATE = {'9aa507dd49fd', 'c421b39c46e0', 'c9319a467ed6', '6503bc107f3a',  # wife / couple / father / Asma-ul-Husna
           '50bd2b67399d',   # Ayat al-Kursi, for a separate account, not uploaded from here (docs/videos/2026-10-18-ayat-al-kursi.md)
           'b2c3e829b379'}   # knitted rebuild of zyvastudio De4Py-1NccM, "do not post"
TITLES = {'abedb4efa2df': 'Skill finder - the Claude skill that finds other skills (review cut)',
          '4a300e0907a4': 'Dossier - an app that writes a resume for every job (review cut)',
          '3410ea61e3cc': 'Open Generative AI - free open-source Higgsfield alternative (review cut)',
          'g4-boris-tips': 'How Boris Cherny runs Claude Code (LinkedIn post 10)'}
# copy text for older videos that have no seo.json
EXTRA_COPY = {'claude-video-editing-tutorial': ['youtube-upload.json', 'publication-research.md'],
              'freelance-engineering-tutorial': ['youtube-upload.json'],
              'interactive-ai-tutorial': ['youtube-details.txt', 'publish-copy.json'],
              'whatsapp-voice-agent-reel': ['caption.md', 'resource.md'],
              'linkedin-batch-20261027b': ['post-copy.txt'],
              'guides/claude-code-cold-email': ['captions.json']}
# older outputs/ folders that are the same video as a job (matched by duration), so they are not copied twice
OUT_DUPES = {'ai-dashboard-audit-reel', 'ai-engineering-projects-reel', 'ai-motion-library-reel', 'ai-website-transformation-reel',
             'claude-job-search-reel', 'coding-comedy-review', 'motion-frame-break-review'}
PLATFORMS = [('youtube', 'YOUTUBE (Shorts / video)'), ('instagram', 'INSTAGRAM'), ('tiktok', 'TIKTOK'), ('facebook', 'FACEBOOK'),
             ('linkedin', 'LINKEDIN'), ('x', 'X (TWITTER)'), ('threads', 'THREADS')]
TEXT_FIELDS = ['title', 'caption', 'text', 'post', 'description', 'first_comment', 'pinned_comment', 'alt_text', 'media_title']
LIST_FIELDS = {'tags': ', ', 'hashtags': ' ', 'keywords': ', '}


def dur(f):
    try:
        return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                                    capture_output=True, text=True, timeout=60).stdout.strip() or 0)
    except Exception:
        return 0.0


def born(f):
    st = os.stat(f)
    return getattr(st, 'st_birthtime', st.st_mtime)


def clean_name(s, n=70):
    s = re.sub(r'[\\/:*?"<>|\n\r\t]+', ' ', s).strip().strip('.')
    s = re.sub(r'\s+', ' ', s)
    return (s[:n].rsplit(' ', 1)[0] if len(s) > n else s) or 'Untitled'


def load(path):
    try:
        with open(path) as fh:
            return json.load(fh)
    except Exception:
        return None


def clone(src, dst):
    if os.path.exists(dst):
        os.remove(dst)
    if subprocess.run(['cp', '-c', src, dst], capture_output=True).returncode != 0:
        shutil.copy2(src, dst)


def seo_text(seo, title, status_lines):
    out = [title, '=' * len(title), '']
    kw = seo.get('comment_keyword') or seo.get('manychat_keyword') or seo.get('keyword')
    if kw:
        out.append(f'Comment keyword: {kw}')
    if seo.get('resource_url'):
        out.append(f'Guide page: {seo["resource_url"]}')
    out += status_lines + ['']
    for key, label in PLATFORMS:
        p = seo.get(key)
        if not isinstance(p, dict):
            continue
        out += ['', f'##### {label} #####']
        for k in ('account', 'page'):
            if p.get(k):
                out.append(f'({p[k]})')
        for f in TEXT_FIELDS:
            v = p.get(f)
            if isinstance(v, str) and v.strip():
                out += [f'--- {f.replace("_", " ").title()} ---', v.strip(), '']
        for f, sep in LIST_FIELDS.items():
            v = p.get(f)
            if isinstance(v, list) and v:
                out += [f'--- {f.title()} ---', sep.join(str(x) for x in v), '']
        if isinstance(p.get('notes'), str):
            out += ['--- Notes ---', p['notes'].strip(), '']
    if not any(isinstance(seo.get(k), dict) for k, _ in PLATFORMS):
        out += ['', json.dumps(seo, indent=2, ensure_ascii=False)]
    return '\n'.join(out).rstrip() + '\n'


def queue_status():
    q = load(os.path.join(OUT, 'video-pipeline/repost-queue.json')) or {}
    entries = q if isinstance(q, list) else next((v for v in q.values() if isinstance(v, list)), [])
    by_job = {}
    for e in entries:
        j = e.get('job')
        if not j:
            continue
        url = e.get('url') or e.get('post_url') or e.get('permalink') or ''
        by_job.setdefault(j, {})[e.get('platform', '?')] = (e.get('status', '?'), url, e.get('local', ''))
    return by_job


def status_lines(st):
    if not st:
        return ['Posting status: not in the posting queue yet (never scheduled or posted).']
    lines = ['Posting status (from the posting queue):']
    for plat in sorted(st):
        s, url, when = st[plat]
        lines.append(f'  - {plat}: {s}' + (f' {url}' if url else '') + (f' (slot {when})' if when and s != 'posted' else ''))
    return lines


def pick(d, names):
    for n in names:
        f = os.path.join(d, n)
        if os.path.exists(f):
            return f
    return None


def package_job(d, q):
    jid = os.path.basename(d)
    seo = load(os.path.join(d, 'seo/seo.json'))
    lesson = load(os.path.join(d, 'lesson.json')) or {}
    title = ''
    if seo:
        title = (seo.get('youtube') or {}).get('title') or seo.get('topic') or ''
    title = TITLES.get(jid) or title or lesson.get('title') or ''
    if not title and os.path.exists(os.path.join(d, 'STATUS.md')):
        title = open(os.path.join(d, 'STATUS.md')).readline().strip('# \n')
    if not title and os.path.exists(os.path.join(d, 'transcript.txt')):
        title = ' '.join(open(os.path.join(d, 'transcript.txt')).read().split()[:9])
    files = {
        'video - with music (LinkedIn, X, or as is).mp4': pick(d, ['final.mp4']),
        'video - NO music (add a trending sound in Instagram, Facebook, YouTube, TikTok).mp4':
            pick(d, ['final_nomusic.mp4', 'final_ig_nomusic.mp4', 'final_upload_nomusic.mp4', 'final_social_nomusic.mp4']),
        'video - X version.mp4': pick(d, ['final_x.mp4']),
        'video - LinkedIn version.mp4': pick(d, ['final_linkedin.mp4']),
        'cover 1080x1920 (Reels, TikTok, Shorts).jpg': pick(d, ['cover_1080x1920.jpg', 'cover_1080x1920.png']),
        'thumbnail 1280x720 (YouTube).jpg': pick(d, ['cover_1280x720.jpg']),
        'cover 1080x1350 (LinkedIn, Facebook feed).jpg': pick(d, ['cover_1080x1350.jpg', 'poster_1080x1350.png']),
        'cover 1080x1080 (square).jpg': pick(d, ['cover_1080x1080.jpg']),
    }
    extra = [os.path.join(d, 'copy.md')] if not seo and os.path.exists(os.path.join(d, 'copy.md')) else []
    return {'kind': 'Reel', 'id': jid, 'title': title, 'seo': seo, 'files': files, 'extra': extra, 'when': born(files['video - with music (LinkedIn, X, or as is).mp4']),
            'duration': dur(files['video - with music (LinkedIn, X, or as is).mp4']), 'status': q.get(jid), 'seo_md': pick(d, ['seo/seo.md'])}


def package_output(name, video, kind, title=None):
    d = os.path.join(OUT, name)
    seo = None
    for p in glob.glob(os.path.join(d, '**/seo.json'), recursive=True):
        seo = load(p)
        break
    if not title:
        title = ((seo or {}).get('youtube') or {}).get('title') or (seo or {}).get('topic') or name.replace('-', ' ').title()
    files = {'video.mp4': video}
    for pattern, label in (('cover*1080x1920*', 'cover 1080x1920.jpg'), ('cover*1280x720*', 'thumbnail 1280x720 (YouTube).jpg'),
                           ('thumbnail*', 'thumbnail.jpg'), ('cover.png', 'cover.png'), ('cover.jpg', 'cover.jpg')):
        hits = sorted(glob.glob(os.path.join(os.path.dirname(video), pattern)) + glob.glob(os.path.join(d, pattern)))
        if hits:
            files[label] = hits[0]
    extra, published = [], []
    for fn in EXTRA_COPY.get(name, []):
        f = os.path.join(d, fn)
        if not os.path.exists(f):
            continue
        j = load(f) if fn.endswith('.json') else None
        if not seo and isinstance(j, dict) and (j.get('title') or j.get('description')):
            seo = {'youtube': {k: j[k] for k in ('title', 'description', 'tags') if k in j}}
        else:
            extra.append(f)
    for f in glob.glob(os.path.join(d, '*.json')):
        published += re.findall(r'https://(?:www\.)?(?:youtube\.com/(?:watch\?v=|shorts/)|youtu\.be/)[\w-]{11}', open(f, errors='ignore').read())
    status = {'youtube': ('posted', sorted(set(published))[0], '')} if published else None
    return {'kind': kind, 'id': name, 'title': title, 'seo': seo, 'files': files, 'extra': extra, 'when': born(video), 'duration': dur(video),
            'status': status, 'seo_md': None}


def main():
    q = queue_status()
    items = []
    for d in sorted(glob.glob(os.path.join(JOBS, '*/'))):
        d = d.rstrip('/')
        if os.path.basename(d) in PRIVATE or not os.path.exists(os.path.join(d, 'final.mp4')):
            continue
        items.append(package_job(d, q))
    extra = [('ai-returns-review', 'final.mp4', 'Reel'), ('whatsapp-voice-agent-reel', 'final.mp4', 'Reel'),
             ('claude-video-editing-tutorial', 'full-tutorial-corrected.mp4', 'YouTube long video'),
             ('freelance-engineering-tutorial', 'full-video.mp4', 'YouTube long video'),
             ('interactive-ai-tutorial', 'full-tutorial.mp4', 'YouTube long video'),
             ('linkedin-batch-20261027b', '01-inference-visual-preview.mp4', 'LinkedIn video'),
             ('linkedin-batch-20261027b', '06-model-hype.mp4', 'LinkedIn video')]
    for name, video, kind in extra:
        if name in OUT_DUPES:
            continue
        f = os.path.join(OUT, name, video)
        if os.path.exists(f):
            t = None if kind != 'LinkedIn video' else 'LinkedIn ' + video.split('-', 1)[1].replace('-preview', '').replace('.mp4', '').replace('-', ' ')
            items.append(package_output(name, f, kind, t))
    for f in sorted(glob.glob(os.path.join(OUT, 'guides/*/short.mp4'))):
        g = os.path.basename(os.path.dirname(f))
        pub = load(os.path.join(os.path.dirname(f), 'publish_youtube_guide.json')) or {}
        t = pub.get('title') or ('Guide short: ' + g.replace('-', ' ').title())
        it = package_output('guides/' + g, f, 'Guide short', t)
        if pub:
            it['seo'] = {'youtube': {k: v for k, v in pub.items() if k in ('title', 'description', 'tags')}}
        items.append(it)

    items.sort(key=lambda x: x['when'])
    os.makedirs(DEST, exist_ok=True)
    rows = []
    for i, it in enumerate(items, 1):
        folder = os.path.join(DEST, f'{i:03d} - {clean_name(it["title"])}')
        os.makedirs(folder, exist_ok=True)
        copied = []
        for label, src in it['files'].items():
            if src and os.path.exists(src):
                clone(src, os.path.join(folder, label))
                copied.append(label)
        st_lines = status_lines(it['status'])
        if it['seo']:
            with open(os.path.join(folder, 'SEO - copy and paste.txt'), 'w') as fh:
                fh.write(seo_text(it['seo'], it['title'], st_lines))
        elif not it.get('extra'):
            with open(os.path.join(folder, 'SEO - not written yet.txt'), 'w') as fh:
                fh.write(f'{it["title"]}\n\nNo SEO was written for this video yet. Ask Claude to run the SEO step for job {it["id"]}.\n\n'
                         + '\n'.join(st_lines) + '\n')
        if it['seo_md']:
            clone(it['seo_md'], os.path.join(folder, 'SEO - research notes.md'))
        for f in it.get('extra', []):
            clone(f, os.path.join(folder, 'SEO - ' + os.path.basename(f)))
        st = it['status'] or {}
        posted = sorted(p for p, v in st.items() if v[0] == 'posted')
        sched = sorted(p for p, v in st.items() if v[0] == 'scheduled')
        kw = ''
        if it['seo']:
            kw = it['seo'].get('comment_keyword') or it['seo'].get('manychat_keyword') or ''
        rows.append({'#': f'{i:03d}', 'title': it['title'], 'type': it['kind'], 'job': it['id'],
                     'made': datetime.fromtimestamp(it['when']).strftime('%Y-%m-%d'), 'length_s': round(it['duration']),
                     'keyword': kw, 'seo': 'yes' if it['seo'] else ('copy only' if it.get('extra') else 'no'),
                     'cover': 'yes' if any(l.startswith(('cover', 'thumbnail')) for l in copied) else 'no',
                     'no_music_version': 'yes' if any('NO music' in l for l in copied) else 'no',
                     'posted_on': ', '.join(posted), 'scheduled_on': ', '.join(sched), 'folder': os.path.basename(folder)})

    with open(os.path.join(DEST, 'INDEX.csv'), 'w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    total = len(rows)
    n_seo = sum(r['seo'] == 'yes' for r in rows)
    n_cover = sum(r['cover'] == 'yes' for r in rows)
    n_never = sum(not r['posted_on'] and not r['scheduled_on'] for r in rows)
    md = [f'# All videos, {datetime.now():%d %b %Y}', '',
          f'{total} videos. {n_seo} with full SEO, {n_cover} with a cover or thumbnail. {n_never} never posted or scheduled.', '',
          'Each folder: the video(s), cover/thumbnail, and "SEO - copy and paste.txt" with the title, caption, hashtags and tags for every platform.',
          'Upload by hand, then send Claude the post links: the comment-keyword automation is set up for each link.', '',
          'Trending sound rule: on Instagram, Facebook, YouTube and TikTok upload the "NO music" video and add a trending sound in the app.',
          'Where a reel has no "NO music" file, upload the "with music" video (or ask Claude to make the no-music cut first).', '',
          '| # | Title | Type | Length | Keyword | SEO | Cover | Posted on | Scheduled on |', '|---|---|---|---|---|---|---|---|---|']
    for r in rows:
        md.append(f'| {r["#"]} | {r["title"][:70]} | {r["type"]} | {r["length_s"]} s | {r["keyword"]} | {r["seo"]} | {r["cover"]} | '
                  f'{r["posted_on"] or "-"} | {r["scheduled_on"] or "-"} |')
    with open(os.path.join(DEST, 'INDEX.md'), 'w') as fh:
        fh.write('\n'.join(md) + '\n')
    print(json.dumps({'total': total, 'with_seo': n_seo, 'with_cover': n_cover, 'never_posted_or_scheduled': n_never,
                      'by_type': {k: sum(r['type'] == k for r in rows) for k in sorted({r['type'] for r in rows})}, 'dest': DEST}))


if __name__ == '__main__':
    main()
