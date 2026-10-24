# AI-niche rebrand: YouTube and every social profile

Drafted 2026-10-24 for the owner's request "optimize my youtube, convert its total niche to ai stuff ... covers in
youtube, change all settings according to ai stuff ... and all other platforms optimize as per ai".
**Nothing here has been applied.** The audit used read-only calls only. Every change below waits for the owner's OK.

Character counts are measured with Python `len()`. Platforms that count emoji as 2 are noted where it matters.
"API" means the repo's own tokens can make the change. "Chrome" means the owner's Chrome, or the phone app where
stated.

## 0. Visual system (banners)

Remotion stills in `studio/remotion/src/banners/` (`index.tsx`, `Banners.tsx`, own `tsconfig.json`, like `src/kimi`).
The source assets were copied to `studio/remotion/public/banners/`: the smile cut-out `cover_cut3.png` from
public/kimi, `claude-tile.png`, and the OpenAI, Ollama, Hugging Face, GitHub and n8n marks (simple-icons 13.21.0
SVGs, CC0 files of the official marks). The look is the SkillSpector cover: teal glow on #090A0A, faint Doto binary
rain, teal light bars, real marks on tilted app tiles, the cut-out face, and white Inter 900 caps with line 2 in the
#FF3231 box.

Render from `studio/remotion`:

```bash
npx remotion still src/banners/index.tsx YouTubeBanner  ../.local/brand-samples/banners/YouTubeBanner.png
npx remotion still src/banners/index.tsx XHeader        ../.local/brand-samples/banners/XHeader.png
npx remotion still src/banners/index.tsx LinkedInBanner ../.local/brand-samples/banners/LinkedInBanner.png
# add --props='{"guides":true}' to draw the safe zones
```

| File (studio/.local/brand-samples/banners/) | Size | Weight | Check |
|---|---|---|---|
| YouTubeBanner.png | 2560x1440 | 2.6 MB (limit 6 MB) | Face, kicker, hook, URL and Claude tile all sit inside the 1546x423 safe area (x 507-2053, y 508-931). The OpenAI and Ollama tiles are in the desktop-only wings. The Hugging Face, n8n and GitHub tiles are TV-only. |
| YouTubeBanner-mobile-crop.png / -mobile-390px.png | 1546x423 / 390x107 | | Phone view. The hook stays readable at 390 px. The URL line drops to about 9 px there, so it is a bonus on phones, not the message. |
| YouTubeBanner-desktop-crop.png | 2560x423 | | Desktop view. |
| XHeader.png | 1500x500 | 0.6 MB (limit 2 MB) | Text in x 470-1200, y 98-380. The bottom-left avatar zone (x 0-330, y 330-500) is empty. |
| LinkedInBanner.png | 1584x396 | 0.5 MB (limit 8 MB) | Text in x 480-1140. The avatar zone (x 0-300, y 190-396) is empty. |
| *-guides.png | | | The same files with the safe zones drawn. |

Copy on the banners:
- YouTube and X: kicker "CLAUDE CODE · AI AGENTS · LOCAL LLMS". Hook "A NEW AI BUILD" / "EVERY DAY". Line:
  "Tested by hand · free guide: withhammad.com/resources" (X: "Free guide for each one: ...").
- LinkedIn (recruiters and founders): kicker "AI AGENTS · RAG · MCP · CLAUDE CODE". Hook "AI AGENTS THAT" /
  "ACTUALLY SHIP". Line: "Builds, tests and free guides: withhammad.com/resources".

Profile photo: use one photo everywhere. The current YouTube photo (studio-lit, dark backdrop, smile) already fits
the system. X uses `work/profile/x_avatar_800.jpg`. Pick one and use it on all six profiles.

---

## 1. YouTube: @with.hammad (UCJtrEDGg1R3kNe7t7PQFiEw)

### Audit (2026-10-24, Data API + Studio, read-only)
- Title "HAMMAD YOUSUF". The description is **empty** and there are **no channel keywords**. defaultLanguage en.
  Country is not set.
- Stats: 547,000 subscribers, 314,717 views, 77 public videos. The uploads list holds 3,723 videos: 3,246 unlisted
  and 400 private.
- Topic categories: Lifestyle and Technology.
- Of the 77 public videos, **61 are not AI**: Quran and Islamic shorts, 12-hour "study with me" lives,
  "day in the life" vlogs and Dubai jobs. They hold about 277,600 of the public views.
- The AI era (Aug 2026 onward) is 16 public and 5 private uploads, all in category 28 Science & Technology.
- Playlists, all public:

  | Playlist | Videos |
  |---|---|
  | Quran Recitation — Beautiful Voices | 174 |
  | Islamic Reminders | 0 |
  | Ayatul Kursi & Ruqyah | 0 |
  | Noha & Devotional | 0 |
  | AI | 1 ("ISLAM vs AI?") |
  | 100 Days of Coding | 28 |
  | Day in the Life of Software Engineer | 12 |
  | Day In the Life of Software Engineer Shorts | 2 |

- Home tab: a single undefined section. No trailer and no featured video.
- Banner: the old purple desk photo with neon "CODING / AI NEWS / MONEY" pills. Text sits outside the safe area.
- Profile photo: black turtleneck and blazer, dark backdrop.
- Links: one, Instagram. Studio still shows a legacy custom URL, **youtube.com/c/TravellingBuggy**.
- The pipeline already sets `containsSyntheticMedia=True` and category 28 on every upload
  (studio/app/publish_youtube.py).

### Proposed

| Item | Current | Proposed | How |
|---|---|---|---|
| Name (100 max) | HAMMAD YOUSUF | `Hammad Yousuf \| AI Agents & Claude Code` (39) | Chrome: Studio > Customisation > Profile. The API cannot write the title. |
| Handle | @with.hammad | **Keep.** It is the brand, it matches IG @with.hammad and withhammad.com, and every published link points to it. | none |
| Legacy URL | /c/TravellingBuggy | Delete it. It is a non-AI leftover and nothing links to it. | Chrome: Studio > Customisation > Profile > Custom URL > Delete |
| Description (1,000 max) | empty | Block A below (838). The first 150 characters carry what the channel is, the cadence and the guide link. | API: channels.update brandingSettings.channel.description |
| Keywords (500 max) | none | Block B (256) | API: brandingSettings.channel.keywords |
| Country | unset | United Arab Emirates (AE) | API: brandingSettings.channel.country |
| Banner | old desk photo | YouTubeBanner.png | API: channelBanners.insert, then channels.update brandingSettings.image.bannerExternalUrl. Chrome also works. |
| Profile photo | blazer headshot | Keep it, or replace with the shared photo (see section 0) | Chrome only. The API has no endpoint for it. |
| Links (14 max; the first shows on the banner) | 1: Instagram | 1. Free AI guides → https://withhammad.com/resources 2. Instagram → https://www.instagram.com/with.hammad 3. X → https://x.com/HammadYousufAI 4. LinkedIn → https://www.linkedin.com/in/withhammad/ 5. TikTok → https://www.tiktok.com/@hammadyousuf01 | Chrome only |
| Contact email | (not read) | marketing@withhammad.com | Chrome |
| Trailer (non-subscribers) | none | `7DYRPcrJB9M` "How to Build Effective AI Agents (Without the Hype)", the best-performing long AI video (608 views) | API: brandingSettings.watch.unsubscribedTrailer. Chrome also works. |
| Featured (returning viewers) | none | "Latest upload" | Chrome: Home tab |
| Home sections | none | 1. Shorts (latest) 2. Claude Code playlist 3. AI Agents playlist 4. Free & Open-Source AI Tools 5. Local LLMs 6. Urdu/Hindi | Chrome: Home tab. channelSections writes are unreliable since the 2023 layout change, so try the API once and fall back to Chrome. |
| Watermark | (not read) | Profile photo, 150x150, "entire video" | API: watermarks.set |
| Non-AI public videos (61) | public | **Unlist them; do not delete.** It is reversible, and views, subscribers and watch history stay. Old links keep working. | API: videos.update part=status, privacyStatus=unlisted. Owner OK needed: it is a bulk change to public content. |
| Islamic, coding-vlog and "AI" playlists (8) | public | Set to private. Unlisting the videos is not enough, because public playlists still show on the Playlists tab. | API: playlists.update status.privacyStatus=private |
| AI playlists | none | Create the six below | API: playlists.insert + playlistItems.insert |
| Upload defaults | (not read; Studio modal) | Block C | Chrome: Studio > Settings > Upload defaults. There is no API. |
| Altered content | set per video by the pipeline | Keep "Yes" for every avatar video. Studio has no channel-level default, and `publish_youtube.py` already sends `containsSyntheticMedia=True`. | already done |

Decision on the 61 videos (owner):
- **(a) Recommended: unlist them.** The channel reads as pure AI. Views and subscribers stay. You can undo it with
  one API run.
- (b) Keep them public, but hide them from the Home tab and playlists. Search and the Videos tab still show them,
  which mixes the niche signal.
- (c) Delete them. Not recommended: this is irreversible and loses views.

The 547K subscriber base came mostly from Quran content. Expect falling views per subscriber, and possibly some
unsubscribes, whichever option you pick. That cost comes with the niche switch itself, and keeping old content up
does not avoid it.

**Block A: channel description (838 characters)**
```
Claude Code, AI agents and open-source AI tools, tested by hand. A new AI build every day, each with a free guide at withhammad.com/resources

I'm Hammad Yousuf, an AI engineer in Dubai. I build AI agents, RAG apps and MCP integrations for real businesses, and I post the ones that actually work:
- Claude Code skills, MCP servers and agent workflows
- Free and open-source AI tools worth installing
- Local LLMs you can run on your own machine
- AI security: what to check before you install
- Longer build-alongs in English and Urdu/Hindi

Many videos are presented by an AI avatar of me, made from my own likeness and voice, and carry YouTube's altered-content label. Every tool, number and claim is checked before it goes up.

Free guides from every video: https://withhammad.com/resources
Business enquiries: marketing@withhammad.com
```

**Block B: channel keywords (256 characters, multi-word terms quoted)**
```
"Claude Code" "AI agents" "Claude AI" "MCP" "Model Context Protocol" "open source AI tools" "free AI tools" "local LLM" "Ollama" "AI automation" "AI engineer" "RAG" "Claude skills" "agentic AI" "AI security" "n8n" "AI tools 2026" "Hammad Yousuf" withhammad
```
Keywords and tags are weak ranking signals. Titles, the first lines of the description and retention do the work.
Keywords mainly tell YouTube what the channel is about after a niche switch.

**Block C: upload defaults (Studio > Settings > Upload defaults)**
- Visibility: Private, so nothing goes live before the owner's OK.
- Category: Science & Technology. Video language and title/description language: English. The Urdu/Hindi videos
  get their language set per upload.
- Licence: Standard YouTube. Comments: on, "hold potentially inappropriate". Shorts remixing: allowed.
- Tags (500 max):
  ```
  AI, AI agents, Claude Code, Claude AI, AI tools, open source AI, MCP, AI automation, local LLM, withhammad
  ```
- Description template (the pipeline's seo.json overwrites it per video; this covers manual uploads):
  ```
  Free guide for this video: https://withhammad.com/resources

  A new AI build every day: https://www.youtube.com/@with.hammad?sub_confirmation=1

  This video uses an AI avatar of me, made from my own likeness and voice.

  #AI #ClaudeCode #AIAgents
  ```

**AI playlists (create via API; titles max 150 characters)**

| Playlist | Description | Videos to add now |
|---|---|---|
| Claude Code: Skills, MCP & Agent Workflows | Claude Code skills, MCP servers and agent workflows, tested by hand, each with a free guide at withhammad.com/resources | HClAkG74r6A, V3VktnIhaDA, tFXvaVzEP7Y, Cw7JeXFbNks, 053Jz0giB-s, v4okdBQy4-I, rTUd66Teik0 (when public) |
| AI Agents: Build Them Properly | How to design, test and ship AI agents that hold up in production, from LLM choice to tool calls | 7DYRPcrJB9M, 5UyTCBMl9IQ, GT1dRSU9tAU, yWSqZF77xCw, 053Jz0giB-s |
| Free & Open-Source AI Tools | Free and open-source AI tools worth installing, with what they really do and the catch | jAkCUHVV5WY, WMhrzmEMJuM, u4J1oQqQoTM, xnL4IfRhR3E |
| Local LLMs: Run AI on Your Own Machine | Running open models on your own hardware: what fits, how fast it is and what it costs | rFGgZsNyngY (when public) |
| AI Security: Check Before You Install | Scanning AI skills, agents and packages before they touch your machine or your keys | rTUd66Teik0 (when public) |
| AI Builds in Urdu/Hindi | Claude AI aur AI engineering, Urdu/Hindi mein, step by step | wWxiffPWv8E, NOufGTROPI8 |

Also delete the private 4-second test upload `c7XgV8aUWU4` ("AMOS YouTube MCP — Private Capability Test"). Owner
OK needed, because deletion is permanent.

---

## 2. Instagram: @with.hammad (MEDIA_CREATOR, 112,535 followers, 41 posts)

### Audit (Graph API /me, read-only)
- Name: "Hammad Yousuf | AI Agents & Claude Code for Marketers".
- Bio: "Claude Code + AI agent builds for marketers | Dubai / Comment a reel's keyword → free guide link in your DMs /
  📩 marketing@withhammad.com".
- Website: **https://www.youtube.com/@with.hammad**. The 3-link set from docs/INSTAGRAM_PROFILE.md is not live in
  the API's website field.
- The last 12 posts are all AI reels.

### Proposed

| Item | Current | Proposed | How |
|---|---|---|---|
| Name (64 max; searchable) | …for Marketers (54) | `Hammad Yousuf \| AI Agents & Claude Code` (39). "for marketers" goes, so the niche is AI itself. | Chrome: Accounts Center. Limit: 2 changes per 14 days. |
| Bio (150 max) | marketers framing | Block D (146; Instagram counts 147) | Chrome: instagram.com/accounts/edit |
| Links (5 max) | YouTube only | 1. Free AI guides → https://withhammad.com/resources 2. YouTube → https://www.youtube.com/@with.hammad 3. AI builds for business → https://withhammad.com | Phone app only |
| Category | (not readable) | Science, Technology & Engineering, or keep "Digital creator" with the category hidden | Phone app: Edit profile > Category |
| Highlights | (not readable) | "Start here", "Claude Code", "AI agents", "Free tools", "Local LLMs". Covers: #090A0A circle, white Inter 900 word, one mark each. They can be built from Banners.tsx tiles on request. | Phone app |
| Pinned (3) | (not readable) | HARVEST (AI lead gen), SKILL (Claude YouTube skill), DUET (Claude Duet) | Phone app |
| AI label | | Keep the per-reel AI label (app.publish_reel checks it) | already done |

**Block D: Instagram bio (146 characters)**
```
AI engineer, Dubai · Claude Code, AI agents & open-source AI, tested daily
Comment a reel's keyword → free guide in DMs
📩 marketing@withhammad.com
```

## 3. Instagram: @hammadagentic.ai

Not audited: the stored token fails with error 190 ("session invalidated"). Re-authorize it in a separate Chrome
profile (AGENTS.md). Proposed changes (Chrome, separate profile):
- Name (64 max): `Hammad Yousuf | AI Builds Daily` (31).
- Bio (120):
  ```
  A new AI build every day: Claude Code, agents, open-source tools
  Reels with @with.hammad · AI avatar of me
  Free guides ↓
  ```
- Link: https://withhammad.com/resources

## 4. TikTok: @hammadyousuf01

### Audit (public page)
Name "HAMMAD YOUSUF", **no bio**, 59 followers, 2 following, 3,244 likes. No website link: the website field needs
1,000 followers or a Business account.

### Proposed (all in the phone app; there is no profile API)

| Item | Proposed |
|---|---|
| Name (30 max) | `Hammad Yousuf \| AI Builds` (25) |
| Username (24 max, one change per 30 days) | Optional: `@with.hammad` if free, to match YouTube and Instagram. The owner checks this in the app. Old links break, so do it now while the audience is 59. |
| Bio (80 max) | `AI engineer in Dubai 🤖 Claude Code + AI agents, tested daily. Free guides ↓` (75; TikTok counts 76) |
| Website | https://withhammad.com/resources. It needs Business account > category "Science & Technology". Our reels use original music beds, so the business-account music limit does not matter. |
| Pinned (3) | HARVEST, SKILL, DUET |

## 5. X: @HammadYousufAI

### Audit (public profile)
- Name "Hammad Yousuf | AI Engineer".
- Bio "AI Engineer | Forward Deployed Engineer / Building AI agents, RAG & business integrations. / Python · FastAPI ·
  MCP / Projects & practical guides ↓". This changed after docs/X_PROFILE.md was written.
- Location Dubai, UAE. Website withhammad.com. 5 posts.
- Header: the light 2026-10-18 banner, off-system.

### Proposed (Chrome: x.com/settings/profile)

| Item | Proposed |
|---|---|
| Name (50 max) | `Hammad Yousuf \| AI Agents & Claude Code` (39) |
| Bio (160 max) | `AI engineer in Dubai. I test Claude Code, AI agents & open-source AI tools, one build a day, each with a free guide ↓ 📩 marketing@withhammad.com` (144) |
| Website | https://withhammad.com/resources |
| Header | XHeader.png |
| Pinned | Keep the SKILL post, or swap to the latest best reel |

## 6. LinkedIn: linkedin.com/in/withhammad

### Audit (owner's Chrome, read-only)
- Headline: "AI Engineer | Forward Deployed Engineer | LLM Applications, AI Agents & RAG | Python, FastAPI, MCP | Enterprise
  AI Integration & Deployment | Promate Technologies".
- 6,567 followers, 500+ connections. "Open to work" is set to recruiters only.
- The About section is already AI engineering. The Featured section holds the invoice-lab post, the Adam RAG app,
  withhammad.com and the YouTube Silver Play Button item.
- No banner was seen.

LinkedIn is already AI. The changes make it match the daily-builds brand without hurting the job search. Everything
is done in Chrome: the stored token only has w_member_social and cannot edit the profile.

| Item | Proposed |
|---|---|
| Banner (1584x396) | LinkedInBanner.png |
| Headline (220 max) | `AI Engineer \| I build AI agents, RAG & MCP integrations that ship \| Python, FastAPI, Claude API \| Daily AI builds + free guides at withhammad.com \| Dubai` (153). Alternatively keep the current headline if the owner wants "Forward Deployed Engineer" and the Promate name for recruiters. |
| About | Add this paragraph before "Projects and engineering guides" (203): `Every day I also test one AI tool or agent workflow (Claude Code, MCP servers, open-source and local models) and publish a short breakdown with a free step-by-step guide: https://withhammad.com/resources` |
| Featured | Add https://withhammad.com/resources ("Free AI guides from my daily builds") as item 1 |
| Website (contact info) | https://withhammad.com/resources, labelled "Free AI guides" |

## 7. Facebook: profile 100090938416059

### Audit (owner's Chrome)
"Hammad Yousuf". 50 followers, 9 following. Category "Digital creator". **No cover photo and no bio.**

### Proposed (Chrome: profile > Edit)

| Item | Proposed |
|---|---|
| Bio (101 max) | `AI engineer in Dubai · Claude Code, AI agents & open-source AI tools, one build a day 🤖` (87) |
| Category | Keep "Digital creator" |
| Links | https://withhammad.com/resources, https://www.youtube.com/@with.hammad |
| Cover (851x315 shown; upload 1640x624 or larger) | Not rendered yet. A Facebook variant can be added to src/banners. Until then the LinkedIn banner fits acceptably. |
| Featured | The 3 reels pinned on TikTok and Instagram |

---

## What needs the owner's hands
1. **Approve this list.** Then the API part can run: YouTube description, keywords, country, trailer, banner,
   watermark, playlists, and unlisting the 61 non-AI videos plus making 8 playlists private. That needs explicit OK
   for the bulk unlist.
2. **Chrome:** YouTube name, links, contact email, legacy URL deletion, Home tab and upload defaults. X profile and
   header. LinkedIn banner, headline, About and Featured. Facebook bio and links. Instagram bio and name.
3. **Phone app:** Instagram links, category, highlights and pins. TikTok name, bio, Business switch, website and
   pins (and the optional username change).
4. **@hammadagentic.ai:** re-authorize it (error 190) before any change.
5. **Decide:** the 61 old videos (unlist, keep or delete), LinkedIn headline (job-search or creator wording), TikTok
   username, and which profile photo to use everywhere.

## Sources
- YouTube banner and photo specs (2048x1152 minimum, 1235x338 safe area at that size = 1546x423 at 2560x1440,
  6 MB; photo 98x98, 15 MB): https://support.google.com/youtube/answer/10456525
- Channel name, handle, description and links: https://support.google.com/youtube/answer/2972003
- YouTube altered/synthetic content disclosure: https://blog.youtube/news-and-events/disclosing-ai-generated-content/
- Description and character-limit guidance (secondary): https://typecount.com/blog/youtube-description-character-limit ,
  https://touhfa.art/blog/growth/youtube-channel-description-guide/
- TikTok limits and website-link rule (secondary; check in the app): https://replug.io/blog/tiktok-bio-character-limit ,
  https://stan.store/blog/tiktok-link-bio-requirements-2026-guide/
- Funnel and policy context: docs/FUNNEL.md. Earlier profile work: docs/INSTAGRAM_PROFILE.md, docs/X_PROFILE.md.
