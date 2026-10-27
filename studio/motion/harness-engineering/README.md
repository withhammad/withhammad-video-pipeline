# Inside Harness Engineering (keyword HARNESS)

Our version of Leon Jose's LinkedIn post "Agent Harness: the missing layer behind models" (ByteByteGo-style harness diagram GIF), batch 27 Oct 2026 (docs/BATCH_2026-10-27.md, group G5). Same format, layout, colours and motion;
every label and caption is ours, facts checked (job `studio/.local/jobs/harness-engineering`: analysis/breakdown.md, lesson.json
sources_checked, COPY.md). Files: board.html (1080x1350, 3 s icon loop), reel.html (1080x1920, 25 s tour of each layer), sound.json (original bed + SFX via app.audio).

## Rebuild (from `studio/motion/`)

```bash
J=../.local/jobs/harness-engineering
node capture.mjs harness-engineering/board.html --size 1080x1350 --scale 2 --seconds 3 --out $J/board.mp4
node capture.mjs harness-engineering/reel.html --size 1080x1920 --scale 1 --seconds 25 --out $J/reel_silent.mp4
node capture.mjs "harness-engineering/reel.html?cta=comment" --size 1080x1920 --scale 1 --from 21.2 --seconds 3.8 --out $J/reel_tail_comment.mp4
```
Then concat the comment tail onto the first 21.2 s for the @with.hammad Trial Reel, `motion/mix.py` with sound.json,
a 50 ms fade-in (the synth bed's first sample otherwise overshoots +1.5 dBTP after app.exports' AAC re-encode), and
`app.exports` (it writes fixed names: rename the comment exports before exporting final.mp4). LinkedIn GIF: 10 fps,
palettegen stats_mode=diff, paletteuse dither=none, `gifsicle -O3 --lossy`.
