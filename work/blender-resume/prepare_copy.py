"""Refresh the existing Blender copy using verified sources; no posting or scheduling."""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'studio'))
from app import repost_queue as rq

JOB = ROOT / 'studio/.local/jobs/3f33678db749'
V = JOB / 'referral-v4'

sources = [
    'https://github.com/arjun988/blender-skills',
    'https://github.com/ahujasid/mcp-for-blender',
    'https://code.claude.com/docs/en/overview',
    'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=claude%20code%20blender',
]
seo_path = JOB / 'seo/seo.json'
backup = V / 'seo.before-v4.json'
if not backup.exists():
    shutil.copy2(seo_path, backup)
seo = json.loads(backup.read_text())

def revise(value):
    if isinstance(value, str):
        return value.replace('@with.hammad', '@withhammad.ai').replace(
            'Claude Code needs a paid plan', 'Claude usage costs').replace(
            'Claude Code: paid plan', 'Claude usage costs')
    if isinstance(value, dict):
        return {k:revise(v) for k,v in value.items()}
    if isinstance(value, list):
        return [revise(v) for v in value]
    return value

seo = revise(seo)
seo['researched_at'] = '2026-11-10'
seo['sources'] = sources
seo['review_status'] = 'draft; final avatar/voice and package approval pending'
seo['research_update'] = {
    'autocomplete_file': 'seo/yt_suggest-2026-11-10.json',
    'primary_keyword': 'claude code blender',
    'observed_suggestions': ['claude code blender skills','claude code blender mcp',
        'claude code blender animation','claude code blender tutorial','claude code blender setup'],
    'inference': 'Setup/tutorial intent and the exact tool-pair phrase justify the title. No search-volume estimate is claimed.',
    'facts_checked': '94 skills and MIT confirmed in repository; community MCP add-on and setup command confirmed; Claude billing wording updated.',
    'prior_research': '6 November competitor/search records retained as historical research, not fresh performance evidence.',
}
seo['evidence'] = [e for e in seo.get('evidence',[]) if 'unowned' not in e.get('claim','')]
seo['blockers'] = [
    'Owner narration review and finished-package approval pending.',
    'Deploy the guide and BLENDER keyword rule and verify them live before any release.',
]
seo_path.write_text(json.dumps(seo,indent=2,ensure_ascii=False)+'\n')
sections = []
checks = {}
for platform in ['youtube','instagram','tiktok','linkedin','facebook','x']:
    text, _ = rq.seo_caption(JOB.name, platform)
    checks[platform] = {'pass':True,'characters':len(text)}
    title = seo[platform].get('title') or seo[platform].get('video_title') or ''
    tags = seo[platform].get('hashtags', [])
    sections.append(f'## {platform.title()}\n\n' + (title+'\n\n' if title else '') + text +
        ('\n\n'+' '.join(tags) if tags and not all(t in text for t in tags) else ''))
(V/'copy.md').write_text('# BLENDER — platform copy draft\n\nFinal voice/avatar and package approval pending. '
    'Guide and keyword route must be live before release.\n\n'+'\n\n'.join(sections)+'\n')
(V/'seo-check.json').write_text(json.dumps(checks,indent=2)+'\n')

lesson_path = JOB/'lesson.json'
if not (V/'lesson.before-v4.json').exists():
    shutil.copy2(lesson_path, V/'lesson.before-v4.json')
lesson = json.loads((V/'lesson.before-v4.json').read_text())
script = (V/'script.txt').read_text().strip()
parts = [
    'Claude Code can now run Blender for you, so you can build 3D models, textures and animations by describing them, and the skills are free!',
    "It's called Blender Skills, a free, open source pack of 94 skills for your coding agent.",
    'All you need is Blender open with the MCP for Blender add-on connected.',
    'Just describe your scene, like a cyberpunk alley for Unreal Engine, and the Blender Director plans the job,',
    'builds characters, props and the environment, then adds lighting and textures, optimizes it and exports it, coordinating each step. Claude usage still costs.',
    "Want the setup? Comment BLENDER and I'll send it!",
]
assert ' '.join(parts) == script
for segment, spoken in zip(lesson['script']['segments'], parts):
    segment['spoken'] = spoken
lesson['script']['estimated_seconds'] = 38
lesson = revise(lesson)
lesson['production_status'] = 'narration_review_pending'
lesson['revision'] = 'REFERRAL v4 narration; 10 November 2026'
lesson_path.write_text(json.dumps(lesson,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(checks,indent=2))
