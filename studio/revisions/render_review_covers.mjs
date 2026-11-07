import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rem = path.join(root, 'studio/remotion');
const require = createRequire(path.join(rem, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderStill} = require('@remotion/renderer');
const out = path.resolve(process.argv[2]);
const props = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(rem, 'src/brand/ReviewCovers.tsx'), publicDir: path.join(rem, 'public')});
const compositions = await getCompositions(serveUrl);
const names = {ReviewPortrait: '1080x1920', ReviewLinkedIn: '720x1280', ReviewGrid: '1080x1440', ReviewFeed: '1080x1350', ReviewSquare: '1080x1080', ReviewWide: '1280x720'};
for (const composition of compositions) {
  const output = path.join(out, `cover_${names[composition.id]}.jpg`);
  await renderStill({serveUrl, composition, output, imageFormat: 'jpeg', jpegQuality: 95,
    inputProps: {...composition.defaultProps, ...props}});
  console.log(output);
}
