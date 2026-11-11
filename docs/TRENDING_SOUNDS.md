# Trending sounds: how each platform gets one (owner red line, 11 November 2026)

Owner, 11 Nov 2026 (third time raised): every finished reel keeps its own background music as the master. At upload:
**X and LinkedIn** get that master. **Instagram, Facebook, YouTube Shorts and TikTok** must go out with a sound from
the platform's own library (a trending one), added in the platform's own uploader over the cut that has **no music
bed**. "Without that, uploading a video is useless, because you are not getting the views."

## What the pipeline does now

- `studio/app/repost_queue.py`: `SOUND_REQUIRED_LANES = instagram, facebook, youtube, youtube_guide`. `run-due` (the
  launchd poster) no longer posts these by API. An entry stays `pending`, is never marked `missed`, and is recorded
  with `python -m app.repost_queue mark <id> <url>` after it is posted with a platform sound.
  `allow_no_sound: true` on one entry is the owner's explicit exception for that entry only.
- `python -m app.repost_queue sounds` lists every reel still waiting for a post with a sound (today's and overdue).
- `python -m app.nomusic build <job>` writes `final_nomusic.mp4`, `final_social_nomusic.mp4` (under 10 MB, for
  Chrome uploads) and `final_ig_nomusic.mp4`: the approved picture bit for bit (`-c:v copy`), voice + sound effects
  only, mastered to -14 LUFS / -2 dBTP. `python -m app.nomusic status` shows which queued jobs have the cut.
  A job without a separate narration stem is refused (`needs_separation`), not guessed.

## Verified by running, 11 Nov 2026 (owner's Chrome, test video, nothing posted)

| Platform | Desktop route | Library sound? | Volume control | Schedule | Notes |
|---|---|---|---|---|---|
| TikTok | TikTok Studio upload > **Sounds** (in-browser editor) | **Yes.** Tabs For You / Favorites / Unlimited / Recent, search, filter "Commercial use" | Yes, in dB per track, plus fades | Yes ("When to post > Schedule" is still offered after saving the edit) | One library sound per video; several only from the Unlimited (royalty-free) tab. The saved sound is still on the timeline when the editor is reopened. |
| Facebook | facebook.com/reels/create > Edit > **Audio** | **Yes.** "For you" / "New releases", search, "+ Add music" | Yes, slider per track | Yes (Schedule / Post in Settings, with the AI label switch) | Tested while acting as the personal profile; posting as the Page needs the profile switched to "With Hammad AI" first. Not yet posted this way. |
| Instagram | instagram.com > Create > Post | **No.** Only cover, trim and a sound on/off switch | - | - | The web uploader cannot add music. |
| Instagram / Facebook | Meta Business Suite composer | Not tested | - | - | business.facebook.com answers "redirected you too many times" in this Chrome profile. |
| YouTube Shorts | YouTube Studio | Not tested by hand (an upload would leave a draft on the channel) | - | - | See the research table below once it is filled in. |

Proof screenshots: `outputs/video-pipeline/reviews/2026-11-11-trending-sounds/`.

## TikTok procedure (Chrome routine)

1. `python -m app.nomusic build <job>`; upload `final_social_nomusic.mp4` in TikTok Studio.
2. Click **Sounds**. In "For You" pick the first real track (never an "original sound - <user>" clip) that is
   trending; note its title and artist. Click **+**.
3. Select the sound track on the timeline, set **Volume -20 dB** in the Audio panel (the voice stays at 0 dB),
   read the value back, **Save**.
4. Caption (paste, then delete the file-name prefix), AI label on, cover, schedule; read back date, time, caption.
5. After it is listed in Posts, `mark <id> <url> --scheduled` under the queue lock and store the sound in the entry
   (`sound: {title, artist, volume_db}`).
A scheduled TikTok cannot be edited (only Download / Delete): replacing one means deleting it, which needs the
owner's OK each time.

## Still open

- Instagram Reels and YouTube Shorts have no confirmed desktop route. Options are being researched (native app
  driven on an Android emulator or a plugged-in phone, iPhone Mirroring, Meta Business Suite).
- 32 of the 35 queued sound-platform reels have their music baked in (`needs_separation`): their voice has to be
  separated before a platform sound can go on top.
- How each platform ranks "trending" and which lists can be read from a desktop.
