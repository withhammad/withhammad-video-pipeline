# How an AI Agent Works (keyword LOOP)

Our version of Basia Kubicka's LinkedIn post "The fastest way to actually understand AI Agents" (black flowchart GIF that builds, then holds), batch 27 Oct 2026 (docs/BATCH_2026-10-27.md, group G5). Same format, layout, colours and motion;
every label and caption is ours, facts checked (job `studio/.local/jobs/agent-loop`: analysis/breakdown.md, lesson.json
sources_checked, COPY.md). Files: board.html (1080x1350, 16 s build then hold), reel.html (1080x1920, 20 s follow-cam), sound.json (original bed + SFX via app.audio).

## Rebuild (from `studio/motion/`)

```bash
J=../.local/jobs/agent-loop
node capture.mjs agent-loop/board.html --size 1080x1350 --scale 2 --seconds 20 --out $J/board.mp4
node capture.mjs agent-loop/reel.html --size 1080x1920 --scale 1 --seconds 20 --out $J/reel_silent.mp4
node capture.mjs "agent-loop/reel.html?cta=comment" --size 1080x1920 --scale 1 --from 12 --seconds 8 --out $J/reel_tail_comment.mp4
```
Then concat the comment tail onto the first 12 s for the @with.hammad Trial Reel, `motion/mix.py` with sound.json,
a 50 ms fade-in (the synth bed's first sample otherwise overshoots +1.5 dBTP after app.exports' AAC re-encode), and
`app.exports` (it writes fixed names: rename the comment exports before exporting final.mp4). LinkedIn GIF: 10 fps,
palettegen stats_mode=diff, paletteuse dither=none, `gifsicle -O3 --lossy`.
