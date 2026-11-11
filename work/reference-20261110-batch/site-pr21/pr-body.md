The approved HIGGS and ADVISOR reels point to missing guides. This adds both companion pages at the exact release URLs, appends their keyword rules, and registers the pages in the resource index and its generated sitemap.

The guides include setup steps, reusable prompts, billing checks, FAQs and attribution. ADVISOR includes Fable 5.2’s version requirement, current Claude Platform on AWS support and the gateway caveat. The shared guide template gains optional server-rendered FAQs and matching JSON-LD. Existing follow-gate behavior and all previous rules are preserved.

### Preview

- [HIGGS guide](https://withhammad-rebuild-8wzdgqb08-hammad-s-projects9.vercel.app/resources/claude-higgsfield-video-setup)
- [ADVISOR guide](https://withhammad-rebuild-8wzdgqb08-hammad-s-projects9.vercel.app/resources/claude-fable-advisor-setup)
- [Ready deployment](https://vercel.com/hammad-s-projects9/withhammad-rebuild/GbwqzmymANmUSG7sAhoWGx5cdPt8), commit `fc7b362`.

Both protected preview routes were fetched through authenticated `vercel curl`: HTTP 200, expected unique title, one H1, production canonical and FAQ schema. The first rebuild preview hit the previously seen Google `next/font` loader error; an unchanged preview redeploy succeeded. No production deploy was performed.

### Validation

- Production build, TypeScript and diff checks pass. Lint: zero errors, five existing image warnings.
- Both pages: 390px/1440px layout checks, no horizontal overflow, dark/mobile light checks, server-rendered content, unique metadata/OG images, three contextual related links, resource index and sitemap inclusion.
- HIGGS/ADVISOR rules match case-insensitively as whole words, reject substring matches, and point to the exact approved URLs. No live messages sent.
- Lighthouse SEO **100** on both. Mobile performance **95/97**, accessibility **96/96**, CLS **0.022/0**, TBT **110/90 ms**. ADVISOR LCP **2.4s**. HIGGS LCP **2.7s** on two runs, above the 2.5s target; recorded as a remaining performance limitation. Lab TBT does not establish field INP.
- Full-site SEO: 381/382 routes pass. Existing `/resources/ai-business` lacks JSON-LD, also verified on production.
- Existing CI prompt governance: **64 violations**. Agent evals: **one JARVIS Arabic FAQ parity failure**. Both outputs are byte-identical to a clean `origin/main` snapshot; no checked agent/prompt files changed. CI stops at the existing prompt check.

Local evidence: pipeline `work/reference-20261110-batch/site-pr21/` contains screenshots, Lighthouse JSON, baseline logs and validation results.

### Release gate

The owner approved both finished video packages for release once guides/rules are live. Owner review and merge are still required for this website PR. Production currently returns 404 for both new routes. After merge, verify the production deployment and keyword routing before release. This PR does not post, send DMs, change queues or authorize a merge by an agent.
