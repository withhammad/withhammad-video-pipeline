"""Captions and SEO text for the private knitted "99 Names for stress" reel (STRESS-KNIT), built from the verified texts only.

    /usr/bin/python3 studio/remotion/src/stressknit/captions.py <job dir> <out.txt>

Every Arabic line is pasted from texts.json (checked by text.py against sunnah.com / quran.com / Tanzil) or from
<job>/src/ayah_13_28.txt (api.quran.com text_uthmani, identical to Tanzil Uthmani), never typed. Layout follows the earlier wife
caption files: a "Title ...:" line and an "INSTAGRAM ... CAPTION" header between "=" lines (scratchpad/wife-send/prep.py parses both).
The audio note comes from <job>/knit/audio_note.txt (written after listening and the Whisper passes).
"""
import json
import sys
from pathlib import Path

job, out = Path(sys.argv[1]), Path(sys.argv[2])
T = json.loads((Path(__file__).resolve().parent / 'texts.json').read_text())
A1328 = (job / 'src/ayah_13_28.txt').read_text(encoding='utf-8').strip()
E1328 = json.loads((job / 'src/tz_13_28.json').read_text())['data'][1]['text'].rstrip('"')
NOTE = (job / 'knit/audio_note.txt').read_text(encoding='utf-8').strip()
BAR = '=' * 60
HOOK = 'Stressed? Read His 99 Names, slowly, to the end 🤍'


def sec(title, body):
    return f'{BAR}\n{title}\n{BAR}\n{body.strip()}\n\n\n'


names_line = ' · '.join(n['tr'] for n in T['names'])
ig = f"""{HOOK}

Pause for a moment. Let the needle walk the dial, one Name at a time, and say each one in your heart. Watch the stress meter empty as you go.

{A1328}
"{E1328}"
(Quran 13:28, Ar-Ra'd, Sahih International)

The Prophet ﷺ said:
{T['hadithAr']}
"{T['hadithEn']}"
(Sahih al-Bukhari 7392)

Feeling tired? Come closer to Him. Slowly. That door is never locked.

Save it for the next heavy day, and send it to someone who needs a calm minute 🤍

Which Name stayed with you?

#asmaulhusna #99namesofallah #namesofallah #dhikr #stressrelief #anxiety #peaceofmind #quranreminder #islamicreminder #islamicreels #muslimah #knittedart #crochetart #amigurumi"""

ar = f"""أسماء الله الحسنى… اقرأها بهدوء حتى النهاية 🤍

﴿{A1328}﴾
[الرعد: ٢٨]

قال رسول الله ﷺ: «{T['hadithAr']}»
[صحيح البخاري ٧٣٩٢]

#أسماء_الله_الحسنى #ذكر #طمأنينة"""

alt = ("A knitted night scene. A round crocheted doily in navy wool works like a clock face, with all 99 Names of Allah written round it "
       "in small letters and a little cream-and-gold knitted oil lamp glowing in the middle. An orange knitting needle steps from one "
       "Name to the next, an amber yarn stitch grows round the dial behind it, and under the dial each Name appears in gold Arabic "
       "with its transliteration and English meaning, counting from 1 to 99. At the top, a knitted bar labelled STRESS drains from 100 "
       "to calm. At the end a knitted young woman in a rose hijab sits on a crocheted mat beside the lamp, holding a tasbih, seen from "
       "behind, with the words: Feeling tired? Come closer to Him. Slowly. That door is never locked.")

tt = (f'{HOOK} 99 Names, one at a time, say each in your heart. "By the remembrance of Allah hearts are assured." (Quran 13:28) '
      'Send it to someone who needs a calm minute.\n\n#asmaulhusna #99namesofallah #dhikr #stressrelief #islamictiktok '
      '#muslimtiktok #quranreminder #crochettok #amigurumi')

yt = f"""Title (max 100 characters):
The 99 Names of Allah for a stressed heart 🤍 (knitted dhikr dial)

Description:
Pause for a moment and read the 99 Names of Allah, one at a time, with their meanings. Say each one in your heart.

"{E1328}" (Quran 13:28, Ar-Ra'd, Sahih International)

The Prophet ﷺ said: "{T['hadithEn']}" (Sahih al-Bukhari 7392)

Feeling tired? Come closer to Him. Slowly. That door is never locked.

Made in knitted yarn, stitch by stitch.

#Shorts #AsmaulHusna #99NamesOfAllah

Tags (Shorts > Show more > Tags):
99 names of allah, asmaul husna, asma ul husna, names of allah with meaning, dhikr for stress, dua for anxiety, quran 13:28, remembrance of allah, islamic reminder, knitted animation, crochet animation, amigurumi"""

notes = f"""- Sound: {NOTE}
- The Names, in order: the list in Jami` at-Tirmidhi 3507 (sunnah.com grade: Da'if, Darussalam), the same order the reference uses. The Arabic and the English meanings and transliterations on screen are sunnah.com's own text of that hadith, checked character by character. The list itself is graded weak; the hadith that Allah has 99 Names is sahih (Bukhari 7392, Muslim 2677), and that is the one quoted in the caption. The caption does not say the list is from the Prophet ﷺ.
- #67 Al-Ahad ({T['names'][66]['ar']}): sunnah.com's text of Tirmidhi 3507 has 98 Names, with nothing between Al-Wahid and As-Samad. The reference (like most printed lists) has Al-Ahad there, so it is kept to make 99, taken from Quran 112:1 («{T['ayahAr']}», {T['ayahEn']}), not from the hadith. Its gloss "the One" is ours.
- Some sunnah.com glosses repeat ("the Watcher", "the Guide", "the Kind", "the Powerful", "the Originator" each appear twice) and some are blunt (Ad-Darr "the Harmer", Al-Muntaqim "the Avenger"). They are shown exactly as sunnah.com gives them.
- On-screen English lines (hook, "Finish the dhikr...", "Feeling tired? Come closer to Him. Slowly. That door is never locked.") are translations of the reference's own Indonesian lines, not quotes from any source.
- Quran 13:28 is quoted only in the caption: Uthmani text from api.quran.com, identical code point for code point to Tanzil; English: Sahih International.
- Hashtags: the big ones (#islamicreels, #islamicreminder, #asmaulhusna) are crowded; the exact ones (#99namesofallah, #dhikr, #stressrelief) and her knitted-craft tags sit next to them. Post counts were not measured: check each tag in Instagram search before posting.
- Length: 1:39.6, the reference's full audio. Instagram plays reels up to 3 minutes, so it posts as one reel."""

txt = ('PERSONAL - 99 Names for stress, knitted (for @heal.ingthroughquran)\nShe posts it herself. Nothing here is for the business accounts.\n\n'
       + sec('FIRST-LINE HOOK (frame 0 of the reel shows "ASMA-UL-HUSNA" and "Stressed? Pause and follow His 99 Names to the end")', HOOK)
       + sec('INSTAGRAM CAPTION (copy everything between the lines)', ig)
       + sec('ARABIC CAPTION (optional, for an Arabic post or the first comment)', ar)
       + sec('ALT TEXT (Instagram > Advanced settings > Accessibility)', alt)
       + sec('TIKTOK CAPTION', tt)
       + sec('YOUTUBE SHORTS', yt)
       + sec('NOTES FOR HER (not for posting)', notes))
out.write_text(txt, encoding='utf-8')
print(out, len(txt))
