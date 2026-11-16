// Cover (9:16) and grid thumbnail (4:5) for the Quran Beat "Heart and ayah" reel: the owner top-down in bed at
// night, a tear, the broken heart on his chest lit by the phone; the hook in two big lines with the punch words boxed,
// and the account chip. Face, hook and name sit inside the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and
// 9:16 views hold them too. The thumbnail is the same frame, cut at y 285-1635.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GOLD, SANS, SERIF} from './Heart';

const SH = '0 4px 12px #000000e8, 0 0 30px #000000a0';
export const HeartCover: React.FC = () => <AbsoluteFill style={{background: '#06080d', overflow: 'hidden'}}>
  <Img src={staticFile('cover/cv-face2.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'translateY(-20px) scale(1.0)', transformOrigin: '50% 30%', filter: 'saturate(1.05) contrast(1.05)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 40%, #00000000 50%, #05070ca8 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 56%, #000000a0 70%, #000000d0 80%, #00000080 92%)'}}/>
  <div style={{position: 'absolute', left: 30, right: 30, top: 1290, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.06, letterSpacing: '0.02em', color: '#FFF8EC', whiteSpace: 'nowrap',
      textShadow: SH}}>HEART BROKEN?</div>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 12}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.0, letterSpacing: '0.02em', color: '#FFF8EC', whiteSpace: 'nowrap',
        textShadow: SH}}>LISTEN TO</span>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, lineHeight: 1.0, letterSpacing: "0.03em", color: '#2A0A0A', whiteSpace: 'nowrap',
        background: GOLD, padding: '4px 24px 10px', borderRadius: 12, boxShadow: '0 6px 22px #000000b0'}}>THIS AYAH</span>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1462, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '5px 24px 5px 5px', borderRadius: 40, background: '#00000080',
      border: '1.5px solid #FFFFFF50'}}>
      <Img src={staticFile('face-chip.jpg')} style={{width: 50, height: 50, borderRadius: 25, objectFit: 'cover', border: '2px solid #FFFFFFd0'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 1.5, color: '#FFFFFF'}}>QURAN BEAT · @quranbeat</div>
    </div>
  </div>
</AbsoluteFill>;

// 1080x1350 grid thumbnail: the cover's own frame, y 285-1635
export const HeartThumb: React.FC = () => <AbsoluteFill style={{background: '#06080d', overflow: 'hidden'}}>
  <div style={{position: 'absolute', left: 0, top: -285, width: 1080, height: 1920}}><HeartCover/></div>
</AbsoluteFill>;
