import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, SeaKnit} from './SeaKnit';
import {Proof, SeaCover} from './Cover';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the plain build; the fontsource woff2 paints dots and harakat red via COLR/CPAL)
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/34391c4c76df/knit/public (blender/ frames, fonts/, audio.wav from prep.py). The render is silent;
// finish.py lays the reference's own stereo track under it.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="SEA-KNIT" component={SeaKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="SEA-COVER" component={SeaCover} width={1080} height={1920}/>
  <Still id="SEA-THUMB45" component={SeaCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="SEA-PROOF" component={Proof} width={1400} height={1000}/>
</>);
