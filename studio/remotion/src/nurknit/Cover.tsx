// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Light upon light" reel (her Instagram, @heal.ingthroughquran):
// the knitted room at t = 38.6 s, the three lanterns lit one from the other, under a big two-line hook and the ayah's own words
// «نُّورٌ عَلَىٰ نُورٍ» (a cut of 24:35, checked in text.py). On the 9:16 cover the hook and the dolls sit inside the 4:5 and 3:4 grid
// crops (y 285-1635 / 240-1680); the 4:5 thumbnail is laid out on its own.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs, AR_PUFF} from '../lanternknit/LanternKnit';
import {AR, SANS, Scene} from './NurKnit';
import TX from './texts.json';

const TS = 38.6;
export const NurCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const k = grid ? 1.0 : 1.0, dy = grid ? -330 : 40, top = grid ? 60 : 320;
  const nur = TX.cards[7];
  return <AbsoluteFill style={{background: '#0A0E14', overflow: 'hidden'}}>
    <YarnDefs/><ArDefs/>
    <AbsoluteFill style={{transformOrigin: '600px 1470px', transform: `translateY(${dy}px) scale(${k})`, height: 1920}}><Scene t={TS}/></AbsoluteFill>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #06050Ae8 0px, #06050Ad0 ${top + 330}px, #06050A00 ${top + 520}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontSize: grid ? 120 : 130, lineHeight: 1.02, letterSpacing: 3,
        filter: 'url(#yarn) drop-shadow(0 6px 4px #000000cc) drop-shadow(0 0 30px #FFC84C77)'}}><span style={gold(0.3, 0.35)}>PASS THE<br/>LIGHT ON</span></div>
      <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: grid ? 84 : 92, lineHeight: 1.7, marginTop: 6, color: '#FFF3DA', filter: AR_PUFF}}>
        {nur.ar.join(' ')}</div>
    </div>
  </AbsoluteFill>;
};
