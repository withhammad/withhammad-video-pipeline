# 9 Agentic AI Concepts (keyword AGENTIC)

Our version of Chandra Sekhar's LinkedIn post "9 Agentic AI concepts everyone must know" (animated 3x3 GIF), batch 27 Oct 2026 (docs/BATCH_2026-10-27.md, group G5). Same format, layout, colours and motion;
every label and caption is ours, facts checked (job `studio/.local/jobs/agentic-concepts`: analysis/breakdown.md, lesson.json
sources_checked, COPY.md). Files: spec.js (the 9 cards: wording, diagrams, Lucide icons), board.html (1080x1350, 14.4 s seamless loop), reel.html (1080x1920, 30 s fly-through), sound.json (original bed + SFX via app.audio).

## Rebuild (from `studio/motion/`)

```bash
J=../.local/jobs/agentic-concepts
node capture.mjs agentic-concepts/board.html --size 1080x1350 --scale 2 --seconds 14.4 --out $J/board.mp4
node capture.mjs agentic-concepts/reel.html --size 1080x1920 --scale 1 --seconds 30 --out $J/reel_silent.mp4
node capture.mjs "agentic-concepts/reel.html?cta=comment" --size 1080x1920 --scale 1 --from 25.6 --seconds 4.4 --out $J/reel_tail_comment.mp4
```
Then concat the comment tail onto the first 25.6 s for the @with.hammad Trial Reel, `motion/mix.py` with sound.json,
a 50 ms fade-in (the synth bed's first sample otherwise overshoots +1.5 dBTP after app.exports' AAC re-encode), and
`app.exports` (it writes fixed names: rename the comment exports before exporting final.mp4). LinkedIn GIF: 10 fps,
palettegen stats_mode=diff, paletteuse dither=none, `gifsicle -O3 --lossy`.
