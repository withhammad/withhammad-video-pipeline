// node src/fablelastday/render.mjs still <ID> <out.png> [frame]  |  ... video <ID> <out.mp4>  |  ... stills <ID> <outDir> <t1,t2,...>
/* global process, console */
// Run through studio/heavy.sh. One loop is rendered; ffmpeg doubles it (the loop is seamless).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/fablelastday/public');
const [mode, id, out, extra] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const composition = await selectComposition({serveUrl, id});
if (mode === 'still') {
  await renderStill({serveUrl, composition, output: out, imageFormat: 'png', frame: Number(extra ?? 0)}); console.log('still', id, out);
} else if (mode === 'stills') {
  fs.mkdirSync(out, {recursive: true});
  for (const t of (extra ?? '0').split(',').map(Number)) {
    await renderStill({serveUrl, composition, output: path.join(out, `${id}-t${t.toFixed(2)}.png`), imageFormat: 'png',
      frame: Math.min(composition.durationInFrames - 1, Math.round(t * 30))}); console.log('still', t);
  }
} else {
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p',
    colorSpace: 'bt709', concurrency: 4}); console.log('rendered', out);
}
