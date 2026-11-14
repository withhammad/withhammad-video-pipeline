// Proof sheet (not part of the reel): every on-screen Arabic and Urdu string from texts.json, large, in the reel's fonts with
// no yarn filter, so each mark can be checked against the source by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, UR} from './HayyuKnit';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: 40, fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 26}}>Arabic (Amiri Quran plain build), from sunnah.com Tirmidhi 3524 (ى→ي per Quran 2:255 imla'i)</div>
  <div dir="rtl" style={{fontFamily: AR, fontSize: 150, lineHeight: 1.75, textAlign: 'center'}}>{TX.dua1}</div>
  <div dir="rtl" style={{fontFamily: AR, fontSize: 150, lineHeight: 1.75, textAlign: 'center'}}>{TX.dua2}</div>
  <div style={{fontSize: 26, marginTop: 60}}>Urdu (Noto Nastaliq Urdu), the reference's line, checked against Whisper</div>
  {[...TX.ur, TX.ameen].map((s, k) => <div key={k} dir="rtl" style={{fontFamily: UR, fontSize: 70, lineHeight: 2.1, textAlign: 'center'}}>{s}</div>)}
</AbsoluteFill>;
