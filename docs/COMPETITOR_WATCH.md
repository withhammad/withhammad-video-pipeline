# Competitor watch (daily lane)

Owner brief, 2026-11-16: every day read the named competitors' LATEST posts (never old ones), find what is going
viral, and turn it into posts for every platform, with or without a reference link from him.

Code: `studio/app/competitor_watch.py`. State: `studio/.local/competitor_watch/` (git-ignored).
**This repo is public: no competitor data, captions, numbers or reports are ever committed.**

## The rule that decides everything: our own version

We take the **topic, the hook pattern and the format** that is working. We never take their words, their design or
their media. These accounts are direct competitors in the same niche; a badge-swapped copy reproduces their work.
Every build from this lane starts from the brief printed by `python -m app.competitor_watch brief <id>`, which
carries this hard check. A build that fails any line fails review:

- Topic, hook PATTERN and format only. Not one sentence, headline, list wording or on-screen line of theirs.
- WithHammad design system (glow-grid cover, our carousel template). Their layout, colours, illustrations,
  screenshots, logo lock-ups, face and brand are not recreated, traced or badge-swapped.
- No frame, image, audio or music from their post in our render, cover or carousel. The intake copy in the job
  folder is for analysis only.
- Every fact, number and date verified against a primary source we can link. Nothing is true because they said it.
- Our take adds something theirs lacks: our own test, a UAE/operator angle, a correction, a deeper how-to.
- Our own comment keyword, resource page and CTA.
- Their name and handle appear nowhere in our post, caption or file names.
- Side-by-side test: a stranger must not say "same post, different logo".

This overrides the "same beats, exact rebuild" wording of `docs/PIPELINE_PROMPT.md` for every inbox entry with
`"source": "competitor_watch"`. Owner-supplied reference links keep their own rules.

## Sources and how each is read

| Platform | Account | Read from |
|---|---|---|
| LinkedIn | Charlie Hills | `linkedin.com/in/charlie-hills/recent-activity/all/` |
| LinkedIn | GenAI Works | `linkedin.com/company/genai-works/posts/?feedView=all` |
| LinkedIn | Matt Pogla | `linkedin.com/in/matt-pogla/recent-activity/all/` |
| LinkedIn | Nate Herkelman | `linkedin.com/in/nateherkelman/recent-activity/all/` |
| LinkedIn | Jonathan Parsons (added 2026-11-16) | `linkedin.com/in/jonathan-parsons-marketing/recent-activity/all/` |
| LinkedIn | Denis Panjuta (added 2026-11-16) | `linkedin.com/in/denis-panjuta/recent-activity/all/` |
| LinkedIn | Ayan (added 2026-11-16) | `linkedin.com/in/ai-ayan/recent-activity/all/` |
| LinkedIn | Adam Biddlecombe (added 2026-11-16) | `linkedin.com/in/adam-biddlecombe/recent-activity/all/` |
| Instagram | @vaibhavsisinty | `instagram.com/vaibhavsisinty/reels/` (+ stories) |
| Instagram | @sabrina_ramonov | `instagram.com/sabrina_ramonov/reels/` (+ stories) |
| Instagram | @adam.godigital | `instagram.com/adam.godigital/reels/` (+ stories) |
| Instagram | @nick_saraev | `instagram.com/nick_saraev/reels/` |

Secondary sources (YouTube, TikTok, X and the other network of each account) are slots in `ACCOUNTS[...]['secondary']`.
They are empty until each handle is verified by opening the profile; a guessed handle is never written there.

What was tested on 2026-11-16, cheapest path first:

| Path | Result |
|---|---|
| Instagram Graph API `business_discovery` with the Facebook Page token | Refused: `(#10) Application does not have permission for this action`. The token lacks `instagram_manage_insights`. `fetch --apply` tries it every day and uses it by itself once the permission exists. |
| LinkedIn public pages without login | Refused: HTTP 999 (profiles) and 403 (company page). |
| Owner's logged-in Chrome (Claude in Chrome), read-only | Works for all accounts. This is the daily path. |

Chrome pass (one tab, read-only, 5+ seconds between pages, nothing clicked except as noted):

- `python -m app.competitor_watch fetch --apply` prints the work list: the page to open, the extractor to run
  (`js linkedin` / `js instagram`) and the capture file to save.
- **LinkedIn**: open the page, scroll `main` 2-3 times, run the extractor. It returns
  `[age, type, reactions, comments, reposts, caption]` per post (captions only up to 3 days old). The post link is
  not in the page: for a PICK only, run `js linkedin-copylink`, open the post's "..." menu, click "Copy link to
  post", read `window.__cw`, then `resolve <id> <link> --apply`. The owner's clipboard is not touched. The menu also
  holds Unfollow and Report: click by screenshot, never by text match.
- **Instagram**: open the reels tab, run the extractor: `[shortcode, type, age_hours, views]` (the age is decoded
  from the shortcode), then `__igFresh(72, n)` reads likes, comments and caption of each fresh post from its own page.
- The javascript tool returns about 1,000 characters a call, so rows come back in slices.
- Capture file: `{"platform", "account", "captured_at" (ISO with offset), "rows": [...], "fresh": [...]}` then
  `ingest <file> --apply`.
- Stories: opening a story shows the owner's account in that competitor's viewer list. Not done until he says yes.
- Never: typing credentials, following, liking, commenting, DMing, paid scrapers, the owner's cookies in a script.

## Schedule and scoring

Daily 07:30 Asia/Dubai, scheduled task `competitor-watch` (created in dry-run: it scans, scores and reports, and
does not write the inbox or start builds until the owner switches it on).

- Engagement: LinkedIn = reactions + comments + reposts. Instagram reel = views (comment counts are inflated by
  comment-keyword CTAs). Other Instagram posts = likes + comments.
- **vs median pace** = engagement per hour since posting / the median of the same number over that account's posts
  of the last 14 days. **2x or more = breaking out.**
- Pace falls as a post ages, so most fresh posts clear 2x. The second number corrects for that:
  **vs typical post** = engagement so far / the median final engagement of the account's 3-14 day old posts.
  1x or more means it already beat a normal finished post. Those rank first.
- Under 6 hours old = "too early": scored, never picked. Over 72 hours = baseline only, never picked.
- LinkedIn ages come from the label ("1d", "2w"), so they are rounded; Instagram ages are exact.

## Daily output (all local)

- `studio/.local/competitor_watch/<date>.md`: ranked table (account, post, age, engagement, per hour, both ratios,
  flag) plus a reviewer section per top item: why it works, our angle.
- `posts-<date>.json`, `scored-<date>.json`, `picks-<date>.json`, `picked.json` (history), `raw/<date>/`.

## How picks flow into the existing lanes

1. `pick --n 3 --apply`: the top fresh items that are new to us, one per account a day.
2. `inbox --apply`: appends each pick to `outputs/video-pipeline/reference-inbox.json` with
   `"source": "competitor_watch"`, status `pending`. The note holds our pick id only (that file is committed).
3. The existing `content-refill` task takes pending links with `app.refill next` and runs
   `docs/PIPELINE_PROMPT.md`: intake, then the **reference-breakdown** workflow for analysis (hook mechanics,
   pacing, format, claims to verify).
4. From step 2 on the builder follows the brief instead of "same beats": own script, own design, verified facts.
   All later gates are unchanged: owner review before anything is queued, automation on every post, trending sound
   on the four platforms, SEO per platform, resource page, covers.
5. Each pick becomes a set: reel or carousel (matching the format that worked) for Instagram, Facebook, YouTube,
   TikTok, LinkedIn and X.

## Dedup

`pick` skips a post when:

- its link or post id is already the source of a job in `studio/.local/jobs/*/source.info.json` or in the inbox;
- its caption overlaps 50% or more (keyword overlap) with a job's title, description or `brief.md`, or an inbox note;
- it was picked on an earlier day (`picked.json`; a same-day rerun returns the same picks);
- it covers the same topic as a higher pick today, or the account already has a pick today.

Not covered: builds that never went through a job folder (for example one-off Remotion infographics). The reviewer
checks those by eye in the daily report.

## What still needs the owner

1. See the first scan (`2026-11-16.md`) and switch the scheduled task from dry-run to live.
2. Optional, makes Instagram API-based: re-run the Facebook consent with `instagram_manage_insights` added.
3. Yes or no on reading stories (he will show up in their viewer lists).
4. The competitors' YouTube, TikTok and X handles, or an OK for a one-time lookup pass to verify them.
5. Chrome must be open and logged in to LinkedIn and Instagram at 07:30; if not, the run reports which accounts
   it could not read.
