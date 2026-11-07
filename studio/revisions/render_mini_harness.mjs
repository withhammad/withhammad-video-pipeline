import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rem = path.join(root, 'studio/remotion');
const work = path.join(root, 'work/reference-mini-harness');
const out = '/Users/hammad/Documents/Codex/2026-11-07/you-are-taking-over-the-withhammad/outputs/Mini-Harness';
const require = createRequire(path.join(rem, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderStill, renderMedia} = require('@remotion/renderer');
const assets = path.join(work, 'assets');
fs.mkdirSync(path.join(assets, 'fonts'), {recursive: true});
fs.mkdirSync(path.join(out, 'carousel'), {recursive: true});
fs.mkdirSync(path.join(work, 'qa'), {recursive: true});
fs.copyFileSync(path.join(work, 'reference-hires.jpg'), path.join(assets, 'reference.jpg'));
for (const font of ['inter-latin-500-normal.woff2', 'inter-latin-700-normal.woff2', 'inter-latin-900-normal.woff2', 'source-serif-4-latin-700-normal.woff2']) {
  fs.copyFileSync(path.join(rem, 'public/fonts', font), path.join(assets, 'fonts', font));
}
const serveUrl = await bundle({entryPoint: path.join(rem, 'src/miniharness/index.tsx'), publicDir: assets, outDir: path.join(work, 'bundle')});
const comps = await getCompositions(serveUrl);
fs.writeFileSync(path.join(work, 'compositions.json'), JSON.stringify(comps, null, 2));
const video = comps.find(c => c.id === 'MiniHarness');
const carousel = comps.find(c => c.id === 'HarnessCarousel');
if (!process.argv.includes('--video-only')) {
  for (let i = 0; i < 7; i++) {
    await renderStill({serveUrl, composition: {...carousel, props: {page: i}}, output: path.join(out, 'carousel', `${String(i + 1).padStart(2, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 96, inputProps: {page: i}});
  }
  for (const f of [0, 135, 459, 783, 1107, 1431, 1750]) {
    await renderStill({serveUrl, composition: video, frame: f, output: path.join(work, 'qa', `frame-${String(f).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 94});
  }
  console.log('Carousel and scene checks rendered');
}
if (process.argv.includes('--full') || process.argv.includes('--video-only')) {
  for (const id of ['MiniHarness', 'MiniHarnessLinkedIn']) {
    const composition = comps.find(c => c.id === id);
    await renderMedia({serveUrl, composition, outputLocation: path.join(work, `${id}-silent.mp4`), codec: 'h264', crf: 18, pixelFormat: 'yuv420p', concurrency: 2,
      onProgress: ({progress}) => {const n = Math.floor(progress * 100); if (n % 20 === 0 && globalThis.lastProgress !== `${id}:${n}`) {console.log(`${id} ${n}%`); globalThis.lastProgress = `${id}:${n}`;}}});
  }
}
