# Hand-over to Claude chat: Higgsfield avatar takes for two reels (12 Nov 2026)

Paste everything below the line into a normal Claude chat (not Claude Code) with the Higgsfield connector ("Higsfield") switched on.

---

You are picking up one step of my reel pipeline. The pipeline runs in Claude Code on my Mac, but Higgsfield refuses its free unlimited
generations there ("available in: Claude chat, Claude Cowork, ChatGPT"), so this step is yours. Editing, captions, covers and posting stay
in Claude Code: you cannot reach those files and do not need them.

## The job

Make three short videos of me talking to camera, lip-synced to audio that is already recorded, using the Higgsfield connector and my free
unlimited generations.

## Rules

1. Free only. Pass `use_unlim: true` on every generation. If Higgsfield refuses the free allowance for a setting, or wants to charge
   credits, stop and tell me. Never fall back to credits (the account has only 10).
2. Before the first generation, call `models_explore` with `unlim: true` and read which configurations the allowance covers. Use the
   covered configuration closest to 9:16 at 720p.
3. All media are already uploaded to my Higgsfield account (12 Nov 2026). Use the IDs below as they are. Do not ask me to upload anything.
4. One video per take. If a result is clearly bad (the face is not mine, lips out of sync, a cut, text on screen), you may retry that take
   up to two more times, on the free allowance only, changing only the prompt.
5. No music, no captions, no on-screen text, no cuts. Static camera.
6. The images are stills of my own avatar and the audio is my own cloned voice; both are mine to use.

## Settings

- Model: `seedance_2_0`. If it is refused or not covered, use `seedance_2_5` with `mode: omni_reference`.
- `aspect_ratio: 9:16`, `resolution: 720p`, `generate_audio: true`, `count: 1`.
- Media roles: the look image as `start_image`, the audio as `audio_references`. If `seedance_2_5` in `omni_reference` mode does not accept
  `start_image`, pass the image as `image_references` instead.
- Prompt for all three:
  "The man speaks the reference audio straight to camera, lips exactly in sync with the audio, excited high-energy tech creator, lively
  eyebrows, natural hand gestures. Same room and outfit as the start image, static camera, no cuts, no on-screen text."

## The three takes

| # | Take | Look image (`start_image`) | Audio (`audio_references`) | Audio length | `duration` |
|---|---|---|---|---|---|
| 1 | XTOOL, hook + ending | `d717282c-69b2-4d12-a3fd-5e3767713472` (navy sweater, podcast mic, shelves and a neon sign) | `7f2192da-1c43-468a-9a8c-48d4e98d8875` | 10.12 s | 11 |
| 2 | LAUNCH, hook | `dac580aa-22dc-43a8-95e1-17874b45b8a3` (white shirt at a desk, warm room, curtains) | `9b7e2857-bbae-4d22-ab29-4cfe6899797d` | 14.03 s | 15 |
| 3 | LAUNCH, ending | `dac580aa-22dc-43a8-95e1-17874b45b8a3` (same look) | `8bfaf76e-8217-43a5-a508-ee373ce0213d` | 6.05 s | 7 |

What the audio says, so you can judge the lip-sync:

1. XTOOL: "Developers are going to hate this! You can now build iPhone apps without Xcode, and the tool costs nothing!" then, after a
   short join, "Follow me and comment XTOOL for the setup guide!"
2. LAUNCH hook: "Anthropic's CEO told the world to slow down AI! Two months later, his company launched its most capable models yet: Fable
   and Mythos 5.2! Here are twelve wild things Fable can do!"
3. LAUNCH ending: "Which one blew your mind? Follow me and comment LAUNCH, and I'll send you my guide to try all twelve!"

## What to give me back

For each take: the job ID, the result link, the model and settings actually used, whether the free allowance paid for it, and your honest
read of the face likeness and lip-sync. I paste that into Claude Code, which downloads the clips and checks them frame by frame.

## If something blocks you

- Free allowance refused (the offer is worded "for new users"): stop and quote the message.
- The face is rejected by moderation: stop and quote the message.
- A media ID is not found: tell me; Claude Code will upload it again.
