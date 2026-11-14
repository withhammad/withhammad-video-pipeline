import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, HayyuKnit} from './HayyuKnit';
import {HayyuCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the LibreOffice build): the fontsource woff2 paints dots and harakat red via COLR
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-400.woff2'), weight: '400'}),
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-700.woff2'), weight: '700'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/dfe321795a86/knit/public (bg.jpg + parts/ + fonts/ + audio.wav from prep.py; audio.wav = the
// reference audio, 44.1 kHz stereo, peak limiter only; app.audio.master takes the render to -14 LUFS / -1.5 dBTP).
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="HAYYU-KNIT" component={HayyuKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="HAYYU-COVER" component={HayyuCover} width={1080} height={1920}/>
  <Still id="HAYYU-PROOF" component={Proof} width={1400} height={1900}/>
</>);
