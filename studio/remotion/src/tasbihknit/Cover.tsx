// Cover for the private knitted "Subhan Allah x100" reel (her Instagram, @heal.ingthroughquran): the gold yarn title, the
// felted tasbih finished as a full rainbow round the crochet medallion holding "1000 حسنة", and a knitted "100 × سُبْحَانَ اللّٰهِ"
// pill. Title, ring and pill sit inside the 1:1 grid crop (y 420-1500), so the 4:5 and 3:4 crops read too.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {AR, EN, Handle, INK, Medallion, PUFF_AR, Ring, Tassel, TasbihDefs, puffNum} from './TasbihKnit';
import * as T from './text';

const CY = 1004, SC = 0.8;
export const TasbihCover: React.FC = () => <AbsoluteFill style={{background: '#1A0619', overflow: 'hidden'}}>
  <YarnDefs/>
  <TasbihDefs/>
  <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 58% at 50% 50%, #2A0A2600 30%, #12030FCC 100%)'}}/>
  <div style={{position: 'absolute', left: 540 - 620, top: CY - 620, width: 1240, height: 1240, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.85,
    background: 'radial-gradient(closest-side, #FFD36A66 0%, #FF9AC833 45%, #FF9A2A00 100%)'}}/>
  <Tassel cy={CY} scale={SC}/>
  <Ring t={200} lit={100} cy={CY} scale={SC} glowAll={0.45}/>
  <Medallion cy={CY} scale={SC} glow={0.3}>
    <div style={{textAlign: 'center'}}>
      <div style={{...puffNum(206, '#C68A12', '#9A6408'), filter: 'url(#yarn) drop-shadow(0 0 16px #FFD36A) drop-shadow(0 6px 8px #00000055)'}}>1000</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 76, lineHeight: 1.5, color: '#4A1240', filter: INK}}>{T.HASANA}</div>
    </div>
  </Medallion>
  <Handle top={196}/>
  <div style={{position: 'absolute', left: 0, right: 0, top: 424, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 136, lineHeight: 1.45, ...gold(0.55, 1), WebkitTextStroke: '0px transparent',
      filter: `drop-shadow(0 0 1.5px #8A5A08) ${PUFF_AR} drop-shadow(0 0 24px #FFC64A66)`}}>{T.TITLE}</div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1306, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <div style={{padding: '0 46px 10px', borderRadius: 60, background: 'linear-gradient(180deg, #7A1E5E, #4A0E3A)', border: '4px dashed #F2C45E',
      boxShadow: '0 12px 26px #000000aa', textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 66, lineHeight: 1.7, whiteSpace: 'nowrap', color: '#FBF1DC', filter: PUFF_AR}}>100 × {T.DHIKR}</div>
    </div>
    <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 40, lineHeight: 1, marginTop: 14, color: '#F6D99B', textShadow: '0 2px 4px #000000cc'}}>
      1,000 good deeds before this video ends</div>
  </div>
</AbsoluteFill>;
