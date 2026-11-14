// Cover for the private nasheed reel: the medium picture at the Green Dome with "Mustafa ﷺ" large, inside the 1:1 grid
// crop (y 420-1500). No branding.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR, UR} from '../asmaknit/AsmaKnit';

export const NasheedCover: React.FC = () => <AbsoluteFill style={{background: '#05070A'}}>
  <Img src={staticFile('shots/s3-medium.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'scale(1.06)', transformOrigin: '50% 60%'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 40%, #000000a0 100%)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 11% at 50% 560px, #000000a0 0%, #00000000 100%)'}}/>
  <div style={{position: 'absolute', left: 0, right: 0, top: 560, transform: 'translateY(-50%)', textAlign: 'center'}}>
    <div dir="rtl" style={{display: 'inline-block', fontFamily: UR, fontSize: 150, lineHeight: 1.9, color: '#FFFFFF',
      textShadow: '0 4px 8px #000000cc, 0 0 34px #000000aa, 0 0 50px #FFF3D044'}}>
      مصطفى<span style={{fontFamily: AR, fontSize: 128, marginRight: 24, color: '#F3DDA0'}}> ﷺ</span></div>
  </div>
</AbsoluteFill>;
