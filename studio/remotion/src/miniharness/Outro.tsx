import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS as C, KEYWORD} from './data';
import {Background, Credit, MiniGrid, sans, serif} from './Shared';

export const Outro: React.FC<{linkedin?: boolean}> = ({linkedin = false}) => {
  const f = useCurrentFrame();
  return <Background>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 240, ...sans(28, 700, {letterSpacing: 4, color: C.coral})}}>WITHHAMMAD · SAVE THE MAP</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 335, width: 840, ...serif(95)}}>15 parts.<br/>One agent.</div>
    <div style={{position: 'absolute', left: 100, top: 590, opacity: .78}}><MiniGrid cellHeight={110}/></div>
    <div style={{position: 'absolute', left: 100, top: 950, width: 840, height: 315, borderRadius: 24, background: C.paper, color: C.ink,
      boxShadow: '0 0 80px 20px #191918', translate: `0 ${interpolate(f, [0, 10], [28, 0], {extrapolateRight: 'clamp'})}px`}}>
      <div data-safe-text style={{position: 'absolute', left: 38, top: 35, ...sans(29, 500)}}>{linkedin ? 'Start with the source code' : 'Want the build guide?'}</div>
      <div data-safe-text style={{position: 'absolute', left: 38, top: 95, ...sans(linkedin ? 49 : 59, 900)}}>{linkedin ? 'phuryn/mini-harness' : `Comment ${KEYWORD}`}</div>
      <div data-safe-text style={{position: 'absolute', left: 38, top: 190, width: 764, ...sans(30, 500, {lineHeight: 1.35})}}>{linkedin ? 'Repository + guide linked in the post' : 'Follow @withhammad.ai for more AI builds'}</div>
    </div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 1330, width: 840, ...sans(28, 500, {color: C.dim})}}>Free teaching code · model usage may cost</div>
    <Credit/>
  </Background>;
};
