// Proof sheet: every Arabic string of the reel, large and plain in the reel's font (Amiri Bold), to check each mark by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './TasbihKnit';
import * as T from './text';

const ROWS: [string, string][] = [
  ...Object.entries(T).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string] as [string, string]),
  ...T.MSGS.map(([c, ar]) => [`MSG${c}`, ar] as [string, string]),
];
export const PROOF_H = ROWS.length * 150 + 80;
export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFFFF', padding: 40}}>
  {ROWS.map(([k, v]) => <div key={k} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #ccc',
    height: 150, gap: 30}}>
    <span style={{fontFamily: 'sans-serif', fontSize: 26, color: '#555', flexShrink: 0}}>{k}</span>
    <span dir="rtl" style={{fontFamily: AR, fontSize: v.length > 60 ? 46 : 74, lineHeight: 1.9, color: '#000', textAlign: 'right'}}>{v}</span>
  </div>)}
</AbsoluteFill>;
