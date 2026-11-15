// Proof sheet: every Arabic string of the reel, large and plain, in the reel's font (Amiri Quran), to check each mark by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './FourKnit';
import TX from './texts.json';

const KEYS = ['sub', 'hamd', 'akbar', 'tahlil'] as const;
export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFFFF', padding: 40}}>
  {KEYS.map((k) => <div key={k} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ccc', height: 400}}>
    <span style={{fontFamily: 'sans-serif', fontSize: 34, color: '#555'}}>{k}</span>
    <span dir="rtl" style={{fontFamily: AR, fontSize: 170, lineHeight: 2, color: '#000'}}>{TX[k]}</span>
  </div>)}
</AbsoluteFill>;
