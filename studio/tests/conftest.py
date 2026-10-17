"""Every test runs with fake external tools unless it opts out by re-patching."""
import json

import pytest


def fake_runner_factory(calls):
    """Simulates yt-dlp, ffmpeg and ffprobe by creating the files they would create."""
    def runner(cmd, timeout):
        calls.append(cmd)
        if cmd[0] == 'yt-dlp':
            out = next(a for a in cmd if a.endswith('source.%(ext)s')).replace('%(ext)s', 'mp4')
            with open(out, 'wb') as fh:
                fh.write(b'fake-mp4')
            with open(out.replace('.mp4', '.info.json'), 'w') as fh:
                json.dump({'title': 'Ref', 'uploader': 'someone', 'duration': 42.0,
                           'description': 'd', 'webpage_url': cmd[-1]}, fh)
        elif cmd[0] == 'ffmpeg':
            with open(cmd[-1], 'wb') as fh:
                fh.write(b'fake-aac' * 10)
        elif cmd[0] == 'ffprobe':
            return '12.5\n'
        return ''
    return runner


@pytest.fixture(autouse=True)
def fake_tools(tmp_path, monkeypatch):
    from app import media
    calls = []
    monkeypatch.setattr(media, 'run', fake_runner_factory(calls))
    monkeypatch.setattr(media, 'JOBS_ROOT', tmp_path / 'jobs')
    monkeypatch.setattr(media, 'COOKIES_FILE', tmp_path / 'no-cookies.txt')
    monkeypatch.setattr(media, 'COOKIES_FROM_BROWSER', '')
    monkeypatch.setattr(media, 'transcribe_local', lambda audio: {
        'engine': 'faster-whisper:test', 'language': 'en', 'text': 'hello world from the reel ' * 4,
        'segments': [{'start': 0, 'end': 1.5, 'text': 'hello world from the reel'}] * 4})
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    from app import lesson
    monkeypatch.setattr(lesson, 'MODE', 'api')  # pipeline tests use the faked generate; agent mode has its own tests
    monkeypatch.setattr(lesson, 'generate', lambda intake, transcript, **kw: (
        {'language': 'en', 'topic_title': 'T', 'hook': 'h', 'key_takeaways': ['a', 'b'],
         'script': {'estimated_seconds': 50, 'segments': [{'spoken': 'one two', 'on_screen_text': 'x', 'visual': 'avatar'}] * 3},
         'demo_steps': [], 'prompts': [], 'tool_links': [],
         'captions': {k: 'c' for k in ('instagram', 'youtube_title', 'youtube_description', 'tiktok', 'linkedin')},
         'hashtags': [], 'manychat_keyword': 'TOPIC',
         'resource_page': {'slug': 'topic', 'title': 'T', 'body_markdown': 'b'},
         'sources_checked': [], 'originality_note': 'n'},
        {'model': 'fake', 'usage': {'input_tokens': 0, 'output_tokens': 0}, 'web_searches': 0, 'request_id': None}))
    monkeypatch.setenv('HEYGEN_API_KEY', 'test-key')  # pipeline tests use the faked API render
    from app import heygen
    monkeypatch.setattr(heygen, 'render', lambda job_id, script, title, folder, client=None, resume_video_id=None: {
        'video_id': 'vid_fake', 'look_id': 'look', 'look_name': 'Hammad Yousuf', 'voice_id': 'v', 'duration_s': 50.0,
        'video': str(folder / 'avatar.mp4'), 'subtitles': None, 'thumbnail_url': None, 'video_page_url': None})
    return calls
