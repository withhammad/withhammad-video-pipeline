import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import data from './data.json';
export const CareerPagesRoot: React.FC = () => <>
  <Composition id="CareerPagesReel" component={Reel as any} durationInFrames={data.frames} fps={30} width={1080} height={1920} defaultProps={{standIn: false}} />
</>;
registerRoot(CareerPagesRoot);
