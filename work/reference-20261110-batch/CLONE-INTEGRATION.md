# CLONE isolated edit

Entry: `studio/remotion/src/batchnov10/clone-entry.tsx`; composition `CLONE`.
Component: `Clone.tsx`; type `CloneProps` extends existing media/word/segment schema with keyword CLONE and optional referenceImage.

## Parent integration

- Add CLONE to the allowed keywords in `render_final.mjs` and `mix_audio.py` when FABLE's owner is finished editing those files. Entry selection for CLONE must be `src/batchnov10/clone-entry.tsx`.
- Retain the render gate: recorded timings, verified exact voice, verified new avatar and approved original-source audio hash. This agent sets no approval flags.
- Stage new CLONE avatar and narration in its public folder and use existing `recorded.props.json`. The original source reference map is the 9 segments from batch.json. Camera is present throughout; avatarStart is continuous through the actual recorded script unless parent changes camera-only assembly.
- Optional referenceImage defaults to `batchnov10/0e375e205e9d/saved-look.webp` (existing approved saved look). Never use earlier avatar mouth movements for current narration.
- Match 49.41–60.39 seconds without mechanically speeding voice; the silent visual draft is 54.9 seconds. Recheck actual segment durations for screen reading time after real narration is available.
- Final screen crops are source excerpts, credited on screen; the owner inputs, review checklist and targeted-revision prompt are original explanatory graphics. The last is labelled illustrative, not a live retry.
- Audio must preserve the new approved voice and natural pauses, steady quiet licensed bed, -14 LUFS and ≤-1.5 dBTP. No audio/SFX are invented for the silent draft.
- Hook labels Saved avatar look / Generated motion are truthful. No original-camera label and no claim the source creator's tests are ours.

## Commands

From repository root:

```
studio/remotion/node_modules/.bin/tsc --noEmit -p studio/remotion/src/batchnov10/clone-tsconfig.json
studio/heavy.sh python3 work/reference-20261110-batch/clone_assets.py
studio/.venv/bin/python work/reference-20261110-batch/clone_qa_assets.py
studio/heavy.sh node studio/remotion/src/batchnov10/render-clone-preflight.mjs --video
```

The render helper accepts an optional recorded props path before `--video`. It always forces `draft:true` and never changes verified flags. It copies only this job's assets/fonts, renders 23 full-size stills, and optionally renders the actual full-length half-resolution internal MP4/contact sheet. `clone.preflight.json` contains no guessed word timings; the caption band explicitly says recorded words are pending.

## One visual motion per beat

Split comparison → progressively populated source example strip → real model/topic/research/script screens → owner references with stylized audio waveform → skill/connector/consent sequence → prompt instruction reveal → review checklist → targeted fix → held comment CTA. No effect stack; no new 3D inserts required by this reference. Existing warm saved look is reused to conserve credits.

## Final gates still required

Actual recorded-word alignment; new-avatar 4fps filmstrip and lip sync; safe-zone and head-framing review on the new media; real narration-side-by-side match; full-resolution H.264 limited-range master; voice/music loudness and continuity; cover crops; six-platform copy; live resource/rule; finished-package approval. Silent layout QA cannot satisfy these.

## Actual narration — 11 November

Exact source SHA256: `9f6df9b3d778d5b268ee43fbe76ae89f9307886ca5050a71aee8e2bc82c8d8d7`.
Review copy: `~/Downloads/11 November/Voice review/CLONE - REFERRAL voice.mp3`.
Native PCM duration54.282449s, 44.1kHz, 2,393,856 samples.146 display tokens;148 spoken script tokens before compact5.2. No timing/overlap errors, no warnings, no retiming or removed pauses. Voice remains unapproved.

`prepare_voice.py` changed only twenty-five→25 display normalization. `words-reviewed.json` corrects the low-confidence CTA transcription Claude→CLONE, corroborated by a separate unprompted CTA transcription. No audio altered or audible-identity claim. See `caption-normalization-review.json`.

All-camera upload's PCM equals narration PCM byte-for-byte. Generic per-segment caption filtering omitted one word crossing a boundary; this job's camera_captions.json was replaced with the identical full146-word captions, and alignment-report.json records that correction. The parent-authorized reproducible helper fix now applies automatically only when every segment is camera and the upload bytes exactly match source PCM; other context cases are unchanged. Re-preparation passed with146 camera words and allCameraPcmIdentity:true; original voice hash and protected owner ledgers stayed unchanged.

Actual speech compressed the model/topic/research/script segment to5.4s. Visual-only redistribution gives all four screens at least1.5s and ends on spoken photos at20.540s; the following references beat consumes the remaining time to29.633s. All source screens stay in order. Recorded narration, captions, source segments and avatar clock are unchanged. The review checklist highlights one item at a time across its6.37s beat.
