import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, IstighfarKnit} from './IstighfarKnit';
import {IstighfarCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'Fredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/wife-Dft1ZqUtnGS/knit/public (plate.jpg, sprites/, pebbles/, bead.png, fonts/, audio.wav from
// prep.py). The render is silent; voice.py mixes the Lamia "Astaghfirullah" takes over the reference's own track and finish.py masters.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="ISTIGHFAR-KNIT" component={IstighfarKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="ISTIGHFAR-COVER" component={IstighfarCover} width={1080} height={1920}/>
  <Still id="ISTIGHFAR-THUMB45" component={IstighfarCover} width={1080} height={1350} defaultProps={{grid: true}}/>
</>);
