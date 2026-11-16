"""Exact text for the private knitted "The sea split in two" reel (SEA-KNIT), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/seaknit/text.py <job dir> [--write]     (needs fontTools)

The reference (Dc5FJDboAsg, @m_theaicreator) carries NO recitation: its 13.86 s track is wordless music with impact hits.
faster-whisper large-v3 with voice-activity detection finds no speech at all; without VAD it returns only its usual
silence hallucinations («اشتركوا في القناة» "subscribe to the channel", "Thanks for watching!"), and its language detection
gives no language above 0.38 (knit/src/whisper_large.json). So nothing is laid over the audio, and the ayah is shown as text.

The reference caption quotes Quran ash-Shu'ara 26:63 in Arabic and then an English line that is NOT its translation: "But lift
thou up thy rod, and stretch out thine hand over the sea, and divide it: and the children of Israel shall go on dry ground
through the midst of the sea" is the Bible, Exodus 14:16 (King James Version; bible-api.com, knit/src/kjv_exodus_14_16.json).
This reel uses a named Quran translation instead: Sahih International.

On screen: Quran 26:63 in two parts, split at its own waqf mark (ۖ, after «ٱلْبَحْرَ»):
  part 1  «فَأَوْحَيْنَآ إِلَىٰ مُوسَىٰٓ أَنِ ٱضْرِب بِّعَصَاكَ ٱلْبَحْرَ ۖ»  /  Then We inspired to Moses, "Strike with your staff the sea,"
  part 2  «فَٱنفَلَقَ فَكَانَ كُلُّ فِرْقٍ كَٱلطَّوْدِ ٱلْعَظِيمِ ۝٦٣»  /  and it parted, and each portion was like a great towering mountain.
Arabic = quran.com text_uthmani (api.quran.com v4, knit/src/qc_26_63.json), verbatim, code point for code point, checked against
Tanzil quran-uthmani (api.alquran.cloud, knit/src/tz_26_63.json): the letters and harakat are identical; Tanzil adds one small
high meem (U+06E2) after the tanween of «فِرْقٍ» (iqlab/ikhfa marker), which Amiri Quran draws as a visible meem the Madinah
mushaf does not print there, so the quran.com text is the one shown. English = Sahih International (Tanzil en.sahih), the same
text as quran.com translation 20. Exit code 1 on any mismatch.
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
BOM, SMALL_MEEM = chr(0xFEFF), chr(0x06E2)
IND = '٠١٢٣٤٥٦٧٨٩'
INVIS = re.compile('[⁦-⁩‎‏‪-‮﻿\t]')


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


bad = 0
tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / 'tz_26_63.json').read_text())['data']}
qv = json.loads((src / 'qc_26_63.json').read_text())['verse']
assert qv['verse_key'] == '26:63', qv['verse_key']
qc, tzu = qv['text_uthmani'], tz['quran-uthmani']
same_letters = qc == tzu.replace(SMALL_MEEM, '')
bad += not same_letters
print('26:63 quran.com text_uthmani vs Tanzil quran-uthmani:',
      'SAME LETTERS AND HARAKAT' if same_letters else 'DIFF', f'(Tanzil has {tzu.count(SMALL_MEEM)} extra small meem U+06E2)')
if not same_letters:
    for i, (a, b) in enumerate(zip(qc, tzu)):
        if a != b:
            print('   at', i, cps(a), 'vs', cps(b))
            break
W = qc.split(' ')
k = W.index('ۖ') + 1                                # split after the waqf mark
ar1, ar2 = ' '.join(W[:k]), ' '.join(W[k:])
assert ar1 + ' ' + ar2 == qc
en = tz['en.sahih']
q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
en_same = q20 == en
bad += not en_same
print('Sahih International, Tanzil en.sahih vs quran.com translation 20:', 'SAME' if en_same else f'DIFF\n   {en}\n   {q20}')
cut = en.index('," ') + 2
en1, en2 = en[:cut], en[cut + 1:]
assert en1 + ' ' + en2 == en and en1.endswith('sea,"') and en2.startswith('and it parted'), (en1, en2)

out = {'key': '26:63', 'surah': "Ash-Shu'ara", 'ar': qc, 'ar1': ar1, 'ar2': ar2, 'end': '۝' + ''.join(IND[int(d)] for d in '63'),
       'en': en, 'en1': en1, 'en2': en2, 'ref': "Quran 26:63 · Ash-Shu'ara · Sahih International"}
# the post caption also quotes the two ayat before it, in English only (Sahih International, Tanzil = quran.com 20)
for n in (61, 62):
    t_ = {e['edition']['identifier']: e['text'] for e in json.loads((src / f'tz_26_{n}.json').read_text())['data']}['en.sahih']
    q_ = json.loads((src / f'qc_26_{n}.json').read_text())['verse']
    q_ = re.sub(r'<sup[^>]*>.*?</sup>', '', q_['translations'][0]['text'])
    bad += q_ != t_
    print(f'26:{n} Sahih International, Tanzil vs quran.com 20:', 'SAME' if q_ == t_ else 'DIFF')
    out[f'en{n}'] = t_

# the reference caption: its Arabic is 26:63 (simple spelling), its English is the Bible (Exodus 14:16, KJV)
cap = INVIS.sub('', json.loads((job / 'source.info.json').read_text())['description']).strip()
cap_ar, cap_en = [p.strip() for p in cap.split('\n\n')[:2]]
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')
norm = lambda s: STRIP.sub('', s).replace('ٱ', 'ا').replace(' ', '')
ar_ok = norm(cap_ar) == norm(tz['quran-simple'])
bad += not ar_ok
print('reference caption Arabic = 26:63 (letters, without marks):', 'YES' if ar_ok else 'NO')
kjv = json.loads((src / 'kjv_exodus_14_16.json').read_text())
kjv_text = ' '.join(kjv['text'].split())
is_bible = kjv_text.rstrip('.') == cap_en
bad += not is_bible
print(f'reference caption English = {kjv["reference"]} ({kjv["translation_name"]}), not the Quran:', 'YES' if is_bible else 'NO')
print('   ', cap_en)

# the audio: no recitation
wh = json.loads((src / 'whisper_large.json').read_text())
no_speech = wh['ar_vad'] == [] and wh['detect']['prob'] < 0.5
bad += not no_speech
print('Whisper large-v3: speech with VAD (ar):', len(wh['ar_vad']), 'segments; language detection', wh['detect']['lang'],
      round(wh['detect']['prob'], 3), '-> NO RECITATION' if no_speech else '-> CHECK BY EAR')
print('   without VAD (hallucinations on music):', [s[2].strip() for s in wh['ar_noprompt']], [s[2].strip() for s in wh['auto']])

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
for key, v in out.items():
    ok = used.get(key) == v
    bad += not ok
    print(f'{key:5} {"MATCH" if ok else "DIFF "} {v}')
    if any('؀' <= c <= 'ۿ' for c in v):
        print('      ', cps(v))
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf'))
plain = not {'COLR', 'CPAL', 'SVG ', 'CBDT', 'sbix'} & set(font.keys())
bad += not plain
cmap = font.getBestCmap()
allar = out['ar'] + out['end']
miss = sorted({c for c in allar if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
for c in sorted(set(allar) - {' '}):
    assert unicodedata.name(c).startswith('ARABIC'), c
print('Amiri Quran plain build (no COLR/CPAL/SVG):', 'yes' if plain else 'NO', '; covers every code point:', 'yes' if not miss else f'NO {cps("".join(miss))}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
