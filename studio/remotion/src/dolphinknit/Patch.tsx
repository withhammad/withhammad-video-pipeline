// The two embroidered patches the reference engraves on its dolphin, drawn flat on transparent canvases and textured onto the
// knitted dolphin's flanks in Blender (studio/blender/dolphinknit/build.py, ALLAH_BOX and KAABA_BOX keep these aspect ratios).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import TX from './texts.json';

export const AllahPatch: React.FC = () => <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
  <div dir="rtl" style={{fontFamily: 'AmiriQ', fontSize: 380, lineHeight: 1, marginTop: 40, color: '#FFE27A',
    WebkitTextStroke: '14px #5A3306', paintOrder: 'stroke fill'}}>{TX.patch}</div>
</AbsoluteFill>;

// a small Kaaba in two faces: black kiswah, a gold band with a running stitch pattern, a gold door
export const KaabaPatch: React.FC = () => {
  const band = (w: number) => <div style={{position: 'absolute', left: 0, top: 70, width: w, height: 44, background: '#E7B649',
    borderTop: '6px solid #8A5A12', borderBottom: '6px solid #8A5A12',
    backgroundImage: 'repeating-linear-gradient(90deg, #8A5A12 0 10px, #E7B649 10px 30px)', backgroundSize: '30px 8px',
    backgroundRepeat: 'repeat-x', backgroundPosition: '0 14px'}}/>;
  return <AbsoluteFill>
    <div style={{position: 'absolute', left: 60, top: 70, width: 420, height: 430, background: '#111014', border: '10px solid #5A3306',
      boxSizing: 'border-box'}}>
      {band(400)}
      <div style={{position: 'absolute', left: 250, top: 190, width: 90, height: 200, background: '#E7B649', border: '8px solid #8A5A12',
        boxSizing: 'border-box', borderRadius: '10px 10px 0 0'}}/>
    </div>
    <div style={{position: 'absolute', left: 470, top: 70, width: 230, height: 430, background: '#28262C', border: '10px solid #5A3306',
      boxSizing: 'border-box', transform: 'skewY(-14deg)', transformOrigin: '0 0'}}>
      {band(210)}
    </div>
  </AbsoluteFill>;
};
