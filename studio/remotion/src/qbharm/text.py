"""Exact on-screen text for the private Quran Beat "Has harm touched you?" reel (QB-HARM), cut out of sources, never typed.

    /usr/bin/python3 studio/remotion/src/qbharm/text.py <job dir> [--write]     (needs fontTools)

The reference (DfsFqEpxneY, @hous_semai2719) captions its reel «مسّـك الضّـر؟ اسمـعها فقـط، لعلّـك ترتـاح» ("Has harm touched
you? Just listen, maybe you'll find rest"). That wording echoes the dua of Ayyub (AS), al-Anbiya 21:83 «أَنِّى مَسَّنِىَ ٱلضُّرُّ»,
but the audio is NOT that ayah. The recitation itself (faster-whisper large-v3 read-backs, below) is Yunus 10:107, its first
half: «وَإِن يَمْسَسْكَ ٱللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُۥٓ إِلَّا هُوَ ۖ وَإِن يُرِدْكَ بِخَيْرٍ فَلَا رَآدَّ لِفَضْلِهِۦ ۚ», stopping at the
waqf sign ۚ after «لِفَضْلِهِۦ». (al-An'am 6:17 opens with the same words but its second half is «وَإِن يَمْسَسْكَ بِخَيْرٍ فَهُوَ
عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ»; the reciter says «يُرِدْكَ بِخَيْرٍ فَلَا رَآدَّ لِفَضْلِهِۦ», which only 10:107 has.)

The reference creator's trim (as recorded, left untouched): the recording opens with 1.4 s of silence and the voice starts on
«إِن»; the opening «وَ» of «وَإِن» is not heard (large-v3 writes «إِن» even when prompted with the full ayah starting «وَإِن»;
the spectrogram shows a front vowel /i/ at the onset, no /w/). The voice stops sharply at 26.25 s at the end of «لِفَضْلِهِۦ»
(the ۚ waqf), the file then ends. On screen the ayah's words are shown as written in the mushaf (with «وَ»): the Quran text
is never cut to fit a recording.

Sources, downloaded once into <job>/src (kept out of git):
  tz_10_107.json  api.alquran.cloud (the Tanzil texts): quran-uthmani, quran-simple, en.sahih
  qc_10_107.json  api.quran.com v4 verses/by_key/10:107: text_uthmani, words, translation 20 (Sahih International)
  tz_6_17.json, qc_6_17.json  the look-alike ayah, to rule it out
  whisper_large_{noprompt,prompted}.json  faster-whisper large-v3 (ar) read-backs of the whole reference audio, word level
  whisper_win_start{,_prompted}.json  large-v3 read-backs of the first 3.6 s (the opening «وَ» question)

Arabic on screen: quran.com verse text_uthmani, verbatim, split at word boundaries into the reciter's four phrases (joined
with single spaces they give back the recited part of the ayah exactly). Checked against Tanzil quran-uthmani: letters and
harakat identical; Tanzil adds a small low meem (U+06E2) to the tanween of «بِضُرٍّۢ» and «بِخَيْرٍۢ» (iqlab/ikhfa marks), which
Amiri Quran draws as a visible mark the Madinah mushaf does not print there, so the quran.com text is the one shown.
English: Sahih International (Tanzil en.sahih), cut at the same phrase boundaries. quran.com translation 20 is the same
text, spelling Allah with a macron ("Allāh").
Exit code 1 on any mismatch.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
BOM, TATWEEL, MEEMS = chr(0xFEFF), chr(0x0640), {chr(0x06ED), chr(0x06E2)}


def cps(s):
    return ' '.join(f'U+{ord(c):04X}' for c in s)


def load(k):
    f = k.replace(':', '_')
    tz = {e['edition']['identifier']: e['text'].lstrip(BOM) for e in json.loads((src / f'tz_{f}.json').read_text())['data']}
    qv = json.loads((src / f'qc_{f}.json').read_text())['verse']
    assert qv['verse_key'] == k
    return tz, qv


# the reciter's phrases on the verse text split at spaces (the waqf signs ۖ ۚ stand after a space, as their own token)
PHRASES = [
    ('A', 0, 4, 'And if Allah should touch you with adversity,'),
    ('B', 4, 10, 'there is no remover of it except Him;'),
    ('C', 10, 13, 'and if He intends for you good,'),
    ('D', 13, 17, 'then there is no repeller of His bounty.'),
]
RECITED_WORDS = 17          # tokens 0-16: up to and including the ۚ after «لِفَضْلِهِۦ»

bad = 0
tz, qv = load('10:107')
qc, tzu, en = qv['text_uthmani'], tz['quran-uthmani'], tz['en.sahih']
same = qc.replace(TATWEEL, '') == ''.join(c for c in tzu if c not in MEEMS)
bad += not same
print(f'10:107 Uthmani quran.com vs Tanzil: {"SAME LETTERS AND HARAKAT" if same else "DIFF"} '
      f'(quran.com tatweel x{qc.count(TATWEEL)}, Tanzil small meem x{sum(tzu.count(m) for m in MEEMS)})')
q20 = re.sub(r'<sup[^>]*>.*?</sup>', '', [t for t in qv['translations'] if t['resource_id'] == 20][0]['text'])
en_same = q20.replace('Allāh', 'Allah').rstrip('.') == en.rstrip('.')
bad += not en_same
print('      Sahih International Tanzil vs quran.com 20:', 'SAME (quran.com spells Allāh)' if en_same else 'DIFF: ' + q20)
W = qc.split(' ')
ar_join = ' '.join(' '.join(W[a:b]) for _, a, b, _ in PHRASES)
en_join = ' '.join(p[3] for p in PHRASES)
ok = ar_join == ' '.join(W[:RECITED_WORDS]) and en.startswith(en_join.rstrip('.')) and W[RECITED_WORDS - 1] == 'ۚ'
bad += not ok
print(f'      phrases rejoin to the recited part (Arabic, up to the ۚ) and to the start of the English: {"YES" if ok else "NO"}')
print('      the part not recited:', ' '.join(W[RECITED_WORDS:]))
out = {'ayah': {'key': '10:107', 'surah': 'Yunus', 'ar': qc, 'en': en, 'recited': ' '.join(W[:RECITED_WORDS])}, 'phrases': []}
SIMPLE = tz['quran-simple'].split(' ')
for pid, a, b, e in PHRASES:
    out['phrases'].append({'id': pid, 'key': '10:107', 'ar': ' '.join(W[a:b]), 'en': e, 'simple': ' '.join(SIMPLE[a:b])})

# the look-alike 6:17 differs after «هُوَ ۖ وَإِن»
tz6, qv6 = load('6:17')
W6 = qv6['text_uthmani'].split(' ')
print('6:17 shares the first', next(i for i, (x, y) in enumerate(zip(W, W6)) if x != y), 'tokens, then reads', ' '.join(W6[11:13]),
      '(10:107 reads', ' '.join(W[11:13]) + ')')

path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')

# --- the recitation against the text ---------------------------------------------------------------------------------------
STRIP = re.compile('[ً-ٰٟۖ-ۭـ]')


def norm(s):
    s = STRIP.sub('', s)
    return s.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ء': '', 'ة': 'ه'}))


text = [norm(w) for p in out['phrases'] for w in p['simple'].split(' ') if norm(w)]
as_recorded = ['ان'] + text[1:]           # the recording opens on «إِن», without the «وَ» (see above)
assert text[0] == 'وان'
for name in ('whisper_large_prompted', 'whisper_large_noprompt'):
    heard = [norm(w[2]) for w in json.loads((src / f'{name}.json').read_text())['words'] if norm(w[2])]
    if heard == as_recorded:
        print(f'full read-back {name}: MATCH, all {len(heard)} words in order (opening «إِن», no «وَ»)')
    else:
        diff = [(i, t, h) for i, (t, h) in enumerate(zip(as_recorded, heard)) if t != h]
        print(f'full read-back {name}: {len(heard)} words, letter-level misses {diff}')
        bad += name == 'whisper_large_prompted' or len(heard) != len(as_recorded)
for name in ('whisper_win_start', 'whisper_win_start_prompted'):
    heard = [norm(w[2]) for w in json.loads((src / f'{name}.json').read_text())['words'] if norm(w[2])]
    print(f'opening window 1.0-4.6 s {name}: {" ".join(heard)}', '(no «وَ»)' if heard and heard[0] != 'وان' else '')

used = json.loads(path.read_text())
same = used == out
bad += not same
print('texts.json', 'MATCHES the sources' if same else 'DIFFERS from the sources')
for a in out['phrases']:
    print(a['key'], a['id'], a['ar']); print('      ', cps(a['ar'])); print('      ', a['en'])

amiri = TTFont(str(job / 'qb/public/fonts/AmiriQuran.ttf'))
assert not {'COLR', 'CPAL', 'SVG ', 'CBDT', 'sbix'} & set(amiri.keys()), 'colour-layer font build'
cmap = amiri.getBestCmap()
allar = out['ayah']['recited']
miss = sorted({c for c in allar if c != ' ' and ord(c) not in cmap})
bad += bool(miss)
print('Amiri Quran (plain build) covers every Arabic code point:', 'yes' if not miss else f'NO, missing {cps("".join(miss))}')
for c in sorted(set(allar) - {' '}):
    assert unicodedata.name(c).startswith('ARABIC'), c
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
