# Video: "Reverse-engineer any feature with Claude Code" (keyword BLUEPRINT)

Job `09a9d211fff0` · reference reel: instagram.com/reel/DecMXypvoMF (Nick Saraev, style only) · status: **awaiting owner approval**

## The file
| | |
|---|---|
| Master | `studio/.local/jobs/09a9d211fff0/final.mp4` — 720×1280, 25 fps, 22.8 s, H.264/AAC, −13.9 LUFS, −1.2 dBTP, 0 clipped samples |
| Instagram/Facebook export | `final_ig.mp4` — no B-frames, no edit lists, AAC 128 kbps, pts start 0 (A/V in sync) |
| Subtitles | `captions.srt` — 9 cues, ≥0.8 s each, ≤2×42 chars |
| Cover | frame 0 (title + chips + card are on screen from the first frame) |
| Avatar | HeyGen Avatar V, look "Smiling person in black shirt", voice Hammad Yousuf (Excited, expressiveness 0.8, speed 1.1×), custom motion on |
| Edit | Remotion composition `Reel` + HyperFrames title insert; 10 scenes, 8 word-timed highlights; original procedural music bed "glow" (no licensed samples) + 3 whooshes, pop, riser |

## Spoken script (≈23 s)
Your Claude Code can now take apart an app on your computer, and show you exactly how any feature works! It's called REA. Free. Open source. Point it at a desktop app, a website, or an Android app you're allowed to inspect, and it traces every single step, from your click to the final output. Then it helps you rebuild that feature in your own product. Comment Blueprint, and I'll send you the link!

## Facts checked (primary sources)
- REA is open source under MIT — github.com/morluto/rea · install `npx rea-agents setup` (README)
- Targets: native/desktop, Electron, websites, Android APKs, .NET … no iOS (README table)
- Use only on software you own or are authorized to examine — DISCLAIMER.md
- Node ≥ 22.19 required (README)

## Per-platform details
| Platform | Account | How it gets posted | Title / caption | Disclosure |
|---|---|---|---|---|
| YouTube Shorts | HAMMAD YOUSUF (@with.hammad, UCJtrEDGg1R3kNe7t7PQFiEw) | API, ready (dry run passed) | Title: *Reverse-engineer any feature with Claude Code (the right way) #Shorts*; description = lesson.captions.youtube_description; category Science & Technology; tags claudecode, aitools, opensource, reverseengineering, buildinpublic; SRT uploaded | `containsSyntheticMedia: true` + line in description |
| LinkedIn | Hammad Yousuf (urn:li:person:yWP7me7dep) | API, ready (dry run passed) | lesson.captions.linkedin | text line |
| Instagram Reels | **@with.hammad** (where ManyChat is connected) | Owner's Chrome (instagram.com upload) — API for @with.hammad not authorized yet; @hammadagentic.ai API needs a public video URL | lesson.captions.instagram | "AI info" label on the post + caption line; account-level AI label recommended (docs/FUNNEL.md) |
| TikTok | @hammadyousuf01 | Owner's Chrome (tiktok.com upload) — API app unaudited (private-only) | lesson.captions.tiktok | "AI-generated content" toggle + caption line |
| Facebook Reels | owner's Page (to confirm) | Owner's Chrome (Page → Reel) | Instagram caption | "AI info" label |

CTA routing: Instagram uses the ManyChat comment→DM funnel (docs/FUNNEL.md). YouTube, LinkedIn, TikTok and Facebook have no ManyChat, so their caption should carry the resource page link directly once it is live (comment-keyword replies there would be manual).

## Resource page (link sent in the DM)
`withhammad.com/tools/reverse-engineer-features-with-claude-code` — lesson.resource_page (setup steps, 3 prompts, links, responsible-use note). Not built yet: needs a page in `withhammad-next` and a deploy.

## Open decisions (owner)
1. Approve this cut (or list changes).
2. Platforms + visibility (e.g. YouTube public vs unlisted first).
3. ManyChat: upgrade to Essential ($17/mo, 14-day trial) — Free has ~9 DMs left this month.
4. OK to publish the resource page on withhammad.com.
