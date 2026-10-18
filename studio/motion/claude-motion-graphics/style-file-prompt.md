# Style-file prompt (step 1-3: run once per brand)

Open Claude Code in an empty folder and paste this, with the brand's website in the first line:

```
Read the public website https://[BRAND].com: download the home page HTML and every stylesheet it links,
then write style.md: the brand's look as rules another model can follow. Measure, don't guess:
count the colours, radii, shadows, easings, durations, fonts, weights and letter-spacing that actually
appear in the CSS and keep the most used ones.

style.md sections: Colour (ink, brand, dark and light surfaces, accents, and the brand gradient in order),
Shape (corner radii by size, the shadow), Type (font; if it is a paid font, name the closest free one),
Motion (the main cubic-bezier, durations for small things and panels, how things enter and settle).
Under 40 lines. Hex values and numbers only, no adjectives without a number.
Never copy the logo, the brand name, photos or the paid font itself.
```

Then put `brief.md` under `style.md` and add one scene line per animation (see scenes.md).
