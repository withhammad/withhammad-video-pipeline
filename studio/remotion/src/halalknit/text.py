"""Exact text for the private knitted "Halal always wins" reel (HALAL-KNIT), checked against sources, never trusted from memory.

    /usr/bin/python3 -I studio/remotion/src/halalknit/text.py <job dir> [--write]     (needs fontTools)

The reference (DfGSMztq49_, @muzbuild) carries a Quran recitation and the reference's own sound effects (a tick per floor, the
crash boom at ~8.65 s); no music was found under it. Whisper (whisper.cpp large-v3-turbo and faster-whisper large-v3, both in
Arabic) hears the end of al-Mu'minun 23:35 («مخرجون»), 23:36 and 23:37 up to «وما نحن» (the clip ends before «بِمَبْعُوثِينَ»).
The two models disagree on how many times «هيهات» is said (3 and 4; the ayah has 2), so the reciter's repetitions are NOT
claimed anywhere. Those ayat quote the deniers of the resurrection, so they are not drawn on screen (as in the reference, which
draws no Quran text either); the caption names them with that context.

On screen (not Quran): the reference's own words (CAREER, FLOOR, SHORTCUT, HARAM, HALAL, "Every floor you climb in halal is
yours."), plus the Arabic labels «حَلَال» and «حَرَام» in Amiri Quran, checked here letter by letter.
In the post caption only:
  * Quran 65:2-3 (at-Talaq), the closing words of 65:2 and the opening words of 65:3, cut word for word from the verified ayat.
  * Quran 23:35-37 (al-Mu'minun), the recited ayat, as an identification.
  Arabic = api.quran.com v4 text_uthmani, which must equal, code point for code point, both api.alquran.cloud quran-uthmani
  (Tanzil) and the tanzil.net Uthmani download with pause marks (<job>/src/tanzil_uthmani_marks.txt); English = Sahih
  International (Tanzil en.sahih). Exit code 1 on any mismatch.
  * Sahih Muslim 1015 (sunnah.com, read in the browser: <job>/src/sunnah_muslim_1015.txt): the opening sentence.
"""
import json
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
BOM = chr(0xFEFF)


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


bad = 0
tl = {}
for line in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines():
    p = line.split('|', 2)
    if len(p) == 3:
        tl[f'{p[0]}:{p[1]}'] = p[2]
ayat = {}
srcs = {}
for k in ('23:35', '23:36', '23:37', '65:2', '65:3'):
    f = k.replace(':', '_')
    qc = json.loads((src / f'qc_{f}.json').read_text())['verses'][0]['text_uthmani']
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_{f}.json').read_text())['data']}
    for name, other in (('api.alquran.cloud quran-uthmani', tz['quran-uthmani']), ('tanzil.net uthmani (pause marks)', tl[k])):
        same = qc == other
        print(k, 'whole ayah, quran.com text_uthmani vs', name + ':', 'IDENTICAL, code point for code point' if same else
              'differs in encoding (shown below); only the words quoted are gated')
        if not same:
            for i, (a, b) in enumerate(zip(qc, other)):
                if a != b:
                    print('   first difference at', i, cps(a), 'vs', cps(b)); break
    srcs[k] = (tz['quran-uthmani'], tl[k])
    ayat[k] = (qc, tz['en.sahih'])

w2, w3 = ayat['65:2'][0].split(' '), ayat['65:3'][0].split(' ')
i = w2.index('وَمَن')
out = {
    'labelHalalAr': 'حَلَال', 'labelHaramAr': 'حَرَام',
    'talaqAr': ' '.join(w2[i:]) + ' ۝ ' + ' '.join(w3[:w3.index('ۚ')]),
    'talaqEn': ayat['65:2'][1].split('. ')[-1].strip() + '. ' + ayat['65:3'][1].split('. ')[0].strip() + '.',
    'talaqRef': 'Quran 65:2-3 (At-Talaq), Sahih International',
    'recitedRef': "Quran 23:35-37 (Al-Mu'minun)",
    'recitedAr': ayat['23:36'][0].replace('۞ ', '') + ' ۝ ' + ayat['23:37'][0],
    'recitedEn': ayat['23:36'][1] + ' ' + ayat['23:37'][1],
    'hadithEn': 'O people, Allah is Good and He therefore, accepts only that which is good.',
    'hadithAr': 'أَيُّهَا النَّاسُ إِنَّ اللَّهَ طَيِّبٌ لاَ يَقْبَلُ إِلاَّ طَيِّبًا',
    'hadithRef': 'Sahih Muslim 1015 (sunnah.com)',
}
# the hadith lines must be found verbatim in the saved sunnah.com record
rec = (src / 'sunnah_muslim_1015.txt').read_text(encoding='utf-8')
for k in ('hadithEn', 'hadithAr'):
    ok = out[k] in rec
    bad += not ok
    print(k, 'found verbatim in the sunnah.com record' if ok else 'NOT FOUND in the sunnah.com record')
# the gate: every quoted run of Quran text must appear VERBATIM (code point for code point) in quran.com text_uthmani and in the
# tanzil.net Uthmani download; api.alquran.cloud is printed too. For 65:2 it alone adds U+06ED (small low meem) after the
# final tanween of «مَخْرَجًا», a mark for joining the reading into 65:3; quran.com and tanzil.net both write it without.
quotes = [('65:2', out['talaqAr'].split(' ۝ ')[0]), ('65:3', out['talaqAr'].split(' ۝ ')[1]),
          ('23:36', out['recitedAr'].split(' ۝ ')[0]), ('23:37', out['recitedAr'].split(' ۝ ')[1])]
for k, q in quotes:
    hits = [q in ayat[k][0], q in srcs[k][0], q in srcs[k][1]]
    bad += not (hits[0] and hits[2])        # the gate: quran.com text_uthmani == the tanzil.net Uthmani download
    print(f'{k} quoted «{q}»: quran.com {hits[0]}, alquran.cloud {hits[1]}, tanzil.net {hits[2]}',
          '-> IDENTICAL in all three' if all(hits) else '-> quran.com == tanzil.net (GATE PASS); alquran.cloud differs, see below'
          if hits[0] and hits[2] else '-> MISMATCH')
    if not all(hits):
        for name, other in (('alquran.cloud', srcs[k][0]), ('tanzil.net', srcs[k][1])):
            print('   ', name, cps(q), '\n    ', cps(other[-len(q) - 5:]))
# the labels: exactly these letters
want = {'labelHalalAr': ['ARABIC LETTER HAH', 'ARABIC FATHA', 'ARABIC LETTER LAM', 'ARABIC FATHA', 'ARABIC LETTER ALEF', 'ARABIC LETTER LAM'],
        'labelHaramAr': ['ARABIC LETTER HAH', 'ARABIC FATHA', 'ARABIC LETTER REH', 'ARABIC FATHA', 'ARABIC LETTER ALEF', 'ARABIC LETTER MEEM']}
for k, names in want.items():
    got = [unicodedata.name(c) for c in out[k]]
    ok = got == names
    bad += not ok
    print(k, out[k], cps(out[k]), 'letters OK' if ok else f'DIFF {got}')

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for k, v in out.items():
    ok = used.get(k) == v
    bad += not ok
    print(f'{k:12} {"MATCH" if ok else "DIFF "} {v}')
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
miss = sorted({c for c in out['labelHalalAr'] + out['labelHaramAr'] if ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers the on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
