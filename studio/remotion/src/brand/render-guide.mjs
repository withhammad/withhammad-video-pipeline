// Renders a guide-document carousel (GuideDoc.tsx, the AI Central template in our colours):
//   node src/brand/render-guide.mjs <guide dir> [<guide dir> ...]
// <guide dir>/guide.json: {"docTitle": "...", "footUrl"?: "...", "instagram": [GuidePage...], "linkedin": [GuidePage...]}
// Writes <guide dir>/instagram-NN.png and linkedin-NN.png (1080x1350).
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dirs = process.argv.slice(2).map(d => path.resolve(d));
if (!dirs.length) { console.error('usage: node src/brand/render-guide.mjs <guide dir> [...]'); process.exit(2); }
const serveUrl = await bundle({entryPoint: path.join(here, 'index.tsx'), publicDir: path.join(root, 'public')});
for (const dir of dirs) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'guide.json'), 'utf8'));
  for (const pf of ['instagram', 'linkedin']) {
    const pages = spec[pf];
    if (!Array.isArray(pages) || !pages.length) continue;
    const only = process.env.PAGES ? process.env.PAGES.split(',').map(Number) : null;   // PAGES=3,5 re-renders just those pages
    if (!only) for (const f of fs.readdirSync(dir)) if (new RegExp(`^${pf}-\\d\\d\\.png$`).test(f)) fs.unlinkSync(path.join(dir, f));
    for (let i = 0; i < pages.length; i++) {
      if (only && !only.includes(i + 1)) continue;
      const inputProps = {pages, index: i, docTitle: spec.docTitle, footUrl: spec.footUrl};
      const composition = await selectComposition({serveUrl, id: 'GuideDoc', inputProps});
      await renderStill({serveUrl, composition, output: path.join(dir, `${pf}-${String(i + 1).padStart(2, '0')}.png`), imageFormat: 'png', inputProps});
    }
    console.log('rendered', path.basename(dir), pf, pages.length);
  }
}
