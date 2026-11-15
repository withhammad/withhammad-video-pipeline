import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, TahlilKnit} from './TahlilKnit';
import {TahlilCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the LibreOffice build): the fontsource woff2 paints dots and harakat red via COLR
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/bbf1e88c3f85/knit/public (plate.mp4 = the Blender frames, cover_bg.jpg, fonts/). The render is
// silent; voice.py lays the reference soundtrack (+ the Lamia dhikr). PRIVATE: for the owner's wife (@heal.ingthroughquran).
registerRoot(() => <>
  <Composition id="TAHLIL-KNIT" component={TahlilKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="TAHLIL-COVER" component={TahlilCover} width={1080} height={1920}/>
  <Still id="TAHLIL-THUMB45" component={TahlilCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="TAHLIL-PROOF" component={Proof} width={1500} height={2600}/>
</>);
