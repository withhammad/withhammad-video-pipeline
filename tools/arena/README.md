# Model arena: Fable 5.2 vs GPT-6.2 Astra

Same one-shot prompt (`tasks.json`), each in an empty git worktree, no follow-ups.

| Side | How it runs | Numbers from |
|---|---|---|
| Fable 5.2 | Claude Code (subagent on `fable`, or `run_side.sh fable <task>` from a normal shell) | `transcript_stats.py` on the transcript, or `view.py` on stream-json |
| GPT-6.2 Astra | `run_side.sh astra <task>`: Codex CLI on the OpenAI API, through `cap_proxy.py` | `view.py` on `codex exec --json` |

**Spend cap (Astra).** `cap_proxy.py` sits between Codex and api.openai.com. It adds every
response's usage to `astra_ledger.json` at conservative list price (cached input billed at the
full $8/MTok), bounds each request to 32k output tokens, and answers HTTP 429 to any new
request once ledger + worst-case request (~$2.88) would pass $20 total or $6 for the task.
Needs `OPENAI_API_KEY=` in `work/.secrets/studio.env` (never in chat, never in git). Setting
a matching budget limit on the OpenAI project is a second guard.

**Recording.** This Mac denies screen capture to agent sessions (FFmpeg sees only the
wallpaper), so the video uses: (1) a terminal replay rendered from the timed log of each run,
(2) a real Playwright browser recording of each output via `capture_output.mjs`.

**Cost formula (both sides):** tokens x list price, $8 in / $40 out per MTok; Fable cache read
0.1x / write 1.25x (Anthropic docs). The Astra cached-input rate is an assumption until checked
on openai.com/api/pricing.
