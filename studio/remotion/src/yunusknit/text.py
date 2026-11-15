"""Exact on-screen text and the clock for the private knitted Yunus reel (YUNUS-KNIT), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/yunusknit/text.py <job dir> [--write]     (needs fontTools)

Sources, downloaded once into <job>/knit/src (kept out of git):
  qc_37_139..146.json, qc_21_87.json   api.quran.com v4 verses/by_key: text_uthmani, text_imlaei, translation 20 (Sahih International)
  tanzil_uthmani_marks.txt             tanzil.net/pub/download, Uthmani, with pause marks, sajdah and rub el hizb signs, superscript
                                       alef and tatweel (txt-2: sura|aya|text)
  tz_37_*.json, tz_21_87.json          api.alquran.cloud (quran-uthmani, quran-simple, en.sahih), a second Tanzil-derived copy
  whisper_ar_large_v3.json             faster-whisper large-v3, unprompted, the whole track: identifies what is recited
  whisper_clips.json                   large-v3 per recited phrase (cut at the reciter's pauses), prompted: the word clock

Arabic: as-Saffat 37:139-146 in Uthmani Hafs. quran.com text_uthmani must equal the tanzil.net Uthmani line code point for code
point (it does, tatweel included). The alquran.cloud copy adds Tanzil's optional sequential-tanween hints (U+06ED / U+06E2 after a
tanween, 4 marks in 142, 145, 146) and drops the tatweel of 145: those differences are printed, and the plain tanzil.net text is
the one used (the hints draw extra small meems in Amiri Quran). Each verse is split on spaces; joined back = the source string.
English: Sahih International (quran.com translation 20) with the footnote markers removed; it must equal alquran.cloud en.sahih
up to the footnote markers. The recited ayat are checked against the unprompted Whisper read-back (letters only, no harakat).
Also: 21:87 (the dua of Yunus, for the caption only; never on screen as if recited).
The word clock: Whisper clip times, first words of each phrase moved to the onset on the 300-3500 Hz voice-band envelope.
Writes texts.json (with --write) and <job>/knit/blender/timing.json; exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
BOM = chr(0xFEFF)
AYAT = list(range(139, 147))
bad = 0


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


TZ = {}
for line in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines():
    p = line.split('|')
    if len(p) == 3:
        TZ[(int(p[0]), int(p[1]))] = p[2].lstrip(BOM)


def qc(s, a):
    return json.loads((src / f'qc_{s}_{a}.json').read_text())['verse']


def alq(s, a):
    return {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_{s}_{a}.json').read_text())['data']}


def strip_fn(s):
    return re.sub(r'<sup[^>]*>.*?</sup>', '', s).strip()


AR, EN, WORDS = {}, {}, {}
for s, a in [(37, k) for k in AYAT] + [(21, 87)]:
    q = qc(s, a)
    assert q['verse_key'] == f'{s}:{a}'
    t = TZ[(s, a)]
    same = q['text_uthmani'] == t
    bad += not same
    alt = alq(s, a)
    diffs = []
    i = j = 0
    A, B = t, alt['quran-uthmani']
    import difflib
    for op, a0, a1, b0, b1 in difflib.SequenceMatcher(a=A, b=B, autojunk=False).get_opcodes():
        if op != 'equal':
            diffs.append(f'{op} tanzil.net[{cps(A[a0:a1])}] alquran.cloud[{cps(B[b0:b1])}]')
    ok_alt = all(re.fullmatch(r'(insert|delete|replace) tanzil\.net\[(U\+0640)?\] alquran\.cloud\[(U\+06ED|U\+06E2)?\]', d) for d in diffs)
    bad += not ok_alt
    en = strip_fn(q['translations'][0]['text'])
    en_alt = strip_fn(alt['en.sahih'])
    plain = lambda x: ''.join(c for c in unicodedata.normalize('NFKD', re.sub(r' \[i\.e\., [^\]]*\]', '', x)) if not unicodedata.combining(c))
    en_ok = en == en_alt or plain(en) == plain(en_alt)
    print(f'{s}:{a:<4} quran.com text_uthmani == tanzil.net: {"YES" if same else "NO"} | alquran.cloud differs only by '
          f'sequential-tanween hints / tatweel: {"YES" if ok_alt else "NO"} ({len(diffs)} diff(s))')
    for d in diffs:
        print('          ', d)
    print('          en (quran.com 20):', en, '| = alquran.cloud en.sahih:', 'YES' if en == en_alt else
          ('YES up to the macron in Allāh / quran.com\'s [i.e., ...] gloss' if en_ok else 'NO: ' + en_alt))
    bad += not en_ok
    AR[f'{s}:{a}'] = t
    EN[f'{s}:{a}'] = en
    if s == 37:
        WORDS[a] = t.split(' ')
        assert ' '.join(WORDS[a]) == t

# --- what the reciter says: the unprompted read-back of the whole track, letters only -------------------------------------
LET = re.compile(r'[ء-ي]')
HAMZA = str.maketrans({'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي'})


def skel(s):
    s = ''.join(c for c in unicodedata.normalize('NFC', s) if not unicodedata.combining(c) and c not in 'ـ۞ۥۦ')
    return ''.join(LET.findall(s.translate(HAMZA)))


heard = json.loads((src / 'whisper_ar_large_v3.json').read_text())['words']
heard = [w for w in heard if w[0] < 56.3]                       # the last 0.7 s is fade-out ("subscribe" hallucination)
want = [skel(w) for a in AYAT for w in qc(37, a)['text_imlaei'].split(' ')]
got = [skel(w[2]) for w in heard]
print('recited (unprompted large-v3):', ' '.join(w[2] for w in heard))
WH_SPELL = {'منين': 'مليم', 'لنبث': 'للبث'}                      # the two Whisper mishearings (ل/ن) on the read-back
got_fixed = [skel(WH_SPELL.get(w[2], w[2])) for w in heard]
same = got_fixed == want
bad += not same
print('read-back = 37:139-146 word for word:', 'MATCH' if same else 'DIFF', f'(Whisper spellings accepted: {WH_SPELL})')
if not same:
    for n, (a_, b_) in enumerate(zip(want, got_fixed)):
        if a_ != b_:
            print('   word', n, 'quran', a_, 'heard', b_)

# --- the word clock -------------------------------------------------------------------------------------------------------
clips = json.loads((src / 'whisper_clips.json').read_text())
ONSET = {139: 5.80, 140: 11.05, 141: 17.92, 142: 22.70, 143: 27.66, 145: 40.48, 146: 49.22}   # voice-band onsets
END = {139: 10.50, 140: 17.06, 141: 22.22, 142: 27.03, 144: 39.45, 145: 47.66, 146: 56.40}     # where the voice band falls away
BOUNDARY = {(141, 1): 18.88}                             # the f of «فَكَانَ» (voice-band dip 18.90-18.98)
cw = {k: v['words'] for k, v in clips.items()}
seq = cw['139'] + cw['140'] + cw['141'] + cw['142'] + cw['143-144'] + cw['145'] + cw['146']
CLOCK = {}
n = 0
for a in AYAT:
    ws = WORDS[a]
    real = [w for w in ws if w != '۞']
    ts = []
    for w in real:
        ts.append([seq[n][0], seq[n][1]])
        n += 1
    if a in ONSET:
        ts[0][0] = ONSET[a]
    if a in END:
        ts[-1][1] = END[a]
    for (aa, kk), tb in BOUNDARY.items():                # word edges read off the voice-band envelope where Whisper drifts
        if aa == a:
            ts[kk - 1][1] = tb
    for k in range(1, len(ts)):
        ts[k][0] = ts[k - 1][1]
    full, k = [], 0
    for w in ws:
        if w == '۞':
            full.append(None)
        else:
            full.append([round(ts[k][0], 3), round(ts[k][1], 3)])
            k += 1
    for i, v in enumerate(full):                         # the rub el hizb sign fills with the word after it
        if v is None:
            full[i] = full[i + 1]
    CLOCK[a] = full
assert n == len(seq), (n, len(seq))

# two display lines per ayah (word counts); joined back they must give the verse
SPLIT = {139: 2, 140: 3, 141: 2, 142: 2, 143: 3, 144: 3, 145: 3, 146: 3}
LINES = {}
for a in AYAT:
    ws = WORDS[a]
    LINES[a] = [[0, SPLIT[a]], [SPLIT[a], len(ws)]]
    assert ' '.join(' '.join(ws[x:y]) for x, y in LINES[a]) == AR[f'37:{a}']
SOURCES = {'ayat': AYAT, 'lines': {str(a): LINES[a] for a in AYAT}, 'ar': {str(a): AR[f'37:{a}'] for a in AYAT}, 'words': {str(a): WORDS[a] for a in AYAT},
           'en': {str(a): EN[f'37:{a}'] for a in AYAT}, 'clock': {str(a): CLOCK[a] for a in AYAT},
           'dua_21_87': AR['21:87'], 'dua_21_87_en': EN['21:87']}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(SOURCES, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for k, v in SOURCES.items():
    ok = used.get(k) == v
    bad += not ok
    print(f'texts.json {k:12} {"MATCH" if ok else "DIFF"}')
for a in AYAT:
    print(f'37:{a}', AR[f'37:{a}'], '|', ' '.join(f'{w}[{c[0]:.2f}-{c[1]:.2f}]' for w, c in zip(WORDS[a], CLOCK[a])))
    print('       ', cps(AR[f'37:{a}']))

# every code point must be in the font that draws it, and the font must be the plain build (no colour layers)
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf'))
cmap = font.getBestCmap()
digits = '٠١٢٣٤٥٦٧٨٩۝'
miss = sorted({c for a in AYAT for c in AR[f'37:{a}'] + digits if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
print('Amiri Quran covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
colour = [t for t in ('COLR', 'CPAL') if t in font]
bad += bool(colour)
print('Amiri Quran colour tables:', 'none (plain build)' if not colour else colour)

# --- the shot clock for Blender and Remotion -------------------------------------------------------------------------------
FPS, NF = 30, 1712                                      # 57.067 s: the reference audio decodes to 57.045 s
cuts = {'OPEN': 0.0, 'A139': 5.733, 'A140': 10.80, 'A141a': 17.067, 'A141b': 18.867, 'A142': 22.533, 'A143': 27.333,
        'A144a': 32.40, 'A144b': 35.00, 'A144c': 37.20, 'A145': 40.433, 'A146': 48.467}
for k, v in cuts.items():
    assert abs(v * FPS - round(v * FPS)) < 0.02, (k, v)
c = CLOCK
events = {'call': 0.40, 'splash': 3.80, 'voice': 5.80, 'swallow': c[142][1][0], 'blame': c[142][3][0],
          'tasbih': c[143][4][0], 'mouth_dark': 32.10, 'belly': 32.40, 'sea': 35.00, 'night': 37.20,
          'part': c[145][0][0], 'shore': c[145][2][0], 'ill': c[145][4][0], 'end145': END[145],
          'grow': c[146][0][0], 'over': c[146][1][0], 'tree': c[146][2][0], 'min': c[146][3][0], 'gourd': c[146][4][0],
          'end146': END[146]}
timing = {'fps': FPS, 'frames': NF, 'cuts': cuts, 'events': events}
bl = job / 'knit' / 'blender'
bl.mkdir(parents=True, exist_ok=True)
(bl / 'timing.json').write_text(json.dumps(timing, indent=1))
print('timing.json', json.dumps(events))
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
