import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, LutfKnit} from './LutfKnit';
import {LutfCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriB', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '700'}),
  loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/82bcabef818a/knit/public (plates/, sprites/, blender/ frames, boyclose.jpg, fonts/, audio.wav from
// prep.py). The render is silent; finish.py lays the reference's own stereo track under it.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="LUTF-KNIT" component={LutfKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="LUTF-COVER" component={LutfCover} width={1080} height={1920}/>
  <Still id="LUTF-THUMB45" component={LutfCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="LUTF-PROOF" component={Proof} width={1400} height={1100}/>
</>);
