"""Headless keyword replier for LinkedIn and X (runs on the VPS, never opens a window on the Mac).

Replaces the Mac Chrome routines `linkedin-keyword-replies` and `x-keyword-replies`. Every cycle it
opens the owner's recent posts in a headless Chromium signed in with saved sessions, reads the
comments, and answers a comment that contains a keyword with the resource link.

    python replier.py once [--platform linkedin|x] [--live]   # one pass (dry run unless --live or LIVE=1)
    python replier.py loop                                    # every INTERVAL seconds, 07:00-23:59 Dubai

Data dir (DATA, default /data):
    sessions/linkedin.json, sessions/x.json   Playwright storage state (made by login.py on the Mac)
    state/<platform>-keyword-state.json       {"replied": {key: record}}  (same format as studio/.local)
    dm-rules.json                             fallback rules (the site's src/content/dm-rules.json)
    automations-token                         withhammad.cloud key (rules + activity log), optional
    logs/replier.log, shots/                  run log and a screenshot when a page looks wrong
"""
import argparse, json, os, re, sys, time, traceback, urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

DATA = Path(os.environ.get('DATA', '/data'))
LIVE = os.environ.get('LIVE') == '1'
INTERVAL = int(os.environ.get('INTERVAL', '1800'))
HOURS = (7, 23)  # Dubai local hours, inclusive
DUBAI = timezone(timedelta(hours=4))
WHC = os.environ.get('WHC_API', 'https://api.withhammad.cloud').rstrip('/')
LI_PROFILE = 'https://www.linkedin.com/in/withhammad/recent-activity/all/'
LI_NAME = 'HAMMAD YOUSUF'
X_HANDLE = 'HammadYousufAI'
LI_POSTS, X_POSTS = 12, 10
REPLY = {
    'linkedin': '{author}, sent it: {link}\nFollow for the next one 🙌',
    'x': '{author} here it is 👇 {link}\nFollow for the next one 🙌',
}
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
      'Chrome/142.0.0.0 Safari/537.36')


def log(*parts):
    line = f"{datetime.now(DUBAI):%Y-%m-%d %H:%M:%S} " + ' '.join(str(p) for p in parts)
    print(line, flush=True)
    (DATA / 'logs').mkdir(parents=True, exist_ok=True)
    with open(DATA / 'logs' / 'replier.log', 'a') as f:
        f.write(line + '\n')


# ---------- rules, state, activity log ----------
def _token():
    try:
        t = (DATA / 'automations-token').read_text().strip()
        return t if t.startswith('whc_') else None
    except OSError:
        return None


def _whc(method, path, body=None):
    token = _token()
    if not token:
        return 0, None
    req = urllib.request.Request(WHC + path, method=method, data=None if body is None else json.dumps(body).encode(),
                                 headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read().decode()
            return r.status, json.loads(raw) if raw.strip() else None
    except Exception:
        return 0, None


def rules_for(platform):
    if platform == 'linkedin':
        status, data = _whc('GET', '/automations/rules?platform=linkedin')
        if status == 200 and isinstance(data, dict) and isinstance(data.get('rules'), list):
            out = [{'keyword': k, 'link': r['link'], 'automation_id': r.get('id')}
                   for r in data['rules'] if r.get('link') for k in r.get('keywords') or []]
            if out:
                return out
    return json.loads((DATA / 'dm-rules.json').read_text())['rules']


def match(text, rules):
    for rule in rules:
        if re.search(r'(?<![A-Za-z0-9])' + re.escape(rule['keyword']) + r'(?![A-Za-z0-9])', text or '', re.I):
            return rule
    return None


def reply_text(platform, rule, author):
    first = (author or '').strip().split(' ')[0] or 'Hey'
    return REPLY[platform].format(author=first, link=rule['link'])


def state_path(platform):
    return DATA / 'state' / f'{platform}-keyword-state.json'


def load_state(platform):
    try:
        return json.loads(state_path(platform).read_text())
    except FileNotFoundError:
        return {'replied': {}}


def save_state(platform, state):
    p = state_path(platform)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix('.tmp')
    tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False) + '\n')
    tmp.replace(p)


def record(platform, key, post, author, text, rule, message, via):
    state = load_state(platform)
    state['replied'][key] = {'post': post, 'keyword': rule['keyword'], 'author': author,
                             'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'via': via}
    save_state(platform, state)
    if platform == 'linkedin':
        _whc('POST', '/automations/events', [{
            'platform': platform, 'commentId': key[:300], 'action': 'public_reply', 'status': 'sent',
            'postId': post[:300], 'userHandle': author[:200], 'text': text[:2000], 'keyword': rule['keyword'],
            'automationId': rule.get('automation_id'), 'detail': {'via': 'vps-headless', 'message': message},
            'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}])


def shot(page, name):
    try:
        (DATA / 'shots').mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(DATA / 'shots' / f'{name}-{int(time.time())}.png'))
    except Exception:
        pass


class SignedOut(Exception):
    pass


def type_slow(page, text):
    # Quill (LinkedIn) and Draft.js (X) drop characters on one long insert; type in chunks.
    for line_no, line in enumerate(text.split('\n')):
        if line_no:
            page.keyboard.press('Shift+Enter')
        for i in range(0, len(line), 12):
            page.keyboard.type(line[i:i + 12], delay=25)
            page.wait_for_timeout(120)


# ---------- LinkedIn ----------
LI_POST_URNS_JS = r'''() => {
  const urns = [];
  for (const a of document.querySelectorAll('a[href*="urn:li:activity:"], a[href*="urn:li:ugcPost:"], a[href*="urn:li:share:"]')) {
    const m = a.href.match(/urn:li:(activity|ugcPost|share):\d+/); if (m && !urns.includes(m[0])) urns.push(m[0]);
  }
  for (const el of document.querySelectorAll('[data-urn^="urn:li:activity"]')) {
    const u = el.getAttribute('data-urn'); if (!urns.includes(u)) urns.push(u);
  }
  return urns;
}'''

LI_COMMENTS_JS = r'''(me) => [...document.querySelectorAll('article[data-id^="urn:li:comment"]')].map(a => {
  const name = (a.querySelector('.comments-comment-meta__description-title, .comments-post-meta__name-text')?.innerText || '').trim();
  const body = (a.querySelector('.comments-comment-item__main-content, .update-components-text')?.innerText || '').trim();
  const nested = a.parentElement?.closest('article[data-id^="urn:li:comment"]');
  const replies = [...a.querySelectorAll('article[data-id^="urn:li:comment"]')]
     .map(r => (r.querySelector('.comments-comment-meta__description-title, .comments-post-meta__name-text')?.innerText || '').trim().toUpperCase());
  return {id: a.getAttribute('data-id'), name, body, nested: !!nested, answered: replies.includes(me)};
})'''


def li_expand(page):
    for _ in range(10):
        btn = page.locator('button:has-text("Load more comments"), button[aria-label^="Load previous replies"]').first
        if not btn.count():
            break
        try:
            btn.click(timeout=3000); page.wait_for_timeout(1500)
        except Exception:
            break
    try:  # "Most relevant" can hide comments; switch to Most recent when the control exists
        sort = page.locator('button[aria-label*="sort order"], button:has-text("Most relevant")').first
        if sort.count():
            sort.click(timeout=3000); page.wait_for_timeout(800)
            page.get_by_text('Most recent', exact=True).first.click(timeout=3000); page.wait_for_timeout(2000)
    except Exception:
        pass


def li_reply(page, comment_id, message):
    art = page.locator(f'article[data-id="{comment_id}"]').first
    art.locator('button:has-text("Reply")').first.click(timeout=5000)
    page.wait_for_timeout(1200)
    editor = art.locator('.ql-editor[contenteditable="true"]').last
    if not editor.count():
        editor = page.locator('.ql-editor[contenteditable="true"]').last
    editor.click(timeout=5000)
    type_slow(page, message)
    page.wait_for_timeout(600)
    submit = art.locator('button.comments-comment-box__submit-button--cr, button.comments-comment-box__submit-button, '
                         'form button[type="submit"]').last
    submit.click(timeout=5000)
    page.wait_for_timeout(3500)
    link = re.search(r'https?://\S+', message).group(0).replace('https://', '')
    if link.split('/')[0] not in (art.inner_text(timeout=5000) or ''):
        raise RuntimeError('reply not visible after submit')


def run_linkedin(page, live):
    rules = rules_for('linkedin')
    page.goto(LI_PROFILE, wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(5000)
    if '/login' in page.url or '/authwall' in page.url or '/checkpoint' in page.url:
        shot(page, 'linkedin-signedout'); raise SignedOut(page.url)
    for _ in range(6):
        page.evaluate('() => { const m = document.querySelector("main"); if (m) m.scrollTop = m.scrollHeight; window.scrollTo(0, document.body.scrollHeight); }')
        page.wait_for_timeout(1500)
    urns = page.evaluate(LI_POST_URNS_JS)[:LI_POSTS]
    state = load_state('linkedin')
    stats = {'posts': len(urns), 'comments': 0, 'replied': 0, 'would_reply': 0}
    if not urns:
        shot(page, 'linkedin-noposts')
    for urn in urns:
        page.goto(f'https://www.linkedin.com/feed/update/{urn}/', wait_until='domcontentloaded', timeout=60000)
        page.wait_for_timeout(4000)
        li_expand(page)
        for c in page.evaluate(LI_COMMENTS_JS, LI_NAME):
            if not c['id'] or c['nested'] or c['name'].upper() == LI_NAME:
                continue
            stats['comments'] += 1
            key = c['id']
            if key in state['replied']:
                continue
            rule = match(c['body'], rules)
            if not rule:
                continue
            message = reply_text('linkedin', rule, c['name'])
            if c['answered']:
                record('linkedin', key, urn, c['name'], c['body'], rule, message, 'already-in-thread'); continue
            if not live:
                stats['would_reply'] += 1; log('linkedin DRY would reply', c['name'], rule['keyword'], urn); continue
            try:
                li_reply(page, key, message)
                record('linkedin', key, urn, c['name'], c['body'], rule, message, 'vps-headless')
                stats['replied'] += 1; log('linkedin replied', c['name'], rule['keyword'], urn)
            except Exception as e:
                shot(page, 'linkedin-replyfail'); log('linkedin reply FAILED', c['name'], rule['keyword'], repr(e)[:200])
    return stats


# ---------- X ----------
X_ARTICLES_JS = r'''() => [...document.querySelectorAll('article[data-testid="tweet"]')].map(a => {
  const link = [...a.querySelectorAll('a[href*="/status/"]')].find(l => l.querySelector('time'));
  const user = a.querySelector('[data-testid="User-Name"]');
  const handle = [...(user?.querySelectorAll('a[href^="/"]') || [])].map(l => l.getAttribute('href').slice(1)).find(h => h && !h.includes('/')) || '';
  return {url: link ? link.href : '', handle, name: (user?.querySelector('span')?.innerText || '').trim(),
          text: (a.querySelector('[data-testid="tweetText"]')?.innerText || '').trim(),
          replies: (a.querySelector('[data-testid="reply"]')?.innerText || '').trim()};
})'''


def x_signed_out(page):
    return '/login' in page.url or '/i/flow' in page.url or page.locator('a[href="/login"]').count() > 0


def x_reply(page, url, message):
    page.goto(url, wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(4000)
    page.locator('article[data-testid="tweet"]').first.locator('[data-testid="reply"]').click(timeout=8000)
    box = page.locator('[role="dialog"] [data-testid="tweetTextarea_0"]').first
    box.click(timeout=8000)
    type_slow(page, message)
    page.wait_for_timeout(800)
    page.locator('[role="dialog"] [data-testid="tweetButton"]').click(timeout=8000)
    page.wait_for_timeout(3000)
    if page.locator('[role="dialog"] [data-testid="tweetTextarea_0"]').count():
        raise RuntimeError('reply dialog still open')


def run_x(page, live):
    rules = rules_for('x')
    page.goto(f'https://x.com/{X_HANDLE}', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(6000)
    if x_signed_out(page):
        shot(page, 'x-signedout'); raise SignedOut(page.url)
    posts = []
    for _ in range(5):
        for a in page.evaluate(X_ARTICLES_JS):
            if a['handle'].lower() == X_HANDLE.lower() and a['url'] and a['url'] not in [p['url'] for p in posts]:
                posts.append(a)
        if len(posts) >= X_POSTS:
            break
        page.mouse.wheel(0, 2500); page.wait_for_timeout(1500)
    posts = [p for p in posts[:X_POSTS] if p['replies'] not in ('', '0')]
    state = load_state('x')
    stats = {'posts': len(posts), 'comments': 0, 'replied': 0, 'would_reply': 0}
    for post in posts:
        page.goto(post['url'], wait_until='domcontentloaded', timeout=60000)
        page.wait_for_timeout(5000)
        for _ in range(4):
            page.mouse.wheel(0, 3000); page.wait_for_timeout(1200)
        arts = page.evaluate(X_ARTICLES_JS)[1:]
        ours = ' '.join(a['text'] for a in arts if a['handle'].lower() == X_HANDLE.lower())
        for a in arts:
            if not a['url'] or a['handle'].lower() == X_HANDLE.lower():
                continue
            stats['comments'] += 1
            key = a['url'].split('?')[0]
            if key in state['replied']:
                continue
            rule = match(a['text'], rules)
            if not rule:
                continue
            message = reply_text('x', rule, a['name'])
            if rule['link'].replace('https://', '') in ours and a['name'].split(' ')[0] in ours:
                record('x', key, post['url'], a['name'], a['text'], rule, message, 'already-in-thread'); continue
            if not live:
                stats['would_reply'] += 1; log('x DRY would reply', a['name'], rule['keyword'], key); continue
            try:
                x_reply(page, key, message)
                record('x', key, post['url'], a['name'], a['text'], rule, message, 'vps-headless')
                stats['replied'] += 1; log('x replied', a['name'], rule['keyword'], key)
            except Exception as e:
                shot(page, 'x-replyfail'); log('x reply FAILED', a['name'], rule['keyword'], repr(e)[:200])
    return stats


RUNNERS = {'linkedin': run_linkedin, 'x': run_x}


def run_once(platforms, live):
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
        try:
            for name in platforms:
                session = DATA / 'sessions' / f'{name}.json'
                if not session.exists():
                    log(name, 'SKIP: no saved session', session); continue
                ctx = browser.new_context(storage_state=str(session), user_agent=UA, viewport={'width': 1366, 'height': 900},
                                          locale='en-US', timezone_id='Asia/Dubai')
                page = ctx.new_page()
                try:
                    stats = RUNNERS[name](page, live)
                    log(name, 'LIVE' if live else 'DRY', json.dumps(stats))
                    ctx.storage_state(path=str(session))  # keep refreshed cookies
                except SignedOut as e:
                    log(name, 'SIGNED OUT, run login.py again:', e)
                except Exception:
                    shot(page, f'{name}-error'); log(name, 'ERROR', traceback.format_exc()[-800:])
                finally:
                    ctx.close()
        finally:
            browser.close()


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['once', 'loop'])
    ap.add_argument('--platform', choices=sorted(RUNNERS), action='append')
    ap.add_argument('--live', action='store_true')
    a = ap.parse_args(argv)
    platforms = a.platform or sorted(RUNNERS)
    live = a.live or LIVE
    if a.cmd == 'once':
        run_once(platforms, live); return
    log('loop start', 'LIVE' if live else 'DRY', platforms, f'every {INTERVAL}s')
    while True:
        hour = datetime.now(DUBAI).hour
        if HOURS[0] <= hour <= HOURS[1]:
            run_once(platforms, live)
        time.sleep(INTERVAL)


if __name__ == '__main__':
    main()
