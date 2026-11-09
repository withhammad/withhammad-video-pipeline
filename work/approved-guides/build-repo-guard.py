"""Build the owner-approved REPO and GUARD guides in the isolated website checkout."""
import json
import re
import shutil
from pathlib import Path

SITE = Path('/Users/hammad/.codex/worktrees/approved-learning-guides/withhammad-rebuild')
OUT = Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs')
ROOT = Path('/Users/hammad/withhammad-video-pipeline')
def write(rel, text):
    p = SITE / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)

guard = json.loads((OUT/'AI-Guardrails/package.json').read_text())
draft = (OUT/'AI-Guardrails/guide-draft.md').read_text()
sections = []
for part in draft.split('\n## ')[1:]:
    heading, body = part.split('\n', 1)
    paragraphs, bullets = [], []
    for para in body.strip().split('\n\n'):
        if para.startswith('- '): bullets.extend(x[2:] for x in para.splitlines())
        else: paragraphs.append(para)
    sections.append({'id':re.sub(r'[^a-z0-9]+','-',heading.lower()).strip('-'),
                     'title':heading,'paragraphs':paragraphs,'bullets':bullets})
g = dict(slug=guard['slug'], path='/resources/'+guard['slug'], keyword='GUARD',
         title='AI guardrails explained: a practical checklist',
         metaTitle='AI Guardrails Explained: A Practical Checklist',
         description='Understand AI guardrails: validate model responses, handle failures, bound retries and check permissions. Use the diagram and practical testing checklist.',
         cardSummary='Validate structure, check configured rules and handle failure explicitly. A passing check does not prove that every answer is correct.',
         datePublished='2026-11-09', dateLabel='9 November 2026',
         intro=draft.split('\n\n')[1], image='/media/guides/ai-guardrails-explained.png',
         alt=guard['alt'],width=1254,height=1254,sections=sections,
         links=[{'name':'Guardrails AI: the Guard object','url':guard['sources'][0]},
                {'name':'Pydantic: models and validation','url':guard['sources'][1]}],
         related=[{'href':'/resources/build-an-agent-harness','label':'Trace permissions and tool execution in an agent harness'},
                  {'href':'/resources/vector-databases-explained','label':'Understand retrieval before evaluating its answers'},
                  {'href':'/resources/ai-agent-developer-learning-plan','label':'Build evaluation into your agent learning plan'}])
write('src/content/resources/ai-guardrails-explained.ts',
      'import type { InfographicGuideContent } from "@/components/resources/InfographicGuide";\n\nexport const guardrailsResource = '+json.dumps(g,indent=2,ensure_ascii=False)+' satisfies InfographicGuideContent;\n')
write('src/app/(site)/resources/ai-guardrails-explained/page.tsx',
      'import { InfographicGuide, infographicMetadata } from "@/components/resources/InfographicGuide";\nimport { guardrailsResource as resource } from "@/content/resources/ai-guardrails-explained";\nexport const metadata = infographicMetadata(resource);\nexport default function Page() { return <InfographicGuide resource={resource}/>; }\n')
shutil.copyfile(OUT/'AI-Guardrails/AI-Guardrails.png',SITE/'public/media/guides/ai-guardrails-explained.png')

repo_draft=(ROOT/'studio/.local/jobs/dfa218634321/resource-guide-draft.md').read_text()
parts=repo_draft.split('\n## ')[1:6]
steps=[]
links=[]
for part in parts:
    title, text=part.split('\n',1)
    title=re.sub(r'^\d+\. ','',title)
    for label,url in re.findall(r'\[([^\]]+)\]\(([^)]+)\)',text):
        links.append({'name':title+': '+label,'url':url})
    text=re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',text.strip())
    steps.append({'title':title,'text':text})
r=dict(slug='five-open-source-ai-repos',path='/resources/five-open-source-ai-repos',keyword='REPO',
       title='Five open-source AI repos: practical setup links',metaTitle='Five Open-Source AI Repos: Setup and Cost Notes',
       description='Explore OpenCode, VoiceStudio, OpenSEO, OpenMausBot and Replica. Find official setup links, licence notes and costs to check before your first test.',
       cardSummary='Five documented projects for coding, voice, SEO, computer tasks and app recreation, with official links and a practical first-test checklist.',
       datePublished='2026-11-09',dateLabel='9 November 2026',
       intro='Start with one workflow you already use. These five open-source AI repos offer different tools for coding, voice, search and automation. Use their official instructions and compare the result on a small task.',
       note='Open source describes the code licence. Model APIs, data services, hosting and hardware can still cost money. Check current project requirements before changing a working setup.',
       steps=steps, itemsTitle='Pick the project for your task',
       items=[['OpenCode','A coding-agent client; connect a supported model provider.'],['VoiceStudio','A voice-production project with local hardware requirements and optional paid services.'],['OpenSEO','An SEO workflow whose DataForSEO integration uses paid data.'],['OpenMausBot','An agent application with supported model and computer environments.'],['Replica','Eleven skills for studying, implementing and testing app features.']],
       checks=['Read the current install instructions and licence.','Check model, data, hosting and hardware requirements.','Start with one small task and review its output.','Record actual cost and useful time saved before replacing a paid workflow.'],
       links=links,related=[{'href':'/resources/ai-agent-developer-learning-plan','label':'Choose a practical agent learning path'},
                           {'href':'/resources/build-an-agent-harness','label':'Understand the software around a coding agent'},
                           {'href':'/resources/ai-guardrails-explained','label':'Check outputs and tool permissions'}],
       videoNote='This companion guide supports Hammad’s REPO reel. The presenter and voice are Hammad’s approved AI likeness and clone. Project documentation was checked on 8 November 2026; the guide does not claim independent benchmarks of every model or installation.')
write('src/content/resources/five-open-source-ai-repos.ts','import type { AgentGuide } from "@/components/resources/AgentSetupGuide";\n\nexport const fiveReposResource = '+json.dumps(r,indent=2,ensure_ascii=False)+' satisfies AgentGuide;\n')
write('src/app/(site)/resources/five-open-source-ai-repos/page.tsx','import { AgentSetupGuide, guideMetadata } from "@/components/resources/AgentSetupGuide";\nimport { fiveReposResource as resource } from "@/content/resources/five-open-source-ai-repos";\nexport const metadata = guideMetadata(resource);\nexport default function Page() { return <AgentSetupGuide resource={resource}/>; }\n')

blog_title='Test an open-source AI tool before replacing your workflow'
blog_sections=[
 ('Choose one measurable task','Choose a task you already understand: explain one function, prepare a short voice sample, inspect one search query or repeat a small desktop action. Save the inputs and the result you expect. This gives you something concrete to compare when trying an open-source AI tool.'),
 ('Read the licence and operating requirements','The REPO guide links five projects with different purposes. Their licences describe how their code may be used; they do not promise zero operating cost. Read the upstream documentation, required provider accounts and hardware guidance before installing. Use your own voice and authorised content in voice or recreation workflows.'),
 ('Keep a first run small','Use a disposable project or a copy of non-sensitive data for the first run. Set provider budgets where available. Begin with one input, inspect the proposed action and review the output. If installation fails, record the actual error and consult the project instructions rather than changing several dependencies at once.'),
 ('Compare total effort, not a screenshot','Measure setup time, task time, correction time and direct usage cost. Check whether a useful output can be reproduced and whether the tool fits your existing workflow. An attractive demonstration does not show the time spent correcting it or the resources required on another machine.'),
 ('Keep the result reviewable','Save the project version, settings, input and test result. If you adopt the tool, document how to stop it, revoke its credentials and restore the previous workflow. Expand its permissions or workload only when the smaller test gives you useful evidence.')]
body=[]
for i,(h,p) in enumerate(blog_sections):body.extend([f'    block("h2", {json.dumps(h)}, "h{i}"),',f'    block("normal", {json.dumps(p)}, "p{i}"),'])
write('src/content/blog-posts/five-open-source-ai-repos.ts',
 'import type { Post } from "@/lib/types";\nimport { block } from "../seed";\n\nconst post: Post = {\n'
 '  _type: "post", title: '+json.dumps(blog_title)+', slug: "five-open-source-ai-repos",\n'
 '  excerpt: "Compare one small task, the operating costs and the review effort before replacing a working tool.",\n'
 '  tldr: "Start with one known task. Read the project requirements, set usage limits and compare the result and total effort before expanding the workflow.",\n'
 '  category: "ai-agents", publishedAt: "2026-11-09", relatedResource: "/resources/five-open-source-ai-repos",\n'
 '  relatedPosts: ["build-an-agent-harness", "what-production-grade-ai-actually-means-5-pillars"],\n'
 '  cover: `/api/og?${new URLSearchParams({title: '+json.dumps(blog_title)+', tag: "AI TOOLS"})}`,\n'
 '  body: [\n'+'\n'.join(body)+'\n  ],\n'
 '  sources: '+json.dumps([{'label':'Five projects, setup links and cost notes','url':'https://withhammad.com/resources/five-open-source-ai-repos'}])+',\n'
 '  seo: {title: '+json.dumps(blog_title)+', description: "Test an open-source AI tool on one known task. Compare installation effort, output quality and operating costs before replacing a working workflow.", focusKeyword: "test an open-source AI tool", faq: []},\n};\nexport default post;\n')
p=SITE/'src/content/blog-posts/index.ts';s=p.read_text();
if 'import fiveReposPost' not in s:
 s='import fiveReposPost from "./five-open-source-ai-repos";\n'+s
 s=re.sub(r'(export const \w+[^=]*= \[)',r'\1\n  fiveReposPost,',s,count=1)
 p.write_text(s)
p=SITE/'src/content/resources/reel-resources.ts';s=p.read_text()
if 'import fiveReposResource' not in s and 'import { fiveReposResource' not in s:
 s='import { fiveReposResource } from "./five-open-source-ai-repos";\nimport { guardrailsResource } from "./ai-guardrails-explained";\n'+s
 s=s.replace('export const reelResources: ReelResourceItem[] = [','export const reelResources: ReelResourceItem[] = [\n  {href:fiveReposResource.path, tag:`${fiveReposResource.keyword} reel`, date:fiveReposResource.datePublished, title:fiveReposResource.title, summary:fiveReposResource.cardSummary, blogSlug:fiveReposResource.slug},\n  {href:guardrailsResource.path, tag:`${guardrailsResource.keyword} graphic`, date:guardrailsResource.datePublished, title:guardrailsResource.title, summary:guardrailsResource.cardSummary},')
 p.write_text(s)
p=SITE/'src/content/dm-rules.json';d=json.loads(p.read_text())
for keyword,slug,message in [('REPO',r['slug'],'Here are the five open-source AI repos, setup links and cost notes.'),('GUARD',g['slug'],'Here is the AI guardrails diagram and practical checklist.')]:
 assert not any(x['keyword']==keyword for x in d['rules']),keyword
 d['rules'].append({'keyword':keyword,'link':'https://withhammad.com/resources/'+slug,'dm':message+'\n{link}','reply':'Sent you a DM ✅','media_ids':[]})
p.write_text(json.dumps(d,indent=2,ensure_ascii=False)+'\n')
print('Created REPO and GUARD resource pages, companion blog, resource cards and keyword rules.')
