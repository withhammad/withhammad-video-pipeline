# Carousel spec (owner rules 2026-11-01)

One save-worthy guide carousel per reel, posted on Instagram (@withhammad.ai, Collab @hammadagentic.ai), the Facebook
Page "With Hammad AI" and LinkedIn (PDF document post). Format reference: the AI Central and Y Combinator LinkedIn
feeds (docs/profile-seo/references.md): one idea per slide, numbered steps, a stat with its source, copy-paste prompts
or commands, "save this guide", a comment-keyword ending on Instagram and the guide link on LinkedIn.

## Files per job (`studio/.local/jobs/<job>/carousel/`)

`slides.json`
```json
{"accent": "blue",
 "instagram": [ {"kind": "cover", "job": "<job>"}, ...6-8 content slides..., {"kind": "end", ...} ],
 "linkedin":  [ {"kind": "cover", "job": "<job>"}, ...same content slides..., {"kind": "end", ...} ]}
```
- 6 to 10 slides per platform. Slide 1 is always `{"kind": "cover", "job": "<job>"}` (the reel's glow cover, same click-first hook).
- Content slides are the same on both platforms; only the end slide differs.
- `*word*` puts that word in the blue accent box. One punch per title.

Slide kinds (studio/remotion/src/brand/Carousel.tsx):
| kind | fields | use for |
|---|---|---|
| stat | kicker, value (big, e.g. "4.4x", "26.1%"), label (with one *punch*), sub, source (who + when) | one number that matters, always with its source |
| step | n, of, title (*punch*), body (1-2 short sentences), code? (one shell command), chips? [{text, tone: good/warn/bad/dim/plain}] | how-to steps, numbered |
| compare | title, before {label,name,value,verdict,tone}, after {...}, note? | before/after, X vs Y |
| quote | quote, by | one sentence takeaway |
| terminal | title, cmd, lines [{text, tone?}], source? | a real command and its output |
| logos | kicker, title, logos [{logo: <LOGO key from studio/remotion/src/brand/glowCovers.ts>, label}] (2-4) | tools involved |
| end (instagram) | headline ("Want the guide?"), keyword (the reel's lesson.manychat_keyword), sub ("I'll DM you ..."), face: "glow" | comment-keyword ending |
| end (linkedin) | headline ("Get the free guide"), link ("withhammad.com/resources/<slug>"), sub ("Link in the post. ..."), face: "glow" | link ending, no comment gate |

Rules: facts only from the job's lesson.json, analysis/facts.md, seo/seo.json; every number keeps its source and date;
no invented numbers; titles <= 60 characters; body copy short (it is read on a phone); never the words "AI avatar" on a
slide; branding only WITHHAMMAD (the chrome adds it).

`captions.json`
```json
{"title": "<= 60 chars, PDF document title for LinkedIn",
 "instagram": "...", "facebook": "...", "linkedin": "..."}
```
- Instagram: line 1 hook with the reel's primary keyword (first 125 chars), a short numbered list of what the slides
  teach (emoji numbers ok, AI Central style), "Save this guide. ♻️ Share it with someone who needs it.",
  "Comment <KEYWORD> and I'll DM you the guide.", "Follow @withhammad.ai so the DM reaches you.", then max 5 hashtags.
  One disclosure line "Cover: AI image of me." only if the cover face is the AI pose (it always is).
- Facebook: own wording, the guide URL https://withhammad.com/resources/<slug>, "Follow With Hammad AI", 1-3 hashtags.
- LinkedIn: professional search terms in the first 210 chars, the guide URL, no comment gate, ends with a question,
  0-3 hashtags at the end.
- Never @with.hammad, @hammadagentic.ai or ManyChat.

## Build and check
```
cd studio/remotion && node src/brand/render-carousel.mjs <job>
cd studio && .venv/bin/python -m app.carousel check <job>   # must report 0 errors
cd studio && .venv/bin/python -m app.carousel build <job>   # PDF + carousel_sheet.jpg
```
Look at `carousel_sheet.jpg` (Read the image): no text running off a slide, no slide that is mostly empty, the cover
reads in the grid.
