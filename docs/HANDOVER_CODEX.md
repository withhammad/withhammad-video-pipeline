# Handover to Codex (2026-11-07, from the Claude Code "Pipe Line Master" session)

Codex opens this same folder (`/Users/hammad/withhammad-video-pipeline`), so every path, file name and command below
is exactly what is on disk. Read `AGENTS.md` first (shared rules), then this file, then `docs/PIPELINE_PROMPT.md`
(the reel routine, steps 1-7 incl. 3 = voice/avatar and 5b = exact copy + virality).

## 1. What the owner wants (standing rules, all still in force)

- **Paste a reference link -> rebuild it EXACTLY.** Only his face, his voice, WITHHAMMAD branding, the CTA keyword and
  facts the reference got wrong change. Same hook, beats, screens, logos, pacing, length within 10 %.
- **Voice = the fixed REFERRAL voice and energy.** Latest owner reference (8 Nov):
  https://www.linkedin.com/feed/update/urn:li:ugcPost:7524851759706714113/, job `33d9c1e97156`. Paid HeyGen account
  hammadbhat126, clone `4b02b874862049f69b6034bbdc0fb282`. Verified saved project: ElevenLabs engine, model labelled
  **ElevenLabs v4**, speed **1.1x**, stability **50**, volume 100%, language Detected and no accent override.
  Same voice every time; do not change it to suit the topic. This supersedes v3 / stability 0 / speed 1.2.
  NEVER HeyGen Voice, other TTS, a stock voice for him, or forced pitch/speed changes. Never "Update default settings".
  Compare to the actual REFERRAL recording; clone metadata alone is not an audible likeness check. REPO's v3 take
  was explicitly rejected as "not my voice". Retain the source's energy without changing his identity.
- **Avatar = matching look, minimum credits** (owner 2026-11-07, latest): every reel's look matches its reference 100 %
  (room, light, framing, outfit, pose). Check HeyGen's credit cost for a new look first: free -> make the matching
  look; costs credits -> reuse the closest existing look ("Professional in white shirt").
  Avatar only on the lines the reference says to camera; no face in the reference -> voice only. ONE submit, 720p,
  4 fps filmstrip gate, credits before/after in the job's STATUS.md. Last verified balance: 208 after the authorized REPO correction (9 Nov).
- **Thumbnails:** the glow-grid template (`studio/remotion/src/brand/GlowCover.tsx`, add the job to
  `glowCovers.ts`, render with `node src/brand/render-glow.mjs`), cover on every platform, YouTube 16:9 via GlowWide.
- **Cadence (red line):** every platform every day >= 2 reels + 1 carousel (3 posts). YouTube first (it pays).
  Catch up the same day if a slot is missed.
- **Trending sounds:** APIs cannot add them. Instagram reels and YouTube Shorts wait 2 h after their slot
  (`APP_GRACE` in `studio/app/repost_queue.py`) for the owner to post from the phone app with a sound
  (`python -m app.repost_queue sounds --date YYYY-MM-DD` = daily brief), then post by API without it.
- **Instagram:** posts from @withhammad.ai, Collab invites @with.hammad (main 112K account; the handle flipped to
  @with.hamad and back, the queue retries both spellings) + @hammadagentic.ai. Instagram flagged "possible spam" once
  (new account); the owner still wants 3/day.
- **Nothing posts without the owner's explicit OK** on that reel. "Whichever is finished, schedule them" (2026-11-07)
  approved all reels finished that day.
- **One by one:** at most two reels rendering at once. Every heavy command goes through `studio/heavy.sh <cmd>`
  (shared lock, `work/.heavy.lock`). Twelve parallel renders froze the Mac (16 GB) on 6-7 Nov.
- **Git:** several agents share this checkout and its index. Commit only your own paths:
  `git commit -m "..." -- <paths>` then `git pull --rebase --autostash && git push`. Never `git add -A`, never stash,
  reset or switch branches. Commit subjects: imperative, what shipped. Trailer as in AGENTS.md.
- **Secrets** only in `work/.secrets` (via `studio/set_secret.sh NAME`). Never type passwords/2FA. Never ask the
  owner to paste a key in chat.

## 2. How posting works now

- **Queue:** `outputs/video-pipeline/repost-queue.json` (one entry = one post on one platform at one slot).
  `cd studio && .venv/bin/python -m app.repost_queue status | run-due [--now ISO] | run-due --live | chrome | mark <id> <url> [--scheduled] | sounds`.
- **Poster:** macOS launchd `com.withhammad.repost-run-due` runs `studio/run_due.sh` at :03 every hour 09-21 GST
  (no AI model, so no usage limit can stop it), logs to `work/logs/run-due.log`, commits + pushes the queue.
  Check: `launchctl print gui/$(id -u)/com.withhammad.repost-run-due | grep -E "state|runs|last exit"`.
  The Claude scheduled task `repost-queue-run-due` only verifies posts and refreshes the dashboard. Never run
  `run-due --live` by hand while the timer is active (double-post risk).
- **Instagram, Facebook, LinkedIn, YouTube** post by API at the slot. **TikTok and X** have no free API: each
  `tiktok`/`x` entry is scheduled natively in TikTok Studio / X's scheduler through Chrome, then
  `mark <id> <url> --scheduled` (recipe: `docs/routines/chrome-schedule.md`; delete the WHOLE filename placeholder in
  the TikTok caption).
- **Guard:** an entry with `resource_url` stays pending until that withhammad.com page answers 200 (no keyword DM to
  a 404). Schedule TikTok/X for a reel only after its page is live.
- **Best times** (owner's analytics, `studio/app/slots.json` / `docs/BEST_TIMES_3PERDAY.md`, GST): Instagram 11/14/17
  (20 = carousel), YouTube 09/12/16 (Fri 10/15/18), LinkedIn 09/13/17 (Fri 09/14/17, Sat-Sun 10/14/20), Facebook and
  TikTok 14/17/20, X 09/14/18. Friday nothing 12:15-14:00.
- **New approved reel -> queue:** exports in the job root (`python -m app.exports <job>/final.mp4`),
  `cover_1080x1920.jpg` + `cover_720x1280.jpg` in the job root, `seo/seo.json` with `keyword`, `resource_url`,
  `researched_at`, `sources`, Instagram caption containing "Follow @withhammad.ai so the DM reaches you." and no
  @with.hammad / @hammadagentic.ai; `rq.seo_caption(job, p)` must pass for all six. Then add the slots:
  put rows in `outputs/video-pipeline/new-reels-slot-plan.json` and run
  `cd studio && PYTHONPATH=. .venv/bin/python .local/add_new_reel.py <job>` (it refuses taken slots).
- **Resource page + keyword DM:** a PR on `withhammad/withhammad-rebuild` (resource page + rule in
  `src/content/dm-rules.json`). **Agents cannot merge** (the safety check blocks "merge without review"); the owner
  merges. The failing CI "check" (prompt drift) also fails on main and is not caused by these PRs.

## 3. State at handover (7 Nov 2026, ~20:30 GST)

Queue: 120 pending, 50 scheduled (TikTok/X native), 69 posted, last slot 17 Nov. Timer active (25 runs, last exit 0).

New reels (owner-approved, booked; each waits for its PR to be merged):

| Keyword | Job | Days | Page PR |
|---|---|---|---|
| MODELS (Claude 2.0) | cd157c0bece4 | Sun 8 Nov | #9 |
| ROAST (Roast Room) | 23519e29c243 | Sun 8 Nov | #6 |
| RANK (SEO plugins) | f34ba51f84d9 | Mon 9 Nov | #10 |
| K2 (K2 Horizon) | 619b40c30868 | Mon 9 Nov | #4 |
| FILM | b95794dc72cf | Mon 9 Nov | live |
| WORLD (Rubber World) | 8bcf01ad1b0f | HELD: owner rejected the one-voice cut, chose "back to two voices"; new cut (you + Annie) awaits his re-approval; keep held, do not merge #8 until then | #8 |
| ANIMATE | 6a48be151b7a | Tue 10 Nov | #5 |
| BETTER | dbedc134cc10 | Tue 10 Nov | live |
| VOXEL | 85fb47b66b4b | 10-12 Nov | live (#15 fixes numbers) |
| JOBS (career pages) | d463f2086d47 | HELD until the owner approves the latest 32.5 s cut (deadpan opening building to excited); then set the six entries back to pending | #12 |
| CARTOON | 4a606d94c5cd | Thu 12 Nov | #13 |
| PLANE | 990543b928c4 | Thu 12 Nov | live |
| ROBOT (3D dialogue) | df71c9d45658 | Fri 13 Nov | #11 |
| REFERRAL | 33d9c1e97156 | posted 7 Nov on all six | #7 (URGENT: live reel, DM page 404) |

Open site PRs needing the owner's merge: #4 #5 #6 #7 #8 #9 #10 #11 #12 #13 #14 (LINES / Hairline reel) #15.
TikTok/X for MODELS, ROAST, RANK, K2, WORLD, ANIMATE, ROBOT, JOBS, CARTOON are NOT yet scheduled in Chrome (do it
once each page is live).

In progress:
- `reel-nick-saraev` session: @nick_saraev DfZGREyvPUX = GAME reel, built (39.6 s, commit 0f611a0), sent to the owner, waiting for his OK; then page PR + slots (owner wanted it live today).
- `reel-vish-claude` session: @nick_saraev DfXfZ0GPHy0 (job 3260bdc792c4) for tomorrow, paused: it duplicates the
  DOTS topic; waiting for the owner's "rebuild" or "skip" (recommended: skip).
- @nick_saraev Blender reel (3f33678db749): built, needs the owner's A/B for the take (A recommended), parked.
- Hairline reel (DemnYE2vTUg, job e5c7bfbcd56c): done by session finish-elevenlabs-one-wo, PR #14.
- Inbox `outputs/video-pipeline/reference-inbox.json`: 8 links pending (not started), incl. 2 Nate Herk carousels,
  2nd and 3rd @ashutoshwithclaude reels, @developerlonely, @breakingbreach, @matt_penny_applied_ai, a LinkedIn link.
- Coverage gap: no carousels after the 7 guide carousels; Instagram 3/day ends 17 Nov.

Owner deliverables:
- Folder `~/Downloads/7 November/`: the 14 finished reels (`<KEYWORD> - <title>.mp4`) + the gift +
  `Thumbnails/` (reel covers, YouTube 16:9, `_ALL thumbnails sheet.jpg`). Keep the same names when updating.
- Private gift for his wife (never post): `studio/remotion/src/gift/live.tsx` (KnitNamesLive), output
  `studio/.local/gift-knitted/knitted-names-live.mp4`; 26 Names, each followed by "الله" (plain alif-lam-lam-ha; the
  marked spelling breaks the font), footer "@heal.ingthroughquran | @eternalhidayah01".

## 4. Known problems / don'ts

- Instagram reach is near zero: brand-new account; most Collab invites to @with.hammad are not accepted yet.
- Instagram once returned "Application request limit / spam" on a carousel that still went live: check before retrying.
- Amiri renders Arabic marks wrongly in headless Chrome; use "Al Nile" or "Geeza Pro".
- `gpt-image-2` skill needs the Codex model override (`gpt-6-astra`; the configured default is rejected for ChatGPT
  logins) via a PATH shim, without changing `~/.codex/config.toml`.
- Do not rebuild the queue with `app.repost_queue build`: it would undo the hand re-slotting of 5-7 Nov.

## 5. Latest (7 Nov, ~22:30 GST) — open items for Codex

- **Chamber AI Hub** (@talcai.io DfbvLHmOlhR, job 762cf7fb383a, owner: "most important"): built, 60.8 s, HeyGen Voice
  excited 1.1x (v3 was too slow), credits 546 -> 463. Waiting for the owner: approve as is / re-take two lines (~70 cr) /
  changes. Then page PR + slots on all six platforms.
- **GAME** (@nick_saraev DfZGREyvPUX): built (commit 0f611a0), waiting for the owner's OK; he wanted it live today.
- **@nateherkai DfaNcY1FdlE**: being built in the Claude session "reel-anylancer" (first reel under the matching-look
  rule). If that session is stopped, rebuild from the inbox entry.
- **Dots reel** (@nick_saraev DfXfZ0GPHy0, job 3260bdc792c4): parked; duplicates DOTS; owner to say rebuild or skip.
- HeyGen credits: ~463 of 1,000.
- Claude Code sessions still exist in the desktop app (reel-*); they do nothing unless messaged. Codex owns the
  pipeline from now; Claude sessions should not be given new work.

## 6. Scheduled routines (still running in Claude Desktop) — Codex should take these over

Each routine's full prompt is copied in `docs/routines/claude-scheduled-tasks/<id>.md`. Times are Asia/Dubai.

| Routine | Schedule (cron, local) | What it does |
|---|---|---|
| repost-queue-run-due | `3 9,10,11,12,13,14,16,17,20 2-12 11 *` | Verifies the posts launchd made are live; refreshes the dashboard artifact. Posting itself is launchd, not this. Ends 12 Nov: extend it. |
| content-refill | `30 7 * * *` | Checks days of content queued per type; processes the next inbox links up to the owner-approval gate; reports. |
| linkedin-keyword-replies | `*/30 7-23 * * *` | Reads comments on recent LinkedIn posts in Chrome; replies with the resource link to keyword comments (API cannot). |
| youtube-keyword-replies | `15,45 7-23 * * *` | Polls channel comments via the YouTube Data API (`app.youtube_keyword`); replies with the link. |
| x-keyword-replies | `10 7-23 * * *` | Reads replies under @HammadYousufAI posts in Chrome; replies with the link. |
| tiktok-keyword-replies | `40 7-23 * * *` | Reads comments on @withhammad TikToks in Chrome; replies with the resource path. |

Instagram and Facebook keyword DMs do NOT need a routine: they run on the website webhook
(withhammad.com/api/instagram/webhook, rules in `src/content/dm-rules.json` of withhammad-rebuild).

Hand-over order: recreate each routine in Codex (its automations) from the copied prompt, run it once, confirm it
works, then ask the owner to disable the Claude task of the same name (Claude Desktop > Scheduled). Until then both
must not reply to the same comment: the routines record replies (`--mark`), so check their state before enabling.

## 7. Open items from the handover — updated 9 Nov 2026

| Reel | Where it stopped | Owner decision needed |
|---|---|---|
| Chamber AI Hub (@talcai.io DfbvLHmOlhR, job 762cf7fb383a, "Dubai reel") | Finished 73.6 s look-1 edit, approved by owner. Exact approved voice, full edit/music/captions/covers, platform exports and Downloads ready. | PR #17 merged; live guide/rule verified. Six slots booked for 8–9 Nov; TikTok and X native schedules confirmed. No further approval needed. |
| GROWTH (@nateherkai DfaNcY1FdlE) | Approved corrected cut, cover, exports and Downloads ready. PR #16 merged and deployed; guide/rule verified. | None: all six releases booked for 8–9 Nov. TikTok 8 Nov 15:00 and X 8 Nov 21:00 confirmed natively. Verify publication and eligible keyword replies after release. |
| HARNESS (LinkedIn dQVK4qeE, job b6b36d9b50b3) | Approved video, LinkedIn variant, seven-page carousel, covers and Downloads ready. PR #16 merged and deployed; both HARNESS routes preserved. | None: six video releases booked for 9–10 Nov; three carousel releases for 11 Nov. LinkedIn selects `video_variant: "linkedin"` and matching SRT. TikTok/X native schedules confirmed. |
| EDGE0 (@repo_xray DfchkCOMAEF, job 6eba3a812294) | Owner-approved 30 s package. PR #18 merged under the owner's explicit deploy instruction; guide and EDGE routing are live. Six releases booked for 9 Nov; TikTok and X native schedules confirmed. Exports and Downloads ready. | No further approval needed. Verify posts and eligible keyword replies after release. See docs/videos/2026-11-08-edge0-release.md for slots and evidence. |
| REPO (@nick_saraev DfeW3F8PIsk, job dfa218634321) | Corrected 45.567 s cut ready using verified REFERRAL clone, ElevenLabs v4 / 1.1x / stability 50. One owner-authorized take cost exactly 3 credits (211 → 208); existing avatar/edit reused. Old v3 cut stays rejected. | Owner approved the corrected package on 9 Nov. Guide/rule PR #20 is ready; owner merge (or explicit merge exception) is still needed before release. Natural pitch differs from REFERRAL’s skit and legacy pause metric is 6.8%; disclosed, no pitch or speech-speed alteration. See docs/videos/2026-11-09-repo-corrected-voice-review.md. |
| AI agent developer roadmap (LinkedIn dDH3f9E4) | Owner approved; PR #19 merged under his explicit exception. Guide/rule live. YouTube Community, LinkedIn and Facebook published 9 Nov. | Instagram returned action/rate restriction 403 / 2207051; no bypass or blind retry. X/TikTok upload requires the ChatGPT Chrome extension file-access switch. No repeat content approval. |
| Vector databases (LinkedIn dJJbWzcy) | Owner approved; PR #19 merged, guide/rule live. YouTube native schedule confirmed for 10 Nov 08:30 GST; IG 09:00, LI 11:00, FB 19:00 in the queue. | Finish X/TikTok native schedules (10 Nov 19:00 GST) once Chrome extension file uploads are enabled. Watch the Instagram restriction; never bypass it. |
| AI guardrails (LinkedIn dEY7GakW) | Owner approved graphic/copy on 9 Nov. Keyword GUARD; zero HeyGen credits. Guide/rule ready in PR #20, deployed previews pass, Lighthouse SEO 100. | Owner merges #20 or explicitly authorizes Codex to merge it. Then verify production and release; no repeat package approval. |
| GAME (@nick_saraev DfZGREyvPUX) | Built, commit 0f611a0, thumbnails sent. | Approve, then page PR + slots. |
| Rubber World (8bcf01ad1b0f) | Two-voice cut (him + Annie), commit 99c60bd; queue entries HELD. | Approve this cut, then set the six entries to pending and merge #8. |
| JOBS (d463f2086d47) | 32.5 s cut with a deadpan opening building to excited, commit d9a11e6; queue entries HELD. | Approve, then set entries to pending. |
| REFERRAL (33d9c1e97156) | Live on all six since 7 Nov; keyword automation ready but needs PR #7 merged. | Merge #7; pick a repost/variant approach (the session offered options). |
| Dots (@nick_saraev DfXfZ0GPHy0, job 3260bdc792c4) | Rejected as a duplicate of the already posted DOTS reel, per the owner. | None. Do not rebuild or spend credits. |

Earlier handover's remaining merge list: withhammad-rebuild #4 #5 #6 #7 #9 #10 #11 #12 #13 #14 #15 (#8 only after the Rubber World OK). Recheck each PR before reporting its current state. #16 and #17 are confirmed merged. Prioritize #7 because REFERRAL is already live.
After each merge: schedule that reel's TikTok and X natively (chrome-schedule.md) and `mark --scheduled`.
Keep the publishing website clone `work/site/withhammad-rebuild` on updated `main`; use a separate checkout
for PR work. A feature branch blocked two Meta uploads at 20:03 on 8 Nov; restored to main, with retries due
at the normal 21:03 tick. Queue append/mark writes must hold `work/.run-due.lock` so the poster cannot overwrite
a native schedule confirmation. Details: docs/videos/2026-11-08-edge0-release.md.

## 8. Keyword-DM automation (every post, every platform) — no ManyChat, no paid tools

Every reel/carousel ships with a comment keyword (e.g. VOXEL) and a guide page on withhammad.com/resources/<slug>.
A comment with the keyword gets the link, the same day the post goes live.

| Platform | How it works | Where |
|---|---|---|
| Instagram (@withhammad.ai) | Website webhook, ManyChat-style: comment keyword -> ask to follow -> "I followed" -> follow check (`is_user_follow_business`) -> DM with the link + public reply "Sent you a DM ✅". | withhammad-rebuild `src/app/api/instagram/webhook/route.ts`, rules in `src/content/dm-rules.json`. Meta app 1098576635873878 (IG app 2225240621741205), fields comments + messages. Vercel env: IG_WEBHOOK_VERIFY_TOKEN, IG_APP_SECRET, IG_USER_ID, IG_ACCESS_TOKEN (update IG_ACCESS_TOKEN whenever the IG token is refreshed). |
| Facebook Page (With Hammad AI, 1394106800452348) | Same webhook (`object: page`): Messenger private reply with the link + comment reply. No follow check. | Same route. The app needs its own `object=page` subscription via /{app}/subscriptions. |
| YouTube | `cd studio && .venv/bin/python -m app.youtube_keyword run` (Data API, force-ssl scope) replies to keyword comments with the link. | Routine youtube-keyword-replies. |
| LinkedIn | Free API cannot read/write comments (403). Routine reads comments in Chrome and types the reply; `python -m app.linkedin_keyword` gives watchlist/rules/dedupe; record with `--mark`. | Routine linkedin-keyword-replies. |
| X / TikTok | Chrome routines via `app.linkedin_keyword --platform x|tiktok` (TikTok cannot hold clickable links: reply names the path + "link in bio"). | Routines x-keyword-replies, tiktok-keyword-replies. |

Adding a rule: `cd studio && .venv/bin/python -m app.dm_rules add --keyword KEY --link https://withhammad.com/resources/<slug> [--media-id ID]`
(writes `work/site/withhammad-rebuild/src/content/dm-rules.json`; live with the next site deploy, so it rides in the
resource-page PR). Keywords are 4-10 letters. A common word (e.g. MODELS) should be pinned to the post's media id.
Every post that invites a keyword MUST have its rule live before it posts; the queue guard waits for the page.
Pinned comment / description: guide link + follow/subscribe ask (YouTube links use `?sub_confirmation=1`).

## 9. Runbook: what to do every time the owner pastes a reference link

1. `curl -s -A "Mozilla/5.0" <link> | grep og:url` to see the creator; check `outputs/video-pipeline/reference-inbox.json`
   and existing jobs for a duplicate TOPIC (e.g. the dots reel) and ask before spending credits on a duplicate.
2. `cd studio && .venv/bin/python -m app.refill add "<link>" --note "Owner pasted <date>[; priority]"`; commit the inbox.
3. Build it (one or two at a time; heavy work through `studio/heavy.sh`): `docs/PIPELINE_PROMPT.md` steps 1-6:
   intake `studio/run_local.sh run '<link>'`, reference-breakdown, script (same beats, facts verified), matching avatar
   look + his HeyGen voice (section 1), edit (reel skills pack, HyperFrames, Remotion), video-check, step 5b exact copy +
   `virality.md`, glow cover (`glowCovers.ts` + `render-glow.mjs`), seo-pack. `python -m app.refill mark <link> in_progress --job <job>`.
4. Send the owner final.mp4 + cover sheet + copy; mark `awaiting_approval`; STOP until he says OK.
5. After OK: `python -m app.exports <job>/final.mp4`; covers 1080x1920 + 720x1280 in the job root; seo.json with
   keyword, resource_url, researched_at, sources, Instagram follow line, no retired handles; `rq.seo_caption` passes x6.
6. Resource page + dm rule PR on withhammad-rebuild (resource-page workflow); the OWNER merges it.
7. Book slots at the best times (section 2): add rows to `new-reels-slot-plan.json`, run
   `PYTHONPATH=. .venv/bin/python .local/add_new_reel.py <job>`; mark the inbox `queued`.
8. When the page answers 200: schedule TikTok + X in Chrome (`docs/routines/chrome-schedule.md`), `mark --scheduled`.
9. Copy final.mp4 into the owner's dated Downloads folder (`~/Downloads/<D Month>/<KEYWORD> - <title>.mp4`, covers in
   `Thumbnails/`). After posting, verify each link and that the keyword reply fires; log 24 h / 72 h numbers in virality.md.

## 10. Owner rules that lived only in Claude's memory (summary)

- Polish beyond the reference while keeping its flow; reference visuals exact, logos included; only wrong facts change.
- No "AI avatar" text on screen; branding is only WITHHAMMAD; platform AI labels and caption disclosure stay.
- Thumbnails: click-through first, glow-grid template on every platform incl. X (first frames), strongest-emotion face
  matching the hook, whole head inside the 3:4 / 4:5 / 1:1 crops.
- Automation on every post (section 8); a guide page per reel and carousel; follow-first funnel.
- SEO per platform on every post: researched caption + hashtags per platform (the queue refuses unresearched seo.json).
- Cadence: never stop; per platform per day >= 2 reels + 1 carousel; queue 7+ days ahead; catch up the same day.
- Carousels copy the AI Central paper template (real screenshots, curated lists); carousels go to every platform.
- YouTube first (it pays): every video also on YouTube; pitch long-video ideas; trending sounds via the phone window.
- Profile optimization is a standing job: audit, fix (covers too), test by searching, iterate.
- Reels one by one (max two rendering); excited/aggressive voice; avatar real and low-credit; matching look per reel.
- Instagram posts from @withhammad.ai with Collab invites to @with.hammad (handle has flipped with @with.hamad) and
  @hammadagentic.ai; LinkedIn lives in Chrome "Browser 1"; LinkedIn comment API is 403 (Chrome only).
- Dashboard artifact: https://claude.ai/artifact/YTyT4EaZJAYFWx1vZ1F165 (refreshed by `app.dashboard_data`).
- Never ask him to paste secrets; never post, DM or schedule without his OK; no paid tools without approval.

## 11. How the videos are actually made (the craft) — read these files, do not improvise

Model: use the strongest Codex model (GPT-6 Astra, high effort) for planning, script, edit decisions and code; the
owner's bar is "Claude Opus 5.5 quality". Every step below has a written recipe on disk.

**Recipes to read before the first reel**
- Workflows (Claude workflow scripts; read them as step-by-step specs and do the same steps yourself):
  `.claude/workflows/reference-breakdown.js` (scenes, beats, screens, captions, claims verified -> spec.md),
  `.claude/workflows/seo-pack.js` (per-platform SEO from real search data -> seo.json),
  `.claude/workflows/resource-page.js` (withhammad.com resource page + blog + DM rule, verified, PR).
- Editing skills pack (`~/.claude/skills/<name>/SKILL.md`): video-intake, explainer-video, big-idea-video,
  product-demo, toolkit-video, news-reaction, call-clips, opening-hook, animated-numbers, call-to-action,
  every-format, video-sound, video-check, word-highlight, zoom-cut, behind-my-head, head-pop-out, plus the 20 one-command
  effects (video-effects engine: grid-dive, title-orbit, magnifying-lens, portal, clone-room, infinite-zoom, cube-spin,
  liquid-glass, screen-in-screen, frame-break, tile-tunnel, depth-ui, vertigo, phone-fan, shatter, spotlight,
  pull-back-reveal, ribbon-wrap, zoom-through, head-pop-out). HyperFrames: `~/.claude/skills/hyperframes*`.
  Remotion: `studio/remotion` (compositions per reel in `src/<reel>/`, brand covers in `src/brand/`).
  Rule: one effect per beat, never a stack; 6 effects are known broken on HeyGen footage (see the skill notes).
- Pipeline modules (`studio/app/`): `reel.py`/`main.py`/`worker.py` (intake via `studio/run_local.sh run '<link>'`),
  `heygen.py` (takes), `voice.py` + `voice_gates.py` (voice lane + energy/pause gates), `tighten.py` (silence cuts),
  `edit_explainer.py` / `edit_deskreel.py` / `edit_plan.py` (edits), `screenrec.py` (real screen recordings at 2x),
  `thumbnail.py` (cover sizes), `exports.py` (final_ig / final_social), `carousel.py` / `guide.py` (carousels and guide
  slide videos), `lesson.py`, `dm_rules.py`, `publish_*.py`, `repost_queue.py`, `refill.py`, `dashboard_data.py`.

**Quality gates every reel must pass before the owner sees it** (all of them, with evidence in the job folder)
1. Exact copy (step 5b): side-by-side 1 fps contact sheet vs the reference; length within 10 %.
2. Voice gate: median pitch >= ~170 Hz, range >= ~12 st, first 3 s excited, no long pauses (voice_gates.py).
3. Avatar filmstrip gate (4 fps): lip sync, blinks, natural head/hands, no warping.
4. video-check skill: H.264 limited range, right size, hook on frame 0, safe zones, captions on every word, no flash
   shots, -14 LUFS / true peak <= -1.5 dBTP, music steady to the last frame.
5. virality.md scorecard (hook in 1 s, pattern interrupt by 3 s, change every 1.5-3 s, loopable end, keyword, cover).
6. Covers in every size from the glow template; seo.json passes `rq.seo_caption` for all six platforms.

**Recent owner corrections to respect** (each came from a rejected cut): his voice too flat -> most-intense settings;
"too aggressive at the beginning" on a skit -> match the reference's emotional arc (deadpan opening, then build);
slow replies -> 0.2 s gaps between lines; one-voice re-voice of a two-character skit was rejected -> keep distinct
voices per character (him = clone, the other = a HeyGen stock voice like "Annie - Lifelike"); avatar must match the
reference's room/outfit; thumbnails same template but the face should fit the hook.

**Fixed voice reference (owner, later 8 Nov 2026):** after hearing REPO, "its not my voice". He supplied his
REFERRAL post https://www.linkedin.com/feed/update/urn:li:ugcPost:7524851759706714113/ and said "This is exactly
what you need energy ... Same voice every time, not change the voice." That recording is the authoritative
voice-and-energy reference, not a new content reference. Existing job `33d9c1e97156`, saved HeyGen project
`e2fed2c195b748ecba1c8de796e201ee`, raw take `take/heygen_raw.mp4`. Read-only UI verification found the original
clone `4b02b874862049f69b6034bbdc0fb282` (current label HAMMAD YOUSUF -- 1), ElevenLabs **v4** label, speed 1.1,
stability 50, volume 1, language Detected and no accent override. No defaults changed, no new generation.
Proof: `work/voice-anchor-referral/verified-settings.json`; user sample in outputs/Voice-Reference. REPO used
v3 / stability 0 / speed 1.2 and is rejected despite matching clone metadata. Do not reuse that take or silently
claim a voice match from the ID. Preserve this source's voice/energy across topics. These settings supersede
earlier v3 directions below; the ban on HeyGen Voice remains.

Canonical machine-readable reference: `outputs/video-pipeline/voice-reference.json`. The new Creative Studio
composer initially opened on Eleven Multilingual v2 / speed 1.0 despite the correct clone label: select v4
explicitly and verify every control per take. REPO's corrected script is prepared on task-owned Chrome tab
1913613557 with v4 / 1.1 / stability 50 / volume 100%, English Original. Owner approved one 3-credit take;
asset `cad2bdeda9b54597a380ce7790187400` completed once. Actual balance 211 → 208, exactly 3 credits.
Owner approved the corrected 45.567 s package on 9 Nov. Existing same-script avatar was retimed locally,
with no new avatar spend. Never overwrite the saved REFERRAL project or its audio. See `v4-revision` in the
REPO job and `outputs/video-pipeline/reviews/2026-11-09-repo-referral-voice.json` for measurements. Do not claim
that settings alone guarantee an audible match; natural pitch and the legacy 6.8% pause result are disclosed.

**ElevenLabs-only correction (owner, earlier 8 Nov 2026; v3 settings superseded above):** "In HeyGen use the ElevenLabs, always ... excited ... don't use
the HeyGen voice directly. It's very slow ... never use that one." This revokes every older HeyGen Voice fallback
instruction for Hammad's narration. Use the original clone `4b02b874862049f69b6034bbdc0fb282` through ElevenLabs,
with excited delivery, English Original and the current approved v3 settings. Verify the actual take metadata,
not just the engine label. On job `dfa218634321`, the just-created HeyGen Voice fallback is rejected and must not
enter the edit or avatar render; reuse the existing ElevenLabs take. At the time of this correction no avatar had been submitted. The subsequent camera-only render uses that ElevenLabs audio.
Previously approved/published videos are not replaced by this forward-looking correction.

**Browser correction (owner, 7 Nov 2026):** use the owner's existing Google Chrome window/profile for login and
browser work, in our own tabs. Open the needed login pages there; do not launch a separate Chromium/GStack browser
or a new profile. The owner enters passwords and completes 2FA/captchas himself; verify the signed-in account before
acting and never log out or switch an existing account without his instruction.

**Finished-edit correction (owner, 8 Nov 2026):** a raw HeyGen take is an input, not a finished reel. The GROWTH
preview lacked the reference's edit, animation and music. Rebuild the complete reference scene by scene, including
animations, real screen recordings, captions, transitions and a continuous music bed. Show a cut as ready for
approval only after the assembled reel passes all six gates. A requested raw preview must be labelled as such.
Verify the original clone and excited settings before spending more credits on the GROWTH correction or Chamber
look 1. The owner's 8 Nov instruction authorizes those corrected takes after verification.

**Blender correction (owner, 8 Nov 2026):** build reference 3D animation, cartoon characters and 3D objects in
Blender, render at 1080x1920 / 30 fps, then composite the shots in Remotion or HyperFrames. Free assets only;
paid add-ons require the owner's OK. MCP for Blender 2.2.7 is installed and configured in Codex; the live
localhost:9876 bridge and headless Blender 5.2.3 LTS were exercised successfully. See `docs/BLENDER_CODEX.md`.

**Separate-project correction (owner, 8 Nov 2026):** reference `DfcdfO_sNv8` is for his wife's separate video,
not withhammad. Its just-added inbox entry was removed. Do not intake, schedule or publish it through this pipeline.

**Reference-asset correction (owner, 8 Nov 2026):** do not rebuild every visual from scratch. Cut suitable visual
inserts out of the supplied reference and composite them with Hammad's face, voice, captions, branding and music.
Crop inserts cleanly so another presenter's face or unrelated captions do not remain. Use image generation for
missing assets and Blender for shots that actually need a new 3D build. This later instruction permits reuse of
reference 3D inserts instead of recreating each in Blender. Keep source/timecode records. A requested progress
preview may be shown before the final gates, clearly labelled with what is still unfinished; never call it final.

**Credit and quality correction (owner, 8 Nov 2026):** conserve agent and generation credits while keeping the
finished video excellent. Reuse approved takes and suitable reference assets; check the exact voice, look and
settings before a paid full render. Use small previews where available, then one authorized submit. Build the
animation, captions, compositing and music locally. Saving credits must not produce a flat voice, weak movement,
unfinished edit or missing music. Aim for energetic, natural delivery and expressive movement that fit the
reference and its emotional arc; do not raise pitch or speed mechanically to satisfy a number. Record the actual
credit delta and any settings the provider did not retain. No extra paid render without the owner's authorization.

**Latest approvals and connections (8 Nov 2026):** GROWTH's corrected cut and cover are approved; HARNESS's full
package is approved. Both have platform exports, covers and copies in `~/Downloads/8 November/`. Website PR #16
adds both guides, the GROWTH rule, and shared HARNESS routing without breaking the older HARNESS reel. The owner
explicitly authorized Codex to merge #16: **“Yes, merge PR #16 and continue.”** This is a one-PR exception to his
website merge rule, not blanket authorization for future PRs. Codex merged #16 at 08:45:31 UTC on 8 Nov,
commit `fbf6b8296d553afde50c619c32ed8858de1f92e3`. Production deployment
`dpl_2SbX3BDMgcC3ibJ9pzZsvSMg1Uzh` is Ready on that exact commit. Both new guides return 200 with the expected H1.
HARNESS keeps `/resources/harness-engineering` as its primary reply link; that live landing links to Mini Harness,
and Instagram/Facebook DMs contain both guide URLs. Signed empty webhook events and verification return 200;
all four other platform matchers resolve GROWTH/HARNESS. These checks prove routing, not a fresh customer delivery.

Chamber: the owner explicitly accepted voice take 1794083468342-3 for look 1 despite its 147.37 Hz median. This is
an exception for that sample, not a new global voice target. One completed look-1 project
`ebcd07269e3446c3ba8881577c9b908c`; credits 329 → 243 (86). The owner then approved the finished cut, covers and copy:
**“Approve Chamber package.”** Release is authorized after the DUBAI guide and keyword rule are live; the owner
merges the website PR. The approved master and covers are in the job root and `~/Downloads/8 November/`.
See `docs/videos/2026-11-08-chamber-look1-review.md`; do not ask for this final-package approval again.

Chamber's website PR #17 merged at 07:29 UTC on 8 Nov (commit `3274267`). Production deployment
`dpl_4BzZWzS9CbxiQPLvi1GXN7MfvsjD` is Ready on that exact commit, and the DUBAI guide returns 200.
Instagram and Facebook verification handshake and signed empty events return 200; the correct account/page
subscriptions are active. All four other platform matchers resolve DUBAI to the live guide. This proves wiring,
not a fresh customer delivery; verify actual replies after eligible comments arrive. Publication check has zero
blockers and warnings. Guide Lighthouse: 95 performance / 96 accessibility / 100 SEO.

Owner reported both PRs merged, but GitHub showed #16 still OPEN and conflicting after #17. Resolved the three
shared-file conflicts, preserving Chamber, and rebased the sole own commit to `fae7eb4`. Updated #16 with an exact
force-with-lease. Build, lint, TypeScript and both authenticated preview-page checks pass; deployment is Ready.
The remaining GitHub failure was the same 64 pre-existing prompt-governance violations. The owner then granted
the explicit #16 merge exception above. GROWTH/HARNESS are now booked; no further approval, login or render is needed.

GROWTH booking (GST): YouTube 8 Nov 18:00, Facebook/TikTok 8 Nov 15:00, X 8 Nov 21:00,
Instagram/LinkedIn 9 Nov 12:00. HARNESS: YouTube 9 Nov 14:00, X 10 Nov 10:00,
Facebook/TikTok 10 Nov 11:00, Instagram/LinkedIn 10 Nov 12:00. HARNESS carousel: IG 11 Nov 20:00,
Facebook/LinkedIn 11 Nov 11:00. All Instagram entries invite `with.hammad` and `hammadagentic.ai`.
Instagram/YouTube retain two hours for phone sounds, then the next :03 launchd run publishes without a library sound.
Native TikTok IDs: GROWTH `7705722433147243782`, HARNESS `7705724702609755393`.
X scheduled-list confirmations: GROWTH 8 Nov 21:00 (media `2119353842748022784`), HARNESS 10 Nov 10:00
(media `2119355297726877697`). X media IDs are not public post IDs. Both have English SRTs; GROWTH has the AI label,
HARNESS has no synthetic presenter/narration. TikTok uses approved custom covers; X exposes no custom-cover upload.
See `docs/videos/2026-11-08-growth-harness-release.md`. Fifteen entries appended without rebuilding the queue;
existing and held slots preserved. Studio tests: 631 passed, one existing warning, 72.22 seconds. No generation credits spent.

Chamber booking (GST): YouTube 8 Nov 14:00, Instagram 8 Nov 18:00, LinkedIn 8 Nov 20:00;
Facebook/TikTok 9 Nov 11:00, X 9 Nov 10:00. Instagram invites `with.hammad` and `hammadagentic.ai`.
Instagram/YouTube keep the owner's two-hour phone-sound window; launchd fallback is 20:03/16:03 respectively.
TikTok confirmed scheduled video `7705707818384411905`. X confirms 9 Nov 10:00 AM in its native scheduled list; media ID `2119340734679814144`, English SRT and Made with AI enabled. X exposes no custom-cover upload in this composer. Do not duplicate.
The existing launchd poster is healthy (exit 0), and all six Codex routines remain ACTIVE on Astra/high.

The repost queue now accepts `video_variant: "linkedin"` on an explicitly selected LinkedIn entry, using
`final_linkedin.mp4` and, when captions are declared, `captions_linkedin.srt`. It stops if the selected video or
matching captions are missing; it never silently substitutes the general cut. HARNESS needs this option.
Validation after this release fix: 631 studio tests pass, one existing Starlette/AnyIO deprecation warning.

YouTube reconnect completed on 8 Nov: channel `UCJtrEDGg1R3kNe7t7PQFiEw`, Hammad Yousuf | Claude Code & AI Agents,
upload/read-only/force-ssl scopes verified. Read-only keyword run scanned 500 threads, skipped 7 already recorded,
and found no new eligible keyword comments. Credentials were stored locally with mode 0600; no secrets in logs.

## 12. The editing playbook: which tools for which kind of reference (use EVERY time)

Claude's method on every reference, in this order. Do not skip steps or "simplify" the edit.

**A. Break the reference down first (never edit from memory).** Download it, transcribe it, take a 1 fps contact sheet
and stills of every distinct screen. Write `analysis/spec.md`: every beat with its time, scene type (talking head /
split / full graphic / screen recording / 3D / dialogue), layout, every on-screen word, caption style, transitions,
logos, sound (music, SFX, pauses), the cover, and the claims checked against sources. The rebuild follows spec.md
beat by beat; the 5b side-by-side compares against it.

**B. Pick the build by the reference's format** (all in `studio/`; one Remotion composition per reel in
`studio/remotion/src/<reel>/`, Root registered in its own `index.tsx`, rendered through `studio/heavy.sh`):

| Reference format | Build used (examples in the repo) |
|---|---|
| Talking head + clean motion cards (Apple-style explainer) | explainer-video skill + `app.edit_explainer` (Remotion `Explainer`), apple-style look; animated-numbers for every figure; word-highlight captions. e.g. `src/claude20`, `src/explainer`, `src/claudeedit`. |
| Talking head + big hero objects per noun | big-idea-video skill. |
| Product / tool walkthrough with real screens | product-demo or toolkit-video skill + `app.screenrec` (REAL 2x screen recordings of the same page and action, never mock-ups when the reference shows a real site). e.g. `src/gameskills`, `src/seo3`, `src/k2horizon`. |
| News / "X just launched" reaction | news-reaction skill (headline card, source screenshot, reaction beats). |
| List / tier / "N styles" | tier-list or toolkit-video; one card per item, exact item order and count of the reference. e.g. `src/animstyles`, `src/planeworlds`. |
| Two-character skit / dialogue | Own Remotion comp with two voices (him = HeyGen clone, other = HeyGen stock voice), 0.2 s reply gaps, acted reactions, two-tier captions. e.g. `src/referrals`, `src/careerpages`, `src/roastroom`. |
| 3D characters / 3D world | Three.js scene (`studio/hyperframes/pocket3d`, `src/pocket3d`) or Blender plate (`studio/blender/rubberworld`) + Remotion overlay comp; voxel style in `studio/hyperframes/voxel-reel`. |
| Cartoon / illustrated | generated character poses (gpt-image-2 skill via the Codex model shim) + Remotion (`src/cartoon`). |
| Desk / over-shoulder screen reel | `app.edit_deskreel`. |

**C. Always on top of the build**
- video-intake on every take (cut on true silence only, words.json from the CUT audio, snap cuts to frames).
- opening-hook: readable 2-line hook on frame 0, same words as the reference's hook.
- Effects from the pack only where the reference has a matching transition: one effect per beat, and only the tiers
  that work on HeyGen footage (USE: grid-dive, tile-tunnel, phone-fan, pull-back-reveal; CARE: title-orbit,
  infinite-zoom, shatter, zoom-through, head-pop-out; NEVER: magnifying-lens, cube-spin, liquid-glass, depth-ui,
  vertigo, ribbon-wrap). Engine: `node ~/.claude/skills/video-effects/run.cjs <effect> in.mp4 out.mp4 --check`.
- video-sound: voice at one gain, music ~12 dB under, steady to the last frame, -14 LUFS, true peak <= -1.5 dBTP;
  SFX where the reference has them. call-to-action: comment-keyword ending in the last 2-3 s (no extra seconds).
- every-format: 9:16 master; LinkedIn/feeds use the same build. video-check last, then the glow cover.
- Fonts: Arabic in "Al Nile" or "Geeza Pro" (Amiri breaks marks in headless Chrome); brand fonts in
  `studio/remotion/src/fonts.ts`.

**D. Before sending to the owner:** the six gates of section 11, then send final.mp4 + cover sheet + virality.md +
seo.md, and wait. Every rejection reason goes into this file (section 11, owner corrections) so it never repeats.


### Posting recovery, 9 November 2026

A `failed` queue entry is **not** automatically retried by the next launchd run. Restoring the website clone to
clean main fixes the cause but does not reset that status. Under `work/.run-due.lock`, re-read the queue, verify
that no post was created, preserve the failure history, and rebook only the affected approved entry as pending.
Do not rebuild the queue or run the live poster manually.

Chamber Instagram `in-762cf7fb383a` is rebooked for 9 Nov 13:00 GST (phone sound window; launchd fallback 15:03).
FDE roadmap Facebook `fa-6cff0a62569f` is rebooked for 9 Nov 16:00 GST (launchd 16:03). Both guides return 200;
both publisher dry runs return planned. All other bookings are preserved. Posting clone stays on clean main;
new guide PR #19 uses the managed approved-learning-guides worktree.


### 9 Nov: approved graphics, Community replies and personal-video boundary

- PR #19 merged with the owner’s explicit authorization: merge `c1cf56a5e44624f3143de04cf488adbe344282f5`. AGENTMAP and VECTORS guides return 200; deployed rules match. Signed empty webhook events and the challenge pass, but these do not prove an actual customer DM. YouTube roadmap page had zero comments at the 9 Nov evening check.
- Queue now supports approved single-image posts via `app.publish_graphic` for IG/FB/LI. It verifies identity, image hash, approved copy, guide and rule, and records an attempt before the publish call to prevent an uncertain response causing a duplicate. Native `youtube_image`, `tiktok_image`, `x_image` entries are excluded from the API poster. Full studio suite: 646 passed, one existing deprecation warning.
- YouTube Community comments need the Chrome branch in `youtube-keyword-replies.md`, in addition to the video API. `app.youtube_community` supplies the watchlist; `app.linkedin_keyword reply --platform youtube_community` supplies matching and deduplication. Mark only a reply visibly confirmed in the browser. The YouTube automation remains ACTIVE, GPT-6 Astra/high, :15/:45, 07–23 GST.
- PR #20 contains the approved REPO/GUARD guides and rules. Build, TypeScript, mobile/desktop layout and previews pass, SEO 100; CI has the exact same 64 existing prompt errors as main. Owner merge authorization is still pending.
- Owner explicitly classified Instagram `DfgtetEsqUB` as a **separate personal video**. Keep it out of the business inbox, posting queue, resource website and keyword bots. **Later correction on 9 Nov: remove ALL original video footage and title cards; use only the original audio and captions with Hammad in animated photos. He confirmed “Yes—animate my photos, no HeyGen.”** No speaking avatar, new narration, haze effects or business branding. The corrected cut is `outputs/Personal-Iqbal/Andalus-personal-photos.mp4` in the chat workspace; three generated scenes preserve his saved-photo identity and use gentle camera motion. The earlier `Andalus-personal-edit.mp4` is superseded, not the requested result. Original audio is byte-identical, −14.36 LUFS / −1.51 dBTP. Source/spec in `work/reference-DfgtetEsqUB`; no HeyGen spend or publication authorization.

Browser adapter update, 9 Nov: LinkedIn/X/TikTok automation prompts now use the available CUA controls in existing Chrome; no AppleScript fallback while CUA is available. Schedules, ACTIVE status and GPT-6 Astra/high are preserved. TikTok includes photo posts as well as videos. Chrome file uploads currently need the owner to enable the ChatGPT extension’s “Allow access to file URLs”; this does not prevent reading/replying to comments.

Late 9 Nov reference decisions: `https://lnkd.in/p/d_T7mq6B` repeats the existing EDIT infographic. Owner answered **“Use the existing EDIT package”**; preserve `g2-edit-videos-guide` and its 11 Nov bookings, with no new build or duplicate booking. `DfAtBw1iQj9` overlaps the earlier design-tools reference; owner explicitly answered **“Make an updated follow-up”** (Taste / Awesome Design MD plus Impeccable, Playwright CLI and img2threejs). Repeated `Dfg5JcTvzKZ` is one intake, job `087c5f89b591`: OpenAI API-credit benefit. Official terms confirm eligible Pro/Business plans, not Plus; exact amounts, activation and expiry must be corrected before narration. Both are business references; neither is approved for publication.

**Further personal-video correction, 9 Nov:** the owner then requested an anime/cartoon version of himself actually walking through outdoor scenes and valleys, using Blender or code. A camera pan/zoom over still photos does not satisfy this revision. Keep the original audio and captions. He reiterated it is personal and must not be posted on his business accounts. The photo cut is now a superseded preview; build a character walking cycle and deliver the rendered personal file only.

Personal anime implementation: `studio/blender/personal-iqbal-anime/build.py` builds a 17-bone illustrated character walking cycle in headless Blender 5.2.3 LTS. Remotion `PersonalIqbalAnime` composites the moving character through terrace/valley/river/courtyard scenes. Current target file is `outputs/Personal-Iqbal/Andalus-anime-walking.mp4`, superseding both earlier versions. Keep it personal; never place it in the business inbox or queue. The live Blender MCP bridge was unavailable during this revision; the headless renderer worked.


### 9 Nov: owner rejects the personal anime character and movement

The owner rejected `Andalus-anime-walking.mp4`: “It's totally ridiculous that you have made the funny cartoon here”; “scenery is good”; “It's totally rejected.” Keep the scenery, original recitation/music and captions. Discard the illustrated character treatment. The frontal skinned cutout and lateral translation looked stiff and comic rather than a believable person walking through the scene. Those are our production findings, not a passing visual gate. Bone counts, complete frames and passing codec/audio checks do not establish good animation. Do not present this version again as finished, approved or current.

The requested replacement remains a personal Blender/code animation with dignified proportions, recognisable Hammad identity, natural movement, correct foot contact, directional walking and coherent scene lighting. Prove the character and motion in a short preview before another full-length render. No HeyGen, new narration, paid generation without explicit authorization, or business publishing.
