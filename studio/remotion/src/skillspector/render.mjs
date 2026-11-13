// node src/skillspector/render.mjs <out.png> [scale]
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';
const here = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(here, '../../../..');
const pub = path.join(repo, 'studio/.local/jobs/skillspector-infographic/public');
const [out, scale = '2'] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.join(here, 'entry.tsx'), publicDir: pub});
const composition = await selectComposition({serveUrl, id: 'SKILLSPECTOR-INFOGRAPHIC'});
await renderStill({serveUrl, composition, output: out, imageFormat: 'png', scale: Number(scale)});
console.log('rendered', out);
