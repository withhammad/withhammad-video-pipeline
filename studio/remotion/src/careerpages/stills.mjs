// Contact stills for the career-pages reel in one bundle: node src/careerpages/stills.mjs <outDir> <scale> t1 t2 ...
import path from 'node:path'; import fs from 'node:fs'; import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler'; import {selectComposition, renderStill} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '../..');
const [out, scale, ...ts] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'index.tsx'), publicDir: path.join(root, 'public'), enableCaching: false});
const composition = await selectComposition({serveUrl, id: 'CareerPagesReel', chromiumOptions: {gl: 'swangle'}});
for (const t of ts) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(t) * 30));
  await renderStill({serveUrl, composition, frame, output: path.join(out, `t${String(t).padStart(5, '0')}.png`), scale: parseFloat(scale), chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 600000});
  console.log('still', t);
}
