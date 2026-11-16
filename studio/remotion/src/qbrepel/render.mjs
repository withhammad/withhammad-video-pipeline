// node src/qbrepel/render.mjs stills <outDir> <t1,t2,...>  |  ... video <out.mp4>  |  ... still <ID> <out.jpg>
/* global process, console */
// Run through studio/heavy.sh. Audio after the render with finish.py (the reference track untouched but for gain).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/698c00a0a0e2/qb/public');
const [mode, a, b] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
if (mode === 'still') {
  const c = await selectComposition({serveUrl, id: a});
  await renderStill({serveUrl, composition: c, output: b, imageFormat: 'jpeg', jpegQuality: 94}); console.log('still', a, b);
} else {
  const composition = await selectComposition({serveUrl, id: 'QB-REPEL'});
  if (mode === 'stills') { fs.mkdirSync(a, {recursive: true});
    for (const t of (b ?? '1').split(',').map(Number)) {
      await renderStill({serveUrl, composition, output: path.join(a, `t${t.toFixed(2)}.jpg`), imageFormat: 'jpeg', jpegQuality: 88,
        frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30))}); console.log('still', t); } }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: a, crf: 16, pixelFormat: 'yuv420p',
    colorSpace: 'bt709', concurrency: 6}); console.log('rendered', a); }
}
