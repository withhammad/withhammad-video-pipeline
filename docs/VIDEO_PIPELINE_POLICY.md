# VIDEO PIPELINE MASTER POLICY

This applies to Claude Code and Codex. Read it in full before any video task.

The owner set this policy on 2026-11-17. It is the single source of truth for HeyGen and B-roll use, and it replaces the earlier
`docs/HEYGEN_CREDIT_POLICY.md` and `docs/HEYGEN_LONGFORM_POLICY.md`, which now point here. Only a direct instruction
from the owner in the current request can override a rule, and only for that one video.

**Paths:** the owner's `/assets/...` and `/input/voice/` live under `studio/.local/`, which is gitignored. This repo is public, and media must never be committed.
| Owner path | Repo path |
|---|---|
| `/assets/avatar/` | `studio/.local/assets/avatar/` (script-hash cache in `cache/`) |
| `/assets/stock/` | `studio/.local/assets/stock/` |
| `/assets/broll/<project>/` | `studio/.local/assets/broll/<project>/` |
| `/input/voice/` | `studio/.local/input/voice/` |
| `heygen_credits.log`, `broll_usage.log` | `studio/.local/heygen_credits.log`, `studio/.local/broll_usage.log` |

The checks below are in `tools/heygen_credits.py` (run `python3 tools/heygen_credits.py` with no arguments for usage).

## 0. Overview
The pipeline makes two kinds of video:
- **Reels:** 30–60 second vertical videos (9:16).
- **Long videos:** 10–60 minute tutorials and walkthroughs (16:9).

Tools: HeyGen (avatar only), Google Flow / Veo (AI B-roll) and FFmpeg (all assembly).
Hard budget: the HeyGen plan has **2,000 credits per month**. Google Flow has its own separate credits. Track the two separately.

## 1. HeyGen avatar rules (every avatar render)
- **Model:** "Avatar 6 Turbo" only. Never Avatar 6 Pro, Avatar V, Avatar IV Video Look or Video Agent.
- **Resolution:** 1080p only. Never 2K or 4K.
- **Look:** Photo Look when available, since it is cheaper than Video Look.
- **Render once:** fix the script first, then render a single time. Never re-render for typos.
- **No extras:** no HeyGen B-roll, AI images, translation or voice change unless the owner asks.

Cost reference, in credits per minute:
| Model | Resolution | Credits / minute | Allowed |
|---|---|---|---|
| Avatar 6 Turbo | 1080p | 20 | yes |
| Avatar 6 Turbo | 2K | 35 | no |
| Avatar 6 Pro | 1080p | 40 | no |
| Avatar 6 Pro | 2K | 58 | no |

## 2. Reel structure (30–60 s)
- Never render the whole reel as one avatar video.
- Avatar clips only: an intro of 5–8 s, plus an optional mid clip of 5–8 s. Total avatar time stays under 15 s.
- The rest of the reel is stock footage from `assets/stock/`, Google Flow B-roll or screen recording, with voiceover.
- Target: under 5 HeyGen credits per reel. Check: `heygen_credits.py reel <intro_s> [mid_s]`.

## 3. Long video structure (10–60 min)
1. **INTRO:** avatar, 45–60 s. Reuse `assets/avatar/intro_master.mp4` if the script is unchanged.
2. **BODY:** screen recording plus voiceover only, no avatar. This is 85–90% of the video.
3. **FACE CUTS:** avatar clips of 15–20 s at section changes, at most 5 per video.
4. **OUTRO:** avatar, 20–30 s. Reuse `assets/avatar/outro_master.mp4` if the script is unchanged.

Total avatar time per long video: at most 4 minutes (about 80 credits). Check: `heygen_credits.py longform intro=50 cut=18 outro=25`.

## 4. Voiceover
- **Default:** the owner's own recorded voice from `input/voice/` (0 credits).
- **Fallback:** the HeyGen professional voice clone (text-to-speech). Report its credit cost before generating.
- It is always his voice. Never macOS `say`, Flow's voice or a generic TTS.

## 5. B-roll: Google Flow (replaces Higgsfield)
- Use Google Flow (Veo) for all AI-generated B-roll. Don't use Higgsfield unless the owner asks for it.
- Check `assets/broll/` first and reuse matching clips (`heygen_credits.py broll-find <words>`). Generate only when nothing matches.
- Clip length 5–8 s. Aspect ratio 9:16 for reels, 16:9 for long videos.
- Prompt style: one shot per prompt, written as a camera direction (subject, action, camera movement, lighting, mood). No text, logos or faces.
- One take per shot. Regenerate only for visible artifacts or a clear mismatch with the prompt.
- Budget: at most **10 shots per reel and 25 per long video**. Beyond that, STOP and ask (`heygen_credits.py broll-plan <project> reel|long <shots>`).
- Save clips as `assets/broll/<project>/<shot>_<description>.mp4`, with the prompt in a matching `.txt` file.

## 6. Google Flow automation (no public API)
- Drive Flow with browser automation (Claude in Chrome / the session's Chrome tools) in the owner's logged-in **main** Chrome profile. The flow MCP's own profile is signed out.
- Never enter passwords or handle the login yourself. If Flow is logged out, STOP and ask the owner to log in.
- For each shot: open Flow, select Veo, set the aspect ratio, paste the prompt, generate, wait for it to finish, download, rename, then move it to `assets/broll/<project>/`.
- Wait for each generation to finish before starting the next. Never queue more than 2 at once.
- If the Flow UI changes or an element isn't found, STOP and report it instead of guessing.

## 7. Caching and reuse
- Before any HeyGen render, hash the script. If `assets/avatar/` has a clip with the same hash, reuse it: `heygen_credits.py cache <script.txt>`. Store new renders with `cache <script.txt> <clip.mp4>`.
- Keep `intro_master` and `outro_master` as permanent assets. Re-render them only when the owner gives a new script.

## 8. Assembly (FFmpeg only)
- Stitch the avatar clips, screen recording, B-roll and voiceover locally with FFmpeg.
- Never assemble a full video inside HeyGen or Google Flow.
- Normalize audio levels across all sources. Export 1080p, H.264, 30 fps: reels 9:16, long videos 16:9.

## 9. Before every render (both tools)
- Print a plan: each avatar clip with its seconds and credit estimate (seconds ÷ 60 × 20), plus each Flow shot with its prompt.
- If the HeyGen estimate is over 40 credits for a reel or over 80 for a long video, STOP and ask.
- If the monthly HeyGen total would pass 1,800, warn the owner first.

## 10. After every render
- Append to `heygen_credits.log`: date, project, clip, seconds, model, resolution, credits (`heygen_credits.py log <clip> <s> [credits] --project <p>`).
- Append to `broll_usage.log`: date, project, shot, seconds, tool (`heygen_credits.py broll-log <project> <shot> <s> [tool]`).
- Print both running monthly totals (`heygen_credits.py totals`).

## 11. Reference-based requests
When the owner shares a reference video, copy its pacing, section structure and intro/outro style, but always apply every rule above.

## 12. Overrides
Only a direct instruction from the owner in the current request can override a rule, and only for that one video.
