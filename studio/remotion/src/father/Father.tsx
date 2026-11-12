// PRIVATE (owner's father, never posted from our accounts): "Aye mere walid-e-mohtaram" (reference subhanairam, DfpEw1KRPgF,
// 60.5 s) on satin and roses, with the father's own photos in a gold oval frame. Line starts measured from the reference. Job c9319a467ed6.
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

const Petal: React.FC<{k: number; f: number}> = ({k, f}) => {
  const life = 260 + random(`pl${k}`) * 160, ph = (f + random(`pp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`pp${k}`) * life) / life);
  const x0 = random(`px${k}-${gen}`) * 1080, x = x0 + Math.sin(u * 6 + k) * 60, y = -80 + u * 2080, s = 34 + random(`ps${k}`) * 26;
  return <div style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.8, borderRadius: '60% 40% 55% 45%',
    background: 'radial-gradient(circle at 35% 35%, #D8323F, #8E0F1B 70%)', opacity: 0.85 * Math.min(1, 6 * u) * Math.min(1, 6 * (1 - u)),
    transform: `rotate(${u * 540 + k * 40}deg) rotateX(${Math.sin(u * 9 + k) * 60}deg)`, boxShadow: '0 4px 6px #5A0A1233'}}/>;
};

export const Father: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const i = LINES.reduce((k, [s], j) => (t >= s ? j : k), -1);
  const write = ease(interpolate(t, [0.6, 3.2], [0, 1], clamp));
  const frameIn = ease(interpolate(t, [1.4, 3.0], [0, 1], clamp));
  const swap = interpolate(t, [29.5, 31.0], [0, 1], clamp);            // second photo from the "aye mere walid-e-mohtaram" refrain
  const glow = 0.5 + 0.5 * Math.sin(t * 1.4);
  const fade = Math.max(1 - ease(interpolate(t, [0, 0.8], [0, 1], clamp)), interpolate(t, [DURATION - 1, DURATION], [0, 1], clamp));
  return <AbsoluteFill style={{background: '#F3ECE2'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${1.04 - 0.04 * t / DURATION})`}}/>
    {/* the nazm line */}
    {i >= 0 ? (() => {
      const [s, text] = LINES[i], next = i + 1 < LINES.length ? LINES[i + 1][0] : DURATION + 1;
      const o = Math.min(ease(interpolate(t, [s, s + 0.6], [0, 1], clamp)), interpolate(t, [next - 0.75, next - 0.1], [1, 0], clamp));
      return <div dir="rtl" style={{position: 'absolute', top: 640, left: 40, right: 40, textAlign: 'center', fontFamily: UR, fontWeight: 700, fontSize: 64,
        lineHeight: 1.9, color: '#7A0E19', opacity: o, transform: `translateY(${(1 - o) * 14}px)`,
        textShadow: '0 0 14px #FFF8F0, 0 0 4px #FFF8F0'}}>{text}</div>;
    })() : null}
    {/* والدِ محترم written in from right to left */}
    <div dir="rtl" style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', fontFamily: UR, fontWeight: 700, fontSize: 150, lineHeight: 1.7,
      color: '#1C1412', clipPath: `inset(0 0 0 ${100 - write * 100}%)`, textShadow: '0 3px 6px #00000022'}}>والدِ <span style={{color: '#1C1412'}}>محترم</span></div>
    {/* the father's photos in a gold oval frame */}
    <div style={{position: 'absolute', left: 540 - 270, top: 1065, width: 540, height: 640, opacity: frameIn, transform: `scale(${0.92 + 0.08 * frameIn})`}}>
      <div style={{position: 'absolute', inset: -26, borderRadius: '50%', background: 'conic-gradient(from 0deg, #B8892E, #F6DE8F, #A87A24, #F3D57E, #B8892E)',
        boxShadow: `0 20px 40px #5A3A1A55, 0 0 ${30 + 30 * glow}px #F6DE8F88`}}/>
      <div style={{position: 'absolute', inset: -8, borderRadius: '50%', background: '#FFF8EC'}}/>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden'}}>
        <Img src={staticFile('father.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '40% 30%',
          transform: `scale(${1.05 + 0.08 * Math.min(1, t / 30)})`, opacity: 1 - swap}}/>
        <Img src={staticFile('father2.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%',
          transform: `scale(${1.04 + 0.08 * Math.max(0, (t - 30) / 30)})`, opacity: swap}}/>
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: 'inset 0 0 60px 20px #FFF8EC'}}/>
      </div>
    </div>
    <div dir="rtl" style={{position: 'absolute', top: 1735, left: 40, right: 40, textAlign: 'center', fontFamily: UR, fontWeight: 700, fontSize: 36, lineHeight: 1.9, color: '#2A1E18',
      opacity: ease(interpolate(t, [3.0, 4.2], [0, 1], clamp)), textShadow: '0 0 10px #FFF8F0, 0 0 4px #FFF8F0'}}>والد وہ ہستی ہیں جو اپنی خواہشیں قربان کر کے<br/>اولاد کے خواب پورے کرتے ہیں۔</div>
    {Array.from({length: 9}, (_, k) => <Petal key={k} k={k} f={f}/>)}
    <AbsoluteFill style={{background: '#1E1410', opacity: fade}}/>
  </AbsoluteFill>;
};
