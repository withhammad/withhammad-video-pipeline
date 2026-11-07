import React from 'react';
import {CARDS, COLORS as C, GROUPS, SOURCE} from './data';
import {Background, Diagram, MiniGrid, Number, sans, serif} from './Shared';

export const Carousel: React.FC<{page?: number}> = ({page = 0}) => <Background>
  <div style={{position: 'absolute', left: 80, top: 75, ...sans(24, 700, {letterSpacing: 4, color: C.coral})}}>WITHHAMMAD</div>
  <div style={{position: 'absolute', right: 80, top: 75, ...sans(24, 700, {color: C.dim})}}>{String(page + 1).padStart(2, '0')} / 07</div>
  {page === 0 ? <>
    <div style={{position: 'absolute', left: 80, top: 170, width: 920, ...serif(98)}}>Build your own<br/>Claude Code</div>
    <div style={{position: 'absolute', left: 80, top: 405, ...sans(31, 500, {color: C.dim})}}>15 parts of an agent harness, in order</div>
    <div style={{position: 'absolute', left: 80, top: 500}}><MiniGrid width={920} cellHeight={120}/></div>
    <div style={{position: 'absolute', left: 80, top: 1203, ...sans(28, 700, {color: C.coral})}}>SWIPE THROUGH THE BUILD →</div>
  </> : page === 6 ? <>
    <div style={{position: 'absolute', left: 80, top: 200, width: 920, ...serif(98)}}>Build the loop.<br/>Then add the rest.</div>
    <div style={{position: 'absolute', left: 80, top: 500, width: 920, padding: 45, boxSizing: 'border-box', borderRadius: 24, background: C.paper, color: C.ink}}>
      <div style={sans(40, 700)}>Explore the teaching project</div>
      <div style={{...sans(51, 900), marginTop: 28}}>phuryn/mini-harness</div>
      <div style={{...sans(34, 500, {lineHeight: 1.4}), marginTop: 32}}>MIT-licensed code by Paweł Huryn.<br/>Model calls may cost money.<br/>Permissions are not a sandbox.</div>
    </div>
    <div style={{position: 'absolute', left: 80, top: 1000, width: 920, ...sans(46, 700, {lineHeight: 1.3})}}>Save this map.<br/>Guide linked in the post.</div>
  </> : <>
    <div style={{position: 'absolute', left: 80, top: 157, width: 920, ...serif(83)}}>{GROUPS[page - 1]}</div>
    {CARDS.slice((page - 1) * 3, page * 3).map((card, j) => {
      const i = (page - 1) * 3 + j;
      return <div key={i} style={{position: 'absolute', left: 80, top: 293 + j * 290, width: 920, height: 265, borderRadius: 20, background: C.paper, color: C.ink}}>
        <div style={{position: 'absolute', left: 28, top: 25}}><Number n={i + 1} size={44}/></div>
        <div style={{position: 'absolute', left: 86, top: 28, ...sans(35, 700, {letterSpacing: -.7})}}>{card.title}</div>
        <div style={{position: 'absolute', left: 25, top: 100}}><Diagram index={i} width={385}/></div>
        <div style={{position: 'absolute', left: 451, top: 105, width: 433, ...sans(32, 500, {lineHeight: 1.3})}}>{card.body}</div>
      </div>;
    })}
    <div style={{position: 'absolute', right: 80, top: 1190, ...sans(24, 700, {color: C.coral})}}>NEXT →</div>
  </>}
  <div style={{position: 'absolute', left: 80, top: 1270, ...sans(21, 500, {color: C.dim})}}>Diagrams: {SOURCE}</div>
</Background>;
