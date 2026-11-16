"""Exact text for the private knitted Fajr "needle and candle" reel (FAJR-KNIT), checked against sources, never typed from memory.

    /usr/bin/python3 studio/remotion/src/fajrknit/text.py <job dir> [--write]     (needs fontTools)

The reference (DfQMDFSufy_) carries NO speech and NO recitation: wordless sound design (room tone, a needle tap, cloth rustle, the
needle's ting on the brass dish, silence, phone vibration). Whisper large-v3 in Arabic hears only the usual end-of-clip
hallucination. So nothing is subtitled from audio; the on-screen English lines translate the reference's own Darija caption.
  hadith   «رَكْعَتَا الْفَجْرِ خَيْرٌ مِنَ الدُّنْيَا وَمَا فِيهَا» = the matn of Sahih Muslim 725a (Book 6, Hadith 118), read on sunnah.com
           (<job>/src/sunnah_muslim_725a.txt), copied character for character from the page's Arabic between the quote marks;
           English = sunnah.com's own translation.
Caption only: Quran 17:78 (Al-Isra). Arabic = api.quran.com text_uthmani, which must equal, code point for code point, the tanzil.net
Uthmani text with pause marks (<job>/src/tanzil_uthmani_marks.txt); English = Sahih International (Tanzil en.sahih via
api.alquran.cloud). Exit code 1 on any mismatch.
"""
import json
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
cps = lambda s: ' '.join(f'U+{ord(c):04X}' for c in s)
bad = 0

page = (src / 'sunnah_muslim_725a.txt').read_text(encoding='utf-8')
ar_line = [l for l in page.splitlines() if l.startswith('Arabic:')][0]
matn = re.search(r'"‏\s*(.+?)\s*‏"', ar_line).group(1)
en_line = [l for l in page.splitlines() if l.startswith('English:')][0]
en = en_line.split('saying: ', 1)[1].strip()
assert 'Reference : Sahih Muslim 725a' in page and 'Book 6, Hadith 118' in page
qc = json.loads((src / 'qc_17_78.json').read_text())['verses'][0]['text_uthmani']
tl = [l for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('17|78|')][0].split('|', 2)[2]
same = qc == tl
bad += not same
print('17:78 quran.com text_uthmani vs tanzil.net uthmani:', 'IDENTICAL, code point for code point' if same else 'DIFF')
tz = {e['edition']['identifier']: e['text'].lstrip('﻿') for e in json.loads((src / 'tz_17_78.json').read_text())['data']}
out = {
    'hadithAr': matn, 'hadithEn': en, 'hadithRef': 'Sahih Muslim 725a',
    'ayahAr': qc, 'ayahEn': tz['en.sahih'], 'ayahRef': 'Al-Isra 17:78',
}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for k, v in out.items():
    ok = used.get(k) == v
    bad += not ok
    print(f'{k:9} {"MATCH" if ok else "DIFF "} {v}')
    if any('؀' <= c <= 'ۿ' for c in v):
        print('          ', cps(v))
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
need = set(out['hadithAr']) | {'ﷺ'}
miss = sorted({c for c in need if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers the on-screen Arabic and ﷺ:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
