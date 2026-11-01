# Profile SEO: Instagram @withhammad.ai and Facebook Page "With Hammad AI"

Research-only deliverable, 2026-11-01. Nothing was changed on either account. All "current" values were read
on 2026-11-01 (Graph API GET with the pipeline's own tokens, read-only; public curl for everything else).
Owner: Hammad Yousuf. Audience: marketers, founders, creators using AI. Content: daily AI reels
(Claude Code, AI agents, tools) with a comment keyword that DMs a free guide on withhammad.com/resources/<slug>.

Rule applied throughout: no "AI avatar" wording in any profile text (memory: on-screen branding is WITHHAMMAD only).

---

## 0. Audit: what could and could not be read

| Source | Result |
|---|---|
| `curl https://www.instagram.com/withhammad.ai/` (desktop UA) | HTTP 200 but a 507 KB login-wall shell: `<title>Instagram</title>`, no og:title/og:description, no bio JSON. Nothing profile-specific readable without login. `?__a=1` returns 201 with an empty body; `web_profile_info` returns 401 `require_login`. Not logged in, as instructed. |
| `curl https://www.facebook.com/profile.php?id=61595704034607` (www and m.) | HTTP 400 `<title>Error</title>` for every anonymous request. Nothing public readable with curl. |
| `graph.facebook.com/v21.0/61595704034607` without token | code 104 "An access token is required". |
| Graph API GET `/me` (Instagram Login API, token file `work/.secrets/instagram-withhammad-ai-oauth.json`) | Full profile read, see table below. The Instagram Login API does not return `website`, so the bio links could not be read by API. |
| Graph API GET `/1394106800452348` (Page token, file `work/.secrets/facebook-page-oauth.json`) | name, about, category, website, username, followers, picture, cover, linked IG read. `/call_to_actions` returned error #10 (needs Page Public Content Access), so the CTA button could not be read by API. |
| `outputs/video-pipeline/config.json` → `publishing.destinations` | 8 destinations. `instagram_new` = @withhammad.ai (MEDIA_CREATOR, category Digital creator, linked Page asset 1394106800452348, portfolio "Hammad Yousuf \| AI Agents & Claude Code", role: main posting account, token file `work/.secrets/instagram-withhammad-ai-oauth.json`). `facebook_page` = With Hammad AI (category Digital creator, page_token_valid_can_publish, token file `work/.secrets/facebook-page-oauth.json`). Old @with.hammad and @hammadagentic.ai retired 2026-10-31, Collab-only. |
| `docs/PIPELINE_V2.md` §1 (connection audit 2026-10-31) | @withhammad.ai connected 2026-10-31 15:57, token valid to 2026-12-30; Page connected 21:48, webhook keyword DM live; withhammad.com/resources answers 200. |
| Token files (names only) | `work/.secrets/instagram-withhammad-ai-oauth.json`, `instagram-with-hammad-oauth.json`, `instagram-hammadagentic-ai-oauth.json`, `instagram-client-secret.txt`, `instagram-state.json`, `instagram-webhook-verify-token.txt`, `facebook-page-oauth.json`, `facebook-app-secret.txt`. No values were read into this document. |
| withhammad.com pages (curl) | `/resources` 200 (title "Free AI Resources: Prompts, Guides and Checklists", 22 resource pages linked). `/links` 200 (an existing link-in-bio page: "Hammad Yousuf, AI Marketing Automation Engineer · Dubai, UAE", YouTube, Calendly, newest prompts with keywords SQUAD / IBRAHIM / ADS). `/blog` 200. `/start`, `/free`, `/guides`, `/claude` 404. |

### Current Instagram profile (API read 2026-11-01)

| Field | Current value |
|---|---|
| Username | `withhammad.ai` |
| Name field | `Hammad Yousuf | AI Agents & Claude Code` (39 chars) |
| Bio | `AI engineer, Dubai · Claude Code, AI agents & open-source AI, tested daily` ⏎ `Comment a reel's keyword → free guide in DMs` ⏎ `📩 marketing@withhammad.com` (146 chars) |
| Account type / category | MEDIA_CREATOR (Creator) / Digital creator (from config.json; category is not returned by the API) |
| Link(s) in bio | Not readable by API or anonymous curl. Unknown; treat as "not set" until confirmed in the app. |
| Highlights | None possible yet (0 posts, no stories). |
| Pinned reels | None (media_count 0). |
| Profile photo | Present (profile_picture_url returned). |
| Followers / following / posts | 1 / 1 / 0 |

### Current Facebook Page (API read 2026-11-01)

| Field | Current value |
|---|---|
| Name | `With Hammad AI` |
| Username / vanity URL | **none** (API `link` = https://www.facebook.com/1394106800452348; public URL is still `profile.php?id=61595704034607`) |
| About (short description) | `I build AI agents & automations you can copy. Claude Code, workflows and free guides at withhammad.com/resources` (112 chars) |
| Intro / bio | Not returned (`bio` field empty). |
| Category | Digital creator (single category, no sub-categories) |
| Website | https://withhammad.com/resources |
| CTA button | Not readable by API (error #10). Unknown. |
| Profile picture / cover | Both present. |
| Linked Instagram | @withhammad.ai (17841429263270808) |
| Followers | 0; verification_status not_verified; is_published true |

---

## 1. What ranks in Instagram and Facebook search (evidence, 2026)

Only Meta's own statements are treated as facts; vendor guides are marked as such.

**E1. Instagram search: typed text is matched against username, bio, captions, hashtags, places.** Adam Mosseri, "Breaking Down How Instagram Search Works" (about.instagram.com, 25 Aug 2021): "The text you enter in the search bar is by far the most important signal for Search", matched first against "relevant usernames, bios, captions, hashtags and places"; then your activity; then popularity ("number of clicks, likes, shares and follows for a particular account"). Tips in the same post: use a fitting handle and profile name, "include relevant keywords and locations in your bio", and "For a post to be found in Search, put keywords and hashtags in the caption, not the comments." https://about.instagram.com/blog/announcements/break-down-how-instagram-search-works/ (also summarised by Search Engine Journal https://www.searchenginejournal.com/how-instagram-ranks-search-results/417449/).

**E2. The name field is a searchable field that you can change without touching the handle.** Later, "Instagram SEO" (updated 1 May 2026): username and display name are both searchable; "If adding a keyword to your username isn't possible, prioritize the name field." https://later.com/blog/instagram-seo/ . Hootsuite (2 Apr 2025): use words that describe your niche in the name, not only your personal name; put keywords in the caption, not comments; alt text "is essential for SEO". https://blog.hootsuite.com/instagram-seo/ . Note: both are vendor guides building on E1.

**E3. Hashtags are not a reach lever; captions are the search surface.** Mosseri (quoted in coverage of the five-hashtag limit, Dec 2025): hashtags "don't increase your reach"; Instagram now allows up to five hashtags per post or Reel. https://www.mymobileindia.com/instagram-limits-hashtags-to-five-per-post-and-reel-heres-key-changes-creators-should-know/ (secondary report; the primary is an Instagram AMA). Later and Hootsuite both recommend 3-5 relevant hashtags in the caption, no more.

**E4. Public professional-account posts and Reels are indexed by Google and Bing since 10 Jul 2025.** Eligible: public Business/Creator accounts, owner 18+; photos, videos, carousels and Reels; setting "Allow public photos and videos to appear in search engine results" under Settings → Privacy, on by default for eligible accounts. https://ppc.land/instagram-content-becomes-searchable-on-google-starting-july-10/ , https://metricool.com/instagram-indexing-on-google/ . Consequence: the caption's first line, the name field and the bio become Google snippets too.

**E5. Up to five links in the profile links area (since 18 Apr 2023).** Social Media Today: "add up to five links in their IG bio"; the bio shows a link count and a tap opens the list. https://www.socialmediatoday.com/news/instagram-adds-capacity-to-display-5-links-in-profile-bio/ . Links typed into the bio text are plain text, not clickable (Bitly limits guide https://bitly.com/blog/instagram-character-limit/). Links are only editable in the mobile app (Edit profile → Links), as already recorded in docs/INSTAGRAM_PROFILE.md.

**E6. Character limits.** Bio 150 characters (Bitly, Replug). Name field: vendor guides still print "30", but the live name `Hammad Yousuf | AI Agents & Claude Code` is 39 characters and was accepted via Accounts Center, so the current ceiling is higher (Accounts Center allows 64; keep ≤ 64 as the brief says, and ≤ ~50 so it does not truncate on the profile grid). Bitly: https://bitly.com/blog/instagram-character-limit/ .

**E7. Alt text.** Later (2026): "Write a clear, descriptive sentence that accurately describes the image", include a keyword only when it fits (Accessibility → Write Alt Text). Hootsuite 2025: alt text helps Instagram understand the content; do not stuff it. Alt text is per post, not a profile field. Sources as E2.

**E8. Facebook Page search eligibility is driven by category, name and About.** Vendor consensus (Metricool 2026 https://metricool.com/facebook-seo/ , Neal Schaffer 2026 https://nealschaffer.com/facebook-seo-optimization/ , SEO Sherpa https://seosherpa.com/facebook-seo/ ): Facebook uses the category to decide which searches a Page is eligible for; the Page name and About section are the strongest keyword fields; a short, brand-matched username gives a readable URL that also shows in Google; keyword stuffing is penalised. No Meta document ranks these fields, so treat as practitioner consensus.

**E9. Facebook Page username rules.** Unique, at least 5 characters (sources also give a 50 max), letters, numbers and periods only; set by an admin in Page settings. Vendor and third-party help pages: https://smallbusiness.chron.com/facebook-username-requirements-58392.html , https://uberall.helpjuice.com/guides/1737737-set-a-facebook-page-username . The official Facebook help page https://www.facebook.com/help/1740158369563165 could not be read by curl (JS shell).

**E10. Facebook Page name guidelines.** Up to 75 characters; may not consist solely of generic terms, no all-caps except acronyms, no excessive punctuation; changes are reviewed and may be refused, and name changes are rate-limited. Archived Facebook Page Guidelines https://web-wp.archive.org/web/20160712090515/https:/www.facebook.com/page_guidelines.php plus https://alejandrorioja.com/change-facebook-page-name/ (vendor). Current official page https://www.facebook.com/help/271607792873806 did not render for curl.

**E11. Facebook Page Intro is ~101 characters; a URL there is plain text; the clickable link belongs in Website or the action button.** https://unil.ink/help-center/articles/how-to-add-link-to-facebook-bio (vendor). Treat the 101 figure as indicative.

**E12. Page About can be updated by API; most profile fields cannot.** Meta Pages API "Manage Pages": with the MANAGE task and a Page token, `POST /{page-id}` "with the parameters that you want to update, such as the about parameter"; requires `pages_manage_metadata` (the pipeline's Page token holds it). The doc does not list name, username, category, CTA or Intro as writable. https://developers.facebook.com/documentation/pages-api/manage-pages . Instagram: the IG User reference exposes `biography`, `website`, `name` read-only; no write endpoint exists. https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user .

**E13. What the audience actually types (Google autocomplete, gl=ae, 2026-11-01).**
- "claude code" → claude code ai, download, install, pricing, free, cli, docs, desktop; "claude code for" → mac, windows, free, vs code, beginners; "claude code tutorial" → anthropic, for beginners, for developers, pdf, youtube, 2026.
- "ai agents for marketers" → ai agents for marketing automation, …teams, …agencies, …campaigns, …course.
- "ai automation dubai" → ai automation agency dubai, services dubai, company dubai, course dubai, specialist dubai.
- "ai agent dubai" → ai agent dubai competition / championship / challenge (the Dubai AI Agents Championship, already a resource page), ai voice agent dubai, ai agency dubai.
- "ai tools for marketers" → …marketing automation, …content creation, …agencies.
- "claude skills" → claude skills github, marketplace, library, for marketing.
- "with hammad" → finance with hammad, learn with hammad, property with hammad (no AI association yet; "withhammad" returns nothing). The brand term has to be built; the topic terms already have demand.
Raw output: scratchpad `audit/autocomplete.txt` (session-only).

Terms to carry in profile text, in priority order: **Claude Code**, **AI agents**, **AI automation**, **marketers**, **Dubai**. "Open-source AI" and "tested daily" (current bio) have no autocomplete demand and can give way.

---

## 2. Instagram @withhammad.ai: current vs proposed

### 2a. Name field (≤ 64, keyword-first)

| | Text | Chars | Notes |
|---|---|---|---|
| Current | `Hammad Yousuf \| AI Agents & Claude Code` | 39 | Good keywords, but name-first; "for marketers" and "Dubai" missing. |
| **Option A (recommended)** | `Claude Code & AI Agents for Marketers \| Hammad Yousuf` | 53 | Keyword-first (E1, E2); matches the two top autocomplete clusters (E13); real name kept for people who know him (E1 tip). |
| Option B | `Hammad Yousuf \| Claude Code, AI Agents & Automation · Dubai` | 59 | Adds "automation" and "Dubai" for local searches ("ai automation dubai", E13); name-first. |
| Option C | `AI Automation & Claude Code, Dubai \| Hammad Yousuf` | 50 | Local-first positioning (consulting leads). |

Recommendation: **A**. The reels are about Claude Code and agents for marketers; Dubai goes in the bio (Mosseri: location in the bio, E1). Instagram allows two name changes per 14 days (docs/INSTAGRAM_PROFILE.md), so change once and leave it.

### 2b. Bio (≤ 150, keyword CTA line)

| | Text (⏎ = line break) | Chars |
|---|---|---|
| Current | `AI engineer, Dubai · Claude Code, AI agents & open-source AI, tested daily` ⏎ `Comment a reel's keyword → free guide in DMs` ⏎ `📩 marketing@withhammad.com` | 146 |
| **Option 1 (recommended)** | `AI automation engineer · Dubai` ⏎ `Claude Code & AI agents marketers can copy` ⏎ `Comment a reel's keyword → free guide in DMs` ⏎ `📩 marketing@withhammad.com` | 145 |
| Option 2 | `Claude Code + AI agents for marketers & founders · Dubai` ⏎ `Daily reels, every build tested` ⏎ `Comment the keyword → free guide in your DMs` | 133 |
| Option 3 | `I build AI agents & automations you can copy · Dubai` ⏎ `Claude Code, n8n & AI tools for marketers` ⏎ `Comment a reel's keyword → free guide in your DMs` | 144 |

Recommendation: **Option 1**. Line 1 mirrors withhammad.com ("AI Marketing Automation Engineer, Dubai"), line 2 carries "Claude Code", "AI agents", "marketers" (E1, E13), line 3 is the funnel instruction every reel relies on, line 4 keeps the business email. Drop "open-source AI, tested daily" (no search demand). Instagram counts some symbols as 2; if the field refuses, remove "your"/"a reel's" first. Keep the arrow and one emoji at most.

Copy-paste block (Option 1):
```
AI automation engineer · Dubai
Claude Code & AI agents marketers can copy
Comment a reel's keyword → free guide in DMs
📩 marketing@withhammad.com
```

### 2c. Category

Current: Digital creator (Creator account). Proposed: **keep Creator**, but switch the category label to **"Entrepreneur"** or keep "Digital creator" shown. Reason: category text is displayed on the profile and is one of the few extra keyword slots, but Instagram offers no "AI" category; "Digital creator" is the honest match for daily reels and the owner chose Creator deliberately (memory 2026-10-31). Recommendation: **keep Digital creator, keep the label visible** (Edit profile → Category → Display category label ON).

### 2d. Links (up to 5, mobile app only, E5)

Current: unknown (not readable). Proposed order:
1. `https://withhammad.com/resources` — title `Free guides from my reels` (exists, 200; this is the landing the keyword DMs point into).
2. `https://withhammad.com` — title `Agents that run your marketing` (consulting).
3. `https://www.youtube.com/@with.hammad` — title `Long videos on YouTube`.
Do not use `/links` as link 1: it still shows the old prompts (SQUAD / IBRAHIM / ADS) and a Calendly first; `/resources` is the maintained page. One link on the profile (not a third-party link tool): the first link shows inline, the rest behind "and 2 more" (E5). Also set `/resources` as the Website in Page settings (already done on Facebook).

### 2e. Pinned reels (3 slots; only after the first posts land on 2 Nov)

1. **Pin 1 = "start here"**: the strongest Claude Code reel of the first week (highest saves/shares, from Insights), cover text carrying "Claude Code".
2. **Pin 2 = the funnel explainer**: one reel that shows the comment → DM → guide flow on screen (so the bio line is proven on the grid).
3. **Pin 3 = rolling**: the newest keyword reel; the publish routine replaces it each day (manual, app only).
Covers must follow the glow-grid template with the hook inside the grid crop (memory).

### 2f. Highlights (need stories first)

Four, named with the search terms, in this order: `Start here` · `Claude Code` · `AI agents` · `Free guides`. Each highlight holds the story re-shares of that topic's reels. Highlight names are visible text on the profile and indexed by Google once the profile is public professional (E4).

### 2g. Per-post signals that this profile strategy depends on (publish routine, API-capable)

- Caption first line = hook with the keyword and tool name (E1, E3); 3-5 hashtags max in the caption, never in comments (E1, E3).
- Alt text on every image/carousel at publish time (`alt_text` on the media container) and custom alt text on reel covers in-app (E7).
- On-screen captions in every reel (already the pipeline's default) so there is text to index.

---

## 3. Facebook Page "With Hammad AI": current vs proposed

| Field | Current | Proposed | How |
|---|---|---|---|
| Name | `With Hammad AI` | **Keep.** It is the brand the IG account is linked to; adding keywords ("With Hammad AI \| Claude Code & AI Agents", 42 chars) is allowed (E10, ≤75, not generic-only) but every name change is reviewed and rate-limited and a 0-follower Page may be refused. Revisit after 100 followers. | App/desktop: Page → Settings → Page setup → Name |
| Username / vanity URL | **none** (profile.php?id=…) | **`withhammad.ai`** (matches Instagram; periods allowed, E9). Fallback `withhammadai`, then `withhammad.ai.page`. Availability could not be checked anonymously (facebook.com/<name> returns 200 for any name to curl). | Desktop: facebook.com/profile.php?id=61595704034607 → Settings → Page setup → Username → Create. Some Pages need a minimum follower count/age before a username is offered (E9 vendor claim); if refused, retry after the first week of posts. |
| Intro (≈101 chars, E11) | empty | `Claude Code & AI agents for marketers, Dubai. Comment a keyword, get the free guide.` (84) | App: Page → Edit details → Intro/Bio |
| About (short description) | `I build AI agents & automations you can copy. Claude Code, workflows and free guides at withhammad.com/resources` (112) | `AI automation engineer in Dubai. Daily reels on Claude Code, AI agents and AI tools for marketers and founders. Comment a reel's keyword and the free guide arrives in your Messenger. Guides: withhammad.com/resources` (keyword order follows E13; the URL stays as text, the clickable one is the Website field) | **API-capable**: `POST /1394106800452348?about=…` with the Page token (`pages_manage_metadata` held, E12). Also editable in-app. |
| CTA / action button | unknown (not readable) | **"Learn more" → https://withhammad.com/resources** (the free-guide landing; a "Send message" button would collide with the keyword-DM webhook's private replies and invite unqualified DMs). | App/desktop: Page → Add action button |
| Category | Digital creator | Keep **Digital creator** as primary; add sub-categories **"Marketing agency"** and **"Education"**? Vendor guidance says up to 3 (E8), but changing categories can alter features and ad targeting; only add if the picker offers "Software company"/"Education website" that match. Default: keep single category. | Settings → Page setup → Category |
| Website | https://withhammad.com/resources | Keep. | (API-capable field is unconfirmed; leave as is) |
| Email / location | not set | Add `marketing@withhammad.com` and Dubai, United Arab Emirates (About block keywords + Google snippet, E8). | App: Edit details → Contact / Location |
| Cover photo | present | Re-use the glow-grid thumbnail style with the line `Claude Code & AI agents for marketers · free guides in the comments` so the cover carries the keywords as pixels (not indexed, but the first thing a searcher sees). | App |
| Pinned post | none | Pin the funnel-explainer reel once it is live (same as IG pin 2). | App |

Copy-paste About (new):
```
AI automation engineer in Dubai. Daily reels on Claude Code, AI agents and AI tools for marketers and founders. Comment a reel's keyword and the free guide arrives in your Messenger. Guides: withhammad.com/resources
```
Copy-paste Intro:
```
Claude Code & AI agents for marketers, Dubai. Comment a keyword, get the free guide.
```

---

## 4. Evidence table

| # | Claim used | Source | Type | Date |
|---|---|---|---|---|
| E1 | Search matches typed text against username, bio, captions, hashtags, places; keywords and location in bio; keywords in caption not comments | about.instagram.com/blog/announcements/break-down-how-instagram-search-works/ | Meta, Mosseri | 2021-08-25 |
| E1b | Same, summarised | searchenginejournal.com/how-instagram-ranks-search-results/417449/ | Trade press | 2021-08-25 |
| E2 | Name field carries search weight; prioritise it when the handle is fixed | later.com/blog/instagram-seo/ | Vendor guide | upd. 2026-05-01 |
| E2b | Niche words in the name; captions not comments; alt text essential | blog.hootsuite.com/instagram-seo/ | Vendor guide | 2025-04-02 |
| E3 | Hashtags "don't increase your reach"; 5-hashtag cap | mymobileindia.com/instagram-limits-hashtags-to-five-per-post-and-reel-… | Secondary report of Mosseri AMA | 2025-12-21 |
| E4 | Google/Bing indexing of public professional posts and Reels; setting location; default on | ppc.land/instagram-content-becomes-searchable-on-google-starting-july-10/ ; metricool.com/instagram-indexing-on-google/ | Trade press | 2025-07-10 |
| E5 | Five profile links | socialmediatoday.com/news/instagram-adds-capacity-to-display-5-links-in-profile-bio/ | Trade press | 2023-04-18 |
| E6 | Bio 150; name limit; links in bio text not clickable | bitly.com/blog/instagram-character-limit/ | Vendor guide | 2025/26 |
| E6b | Live name of 39 chars accepted | Graph API read of @withhammad.ai | First-hand | 2026-11-01 |
| E8 | Page category/name/About drive Facebook search eligibility | metricool.com/facebook-seo/ ; nealschaffer.com/facebook-seo-optimization/ ; seosherpa.com/facebook-seo/ | Vendor guides | 2026 |
| E9 | Page username: unique, ≥5 chars, letters/numbers/periods | smallbusiness.chron.com/facebook-username-requirements-58392.html ; uberall.helpjuice.com/guides/1737737-set-a-facebook-page-username | Third-party help | n/d |
| E10 | Page name ≤75, not generic-only, reviewed | web-wp.archive.org/web/20160712090515/https:/www.facebook.com/page_guidelines.php ; alejandrorioja.com/change-facebook-page-name/ | Archived Meta policy; vendor | 2016 / 2025 |
| E11 | Intro ≈101 chars, URL not clickable | unil.ink/help-center/articles/how-to-add-link-to-facebook-bio | Vendor | 2026 |
| E12 | `POST /{page-id}` updates `about` with pages_manage_metadata; IG profile fields read-only | developers.facebook.com/documentation/pages-api/manage-pages ; developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user | Meta developer docs | current |
| E13 | Audience search terms | suggestqueries.google.com/complete/search?client=firefox&gl=ae&q=… | First-hand | 2026-11-01 |

Not readable / unverified: Instagram Help Center pages (449689736005633 links, 503280838939584 alt text, 1142640958575389 search) and Facebook Help pages (1740158369563165 username, 271607792873806 Page names) all render as JS shells to curl/WebFetch; limits quoted above therefore come from vendor pages and the first-hand API read. Mosseri's 2025-26 remarks on Reels keywords exist only in secondary coverage.

---

## 5. What the API cannot change: app steps for the owner

Everything below is manual. Nothing has been done yet.

**Instagram (phone app, @withhammad.ai; name via Accounts Center):**
1. Name field: Instagram app → Profile → Edit profile → Name → paste Option A `Claude Code & AI Agents for Marketers | Hammad Yousuf` → Done. (If the app routes name edits to Accounts Center: accountscenter.instagram.com → Profiles → withhammad.ai → Name.) Limit: 2 changes / 14 days.
2. Bio: Edit profile → Bio → paste Option 1 block → Done. Web alternative: instagram.com/accounts/edit (desktop Chrome, logged in as withhammad.ai).
3. Links: Edit profile → Links → Add external link → URL `https://withhammad.com/resources`, title `Free guides from my reels` → repeat for `https://withhammad.com` (`Agents that run your marketing`) and `https://www.youtube.com/@with.hammad` → drag `/resources` to the top. Mobile only.
4. Category label: Edit profile → Category → keep Digital creator → toggle "Display category label" ON.
5. Search-engine indexing: Settings and activity → Privacy (or Account type and tools) → confirm "Allow public photos and videos to appear in search engine results" is ON.
6. Pins: after 2 Nov, open each chosen reel → ⋯ → Pin to your profile (max 3).
7. Highlights: share each reel to Stories (adds text to index) → from the profile tap "+ New" under highlights → name `Start here`, `Claude Code`, `AI agents`, `Free guides`.
8. Reel covers: when posting from the app set alt text (Advanced settings → Accessibility → Write alt text); API posts carry `alt_text` on image containers only.

**Facebook Page (desktop Chrome, logged in as the Page admin):**
1. Username: facebook.com/profile.php?id=61595704034607 → Settings → Page setup → Username → `withhammad.ai` → Save (fallback `withhammadai`). If the option is missing, the Page is not yet eligible; retry after the first week.
2. Intro: Page → Edit details (About card) → Intro/Bio → paste the Intro block.
3. Action button: Page header → "Add action button" → Learn more / Visit website → `https://withhammad.com/resources`.
4. Contact and location: Edit details → Email `marketing@withhammad.com`, Location Dubai, United Arab Emirates.
5. Cover photo: upload the glow-grid cover with the keyword line.
6. About (short description): can be done by API (`POST /1394106800452348` with `about`), or in Edit details → About. Not executed here.
7. Pin: once the funnel-explainer reel is published, ⋯ → Pin to top.

---

## 6. Recommended, in one place

Instagram name: `Claude Code & AI Agents for Marketers | Hammad Yousuf`
Instagram bio:
```
AI automation engineer · Dubai
Claude Code & AI agents marketers can copy
Comment a reel's keyword → free guide in DMs
📩 marketing@withhammad.com
```
Instagram link 1: https://withhammad.com/resources (then withhammad.com, then YouTube)
Facebook: keep name `With Hammad AI`; claim username `withhammad.ai`; Intro and About as in §3; action button Learn more → withhammad.com/resources.

Top 3 evidence points: (1) Instagram's own search post: typed text is matched against username, bio and captions, so keywords belong in the name field, bio and the caption (not comments) [E1]; (2) since July 2025 public Creator posts and Reels are indexed by Google, so the name field and the first caption line double as Google snippets [E4]; (3) Google autocomplete in the UAE already carries "claude code", "ai agents for marketers" and "ai automation dubai", while "withhammad" has no demand yet, so the profile has to rank for the topic terms first [E13].
