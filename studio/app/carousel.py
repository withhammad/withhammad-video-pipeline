"""Carousel lane: one save-worthy guide carousel per reel, posted on Instagram, Facebook and LinkedIn.

Per job, in studio/.local/jobs/<job>/carousel/:
  slides.json    {"accent": "blue", "instagram": [SlideData...], "linkedin": [SlideData...]}  (remotion/src/brand/JobCarousel.tsx)
  captions.json  {"instagram": "...", "facebook": "...", "linkedin": "...", "title": "PDF document title"}
Render: cd studio/remotion && node src/brand/render-carousel.mjs <job>   -> instagram-NN.png, linkedin-NN.png

    python -m app.carousel check <job>     # validate slides.json + captions.json against the house rules (exit 1 on errors)
    python -m app.carousel build <job>     # after rendering: carousel-linkedin.pdf + carousel_sheet.jpg
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JOBS = ROOT / 'studio' / '.local' / 'jobs'
KINDS = {'cover', 'stat', 'step', 'compare', 'quote', 'terminal', 'logos', 'end'}
MIN_SLIDES, MAX_SLIDES = 6, 10       # Instagram allows 20; 6-10 is the swipe-through sweet spot
TITLE_MAX = 60
HASHTAG_RE = re.compile(r'(?<!\w)#\w+')
RETIRED = ('@with.hammad', '@hammadagentic.ai', 'ManyChat')


def _dir(job):
    return JOBS / job / 'carousel'


def check(job):
    """Errors (block posting) and warnings for a job's carousel files."""
    d = _dir(job)
    errors, warnings = [], []
    try:
        spec = json.loads((d / 'slides.json').read_text())
    except (FileNotFoundError, ValueError) as e:
        return {'job': job, 'errors': [f'slides.json: {e}'], 'warnings': []}
    lesson = json.loads((JOBS / job / 'lesson.json').read_text())
    keyword = (lesson.get('manychat_keyword') or '').upper()
    slug = (lesson.get('resource_page') or {}).get('slug') or ''
    for pf in ('instagram', 'linkedin'):
        slides = spec.get(pf) or []
        if not MIN_SLIDES <= len(slides) <= MAX_SLIDES:
            errors.append(f'{pf}: {len(slides)} slides (want {MIN_SLIDES}-{MAX_SLIDES})')
        if slides and not (slides[0].get('kind') == 'cover' and slides[0].get('job') == job):
            errors.append(f'{pf}: slide 1 must be {{"kind": "cover", "job": "{job}"}} (the reel\'s glow cover)')
        if slides and slides[-1].get('kind') != 'end':
            errors.append(f'{pf}: the last slide must be kind "end"')
        for i, s in enumerate(slides, 1):
            if s.get('kind') not in KINDS:
                errors.append(f'{pf} slide {i}: unknown kind {s.get("kind")!r}')
            text = json.dumps(s, ensure_ascii=False)
            if 'AI avatar' in text:
                errors.append(f'{pf} slide {i}: "AI avatar" text is not allowed on slides')
            title = s.get('title') or s.get('headline') or ''
            if len(title.replace('*', '')) > TITLE_MAX:
                warnings.append(f'{pf} slide {i}: title {len(title)} chars, may wrap to 4 lines')
        end = slides[-1] if slides else {}
        if pf == 'instagram' and keyword and (end.get('keyword') or '').upper() != keyword:
            errors.append(f'instagram end slide keyword must be {keyword}')
        if pf == 'linkedin' and slug and slug not in (end.get('link') or ''):
            errors.append(f'linkedin end slide link must contain the guide slug {slug}')
    try:
        caps = json.loads((d / 'captions.json').read_text())
    except (FileNotFoundError, ValueError) as e:
        errors.append(f'captions.json: {e}')
        caps = {}
    for pf in ('instagram', 'facebook', 'linkedin'):
        c = caps.get(pf) or ''
        if not c.strip():
            errors.append(f'captions.json: {pf} caption is empty')
            continue
        if any(r in c for r in RETIRED):
            errors.append(f'{pf} caption names a retired account or tool')
        tags = HASHTAG_RE.findall(c)
        limit = {'instagram': 5, 'facebook': 3, 'linkedin': 3}[pf]
        if len(tags) > limit:
            errors.append(f'{pf} caption has {len(tags)} hashtags (max {limit})')
    ig = caps.get('instagram') or ''
    if ig and keyword and f'Comment {keyword}' not in ig:
        errors.append(f'instagram caption must say "Comment {keyword}"')
    if ig and '@withhammad.ai' not in ig:
        errors.append('instagram caption must ask to follow @withhammad.ai')
    for pf in ('facebook', 'linkedin'):
        if caps.get(pf) and slug and slug not in caps[pf]:
            errors.append(f'{pf} caption must carry the guide URL (…/resources/{slug})')
    return {'job': job, 'keyword': keyword, 'slides': {pf: len(spec.get(pf) or []) for pf in ('instagram', 'linkedin')},
            'errors': errors, 'warnings': warnings}


def build(job):
    """carousel-linkedin.pdf from linkedin-NN.png and a contact sheet of the Instagram slides."""
    from PIL import Image
    d = _dir(job)
    li = sorted(d.glob('linkedin-[0-9][0-9].png'))
    ig = sorted(d.glob('instagram-[0-9][0-9].png'))
    if not li or not ig:
        raise SystemExit(f'{job}: render first (node src/brand/render-carousel.mjs {job})')
    pages = [Image.open(p).convert('RGB') for p in li]
    pages[0].save(d / 'carousel-linkedin.pdf', save_all=True, append_images=pages[1:], resolution=150)
    thumbs = [Image.open(p).convert('RGB').resize((270, 338)) for p in ig]
    cols = 5
    sheet = Image.new('RGB', (cols * 270, ((len(thumbs) + cols - 1) // cols) * 338), (0, 0, 0))
    for i, t in enumerate(thumbs):
        sheet.paste(t, ((i % cols) * 270, (i // cols) * 338))
    sheet.save(d / 'carousel_sheet.jpg', quality=88)
    return {'job': job, 'pdf_pages': len(li), 'instagram_slides': len(ig), 'sheet': str(d / 'carousel_sheet.jpg')}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    for name in ('check', 'build'):
        sub.add_parser(name).add_argument('job')
    a = p.parse_args(argv)
    out = check(a.job) if a.cmd == 'check' else build(a.job)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False); print()
    return 1 if out.get('errors') else 0


if __name__ == '__main__':
    raise SystemExit(main())
