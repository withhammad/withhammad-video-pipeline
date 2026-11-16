import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, TadbeerKnit} from './TadbeerKnit';
import {TadbeerCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriB', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '700'}),
  loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/wife-DfsTrK5or6t/knit/public (plates/, sprites/, boyclose.jpg, fonts/, audio.wav from
// prep.py). The render is silent; finish.py lays the reference's own stereo track under it.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="TADBEER-KNIT" component={TadbeerKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="TADBEER-COVER" component={TadbeerCover} width={1080} height={1920}/>
  <Still id="TADBEER-THUMB45" component={TadbeerCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="TADBEER-PROOF" component={Proof} width={1400} height={1100}/>
</>);
