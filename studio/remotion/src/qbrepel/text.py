"""Exact on-screen text for the private Quran Beat "Repel evil with good" reel (QB-REPEL), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/qbrepel/text.py <job dir> [--write]     (needs fontTools)

The reference (DfjoL3UIbxN, @hajja.eftikar) captions its reel «ولا تستوي الحسنة ولا السيئة ادفع باللتي هي أحسن»: no
harakat, no ayah number, and «باللتي» misspelled (the Quran has «بِٱلَّتِى», one lam). Nothing is taken from that caption.
Its audio is identified from the recitation itself (faster-whisper large-v3 read-backs, below): Fussilat 41:34-35 (Hafs),
in one continuous take, the reciter saying «فَإِذَا ٱلَّذِى بَيْنَكَ وَبَيْنَهُۥ عَدَٰوَةٌ» twice (a pause, then again, joined to
«كَأَنَّهُۥ وَلِىٌّ حَمِيمٌ»); 41:35 once. Nothing is cut: the repeat stays in, as recorded.

Sources, downloaded once into <job>/qb/src (kept out of git):
  tz_41_<n>.json  api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, en.sahih
  qc_41_<n>.json  api.quran.com v4 verses/by_key/41:<n>: text_uthmani, text_imlaei, translation 20 (Sahih International)
  whisper_large_{prompted,noprompt}.json  faster-whisper large-v3 (ar) read-backs of the whole reference audio, word level
  whisper_large_phrases.json  large-v3 read-backs of six windows cut at the reciter's pauses (they hear the repeat)

Arabic on screen: quran.com text_uthmani, verbatim, code point for code point, split into the reciter's phrases at word
boundaries (the phrases joined with single spaces give the ayah back exactly). Checked against Tanzil quran-uthmani: the
letters and harakat are identical; Tanzil appends a small low meem (U+06ED / U+06E2) to the tanweens followed by idgham or
ikhfa (عَدَٰوَةٌۭ, حَمِيمٌۭ, عَظِيمٍۢ), which Amiri Quran draws as a visible mark the Madinah mushaf does not print there, so the
quran.com text is the one shown.
English: Sahih International (Tanzil en.sahih), split at the same phrase boundaries; the parts joined with single spaces
give the translation back exactly. quran.com translation 20 is the same text with footnote markers and one extra comma in
41:34 ("and thereupon, the one whom").
Exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'qb' / 'src'
here = Path(__file__).resolve().parent
BOM, TATWEEL = chr(0xFEFF), chr(0x0640)
MEEMS = {chr(0x06ED), chr(0x06E2)}
IND = '٠١٢٣٤٥٦٧٨٩'


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


def load(n):
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_41_{n}.json').read_text())['data']}
    qv = json.loads((src / f'qc_41_{n}.json').read_text())['verse']
    assert qv['verse_key'] == f'41:{n}'
    return tz, qv


# the reciter's phrases: (ayah, first word, end word) on the quran.com word list (the waqf sign ۚ is its own word there),
# and the Sahih International text for each phrase, cut at the matching place
PHRASES = [
    ('A', 34, 0, 6, 'And not equal are the good deed and the bad.'),
    ('B', 34, 6, 10, 'Repel [evil] by that [deed] which is better;'),
    ('C', 34, 10, 15, 'and thereupon the one whom between you and him is enmity'),
    ('D', 34, 15, 18, '[will become] as though he was a devoted friend.'),
    ('E', 35, 0, 5, 'But none is granted it except those who are patient,'),
    ('F', 35, 5, 11, 'and none is granted it except one having a great portion [of good].'),
]
# the order the phrases are heard in the recording: C is recited twice (a pause after the first, then joined to D)
RECITED = ['A', 'B', 'C', 'C', 'D', 'E', 'F']
# the per-phrase read-back windows (whisper_large_phrases.json), seconds on the reference's audio, and what each holds
WINDOWS = [((0.0, 3.38), 'A'), ((3.38, 5.70), 'B'), ((5.70, 9.98), 'C'), ((9.98, 17.30), 'CD'), ((17.30, 23.79), 'E'),
           ((23.79, 30.10), 'F')]

bad = 0
out = {'ayat': {}, 'phrases': []}
for n in (34, 35):
    tz, qv = load(n)
    qc, tzu = qv['text_uthmani'], tz['quran-uthmani']
    same = qc.replace(TATWEEL, '') == ''.join(c for c in tzu if c not in MEEMS)
    bad += not same
    print(f'41:{n} Uthmani quran.com vs Tanzil: {"SAME LETTERS AND HARAKAT" if same else "DIFF"} '
          f'(quran.com tatweel x{qc.count(TATWEEL)}, Tanzil small meem x{sum(tzu.count(m) for m in MEEMS)})')
    en = tz['en.sahih']
    q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
    # the two Sahih International sources differ by one comma in 41:34 (quran.com: "and thereupon, the one whom"); the
    # words are the same, and the Tanzil text (no comma) is the one shown
    en_same = q20 == en or (n == 34 and q20 == en.replace('and thereupon the one', 'and thereupon, the one'))
    bad += not en_same
    print(f'      Sahih International Tanzil vs quran.com 20: {"SAME" if q20 == en else "SAME WORDS, quran.com adds a comma after thereupon" if en_same else "DIFF: " + q20}')
    parts = [p for p in PHRASES if p[1] == n]
    W = qc.split(' ')
    ar_join = ' '.join(' '.join(W[a:b]) for _, _, a, b, _ in parts)
    en_join = ' '.join(p[4] for p in parts)
    ok = ar_join == qc and en_join == en and parts[-1][3] == len(W)
    bad += not ok
    print(f'      phrases rejoin to the ayah (Arabic and English): {"YES" if ok else "NO"}')
    out['ayat'][str(n)] = {'key': f'41:{n}', 'ar': qc, 'en': en, 'simple': tz['quran-simple'],
                           'end': '۝' + ''.join(IND[int(d)] for d in str(n))}
    for pid, _, a, b, e in parts:
        out['phrases'].append({'id': pid, 'n': n, 'key': f'41:{n}', 'ar': ' '.join(W[a:b]), 'en': e, 'last': b == len(W),
                               'simple': ' '.join(tz['quran-simple'].split(' ')[a:b])})

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')

# --- the recitation against the text: two Whisper large-v3 read-backs ---------------------------------------------------
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')


def norm(s):
    s = STRIP.sub('', s)
    return s.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': '', 'ة': 'ه'}))


P = {p['id']: p for p in out['phrases']}


def words_of(ids):
    return [norm(w) for pid in ids for w in P[pid]['simple'].split(' ') if norm(w)]


# 1) the two full read-backs: Whisper drops the repeated C (it collapses repeats), so they are held against A B C D E F
once = [x for k, x in enumerate(RECITED) if k == 0 or RECITED[k - 1] != x]
for name in ('whisper_large_noprompt', 'whisper_large_prompted'):
    heard = [norm(w[2]) for w in json.loads((src / f'{name}.json').read_text())['words'] if norm(w[2])]
    ok = heard == words_of(once)
    bad += not ok
    print(f'full read-back {name} vs 41:34-35 ({"".join(once)}): {"MATCH, all " + str(len(heard)) + " words in order" if ok else "DIFF"}')
    if not ok:
        print('   text :', ' '.join(words_of(once))); print('   heard:', ' '.join(heard))
# 2) one read-back per phrase window, which hears the repeat: C, then C again joined to D
win = json.loads((src / 'whisper_large_phrases.json').read_text())
assert [tuple(w['win']) for w in win] == [w for w, _ in WINDOWS]
seq = []
for w, (span, ids) in zip(win, WINDOWS):
    heard = [norm(x[2]) for x in w['words'] if norm(x[2])]
    ok = heard == words_of(list(ids))
    bad += not ok
    seq += list(ids)
    print(f'   window {span[0]:5.2f}-{span[1]:5.2f} s = {ids:2}: {"MATCH" if ok else "DIFF"} ({" ".join(heard)})')
bad += seq != RECITED
print('recited order from the windows:', ' '.join(seq), '(as RECITED)' if seq == RECITED else '(NOT as RECITED)')

used = json.loads(path.read_text())
same = used == out
bad += not same
print('texts.json', 'MATCHES the sources' if same else 'DIFFERS from the sources')
for a in out['phrases']:
    print(a['key'], a['id'], a['ar']); print('      ', cps(a['ar'])); print('      ', a['en'])

amiri = TTFont(str(job / 'qb/public/fonts/AmiriQuran.ttf'))
assert not {'COLR', 'CPAL', 'SVG ', 'CBDT', 'sbix'} & set(amiri.keys()), 'colour-layer font build'
cmap = amiri.getBestCmap()
allar = ''.join(a['ar'] + a['end'] for a in out['ayat'].values())
miss = sorted({c for c in allar if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
print('Amiri Quran (plain build, no COLR/CPAL/SVG) covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
for c in sorted(set(allar) - {' '}):
    assert unicodedata.name(c).startswith('ARABIC'), c
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
