// PRIVATE (owner's other account; never posted from the business accounts): the Turkish dua reel (reference
// Dfp3lugAl-6, job 62dc5f187134, 40 s) rebuilt with pictures of the owner in dua inside an Ottoman mosque instead of
// the reference's turning dome. Same audio, same Arabic + Turkish lines at the same times (read off the reference at
// 4 fps). No branding, no handle, no call to action (owner: "don't add").
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {AR} from '../asmaknit/AsmaKnit';

export const FPS = 30, DURATION = 40;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const TR = '"Bodoni 72", "Didot", serif';

// [start, end, arabic, turkish]: timings measured on the reference (text appears/disappears)
export const LINES: [number, number, string, string][] = [
  [0.25, 3.0, 'يا الله يا مقتدر', 'Ey Muktedir olan Allah’ım,'],
  [3.25, 6.75, 'لا تتركني في هذه الدنيا الفانية من دونك يا رب.', 'Beni bu fani dünyada sensiz eyleme Ya Rabbi..'],
  [7.25, 8.5, 'أغثني', 'Medet eyle..'],
  [8.75, 10.25, 'وأعنّي', 'Rahmet eyle..'],
  [10.5, 12.25, 'وامددني بالعون يا رب.', 'Yardım eyle..'],
  [12.75, 19.25, 'ولا تجعلني من عبادك الذين\nيملأ الطمع في المناصب والمكانة قلوبهم.', 'Beni gönlünde makam mevki\nhırsı olan kullarından eyleme..'],
  [19.5, 22.0, 'أنا لا أنتظر الرحمة إلا منك،', 'Ben yalnız senden merhamet beklerim,'],
  [22.25, 24.25, 'ولا أخضع إلا لك.', 'yalnız sana boyun bükerim.'],
  [24.75, 29.25, 'يا الله، لا تجعلني أنشغل بجمال الدنيا وأنسى الآخرة.', 'Dünyayı güzel görüp ahireti unutturma Allah’ım.'],
  [30.75, 33.5, 'ولا تجعلني ممن ينكرون نعمك يا رب.', 'Beni nankör kullarından eyleme ya Rabbi.'],
  [34.25, 38.75, 'ولا تجعلني من الذين لا يشكرون نعمك يا رب.', 'Beni şükürsüz kullarından eyleme ya Rabbi.'],
];

// one picture per stretch of the dua, cut in the gaps between lines. y = centre of the text block for that shot,
// placed over architecture, never over the face. rot = degrees of slow turn across the shot (the reference turns).
export type Shot = {src: string; from: number; to: number; y: number; z0: number; z1: number; rot: number; ox: number; oy: number;
  l?: number; r?: number}; // l/r: text box edges in px (default 60..1020)
export const SHOTS: Shot[] = [
  {src: 'shots/s1-wide.jpg', from: 0, to: 7.0, y: 640, z0: 1.18, z1: 1.30, rot: 4, ox: 50, oy: 40},
  {src: 'shots/s2-hands.jpg', from: 7.0, to: 12.5, y: 340, z0: 1.06, z1: 1.16, rot: 0, ox: 50, oy: 30},
  {src: 'shots/s3-medium.jpg', from: 12.5, to: 19.4, y: 560, z0: 1.04, z1: 1.14, rot: 0, ox: 50, oy: 55},
  {src: 'shots/s4-face.jpg', from: 19.4, to: 24.5, y: 305, z0: 1.08, z1: 1.03, rot: 0, ox: 50, oy: 0},
  {src: 'shots/s5-back.jpg', from: 24.5, to: 30.0, y: 620, z0: 1.05, z1: 1.15, rot: 0, ox: 50, oy: 70},
  {src: 'shots/s6-top.jpg', from: 30.0, to: DURATION, y: 600, z0: 1.14, z1: 1.22, rot: -7, ox: 50, oy: 50},
];
const XF = 0.8; // cross-dissolve length

export const Motes: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 26}, (_, k) => {
  const life = 260 + random(`ml${k}`) * 200, ph = (f + random(`mp${k}`) * life) % life, u = ph / life;
  const gen = Math.floor((f + random(`mp${k}`) * life) / life);
  const x = 80 + random(`mx${k}-${gen}`) * 920 + Math.sin(u * 4 + k) * 26, y = 1750 - u * 1500, s = 2 + random(`ms${k}`) * 4;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7B0',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A66`, opacity: Math.sin(Math.PI * u) * (0.35 + 0.3 * Math.sin(f / 9 + k))}}/>;
})}</>;

export const Picture: React.FC<{s: Shot; t: number}> = ({s, t}) => {
  const a = interpolate(t, [s.from - XF / 2, s.from + XF / 2, s.to - XF / 2, s.to + XF / 2], [0, 1, 1, 0], clamp);
  if (a <= 0) return null;
  const u = Math.min(1, Math.max(0, (t - (s.from - XF / 2)) / (s.to - s.from + XF)));
  const z = s.z0 + (s.z1 - s.z0) * u, r = s.rot * (u - 0.5);
  return <AbsoluteFill style={{opacity: s.from === 0 ? 1 : a}}>
    <Img src={staticFile(s.src)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
      transform: `scale(${z}) rotate(${r}deg)`, transformOrigin: `${s.ox}% ${s.oy}%`}}/>
  </AbsoluteFill>;
};

const Line: React.FC<{t: number; l: [number, number, string, string]; s: Shot}> = ({t, l: [a, b, ar, tr], s}) => {
  const y = s.y, left = s.l ?? 60, right = s.r ?? 60;
  if (t < a - 0.05 || t > b + 0.3) return null;
  const inn = ease((t - a) / 0.45), out = interpolate(t, [b - 0.05, b + 0.25], [1, 0], clamp), o = inn * out;
  return <div style={{position: 'absolute', left, right, top: y, transform: `translateY(-50%) translateY(${(1 - inn) * 14}px)`,
    textAlign: 'center', opacity: o, filter: `blur(${(1 - inn) * 5}px)`}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 70, lineHeight: 1.5, color: '#FFFFFF', whiteSpace: 'pre-line',
      textShadow: '0 2px 4px #000000cc, 0 0 22px #000000aa'}}>{ar}</div>
    <div style={{fontFamily: TR, fontSize: 43, lineHeight: 1.3, marginTop: 10, color: '#F6EEDD', whiteSpace: 'pre-line',
      textShadow: '0 2px 4px #000000cc, 0 0 18px #000000aa'}}>{tr}</div>
  </div>;
};

export const Dua: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const fadeIn = interpolate(t, [0, 0.4], [1, 0], clamp), fadeOut = interpolate(t, [DURATION - 0.9, DURATION], [0, 1], clamp);
  return <AbsoluteFill style={{background: '#0B0704', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    {SHOTS.map((s, k) => <Picture key={k} s={s} t={t}/>)}
    {/* warm grade + vignette, and a soft dark band behind the lines so they read on bright domes */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 40%, #000000aa 100%)'}}/>
    <AbsoluteFill style={{background: '#2A1606', mixBlendMode: 'soft-light', opacity: 0.35}}/>
    <AbsoluteFill style={{background: `radial-gradient(ellipse ${shot.l ? 48 : 70}% 13% at ${shot.l ? ((shot.l + 1080 - (shot.r ?? 60)) / 2 / 10.8) : 50}% ${shot.y}px, #000000a0 0%, #00000000 100%)`}}/>
    <Motes f={f}/>
    {LINES.map((l, k) => <Line key={k} t={t} l={l} s={SHOTS.find((s) => l[0] >= s.from && l[0] < s.to) ?? shot}/>)}
    <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}}/>
  </AbsoluteFill>;
};
