# BENCH local preflight

Current proof: `qa.json`, `contact-sheet.jpg`, 19 full-size stills. Original silent draft is explicitly named `BENCH-silent-pre-safezone-review.mp4`; it predates the final safe-zone fixes and is not the current cut.

Corrected script and actual word timing match. 75.232653 seconds, 170 display tokens, no invalid or overlapping timings. Fixed voice and all native pauses retained. No avatar, no final mix, no final render, no owner voice/duration/package approval.

Scoped TypeScript and ESLint pass. All six rq.seo_caption checks pass. Charts, sources, selected comparators, different-task caveat, labelled setup illustration, scale labels, captions and CTA tail inspected. See `assets.json` in the job root for data/provenance.

Before final integration, verify exact owner voice and duration approval records against narration SHA256 `429724519a16571fe8701cec16e8670b6bb0c9f4bd6c1aeb67646b6bc71be130`. Entry blocks final output outside 60.3–73.7 seconds unless `durationExceptionApproved` is explicitly true. Do not set that flag from this preflight.
