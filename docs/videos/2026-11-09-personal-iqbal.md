# Andalus — full Blender personal film

**Current status: full 35.409-second film FINISHED on 10 November.** The owner said “Use this for the full video.” The 5.76-second preview uses an actual 3D human mesh, Hammad photo texture, a free Quaternius walk, grounded travel and Cycles contact shadows. Original first-verse audio/captions and valley painting are retained. The full film extends that approved treatment across valley and courtyard shots, with river/terrace scenery between verses. No publication is authorized.

Full file: `/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal/Andalus-Blender-full.mp4`; matching SRT and copy in `~/Downloads/10 November/Personal`. All 765 original AAC packet hashes and timestamps match; 885 frames, 1920×1080, 25 fps, limited Rec.709. Full filmstrip and representative large frames reviewed. Proof: `outputs/personal/reviews/2026-11-10-valley-full.json`.

Approved sample: `/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal/Valley-Blender-walk-sample.mp4`. 1920×1080, 25 fps, 144 frames, H.264, limited Rec.709. All 127 source AAC packets in the excerpt are unchanged; first PTS matches. SHA256 `10a3f235aa8eced2fe7b200bfc4a67ff778a913acda0aec139708a27af858fc7`. Full-size first/last frames and 6 fps motion sheet inspected. Owner approval establishes the character/movement direction; technical checks alone do not.

Editable packed project: `Hammad-valley-sample.blend` beside the sample and in Downloads. Reproduction and asset attribution: `studio/blender/personal-iqbal-valley/README.md`; composition `PersonalValleySample`. Generated human mesh/system assets and Quaternius walk are CC0; olive shirt by Elvaerwyn is CC-BY. This is an artistic reconstruction from his photo, not a scan. Zero HeyGen or external paid generation.

## Rejected v3 history — do not use as the replacement

The owner rejected the earlier character treatment and walking on 9 November. The scenery was accepted for reuse. All descriptions below refer to the rejected v3 and earlier revisions.


Reference: https://www.instagram.com/reel/DfgtetEsqUB/

Latest owner brief: make an anime/cartoon of Hammad walking through outdoor scenes and valleys, animated in Blender or code. Keep original audio and captions. He explicitly says **personal use only, not for his business accounts**. Excluded from business inbox, website, keyword rules and posting queue.

Rejected v3 video: `/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Personal-Iqbal/Andalus-anime-walking.mp4`.
Downloads: `~/Downloads/9 November/Personal/Andalus-anime-walking.mp4`.

Blender 5.2.3 LTS renders a 17-bone skinned anime character with independently keyed knees, feet, counter-swinging arms, spine, head, blinks and hair. Remotion composites its 150-frame walking cycle on travelling paths through a terrace, mountain valley, river promenade and courtyard. This is layered 2D anime character animation; the camera is fixed while the character moves. The illustration preserves his saved-photo identity and olive overshirt/white tee. Built-in image generation supplied the original artwork. No HeyGen or paid generation credits.

35.409 seconds,1920×1080,25 fps,885 H.264 frames,yuv420p,limited-range Rec.709. Full 1 fps filmstrip,4 fps opening walk sheet,valley preview and last frame inspected. All 150 character PNGs are complete; minimum silhouette coverage is 99.2% of maximum, catching the early limb-disappearance defect before final rendering. Original audio measures −14.36 LUFS / −1.51 dBTP and its encoded payload remains byte-identical: `b229796744bdec6b4d37510a3598c52eab84ca0459ab1bbee224209a42dbb67e`.

Final SHA256: `af9e199040e0ba941e3d6d9f451cfbda5efc613f44aabf7a337103ed772f218d`. File is 11,055,335 bytes. No original video imagery, title cards or business branding. Arabic, Roman Urdu and English captions retained. No publication or scheduling.

The earlier `Andalus-personal-edit.mp4` (source footage) and `Andalus-personal-photos.mp4` (photo camera motion) are superseded and must not be presented as the current requested edit.

Reproduction: `studio/blender/personal-iqbal-anime/build.py`; `studio/remotion/src/personal-iqbal/anime.tsx`, composition `PersonalIqbalAnime`; assets in `studio/remotion/public/personal-iqbal-anime`; generation prompts and `.blend` in `work/reference-DfgtetEsqUB/anime`; final mux/check script `work/reference-DfgtetEsqUB/finish-anime.py`. Heavy jobs use `studio/heavy.sh`. Blender project is also beside the delivered video.

Audio source: owner-supplied @multazimmominx reel. Poem: Allama Iqbal, Tarana-e-Milli, checked against [Iqbal Academy Pakistan](https://allamaiqbal.com/poetry.php?bookbup=22&conType=ur&lang=4&lang_code=ur&orderno=102). Illustrated scenes are fictional creative imagery, not evidence of a visit.

Repository validation before commit: 646 studio tests passed, one existing Starlette/AnyIO warning, 85.21 seconds.
