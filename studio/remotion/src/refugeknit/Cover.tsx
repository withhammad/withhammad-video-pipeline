// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Make prayer your refuge" reel (her Instagram,
// @heal.ingthroughquran): the turning point (t = 10.7 s) inside the knitted prayer hall: the doll in sujood on his prayer mat,
// the battery over him just turned full and green, under a big two-line hook. On the 9:16 cover the hook and the doll sit inside
// the 4:5 and 3:4 grid crops (y 285-1635 / 240-1680); the 4:5 thumbnail is laid out on its own.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {SANS, SERIF, Scene} from './RefugeKnit';

const TS = 10.72;
export const RefugeCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const k = grid ? 1.2 : 1.12, dy = grid ? -330 : -60, top = grid ? 70 : 330;
  return <AbsoluteFill style={{background: '#0B1330', overflow: 'hidden'}}>
    <YarnDefs/><ArDefs/>
    <AbsoluteFill style={{transformOrigin: '560px 1500px', transform: `translateY(${dy}px) scale(${k})`, height: 1920}}><Scene t={TS}/></AbsoluteFill>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #08060Ae8 0px, #08060Ad0 ${top + 300}px, #08060A00 ${top + 470}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontSize: grid ? 112 : 124, lineHeight: 1.02, letterSpacing: 3,
        filter: 'url(#yarn) drop-shadow(0 6px 4px #000000cc) drop-shadow(0 0 30px #FFC84C77)'}}><span style={gold(0.3, 0.35)}>WHEN LIFE<br/>DRAINS YOU</span></div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: grid ? 92 : 100, lineHeight: 1.05, marginTop: 14, color: '#FFF3DA',
        textShadow: '0 4px 6px #000000cc, 0 0 26px #FFC84C55'}}>pray. recharge.</div>
    </div>
  </AbsoluteFill>;
};
