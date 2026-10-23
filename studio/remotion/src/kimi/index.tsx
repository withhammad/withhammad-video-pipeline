import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {Cover} from './Covers';
import data from './data.json';

export const KimiRoot: React.FC = () => <>
  <Composition id="KimiReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  <Composition id="KimiCover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{pick: 1}}/>
</>;
registerRoot(KimiRoot);
