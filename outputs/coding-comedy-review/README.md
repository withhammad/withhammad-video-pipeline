# One word. 24 files? — owner-approved cut (ElevenLabs voice)

**Platform package: `publish/<platform>/` (video, covers A and B, captions.srt where accepted, copy.txt). Not scheduled or posted.**

**Cut approved by the owner 2026-10-23. Publishing, scheduling, the resource deploy and the DM flow still need his go-ahead.**

- `final.mp4`: 45.27 s, 1080 × 1920, 30 fps, H.264 limited range, AAC 48 kHz. -14.2 LUFS, true peak -4.8 dBTP.
- `cover.png`: portrait cover, 1080 × 1920 (face from 24.2 s of the take).
- `captions.srt` / `captions.vtt`: captions for this exact export.
- `script.txt`: spoken script (unchanged); `resource-draft.md`: local companion guide; `seo/seo.md`: draft copy.

New take: HeyGen video `40d87e6353ba45baa1e9c344aa027411`, the same olive-overshirt look (5dfa03f5…), Avatar V, 720p,
the owner-approved ElevenLabs voice `46d4ae4996a8476c8227108e3847f401` with its saved defaults (no overrides), and an
energetic custom-motion prompt (`heygen_submission.json`). The old-voice version is kept in `v1-original-voice/`.

How it is built (all timings measured on this take, nothing carried over from the old one):
1. `build-timing.py transcribe` — word timings (faster-whisper medium) → `transcript.json`.
2. `build-timing.py build --av 0.08` — sound moved 80 ms earlier (measured lip lead, `qa/lipsync-*.jpg`); reaction holds
   cut on the quietest frame in each measured silence; rounds, captions, holds, effect window and count landings →
   `timing.json` and `studio/remotion/src/review-20261023/comedy-data.json`.
3. Remotion `CodingComedyReview` → `render.mp4`.
4. `sound-design.py` — one original synthesized music bed 12 dB under the voice at one level to the last frame, a gentle
   voice compressor, one static gain and a peak limiter → `mix.wav` (`qa/sound.json`); muxed into `final.mp4`.

Reel skills used: video-effects **grid-dive** on "Twenty-four files?" (crisp even-frame encode; the engine's blend
doubled the face for 4 frames), **animated-numbers** (1→24 files, 0→30 languages landing on "thirty", 24→48 files;
0.8 s ease-out, then held), **video-sound** (bed, loudness, peak), **video-check** (checklist in `verification.json`).
Holds push in slowly instead of sitting frozen. The hook reads "One word / How hard can it be?" (no full stop).

Original fictional coding skit. The interface and file counts are comic illustrations, not a recording of a real
coding tool. Owner review of delivery, sound, pacing and overall treatment is still pending; the checks above are not
a claim of human audiovisual approval.

After approval (2026-10-23): footer is "WITHHAMMAD" (no "AI avatar" text in videos); `final_ig.mp4` ends with the SCOPE comment
sheet (call-to-action skill A), `final.mp4`/`final_social.mp4` end on the payoff with the link in the post; cover B
(`cover-b.png`) is the click-first option. Pipeline job: `studio/.local/jobs/comedy20261023` (symlinks).
Open items before posting: resource page live, ManyChat SCOPE flow live, cover A or B, the go-ahead to queue.
