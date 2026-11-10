"""Write reviewable preproduction files. Never generates paid media or books posts."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
from app import lesson

HERE = Path(__file__).resolve().parent
batch = json.loads((HERE / 'batch.json').read_text())
checked = '2026-11-10'
# This script prepares drafts, not a reset mechanism for later paid production.
for job in batch['jobs']:
    plan_path = ROOT/'studio/.local/jobs'/job['job']/'voice-plan.json'
    if plan_path.exists():
        existing = json.loads(plan_path.read_text())
        if existing.get('new_credits_spent', 0) or existing.get('state') != 'awaiting_paid_account_access':
            raise RuntimeError(f"Refusing to overwrite production state for {job['keyword']}")
rows = []
for j in batch['jobs']:
    folder = ROOT / 'studio/.local/jobs' / j['job']
    folder.mkdir(parents=True, exist_ok=True)
    script = ' '.join(s['spoken'] for s in j['segments'])
    url = 'https://withhammad.com/resources/' + j['slug']
    refs = '\n'.join(f"- [{s['claim']}]({s['url']})" for s in j['sources'])
    resource = f"# {j['title']}\n\nChecked {checked}. This guide is a draft, not a live destination.\n\n"
    resource += '\n\n'.join('## '+s['on_screen_text']+'\n\n'+s['spoken'] for s in j['segments'])
    resource += '\n\n## Accuracy notes\n\n' + '\n'.join('- '+c for c in j['corrections'])
    resource += '\n\n## Sources\n\n' + refs + '\n'
    prepared_guide = HERE/'resources'/f"{j['keyword']}.md"
    if prepared_guide.exists():
        resource = prepared_guide.read_text()
    disclosure = 'AI voice clone of me.' if j['keyword']=='BENCH' else 'AI avatar of me, using my own ElevenLabs voice clone.'
    description = f"{j['title']}.\nGuide: {url}\n\nComment {j['keyword']} for the guide. Subscribe for practical AI workflows.\n\n" + ' '.join(j['corrections'][:2]) + '\n\n' + disclosure
    ig = f"{j['title']}\n\nComment {j['keyword']} for the guide. Follow @withhammad.ai so the DM reaches you.\n\n{j['corrections'][0]}\n\n{disclosure}\n#ClaudeAI #AITools #AIWorkflow"
    package = {
        'language':'en', 'topic_title':j['title'], 'hook':j['segments'][0]['spoken'],
        'key_takeaways':[s['claim'] for s in j['sources']][:5],
        'script':{'estimated_seconds':round(j['reference_seconds']), 'segments':[
            {k:s[k] for k in ('spoken','on_screen_text','visual')} for s in j['segments']]},
        'demo_steps':[b[2] for b in j['beats']],
        'prompts':[{'title':'Reference-matched edit','text':'Use the beat map in spec.md; keep the original order and replace the presenter with Hammad.'}],
        'tool_links':[{'name':s['claim'], 'url':s['url']} for s in j['sources']],
        'captions':{'instagram':ig, 'youtube_title':j['title'], 'youtube_description':description,
                    'tiktok':ig.replace('Follow @withhammad.ai so the DM reaches you.', 'Follow for practical AI. Guide in bio.'),
                    'linkedin':description},
        'hashtags':['Claude AI','Fable 5.2','AI tools','AI workflow'],
        'manychat_keyword':j['keyword'],
        'resource_page':{'slug':j['slug'], 'title':j['title'], 'body_markdown':resource},
        'sources_checked':j['sources'],
        'originality_note':'Original narration, checked facts, source-credited demonstrations, owner presenter/voice/branding. No creator test presented as Hammad’s. '+j['duplicate_check'],
        'cover':{'kicker':'Claude Fable 5.2','hook':{'HIGGS':'MAKE VIDEOS','ADVISOR':'USE LESS','FABLE':'BUILD MORE','CLONE':'YOUR CLONE','BENCH':'THE NUMBERS'}[j['keyword']],
                 'pill_strong':j['keyword'][:8], 'pill_serif':'Guide'}
    }
    lesson.validate(package)
    (folder/'lesson.json').write_text(json.dumps(package,indent=2,ensure_ascii=False)+'\n')
    (folder/'script.txt').write_text(script+'\n')
    (folder/'guide-draft.md').write_text(resource)
    (folder/'voice-plan.json').write_text(json.dumps({
        'settings':batch['voice'], 'full_script':script,
        'camera_segment_indices':[i for i,s in enumerate(j['segments']) if s['camera']],
        'minimum_credit_method':'One complete narration take; align words, concatenate only camera speech into one audio upload for one 720p Avatar V submit. No avatar for BENCH.',
        'raw_a_roll_retiming':False, 'new_credits_spent':0,
        'state':'awaiting_paid_account_access', 'owner_review_required_after_final_edit':True
    },indent=2)+'\n')
    spec = f"# {j['title']} — edit specification\n\nReference: https://www.instagram.com/reel/{j['reference']}/\nCreator: {j['creator']}\nDuration: {j['reference_seconds']} s; acceptable {j['reference_seconds']*.9:.2f}–{j['reference_seconds']*1.1:.2f} s.\n\n"
    spec += f"Delivery target: 10–11 November 2026, Asia/Dubai, all six platforms. This is a production target, not a booked release. Finished-package approval and live page/reply routing remain prerequisites.\n\n## Format and look\n\n{j['format']}\n\n{j['look']}\n\n"
    spec += '## Duplicate check\n\n'+j['duplicate_check']+'\n\n## Source beat map\n\n| Source time | Required visual |\n|---|---|\n'
    spec += '\n'.join(f'| {a:g}–{b:g}s | {text} |' for a,b,text in j['beats'])
    spec += '\n\nFinal cut timings are aligned to the generated narration. The reference times above are not fabricated voice timings.\n\n## Corrections\n\n'+'\n'.join('- '+c for c in j['corrections'])
    spec += '\n\n## Source use\n\nSource footage may be used as short demonstration inserts under the owner’s standing reference-excerpt instruction. Keep provenance/timecodes in assets.json. Remove other presenter regions, never present another creator’s tests as ours, and retain attribution in copy. New 3D objects/shots use Blender.\n\n## Quality gates\n\nAll PENDING until real media exists: audible REFERRAL voice comparison; 4fps avatar filmstrip/lip sync; reference side-by-side; H.264/1080x1920/30fps/-14 LUFS/true peak ≤−1.5/caption coverage/safe zones; virality scorecard; six glow covers and per-platform SEO.\n\n## Sources\n\n'+refs+'\n'
    (folder/'spec.md').write_text(spec)
    (folder/'analysis/spec.md').write_text(spec)
    status = f"# {j['keyword']} status — 10 November 2026\n\n- Intake: downloaded and transcribed. One-frame-per-second reference sheets inspected.\n- Duplicate check: {j['duplicate_check']}\n- Script/spec: drafted and fact checked; live promotional terms remain qualified.\n- Voice: fixed REFERRAL profile; paid account UI must be verified before generating.\n- Credits spent on this job: **0**. No avatar or narration submitted.\n- Blocker: Mac locked at the Chrome access check; owner asked to unlock. Plugin is the other account with 0 credits.\n- Release: **not approved, not scheduled, not posted**. Target only 10–11 Nov; actual release awaits finished package approval and live guide/reply rule.\n"
    (folder/'STATUS.md').write_text(status)
    rows.append({'job':j['job'],'keyword':j['keyword'],'reference':j['reference'],'title':j['title'],
                 'reference_seconds':j['reference_seconds'],'script_words':len(script.split()),
                 'resource_url':url,'state':'preproduction','credits_spent':0,
                 'platforms':{p:{'state':'not_booked','url':None} for p in batch['platforms']}})
    print(j['keyword'],j['job'],len(script.split()),'words; schema PASS')

(HERE/'production-status.json').write_text(json.dumps({'as_of':checked,'target_dates':batch['delivery_dates'],'timezone':batch['timezone'],'jobs':rows},indent=2)+'\n')
(HERE/'reply-rules-draft.json').write_text(json.dumps({'status':'draft_not_deployed','rules':[
    {'keyword':j['keyword'],'link':'https://withhammad.com/resources/'+j['slug'],
     'dm':'Here is the guide 👇\n{link}','reply':'Sent you a DM ✅','media_ids':[]}
    for j in batch['jobs']]},indent=2,ensure_ascii=False)+'\n')
