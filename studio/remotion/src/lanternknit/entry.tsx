import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, LanternKnit} from './LanternKnit';
import {LanternCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the LibreOffice build): the fontsource woff2 paints dots and harakat red via COLR
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/2fe6dca9a831/knit/public (bg.png, knit.jpg, parts/ and audio.wav from prep.py, fonts/). The
// render is silent; voice.py lays the reference soundtrack + the Lamia dhikr under it. PRIVATE: for the owner's wife (@heal.ingthroughquran).
registerRoot(() => <>
  <Composition id="LANTERN-KNIT" component={LanternKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="LANTERN-COVER" component={LanternCover} width={1080} height={1920}/>
  <Still id="LANTERN-THUMB45" component={LanternCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="LANTERN-PROOF" component={Proof} width={1500} height={2200}/>
</>);
