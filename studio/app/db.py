"""SQLite job store. One table, additive migrations, no ORM."""
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(os.environ.get('STUDIO_DB', '/data/studio.sqlite'))
STAGES = ['intake', 'transcribe', 'lesson', 'avatar', 'animate', 'publish', 'resource', 'report']
SCHEMA_VERSION = 1


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


@contextmanager
def connect(path=None):
    path = Path(path or DB_PATH)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def migrate(path=None):
    with connect(path) as conn:
        conn.execute('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)')
        row = conn.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
        version = int(row['value']) if row else 0
        if version < 1:
            conn.execute('''CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                source_type TEXT NOT NULL,          -- url | image
                source TEXT NOT NULL,               -- the URL or stored image path
                status TEXT NOT NULL,               -- queued | running | done | failed
                stage TEXT NOT NULL,                -- current/last stage name
                error TEXT,
                artifacts TEXT NOT NULL DEFAULT '{}' -- JSON: stage -> result
            )''')
            conn.execute('''CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                at TEXT NOT NULL,
                stage TEXT NOT NULL,
                message TEXT NOT NULL
            )''')
            conn.execute("INSERT OR REPLACE INTO meta VALUES ('schema_version', ?)", (str(SCHEMA_VERSION),))


def create_job(source_type, source, path=None):
    job_id = uuid.uuid4().hex[:12]
    stamp = now()
    with connect(path) as conn:
        conn.execute('INSERT INTO jobs VALUES (?,?,?,?,?,?,?,?,?)',
                     (job_id, stamp, stamp, source_type, source, 'queued', 'intake', None, '{}'))
        conn.execute('INSERT INTO events (job_id, at, stage, message) VALUES (?,?,?,?)',
                     (job_id, stamp, 'intake', 'queued'))
    return job_id


def list_jobs(path=None, limit=100):
    with connect(path) as conn:
        rows = conn.execute('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?', (limit,)).fetchall()
    return [row_to_job(r) for r in rows]


def get_job(job_id, path=None):
    with connect(path) as conn:
        row = conn.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
        if not row:
            return None
        events = conn.execute('SELECT at, stage, message FROM events WHERE job_id=? ORDER BY id',
                              (job_id,)).fetchall()
    job = row_to_job(row)
    job['events'] = [dict(e) for e in events]
    return job


def row_to_job(row):
    job = dict(row)
    job['artifacts'] = json.loads(job['artifacts'] or '{}')
    return job


def claim_next(path=None):
    """Atomically move the oldest queued job to running and return it."""
    with connect(path) as conn:
        conn.execute('BEGIN IMMEDIATE')
        row = conn.execute("SELECT id FROM jobs WHERE status='queued' ORDER BY created_at LIMIT 1").fetchone()
        if not row:
            return None
        conn.execute("UPDATE jobs SET status='running', updated_at=? WHERE id=?", (now(), row['id']))
        job = conn.execute('SELECT * FROM jobs WHERE id=?', (row['id'],)).fetchone()
    return row_to_job(job)


def record(job_id, stage, message, artifact=None, status=None, error=None, path=None):
    with connect(path) as conn:
        job = conn.execute('SELECT artifacts FROM jobs WHERE id=?', (job_id,)).fetchone()
        artifacts = json.loads(job['artifacts'] or '{}')
        if artifact is not None:
            artifacts[stage] = artifact
        fields = {'updated_at': now(), 'stage': stage, 'artifacts': json.dumps(artifacts)}
        if status:
            fields['status'] = status
        if error is not None:
            fields['error'] = error
        assignments = ', '.join(f'{k}=?' for k in fields)
        conn.execute(f'UPDATE jobs SET {assignments} WHERE id=?', (*fields.values(), job_id))
        conn.execute('INSERT INTO events (job_id, at, stage, message) VALUES (?,?,?,?)',
                     (job_id, now(), stage, message))
