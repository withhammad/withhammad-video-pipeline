import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, DolphinKnit} from './DolphinKnit';
import {DolphinCover} from './Cover';
import {AllahPatch, KaabaPatch} from './Patch';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/wife-DfwI-C2tUw9-dolphinknit/knit/public (fonts/, blender/fNNNN.jpg, audio.wav, patch/).
// The patches (transparent PNGs) are rendered first and textured onto the knitted dolphin in Blender; the reel is the Blender
// plate with her handle and the salawat line on top. PRIVATE: for the owner's wife (@heal.ingthroughquran) only.
registerRoot(() => <>
  <Composition id="DOLPHIN-KNIT" component={DolphinKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="DOLPHIN-COVER" component={DolphinCover} width={1080} height={1920}/>
  <Still id="DOLPHIN-THUMB45" component={DolphinCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="PATCH-ALLAH" component={AllahPatch} width={1080} height={570}/>
  <Still id="PATCH-KAABA" component={KaabaPatch} width={760} height={560}/>
</>);
