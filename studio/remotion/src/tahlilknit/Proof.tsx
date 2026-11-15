// Proof sheet (not part of the reel): every Arabic string of the reel, large and plain, in the reel's font (Amiri Quran), to check each mark by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './TahlilKnit';
import TX from './texts.json';

const KEYS = ['line1', 'line2', 'line3', 'reward', 'taqabbal', 'dua_ask'] as const;
export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFFFF', padding: 30}}>
  {KEYS.map((k) => <div key={k} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ccc', height: 420}}>
    <span style={{fontFamily: 'sans-serif', fontSize: 30, color: '#555'}}>{k}</span>
    <span dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: k === 'reward' ? 92 : 118, lineHeight: 2, color: '#000'}}>{TX[k]}</span>
  </div>)}
</AbsoluteFill>;
