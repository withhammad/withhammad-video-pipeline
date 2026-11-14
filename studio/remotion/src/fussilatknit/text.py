"""Exact on-screen text for the private knitted Fussilat 41:30 reel (FUSSILAT-KNIT), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/fussilatknit/text.py <job dir> [--write]     (needs fontTools)

Sources, downloaded once into <job>/knit/src (kept out of git):
  tz_41_30.json   api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, ur.jalandhry, en.sahih, ...
  qc_41_30.json   api.quran.com v4 verses/by_key/41:30: text_uthmani, text_imlaei, translations 20 (Sahih International)
                  and 234 (Fateh Muhammad Jalandhari)
  whisper_ur_medium*.json   faster-whisper medium (ur) read-backs of the reference's 44.1 kHz audio, with and without
                  Jalandhari's wording as the prompt

Arabic: Quran 41:30 in Uthmani Hafs, exactly the Tanzil quran-uthmani text (BOM stripped). It must equal quran.com
text_uthmani once quran.com's tatweel (U+0640, a drawing stretch before the two superscript alefs) is removed, and the
Tanzil quran-simple text must equal quran.com text_imlaei. The 19 words are grouped into the five meaning phrases the
reference narrates and into three display lines; joined back they must give the source string code point for code point.
English: Sahih International (quran.com translation 20), sliced at the same phrase boundaries; joined back = the source.
Urdu: the reference voice reads Fateh Muhammad Jalandhari's Urdu (quran.com 234 = Tanzil ur.jalandhry) aloud, without the
two pairs of brackets, saying «اللہ» where Jalandhari prints «خدا» and «جاتا ہے» where he prints «جاتا تھا». The caption text
is built from Jalandhari with exactly those two words changed, and must equal the Whisper read-back word for word (the
prompted pass exactly; the unprompted pass up to the listed Whisper spellings). Exit code 1 on any mismatch.
"""
import json
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
BOM, TATWEEL = chr(0xFEFF), chr(0x0640)


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / 'tz_41_30.json').read_text())['data']}
qv = json.loads((src / 'qc_41_30.json').read_text())['verse']
qtr = {t['resource_id']: t['text'] for t in qv['translations']}
assert qv['verse_key'] == '41:30'

# --- Arabic: Quran 41:30 ------------------------------------------------------------------------------------------------
uth = tz['quran-uthmani']
assert uth == qv['text_uthmani'].replace(TATWEEL, ''), 'Tanzil quran-uthmani != quran.com text_uthmani (tatweel removed)'
assert tz['quran-simple'] == qv['text_imlaei'].replace('كُنتُمْ', 'كُنْتُمْ') or tz['quran-simple'] == qv['text_imlaei'], 'imla\'i texts differ'
W = uth.split(' ')
assert len(W) == 19, len(W)
PHRASES = [(0, 5), (5, 7), (7, 10), (10, 12), (12, 14), (14, 19)]   # A1 | A2 | A3 | A4a | A4b | A5 (word index ranges)
LINES = [(0, 7), (7, 14), (14, 19)]
assert ' '.join(' '.join(W[a:b]) for a, b in PHRASES) == uth and ' '.join(' '.join(W[a:b]) for a, b in LINES) == uth

# --- English: Sahih International (quran.com 20) --------------------------------------------------------------------------
en = qtr[20]
CUTS = ['Indeed, those who have said, "Our Lord is Allāh"', 'and then remained on a right course -',
        'the angels will descend upon them, [saying],', '"Do not fear and do not grieve',
        'but receive good tidings of Paradise, which you were promised.']
EN = []
rest = en
for c in CUTS:
    assert rest.startswith(c), (rest[:60], c)
    EN.append(rest[:len(c)]); rest = rest[len(c):].lstrip(' ')
assert rest == '' and ' '.join(EN) == en

# --- Urdu: Jalandhari as narrated ---------------------------------------------------------------------------------------
jal = qtr[234]
assert jal == tz['ur.jalandhry'], 'quran.com 234 != Tanzil ur.jalandhry'
spoken = jal.replace('(', '').replace(')', '')
assert spoken.count(' خدا ') == 1 and spoken.count(' جاتا تھا ') == 1
spoken = spoken.replace(' خدا ', ' اللہ ').replace(' جاتا تھا ', ' جاتا ہے ')
UW = spoken.split(' ')
UR_PAGES = [[(0, 9)], [(9, 15)], [(15, 20)], [(20, 27), (27, 31)], [(31, 42), (42, 44)]]   # caption pages, lines (word ranges)
assert [w for p in UR_PAGES for a, b in p for w in UW[a:b]] == UW, 'pages do not cover the narration'
UR = [[' '.join(UW[a:b]) for a, b in p] for p in UR_PAGES]

SOURCES = {
    'arWords': W, 'arPhrases': [list(p) for p in PHRASES], 'arLines': [list(x) for x in LINES], 'ayah': uth,
    'en': EN, 'urWords': UW, 'urPages': [[list(x) for x in p] for p in UR_PAGES], 'ur': UR,
}

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(SOURCES, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
bad = 0
for k, want in SOURCES.items():
    same = used.get(k) == want
    bad += not same
    print(f'{k:10} {"MATCH" if same else "DIFF "}')
print('ayah       ', uth)
print('            ' + cps(uth))
print('vs quran.com text_uthmani: identical after removing', qv['text_uthmani'].count(TATWEEL), 'tatweel(s) U+0640 (quran.com draws a stretch under the dagger alef)')
for line in EN: print('en         ', line)

# the Urdu against the two Whisper read-backs
HEARD_AS = {'پربردگار': 'پروردگار', 'نا': 'نہ', 'گمناک': 'غمناک', 'وحشت': 'بہشت', 'بادہ': 'وعدہ', 'مناو': 'مناؤ'}
for name, fix in (('whisper_ur_medium_jalandhari_prompt', {}), ('whisper_ur_medium', HEARD_AS)):
    heard = [fix.get(w[2], w[2]) for w in json.loads((src / f'{name}.json').read_text())['words']]
    same = heard == UW
    bad += not same
    print(f'urdu vs {name}: {"MATCH" if same else "DIFF"}' + (f' (Whisper spellings accepted: {", ".join(f"{a}->{b}" for a, b in fix.items())})' if fix else ''))
    if not same:
        for n, (a, b) in enumerate(zip(UW, heard)):
            if a != b: print(f'   word {n}: caption {a} vs heard {b}')
print('urdu vs Jalandhari: brackets dropped, خدا -> اللہ, تھا -> ہے (both heard in the audio, also with Jalandhari as the prompt)')
for p in UR: print('ur         ', ' / '.join(p))

# every code point must be in the fonts that draw it
amiri = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
miss = sorted({c for c in uth + '۝٣٠' if c != ' ' and ord(c) not in amiri})
bad += bool(miss)
print('Amiri Quran covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
for s in UW:
    assert all(unicodedata.name(c).startswith('ARABIC') for c in s), s
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
