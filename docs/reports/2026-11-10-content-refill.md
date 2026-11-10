# Refill 10 November 2026

Live audit: 2026-11-10T07:29:19.314771+04:00 (Asia/Dubai). Current target: two reels plus one carousel per platform daily, seven days ahead. Long-form remains an idea/gap lane, not the retired one-per-day mandate.

| Platform | Booked reel days | After page/rule/native blockers | Carousel/guide days | Non-reel days including single images |
|---|---:|---:|---:|---:|
| youtube | 4 | 0 | 0 | 1 |
| instagram | 7 | 7 | 0 | 2 |
| facebook | 7 | 7 | 0 | 2 |
| linkedin | 5 | 1 | 0 | 2 |
| tiktok | 3 | 2 | 0 | 1 |
| x | 3 | 2 | 0 | 1 |

Counts are consecutive days starting today; pending/posted/scheduled queue rows count, held/failed do not. Reel counts use the queue's base-platform lanes, not a fresh content-format or quality audit. Carousel/guide counts include slide-video adaptations. Single-image VECTORS is not counted as a carousel. All platforms lack a carousel today; HARNESS has carousel bookings on IG/FB/LI tomorrow. Zero long-video entries.

The blocker-adjusted column excludes unposted rows with non-200 resource URLs, missing local keyword rules, or unconfirmed native scheduling. It is NOT a guarantee of publication: Instagram's documented action restriction remains a risk, and no fresh account/media/post verification was performed. Native VECTORS image bookings on TikTok/X still carry the extension file-access blocker.

`app.refill status`: links_needed=0; `app.refill next`: []. Routine step 2 therefore selected zero new links/jobs; no intake, scripts, covers or generation started. Inbox: 8 pending, 8 in progress, 11 awaiting approval, 10 queued, 3 rejected. Additional reference links requested: zero. The existing approval backlog is not permission to publish.

Helper caveat: its reel coverage is Instagram-only, its posts/long minima are stale, and it ignores guides/images. Its “no carousel builder” message is outdated (app.guide/app.carousel exist). Zero links needed does not mean all feeds are full. No helper or queue changes made in this audit.

## Existing funnel blockers

52 unique resource/PDF URLs checked with HTTP GET: 43 returned 200, nine returned 404. All nine keywords are absent from the local posting-site checkout's rules; this is not a deployed-webhook/customer-DM test.

| Keyword | Open PR | Resource slug returning 404 |
|---|---|---|
| REFERRAL | [#7](https://github.com/withhammad/withhammad-rebuild/pull/7) | linkedin-referral-claude-templates |
| ANIMATE | [#5](https://github.com/withhammad/withhammad-rebuild/pull/5) | claude-animation-styles-prompts |
| ROAST | [#6](https://github.com/withhammad/withhammad-rebuild/pull/6) | roast-room |
| MODELS | [#9](https://github.com/withhammad/withhammad-rebuild/pull/9) | claude-models-cheat-sheet |
| K2 | [#4](https://github.com/withhammad/withhammad-rebuild/pull/4) | k2-horizon-free-uae-ai-models |
| RANK | [#10](https://github.com/withhammad/withhammad-rebuild/pull/10) | claude-code-seo-plugins |
| ROBOT | [#11](https://github.com/withhammad/withhammad-rebuild/pull/11) | claude-3d-dialogue-reels |
| CARTOON | [#13](https://github.com/withhammad/withhammad-rebuild/pull/13) | claude-code-cartoon-episodes |
| LINES | [#14](https://github.com/withhammad/withhammad-rebuild/pull/14) | hairline-line-animations |

All listed PRs were verified OPEN via gh after the GitHub connector returned Unknown tool. Prioritize REFERRAL (already live) and ANIMATE (today's bookings). The older claude-animation-styles page returning 200 does not fix the different booked ANIMATE URL. REPO/GUARD PR #20 also remains open. Existing PRs need owner review/merge under handover section 2; no duplicate PR or merge attempted. WORLD/JOBS remain held.

No posting, scheduling, messaging, paid generation, inbox transitions or heavy renders. Only this report was added to the pipeline. Focus next: review existing funnel PRs, resolve current approval decisions, and address carousel gaps before requesting more references.
