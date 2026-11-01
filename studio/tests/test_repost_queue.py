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


def test_facebook_entry_uses_hosted_url_and_dry_run(tmp_path, monkeypatch):
    from app import publish_facebook
    seen = {}

    def fake_publish(video_url, lesson, **o):
        seen.update(url=video_url, caption=lesson['captions']['facebook'], dry=o['dry_run'])
        return {'status': 'planned', 'warnings': []}
    monkeypatch.setattr(publish_facebook, 'publish', fake_publish)
    q = setup(tmp_path, monkeypatch, [entry(1, '2026-11-02T07:00:00Z', 'facebook')])
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=False, rt=FakeRt(), path=q)
    assert rep['posted'][0]['status'] == 'planned'
    assert seen['url'].endswith('/media/reels/repost-j.mp4') and seen['caption'] == 'c' and seen['dry'] is True


def test_build_reads_seo_per_platform_and_refuses_unresearched(tmp_path, monkeypatch):
    jobs = tmp_path / 'jobs'; (jobs / 'a' / 'seo').mkdir(parents=True); (jobs / 'b' / 'seo').mkdir(parents=True)
    (jobs / 'a' / 'lesson.json').write_text(json.dumps({'manychat_keyword': 'K', 'topic_title': 'A'}))
    (jobs / 'a' / 'seo' / 'seo.json').write_text(json.dumps({'researched_at': '2026-11-01', 'sources': ['s'], 'primary_keyword': 'pk',
        'instagram': {'caption': 'ig Follow @withhammad.ai'}, 'facebook': {'caption': 'fb'}, 'linkedin': {'text': 'li'}}))
    (jobs / 'b' / 'lesson.json').write_text('{}')
    (jobs / 'b' / 'seo' / 'seo.json').write_text(json.dumps({'instagram': {'caption': 'x'}}))
    monkeypatch.setattr(rq, 'JOBS', jobs)
    plan = tmp_path / 'plan.json'
    plan.write_text(json.dumps({'instagram_times': ['11:00'], 'facebook_times': ['14:00'], 'linkedin_times': ['09:00'],
                                'days': [{'date': '2026-11-02', 'instagram': ['a'], 'linkedin': ['a']}]}))
    q = tmp_path / 'q.json'
    q.write_text(json.dumps({'entries': [{'id': 'in-a', 'platform': 'instagram', 'local': '2026-11-02 11:00 GST', 'status': 'posted', 'url': 'u', 'slot_utc': '2026-11-02T07:00:00Z'}]}))
    es = rq.build(plan, q)
    assert [(e['platform'], e['local']) for e in es] == [('linkedin', '2026-11-02 09:00 GST'), ('instagram', '2026-11-02 11:00 GST'), ('facebook', '2026-11-02 14:00 GST')]
    assert es[1]['status'] == 'posted' and es[2]['caption'] == 'fb' and es[0]['caption'] == 'li'
    plan.write_text(json.dumps({'instagram_times': ['11:00'], 'facebook_times': [], 'linkedin_times': [],
                                'days': [{'date': '2026-11-02', 'instagram': ['b']}]}))
    import pytest
    with pytest.raises(ValueError, match='researched'):
        rq.build(plan, q)
