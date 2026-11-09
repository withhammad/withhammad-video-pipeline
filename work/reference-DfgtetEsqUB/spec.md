## 10 November: full approved-treatment film delivered

Current file: chat workspace `outputs/Personal-Iqbal/Andalus-Blender-full.mp4`, 35.409 seconds. Approved Blender walk retained; original full audio/captions. No business publication. Proof `outputs/personal/reviews/2026-11-10-valley-full.json`. Earlier pending notes below are historical.

# Approved replacement sample — full film still pending

The 5.76-second `Valley-Blender-walk-sample.mp4` was shown and the owner answered “Use this for the full video.” Use the actual 3D human rig in `studio/blender/personal-iqbal-valley` and the packed `work/personal-iqbal-3d/Hammad-valley-sample.blend`. Keep original full audio/captions and scenery. Approval is recorded with the sample hash in `outputs/personal/reviews/2026-11-09-valley-sample.json`. Do not mistake the old illustrated puppet below for the approved model. The full 35-second replacement is not yet rendered.

# Rejected v3 — replacement requirements

The owner rejected the funny character and its movement. Scenery is acceptable. No deliverable below is approved. Retain only scenery, original audio and captions. Before rebuilding the 35-second personal film, prove a recognisable, proportionate character with natural foot planting, turns, weight transfer and coordinated body movement in a short Blender/code preview. No frontal cutout sliding over a background. No HeyGen or paid credits without specific authorization.

---

# Current revision: personal anime walking film

Latest owner instruction on 9 November: make a cartoon of Hammad actually walking through outdoor scenes and valleys; Blender or code may be used. This is a personal file for the owner, expressly not for his business accounts. The photo-camera-motion version below is superseded.

The current build uses an original full-body anime illustration of Hammad on a 17-bone Blender rig. A dense skinned mesh animates knees/feet with a planted-foot/swing phase, alternating arms, spine, head, blinks and hair. 150 RGBA frames form a six-second walking cycle. Remotion places the animated character along travelling paths through terrace, valley, riverside and courtyard backgrounds. It is layered 2D character animation, not a stationary photo pan.

Current composition: `studio/remotion/src/personal-iqbal/anime.tsx`, `PersonalIqbalAnime`. Rig: `studio/blender/personal-iqbal-anime/build.py`. Current assets: `studio/remotion/public/personal-iqbal-anime`. Generate the sprite sequence using `studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/personal-iqbal-anime/build.py -- render`; render the 885-frame Remotion composition, then `studio/heavy.sh studio/.venv/bin/python work/reference-DfgtetEsqUB/finish-anime.py`.

Use the same original audio and caption timings; no HeyGen, business branding, resource page, keyword rule, posting or scheduling. Final file: `Andalus-anime-walking.mp4` in the chat output folder and dated Downloads/Personal folder. The following photo specification is retained only as revision history.

---

# Andalus — corrected personal photo animation

Reference: https://www.instagram.com/reel/DfgtetEsqUB/ by @multazimmominx.
Owner: separate personal video; later correction “Yes—animate my photos, no HeyGen.” Remove every source video frame. Retain only original recitation/music and caption meaning. No titles, haze, business branding or publication.

Source: 1916×1080, 25 fps, 35.409 s. Six verse boundaries: 0, 5.76, 10.60, 15.36, 19.80, 24.24; spoken captions originally finish at 30.72. Preserve natural pacing and unmodified audio; hold the last photo and caption through the remaining music. No forced portrait crop.

Generate three landscape photo scenes using verified Hammad identity photo `studio/.local/jobs/6eea2483df7b/look/hammad-ref.jpg`: terrace / river / courtyard. Reuse his olive overshirt and white tee, natural face and closed mouth. No other people. Built-in image generation only; all prompts recorded in `image-prompts-v2.json`. Images saved in `studio/remotion/public/personal-iqbal-v2`.

| Frames (25 fps) | Photo | Camera move |
|---|---|---|
| 0–143 | terrace | gentle push 1.025→1.07, small horizontal drift |
| 144–264 | terrace | closer framing, pull 1.17→1.13 |
| 265–383 | river | gentle push 1.035→1.075 |
| 384–494 | river | closer framing, pull 1.15→1.105 |
| 495–605 | courtyard | gentle push 1.02→1.055 |
| 606–884 | courtyard | closer framing, push 1.10→1.14 through the music tail |

Hard cuts on verse boundaries avoid face-dissolve ghosting. Upper transform origin preserves hair/head. Photo motion only; no claim of character animation, walking, lip sync or actual travel footage.

Captions occupy a deep-olive band y=850–1080: Arabic Amiri 43 px muted gold; Roman Urdu Inter 30 px cream; English Instrument Serif 39 px. Clean the reference’s transcription/spelling. Six complete lines with no overlays or credit cards; attribution lives in README. Captions are on frame zero and held through the end.

Render standalone `studio/remotion/src/personal-iqbal/photos.tsx`, composition `PersonalIqbalPhotos`, 1920×1080,25 fps,885 frames,H.264/yuv420p/limited Rec.709,CRF18,concurrency2 via `studio/heavy.sh`. Mux unchanged AAC source using `-c:a copy`; no new music, processing or timing change. Audio SHA256 must match `b229796744bdec6b4d37510a3598c52eab84ca0459ab1bbee224209a42dbb67e`; source −14.36 LUFS / −1.51 dBTP.

Skills consulted: video-intake, video-effects, video-sound, video-check, imagegen, Remotion create/markup/render. The 20 talking-head effects are not automatically stacked; restrained camera motion suits this personal poetry brief. Quality: inspect full 1 fps filmstrip and enlarged first/river/last frames, head and caption margins, metadata, frame count, source-identical audio. No HeyGen credits.

The earlier `index.tsx` / `Andalus-personal-edit.mp4` are history only and are superseded. Current output: chat workspace `outputs/Personal-Iqbal/Andalus-personal-photos.mp4` and `~/Downloads/9 November/Personal/Andalus-personal-photos.mp4`.
