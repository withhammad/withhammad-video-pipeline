"""Guide carousels: the AI Central template (docs/profile-seo/ref-aicentral/README.md) for Instagram, Facebook and LinkedIn.

One folder per guide, outputs/guides/<slug>/:
  guide.json     {"docTitle", "keyword", "source", "reference", "instagram": [GuidePage...], "linkedin": [GuidePage...]}
  captions.json  {"title", "instagram", "facebook", "linkedin"}
Render: cd studio/remotion && node src/brand/render-guide.mjs ../../outputs/guides/<slug>   -> instagram-NN.png, linkedin-NN.png

    python -m app.guide check <slug>    # house rules (exit 1 on errors)
    python -m app.guide build <slug>    # after rendering: carousel-linkedin.pdf + sheet.jpg
    python -m app.guide site <slug>     # PDF to withhammad.com/media/guides/<slug>.pdf + the keyword DM rule (site clone,
                                        # committed, not pushed; the next site push or media hosting pushes it)
    python -m app.guide short <slug>    # instagram-NN.png -> short.mp4 (9:16 slide video for YouTube Shorts, TikTok, X)
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUIDES = ROOT / 'outputs' / 'guides'
PUBLIC = ROOT / 'studio' / 'remotion' / 'public'
KINDS = {'cover', 'promise', 'item', 'more', 'library', 'cta'}
HASHTAG_RE = re.compile(r'(?<!\w)#\w+')
RETIRED = ('@with.hammad', '@hammadagentic.ai', 'ManyChat')
IG_MAX = 20


def check(slug, base=GUIDES, public=PUBLIC):
    d = Path(base) / slug
    errors, warnings = [], []
    try:
        spec = json.loads((d / 'guide.json').read_text())
    except (FileNotFoundError, ValueError) as e:
        return {'slug': slug, 'errors': [f'guide.json: {e}'], 'warnings': []}
    keyword = (spec.get('keyword') or '').upper()
    if not keyword:
        errors.append('guide.json needs a "keyword" (the Instagram comment keyword)')
    if not spec.get('source'):
        errors.append('guide.json needs a "source" (where the facts were checked, with the date)')
    for pf in ('instagram', 'linkedin'):
        pages = spec.get(pf) or []
        if not 6 <= len(pages) <= (IG_MAX if pf == 'instagram' else 60):
            errors.append(f'{pf}: {len(pages)} pages (want 6-{IG_MAX if pf == "instagram" else 60})')
        if pages and pages[0].get('kind') != 'cover':
            errors.append(f'{pf}: page 1 must be the cover')
        if pages and pages[-1].get('kind') != 'cta':
            errors.append(f'{pf}: the last page must be the cta')
        for i, p in enumerate(pages, 1):
            if p.get('kind') not in KINDS:
                errors.append(f'{pf} page {i}: unknown kind {p.get("kind")!r}')
            if 'AI avatar' in json.dumps(p, ensure_ascii=False):
                errors.append(f'{pf} page {i}: "AI avatar" is not allowed')
            for key in ('shot', 'hero'):
                ref = p.get(key)
                if ref and not ref.startswith('http') and not (Path(public) / ref).exists():
                    errors.append(f'{pf} page {i}: {key} {ref} not found in studio/remotion/public')
            if p.get('kind') == 'item' and not (p.get('shot') or p.get('prompt')):
                errors.append(f'{pf} page {i}: an item needs a real screenshot (shot) or a prompt')
        if pf == 'instagram' and pages and keyword and keyword not in (pages[-1].get('stamp1', '') + pages[-1].get('stamp2', '')).upper():
            errors.append(f'instagram cta must carry the keyword {keyword}')
    try:
        caps = json.loads((d / 'captions.json').read_text())
    except (FileNotFoundError, ValueError) as e:
        errors.append(f'captions.json: {e}')
        caps = {}
    for pf, limit in (('instagram', 5), ('facebook', 3), ('linkedin', 3)):
        c = caps.get(pf) or ''
        if not c.strip():
            errors.append(f'captions.json: {pf} caption is empty'); continue
        if any(r in c for r in RETIRED):
            errors.append(f'{pf} caption names a retired account or tool')
        if len(HASHTAG_RE.findall(c)) > limit:
            errors.append(f'{pf} caption has more than {limit} hashtags')
        if len(c) > 2200:
            errors.append(f'{pf} caption is {len(c)} characters (max 2200)')
    ig = caps.get('instagram') or ''
    if ig and keyword and f'Comment {keyword}' not in ig:
        errors.append(f'instagram caption must say "Comment {keyword}"')
    if ig and '@withhammad.ai' not in ig:
        errors.append('instagram caption must ask to follow @withhammad.ai')
    for pf in ('facebook', 'linkedin'):
        if caps.get(pf) and 'withhammad.com' not in caps[pf]:
            errors.append(f'{pf} caption must carry a withhammad.com link')
    if not caps.get('title'):
        warnings.append('captions.json has no title (LinkedIn document title falls back to docTitle)')
    return {'slug': slug, 'keyword': keyword, 'pages': {pf: len(spec.get(pf) or []) for pf in ('instagram', 'linkedin')},
            'errors': errors, 'warnings': warnings}


def build(slug, base=GUIDES):
    from PIL import Image
    d = Path(base) / slug
    li = sorted(d.glob('linkedin-[0-9][0-9].png'))
    ig = sorted(d.glob('instagram-[0-9][0-9].png'))
    if not li or not ig:
        raise SystemExit(f'{slug}: render first (node src/brand/render-guide.mjs ../../outputs/guides/{slug})')
    pages = [Image.open(p).convert('RGB') for p in li]
    pages[0].save(d / 'carousel-linkedin.pdf', save_all=True, append_images=pages[1:], resolution=150)
    thumbs = [p.resize((270, 338)) for p in pages]
    cols = 5
    sheet = Image.new('RGB', (cols * 270, ((len(thumbs) + cols - 1) // cols) * 338), (255, 255, 255))
    for i, t in enumerate(thumbs):
        sheet.paste(t, ((i % cols) * 270, (i // cols) * 338))
    sheet.save(d / 'sheet.jpg', quality=88)
    return {'slug': slug, 'pdf_pages': len(li), 'instagram_pages': len(ig), 'sheet': str(d / 'sheet.jpg')}


SITE = ROOT / 'work' / 'site' / 'withhammad-rebuild'
SITE_BASE = 'https://withhammad.com'


def site(slug, base=GUIDES, site_dir=SITE, run=None):
    """Copy the guide PDF into the site clone and add its keyword DM rule, then commit there."""
    import shutil
    import subprocess
    from app import dm_rules
    run = run or (lambda cmd: subprocess.run(cmd, cwd=site_dir, check=True, capture_output=True, text=True).stdout)
    report = check(slug, base)
    if report['errors']:
        raise SystemExit(f'{slug}: fix the check errors first: {report["errors"][:3]}')
    d = Path(base) / slug
    pdf = d / 'carousel-linkedin.pdf'
    if not pdf.exists():
        raise SystemExit(f'{slug}: run app.guide build first')
    spec = json.loads((d / 'guide.json').read_text())
    rel = f'public/media/guides/{slug}.pdf'
    dest = Path(site_dir) / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(pdf, dest)
    link = f'{SITE_BASE}/media/guides/{slug}.pdf'
    dm = (f"Here is your {spec['docTitle']} guide 👇\n{link}\n\n"
          f"Every free guide: {SITE_BASE}/resources")
    dm_rules.add_rule(report['keyword'], link, dm=dm, path=Path(site_dir) / 'src' / 'content' / 'dm-rules.json')
    run(['git', 'add', '--', rel, 'src/content/dm-rules.json'])
    if run(['git', 'status', '--porcelain', '--', rel, 'src/content/dm-rules.json']).strip():
        run(['git', 'commit', '-m', f"Add the {report['keyword']} guide PDF and its keyword DM",
             '-m', 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'])
    return {'slug': slug, 'keyword': report['keyword'], 'link': link, 'errors': []}


MUSIC = PUBLIC / 'motion-library' / 'music.wav'   # our own synthesized bed (docs/videos/2026-10-18-claude-motion-graphics.md)
PAPER_HEX = '0xF3F1EC'


def short(slug, base=GUIDES, run=None):
    """The Instagram pages as a 9:16 slide video: each 1080x1350 page centred on paper, the cover held a little
    longer, the music bed looped and faded, H.264 limited range under 10 MB (the Chrome upload limit)."""
    import subprocess
    run = run or subprocess.run
    d = Path(base) / slug
    pages = sorted(d.glob('instagram-[0-9][0-9].png'))
    if not pages:
        raise SystemExit(f'{slug}: render the pages first')
    holds = [3.2] + [2.6] * (len(pages) - 2) + [3.4]
    concat = d / '.short-pages.txt'
    concat.write_text(''.join(f"file '{p.name}'\nduration {h}\n" for p, h in zip(pages, holds)) + f"file '{pages[-1].name}'\n")
    total = sum(holds)
    out = d / 'short.mp4'
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(concat), '-stream_loop', '-1', '-i', str(MUSIC),
           '-filter_complex',
           f'[0:v]fps=30,scale=1080:1350,pad=1080:1920:0:285:color={PAPER_HEX},format=yuv420p[v];'
           f'[1:a]atrim=0:{total},afade=t=in:d=0.4,afade=t=out:st={total - 1.5}:d=1.5,loudnorm=I=-14:TP=-1.5[a]',
           '-map', '[v]', '-map', '[a]', '-t', f'{total}', '-c:v', 'libx264', '-profile:v', 'high', '-b:v', '1100k',
           '-maxrate', '1500k', '-bufsize', '3000k', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709',
           '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(out)]
    run(cmd, check=True, cwd=d)
    concat.unlink(missing_ok=True)
    return {'slug': slug, 'short': str(out), 'pages': len(pages), 'seconds': round(total, 1),
            'mb': round(out.stat().st_size / 1e6, 1) if out.exists() else None}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    for name in ('check', 'build', 'site', 'short'):
        sub.add_parser(name).add_argument('slug')
    a = p.parse_args(argv)
    out = {'check': check, 'build': build, 'site': site, 'short': short}[a.cmd](a.slug)
    json.dump(out, sys.stdout, indent=2, ensure_ascii=False); print()
    return 1 if out.get('errors') else 0


if __name__ == '__main__':
    raise SystemExit(main())
