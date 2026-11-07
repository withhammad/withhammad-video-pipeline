import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {CARDS, COLORS as C, CROPS, SOURCE} from './data';

loadFont({family: 'HarnessSans', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'HarnessSans', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'HarnessSans', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'HarnessSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'});

export const sans = (fontSize: number, fontWeight = 500, extra: React.CSSProperties = {}): React.CSSProperties => ({fontFamily: 'HarnessSans, sans-serif', fontSize, fontWeight, ...extra});
export const serif = (fontSize: number): React.CSSProperties => ({fontFamily: 'HarnessSerif, Georgia, serif', fontSize, fontWeight: 700, lineHeight: 1.08, letterSpacing: -3});
export const Background: React.FC<{children: React.ReactNode}> = ({children}) => <AbsoluteFill style={{background: C.bg, color: C.white, overflow: 'hidden'}}>{children}</AbsoluteFill>;

export const Diagram: React.FC<{index: number; width: number; motion?: boolean}> = ({index, width, motion = false}) => {
  const frame = useCurrentFrame();
  const c = CROPS[index];
  const scale = width / c.w;
  return <div data-diagram={index + 1} style={{position: 'relative', width, height: c.h * scale, overflow: 'hidden', borderRadius: 8, background: C.paper,
    scale: motion ? interpolate(frame, [0, 108], [1, 1.025], {extrapolateRight: 'clamp'}) : 1}}>
    <Img src={staticFile('reference.jpg')} style={{position: 'absolute', width: 800 * scale, height: 1000 * scale, maxWidth: 'none', left: -c.x * scale, top: -c.y * scale}}/>
  </div>;
};

export const Number: React.FC<{n: number; size?: number}> = ({n, size = 70}) => <div style={{width: size, height: size, borderRadius: size / 2, background: C.coral,
  display: 'flex', alignItems: 'center', justifyContent: 'center', ...sans(size * .52, 700, {color: C.white, fontVariantNumeric: 'tabular-nums'})}}>{n}</div>;

export const Credit: React.FC<{top?: number; width?: number; size?: number}> = ({top = 1435, width = 840, size = 26}) => <div data-safe-text style={{position: 'absolute', left: 100, top, width,
  ...sans(size, 500, {color: C.dim, lineHeight: 1.4})}}>Diagrams: {SOURCE}</div>;

export const MiniGrid: React.FC<{width?: number; cellHeight?: number; active?: number}> = ({width = 840, cellHeight = 115, active = -1}) => {
  const gap = 12;
  const cw = (width - gap * 2) / 3;
  const diagramWidth = Math.min(cw - 28, (cellHeight - 42) * 191 / 70);
  return <div style={{width, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap}}>{CARDS.map((card, i) => <div key={card.title}
    style={{position: 'relative', height: cellHeight, background: C.paper, borderRadius: 12, overflow: 'hidden', boxSizing: 'border-box',
      border: active === i ? `4px solid ${C.coral}` : '4px solid transparent'}}>
    <div style={{position: 'absolute', left: (cw - diagramWidth) / 2 - 4, top: 5}}><Diagram index={i} width={diagramWidth}/></div>
    <div style={{position: 'absolute', left: 10, right: 7, bottom: 7, display: 'flex', alignItems: 'center', gap: 7}}>
      <Number n={i + 1} size={26}/><span style={sans(17, 700, {color: C.ink, whiteSpace: 'nowrap'})}>{card.short}</span>
    </div>
  </div>)}</div>;
};
