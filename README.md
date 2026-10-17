# WithHammad Video Pipeline

Daily AI-teaching short videos, produced once and adapted for five destinations:
Instagram (@with.hammad, @hammadagentic.ai), YouTube, TikTok and LinkedIn — each with a
companion resource page on withhammad.com and a ManyChat keyword follow-up.

Target: 2–3 original videos per day. Everything is driven by direct platform APIs; no
third-party scheduler sits in the publishing path.

## Layout

```
studio/                       the self-hosted app (FastAPI + worker + SQLite, Docker Compose) — see docs/PLAN_APP.md
outputs/video-pipeline/
  pipeline.py                 intake + readiness checker (status / enqueue)
  config.json                 connection state for every destination (no secrets)
  mcp.mjs                     local MCP server "withhammad-direct" (read-only identity checks)
  youtube_oauth.py            one-shot Google OAuth via Chrome
  instagram_oauth_finish.py   completes an Instagram Login redirect already open in Chrome
  linkedin_status.py          live LinkedIn identity check
  WORKFLOW.txt                the 8-step production flow
work/.secrets/                OAuth tokens and client secrets (git-ignored, chmod 600)
```

## Quick start

```bash
cd outputs/video-pipeline
python3 pipeline.py status                                   # what is still blocked
python3 pipeline.py enqueue --reference 'https://…'          # create a job for a reference video
python3 linkedin_status.py                                   # live LinkedIn check
```

## Status

See `outputs/video-pipeline/config.json` for the live connection state and
`WORKFLOW.txt` for the production sequence. Run `pipeline.py status` for current blockers.

## Rules

- Secrets never enter `config.json`, queue files, commits or chat. They live in `work/.secrets/`.
- Verify account identity before any write; retry only failed destinations, never duplicate a
  successful post.
- Every change is committed and pushed; the GitHub history is the project log.
- Metricool is read-only reference, never a publishing path. No additional paid plans.
