"""Competitor watch: read the named competitors' LATEST posts every day, score what is breaking out, pick the
topics that are new to us and hand them to the refill lane. Spec: docs/COMPETITOR_WATCH.md.

    python -m app.competitor_watch accounts                 # the watch list, primary and secondary sources
    python -m app.competitor_watch fetch [--apply]          # API pass (Instagram business_discovery) + the Chrome work list
    python -m app.competitor_watch js linkedin|instagram    # the tested read-only page extractor for the Chrome pass
    python -m app.competitor_watch ingest <capture.json> [--apply]   # store one Chrome capture
    python -m app.competitor_watch score [--date D] [--apply]        # velocity vs the account's median; flags breakouts
    python -m app.competitor_watch pick [--n 3] [--apply]            # top items that are new to us
    python -m app.competitor_watch resolve <id> <permalink> --apply  # LinkedIn: set the copied post link on a pick
    python -m app.competitor_watch inbox [--apply]                   # append the picks to reference-inbox.json
    python -m app.competitor_watch brief <id>                        # builder brief with the originality hard check

Dry-run by default: nothing is written without --apply. State lives in studio/.local/competitor_watch/ (git-ignored;
the repo is public, so no competitor data, captions or reports ever go into git). This module only reads the
competitors' pages. It never posts, follows, likes, comments or DMs.

Scoring: engagement per hour since posting, divided by the median of the same number over that account's own posts
of the last BASELINE_DAYS. 2x or more = "breaking out". Posts younger than MIN_AGE_HOURS are scored but marked
too_early (a 30-minute-old post always looks fast). Only posts up to FRESH_HOURS old can be picked.
Per-hour pace falls as a post ages, so a fresh post beats the median easily; the second number, vs_typical, is the
post's engagement so far divided by the median FINAL engagement of that account's 3-14 day old posts. 1x or more
means it has already beaten a normal finished post while still fresh; those rank first. One pick per account a day.
Engagement: LinkedIn = reactions + comments + reposts; Instagram reel = views (comment counts there are inflated
by comment-keyword CTAs); other Instagram posts = likes + comments.
"""
import argparse
import hashlib
import json
import re
import statistics
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / 'studio' / '.local' / 'competitor_watch'
INBOX = ROOT / 'outputs' / 'video-pipeline' / 'reference-inbox.json'
JOBS = ROOT / 'studio' / '.local' / 'jobs'
PAGE_CREDENTIAL = ROOT / 'work' / '.secrets' / 'facebook-page-oauth.json'
GRAPH = 'https://graph.facebook.com/v21.0'
GST = timezone(timedelta(hours=4))
SOURCE = 'competitor_watch'
FRESH_HOURS = 72
MIN_AGE_HOURS = 6
BASELINE_DAYS = 14
BREAKOUT = 2.0
SIMILAR = 0.5

# Primary = scanned daily. Secondary = recorded for cross-checks; handles marked None are not verified yet
# (docs/COMPETITOR_WATCH.md, "What still needs the owner"). Never guess a handle into this table.
ACCOUNTS = [
    {'key': 'charlie-hills', 'name': 'Charlie Hills', 'platform': 'linkedin',
     'url': 'https://www.linkedin.com/in/charlie-hills/recent-activity/all/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'instagram': None}},
    {'key': 'genai-works', 'name': 'GenAI Works', 'platform': 'linkedin',
     'url': 'https://www.linkedin.com/company/genai-works/posts/?feedView=all',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'instagram': None}},
    {'key': 'matt-pogla', 'name': 'Matt Pogla (Matic Pogladic)', 'platform': 'linkedin',
     'url': 'https://www.linkedin.com/in/matt-pogla/recent-activity/all/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'instagram': None}},
    {'key': 'nateherkelman', 'name': 'Nate Herkelman (Nate Herk)', 'platform': 'linkedin',
     'url': 'https://www.linkedin.com/in/nateherkelman/recent-activity/all/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'instagram': None}},
    {'key': 'vaibhavsisinty', 'name': 'Vaibhav Sisinty', 'platform': 'instagram',
     'url': 'https://www.instagram.com/vaibhavsisinty/reels/', 'stories': 'https://www.instagram.com/stories/vaibhavsisinty/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'linkedin': None}},
    {'key': 'sabrina_ramonov', 'name': 'Sabrina Ramonov', 'platform': 'instagram',
     'url': 'https://www.instagram.com/sabrina_ramonov/reels/', 'stories': 'https://www.instagram.com/stories/sabrina_ramonov/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'linkedin': None}},
    {'key': 'adam.godigital', 'name': 'Adam GoDigital (Gan Yin Choong)', 'platform': 'instagram',
     'url': 'https://www.instagram.com/adam.godigital/reels/', 'stories': 'https://www.instagram.com/stories/adam.godigital/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'linkedin': None}},
    {'key': 'nick_saraev', 'name': 'Nick Saraev', 'platform': 'instagram',
     'url': 'https://www.instagram.com/nick_saraev/reels/',
     'secondary': {'youtube': None, 'tiktok': None, 'x': None, 'linkedin': None}},
]

# Read-only page extractors, tested 2026-11-16 in the owner's logged-in Chrome. The javascript tool returns about
# 1,000 characters per call, so both hand back compact rows and are called in slices.
#   LinkedIn  : __cwRows(n, captionChars, from) -> [[age, type(i/v/d/t), reactions, comments, reposts, caption]]
#               captions only for posts up to 3 days old. Scroll first: main.scrollTop = main.scrollHeight, 2-3 times,
#               2.5-4 s apart. The permalink is not in the DOM: for a PICK only, open the post's "..." menu and click
#               "Copy link to post" (see JS_LINKEDIN_COPYLINK), then `resolve <id> <link>`.
#   Instagram : __igRows() -> [[shortcode, r|p, age_hours, views]] (age comes from the shortcode, no extra request);
#               __igFresh(72, captionChars) -> [[shortcode, likes, comments, caption]] reads each fresh post's own
#               page meta, 1.5-3 s apart.
JS_LINKEDIN = r"""
window.__cwExtract=()=>{const btns=[...document.querySelectorAll('button[aria-label^="Comment"]')];const cards=[];const seen=new Set();
for(const b of btns){let e=b,best=null;while(e&&e!==document.body){const c=((e.innerText||'').match(/Feed post/g)||[]).length;if(c===1)best=e;if(c>1)break;e=e.parentElement;}if(best&&!seen.has(best)){seen.add(best);cards.push(best);}}
const num=s=>{s=(s||'').replace(/,/g,'').trim();const m=s.match(/^([\d.]+)\s*([KkMm]?)$/);if(!m)return null;return Math.round(parseFloat(m[1])*({k:1e3,m:1e6}[m[2].toLowerCase()]||1));};
return cards.map(c=>{const lines=c.innerText.split('\n').map(x=>x.trim()).filter(x=>x&&x!=='​');
const ai=lines.findIndex(l=>/^\d+\s?(m|h|d|w|mo|yr)$/.test(l.replace(/\s*•.*$/,'').replace(/ Edited$/,'')));const age=ai>=0?lines[ai].replace(/\s*•.*$/,''):null;
const repost=/reposted this/i.test(lines.slice(0,4).join(' '));const t=[];for(let i=lines.length-1;i>=0&&t.length<3;i--){const n=num(lines[i]);if(n===null)break;t.unshift(n);}
let body=lines.slice(ai+1);const mi=body.indexOf('… more');body=mi>=0?body.slice(0,mi):body.slice(0,body.length-t.length);
const type=c.querySelector('video')?'video':(/\b\d+\s+pages?\b/i.test(c.innerText)||c.querySelector('iframe'))?'document':c.querySelectorAll('img').length>2?'image':'text';
return {age,repost,type,r:t[0]??null,c:t[1]??null,s:t[2]??null,cap:body.join(' ').replace(/\s+/g,' ')};});};
window.__cwRows=(n,capLen,from)=>JSON.stringify(window.__cwExtract().filter(p=>!p.repost).slice(from||0,(from||0)+n).map(p=>[p.age,p.type[0],p.r,p.c,p.s,/^(\d+(m|h)|[1-3]d)$/.test(p.age||'')?p.cap.slice(0,capLen):'']));
window.__cwRows(12,150)
""".strip()

# After a real click on the post's "..." menu and then on "Copy link to post": the link is in __cw, the owner's
# clipboard is left alone. Run this BEFORE the clicks.
JS_LINKEDIN_COPYLINK = r"""
window.__cw=[];navigator.clipboard.writeText=t=>{window.__cw.push(String(t).replace(/\?.*$/,''));return Promise.resolve();};'armed'
""".strip()

JS_INSTAGRAM = r"""
window.__igRows=()=>{const A='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const ts=sc=>{let n=0n;for(const ch of sc.slice(0,11)){n=n*64n+BigInt(A.indexOf(ch));}return Number((n>>23n)+1314220021721n);};
const now=Date.now();const seen=new Set();
return [...document.querySelectorAll('a[href*="/reel/"],a[href*="/p/"]')].map(a=>{const m=a.getAttribute('href').match(/\/(reel|p)\/([^\/]+)/);if(!m||seen.has(m[2]))return null;seen.add(m[2]);
return [m[2],m[1]==='reel'?'r':'p',Math.round((now-ts(m[2]))/36e5),a.innerText.replace(/\s+/g,' ').trim().slice(0,12)];}).filter(Boolean);};
window.__igPost=async sc=>{const t=await fetch('/p/'+sc+'/',{credentials:'include'}).then(r=>r.text());
const g=n=>{const m=t.match(new RegExp('<meta[^>]+(?:property|name)="'+n+'"[^>]+content="([^"]*)"'))||t.match(new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="'+n+'"'));return m?m[1]:null;};
const d=document.createElement('textarea');d.innerHTML=g('og:description')||g('description')||'';return d.value;};
window.__igFresh=async(maxH,capLen)=>{const out=[];for(const r of window.__igRows().filter(r=>r[2]<=maxH)){const d=await window.__igPost(r[0]);
const m=d.match(/^([\d.,KM]+) likes?, ([\d.,KM]+) comments? - .*?: "?([\s\S]*)$/);out.push([r[0],m?m[1]:null,m?m[2]:null,(m?m[3]:d).replace(/\s+/g,' ').slice(0,capLen)]);
await new Promise(z=>setTimeout(z,1500+Math.random()*1500));}return JSON.stringify(out);};
JSON.stringify(window.__igRows().slice(0,16))
""".strip()

BRIEF = """# Builder brief: competitor-watch pick {id}

Topic signal (what is working right now, not a script to copy):
- Seen on: {platform} / {account}, {age} old, {ratio}x that account's usual pace, {typical}x a typical post of theirs{flag}
- Their post: {permalink}
- Format: {type}
- Gist (our summary of their caption, for orientation only): {caption}

Build OUR OWN version for every platform, through the normal routine (docs/PIPELINE_PROMPT.md and its gates).

## HARD CHECK: originality. The build fails review if any line is false.
- [ ] Topic, hook PATTERN and format only. Not one sentence, headline, list wording or on-screen line of theirs is reused.
- [ ] The design is the WithHammad system (glow-grid cover, our carousel template). Their layout, colours, illustrations,
      screenshots, logo lock-ups, face and brand are not recreated, traced or badge-swapped.
- [ ] No frame, image, audio or music from their post is in our render, cover or carousel. The intake copy in the
      job folder is for analysis only (what the hook does, pacing, format) and stays in studio/.local.
- [ ] Every fact, number and date is verified against a primary source we can link (vendor docs, the release post,
      our own test). Nothing is true "because they said it". Unverifiable claims are dropped.
- [ ] Our take adds something theirs lacks: our own test, a UAE/operator angle, a correction or a deeper how-to.
- [ ] Our own comment keyword, resource page and CTA. Never their keyword, lead magnet or link.
- [ ] Their name and handle appear nowhere in our post, caption or file names.
- [ ] Side-by-side test: put their post next to ours. A stranger must not say "same post, different logo".
      If they would, start again from the topic.

All standing rules still apply: owner approval before anything is queued, automation on every post, trending sound on
the four platforms, SEO per platform, no "AI avatar" text.
"""


class WatchError(RuntimeError):
    pass


def _read(path, default):
    try:
        return json.loads(Path(path).read_text())
    except (FileNotFoundError, ValueError):
        return default


def _write(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    text = data if isinstance(data, str) else json.dumps(data, indent=2, ensure_ascii=False) + '\n'
    path.write_text(text)


def today(now=None):
    return (now or datetime.now(GST)).astimezone(GST).date().isoformat()


def account(key):
    for a in ACCOUNTS:
        if a['key'] == key:
            return a
    raise WatchError(f'unknown account {key!r}; see `accounts`')


def number(value):
    """'1,571' / '74.2K' / '1M' / 99 -> int; None stays None."""
    if value is None or isinstance(value, (int, float)):
        return value
    m = re.match(r'^([\d.]+)\s*([KkMmBb]?)$', str(value).replace(',', '').strip())
    if not m:
        return None
    return round(float(m.group(1)) * {'k': 1e3, 'm': 1e6, 'b': 1e9}.get(m.group(2).lower(), 1))


def age_hours(label):
    """LinkedIn age label ('26m', '3h', '1d', '2w', '1mo', '1yr') -> hours, the midpoint of what the label can mean."""
    m = re.match(r'^(\d+)\s?(mo|yr|m|h|d|w)$', str(label or '').strip())
    if not m:
        return None
    n, unit = int(m.group(1)), m.group(2)
    if unit == 'm':
        return max(n / 60, 0.25)
    if unit == 'h':
        return n + 0.5
    return (n + 0.5) * {'d': 24, 'w': 168, 'mo': 720, 'yr': 8760}[unit]


def post_id(platform, key, handle):
    return hashlib.sha1(f'{platform}|{key}|{handle}'.encode()).hexdigest()[:12]


def normalise(capture):
    """One capture (Chrome rows or API media) -> post records."""
    acc = account(capture['account'])
    captured = datetime.fromisoformat(capture['captured_at'])
    posts = []
    if acc['platform'] == 'linkedin':
        for age, kind, reactions, comments, reposts, caption in capture['rows']:
            hours = age_hours(age)
            if hours is None:
                continue                      # no age label = promoted or pinned card
            handle = (caption or f'{age}|{reactions}|{comments}')[:80]
            posts.append({
                'id': post_id('linkedin', acc['key'], handle), 'platform': 'linkedin', 'account': acc['key'],
                'type': {'i': 'image', 'v': 'video', 'd': 'document', 't': 'text'}.get(kind, kind),
                'age_label': age, 'age_hours': hours, 'posted_at': (captured - timedelta(hours=hours)).isoformat(),
                'time_precision': 'from the age label', 'caption': caption or '', 'permalink': None,
                'feed': acc['url'], 'likes': number(reactions), 'comments': number(comments),
                'reposts': number(reposts), 'views': None,
                'engagement': sum(number(v) or 0 for v in (reactions, comments, reposts)),
            })
    else:
        fresh = {row[0]: row for row in capture.get('fresh', [])}
        for shortcode, kind, hours, views in capture['rows']:
            row = fresh.get(shortcode)
            likes, comments = (number(row[1]), number(row[2])) if row else (None, None)
            views = number(views)
            reel = kind == 'r'
            posts.append({
                'id': post_id('instagram', acc['key'], shortcode), 'platform': 'instagram', 'account': acc['key'],
                'type': 'reel' if reel else 'post', 'age_label': f'{hours}h', 'age_hours': max(float(hours), 0.25),
                'posted_at': (captured - timedelta(hours=float(hours))).isoformat(), 'time_precision': 'from the shortcode',
                'caption': row[3] if row else '', 'feed': acc['url'],
                'permalink': f'https://www.instagram.com/{"reel" if reel else "p"}/{shortcode}/',
                'likes': likes, 'comments': comments, 'reposts': None, 'views': views,
                'engagement': views if reel and views is not None else (likes or 0) + (comments or 0),
            })
    return posts


def posts_path(date):
    return STATE / f'posts-{date}.json'


def cmd_ingest(file, apply, date=None):
    capture = _read(file, None)
    if not capture:
        raise WatchError(f'{file}: not a JSON capture')
    posts = normalise(capture)
    date = date or today(datetime.fromisoformat(capture['captured_at']))
    out = {'account': capture['account'], 'posts': len(posts),
           'fresh': sum(p['age_hours'] <= FRESH_HOURS for p in posts), 'date': date, 'written': False}
    if apply:
        store = _read(posts_path(date), {'date': date, 'posts': {}})
        for p in posts:
            old = store['posts'].get(p['id'], {})
            p['permalink'] = p['permalink'] or old.get('permalink')
            store['posts'][p['id']] = p
        _write(posts_path(date), store)
        _write(STATE / 'raw' / date / f'{capture["account"]}.json', capture)
        out['written'] = True
    return out


def graph_get(path, params, token):
    """GET on graph.facebook.com; the URL (with the token) goes to curl on stdin, never argv, and is never printed."""
    url = f'{GRAPH}/{path}?' + urlencode(dict(params, access_token=token))
    config = f'silent\nshow-error\nproto = "=https"\nmax-time = 30\nurl = "{url}"\n'
    process = subprocess.run(['/usr/bin/curl', '--config', '-'], input=config, text=True, capture_output=True, timeout=40)
    try:
        return json.loads(process.stdout)
    except ValueError:
        return {'error': {'message': f'no JSON from the Graph API (curl exit {process.returncode})'}}


def discover(username, token, ig_user):
    """Instagram Graph API business_discovery. Needs instagram_manage_insights on the Page token; without it Meta
    answers (#10) 'Application does not have permission for this action'."""
    fields = (f'business_discovery.username({username}){{followers_count,media.limit(25){{id,caption,like_count,'
              'comments_count,view_count,media_product_type,permalink,timestamp}}')
    return graph_get(ig_user, {'fields': fields}, token)


def api_capture(acc, data, now):
    rows, fresh = [], []
    for m in data['business_discovery'].get('media', {}).get('data', []):
        match = re.search(r'/(reel|p|tv)/([^/]+)', m.get('permalink', ''))
        if not match:
            continue
        posted = datetime.fromisoformat(m['timestamp'].replace('+0000', '+00:00'))
        hours = round((now - posted).total_seconds() / 3600)
        rows.append([match.group(2), 'r' if m.get('media_product_type') == 'REELS' else 'p', hours, m.get('view_count')])
        fresh.append([match.group(2), m.get('like_count'), m.get('comments_count'), (m.get('caption') or '')[:600]])
    return {'platform': 'instagram', 'account': acc['key'], 'captured_at': now.isoformat(), 'via': 'business_discovery',
            'rows': rows, 'fresh': fresh}


def cmd_fetch(apply, now=None):
    now = now or datetime.now(GST)
    date = today(now)
    have = set(_read(posts_path(date), {'posts': {}}).get('posts') and
               {p['account'] for p in _read(posts_path(date), {'posts': {}})['posts'].values()} or [])
    out = {'date': date, 'api': {}, 'chrome': [], 'already_captured': sorted(have), 'dry_run': not apply}
    credential = _read(PAGE_CREDENTIAL, {})
    token = credential.get('access_token')
    ig_user = None
    if apply and token:
        page = graph_get(credential.get('page_id', 'me'), {'fields': 'instagram_business_account'}, token)
        ig_user = (page.get('instagram_business_account') or {}).get('id')
    for acc in ACCOUNTS:
        if acc['platform'] == 'instagram':
            if not apply:
                out['api'][acc['key']] = 'would call business_discovery'
            elif not ig_user:
                out['api'][acc['key']] = 'no Page token or no linked Instagram account'
            else:
                data = discover(acc['key'], token, ig_user)
                if 'business_discovery' in data:
                    capture = api_capture(acc, data, now)
                    _write(STATE / 'raw' / date / f'{acc["key"]}.api.json', capture)
                    cmd_ingest(STATE / 'raw' / date / f'{acc["key"]}.api.json', True, date)
                    out['api'][acc['key']] = f'{len(capture["rows"])} posts via the API'
                    have.add(acc['key'])
                    continue
                error = data.get('error', {})
                out['api'][acc['key']] = f'API refused: (#{error.get("code")}) {str(error.get("message"))[:90]}'
        if acc['key'] not in have:
            out['chrome'].append({'account': acc['key'], 'platform': acc['platform'], 'open': acc['url'],
                                  'run': f'python -m app.competitor_watch js {acc["platform"]}',
                                  'save_as': str(STATE / 'raw' / date / f'{acc["key"]}.json')})
    out['next'] = ('Read each `chrome` entry in the owner\'s Chrome (read-only, one tab, 5+ s between pages), save the '
                   'rows as a capture file, then `ingest <file> --apply`.') if out['chrome'] else 'all accounts captured'
    return out


def score_posts(posts):
    """Adds velocity (engagement/hour), ratio (velocity / account median velocity) and flags to every post."""
    for p in posts:
        p['velocity'] = round(p['engagement'] / max(p['age_hours'], 0.25), 2)
    by_account, mature = {}, {}
    for p in posts:
        if p['age_hours'] <= BASELINE_DAYS * 24:
            by_account.setdefault(p['account'], []).append(p['velocity'])
            if p['age_hours'] > FRESH_HOURS:
                mature.setdefault(p['account'], []).append(p['engagement'])
    for p in posts:
        base = by_account.get(p['account'], [])
        median = statistics.median(base) if len(base) >= 3 else None
        p['account_median_velocity'] = round(median, 2) if median else None
        p['baseline_posts'] = len(base)
        p['ratio'] = round(p['velocity'] / median, 2) if median else None
        typical = statistics.median(mature[p['account']]) if len(mature.get(p['account'], [])) >= 3 else None
        p['vs_typical'] = round(p['engagement'] / typical, 2) if typical else None
        p['fresh'] = p['age_hours'] <= FRESH_HOURS
        p['too_early'] = p['age_hours'] < MIN_AGE_HOURS
        p['breaking_out'] = bool(p['ratio'] and p['ratio'] >= BREAKOUT and p['fresh'] and not p['too_early'])
    return sorted(posts, key=lambda p: (p['fresh'], not p['too_early'], p['breaking_out'],
                                        (p['vs_typical'] or 0) >= 1, p['ratio'] or 0), reverse=True)


def age_text(hours):
    return f'{round(hours * 60)}m' if hours < 1 else f'{round(hours)}h' if hours < 48 else f'{round(hours / 24)}d'


def report(date, ranked):
    fresh = [p for p in ranked if p['fresh']]
    lines = [f'# Competitor watch {date}', '',
             f'{len(ranked)} posts read, {len(fresh)} up to {FRESH_HOURS} h old, '
             f'{sum(p["breaking_out"] for p in fresh)} breaking out ({BREAKOUT:g}x+ the account\'s median pace).',
             'Local file, never committed. "Why it works" and "our angle" are added by the reviewer below the table.', '',
             '| # | Account | Type | Age | Engagement | Per hour | vs median pace | vs typical post | Flag | Post |',
             '|---|---|---|---|---|---|---|---|---|---|']
    for i, p in enumerate(fresh, 1):
        flag = 'BREAKING OUT' if p['breaking_out'] else 'too early' if p['too_early'] else ''
        link = p['permalink'] or p['feed']
        lines.append(f'| {i} | {p["account"]} | {p["type"]} | {age_text(p["age_hours"])} | {p["engagement"]:,} | '
                     f'{p["velocity"]:,} | {p["ratio"] if p["ratio"] is not None else "n/a"}x | '
                     f'{p["vs_typical"] if p["vs_typical"] is not None else "n/a"}x | {flag} | '
                     f'[{(p["caption"] or p["id"])[:70].replace("|", "/")}]({link}) `{p["id"]}` |')
    return '\n'.join(lines) + '\n'


def cmd_score(date, apply):
    store = _read(posts_path(date), None)
    if not store:
        raise WatchError(f'no posts for {date}: run fetch/ingest first')
    ranked = score_posts(list(store['posts'].values()))
    if apply:
        _write(STATE / f'scored-{date}.json', {'date': date, 'posts': ranked})
        path = STATE / f'{date}.md'
        notes = ''
        if path.exists() and '\n## ' in path.read_text():
            notes = '\n## ' + path.read_text().split('\n## ', 1)[1]      # keep the reviewer's sections
        _write(path, report(date, ranked) + notes)
    return {'date': date, 'posts': len(ranked), 'fresh': sum(p['fresh'] for p in ranked),
            'breaking_out': [f'{p["account"]} {p["ratio"]}x {p["caption"][:60]}' for p in ranked if p['breaking_out']],
            'written': apply}


def tokens(text):
    stop = {'the', 'and', 'for', 'you', 'your', 'this', 'that', 'with', 'now', 'get', 'free', 'comment', 'from', 'its',
            'just', 'are', 'can', 'how', 'use', 'here', 'what', 'has', 'have', 'send', 'link', 'will', 'all', 'ill'}
    return {w for w in re.findall(r'[a-z0-9]{3,}', str(text).lower()) if w not in stop}


def similarity(a, b):
    a, b = tokens(a), tokens(b)
    return len(a & b) / min(len(a), len(b)) if len(a) >= 4 and len(b) >= 4 else 0.0


def known_work(jobs=JOBS, inbox=INBOX):
    """What we already have: every job's source link, id and title/brief text, plus every inbox link."""
    urls, texts = set(), []
    for info in sorted(Path(jobs).glob('*/source.info.json')):
        data = _read(info, {})
        for key in ('webpage_url', 'original_url', 'id'):
            if data.get(key):
                urls.add(str(data[key]))
        texts.append((info.parent.name, ' '.join(str(data.get(k) or '') for k in ('title', 'fulltitle', 'description'))[:600]))
    for brief in sorted(Path(jobs).glob('*/brief.md')):
        texts.append((brief.parent.name, brief.read_text(errors='ignore')[:600]))
    for link in _read(inbox, {'links': []})['links']:
        urls.add(link['url'])
        texts.append((link.get('job') or 'inbox', link.get('note', '')))
    return urls, texts


def seen_before(post, urls, texts, history, date):
    if post['id'] in history and history[post['id']]['date'] != date:      # a same-day rerun gives the same picks
        return f'already picked on {history[post["id"]]["date"]}'
    handle = (post.get('permalink') or '').rstrip('/').rsplit('/', 1)[-1]
    if post.get('permalink') and any(post['permalink'] in u or (handle and handle in u) for u in urls):
        return 'its link is already a job or in the inbox'
    for name, text in texts:
        if similarity(post['caption'], text) >= SIMILAR:
            return f'same topic as {name}'
    return None


def cmd_pick(date, n, apply):
    scored = _read(STATE / f'scored-{date}.json', None)
    if not scored:
        raise WatchError(f'no scores for {date}: run `score --apply` first')
    urls, texts = known_work()
    history = _read(STATE / 'picked.json', {})
    picks, skipped = [], []
    for p in scored['posts']:
        if not p['fresh'] or p['too_early'] or not p['ratio'] or not p['caption']:
            continue
        why = seen_before(p, urls, texts, history, date)
        twin = next((q for q in picks if similarity(p['caption'], q['caption']) >= SIMILAR), None)
        if not why and not twin and any(q['account'] == p['account'] for q in picks):
            why = 'one pick per account a day'
        if why or twin:
            skipped.append({'id': p['id'], 'account': p['account'], 'why': why or f'same topic as pick {twin["id"]}'})
        elif len(picks) < n:
            picks.append(p)
    if apply:
        _write(STATE / f'picks-{date}.json', {'date': date, 'picks': picks, 'skipped': skipped})
        for p in picks:
            history[p['id']] = {'date': date, 'account': p['account'], 'caption': p['caption'][:120]}
        _write(STATE / 'picked.json', history)
    return {'date': date, 'written': apply, 'skipped': skipped,
            'picks': [{k: p[k] for k in ('id', 'platform', 'account', 'type', 'ratio', 'vs_typical', 'breaking_out', 'permalink', 'caption')}
                      for p in picks]}


def cmd_resolve(date, pid, permalink, apply):
    if not re.match(r'^https://(www\.linkedin\.com/|lnkd\.in/)\S+$', permalink):
        raise WatchError('permalink must be a linkedin.com or lnkd.in link')
    changed = []
    if apply:
        for name in (f'posts-{date}.json', f'scored-{date}.json', f'picks-{date}.json'):
            data = _read(STATE / name, None)
            if not data:
                continue
            items = data['posts'].values() if isinstance(data.get('posts'), dict) else data.get('posts') or data.get('picks')
            for p in items:
                if p['id'] == pid:
                    p['permalink'] = permalink
                    changed.append(name)
            _write(STATE / name, data)
    return {'id': pid, 'permalink': permalink, 'updated': changed, 'written': apply}


def cmd_inbox(date, apply, inbox=INBOX):
    picks = _read(STATE / f'picks-{date}.json', None)
    if not picks:
        raise WatchError(f'no picks for {date}: run `pick --apply` first')
    data = _read(inbox, {'links': []})
    have = {l['url'] for l in data['links']}
    added, held = [], []
    for p in picks['picks']:
        if not p.get('permalink'):
            held.append({'id': p['id'], 'why': 'LinkedIn permalink not resolved: copy the post link in Chrome, then `resolve`'})
        elif p['permalink'] in have:
            held.append({'id': p['id'], 'why': 'already in the inbox'})
        else:
            # The inbox is committed to a public repo: the note carries our id only, never their caption or numbers.
            entry = {'url': p['permalink'], 'note': f'competitor watch {date} pick {p["id"]}: own version, see the brief '
                                                    f'(python -m app.competitor_watch brief {p["id"]})',
                     'added': date, 'status': 'pending', 'job': None, 'source': SOURCE}
            data['links'].append(entry)
            added.append(entry)
    if apply and added:
        _write(inbox, data)
    return {'date': date, 'added': added, 'held': held, 'written': bool(apply and added)}


def cmd_brief(date, pid):
    for name in (f'picks-{date}.json', f'scored-{date}.json'):
        data = _read(STATE / name, {})
        for p in data.get('picks') or data.get('posts') or []:
            if p['id'] == pid:
                return BRIEF.format(id=pid, platform=p['platform'], account=p['account'], age=age_text(p['age_hours']),
                                    ratio=p['ratio'], typical=p.get('vs_typical'), flag=' (breaking out)' if p['breaking_out'] else '',
                                    permalink=p['permalink'] or p['feed'], type=p['type'], caption=p['caption'][:300])
    raise WatchError(f'{pid} is not in the {date} picks or scores')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('accounts')
    sub.add_parser('js').add_argument('platform', choices=('linkedin', 'linkedin-copylink', 'instagram'))
    for name in ('fetch', 'ingest', 'score', 'pick', 'resolve', 'inbox', 'brief'):
        p = sub.add_parser(name)
        p.add_argument('--date', default=today())
        if name != 'brief':
            p.add_argument('--apply', action='store_true', help='write; without it this is a dry run')
        if name == 'ingest':
            p.add_argument('file')
        if name == 'pick':
            p.add_argument('--n', type=int, default=3)
        if name in ('resolve', 'brief'):
            p.add_argument('id')
        if name == 'resolve':
            p.add_argument('permalink')
    args = parser.parse_args(argv)
    try:
        if args.cmd == 'js':
            print({'linkedin': JS_LINKEDIN, 'linkedin-copylink': JS_LINKEDIN_COPYLINK, 'instagram': JS_INSTAGRAM}[args.platform])
            return 0
        if args.cmd == 'brief':
            print(cmd_brief(args.date, args.id))
            return 0
        out = (ACCOUNTS if args.cmd == 'accounts' else
               cmd_fetch(args.apply) if args.cmd == 'fetch' else
               cmd_ingest(args.file, args.apply, args.date) if args.cmd == 'ingest' else
               cmd_score(args.date, args.apply) if args.cmd == 'score' else
               cmd_pick(args.date, args.n, args.apply) if args.cmd == 'pick' else
               cmd_resolve(args.date, args.id, args.permalink, args.apply) if args.cmd == 'resolve' else
               cmd_inbox(args.date, args.apply))
    except WatchError as error:
        print(f'competitor_watch: {error}', file=sys.stderr)
        return 1
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False)
    print()
    return 0


if __name__ == '__main__':
    sys.exit(main())
