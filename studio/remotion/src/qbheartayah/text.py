"""Exact on-screen text for the private Quran Beat "Heart and ayah" reel (QB-HEART), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/qbheartayah/text.py <job dir> [--write]     (needs fontTools)

The reference's (DfU-34WRzIF, @hous_semai2719) audio is one reciter, no music: a phone-tap click at ~1.6 s, then al-Hijr
15:97 (1.95-14.2 s) and 15:98 (16.2-25.2 s), both recited complete to the ayah end. 15:99 is not recited.

Sources, downloaded once into <job>/qb/src (kept out of git):
  tz_15_<n>.json  api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, en.sahih
  qc_15_<n>.json  api.quran.com v4 verses/by_key/15:<n>: text_uthmani, text_imlaei, translation 20 (Sahih International)
  whisper_large_{prompted,noprompt}.json  faster-whisper large-v3 (ar) read-backs of the reference audio, word level

Arabic on screen: quran.com text_uthmani, verbatim, code point for code point; checked against Tanzil quran-uthmani
(letters and harakat; quran.com writes a tatweel before the superscript alef of ٱلسَّـٰجِدِينَ, Tanzil does not).
English: Sahih International (Tanzil en.sahih; quran.com translation 20 is the same text with "Allāh").
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
AYAT = [97, 98]
IND = '٠١٢٣٤٥٦٧٨٩'


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


def load(n):
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_15_{n}.json').read_text())['data']}
    qv = json.loads((src / f'qc_15_{n}.json').read_text())['verse']
    assert qv['verse_key'] == f'15:{n}'
    return tz, qv


bad = 0
out = {'ayat': []}
for n in AYAT:
    tz, qv = load(n)
    qc = qv['text_uthmani']
    tzu = tz['quran-uthmani']
    same = qc.replace(TATWEEL, '') == ''.join(c for c in tzu if c not in MEEMS)
    bad += not same
    print(f'15:{n} Uthmani quran.com vs Tanzil: {"SAME LETTERS AND HARAKAT" if same else "DIFF"} '
          f'(quran.com tatweel x{qc.count(TATWEEL)}, Tanzil small meem x{sum(tzu.count(m) for m in MEEMS)})')
    if not same:
        print('   quran.com', cps(qc)); print('   Tanzil   ', cps(tzu))
    en = tz['en.sahih']
    q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
    en_same = q20.replace('Allāh', 'Allah') == en
    bad += not en_same
    print(f'      Sahih International Tanzil vs quran.com 20: {"SAME" if en_same else "DIFF"}')
    out['ayat'].append({'key': f'15:{n}', 'n': n, 'ar': qc, 'end': '۝' + ''.join(IND[int(d)] for d in str(n)),
                        'en': en, 'simple': tz['quran-simple']})

# --- the recitation against the text: two Whisper large-v3 read-backs ---------------------------------------------------
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')


def norm(s):
    s = STRIP.sub('', s)
    return s.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': ''}))


quran = [norm(w) for a in out['ayat'] for w in a['simple'].split(' ')]
HEARD_AS = {'وكم': 'وكن'}   # the prompted pass hears the ikhfa'd nun of «وَكُن مِّنَ» as a meem
for name in ('whisper_large_noprompt', 'whisper_large_prompted'):
    words = json.loads((src / f'{name}.json').read_text())
    heard = [HEARD_AS.get(norm(w[2].strip()), norm(w[2].strip())) for w in words]
    ok = heard == quran
    bad += not ok
    used = sorted({k for k in HEARD_AS if any(norm(w[2].strip()) == k for w in words)})
    print(f'recitation vs 15:97-98 ({name}): {"MATCH, all " + str(len(quran)) + " words in order" if ok else "DIFF"}'
          + (f'; Whisper spelling accepted: {", ".join(f"{k}->{HEARD_AS[k]}" for k in used)}' if ok and used else ''))
    if not ok:
        print('   heard', heard); print('   quran', quran)

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
