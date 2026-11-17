#!/usr/bin/env python3
"""HeyGen credit guard for docs/HEYGEN_CREDIT_POLICY.md and docs/HEYGEN_LONGFORM_POLICY.md
(Avatar 6 Turbo, 1080p, 20 credits/min).

  estimate <seconds>                            one clip: exit 2 if > 60 s or > 40 credits
  reel <clip1_s> [clip2_s]                      reel plan: max 2 clips of 5-8 s, total under 15 s / 5 credits
  longform intro=50 cut=18 ... outro=25         long video plan: intro 45-60 s, max 5 cuts of 15-20 s, outro 20-30 s,
                                                total avatar time <= 240 s and <= 80 credits (exit 2 on fail)
  cache <script.txt>                            print the cached clip for this script's hash, if any (exit 3 if none)
  cache <script.txt> <clip.mp4>                 store a rendered clip under the script's hash
  log <name> <seconds> [credits] [--project P]  append to the log, print the month total
  total                                         print this month's total
"""
import datetime as dt
import hashlib
import shutil
import sys
from pathlib import Path

RATE = 20            # credits per minute, Avatar 6 Turbo 1080p
ASK_ABOVE = 40       # credits per clip that need the owner's OK
MAX_SECONDS = 60
MONTHLY = 2000
WARN_AT = 1800
LONG_MAX_S, LONG_MAX_CREDITS, LONG_MAX_CUTS = 240, 80, 5
LONG_RANGES = {'intro': (45, 60), 'cut': (15, 20), 'outro': (20, 30)}
MODEL, RES = 'Avatar 6 Turbo', '1080p'
ROOT = Path(__file__).resolve().parents[1]
LOG = ROOT / 'studio' / '.local' / 'heygen_credits.log'
CACHE = ROOT / 'studio' / '.local' / 'assets' / 'avatar' / 'cache'


def credits(seconds: float) -> float:
    return round(seconds / 60 * RATE, 1)


def month_total(month: str | None = None) -> float:
    month = month or dt.date.today().strftime('%Y-%m')
    if not LOG.exists():
        return 0.0
    total = 0.0
    for line in LOG.read_text().splitlines():
        parts = line.split('\t')
        if len(parts) >= 6 and parts[0].startswith(month):
            total += float(parts[5])
    return round(total, 1)


def script_hash(path: str) -> str:
    text = ' '.join(Path(path).read_text().split())   # same words, any spacing -> same hash
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def print_total() -> None:
    total = month_total()
    print(f'HeyGen credits this month: {total:g} / {MONTHLY}')
    if total > WARN_AT:
        print(f'WARNING: over {WARN_AT} credits this month. Warn the owner before the next render.')


def stop(problems: list[str]) -> int:
    for p in problems:
        print('STOP:', p)
    return 2 if problems else 0


def main(argv: list[str]) -> int:
    cmds = ('estimate', 'reel', 'longform', 'cache', 'log', 'total')
    if len(argv) < 2 or argv[1] not in cmds:
        print(__doc__.strip())
        return 1
    cmd, args = argv[1], argv[2:]

    if cmd == 'estimate':
        sec = float(args[0])
        c = credits(sec)
        print(f'HeyGen estimate: {sec:g}s, {MODEL} {RES}, ~{c:g} credits')
        print(f'Month so far: {month_total():g} / {MONTHLY} credits')
        problems = []
        if sec > MAX_SECONDS:
            problems.append(f'{sec:g}s is over the {MAX_SECONDS}s limit. Shorten the script before rendering.')
        elif c > ASK_ABOVE:
            problems.append(f'over {ASK_ABOVE} credits. Ask the owner to confirm before rendering.')
        return stop(problems)

    if cmd == 'reel':
        clips = [float(x) for x in args]
        total_s = sum(clips)
        c = credits(total_s)
        print(f'Reel avatar plan: {len(clips)} clip(s) {", ".join(f"{x:g}s" for x in clips)} = {total_s:g}s, '
              f'{MODEL} {RES}, ~{c:g} credits')
        problems = []
        if not 1 <= len(clips) <= 2:
            problems.append('use an intro clip and at most one mid-video clip')
        problems += [f'clip {x:g}s is outside 5-8 s' for x in clips if not 5 <= x <= 8]
        if total_s >= 15:
            problems.append(f'total avatar time {total_s:g}s must stay under 15 s')
        if c >= 5:
            problems.append(f'~{c:g} credits is not under the 5-credit target')
        return stop(problems)

    if cmd == 'longform':
        plan, problems = [], []
        for a in args:
            kind, _, sec = a.partition('=')
            if kind not in LONG_RANGES or not sec:
                return stop([f'"{a}" is not intro=<s>, cut=<s> or outro=<s>'])
            plan.append((kind, float(sec)))
        print(f'Long-form avatar plan ({MODEL} {RES}):')
        for kind, sec in plan:
            print(f'  {kind:<6}{sec:>5g}s  ~{credits(sec):g} credits')
        total_s = sum(s for _, s in plan)
        c = credits(total_s)
        print(f'  total {total_s:>5g}s  ~{c:g} credits   (month so far {month_total():g} / {MONTHLY})')
        kinds = [k for k, _ in plan]
        if kinds.count('intro') != 1 or kinds.count('outro') != 1:
            problems.append('the plan needs exactly one intro and one outro')
        if kinds.count('cut') > LONG_MAX_CUTS:
            problems.append(f'{kinds.count("cut")} face cuts, max {LONG_MAX_CUTS}')
        for kind, sec in plan:
            lo, hi = LONG_RANGES[kind]
            if not lo <= sec <= hi:
                problems.append(f'{kind} {sec:g}s is outside {lo}-{hi} s')
        if total_s > LONG_MAX_S:
            problems.append(f'total avatar time {total_s:g}s is over {LONG_MAX_S} s (4 min)')
        if c > LONG_MAX_CREDITS:
            problems.append(f'~{c:g} credits is over {LONG_MAX_CREDITS}. Ask the owner.')
        return stop(problems)

    if cmd == 'cache':
        h = script_hash(args[0])
        hit = next(iter(sorted(CACHE.glob(f'{h}.*'))), None) if CACHE.exists() else None
        if len(args) > 1:
            CACHE.mkdir(parents=True, exist_ok=True)
            src = Path(args[1])
            dst = CACHE / f'{h}{src.suffix}'
            shutil.copy2(src, dst)
            print(f'cached {src.name} as {dst}')
            return 0
        if hit:
            print(f'REUSE: {hit}  (script hash {h}, 0 credits)')
            return 0
        print(f'no cached clip for script hash {h}; render once, then: cache {args[0]} <clip.mp4>')
        return 3

    if cmd == 'log':
        project = ''
        if '--project' in args:
            i = args.index('--project')
            project = args[i + 1]
            args = args[:i] + args[i + 2:]
        name, sec = args[0], float(args[1])
        c = float(args[2]) if len(args) > 2 else credits(sec)
        LOG.parent.mkdir(parents=True, exist_ok=True)
        row = [dt.datetime.now().strftime('%Y-%m-%d %H:%M'), name, f'{sec:g}', MODEL, RES, f'{c:g}', project]
        with LOG.open('a') as f:
            f.write('\t'.join(row) + '\n')

    print_total()
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
