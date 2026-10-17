"""Media acquisition and transcription helpers. All external work goes through subprocesses or
HTTP so the worker stays a thin orchestrator; every function is injectable for tests."""
import json
import os
import shutil
import subprocess
from pathlib import Path

import httpx

JOBS_ROOT = Path(os.environ.get('STUDIO_JOBS', '/data/jobs'))
COOKIES_FILE = Path(os.environ.get('STUDIO_COOKIES_FILE', '/secrets/instagram-cookies.txt'))
COOKIES_FROM_BROWSER = os.environ.get('STUDIO_COOKIES_FROM_BROWSER', '')  # e.g. 'chrome' on the Mac
GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
GROQ_MODEL = os.environ.get('STUDIO_GROQ_MODEL', 'whisper-large-v3-turbo')
LOCAL_MODEL = os.environ.get('STUDIO_WHISPER_MODEL', 'base')
MAX_GROQ_BYTES = 24 * 1024 * 1024  # free tier accepts 25 MB


def job_dir(job_id):
    path = JOBS_ROOT / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def run(cmd, timeout):
    process = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if process.returncode:
        tail = (process.stderr or process.stdout).strip().splitlines()[-3:]
        raise RuntimeError(f'{cmd[0]} failed (exit {process.returncode}): ' + ' | '.join(tail))
    return process.stdout


def download(url, target_dir, runner=None):
    """Fetch the reference video with yt-dlp into target_dir/source.mp4 and return its info."""
    runner = runner or run
    cmd = ['yt-dlp', '--no-playlist', '--no-warnings', '--quiet', '--write-info-json',
           '-f', 'bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
           '--merge-output-format', 'mp4', '-o', str(target_dir / 'source.%(ext)s')]
    if COOKIES_FILE.exists():
        cmd += ['--cookies', str(COOKIES_FILE)]
    elif COOKIES_FROM_BROWSER:
        cmd += ['--cookies-from-browser', COOKIES_FROM_BROWSER]
    cmd.append(url)
    runner(cmd, timeout=600)
    info_path = target_dir / 'source.info.json'
    info = json.loads(info_path.read_text()) if info_path.exists() else {}
    video = next((p for p in target_dir.glob('source.*') if p.suffix in ('.mp4', '.mkv', '.webm', '.mov')), None)
    if video is None:
        raise RuntimeError('yt-dlp produced no video file')
    return video, {k: info.get(k) for k in ('id', 'title', 'description', 'uploader', 'uploader_id',
                                            'duration', 'webpage_url', 'upload_date', 'extractor')}


def extract_audio(video, target_dir, runner=None):
    """Mono 16 kHz AAC — small enough for Groq's upload cap on anything under ~1 h."""
    runner = runner or run
    audio = target_dir / 'audio.m4a'
    runner(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(video), '-vn', '-ac', '1', '-ar', '16000',
            '-c:a', 'aac', '-b:a', '48k', str(audio)], timeout=600)
    return audio


def probe_duration(video, runner=None):
    runner = runner or run
    out = runner(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of',
                  'default=noprint_wrappers=1:nokey=1', str(video)], timeout=60)
    try:
        return round(float(out.strip()), 1)
    except ValueError:
        return None


def transcribe_groq(audio, api_key):
    if audio.stat().st_size > MAX_GROQ_BYTES:
        raise RuntimeError('audio exceeds Groq upload limit')
    with audio.open('rb') as fh:
        response = httpx.post(GROQ_URL, headers={'Authorization': f'Bearer {api_key}'},
                              files={'file': (audio.name, fh, 'audio/mp4')},
                              data={'model': GROQ_MODEL, 'response_format': 'verbose_json'},
                              timeout=180)
    if response.status_code >= 400:
        raise RuntimeError(f'Groq transcription failed ({response.status_code}): {response.text[:200]}')
    payload = response.json()
    segments = [{'start': round(s['start'], 2), 'end': round(s['end'], 2), 'text': s['text'].strip()}
                for s in payload.get('segments', [])]
    return {'engine': f'groq:{GROQ_MODEL}', 'language': payload.get('language'),
            'text': payload.get('text', '').strip(), 'segments': segments}


def decode_pcm(audio, runner=None):
    """16 kHz mono float32 PCM via ffmpeg, so faster-whisper never needs PyAV (no py3.14 wheels)."""
    import numpy as np
    process = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(audio), '-f', 'f32le', '-ac', '1',
                              '-ar', '16000', '-'], capture_output=True, timeout=600)
    if process.returncode:
        raise RuntimeError('ffmpeg decode failed: ' + process.stderr.decode(errors='replace')[-200:])
    return np.frombuffer(process.stdout, dtype=np.float32)


def transcribe_local(audio):
    from faster_whisper import WhisperModel  # heavy import; only when actually needed
    model = WhisperModel(LOCAL_MODEL, device='cpu', compute_type='int8')
    raw_segments, info = model.transcribe(decode_pcm(audio), vad_filter=True)
    segments = [{'start': round(s.start, 2), 'end': round(s.end, 2), 'text': s.text.strip()} for s in raw_segments]
    return {'engine': f'faster-whisper:{LOCAL_MODEL}', 'language': info.language,
            'text': ' '.join(s['text'] for s in segments), 'segments': segments}


def transcribe(audio, api_key=None):
    api_key = api_key if api_key is not None else os.environ.get('GROQ_API_KEY')
    if api_key:
        try:
            return transcribe_groq(audio, api_key)
        except Exception as error:  # noqa: BLE001 - fall back to local engine, keep the reason
            result = transcribe_local(audio)
            result['fallback_reason'] = str(error)
            return result
    return transcribe_local(audio)


def tools_present():
    return {tool: shutil.which(tool) is not None for tool in ('yt-dlp', 'ffmpeg', 'ffprobe')}
