"""Exact text for the private knitted "Istighfar x100" reel (ISTIGHFAR-KNIT), checked against sources, never typed from memory.

    /usr/bin/python3 studio/remotion/src/istighfarknit/text.py <job dir> [--write]     (needs fontTools)

The reference (Dft1ZqUtnGS) carries NO recitation (wordless music; Whisper medium in Arabic hears only «موسيقى»), so no Quran is
recited and nothing is voiced over Quran. On screen:
  dhikr    «أَسْتَغْفِرُ ٱللَّهَ» Astaghfirullah, "I seek forgiveness from Allah" (the reference's own words)
  end      «تَقَبَّلَ ٱللَّهُ مِنَّا وَمِنكُمْ» Taqabbal Allahu minna wa minkum, "May Allah accept it from us and from you" (the
           reference's own closing line; a du'a, shown without any attribution)
  ayah     Quran 71:10 (Nuh), the verse the reference cites. Arabic = api.quran.com v4 text_uthmani, which must equal, code point
           for code point, the tanzil.net Uthmani download with pause marks (<job>/src/tanzil_uthmani_marks.txt). English =
           Sahih International (Tanzil en.sahih via api.alquran.cloud). Note: api.alquran.cloud's quran-uthmani adds U+06ED
           (small low meem) after the tanween of «غَفَّارًا»; quran.com and tanzil.net agree without it, so theirs is used.
Caption only: Sahih Muslim 2702a (al-Agharr al-Muzani), read on sunnah.com (<job>/src/sunnah_muslim_2702a.txt).
Exit code 1 on any mismatch.
"""
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
cps = lambda s: ' '.join(f'U+{ord(c):04X}' for c in s)
bad = 0

qc = json.loads((src / 'qc_71_10.json').read_text())['verses'][0]['text_uthmani']
tl = [l for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('71|10|')][0].split('|', 2)[2]
same = qc == tl
bad += not same
print('71:10 quran.com text_uthmani vs tanzil.net uthmani:', 'IDENTICAL, code point for code point' if same else 'DIFF')
tz = {e['edition']['identifier']: e['text'].lstrip('﻿') for e in json.loads((src / 'tz_71_10.json').read_text())['data']}
en = tz['en.sahih']
assert en.startswith("And said, 'Ask forgiveness of your Lord."), en
out = {
    'dhikrAr': 'أَسْتَغْفِرُ ٱللَّهَ', 'dhikrTr': 'Astaghfirullah', 'dhikrEn': 'I seek forgiveness from Allah',
    'endAr': 'تَقَبَّلَ ٱللَّهُ مِنَّا وَمِنكُمْ', 'endTr': 'Taqabbal Allahu minna wa minkum', 'endEn': 'May Allah accept it from us and from you',
    'ayahAr': qc, 'ayahEn': en, 'ayahRef': 'Nuh 71:10',
    'ayahNote': 'Sahih International',
}
print('Sahih International (Tanzil en.sahih):', en)
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for k, v in out.items():
    ok = used.get(k) == v
    bad += not ok
    print(f'{k:8} {"MATCH" if ok else "DIFF "} {v}')
    if any('؀' <= c <= 'ۿ' for c in v):
        print('         ', cps(v))
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
miss = sorted({c for k in ('dhikrAr', 'endAr', 'ayahAr') for c in out[k] if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers all on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
