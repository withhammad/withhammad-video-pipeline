import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, Nasheed} from './Nasheed';
import {NasheedCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-400.woff2'), weight: '400'}),
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-700.woff2'), weight: '700'}),
]);
// Public dir: studio/.local/jobs/54442587c2b2/nasheed/public (shots/s1-wide.jpg ... s7-dawn.jpg, fonts/, audio.m4a).
// PRIVATE: for the owner's other account, never posted from the business accounts.
registerRoot(() => <>
  <Composition id="NASHEED" component={Nasheed} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="NASHEED-COVER" component={NasheedCover} width={1080} height={1920}/>
</>);
