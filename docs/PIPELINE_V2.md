# Pipeline v2: paste a link, everything else is automatic

Owner brief 2026-10-31 (voice): "I only need to paste the link of Instagram, YouTube or LinkedIn. You convert it
exactly the same but with my avatar, me talking, same background, everything same, less avatar because of credits.
Then post it on Instagram and the rest at the best time. Per day at least 2 reels; one full YouTube video a week;
LinkedIn per day 1 carousel, 2 posts, 3 reels and 1 newsletter. Check the analytics. First audit everything, make
everything connected, then I post." GitHub is "the main main method" (every change committed; GitHub links are also
valid references).

## 1. Connection audit, 2026-10-31

Probed live today (tokens called, Chrome sessions opened). Not from memory.

| # | Connection | Status today | What is needed |
|---|---|---|---|
| 1 | **Instagram @withhammad.ai** (main; Creator; linked to Page With Hammad AI; portfolio "Hammad Yousuf \| AI Agents & Claude Code") | **Connected 2026-10-31 15:57**: token valid to 2026-12-30, identity confirmed, dry-run container from @withhammad.ai with Collabs @with.hammad + @hammadagentic.ai OK | Nothing. (First consent went to the old session: log Chrome out of Instagram before the consent link.) |
| 2 | Instagram @with.hammad, @hammadagentic.ai | **Both tokens invalidated** (Meta: session invalidated, password changed). Retired 2026-10-31: no new posts, only Collab invites | Nothing. Collab invites need only the usernames. Owner accepts each invite in the app. |
| 3 | **Facebook Page With Hammad AI** (61595704034607) | Page live with cover, picture, bio, link. **No Page token** | Same consent as #1 covers Facebook Reels if the app has `pages_manage_posts`; otherwise Chrome composer. |
| 4 | **YouTube** HAMMAD YOUSUF (UCJtrEDGg1R3kNe7t7PQFiEw) | **Re-connected 2026-10-31 15:58**: refresh works, channels.list answers (547k subs, 30 videos), scopes upload + readonly | Nothing. |
| 5 | **LinkedIn** urn:li:person:yWP7me7dep | OK (userinfo answered). Token to 2026-12-16 | Nothing. Carousels (PDF) and video posts already supported. |
| 6 | **TikTok** @hammadyousuf01 | OK: Chrome session on TikTok Studio upload page | Posting stays through Chrome (API app not reviewed). |
| 7 | **X** @HammadYousufAI | OK: Chrome compose box opens, logged in | Chrome only (no API, paid plans not approved). |
| 8 | **ManyChat** (fb5064597) | Logged in, but **Free plan limit hit** (25 active contacts banner) and still bound to @with.hammad | Owner decision: Essential trial/plan, or stay free. Then connect @withhammad.ai as the channel. Every keyword DM lives here. |
| 9 | **withhammad.com** (withhammad-rebuild on Vercel) | OK: /resources answers 200; write path verified; `pr.host_instagram_media` hosts reels/covers at withhammad.com/media | Nothing. |
| 10 | **GitHub** (gh as withhammad) | OK: logged in; pipeline repo + site repo reachable | Keep: commit and push every change. |
| 11 | **HeyGen** | Logged in (Browser 1, hammadbhat1234@gmail.com); 9 looks; ElevenLabs voice 46d4ae… | Credits page not reachable from the settings URL; read the balance from the Home credit badge before each batch. The `heygen` MCP needs `/mcp` auth for API runs; Chrome AI Studio works now. |
| 12 | Scheduler (`app.publish_reel run-due`) | Code green: 558 tests pass; one failing test is `schedule.json` carrying two reels on 2026-10-21 and 2026-10-26 (data from the 3-a-day change, not code) | Re-key the queue by (date, slot_index) when the new slots land. |

Both consents done 2026-10-31: automated Instagram and YouTube posting is unblocked.

## 2. What happens when a link is pasted

```
link (Instagram / YouTube / LinkedIn / TikTok / X / GitHub repo)
  -> intake        studio/run_local.sh: download, transcript, frames, facts, reference_cover
  -> breakdown     reference-breakdown workflow: scenes, beats, claims verified, spec.md (EXACT visuals rule)
  -> script        same beats, reworded, facts corrected; keyword + resource slug chosen
  -> avatar        HeyGen: ONE take, 720p, approved voice; avatar on screen only where the reference shows a
                   face (credit rule: motion beats are HyperFrames, never avatar)
  -> edit          video-intake -> tighten -> reel-skills pack + HyperFrames, same logos/backgrounds/animations
  -> check         video-check, lipsync filmstrip, contact sheet -> sent to the owner
  -> covers        click-first cover sheet; seo-pack
  -> website       on withhammad.com (GitHub PR -> Vercel), three things per reel:
                   1. resource page /resources/<slug> (the DM link; gated: "follow first" card, then the link)
                   2. blog post /blog/<slug> (src/content/blog-posts/<slug>.ts): the reel's lesson as a 600-900 word
                      SEO article, the keyword and tool names in the title/H2s, FAQ block, links to the resource page
                   3. the reel itself embedded on both pages as an animated preview (final_social.mp4 hosted at
                      withhammad.com/media/reels/<slug>.mp4, autoplay muted loop) plus a "Watch on Instagram" link
  -> OWNER OK      nothing goes out before an explicit OK on the sheet + final.mp4
  -> queue         app.publish_reel queue: slot per platform from slots.json (analytics-picked)
  -> post          run-due at each slot: YouTube (API), Instagram @withhammad.ai + Collab @with.hammad,
                   @hammadagentic.ai (API), LinkedIn (API), Facebook Page, TikTok + X (Chrome)
  -> automation    ManyChat keyword DM on the Instagram post, pinned comment, follow-up checklist
  -> record        docs/videos/<date>-<slug>.md, published.json, git commit + push
```

Avatar-credit rule: the avatar take covers only the lines the reference delivers to camera. Every mock-up, card,
counter or screen is a HyperFrames/reel-skills unit over a still or a 2x screen recording. Target: under 60 s of
avatar per reel.

## 3. Cadence (owner 2026-10-31)

| Per day | Instagram @withhammad.ai | LinkedIn | YouTube | TikTok | X | Facebook Page |
|---|---|---|---|---|---|---|
| Reels | ≥ 2 (slots 1-2; a 3rd when ready) | 3 | Shorts: every reel | every reel | every reel | every reel |
| Carousel | 1 | 1 | - | - | - | - |
| Text posts | - | 2 | - | - | 2 (short) | 1 |
| Newsletter | - | 1 (LinkedIn article/newsletter) | - | - | - | - |
| Weekly | - | - | **1 full video** (long, 16:9) | - | - | - |

Slots come from docs/BEST_TIMES_3PERDAY.md / studio/app/slots.json (own analytics; next review 2026-11-03). Gaps to
build: LinkedIn text posts and newsletter publishers (API supports posts; newsletter articles are Chrome-only),
Facebook Page publisher, and a weekly long-video lane in the queue.

## 3b. MCPs and integrations: what is connected

| MCP / integration | State 2026-10-31 | Use |
|---|---|---|
| heygen (project .mcp.json) | configured, **needs `/mcp` auth** | API renders instead of Chrome AI Studio |
| metricool, meta-ads (global) | configured, **need `/mcp` auth** | cross-platform analytics; Meta ad account act_2983053245405014 |
| gmail | failed to connect today (DNS) | newsletter sends later |
| YouTube | direct API (OAuth files in work/.secrets), no MCP; Analytics API reachable with the same consent once renewed | Shorts/long upload, thumbnails, per-video stats for slot picks |
| Instagram | Instagram Login API, no MCP; insights scope still missing (PENDING #24) | posting, Collabs, reach/plays once the scope is granted |
| LinkedIn | direct API | posts, video, carousel PDFs |
| TikTok, X, ManyChat | Chrome sessions only | posting; ManyChat keyword DMs |
| GitHub (gh) | connected | pipeline repo + site repo (withhammad-rebuild), PR -> Vercel deploy |
| Google Analytics / Search Console for withhammad.com | **not connected** | needed for the blog SEO loop |

So: not everything is connected yet. Owner steps: `/mcp` to authorise heygen, metricool and meta-ads; the two OAuth
consents in section 1; GA4/Search Console access for the site.

## 3c. Funnel on the website

Viewer taps the reel's link (or the ManyChat DM link) -> withhammad.com/resources/<slug> -> a card shows the reel playing
and asks to follow @withhammad.ai first (follow button to the profile) -> the resource link/download sits under it ->
the blog post for the same topic is linked for search traffic. Following is a request, never a technical gate
(Instagram policy), so the link is on the same page below the follow card.

## 4. Order of work

1. ~~Instagram consent (#1) and YouTube consent (#4)~~ done 2026-10-31. Owner: ManyChat plan decision (#8).
2. ~~`app.instagram_tokens status`; dry-run with both Collabs~~ done. Agent: Facebook Page token check.
3. Agent: add `linkedin_post`, `linkedin_newsletter` (Chrome), `facebook_reel` lanes and the weekly `youtube_long` lane to
   publish_reel; add the blog-post + reel-embed steps to the resource-page workflow; re-key schedule.json; commit.
4. Resume the paused Harvey reel (job ffd6572d7c9f) as the first reel through v2; then one reference link a day from the owner.
