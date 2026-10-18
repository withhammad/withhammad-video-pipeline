# Best posting times: one reel a day on six platforms

Decided 2026-10-18. The owner's own audience data (work/timing/youtube.md, instagram.md, studios.md, plus screenshots)
outranks the industry benchmarks (work/timing/benchmarks.md). All times are GST (Dubai, UTC+4, no daylight saving),
with UTC in brackets. The UAE weekend is Saturday-Sunday. These slots apply from the first queued reel (Mon 19 Oct
2026, docs/SCHEDULE.md). Next review: Tue 3 Nov 2026.

The rule: one reel per GST day. That day, the same reel goes to all six platforms, each at its own slot below. Two
reels never go out on the same day.

## Slot table

| Platform | Mon-Fri | Sat-Sun | Backup | Confidence |
|---|---|---|---|---|
| YouTube Shorts | 12:00 GST (08:00 UTC); **Fri 10:00 GST (06:00 UTC)** | 12:00 GST (08:00 UTC) | 14:00 GST (10:00 UTC); Fri 09:00 GST (05:00 UTC) | Medium |
| LinkedIn | 16:00 GST (12:00 UTC) | 10:00 GST (06:00 UTC) | 11:00 GST (07:00 UTC), weekdays | Low |
| Instagram Reels (Collab) | 17:00 GST (13:00 UTC) | 17:00 GST (13:00 UTC) | 20:00 GST (16:00 UTC) | Medium |
| TikTok | 17:00 GST (13:00 UTC) | 17:00 GST (13:00 UTC) | 20:00 GST (16:00 UTC) | Low |
| Facebook Reels | 17:00 GST (13:00 UTC) | 17:00 GST (13:00 UTC) | 20:00 GST (16:00 UTC) | Low |
| X | 18:00 GST (14:00 UTC) | 18:00 GST (14:00 UTC) | 09:00 GST (05:00 UTC) | Low |

The day runs in this order: YouTube at noon (10:00 on Fridays), LinkedIn at 16:00, then Instagram, TikTok and Facebook
together at 17:00, and X at 18:00. Every primary slot falls between 10:00 and 18:00 GST. Nothing goes out between 00:00 and
09:00 GST, the worst window in every own data set: YouTube index 0.77 for 00:00-03:00, Instagram followers online at
28-63 % of peak overnight, Instagram engagement 0.25-0.5 of normal.

The backup is the second-best slot. Use it when the primary slot cannot be used, and as the test arm in the review
below. It is never an extra post: one post per platform per day.

Medium confidence means the owner's own data shows a clear pattern, with a stated caveat. Low means there is no own
hourly data, so the slot rests on benchmarks and platform statements.

### Worked example: Mon 19 Oct 2026

| Platform | GST | UTC (for API calls) |
|---|---|---|
| YouTube | 12:00 | 2026-10-19T08:00:00Z (publishAt) |
| LinkedIn | 16:00 | 2026-10-19T12:00:00Z |
| Instagram | 17:00 | 2026-10-19T13:00:00Z |
| TikTok | 17:00 | 2026-10-19T13:00:00Z |
| Facebook Reels | 17:00 | 2026-10-19T13:00:00Z |
| X | 18:00 | 2026-10-19T14:00:00Z |

Fri 23 Oct: YouTube moves to 10:00 GST (06:00Z). Sat 24 and Sun 25 Oct: LinkedIn moves to 10:00 GST (06:00Z). How each
platform is scheduled is in docs/SCHEDULE.md. The owner's Chrome runs on Asia/Dubai, so the composers take GST as
written, while the YouTube API takes UTC. Instagram has no API scheduling: it publishes from a local run at 17:00, so
the Mac must be awake then.

## Evidence per platform

### YouTube Shorts: 12:00 GST, Fridays 10:00 GST (medium)

This is the strongest data set of the six. It covers 3,845 Shorts from 2023-2026, scored on first-8-day views
divided by the median for Shorts published in the same month (1.00 = typical).

- The hour matters (Kruskal-Wallis p = 0.0002). The weekday does not (p = 0.42), and channel views by weekday are
  flat (0.91-0.98).
- 09:00-12:00 GST (05:00-08:00 UTC) indexes 1.14 (90 % CI 1.03-1.23, n = 507), and 12:00-15:00 (08:00-11:00 UTC)
  indexes 1.16 (1.09-1.27, n = 526). The 12:00-15:00 block beat 1.0 in every year: 2023 1.20, 2024 1.16, 2025 1.13,
  2026 1.07.
- The best well-sampled hour is 12:00 GST at 1.30 (1.15-1.60, n = 187). The backup, 14:00 GST, is 1.13 (1.03-1.26,
  n = 162).
- Hours to avoid: 19:00 GST at 0.71 (0.63-0.87, n = 274), 17:00 at 0.83, 23:00 at 0.82, and
  00:00-03:00 at 0.77.
- Friday: on Fridays the 12:00-15:00 block drops to 0.90 (n = 89), while Fri 09:00-12:00 is 1.22 (n = 59). Friday
  prayer is at 12:45 in every UAE mosque, so nothing goes out 12:15-14:00 GST on a Friday. Friday therefore posts at
  10:00, with 09:00 as the backup.
- An independent check agrees. PostFast scored 6,175 YouTube posts against each account's own normal: 13:00 was best
  at 1.25x and 18:00 worst at 0.80x, the same shape as ours. Buffer's evening advice for Shorts (19:00-21:00) measures
  engagement, not views, so our own data overrules it.
- Frequency: views per Short did not fall at 2-10 Shorts a day (index 1.00-1.23, against 1.00 at one a day). One a
  day costs no reach.

Caveats:
- Almost all of this history is a different niche (Quran and Islamic Shorts) with a different audience (IN, PK, BD,
  UZ, SA), so the pattern is a prior, not proof.
- Shorts since 2025 alone are not significant (p = 0.84).
- Only one AI Short has a full week of data. 85 % of its views came from YouTube search (657 of 773) and 12 % from the
  Shorts feed, so for this niche the title, description and tags matter more than the hour.
- Studio's "When your viewers are on YouTube" says "Not enough viewer data", and no API gives viewing by hour.

### Instagram Reels: 17:00 GST every day (medium)

This is the only real hourly audience data on any platform: Instagram's "Most active times" for followers (web
Professional dashboard, 112,682 followers, 18 Sep-17 Oct 2026). Each value is the 7-day mean.

| GST (UTC) | Followers online | % of peak |
|---|---|---|
| 08:00 (04:00) | 10,467 | 78 % |
| 11:00 (07:00) | 11,894 | 89 % |
| 14:00 (10:00) | 11,912 | 89 % |
| **17:00 (13:00)** | **13,399** | **100 %** |
| 20:00 (16:00) | 12,347 | 92 % |
| 23:00 (19:00) | 6,128 | 46 % |
| 02:00 (22:00) | 3,813 | 28 % |
| 05:00 (01:00) | 8,416 | 63 % |

- The weekday does not matter: the seven day totals differ by only 0.7 %. So the slot is the same every day, with no
  weekend variant.
- At 17:00 the reel goes live at the peak. 92 % of followers are still online at 20:00, before the drop to 46 % at
  23:00.
- Time zone: Instagram's tooltip says "All numbers are calculated using Pacific Standard Time". The table converts at
  UTC-7, because the whole window was in Pacific daylight time. If Meta really uses fixed PST, every value moves one
  hour later and the peak is 18:00 GST. 17:00 is then just before the peak and still inside the 89-100 % plateau.
  Under either reading, 17:00 is in the top band.
- The account's own post engagement is noise: 24 mature posts (9 Reels), likes and comments only, and no test is
  significant (p = 0.09 for 3-hour blocks, p = 0.105 for Reels). It only confirms the night is worst (00:00-09:00 GST
  at 0.25-0.5 of normal).
- The benchmarks point the same way (late afternoon to evening): Buffer's Reels evenings 18:00-23:00, PostFast's
  15:00 at 1.20x, Sprout's weekdays about 12:00-19:00, and Meltwater's UAE weekdays 19:00-22:00. The own chart decides
  the exact hour.

Caveats:
- 84.6 % of the last 30 days' 5,344 views came from non-followers, whom the follower chart does not describe.
- Meta's Reels system card lists no post-age signal, so the hour mostly decides how many followers see the reel
  first.
- The bigger problem is engagement, not the hour: a median of 2 likes and comments per Reel on a 112K account.

### Facebook Reels: 17:00 GST (low)

- Own data: the profile (professional mode) has 49 followers and 503 views in 28 days. 84.9 % of views are Reels;
  traffic comes from Reels 61.4 % and Feed 27.9 %. There is no hourly chart, demographics show "Not enough data", and
  Meta Business Suite has no access.
- Meta's Facebook Reels system card lists no post-age signal, so distribution comes from recommendations and the hour
  is low stakes.
- Facebook is placed with Instagram for two reasons: Instagram's chart is the only measured hourly data for a Meta
  audience, and one shared slot lets the owner answer first-hour comments everywhere at once (Buffer 2026: replying
  added 21 % on Instagram and 30 % on LinkedIn). PostFast's 17:00 at 1.17x supports this slot. The backup, 20:00, is
  PostFast's video peak (1.26x).

### TikTok: 17:00 GST (low)

- Own data: 58 followers (follower activity unlocks at 100) and 146 viewers in 365 days. The most-active charts are
  empty. The three AI posts (160 views at 18:54 GST, 114 at 03:38, 87 at 06:01) are too few to read.
- TikTok says follower count is not a direct For You factor, and that a just-uploaded video may not be eligible until
  review clears.
- The benchmarks contradict each other:
  - Buffer: evenings 18:00-23:00
  - Sprout: weekday afternoons 13:00-18:00
  - Dash Social: late night
  - PostFast: no reproducible hour effect (the best hour was only 1.04x)
- 17:00 falls inside Sprout's windows, runs into Buffer's evening peak and sits in Instagram's measured peak. The
  backup is 20:00 (Buffer evening, Meltwater UAE evening). If TikTok's review regularly takes more than 15 minutes,
  schedule 15 minutes early.

### LinkedIn: 16:00 GST Mon-Fri, 10:00 GST Sat-Sun (low)

- Own data comes from the personal profile: 6,557 followers and no hourly chart.
  - Locations: Dubai 8 %, Abu Dhabi 3 %, Sharjah 1 % (at least 12 % UAE); Bengaluru, Delhi, Hyderabad and Mumbai 1 %
    each; Toronto, London and Berlin 1 % each.
  - Industries: HR services 16 %, IT services 15 %, staffing 7 %.
  - Seniority: Senior 41 %.
  - This is an office-hours audience.
- The LinkedIn feed is network-first and recency counts. Metricool 2026 (673,658 posts) found about half of
  impressions come in the first 48 hours and about 40 % of personal-profile interactions on day 1. So post inside the
  working day.
- 16:00 GST is afternoon working time in the UAE private sector, 17:30 in India, 12:00 in London (from 25 Oct), 13:00
  in Berlin and 07:00 in Toronto (from 1 Nov).
  - Buffer (4.8M posts): weekday peak 15:00-20:00; top slots Wed 16:00, Fri 15:00 and Fri 16:00.
  - Sprout: Tue-Thu 11:00-17:00.
- Friday stays at 16:00. Buffer's top slots include Friday afternoon, and 16:00 is clear of the prayer block. UAE
  government offices close at noon on Fridays, but this audience is mostly private sector.
- Still unresolved: Metricool and Hootsuite favour mornings (09:00-12:00). The backup, 11:00 GST, tests that.
- Weekends are low value at any hour. Buffer's top Saturday slot is 9 am, so weekends post at 10:00.

### X: 18:00 GST (low)

- No own data. The follower count and locations were not captured; the handle changed to @HammadYousufAI on
  2026-10-18, and only two posts exist.
- X depends on recency more than any of the other five. Its open-sourced ranker drops posts older than 48 hours and
  builds in-network candidates from followed accounts' recent posts, so the slot should match when the followers are
  awake.
- Benchmarks agree on 09:00-11:00 viewer-local time (Buffer, Hootsuite). 18:00 GST is 10:00 in New York until 1 Nov
  and 09:00 after, 14:00-15:00 in London, 19:30 in India and evening in the UAE. This assumes the AI and marketing
  audience on X is mostly US, UK and India. That has not been measured.
- The backup, 09:00 GST, is UAE local morning. Switch to it if X's analytics shows a UAE/GCC majority. UAE X ad reach
  is 2.85M and fell 6 % (DataReportal 2026), the smallest of the six platforms.

## Why the platforms are staggered, and why not more

- YouTube is on its own because its own data says so: 17:00 (0.83) and 19:00 (0.71) are its weak hours, and noon is
  its best.
- LinkedIn posts in working hours because it is a network feed of office workers.
- Instagram, TikTok and Facebook share 17:00, with X at 18:00. No data separates them, Instagram's chart is the only
  measured hourly audience, and a single window lets the owner reply to first-hour comments on all four.
- No further splitting. The gains are small: studies that compare posts against their own account put the best hour
  at about 1.2-1.3x a typical one. Every extra time is one more chance to break the one-reel-a-day queue.

## How much the hour is worth (honest caveat)

- The best hour beats a typical hour by about 1.2-1.3x: YouTube's own data gives 1.30 at noon; PostFast gives 1.20x on
  Instagram and 1.25x on YouTube. Hour curves for TikTok and LinkedIn did not reproduce.
- The bigger levers on this data:
  - SEO: 85 % of the AI Short's views came from search.
  - Content and audience fit: 2 likes per Reel on 112K followers.
  - Replying in the first hour: Buffer measured +21 % on Instagram and +30 % on LinkedIn.
- Treat timing as consistency: the same slots every day, held long enough to measure.

## What would sharpen this (most valuable first)

1. **Instagram scope instagram_business_manage_insights.** Today every insights call returns HTTP 403, code 10. The
   scope would unlock:
   - online_followers: 24 hourly values instead of 8 marks, which also settles the PST/PDT question
   - follower demographics by country and city
   - per-Reel reach, views, watch time, shares and saves

   To get it: enable the scope for the app in the Meta dashboard, add it to `SCOPES` in
   `outputs/video-pipeline/instagram_oauth.py`, then re-consent with "Log in with Facebook" (the owner types the 2FA
   code).
2. **Meta Business Suite access.** Log in with Instagram, or link @with.hammad to a Page or Business portfolio. That
   adds Instagram cities, countries, age and gender. Today it shows "does not have access".
3. **TikTok: 42 more followers.** At 100 followers TikTok unlocks follower activity by hour, plus locations.
4. **X follower count and top locations.** These decide between 18:00 and 09:00.
5. **YouTube on AI content only.** Re-run the publish-hour analysis once about 30 AI Shorts each have a full
   first-8-day window (about 24 Nov 2026). Check Studio's heat map once it has enough viewers.
6. **First-24-hour numbers for every post on all six platforms (next section).** This is the only data that measures
   this audience with this content.

## When to re-check

- **Every 14 posts, i.e. every two weeks.** First review Tue 3 Nov 2026 (posts from 19 Oct to 1 Nov), then 17 Nov,
  1 Dec and 15 Dec.
- **What to log.** For every post, 24 hours after it goes live, record:
  - YouTube views (plus the search share once Analytics catches up, 1-3 days later)
  - Instagram views, likes and comments (plus reach once the scope is in)
  - TikTok views
  - Facebook views
  - LinkedIn impressions
  - X views

  Write them into the reel's docs/videos/<date>-<slug>.md.
- **Test on the platforms with no own data.** From 2 Nov to 29 Nov, alternate primary and backup day by day on
  TikTok, Facebook, LinkedIn (weekdays) and X, about 14 posts each. Alternating days controls for account growth.
  Decide at the 1 Dec review.
- **Decision rule.** Keep a slot unless the challenger's median first-24-hour number beats it by more than 20 %.
  Smaller gaps are within what a best hour is worth (about 1.2x) plus content noise.
- **Instagram.** Re-pick from online_followers as soon as the scope works. Without it, re-read "Most active times" on
  1 Dec 2026, the first 30-day window entirely in PST:
  - If the 12p mark has fallen and the 6p mark has risen against October, Meta's "Pacific" follows daylight saving
    and 17:00 stands.
  - If the curve is unchanged, Meta uses fixed PST, the peak is 18:00 GST, and the 17:00 group can move to 18:00.
- **Clock changes.** The UAE has no daylight saving, so no slot moves. The UK leaves summer time on 25 Oct and the US
  on 1 Nov. X's 18:00 GST then goes from 10:00 to 09:00 in New York, and LinkedIn's 16:00 GST from 13:00 to 12:00 in
  London. Both stay inside their windows, so nothing changes.
- **Ramadan 2027 (expected about 8 Feb-9 Mar).** Re-plan in late January. Working hours shrink, and older Meta MENA
  data puts use at 18:00-19:00 and 00:00-04:00 GST.
- **Triggers.** Re-check TikTok when it reaches 100 followers, and YouTube at about 30 mature AI Shorts (about
  24 Nov).

## Action list

1. Owner: approve the instagram_business_manage_insights scope and redo the @with.hammad consent (2FA). This is the
   most valuable missing data.
2. Schedule each reel in docs/SCHEDULE.md at these slots, after the owner's OK for that reel (AGENTS.md hard rule 5).
3. Be on hand 17:00-18:30 GST to reply to first-hour comments on Instagram, TikTok, Facebook and X. Answer YouTube
   and LinkedIn comments in the hour after their slots.
4. Log the first-24-hour numbers per post; first review Tue 3 Nov 2026.
5. Read X's follower count and top locations once; it settles X's slot.
6. Re-run the YouTube hour analysis on AI Shorts only, about 24 Nov 2026.
