import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CROPS_9x16, FONT, SAFE_9x16} from './tokens';

/** Dashed 3:4 / 4:5 / 1:1 crop windows and the core safe box over a 1080x1920 cover. */
export const CropGuides: React.FC = () => <AbsoluteFill style={{pointerEvents: 'none'}}>
  {([['3:4 grid', CROPS_9x16.grid3x4, '#FFD400'], ['4:5 feed', CROPS_9x16.feed4x5, '#00E5FF'], ['1:1', CROPS_9x16.square, '#FF4FD8']] as const).map(([name, c, col]) =>
    <div key={name} style={{position: 'absolute', left: c.x + 4, top: c.y, width: c.w - 8, height: c.h, border: `4px dashed ${col}`}}>
      <div style={{position: 'absolute', right: 8, top: 4, fontFamily: FONT.sans, fontWeight: 800, fontSize: 26, color: col}}>{name}</div></div>)}
  <div style={{position: 'absolute', left: SAFE_9x16.core.x, top: SAFE_9x16.core.y, width: SAFE_9x16.core.w, height: SAFE_9x16.core.h, border: '3px solid #7CFF6B'}}/>
</AbsoluteFill>;
