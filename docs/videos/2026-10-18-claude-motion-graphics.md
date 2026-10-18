# Video: "Claude Motion Graphics" (keyword MOTION)

Job `fef5b7f3b5af` · reference: Charlie Hills' LinkedIn post "Claude can (actually) make motion graphics"
(linkedin.com/posts/charlie-hills_claude-can-actually-make-motion-graphics-share-7516599421715853312-aoqC, an animated
GIF grid, flow and look only) · status: **built and verified, awaiting the owner's approval. Nothing posted, nothing
queued.**

Owner direction (2026-10-18): "reel, LinkedIn post, everything; this doesn't need avatar"; "see the post and make
exactly the same". So: the same 4x4 grid of 16 object → change loops and the same six steps, in our own animations,
style file, brief, scene lines and copy. No presenter, no voice.

## The files (all in `studio/.local/jobs/fef5b7f3b5af/`)
| File | What | Checked |
|---|---|---|
| `linkedin_poster.gif` | LinkedIn image post, 1080x1350, 60 frames at 10 fps, 6 s seamless loop | 4.69 MB (under the 5 MB most guides cite; LinkedIn Images API: ≤ 250 frames) |
| `poster.mp4` | the same poster as a crisp 25 fps H.264 loop (6 s) | loop seam 0.28 vs median frame diff 0.47 |
| `final.mp4` | reel 1080x1920, 25 fps, 29.3 s: hook + grid, 16-tile feed, 6 steps, Comment MOTION | −14.0 LUFS, −1.0 dBTP |
| `final_ig.mp4` / `final_social.mp4` | Instagram / TikTok, Facebook, X exports (`app.exports`) | 9.1 MB / 4.2 MB |
| `cover_1080x1920.jpg`, `cover_720x1280.jpg` | covers from the reel's first frame (hook + grid) | |
| `lesson.json` | captions for every platform, keyword MOTION, sources, cover copy | schema-valid |
| `seo/seo.json` | the seo-pack workflow's per-platform copy | see below |

Source: `studio/motion/claude-motion-graphics/` (README.md has the rebuild commands). Sound: original `glow` bed at
80 bpm (every feed cut on a beat) + whoosh, ticks, riser, pops, all synthesized by app.audio.

## What we changed from the reference (owner rule: keep the flow, make it perfect)
- 6 s loops that really loop (theirs: a 5 s GIF over 6 s animations, so tiles jump at the seam); 25 fps video.
- Their step 1 "Set up REA" points to the creator's newsletter method named REA, easy to confuse with the open-source
  REA tool from our BLUEPRINT reel. Ours: step 1 is our own free style-file prompt.
- Their prompts sit behind an email wall; ours are free on withhammad.com via MOTION, plus a zip of all 16 HTML files.
- AED prices for the UAE audience; Stripe's colours, corners and motion only, never its logo, name in-frame or Söhne.

## Facts checked
`analysis/facts.md`: Stripe tokens measured in stripe.com's CSS; Söhne is Klim's commercial typeface (Inter used);
Inter is OFL; LinkedIn Images API GIF limits. The reference's gated files were not used.

## Resource page
`withhammad.com/resources/claude-motion-graphics`: built on branch `resource-claude-motion-graphics` of
withhammad-rebuild (style-file prompt, style file, brief, 16 scene lines, zip download, sources). Not merged: it goes
live only with the owner's OK.

## Open decisions (owner)
1. Approve the reel and the LinkedIn GIF post (or list changes).
2. OK to merge the resource page (makes it live).
3. Queue date: the next free day in docs/SCHEDULE.md is 2026-10-23 (Fri).
4. LinkedIn: post the GIF by hand like the reference (publish_linkedin.py posts video only), or post the reel video
   through the API.
