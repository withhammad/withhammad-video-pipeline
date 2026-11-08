import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const out = path.resolve(process.argv[2]);
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'covers.tsx'), publicDir: path.join(root, 'public')});
for (const composition of await getCompositions(serveUrl)) {
  const output = path.join(out, `cover_${composition.width}x${composition.height}.jpg`);
  await renderStill({serveUrl, composition, output, imageFormat: 'jpeg', jpegQuality: 92});
  console.log(output);
}
