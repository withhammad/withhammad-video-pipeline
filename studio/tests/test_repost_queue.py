import json
from datetime import datetime, timezone

from app import repost_queue as rq


def entry(i, slot, platform='instagram', status='pending'):
    return {'id': f'e{i}', 'job': 'j', 'platform': platform, 'slot_utc': slot, 'local': slot, 'keyword': 'K',
            'title': 't', 'caption': 'c', 'host_slug': 'repost-j', 'collaborators': None, 'status': status}


def test_due_window_and_missed():
    now = datetime(2026, 11, 2, 12, 0, tzinfo=timezone.utc)
    es = [entry(1, '2026-11-02T07:00:00Z'), entry(2, '2026-11-02T05:00:00Z'), entry(3, '2026-11-02T13:00:00Z'),
          entry(4, '2026-11-02T11:00:00Z', status='posted')]
    ready, missed = rq.due(es, now)
    assert [e['id'] for e in ready] == ['e1'] and [e['id'] for e in missed] == ['e2']


class FakeRt:
    def __init__(self, fail=False):
        self.calls, self.fail = [], fail

    def instagram_publish(self, video, lesson, **o):
        self.calls.append(('ig', o['dry_run'], lesson['captions']['instagram'], o['expected_username']))
        if self.fail:
            raise RuntimeError('boom')
        return {'status': 'dry_run' if o['dry_run'] else 'published', 'permalink': 'https://ig/r'}

    def linkedin_publish(self, video, lesson, **o):
        self.calls.append(('li', o['dry_run'], lesson['captions']['linkedin']))
        return {'status': 'dry_run' if o['dry_run'] else 'published', 'post_url': 'https://li/p'}


def setup(tmp_path, monkeypatch, entries):
    job = tmp_path / 'jobs' / 'j'; job.mkdir(parents=True, exist_ok=True)
    (job / 'lesson.json').write_text('{"captions": {}}')
    monkeypatch.setattr(rq, 'JOBS', tmp_path / 'jobs')
    monkeypatch.setattr(rq.pr, 'host_instagram_media', lambda *a: None)
    q = tmp_path / 'q.json'; q.write_text(json.dumps({'entries': entries}))
    return q


def test_dry_run_changes_nothing(tmp_path, monkeypatch):
    q = setup(tmp_path, monkeypatch, [entry(1, '2026-11-02T07:00:00Z'), entry(2, '2026-11-02T07:00:00Z', 'linkedin')])
    rt = FakeRt()
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=False, rt=rt, path=q)
    assert len(rep['posted']) == 2 and all(c[1] is True for c in rt.calls)
    assert rt.calls[0][3] == 'withhammad.ai'
    assert all(e['status'] == 'pending' for e in json.loads(q.read_text())['entries'])


def test_live_records_post_and_failure(tmp_path, monkeypatch):
    q = setup(tmp_path, monkeypatch, [entry(1, '2026-11-02T07:00:00Z')])
    rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=True, rt=FakeRt(), path=q)
    e = json.loads(q.read_text())['entries'][0]
    assert e['status'] == 'posted' and e['url'] == 'https://ig/r'
    q2 = setup(tmp_path, monkeypatch, [entry(1, '2026-11-02T07:00:00Z')])
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=True, rt=FakeRt(fail=True), path=q2)
    assert rep['failed'] and json.loads(q2.read_text())['entries'][0]['status'] == 'failed'
