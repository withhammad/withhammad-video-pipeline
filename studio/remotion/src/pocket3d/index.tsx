import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import data from './data.json';

export const Pocket3DRoot: React.FC = () => <>
  <Composition id="Pocket3DReel" component={Reel} durationInFrames={Math.round(data.end * 30)} fps={30} width={1080} height={1920}/>
</>;
registerRoot(Pocket3DRoot);
