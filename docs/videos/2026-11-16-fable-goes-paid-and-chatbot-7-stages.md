# Two own-design animated posts, Mon 16 Nov 2026: "Fable 5.2 goes paid tonight" + "How AI chatbots are built"

Owner, 16 Nov: two LinkedIn posts (Denis Panjuta's 7-stage chatbot infographic; Charlie Hills' "Last Day of Fable
5.2") with "these first: animate, edit and upload in every platform today". Both are our OWN designs on the topic
(WithHammad system, own wording, facts checked), not copies. Posting was pre-approved.

## 1. Fable 5.2 goes paid tonight: do this first (job `studio/.local/jobs/fablelastday`, keyword ADVISOR)

Source `studio/remotion/src/fablelastday`. 22 s, 4:5 and 9:16 (hook on frame 0). Facts: free week ends Mon 16 Nov
11:59 pm PT; `/advisor fable` with Opus 5.5 as main model, Fable advisor bills to usage credits
(code.claude.com/docs/en/advisor). Guide: withhammad.com/resources/claude-fable-advisor-setup.

| Platform | URL | Sound |
|---|---|---|
| LinkedIn (4:5 video, API) | https://www.linkedin.com/feed/update/urn:li:ugcPost:7528057722383265792/ | own music; both prompts in the first comment |
| X | https://x.com/HammadYousufAI/status/2122292951439360126 | own music |
| Facebook Page reel | https://www.facebook.com/reel/2117316252323846/ | tienanh109 · X-COOL! (Instrumental Slowed) |
| Instagram @withhammad.ai (Collab @with.hammad accepted) | https://www.instagram.com/reel/DfzRqTACcJV/ | Chela Rivas · Make It Pop (Instrumental), Audio API |
| TikTok | https://www.tiktok.com/@withhammad/video/7708733109197360402 | Fades Away (Sophia Glow Nelson) |
| YouTube Short (Studio upload, public) | https://youtube.com/shorts/p-gRqBBe4uQ | own music; `allow_no_sound` (owner: "Post without sound", this Short only); guide + subscribe comment pinned |

## 2. How AI chatbots are built in 7 stages (job `studio/.local/jobs/chatbotinfographic`, keyword CHATBOT)

Source `studio/remotion/src/chatbotinfographic`. 21 s, 4:5 and 9:16. Facts re-checked against the Llama 3,
InstructGPT and DPO papers. Guide PDF (the 11-page carousel): withhammad.com/media/guides/how-ai-chatbot-is-made.pdf;
CHATBOT rule added with `app.guide site` (site commit a7b1733).

| Platform | URL | Sound |
|---|---|---|
| LinkedIn (4:5 video, API) | https://www.linkedin.com/feed/update/urn:li:ugcPost:7528062277300744192/ | own music |
| X | https://x.com/HammadYousufAI/status/2122295435633307874 | own music |
| Facebook Page reel | https://www.facebook.com/reel/1490330576333423/ | Giulio Cercato · Beautiful |
| Instagram @withhammad.ai (Collab @with.hammad accepted) | https://www.instagram.com/reel/DfzSt04DlzO/ | Magnetic Sirens · Parallel Lines, Audio API |
| TikTok | https://www.tiktok.com/@withhammad/video/7708734324811631880 | Speaker Knob Party (Kenny Bostick) |
| YouTube Short (Studio upload, public) | https://youtube.com/shorts/_trHeNRMwA4 | own music; `allow_no_sound` (owner: "Post without sound", this Short only); guide + subscribe comment pinned |

### Carousel (11 pages, `outputs/guides/how-ai-chatbot-is-made`), posted 16 Nov evening

Owner approval relayed by Pipe Line Master after he saw all 11 pages and the PDF: "Ok". Captions from the guide's
`captions.json`. Pages hosted at `withhammad.com/media/carousels/guide-how-ai-chatbot-is-made/NN.jpg` (site commits
`70c5938`, `5db9888`). Job script: `studio/.local/jobs/chatbotinfographic/post_carousel.py` (git-ignored).

| Platform | URL | Notes |
|---|---|---|
| LinkedIn document post (API) | https://www.linkedin.com/feed/update/urn:li:ugcPost:7528106159379988480/ | 11-page PDF, title "How an AI Chatbot Is Built (7 stages)" |
| Instagram carousel @withhammad.ai (Collab @with.hammad accepted) | https://www.instagram.com/p/DfznlycjF5-/ | 11 pages, API; first comment with CHATBOT + follow ask |
| Facebook Page multi-photo post | https://www.facebook.com/122105678205523467/posts/122110982457523467 | 11 pages, API; link-ending last page; caption carries the resources link (the API accepted it despite the Page link limit) |
| X thread | https://x.com/HammadYousufAI/status/2122341032625131732 | head post is text only (see below); pages 1-4, 5-8, 9-11 in three replies, guide PDF link in the last |
| TikTok photo post | https://www.tiktok.com/@withhammad/video/7708782661103504658 | 11 pages, sound: My Time (JOSH.WAV); last page is the "visit withhammad.com/resources" ending |
| YouTube | not posted | channel Posts are unavailable in this Chrome profile ("Posts aren't currently available on this device"); a slide-video Short needs a library sound, and the no-sound exception covered only the two Shorts |

## What was learned

- **Instagram Audio API works end to end** (first time): `POST /{ig-user}/media` on graph.facebook.com with the Page
  token, `media_type=REELS`, `video_url`, `cover_url`, `collaborators`, `audio_configuration={"audio_id","audio_volume",
  "video_volume"}`, then `media_publish`. Both publishes answered 2207032 and both reels were live (`/media` read back).
  The posted reels show the sound line. Script: `studio/.local/ig_reel_audio.py` (git-ignored). The trending list was
  mostly Chhath devotional songs on 16 Nov; instrumental tracks from the same list were used.
- **Facebook Page link limit:** the Page gets 2 organic posts with links a month ("0 links left"); a third is blocked
  by a paid "Meta One" upsell. The chatbot reel went out with no link and a "Comment CHATBOT" line.
- **Facebook reel keyword DM is broken:** a keyword comment on a Page REEL gets the public "Sent you a DM ✅" reply,
  but `me/messages` with `recipient.comment_id` fails with 10903 / 1893049 "This user can't reply to this activity".
  Tested with ADVISOR and CHATBOT from the owner's personal profile; nothing reached Messenger. The webhook posts the
  public reply even when the private reply fails. Fix needs a website change (owner-reserved).
- Instagram keyword DMs for these two posts were not tested end to end: every account I can comment from is one of
  the owner's own, which the webhook skips. First comments with the keyword and follow ask are posted on both reels.
- The LinkedIn video publisher only accepts 9:16; the 4:5 posts set `publish_linkedin.ASPECT = 4/5` in a job script.
- **YouTube API token is dead** (16 Nov: `invalid_grant`, "Token has been expired or revoked"). The Google reconnect
  opened in Chrome was declined on screen, so both Shorts were uploaded through YouTube Studio in Chrome (owner:
  "Yes, use Studio"). Every other YouTube API job (queue uploads, youtube_keyword replies) stays blocked until the
  owner approves `outputs/video-pipeline/youtube_oauth.py --captions`.
- Studio route: publish only after "Checking…" clears in the Shorts list (publishing earlier shows a strike warning;
  the checks took about 15 minutes). The channel can comment and pin from Studio > video > Comments, which works
  even though the youtube.com watch page hides comments under Restricted Mode in this Chrome profile.
- YouTube's AI-use question was answered "No" on both: no avatar, no realistic synthetic scene, music is a bed.
- Neither post has a repost-queue entry, so `allow_no_sound` is recorded here and in each job's `published.json`.
- **Carousel, Instagram:** `media_publish` answered HTTP 403 code 4 / 2207051 ("action blocked", possible spam) and
  the carousel was live anyway. Same rule as 2207032: read `/me/media` before any retry. The state file was marked
  published by hand with the media id.
- **Carousel, X:** the compose dialog at `/compose/post` has two file inputs on the page (the dialog's and the home
  composer behind it). The pages attached to the hidden home composer, so the head post went out as text only. The
  pages were added as three replies instead of deleting the post. Next time: check `tweetPhoto`/"Remove media" count
  inside the dialog before Post, or compose from the status/home inline box.
- **Carousel, TikTok:** TikTok Studio has a Photos tab (up to 35 images, sound picker). X and TikTok have no keyword
  DM, so TikTok and Facebook use the link-ending last page (`linkedin-11`); the X thread used the "Comment CHATBOT"
  page with the PDF link in the reply text.

