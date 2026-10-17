import io
import os

import pytest
from fastapi.testclient import TestClient

os.environ['STUDIO_USER'] = 'tester'
os.environ['STUDIO_PASSWORD'] = 'pw'


@pytest.fixture
def client(tmp_path, monkeypatch):
    from app import db, main
    monkeypatch.setattr(db, 'DB_PATH', tmp_path / 'studio.sqlite')
    monkeypatch.setattr(main, 'UPLOADS', tmp_path / 'uploads')
    with TestClient(main.app) as c:
        yield c


AUTH = ('tester', 'pw')


def test_health_is_public(client):
    assert client.get('/healthz').json()['ok'] is True


def test_requires_basic_auth(client):
    assert client.get('/').status_code == 401
    assert client.get('/jobs').status_code == 401
    assert client.get('/', auth=('tester', 'wrong')).status_code == 401


def test_create_url_job_and_run_worker(client, tmp_path):
    from app import db, worker
    r = client.post('/jobs', data={'reference': 'https://www.instagram.com/reel/abc123/'}, auth=AUTH)
    assert r.status_code == 201
    job_id = r.json()['id']
    job = client.get(f'/jobs/{job_id}', auth=AUTH).json()
    assert job['status'] == 'queued' and job['stage'] == 'intake'
    claimed = db.claim_next()
    assert claimed['id'] == job_id
    assert worker.run_job(claimed) == 'done'
    job = client.get(f'/jobs/{job_id}', auth=AUTH).json()
    assert job['status'] == 'done'
    assert job['artifacts']['intake']['platform'] == 'instagram'
    assert any(e['message'] == 'completed' for e in job['events'])
    assert db.claim_next() is None


def test_rejects_bad_url(client):
    assert client.post('/jobs', data={'reference': 'ftp://x'}, auth=AUTH).status_code == 422
    assert client.post('/jobs', data={'reference': ''}, auth=AUTH).status_code == 422


def test_image_job(client):
    from app import db, worker
    png = io.BytesIO(b'\x89PNG\r\n\x1a\n' + b'0' * 100)
    r = client.post('/jobs', files={'image': ('shot.png', png, 'image/png')}, auth=AUTH)
    assert r.status_code == 201
    job = db.claim_next()
    assert job['source_type'] == 'image' and job['source'].endswith('.png')
    assert worker.run_job(job) == 'done'
    assert db.get_job(job['id'])['artifacts']['intake']['bytes'] == 108


def test_rejects_non_image(client):
    r = client.post('/jobs', files={'image': ('x.txt', io.BytesIO(b'hi'), 'text/plain')}, auth=AUTH)
    assert r.status_code == 422


def test_html_ui_renders(client):
    client.post('/jobs', data={'reference': 'https://example.com/v'}, auth=AUTH)
    html = client.get('/', auth=AUTH, headers={'accept': 'text/html'}).text
    assert 'WithHammad Studio' in html and 'example.com/v' in html


def test_migration_is_idempotent(tmp_path):
    from app import db
    p = tmp_path / 'x.sqlite'
    db.migrate(p)
    db.migrate(p)
    with db.connect(p) as conn:
        assert conn.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()['value'] == '1'
