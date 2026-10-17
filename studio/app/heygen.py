"""Stage 4: render the avatar video with HeyGen (API v3).

Verified against developers.heygen.com on 2026-10-17:
  POST https://api.heygen.com/v3/videos            body type=avatar, avatar_id (a LOOK id), script, voice_id…
  GET  https://api.heygen.com/v3/videos/{id}       data.status pending|processing|completed|failed, video_url…
  GET  https://api.heygen.com/v3/avatars/looks     ?group_id= → data[] {id, name, default_voice_id, status…}
  GET  https://api.heygen.com/v3/voices/{voice_id} data {voice_id, name, language, status…}
Auth: x-api-key header."""
import json
import os
import time
from pathlib import Path

import httpx

BASE = 'https://api.heygen.com'
AVATAR_GROUP_ID = os.environ.get('STUDIO_HEYGEN_GROUP_ID', '83caeb76d04d4e47a9c095e7453ff247')
LOOK_NAME = os.environ.get('STUDIO_HEYGEN_LOOK_NAME', 'Hammad Yousuf')
LOOK_ID = os.environ.get('STUDIO_HEYGEN_LOOK_ID', '')
VOICE_ID = os.environ.get('STUDIO_HEYGEN_VOICE_ID', '0f7032b11fb743589cc81b721f4389b3')
ENGINE = os.environ.get('STUDIO_HEYGEN_ENGINE', 'avatar_v')
RESOLUTION = os.environ.get('STUDIO_HEYGEN_RESOLUTION', '720p')  # owner preference: always 720p
POLL_SECONDS = float(os.environ.get('STUDIO_HEYGEN_POLL_SECONDS', '15'))
RENDER_TIMEOUT = float(os.environ.get('STUDIO_HEYGEN_TIMEOUT', '1800'))


class HeyGen:
    def __init__(self, api_key=None, transport=None):
        key = (api_key or os.environ.get('HEYGEN_API_KEY', '')).strip()
        if not key:
            raise RuntimeError('HEYGEN_API_KEY is missing from work/.secrets/studio.env')
        self.http = httpx.Client(base_url=BASE, headers={'x-api-key': key, 'accept': 'application/json'},
                                 timeout=60, transport=transport)

    def _call(self, method, path, **kwargs):
        response = self.http.request(method, path, **kwargs)
        if response.status_code >= 400:
            try:
                error = response.json().get('error', {})
                detail = f"{error.get('code')}: {error.get('message')}"
            except ValueError:
                detail = response.text[:200]
            raise RuntimeError(f'HeyGen {method} {path} failed ({response.status_code}) {detail}')
        return response.json()

    def list_looks(self, group_id=AVATAR_GROUP_ID):
        looks, token = [], None
        while True:
            params = {'group_id': group_id, 'limit': 50}
            if token:
                params['token'] = token
            page = self._call('GET', '/v3/avatars/looks', params=params)
            looks += page.get('data', [])
            token = page.get('next_token')
            if not page.get('has_more') or not token:
                return looks

    def resolve_look(self, group_id=AVATAR_GROUP_ID):
        """The configured look id, else the configured look name, else error with the choices."""
        looks = self.list_looks(group_id)
        if LOOK_ID:
            match = next((l for l in looks if l['id'] == LOOK_ID), None)
            if not match:
                raise RuntimeError(f'Configured look id {LOOK_ID} is not in group {group_id}')
            return match
        named = [l for l in looks if l.get('name') == LOOK_NAME]
        if len(named) == 1:
            return named[0]
        choices = ', '.join(f"{l.get('name')} ({l['id']})" for l in looks)
        raise RuntimeError(f"{'No' if not named else 'Several'} looks named {LOOK_NAME!r}; set STUDIO_HEYGEN_LOOK_ID. "
                           f'Available: {choices}')

    def get_voice(self, voice_id):
        return self._call('GET', f'/v3/voices/{voice_id}')['data']

    def create_avatar_video(self, look_id, script, voice_id, title, callback_id=None, speed=1.0):
        body = {'type': 'avatar', 'avatar_id': look_id, 'script': script, 'voice_id': voice_id,
                'title': title[:120], 'aspect_ratio': '9:16', 'resolution': RESOLUTION, 'fit': 'cover',
                'caption': {'file_format': 'srt'}, 'output_format': 'mp4',
                'voice_settings': {'speed': speed}, 'engine': {'type': ENGINE}}
        if callback_id:
            body['callback_id'] = callback_id
        return self._call('POST', '/v3/videos', json=body,
                          headers={'Idempotency-Key': callback_id} if callback_id else None)['data']

    def get_video(self, video_id):
        return self._call('GET', f'/v3/videos/{video_id}')['data']

    def wait_for_video(self, video_id, timeout=RENDER_TIMEOUT, poll=POLL_SECONDS, sleep=time.sleep, clock=time.monotonic):
        deadline = clock() + timeout
        while True:
            video = self.get_video(video_id)
            if video['status'] == 'completed':
                return video
            if video['status'] == 'failed':
                raise RuntimeError(f"HeyGen render failed: {video.get('failure_code')}: {video.get('failure_message')}")
            if clock() >= deadline:
                raise RuntimeError(f'HeyGen render {video_id} still {video["status"]} after {int(timeout)}s; '
                                   f'rerun the stage later to pick it up')
            sleep(poll)

    def download(self, url, target: Path):
        with self.http.stream('GET', url, headers={'x-api-key': ''}) as response:
            response.raise_for_status()
            with target.open('wb') as out:
                for chunk in response.iter_bytes(1024 * 1024):
                    out.write(chunk)
        return target


def render(job_id, script, title, folder: Path, client=None, resume_video_id=None):
    """Submit (or resume) a render, persist the video id immediately, wait, download."""
    client = client or HeyGen()
    submission_path = folder / 'heygen_submission.json'
    if resume_video_id:
        video_id, look, voice_id = resume_video_id, None, None
    else:
        look = client.resolve_look()
        voice_id = look.get('default_voice_id') or VOICE_ID
        created = client.create_avatar_video(look['id'], script, voice_id, title, callback_id=f'studio-{job_id}')
        video_id = created['video_id']
        submission_path.write_text(json.dumps({'video_id': video_id, 'look_id': look['id'], 'look_name': look.get('name'),
                                               'voice_id': voice_id, 'status': created.get('status'),
                                               'submitted_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}, indent=2))
    video = client.wait_for_video(video_id)
    target = client.download(video['video_url'], folder / 'avatar.mp4')
    subtitles = None
    if video.get('subtitle_url'):
        subtitles = str(client.download(video['subtitle_url'], folder / 'avatar.srt'))
    return {'video_id': video_id, 'look_id': look['id'] if look else None, 'look_name': look.get('name') if look else None,
            'voice_id': voice_id, 'duration_s': video.get('duration'), 'video': str(target), 'subtitles': subtitles,
            'thumbnail_url': video.get('thumbnail_url'), 'video_page_url': video.get('video_page_url')}
