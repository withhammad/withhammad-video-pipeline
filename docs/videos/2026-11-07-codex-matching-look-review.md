# Codex matching-look review — 7 November 2026

Owner authorized Chamber look 1 (one take) and GROWTH's saved matching look (~38 credits). Final publication still requires owner approval.

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
