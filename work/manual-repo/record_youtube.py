"""Record the verified owner-uploaded Short without uploading or scheduling a video."""
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from app import publish_youtube as publisher

ROOT = Path(__file__).resolve().parents[2]
JOB = ROOT / 'studio/.local/jobs/dfa218634321'
WORK = ROOT / 'work/manual-repo'
VIDEO_ID = 'J15kXiijiZI'
URL = f'https://www.youtube.com/shorts/{VIDEO_ID}'
GUIDE = 'https://withhammad.com/resources/five-open-source-ai-repos'
video = json.loads((WORK / 'youtube-after-settings.json').read_text())
assert video['id'] == VIDEO_ID
assert video['snippet']['channelId'] == publisher.EXPECTED_CHANNEL_ID
assert video['status']['privacyStatus'] == 'public'
assert video['contentDetails']['hasCustomThumbnail'] is True
published = datetime.fromisoformat(video['snippet']['publishedAt'].replace('Z', '+00:00'))
now = datetime.now(timezone.utc).isoformat()


def update_json(path, update):
    original = path.read_text()
    data = json.loads(original)
    update(data)
    assert path.read_text() == original, f'{path} changed concurrently; reload first'
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')


receipt = {
    'status': 'published', 'source': 'owner_manual_upload',
    'video_id': VIDEO_ID, 'url': URL,
    'watch_url': f'https://www.youtube.com/watch?v={VIDEO_ID}',
    'channel_id': publisher.EXPECTED_CHANNEL_ID,
    'title': video['snippet']['title'], 'privacy_status': 'public',
    'published_at': published.isoformat(), 'verified_at': now,
    'verified_by': 'YouTube Data API owner lookup and downloaded live custom thumbnail',
    'native_sound': 'Owner phone upload; existing audio retained, sound identity not independently verified',
}
state_path = JOB / 'publish_youtube.json'
with publisher._state_lock(state_path):
    state = publisher.load_state(state_path)
    assert state.get('video_id') in (None, VIDEO_ID)
    publisher.save_state(state_path, {**state, **receipt})


def manual_update(data):
    data.setdefault('posted_urls', {})['youtube'] = URL
    data['youtube_receipt'] = receipt
    data['youtube_subscriber_gate'] = 'pending Studio access; Mac locked'


update_json(JOB / 'manual-release.json', manual_update)


def queue_update(data):
    rows = [e for e in data['entries'] if e.get('job') == 'dfa218634321' and e.get('platform') == 'youtube']
    assert len(rows) <= 1
    entry = rows[0] if rows else {}
    assert entry.get('url') in (None, URL)
    entry.update({
        'id': 'yo-dfa218634321', 'job': 'dfa218634321', 'platform': 'youtube',
        'slot_utc': published.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'local': published.astimezone(ZoneInfo('Asia/Dubai')).strftime('%Y-%m-%d %H:%M GST'),
        'keyword': 'REPO', 'title': video['snippet']['title'],
        'caption': video['snippet']['description'], 'primary_keyword': 'open source AI tools',
        'resource_url': GUIDE, 'host_slug': 'repost-dfa218634321', 'collaborators': None,
        'status': 'posted', 'url': URL, 'video_id': VIDEO_ID,
        'posted_at': published.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'publication_method': 'owner_manual_upload', 'verified_at': now,
        'native_sound_verified': False, 'custom_thumbnail_verified': True,
    })
    if not rows:
        data['entries'].append(entry)


update_json(ROOT / 'outputs/video-pipeline/repost-queue.json', queue_update)


def inbox_update(data):
    for row in data['links']:
        if row.get('job') == 'dfa218634321':
            row.setdefault('published_urls', {})['youtube'] = URL
            row['release_hold'] = (
                'Instagram and YouTube manually published by owner; REPO guide/rule deployed. '
                'YouTube approved cover verified live. Subscriber-only comment setting awaits '
                'unlocked Chrome; real REPO keyword delivery awaits a customer comment. '
                'Other destinations remain manual; no automatic fallback.'
            )


update_json(ROOT / 'outputs/video-pipeline/reference-inbox.json', inbox_update)
(ROOT / 'outputs/video-pipeline/reviews/2026-11-10-repo-youtube-posted.json').write_text(
    json.dumps(receipt, indent=2) + '\n'
)
print(json.dumps(receipt, indent=2))
