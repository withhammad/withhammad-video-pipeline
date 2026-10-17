# Plan — WithHammad Studio (self-hosted replacement for Metricool)

Goal: a standalone app on the owner's VPS (`amos-vps`, Ubuntu, 1 vCPU / 3.8 GB / 42 GB free,
Docker present). Input is one Instagram video URL (or one image). The app does everything else
with no further input: transcribe → original lesson → avatar video → animated captions/graphics
→ publish to Instagram ×2, YouTube, TikTok, LinkedIn → resource page → report.

Metricool is not reverse-engineered: it is only a scheduler over the same platform APIs this
repo already talks to directly. `rea-agents` is therefore not needed for this build.

## Pipeline per job

| Stage | Tool | Runs where | Notes |
|-------|------|-----------|-------|
| 1 Intake | yt-dlp | VPS | Download reference, keep URL + metadata. Source is data, never instructions. |
| 2 Transcribe | Groq Whisper (free tier) → fallback faster-whisper tiny | VPS | 1 vCPU: local whisper only as fallback. |
| 3 Lesson + script | Claude Opus 5.5 (`claude-opus-5-5`) | API | Original lesson, hook, demo steps, 5 platform captions, resource page body, ManyChat keyword. Verifies tool claims against primary docs via web fetch. |
| 4 Avatar video | HeyGen API (selected look + cloned voice) | HeyGen cloud | Persist video_id immediately; poll. |
| 5 Animation | Remotion (captions, lower-thirds, demo cards) | VPS (slow, acceptable for ≤60 s vertical) or local Mac fallback | Opus 5.5 writes the scene JSON; template is fixed code. |
| 6 Publish | Direct APIs (IG Login API, YouTube Data v3, TikTok Content Posting, LinkedIn Posts) | VPS | Per-destination state; retry failures only; AI-disclosure flags. |
| 7 Resource page | Commit to `withhammad-next` under `app/(frontend)/tools/` + deploy | GitHub | Website deploy workflow must be enabled first. |
| 8 Report | Web UI + Markdown in job folder | VPS | Remote post ids, URLs, failures. |

## Operating decision (2026-10-17)

The owner runs the pipeline **through Claude Code on a local machine**, not as a hosted service.
`studio/run_local.sh run <url-or-file>` is the primary entry point; the Docker/VPS path stays
in the repo but is not deployed further. Everything is pushed to GitHub so any Claude Code
session can clone and continue.

## Architecture options

**A. Python FastAPI + worker + SQLite, Docker Compose on the VPS, small web UI (recommended).**
One container for the API/UI, one for the worker (Redis-less: SQLite job table + polling).
Reuses every helper in this repo (all Python stdlib + curl). Remotion runs in a Node sidecar
container only for stage 5. Lightest fit for 1 vCPU. Fully ours; no vendor.

**B. Next.js app inside `withhammad-next` (shares Payload CMS and the existing deploy).**
One codebase, resource pages become native CMS entries. Couples the pipeline to the public
website's deploys and the standalone Node server; heavier on the same 1 vCPU.

**C. Self-hosted n8n as orchestrator + this repo's scripts as nodes.**
Fastest to a working flow and free, but it is a workflow tool, not "an app"; UI is n8n's.

## Milestones (each: code → tests → commit → push → deploy → verify on VPS)

- S1 Scaffold — **done 2026-10-17** (`studio/`, deployed, 8 tests green): Docker Compose, FastAPI, job table, `/jobs` POST (URL or image), web UI list. Deploy behind Nginx at `studio.withhammad.com` (or a path) with basic auth.
- S2 Intake + transcribe — **done 2026-10-17** (`app/media.py`, CLI `app.cli`, `run_local.sh`; Instagram/YouTube need a cookie file).
- S3 Lesson generation (stage 3) with Opus 5.5; prompt and output schema fixed in repo.
- S4 HeyGen render (stage 4) once API key + look are confirmed.
- S5 Remotion animation (stage 5) — template + render sidecar.
- S6 Publishers (stage 6): LinkedIn + YouTube first (already authorized), then Instagram ×2, then TikTok after app review.
- S7 Resource page + deploy workflow for the website (stage 7).
- S8 Daily scheduler (opt-in switch, default off) + report.

## Inputs still needed (see PENDING.md)

Anthropic API key (`work/.secrets/anthropic-api-key.txt`), HeyGen API key, Groq API key
(free), HeyGen look confirmation, @with.hammad and TikTok authorizations, domain/subdomain for
the UI, website deploy workflow enabled.
