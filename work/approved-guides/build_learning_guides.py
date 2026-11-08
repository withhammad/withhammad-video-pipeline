"""Prepare the two owner-approved infographic guides in an isolated PR checkout."""
import json,re,shutil,hashlib
from pathlib import Path
S=Path('/Users/hammad/.codex/worktrees/approved-learning-guides/withhammad-rebuild')
O=Path('/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs')
R=Path('/Users/hammad/withhammad-video-pipeline')
from PIL import Image

packages=[
 ('Agent-Developer-Roadmap','agentLearning', 'AI Agent Developer: Four-Month Learning Plan',
  'Build one useful AI agent project with a four-month learning plan: foundations, retrieval, tools, evaluation and deployment. Start with clear milestones.',
  [('FAISS: vector search library','https://github.com/facebookresearch/faiss'),('Model Context Protocol introduction','https://modelcontextprotocol.io/docs/getting-started/intro')],
  [('/resources/vector-databases-explained','Learn how vector retrieval fits into your project'),('/resources/build-an-agent-harness','Build an agent harness with explicit limits'),('/resources/how-ai-agents-work','Understand the agent loop')]),
 ('Vector-Databases','vectorDatabases', 'Vector Databases Explained: A Practical Guide',
  'Understand vector databases, embeddings, similarity search, metadata filters and RAG. Compare indexing choices and test retrieval on your own questions.',
  [('pgvector: PostgreSQL vector search','https://github.com/pgvector/pgvector'),('Pinecone metadata filtering','https://docs.pinecone.io/guides/search/filter-by-metadata'),('FAISS: search and compression','https://github.com/facebookresearch/faiss')],
  [('/resources/ai-agent-developer-learning-plan','Use retrieval in an AI agent learning project'),('/resources/agentic-ai-concepts','Connect retrieval to the wider agent concepts'),('/resources/how-ai-agents-work','Follow the model and tool loop')])]

component='''import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleNode, breadcrumbNode, graph, howToNode } from "@/lib/seo/jsonld";
import { pageMeta } from "@/lib/seo/meta";
import { ResourceHeader, OfficialLinks, FollowFirstCard, KeepGoing, OnThisPage, body, h2, textLink } from "@/components/resources/ReelResourceParts";

export type InfographicGuideContent = {
  slug: string; path: string; keyword: string; title: string; metaTitle: string;
  description: string; cardSummary: string; datePublished: string; dateLabel: string;
  intro: string; image: string; alt: string; width: number; height: number;
  sections: { id: string; title: string; paragraphs: string[]; bullets: string[] }[];
  links: {name: string; url: string}[]; related: {href: string; label: string}[];
};

export function infographicMetadata(r: InfographicGuideContent): Metadata {
  return {...pageMeta({title: r.metaTitle, description: r.description, path: r.path,
    image: {src: r.image, alt: r.alt, width: r.width, height: r.height},
    article: {publishedTime: r.datePublished}}), title: {absolute: r.metaTitle}};
}

function Inline({text}: {text: string}) {
  return <>{text.split(/(\\[[^\\]]+\\]\\(https:\\/\\/[^)]+\\))/g).map((part, i) => {
    const match = part.match(/^\\[([^\\]]+)\\]\\((https:\\/\\/[^)]+)\\)$/);
    return match ? <a key={i} href={match[2]} className={textLink} target="_blank" rel="noopener noreferrer">{match[1]}</a> : part;
  })}</>;
}

export function InfographicGuide({resource: r}: {resource: InfographicGuideContent}) {
  return <>
    <JsonLd data={graph(
      articleNode({headline:r.title, description:r.description, path:r.path, datePublished:r.datePublished, dateModified:r.datePublished}),
      howToNode({name:r.title, description:r.intro, steps:r.sections.filter(s=>s.id!=="use-the-map-as-a-checklist").map(s=>({name:s.title, text:s.paragraphs.join(" ").replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g,"$1")}))}),
      breadcrumbNode([{name:"Home",path:"/"},{name:"Resources",path:"/resources"},{name:r.title,path:r.path}])
    )}/>
    <Container width={760} className="py-10 sm:py-14">
      <ResourceHeader keyword={r.keyword} title={r.title} dateLabel={r.dateLabel} contentKind="graphic">
        <p className={`mt-5 ${body}`}>{r.intro}</p>
      </ResourceHeader>
      <figure className="mt-8">
        <a href={r.image} aria-label="Open the full-size infographic">
          <Image src={r.image} alt={r.alt} width={r.width} height={r.height} sizes="(max-width: 800px) 100vw, 760px" className="h-auto w-full rounded-[12px] border border-line"/>
        </a>
        <figcaption className="mt-3 text-[14px] text-ink-dim">The WITHHAMMAD infographic. <a href={r.image} download className={textLink}>Download the full-size graphic</a>.</figcaption>
      </figure>
      <OnThisPage items={r.sections.map(s=>({href:`#${s.id}`,label:s.title}))}/>
      {r.sections.map(s=><section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
        <h2 className={h2}>{s.title}</h2>
        {s.paragraphs.map((p,i)=><p key={i} className={`mt-4 ${body}`}><Inline text={p}/></p>)}
        {s.bullets.length>0&&<ul className={`mt-4 list-disc space-y-3 pl-5 ${body}`}>{s.bullets.map((b,i)=><li key={i}><Inline text={b}/></li>)}</ul>}
      </section>)}
      <OfficialLinks title="Sources and documentation" links={r.links}/>
      <FollowFirstCard keyword={r.keyword} contentKind="graphic"/>
      <KeepGoing related={r.related}/>
    </Container>
  </>;
}
'''
(S/'src/components/resources/InfographicGuide.tsx').write_text(component)
index=S/'src/content/resources/reel-resources.ts';indextext=index.read_text()
rulespath=S/'src/content/dm-rules.json';rules=json.loads(rulespath.read_text())
for folder,var,title,description,links,related in packages:
    d=O/folder;p=json.loads((d/'package.json').read_text());slug=p['slug'];keyword=p['keyword']
    chunks=re.split(r'^## ',(d/'guide-draft.md').read_text(),flags=re.M)
    intro=chunks[0].split('\n\n',1)[1].strip();sections=[]
    for chunk in chunks[1:]:
        heading,content=chunk.split('\n',1);paragraphs=[];bullets=[]
        for block in content.strip().split('\n\n'):
            if block.startswith('- '):bullets.extend(x[2:] for x in block.splitlines() if x.startswith('- '))
            else:paragraphs.append(block.strip())
        sections.append({'id':re.sub(r'[^a-z0-9]+','-',heading.lower()).strip('-'),'title':heading,'paragraphs':paragraphs,'bullets':bullets})
    w,h=Image.open(d/p['image_file']).size
    data={'slug':slug,'path':'/resources/'+slug,'keyword':keyword,'title':p['title'],'metaTitle':title,
          'description':description,'cardSummary':intro,'datePublished':'2026-11-08','dateLabel':'8 November 2026',
          'intro':intro,'image':'/media/guides/'+slug+'.png','alt':p['alt'],'width':w,'height':h,
          'sections':sections,'links':[{'name':n,'url':u} for n,u in links],
          'related':[{'href':u,'label':l} for u,l in related]}
    assert len(title)<=60 and 120<=len(description)<=155,(title,len(description))
    (S/'src/content/resources'/f'{slug}.ts').write_text('import type { InfographicGuideContent } from "@/components/resources/InfographicGuide";\n\nexport const '+var+'Resource = '+json.dumps(data,indent=2,ensure_ascii=False)+' satisfies InfographicGuideContent;\n')
    page=S/'src/app/(site)/resources'/slug;page.mkdir(exist_ok=True)
    (page/'page.tsx').write_text(f'''import {{InfographicGuide, infographicMetadata}} from "@/components/resources/InfographicGuide";
import {{{var}Resource}} from "@/content/resources/{slug}";
export const metadata = infographicMetadata({var}Resource);
export default function Page() {{return <InfographicGuide resource={{{var}Resource}}/>;}}
''')
    img=S/'public/media/guides'/f'{slug}.png';img.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(d/p['image_file'],img)
    imp=f'import {{ {var}Resource }} from "./{slug}";\n'
    if imp not in indextext:indextext=imp+indextext
    row=f'  {{href:{var}Resource.path, tag:`${{{var}Resource.keyword}} graphic`, date:{var}Resource.datePublished, title:{var}Resource.title, summary:{var}Resource.cardSummary}},\n'
    if row not in indextext:indextext=indextext.replace('export const reelResources: ReelResourceItem[] = [\n','export const reelResources: ReelResourceItem[] = [\n'+row)
    matches=[r for r in rules['rules'] if r['keyword']==keyword]
    assert not matches or matches[0]['link']==p['guide_url'],keyword+' collision'
    if not matches:rules['rules'].append({'keyword':keyword,'link':p['guide_url'],'dm':'Here is your '+('AI agent learning plan' if keyword=='AGENTMAP' else 'vector database guide')+' 👇\n{link}','reply':'Sent you a DM ✅','media_ids':[]})
    p.update(owner_approved=True,publishing_authorized=True,approved_at='2026-11-08',status='approved_awaiting_guide_merge',guide_status='PR being prepared; owner merges',keyword_status='PR being prepared; not deployed')
    (d/'package.json').write_text(json.dumps(p,indent=2,ensure_ascii=False)+'\n')
    approval={'approved_at':'2026-11-08','owner_statement':'Approve '+('roadmap package' if keyword=='AGENTMAP' else 'vector database package'),'image_sha256':p['image_sha256'],'copy_sha256':hashlib.sha256((d/'copy.md').read_bytes()).hexdigest(),'condition':'Guide and keyword rule must be live before publishing.'}
    (d/'owner-approval.json').write_text(json.dumps(approval,indent=2)+'\n')
index.write_text(indextext);rulespath.write_text(json.dumps(rules,indent=2,ensure_ascii=False)+'\n')
print('Prepared 2 approved guides, 2 infographic assets and 2 keyword rules in',S)
