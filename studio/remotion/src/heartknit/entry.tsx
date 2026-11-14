import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, HeartKnit} from './HeartKnit';
import {HeartCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriB', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/1d798e8340fc/knit/public (bg.jpg, parts/heart.png, dark.png, doily.png, bead1..5.png, fonts/,
// audio.m4a = the reference audio pre-limited and mastered to -14.5 LUFS / -1.6 dBTP). Parts: prep.py.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="HEART-KNIT" component={HeartKnit} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="HEART-COVER" component={HeartCover} width={1080} height={1920}/>
</>);
