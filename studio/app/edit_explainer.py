"""Explainer edit: map a reference replication spec onto OUR avatar timeline and write props for the Remotion
"Explainer" composition (studio/remotion/src/explainer).

  python -m app.edit_explainer build <job_dir> [--cuts 12340,20110] [--stage]
  python -m app.edit_explainer render <job_dir> [--out final.mp4]        # Remotion render + -14 LUFS master
  python -m app.edit_explainer master <in.mp4> <out.mp4>                 # the loudness master on its own
  python -m app.edit_explainer synth <spec.json> <captions_out.json>     # placeholder timings for layout work

Theme "seam" (the news split-screen format, job 91ac50635d3d): seam_normalise() and _seam_overlays() document the
units-spec fields; `build` prints the layout per scene (A/B) and every authoring warning.

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
   beside it, sized to fit. The hook caption does the same while the presenter hangs upside-down (flip_caption_y:
   an inverted face covers 1 - y - h).
10. Fine print people must read (unit "overlay_hold_ms", e.g. the attribution chip) stays up that long: it runs on
   over the next contiguous scenes without an overlay of their own, on each scene's chip line (_carry_overlays).
11. spec "theme": "harvest" (the Nate Herk format, reel #2) writes props.theme = "harvest": unit types "avatar + text
   card" / "avatar + recording" (split), "recording + pip", "stat card" and "text card" with a designed "card";
   per-unit tone, fx, caption_y, focus_y, crop_top and mask; chunk captions from on_screen_text ({teal}/{red}/
   {white} line colours, *serif* keyword lines) instead of headlines; scene changes snap onto jump cuts; no end
   card, so the reel ends with the take. Without "theme" nothing changes. In this theme a caption chunk is up at
   least CHUNK_MIN_MS (a shorter one joins the next or holds) and its edges snap onto a scene change within
   CHUNK_SNAP_MS (no caption jumping position for a frame or two); unit "swap" ({"at": word, "screenrec"?, "use"?,
   "focus_y"?}) is a soft content swap inside a long recording scene; push-ins never crop into the page's content
   span (content_span); card pops play only in a word gap and the CTA tap stays at CTA_TICK_VOLUME.
12. An "a-b s" range that would play faster than RATE_MAX in its scene keeps its end (the proof) and loses its head.
13. Word onsets: Whisper often opens a word at the end of the word before it, so the pause after a comma ("...AI, and
   it already...") belongs to the next word and a caption or a cut placed on it lands 0.3-0.5 s early.
   refine_word_starts() reads the take's voice envelope (voice_envelope(): 10 ms RMS of the avatar's audio) and moves
   such a word's start to the measured onset after the pause, so captions, unit boundaries and cuts follow the voice.
14. Theme "harvest" extras: unit "layout": "bleed" fills the whole frame with the recording (the reference's
   full-screen CRM, scene 2; a 9:16 recording fits exactly, its size is probed) with a slow push-in to unit "push"
   (end scale) and the caption pill at 0.50H; unit "caption_pill" ("dark" | "light" | "none") overrides the pill of
   one scene (a dark split over dense page text); the CTA's timing (typing, hand, tap, shrink, morph, notification)
   is computed once here (cta_timing) and drives both Remotion and the tap/notification SFX.
15. spec "theme": "seam" (the news split-screen format, job 91ac50635d3d) writes props.theme = "seam": every unit is a
   split cut at the fixed seam (y 560): unit "layout" "A" (recording top / presenter bottom) or "B" (the flip), hard
   cuts; the presenter is one continuous take framed per layout from the face box (seam_framing), and every jump cut
   steps its panel 1.00/1.06 (seam_punches) instead of splitting the scene; LED caption chunks on the seam from beat
   "captions" / "emphasis" (or phrase_chunks); unit "overlays" (hook, pill, count, marker, ellipse, ripple, punch, cta)
   are timed on spoken words or on the recording's clock (measured highlights: shots/recordings.json); unit "plate"
   is the CTA plate. Authoring problems come back in meta.warnings.
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
RATE_MAX = 2.5             # no recording ever plays faster (an "a-b s" range that would loses its head instead)
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
POP_HEAD_MS = 20           # a pop's energy sits in its first 20 ms: on the cut frame only its tail may meet a word...
POP_HEAD_OVERLAP_MS = 10   # ...(its head may touch the next word's onset by at most this much)
FRAME_MS = 40              # 25 fps: harvest SFX start on whole frames, floored (never rounded later onto a word)

# Word onsets (refine_word_starts): a pause is ONSET_SIL_DB under the voice level (the 75th percentile of the voiced
# 10 ms frames), at least ONSET_MIN_SIL_MS long and starting within ONSET_RUN_START_MS of the word's caption start.
ONSET_HOP_MS = 10
ONSET_SIL_DB = 16
ONSET_MIN_SIL_MS = 120
ONSET_RUN_START_MS = 200
ONSET_MIN_SHIFT_MS = 80
ONSET_LEAD_MS = 30

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
HOOK_CAPTION_Y = 0.69      # Captions.tsx HookCaption centre once the presenter is upright (the reference's line)
HOOK_CAPTION_HALF_PX = 30  # half its height: 44 px Inter 800, line-height 1.2, plus the 5 px outline
SAFE_BOTTOM = 0.79         # the Reels caption block and right rail live below this
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
        # "avatar + recording" / "avatar + text card": the presenter under a recording or a designed card (split).
        return 'split' if unit.get('screenrec') or unit.get('card') else 'avatar'
    if t.startswith('avatar'):
        return 'avatar'
    if 'pip' in t:                    # "recording + pip": full-frame recording with the presenter in a small window
        return 'pip'
    if t.startswith('stat card'):     # a designed stat pop (e.g. a star counter rolling up)
        return 'stat'
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
    """Screen recording plans by recording id: <job>/shots/plans/<id>.json (the plans that recorded the production
    shots), else <job>/analysis/screenrec/plans/<id>.json, else next to the spec."""
    dirs = [Path(job_dir) / 'shots' / 'plans', Path(job_dir) / 'analysis' / 'screenrec' / 'plans']
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
    # Framing of the recording inside its box (theme "harvest"): focus_y aligns a cover crop (0 top, 1 bottom);
    # crop_top cuts that fraction of the source off the top and fits the width; mask covers boxes of the source
    # (fractions [x, y, w, h], e.g. a third-party logo in a page header).
    if unit.get('focus_y') is not None:
        plan['focusY'] = float(unit['focus_y'])
    if unit.get('crop_top') is not None:
        plan['cropTop'] = float(unit['crop_top'])
    if unit.get('mask'):
        plan['masks'] = [{'box': [float(v) for v in m['box']], 'color': m.get('color', '#000000')} for m in unit['mask']]
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


def probe_size(path):
    """(width, height) of a video's first stream, or None."""
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                              '-of', 'csv=p=0', str(path)], capture_output=True, text=True, timeout=60)
        w, h = (int(x) for x in out.stdout.strip().split(',')[:2])
        return w, h
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def recording_sizes(job_dir, probe=probe_size):
    """Pixel size per recording id in <job>/shots (most are 1080x1350; a full-bleed recording is 9:16)."""
    shots = Path(job_dir) / 'shots'
    out = {}
    if shots.is_dir():
        for f in shots.glob('*.mp4'):
            size = probe(f)
            if size:
                out[f.stem] = tuple(size)
    return out


def voice_envelope(path, hop_ms=ONSET_HOP_MS, rate=16000):
    """RMS level (dBFS) of a video's or audio file's sound per hop_ms, from ffmpeg's 16 kHz mono PCM; None when the
    file has no audio. Standard library only (array + math)."""
    import array
    import math
    try:
        out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vn', '-ac', '1', '-ar', str(rate), '-f', 's16le', '-'],
                             capture_output=True, timeout=300)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if out.returncode != 0 or not out.stdout:
        return None
    pcm = array.array('h')
    pcm.frombytes(out.stdout[:len(out.stdout) // 2 * 2])
    if sys.byteorder == 'big':
        pcm.byteswap()
    n = rate * hop_ms // 1000
    env = []
    for i in range(0, len(pcm) - n + 1, n):
        frame = pcm[i:i + n]
        env.append(round(10 * math.log10(sum(x * x for x in frame) / n / 32768.0 ** 2 + 1e-12), 1))
    return env


def voice_level(env, floor_db=-60.0):
    """The voice's level: the 75th percentile of the voiced frames (above floor_db)."""
    voiced = sorted(x for x in env if x > floor_db)
    return voiced[int(0.75 * (len(voiced) - 1))] if voiced else None


def clause_starts(beats, caps):
    """Caption indices of the words that open a clause: the word before them ends in , ; : . ! ? in the script (the
    beats' lines, aligned to the captions word by word) or in the captions. Whisper drops many commas ("ScrapeGraph
    AI and it already"), so the script is the better cue for where the voice pauses."""
    out = {i for i in range(1, len(caps)) if ends_clause(caps[i - 1]['text'])}
    words = [wd for beat in beats for wd in (beat.get('line') or '').split()]
    script, owner = [], []
    for k, wd in enumerate(words):
        for t in tokens(wd):
            script.append(t)
            owner.append(k)
    cap_toks, cap_owner = [], []
    for i, c in enumerate(caps):
        for t in tokens(c['text']):
            cap_toks.append(t)
            cap_owner.append(i)
    first_cap = {}
    for a, b, n in difflib.SequenceMatcher(None, script, cap_toks, autojunk=False).get_matching_blocks():
        for q in range(n):
            first_cap.setdefault(owner[a + q], cap_owner[b + q])
    for k in range(len(words) - 1):
        if ends_clause(words[k]) and first_cap.get(k + 1):
            out.add(first_cap[k + 1])
    return out


def refine_word_starts(caps, env, candidates=None, hop_ms=ONSET_HOP_MS):
    """Caption words with their starts moved onto the measured onset when Whisper opened them on the pause before
    them: from the word's start the level only decays (the previous word's tail, never a new rise), drops into a pause
    of at least ONSET_MIN_SIL_MS within ONSET_RUN_START_MS, and the voice comes back after it. The word then starts
    ONSET_LEAD_MS before that onset (never after the next word's start) and keeps at least 60 ms. Only the caption
    indices in `candidates` are looked at (clause_starts(): words after a comma or a full stop; None = every word),
    so a short word said right before a pause is never pushed onto the next one. Returns
    (new caps, [(index, old start, new start)])."""
    out = [dict(c) for c in caps]
    level = voice_level(env or [])
    if level is None:
        return out, []
    sil = level - ONSET_SIL_DB
    moved = []
    for i, w in enumerate(out):
        if candidates is not None and i not in candidates:
            continue
        nxt = out[i + 1]['startMs'] if i + 1 < len(out) else w['endMs'] + 300
        f0, f1 = int(w['startMs'] // hop_ms), int(nxt // hop_ms)
        if f0 >= len(env) or f1 <= f0:
            continue
        # Whisper opened the word late, inside its own sound: the voice already rose out of a pause after the
        # previous word and before this start ("it. | Get picked": silence 2400-2520, "Get" 2540-2660, Whisper 2611).
        # The pause found after it is the word's own stop closure (the /t/ of "Get"), never its onset.
        p0 = max(int(out[i - 1]['endMs'] // hop_ms) if i else 0, f0 - ONSET_RUN_START_MS // hop_ms)
        if 0 < f0 <= len(env) and env[f0 - 1] >= sil and any(v < sil for v in env[p0:f0 - 1]):
            continue
        start_level, run = env[f0], None
        for k in range(f0, min(f1, f0 + ONSET_RUN_START_MS // hop_ms + 1, len(env))):
            if env[k] < sil:
                run = k
                break
            if env[k] > start_level + 3:              # a rise: the word really starts here
                break
        if run is None:
            continue
        k = run
        while k < min(len(env), f1 + 100 // hop_ms) and env[k] < sil:
            k += 1
        if (k - run) * hop_ms < ONSET_MIN_SIL_MS or k >= len(env):
            continue
        new = min(k * hop_ms, nxt) - ONSET_LEAD_MS
        if new - w['startMs'] < ONSET_MIN_SHIFT_MS:
            continue
        moved.append((i, w['startMs'], new))
        w['startMs'] = new
        w['endMs'] = max(w['endMs'], min(nxt, new + 60))
    return out, moved


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


def flip_caption_y(face=None):
    """Centre (fraction of H) of the hook caption while the presenter hangs upside-down. A face box (x, y, w, h)
    turned 180 degrees about the frame centre covers y' = 1 - y - h .. 1 - y: for the studio take 0.48-0.81H, so the
    upright caption line (HOOK_CAPTION_Y) would run across the eyes. The caption sits above the inverted face (on the
    shirt) instead, below the Reels header; under it if there is no room; HOOK_CAPTION_Y when that is already clear.
    Captions.tsx moves it with the drop and eases it to HOOK_CAPTION_Y as the whip rights him."""
    _, y, _, h = face or DEFAULT_FACE_BOX
    top, bot = (1 - y - h) * CANVAS_H, (1 - y) * CANVAS_H
    half, m = HOOK_CAPTION_HALF_PX, FACE_MARGIN_PX
    cy = HOOK_CAPTION_Y * CANVAS_H
    if cy + half + m <= top or cy - half - m >= bot:
        return HOOK_CAPTION_Y
    above = top - m - half
    if above - half >= SAFE_TOP_PX:
        return round(above / CANVAS_H, 4)
    below = bot + m + half
    if below + half <= SAFE_BOTTOM * CANVAS_H:
        return round(below / CANVAS_H, 4)
    return round(max(above, SAFE_TOP_PX + half) / CANVAS_H, 4)


def _take_face(spec, take):
    """The face box of a take from spec heygen.take_A / take_B "face_box" ([x, y, w, h] fractions), else None."""
    box = (((spec.get('heygen') or {}).get(take) or {}).get('face_box'))
    return [float(v) for v in box] if isinstance(box, (list, tuple)) and len(box) == 4 else None


# ----------------------------------------------------------------------------------------------- highlight boxes

HL_W, HL_H = 540, 675        # highlight detection works on half-resolution frames of the 1080x1350 recordings
ZOOM_BAND = 0.45             # rows within this much (fraction of the height) of a box centre can show in its push-in


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


def content_span(rgb, w=HL_W, h=HL_H, y0=0.0, y1=1.0, min_ink=2, tol=48):
    """[x0, x1] (fractions of the width) of the page's content in rows y0..y1 (fractions) of one rgb24 frame: the
    columns holding at least min_ink pixels that differ from the page background (the frame's most common colour,
    summed channel difference over tol). A push-in that keeps this span in view crops only the page's margins,
    never a word. None when the band holds no content."""
    if not rgb or len(rgb) < w * h * 3:
        return None
    counts = {}
    for i in range(0, w * h * 3, 3 * 7):                         # every 7th pixel is plenty for the background
        key = (rgb[i] >> 3, rgb[i + 1] >> 3, rgb[i + 2] >> 3)
        counts[key] = counts.get(key, 0) + 1
    br, bg_, bb = (8 * v + 4 for v in max(counts, key=counts.get))
    r0, r1 = max(0, int(y0 * h)), min(h, int(round(y1 * h)))
    ink = [0] * w
    for y in range(r0, r1):
        row = rgb[y * w * 3:(y + 1) * w * 3]
        for x in range(w):
            i = 3 * x
            if abs(row[i] - br) + abs(row[i + 1] - bg_) + abs(row[i + 2] - bb) > tol:
                ink[x] += 1
    cols = [x for x in range(w) if ink[x] >= min_ink]
    if not cols:
        return None
    return [round(cols[0] / w, 4), round((cols[-1] + 1) / w, 4)]


def highlight_boxes(video, plan, src_len=None, grab=_frame_rgb):
    """[{'startMs', 'endMs', 'box', 'content'?}] for every highlight action of a recording plan, on the recording's
    own clock (plan_actions timing), box = the outline found in the shot halfway through it (None if not found);
    content = content_span() of the rows a push-in on the box can show (theme "harvest" keeps it in view)."""
    out = []
    for kind, a, b in plan_actions(plan, src_len):
        if kind != 'highlight':
            continue
        box, content = None, None
        if video and Path(video).exists():
            rgb = grab(video, a + 0.45 * (b - a))
            box = yellow_box(rgb) if rgb else None
            if box:
                cy = box[1] + box[3] / 2
                content = content_span(rgb, y0=cy - ZOOM_BAND, y1=cy + ZOOM_BAND)
        out.append({'startMs': round(a), 'endMs': round(b), 'box': box, **({'content': content} if content else {})})
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
                speech=None, duration_ms=None, plans=None, highlights=None, face_boxes=None, envelope=None, sizes=None,
                measured=None):
    """Props for the Explainer composition. spec_json / captions_json: paths or already-loaded objects.
    envelope: the take's voice level per ONSET_HOP_MS (voice_envelope; default: measured on <job>/<avatar> when it
    exists, False skips) moves word starts that sit on a pause onto the voice (refine_word_starts).
    sizes: {recording id: (w, h)} (default: probed in <job>/shots); a recording that is not 1080x1350 carries its size.
    cuts: ms on our timeline where the take was spliced. tail: src of the second look (beats from the unit typed
    "second setup" on); tail_start_ms: where take B starts on the timeline (default: that beat's cut).
    plans: screen recording plans by id (default: read from the job / next to the spec).
    highlights: {recording id: highlight_boxes()} (default: found in <job>/shots/<id>.mp4).
    face_boxes: {'avatar': [x, y, w, h], 'tail': [...]} fractions (default: spec heygen take_A / take_B face_box).
    measured: theme "seam": {recording id: [{'startMs', 'endMs', 'box'?}]} highlight times measured on the shots
    (default: <job>/shots/recordings.json, see seam_measured_highlights)."""
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
    if envelope is None and avatar.startswith('job/') and (job_dir / Path(avatar).name).exists():
        envelope = voice_envelope(job_dir / Path(avatar).name)
    onsets_moved = []
    if envelope:
        caps, onsets_moved = refine_word_starts(caps, envelope, clause_starts(spec['beats'], caps))
    if sizes is None:
        sizes = recording_sizes(job_dir)
    keyword = spec.get('keyword') or ''
    theme = spec.get('theme') or 'default'
    harvest = theme == 'harvest'
    seam = theme == 'seam'
    if seam:
        spec = seam_normalise(spec)
    split_theme = harvest or seam      # the units-spec formats: splits, no flip-in, scene changes on the jump cuts
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
    if split_theme and not duration_ms and avatar.startswith('job/'):
        # No end card: the reel ends on the CTA close-up, so it never runs past the take (no frozen last frame).
        take_len = probe(job_dir / Path(avatar).name)
        if take_len:
            total = max(last_end + 40, min(total, int(take_len) // 40 * 40))
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
                    scene['flipCaptionY'] = flip_caption_y(faces.get('avatar'))
            elif st != 'endcard':
                scene['system'] = 'explainer'
            if split_theme and st == 'avatar':
                scene['system'] = 'talk'          # the reference opens on a split: no flip-in, one caption system
                scene.pop('flipIn', None)
                scene.pop('flipHoldMs', None)
                scene.pop('flipCaptionY', None)
            for key, out_key in (('card', 'card'), ('tone', 'tone'), ('fx', 'fx'), ('caption_y', 'captionY'),
                                 ('caption_pill', 'pill'), ('push', 'push')):
                if unit.get(key) is not None:     # designed cards and per-scene look (theme "harvest")
                    scene[out_key] = unit[key]
            if unit.get('layout') == 'bleed' and st == 'card':
                scene['bleed'] = True             # the recording fills the frame (the reference's full-screen UI)
            if seam and st == 'split' and seam_layout(unit) == 'B':
                scene['flip'] = True              # theme "seam": presenter on top, the proof page below
            if seam and st == 'split':
                scene.update(seam_panel_framing(unit))
            plan = _recording_plan(unit, durations, plans, highlights)
            if plan and st in ('card', 'stat', 'split', 'text', 'pip'):
                scene['_rec'] = plan
            text_all = ' '.join(str(unit.get(x) or '') for x in ('use', 'footage'))
            if re.search(r'slides? up from the bottom', text_all, re.I):
                scene['cardSlide'] = 'up'
            ov = _overlay(unit, st)
            if ov and unit.get('overlay_at_ms') is not None:
                ov['atMs'] = int(unit['overlay_at_ms'])
            if ov and unit.get('overlay_hold_ms'):
                ov['_holdMs'] = int(unit['overlay_hold_ms'])
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
    if split_theme:
        scenes = _merge_same_shots(scenes)
        _snap_to_cuts(scenes, sorted(cuts or []), SEAM_SNAP_MS if seam else SNAP_MS)
    if not seam:                     # theme "seam" keeps its splits whole: every jump cut steps the presenter panel
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
    if split_theme:
        scenes = _content_swaps(scenes, caps, durations, plans, highlights)
    if seam:
        for s in scenes:             # the highlight boxes found in the shot, before _finish_recordings drops the plan
            if s.get('_rec'):
                s['_hl'] = s['_rec'].get('hl')
    _finish_recordings(scenes, caps)
    for s in scenes:                 # a recording that is not 4:5 carries its size (HarvestRecording fits it)
        rec = s.get('recording')
        size = (sizes or {}).get(Path(rec['src']).stem) if rec else None
        if size and tuple(size) != (REC_W, REC_H):
            rec['size'] = [int(size[0]), int(size[1])]
    for s in scenes:                 # display words never cover the face of the take they sit on
        ov = s.get('overlay')
        if ov and ov['kind'] == 'bigtext':
            face = faces.get('tail') if tail_ms is not None and s['startMs'] >= tail_ms - 40 else faces.get('avatar')
            ov.update(place_display_word(ov['text'], ov.get('y', 0.18), face))

    words = display_words(caps, keyword)
    _flag_emphasis(words, beats, word_ranges)
    headlines = [] if harvest else _headline_pages(beats, words, word_ranges, ends, scenes)
    for s in scenes:
        ov = s.get('overlay')
        if ov and ov['kind'] == 'chip' and '\n' in ov['text']:
            ov['itemsAtMs'] = _spoken_number_times(ov['text'], words, s)
        elif ov and ov['kind'] == 'chip' and s['type'] != 'endcard' and s['_unit'].get('overlay_at_ms') is None:
            at = _spoken_chip_time(ov['text'], words, s)
            if at is not None:       # a chip naming a spoken word ("withhammad.com") pops as it is said
                ov['atMs'] = at

    _carry_overlays(scenes, tail_ms)

    cta = None
    cta_k = next((k for k, b in enumerate(beats) if 'cta' in b.get('name', '')), None)
    lo, hi = (starts[cta_k], ends[cta_k]) if cta_k is not None else (0, total)
    hit = next((w for w in words if clean(w['text']) == 'comment' and lo <= w['startMs'] < hi), None) \
        or next((w for w in words if clean(w['text']) == 'comment'), None)
    if keyword and hit:
        cta = {'keyword': keyword, 'atMs': hit['startMs'], 'handle': 'with.hammad', 'reply': 'Here you go!'}

    spans_ms = speech if speech is not None else [(w['startMs'], w['endMs']) for w in words]
    if seam:
        props = _seam_props(job_dir, spec, scenes, words, beats, word_ranges, spans_ms, total, avatar, faces, music,
                            starts, ends, cuts, sizes, measured)
        props['meta']['onsets'] = [{'word': caps[i]['text'].strip(), 'fromMs': a, 'toMs': b} for i, a, b in onsets_moved]
        return props
    if harvest:
        props = _harvest_props(spec, scenes, words, beats, word_ranges, cta, spans_ms, total, avatar, faces, music, starts, ends, cuts)
        props['meta']['onsets'] = [{'word': caps[i]['text'].strip(), 'fromMs': a, 'toMs': b} for i, a, b in onsets_moved]
        return props
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


# ----------------------------------------------------------------------------------------------- theme "harvest"
# The Nate Herk reference format (job f7da978d101e, analysis/visual.md): split screens (card on top, presenter
# below), close-up punch-ins, recordings on a plain off-white canvas, a PiP composer, designed title/logo/stat
# cards, chunk captions (white heavy sans + teal serif keyword line) and a comment-composer CTA. Remotion draws it
# from props.theme = "harvest" (src/explainer/harvest); the default theme is untouched.

SNAP_MS = 120              # a scene boundary this close to a jump cut moves onto it (the scene change IS the cut)
CHUNK_HOLD_MS = 700        # a caption chunk clears this long after its last word (no stale text in a pause)
# The CTA (harvest/HarvestCta.tsx reads props.cta.timing; measured on the reference at 30 fps, 41.8-42.9 s): the
# keyword types fast, the hand rises from below the pill as the typing ends, taps 60 ms after it arrives, the
# composer shrinks for 100 ms and smears sideways into the notification, which lands ~0.9 s after the composer
# opened, overshoots to 1.04 and settles over 150 ms.
CTA_TYPE_START_MS = 40
CTA_CHAR_MS = 45
CTA_HAND_RISE_MS = 300
CTA_TAP_AFTER_MS = 60      # the tap, after the hand arrives
CTA_SHRINK_AFTER_MS = 80   # the shrink starts this long after the tap...
CTA_SHRINK_MS = 100        # ...and lasts this long (pill and avatar to 0.9)
CTA_MORPH_MS = 100         # the sideways smear: composer out, notification in (2-3 frames)
CTA_SETTLE_MS = 150        # the notification's overshoot (1.04) settles to 1.0 over this long
HARVEST_WHOOSH = 0.12      # softer than the default: the reference cuts hard
HARVEST_PUSH = 0.5         # push-ins keep half their depth: harvest cards are 1.2-1.3x wider than the default card,
                           # so the text is already larger, and a full push cropped the start of highlighted lines
ZOOM_MIN_SCALE = 1.04      # ...and never crop into the page's content: a push the content span allows less than this
CONTENT_PAD = 0.01         # is dropped (the reference cuts hard and never zooms into its recordings mid-word)
CHUNK_SNAP_MS = 120        # a caption chunk edge within 3 frames of a scene change moves onto it (no 1-2 frame jump
                           # of the caption to the next scene's position)
CHUNK_MIN_MS = 350         # a chunk is up at least this long (the reference changes chunks every 0.35-0.6 s)
CHUNK_MERGE_CHARS = 16     # ...a shorter one joins the next chunk's sans line when the two fit one line, else holds
CTA_TICK_VOLUME = 0.12     # the CTA tap (reel #1 level): it lands on the CTA line, so it stays under the voice
CTA_NOTIF_VOLUME_ON_WORD = 0.07
_CAP_COLOR = re.compile(r'^\{(teal|red|white|yellow)\}\s*')   # yellow: theme "seam" emphasis chunks


def cta_timing(keyword):
    """The CTA's beats in ms after cta.atMs (the composer opens): typing, hand rise, tap, shrink, morph, notification.
    The hand starts rising when the last character lands; a 7-letter keyword puts the notification at ~0.9 s."""
    type_end = CTA_TYPE_START_MS + max(1, len(keyword or '')) * CTA_CHAR_MS
    hand_at = type_end + CTA_HAND_RISE_MS
    tap = hand_at + CTA_TAP_AFTER_MS
    shrink = tap + CTA_SHRINK_AFTER_MS
    notif = shrink + CTA_SHRINK_MS
    return {'typeStartMs': CTA_TYPE_START_MS, 'charMs': CTA_CHAR_MS, 'handStartMs': type_end, 'handAtMs': hand_at,
            'tapMs': tap, 'shrinkMs': shrink, 'notifMs': notif, 'morphMs': CTA_MORPH_MS, 'settleMs': CTA_SETTLE_MS}


def _snap_to_cuts(scenes, cuts, snap_ms=SNAP_MS):
    """Move the scene boundary nearest each jump cut onto the cut when it is within snap_ms, so no scene shows the
    jump for a frame or two (both neighbours keep at least MIN_SCENE_MS)."""
    for c in cuts:
        best = None
        for i in range(1, len(scenes)):
            b = scenes[i]['startMs']
            if scenes[i - 1]['endMs'] == b and abs(b - c) <= snap_ms and (best is None or abs(b - c) < abs(scenes[best]['startMs'] - c)):
                best = i
        if best is None or scenes[best]['startMs'] == c:
            continue
        a, b = scenes[best - 1], scenes[best]
        if c - a['startMs'] >= MIN_SCENE_MS and b['endMs'] - c >= MIN_SCENE_MS:
            a['endMs'] = b['startMs'] = c
    return scenes


def _merge_same_shots(scenes):
    """Contiguous talking-head scenes with the same framing are one shot (a bridge word that opens the next beat,
    "like," before the PiP): merged into the first, so a jump cut just after it can still take the scene change."""
    out = []
    for s in scenes:
        p = out[-1] if out else None
        if (p is not None and p['type'] == s['type'] == 'avatar' and p['endMs'] == s['startMs'] and not s.get('overlay')
                and not p.get('overlay') and p.get('punch', 1) == s.get('punch', 1)):
            p['endMs'] = s['endMs']
            continue
        out.append(s)
    return out


def caption_pages(text):
    """A beat's on_screen_text as caption chunks: [[{'words', 'serif', 'color'}]] (pages of lines). "|" starts a
    chunk, "/" a line; a line wrapped in *...* is the serif keyword line; a leading {teal} / {red} / {white} sets
    the line's colour (default: sans white, serif teal)."""
    pages = []
    for raw in (text or '').split('|'):
        lines = []
        for line in raw.split('/'):
            line = line.strip()
            m = _CAP_COLOR.match(line)
            color = m.group(1) if m else None
            if m:
                line = line[m.end():].strip()
            serif = len(line) > 1 and line.startswith('*') and line.endswith('*')
            if serif:
                line = line[1:-1].strip()
            words = line.replace('*', '').split()
            if words:
                lines.append({'words': words, 'serif': serif, 'color': color or ('teal' if serif else 'white')})
        if lines:
            pages.append(lines)
    return pages


def harvest_chunks(beats, words, word_ranges, cta_ms=None, hold_ms=CHUNK_HOLD_MS, beat_ends=None):
    """Caption chunks timed on OUR words: [{'startMs', 'endMs', 'lines': [{'text', 'startMs', 'serif', 'color'}]}].
    Each line hard-cuts on when its first word is said (the serif keyword joins under the sans line when the voice
    reaches it, like the reference); a word the voice says differently ("31,000+" for "thirty-one thousand") takes
    the next spoken word after the previous chunk. A chunk holds until the next one, at most hold_ms after its last
    word, never past its beat's last scene (beat_ends: no caption on the next beat's logo card) and never into the
    CTA (the composer types the keyword there)."""
    out = []
    for k, beat in enumerate(beats):
        pages = caption_pages(beat.get('on_screen_text'))
        lo, hi = word_ranges[k]
        bw = [w for w in words if lo <= w['_i'] <= hi]
        if not pages or not bw:
            continue
        disp, owner = [], []
        for p, page in enumerate(pages):
            for li, line in enumerate(page):
                for j, text in enumerate(line['words']):
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
        built, last_n = [], -1
        for p, page in enumerate(pages):
            lines, page_last = [], last_n
            for li, line in enumerate(page):
                idx = [hit.get((p, li, j)) for j in range(len(line['words']))]
                matched = [n for n in idx if n is not None]
                start = min(matched) if matched else None
                if start is None or (idx[0] is None and last_n + 1 < start):
                    start = min(last_n + 1, len(bw) - 1) if start is None else last_n + 1
                if start <= last_n and not matched:
                    continue
                lines.append({'text': ' '.join(line['words']), 'startMs': bw[start]['startMs'], 'serif': line['serif'],
                              'color': line['color'], '_n': start})
                page_last = max([page_last, start] + matched)
            if not lines:
                continue
            t0 = min(x['startMs'] for x in lines)
            if built and t0 <= built[-1]['startMs']:
                t0 = built[-1]['startMs'] + 40
            for x in lines:
                x['startMs'] = max(x['startMs'], t0)
            built.append({'startMs': t0, '_last': page_last, 'lines': lines})
            last_n = page_last
        for q, pg in enumerate(built):
            nxt = built[q + 1]['startMs'] if q + 1 < len(built) else None
            end = bw[pg['_last']]['endMs'] + hold_ms
            pg['endMs'] = min(end, nxt) if nxt is not None else end
            if cta_ms is not None and pg['startMs'] < cta_ms:
                pg['endMs'] = min(pg['endMs'], cta_ms)
            if beat_ends and beat_ends[k] is not None:
                pg['endMs'] = min(pg['endMs'], beat_ends[k])
        for pg in built:
            if pg['endMs'] - pg['startMs'] >= 80 and (cta_ms is None or pg['startMs'] < cta_ms):
                out.append({'startMs': pg['startMs'], 'endMs': pg['endMs'],
                            'lines': [{kk: v for kk, v in x.items() if not kk.startswith('_')} for x in pg['lines']]})
    for q in range(len(out) - 1):                 # chunks of neighbouring beats never overlap
        out[q]['endMs'] = min(out[q]['endMs'], out[q + 1]['startMs'])
    return out


def hold_short_chunks(chunks, min_ms=CHUNK_MIN_MS, merge_chars=CHUNK_MERGE_CHARS):
    """No chunk flickers by: one up for less than min_ms joins the next chunk when it directly follows and the two
    sans lines fit one line ("AND BECAUSE" + "IT CAN RUN" is too long, "RUN IT" + "EVERY MORNING" fits), else it
    holds min_ms and the next chunk starts that much later (its lines with it), as long as the next one keeps
    min_ms itself. Returns new chunk dicts."""
    out = [{**c, 'lines': [dict(l) for l in c['lines']]} for c in chunks]
    q = 0
    while q < len(out):
        c = out[q]
        nxt = out[q + 1] if q + 1 < len(out) else None
        if c['endMs'] - c['startMs'] >= min_ms:
            q += 1
            continue
        joined = nxt is not None and nxt['startMs'] - c['endMs'] <= 40
        a, b = c['lines'], (nxt or {}).get('lines') or []
        if (joined and len(a) == 1 and not a[0].get('serif') and b and not b[0].get('serif')
                and a[0].get('color') == b[0].get('color') and len(a[0]['text']) + 1 + len(b[0]['text']) <= merge_chars):
            first = {**a[0], 'text': f"{a[0]['text']} {b[0]['text']}"}
            out[q] = {'startMs': c['startMs'], 'endMs': nxt['endMs'], 'lines': [first] + b[1:]}
            del out[q + 1]
            continue                      # the merged chunk is checked again
        want = c['startMs'] + min_ms
        if nxt is None:
            c['endMs'] = max(c['endMs'], want)
        elif nxt['startMs'] >= want:
            c['endMs'] = want             # a gap follows: hold into it
        elif nxt['endMs'] - want >= min_ms and joined:
            c['endMs'] = want
            nxt['startMs'] = want
            for l in nxt['lines']:
                l['startMs'] = max(l['startMs'], want)
        else:
            c['endMs'] = max(c['endMs'], min(want, nxt['startMs']))
        q += 1
    return out


def seam_hold_short_chunks(chunks, min_ms=CHUNK_MIN_MS, max_chars=None, max_delay_ms=FRAME_MS):
    """Theme "seam": a chunk up for less than min_ms never pushes the next one past its first word (the harvest rule
    held "THINK" 350 ms and showed "CREATOR BRANDS" 240 ms late). It joins the chunk after it when the two fit one
    caption (SEAM_CHUNK_MAX_CHARS), else the one before it, as extra lines that come up on their own words ("THINK" ->
    "THINK CREATOR BRANDS"; each line keeps its own colour), unless it ends on a function word: appended, it would
    leave the chunk dangling ("AND SIX WEEKS WITH", review r3), so it stays on its own; else it holds only as long as
    the next chunk can still start within max_delay_ms of its own start. Returns new chunk dicts."""
    max_chars = SEAM_CHUNK_MAX_CHARS if max_chars is None else max_chars
    out = [{**c, 'lines': [dict(l) for l in c['lines']]} for c in chunks]

    def text(c):
        return ' '.join(l['text'] for l in c['lines'])

    q = 0
    while q < len(out):
        c = out[q]
        if c['endMs'] - c['startMs'] >= min_ms:
            q += 1
            continue
        nxt = out[q + 1] if q + 1 < len(out) else None
        prv = out[q - 1] if q else None
        if nxt is not None and nxt['startMs'] - c['endMs'] <= 40 and len(text(c)) + 1 + len(text(nxt)) <= max_chars:
            out[q] = {'startMs': c['startMs'], 'endMs': nxt['endMs'], 'lines': c['lines'] + nxt['lines']}
            del out[q + 1]
            continue
        dangling = clean(c['lines'][-1]['text'].split()[-1]) in _FN_WORDS if c['lines'][-1]['text'].split() else False
        if (prv is not None and not dangling and c['startMs'] - prv['endMs'] <= 40
                and len(text(prv)) + 1 + len(text(c)) <= max_chars):
            prv['lines'] += c['lines']
            prv['endMs'] = c['endMs']
            del out[q]
            q = max(0, q - 1)
            continue
        want = c['startMs'] + min_ms
        c['endMs'] = max(c['endMs'], want if nxt is None else min(want, nxt['startMs'] + max_delay_ms))
        if nxt is not None and c['endMs'] > nxt['startMs']:
            nxt['startMs'] = c['endMs']
            for l in nxt['lines']:
                l['startMs'] = max(l['startMs'], nxt['startMs'])
        q += 1
    return out


def snap_chunks(chunks, boundaries, snap_ms=CHUNK_SNAP_MS):
    """Chunk edges within snap_ms of a scene change move onto it, so each chunk lives in one scene (no frame or two
    of a caption jumping to the next scene's caption position); lines never start before their chunk."""
    bs = sorted(boundaries)

    def snap(t):
        near = min(bs, key=lambda b: abs(b - t), default=None)
        return near if near is not None and abs(near - t) <= snap_ms else t

    out = []
    for c in chunks:
        c = {**c, 'lines': [dict(l) for l in c['lines']]}
        s0, e0 = c['startMs'], c['endMs']
        ns, ne = snap(s0), snap(e0)
        if ne - ns < 80:                  # a short chunk around one cut: it keeps the side it mostly sits on
            b = ns
            ns, ne = (b, e0) if e0 - b >= b - s0 else (s0, b)
        c['startMs'], c['endMs'] = ns, ne
        for l in c['lines']:          # the lines that opened the chunk open it on the cut (no empty first frame)
            l['startMs'] = ns if l['startMs'] <= s0 else max(l['startMs'], ns)
        if c['endMs'] - c['startMs'] >= 80:
            out.append(c)
    for q in range(len(out) - 1):
        out[q]['endMs'] = min(out[q]['endMs'], out[q + 1]['startMs'])
    out = [c for c in out if c['endMs'] - c['startMs'] >= 80]
    # A chunk the snap left a little under CHUNK_MIN_MS takes the rest from a contiguous neighbour in its scene
    # (an edge that is not a scene change moves), as long as that neighbour keeps CHUNK_MIN_MS.
    edges = set(bs)
    for q, c in enumerate(out):
        need = CHUNK_MIN_MS - (c['endMs'] - c['startMs'])
        if need <= 0:
            continue
        nxt = out[q + 1] if q + 1 < len(out) else None
        prv = out[q - 1] if q else None
        if nxt and nxt['startMs'] == c['endMs'] and c['endMs'] not in edges and nxt['endMs'] - (c['endMs'] + need) >= CHUNK_MIN_MS:
            c['endMs'] += need
            nxt['startMs'] = c['endMs']
            for l in nxt['lines']:
                l['startMs'] = max(l['startMs'], nxt['startMs'])
        elif prv and prv['endMs'] == c['startMs'] and c['startMs'] not in edges and (c['startMs'] - need) - prv['startMs'] >= CHUNK_MIN_MS:
            old = c['startMs']
            c['startMs'] -= need
            prv['endMs'] = c['startMs']
            for l in c['lines']:
                if l['startMs'] <= old:
                    l['startMs'] = c['startMs']
    return out


def harvest_zooms(zooms, depth=HARVEST_PUSH):
    """Push-ins for the harvest cards: half depth, and never deeper than the page's content span allows (the crop
    lands in the page's margins, never mid-word; the composition keeps that span in view). A push the content
    allows less than ZOOM_MIN_SCALE of is dropped."""
    out = []
    for z in zooms or []:
        scale = 1 + (z['scale'] - 1) * depth
        c = z.get('content')
        if c:
            scale = min(scale, 1 / max(0.05, c[1] - c[0] + 2 * CONTENT_PAD))
        if scale >= ZOOM_MIN_SCALE:
            out.append({**z, 'scale': round(scale, 3)})
    return out


def _content_swaps(scenes, caps, durations, plans=None, highlights=None):
    """unit["swap"] (theme "harvest"): a soft content swap inside a long recording scene, like the reference's at
    7.97 s and 39.57 s: the recording changes at a spoken word while the presenter runs on (a split keeps its
    framing, so only the top half cuts). {"at": word | {"word", "occurrence"}, "screenrec"?, "use"?, "focus_y"?,
    "tone"?}. Without a screenrec of its own the second part continues the same recording, and a "a-b s" range is
    shared between the two parts in proportion to their lengths."""
    out = []
    for s in scenes:
        sw = s['_unit'].get('swap')
        if not isinstance(sw, dict) or not s.get('_rec') or s['type'] not in ('split', 'card') or s.get('swap'):
            out.append(s)
            continue
        at = sw.get('at')
        word, occ = (at.get('word'), int(at.get('occurrence', 1))) if isinstance(at, dict) else (at, 1)
        hits = [i for i, c in enumerate(caps) if clean(c['text']) == clean(word or '')
                and s['startMs'] + MIN_SCENE_MS <= _cut_before(caps, i) <= s['endMs'] - MIN_SCENE_MS]
        if len(hits) < occ:
            out.append(s)
            continue
        t = _cut_before(caps, hits[occ - 1])
        unit2 = {**s['_unit'], 'id': f"{s['id']}b", **{k: v for k, v in sw.items() if k in ('screenrec', 'use', 'focus_y', 'tone', 'mask')}}
        unit2.pop('swap', None)
        if not sw.get('screenrec'):
            unit2['screenrec'] = s['_unit'].get('screenrec')
        plan2 = _recording_plan(unit2, durations, plans, highlights)
        first = {**s, 'endMs': t}
        second = {**s, 'id': f"{s['id']}b", 'startMs': t, 'swap': True, '_unit': unit2, '_rec': plan2}
        second.pop('fx', None)            # one-shot motion (the check) stays with the first part
        second.pop('overlay', None)
        if sw.get('tone'):
            second['tone'] = sw['tone']
        plan1 = s['_rec']
        if not sw.get('screenrec') and not sw.get('use') and plan1.get('fit') == 'range' and plan1.get('outMs'):
            f = (t - s['startMs']) / max(1, s['endMs'] - s['startMs'])
            mid = round(plan1['inMs'] + (plan1['outMs'] - plan1['inMs']) * f)
            first['_rec'] = {**plan1, 'outMs': mid}
            second['_rec'] = {**plan2, 'inMs': mid, 'outMs': plan1['outMs'], 'fit': 'range'}
        out += [first, second]
    return out


def card_pop_time(card_ms, spans, head_ms=POP_HEAD_MS):
    """When a designed card's pop plays, or None: in the word gap pop_time() finds near the card's entrance, but never
    before the card (no sound leading the picture). A gap that ends before the cut moves the pop onto the cut frame
    when only its tail meets the next word (its first head_ms touch speech by at most POP_HEAD_OVERLAP_MS)."""
    t, in_gap = pop_time(card_ms + 60, spans)
    if not in_gap:
        return None
    if t < card_ms:
        head = sum(max(0, min(b, card_ms + head_ms) - max(a, card_ms)) for a, b in spans)
        return card_ms if head <= POP_HEAD_OVERLAP_MS else None
    return t


def _harvest_sfx(scenes, cta, spans):
    """Whooshes into graphics (softer; none on a soft content swap), a pop when a designed card lands (only in a
    word gap, never before its card), the CTA tap (under the voice it lands on, in sync with the hand) and the
    notification pop only in a word gap. Every SFX starts on a whole frame, floored."""
    keep = {i for i, s in enumerate(scenes) if not s.get('swap')}
    base = _sfx([s for i, s in enumerate(scenes) if i in keep], None, spans)
    out = [dict(x, volume=HARVEST_WHOOSH) if x['src'].endswith('whoosh.wav') else x for x in base]
    for s in scenes:
        if (s.get('card') or {}).get('kind') in ('logo', 'stars', 'kinetic'):
            t = card_pop_time(s['startMs'], spans)
            if t is not None:
                out.append({'src': 'job/sfx_pop.wav', 'atMs': t, 'volume': POP_VOLUME})
    if cta:
        timing = cta.get('timing') or cta_timing(cta.get('keyword'))
        out.append({'src': 'job/sfx_tick.wav', 'atMs': cta['atMs'] + timing['tapMs'], 'volume': CTA_TICK_VOLUME})
        t, in_gap = pop_time(cta['atMs'] + timing['notifMs'], spans)
        if in_gap:                        # on a word it was masked anyway: the slide-in reads without it
            out.append({'src': 'job/sfx_pop.wav', 'atMs': t, 'volume': CTA_NOTIF_VOLUME_ON_WORD})
    out = [dict(x, atMs=int(x['atMs']) // FRAME_MS * FRAME_MS) for x in out]
    return sorted(out, key=lambda x: x['atMs'])


def _harvest_props(spec, scenes, words, beats, word_ranges, cta, spans_ms, total, avatar, faces, music, starts, ends, cuts):
    if cta:
        # The composer opens on the close-up: when "comment" is heard just before the cut into it, it waits for the cut.
        k = next((i for i, s in enumerate(scenes) if s['startMs'] <= cta['atMs'] < s['endMs']), None)
        if k is not None and scenes[k]['type'] != 'avatar' and k + 1 < len(scenes) and scenes[k + 1]['type'] == 'avatar' \
                and scenes[k + 1]['startMs'] - cta['atMs'] <= 2 * SNAP_MS + 80:
            cta = {**cta, 'atMs': scenes[k + 1]['startMs']}
    if cta:
        cta = {**cta, 'timing': cta_timing(cta['keyword'])}
    beat_ends = []
    for k, b in enumerate(beats):
        mine = [s['endMs'] for s in scenes if s['_beat'] == b.get('name', str(k))]
        beat_ends.append(max(mine) if mine else None)
    chunks = harvest_chunks(beats, words, word_ranges, cta['atMs'] if cta else None, beat_ends=beat_ends)
    chunks = snap_chunks(hold_short_chunks(chunks), [x['startMs'] for x in scenes[1:]])
    if cta:
        chunks = [c for c in chunks if c['startMs'] < cta['atMs']]
        for c in chunks:
            c['endMs'] = min(c['endMs'], cta['atMs'])
    for s in scenes:
        rec = s.get('recording') or {}
        if rec.get('zooms'):
            rec['zooms'] = harvest_zooms(rec['zooms'])
            if not rec['zooms']:
                rec.pop('zooms')
    return {
        'theme': 'harvest',
        'avatar': {'src': avatar, **({'faceBox': faces['avatar']} if faces.get('avatar') else {})},
        'tail': None,
        'scenes': [{k: v for k, v in s.items() if not k.startswith('_')} for s in scenes],
        'captions': {'words': [{k: v for k, v in w.items() if not k.startswith('_')} for w in words]},
        'chunks': chunks,
        'headlines': [],
        # duckTo 0.08 (reel #1's level): the bed sits ~19.5 LU under the voice (0.075 left it 20.1 LU under, barely
        # audible on a phone speaker).
        'music': {'src': 'job/music.wav', 'volume': 0.12, 'duckTo': 0.08, 'holdGapMs': 500, 'fadeInMs': 40, 'fadeOutMs': 500} if music else None,
        'sfx': _harvest_sfx(scenes, cta, spans_ms),
        'cta': cta,
        'durationMs': total,
        'meta': {'job': spec.get('job'), 'theme': 'harvest',
                 'beats': [{'name': b.get('name'), 'startMs': starts[k], 'endMs': ends[k]} for k, b in enumerate(beats)],
                 'cuts': sorted(cuts or [])},
    }


# ----------------------------------------------------------------------------------------------- theme "seam"
# The news split-screen format (job 91ac50635d3d, analysis/visual.md section 2): the frame is cut at a fixed seam,
# y 560 of 1280 (43.75 %, the reference's 420 of 960). Layout A (the default) puts the recording in the top panel
# (720x560: a 1080x840 recording at exactly 2/3) and the presenter in the bottom one (720x720); layout B flips them
# for proof beats: the presenter on top in a tighter crop, the page in the bigger bottom panel (a 1080x1080
# recording). Flips are hard cuts; the seam and the caption slot never move. Captions are LED dot-matrix chunks
# (Doto 500) on the seam; the overlays (hook box + title bar, pills, count-up, marker wipes, a hand-drawn ellipse, a
# click ripple, the twist punch-in, the CTA plate) are authored per unit. seam_normalise() lists the spec fields.

SEAM_W, SEAM_H = CANVAS_W, CANVAS_H
SEAM_Y = 560
SEAM_PANEL = {'A': {'rec': (0, 0, 720, 560), 'face': (0, 560, 720, 720)},
              'B': {'rec': (0, 560, 720, 720), 'face': (0, 0, 720, 560)}}
SEAM_FACE_Y = {'A': 0.42, 'B': 0.52}   # face centre, fraction of the presenter panel's height (spec.md layout)
SEAM_SCALE = {'A': 1.0, 'B': 1.05}     # layout B is the tighter crop (1.15 cut the hair at the frame top; the
                                       # reference keeps ~90 px of shelf over the head)
SEAM_HAIR_GAP = 60                     # A: the hair top stays this far under the seam (the caption box clears the head)
SEAM_CHIN_GAP = 50                     # B: the chin stays this far above the seam
SEAM_FACE_BOX = (0.32, 0.145, 0.41, 0.33)   # hair top to chin, ear to ear, of the podcast look (job 91ac50635d3d)
# Scene changes snap onto a jump cut this close (theme "seam"; harvest keeps SNAP_MS). A cut always sits in a pause, so
# a unit start within 7 frames of it belongs on it: Whisper opens a word at the end of the one before ("Dubai. It":
# "It" 18667, its voice 18820, the cut 18800) and refine_word_starts can take a /t/ closure for the pause ("Get"
# 2611 -> 2748, voice from 2530, the cut 2480). Off the cut the reel showed the jump and the swap 4-5 frames apart.
SEAM_SNAP_MS = 280
SEAM_TWIST_PUNCH = 1.14                # overlay "punch": the twist lands on a hard push-in of the presenter panel
SEAM_ASPECT_TOL = 0.02                 # a recording off its panel's aspect by more than this is cropped (warned)
# Captions: the reference's LED chunks (~36 px at 720 w, cut every 2 words) ~30 % larger, 1-3 words cut on phrases.
SEAM_CAP_PX = 47
# Doto 500: separate round dots like a real LED sign. At 900 the dots grow until they touch and the strokes read as
# an 8-bit bitmap font (review of job 91ac50635d3d). Every Doto weight advances 0.6 em (seam_fonts.json).
SEAM_CAP_WEIGHT = 500
SEAM_CAP_FONT = f'Doto|{SEAM_CAP_WEIGHT}|normal'
SEAM_CAP_EM = 0.6                      # Doto is monospaced: every glyph advances 0.6 em (seam_fonts.json)
SEAM_CAP_PAD_X = 14
SEAM_CAP_MAX_W = SEAM_W - 2 * 24       # the caption box's outer width at most
SEAM_CHUNK_MAX_CHARS = 20
SEAM_CHUNK_MAX_WORDS = 3               # ...4 only when the chunk is at most SEAM_CHUNK_SHORT_CHARS long
SEAM_CHUNK_SHORT_CHARS = 14
SEAM_PILL_PX, SEAM_PILL_MIN_PX, SEAM_PILL_MAX_W = 30, 20, 620
SEAM_PILL_GAP = 92                     # default pill centre: this far above the seam (A) or below it (B)
SEAM_HOOK_BOX_PX, SEAM_HOOK_BOX_MAX_W = 40, 640
SEAM_HOOK_BAR_PX, SEAM_HOOK_BAR_MIN_PX, SEAM_HOOK_BAR_MAX_W = 30, 24, 680
SEAM_STRIP_PX, SEAM_STRIP_MAX_W = 28, 652
SEAM_FINE_PX, SEAM_FINE_MAX_W = 26, 660   # the CTA trust line: 19 px read at ~6 pt on a phone (review r3)
SEAM_COUNT_PX, SEAM_COUNT_MAX_W = 116, 640
SEAM_KEY_PX, SEAM_KEY_MAX_W = 44, 380
SEAM_COUNT_LAND_MS = 700               # a count-up without "land" lands this long after it starts...
SEAM_COUNT_MIN_MS = 500                # ...and never in less than this (the reference: ~0.5 s from $4,000 to $10,000)
SEAM_WIPE_MS = 350                     # marker wipe per line (the reference: ~0.4 s per line)
SEAM_DRAW_MS = 350                     # the ellipse draws on in this long
SEAM_TYPE_CHAR_MS = 80                 # the CTA keyword types a letter every 80 ms (the reference: 50-100)
SEAM_STRIP_AFTER_MS = 150              # the CTA strip lands this long after the last typed letter...
SEAM_ARROW_AFTER_MS = 250              # ...and the arrow starts drawing this long after the strip
SEAM_WORD_LEAD_MS = 300                # a word said this long before a scene's cut still counts as said in it
SEAM_TICK_VOLUME = 0.05                # typed letters and the click: ~26 dB under the voice (spec: optional, soft)
SEAM_LAND_VOLUME = 0.08                # the count-up landing
SEAM_MINT, SEAM_YELLOW, SEAM_RED, SEAM_ELLIPSE = '#A8E6D2', '#F9D700', '#C3141A', '#E0262B'
_SEAM_KINDS = ('hook', 'pill', 'count', 'marker', 'ellipse', 'ripple', 'punch', 'cta')
# Words a caption chunk never ends on (they open the phrase that follows): articles, prepositions, conjunctions,
# possessives.
_FN_WORDS = {"a", "an", "the", "to", "of", "for", "in", "on", "at", "with", "from", "by", "as", "into", "and", "or",
             "but", "so", "if", "your", "my", "our", "his", "her", "their", "its"}
_SEAM_METRICS = {}


def seam_metrics():
    """Advance widths (em per character) of the theme's faces: Doto (captions, every weight 0.6 em) and Inter 900 (everything else)."""
    if not _SEAM_METRICS:
        _SEAM_METRICS.update(json.loads(Path(__file__).with_name('seam_fonts.json').read_text())['fonts'])
    return _SEAM_METRICS


def seam_text_width(text, size, font='Inter|900|normal', spacing=0.0):
    """Estimated rendered width in px (advance widths, no kerning) plus letter spacing."""
    m = seam_metrics()[font]
    return sum(m['w'].get(c, m['avg']) for c in text) * size + spacing * max(0, len(text) - 1)


def seam_fit(text, base, max_w, font='Inter|900|normal', spacing=0.0):
    """The font size (<= base) at which text fits max_w on one line."""
    w = seam_text_width(text, base, font, spacing)
    return round(base if w <= max_w else base * max_w / w, 1)


def seam_missing_glyphs(text, font='Inter|900|normal'):
    m = seam_metrics()[font]['w']
    return sorted({c for c in text if c not in m and c not in '\n'})


def seam_layout(unit):
    """'A' (recording top / presenter bottom, the default) or 'B' (presenter top / recording bottom: a flip)."""
    v = str(unit.get('layout') or 'A').strip().lower().replace('-', '_')
    return 'B' if v in ('b', 'avatar_top', 'flip', 'recording_bottom') else 'A'


def _chunk_norm(text):
    return ' '.join(tokens(text))


def _strip_punct(text):
    return re.sub(r'[.,!?;:]+(["\')]?)$', r'\1', text)


def _chunk_fits(ws):
    chars = len(_strip_punct(' '.join(ws)))
    return chars <= SEAM_CHUNK_MAX_CHARS and (len(ws) <= SEAM_CHUNK_MAX_WORDS or (len(ws) == 4 and chars <= SEAM_CHUNK_SHORT_CHARS))


def _chunk_cost(ws, clause_len, nxt):
    """Cost of a chunk ending before word nxt (None at the clause end): breaks belong before function words, never
    after one or between a number and what it counts; orphans and 4-word chunks are avoided, fewer chunks preferred."""
    last = clean(ws[-1])
    cost = 0.4
    if nxt is not None:
        if last in _FN_WORDS:
            cost += 1.0               # "MENTORSHIP A", "A 6": the article belongs to the next chunk
        elif clean(nxt) in _FN_WORDS:
            cost -= 0.15              # a phrase starts at "and" / "with" / "for"
        if _word_value(last) is not None or re.search(r'\d', last):
            cost += 0.5               # "AND SIX | WEEKS": the number stays with its noun
    if len(ws) == 1 and clause_len > 1:
        cost += 0.6                   # an orphan word
    if len(ws) == 4:
        cost += 0.2
    return cost


def phrase_chunks(text, emphasis=()):
    """Phrase-aware caption chunks of a line (the reference's weakness was a fixed 2-word cut: "MENTORSHIP A",
    "ECONOMY THEY"): chunks never cross punctuation, hold at most SEAM_CHUNK_MAX_WORDS words (4 when they stay within
    SEAM_CHUNK_SHORT_CHARS) and SEAM_CHUNK_MAX_CHARS characters, and each clause is cut where the fewest chunks end on
    a function word ("a", "the", "and", ...) or leave a word alone (a small dynamic programme per clause). Returns
    [(text, yellow)]: yellow when it holds an emphasis phrase, a number or money."""
    words = (text or '').split()
    clauses, cur = [], []
    for w in words:
        cur.append(w)
        if ends_clause(w):
            clauses.append(cur)
            cur = []
    if cur:
        clauses.append(cur)
    chunks = []
    for cl in clauses:
        n = len(cl)
        best = [0.0] + [float('inf')] * n
        back = [0] * (n + 1)
        for j in range(1, n + 1):
            for i in range(max(0, j - 4), j):
                ws = cl[i:j]
                if not _chunk_fits(ws) and j - i > 1:
                    continue
                c = best[i] + _chunk_cost(ws, n, cl[j] if j < n else None)
                if c < best[j]:
                    best[j], back[j] = c, i
        cuts, j = [], n
        while j > 0:
            cuts.append((back[j], j))
            j = back[j]
        chunks += [cl[i:j] for i, j in reversed(cuts)]
    em = [_chunk_norm(e) for e in emphasis or [] if _chunk_norm(e)]
    out = []
    for c in chunks:
        t = _strip_punct(' '.join(c))
        if not t:
            continue
        norm = _chunk_norm(t)
        yellow = bool(re.search(r'[\d$€£]', t)) or any(e and (f' {e} ' in f' {norm} ' or f' {norm} ' in f' {e} ') for e in em)
        out.append((t, yellow))
    return out


def seam_caption_text(beat):
    """A seam beat's caption chunks as on_screen_text ("|" chunks, "{yellow}" on emphasis chunks):
    - beat["captions"]: the chunks as authored, in spoken order (e.g. ["GET PICKED", "AND YOU GET", "$10,000"]), the
      ones listed in beat["emphasis"] in yellow; an empty list shows no captions in the beat (the hook's title bar
      holds the seam slot);
    - else beat["on_screen_text"] as written ({yellow}/{white} per chunk);
    - else phrase_chunks() of the spoken line, yellow on beat["emphasis"], numbers and money."""
    caps = beat.get('captions')
    if isinstance(caps, list):
        em = {_chunk_norm(e) for e in beat.get('emphasis') or []}
        return ' | '.join(('{yellow}' if _chunk_norm(c) in em else '') + re.sub(r'[|/*]', ' ', c).strip() for c in caps if str(c).strip())
    if beat.get('on_screen_text') is not None:
        return beat['on_screen_text']
    return ' | '.join(('{yellow}' if y else '') + t for t, y in phrase_chunks(beat.get('line'), beat.get('emphasis')))


def seam_normalise(spec):
    """A copy of a theme "seam" units spec in the shape build_props reads.

    Spec (top level): "theme": "seam", "keyword" (the CTA keyword), heygen.take_A.face_box ([x, y, w, h] fractions
    of the take, hair top to chin: frames the presenter panels; default SEAM_FACE_BOX), "beats".
    Beat: "name", "line" (as spoken, aligned to captions.json), "ref_window" or "ref_window_s" ([a, b] s of the
    reference), "captions" / "emphasis" (seam_caption_text), "units".
    Unit: "id"; "t" ([a, b] s of the reference, default the beat window); "anchor" (the spoken word the unit starts
    on: a word, a phrase or {"word", "occurrence"}; give one to every unit after a beat's first); "layout": "A"
    (default) | "B" (the flip: presenter top, recording bottom); "screenrec" (shots/<id>.mp4) with "use" ("a-b s" of
    the recording to play), "key", "focus_y", "push" (a slow push-in to this scale over the scene), "zoom": true (keep
    the push-ins on the recorder's boxes; off by default: the recordings are made at the panel size);
    "plate": {"still_ms", "blur", "darken", "saturate"} (the CTA plate: one frame of our own recording, blurred,
    darkened and optionally desaturated);
    "scale" / "origin" / "fade" / "fade_color" (the panel framing: seam_panel_framing);
    "overlays": [{"kind", ...}] (see _seam_overlays). "type" defaults to "avatar + recording" ("avatar + plate" with a
    plate); a unit without a screenrec is a full-frame talking head."""
    spec = json.loads(json.dumps(spec))
    for beat in spec.get('beats') or []:
        if 'ref_window' not in beat:
            beat['ref_window'] = list(beat.get('ref_window_s') or [0.0, 1.0])
        for u in beat.get('units') or []:
            u.setdefault('t', list(beat['ref_window']))
            t = str(u.get('type') or '').lower()
            if not t.startswith('avatar'):
                u['type'] = ('avatar + plate' if u.get('plate') is not None else 'avatar + recording' if u.get('screenrec')
                             else 'avatar full-frame')
        beat['on_screen_text'] = seam_caption_text(beat)
    return spec


def seam_panel_framing(unit):
    """The recording panel's static framing of a seam unit, in Scene props: "scale" (a fixed zoom of the recording
    inside its panel, < 1 insets a page that runs to the panel edges), "origin" ([x, y] fractions of the panel the
    scale and the push grow about; default the centre), "fade" ([from, to] px of the panel from its top: a page-white
    veil fading in from `from` to solid at `to` and beyond, so half-cut lines at the seam or the panel's bottom edge
    never show; from > to fades upward instead) and "fade_color" (default white)."""
    out = {}
    if unit.get('scale') is not None and float(unit['scale']) != 1.0:
        out['recScale'] = float(unit['scale'])
    if unit.get('origin') is not None:
        ox, oy = (float(v) for v in unit['origin'])
        out['recOrigin'] = [round(min(1.0, max(0.0, ox)), 4), round(min(1.0, max(0.0, oy)), 4)]
    if unit.get('fade') is not None:
        a, b = (int(v) for v in unit['fade'])
        if a != b:
            out['fade'] = {'fromPx': a, 'toPx': b, 'color': str(unit.get('fade_color') or '#FFFFFF')}
    return out


def seam_framing(face=None, w=SEAM_W, h=SEAM_H):
    """Where the take sits in each layout: {'A'|'B': {'scale', 'x', 'y' (the take's top-left on the canvas, px),
    'cx', 'cy' (the face centre on the canvas)}}. The face centre lands at SEAM_FACE_Y of its panel, the hair top
    stays SEAM_HAIR_GAP under the seam (A), the chin SEAM_CHIN_GAP above it (B), and the take always covers its
    panel. face: [x, y, w, h] fractions of the take, hair top to chin."""
    fx, fy, fw, fh = face or SEAM_FACE_BOX
    out = {}
    for lay in ('A', 'B'):
        px, py, pw, ph = SEAM_PANEL[lay]['face']
        s = SEAM_SCALE[lay]
        cx, cy = (fx + fw / 2) * w * s, (fy + fh / 2) * h * s
        y = py + SEAM_FACE_Y[lay] * ph - cy
        if lay == 'A':
            y = max(y, py + SEAM_HAIR_GAP - fy * h * s)
        else:
            y = min(y, py + ph - SEAM_CHIN_GAP - (fy + fh) * h * s)
        y = min(py, max(py + ph - h * s, y))
        x = min(px, max(px + pw - w * s, px + pw / 2 - cx))
        out[lay] = {'scale': s, 'x': round(x, 1), 'y': round(y, 1), 'cx': round(x + cx, 1), 'cy': round(y + cy, 1)}
    return out


def seam_punches(cuts, punches, total):
    """[{'atMs', 'scale'}] (absolute ms): the presenter panel's scale from atMs on. Every jump cut steps it 1.00/1.06
    (alternating, a hard 0 ms step: never a bare jump); a twist punch ({'atMs', 'endMs', 'scale'}) holds its scale
    over [atMs, endMs)."""
    cuts = sorted(c for c in cuts or [] if 0 < c < total)

    def scale_at(t):
        hit = [p['scale'] for p in punches if p['atMs'] <= t < p['endMs']]
        return hit[-1] if hit else PUNCH[sum(1 for c in cuts if c <= t) % 2]

    pts = sorted({0, *cuts, *(p['atMs'] for p in punches), *(p['endMs'] for p in punches if p['endMs'] < total)})
    out = []
    for t in pts:
        sc = scale_at(t)
        if not out or out[-1]['scale'] != sc:
            out.append({'atMs': int(t), 'scale': sc})
    return out


def _seconds_or_ms(h, ms_keys, s_keys):
    for k in ms_keys:
        if h.get(k) is not None:
            return float(h[k])
    for k in s_keys:
        if h.get(k) is not None:
            return float(h[k]) * 1000
    return None


def seam_measured_highlights(job_dir, sizes=None, grab=_frame_rgb):
    """{recording id: [{'startMs', 'endMs', 'box'?}]} from <job>/shots/recordings.json (the highlight times measured
    on the final shots). Accepted shapes: {id: {...}}, {"recordings": [{"id", ...}]} or a list, each recording
    holding "highlight_ms" ([[on, off], ...] ms, the screen-recording pass of job 91ac50635d3d), "highlight_on_s"
    ([[on, off], ...] s, like analysis/screenrec/timing.json) or "highlights" ([on, off] s or {"start_ms"|"startMs"|
    "on_ms" | "start_s"|"on_s", "end_ms"|"endMs"|"off_ms" | "end_s"|"off_s", "box"?}).
    A box is [x, y, w, h] in fractions of the frame, or in source px when any value is over 1 (converted with the
    recording's "width"/"height" or its probed size); without one, the recorder's outline is looked up in the shot
    halfway through the highlight (yellow_box)."""
    path = Path(job_dir) / 'shots' / 'recordings.json'
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text())
    except (OSError, ValueError):
        return {}
    items = data.get('recordings', data) if isinstance(data, dict) else data
    if isinstance(items, list):
        items = {str(x.get('id')): x for x in items if isinstance(x, dict) and x.get('id')}
    out = {}
    for rid, rec in (items or {}).items():
        if not isinstance(rec, dict):
            continue
        raw, pair_ms = rec.get('highlights') or rec.get('highlight_on_s') or [], 1000.0
        if rec.get('highlight_ms') and not rec.get('highlights'):
            raw, pair_ms = rec['highlight_ms'], 1.0
        size = (rec.get('width'), rec.get('height')) if rec.get('width') and rec.get('height') else (sizes or {}).get(rid)
        video = Path(job_dir) / 'shots' / f'{rid}.mp4'
        hs = []
        for h in raw if isinstance(raw, list) else []:
            box = None
            if isinstance(h, (list, tuple)) and len(h) >= 2:
                a, b = float(h[0]) * pair_ms, float(h[1]) * pair_ms
            elif isinstance(h, dict):
                a = _seconds_or_ms(h, ('start_ms', 'startMs', 'on_ms', 'onMs'), ('start_s', 'on_s', 'start', 'on'))
                b = _seconds_or_ms(h, ('end_ms', 'endMs', 'off_ms', 'offMs'), ('end_s', 'off_s', 'end', 'off'))
                box = h.get('box')
                if a is None:
                    continue
                b = a + 1000 if b is None else b
            else:
                continue
            if isinstance(box, (list, tuple)) and len(box) == 4:
                box = [float(v) for v in box]
                if max(box) > 1.0:
                    box = [round(box[0] / size[0], 4), round(box[1] / size[1], 4), round(box[2] / size[0], 4),
                           round(box[3] / size[1], 4)] if size else None
            else:
                box = None
            if box is None and video.exists():
                rgb = grab(video, (a + b) / 2)
                box = yellow_box(rgb) if rgb else None
            hs.append({'startMs': round(a), 'endMs': round(b), **({'box': box} if box else {})})
        out[rid] = hs
    return out


def _seam_word_at(at, scene, words, lead_ms=SEAM_WORD_LEAD_MS):
    """Absolute ms where `at` is said in the scene: a word or a phrase ("six weeks", matched on normalised tokens so
    "ten" finds Whisper's "$10"), or {"word", "occurrence"} counted from the scene start. A word said up to lead_ms
    before the cut counts (it was said on the cut). None when it is not said in the scene."""
    if isinstance(at, dict):
        phrase, occ = str(at.get('word') or at.get('phrase') or ''), int(at.get('occurrence', 1))
    else:
        phrase, occ = str(at), 1
    want = tokens(phrase)
    if not want:
        return None
    pool = [w for w in words if scene['startMs'] - lead_ms <= w['startMs'] < scene['endMs']]
    flat = [(t, n, j == 0) for n, w in enumerate(pool) for j, t in enumerate(tokens(w['text']))]
    seen = 0
    for i in range(len(flat) - len(want) + 1):
        whole = i + len(want) == len(flat) or flat[i + len(want)][2]     # "$1" never matches the "one" of "100"
        if flat[i][2] and whole and [x[0] for x in flat[i:i + len(want)]] == want:
            seen += 1
            if seen == occ:
                return pool[flat[i][1]]['startMs']
    return None


def _seam_time(o, prefix, scene, words, rec):
    """(scene-relative ms or None, missing): an overlay moment from "<prefix>" (a spoken word or phrase, or a number
    of scene ms), "<prefix>_ms" (scene ms) or "<prefix>_rec_ms" (ms on the scene recording's own clock, e.g. a
    measured highlight time). missing: it was given but is not said in the scene."""
    if o.get(f'{prefix}_ms') is not None:
        return int(o[f'{prefix}_ms']), False
    if o.get(f'{prefix}_rec_ms') is not None and rec:
        return round((float(o[f'{prefix}_rec_ms']) - rec['inMs']) / rec.get('playbackRate', 1.0)), False
    v = o.get(prefix)
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return int(v), False
    if v:
        t = _seam_word_at(v, scene, words)
        return (None, True) if t is None else (max(0, t - scene['startMs']), False)
    return None, False


def _rec_size(rec, sizes):
    if rec and rec.get('size'):
        return tuple(rec['size'])
    return tuple((sizes or {}).get(Path(rec['src']).stem) or (REC_W, REC_H)) if rec else None


def _seam_box(o, scene, sizes, measured, key='box'):
    """[x, y, w, h] fractions of the scene's recording frame: o["box"] (fractions), o["box_px"] (source px), or
    o["highlight"] = n, the box of the recording's n-th highlight (measured, else found in the shot). Also returns
    that highlight's start on the recording clock (or None)."""
    rec = scene.get('recording')
    if o.get(key):
        return [float(v) for v in o[key]], None
    if o.get(f'{key}_px') and rec:
        sw, sh = _rec_size(rec, sizes)
        x, y, w, h = (float(v) for v in o[f'{key}_px'])
        return [round(x / sw, 4), round(y / sh, 4), round(w / sw, 4), round(h / sh, 4)], None
    n = o.get('highlight')
    if n and rec:
        rid = Path(rec['src']).stem
        lst = measured.get(rid) or []
        det = scene.get('_hl') or []
        h = lst[n - 1] if 0 < n <= len(lst) else (det[n - 1] if 0 < n <= len(det) else None)
        if h is None:
            return None, None
        box = h.get('box') or (det[n - 1].get('box') if 0 < n <= len(det) else None)
        return box, h.get('startMs')
    return None, None


def _seam_overlays(scene, words, keyword, sizes, measured, warn):
    """Scene-relative overlays (scene["overlays"]) and twist punches (absolute) of one unit's "overlays" list.
    Every item: "kind", "at" (a spoken word / phrase / {"word", "occurrence"}, or scene ms), or "at_ms" (scene ms),
    or "at_rec_ms" (ms on the recording's clock); "until" / "until_ms" / "until_rec_ms" the same way (default: the
    scene's end; pills: the next pill). Kinds:
    - hook: {"box": red box text, "bar": the full-width yellow title bar text} on the seam; captions wait until it ends.
    - pill: {"text", "tone": "yellow" (default) | "white", "y"?/"x"?: centre px (onto blank page space)}: blur-to-sharp scale-in; the next pill
      of the scene replaces it (value pills, name pills).
    - count: {"to", "from"?: 0, "steps"?: [...], "prefix"?: "$", "suffix"?, "land"?: word (default +700 ms, at
      least +500 ms),
      "pill"?: text under the number, "dim"?: 0.5, "blur"?: 0 (px on the recording while the number is up, so page
      text under it cannot interleave with the digits), "underline"?: true}: the recording dims, the number counts up and
      lands, and a hand-drawn yellow stroke draws on under it as it lands.
    - marker: {"box" | "box_px" | "highlight": n, "lines"?: 1, "wipe_ms"?: 350, "style"?: "fill" (mint
      highlighter) | "outline" (yellow box), "color"?}: wipes left to right on its line(s); without "at" it lands
      when the recording's n-th highlight comes up (the measured time in shots/recordings.json).
    - ellipse: {"box" | "box_px" | "highlight": n, "draw_ms"?: 350, "color"?, "fill"?: true, "power"?: 2, "tilt"?: -4}:
      a hand-drawn red ellipse draws on around the box (the date), with a mint fill behind the words; "power" 4 makes
      it a rounded loop that hugs one line of text (its ends clear the first and last glyphs), "tilt" in degrees.
    - ripple: {"point" | "point_px"}: a yellow click ripple on the recording (the recorder's own is not captured).
    - punch: {"scale"?: 1.14}: a hard push-in on the presenter panel until the next jump cut or the scene end.
    - cta: {"keyword"?: spec keyword, "strip": yellow strip text, "fine"?: fine print (" | " starts a new line),
      "fine_px"?: SEAM_FINE_PX (a warning under 22 px), "strip_at"?, "arrow_at"?,
      "char_ms"?: 80}: our comment pill (presenter disc + the keyword typed letter by letter), then the strip, the
      fine print and a hand-drawn arrow from the strip up to the pill."""
    unit, rec = scene['_unit'], scene.get('recording')
    dur = scene['endMs'] - scene['startMs']
    lay = 'B' if scene.get('flip') else 'A'
    out, punches = [], []
    for n, o in enumerate(unit.get('overlays') or []):
        if not isinstance(o, dict) or o.get('kind') not in _SEAM_KINDS:
            warn(f"{scene['id']}: overlay {n + 1} is not one of {', '.join(_SEAM_KINDS)}: {str(o)[:60]!r}")
            continue
        kind = o['kind']
        at, miss = _seam_time(o, 'at', scene, words, rec)
        if miss:
            warn(f"{scene['id']}: {kind} at {o.get('at')!r} is not said in the scene; dropped")
            continue
        until, miss_u = _seam_time(o, 'until', scene, words, rec)
        if miss_u:
            warn(f"{scene['id']}: {kind} until {o.get('until')!r} is not said in the scene; it holds to the scene end")
        x = {'kind': kind}
        if kind in ('marker', 'ellipse'):
            box, hl_at = _seam_box(o, scene, sizes, measured)
            if not box:
                warn(f"{scene['id']}: {kind} has no box (box, box_px or highlight); dropped")
                continue
            if at is None and hl_at is not None and rec:
                at = round((hl_at - rec['inMs']) / rec.get('playbackRate', 1.0))
            x['box'] = [round(v, 4) for v in box]
            if kind == 'marker':
                x.update(lines=max(1, int(o.get('lines', 1))), wipeMs=int(o.get('wipe_ms', SEAM_WIPE_MS)),
                         style=o.get('style', 'fill'), color=o.get('color') or (SEAM_MINT if o.get('style', 'fill') == 'fill' else '#FFD60A'))
            else:
                x.update(drawMs=int(o.get('draw_ms', SEAM_DRAW_MS)), color=o.get('color') or SEAM_ELLIPSE,
                         **({'fill': SEAM_MINT} if o.get('fill', True) else {}),
                         **({'power': float(o['power'])} if o.get('power') is not None else {}),
                         **({'tilt': float(o['tilt'])} if o.get('tilt') is not None else {}))
        at = 0 if at is None else at
        if at >= dur:
            warn(f"{scene['id']}: {kind} at {at} ms comes after the scene ends ({dur} ms); dropped")
            continue
        if at < 0:
            at = 0
        x['atMs'] = at
        if until is not None and until > at:
            x['untilMs'] = min(until, dur)
        if kind == 'hook':
            box_t, bar_t = str(o.get('box') or ''), str(o.get('bar') or '')
            x.update(boxText=box_t, bar=bar_t, boxSize=seam_fit(box_t.upper(), SEAM_HOOK_BOX_PX, SEAM_HOOK_BOX_MAX_W - 36))
            size = seam_fit(bar_t, SEAM_HOOK_BAR_PX, SEAM_HOOK_BAR_MAX_W)
            lines = [bar_t]
            if size < SEAM_HOOK_BAR_MIN_PX and ' ' in bar_t:
                ws = bar_t.split()
                cut = min(range(1, len(ws)), key=lambda k: abs(len(' '.join(ws[:k])) - len(' '.join(ws[k:]))))
                lines = [' '.join(ws[:cut]), ' '.join(ws[cut:])]
                size = min(seam_fit(ln, SEAM_HOOK_BAR_PX, SEAM_HOOK_BAR_MAX_W) for ln in lines)
            x.update(barLines=lines, barSize=size)
        elif kind == 'pill':
            text = str(o.get('text') or '').upper()
            size = seam_fit(text, SEAM_PILL_PX, SEAM_PILL_MAX_W - 44, spacing=0.4)
            if size < SEAM_PILL_MIN_PX:
                warn(f"{scene['id']}: pill {text!r} only fits at {size} px; shorten it")
            x.update(text=text, size=size, tone=o.get('tone', 'yellow'),
                     y=int(o.get('y') or (SEAM_Y - SEAM_PILL_GAP if lay == 'A' else SEAM_Y + SEAM_PILL_GAP)))
            if o.get('x') is not None:
                x['x'] = int(o['x'])          # centre px; default the canvas centre
        elif kind == 'count':
            to = float(o.get('to', 0))
            land, miss_l = _seam_time(o, 'land', scene, words, rec)
            if miss_l:
                warn(f"{scene['id']}: count land {o.get('land')!r} is not said in the scene; it lands {SEAM_COUNT_LAND_MS} ms in")
            land = max(land, at + SEAM_COUNT_MIN_MS) if land is not None and land > at else at + SEAM_COUNT_LAND_MS
            label = f"{o.get('prefix', '')}{to:,.0f}{o.get('suffix', '')}"
            x.update(**{'from': float(o.get('from', 0)), 'to': to, 'steps': [float(v) for v in o.get('steps') or []],
                        'prefix': o.get('prefix', ''), 'suffix': o.get('suffix', ''), 'landMs': min(land, dur),
                        'dim': float(o.get('dim', 0.5)), 'blur': float(o.get('blur', 0)),
                        'size': seam_fit(label, SEAM_COUNT_PX, SEAM_COUNT_MAX_W),
                        'underline': bool(o.get('underline', True))})
            if o.get('pill'):
                x['pill'] = str(o['pill']).upper()
                x['pillSize'] = seam_fit(x['pill'], SEAM_PILL_PX, SEAM_PILL_MAX_W - 44, spacing=0.4)
        elif kind == 'ripple':
            pt = o.get('point')
            if not pt and o.get('point_px') and rec:
                sw, sh = _rec_size(rec, sizes)
                pt = [float(o['point_px'][0]) / sw, float(o['point_px'][1]) / sh]
            if not pt:
                warn(f"{scene['id']}: ripple has no point; dropped")
                continue
            x['point'] = [round(float(v), 4) for v in pt]
        elif kind == 'punch':
            # A jump cut (or the scene's own cut) just before the word takes the punch: one hard step, never a
            # 1.06 frame followed by the punch.
            t = scene['startMs'] + at
            near = [c for c in [scene['startMs']] + scene.get('_cuts', []) if 0 <= t - c <= SNAP_MS]
            t = max(near) if near else t
            end = min([scene['endMs']] + [c for c in scene.get('_cuts', []) if c > t])
            if until is not None:
                end = min(end, scene['startMs'] + until)
            punches.append({'atMs': t, 'endMs': end, 'scale': float(o.get('scale', SEAM_TWIST_PUNCH))})
            continue
        elif kind == 'cta':
            kw = str(o.get('keyword') or keyword or 'GUIDE').upper()
            char_ms = int(o.get('char_ms', SEAM_TYPE_CHAR_MS))
            typed = at + len(kw) * char_ms
            strip_at, _ = _seam_time(o, 'strip_at', scene, words, rec)
            strip_at = typed + SEAM_STRIP_AFTER_MS if strip_at is None else strip_at
            arrow_at, _ = _seam_time(o, 'arrow_at', scene, words, rec)
            arrow_at = strip_at + SEAM_ARROW_AFTER_MS if arrow_at is None else arrow_at
            strip, fine = str(o.get('strip') or '').upper(), str(o.get('fine') or '')
            x.update(keyword=kw, charMs=char_ms, stripAtMs=strip_at, arrowAtMs=arrow_at, strip=strip, fine=fine,
                     keySize=seam_fit(kw, SEAM_KEY_PX, SEAM_KEY_MAX_W, spacing=2),
                     keyW=round(seam_text_width(kw, seam_fit(kw, SEAM_KEY_PX, SEAM_KEY_MAX_W, spacing=2), spacing=2)),
                     stripSize=seam_fit(strip, SEAM_STRIP_PX, SEAM_STRIP_MAX_W), arrow=bool(o.get('arrow', True)))
            if fine:
                lines = [ln.strip() for ln in fine.split('|') if ln.strip()]
                x['fine'] = ' '.join(lines)
                x['fineLines'] = lines
                fine_px = int(o.get('fine_px', SEAM_FINE_PX))
                x['fineSize'] = min(seam_fit(ln, fine_px, SEAM_FINE_MAX_W, font='Inter|900|normal') for ln in lines)
                if x['fineSize'] < 22:
                    warn(f"{scene['id']}: CTA fine print only fits at {x['fineSize']} px (under 22 is unreadable on a "
                         f"phone); shorten its lines")
            if arrow_at >= dur:
                warn(f"{scene['id']}: the CTA arrow starts after the scene ends; it never draws")
        for t in [v for k, v in x.items() if k in ('text', 'boxText', 'bar', 'pill', 'strip', 'fine', 'keyword') and isinstance(v, str)]:
            miss_g = seam_missing_glyphs(t)
            if miss_g:
                warn(f"{scene['id']}: {kind} text {t!r} has characters Inter 900 does not draw: {''.join(miss_g)}")
        out.append(x)
    pills = sorted((x for x in out if x['kind'] == 'pill'), key=lambda x: x['atMs'])
    for a, b in zip(pills, pills[1:]):
        a['untilMs'] = min(a.get('untilMs', b['atMs']), b['atMs'])
    return out, punches


def _seam_sfx(scenes):
    """Soft ticks only (the reference cuts hard, no whooshes): the count-up landing, each typed keyword letter and the
    click ripple, on whole frames, floored."""
    out = []
    for s in scenes:
        for o in s.get('overlays') or []:
            t0 = s['startMs']
            if o['kind'] == 'count':
                out.append({'src': 'job/sfx_tick.wav', 'atMs': t0 + o['landMs'], 'volume': SEAM_LAND_VOLUME})
            elif o['kind'] == 'cta':
                out += [{'src': 'job/sfx_tick.wav', 'atMs': t0 + o['atMs'] + i * o['charMs'], 'volume': SEAM_TICK_VOLUME}
                        for i in range(len(o['keyword'])) if o['atMs'] + i * o['charMs'] < s['endMs'] - t0]
            elif o['kind'] == 'ripple':
                out.append({'src': 'job/sfx_tick.wav', 'atMs': t0 + o['atMs'], 'volume': SEAM_LAND_VOLUME})
    out = [dict(x, atMs=int(x['atMs']) // FRAME_MS * FRAME_MS) for x in out]
    return sorted(out, key=lambda x: x['atMs'])


def _seam_props(job_dir, spec, scenes, words, beats, word_ranges, spans_ms, total, avatar, faces, music, starts, ends,
                cuts, sizes, measured):
    warnings = []
    warn = warnings.append
    if measured is None:
        measured = seam_measured_highlights(job_dir, sizes)
    cuts = sorted(c for c in cuts or [] if 0 < c < total)
    punches = []
    for s in scenes:
        lay = 'B' if s.get('flip') else 'A'
        rec = s.get('recording')
        unit = s['_unit']
        if s['type'] == 'split' and rec:
            if unit.get('plate') is not None:
                plate = unit.get('plate') if isinstance(unit.get('plate'), dict) else {}
                s['plate'] = {'blur': float(plate.get('blur', 14)), 'darken': float(plate.get('darken', 0.25))}
                if plate.get('saturate') is not None:
                    s['plate']['saturate'] = float(plate['saturate'])
                rec['inMs'] = int(plate.get('still_ms', rec['inMs']))
                rec.pop('playbackRate', None)
                rec.pop('zooms', None)
            elif rec.get('zooms') and unit.get('zoom'):
                rec['zooms'] = harvest_zooms(rec['zooms'])
                if not rec['zooms']:
                    rec.pop('zooms')
            else:
                rec.pop('zooms', None)
            sw, sh = _rec_size(rec, sizes)
            _, _, pw, ph = SEAM_PANEL[lay]['rec']
            if abs((sw / sh) / (pw / ph) - 1) > SEAM_ASPECT_TOL:
                warn(f"{s['id']}: {Path(rec['src']).name} is {sw}x{sh}, layout {lay} shows {pw}x{ph}: record it at "
                     f"{round(pw * 1.5)}x{round(ph * 1.5)} or it is cropped")
        s['_cuts'] = cuts
        ovs, ps = _seam_overlays(s, words, spec.get('keyword') or '', sizes, measured, warn)
        if ovs:
            s['overlays'] = ovs
        punches += ps
    beat_ends = []
    for k, b in enumerate(beats):
        mine = [s['endMs'] for s in scenes if s['_beat'] == b.get('name', str(k))]
        beat_ends.append(max(mine) if mine else None)
    chunks = harvest_chunks(beats, words, word_ranges, None, beat_ends=beat_ends)
    chunks = snap_chunks(seam_hold_short_chunks(chunks), [x['startMs'] for x in scenes[1:]])
    hooks = [(s['startMs'] + o['atMs'], s['startMs'] + o.get('untilMs', s['endMs'] - s['startMs']))
             for s in scenes for o in s.get('overlays') or [] if o['kind'] == 'hook']
    kept = []
    for c in chunks:                  # the hook's title bar holds the seam slot: no caption under it
        for a, b in hooks:
            if c['startMs'] < b and c['endMs'] > a:
                if c['startMs'] >= a:
                    c['startMs'] = b
                    for ln in c['lines']:
                        ln['startMs'] = max(ln['startMs'], b)
                else:
                    c['endMs'] = a
        if c['endMs'] - c['startMs'] >= 80:
            kept.append(c)
    for c in kept:
        for ln in c['lines']:
            text = ln['text']
            if len(text) > SEAM_CHUNK_MAX_CHARS:
                warn(f"caption {text!r} is {len(text)} characters (max {SEAM_CHUNK_MAX_CHARS}): split it")
            miss_g = seam_missing_glyphs(text.upper(), SEAM_CAP_FONT)
            if miss_g:
                warn(f"caption {text!r} has characters Doto does not draw: {''.join(miss_g)}")
    framing = seam_framing(faces.get('avatar'))
    return {
        'theme': 'seam',
        'avatar': {'src': avatar, **({'faceBox': faces['avatar']} if faces.get('avatar') else {})},
        'tail': None,
        'scenes': [{k: v for k, v in s.items() if not k.startswith('_')} for s in scenes],
        'captions': {'words': [{k: v for k, v in w.items() if not k.startswith('_')} for w in words]},
        'chunks': kept,
        'headlines': [],
        'seam': {'y': SEAM_Y, 'frames': framing, 'punches': seam_punches(cuts, punches, total), 'captionPx': SEAM_CAP_PX,
                 'captionWeight': SEAM_CAP_WEIGHT},
        'music': {'src': 'job/music.wav', 'volume': 0.12, 'duckTo': 0.08, 'holdGapMs': 500, 'fadeInMs': 40, 'fadeOutMs': 500} if music else None,
        'sfx': _seam_sfx(scenes),
        'cta': None,
        'durationMs': total,
        'meta': {'job': spec.get('job'), 'theme': 'seam',
                 'beats': [{'name': b.get('name'), 'startMs': starts[k], 'endMs': ends[k]} for k, b in enumerate(beats)],
                 'cuts': cuts, 'warnings': warnings, 'subtitles': seam_subtitles(beats, words, word_ranges)},
    }


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


CHIP_AT_MS = 450            # Overlays.tsx DEFAULT_AT.chip


def _carry_overlays(scenes, tail_ms=None):
    """A chip whose unit sets overlay_hold_ms stays up that long after it pops (fine print that has to be read: 49
    characters in 1 s is not readable, ~17 chars/s is), even past its own scene: it runs on over the next contiguous
    scenes that carry no overlay of their own (never onto the end card, the hook or the second look), on each
    scene's chip line (above the talk captions on a talking head, on the card's bottom edge on a card). Sets the
    overlay's untilMs and moves ([{atMs, y}], scene-relative); fadeOutMs when it ends inside a scene."""
    for i, s in enumerate(scenes):
        ov = s.get('overlay')
        hold = ov.pop('_holdMs', None) if ov else None
        if not hold or ov['kind'] != 'chip':
            continue
        want = s['startMs'] + ov.get('atMs', CHIP_AT_MS) + hold
        end, moves, y = s['endMs'], [], ov.get('y', CHIP_Y)
        for n in scenes[i + 1:]:
            if end >= want or abs(n['startMs'] - end) >= 40 or n['type'] == 'endcard' or n.get('overlay') or n.get('flipIn') \
                    or (tail_ms is not None and s['startMs'] < tail_ms <= n['startMs']):
                break
            ny = CHIP_Y_TALK if n['type'] == 'avatar' else CHIP_Y
            if ny != y:
                moves.append({'atMs': n['startMs'] - s['startMs'], 'y': ny})
                y = ny
            end = n['endMs']
        until = min(want, end)
        if until <= s['endMs']:
            continue
        ov['untilMs'] = until - s['startMs']
        if moves:
            ov['moves'] = [m for m in moves if m['atMs'] < ov['untilMs']]
        if until < end:
            ov['fadeOutMs'] = 200


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
        if k is None or scenes[k]['type'] not in ('avatar', 'split') or scenes[k]['startMs'] == c:
            continue                 # a cut on a scene change is already hidden (never a zero-length scene)
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
        z = {'atMs': round(max(0, a)), 'endMs': round(end), 'scale': push_scale(h['box']), 'box': h['box']}
        if h.get('content'):
            z['content'] = h['content']
        out.append(z)
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
            if rate > RATE_MAX and not cont:
                # Too much range for the scene: keep its end (the proof the range was chosen for), lose the head.
                in_ms, rate = round(plan['outMs'] - dur * RATE_MAX), RATE_MAX
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
        rate = min(RATE_MAX, max(0.6, rate))
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
        for k in ('focusY', 'cropTop', 'masks'):
            if plan.get(k) is not None:
                rec[k] = plan[k]
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
    """npx remotion render Explainer with the job's props, then the loudness master. Returns the master stats.
    Rendered straight to final.mp4 (--out <job>/final.mp4), it also writes final_ig.mp4 and final_social.mp4
    (app.exports); for any other name run `python -m app.exports <job>/final.mp4` once final.mp4 is chosen."""
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
    if out.name == 'final.mp4':
        from . import exports
        stats = {**stats, 'exports': exports.platform_exports(out)}
    return stats


def seam_subtitles(beats, words, word_ranges):
    """Subtitle items [{'text', 'startMs', 'endMs'}] for captions.srt: each beat's scripted line (the spelling the
    burned-in captions use: "licence", "$10,000", "PITCH"; Whisper writes "license" and "$10 ,000,") cut into clauses
    at its punctuation, each timed from the first to the last of OUR spoken words it matches (difflib on tokens).
    A clause with no matched word is skipped."""
    out = []
    for k, beat in enumerate(beats):
        line = (beat.get('line') or '').strip()
        lo, hi = word_ranges[k]
        bw = [w for w in words if lo <= w['_i'] <= hi]
        if not line or not bw:
            continue
        clauses, cur = [], []
        for w in line.split():
            cur.append(w)
            if re.search(r'[.,!?;:]["\')]?$', w):
                clauses.append(cur)
                cur = []
        if cur:
            clauses.append(cur)
        disp, owner = [], []
        for c, cl in enumerate(clauses):
            for w in cl:
                for t in tokens(w):
                    disp.append(t)
                    owner.append(c)
        cap, cap_owner = [], []
        for n, w in enumerate(bw):
            for t in tokens(w['text']):
                cap.append(t)
                cap_owner.append(n)
        hit = {}
        for a, b, size in difflib.SequenceMatcher(None, disp, cap, autojunk=False).get_matching_blocks():
            for q in range(size):
                hit.setdefault(owner[a + q], []).append(cap_owner[b + q])
        spans = [(c, min(hit[c]), max(hit[c])) for c in range(len(clauses)) if hit.get(c)]
        for q, (c, a, b) in enumerate(spans):   # a clause runs on to the word before the next one (a number Whisper
            b = max(b, spans[q + 1][1] - 1 if q + 1 < len(spans) else len(bw) - 1)   # split, "$10 ,000,", stays in it)
            out.append({'text': ' '.join(clauses[c]), 'startMs': bw[a]['startMs'], 'endMs': bw[b]['endMs']})
    return out


def write_srt(job_dir, props, name='captions.srt'):
    """<job>/captions.srt for the platforms that take one (YouTube, LinkedIn, TikTok, Facebook): the props' spoken
    words on the final timeline, in app.edit_plan's readable cues (sentence breaks, two lines of at most 42
    characters); theme "seam" props carry meta.subtitles (seam_subtitles: the scripted spelling). Returns the path,
    or None when the props carry no words."""
    from .edit_plan import to_srt
    words = (props.get('meta') or {}).get('subtitles') or \
        [w for w in (props.get('captions') or {}).get('words') or [] if str(w.get('text', '')).strip()]
    if not words:
        return None
    path = Path(job_dir) / name
    path.write_text(to_srt(words, duration_ms=props.get('durationMs')))
    return path


def load_cuts(path):
    """Jump-cut times (ms) from a cuts file: a plain list, app.tighten's cuts.json ({'cuts': [{'at_ms'}, ...]}) or
    cuts_final.json ({'cuts_ms': [...]}: the cuts moved onto the final timeline after a synced speed-up)."""
    data = json.loads(Path(path).read_text())
    if isinstance(data, dict):
        data = data.get('cuts_ms') or data.get('cuts') or []
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
    r.add_argument('--out', help='default <job>/final_explainer.mp4; <job>/final.mp4 also writes final_ig.mp4 and '
                                 'final_social.mp4 (app.exports)')
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
    elif (job / 'cuts_final.json').exists():   # after a synced speed-up the cuts live on the final timeline
        cuts = load_cuts(job / 'cuts_final.json')
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
    if not args.out:                  # the platform subtitle file (AGENTS.md Accessibility), on the render's timeline
        srt = write_srt(job, props)
        if srt:
            summary['srt'] = str(srt)
    if props.get('theme') == 'seam':
        summary['layouts'] = ''.join('B' if x.get('flip') else 'A' for x in props['scenes'])
        summary['warnings'] = props['meta'].get('warnings') or []
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
