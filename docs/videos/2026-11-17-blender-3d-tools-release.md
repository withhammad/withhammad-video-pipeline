# BLENDER reel release, Tue 17 Nov 2026 (job `studio/.local/jobs/b270e26281f7`, keyword BLENDER)

"5 AI tools that let Claude build, rig and animate 3D" (39.7 s). Built by the competitor-watch session; owner on the
cut, 17 Nov: "Approved".

## Where it is

| Platform | URL | Notes |
|---|---|---|
| Instagram @with.hammad | https://www.instagram.com/reel/Df1HW3EIkyl/ | uploaded by the owner himself 17 Nov 08:52 Dubai (media 18139975471640219), not by the pipeline; read back from `/me/media` |
| Instagram @withhammad.ai + @hammadagentic.ai | https://www.instagram.com/reel/Df1Hlh0opYG/ | second upload two minutes later (media 17953181196072360); shows on @hammadagentic.ai as a Collab |
| YouTube Short | https://youtube.com/shorts/7JKrnMnNI-M | owner upload; no comments yet |
| LinkedIn | https://www.linkedin.com/feed/update/urn:li:activity:7528322058724806656/ | owner upload |
| X | https://x.com/HammadYousufAI/status/2122564543184593175 | owner upload; text links to the guide |
| TikTok | https://www.tiktok.com/@withhammad/video/7709001271902080277 | owner upload; CTA comment posted ("link in bio") |
| Facebook Page reel | https://www.facebook.com/reel/2702104813587040/ | owner upload, found through the Graph API |

Owner, 17 Nov: he posted it himself everywhere and edits manually; the pipeline only adds the follow-up automation.

## State (after the merge, 17 Nov)

- Site PR #42 merged on the owner's word in the release session ("You merge it"), commit `d14b73f`. Read back:
  `withhammad.com/resources/ai-3d-tools` answers 200 with the right title, and the BLENDER rule is on site main
  (DM = guide link + resources link, reply "Sent you a DM"). CI "check" on that commit fails on prompt-check
  violations that were already on main.
- Instagram: first comment with the BLENDER ask and follow line on both reels (ids 18121665655994272,
  18115506953134388). Pinning is done in the app. The DM was not tested end to end: every account available is the
  owner's, which the webhook skips.
- YouTube: guide + subscribe comment posted from Studio and pinned ("Pinned by @with.hammad" read back).
- X: reply with the guide link, https://x.com/HammadYousufAI/status/2122598688593989726
- LinkedIn: comment with the guide link posted through Chrome (1 comment read back).
- Facebook: Page comment with the guide link by API (id 2702104813587040_4432355473761716).
- TikTok: CTA comment ("link in bio"). The first attempt typed into the player and liked the video from the
  owner's account; the like was left. Focus the Draft editor by script before typing.
- Not done: blog entry; YouTube keyword replies (API token revoked). Not checked: TikTok bio link target; whether the
  owner's Instagram uploads are Trial Reels with a trending sound.
- Queue: rows `in/yo/li/xx/tt/fa-b270e26281f7` are marked posted.
