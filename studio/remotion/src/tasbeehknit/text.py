"""Exact Arabic for the private knitted Tasbeeh Fatimah reel (TASBEEH-KNIT), cut out of authoritative sources, never typed.

    studio/.venv/bin/python -I studio/remotion/src/tasbeehknit/text.py <job dir> [--write]

Sources (downloaded once into <job>/knit/src, kept out of git):
  - quran.com API v4 `text_imlaei` (King Fahd Complex mushaf, imla'i spelling) and the Tanzil "quran-simple" text
    (api.alquran.cloud) for the four phrases that are word sequences of the Quran;
  - the hadith-api dataset (fawazahmed0, Arabic of Sahih Muslim 2137, in-book Book 38 Hadith 16) for "Allahu Akbar".
Every phrase is sliced out of each source, both Quran sources must agree, and the slice is compared character by character
(code point by code point) with texts.json. --write regenerates texts.json from the sources. Exit code 1 on any mismatch.
"""
import json
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent


BOM, LRM, RLM = chr(0xFEFF), chr(0x200E), chr(0x200F)
WAQF = {chr(0x06DA), chr(0x06D6), chr(0x06D7)}          # small jeem / salla / qala waqf signs stand as separate tokens


def quran(key, first, n):
    """n words of one ayah starting at the word `first`, from quran.com imla'i and from Tanzil simple; both must agree."""
    qc = json.loads((src / f'qc_{key.replace(":", "_")}.json').read_text())['verse']['text_imlaei']
    tz = [e['text'] for e in json.loads((src / f'tz_{key.replace(":", "_")}.json').read_text())['data']
          if e['edition']['identifier'] == 'quran-simple'][0].lstrip(BOM)
    out = []
    for t in (qc, tz):
        w = [x for x in t.split() if x not in WAQF]
        i = w.index(first)
        out.append((' '.join(w[i:i + n]), i))
    assert out[0][0] == out[1][0], (key, out)
    return out[0][0], f'Quran {key}, words {out[0][1] + 1}-{out[0][1] + n} (quran.com text_imlaei = Tanzil quran-simple)'


def hadith(file, first, n):
    """n words of a hadith starting at the first word equal to `first` (punctuation and direction marks stripped)."""
    text = json.loads((src / file).read_text())['hadiths'][0]['text']
    words = [w.strip(LRM + RLM + '.,:"') for w in text.split()]
    words = [w for w in words if w]
    i = words.index(first)
    return words[i:i + n]


w = hadith('h_ara-muslim_5601.json', 'وَاللَّهُ', 2)
assert w[0].startswith('و' + chr(0x064E)), w                         # the conjunction waw with its fatha
akbar = ' '.join([w[0][2:], w[1]])
SOURCES = {
    'bism': quran('1:1', 'بِسْمِ', 2),
    'sub': quran('23:91', 'سُبْحَانَ', 2),
    'hamd': quran('1:2', 'الْحَمْدُ', 2),
    'masha': quran('18:39', 'مَا', 3),
    'akbar': (akbar, 'Sahih Muslim 2137 (in-book: Book 38, Hadith 16), wallahu akbar minus the conjunction waw (hadith-api ara-muslim/5601)'),
}
assert SOURCES['masha'][0].split()[1].startswith('شَاءَ'), SOURCES['masha']

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps({k: v[0] for k, v in SOURCES.items()}, ensure_ascii=False, indent=2) + '\n')
used = json.loads(path.read_text())
bad = 0
for k, (want, where) in SOURCES.items():
    got = used[k]
    same = got == want
    bad += not same
    print(f'{k:6} {"MATCH" if same else "DIFF "} {got}   <- {where}')
    print('       ' + ' '.join(f'U+{ord(c):04X}' for c in got))
    if not same:
        for n, (x, y) in enumerate(zip(got.ljust(len(want)), want.ljust(len(got)))):
            if x != y:
                print(f'       at {n}: used U+{ord(x):04X} {unicodedata.name(x, "?")} vs source U+{ord(y):04X} {unicodedata.name(y, "?")}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
