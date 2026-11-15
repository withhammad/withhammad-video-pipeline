import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {AllahKnit, FPS, FRAMES} from './AllahKnit';
import {AllahCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/wife-Dfw7YNesQ1h/knit/public (plate.mp4, cover_bg.jpg, audio.wav from prep.py; fonts/).
// audio.wav = the reference audio (44.1 kHz stereo), untouched; finish.py masters the mux to -14 LUFS / -1.5 dBTP with one gain.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="ALLAH-KNIT" component={AllahKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="ALLAH-COVER" component={AllahCover} width={1080} height={1920}/>
  <Still id="ALLAH-THUMB45" component={AllahCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="ALLAH-PROOF" component={Proof} width={1500} height={2000}/>
</>);
