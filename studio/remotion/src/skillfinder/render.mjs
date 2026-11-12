// node src/skillfinder/render.mjs stills <outDir> <t1,t2,...> [avatar path under public]
// node src/skillfinder/render.mjs video <out.mp4> [audio path under public | none] [avatar path under public]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/abedb4efa2df/render-public');
const [mode, out, arg, arg2] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const inputProps = mode === 'video' ? {audio: arg === 'none' ? undefined : (arg ?? 'x/voice.mp3'), ...(arg2 ? {avatar: arg2} : {})} : (arg2 ? {avatar: arg2} : {});
const base = await selectComposition({serveUrl, id: 'SKILLFINDER'});
const composition = {...base, props: {...base.props, ...inputProps}};
if (mode === 'stills') {
  fs.mkdirSync(out, {recursive: true});
  for (const t of (arg ?? '1').split(',').map(Number)) { await renderStill({serveUrl, composition, inputProps: composition.props, output: path.join(out, `t${t.toFixed(2).padStart(5, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, frame: Math.round(t * 30)}); console.log('still', t); }
} else {
  await renderMedia({serveUrl, composition, inputProps: composition.props, codec: 'h264', outputLocation: out, crf: 17, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6,
    onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); }});
  console.log('\nrendered', out);
}
