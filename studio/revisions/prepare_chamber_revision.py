"""Prepare Chamber's isolated edit assets without submitting a HeyGen render.

Run through studio/heavy.sh after word alignment. --prepare builds the edit assets.
Without it, the owner-approved voice and an existing look-1 avatar file are required.
The original job exports, composition data, and posting queue are left untouched.
"""
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REM = ROOT / 'studio/remotion'
JOB = ROOT / 'studio/.local/jobs/762cf7fb383a'
NAME = 'chamber-revision-20261108'
WORK = ROOT / 'work/codex-takeover' / NAME
PUBLIC = REM / 'public' / NAME
SRC = REM / 'work' / NAME
FPS, OFFSET = 30, .1
for p in (WORK, PUBLIC, SRC):
    p.mkdir(parents=True, exist_ok=True)


def run(args, **kwargs):
    return subprocess.run([str(x) for x in args], check=True, **kwargs)


def ff(*args):
    return run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args])


voice = JOB / 'matching-look/voice_raw_v2.wav'
duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
                 'format=duration', '-of', 'csv=p=0', str(voice)]))
frames = math.ceil(duration * FPS)
words = json.loads((JOB / 'matching-look/excited-words-fixed.json').read_text())
words = [{'w': x['w'], 's': max(0, x['s'] - OFFSET), 'e': max(0, x['e'] - OFFSET)} for x in words]
norm = lambda x: re.sub('[^a-z0-9]', '', x.lower())


def at(phrase, after=0):
    wanted = [norm(x) for x in phrase.split()]
    for i in range(len(words) - len(wanted) + 1):
        if words[i]['s'] >= after and [norm(x['w']) for x in words[i:i + len(wanted)]] == wanted:
            return round(words[i]['s'] * FPS)
    raise ValueError('Missing anchor: ' + phrase)


starts = [
    ('hook', 0), ('press', at('Dubai Chambers calls')), ('ready', at('where companies')),
    ('orbit', at('admin')), ('agents22', at('it starts')), ('plan100', at('with one hundred')),
    ('site', at('checking invoices')), ('signin', at('to join')), ('site', at('then pick')),
    ('sandbox', at('and try')), ('paid', at('but the service')), ('face', at('the agents support')),
    ('hosted', at('and Dubai Chambers')), ('endcard', at('so if')), ('cta', at('comment Dubai'))]
units = [{'kind': k, 'from': start, 'to': starts[i + 1][1] if i + 1 < len(starts) else frames}
         for i, (k, start) in enumerate(starts)]
assert all(u['to'] - u['from'] >= 9 for u in units), 'A scene is shorter than 0.3 seconds'
hundred = at('one hundred')
beats = {
    'ready': [at('ready-made'), at('admin')],
    'tags': [at(x, after=15) for x in ['compliance', 'procurement', 'operations', 'finance', 'sales', 'HR', 'logistics']],
    'plan100': [hundred, hundred + 15],
    'sandbox': [at('sandbox'), at('introductory credits')],
    'paid': [at('paid plans')],
    'face_langs': [at('Arabic and English'), at('admin portal')],
    'hosted': [at('hosted'), at('separate')],
    'endcard': [at('Dubai Chambers member'), at('sample documents')],
    'cta': {'type': at('Dubai and', after=68), 'dm': at("I'll send", after=68)},
}
caps, group = [], []
for word in words:
    group.append(word)
    if len(group) == 3 or re.search('[.,!?]$', word['w']):
        caps.append({'from': round(group[0]['s'] * FPS), 'to': round(group[-1]['e'] * FPS),
                     'text': ' '.join(x['w'] for x in group)})
        group = []
if group:
    caps.append({'from': round(group[0]['s'] * FPS), 'to': frames, 'text': ' '.join(x['w'] for x in group)})
for i, cap in enumerate(caps):
    cap['to'] = caps[i + 1]['from'] if i + 1 < len(caps) else frames

ff('-ss', OFFSET, '-i', voice, '-af', 'apad', '-t', frames / FPS, '-ar', 48000, '-ac', 2, PUBLIC / 'voice.wav')
ff('-ss', 13.6, '-i', JOB / 'source.mp4', '-t', 2.4, '-an', '-vf',
   'crop=540:386:0:0,scale=1080:772:flags=lanczos,fps=30,format=yuv420p',
   '-c:v', 'libx264', '-crf', 18, '-preset', 'fast', PUBLIC / 'reference-orbit.mp4')
# Reuse the existing original 96-BPM score, extending its synthesis beyond the cut
# so its terminal fade cannot create a dropout during the reel.
run([ROOT / 'studio/.venv/bin/python', JOB / 'sound-bed.py', frames / FPS + 2], cwd=WORK)

data = {'frames': frames, 'fps': FPS, 'units': units, 'beats': beats, 'caps': caps,
        'splitScale': .78, 'splitY': 580, 'captionY': 1370, 'captionSize': 46,
        'take': True, 'revised': True, 'takeFile': NAME + '/take.mp4', 'voiceFile': NAME + '/voice.wav',
        'orbitFile': NAME + '/reference-orbit.mp4', 'orbitDuration': 2.4, 'orbitIsFullPortrait': False}
(SRC / 'data.json').write_text(json.dumps(data, indent=2) + '\n')
for f in ('Reel.tsx', 'index.tsx'):
    shutil.copy2(REM / 'src/dubaihub' / f, SRC / f)
approval_path = JOB / 'matching-look/owner-voice-approval.json'
submission_path = JOB / 'matching-look/look1-submission.json'
approval = json.loads(approval_path.read_text()) if approval_path.exists() else None
submission = json.loads(submission_path.read_text()) if submission_path.exists() else None
(WORK / 'source-record.json').write_text(json.dumps({
    'reference': 'https://www.instagram.com/reel/DfbvLHmOlhR/', 'insert_seconds': [13.6, 16.0],
    'crop_xywh': [0, 0, 540, 386], 'voice_take': '1794083468342-3',
    'voice_status': 'Owner approved this verified Excited take despite median 147.37 Hz' if approval else 'Owner decision pending',
    'owner_voice_approval': approval, 'avatar_submission': submission,
    'audio_advance_ms': round(OFFSET * 1000),
    'lip_sync_status': 'See matching-look/lipsync-check.json for this rendered take'}, indent=2) + '\n')
if '--prepare' not in sys.argv:
    if not approval or not submission:
        raise SystemExit('Owner voice approval and the single look-1 submission record are required.')
    avatar = JOB / 'matching-look/look1-avatar-raw.mp4'
    if not avatar.exists():
        raise SystemExit('Prepared only: look-1 avatar is not rendered yet. No credits were spent.')
    shutil.copy2(avatar, PUBLIC / 'take.mp4')
    run(['npx', 'remotion', 'render', SRC / 'index.tsx', 'DubaiHubReel', WORK / 'render.mp4',
         '--concurrency=2', '--crf=20', '--timeout=300000', '--log=error'], cwd=REM)
print(f'{frames} frames; {len(units)} scenes; {len(words)} captioned words. No posting or HeyGen request.')
