# ManyChat and REA teardown

Date: 2026-11-11. Status: research record for the PostPilot design (`DESIGN.md` in this folder).

## 0. How to read this

- Everything here comes from public pages: ManyChat's help centre, pricing page, blog and community forum, and the official developer documentation of Meta, Google, TikTok, LinkedIn and X. No ManyChat account was used and no ManyChat software was analysed.
- Statements are paraphrased, not quoted. Each carries a reliability tag:
  **[O]** official ManyChat page, **[M]** community moderator, **[U]** ordinary community member, **[P]** platform owner's developer docs.
- A second pass re-read the main claims. Where that pass corrected or doubted a claim, this document follows the correction and says so.
- Not re-checked in the second pass, so treat as unverified: WhatsApp and Telegram details, ManyChat's data model and public API, the Icon AI builder, legacy pricing, Facebook Page trigger details, and ManyChat's blog statements about YouTube, LinkedIn and X.
- The study reports reached this document partly cut off (the end of the REA risk table, the end of the ManyChat comparison table, and the tail of both fact-checks). Nothing below was filled in from guesswork; gaps are named in section 6.

## 1. REA (Reverse Engineer Anything)

### 1.1 What it is

- An MIT-licensed local toolkit from GitHub user `morluto` (`github.com/morluto/rea`, npm package `rea-agents`, site `rea.tools`). Studied read-only at commit `69630c03`; nothing from it was installed, built or run.
- One Node.js program that is both a command-line tool (`rea`) and an MCP server (about 170 tools in 18 families), plus an agent skill that tells the agent which tool to call.
- It collects evidence about shipped software: binaries, Electron and JavaScript apps, Android packages, and web pages through Chrome's DevTools protocol. It does not generate an app. The agent writes code afterwards from the evidence.

### 1.2 How it works

1. The agent connects to the `rea` MCP server or runs the CLI.
2. The first tool is chosen by target type (JavaScript tree, APK, native binary, open browser page, saved network capture).
3. Each call returns a summary; the full result is kept as an evidence record and paged on demand.
4. One question is traced at a time (a string, a route, an API, a module).
5. Runtime observation is used only when static reading cannot answer.
6. Every conclusion is recorded as observed, inferred or unknown.
7. The agent builds with normal coding tools and exports an evidence bundle.

For a website the steps are: a person starts Chrome with a debugging port and a throwaway profile; REA lists the open pages; it passively records page structure, scripts, network metadata and storage key names; it can statically parse the page's scripts for routes and endpoints; it can drive a browser through declared actions with Playwright; it can read saved HAR files and compare static endpoints against observed traffic.

### 1.3 What it cannot show for ManyChat

Comment-to-DM, keyword matching and the follow check run on ManyChat's servers against Meta's API. They are in no public page or script, so no browser-side tool can reveal them. The most REA could add is passive observation of public marketing and help pages, which a person reading those pages already gets.

### 1.4 Why REA was not run against ManyChat

1. **It will not start on this Mac.** Installed Node versions are 22.23.1 and 24.18.0. REA requires 22.23.4+, 24.22.1+ or 26.12.1+ and exits otherwise (read from its `scripts/lib/runtime-admission.mjs`).
2. **ManyChat's public sites refuse non-browser clients.** `manychat.com` and `help.manychat.com` answered HTTP 403 with a Cloudflare challenge to command-line fetches. No attempt was made to get past it.
3. **ManyChat's Acceptable Use Policy appears to prohibit reverse engineering its software.** This was seen only as a search-engine snippet of `manychat.com/legal/aup`; the page itself could not be opened. The owner should read it before anyone analyses ManyChat's JavaScript.

**Consequence, stated plainly:** PostPilot is not a copy of ManyChat's code. It is designed from Meta's and Google's official API documentation plus ManyChat's public help pages. REA contributed its working discipline (separate what was observed from what was inferred, keep a list of unknowns), which this folder follows.

### 1.5 If REA is ever used later

Use it only on our own software or software we are authorised to examine. Rules taken from REA's own documentation:

- `rea setup` writes to the global Claude Code configuration, so it needs the owner's explicit yes. Prefer CLI-only use or a project-local registration, with a pinned version.
- Do not use the pipe-to-shell installer; REA's docs say it verifies no signature.
- Install with scripts disabled (the package allows a native install script for Frida).
- REA has no approval gate of its own; Claude Code's permission prompts are the only gate. Do not allowlist all `rea` tools.
- Active browser scenarios carry the session's cookies and can change state. Run them only against our own test instance, never a logged-in third-party page.
- The debugging port gives full access to a browser profile: throwaway profile, loopback only, never on the VPS.
- Evidence files can contain application secrets; keep them out of git.

## 2. ManyChat: what it does

### 2.1 Channels

- Comment-to-DM exists on **Instagram** and **Facebook Pages** only. [O]
- **TikTok** in ManyChat starts only when the viewer sends a DM first. A comment trigger is partly rolled out to accounts in Vietnam, Thailand and Indonesia, decided by TikTok (ManyChat staff, 20 Nov 2025). ManyChat's US TikTok availability (early November 2025, staff-confirmed 20 Nov 2025) covers the DM integration only, not comment triggers. EU and UK accounts cannot connect. [O, staff]
- **YouTube, LinkedIn and X are not ManyChat channels.** [O for the channel list; M for YouTube and LinkedIn]
- WhatsApp and Telegram have keyword triggers on incoming messages but no comment trigger. (Not re-checked.)

### 2.2 Instagram comment automation

- **Post scope:** one named post, all posts, or the next post. [O]
- **Next post is single-use.** Only one next-post automation can run at a time, and a new one must be set up after it fires. [O] Whether next-post needs a paid plan is not stated in today's help pages or pricing table; an older moderator statement that it was Pro-only is likely outdated and is not relied on.
- **Keywords:** an include list, an exclude list, or any comment. Keywords are comma-separated; words without commas are one phrase. The official guide advises adding common misspellings. [O]
- **Matching:** official text says only that the comment must include the word. Substring behaviour (a keyword firing inside a longer word) and the absence of an exact-match option rest on community posts and a moderator answer, not official text. [M, U] Case handling for comment keywords is not documented.
- **Once per person per post:** only a user's first comment under a post triggers, described as an Instagram-side limit. [O]
- **Public reply:** up to three shuffled texts in the wizard, random rotation in Flow Builder. [O]
- **DM sequence** when everything is on: opening DM, email request, follow request, link message, follow-up if the link was not clicked. [O]
- **First message:** must be the private reply to the comment; one content block; no user-input step, typing delay or dynamic block. A private reply alone opens no messaging window; a typed reply or a tap on a normal or quick-reply button does; a website button does not. [O]
- **Collab posts:** the official article contradicts itself (the body says a collaborator's account works; a callout says only the original publisher's account works). This matters here because reels go out from @withhammad.ai with a Collab. It must be tested on a real Collab post.

### 2.3 The follow check

- ManyChat checks whether the commenter follows the account; a non-follower gets an extra DM asking for the follow before the link. [O]
- In the Quick Automation wizard the follow request is unavailable when the opening DM is off. [O]
- **Correction:** the first study said ManyChat can check the follow only after the viewer taps the opening button. That is true for the wizard only. ManyChat's Flow Builder documents a follow condition placed before any DM. Whether that early check returns reliable data is not stated.
- **Meta's side [P]:** the user-profile endpoint exposes `is_user_follow_business`. Meta documents that it is readable only after the person has sent a message or used an icebreaker or persistent menu; a comment alone gives a consent error. A tap on a quick reply is delivered to the webhook as a message, but no Meta page says it grants profile consent. **A typed reply is the only documented safe trigger.**
- The follower check is not in ManyChat's Free plan; it starts at Essential. [O]
- Reported weaknesses, community only: the follow status can lag after the follow, and the condition has returned false for real followers. [U, M]
- ManyChat's default follow-prompt wording is not in public docs.
- No follow gate is documented for Facebook.

### 2.4 The gap ManyChat leaves (why a session was needed for every upload)

- ManyChat does not attach an automation to each new post by itself. The choices are one named post, all posts (one keyword and one link for the whole account), or the single-use next post. [O, confirmed]
- Keyword and destination link are typed by hand per automation; nothing reads them from the caption. [M]
- ManyChat creates no web page for a post; the link is whatever the user pastes. [O]
- The statements that the public API cannot create triggers, and that the AI builder only makes drafts, were not re-checked. They do not change the design.

PostPilot closes exactly this gap: detect the new post, read the keyword from the caption, create the page, write the rule.

### 2.5 Pricing (manychat.com/pricing, read 2026-11-11, USD, tax excluded) [O, confirmed]

| Plan | Monthly | Annual, per month | Active contacts per month | Follow check |
|---|---|---|---|---|
| Free | 0 | - | 25 | no |
| Essential | 17 | 14 | 250 | yes |
| Pro | 39 | 29 | 2,500 | yes |
| Business | 99 | 69 | 7,500 | yes |
| Advanced | 199 | 139 | 25,000 | yes |

- Free is limited to 4 live automations (the plan card says 4 live triggers; the two are not the same unit).
- Extra contacts are billed per contact; an overage cap can be set.

## 3. Platform limits any own-built service inherits [P]

### Instagram

- No webhook reports a new post. New posts are found by polling the account's media list.
- Comments arrive by webhook (`comments` field). Meta's webhook page requires a Live app, a public account, and Advanced Access for comment notifications.
- One private reply per comment, within 7 days of the comment. Further messages only after the person responds, within 24 hours of that response.
- The private reply lands in the Inbox for followers and in Requests for everyone else.
- 750 private replies per hour per account for posts and reels.
- Message text is limited to 1,000 bytes.
- Buttons or quick replies inside the private reply are neither documented nor forbidden.
- Tokens last 60 days and must be refreshed. The account must have "Allow access to messages" on.
- The messages permission is needed for follow-up messages and the profile lookup in every login variant.

### Facebook Pages

- The Page `feed` webhook reports new posts and new comments. Whether it fires for Reels is not documented (the item list names `video`, not `reel`).
- One Messenger private reply per comment within 7 days; it cannot be sent to another Page; buttons are allowed.
- No follow check exists.
- A 750-per-hour limit for Facebook comments is not stated in so many words (the line in Meta's page names Instagram posts and reels).
- A webhook that fails for an hour gets the app unsubscribed.

### Access level on Meta (the largest open question)

- Meta's docs conflict. One overview page says Standard Access is enough for an app that only serves your own account. The webhook setup page lists Advanced Access for comment notifications, and the private-replies page says Standard Access apps can only reach people who have a role on the app.
- The fact-check's conclusion, followed here: **plan for App Review plus Business Verification even for the owner's own accounts, and treat a live test with a commenter who has no role on the app as the possible shortcut.**
- Serving other creators always needs Advanced Access. Adding creators as app testers is not a legitimate route (testers must be employees or under agreement).

### YouTube

- A new upload can be detected by push notification or by polling. Comments have no webhook; they are polled (1 quota unit per call).
- A public reply costs 50 units. The default quota is 10,000 units a day per project, shared by all connected channels, so fewer than 200 replies a day.
- No private message exists. The subscriber check fails for private subscriptions.
- YouTube's developer policy forbids API clients from offering incentives for subscribing or commenting. A "subscribe to get the link" gate through the API conflicts with it.
- A Google OAuth app in Testing status issues refresh tokens that expire after 7 days.

### TikTok

- **Correction:** the first study said DMing a commenter is prohibited. TikTok's Business API has an official Comment-to-Message feature, but only for accounts registered in Vietnam, Indonesia and Thailand, and TikTok chooses the comments itself (no keyword trigger). For a UAE account the answer is still no.
- An official comment API exists (TikTok API for Business, Accounts API: comment webhook, list, reply), gated by an access application form since 20 March 2026.
- No follower-check endpoint exists.

### LinkedIn

- Company Pages only, through the vetted Community Management API, which is open to registered legal entities.
- **Correction:** replying as a member is not an open route that happens to fail. The Comments API lists a restricted scope for it. The 403 recorded in this project on 2026-10-31 is the expected result.
- Automated DMs are not allowed. No follow check.

### X

- No free tier; pay per use.
- A reply through the API is allowed only when the other person mentioned or quoted the account. DMs only after the user DMs first.
- X states that browser automation leads to permanent suspension.

## 4. What exists in this project today (code audit, 2026-11-11)

- Instagram and Facebook replies run in one Vercel function on withhammad.com. De-duplication is an in-memory set; there is no delivery log; errors are swallowed, so a failed send is lost.
- YouTube, LinkedIn, X and TikTok replies run only while the Claude desktop app is open.
- 48 rules are compiled into the website build; all are account-wide; matching is exact whole word, case-insensitive. 12 more rules and their pages sit on unmerged website branches.
- REFERRAL is posted on six platforms with no live rule, and its guide page returns 404.
- A real Instagram comment-to-link delivery has never been captured as evidence.
- Nothing detects a hand-uploaded post, and nothing derives a keyword from a caption, although every caption follows the "Comment KEYWORD" pattern.

## 5. ManyChat capability against PostPilot

| Capability | ManyChat | PostPilot |
|---|---|---|
| Attach automation to every new post | manual (named post, all posts, or single-use next post) | automatic: poll for new posts, read the keyword from the caption |
| Destination page | pasted by hand | created automatically |
| Keyword matching | "includes"; no exact match | exact whole word, case-insensitive (today's behaviour); no fuzzy matching |
| Public reply | up to 3 shuffled | rotating variants |
| Follow gate (Instagram) | after the opening DM in the wizard | after the commenter replies in the DM (the only documented trigger) |
| Once per person per post | yes | yes, stored in the database |
| Facebook | private reply, no follow gate | same |
| YouTube | not supported | public reply with the link, no gate |
| TikTok, LinkedIn, X | DM-only or not supported | no official always-on route today; see DESIGN.md section 3 |
| Other creators | hosted product | needs Meta App Review and Business Verification |

## 6. Unknowns to settle by test

1. Does Meta deliver comment webhooks and allow private replies for a commenter with no role on the app, at Standard Access?
2. Can an Instagram private reply carry a quick reply, and does a tap arrive as an event and unlock the follow lookup?
3. Do comments on a Collab reel reach the webhook of the publishing account?
4. Does the Page `feed` webhook fire for Reels?
5. Which Instagram account ID do webhook payloads carry (the own-comment guard depends on it)?
6. Is the Google OAuth app in Testing status (the weekly YouTube re-consent suggests so)?

Gaps in the source reports: the full URL list behind the ManyChat study's source keys, the end of REA's risk table, and the tail of both fact-checks did not reach this document.

## 7. Sources

ManyChat (opened as ordinary public pages):
- https://help.manychat.com/en/articles/17742037-quick-automation-auto-dm-links-from-comments
- https://help.manychat.com/en/articles/17742050-quick-automation-grow-followers-from-comments
- https://help.manychat.com/en/articles/17741897-instagram-post-and-reel-comments-trigger
- https://help.manychat.com/en/articles/17741969-instagram-live-comments-trigger
- https://help.manychat.com/en/articles/17742044-set-up-your-first-tiktok-automation-in-manychat-user-sends-a-message
- https://help.manychat.com/en/articles/17742062-use-cases-and-strategies-for-tiktok-automations-on-manychat
- https://manychat.com/pricing
- https://manychat.com/product/tiktok
- https://manychat.com/blog/instagram-quick-automation-comment-to-dm-guide/
- https://community.manychat.com/general-q-a-43/new-us-update-7804
- https://community.manychat.com/general-q-a-43/ask-for-follow-before-link-sending-not-working-9634
- https://community.manychat.com/general-q-a-43/instagram-comment-trigger-exact-match-for-thanks-in-manychat-9037
- https://community.manychat.com/general-q-a-43/how-to-automate-for-a-scheduled-or-upcoming-instragram-post-4329

Meta (base https://developers.facebook.com):
- /documentation/instagram-platform/overview
- /documentation/instagram-platform/webhooks/setup and /webhooks/fields
- /documentation/instagram-platform/private-replies
- /documentation/instagram-platform/comment-moderation
- /documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/user-profile
- /documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api/quick-replies
- /documentation/instagram-platform/app-review
- /documentation/business-messaging/messenger-platform/discovery/private-replies
- /documentation/business-messaging/messenger-platform/webhooks
- /documentation/pages-api/webhooks-for-pages
- /documentation/development/build-and-test/app-roles

Google:
- https://developers.google.com/youtube/v3/docs/commentThreads/list
- https://developers.google.com/youtube/v3/docs/comments/insert
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.google.com/youtube/v3/guides/push_notifications
- https://developers.google.com/youtube/terms/developer-policies
- https://support.google.com/cloud/answer/15549945

TikTok, LinkedIn, X:
- https://business-api.tiktok.com/portal/docs?id=1843697551083522 (Comment-to-Message)
- https://business-api.tiktok.com/portal/docs?id=1810515104773122 (comment webhook)
- https://business-api.tiktok.com/portal/docs?id=1737944384433218 (Accounts API access)
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/comments-api
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review
- https://docs.x.com/developer-guidelines
- https://docs.x.com/x-api/getting-started/pricing

REA:
- https://github.com/morluto/rea (commit `69630c03`, read-only)
