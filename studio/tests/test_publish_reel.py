"""Daily reel queue: fake publishers, fake git/HTTP; nothing reaches a platform, GitHub or withhammad.com."""
import datetime as dt
import json
from pathlib import Path

import pytest

from app import publish_reel as pr

UTC = dt.timezone.utc
KEYWORD = 'ROADMAP'
SLUG = 'forward-deployed-engineer-roadmap'
RESOURCE = f'https://withhammad.com/resources/{SLUG}'


def lesson_doc(**captions):
    base = {'instagram': f'Old caption. Comment {KEYWORD} for the guide. AI avatar of me. #ai',
            'youtube_title': 'Old title', 'youtube_description': 'Old description',
            'tiktok': 'Old tiktok', 'linkedin': 'Old linkedin'}
    base.update(captions)
    return {'language': 'en', 'topic_title': 'FDE roadmap', 'hook': 'h', 'key_takeaways': ['a', 'b'],
            'script': {'estimated_seconds': 40,
                       'segments': [{'spoken': 'one', 'on_screen_text': 'x', 'visual': 'avatar'}] * 3},
            'demo_steps': [], 'prompts': [], 'tool_links': [], 'captions': base, 'hashtags': ['old tag'],
            'manychat_keyword': KEYWORD, 'resource_page': {'slug': SLUG, 'title': 'T', 'body_markdown': 'b'},
            'sources_checked': [], 'originality_note': 'n',
            'cover': {'kicker': 'k', 'hook': 'h', 'pill_strong': 'ANY', 'pill_serif': 'noun'}}


SEO = {
    'resource_url': RESOURCE, 'manychat_keyword': KEYWORD,
    'youtube': {'title': 'Forward Deployed Engineer Roadmap 2026',
                'description': f'Free guide: {RESOURCE}\nThe presenter is an AI avatar of Hammad.',
                'tags': [f'tag {i}' for i in range(11)] + ['Tag 0'], 'hashtags': ['#FDE']},
    'instagram': {'caption': f'FDE roadmap: comment {KEYWORD} and I will DM you the guide. AI avatar of me. #fde'},
    'tiktok': {'caption': 'FDE roadmap. Free guide: withhammad.com/resources AI avatar of me. #fde',
               'hashtags': ['#fde', '#aiengineer'],
               'pinned_comment': 'Commented ROADMAP? Type the URL.'},
    'linkedin': {'text': f'FDE roadmap. Guide: {RESOURCE}\nThe presenter is an AI avatar of me.'},
    'facebook': {'caption': f'FDE roadmap. {RESOURCE} AI avatar of me.', 'hashtags': ['#FDE'],
                 'first_comment': 'Guide link'},
    'x': {'post': f'FDE roadmap: free 6-week plan.\nFree guide: {RESOURCE}\nAI avatar of me. #FDE'},
}


class UncertainPostError(Exception):
    """Same name as publish_linkedin.UncertainPostError (run_due recognises it by name)."""


class FakeRuntime:
    def __init__(self, now, site_dir, videos=None):
        self._now = now
        self.site = Path(site_dir)
        self.videos = {} if videos is None else videos   # video_id -> publishAt, shared like YouTube's own record
        self.yt_status_override = None
        self.ahead = 0         # local website commits not on origin
        self.push_failures = 0
        self.clean_tree = False
        self.calls = []        # every outside call, in order
        self.statuses = {}     # url -> GET status (default 200)
        self.head_override = {}
        self.edit_lists = False
        self.ig_crash_after_post = False
        self.li_uncertain = False

    # time
    def now(self):
        return self._now

    def sleep(self, seconds):
        self.calls.append(('sleep', seconds))

    # http
    def http_status(self, url):
        self.calls.append(('get', url))
        return self.statuses.get(url, 200)

    def http_head(self, url):
        self.calls.append(('head', url))
        if url in self.head_override:
            return self.head_override[url]
        local = self.site / 'public' / url.split('withhammad.com/', 1)[1]
        return (200, local.stat().st_size) if local.exists() else (404, None)

    # processes
    def run(self, cmd, cwd=None):
        self.calls.append(('run', [str(c) for c in cmd]))
        if cmd[:2] == ['git', 'clone']:
            (Path(cmd[-1]) / '.git').mkdir(parents=True)
        if cmd[:3] == ['git', 'rev-parse', '--abbrev-ref']:
            return 'main\n'
        if cmd[:3] == ['git', 'rev-parse', '--short']:
            return 'abc1234\n'
        if cmd[:2] == ['git', 'status']:
            return '' if self.clean_tree else ' M public/media/reels/x.mp4\n'
        if cmd[:2] == ['git', 'commit']:
            self.ahead += 1
        if cmd[:2] == ['git', 'rev-list']:
            return f'{self.ahead}\n'
        if cmd[:2] == ['git', 'push']:
            if self.push_failures:
                self.push_failures -= 1
                raise pr.ReelError('git push origin failed (exit 1): rejected (fetch first)')
            self.ahead = 0
        return ''

    def probe(self, path):
        return {'format': {'duration': '40.0'}}

    def validate(self, kind, path, info):
        return None

    def mp4_edit_lists(self, path):
        return self.edit_lists and not str(path).endswith('.tmp.mp4')

    # publishers: each writes its state file the way the real one does
    def youtube_publish(self, video_path, lesson, **kw):
        self.calls.append(('youtube', kw))
        state = Path(kw['state_path'])
        data = json.loads(state.read_text()) if state.exists() else {}
        if (data.get('youtube') or {}).get('status') == 'published':
            return {'status': 'published', 'already_published': True, **data['youtube'], 'warnings': []}
        data['youtube'] = {'status': 'published', 'video_id': 'VID1', 'url': 'https://www.youtube.com/shorts/VID1',
                           'privacy_status': 'private'}
        state.write_text(json.dumps(data))
        self.videos['VID1'] = kw['publish_at']
        return {'status': 'published', 'video_id': 'VID1', 'url': 'https://www.youtube.com/shorts/VID1',
                'privacy_status': 'private', 'thumbnail': {'status': 'set'}, 'warnings': []}

    def youtube_status(self, video_id):
        self.calls.append(('youtube_status', video_id))
        if self.yt_status_override is not None:
            return dict(self.yt_status_override)
        publish_at = self.videos.get(video_id)
        if publish_at and self._now < pr.parse_moment(publish_at):
            return {'found': True, 'upload_status': 'processed', 'privacy_status': 'private',
                    'publish_at': publish_at.replace('Z', '.000Z')}
        return {'found': True, 'upload_status': 'processed', 'privacy_status': 'public', 'publish_at': None}

    def instagram_publish(self, video_path, lesson, **kw):
        self.calls.append(('instagram', kw))
        state = Path(kw['state_path'])
        data = json.loads(state.read_text()) if state.exists() else {}
        if data.get('media_id'):
            return {'status': 'already_published', 'media_id': data['media_id'], 'permalink': data['permalink']}
        state.write_text(json.dumps({'status': 'published', 'media_id': 'IG1',
                                     'permalink': 'https://www.instagram.com/reel/ABC/'}))
        if self.ig_crash_after_post:
            raise RuntimeError('connection dropped after media_publish')
        return {'status': 'published', 'media_id': 'IG1', 'permalink': 'https://www.instagram.com/reel/ABC/',
                'collaborators': ['hammadagentic.ai'], 'warnings': []}

    def linkedin_publish(self, video_path, lesson, **kw):
        self.calls.append(('linkedin', kw))
        state = Path(kw['state_path'])
        data = json.loads(state.read_text()) if state.exists() else {}
        if data.get('status') == 'published':
            return {'status': 'already_published', 'post_urn': data['post_urn'], 'post_url': data['post_url']}
        if self.li_uncertain and not kw.get('confirm_not_posted'):
            state.write_text(json.dumps({'post_attempt': {'at': '2026-10-19T12:00:05Z'}}))
            raise UncertainPostError('A LinkedIn post request ended without a clear answer')
        urn = 'urn:li:share:1'
        state.write_text(json.dumps({'status': 'published', 'post_urn': urn,
                                     'post_url': f'https://www.linkedin.com/feed/update/{urn}/'}))
        return {'status': 'published', 'post_urn': urn, 'post_url': f'https://www.linkedin.com/feed/update/{urn}/',
                'warnings': []}

    def posts(self):
        return [c for c in self.calls if c[0] in ('youtube', 'instagram', 'linkedin')]


def at(text):
    return pr.parse_moment(text)


@pytest.fixture
def env(tmp_path, monkeypatch):
    jobs = tmp_path / 'jobs'
    monkeypatch.setattr(pr, 'JOBS_ROOT', jobs)
    monkeypatch.setattr(pr, 'SCHEDULE_PATH', tmp_path / 'schedule.json')
    monkeypatch.setattr(pr, 'SCHEDULE_MD', tmp_path / 'SCHEDULE.md')
    monkeypatch.setattr(pr, 'SITE_DIR', tmp_path / 'site' / 'withhammad-rebuild')

    def make_job(jid='job1', seo_applied=True, seo=SEO):
        jdir = jobs / jid
        (jdir / 'seo').mkdir(parents=True)
        for name in pr.VIDEO_FILES:
            (jdir / name).write_bytes(b'\x00\x00\x00\x18ftypmp42' + name.encode() * 50)
        for name in pr.COVERS:
            (jdir / name).write_bytes(b'\xff\xd8\xff\xe0' + b'cover' * 100)
        lesson = lesson_doc()
        if seo_applied:
            lesson = pr.seo_lesson(lesson, seo)
        (jdir / 'lesson.json').write_text(json.dumps(lesson))
        (jdir / 'seo' / 'seo.json').write_text(json.dumps(seo))
        return jdir

    def schedule(entries=(), history=()):
        data = pr.empty_schedule()
        data['queue'], data['history'] = list(entries), list(history)
        pr.save_schedule(data)
        return data

    videos = {}
    return {'tmp': tmp_path, 'make_job': make_job, 'schedule': schedule, 'videos': videos,
            'rt': lambda now='2026-10-18T09:00:00Z': FakeRuntime(at(now), tmp_path / 'site' / 'withhammad-rebuild',
                                                                 videos)}


def queued(env, jid='job1', date='2026-10-19'):
    """A job queued live on date (YouTube scheduled, IG media hosted)."""
    env['make_job'](jid)
    env['schedule']([{'date': date, 'job': jid, 'status': 'planned'}])
    rt = env['rt']()
    result = pr.queue(jid, date, live=True, rt=rt)
    assert result['status'] == 'queued', result
    return rt


# ---------------------------------------------------------------- slots

def test_slots_match_the_best_times_worked_example():
    got = {p: v['utc'] for p, v in pr.day_slots('2026-10-19').items()}
    assert got == {'youtube': '2026-10-19T08:00:00Z', 'linkedin': '2026-10-19T12:00:00Z',
                   'instagram': '2026-10-19T13:00:00Z', 'tiktok': '2026-10-19T13:00:00Z',
                   'facebook': '2026-10-19T13:00:00Z', 'x': '2026-10-19T14:00:00Z'}


def test_friday_moves_youtube_to_10_and_weekend_moves_linkedin_to_10():
    assert pr.slot_utc('youtube', '2026-10-23') == dt.datetime(2026, 10, 23, 6, 0, tzinfo=UTC)   # Fri 10:00 GST
    assert pr.slot_utc('linkedin', '2026-10-23') == dt.datetime(2026, 10, 23, 12, 0, tzinfo=UTC)  # Fri stays 16:00
    assert pr.slot_utc('youtube', '2026-10-22') == dt.datetime(2026, 10, 22, 8, 0, tzinfo=UTC)   # Thu noon
    for day in ('2026-10-24', '2026-10-25'):                                                      # Sat, Sun
        assert pr.slot_time('linkedin', day) == '10:00'
        assert pr.slot_utc('linkedin', day).hour == 6
        assert pr.slot_time('youtube', day) == '12:00'
    assert pr.slot_time('instagram', '2026-10-24') == pr.slot_time('instagram', '2026-10-19') == '17:00'
    assert pr.slot_time('x', '2026-10-25') == '18:00'


def test_backups_and_gst_offset():
    assert pr.slot_time('youtube', '2026-10-23', backup=True) == '09:00'
    assert pr.slot_time('youtube', '2026-10-19', backup=True) == '14:00'
    assert pr.slot_time('linkedin', '2026-10-19', backup=True) == '11:00'
    with pytest.raises(pr.ReelError):
        pr.slot_time('linkedin', '2026-10-24', backup=True)    # no weekend backup in BEST_TIMES.md
    local = pr.slot_local('x', '2026-10-19')
    assert local.utcoffset() == dt.timedelta(hours=4)
    assert (local.hour, pr.slot_utc('x', '2026-10-19').hour) == (18, 14)
    # a naive --now is GST, the Mac's clock
    assert pr.parse_moment('2026-10-19T17:00') == dt.datetime(2026, 10, 19, 13, 0, tzinfo=UTC)
    # a slot on a GST date can fall on the previous UTC day: 00:00-03:59 GST
    assert pr.gst() is not None


# ---------------------------------------------------------------- SEO merge

def test_apply_seo_merges_captions_and_keeps_pre_seo_once(env):
    jdir = env['make_job'](seo_applied=False)
    original = (jdir / 'lesson.json').read_text()
    result = pr.apply_seo('job1')
    assert set(result['changed']) == {'captions.instagram', 'captions.youtube_title', 'captions.youtube_description',
                                      'captions.tiktok', 'captions.linkedin', 'hashtags'}
    assert result['pre_seo_created']
    lesson = json.loads((jdir / 'lesson.json').read_text())
    assert lesson['captions']['instagram'] == SEO['instagram']['caption']
    assert lesson['captions']['youtube_title'] == SEO['youtube']['title']
    assert lesson['captions']['youtube_description'] == SEO['youtube']['description']
    assert lesson['captions']['tiktok'] == SEO['tiktok']['caption']
    assert lesson['captions']['linkedin'] == SEO['linkedin']['text']
    assert lesson['hashtags'] == [f'tag {i}' for i in range(8)]       # schema max 8, deduped, YouTube tags
    assert lesson['cover'] == lesson_doc()['cover']                    # nothing else touched
    assert (jdir / 'lesson.pre_seo.json').read_text() == original
    # a second run changes nothing and never overwrites the pre-SEO copy
    seo2 = dict(SEO, linkedin={'text': 'Newer LinkedIn copy'})
    (jdir / 'seo' / 'seo.json').write_text(json.dumps(seo2))
    again = pr.apply_seo('job1')
    assert again['changed'] == ['captions.linkedin'] and not again['pre_seo_created']
    assert (jdir / 'lesson.pre_seo.json').read_text() == original
    assert pr.apply_seo('job1')['changed'] == []


def test_apply_seo_dry_run_writes_nothing(env):
    jdir = env['make_job'](seo_applied=False)
    before = (jdir / 'lesson.json').read_text()
    assert pr.apply_seo('job1', write=False)['changed']
    assert (jdir / 'lesson.json').read_text() == before
    assert not (jdir / 'lesson.pre_seo.json').exists()


# ---------------------------------------------------------------- check

def test_check_passes_a_ready_reel(env):
    env['make_job']()
    assert pr.check('job1', rt=env['rt']()) == []


def test_check_lists_every_blocker(env):
    jdir = env['make_job'](seo_applied=False, seo={k: v for k, v in SEO.items() if k != 'x'})
    (jdir / 'final_social.mp4').unlink()
    (jdir / 'cover_720x1280.jpg').write_bytes(b'PNG')
    (jdir / 'published.json').write_text(json.dumps({'tiktok': {'url': 'https://www.tiktok.com/@a/video/1'}}))
    rt = env['rt']()
    rt.statuses[RESOURCE] = 404
    text = '\n'.join(pr.check('job1', rt=rt))
    assert 'final_social.mp4 is missing' in text
    assert 'cover_720x1280.jpg is not a JPEG' in text
    assert 'no x.post' in text
    assert 'apply-seo' in text
    assert 'HTTP 404' in text
    assert 'already records tiktok' in text


def test_check_flags_a_publisher_state_that_already_posted(env):
    jdir = env['make_job']()
    (jdir / 'publish_linkedin.json').write_text(json.dumps({'status': 'published', 'post_urn': 'urn:li:share:9'}))
    assert any('linkedin was already posted' in b for b in pr.check('job1', rt=env['rt']()))


def test_x_weighted_length_counts_urls_as_23():
    assert pr.x_weighted_length('hi https://withhammad.com/resources/a-very-long-slug-indeed') == 3 + 23
    assert pr.x_weighted_length('withhammad.com/resources') == 23
    assert pr.x_weighted_length('ش') == 1 and pr.x_weighted_length('\U0001F680') == 2


# ---------------------------------------------------------------- queue

def test_one_reel_per_day_refuses_a_second_job_on_a_held_date(env):
    env['make_job']('job1')
    env['make_job']('job2')
    env['schedule']([{'date': '2026-10-19', 'job': 'job1', 'status': 'planned'}],
                    history=[{'date': '2026-10-18', 'jobs': ['a', 'b'], 'keyword': 'SKILL', 'status': 'published'}])
    rt = env['rt']()
    with pytest.raises(pr.ReelError, match='one reel per day'):
        pr.queue('job2', '2026-10-19', live=True, rt=rt)
    with pytest.raises(pr.ReelError, match='one reel per day'):
        pr.queue('job2', '2026-10-18', live=True, rt=rt)
    assert rt.posts() == [] and not [c for c in rt.calls if c[0] == 'run']


def test_queue_refuses_with_blockers_and_sends_nothing(env):
    env['make_job'](seo_applied=False)
    env['schedule']()
    rt = env['rt']()
    result = pr.queue('job1', '2026-10-19', live=True, rt=rt)
    assert result['status'] == 'refused' and any('apply-seo' in b for b in result['blockers'])
    assert rt.posts() == [] and pr.load_schedule()['queue'] == []


def test_queue_refuses_a_youtube_slot_too_close(env):
    env['make_job']()
    env['schedule']()
    # 11:45 GST Mon: noon is 15 min away, so the day's backup (14:00 GST) is used (BEST_TIMES.md)
    plan = pr.queue('job1', '2026-10-19', rt=env['rt']('2026-10-19T07:45:00Z'))
    yt = plan['entry']['platforms']['youtube']
    assert yt['publish_at'] == yt['slot_utc'] == '2026-10-19T10:00:00Z' and yt['slot'] == 'backup'
    # 13:45 GST: the backup is 15 min away too
    with pytest.raises(pr.ReelError, match='less than 30 minutes'):
        pr.queue('job1', '2026-10-19', rt=env['rt']('2026-10-19T09:45:00Z'))


def test_queue_dry_run_sends_and_writes_nothing(env):
    env['make_job']()
    env['schedule']([{'date': '2026-10-19', 'job': 'job1', 'status': 'planned'}])
    before = pr.SCHEDULE_PATH.read_text()
    rt = env['rt']()
    result = pr.queue('job1', '2026-10-19', rt=rt)
    assert result['status'] == 'planned' and result['dry_run']
    assert result['entry']['platforms']['youtube']['publish_at'] == '2026-10-19T08:00:00Z'
    assert [c[0] for c in rt.calls] == ['get']          # only the resource-page check
    assert pr.SCHEDULE_PATH.read_text() == before
    assert not pr.SITE_DIR.exists()


def test_queue_live_schedules_youtube_hosts_ig_media_and_records_slots(env):
    rt = queued(env)
    jdir = pr.JOBS_ROOT / 'job1'
    yt = [c[1] for c in rt.calls if c[0] == 'youtube']
    assert len(yt) == 1
    assert yt[0]['privacy_status'] == 'private' and yt[0]['publish_at'] == '2026-10-19T08:00:00Z'
    assert yt[0]['dry_run'] is False and yt[0]['contains_synthetic_media'] is True
    assert Path(yt[0]['thumbnail_path']).name == 'cover_1080x1920.jpg'
    runs = [c[1] for c in rt.calls if c[0] == 'run']
    assert runs[0][:2] == ['git', 'clone']
    assert ['git', 'pull', '--rebase'] in runs
    commit = next(r for r in runs if r[:2] == ['git', 'commit'])
    assert commit[3] == 'Host the ROADMAP reel video and cover for Instagram API publishing'
    assert commit[5] == pr.COMMIT_TRAILER
    assert ['git', 'push', 'origin', 'HEAD:main'] in runs
    assert (pr.SITE_DIR / f'public/media/reels/{SLUG}.mp4').read_bytes() == (jdir / 'final_ig.mp4').read_bytes()
    assert (pr.SITE_DIR / f'public/media/covers/{SLUG}.jpg').exists()
    entry = pr.load_schedule()['queue'][0]
    p = entry['platforms']
    assert entry['status'] == 'queued'
    assert p['youtube']['status'] == 'scheduled' and p['youtube']['video_id'] == 'VID1'
    assert p['linkedin'] == {'via': 'api', 'status': 'pending', 'slot_utc': '2026-10-19T12:00:00Z',
                             'local_time': 'Mon 2026-10-19 16:00 GST'}
    assert p['instagram']['status'] == 'pending' and p['instagram']['hosted'] is True
    assert p['instagram']['video_url'] == f'https://withhammad.com/media/reels/{SLUG}.mp4'
    assert p['instagram']['site_commit'] == 'abc1234'
    assert p['tiktok']['status'] == 'composer' and p['tiktok']['local_time'] == 'Mon 2026-10-19 17:00 GST'
    assert '#aiengineer' in p['tiktok']['text'] and p['tiktok']['pinned_comment']
    assert p['x']['local_time'] == 'Mon 2026-10-19 18:00 GST' and p['x']['text'] == SEO['x']['post']
    published = json.loads((jdir / 'published.json').read_text())
    assert published['youtube']['video_id'] == 'VID1' and 'publishAt' in published['youtube']['privacy']
    # rerunning the same queue is a no-op for YouTube (already scheduled) and hosting (already hosted)
    rt2 = env['rt']()
    assert pr.queue('job1', '2026-10-19', live=True, rt=rt2)['status'] == 'queued'
    assert rt2.posts() == [] and not [c for c in rt2.calls if c[0] == 'run']


def test_check_blocks_a_final_ig_with_edit_lists_and_hosting_never_remuxes(env):
    """The hosted file must be final_ig.mp4 byte for byte: publish_instagram compares the hosted size with it."""
    jdir = env['make_job']()
    env['schedule']()
    rt = env['rt']()
    rt.edit_lists = True
    assert any('edit lists' in b and 'app.exports' in b for b in pr.check('job1', rt=rt))
    result = pr.queue('job1', '2026-10-19', live=True, rt=rt)
    assert result['status'] == 'refused' and rt.posts() == []
    assert not [c for c in rt.calls if c[0] == 'run']
    with pytest.raises(pr.ReelError, match='edit lists'):
        pr.host_instagram_media(jdir, SLUG, KEYWORD, rt)
    assert not [c for c in rt.calls if c[0] == 'run']


def test_hosting_waits_for_the_right_size(env):
    jdir = env['make_job']()
    rt = env['rt']()
    url = f'https://withhammad.com/media/reels/{SLUG}.mp4'
    rt.head_override[url] = (200, 1)            # a stale deploy: wrong length
    with pytest.raises(pr.ReelError, match='expected 200'):
        pr.host_instagram_media(jdir, SLUG, KEYWORD, rt)
    assert ('sleep', pr.HOST_POLL_SECONDS) in rt.calls


# ---------------------------------------------------------------- run-due

def test_run_due_before_any_slot_does_nothing(env):
    queued(env)
    rt = env['rt']('2026-10-19T07:59:00Z')      # before YouTube's noon GST, the first slot of the day
    result = pr.run_due(live=True, rt=rt)
    assert result == {'now': '2026-10-19T07:59:00Z', 'dry_run': False, 'results': [], 'exit_code': 0}
    assert rt.calls == []
    later = pr.run_due(live=True, rt=env['rt']('2026-10-19T11:59:00Z'), platforms=['linkedin', 'instagram'])
    assert later['results'] == [] and later['exit_code'] == 0


def test_run_due_posts_once_and_a_second_run_posts_nothing(env):
    queued(env)
    rt = env['rt']('2026-10-19T13:05:00Z')
    first = pr.run_due(live=True, rt=rt)
    assert first['exit_code'] == 0
    assert {(r['platform'], r['action']) for r in first['results']} == {('linkedin', 'posted'),
                                                                         ('instagram', 'posted'),
                                                                         ('youtube', 'confirmed_public')}
    ig = next(c[1] for c in rt.calls if c[0] == 'instagram')
    assert ig['expected_username'] == 'with.hammad' and ig['ai_generated'] is True
    assert ig['url_provider'] == f'https://withhammad.com/media/reels/{SLUG}.mp4'
    assert ig['cover_url'] == f'https://withhammad.com/media/covers/{SLUG}.jpg'
    li = next(c[1] for c in rt.calls if c[0] == 'linkedin')
    assert Path(li['thumbnail_path']).name == 'cover_720x1280.jpg' and li['confirm_not_posted'] is False
    ig_result = next(r for r in first['results'] if r['platform'] == 'instagram')
    assert any('ManyChat' in f and KEYWORD in f for f in ig_result['followups'])
    published = json.loads((pr.JOBS_ROOT / 'job1' / 'published.json').read_text())
    assert published['instagram']['media_id'] == 'IG1'
    assert published['instagram']['collaborators_invited'] == ['hammadagentic.ai']
    assert published['linkedin']['post_urn'] == 'urn:li:share:1'
    assert published['youtube']['video_id'] == 'VID1' and published['youtube']['privacy'] == 'public'
    rt2 = env['rt']('2026-10-19T13:30:00Z')
    second = pr.run_due(live=True, rt=rt2)
    assert second['results'] == [] and second['exit_code'] == 0
    assert rt2.posts() == []


def test_run_due_only_posts_what_is_due(env):
    queued(env)
    rt = env['rt']('2026-10-19T12:10:00Z')     # LinkedIn's 16:00 passed, Instagram's 17:00 not yet
    result = pr.run_due(live=True, rt=rt, platforms=['linkedin', 'instagram'])
    assert [(r['platform'], r['action']) for r in result['results']] == [('linkedin', 'posted')]
    assert [c[0] for c in rt.posts()] == ['linkedin']


def test_run_due_marks_a_late_slot_missed_instead_of_posting(env):
    queued(env)
    rt = env['rt']('2026-10-19T19:30:00Z')     # 7.5 h after LinkedIn, 6.5 h after Instagram
    result = pr.run_due(live=True, rt=rt, platforms=['linkedin', 'instagram'])
    assert {r['action'] for r in result['results']} == {'missed'}
    assert result['exit_code'] == 2 and rt.posts() == []
    p = pr.load_schedule()['queue'][0]['platforms']
    assert p['linkedin']['status'] == p['instagram']['status'] == 'missed'
    assert pr.run_due(live=True, rt=env['rt']('2026-10-19T20:00:00Z'), platforms=['linkedin'])['results'] == []


def test_run_due_dry_run_sends_and_writes_nothing(env):
    queued(env)
    before = pr.SCHEDULE_PATH.read_text()
    rt = env['rt']('2026-10-19T13:05:00Z')
    result = pr.run_due(rt=rt)
    assert {(r['platform'], r['action']) for r in result['results']} == {
        ('linkedin', 'would_post'), ('instagram', 'would_post'), ('youtube', 'would_confirm_public')}
    assert rt.calls == [] and pr.SCHEDULE_PATH.read_text() == before


def test_a_crash_after_posting_is_recorded_not_posted_again(env):
    queued(env)
    rt = env['rt']('2026-10-19T13:05:00Z')
    rt.ig_crash_after_post = True
    first = pr.run_due(live=True, rt=rt, platforms=['instagram'])
    assert first['results'][0]['action'] == 'failed' and first['exit_code'] == 1
    rt2 = env['rt']('2026-10-19T13:20:00Z')
    second = pr.run_due(live=True, rt=rt2, platforms=['instagram'])
    assert second['results'][0]['action'] == 'recorded' and rt2.posts() == []
    entry = pr.load_schedule()['queue'][0]['platforms']['instagram']
    assert entry['status'] == 'published' and entry['url'] == 'https://www.instagram.com/reel/ABC/'


def test_an_uncertain_linkedin_post_waits_for_the_owner(env):
    queued(env)
    rt = env['rt']('2026-10-19T12:05:00Z')
    rt.li_uncertain = True
    result = pr.run_due(live=True, rt=rt, platforms=['linkedin'])
    assert result['results'][0]['action'] == 'uncertain' and result['exit_code'] == 1
    rt2 = env['rt']('2026-10-19T12:20:00Z')
    rt2.li_uncertain = True
    assert pr.run_due(live=True, rt=rt2, platforms=['linkedin'])['results'][0]['action'] == 'uncertain'
    # past the late limit an unknown outcome is never turned into "missed"
    rt3 = env['rt']('2026-10-19T19:00:00Z')
    assert pr.run_due(live=True, rt=rt3, platforms=['linkedin'])['results'][0]['action'] == 'uncertain'
    assert not [c for c in rt3.calls if c[0] == 'linkedin']
    # the owner checked the profile: --confirm-not-posted linkedin (inside the window)
    rt4 = env['rt']('2026-10-19T12:40:00Z')
    rt4.li_uncertain = True
    done = pr.run_due(live=True, rt=rt4, platforms=['linkedin'], confirm_not_posted=('linkedin',))
    assert done['results'][0]['action'] == 'posted'
    assert next(c[1] for c in rt4.calls if c[0] == 'linkedin')['confirm_not_posted'] is True


def test_run_due_refuses_when_seo_copy_was_reverted(env):
    queued(env)
    jdir = pr.JOBS_ROOT / 'job1'
    (jdir / 'lesson.json').write_text(json.dumps(lesson_doc()))
    result = pr.run_due(live=True, rt=env['rt']('2026-10-19T12:05:00Z'), platforms=['linkedin'])
    assert result['results'][0]['action'] == 'failed' and 'apply-seo' in result['results'][0]['message']


# ---------------------------------------------------------------- mark, status, render

def test_mark_records_a_chrome_post(env):
    queued(env)
    rt = env['rt']('2026-10-19T13:10:00Z')
    with pytest.raises(pr.ReelError, match='not an https tiktok URL'):
        pr.mark('job1', 'tiktok', 'https://example.com/video/1', rt=rt)
    out = pr.mark('job1', 'tiktok', 'https://www.tiktok.com/@hammadyousuf01/video/1', rt=rt)
    assert out['status'] == 'published'
    entry = pr.load_schedule()['queue'][0]['platforms']['tiktok']
    assert entry['url'].endswith('/video/1')
    published = json.loads((pr.JOBS_ROOT / 'job1' / 'published.json').read_text())
    assert published['tiktok'] == {'url': 'https://www.tiktok.com/@hammadyousuf01/video/1', 'via': 'chrome',
                                   'ai_label': True, 'cover': 'custom upload', 'posted_at': '2026-10-19'}
    pr.mark('job1', 'x', 'https://x.com/HammadYousufAI/status/2', scheduled=True, rt=rt)
    assert pr.load_schedule()['queue'][0]['platforms']['x']['status'] == 'composer_scheduled'


def test_status_and_render_md(env):
    queued(env)
    schedule = pr.load_schedule()
    text = pr.format_status(schedule, at('2026-10-19T09:00:00Z'))
    assert 'job1' in text and 'sched' in text
    assert 'Next due: linkedin for ROADMAP at Mon 2026-10-19 16:00 GST (2026-10-19T12:00:00Z)' in text
    md = pr.render_md(schedule)
    assert '| 2026-10-19 | Mon |' in md and '16:00 pending' in md
    assert '| YouTube Shorts | 12:00 (Fri 10:00) | 12:00 | 14:00 (Fri 09:00) |' in md
    assert '| LinkedIn | 16:00 | 10:00 | 11:00 weekdays |' in md


def test_cli_run_due_exit_code_zero_when_nothing_is_due(env, capsys):
    queued(env)
    code = pr.main(['run-due', '--now', '2026-10-19T11:00'], rt=env['rt']('2026-10-19T07:00:00Z'))  # 11:00 GST
    assert code == 0
    assert json.loads(capsys.readouterr().out)['results'] == []


def test_tracked_schedule_and_slots_are_consistent():
    schedule = json.loads((Path(pr.__file__).resolve().parents[2] / 'outputs/video-pipeline/schedule.json').read_text())
    dates = [e['date'] for e in schedule['history'] + schedule['queue']]
    assert len(dates) == len(set(dates)), 'two reels on one day'
    slots = pr.load_slots()
    assert set(slots['platforms']) == set(pr.PLATFORMS) and slots['order'] == list(pr.PLATFORMS)


# ---------------------------------------------------------------- review findings (one test or more each)

def test_mark_scheduled_on_linkedin_or_instagram_hands_the_slot_to_chrome(env):
    queued(env)
    rt = env['rt']('2026-10-19T09:00:00Z')
    pr.mark('job1', 'linkedin', 'https://www.linkedin.com/feed/update/urn:li:share:7/', scheduled=True, rt=rt)
    pr.mark('job1', 'instagram', 'https://www.instagram.com/p/SCHED/', scheduled=True, rt=rt)
    p = pr.load_schedule()['queue'][0]['platforms']
    assert p['linkedin']['via'] == p['instagram']['via'] == 'composer'
    rt2 = env['rt']('2026-10-19T13:05:00Z')
    result = pr.run_due(live=True, rt=rt2, platforms=['linkedin', 'instagram'])
    assert result['results'] == [] and result['exit_code'] == 0
    assert rt2.posts() == []
    p = pr.load_schedule()['queue'][0]['platforms']
    assert p['linkedin']['url'].endswith('urn:li:share:7/') and p['instagram']['url'].endswith('/p/SCHED/')


def test_mark_scheduled_refuses_a_platform_the_api_already_posted(env):
    queued(env)
    pr.run_due(live=True, rt=env['rt']('2026-10-19T12:05:00Z'), platforms=['linkedin'])
    with pytest.raises(pr.ReelError, match='already'):
        pr.mark('job1', 'linkedin', 'https://www.linkedin.com/feed/update/urn:li:share:9/', scheduled=True,
                rt=env['rt']('2026-10-19T12:10:00Z'))


def test_a_commit_whose_push_failed_is_pushed_on_the_rerun(env):
    jdir = env['make_job']()
    rt = env['rt']()
    rt.push_failures = 3                       # every attempt of the first run is rejected
    with pytest.raises(pr.ReelError, match='push'):
        pr.host_instagram_media(jdir, SLUG, KEYWORD, rt)
    assert rt.ahead == 1
    rt2 = env['rt']()
    rt2.ahead = 1                              # the local clone still holds that commit
    rt2.clean_tree = True                      # nothing new to commit this time
    hosted = pr.host_instagram_media(jdir, SLUG, KEYWORD, rt2)
    runs = [c[1] for c in rt2.calls if c[0] == 'run']
    assert ['git', 'push', 'origin', 'HEAD:main'] in runs and not [r for r in runs if r[:2] == ['git', 'commit']]
    assert hosted['site_commit'] == 'abc1234' and rt2.ahead == 0


def test_a_rejected_push_is_retried_after_pull_rebase(env):
    jdir = env['make_job']()
    rt = env['rt']()
    rt.push_failures = 1                       # another session pushed between our pull and push
    pr.host_instagram_media(jdir, SLUG, KEYWORD, rt)
    runs = [c[1][:3] for c in rt.calls if c[0] == 'run']
    pushes = [i for i, r in enumerate(runs) if r[:2] == ['git', 'push']]
    assert len(pushes) == 2 and runs[pushes[0] + 1] == ['git', 'pull', '--rebase']


def _sh(*cmd, cwd=None):
    import subprocess
    return subprocess.run([str(c) for c in cmd], cwd=cwd, check=True, capture_output=True, text=True).stdout


def test_real_git_rerun_pushes_a_stranded_commit(tmp_path):
    """Real git and a local bare remote whose pre-receive hook rejects pushes while BLOCK exists (offline)."""
    remote, seed, site, block = tmp_path / 'remote.git', tmp_path / 'seed', tmp_path / 'site', tmp_path / 'BLOCK'
    _sh('git', 'init', '--bare', '-b', 'main', remote)
    _sh('git', 'clone', remote, seed)
    (seed / 'README').write_text('site\n')
    _sh('git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', 'README', cwd=seed)
    _sh('git', '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-m', 'init', cwd=seed)
    _sh('git', 'push', 'origin', 'HEAD:main', cwd=seed)
    hook = remote / 'hooks' / 'pre-receive'
    hook.write_text(f'#!/bin/sh\nif [ -f "{block}" ]; then echo "rejected" >&2; exit 1; fi\nexit 0\n')
    hook.chmod(0o755)
    _sh('git', 'clone', remote, site)
    _sh('git', 'config', 'user.name', 't', cwd=site)
    _sh('git', 'config', 'user.email', 't@t', cwd=site)
    jdir = tmp_path / 'job'
    jdir.mkdir()
    (jdir / 'final_ig.mp4').write_bytes(b'\x00\x00\x00\x18ftypmp42' + b'video' * 1000)
    (jdir / 'cover_1080x1920.jpg').write_bytes(b'\xff\xd8\xff\xe0' + b'cover' * 100)

    class GitRuntime(pr.Runtime):
        def __init__(self):
            self.cmds = []

        def sleep(self, seconds):
            pass

        def run(self, cmd, cwd=None):
            self.cmds.append([str(c) for c in cmd])
            return super().run(cmd, cwd=cwd)

        def mp4_edit_lists(self, path):
            return False

        def http_head(self, url):        # what the remote's main serves = what a deploy would serve
            import subprocess
            rel = 'public/' + url.split('withhammad.com/', 1)[1]
            out = subprocess.run(['git', '--git-dir', str(remote), 'cat-file', '-s', f'main:{rel}'],
                                 capture_output=True, text=True)
            return (200, int(out.stdout)) if out.returncode == 0 else (404, None)

    block.write_text('x')
    with pytest.raises(pr.ReelError, match='push'):
        pr.host_instagram_media(jdir, 'review-slug', KEYWORD, GitRuntime(), site_dir=site)
    block.unlink()
    rt = GitRuntime()
    hosted = pr.host_instagram_media(jdir, 'review-slug', KEYWORD, rt, site_dir=site)
    assert [c for c in rt.cmds if c[:2] == ['git', 'push']]
    assert _sh('git', 'rev-list', '--count', 'origin/main..HEAD', cwd=site).strip() == '0'
    assert hosted['video_bytes'] == (jdir / 'final_ig.mp4').stat().st_size and hosted['site_commit']


class CrashAfterYouTubeState(FakeRuntime):
    """The publisher saved {status: published, video_id} and then the process died (Ctrl-C, kill, sleep)."""

    def youtube_publish(self, video_path, lesson, **kw):
        super().youtube_publish(video_path, lesson, **kw)
        raise KeyboardInterrupt


def test_queue_resumes_after_a_crash_between_the_youtube_state_and_schedule_json(env):
    env['make_job']()
    env['schedule']([{'date': '2026-10-19', 'job': 'job1', 'status': 'planned'}])
    crash = CrashAfterYouTubeState(at('2026-10-18T09:00:00Z'), pr.SITE_DIR, env['videos'])
    with pytest.raises(KeyboardInterrupt):
        pr.queue('job1', '2026-10-19', live=True, rt=crash)
    entry = pr.load_schedule()['queue'][0]
    assert entry['status'] == 'queuing' and entry['platforms']['youtube']['status'] == 'pending'
    rt = env['rt']('2026-10-18T09:10:00Z')
    result = pr.queue('job1', '2026-10-19', live=True, rt=rt)
    assert result['status'] == 'queued', result
    assert [c for c in rt.calls if c[0] == 'youtube'] == []          # adopted, never uploaded again
    yt = pr.load_schedule()['queue'][0]['platforms']['youtube']
    assert yt['status'] == 'scheduled' and yt['video_id'] == 'VID1' and yt['adopted_from_state']
    assert yt['publish_at_verified'] is True
    assert pr.load_schedule()['queue'][0]['platforms']['instagram']['hosted'] is True


def test_run_due_live_refuses_a_given_now(env, capsys):
    queued(env)
    rt = env['rt']('2026-10-18T09:05:00Z')
    with pytest.raises(pr.ReelError, match='real clock'):
        pr.run_due(now='2026-10-19T13:05:00Z', live=True, rt=rt)
    assert pr.main(['run-due', '--now', '2026-10-19T13:05:00Z', '--live'], rt=rt) == 1
    assert pr.main(['run-due', '--now', '2026-10-19T23:00:00Z', '--live'], rt=rt) == 1
    assert rt.posts() == []
    p = pr.load_schedule()['queue'][0]['platforms']
    assert p['linkedin']['status'] == p['instagram']['status'] == 'pending'
    # --now still works for a dry run
    assert pr.main(['run-due', '--now', '2026-10-19T13:05:00Z'], rt=rt) == 0


def test_a_saved_upload_session_with_another_publish_at_is_never_resumed(env):
    """publish_youtube sends publishAt only when a session starts; a resumed session keeps the old one."""
    jdir = env['make_job']()
    env['schedule']([{'date': '2026-10-19', 'job': 'job1', 'status': 'queue_incomplete',
                      'platforms': {'youtube': {'via': 'api', 'status': 'failed', 'slot_utc': '2026-10-19T08:00:00Z',
                                                'error': 'upload interrupted'}}}])
    (jdir / 'publish_youtube.json').write_text(json.dumps({'youtube': {
        'status': 'uploading', 'upload_url': 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=X'}}))
    (jdir / pr.REEL_STATE).write_text(json.dumps({'youtube_session_publish_at': '2026-10-19T08:00:00Z'}))
    rt = env['rt']()
    result = pr.queue('job1', '2026-10-20', live=True, rt=rt)        # moved: nothing of it reached a platform
    assert result['status'] == 'queue_incomplete'
    assert [c for c in rt.calls if c[0] == 'youtube'] == []
    assert 'unfinished upload session' in result['errors'][0] and '2026-10-19T08:00:00Z' in result['errors'][0]
    entry = pr.load_schedule()['queue'][0]
    assert entry['date'] == '2026-10-20' and entry['platforms']['youtube']['status'] == 'failed'


def test_a_short_whose_publish_at_differs_is_recorded_failed(env):
    env['make_job']()
    env['schedule']()
    rt = env['rt']()
    rt.yt_status_override = {'found': True, 'upload_status': 'processed', 'privacy_status': 'private',
                             'publish_at': '2026-10-18T08:00:00.000Z'}
    result = pr.queue('job1', '2026-10-19', live=True, rt=rt)
    assert result['status'] == 'queue_incomplete'
    yt = pr.load_schedule()['queue'][0]['platforms']['youtube']
    assert yt['status'] == 'failed' and yt['video_id'] == 'VID1' and '2026-10-18T08:00:00' in yt['error']
    published = json.loads((pr.JOBS_ROOT / 'job1' / 'published.json').read_text())
    assert published['youtube']['privacy'].startswith('NOT as scheduled')


def test_confirm_not_posted_past_the_limit_marks_the_slot_missed(env):
    queued(env)
    rt = env['rt']('2026-10-19T12:05:00Z')
    rt.li_uncertain = True
    assert pr.run_due(live=True, rt=rt, platforms=['linkedin'])['results'][0]['action'] == 'uncertain'
    # another job's confirmation does not apply
    other = pr.run_due(live=True, rt=env['rt']('2026-10-19T18:30:00Z'), platforms=['linkedin'],
                       confirm_not_posted=('job9:linkedin',))
    assert other['results'][0]['action'] == 'uncertain'
    rt2 = env['rt']('2026-10-19T18:30:00Z')
    out = pr.run_due(live=True, rt=rt2, platforms=['linkedin'], confirm_not_posted=('job1:linkedin',))
    assert out['results'][0]['action'] == 'missed' and out['exit_code'] == 2
    assert not [c for c in rt2.calls if c[0] == 'linkedin']
    li = pr.load_schedule()['queue'][0]['platforms']['linkedin']
    assert li['status'] == 'missed' and 'owner confirmed' in li['error']
    later = pr.run_due(live=True, rt=env['rt']('2026-10-25T09:00:00Z'), platforms=['linkedin'])
    assert later['results'] == [] and later['exit_code'] == 0


def test_an_instagram_publishing_attempt_past_the_limit_can_be_confirmed(env):
    queued(env)
    (pr.JOBS_ROOT / 'job1' / 'publish_instagram.json').write_text(json.dumps({'status': 'publishing'}))
    assert pr.run_due(live=True, rt=env['rt']('2026-10-19T21:00:00Z'),
                      platforms=['instagram'])['results'][0]['action'] == 'uncertain'
    assert pr.main(['run-due', '--live', '--platform', 'instagram', '--confirm-not-posted', 'job1:instagram'],
                   rt=env['rt']('2026-10-19T21:05:00Z')) == 2
    assert pr.load_schedule()['queue'][0]['platforms']['instagram']['status'] == 'missed'
    assert pr.main(['run-due', '--confirm-not-posted', 'tiktok'], rt=env['rt']()) == 1


def test_a_post_recovered_after_a_crash_keeps_its_followups(env):
    queued(env)
    rt = env['rt']('2026-10-19T13:05:00Z')
    rt.ig_crash_after_post = True
    pr.run_due(live=True, rt=rt, platforms=['instagram'])
    second = pr.run_due(live=True, rt=env['rt']('2026-10-19T13:20:00Z'), platforms=['instagram'])
    result = second['results'][0]
    assert result['action'] == 'recorded'
    assert any('ManyChat' in f and KEYWORD in f for f in result['followups'])
    assert any('Collab' in f for f in result['followups'])
    published = json.loads((pr.JOBS_ROOT / 'job1' / 'published.json').read_text())
    assert published['instagram']['collaborators_invited'] == ['hammadagentic.ai']
    assert published['instagram']['collab_status'] == 'invited, not yet accepted'


def test_a_rejected_or_late_short_fails_and_shows_as_overdue(env):
    queued(env)
    rt = env['rt']('2026-10-19T08:10:00Z')
    rt.yt_status_override = {'found': True, 'upload_status': 'uploaded', 'privacy_status': 'private',
                             'publish_at': '2026-10-19T08:00:00.000Z'}
    assert pr.run_due(live=True, rt=rt, platforms=['youtube'])['results'][0]['action'] == 'not_public_yet'
    rt2 = env['rt']('2026-10-19T09:00:00Z')
    rt2.yt_status_override = rt.yt_status_override
    late = pr.run_due(live=True, rt=rt2, platforms=['youtube'])
    assert late['results'][0]['action'] == 'not_public_late' and late['exit_code'] == 1
    assert 'Overdue: youtube' in pr.format_status(pr.load_schedule(), at('2026-10-19T09:00:00Z'))
    rt3 = env['rt']('2026-10-21T09:00:00Z')
    rt3.yt_status_override = {'found': True, 'upload_status': 'rejected', 'rejection_reason': 'duplicate',
                              'privacy_status': 'private'}
    rejected = pr.run_due(live=True, rt=rt3, platforms=['youtube'])
    assert rejected['results'][0]['action'] == 'failed' and rejected['exit_code'] == 1
    assert 'duplicate' in rejected['results'][0]['message']
    yt = pr.load_schedule()['queue'][0]['platforms']['youtube']
    assert yt['status'] == 'failed'
    assert 'Overdue: youtube' in pr.format_status(pr.load_schedule(), at('2026-10-21T09:00:00Z'))


def test_a_busy_lock_is_exit_75_not_a_failed_post(env):
    queued(env)
    with pr.schedule_lock():
        assert pr.main(['run-due', '--live'], rt=env['rt']('2026-10-19T12:05:00Z')) == pr.LOCK_BUSY_EXIT
        assert pr.main(['run-due'], rt=env['rt']('2026-10-19T12:05:00Z')) == pr.LOCK_BUSY_EXIT


class LockProbe(FakeRuntime):
    """Takes the schedule lock while queue waits for the deploy: proves hosting runs outside it."""

    def http_head(self, url):
        with pr.schedule_lock():
            self.calls.append(('lock_free_during_hosting', url))
        return super().http_head(url)


def test_queue_hosts_the_instagram_media_outside_the_schedule_lock(env):
    env['make_job']()
    env['schedule']()
    rt = LockProbe(at('2026-10-18T09:00:00Z'), pr.SITE_DIR, env['videos'])
    assert pr.queue('job1', '2026-10-19', live=True, rt=rt)['status'] == 'queued'
    assert [c for c in rt.calls if c[0] == 'lock_free_during_hosting']


class QuotaFailure(FakeRuntime):
    def youtube_publish(self, video_path, lesson, **kw):
        self.calls.append(('youtube', kw))
        raise RuntimeError('quotaExceeded: The request cannot be completed because you have exceeded your quota')


def test_a_youtube_failure_on_the_day_retries_at_the_backup_or_moves(env):
    env['make_job']()
    env['schedule']()
    fail = QuotaFailure(at('2026-10-19T06:00:00Z'), pr.SITE_DIR, env['videos'])      # Mon 10:00 GST
    assert pr.queue('job1', '2026-10-19', live=True, rt=fail)['status'] == 'queue_incomplete'
    # 11:40 GST: noon is too close, the 14:00 GST backup is not
    rt = env['rt']('2026-10-19T07:40:00Z')
    result = pr.queue('job1', '2026-10-19', live=True, rt=rt)
    assert result['status'] == 'queued', result
    yt_call = next(c[1] for c in rt.calls if c[0] == 'youtube')
    assert yt_call['publish_at'] == '2026-10-19T10:00:00Z'
    yt = pr.load_schedule()['queue'][0]['platforms']['youtube']
    assert yt['status'] == 'scheduled' and yt['slot_utc'] == '2026-10-19T10:00:00Z' and 'error' not in yt


def test_a_queue_incomplete_reel_with_nothing_posted_may_move_to_a_later_day(env):
    env['make_job']()
    env['schedule']()
    fail = QuotaFailure(at('2026-10-19T06:00:00Z'), pr.SITE_DIR, env['videos'])
    pr.queue('job1', '2026-10-19', live=True, rt=fail)
    moved = pr.queue('job1', '2026-10-23', live=True, rt=env['rt']('2026-10-19T09:50:00Z'))
    assert moved['status'] == 'queued'
    queue = pr.load_schedule()['queue']
    assert [e['date'] for e in queue] == ['2026-10-23']
    assert queue[0]['platforms']['youtube']['publish_at'] == '2026-10-23T06:00:00Z'      # Fri 10:00 GST
    # once something went out, it can no longer move
    pr.run_due(live=True, rt=env['rt']('2026-10-23T12:05:00Z'), platforms=['linkedin'])
    with pytest.raises(pr.ReelError, match='queued once'):
        pr.queue('job1', '2026-10-26', rt=env['rt']('2026-10-23T13:00:00Z'))


def test_run_due_warns_when_youtube_failed_for_that_reel(env):
    env['make_job']()
    env['schedule']()
    pr.queue('job1', '2026-10-19', live=True, rt=QuotaFailure(at('2026-10-19T06:00:00Z'), pr.SITE_DIR, env['videos']))
    result = pr.run_due(live=True, rt=env['rt']('2026-10-19T12:05:00Z'), platforms=['linkedin'])
    assert result['results'][0]['action'] == 'posted'
    assert any('YouTube for this reel is failed' in w for w in result['results'][0]['warnings'])


def test_weekend_queue_refuses_when_the_linkedin_slot_already_passed(env):
    env['make_job']()
    env['schedule']()
    with pytest.raises(pr.ReelError, match='linkedin slot Sat 2026-10-24 10:00 GST'):
        pr.queue('job1', '2026-10-24', rt=env['rt']('2026-10-24T07:20:00Z'))    # Sat 11:20 GST
    assert pr.queue('job1', '2026-10-24', rt=env['rt']('2026-10-24T05:00:00Z'))['status'] == 'planned'


def test_a_cancelled_entry_with_a_scheduled_short_still_holds_its_day(env):
    queued(env)
    schedule = pr.load_schedule()
    schedule['queue'][0]['status'] = 'cancelled'
    pr.save_schedule(schedule)
    env['make_job']('job2')
    with pytest.raises(pr.ReelError, match='one reel per day'):
        pr.queue('job2', '2026-10-19', live=True, rt=env['rt']())
    # a cancelled entry that never reached YouTube frees the day
    schedule['queue'][0]['platforms']['youtube'] = {'status': 'failed', 'slot_utc': '2026-10-19T08:00:00Z'}
    pr.save_schedule(schedule)
    assert pr.date_holder(pr.load_schedule(), '2026-10-19') is None


def test_a_late_instagram_waits_for_its_backup_slot(env):
    queued(env)
    rt = env['rt']('2026-10-19T14:30:00Z')                  # 18:30 GST: 17:00 + 60 min grace has passed
    waiting = pr.run_due(live=True, rt=rt, platforms=['instagram'])
    assert waiting['results'][0]['action'] == 'waiting_for_backup' and waiting['exit_code'] == 0
    assert waiting['results'][0]['backup_utc'] == '2026-10-19T16:00:00Z' and rt.posts() == []
    rt2 = env['rt']('2026-10-19T16:10:00Z')                 # 20:10 GST: the backup slot
    posted = pr.run_due(live=True, rt=rt2, platforms=['instagram'])
    assert posted['results'][0]['action'] == 'posted' and len(rt2.posts()) == 1
    assert pr.load_schedule()['queue'][0]['platforms']['instagram']['posted_at_backup'] == '2026-10-19T16:00:00Z'


def test_an_instagram_past_its_backup_window_is_missed(env):
    queued(env)
    rt = env['rt']('2026-10-19T17:30:00Z')                  # 21:30 GST: 20:00 + 60 min passed
    result = pr.run_due(live=True, rt=rt, platforms=['instagram'])
    assert result['results'][0]['action'] == 'missed' and rt.posts() == []


def test_check_blocks_copy_without_the_ai_disclosure_or_the_x_resource_link(env):
    seo = json.loads(json.dumps(SEO))
    for platform, field in (('x', 'post'), ('instagram', 'caption'), ('linkedin', 'text'), ('tiktok', 'caption'),
                            ('facebook', 'caption'), ('youtube', 'description')):
        seo[platform][field] = seo[platform][field].replace('AI avatar of me.', '').replace('AI avatar of Hammad.', '')
    seo['x']['post'] = 'FDE roadmap: free 6-week plan. #FDE'
    seo['checks'] = {'x': {'disclosure': {'ok': False, 'detail': 'no AI line'}},
                     'all': {'resource_url': {'ok': False, 'detail': '404 at pack time'}},
                     'youtube.title_len': {'ok': False, 'detail': '101 chars'}}
    env['make_job'](seo=seo)
    report = pr.check_report('job1', rt=env['rt']())
    text = '\n'.join(b['message'] for b in report['blockers'])
    assert 'x.post lacks "AI avatar of me"' in text and 'x.post lacks the resource link' in text
    for platform in ('instagram', 'linkedin', 'tiktok', 'facebook', 'youtube'):
        assert f'seo.json {platform}.' in text and 'no AI-avatar disclosure' in text
    assert 'checks.x.disclosure is not ok' in text
    assert any('youtube.title_len' in w for w in report['warnings'])
    assert not any('resource_url' in w for w in report['warnings'])     # superseded by the live check
