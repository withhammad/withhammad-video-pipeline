import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, Qamar} from './Qamar';
import {QamarCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/41e989e6b6e8/knit/public (scene-night.jpg, scene-golden.jpg, parts/moon.png, fonts/, audio.m4a).
// PRIVATE: for the owner's wife, never posted from our accounts.
registerRoot(() => <>
  <Composition id="QAMAR-KNIT" component={Qamar} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="QAMAR-COVER" component={QamarCover} width={1080} height={1920}/>
</>);
