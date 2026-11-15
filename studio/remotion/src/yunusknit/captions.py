"""Caption pack for the private knitted Yunus reel (her Instagram, @heal.ingthroughquran; she posts it herself).

    /usr/bin/python3 studio/remotion/src/yunusknit/captions.py <job dir> [--deliver]

Every Arabic string and every Sahih International line is read from texts.json (cut out of quran.com / tanzil.net and checked by
text.py), never typed here; 21:87 is sliced at a word boundary and the slice is asserted against the full verse. The three
darknesses are Ibn Mas'ud's explanation of «ٱلظُّلُمَـٰتِ» in 21:87 as Tafsir Ibn Kathir reports it (also narrated from Ibn Abbas and
others there). Writes <job>/knit/captions.txt and, with --deliver, copies it to ~/Downloads as "<NAME> - captions and SEO.txt".
"""
import json
import shutil
import sys
from pathlib import Path

job = Path(sys.argv[1])
here = Path(__file__).resolve().parent
TX = json.loads((here / 'texts.json').read_text())
NAME = 'Personal - Yunus three darknesses knitted (wife, heal.ingthroughquran)'
SEP = '=' * 60
D87 = TX['dua_21_87']
W87 = D87.split(' ')
DUA_AR = ' '.join(W87[10:])                    # from «فنادى» (word 11 of 21:87) to the end: "and he called out within the darknesses ..."
assert D87.endswith(" " + DUA_AR) and len(W87) == 23 and len(W87[10:]) == 13, (len(W87), W87[10])
E87 = TX['dua_21_87_en']
DUA_EN = E87[E87.index('And he called out'):]
assert E87.endswith(DUA_EN)
A143, A144 = TX['ar']['143'], TX['ar']['144']
E143, E144 = TX['en']['143'], TX['en']['144']
REC = ' '.join(TX['ar'][str(a)] + f' ({a})' for a in TX['ayat'])
REC_EN = ' '.join(f'({a}) ' + TX['en'][str(a)] for a in TX['ayat'])
TAGS = '#yunus #prophetyunus #jonah #quran #quranrecitation #surahassaffat #dua #lailahaillaanta #islamicreminder #quranstories #tafsir #islamicreels #muslimah #knittedart #crochetart'

text = f"""PERSONAL - Yunus (AS) in three darknesses, knitted (for @heal.ingthroughquran)
She posts it herself. Nothing here is for the business accounts.

TITLE: Three darknesses, and one thing saved him (Surah As-Saffat 37:139-146)


{SEP}
FIRST-LINE HOOK (frame 0 of the reel shows "Three darknesses / and one thing saved him")
{SEP}
Three darknesses... and one thing saved him 🤍


{SEP}
INSTAGRAM CAPTION (copy everything between the lines)
{SEP}
Three darknesses... and one thing saved him 🤍

The darkness of the belly of the fish, the darkness of the sea and the darkness of the night: that is how Ibn Mas'ud explained "the darknesses" of Surah Al-Anbiya 21:87 (Tafsir Ibn Kathir). And from inside them, Yunus (peace be upon him) called out:

﴿…{DUA_AR}﴾
“{DUA_EN}” (Quran 21:87, Sahih International)

﴿{A143} ۝ {A144}﴾
“{E143} {E144}” (Quran 37:143-144, Sahih International)

If you feel you are in a darkness with no way out, say it from your heart. The One who brought Yunus out of the belly of the fish can bring you out of any distress.

Recitation: Surah As-Saffat 37:139-146 🎧 audio from @rofydaesam

Share it with someone who needs to hear it today 🤍

{TAGS}


{SEP}
ARABIC CAPTION (optional, for an Arabic post or the first comment)
{SEP}
ظلماتٌ ثلاث... ونجّته كلمة 🤍

ظلمة بطن الحوت، وظلمة البحر، وظلمة الليل

﴿…{DUA_AR}﴾
[الأنبياء: ٨٧]

﴿{A143} ۝ {A144}﴾
[الصافات: ١٤٣-١٤٤]

شاركه مع من يحتاج أن يسمعه اليوم 🤍


{SEP}
ALT TEXT (Instagram > Advanced settings > Accessibility)
{SEP}
A world made entirely of knitted yarn, with Surah As-Saffat 37:139-146 recited. At night a knitted whale with a Fair Isle pattern leaps out of a stitched blue sea under a crochet moon and Fair Isle stars, then crashes back in a burst of white pompoms. A knitted ship with an empty deck and a lantern sails the waves, its cargo of knitted sacks, barrels and jars on board; a crochet cup tips over and wooden lot sticks spill across the deck, one with a red tip. A storm rises, the whale rises beside the ship with its jaws open and closes them, then glides down through the deep past glowing crochet jellyfish. Three darknesses are counted: the belly of the fish, a ribbed knitted tunnel lit by running gold stitches; the deep sea; the night. They part like three knitted curtains onto a dawn, the whale opens its mouth at a knitted shore, and a crochet gourd vine grows over the sand with broad leaves, yellow flowers and a striped gourd. No person is shown. The Arabic of each verse appears in gold with its English meaning (Sahih International).


{SEP}
TIKTOK CAPTION
{SEP}
Three darknesses, and one thing saved him 🤍 Yunus (AS) in the belly of the fish, the sea and the night: "Had he not been of those who exalt Allāh, he would have remained inside its belly until the Day they are resurrected." (Quran 37:143-144) Say his dua: Lā ilāha illā anta, subḥānaka, innī kuntu mina ẓ-ẓālimīn (Quran 21:87)

#yunus #quran #quranrecitation #islamictiktok #muslimtiktok #dua #prophetstories #islamicreminder #knitting #crochettok


{SEP}
YOUTUBE SHORTS
{SEP}
Title: Three darknesses, one dua: Prophet Yunus (AS) | Surah As-Saffat 37:139-146 🤍

Description:
Yunus (peace be upon him) in three darknesses: the belly of the fish, the sea and the night (Ibn Mas'ud, in Tafsir Ibn Kathir on 21:87). What saved him? “{E143} {E144}” (Quran 37:143-144, Sahih International)

His dua from inside the darkness: “{DUA_EN}” (Quran 21:87, Sahih International)

Recitation: Surah As-Saffat 37:139-146 (audio from @rofydaesam). Made in knitted yarn, stitch by stitch: no prophet is shown.

#Shorts #Quran #Yunus

Tags (Shorts > Show more > Tags):
prophet yunus, yunus in the whale, three darknesses, dua of yunus, la ilaha illa anta subhanaka inni kuntu minaz zalimin, surah as saffat 37:139-146, quran recitation, quran stories, islamic reminder, knitted animation


{SEP}
THE RECITED AYAT ON SCREEN (as-Saffat 37:139-146, tanzil.net Uthmani = quran.com text_uthmani)
{SEP}
{REC}

{REC_EN}


{SEP}
NOTES FOR HER (not for posting)
{SEP}
- Sound: the reference reel's original audio, unchanged apart from one overall level (a peak limiter and loudness to -14 LUFS): the opening whale sound and splash, then the recitation of Surah As-Saffat 37:139-146. No music was added, no cut inside an ayah, no speed or pitch change.
- No prophet is shown in any form. The story is told with the knitted night, sea, ship, cargo, lots, whale, darkness and dawn only; the ship's deck is empty.
- The three darknesses on screen (the belly of the fish, the sea, the night) follow Ibn Mas'ud's explanation of 21:87 in Tafsir Ibn Kathir.
- The cover and the 4:5 thumbnail carry 37:143, the line the original caption opens with.
"""
out = job / 'knit' / 'captions.txt'
out.write_text(text)
print(text[:400])
print('...', len(text), 'chars ->', out)
if '--deliver' in sys.argv:
    dst = Path.home() / 'Downloads' / f'{NAME} - captions and SEO.txt'
    shutil.copy(out, dst)
    print('delivered', dst)
