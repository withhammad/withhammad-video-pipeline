import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS as C} from './data';
import {Background, Credit, MiniGrid, sans, serif} from './Shared';

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return <Background>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 240, ...sans(28, 700, {letterSpacing: 4, color: C.coral})}}>WITHHAMMAD · 15 PARTS</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 335, width: 840, ...serif(105)}}>Build your own<br/>Claude Code</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 595, width: 840, ...sans(36, 500, {color: C.dim})}}>The engine around an AI model</div>
    <div style={{position: 'absolute', left: 100, top: 700, transformOrigin: '50% 50%', scale: interpolate(frame, [0, 108], [1, 1.018], {extrapolateRight: 'clamp'})}}>
      <MiniGrid active={Math.floor(frame / 7) % 15}/>
    </div>
    <Credit/>
  </Background>;
};
