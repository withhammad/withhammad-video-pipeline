// Cover for the private knitted Asma-ul-Husna video (her Instagram, @heal.ingthroughquran): the knitted shrine, the title in cream
// yarn, a large gold-yarn Allah and the fully lit tasbih. Every word sits inside the 1:1 grid crop (y 420-1500).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR, PUFF, Tasbih, YarnDefs, gold} from './AsmaKnit';

const UR = 'Nastaliq, serif';
export const AsmaCover: React.FC = () => <AbsoluteFill style={{background: '#1A0306'}}>
  <YarnDefs/>
  <Img src={staticFile('scene.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
  <div style={{position: 'absolute', left: 540 - 420, top: 960, width: 840, height: 720, borderRadius: '50%', mixBlendMode: 'screen',
    background: 'radial-gradient(closest-side, #FFD67A 0%, #FFB83A66 40%, #FF9A2A00 100%)', opacity: 0.6}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 34% at 50% 36%, #12010388 0%, #12010300 100%)'}}/>
  <div dir="rtl" style={{position: 'absolute', top: 400, left: 0, right: 0, textAlign: 'center', fontFamily: AR, fontSize: 128, lineHeight: 1.5,
    color: '#FBF1DC', WebkitTextStroke: '4px #FBF1DC', filter: PUFF}}>الْأَسْمَاءُ الْحُسْنَىٰ</div>
  <div dir="rtl" style={{position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center', fontFamily: AR, fontSize: 330, lineHeight: 1.45, ...gold(0.62),
    filter: `${PUFF} drop-shadow(0 0 34px #FFC64AAA)`}}>اللهُ</div>
  <div style={{position: 'absolute', top: 1010, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{padding: '10px 44px 16px', borderRadius: 60, background: 'linear-gradient(180deg, #7A1420, #520A12)', border: '4px dashed #E7B040',
      boxShadow: '0 10px 24px #00000099', textAlign: 'center'}}>
      <div style={{fontFamily: 'KnitSerif, serif', fontStyle: 'italic', fontSize: 66, color: '#FBE7B8', lineHeight: 1.1}}>Beautiful Names of Allah</div>
      <div dir="rtl" style={{fontFamily: UR, fontWeight: 700, fontSize: 50, color: '#F6D99B', lineHeight: 1.7}}>اللہ کے پیارے نام</div>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, top: 290}}><Tasbih t={2} lit={18} cur={-1} all={1}/></div>
</AbsoluteFill>;
