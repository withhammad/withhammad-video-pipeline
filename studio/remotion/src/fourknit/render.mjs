// node src/fourknit/render.mjs stills <outDir> <t1,t2,...>  |  cover <out.jpg>  |  thumb <out.jpg>  |  proof <out.png>  |  video <out.mp4>
// Run through studio/heavy.sh (one heavy render at a time across sessions).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/0aeeb99aef7f/knit/public');
const [mode, out, a] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const still = async (id, fmt) => { const c = await selectComposition({serveUrl, id});
  await renderStill({serveUrl, composition: c, output: out, imageFormat: fmt, ...(fmt === 'jpeg' ? {jpegQuality: 93} : {})}); console.log(id, out); };
if (mode === 'proof') await still('FOUR-PROOF', 'png');
else if (mode === 'cover') await still('FOUR-COVER', 'jpeg');
else if (mode === 'thumb') await still('FOUR-THUMB45', 'jpeg');
else {
  const composition = await selectComposition({serveUrl, id: 'FOUR-KNIT'});
  if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
    for (const t of (a ?? '5').split(',').map(Number)) {
      await renderStill({serveUrl, composition, output: path.join(out, `t${t.toFixed(2)}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30))});
      console.log('still', t);
    } }
  else { await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 17, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6, muted: true,
    onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`${Math.round(progress * 100)}% `); }});
    console.log('rendered', out); }
}
