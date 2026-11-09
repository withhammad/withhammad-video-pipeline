# Personal valley walking sample

This is a short motion sample, **approved by the owner on 9 November with “Use this for the full video,”** subsequently extended into the full 35.409-second personal film on 10 November. The owner rejected the previous flat illustrated puppet. This version uses actual 3D geometry and a humanoid skeleton; it preserves the existing valley painting and the original audio/caption timing. It must never enter the business inbox or posting queue. The approved MP4 hash is `10a3f235aa8eced2fe7b200bfc4a67ff778a913acda0aec139708a27af858fc7`; changing the character or motion does not inherit that approval automatically.

## Sources and attribution

- MPFB human generator: [MakeHuman Community](https://github.com/makehumancommunity/mpfb2), pinned at `6ff1eb358f6c1959ced77e79e6dd2406d9a71f49`. Code GPLv3; generated mesh and system assets CC0, per its `LICENSE.md` and `LICENSE.ASSETS.md`.
- Skin, eyes, hair `short04`, casual trousers/tee and `shoes05`: [MakeHuman system assets](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html), CC0.
- Olive shirt geometry: **Elvaerwyn**, `elvs_male_shirt_untucked_bd1`, [Shirts 02 pack](https://static.makehumancommunity.org/assets/assetpacks/shirts02.html), CC-BY as declared in the pack. Adapted fit, colour, material and layering.
- Walk: **Quaternius**, `Walk_Loop`, [Universal Animation Library](https://quaternius.itch.io/universal-animation-library), CC0. The public glTF mirror is pinned at `e24c23cf2a1323488a3faa226ea7ea21f644b73e` in [J-Ponzo/gltf-universal-animation-library](https://github.com/J-Ponzo/gltf-universal-animation-library).
- Identity texture: the owner's existing `studio/.local/jobs/6eea2483df7b/look/hammad-ref.jpg`. Fitted onto an editable human mesh; this is an artistic recreation, not a 3D scan.
- Scenery: existing approved-for-reuse valley painting in `studio/remotion/public/personal-iqbal-anime/valley.png`.
- Audio: first complete verse of the owner's supplied personal reference `work/reference-DfgtetEsqUB/reference.mp4`. Reuse the encoded audio packets; no new speech or music.

All work is local and free. No HeyGen or paid generation was submitted.

## Reproduce

Dependencies and asset packs live under ignored `work/personal-iqbal-3d/vendor` and `assets`; use `fetch-assets.py` to recreate them. No addon is installed into the owner's interactive Blender configuration. MPFB registers only in the isolated process and writes its state to the project work directory.

Run from the repository root:

```sh
python3 studio/blender/personal-iqbal-valley/fetch-assets.py
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/personal-iqbal-valley/build.py -- build
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/personal-iqbal-valley/animate.py -- build
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/personal-iqbal-valley/stage.py
studio/heavy.sh /Applications/Blender.app/Contents/MacOS/Blender -b -P studio/blender/personal-iqbal-valley/render.py
```

`build.py` fits anatomy, clothing, skin and identity; `animate.py` retargets the CC0 walk into the fitted armature; `stage.py` bakes the short timeline, derives forward travel from stance feet, and grounds the evaluated shoe soles. `render.py` renders 144 RGBA frames at 25 fps and can resume completed frames. Cycles uses Metal when available. The preview character plate is rendered at 75% resolution; final composition is 1920×1080 with the original full-size valley artwork and captions.

Remotion entry: `studio/remotion/src/personal-iqbal/valley-sample.tsx`, composition `PersonalValleySample`. Its only imagery is the preserved valley and the new Blender-rendered character/shadow plate. Captions retain the earlier Arabic, Roman Urdu and English styles. No retiming of the original audio.

The saved packed project is `work/personal-iqbal-3d/Hammad-valley-sample.blend`. Passing file checks or ground-contact measurements does **not** constitute owner approval of the likeness or animation. Show the short sample first and wait for the owner's feedback before rebuilding the full film.

## Full film

The approved character plate is reused across valley and courtyard shots; the river and terrace are scenic camera moves. Composition `PersonalValleyFilm` in `studio/remotion/src/personal-iqbal/valley-film.tsx` has 885 frames at 25 fps. Render through `studio/heavy.sh`; `package-full.py` remuxes all 765 original AAC packets unchanged and writes the full SRT plus proof. Deliverable `Andalus-Blender-full.mp4` is in the chat output folder and `~/Downloads/10 November/Personal`. No publication is authorized.
