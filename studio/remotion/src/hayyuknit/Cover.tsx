// Cover for the private knitted "Ya Hayyu Ya Qayyum" reel (her Instagram, @heal.ingthroughquran): the finished, lit room
// (lantern glowing, star light on the wall, crochet flowers on the plant) under the dua in big gold yarn and the reference
// caption's hook. Title, hook, lantern and flowers sit inside the 1:1 grid crop (y 420-1500); the handle sits inside
// the 4:5 crop (y 285-1635).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import {AR, Blooms, LanternGlow, SERIF, StarLight, YarnLite, goldFill} from './HayyuKnit';
import TX from './texts.json';

const T = 9.0;
export const HayyuCover: React.FC = () => <AbsoluteFill style={{background: '#071C1E', overflow: 'hidden'}}>
  <YarnDefs/>
  <YarnLite/>
  <Filters/>
  <AbsoluteFill>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <StarLight t={T} endG={0.4}/>
    <Blooms t={T} all/>
    <LanternGlow t={T} endG={1}/>
  </AbsoluteFill>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 30% at 50% 36%, #031416bb 0%, #03141600 100%)'}}/>
  <Handle top={330} endP={1}/>
  <div style={{position: 'absolute', top: 440, left: 0, right: 0, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 150, lineHeight: 1.5, whiteSpace: 'nowrap', paddingBottom: 70, marginBottom: -70, ...goldFill(0.6, 1), WebkitTextStroke: '1.6px #E3AC45',
      filter: 'url(#yarnA) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 12px 18px #00000099) drop-shadow(0 0 26px #FFC85A88)'}}>{TX.dua1}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.1, marginTop: 66, color: '#FBEFD8', textShadow: '0 3px 5px #000000cc'}}>
      Jab kuch samajh na aaye…</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.15, ...goldFill(0.2, 1), WebkitTextStroke: '1px #E3AC45',
      filter: 'drop-shadow(0 3px 4px #000000cc)'}}>bas yahi keh do</div>
  </div>
</AbsoluteFill>;
