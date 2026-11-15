// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Allah, Allah", the heart
// coming clean (reference Dfw7YNesQ1h by @madee.studio.pk, 10.0 s, job wife-Dfw7YNesQ1h) rebuilt in knitted yarn. Same audio,
// untouched, and the same flow on the reference clock: the Name glows over a heart whose left side is caked black; a drop of
// light falls on it (1.50 s), the black crumbles off in waves on the soundtrack's swells, doves and gold rings circle, rays fan
// out of the Name (6.2 s) and the clean heart flashes (7.0 s). The heart, the black wool, doves, rings and floor are the Blender
// plate (studio/blender/allahknit/build.py); here: the Name «ٱللَّهُ» in gold yarn (al-Ikhlas 112:2, word 1, texts.json from
// text.py), the gold thread and its drops of light, the rays, sparkles, the flash and her handle. The soundtrack is music, so no
// Quran ayah is shown over it (ar-Ra'd 13:28 is on the cover and in the caption only, as with the Grace of Allah reel).
import React from 'react';
import {AbsoluteFill, OffthreadVideo, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {Burst, Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import TX from './texts.json';
import GEOM from './geom.json';

export const FPS = 30, FRAMES = 300;
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const AR_THREAD = 'url(#yarnAr) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 8px 14px #00000099)';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
// the same clock as build.py
export const BEATS = [1.25, 2.5, 3.7, 6.15, 8.6];
export const T_DROP = 1.5, T_RAYS = 6.2, T_FLASH = 7.0;
const DROPS: [number, number][] = [[0.45, T_DROP], [2.95, 3.70], [5.40, 6.15]];   // [forms, lands]
export const NAME = {x: 540, y: 412, size: 280};
const TIP_Y = 548;                                                               // the bottom of the Name, where the drops form
const at = (k: 'top' | 'centre', f: number) => GEOM[k][Math.min(GEOM.frames - 1, Math.max(0, Math.round(f)))] as [number, number];

/** the Name in gold yarn, breathing with the soundtrack */
export const Name: React.FC<{t: number; size?: number; glow?: number}> = ({t, size = NAME.size, glow = 1}) => {
  const beat = BEATS.reduce((s, b) => s + pulse(t - b, 0.6), 0) + pulse(t - T_FLASH, 0.8) * 1.5;
  return <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: size, lineHeight: 1.25, ...gold(t, 0.3), WebkitTextStroke: `${size / 120}px #E7B040`,
    filter: `${AR_THREAD} drop-shadow(0 0 ${(14 + 22 * beat) * glow}px #FFC85A${Math.round(110 + 80 * c01(beat)).toString(16)})`, whiteSpace: 'nowrap'}}>{TX.name}</div>;
};

const Rays: React.FC<{t: number}> = ({t}) => {
  const o = ease((t - T_RAYS) / 0.9) * (0.75 + 0.25 * Math.sin(t * 3)) + 0.5 * pulse(t - T_FLASH, 0.9);
  if (o <= 0) return null;
  const n = 22, rot = (t - T_RAYS) * 4;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: o}}>
    <defs>
      <radialGradient id="rayfade" cx={NAME.x} cy={NAME.y} r={1100} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFE6A6" stopOpacity={0.85}/><stop offset="0.45" stopColor="#FFD27A" stopOpacity={0.25}/><stop offset="1" stopColor="#FFD27A" stopOpacity={0}/>
      </radialGradient>
    </defs>
    <g transform={`rotate(${rot} ${NAME.x} ${NAME.y})`} filter="url(#soft6)">
      {Array.from({length: n}, (_, k) => {
        const a = (k / n) * Math.PI * 2, w = 0.035 + 0.03 * random(`rw${k}`), L = 1300;
        const p = (b: number) => `${NAME.x + Math.cos(b) * L} ${NAME.y + Math.sin(b) * L}`;
        return <path key={k} d={`M ${NAME.x} ${NAME.y} L ${p(a - w)} L ${p(a + w)} Z`} fill="url(#rayfade)" opacity={0.55 + 0.45 * random(`ro${k}`)}/>;
      })}
    </g>
  </svg>;
};

/** a gold thread hangs from the Name; a drop of light swells at its tip, falls onto the heart and splashes */
const Drops: React.FC<{t: number; f: number}> = ({t, f}) => <>{DROPS.map(([t0, t1], k) => {
  const [hx, hy] = at('top', t1 * FPS);
  const fall = t1 - t0 - 0.38;
  let x = NAME.x, y = TIP_Y, r = 0;
  if (t < t0 - 0.05 || t > t1 + 1.6) return null;
  if (t < t0 + 0.38) { r = 17 * ease((t - t0) / 0.38); }
  else if (t < t1) { const u = (t - t0 - 0.38) / fall; y = TIP_Y + (hy - TIP_Y) * u * u; x = NAME.x + (hx - NAME.x) * u * u; r = 17; }
  return <React.Fragment key={k}>
    {t < t1 ? <>
      <div style={{position: 'absolute', left: x - 1.5, top: TIP_Y - 6, width: 3, height: Math.max(0, y - TIP_Y), borderRadius: 2,
        background: 'linear-gradient(180deg, #FFE7A8, #F2C04Eaa)', boxShadow: '0 0 8px #FFC85A', opacity: 0.85}}/>
      <div style={{position: 'absolute', left: x - r, top: y - r * 0.6, width: 2 * r, height: 2.6 * r, borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
        background: 'radial-gradient(circle at 40% 62%, #FFFFFF 0%, #FFF0B8 30%, #F7C552 70%, #C48A26 100%)',
        boxShadow: `0 0 ${2.2 * r}px ${0.8 * r}px #FFC85Acc, 0 0 ${6 * r}px #FFB84A88`}}/>
    </> : null}
    <Burst t={t} t0={t1} x={hx} y={hy} n={k === 0 ? 22 : 14} cols={['#FFE7A8', '#F7C552', '#FFF6DA', '#F2A6BC']} power={0.55} size={0.55} seed={`drop${k}`}/>
    {t >= t1 ? <div style={{position: 'absolute', left: hx - 160, top: hy - 160, width: 320, height: 320, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: 1 - c01((t - t1) / 0.8), transform: `scale(${0.4 + 0.9 * ease((t - t1) / 0.8)})`,
      background: 'radial-gradient(closest-side, #FFF2C8ee 0%, #FFD27A66 45%, #FFD27A00 100%)'}}/> : null}
  </React.Fragment>;
})}</>;

/** gold glitter orbiting the heart, on the rings' ellipses */
const Glitter: React.FC<{t: number; f: number}> = ({t, f}) => {
  const [cx, cy] = at('centre', f);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    {Array.from({length: 46}, (_, k) => {
      const ring = k % 2, R = ring ? 470 : 400, a = random(`ga${k}`) * 6.283 + t * (ring ? -0.5 : 0.65) * (0.8 + 0.4 * random(`gs${k}`));
      const x = cx + Math.cos(a) * R * (0.9 + 0.2 * random(`gr${k}`)), y = cy + (ring ? 120 : -110) + Math.sin(a) * R * 0.2;
      const tw = Math.pow(Math.abs(Math.sin(t * (2 + 3 * random(`gt${k}`)) + k)), 4), s = 1.4 + 2.2 * random(`gz${k}`);
      const o = (0.35 + 0.65 * tw) * c01(t / 0.5) * (Math.sin(a) > 0 ? 1 : 0.55);
      return <g key={k} opacity={o}>
        <path d={`M ${x - 7 * s} ${y} L ${x + 7 * s} ${y} M ${x} ${y - 7 * s} L ${x} ${y + 7 * s}`} stroke="#FFF1C9" strokeWidth={1.4} strokeLinecap="round"/>
        <circle cx={x} cy={y} r={1.8 * s} fill="#FFF6DA"/>
      </g>;
    })}
  </svg>;
};

export const AllahKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const [cx, cy] = at('centre', f);
  const flash = pulse(t - T_FLASH + 0.05, 0.9);
  const beat = BEATS.reduce((s, b) => s + pulse(t - b, 0.6), 0);
  return <AbsoluteFill style={{background: '#0A1E22', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <ArDefs/>
    <Filters/>
    <OffthreadVideo src={staticFile('plate.mp4')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {/* a night-teal veil over the top third so the Name reads; a soft vignette */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #06171Bdd 0%, #06171B99 18%, #06171B00 34%, #06171B00 70%, #06171B88 86%, #06171Bcc 100%)'}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 55%, #00000066 100%)'}}/>
    {/* the Name's halo */}
    <div style={{position: 'absolute', left: NAME.x - 330, top: NAME.y - 250, width: 660, height: 500, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: 0.55 + 0.2 * Math.sin(t * 1.7) + 0.25 * beat + 0.4 * ease((t - T_RAYS) / 1),
      background: 'radial-gradient(closest-side, #FFE09Acc 0%, #FFC85A44 50%, #FFC85A00 100%)'}}/>
    <Rays t={t}/>
    <Glitter t={t} f={f}/>
    <Drops t={t} f={f}/>
    {/* the flash of the clean heart */}
    {flash > 0 ? <div style={{position: 'absolute', left: cx - 520, top: cy - 520, width: 1040, height: 1040, borderRadius: '50%', mixBlendMode: 'screen', opacity: flash,
      background: 'radial-gradient(closest-side, #FFF3E8ee 0%, #FFB3B088 30%, #FFC85A33 60%, #FFC85A00 100%)'}}/> : null}
    <Burst t={t} t0={T_FLASH} x={cx} y={cy} n={30} cols={['#FFE7A8', '#F7C552', '#FFFFFF', '#F2A6BC', '#9C8CFF']} power={1.05} size={0.6} seed="flash"/>
    <div style={{position: 'absolute', top: NAME.y - NAME.size * 0.66, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{display: 'inline-block', transform: `scale(${1 + 0.035 * beat + 0.05 * pulse(t - T_FLASH, 0.8)})`}}><Name t={t}/></span>
    </div>
    <Handle top={226} endP={c01((t - 8.9) / 0.8)}/>
  </AbsoluteFill>;
};
