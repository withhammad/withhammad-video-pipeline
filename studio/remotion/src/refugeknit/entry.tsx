import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, RefugeKnit} from './RefugeKnit';
import {RefugeCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSans', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/wife-DepKWqLtlcH/knit/public (plates/, sprites/, fonts/, audio.wav from prep.py). The render is
// silent; finish.py lays the reference's own stereo track under it, untouched.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="REFUGE-KNIT" component={RefugeKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="REFUGE-COVER" component={RefugeCover} width={1080} height={1920}/>
  <Still id="REFUGE-THUMB45" component={RefugeCover} width={1080} height={1350} defaultProps={{grid: true}}/>
</>);
