import React from 'react';
import {AbsoluteFill, Img, random} from 'remotion';
import {COLOR, FONT} from './tokens';

/** Dark variant: teal glow on near-black, faint binary rain, three light bars (the SkillSpector cover's background). */
export const DarkBg: React.FC<{height: number; glowY?: number; seed?: string; bars?: boolean; rain?: number}> = ({height, glowY = 38, seed = 'b', bars = true, rain = 0.07}) => {
  const rows = Math.ceil(height / 40);
  const k = height / 1920;
  return <AbsoluteFill style={{background: COLOR.ink, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% ${glowY}%, ${COLOR.glow} 0%, ${COLOR.glowMid} 45%, ${COLOR.ink} 80%)`}}/>
    <AbsoluteFill style={{fontFamily: FONT.dots, fontSize: 34, lineHeight: '40px', color: COLOR.mint, opacity: rain, whiteSpace: 'pre', padding: 20}}>
      {Array.from({length: rows}, (_, i) => <div key={i}>{Array.from({length: 40}, (_, j) => (random(`${seed}${i}-${j}`) > 0.5 ? '1' : '0')).join(' ')}</div>)}
    </AbsoluteFill>
    {bars ? [[520, 900, 14], [690, 620, 8], [1080, 760, 10]].map(([y, w, h], i) => <div key={i} style={{position: 'absolute', top: y * k,
      left: i % 2 ? 60 : 300, width: w, height: h, background: COLOR.teal, opacity: 0.12}}/>) : null}
  </AbsoluteFill>;
};

/** Card variant: the scene behind the presenter, blurred, with a navy vignette (the Kimi cover's background). */
export const BlurBg: React.FC<{src: string; height: number}> = ({src, height}) => <AbsoluteFill style={{background: COLOR.navy, overflow: 'hidden'}}>
  <Img src={src} style={{width: 1080, height: Math.max(height, 1920), objectFit: 'cover', transform: 'scale(1.1)', filter: 'blur(14px)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(5,11,26,.6) 100%)'}}/>
</AbsoluteFill>;
