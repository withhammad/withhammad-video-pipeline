"""Explainer edit: map a reference replication spec onto OUR avatar timeline and write props for the Remotion
"Explainer" composition (studio/remotion/src/explainer).

  python -m app.edit_explainer build <job_dir> [--cuts 12340,20110] [--stage]
  python -m app.edit_explainer render <job_dir> [--out final.mp4]        # Remotion render + -14 LUFS master
  python -m app.edit_explainer master <in.mp4> <out.mp4>                 # the loudness master on its own
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
   length (at least BREATHER_MIN_CAP_MS) and is only ever cut where a clause ends (the reference's bridges are
   whole phrases). Without a clause end it stays whole up to BRIDGE_WHOLE_MAX_MS.
4. Jump cuts (cuts): recordings are placed over them first (the nearest recording scene is extended across the
   cut); a cut left inside a talking head splits that scene and the framing alternates punch 1.00 / 1.06.
5. Recording speed is fitted last, from the final scene lengths ("speed to fit", "a-b s" ranges, "from X s").
   A recording longer than its scene plays up to FIT_RATE_MAX fast and loses its HEAD, so the scene ends on the
   proof (the last highlight or typed line of its screen recording plan), never mid-scroll.
6. Explainer headlines come from each beat's curated on_screen_text ("|" page, "/" line, *italic serif*), each
   shown word timed to its spoken match; they hold across contiguous canvas scenes of the beat. A page that would be
   up for less than HEADLINE_MIN_MS is dropped (a bridge word flashing on the outgoing card).
7. Legibility: every highlight box of a screen recording (found in the shot itself: the recorder's yellow outline)
   gets a push-in while it is up (1.4-1.6x, aimed at the box; Card.tsx keeps the box inside the card). A unit can
   pin its recording to the words with unit["key"]: {"highlight": "text=MIT license" | n, "word": "free"} lands that
   highlight on the word, {"highlight": n, "end": true} ends the scene as it fades.
8. The end card never starts before the last spoken word: the talking head before it runs on to the end of speech
   (captions cover every word), then the card holds ENDCARD_MIN_MS. It also shows the site the tail names.
9. Display words ("Wait!") never cover the face: each take may carry a face box (spec heygen.take_X.face_box,
   fractions x, y, w, h; default the upper middle), and place_display_word() moves the word above the head or
   beside it, sized to fit.
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
BRIDGE_WHOLE_MAX_MS = 2600 # a bridge without a clause end stays whole up to this long
MIN_UNIT_MS = 900          # units shorter than this are avoided when a boundary is chosen
SPLIT_MIN_MS = 600         # a longer bridge overflow becomes a split (facecam + incoming card)
COVER_MS = 700             # a jump cut this close to a recording scene is hidden by extending that recording
COVER_PAD_MS = 0           # ...exactly to the cut: the scene change IS the jump cut (a 120 ms pad flashed the bridge
                           # word on the outgoing card and started the talking head after it)
MIN_SCENE_MS = 400
END_HOLD_MS = 900          # after the last word
ENDCARD_MIN_MS = 3200      # the end card types the keyword (~1.4 s) and then holds it like the reference (~3.2 s)
ENDCARD_READ_MS = 1500     # the finished end card stays up at least this long after the typing
ENDCARD_TYPE_START_MS = 900  # Cta.tsx EndCard: typing starts here...
ENDCARD_CHAR_MS = 85         # ...one character every 85 ms
FIT_RATE_MAX = 1.6         # a recording longer than its scene plays at most this fast...
TAIL_KEEP_MS = 300         # ...and is trimmed from the head so the scene ends this far before the source end
KEY_READ_MS = 600          # the last highlight must be on screen this long inside the scene
RECORDER_TAIL_MS = 250     # screenrec/record.mjs keeps recording this long after the last action
HIGHLIGHT_FADE_MS = 260    # ...and a highlight box fades out over this long
CARD_POP = 1.05            # "Remotion pops the box out": the whole card scales, the content stays at 1.0
WHOOSH_LEAD_MS = 270       # whoosh peak lands on the cut (same calibration as edit_plan)
WHOOSH_TAIL_MS = 60
RISER_MS = 1200
PUNCH = (1, 1.06)
HEADLINE_MIN_MS = 400      # a headline page shorter than this is dropped (no flash on a cut)
ENDCARD_GAP_MS = 120       # the end card starts this long after the last spoken word ends
FLIP_HOLD_MS = 920         # the hook hangs upside-down this long after its drop (the reference stays inverted)
POP_GAP_MIN_MS = 60        # a pop SFX goes into a word gap at least this long...
POP_SNAP_MS = 150          # ...found within this distance of its card entrance
POP_VOLUME, POP_VOLUME_ON_WORD = 0.16, 0.10

CHIP_Y = 0.775             # chip centre: straddles the card's bottom edge (0.79H), above the Reels caption block
CHIP_Y_TALK = 0.615        # on a talking head: above the caption block (0.69-0.72H) with >= 40 px between them

# Push-ins on highlight boxes. Card.tsx: the recording sits CARD_INSET (14) px inside a CARD_BOX 576 px wide, so it is
# drawn CARD_INNER_W px wide (keep in step with theme.ts).
CARD_INNER_W = 548
REC_W, REC_H = 1080, 1350
PUSH_MIN, PUSH_MAX = 1.4, 1.6
PUSH_TARGET_PX = 22        # highlighted text should render at least this tall at 720 w
PUSH_LEAD_MS = 80          # the push starts this long after the box starts fading in

# Display words (bigtext) and the face: canvas 720x1280, px.
CANVAS_W, CANVAS_H = 720, 1280
DEFAULT_FACE_BOX = (0.28, 0.12, 0.44, 0.36)   # upper middle: where a talking head's face sits by default
SAFE_TOP_PX = 150          # below the Reels header
SAFE_LEFT, SAFE_RIGHT = 0.05, 0.86             # clear of the right action rail
DISPLAY_MAX_PX, DISPLAY_MIN_PX = 120, 56
DISPLAY_EM = 0.42          # average glyph width of the italic serif (Overlays.tsx BigText uses the same)
FACE_MARGIN_PX = 14

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


def ends_clause(text):
    return bool(re.search(r'[.!?:;,]["\')]?$', text.strip()))


_NUM_VALUE = {w: i for i, w in enumerate(_ONES)}
_NUM_VALUE.update({w: 10 * i for i, w in enumerate(_TENS) if w})


def _word_value(core):
    parts = core.lower().split('-')
    if len(parts) == 2 and parts[0] in _NUM_VALUE and parts[1] in _NUM_VALUE and _NUM_VALUE[parts[0]] >= 20 and _NUM_VALUE[parts[1]] < 10:
        return _NUM_VALUE[parts[0]] + _NUM_VALUE[parts[1]]
    return _NUM_VALUE.get(core.lower()) if len(parts) == 1 else None


def display_words(caps, keyword=''):
    """Caption words as shown on screen: numbers above ten become digits ("twenty-one" -> 21, "fifteen hundred"
    -> 1,500); small numbers ("one job", "three rules") stay words, and the CTA keyword after "comment" is shown
    the way the spec writes it (Whisper's "Skill" -> SKILL, the word people must type)."""
    out, i, kw = [], 0, clean(keyword)
    while i < len(caps):
        c = caps[i]
        text = c['text'].strip()
        m = re.match(r"^(\W*)([A-Za-z][A-Za-z-]*)(\W*)$", text)
        keyword_use = kw and clean(m.group(2)) == kw and i > 0 and clean(caps[i - 1]['text']) == 'comment' if m else False
        if keyword_use:
            text = f'{m.group(1)}{keyword.strip()}{m.group(3)}'
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
        if out and re.match(r'^\.[a-z]{2,}\W*$', text, re.I) and not re.search(r'[.!?,]$', out[-1]['text']):
            # Whisper splits a spoken domain ("withhammad" + ".com"): one caption word, "withhammad.com"
            out[-1] = {**out[-1], 'text': out[-1]['text'] + text, 'endMs': c['endMs']}
            i += 1
            continue
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


def plan_actions(plan, src_len=None):
    """[(kind, startMs, endMs)] of a screen recording plan (screenrec/record.mjs) on the recording's own clock.
    The recorder's overhead (typing timers, DevTools round trips) stretches the nominal times; when the real
    length is known, every time is scaled so the nominal total plus the recorder's tail lands on it."""
    t, out = 0.0, []
    for a in plan.get('actions') or []:
        kind, d = next(iter(a), '?'), 0.0
        if 'wait' in a:
            d = float(a['wait'])
        elif 'scroll' in a or 'scrollBy' in a:
            kind, d = 'scroll', float((a.get('scroll') or a.get('scrollBy')).get('ms', 2000 if 'scroll' in a else 1500))
        elif 'move' in a:
            d = float(a['move'].get('ms', 600))
        elif 'type' in a:
            d = 1000.0 * len(a['type'].get('text', '')) / max(1.0, float(a['type'].get('cps', 14)))
        elif 'highlight' in a:
            d = float(a['highlight'].get('ms', 1200)) + HIGHLIGHT_FADE_MS
        elif 'zoom' in a:
            d = float(a['zoom'].get('ms', 900))
        out.append((kind, t, t + d))
        t += d
    total = t + RECORDER_TAIL_MS
    k = src_len / total if src_len and total > 0 else 1.0
    return [(kind, a * k, b * k) for kind, a, b in out]


def key_action(plan, src_len=None):
    """(startMs, readyMs) of the plan's last highlight or typed line, the moment the recording proves its point:
    readyMs is when the typing has finished, or when the highlight has been up for KEY_READ_MS."""
    acts = [x for x in plan_actions(plan, src_len) if x[0] in ('highlight', 'type')]
    if not acts:
        return None
    kind, a, b = acts[-1]
    return round(a), round(b if kind == 'type' else min(b, a + KEY_READ_MS))


def _keyed_highlight(key, plan, src_len=None):
    """unit["key"] -> {'startMs', 'endMs' (the highlight on the recording's clock), 'word'?, 'occurrence', 'end'}:
    key["highlight"] is the action's selector ("text=MIT license") or its 1-based number among the highlights."""
    hls = [(a, b, act) for (kind, a, b), act in zip(plan_actions(plan, src_len), plan.get('actions') or []) if kind == 'highlight']
    want = key.get('highlight', 1)
    hit = None
    if isinstance(want, int):
        hit = hls[want - 1] if 0 < want <= len(hls) else None
    else:
        hit = next((h for h in hls if (h[2].get('highlight') or {}).get('selector') == want), None)
    if not hit:
        return None
    return {'startMs': round(hit[0]), 'endMs': round(hit[1]), 'word': key.get('word'), 'occurrence': int(key.get('occurrence', 1)),
            'end': bool(key.get('end')), 'leadMs': int(key.get('lead_ms', 100))}


def recording_plans(job_dir, spec_path=None):
    """Screen recording plans by recording id: <job>/analysis/screenrec/plans/<id>.json, else next to the spec."""
    dirs = [Path(job_dir) / 'analysis' / 'screenrec' / 'plans']
    if isinstance(spec_path, (str, Path)):
        dirs.append(Path(spec_path).parent / 'screenrec' / 'plans')
    out = {}
    for d in dirs:
        if d.is_dir():
            for f in sorted(d.glob('*.json')):
                try:
                    out.setdefault(f.stem, json.loads(f.read_text()))
                except (OSError, ValueError):
                    continue
    return out


def _recording_plan(unit, durations, plans=None, highlights=None):
    """{'src', 'inMs', 'fit', 'outMs', 'durationMs', 'key'?, 'pop'?, 'hl'?, 'keyOn'?} from the unit's screenrec id
    and its "use" text (plus the key action and the highlight boxes from the screen recording plan when known)."""
    rid = unit.get('screenrec')
    if not rid:
        return None
    use = unit.get('use') or ''
    dur = durations.get(rid)
    plan = {'src': f'job/shots/{rid}.mp4', 'inMs': 0, 'fit': None, 'outMs': None, 'durationMs': round(dur) if dur else None}
    if plans and plans.get(rid):
        plan['key'] = key_action(plans[rid], dur)
    if highlights and highlights.get(rid):
        plan['hl'] = highlights[rid]
    if isinstance(unit.get('key'), dict) and plans and plans.get(rid):
        plan['keyOn'] = _keyed_highlight(unit['key'], plans[rid], dur)
    rng = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s\b', use)
    frm = re.search(r'\bfrom (\d+(?:\.\d+)?)\s*s\b', use)
    if frm:
        plan['inMs'] = round(float(frm.group(1)) * 1000)
    elif rng:
        plan.update(inMs=round(float(rng.group(1)) * 1000), outMs=round(float(rng.group(2)) * 1000), fit='range')
    if re.search(r'speed to fit|\bwhole\b', use):
        plan['fit'] = 'whole'
    if re.search(r'Remotion pops .*? at (\d+(?:\.\d+)?)x', use):
        plan['pop'] = True
    return plan


def _overlay(unit, scene_type):
    text = unit.get('overlay') or ''
    if not text:
        return None
    low, quoted = text.lower(), _quoted(text)
    if scene_type == 'stat' and quoted:
        return {'kind': 'stat', 'text': quoted[0], 'color': STAT_GREEN, 'y': 0.70}
    # Positions stay out of the Reels UI: header (top ~0.11H), caption/username block and right rail (below ~0.78H).
    if 'arrow' in low:
        return {'kind': 'arrow', 'text': quoted[0] if quoted else '', 'color': ARROW_RED, 'y': CHIP_Y}
    if 'giant' in low and 'serif' in low and quoted:
        return {'kind': 'bigtext', 'text': quoted[0], 'color': DEEP_GREEN, 'y': 0.18}
    numbered = [q for q in quoted if re.match(r'\d+\s', q)]
    if numbered:
        return {'kind': 'chip', 'text': '\n'.join(numbered), 'y': 0.2, 'align': 'right'}
    if 'chip' in low and quoted:
        # Over a talking head the chip sits above the caption block; on a card it straddles the card's bottom edge.
        return {'kind': 'chip', 'text': quoted[0], 'y': CHIP_Y_TALK if scene_type == 'avatar' else CHIP_Y}
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


# ----------------------------------------------------------------------------------------------- display words

def face_box_px(face=None):
    """(left, top, right, bottom) px on the canvas of a face box given as fractions (x, y, w, h)."""
    x, y, w, h = face or DEFAULT_FACE_BOX
    return x * CANVAS_W, y * CANVAS_H, (x + w) * CANVAS_W, (y + h) * CANVAS_H


def _display_box(text, size, cx, cy):
    width, height = max(1, len(text)) * DISPLAY_EM * size, 1.1 * size
    return cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2


def _overlaps(a, b, margin=0.0):
    return a[0] < b[2] + margin and a[2] > b[0] - margin and a[1] < b[3] + margin and a[3] > b[1] - margin


def place_display_word(text, y=0.18, face=None):
    """{'x', 'y' (centre fractions), 'size' (px)} for a giant display word that never covers the face: where it was
    asked for if that is clear of the face box, else above the head (between the Reels header and the hair), else
    beside the head on the wider side (clear of the right rail), sized to fit; last resort under the chin."""
    n = max(1, len(text))
    size0 = min(DISPLAY_MAX_PX, CANVAS_W * 0.48 / (n * DISPLAY_EM))
    fb = face_box_px(face)
    cy0 = max(y * CANVAS_H, SAFE_TOP_PX + 0.55 * size0)
    want = _display_box(text, size0, CANVAS_W / 2, cy0)
    if not _overlaps(want, fb, FACE_MARGIN_PX):
        return {'x': 0.5, 'y': round(cy0 / CANVAS_H, 4), 'size': round(size0, 1)}
    room = fb[1] - FACE_MARGIN_PX - SAFE_TOP_PX                       # above the head
    size = min(size0, room / 1.1, CANVAS_W * 0.8 / (n * DISPLAY_EM))
    if size >= DISPLAY_MIN_PX:
        return {'x': 0.5, 'y': round((SAFE_TOP_PX + fb[1] - FACE_MARGIN_PX) / 2 / CANVAS_H, 4), 'size': round(size, 1)}
    sides = [(SAFE_LEFT * CANVAS_W, fb[0] - FACE_MARGIN_PX), (fb[2] + FACE_MARGIN_PX, SAFE_RIGHT * CANVAS_W)]
    lo, hi = max(sides, key=lambda b: b[1] - b[0])                     # beside the head, the wider side
    size = min(size0, (hi - lo) / (n * DISPLAY_EM))
    if size >= DISPLAY_MIN_PX:
        cy = max((fb[1] + fb[3]) / 2, SAFE_TOP_PX + 0.55 * size)
        return {'x': round((lo + hi) / 2 / CANVAS_W, 4), 'y': round(cy / CANVAS_H, 4), 'size': round(size, 1)}
    return {'x': 0.5, 'y': round((fb[3] + FACE_MARGIN_PX + 0.55 * size0) / CANVAS_H, 4), 'size': round(size0, 1)}


def _take_face(spec, take):
    """The face box of a take from spec heygen.take_A / take_B "face_box" ([x, y, w, h] fractions), else None."""
    box = (((spec.get('heygen') or {}).get(take) or {}).get('face_box'))
    return [float(v) for v in box] if isinstance(box, (list, tuple)) and len(box) == 4 else None


# ----------------------------------------------------------------------------------------------- highlight boxes

HL_W, HL_H = 540, 675        # highlight detection works on half-resolution frames of the 1080x1350 recordings


def _frame_rgb(path, t_ms, w=HL_W, h=HL_H):
    try:
        out = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{max(0.0, t_ms) / 1000:.3f}', '-i', str(path), '-frames:v', '1',
                              '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                             capture_output=True, timeout=60)
    except (OSError, subprocess.TimeoutExpired):
        return None
    return out.stdout if out.returncode == 0 and len(out.stdout) == w * h * 3 else None


def _yellow(rr, gg, bb):
    """The outline's #FFD60A, also where it is anti-aliased into a dark or a white page."""
    return rr > 190 and gg > 150 and rr - bb > 90 and gg - bb > 60


def yellow_box(rgb, w=HL_W, h=HL_H, min_run=30, max_gap=4):
    """Bounding box (x, y, w, h as fractions of the frame) of the recorder's highlight outline (#FFD60A, a rounded
    rectangle) in one rgb24 frame, or None. The outline is found by its top and bottom edges: the first row holding
    a long horizontal yellow run, and the last such row whose run overlaps it by 60 %+ (the cursor or a badge may
    hide part of one edge), so small yellow things on the page (a gold count, a star icon) never count. Standard
    library only."""
    runs = {}
    for y in range(h):
        row = rgb[y * w * 3:(y + 1) * w * 3]
        best, x0, last = None, None, -100
        for x in range(w):
            i = 3 * x
            if _yellow(row[i], row[i + 1], row[i + 2]):
                if x - last > max_gap + 1:
                    x0 = x
                last = x
                if best is None or x - x0 > best[1] - best[0]:
                    best = (x0, x)
        if best and best[1] - best[0] + 1 >= min_run:
            runs[y] = best
    rows = sorted(runs)
    for y_top in rows:
        a0, a1 = runs[y_top]
        same = [y for y in rows if y - y_top >= 8
                and min(a1, runs[y][1]) - max(a0, runs[y][0]) >= 0.6 * min(a1 - a0, runs[y][1] - runs[y][0])]
        if same:
            y_bot = max(same)
            x0 = min(a0, runs[y_bot][0])
            x1 = max(a1, runs[y_bot][1])
            return [round(x0 / w, 4), round(y_top / h, 4), round((x1 - x0 + 1) / w, 4), round((y_bot - y_top + 1) / h, 4)]
    return None


def highlight_boxes(video, plan, src_len=None, grab=_frame_rgb):
    """[{'startMs', 'endMs', 'box'}] for every highlight action of a recording plan, on the recording's own clock
    (plan_actions timing), box = the outline found in the shot halfway through it (None if not found)."""
    out = []
    for kind, a, b in plan_actions(plan, src_len):
        if kind != 'highlight':
            continue
        box = None
        if video and Path(video).exists():
            rgb = grab(video, a + 0.45 * (b - a))
            box = yellow_box(rgb) if rgb else None
        out.append({'startMs': round(a), 'endMs': round(b), 'box': box})
    return out


def push_scale(box):
    """Push-in for a highlight box: enough for its text to render PUSH_TARGET_PX tall at 720 w (estimated from the
    box height: a GitHub line is ~1.5x its font, the outline adds 12 CSS px), within PUSH_MIN-PUSH_MAX."""
    if not box:
        return 1.5
    rec_px = box[3] * REC_H                                   # outline height in recording px (1.8x CSS px)
    css_h = rec_px / 1.8 - 12
    lines = max(1, round(css_h / 24))
    font_rec = css_h / lines / 1.5 * 1.8
    shown = font_rec * CARD_INNER_W / REC_W
    return round(min(PUSH_MAX, max(PUSH_MIN, PUSH_TARGET_PX / max(1.0, shown))), 2)


# ----------------------------------------------------------------------------------------------- build

def _load(x):
    if isinstance(x, (str, Path)):
        return json.loads(Path(x).read_text())
    return x


def _quiet(spans, a_ms, b_ms):
    return not any(s0 < b_ms and s1 > a_ms for s0, s1 in spans)


def build_props(job_dir, spec_json, captions_json, cuts=None, *, avatar='job/avatar_main.mp4', tail=None,
                tail_start_ms=None, loop=False, anchors=None, durations=None, probe=probe_ms, music=True,
                speech=None, duration_ms=None, plans=None, highlights=None, face_boxes=None):
    """Props for the Explainer composition. spec_json / captions_json: paths or already-loaded objects.
    cuts: ms on our timeline where the take was spliced. tail: src of the second look (beats from the unit typed
    "second setup" on); tail_start_ms: where take B starts on the timeline (default: that beat's cut).
    plans: screen recording plans by id (default: read from the job / next to the spec).
    highlights: {recording id: highlight_boxes()} (default: found in <job>/shots/<id>.mp4).
    face_boxes: {'avatar': [x, y, w, h], 'tail': [...]} fractions (default: spec heygen take_A / take_B face_box)."""
    job_dir = Path(job_dir)
    if plans is None:
        plans = recording_plans(job_dir, spec_json)
    spec = _load(spec_json)
    faces = {'avatar': _take_face(spec, 'take_A'), 'tail': _take_face(spec, 'take_B'), **(face_boxes or {})}
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
    if highlights is None:
        used = {u.get('screenrec') for b in beats for u in b.get('units', []) if u.get('screenrec')}
        highlights = {rid: highlight_boxes(job_dir / 'shots' / f'{rid}.mp4', plans[rid], durations.get(rid))
                      for rid in sorted(used) if plans.get(rid) and (job_dir / 'shots' / f'{rid}.mp4').exists()}
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
                     'endMs': unit_starts[j + 1] if j + 1 < len(unit_starts) else t1, 'beat': beat.get('name', str(k)),
                     '_beat': beat.get('name', str(k)), '_beat_t0': t0, '_ref_ms': round((unit['t'][1] - unit['t'][0]) * 1000),
                     '_unit': unit}
            if st == 'avatar':
                scene['system'] = 'hook' if k == 0 else 'talk'
                if k == 0 and j == 0:
                    scene['flipIn'] = True
                    scene['flipHoldMs'] = FLIP_HOLD_MS
            elif st != 'endcard':
                scene['system'] = 'explainer'
            plan = _recording_plan(unit, durations, plans, highlights)
            if plan and st in ('card', 'stat', 'split', 'text'):
                scene['_rec'] = plan
            text_all = ' '.join(str(unit.get(x) or '') for x in ('use', 'footage'))
            if re.search(r'slides? up from the bottom', text_all, re.I):
                scene['cardSlide'] = 'up'
            ov = _overlay(unit, st)
            if st == 'endcard':
                pill = _quoted(unit.get('footage'))
                ov = {'kind': 'chip', 'text': pill[0] if pill else 'FREE GUIDE'}
                scene.update(_endcard_site(unit, beat))
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
        tail_len = probe(job_dir / Path(tail).name) if tail.startswith('job/') else None
        if tail_len:                 # the take freezes on its last frame under a longer end card
            tail_obj['durationMs'] = round(tail_len)
        if faces.get('tail'):
            tail_obj['faceBox'] = faces['tail']
    tail_ms = tail_obj['startMs'] if tail_obj else None

    scenes = _cap_breathers(scenes, caps, tail_ms)
    scenes = _cover_cuts(scenes, sorted(cuts or []))
    if scenes[-1]['type'] == 'endcard':
        end = scenes[-1]
        # Never over the voice: the scene before it (the talking head with captions) runs on to the last word.
        if len(scenes) > 1 and end['startMs'] < last_end + ENDCARD_GAP_MS:
            scenes[-2]['endMs'] = end['startMs'] = last_end + ENDCARD_GAP_MS
        # The end card types the keyword, then holds the finished card long enough to read (the reference ~3.2 s),
        # and at least ENDCARD_MIN_MS after the voice ends.
        typed_end = ENDCARD_TYPE_START_MS + len(keyword or 'x') * ENDCARD_CHAR_MS
        end['endMs'] = max(end['endMs'], end['startMs'] + max(ENDCARD_MIN_MS, typed_end + ENDCARD_READ_MS),
                           last_end + ENDCARD_MIN_MS)
    total = scenes[-1]['endMs']
    _finish_recordings(scenes, caps)
    for s in scenes:                 # display words never cover the face of the take they sit on
        ov = s.get('overlay')
        if ov and ov['kind'] == 'bigtext':
            face = faces.get('tail') if tail_ms is not None and s['startMs'] >= tail_ms - 40 else faces.get('avatar')
            ov.update(place_display_word(ov['text'], ov.get('y', 0.18), face))

    words = display_words(caps, keyword)
    _flag_emphasis(words, beats, word_ranges)
    headlines = _headline_pages(beats, words, word_ranges, ends, scenes)
    for s in scenes:
        ov = s.get('overlay')
        if ov and ov['kind'] == 'chip' and '\n' in ov['text']:
            ov['itemsAtMs'] = _spoken_number_times(ov['text'], words, s)
        elif ov and ov['kind'] == 'chip' and s['type'] != 'endcard':
            at = _spoken_chip_time(ov['text'], words, s)
            if at is not None:       # a chip naming a spoken word ("withhammad.com") pops as it is said
                ov['atMs'] = at

    cta = None
    cta_k = next((k for k, b in enumerate(beats) if 'cta' in b.get('name', '')), None)
    lo, hi = (starts[cta_k], ends[cta_k]) if cta_k is not None else (0, total)
    hit = next((w for w in words if clean(w['text']) == 'comment' and lo <= w['startMs'] < hi), None) \
        or next((w for w in words if clean(w['text']) == 'comment'), None)
    if keyword and hit:
        cta = {'keyword': keyword, 'atMs': hit['startMs'], 'handle': 'with.hammad', 'reply': 'Here you go!'}

    spans_ms = speech if speech is not None else [(w['startMs'], w['endMs']) for w in words]
    props = {
        'avatar': {'src': avatar, **({'loop': True} if loop else {}), **({'faceBox': faces['avatar']} if faces.get('avatar') else {})},
        'tail': tail_obj,
        'scenes': [{k: v for k, v in s.items() if not k.startswith('_')} for s in scenes],
        'captions': {'words': [{k: v for k, v in w.items() if not k.startswith('_')} for w in words]},
        'headlines': headlines,
        # The bed ducks under every spoken word and holds the duck across gaps under 500 ms (no swell every 2 s).
        'music': {'src': 'job/music.wav', 'volume': 0.12, 'duckTo': 0.08, 'holdGapMs': 500, 'fadeInMs': 40, 'fadeOutMs': 600} if music else None,
        'sfx': _sfx(scenes, cta, spans_ms),
        'cta': cta,
        'durationMs': total,
        'meta': {'job': spec.get('job'), 'beats': [{'name': b.get('name'), 'startMs': starts[k], 'endMs': ends[k]} for k, b in enumerate(beats)],
                 'cuts': sorted(cuts or [])},
    }
    return props


_DOMAIN = re.compile(r'\b([a-z0-9-]+\.(?:com|ai|io|dev|net|org|co))\b', re.I)


def _endcard_site(unit, beat):
    """{'site', 'siteNote'?} for the end card: unit text 'site "withhammad.com · link in bio"', else the first domain in
    the beat's on-screen text (plus "link in bio" when the beat says bio). {} when the beat names none."""
    text = ' '.join(str(unit.get(x) or '') for x in ('footage', 'overlay'))
    m = re.search(r'\bsite "([^"]+)"', text)
    if m:
        site, _, note = m.group(1).partition('·')
        return {'site': site.strip(), **({'siteNote': note.strip()} if note.strip() else {})}
    d = _DOMAIN.search(beat.get('on_screen_text') or '')
    if not d:
        return {}
    bio = re.search(r'\bbio\b', (beat.get('line') or '') + ' ' + (beat.get('on_screen_text') or ''), re.I)
    return {'site': d.group(1), **({'siteNote': 'link in bio'} if bio else {})}


def _spoken_chip_time(text, words, scene, lead_ms=80):
    """Scene-relative ms at which a chip naming spoken words pops: its first two tokens said in that order inside
    the scene (lead_ms early). None when the chip is not spoken there."""
    want = tokens(text)[:2]
    if not want:
        return None
    inside = [w for w in words if scene['startMs'] - 200 <= w['startMs'] < scene['endMs']]
    toks = [(t, w) for w in inside for t in tokens(w['text'])]
    for i in range(len(toks) - len(want) + 1):
        if [t for t, _ in toks[i:i + len(want)]] == want:
            return max(0, toks[i][1]['startMs'] - scene['startMs'] - lead_ms)
    return None


def _cap_breathers(scenes, caps, tail_ms):
    """Bridge breathers (talking head between graphics) stay short like the reference's, and are only ever cut
    where a clause or sentence ends (the reference's bridges are whole phrases):
    - up to the cap (reference length + slack, at least BREATHER_MIN_CAP_MS): kept whole;
    - longer: cut at the latest clause end before the cap, else the earliest one before BRIDGE_WHOLE_MAX_MS. The
      rest goes to the incoming graphic: a split (facecam + the incoming recording) when it is long, else the
      card simply arrives at that clause;
    - no clause end: kept whole up to BRIDGE_WHOLE_MAX_MS. Beyond that the rest becomes a split whose captions
      stay in the talking-head system (the same caption page runs on), so the phrase finishes on the facecam."""
    out = []
    for i, s in enumerate(scenes):
        nxt = scenes[i + 1] if i + 1 < len(scenes) else None
        bridge = (s['type'] == 'avatar' and not s.get('flipIn') and nxt is not None and nxt['type'] in CANVAS + ('split',)
                  and 'cta' not in s['_beat'] and (tail_ms is None or s['startMs'] < tail_ms))
        cap = max(s['_ref_ms'] + BREATHER_SLACK_MS, BREATHER_MIN_CAP_MS)
        if not bridge or s['endMs'] - s['startMs'] <= cap:
            out.append(s)
            continue

        def words_after(t):
            return sum(1 for c in caps if t <= c['startMs'] < s['endMs'])

        cands = [(k, _cut_before(caps, k)) for k in range(1, len(caps))]
        cands = [(k, t) for k, t in cands if s['startMs'] + MIN_SCENE_MS <= t and words_after(t) >= 2]
        clause = [t for k, t in cands if ends_clause(caps[k - 1]['text'])]
        # A cut that leaves the talking head under MIN_UNIT_MS ("And no," alone) is worse than a bridge a little
        # over its cap: such a clause end is not used, and the bridge stays whole up to BRIDGE_WHOLE_MAX_MS.
        early = [t for t in clause if s['startMs'] + MIN_UNIT_MS <= t <= s['startMs'] + cap]
        late = [t for t in clause if s['startMs'] + cap < t <= s['startMs'] + BRIDGE_WHOLE_MAX_MS]
        talk = False
        if early:
            cut = early[-1]
        elif late:
            cut = late[0]
        elif s['endMs'] - s['startMs'] > BRIDGE_WHOLE_MAX_MS and nxt.get('_rec') and cands:
            within = [t for k, t in cands if t <= s['startMs'] + BRIDGE_WHOLE_MAX_MS]
            cut, talk = (within or [cands[0][1]])[-1], True
        else:
            out.append(s)
            continue
        excess = s['endMs'] - cut
        if talk or (excess >= SPLIT_MIN_MS and words_after(cut) >= 2 and nxt.get('_rec')):
            split = {'id': f"{nxt['id']}-split", 'type': 'split', 'startMs': cut, 'endMs': s['endMs'],
                     'system': 'talk' if talk else 'explainer', 'beat': s['beat'] if talk else nxt['beat'],
                     '_beat': nxt['_beat'], '_beat_t0': nxt['_beat_t0'], '_ref_ms': 0, '_unit': nxt['_unit'],
                     '_rec': {**nxt['_rec'], 'fit': None, 'outMs': None, 'lead': True}}
            if nxt.get('label'):      # the card enters with the split; the full card then morphs from it
                split['label'] = nxt['label']
            nxt['_rec'] = {**nxt['_rec'], 'cont': True}
            s['endMs'] = cut
            out += [s, split]
            continue
        s['endMs'] = nxt['startMs'] = cut
        out.append(s)
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
            second['_rec'] = {**s['_rec'], 'cont': True}     # keeps a lead flag: the card after it continues it
            s['_rec'] = {**s['_rec'], 'lead': True}
        if s['type'] == 'avatar':
            second['punch'] = toggled
        s['endMs'] = c
        scenes.insert(k + 1, second)
    for s in scenes:
        if s.get('punch') == 1:
            s.pop('punch')
    return scenes


def _source_out(scene):
    """Source ms where a scene's recording leaves off."""
    rec = scene['recording']
    return rec['inMs'] + (scene['endMs'] - scene['startMs']) * rec.get('playbackRate', 1.0)


def _keyed_window(key, scene, caps, src_len):
    """(in_ms, rate) that land a keyed highlight on its word (its box up lead_ms before the word starts) or, with
    "end", end the scene as the highlight fades. None when the word is not spoken in the scene."""
    dur = max(1, scene['endMs'] - scene['startMs'])
    if key.get('end'):
        rate = 1.0 if key['endMs'] >= dur else max(0.6, key['endMs'] / dur)
        return max(0, round(key['endMs'] - dur * rate)), rate
    hits = [c for c in caps or [] if clean(c['text']) == clean(key.get('word') or '') and scene['startMs'] <= c['startMs'] < scene['endMs']]
    if len(hits) < key.get('occurrence', 1):
        return None
    at = max(0, hits[key.get('occurrence', 1) - 1]['startMs'] - scene['startMs'] - key.get('leadMs', 100))
    rate = 1.0
    if key['startMs'] < at * rate:            # the box comes too early in the source: play the head slower
        rate = max(0.6, key['startMs'] / max(1, at))
    return max(0, round(key['startMs'] - at * rate)), rate


def _zooms(hl, in_ms, rate, dur):
    """Push-ins (scene-relative) on every highlight box the scene shows: from PUSH_LEAD_MS after the box starts
    fading in until it has faded, scale from push_scale(), aimed at the box (fractions of the recording frame)."""
    out = []
    for h in hl or []:
        if not h.get('box'):
            continue
        a, b = (h['startMs'] + PUSH_LEAD_MS - in_ms) / rate, (h['endMs'] - in_ms) / rate
        if b <= 150 or a >= dur - 150:
            continue
        # A box still up at the cut keeps the push through it (no zoom-out in the last frames of the scene).
        end = dur + 400 if b >= dur - 200 else b
        out.append({'atMs': round(max(0, a)), 'endMs': round(end), 'scale': push_scale(h['box']), 'box': h['box']})
    return out


def _finish_recordings(scenes, caps=None):
    """Recording in-points and speeds from the final scene lengths.
    - unit["key"] wins: the keyed highlight lands on its word (or the scene ends as it fades);
    - "a-b s" plays that range in the scene; "speed to fit" / "whole" plays the rest of the recording;
    - a scene continuing the previous scene's recording (same source, contiguous, in-point where it left off, or
      the second half of a split scene) picks up exactly there, so the card never jumps;
    - the head of a recording that the next scene continues plays at 1x;
    - anything else longer than its scene plays up to FIT_RATE_MAX fast and is trimmed from the HEAD, so the scene
      ends TAIL_KEEP_MS before the source end, just after the last highlight or typed line, never mid-scroll;
    - when the plan's key action is known, the window is moved (or, for a continuation, sped up) to reach it.
    Every highlight box inside the final window gets a push-in (recording.zooms)."""
    for i, s in enumerate(scenes):
        plan = s.pop('_rec', None)
        if not plan:
            continue
        dur = max(1, s['endMs'] - s['startMs'])
        src_len = plan.get('durationMs')
        prev = scenes[i - 1] if i else None
        pr = prev.get('recording') if prev else None
        keyed = _keyed_window(plan['keyOn'], s, caps, src_len) if plan.get('keyOn') and not plan.get('lead') else None
        cont = not keyed and bool(pr and pr['src'] == plan['src'] and abs(prev['endMs'] - s['startMs']) < 40
                                  and (plan.get('cont') or abs(_source_out(prev) - plan['inMs']) <= 300))
        in_ms = round(_source_out(prev)) if cont else plan['inMs']
        key = plan.get('key')
        if keyed:
            in_ms, rate = keyed
        elif plan.get('lead'):
            rate = 1.0
        elif plan['fit'] == 'range' and plan['outMs'] and plan['outMs'] > in_ms:
            rate = (plan['outMs'] - in_ms) / dur
        elif plan['fit'] == 'whole' and src_len:
            rate = (src_len - in_ms) / dur
        elif src_len and src_len - in_ms > dur:
            rate = min(FIT_RATE_MAX, (src_len - in_ms) / dur)
            if not cont:
                in_ms = max(in_ms, round(src_len - dur * rate - TAIL_KEEP_MS))
        elif src_len:
            rate = (src_len - in_ms) / dur     # shorter than the scene: slow down (the card freezes on its last frame)
        else:
            rate = 1.0
        rate = min(2.5, max(0.6, rate))
        if key and src_len and not keyed and not plan.get('lead') and plan['fit'] != 'range':
            if not cont and in_ms > key[0] - 150:
                # The head trim went past the moment the box appears: start just before it instead.
                in_ms = max(plan['inMs'], min(in_ms, key[0] - 150))
            if in_ms + dur * rate < key[1]:
                if cont:
                    rate = min(2.0, max(rate, (key[1] + 100 - in_ms) / dur))
                else:
                    in_ms = max(plan['inMs'], min(round(key[1] + 100 - dur * rate), round(src_len - dur * rate)))
        rate = round(rate, 3)
        rec = {'src': plan['src'], 'inMs': in_ms}
        if rate != 1.0:
            rec['playbackRate'] = rate
        if src_len:
            rec['durationMs'] = src_len
        zooms = _zooms(plan.get('hl'), in_ms, rate, dur)
        if zooms:
            rec['zooms'] = zooms
        if plan.get('pop'):
            # "Remotion pops the box out": the whole card scales with an orange outline when the box flashes;
            # the content stays at 1.0 so nothing is cropped at the card edge (Card.tsx clamps the scale so the
            # card stays inside the safe area).
            at = (key[0] - in_ms) / rate if key else dur * 0.55
            rec['pushIn'] = {'atMs': round(min(max(at, 200), max(200, dur - 450))), 'scale': CARD_POP,
                             'originX': 0.5, 'originY': 0.5, 'mode': 'card'}
        s['recording'] = rec


_OST_NOTE = re.compile(r'\s+\+\s+(?:stat|chip|overlay|arrow)\b.*$', re.I)


def ost_pages(text):
    """A beat's on_screen_text as pages -> lines -> [(word, italic)]: "|" starts a page, "/" a line, *...* is the
    italic serif; notes such as "+ stat FREE + MIT" are dropped. A page holds two lines at most (the reference's
    headline is always two lines); a third line opens the next page."""
    pages = []
    for raw in (text or '').split('|'):
        lines = []
        for line in _OST_NOTE.sub('', raw.strip()).split('/'):
            words, italic = [], False
            for tok in line.split():
                it = italic
                if tok.startswith('*'):
                    tok, it, italic = tok[1:], True, True
                m = re.match(r'^(.*?)\*(\W*)$', tok)
                if m:
                    tok, italic = m.group(1) + m.group(2), False
                if tok:
                    words.append((tok, it))
            if words:
                lines.append(words)
        pages += [lines[k:k + 2] for k in range(0, len(lines), 2)]
    return pages


def _headline_pages(beats, words, word_ranges, beat_ends, scenes):
    """Explainer headlines from each beat's curated on_screen_text, timed on OUR words.

    Every shown word appears when its spoken match starts (difflib over normalised tokens; an unspoken one such
    as "+" or "video" rides with its neighbour). A page takes over at the start of the clause its phrase begins
    in (at most two words back, so "and it ranks..." swaps at "and"), its first word when it is said. Pages
    hold until the next page and run across contiguous canvas scenes of the beat. Only pages that begin inside a
    headline (explainer) scene are kept: the rest are spoken on the talking head, which has its own captions; a page
    on screen for less than HEADLINE_MIN_MS is dropped."""
    out = []
    for k, beat in enumerate(beats):
        pages = ost_pages(beat.get('on_screen_text'))
        lo, hi = word_ranges[k]
        bw = [w for w in words if lo <= w['_i'] <= hi]
        if not pages or not bw:
            continue
        disp, owner = [], []
        for p, page in enumerate(pages):
            for li, line in enumerate(page):
                for j, (text, _) in enumerate(line):
                    for t in tokens(text):
                        disp.append(t)
                        owner.append((p, li, j))
        cap, cap_owner = [], []
        for n, w in enumerate(bw):
            for t in tokens(w['text']):
                cap.append(t)
                cap_owner.append(n)
        hit = {}
        for a, b, size in difflib.SequenceMatcher(None, disp, cap, autojunk=False).get_matching_blocks():
            for q in range(size):
                hit.setdefault(owner[a + q], cap_owner[b + q])
        built, prev_last = [], -1
        for p, page in enumerate(pages):
            seq = [(li, j, text, it) for li, line in enumerate(page) for j, (text, it) in enumerate(line)]
            idx = [hit.get((p, li, j)) for li, j, _, _ in seq]
            matched = [n for n in idx if n is not None]
            if not matched:
                continue
            first = min(matched)
            start_n = first
            for n in range(first, max(prev_last + 1, first - 2, 1) - 1, -1):
                if n > 0 and ends_clause(bw[n - 1]['text']):
                    start_n = n
                    break
            t0 = bw[start_n]['startMs']
            times = [bw[n]['startMs'] if n is not None else None for n in idx]
            for q in range(1, len(times)):                       # unspoken words ride with the word before...
                if times[q] is None:
                    times[q] = times[q - 1]
            for q in range(len(times) - 2, -1, -1):              # ...or, leading a page, with the word after
                if times[q] is None:
                    times[q] = times[q + 1]
            lines, t = [[] for _ in page], t0
            for q, (li, j, text, it) in enumerate(seq):
                # The page takes over (the old one clears) at the clause start; even its first word only shows when
                # it is said ("you just | give" no longer shows "Give" 300 ms early).
                t = max(t, times[q] if times[q] is not None else t0)
                lines[li].append({'text': text, 'startMs': t, **({'italic': True} if it else {})})
            built.append({'startMs': t0, 'lines': [{'italic': all(w.get('italic') for w in ln), 'words': ln} for ln in lines]})
            prev_last = max(matched)
        for q, pg in enumerate(built):
            pg['endMs'] = built[q + 1]['startMs'] if q + 1 < len(built) else beat_ends[k]
        for pg in built:
            at = next((i for i, s in enumerate(scenes) if s['startMs'] <= pg['startMs'] < s['endMs']), None)
            if at is None or scenes[at].get('system') != 'explainer':
                continue
            end = at
            while (end + 1 < len(scenes) and scenes[end + 1].get('system') == 'explainer'
                   and scenes[end + 1]['beat'] == scenes[at]['beat'] and abs(scenes[end + 1]['startMs'] - scenes[end]['endMs']) < 40):
                end += 1
            pg['endMs'] = min(pg['endMs'], scenes[end]['endMs'])
            first = min(w['startMs'] for ln in pg['lines'] for w in ln['words'])
            if pg['endMs'] - first >= HEADLINE_MIN_MS:      # never flash a bridge word on the outgoing card
                out.append(pg)
    return out


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


def pop_time(at, spans, pop_ms=90):
    """(ms, in_gap): a pop SFX moved into the nearest word gap of at least POP_GAP_MIN_MS within POP_SNAP_MS of
    `at`, so it never fills a consonant ("completely", the /f/ of "free"); (at, False) when there is none."""
    spans = sorted((round(a), round(b)) for a, b in spans)
    best = None
    for (_, g0), (g1, _) in zip(spans, spans[1:]):
        if g1 - g0 < POP_GAP_MIN_MS:
            continue
        hi = max(g0 + 5, g1 - pop_ms)
        t = min(max(at, g0 + 5), hi)
        if abs(t - at) <= POP_SNAP_MS and (best is None or abs(t - at) < abs(best - at)):
            best = t
    if best is None and spans and (at >= spans[-1][1] or at + pop_ms <= spans[0][0]):
        return at, True                                    # before the first or after the last word
    if best is None and not any(a < at + pop_ms and b > at for a, b in spans):
        return at, True
    return (best, True) if best is not None else (at, False)


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
            t, in_gap = pop_time(s['startMs'] + at, spans)
            out.append({'src': 'job/sfx_pop.wav', 'atMs': t, 'volume': POP_VOLUME if in_gap else POP_VOLUME_ON_WORD})
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
    """Copy every asset the props reference from the job into studio/remotion/public/job/.
    Returns (copied, missing): a referenced asset the job does not have is listed in missing (the Remotion
    composition refuses to render without it)."""
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
    copied, missing = [], []
    for src in sorted(wanted):
        origin = sources.get(src) or (job_dir / 'shots' / Path(src).name if src.startswith('job/shots/') else None)
        if origin and Path(origin).exists():
            (pub / src).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(origin, pub / src)
            copied.append(src)
        else:
            missing.append(src)
    return copied, missing


def master(in_video, out_video, lufs=-14.0, true_peak=-1.5, lra=11.0):
    """Two-pass loudnorm of a rendered reel to -14 LUFS / -1.5 dBTP (app.audio.master), video stream copied."""
    from app import audio     # numpy lives there; keep this module importable without it
    return audio.master(str(in_video), str(out_video), I=lufs, TP=true_peak, LRA=lra)


def render(job_dir, props_path=None, out=None, scale=None):
    """npx remotion render Explainer with the job's props, then the loudness master. Returns the master stats."""
    job_dir = Path(job_dir).resolve()   # Remotion runs from studio/remotion, so every path must be absolute
    props_path = Path(props_path).resolve() if props_path else job_dir / 'edit_explainer.json'
    out = Path(out).resolve() if out else job_dir / 'final_explainer.mp4'
    raw = out.with_name(out.stem + '.raw.mp4')
    cmd = ['npx', 'remotion', 'render', 'Explainer', str(raw), f'--props={props_path}', '--log=error']
    if scale:
        cmd.append(f'--scale={scale}')
    subprocess.run(cmd, cwd=REMOTION, check=True)
    stats = master(raw, out)
    raw.unlink(missing_ok=True)
    return stats


def load_cuts(path):
    """Jump-cut times (ms) from a cuts file: a plain list, or app.tighten's cuts.json ({'cuts': [{'at_ms'}, ...]})."""
    data = json.loads(Path(path).read_text())
    if isinstance(data, dict):
        data = data.get('cuts') or []
    return [round(c['at_ms']) if isinstance(c, dict) else round(c) for c in data]


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
    r = sub.add_parser('render', help='render <job>/edit_explainer.json and master it to -14 LUFS')
    r.add_argument('job')
    r.add_argument('--props', help='default <job>/edit_explainer.json')
    r.add_argument('--out', help='default <job>/final_explainer.mp4')
    r.add_argument('--scale', type=float)
    m = sub.add_parser('master', help='loudness master of a rendered video (-14 LUFS, -1.5 dBTP)')
    m.add_argument('input')
    m.add_argument('out')
    args = parser.parse_args(argv)

    if args.cmd == 'synth':
        Path(args.out).write_text(json.dumps(synth_captions(args.spec, wpm=args.wpm), indent=1))
        print(args.out)
        return 0
    if args.cmd == 'master':
        print(json.dumps(master(args.input, args.out)['output'], indent=1))
        return 0
    if args.cmd == 'render':
        print(json.dumps(render(args.job, args.props, args.out, args.scale)['output'], indent=1))
        return 0

    job = Path(args.job).resolve()
    cuts = []
    if args.cuts and Path(args.cuts).exists():
        cuts = load_cuts(args.cuts)
    elif args.cuts:
        cuts = [int(x) for x in args.cuts.split(',') if x.strip()]
    elif (job / 'cuts.json').exists():
        cuts = load_cuts(job / 'cuts.json')
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
        summary['staged'], missing = stage(job, props)
        if missing:
            summary['missing'] = missing
            print(json.dumps(summary, indent=1))
            print(f'error: {len(missing)} referenced asset(s) are not in the job: {", ".join(missing)}', file=sys.stderr)
            return 1
    print(json.dumps(summary, indent=1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
