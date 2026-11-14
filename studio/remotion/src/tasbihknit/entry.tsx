import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {DURATION, FPS, TasbihKnit} from './TasbihKnit';
import {TasbihCover} from './Cover';
import {PROOF_H, Proof} from './Proof';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriB', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'Fredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
]);
// Public dir: studio/.local/jobs/808c92b7fc32/knit/public (bg.jpg, parts/bead-*.png, medallion.png, scroll.png, tassel.png,
// fonts/, audio.wav = the reference audio with gain + limiter only). Parts: prep.py. Arabic: text.ts (text.py).
// A spoken-dhikr layer, when its takes exist, is mixed over audio.wav and re-muxed onto the rendered picture by voice.py.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="TASBIH-KNIT" component={TasbihKnit} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="TASBIH-COVER" component={TasbihCover} width={1080} height={1920}/>
  <Still id="TASBIH-PROOF" component={Proof} width={1600} height={PROOF_H}/>
</>);
