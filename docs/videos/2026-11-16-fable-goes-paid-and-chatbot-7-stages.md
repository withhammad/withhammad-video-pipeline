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
| YouTube Shorts | not posted | needs the phone app for a sound: owner decision |

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
| YouTube Shorts | not posted | owner decision |
| Carousel (11 pages, `outputs/guides/how-ai-chatbot-is-made`) | not posted | held: a third LinkedIn post in one afternoon |

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
