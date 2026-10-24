import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GlowBg, GlowCoverProps, GlowLines, GlowTile, alphaHex} from './GlowCover';
import {GLOW} from './tokens';

// 1280x720 YouTube thumbnail in the glow template: the two lines on the left, the same pose on the right
// with the two glowing logo tiles either side of the head.
export const GlowWide: React.FC<GlowCoverProps> = (p) => {
  const s = 0.5, W = GLOW.pose.srcWidth * s, H = GLOW.pose.srcHeight * s, cx = 955, X = cx - W / 2, top = 40;
  const tile = 184;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <GlowBg/>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 40% 70% at 72% 45%, ${alphaHex(GLOW.electric, 0.35)} 0%, transparent 100%)`}}/>
    <div style={{position: 'absolute', left: cx - 305, top: 150}}><GlowTile logo={p.leftLogo} size={tile} rotate={-GLOW.tile.rotate}/></div>
    <div style={{position: 'absolute', left: cx + 305 - tile, top: 150}}><GlowTile logo={p.rightLogo} size={tile} rotate={GLOW.tile.rotate}/></div>
    <Img src={p.pose?.src ?? staticFile(GLOW.pose.src)} style={{position: 'absolute', left: X, top, width: W, height: H}}/>
    <div style={{position: 'absolute', left: 24, width: 600, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12}}>
      <GlowLines line1={p.line1} line2={p.line2} sizes={[118, 92]} maxWidths={[586, 586]} border={4}/>
    </div>
  </AbsoluteFill>;
};
