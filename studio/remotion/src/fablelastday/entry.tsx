import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, LOOP, FableLastDay, Hook} from './Fable';

export const fontsReady = Promise.all([
  ...[400, 500, 600, 700, 800, 900].map((w) => loadFont({family: 'FLSans', url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: String(w)})),
  loadFont({family: 'FLMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'}),
]);
// Public dir: studio/.local/jobs/fablelastday/public (face.jpg = crop of work/site/hairline-resource/public/hammad-headshot-v3.jpg, si-claude.svg, fonts/).
registerRoot(() => <>
  <Composition id="FLD-45" component={FableLastDay} width={1080} height={1350} fps={FPS} durationInFrames={LOOP}/>
  <Composition id="FLD-916" component={FableLastDay} width={1080} height={1920} fps={FPS} durationInFrames={LOOP}
    defaultProps={{scale: 0.9, x: 54, y: 300}}/>
  <Still id="FLD-HOOK" component={Hook} width={1080} height={1920}/>
</>);
