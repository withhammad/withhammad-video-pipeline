"""Captions for the private knitted "Subhan Allah x100" reel (her accounts: Instagram @heal.ingthroughquran, TikTok, YouTube
Shorts). Every Arabic string is read from text.ts, so the caption quotes the hadith exactly as the video does.

    python3 -I studio/remotion/src/tasbihknit/captions.py <out.txt>
"""
import json
import re
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
src = (here / 'text.ts').read_text()
T = {m.group(1): json.loads(m.group(2)) for m in re.finditer(r'export const (\w+) = (".*?");', src)}
H1, H2, H3, DHIKR, TITLE, SAW, TAG, SUB = T['H1'], T['H2'], T['H3'], T['DHIKR'], T['TITLE'], T['SAW'], T['TAG'], T['INTRO_SUB']
REF = 'Sahih Muslim 2698 (narrated by Sa’d ibn Abi Waqqas, may Allah be pleased with him)'
H_EN1 = '“Is any of you unable to earn a thousand good deeds every day?”'
H_EN2 = '“He glorifies Allah a hundred times, and a thousand good deeds are recorded for him, or a thousand sins are wiped away.”'
ALT = ('A knitted felt-bead tasbih lies on a plum knitted blanket. With every count of ' + DHIKR + ' (SubhanAllah) the next undyed '
       'wool bead turns a new yarn colour, until all 100 beads make a rainbow around a crochet medallion that counts from 1 to 100. '
       'A small knitted scroll fills with gold stitches, then unrolls to show the hadith from Sahih Muslim 2698 in Arabic and English.')

ig = f"""Don’t scroll. Reach 100.
{TITLE} 1000 {SUB}

Say {DHIKR} (SubhanAllah) with every bead, all the way to 100. By the time this video ends, you could have 1,000 good deeds written for you.

The Prophet {SAW} said:
«{H1}»
{H_EN1}
And when he was asked how, he said:
«{H2}»
{H_EN2}
{REF}

Comment “SubhanAllah” when you reach 100, and send it to someone you love so they can earn it too. Whoever guides to good gets the same reward:
«{H3}» (Sahih Muslim 1893)

#subhanallah {TAG} #dhikr #tasbih #islamicreminder"""

tiktok = f"""Can you reach 100? Say {DHIKR} with every bead: 1,000 good deeds before this video ends.
The Prophet {SAW}: «{H2}» (Sahih Muslim 2698)
Comment “SubhanAllah” at 100 and send it to someone you love.
#subhanallah #dhikr #tasbih {TAG} #islamtiktok"""

yt_title = 'SubhanAllah ×100 = 1,000 good deeds before this video ends #Shorts'
yt_desc = f"""Say {DHIKR} (SubhanAllah) with every bead, all the way to 100.

The Prophet {SAW} said: «{H1}»
{H_EN1}
«{H2}»
{H_EN2}
{REF}

Comment “SubhanAllah” when you reach 100, and share it with someone you love.

#SubhanAllah #Dhikr #Shorts"""

hooks = ['Don’t scroll. Reach 100.', 'Can you reach 100 before this video ends?', '1,000 good deeds in 60 seconds: say SubhanAllah with every bead.']

out = f"""PERSONAL: for @heal.ingthroughquran (the owner's wife). Not for the business accounts. Nothing has been posted.
Reel: "Subhan Allah x100" knitted rebuild of DfncZKDIZge (Dr-Rafat Khanfar, @drkhanfar). Video 79.5 s, 1080x1920.
Hadith checked word for word on sunnah.com (Sahih Muslim 2698; In-book: Book 48, Hadith 47) and dorar.net (Muslim 2698,
graded sahih, narrator Sa'd ibn Abi Waqqas). Muslim's wording has "aw" ("or ... wiped away"), as quoted below.
The English lines are the meaning as shown in the reel.

==== HOOK (first line / on-screen) ====
{chr(10).join(hooks)}

==== INSTAGRAM CAPTION (5 hashtags: Instagram's current cap) ====
{ig}

==== INSTAGRAM ALT TEXT ====
{ALT}

==== TIKTOK CAPTION ====
{tiktok}

==== YOUTUBE SHORTS ====
Title:
{yt_title}

Description:
{yt_desc}

==== NOTES ====
- Cover: use the cover JPG (it reads in the 4:5 and 1:1 grid crops).
- Audio is the reference's own sound (gain and limiter only, no cuts, no speed or pitch change). If Instagram offers the
  original audio, it is the same track.
- Every count lands on the reference's tick: count 1 at 3.0 s, then one count every 0.6 s, 100 at 62.4 s.
"""
Path(sys.argv[1]).write_text(out)
print(out)
