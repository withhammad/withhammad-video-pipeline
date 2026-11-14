// Cover for the Quran Beat "Great history" reel: the owner as the modern viewer, awe on his face, in the reel's black-and-
// white film look; the hook in two big lines with the punch word boxed, and the account name. Face, hook and name all sit
// inside the 1:1 grid crop (y 420-1500), so the 4:5 (y 285-1635) and 9:16 views hold them too.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {SANS, SERIF} from './History';

export const HistoryCover: React.FC = () => <AbsoluteFill style={{background: '#050505', overflow: 'hidden'}}>
  <Img src={staticFile('cover/cv-face.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transform: 'translateY(-170px) scale(1.12)', transformOrigin: '50% 40%', filter: 'grayscale(1) contrast(1.1)'}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 42%, #00000000 45%, #000000b0 100%)'}}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 50%, #000000c8 66%, #000000d8 80%, #00000060 92%)'}}/>
  <div style={{position: 'absolute', left: 50, right: 50, top: 1035, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 96, lineHeight: 1.08, letterSpacing: '0.03em', color: '#F5F2EA', whiteSpace: 'nowrap',
      textShadow: '0 4px 12px #000000e0'}}>QURAN STORIES</div>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 16}}>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 86, lineHeight: 1.08, letterSpacing: '0.03em', color: '#F5F2EA', whiteSpace: 'nowrap',
        textShadow: '0 4px 12px #000000e0'}}>THAT GIVE</span>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 86, lineHeight: 1.0, letterSpacing: '0.03em', color: '#0B0B0B', whiteSpace: 'nowrap',
        background: '#F5F2EA', padding: '6px 22px 10px', borderRadius: 10}}>CHILLS</span>
    </div>
  </div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1372, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '8px 28px 8px 8px', borderRadius: 40, background: '#00000080',
      border: '1.5px solid #FFFFFF50'}}>
      <Img src={staticFile('face-chip.jpg')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover', border: '2px solid #FFFFFFd0'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: '#FFFFFF'}}>QURAN BEAT</div>
    </div>
  </div>
</AbsoluteFill>;
