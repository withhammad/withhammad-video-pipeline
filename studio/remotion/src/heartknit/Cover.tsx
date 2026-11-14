// Cover for the private knitted "Purify your heart" reel (her Instagram, @heal.ingthroughquran): the heart caught halfway
// (count 58), half tangled black wool and half red crochet, the gold yarn title and a knitted "100 x Astaghfirullah" pill.
// Title, heart and pill all sit inside the 1:1 grid crop (y 420-1500), so the 4:5 and 3:4 crops read too.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {AR, Arch, DHIKR, Heart, HeartDefs, TITLE, Tasbih, arNum} from './HeartKnit';
import {SRC_W} from './cells';

const T = 58.6, HW = 410, HX = 540 - HW / 2, HY = 652, SC = HW / SRC_W;
export const HeartCover: React.FC = () => <AbsoluteFill style={{background: '#0B1716', overflow: 'hidden'}}>
  <YarnDefs/>
  <HeartDefs/>
  <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 55% at 50% 50%, #0B171600 35%, #050B0Bcc 100%)'}}/>
  <div style={{position: 'absolute', inset: 0, transform: 'translateY(80px)'}}><Arch p={1} o={0.8}/></div>
  <div style={{position: 'absolute', left: 540 - 520, top: 940 - 560, width: 1040, height: 1120, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.6,
    background: 'radial-gradient(closest-side, #E0603A88 0%, #C8402A44 40%, #8A2A1A00 100%)'}}/>
  <Img src={staticFile('parts/doily.png')} style={{position: 'absolute', left: 540 - 270, top: 1280 - 38, width: 540, height: 76, objectFit: 'fill',
    filter: 'brightness(0.78) drop-shadow(0 8px 10px #000000aa)'}}/>
  <div style={{position: 'absolute', left: HX, top: HY, width: SRC_W, transformOrigin: '0 0', transform: `scale(${SC})`,
    filter: 'drop-shadow(0 26px 30px #000000bb)'}}><Heart t={T} pieces={false}/></div>
  <div style={{position: 'absolute', inset: 0, transform: 'translate(-12px, 82px)'}}><Tasbih t={T} falling={false}/></div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 466, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 150, lineHeight: 1.45, ...gold(0.55, 1), WebkitTextStroke: '3px #E7B040',
      filter: `${PUFF} drop-shadow(0 0 26px #FFC64A66)`}}>{TITLE}</div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1302, display: 'flex', justifyContent: 'center'}}>
    <div style={{padding: '0 50px 14px', borderRadius: 60, background: 'linear-gradient(180deg, #7A1420, #4E0A12)', border: '4px dashed #E7B040',
      boxShadow: '0 12px 26px #000000aa', textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 74, lineHeight: 1.6, whiteSpace: 'nowrap'}}>
        <span style={{color: '#FBF1DC', WebkitTextStroke: '1px #FBF1DC', filter: PUFF}}>{DHIKR}</span>{' '}
        <span style={{...gold(0.4, 1), WebkitTextStroke: '1px #E7B040', filter: PUFF}}>{arNum(100)} مَرَّة</span>
      </div>
      <div style={{fontFamily: 'KnitSerif, serif', fontStyle: 'italic', fontSize: 40, lineHeight: 1, marginTop: 6, color: '#F6D99B'}}>
        100 × Astaghfirullah</div>
    </div>
  </div>
</AbsoluteFill>;
