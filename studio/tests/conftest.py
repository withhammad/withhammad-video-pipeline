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
        'engine': 'faster-whisper:test', 'language': 'en', 'text': 'hello world from the reel',
        'segments': [{'start': 0, 'end': 1.5, 'text': 'hello world from the reel'}]})
    monkeypatch.delenv('GROQ_API_KEY', raising=False)
    return calls
