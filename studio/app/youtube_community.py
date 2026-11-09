"""Read-only watchlist for Community posts, whose comments are outside the video-comment API."""
import json
from datetime import datetime, timezone
from app import dm_rules, linkedin_keyword, repost_queue


def watchlist(now=None, entries=None):
    now = now or datetime.now(timezone.utc)
    entries = repost_queue.load()['entries'] if entries is None else entries
    state = linkedin_keyword.load_state(linkedin_keyword.PLATFORMS['youtube_community']['state'])
    posts = [dict(id=e['id'], url=e['url'], keyword=e['keyword'], slot=e['slot_utc']) for e in entries
             if e['platform'] == 'youtube_image' and e.get('url') and e['status'] in ('scheduled', 'posted')
             and datetime.fromisoformat(e['slot_utc'].replace('Z', '+00:00')) <= now]
    return {'posts':posts, 'rules':dm_rules.load()['rules'], 'replied':sorted(state['replied'])}


if __name__ == '__main__':
    print(json.dumps(watchlist(), indent=2, ensure_ascii=False))
