// Cover for the private knitted "Say each one 10 times" reel (her Instagram, @heal.ingthroughquran): the knitted window at dawn
// with the tasbih string carrying all four sets' beads (pearl, emerald, amber, sapphire, a quarter each), the hook in the window
// and the four dhikr names under it. Everything sits inside the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and 3:4
// crops read too; the 4:5 thumbnail is the 1080x1350 centre crop of this cover.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {BD, BEAD_SRC, CX, CY, Filters, Handle, RB, Room, SERIF, Sky, StringRing, Tassel} from './FourKnit';

const DY = -75;                         // the whole scene up, so the ring sits inside the 1:1 crop
export const FourCover: React.FC = () => {
  const t = 5.0;                       // a dawn frame: room and sky at rest, string drawn
  const beads = Array.from({length: 28}, (_, k) => {
    const th = (k / 28) * 360 + 180 / 28 + 6;
    return {x: CX + RB * Math.sin((th * Math.PI) / 180), y: CY - RB * Math.cos((th * Math.PI) / 180), set: Math.floor(k / 7), v: k % 5};
  });
  return <AbsoluteFill style={{background: '#2a1a12', overflow: 'hidden'}}>
    <YarnDefs/>
    <Filters/>
    {/* the room once more underneath, so the strip the shift uncovers at the bottom is the same knitted bench */}
    <Img src={staticFile('room.png')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{transform: `translateY(${DY}px)`}}>
      <Sky t={t}/>
      <Room t={t}/>
      <StringRing t={t}/>
      <Tassel t={t}/>
      {beads.map((b, n) => <Img key={n} src={BEAD_SRC(b.set, b.v)} style={{position: 'absolute', left: b.x - BD / 2, top: b.y - BD / 2, width: BD, height: BD,
        transform: `rotate(${n * 41}deg)`, filter: 'drop-shadow(0 0 2px #FFF6EE) drop-shadow(0 6px 5px #2a160c88)'}}/>)}
      {/* a soft cream light behind the hook */}
      <div style={{position: 'absolute', left: CX - 300, top: CY - 230, width: 600, height: 420, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #FFF6EEdd 0%, #FFF6EE88 55%, #FFF6EE00 100%)'}}/>
      <div style={{position: 'absolute', left: CX - 320, width: 640, top: CY - 190, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontSize: 92, lineHeight: 1, color: '#4A2440', filter: 'url(#yarn) drop-shadow(0 0 10px #FFF6EE)'}}>Say each one</div>
        <div style={{fontFamily: SERIF, fontSize: 150, lineHeight: 1.05, ...gold(0.7, 0.4), WebkitTextStroke: '3px #C9861E',
          filter: 'url(#yarn) drop-shadow(0 3px 2px #4A244055) drop-shadow(0 0 16px #FFF2D0)'}}>10 times</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, lineHeight: 1.25, color: '#4A2440', marginTop: 6, textShadow: '0 0 10px #FFF6EE'}}>
          SubhanAllah · Alhamdulillah<br/>Allahu Akbar · La ilaha illallah</div>
      </div>
    </AbsoluteFill>
    <Handle top={450}/>
  </AbsoluteFill>;
};
