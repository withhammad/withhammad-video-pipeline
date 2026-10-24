import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {BlurBg, DarkBg} from './Backgrounds';
import {CropGuides} from './CropGuides';
import {GlowCover, GlowCoverProps} from './GlowCover';
import {HookLine} from './Fit';
import {AccentName, COLOR, FONT, HOOK_LIMITS, RADIUS, SHADOW, TYPE} from './tokens';

export {CropGuides};
export type {GlowCoverProps, GlowLogo} from './GlowCover';

// The one cover/thumbnail component (1080x1920). Variants:
//   "glow": the fixed grid template (owner rule 2026-10-24) -> GlowCover.tsx (line1, line2, leftLogo, rightLogo)
//   "card": blurred scene + presenter card, the head pops out above the card, hook ABOVE the face (Kimi K3)
//   "dark": teal glow + binary rain, wordmark on top, tilted tiles beside the head, hook BELOW the face (SkillSpector)
// Rules baked in: the strongest-emotion face (pass the pick), 2 big lines, punch in the accent box, head + hook inside
// SAFE_9x16.core (every grid crop), logos inside the 4:5 window, no small text, no "AI avatar" text.

export type Tile = {src?: string; text?: string; bg?: string};
export type Logo =
  | {slot: 'top'; src: string; width: number; height: number; y?: number}
  | {slot: 'left' | 'right'; tile: Tile; x?: number; y?: number; size?: number; rotate?: number};

export type ReelCoverProps = ClassicCoverProps | GlowCoverProps;

export type ClassicCoverProps = {
  variant: 'card' | 'dark';
  /** cut: the take frame with the background removed (RGBA). full: the same frame unmatted (card variant only). */
  face: {cut: string; full?: string; scale: number; top: number; srcWidth?: number};
  /** card variant: the scene image behind everything (blurred) and where the presenter card starts. */
  background?: string;
  cardTop?: number;
  line1: string;
  line2: string;
  /** The punch: by default all of line 2 sits in the accent box; a substring of line 1 boxes just that word instead. */
  accentWord?: string;
  accent?: AccentName;
  line1Look?: 'plain' | 'box';
  hookTop?: number;
  sizes?: [number, number];
  logos?: Logo[];
  guides?: boolean;
};

export const TileView: React.FC<{tile: Tile; size: number}> = ({tile, size}) => tile.src
  ? <Img src={tile.src} style={{width: size, height: size}}/>
  : <div style={{width: size, height: size, borderRadius: RADIUS.tile * size / 330, background: tile.bg || 'linear-gradient(160deg, #3FD2F2, #1E8FD6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.sans, fontWeight: 800, fontSize: size * 0.515, color: '#fff',
    textShadow: '0 4px 0 rgba(0,0,0,.15)'}}>{tile.text}</div>;

const LogoView: React.FC<{logo: Logo}> = ({logo}) => {
  if (logo.slot === 'top') return <div style={{position: 'absolute', left: (1080 - logo.width) / 2, top: logo.y ?? 300, width: logo.width, height: logo.height}}>
    <Img src={logo.src} style={{width: logo.width, height: logo.height}}/></div>;
  const size = logo.size ?? 330, left = logo.slot === 'left';
  return <div style={{position: 'absolute', left: logo.x ?? (left ? 30 : 712), top: logo.y ?? (left ? 600 : 590), width: size, height: size,
    transform: `rotate(${logo.rotate ?? (left ? -12 : 12)}deg)`, filter: SHADOW.tile}}><TileView tile={logo.tile} size={size}/></div>;
};


export const ReelCover: React.FC<ReelCoverProps> = (p) => p.variant === 'glow' ? <GlowCover {...p}/> : <ClassicCover {...p}/>;

const ClassicCover: React.FC<ClassicCoverProps> = (p) => {
  const accent = p.accent ?? (p.variant === 'card' ? 'orange' : 'red');
  const line1Look = p.line1Look ?? (p.variant === 'card' ? 'box' : 'plain');
  const sizes = p.sizes ?? (p.variant === 'card' ? [TYPE.hookSmall.size, TYPE.hookBig.size] : [TYPE.hook.size, TYPE.hook.size]);
  const hookTop = p.hookTop ?? (p.variant === 'card' ? 458 : 1150);
  const rounded = p.variant === 'dark';
  const inLine1 = !!p.accentWord && p.line1.includes(p.accentWord);
  const W = (p.face.srcWidth ?? 1080) * p.face.scale, H = 1920 * p.face.scale, X = (1080 - W) / 2;
  const cardTop = p.cardTop ?? 1020;

  const hook = <div style={{position: 'absolute', top: hookTop, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: p.variant === 'card' ? 13 : 0}}>
    <HookLine text={p.line1} look={inLine1 ? 'plain' : line1Look} accentWord={inLine1 ? p.accentWord : undefined} size={sizes[0]} accent={accent}
      maxWidth={line1Look === 'box' ? 880 : HOOK_LIMITS.maxWidth} rounded={rounded}/>
    <HookLine text={p.line2} look={inLine1 ? 'plain' : 'accent'} size={sizes[1]} accent={accent} maxWidth={inLine1 ? HOOK_LIMITS.maxWidth : 900} rounded={rounded}/>
  </div>;

  if (p.variant === 'card') return <AbsoluteFill style={{background: COLOR.navy}}>
    {p.background ? <BlurBg src={p.background} height={1920}/> : null}
    {p.logos?.map((l, i) => <LogoView key={i} logo={l}/>)}
    {hook}
    <div style={{position: 'absolute', left: X, top: cardTop, width: W, height: 1920 - cardTop + 60, borderRadius: RADIUS.card, overflow: 'hidden', boxShadow: SHADOW.card}}>
      <Img src={p.face.full ?? p.face.cut} style={{position: 'absolute', left: 0, top: p.face.top - cardTop, width: W, height: H}}/></div>
    <div style={{position: 'absolute', left: X, top: p.face.top, width: W, height: cardTop - p.face.top + 1, overflow: 'hidden'}}>
      <Img src={p.face.cut} style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}/></div>
    {p.guides ? <CropGuides/> : null}
  </AbsoluteFill>;

  return <AbsoluteFill style={{background: COLOR.ink, overflow: 'hidden'}}>
    <DarkBg height={1920}/>
    {p.logos?.map((l, i) => <LogoView key={i} logo={l}/>)}
    <Img src={p.face.cut} style={{position: 'absolute', left: X, top: p.face.top, width: W, height: H}}/>
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, transparent 66%, rgba(0,0,0,.85) 76%, #000 82%)'}}/>
    {hook}
    {p.guides ? <CropGuides/> : null}
  </AbsoluteFill>;
};
