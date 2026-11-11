# PostPilot design

Date: 2026-11-11. Status: design for review; nothing is built or deployed yet.
Companion: `TEARDOWN.md` in this folder (research and sources).

PostPilot is an always-on service on the Hostinger VPS. The owner uploads a post by hand. PostPilot notices it, reads the keyword from the caption, creates the page on the website, and answers every viewer who comments the keyword, with no Claude Code session open.

**What this design rests on.** Meta's and Google's official API documentation and ManyChat's public help pages. ManyChat's software was not reverse-engineered: REA will not start on this Mac without a newer Node, ManyChat's sites refuse non-browser clients, and its Acceptable Use Policy appears to prohibit reverse engineering. See `TEARDOWN.md` section 1.

## 1. Goals and non-goals

### Goals

1. The owner's only job is to upload. Everything after that is automatic for Instagram, Facebook and YouTube.
2. Each new post gets its keyword rule and its website page without a person or a model session.
3. A viewer who comments the keyword gets the link. On Instagram the follow is asked for and checked first.
4. Nobody receives the same message twice, including during the move from today's setup.
5. Other creators' accounts can be connected later without a redesign (multi-tenant from the first table).
6. It fits beside the existing containers on a 1 vCPU / 3.8 GB box and disturbs none of them.
7. Free and open-source tools only.

### Non-goals

- Publishing or scheduling posts. Uploading stays manual.
- A visual flow builder, email capture, broadcasts or sequences.
- Fuzzy keyword matching. The code audit showed it would misfire on today's keywords ("still" to SKILL, "notion" to MOTION).
- Any route a platform forbids: browser automation on the VPS, DMs to TikTok or X commenters, a "subscribe to get the link" gate on YouTube.
- Copying ManyChat's code or interface.

## 2. What is automatic, restricted or impossible

Verified against official docs on 2026-11-11. "Restricted" means it works only under a condition named in the row.

| Platform | Detect new post | Receive comments | Public reply | Private message with link | Follow check | Always-on on the VPS |
|---|---|---|---|---|---|---|
| Instagram | polling only (no webhook exists) | webhook | yes | one private reply per comment within 7 days; more only after the person replies, within 24 h | only after the commenter sends a message | **yes** |
| Facebook Page | webhook (Reels unconfirmed; polling as backup) | webhook | yes | one Messenger private reply within 7 days; not to other Pages | none exists | **yes** |
| YouTube | push or polling | polling only | yes (50 quota units each) | does not exist | unreliable; gating is against policy | **yes**, public reply only |
| TikTok | polling | Accounts API, after an access application is approved | same approval | not for a UAE account (official feature is limited to Vietnam, Indonesia, Thailand) | none exists | **not yet** |
| LinkedIn personal profile | no | no | restricted scope; 403 today | not allowed | none | **no official route** |
| LinkedIn Company Page | polling, vetted API | vetted webhook | vetted | not allowed | none | only for a registered legal entity |
| X | paid event or polling | paid event | only when the viewer mentioned the account | only after the viewer DMs first | yes, paid | **only with a paid API and a changed call to action** |

### How the gaps are covered honestly

- **Instagram follow check.** It cannot happen when the comment arrives. The private reply asks for the follow and asks the viewer to answer in the DM; the check runs on that answer. A typed reply is the only trigger Meta documents; a button tap is tested in Phase 0 and used only if it works.
- **Facebook.** No follow check exists, so the link goes out in the private reply with a request to follow the Page.
- **YouTube.** The link goes in a public reply. The text may invite a subscribe but never makes it a condition.
- **TikTok, LinkedIn, X.** No official always-on route exists today. Until Phase 4 they stay on the current Claude tasks on the Mac, unchanged. Phase 4 offers the legitimate options: the TikTok Accounts API application, a different call to action ("link in bio" or "DM me the word"), and paid X API only if the owner approves the cost. PostPilot will not run browser automation against these sites from the server; LinkedIn's user agreement forbids it and X states it leads to permanent suspension.
- **Meta access level.** Meta's docs conflict on whether an app at Standard Access can serve commenters who have no role on the app, even on the owner's own account. Phase 0 tests it. If the test fails, App Review plus Business Verification is needed before Instagram and Facebook work for the public at all, and that is owner-gated.

## 3. Architecture

```
            Instagram / Facebook                     YouTube
                    |  webhooks (signed)                 ^
                    v                                    | polling
 Internet --> intake-relay-caddy (existing, ports 80/443)|
                    |  Docker network intake-relay_default
                    v                                    |
        +------------------------+           +-------------------------+
        | postpilot-api          |           | postpilot-worker        |
        | FastAPI, 1 process     |           | 1 process, asyncio      |
        | - GET/POST /webhooks/* |           | - job loop (outbox)     |
        | - /r/<slug>, /api/...  |           | - pollers: IG media,    |
        | - /healthz, /readyz    |           |   FB feed, YT uploads,  |
        | stores the raw event   |           |   YT comments           |
        | and its job in one     |           | - token refresh         |
        | transaction, answers   |           | - backfill, pruning,    |
        | 200                    |           |   nightly backup        |
        +-----------+------------+           +------------+------------+
                    |                                     |
                    +------> SQLite (WAL) on a volume <---+
                             /opt/postpilot/data/postpilot.db

 Outbound from the worker: graph.instagram.com, graph.facebook.com,
 googleapis.com, and the website (page publish + check for HTTP 200).
```

- Two containers from one image. Neither publishes a port. Only the existing Caddy faces the internet.
- The API does almost nothing per request: verify the signature, write one row, answer. All sending happens in the worker, so a slow Meta call never delays a webhook answer.
- The database is one file. The API and the worker are the only two writers; WAL mode with a busy timeout handles that.

## 4. Stack and why it fits this box

| Layer | Choice | Reason |
|---|---|---|
| Language | Python 3.12 | Already the language of the pipeline repo and of `studio-api` on this box |
| Web | FastAPI + uvicorn, one worker process | Same as `studio-api`; webhook traffic is a few requests a minute |
| HTTP client | httpx | Already used |
| Database | SQLite in WAL mode | One file, no server process, enough for one box with two writers |
| Queue | An `outbox` table in the same database | The event and its job are stored in one transaction, so nothing is lost between them |
| Worker | One asyncio process | Jobs are network waits, not CPU |
| Token encryption | `cryptography` (AES-256-GCM) | Free, standard |
| Tests | pytest | Already used |
| Edge | The existing `intake-relay-caddy` | Owns 80/443; a second proxy is impossible and unnecessary |

**Memory.** About 90 MB for the API and 110 MB for the worker in steady state. Caps: `mem_limit` 192m each. Total about 300 MB on a box with roughly 3.1 GB free.

**Rejected.** Postgres (200 to 300 MB and a second thing to back up, for a load one file handles), Redis (a second datastore with no atomic link to events), Node (a second runtime; the reusable code is Python). A separate study recommended Node plus Postgres; the verified state of this box and the reusable Python modules decide against it. SQLite is revisited only if more than about 50 tenants connect or the worker must run on a second machine.

**Reused from the pipeline repo.**
- `studio/app/dm_rules.py` (rule format) and the 48-rule `dm-rules.json` as the import.
- `studio/app/youtube_keyword.py` (already runs headless: token refresh, thread listing, reply).
- `linkedin_keyword.match()` as the matcher, extended to honour post scope.
- The Instagram token refresh call.
- `repost_queue.page_live()` (a rule goes live only after its page answers 200).
- The website's nine signed-webhook fixtures as the migration test oracle.

**Deployment convention** (matches what is on the box):
- Folder `/opt/postpilot`, own `docker-compose.yml` with `name: postpilot`, joining the external network `intake-relay_default`.
- Caddy: first deployment adds one `handle_path /postpilot/*` route inside the existing `desk.withhammad.com` block. A dedicated subdomain later gets its own site block. Each change: copy the Caddyfile to a dated backup, validate, then `docker exec intake-relay-caddy caddy reload --config /etc/caddy/Caddyfile`.
- Nothing else on the box is touched: not `intake-relay`, `studio-api`, `studio-worker`, or the four `amos-*-bridge` services.
- The image is built on the Mac or in GitHub Actions and pulled; nothing is compiled on the server.

## 5. Data model

Every table carries `tenant_id`. Times are UTC.

| Table | Purpose | Key columns |
|---|---|---|
| `tenants` | One creator or business | id, name, status |
| `accounts` | One connected platform account | tenant_id, platform, external_id, alt_external_ids, handle, status, last_polled_at |
| `credentials` | Encrypted tokens | account_id, kind, ciphertext, nonce, key_id, expires_at, refreshed_at |
| `posts` | Every post seen | account_id, platform_post_id, permalink, caption, published_at, keyword, resource_id, state (`new`, `no_keyword`, `page_pending`, `live`, `error`) |
| `resources` | One website page | tenant_id, slug, title, body, source (`imported`, `pack`, `auto`), url, state (`draft`, `published`), unique (tenant_id, slug) |
| `rules` | Keyword to link | tenant_id, keyword, resource_id or link, dm_text, reply_variants, scope (`account` or `post`), post_id, enabled, unique (tenant_id, keyword, scope, post_id) |
| `events` | Every inbound webhook or polled comment, raw | account_id, platform, external_event_id, kind, payload, received_at, unique (platform, external_event_id) |
| `contacts` | A viewer on one platform | account_id, platform_user_id, username, last_message_at |
| `gates` | Pending follow asks | contact_id, rule_id, post_id, asked_at, checks, state (`asked`, `passed`, `expired`) |
| `deliveries` | What was sent, once | rule_id, post_id, contact_id, step (`private_reply`, `public_reply`, `link`), state (`claimed`, `sent`, `failed`, `skipped`), platform_message_id, error, unique (account_id, rule_id, post_id, contact_id, step) |
| `outbox` | Jobs | kind, payload, run_after, attempts, state, locked_until, idempotency_key (unique) |
| `legacy_handled` | Keys answered by the old systems | platform, legacy_key, unique |
| `cursors` | Poller positions and counters | account_id, name, value |
| `audit_log` | Rule and settings changes | actor, action, before, after |

Raw `events.payload` is pruned after 30 days. `deliveries` is kept.

## 6. The automatic pipeline

### 6.1 New post detected

| Platform | How | Interval |
|---|---|---|
| Instagram | poll the account's media list | every 3 minutes |
| Facebook | Page `feed` webhook, plus a poll of the Page feed as backup because Reels are unconfirmed | webhook; poll every 5 minutes |
| YouTube | poll the channel's uploads playlist (1 quota unit); push notifications can replace it later | every 5 minutes |

A post ID not yet in `posts` is inserted with state `new`. The unique key makes a repeat sighting a no-op.

### 6.2 Keyword from the caption

- Pattern: the word "comment" (any case), optionally followed by "the word", then one token of 2 to 15 capital letters or digits, optionally in quotes. Examples that match: `Comment ROBOT`, `comment "K2"`, `Comment the word JOBS`.
- The token must be written in capitals in the caption. This keeps "comment below" and "comment your answer" from matching.
- A short stop list is rejected anyway (BELOW, HERE, NOW, YES, YOUR, THIS, DOWN).
- First match wins. On YouTube the title is searched first, then the description.
- **No keyword found:** the post is stored as `no_keyword` and nothing is created. Account-wide rules still answer comments under it.
- **Keyword already has a rule:** the post is attached to that rule and its page. This is the normal case when the same reel goes up on three platforms.
- **Keyword is new:** a resource and a rule are created (next two steps).

### 6.3 Resource page

1. Slug: from the keyword and the post date, unique per tenant.
2. Content, in this order of preference:
   - a **pack** registered ahead of time for that keyword (title, body and links; the pipeline already produces this as `lesson.json` for pipeline-made reels, and a small CLI or API call registers it);
   - otherwise an **auto page** built from a template: title from the first caption line, the caption text, the embedded post, and any links found in the caption.
3. Publishing route: see open decision 1. The recommended route needs one website change, once: a data-driven `/resources/[slug]` page on withhammad.com that reads published resources from PostPilot's public JSON endpoint. After that, a new page needs no commit, merge or deploy. Existing hand-built pages keep priority over the dynamic route.
4. The worker requests the page URL until it answers 200 (reusing `page_live()`), then marks the resource `published`.

Honest limit: with no model in the loop, an auto page is only as good as the caption. A registered pack gives a full page. Optional enrichment by transcript and a model is Phase 5 and is the owner's decision.

### 6.4 Rule goes live

The rule is enabled only after the page answers 200. Until then, a matching comment is stored and its job waits (up to 30 minutes, then an alert). No viewer is ever sent a dead link.

### 6.5 Comment arrives

1. **Receive.** Instagram and Facebook: the webhook handler checks `X-Hub-Signature-256` against the app secret (Instagram events with the Instagram app secret, Page events with the parent app secret), inserts the raw event and an outbox job in one transaction, and answers 200. A duplicate event ID is ignored by the unique key. YouTube: the comment poller inserts events the same way.
2. **Ignore own comments.** The comparison uses every known ID of the account (Instagram has an app-scoped ID and a professional ID; both are stored).
3. **Match.** Exact whole word, case-insensitive, as today. Precedence: a rule scoped to this post, then the account-wide rule. No fuzzy matching.
4. **Once per person per post.** The worker inserts the `deliveries` row for (account, rule, post, contact, step). If the insert conflicts, the job ends. It also checks `legacy_handled`.
5. **Send**, by platform (next section).
6. **Public reply** is posted only after the private message succeeded. Today's Facebook code posts "Sent you a DM" even when the DM failed; that is fixed. Reply text rotates between variants.

### 6.6 What is sent

**Instagram (follow gate).**
1. Private reply to the comment: asks the viewer to follow, then to answer in the DM by sending the keyword (or tapping "I followed" if Phase 0 proves the tap works). No link yet. A `gates` row is opened.
2. The viewer's message arrives by webhook. The worker reads `is_user_follow_business`.
   - `true`: send the link message, close the gate.
   - `false`: send "not seeing the follow yet" once per viewer message; the viewer can try again. Each viewer message reopens the 24-hour window.
   - API error or missing field: retry three times over about 30 seconds (the follow status can lag and the endpoint has returned HTTP 500). If it still fails, see open decision 3.
3. A gate older than 7 days is closed as `expired`.
4. A viewer who sends the keyword directly in a DM goes straight to step 2.

**Facebook.** One Messenger private reply carrying the link and a request to follow the Page. A keyword sent in Messenger gets the link.

**YouTube.** One public reply with the link. A daily cap of 150 replies keeps the project inside its quota; comments above the cap wait for the next day and raise an alert.

### 6.7 De-duplication, in one place

| Layer | Guarantee |
|---|---|
| `events` unique (platform, external_event_id) | A redelivered webhook or a re-polled comment is stored once |
| `deliveries` unique key | One private reply, one public reply and one link per person per post per rule |
| `outbox.idempotency_key` | A job is queued once |
| Claim before send | The `deliveries` row is written as `claimed` before the API call and `sent` after. A job found `claimed` after a crash is not blindly resent |
| Platform backstop | Meta accepts only one private reply per comment, so a repeated private reply is refused by Meta itself |
| YouTube thread check | Before replying, the worker reads the thread's replies and skips if the channel already answered |
| `legacy_handled` | Keys answered by the old systems are never answered again |

Crash rule: private replies and YouTube replies are safe to retry (the platform or the thread check stops a second one). A link DM found in `claimed` state is retried once only after checking the conversation for the sent message; otherwise it is marked `failed` and alerted. The choice is at-most-once for link DMs: a missed link can be recovered when the viewer writes again; a duplicate cannot be recalled.

### 6.8 Pacing and limits

- Private replies: at most 600 per hour per account (Meta allows 750).
- A random delay of 5 to 20 seconds before the first reply to a comment.
- Retries with backoff for HTTP 5xx and rate-limit answers; a permanent error (closed DMs, deleted comment) is recorded and not retried.
- A comment older than 7 days gets no private reply.

## 7. Multi-tenant model

- Every row belongs to a tenant. The owner is tenant 1. Nothing in the code may hold a hard-coded handle, Page ID, channel ID or member URN (the audit lists five to remove).
- Each account has its own encrypted tokens, its own poll cursors and its own rate budget.
- Connecting an account is an OAuth flow on PostPilot's public URL: Instagram Login for Instagram (no Page needed), Facebook Login for a Page, Google OAuth for YouTube.
- Where a tenant's pages live is per tenant: on their own website through the same JSON endpoint, or on a PostPilot-hosted page.

### What it takes before another creator can connect

| Platform | Requirement | Who |
|---|---|---|
| Instagram and Facebook | Advanced Access for each permission: App Review (a screencast per permission, a privacy policy, a working call) and Business Verification of the business behind the app | Owner (documents and submission) |
| YouTube | Google OAuth app published to production and verified for the sensitive scope; unverified apps are limited to 100 users; the 10,000-unit daily quota is shared by all channels, so a quota increase needs a compliance audit | Owner (submission) |
| TikTok | Accounts API access application; app review | Owner |
| LinkedIn | A registered legal entity for the Community Management API; Company Pages only | Owner |

Adding other creators as app testers is not a legitimate shortcut: Meta requires testers to be employees or people acting on the owner's behalf under agreement.

The code is multi-tenant from Phase 1. Opening it to others is Phase 3 and waits on these reviews.

## 8. Migration with a no-duplicate guarantee

### What exists today

- Instagram and Facebook: the Vercel route `withhammad.com/api/instagram/webhook`, with rules compiled into the site.
- YouTube, LinkedIn, X, TikTok: four Claude scheduled tasks on the Mac, with state files in `studio/.local/`.

### Step by step

**A. Import (no effect on live traffic).**
1. Import the 48 rules from `dm-rules.json`, and the 12 rules from the unmerged website branches, as account-wide rules with their existing links. Seven rules have no `{link}` placeholder and one carries two links; the importer keeps their text as is.
2. Import the YouTube, LinkedIn and TikTok state files into `legacy_handled`.
3. Import known posts from the repost queue and the `publish_*.json` files.

**B. Shadow mode.** PostPilot runs with sending switched off (`POSTPILOT_SEND=off`). It polls posts and comments on all three platforms and records the decision it would have made. For a week of comments, its decisions are compared with what the old systems actually replied (visible as the account's own replies). The nine signed fixtures must give identical decisions. Cutover does not start until the comparison is clean.

**C. Instagram and Facebook cutover.** Meta sends each event to exactly one callback URL per webhook product, so the two systems can never both receive the same event.
1. PostPilot is live at its public URL with sending still off; the verify-token handshake is proven with a manual GET.
2. The callback URL is changed for both the Instagram webhook product and the app-level Page subscription, in the same sitting.
3. Wait five minutes. Events now arrive at PostPilot and are stored, not answered. The Vercel route finishes anything it had in flight.
4. Backfill: list comments from the last 7 days on recent posts. Every comment that already has the account's own reply is written to `legacy_handled`.
5. Switch sending on. Stored events from the gap are processed; anything in `legacy_handled` is skipped.
6. Backstop if anything above is wrong: Meta refuses a second private reply to the same comment.
7. The Vercel route stays deployed but receives nothing. It is removed by a later website change.

Rollback: switch sending off, point both callbacks back to the Vercel URL. The same backfill logic is not available on Vercel, so rollback is only for the first hour and only if PostPilot has sent nothing wrong.

**D. YouTube cutover.**
1. Disable the Claude task `youtube-keyword-replies`.
2. Copy `youtube-keyword-state.json` and import it.
3. Start the PostPilot comment poller. The thread check (section 6.7) covers any reply the import missed.

**E. LinkedIn, X, TikTok.** Unchanged in Phases 1 to 3. Their Claude tasks keep running against their own state files; PostPilot does not touch those platforms, so no duplicate is possible.

**F. Loose ends found by the audit.**
- REFERRAL is fixed first: its page and rule are created in PostPilot during the import so the 404 ends.
- The website's privacy policy says automation events are not stored in a database. That becomes false at cutover and must be updated in the same week.

## 9. Security

- **Secrets.** Only in `/opt/postpilot/.env` (mode 600, root-owned) on the server and `work/.secrets/` on the Mac. Never in git, logs, chat or this document. Random values (encryption key, admin token) are generated on the server and never echoed.
- **Tokens at rest.** AES-256-GCM with a random nonce per value, the tenant and account IDs bound in as associated data, and a key ID stored for rotation. A stolen database file holds only ciphertext.
- **Webhooks.** Signature checked with a constant-time compare before anything is parsed; unsigned requests get 401. Body size capped at 2 MB in Caddy.
- **Containers.** Non-root user, read-only root filesystem, all capabilities dropped, `no-new-privileges`, no published ports, memory caps.
- **Admin surface.** Phase 1 has no web dashboard. Administration is a CLI run with `docker exec`, plus read-only JSON endpoints behind a bearer token. A login-protected dashboard comes in Phase 2.
- **Logs.** JSON to stdout with Docker's size-capped driver. Tokens, verify tokens and OAuth codes are redacted. Message text is logged by ID, not content.
- **Untrusted input.** Captions, comments and usernames are data. They are never executed, never used as instructions, and are escaped on every page.
- **Token refresh.** The Instagram token (60 days; the current one expires 2026-12-30) is refreshed automatically when it has fewer than 15 days left. `/readyz` fails if any token is within 7 days of expiry.
- **Data deletion.** An endpoint and a CLI command delete a contact's rows on request, as Meta's review requires.
- **Server hardening.** `sshd` on this box still allows password login and root login. Changing that is a recommendation for the owner (open decision 5), not something done silently on a production machine.
- **Backups.** Nightly `sqlite3 .backup` to a dated file on the box, 14 kept; Hostinger's weekly VPS backup as a second layer. An off-box copy is open decision 6. The encryption key is not inside the database, so it must be kept with the Mac's secrets or a restore is useless.

## 10. Phased build plan

"Evidence" means files captured by the builder and stored under `outputs/postpilot/evidence/<phase>/`: HTTP responses, database read-backs, log excerpts, screenshots.

### Phase 0: proofs that decide the design (no production change)

| Test | Why it matters |
|---|---|
| A comment from an account with **no role on the Meta app**, on Instagram and on the Page, against today's Vercel route | Decides whether App Review is needed before anything works for the public |
| Quick-reply tap: does it arrive as an event, and does it unlock the follow lookup | Decides the follow-gate wording |
| Which Instagram account ID the webhook payload carries | The own-comment guard depends on it |
| A comment on a Collab reel | ManyChat's docs contradict themselves; ours must be known |
| A comment on a Facebook Reel: does `feed` fire | Decides whether the Page poller is primary or backup |
| Google OAuth app status (Testing or production) | Explains the weekly YouTube re-consent |

**Done when:** each test has a recorded result, and the first one has produced a captured end-to-end Instagram delivery (comment, private reply, follow check, link). This has never been captured before.
**Evidence:** webhook payloads with IDs masked, API responses, DM screenshots from the test account.

### Phase 1: no Claude Code needed for Instagram, Facebook and YouTube

The smallest thing that meets the owner's main requirement.

Scope:
1. The service skeleton in `postpilot/` in this repo: API, worker, SQLite schema, outbox, encrypted credentials, CLI, tests.
2. Importers for rules, legacy state and known posts.
3. New-post pollers for Instagram, Facebook and YouTube.
4. Keyword derivation from the caption.
5. Automatic resource page (pack or auto template) through the route chosen in open decision 1, with the wait-for-200 check.
6. Webhook receiver for Instagram and Facebook; comment poller for YouTube.
7. Instagram follow gate; Facebook private reply; YouTube public reply.
8. De-duplication and pacing as in section 6.
9. Automatic Instagram token refresh; YouTube refresh-token use on the server.
10. `/healthz` and `/readyz`; nightly local backup.
11. Deployment to `/opt/postpilot` in shadow mode, then the cutover of section 8.

Not in Phase 1: dashboard, other tenants, TikTok, LinkedIn, X, transcription, model-written pages.

**Done when, with the Claude desktop app closed and the Mac asleep:**
- a hand-uploaded Instagram reel whose caption says "Comment WORD" gets a rule and a live page within 10 minutes;
- a comment with that word from a non-role test account gets the follow ask, and after following and replying gets the link;
- the same on the Facebook Page gets the link by Messenger private reply;
- the same on a YouTube upload gets a public reply with the link;
- a second comment by the same person on the same post gets nothing;
- killing the worker mid-queue and restarting it loses nothing and sends nothing twice;
- the old Vercel route received no events for 48 hours, and the YouTube Claude task is disabled;
- the other containers on the box are running exactly as before.

**Evidence:** the `posts`, `rules`, `resources` and `deliveries` rows for each test; HTTP 200 of each page; DM and reply screenshots; `docker stats` showing memory under the caps; `docker ps` before and after; the kill-and-restart log; latency from comment to private reply, measured and reported; pytest output.

### Phase 2: operations and visibility

Scope: login-protected read-only dashboard (posts, rules, deliveries, failures), click counting on links, alerts, external uptime probe, off-box backup with a monthly restore test, privacy-policy update, data-deletion endpoint, runbook in `docs/postpilot/RUNBOOK.md`, YouTube push notifications in place of upload polling, SSH hardening if approved.

**Done when:** a forced failure (worker stopped) produces an alert within 10 minutes; a restore from backup into a scratch file matches row counts; the dashboard shows the last 7 days.
**Evidence:** the alert itself, restore log, dashboard screenshots.

### Phase 3: other creators

Scope: web OAuth connect flows, tenant sign-up, per-tenant page hosting, per-tenant limits, tenant isolation tests, Meta App Review submission material (screencasts, test instructions), Google OAuth verification.

**Done when:** a second, unrelated test tenant connects Instagram and YouTube through the web flow, and no query can return another tenant's rows (tested). Public opening waits for Meta's approval.
**Evidence:** isolation test output, the connect flow recorded, the review submission receipts.

### Phase 4: TikTok, LinkedIn, X, honestly

Scope, each item only with the owner's choice:
- TikTok: submit the Accounts API access application; if approved, comment webhook plus public reply (no DM, no follow check).
- X: either the paid API with a call to action that makes viewers mention the account, or a "DM me the word" call to action, or leave as is.
- LinkedIn personal profile: no official route. Options are a first-comment link on every post, or keeping the Mac-side helper, which then reads rules and writes de-dup records through PostPilot's API so there is one source of truth.

**Done when:** each platform has a recorded decision and either a working official integration with evidence, or a written statement that it stays manual or Mac-side.

### Phase 5 (optional): richer automatic pages

Transcript of the video and a model-written page for posts with no registered pack. Needs a decision on which model and whether any paid usage is acceptable. Transcription on this single core must be capped so it never starves the API.

## 11. Things only the owner can do

SSH needs nothing: the Mac already reaches the server by key, so no key has to be added in hPanel.

| # | Step | When |
|---|---|---|
| 1 | Say yes or no to the four Phase 0 test comments being made from a second Instagram and Facebook account that has no role on the Meta app (he supplies or logs in to that account himself) | Phase 0 |
| 2 | In Google Cloud Console, OAuth consent screen: set the app's publishing status to "In production", then sign in once to re-consent YouTube (his login, his 2FA) | Phase 1, if Phase 0 shows Testing status |
| 3 | Approve one DNS record in hPanel: type A, name as chosen in open decision 2, value `200.234.43.132`. hPanel is open in his Chrome and may be used, so this is a yes, not a task | Before the Meta cutover |
| 4 | Approve the Meta webhook change: in the Meta app dashboard, set the Instagram webhook callback URL and the Page webhook callback URL to the PostPilot URL with the existing verify token. If the dashboard asks for his password or 2FA, he enters it | Phase 1 cutover |
| 5 | Merge one pull request on `withhammad-rebuild` that adds the data-driven `/resources/[slug]` route (website merges are his by standing rule) | Phase 1, if open decision 1 option A is chosen |
| 6 | Merge the privacy-policy update on the website | Phase 2 |
| 7 | Meta Business Verification: upload the business documents in Meta Business settings, and submit App Review | Before Phase 3 goes public, or in Phase 1 if the non-role test fails |
| 8 | Any login, password or 2FA prompt on any platform, whenever one appears | Always |

## 12. Open decisions for the owner

**1. Where automatic pages are published.**
- A. A data-driven `/resources/[slug]` route on withhammad.com that reads from PostPilot. One website merge, once; afterwards no merges. Pages are on his domain and in his sitemap.
- B. PostPilot serves the pages itself on its own subdomain. No website change at all, but the pages are not on the main site and carry less search value.
- C. PostPilot commits each page to the website repository and pushes. Keeps today's static pages, but needs a GitHub write credential on the server and either an owner merge per page or giving up the owner-merge rule.
- **Recommendation: A**, with B as the fallback until the merge lands.

**2. Public address of PostPilot.**
- A. A path on the existing host: `desk.withhammad.com/postpilot/`. No DNS change.
- B. A dedicated subdomain, for example `pilot.withhammad.com`. One A record.
- **Recommendation: A for shadow mode, B before the Meta cutover**, so the webhook URL given to Meta is set once and never changes again.

**3. Follow check that keeps failing with an error (not a "no").**
- A. Send the link anyway after three failed attempts.
- B. Never send without a confirmed follow; ask the viewer to try again later.
- **Recommendation: A.** The error is Meta's, not the viewer's; a "no" still never gets the link.

**4. When there is no pack for a new keyword.**
- A. Publish the auto page from the caption straight away.
- B. Hold the rule and alert the owner until a pack is registered.
- C. Publish the auto page now and replace it when a pack arrives.
- **Recommendation: C.**

**5. SSH hardening on the server** (password login and root login are both still allowed).
- A. Key-only login now, root login by key only; test from a second terminal before closing the first.
- B. Leave as is.
- **Recommendation: A**, done in a planned window because other projects log in as root.

**6. Off-box backup.**
- A. Encrypted nightly copy pulled to the Mac when it is on. Free, but not always-on.
- B. Encrypted nightly copy to a free object-storage tier (Backblaze B2 or Cloudflare R2, 10 GB free). Needs a new account.
- C. Local backups plus Hostinger's weekly backup only.
- **Recommendation: B.**

**7. Alerts.**
- A. ntfy push to his phone (free, open source).
- B. Email through the existing mail setup.
- C. Dashboard only.
- **Recommendation: A.**

**8. TikTok, LinkedIn and X** (Phase 4): the options are listed there. **Recommendation:** apply for the TikTok Accounts API now because approval takes time; keep LinkedIn and X on the Mac-side helper; do not pay for the X API until volume justifies it.

## 13. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Meta requires Advanced Access even for the owner's accounts | Instagram and Facebook answer only people with a role on the app until App Review and Business Verification pass | Phase 0 test first; start Business Verification early |
| Instagram comment-to-link has never been proven end to end | Unknown failure in the live path | Phase 0 captures it before anything is built on it |
| Quick-reply tap not delivered or not counted as consent | Follow gate stalls | Text always asks for a typed reply |
| Follow status lags or the endpoint errors | Real followers refused | Retries; open decision 3 |
| Collab reels do not deliver comment webhooks | Comments on Collab posts unanswered | Phase 0 test; fall back to polling comments on those posts |
| Page `feed` webhook silent for Reels | Facebook Reels missed | Page poller as backup |
| YouTube refresh token expires weekly | YouTube stops every 7 days | Owner step 2; `/readyz` fails on token trouble |
| YouTube quota | Replies stop above about 150 a day | Daily cap, alert, later quota request |
| YouTube incentive policy | API access at risk if the reply gates on subscribing | Reply never makes subscribing a condition |
| Instagram token expiry on 2026-12-30 | Everything stops | Automatic refresh in Phase 1; alert at 7 days |
| Single core | A heavy job slows webhooks | API does no heavy work; worker concurrency capped; no transcription before Phase 5 |
| Shared Caddy | A bad edit takes down `desk.withhammad.com` and the studio | Backup, validate, then reload; one small block |
| Single server, no failover | Outage means missed comments for its duration | Meta retries webhooks for a time; a 7-day comment backfill runs on every start |
| Auto page thin or wrong | Viewers land on a weak page | Packs for pipeline-made reels; open decision 4 |
| A capitalised word after "comment" that is not a keyword | A wrong rule and page | Stop list; post-scoped rules only for new keywords; daily digest of new rules |
| Common-word keywords (EDIT, PROMPT, SKILL) as account-wide rules | Replies to unrelated comments | New rules are post-scoped; existing 48 stay as they are until the owner chooses to narrow them |
| Privacy policy out of date at cutover | Compliance and App Review problem | Update in the same week |
| ManyChat terms | None for this design | No ManyChat software was analysed; only public pages were read |
| TikTok, LinkedIn, X still need the Mac | The "upload only" promise is partial | Stated plainly here; Phase 4 |

## 14. Pending credentials and settings (live checklist)

| Item | Status |
|---|---|
| SSH to the VPS | working, key-based |
| Instagram token for @withhammad.ai | exists; to be copied to the server `.env`; expires 2026-12-30 |
| Facebook Page token | exists |
| Instagram and Facebook app secrets, webhook verify token | exist in `work/.secrets/` |
| YouTube OAuth client and refresh token | exist; weekly expiry to be fixed (owner step 2) |
| PostPilot encryption key and admin token | to be generated on the server |
| DNS record for the subdomain | pending open decision 2 |
| Meta webhook callback change | pending cutover (owner step 4) |
| Website route merge | pending open decision 1 |
| Off-box backup account | pending open decision 6 |
| Meta Business Verification | not started |
| TikTok Accounts API access | not applied |
