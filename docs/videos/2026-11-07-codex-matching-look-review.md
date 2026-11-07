# Codex matching-look review — 7 November 2026

Owner authorized Chamber look 1 (one take) and GROWTH's saved matching look (~38 credits). Final publication still requires owner approval.

## Current state — 8 November, corrected GROWTH delivered

- **GROWTH:** full 30.37-second edit delivered for approval in the Codex chat. Matching blue-sweater look, verified
  original clone, Excited / expressiveness 1.0 / speed 1.1 / English Original. Median 167.57 Hz (near the approximate
  170 Hz target), range 16.37 st. Exactly one corrected avatar regeneration: project
  `50d9c7c90c934f7ea18e2651df80916e`, version 2, 720p / current Pro Avatar 6, expressive motion and enthusiastic
  expression. `matching-look/corrected-avatar-raw.mp4` is 30.36 s, 720×1280/25.
- The edit reuses the reference boxing insert (0–1.1 s, crop x0/y0/w540/h400), then the real repository recordings,
  animated screens, 94/94 captioned words, full-face turns, GROWTH CTA and continuous original music. H.264 limited
  range, 1080×1920/30, 911 frames, -13.9 LUFS, -1.7 dBTP. Nineteen scenes, shortest 0.8 s. The /p/ filmstrip confirms
  a 100 ms audio advance aligns the acoustic closure with sealed lips within the source frame resolution.
- Glow covers in six sizes use a held frame from the corrected take. Built-in imagegen removed the background and
  microphone; the existing glow template supplies type, logos and layout. Caption/crop checks and all six
  `rq.seo_caption` checks pass. Outputs: `GROWTH-corrected-edit.mp4`, `GROWTH-cover-sheet.jpg`, `GROWTH-copy.md`,
  `GROWTH-review.md` in the chat outputs folder. The owner has been asked for approval; none has arrived yet.
- **Chamber:** look 1 remains selected; **no new avatar render submitted**. Original-clone v3/min-stability/1.2x
  preflight `1794087950092-2` is 67.082 s but 143.99 Hz / 8.37 st, failing energy. The strongest standard Excited take
  with corrected facts remains `1794083468342-3`: 73.587 s, 147.37 Hz / 14.97 st. An 11-second sample was sent, asking
  whether to use that verified take for look 1 despite the pitch target or keep the render held.
- Chamber's Excited preset includes conflicting slow/deliberate direction. The UI's native pitch/inflection controls
  were not retained in Creative Studio's take settings. A take-only corrected direction via the same account's
  Creative Studio endpoint produced 76.382 s / 152.07 Hz / 14.61 st, plus HeyGen's accent-fidelity warning (0.43).
  Reject it. One adapter error occurred before network and one HTTP 400 before the normalized request succeeded;
  neither produced audio. No saved voice defaults were changed.
- Chamber's edit is prepared separately: reference orbit insert at 13.6–16.0 s, clean top-panel crop x0/y0/w540/h386,
  corrected monthly AED 295 pricing, membership/UAE Pass screens, 179-word alignment, captions and extended original
  music. `studio/revisions/prepare_chamber_revision.py --prepare` spends no credits and does not render an avatar.
- Credits: 371 before the corrected GROWTH avatar, 335 afterward (observed delta 36); then 4 for Chamber's v3
  preflight and 2 for the corrected-direction preflight. **329 remaining**, verified from the paid account's usage
  endpoint. Existing historical renders/files and the posting queue remain untouched.
- LinkedIn reference `https://lnkd.in/p/dQVK4qeE` was added once. It is Paweł Huryn's static Mini Harness infographic,
  not a video. Breakdown and verified source caveats: `docs/videos/2026-11-08-mini-harness-spec.md`.
- Validation: corrected GROWTH and six cover renders completed; Chamber revision bundle passed; all **625** studio
  tests passed (one existing Starlette/AnyIO deprecation warning). No publication or scheduling was performed.

The sections below preserve earlier attempts; the current-state block above supersedes their pending statuses.

## Existing Chrome verified

The owner required the existing Google Chrome window/profile. AppleScript tab navigation and DOM interaction work there; no separate browser or cookie import is needed. LinkedIn `/in/withhammad`, X `@HammadYousufAI`, TikTok `@withhammad`, and HeyGen `hammadbhat126@gmail.com` (Pro) were verified. The connected HeyGen MCP is a different account and must not be used for these production takes.

All six Codex routines are ACTIVE, GPT-6 Astra/high, on the master's Dubai schedules. The three browser prompts now document the verified existing-Chrome path. TikTok video pages must be opened through profile card clicks: direct video URL navigation returned HTTP 403, while the profile flow worked. Skip scheduled cards with future dates. LinkedIn's current activity DOM uses role=listitem/componentkey=update-card, rather than the old article selectors. X needs the task's own tab active for virtualized scrolling.

Read-only browser scan: first 12 LinkedIn activity entries, one non-keyword comment; ten newest non-pinned X posts, zero replies; eight newest published TikToks, one emoji-only comment. No eligible keyword replies were found. These checks establish access and scanning, not fresh end-to-end reply delivery. The LinkedIn API-post watchlist still needs its separate traversal. Production missing-rule/resource PRs still need owner merges, with REFERRAL PR #7 first.

## GROWTH — hold at voice gate

- Saved look: Podcaster in blue sweater, image `ee9bfd59f57b43d7947a94baf6d61ba6`; visually matches the approved look comparison.
- HeyGen accepted the existing identity consent in the UI.
- New video: `50d9c7c90c934f7ea18e2651df80916e`.
- The browser changed to rendering while voice controls were being opened. The submission trigger and selected voice settings were not confirmed; the owner was asked whether it was started manually or through HeyGen's assistant. Do not assume who triggered it.
- Downloaded: `studio/.local/jobs/0f869c3f2de7/matching-look/avatar_raw.mp4`, 31.44 seconds, H.264 1080x1920 at 25 fps. The output is not the requested 720p submission setting.
- Credits: 416 before, 379 after; observed delta 37. No second matching-look video was submitted by Codex.
- HOLD: Praat autocorrelation on voiced frames (75–500 Hz, 10 ms step) gives median 133.37 Hz and p5–p95 range 10.17 semitones, below the handover's approximately 170 Hz / 12 semitone energy gate. The original take4 measured 150.32 Hz / 16.86 semitones using the same method.
- Evidence: `matching-look/voice-energy.json`, `matching-look/filmstrip_4fps.jpg`, `matching-look/heygen_submission.json`. The filmstrip shows the matching look and varied expressions/gestures; full lip-sync verification and final-cut QA remain outstanding.
- Do not present this as an approved final cut or spend another full-render submission without resolving the failed gate and the one-submit constraint.

## Chamber — prepared, not rendered

- Saved look: Podcast host in black polo, image `8700cc25063b4aa8a8a149ac0f6d94c9`; visually matches the owner's left-image look 1.
- Corrected 179-word narration is saved at `studio/.local/jobs/762cf7fb383a/matching-look/script.txt`. It adds Chamber membership / UAE Pass / licence eligibility and distinguishes introductory credits from paid plans. The current site showed Starter AED 295/month on monthly billing; old AED 270 wording referred to annual billing.
- Facts rechecked in the live site and Dubai Chambers' launch release. Sources: https://aihub.dubaichambers.com and https://www.dubaichambers.com/en/w/dubai-chambers-launches-world-s-first-chamber-led-agentic-ai-marketplace-1 .
- Creative Studio draft has the corrected script. Excited tone, expressiveness 1.0, speed 1.1, English/Original were set without saving defaults, then the original 58-second Chamber take's settings were loaded for comparison.
- The current selected voice label is `HAMMAD YOUSUF · HAMMAD YOUSUF -- 1`; the historical take cards label their voice `HAMMAD YOUSUF` and avatar `Professional in white shirt`. Exact original-clone selection needs verification before spending credits. No new Chamber voice or avatar generation was submitted.

## Owner's new reference

`https://www.instagram.com/reel/DfcLoDvEgMg/` is in the reference inbox, pending behind Chamber and GROWTH. Duplicate-topic review is still required before credits.

## 8 November: voice recovery and complete-edit correction

The owner rejected presenting a raw HeyGen take as the intended edit. Both revised reels still require complete
reference-matched animations, recordings, captions, music, covers/copy and the six-gate review before final approval.

The paid account's current `HAMMAD YOUSUF -- 1` maps to the same HeyGen ID as the historical original clone:
`4b02b874862049f69b6034bbdc0fb282`. A deeper read found that its source recording and underlying ElevenLabs ID now
differ from the historical approved take metadata. Same-ID verification alone is insufficient to establish the
same source recording. No cause or actor for this change has been established.

Three voice-only preflights were made with Excited, expressiveness 1.0, speed 1.1, similarity 2, English/Original:

- Chamber 1794083194436-1: 65.254 seconds, median 136.75 Hz / 14.69 st; low-energy hold, shown price 1 credit.
- GROWTH 1794083358060-2: 30.354 seconds, median 167.57 Hz / 16.37 st; first 3 seconds 163.46 Hz, near the approximate
  pitch target but original-source mismatch still needs resolution. No new avatar render.
- Chamber all-caps 1794083468342-3: 73.587 seconds, median 147.37 Hz / 14.97 st; still below the pitch target,
  shown price 2 credits. No new avatar render.

The original 23.22-second source was recovered from the approved take's metadata. It is a WebM container despite
the provider's `.wav` URL suffix. A separate clone named `HAMMAD YOUSUF - ORIGINAL APPROVED` was requested from
that recording, without replacing the current voice or saving voice defaults. The UI showed no price or upgrade;
its completion and balance need verification before further generation. Evidence is in
`work/codex-takeover/voice-preflight-proof.json` and each job's `matching-look/` folder.

Blender is connected and its 3-second 3D animation/music test was delivered; see `docs/BLENDER_CODEX.md`.
Reference `DfcdfO_sNv8` belongs to the owner's wife's separate project. Its just-added inbox entry was removed.

## Source-recording correction after waveform comparison

The earlier source-mismatch suspicion was incorrect. The old WebM and current MP3 source files are the **same
recording**: 23.220 / 23.211 seconds, aligned waveform correlation **0.99845**, with a 37.5 ms container/encoding
offset. Different filenames and provider voice IDs did not establish a different speaker or recording. The paid
account's existing clone `4b02b874862049f69b6034bbdc0fb282` remains the verified original recording. Reuse it.
Evidence: `work/codex-takeover/voice-source/waveform-comparison.json`.

The unnecessary separate recovery clone completed as `9b8e2d3c3ec9425785d7a9f71e841145`. Its preflights did not
improve the voice: Chamber v3 1794084974542-1, 73.326 s / 130.95 Hz / 9.78 st; Chamber Excited 1794085583965-2,
73.900 s / 148.97 Hz / 14.37 st; GROWTH 1794085732042-3, 33.881 s / 149.51 Hz / 15.88 st. The last GROWTH test
also recorded `language=pt`; reject it. The UI language must be rechecked **after changing the script**, immediately
before generation. No avatar video was submitted from these takes and no saved defaults were updated.

GROWTH's earlier 1794083358060-2 remains the strongest corrected take: 30.354 s, median 167.57 Hz (near the
approximately 170 Hz target), 16.37 st, English/Original, Excited, expressiveness 1.0, 1.1x. Its verified current
clone source matches the original recording. The owner's requested 9.33-second edit preview was rendered with the
existing matching-look **video** and its synchronized audio, reference boxing insert, screens, captions and music;
it is labelled as a preview with voice under review. Output: `GROWTH-edit-preview.mp4` in the chat outputs folder.
Technical check: 280 frames, H.264 1080×1920/30, limited range, -14.1 LUFS, -1.7 dBTP. This is not final approval.
