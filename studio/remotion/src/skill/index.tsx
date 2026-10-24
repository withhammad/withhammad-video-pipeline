import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Reel} from './Reel';
import {Cover} from './Covers';
import data from './data.json';

export const SkillRoot: React.FC = () => <>
  <Composition id="SkillReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
  <Composition id="SkillCover" component={Cover} durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{pick: 1, line2: 'FROM AI VIRUS', scale: 0.62, top: 360}}/>
</>;
registerRoot(SkillRoot);
