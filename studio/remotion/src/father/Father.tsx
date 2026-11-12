// PRIVATE (owner's father, never posted from our accounts): "Aye mere walid-e-mohtaram" (reference subhanairam, DfpEw1KRPgF,
// 60.5 s) on satin and roses, with the father's own photos in an ornate gold frame, light rays, gold dust, shimmering lines and a
// closing dua from his son. Line starts measured from the reference. Job c9319a467ed6.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, DURATION = 60.5;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const UR = 'Nastaliq, serif';
const LINES: [number, string][] = [
  [0.2, 'پھول خوشبو دھنک کہکشاں کے لیے'], [6.67, 'کتنی نظمیں لکھی ہم نے ماں کے لیے'], [12.6, 'اب بھلا کیا لکھا جائے گا آپ پر'],
  [18.37, 'کوئی لکھ نہ سکا آج تک باپ پر'], [24.2, 'میں ہی کیسے اٹھاؤں قلم'], [31.03, 'اے میرے والدِ محترم'], [37.03, 'اے میرے والدِ محترم'],
  [42.77, 'تیرا سایہ ہے جیسے حرم'], [49.3, 'اے میرے والدِ محترم'], [55.23, 'اے میرے والدِ محترم'],
];
const PHOTOS: [string, number, string][] = [['father.jpg', 0, '50% 35%'], ['father3.jpg', 20.5, '60% 20%'], ['father2.jpg', 40.5, '50% 30%']];
const END = 54.6;   // the closing dua replaces the bottom line from here

// gold text with a light sweep running across it
const gold = (t: number, speed = 0.35): React.CSSProperties => {
  const p = ((t * speed) % 1) * 300 - 100;
  return {backgroundImage: `linear-gradient(100deg, #8A5A12 0%, #C9952F ${p - 30}%, #FFF3C4 ${p}%, #C9952F ${p + 30}%, #8A5A12 100%)`,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 2px 2px #5A3A0A55) drop-shadow(0 0 10px #FFF8EC)'};
};

const Petal: React.FC<{k: number; f: number}> = ({k, f}) => {
  const life = 260 + random(`pl${k}`) * 160, ph = (f + random(`pp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`pp${k}`) * life) / life);
  const x0 = random(`px${k}-${gen}`) * 1080, x = x0 + Math.sin(u * 6 + k) * 70, y = -80 + u * 2080, s = 34 + random(`ps${k}`) * 26;
  return <div style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.8, borderRadius: '60% 40% 55% 45%',
    background: 'radial-gradient(circle at 35% 35%, #D8323F, #8E0F1B 70%)', opacity: 0.85 * Math.min(1, 6 * u) * Math.min(1, 6 * (1 - u)),
    transform: `rotate(${u * 540 + k * 40}deg) rotateX(${Math.sin(u * 9 + k) * 60}deg)`, boxShadow: '0 4px 6px #5A0A1233'}}/>;
};

const Dust: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 40}, (_, k) => {
  const life = 200 + random(`dl${k}`) * 160, ph = (f + random(`dp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`dp${k}`) * life) / life);
  const x = 540 + (random(`dx${k}-${gen}`) - 0.5) * 900, y = 1500 - u * 900 - random(`dy${k}-${gen}`) * 200, s = 4 + random(`ds${k}`) * 7;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE9A8',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6D57A99`, opacity: Math.sin(Math.PI * u) * (0.5 + 0.5 * Math.sin(f / 6 + k))}}/>;
})}</>;

const Rays: React.FC<{t: number; o: number}> = ({t, o}) => <div style={{position: 'absolute', left: 540 - 700, top: 1385 - 700, width: 1400, height: 1400, opacity: o,
  background: 'repeating-conic-gradient(from 0deg, #FFF3C455 0deg 6deg, #FFF3C400 6deg 18deg)', borderRadius: '50%',
  maskImage: 'radial-gradient(closest-side, #000 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(closest-side, #000 20%, transparent 75%)',
  transform: `rotate(${t * 4}deg)`}}/>;

export const Father: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = LINES.reduce((k, [s], j) => (t >= s ? j : k), -1);
  const write = ease(interpolate(t, [0.5, 3.0], [0, 1], clamp));
  const frameIn = ease(interpolate(t, [1.2, 3.0], [0, 1], clamp));
  const glow = 0.5 + 0.5 * Math.sin(t * 1.4);
  const endIn = ease(interpolate(t, [END, END + 1.2], [0, 1], clamp));
  const fade = Math.max(1 - ease(interpolate(t, [0, 1.0], [0, 1], clamp)), interpolate(t, [DURATION - 0.9, DURATION], [0, 1], clamp));
  return <AbsoluteFill style={{background: '#F3ECE2', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${1.06 - 0.06 * t / DURATION}) translateY(${-10 * t / DURATION}px)`}}/>
    {/* warm light sweeping across the satin */}
    <div style={{position: 'absolute', left: -800 + ((t * 70) % 2600), top: -200, width: 500, height: 2400, transform: 'rotate(18deg)',
      background: 'linear-gradient(90deg, #FFF6E000, #FFF6E040, #FFF6E000)'}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 60%, #00000000 55%, #3A180A40 100%)'}}/>
    {/* the nazm line, deep rose with a soft halo, rising in */}
    {i >= 0 ? (() => {
      const [s, text] = LINES[i], next = i + 1 < LINES.length ? LINES[i + 1][0] : DURATION + 1;
      const o = Math.min(ease(interpolate(t, [s, s + 0.7], [0, 1], clamp)), interpolate(t, [next - 0.75, next - 0.1], [1, 0], clamp));
      const refrain = text.includes('والدِ محترم');
      return <div dir="rtl" style={{position: 'absolute', top: 630, left: 30, right: 30, textAlign: 'center', fontFamily: UR, fontWeight: 700,
        fontSize: refrain ? 74 : 62, lineHeight: 1.9, opacity: o, transform: `translateY(${(1 - o) * 22}px) scale(${0.94 + 0.06 * o})`,
        ...(refrain ? gold(t) : {color: '#7A0E19', textShadow: '0 0 16px #FFF8F0, 0 0 5px #FFF8F0'})}}>{text}</div>;
    })() : null}
    {/* والدِ محترم written in, in shimmering gold */}
    <div dir="rtl" style={{position: 'absolute', top: 745, left: 0, right: 0, textAlign: 'center', fontFamily: UR, fontWeight: 700, fontSize: 158, lineHeight: 1.7,
      clipPath: `inset(0 0 0 ${100 - write * 100}%)`, ...gold(t, 0.22)}}>والدِ محترم</div>
    <Rays t={t} o={0.55 * frameIn}/>
    {/* the father's photos in an ornate gold oval frame, crossfading */}
    <div style={{position: 'absolute', left: 540 - 270, top: 1065, width: 540, height: 640, opacity: frameIn,
      transform: `scale(${0.9 + 0.1 * frameIn + 0.012 * Math.sin(t * 1.1)})`}}>
      <div style={{position: 'absolute', inset: -40, borderRadius: '50%', background: 'repeating-conic-gradient(from 0deg, #C9952F 0deg 4deg, #F6DE8F 4deg 8deg)',
        boxShadow: `0 24px 50px #5A3A1A66, 0 0 ${40 + 40 * glow}px #F6DE8Faa`}}/>
      <div style={{position: 'absolute', inset: -28, borderRadius: '50%', background: `conic-gradient(from ${t * 40}deg, #B8892E, #FFF1B8, #A87A24, #F3D57E, #B8892E)`}}/>
      <div style={{position: 'absolute', inset: -10, borderRadius: '50%', background: '#FFF8EC'}}/>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', background: '#EFE3D2'}}>
        {PHOTOS.map(([src, s, pos], k) => {
          const e = k + 1 < PHOTOS.length ? PHOTOS[k + 1][1] : DURATION + 2;
          const o = Math.min(interpolate(t, [s - 0.8, s + 0.8], [0, 1], clamp), interpolate(t, [e - 0.8, e + 0.8], [1, 0], clamp));
          const z = 1.04 + 0.1 * Math.max(0, Math.min(1, (t - s) / (e - s)));
          return o > 0 ? <Img key={src} src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: pos, transform: `scale(${s === 0 ? Math.max(z, 1.04) : z})`, opacity: s === 0 ? Math.min(1, o + (t < 1 ? 1 : 0)) : o}}/> : null;
        })}
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 70px 22px #FFF8EC'}}/>
      </div>
    </div>
    <Dust f={f}/>
    {/* bottom line, then the son's dua at the end */}
    <div dir="rtl" style={{position: 'absolute', top: 1735, left: 40, right: 40, textAlign: 'center', fontFamily: UR, fontWeight: 700, fontSize: 36, lineHeight: 1.9, color: '#2A1E18',
      opacity: ease(interpolate(t, [3.0, 4.2], [0, 1], clamp)) * (1 - endIn), textShadow: '0 0 10px #FFF8F0, 0 0 4px #FFF8F0'}}>
      والد وہ ہستی ہیں جو اپنی خواہشیں قربان کر کے<br/>اولاد کے خواب پورے کرتے ہیں۔</div>
    <div dir="rtl" style={{position: 'absolute', top: 1700, left: 60, right: 60, padding: '6px 20px 14px', borderRadius: 30, textAlign: 'center', fontFamily: UR,
      fontWeight: 700, lineHeight: 1.8, background: '#FFF8EEe6', boxShadow: '0 10px 30px #5A3A1A33', border: '3px solid #D9B25A',
      opacity: endIn, transform: `translateY(${(1 - endIn) * 30}px)`}}>
      <div style={{fontSize: 44, color: '#7A0E19'}}>اللہ آپ کا سایہ ہمیشہ ہم پر سلامت رکھے</div>
      <div style={{fontSize: 34, color: '#6A4A12'}}>آپ کا بیٹا، حماد</div>
    </div>
    {Array.from({length: 10}, (_, k) => <Petal key={k} k={k} f={f}/>)}
    <AbsoluteFill style={{background: '#1E1410', opacity: fade}}/>
  </AbsoluteFill>;
};
