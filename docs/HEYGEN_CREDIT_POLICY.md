# HeyGen Avatar Video — Credit Policy

Owner's rules, added 2026-11-17. They apply to every HeyGen generation in this pipeline, whether it is made in the web app, the `heygen` CLI or the MCP. Only a direct instruction from the owner in the same request can override a rule, and only for that one video.

## Purpose
The pipeline makes short reels with HeyGen. The budget is **2,000 credits per month**.

## Hard rules (must)
- **Model:** use **Avatar 6 Turbo** only. Do NOT use Avatar 6 Pro, Avatar V, Avatar IV Video Look or Video Agent.
- **Resolution:** render at **1080p** only. Do NOT pick 2K or 4K.
- **Look:** when a Photo Look and a Video Look are both available, use the **Photo Look**.
- **Length:** each video is **60 seconds or shorter**. If the script runs longer, shorten the script before rendering.
- **Render once:** never re-render to fix a typo or wording. Fix the script text first, then render one time.
- **No extras:** no AI B-roll, AI image generation, video translation, voice change or any other add-on that costs credits, unless the owner asks for it.

## Avatar segments (biggest saving)
- Do NOT render the full reel as one avatar video.
- Generate ONLY short avatar clips: an **intro (5–8 s)** and, if needed, **one mid-video clip (5–8 s)**. Total avatar time per reel must stay **under 15 seconds**.
- Cover the rest of the reel with stock or edited footage (screen recordings, Blender/3D shots, Flow b-roll), with the voiceover made outside HeyGen.
- Stitch the avatar clips and footage locally with FFmpeg. Never assemble the full video inside HeyGen.
- Cost check: total avatar seconds ÷ 60 × 20 credits. **Target under 5 credits per reel.** Check it with `python3 tools/heygen_credits.py reel <clip1_s> [clip2_s]`.
- The voiceover is still his voice: his cloned voice (ElevenLabs id 46d4ae4996a8476c8227108e3847f401) made outside HeyGen, never a generic TTS.

## Cost reference
| Model | Resolution | Credits / minute | Allowed |
|---|---|---|---|
| Avatar 6 Turbo | 1080p | 20 | yes (reference rate) |
| Avatar 6 Turbo | 2K | 35 | no |
| Avatar 6 Pro | 1080p | 40 | no |
| Avatar 6 Pro | 2K | 58 | no |

## Before every render
1. Estimate the cost: `python3 tools/heygen_credits.py estimate <seconds>`. It prints `HeyGen estimate: <seconds>s, Avatar 6 Turbo 1080p, ~<credits> credits`.
2. If the estimate is above **40 credits**, the script exits with code 2. STOP and ask the owner to confirm.
3. In the web app, check that the cost HeyGen shows before Generate matches the estimate.

## After every render
- Log it: `python3 tools/heygen_credits.py log <filename> <seconds> [credits]`. This appends date, filename, duration, model, resolution and credits to `studio/.local/heygen_credits.log` (gitignored) and prints the month's running total.
- If the total goes past **1,800 credits**, it prints a warning. Warn the owner before the next render.

## Override
Only a direct instruction from the owner in the current request (for example "use Avatar 6 Pro for this one") overrides a hard rule, and only for that one video.
