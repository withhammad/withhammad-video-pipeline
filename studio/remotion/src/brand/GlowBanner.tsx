import React from 'react';
import {AbsoluteFill} from 'remotion';
import {GlowBg, GlowLines, GlowTile, alphaHex} from './GlowCover';
import {LOGO} from './glowCovers';
import {FONT, GLOW} from './tokens';

// 1584x396 LinkedIn banner in the glow template. The profile photo covers the bottom-left on desktop and the
// left third on mobile, so everything sits right of x 430 and inside y 40-356.
export const GlowBanner: React.FC = () => <AbsoluteFill style={{overflow: 'hidden'}}>
  <GlowBg/>
  <AbsoluteFill style={{background: `radial-gradient(ellipse 45% 90% at 62% 50%, ${alphaHex(GLOW.electric, 0.32)} 0%, transparent 100%)`}}/>
  <div style={{position: 'absolute', left: 440, width: 760, top: 0, bottom: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10}}>
    <GlowLines line1="Claude Code & AI Agents" line2="That Do Real Work" sizes={[80, 66]} maxWidths={[740, 700]} border={3}/>
    <div style={{marginTop: 14, fontFamily: FONT.sans, fontWeight: 700, fontSize: 30, color: '#DCE6F7', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
      textShadow: '0 2px 10px rgba(0,0,0,.6)'}}>One free AI guide a day · withhammad.com/resources</div>
  </div>
  <div style={{position: 'absolute', left: 1236, top: 80}}><GlowTile logo={LOGO.claude} size={150} rotate={-GLOW.tile.rotate}/></div>
  <div style={{position: 'absolute', left: 1378, top: 156}}><GlowTile logo={LOGO.mcp} size={130} rotate={GLOW.tile.rotate}/></div>
</AbsoluteFill>;
