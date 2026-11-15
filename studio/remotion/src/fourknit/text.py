"""Exact Arabic for the private knitted "Say each one 10 times" reel (FOUR-KNIT), cut out of authoritative sources, never typed.

    studio/.venv/bin/python -I studio/remotion/src/fourknit/text.py <job dir> [--write]

Sources (downloaded into <job>/knit/src, kept out of git):
  - quran.com API v4 `text_imlaei` (King Fahd Complex mushaf, imla'i spelling) and Tanzil "quran-simple" (api.alquran.cloud) for the
    three phrases that are word sequences of the Quran: SubhanAllah (23:91), Alhamdulillah (1:2), La ilaha illallah (37:35 and 47:19);
  - Sahih Muslim 2137a (sunnah.com, in-book Book 38 Hadith 16; the hadith-api file ara-muslim/5601 is the same text, SHA-256 of all
    74 words equal to sunnah.com's) for "Allahu Akbar" and for the hadith quoted in the captions.
Every phrase is sliced out of each source, the Quran sources must agree, and the slice is compared code point by code point with
texts.json. --write regenerates texts.json from the sources. Exit code 1 on any mismatch.
"""
import hashlib
import json
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
BOM, LRM, RLM = chr(0xFEFF), chr(0x200E), chr(0x200F)
WAQF = {chr(0x06DA), chr(0x06D6), chr(0x06D7)}
SUNNAH_SHA = '7d60a9fc960fac35dbb4ab4895c5f3f20a0ae22ea8f1db9e0fa625f23e5b41b6'   # sunnah.com/muslim:2137, all words, read 2026-11-15


def quran(key, first, n):
    """n words of one ayah from the word `first`, from quran.com imla'i and Tanzil simple; both must agree."""
    f = key.replace(':', '_')
    qc = json.loads((src / f'qc_{f}.json').read_text())['verse']['text_imlaei']
    tz = [e['text'] for e in json.loads((src / f'tz_{f}.json').read_text())['data'] if e['edition']['identifier'] == 'quran-simple'][0].lstrip(BOM)
    out = []
    for t in (qc, tz):
        w = [x for x in t.split() if x not in WAQF]
        i = w.index(first)
        out.append((' '.join(w[i:i + n]), i))
    assert out[0][0] == out[1][0], (key, out)
    return out[0][0], f'Quran {key}, words {out[0][1] + 1}-{out[0][1] + n} (quran.com text_imlaei = Tanzil quran-simple)'


words = [w.strip(LRM + RLM + '.,:"،') for w in json.loads((src / 'h_ara-muslim_5601.json').read_text())['hadiths'][0]['text'].split()]
words = [w for w in words if w]
assert hashlib.sha256(' '.join(words).encode()).hexdigest() == SUNNAH_SHA, 'hadith file differs from sunnah.com'
i = words.index('أَحَبُّ')
HADITH = ' '.join(words[i:i + 15])                                         # «... وَاللَّهُ أَكْبَرُ»
w = words[i + 13:i + 15]
assert w[0] == 'وَاللَّهُ', w
akbar = ' '.join([w[0][2:], w[1]])                                        # minus the conjunction waw and its fatha
tahlil = quran('37:35', 'لَا', 4)
assert tahlil[0] == quran('47:19', 'لَا', 4)[0]
SOURCES = {
    'sub': quran('23:91', 'سُبْحَانَ', 2),
    'hamd': quran('1:2', 'الْحَمْدُ', 2),
    'akbar': (akbar, 'Sahih Muslim 2137a (sunnah.com; in-book Book 38, Hadith 16), wallahu akbar minus the conjunction waw'),
    'tahlil': (tahlil[0], tahlil[1].replace('Quran 37:35', 'Quran 37:35 and 47:19')),
    'hadith': (HADITH, 'Sahih Muslim 2137a (sunnah.com), the first 15 words of the Prophet\'s words'),
}

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
# the captions file must quote the hadith and the four phrases exactly
cap = job / 'knit' / 'captions.txt'
if cap.exists():
    t = cap.read_text()
    for k in ('hadith', 'sub', 'hamd', 'akbar', 'tahlil'):
        ok = SOURCES[k][0] in t
        bad += not ok
        print(f'captions.txt quotes {k}: {"yes" if ok else "NO"}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
