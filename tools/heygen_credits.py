#!/usr/bin/env python3
"""HeyGen credit guard for docs/HEYGEN_CREDIT_POLICY.md (Avatar 6 Turbo, 1080p, 20 credits/min).

  python3 tools/heygen_credits.py estimate <seconds>                -> exit 2 if > 40 credits or > 60 s
  python3 tools/heygen_credits.py log <filename> <seconds> [credits] -> append to the log, print the month total
  python3 tools/heygen_credits.py total                              -> print this month's total
  python3 tools/heygen_credits.py reel <clip1_s> [clip2_s]          -> per-reel avatar check: max 2 clips of 5-8 s,
                                                                       total under 15 s, target under 5 credits (exit 2 on fail)
"""
import datetime as dt
import sys
from pathlib import Path

RATE = 20            # credits per minute, Avatar 6 Turbo 1080p
ASK_ABOVE = 40       # credits per render that need the owner's OK
MAX_SECONDS = 60
MONTHLY = 2000
WARN_AT = 1800
MODEL, RES = 'Avatar 6 Turbo', '1080p'
LOG = Path(__file__).resolve().parents[1] / 'studio' / '.local' / 'heygen_credits.log'


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


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1] not in ('estimate', 'log', 'total', 'reel'):
        print(__doc__.strip())
        return 1
    cmd = argv[1]
    if cmd == 'reel':
        clips = [float(x) for x in argv[2:]]
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
        for p in problems:
            print('STOP:', p)
        return 2 if problems else 0
    if cmd == 'estimate':
        sec = float(argv[2])
        c = credits(sec)
        print(f'HeyGen estimate: {sec:g}s, {MODEL} {RES}, ~{c:g} credits')
        print(f'Month so far: {month_total():g} / {MONTHLY} credits')
        if sec > MAX_SECONDS:
            print(f'STOP: {sec:g}s is over the {MAX_SECONDS}s limit. Shorten the script before rendering.')
            return 2
        if c > ASK_ABOVE:
            print(f'STOP: over {ASK_ABOVE} credits. Ask the owner to confirm before rendering.')
            return 2
        return 0
    if cmd == 'log':
        name, sec = argv[2], float(argv[3])
        c = float(argv[4]) if len(argv) > 4 else credits(sec)
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open('a') as f:
            f.write('\t'.join([dt.datetime.now().strftime('%Y-%m-%d %H:%M'), name, f'{sec:g}', MODEL, RES, f'{c:g}']) + '\n')
    total = month_total()
    print(f'HeyGen credits this month: {total:g} / {MONTHLY}')
    if total > WARN_AT:
        print(f'WARNING: over {WARN_AT} credits this month. Warn the owner before the next render.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
