import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {CoverA, CoverB, CoverC} from './Covers';
import data from './data.json';

export const DuetRoot: React.FC = () => <><Composition id="ClaudeDuetReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  <Composition id="CoverA" component={CoverA} durationInFrames={1} fps={30} width={1080} height={1920}/>
  <Composition id="CoverB" component={CoverB} durationInFrames={1} fps={30} width={1080} height={1920}/>
  <Composition id="CoverC" component={CoverC} durationInFrames={1} fps={30} width={1080} height={1920}/></>;
registerRoot(DuetRoot);
