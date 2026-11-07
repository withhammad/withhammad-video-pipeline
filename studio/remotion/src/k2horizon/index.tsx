import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import data from './data.json';

export const K2Root: React.FC = () => <>
  <Composition id="K2HorizonReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
</>;
registerRoot(K2Root);
