import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, FajrKnit} from './FajrKnit';
import {FajrCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'Fredoka', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
]);
// Public dir: studio/.local/jobs/wife-DfQMDFSufy_/knit/public (room.jpg, bedroom.jpg, sprites/, fonts/, audio.wav from prep.py).
// The render is silent; finish.py muxes the reference's own track (untouched) and masters it.
// PRIVATE: for the owner's wife (@heal.ingthroughquran), never posted from the business accounts.
registerRoot(() => <>
  <Composition id="FAJR-KNIT" component={FajrKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="FAJR-COVER" component={FajrCover} width={1080} height={1920}/>
  <Still id="FAJR-THUMB45" component={FajrCover} width={1080} height={1350} defaultProps={{grid: true}}/>
</>);
