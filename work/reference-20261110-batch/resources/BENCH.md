# Fable 5.2 benchmarks: read the scores, then choose your workflow

Draft resource for BENCH. Checked 11 November 2026. This is not a live page or a release approval.

## The comparisons shown in the reel

| Evaluation | Model and result | Comparison |
|---|---|---|
| RoboDojo Sim | Fable 5.2: 64.9% | GPT-6 Astra: 29.8% |
| Remote Labor Index | Fable 5.2: 41.3% | Opus 5.5: 21.3%; GPT-6 Astra: 20.8% |
| Humanity’s Last Exam, with tools | Fable 5.2: 74.2% | GPT-6 Astra: 57.2% |
| FrontierSWE v2 | Fable 5.2: 69.9% | Gemini 4 Carbon: 61.2% |
| OSWorld 2.1, offline partial set | Fable 5.2: 89.3% | GPT-6 Astra: 79.5% |
| Terminal-Bench-Science 0.1 | Fable 5.2: 74.6% | Gemini 4 Carbon: 64.8% |
| CyScenarioBench | Mythos 5.2: 76.3% | GPT-6 Cyber: 61%; different task sets per lab |

These are Anthropic’s reported results, not tests performed by Hammad. Cyber scores are not a like-for-like head-to-head comparison. The selected coding and science comparators do not represent every competitor. Robotics and remote-work scores more than doubled versus Fable 5.1. The Fermat example formalized a known theorem in one reported run; it did not discover the theorem. [Official results and methodology links](https://www.anthropic.com/claude-fable-and-mythos-5-2)

## A practical benchmark checklist

Before applying a chart to your own decision, record:

1. The task you need completed and what a correct result looks like.
2. Whether the evaluation used tools, partial task sets or a different effort setting.
3. Which competitor was selected and which results are absent from the chart.
4. Your own total cost, elapsed time and review effort on a small representative task.
5. Whether errors are easy to detect and reverse in your workflow.

Do not combine percentages from unrelated evaluations into a made-up overall score. A task-completion score also does not tell you how many human jobs a model replaces.

## Choose the model in Claude Code

Update Claude Code and confirm version 2.1.321 or newer. Access also depends on your account and provider. Use the model selector and verify the selected model before a substantial run. On a provider that supports it, the explicit model identifier avoids ambiguity:

```text
/model claude-fable-5-2
```

The `fable` alias normally points to Fable 5.2, but the Claude apps gateway can still map it to Fable 5 unless overridden. Check provider configuration rather than assuming every alias resolves identically. [Official Claude Code model configuration](https://code.claude.com/docs/en/model-config)

## Small evaluation brief

```text
Complete this representative task: [task].
The deliverable must satisfy: [acceptance criteria].
Use only these approved inputs and tools: [scope].
Before any costly or irreversible action, explain the proposed action and cost.
After the work, report the result, checks performed, unresolved errors and usage.
```

Save the same brief and inputs when comparing models. Review the actual output before expanding the task. Choose a cheaper workflow when it meets your quality requirements; reserve demanding models for work that benefits from them.

## What the video shows

Original WITHHAMMAD charts use the values above. The Claude Code panel is a clearly labelled setup illustration, not footage of a live performance test. The visual sequence follows the supplied agentmash reference; it does not adopt the creator’s claims as Hammad’s own results. Narration uses Hammad’s authorized voice clone. No avatar is used.
