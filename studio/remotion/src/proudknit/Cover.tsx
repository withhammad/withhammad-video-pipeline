// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Don't be proud" reel (her Instagram, @heal.ingthroughquran):
// the closing moment (t = 20.2 s): the faceless knitted doll in sujood in the beam of light, flowers grown round him, with a big
// two-line hook. On the 9:16 cover the hook and the doll sit inside the 4:5 and 3:4 grid crops (y 285-1635 / 240-1680); the 4:5
// thumbnail is laid out on its own (the scene moved up under the hook).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {GY, SANS, SERIF, Scene} from './ProudKnit';

const TS = 20.2;
export const ProudCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const k = grid ? 1.35 : 1.25, dy = grid ? -30 : 250, top = grid ? 60 : 330;     // the scene scaled about the sujood
  return <AbsoluteFill style={{background: '#0E0D10', overflow: 'hidden'}}>
    <YarnDefs/><ArDefs/>
    <AbsoluteFill style={{transformOrigin: `560px ${GY}px`, transform: `translateY(${dy}px) scale(${k})`, height: 1920}}><Scene ts={TS} t={TS}/></AbsoluteFill>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #0B0A0Ee8 0px, #0B0A0Eb0 ${top + 260}px, #0B0A0E00 ${top + 380}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontSize: grid ? 128 : 140, lineHeight: 1, letterSpacing: 4,
        filter: 'url(#yarn) drop-shadow(0 6px 4px #000000cc) drop-shadow(0 0 30px #FFC84C77)'}}><span style={gold(0.3, 0.35)}>DON'T BE PROUD</span></div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: grid ? 96 : 108, lineHeight: 1.05, marginTop: 10, color: '#FFF3DA',
        textShadow: '0 4px 6px #000000cc, 0 0 26px #FFC84C55'}}>of this world</div>
    </div>
    {grid ? null : <div style={{position: 'absolute', left: 0, right: 0, top: 1470, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 50,
      color: '#F2C04E', textShadow: '0 3px 5px #000000cc'}}>piety is His gift to you</div>}
  </AbsoluteFill>;
};
