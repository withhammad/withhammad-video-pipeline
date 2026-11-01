# Brief: rebuild one AI Central guide in our template

You rebuild ONE existing AI Central carousel as a WithHammad guide. Owner rule: copy the reference's structure and topic
exactly, change only colours (the template already does) and fix wrong or outdated facts. Never invent.

Read first: docs/profile-seo/ref-aicentral/README.md (template + caption formula; look at the PNGs there),
the finished example outputs/guides/claude-academy/ (guide.json, captions.json, sheet.jpg), and
studio/remotion/src/brand/GuideDoc.tsx (page kinds and fields).

## Steps
1. Research every item on its OFFICIAL page (vendor site, GitHub repo, docs). Record the URL and today's date.
   Numbers (users, stars, prices, contacts) only when the official page states them today; otherwise drop the number.
   An item that no longer exists or is paid-only when the reference says free: replace or drop it, and say so in your report.
2. Screenshots: one real screenshot per item page, light mode, 1440x900, of the item's official page:
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
     --window-size=1440,900 --blink-settings=preferredColorScheme=1 --virtual-time-budget=10000 \
     --screenshot=<abs path> <url>
   Save to studio/remotion/public/guides/<slug>/shots/<item>.png and Read each one: a cookie wall, captcha, blank or
   error page is not acceptable. Try the product's docs/GitHub/pricing page instead. Never bypass bot checks.
   Prompt guides use `prompt` (a copy-paste prompt you write, <= 380 chars) instead of `shot`.
3. Write outputs/guides/<slug>/guide.json: {"docTitle", "keyword" (one UPPERCASE word, not used by another guide or
   reel: check work/site/withhammad-rebuild/src/content/dm-rules.json), "source" (official URLs + "checked 1 Nov 2026"),
   "reference" (the AI Central post title + page count, and the original creator if they credited one),
   "instagram": [...max 20 pages...], "linkedin": [...]}.
   Page order like the reference: cover, promise, one item per page (n, title <= 2 lines, what, bestFor, shot+callout
   or prompt, meta optional), optional "more", library (copy the claude-academy library page as is), cta.
   Instagram cta: stamp1 "Comment <KEYWORD>", stamp2 "I'll DM you every link". LinkedIn cta: stamp1 "Get every free
   guide here", stamp2 "VISIT WITHHAMMAD.COM/RESOURCES". Callout text for tools: "Try it here" / "Get it here" /
   "Start the course here" as fits.
4. Write outputs/guides/<slug>/captions.json in the AI Central caption formula (README), our own wording, never their
   sentences copied. Instagram: ends with "Comment <KEYWORD> and I'll DM you every link." + "Follow @withhammad.ai so
   the DM reaches you." + max 5 hashtags. LinkedIn: no comment gate, P.S. link https://withhammad.com/resources,
   a closing question, max 3 hashtags. Facebook: own wording, withhammad.com/resources link, max 3 hashtags.
   If the reference credited a creator, keep "Content credit: <name>" (and "Format: AI Central" is not needed).
   "title": the LinkedIn document title.
5. Render, check, build, look:
   cd studio/remotion && node src/brand/render-guide.mjs ../../outputs/guides/<slug>     (PAGES=3,5 re-renders some)
   cd studio && .venv/bin/python -m app.guide check <slug>   (must be 0 errors)
   cd studio && .venv/bin/python -m app.guide build <slug>
   Read sheet.jpg and at least 3 full pages: no text overflowing into the screenshot or footer, no clipped words,
   no empty-looking page. Fix and re-render.
Do not commit, post, schedule, edit shared code (GuideDoc.tsx etc.) or touch other guides. If the template cannot
show something, say so in the report instead of editing it. Scratch files go in your own subfolder of the session
scratchpad, named after your slug.

Report: slug, keyword, page counts, what changed versus the reference (facts fixed, items dropped/replaced and why),
the sheet path.
