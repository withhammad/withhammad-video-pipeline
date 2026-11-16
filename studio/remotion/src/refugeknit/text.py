"""Exact text for the private knitted "Make prayer your refuge" reel (REFUGE-KNIT), checked against sources, never from memory.

    studio/.venv/bin/python -I studio/remotion/src/refugeknit/text.py <job dir> [--write]     (needs fontTools)

THE AUDIO (DepKWqLtlcH, @hous_semai2719, 14.33 s) has NO words: no Quran, no recitation, no nasheed lyrics, no voiceover.
whisper.cpp large-v3-turbo (forced Arabic) returns only its known no-speech hallucination ("ترجمة نانسي قنقر"), Silero VAD finds
0.7 s of "speech" (a breath-like onset at 0.07 s), and faster-whisper large-v3 labels the clip «موسيقى» ("music") in Arabic
and in auto mode. The spectrum is one sustained melodic tone (fundamental ~280-330 Hz, harmonics to ~3 kHz, slow vibrato and
tremolo) with soft percussive ticks on the walking rhythm (footstep foley). So it is a wordless melodic bed (an instrument or
a hummed / synth vocal; that cannot be told apart for certain from the file) + footsteps. -14.0 LUFS, -7.3 dBTP.

ON SCREEN vs CAPTION: because the soundtrack is music (it may be instrumental), no Quran text is shown in the video, as in the
earlier knitted reels for her ("Grace of Allah": "Because the track is music, no Quran text appears in the video itself"). The
closing line on screen is our own plain sentence «وَفِي الصَّلَاةِ رَاحَتُكَ» ("and in prayer is your rest"), with no attribution.
Quran 2:45 and the hadith go in the caption; the door lintel stays a plain felt band. RefugeKnit.tsx has QURAN_ON_SCREEN = false;
set it true to show 2:45 as the closing line and the Basmala on the lintel (both checked below either way).

Text checks (all here, exit 1 on any failure):
  1-2. the hook = the reference's own caption, vocalised: «حين تُرهقك الحياة.. اجعل الصّلاة ملجأك وملاذك» (no attribution: it is
       a saying of the creator, not Quran, not hadith). Gate: the unvocalised lines equal the caption letters.
  3.   Quran 2:45, first clause «وَٱسْتَعِينُوا۟ بِٱلصَّبْرِ وَٱلصَّلَوٰةِ», cut from api.quran.com text_uthmani and found character for
       character in the tanzil.net Uthmani text (and alquran.cloud quran-uthmani); English Saheeh International.
  4.   the door lintel: Quran 1:1 (the Basmala) from api.quran.com text_uthmani; tanzil.net has the same letters and marks, it
       differs only by one U+0640 tatweel before the dagger alef in ٱلرَّحْمَـٰنِ (a typesetting stretch, not a letter or mark).
Caption only: Sunan Abi Dawud 4985 «يَا بِلاَلُ أَقِمِ الصَّلاَةَ أَرِحْنَا بِهَا» (sunnah.com, read in the browser: Sahih, al-Albani).
"""
import json
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
bad = 0
HARAKAT = set('ًٌٍَُِّْٰ')
CAPTION = 'حين تُرهقك الحياة.. اجعل الصّلاة ملجأك وملاذك'      # the reference's own Instagram caption (yt-dlp description)


def bare(s):
    return ''.join(c for c in unicodedata.normalize('NFC', s) if c not in HARAKAT)


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


HOOK = ['حِينَ تُرْهِقُكَ الْحَيَاةُ', 'اجْعَلِ الصَّلَاةَ مَلْجَأَكَ وَمَلَاذَكَ']
HOOK_EN = ['When life {exhausts} you…', 'make [prayer] your refuge and shelter']
REST = ('وَفِي الصَّلَاةِ رَاحَتُكَ', 'and in [prayer] is your [rest]')       # our own closing line (no attribution)
cap = ' '.join(bare(CAPTION).replace('..', ' ').split())
ok = ' '.join(bare(x) for x in HOOK) == cap
bad += not ok
print('hook (bare):', ' '.join(bare(x) for x in HOOK), '| caption (bare):', cap, '->', 'MATCH' if ok else 'MISMATCH')

# Quran 2:45 (on screen) and 1:1 (door)
tanzil = {tuple(l.split('|', 2)[:2]): l.split('|', 2)[2].strip() for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines()
          if l.count('|') >= 2}
qc = lambda k: json.loads((src / f'qc_{k}.json').read_text())['verses'][0]['text_uthmani']
q245 = qc('2_45').split(' ۚ ')[0]
tz = {e['edition']['identifier']: e['text'].lstrip('﻿') for e in json.loads((src / 'tz_2_45.json').read_text())['data']}
hits = [q245 in qc('2_45'), q245 in tanzil[('2', '45')], q245 in tz['quran-uthmani']]
bad += not (hits[0] and hits[1])
print(f'2:45 on screen «{q245}» ({cps(q245)})\n   quran.com {hits[0]}, tanzil.net {hits[1]}, alquran.cloud {hits[2]}')
en245 = 'And seek help through patience and prayer'
ok = tz['en.sahih'].startswith(en245)
bad += not ok
print('2:45 Saheeh International', 'found' if ok else 'NOT FOUND', '|', tz['en.sahih'])
b11 = qc('1_1')
ok = b11.replace('ـ', '') == tanzil[('1', '1')]
bad += not ok
print(f'1:1 door «{b11}»: equals tanzil.net except U+0640 tatweel:', ok, '| tatweels:', b11.count('ـ'))

# the hadith (caption only)
rec = (src / 'sunnah_abudawud_4985.txt').read_text(encoding='utf-8')
har = 'يَا بِلاَلُ أَقِمِ الصَّلاَةَ أَرِحْنَا بِهَا'
hen = 'O Bilal, call iqamah for prayer: give us comfort by it.'
for k, v in (('hadithAr', har), ('hadithEn', hen), ('grade', 'Sahih (Al-Albani)')):
    ok = v in rec
    bad += not ok
    print(k, 'found verbatim in the sunnah.com record' if ok else 'NOT FOUND')

out = {'hook': [{'ar': a, 'en': e} for a, e in zip(HOOK, HOOK_EN)], 'hookNote': 'the reference creator\'s own caption (no attribution)',
       'restAr': REST[0], 'restEn': REST[1],
       'quranAr': q245, 'quranEn': en245 + '.', 'quranRef': 'Quran 2:45 (Al-Baqarah)', 'basmala': b11, 'basmalaRef': 'Quran 1:1',
       'hadithAr': har, 'hadithEn': hen, 'hadithRef': 'Sunan Abi Dawud 4985 (Sahih, al-Albani), sunnah.com'}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
ok = json.loads(path.read_text()) == out
bad += not ok
print('texts.json', 'MATCH' if ok else 'DIFF (run with --write)')
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
shown = ''.join(HOOK) + REST[0] + q245 + b11
miss = sorted({c for c in shown if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers the on-screen Arabic:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
