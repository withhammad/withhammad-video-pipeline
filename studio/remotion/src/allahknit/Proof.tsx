// Proof sheet (not part of the reel): every on-screen Arabic string from texts.json, large, in the reel's font with no yarn filter,
// so each mark can be checked against the source by eye.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR} from './AllahKnit';
import TX from './texts.json';

export const Proof: React.FC = () => <AbsoluteFill style={{background: '#FFFDF6', color: '#111', padding: 40, fontFamily: 'Helvetica'}}>
  <div style={{fontSize: 26}}>quran.com text_uthmani = tanzil.net Uthmani (code point for code point), Amiri Quran plain build</div>
  <div style={{fontSize: 24, marginTop: 20}}>{TX.name_src}</div>
  <div dir="rtl" style={{fontFamily: AR, fontSize: 220, lineHeight: 1.6, textAlign: 'center'}}>{TX.name}</div>
  <div style={{fontSize: 24}}>{TX.ayah_ref}, last clause (after the waqf sign)</div>
  <div dir="rtl" style={{fontFamily: AR, fontSize: 110, lineHeight: 2.0, textAlign: 'center'}}>{TX.ayah}</div>
  <div style={{fontSize: 24}}>Full ayah: </div>
  <div dir="rtl" style={{fontFamily: AR, fontSize: 64, lineHeight: 2.0, textAlign: 'center'}}>{TX.ayah_full}</div>
  <div style={{fontSize: 24, marginTop: 10}}>{TX.en_src}: {TX.en_full}</div>
</AbsoluteFill>;
