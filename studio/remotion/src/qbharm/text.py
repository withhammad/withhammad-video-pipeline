"""Exact on-screen text for the private Quran Beat "Has harm touched you?" reel (QB-HARM), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/qbharm/text.py <job dir> [--write]     (needs fontTools)

The reference (DfsFqEpxneY, @hous_semai2719) captions its reel «مسّـك الضّـر؟ اسمـعها فقـط، لعلّـك ترتـاح» ("Has harm touched
you? Just listen, maybe you'll find rest") and plays the first half of Yunus 10:107, trimmed by its creator (the opening «وَ»
of «وَإِن» cut off, the voice cut at «لِفَضْلِهِۦ»). Owner, 2026-11-16: "Find full recitation". So the reel's audio is a complete,
attributed recitation of the whole ayah instead:

  Mishary Rashid Alafasy, Hafs, everyayah.com/data/Alafasy_128kbps/010107.mp3 (32.85 s, 128 kbps stereo), used whole.

It opens on «وَإِن» and ends on the ayah's end «ٱلرَّحِيمُ», with the reciter's own pauses at both waqf signs (ۖ after «هُوَ»,
10.7-11.0 s; ۚ after «لِفَضْلِهِۦ», 20.0-20.4 s; ۚ after «عِبَادِهِۦ», 26.8-27.1 s).

Sources, downloaded once into <job>/src (kept out of git):
  tz_10_107.json  api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, en.sahih
  qc_10_107.json  api.quran.com v4 verses/by_key/10:107: text_uthmani, words, translation 20 (Sahih International)
  tz_6_17.json, qc_6_17.json  the look-alike ayah al-An'am 6:17, to rule it out
  full/wl_{noprompt,prompted}.json  faster-whisper large-v3 (ar) read-backs of the Alafasy file, word level

Arabic on screen: quran.com verse text_uthmani, verbatim, split at word boundaries into the reciter's six phrases (joined
with single spaces they give back the whole ayah exactly). Checked against Tanzil quran-uthmani: letters and harakat
identical; Tanzil adds a small low meem (U+06E2) to the tanween of «بِضُرٍّۢ» and «بِخَيْرٍۢ», which Amiri Quran draws as a visible
mark the Madinah mushaf does not print there, so the quran.com text is the one shown.
English: Sahih International (Tanzil en.sahih), cut at the same phrase boundaries. quran.com translation 20 is the same
text, spelling Allah with a macron ("Allāh").
Exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
BOM, TATWEEL, MEEMS = chr(0xFEFF), chr(0x0640), {chr(0x06ED), chr(0x06E2)}
IND = '٠١٢٣٤٥٦٧٨٩'


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


def load(k):
    f = k.replace(':', '_')
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_{f}.json').read_text())['data']}
    qv = json.loads((src / f'qc_{f}.json').read_text())['verse']
    assert qv['verse_key'] == k
    return tz, qv


# the reciter's phrases on the verse text split at spaces (the waqf signs ۖ ۚ stand after a space, as their own token)
PHRASES = [
    ('A', 0, 4, 'And if Allah should touch you with adversity,'),
    ('B', 4, 10, 'there is no remover of it except Him;'),
    ('C', 10, 13, 'and if He intends for you good,'),
    ('D', 13, 17, 'then there is no repeller of His bounty.'),
    ('E', 17, 24, 'He causes it to reach whom He wills of His servants.'),
    ('F', 24, 27, 'And He is the Forgiving, the Merciful.'),
]

bad = 0
tz, qv = load('10:107')
qc, tzu, en = qv['text_uthmani'], tz['quran-uthmani'], tz['en.sahih']
same = qc.replace(TATWEEL, '') == ''.join(c for c in tzu if c not in MEEMS)
bad += not same
print(f'10:107 Uthmani quran.com vs Tanzil: {"SAME LETTERS AND HARAKAT" if same else "DIFF"} '
      f'(quran.com tatweel x{qc.count(TATWEEL)}, Tanzil small meem x{sum(tzu.count(m) for m in MEEMS)})')
q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
en_same = q20.replace('Allāh', 'Allah').rstrip('.') == en.rstrip('.')
bad += not en_same
print('      Sahih International Tanzil vs quran.com 20:', 'SAME (quran.com spells Allāh)' if en_same else 'DIFF: ' + q20)
W = qc.split(' ')
ar_join = ' '.join(' '.join(W[a:b]) for _, a, b, _ in PHRASES)
en_join = ' '.join(p[3] for p in PHRASES)
ok = ar_join == qc and en_join.rstrip('.') == en.rstrip('.') and PHRASES[-1][2] == len(W)
bad += not ok
print(f'      six phrases rejoin to the whole ayah (Arabic) and its whole translation (English): {"YES" if ok else "NO"}')
out = {'ayah': {'key': '10:107', 'surah': 'Yunus', 'ar': qc, 'en': en, 'end': '۝' + ''.join(IND[int(d)] for d in '107')},
       'reciter': 'Mishary Rashid Alafasy', 'audio': 'https://everyayah.com/data/Alafasy_128kbps/010107.mp3', 'phrases': []}
SIMPLE = tz['quran-simple'].split(' ')
assert len(SIMPLE) == len(W)
for pid, a, b, e in PHRASES:
    out['phrases'].append({'id': pid, 'key': '10:107', 'ar': ' '.join(W[a:b]), 'en': e, 'last': b == len(W),
                           'simple': ' '.join(SIMPLE[a:b])})

# the look-alike 6:17 differs after «هُوَ ۖ وَإِن»
tz6, qv6 = load('6:17')
W6 = qv6['text_uthmani'].split(' ')
print('6:17 shares the first', next(i for i, (x, y) in enumerate(zip(W, W6)) if x != y), 'tokens, then reads', ' '.join(W6[11:13]),
      '(10:107 reads', ' '.join(W[11:13]) + ')')

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')

# --- the recitation against the text ---------------------------------------------------------------------------------------
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')


def norm(s):
    s = STRIP.sub('', s)
    return s.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': '', 'ة': 'ه'}))


text = [norm(w) for p in out['phrases'] for w in p['simple'].split(' ') if norm(w)]
for name in ('wl_prompted', 'wl_noprompt'):
    heard = [norm(w[2]) for w in json.loads((src / 'full' / f'{name}.json').read_text())['words'] if norm(w[2])]
    if heard == text:
        print(f'full read-back {name}: MATCH, all {len(heard)} words in order, «وَإِن» to «ٱلرَّحِيمُ»')
    else:
        diff = [(i, t, h) for i, (t, h) in enumerate(zip(text, heard)) if t != h]
        print(f'full read-back {name}: {len(heard)} of {len(text)} words, letter-level misses {diff}')
        bad += name == 'wl_prompted' or len(heard) != len(text)

used = json.loads(path.read_text())
same = used == out
bad += not same
print('texts.json', 'MATCHES the sources' if same else 'DIFFERS from the sources')
for a in out['phrases']:
    print(a['key'], a['id'], a['ar']); print('      ', cps(a['ar'])); print('      ', a['en'])

amiri = TTFont(str(job / 'qb/public/fonts/AmiriQuran.ttf'))
assert not {'COLR', 'CPAL', 'SVG ', 'CBDT', 'sbix'} & set(amiri.keys()), 'colour-layer font build'
cmap = amiri.getBestCmap()
allar = qc + out['ayah']['end']
miss = sorted({c for c in allar if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
print('Amiri Quran (plain build) covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
for c in sorted(set(allar) - {' '}):
    assert unicodedata.name(c).startswith('ARABIC'), c
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
