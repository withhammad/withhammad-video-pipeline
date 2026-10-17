"""Build a Remotion edit.json from word captions and a list of scene templates anchored to spoken words.

Each template names the word (and optional occurrence) that starts it; scene ends are the next scene's start.
Sound effects follow the cuts: a pop on the title, a whoosh ~100 ms before every card change, and a riser that
peaks on the end card. Used by the agent session after every new avatar take (timings change, layout does not).
"""
import json
import re
from pathlib import Path

WHOOSH_LEAD_MS = 100
RISER_MS = 1200


def clean(word):
    return re.sub(r"[^a-z0-9']", '', word.lower())


def find_word(captions, word, after_ms=0, occurrence=1):
    target, seen = clean(word), 0
    for c in captions:
        if c['startMs'] >= after_ms and clean(c['text']) == target:
            seen += 1
            if seen == occurrence:
                return c['startMs']
    raise ValueError(f'anchor word {word!r} not found after {after_ms} ms')


def build(captions, templates, duration_ms, *, emphasis=(), music=None, title_insert=None, sfx_volumes=None):
    """templates: [{'anchor': None|'word', 'occurrence': 1, 'scene': {...without startMs/endMs}}, ...]"""
    vol = {'pop': 0.2, 'whoosh': 0.35, 'riser': 0.3, **(sfx_volumes or {})}
    starts, cursor = [], 0
    for t in templates:
        start = 0 if t.get('anchor') is None else find_word(captions, t['anchor'], cursor, t.get('occurrence', 1))
        starts.append(start)
        cursor = start + 1
    scenes = []
    for i, t in enumerate(templates):
        end = starts[i + 1] if i + 1 < len(templates) else duration_ms
        scenes.append({**t['scene'], 'startMs': starts[i], 'endMs': end})
    sfx = []
    for s in scenes:
        if s['type'] == 'title':
            sfx.append({'src': 'job/sfx_pop.wav', 'atMs': s['startMs'] + 160, 'volume': vol['pop']})
        elif s['type'] == 'end':
            sfx.append({'src': 'job/sfx_riser.wav', 'atMs': max(0, s['startMs'] - RISER_MS), 'volume': vol['riser']})
        else:
            sfx.append({'src': 'job/sfx_whoosh.wav', 'atMs': max(0, s['startMs'] - WHOOSH_LEAD_MS), 'volume': vol['whoosh']})
    inserts = []
    if title_insert and scenes and scenes[0]['type'] == 'title':
        scenes[0]['hideText'] = True
        inserts.append({'src': title_insert, 'startMs': 0, 'endMs': min(5000, scenes[0]['endMs'] + 400), 'alpha': True})
    return {'avatar': 'job/avatar_enhanced.mp4', 'captions': captions, 'emphasis': list(emphasis), 'scenes': scenes,
            'durationMs': duration_ms, 'music': music, 'sfx': sfx, 'inserts': inserts}


def to_srt(captions, max_words=7, max_gap_ms=600):
    """Sentence-ish subtitle cues for platforms (accessibility): <=7 words, split at punctuation and pauses."""
    cues, cur = [], []
    for c in captions:
        if cur and (len(cur) >= max_words or c['startMs'] - cur[-1]['endMs'] > max_gap_ms):
            cues.append(cur); cur = []
        cur.append(c)
        if re.search(r'[.!?,]$', c['text'].strip()) and len(cur) >= 3:
            cues.append(cur); cur = []
    if cur:
        cues.append(cur)
    def ts(ms):
        h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f'{h:02}:{m:02}:{s:02},{ms:03}'
    out = []
    for i, cue in enumerate(cues, 1):
        text = ' '.join(c['text'].strip() for c in cue)
        out.append(f"{i}\n{ts(cue[0]['startMs'])} --> {ts(cue[-1]['endMs'])}\n{text}\n")
    return '\n'.join(out)


def write(job_dir, edit, srt=True):
    job_dir = Path(job_dir)
    (job_dir / 'edit.json').write_text(json.dumps(edit, indent=1))
    if srt:
        (job_dir / 'captions.srt').write_text(to_srt(edit['captions']))
