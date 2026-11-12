// node src/couple/render.mjs stills <dir> <t1,t2>  |  node src/couple/render.mjs video <out.mp4>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const [mode, out, a] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: path.join(repo, 'studio/.local/jobs/c9319a467ed6/public')});
const composition = await selectComposition({serveUrl, id: 'FATHER'});
if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
  for (const t of (a ?? '5').split(',').map(Number)) await renderStill({serveUrl, composition, output: path.join(out, `t${t.toFixed(2)}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, frame: Math.round(t * 30)}); }
else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p', concurrency: 6}); }
console.log('done');
