// Cover (9:16) and grid thumbnail (4:5) for the private knitted "99 Names for stress" reel (her Instagram, @heal.ingthroughquran):
// the doily dial with the needle on Al-Latif and the lamp glowing, the STRESS meter half drained, and the hook in big yarn letters.
// On the 9:16 cover the hook and the dial's centre sit inside the 4:5 and 1:1 grid crops (y 285-1635 and 420-1500).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {CREAM, Dial, GOLD, Label, Meter, Room, S, SERIF} from './StressKnit';

export const StressCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const t = S[29] + 0.7;                                          // needle resting on #30 Al-Latif, "the Kind"
  const top = grid ? 70 : 330;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <YarnDefs/>
    <div style={{position: 'absolute', left: 0, top: grid ? -120 : 260, width: 1080, height: 1920}}>
      <Room t={t}/><div style={{position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '540px 790px'}}><Dial t={t}/></div>
    </div>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #000000d8 0px, #00000099 ${top + 330}px, #00000000 ${top + 520}px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <Label size={grid ? 104 : 116} ls={8}>STRESSED?</Label>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: grid ? 68 : 76, color: CREAM, marginTop: 18, textShadow: '0 3px 10px #000'}}>
        Read His <span style={{color: GOLD}}>99 Names</span></div>
    </div>
    <div style={{position: 'absolute', left: 0, top: grid ? 1180 : 1520, width: 1080}}><Meter t={t} y={0}/></div>
  </AbsoluteFill>;
};
