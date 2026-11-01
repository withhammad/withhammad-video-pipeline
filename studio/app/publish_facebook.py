"""Facebook Page Reels: post a hosted reel on the Page "With Hammad AI" through the Graph API.

Three calls (Reels publishing API): start an upload session on /{page}/video_reels, hand Meta the public
video URL on rupload.facebook.com, then finish with video_state=PUBLISHED and the description. The Page token
in work/.secrets/facebook-page-oauth.json needs pages_manage_posts + publish_video (facebook_oauth.py asks for
them since 2026-11-01). Anything other than dry_run=False is a dry run: one GET to confirm the Page identity,
then the list of requests that would be sent. State is saved after every remote id, so a rerun resumes.

    python -m app.publish_facebook check            # token identity + whether it may publish
"""
import json
import os
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
CREDENTIAL = ROOT / 'work' / '.secrets' / 'facebook-page-oauth.json'
API_VERSION = os.environ.get('STUDIO_FB_API_VERSION', 'v25.0')
GRAPH = 'https://graph.facebook.com'
RUPLOAD = 'https://rupload.facebook.com'
PAGE_ID = '1394106800452348'
PAGE_NAME = 'With Hammad AI'
NEEDED = ('pages_manage_posts',)   # publish_video is not a valid scope under Facebook Login for Business (checked 2026-11-01)
POLL_SECONDS = float(os.environ.get('STUDIO_FB_POLL_SECONDS', '15'))
TIMEOUT = float(os.environ.get('STUDIO_FB_TIMEOUT', '600'))
DESCRIPTION_MAX = 2200


class FacebookPublishError(RuntimeError):
    def __init__(self, message, step=None):
        super().__init__(message)
        self.step = step


def load_credentials(path=CREDENTIAL):
    data = json.loads(Path(path).read_text())
    if not data.get('access_token'):
        raise FacebookPublishError('facebook-page-oauth.json has no access_token', step='credentials')
    return data


def caption_for(lesson):
    text = ((lesson or {}).get('captions') or {}).get('facebook') or ''
    text = text.strip()
    if not text:
        raise FacebookPublishError('lesson.captions.facebook is empty', step='caption')
    if len(text) > DESCRIPTION_MAX:
        raise FacebookPublishError(f'Facebook description is {len(text)} characters (max {DESCRIPTION_MAX})', step='caption')
    return text


def load_state(path):
    try:
        return json.loads(Path(path).read_text())
    except (FileNotFoundError, TypeError):
        return {}


def save_state(path, state):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(state, indent=2) + '\n')


class Client:
    def __init__(self, token, transport=None, version=API_VERSION):
        self.token = token
        self.version = version
        self.http = httpx.Client(transport=transport, timeout=60)

    def graph(self, method, path, **params):
        url = f'{GRAPH}/{self.version}/{path.lstrip("/")}'
        params['access_token'] = self.token
        r = self.http.request(method, url, params=params if method == 'GET' else None,
                              data=None if method == 'GET' else params)
        body = r.json() if r.content else {}
        if r.status_code >= 400 or 'error' in body:
            err = (body.get('error') or {})
            raise FacebookPublishError(f'{method} {path}: HTTP {r.status_code} {err.get("message") or body}'[:300],
                                       step=path)
        return body

    def upload_from_url(self, video_id, video_url):
        r = self.http.post(f'{RUPLOAD}/video-upload/{self.version}/{video_id}',
                           headers={'Authorization': f'OAuth {self.token}', 'file_url': video_url})
        body = r.json() if r.content else {}
        if r.status_code >= 400 or not body.get('success'):
            raise FacebookPublishError(f'rupload failed: HTTP {r.status_code} {str(body)[:200]}', step='upload')
        return body


def check(credential=CREDENTIAL, transport=None):
    creds = load_credentials(credential)
    client = Client(creds['access_token'], transport)
    me = client.graph('GET', 'me', fields='id,name')
    scopes = creds.get('scopes') or []
    missing = [s for s in NEEDED if s not in scopes]
    return {'page_id': me.get('id'), 'page_name': me.get('name'), 'identity_ok': me.get('id') == PAGE_ID,
            'scopes': scopes, 'missing_scopes': missing, 'can_publish': not missing and me.get('id') == PAGE_ID}


def publish(video_url, lesson, *, dry_run=True, state_path=None, credential=CREDENTIAL, transport=None,
            sleep=time.sleep, clock=time.monotonic):
    """Post the reel served at `video_url` (public https, already hosted for Instagram) on the Page."""
    live = dry_run is False
    if live and not state_path:
        raise FacebookPublishError('publishing needs a state_path', step='state')
    description = caption_for(lesson)
    info = check(credential, transport)
    if not info['identity_ok']:
        raise FacebookPublishError(f"token belongs to {info['page_name']!r} ({info['page_id']}), not {PAGE_NAME}", step='identity')
    result = {'platform': 'facebook', 'dry_run': not live, 'page': info['page_name'], 'description_length': len(description),
              'requests': [f'POST /{PAGE_ID}/video_reels upload_phase=start', f'POST rupload file_url={video_url}',
                           f'POST /{PAGE_ID}/video_reels upload_phase=finish video_state=PUBLISHED', 'GET /{video_id}?fields=status'],
              'warnings': []}
    if not live:
        result['status'] = 'planned'
        if info['missing_scopes']:
            result['warnings'].append(f"token lacks {info['missing_scopes']}: a live post will be refused until re-consent")
        return result
    if info['missing_scopes']:
        raise FacebookPublishError(f"Page token lacks {info['missing_scopes']}; run outputs/video-pipeline/facebook_oauth.py", step='scopes')
    state = load_state(state_path)
    if state.get('status') == 'published':
        return {**result, 'status': 'already_published', 'video_id': state['video_id'], 'permalink': state.get('permalink')}
    client = Client(load_credentials(credential)['access_token'], transport)
    if not state.get('video_id'):
        start = client.graph('POST', f'{PAGE_ID}/video_reels', upload_phase='start')
        state.update(video_id=start['video_id'], started_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
        save_state(state_path, state)
    if not state.get('uploaded'):
        client.upload_from_url(state['video_id'], video_url)
        state['uploaded'] = True
        save_state(state_path, state)
    if not state.get('finished'):
        client.graph('POST', f'{PAGE_ID}/video_reels', upload_phase='finish', video_id=state['video_id'],
                     video_state='PUBLISHED', description=description)
        state['finished'] = True
        save_state(state_path, state)
    deadline = clock() + TIMEOUT
    while True:
        status = client.graph('GET', state['video_id'], fields='status,permalink_url')
        phase = ((status.get('status') or {}).get('publishing_phase') or {}).get('status')
        vstatus = (status.get('status') or {}).get('video_status')
        if phase == 'complete' or vstatus == 'ready':
            break
        if phase == 'error' or vstatus == 'error':
            raise FacebookPublishError(f'Facebook reel processing failed: {json.dumps(status)[:300]}', step='processing')
        if clock() > deadline:
            raise FacebookPublishError('Facebook reel still processing after the timeout; rerun to resume', step='processing')
        sleep(POLL_SECONDS)
    permalink = status.get('permalink_url')
    if permalink and permalink.startswith('/'):
        permalink = 'https://www.facebook.com' + permalink
    state.update(status='published', permalink=permalink, published_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    save_state(state_path, state)
    return {**result, 'status': 'published', 'video_id': state['video_id'], 'permalink': permalink}


def publish_album(image_urls, lesson, *, dry_run=True, state_path=None, credential=CREDENTIAL, transport=None):
    """A multi-photo Page post (the carousel on Facebook): each slide is uploaded unpublished (POST /{page}/photos
    url=..., published=false), then one feed post attaches them in order. State is saved after every photo id."""
    live = dry_run is False
    if live and not state_path:
        raise FacebookPublishError('publishing needs a state_path', step='state')
    if not 2 <= len(image_urls) <= 20:
        raise FacebookPublishError(f'album needs 2-20 images, got {len(image_urls)}', step='images')
    message = caption_for(lesson)
    info = check(credential, transport)
    if not info['identity_ok']:
        raise FacebookPublishError(f"token belongs to {info['page_name']!r}, not {PAGE_NAME}", step='identity')
    result = {'platform': 'facebook_album', 'dry_run': not live, 'images': len(image_urls),
              'requests': [f'POST /{PAGE_ID}/photos url=<slide {i + 1}> published=false' for i in range(len(image_urls))]
              + [f'POST /{PAGE_ID}/feed message + attached_media x{len(image_urls)}'], 'warnings': []}
    if not live:
        result['status'] = 'planned'
        if info['missing_scopes']:
            result['warnings'].append(f"token lacks {info['missing_scopes']}")
        return result
    if info['missing_scopes']:
        raise FacebookPublishError(f"Page token lacks {info['missing_scopes']}", step='scopes')
    state = load_state(state_path)
    if state.get('status') == 'published':
        return {**result, 'status': 'already_published', 'post_id': state['post_id'], 'permalink': state.get('permalink')}
    client = Client(load_credentials(credential)['access_token'], transport)
    photos = state.setdefault('photo_ids', [])
    for url in image_urls[len(photos):]:
        photos.append(client.graph('POST', f'{PAGE_ID}/photos', url=url, published='false')['id'])
        save_state(state_path, state)
    if not state.get('post_id'):
        media = json.dumps([{'media_fbid': pid} for pid in photos])
        state['post_id'] = client.graph('POST', f'{PAGE_ID}/feed', message=message, attached_media=media)['id']
        save_state(state_path, state)
    link = client.graph('GET', state['post_id'], fields='permalink_url').get('permalink_url')
    state.update(status='published', permalink=link, published_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))
    save_state(state_path, state)
    return {**result, 'status': 'published', 'post_id': state['post_id'], 'permalink': link}


def main(argv=None):
    cmd = (argv or sys.argv[1:] or ['check'])[0]
    if cmd != 'check':
        raise SystemExit(__doc__)
    json.dump(check(), sys.stdout, indent=2); print()


if __name__ == '__main__':
    main()
