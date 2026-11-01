// Renders a job's carousel from studio/.local/jobs/<job>/carousel/slides.json:
//   node src/brand/render-carousel.mjs <job> [<job> ...]
// slides.json: {"accent": "blue", "instagram": [SlideData...], "linkedin": [SlideData...]} (see JobCarousel.tsx).
// Writes <job>/carousel/instagram-NN.png and linkedin-NN.png; then run make_carousel.py <job> for JPEGs, PDF, sheet.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const jobsDir = path.resolve(root, '../.local/jobs');
const jobs = process.argv.slice(2);
if (!jobs.length) { console.error('usage: node src/brand/render-carousel.mjs <job> [...]'); process.exit(2); }
const serveUrl = await bundle({entryPoint: path.join(here, 'index.tsx'), publicDir: path.join(root, 'public')});
for (const job of jobs) {
  const dir = path.join(jobsDir, job, 'carousel');
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'slides.json'), 'utf8'));
  for (const pf of ['instagram', 'linkedin']) {
    const slides = spec[pf];
    if (!Array.isArray(slides) || !slides.length) continue;
    for (const f of fs.readdirSync(dir)) if (new RegExp(`^${pf}-\\d\\d\\.png$`).test(f)) fs.unlinkSync(path.join(dir, f));
    for (let i = 0; i < slides.length; i++) {
      const inputProps = {slides, index: i, platform: pf, accent: spec.accent ?? 'blue'};
      const composition = await selectComposition({serveUrl, id: `JobCarousel-${pf}`, inputProps});
      await renderStill({serveUrl, composition, output: path.join(dir, `${pf}-${String(i + 1).padStart(2, '0')}.png`), imageFormat: 'png', inputProps});
    }
    console.log('rendered', job, pf, slides.length);
  }
}
