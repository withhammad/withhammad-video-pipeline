"""Master the reviewed look-1 Chamber edit with its original score and subtitles.

Run through studio/heavy.sh after prepare_chamber_revision.py completes.
Writes review outputs only; no posting, queue or avatar API operations.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/codex-takeover/chamber-revision-20261108'
PUBLIC = ROOT / 'studio/remotion/public/chamber-revision-20261108'
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Chamber')
DATA = json.loads((ROOT / 'studio/remotion/work/chamber-revision-20261108/data.json').read_text())
DURATION = DATA['frames'] / DATA['fps']
OUT.mkdir(parents=True, exist_ok=True)


def run(args, **kw):
    return subprocess.run([str(x) for x in args], check=True, **kw)


def measure(file):
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', file, '-t', DURATION,
             '-af', 'loudnorm=I=-14:TP=-1.8:print_format=json', '-f', 'null', '-'], text=True, capture_output=True)
    return json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]


voice, bed = PUBLIC / 'voice.wav', WORK / 'bed.wav'
vg, mg = -16 - float(measure(voice)['input_i']), -28 - float(measure(bed)['input_i'])
mix = f'[0:a]volume={vg}dB[v];[1:a]volume={mg}dB[m];[v][m]amix=inputs=2:duration=first:normalize=0'
r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', voice, '-i', bed,
         '-filter_complex', mix + ',loudnorm=I=-14:TP=-1.8:LRA=11:print_format=json',
         '-t', DURATION, '-f', 'null', '-'], text=True, capture_output=True)
v = json.JSONDecoder().raw_decode(r.stderr[r.stderr.rfind('{'):])[0]
normal = (f'loudnorm=I=-14:TP=-1.8:LRA=11:measured_I={v["input_i"]}:measured_TP={v["input_tp"]}:'
          f'measured_LRA={v["input_lra"]}:measured_thresh={v["input_thresh"]}:offset={v["target_offset"]}:linear=true')
final = OUT / 'Chamber-look-1-edit.mp4'
run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', WORK / 'render.mp4', '-i', bed,
     '-filter_complex', mix + ',' + normal + ',aresample=48000[a]', '-t', DURATION,
     '-map', '0:v', '-map', '[a]', '-vf', 'scale=1080:1920:out_range=tv,format=yuv420p',
     '-c:v', 'libx264', '-preset', 'fast', '-crf', 20, '-color_range', 'tv', '-colorspace', 'bt709',
     '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final])
run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', final,
     '-vf', 'fps=1,scale=216:384,tile=8x10', '-frames:v', 1, OUT / 'contact-sheet.jpg'])


def stamp(fr):
    ms = round(fr / DATA['fps'] * 1000)
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'


(OUT / 'Chamber-captions.srt').write_text('\n\n'.join(
    f'{i + 1}\n{stamp(c["from"])} --> {stamp(c["to"])}\n{c["text"]}'
    for i, c in enumerate(DATA['caps'])) + '\n')
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', final]))
check = {'video': str(final), 'duration_seconds': DURATION, 'frames': DATA['frames'], 'scenes': len(DATA['units']),
         'caption_words': sum(len(c['text'].split()) for c in DATA['caps']), 'master_loudness': measure(final),
         'voice_static_gain_db': vg, 'bed_static_gain_db': mg, 'probe': probe,
         'owner_approved_final': False, 'publishing_authorized': False}
(OUT / 'technical-checks.json').write_text(json.dumps(check, indent=2) + '\n')
print(json.dumps({k: v for k, v in check.items() if k not in ['probe']}, indent=2))
