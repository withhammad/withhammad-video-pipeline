"""Prepare an owner-selected English take using the existing audio/caption pipeline."""
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'studio'))
from app import audio, edit_plan, tighten
from app.reel import transcribe_words

job = Path(sys.argv[1]).resolve()
source = job / 'avatar_raw.mp4'
words = transcribe_words(source, 'Hammad, GitHub, AI engineering, RAG, PROJECTS, Claude, Microsoft Playwright, JOBKIT.')
(job / 'captions_raw.json').write_text(json.dumps(words, indent=2))
result = tighten.tighten(source, job / 'avatar.mp4', words, av_offset_ms=-100)
tighten.write_cuts(job, result)
problem = tighten.sync_problem(result.get('sync'), result['fps'], 10.0)
if problem:
    raise RuntimeError(problem)
audio.enhance_voice(job / 'avatar.mp4', job / 'avatar_enhanced.mp4')
speech = audio.voice_activity(job / 'avatar_enhanced.mp4')
words = edit_plan.snap_onsets(result['captions'], speech)
(job / 'captions.json').write_text(json.dumps(words, indent=2))
(job / 'speech.json').write_text(json.dumps(speech, indent=2))
print(json.dumps({'duration': audio.probe_duration(job / 'avatar_enhanced.mp4'),
                  'removed_ms': result['removed_ms'], 'sync': result['sync'],
                  'transcript': ''.join(w['text'] for w in words)}, indent=2))
