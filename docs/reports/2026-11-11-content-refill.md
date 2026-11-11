# Refill 11 November 2026

Live audit: 2026-11-11T10:55:47.096370+04:00 (Asia/Dubai). Target: 2 reels + 1 carousel per platform daily, seven days ahead.

| Platform | Booked reel days | After known blockers | Carousel/guide days |
|---|---:|---:|---:|
| youtube | 3 | 1 | 0 |
| instagram | 6 | 6 | 1 |
| facebook | 6 | 6 | 1 |
| linkedin | 0 | 0 | 1 |
| tiktok | 2 | 0 | 0 |
| x | 2 | 0 | 0 |

Consecutive days start today. Pending/scheduled rows use their booking date; posted rows use posted_at in Dubai time. This corrects prior reports: REFERRAL was posted on 7 November, despite its rows retaining 11 November slots. It cannot fill today’s cadence. Held/failed entries are excluded. Base-platform rows count as reels; this is not a new content-format or quality audit. Carousel counts include guide-slide adaptations, not single images. No long-video entries; long form remains a gap/idea lane, not a daily mandate.

The blocker-adjusted column excludes unposted rows with non-200 resources, absent local keyword rules, or unconfirmed native scheduling. It is not proof of publication or customer reply delivery. Instagram account restrictions remain a documented risk. Today LinkedIn lacks its two reels even before funnel checks; TikTok and X fall short after blockers. Carousel coverage is zero today on YouTube/TikTok/X, and ends after today on Instagram/Facebook/LinkedIn.

Refill helper: links_needed=0, next=[]. Inbox: {'pending': 11, 'in_progress': 10, 'awaiting_approval': 11, 'queued': 10, 'rejected': 3}. Following routine step 2, selected zero new references/jobs; requested zero additional links. Existing work and approval backlog remain untouched. No generation credits, inbox mutations, queue additions, publications or messages.

Helper limitations: Instagram-only reel coverage, stale posts/long targets, and an outdated no-carousel-builder message. Zero links_needed does not mean the queue is full. No helper implementation changed.

## Funnel and approval priorities

53 resource/PDF URLs checked: 44 HTTP 200, nine HTTP 404. All nine corresponding keywords are absent from the local posting-site rules. Initial PDF timeouts resolved on the second pass. Existing page/rule PRs were verified OPEN using GitHub REST through gh after the connector failed and GraphQL returned EOF. Do not duplicate the prepared fixes.

| Keyword | Existing PR |
|---|---|
| REFERRAL | [#7](https://github.com/withhammad/withhammad-rebuild/pull/7) |
| LINES | [#14](https://github.com/withhammad/withhammad-rebuild/pull/14) |
| ANIMATE | [#5](https://github.com/withhammad/withhammad-rebuild/pull/5) |
| ROAST | [#6](https://github.com/withhammad/withhammad-rebuild/pull/6) |
| MODELS | [#9](https://github.com/withhammad/withhammad-rebuild/pull/9) |
| K2 | [#4](https://github.com/withhammad/withhammad-rebuild/pull/4) |
| RANK | [#10](https://github.com/withhammad/withhammad-rebuild/pull/10) |
| ROBOT | [#11](https://github.com/withhammad/withhammad-rebuild/pull/11) |
| CARTOON | [#13](https://github.com/withhammad/withhammad-rebuild/pull/13) |

Prioritize REFERRAL #7 (already published, broken resource) and LINES #14 (today’s blocked slots). Website merges remain an owner gate; no merge attempted. WORLD/JOBS stay held.

PR #20 is now merged, unlike the previous refill run; the REPO manual-upload handoff stays protected from repeat uploads and automatic fallback. HIGGS and ADVISOR packages are approved per the latest handover and exact-hash approval receipt; PR #21 remains OPEN. Their guide deployment and the already-raised timing decision remain outstanding: current bookings/spacing cannot fit both on all six platforms by the 11 November batch deadline. Do not silently move them later or displace existing bookings. Active FABLE/CLONE/BENCH production was not duplicated.

Evidence: work/content-refill-20261111/{audit.py,audit.json,refill-status.json,refill-next.json,prs-rest.json}. This run adds only the audit report to tracked pipeline files.
