// Renders the glow-template covers for every reel in glowCovers.ts in one bundle:
//   node src/brand/render-glow.mjs [outDir] [jobId ...]
// Writes <outDir>/<job>/cover.png (1080x1920), guides.png and wide.png (1280x720). make_glow.py then writes the JPGs
// into each job's cover_glow/ folder and the profile-grid mock.
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.resolve(process.argv[2] || path.join(root, '../.local/brand-samples/glow'));
const only = process.argv.slice(3);
const serveUrl = await bundle({entryPoint: path.join(here, 'index.tsx'), publicDir: path.join(root, 'public')});
const comps = await getCompositions(serveUrl);
for (const c of comps.filter(c => /^Glow(Cover|CoverGuides|Wide)-/.test(c.id))) {
  const [kind, job] = c.id.split('-');
  if (only.length && !only.includes(job)) continue;
  fs.mkdirSync(path.join(out, job), {recursive: true});
  const file = {GlowCover: 'cover.png', GlowCoverGuides: 'guides.png', GlowWide: 'wide.png'}[kind];
  await renderStill({serveUrl, composition: c, output: path.join(out, job, file), imageFormat: 'png', inputProps: c.defaultProps});
  console.log('rendered', job, file);
}
