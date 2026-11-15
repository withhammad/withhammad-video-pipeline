// Cover (9:16) and grid thumbnail (4:5) for the Quran Beat "Pharaoh called it magic" reel: the owner as the modern viewer,
// shock on his face, the serpent rearing in Pharaoh's torchlit hall behind him (no prophet anywhere); the hook in two big
// lines with the punch word boxed, and the account name. Face, hook and name sit inside the 1:1 grid crop (y 420-1500), so
// the 4:5 (y 285-1635) and 9:16 views hold them too. The thumbnail is the same frame, cut at y 285-1635.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {GOLD, SANS, SERIF} from './Magic';

const SH = '0 4px 12px #000000e8, 0 0 30px #000000a0';
export const MagicCover: React.FC = () => <AbsoluteFill style={{background: '#120b05', overflow: 'hidden'}}>
  <Img src={staticFile('cover/cv-face.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'translateY(20px) scale(1.06)', transformOrigin: '50% 30%', filter: 'saturate(1.06) contrast(1.06)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 40%, #00000000 50%, #120a04a8 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 52%, #000000b0 61%, #000000d0 76%, #00000070 92%)'}}/>
  <div style={{position: 'absolute', left: 30, right: 30, top: 1128, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 92, lineHeight: 1.06, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
      textShadow: SH}}>PHARAOH CALLED IT</div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 18}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 112, lineHeight: 1.0, letterSpacing: '0.05em', color: '#1A1007', whiteSpace: 'nowrap',
        background: GOLD, padding: '8px 34px 14px', borderRadius: 12, boxShadow: '0 6px 22px #000000b0'}}>MAGIC</span>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1404, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '8px 28px 8px 8px', borderRadius: 40, background: '#00000080',
      border: '1.5px solid #FFFFFF50'}}>
      <Img src={staticFile('face-chip.jpg')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover', border: '2px solid #FFFFFFd0'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: '#FFFFFF'}}>QURAN BEAT</div>
    </div>
  </div>
</AbsoluteFill>;

// 1080x1350 grid thumbnail: the cover's own frame, y 285-1635
export const MagicThumb: React.FC = () => <AbsoluteFill style={{background: '#120b05', overflow: 'hidden'}}>
  <div style={{position: 'absolute', left: 0, top: -285, width: 1080, height: 1920}}><MagicCover/></div>
</AbsoluteFill>;
