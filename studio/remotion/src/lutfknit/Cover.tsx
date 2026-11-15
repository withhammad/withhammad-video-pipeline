// Cover (9:16) and grid thumbnail (4:5) for the private knitted "Grace of Allah" reel (her Instagram, @heal.ingthroughquran):
// the knitted hay-bale wall coming down in the 3D plate, the farmer doll walking away safe with his radio inside a loop of the
// gold thread, and «لطف الله» / Grace of Allah in big letters. On the 9:16 cover the title and the doll sit inside the 4:5 and
// 1:1 grid crops (y 285-1635 and 420-1500); the 4:5 thumbnail is laid out on its own.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ARB, SERIF, Sprite, Thread, ThreadDefs, loop} from './LutfKnit';
import TX from './texts.json';

const T = 3.3;
export const LutfCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const top = grid ? 96 : 330;                // title block
  const fy = grid ? 1318 : 1630;              // the doll's feet (inside the 4:5 crop on the cover)
  const fh = grid ? 720 : 820;
  const fx = 700;
  return <AbsoluteFill style={{background: '#1C1020', overflow: 'hidden'}}>
    <ThreadDefs/>
    <Img src={staticFile('blender/f0138.jpg')} style={{position: 'absolute', left: 0, top: grid ? -300 : 0, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #160B1Fd0 0px, #160B1F99 ${top + 380}px, #160B1F00 ${top + 640}px)`}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 50% 30% at 70% 78%, #FFD27A55, #FFD27A00)', mixBlendMode: 'screen'}}/>
    <Sprite n="farmer4" x={fx} y={fy} h={fh} sh={0.9}/>
    <Thread t={T} b={1} w={10} pts={loop(fx, fy - fh * 0.47, 330, -110, 1.02, 1.3)}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: ARB, fontWeight: 700, fontSize: 200, lineHeight: 1.2, color: '#FFD46A',
        textShadow: '0 5px 0 #8A5A12, 0 10px 18px #000000cc, 0 0 40px #FFC84C77'}}>{TX.labelAr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 124, lineHeight: 1.0, marginTop: 4, color: '#FFF3DA',
        textShadow: '0 4px 6px #000000cc, 0 0 26px #FFC84C55'}}>{TX.labelEn}</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 26}}>
        <span style={{width: 70, borderTop: '3px dashed #E2B04F'}}/>
        <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: '#F6E3BC', textShadow: '0 2px 4px #000000cc'}}>@heal.ingthroughquran</span>
        <span style={{width: 70, borderTop: '3px dashed #E2B04F'}}/>
      </div>
    </div>
  </AbsoluteFill>;
};
