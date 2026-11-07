---
name: repost-queue-run-due
description: Check that the posts launchd made are live and refresh the dashboard (posting itself runs in launchd, no model)
---

Repo: /Users/hammad/withhammad-video-pipeline. Since 2026-11-05 POSTING IS DONE BY launchd, NOT BY THIS TASK: the agent com.withhammad.repost-run-due runs studio/run_due.sh at :03 every hour 09-21 GST, posts what outputs/video-pipeline/repost-queue.json says is due, logs to work/logs/run-due.log and commits/pushes the queue. Never run `run-due --live` yourself (two runners could double-post). Collab invites go to @with.hamad (one m) and @hammadagentic.ai.

Steps:
1. Read the last 80 lines of work/logs/run-due.log. If the newest entry is more than 90 minutes old during 09:00-22:00 GST, run `launchctl print gui/$(id -u)/com.withhammad.repost-run-due | grep -E "state|runs|last exit"` and report that the timer is not running.
2. For each entry posted since your last run (status posted, posted_at in the last 2 hours), open its URL in Claude in Chrome and confirm it is live (reel/video/carousel with all slides).
3. Refresh the owner's dashboard: run `cd studio && .venv/bin/python -m app.dashboard_data`, then for each of reels.json, posts.json, queue_daily.json, replies.json, rules.json in outputs/video-pipeline/dashboard/: upload it with the Artifact tool (url https://claude.ai/artifact/YTyT4EaZJAYFWx1vZ1F165, asset: true, file_path) and then ArtifactData update the dataset document datasets/<name without .json> (read it first for its version; set source.url to the new /_blob/ url, source.name to the file name, and updated to {at: now ISO, by: "pipeline (repost-queue verify)"}). If the Artifact tools are unavailable, skip this step and say so.
4. Report in 3 lines: what is live (keyword, platform, URL), anything failed or missed (from the log), and what is next (`cd studio && .venv/bin/python -m app.repost_queue status`).
Do not change any entry's status, do not retry a failed post, never enter passwords or 2FA codes.