import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {FitLine} from './Fit';
import {CropGuides} from './CropGuides';
import {FONT, GLOW} from './tokens';

// The "glow" cover (1080x1920): one fixed template for every reel so the profile grid reads as one brand.
// Line 1 huge white, line 2 white in a glowing electric-blue pill, the same pointing pose (our presenter only),
// two tilted rounded logo tiles left and right of the head, each glowing in its logo's colour.
// Copy limits that keep the type big: line 1 <= 14 chars, line 2 <= 16 chars (FitLine only ever shrinks).

/** A logo tile. `src`: an image (any colours). `mask`: a one-colour SVG drawn in `color` (simple-icons style).
 *  `text`: a drawn word mark (e.g. "AI"). `bg`: tile fill. `glow`: neon colour of the rim and halo. */
export type GlowLogo = {src?: string; mask?: string; text?: string; color?: string; bg?: string; glow: string;
  /** glyph size as a share of the tile (default .6) */ fit?: number};

export type GlowCoverProps = {
  variant: 'glow';
  line1: string;
  line2: string;
  leftLogo: GlowLogo;
  rightLogo: GlowLogo;
  /** Optional override of the pose (defaults to GLOW.pose); keep the same pose on every cover. */
  pose?: {src: string; scale?: number; top?: number};
  guides?: boolean;
};

const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const alphaHex = alpha;

export const GlowTile: React.FC<{logo: GlowLogo; size: number; rotate: number}> = ({logo, size, rotate}) => {
  const g = logo.glow, k = logo.fit ?? 0.6, inner = size * k;
  const glyph = logo.text
    ? <div style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: size * 0.42, letterSpacing: -size * 0.012, color: logo.color ?? '#fff',
      lineHeight: 1, textShadow: `0 0 18px ${alpha(g, 0.55)}`}}>{logo.text}</div>
    : logo.mask
      ? <div style={{width: inner, height: inner, background: logo.color ?? '#fff', WebkitMaskImage: `url(${logo.mask})`, maskImage: `url(${logo.mask})`,
        WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center'}}/>
      : <Img src={logo.src!} style={{width: inner, height: inner, objectFit: 'contain'}}/>;
  return <div style={{width: size, height: size, borderRadius: GLOW.tile.radius * size / 300, transform: `rotate(${rotate}deg)`,
    background: logo.bg ?? 'linear-gradient(160deg, #141B2E 0%, #070B16 100%)', border: `5px solid ${alpha(g, 0.95)}`, boxSizing: 'border-box',
    boxShadow: `0 0 18px ${alpha(g, 0.95)}, 0 0 54px ${alpha(g, 0.75)}, 0 0 120px ${alpha(g, 0.45)}, inset 0 0 26px ${alpha(g, 0.35)}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>{glyph}</div>;
};

export const GlowBg: React.FC = () => <AbsoluteFill style={{background: GLOW.base}}>
  <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 46% at 50% 47%, ${GLOW.core} 0%, ${GLOW.mid} 30%, ${GLOW.deep} 62%, ${GLOW.base} 100%)`}}/>
  <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 16% at 50% 24%, ${alpha(GLOW.electric, 0.28)} 0%, transparent 100%)`}}/>
  <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(2,6,18,.55) 0%, transparent 12%, transparent 80%, rgba(2,6,18,.6) 100%)'}}/>
</AbsoluteFill>;

/** Line 1 (huge white) over line 2 (white in the glowing electric-blue pill). Place inside a flex column. */
export const GlowLines: React.FC<{line1: string; line2: string; sizes: [number, number]; maxWidths: [number, number]; border?: number}> = ({line1, line2, sizes, maxWidths, border = 5}) => {
  const sans: React.CSSProperties = {fontFamily: FONT.sans, fontWeight: 900, lineHeight: 1.04, whiteSpace: 'nowrap'};
  const k = sizes[1] / GLOW.line2.size;
  return <>
    <div style={{filter: `drop-shadow(0 ${8 * k}px 0 rgba(0,0,0,.35)) drop-shadow(0 ${10 * k}px ${30 * k}px rgba(0,0,0,.6))`}}>
      <FitLine size={sizes[0]} maxWidth={maxWidths[0]} boxStyle={{...sans, letterSpacing: '-0.045em', padding: '0 .04em'}}
        style={{color: 'transparent', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 55%, #DCE6F7 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>{line1}</FitLine>
    </div>
    <FitLine size={sizes[1]} maxWidth={maxWidths[1]} boxStyle={{...sans, letterSpacing: '-0.035em', color: '#fff',
      padding: '.07em .3em .11em', borderRadius: '.3em', border: `${border}px solid ${GLOW.pillEdge}`, boxSizing: 'border-box',
      background: `linear-gradient(180deg, ${GLOW.pillTop} 0%, ${GLOW.pillBottom} 100%)`,
      boxShadow: `0 0 ${22 * k}px ${alpha(GLOW.electric, 1)}, 0 0 ${60 * k}px ${alpha(GLOW.electric, 0.8)}, 0 0 ${120 * k}px ${alpha(GLOW.electric, 0.45)}, inset 0 ${3 * k}px 0 rgba(255,255,255,.45), inset 0 -${6 * k}px ${14 * k}px rgba(0,30,120,.45)`,
      textShadow: `0 ${5 * k}px 0 rgba(0,25,90,.45)`}}>{line2}</FitLine>
  </>;
};

export const GlowCover: React.FC<GlowCoverProps> = (p) => {
  const pose = {...GLOW.pose, ...p.pose};
  const src = p.pose?.src ?? staticFile(GLOW.pose.src);
  const W = GLOW.pose.srcWidth * pose.scale, H = GLOW.pose.srcHeight * pose.scale, X = (1080 - W) / 2;
  const t = GLOW.tile;
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <GlowBg/>
    {/* soft blue rim light behind the presenter */}
    <div style={{position: 'absolute', left: X + W * 0.18, top: pose.top + H * 0.02, width: W * 0.64, height: H * 0.5, borderRadius: '50%',
      background: alpha(GLOW.electric, 0.35), filter: 'blur(90px)'}}/>
    <div style={{position: 'absolute', left: t.leftX, top: t.y}}><GlowTile logo={p.leftLogo} size={t.size} rotate={-t.rotate}/></div>
    <div style={{position: 'absolute', left: t.rightX, top: t.y}}><GlowTile logo={p.rightLogo} size={t.size} rotate={t.rotate}/></div>
    <Img src={src} style={{position: 'absolute', left: X, top: pose.top, width: W, height: H}}/>
    <div style={{position: 'absolute', top: GLOW.line1.top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
      <GlowLines line1={p.line1} line2={p.line2} sizes={[GLOW.line1.size, GLOW.line2.size]} maxWidths={[GLOW.line1.maxWidth, GLOW.line2.maxWidth]}/>
    </div>
    {p.guides ? <CropGuides/> : null}
  </AbsoluteFill>;
};
