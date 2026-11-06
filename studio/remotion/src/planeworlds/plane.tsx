import React from 'react';
import type {WorldKey} from './worlds';

// The one paper plane, restyled for each world. Drawn in a 260x130 box, nose pointing right.
// Facets: top wing (A), fuselage fold (B), under wing (C).
const A = '0,6 260,64 78,72', B = '78,72 260,64 104,108', C = '104,108 260,64 22,134';

const PIX = [
  'X.................',
  'XXX...............',
  'XXXXX.............',
  '.XXXXXXX..........',
  '.XXXXXXXXXX.......',
  '..XXXXXXXXXXXXXX..',
  '..ooooooooooooooo.',
  '...oooooooooo.....',
  '...ooooooo........',
  '..ooooo...........',
  '.ooo..............',
];

export const Plane: React.FC<{style: WorldKey; t: number}> = ({style, t}) => {
  switch (style) {
    case 'pixel':
      return <svg width={260} height={150} viewBox="0 0 216 132" style={{shapeRendering: 'crispEdges', overflow: 'visible'}}>
        {PIX.flatMap((r, j) => [...r].map((ch, i) => ch === '.' ? null :
          <rect key={i + '-' + j} x={i * 12} y={j * 12} width={12} height={12} fill={ch === 'X' ? '#FFFFFF' : '#C7D3E6'} stroke="#1B2A4A" strokeWidth={0}/>))}
        <rect x={0} y={0} width={0} height={0}/></svg>;
    case 'chalk':
      return <svg width={260} height={130} viewBox="-6 -6 272 142" style={{overflow: 'visible'}}>
        <g fill="none" stroke="#F4F1E8" strokeWidth={5} strokeLinejoin="round" filter="url(#chalk)"><polygon points={A}/><polygon points={B}/><polygon points={C}/></g></svg>;
    case 'glow':
      return <svg width={260} height={130} viewBox="-10 -10 280 150" style={{overflow: 'visible', filter: 'drop-shadow(0 0 10px #F2B640) drop-shadow(0 0 26px rgba(242,182,64,.6))'}}>
        <g fill="rgba(242,193,78,.18)" stroke="#FFD27A" strokeWidth={3.5} strokeLinejoin="round"><polygon points={A}/><polygon points={B}/><polygon points={C}/></g></svg>;
    case 'ps2':
      return <svg width={290} height={145} viewBox="0 0 260 130" style={{overflow: 'visible'}}>
        <polygon points={A} fill="#E7E5F2"/><polygon points={B} fill="#A9A6C4"/><polygon points={C} fill="#C7C4DE"/></svg>;
    case 'comic':
      return <svg width={260} height={130} viewBox="-8 -8 276 146" style={{overflow: 'visible'}}>
        <g stroke="#111" strokeWidth={7} strokeLinejoin="round"><polygon points={A} fill="#FFFFFF"/><polygon points={B} fill="#D9E2EC"/><polygon points={C} fill="#F2F4F7"/></g></svg>;
    case 'flat':
      return <svg width={240} height={120} viewBox="0 0 260 130"><polygon points={A} fill="#FFFFFF"/><polygon points={B} fill="#D6E4F2"/><polygon points={C} fill="#EEF4FA"/></svg>;
    case 'koe': {
      const pts = [[0, 6], [260, 64], [78, 72], [104, 108], [22, 134]];
      const edges = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 1], [3, 4], [4, 1]];
      return <svg width={260} height={130} viewBox="-8 -8 276 146" style={{overflow: 'visible'}}>
        {edges.map(([a, b], k) => <line key={k} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="#fff" strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round"/>)}
        {pts.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={5} fill="#fff"/>)}</svg>;
    }
    case 'cgi':
      return <svg width={280} height={140} viewBox="0 0 260 130" style={{overflow: 'visible', filter: 'drop-shadow(0 18px 18px rgba(20,40,80,.35))'}}>
        <defs>
          <linearGradient id="cgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset=".7" stopColor="#E9EEF5"/><stop offset="1" stopColor="#C9D4E2"/></linearGradient>
          <linearGradient id="cgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9FB0C6"/><stop offset="1" stopColor="#6F829D"/></linearGradient>
          <linearGradient id="cgC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D7DFEA"/><stop offset="1" stopColor="#F6F8FB"/></linearGradient>
        </defs>
        <polygon points={A} fill="url(#cgA)"/><polygon points={B} fill="url(#cgB)"/><polygon points={C} fill="url(#cgC)"/>
        <line x1={78} y1={72} x2={260} y2={64} stroke="#fff" strokeWidth={2} opacity={0.9}/></svg>;
    case 'lego': {
      // the plane built from white 1x bricks, studs on top
      const rows = [[0, 2], [0, 4], [1, 7], [1, 10], [2, 13], [3, 10], [3, 7], [2, 4]];
      return <svg width={280} height={170} viewBox="0 0 300 180" style={{overflow: 'visible'}}>
        {rows.map(([x0, n], j) => <g key={j}>{Array.from({length: n}, (_, i) => <g key={i}>
          <rect x={(x0 + i) * 20} y={j * 20} width={20} height={20} fill={j > 4 ? '#D9DDE3' : '#FAFAFA'} stroke="#C4C9D1" strokeWidth={1.2}/>
          {j === 0 || rows[j - 1][0] + rows[j - 1][1] <= x0 + i ? <ellipse cx={(x0 + i) * 20 + 10} cy={j * 20 - 1} rx={6} ry={3} fill="#FFFFFF" stroke="#C4C9D1"/> : null}</g>)}</g>)}</svg>;
    }
    case 'zack':
      return <svg width={260} height={130} viewBox="0 0 260 130" style={{overflow: 'visible', filter: 'drop-shadow(0 16px 10px rgba(40,80,40,.25))'}}>
        <defs><radialGradient id="zkA" cx=".3" cy=".3" r="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="1" stopColor="#E6E9F0"/></radialGradient></defs>
        <g strokeLinejoin="round" stroke="#E6E9F0" strokeWidth={8}><polygon points={A} fill="url(#zkA)"/><polygon points={B} fill="#C9CFDB"/><polygon points={C} fill="#F1F3F7"/></g></svg>;
  }
  return null;
};
