import {Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Still} from 'remotion';
import {AsmaKnit, DURATION, FPS} from './AsmaKnit';
import {AsmaCover} from './Cover';
export const fontsReady = Promise.all([
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-400.woff2'), weight: '400'}),
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-700.woff2'), weight: '700'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/6503bc107f3a/knit/public (scene.jpg, fonts/, audio.m4a). PRIVATE: for the owner's wife, never posted from our accounts.
registerRoot(() => <>
  <Composition id="ASMA-KNIT" component={AsmaKnit} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="ASMA-COVER" component={AsmaCover} width={1080} height={1920}/>
</>);
