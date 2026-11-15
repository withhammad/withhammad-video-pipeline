// Proof sheet (not part of the reel): every on-screen Arabic string from texts.json, large, in the reel's font with no yarn filter,
// plus the caption's Quran 42:19 in Amiri for a visual check. No Quran text is drawn in the reel itself.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ARB} from './LutfKnit';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: 40, fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 26}}>On-screen label (from the reference caption), Amiri Bold</div>
  <div dir="rtl" style={{fontFamily: ARB, fontWeight: 700, fontSize: 120, lineHeight: 1.6, textAlign: 'center'}}>{TX.labelAr}</div>
  <div style={{fontSize: 26}}>On-screen line (the reference caption's first sentence, verbatim), Amiri Bold</div>
  <div dir="rtl" style={{fontFamily: ARB, fontWeight: 700, fontSize: 84, lineHeight: 1.7, textAlign: 'center'}}>{TX.lineAr}</div>
  <div style={{fontSize: 26}}>Caption only: {TX.ayahRef} (quran.com text_uthmani = Tanzil quran-uthmani)</div>
  <div dir="rtl" style={{fontFamily: 'Amiri, serif', fontSize: 62, lineHeight: 2.0, textAlign: 'center'}}>{TX.ayahAr}</div>
  <div style={{fontSize: 24}}>{TX.ayahEn}</div>
</AbsoluteFill>;
