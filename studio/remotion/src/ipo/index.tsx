import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import data from './data.json';
export const IpoRoot: React.FC = () => <>
  <Composition id="IpoReel" component={Reel as any} durationInFrames={data.frames} fps={30} width={1080} height={1920} />
</>;
registerRoot(IpoRoot);
