import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import data from './data.json';

export const ReferralsRoot: React.FC = () => <>
  <Composition id="ReferralsReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
</>;
registerRoot(ReferralsRoot);
