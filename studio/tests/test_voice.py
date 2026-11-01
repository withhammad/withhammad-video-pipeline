"""Voice fallback lane: provider calls (mocked HTTP), fallback order, missing-key errors, HeyGen credits, CLI status.
No paid API is called here; ffmpeg/say are faked by writing a real WAV where the tool would."""
import io
import json
import wave

import httpx
import numpy as np
import pytest

from app import voice

ALL_KEYS = ('HEYGEN_API_KEY', 'ELEVENLABS_API_KEY', 'FISH_API_KEY', 'FISH_VOICE_ID')


def write_wav(path, seconds=1.5, sr=48000):
    tone = (0.2 * np.sin(2 * np.pi * 220 * np.arange(int(sr * seconds)) / sr) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sr)
        wav.writeframes(tone.tobytes())


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ALL_KEYS:
        monkeypatch.delenv(name, raising=False)


@pytest.fixture
def fake_tools(monkeypatch):
    """ffmpeg/say/espeak are replaced by a runner that writes a 1.5 s WAV at the output path (the last argument)."""
    calls = []

    def runner(cmd, timeout=600):
        cmd = [str(c) for c in cmd]
        calls.append(cmd)
        if cmd[0] == 'ffmpeg':
            write_wav(cmd[-1])
        elif cmd[0] in ('say', 'espeak-ng'):
            write_wav(next(cmd[i + 1] for i, a in enumerate(cmd) if a in ('-o', '-w')))
        return ''
    monkeypatch.setattr(voice, 'run', runner)
    return calls


def ok_audio(request):
    return httpx.Response(200, content=b'fake-audio-bytes', headers={'content-type': 'audio/mpeg'})


# ----------------------------------------------------------------------------- providers

def test_elevenlabs_posts_approved_voice_and_model(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'el_test')
    seen = {}

    def handler(request):
        seen['url'] = str(request.url)
        seen['key'] = request.headers.get('xi-api-key')
        seen['body'] = json.loads(request.content)
        return ok_audio(request)
    result = voice.synthesize('Hello reel.', tmp_path / 'cut-audio.wav', provider='elevenlabs',
                              transport=httpx.MockTransport(handler))
    assert '/v1/text-to-speech/46d4ae4996a8476c8227108e3847f401' in seen['url']
    assert 'output_format=mp3_44100_128' in seen['url'] and seen['key'] == 'el_test'
    assert seen['body'] == {'text': 'Hello reel.', 'model_id': 'eleven_multilingual_v2'}
    assert result['provider'] == 'elevenlabs' and result['duration_s'] == 1.5
    assert result['path'].endswith('cut-audio.wav') and 'characters' in result['cost_note']
    ff = [c for c in fake_tools if c[0] == 'ffmpeg'][0]
    assert ff[ff.index('-ar') + 1] == '48000' and ff[ff.index('-ac') + 1] == '1'
    recorded = json.loads((tmp_path / 'voice.json').read_text())
    assert recorded['provider'] == 'elevenlabs' and recorded['attempts'] == [{'provider': 'elevenlabs', 'ok': True}]


def test_elevenlabs_http_error_is_clear_and_keyless(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'el_secret_value')
    transport = httpx.MockTransport(lambda r: httpx.Response(401, json={'detail': {'status': 'quota_exceeded'}}))
    with pytest.raises(RuntimeError, match='elevenlabs failed \\(401\\).*quota_exceeded') as info:
        voice.synthesize('Hi', tmp_path / 'a.wav', provider='elevenlabs', transport=transport)
    assert 'el_secret_value' not in str(info.value)


def test_fish_posts_reference_id_with_bearer(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setenv('FISH_API_KEY', 'fish_test')
    monkeypatch.setenv('FISH_VOICE_ID', 'ref_123')
    seen = {}

    def handler(request):
        seen['url'] = str(request.url)
        seen['auth'] = request.headers.get('authorization')
        seen['body'] = json.loads(request.content)
        return httpx.Response(200, content=b'RIFF-fake', headers={'content-type': 'audio/wav'})
    result = voice.synthesize('Hello', tmp_path / 'cut-audio.wav', provider='fish', transport=httpx.MockTransport(handler))
    assert seen['url'] == 'https://api.fish.audio/v1/tts' and seen['auth'] == 'Bearer fish_test'
    assert seen['body'] == {'text': 'Hello', 'reference_id': 'ref_123', 'format': 'wav'}
    assert result['provider'] == 'fish' and result['voice_id'] == 'ref_123'


def test_fish_needs_both_vars(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setenv('FISH_API_KEY', 'fish_test')
    with pytest.raises(voice.MissingKey, match='FISH_VOICE_ID is missing from work/.secrets/studio.env'):
        voice.synthesize('Hello', tmp_path / 'a.wav', provider='fish', transport=httpx.MockTransport(ok_audio))


def test_local_say_is_labelled_not_owner_voice(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    result = voice.synthesize('Stand-in voice.', tmp_path / 'cut-audio.wav', provider='local')
    say = [c for c in fake_tools if c[0] == 'say'][0]
    assert '--file-format=WAVE' in say and '--data-format=LEI16@48000' in say and 'NOT the owner' in result['cost_note']
    assert result['provider'] == 'local' and result['voice_id'].startswith('say:')


def test_local_without_any_tool_errors(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setattr(voice, 'local_tool', lambda: None)
    with pytest.raises(RuntimeError, match='no free local TTS'):
        voice.synthesize('x', tmp_path / 'a.wav', provider='local')


# ----------------------------------------------------------------------------- fallback order + errors

def test_missing_key_names_env_var_for_named_provider(tmp_path, fake_tools):
    with pytest.raises(voice.MissingKey, match='ELEVENLABS_API_KEY is missing from work/.secrets/studio.env'):
        voice.synthesize('Hello', tmp_path / 'a.wav', provider='elevenlabs')


def test_auto_skips_missing_keys_and_failures_in_order(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'el')
    monkeypatch.setenv('FISH_API_KEY', 'fish')
    monkeypatch.setenv('FISH_VOICE_ID', 'ref')
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    hosts = []

    def handler(request):
        hosts.append(request.url.host)
        if 'elevenlabs' in request.url.host:
            return httpx.Response(429, json={'detail': 'quota'})
        return httpx.Response(200, content=b'wav')
    result = voice.synthesize('Hello', tmp_path / 'cut-audio.wav', transport=httpx.MockTransport(handler))
    assert hosts == ['api.elevenlabs.io', 'api.fish.audio'] and result['provider'] == 'fish'
    assert [a['provider'] for a in result['attempts']] == ['elevenlabs', 'fish']
    assert result['attempts'][0]['ok'] is False and 'quota' in result['attempts'][0]['error']


def test_auto_lands_on_local_when_no_keys(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    result = voice.synthesize('Hello', tmp_path / 'cut-audio.wav')
    assert result['provider'] == 'local'
    assert [(a['provider'], a['ok']) for a in result['attempts']] == [('elevenlabs', False), ('fish', False), ('local', True)]
    assert 'ELEVENLABS_API_KEY' in result['attempts'][0]['error'] and 'FISH_API_KEY' in result['attempts'][1]['error']


def test_auto_everything_failing_lists_every_reason(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setattr(voice, 'local_tool', lambda: None)
    with pytest.raises(RuntimeError, match='every voice provider failed.*ELEVENLABS_API_KEY.*FISH_API_KEY.*no free local TTS'):
        voice.synthesize('Hello', tmp_path / 'a.wav')


def test_empty_script_and_unknown_provider(tmp_path):
    with pytest.raises(ValueError, match='empty'):
        voice.synthesize('  ', tmp_path / 'a.wav')
    with pytest.raises(ValueError, match='unknown provider'):
        voice.synthesize('x', tmp_path / 'a.wav', provider='siri')


# ----------------------------------------------------------------------------- HeyGen credits + pick

def quota(remaining):
    return httpx.MockTransport(lambda r: httpx.Response(200, json={'data': {'remaining_quota': remaining}}))


def test_heygen_credits_ok_reads_quota_endpoint(monkeypatch):
    monkeypatch.setenv('HEYGEN_API_KEY', 'hg')
    seen = {}

    def handler(request):
        seen['path'] = request.url.path
        seen['key'] = request.headers.get('x-api-key')
        return httpx.Response(200, json={'data': {'remaining_quota': 180}})
    assert voice.heygen_credits_ok(transport=httpx.MockTransport(handler)) is True
    assert seen == {'path': '/v2/user/remaining_quota', 'key': 'hg'}
    assert voice.heygen_credits(transport=quota(180)) == 3.0
    assert voice.heygen_credits_ok(transport=quota(30)) is False       # half a credit: not enough for a take


def test_heygen_credits_unknown_without_key_or_on_error(monkeypatch):
    assert voice.heygen_credits_ok() is None
    monkeypatch.setenv('HEYGEN_API_KEY', 'hg')
    assert voice.heygen_credits_ok(transport=httpx.MockTransport(lambda r: httpx.Response(500, text='down'))) is None


def test_pick_provider(monkeypatch):
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    assert voice.pick_provider(True) == 'local'                            # no keys at all
    monkeypatch.setenv('FISH_API_KEY', 'f')
    monkeypatch.setenv('FISH_VOICE_ID', 'r')
    assert voice.pick_provider(True) == 'fish'
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'e')
    assert voice.pick_provider(True) == 'elevenlabs'                       # ElevenLabs before Fish
    monkeypatch.setenv('HEYGEN_API_KEY', 'hg')
    assert voice.pick_provider(True, transport=quota(600)) == 'heygen'      # credits + face wanted
    assert voice.pick_provider(False, transport=quota(600)) == 'elevenlabs' # voice-only never spends HeyGen
    assert voice.pick_provider(True, transport=quota(0)) == 'elevenlabs'    # credits finished


# ----------------------------------------------------------------------------- words + CLI

def test_write_words_uses_intake_transcriber(monkeypatch, tmp_path):
    from app import reel
    monkeypatch.setattr(reel, 'transcribe_words', lambda wav, prompt='': [
        {'text': 'Claude', 'startMs': 200, 'endMs': 550}, {'text': ' edits', 'startMs': 580, 'endMs': 900},
        {'text': ' ', 'startMs': 900, 'endMs': 900}])
    wav = tmp_path / 'cut-audio.wav'
    write_wav(wav)
    words = voice.write_words(wav)
    assert words == [{'w': 'Claude', 's': 0.2, 'e': 0.55}, {'w': 'edits', 's': 0.58, 'e': 0.9}]
    assert json.loads((tmp_path / 'words.json').read_text()) == words
    assert (tmp_path / 'words.js').read_text().startswith('// Word timings') and 'window.WORDS = [' in (tmp_path / 'words.js').read_text()


def test_cli_status_without_keys(monkeypatch):
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    out = io.StringIO()
    assert voice.main(['status'], out=out) == 0
    text = out.getvalue()
    assert 'heygen      key=no (HEYGEN_API_KEY)  credits=None' in text
    assert 'elevenlabs  key=no (ELEVENLABS_API_KEY)  voice=46d4ae4996a8476c8227108e3847f401' in text
    assert 'fish        key=no (FISH_API_KEY)  voice_id=no (FISH_VOICE_ID)' in text
    assert "local       tool=say  (free, NOT the owner's voice)" in text
    assert 'pick: face take -> local; voice only -> local' in text
    assert 'add to work/.secrets/studio.env' in text and 'ELEVENLABS_API_KEY, FISH_API_KEY, FISH_VOICE_ID' in text


def test_cli_status_with_keys_hides_values(monkeypatch):
    monkeypatch.setenv('ELEVENLABS_API_KEY', 'el_super_secret')
    monkeypatch.setenv('FISH_API_KEY', 'fish_super_secret')
    monkeypatch.setenv('FISH_VOICE_ID', 'ref_secret')
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    out = io.StringIO()
    voice.main(['status'], out=out)
    text = out.getvalue()
    assert 'elevenlabs  key=yes' in text and 'fish        key=yes  voice_id=set' in text
    assert 'pick: face take -> elevenlabs; voice only -> elevenlabs' in text and 'add to' not in text
    assert 'secret' not in text


def test_cli_synth_writes_wav_voice_json_and_words(monkeypatch, tmp_path, fake_tools):
    monkeypatch.setattr(voice, 'local_tool', lambda: 'say')
    monkeypatch.setattr(voice, 'write_words', lambda wav, folder=None, prompt='': [{'w': 'hi', 's': 0.0, 'e': 0.3}])
    script = tmp_path / 'script.txt'
    script.write_text('Hi there.')
    out = io.StringIO()
    assert voice.main(['synth', '--script', str(script), '--out', str(tmp_path / 'job' / 'cut-audio.wav'),
                       '--provider', 'local'], out=out) == 0
    text = out.getvalue()
    assert text.startswith('local: ') and '(1.5 s)' in text and 'words: 1 -> words.json + words.js' in text
    assert json.loads((tmp_path / 'job' / 'voice.json').read_text())['provider'] == 'local'
