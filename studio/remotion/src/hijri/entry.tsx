import {Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, Hijri} from './Hijri';

export const fontsReady = Promise.all([
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/94e4bc8a3dc5/knit/public (bg.jpg, parts/center.png, parts/badge.png, parts/d1..d12.png, fonts/, audio.m4a).
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
// The cover is a still of the grid moment: node src/hijri/render.mjs stills <dir> 6.0
registerRoot(() => <>
  <Composition id="HIJRI-KNIT" component={Hijri} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
</>);
