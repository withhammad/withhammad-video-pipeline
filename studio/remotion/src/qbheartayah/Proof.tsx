// Proof sheet (not part of the reel): both on-screen ayat from texts.json, large, black on white, in the reel's own font
// (Amiri Quran, plain build), so each mark can be checked against the mushaf by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './Heart';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: '30px 40px', fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 24}}>Al-Hijr 15:97-98, quran.com text_uthmani (= Tanzil quran-uthmani letters and harakat), Amiri Quran plain build</div>
  {TX.ayat.map((a) => <div key={a.key} style={{display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #ddd'}}>
    <div style={{width: 80, fontSize: 24}}>{a.key}</div>
    <div dir="rtl" style={{flex: 1, textAlign: 'right', fontFamily: AR, fontSize: 84, lineHeight: 2.0}}>{a.ar}<span style={{fontSize: 72, marginRight: 14}}>{a.end}</span></div>
  </div>)}
</AbsoluteFill>;
