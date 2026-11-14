// Cover for the private knitted Fussilat 41:30 reel (her Instagram, @heal.ingthroughquran): the finished valley at the ridge
// (gold dawn, the knitted rainbow across the falls, crochet flowers on the ledges) under the reference caption's promise in
// big yarn letters. The promise, "Allah" + the heart and the surah label sit inside the 1:1 grid crop (y 420-1500); the
// handle sits inside the 4:5 crop (y 285-1635).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import {YarnLite, goldFill} from '../hayyuknit/HayyuKnit';
import {AllahLine, SERIF, Scene} from './FussilatKnit';

const T = 13.95;
export const FussilatCover: React.FC = () => <AbsoluteFill style={{background: '#0C1A26', overflow: 'hidden'}}>
  <YarnDefs/>
  <YarnLite/>
  <Filters/>
  <Scene t={T} endG={1} Y={0} z={1}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 45% at 50% 22%, #FFD98A 0%, #FFD98A00 100%)', mixBlendMode: 'screen', opacity: 0.3}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #07121F50 0px, #07121Fb8 440px, #07121Fc0 960px, #07121F60 1100px, #07121F00 1220px)'}}/>
  <Handle top={380} endP={1}/>
  <AllahLine t={T} endG={1} top={478}/>
  <div style={{position: 'absolute', top: 600, left: 0, right: 0, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 118, lineHeight: 1.02, color: '#FBEFD8', textShadow: '0 4px 6px #000000cc',
      filter: 'url(#yarnA) drop-shadow(0 10px 16px #00000099)'}}>Don&apos;t fear,<br/>don&apos;t grieve</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 104, lineHeight: 1.15, marginTop: 6, ...goldFill(0.3, 1), WebkitTextStroke: '1.6px #E3AC45',
      filter: 'url(#yarnA) drop-shadow(0 4px 3px #1A0A04cc) drop-shadow(0 0 26px #FFC85A88)'}}>Paradise awaits</div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18}}>
      <span style={{width: 80, borderTop: '3px dashed #D9A847'}}/>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: '#F6E3BC', textShadow: '0 2px 4px #000000cc'}}>Surah Fussilat 41:30</span>
      <span style={{width: 80, borderTop: '3px dashed #D9A847'}}/>
    </div>
  </div>
</AbsoluteFill>;
