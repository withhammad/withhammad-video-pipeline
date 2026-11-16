// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Halal always wins" reel (her Instagram, @heal.ingthroughquran):
// the moment both paths are decided (t = 10.9 s): the elevator wrecked at a red 0, the climber at the lit roof door at a gold 60,
// with a big two-line hook. On the 9:16 cover the hook and the tower sit inside the 4:5 and 3:4 grid crops (y 285-1635 / 240-1680);
// the 4:5 thumbnail is laid out on its own (the scene scaled to 0.82 under the hook).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {ThreadDefs} from '../tadbeerknit/TadbeerKnit';
import {SANS, SERIF, Scene} from './HalalKnit';

const TS = 10.9;
export const HalalCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const k = grid ? 0.8 : 0.9, dy = grid ? 92 : 330;     // the scene: scale about the top centre, then moved down
  const top = grid ? 46 : 340;
  return <AbsoluteFill style={{background: '#0E1430', overflow: 'hidden'}}>
    <YarnDefs/><ArDefs/><ThreadDefs/>
    {/* the plate full-bleed behind the scaled scene, so its sides never show the background colour */}
    <Img src={staticFile('plates/night.jpg')} style={{position: 'absolute', left: -65, top: grid ? -400 : -150, width: 1080 * 1.12, height: 1920 * 1.12}}/>
    <AbsoluteFill style={{transformOrigin: '540px 0px', transform: `translateY(${dy}px) scale(${k})`, height: 1920}}><Scene ts={TS} t={TS}/></AbsoluteFill>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #0B0F24f0 0px, #0B0F24c0 ${top + 300}px, #0B0F2400 ${top + 420}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontSize: grid ? 150 : 170, lineHeight: 1, letterSpacing: 10,
        filter: 'url(#yarn) drop-shadow(0 6px 4px #000000cc) drop-shadow(0 0 30px #FFC84C77)'}}><span style={gold(0.3, 0.35)}>HALAL</span></div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: grid ? 92 : 104, lineHeight: 1.05, marginTop: 6, color: '#FFF3DA',
        textShadow: '0 4px 6px #000000cc, 0 0 26px #FFC84C55'}}>always wins</div>
    </div>
  </AbsoluteFill>;
};
