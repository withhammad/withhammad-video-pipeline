import io
import json
import os

import pytest
from fastapi.testclient import TestClient

os.environ['STUDIO_USER'] = 'tester'
os.environ['STUDIO_PASSWORD'] = 'pw'
AUTH = ('tester', 'pw')


@pytest.fixture
def env(tmp_path, monkeypatch):
    from app import db, main
    monkeypatch.setattr(db, 'DB_PATH', tmp_path / 'studio.sqlite')
    monkeypatch.setattr(main, 'UPLOADS', tmp_path / 'uploads')
    with TestClient(main.app) as client:
        yield client, tmp_path


from conftest import fake_runner_factory  # noqa: E402


def test_url_job_downloads_and_transcribes(env, fake_tools):
    from app import db, worker
    client, tmp = env
    calls = fake_tools
    job_id = client.post('/jobs', data={'reference': 'https://www.instagram.com/reel/X1/'}, auth=AUTH).json()['id']
    assert worker.run_job(db.claim_next()) == 'done'
    job = db.get_job(job_id)
    assert job['status'] == 'done' and job['stage'] == 'lesson'
    intake, transcript = job['artifacts']['intake'], job['artifacts']['transcribe']
    assert intake['platform'] == 'instagram' and intake['duration_s'] == 42.0 and intake['title'] == 'Ref'
    assert transcript['engine'] == 'faster-whisper:test' and transcript['words'] == 20
    assert (tmp / 'jobs' / job_id / 'transcript.txt').read_text().startswith('hello world from the reel')
    assert calls[0][0] == 'yt-dlp' and '--cookies' not in calls[0]
    assert calls[1][0] == 'ffmpeg' and calls[1][-1].endswith('audio.m4a')


def test_cookie_file_is_passed_when_present(env, monkeypatch):
    from app import media
    _, tmp = env
    cookies = tmp / 'cookies.txt'
    cookies.write_text('# Netscape HTTP Cookie File\n')
    monkeypatch.setattr(media, 'COOKIES_FILE', cookies)
    calls = []
    media.download('https://www.instagram.com/reel/Y/', media.job_dir('j1'), runner=fake_runner_factory(calls))
    assert '--cookies' in calls[0] and str(cookies) in calls[0]


def test_download_failure_marks_job_failed(env, monkeypatch):
    from app import db, media, worker
    client, _ = env

    def failing(cmd, timeout):
        raise RuntimeError('yt-dlp failed (exit 1): Sign in to confirm you are not a bot')
    monkeypatch.setattr(media, 'run', failing)
    job_id = client.post('/jobs', data={'reference': 'https://www.youtube.com/shorts/Z'}, auth=AUTH).json()['id']
    assert worker.run_job(db.claim_next()) == 'failed'
    job = db.get_job(job_id)
    assert job['status'] == 'failed' and 'not a bot' in job['error'] and job['stage'] == 'intake'


def test_video_upload_job(env, fake_tools, monkeypatch):
    from app import db, media, worker
    client, _ = env
    calls = fake_tools
    monkeypatch.setattr(media, 'transcribe_local', lambda audio: {
        'engine': 'faster-whisper:test', 'language': 'ur', 'text': 'salam ' * 20, 'segments': []})
    r = client.post('/jobs', files={'video': ('clip.mp4', io.BytesIO(b'0' * 2048), 'video/mp4')}, auth=AUTH)
    assert r.status_code == 201
    job = db.claim_next()
    assert job['source_type'] == 'video'
    assert worker.run_job(job) == 'done'
    done = db.get_job(job['id'])
    assert done['artifacts']['intake']['kind'] == 'video' and done['artifacts']['intake']['duration_s'] == 12.5
    assert done['artifacts']['transcribe']['language'] == 'ur'
    assert all(c[0] != 'yt-dlp' for c in calls)


def test_image_job_skips_transcription(env, monkeypatch):
    from app import db, worker
    client, _ = env
    client.post('/jobs', files={'image': ('a.png', io.BytesIO(b'\x89PNG' + b'0' * 50), 'image/png')}, auth=AUTH)
    job = db.claim_next()
    assert worker.run_job(job) == 'failed'  # lesson stage needs a transcript
    assert db.get_job(job['id'])['artifacts']['transcribe'] == {'skipped': 'image source has no audio'}


def test_rejects_wrong_video_type(env):
    client, _ = env
    r = client.post('/jobs', files={'video': ('x.avi', io.BytesIO(b'x'), 'video/x-msvideo')}, auth=AUTH)
    assert r.status_code == 422


def test_groq_used_when_key_set_and_falls_back_on_error(env, monkeypatch):
    from app import media
    _, tmp = env
    audio = tmp / 'a.m4a'
    audio.write_bytes(b'x' * 100)

    class Resp:
        status_code = 200

        @staticmethod
        def json():
            return {'text': ' Hi there ', 'language': 'en', 'segments': [{'start': 0.0, 'end': 0.8, 'text': ' Hi there '}]}
    monkeypatch.setattr(media.httpx, 'post', lambda *a, **k: Resp())
    out = media.transcribe(audio, api_key='gsk_test')
    assert out['engine'].startswith('groq:') and out['text'] == 'Hi there' and out['segments'][0]['text'] == 'Hi there'

    def boom(*a, **k):
        raise RuntimeError('network down')
    monkeypatch.setattr(media.httpx, 'post', boom)
    monkeypatch.setattr(media, 'transcribe_local', lambda a: {'engine': 'faster-whisper:base', 'language': 'en', 'text': 'local', 'segments': []})
    out = media.transcribe(audio, api_key='gsk_test')
    assert out['engine'] == 'faster-whisper:base' and out['fallback_reason'] == 'network down'
