"""Zip a motion project as the free download on its resource page: the tiles, the shared runtime and fonts, the style
file, the brief, the scene lines and an index.html gallery, in one flat folder that opens by double-click.

  python3 studio/motion/pack.py studio/motion/claude-motion-graphics <out.zip>

Paths are rewritten for the flat layout (tiles/x.html -> ../tokens.css). The owner's photo, the poster and the reel
are not included: the download is the method, not his post.
"""
import json
import subprocess
import sys
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent

GALLERY = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Motion Graphics: 16 loops</title><link rel="stylesheet" href="tokens.css">
<style>
  html, body { height: auto; overflow: auto; }
  body { background: #f8f6fc; padding: 32px 16px 48px; }
  h1 { text-align: center; font-size: clamp(32px, 6vw, 56px); font-weight: 800; letter-spacing: -.05em; }
  p.sub { text-align: center; color: #6b6880; margin: 8px 0 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; max-width: 1100px; margin: 0 auto; }
  a.card { display: block; background: #fff; border: 1px solid #ebe7f3; border-radius: 18px; padding: 8px; color: inherit; text-decoration: none; }
  a.card:hover, a.card:focus-visible { border-color: #7232f1; outline: none; }
  .media { aspect-ratio: 224 / 200; border-radius: 12px; overflow: hidden; }
  .media iframe { width: 100%; height: 100%; border: 0; display: block; pointer-events: none; }
  .label { padding: 12px 8px 6px; font-weight: 600; font-size: 19px; letter-spacing: -.02em; }
  .label span { font: 500 13px var(--mono); color: #a39fb3; margin-right: 8px; }
</style></head>
<body><h1>Claude Motion Graphics</h1><p class="sub">16 loops from one style file. Click one to open it on its own.</p>
<div class="grid">__CARDS__</div></body></html>
"""

README = """Claude Motion Graphics: 16 loops from one style file
withhammad.com/resources/claude-motion-graphics

Open index.html to see all 16 playing, or any file in tiles/ on its own. Every tile is one HTML file, a seamless
6-second loop, no libraries.

How to make your own:
1. style-file-prompt.md: run it in Claude Code with a brand's website. It writes style.md (this one is Stripe-style).
2. Put brief.md under the style file.
3. Add one scene line (scenes.md has all 16): one object, one change.
4. Open the HTML file Claude writes in your browser.

Fonts: Inter and JetBrains Mono (SIL Open Font License, see fonts/OFL-*.txt). Some browsers block fonts on pages opened
from disk; then the system font is used. To see the exact fonts, run `python3 -m http.server` in this folder and open
http://localhost:8000.

Colours, corners and motion only: never copy a brand's logo, name or paid font.
"""


def pack(project, out):
    project = Path(project).resolve()
    scenes = json.loads(subprocess.run(['node', '-e', 'global.window = {}; require(process.argv[1]); '
                                        'console.log(JSON.stringify(window.SCENES))', str(project / 'scenes.js')],
                                       capture_output=True, text=True, check=True).stdout)
    cards = ''.join(f'<a class="card" href="tiles/{s["slug"]}.html"><div class="media"><iframe src="tiles/{s["slug"]}.html" '
                    f'loading="lazy" title="{s["object"]} to {s["change"]}" tabindex="-1"></iframe></div>'
                    f'<div class="label"><span>{s["n"]}</span>{s["object"]} → {s["change"]}</div></a>' for s in scenes)
    root = 'claude-motion-graphics/'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr(root + 'index.html', GALLERY.replace('__CARDS__', cards))
        z.writestr(root + 'README.txt', README)
        z.write(HERE / 'tokens.css', root + 'tokens.css')
        z.write(HERE / 'motion.js', root + 'motion.js')
        for font in sorted((HERE / 'fonts').iterdir()):
            z.write(font, root + 'fonts/' + font.name)
        for name in ('style.md', 'brief.md', 'style-file-prompt.md', 'scenes.md'):
            z.write(project / name, root + name)
        for tile in sorted((project / 'tiles').glob('*.html')):
            z.writestr(root + 'tiles/' + tile.name, tile.read_text().replace('../../tokens.css', '../tokens.css')
                       .replace('../../motion.js', '../motion.js'))
    return out


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    print(pack(*sys.argv[1:]))
