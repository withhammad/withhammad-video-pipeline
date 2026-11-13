// node src/dua/render.mjs stills <outDir> <t1,t2> ['{"arabicFont":"..."}']  |  node src/dua/render.mjs video <out.mp4> ['{props}']
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill, renderMedia} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/62dc5f187134/dua/public');
const [mode, out, a, b] = process.argv.slice(2);
const extra = JSON.parse((mode === 'stills' ? b : a) ?? '{}');
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const base = await selectComposition({serveUrl, id: 'DUA'});
const props = {...base.props, ...extra}, composition = {...base, props};
if (mode === 'cover') { const c = await selectComposition({serveUrl, id: 'DUA-COVER'}); await renderStill({serveUrl, composition: c, output: out, imageFormat: 'jpeg', jpegQuality: 92}); console.log('cover', out); }
else if (mode === 'stills') { fs.mkdirSync(out, {recursive: true});
  for (const t of (a ?? '5').split(',').map(Number)) { await renderStill({serveUrl, composition, inputProps: props, output: path.join(out, `t${t.toFixed(2)}${extra.tag ?? ''}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, frame: Math.round(t * 30)}); console.log('still', t); } }
else { await renderMedia({serveUrl, composition, inputProps: props, codec: 'h264', outputLocation: out, crf: 16, pixelFormat: 'yuv420p', colorSpace: 'bt709', concurrency: 6}); console.log('rendered', out); }
