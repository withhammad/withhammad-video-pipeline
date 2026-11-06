import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel, Sheet} from './Reel';
import data from './data.json';

export const AnimStylesRoot: React.FC = () => <>
  <Composition id="AnimStylesReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  <Composition id="AnimStylesSheet" component={Sheet} durationInFrames={1} fps={30} width={1940} height={1384} defaultProps={{t: 0.6}}/>
</>;
registerRoot(AnimStylesRoot);
