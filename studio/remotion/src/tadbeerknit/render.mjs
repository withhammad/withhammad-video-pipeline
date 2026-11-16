// node src/tadbeerknit/render.mjs stills <outDir> <f1,f2,...>  |  cover <out.jpg>  |  thumb <out.jpg>  |  proof <out.png>  |  video <out.mp4>
// Run through studio/heavy.sh (one heavy render at a time across sessions). Frames, not seconds, for stills.
/* global process, console */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/wife-DfsTrK5or6t/knit/public');
const [mode, out, a] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const still = async (id, file, fmt = 'jpeg') => { const c = await selectComposition({serveUrl, id});
  await renderStill({serveUrl, composition: c, output: file, imageFormat: fmt, ...(fmt === 'jpeg' ? {jpegQuality: 93} : {})}); console.log(id, file); };
if (mode === 'proof') await still('TADBEER-PROOF', out, 'png');
else if (mode === 'cover') await still('TADBEER-COVER', out);
else if (mode === 'thumb') await still('TADBEER-THUMB45', out);
else {
  const composition = await selectComposition({serveUrl, id: 'TADBEER-KNIT'});
  if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
    for (const f of (a ?? '100').split(',').map(Number)) {
      await renderStill({serveUrl, composition, output: path.join(out, `f${String(f).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 90, frame: f});
      console.log('still', f);
    } }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6, muted: true,
    onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`${Math.round(progress * 100)}% `); }});
    console.log('rendered', out); }
}
