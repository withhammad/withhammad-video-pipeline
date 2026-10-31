# Keyword-reply routines (own bots, no ManyChat)

Desktop-app scheduled tasks (Scheduled section in the sidebar). Each one reads comments on the owner's recent posts
and answers keyword comments with the resource link. Rules: `src/content/dm-rules.json` in the site clone, edited with
`python -m app.dm_rules add`. Dedupe state: `studio/.local/<platform>-keyword-state.json`.

| Task id | Platform | How | Schedule (local) |
|---|---|---|---|
| (webhook, no task) | Instagram @withhammad.ai + Facebook Page | withhammad.com/api/instagram/webhook | real time |
| linkedin-keyword-replies | LinkedIn | Chrome routine, `app.linkedin_keyword --platform linkedin` | */30 7-23 |
| youtube-keyword-replies | YouTube | `app.youtube_keyword run` (Data API) | 15,45 7-23 |
| x-keyword-replies | X @HammadYousufAI | Chrome routine, `app.linkedin_keyword --platform x` | 10 7-23 |
| tiktok-keyword-replies | TikTok @hammadyousuf01 | Chrome routine, `app.linkedin_keyword --platform tiktok` | 40 7-23 |

X and TikTok have no free comment API (X Basic is $100/month, TikTok comments are partner-only), so both run in the
owner's logged-in Chrome like LinkedIn. Prompts for the Chrome routines are in this folder.
