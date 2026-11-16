// Cover (9:16) and grid thumbnail (4:5) for the private knitted Fajr "needle and candle" reel (her Instagram,
// @heal.ingthroughquran): the close-up of the candle with the needle through it and the old man asleep, and the hook in big yarn
// letters. On the 9:16 cover the title and the candle sit inside the 4:5 and 1:1 grid crops (y 285-1635 and 420-1500).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {CREAM, GOLD, Label, RoomScene, SERIF} from './FajrKnit';

export const FajrCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const top = grid ? 80 : 330;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <YarnDefs/>
    <div style={{position: 'absolute', left: 0, top: grid ? -330 : 120, width: 1080, height: 1920}}><RoomScene t={12.2}/></div>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #000000d0 0px, #00000090 ${top + 420}px, #00000000 ${top + 640}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', transform: `scale(${grid ? 1 : 1.3})`, transformOrigin: '50% 0'}}>
      <Label>A NEEDLE</Label>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 62, color: CREAM, margin: '10px 0 16px', textShadow: '0 3px 10px #000'}}>woke him for <span style={{color: GOLD}}>Fajr</span>.</div>
      <Label col="#BFD8FF">4 PHONES</Label>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 62, color: CREAM, marginTop: 10, textShadow: '0 3px 10px #000'}}>can&apos;t wake us.</div>
    </div>
  </AbsoluteFill>;
};
