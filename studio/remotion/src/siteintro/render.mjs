// node src/siteintro/render.mjs poster <outDir> [t]   |   node src/siteintro/render.mjs stills <outDir> <t1,t2,...> [SITE-WIDE|SITE-TALL]   |   node src/siteintro/render.mjs video <outDir>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/site-intro-20261112/render-public');
const [mode, out, arg, only] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
for (const id of ['SITE-WIDE', 'SITE-TALL'].filter(x => !only || x === only)) {
  const composition = await selectComposition({serveUrl, id});
  if (mode === 'poster') { const p = {...composition.props, poster: true}; await renderStill({serveUrl, composition: {...composition, props: p}, inputProps: p, output: path.join(out, `${id}_poster.jpg`), imageFormat: 'jpeg', jpegQuality: 90, frame: Math.round(Number(arg ?? 4.7) * 30)}); console.log('poster', id); }
  else if (mode === 'stills') for (const t of (arg ?? '1').split(',').map(Number)) { await renderStill({serveUrl, composition, output: path.join(out, `${id}_t${t.toFixed(2)}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, frame: Math.round(t * 30)}); console.log('still', id, t); }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: path.join(out, `${id}_silent.mp4`), crf: 18, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6}); console.log('rendered', id); }
}
