# REPO phone upload and keyword reply preparation

The corrected package was approved on 9 November. On 10 November the owner chose native sounds and phone uploads, starting with REPO. He posted https://www.instagram.com/reel/DfjJM3yIDQI/ at 09:22:29 GST on @withhammad.ai. Instagram Graph API confirms media `17919246270264710`, the REPO caption and the account. The queue now contains one **posted** receipt, and the publisher receipt prevents another upload. Keep remaining platforms manual, without an automatic two-hour fallback. Sound identity and Collab acceptance are not confirmed by the media lookup.

Files: `/Users/hammad/Downloads/10 November/REPO - Manual Upload/`.

- `REPO - add your app sound.mp4`: 45.566667 seconds, 1080×1920, 30 fps, 1,367 H.264 limited-range frames, AAC audio. Picture bitstream exactly matches the approved master.
- Existing corrected REFERRAL v4 voice stem, static gain only; old music omitted for in-app sound selection. Zero new credits. Voice-only -19.2 LUFS / -2.0 dBTP; final music balance must be checked in the phone app.
- Portrait cover, captions SRT, three platform caption files and `START HERE.txt`.
- The original approved master remains in `10 November/Business/REPO`.

Deployment complete: [website PR #20](https://github.com/withhammad/withhammad-rebuild/pull/20) merged at 05:45 UTC under the owner's instruction to handle the uploaded reel's bot entirely. Merge `cfc2887953fd2939309bd18c08bfcbab71237567`; production deployment `dpl_GPmyCyZzCFyuBPgjNosLgvvxFGVv` is Ready and aliases withhammad.com. The REPO guide returns 200 and the shared keyword matcher selects its guide rule.

PR #20 now includes commit `fc0e588`, which requires an explicit confirmed Instagram follow before sending the guide. An unavailable check asks for a retry; failed private sends do not falsely announce delivery. Nine local webhook tests pass using mocked API calls, covering the manual-upload rule as well as failure handling. Site lint/typecheck/build pass; 646 pipeline tests pass with one existing deprecation warning.

Connectivity checked: Instagram identity is @withhammad.ai, comments/messages subscription active, verification challenge and signed empty webhook HTTP 200. YouTube dry run reads 500 threads, skips 11 previously answered comments and finds no new eligible replies. Its automation is ACTIVE at :15/:45, 07–23 GST, GPT-6 Astra/high. None of these checks proves a real customer received the REPO link.

Post-deployment check: zero comments on the REPO reel, so no real REPO DM delivery is claimed yet. Two read-only profile checks for existing conversations returned confirmed follows; a third returned HTTP 500. The deployed handler withholds the link on an unknown result and offers a retry. This shows follow-check availability, not an actual new-reel DM transaction. Vercel env pulls mask sensitive values; use known working local credentials for connectivity checks, not the placeholders.

YouTube handoff includes separate title, description, tags, settings and JSON files in Downloads. Use Comments On → Who can comment Subscribers and members → Minimum subscription time Any duration to enforce subscribe-first in YouTube itself. The API cannot inspect private subscriptions independently; its replies remain public. [Official native comment setting](https://support.google.com/youtube/answer/9483359). Shorts comment/description URLs are non-clickable, so a channel-profile link is the clickable route.

The owner uploaded https://www.youtube.com/shorts/J15kXiijiZI at 10:48:07 GST on 10 Nov. Ownership, public visibility and processing verified. The approved portrait cover was set at 10:53:16 GST; API reports `hasCustomThumbnail: true`, and the live YouTube thumbnail visually matches the cover. Added all 11 prepared tags while preserving the owner's correct title/description and existing audio. English, Science & Technology and not-for-kids confirmed. Corrected English SRT uploaded once and its standard caption track is serving. Synthetic disclosure was requested successfully but not exposed by API readback; Studio confirmation is pending. One posted queue row and the publisher receipt guard against reupload.

No comments on this Short at verification. REPO matches the live guide, and the active reply automation includes manual uploads. A fresh dry run read 500 threads, skipped 11 previously answered and found no new eligible replies. Actual REPO delivery remains unproven until a viewer comments. Subscriber-only comments, Basic moderation, clickable channel-profile guide link and disclosure verification await unlocked Chrome. No paid-tool credits used. Detailed proof: `outputs/video-pipeline/reviews/2026-11-10-repo-youtube-settings.json`.

Sound-selection browser check was blocked because the Mac was locked. Owner chose the phone workflow instead; no browser upload or publication occurred.
