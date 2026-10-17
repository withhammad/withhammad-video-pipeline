# Pending inputs — live checklist

The one place to answer "what's pending". Update it whenever an item moves.
Last update: 2026-10-17 18:30 (Studio S3 code done; live run waits on the Anthropic key).

| # | Item | Status | Who | How to finish |
|---|------|--------|-----|---------------|
| 1 | Instagram @hammadagentic.ai token | **Done 2026-10-17** — MEDIA_CREATOR, token to 2026-12-16 | — | Refresh before expiry with `instagram_oauth.py --account hammadagentic.ai`. |
| 2 | Instagram @with.hammad token | Not started | Owner + agent | Same flow: `python3 instagram_oauth.py --account with.hammad --force-reauth`, log in as @with.hammad, Allow. |
| 3 | TikTok user authorization | App created, not authorized | Agent, then owner consent | Build `tiktok_oauth.py` (Login Kit, scopes `user.info.basic`, `video.publish`); owner approves consent in Chrome. Public posting also needs TikTok app review (policy URLs + demo). |
| 4 | HeyGen API key | Not provided | Owner | Put the key in `work/.secrets/heygen-api-key.txt` (HeyGen → Settings → API). Needed to resolve look ids and render videos. |
| 5 | HeyGen look choice | Proposed: "Hammad Yousuf" (black blazer, favourited) | Owner | Say yes or name another look. |
| 6 | HeyGen voice check | Voice exists (cloned) | Owner | Listen once in HeyGen → Avatar → Voice; confirm it sounds right. |
| 7 | Website write path | Scoped, not wired | Agent | `withhammad-next` is Next.js + Payload on a Hostinger VPS, deployed by GitHub Actions rsync (currently `if: false`). Resource pages go under `app/(frontend)/tools/`. Needs: enable the deploy workflow or document the manual deploy. |
| 8 | ManyChat Public API | Blocked by plan | Owner decision | Requires a paid plan upgrade. Owner has not approved extra paid plans. Alternative: manual keyword setup in the ManyChat UI per post. |
| 9 | DNS for studio.withhammad.com | Parked — owner decided 2026-10-17 to run via Claude Code locally, not on the server | Owner | Add an A record `studio` → `200.234.43.132` at the DNS provider. Then the agent appends `studio/deploy/Caddyfile.snippet` to the VPS Caddyfile and reloads Caddy; HTTPS is automatic. Until then the UI is reachable only via SSH tunnel: `ssh -L 8080:127.0.0.1:8080 amos-vps` → http://localhost:8080 (credentials in `work/.secrets/studio.env`). |
| 10 | Groq API key (free) | Not set — `~/.config/watch/.env` has an empty line | Owner | Get a free key at console.groq.com and add `GROQ_API_KEY=…` to `work/.secrets/studio.env`. Without it transcription uses local faster-whisper (works, slower). |
| 11 | Instagram cookie file for downloads | Not set | Owner (one Terminal command) | Instagram and YouTube refuse anonymous downloads. In your own Terminal (not via the agent — Chrome's folder is TCC-protected): `cd ~/withhammad-video-pipeline/studio && .venv/bin/yt-dlp --cookies-from-browser chrome --cookies ../work/.secrets/instagram-cookies.txt --skip-download 'https://www.instagram.com/reel/C9pXJ0zyPWf/'`. Prefer a secondary Instagram account's Chrome profile. |
| 12 | Anthropic API key | **Needed now for S3** | Owner | Add `ANTHROPIC_API_KEY=sk-ant-…` to `work/.secrets/studio.env` (console.anthropic.com → API keys). The lesson stage uses `claude-opus-5-5` at effort `high` with web search; roughly $0.10–0.40 per video at current prices. |
| 13 | First reference video | Not provided | Owner | Send one URL; `pipeline.py enqueue --reference <url>` creates the job. |

## Verified and working

- Instagram @hammadagentic.ai: Instagram Login API, scopes basic + content_publish, token valid to 2026-12-16. Publish not yet tested.

- LinkedIn: personal profile `urn:li:person:yWP7me7dep`, scopes openid/profile/w_member_social, token valid to 2026-12-16. Publish not yet tested.
- YouTube: channel UCJtrEDGg1R3kNe7t7PQFiEw, readonly + upload scopes, refresh token stored. Publish not yet tested.
- Studio S3 (2026-10-17): lesson stage — Opus 5.5, adaptive thinking, effort high, schema-constrained JSON (script segments, captions ×5, resource page, ManyChat keyword, sources checked), web search for claim verification, server-side refusal fallback. 22 tests green; live run pending the API key.
- Studio S2 (2026-10-17): intake (yt-dlp + ffmpeg) and transcription (Groq → local faster-whisper fallback) proven locally on a real YouTube clip via `studio/run_local.sh run <url>`. 15 tests green.
- Studio S1 (2026-10-17): FastAPI API/UI + worker in Docker on `amos-vps` at `/opt/withhammad-studio`, bound to 127.0.0.1:8080, health OK, intake stage verified end-to-end. Deploy with `studio/deploy/deploy.sh`.
- GitHub: public repo `withhammad/withhammad-video-pipeline`, every change committed and pushed.

## Security notes

- The YouTube OAuth *client secret* (desktop-app type, low sensitivity) was displayed once in an
  agent tool output on 2026-10-17. Rotate it in Google Cloud Console → Credentials when convenient,
  then re-run `youtube_oauth.py`.
