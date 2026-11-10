# REPO phone upload and keyword reply preparation

The corrected package was approved on 9 November. On 10 November the owner chose to add native sounds and upload from the phone, starting with REPO. No REPO entries exist in the posting queue. Keep this release manual, without an automatic two-hour fallback.

Files: `/Users/hammad/Downloads/10 November/REPO - Manual Upload/`.

- `REPO - add your app sound.mp4`: 45.566667 seconds, 1080×1920, 30 fps, 1,367 H.264 limited-range frames, AAC audio. Picture bitstream exactly matches the approved master.
- Existing corrected REFERRAL v4 voice stem, static gain only; old music omitted for in-app sound selection. Zero new credits. Voice-only -19.2 LUFS / -2.0 dBTP; final music balance must be checked in the phone app.
- Portrait cover, captions SRT, three platform caption files and `START HERE.txt`.
- The original approved master remains in `10 November/Business/REPO`.

Release blocker: [website PR #20](https://github.com/withhammad/withhammad-rebuild/pull/20). The guide currently returns 404. The owner must merge or explicitly authorize Codex to merge under master prompt section 2.8.

PR #20 now includes commit `fc0e588`, which requires an explicit confirmed Instagram follow before sending the guide. An unavailable check asks for a retry; failed private sends do not falsely announce delivery. Nine local webhook tests pass using mocked API calls, covering the manual-upload rule as well as failure handling. Site lint/typecheck/build pass; 646 pipeline tests pass with one existing deprecation warning.

Connectivity checked: Instagram identity is @withhammad.ai, comments/messages subscription active, verification challenge and signed empty webhook HTTP 200. YouTube dry run reads 500 threads, skips 11 previously answered comments and finds no new eligible replies. Its automation is ACTIVE at :15/:45, 07–23 GST, GPT-6 Astra/high. None of these checks proves a real customer received the REPO link.

After deployment: verify guide/rule on production. The owner uploads to @withhammad.ai with app sound, the prepared caption and Collab invites. Record the actual reel URL; test a real REPO comment, follow prompt, confirmed follow and guide DM. For manual YouTube/TikTok posts, record their URLs and verify public keyword replies. YouTube subscriptions can be private and Shorts comment/description URLs are non-clickable; do not promise a verified-subscribe DM gate.

Sound-selection browser check was blocked because the Mac was locked. Owner chose the phone workflow instead; no browser upload or publication occurred.
