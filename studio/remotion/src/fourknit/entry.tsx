import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, FourKnit} from './FourKnit';
import {FourCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the LibreOffice build): the fontsource woff2 paints dots and harakat red via COLR
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/0aeeb99aef7f/knit/public (room.png, sky1..4.jpg and parts/ from prep.py, fonts/). The picture renders
// silent; voice.py muxes the reference audio + the Lamia dhikr. PRIVATE: for the owner's wife (@heal.ingthroughquran).
registerRoot(() => <>
  <Composition id="FOUR-KNIT" component={FourKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="FOUR-COVER" component={FourCover} width={1080} height={1920}/>
  <Still id="FOUR-PROOF" component={Proof} width={1400} height={1700}/>
</>);
