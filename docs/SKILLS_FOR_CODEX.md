# Skills for Codex: every skill Claude used, and how to install them

Owner order (2026-11-07): Codex must have and use the same skills Claude Code used for the reels. Skills are folders
with a `SKILL.md` (frontmatter `name` + `description`, then the instructions) plus scripts/assets. Claude keeps them in
`~/.claude/skills/`; Codex reads `~/.codex/skills/`.

## Install (run once, then after any `npx skills update`)

```bash
mkdir -p ~/.codex/skills
for d in ~/.claude/skills/*/; do n=$(basename "$d"); [ -e ~/.codex/skills/$n ] || ln -s "$d" ~/.codex/skills/$n; done
for f in ~/.claude/plugins/cache/*/*/*/skills/*/SKILL.md ~/.claude/plugins/cache/*/*/skills/*/SKILL.md; do [ -f "$f" ] || continue; d=$(dirname "$f"); n=$(basename "$d"); [ -e ~/.codex/skills/$n ] || ln -s "$d" ~/.codex/skills/$n; done
ls ~/.codex/skills | wc -l   # expect 127+ entries
```
Symlinks keep one copy, so an update in Claude's folder updates Codex too. Restart the Codex app after installing.
Engine deps for the 20 effects: `node ~/.claude/skills/video-effects/run.cjs list` must list 20 effects (if it says
puppeteer not found: `npm i puppeteer --prefix ~/.claude/skills/video-effects`).

## Video skills used on EVERY reel (read each SKILL.md before the first edit)

| Skill | When | Path | In Codex already |
|---|---|---|---|
| animated-numbers | Make every number in a video move, a big stat that counts up on its spoken word, a time that flips like a clock, a growth line that draws under a count, and a p | `~/.claude/skills/animated-numbers/SKILL.md` | yes |
| apple-style | Make motion graphics in an Apple-grade style, bright light canvas, frosted glass panels, glossy squircles, spring physics with a small settle, one hero object p | `~/.claude/skills/apple-style/SKILL.md` | yes |
| banner-design | Design banners for social media, ads, website heroes, creative assets, and print. Multiple art direction options with AI-generated visuals. Actions: design, cre | `~/.claude/skills/banner-design/SKILL.md` | NO, install |
| behind-my-head | Put a real website, an app screen or one big number BEHIND the speaker's head with real depth. The person is cut out and stays in front, the page rises and scal | `~/.claude/skills/behind-my-head/SKILL.md` | yes |
| big-idea-video | Edit a video where every beat is one big 3D hero object that acts out the spoken noun, a staircase for "steps", a clock for "five minutes", a phone arc for "vid | `~/.claude/skills/big-idea-video/SKILL.md` | yes |
| brand-setup | Put your own brand into every video, read your website's real live stylesheets, write one design-system file (type, colour, shape, shadow, easing, durations), s | `~/.claude/skills/brand-setup/SKILL.md` | yes |
| call-clips | Turn a long recording you already have, a sales call, a coaching call, a client call, a webinar, a podcast or a long YouTube video, into the 3 to 5 best short c | `~/.claude/skills/call-clips/SKILL.md` | yes |
| call-to-action | Build the right ending for each place a business posts a video, a comment-keyword ending for Instagram and TikTok (a clean comment box types the keyword, then t | `~/.claude/skills/call-to-action/SKILL.md` | yes |
| clone-room | Put the clone room effect on your own talking-head clip and get an MP4 back. Copies of you step out behind you in a corridor that recedes into your room, then s | `~/.claude/skills/clone-room/SKILL.md` | yes |
| cube-spin | Put the cube spin effect on your own talking-head clip and get an MP4 back. Your shot becomes the front of a 3D cube that turns a quarter, and you carry on talk | `~/.claude/skills/cube-spin/SKILL.md` | yes |
| depth-ui | Put the depth ui effect on your own talking-head clip and get an MP4 back. Your room falls away and you stand among real app windows at different depths (a term | `~/.claude/skills/depth-ui/SKILL.md` | yes |
| design | Design advisor — identifies the industry from a request, searches bundled CSV design data (colors, typography, UI patterns, styles, landing layouts, UX rules, c | `~/.claude/skills/design/SKILL.md` | NO, install |
| every-format | Render one finished video in every size a business posts, 9:16 for Instagram Reels, TikTok and YouTube Shorts, 4:5 for LinkedIn and feeds, 1:1 for ads and X, 16 | `~/.claude/skills/every-format/SKILL.md` | yes |
| explainer-video | Edit a talking-head video in a clean Apple-style motion look, white canvas, one accent colour, one evolving object per beat that changes on the spoken word, swi | `~/.claude/skills/explainer-video/SKILL.md` | yes |
| figma | Bring Figma into a HyperFrames video - rendered assets, brand tokens, components, storyboard frames as reconstructed motion (frames read as states, not slides), | `~/.claude/skills/figma/SKILL.md` | NO, install |
| frame-break | Put the frame break effect on your own talking-head clip and get an MP4 back. Your shot shrinks into a printed photo while your head and shoulders stay out over | `~/.claude/skills/frame-break/SKILL.md` | yes |
| gpt-image-2 | > | `~/.claude/skills/gpt-image-2/SKILL.md` | NO, install |
| grid-dive | Put the grid dive effect on your own talking-head clip and get an MP4 back. Your shot pulls back into a wall of tiles, each one another moment of your clip, the | `~/.claude/skills/grid-dive/SKILL.md` | yes |
| head-pop-out | Put the head pop out effect on your own talking-head clip and get an MP4 back. Your shot shrinks into a blue panel and your head and shoulders spring up out of  | `~/.claude/skills/head-pop-out/SKILL.md` | yes |
| higgsfield-generate | / | `~/.claude/skills/higgsfield-generate/SKILL.md` | NO, install |
| higgsfield-soul-id | / | `~/.claude/skills/higgsfield-soul-id/SKILL.md` | NO, install |
| higgsfield-video-explainer | / | `~/.claude/skills/higgsfield-video-explainer/SKILL.md` | NO, install |
| hyperframes | Read first to make, edit, animate or render any video with HyperFrames (HTML rendered to video), including launch films, explainers, music videos, charts, maps, | `~/.claude/skills/hyperframes/SKILL.md` | NO, install |
| hyperframes-cli | The HyperFrames CLI by job - scaffold, check, look at frames, edit the timeline, preview, render locally or in the cloud, publish, project history - plus readin | `~/.claude/skills/hyperframes-cli/SKILL.md` | NO, install |
| hyperframes-registry | About 450 ready-made HyperFrames blocks and components installed as editable source - transitions, overlays, titles, kinetic type, captions, charts, map overlay | `~/.claude/skills/hyperframes-registry/SKILL.md` | NO, install |
| imagen | / | `~/.claude/skills/imagen/SKILL.md` | NO, install |
| infinite-zoom | Put the infinite zoom effect on your own talking-head clip and get an MP4 back. A framed copy of the empty stage appears beside you with a frame inside it, and  | `~/.claude/skills/infinite-zoom/SKILL.md` | yes |
| liquid-glass | Put the liquid glass effect on your own talking-head clip and get an MP4 back. A drop of clear glass rises over your chest, spreads into a pill, stretches into  | `~/.claude/skills/liquid-glass/SKILL.md` | yes |
| magnifying-lens | Put the magnifying lens effect on your own talking-head clip and get an MP4 back. A glass lens glides over your chest and magnifies what is under it, then opens | `~/.claude/skills/magnifying-lens/SKILL.md` | yes |
| media-use | Get or make any media for a HyperFrames video - music, sound effects, images, icons, logos, voiceover, avatar and generated video, transcripts, cutouts, colour  | `~/.claude/skills/media-use/SKILL.md` | NO, install |
| news-reaction | Edit a news or reaction video over real footage, one continuous run of footage per spoken line, played in source order, timed so the action lands on the word, w | `~/.claude/skills/news-reaction/SKILL.md` | yes |
| opening-hook | Build the on-screen text hook for the first 2 seconds of a video, the line people read with the sound off. Three tested looks (launch title, logo plus box, spli | `~/.claude/skills/opening-hook/SKILL.md` | yes |
| phone-fan | Put the phone fan effect on your own talking-head clip and get an MP4 back. The camera pulls out to find your shot on a phone, four more phones fan out behind i | `~/.claude/skills/phone-fan/SKILL.md` | yes |
| portal | Put the portal effect on your own talking-head clip and get an MP4 back. A ring of blue light opens below your chin, filled with a turning swirl, and the camera | `~/.claude/skills/portal/SKILL.md` | yes |
| product-demo | Edit a video that demos a real website or app, the real page fills the top of the frame, one exact highlight box lands on the word you say with the rest of the  | `~/.claude/skills/product-demo/SKILL.md` | yes |
| pull-back-reveal | Put the pull back reveal effect on your own talking-head clip and get an MP4 back. The camera pulls right back to show your shot is the preview in a video edito | `~/.claude/skills/pull-back-reveal/SKILL.md` | yes |
| remotion-to-hyperframes | Bring existing video code or footage into HyperFrames and verify it frame by frame against the original - Remotion first, also Motion Canvas, Lottie, Three.js,  | `~/.claude/skills/remotion-to-hyperframes/SKILL.md` | NO, install |
| ribbon-wrap | Put the ribbon wrap effect on your own talking-head clip and get an MP4 back. A blue satin ribbon carrying your words unrolls round you, a gift tag drops off it | `~/.claude/skills/ribbon-wrap/SKILL.md` | yes |
| screen-in-screen | Put the screen in screen effect on your own talking-head clip and get an MP4 back. The camera pulls back to find your shot playing on a laptop on a desk, then d | `~/.claude/skills/screen-in-screen/SKILL.md` | yes |
| shatter | Put the shatter effect on your own talking-head clip and get an MP4 back. Your shot cracks like a pane of glass and the shards fly past the camera, with you who | `~/.claude/skills/shatter/SKILL.md` | yes |
| slides | Create strategic HTML presentations with Chart.js, design tokens, responsive layouts, copywriting formulas, and contextual slide strategies. | `~/.claude/skills/slides/SKILL.md` | NO, install |
| slideshow | Build a HyperFrames slideshow to present live - slides, fragment reveals, branching hotspots and presenter mode with speaker notes, served by `hyperframes prese | `~/.claude/skills/slideshow/SKILL.md` | NO, install |
| spotlight | Put the spotlight effect on your own talking-head clip and get an MP4 back. The frame goes dark and one hard theatre light finds your face, holds, then opens up | `~/.claude/skills/spotlight/SKILL.md` | yes |
| stripe-style | Make motion graphics in a Stripe-style fintech look, white and pale surfaces, deep navy text, one purple accent, one loud gradient used softly, light type weigh | `~/.claude/skills/stripe-style/SKILL.md` | yes |
| tier-list | Edit a ranking video as an S to F tier list. The board fills the top of the frame, each item flies out from the speaker's head and drops into its row exactly on | `~/.claude/skills/tier-list/SKILL.md` | yes |
| tile-tunnel | Put the tile tunnel effect on your own talking-head clip and get an MP4 back. The camera flies backwards out of your shot down a tunnel of tiles, then flies dow | `~/.claude/skills/tile-tunnel/SKILL.md` | yes |
| title-orbit | Put the title orbit effect on your own talking-head clip and get an MP4 back. Your words circle your head like a ring on a studio floor, then the camera flies t | `~/.claude/skills/title-orbit/SKILL.md` | yes |
| toolkit-video | Build a fast montage video that shows off a pack of slash commands or skills, a clean white prompt bar types each command, the autocomplete menu shows its one-l | `~/.claude/skills/toolkit-video/SKILL.md` | yes |
| ui-ux-pro-max | UI/UX design intelligence. Searchable local database with 67 styles, 161 palettes, 57 font pairings, 25 charts, and 21 stacks (React, Next.js, Vue, Svelte, Astr | `~/.claude/skills/ui-ux-pro-max/SKILL.md` | NO, install |
| vertigo | Put the vertigo effect on your own talking-head clip and get an MP4 back. A dolly zoom. You hold your size while a gridded corridor stretches away behind you, t | `~/.claude/skills/vertigo/SKILL.md` | yes |
| video-check | Check a finished video before it goes up, file format (H.264, limited colour range, the right size for the platform), frame count, the hook on frame 0, captions | `~/.claude/skills/video-check/SKILL.md` | yes |
| video-effects | The shared engine behind the 20 one-command video effects (grid-dive, title-orbit, magnifying-lens, portal, clone-room, infinite-zoom, cube-spin, liquid-glass,  | `~/.claude/skills/video-effects/SKILL.md` | yes |
| video-intake | Turn a raw talking-head recording into a clean, cut take with word timings, face frames and a ready video folder that every other editing skill in this pack bui | `~/.claude/skills/video-intake/SKILL.md` | yes |
| video-sound | Mix the sound for a video, voice at one static gain, a music bed about 12 dB under it at one steady level to the last frame, a short music take looped on whole  | `~/.claude/skills/video-sound/SKILL.md` | yes |
| word-highlight | Put one exact highlight box on a word in a screenshot, page or headline at the moment it is spoken, measured off the image pixels and trimmed to the letter ink, | `~/.claude/skills/word-highlight/SKILL.md` | yes |
| zoom-cut | Replace hard cuts between two B-roll shots or two graphic beats with a zoom-through transition, a fast zoom into the thing being pointed at, a short blur, and t | `~/.claude/skills/zoom-cut/SKILL.md` | yes |
| zoom-through | Put the zoom through effect on your own talking-head clip and get an MP4 back. A chat window shows your ask, the reply streams in with a video card, and the cam | `~/.claude/skills/zoom-through/SKILL.md` | yes |

Plugin skills (Remotion and video watching):

| Skill | When | Path |
|---|---|---|
| access-protected-vercel-deployment | Access and test Vercel deployments protected by Vercel Authentication, SSO, or Deployment Protection. Use when curl, agent-browser, Playwright, or another autom | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/access-protected-vercel-deployment/SKILL.md` |
| ai-gateway | Vercel AI Gateway guidance for setup, model discovery, authentication, routing, fallbacks, BYOK, budgets, spend reporting, observability, compatible APIs, and c | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/ai-gateway/SKILL.md` |
| ai-sdk | Vercel AI SDK expert guidance. Use when building AI-powered features — chat interfaces, text generation, structured output, tool calling, agents, MCP integratio | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/ai-sdk/SKILL.md` |
| auth | Authentication integration guidance — Clerk (native Vercel Marketplace), Descope, and Auth0 setup for Next.js applications, plus Sign in with Vercel, Vercel Pas | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/auth/SKILL.md` |
| bootstrap | Project bootstrapping orchestrator for repos that depend on Vercel-linked resources (databases, auth, and managed integrations). Use when setting up or repairin | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/bootstrap/SKILL.md` |
| build-agents | Default guidance for building AI agents. Use for generic requests to build, create, scaffold, design, architect, or implement an AI agent, agent app, tool-calli | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/build-agents/SKILL.md` |
| cdn-caching | Debug Vercel CDN caching — cache hit rate, stale content, revalidation behavior, ISR + PPR, per-request cache reasons (cacheReason) and PPR state (ppr_state), a | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/cdn-caching/SKILL.md` |
| chat-sdk | Vercel Chat SDK expert guidance. Use when building multi-platform chat bots — Slack, Telegram, Microsoft Teams, Discord, Google Chat, GitHub, Linear — with a si | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/chat-sdk/SKILL.md` |
| create-a-backend | Backend architecture guidance. Use when planning, building, or migrating an API or backend; choosing between Functions, Services, containers, Workflow, Queues,  | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/create-a-backend/SKILL.md` |
| custom-metrics | Emit and query Vercel Custom Metrics. Use when instrumenting application or business measurements in Vercel Functions, using metric() from @vercel/functions, ch | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/custom-metrics/SKILL.md` |
| deployments-cicd | Vercel deployment and CI/CD expert guidance. Use when deploying, promoting, rolling back, inspecting deployments, building with --prebuilt, or configuring CI wo | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/deployments-cicd/SKILL.md` |
| env-vars | Vercel environment variable expert guidance. Use when working with .env files, vercel env commands, OIDC tokens, or managing environment-specific configuration. | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/env-vars/SKILL.md` |
| eve | eve framework guidance for durable AI agents and agent-powered applications. Use when creating, editing, or debugging an eve project, when the user explicitly a | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/eve/SKILL.md` |
| flags-sdk | Set up and use feature flags and A/B tests with the Flags SDK (`flags` npm package) and Vercel Flags. Use when installing or configuring the SDK, adding a new o | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/flags-sdk/SKILL.md` |
| knowledge-update | Corrects outdated LLM knowledge about the Vercel platform and introduces new products. Injected at session start. | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/knowledge-update/SKILL.md` |
| marketplace | Vercel Marketplace expert guidance — discovering, installing, and managing third-party integrations via the `vercel integration` CLI. Use when building any app  | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/marketplace/SKILL.md` |
| microfrontends | Guide for building, configuring, and deploying microfrontends on Vercel. Use this skill when the user mentions microfrontends, multi-zones, splitting an app acr | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/microfrontends/SKILL.md` |
| next-cache-components | Next.js 16 Cache Components guidance — PPR, use cache directive, cacheLife, cacheTag, updateTag, and migration from unstable_cache. Use when implementing partia | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/next-cache-components/SKILL.md` |
| next-forge | next-forge expert guidance — production-grade Turborepo monorepo SaaS starter by Vercel. Use when working in a next-forge project, scaffolding with `npx next-fo | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/next-forge/SKILL.md` |
| next-upgrade | Upgrade Next.js to the latest version following official migration guides and codemods. Use when upgrading Next.js versions, running codemods, or migrating betw | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/next-upgrade/SKILL.md` |
| nextjs | Next.js App Router expert guidance. Use when building, debugging, or architecting Next.js applications — routing, Server Components, Server Actions, Cache Compo | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/nextjs/SKILL.md` |
| queues | Vercel Queues guidance — durable topics with at-least-once delivery, independent consumer groups, retries, delays, and idempotency keys via @vercel/queue (JS) o | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/queues/SKILL.md` |
| react-best-practices | React best-practices reviewer for TSX files. Triggers after editing multiple TSX components to run a condensed quality checklist covering component structure, h | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/react-best-practices/SKILL.md` |
| routing-middleware | Vercel Routing Middleware guidance — request interception before cache, rewrites, redirects, personalization. Works with any framework. Supports Edge, Node.js,  | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/routing-middleware/SKILL.md` |
| runtime-cache | Vercel Runtime Cache API guidance — ephemeral per-region key-value cache with tag-based invalidation. Shared across Functions, Routing Middleware, and Builds. U | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/runtime-cache/SKILL.md` |
| shadcn | shadcn/ui expert guidance — CLI, component installation, composition patterns, custom registries, theming, Tailwind CSS integration, and high-quality interface  | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/shadcn/SKILL.md` |
| turbopack | Turbopack expert guidance. Use when configuring the Next.js bundler, optimizing HMR, debugging build issues, or understanding the Turbopack vs Webpack differenc | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/turbopack/SKILL.md` |
| vercel-agent | Vercel Agent guidance — dashboard and Slack chat, code review, production investigation, approved actions, and product installation. Use when configuring or wor | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-agent/SKILL.md` |
| vercel-cli | Vercel CLI expert guidance. Use when deploying, managing environment variables, linking projects, viewing logs, querying metrics, managing domains, managing fea | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-cli/SKILL.md` |
| vercel-connect | Vercel Connect expert guidance — securely obtain scoped OAuth tokens for third-party services (Slack, GitHub, MCP servers, OAuth, Snowflake) on behalf of apps o | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-connect/SKILL.md` |
| vercel-firewall | Vercel Firewall expert guidance — automatic DDoS mitigation, the Vercel WAF (custom rules, IP blocking, managed rulesets, rate limiting), Attack Mode, system by | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-firewall/SKILL.md` |
| vercel-functions | Vercel Functions expert guidance — Node.js/Bun/Python runtimes, Fluid Compute, long-duration (30 min) functions, large functions (5 GB bundles), Docker/OCI cont | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-functions/SKILL.md` |
| vercel-sandbox | Vercel Sandbox guidance — ephemeral Firecracker microVMs for running untrusted code safely. Supports AI agents, code generation, and experimentation. Use when e | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-sandbox/SKILL.md` |
| vercel-services | Configure and troubleshoot Vercel Services for multiple frontends and backends in one project. Use when composing a polyglot or multi-service application on one | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-services/SKILL.md` |
| vercel-storage | Vercel storage expert guidance — Blob, Global Config (formerly Edge Config), and Marketplace storage (Neon Postgres, Upstash Redis). Use when choosing, configur | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/vercel-storage/SKILL.md` |
| verification | Full-story verification — infers what the user is building, then verifies the complete flow end-to-end: browser → API → data → response. Triggers on dev server  | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/verification/SKILL.md` |
| workflow | Vercel Workflow SDK expert guidance. Use when building durable workflows, long-running tasks, API routes or agents that need pause/resume, retries, step-based e | `~/.claude/plugins/cache/claude-plugins-official/vercel/0.50.0/skills/workflow/SKILL.md` |
| remotion-best-practices | Router for all Remotion skills | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-best-practices/SKILL.md` |
| remotion-captions | Transcribing, displaying and animating captions | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-captions/SKILL.md` |
| remotion-create | Create a new Remotion video | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-create/SKILL.md` |
| remotion-docs | Search Remotion documentation | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-docs/SKILL.md` |
| remotion-interactivity | Structure Remotion markup for interactivity | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-interactivity/SKILL.md` |
| remotion-maps | Remotion Map animation knowledge | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-maps/SKILL.md` |
| remotion-markup | Content, animation and effects best practices | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-markup/SKILL.md` |
| remotion-multimedia | Interacting with Mediabunny | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-multimedia/SKILL.md` |
| remotion-render | Export a Remotion video | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-render/SKILL.md` |
| remotion-saas | Build an app with Remotion | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-saas/SKILL.md` |
| remotion-studio | Preview a Remotion video | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-studio/SKILL.md` |
| remotion-upgrade | Upgrade Remotion, and related packages | `~/.claude/plugins/cache/remotion/remotion/4.0.512/skills/remotion-upgrade/SKILL.md` |
| scroll-world | > | `~/.claude/plugins/cache/scroll-world/scroll-world/0.8.0/skills/scroll-world/SKILL.md` |

## Every other installed skill

| Skill | When | In Codex already |
|---|---|---|
| _gstack-command | Router for the gstack skill suite. (gstack) | no |
| brand | Brand voice, visual identity, messaging frameworks, asset management, brand consistency. Activate for branded content, tone of voice, marketing assets, brand co | no |
| credential-tracker | Maintain a live checklist of required API keys / accounts / links and their status for integration-heavy projects. Use when the user asks "what's pending", "wha | no |
| design-system | Token architecture, component specifications, and slide generation. Three-layer tokens (primitive→semantic→component), CSS variables, spacing/typography scales, | no |
| find-skills | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express int | no |
| framer | > | no |
| framer-code-components | Framer code component implementation guidance, platform constraints, layout annotations, property controls, and authoring best practices. Use only after loading | no |
| graphify | Use for any question about a codebase, its architecture, file relationships, or project content — especially when graphify-out/ exists, where the question shoul | no |
| gstack | Router for the gstack skill suite. (gstack) | no |
| gstack-autoplan | Auto-review pipeline — reads the full CEO, design, eng, and DX review skills from disk and runs them sequentially with auto-decisions using 6 decision principle | no |
| gstack-benchmark | Performance regression detection using the browse daemon. (gstack) | no |
| gstack-benchmark-models | Cross-model benchmark for gstack skills. (gstack) | no |
| gstack-browse | Fast headless browser for QA testing and site dogfooding. (gstack) | no |
| gstack-canary | Post-deploy canary monitoring. (gstack) | no |
| gstack-careful | Safety guardrails for destructive commands. (gstack) | no |
| gstack-codex | OpenAI Codex CLI wrapper — three modes. (gstack) | no |
| gstack-connect-chrome | Launch GStack Browser — AI-controlled Chromium with the sidebar extension baked in. | no |
| gstack-context-restore | Restore working context saved earlier by /context-save. (gstack) | no |
| gstack-context-save | Save working context. (gstack) | no |
| gstack-cso | Chief Security Officer mode. (gstack) | no |
| gstack-design-consultation | Design consultation: understands your product, researches the landscape, proposes a complete design system (aesthetic, typography, color, layout, spacing, motio | no |
| gstack-design-html | Design finalization: generates production-quality Pretext-native HTML/CSS. (gstack) | no |
| gstack-design-review | Designer's eye QA: finds visual inconsistency, spacing issues, hierarchy problems, AI slop patterns, and slow interactions — then fixes them. (gstack) | no |
| gstack-design-shotgun | Design shotgun: generate multiple AI design variants, open a comparison board, collect structured feedback, and iterate. (gstack) | no |
| gstack-devex-review | Live developer experience audit. (gstack) | no |
| gstack-diagram | Turn an English description (or mermaid source) into a diagram triplet: the source, an editable .excalidraw file you can open (gstack) | no |
| gstack-document-generate | Generate missing documentation from scratch for a feature, module, or entire project. (gstack) | no |
| gstack-document-release | Post-ship documentation update. (gstack) | no |
| gstack-freeze | Restrict file edits to a specific directory for the session. (gstack) | no |
| gstack-guard | Full safety mode: destructive command warnings + directory-scoped edits. (gstack) | no |
| gstack-health | Code quality dashboard. (gstack) | no |
| gstack-investigate | Systematic debugging with root cause investigation. (gstack) | no |
| gstack-ios-clean | Remove the DebugBridge SPM package and all #if DEBUG wiring from an iOS app. (gstack) | no |
| gstack-ios-design-review | Visual design audit for iOS apps on real hardware. (gstack) | no |
| gstack-ios-fix | Autonomous iOS bug fixer. (gstack) | no |
| gstack-ios-qa | Live-device iOS QA for SwiftUI apps. (gstack) | no |
| gstack-ios-sync | Regenerate the iOS debug bridge against the latest upstream gstack templates. (gstack) | no |
| gstack-land-and-deploy | Land and deploy workflow. (gstack) | no |
| gstack-landing-report | Read-only queue dashboard for workspace-aware ship. (gstack) | no |
| gstack-learn | Manage project learnings. | no |
| gstack-make-pdf | Turn any markdown file into a publication-quality PDF. (gstack) | no |
| gstack-office-hours | YC Office Hours — two modes. (gstack) | no |
| gstack-open-gstack-browser | Launch GStack Browser — AI-controlled Chromium with the sidebar extension baked in. | no |
| gstack-pair-agent | Pair a remote AI agent with your browser. (gstack) | no |
| gstack-plan-ceo-review | CEO/founder-mode plan review. (gstack) | no |
| gstack-plan-design-review | Designer's eye plan review — interactive, like CEO and Eng review. (gstack) | no |
| gstack-plan-devex-review | Interactive developer experience plan review. (gstack) | no |
| gstack-plan-eng-review | Eng manager-mode plan review. (gstack) | no |
| gstack-plan-tune | Self-tuning question sensitivity + developer psychographic for gstack (v1: observational). (gstack) | no |
| gstack-qa | Systematically QA test a web application and fix bugs found. (gstack) | no |
| gstack-qa-only | Report-only QA testing. (gstack) | no |
| gstack-retro | Weekly engineering retrospective. (gstack) | no |
| gstack-review | Pre-landing PR review. (gstack) | no |
| gstack-scrape | Pull data from a web page. (gstack) | no |
| gstack-setup-browser-cookies | Import cookies from your real Chromium browser into the headless browse session. (gstack) | no |
| gstack-setup-deploy | Configure deployment settings for /land-and-deploy. | no |
| gstack-setup-gbrain | Set up gbrain for this coding agent: install the CLI, initialize a local PGLite or Supabase brain, register MCP, capture per-remote trust policy. (gstack) | no |
| gstack-ship | Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR. (gstack) | no |
| gstack-skillify | Codify the most recent successful /scrape flow into a permanent browser-skill on disk. (gstack) | no |
| gstack-spec | Turn vague intent into a precise, executable spec in five phases. (gstack) | no |
| gstack-sync-gbrain | Keep gbrain current with this repo's code and refresh agent search guidance in CLAUDE.md. Wraps the gstack-gbrain-sync orchestrator with state (gstack) | no |
| gstack-unfreeze | Clear the freeze boundary set by /freeze, allowing edits to all directories again. (gstack) | no |
| gstack-upgrade | Upgrade gstack to the latest version. | no |
| harden-claude-md | Audit and upgrade a project's CLAUDE.md so a cheaper model (Opus/Sonnet) matches strong-model quality. Use when the user asks to review, upgrade, or harden a CL | no |
| higgsfield-game-generation | / | no |
| higgsfield-marketplace-cards | / | no |
| higgsfield-product-photoshoot | / | no |
| higgsfield-websites | / | no |
| printo-outreach-replies | Draft replies to businesses responding to Printo's outreach emails. Use whenever a reply-drafting task appears (classified replies, Gmail triage, "draft a reply | no |
| ui-styling | Create beautiful, accessible user interfaces with shadcn/ui components (built on Radix UI + Tailwind), Tailwind CSS utility-first styling, and canvas-based visu | no |

## Project workflows (Claude workflow scripts: read as step-by-step specs)

- `.claude/workflows/reference-breakdown.js`: analyse a reference (visual scenes, beat map, fact-check) -> replication spec.
- `.claude/workflows/seo-pack.js`: per-platform SEO from real search data -> verified seo.json.
- `.claude/workflows/resource-page.js`: build + verify the withhammad.com resource page (and blog + DM rule) -> PR.

How they combine for one reel: docs/HANDOVER_CODEX.md sections 9 (runbook), 11 (craft + gates), 12 (playbook by format).
