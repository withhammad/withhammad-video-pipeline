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
| tiktok-keyword-replies | TikTok @withhammad | Chrome routine, `app.linkedin_keyword --platform tiktok` | 40 7-23 |

X and TikTok have no free comment API (X Basic is $100/month, TikTok comments are partner-only), so both run in the
owner's logged-in Chrome like LinkedIn. Prompts for the Chrome routines are in this folder.

## Posting TikTok + X (Chrome, no free API)

`tiktok` / `x` entries in the repost queue are scheduled ahead natively in TikTok Studio and X through Chrome, then
recorded with `python -m app.repost_queue mark <id> <url> --scheduled`. Recipe: [chrome-schedule.md](chrome-schedule.md).

## Posting Instagram, Facebook, LinkedIn, YouTube (launchd, no AI model)

Since 2026-11-05 the repost queue is posted by macOS launchd, not by a Claude scheduled task: on 3-5 Nov the task's
model hit its usage limit and every slot after 10:00 failed. `~/Library/LaunchAgents/com.withhammad.repost-run-due.plist`
runs `studio/run_due.sh` at :03 every hour 09-21 GST (it also fires after the Mac wakes). The script takes a lock,
runs `app.repost_queue run-due --live`, logs to `work/logs/run-due.log`, and commits + pushes the queue after any post.
Instagram reels wait 2 h after their slot for an in-app post with a trending sound (`app.repost_queue sounds`).
The Claude task `repost-queue-run-due` now only verifies posts and refreshes the dashboard.

    launchctl print gui/$(id -u)/com.withhammad.repost-run-due | grep -E "state|runs|last exit"
    launchctl kickstart gui/$(id -u)/com.withhammad.repost-run-due      # run now
    launchctl bootout gui/$(id -u)/com.withhammad.repost-run-due        # stop it
