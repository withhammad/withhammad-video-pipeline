# JOBS reel release, Mon 16 Nov 2026 (job `studio/.local/jobs/d463f2086d47`, keyword JOBS)

"Claude Job Search Hack: Find Jobs on Company Career Pages" (32.5 s, two-character 3D dialogue, cut approved
2026-11-15). Owner approvals relayed by Pipe Line Master on 16 Nov: "Yes" (release on all 6 platforms today), then
"Post" (post now without the guide page; captions and the JOBS DM link to withhammad.com/resources).

## Where it is

| Platform | URL | Sound |
|---|---|---|
| LinkedIn (API, 9:16, with-music cut) | https://www.linkedin.com/feed/update/urn:li:ugcPost:7528121430765355009/ | own bed; copy rewritten to 10-3-1 |
| X (with-music cut) | https://x.com/HammadYousufAI/status/2122356543807164474 | own bed |
| Instagram @withhammad.ai (Collab @with.hammad accepted) | https://www.instagram.com/reel/DfztmhpD4o8/ | cloud cover · Clim Jiffy, Audio API, audio 10 / video 100; first comment with JOBS + follow ask |
| TikTok | https://www.tiktok.com/@withhammad/video/7708797949928541448 | Marta Salas · Tavern Road at Dawn at -18 dB; custom cover; AI label on |
| Facebook Page reel | https://www.facebook.com/reel/2188061415110729/ | Art Music · November Sky at about 13%; custom cover; AI label on; no link in the caption (Page link limit) |
| YouTube Short (Studio upload, public) | https://youtube.com/shorts/v8n-ZK0by8g | own bed; `allow_no_sound` (owner: "Yes" to posting from Studio with our own music, this Short only); custom thumbnail; AI-use answered Yes; guide + subscribe comment pinned |

## What changed for this release

- **No-music cut:** `master_nomusic.sh` in the job folder: same voice + SFX chain as `master.sh`, bed left out, video
  stream copied from `final.mp4`. -14.0 LUFS, -2.9 dBTP. `final_nomusic_social.mp4` (7 MB) is the copy for browser
  uploads (the Chrome upload limit is 10 MB).
- **Guide page:** `withhammad.com/resources/career-page-job-search-claude` is still 404. Site PR #12 was rebased
  (conflicts in `reel-resources.ts` and `dm-rules.json`); the force-push to its branch was denied, so the same
  commits are in PR #41 (mergeable, Vercel builds pass). Merging is the owner's step. When #41 merges, its JOBS rule
  will conflict with the one on main: keep the guide link from #41.
- **Captions:** every guide link swapped for `https://withhammad.com/resources` ("Every free guide"); the Instagram
  promise changed from "the guide" to "the exact searches and the full prompt". File: `release_captions.json`.
- **JOBS keyword DM:** rule added on site main (commits `9fdf458`, `15086a7`). The DM itself carries the three
  searches and the scheduled-task prompt, then the resources link, so it delivers what the end card promises.
  Not tested end to end: every account I can comment from is the owner's, which the webhook skips.
- **Instagram:** `media_publish` answered 2207032 again and the reel was live (`/media` read back). The Audio API
  script now takes `AUDIO_VOLUME` / `VIDEO_VOLUME`; a dialogue reel needs video 100 and audio about 10.
- **Queue:** all six rows `li/xx/tt/yo/in/fa-d463f2086d47` marked posted in place; the YouTube row carries `allow_no_sound`.
- **YouTube:** descriptions reject the `>` character ("Tools > Past week" made the field invalid and disabled Next); it was reworded. Published only after the checks cleared with no notices (about 16 minutes). The owner's "Yes" answered an either/or question (Studio with own music, or a trending sound from his phone); Pipe Line Master read it as the first option.
