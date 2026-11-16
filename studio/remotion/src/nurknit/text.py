"""Exact text for the private knitted "Light upon light" reel (NUR-KNIT), cut out of sources, never typed from memory.

    studio/.venv/bin/python -I studio/remotion/src/nurknit/text.py <job dir> [--write]     (needs fontTools)

THE AUDIO (DfrckxNMKVN, @ruwaq.co, 46.41 s, 96 kHz stereo, -14.1 LUFS, -4.1 dBTP) is a Quran RECITATION of the whole of
an-Nur 24:35, one male reciter, from «ٱللَّهُ نُورُ» to «بِكُلِّ شَىْءٍ عَلِيمٌ», then the reverb tail (43-46.4 s). whisper.cpp
large-v3-turbo (Arabic) returns the 48 words of the ayah in order, one for one (it spells دُرِّىٌّ as «ذري» and hears غَرْبِيَّةٍ as
«وردية»: transcription slips, the count and order match). No nasheed lyrics, no voiceover, no beat or percussion. The level
never drops below about -23 dBFS between phrases and the tail decays smoothly at about 12 dB/s into silence, i.e. a long hall
reverb on the voice; no separate instrument line could be isolated (no stem separator on this Mac), so a very soft pad under the
voice cannot be ruled out 100 % from the file alone.
The reciter is not named anywhere in the reference (yt-dlp: no track/artist, the caption names none) -> not attributed.
The track is used untouched (no cut, no stretch, no pitch change); nothing is laid over it. Because the soundtrack is the
recitation itself (not music), the ayah is shown on screen word by word, as the reference does.

Checks (exit 1 on any failure):
  1. api.quran.com text_uthmani for 24:35 == the tanzil.net Uthmani line, code point for code point.
  2. every on-screen card is a contiguous cut of that text (waqf marks kept at the card ends where the mushaf has them).
  3. the 48 recited words, card by card, equal the 48 words of the ayah in order (the word clock comes from Whisper).
  4. English: Saheeh International (quran.com translation 20, footnote markers removed, Allāh -> Allah); the card pieces joined
     must give back the whole translation; alquran.cloud en.sahih is the second copy (differs only in "lamp;" vs "lamp,").
  5. caption hadith: Sahih Muslim 1893a «مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ», read on sunnah.com.
  6. Amiri Quran has a glyph for every on-screen code point.
"""
import json
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
bad = 0


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


qv = json.loads((src / 'qc_24_35.json').read_text())['verse']
qa = qv['text_uthmani']
tz = [l.split('|', 2)[2].strip() for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('24|35|')][0]
ok = qa == tz
bad += not ok
print('1. quran.com text_uthmani == tanzil.net Uthmani 24:35:', ok, f'({len(qa)} code points)')

words = [w for w in qa.split(' ') if len(w) > 1]          # drop ۞ and the stand-alone waqf signs
wh = [s for s in json.loads((job / 'whisper_words.json').read_text())['transcription'] if s['text'].strip()]
ok = len(words) == len(wh) == 48
bad += not ok
print('3. recited words:', len(wh), '| ayah words:', len(words), '->', 'MATCH' if ok else 'MISMATCH')

# the cards: [first word index, last word index (incl.), the waqf sign the mushaf has after the last word or '']
CARDS = [(0, 3, 'ۚ'), (4, 8, 'ۖ'), (9, 11, 'ۖ'), (12, 15, ''), (16, 19, ''), (20, 24, ''), (25, 31, 'ۚ'), (32, 34, 'ۗ'), (35, 39, 'ۚ'),
         (40, 43, 'ۗ'), (44, 47, '')]
tr = re.sub(r'<sup[^>]*>.*?</sup>', '', qv.get('translations', [{}])[0].get('text', '')).replace('Allāh', 'Allah') if qv.get('translations') else ''
if not tr:
    tr = json.loads((src / 'qc_24_35.json').read_text())['verse']['translations'][0]['text']
EN = ['Allah is the *Light* of the heavens and the earth.', 'The example of His light is like a *niche* within which is a *lamp*;',
      'the lamp is within *glass*,', 'the glass as if it were a pearly [white] *star*', 'lit from [the oil of] a blessed *olive tree*,',
      'neither of the east nor of the west,', 'whose oil would almost *glow* even if untouched by fire.', '*Light upon light.*',
      'Allah *guides* to His light whom He wills.', 'And Allah presents examples for the *people*,', 'and Allah is *Knowing* of all things.']
plain = lambda s: s.replace('*', '')               # *word* = the gold key word; [..] are Saheeh International's own brackets
joined = ' '.join(plain(e) for e in EN)
ok = joined == tr
bad += not ok
print('4. English cards joined == Saheeh International (quran.com 20):', ok)
if not ok:
    print('   cards:', joined, '\n   q.com:', tr)
ac = {e['edition']['identifier']: e['text'] for e in json.loads((src / 'tz_24_35.json').read_text())['data']}
print('   alquran.cloud en.sahih differs only at "lamp;"/"lamp,":', ac['en.sahih'] == tr.replace('lamp;', 'lamp,'))
bad += ac['en.sahih'] != tr.replace('lamp;', 'lamp,')

out_cards = []
for i, (a, b, mark) in enumerate(CARDS):
    ws = words[a:b + 1]
    ar = ' '.join(ws) + (' ' + mark if mark else '')
    cut = ar in qa
    bad += not cut
    t0, t1 = wh[a]['offsets']['from'] / 1000, wh[b]['offsets']['to'] / 1000
    out_cards.append({'ar': ws, 'mark': mark, 'w': [[round(wh[k]['offsets']['from'] / 1000, 2), round(wh[k]['offsets']['to'] / 1000, 2)] for k in range(a, b + 1)],
                      't0': round(t0, 2), 't1': round(t1, 2), 'en': EN[i]})
    print(f'2. card {i + 1:2d} {t0:5.2f}-{t1:5.2f} cut of the ayah: {cut} «{ar}»')

rec = (src / 'sunnah_muslim_1893a.txt').read_text(encoding='utf-8')
HAR, HEN = 'مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ', 'One who guides to something good has a reward similar to that of its doer.'
for k, v in (('hadith ar', HAR), ('hadith en', HEN), ('ref', 'Sahih Muslim 1893a')):
    ok = v in rec
    bad += not ok
    print('5.', k, 'found verbatim in the sunnah.com record' if ok else 'NOT FOUND')

out = {'cards': out_cards, 'ayahRef': 'Surah An-Nur 24:35', 'translation': 'Saheeh International', 'full': qa, 'fullEn': tr,
       'hadithAr': HAR, 'hadithEn': HEN, 'hadithRef': 'Sahih Muslim 1893a (sunnah.com)',
       'endEn': ['Light comes to you.', 'And you can *pass it on*.']}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
ok = path.exists() and json.loads(path.read_text()) == out
bad += not ok
print('texts.json', 'MATCH' if ok else 'DIFF (run with --write)')
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
shown = ''.join(''.join(c['ar']) + c['mark'] for c in out_cards)
miss = sorted({c for c in shown if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('6. Amiri Quran covers the on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
