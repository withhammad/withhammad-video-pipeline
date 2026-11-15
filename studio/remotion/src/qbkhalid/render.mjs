// node src/qbkhalid/render.mjs stills <outDir> <t1,t2,...>  |  node src/qbkhalid/render.mjs video <out.mp4>  |  ... cover <out.jpg>
/* global process, console */
// Run through studio/heavy.sh. Audio after the render with finish.py (the reference track untouched but for gain): mux public/audio.wav
// as PCM, a peak limiter at -1.5 dBFS (idle here: the reference peaks at -3.0 dBTP), then app.audio.master(premaster, final, TP=-1.5).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/9c7bf4378ac0/qb/public');
const [mode, out, a] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
if (mode === 'cover') {
  const c = await selectComposition({serveUrl, id: 'QB-KHALID-COVER'});
  await renderStill({serveUrl, composition: c, output: out, imageFormat: 'jpeg', jpegQuality: 94}); console.log('cover', out);
} else {
  const composition = await selectComposition({serveUrl, id: 'QB-KHALID'});
  if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
    for (const t of (a ?? '1').split(',').map(Number)) {
      await renderStill({serveUrl, composition, output: path.join(out, `t${t.toFixed(2)}.jpg`), imageFormat: 'jpeg', jpegQuality: 88,
        frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30))}); console.log('still', t); } }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p',
    colorSpace: 'bt709', concurrency: 6}); console.log('rendered', out); }
}
