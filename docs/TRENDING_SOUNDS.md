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

## Verified by running, 11 Nov 2026 (owner's Chrome and tokens)

| Platform | Route | Library sound? | Volume | Schedule | Status |
|---|---|---|---|---|---|
| TikTok | TikTok Studio upload > **Sounds** (in-browser editor) | **Yes.** Tabs For You / Favorites / Unlimited / Recent, search, filter "Commercial use" | dB per track, plus fades | Yes, still offered after saving the edit | Draft built for ADVISOR with "Aura Farming (Slowed)" at -20 dB; the sound is still on the timeline when the editor is reopened. Not yet scheduled (the old scheduled copy must be deleted first). |
| Facebook | facebook.com/reels/create **as the Page** > Edit > **Audio** | **Yes.** "For you" (with use counts) / "New releases", search | Slider per track (0-1) | Schedule or Post, with the AI label switch | **Posted.** ADVISOR went out 11 Nov 18:48 GST: https://www.facebook.com/reel/1034824059017707/ shows "AI content" and "Mustafa Saboori · Aura Farming". Meta's help page says desktop has no music step; the live composer has one. |
| Instagram | **Instagram Audio API** (official): `GET graph.facebook.com/v22.0/ig_audio?audio_type=music&user_id=<ig id>` then `audio_configuration={"audio_id":..,"audio_volume":1-100,"video_volume":1-100}` on the REELS container | **Yes.** With no `search_query` it returns Meta's trending list | 1-100 each | Our own queue publishes at the slot | The trending list answers today with the existing Facebook Page token (scopes instagram_basic + instagram_content_publish; Instagram Login tokens are refused by design). Not yet published this way. Catalog = audio Meta allows third parties ("Aura Farming" is not in it). No preview of the mix. |
| Instagram | instagram.com > Create > Post | **No.** Only cover, trim, sound on/off | - | - | Confirmed in the live uploader. |
| Instagram | "Share to Instagram" switch in the Facebook Page reel composer | Unknown | - | - | Tried on ADVISOR with "Share only this post". Nothing had appeared on @withhammad.ai 10 minutes later. The dialog pre-selects "Always share posts to Instagram": never leave that on, it would cross-post every Page post. |
| Instagram / Facebook | Meta Business Suite composer | Not tested | - | - | business.facebook.com answers "redirected you too many times" in this Chrome profile. |
| YouTube Shorts | Data API, YouTube Studio desktop, youtube.com desktop | **No** (official help pages and API reference) | - | - | Only the YouTube phone app's Shorts editor attaches a library sound. Needs a phone-app route (plugged-in Android phone, Android emulator, or the owner's phone). Not tested by hand. |

Proof screenshots: `outputs/video-pipeline/reviews/2026-11-11-trending-sounds/`.

## Facebook procedure (Chrome, as the Page)

1. On the Page profile click **Switch Now** (the composer must read "What's on your mind, With Hammad AI?").
2. facebook.com/reels/create: upload `final_social_nomusic.mp4`; **Audio** > pick a trending track from "For you"
   (instrumental, no devotional or festival song) > speaker icon on the music track > slider to about 0.10 > Done.
3. Caption, **Cover** > Upload `cover_1080x1920.jpg`, Next, **Add AI label** on, "Share to Instagram" OFF, Post or
   Schedule. Read back the preview: Page name, "AI content", the sound line.
4. Open the posted reel, confirm the sound line, record the URL and the sound under the queue lock, then switch the
   session back to the personal profile.

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

- Instagram: wire `audio_configuration` into the publisher on the Facebook-Login host, host the no-music cut, pick
  the track from `/ig_audio` with a filter (no devotional or festival songs, instrumental preferred, duration at
  least the reel's), calibrate the volume once, then publish ADVISOR and the backlog this way.
- YouTube Shorts: choose the phone-app route (owner decision: automation of the app carries account-terms risk).
- 32 of the 35 queued sound-platform reels have their music baked in (`needs_separation`): their voice has to be
  separated before a platform sound can go on top.
- TikTok: the already scheduled reels (ADVISOR 11 Nov 20:15, HIGGS 12 Nov 18:00, PLANE, PROMPT) carry baked music;
  each replacement needs the owner's OK because the scheduled copy has to be deleted.
