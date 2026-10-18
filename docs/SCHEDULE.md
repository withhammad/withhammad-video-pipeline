# Publishing schedule

Owner rule 2026-10-18: one reel per day, scheduled at the best time per platform (docs/BEST_TIMES.md, measured from
our own audience data). Never two reels on one day. A reel enters the queue only after its verification passes (SEO,
thumbnail, avatar "perfect"). Queue order chosen by the owner 2026-10-18: FDE, STACK, 100 Dreams, MCP.

| Date (GST) | Day | Reel | Job | Keyword | Status |
|---|---|---|---|---|---|
| 2026-10-18 | Sun | SKILL + HARVEST (posted before the rule) | 9d2d68af60d4 / f7da978d101e | SKILL / HARVEST | published |
| 2026-10-19 | Mon | Forward Deployed Engineer 6-week roadmap | 6cff0a62569f | ROADMAP | in verification |
| 2026-10-20 | Tue | AI startup stack: 14 tools, real costs | 6f8f4ad316a3 | STACK | in verification |
| 2026-10-21 | Wed | UAE 100 Dreams: $10K for 100 media ideas | 91ac50635d3d | PITCH | in verification |
| 2026-10-22 | Thu | 5 MCP servers for Claude Code | c366de480853 | (from its spec) | breakdown |

Per-platform posting times (docs/BEST_TIMES.md, decided 2026-10-18 from our own audience data; review 3 Nov 2026):

| Platform | Mon-Fri (GST) | Sat-Sun (GST) | Backup |
|---|---|---|---|
| YouTube Shorts | 12:00 (Fri 10:00) | 12:00 | 14:00 (Fri 09:00) |
| LinkedIn | 16:00 | 10:00 | 11:00 weekdays |
| Instagram Reels (Collab) | 17:00 | 17:00 | 20:00 |
| TikTok | 17:00 | 17:00 | 20:00 |
| Facebook Reels | 17:00 | 17:00 | 20:00 |
| X | 18:00 | 18:00 | 09:00 |

How each platform is scheduled: YouTube via the API (privacyStatus private + publishAt); TikTok, Facebook, X and
LinkedIn with the composer's own Schedule option in the owner's Chrome; Instagram (Collab with @hammadagentic.ai,
cover_url) has no API scheduling, so it publishes from a local scheduled run at the slot, which also sets up the
ManyChat keyword on the new post and writes the records.
