# Handover to Codex (2026-11-07, from the Claude Code "Pipe Line Master" session)

Codex opens this same folder (`/Users/hammad/withhammad-video-pipeline`), so every path, file name and command below
is exactly what is on disk. Read `AGENTS.md` first (shared rules), then this file, then `docs/PIPELINE_PROMPT.md`
(the reel routine, steps 1-7 incl. 3 = voice/avatar and 5b = exact copy + virality).

## 1. What the owner wants (standing rules, all still in force)

- **Paste a reference link -> rebuild it EXACTLY.** Only his face, his voice, WITHHAMMAD branding, the CTA keyword and
  facts the reference got wrong change. Same hook, beats, screens, logos, pacing, length within 10 %.
- **Voice = his HeyGen clone, always.** HeyGen Creative Studio > Voice, account hammadbhat126 (paid, in Chrome),
  HAMMAD YOUSUF clone. Most intense (owner's pick): engine ElevenLabs, model v3, Stability minimum, Speed 1.2x,
  `[excited]` / `[shouting]` tags. Fallback: engine "HeyGen Voice", Tone Excited, Expressiveness 1.0, 1.1x,
  Similarity 2, key words in CAPS + "!". Check the voice language is **English · Original** (it was found on Italian).
  Never "Update default settings". Gate: median pitch >= ~170 Hz, range >= ~12 semitones, hook = most excited line.
  No other TTS for his lines (no Chatterbox, Kokoro, `say`, stock ElevenLabs).
- **Avatar = minimum credits.** Look "Professional in white shirt" (approved, reuse it; never a new look per reel).
  Avatar only on the lines the reference says to camera; no face in the reference -> voice only. ONE submit, 720p,
  4 fps filmstrip gate, credits before/after in the job's STATUS.md. Credits left ~577 of 1,000.
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
| WORLD (Rubber World) | 8bcf01ad1b0f | Tue 10 Nov | #8 |
| ANIMATE | 6a48be151b7a | Tue 10 Nov | #5 |
| BETTER | dbedc134cc10 | Tue 10 Nov | live |
| VOXEL | 85fb47b66b4b | 10-12 Nov | live (#15 fixes numbers) |
| JOBS (career pages) | d463f2086d47 | 11-12 Nov | #12 (owner hasn't OK'd the 31.8 s re-cut yet) |
| CARTOON | 4a606d94c5cd | Thu 12 Nov | #13 |
| PLANE | 990543b928c4 | Thu 12 Nov | live |
| ROBOT (3D dialogue) | df71c9d45658 | Fri 13 Nov | #11 |
| REFERRAL | 33d9c1e97156 | posted 7 Nov on all six | #7 (URGENT: live reel, DM page 404) |

Open site PRs needing the owner's merge: #4 #5 #6 #7 #8 #9 #10 #11 #12 #13 #14 (LINES / Hairline reel) #15.
TikTok/X for MODELS, ROAST, RANK, K2, WORLD, ANIMATE, ROBOT, JOBS, CARTOON are NOT yet scheduled in Chrome (do it
once each page is live).

In progress:
- `reel-nick-saraev` session: @nick_saraev DfZGREyvPUX, owner wants it live TODAY on every platform.
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
