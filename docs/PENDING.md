# Pending inputs — live checklist

The one place to answer "what's pending". Update it whenever an item moves.
Last update: 2026-10-17 15:40 (Instagram secondary connected).

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
| 9 | First reference video | Not provided | Owner | Send one URL; `pipeline.py enqueue --reference <url>` creates the job. |

## Verified and working

- Instagram @hammadagentic.ai: Instagram Login API, scopes basic + content_publish, token valid to 2026-12-16. Publish not yet tested.

- LinkedIn: personal profile `urn:li:person:yWP7me7dep`, scopes openid/profile/w_member_social, token valid to 2026-12-16. Publish not yet tested.
- YouTube: channel UCJtrEDGg1R3kNe7t7PQFiEw, readonly + upload scopes, refresh token stored. Publish not yet tested.
- GitHub: public repo `withhammad/withhammad-video-pipeline`, every change committed and pushed.

## Security notes

- The YouTube OAuth *client secret* (desktop-app type, low sensitivity) was displayed once in an
  agent tool output on 2026-10-17. Rotate it in Google Cloud Console → Credentials when convenient,
  then re-run `youtube_oauth.py`.
