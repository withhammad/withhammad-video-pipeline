import json
import os

import httpx
import pytest

from app import heygen

REAL_RENDER = heygen.render  # conftest fakes heygen.render for pipeline tests

LOOKS = {'data': [
    {'id': 'look_blazer', 'name': 'Hammad Yousuf', 'default_voice_id': 'voice_1', 'status': 'completed', 'group_id': 'g'},
    {'id': 'look_grey', 'name': 'Smiling person in grey shirt', 'default_voice_id': None, 'status': 'completed', 'group_id': 'g'},
    {'id': 'look_cam', 'name': 'Hammad Yousuf - 1', 'default_voice_id': None, 'status': 'completed', 'group_id': 'g'},
], 'has_more': False, 'next_token': None}


def make_client(handler):
    return heygen.HeyGen(api_key='hg_test', transport=httpx.MockTransport(handler))


def test_resolve_look_by_configured_name(monkeypatch):
    monkeypatch.setattr(heygen, 'LOOK_ID', '')
    seen = {}

    def handler(request):
        seen['url'] = str(request.url)
        seen['key'] = request.headers.get('x-api-key')
        return httpx.Response(200, json=LOOKS)
    look = make_client(handler).resolve_look('g')
    assert look['id'] == 'look_blazer' and seen['key'] == 'hg_test'
    assert '/v3/avatars/looks' in seen['url'] and 'group_id=g' in seen['url']


def test_resolve_look_errors_list_choices(monkeypatch):
    monkeypatch.setattr(heygen, 'LOOK_ID', '')
    monkeypatch.setattr(heygen, 'LOOK_NAME', 'Nobody')
    with pytest.raises(RuntimeError, match='No looks named.*Smiling person'):
        make_client(lambda r: httpx.Response(200, json=LOOKS)).resolve_look('g')


def test_render_submits_persists_polls_and_downloads(tmp_path, monkeypatch):
    monkeypatch.setattr(heygen, 'LOOK_ID', '')
    monkeypatch.setattr(heygen, 'LOOK_NAME', 'Hammad Yousuf')
    polls = {'n': 0}
    bodies = {}

    def handler(request):
        path = request.url.path
        if path == '/v3/avatars/looks':
            return httpx.Response(200, json=LOOKS)
        if path == '/v3/videos' and request.method == 'POST':
            bodies['create'] = json.loads(request.content)
            bodies['idem'] = request.headers.get('Idempotency-Key')
            return httpx.Response(200, json={'data': {'video_id': 'vid_1', 'status': 'waiting', 'output_format': 'mp4'}})
        if path == '/v3/videos/vid_1':
            polls['n'] += 1
            status = 'processing' if polls['n'] < 3 else 'completed'
            return httpx.Response(200, json={'data': {'id': 'vid_1', 'status': status, 'duration': 52.4,
                                                      'video_url': 'https://files.heygen.test/v.mp4',
                                                      'subtitle_url': 'https://files.heygen.test/v.srt',
                                                      'thumbnail_url': 't', 'video_page_url': 'p'}})
        if request.url.host == 'files.heygen.test':
            assert request.headers.get('x-api-key', '') == ''  # never leak the key to the file host
            return httpx.Response(200, content=b'VIDEO' if path.endswith('.mp4') else b'1\n00:00:00,000 --> 00:00:01,000\nhi\n')
        return httpx.Response(404, json={'error': {'code': 'nf', 'message': 'no'}})

    client = make_client(handler)
    monkeypatch.setattr(client, 'wait_for_video', lambda vid, **kw: heygen.HeyGen.wait_for_video(client, vid, sleep=lambda s: None, poll=0))
    result = REAL_RENDER('job1', 'Hello there.\n\nComment WORD.', 'My title', tmp_path, client=client)
    assert bodies['create']['type'] == 'avatar' and bodies['create']['avatar_id'] == 'look_blazer'
    assert bodies['create']['voice_id'] == 'voice_1' and bodies['create']['aspect_ratio'] == '9:16'
    assert bodies['create']['script'].startswith('Hello there.') and bodies['idem'] == 'studio-job1'
    assert json.loads((tmp_path / 'heygen_submission.json').read_text())['video_id'] == 'vid_1'
    assert polls['n'] == 3 and result['duration_s'] == 52.4
    assert (tmp_path / 'avatar.mp4').read_bytes() == b'VIDEO' and (tmp_path / 'avatar.srt').exists()
    assert result['look_name'] == 'Hammad Yousuf' and result['video_id'] == 'vid_1'


def test_render_resumes_existing_submission(tmp_path):
    calls = []

    def handler(request):
        calls.append(request.url.path)
        if request.url.path == '/v3/videos/vid_old':
            return httpx.Response(200, json={'data': {'id': 'vid_old', 'status': 'completed', 'duration': 10,
                                                      'video_url': 'https://files.heygen.test/v.mp4'}})
        if request.url.host == 'files.heygen.test':
            return httpx.Response(200, content=b'V')
        raise AssertionError('unexpected ' + request.url.path)
    result = REAL_RENDER('job2', 'x', 't', tmp_path, client=make_client(handler), resume_video_id='vid_old')
    assert result['video_id'] == 'vid_old' and '/v3/videos' not in calls  # no new submission, no look lookup


def test_failed_render_raises_with_reason():
    def handler(request):
        return httpx.Response(200, json={'data': {'id': 'v', 'status': 'failed', 'failure_code': 'quota', 'failure_message': 'No credits'}})
    with pytest.raises(RuntimeError, match='quota: No credits'):
        make_client(handler).wait_for_video('v', sleep=lambda s: None)


def test_timeout_message_mentions_rerun():
    def handler(request):
        return httpx.Response(200, json={'data': {'id': 'v', 'status': 'processing'}})
    clock = iter([0, 0, 100, 200])
    with pytest.raises(RuntimeError, match='rerun the stage later'):
        make_client(handler).wait_for_video('v', timeout=50, poll=0, sleep=lambda s: None, clock=lambda: next(clock))


def test_api_error_surfaces_code_and_message():
    def handler(request):
        return httpx.Response(401, json={'error': {'code': 'unauthorized', 'message': 'Invalid API key'}})
    with pytest.raises(RuntimeError, match=r'\(401\) unauthorized: Invalid API key'):
        make_client(handler).get_voice('v')


def test_missing_key_is_a_clear_error(monkeypatch):
    monkeypatch.delenv('HEYGEN_API_KEY', raising=False)
    with pytest.raises(RuntimeError, match='HEYGEN_API_KEY is missing'):
        heygen.HeyGen()
