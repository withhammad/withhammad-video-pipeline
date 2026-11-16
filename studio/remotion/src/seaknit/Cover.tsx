// Cover (9:16) and grid thumbnail (4:5) for the private knitted "The sea split in two" reel (her Instagram, @heal.ingthroughquran):
// the two knitted walls towering over the dry path, the felt fish on their faces and the light at the far end, with a two-line
// hook, the ayah's second half in Amiri Quran (no filter) and her handle. On the 9:16 cover the title sits inside the 4:5 and
// 1:1 grid crops (y 285-1635 and 420-1500); the 4:5 thumbnail is laid out on its own. No prophet, no figure: only the sea.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR, SERIF, SHADOW} from './SeaKnit';
import TX from './texts.json';

export const COVER_FRAME = 228;
export const SeaCover: React.FC<{grid?: boolean}> = ({grid = false}) => {
  const top = grid ? 92 : 452;
  return <AbsoluteFill style={{background: '#1A1030', overflow: 'hidden'}}>
    <Img src={staticFile(`blender/cover.jpg`)} style={{position: 'absolute', left: 0, top: grid ? -330 : 0, width: 1080, height: 1920}}/>
    <AbsoluteFill style={{background: `linear-gradient(180deg, #170C2E00 ${top - 120}px, #170C2Ec4 ${top + 40}px, #170C2Eaa ${top + 430}px, #170C2E00 ${top + 640}px)`}}/>
    <AbsoluteFill style={{mixBlendMode: 'screen', background: `radial-gradient(circle at 540px ${grid ? 1010 : 1340}px, #FFE6B0aa 0px, #FFC98A55 80px, #FFB07000 380px)`}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontSize: 132, lineHeight: 0.98, color: '#FFF6E6', textShadow: SHADOW}}>The sea</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 132, lineHeight: 1.0, color: '#FFD978',
        textShadow: `${SHADOW}, 0 0 34px #FFC24A88`}}>split in two</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 56, lineHeight: 1.9, marginTop: 10, color: '#FFF8EA', textShadow: SHADOW, padding: '0 40px'}}>{TX.ar2}</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 6}}>
        <span style={{width: 64, borderTop: '3px dashed #E9B755'}}/>
        <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: '#FFF1DA', textShadow: SHADOW}}>Quran 26:63 · @heal.ingthroughquran</span>
        <span style={{width: 64, borderTop: '3px dashed #E9B755'}}/>
      </div>
    </div>
  </AbsoluteFill>;
};

// big type proof of the on-screen Arabic, to zoom in on every mark
export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FBF6EC', padding: 40}}>
  {[TX.ar1, TX.ar2 + ' ' + TX.end].map((l, i) => <div key={i} dir="rtl" style={{fontFamily: AR, fontSize: 96, lineHeight: 2.0, color: '#1B1424', textAlign: 'center'}}>{l}</div>)}
  <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: '#4A3A30', textAlign: 'center', marginTop: 20}}>{TX.en}</div>
  <div style={{fontFamily: SERIF, fontSize: 26, color: '#7A6A5A', textAlign: 'center', marginTop: 12}}>quran.com text_uthmani (= Tanzil quran-uthmani letters and harakat) · Amiri Quran plain build · {TX.ref}</div>
</AbsoluteFill>;
