# Mini Harness reference breakdown

Owner requested the full reference routine on 8 November 2026 and repeated the same link.
Intake recorded once: https://lnkd.in/p/dQVK4qeE . No matching topic was found in the local inbox, job lessons or
video documentation before intake. No generation credits, publishing or scheduling authorized by this intake.

## Source and format

Paweł Huryn's LinkedIn post, activity `7524131596124483584`, share `7524131594962542594`:
https://www.linkedin.com/posts/pawel-huryn_how-to-build-your-own-claude-code-step-by-share-7524131594962542594-Ucne/

This reference is one 800×1000 infographic plus explanatory post text. It contains no video, face, narration or
music. Preserve its ordered 15-part teaching sequence and diagram relationships. No avatar or cloned narration is
needed for a faithful static version. A vertical animated adaptation can reveal the same cards over music; no
source running time exists to apply a ±10% runtime gate to that adaptation.

Reference image and post-only metadata are saved at `work/reference-mini-harness/reference.jpg` and `source.json`.
The source's image viewer also supplied a 1200×1500 version, saved as `reference-hires.jpg` and used for the edit.
The logged-in browser tab was read only. No reaction, comment, message or follow was sent.

## Visual specification

- Charcoal canvas, cream cards, coral diagram nodes and numbered circles. Large white serif headline; compact
  black sans-serif body type. Five groups down the left, three cards per row, 15 cards total.
- Header explains building a coding-agent harness. Keep the hook's meaning in original phrasing and WITHHAMMAD
  branding. Do not claim to be the source author. Credit the reference and link to its MIT-licensed code.
- Every card has a small process diagram above its number/title and one short explanation below it.
- Preserve the arrows, data-flow order, group order and visual distinction between a model, its tools, stored
  context and the user. Reuse appropriate source visual crops when helpful, per the owner's latest instruction;
  use generated assets only where they improve an otherwise missing shot.
- The whole 15-card grid is too dense for a phone reel. A vertical motion adaptation should start with the full
  grid and zoom into the five groups in order, keeping every card legible long enough to read. Static/carousel
  exports can preserve the full-grid overview and one group per slide.

## Beat order

1. Core: reasoning loop, tools, context window.
2. Remembering: sessions, compaction, memory.
3. Safety: permission gate, permission judge, read-only search.
4. Working with the user: clarification, subagents, independent goal review.
5. Extensions and operation: skills/MCP, model costs, interactive/headless modes.
6. WITHHAMMAD closing card, proposed keyword **HARNESS**, link to an original resource guide with the source repo.

## Facts and changes required before publication

Primary source checked 8 November: https://github.com/phuryn/mini-harness . Its README now describes roughly
1,400 Python lines, rather than the LinkedIn post's older 1,200. Avoid a brittle code-size headline.
The code is MIT licensed and built for teaching. Model calls require configured provider keys and may cost money;
"free repository" must not become "free AI usage". The 1–2 hour build time is the author's estimate, not a promise.

The README describes a permission gate, not a sandbox. Keep that distinction. Do not repeat a broad "beats Claude
Code" claim: the source reports specific benchmark samples/configurations and warns that many score differences
fall within variation between runs. Benchmark claims are unnecessary to teach the 15 components.

## Production and approval state

Job `b6b36d9b50b3` has a complete review package. GROWTH cleared production before this render; Chamber remains held
at the voice decision. No third simultaneous heavy render was started. No generation credits were spent.

- 62.4-second motion edit, 1872 frames, 1080×1920 at 30 fps, with all 15 original diagram crops in order.
- Separate LinkedIn ending with a direct-link invitation; the other ending uses proposed keyword HARNESS.
- Original pipeline music, retimed by synthesis to 100 BPM. Both deliveries: -14.03 LUFS, -1.80 dBTP. The master's
  -14 target takes precedence over the generic sound skill's older LinkedIn -12 suggestion.
- Seven 1080×1350 carousel pages plus a seven-page PDF; six glow-template cover sizes; descriptive SRTs;
  six researched caption packs passing `app.repost_queue.seo_caption`.
- Source diagrams credited on every scene/page. Native typography replaces the source's small headings/body copy.
  Diagram windows and file hashes are recorded in the review package's `source-record.json`.

Reproduce through `studio/heavy.sh`: `node studio/revisions/render_mini_harness.mjs --full`, then
`studio/.venv/bin/python studio/revisions/mix_mini_harness.py`. Source assets are in `work/reference-mini-harness`.
The composition and five scene/layout modules are under `studio/remotion/src/miniharness`.

Owner-facing files are in
`/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Mini-Harness/`.
Nothing has been approved, scheduled or published. The resource URL
`https://withhammad.com/resources/build-an-agent-harness` returns 404 as of 8 November, and its keyword rule is not
yet live. After owner approval, prepare the page/rule PR for the owner to merge, then test delivery before booking.

The read-only SEO research also found the YouTube refresh token expired or revoked (`invalid_grant`). An OAuth
reconnect tab was opened in the owner's existing Chrome. Until the owner completes it and identity/scope checks
pass again, API uploads and keyword replies are unavailable. The connection registry records this current state;
the earlier six successful replies are historical evidence, not proof of current authorization.
