# Ayat al-Kursi: the centre (job 50bd2b67399d)

Our version of the @erkm.notes reel "Ayat al-Kursi has a secret centre" (instagram.com/reel/DednHCnNgTy), for a
separate account the owner will name. Not for upload from this pipeline (owner, 2026-10-18).
Breakdown and verified facts: `studio/.local/jobs/50bd2b67399d/analysis/visual.md` and `facts.md`.

| File | What it is |
|---|---|
| `verse.json` / `verse.js` | Al-Baqarah 2:255, Uthmani text from api.quran.com, split at its 8 pause marks into 9 lines; Pickthall's translation (1930, public domain) split the same way. Generated, never retyped: the build checks the English rejoins to the API text. |
| `reel.html` | 1080x1920, 88 s timeline: hook ring, the hadith (Sahih Muslim 810), the verse's shape, four pairs, the centre, Ibn Kathir's ten sentences, the rings, the end card. `ACCOUNT` at the top sets the end-card handle. |
| `sound.json` | drone bed (no melody, no instruments) + whooshes, ruler ticks, pops and risers, all synthesized by app.audio |

Fonts (OFL, in `studio/motion/fonts`): Amiri Quran (a colour font: `font-palette` forces one colour per line),
Space Grotesk, Source Serif 4, JetBrains Mono.

## Rebuild (from `studio/motion/`)

```bash
J=../.local/jobs/50bd2b67399d
node capture.mjs ayat-al-kursi/reel.html --size 1080x1920 --scale 1 --seconds 88 --out $J/reel_silent.mp4
cd .. && .venv/bin/python motion/mix.py motion/ayat-al-kursi/sound.json .local/jobs/50bd2b67399d/reel_silent.mp4 .local/jobs/50bd2b67399d/final.mp4
.venv/bin/python -m app.exports .local/jobs/50bd2b67399d/final.mp4
```

## Content rules for this reel
- The Arabic only ever comes from verse.js. Any change to the Arabic is a change to the source data, checked against
  the mushaf text from quran.com, never a manual edit.
- The Clear Quran (the reference's translation) needs its publisher's written consent; Pickthall is public domain.
- The ring structure is a scholarly reading (Farrin 2014, Azaiez 2013): credit it on screen, do not present it as a
  ruling.
