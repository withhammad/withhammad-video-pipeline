"""Exact text for the private knitted golden-dolphin salawat reel (DOLPHIN-KNIT), cut out of saved sources, never typed.

    /usr/bin/python3 -I studio/remotion/src/dolphinknit/text.py <job dir> [--write]

The reference (DfwI-C2tUw9, Ikram Azad) is an AI video with a sung salawat nasheed (Whisper large-v3-turbo, Arabic):
  0.08-6.00  «وفي يوم الجمعة يا ربي صلى على الحبيب»
  6.00-10.06 «صلى عليك الله يا مسك ...» (the last word is unclear: Whisper hears «الواطي/الواطين»; not verified)
The nasheed's words are NOT drawn on screen (the source of the lyric could not be found). On screen instead:
  patch    «اللَّه» on the dolphin's flanks (the reference's own mark), the first six code points of «اللَّهُمَّ» in Bukhari 3370
  salawat  «اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ», cut from Sahih al-Bukhari 3370 as shown on sunnah.com (verify/hadith.txt)
In the post caption only: Quran 33:56 (quran.com text_uthmani, equal to Tanzil uthmani once quran.com's tatweel and waqf
sign are dropped; Sahih International) and Abu Dawud 1047 (sunnah.com, Sahih per al-Albani).
Exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
v = job / 'verify'
here = Path(__file__).resolve().parent
bad = 0
lines = (v / 'hadith.txt').read_text(encoding='utf8').splitlines()
buk = [l for l in lines if l.startswith('sunnah.com/bukhari:3370')][0]
i = buk.index('اللَّهُمَّ صَلِّ')
salawat = buk[i:buk.index('،', i)]
assert salawat == 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', salawat
patch = salawat[:6]
q = json.loads((v / 'qcom_33_56.json').read_text())['verses'][0]['text_uthmani']
tz = [l.strip().split('|', 2)[2] for l in open(v / 'tanzil_uthmani.txt', encoding='utf8') if l.startswith('33|56|')][0]
same = re.sub(' ?[ۖ-ۜ]', '', q.replace('ـ', '')) == tz
bad += not same
print('33:56 quran.com == Tanzil (tatweel and waqf sign dropped):', same)
en = re.sub(r'<sup[^>]*>.*?</sup>', '', json.loads((v / 'qcom_33_56_en.json').read_text())['translations'][0]['text'])
out = {'patch': patch, 'salawatAr': salawat, 'salawatEn': 'O Allah, send Your blessings upon Muhammad',
       'salawatRef': 'Sahih al-Bukhari 3370', 'ayahKey': '33:56', 'ayahAr': q, 'ayahEn': en,
       'ayahRef': 'Quran 33:56 (Al-Ahzab), Sahih International'}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for k, val in out.items():
    ok = used.get(k) == val
    bad += not ok
    print(f'{k:10} {"MATCH" if ok else "DIFF "} {val}')
    if any('؀' <= c <= 'ۿ' for c in val):
        print('           ', ' '.join(f'U+{ord(c):04X}' for c in val))
for c in out['salawatAr']:
    assert c == ' ' or unicodedata.name(c).startswith('ARABIC'), c
sys.exit(1 if bad else 0)
