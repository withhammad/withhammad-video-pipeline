// Cover for the private knitted Tasbeeh Fatimah reel (her Instagram, @heal.ingthroughquran): the finished state at 100 — the lit
// knitted mosque, the gold counter medallion, the felted tasbih in the three set colours (marigold, rose, lavender), crochet flowers —
// under a big gold yarn "Tasbeeh Fatimah" and "count with me · 33 · 33 · 34". The scene is scaled 1.25x from the bottom edge so
// title, mosque and medallion all sit inside the 1:1 grid crop (y 420-1500); the handle sits inside the 4:5 crop.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {BEAD, Blooms, END_F, FPS, Filters, Handle, Medallion, MosqueLights, S_RIM, SERIF, SP, STRING_D, Twinkles, atLen} from './TasbeehKnit';

const T = END_F / FPS + 1.4;
const BAND = ['gold', 'gold', 'gold', 'gold', 'gold', 'gold', 'rose', 'rose', 'rose', 'rose', 'rose', 'rose', 'rose', 'lav', 'lav', 'lav', 'lav',
  'lav', 'lav', 'lav', 'lav', 'lav', 'lav'];
export const TasbeehCover: React.FC = () => <AbsoluteFill style={{background: '#120E2A', overflow: 'hidden'}}>
  <YarnDefs/>
  <Filters/>
  <AbsoluteFill style={{transform: 'scale(1.25)', transformOrigin: '540px 1920px'}}>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <div style={{position: 'absolute', left: 355 - 240, top: 955 - 240, width: 480, height: 480, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.5,
      background: 'radial-gradient(closest-side, #FFF1C2aa 0%, #FFE09A33 50%, #FFE09A00 100%)'}}/>
    <MosqueLights t={T} end={1} all/>
    <Twinkles t={3.3} boost={0.6}/>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={STRING_D} stroke="#E8C77A" strokeWidth={3.5} fill="none" strokeLinecap="round" style={{filter: 'url(#yarn) drop-shadow(0 3px 3px #00000099)'}}/>
    </svg>
    {BAND.map((c, p) => { const q = atLen(S_RIM + SP * 0.5 + p * SP);
      return <Img key={p} src={staticFile(`parts/bead_${c}${p % 5}.png`)} style={{position: 'absolute', left: q.x - BEAD / 2, top: q.y - 2 - BEAD / 2, width: BEAD, height: BEAD,
        transform: `rotate(${p * 47}deg)`, filter: `drop-shadow(0 5px 4px #0000009a) drop-shadow(0 0 8px ${c === 'gold' ? '#FFC64A' : c === 'rose' ? '#FF9DBB' : '#B79CFF'}88)`}}/>; })}
    <Medallion t={T} f={Math.round(T * FPS)}/>
    <Blooms t={T} t0={0}/>
  </AbsoluteFill>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 22% at 50% 28%, #0E0A24aa 0%, #0E0A2400 100%)'}}/>
  <Handle top={330} endP={1}/>
  <div style={{position: 'absolute', top: 452, left: 0, right: 0, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontSize: 118, lineHeight: 1.05, ...gold(0.62, 1), WebkitTextStroke: '2px #E7B040', filter: `${PUFF} drop-shadow(0 0 24px #FFC64A55)`}}>
      Tasbeeh Fatimah</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, lineHeight: 1.2, marginTop: 6, color: '#FBF1DC', textShadow: '0 3px 4px #000000cc'}}>
      count with me · 33 · 33 · 34</div>
  </div>
</AbsoluteFill>;
