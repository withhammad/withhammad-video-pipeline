"""Retime the existing Blender edit to the approved-settings REFERRAL narration.

No paid calls. Keeps the old stand-in composition and all approved media untouched.
Run through studio/heavy.sh; --avatar-ready is allowed only after take.mp4 exists
and the provider filmstrip/voice review have been recorded.
"""
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JOB = ROOT / 'studio/.local/jobs/3f33678db749'
V = JOB / 'referral-v4'
SRC = ROOT / 'studio/remotion/src/blenderskills-v4'
PUB = ROOT / 'studio/remotion/public/blenderskills'
FPS = 30


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower().replace('’', "'"))


def run(*args):
    subprocess.run(args, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--avatar-ready', action='store_true')
    args = ap.parse_args()
    if args.avatar_ready and not (V / 'take.mp4').exists():
        raise SystemExit('Missing mapped take.mp4; do not substitute unrelated face footage')

    raw = json.loads((V / 'words.json').read_text())
    words = []
    for w in raw:
        if w['w'] == '-on' and words[-1]['text'] == 'add':
            words[-1]['text'] = 'add-on'
            words[-1]['e'] = w['e']
        else:
            words.append({'text': w['w'], 's': w['s'], 'e': w['e']})
    # Restore punctuation from the reviewed script without changing word times.
    script = (V / 'script.txt').read_text().split()
    assert len(script) == len(words), (len(script), len(words))
    for expected, w in zip(script, words):
        assert norm(expected) == norm(w['text']), (expected, w)
        w['text'] = expected
    toks = [norm(w['text']) for w in words]
    fr = lambda s: round(s * FPS)

    def at(phrase, after=0):
        ps = [norm(x) for x in phrase.split()]
        for i in range(after, len(toks)):
            if toks[i:i + len(ps)] == ps:
                return fr(words[i]['s'])
        raise ValueError(f'Anchor not found: {phrase}')

    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration', '-of', 'csv=p=0', str(V / 'voice.wav')]))
    # Let the typed keyword and guide card stay readable for 1.5s after settling.
    # This is a silent picture hold, not slower speech or additional paid avatar audio.
    end = fr(dur + 2)
    anchors = [('title', 0), ('renders', at('textures')), ('free', at('and the skills')),
        ('site', at("It's called")), ('repo', at('a free')), ('blender', at('All you need')),
        ('prompt', at('Just describe')), ('director', at('and the Blender Director')),
        ('build', at('builds characters')), ('cta', at('Want the setup'))]
    units = [{'kind': kind, 'from': start, 'to': (anchors[i+1][1] if i+1 < len(anchors) else end)}
        for i, (kind, start) in enumerate(anchors)]
    assert all(u['to'] - u['from'] >= 9 for u in units)
    beats = {
        'title': [at('run'), at('build'), at('3D')],
        'renders': [at('textures'), at('animations'), at('describing')],
        'free': at('free'), 'site': at('Blender Skills'),
        'repo': {'free': at('free', 29), 'open': at('open source'), 'n94': at('94'), 'pro': at('coding agent')},
        'blender': {'open': at('Blender open'), 'mcp': at('MCP'), 'connects': at('connected')},
        'prompt': {'type': at('describe'), 'hi': at('cyberpunk'), 'unreal': at('Unreal')},
        'director': {'hi': at('Blender Director'), 'over': at('plans')},
        'build': {'plan': at('plans'), 'char': at('characters'), 'props': at('props'),
            'env': at('environment'), 'light': at('lighting'), 'tex': at('textures', 70),
            'opt': at('optimizes'), 'exp': at('exports'), 'check': at('coordinating'),
            'cost': at('Claude usage')},
        'cta': {'type': at('BLENDER and'), 'dm': at("I'll send")},
    }
    # Three words maximum, split earlier when needed to fit the right-hand safe area.
    phrases, cur = [], []
    for w in words:
        proposed = ' '.join(x['text'] for x in cur + [w])
        if cur and (len(cur) == 3 or len(proposed) > 21):
            phrases.append(cur)
            cur = []
        cur.append(w)
        if re.search(r'[,.?!]$', w['text']):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    accent = {'blender','3d','animations','free','94','add-on','unreal','engine','director','mcp','costs'}
    serif = {'blender','director'}
    captions = []
    for i, p in enumerate(phrases):
        captions.append({'from': fr(p[0]['s']),
            'to': fr(phrases[i+1][0]['s']) if i+1 < len(phrases) else end,
            'words': [{'t': w['text'].rstrip(','), 'at': fr(w['s']),
                'accent': norm(w['text']) in {norm(a) for a in accent},
                'serif': norm(w['text']) in serif} for w in p]})
    data = {'frames': end, 'fps': FPS, 'units': units, 'beats': beats, 'captions': captions,
        'durationS': round(dur, 3), 'avatarReady': args.avatar_ready, 'standin': False,
        'voiceFile': 'referral-v4-voice.wav', 'takeFile': 'referral-v4-take.mp4'}
    SRC.mkdir(parents=True, exist_ok=True)
    (SRC / 'data.json').write_text(json.dumps(data, indent=2) + '\n')
    (V / 'script_words.json').write_text(json.dumps(words, indent=2) + '\n')
    (V / 'edit.json').write_text(json.dumps(data, indent=2) + '\n')
    assert end / FPS <= 34.93 * 1.1, 'Reference length tolerance exceeded'
    assert sum(len(c['words']) for c in captions) == len(script)
    def stamp(frame):
        ms = round(frame * 1000 / FPS)
        return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    (V / 'captions.srt').write_text('\n\n'.join(
        f"{i+1}\n{stamp(c['from'])} --> {stamp(c['to'])}\n" + ' '.join(w['t'] for w in c['words'])
        for i, c in enumerate(captions)) + '\n')
    shutil.copy2(V / 'voice.wav', PUB / data['voiceFile'])
    if args.avatar_ready:
        shutil.copy2(V / 'take.mp4', PUB / data['takeFile'])

    # Only reference on-camera lines: 4 spans, keeping the 13.83–21.67s split shots together.
    faces = []
    for u in units:
        if u['kind'] in {'title', 'free', 'blender', 'prompt', 'cta'}:
            if faces and faces[-1]['timeline_to'] == u['from']:
                faces[-1]['timeline_to'] = u['to']
            else:
                faces.append({'timeline_from': u['from'], 'timeline_to': min(u['to'], fr(dur))})
    offset = 0
    gap_frames = 10
    for i, span in enumerate(faces):
        span['audio_from'] = offset
        span['audio_to'] = offset + span['timeline_to'] - span['timeline_from']
        offset = span['audio_to'] + (gap_frames if i + 1 < len(faces) else 0)
    filters = []
    names = []
    for i, span in enumerate(faces):
        a, b = span['timeline_from']/FPS, span['timeline_to']/FPS
        filters.append(f'[0:a]atrim=start={a:.6f}:end={b:.6f},asetpts=PTS-STARTPTS[s{i}]')
        names.append(f'[s{i}]')
        if i+1 < len(faces):
            filters.append(f'anullsrc=r=48000:cl=mono,atrim=duration={gap_frames/FPS:.6f}[g{i}]')
            names.append(f'[g{i}]')
    filters.append(''.join(names) + f'concat=n={len(names)}:v=0:a=1[out]')
    run('ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(V/'voice.wav'),
        '-filter_complex',';'.join(filters),'-map','[out]','-ar','48000','-ac','1',
        '-c:a','pcm_s16le',str(V/'avatar-audio.wav'))
    (V / 'avatar-map.json').write_text(json.dumps({'fps':FPS,'spans':faces,
        'duration_s':offset/FPS,'voice_review_required':True,
        'look':'Podcaster in white t-shirt','resolution':'720p',
        'provider_lip_offset_ms':'Measure from filmstrip; historical HeyGen lead ~100ms'}, indent=2)+'\n')
    print(json.dumps({'frames':end,'duration_s':end/FPS,'caption_words':sum(len(c['words']) for c in captions),
        'avatar_audio_s':offset/FPS,'avatar_ready':args.avatar_ready,'units':units}, indent=2))


if __name__ == '__main__':
    main()
