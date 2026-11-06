# voxel-reel (job 85fb47b66b4b, @heyalok.ai DfFx6dCxxOg rebuild)

A voxel Hammad and the Claude block buddy, built in Three.js inside one HyperFrames composition (1080x1920, 30 fps).
Every frame is a pure function of t; all timing comes from the voice track's word timings (`hf/data.js`).

1. `./setup.sh <job>` (vendors three + gsap, copies fonts)
2. Voice: `python3 make_voice.py standin` (macOS `say` stand-in) or `python3 make_voice.py take --lines <dir>` with one
   ElevenLabs WAV per line id in script.json (H = Hammad's voice 46d4ae..., C = a library voice). Writes
   `<out>/voice.wav`, `words.json`, `lines.json`, `hf/data.js`. Use the studio venv (faster-whisper).
3. (make_voice.py also sets `data-duration` in hf/index.html.) From `<job>/hf`:
   `npx hyperframes@0.8.155 render --quality high --output ../<out>/render.mp4` (about 6 min on an M1 Pro)
4. `python3 sound-bed.py <s>; python3 sfx.py <out> <s>; ./master.sh <out> <out>/final.mp4` (-14 LUFS, <= -1.5 dBTP)

The red "STAND-IN VOICE · NOT FOR POSTING" badge shows only while `REEL.standin` is true (make_voice.py `standin`).
