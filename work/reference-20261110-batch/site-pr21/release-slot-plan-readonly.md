# HIGGS + ADVISOR release timing — read-only decision brief

Snapshot: 11 November 2026, 06:24–06:45 GST. No queue, booking, platform, DM or schedule changes made. Recheck current time and fresh queue before any action. Production guide merge/deployment is owned by root.

## Actual rules and implementation

- `docs/BEST_TIMES_3PERDAY.md:15–18`: “A platform’s slots are at least 3 hours apart.” The document header still says proposal, but `studio/app/slots.json:2,13–14` records it as decided on 24 October, `min_gap_hours: 3`, explicitly **per platform**. It concerns separate reels on the same platform, not one job across platforms. The standard LinkedIn carousel11 between reels09/13 proves the three-hour rule is not universal between every format; carousels must not occupy a reel slot.
- Latest master requires same-day catch-up and at least two reels plus a carousel. It does not explicitly revoke the spacing rule, authorize moving existing bookings, or permit rolling these jobs beyond 11 November.
- There is **no `repost_queue.book` function or CLI command**. Current CLI has status/build/chrome/mark/sounds/run-due. `studio/.local/add_new_reel.py` checks duplicate job/platform IDs and exact `(platform, slot_utc)` collisions only, not spacing or fallback collisions. `min_gap_hours` is not consumed elsewhere in studio. The separate legacy `publish_reel._free_slot` reserves a whole daily slot index across jobs; it does not independently enforce rolling platform gaps.
- `repost_queue.py:53–56,84–99`: Instagram and YouTube wait two hours for the owner’s app/sound post. The hourly launchd runner fires at :03 from09 through21. Thus08 nominal normally falls back10:03, not10:00. A manual post must be marked before fallback to prevent a duplicate. Failed entries are not blindly retried.
- Strict fallback-aware spacing requires room for the entire manual/fallback window. A nominal three-hour separation can produce a one-hour actual gap (first fallback13:03, next manual14:00). Do not claim the nominal check proves actual gaps.

## Existing 11 November reservations (all GST)

| Platform | Existing active reservations | Held reservation retained |
|---|---|---|
| Instagram | LINES11 (fallback13:03), VOXEL14 (16:03), EDIT17 (19:03), HARNESS carousel20 | — |
| YouTube | LINES09 (11:03), VOXEL12 (14:03), EDIT20 (fallback22, outside runner window) | — |
| Facebook | HARNESS carousel11, LINES14, VOXEL17, EDIT20 | — |
| LinkedIn | HARNESS carousel11, LINES17 | JOBS13 |
| TikTok | LINES14 pending, EDIT17 natively scheduled | JOBS20 |
| X | LINES09 pending, EDIT14 natively scheduled | JOBS18 |

REFERRAL rows retain 11 November slot labels but were actually posted on7 November (`posted_at`). They are not additional11 November bookings and must never be reposted. Held JOBS slots are treated as reserved; this plan does not reuse them or unhold the reel.

Existing issue: EDIT’s YouTube20 sound fallback would be22, outside the09–21 runner. Flag it separately; do not quietly move it or shorten the sound window.

## Today: what fits without moving other reservations

| Platform | HIGGS candidate | ADVISOR candidate | Qualification |
|---|---|---|---|
| Instagram |08:00 manual only |No complete safe window |08 fallback10:03 is less than3h before existing11 manual. Safe only if owner actually posts by08 and marks it before fallback. Do not book it as an unconditional safe automatic slot. |
| YouTube |16:00 manual only |No complete safe window |16 is1h57 after existing VOXEL fallback14:03; HIGGS fallback18:03 is1h57 before EDIT’s manual20. Depends on actual existing post timing; not guaranteed. |
| Facebook |09:00 (runner09:03) |None today |Five hours before existing14 reel; carousel11 is a separate format and not an exact collision. Off-primary catch-up choice. |
| LinkedIn |09:00 (09:03) |20:00 (20:03) |Existing17 reel →20 fallback is3h; keep JOBS13held.20 is off-primary. |
| TikTok |08:00 |11:00 |Native schedules;08→11→14→17 are3h apart.08 is off-primary;11 is documented backup. |
| X |21:00 |None today |Three hours after held18; documented backup. |

**No unconditional all-six same-day plan exists for both jobs under the current reservations, three-hour actual gaps and full sound windows.** The conditional IG/YT rows must not be silently treated as green. Root can request one explicit timing decision: reprioritize named older bookings, authorize a spacing exception, or allow later dates. Nothing here is approval to do any of those.

## Future-date exception: fallback-safe candidate plan

These are concrete review options, **not authorized rollover/bookings**. They preserve current active and held reservations and choose supported slots where possible. The earliest clock opening is noted when the better measured slot is later.

| Platform | HIGGS | ADVISOR | Sound/fallback and rationale |
|---|---|---|---|
| Instagram |17Nov17:00 |18Nov11:00 |HIGGS17–19:03 after existing11–13:03. ADVISOR11–13:03 next day. Earliest clock opening is17Nov16:03, and18Nov08, but17/11 are supported primary slots. There is no earlier full safe window with current daily11/14/17/20 reservations. |
| YouTube |13Nov16:00 |14Nov09:00 |Friday backup16–18:03 clears existing10–12:03 by nearly4h. Saturday09–11:03 clears existing16. A nominal12Nov19 fallback21:03 is only57min after existing16 fallback18:03 if manually posted19, so it is NOT safe. |
| Facebook |11Nov09:00 |15Nov11:00 |Next days12–14 are saturated by11/14/17/20 reel reservations.15Nov11 is a documented backup3h before14; earliest clock opening that day09. |
| LinkedIn |11Nov09:00 |11Nov20:00 |No rollover needed on this platform; above qualifications apply. |
| TikTok |11Nov08:00 |11Nov11:00 |No rollover needed; native confirmation required before local mark. |
| X |11Nov21:00 |12Nov14:00 |12Nov09 and18 are reserved;14 is primary and has5h/4h gaps. Earliest clock opening12:00. |

This splits releases across dates and would need an explicit owner exception to the11November scope. If the owner wants both complete packages to launch together across platforms, the first roomy calendar day after all listed queues is18November; that is a separate date decision, not an automatic plan.

## Prerequisites and intended commands for root

1. Merge/deploy PR21 only under the owner’s explicit merge instruction; confirm both production guide URLs200 and both keyword rules in deployed main. Do not send a live test DM. `curl -I https://withhammad.com/resources/claude-higgsfield-video-setup` and the corresponding `/claude-fable-advisor-setup` URL are read-only.
2. Both approved job-root `final.mp4`, `final_ig.mp4`, `final_social.mp4` and `captions.srt` already hash-match referral-v4. All12 `rq.seo_caption` checks pass. Both lesson files had `caption_file=None` at this audit; root is setting absolute job-root SRT paths so LinkedIn actually uploads subtitles. Keep the approved covers, synthetic-media labels and IG Collab invitations to with.hammad/hammadagentic.ai.
3. Resolve timing choice and refresh the queue. Save only the agreed rows to `outputs/video-pipeline/new-reels-slot-plan.json`, with job/platform/day/slot/slot_utc. Do not use the unapproved candidate JSON as an executable booking plan.
4. Hold `work/.run-due.lock` with atomic mkdir while appending the agreed plan and running the two add commands. If busy, wait; never remove another process’s lock. From studio: `PYTHONPATH=. .venv/bin/python .local/add_new_reel.py ee41d72bf8cd` and `PYTHONPATH=. .venv/bin/python .local/add_new_reel.py 62eec03e1e93`. Release your lock in a finally block. This helper does not enforce3h spacing; re-audit before calling it.
5. Read-only after booking: `.venv/bin/python -m app.repost_queue sounds --date 2026-11-11` and `.venv/bin/python -m app.repost_queue chrome`. Give the owner exact IG/YT manual times, fallback times, files, covers and copy. Never run `run-due --live` manually or rebuild the whole queue.
6. TikTok/X: schedule via the owner’s native authenticated UI only after guide/rules live. Confirm visible account/date/GST time/copy/cover/AI setting and platform success first. Then, under the same lock, mark only the corresponding confirmed IDs: `python -m app.repost_queue mark tt-ee41d72bf8cd <confirmed-url> --scheduled`, `tt-62eec03e1e93`, `xx-ee41d72bf8cd`, `xx-62eec03e1e93`. These are templates, not already confirmed schedules.
7. If the owner posts IG/YT during the sound window, mark the corresponding `in-...` or `yo-...` ID with the actual post URL under lock, without `--scheduled`, before fallback. Confirm no duplicate before any retry.

## Known connection limitations (no new network/auth tests)

- YouTube: OAuth reconsented8November, verified channel/scopes; no missing auth currently known. Captions permission was verified then; do not assume the upload implementation automatically attaches the SRT.
- LinkedIn: identity/post scope verified; expiry recorded30December. Root must set caption_file as above.
- Facebook Page: recorded valid Page token and publishing permission. Use With Hammad AI Page, not personal profile.
- Instagram withhammad.ai: token/identity recorded valid, but recent publish attempts include2207051 action/rate restriction and2207032 media failures. The owner’s10November manual REPO post is not proof that API restrictions are cleared. Do not blind-retry or bypass restrictions. Manual sound workflow is the normal owner path, not an invitation to evade a platform block.
- TikTok/X: native sessions recorded, but not reverified during this read-only task. Earlier handover flagged extension file-access permission; later uploads may have resolved it. Check current UI capability when root schedules; do not ask for new tokens speculatively.

Evidence files: `release-slot-candidates.json` contains a **nominal-only earliest-clock scan** and flags; it is superseded by this fallback-aware analysis. `release-slot-plan-strict.json` contains the explicit future-exception plan. Neither is the live queue.


## Root follow-up

Both approved job-root `lesson.json` files now point `caption_file` to their existing absolute `captions.srt` paths. This repairs the LinkedIn subtitle prerequisite without changing the approved media or copy. Owner decisions requested: PR #21 merge; prioritize this batch by moving older bookings, or allow this batch beyond 11 November. No queue writes have been made.
