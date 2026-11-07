import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {CARDS, COLORS as C, GROUPS} from './data';
import {Background, Credit, Diagram, Number, sans, serif} from './Shared';

export const StepScene: React.FC<{index: number}> = ({index}) => {
  const f = useCurrentFrame();
  const card = CARDS[index];
  return <Background>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 240, ...sans(28, 700, {letterSpacing: 4, color: C.coral})}}>WITHHAMMAD</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 335, ...sans(30, 700, {letterSpacing: 2, color: C.dim})}}>{String(Math.floor(index / 3) + 1).padStart(2, '0')} / {GROUPS[Math.floor(index / 3)].toUpperCase()}</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 410, width: 840, ...serif(card.title.length > 17 ? 77 : 88)}}>{card.title}</div>
    <div style={{position: 'absolute', left: 100, top: 565, width: 840, height: 695, borderRadius: 26, background: C.paper,
      translate: `0 ${interpolate(f, [0, 10], [30, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})}px`, boxShadow: '0 14px 35px #0003'}}>
      <div style={{position: 'absolute', left: 36, top: 32}}><Number n={index + 1}/></div>
      <div data-safe-text style={{position: 'absolute', right: 36, top: 54, ...sans(24, 700, {letterSpacing: 2, color: '#766F67'})}}>PART {String(index + 1).padStart(2, '0')} / 15</div>
      <div style={{position: 'absolute', left: 36, top: 162}}><Diagram index={index} width={768} motion/></div>
      <div data-safe-text style={{position: 'absolute', left: 38, top: 495, width: 764, ...sans(46, 700, {color: C.ink, lineHeight: 1.22, letterSpacing: -1})}}>{card.body}</div>
    </div>
    <div style={{position: 'absolute', left: 100, top: 1330, width: 840, display: 'flex', gap: 9}}>{CARDS.map((_, i) => <div key={i}
      style={{height: 8, flex: 1, borderRadius: 4, background: i <= index ? C.coral : '#45443F'}}/>)}</div>
    <div data-safe-text style={{position: 'absolute', left: 100, top: 1365, width: 840, ...sans(23, 700, {color: C.dim, letterSpacing: 1.2})}}>{card.note}</div>
    <Credit/>
  </Background>;
};
