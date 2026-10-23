# Beat map — reference three

Small-model re-transcription is saved in `transcript_small.json`: faster-whisper small, int8 CPU, word timestamps, VAD enabled. Runtime 54.33 s. The installed PyAV call rejected `metadata_errors`; decoding through ffmpeg to float32 PCM allowed the same model to finish without changing dependencies or source media.

333 Whisper word tokens across 79.319 s = **251.9 wpm**. This is fast, near-continuous narration. Do not match it by speeding Hammad up. Keep sequence/proportions but reduce the original script to roughly 190–205 words over ~79 s.

| Beat | Seconds | Words | Wpm | Function |
|---|---:|---:|---:|---|
| Hook | 0.00–6.10 | 27 | 265.6 | Recognizable pile-of-returns pain point, quick remedy |
| Tool examples | 6.10–10.13 | 17 | 252.9 | Names agents and implies broad applicability |
| First prompt | 10.13–16.57 | 25 | 233.1 | Concrete instruction to scan mail and list returns |
| Process | 16.57–28.60 | 44 | 219.4 | Inbox → orders → policy → numbered list |
| Extra payoff | 28.60–35.50 | 33 | 287.0 | Discover overlooked eligible purchases |
| Select and delegate | 35.50–46.30 | 47 | 261.1 | Choose items, then broad handle-it instruction |
| Social-proof anecdote | 46.30–59.50 | 43 | 195.5 | Colleague glasses return, label and location story |
| Personal payoff | 59.50–68.30 | 46 | 313.6 | Clutter joke and possible savings |
| Business analogy | 68.30–73.30 | 23 | 276.0 | Apply concept to subscriptions |
| Identity and follow | 73.30–79.32 | 28 | 279.1 | Creator authority and follow CTA |

Word allocation uses each token’s midpoint against the visual beat boundary, so boundary words may differ from sentence counts. Normalized contraction counts are not interchangeable with Whisper tokens.

Likely ASR repairs: Muse and Instinct are two names, not one product; Allie K. Miller is spelled on the lower third; the base model misheard “I’ll wear it one day. You’re not gonna wear it.”; the small model fixes this. The first “But” is uncertain and irrelevant to our original script.

The threshold silence check (-40 dB, ≥150 ms) detects internal spans 6.048–6.200 and 46.188–46.436 s, totaling 0.399 s (0.50% of the full source), plus 0.202 s at the end. These are source-audio threshold measurements, not an isolated-voice pause share. They cannot establish background music presence/absence or replace listening. Do not use them as a target for Hammad; retain natural breathing and sentence endings.

The reference CTA is a follow request with an authority lower third. The post caption offers a direct cheat-sheet URL. There is **no spoken comment-keyword CTA**. Do not claim a resource is already live or a DM automation exists.
