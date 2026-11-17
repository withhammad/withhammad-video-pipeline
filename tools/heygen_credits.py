#!/usr/bin/env python3
"""HeyGen credit guard for docs/HEYGEN_CREDIT_POLICY.md (Avatar 6 Turbo, 1080p, 20 credits/min).

  python3 tools/heygen_credits.py estimate <seconds>                -> exit 2 if > 40 credits or > 60 s
  python3 tools/heygen_credits.py log <filename> <seconds> [credits] -> append to the log, print the month total
  python3 tools/heygen_credits.py total                              -> print this month's total
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
    if len(argv) < 2 or argv[1] not in ('estimate', 'log', 'total'):
        print(__doc__.strip())
        return 1
    cmd = argv[1]
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
