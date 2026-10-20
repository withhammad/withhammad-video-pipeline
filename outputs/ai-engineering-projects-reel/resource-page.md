# Pick an AI project you can actually finish

A useful portfolio shows a working system, how you tested it, and what you would improve. Start with one small problem instead of collecting more tutorials.

## The project catalog

[Landed's AI engineering portfolio catalog](https://github.com/landedjobs/ai-engineer-portfolio-projects) lists 85 ideas grouped by theme, with difficulty, skills and learning references. These are project briefs and reference links; not every entry is a complete tutorial. The catalog is MIT licensed. Linked tools have their own licenses and hosting or model costs.

## A practical first build

1. Open the RAG category and choose Document Q&A. Use a few documents you own or have permission to use.
2. Define one question your demo should answer, plus one question it should decline when the answer is absent.
3. Build the smallest version: ingest documents, retrieve relevant passages and answer with sources.
4. Test at least ten questions, including missing answers and conflicting documents. Record what fails.
5. Publish a short demo, setup instructions, sample inputs and results. Remove secrets and private documents.
6. Explain one tradeoff: accuracy, speed, cost or simplicity. A specific limitation is more useful than an unsupported claim.

## Copyable planning prompt

> Help me scope one AI engineering portfolio project from this catalog: https://github.com/landedjobs/ai-engineer-portfolio-projects . My current skills are [skills], I have [hours] this week, and my maximum spend is [budget]. Recommend one suitable idea and explain the choice. Give me a smallest working version, milestones, ten evaluation cases, expected dependencies and costs, and a README outline. Separate verified facts from assumptions. Do not invent integrations, benchmark results or work I have not done.

## Before you share your demo

- Does it run from your README on a clean environment?
- Can someone see an example input and output within a minute?
- Are failures, costs and required keys documented?
- Are citations backed by the actual source text?
- Did you remove tokens, customer data and personal records?
- Can you explain what you built without claiming guaranteed interviews or employment?

Compiled by Hammad Yousuf. Catalog checked 20 October 2026; project availability and dependencies can change.
