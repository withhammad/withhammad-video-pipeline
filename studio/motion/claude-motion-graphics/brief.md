# Motion brief (paste this under the style file)

Make one animation as a single HTML file that opens by double-click in any browser.

- Canvas: 560 x 500, scaled to fit the window, centred. Light or dark background from the style file only.
- One object, one change: the scene line below names both. Nothing else moves except a slow ambient drift.
- Loop: exactly 6 seconds, and the last frame equals the first, so it can repeat forever without a jump.
- Draw every frame from the time alone (t = seconds % 6). No setTimeout chains and no CSS animations that
  drift: it must look the same on every play and every machine.
- Use the style file's colours, corners, shadow, curve and font. No logos, no brand names, no photos.
- Keep it light: canvas or plain DOM and CSS, no libraries, under 200 lines.
- Expose window.__seek(t) that draws the frame at t seconds, so the loop can be recorded frame by frame.

Scene: [OBJECT] -> [CHANGE]: [one sentence: what it looks like and what happens]
