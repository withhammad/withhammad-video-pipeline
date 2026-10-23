# AI engineer roadmap — free learning resources

Review draft for Hammad · links checked **23 October 2026**.

Work through six stages at your own pace. Move forward when you can demonstrate the milestone. The projects and checks below are our suggested practice plan, not course requirements or a promise of employment. The learning materials are free to access; compute, model APIs, hosting and optional certificates can cost extra.

## 1. Foundations: write code that handles real data

**Start:** [Harvard CS50P](https://cs50.harvard.edu/python/). Learn Python functions, control flow, exceptions, files and tests before adding AI libraries.

**Fill gaps as needed:** [Pro Git, chapters 1–3](https://git-scm.com/book/en/v2) for version control; [Harvard CS50 SQL](https://cs50.harvard.edu/sql/) for queries and joins; [Google's math and Python checklist](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework) for algebra, statistics and NumPy/pandas prework; [Requests Quickstart](https://requests.readthedocs.io/en/latest/user/quickstart/) for HTTP, JSON, status codes and timeouts.

**Build — project 1:** A Python data-cleaning pipeline. Load a small permitted public CSV dataset, validate the records, store them in SQLite and export a useful summary. Add an optional read-only public API input. Use a Git repository and a README.

**Milestone:** A fresh setup can run it. Tests cover missing fields, duplicates and invalid values; the API path handles timeouts and unsuccessful responses. You can explain the query and the data flow without asking a model to explain your code.

## 2. Machine learning: establish a baseline

**Start:** [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course). Focus on regression, classification, generalization and appropriate metrics. Use [scikit-learn's Getting Started guide](https://scikit-learn.org/stable/getting_started.html) to implement a small model. Add [Google's separate clustering course](https://developers.google.com/machine-learning/clustering) after the core work if you want an unsupervised extension.

**Build — project 2:** A tabular classification experiment using a public, non-sensitive dataset. Compare a simple baseline with one trained model. Keep preprocessing inside the training pipeline.

**Milestone:** Report results on held-out data, state the split method, and show where the model fails. Pick a metric that fits the task—such as mean absolute error for regression or precision/recall for classification. Explain any improvement over the baseline; if there is none, report that honestly. Do not choose the final model by repeatedly tuning against the test set.

## 3. Deep learning: understand the training loop

**Start:** [PyTorch Learn the Basics](https://docs.pytorch.org/tutorials/beginner/basics/intro.html), after the neural-network concepts in Google MLCC. Work through tensors, datasets, autograd, optimization and saving/loading. For Transformers, continue into the opening chapters of the [HF LLM Course](https://huggingface.co/learn/llm-course/chapter1/1).

**Build — project 3:** Reproduce a small image classifier, then make one justified change to the tutorial experiment. Save the trained weights and create a separate prediction script.

**Milestone:** Plot training and validation loss, report test performance and inspect incorrect predictions. Reload the saved model and show it produces the expected outputs. Record the random seed, environment and the change you tested. A copied notebook becomes useful evidence when you can explain and evaluate your modification.

## 4. LLM applications: retrieve, answer and verify

**Start:** [HF LLM Course](https://huggingface.co/learn/llm-course/chapter1/1) and the [HF prompting guide](https://huggingface.co/docs/transformers/tasks/prompting). Use the [HF RAG cookbook](https://huggingface.co/learn/cookbook/advanced_rag) as a deeper reference for retrieval and evaluation; it is an advanced example, not a zero-setup beginner promise. Read [LoRA](https://huggingface.co/docs/peft/v0.21.0/package_reference/lora) later to understand efficient fine-tuning.

**Build — project 4:** A question-answering app over a small set of documents you own or may use. Return source references and make missing evidence visible. Start with prompting, then compare it with retrieval on the same questions. Keep fine-tuning optional until you can identify a problem that warrants it.

**Milestone:** Write a small test set before tuning; include answerable questions, missing-information questions and misleading passages. Track answer correctness, whether the retrieved passage contains the answer, and whether citations support the response. Compare latency and cost where measured. “Has citations” alone is not proof that an answer is correct.

## 5. Agents: make tool use observable

**Start:** [HF Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction). Learn tools and the action/observation cycle, then study evaluation. Read the [official MCP introduction](https://modelcontextprotocol.io/docs/getting-started/intro) when you need a standard connection between an application and its tools or data.

**Build — project 5:** A study assistant that searches your learning notes and uses a calculator. Give it a small tool allowlist, explicit session state and a maximum step count. Add an MCP connection only when the ordinary tool version works.

**Milestone:** Log tool requests/results and evaluate task completion on a fixed set of examples. Include an unavailable tool, malformed arguments, repeated calls and a request outside the tool's scope. Demonstrate that state does not leak between sessions. Measure whether the agent improves on a simpler fixed workflow. Keep any external write action behind a deliberate confirmation step in the proposed app.

## 6. Production: make one project reproducible

**Start:** [FastAPI's tutorial](https://fastapi.tiangolo.com/tutorial/) and [Docker Get Started](https://docs.docker.com/get-started/). Use the beginner containerized-application path. Learn request validation, errors and testing before hosting anything publicly.

**Build:** Turn project 4 or 5 into a local API and package it in a container. This is an upgrade to the five-project portfolio, not a demand for another disconnected demo. Include a health endpoint, configuration example, dependency versions and clear run instructions.

**Milestone:** A clean environment can start it and run the documented checks. Invalid input returns an appropriate error; upstream failures time out; logs reveal failures without exposing keys or private document text. Record response latency, model/API usage and any measured cost, with the test conditions. Show a fallback or failure message. If you later deploy publicly, add authentication, request limits and monitoring appropriate to that use.

## Make the five projects inspectable

For each project, include the problem, data source/permissions, setup steps, a short demo, evaluation method/results and known limitations. Explain one design tradeoff and one failure you found. Keep the work original and identify any tutorial starting point. A clear, reproducible project is stronger evidence than an unexplained project count.

## Cost and access notes

- Begin with small datasets and models that fit the hardware you already have. Treat hosted notebooks' availability and quotas as variable; a course link does not reserve compute.
- The HF courses are free learning resources, while [HF Inference Providers](https://huggingface.co/docs/inference-providers/pricing) has separate billing. Its current pricing lists no monthly credits for free users. Check the selected model/provider and set a budget before using a paid API.
- [Docker Desktop's terms](https://docs.docker.com/subscription-billing/desktop-license/) allow free personal/educational use and define separate conditions for organizations. Optional paid certificates and hosting are unnecessary for this local practice plan.
- Follow the current setup instructions linked by each official guide. This review verified the pages and stated scope; it did not execute every lesson or certify all examples against a particular machine.

Suggested review CTA: **“Save this roadmap and pick your first project.”** The companion guide is included locally in the review package. No automatic delivery or public resource page is active.
