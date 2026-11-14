// Proof sheet (not part of the reel): every on-screen Arabic and Urdu string from texts.json, large, in the reel's fonts with
// no yarn filter, so each mark can be checked against the source by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, UR} from './FussilatKnit';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: 40, fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 26}}>Quran 41:30, Tanzil quran-uthmani (= quran.com text_uthmani without tatweel), Amiri Quran plain build</div>
  {TX.arLines.map(([a, b], k) => <div key={k} dir="rtl" style={{fontFamily: AR, fontSize: 92, lineHeight: 1.9, textAlign: 'center'}}>
    {TX.arWords.slice(a, b).join(' ')}{k === 2 ? ' ۝٣٠' : ''}</div>)}
  <div style={{fontSize: 26, marginTop: 30}}>Urdu captions (Noto Nastaliq Urdu): Jalandhari as narrated, checked against Whisper</div>
  {TX.ur.map((p, k) => <div key={k} dir="rtl" style={{fontFamily: UR, fontSize: 54, lineHeight: 2.0, textAlign: 'center'}}>{p.join(' ')}</div>)}
  <div style={{fontSize: 24, marginTop: 20}}>English, Sahih International: {TX.en.join(' ')}</div>
</AbsoluteFill>;
