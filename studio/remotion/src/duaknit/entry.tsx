import React from 'react';
import {AbsoluteFill, Composition, Still, registerRoot, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {CoverScene, DuaKnit, FPS, FRAMES} from './DuaKnit';

export const fontsReady = Promise.all([
  loadFont({family: 'AmiriQ', url: staticFile('fonts/AmiriQuran.ttf'), weight: '400'}),
  loadFont({family: 'KnitSans', url: staticFile('fonts/fredoka-latin-700-normal.woff2'), weight: '400'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'}),
  loadFont({family: 'KnitSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400', style: 'normal'}),
]);
// Public dir: studio/.local/jobs/wife-DgL4E_JTUV5/knit/public (plates/, fonts/). PRIVATE: for @heal.ingthroughquran only.
const Cover: React.FC<{grid?: boolean}> = ({grid = false}) => <AbsoluteFill style={{overflow: 'hidden'}}><YarnDefs/><ArDefs/>
  <div style={{position: 'absolute', left: 0, top: grid ? -190 : 0, width: 1080, height: 1920}}><CoverScene t={1.6} still/></div></AbsoluteFill>;
registerRoot(() => <>
  <Composition id="DUA-KNIT" component={DuaKnit} width={1080} height={1920} fps={FPS} durationInFrames={FRAMES}/>
  <Still id="DUA-COVER" component={Cover} width={1080} height={1920}/>
  <Still id="DUA-THUMB45" component={Cover} width={1080} height={1350} defaultProps={{grid: true}}/>
</>);
