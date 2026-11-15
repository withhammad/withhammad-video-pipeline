// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Allah, Allah" reel (her Instagram, @heal.ingthroughquran): the
// knitted heart half caked in black wool, half clean, with doves and gold rings (a frame of the Blender plate, cover_bg.jpg), the
// Name in gold yarn, the hook in big yarn letters and ar-Ra'd 13:28's last clause with its reference. Every word sits inside the
// 1:1 grid crop (y 420-1500 of the 9:16 frame); the 4:5 thumbnail is the same design on the 4:5 crop (y 285-1635).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {AR, AR_THREAD, Name, SERIF} from './AllahKnit';
import TX from './texts.json';

export const AllahCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const dy = grid ? -285 : 0;
  return <AbsoluteFill style={{background: '#0A1E22', overflow: 'hidden'}}>
    <YarnDefs/>
    <ArDefs/>
    <Img src={staticFile('cover_bg.jpg')} style={{position: 'absolute', left: 0, top: dy + 150, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #06171Bee ${300 + dy}px, #06171Bcc ${640 + dy}px, #06171B00 ${860 + dy}px, #06171B00 ${1150 + dy}px, #06171Bcc ${1330 + dy}px, #06171Bf0 ${1520 + dy}px)`}}/>
    <div style={{position: 'absolute', top: 430 + dy, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: '#F6E3BC', letterSpacing: 1, paddingBottom: 5, borderBottom: '3px dashed #D9A847',
        textShadow: '0 2px 3px #000000aa'}}>@heal.ingthroughquran</span>
    </div>
    <div style={{position: 'absolute', top: 488 + dy, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34}}>
      <div style={{fontFamily: SERIF, fontSize: 120, lineHeight: 1, ...gold(0.35, 0.25), WebkitTextStroke: '2.2px #E7B040',
        filter: 'url(#yarn) drop-shadow(0 4px 3px #1A0A04cc) drop-shadow(0 14px 22px #000000bb) drop-shadow(0 0 26px #FFC85A77)'}}>Allah, Allah</div>
    </div>
    <div style={{position: 'absolute', top: 618 + dy, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 62, lineHeight: 1.1,
      color: '#FBF1DE', textShadow: '0 3px 5px #000000dd, 0 0 18px #000000aa', filter: 'url(#yarn)'}}>until the heart comes clean</div>
    <div style={{position: 'absolute', left: 90, right: 90, top: 1270 + dy, height: 230, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #06171Bee 0%, #06171Bbb 60%, #06171B00 100%)'}}/>
    <div style={{position: 'absolute', top: 1286 + dy, left: 0, right: 0, textAlign: 'center'}}>
      <div dir="rtl" lang="ar" style={{display: 'inline-block', fontFamily: AR, fontSize: 64, lineHeight: 1.7, color: '#F7C552', WebkitTextStroke: '1.1px #E3AC45',
        filter: AR_THREAD, whiteSpace: 'nowrap'}}>{TX.ayah}</div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 36}}>
        <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
        <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: '#F6E3BC', textShadow: '0 2px 3px #000000cc'}}>{TX.ayah_ref}</span>
        <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
      </div>
    </div>
    <div style={{position: 'absolute', top: 236 + dy, left: 0, right: 0, textAlign: 'center', opacity: grid ? 0 : 1}}><Name t={0.4} size={150}/></div>
  </AbsoluteFill>;
};
