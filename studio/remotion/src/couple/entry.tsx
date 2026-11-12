import {Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {Couple, DURATION, FPS} from './Couple';

export const fontsReady = Promise.all([
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-400.woff2'), weight: '400'}),
  loadFont({family: 'Nastaliq', url: staticFile('fonts/nastaliq-700.woff2'), weight: '700'}),
]);
// Public dir: studio/.local/jobs/c421b39c46e0/public. PRIVATE: never posted from our accounts.
registerRoot(() => <Composition id="COUPLE" component={Couple} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>);
