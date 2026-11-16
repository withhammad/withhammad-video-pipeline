// Proof sheet (not part of the reel): every on-screen phrase from texts.json, large, black on white, in the reel's own font
// (Amiri Quran, plain build), so each mark can be checked against the mushaf by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, WaqfText} from './Repel';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: '30px 40px', fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 24}}>Fussilat 41:34-35, quran.com text_uthmani (= Tanzil quran-uthmani letters and harakat), Amiri Quran plain build</div>
  {TX.phrases.map((a) => <div key={a.id} style={{display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #ddd'}}>
    <div style={{width: 120, fontSize: 24}}>{a.key} {a.id}</div>
    <div dir="rtl" style={{flex: 1, textAlign: 'right', fontFamily: AR, fontSize: 72, lineHeight: 1.75}}><WaqfText ar={a.ar}/>{a.last ?
      <span style={{fontSize: 64, marginRight: 14}}>{TX.ayat[String(a.n) as '34' | '35'].end}</span> : null}</div>
  </div>)}
</AbsoluteFill>;
