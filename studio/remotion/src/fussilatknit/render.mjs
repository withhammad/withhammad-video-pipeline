// node src/fussilatknit/render.mjs stills <outDir> <t1,t2,...>  |  cover <out.jpg>  |  video <out.mp4>
// Run through studio/heavy.sh (one heavy render at a time across sessions).
/* global process, console */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/9b168b3f7c02/knit/public');
const [mode, out, a] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
if (mode === 'proof') {
  const c = await selectComposition({serveUrl, id: 'FUSSILAT-PROOF'});
  await renderStill({serveUrl, composition: c, output: out, imageFormat: 'png'}); console.log('proof', out);
} else if (mode === 'cover') {
  const c = await selectComposition({serveUrl, id: 'FUSSILAT-COVER'});
  await renderStill({serveUrl, composition: c, output: out, imageFormat: 'jpeg', jpegQuality: 93}); console.log('cover', out);
} else {
  const composition = await selectComposition({serveUrl, id: 'FUSSILAT-KNIT'});
  if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
    for (const t of (a ?? '5').split(',').map(Number)) {
      await renderStill({serveUrl, composition, output: path.join(out, `t${t.toFixed(2)}.png`), imageFormat: 'png', frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30))});
      console.log('still', t);
    } }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6,
    onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`${Math.round(progress * 100)}% `); }});
    console.log('rendered', out); }
}
