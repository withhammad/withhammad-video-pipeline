// Cover for the Quran Beat "Khalid's letter" reel: the owner as the modern reader, awe on his face, in the reel's anime
// look with the two armies far behind him; the hook in two big lines with the punch word boxed, and the account name.
// Face, hook and name all sit inside the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and 9:16 views hold them.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SANS, SERIF} from './Khalid';

const SH = '0 4px 12px #000000e8, 0 0 30px #000000a0';
export const KhalidCover: React.FC = () => <AbsoluteFill style={{background: '#120b05', overflow: 'hidden'}}>
  <Img src={staticFile('cover/cv-face.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    filter: 'saturate(1.08) contrast(1.05)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 42%, #00000000 50%, #1a0f05a8 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 52%, #000000b0 62%, #000000d0 78%, #00000070 92%)'}}/>
  <div style={{position: 'absolute', left: 40, right: 40, top: 1135, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.08, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
      textShadow: SH}}>KHALID (RA) WROTE</div>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 16}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.08, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap',
        textShadow: SH}}>BEFORE THE</span>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 84, lineHeight: 1.0, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
        background: '#F4D58D', padding: '6px 22px 10px', borderRadius: 10}}>CHARGE</span>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1392, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '8px 28px 8px 8px', borderRadius: 40, background: '#00000080',
      border: '1.5px solid #FFFFFF50'}}>
      <Img src={staticFile('face-chip.jpg')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover', border: '2px solid #FFFFFFd0'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: '#FFFFFF'}}>QURAN BEAT</div>
    </div>
  </div>
</AbsoluteFill>;
