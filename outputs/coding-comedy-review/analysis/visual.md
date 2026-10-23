# Visual breakdown — second approved reference

Reference: https://www.instagram.com/reel/DebmIDlSiR3/ — @agentpoly / Poly. Analyzed2026-10-23. Production order: after the roadmap carousel and before the YouTube reference. This folder contains analysis only; no publication or scheduling.

## Full-source evidence

720×1280,30fps. Video lasts49.10s (1,473 frames), audio/container49.236s. Extracted98 half-second frames and inspected four timestamped6×5 contact sheets covering0–48.5s, plus full-resolution ending frames at40.6,46.7,48.9 and49.0s. The last is black with watermark. Downloaded and inspected actual1080×1920 cover.

The mandated scene threshold0.25 caught only one transition because the dark compositions share large areas. An additional0.065 pass found the shot changes; duplicate detections around4.1,14.7,24.23 and45.83 were collapsed after visual inspection. The installed ffmpeg has no drawtext filter, so timestamps/contact-sheet assembly used the already-installed video-effects Pillow runtime. No package installation. Small-model transcription uses ffmpeg-decoded float32 audio because the installed PyAV rejects faster-whisper’s metadata_errors argument.

## Cover

The actual cover is a frame-like portrait: oversized faceted developer face occupying the center, dark hair, navy hoodie and dark warm brown room. A warm glowing creator-handle sign sits over the head; a separate white handle watermark sits upper right. One bold white line across upper chest (~61% height) carries the19-file question. No arrows, separate hook box or product logo. Adapt composition with Hammad’s approved avatar and owner brand; do not copy the other creator’s face, low-poly character, sign or handle.

## Scene grammar

Two recurring viewpoints: developer reaction and laptop/assistant. Hard cuts follow speaker changes. The assistant is an orange rectangular low-poly creature with simple eyes and short legs; its face flips between vertical bars and happy arcs. It stands on a laptop keyboard. Its original silhouette and characteristic look must not be reused. Code windows are original animation props in the source, not captured evidence of actual Claude execution.

The code counter is the recurring visual gag. First cascade ends at19 files/+1,256. Explanations isolate theme files, then design-system files, then a users table with a color preference. The second cascade adds mail infrastructure and ends at37 files/+3,057. Signup and verification modals make the scope creep harm the original task. Full timings/actions are in scenes.json.

## Captions

Bold sans serif (font identification uncertain; resembles a conventional geometric/grotesk bold), roughly20–24px at720px width; white for developer, orange for assistant, subtle dark shadow, no box. Usually one sentence or short phrase, commonly3–8 words, centered near60–65% height. Occasional uppercase emphasis. No word-by-word karaoke. Speaker color is consistent but should also be distinguished by speaker identity/position in our version so meaning is not color-only. Caption baselines vary with camera framing; our safe area should be consistent and clear of the active UI.

## Rhythm and presence

21 changes including the final black cut:~4.3 changes per10s. Mean content shot~2.33s, with longer disbelief shots and short code cascades. Developer presence occupies~20.90s (~42% of runtime), with assistant/code/laptop alternation carrying the rest. Do not turn this into a fast tutorial or unrelated montage; comedy depends on held reactions. Approved owner avatar stays full-frame on his lines; a small reaction inset can remain during selected UI beats if it leaves controls readable.

## Production improvements

- Reference captions/code are small at phone scale; use readable caption phrases and a few large file-name cards, leaving decorative code secondary.
- Dark eyes/room are visually muddy in compressed frames; preserve the owner’s approved bright casual avatar and use controlled, readable UI backgrounds.
- The source shows awkward text such as “1 files changed” during the counter and placeholder code. Our singular/plural counter must be correct; label this an illustrative skit instead of implying a live trace.
- Keep the original target button visible underneath the detour so the audience can see the task still is not done.
- Do not cover the signup title/error with captions. Keep the red error readable for~1s before the assistant’s realization.
- Remove source watermark/sign/likeness entirely. New assets, assistant design, code cards and dialogue only.
- Preserve the final callback and interruption. The post-caption CTA must not replace the last joke.

## Effect decision

Consulted ~/.codex/skills/video-effects/SKILL.md. The strongest default is clean shot/reverse-shot and one card cascade per escalation beat. A single depth-ui treatment may fit the first code-stack beat if it preserves caption/face clarity; no automatic stacking and no cube-spin just because the reference contains a cube. All effects are deferred until owner footage exists. No effect render or paid generation was performed.
