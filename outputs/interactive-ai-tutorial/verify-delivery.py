"""Decode the master and check its streams, timing, captions and package."""
import json, subprocess, zipfile
from pathlib import Path

OUT = Path(__file__).resolve().parent
video = OUT / 'full-tutorial.mp4'
manifest = json.loads((OUT / 'edit-manifest.json').read_text())
probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams',
                                           '-show_format', '-of', 'json', str(video)]))
streams = probe['streams']
vs = next(s for s in streams if s['codec_type'] == 'video')
audio = next(s for s in streams if s['codec_type'] == 'audio')
assert (vs['width'], vs['height'], vs['r_frame_rate']) == (1920, 1080, '30/1')
assert audio['sample_rate'] == '48000' and audio['channels'] == 2
assert abs(float(probe['format']['duration']) - manifest['duration_seconds']) < 0.5
assert len(manifest['assets']) == 19, 'All 12 narrated sections and 7 presenter sections required'
assert len(manifest.get('inserts', [])) == 2
def seconds(value):
    h, m, s = value.replace(',', '.').split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)
caption_count = 0
last_start = -1
for block in (OUT / 'full-tutorial.srt').read_text().strip().split('\n\n'):
    lines = block.splitlines()
    start, end = [seconds(x) for x in lines[1].split(' --> ')]
    assert start >= last_start and 0 <= start < end <= manifest['duration_seconds'] + 0.05
    assert ''.join(lines[2:]).strip()
    last_start = start
    caption_count += 1
assert caption_count > 500
with (OUT / 'decode-check.log').open('w') as log:
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(video), '-f', 'null', '-'],
                       stdout=log, stderr=log)
assert r.returncode == 0 and not (OUT / 'decode-check.log').read_text().strip()
with zipfile.ZipFile(OUT / 'companion-toolkit.zip') as z:
    assert z.testzip() is None
with zipfile.ZipFile(OUT / 'demo/meeting-actions.pptx') as z:
    slides = [n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')]
    assert len(slides) == 6
chapters = json.loads((OUT / 'chapters.json').read_text())
def mmss(t):
    t = int(t)
    return f'{t//60:02}:{t%60:02}'
chapter_text = '\n'.join(mmss(c['start']) + ' ' + c['title'] for c in chapters
                         if c['asset'].startswith('p-'))
description = '''TITLE
Build Useful AI Tools: 4 Practical Workflows You Can Test

DESCRIPTION
Turn a repeated task into a tool you can actually use. In this tutorial, I walk through a newsletter editor, a task board with a delegation draft, a revenue model, and a packaging concept. We also cover selecting ideas and preparing a presentation.

Follow the screen demonstrations to see how inputs, calculations, previews and exports work, and how to test a result before relying on it. The examples use sample data and run locally. The video includes a brief recorded Claude build; the extended demonstrations use original tutorial tools.

The presenter is an AI avatar of Hammad Yousuf, with his authorized cloned voice.

CHAPTERS
''' + chapter_text + '''

Subscribe for practical AI workflows and step-by-step demonstrations.

#AI #AITutorial #Productivity

EDITOR NOTES (REMOVE BEFORE PUBLISHING)
Attach the verified resource-page URL when it is live. The toolkit is currently delivered locally.
Do not claim that Slack messages were sent or that the packaging concept is manufacturing-ready.
Upload full-tutorial.srt as English captions, and thumbnail.png as the custom thumbnail.
Mark realistic AI-generated presenter content in YouTube's upload disclosures.
'''
(OUT / 'youtube-details.txt').write_text(description)
(OUT / 'verification.json').write_text(json.dumps({
    'full_decode': 'passed', 'duration_seconds': float(probe['format']['duration']),
    'video': '1920x1080 / 30 fps', 'audio': 'AAC / 48 kHz / stereo',
    'chapters': len(chapters), 'powerpoint_slides': len(slides),
    'toolkit_integrity': 'passed', 'published': False,
    'caption_cues': caption_count, 'caption_timing': 'passed',
}, indent=2))
print('Delivery technical verification passed')
