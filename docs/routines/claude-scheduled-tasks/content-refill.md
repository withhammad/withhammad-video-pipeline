---
name: content-refill
description: Every morning: check days of content queued per type, process the next reference links up to the owner-approval gate, and report what is needed
---

Repo: /Users/hammad/withhammad-video-pipeline. Owner rule (2026-11-01): content never stops; every day at least 2 reels, 3 posts and 1 long video, kept 7 days ahead, built from the owner's reference links. Standing rules: nothing is queued for posting without the owner's explicit OK; never enter passwords/2FA; never paste or print secrets; no "AI avatar" text in videos; facts only from verified sources; commit and push every change with the trailer "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>".

Steps:
1. cd studio && .venv/bin/python -m app.refill status  (read coverage, inbox counts, links_needed, actions).
2. If links_needed is 0: report "queue is full" with days ahead per type and stop.
3. Otherwise take `.venv/bin/python -m app.refill next` (at most 2 links). For each link:
   a. `.venv/bin/python -m app.refill mark <url> in_progress`.
   b. Run docs/PIPELINE_PROMPT.md steps 1 and 2 only: studio/run_local.sh run '<url>', the reference-breakdown skill on the job, then the lesson + script (same beats, own words, facts verified, one comment keyword, resource slug). Do NOT record a HeyGen take: step 3 needs the owner's OK on the look.
   c. Draft the glow-grid cover hook (two lines, true to the facts) and add it to studio/remotion/src/brand/glowCovers.ts; render it (node src/brand/render-glow.mjs ../.local/brand-samples/glow <job> from studio/remotion, then python3 remotion/src/brand/make_glow.py from studio).
   d. `.venv/bin/python -m app.refill mark <url> awaiting_approval --job <job>`.
4. Publish one review artifact (Artifact tool) titled "Refill <date>" with, per job: the reference link, the script, the keyword, the cover image path, and the owner decision needed (HeyGen look OK, then record). Commit the pipeline changes (glowCovers.ts, reference-inbox.json) and push.
5. Report in 4 lines: days ahead per type, links processed today and their jobs, how many more reference links the owner should add (from `actions`), and the review link. If the inbox is empty, say exactly how many links are needed and that the owner can add them with: cd studio && .venv/bin/python -m app.refill add '<url>'.
The posts lane (carousels) and long-video lane have no builder yet: report them as gaps, do not improvise posts.