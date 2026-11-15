"""Exact text for the private knitted "Grace of Allah" reel (LUTF-KNIT), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/lutfknit/text.py <job dir> [--write]     (needs fontTools)

The reference (DfsTrK5or6t, @taddbeer_fx) carries NO recitation: its 28.5 s track is wordless music with impact sounds.
faster-whisper large-v3 forced to Arabic returns only «موسيقى» ("music") for the whole track and for each half, and its
language detection finds no language above 0.18 (knit/src/whisper_large_noprompt.json, whisper2.log). So no Quran text is
drawn in the video, and nothing is laid over the audio.

On screen (not Quran):
  label   «لطف الله» / "Grace of Allah": the reference's own on-screen label. The Arabic is cut from the reference's caption
          (source.info.json): «لطف» = the letters 2-4 of «بلطفه», «الله» = the caption's own word.
  line    the caption's first sentence, verbatim, without its two closing dots: «عناية الله لا تراها، لكنها تحيط بك»,
          with an English rendering.
In the post caption only (text, not over the music): Quran 42:19 (Ash-Shura), whose «لَطِيفٌ» is the reel's theme. Arabic =
quran.com text_uthmani, which must equal Tanzil quran-uthmani code point for code point; English = Sahih International
(Tanzil en.sahih). Sources in <job>/knit/src: tz_42_19.json (api.alquran.cloud), qc_42_19.json (api.quran.com v4).
Exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
BOM = chr(0xFEFF)
INVIS = re.compile('[⁦-⁩‎‏‪-‮﻿\t]')


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


bad = 0
cap = INVIS.sub('', json.loads((job / 'source.info.json').read_text())['description']).strip()
words = cap.split()
first = cap.split('..')[0].strip()
assert first == 'عناية الله لا تراها، لكنها تحيط بك', first
lutf = [w for w in words if w.startswith('بلطفه')][0][1:4]
allah = [w for w in words if w == 'الله'][0]
out = {'labelAr': f'{lutf} {allah}', 'labelEn': 'Grace of Allah', 'lineAr': first,
       'lineEn': "You can't see Allah's care, but it surrounds you"}

# Quran 42:19 for the caption
tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / 'tz_42_19.json').read_text())['data']}
qv = json.loads((src / 'qc_42_19.json').read_text())['verse']
assert qv['verse_key'] == '42:19'
qc = qv['text_uthmani']
same = qc == tz['quran-uthmani']
bad += not same
print('42:19 quran.com text_uthmani vs Tanzil quran-uthmani:', 'IDENTICAL, code point for code point' if same else 'DIFF')
if not same:
    for i, (a, b) in enumerate(zip(qc, tz['quran-uthmani'])):
        if a != b: print('   at', i, cps(a), 'vs', cps(b))
q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', qv['translations'][0]['text'])
print('Sahih International, Tanzil en.sahih:', tz['en.sahih'])
print('            quran.com translation 20:', q20, '(spells "Allāh" and "provision"; the Tanzil text is used)')
out['ayahKey'] = '42:19'
out['ayahAr'] = qc
out['ayahEn'] = tz['en.sahih']
out['ayahRef'] = 'Quran 42:19 (Ash-Shura), Sahih International'

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
for k in ('labelAr', 'lineAr'):
    for c in out[k]:
        assert c == ' ' or c == '،' or unicodedata.name(c).startswith('ARABIC'), (k, c)
amiri = TTFont(str(job / 'knit/public/fonts/Amiri-Bold.ttf')).getBestCmap()
miss = sorted({c for c in out['labelAr'] + out['lineAr'] if c != ' ' and ord(c) not in amiri})
bad += bool(miss)
print('Amiri Bold covers the on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
