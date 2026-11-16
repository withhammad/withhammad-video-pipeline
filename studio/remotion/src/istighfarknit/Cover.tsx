// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Istighfar x100" reel (her Instagram, @heal.ingthroughquran):
// the knitted man bent under his bowl heaped with 100 felted sins, and «أَسْتَغْفِرُ ٱللَّهَ» /
// "ISTIGHFAR ×100" in big yarn letters with the hook line. On the 9:16 cover the title and the doll sit inside the 4:5 and 1:1
// grid crops (y 285-1635 and 420-1500); the 4:5 thumbnail is laid out on its own.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {ARQ, CLAY, INK, Man, PUFF, Pile, ROUND, SERIF, geom} from './IstighfarKnit';
import TX from './texts.json';

export const IstighfarCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const top = grid ? 70 : 380, feet = grid ? 1300 : 1610, cx = 500;
  const g = geom('man1', cx, feet);
  return <AbsoluteFill style={{background: '#F6DDB8', overflow: 'hidden'}}>
    <YarnDefs/>
    <Img src={staticFile('plate.jpg')} style={{position: 'absolute', left: -50, top: grid ? -470 : -60, width: 1180, height: 2098}}/>
    <div style={{position: 'absolute', left: 540 - 700, top: (grid ? 760 : 1080) - 600, width: 1400, height: 1000, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFE6A8, #FFC26A55 45%, #FFB04A00)', opacity: 0.5}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #FFF3DEd8 0px, #FFF3DEb0 ${top + 420}px, #FFF3DE00 ${top + 640}px)`}}/>
    <div style={{position: 'absolute', left: cx - 280, top: feet - 26, width: 560, height: 52, borderRadius: '50%', background: 'radial-gradient(closest-side, #6A3A1A55, #6A3A1A00)'}}/>
    <Man pose="man1" g={g}/>
    <Pile t={0} g={g} k={0} knock={false}/>
        <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: ARQ, fontSize: 150, lineHeight: 1.75, color: INK, WebkitTextStroke: `2px ${INK}`, filter: PUFF}}>{TX.dhikrAr}</div>
      <div style={{fontFamily: ROUND, fontSize: 112, lineHeight: 1, marginTop: 34, letterSpacing: 4, color: INK, filter: PUFF}}>ISTIGHFAR <span style={{color: CLAY}}>×100</span></div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, lineHeight: 1.15, marginTop: 18, color: '#6A3A22'}}>What are you carrying on your back?</div>
    </div>
    {grid ? null : <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: INK, paddingBottom: 8, borderBottom: `4px dashed ${CLAY}`}}>@heal.ingthroughquran</span></div>}
  </AbsoluteFill>;
};
