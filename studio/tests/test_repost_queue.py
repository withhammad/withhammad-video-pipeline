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


def test_youtube_entry_uses_seo_title_public_and_cover(tmp_path, monkeypatch):
    seen = {}

    class Rt(FakeRt):
        def youtube_publish(self, video, lesson, **o):
            seen.update(title=lesson['captions']['youtube_title'], desc=lesson['captions']['youtube_description'],
                        privacy=o['privacy_status'], thumb=str(o['thumbnail_path']), dry=o['dry_run'])
            return {'status': 'dry_run' if o['dry_run'] else 'published', 'video_id': 'abc'}
    q = setup(tmp_path, monkeypatch, [entry(1, '2026-11-09T05:00:00Z', 'youtube')])
    (tmp_path / 'jobs' / 'j' / 'seo').mkdir(exist_ok=True)
    (tmp_path / 'jobs' / 'j' / 'seo' / 'seo.json').write_text(json.dumps({'youtube': {'title': 'T', 'tags': ['a']}}))
    rep = rq.run_due(datetime(2026, 11, 9, 5, 5, tzinfo=timezone.utc), live=True, rt=Rt(), path=q)
    assert rep['posted'][0]['url'] == 'https://www.youtube.com/shorts/abc'
    assert seen == {'title': 'T', 'desc': 'c', 'privacy': 'public', 'thumb': str(tmp_path / 'jobs' / 'j' / 'cover_1080x1920.jpg'), 'dry': False}


class CarouselRt(FakeRt):
    def instagram_carousel_publish(self, urls, lesson, **o):
        self.calls.append(('ic', o['dry_run'], urls, lesson['captions']['instagram'], o['expected_username'], o['image_sizes']))
        return {'status': 'dry_run' if o['dry_run'] else 'published', 'permalink': 'https://ig/c'}

    def linkedin_document_publish(self, pdf, lesson, **o):
        self.calls.append(('lc', o['dry_run'], pdf.name, lesson['captions']['linkedin'], o['title']))
        return {'status': 'dry_run' if o['dry_run'] else 'published', 'post_url': 'https://li/d'}


def carousel_job(tmp_path):
    c = tmp_path / 'jobs' / 'j' / 'carousel'; c.mkdir(parents=True, exist_ok=True)
    for i in (1, 2, 3):
        (c / f'instagram-{i:02d}.png').write_bytes(b'x')
    (c / 'carousel-linkedin.pdf').write_bytes(b'%PDF')


def test_carousel_lanes_dry_run_use_planned_urls_and_captions(tmp_path, monkeypatch):
    es = [dict(entry(1, '2026-11-02T07:00:00Z', 'instagram_carousel'), caption='ig cap'),
          dict(entry(2, '2026-11-02T07:00:00Z', 'facebook_carousel'), caption='fb cap'),
          dict(entry(3, '2026-11-02T07:00:00Z', 'linkedin_carousel'), caption='li cap', doc_title='Doc')]
    q = setup(tmp_path, monkeypatch, es); carousel_job(tmp_path)
    monkeypatch.setattr(rq.pr, 'host_carousel_media', lambda *a: (_ for _ in ()).throw(AssertionError('no hosting in dry run')))
    from app import publish_facebook
    seen = {}
    monkeypatch.setattr(publish_facebook, 'publish_album',
                        lambda urls, lesson, **o: seen.update(urls=urls, cap=lesson['captions']['facebook'], dry=o['dry_run']) or {'status': 'planned'})
    rt = CarouselRt()
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=False, rt=rt, path=q)
    assert len(rep['posted']) == 3 and not rep['failed']
    ic = [c for c in rt.calls if c[0] == 'ic'][0]
    assert ic[1] is True and ic[2][-1].endswith('/media/carousels/repost-j/03.jpg') and ic[3] == 'ig cap' and ic[4] == 'withhammad.ai'
    assert seen == {'urls': ic[2], 'cap': 'fb cap', 'dry': True}
    assert [c for c in rt.calls if c[0] == 'lc'][0] == ('lc', True, 'carousel-linkedin.pdf', 'li cap', 'Doc')


def test_carousel_live_hosts_once_per_post_and_records(tmp_path, monkeypatch):
    q = setup(tmp_path, monkeypatch, [dict(entry(1, '2026-11-02T07:00:00Z', 'instagram_carousel'), caption='ig cap')])
    carousel_job(tmp_path)
    monkeypatch.setattr(rq.pr, 'host_carousel_media', lambda *a: {'image_urls': ['u1', 'u2'], 'image_bytes': [1, 2]})
    rt = CarouselRt()
    rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=True, rt=rt, path=q)
    assert rt.calls[0][2] == ['u1', 'u2'] and rt.calls[0][5] == [1, 2]
    e = json.loads(q.read_text())['entries'][0]
    assert e['status'] == 'posted' and e['url'] == 'https://ig/c'


def test_carousel_without_slides_fails_cleanly(tmp_path, monkeypatch):
    q = setup(tmp_path, monkeypatch, [entry(1, '2026-11-02T07:00:00Z', 'instagram_carousel')])
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=False, rt=CarouselRt(), path=q)
    assert rep['failed'] and 'render the carousel' in rep['failed'][0]['error']


def test_guide_lane_stages_pages_and_uses_carousel_publishers(tmp_path, monkeypatch):
    g = tmp_path / 'guides' / 'gd'; g.mkdir(parents=True)
    for i in (1, 2):
        (g / f'instagram-{i:02d}.png').write_bytes(b'p%d' % i)
    (g / 'carousel-linkedin.pdf').write_bytes(b'%PDF')
    monkeypatch.setattr(rq, 'GUIDES', tmp_path / 'guides')
    es = [dict(entry(1, '2026-11-02T07:00:00Z', 'instagram_guide'), guide='gd', job=None, caption='ig cap', host_slug='guide-gd'),
          dict(entry(2, '2026-11-02T07:00:00Z', 'linkedin_guide'), guide='gd', job=None, caption='li cap', doc_title='Doc')]
    q = setup(tmp_path, monkeypatch, es)
    rt = CarouselRt()
    rep = rq.run_due(datetime(2026, 11, 2, 7, 5, tzinfo=timezone.utc), live=False, rt=rt, path=q)
    assert not rep['failed'] and len(rep['posted']) == 2
    ic = [c for c in rt.calls if c[0] == 'ic'][0]
    assert ic[2][-1].endswith('/media/carousels/guide-gd/02.jpg') and ic[3] == 'ig cap'
    assert [c for c in rt.calls if c[0] == 'lc'][0][2:] == ('carousel-linkedin.pdf', 'li cap', 'Doc')
    assert (g / '.host' / 'carousel' / 'instagram-02.png').read_bytes() == b'p2'


def test_chrome_lanes_never_auto_post_and_mark_records(tmp_path):
    q = tmp_path / 'q.json'
    entries = [{'id': 'tt-a', 'job': 'a', 'platform': 'tiktok', 'slot_utc': '2026-11-02T10:00:00Z', 'local': 'x',
                'keyword': 'A', 'caption': 'c', 'status': 'pending'},
               {'id': 'xx-a', 'job': 'a', 'platform': 'x', 'slot_utc': '2026-11-02T10:00:00Z', 'local': 'x',
                'keyword': 'A', 'caption': 'c', 'status': 'pending'}]
    q.write_text(json.dumps({'entries': entries}))
    ready, missed = rq.due(entries, datetime(2026, 11, 3, tzinfo=timezone.utc))
    assert ready == [] and missed == []           # run-due leaves TikTok/X to the Chrome routine
    assert [e['id'] for e in rq.chrome_todo(q)] == ['tt-a', 'xx-a']
    rq.mark('tt-a', 'https://www.tiktok.com/tiktokstudio/content', scheduled=True, path=q)
    assert [e['id'] for e in rq.chrome_todo(q)] == ['xx-a']
    assert rq.load(q)['entries'][0]['status'] == 'scheduled'


def test_guide_video_lanes_youtube_by_api_tiktok_x_by_chrome(tmp_path, monkeypatch):
    g = tmp_path / 'guides' / 'gd'; g.mkdir(parents=True)
    (g / 'short.mp4').write_bytes(b'v')
    monkeypatch.setattr(rq, 'GUIDES', tmp_path / 'guides')
    es = [dict(entry(1, '2026-11-02T06:00:00Z', 'youtube_guide'), guide='gd', job=None, caption='yt cap', title='YT title'),
          dict(entry(2, '2026-11-02T06:00:00Z', 'tiktok_guide'), guide='gd', job=None, caption='tt cap')]
    q = setup(tmp_path, monkeypatch, es)
    calls = []

    class Rt:
        def youtube_publish(self, path, lesson, **kw):
            calls.append((path, lesson, kw)); return {'status': 'planned'}
    rep = rq.run_due(datetime(2026, 11, 2, 6, 5, tzinfo=timezone.utc), live=False, rt=Rt(), path=q)
    assert [p['id'] for p in rep['posted']] == [es[0]['id']]          # the TikTok entry waits for Chrome
    path, lesson, kw = calls[0]
    assert path == g / 'short.mp4' and lesson['captions'] == {'youtube_title': 'YT title', 'youtube_description': 'yt cap'}
    assert kw['contains_synthetic_media'] is False and kw['privacy_status'] == 'public'
    assert rq.chrome_todo(q)[0]['video'] == str(g / 'short.mp4')
