import json,hashlib
from pathlib import Path
R=Path('/Users/hammad/withhammad-video-pipeline')
O=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/AI-Guardrails')
url='https://withhammad.com/resources/ai-guardrails-explained'
guide='''# AI guardrails explained: a practical checklist

Guardrails are checks around model inputs, outputs and actions. They help an application detect particular failures and decide what happens next. A passing check means that its configured rule passed; it does not establish that every statement is true or every action is appropriate.

## Start with a concrete failure

Write down what your application must accept and reject. For a support-ticket classifier, that might be an allowed category, a required ticket identifier and a short explanation. Keep a few valid examples and a few broken examples beside the specification. This makes the checks reviewable before you connect a model.

## Separate structure from meaning

A schema can check required fields, types and constraints. Pydantic models describe these requirements and validate the resulting object. Type correctness is different from factual correctness: a correctly typed customer identifier can still name the wrong customer. Verify meaning against the evidence or system of record appropriate to the task. [Pydantic models](https://pydantic.dev/docs/validation/latest/concepts/models/)

## Understand the Guard object

The infographic uses Guardrails AI as a concrete example. Its Guard object wraps model calls, orchestrates configured validation and keeps call history. It can also validate output generated elsewhere through the parse route. Configure the checks your application needs; creating an object alone does not define every relevant requirement. [Guardrails AI documentation](https://guardrailsai.com/guardrails/docs/concepts/guard)

## Choose a failure action before release

Decide whether a failed result should be rejected, sent for review, filtered, repaired or retried. Put a limit on attempts and record the final status. A repair must pass the relevant checks before it is treated as successful. Repeating the same prompt without a stopping condition can add latency and cost without fixing the underlying problem.

## Keep permissions in application code

A model's proposed action is a request to the application, not permission to perform it. Check identity, record access and allowed operations before tools execute. For an action that needs approval, present the specific proposed change and obtain that approval before execution. A valid JSON object should never bypass this decision.

## Keep useful records without exposing secrets

Log which check ran, whether it passed, which failure action was selected and how the run ended. Use identifiers or redacted examples when full prompts and outputs contain personal or confidential information. Give logs appropriate access controls and retention limits. The diagram's log arrows represent observability, not a requirement to save every input verbatim.

## Test the whole path

- Valid input reaches the expected result.
- Missing or malformed fields are handled explicitly.
- A plausible but unsupported answer is not mistaken for verified evidence.
- A retry stops at its configured limit.
- A tool cannot access a record outside the caller's permissions.
- Failure status remains visible to the caller and in the trace.

Visual reference: Sadik Mohammad's guardrails infographic, redrawn for WITHHAMMAD with concise wording and clearer failure handling. This is a practical design checklist; the exact validators and controls depend on the application.
'''
O.joinpath('guide-draft.md').write_text(guide)
hook='AI guardrails explained: a valid response is not automatically a correct answer.'
body='Define the schema and checks, call the model, validate the result, then handle failures explicitly. Bound retries, re-check repairs and keep permissions in application code. The map uses Guardrails AI’s Guard object as one concrete example.'
caveat='Guardrails reduce specific risks; they do not guarantee truth or safety.'
credit='Visual reference: Sadik Mohammad; redrawn and clarified for WITHHAMMAD.'
tags='#AIGuardrails #AIEngineering #LLM'
copy={
'instagram':f'{hook}\n\n{body}\n\n{caveat}\n\nSave this workflow. Comment GUARD for the checklist; follow @withhammad.ai so the DM reaches you.\n\n{credit}\n{tags}',
'facebook':f'{hook}\n\n{body}\n\n{caveat}\n\nChecklist: {url}\nComment GUARD for the link. Follow WITHHAMMAD for practical AI builds.\n\n{credit}\n{tags}',
'linkedin':f'{hook}\n\n{body}\n\n{caveat}\n\nPractical checklist: {url}\nWhich failure would you test first in your own workflow?\n\n{credit}\n{tags}',
'youtube_community':f'{hook}\n\n{body}\n\n{caveat}\n\nChecklist: {url}\nSave the diagram and subscribe for practical AI builds.\n\n{credit}',
'tiktok_photo':f'AI guardrails explained. Validate structure, check rules and handle failures. Passing validation does not guarantee truth.\n\nComment GUARD for the checklist; guide via link in bio. Follow @withhammad.\n\n{credit}\n{tags}',
'x':f'AI guardrails: validate structure, check rules, handle failures. Bound retries; re-check repairs. Passing validation does not guarantee truth.\n\nChecklist: {url}\nComment GUARD.\n#AIEngineering'}
assert len(copy['x'])<=280,len(copy['x'])
alt='Square blue-and-white infographic titled AI Guardrails Explained. Three left cards explain guardrails, the Guard object and reasons for checks. A numbered flow on the right configures rules, calls a model, validates its output, branches into valid and invalid results, handles failed validation, and records redacted logs. WITHHAMMAD branding.'
meta={'title':'AI guardrails explained','keyword':'GUARD','slug':'ai-guardrails-explained','reference':'https://lnkd.in/p/dEY7GakW','format':'single-image infographic','status':'awaiting_approval','owner_approved':False,'publishing_authorized':False,'image_file':'AI-Guardrails.png','image_sha256':hashlib.sha256((O/'AI-Guardrails.png').read_bytes()).hexdigest(),'generation_mode':'built-in image_gen','heygen_credits_spent':0,'guide_url':url,'guide_status':'draft; not deployed','keyword_status':'unique draft; not deployed','alt':alt,'platform_copy':copy,'sources':['https://guardrailsai.com/guardrails/docs/concepts/guard','https://pydantic.dev/docs/validation/latest/concepts/models/'],'checks':{'layout':'Visually inspected against source: square; 3 cards; two-stage numbered workflow','text':'All labels and arrows inspected','factual_corrections':'No truth/safety guarantees; bounded retries; explicit failure outcome','voice_avatar_audio_gates':'Not applicable: static source and adaptation'}}
(O/'package.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n')
(O/'copy.md').write_text('# AI guardrails — platform copy\n\n'+''.join('## '+k.replace('_',' ').title()+'\n\n'+v+'\n\n' for k,v in copy.items())+'## Alt text\n\n'+alt+'\n')
review=f'''# AI guardrails — review package

Owner reference: https://lnkd.in/p/dEY7GakW

Finished single-image graphic preserves the reference's square framing, three explanatory cards, blue/green palette and numbered create/call/validate workflow. WITHHAMMAD branding; no promise that validation guarantees correctness. Generated with built-in image_gen. Zero HeyGen credits.

Deliverables: `{O}` — graphic, six copy adaptations, guide draft, spec, generation prompt and package metadata. Keyword GUARD; planned guide {url}. Neither guide nor rule is live.

Status: awaiting owner approval of graphic/copy. After approval, prepare the guide/rule PR for owner merge, verify it live, then release on appropriate image surfaces. No posting, scheduling or paid generation occurred.
'''
(O/'review.md').write_text(review)
(R/'docs/videos/2026-11-08-ai-guardrails-review.md').write_text(review)
p=R/'outputs/video-pipeline/reference-inbox.json';d=json.loads(p.read_text())
for row in d['links']:
 if 'dEY7GakW' in row['url']:row.update(status='awaiting_approval',notes='Finished reference-matched AI guardrails infographic, copy and guide draft; keyword GUARD. Zero HeyGen credits. Await owner approval. See docs/videos/2026-11-08-ai-guardrails-review.md.')
p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
print('Guardrails package ready; X caption',len(copy['x']),'characters')
