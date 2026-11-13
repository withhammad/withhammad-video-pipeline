// Cover for the private knitted "Qamar" video: the night dome with the moon up, the word in cream yarn and the subtitle in
// gold, all inside the 1:1 grid crop (y 420-1500).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';

export const QamarCover: React.FC = () => <AbsoluteFill style={{background: '#0A1028'}}>
  <YarnDefs/>
  <Img src={staticFile('scene-night.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
  <div style={{position: 'absolute', left: 780 - 260, top: 390 - 260, width: 520, height: 520, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.7,
    background: 'radial-gradient(closest-side, #FFF6D8 0%, #F7E3A355 45%, #F7E3A300 100%)'}}/>
  <Img src={staticFile('parts/moon.png')} style={{position: 'absolute', left: 780 - 150, top: 390 - 150, width: 300, height: 300, objectFit: 'contain',
    filter: 'drop-shadow(0 0 30px #FFF2C8aa)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 30% at 50% 40%, #0a102888 0%, #0a102800 100%)'}}/>
  <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 260, lineHeight: 1.45, color: '#FBF1DC', WebkitTextStroke: '5px #FBF1DC',
      filter: `${PUFF} drop-shadow(0 0 26px #FFFFFF55)`}}>قَمَرٌ</div>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 92, lineHeight: 1.5, marginTop: -60, ...gold(0.6, 0.3), filter: PUFF}}>سَيِّدُنا النَّبِيُّ قَمَرٌ</div>
  </div>
</AbsoluteFill>;
