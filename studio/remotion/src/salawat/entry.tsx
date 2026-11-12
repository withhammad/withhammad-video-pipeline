import {Composition, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {SalawatKnit, DURATION, FPS, type SalawatProps} from './SalawatKnit';

export const fontsReady = Promise.all([
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/9aa507dd49fd/knit/public (scene.jpg, parts/, fonts/, audio.m4a). Private: never posted.
registerRoot(() => <Composition id="SALAWAT-KNIT" component={SalawatKnit} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}
  defaultProps={{arabicFont: '"DecoType Naskh"', handle: '@heal.ingthroughquran', parts: true} as SalawatProps}/>);
