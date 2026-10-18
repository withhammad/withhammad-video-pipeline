# Claude Motion Graphics (job fef5b7f3b5af)

Our version of Charlie Hills' LinkedIn post "Claude can (actually) make motion graphics" (2026-10-18; reference GIF and
notes in `studio/.local/jobs/fef5b7f3b5af/analysis/`). Same flow and look: a 4x4 grid of 16 Stripe-style loops, each
labelled "object → change", plus the six steps. Every tile, the style file, the brief and the scene lines are ours.

| File | What it is |
|---|---|
| `style.md` | the style file Claude Code wrote from stripe.com's public CSS (colours, corners, shadow, motion; no logo, no Söhne) |
| `brief.md` | the motion brief that goes under the style file |
| `style-file-prompt.md` | the prompt that makes a style file for any brand (steps 1-3) |
| `scenes.js` / `scenes.md` | the 16 one-line scenes (step 5) |
| `tiles/*.html` | the 16 animations: open any of them by double-click; 6 s seamless loops |
| `poster.html` | 1080x1350 LinkedIn image post (the reference layout) |
| `reel.html` | 1080x1920, 29.25 s reel for Instagram, TikTok, YouTube Shorts, Facebook and LinkedIn video |
| `sound.json` | music bed + SFX cues for the reel (synthesized by app.audio: no samples) |

Shared runtime in `studio/motion/`: `tokens.css` (the style file as CSS variables), `motion.js` (the 6 s loop and
`window.__seek`), `capture.mjs` (frame-exact headless capture), `mix.py` (sound + -14 LUFS master), `fonts/` (OFL).

## Rebuild (from `studio/motion/`)

```bash
J=../.local/jobs/fef5b7f3b5af
node capture.mjs claude-motion-graphics/poster.html --size 1080x1350 --scale 2 --seconds 6 --out $J/poster.mp4
node capture.mjs claude-motion-graphics/reel.html --size 1080x1920 --scale 1 --seconds 29.25 --out $J/reel_silent.mp4
cd .. && .venv/bin/python motion/mix.py motion/claude-motion-graphics/sound.json .local/jobs/fef5b7f3b5af/reel_silent.mp4 .local/jobs/fef5b7f3b5af/final.mp4
.venv/bin/python -m app.exports .local/jobs/fef5b7f3b5af/final.mp4
```

The poster renders at about 1.3 s a frame (16 live tiles at 2x), the reel at about 1 s a frame.
To check one moment: `node capture.mjs <page> --size WxH --still out.png --at <seconds>`.
