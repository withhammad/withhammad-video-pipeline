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
- Total length matches the reference (this one: ~31 s). Script ≈ 2.3 words/s.

## Who does what
1. **HeyGen** (Chrome or MCP): avatar clip only — `avatar.mp4`, plain background, 720p portrait.
2. **Agent session (Opus 5.5)**: writes `edit.json` — scene list with timings, screenshot targets, caption words + emphasis, all aligned to the avatar's word timestamps (from Whisper on `avatar.mp4`).
3. **Agent session**: captures the screenshots (Chrome) into the job folder.
4. **Remotion**: renders `final.mp4` from `avatar.mp4` + `edit.json` + screenshots with one fixed template.
5. Agent checks frames of `final.mp4` before anything is posted.
