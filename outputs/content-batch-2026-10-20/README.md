# Content batch — 20 October 2026

English only. Selected presenter: **Content creator in olive shirt**, HeyGen look `5dfa03f53ae54f919040a26a953b7f4b`. Both source takes completed with Avatar IV. All rejected looks and the real-video twin remain excluded in outputs/video-pipeline/config.json.

1. AI engineering projects: final 1080×1920 Remotion video, approximately 25 seconds, at `outputs/ai-engineering-projects-reel/final.mp4`.
2. UAE 100 Dreams: completed eight-slide avatar-free carousel at `outputs/100-dreams-carousel/`.
3. Claude + Playwright job search: final 1080×1920 Remotion video, approximately 50 seconds, at `outputs/claude-job-search-reel/final.mp4`.

Both reels keep the presenter in a small 360×203 frame, use English captions and quiet generated music, and are mastered near −14 LUFS without clipped samples. Scene contact sheets and quality reports sit beside each final file. Job-search speech retains a 5.3% pause share (slightly above the old 3–5% fast-reel target) to preserve protected word endings and natural delivery; this is recorded transparently in its report. Neither narration was sped up.

**HOLD: owner explicitly requested final review before any upload.** Nothing in this batch is published, scheduled, or connected to a live ManyChat trigger. Resource deployment and current audience analytics remain necessary before scheduling after approval.

Reproduction: prepare_take.py transcribes the selected downloaded source; finalize_olive_audio.py applies the measured take-specific audio settings using cached transcription; prepare_render.py checks avatar exclusions and aligns the graphics/captions; render the standalone AIProjects or JobSearch Remotion composition; finish_render.py masters the result and produces review artifacts. Do not run these helpers on a rejected source.
