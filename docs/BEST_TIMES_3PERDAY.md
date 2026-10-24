# Best posting times: three reels a day (proposal)

Proposed 2026-10-24 for the owner's new cadence: **at least 3 reels every day**, queued a week ahead
(first week Sun 25 Oct - Sat 31 Oct 2026), plus one Instagram and one LinkedIn carousel/post a day. It replaces the
one-reel-a-day table in docs/BEST_TIMES.md once the owner approves. Status: **proposal, not applied**. The matching
slots-file patch is a separate file. studio/app/slots.json and publish_reel.py are unchanged.

All times are GST (Dubai, UTC+4, no daylight saving), with UTC in brackets. The UAE weekend is Sat-Sun. Owner rule:
"pick from analytics only". So every slot comes from the owner's own data where it exists. Where no own data exists
(TikTok, Facebook, LinkedIn, X), the slot follows the closest measured own audience, and the benchmarks only break
ties. Those slots are marked Low confidence.

## The rule

- Three reels per GST day. Reel 1 takes slot 1 on every platform, reel 2 takes slot 2, and reel 3 takes slot 3. A
  platform's slots are at least 3 hours apart.
- The Instagram Trial Reel on @with.hammad goes out at the same slot as the main @hammadagentic.ai post for that reel
  (unchanged: `instagram_trial` reads the `instagram` slot).
- One carousel/post a day on Instagram and one on LinkedIn, at a slot that is not a reel slot.
- Friday: nothing 12:15-14:00 GST (Friday prayer 12:45), as before.

## Slot table

| Platform | Days | Reel 1 | Reel 2 | Reel 3 | Carousel / post | Confidence |
|---|---|---|---|---|---|---|
| YouTube Shorts | Mon-Thu, Sat-Sun | 09:00 (05:00Z) | 12:00 (08:00Z) | 16:00 (12:00Z) | - | Medium |
| YouTube Shorts | Fri | 10:00 (06:00Z) | 15:00 (11:00Z) | 18:00 (14:00Z) | - | Medium |
| Instagram Reels (+ Trial Reel) | every day | 11:00 (07:00Z) | 14:00 (10:00Z) | 17:00 (13:00Z) | **20:00 (16:00Z)** | Medium |
| TikTok | every day | 14:00 (10:00Z) | 17:00 (13:00Z) | 20:00 (16:00Z) | - | Low |
| Facebook Reels | every day | 14:00 (10:00Z) | 17:00 (13:00Z) | 20:00 (16:00Z) | - | Low |
| LinkedIn | Mon-Thu | 09:00 (05:00Z) | 13:00 (09:00Z) | 17:00 (13:00Z) | **11:00 (07:00Z)** | Low |
| LinkedIn | Fri | 09:00 (05:00Z) | 14:00 (10:00Z) | 17:00 (13:00Z) | **11:00 (07:00Z)** | Low |
| LinkedIn | Sat-Sun | 10:00 (06:00Z) | 14:00 (10:00Z) | 20:00 (16:00Z) | **17:00 (13:00Z)** | Low |
| X | every day | 09:00 (05:00Z) | 14:00 (10:00Z) | 18:00 (14:00Z) | - | Low |

Backups (the test arm, never an extra post), in reel order:

| Platform | Backups |
|---|---|
| YouTube | Mon-Thu, Sat-Sun 10:00 / 14:00 / 18:00; Fri 09:00 / 16:00 / 20:00 |
| Instagram | 12:00 / 15:00 / 18:00 (this is also the fixed-PST reading of the chart); carousel 21:00 |
| TikTok, Facebook | 11:00 / 15:00 / 21:00 |
| LinkedIn | Mon-Thu 08:00 / 12:00 / 16:00; Fri 08:00 / 15:00 / 18:00; Sat-Sun 09:00 / 13:00 / 21:00; carousel weekday 15:00, weekend 12:00 |
| X | 10:00 / 15:00 / 21:00 |

### What still fits from the old table

Keeping 12:00 (YouTube) and 17:00 (Instagram) as slots means the reels already queued for 25-27 Oct (YouTube
publishAt 08:00Z) stay valid as "reel 2" (YouTube) and "reel 3" (Instagram) of their day. The old LinkedIn 16:00, X
18:00 and TikTok/Facebook 17:00 slots are kept or moved by at most one hour.

### Day order (Mon-Thu example, GST)

| Time | What goes out |
|---|---|
| 09:00 | YouTube R1, LinkedIn R1, X R1 |
| 11:00 | Instagram R1 (+ trial), LinkedIn carousel |
| 12:00 | YouTube R2 |
| 13:00 | LinkedIn R2 |
| 14:00 | Instagram R2 (+ trial), TikTok R1, Facebook R1, X R2 |
| 16:00 | YouTube R3 |
| 17:00 | Instagram R3 (+ trial), TikTok R2, Facebook R2, LinkedIn R3 |
| 18:00 | X R3 |
| 20:00 | Instagram carousel, TikTok R3, Facebook R3 |

Nothing goes out between 21:00 and 08:00 GST. That is the worst window in every own data set.

## Evidence per platform

### Data freshness (pulled 2026-10-24, 09:30 UTC, read-only)

| Source | Fresh today? | What it gave |
|---|---|---|
| YouTube Data + Analytics API (youtube-oauth.json, channel UCJtrEDGg1R3kNe7t7PQFiEw verified) | **Fresh** | All 17 AI-era public uploads with views, daily views and traffic sources; 3 queued private uploads. |
| YouTube 3,845-Short hour analysis (work/timing/youtube.md) | Stale (18 Oct), but stable | Hour index per GST hour; frequency effect. Re-running adds nothing: the legacy set has not changed. |
| Instagram Graph API @with.hammad (token valid, 112,535 followers) | **Fresh, partial** | Media list with like/comment counts. `online_followers`, account `reach` and media insights all still return **HTTP 403, code 10** (no instagram_business_manage_insights scope). |
| Instagram "Most active times" chart (work/timing/studios.md) | Stale (18 Sep-17 Oct window) | The only measured hourly audience on any platform. |
| Instagram @hammadagentic.ai | **Blocked** | Token dead: HTTP 400, code 190 ("session has been invalidated"). |
| LinkedIn | **Blocked** | The token has only openid, profile and w_member_social. No analytics read scope. |
| TikTok, Facebook, X | **Blocked** | No user read token in the repo (TikTok has only a client file). The last numbers are the 18 Oct Studio captures. |

### YouTube Shorts (medium)

Hour index from 3,845 Shorts (first-8-day views / same-month median; Kruskal-Wallis p = 0.0002; weekday p = 0.42):

| GST | Index | 90 % CI | n |
|---|---|---|---|
| **09:00** | **1.22** | 0.98-1.46 | 160 |
| 10:00 | 1.18 | 1.01-1.35 | 146 |
| **12:00** | **1.30** | 1.15-1.60 | 187 |
| 14:00 | 1.13 | 1.03-1.26 | 162 |
| 15:00 | 0.95 | 0.77-1.13 | 168 |
| **16:00** | **1.06** | 0.94-1.36 | 165 |
| 17:00 | 0.83 | 0.75-0.97 | 204 (avoid) |
| 18:00 | 1.02 | 0.92-1.24 | 234 |
| 19:00 | 0.71 | 0.63-0.87 | 274 (avoid) |
| 20:00-22:00 | 1.00 | 0.84-1.24 | 283-347 |
| 23:00 | 0.82 | 0.71-0.94 | 209 (avoid) |

- 09:00 + 12:00 + 16:00 is the highest-index set of three hours that are at least 3 hours apart (sum 3.58). Next
  best: 09 + 12 + 18 (3.54) and 09 + 12 + 22 (3.52). 16:00 wins narrowly; 18:00 is its backup.
- Three a day costs nothing per Short on this data. Days with 2-3 Shorts index 1.02 per Short and days with 4-6
  index 1.23, against 1.00 at one a day. The views per Short only fall at 11 or more a day (0.91).
- Friday: Fri 12-15 drops to 0.90 (n = 89), Fri 09-12 is 1.22 (n = 59) and Fri 15-18 is 1.05 (n = 67). With the prayer
  block, Friday is 10:00 / 15:00 / 18:00.
- Weekend: no split. The weekday does not matter (p = 0.42; channel views by weekday 0.91-0.98). Sat 09-12 at 0.76
  (n = 86) is the one weak cell. If the 3 Nov review shows Saturday 09:00 lagging, move Saturday R1 to 10:00.
- Fresh AI-era evidence (today's pull), and why the hour now matters more:

| Published GST | Short | Views | Age | Shorts feed | Search |
|---|---|---|---|---|---|
| Fri 9 Oct 23:24 | 11 Claude Skills for YouTube | 919 | 14.6 d | 92 | 775 |
| Sat 17 Oct 18:51 | Reverse-engineer with Claude Code | 713 | 6.8 d | 590 | 103 |
| Sun 18 Oct 03:32 | 11 Free Claude Skills | 573 | 6.4 d | 420 | 104 |
| Sun 18 Oct 05:54 | AI lead generation | 1,422 | 6.3 d | 149* | 68* |
| Wed 21 Oct 12:00 | Better AI motion graphics | 512 | 3.1 d | 373 | 47 |
| Fri 23 Oct 10:00 | 85 AI engineering projects | 58 | 27 h | - | - |
| Fri 23 Oct 19:57 | Claude YouTube agent skill | 150 | 17 h | - | - |
| Fri 23 Oct 23:39 | Claude Duet | 114 | 14 h | - | - |
| Sat 24 Oct 12:00 | Claude AI job search | 4 | 1.5 h | - | - |

  (*Analytics lags 1-3 days, so source totals trail the view count.) On 18 Oct only one Short had a full week, and 85 %
  of its views came from search. In the newer Shorts, **the Shorts feed is now 73-83 % of views**. Feed distribution
  makes the first hours, and so the hour, matter more than the 18 Oct doc assumed. Ten AI Shorts with different
  content are still far too few for an AI-only hour curve. The legacy curve stays the prior.

### Instagram Reels and carousel (medium)

Followers online ("Most active times", 7-day mean, @with.hammad; the weekday spread is only 0.7 %):

| GST | 08:00 | **11:00** | **14:00** | **17:00** | **20:00** | 23:00 | 02:00 | 05:00 |
|---|---|---|---|---|---|---|---|---|
| % of peak | 78 % | **89 %** | **89 %** | **100 %** | **92 %** | 46 % | 28 % | 63 % |

- The four marks at 89-100 % are exactly 3 hours apart, so three reels and the carousel each get one of them. The
  reels take 11:00, 14:00 and 17:00, so each reel has the following 3 hours at 89-100 % online. The carousel takes
  20:00 (92 %). It is a Feed post, and the Feed system card uses recency. The benchmarks also put feed engagement in
  the evening: Buffer 18:00-23:00, and Meltwater UAE weekdays 19:00-22:00.
- No weekend split: the chart shows the same curve every day.
- PST question: if Meta's chart uses fixed PST rather than PDT, every mark moves one hour later. The backups
  (12:00/15:00/18:00) are that reading. Settle it from `online_followers` once the scope works, or re-read the chart
  on 1 Dec.
- Fresh post data adds nothing on timing. The 7 Reels since 17 Oct got 0-3 likes each and no comments, which is noise.
- Caveat: the chart describes @with.hammad's followers. Main posts now go out from @hammadagentic.ai with @with.hammad
  as the Collab, so they reach this audience through the Collab. @hammadagentic.ai's own audience is unmeasured
  because its token is dead.
- Operational: Instagram publishes from a local `run-due` at each slot. With the trial posts and the carousel, that
  is 4 times a day on 2 accounts, so the Mac must be awake 11:00-20:15.

### TikTok (low)

- Own data: 58 followers on 18 Oct. Follower activity unlocks at 100. The viewer chart was empty, and 3 posts are
  unreadable.
- No own TikTok curve exists. So the slots follow the measured Meta audience (the closest own data) and avoid the hours
  that every own set marks as bad (21:00-08:00). 14:00 / 17:00 / 20:00 sit at 89 / 100 / 92 % of the Instagram curve.
  Each is 3 hours after the matching Instagram reel, so the same reel does not land everywhere at once.
- Benchmarks only check the fit: Sprout 13:00-18:00 weekdays (14, 17), Buffer evenings 18:00-23:00 (20).
  PostFast found no reproducible TikTok hour effect (best hour 1.04x). The hour is worth little here.

### Facebook Reels (low)

- Own data: a 49-follower profile with no hourly chart; 61 % of traffic comes from Reels recommendations.
- Same slots as TikTok, for the same reason (measured Meta audience curve). PostFast's own-normal scores agree:
  15:00 1.18x, 17:00 1.17x and video 20:00 1.26x.

### LinkedIn (low)

- Own data: 6,557 followers, an office-hours audience (HR services 16 %, IT 15 %; at least 12 % UAE, plus India,
  London, Berlin and Toronto). There is no hourly chart and no API read scope.
- Weekdays: 09:00 (UAE start of day, 10:30 India; Metricool 09:00), 13:00 (09:00 London, 14:30 India), and
  17:00 (13:00 London, 18:30 India; Buffer peak 15:00-20:00, the old 16:00 slot moved one hour so it is 4 hours after
  13:00). The carousel/document post goes at 11:00 (Metricool: the most active hour). Friday R2 moves to 14:00 for the
  prayer block.
- Weekends are low value at any hour. 10:00 (Buffer Sat 9 am) / 14:00 / 20:00 (Buffer Sun 10 pm). Carousel at 17:00.
- **Biggest caveat in this table:** four posts a day on one personal profile. Metricool found about half of a post's
  impressions arrive in the first 48 hours, so posts 2-4 hours apart compete with each other in the same network's
  feed. Expect impressions per post to fall. Watch for it in the 24-hour logs and drop LinkedIn to 1 reel + 1 carousel
  a day if the median falls more than 30 % against the one-a-day week.

### X (low)

- Own data: none (no follower or location numbers captured; no read token).
- 09:00 (UAE morning; Buffer/Hootsuite 09:00-11:00 viewer-local), 14:00 (10:00 London from 25 Oct), and 18:00
  (10:00 New York until 1 Nov, 09:00 after). Each reel slot hits one region's morning, which is X's benchmark peak.
  The ranker's 48-hour recency window makes the hour matter more on X than anywhere else.

## Confidence and the size of the effect

Even with perfect data, the best hour is worth about 1.2-1.3x a typical hour (YouTube own 1.30; PostFast 1.20-1.25x).
At 3 reels a day, content, SEO and first-hour replies matter more than the minute. Use the slots for consistency, and
measure.

## What would sharpen this (each needs the owner)

1. **Instagram insights scope** (instagram_business_manage_insights). It unlocks 24-hour `online_followers` and per-Reel
   reach/views. Today's calls are still 403 code 10.
2. **Re-authorize @hammadagentic.ai.** The token is dead (code 190). Run
   `python3 outputs/video-pipeline/instagram_oauth.py --account hammadagentic.ai --no-open` in a separate Chrome profile.
   The owner types the 2FA code.
3. **LinkedIn analytics read scope.** The current token can only post.
4. **TikTok at 100 followers** unlocks follower activity by hour. Today TikTok has a client file only, no user token.
5. **X analytics** (follower locations): read once from the owner's Chrome. This was not done today: the brief allowed
   only the repo's own API tokens.
6. **First-24-hour numbers per post** in docs/videos/<date>-<slug>.md. None are logged yet. With 21 reels a week, the
   per-slot comparison (R1 vs R2 vs R3) becomes measurable in about 2 weeks.

## Review

- Tue 3 Nov 2026: compare the median first-24-hour views by slot (R1/R2/R3) per platform. Keep a slot unless its
  backup beats it by more than 20 % over at least 7 posts each.
- YouTube: re-run the hour analysis on AI Shorts only once about 30 have a full 8-day window. At 3 a day, that is
  about 5 Nov instead of 24 Nov.
