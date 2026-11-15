"""Exact on-screen text for the private knitted "Allah, Allah" heart reel (ALLAH-KNIT), cut out of sources, never typed.

    python3 -I studio/remotion/src/allahknit/text.py <job dir> [--write]

Sources, downloaded once into <job>/knit/src (kept out of git):
  qc_112_2.json, qc_13_28.json   api.quran.com v4 verses/by_key: text_uthmani, translation 20 (Saheeh International)
  tz_112_2.json, tz_13_28.json   api.alquran.cloud (quran-uthmani, en.sahih), a second Tanzil-derived copy
  tanzil_uthmani_marks.txt       tanzil.net/pub/download, Uthmani (txt-2: sura|aya|text)
  hadith.json                    Sahih Muslim 148a and Jami` at-Tirmidhi 3334 as read on sunnah.com (caption only)

The Name «ٱللَّهُ» is the first word of al-Ikhlas 112:2 in Uthmani Hafs; the closing line is the last clause of ar-Ra'd 13:28,
«أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ», cut after the waqf sign ۗ (the reel's audio is a chant, not a recitation: nothing on screen is
presented as recited). quran.com text_uthmani must equal the tanzil.net line and the alquran.cloud copy code point for code point.
English: Saheeh International (quran.com translation 20) with footnote markers and the closing quote mark removed; it must
equal alquran.cloud en.sahih up to the spelling Allāh/Allah. Writes texts.json next to this file with --write; exit 1 on a mismatch.
"""
import json
import re
import sys
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
bad = 0
tz = {}
for line in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines():
    p = line.split('|')
    if len(p) == 3:
        tz[(p[0], p[1])] = p[2].lstrip('﻿')


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


V = {}
for key in ('112:2', '13:28'):
    s, a = key.split(':')
    qc = json.loads((src / f'qc_{s}_{a}.json').read_text())['verse']
    alq = json.loads((src / f'tz_{s}_{a}.json').read_text())['data']
    u = qc['text_uthmani']
    for name, other in (('tanzil.net', tz[(s, a)]), ('alquran.cloud', alq[0]['text'])):
        if u != other:
            bad += 1
            print('MISMATCH', key, name, '\n ', cps(u), '\n ', cps(other))
        else:
            print('OK', key, 'quran.com == ' + name, len(u), 'code points')
    en = re.sub(r'<sup[^>]*>.*?</sup>', '', qc['translations'][0]['text']).strip()
    if en.replace('Allāh', 'Allah') != alq[1]['text'].strip():
        bad += 1
        print('EN MISMATCH', key, en, '|', alq[1]['text'])
    V[key] = (u, en)

name = V['112:2'][0].split(' ')[0]
assert cps(name) == 'U+0671 U+0644 U+0644 U+0651 U+064E U+0647 U+064F', cps(name)   # alef wasla, lam, lam, shadda, fatha, ha, damma
u, en = V['13:28']
clause = u.split(' ۗ ')[1]
assert ' ۗ '.join(u.split(' ۗ ')) == u and V['13:28'][0].endswith(clause)
en_clause = en.split('. ')[1].rstrip('"').strip().replace('Allāh', 'Allah')   # the alquran.cloud en.sahih spelling (the serif has no ā)
print('NAME  ', name, cps(name))
print('13:28 ', clause, '\n      ', cps(clause))
print('EN    ', en_clause)
out = {'name': name, 'name_src': 'al-Ikhlas 112:2, word 1 (Uthmani Hafs; quran.com = tanzil.net)',
       'ayah': clause, 'ayah_ref': "Surah Ar-Ra'd 13:28", 'ayah_full': u,
       'en': en_clause, 'en_full': en.replace('Allāh', 'Allah').rstrip('"'), 'en_src': 'Saheeh International'}
if '--write' in sys.argv and not bad:
    (here / 'texts.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('wrote texts.json')
sys.exit(1 if bad else 0)
