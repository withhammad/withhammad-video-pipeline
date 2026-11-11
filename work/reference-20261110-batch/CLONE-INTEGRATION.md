# CLONE final integration — 11 November 2026

Job `0e375e205e9d`. Composition `CLONE`; isolated entry `studio/remotion/src/batchnov10/clone-entry.tsx`, component `Clone.tsx`. Shared render, mixer and cover/export helpers support CLONE. Final package approval remains separate from narration approval.

## Source and approval gates

Owner approved “Voice matches—continue”. Exact narration SHA256 `9f6df9b3d778d5b268ee43fbe76ae89f9307886ca5050a71aee8e2bc82c8d8d7`; native duration54.282449s,44.1kHz,2,393,856samples. Final1629frames/54.3s is within49.41–60.39s reference tolerance. No speed, pitch, word or pause changes. Recorded captions contain146 display tokens/148 spoken tokens; compact5.2 and twenty-five→25 display normalization are documented. CTA transcription CLONE was independently corroborated. All-camera upload PCM equals source narration PCM; all146 words are retained across segment boundaries.

Root owns exact approval and avatar verification records. The new black-polo/warm-bookcase take is720×1280/25fps. Root inspected217 four-fps samples plus enlarged opening. Avatar SHA256 `1e47b6c85d95fb6bf810160f87e600ce70bac7f0385a6a487bd8fac0405e3f73`.

Raw whole-track correlation .97182 missed the initial .98 threshold. Root's diagnostic established provider gain changes rather than clock drift: gain-invariant correlation .99327,105 active windows, maximum residual .1875ms and fitted drift .0105ms. Independent transcript/speech coverage and consistent+23ms local lag support the approved picture mapping. Diagnostic normalization never changed production narration. `avatar-alignment.json` and `work/release-20261111/clone-audio-diagnostic.json` hold exact evidence. Two regression tests accept a variable-gain fixed clock and reject100ms mid-take lag. This is content/clock evidence, not an audible-quality or subjective lip-shape claim.

## Edit and sound

Source order: saved look/generated motion → creator results → model/topic/research/script → own references → skill/connectors/consent → workflow brief → review → targeted correction → held CLONE CTA. Muted source UI excerpts are attributed to Arshman Khalid. Three photos/about25 seconds are explicitly the creator's example, not universal requirements. Claude coordinates connected tools; creator results are not Hammad's tests. The revision prompt is labelled illustrative. The saved-look image is the matching black-polo asset.

Actual speech compressed the model/topic/research/script section. Visual-only redistribution gives all four screens at least1.5s and ends at spoken photos20.540s. Narration/captions/avatar clock are unchanged. Split presenter uses880px contained picture over blurred fill; whole head and chin clear. Captions42px at y1380 remain inside y1500 even with two lines. Final CTA card is below the face and retains Follow + get the checklist. One relevant visual action per beat.

Restrained audio recipe: four quiet ticks (model topic, connector, review, CTA) with continuous quiet synthesized bed. Original narration is unaltered. CLONE mastering includes measured+0.2dB whole-mix trim; WAV−14.4LUFS/−1.8dBTP and AAC preview−14.4/−1.7. Final encoded sound must pass its own meter. Agents cannot directly audition; owner playback reviews the mixed sound and subjective lip sync.

## Reproduction and final review

Run heavy work through `studio/heavy.sh`. Existing final requires explicit `--replace` after reviewing a real change.

```
studio/remotion/node_modules/.bin/tsc --noEmit -p studio/remotion/src/batchnov10/clone-tsconfig.json
studio/heavy.sh node work/reference-20261110-batch/render_final.mjs CLONE --check
studio/heavy.sh node work/reference-20261110-batch/render_final.mjs CLONE --stills
studio/heavy.sh node work/reference-20261110-batch/render_final.mjs CLONE
studio/.venv/bin/python work/reference-20261110-batch/clone_review_sheet.py
```

`render_final.mjs` enforces exact narration approval/mix SHA, recorded timing, verified staged avatar, duration tolerance and audio frame clock. `clone_review_sheet.py` creates mapped reference comparisons and full decoded one-fps paired sheets. `package_clone.py` refuses a master without exact-hash root visual review, technical/audio/music pass, exact source/avatar evidence, validated platform exports and inspected cover crops. It creates six-platform copy, review notes, setup checklist, manifest and Downloads copies; packageApproved stays false. Root supplies final review after inspecting the exact master. Six copy entries pass `rq.seo_caption`.

Covers use the new take's13.5s smiling/open-eyed frame. Root inspected portrait3:4/4:5/1:1 and landscape crops; headline “Your AI Clone / Claude Plans It”. Whole head retained. No paid generation by the local editor.

Release still requires owner approval of the finished video, mixed sound, covers and copy, plus verified live guide and CLONE reply route. No publishing, scheduling or commits performed by this agent.

## Completed master evidence

Final SHA256 `65e2c3a6a5fc11cdbf73c31acc993ca882a76c42076c671da019b03ff9251666`. Master and both platform exports measure −14.4 LUFS / −1.7 dBTP, zero clipped samples. All ten master checks and both export validations pass. Editor inspected all 54 decoded one-fps samples, 12-frame opening, full reference comparisons and cover sheet; exact-hash record is `editor-visual-review.json`. Root's independent exact-master review is required by the package helper. Isolated CLONE TypeScript and helper Python compilation pass; parent full studio suite passed 649 tests with one existing warning.

Root independent exact-master visual review passed and is saved in `final-visual-review.json`. Package helper completed; both chat `outputs/CLONE` and `~/Downloads/11 November/CLONE` contain 24 hash-verified files. Top-level Downloads MP4/SRT and `Thumbnails/CLONE` also staged. Finished-package approval remains false.
