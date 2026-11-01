# LinkedIn profile SEO: linkedin.com/in/withhammad

Research deliverable, 2026-11-01. Nothing on the profile was changed. Owner: Hammad Yousuf, Dubai. Audience: marketers,
founders and creators using AI; recruiters and clients for AI implementation work. Posting: daily AI reels, carousels and
text posts with a free guide on withhammad.com/resources/<slug>.

House rule: no "AI avatar" wording anywhere in profile text. Branding is WITHHAMMAD only.

---

## 1. Audit: what is public today

Source: `curl` of https://www.linkedin.com/in/withhammad/ (HTTP 200, 561 KB, the logged-out "public profile" render;
most sections are truncated and the auth wall covers the rest). Observed, not inferred:

| Field | Public value today | Note |
|---|---|---|
| Name | **HAMMAD YOUSUF** (all caps) | `og:title`: "HAMMAD YOUSUF - Promate Technologies". All caps reads as a typo to recruiters and Google. Set to "Hammad Yousuf". |
| Headline | Not rendered in the public HTML (only the company name). Owner-supplied: *AI Engineer \| Forward Deployed Engineer \| Agentic AI, LLM Applications & RAG \| Python, FastAPI, MCP \| Enterprise AI Integration at Promate* (138 chars) | 82 of 220 chars unused; no location, no audience, no offer, no withhammad.com. "Forward Deployed Engineer" is a job title, not what a client searches. |
| About, first line | "I build and deploy AI applications that connect language models to business data and…" | Only this line is public; the rest is walled. First line is good but has no location and no keyword a client types. |
| Location | United Arab Emirates | Country only. Autocomplete shows people search "… dubai" far more than "… uae" (section 2.9). |
| Custom URL | linkedin.com/in/withhammad | Already custom and brand-matched. Keep. |
| Websites | "Portfolio https://withhammad.com/" and "Personal Website https://withhammad.com/" | Duplicate. Point one at withhammad.com/resources with the label "Free AI guides". |
| Services | IT Consulting, Business Analytics, Application Development, Custom Software Development; "Request proposal" button shown | Generic categories; nothing says AI. |
| Articles | 5 articles, Feb-Apr 2024, lead-gen marketing topics; one says "Created with AIPRM Prompt" in the body | Stale and off-positioning; they show on the public profile above Activity. |
| Projects | "Adam - RAG Quote & Lead Response Agent" (Printo; RAG, WhatsApp, GA4/Google Ads attribution) | Strong. Keep, move it into Featured too. |
| Certifications | Google Ads Search (Oct 2024), Google Ads Apps (2022), Meta Social Media Marketing (2021), Android Developer (2021), Digital Marketing (UIUC) | All marketing/mobile; no AI certificate listed. |
| Recommendations | 8 received (two shown, from printing-industry managers) | None about AI work. |
| Publications | "Printo" (2021) | Low value. |
| Languages | English, Arabic (limited), Urdu, Turkish (elementary) | Fine. Arabic is a UAE selling point; keep. |
| Activity | "7K followers"; recent posts are AI engineering carousels/visuals with 3 hashtags each | Voice matches the pipeline captions. |
| Creator mode / "Talks about" | Absent (feature retired 2024, see 2.5) | Nothing to do. |
| Newsletter | No newsletter found on the public page | See section 5. |
| Banner | Present (a `profile-displaybackgroundimage` is served); text unreadable from HTML | Owner must read it (next table). |

Voice (from `studio/.local/jobs/*/seo/seo.json` → `linkedin.text`, 26 jobs): plain, specific, numbers and dates, "here is
what the viral posts skip", one honest caveat per post, the free-guide URL in the text ("no comment needed"), 2-3
hashtags, 900-2,700 characters. The About draft below keeps that register.

### Fields the owner (or a later Chrome step) must read, because curl cannot

1. Headline exactly as displayed, and whether the current headline carries the "at Promate" auto-suffix.
2. Full About text (2,600 max) and how much shows before "…see more" on mobile.
3. Featured section: present or not, items and order.
4. Banner image: the text on it, if any.
5. Skills: the full list, the 5 pinned top skills, and which are endorsed.
6. Experience: the Promate title, description, dates, and whether the Printo/Adam work is in it.
7. Services page: category picker options (is there an "AI"/"Artificial Intelligence" category in 2026?), the Services
   About text, response-rate badge.
8. "Open to" settings: Providing services on/off; Open to Work off (recruiters see it, but it changes the headline frame).
9. Creator tools: Newsletters shows "Available"?; profile analytics → **Search appearances** (what titles/keywords
   searchers used last week) and the top companies of viewers. This is the only first-party keyword data LinkedIn gives.
10. Name pronunciation, profile photo, verification badge, industry field, location field (city vs country).
11. Website labels in Contact info; whether the Services "Request proposal" button is Premium-gated for this account.

---

## 2. Research: LinkedIn profile SEO in 2026, with sources

### 2.1 Headline (220 characters)
- Limit is 220 chars; only about 60-70 are shown in search results, connection requests and comments, so the first
  clause must carry the main keyword and the place. [AuthoredUp limits, Aug 2026] [TheInterviewGuys 2026]
- Target the title the searcher types, not the internal title; vague phrases ("passionate", "seeking") are never
  searched. [TheInterviewGuys] [UniLink 2026]
- Ranking-weight claims (headline > title > About > skills) come from vendor blogs, not LinkedIn documentation; treat as
  plausible, unverified.

### 2.2 About (2,600 characters, first ~300 visible)
- 2,600-char cap (LinkedIn Talent blog; AuthoredUp). About 300 chars (some say 370) show before "see more" on desktop,
  fewer on mobile, so the hook and the two main keywords go in sentence one. [AuthoredUp limits] [LinkedIn Talent blog]
- About is indexed by LinkedIn search and by Recruiter; it is also what Google shows as the meta description of the
  public profile (confirmed today: `og:description` = first About sentence + Experience + Education + Location).

### 2.3 Custom URL
- 3-100 chars, no spaces/symbols, not the word "LinkedIn"; up to 5 changes per 6 months; first come first served.
  [LinkedIn Help a542685] Current `/in/withhammad` already matches the brand and the site. Keep.

### 2.4 Featured section
- Available to all members since creator mode was retired; holds posts, articles, links and uploaded media; the first
  2-3 items are visible before scrolling, so order matters. [Social Media Today, Feb 2024] [LinkedIn Pulse guides]
- Ordinal's analysis recommends routing evergreen links through Featured and the website field instead of every post.
  [Ordinal 2026]

### 2.5 Creator mode and "Talks about": retired
- LinkedIn announced in Feb 2024 that the Creator Mode toggle would be removed the following month, the "Talks about"
  hashtags removed, the About section moved back to the top, and the Follow button kept for everyone; creation tools and
  analytics became standard. [Social Media Today, 5 Feb 2024] Verified today: no "Talks about" string in the public HTML.
  2026 guides that still describe creator mode are recycling 2023 content.

### 2.6 Services page
- Set up from the "Open to" button → Providing services; it is a free landing page, searchable by all members, shows
  response rate/time badges, and clients send project requests you answer with proposals. Some request features need
  Premium Business / Sales Navigator / Recruiter Lite. [LinkedIn Help a550345, a569554]

### 2.7 Newsletter
- Eligibility: more than 150 followers/connections, recent original posts, good standing; access shows as "Available"
  under Creator tools → Newsletters. Subscribers get a notification and an email per edition. [LinkedIn Help a591266,
  a596833] Owner qualifies (6,574 followers).

### 2.8 Hashtags (0-3)
- Hashtag following and hashtag feeds were removed in late 2024; hashtags are now a topic label, not a reach lever.
  [Digital Works, Aug 2025] [Social Media Today]
- Magnettu (16,790 brand posts, Jan-Jul 2026): posts with hashtags had 62% lower median views; stated as correlation.
  [Magnettu 2026] Recommendation across sources: 0-3, topic words in the text instead.

### 2.9 Search terms (Google autocomplete, `client=firefox`, gl=ae, 2026-11-01)
| Seed | Suggestions that matter |
|---|---|
| ai implementation | ai implementation consultant, ai implementation specialist, ai implementation engineer, ai implementation in business, ai implementation company |
| ai implementation specialist | … salary, jobs, remote, job description (recruiter intent exists) |
| ai implementation consultant dubai | no suggestions (too long-tail; use "ai consultant dubai") |
| ai consultant dubai | ai consultant dubai, ai consulting services dubai, ai consulting companies in dubai, ai strategy consultants dubai |
| ai automation agency dubai / uae | best ai automation agency in dubai, ai automation companies in dubai/uae, ai companies in dubai |
| ai agent developer dubai | ai agent development dubai, ai development agency dubai |
| ai engineer dubai | ai engineer dubai jobs, **ai engineer dubai linkedin**, ai engineer jobs in uae |
| forward deployed engineer | … meaning, salary, **forward deployed engineer uae**, **forward deployed engineer jobs dubai** |
| claude code expert | claude code expert, claude code expert jobs, claude code expert course |
| claude code for marketers | claude code for marketers, claude code for marketing agency, claude code for marketing automation |
| ai agents for marketing | ai agents for marketing teams, agency, automation, campaigns |
| rag developer / mcp server developer | both have job and salary intent |

Takeaway: the phrases that actually complete are **"AI consultant Dubai"**, **"AI engineer Dubai"**, **"AI implementation
consultant/specialist"**, **"AI automation agency Dubai"**, **"Claude Code expert"**, **"Forward Deployed Engineer UAE"**,
**"AI agents"/"RAG"/"MCP"**. "Dubai" beats "UAE" in every pair tested. The headline and About should contain each once.

### 2.10 Posting frequency, formats, video, links (2025-2026 data)
| Finding | Source |
|---|---|
| Personal profiles: 3-5 posts/week is the sweet spot; 1-2 videos/week inside a text + carousel mix | AuthoredUp video study (3M+ posts, Mar 2025-Feb 2026) |
| 3-4 quality posts/week; daily posting "does not guarantee better results"; Tue-Thu, 7-9 AM audience time; content surfaces up to 48 h | River Editor (300 posts, Jan-Oct 2026) |
| Document/PDF carousels are the top format (~2,639 avg views) > image (2,199) > video (887, lowest reach but highest engagement rate) | Magnettu (16,790 posts, 2026) |
| Document posts ~1.39x reach, ~6.6% engagement; a single external link in the body −18.8% median reach (1.3M posts, Sep 2025-Feb 2026) | Richard van der Blom 2026 report, as cited by LinkedIn consultants; report is paid |
| Video on personal profiles reaches 0.86x the median; median video reach −36% YoY; over-3-min video 1.21x, 0-30 s 0.96x; captions required (20+ caption sentences 1.13x) | AuthoredUp |
| 9:16 vertical video gets its own swipeable strip; landscape does not appear there | Sendspark / AuthoredUp |
| Carousels generated 17x more interactions than images; posts with a question got 77% more comments; ~40% of interactions land in the first 24 h | Metricool (600k posts, 60k accounts, Mar 2026) |
| Text 800-1,500 chars is the strongest range; 2,500+ chars averaged the most views | Magnettu |

### 2.11 Link in post vs first comment (2025-2026 tests)
| Result | Source |
|---|---|
| Linked posts lose ~26.5% median impressions overall, but **personal profiles show little penalty; company pages absorb most of it**. First-comment links "cost a large share of clicks". If clicks are the goal, put the link in the body. | Ordinal, early 2023-early 2026 data |
| Unlinked 705 vs linked 448 median impressions (−36%) | LinkPost, 358k posts, 2026 (via Ordinal) |
| −18.8% median reach for one body link | van der Blom 2026 (secondhand) |
| Brand posts with a text link: 157 vs 369 median views (−57%); recommends first comment | Magnettu 2026 |
| Posts with 3+ links got 140% *better* reach than no-link posts | Saywhat, 223,996 posts, Jul 2025 |
| First-comment trick "helps a little" at best; some say it is detected | River Editor; Bulldog Reporter roundup |
| Place the link as the second-to-last line; edit +≤14% text 15 min after posting (unverified "re-scan" claim) | Unfractional (podcast-sourced, no data) |

No official LinkedIn statement either way was found. Net: evidence is mixed; the one source that split personal vs company
profiles says the body link is cheap for a personal profile and better for clicks. **Keep the pipeline's link-in-text
rule** (it also makes the keyword-reply routine unnecessary on LinkedIn), place it near the end, and A/B it on own data
(section 6).

---

## 3. Headline

Current (138 chars):
`AI Engineer | Forward Deployed Engineer | Agentic AI, LLM Applications & RAG | Python, FastAPI, MCP | Enterprise AI Integration at Promate`

Option A, recommended (search-first, 188 chars):
```
AI Engineer & AI Implementation Consultant, Dubai | Claude Code, AI Agents, RAG, MCP | Forward Deployed Engineer at Promate | Free daily AI guides for marketers & founders → withhammad.com
```
First 65 chars: "AI Engineer & AI Implementation Consultant, Dubai | Claude Code" – the three autocomplete winners.

Option B (client-first, 194 chars):
```
I build AI agents and RAG systems that run on your business data | AI Implementation Consultant, Dubai | Claude Code, MCP, Python, FastAPI | Forward Deployed Engineer at Promate | withhammad.com
```

Option C (creator-first, 191 chars):
```
Daily free AI guides for marketers & founders: Claude Code, AI agents, automation | AI Engineer & AI Implementation Consultant in Dubai | RAG, MCP, Python | Forward Deployed Engineer, Promate
```

Why A: recruiters search "AI engineer dubai", clients search "AI consultant dubai" / "AI implementation consultant"; both
sit in the visible first 70 chars. FDE stays (1,000%+ job-post growth is a live recruiter term, and "forward deployed
engineer uae" autocompletes) but moves behind the searched terms. The creator offer and the domain close it. Remove the
auto "at Promate" suffix if LinkedIn appends it (it would duplicate).

---

## 4. About (draft, 2,112 chars, first 285 before the fold)

```
AI Engineer and AI Implementation Consultant in Dubai. I build AI agents, RAG systems and Claude Code workflows that run on a company's own data, then deploy them where the work happens: WhatsApp, the website, the CRM, the ad account. Free guides every day at withhammad.com/resources.

What I do at Promate (Forward Deployed Engineer): take an AI use case from "could we" to live in production. Python, FastAPI, MCP servers, retrieval over business documents, evaluation sets, logging and attribution. Example: Adam, a RAG quote-and-lead agent for Printo that answers web and WhatsApp enquiries from the product and price knowledge base, prepares quotes and logs conversions to GA4 and Google Ads.

What I publish: one tested AI workflow a day, in a 60-second video, a carousel or a text post. Claude Code, AI agents, MCP, automation for marketing and sales, and the costs and limits nobody mentions. Every post has a free guide with the setup, prompts and a checklist. No login, no paywall.

Who this is for:
- Marketers, founders and creators who want AI doing real work this week, not a demo.
- Teams in the UAE and GCC that need an AI implementation partner who ships and measures.
- Recruiters hiring AI Engineers, Forward Deployed Engineers or AI Implementation Specialists.

How I work: facts checked against the source, prices checked on the day, one honest caveat per post. If a tool is a beta, US-only or paid, I say so.

Background: 10+ years in performance marketing (Google Ads Search and Apps certified, Meta Social Media Marketing certified) before AI engineering, so every system I build is wired to the conversion it is meant to move. English, Urdu, working Arabic.

Keywords for search: AI Engineer Dubai, AI Implementation Consultant, AI Agents, Agentic AI, RAG, LLM Applications, Claude Code, Claude Code expert, MCP, Model Context Protocol, Python, FastAPI, AI Automation, Marketing Automation, Enterprise AI Integration, Forward Deployed Engineer UAE.

Free guides: withhammad.com/resources
Work with me: message here or hammad@withhammad.com (owner: confirm the address before publishing)
```

Notes: the final "Keywords" line is a deliberate index block (common practice; LinkedIn search matches whole phrases in
About). Replace the email placeholder with the real contact or delete the line. Keep the first sentence under 300 chars
with "Dubai", "AI Implementation Consultant", "AI agents", "RAG", "Claude Code" (done: 285 chars).

---

## 5. Featured, banner, URL, Services, newsletter

### Featured (3 items, in this order)
1. **Link: withhammad.com/resources** – title "Free AI guides: Claude Code, AI agents, automation (new one daily)". The
   evergreen hub, so every post can point here even when a body link is skipped in a test.
2. **Post: the Forward Deployed Engineer roadmap reel** (resource `forward-deployed-engineer-roadmap`, job 6cff0a62569f).
   Recruiter-facing, the strongest live keyword, and already a tested caption.
3. **Post: the AI startup stack costs reel** (resource `ai-startup-stack-costs`, job 6f8f4ad316a3) – founder/marketer
   facing, price-checked, shows the voice.
Alternates to rotate monthly: `how-ai-agents-work` (agent-loop), `youtube-agent-skill-claude`, and the Adam RAG project
as a media item (screenshot of the estimator) for client proof.

### Banner (1584 x 396 px, text inside the centre band, right third stays clear of the photo on mobile)
Line 1: `Free daily AI guides: Claude Code · AI agents · automation`
Line 2: `withhammad.com/resources`
Small line: `AI implementation for UAE businesses · Dubai`
Use the glow-grid thumbnail template colours (navy glow, white line, blue pill) so the profile matches the reel covers.
Owner must confirm the current banner text first (section 1 list, item 4).

### Custom URL
Keep `linkedin.com/in/withhammad`. Nothing to do. (3-100 chars, 5 changes per 6 months per LinkedIn Help.)

### Services page
- Replace the four generic services with the closest categories that exist in the 2026 picker. If an "AI Consulting" /
  "Artificial Intelligence" category exists, lead with it; otherwise keep **IT Consulting, Custom Software Development,
  Application Development** and drop Business Analytics.
- Services About (owner reads current text first; 2026 cap not verified by curl, keep under 500 chars):
  `AI implementation for UAE and GCC businesses: AI agents, RAG over your documents, Claude Code and MCP workflows,
  WhatsApp and website assistants, marketing and sales automation wired to GA4 and ad attribution. Scoped pilots in
  2-4 weeks, measured on the business metric. Message for a 20-minute scoping call.`
- Keep "Request proposal" only if it is not Premium-gated for this account; otherwise point to the site contact.

### Newsletter
- Name: **"Shipped with AI"** – subtitle "One tested AI workflow a week for marketers, founders and builders. From
  Hammad Yousuf, AI Engineer in Dubai." (Alternates: "The Implementation Brief", "WithHammad Weekly".)
- Cadence: **weekly**, Monday 11:00 GST (the LinkedIn carousel slot in slots.json), not daily. LinkedIn emails every
  subscriber per edition; a daily email from a 6.5k-follower profile risks unsubscribes and hurts the one asset that
  survives algorithm changes. docs/PIPELINE_V2.md section 3 says "1 newsletter" per day; this doc recommends per week
  and flags the difference for the owner.
- Each edition: the week's best guide expanded (the blog post already written for withhammad.com/blog/<slug>), the
  other 6 guide links, one caveat section. Articles are Chrome-only to publish (noted in PIPELINE_V2).

### Clean-up (one Chrome session)
- Name to "Hammad Yousuf"; location to "Dubai, United Arab Emirates".
- Delete or unpublish the five 2024 lead-gen articles (one carries "Created with AIPRM Prompt").
- Remove the duplicate website entry; relabel the remaining one "Free AI guides".
- Pin top 5 skills: Artificial Intelligence (AI), Large Language Models (LLM), Retrieval-Augmented Generation (RAG),
  Python, AI Agents (or Model Context Protocol if LinkedIn offers it). Owner reads the current skill list first.
- Ask two AI-work clients/colleagues (Promate, Printo) for recommendations that use the words "AI agent" and "RAG".

---

## 6. Weekly LinkedIn posting pattern

Cadence from the owner brief (per day: 3 reels, 2 text posts, 1 carousel, 1 newsletter) is above what the 2026 data
rewards for a personal profile (3-5 posts/week, 1-2 videos/week, carousels first). The pattern below keeps the owner's
volume because the owner decides on own analytics (slots.json rule: "pick from analytics only"), but orders each day so
the carousel, the format with the best reach, gets the best slot, and makes the volume a measured test, not a belief.

Times are GST from `studio/app/slots.json` / docs/BEST_TIMES_3PERDAY.md (LinkedIn weekday 09:00 / 13:00 / 17:00 reels,
11:00 carousel; weekend 10:00 / 14:00 / 20:00, 17:00 carousel; Friday nothing 12:15-14:00).

| Day | 09:00 | 11:00 | 13:00 | 15:00 | 17:00 | 19:00 |
|---|---|---|---|---|---|---|
| Mon | Reel 1 (9:16, captions, link in text) | **Carousel (PDF)** | Reel 2 | Text post 1 (800-1,500 chars, question at the end) | Reel 3 | Text post 2 + **newsletter edition** |
| Tue-Thu | Reel 1 | Carousel | Reel 2 | Text post 1 | Reel 3 | Text post 2 |
| Fri | Reel 1 09:00 | Carousel 11:00 | Reel 2 14:00 | Text post 1 15:30 | Reel 3 17:00 | Text post 2 |
| Sat-Sun | Reel 1 10:00 | Text post 1 12:00 | Reel 2 14:00 | Carousel 17:00 | Reel 3 20:00 | Text post 2 21:00 |

Rules for every post, from the evidence table:
- Reel: vertical 9:16, burned-in captions, 30-90 s; hook text in the first 140 chars of the post (mobile "see more").
- Links: resource URL in the body, second-to-last line, never in the first 140 chars; no first-comment links.
- Hashtags: 0-2, topic words in the text instead (current captions use 3; drop to 2 or 0).
- Text posts: 800-1,500 chars, one question at the end (Metricool: +77% comments).
- Carousel: PDF, 8-12 pages, first page = the reel cover (glow-grid template).
- Reply to every comment within the first hour (40% of interactions land in day one).

Two-week test (owner analytics, review 2026-11-03 and 2026-11-17):
1. Link test: 10 reels with the URL in the body vs 10 with no link and "guide in Featured". Compare median impressions
   and resource-page visits (withhammad.com GA4, when connected).
2. Volume test: week 1 at full cadence (7/day), week 2 at 3/day (carousel + 1 reel + 1 text). If median reach per post in
   week 2 is >2x week 1 and total weekly reach is not lower, drop to the lower volume on LinkedIn only (other platforms
   keep their slots).

---

## 7. Evidence table

| # | Claim used | Source | Date | Type |
|---|---|---|---|---|
| 1 | Creator Mode toggle removed Mar 2024; "Talks about" hashtags removed; About back on top; Follow stays for all | https://www.socialmediatoday.com/news/linkedins-removing-creator-mode-option/706585/ | 2024-02-05 | Trade press quoting LinkedIn statement |
| 2 | Custom URL 3-100 chars, 5 changes per 6 months | https://www.linkedin.com/help/linkedin/answer/a542685 | current | LinkedIn Help |
| 3 | Newsletter: >150 followers/connections, recent original posts, good standing; email + notification per edition | https://www.linkedin.com/help/linkedin/answer/a591266 ; https://www.linkedin.com/help/linkedin/answer/a596833 | current | LinkedIn Help |
| 4 | Services page: set up via "Open to" → Providing services; searchable by all members; response badges; some features need Premium Business | https://www.linkedin.com/help/linkedin/answer/a550345 ; https://www.linkedin.com/help/linkedin/answer/a569554 | current | LinkedIn Help |
| 5 | Headline 220, About 2,600, post 3,000, ~60-70 headline chars visible in search, ~300 About chars before fold, post fold ~210 desktop / ~140 mobile | https://authoredup.com/blog/linkedin-character-limit | 2026-08-11 | Vendor reference (tested) |
| 6 | About 2,600 chars | https://www.linkedin.com/business/talent/blog/product-tips/linkedin-profile-summaries-that-we-love-and-how-to-boost-your-own | LinkedIn Talent blog | Official blog |
| 7 | Personal-profile video 0.86x median reach, −36% YoY; 3-5 posts/week; 1-2 videos/week; captions 20+ sentences 1.13x; vertical feed | https://authoredup.com/blog/linkedin-video-posts | 2026 (data Mar 2025-Feb 2026, 3M+ posts) | Vendor study |
| 8 | Document 2,639 vs image 2,199 vs video 887 avg views; hashtags −62% median views (correlation); body link −57%; 800-1,500 chars best | https://www.magnettu.com/en/blog/what-works-on-linkedin-in-2026 | 2026 (16,790 brand posts) | Vendor study (brands) |
| 9 | Carousels 17x interactions vs images; questions +77% comments; 40% of interactions in day one | https://metricool.com/linkedin-algorithm/ | 2026-03-26 (600k posts) | Vendor study |
| 10 | Linked posts −26.5% median impressions overall, personal profiles little penalty, first-comment costs clicks, body link if clicks matter; LinkPost 705 vs 448 | https://www.tryordinal.com/blog/linkedin-link-penatly-study | 2026 | Vendor study |
| 11 | One body link −18.8% median reach; documents ~1.39x; 1.3M posts Sep 2025-Feb 2026 | https://sales.richardvanderblom.com/content-algorithm-playbook/ (report page); figures via https://melaniegoodmanlinkedinconsultant.substack.com/p/linkedin-algorithm-2026-reach-topic-authority | 2026 | Paid report, secondhand figures |
| 12 | Posts with 3+ links +140% reach; video reach "cratered" | https://saywhat.ai/blog/linkedin-algorithm-june-2025/ | 2025-07-20 (223,996 posts) | Vendor study |
| 13 | Body link −60%; first comment "helps a little"; 3-4 posts/week; Tue-Thu 7-9 AM; 48 h surfacing | https://rivereditor.com/blogs/2026-linkedin-algorithm-what-works-300-posts-tested | 2026 (300 posts) | Small vendor test |
| 14 | Hashtag following removed, feeds retired, hashtags are labels; use 1-3 | https://digitalworks.dk/en/artikler/hashtags-are-not-dead-on-linkedin-but-their-role-has-changed ; https://www.socialmediatoday.com/news/do-you-need-to-use-hashtags-on-linkedin/704535/ | 2025-08-25 / 2024 | Agency blog / trade press |
| 15 | Headline keyword guidance (searched title first, no fluff) | https://blog.theinterviewguys.com/?p=11158 ; https://www.unilink.us/blog/linkedin-headline-examples-2026 | 2026 | Guides |
| 16 | Link placement second-to-last line; +14% edit; 3x/day pages (podcast-sourced, no data) | https://unfractional.substack.com/p/linkedins-2026-algorithm | 2026 | Opinion, unverified |
| 17 | Search terms that autocomplete | https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=ae&q=… (17 seeds, section 2.9) | 2026-11-01 | Primary, captured |
| 18 | Public profile fields (name caps, services, articles, duplicate websites, About line, `og:description`) | curl https://www.linkedin.com/in/withhammad/ | 2026-11-01 | Primary, captured |

Not found: any official LinkedIn statement on external-link ranking; any LinkedIn Help page with field character limits
(the limits above are vendor-tested, consistent with the LinkedIn Talent blog's 2,600). The van der Blom 2026 report is
paid; its figures here are as quoted by third parties.

---

## 8. Owner checklist (one Chrome session, ~30 min)

1. Read and paste back: headline, About, Featured, banner text, Skills, Services About, Search appearances (section 1 list).
2. Approve headline A (or B/C) and the About draft; fix the contact line.
3. Apply: name case, location "Dubai", headline, About, Featured x3, banner, Services, website labels, article clean-up.
4. Create the newsletter "Shipped with AI" (weekly, Monday 11:00 GST); first edition = the FDE roadmap blog post.
5. Start the two tests in section 6; review on 2026-11-03 with the slot review.
