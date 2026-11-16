import {Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {FPS, FRAMES, Harm} from './Harm';
import {HarmCover, HarmThumb} from './Cover';
import {Proof} from './Proof';

export const fontsReady = Promise.all([
  loadFont({family: 'QBSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'}),
  loadFont({family: 'QBSans', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'}),
  loadFont({family: 'QBSans', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'}),
  // Amiri Quran 1.001, the plain TrueType build (no COLR/CPAL colour layers)
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
]);
// Public dir: studio/.local/jobs/qb-DfsFqEpxneY/qb/public (shots/s01-sad.jpg ... s04-hope.jpg, hearts/h-*.png, face-chip.jpg,
// fonts/, audio.wav = the reference's own stereo track). PRIVATE: Quran Beat, never posted from the business accounts.
registerRoot(() => <>
  <Composition id="QB-HARM" component={Harm} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="QB-HARM-COVER" component={HarmCover} width={1080} height={1920}/>
  <Still id="QB-HARM-THUMB" component={HarmThumb} width={1080} height={1350}/>
  <Still id="QB-HARM-PROOF" component={Proof} width={1700} height={1000}/>
</>);
