import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel, FPS, END_S} from './Reel';
import {KnitReel} from './KnitReel';

export const DhikrRoot: React.FC = () => <>
  <Composition id="DhikrReel" component={Reel} durationInFrames={Math.round(END_S * FPS)} fps={FPS} width={1080} height={1920}/>
  <Composition id="DhikrKnit" component={KnitReel} durationInFrames={Math.round(END_S * FPS)} fps={FPS} width={1080} height={1920}/>
  <Composition id="DhikrKnitCover" component={() => <KnitReel cover/>} durationInFrames={2847} fps={FPS} width={1080} height={1920}/>
</>;
registerRoot(DhikrRoot);
