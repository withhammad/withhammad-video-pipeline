"""Explainer edit: map a reference replication spec onto OUR avatar timeline and write props for the Remotion
"Explainer" composition (studio/remotion/src/explainer).

  python -m app.edit_explainer build <job_dir> [--cuts 12340,20110] [--stage]
  python -m app.edit_explainer synth <spec.json> <captions_out.json>     # placeholder timings for layout work

Inputs (defaults inside <job_dir>): analysis/spec.json (beats -> units, written from the reference breakdown),
captions.json (word timestamps of OUR take(s): Whisper on avatar_main.mp4, take B words offset by the tail start),
optional cuts.json ([ms, ...] where pause tightening spliced the take). Output: edit_explainer.json.

Mapping, in order:
1. Every beat's spoken line is aligned to the caption words (difflib over normalised tokens, so Whisper slips
   like "MIT license" or "21" do not break it). A beat starts just before its first word and ends where the next
   beat starts: the reference's times are never used as times, only as proportions.
2. Units inside a beat: the reference unit windows give target proportions. The on-screen phrases ("|" in
   on_screen_text) are found in the words and handed, in order, to the units whose targets sit nearest; any unit
   left over snaps to the best word start near its target (clause breaks preferred, sub-0.9 s units avoided).
   A unit can be pinned to a word with unit["anchor"] or anchors={"U21": "one"}.
3. Talking-head bridges stay short like the reference: a breather may run BREATHER_SLACK_MS past the reference
   length (at least BREATHER_MIN_CAP_MS). A small overrun without a clause break stays whole; otherwise the
   overflow (two words or more) becomes a split scene (facecam + the incoming recording) when it is long, or the
   next card simply arrives mid-phrase.
4. Jump cuts (cuts): recordings are placed over them first (the nearest recording scene is extended across the
   cut); a cut left inside a talking head splits that scene and the framing alternates punch 1.00 / 1.06.
5. Recording speed is fitted last, from the final scene lengths ("speed to fit", "a-b s" ranges, "from X s").
Standard library only.
"""
import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

STUDIO = Path(__file__).resolve().parents[1]
REMOTION = STUDIO / 'remotion'

LEAD_MS = 80               # a cut lands this far before the first word of the next phrase
BREATHER_SLACK_MS = 400    # a talking-head bridge may run this much longer than the reference's
BREATHER_MIN_CAP_MS = 1800 # ...and always at least this long (the reference's bridges run 0.8-1.9 s)
MIN_UNIT_MS = 900          # units shorter than this are avoided when a boundary is chosen
KEEP_WHOLE_MS = 700        # a bridge overrunning by less than this (with no clause break) stays whole
SPLIT_MIN_MS = 600         # a longer bridge overflow becomes a split (facecam + incoming card)
COVER_MS = 700             # a jump cut this close to a recording scene is hidden by extending that recording
COVER_PAD_MS = 120         # the recording reaches this far past the cut
MIN_SCENE_MS = 400
END_HOLD_MS = 900          # after the last word
ENDCARD_MIN_MS = 2200      # the end card's typing needs this long
WHOOSH_LEAD_MS = 270       # whoosh peak lands on the cut (same calibration as edit_plan)
WHOOSH_TAIL_MS = 60
RISER_MS = 1200
PUNCH = (1, 1.06)

STAT_GREEN = '#9EC96E'
DEEP_GREEN = '#50771A'
ARROW_RED = '#E5484D'
CANVAS = ('card', 'stat', 'text')

# ----------------------------------------------------------------------------------------------- text helpers

_ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen ' \
        'seventeen eighteen nineteen'.split()
_TENS = ' ten twenty thirty forty fifty sixty seventy eighty ninety'.split(' ')


def num_words(n):
    """English words for 0 <= n < 10000 (Whisper writes "21" where the script says "twenty-one")."""
    if n < 20:
        return _ONES[n]
    if n < 100:
        return _TENS[n // 10] + ('' if n % 10 == 0 else ' ' + _ONES[n % 10])
    if n < 1000:
        return _ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + num_words(n % 100))
    if n % 1000 and 1100 <= n < 2000 and n % 100 == 0:          # 1500 -> fifteen hundred
        return num_words(n // 100) + ' hundred'
    return num_words(n // 1000) + ' thousand' + ('' if n % 1000 == 0 else ' ' + num_words(n % 1000))


def tokens(text):
    """Normalised word tokens: lower case, hyphens split, digits spelled out, markup dropped."""
    text = re.sub(r'(\d),(\d{3})', r'\1\2', text.lower()).replace('-', ' ').replace('–', ' ')
    out = []
    for t in re.findall(r"[a-z0-9']+", text):
        t = t.strip("'")
        if t.isdigit() and int(t) < 10000:
            out.extend(num_words(int(t)).split())
        elif t:
            out.append(t)
    return out


def clean(word):
    return re.sub(r"[^a-z0-9']", '', word.lower().replace(',', ''))


_NUM_VALUE = {w: i for i, w in enumerate(_ONES)}
_NUM_VALUE.update({w: 10 * i for i, w in enumerate(_TENS) if w})


def _word_value(core):
    parts = core.lower().split('-')
    if len(parts) == 2 and parts[0] in _NUM_VALUE and parts[1] in _NUM_VALUE and _NUM_VALUE[parts[0]] >= 20 and _NUM_VALUE[parts[1]] < 10:
        return _NUM_VALUE[parts[0]] + _NUM_VALUE[parts[1]]
    return _NUM_VALUE.get(core.lower()) if len(parts) == 1 else None


def display_words(caps, keyword=''):
    """Caption words as shown on screen: numbers above ten become digits ("twenty-one" -> 21, "fifteen hundred"
    -> 1,500); small numbers ("one job", "three rules") and the keyword after "comment" stay words."""
    out, i, kw = [], 0, clean(keyword)
    while i < len(caps):
        c = caps[i]
        text = c['text'].strip()
        m = re.match(r"^(\W*)([A-Za-z][A-Za-z-]*)(\W*)$", text)
        keyword_use = kw and clean(m.group(2)) == kw and i > 0 and clean(caps[i - 1]['text']) == 'comment' if m else False
        if m and not keyword_use:
            value = _word_value(m.group(2))
            nxt = caps[i + 1]['text'].strip() if i + 1 < len(caps) else ''
            nm = re.match(r"^(hundred)(\W*)$", nxt, re.I)
            if value is not None and 10 < value < 100 and nm and not m.group(3):
                out.append({'text': f'{m.group(1)}{value * 100:,}{nm.group(2)}', 'startMs': c['startMs'], 'endMs': caps[i + 1]['endMs'], '_i': i})
                i += 2
                continue
            if value is not None and value > 10:
                text = f'{m.group(1)}{value}{m.group(3)}'
        out.append({'text': text, 'startMs': c['startMs'], 'endMs': c['endMs'], '_i': i})
        i += 1
    return out


def _quoted(text):
    return re.findall(r'"([^"]+)"', text or '')


# ----------------------------------------------------------------------------------------------- alignment

def align_beats(beats, caps):
    """[(first_cap_index, last_cap_index)] per beat, via a difflib alignment of script tokens to caption tokens."""
    script, owner_s = [], []
    for b, beat in enumerate(beats):
        for t in tokens(beat['line']):
            script.append(t)
            owner_s.append(b)
    cap_toks, owner_c = [], []
    for i, c in enumerate(caps):
        for t in tokens(c['text']):
            cap_toks.append(t)
            owner_c.append(i)
    sm = difflib.SequenceMatcher(None, script, cap_toks, autojunk=False)
    hits = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            hits.setdefault(owner_s[a + k], []).append(owner_c[b + k])
    spans, last = [], -1
    for b, beat in enumerate(beats):
        got = [i for i in hits.get(b, []) if i > last]
        if not got:
            raise ValueError(f"beat {beat.get('name', b)!r}: none of its words were found in the captions")
        spans.append((min(got), max(got)))
        last = max(got)
    return spans


def _cut_before(caps, i):
    """Boundary time for a cut placed just before caption word i."""
    start = caps[i]['startMs']
    prev_end = caps[i - 1]['endMs'] if i > 0 else 0
    return min(start, max(prev_end, start - LEAD_MS))


def _phrase_starts(beat, caps, a, b):
    """Sorted caption indices where the beat's on-screen phrases begin (the first phrase is the beat start)."""
    phrases = [p for p in (beat.get('on_screen_text') or '').split('|') if p.strip()]
    found, cursor = [], a + 1
    for p in phrases[1:]:
        want = tokens(p.replace('*', ''))
        if not want:
            continue
        hit = None
        for i in range(cursor, b + 1):
            if clean(caps[i]['text']) and tokens(caps[i]['text'])[:1] == want[:1]:
                follow = [t for j in range(i + 1, min(b + 1, i + 4)) for t in tokens(caps[j]['text'])]
                if len(want) == 1 or want[1] in follow or hit is None:
                    hit = i
                    if len(want) == 1 or want[1] in follow:
                        break
        if hit is None:
            continue
        # A phrase that starts mid-clause ("It's eleven ...", "and it ranks ...") moves back to the clause start.
        if not re.search(r'[.!?:;,]$', caps[hit - 1]['text'].strip()):
            for back in (1, 2):
                j = hit - back
                if j <= a:
                    break
                if re.search(r'[.!?:;,]$', caps[j - 1]['text'].strip()):
                    hit = j
                    break
        found.append(hit)
        cursor = hit + 1
    return found


def monotone_match(small, large):
    """Strictly increasing assignment of every value in `small` to an index of `large` (len(large) >= len(small))
    minimising the summed absolute distance. Returns the chosen indices."""
    m, n = len(small), len(large)
    inf = float('inf')
    cost = [[inf] * n for _ in range(m)]
    back = [[-1] * n for _ in range(m)]
    for j in range(n):
        cost[0][j] = abs(small[0] - large[j])
    for i in range(1, m):
        best, arg = inf, -1
        for j in range(n):
            if j - 1 >= 0 and cost[i - 1][j - 1] < best:
                best, arg = cost[i - 1][j - 1], j - 1
            if best < inf:
                cost[i][j] = best + abs(small[i] - large[j])
                back[i][j] = arg
    j = min(range(n), key=lambda k: cost[m - 1][k])
    out = [j]
    for i in range(m - 1, 0, -1):
        j = back[i][j]
        out.append(j)
    return out[::-1]


def _find_word(caps, word, lo, hi, occurrence=1):
    seen = 0
    for i in range(lo, hi + 1):
        if clean(caps[i]['text']) == clean(word):
            seen += 1
            if seen == occurrence:
                return i
    return None


def _unit_boundaries(beat, caps, a, b, t0, t1, anchors):
    """Caption indices where units 2..n of the beat start.

    Order of authority: anchors (unit["anchor"] or anchors[id]) > on-screen phrase starts (each phrase start is
    given to the unit whose reference start is nearest, keeping order) > the best word start near the unit's
    proportional target (clause breaks preferred, units shorter than MIN_UNIT_MS avoided)."""
    units = beat['units']
    n = min(len(units), b - a + 1)
    if n <= 1:
        return []
    ref0, ref1 = beat['ref_window']
    span = max(1e-6, ref1 - ref0)
    target = {j: t0 + (units[j]['t'][0] - ref0) / span * (t1 - t0) for j in range(1, n)}
    fixed, cursor = {}, a + 1
    for j in range(1, n):
        anchor = anchors.get(units[j]['id']) or units[j].get('anchor')
        if anchor:
            word, occ = (anchor['word'], anchor.get('occurrence', 1)) if isinstance(anchor, dict) else (anchor, 1)
            hit = _find_word(caps, word, cursor, b, occ)
            if hit is not None:
                fixed[j] = hit
                cursor = hit + 1
    phrases = _phrase_starts(beat, caps, a, b)
    keys = [0] + sorted(fixed) + [n]
    idx = {0: a, **fixed}
    for j0, j1 in zip(keys, keys[1:]):
        free = list(range(j0 + 1, j1))
        lo = idx[j0] + 1
        hi = fixed[j1] - 1 if j1 < n else b
        ph = [p for p in phrases if lo <= p <= hi]
        if not free or not ph:
            continue
        ph_t = [_cut_before(caps, p) for p in ph]
        un_t = [target[u] for u in free]
        if len(ph) <= len(free):
            for k, u in enumerate(monotone_match(ph_t, un_t)):
                idx[free[u]] = ph[k]
        else:
            for k, p in enumerate(monotone_match(un_t, ph_t)):
                idx[free[k]] = ph[p]
    chosen, prev = [], a
    for j in range(1, n):
        if j in idx:
            pick = max(idx[j], prev + 1)
        else:
            nxt_fixed = next((idx[k] for k in range(j + 1, n) if k in idx), b + 1)
            gap_units = next((k for k in range(j + 1, n) if k in idx), n) - j
            lo, hi = prev + 1, min(b, nxt_fixed - gap_units)
            if lo > hi:
                break
            best = None
            prev_at = t0 if prev == a else _cut_before(caps, prev)
            next_at = (_cut_before(caps, nxt_fixed) if nxt_fixed <= b else t1) if gap_units == 1 else None
            for i in range(lo, hi + 1):
                prev_text = caps[i - 1]['text'].strip()
                penalty = 0.08 if re.search(r'[.!?:;,]$', prev_text) else 0.25
                at = _cut_before(caps, i)
                if at - prev_at < MIN_UNIT_MS:      # a unit too short to read (e.g. "Script:" alone)
                    penalty += 0.5
                if next_at is not None and next_at - at < MIN_UNIT_MS:
                    penalty += 0.5
                cost = abs(at - target[j]) / max(1, t1 - t0) + penalty
                if best is None or cost < best[0]:
                    best = (cost, i)
            pick = best[1]
        if pick > b:
            break
        chosen.append(pick)
        prev = pick
    return chosen


# ----------------------------------------------------------------------------------------------- unit -> scene

def _scene_type(unit):
    t = unit['type'].lower()
    if 'end card' in t:
        return 'endcard'
    if t.startswith('avatar +') or t.startswith('avatar+'):
        return 'split' if unit.get('screenrec') else 'avatar'
    if t.startswith('avatar'):
        return 'avatar'
    if 'recording' in t and 'stat' in t:
        return 'stat'
    if 'recording' in t:
        return 'card'
    if 'text card' in t:
        return 'text'
    return 'avatar'


def _recording_plan(unit, durations):
    """{'src', 'inMs', 'fit', 'outMs', 'durationMs'} from the unit's screenrec id and its "use" text."""
    rid = unit.get('screenrec')
    if not rid:
        return None
    use = unit.get('use') or ''
    dur = durations.get(rid)
    plan = {'src': f'job/shots/{rid}.mp4', 'inMs': 0, 'fit': None, 'outMs': None, 'durationMs': round(dur) if dur else None}
    rng = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s\b', use)
    frm = re.search(r'\bfrom (\d+(?:\.\d+)?)\s*s\b', use)
    if frm:
        plan['inMs'] = round(float(frm.group(1)) * 1000)
    elif rng:
        plan.update(inMs=round(float(rng.group(1)) * 1000), outMs=round(float(rng.group(2)) * 1000), fit='range')
    if re.search(r'speed to fit|\bwhole\b', use):
        plan['fit'] = 'whole'
    pop = re.search(r'Remotion pops .*? at (\d+(?:\.\d+)?)x', use)
    if pop:
        plan['pushIn'] = float(pop.group(1))
    return plan


def _overlay(unit, scene_type):
    text = unit.get('overlay') or ''
    if not text:
        return None
    low, quoted = text.lower(), _quoted(text)
    if scene_type == 'stat' and quoted:
        return {'kind': 'stat', 'text': quoted[0], 'color': STAT_GREEN, 'y': 0.70}
    if 'arrow' in low:
        return {'kind': 'arrow', 'text': quoted[0] if quoted else '', 'color': ARROW_RED, 'y': 0.865}
    if 'giant' in low and 'serif' in low and quoted:
        return {'kind': 'bigtext', 'text': quoted[0], 'color': DEEP_GREEN, 'y': 0.11}
    numbered = [q for q in quoted if re.match(r'\d+\s', q)]
    if numbered:
        return {'kind': 'chip', 'text': '\n'.join(numbered), 'y': 0.16, 'align': 'right'}
    if 'chip' in low and quoted:
        return {'kind': 'chip', 'text': quoted[0], 'y': 0.865}
    return None


def _items(unit):
    footage = unit.get('footage') or ''
    cmds = re.findall(r'(/[a-z]+-[a-z]+)', footage)
    groups = re.findall(r'\(([^()]*,[^()]*)\)', footage)
    labels = [x.strip() for x in groups[-1].split(',')] if groups else []
    if not cmds:
        return None
    return [{'label': c, **({'sub': labels[i]} if len(labels) == len(cmds) else {})} for i, c in enumerate(cmds)]


def _label(unit):
    m = re.search(r'/skills/([a-z]+-[a-z]+)/', unit.get('footage') or '')
    return '/' + m.group(1) if m else None


# ----------------------------------------------------------------------------------------------- probing

def probe_ms(path):
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of',
                              'default=noprint_wrappers=1:nokey=1', str(path)], capture_output=True, text=True, timeout=60)
        return float(out.stdout.strip()) * 1000 if out.returncode == 0 and out.stdout.strip() else None
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def recording_durations(job_dir, spec, probe=probe_ms):
    """Source length per recording id: the real file in <job>/shots, else the spec's test length."""
    out = {k: v * 1000 for k, v in ((spec.get('screenrec') or {}).get('test_durations_s') or {}).items()}
    shots = Path(job_dir) / 'shots'
    if shots.is_dir():
        for f in shots.glob('*.mp4'):
            ms = probe(f)
            if ms:
                out[f.stem] = ms
    return out


# ----------------------------------------------------------------------------------------------- build

def _load(x):
    if isinstance(x, (str, Path)):
        return json.loads(Path(x).read_text())
    return x


def _quiet(spans, a_ms, b_ms):
    return not any(s0 < b_ms and s1 > a_ms for s0, s1 in spans)


def build_props(job_dir, spec_json, captions_json, cuts=None, *, avatar='job/avatar_main.mp4', tail=None,
                tail_start_ms=None, loop=False, anchors=None, durations=None, probe=probe_ms, music=True,
                speech=None, duration_ms=None):
    """Props for the Explainer composition. spec_json / captions_json: paths or already-loaded objects.
    cuts: ms on our timeline where the take was spliced. tail: src of the second look (beats from the unit typed
    "second setup" on); tail_start_ms: where take B starts on the timeline (default: that beat's cut)."""
    job_dir = Path(job_dir)
    spec = _load(spec_json)
    raw = _load(captions_json)
    raw = raw['words'] if isinstance(raw, dict) else raw
    caps = [c for c in raw if c['text'].strip()]
    if not caps:
        raise ValueError('captions are empty')
    keyword = spec.get('keyword') or ''
    anchors = dict(anchors or {})
    if durations is None:
        durations = recording_durations(job_dir, spec, probe)
    beats = spec['beats']
    spans = align_beats(beats, caps)

    last_end = caps[-1]['endMs']
    total = duration_ms or last_end + END_HOLD_MS
    starts = [0] + [_cut_before(caps, a) for a, _ in spans[1:]]
    ends = starts[1:] + [total]
    # Words between beats belong to the earlier beat: beat k covers caption indices [a_k, a_{k+1}).
    word_ranges = [(spans[k][0] if k else 0, (spans[k + 1][0] - 1) if k + 1 < len(spans) else len(caps) - 1) for k in range(len(beats))]

    scenes = []
    for k, beat in enumerate(beats):
        a, b = word_ranges[k]
        t0, t1 = starts[k], ends[k]
        bounds = _unit_boundaries(beat, caps, a, b, t0, t1, anchors)
        unit_starts = [t0] + [_cut_before(caps, i) for i in bounds]
        units = beat['units'][:len(unit_starts)]
        for j, unit in enumerate(units):
            st = _scene_type(unit)
            scene = {'id': unit['id'], 'type': st, 'startMs': unit_starts[j],
                     'endMs': unit_starts[j + 1] if j + 1 < len(unit_starts) else t1,
                     '_beat': beat.get('name', str(k)), '_beat_t0': t0, '_ref_ms': round((unit['t'][1] - unit['t'][0]) * 1000),
                     '_unit': unit}
            if st == 'avatar':
                scene['system'] = 'hook' if k == 0 else 'talk'
                if k == 0 and j == 0:
                    scene['flipIn'] = True
            elif st != 'endcard':
                scene['system'] = 'explainer'
            plan = _recording_plan(unit, durations)
            if plan and st in ('card', 'stat', 'split', 'text'):
                scene['_rec'] = plan
            text_all = ' '.join(str(unit.get(x) or '') for x in ('use', 'footage'))
            if re.search(r'slides? up from the bottom', text_all, re.I):
                scene['cardSlide'] = 'up'
            ov = _overlay(unit, st)
            if st == 'endcard':
                pill = _quoted(unit.get('footage'))
                ov = {'kind': 'chip', 'text': pill[0] if pill else 'FREE GUIDE'}
            if ov:
                scene['overlay'] = ov
            if st == 'text':
                items = _items(unit)
                if items:
                    scene['items'] = items
            label = _label(unit)
            if label and st in ('card', 'stat', 'split'):
                scene['label'] = label
            scenes.append(scene)

    # The second look starts at its beat's cut (or where the caller says take B starts).
    tail_obj = None
    tail_idx = next((i for i, s in enumerate(scenes) if 'second setup' in s['_unit']['type'].lower()), None)
    if tail and tail_idx is not None:
        ts = scenes[tail_idx]['startMs'] if tail_start_ms is None else tail_start_ms
        if tail_start_ms is not None and tail_idx > 0:
            scenes[tail_idx - 1]['endMs'] = scenes[tail_idx]['startMs'] = ts
        tail_obj = {'src': tail, 'startMs': ts, **({'loop': True} if loop else {})}
    tail_ms = tail_obj['startMs'] if tail_obj else None

    scenes = _cap_breathers(scenes, caps, tail_ms)
    scenes = _cover_cuts(scenes, sorted(cuts or []))
    if scenes[-1]['type'] == 'endcard' and scenes[-1]['endMs'] - scenes[-1]['startMs'] < ENDCARD_MIN_MS:
        scenes[-1]['endMs'] = scenes[-1]['startMs'] + ENDCARD_MIN_MS
    total = scenes[-1]['endMs']
    for s in scenes:
        _finish_recording(s)

    words = display_words(caps, keyword)
    _flag_emphasis(words, beats, word_ranges)
    for s in scenes:
        ov = s.get('overlay')
        if ov and ov['kind'] == 'chip' and '\n' in ov['text']:
            ov['itemsAtMs'] = _spoken_number_times(ov['text'], words, s)

    cta = None
    cta_k = next((k for k, b in enumerate(beats) if 'cta' in b.get('name', '')), None)
    lo, hi = (starts[cta_k], ends[cta_k]) if cta_k is not None else (0, total)
    hit = next((w for w in words if clean(w['text']) == 'comment' and lo <= w['startMs'] < hi), None) \
        or next((w for w in words if clean(w['text']) == 'comment'), None)
    if keyword and hit:
        cta = {'keyword': keyword, 'atMs': hit['startMs'], 'handle': 'with.hammad', 'reply': 'Here you go!'}

    spans_ms = speech if speech is not None else [(w['startMs'], w['endMs']) for w in words]
    props = {
        'avatar': {'src': avatar, **({'loop': True} if loop else {})},
        'tail': tail_obj,
        'scenes': [{k: v for k, v in s.items() if not k.startswith('_')} for s in scenes],
        'captions': {'words': [{k: v for k, v in w.items() if not k.startswith('_')} for w in words]},
        'music': {'src': 'job/music.wav', 'volume': 0.12, 'duckTo': 0.07, 'fadeOutMs': 600} if music else None,
        'sfx': _sfx(scenes, cta, spans_ms),
        'cta': cta,
        'durationMs': total,
        'meta': {'job': spec.get('job'), 'beats': [{'name': b.get('name'), 'startMs': starts[k], 'endMs': ends[k]} for k, b in enumerate(beats)],
                 'cuts': sorted(cuts or [])},
    }
    return props


def _cap_breathers(scenes, caps, tail_ms):
    """Bridge breathers (talking head between graphics) run at most the reference length + slack."""
    out = []
    i = 0
    while i < len(scenes):
        s = scenes[i]
        nxt = scenes[i + 1] if i + 1 < len(scenes) else None
        bridge = (s['type'] == 'avatar' and not s.get('flipIn') and nxt is not None and nxt['type'] in CANVAS + ('split',)
                  and 'cta' not in s['_beat'] and (tail_ms is None or s['startMs'] < tail_ms))
        cap = max(s['_ref_ms'] + BREATHER_SLACK_MS, BREATHER_MIN_CAP_MS)
        if bridge and s['endMs'] - s['startMs'] > cap:
            limit = s['startMs'] + cap
            # Cut candidates inside the breather: word starts that leave at least two words for the graphic,
            # best at a clause break, else the latest one.
            def words_after(t):
                return sum(1 for c in caps if t <= c['startMs'] < s['endMs'])
            cands = [(k, _cut_before(caps, k)) for k in range(1, len(caps))]
            cands = [(k, t) for k, t in cands if s['startMs'] + MIN_SCENE_MS <= t <= limit and words_after(t) >= 2]
            clause = [(k, t) for k, t in cands if re.search(r'[.!?:;,]$', caps[k - 1]['text'].strip())]
            _, cut = (clause or cands)[-1] if cands else (None, limit)
            excess = s['endMs'] - cut
            n_words = words_after(cut)
            # No usable cut, or a small overrun without a clause break: keep the bridge whole.
            if not cands or (not clause and excess < KEEP_WHOLE_MS):
                out.append(s)
                i += 1
                continue
            if excess >= SPLIT_MIN_MS and n_words >= 2 and nxt.get('_rec'):
                rec = dict(nxt['_rec'])
                rec['fit'], rec['outMs'] = None, None
                split = {'id': f"{nxt['id']}-split", 'type': 'split', 'startMs': cut, 'endMs': s['endMs'], 'system': 'explainer',
                         '_beat': nxt['_beat'], '_beat_t0': nxt['_beat_t0'], '_ref_ms': 0, '_unit': nxt['_unit'], '_rec': rec}
                for key in ('label', 'cardSlide'):     # the card enters with the split; the full card then morphs from it
                    if nxt.get(key):
                        split[key] = nxt[key]
                nrec = dict(nxt['_rec'])
                nrec['inMs'] = nrec['inMs'] + excess
                nxt['_rec'] = nrec
                s['endMs'] = cut
                out += [s, split]
                i += 1
                continue
            s['endMs'] = nxt['startMs'] = cut
        out.append(s)
        i += 1
    return out


def _covers(s):
    return s is not None and s['type'] in CANVAS


def _cover_cuts(scenes, cuts):
    """Hide jump cuts under recordings first; split the talking head (alternating punch) where none can reach."""
    for c in cuts:
        k = next((i for i, s in enumerate(scenes) if s['startMs'] <= c < s['endMs']), None)
        if k is None or scenes[k]['type'] not in ('avatar', 'split'):
            continue
        s = scenes[k]
        prev = scenes[k - 1] if k > 0 else None
        nxt = scenes[k + 1] if k + 1 < len(scenes) else None
        if _covers(prev) and c - s['startMs'] <= COVER_MS and s['endMs'] - (c + COVER_PAD_MS) >= MIN_SCENE_MS:
            prev['endMs'] = s['startMs'] = c + COVER_PAD_MS
            continue
        if _covers(nxt) and s['endMs'] - c <= COVER_MS and (c - COVER_PAD_MS) - s['startMs'] >= MIN_SCENE_MS:
            s['endMs'] = nxt['startMs'] = c - COVER_PAD_MS
            continue
        toggled = PUNCH[1] if s.get('punch', 1) == PUNCH[0] else PUNCH[0]
        if c - s['startMs'] < MIN_SCENE_MS and prev is not None and prev['type'] == 'avatar':
            # Too close to the previous cut for its own shot: the previous talking head runs to the jump cut.
            prev['endMs'] = s['startMs'] = c
            if s['type'] == 'avatar' and s.get('punch', 1) == prev.get('punch', 1):
                s['punch'] = PUNCH[1] if prev.get('punch', 1) == PUNCH[0] else PUNCH[0]
            continue
        if s['endMs'] - c < MIN_SCENE_MS and nxt is not None and nxt['type'] == 'avatar':
            s['endMs'] = nxt['startMs'] = c
            if nxt.get('punch', 1) == s.get('punch', 1):
                nxt['punch'] = toggled
            continue
        second = {**s, 'startMs': c, 'id': f"{s['id']}b"}
        second.pop('flipIn', None)
        second.pop('overlay', None)
        if second.get('_rec'):      # a split cut in two: its recording keeps running across the jump cut
            second['_rec'] = {**second['_rec'], 'inMs': second['_rec']['inMs'] + (c - s['startMs']), 'fit': None, 'outMs': None}
        if s['type'] == 'avatar':
            second['punch'] = toggled
        s['endMs'] = c
        scenes.insert(k + 1, second)
    for s in scenes:
        if s.get('punch') == 1:
            s.pop('punch')
    return scenes


def _finish_recording(s):
    plan = s.pop('_rec', None)
    if not plan:
        return
    dur = max(1, s['endMs'] - s['startMs'])
    src_len = plan.get('durationMs')
    rate = 1.0
    if plan['fit'] == 'range' and plan['outMs']:
        rate = (plan['outMs'] - plan['inMs']) / dur
    elif plan['fit'] == 'whole' and src_len:
        rate = (src_len - plan['inMs']) / dur
    elif src_len and src_len - plan['inMs'] < dur:
        rate = (src_len - plan['inMs']) / dur
    rate = round(min(2.5, max(0.6, rate)), 3)
    rec = {'src': plan['src'], 'inMs': plan['inMs']}
    if rate != 1.0:
        rec['playbackRate'] = rate
    if src_len:
        rec['durationMs'] = src_len
    if plan.get('pushIn'):
        rec['pushIn'] = {'atMs': round(dur * 0.55), 'scale': plan['pushIn'], 'originX': 0.5, 'originY': 0.55}
    s['recording'] = rec


def _flag_emphasis(words, beats, word_ranges):
    """em on the words of each beat's emphasis phrases (matched in order inside the beat)."""
    def norm(t):
        return clean(t).replace("'", '')
    for k, beat in enumerate(beats):
        lo, hi = word_ranges[k]
        beat_words = [w for w in words if lo <= w['_i'] <= hi]
        for phrase in beat.get('emphasis') or []:
            want = [norm(t) for t in phrase.replace(',', '').split() if norm(t)]
            if not want:
                continue
            for i in range(len(beat_words) - len(want) + 1):
                if [norm(w['text']) for w in beat_words[i:i + len(want)]] == want:
                    for w in beat_words[i:i + len(want)]:
                        w['em'] = True
                    break


def _spoken_number_times(text, words, scene):
    """Per-chip pop times: chip "2 ..." pops when its number is said as a list marker ("Two:") in the beat;
    a number said before the scene pops at the scene start; never said: a 160 ms stagger."""
    out = []
    for n, line in enumerate(text.split('\n')):
        m = re.match(r'(\d+)\s', line)
        want = num_words(int(m.group(1))) if m else None
        cands = [w for w in words if want and clean(w['text']) == want and scene['_beat_t0'] <= w['startMs'] < scene['endMs']]
        pool = [w for w in cands if w['text'].strip().endswith(':')] or cands
        later = [w for w in pool if w['startMs'] >= scene['startMs']]
        hit = later[0] if later else (pool[-1] if pool else None)
        out.append(max(0, hit['startMs'] - scene['startMs']) if hit else 450 + n * 160)
    return out


def _sfx(scenes, cta, spans):
    out = []
    for i, s in enumerate(scenes):
        prev = scenes[i - 1] if i else None
        enters_graphics = prev is not None and s['type'] in CANVAS + ('split',) and (prev['type'] in ('avatar', 'split') or
                                                                                    (s.get('recording') or {}).get('src') != (prev.get('recording') or {}).get('src'))
        if enters_graphics and _quiet(spans, s['startMs'] - WHOOSH_LEAD_MS, s['startMs'] - WHOOSH_TAIL_MS):
            out.append({'src': 'job/sfx_whoosh.wav', 'atMs': max(0, s['startMs'] - WHOOSH_LEAD_MS), 'volume': 0.18})
        ov = s.get('overlay')
        if ov and s['type'] != 'endcard':
            at = ov.get('atMs', {'stat': 150, 'chip': 450, 'arrow': 350, 'bigtext': 0}[ov['kind']])
            out.append({'src': 'job/sfx_pop.wav', 'atMs': s['startMs'] + at, 'volume': 0.16})
        if s['type'] == 'endcard':
            out.append({'src': 'job/sfx_riser.wav', 'atMs': max(0, s['startMs'] - RISER_MS), 'volume': 0.22})
    if cta:
        out.append({'src': 'job/sfx_tick.wav', 'atMs': cta['atMs'] + 350, 'volume': 0.12})
    return sorted(out, key=lambda x: x['atMs'])


# ----------------------------------------------------------------------------------------------- dev captions

def synth_captions(spec, wpm=196.0, tail_gap_ms=500, start_ms=120):
    """PLACEHOLDER word timings for the spec's script (layout work before the real take exists): each word gets
    time in proportion to its length at `wpm`, plus HeyGen-like pauses after punctuation. Never ship these."""
    spec = _load(spec)
    per_word = 60000.0 / wpm
    take_b = str(((spec.get('heygen') or {}).get('take_B') or {}).get('beats') or '')
    tail_beats = {int(x) - 1 for x in re.findall(r'\d+', take_b)}
    words, t = [], float(start_ms)
    for k, beat in enumerate(spec['beats']):
        if k in tail_beats and k - 1 not in tail_beats and words:
            t += tail_gap_ms
        line = beat['line'].split()
        weights = [0.55 + 0.45 * min(2.0, len(re.sub(r'\W', '', w)) / 5) for w in line]
        scale = per_word * len(line) / sum(weights)
        for w, wt in zip(line, weights):
            d = wt * scale
            words.append({'text': (' ' if words else '') + w, 'startMs': round(t), 'endMs': round(t + d * 0.92),
                          'timestampMs': round(t + d / 2), 'confidence': 1.0})
            t += d
            if re.search(r'[.!?]$', w):
                t += 380
            elif re.search(r'[,:;]$', w):
                t += 200
    return words


# ----------------------------------------------------------------------------------------------- CLI

def stage(job_dir, props):
    """Copy every asset the props reference from the job into studio/remotion/public/job/."""
    job_dir, pub = Path(job_dir), REMOTION / 'public'
    audio_dir = job_dir / 'audio'
    beds = sorted(audio_dir.glob('music_*.wav')) if audio_dir.is_dir() else []
    sources = {'job/avatar_main.mp4': job_dir / 'avatar_main.mp4', 'job/avatar_wait.mp4': job_dir / 'avatar_wait.mp4',
               'job/music.wav': beds[0] if beds else None}
    for kind in ('whoosh', 'pop', 'tick', 'riser'):
        sources[f'job/sfx_{kind}.wav'] = audio_dir / f'sfx_{kind}.wav'
    wanted = {props['avatar']['src']} | ({props['tail']['src']} if props.get('tail') else set())
    wanted |= {s['recording']['src'] for s in props['scenes'] if s.get('recording')}
    wanted |= {x['src'] for x in props.get('sfx') or []} | ({props['music']['src']} if props.get('music') else set())
    copied = []
    for src in sorted(wanted):
        origin = sources.get(src) or (job_dir / 'shots' / Path(src).name if src.startswith('job/shots/') else None)
        if origin and Path(origin).exists():
            (pub / src).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(origin, pub / src)
            copied.append(src)
    return copied


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('build', help='write <job>/edit_explainer.json')
    b.add_argument('job')
    b.add_argument('--spec', help='default <job>/analysis/spec.json')
    b.add_argument('--captions', help='default <job>/captions.json')
    b.add_argument('--cuts', help='comma-separated ms, or a JSON file (default <job>/cuts.json if present)')
    b.add_argument('--avatar', default='job/avatar_main.mp4')
    b.add_argument('--tail', help='second-look src (default job/avatar_wait.mp4 when <job>/avatar_wait.mp4 exists)')
    b.add_argument('--tail-start-ms', type=int)
    b.add_argument('--loop', action='store_true', help='loop the avatar sources (stand-in takes shorter than the script)')
    b.add_argument('--anchor', action='append', default=[], help='UNIT=word, pins a unit start to a spoken word')
    b.add_argument('--no-music', action='store_true')
    b.add_argument('--out', help='default <job>/edit_explainer.json')
    b.add_argument('--stage', action='store_true', help='copy the referenced assets into studio/remotion/public/job')
    s = sub.add_parser('synth', help='placeholder captions for the spec script (layout development only)')
    s.add_argument('spec')
    s.add_argument('out')
    s.add_argument('--wpm', type=float, default=196.0)
    args = parser.parse_args(argv)

    if args.cmd == 'synth':
        Path(args.out).write_text(json.dumps(synth_captions(args.spec, wpm=args.wpm), indent=1))
        print(args.out)
        return 0

    job = Path(args.job).resolve()
    cuts = []
    if args.cuts and Path(args.cuts).exists():
        cuts = json.loads(Path(args.cuts).read_text())
    elif args.cuts:
        cuts = [int(x) for x in args.cuts.split(',') if x.strip()]
    elif (job / 'cuts.json').exists():
        cuts = json.loads((job / 'cuts.json').read_text())
    tail = args.tail or ('job/avatar_wait.mp4' if (job / 'avatar_wait.mp4').exists() else None)
    anchors = dict(a.split('=', 1) for a in args.anchor)
    speech_file = job / 'speech.json'
    props = build_props(job, Path(args.spec) if args.spec else job / 'analysis' / 'spec.json',
                        Path(args.captions) if args.captions else job / 'captions.json', cuts,
                        avatar=args.avatar, tail=tail, tail_start_ms=args.tail_start_ms, loop=args.loop, anchors=anchors,
                        music=not args.no_music, speech=json.loads(speech_file.read_text()) if speech_file.exists() else None)
    out = Path(args.out) if args.out else job / 'edit_explainer.json'
    out.write_text(json.dumps(props, indent=1))
    summary = {'out': str(out), 'durationMs': props['durationMs'], 'scenes': len(props['scenes']),
               'types': [x['type'] for x in props['scenes']]}
    if args.stage:
        summary['staged'] = stage(job, props)
    print(json.dumps(summary, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
