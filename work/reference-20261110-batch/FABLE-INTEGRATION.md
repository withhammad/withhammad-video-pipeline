# FABLE build handoff

Isolated entry: `studio/remotion/src/batchnov10/fable-entry.tsx`, composition `FABLE`.
Component: `Fable.tsx`; props: `FableProps` (same recorded media/word/segment schema as BatchProps, keyword FABLE).
No changes made to shared.tsx, index.tsx, types.ts, render_final.mjs or another job.

## Final-render integration (root applies after ADVISOR finishes)

In `work/reference-20261110-batch/render_final.mjs`:
1. Include `'FABLE'` in allowed keyword array and usage text.
2. Bundle entry selection:
   `entryPoint:path.join(project,keyword==='FABLE'?'src/batchnov10/fable-entry.tsx':'src/batchnov10/index.tsx')`
3. Use FABLE reference-mapped frame samples for `--stills`; current [0,2,12,22.4,32] misses pricing, build and ending.
   Suggested reference times [0,7.5,11,19,32,44,52,59,61.5,68,80.5,90,101,107]; convert with recorded segment start/end and ref mapping.
4. Existing media staging, recorded.props.json and source-approved flag checks remain applicable. Audio preparation needs the mixer extension described below; final-render extension alone is insufficient. The isolated entry refuses unverified final props.
5. Ensure final 97.83–119.57 seconds against reference108.7, without mechanically speeding owner voice.

`fable.preflight.json` is SILENT LAYOUT DATA. Its word timings are simulated within reference segments and must never be presented as aligned captions. Final props must be from real narrated audio. Presenter region is an explicit placeholder until verified avatar exists; no substitute avatar used.

## Build/check commands

Run from repository root:
- `studio/remotion/node_modules/.bin/tsc --noEmit -p studio/remotion/src/batchnov10/fable-tsconfig.json`
- `studio/heavy.sh python3 work/reference-20261110-batch/fable_assets.py`
- `studio/heavy.sh node studio/remotion/src/batchnov10/render-fable-preflight.mjs`
- `studio/heavy.sh python3 work/reference-20261110-batch/fable_crop_edges.py`

## Facts

Checked primary sources 11 Nov (Dubai). No paid narration changes needed.
- Anthropic launch https://www.anthropic.com/claude-fable-and-mythos-5-2 : up to30% output speed; standard $8 input/$40 output per million; fast mode $16/$80.
- Previous https://www.anthropic.com/claude-fable-and-mythos-5-1 : $10/$50, supporting standard20% cut.
- https://code.claude.com/docs/en/model-config : adaptive reasoning always enabled for Fable; effort changes depth.
- Creator examples retain attribution and are not owner tests or promises. Future timeline marked speculative fiction.

## Design

Three blue chapter cards follow reference; creator project clips retain original order; cream speed/effort/pricing cards correct misleading reference claims. One simple reveal/count/transition per beat. Original collage replaced with clean cropped demo montage to eliminate source captions. Original proprietary skill UI replaced by accurate summary of WITHHAMMAD's existing downloadable starter. No new 3D demo claim, voice, sound effects, paid tool action or publishing.

## Remaining final gates

Generated presenter framing and lip sync; recorded-caption timing; complete video/audio review; reference duration; final technical/audio reports; resource page and keyword deployment; owner package approval. Guide/reply routes remain release blockers. Preflight readiness does not satisfy final approval.

## Recorded-timing preflight

Narration duration 99.239s (target97.83–119.57); recorded.props.json used for the second35-frame review. Avatar is still pending; voiceVerified was never changed. Render a fresh real-timing review with the optional props argument:
`studio/heavy.sh node studio/remotion/src/batchnov10/render-fable-preflight.mjs studio/.local/jobs/c5bc128a0a8d/referral-v4/recorded.props.json`

Source edge audit removed presenter flashes in dot-night, pattern-intro and pattern. `project-a` is the clean midpoint still because its source clip begins in the chapter transition; the composition animates its card. `collage.mp4` is unused because source captions leaked into it; the composition makes an original montage from clean assets instead.

## Required mixer extension — after FABLE voice approval

`mix_audio.py` currently accepts HIGGS|ADVISOR only and has two cue recipes. Extend its allowed keywords with FABLE and add a restrained FABLE recipe aligned to actual recorded segments (chapter changes / price reveal / starter-skill reveal). Reuse existing licensed bed at steady quiet level; preserve narration pace and static gain, no arbitrary whooshes. Run its real WAV/AAC/continuity gates.

The mixer now requires an existing `owner-voice-approval.json` tied to the exact narration-source SHA and `voiceVerified` in recorded.props.json. Do not synthesize an approval record, inherit HIGGS/ADVISOR approval, or set FABLE voiceVerified. FABLE remains voice-unapproved and has no avatar submission at this handoff.

## Actual-timing readability repairs completed

The initial recorded-time review exposed chapter1 at1.07s, chapter3 at0.68s and an8.27s static brief card. `visualClock` now redistributes only the visual sub-beats: chapter1 and chapter3 each hold1.5s; all three project montage shots remain in source order at0.31s each. The long brief now has three2.76s scene/camera/review cards with full/split/full presenter layouts. Narration, word timings, segment boundaries and camera playback clock are unchanged.

Ten targeted actual-timing frames were rendered and visually inspected after these repairs. See `fable-preflight/timing-fixes-sheet.jpg`; the earlier35-frame `layout-sheet.jpg` is a baseline, not the updated timing proof. Isolated TypeScript and ESLint pass after the fixes. Full presenter framing/lip-sync and full final-video review remain pending, along with voice approval and the required mixer extension. No approval records were touched.
