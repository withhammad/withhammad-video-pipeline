import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, YunusKnit} from './YunusKnit';
import {YunusCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the plain build; text.py checks there is no COLR/CPAL table)
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/c56517eb2544/knit/public (plate.mp4, geom.json, cover_bg.jpg, audio.wav from prep.py; fonts/).
// audio.wav = the reference audio, 48 kHz stereo, a lookahead limiter only; app.audio.master takes the mux to -14 LUFS / -1.5 dBTP.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="YUNUS-KNIT" component={YunusKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="YUNUS-COVER" component={YunusCover} width={1080} height={1920}/>
  <Still id="YUNUS-THUMB45" component={YunusCover} width={1080} height={1350} defaultProps={{grid: true}}/>
  <Still id="YUNUS-PROOF" component={Proof} width={1500} height={2600}/>
</>);
