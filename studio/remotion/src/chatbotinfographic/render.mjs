// node src/chatbotinfographic/render.mjs video <ID> <out.mp4>  |  still <ID> <out.png> [propsJSON] [scale]  |  frames <ID> <dir> <f1,f2,..>
// Run through studio/heavy.sh. One 210-frame (7 s) cycle is rendered; the deliverables loop it with ffmpeg (seamless by design).
/* global process, console */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url));
const [mode, id, out, props, scale] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: path.resolve(here, '../../public')});
const inputProps = props && mode !== 'frames' ? JSON.parse(props) : {};
const composition = await selectComposition({serveUrl, id, inputProps});
if (mode === 'video') {
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: out, crf: 14, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6, inputProps});
} else if (mode === 'frames') {
  fs.mkdirSync(out, {recursive: true});
  for (const f of props.split(',').map(Number)) await renderStill({serveUrl, composition, frame: f, output: path.join(out, `f${String(f).padStart(3, '0')}.png`), imageFormat: 'png'});
} else {
  await renderStill({serveUrl, composition, output: out, imageFormat: 'png', inputProps, scale: scale ? Number(scale) : 1});
}
console.log('done', mode, id, out);
