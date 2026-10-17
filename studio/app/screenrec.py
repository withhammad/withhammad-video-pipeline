"""Screen recordings for reels: real browser footage of what the reference creator shows (a repo, docs,
a sheet filling up), recorded from a throwaway headless Chrome by screenrec/record.mjs.

    from app.screenrec import record
    record({'url': 'https://github.com/ScrapeGraphAI/Scrapegraph-ai', 'width': 600, 'height': 750, 'scale': 1.8,
            'actions': [{'move': {'selector': 'text=31.8k stars'}}, {'highlight': {'selector': 'text=31.8k stars'}},
                        {'scroll': {'to': 'article.markdown-body', 'ms': 2200}}]}, 'job/shots/github.mp4')

Reel tip: a narrow viewport (about 600 CSS px) with scale 1.8 gives 1080 px wide footage whose text stays
readable on a phone; a 1080 px desktop viewport makes text too small inside a vertical reel.
Selectors: CSS, or 'text=<visible text>' (smallest visible element containing it), waited for up to
selectorTimeoutMs (default 6 s). 'debug': true also writes <out>.debug.png and prints which selectors match.
CLI:  .venv/bin/python -m app.screenrec plan.json
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

RECORDER = Path(__file__).resolve().parents[1] / 'screenrec' / 'record.mjs'
ACTIONS = {'wait', 'scroll', 'scrollBy', 'move', 'click', 'type', 'highlight', 'remove', 'goto', 'zoom'}


class ScreenRecError(RuntimeError):
    pass


def validate(plan):
    """Fail fast on a plan the recorder would reject halfway through a recording."""
    if not str(plan.get('url', '')).startswith(('https://', 'http://', 'file://')):
        raise ScreenRecError('plan needs an http(s) or file:// url')
    for i, action in enumerate(plan.get('actions', [])):
        if not isinstance(action, dict) or len(action) != 1 or next(iter(action)) not in ACTIONS:
            raise ScreenRecError(f'action {i} must be one of {sorted(ACTIONS)}: {action!r}')
    for key in ('width', 'height', 'fps'):
        if key in plan and not (isinstance(plan[key], int) and plan[key] > 0):
            raise ScreenRecError(f'{key} must be a positive integer')
    return plan


def record(plan, out, timeout_s=240):
    """Record `plan` to `out` (.mp4). Returns the recorder's summary: out, frames, seconds, width, height, fps."""
    plan = validate(dict(plan))
    out = Path(out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    plan['out'] = str(out)
    plan.setdefault('timeoutMs', int(timeout_s * 1000) - 5000)
    with tempfile.TemporaryDirectory() as tmp:
        plan_path = Path(tmp) / 'plan.json'
        plan_path.write_text(json.dumps(plan))
        proc = subprocess.run(['node', str(RECORDER), str(plan_path)], capture_output=True, text=True,
                              timeout=timeout_s)
    if proc.returncode != 0:
        raise ScreenRecError((proc.stderr or proc.stdout).strip()[-800:] or f'recorder exit {proc.returncode}')
    summary = json.loads(proc.stdout.strip().splitlines()[-1])
    if not out.exists() or out.stat().st_size == 0:
        raise ScreenRecError(f'recorder reported success but wrote no file at {out}')
    return summary


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('usage: python -m app.screenrec plan.json')
    plan_file = Path(sys.argv[1])
    data = json.loads(plan_file.read_text())
    print(json.dumps(record(data, plan_file.parent / data.get('out', 'screen.mp4'))))
