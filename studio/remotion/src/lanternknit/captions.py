"""Caption pack for the private knitted "Three lanterns" dhikr reel (her Instagram, @heal.ingthroughquran; she posts it herself).

    studio/.venv/bin/python -I studio/remotion/src/lanternknit/captions.py <job dir> [--deliver]

Every Arabic string is read from texts.json (cut out of sunnah.com / quran.com / Tanzil and checked by text.py), never typed here;
the hadith English is the sunnah.com text saved in <job>/knit/src/sunnah_muslim_597_en.txt. Writes <job>/knit/captions.txt and,
with --deliver, copies it to ~/Downloads as "<NAME> - captions and SEO.txt".
"""
import json
import shutil
import sys
from pathlib import Path

job = Path(sys.argv[1])
here = Path(__file__).resolve().parent
TX = json.loads((here / 'texts.json').read_text())
NAME = 'Personal - Three lanterns knitted (wife, heal.ingthroughquran)'
h597 = (job / 'knit' / 'src' / 'sunnah_muslim_597_en.txt').read_text().strip().splitlines()
assert h597[0].startswith('Sahih Muslim 597a')
H597 = ' '.join(h597[1:]).replace('Abu Huraira reported Allah\'s Messenger (ﷺ) as saying: ', '')
H597_QUOTE = H597.split('as saying: ', 1)[-1] if 'as saying: ' in H597 else H597
SEP = '=' * 60
AYAH_EN = TX['ayah_en']

text = f"""PERSONAL - Three lanterns, knitted (for @heal.ingthroughquran)
She posts it herself. Nothing here is for the business accounts.

{SEP}
FIRST-LINE HOOK (frame 0 of the reel shows "Three lanterns, one calm heart")
{SEP}
Three lanterns, one calm heart 🤍 Fill them after your salah: 33 · 33 · 33


{SEP}
INSTAGRAM CAPTION (copy everything between the lines)
{SEP}
Three lanterns, one calm heart 🤍 Fill them after your salah: 33 · 33 · 33

Light them bead by bead:
33 × SubhanAllah (Glory be to Allah)
33 × Alhamdulillah (All praise is due to Allah)
33 × Allahu Akbar (Allah is the Greatest)

"So remember Me; I will remember you." (Quran 2:152, Sahih International)

After every prayer, the Prophet ﷺ taught us these three, 33 times each. In the hadith:
“{H597_QUOTE.strip()}”
(Sahih Muslim 597a, English translation as published on sunnah.com)

Save it for after your salah, and send it to someone whose heart needs a little light 🏮

Which dhikr do you never skip after salah?

#dhikr #tasbih #tasbeeh #subhanallah #alhamdulillah #allahuakbar #dhikrafterprayer #afterprayer #islamicreminder #islamicreels #muslimah #fanoos #knittedart #crochetart #yarnart


{SEP}
ARABIC CAPTION (optional, for an Arabic post or the first comment)
{SEP}
ثلاثة فوانيس... وقلبٌ هادئ 🤍

{TX['sub']} ×33
{TX['hamd']} ×33
{TX['akbar']} ×33

﴿{TX['ayah']}﴾
[البقرة: ١٥٢]

احفظه لما بعد صلاتك 🏮


{SEP}
ALT TEXT (Instagram > Advanced settings > Accessibility)
{SEP}
A knitted yarn scene: a Moroccan arch window of cream cable-knit and crocheted mosaic tiles, with three crocheted lanterns standing on its sill in turquoise, coral and saffron. Felted beads roll off a knitted prayer-bead string one at a time, bounce off a crocheted crescent and drop into the lanterns: 33 for SubhanAllah, 33 for Alhamdulillah, 33 for Allahu Akbar. A soft voice says each dhikr while it is counted. Each lantern glows brighter with every bead while the knitted sky in the arch turns from dusk to night. At 99 the lanterns flare, sparks rise into the sky and become crochet stars, the crescent rises as the moon, and the verse "So remember Me; I will remember you" (Quran 2:152) appears in Arabic and English.


{SEP}
TIKTOK CAPTION
{SEP}
Three lanterns, one calm heart 🤍 Your dhikr after salah: 33 SubhanAllah · 33 Alhamdulillah · 33 Allahu Akbar. "So remember Me; I will remember you." (Quran 2:152) Save it for after your next prayer 🏮

#dhikr #tasbih #islamictiktok #muslimtiktok #subhanallah #alhamdulillah #allahuakbar #afterprayer #knitting #crochettok


{SEP}
YOUTUBE SHORTS
{SEP}
Title (max 100 characters):
Dhikr after salah 🤍 Light 3 lanterns: 33 SubhanAllah · 33 Alhamdulillah · 33 Allahu Akbar

Description:
Do your dhikr after salah with me and fill three knitted lanterns with light, bead by bead: 33 × SubhanAllah, 33 × Alhamdulillah, 33 × Allahu Akbar.

"So remember Me; I will remember you. And be grateful to Me and do not deny Me." (Quran 2:152, Sahih International)

From the hadith: “{H597_QUOTE.strip()}” (Sahih Muslim 597a, sunnah.com)

Made in knitted yarn, stitch by stitch. Save it and come back after every prayer.

#Shorts #Dhikr #Tasbih

Tags (Shorts > Show more > Tags):
dhikr after salah, tasbih after prayer, 33 subhanallah 33 alhamdulillah 33 allahu akbar, tasbeeh counter, dhikr counter, so remember me i will remember you, quran 2:152, islamic reminder, knitted animation, crochet lantern


{SEP}
NOTES FOR HER (not for posting)
{SEP}
- Sound: the reference reel's own music is kept underneath, unchanged apart from its level (a soft instrumental with a click as each bead lands; no Quran recitation). On top, a soft female voice says the dhikr of the set being counted: SubhanAllah 17 times during the first lantern, Alhamdulillah 17 times during the second, Allahu Akbar 17 times during the third. Each phrase starts on a bead landing, on every second count: one phrase lasts longer than the 0.85 s between counts and is never sped up, so it cannot fit on every single count.
- The voice is an AI voice (Lamia, a native Arabic female voice made with ElevenLabs in the owner's HeyGen account), not a real person. Every phrase was checked by transcribing it back in Arabic, alone, in the mix and in the final file. If she prefers, she can add "voice: AI" to the caption.
- On-screen Arabic, copied from authoritative texts, not typed:
  {TX['sub']}     Sahih Muslim 2137a on sunnah.com (the hadith "the dearest words to Allah are four"); the same spelling as Quran 23:91 on quran.com
  {TX['hamd']}      Sahih Muslim 2137a on sunnah.com, without the "wa"; the same spelling as Quran 1:2 on quran.com
  {TX['akbar']}       Sahih Muslim 2137a on sunnah.com, without the "wa"
  {TX['ayah']}
                       Quran 2:152, Uthmani script, identical on quran.com and Tanzil; English: Sahih International ("{AYAH_EN}")
- The English meanings under the dhikr ("Glory be to Allah", "All praise is due to Allah", "Allah is the Greatest") are the reference reel's own lines: common meanings of the dhikr, not Quran translations.
- 33 · 33 · 33 is the dhikr after the obligatory prayers (Sahih Muslim 597a, quoted above; it completes the hundred with "La ilaha illallah..."). It is not Tasbeeh Fatimah (33 · 33 · 34 at bedtime, Sahih Muslim 2727), so the caption does not call it that.
- The reference closed with the dua "Taqabbal Allahu minna wa minkum". This version closes with the verse its caption quotes, Quran 2:152, so every Arabic line on screen comes straight from the Quran or a sahih hadith.
- Hashtags: the reference used #dhikr #tasbih #subhanallah #islam #muslim. The big tags (#islamicreels, #islamicreminder, #subhanallah, #muslimah) are very crowded, so they sit next to exact ones (#dhikrafterprayer, #afterprayer, #tasbeeh, #fanoos) and the knitted-craft tags that fit her style. Post counts were not measured for this reel: check each tag in Instagram search before posting.
- Best time: the reel is about dhikr after salah, so posting just after a prayer time in her time zone (Asr or Maghrib) fits it best.
"""
out = job / 'knit' / 'captions.txt'
out.write_text(text)
print(out, len(text), 'chars')
if '--deliver' in sys.argv:
    shutil.copy(out, Path.home() / 'Downloads' / f'{NAME} - captions and SEO.txt')
    print('delivered')
