// Cover (9:16) and grid thumbnail (4:5) for the Quran Beat "Has harm touched you?" reel: the owner (the stylised-3D likeness
// of the reel) close up in bed, worried eyes up at the window, the broken heart floating above his head and the storm behind;
// the hook in two big lines with the punch word boxed, and the account name and handle. Face, heart, hook and name sit inside
// the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and 9:16 views hold them too. The thumbnail is the same frame, cut
// at y 285-1635.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GOLD, Heart, SANS, SERIF} from './Harm';

const SH = '0 4px 12px #000000e8, 0 0 30px #000000a0';
// s01 at 1.75x: his face (frame 287,1195 in the reel) lands at x 502, y 880
const Z = 1.75, TY = -1211;
export const HarmCover: React.FC = () => <AbsoluteFill style={{background: '#07090f', overflow: 'hidden'}}>
  <Img src={staticFile('shots/s01-sad.jpg')} style={{position: 'absolute', left: 0, top: TY, width: 1080 * Z, height: 1920 * Z, objectFit: 'cover',
    filter: 'saturate(1.06) contrast(1.06)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 40%, #00000000 52%, #05070ca0 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 56%, #000000a8 63%, #000000c8 76%, #00000070 92%)'}}/>
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: 'translate(240px, -380px) scale(1.5)', transformOrigin: '300px 940px'}}>
    <Heart f={0} still="broken"/>
  </div>
  <div style={{position: 'absolute', left: 30, right: 30, top: 1150, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 96, lineHeight: 1.06, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
      textShadow: SH}}>HAS HARM</div>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 16}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 96, lineHeight: 1.06, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
        textShadow: SH}}>TOUCHED</span>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 100, lineHeight: 1.0, letterSpacing: '0.04em', color: '#1A1007', whiteSpace: 'nowrap',
        background: GOLD, padding: '6px 26px 14px', borderRadius: 12, boxShadow: '0 6px 22px #000000b0'}}>YOU?</span>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1404, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '8px 28px 8px 8px', borderRadius: 40, background: '#00000080',
      border: '1.5px solid #FFFFFF50'}}>
      <Img src={staticFile('face-chip.jpg')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover', border: '2px solid #FFFFFFd0'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 1.5, color: '#FFFFFF'}}>QURAN BEAT</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, letterSpacing: 0.5, color: '#FFFFFFcc'}}>@quranbeat</div>
    </div>
  </div>
</AbsoluteFill>;

// 1080x1350 grid thumbnail: the cover's own frame, y 285-1635
export const HarmThumb: React.FC = () => <AbsoluteFill style={{background: '#07090f', overflow: 'hidden'}}>
  <div style={{position: 'absolute', left: 0, top: -285, width: 1080, height: 1920}}><HarmCover/></div>
</AbsoluteFill>;
