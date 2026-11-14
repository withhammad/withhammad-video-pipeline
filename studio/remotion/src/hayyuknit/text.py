"""Exact on-screen text for the private knitted "Ya Hayyu Ya Qayyum" reel (HAYYU-KNIT), cut out of sources, never typed.

    studio/.venv/bin/python -I studio/remotion/src/hayyuknit/text.py <job dir> [--write]

Arabic (the dua the reference voice says, 0.24-3.08 s): sliced out of Jami' at-Tirmidhi 3524 as published on sunnah.com
(<job>/knit/src/sunnah_tirmidhi_3524_dua.txt, copied code point by code point from the page) and checked against the full
hadith in the hadith-api dataset (fawazahmed0, ara-tirmidhi/3524). sunnah.com spells the final ya of حَىُّ with an undotted
alef maksura (U+0649, old print style); it is written here with the dotted ya (U+064A), as the same word is spelled in
the King Fahd Complex imla'i text of Quran 2:255 (quran.com text_imlaei) and Tanzil quran-simple: الْحَيُّ الْقَيُّومُ. Both
names are checked against both Quran texts with the article removed. That one code point is the only difference from
sunnah.com, and it is reported below.

Urdu (the reference voice, 3.42-9.90 s): the reference's own on-screen line, which the voice says word for word. It is
kept in texts.json and checked word by word against the Whisper (medium, ur) read-back of the 44.1 kHz source audio in
<job>/knit/src/whisper_ur.txt; the only accepted difference is Whisper's misspelling فریات for فریاد (the reference's
on-screen text has فریاد).
Exit code 1 on any mismatch. --write regenerates texts.json's Arabic keys from the sources.
"""
import json
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent
YA, MAKSURA = chr(0x064A), chr(0x0649)


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


# --- Arabic ------------------------------------------------------------------------------------------------------------
sunnah = (src / 'sunnah_tirmidhi_3524_dua.txt').read_text().strip()
full = json.loads((src / 'h_ara-tirmidhi_3524.json').read_text())['hadiths'][0]['text']
assert sunnah in full, 'sunnah.com slice is not in the hadith-api text of Tirmidhi 3524'
w = sunnah.split()
assert len(w) == 6 and w[1].count(MAKSURA) == 1, w
w[1] = w[1].replace(MAKSURA, YA)

qc = json.loads((src / 'qc_2_255.json').read_text())['verse']['text_imlaei'].split()
tz = [e['text'] for e in json.loads((src / 'tz_2_255.json').read_text())['data'] if e['edition']['identifier'] == 'quran-simple'][0]
tz = tz.lstrip(chr(0xFEFF)).split()
AL = 'ا' + 'ل' + chr(0x0652)                                   # alif, lam, sukun: الْ
for name, word in (('hayy', w[1]), ('qayyum', w[3])):
    for label, words in (('quran.com imlaei 2:255', qc), ('Tanzil simple 2:255', tz)):
        hits = [x[len(AL):] for x in words if x.startswith(AL) and unicodedata.normalize('NFC', x[len(AL):]) == unicodedata.normalize('NFC', word)]
        assert hits, (name, label, cps(word))
        raw = hits[0] == word
        print(f'{name:7} {word}  == {label} "{AL}{hits[0]}" minus the article ({"same code points" if raw else "same after NFC (mark order differs)"})')

SOURCES = {
    'dua1': ' '.join(w[:4]),
    'dua2': ' '.join(w[4:]),
    'words': w,
}

# --- Urdu --------------------------------------------------------------------------------------------------------------
path = here / 'texts.json'
if '--write' in sys.argv:
    cur = json.loads(path.read_text()) if path.exists() else {}
    cur.update(SOURCES)
    path.write_text(json.dumps(cur, ensure_ascii=False, indent=2) + '\n')
used = json.loads(path.read_text())
bad = 0
for k, want in SOURCES.items():
    same = used[k] == want
    bad += not same
    print(f'{k:6} {"MATCH" if same else "DIFF "} {used[k]}')
    if isinstance(want, str):
        print('       ' + cps(want))
diff = [(n, a, b) for n, (a, b) in enumerate(zip(sunnah, ' '.join(w))) if a != b]
print('vs sunnah.com Tirmidhi 3524:', 'identical' if not diff else '; '.join(f'at {n}: U+{ord(a):04X} {unicodedata.name(a)} -> U+{ord(b):04X} {unicodedata.name(b)}' for n, a, b in diff))
assert len(diff) == 1 and len(sunnah) == len(' '.join(w))

whisper = (src / 'whisper_ur.txt').read_text().split()
ur = ' '.join(used['ur'] + [used['ameen']])
mine = [x.strip('،') for x in ur.split()]
heard = [x.replace('فریات', 'فریاد') for x in whisper]
same = mine == heard
bad += not same
print('urdu  ', 'MATCH' if same else 'DIFF ', ur)
print('       whisper medium (ur):', ' '.join(whisper))
if not same:
    for n, (a, b) in enumerate(zip(mine, heard)):
        if a != b: print(f'       word {n}: used {a} ({cps(a)}) vs heard {b} ({cps(b)})')
for s in used['ur'] + [used['ameen']]:
    assert all(unicodedata.name(c).startswith(('ARABIC', 'SPACE')) for c in s), s
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
