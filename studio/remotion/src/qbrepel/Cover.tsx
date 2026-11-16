// Cover (9:16) and grid thumbnail (4:5) for the Quran Beat "Repel evil with good" reel: the owner (the cartoon of his face,
// the kind neighbour of the reel) holding the gift basket at the grumpy neighbour's door, smiling into the camera, the old
// man peeking out astonished behind him; the hook in two big lines with the punch word boxed, and the account name and
// handle. Face, hook and name sit inside the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and 9:16 views hold them
// too. The thumbnail is the same frame, cut at y 285-1635.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GOLD, SANS, SERIF} from './Repel';

const SH = '0 4px 12px #000000e8, 0 0 30px #000000a0';
export const RepelCover: React.FC = () => <AbsoluteFill style={{background: '#160d06', overflow: 'hidden'}}>
  <Img src={staticFile('cover/cv-face.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'translateY(30px) scale(1.06)', transformOrigin: '50% 30%', filter: 'saturate(1.06) contrast(1.05)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 40%, #00000000 52%, #1a0e06a0 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 54%, #000000a8 62%, #000000c8 76%, #00000070 92%)'}}/>
  <div style={{position: 'absolute', left: 30, right: 30, top: 1140, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.06, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
      textShadow: SH}}>HE THREW TRASH</div>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 18}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.06, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
        textShadow: SH}}>I SENT</span>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 104, lineHeight: 1.0, letterSpacing: '0.05em', color: '#1A1007', whiteSpace: 'nowrap',
        background: GOLD, padding: '8px 30px 14px', borderRadius: 12, boxShadow: '0 6px 22px #000000b0'}}>A GIFT</span>
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
export const RepelThumb: React.FC = () => <AbsoluteFill style={{background: '#160d06', overflow: 'hidden'}}>
  <div style={{position: 'absolute', left: 0, top: -285, width: 1080, height: 1920}}><RepelCover/></div>
</AbsoluteFill>;
