# FABLE integration and review handoff

Job `c5bc128a0a8d`; reference 108.7s; acceptable 97.83–119.57s. The original 281-word narration is 99.239s, with 269 display tokens and 44.473s of camera audio. Final frame clock is 2978 frames / 99.267s at 30 fps. No narration retiming or pause removal.

## Current state — 11 November

The owner approved the exact narration: **“Voice matches—continue”**. Root recorded `owner-voice-approval.json` against SHA256 `864456dbd440f213ad1adfafe2eb5df4fd67679082e69a56391514e2ef88cf23` and set `voiceVerified`. This editor did not create or change that approval.

The first Generate attempt remained an uncharged draft. Root verified the ledger and resumed the same draft; one accepted avatar render completed, ID `e9e9dc0d691c42cda55d20d5050411f8`, look **Podcaster in blue sweater**, Pro Avatar 6, 720p. Root inspected all 178 four-fps frames plus the enlarged opening and recorded exact-SHA approval in `avatar-visual-review.json`. The downloaded 720×1280 / 25fps / 44.48s take is aligned and staged. Full waveform correlation is 0.99304 at +23ms; nine windows show the same delay without measured drift. Picture timing includes that delay. This is audio-clock evidence, not a subjective lip-shape judgment.

Root reports FABLE generation use of 35 credits (5 narration + 30 avatar). This local editing work spends no generation credits. Narration/source-avatar approval does not approve the final package or publication.

## Implemented local integration

- `Fable.tsx` and standalone `fable-entry.tsx` use recorded word/segment timing. The entry refuses final props without verified narration and avatar. Shared/index/types files are unchanged.
- `mix_audio.py` accepts FABLE, validates the exact source approval, and creates a quiet original instrumental plus five restrained ticks. Cues follow the actual recorded clock, including the corrected build-chapter onset.
- `render_final.mjs` accepts FABLE and selects the isolated entry. It checks exact approval/source/mix hashes, reference duration tolerance and existing audio/media gates. Its FABLE stills cover 26 reference-mapped positions across all chapters, pricing, presenter layouts and CTA.
- Cover/export helpers accept FABLE. Cover headline: **Fable 5.2 / Worth the Hype?** The pose helper requires an explicitly inspected FABLE frame time and records native frame rate.
- `align_fable_avatar.py` measures full and windowed waveform lag. Staging requires the root's explicit visual-inspection JSON; it never grants narration or final-package approval.
- `package_fable.py` requires passing final technical/audio/export/visual/cover checks. It copies the review package, six platform covers, six-platform copy, SRT, guide draft and actual starter skill to the chat output and dated Downloads folders. It never posts or books slots.

## Completed checks

Mixer: **WAV −14.3 LUFS / −2.0 dBTP; AAC preview −14.4 LUFS / −1.9 dBTP; zero clipped samples; continuous bed passes.** These are mix/preview measurements, not a final-video audio result. Whole-mix loudness mastering is recorded; the original narration file and speech clock are unchanged.

Isolated TypeScript/ESLint pass. Six Python helpers compile and both renderer scripts pass Node syntax checks. Six platform-copy validators pass. Final-render preflight passes with the verified/staged avatar.

Visual preparation: 35 baseline actual-timing frames, 10 timing-repair frames and 5 contrast/framing-preparation frames inspected. Source presenter flashes were trimmed from reference inserts. `project-a` uses a clean midpoint still; the original collage is excluded because it contained source captions. All source crops/provenance are in `analysis/fable-assets.json`.

The initial timing review found short chapters and an 8.27s static brief card. Visual-only remapping now holds chapters 1/3 for 1.5s each, preserves all three montage shots at 0.31s each, and gives the brief three 2.76s scene/camera/review cards. Real-avatar stills revealed chin overlap in split shots. The corrected layout uses a smaller whole-head portrait over a blurred video fill, with captions below the chin and inside y1500. Full-screen title/brief cards were moved below the actual face. Root independently reviewed corrected opening and brief frames. Stronger opening contrast is in place. Narration, word timings, segment boundaries and camera clock were not changed.

`fable.preflight.json` contains simulated timing and is **never final-caption evidence**. Actual-timing checks use `referral-v4/recorded.props.json`. The older layout sheet predates timing repairs; `timing-fixes-sheet.jpg` proves those repairs. All placeholder previews remain clearly labelled internal.

## Completed final package — 11 November

The final master is **99.267s / 2978 frames**, H.264, 1080×1920, 30fps, limited-range BT.709, AAC 48kHz. All ten master technical/audio checks pass. Encoded master is **−14.4 LUFS / −1.9 dBTP**, zero clipped samples. Both actual platform exports pass format/frame/audio checks at **−14.4 LUFS / −1.7 dBTP**.

Editor inspected the full decoded 1fps contact sheet, opening strip, 26 actual-avatar framing stills, representative reference comparison and all 99 paired one-fps source/final samples. Root independently inspected the full contact/opening/reference comparison and cover sheet, accepting final visual framing. Exact evidence is in `final-visual-review.json`; it includes the final SHA. Cover pose is the actual smiling/open-eyed 34.75s source frame, matted locally. Six platform covers and 3:4/4:5/1:1 crops preserve the whole head and both headline lines.

Package generated at the chat workspace `outputs/FABLE` and `~/Downloads/11 November/FABLE`, with the dated top-level master/SRT and `Thumbnails/FABLE`. Contents: master, Instagram/social exports, SRT, six-platform copy, review notes, editorial scorecard, guide draft, starter skill and covers. `cover-sheet.jpg` is also at package root for the approval link. Per-file hashes are recorded in `manifest.json`.

**Final package remains unapproved.** Owner full playback and approval of mixed sound, cut, covers and copy remain required. No subjective audio or lip-shape approval is inferred from meters or waveform correlation. Root owns live resource/reply-routing checks and release decisions. No posting or scheduling was performed by this editor.

Heavy commands run through `studio/heavy.sh`; Python audio tools use `studio/.venv/bin/python`; cover matte uses the installed video-effects virtual environment. No extra generation spend or commits by this editor.

## Primary-source factual checks

No narration correction needed. Anthropic's 5.2 launch supports up-to-30% output speed, standard $8/$40 per million tokens and extra-cost fast mode. The 5.1 launch supports the previous $10/$50 rates, hence 20% standard-rate reduction. Claude Code model documentation supports adaptive reasoning and effort controls. Creator demonstrations remain attributed; future history is labelled speculative fiction; no one-click or personal-test claim.

- https://www.anthropic.com/claude-fable-and-mythos-5-2
- https://www.anthropic.com/claude-fable-and-mythos-5-1
- https://code.claude.com/docs/en/model-config
