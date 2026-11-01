# withhammad.com — SEO audit and fix plan (2026-11-01)

Research only. Nothing was changed or deployed. Live pages were fetched with curl on
2026-11-01; repo read at `work/site/withhammad-rebuild` (Next.js 15.5, App Router, Vercel).
Saved HTML of every audited page: `/private/tmp/claude-501/-Users-hammad-withhammad-video-pipeline/5fde070d-a498-45f3-88f9-d7769454f905/scratchpad/site/`.

## 1. Where metadata comes from (so fixes map to files)

| Concern | File | Notes |
|---|---|---|
| Root `<title>` template, default description, OG site name | `src/app/layout.tsx` | Template `%s — Hammad Yousuf \| AI Marketing Automation Engineer` (≈52 chars of boilerplate) is appended to every page that does not opt out |
| Per-page title/description/canonical/OG/Twitter | `src/lib/seo/meta.ts` (`pageMeta`) | Canonical = `site.url + path`; OG image = `/api/og?title=…` (1200x630). No `robots` meta unless `noindex`. No `authors`, no `article:published_time` |
| JSON-LD nodes | `src/lib/seo/jsonld.ts` | `graph()` always emits Person + Organization + WebSite, then page nodes. `articleNode` has no `image`, no `mainEntityOfPage`, `publisher` = Person. `videoObjectNode` exists but hardcodes `uploadDate: "2026-08-01"` and is **not used by any blog/resource page** |
| Canonical facts (name, role, socials for `sameAs`) | `src/lib/site.ts` | `instagram: https://instagram.com/with.hammad` (old account); no Facebook, TikTok, X |
| Sitemap | `src/app/sitemap.ts` | Hand-listed resource pages + `getPosts()` blog posts; no video sitemap, no `<image:image>` |
| robots.txt | `src/app/robots.ts` | Allows `*` and six AI crawlers; disallows `/products /studio /styleguide /links /api/` |
| Resource pages | `src/app/(site)/resources/<slug>/page.tsx` + `src/content/resources/<slug>.ts` | Static; `title: { absolute: r.metaTitle }` (so ≤60 chars); Article + HowTo + Breadcrumb; **no video embed by design**; "Keep going" block hand-coded, does not link to the matching blog post |
| Blog posts | `src/app/(site)/blog/[slug]/page.tsx` + `src/content/blog-posts/<slug>.ts` | `generateMetadata` uses `pageMeta` **without** `absolute`, so template boilerplate is appended; Article + Breadcrumb + FAQPage; `reel` block renders `<video src=/media/reels/<slug>.mp4 poster=/media/covers/<slug>.jpg>` with **no VideoObject**; `dateModified` only if `updatedAt` set (it is not on the 12 new posts) |
| Nav | `src/components/site/Header.tsx`, `Footer.tsx`, `MobileNav.tsx` | Link to `/blog` and `/about`; **no `/resources` link anywhere in site chrome** |
| Analytics | `src/components/site/Analytics.tsx` | GA4 / GTM / Clarity from `NEXT_PUBLIC_GA4`, `NEXT_PUBLIC_GTM`, `NEXT_PUBLIC_CLARITY_ID` |
| Weekly SEO report | `src/lib/seo/seoReport.ts`, `vercel.json` cron `0 6 * * 1` | GSC section skipped while `GSC_CREDENTIALS` is unset |

## 2. Findings table (live, 2026-11-01)

All pages: HTTP 200, `https`, canonical = URL, OG + Twitter `summary_large_image` present and consistent, **no `robots` meta (default index,follow)**, **no hreflang** (fine: these pages have no `/ar` twin), GA4 gtag loads, GTM noscript iframe present. Sitemap: 352 URLs; **all 6 audited pages and all 12 new blog posts are in it**. robots.txt correct and points to sitemap.

| Page | Title (len) | Description (len) | H1 | JSON-LD present | Missing / wrong |
|---|---|---|---|---|---|
| `/` | Hammad Yousuf — AI Marketing Automation Engineer, Dubai (55) | 148 | Agents that run your marketing. | Person, Organization, WebSite | No link to `/resources` (nav + body). HTML 293 KB. Person lacks `image`, `description`; sameAs points to old Instagram. Lighthouse W44: LCP 6.9 s, perf 38 |
| `/resources` | Free AI Resources: Prompts, Guides and Checklists (49) | 144 | ok | Person, Org, WebSite, BreadcrumbList, CollectionPage | Links to 0 blog posts; HTML 263 KB |
| `/blog` | Blog — AI Agent Prompts, Tutorials & GCC Growth — Hammad Yousuf \| AI Marketing Automation Engineer (**98**) | 138 | ok | Person, Org, WebSite, BreadcrumbList | Title boilerplate; **828 KB HTML** (45 inline OG cover imgs + full list); links to 0 resource pages; Lighthouse W44 LCP 2.9 s, CLS 0.09 |
| `/resources/claude-duet` | Claude Duet: what it is, who can get it, how to prepare (55) | 145 | ok (matches title) | Article, HowTo, Breadcrumb (+ base 3) | No link to `/blog/claude-duet`; Article has no `image`, `mainEntityOfPage`, `author.url`; no `<img>`/video at all (text-only, fine); "Sources" section is strong E-E-A-T. HTML 233 KB, TTFB ~0.85 s |
| `/resources/kimi-k3-on-8gb-ram` | Kimi K3 on 8 GB of RAM with no GPU: what it really takes (56) | 152 | ok | Article, HowTo, Breadcrumb | No link to `/blog/kimi-k3-on-8gb-ram`; same Article gaps; TTFB ~1.05 s |
| `/resources/ai-traffic-ga4` | Track AI search traffic in GA4 (ChatGPT, Claude, Gemini) (56) | 149 | "Track your AI search traffic in GA4 (and why it may convert better)" | Article, HowTo, Breadcrumb | No link to `/blog/ai-traffic-ga4`; same Article gaps |
| `/blog/claude-duet` | Claude Duet explained: Anthropic's agent that messages first — Hammad Yousuf \| AI Marketing Automation Engineer (**111**) | 155 | ok | Article, Breadcrumb, **FAQPage (4 Q)** | **`<video>` embed but no VideoObject**; no `dateModified`; no `image` in Article; FAQPage no longer earns a rich result (see §3); 1 link to resource ✔, 2 related posts ✔ |
| `/blog/kimi-k3-on-8gb-ram` | Kimi K3 on 8GB RAM, no GPU: how kimi-k3-in-c does it — … (**103**) | 155 | ok | Article, Breadcrumb, FAQPage | same as above |
| `/blog/ai-traffic-ga4` | Track AI traffic in GA4: the AI Assistant channel — … (**100**) | 150 | ok (long, 100+ chars) | Article, Breadcrumb, FAQPage | same as above |
| `/about` | About Hammad Yousuf — AI Marketing Engineer, Dubai — Hammad Yousuf \| … (**101**) | 138 | Performance marketer first. Engineer by necessity. | ProfilePage → Person, Breadcrumb | Good entity home; ProfilePage lacks `dateCreated/dateModified`, Person lacks `image`, `description`, `knowsAbout`; no link to `/resources`; blog author block does not link here |

Image alt: every `<img>` on the audited pages has a non-empty, descriptive alt (home 2, blog index 45, blog posts 1 each). Blog covers are `/api/og` renders (dynamic edge route, 1200x630 only, not `next/image`).

Internal linking matrix (audited pages):

| From → To | home | /resources | /blog | resource page | blog post | /about |
|---|---|---|---|---|---|---|
| home | – | **no** | yes | no | no | yes |
| /resources | yes | – | yes (nav) | yes (all cards) | **no** | yes |
| /blog | yes | **no** | – | no | yes (all) | yes |
| resource page | yes | yes | yes (nav) | 2–3 siblings | **no** | yes (nav) |
| blog post | yes | **no** | yes | 1 (own resource) | 2 related | yes (nav) |

The W44 crawler already flags three resource pages as unreachable from home via internal links (`reports/site-audit-2026-W44.md`). Root cause is the same: `/resources` is absent from the nav and from the home page.

Core Web Vitals: PageSpeed Insights API returned 429 (daily quota, no key), so field data could not be pulled here. Repo's own Lighthouse CI (W44, 2026-11-01): `/` perf 38 / LCP 6.9 s; `/blog` LCP 2.9 s; `/blog/google-ads-automation-n8n-tutorial` LCP 2.3 s, CLS 0.03. HTML payloads of 220–290 KB per page (828 KB for `/blog`) are the obvious lever.

Analytics / Search Console status (repo + live):
- GA4: measurement ID set in Vercel prod; `gtag/js?id=G-…` loads on every audited page (confirmed in live HTML). GTM container also live (noscript iframe present). IDs are recorded in `CREDENTIALS.md` lines 14–24; not reproduced here.
- Google Search Console: domain property verified and sitemap submitted 2026-08-08 (`CREDENTIALS.md` line 91). **GSC API service account (`GSC_CREDENTIALS`) still unset** → the weekly `/api/cron/seo-report` skips the Search Console section. Bing Webmaster verified.
- Microsoft Clarity: env name exists; not loading on live pages (no `clarity.ms` script).

## 3. 2026 SEO research — what applies to this site

1. **FAQ rich results are gone (all sites).** Google restricted FAQ rich results to authoritative government/health sites in Aug–Sep 2023, then stopped showing them entirely from 7 May 2026; the FAQ report and Rich Results Test support were removed in June 2026. FAQPage markup is still valid schema and harmless, but it no longer buys SERP real estate. Keep the visible FAQ (it is good answer-engine fodder), stop treating the markup as a ranking lever. [E1][E2]
2. **VideoObject still works, but a blog post with an embedded reel is not a "watch page".** Google: a watch page exists to show one video; a blog post where the video is secondary can still appear as a text result or an image result with a video badge, but not in video-specific features. Required VideoObject props: `name`, `thumbnailUrl`, `uploadDate`; recommended `contentUrl`, `duration`, `description`, `author`, `hasPart` (Clip) for key moments; video ≥30 s for key moments. A video sitemap (`<video:content_loc>`, `<video:thumbnail_loc>`, `<video:title>`, `<video:description>`) is the complementary discovery path. [E3][E4][E5]
3. **AI Overviews / AI Mode: no special markup; cited pages are indexed, snippet-eligible, well-linked, text-first.** Google's own guidance: "no additional requirements… nor other special optimizations"; it recommends crawlability, strong internal linking, page experience, content in text form with supporting media, and people-first content. Third-party 2026 studies (Ahrefs Mar 2026, 863k SERPs) show only ~38 % of AI-Overview-cited URLs ranked top-10 for the query (query fan-out), and practitioner studies converge on: direct answer in the first ~80 words, question-style H2s, self-contained paragraphs, named entities + numbers, freshness. The resource pages already do this (answer-first lead, "At a glance", dated "as of" labels). [E6][E7]
4. **E-E-A-T / helpful content.** Google's self-assessment asks for clear bylines linking to author background, first-hand experience, original analysis rather than summarising, and disclosure of automation where readers would expect it. The site's "Sources / Checked:" blocks and the "presented by an AI avatar" note are exactly what this asks for. Gaps: bylines on blog posts are plain text (no link to `/about`), Article `author` has no `url`, Person lacks `image`/`description`. [E8][E9]
5. **Article schema recommendations:** `author.url` (or `sameAs`) to a profile page, `image` in 16:9 / 4:3 / 1:1 at ≥50k px, `datePublished` and `dateModified` with timezone, concise `headline`. ProfilePage: `mainEntity` Person with `name`, recommended `image`, `description`, `sameAs`, `dateCreated/dateModified`. [E9][E10]
6. **Title links.** No hard length cap, but Google rewrites titles when it sees boilerplate repeated across pages or a duplicated site name; add only a concise site name to non-home pages. Current blog/about titles append a 52-char template → 98–111 char titles that Google will truncate or rewrite. [E11]
7. **Internal links.** Every indexable page needs at least one in-context link from another page; descriptive anchors; link related resources where they help the reader. Resource→blog is currently zero and `/resources` is orphaned from the nav. [E12]
8. **Core Web Vitals.** Thresholds LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 (75th percentile); part of page-experience signals the core ranking systems reward. Home LCP is 2.8× the threshold in the repo's own Lighthouse run. [E13]
9. **Search Essentials key practices**: words the audience searches for in title, H1, alt text, link text; crawlable links; follow video/structured-data best practices. [E14]

### Google autocomplete (2026-11-01, `client=firefox&hl=en`)

| Seed | Suggestions (in order) | Takeaway |
|---|---|---|
| claude duet | claude duet, **claude duet github**, claude duet asset planning services, duet claude code, (music noise) | "claude duet github" is the live intent; the blog post already states there is no official repo — surface that in the title/H2. "waitlist" and "price" return no suggestions yet (too new) |
| kimi k3 8gb ram | kimi k3 8gb ram, **kimi k3 8gb ram github**, **kimi k3 local 8gb ram** | Add "local" and "GitHub (kimi-k3-in-c)" to resource title/H2 |
| kimi k3 | kimi k3 ai, kimi k3.1 pro, **kimi k3 pricing**, kimi k3.1, kimi k3 open source, kimi k3 free, kimi k3 api, kimi k3 huggingface, kimi k3 vs fable 5 | Broader hub opportunity: "kimi k3 open source / free / huggingface" |
| track ai traffic ga4 | **track ai traffic in ga4** | Use exactly "track AI traffic in GA4" (blog already does; resource says "AI search traffic") |
| ga4 ai traffic | ga4 ai traffic, **ga4 ai traffic report**, **ga4 ai assistant traffic** | "AI Assistant channel/traffic" is the right entity; add "report" |
| claude code skills | claude code skills github / marketplace / for developers / examples / library / for web design / best practices / repo / directory | Big cluster; the LinkedIn-installs and SkillSpector pages should target "claude code skills library/examples" |
| ai agents for marketers | ai agents for marketing automation / teams / and sales / campaigns / agencies / github / course / reddit | Home/services should carry "AI agents for marketing automation" literally |

## 4. Prioritised fix list

Each item names the file(s) and the exact change. None applied.

### P1 — Fix blog/about `<title>` boilerplate (98–111 chars → ≤60)
- **File:** `src/app/(site)/blog/[slug]/page.tsx` `generateMetadata` → wrap: `return { ...pageMeta({...}), title: { absolute: post.seo.title } }` (same pattern resource pages already use). Same for `src/app/(site)/blog/page.tsx`, `src/app/(site)/about/page.tsx`.
- **Better root fix:** `src/app/layout.tsx` → `template: "%s | withhammad"` (10 chars of site name, as Google recommends) so every page that still uses the template stays under ~70 chars.
- Why: Google rewrites titles with repeated boilerplate/duplicated site name [E11]; `post.seo.title` is already written to 60 chars and gets wasted.

### P2 — Put `/resources` in the site chrome and on the home page; link resource ↔ blog both ways
- **Nav:** `src/components/site/Header.tsx`, `Footer.tsx`, `MobileNav.tsx` → add `{ label: "Resources", href: "/resources" }` next to Blog (add `strings.nav.resources` in `src/content/strings.ts`).
- **Home:** `src/app/(site)/page.tsx` → a "Free guides from the reels" strip listing the 3–6 newest `reelResources` (reuse `ResourceCard`).
- **Resource → blog:** every `src/app/(site)/resources/<slug>/page.tsx` "Keep going" list → add `<Link href="/blog/<slug>">Read the full write-up: {post.title}</Link>`; make it data-driven by adding `blogSlug: "claude-duet"` to each `src/content/resources/<slug>.ts` and resolving via `getPost`.
- **Blog → resource:** already present once in body + Sources; also add the resource as a third "KEEP GOING" card (`relatedResource` field on `Post`, `src/lib/types.ts`), and add `/resources` to the "KEEP GOING" area on `/blog`.
- **`/resources` index → blog:** `src/app/(site)/resources/page.tsx` → under each reel card, a small "Blog post →" link when `blogSlug` exists.
- Why: resolves the W44 "unreachable from home" errors, and AI-feature guidance names internal linking explicitly [E6][E12].

### P3 — VideoObject on every blog post that embeds a reel, plus a video sitemap
- **Schema:** `src/lib/seo/jsonld.ts` `videoObjectNode` → take `uploadDate`, `duration`, `thumbnailUrl`, `contentUrl`, `embedUrl?`, `hasPart?` as inputs (drop the hardcoded `uploadDate: "2026-08-01"`), add `"@id": "${site.url}${path}#video"`, `creator: {"@id": "/#person"}`, `isPartOf: {"@id": "${path}#article"}`, `inLanguage: "en"`. In `src/app/(site)/blog/[slug]/page.tsx`, when the body contains a `reel` block, push `videoObjectNode({ name: post.title, description: reelBlock.caption ?? post.excerpt, contentUrl: site.url + reel.src, thumbnailUrl: site.url + reel.poster, uploadDate: post.publishedAt + "T09:00:00+04:00", duration: "PT38S", path })`. Duration/upload date should come from the pipeline (lesson.json / ffprobe) and be stored on the `reel` block (`durationSeconds`, `uploadDate`).
- **Key moments (optional, ≥30 s reels only):** `hasPart: [{ "@type": "Clip", name, startOffset, endOffset, url: "${site.url}${path}?t=12" }]` from the reel's beat list; the `<video>` must honour `?t=` (small client hook) [E3].
- **Video sitemap:** new `src/app/video-sitemap.xml/route.ts` emitting `<url><loc>blog URL</loc><video:video><video:thumbnail_loc>…covers/<slug>.jpg</video:thumbnail_loc><video:title>…</video:title><video:description>…</video:description><video:content_loc>…reels/<slug>.mp4</video:content_loc><video:duration>38</video:duration><video:publication_date>…</video:publication_date><video:uploader info="https://withhammad.com/about">Hammad Yousuf</video:uploader><video:family_friendly>yes</video:family_friendly></video:video></url>`; register it in `src/app/robots.ts` (`sitemap: [sitemap.xml, video-sitemap.xml]`) and submit in GSC [E4][E5].
- Set honest expectations: these are blog posts, not watch pages, so expect the video badge / image-result treatment, not full video rich results [E5]. If video results matter, add a `/watch/<slug>` route whose only content is the reel + transcript (that is the watch page), and point `embedUrl`/`<video:player_loc>` at it.

### P4 — Entity cleanup: Person / Organization `sameAs`, author linkage, Article image
- **`src/lib/site.ts`:** `instagram` → `https://www.instagram.com/withhammad.ai` (live account since 2026-10-31; the blog reel captions already link it, the schema still says `with.hammad`); add `tiktok: "https://www.tiktok.com/@hammadyousuf01"`, `facebook: "https://www.facebook.com/61595704034607"` (page "With Hammad AI"), and X if an account exists. Fill the WhatsApp placeholder or leave `whatsappReady` hiding it.
- **`src/lib/seo/jsonld.ts` `personNode`:** add `image: ${site.url}/hammad-headshot-v3.jpg`, `description` (one sentence from `/about`), `knowsAbout: [...]`, `worksFor: {"@id": "/#organization"}`, `sameAs` = all profiles above; `organizationNode` gets `logo` and the same `sameAs`. `webSiteNode` → `publisher: {"@id": "/#organization"}`.
- **`articleNode`:** add `"@id": "${url}#article"`, `mainEntityOfPage: url`, `image: [og 1200x630, plus 4:3 and 1:1 variants from /api/og]`, `publisher: {"@id": "/#organization"}`, `author: {"@id": "/#person"}` (keep), `inLanguage: "en"`, `isAccessibleForFree: true`. Inline the author minimal props when referenced (`name`, `url: ${site.url}/about`) so parsers that do not resolve `@id` still see `author.url` [E9].
- **`profilePageNode`:** `@id` → `/about#profile` and `url: /about` (today it points at `/portfolio` while the About page is the one that emits it); add `dateCreated`, `dateModified`.
- **Bylines:** `src/app/(site)/blog/[slug]/page.tsx` author block and the resource `By {site.name}` line → wrap name in `<Link href="/about" rel="author">`. Add `authors: [{ name: site.name, url: `${site.url}/about` }]` and `openGraph.type: "article"` with `publishedTime/modifiedTime` to `pageMeta` for article routes (`src/lib/seo/meta.ts`, new optional `article?: { publishedTime, modifiedTime }`).
- **`dateModified`:** the 12 new posts have no `updatedAt`; set `updatedAt` = `publishedAt` on first publish (`src/content/blog-posts/*.ts` or default in `articleNode`) so the schema is complete and the "updated" label works.

### P5 — Page weight / LCP
- `/blog` is 828 KB of HTML because the index renders 45 `/api/og` cover images inline plus every card. `src/app/(site)/blog/page.tsx` → paginate or lazy-load below the fold (`loading="lazy"` on all but the first 3 covers, `fetchpriority="high"` on the first), and move cover art to static JPGs under `public/media/covers` (already exists for reels) served via `next/image`.
- Home LCP 6.9 s (W44): `src/app/(site)/page.tsx` — defer the 3D/GSAP bundles (`@react-three/*`, `framer-motion`) below the fold with `next/dynamic({ ssr:false })`, preload the hero image. Re-run `npm run audit:lighthouse` after each change and keep the ≤2.5 s budget green.
- All pages ship ~220 KB HTML; the RSC payload is the bulk. Check `next build` output for client components that could be server components on resource pages (they are already mostly static).

### P6 — FAQ handling after the May 2026 deprecation
- Keep `faqNode` (valid, harmless, still read by other engines) but stop counting it as a win; move effort to making each FAQ answer a self-contained 40–60-word paragraph under a question H2/H3 in the body (that is what AI answers lift). Consider `QAPage` only where there is one canonical question (helper already exists).
- Remove FAQPage from the SEO definition-of-done in `CLAUDE.md`/`SEO-LOOP.md` if it is listed there.

### P7 — Sitemap hygiene
- `src/app/sitemap.ts`: the 4 hand-typed entries (`ai-motion-starter-kit`, `ai-website-design-brief`, `ai-engineering-projects`, `claude-job-search`) and the `/resources` hub use fixed strings and `2026-10-12`; import their resource objects like the others, and give `/resources` and `/blog` `lastModified = max(child dates)`. Add `<image:image>` for blog covers or rely on the video sitemap. Static routes use `lastModified: now`, which tells Google every page changes weekly — use real dates.

### P8 — Search Console API + Clarity
- Create the GSC service account and set `GSC_CREDENTIALS` (CREDENTIALS.md line 75) so the Monday cron report shows clicks/impressions per page group; after P3 submit `video-sitemap.xml` in GSC. Set `NEXT_PUBLIC_CLARITY_ID` if session replays are wanted (currently not loading). Credential-gated: owner only.

## 5. Per-page title / description proposals

Titles ≤60 chars, descriptions 120–155 chars, keyword from autocomplete first, no template suffix (use `title: { absolute }` or the shortened template).

| Page | Proposed `<title>` | Proposed meta description | H1 note |
|---|---|---|---|
| `/resources/claude-duet` | `Claude Duet: what it is, who can get it, how to prepare` (keep, 55) | `Claude Duet is Anthropic's proactive agent (research preview, Oct 21 2026). Who can join the US waitlist, why there is no extra price, and how to prepare now.` (150) | Keep. Add an H2 "Is there a Claude Duet GitHub repo?" (autocomplete) |
| `/blog/claude-duet` | `Claude Duet explained: price, waitlist, GitHub, safe rule` (56) | `Claude Duet explained: a morning brief from your apps, its own cloud computer, no extra cost on Claude Pro or Max, US waitlist only, and why there is no official GitHub repo.` (155) | Keep H1; drop the template suffix |
| `/resources/kimi-k3-on-8gb-ram` | `Kimi K3 local on 8 GB RAM, no GPU: what it really takes` (55) | `Run Kimi K3 (2.78T open-weight) locally on 8 GB of RAM with no GPU via kimi-k3-in-c on GitHub. Real numbers: 8.24 GB RAM peak, ~1.7 TB disk, 30 s per token.` (154) | H1 add "no GPU" to match |
| `/blog/kimi-k3-on-8gb-ram` | `Kimi K3 on 8GB RAM, no GPU: how kimi-k3-in-c does it` (keep, 51) | Keep (155). | Keep |
| `/resources/ai-traffic-ga4` | `Track AI traffic in GA4: the AI Assistant channel setup` (56) | `Track AI traffic in GA4: find the AI Assistant channel, build a custom channel group for ChatGPT, Claude, Gemini and Perplexity, and check whether it converts better.` (155) | Shorten H1 to "Track AI traffic in GA4 (and why it may convert better)" |
| `/blog/ai-traffic-ga4` | `Track AI traffic in GA4: AI Assistant channel report` (52) | Keep (150). | H1 is 100+ chars; cut to ≤70 |

Also: `/blog` → `Blog: AI agent prompts, tutorials and GCC growth notes` (55); `/about` → `About Hammad Yousuf, AI implementation specialist in Dubai` (58). Home title can keep the full brand string.

## 6. Evidence table

| # | Claim | Source | Checked |
|---|---|---|---|
| E1 | FAQ rich results restricted to government/health sites (2023); "As of May 7, 2026, FAQ rich results are no longer appearing in Google Search"; docs removed 15 Jun 2026 | Google Search Central, FAQPage structured data page + changelog: https://developers.google.com/search/docs/appearance/structured-data/faqpage and https://developers.google.com/search/updates | 2026-11-01 |
| E2 | Industry confirmation of the deprecation timeline (May 7 / June / August 2026), markup still valid | https://jsonld.com/google-faq-rich-results-deprecated/ ; https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026 | 2026-11-01 |
| E3 | VideoObject required props `name`, `thumbnailUrl`, `uploadDate`; recommended `contentUrl`, `duration`, `hasPart` Clip; key-moment rules (≥30 s, deep-link URL) | https://developers.google.com/search/docs/appearance/structured-data/video | 2026-11-01 |
| E4 | Video sitemap required tags: `thumbnail_loc`, `title`, `description`, `content_loc` or `player_loc`; optional `duration`, `publication_date`, `uploader` | https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps | 2026-11-01 |
| E5 | A watch page shows one video; a blog post with a secondary embedded video can appear as a text result or image result with a video badge, not in video-specific features; stable thumbnail/file URLs | https://developers.google.com/search/docs/appearance/video | 2026-11-01 |
| E6 | AI Overviews / AI Mode: "no additional requirements… nor other special optimizations necessary"; no special structured data; recommends crawlability, internal linking, page experience, text-form content; AI traffic counted under Web in GSC | https://developers.google.com/search/docs/appearance/ai-features | 2026-11-01 |
| E7 | Ahrefs (Mar 2026, 863k SERPs): ~37.9 % of AI-Overview-cited URLs in top 10; query fan-out; structured, answer-first content most cited (vendor studies, treat numbers loosely) | https://ecorpit.com/ranking-vs-ai-overview-citation-data-2026/ ; https://digitalapplied.com/blog/ai-search-citation-ranking-factors-2026-data-study ; https://contently.com/2026/05/12/ai-citations-vs-backlinks/ | 2026-11-01 |
| E8 | Helpful content / E-E-A-T self-assessment: bylines linking to author background, first-hand experience, originality over summarising, disclose automation where expected | https://developers.google.com/search/docs/fundamentals/creating-helpful-content | 2026-11-01 |
| E9 | Article recommended props: `author.url`/`sameAs`, `image` in 16:9/4:3/1:1 ≥50k px, `datePublished`/`dateModified` with timezone; one author per field | https://developers.google.com/search/docs/appearance/structured-data/article | 2026-11-01 |
| E10 | ProfilePage: `mainEntity` Person with `name`; recommended `image`, `description`, `sameAs`, `dateCreated`, `dateModified`; valid for "About Me" pages | https://developers.google.com/search/docs/appearance/structured-data/profile-page | 2026-11-01 |
| E11 | Title links: no hard length limit, truncated to device width; Google rewrites when boilerplate/site name repeats; add only a concise site name on non-home pages | https://developers.google.com/search/docs/appearance/title-link | 2026-11-01 |
| E12 | Every indexable page needs ≥1 internal link; descriptive anchors; link related resources in context | https://developers.google.com/search/docs/crawling-indexing/links-crawlable | 2026-11-01 |
| E13 | CWV thresholds LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; part of page-experience signals rewarded by core ranking systems | https://developers.google.com/search/docs/appearance/core-web-vitals | 2026-11-01 |
| E14 | Search Essentials key best practices: audience words in title/H1/alt/link text; crawlable links; follow video & structured-data best practices | https://developers.google.com/search/docs/essentials | 2026-11-01 |
| E15 | Autocomplete data | `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=…` (table in §3) | 2026-11-01 |
| E16 | Live-site facts (titles, schema, links, sizes, sitemap coverage) | curl of withhammad.com, saved HTML in the scratchpad path above; `reports/site-audit-2026-W44.md` for Lighthouse | 2026-11-01 |

Caveats: PageSpeed Insights API was quota-limited (HTTP 429) so field CWV were not fetched; Lighthouse numbers are the repo's own lab run from today. AI-citation percentages are vendor studies.
