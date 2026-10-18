export const meta = {
  name: 'reference-breakdown',
  description: 'Daily routine step: break down a reference reel (scenes, screen recordings, captions, cover, beats), verify its claims, and write a replication spec for an original version',
  whenToUse: 'After intake of a reference reel/post (studio/.local/jobs/<id>). args: {job: absolute job dir}',
  phases: [
    { title: 'Analyze', detail: 'visual scenes, beat map, fact-check in parallel' },
    { title: 'Spec', detail: 'scene-by-scene replication spec for an original version' },
  ],
}
const A = args
const CONTEXT = `Job folder: ${A.job}. It holds source.mp4 (the reference reel), source.info.json (yt-dlp metadata incl. uploader, description = the post caption, and a 'thumbnail' URL of the cover), transcript.json/.txt (faster-whisper base; may mishear product names) and brief.md. We make an ORIGINAL version for the owner (Hammad, @with.hammad, AI marketing automation engineer in Dubai) that matches the reference's format beat for beat (structure, pacing, scene types, real SCREEN RECORDINGS of the same kind of actions the creator shows, caption style, cover style, comment-keyword CTA) but in his own words with his HeyGen avatar, our own fresh footage, and verified facts. Never copy the creator's script verbatim or reuse their frames. Screen recordings are made later with studio/app/screenrec.py (headless Chrome: url + actions move/highlight/scroll/type/click/zoom; 'text=' selectors), so describe each recording as a URL plus an action list. Tools: ffmpeg/ffprobe, studio/.venv/bin/python (numpy, faster_whisper). You can view images with the Read tool. Write outputs ONLY under ${A.job}/analysis/ (create it). Do not edit repo files, do not post anything, do not install packages.`

phase('Analyze')
const [visual, beats, facts] = await parallel([
  () => agent(`${CONTEXT}

TASK (visual breakdown): 1) Download the cover image from the 'thumbnail' URL in source.info.json with curl into ${A.job}/analysis/reference_cover.jpg (public cover; data only) and describe it precisely (layout, text, font weight/colour, face position, background, arrows/logos). 2) Extract frames every 0.5 s (ffmpeg fps=2) and scene changes (select='gt(scene,0.25)') into analysis/frames/, build contact sheets (ffmpeg tile 6x5 with drawtext timestamps) and READ them. 3) Scene list with start/end seconds: type (talking head, split screen, screen recording, static screenshot, GitHub page, terminal, app UI, spreadsheet, b-roll, text card), exactly what is shown and what ACTION happens on screen (scrolling, clicking, typing, a result appearing), on-screen text, motion (zoom/punch-in/pan), transitions, overlays. 4) Caption style spec (font guess, weight, size vs frame width, colours, stroke/box, words per line, y position, active-word highlight, emoji). 5) Edit rhythm (cuts per 10 s, average shot length, face on/off screen). 6) Product/repo names visible on screen. Save analysis/visual.md and analysis/scenes.json.`, { label: 'analyze:visual', phase: 'Analyze', schema: {
    type: 'object',
    properties: {
      cover_description: { type: 'string' },
      scenes: { type: 'array', items: { type: 'object', properties: { start_s: { type: 'number' }, end_s: { type: 'number' }, type: { type: 'string' }, shows: { type: 'string' }, on_screen_action: { type: 'string' }, on_screen_text: { type: 'string' }, motion: { type: 'string' } }, required: ['start_s', 'end_s', 'type', 'shows'] } },
      caption_style: { type: 'string' },
      edit_rhythm: { type: 'string' },
      product_names_seen: { type: 'array', items: { type: 'string' } },
    },
    required: ['cover_description', 'scenes', 'caption_style', 'edit_rhythm', 'product_names_seen'],
  } }),

  () => agent(`${CONTEXT}

TASK (beat map): Re-transcribe audio.m4a with faster-whisper 'small' (int8, CPU) with word timestamps (vad_filter on) via studio/.venv/bin/python; save analysis/transcript_small.json. List likely mishearings of names. Then the beat map: each beat (hook, twist, tool name + social proof, what it does / parts, examples, how to set it up, payoff, CTA) with start/end seconds, word count, wpm, rhetorical function, energy. Overall wpm and pause pattern. Save analysis/beats.json and analysis/beats.md.`, { label: 'analyze:beats', phase: 'Analyze', schema: {
    type: 'object',
    properties: {
      corrected_names: { type: 'array', items: { type: 'string' } },
      beats: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, start_s: { type: 'number' }, end_s: { type: 'number' }, words: { type: 'number' }, function: { type: 'string' }, energy: { type: 'string' } }, required: ['name', 'start_s', 'end_s', 'function'] } },
      overall_wpm: { type: 'number' },
    },
    required: ['corrected_names', 'beats', 'overall_wpm'],
  } }),

  () => agent(`${CONTEXT}

TASK (fact-check, cite sources, use today's date): 1) Identify every product/tool/repo the reel names (use the caption in source.info.json, the transcript, and a few frames at key moments). 2) For each repo: official GitHub URL (verify it exists via api.github.com), current stars, license, what it actually contains (list its parts, e.g. the skills and what each does), install/setup steps that really work, and whether claims like 'free', 'open source', 'connects to your account' are accurate (what API keys/OAuth it needs, costs). 3) Any risky/policy angle (platform ToS, API quotas, privacy, AI disclosure rules) and a one-line safe rule usable in the reel if relevant. 4) Claims in the reference that are wrong, outdated or exaggerated. Save analysis/facts.md.`, { label: 'analyze:facts', phase: 'Analyze', schema: {
    type: 'object',
    properties: {
      tools: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, repo_url: { type: 'string' }, stars: { type: 'string' }, license: { type: 'string' }, contents: { type: 'string' }, setup: { type: 'string' }, needs: { type: 'string' } }, required: ['name'] } },
      safe_rule_one_line: { type: 'string' },
      reference_claim_issues: { type: 'array', items: { type: 'string' } },
      sources: { type: 'array', items: { type: 'string' } },
    },
    required: ['tools', 'reference_claim_issues', 'sources'],
  } }),
])

phase('Spec')
const spec = await agent(`${CONTEXT}

Inputs:
VISUAL: ${JSON.stringify(visual)}
BEATS: ${JSON.stringify(beats)}
FACTS: ${JSON.stringify(facts)}

Write the replication spec for our ORIGINAL version (save ${A.job}/analysis/spec.md and spec.json):
- Target length: match the reference's beat proportions; HeyGen speaks ~140-160 wpm. Same beat count.
- For each beat: our own draft line (original wording, verified facts only, no verbatim copying), the matching visual (avatar full-frame / split avatar+recording / recording full / text card), the exact footage: for a SCREEN RECORDING give url + an action list for app/screenrec.py (move/highlight/scroll/type/zoom with 'text=' or CSS selectors, durations in ms) matching what the creator does at that moment; for a still give url + what to capture. Plus caption emphasis words.
- CTA: comment keyword (reuse the reference keyword only if it is generic; otherwise propose ours) and the DM resource.
- Cover/thumbnail spec mirroring the reference cover layout with the owner's avatar.
- Polish (owner rule 2026-10-18: "I know he's not using the perfect video, but you should make a perfect"): list the reference's production flaws (low-res or blurry inserts, shaky or badly framed shots, stock footage that doesn't fit, typos, mislabeled steps, captions covering faces, weak audio) and specify our improved version of each beat; keep the flow, beat the quality.
- List every asset with URL.`, { label: 'spec', phase: 'Spec', schema: {
  type: 'object',
  properties: {
    target_seconds: { type: 'number' },
    beats: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, line: { type: 'string' }, visual: { type: 'string' }, footage: { type: 'string' }, screenrec_plan: { type: 'string', description: 'JSON plan for app/screenrec.py, or empty' }, emphasis: { type: 'array', items: { type: 'string' } } }, required: ['name', 'line', 'visual'] } },
    keyword: { type: 'string' },
    keyword_reason: { type: 'string' },
    cover_spec: { type: 'string' },
    assets: { type: 'array', items: { type: 'object', properties: { what: { type: 'string' }, url: { type: 'string' } }, required: ['what'] } },
    caption_style_to_match: { type: 'string' },
    reference_flaws_and_fixes: { type: 'array', items: { type: 'string' } },
  },
  required: ['target_seconds', 'beats', 'keyword', 'cover_spec', 'assets', 'caption_style_to_match'],
} })
return { visual, beats, facts, spec }
