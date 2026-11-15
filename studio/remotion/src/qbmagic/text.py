"""Exact on-screen text for the private Quran Beat "Pharaoh called it magic" reel (QB-MAGIC), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/qbmagic/text.py <job dir> [--write]     (needs fontTools)

The reference's audio is one continuous recitation of ash-Shu'ara 26:32-40 (Hafs), 0.0-49.0 s. It is NOT al-A'raf 7:107-112,
which opens with the same two ayat: the reciter says «قَالَ لِلْمَلَإِ حَوْلَهُۥٓ» (26:34; 7:109 is «قَالَ ٱلْمَلَأُ مِن قَوْمِ
فِرْعَوْنَ»), «بِسِحْرِهِۦ» (26:35; 7:110 has no «بسحره»), «وَٱبْعَثْ» (26:36; 7:111 is «وَأَرْسِلْ») and «سَحَّارٍ» (26:37;
7:112 is «سَـٰحِرٍ»), then goes on with 26:38-40, which have no parallel in al-A'raf.

Sources, downloaded once into <job>/qb/src (kept out of git):
  tz_26_<n>.json  api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, en.sahih
  qc_26_<n>.json  api.quran.com v4 verses/by_key/26:<n>: text_uthmani, text_imlaei, translation 20 (Sahih International)
  whisper_large_{prompted,noprompt}.json  faster-whisper large-v3 (ar) read-backs of the reference audio, word level

Arabic on screen: quran.com text_uthmani, verbatim, code point for code point. Checked against Tanzil quran-uthmani: the
letters and harakat are identical; quran.com writes a tatweel (U+0640) before 6 superscript alefs, and Tanzil appends a small
meem (U+06ED / U+06E2) to 6 tanweens that are followed by idgham or ikhfa. Amiri Quran draws those Tanzil meems as a visible
small meem, which the Madinah mushaf does not print there, so the quran.com text is the one shown.
English: Sahih International (Tanzil en.sahih; quran.com translation 20 is the same text with footnote markers, "Allāh",
and a stray full stop at the end of 26:39).
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
AYAT = list(range(32, 41))
IND = '٠١٢٣٤٥٦٧٨٩'


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


def load(n):
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_26_{n}.json').read_text())['data']}
    qv = json.loads((src / f'qc_26_{n}.json').read_text())['verse']
    assert qv['verse_key'] == f'26:{n}'
    return tz, qv


bad = 0
out = {'ayat': []}
# display line breaks (word index where line 2 starts) for the two ayat too wide for one line at 54 px
BREAKS = {35: 5, 36: 3}
for n in AYAT:
    tz, qv = load(n)
    qc = qv['text_uthmani']
    tzu = tz['quran-uthmani']
    same = qc.replace(TATWEEL, '') == ''.join(c for c in tzu if c not in MEEMS)
    bad += not same
    extra_t = qc.count(TATWEEL)
    extra_m = sum(tzu.count(m) for m in MEEMS)
    print(f'26:{n} Uthmani quran.com vs Tanzil: {"SAME LETTERS AND HARAKAT" if same else "DIFF"} '
          f'(quran.com tatweel x{extra_t}, Tanzil small meem x{extra_m})')
    W = qc.split(' ')
    b = BREAKS.get(n)
    lines = [' '.join(W[:b]), ' '.join(W[b:])] if b else [qc]
    assert ' '.join(lines) == qc
    en = tz['en.sahih']
    q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
    en_same = q20 == en or (n == 39 and q20 == en + '.')
    bad += not en_same
    print(f'      Sahih International Tanzil vs quran.com 20: {"SAME" if en_same else "DIFF"}' + (' (quran.com adds a full stop)' if q20 != en else ''))
    out['ayat'].append({'key': f'26:{n}', 'n': n, 'ar': qc, 'arLines': lines, 'end': '۝' + ''.join(IND[int(d)] for d in str(n)),
                        'en': en, 'simple': tz['quran-simple']})

# the end card quotes 26:41 and 26:46 in English only
for n in (41, 46):
    tz, qv = load(n)
    out[f'en{n}'] = tz['en.sahih']

# --- the recitation against the text: two Whisper large-v3 read-backs ---------------------------------------------------
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')


def norm(s):
    s = STRIP.sub('', s)
    return s.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': ''}))


quran = [norm(w) for a in out['ayat'] for w in a['simple'].split(' ')]
HEARD_AS = {'بيطا': 'بيضا', 'وبعد': 'وابعث', 'وبعث': 'وابعث', 'كعبان': 'ثعبان', 'نبين': 'مبين', 'للملي': 'للملا'}
for name in ('whisper_large_prompted', 'whisper_large_noprompt'):
    heard = []
    for w in json.loads((src / f'{name}.json').read_text()):
        t = norm(w[2].strip())
        if t == 'كانوهم':   # Whisper joins «كانوا هم»
            heard += ['كانوا', 'هم']
            continue
        heard.append(HEARD_AS.get(t, t))
    ok = heard == quran
    bad += not ok
    used = sorted({k for k in HEARD_AS if any(norm(w[2].strip()) == k for w in json.loads((src / f'{name}.json').read_text()))})
    print(f'recitation vs 26:32-40 ({name}): {"MATCH, all " + str(len(quran)) + " words in order" if ok else "DIFF"}'
          + (f'; Whisper spellings accepted: {", ".join(f"{k}->{HEARD_AS[k]}" for k in used)}, كانوهم->كانوا هم' if ok else ''))
    if not ok:
        for i, (a, b) in enumerate(zip(quran, heard)):
            if a != b: print('   word', i, a, 'vs heard', b)
        print('   lengths', len(quran), len(heard))

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
same = used == out
bad += not same
print('texts.json', 'MATCHES the sources' if same else 'DIFFERS from the sources')
for a in out['ayat']:
    print(a['key'], a['ar']); print('      ', cps(a['ar'])); print('      ', a['en'])

amiri = TTFont(str(job / 'qb/public/fonts/AmiriQuran.ttf'))
assert not {'COLR', 'CPAL', 'SVG ', 'CBDT', 'sbix'} & set(amiri.keys()), 'colour-layer font build'
cmap = amiri.getBestCmap()
allar = ''.join(a['ar'] + a['end'] for a in out['ayat'])
miss = sorted({c for c in allar if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
print('Amiri Quran (plain build, no COLR/CPAL/SVG) covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
for c in sorted(set(allar) - {' '}):
    assert unicodedata.name(c).startswith('ARABIC'), c
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
