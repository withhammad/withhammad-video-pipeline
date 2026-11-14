"""Every Arabic string of the private knitted "Subhan Allah x100" reel (TASBIH-KNIT), built and checked in one place.

    studio/.venv/bin/python -I studio/remotion/src/tasbihknit/text.py <job dir>          # writes text.ts, then checks
    studio/.venv/bin/python -I studio/remotion/src/tasbihknit/text.py <job dir> --check  # checks only

Sources (all in <job>/sources and <job>/source.info.json, never typed by hand):
- Hadith: Sahih Muslim 2698 (Sa'd ibn Abi Waqqas) and Sahih Muslim 1893a (Abu Mas'ud al-Ansari), sunnah.com Arabic text
  (ara-muslim.min.json from the fawazahmed0/hadith-api mirror of sunnah.com; its 2698 text is byte-identical to the live
  sunnah.com page, SHA-256 d51f3273...5df4, checked 2026-11-15). Wording cross-checked on dorar.net: Muslim reads «أو يحط».
- "سُبْحَانَ" from the Tanzil quran-simple text of al-Hashr 59:23 (tanzil-simple-59-23.json); "اللّٰهِ" written with
  shadda + dagger alef + kasra, as in the approved heart-knit reel.
- The reference reel's own caption (source.info.json): the title "وقِّف وسبِّح…", "حسنة قبل ما يخلص الفيديو", "للـ".
- The reference's on-screen lines, transcribed from 2x frame grabs (breakdown/msg_sheet.png, intro2x.png, hadith2x.png,
  end2x.png); the check prints their code points for audit.
Every text in TasbihKnit.tsx / Cover.tsx comes from text.ts; the check fails if any .ts/.tsx file here holds Arabic outside it.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

job = Path(sys.argv[1])
here = Path(__file__).resolve().parent
check_only = '--check' in sys.argv
AR = re.compile(r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]')

muslim = {str(h.get('arabicnumber')): h['text'] for h in json.loads((job / 'sources' / 'ara-muslim.min.json').read_text())['hadiths']
          if str(h.get('arabicnumber')) in ('2698', '1893.01')}
tanzil = json.loads((job / 'sources' / 'tanzil-simple-59-23.json').read_text())['data']['text']
caption = json.loads((job / 'source.info.json').read_text())['description']


def quoted(text: str) -> list[str]:
    """The Prophet's words: the segments between the RLM-wrapped quotes of the sunnah.com text."""
    return [s.strip(' ‏‎') for s in re.findall(r'‏"‏(.*?)‏"', text)]


q2698, q1893 = quoted(muslim['2698']), quoted(muslim['1893.01'])
SUBHANA = tanzil[tanzil.index('سُبْحَانَ'):][:len('سُبْحَانَ')]
ALLAHI = 'اللّٰهِ'          # ا ل لّٰ هِ
title_line = caption.split('\n')[0]

SOURCED = {  # name: (string, source text it must appear in verbatim, source label)
    'H1': (q2698[0], muslim['2698'], 'sunnah.com Sahih Muslim 2698'),
    'H2': (q2698[1], muslim['2698'], 'sunnah.com Sahih Muslim 2698'),
    'H3': (q1893[-1], muslim['1893.01'], 'sunnah.com Sahih Muslim 1893a'),
    'SUBHANA': (SUBHANA, tanzil, 'Tanzil quran-simple 59:23'),
    'TITLE': (title_line[:title_line.index('…') + 1], caption, 'reference caption'),
    'INTRO_SUB': (title_line[title_line.index('1000') + 5:], caption, 'reference caption'),
    'LIL': ('للـ', caption, 'reference caption'),
    'TAG': (caption[caption.index('#'):].split()[0], caption, 'reference caption'),
}
DHIKR = SUBHANA + ' ' + ALLAHI
nf = lambda s: unicodedata.normalize('NFC', s)
TYPED = {  # the reference's on-screen lines (non-sacred), transcribed from the frames
    'CAN_REACH_A': nf('تقدر توصل'), 'HADITH_LABEL': nf('حديثٌ صحيح · رواه مسلم'), 'SAY': nf('قل مع كل نقرة:'),
    'RECORD': nf('صحيفتك'), 'DEEDS': nf('الحسنات'), 'HASANA': nf('حسنة'),
    'CONGRATS': nf('مبارك… كُتبت لك ألفُ حسنة بإذن الله'), 'PROMISE': nf('هذا وعدُ النبي ﷺ، قال:'), 'RAWAHU': nf('رواه مسلم'),
    'MUSLIM': nf('مسلم'), 'COMMENT': nf('اكتب في التعليقات:'), 'SEND': nf('وأرسلها لمن تحب… ليكسب ألفاً، ولك مثلُ أجره'),
    'FOLLOW': nf('تابِعني'), 'SAW': '\uFDFA',
}
MSGS = [  # [count, Arabic, English], each on screen for 2.4 s from its count (55 for 2.33 s), as in the reference
    [10, nf('بدايةٌ جميلة… 100 حسنة'), 'A beautiful start… 100 good deeds'],
    [20, nf('200 حسنة… استمر'), '200 good deeds… keep going'],
    [30, nf('لسانُك رطبٌ بذكر الله'), 'Your tongue is moist with His remembrance'],
    [40, nf('كلُّ تسبيحةٍ تُكتب لك'), 'Every glorification is written for you'],
    [50, nf('نصفُ الطريق… أرسلها لمن تحب ليسبّح معك'), 'Halfway… send it to someone you love'],
    [55, nf('لا تتوقف الآن…'), 'Don’t stop now…'],
    [60, nf('صحيفتُك تمتلئ نوراً'), 'Your record is filling with light'],
    [70, nf('أنت أقربُ مما تظن'), 'You’re closer than you think'],
    [80, nf('عشرون فقط…'), 'Only twenty left…'],
    [90, nf('عشرٌ أخيرة…'), 'The final ten…'],
]


def diff(a: str, src: str) -> str:
    """Character-by-character: is `a` an exact run of `src`? Report the first mismatch against the closest window."""
    if a in src:
        return 'exact'
    best = max(range(len(src) - len(a) + 1), key=lambda i: sum(x == y for x, y in zip(a, src[i:i + len(a)])))
    w = src[best:best + len(a)]
    k = next(i for i, (x, y) in enumerate(zip(a, w)) if x != y)
    return f'MISMATCH at {k}: ours U+{ord(a[k]):04X} {unicodedata.name(a[k], "?")} vs source U+{ord(w[k]):04X} {unicodedata.name(w[k], "?")}'


if not check_only:
    out = {k: v[0] for k, v in SOURCED.items()} | {'DHIKR': DHIKR} | TYPED
    out['CAN_REACH'] = TYPED['CAN_REACH_A'] + ' ' + SOURCED['LIL'][0] + ' 100\u061F'      # تقدر توصل للـ 100؟
    lines = ['// Generated by text.py from the sources it names: every Arabic string of TASBIH-KNIT. Do not edit by hand.']
    lines += [f'export const {k} = {json.dumps(v, ensure_ascii=False)};' for k, v in out.items()]
    lines.append(f'export const MSGS: [number, string, string][] = {json.dumps(MSGS, ensure_ascii=False)};')
    (here / 'text.ts').write_text('\n'.join(lines) + '\n')

# ---- check -----------------------------------------------------------------------------------------------------------
bad = 0
gen = (here / 'text.ts').read_text()
for name, (s, src, label) in SOURCED.items():
    got = json.loads(re.search(rf'export const {name} = (".*?");', gen).group(1))
    r = diff(got, src) if got == s else 'text.ts differs from the source extraction'
    bad += r != 'exact'
    print(f'{name:10} {r:6} [{label}] {got}  ({len(got)} chars)')
dh = json.loads(re.search(r'export const DHIKR = (".*?");', gen).group(1))
ok = dh == SUBHANA + ' ' + ALLAHI and diff(dh.split(' ')[0], tanzil) == 'exact'
bad += not ok
print(f'DHIKR      {"exact" if ok else "MISMATCH"} [سُبْحَانَ: Tanzil 59:23; اللّٰهِ: U+0627 U+0644 U+0644 U+0651 U+0670 U+0647 U+0650] {dh}')
print('           ' + ' '.join(f'U+{ord(c):04X}' for c in dh))
for k, v in list(TYPED.items()) + [(f'MSG{m[0]}', m[1]) for m in MSGS]:
    marks = ''.join(c for c in v if unicodedata.category(c) == 'Mn')
    print(f'{k:12} typed  {v}  marks: {" ".join(unicodedata.name(c).replace("ARABIC ", "") for c in marks) or "-"}')
# no Arabic anywhere in the code except text.ts
for f in sorted(here.glob('*.ts*')):
    if f.name == 'text.ts':
        continue
    for n, line in enumerate(f.read_text().splitlines(), 1):
        if AR.search(line) and not line.lstrip().startswith('//'):
            print(f'ARABIC OUTSIDE text.ts: {f.name}:{n}: {line.strip()[:80]}'); bad += 1
print('CHECK', 'PASS' if bad == 0 else f'FAIL ({bad})')
sys.exit(1 if bad else 0)
