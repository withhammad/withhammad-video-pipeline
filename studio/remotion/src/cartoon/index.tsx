import React from 'react';
import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {Scene} from './Scene';
import {Reel} from './Reel';
import data from './data.json';
import './fonts';

const SceneStill: React.FC<{night: number; t: number}> = ({night, t}) =>
  <AbsoluteFill style={{background: '#000'}}><Scene t={t} night={night}/></AbsoluteFill>;

export const CartoonRoot: React.FC = () => <>
  <Composition id="CartoonScene" component={SceneStill} durationInFrames={1} fps={30} width={1600} height={900} defaultProps={{night: 0, t: 1.2}}/>
  <Composition id="CartoonReel" component={Reel} durationInFrames={data.frames} fps={30} width={1080} height={1920}/>
</>;
registerRoot(CartoonRoot);
