// Proof sheet (not part of the reel): every on-screen ayah from texts.json, large, black on white, in the reel's own font
// (Amiri Quran, plain build) and line breaks, so each mark can be checked against the mushaf by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './Magic';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: '30px 40px', fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 24}}>Ash-Shu&apos;ara 26:32-40, quran.com text_uthmani (= Tanzil quran-uthmani letters and harakat), Amiri Quran plain build</div>
  {TX.ayat.map((a) => <div key={a.key} style={{display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid #ddd'}}>
    <div style={{width: 80, fontSize: 24}}>{a.key}</div>
    <div dir="rtl" style={{flex: 1, textAlign: 'right'}}>
      {a.arLines.map((l, k) => <div key={k} style={{fontFamily: AR, fontSize: 64, lineHeight: 1.75}}>{l}{k === a.arLines.length - 1 ?
        <span style={{fontSize: 56, marginRight: 14}}>{a.end}</span> : null}</div>)}
    </div>
  </div>)}
</AbsoluteFill>;
