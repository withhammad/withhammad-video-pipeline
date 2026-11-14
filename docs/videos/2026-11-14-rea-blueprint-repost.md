# BLUEPRINT re-post (REA + Claude Code), Sat 14 Nov 2026 — job 8672c9af2b8c

The owner posted the finished BLUEPRINT reel himself: https://www.instagram.com/reel/DfuHwiHos2Q/ on **@with.hammad**
(display name "Hammad Yousuf | AI Agents & Claude Code"), with **@withhammad.ai** as an accepted Collab, sound
"Mustafa Saboori • Aura Farming", 2026-11-14 11:42 UTC. His order: do the SEO, push the guide to the website and do the
automation; do not upload it. Nothing was uploaded, scheduled or posted from the pipeline.

It is the same cut as job `09a9d211fff0` (published 17 Oct 2026, docs/videos/2026-10-17-rea-blueprint.md): 22.8 s, HeyGen
AI avatar, same on-screen beats. Comment keyword in his caption: **BLUEPRINT**.

## REA (owner asked for it)
REA 6.9.0 was used read-only (job `analysis/rea.md`, screenshot `analysis/rea_page.png`): `open_binary` refuses MP4
media; `capture_web_screenshot` + `inspect_web_page` on the public page (isolated headless Chromium, logged out) gave the
Collab, the sound, the posting time, the full caption and "no comments yet". The live caption has no hashtags and no
AI-avatar line.

## Facts (re-checked 2026-11-14)
MIT; `npx rea-agents setup`; desktop/Electron, websites, .NET, Android APKs (headless JADX + full JDK), no iOS target;
evidence + stated limits; Node.js 22.x >= 22.23.4, 24.x >= 24.22.1 or 26.12.1+ (was 22.19 / 24.11 / 26+); npm 6.9.0
(was 6.5.0). Job `analysis/facts.md`.

## SEO
Primary keyword **reverse engineer anything** (YouTube autocomplete tree: rea, demo, github, tutorial, setup; top recent
videos "I Tested The Viral Github Repo That Reverse Engineers Anything" 1.8M, "I Tested The Viral Reverse Engineering
Repo" 3.7M); secondary "claude code reverse engineering". Pack: `outputs/rea-blueprint-repost/seo/seo.json`, `seo.md`
and the plain copy-paste `captions.txt` (Instagram edit + alt text, TikTok, YouTube Shorts, LinkedIn 10-3-1, Facebook, X
269/280). All checks pass. YouTube @with.hammad, LinkedIn, TikTok @hammadyousuf01 and the old Facebook profile already
carry this exact video from 17 Oct.

## Website
Guide (existing, same keyword): https://withhammad.com/resources/reverse-engineer-features-with-claude-code — facts
refreshed, "Updated 14 November 2026", dateModified/article:modified_time 2026-11-14, card first on /resources, sitemap
lastmod 2026-11-14, blog post facts fixed; BLUEPRINT rule re-added with `app.dm_rules` in the same commit
(withhammad-rebuild `1e7ecd7`, pushed to main, Vercel "Deployment has completed" 19:04:38 UTC). Live: HTTP 200, one H1,
title 59 chars, JSON-LD Article/HowTo/BreadcrumbList; 390 px and 1280 px without horizontal scroll (local prod build).
GitHub CI "check" fails on `npm run check-prompts` (64 prompt-governance drifts), the same failure as main before this
commit.

## Automation
- Rule: BLUEPRINT -> the guide, any media, in dm-rules.json at the deployed commit. Production webhook: unsigned POST 401,
  signed empty Instagram event 200 `{"ok":true,"comments":0,"messages":0}`, signed empty Page event 200 (19:06 UTC).
  `app.linkedin_keyword match "BLUEPRINT please"` resolves the rule (LinkedIn/X/TikTok routines); YouTube and the
  Facebook Page webhook read the same file.
- **Gap:** comments on THIS post do not reach the bot. The webhook answers for @withhammad.ai only; the reel is owned by
  @with.hammad, which is not in @withhammad.ai's `/me/media`; `collaborative_media` is not available on Instagram
  Login tokens; Meta scopes comment data and webhooks to the media owner; and the @with.hammad token is dead (error 190)
  with only basic + publish scopes. Workaround that works today: DM "BLUEPRINT" to @withhammad.ai. Fix: docs/PENDING.md
  item 29.
- Waiting for the owner's OK (public): editing the live Instagram caption (5 hashtags, AI-avatar line, DM fallback) and
  alt text; the YouTube pinned comment, if he posts the Short again.
