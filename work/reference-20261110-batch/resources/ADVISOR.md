# Opus builds, Fable advises

Checked 10 November 2026. Keyword: **ADVISOR**.

## Setup

Fable 5.2 needs Claude Code **2.1.321 or later** and an account/provider with Fable access.

```bash
claude update
claude --version
```

Inside Claude Code:

```text
/model opus
/advisor fable
```

Confirm the displayed main model is Opus 5.5 and the advisor is Fable 5.2. The advisor setting normally persists
across sessions. To use an advisor for only a single session, the documented CLI form is:

```bash
claude --model opus --advisor fable
```

## If it asks about usage credits

On plans requiring one-time Fable billing consent, `/advisor fable` may point you to `/model fable`. Read the
billing terms yourself and accept only if you agree. Then select Opus again and enable the Fable advisor.
Do not assume a launch promotion or reset applies to every account.

## A useful task prompt

> Implement the changes described in SPEC.md. Read the existing code and tests first. Consult the advisor before
> committing to the approach, if the same error recurs, and before declaring the work complete. Keep a concise
> record of the plan, changes and verification. Ask before paid external actions or publishing anything.

The model decides when to consult. It does not invoke Fable on every turn, and an advisor is not a second worker
independently executing all tasks. Watch `/usage`. To stop using the advisor:

```text
/advisor off
```

## What the comparison means

Charlie Hills's supplied seven-build demonstration reported **$39.29** with Fable alone and **$25.81** with
Opus plus Fable advisor—about **34% lower in that experiment**. Opus alone was cheaper still. These are the
creator's reported results, not Hammad's tests, a price quote, or a guaranteed saving.

The advisor is experimental. Its tokens add to the main model's usage, it receives the conversation context,
and availability differs by provider and organizational settings. Official docs currently describe Anthropic API
infrastructure, including subscription accounts, and exclude Bedrock, Claude Platform on AWS, Google Cloud Agent
Platform and Microsoft Foundry for this feature.

Sources: [advisor documentation](https://code.claude.com/docs/en/advisor),
[model configuration](https://code.claude.com/docs/en/model-config),
[Charlie Hills's demonstration](https://www.instagram.com/reel/DfiuRiRBE2i/).
