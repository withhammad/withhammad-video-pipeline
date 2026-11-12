// Cover for the private Salawat video (her Instagram): knitted scene, the salawat, a ribbon hook and the bead strand,
// with every word inside the 3:4 profile-grid crop (y 240-1680) and the hook inside the 1:1 crop (y 420-1500).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const SERIF = 'KnitSerif, Georgia, serif', P = (n: string) => staticFile('parts/' + n + '.png');
const satin = (base: string, hi: string, lo: string): React.CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(115deg, ${hi} 0px, ${base} 1.4px, ${lo} 2.8px, ${base} 4.2px)`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 2px 0 #8C7650) drop-shadow(0 5px 8px #2F4A4466)'});
const wave = (x: number) => 880 + 70 * Math.cos(((x - 540) / 1080) * 2 * Math.PI);

export const SalawatCover: React.FC<{arabicFont: string}> = ({arabicFont}) => <AbsoluteFill style={{background: '#3C5F59'}}>
  <Img src={staticFile('scene.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
  <div style={{position: 'absolute', top: 395, left: 0, right: 0, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: arabicFont, fontWeight: 700, fontSize: 132, lineHeight: 1.3, ...satin('#FFF8EA', '#FFFFFF', '#E8D6B4')}}>صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ</div>
    <div style={{fontFamily: SERIF, fontSize: 60, marginTop: 2, ...satin('#FFF8EA', '#FFFFFF', '#E3D0AE')}}>Sallallahu ‘alayhi wa sallam</div>
  </div>
  <div style={{position: 'absolute', left: 60, top: 640, width: 960, height: 150}}>
    <Img src={P('ribbon')} style={{position: 'absolute', inset: 0, width: 960, height: 150, objectFit: 'fill', filter: 'drop-shadow(0 8px 8px #2F4A4466)'}}/>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 84, letterSpacing: 1,
      ...satin('#93404C', '#BE6672', '#6E2B35'), filter: 'drop-shadow(0 1px 0 #FFFFFFaa)'}}>20 × Salawat</div>
  </div>
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <polyline points={Array.from({length: 13}, (_, i) => { const x = -36 + i * 96; return `${x},${wave(x)}`; }).join(' ')} fill="none" stroke="#B89B6A" strokeWidth={5}/></svg>
  {Array.from({length: 13}, (_, i) => { const x = -36 + i * 96, y = wave(x), near = Math.max(0, 1 - Math.abs(x - 540) / 96), r = 34 * (1 + 0.4 * near);
    const coral = Math.abs(x - 540) < 50;
    return <Img key={i} src={P(coral ? 'bead_coral' : 'bead_teal')} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r,
      filter: `${coral ? '' : 'brightness(1.32) saturate(0.85) '}drop-shadow(0 5px 6px #1F3A3488)${coral ? ' drop-shadow(0 0 22px #FFD9A8)' : ''}`}}/>; })}
  <div style={{position: 'absolute', left: 0, right: 0, top: 812, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, ...satin('#F6D3D6', '#FFE9EA', '#E3B2B6')}}>one bead at a time</div>
</AbsoluteFill>;
