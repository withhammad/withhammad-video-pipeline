"""Exact text for the private knitted "Don't be proud" reel (PROUD-KNIT), checked against sources, never trusted from memory.

    /usr/bin/python3 -I studio/remotion/src/proudknit/text.py <job dir> [--write]     (needs fontTools)

THE AUDIO (De6-fTIo_S0, @abduvaseeq) is NOT Quran: it is a man speaking Arabic prose (a lesson), with a soft sustained tonal pad
under it, whoosh transitions and a rising chime at ~19 s. Two Whisper models (whisper.cpp large-v3-turbo, faster-whisper
large-v3, both forced to Arabic) agree on the words. They are, word for word, a passage of Shaykh Muhammad ibn Salih
al-Uthaymin's commentary on Riyad as-Salihin, hadith 7 (= Sahih Muslim 2564b, "Allah does not look at your bodies or your
forms, but He looks at your hearts"): <job>/src/uthaymin_sharh_riyad_muslim2564b.txt (hadithunlocked.com, the Dar al-Watan text).
Two small differences between the voice and the printed text, both shown as SPOKEN:
  * the voice says «وَلَا بِسَيَّارَاتِكَ» (both models hear the bi- and the plural); the printed text has «ولا سياراتك».
  * the printed sentence goes on «فأحمد الله عليه»; the clip ends at «عليك».
The reference's own on-screen Arabic said «بسيارتك» (singular) and «بالتقوى»; the voice says «بسياراتك» and «للتقوى», as printed.
So the on-screen Arabic here is the speaker's words, vocalised; the attribution is "Shaykh Ibn al-Uthaymin, Sharh Riyad
as-Salihin" (who the VOICE is cannot be proven from the file; the wording is his, verbatim).

Gates (exit 1 on any failure):
  1. the on-screen Arabic lines, with the short vowels removed, joined, equal the printed passage (also unvocalised) except the
     one documented ب, and every line uses only letters + Arabic marks Amiri Quran has glyphs for.
  2. caption only: Quran 49:13 «إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ» (the ayah the shaykh cites in this same commentary) must
     appear verbatim in api.quran.com text_uthmani AND in the tanzil.net Uthmani download; English Sahih International.
  3. caption only: Sahih Muslim 2564c (sunnah.com, read in the browser: <job>/src/sunnah_muslim_2564c.txt) found verbatim.
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
bad = 0

# one Arabic line per beat (times are set in ProudKnit.tsx); English is our own translation of the spoken words
LINES = [
    ('لَا تَفْتَخِرْ بِمَالِكَ', "Don't be [proud] of your wealth,"),
    ('وَلَا بِجَمَالِكَ', 'or your beauty,'),
    ('وَلَا بِبَدَنِكَ', 'or your body,'),
    ('وَلَا بِأَوْلَادِكَ', 'or your children,'),
    ('وَلَا بِقُصُورِكَ', 'or your mansions,'),
    ('وَلَا بِسَيَّارَاتِكَ', 'or your cars,'),
    ('وَلَا بِشَيْءٍ مِنْ هَٰذِهِ الدُّنْيَا أَبَدًا', 'or anything of this worldly life, [ever.]'),
    ('إِنَّمَا', 'Rather,'),
    ('إِذَا وَفَّقَكَ اللَّهُ', 'if {Allah} grants you success'),
    ('لِلتَّقْوَى', 'in attaining {piety,}'),
    ('فَهَٰذَا مِنْ فَضْلِ اللَّهِ عَلَيْكَ', "then that is from {Allah's bounty} upon you."),
]
HARAKAT = set('ًٌٍَُِّْٰ')


def bare(s):
    return ''.join(c for c in unicodedata.normalize('NFC', s) if c not in HARAKAT)


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


# 1. the saying against the printed commentary
book = (src / 'uthaymin_sharh_riyad_muslim2564b.txt').read_text(encoding='utf-8')
a, b = book.index('لا تفتخر'), book.index('من فضل الله عليك') + len('من فضل الله عليك')
printed = re.sub(r'[،,]', '', book[a:b])
printed = re.sub(r'\s+', ' ', printed).strip()
spoken = ' '.join(bare(ar) for ar, _ in LINES)
expected = printed.replace('ولا سياراتك', 'ولا بسياراتك')      # the one documented difference (the voice adds bi-)
ok = spoken == expected
bad += not ok
print('printed passage :', printed)
print('on screen (bare):', spoken)
print('saying == printed commentary (+ the spoken bi-):', 'MATCH' if ok else 'MISMATCH')
if not ok:
    for i, (x, y) in enumerate(zip(spoken, expected)):
        if x != y:
            print('  first difference at', i, repr(spoken[i - 5:i + 5]), repr(expected[i - 5:i + 5])); break
for ar, _ in LINES:
    for c in ar:
        if c != ' ' and not (unicodedata.name(c).startswith('ARABIC LETTER') or c in HARAKAT):
            bad += 1; print('unexpected character', cps(c), 'in', ar)

# 2. Quran 49:13 (caption only)
qc = json.loads((src / 'qc_49_13.json').read_text())['verses'][0]['text_uthmani']
tl = next(l.split('|', 2)[2].strip() for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('49|13|'))
tz = {e['edition']['identifier']: e['text'].lstrip('﻿') for e in json.loads((src / 'tz_49_13.json').read_text())['data']}
q = qc.split(' ۚ ')[1]                      # the middle clause, cut from quran.com itself
hits = [q in qc, q in tl, q in tz['quran-uthmani']]
bad += not (hits[0] and hits[1])
print(f'49:13 quoted «{q}»: quran.com {hits[0]}, tanzil.net {hits[1]}, alquran.cloud {hits[2]}',
      '-> GATE PASS' if hits[0] and hits[1] else '-> MISMATCH')
print('   (the whole ayah differs between quran.com and tanzil.net only by U+0640 tatweel before the dagger alef in يَـٰٓأَيُّهَا / خَلَقْنَـٰكُم / جَعَلْنَـٰكُمْ:',
      qc.replace('ـ', '') == tl, ')')
en = tz['en.sahih']
qen = 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.'
ok = qen in en
bad += not ok
print('49:13 Sahih International clause', 'found' if ok else 'NOT FOUND', '|', en)

# 3. the hadith (caption only)
rec = (src / 'sunnah_muslim_2564c.txt').read_text(encoding='utf-8')
hen = 'Verily Allah does not look to your faces and your wealth but He looks to your heart and to your deeds.'
har = 'إِنَّ اللَّهَ لاَ يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ'
for k, v in (('hadithEn', hen), ('hadithAr', har)):
    ok = v in rec
    bad += not ok
    print(k, 'found verbatim in the sunnah.com record' if ok else 'NOT FOUND')

out = {'lines': [{'ar': ar, 'en': en} for ar, en in LINES],
       'source': 'Shaykh Muhammad ibn Salih al-Uthaymin, Sharh Riyad as-Salihin (on hadith 7, Sahih Muslim 2564)',
       'quranAr': q, 'quranEn': qen, 'quranRef': 'Quran 49:13 (Al-Hujurat), Sahih International',
       'hadithAr': har, 'hadithEn': hen, 'hadithRef': 'Sahih Muslim 2564c (sunnah.com)'}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
ok = used == out
bad += not ok
print('texts.json', 'MATCH' if ok else 'DIFF (run with --write)')
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
miss = sorted({c for ar, _ in LINES for c in ar if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers the on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
