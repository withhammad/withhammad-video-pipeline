import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel, FPS, END_S} from './Reel';

export const DhikrRoot: React.FC = () => <>
  <Composition id="DhikrReel" component={Reel} durationInFrames={Math.round(END_S * FPS)} fps={FPS} width={1080} height={1920}/>
</>;
registerRoot(DhikrRoot);
