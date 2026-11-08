# Five open-source repos · approval package · 8 November 2026

**ARCHIVED v3 PACKAGE — corrected cut is now documented in `docs/videos/2026-11-09-repo-corrected-voice-review.md`. Owner rejected this cut’s voice on 8 Nov 2026. This package is not approved. Correct narration against REFERRAL job `33d9c1e97156` (ElevenLabs v4, stability 50, speed 1.1), rebuild timing/lip sync and request approval of the new cut. Prior technical checks below do not establish an audible voice match.**

Job `dfa218634321`, reference https://www.instagram.com/reel/DfeW3F8PIsk/ (@nick_saraev). Finished package awaiting owner approval. No publication or scheduling authorized.

## Deliverables

`/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Five-Open-Repos/` contains `Five-Open-Repos.mp4`, `Five-Open-Repos-LinkedIn.mp4`, `cover-sheet.jpg`, six covers, `copy.md`, both SRTs, `review.md`, `virality.md`, `quality-report.json`, `filmstrip.jpg`, `reference-comparison.jpg` and the draft guide.

The job root has both masters, the source, all analysis reports, SEO/lesson/draft rule, covers and a `production/` snapshot of local build helpers. Remotion source is `studio/remotion/src/fiverepos/`; large assets remain local in `studio/remotion/public/fiverepos/`.

## Voice, avatar and credit record

Paid account `hammadbhat126`, original Hammad clone `4b02b874862049f69b6034bbdc0fb282`. Selected asset `651cd26beb734db385db3f75a4018d73`, take `1794133963432-1`. Actual engine knobs show ElevenLabs `eleven_v3`, stability 0, similarity .75, style 0, speaker boost true; speed 1.2, English Original, excited/shouting tags. Defaults were not saved. A misleading top-level v2 engine label was checked against the actual model knobs and UI. The owner's latest instruction prohibits HeyGen Voice, including fallback; rejected asset `930663f790924b64b373a2b17b7e85e4` is archived and absent from the edit.

Raw take 57.966 s. Two redundant complete phrases and measured silence were removed. Voice chain runs before splicing with 20 ms fades; no local speech-speed or pitch transformation. Voice-gate results: pause share 3.3%, 0 clipped endings at 15 cuts, high-frequency difference +0.0 dB and sibilance −1.6 dB. Natural pitch measured before final tiny silence trims: 129 Hz / 9.88 semitones; below the older 170 Hz / 12-semitone target, disclosed for owner judgment rather than changed mechanically.

Matching white-shirt/mic look `3cf65432a87e44eebc49162c646dc1da`. One 21.442 s camera-only avatar preview `a72a022bdf1b4c7991ec040cf73a1022`, actual 1080×1920. It was observed generating while the existing wizard was being reviewed; this agent did not explicitly click Generate in that observed interaction. Do not claim verified 720p preflight. The output was reused; future paid cost confirmations must verify 720p. Audio matches the uploaded v3 voice (correlation .988; encoded offset +23 ms). Main edit uses the original stem. A measured bilabial review sets picture delay to 100 ms, with one-frame inspection precision. Camera mapping and lip review are in `analysis/avatar-map.json` and `analysis/lip-sync.json`.

Balance 241 → 236 after look + ElevenLabs → 211 after the rejected fallback + avatar. Total debit **30 credits**. ElevenLabs quote 3; the remaining debit is not independently itemized. No price shown is not evidence that a look is free. No further paid attempts.

## Edit and verification

Same five chapters: OpenCode, VoiceStudio, OpenSEO, OpenMausBot, Replica. Reuse nine clean product inserts from the owner-provided reference; exclude original presenter/audio. Correct unsupported savings and pricing claims. Use Remotion chapter cards, per-word captions, local RVM presenter cutouts, close-up CTA and an original 112 BPM instrumental. LinkedIn ending holds smiling source frame 469 with a direct-guide caption and no comment narration.

Both exports: H.264, 1080×1920, yuv420p, limited BT.709, 30 fps / 1,470 frames / 49.000 s. Reference 48.533 s: +0.96%. Main −14.0 LUFS / −1.8 dBTP; LinkedIn −12.2 LUFS / −1.7 dBTP. Music stays present through the end. All 121 narration tokens match; corrected the zero-duration Model token and duplicate React key that caused a persistent prefix. All 49 one-second frames, opening 4 fps, source comparison, safe-zone overlay, final frame and cover sheet inspected. Short chapter cards and speech-following word captions preserve reference pacing and are exceptions to the generic 1.5 s line hold. No claim of a human listening review or passing the old numeric pitch gate.

Six `rq.seo_caption` validations pass; X weighted length 216. Primary repository facts and free YouTube autocomplete evidence are archived; no invented search volume. Editorial virality score 35/40 is a judgment, not a views prediction. Pipeline suite **631 passed, one existing deprecation warning in 78.12 s**.

SHA-256:
- Main: `20b7002f7f77c5e07d85e256043963ff46ce23cd5876be7b0d7dc249a00a9cec`
- LinkedIn: `fe19aa3f17f9070fa92f3ff71d83e4eea68e3b90732befeb5bc8ccafe5995dca`

## Reproduction and release

Use `studio/heavy.sh` for heavy commands. Helpers under `work/reference-DfeW3F8PIsk/` and job `production/`: `prepare_assets.py`, `render.mjs`, `render-linkedin.mjs`, `finalize.py`, `package_text.py`, `package_review.py`. Covers: `studio/remotion/src/fiverepos/render-covers.mjs`. Finalizer verifies format, audio, caption equality and writes the delivery package. No need to resubmit HeyGen.

After owner approval, open resource/REPO rule PR for `/resources/five-open-source-ai-repos`; owner merges. Verify production and keyword routing, then append six approved slots without rebuilding the queue, preserve Instagram Collabs and IG/YouTube two-hour phone-sound grace. Native TikTok/X bookings wait for the live page. Copy approved video/covers to the dated Downloads folder. Never run the live poster by hand.
