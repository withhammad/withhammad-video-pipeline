import React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';

// Click-first cover in the reference's formula: brand logo on top, the face with the "shh" gesture, two tilted
// product icons behind the head, a 2-line threat hook with line 2 in a red box. Official NVIDIA and Claude marks;
// the "Ai" tile is drawn here. Whole head inside the 3:4, 4:5 and 1:1 grid crops.
const file = (s: string) => staticFile('skill/' + s);
const SANS = 'SkInter, Arial, sans-serif';
export const Cover: React.FC<{pick: number; line2: string; scale: number; top: number}> = ({pick, line2, scale, top}) => {
  const W = 1072 * scale, H = 1920 * scale;
  const tile = (x: number, y: number, rot: number, child: React.ReactNode) => <div style={{position: 'absolute', left: x, top: y, width: 330, height: 330,
    transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.6))'}}>{child}</div>;
  return <AbsoluteFill style={{background: '#090A0A', overflow: 'hidden'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 40% at 50% 38%, #0E3B44 0%, #0A1F24 45%, #090A0A 80%)'}}/>
    <AbsoluteFill style={{fontFamily: 'SkDoto, Menlo, monospace', fontSize: 34, lineHeight: '40px', color: '#5FE1D6', opacity: 0.07, whiteSpace: 'pre', padding: 20}}>
      {Array.from({length: 48}, (_, i) => <div key={i}>{Array.from({length: 40}, (_, j) => (random(`b${i}-${j}`) > 0.5 ? '1' : '0')).join(' ')}</div>)}</AbsoluteFill>
    {[[520, 900, 14], [690, 620, 8], [1080, 760, 10]].map(([y, w, h], i) => <div key={i} style={{position: 'absolute', top: y, left: i % 2 ? 60 : 300, width: w, height: h, background: '#2DD4BF', opacity: 0.12}}/>)}
    <div style={{position: 'absolute', left: 140, top: 300, width: 800, height: 148}}><Img src={file('nvidia-logo-white.svg')} style={{width: 800, height: 148}}/></div>
    {tile(30, 600, -12, <div style={{width: 330, height: 330, borderRadius: 80, background: 'linear-gradient(160deg, #3FD2F2, #1E8FD6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, fontWeight: 800, fontSize: 170, color: '#fff', textShadow: '0 4px 0 rgba(0,0,0,.15)'}}>Ai</div>)}
    {tile(712, 590, 12, <Img src={file('claude-tile.png')} style={{width: 330, height: 330}}/>)}
    <Img src={file(`shh-cut${pick}.png`)} style={{position: 'absolute', left: (1080 - W) / 2, top, width: W, height: H}}/>
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, transparent 66%, rgba(0,0,0,.85) 76%, #000 82%)'}}/>
    <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 116, letterSpacing: -2, color: '#fff', textShadow: '0 6px 20px rgba(0,0,0,.7)'}}>PROTECT CLAUDE</div>
    <div style={{position: 'absolute', top: 1282, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#FF3231', borderRadius: 16, padding: '6px 34px', fontFamily: SANS, fontWeight: 900, fontSize: line2.length > 13 ? 98 : 116, letterSpacing: -2, color: '#fff', whiteSpace: 'nowrap'}}>{line2}</div></div>
  </AbsoluteFill>;
};
