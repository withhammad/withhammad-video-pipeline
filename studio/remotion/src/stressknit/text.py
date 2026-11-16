"""Exact text for the private knitted "99 Names for a tired heart" reel (STRESS-KNIT), checked against sources, never typed by hand.

    /usr/bin/python3 studio/remotion/src/stressknit/text.py <job dir> [--write]     (needs fontTools)

The reference (DfWnDR6T1YX, @lelahmenjauh) walks through the 99 Names in the order of Jami` at-Tirmidhi 3507 (read off the
reference frame by frame: 1 Ar-Rahman ... 84 Malikul Mulk, 85 Dzul Jalali wal Ikram ... 99 Ash-Shabur).
  names    Arabic = the matn of Tirmidhi 3507 (fawazahmed0/hadith-api ara-tirmidhi/3507, whose matn between the quote marks hashes
           identical to sunnah.com's, SHA-256 in <job>/src/sunnah_hashes.json), the 102 words after «لاَ إِلَهَ إِلاَّ هُوَ», with
           #84 (2 words) and #85 (3 words) joined. English meaning + transliteration = sunnah.com's own English of that hadith
           (eng-tirmidhi/3507, identical to the page without whitespace). Grade on sunnah.com: Da'if (Darussalam): the LIST is weak.
  #67      Al-Ahad is not in sunnah.com's text of that list (98 names); it comes from Quran 112:1 (see below).
  hadith   Sahih al-Bukhari 7392 (sahih): Arabic matn and English quote, both identical to sunnah.com (hashes above).
Writes texts.json with --write; exits 1 if texts.json differs from the sources, or if Amiri Quran lacks a glyph.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

job = Path(sys.argv[1])
src = job / 'src'
here = Path(__file__).resolve().parent
H = json.loads((src / 'sunnah_hashes.json').read_text())
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
bad = 0

ar = json.loads((src / 'fawaz_ara_tirmidhi_3507.json').read_text())['hadiths'][0]['text']
matn = ar.split('"')[1]
ok = sha(matn) == H['tirmidhi:3507']['matn_between_quotes_sha256']
bad += not ok
print('Tirmidhi 3507 Arabic matn = sunnah.com:', ok)
words = matn.replace('\u200f', '').split()
assert len(words) == 121 and words[13] == words[19] and words[18][:2] == 'إِ', 'names follow «هُوَ اللَّهُ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ»'
nw = words[20:]
names = nw[:82] + [' '.join(nw[82:84]), ' '.join(nw[84:87])] + nw[87:]
assert len(names) == 98, len(names)   # sunnah.com's text of Tirmidhi 3507 carries 98 names: no «الأحد» after «الواحد»

en = json.loads((src / 'fawaz_eng_tirmidhi_3507.json').read_text())['hadiths'][0]['text']
ok = sha(re.sub(r'\s+', '', en)) == H['tirmidhi:3507']['english_no_whitespace_sha256']
bad += not ok
print('Tirmidhi 3507 English = sunnah.com:', ok)
body = en.split('(Allāhu Lā Ilāha Illā Huwa), ', 1)[1].rstrip('.”').rstrip(')')
items = body.split('), ')
assert len(items) == 98, len(items)
meanings = []
for it in items:
    m, tr = it.rsplit(' (', 1)
    meanings.append({'en': m, 'tr': tr, 'src': 'Tirmidhi 3507'})
assert meanings[65]['tr'] == 'Al-Wāḥid' and meanings[66]['tr'] == 'Aṣ-Ṣamad'

# The reference (like most printed lists) has Al-Ahad as #67, between Al-Wahid and As-Samad. It is not in sunnah.com's text of
# Tirmidhi 3507, so it is sourced from Quran 112:1 instead (api.quran.com text_uthmani, which must equal tanzil.net's Uthmani
# with the basmala prefix removed; English = Saheeh International): «أَحَدٌ» made definite in the list's own spelling, «الأَ» from
# the list's «الأَوَّلُ» + «حَد» from 112:1 + damma. Flagged in the captions as from the Quran, not from the hadith list.
qc = json.loads((src / 'qc_112_1.json').read_text())['verses'][0]['text_uthmani'].strip()
tl = [l for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('112|1|')][0].split('|', 2)[2]
basm = [l for l in (src / 'tanzil_uthmani_marks.txt').read_text(encoding='utf-8').splitlines() if l.startswith('1|1|')][0].split('|', 2)[2]
ok = tl == basm + ' ' + qc
bad += not ok
print('112:1 quran.com text_uthmani vs tanzil.net uthmani (basmala prefix removed):', 'IDENTICAL' if ok else 'DIFF')
tz = {e['edition']['identifier']: e['text'] for e in json.loads((src / 'tz_112_1.json').read_text())['data']}
ahad_q = qc.split()[-1]
awwal = names[71]                                  # «الأَوَّلُ», Al-Awwal
assert meanings[71]['tr'] == 'Al-Awwal' and awwal[:4] == '\u0627\u0644\u0623\u064e', [hex(ord(c)) for c in awwal]
assert ahad_q[:5] == '\u0623\u064e\u062d\u064e\u062f', [hex(ord(c)) for c in ahad_q]
ahad = awwal[:4] + ahad_q[2:5] + '\u064f'
names.insert(66, ahad)
meanings.insert(66, {'en': 'the One', 'tr': 'Al-Aḥad', 'src': 'Quran 112:1'})
assert len(names) == 99

ba = json.loads((src / 'fawaz_ara_bukhari_7392.json').read_text())['hadiths'][0]['text']
bw = ' '.join(ba.split('"')[1].replace('‏', '').split())
be = json.loads((src / 'fawaz_eng_bukhari_7392.json').read_text())['hadiths'][0]['text']
bq = ' '.join(re.search(r'"([^"]+)"', be).group(1).split())
for k, v, h in (('Bukhari 7392 Arabic', bw, 'matn_words_sha256'), ('Bukhari 7392 English', bq, 'english_quote_sha256')):
    ok = sha(v) == H['bukhari:7392'][h]
    bad += not ok
    print(k, '= sunnah.com:', ok)

out = {'names': [{'n': i + 1, 'ar': a, **m} for i, (a, m) in enumerate(zip(names, meanings))],
       'listRef': 'Jami` at-Tirmidhi 3507', 'listGrade': "Da'if (Darussalam)",
       'ayahAr': qc, 'ayahEn': tz['en.sahih'], 'ayahRef': 'Al-Ikhlas 112:1',
       'hadithAr': bw, 'hadithEn': bq, 'hadithRef': 'Sahih al-Bukhari 7392'}
path = here / 'texts.json'
if '--write' in sys.argv:
    path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
used = json.loads(path.read_text())
ok = used == out
bad += not ok
print('texts.json matches the sources:', ok)
for x in out['names']:
    print(f"{x['n']:3} {x['tr']:28} {x['en']:44} {x['ar']}  [{x['src']}]")
font = TTFont(str(job / 'knit/public/fonts/AmiriQuran.ttf')).getBestCmap()
need = set(''.join(x['ar'] for x in out['names'])) | set(bw) | set(qc) | {'ﷺ'}
miss = sorted({c for c in need if c != ' ' and ord(c) not in font})
bad += bool(miss)
print('Amiri Quran covers every Arabic character:', 'yes' if not miss else f'NO, missing {[hex(ord(c)) for c in miss]}')
lat = TTFont(str(job / 'knit/public/fonts/Amiri-Regular.ttf')).getBestCmap()
miss = sorted({c for c in ''.join(x['tr'] + x['en'] for x in out['names']) if ord(c) not in lat})
bad += bool(miss)
print('Amiri Regular covers every transliteration mark:', 'yes' if not miss else f'NO, missing {miss}')
print('ALL MATCH' if not bad else f'{bad} MISMATCH(ES)')
sys.exit(1 if bad else 0)
