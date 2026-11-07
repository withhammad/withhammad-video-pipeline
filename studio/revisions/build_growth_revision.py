"""Build the progress preview, or --full corrected GROWTH edit, from matching-look assets.

Run from the repository through studio/heavy.sh. This exports a labelled edit preview,
never an approved final. It leaves previous takes, composition data and exports intact.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REM = ROOT / 'studio/remotion'
JOB = ROOT / 'studio/.local/jobs/0f869c3f2de7'
FULL = '--full' in sys.argv
NAME = 'growth-revision-20261108' if FULL else 'growth-preview-20261108'
WORK = ROOT / 'work/codex-takeover' / NAME
PUBLIC = REM / 'public' / NAME
SRC = REM / 'work' / NAME
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs')
FPS, OFFSET = 30, .1
FRAMES = 911 if FULL else 280
OUTPUT = 'GROWTH-corrected-edit.mp4' if FULL else 'GROWTH-edit-preview.mp4'
SHEET = 'GROWTH-corrected-sheet.jpg' if FULL else 'GROWTH-preview-sheet.jpg'
for p in (WORK, PUBLIC, SRC, OUT):
    p.mkdir(parents=True, exist_ok=True)


def run(args, **kw):
    return subprocess.run([str(x) for x in args], check=True, **kw)


def ff(*args):
    return run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args])


raw = JOB / 'matching-look' / ('corrected-avatar-raw.mp4' if FULL else 'avatar_raw.mp4')
shutil.copy2(raw, PUBLIC / 'take.mp4')
ff('-ss', OFFSET, '-i', raw, '-t', FRAMES / FPS, '-vn', '-ac', 2, '-ar', 48000, PUBLIC / 'voice.wav')
# Use only the reference's visual insert, above its caption band and presenter.
ff('-i', JOB / 'source.mp4', '-t', 1.1, '-an', '-vf',
   'crop=540:400:0:0,scale=1080:800:flags=lanczos,fps=30,format=yuv420p',
   '-c:v', 'libx264', '-crf', 18, '-preset', 'fast', PUBLIC / 'reference-boxing.mp4')

if FULL:
    # Provider timestamps collapse seven spoken words to zero duration. Use verified
    # Whisper alignment on the actual new video, with script spelling corrections.
    words = json.loads((JOB / 'matching-look/corrected-words-fixed.json').read_text())
else:
    words = json.loads((JOB / 'matching-look/preview-words.json').read_text())
words = [{'w': x['w'], 's': max(0, x['s'] - OFFSET), 'e': max(0, x['e'] - OFFSET)} for x in words]
norm = lambda x: re.sub('[^a-z0-9]', '', x.lower())


def at(phrase):
    ts = [norm(x) for x in phrase.split()]
    for i in range(len(words) - len(ts) + 1):
        if [norm(x['w']) for x in words[i:i + len(ts)]] == ts:
            return round(words[i]['s'] * FPS)
    raise ValueError('Missing anchor: ' + phrase)


scenes = [{'key': k, 'from': f} for k, f in [
    ('fight', 0), ('repo', at('a free')), ('skills', at('gives Claude')),
    ('wall', at('help with')), ('composer', at('one writes'))]]
if FULL:
    scenes += [{'key': k, 'from': at(phrase)} for k, phrase in [
        ('replies', 'one drafts'), ('profile', 'one scores'), ('calendar', 'and one plans'),
        ('crazy', 'but the craziest'), ('viral', 'viral skill'), ('grid', 'it ranks'),
        ('checks', 'breaks down'), ('chat', 'and turns'), ('voice', 'in your voice'),
        ('wonder', 'so instead'), ('research', 'Claude finds'), ('idea', 'and builds'),
        ('free', 'the skill pack is free'), ('cta', 'comment growth')]]
for i, scene in enumerate(scenes):
    scene['to'] = scenes[i + 1]['from'] if i + 1 < len(scenes) else FRAMES

caps, group = [], []
for word in words:
    if word['s'] * FPS >= FRAMES:
        break
    group.append(word)
    if len(group) == 3 or re.search('[.,!?]$', word['w']):
        caps.append({'from': round(group[0]['s'] * FPS), 'to': round(group[-1]['e'] * FPS) + 3,
                     'text': ' '.join(x['w'] for x in group).upper().replace('THIRTEEN', '13').replace('TWENTY -SIX', '26')})
        group = []
if group:
    caps.append({'from': round(group[0]['s'] * FPS), 'to': FRAMES, 'text': ' '.join(x['w'] for x in group).upper()})
for i, c in enumerate(caps):
    c['to'] = caps[i + 1]['from'] if i + 1 < len(caps) else FRAMES
if FULL:
    # The complete opening thought must be readable before the narration finishes it.
    end = scenes[0]['to']
    caps = [{'from': 0, 'to': end, 'text': 'SO CLAUDE JUST KILLED INSTAGRAM', 'hook': True}] + [c for c in caps if c['from'] >= end]
data = {'frames': FRAMES, 'scenes': scenes, 'caps': caps, 'preview': not FULL, 'captionEveryWord': True,
        'safePanels': FULL,
        'takeFile': NAME + '/take.mp4', 'voiceFile': NAME + '/voice.wav',
        'referenceHook': NAME + '/reference-boxing.mp4',
        'referenceHookRate': 1.1 / (scenes[0]['to'] / FPS)}
(SRC / 'data.json').write_text(json.dumps(data, indent=2))
shutil.copy2(REM / 'src/growth/Reel.tsx', SRC / 'Reel.tsx')
shutil.copy2(REM / 'src/growth/index.tsx', SRC / 'index.tsx')
(WORK / 'source-record.json').write_text(json.dumps({
    'reference': 'https://www.instagram.com/reel/DfaNcY1FdlE/',
    'insert_seconds': [0, 1.1], 'crop_xywh': [0, 0, 540, 400],
    'take': str(raw), 'audio_advance_ms': 100,
    'status': 'Corrected edit awaiting QA and owner approval' if FULL else
              'Progress preview requested by owner. Current take retained; voice energy and final QA unresolved.'}, indent=2))
if '--mix-only' not in sys.argv:
    run(['npx', 'remotion', 'render', SRC / 'index.tsx', 'GrowthReel', WORK / 'render.mp4',
         '--concurrency=2', '--crf=20', '--timeout=300000', '--log=error'], cwd=REM)


def loudness(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-t', str(FRAMES / FPS),
                        '-af', 'loudnorm=I=-14:TP=-1.8:print_format=json', '-f', 'null', '-'],
                       text=True, capture_output=True, check=True)
    return json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]


voice = PUBLIC / 'voice.wav'
music = JOB / 'bed.wav'
vg, mg = -16 - float(loudness(voice)['input_i']), -28 - float(loudness(music)['input_i'])
mix = f'[0:a]volume={vg}dB[v];[1:a]volume={mg}dB[m];[v][m]amix=inputs=2:duration=first:normalize=0'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(voice), '-i', str(music),
                    '-filter_complex', mix + ',loudnorm=I=-14:TP=-1.8:LRA=11:print_format=json',
                    '-t', str(FRAMES / FPS), '-f', 'null', '-'], text=True, capture_output=True, check=True)
v = json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]
normal = (f'loudnorm=I=-14:TP=-1.8:LRA=11:measured_I={v["input_i"]}:measured_TP={v["input_tp"]}:'
          f'measured_LRA={v["input_lra"]}:measured_thresh={v["input_thresh"]}:offset={v["target_offset"]}:linear=true')
ff('-i', WORK / 'render.mp4', '-i', music, '-filter_complex', mix + ',' + normal + ',aresample=48000[a]',
   '-t', FRAMES / FPS, '-map', '0:v', '-map', '[a]', '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p',
   '-c:v', 'libx264', '-preset', 'fast', '-crf', 20, '-color_range', 'tv', '-colorspace', 'bt709',
   '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
   OUT / OUTPUT)
ff('-i', OUT / OUTPUT, '-vf', 'fps=1,scale=216:384,tile=' + ('8x4' if FULL else '5x2'), '-frames:v', 1,
   OUT / SHEET)
print(OUT / OUTPUT)
