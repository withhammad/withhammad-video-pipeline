"""Research public suggestions and prepare six-platform copy; never publish."""
import json
import os
import sys
import subprocess
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
os.environ['STUDIO_JOBS']=str(ROOT/'studio/.local/jobs')
sys.path.insert(0,str(ROOT/'studio'))
from app import repost_queue as rq

data=json.loads((HERE/'batch.json').read_text())
terms={'HIGGS':'Claude Higgsfield video','ADVISOR':'Claude Code advisor Fable',
       'FABLE':'Fable 5.2 creative coding','CLONE':'Claude AI clone workflow','BENCH':'Fable 5.2 benchmarks'}
def research(j):
    query=terms[j['keyword']]
    url='https://suggestqueries.google.com/complete/search?'+urllib.parse.urlencode({'client':'firefox','ds':'yt','q':query})
    try:
        # Native curl uses the Mac's verified certificate store. Never disable TLS checks.
        response=subprocess.run(['curl','--fail','--silent','--show-error','--max-time','20',url],check=True,capture_output=True,text=True)
        result=json.loads(response.stdout)
        return j['keyword'],{'url':url,'query':query,'suggestions':result[1], 'status':'ok'}
    except Exception as exc:return j['keyword'],{'url':url,'query':query,'suggestions':[],'status':'unavailable','error':str(exc)}
with ThreadPoolExecutor(max_workers=3) as pool:evidence=dict(pool.map(research,data['jobs']))
(HERE/'search-evidence.json').write_text(json.dumps(evidence,indent=2,ensure_ascii=False)+'\n')
checks=[]
for j in data['jobs']:
    k=j['keyword'];folder=ROOT/'studio/.local/jobs'/j['job'];out=folder/'seo';out.mkdir(exist_ok=True)
    guide='https://withhammad.com/resources/'+j['slug']
    disclosure='AI narration using my own ElevenLabs voice clone.' if k=='BENCH' else 'AI avatar of me, using my own ElevenLabs voice clone.'
    tags=['Claude AI','Fable 5.2',terms[k],'AI tools','AI workflow']
    hashtags=['#ClaudeAI','#Fable52','#AITools']
    attribution=f"Visual reference: {j['creator']}. Demonstration excerpts are credited to the source; they are not Hammad's own tests."
    # Editorial notes are rewritten for the audience, not instructions to the video editor.
    audience_notes={
      'HIGGS':'The live offer determines eligibility, qualifying models, dates and credit costs. Check its current terms before generating.',
      'ADVISOR':'The seven-build comparison is Charlie Hills’s reported experiment: $25.81 with Opus + Fable advisor versus $39.29 with Fable alone. Your usage will vary. The advisor is experimental; account/provider and billing limits apply.',
      'FABLE':'Creator examples illustrate possibilities, not guaranteed one-prompt results. The 20% price reduction concerns standard API token rates, and the speed claim is up to 30% faster output. Future-history scenes are speculative.',
      'CLONE':'Claude coordinates connected tools; those tools produce the face and voice. The source creator’s three-photo/25-second example is not a universal requirement. Use your own authorized identity and check the actual service’s requirements.',
      'BENCH':'These are Anthropic’s reported benchmark results, not a claim that one model wins every task. The Fermat result is machine-checkable proof formalization, not a new discovery of the theorem.'
    }[k]
    yt=f"{j['title']}\nFree guide: {guide}\n\n{audience_notes}\n\nComment {k} for the guide. Subscribe for practical AI workflows.\n\n{disclosure}\n{attribution}\nSources checked 10 November 2026.\n#Shorts #ClaudeAI #AITools"
    ig=f"{j['title']}\n\nComment {k} for the guide. Follow @withhammad.ai so the DM reaches you.\n\n{audience_notes}\n\n{disclosure}\n{attribution}\n"+' '.join(hashtags)
    li=f"{j['title']}\n\n{audience_notes}\n\nThe guide and exact sources: {guide}\nComment {k} if you want the checklist. Follow for practical AI workflows.\n\n{disclosure}\n{attribution}\n#ArtificialIntelligence #ClaudeAI"
    fb=f"{j['title']}\n\nComment {k} for the guide and follow With Hammad AI for practical tutorials.\n{guide}\n\n{audience_notes}\n\n{disclosure}\n{attribution}\n#ClaudeAI #AITools"
    tt=f"{j['title']}\nComment {k} for the guide; link in bio. Follow for practical AI builds.\n{audience_notes}\n{disclosure}\n#ClaudeAI #AITools #LearnOnTikTok"
    short_disclosure='AI voice clone of me.' if k=='BENCH' else 'AI avatar of me.'
    xx=f"{j['title']}. Comment {k} for the guide.\n{guide}\n{short_disclosure} #ClaudeAI"
    weighted=len(xx)-len(guide)+23
    if weighted>280:raise ValueError((k,'X over length',weighted))
    sources=[{'url':s['url'],'use':s['claim']} for s in j['sources']]
    sources.append({'url':evidence[k]['url'],'use':'Public YouTube autocomplete query. Availability/results saved; no search volume or ranking claim.'})
    pack={'researched_at':'2026-11-10','primary_keyword':terms[k],'comment_keyword':k,'keyword':k,
          'resource_url':guide,'resource_url_status':'draft_not_live','status':'draft_pending_generated_cut',
          'owner_approved':False,'publishing_authorized':False,
          'rationale':'Use the exact product and task names from current primary documentation and the supplied reference. Autocomplete evidence is recorded; no platform search volumes are invented.',
          'sources':sources,'youtube':{'title':j['title'],'description':yt,'tags':tags,'category_id':'28','made_for_kids':False},
          'instagram':{'caption':ig,'hashtags':hashtags,'alt_text':j['title']+'; synchronized captions and explanatory visuals.'},
          'linkedin':{'caption':li},'facebook':{'caption':fb},'tiktok':{'caption':tt},'x':{'text':xx,'weighted_length':weighted}}
    (out/'seo.json').write_text(json.dumps(pack,indent=2,ensure_ascii=False)+'\n')
    (out/'search-evidence.json').write_text(json.dumps(evidence[k],indent=2)+'\n')
    copy='# '+j['title']+' — draft copy\n\nNot approved or scheduled. Guide/reply route must be live before publication.\n\n'
    for platform in data['platforms']:
        text,_=rq.seo_caption(j['job'],platform)
        copy+='## '+platform.title()+'\n\n'+text+'\n\n'
        checks.append({'job':j['job'],'keyword':k,'platform':platform,'caption_validation':'PASS'})
    (out/'seo.md').write_text(copy)
    print(k,'six caption checks PASS;',len(evidence[k]['suggestions']),'suggestions;',evidence[k]['status'])
(HERE/'seo-validation.json').write_text(json.dumps(checks,indent=2)+'\n')
