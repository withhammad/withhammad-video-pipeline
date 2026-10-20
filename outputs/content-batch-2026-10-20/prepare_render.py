"""Align authored Remotion scenes and readable captions to the current English take."""
import json
import re
import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'studio'))
from app import audio

kind = sys.argv[1]
if kind == 'projects':
    job_id, folder, public = 'c9d9bd2b786c', 'ai-engineering-projects-reel', 'ai-projects'
    anchors = ['This', 'You', 'Each', 'Start', 'Comment']
else:
    job_id, folder, public = '7123480a28ca', 'claude-job-search-reel', 'job-search'
    anchors = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Where', 'Stop', 'Comment']
j = root / 'studio/.local/jobs' / job_id
out = root / 'outputs' / folder
pub = root / 'studio/remotion/public' / public
# Enforce the owner's exclusions before copying any presenter into an active edit.
submission = json.loads((out / 'heygen_submission.json').read_text())
settings = json.loads((root / 'outputs/video-pipeline/config.json').read_text())['heygen']
if submission.get('avatar_id') in settings.get('rejected_avatar_ids', []):
    raise SystemExit('Rejected avatar: this look must never be reused.')
if submission.get('approved_for_use') is not True:
    raise SystemExit('Select a different presenter before preparing the final render.')
pub.mkdir(exist_ok=True)
shutil.copy2(j / 'avatar_enhanced.mp4', pub / 'avatar.mp4')
words = json.loads((j / 'captions.json').read_text())
# Merge hyphen fragments and retain the spoken time of each displayed word.
merged = []
for w in words:
    text = w['text'].strip()
    if text.lower().strip(',.!?') == 'projects': text = text.upper()
    if text.lower().strip(',.!?') in ('jobkit', 'job-kit'): text = 'JOBKIT'
    if text.startswith('-') and merged:
        merged[-1]['text'] += text
        merged[-1]['end'] = w['endMs'] / 1000
    else:
        merged.append({'text': text, 'start': w['startMs'] / 1000, 'end': w['endMs'] / 1000})
phrases, group = [], []
for word in merged:
    group.append(word)
    if len(group) >= 3 or word['text'].endswith(('.', ',', '?', '!')):
        phrases.append({'start':group[0]['start'], 'end':group[-1]['end'], 'text':' '.join(w['text'] for w in group), 'words':group})
        group = []
if group: phrases.append({'start':group[0]['start'], 'end':group[-1]['end'], 'text':' '.join(w['text'] for w in group), 'words':group})
beats, cursor = [0], 0
for anchor in anchors:
    i = next(i for i in range(cursor,len(words)) if re.sub(r'[^A-Za-z]','',words[i]['text']).lower() == anchor.lower())
    beats.append(words[i]['startMs'] / 1000)
    cursor = i + 1
cuts = [c['at_ms']/1000 for c in json.loads((j/'cuts.json').read_text())['cuts']]
beats = [min(cuts,key=lambda c:abs(c-b)) if cuts and min(abs(c-b) for c in cuts)<0.12 else b for b in beats]
beats[0]=0
duration = audio.probe_duration(j / 'avatar_enhanced.mp4')
audio.make_music('glow', duration_s=duration+1, out_wav=j/'music.wav')
shutil.copy2(j/'music.wav',pub/'music.wav')
props = {'avatar': public+'/avatar.mp4', 'duration':duration, 'beats':beats,'captions':phrases,'draftMode':False}
if kind == 'projects':props.update(cuts=cuts,music=public+'/music.wav')
else:props.update(docsVideo='job-search/playwright-docs.mp4',avatarPosition='center',music=public+'/music.wav')
(out/'render-props.json').write_text(json.dumps(props,indent=2)+'\n')
def tm(s):
    n=round(s*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
srt='\n\n'.join(f'{i+1}\n{tm(p["start"])} --> {tm(p["end"])}\n{p["text"]}' for i,p in enumerate(phrases))+'\n'
(j/'captions.srt').write_text(srt);(out/'captions.srt').write_text(srt)
print(json.dumps({'duration':duration,'beats':beats,'phrases':len(phrases)},indent=2))
