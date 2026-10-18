"""Upload the verified English SRT once, using the owner's authorized channel."""
import json, sys, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
from app import publish_youtube as yt

OUT = Path(__file__).resolve().parent
video_id = json.loads((OUT / 'youtube-published.json').read_text())['video_id']
name = 'English — WithHammad'
with yt._verified_session(yt.EXPECTED_CHANNEL_ID, None, None) as (session, identity):
    listed = session.get('captions.list', yt.API + '/captions', {'part': 'snippet', 'videoId': video_id})
    existing = next((x for x in listed.get('items', []) if x.get('snippet', {}).get('name') == name), None)
    if existing:
        result = existing
    else:
        boundary = 'withhammad_' + uuid.uuid4().hex
        meta = {'snippet': {'videoId': video_id, 'language': 'en', 'name': name, 'isDraft': False}}
        body = (f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'.encode()
                + json.dumps(meta).encode() + f'\r\n--{boundary}\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()
                + (OUT / 'full-tutorial.srt').read_bytes() + f'\r\n--{boundary}--\r\n'.encode())
        response = session.http.request('captions.insert', 'POST',
            'https://www.googleapis.com/upload/youtube/v3/captions',
            params={'uploadType': 'multipart', 'part': 'snippet'},
            headers={'Authorization': 'Bearer ' + session.token,
                     'Content-Type': 'multipart/related; boundary=' + boundary}, content=body,
            body_note='Verified English SRT and caption metadata')
        if response.status_code not in (200, 201):
            raise yt._api_error('captions.insert', response, session.secrets)
        result = response.json()
    safe = {'video_id': video_id, 'caption_id': result['id'], 'snippet': result.get('snippet'),
            'channel_verified': identity['channel_id']}
    (OUT / 'youtube-captions.json').write_text(json.dumps(safe, indent=2) + '\n')
    print(json.dumps(safe))
