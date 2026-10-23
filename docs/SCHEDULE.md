# Publishing schedule

<!-- Rendered from outputs/video-pipeline/schedule.json by `python -m app.publish_reel render-md` (from studio/). Edit the JSON, not this file. -->

Owner rule 2026-10-18: one reel per day, scheduled at the best time per platform (docs/BEST_TIMES.md, measured from our own audience data). Never two reels on one day. A reel enters the queue only after its verification passes (`publish_reel check`: videos, covers, SEO copy applied, ManyChat keyword, resource page live, nothing posted yet).

Queue order chosen by the owner 2026-10-18: FDE, STACK, 100 Dreams, MCP.

| Date (GST) | Day | Reel | Job | Keyword | Status |
|---|---|---|---|---|---|
| 2026-10-18 | Sun | SKILL + HARVEST (posted before the rule) | 9d2d68af60d4 / f7da978d101e | SKILL / HARVEST | published |
| 2026-10-19 | Mon | Forward Deployed Engineer 6-week roadmap | 6cff0a62569f | ROADMAP | planned (in verification) |
| 2026-10-20 | Tue | AI startup stack: 14 tools, real costs | 6f8f4ad316a3 | STACK | planned (in verification) |
| 2026-10-21 | Wed | UAE 100 Dreams: $10K for 100 media ideas | 91ac50635d3d | PITCH | planned (in verification) |
| 2026-10-21 | Wed | AI Motion Starter Kit | motion20261020 | MOTION | queued |
| 2026-10-22 | Thu | 5 MCP servers for Claude Code | c366de480853 | (from its spec) | planned (breakdown) |
| 2026-10-23 | Fri | 85 AI Engineering Project Ideas | c9d9bd2b786c | PROJECTS | queued |
| 2026-10-24 | Sat | Claude + Playwright: a job-search shortlist you can verify | 7123480a28ca | JOBKIT | queued |
| 2026-10-25 | Sun | AI Website Transformation: A Better Design Brief | website20261020 | DESIGN | queued |

Per-platform state of queued reels (GST; UTC for the APIs in schedule.json):

| Date | Reel | YouTube Shorts | LinkedIn | Instagram Reels (Collab) | TikTok | Facebook Reels | X |
|---|---|---|---|---|---|---|---|
| 2026-10-21 | MOTION | 12:00 published ([link](https://www.youtube.com/shorts/xnL4IfRhR3E)) | 16:00 missed | 01:44 published ([link](https://www.instagram.com/reel/Deu0-tsmyWm/)) | 17:00 composer_scheduled ([link](https://www.tiktok.com/@hammadyousuf01/video/7698985902042860808)) | 17:00 pending | 18:00 pending |
| 2026-10-23 | PROJECTS | 10:00 published ([link](https://www.youtube.com/shorts/WMhrzmEMJuM)) | 16:00 pending | 17:00 pending | 17:00 composer_scheduled ([link](https://www.tiktok.com/@hammadyousuf01/video/7698724400958278919)) | 17:00 composer_scheduled | 18:00 composer_scheduled |
| 2026-10-24 | JOBKIT | 12:00 scheduled ([link](https://www.youtube.com/shorts/v4okdBQy4-I)) | 10:00 pending | 17:00 pending | 17:00 composer_scheduled ([link](https://www.tiktok.com/@hammadyousuf01/video/7698725535639145735)) | 17:00 composer_scheduled | 18:00 composer_scheduled |
| 2026-10-25 | DESIGN | 12:00 scheduled ([link](https://www.youtube.com/shorts/LBx57qzUrq8)) | 10:00 pending | 2026-10-20 20:00 published ([link](https://www.instagram.com/reel/DeuNwewjXms/)) | 17:00 composer_scheduled ([link](https://www.tiktok.com/@hammadyousuf01/video/7698744181560282376)) | 17:00 composer_scheduled | 18:00 composer_scheduled |

Per-platform posting times (docs/BEST_TIMES.md, decided 2026-10-18 from our own audience data; review 3 Nov 2026):

| Platform | Mon-Fri (GST) | Sat-Sun (GST) | Backup |
|---|---|---|---|
| YouTube Shorts | 12:00 (Fri 10:00) | 12:00 | 14:00 (Fri 09:00) |
| LinkedIn | 16:00 | 10:00 | 11:00 weekdays |
| Instagram Reels (Collab) | 17:00 | 17:00 | 20:00 |
| TikTok | 17:00 | 17:00 | 20:00 |
| Facebook Reels | 17:00 | 17:00 | 20:00 |
| X | 18:00 | 18:00 | 09:00 |

How each platform goes out:

- YouTube Shorts: Uploaded at queue time with privacyStatus private + publishAt = slot; YouTube makes it public itself.
- LinkedIn: Posted by `app.publish_reel run-due --live` at the slot (the Mac must be awake).
- Instagram Reels (Collab): Posted by `app.publish_reel run-due --live` at the slot (no API scheduling; the Mac must be awake); video and cover hosted on withhammad.com/media.
- TikTok: Scheduled with the composer's own Schedule option in the owner's Chrome (Asia/Dubai, so GST as written).
- Facebook Reels: Scheduled with the composer's own Schedule option in the owner's Chrome (Asia/Dubai, so GST as written).
- X: Scheduled at x.com/compose/post in the owner's Chrome (@HammadYousufAI, final_social.mp4, at most 280 weighted characters).

Commands (from studio/): `check <job>`, `apply-seo <job>`, `queue <job> --date YYYY-MM-DD [--live]`, `run-due [--live]`, `mark <job> <platform> <url>`, `status`, `render-md` (`.venv/bin/python -m app.publish_reel ...`). Nothing runs on a timer until the owner enables one.
