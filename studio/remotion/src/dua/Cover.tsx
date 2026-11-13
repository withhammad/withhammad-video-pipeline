// Cover for the private dua reel: the medium dua picture with the opening line large, everything inside the 1:1 grid
// crop (y 420-1500). No branding.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR} from '../asmaknit/AsmaKnit';

export const DuaCover: React.FC = () => <AbsoluteFill style={{background: '#0B0704'}}>
  <Img src={staticFile('shots/s3-medium.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'scale(1.06)', transformOrigin: '50% 60%'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 40%, #000000aa 100%)'}}/>
  <AbsoluteFill style={{background: '#2A1606', mixBlendMode: 'soft-light', opacity: 0.35}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 12% at 50% 560px, #000000b0 0%, #00000000 100%)'}}/>
  <div style={{position: 'absolute', left: 40, right: 40, top: 560, transform: 'translateY(-50%)', textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 118, lineHeight: 1.45, color: '#FFFFFF', textShadow: '0 3px 6px #000000cc, 0 0 30px #000000aa'}}>
      يا الله يا مقتدر</div>
    <div style={{fontFamily: '"Bodoni 72", "Didot", serif', fontSize: 50, color: '#F6EEDD', marginTop: 4,
      textShadow: '0 2px 4px #000000cc, 0 0 18px #000000aa'}}>Ey Muktedir olan Allah’ım</div>
  </div>
</AbsoluteFill>;
