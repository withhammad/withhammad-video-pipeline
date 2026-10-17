"""Build a Remotion edit.json from word captions and a list of scene templates anchored to spoken words.

Each template names the word (and optional occurrence) that starts it; scene ends are the next scene's start.
Sound effects follow the cuts: a pop on the title, a whoosh ~100 ms before every card change, and a riser that
peaks on the end card. Used by the agent session after every new avatar take (timings change, layout does not).

Jump cuts (app.tighten, cuts.json): cutaways go over them first. A broll scene (full-screen card or screen
recording) that starts or ends within CUTAWAY_SNAP_MS of a cut is moved onto the cut frame, so the head jump
happens under it. Every cut still on the avatar gets a hard (0 ms) scale step that alternates 1.00 / 1.06
(edit.json "jumpCuts"), the standard creator mask for a jump cut. Plan broll scenes on the words around cuts.
"""
import json
import re
from pathlib import Path

WHOOSH_LEAD_MS = 270      # the whoosh sample peaks ~210 ms in; this puts the peak on the cut, not the next word
WHOOSH_TAIL_MS = 60       # the whoosh window [cut-270, cut-60] must be free of speech
RISER_MS = 1200
JUMP_SCALE = 1.06         # alternate 1.00 / 1.06 on visible jump cuts
CUTAWAY_SNAP_MS = 120     # a broll edge this close to a jump cut moves onto it (3 frames at 25 fps)


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


def build(captions, templates, duration_ms, *, emphasis=(), music=None, title_insert=None, sfx_volumes=None,
          speech=None, fps=30, cuts=None):
    """templates: [{'anchor': None|'word', 'occurrence': 1, 'scene': {...without startMs/endMs}}, ...]
    cuts: app.tighten cut list ([{'at_ms', ...}]) on the same timeline as the captions."""
    vol = {'pop': 0.2, 'whoosh': 0.2, 'tick': 0.15, 'riser': 0.3, **(sfx_volumes or {})}
    starts, cursor = [], 0
    for t in templates:
        start = 0 if t.get('anchor') is None else find_word(captions, t['anchor'], cursor, t.get('occurrence', 1))
        starts.append(start)
        cursor = start + 1
    if cuts:
        starts = snap_cutaways(starts, [t['scene']['type'] for t in templates], [c['at_ms'] for c in cuts])
    last_frame_end = -(-duration_ms * fps // 1000) * 1000 / fps + 1   # cover the composition's final frame
    scenes = []
    for i, t in enumerate(templates):
        end = starts[i + 1] if i + 1 < len(templates) else round(last_frame_end)
        scene = {**t['scene'], 'startMs': starts[i], 'endMs': end}
        hl = scene.get('highlight')
        if hl and 'atWord' in hl:   # draw the box as the word is spoken
            hl = dict(hl)
            at = find_word(captions, hl.pop('atWord'), starts[i])
            hl['delayMs'] = max(0, at - starts[i] + hl.pop('offsetMs', 0))
            scene['highlight'] = hl
        scenes.append(scene)
    sfx = []
    for s in scenes:
        if s['type'] == 'title':
            sfx.append({'src': 'job/sfx_pop.wav', 'atMs': s['startMs'] + 160, 'volume': vol['pop']})
        elif s['type'] == 'end' and (s.get('word') or s.get('keyword')):
            sfx.append({'src': 'job/sfx_riser.wav', 'atMs': max(0, s['startMs'] - RISER_MS), 'volume': vol['riser']})
        elif speech is not None and not _quiet_between(speech, s['startMs'] - WHOOSH_LEAD_MS, s['startMs'] - WHOOSH_TAIL_MS):
            continue   # cut inside continuous speech: any SFX would sit on a syllable
        else:
            sfx.append({'src': 'job/sfx_whoosh.wav', 'atMs': max(0, s['startMs'] - WHOOSH_LEAD_MS), 'volume': vol['whoosh']})
    inserts = []
    if title_insert and scenes and scenes[0]['type'] == 'title':
        scenes[0]['hideText'] = True
        # start 0.6 s into the insert so frame 0 (the thumbnail) already shows the title
        inserts.append({'src': title_insert, 'startMs': -600, 'endMs': min(5000, scenes[0]['endMs'] + 400), 'alpha': True})
    edit = {'avatar': 'job/avatar_enhanced.mp4', 'captions': captions, 'emphasis': list(emphasis), 'scenes': scenes,
            'durationMs': duration_ms, 'music': music, 'sfx': sfx, 'inserts': inserts}
    if cuts:
        edit['jumpCuts'] = jump_cuts([c['at_ms'] for c in cuts], scenes, inserts)
    return edit


def snap_cutaways(starts, types, cut_ms, snap_ms=CUTAWAY_SNAP_MS):
    """Scene starts with every broll edge that sits within snap_ms of a jump cut moved onto the cut: a broll that
    starts just after a cut starts on it; a broll that ends just before a cut lasts until it. Order is kept."""
    out = list(starts)
    for i, kind in enumerate(types):
        if kind != 'broll':
            continue
        for at in cut_ms:
            if 0 < out[i] - at <= snap_ms and (i == 0 or at > out[i - 1]):
                out[i] = at
                break
        if i + 1 < len(out):
            for at in cut_ms:
                if 0 < at - out[i + 1] <= snap_ms and (i + 2 >= len(out) or at < out[i + 2]):
                    out[i + 1] = at
                    break
    return out


def jump_cuts(cut_ms, scenes, inserts=(), scale=JUMP_SCALE):
    """[{'atMs', 'scale'}] for every cut the avatar is visible on, alternating scale / 1.0 from the first one.
    Cuts under a broll scene or an opaque insert are hidden already and get no step; so is a cut on the exact
    frame a cutaway ends, because the avatar comes back on the post-cut frame and nobody saw the pre-cut one."""
    def covered(at):
        return (any(s['type'] == 'broll' and s['startMs'] <= at <= s['endMs'] for s in scenes)
                or any(not i.get('alpha') and i['startMs'] <= at <= i['endMs'] for i in inserts))
    out = []
    for at in sorted(cut_ms):
        if not covered(at):
            out.append({'atMs': at, 'scale': scale if len(out) % 2 == 0 else 1.0})
    return out


def _quiet_between(speech, a_ms, b_ms):
    """True when no speech span overlaps [a_ms, b_ms]."""
    return not any(s0 < b_ms and s1 > a_ms for s0, s1 in speech)


def snap_onsets(captions, speech, max_shift_ms=900):
    """Move each word start to the first measured voice onset at or after it (Whisper starts words early
    after pauses), and end a word before a pause instead of across it."""
    out = [dict(c) for c in captions]
    for i, c in enumerate(out):
        prev_end = out[i - 1]['endMs'] if i else 0
        orphan = [s for s in speech if s[0] >= prev_end and s[1] <= c['startMs'] and s[1] - s[0] >= 200]
        if orphan:   # speech nobody was assigned to precedes this word: the word starts there
            c['endMs'] = max(c['endMs'] - (c['startMs'] - orphan[0][0]), orphan[0][0] + 80)
            c['startMs'] = orphan[0][0]
            continue
        for s0, s1 in speech:
            if s1 <= c['startMs']:
                continue
            onset = max(c['startMs'], s0)
            if onset - c['startMs'] <= max_shift_ms and onset < c['endMs']:
                c['startMs'] = onset
            break
        nxt = out[i + 1]['startMs'] if i + 1 < len(out) else None
        for s0, s1 in speech:
            if s0 <= c['startMs'] < s1:
                if c['endMs'] > s1 and (nxt is None or nxt >= s1):
                    c['endMs'] = max(c['startMs'] + 80, s1)
                break
        c['timestampMs'] = (c['startMs'] + c['endMs']) // 2
    return out


def to_srt(captions, duration_ms=None, max_chars=84, line_chars=42, min_cue_ms=800, max_gap_ms=250):
    """Readable subtitle cues: always break at sentence ends and pauses, at commas once a cue has 3+ words,
    wrap to two lines of at most 42 characters, merge cues shorter than 0.8 s, extend the last cue to the end."""
    cues, cur = [], []
    for c in captions:
        text = c['text'].strip()
        if cur:
            joined = ' '.join(x['text'].strip() for x in cur) + ' ' + text
            if len(joined) > max_chars or c['startMs'] - cur[-1]['endMs'] > max_gap_ms:
                cues.append(cur); cur = []
        cur.append(c)
        if re.search(r'[.!?]$', text) or (text.endswith(',') and len(cur) >= 3):
            cues.append(cur); cur = []
    if cur:
        cues.append(cur)
    def split_long(cue):
        if cue[-1]['endMs'] - cue[0]['startMs'] <= 3000 or len(cue) < 4:
            return [cue]
        gaps = [(cue[k]['startMs'] - cue[k - 1]['endMs'], k) for k in range(2, len(cue) - 1)]
        gap, k = max(gaps)
        return split_long(cue[:k]) + split_long(cue[k:]) if gap >= 120 else [cue]
    cues = [part for cue in cues for part in split_long(cue)]
    merged = []
    for cue in cues:
        prev = merged[-1] if merged else None
        short = cue[-1]['endMs'] - cue[0]['startMs'] < min_cue_ms
        fits = prev is not None and len(' '.join(c['text'].strip() for c in prev + cue)) <= max_chars
        sentence_end = prev is not None and re.search(r'[.!?]$', prev[-1]['text'].strip())
        if short and fits and not sentence_end and cue[0]['startMs'] - prev[-1]['endMs'] <= max_gap_ms:
            merged[-1] = prev + cue
        else:
            merged.append(cue)
    def wrap(text):
        if len(text) <= line_chars:
            return text
        words, best = text.split(), None
        for k in range(1, len(words)):
            a, b = ' '.join(words[:k]), ' '.join(words[k:])
            if len(a) <= line_chars and len(b) <= line_chars:
                score = abs(len(a) - len(b))
                best = (score, a, b) if best is None or score < best[0] else best
        return f'{best[1]}\n{best[2]}' if best else text
    def ts(ms):
        ms = int(ms); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
        return f'{h:02}:{m:02}:{s:02},{ms:03}'
    out = []
    for i, cue in enumerate(merged, 1):
        start = cue[0]['startMs']
        if i < len(merged):   # short cues borrow display time from the following gap
            end = max(cue[-1]['endMs'], min(start + min_cue_ms, merged[i][0]['startMs'] - 40))
        else:
            end = cue[-1]['endMs'] if duration_ms is None else max(cue[-1]['endMs'], duration_ms)
        text = wrap(' '.join(c['text'].strip() for c in cue))
        out.append(f"{i}\n{ts(cue[0]['startMs'])} --> {ts(end)}\n{text}\n")
    return '\n'.join(out)


def write(job_dir, edit, srt=True):
    job_dir = Path(job_dir)
    (job_dir / 'edit.json').write_text(json.dumps(edit, indent=1))
    if srt:
        (job_dir / 'captions.srt').write_text(to_srt(edit['captions'], duration_ms=edit['durationMs']))


def apply_overrides(captions, overrides):
    """Hand-measured word timings for a specific take (Whisper is occasionally 200-300 ms off after a fricative).
    overrides: [{'word': 'every', 'occurrence': 1, 'startMs': 13480, 'endMs': 13820}, ...]"""
    out = [dict(c) for c in captions]
    for o in overrides:
        seen = 0
        for c in out:
            if clean(c['text']) == clean(o['word']):
                seen += 1
                if seen == o.get('occurrence', 1):
                    for k in ('startMs', 'endMs'):
                        if k in o:
                            c[k] = o[k]
                    c['timestampMs'] = (c['startMs'] + c['endMs']) // 2
                    break
    return out
