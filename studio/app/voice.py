"""Voice fallback lane (owner rule 2026-11-01): when HeyGen credits are finished, the owner's voice still ships.

Order of providers for a voice-only (avatar-light) reel:
  1. elevenlabs  the approved ElevenLabs voice 46d4ae… (the same voice HeyGen uses), key ELEVENLABS_API_KEY
  2. fish        Fish Audio TTS with a reference voice, keys FISH_API_KEY + FISH_VOICE_ID
  3. local       a free, keyless TTS (macOS `say`, else espeak-ng); clearly labelled NOT the owner's voice
HeyGen itself is only picked when credits remain AND a face take is wanted (the reference shows a face).

Endpoints (checked against the public docs on 2026-11-01):
  GET  https://api.heygen.com/v2/user/remaining_quota                 x-api-key; data.remaining_quota (60 units = 1 credit)
  POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}        xi-api-key; {text, model_id}; ?output_format=mp3_44100_128
  GET  https://api.elevenlabs.io/v1/voices                            xi-api-key; voices[] {voice_id, name}
  POST https://api.fish.audio/v1/tts                                  Bearer; {text, reference_id, format: wav}; audio bytes
  GET  https://api.fish.audio/model?self=true                         Bearer; items[] {_id, title}

Every provider ends in a 48 kHz mono 16-bit WAV (ffmpeg), the file the edit starter plays as cut-audio.wav.
Secrets come from work/.secrets/studio.env (sourced by run_local.sh; add one with studio/set_secret.sh NAME).
Nothing here prints a key.

CLI:  .venv/bin/python -m app.voice synth --script script.txt --out <job>/cut-audio.wav [--provider elevenlabs|fish|local]
      .venv/bin/python -m app.voice status
"""
import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import tempfile
import time
import wave
from pathlib import Path

import httpx

from . import heygen

SECRETS_HINT = 'work/.secrets/studio.env (studio/set_secret.sh NAME)'
ORDER = ('elevenlabs', 'fish', 'local')
SR = 48000

ELEVENLABS_BASE = 'https://api.elevenlabs.io'
ELEVENLABS_VOICE_ID = os.environ.get('STUDIO_ELEVENLABS_VOICE_ID', heygen.VOICE_ID)   # 46d4ae4996a8476c8227108e3847f401
ELEVENLABS_MODEL = os.environ.get('STUDIO_ELEVENLABS_MODEL', 'eleven_multilingual_v2')
ELEVENLABS_FORMAT = 'mp3_44100_128'          # every tier allows it; pcm_44100 is Pro+ only. ffmpeg resamples to 48 kHz.
FISH_BASE = 'https://api.fish.audio'
FISH_MODEL = os.environ.get('STUDIO_FISH_MODEL', 's1')
HEYGEN_MIN_CREDITS = float(os.environ.get('STUDIO_HEYGEN_MIN_CREDITS', '1'))   # one 60 s avatar take ≈ 1 credit
LOCAL_SAY_VOICE = os.environ.get('STUDIO_LOCAL_SAY_VOICE', 'Daniel')
WHISPER_COMMAND = ('ffmpeg -y -i cut-audio.wav -ac 1 -ar 16000 audio.wav && '
                   'whisper audio.wav --model small.en --word_timestamps True --output_format json')


class MissingKey(RuntimeError):
    """A provider's env var is not set. The message names the var; the value is never read into the message."""
    def __init__(self, name):
        self.name = name
        super().__init__(f'{name} is missing from {SECRETS_HINT}')


def key(name):
    value = os.environ.get(name, '').strip()
    if not value:
        raise MissingKey(name)
    return value


def has_key(name):
    return bool(os.environ.get(name, '').strip())


def run(cmd, timeout=600):
    process = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, timeout=timeout)
    if process.returncode:
        tail = (process.stderr or process.stdout).strip().splitlines()[-3:]
        raise RuntimeError(f'{cmd[0]} failed (exit {process.returncode}): ' + ' | '.join(tail))
    return process.stdout


def to_wav48k(src, out_wav):
    """Any audio file -> 48 kHz mono 16-bit WAV at out_wav (the edit-path contract)."""
    out_wav = Path(out_wav)
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', SR, '-c:a', 'pcm_s16le', out_wav])
    return out_wav


def wav_duration(path):
    with wave.open(str(path), 'rb') as wav:
        return round(wav.getnframes() / float(wav.getframerate()), 3)


def _http_error(provider, response):
    try:
        detail = json.dumps(response.json())[:300]
    except ValueError:
        detail = response.text[:300]
    return RuntimeError(f'{provider} failed ({response.status_code}) {detail}')


# ----------------------------------------------------------------------------- providers

def tts_elevenlabs(text, out_wav, transport=None, voice_id=None, model_id=None):
    api_key = key('ELEVENLABS_API_KEY')
    voice_id = voice_id or ELEVENLABS_VOICE_ID
    with httpx.Client(base_url=ELEVENLABS_BASE, headers={'xi-api-key': api_key}, timeout=120, transport=transport) as http:
        response = http.post(f'/v1/text-to-speech/{voice_id}', params={'output_format': ELEVENLABS_FORMAT},
                             json={'text': text, 'model_id': model_id or ELEVENLABS_MODEL})
    if response.status_code >= 400:
        raise _http_error('elevenlabs', response)
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
        tmp.write(response.content)
    try:
        to_wav48k(tmp.name, out_wav)
    finally:
        os.unlink(tmp.name)
    return {'provider': 'elevenlabs', 'voice_id': voice_id, 'model': model_id or ELEVENLABS_MODEL,
            'cost_note': f'ElevenLabs bills {len(text)} characters against the plan quota (owner voice)'}


def tts_fish(text, out_wav, transport=None, reference_id=None):
    api_key = key('FISH_API_KEY')
    reference_id = reference_id or key('FISH_VOICE_ID')
    with httpx.Client(base_url=FISH_BASE, headers={'Authorization': f'Bearer {api_key}', 'model': FISH_MODEL},
                      timeout=180, transport=transport) as http:
        response = http.post('/v1/tts', json={'text': text, 'reference_id': reference_id, 'format': 'wav'})
    if response.status_code >= 400:
        raise _http_error('fish', response)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        tmp.write(response.content)
    try:
        to_wav48k(tmp.name, out_wav)
    finally:
        os.unlink(tmp.name)
    return {'provider': 'fish', 'voice_id': reference_id, 'model': FISH_MODEL,
            'cost_note': f'Fish Audio bills {len(text)} UTF-8 bytes of text (cloned reference voice)'}


def local_tool():
    if platform.system() == 'Darwin' and shutil.which('say'):
        return 'say'
    if shutil.which('espeak-ng'):
        return 'espeak-ng'
    if shutil.which('espeak'):
        return 'espeak'
    return None


def tts_local(text, out_wav, transport=None):
    tool = local_tool()
    if not tool:
        raise RuntimeError('no free local TTS found (macOS `say` or espeak-ng); install espeak-ng or add a provider key')
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / 'script.txt'
        script.write_text(text)
        raw = Path(tmp) / 'raw.wav'
        if tool == 'say':   # WAVE + LEI16@48000 is the pair `say` accepts (AIFF + LEI16 fails with "fmt?")
            run(['say', '-v', LOCAL_SAY_VOICE, '-f', script, '-o', raw, '--file-format=WAVE', '--data-format=LEI16@48000'])
        else:
            run([tool, '-f', script, '-w', raw])
        to_wav48k(raw, out_wav)
    return {'provider': 'local', 'voice_id': f'{tool}:{LOCAL_SAY_VOICE if tool == "say" else "default"}', 'model': tool,
            'cost_note': f'free local {tool}; NOT the owner\'s voice: label the reel as a stand-in voice or re-run when a key is back'}


PROVIDERS = {'elevenlabs': tts_elevenlabs, 'fish': tts_fish, 'local': tts_local}
PROVIDER_KEYS = {'elevenlabs': ('ELEVENLABS_API_KEY',), 'fish': ('FISH_API_KEY', 'FISH_VOICE_ID'), 'local': ()}


# ----------------------------------------------------------------------------- HeyGen credits + choice

def heygen_credits(transport=None):
    """Remaining HeyGen credits (quota / 60), or None when the key is missing or the call fails."""
    if not has_key('HEYGEN_API_KEY'):
        return None
    try:
        client = heygen.HeyGen(transport=transport)
        data = client._call('GET', '/v2/user/remaining_quota')['data']
        return round(float(data['remaining_quota']) / 60.0, 2)
    except Exception:
        return None


def heygen_credits_ok(transport=None, minimum=None):
    """True when HeyGen has at least `minimum` credits, False when it has fewer, None when unknown (no key / API down)."""
    credits = heygen_credits(transport)
    if credits is None:
        return None
    return credits >= (HEYGEN_MIN_CREDITS if minimum is None else minimum)


def pick_provider(face_wanted=True, transport=None):
    """HeyGen when credits exist and a face take is wanted; else the first TTS provider with keys; else local."""
    if face_wanted and heygen_credits_ok(transport):
        return 'heygen'
    for name in ORDER:
        if all(has_key(k) for k in PROVIDER_KEYS[name]):
            if name != 'local' or local_tool():
                return name
    return 'local'


def status(transport=None):
    credits = heygen_credits(transport)
    return {
        'heygen': {'key': has_key('HEYGEN_API_KEY'), 'credits': credits,
                   'ok': None if credits is None else credits >= HEYGEN_MIN_CREDITS},
        'elevenlabs': {'key': has_key('ELEVENLABS_API_KEY'), 'voice_id': ELEVENLABS_VOICE_ID, 'model': ELEVENLABS_MODEL},
        'fish': {'key': has_key('FISH_API_KEY'), 'voice_id_set': has_key('FISH_VOICE_ID'), 'model': FISH_MODEL},
        'local': {'tool': local_tool(), 'owner_voice': False},
        'ffmpeg': bool(shutil.which('ffmpeg')),
        'pick_face': pick_provider(True, transport),
        'pick_voice_only': pick_provider(False, transport),
        'missing_env': [k for name in ORDER for k in PROVIDER_KEYS[name] if not has_key(k)],
    }


# ----------------------------------------------------------------------------- synth

def synthesize(script_text, out_wav, provider='auto', transport=None, record=True):
    """Make out_wav (48 kHz mono WAV) from script_text. provider='auto' walks ORDER and skips a provider whose key is
    missing or whose call fails; a named provider must succeed. Returns
    {'provider', 'path', 'duration_s', 'cost_note', 'voice_id', 'model', 'attempts'} and writes voice.json beside out_wav."""
    text = script_text.strip()
    if not text:
        raise ValueError('script is empty')
    out_wav = Path(out_wav)
    chain = list(ORDER) if provider == 'auto' else [provider]
    if provider != 'auto' and provider not in PROVIDERS:
        raise ValueError(f'unknown provider {provider!r}; choose from {", ".join(PROVIDERS)} or auto')
    attempts, result = [], None
    for name in chain:
        try:
            result = PROVIDERS[name](text, out_wav, transport=transport)
            attempts.append({'provider': name, 'ok': True})
            break
        except (MissingKey, RuntimeError) as exc:
            attempts.append({'provider': name, 'ok': False, 'error': str(exc)})
            if provider != 'auto':
                raise
    if result is None:
        raise RuntimeError('every voice provider failed: ' + '; '.join(f"{a['provider']}: {a['error']}" for a in attempts))
    result.update({'path': str(out_wav), 'duration_s': wav_duration(out_wav), 'attempts': attempts,
                   'chars': len(text), 'made_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
    if record:
        (out_wav.parent / 'voice.json').write_text(json.dumps(result, indent=2))
    return result


def write_words(wav, folder=None, prompt=''):
    """Word timings for the edit starter: words.json ([{w, s, e}] seconds) and words.js (window.WORDS = …) next to
    the WAV, via the same faster-whisper call the intake uses (app.reel.transcribe_words). Returns the word list, or
    None (with the manual command in words.todo.txt) when faster-whisper is not importable."""
    wav = Path(wav)
    folder = Path(folder) if folder else wav.parent
    try:
        from .reel import transcribe_words
        caps = transcribe_words(wav, prompt)
    except ImportError:
        (folder / 'words.todo.txt').write_text('faster-whisper is not importable in this venv. Run from the job folder:\n'
                                              f'  {WHISPER_COMMAND}\nthen convert the json words to words.js ({{w, s, e}}).\n')
        return None
    words = [{'w': c['text'].strip(), 's': round(c['startMs'] / 1000, 3), 'e': round(c['endMs'] / 1000, 3)}
             for c in caps if c['text'].strip() and c['endMs'] > c['startMs']]
    (folder / 'words.json').write_text(json.dumps(words, indent=1))
    (folder / 'words.js').write_text('// Word timings from app.voice (faster-whisper small). video-intake format.\n'
                                     'window.WORDS = ' + json.dumps(words) + ';\n')
    return words


# ----------------------------------------------------------------------------- CLI

def main(argv=None, out=sys.stdout):
    parser = argparse.ArgumentParser(prog='app.voice', description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest='cmd', required=True)
    synth = sub.add_parser('synth', help='script text -> 48 kHz mono WAV + voice.json (+ words.json)')
    synth.add_argument('--script', required=True, help='path to the spoken script (.txt)')
    synth.add_argument('--out', required=True, help='output WAV, e.g. <job>/cut-audio.wav')
    synth.add_argument('--provider', default='auto', choices=['auto', *PROVIDERS])
    synth.add_argument('--no-words', action='store_true', help='skip the faster-whisper word timings')
    sub.add_parser('status', help='which providers have keys, HeyGen credits, what pick_provider would choose')
    args = parser.parse_args(argv)
    if args.cmd == 'status':
        info = status()
        lines = [f"heygen      key={'yes' if info['heygen']['key'] else 'no (HEYGEN_API_KEY)'}  credits={info['heygen']['credits']}  ok={info['heygen']['ok']}",
                 f"elevenlabs  key={'yes' if info['elevenlabs']['key'] else 'no (ELEVENLABS_API_KEY)'}  voice={info['elevenlabs']['voice_id']}  model={info['elevenlabs']['model']}",
                 f"fish        key={'yes' if info['fish']['key'] else 'no (FISH_API_KEY)'}  voice_id={'set' if info['fish']['voice_id_set'] else 'no (FISH_VOICE_ID)'}  model={info['fish']['model']}",
                 f"local       tool={info['local']['tool'] or 'none'}  (free, NOT the owner\'s voice)",
                 f"ffmpeg      {'yes' if info['ffmpeg'] else 'MISSING'}",
                 f"pick: face take -> {info['pick_face']}; voice only -> {info['pick_voice_only']}"]
        if info['missing_env']:
            lines.append('add to ' + SECRETS_HINT + ': ' + ', '.join(info['missing_env']))
        print('\n'.join(lines), file=out)
        return 0
    text = Path(args.script).read_text()
    result = synthesize(text, args.out, provider=args.provider)
    print(f"{result['provider']}: {result['path']} ({result['duration_s']} s) — {result['cost_note']}", file=out)
    if not args.no_words:
        words = write_words(result['path'])
        print(f'words: {len(words)} -> words.json + words.js' if words is not None
              else f'words: faster-whisper missing; see words.todo.txt ({WHISPER_COMMAND})', file=out)
    return 0


if __name__ == '__main__':
    sys.exit(main())
