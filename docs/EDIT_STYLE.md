# Edit style (stage 5 — Remotion)

Derived from the first reference reel (job `09a9d211fff0`), see `assets/reference-edit-style.jpg`.
The owner wants every video to look like the reference — same structure and edit style — with
Hammad's HeyGen avatar as the presenter. Wording is always our own (no verbatim copying of
another creator's script) and facts are verified.

## Canvas
- 720×1280 (9:16), 30 fps, 720p output (owner preference). Light, soft background (pale blue-grey with a faint texture).

## Layout (the default "split" scene)
- **Bottom ~55%:** the HeyGen avatar, framed chest-up, centred.
- **Top ~40%:** a floating "browser window" card (rounded corners, macOS traffic lights, URL bar, thin blue outline, soft shadow) showing a real screenshot of what is being talked about (GitHub repo, README section, docs page). The card slowly zooms/pans; key phrases get a blue highlight box.
- **Middle band:** one-to-three-word captions, bold black sans-serif, centred, synced word-by-word to the voice. Emphasis words switch to **blue italic serif** (e.g. *every*, *final output*).

## Other scene types
- **Title card (0–3 s):** two-line title, line 1 black bold ("Reverse Engineer"), line 2 white text in a blue pill ("Any App"), small app icons underneath, over a browser card.
- **Full-screen B-roll:** dark terminal or code screen full-bleed with the caption in white bold + blue italic emphasis. Used 1–2 times for pace.
- **End card:** avatar full-frame, closer zoom, the CTA word ("comment") in white italic serif over the chest.

## Pacing
- A visual change every 1.5–3 s (card swap, zoom, B-roll cut). Captions change every word or two.
- Total length matches the reference (this one: ~31 s).
- No dead air. The reference editor jump-cuts its pauses (2–4 % of the reel is pause, 262 wpm); HeyGen leaves
  250–640 ms at every full stop (our first reel: 13–20 % dead air, 196 wpm). `app.tighten` cuts them in picture and
  sound together: ≤ 220 ms after a sentence end, ≤ 120 ms mid-sentence, word endings protected, no cut under 120 ms.
- Jump cuts are always masked: put a cutaway (screen recording, full-screen B-roll) over a cut first; every cut left on
  the avatar gets a hard (0 ms) scale step alternating 1.00/1.06, so the head jump reads as a punch-in.

## Script (for the HeyGen take)
- Flowing sentences joined with "and", "so" and commas; no one-to-four-word fragments ("Free. Open source."): every
  full stop costs a TTS pause. Exclamation marks on the hook and the CTA only.
- ~80 words per 22 s (≈ 3.6 words/s after tightening; the old 2.3 words/s left the reel slow).
- Brand acronyms spelled the way they are said, in the HeyGen script only ("REA" was heard as "Ray"); captions and
  on-screen text keep the real spelling. Confirm the pronunciation with the owner once per brand.

## Who does what
1. **HeyGen** (Chrome or MCP): avatar clip only — `avatar.mp4`, plain background, 720p portrait.
2. **Agent session (Opus 5.5)**: writes `edit.json` — scene list with timings, screenshot targets, caption words + emphasis, all aligned to the avatar's word timestamps (Whisper runs once on the HeyGen take; `app.tighten` remaps the words onto the tightened `avatar.mp4`). Broll scenes go on the words around the jump cuts in `cuts.json`.
3. **Agent session**: captures the screenshots (Chrome) into the job folder.
4. **Remotion**: renders `final.mp4` from `avatar.mp4` + `edit.json` + screenshots with one fixed template.
5. Agent checks frames of `final.mp4` before anything is posted.
