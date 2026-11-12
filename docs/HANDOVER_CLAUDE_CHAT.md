# Hand-over to Claude chat or Cowork: Higgsfield presenter clips under the free trial (12 Nov 2026, version 2)

Why this exists: Higgsfield refuses its free-trial "unlimited" generations from Claude Code ("available in: Claude chat, Claude Cowork,
ChatGPT"). So the generating has to be started from a normal Claude chat or a Cowork task with the Higgsfield connector ("Higsfield")
switched on. Paste everything below the line there. Claude Code then collects the finished clips from the Higgsfield history by itself.

---

You are doing one step of my reel pipeline: generating talking-presenter clips of me with the Higgsfield connector, paid for by my
free-trial unlimited generations. The pipeline itself runs in Claude Code on my Mac and will pick the finished clips up from my Higgsfield
history, so you do not need to download or send me any files.

## Rules

1. Free trial only. Pass `use_unlim: true` on every generation. If Higgsfield refuses the allowance for a setting or wants to charge
   credits, stop and tell me the exact message. Never fall back to credits.
2. First call `models_explore` with `unlim: true` and read which configurations my allowance covers; use the covered configuration
   closest to the settings below.
3. All media are already uploaded to my Higgsfield account. Use the IDs exactly as given. Do not ask me to upload anything.
4. One clip per row. If a result is clearly bad (the face is not mine, lips out of sync with the audio, a cut, text on screen), retry that
   row up to two more times on the free allowance, changing only the prompt.
5. No music, no captions, no on-screen text, no cuts. Static camera.
6. The images are stills of my own avatar and the audio is my own cloned voice; both are mine to use.
7. Work through the rows in order and keep going until all nine are done. Submit several at once if the connector allows it.

## Settings for every row

- Model `seedance_2_5`, `mode: omni_reference` (the clips are up to 27 s, which Seedance 2.0 cannot do).
- `aspect_ratio: 9:16`, `resolution: 720p`, `generate_audio: true`, `count: 1`.
- Media roles: the look image as `start_image`, the audio as `audio_references`. If `start_image` is refused in this mode, pass the image
  as `image_references` instead.
- Prompt: "The man in the start image speaks the reference audio straight to camera, lips exactly in sync with the audio from the first
  frame to the last word. Excited, high-energy tech creator: lively eyebrows, big genuine smile, natural hand gestures. Same room, same
  outfit, same face as the start image. Static camera, no cuts, no on-screen text."

## The nine clips

Each reel's narration is split at natural pauses; together the clips of a reel are its whole voice track.

| # | Reel | Look image (`start_image`) | Audio (`audio_references`) | Audio length | `duration` |
|---|---|---|---|---|---|
| 1 | SKILLFINDER 1/2 | `d717282c-69b2-4d12-a3fd-5e3767713472` (navy sweater, podcast mic, shelf and neon) | `dbbd2454-1520-4528-923f-9fa3ca1a6fa2` | 22.25 s | 23 |
| 2 | SKILLFINDER 2/2 | `d717282c-69b2-4d12-a3fd-5e3767713472` | `bb113844-2502-4080-85b4-ec5cc53dc121` | 18.57 s | 19 |
| 3 | OPENHIGGS 1/3 | `e39b3ea6-8b80-4bad-b5cb-5daefbfe9f7d` (black polo, podcast mic, warm bookshelf) | `a9c96873-06fa-4ad1-b7b2-fe6cc52bc2ef` | 23.51 s | 24 |
| 4 | OPENHIGGS 2/3 | `e39b3ea6-8b80-4bad-b5cb-5daefbfe9f7d` | `2703a4d5-30aa-40a7-bf39-4e949b25e55b` | 23.36 s | 24 |
| 5 | OPENHIGGS 3/3 | `e39b3ea6-8b80-4bad-b5cb-5daefbfe9f7d` | `c7255737-e5e2-4c7a-8d9c-9267d502335c` | 15.88 s | 16 |
| 6 | DOSSIER 1/4 | `dac580aa-22dc-43a8-95e1-17874b45b8a3` (white shirt at a desk, warm room, curtains) | `1e757d81-09c4-43da-9eaa-f91817d33fe6` | 14.71 s | 15 |
| 7 | DOSSIER 2/4 | `dac580aa-22dc-43a8-95e1-17874b45b8a3` | `66d71e16-2dff-4dc4-9c11-a2660709072d` | 26.70 s | 27 |
| 8 | DOSSIER 3/4 | `dac580aa-22dc-43a8-95e1-17874b45b8a3` | `82e52751-1791-443f-a993-3b98eac388c2` | 26.98 s | 27 |
| 9 | DOSSIER 4/4 | `dac580aa-22dc-43a8-95e1-17874b45b8a3` | `f5705c25-7264-48d3-a252-ffcb97c33a93` | 12.11 s | 13 |

## When you finish

Give me one table: row number, job ID, whether the free allowance paid for it, and your honest read of the face likeness and the lip
sync. Then I tell Claude Code "done" and it downloads everything.

## If something blocks you

- Free allowance refused: stop and quote the message.
- The face is rejected by moderation: stop and quote the message.
- A media ID is not found: tell me; Claude Code will upload it again.
