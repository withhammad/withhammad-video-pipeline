"""Caption pack for the private knitted "Say it 10 times" dhikr reel (her Instagram, @heal.ingthroughquran; she posts it herself).

    studio/.venv/bin/python -I studio/remotion/src/tahlilknit/captions.py <job dir>

Every Arabic string is read from texts.json (cut out of sunnah.com Sahih Muslim 2693 and checked by text.py), never typed here; the
hadith English is the sunnah.com translation saved in <job>/knit/src/sunnah_muslim_2693_excerpt.json. The reference's audio is a
blackbird recording under CC BY 4.0, so its credit line goes in every caption that ships the audio. Writes <job>/knit/captions.txt
(voice.py --deliver copies it to ~/Downloads).
"""
import json
import sys
from pathlib import Path

job = Path(sys.argv[1])
here = Path(__file__).resolve().parent
TX = json.loads((here / 'texts.json').read_text())
EX = json.loads((job / 'knit' / 'src' / 'sunnah_muslim_2693_excerpt.json').read_text())
EN = EX['en'].strip().replace(':" ', ': \'').replace('everything" ten', "everything' ten")      # inner quotes as single quotes
assert EN.startswith('He who uttered:') and 'four slaves from the progeny of Isma\'il' in EN, EN
SEP = '=' * 60
BIRD = 'Blackbird song: Diana Tudor (xeno-canto XC1059970), CC BY 4.0'
DHIKR, REWARD = TX['dhikr'], TX['reward']
TR = "Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamd, wa huwa ʿalā kulli shayʾin qadīr"
MEAN = ('There is no god but Allah alone, with no partner. His is the dominion and His is the praise, '
        'and He has power over all things.')

text = f"""PERSONAL - Say it 10 times, knitted (for @heal.ingthroughquran)
She posts it herself. Nothing here is for the business accounts.

{SEP}
FIRST-LINE HOOK (frame 0 of the reel shows "Say it 10 times - like freeing four souls")
{SEP}
Say it 10 times today 🤍 like freeing four souls


{SEP}
INSTAGRAM CAPTION (copy everything between the lines)
{SEP}
Say it 10 times today 🤍 like freeing four souls

{DHIKR}

{TR}

"{MEAN}"

Count with the beads, one by one, until the hoop is full 📿

The Prophet ﷺ said (narrated by Abu Ayyub al-Ansari):
“{EN}”
(Sahih Muslim 2693, English translation as published on sunnah.com. Also in Sahih al-Bukhari 6404, with the wording "like one who freed a slave from the children of Ismāʿīl".)

Save it and come back to it every day, and send it to someone you love.

Don't forget us in your duʿā 🤍

{BIRD}

#dhikr #tahlil #laIlahaIllallah #tasbih #tasbeeh #adhkar #dailydhikr #islamicreminder #islamicreels #muslimah #knittedart #crochetart #yarnart #3dart


{SEP}
ARABIC CAPTION (optional, for an Arabic post or the first comment)
{SEP}
{DHIKR} ×١٠ 📿

قال ﷺ: «{TX['hadith']}» (صحيح مسلم ٢٦٩٣، وأخرجه البخاري ٦٤٠٤ باختلاف يسير)

احفظ الريل وارجع له كل يوم 🤍
{TX['dua_ask']}

صوت الشحرور: Diana Tudor (xeno-canto XC1059970)، CC BY 4.0


{SEP}
ALT TEXT (Instagram > Advanced settings > Accessibility)
{SEP}
3D knitted animation: a cream felt plaque with the Arabic dhikr "{TR}" hangs on a knitted lavender-to-apricot wall with eight-pointed star motifs. Below it a twisted yarn cord carries felted wool beads; with each count a bead slides to the centre and turns a new colour, and yarn of that colour winds around a wooden embroidery hoop that counts from 0 to 10. At 10 colourful pompoms burst out of the hoop and a knitted heart appears for the closing words "Don't forget us in your duʿā".


{SEP}
TIKTOK CAPTION
{SEP}
Say it 10 times 🤍 like freeing four souls (Sahih Muslim 2693) 📿 {TR} #dhikr #islamictiktok #muslimtiktok #tasbih #knitting #yarnart #fyp
{BIRD}


{SEP}
YOUTUBE SHORTS
{SEP}
Title: Say this 10 times: like freeing four souls 🤍 | La ilaha illallah wahdahu #shorts
Description:
{DHIKR}
{TR}
"{MEAN}"
The Prophet ﷺ said: whoever says it ten times is like one who freed four souls from the children of Ismāʿīl (Sahih Muslim 2693; al-Bukhari 6404 has "a slave").
{BIRD}
#dhikr #tasbih #islamicshorts #knittedart


{SEP}
NOTES FOR HER
{SEP}
- Post as an Instagram Reel with the cover "cover 9x16.jpg"; "thumbnail 4x5.jpg" is the grid crop.
- The audio is the reference's blackbird recording (CC BY 4.0): keep the credit line in the caption.
- The spoken dhikr is a soft female Arabic voice (Lamia); the Arabic on screen is from Sahih Muslim 2693 as published on sunnah.com.
"""
out = job / 'knit' / 'captions.txt'
out.write_text(text)
print(out, len(text), 'chars')
