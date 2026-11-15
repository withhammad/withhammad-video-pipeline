"""Exact Arabic for the private knitted "La ilaha illallah wahdahu x10" dhikr reel (TAHLIL-KNIT), cut out of sunnah.com, never typed.

    studio/.venv/bin/python -I studio/remotion/src/tahlilknit/text.py <job dir> [--write]

Sources (saved once into <job>/knit/src, kept out of git; read in the built-in browser because curl meets a Cloudflare challenge):
  - sunnah.com, Sahih Muslim 2693 (in-book Book 48, Hadith 40), DOM .arabic_hadith_full: the code points from «مَنْ قَالَ» to
    «إِسْمَاعِيلَ» (sunnah_muslim_2693_excerpt.json, hex);
  - dorar.net, the same hadith (Muslim 2693, graded sahih, takhrij al-Bukhari 6404 «باختلاف يسير»), partly voweled: a second witness for
    the letters (dorar_2693_excerpt.json); compared with all harakat removed and alef maksura / ya folded (sunnah.com spells شَىْءٍ
    with a dotless ya, the classical spelling, dorar شيءٍ).
Every on-screen string is a whole-word slice of the sunnah.com text; the three dhikr lines join back into the dhikr exactly.
--write regenerates texts.json from the sources. Exit 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
src = job / 'knit' / 'src'
here = Path(__file__).resolve().parent

sun = ''.join(chr(int(h, 16)) for h in json.loads((src / 'sunnah_muslim_2693_excerpt.json').read_text())['hex'].split())
dor = ''.join(chr(int(h, 16)) for h in json.loads((src / 'dorar_2693_excerpt.json').read_text())['hex'].split())
w = sun.split(' ')
assert len(w) == 29 and w[0] == 'مَنْ' and w[-1] == 'إِسْمَاعِيلَ', (len(w), w[:2], w[-1])
SOURCES = {
    'dhikr': (' '.join(w[2:19]), 'Sahih Muslim 2693, sunnah.com, words 3-19 (the dhikr)'),
    'line1': (' '.join(w[2:10]), 'words 3-10, line 1 on screen'),
    'line2': (' '.join(w[10:14]), 'words 11-14, line 2'),
    'line3': (' '.join(w[14:19]), 'words 15-19, line 3'),
    'ten': (' '.join(w[19:21]), 'words 20-21, «ten times»'),
    'reward': (' '.join(w[21:29]), 'words 22-29, the reward'),
    'hadith': (sun, 'the whole saying, words 1-29 (the Arabic caption)'),
}
assert ' '.join(SOURCES[k][0] for k in ('line1', 'line2', 'line3')) == SOURCES['dhikr'][0]
VOICE = '[calm] ' + ' ... '.join([SOURCES['dhikr'][0]] * 3)          # one HeyGen take: the dhikr three times, "..." between
# two common phrases (not hadith or Quran text): the reference's own «taqabbal Allah minna wa minkum» at 10 and the end card's
# «don't forget us in your du'a»; pinned here by code point so a stray edit shows
COMMON = {'taqabbal': '062A 0642 0628 0651 0644 0020 0627 0644 0644 0647 0020 0645 0646 0627 0020 0648 0645 0646 0643 0645',
          'dua_ask': '0644 0627 0020 062A 0646 0633 0648 0646 0627 0020 0645 0646 0020 062F 0639 0627 0626 0643 0645'}
EXTRA = {'voice_script': VOICE, **{k: ''.join(chr(int(h, 16)) for h in v.split()) for k, v in COMMON.items()}}


def letters(s):
    s = re.sub('[ً-ْٰـ]', '', unicodedata.normalize('NFC', s))
    return re.sub('[^ء-ي ]', '', s.replace('ى', 'ي')).split()


# second witness: dorar.net, letters only
d, sw = letters(dor), letters(sun)
print('dorar.net letters', 'SAME as sunnah.com' if d == sw else 'DIFFERENT', f'({len(d)} words)')
bad = d != sw
if bad:
    for a, b in zip(d, sw):
        if a != b:
            print('   dorar', a, ' sunnah', b)

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps({**{k: v[0] for k, v in SOURCES.items()}, **EXTRA}, ensure_ascii=False, indent=2) + '\n')
used = json.loads(path.read_text())
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
same = used['voice_script'] == VOICE
bad += not same
print(f'voice   {"MATCH" if same else "DIFF "} the HeyGen script = [calm] + the dhikr x3 joined by " ... "')
for k in COMMON:
    same = used[k] == EXTRA[k]
    bad += not same
    print(f'{k:8} {"MATCH" if same else "DIFF "} {used[k]}   <- common phrase pinned by code point (not hadith text)')
print('ALL MATCH' if not bad else f'{int(bad)} MISMATCH(ES)')
sys.exit(1 if bad else 0)
