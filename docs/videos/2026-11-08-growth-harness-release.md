# GROWTH and HARNESS release schedule

Verified 2026-11-08T13:16:48.138877+04:00. All times Asia/Dubai (GST, UTC+4).

The owner approved both final packages and explicitly authorized Codex to merge [website PR #16](https://github.com/withhammad/withhammad-rebuild/pull/16). It is merged (`fbf6b829`); the exact production deployment is Ready. Both new guides return HTTP 200. No new generation credits were used.

| Platform | GROWTH | HARNESS |
|---|---|---|
| Youtube | 2026-11-08 18:00 GST | 2026-11-09 14:00 GST |
| Instagram | 2026-11-09 12:00 GST | 2026-11-10 12:00 GST |
| Facebook | 2026-11-08 15:00 GST | 2026-11-10 11:00 GST |
| Linkedin | 2026-11-09 12:00 GST | 2026-11-10 12:00 GST |
| Tiktok | 2026-11-08 15:00 GST | 2026-11-10 11:00 GST |
| X | 2026-11-08 21:00 GST | 2026-11-10 10:00 GST |

API slots are booked in the local queue. TikTok and X are confirmed in their native schedulers. Instagram invites @with.hammad and @hammadagentic.ai.

Instagram/YouTube: two hours for phone sounds. Automatic fallbacks: GROWTH YouTube 8 Nov 20:03 and Instagram 9 Nov 14:03; HARNESS YouTube 9 Nov 16:03 and Instagram 10 Nov 14:03. Other API entries post on the next :03 run.

HARNESS also has approved carousel bookings: Facebook and LinkedIn 11 Nov 11:00; Instagram 11 Nov 20:00. Its LinkedIn video uses the approved dedicated cut and SRT.

- [GROWTH guide](https://withhammad.com/resources/claude-instagram-skills)
- [Mini Harness guide](https://withhammad.com/resources/build-an-agent-harness)
- [Shared HARNESS landing](https://withhammad.com/resources/harness-engineering) — retained for the earlier reel, now links to Mini Harness.
- [GROWTH TikTok schedule](https://www.tiktok.com/@withhammad/video/7705722433147243782)
- [HARNESS TikTok schedule](https://www.tiktok.com/@withhammad/video/7705724702609755393)
- [X scheduled posts](https://x.com/compose/post/unsent/scheduled) — GROWTH 8 Nov 21:00, HARNESS 10 Nov 10:00.

X media IDs: GROWTH `2119353842748022784`, HARNESS `2119355297726877697`. These are media IDs, not public tweet IDs. Both X uploads include English SRT files. TikTok uses the approved covers. The X composer exposes no custom-cover upload.

Keyword proof: Meta verification and signed empty Instagram/Facebook events returned 200; correct account subscriptions are active. All four other platform matchers resolve both keywords. The HARNESS Meta message includes both guides. These checks verify routing; fresh delivery to a customer is not claimed before eligible comments arrive.

Validation: both publication checks have zero blockers/warnings; approved masters, LinkedIn variant, covers and carousel file hashes match. 631 tests passed (one existing warning). Poster: 31 runs, last exit 0. No manual run-due --live and no queue rebuild.

The masters and covers remain in ~/Downloads/8 November/.


9 Nov recovery: GROWTH Facebook `fa-0f869c3f2de7` failed before upload because the publishing checkout was on `codex/edge0-guide`. The checkout is now clean on main; no Facebook publish state exists, the final video hash still equals the owner-approved `e2b5c1b35c8e87d5223e23ab3c31c6228d79ed2aaecf02a9d399b499d95a5eb0`, guide is live and publisher dry-run returns planned. Rebooked only this approved entry for **10 Nov 09:00 GST**, launchd at **09:03**; retained failure history. No manual live poster call. Instagram failures remain unresolved.
