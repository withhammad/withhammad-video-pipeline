"""Keyword -> DM rules for the Instagram comment webhook on withhammad.com.

The webhook (withhammad-rebuild: src/app/api/instagram/webhook) reads src/content/dm-rules.json at
build time, so a rule goes live with the next site deploy. The resource-page step adds the reel's rule
in the same commit as its resource page, before the reel is posted.

    python -m app.dm_rules add --keyword SCOPE --link https://withhammad.com/resources/x [--media-id ID]
    python -m app.dm_rules list
"""
import argparse
import json
import sys
from pathlib import Path

SITE_CLONE = Path(__file__).resolve().parents[2] / 'work' / 'site' / 'withhammad-rebuild'
RULES_FILE = SITE_CLONE / 'src' / 'content' / 'dm-rules.json'
DEFAULT_DM = 'Here it is 👇\n{link}'
DEFAULT_REPLY = 'Sent you a DM ✅'


def load(path=RULES_FILE):
    return json.loads(Path(path).read_text())


def save(data, path=RULES_FILE):
    Path(path).write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


def add_rule(keyword, link, *, dm=DEFAULT_DM, reply=DEFAULT_REPLY, media_ids=(), path=RULES_FILE):
    """Insert or replace the rule for `keyword` (upper-cased); returns the rule."""
    keyword = keyword.strip().upper()
    if not keyword or not link.startswith('https://'):
        raise ValueError('a keyword and an https link are required')
    data = load(path)
    rule = {'keyword': keyword, 'link': link, 'dm': dm, 'reply': reply, 'media_ids': list(media_ids)}
    rules = [r for r in data['rules'] if r['keyword'] != keyword]
    data['rules'] = rules + [rule]
    save(data, path)
    return rule


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    add = sub.add_parser('add')
    add.add_argument('--keyword', required=True)
    add.add_argument('--link', required=True)
    add.add_argument('--dm', default=DEFAULT_DM)
    add.add_argument('--reply', default=DEFAULT_REPLY)
    add.add_argument('--media-id', action='append', default=[])
    sub.add_parser('list')
    args = parser.parse_args(argv)
    if args.cmd == 'add':
        print(json.dumps(add_rule(args.keyword, args.link, dm=args.dm, reply=args.reply, media_ids=args.media_id),
                         ensure_ascii=False))
    else:
        for r in load()['rules']:
            print(f"{r['keyword']:12} {r['link']}  media={r.get('media_ids') or 'any'}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
