# Long-Form Video Policy (10–60 minute videos)

> **Superseded on 2026-11-17 by `docs/VIDEO_PIPELINE_POLICY.md`, the master policy.** That file is canonical. This one is kept for history only.

Owner's rules, added 2026-11-17. They sit alongside `docs/HEYGEN_CREDIT_POLICY.md`, whose avatar rules (Avatar 6 Turbo, 1080p, Photo Look, render once, no extras, 2,000 credits/month) also apply here.

## Purpose
Long videos (tutorials, walkthroughs, build logs) are mostly screen recording with the owner's voice. The avatar appears only briefly. HeyGen cost stays **under 80 credits per long video**.

## Structure (in this order)
1. **INTRO:** avatar on screen for 45–60 s, where he introduces himself and the topic.
   Reuse the saved intro clip `studio/.local/assets/avatar/intro_master.mp4` whenever the script is unchanged. Render a new intro only when he gives a new intro script.
2. **BODY:** screen recording with voiceover only, no avatar. This is 85–90% of the video.
3. **FACE CUTS:** short avatar clips of 15–20 s at section changes, **at most 5 per video**, for transitions, key points or a summary.
4. **OUTRO:** avatar on screen for 20–30 s with the call to action. Reuse `studio/.local/assets/avatar/outro_master.mp4` when the script is unchanged.

(The owner's paths `/assets/avatar/` and `/input/voice/` map to `studio/.local/assets/avatar/` and `studio/.local/input/voice/`. Those are gitignored, because this repo is public and media must never be committed.)

## Avatar rules (same as the reel policy)
- Avatar 6 Turbo only, 1080p only, Photo Look if available.
- Total avatar screen time per long video: **at most 4 minutes (about 80 credits)**.
- Render each avatar clip once. Fix the script before rendering.

## Voiceover for the body
- **Default:** his own recorded voice (0 credits), from audio files in `studio/.local/input/voice/`.
- **If there is no recording:** use the HeyGen professional voice clone for text-to-speech, and report the credits it will use before generating.

## Assembly
- Stitch the intro, screen recording, face cuts and outro locally with FFmpeg. Never assemble the full video inside HeyGen.
- Match audio levels across the avatar clips and the voiceover before export.
- Export at 1080p, H.264, 30 fps.

## Before rendering
- Print a plan listing each avatar clip with its length and credit estimate, plus the total:
  `python3 tools/heygen_credits.py longform intro=50 cut=18 cut=16 outro=25`. It checks the length ranges, at most 5 cuts, 4 minutes total and 80 credits, and exits 2 if anything fails.
- If total avatar credits go over 80, STOP and ask the owner.
- Reuse cached clips wherever a script matches one already rendered:
  `python3 tools/heygen_credits.py cache <script.txt>` prints the cached clip if one exists for that script's hash.
  After a new render, `python3 tools/heygen_credits.py cache <script.txt> <clip.mp4>` stores it.

## After rendering
- Log each clip: `python3 tools/heygen_credits.py log <clip name> <seconds> [credits] --project <name>`. It appends to `studio/.local/heygen_credits.log` and prints the month's running total.

## Reference-based requests
When the owner shares a reference video, copy its pacing, section structure and intro/outro style, but always apply the rules above for avatar use and credit limits.
