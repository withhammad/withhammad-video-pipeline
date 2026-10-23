import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

// Click-first cover (owner rule 2026-10-23): the reference's blurred circuit background and presenter card with the head
// popping out, two big lines with the punch in the orange box, whole head inside the 3:4, 4:5 and 1:1 grid crops.
const ORANGE = '#D0602C', S = 0.78, W = 1080 * S, X = (1080 - W) / 2, TOP = 603, CARD = 1020;
const file = (s: string) => staticFile('kimi/' + s);
const line = (text: string, y: number, size: number, bg: string) => <div style={{position: 'absolute', top: y - size * 0.68, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
  <div style={{fontFamily: 'KimiInter, Arial', fontWeight: 900, fontSize: size, lineHeight: `${size * 1.36}px`, padding: '0 26px', background: bg, color: '#fff', letterSpacing: -2, whiteSpace: 'nowrap'}}>{text}</div></div>;

export const Cover: React.FC<{pick: number}> = ({pick}) => <AbsoluteFill style={{background: '#06122e'}}>
  <AbsoluteFill style={{overflow: 'hidden'}}><Img src={file('cover_bg.png')} style={{width: 1080, height: 1920, transform: 'scale(1.1)', filter: 'blur(14px)'}}/></AbsoluteFill>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(5,11,26,.6) 100%)'}}/>
  {line('2.78T AI MODEL', 530, 106, '#1E1E1E')}
  {line('ON 8 GB RAM', 702, 128, ORANGE)}
  <div style={{position: 'absolute', left: X, top: CARD, width: W, height: 1920 - CARD + 60, borderRadius: 44, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.45)'}}>
    <Img src={file(`cover_face${pick}.png`)} style={{position: 'absolute', left: 0, top: TOP - CARD, width: W, height: 1920 * S}}/></div>
  <div style={{position: 'absolute', left: X, top: TOP, width: W, height: CARD - TOP + 1, overflow: 'hidden'}}>
    <Img src={file(`cover_cut${pick}.png`)} style={{position: 'absolute', left: 0, top: 0, width: W, height: 1920 * S}}/></div>
</AbsoluteFill>;
