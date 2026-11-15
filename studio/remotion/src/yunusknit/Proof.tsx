// Proof sheet (not part of the reel): every on-screen Arabic string from texts.json, large, in the reel's font with no yarn filter,
// so each mark can be checked against the source by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './YunusKnit';
import TX from './texts.json';

const dig = (n: number) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: 40, fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 26}}>As-Saffat 37:139-146, quran.com text_uthmani = tanzil.net Uthmani (code point for code point), Amiri Quran plain build</div>
  {TX.ayat.map((a) => <div key={a} dir="rtl" style={{fontFamily: AR, fontSize: 84, lineHeight: 2.0, textAlign: 'center'}}>
    {TX.ar[String(a) as keyof typeof TX.ar]} {'۝' + dig(a)}</div>)}
  <div style={{fontSize: 24, marginTop: 10}}>Sahih International: {TX.ayat.map((a) => TX.en[String(a) as keyof typeof TX.en]).join(' ')}</div>
</AbsoluteFill>;
