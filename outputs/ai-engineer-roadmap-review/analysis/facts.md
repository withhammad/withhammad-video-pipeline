# AI engineer roadmap — factual review

Checked: **23 October 2026**. Review only; no publishing, scheduling, account changes or paid services. Reference: Instagram carousel `DerD5keCJgy`. Slide sequence comes from the parent agent's visual review of all ten slides; this pass verifies the proposed educational claims and resources, not reference performance.

## Corrections for the original carousel

| Claim or framing | Finding | Use in our version |
|---|---|---|
| Six stages in 12 months | Six stages is a useful editorial structure. The reviewed sources do not establish a universal completion time across learners or a guaranteed career outcome. | “6 stages. Build your way through.” Advance by the demonstrated milestones in resources.md. |
| Job-ready after the roadmap | Unsupported as a guarantee; courses and completed projects do not prove readiness for every role. | “Build a portfolio you can explain, test and improve.” |
| Free resources | Accurate for the linked learning material. It does not mean all models, compute, certificates, API calls or hosting are free. | “Free learning resources” with “Compute and API costs may apply.” |
| Learn everything in one course | Incorrect for the proposed syllabus. CS50P is Python; Google MLCC focuses on ML concepts; PyTorch Basics is a training workflow; HF LLM covers the Transformers ecosystem. | Assign one core resource per stage, with clearly marked supplements. |
| Google MLCC covers clustering | Its main index does not list a clustering module. Google offers a separate clustering course. | Link the separate course as an optional extension. |
| PyTorch Basics teaches Transformers | The tutorial uses FashionMNIST and covers tensors, data loading, models, autograd, optimization and persistence. It assumes Python and basic deep learning. | Learn training mechanics here; introduce Transformers through HF LLM afterwards. |
| RAG, fine-tuning and LoRA are interchangeable | They solve different adaptation problems. RAG adds retrieved material to an answer's context; LoRA is parameter-efficient fine-tuning. | Start with prompting and retrieval. Make LoRA a later comparison exercise, not an automatic requirement. |
| MCP gives an agent memory | MCP standardizes connections to tools/data. Memory still needs an application design. | Teach tools, explicit state/memory, evaluation, then MCP as an integration option. |
| Five projects guarantee hiring | Unsupported. Five is our proposed portfolio structure, not a hiring threshold. | Show five inspectable artifacts with evidence, limitations and reproducible setup. |
| Comment AI guarantees a DM | This review did not enable or test a delivery automation. | “Comment AI” may remain a proposed CTA, but do not promise automatic delivery until the resource and exact-post automation are approved and tested. |

## Verified primary resources and access

All links below were opened on the review date. Reading availability was checked; notebooks were not installed or executed in this pass.

| Resource | Verified scope / practical entry point | Access and constraints |
|---|---|---|
| [Harvard CS50P](https://cs50.harvard.edu/python/) | Beginner Python, debugging, tests, files and a final project. Follow lectures, exercises, then the project. | OpenCourseWare explicitly free. Browser learning supported; an edX account is needed for the course's submission feedback path. Do not conflate it with the optional verified certificate. |
| [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) and [prework](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework) | Regression, classification, data, overfitting, neural networks and production concepts. Prework covers Python/NumPy/pandas and math prerequisites. | Public learning pages; exercises use Colab. It is not a complete course on a particular ML API. |
| [Google clustering](https://developers.google.com/machine-learning/clustering) | Similarity, k-means and evaluation; assumes MLCC-level foundations. | Separate public course. |
| [PyTorch Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) | Complete small neural-network workflow, including save/load. Start with Tensors after ML fundamentals. | Public tutorial; Colab links or local PyTorch/TorchVision install. Hardware requirements depend on the example. |
| [HF LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) | Transformers, tokenizers, datasets, fine-tuning and demos. Good Python knowledge is required; introductory deep learning is recommended. | Course explicitly free. A free course is not a promise of free model inference. |
| [HF Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction) | Agent fundamentals, frameworks, use cases, evaluation and a final assignment. Start with Unit 1. | Course explicitly free; basic Python/LLM knowledge expected. A Hugging Face account supports course activities. |
| [FastAPI tutorial](https://fastapi.tiangolo.com/tutorial/) | Build a Python API, learn request/response handling and use the tutorial's examples. | Public documentation. Current guide supports uv or a virtual environment with `pip install "fastapi[standard]"`; cloud deployment is a separate choice. |
| [Docker Get Started](https://docs.docker.com/get-started/) | Choose “New to Docker” for a containerized application; follow OS-specific install instructions first. | Public documentation. [Docker Desktop terms](https://docs.docker.com/subscription-billing/desktop-license/) list personal/educational use as free, with separate organizational conditions. Do not say all Docker use is free. |

The roadmap names courses and tools, not a ranked repository collection. No stars, repository activity, universal open-source license or hiring statistics are claimed. Link to learning material; do not reproduce its branding, course content or screenshots as our own work.

Technical distinction sources: [HF prompting guide](https://huggingface.co/docs/transformers/tasks/prompting), [HF RAG cookbook](https://huggingface.co/learn/cookbook/advanced_rag), [HF LoRA reference](https://huggingface.co/docs/peft/v0.21.0/package_reference/lora), and [official MCP introduction](https://modelcontextprotocol.io/docs/getting-started/intro). The current [HF Inference Providers pricing page](https://huggingface.co/docs/inference-providers/pricing) explicitly lists no monthly credits for free users and requires credit purchase for that service. Avoid stale “free API credits” copy.

One usable project rule: **Use public or synthetic data, keep keys out of code, and test failures as well as successful outputs.** This is practical editorial guidance for the proposed exercises, not a claim that a course certificate guarantees safe production operation.

## Local analytics and SEO evidence audit

The following are **saved receipts**, read on 23 October, not newly fetched account analytics:

- `outputs/content-batch-2026-10-20/timing-check.md` is dated **20 October 2026**. It records Instagram followers, a 30-day views total and Friday/Saturday activity values, but its Pacific-time interpretation is explicitly uncertain by one hour. Its 17:00 GST choice is a prior scheduling decision, not a new optimum for this carousel. No current account refresh was performed.
- That receipt reports YouTube data for **22 September–19 October**, with insufficient viewer data for the audience-hour chart. Its suggested publish hours are historical priors from a newer-niche transition, not a measured current optimum. LinkedIn, TikTok, Facebook and X remain low-confidence fallbacks; X has no Premium analytics in the receipt.
- `outputs/ai-engineering-projects-reel/seo/research-{youtube,social,linkedin}.json` are dated **20 October**. YouTube autocomplete includes “ai engineering roadmap” and “ai engineering roadmap 2026”; this supports wording relevance only, not volume, current demand growth or predicted reach. The broad video search is documented as dominated by unrelated results; do not infer a winning roadmap format from its view counts.
- Those social and LinkedIn receipts use Google autocomplete as a proxy. They contain no authenticated LinkedIn search volume, Instagram/TikTok search volume, or verified hashtag-size data. The Instagram five-hashtag announcement was not retrievable in that pass; it must not become a freshly verified platform claim here.
- The three `outputs/claude-job-search-reel/seo/research-*.json` receipts share the same date but concern another topic. They are not evidence for this roadmap's likely performance.
- No saved receipt establishes the reference carousel's reach, saves, shares, completion rate, follower conversion or the owner's roadmap-specific response. No performance metric should appear in the review as fact. A proposed posting time is not a scheduling confirmation.

Editorial recommendation: use the clear phrase **“AI engineer roadmap”** for topic recognition and emphasize practical milestones. This is a relevance-led drafting choice, not a measured performance prediction.
