"""Run on the Mac once per platform: opens a normal Chromium window, YOU sign in, the session is saved.

    uv run --with playwright==1.55.0 python login.py linkedin x
Then copy sessions/<platform>.json to the VPS (see README). The file is a login cookie: keep it out of git.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URLS = {'linkedin': ('https://www.linkedin.com/login', 'linkedin.com/feed'),
        'x': ('https://x.com/login', 'x.com/home')}
with sync_playwright() as pw:
    b = pw.chromium.launch(headless=False)
    for name in sys.argv[1:]:
        start, done = URLS[name]
        out = Path(__file__).with_name('sessions') / f'{name}.json'
        out.parent.mkdir(exist_ok=True)
        ctx = b.new_context(viewport={'width': 1280, 'height': 860})
        page = ctx.new_page(); page.goto(start)
        print(f'Sign in to {name} in the window. Waiting up to 60 minutes...', flush=True)
        page.wait_for_url(f'**{done}**', timeout=3600000)
        page.wait_for_timeout(4000)
        ctx.storage_state(path=str(out)); out.chmod(0o600)
        print('saved', out, flush=True)
        ctx.close()
    b.close()
