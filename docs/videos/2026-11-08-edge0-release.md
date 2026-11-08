# Release Edge0 on all six platforms

The owner approved the finished Edge0 package and explicitly authorized deploying guide/rule PR #18.
PR #18 merged at 15:30:42 UTC on 8 November 2026, commit `d8ac399b50b0774fa805e22bf30f468062148d9a`.
The first production build failed in Next.js's Google font loader. One redeploy succeeded:
`dpl_EnJhZZEW2ovU7vuk3NNABuPypkMJ`. No content changes were needed.

[Live guide](https://withhammad.com/resources/edge0-local-ai): HTTP 200, expected memory caveat,
one H1 and two structured-data blocks. The deployed EDGE rule matches the exact merge commit and routes to this page.
Instagram/Facebook verification handshake and signed empty webhook events return 200. Correct identities and
comment/message subscriptions verified: @withhammad.ai and With Hammad AI Page. Five positive/negative keyword
cases pass in the website matcher and the shared YouTube/LinkedIn/X/TikTok matcher. This verifies configuration
and routing; no viewer DM or comment was fabricated. Actual EDGE delivery awaits an eligible comment after release.

## Booked slots — Monday 9 November 2026, Dubai time

| Platform | Slot | Execution / proof |
|---|---|---|
| YouTube Shorts | 10:00 | Phone sound window until 12:00; launchd fallback 12:03 |
| LinkedIn | 16:00 | Launchd API at 16:03; `video_variant: linkedin` and matching SRT |
| Instagram | 18:00 | Phone sound window until 20:00; launchd fallback 20:03; Collabs @with.hammad and @hammadagentic.ai |
| Facebook Page | 21:00 | Launchd API at 21:03 |
| TikTok | 21:00 | Native schedule confirmed: [scheduled video](https://www.tiktok.com/@withhammad/video/7705830238797696257) |
| X | 21:00 | Native toast and [scheduled list](https://x.com/compose/post/unsent/scheduled) both confirm the date/time |

These are the next available documented backup hours on 9 November; earlier primary slots are occupied.
Existing, held and posted queue entries were preserved. The queue was appended, never rebuilt. No manual live poster run.
TikTok has the approved custom cover and AI label. X has the approved caption, English SRT and Made with AI label;
paid-partnership disclosure is off. Native schedules were submitted once and verified before marking scheduled.

## Files and checks

- Main approved cut: 30.000 s, 5,329,010 bytes. LinkedIn: 30.000 s, 5,298,839 bytes.
- Instagram export: 30.037333 s, 5,278,347 bytes. Social export: 30.037333 s, 4,962,245 bytes.
- `app.publish_reel check`: zero blockers or warnings; all six `rq.seo_caption` checks pass.
- SEO metadata explicitly uses `presenter: none`: animated owl and screen inserts, no human avatar. The approved
  AI voice-clone disclosure remains in all captions and platform AI flags stay enabled. No publication-check bypass.
- Approved video and SRT copied to `~/Downloads/8 November/EDGE - Run Edge0 locally.*`; six covers in `Thumbnails/`.
- Website media-only commit `63b1d5f` hosts the approved Instagram export and cover. Media verification is in
  `work/edge0/media-live-proof.json`; release record in `outputs/video-pipeline/releases/2026-11-09-edge0.json`.
  Production deployment `dpl_8zMNSkPNEZXj7uEBMkDhNd3mYzr5` is Ready. Both public files return HTTP 200 and
  match their local SHA-256 hashes (video 5,278,347 bytes; cover 328,761 bytes).
- Studio verification: **631 tests passed**, one existing Starlette/AnyIO deprecation warning, 83.14 seconds.
- No new HeyGen credits spent. The approved Edge0 take is unchanged by the later forward-looking REFERRAL voice rule.

## Operational correction

The website clone was left on the merged PR branch during the 20:03 poster run. That blocked Chamber Instagram
and one Facebook post; LinkedIn Chamber and YouTube GROWTH posted. The clone is now clean on updated `main`.
The two pending Meta entries retry at the next normal 21:03 launchd tick, within their existing window.
Do not run the live poster by hand. Keep this publishing clone on `main`; use an isolated checkout/worktree for
future website PRs so an open PR cannot block the live poster.

The poster can overwrite an unguarded concurrent `mark` update. X's confirmed native schedule was re-recorded
under the shared `work/.run-due.lock` after that race; no duplicate native submission. Use the same lock for
all manual append/mark operations and reread the queue immediately before saving.
