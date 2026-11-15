"""Exact Arabic for the private knitted "Three lanterns" dhikr reel (LANTERN-KNIT), cut out of authoritative sources, never typed.

    studio/.venv/bin/python -I studio/remotion/src/lanternknit/text.py <job dir> [--write]

Sources (saved once into <job>/knit/src, kept out of git):
  - sunnah.com, Sahih Muslim 2137a (in-book Book 38, Hadith 16), Arabic, read in the built-in browser (curl meets a
    Cloudflare challenge): the code points of «سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلاَ إِلَهَ إِلاَّ اللَّهُ وَاللَّهُ أَكْبَرُ»
    (sunnah_muslim_2137_excerpt.json), cross-checked against the hadith-api dataset copy of the same hadith
    (h_ara-muslim_5601.json): the slice must occur in it verbatim;
  - quran.com API v4 `text_uthmani` and Tanzil `quran-uthmani` (api.alquran.cloud) for Quran 2:152; both must agree;
    the English is Sahih International (quran.com resource 20 = Tanzil en.sahih, both must agree);
  - quran.com `text_imlaei` 23:91 and 1:2, as a second witness for SubhanAllah and Alhamdulillah (compared after NFC,
    reported, not used on screen).
The three dhikr phrases are the hadith's own words (the conjunction waw dropped from wal-hamdu and wallahu). Every string is
compared code point by code point with texts.json. --write regenerates texts.json from the sources. Exit 1 on any mismatch.
"""
import json
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
WAW_FATHA = chr(0x0648) + chr(0x064E)

ex = json.loads((src / 'sunnah_muslim_2137_excerpt.json').read_text())
sunnah = ''.join(chr(int(h, 16)) for h in ex['hex'].split())
api = json.loads((src / 'h_ara-muslim_5601.json').read_text())['hadiths'][0]['text']
assert sunnah in api, 'the sunnah.com slice does not occur verbatim in the hadith-api copy of Muslim 2137'
w = sunnah.split(' ')
assert len(w) == 10 and w[2].startswith(WAW_FATHA) and w[8].startswith(WAW_FATHA), w
sub, hamd, akbar = ' '.join(w[0:2]), ' '.join([w[2][2:], w[3]]), ' '.join([w[8][2:], w[9]])

qc = json.loads((src / 'qc_2_152.json').read_text())['verse']
tz = {e['edition']['identifier']: e['text'] for e in json.loads((src / 'tz_2_152.json').read_text())['data']}
assert qc['text_uthmani'] == tz['quran-uthmani'], ('2:152 Uthmani differs between quran.com and Tanzil', qc['text_uthmani'], tz['quran-uthmani'])
en_qc = [t['text'] for t in qc['translations'] if t['resource_id'] == 20][0]
assert en_qc == tz['en.sahih'], ('Sahih International differs', en_qc, tz['en.sahih'])
ayah = qc['text_uthmani']
aw = ayah.split(' ')
assert len(aw) == 6, aw

SOURCES = {
    'sub': (sub, 'Sahih Muslim 2137a, sunnah.com (= hadith-api ara-muslim/5601)'),
    'hamd': (hamd, 'Sahih Muslim 2137a, sunnah.com, wal-hamdu minus the conjunction waw'),
    'akbar': (akbar, 'Sahih Muslim 2137a, sunnah.com, wallahu akbar minus the conjunction waw'),
    'ayah': (ayah, 'Quran 2:152, quran.com text_uthmani = Tanzil quran-uthmani'),
    'ayah_a': (' '.join(aw[:2]), 'Quran 2:152 words 1-2 (line 1 on screen)'),
    'ayah_b': (' '.join(aw[2:]), 'Quran 2:152 words 3-6 (line 2 on screen)'),
}
EN = {'ayah_en': en_qc}

# second witness: the Quran's own spelling of the two Quranic phrases (quran.com imla'i), compared after NFC
for k, key, first in (('sub', '23_91', 'سُبْحَانَ'), ('hamd', '1_2', 'الْحَمْدُ')):
    t = json.loads((src / f'qc_{key}.json').read_text())['verse']['text_imlaei'].split()
    i = [unicodedata.normalize('NFC', x) for x in t].index(unicodedata.normalize('NFC', first))
    q = ' '.join(t[i:i + 2])
    same = unicodedata.normalize('NFC', q) == unicodedata.normalize('NFC', SOURCES[k][0])
    print(f'witness {k:5} quran.com imlaei {key.replace("_", ":")}: {q}  {"SAME after NFC" if same else "DIFFERENT"}'
          f'{"" if q == SOURCES[k][0] else " (mark order differs, canonically equivalent)" if same else ""}')

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps({**{k: v[0] for k, v in SOURCES.items()}, **EN}, ensure_ascii=False, indent=2) + '\n')
used = json.loads(path.read_text())
bad = 0
for k, (want, where) in SOURCES.items():
    got = used[k]
    same = got == want
    bad += not same
    print(f'{k:7} {"MATCH" if same else "DIFF "} {got}   <- {where}')
    print('        ' + ' '.join(f'U+{ord(c):04X}' for c in got))
    if not same:
        for n, (x, y) in enumerate(zip(got.ljust(len(want)), want.ljust(len(got)))):
            if x != y:
                print(f'        at {n}: used U+{ord(x):04X} {unicodedata.name(x, "?")} vs source U+{ord(y):04X} {unicodedata.name(y, "?")}')
for k, want in EN.items():
    same = used[k] == want
    bad += not same
    print(f'{k:7} {"MATCH" if same else "DIFF "} {used[k]}   <- Sahih International, quran.com resource 20 = Tanzil en.sahih')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
