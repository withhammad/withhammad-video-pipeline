"""Build local review packages. Does not publish, schedule, upload, or deploy."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs'
HERE = Path(__file__).resolve().parent
JOBS = [
    ('ai-engineer-roadmap-review', 'AI engineer roadmap', 'roadmap-review.zip'),
    ('coding-comedy-review', 'One word. 24 files?', 'coding-comedy-review.zip'),
    ('ai-returns-review', 'Check return deadlines', 'ai-returns-review.zip'),
]

roadmap = OUT / JOBS[0][0]
sheet = Image.new('RGB', (1620, 810), '#f7f7f3')
for i, path in enumerate(sorted((roadmap / 'slides').glob('*.png'))):
    with Image.open(path) as im:
        sheet.paste(im.resize((324, 405)), ((i % 5) * 324, (i // 5) * 405))
sheet.save(roadmap / 'contact.jpg', quality=92)
shutil.copy2(roadmap / 'assets/OFL-Inter.txt', ROOT / 'studio/remotion/public/review-20261023/OFL-Inter.txt')

manifest = {'status': 'awaiting_owner_review', 'published': False, 'scheduled': False,
            'public_repository_push_authorized': False,
            'owner_instruction': 'Do not publish; owner needs to review first.', 'drafts': []}
for folder, title, archive in JOBS:
    p = OUT / folder
    if folder == 'ai-engineer-roadmap-review':
        files = [p / name for name in ['README.md', 'carousel.html', 'slides.json', 'review-state.json', 'contact.jpg',
                  'analysis/resources.md', 'analysis/facts.md', 'analysis/layout-check.json',
                  'seo/seo.md', 'seo/seo.json', 'seo/verification.json']]
        files += sorted((p / 'slides').glob('*.png')) + sorted((p / 'assets').glob('*'))
        details = {'format': '10 slides, 1080 × 1350', 'file': 'carousel.html'}
    else:
        report = json.loads((p / 'verification.json').read_text())
        seconds = float(report['probe']['format']['duration'])
        details = {'format': f'{seconds:.2f}s, 1080 × 1920, 30 fps, H.264', 'file': 'final.mp4',
                   'sha256': report['sha256'], 'loudness_lufs': report['loudness']['input_i'],
                   'true_peak_dbtp': report['loudness']['input_tp']}
        note = ('Original fictional coding skit. The interface and file counts are comic illustrations, not a recording of a real coding tool.'
                if folder == 'coding-comedy-review' else
                'Illustrative return-check workflow. Graphics and licensed stock illustrate the steps; no live inbox or merchant action was recorded and no refund is claimed. The original bottom captions from the HeyGen source are covered; the source SRT is restyled in the safe zone. Asset credits are in assets/sources.json.')
        (p / 'README.md').write_text(f'''# {title} — review draft

**Awaiting owner review. Do not publish, schedule, deploy the resource, or enable a DM flow.**

- `final.mp4`: {details['format']}; original voice speed retained at 1.0.
- `cover.png`: portrait cover, 1080 × 1920.
- `captions.srt`: captions for this exact export.
- `script.txt`: spoken script; `resource-draft.md`: local companion guide.
- `seo/seo.md`: draft platform copy and labels for review.

{note}

Export checks passed: resolution, codec, limited colour range, frame count, caption bounds and peak level. Measured loudness: {details['loudness_lufs']} LUFS; true peak: {details['true_peak_dbtp']} dBTP. Final contact sheets and selected full-size frames were visually inspected. Owner review of delivery, sound, pacing and overall treatment remains pending; these checks are not a claim of full human audiovisual approval.

`timing.json` records added reading/reaction holds. Narration was not time-stretched. `verification.json` identifies the exact export by SHA-256. Local render source: `studio/remotion/src/review-20261023/`.
''')
        files = [p / name for name in ['README.md', 'final.mp4', 'cover.png', 'captions.srt', 'script.txt',
                 'resource-draft.md', 'review-state.json', 'verification.json', 'seo/seo.md', 'seo/seo.json',
                 'seo/verification.json']]
        if (p / 'assets/sources.json').exists():
            files.append(p / 'assets/sources.json')
    with zipfile.ZipFile(p / archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f.relative_to(p))
    manifest['drafts'].append({'title': title, 'folder': folder, 'archive': archive, **details,
                              'archive_sha256': hashlib.sha256((p / archive).read_bytes()).hexdigest()})
    print(folder, 'packaged', round((p / archive).stat().st_size / 1024**2, 2), 'MB')

manifest['validation'] = {
    'remotion_typescript': 'passed', 'media_checks': 'passed', 'visual_contact_sheets': 'inspected',
    'pytest': {'passed': 529, 'failed': 1, 'failure': 'test_tracked_schedule_and_slots_are_consistent',
               'reason': 'Existing schedule has two entries dated 2026-10-21; schedule unchanged by this work.'},
    'owner_audiovisual_review': 'pending'}
(HERE / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
(HERE / 'README.md').write_text('''# Reference drafts — owner review

Open `index.html` through the local review server. All three drafts remain local and unpublished. No publishing schedule or DM flow was created for these drafts. Companion resources are local drafts.

1. AI engineer roadmap: 10-slide carousel, guide and platform copy.
2. Coding comedy: 49-second reel, cover, captions and checklist.
3. AI return check: 79-second reel, cover, captions and two-prompt guide.

The videos use the approved Hammad avatar and cloned voice at natural 1.0 speed. They are new AI-avatar productions inspired by the supplied references, with original narration and graphics. The returns example is illustrative rather than a live transactional demonstration.

Technical media checks and the standalone Remotion TypeScript check passed. Full studio tests: 529 passed, 1 failed. The existing `test_tracked_schedule_and_slots_are_consistent` fails on a duplicate 21 October date; no schedule file was changed. See `pytest.log` locally.

Local review only: the GitHub repository is public, so these drafts must not be pushed before owner approval. Media and ZIP packages remain local; hashes are in `manifest.json` and each video verification file.
''')

page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hammad · Review drafts</title><style>
@font-face{font-family:Inter;src:url('../ai-engineer-roadmap-review/assets/inter-latin-600-normal.woff2');font-weight:600}
@font-face{font-family:Inter;src:url('../ai-engineer-roadmap-review/assets/inter-latin-800-normal.woff2');font-weight:800}
*{box-sizing:border-box}body{margin:0;background:#f6f6f1;color:#102535;font:600 15px/1.55 Inter,system-ui,sans-serif}main{max-width:1080px;margin:auto;padding:48px 24px 80px}.eyebrow{color:#287bd2;font-size:12px;letter-spacing:.13em;text-transform:uppercase}h1{font-size:clamp(32px,5vw,56px);letter-spacing:-.05em;line-height:1.1;margin:14px 0}h2{font-size:25px;letter-spacing:-.03em;margin:0 0 10px}.muted{color:#596c77}.status{display:inline-block;padding:7px 13px;border:1px solid #bad0de;border-radius:99px;background:#e9f1f7;margin:12px 0 24px}nav{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 36px}a{color:#1c64ac;text-underline-offset:4px}nav a,.button,button{border:1px solid #c2d1dc;padding:10px 16px;border-radius:10px;text-decoration:none;background:#fff;color:#14364c;font:inherit;cursor:pointer}button:disabled{opacity:.4;cursor:default}section{border-top:1px solid #cfdae1;padding:32px 0 44px;scroll-margin-top:20px}.layout{display:grid;grid-template-columns:minmax(220px,420px) 1fr;gap:36px;align-items:start}.media{width:100%;max-height:76vh;object-fit:contain;display:block;border-radius:16px;background:#102535}#slide{background:#f8f8f3}.controls{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}.links{display:flex;gap:14px;flex-wrap:wrap;margin:20px 0}.number{display:block;color:#287bd2;margin-bottom:6px;font-size:12px;letter-spacing:.1em}.note{padding:18px;background:#e9f1f7;border-radius:12px}.meta{font-size:13px;color:#596c77}footer{border-top:1px solid #cfdae1;padding-top:24px;color:#596c77;font-size:13px}@media(max-width:680px){main{padding:28px 16px 50px}.layout{grid-template-columns:1fr;gap:22px}.media{max-height:70vh}.info{order:-1}}
</style><main><div class="eyebrow">With Hammad / Review room</div><h1>Three drafts.<br>Your review comes first.</h1><div class="status">Awaiting your approval · Nothing published</div><p class="muted">Review the carousel, then the two reels. Each package includes the post copy and companion guide.</p><nav><a href="#roadmap">01 · Roadmap</a><a href="#comedy">02 · Coding comedy</a><a href="#returns">03 · Return check</a></nav>
<section id="roadmap"><div class="layout"><div><img id="slide" class="media" src="../ai-engineer-roadmap-review/slides/01.png" alt="AI engineer roadmap, slide 1 of 10"><div class="controls"><button id="prev" aria-label="Previous slide" disabled>← Previous</button><span id="count" aria-live="polite">1 / 10</span><button id="next" aria-label="Next slide">Next →</button></div></div><div class="info"><span class="number">01 / INSTAGRAM CAROUSEL</span><h2>Build your path into AI engineering</h2><p class="meta">10 slides · 1080 × 1350</p><p>Six learning stages, practical projects, and a portfolio path. No fixed timeline or hiring promise.</p><div class="links"><a href="../ai-engineer-roadmap-review/roadmap-review.zip" download>Download package</a><a href="../ai-engineer-roadmap-review/carousel.html">All slides</a></div><div class="links"><a href="../ai-engineer-roadmap-review/seo/seo.md">Post copy & alt text</a><a href="../ai-engineer-roadmap-review/analysis/resources.md">Companion guide</a></div><p class="note">Review the sequence, wording, visual style, and final slide.</p></div></div></section>
<section id="comedy"><div class="layout"><video class="media" controls playsinline preload="metadata" poster="../coding-comedy-review/cover.png" src="../coding-comedy-review/final.mp4"><track kind="captions" srclang="en" label="English" src="../coding-comedy-review/captions.vtt"></video><div class="info"><span class="number">02 / INSTAGRAM REEL</span><h2>One word. 24 files?</h2><p class="meta">49 seconds · 1080 × 1920</p><p>A tiny button change grows into an absurd coding project. Your avatar stays in the scene with an original assistant character.</p><div class="links"><a href="../coding-comedy-review/coding-comedy-review.zip" download>Download package</a><a href="../coding-comedy-review/final.mp4" download>MP4</a><a href="../coding-comedy-review/cover.png">Cover</a></div><div class="links"><a href="../coding-comedy-review/seo/seo.md">Post copy</a><a href="../coding-comedy-review/resource-draft.md">Checklist</a><a href="../coding-comedy-review/captions.srt">Captions</a></div><p class="note">Review the delivery, reaction pauses, assistant scenes, and punchline. The interface is fictional.</p></div></div></section>
<section id="returns"><div class="layout"><video class="media" controls playsinline preload="metadata" poster="../ai-returns-review/cover.png" src="../ai-returns-review/final.mp4"><track kind="captions" srclang="en" label="English" src="../ai-returns-review/captions.vtt"></video><div class="info"><span class="number">03 / YOUTUBE SHORT</span><h2>Before the return deadline slips</h2><p class="meta">79 seconds · 1080 × 1920</p><p>Check eligibility, organise deadlines, and draft the next action for review. Two prompt cards are held on screen so they can be read.</p><div class="links"><a href="../ai-returns-review/ai-returns-review.zip" download>Download package</a><a href="../ai-returns-review/final.mp4" download>MP4</a><a href="../ai-returns-review/cover.png">Cover</a></div><div class="links"><a href="../ai-returns-review/seo/seo.md">Post copy</a><a href="../ai-returns-review/resource-draft.md">Prompt guide</a><a href="../ai-returns-review/captions.srt">Captions</a></div><p class="note">Review the pacing, prompt readability, and overall treatment. This is an illustrative workflow; no actual return or refund was performed.</p></div></div></section>
<footer>Local drafts only. Publishing, scheduling and resource deployment remain on hold until your approval.</footer></main><script>
let current=1;const slide=document.getElementById('slide'),prev=document.getElementById('prev'),next=document.getElementById('next');function show(n){current=Math.max(1,Math.min(10,n));slide.src='../ai-engineer-roadmap-review/slides/'+String(current).padStart(2,'0')+'.png';slide.alt='AI engineer roadmap, slide '+current+' of 10';document.getElementById('count').textContent=current+' / 10';prev.disabled=current===1;next.disabled=current===10}prev.onclick=()=>show(current-1);next.onclick=()=>show(current+1);document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==v)other.pause()})));
</script></html>'''
(HERE / 'index.html').write_text(page)
for folder, _, _ in JOBS[1:]:
    p = OUT / folder
    import re
    srt = (p / 'captions.srt').read_text()
    (p / 'captions.vtt').write_text('WEBVTT\n\n' + re.sub(r'(\d{2}:\d{2}:\d{2}),(\d{3})', r'\1.\2', srt))
