# Pending inputs — live checklist

The one place to answer "what's pending". Update it whenever an item moves.
Last update: 2026-10-17 21:00 (first real reel: lesson done, HeyGen render waiting on the accent choice). Previously: 2026-10-17 20:15 (lesson stage runs inside Claude Code; first real lesson produced; avatar render waits on HeyGen).

| # | Item | Status | Who | How to finish |
|---|------|--------|-----|---------------|
| 1 | Instagram @hammadagentic.ai token | **Done 2026-10-17** — MEDIA_CREATOR, token to 2026-12-16 | — | Refresh before expiry with `instagram_oauth.py --account hammadagentic.ai`. |
| 2 | Instagram @with.hammad token | Not started | Owner + agent | Same flow: `python3 instagram_oauth.py --account with.hammad --force-reauth`, log in as @with.hammad, Allow. |
| 3 | TikTok user authorization | App created, not authorized | Agent, then owner consent | Build `tiktok_oauth.py` (Login Kit, scopes `user.info.basic`, `video.publish`); owner approves consent in Chrome. Public posting also needs TikTok app review (policy URLs + demo). |
| 4 | HeyGen connection | **Switched to HeyGen's official MCP (OAuth, no API key)** — `.mcp.json` added 2026-10-17 | Owner (one-time) | Restart Claude Code in this folder, approve the `heygen` MCP server, and complete the HeyGen sign-in that opens in the browser. Uses existing HeyGen plan credits — no separate API billing (per heygen-com/skills README). The API-key path (`studio/set_secret.sh HEYGEN_API_KEY`) stays as a fallback for unattended runs. |
| 5 | HeyGen look choice | Default wired: the look named "Hammad Yousuf" (black blazer) | Owner | To change: set `STUDIO_HEYGEN_LOOK_ID` in studio.env from `heygen-looks`. |
| 6 | HeyGen voice check | Voice exists (cloned) | Owner | Listen once in HeyGen → Avatar → Voice; confirm it sounds right. |
| 7 | Website write path | Scoped, not wired | Agent | `withhammad-next` is Next.js + Payload on a Hostinger VPS, deployed by GitHub Actions rsync (currently `if: false`). Resource pages go under `app/(frontend)/tools/`. Needs: enable the deploy workflow or document the manual deploy. |
| 8 | ManyChat Public API | Blocked by plan | Owner decision | Requires a paid plan upgrade. Owner has not approved extra paid plans. Alternative: manual keyword setup in the ManyChat UI per post. |
| 9 | DNS for studio.withhammad.com | Parked — owner decided 2026-10-17 to run via Claude Code locally, not on the server | Owner | Add an A record `studio` → `200.234.43.132` at the DNS provider. Then the agent appends `studio/deploy/Caddyfile.snippet` to the VPS Caddyfile and reloads Caddy; HTTPS is automatic. Until then the UI is reachable only via SSH tunnel: `ssh -L 8080:127.0.0.1:8080 amos-vps` → http://localhost:8080 (credentials in `work/.secrets/studio.env`). |
| 10 | Groq API key (free) | Not set — `~/.config/watch/.env` has an empty line | Owner | Get a free key at console.groq.com and add `GROQ_API_KEY=…` to `work/.secrets/studio.env`. Without it transcription uses local faster-whisper (works, slower). |
| 11 | Instagram cookie file for downloads | Not set | Owner (one Terminal command) | Instagram and YouTube refuse anonymous downloads. In your own Terminal (not via the agent — Chrome's folder is TCC-protected): `cd ~/withhammad-video-pipeline/studio && .venv/bin/yt-dlp --cookies-from-browser chrome --cookies ../work/.secrets/instagram-cookies.txt --skip-download 'https://www.instagram.com/reel/C9pXJ0zyPWf/'`. Prefer a secondary Instagram account's Chrome profile. |
| 12 | Anthropic API key | **Not needed** (owner decision 2026-10-17) | — | The Claude Code session writes the lesson itself (agent mode). `STUDIO_LESSON_MODE=api` + key only if the pipeline must run unattended. |
| 13 | HeyGen voice accent | **Blocking the first render** | Owner | Avatar V requires a regional accent for the cloned voice (choices include United States, UK, Australia, Canada, India; no Pakistan). Pick one; it is then saved as the default. |
| 14 | First reference video | Not provided | Owner | Send one URL; `pipeline.py enqueue --reference <url>` creates the job. |

## Verified and working

- Instagram @hammadagentic.ai: Instagram Login API, scopes basic + content_publish, token valid to 2026-12-16. Publish not yet tested.

- LinkedIn: personal profile `urn:li:person:yWP7me7dep`, scopes openid/profile/w_member_social, token valid to 2026-12-16. Publish not yet tested.
- YouTube: channel UCJtrEDGg1R3kNe7t7PQFiEw, readonly + upload scopes, refresh token stored. Publish not yet tested.
- First real reel (2026-10-17): job `09a9d211fff0` (Nick Saraev reel on REA) → verified, original lesson 'Reverse-engineer a feature with Claude Code, the right way', keyword BLUEPRINT, 157 words ≈ 72 s; script loaded in HeyGen (720p portrait, black-blazer look).
- First real lesson (2026-10-17): job `dae18cbf0d11` ('Me at the zoo') → original lesson 'Your first video only has to exist', keyword FIRST, 7 segments, 136 words ≈ 63 s, captions ×5, resource page with 3 prompts — written in the Claude Code session, schema-validated by the pipeline.
- Studio S4 (2026-10-17): avatar stage against HeyGen API v3 (`POST /v3/videos` type avatar, 9:16 1080p, SRT captions, idempotency key, resume from a persisted video_id). `rerun <job> --from <stage>` resumes jobs without re-downloading. 32 tests green; live render pending the HeyGen key.
- Studio S3 (2026-10-17): lesson stage — Opus 5.5, adaptive thinking, effort high, schema-constrained JSON (script segments, captions ×5, resource page, ManyChat keyword, sources checked), web search for claim verification, server-side refusal fallback. 22 tests green; live run pending the API key.
- Studio S2 (2026-10-17): intake (yt-dlp + ffmpeg) and transcription (Groq → local faster-whisper fallback) proven locally on a real YouTube clip via `studio/run_local.sh run <url>`. 15 tests green.
- Studio S1 (2026-10-17): FastAPI API/UI + worker in Docker on `amos-vps` at `/opt/withhammad-studio`, bound to 127.0.0.1:8080, health OK, intake stage verified end-to-end. Deploy with `studio/deploy/deploy.sh`.
- GitHub: public repo `withhammad/withhammad-video-pipeline`, every change committed and pushed.

## Security notes

- The YouTube OAuth *client secret* (desktop-app type, low sensitivity) was displayed once in an
  agent tool output on 2026-10-17. Rotate it in Google Cloud Console → Credentials when convenient,
  then re-run `youtube_oauth.py`.
