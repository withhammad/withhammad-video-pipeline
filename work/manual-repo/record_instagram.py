"""Record the owner's verified manual post; never create or upload media."""
import json
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path('/Users/hammad/withhammad-video-pipeline')
JOB = ROOT / 'studio/.local/jobs/dfa218634321'
upload = json.loads((ROOT / 'work/manual-repo/instagram-upload.json').read_text())
media, = upload['matching_reel']
assert media['username'] == 'withhammad.ai'
assert media['id'] == '17919246270264710'
assert 'DfjJM3yIDQI' in media['permalink'] and 'REPO' in media['caption']
published = datetime.fromisoformat(media['timestamp']).astimezone(timezone.utc)
now = datetime.now(timezone.utc).isoformat()
receipt = {
    'status': 'published', 'source': 'owner_manual_upload',
    'media_id': media['id'], 'permalink': media['permalink'],
    'username': media['username'], 'published_at': published.isoformat(),
    'verified_at': now, 'verified_by': 'Instagram Graph API media lookup',
    'native_sound': 'Phone upload; sound identity not exposed by this API check',
}
(JOB / 'publish_instagram_withhammad_ai.json').write_text(json.dumps(receipt, indent=2) + '\n')
manual = json.loads((JOB / 'manual-release.json').read_text())
manual['posted_urls']['instagram'] = media['permalink']
manual['instagram_receipt'] = receipt
(JOB / 'manual-release.json').write_text(json.dumps(manual, indent=2) + '\n')

queue_path = ROOT / 'outputs/video-pipeline/repost-queue.json'
before = queue_path.read_text()
queue = json.loads(before)
rows = [e for e in queue['entries'] if e.get('job') == 'dfa218634321' and e.get('platform') == 'instagram']
assert len(rows) <= 1
entry = rows[0] if rows else {}
entry.update({
    'id': 'in-dfa218634321', 'job': 'dfa218634321', 'platform': 'instagram',
    'slot_utc': published.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'local': published.astimezone(ZoneInfo('Asia/Dubai')).strftime('%Y-%m-%d %H:%M GST'),
    'keyword': 'REPO', 'title': '5 Open Source AI Tools That Could Replace Paid Apps',
    'caption': media['caption'], 'primary_keyword': 'open source AI tools',
    'resource_url': 'https://withhammad.com/resources/five-open-source-ai-repos',
    'host_slug': 'repost-dfa218634321', 'collaborators': None,
    'status': 'posted', 'url': media['permalink'], 'media_id': media['id'],
    'posted_at': published.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'publication_method': 'owner_manual_upload', 'verified_at': now,
    'native_sound_verified': False,
})
if not rows:
    queue['entries'].append(entry)
assert queue_path.read_text() == before, 'Queue changed concurrently; reload before recording'
queue_path.write_text(json.dumps(queue, indent=2, ensure_ascii=False) + '\n')

inbox_path = ROOT / 'outputs/video-pipeline/reference-inbox.json'
inbox = json.loads(inbox_path.read_text())
for row in inbox['links']:
    if row.get('job') == 'dfa218634321':
        row['published_urls'] = {**row.get('published_urls', {}), 'instagram': media['permalink']}
        row['release_hold'] = 'Instagram manually published by owner; PR #20 merged under owner instruction to handle bot setup. Verify production, then actual REPO comment/follow/DM. Other platforms remain manual with native sound.'
inbox_path.write_text(json.dumps(inbox, indent=2, ensure_ascii=False) + '\n')
(ROOT / 'outputs/video-pipeline/reviews/2026-11-10-repo-instagram-posted.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
