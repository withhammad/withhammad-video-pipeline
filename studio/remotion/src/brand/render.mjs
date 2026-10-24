// Renders every brand sample still in one bundle: node src/brand/render.mjs [outDir]
// Output (default studio/.local/brand-samples): cover-kimi.png, cover-skill.png, *-guides.png,
// carousel-instagram-NN.png, carousel-linkedin-NN.png. Then run make_sheet.py for sample_sheet.png and the LinkedIn PDF.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.resolve(process.argv[2] || path.join(root, '../.local/brand-samples'));
fs.mkdirSync(out, {recursive: true});

const serveUrl = await bundle({entryPoint: path.join(here, 'index.tsx'), publicDir: path.join(root, 'public')});
const comps = await getCompositions(serveUrl);
const jobs = [
  ['BrandCoverKimi', 'cover-kimi.png'], ['BrandCoverSkill', 'cover-skill.png'],
  ['BrandCoverKimiGuides', 'cover-kimi-guides.png'], ['BrandCoverSkillGuides', 'cover-skill-guides.png'],
].map(([id, file]) => ({id, file, props: undefined}));
for (const pf of ['instagram', 'linkedin']) {
  const c = comps.find(x => x.id === `BrandCarousel-${pf}`);
  c.defaultProps.slides.forEach((_, i) => jobs.push({id: c.id, file: `carousel-${pf}-${String(i + 1).padStart(2, '0')}.png`, props: {...c.defaultProps, index: i}}));
}
for (const j of jobs) {
  const inputProps = j.props ?? comps.find(x => x.id === j.id).defaultProps;
  const composition = await selectComposition({serveUrl, id: j.id, inputProps});
  await renderStill({serveUrl, composition, output: path.join(out, j.file), imageFormat: 'png', inputProps});
  console.log('rendered', j.file);
}
