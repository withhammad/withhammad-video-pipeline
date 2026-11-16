import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, StressKnit} from './StressKnit';
import {StressCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'AmiriL', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'}),
  loadFont({family: 'Fredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/wife-DfWnDR6T1YX/knit/public (room.jpg, sprites/, fonts/, audio.wav from prep.py).
// The render is silent; finish.py muxes the reference's own track (untouched) and masters it.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="STRESS-KNIT" component={StressKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="STRESS-COVER" component={StressCover} width={1080} height={1920}/>
  <Still id="STRESS-THUMB45" component={StressCover} width={1080} height={1350} defaultProps={{grid: true}}/>
</>);
