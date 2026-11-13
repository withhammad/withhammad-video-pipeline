import {Composition, Still, registerRoot} from 'remotion';
import {DURATION, FPS, Dua} from './Dua';
import {DuaCover} from './Cover';

// Public dir: studio/.local/jobs/62dc5f187134/dua/public (shots/s1-wide.jpg ... s6-top.jpg, audio.m4a).
// PRIVATE: for the owner's other account, never posted from the business accounts.
registerRoot(() => <>
  <Composition id="DUA" component={Dua} width={1080} height={1920} fps={FPS} durationInFrames={Math.round(DURATION * FPS)}/>
  <Still id="DUA-COVER" component={DuaCover} width={1080} height={1920}/>
</>);
