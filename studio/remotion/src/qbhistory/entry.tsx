import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, History} from './History';
import {HistoryCover} from './Cover';

export const fontsReady = Promise.all([
  loadFont({family: 'QBSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'}),
  loadFont({family: 'QBSans', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'}),
  loadFont({family: 'QBSans', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'}),
]);
// Public dir: studio/.local/jobs/74b41f76e079/qb/public (shots/s00-him.jpg ... s11-rise.jpg, cover/cv-face.jpg,
// face-chip.jpg, fonts/, audio.wav = the reference's own stereo track). PRIVATE: Quran Beat, never posted from the
// business accounts.
registerRoot(() => <>
  <Composition id="QB-HISTORY" component={History} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="QB-HISTORY-COVER" component={HistoryCover} width={1080} height={1920}/>
</>);
