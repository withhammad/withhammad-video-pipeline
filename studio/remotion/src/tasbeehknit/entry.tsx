import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, TasbeehKnit} from './TasbeehKnit';
import {TasbeehCover} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  // Amiri Quran without colour layers (the LibreOffice build): the fontsource woff2 paints dots and harakat red via COLR
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/14977f878767/knit/public (bg.jpg + parts/ from prep.py, fonts/, audio.m4a = the reference audio,
// gain + limiter only, mastered with app.audio.master to -14 LUFS / -1.5 dBTP). PRIVATE: for the owner's wife (@heal.ingthroughquran).
registerRoot(() => <>
  <Composition id="TASBEEH-KNIT" component={TasbeehKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="TASBEEH-COVER" component={TasbeehCover} width={1080} height={1920}/>
  <Still id="TASBEEH-PROOF" component={Proof} width={1400} height={1900}/>
</>);
