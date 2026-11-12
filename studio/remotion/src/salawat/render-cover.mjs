// node src/salawat/render-cover.mjs <out.png>
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: path.join(repo, 'studio/.local/jobs/9aa507dd49fd/knit/public')});
const composition = await selectComposition({serveUrl, id: 'SALAWAT-COVER'});
await renderStill({serveUrl, composition, output: process.argv[2], imageFormat: 'png'}); console.log('cover', process.argv[2]);
