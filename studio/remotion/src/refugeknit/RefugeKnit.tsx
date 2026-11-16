// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Make prayer your refuge".
// The reference DepKWqLtlcH by @hous_semai2719 (14.3 s, an AI 3D clip) rebuilt in knitted yarn with 2D MOTION GRAPHICS ONLY (no
// Blender, owner rule). Same flow on the reference's own clock, same soundtrack (untouched: a wordless melodic bed with footstep
// foley; no Quran and no words in it, nothing laid over it):
//   0.00-5.73  STREET: a tired knitted doll trudges down a night street, a red one-bar battery blinking over his head; the
//              mosque doorway at the end of the street glows and sends gold motes his way
//   5.73-9.00  DOOR (the music turns at 5.73): a stitched seam opens on the mosque entrance, he climbs the steps and walks into the light
//   9.00-11.46 INSIDE: a gold bloom, the calm knitted prayer hall; he sits on his prayer mat, goes down into sujood and sits up
//              again while the battery fills bar by bar and turns green
//  11.46-14.33 OUT (the music turns again at 11.46): back at the doorway, he walks out upright and smiling, battery full
// Every part is knitwork: GPT Image 2 plates and doll sprites (gen.sh), keyed by prep.py. One generic doll with a simple
// embroidered face; no prophet, no named person. Arabic is set in Amiri Quran and never goes through the yarn displacement
// filter (text.py checks every line: the creator's caption, our closing line, and Quran 2:45 / 1:1 for the caption or the
// QURAN_ON_SCREEN variant).
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {AR_PUFF, ArDefs} from '../lanternknit/LanternKnit';
import SPR from './sprites.json';
import TX from './texts.json';

// No Quran text on screen while the music plays (as in her earlier knitted reels): 2:45 and the hadith go in the caption.
export const QURAN_ON_SCREEN = false;
export const FPS = 30, FRAMES = 430;             // 14.33 s (the reference: 14.27 s video, 14.33 s audio)
export const SANS = 'KnitSans, sans-serif', SERIF = 'KnitSerif, serif', AR = 'AmiriQ, "Amiri Quran", serif';
const SP = SPR as unknown as Record<string, [number, number]>;

// ---- helpers -----------------------------------------------------------------------------------------------------------------
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- the clock (s): the reference's cuts and the two turns in its music (5.73, 11.46) -------------------------------------------
export const T = {door: 5.73, climb: 6.0, enter: 8.15, flood: 8.75, inside: 9.15, sujood: 9.75, sitUp: 10.85, out: 11.46, end: 14.333};
const BAR0 = 9.45, BAR_DT = 0.3;                 // the battery fills: one bar every 0.3 s from 9.45 s (full at 10.65 s)
export const bars = (t: number) => (t < BAR0 ? 1 : Math.min(5, 1 + Math.floor((t - BAR0) / BAR_DT) + 1));

// ---- stage geometry (1080 x 1920) --------------------------------------------------------------------------------------------
const STREET_GY = 1540;                          // the doll's feet on the cobbles
const DOOR_DY = 100;                             // the door plate is drawn 100 px lower (the captions sit in the sky above the lintel)
const LINTEL = {x: 548, y: 477 + DOOR_DY};        // centre of the blank felt band over the arch (prep: 165-930 x 384-570)
const DOORWAY = {x: 540, y: 1150 + DOOR_DY};     // the glowing doorway's centre
const SILL = 1505 + DOOR_DY;                     // the doorway threshold
const IN_GY = 1500;                              // the prayer mat on the carpet
const DOLL = 560;                                // the standing doll's drawn height on the street
// one scale for every doll pose (GPT Image 2 kept the doll the same size across the image-to-image poses: head ~150 px in each)
const K = DOLL / (SP.doll_tired?.[1] ?? 1229);
const H: Record<string, number> = {mat: 150};
for (const n of ['doll_tired', 'doll_tired2', 'doll_calm', 'doll_calm2', 'doll_sit', 'doll_sujood']) H[n] = (SP[n]?.[1] ?? 1000) * K;

/** a sprite: (x, y) is the bottom centre, h the drawn height */
const Sprite: React.FC<{n: string; x: number; y: number; h?: number; o?: number; filter?: string; style?: React.CSSProperties}> =
  ({n, x, y, h = H[n], o = 1, filter, style}) => {
  const [w0, h0] = SP[n] ?? [1, 1];
  const w = (h * w0) / h0;
  if (o <= 0.001) return null;
  return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o,
    filter: filter ?? 'drop-shadow(0 10px 8px #00000088)', ...style}}/>;
};
const spriteW = (n: string, h = H[n]) => { const [w0, h0] = SP[n] ?? [1, 1]; return (h * w0) / h0; };

/** the knitted battery: a cream wool case with a stitched outline and five yarn bars; red with one blinking bar -> green, full */
const Battery: React.FC<{x: number; y: number; t: number; s?: number; full?: boolean}> = ({x, y, t, s = 1, full}) => {
  const n = full ? 5 : bars(t);
  const g = full ? 1 : c01((n - 1) / 4);
  const col = n >= 5 ? '#6CCB5F' : n >= 3 ? '#E9B53F' : '#E5483A';
  const blink = n === 1 ? 0.35 + 0.65 * (Math.sin(t * 9) > -0.2 ? 1 : 0) : 1;
  const W = 150, Hh = 70;
  const pop = (k: number) => { const t0 = BAR0 + (k - 1) * BAR_DT; return full || k === 1 ? 1 : 1 + 0.35 * Math.max(0, 1 - Math.abs(t - t0 - 0.06) / 0.12); };
  return <svg width={W + 40} height={Hh + 40} viewBox={`-20 -20 ${W + 40} ${Hh + 40}`}
    style={{position: 'absolute', left: x - (W / 2 + 20) * s, top: y - (Hh / 2 + 20) * s, width: (W + 40) * s, height: (Hh + 40) * s, overflow: 'visible',
      filter: `drop-shadow(0 4px 3px #00000099) drop-shadow(0 0 ${8 + 18 * g}px ${col}88)`}}>
    <rect x={0} y={0} width={W - 14} height={Hh} rx={16} fill="#F3E9D6" stroke="#3B2E22" strokeWidth={5}/>
    <rect x={5} y={5} width={W - 24} height={Hh - 10} rx={12} fill="none" stroke="#C9B48E" strokeWidth={2.5} strokeDasharray="7 5"/>
    <rect x={W - 12} y={Hh / 2 - 13} width={12} height={26} rx={4} fill="#F3E9D6" stroke="#3B2E22" strokeWidth={4}/>
    {[1, 2, 3, 4, 5].map((k) => {
      const on = k <= n, bx = 12 + (k - 1) * 23.6, sc = pop(k);
      return <g key={k} transform={`translate(${bx + 9} ${Hh / 2}) scale(${sc})`} opacity={on ? (k === 1 ? blink : 1) : 0.12}>
        <rect x={-9} y={-Hh / 2 + 13} width={18} height={Hh - 26} rx={5} fill={on ? col : '#9C8C74'}/>
        {/* knit "v" stitches down each bar */}
        {[0, 1, 2].map((r) => <path key={r} d={`M -6 ${-12 + r * 10} L 0 ${-6 + r * 10} L 6 ${-12 + r * 10}`} stroke="#FFFFFF66" strokeWidth={2} fill="none"/>)}
      </g>;
    })}
  </svg>;
};

/** gold sparkles bursting from a point at t0 (each new battery bar) */
const Burst: React.FC<{t: number; t0: number; x: number; y: number; seed: string; n?: number; col?: string}> = ({t, t0, x, y, seed, n = 12, col = '#FFE08A'}) => {
  const d = t - t0;
  if (d < 0 || d > 0.7) return null;
  return <>{Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2 + random(`${seed}a${k}`) * 0.5, v = 90 + 120 * random(`${seed}v${k}`);
    const px = x + Math.cos(a) * v * ease(d / 0.7), py = y + Math.sin(a) * v * ease(d / 0.7) + 40 * d * d;
    const s = 5 + 6 * random(`${seed}s${k}`), o = 1 - d / 0.7;
    return <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
      background: `radial-gradient(closest-side, #FFFBE8, ${col} 55%, ${col}00)`}}/>;
  })}</>;
};

/** slow wool fluff over the whole scene, two depths for parallax */
const Fluff: React.FC<{t: number; tint: string; n?: number; depth?: number; seed?: string}> = ({t, tint, n = 22, depth = 1, seed = 'f'}) => <>{Array.from({length: n}, (_, k) => {
  const x = ((random(`${seed}x${depth}${k}`) * 1180 + t * depth * (8 + 12 * random(`${seed}s${k}`))) % 1180) - 50;
  const y = ((random(`${seed}y${depth}${k}`) * 1900 - t * depth * (10 + 10 * random(`${seed}v${k}`))) % 1900 + 1900) % 1900 + 10;
  const s = (3 + 6 * random(`${seed}z${depth}${k}`)) * depth;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', opacity: 0.25 + 0.4 * random(`${seed}o${k}`),
    background: `radial-gradient(closest-side, ${tint}, ${tint}00)`}}/>;
})}</>;

/** gold motes drifting from (x0, y0) toward (x1, y1): the doorway calling him */
const Call: React.FC<{t: number; x0: number; y0: number; x1: number; y1: number; o: number; n?: number}> = ({t, x0, y0, x1, y1, o, n = 26}) => {
  if (o <= 0) return null;
  return <>{Array.from({length: n}, (_, k) => {
    const life = 2.6 + 1.4 * random(`cl${k}`), ph = random(`cp${k}`) * life;
    const a = ((t + ph) % life) / life;
    const px = lerp(x0, x1, a) + 40 * Math.sin(a * 7 + k) + 30 * (random(`cx${k}`) - 0.5);
    const py = lerp(y0, y1, a) + 60 * Math.sin(a * 3.3 + k * 1.3) - 80 * Math.sin(Math.PI * a);
    const s = 5 + 7 * random(`cs${k}`);
    return <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%',
      opacity: o * Math.sin(Math.PI * a), background: 'radial-gradient(closest-side, #FFF4C8, #F2C04E 55%, #F2C04E00)'}}/>;
  })}</>;
};

/** a stitched zigzag seam that sweeps left to right; the new scene is on its left */
const Seam: React.FC<{t: number; u: number}> = ({t, u}) => {
  if (u <= 0 || u >= 1) return null;
  const x = 1080 * u;
  const pts: string[] = [];
  for (let k = 0; k <= 64; k++) pts.push(`${(x + (k % 2 ? 14 : -14)).toFixed(1)} ${k * 30}`);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <polyline points={pts.join(' ')} stroke="#3A2A12" strokeWidth={10} fill="none"/>
    <polyline points={pts.join(' ')} stroke="#F2C04E" strokeWidth={5} fill="none" style={{filter: 'drop-shadow(0 0 10px #FFC84C)'}}/>
    <rect x={x - 4} y={0} width={8} height={1920} fill="#FFF4C8" opacity={0.3 + 0.2 * Math.sin(t * 30)}/>
  </svg>;
};

/** the walk: two stride sprites swapped on the footstep rhythm (stop-motion), a little bob on each step */
const STEP = 0.36;
const stride = (t: number, a: string, b: string) => (Math.floor(t / STEP) % 2 ? b : a);
const bob = (t: number, amp: number) => amp * Math.abs(Math.sin((Math.PI * t) / STEP));

// ---- STREET ------------------------------------------------------------------------------------------------------------------
const Street: React.FC<{t: number}> = ({t}) => {
  const pan = -110 * inout(t / 6.2);            // the camera tracks him: the plate drifts left, he gains slowly on it
  const x = lerp(300, 470, t / 6.2);
  const n = stride(t, 'doll_tired', 'doll_tired2');
  const y = STREET_GY - bob(t, 6);
  const glow = 0.55 + 0.25 * c01(t / 5) + 0.12 * Math.sin(t * 2.4);
  const dx = 910 + pan * 1.0, dy = 1100;         // the mosque doorway on the plate
  return <AbsoluteFill>
    <Img src={staticFile('plates/street.jpg')} style={{position: 'absolute', left: -60 + pan, top: 60, width: 1080 * 1.12, height: 1920 * 1.12 * 0.97}}/>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0A1230 0px, #0A123000 260px)'}}/>
    {/* the doorway's warm glow, breathing */}
    <div style={{position: 'absolute', left: dx - 230, top: dy - 230, width: 460, height: 460, borderRadius: '50%', opacity: glow, mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFD27Acc, #FFB24A44 50%, #FFB24A00)'}}/>
    {/* cold blue night over him, the warm side clean */}
    <AbsoluteFill style={{background: 'linear-gradient(90deg, #0B1B4A66 0%, #0B1B4A33 55%, #0B1B4A00 80%)'}}/>
    <Fluff t={t} tint="#C8D4F0" n={16} depth={0.6} seed="sn"/>
    <Call t={t} x0={dx - 40} y0={dy} x1={x + 80} y1={y - DOLL * 0.75} o={c01((t - 1.0) / 1.0)}/>
    {/* his long shadow on the cobbles */}
    <div style={{position: 'absolute', left: x - 170, top: y - 22, width: 340, height: 44, borderRadius: '50%', background: 'radial-gradient(closest-side, #000000aa, #00000000)'}}/>
    <Sprite n={n} x={x} y={y} filter="drop-shadow(0 10px 8px #00000088) brightness(0.88) saturate(0.85)"/>
    <Battery x={x + spriteW(n) * 0.08} y={y - H[n] - 58} t={t} s={0.95}/>
    <Fluff t={t} tint="#E8EEFF" n={8} depth={1.5} seed="sf"/>
  </AbsoluteFill>;
};

// ---- DOOR (in and out) -----------------------------------------------------------------------------------------------------------
const Basmala: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  if (!QURAN_ON_SCREEN) return null;
  const u = ease((t - t0) / 1.4);
  return <div dir="rtl" lang="ar" style={{position: 'absolute', left: LINTEL.x - 360, width: 720, top: LINTEL.y - 66, textAlign: 'center',
    fontFamily: AR, fontSize: 74, lineHeight: 1.6, color: '#6B3E17', filter: 'url(#yarnAr) drop-shadow(0 2px 1px #FFF6E688) drop-shadow(0 0 10px #F2C04E66)',
    clipPath: `inset(-40% 0 -40% ${(100 - 100 * u).toFixed(2)}%)`}}>{TX.basmala}</div>;
};
const DoorPlate: React.FC<{t: number; push: number; light: number}> = ({t, push, light}) => <AbsoluteFill style={{transformOrigin: `${DOORWAY.x}px ${DOORWAY.y}px`, transform: `scale(${push})`}}>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #0B1330 0px, #142046 260px)'}}/>
  <Img src={staticFile('plates/door.jpg')} style={{position: 'absolute', left: 0, top: DOOR_DY, width: 1080, height: 1920}}/>
  <AbsoluteFill style={{background: `linear-gradient(180deg, #0B1330 0px, #0B1330 ${DOOR_DY}px, #0B133000 ${DOOR_DY + 120}px)`}}/>
  {/* the doorway glow and knitted light strands */}
  <div style={{position: 'absolute', left: DOORWAY.x - 330, top: DOORWAY.y - 420, width: 660, height: 840, borderRadius: '50%', mixBlendMode: 'screen',
    opacity: light * (0.85 + 0.15 * Math.sin(t * 3.1)), background: 'radial-gradient(closest-side, #FFE6A8dd, #FFC85A55 55%, #FFC85A00)'}}/>
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: light * 0.8}}>
    {[-150, -90, -30, 30, 90, 150].map((dx, k) => <line key={k} x1={DOORWAY.x + dx * 0.5} y1={DOORWAY.y - 120} x2={DOORWAY.x + dx * 2.6} y2={1920}
      stroke="#FFE7A6" strokeWidth={3} strokeDasharray="12 9" opacity={0.25 + 0.15 * Math.sin(t * 2 + k)}/>)}
  </svg>
</AbsoluteFill>;
const DoorIn: React.FC<{t: number}> = ({t}) => {
  const d = t - T.door;
  const push = 1 + 0.06 * inout(d / 3.3);
  // he walks in from the left and climbs to the sill (getting smaller as he goes deeper), then into the light
  const u = c01((t - T.climb) / (T.enter - T.climb));
  const x = lerp(140, DOORWAY.x - 20, u);
  const y = lerp(1905, SILL, ease(u));
  const sc = lerp(1.0, 0.72, u);
  const go = c01((t - T.enter) / 0.55);
  const n = stride(t, 'doll_tired', 'doll_tired2');
  const light = 0.6 + 0.4 * c01((t - T.enter + 0.6) / 0.9);
  return <AbsoluteFill>
    <DoorPlate t={t} push={push} light={light}/>
    <AbsoluteFill style={{transformOrigin: `${DOORWAY.x}px ${DOORWAY.y}px`, transform: `scale(${push})`}}>
      <Basmala t={t} t0={T.door + 0.35}/>
      <Sprite n={n} x={x + 30 * go} y={y - bob(t, 5) * (1 - go) - 20 * go} h={H[n] * sc * (1 - 0.25 * go)} o={1 - go}
        filter={`drop-shadow(0 10px 8px #00000088) brightness(${(0.95 + 0.6 * go).toFixed(2)}) blur(${(4 * go).toFixed(1)}px)`}/>
      <Battery x={x + 30 * go + spriteW(n, H[n] * sc) * 0.08} y={y - H[n] * sc - 58 * sc} t={t} s={0.95 * sc * (1 - go)}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={12} depth={1.2} seed="df"/>
  </AbsoluteFill>;
};
const DoorOut: React.FC<{t: number}> = ({t}) => {
  const d = t - T.out;
  const push = 1.06 - 0.06 * inout(d / 2.8);
  // he comes out of the light at the sill and walks down and to the right, upright and calm
  const u = c01((d - 0.15) / 2.7);
  const x = lerp(DOORWAY.x, 830, u);
  const y = lerp(SILL, 1830, ease(u));
  const sc = lerp(0.74, 0.98, u);
  const born = c01((d - 0.05) / 0.45);
  const n = stride(t, 'doll_calm', 'doll_calm2');
  return <AbsoluteFill>
    <DoorPlate t={t} push={push} light={1}/>
    <AbsoluteFill style={{transformOrigin: `${DOORWAY.x}px ${DOORWAY.y}px`, transform: `scale(${push})`}}>
      <Basmala t={t} t0={-10}/>
      <div style={{position: 'absolute', left: x - 220, top: y - 26, width: 440, height: 52, borderRadius: '50%', background: 'radial-gradient(closest-side, #00000077, #00000000)'}}/>
      <Sprite n={n} x={x} y={y - bob(t, 7)} h={H[n] * sc} o={born}
        filter={`drop-shadow(0 10px 8px #00000088) drop-shadow(0 0 ${(26 * (1 - 0.5 * u)).toFixed(0)}px #FFD27A99) brightness(${(1.25 - 0.2 * u).toFixed(2)})`}/>
      <Battery x={x - spriteW(n, H[n] * sc) * 0.07} y={y - H[n] * sc - 58 * sc} t={t} s={0.95 * sc} full/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={16} depth={1.3} seed="of"/>
  </AbsoluteFill>;
};

// ---- INSIDE ------------------------------------------------------------------------------------------------------------------
const Inside: React.FC<{t: number}> = ({t}) => {
  const d = t - T.inside;
  const push = 1.02 + 0.07 * inout(d / 2.6);
  const mx = 560;
  const xs = c01((t - T.sujood) / 0.3), xu = c01((t - T.sitUp) / 0.3);
  const sitW = 1 - xs + xu, sujW = xs * (1 - xu);
  const glow = 'drop-shadow(0 10px 8px #00000066) drop-shadow(0 0 18px #FFD27A88)';
  const by = lerp(IN_GY - H.doll_sit - 60, IN_GY - H.doll_sujood - 60, sujW);
  const bx = lerp(mx - 20, mx + 10 + spriteW('doll_sujood') * 0.2, sujW);
  return <AbsoluteFill>
    <AbsoluteFill style={{transformOrigin: `${mx}px ${IN_GY}px`, transform: `scale(${push})`}}>
      <Img src={staticFile('plates/inside.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}/>
      {/* soft light pouring from the dome onto the mat */}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
        <defs><linearGradient id="rkbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9B0" stopOpacity={0.5}/>
          <stop offset="1" stopColor="#FFE9B0" stopOpacity={0.08}/></linearGradient><filter id="rkblur"><feGaussianBlur stdDeviation={22}/></filter></defs>
        <polygon points={`${mx - 120},0 ${mx + 120},0 ${mx + 300},${IN_GY + 40} ${mx - 300},${IN_GY + 40}`} fill="url(#rkbeam)" filter="url(#rkblur)"
          opacity={0.7 + 0.15 * Math.sin(t * 2.2)}/>
      </svg>
      {[[272, 520], [810, 520], [355, 690], [740, 690]].map(([lx, ly], k) => <div key={k} style={{position: 'absolute', left: lx - 90, top: ly - 90, width: 180, height: 180,
        borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.5 + 0.25 * Math.sin(t * (3 + k) + k), background: 'radial-gradient(closest-side, #FFD27A99, #FFD27A00)'}}/>)}
      <Sprite n="mat" x={mx} y={IN_GY + 45} h={H.mat} filter="drop-shadow(0 6px 6px #00000066)"/>
      <Sprite n="doll_sit" x={mx - 20} y={IN_GY} o={sitW} filter={glow}/>
      <Sprite n="doll_sujood" x={mx + 10} y={IN_GY + 4} o={sujW} filter={glow}/>
      <Battery x={bx} y={by} t={t} s={0.9}/>
      {[2, 3, 4, 5].map((k) => <Burst key={k} t={t} t0={BAR0 + (k - 1) * BAR_DT} x={bx - 50 + (k - 1) * 22} y={by} seed={`b${k}`} col={k >= 5 ? '#B9F59B' : '#FFE08A'}/>)}
      <Motes t={t} x={mx} y={IN_GY}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={14} depth={1.2} seed="if"/>
  </AbsoluteFill>;
};
const Motes: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const d = t - T.inside;
  if (d < 0) return null;
  return <>{Array.from({length: 40}, (_, k) => {
    const life = 1.8 + random(`ml${k}`) * 1.4, t0 = random(`mt${k}`) * 1.2;
    if (d < t0) return null;
    const a = ((d - t0) % life + life) % life;
    const px = x + (random(`mx${k}`) - 0.5) * 520 + 14 * Math.sin(a * 3 + k);
    const py = y - a * 160 * (0.6 + 0.6 * random(`mv${k}`));
    const s = 4 + 7 * random(`ms${k}`), o = Math.sin(Math.PI * a / life) * c01(d / 0.4);
    return <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
      background: 'radial-gradient(closest-side, #FFFBE8, #FFD36A 55%, #FFD36A00)'}}/>;
  })}</>;
};

/** the gold bloom from the doorway that carries him inside */
const Flood: React.FC<{t: number}> = ({t}) => {
  const up = ease((t - T.flood) / 0.35), down = c01((t - T.inside) / 0.45);
  const o = up * (1 - down);
  if (o <= 0) return null;
  const r = 200 + 1700 * up;
  return <div style={{position: 'absolute', left: DOORWAY.x - r, top: DOORWAY.y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', opacity: o,
    background: 'radial-gradient(closest-side, #FFF3D6, #FFDF99 55%, #F7C46Aee 80%, #F7C46A00)'}}/>;
};

// ---- captions (top, in the sky / over a soft dark bed) -------------------------------------------------------------------------
const rich = (s: string) => {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]|\{([^}]+)\}|([^[{]+)/g;
  let m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m[1]) parts.push(<span key={k++} style={{color: '#F7C556', textDecoration: 'underline', textDecorationThickness: 5, textUnderlineOffset: 10,
      textDecorationStyle: 'dashed'}}>{m[1]}</span>);
    else if (m[2]) parts.push(<span key={k++} style={{color: '#F08A6E'}}>{m[2]}</span>);
    else parts.push(<span key={k++}>{m[3]}</span>);
  }
  return parts;
};
/** [in, out] for: the hook, the second half of the caption, Quran 2:45 */
export const CAP: [number, number][] = [[0, 5.6], [5.85, 9.0], [9.3, 14.333]];
const CapLine: React.FC<{t: number; i: number; ar: string; en: string; refText?: string}> = ({t, i, ar, en, refText}) => {
  const [a, b] = CAP[i];
  const o = i === 0 ? 1 - c01((t - (b - 0.22)) / 0.22) : Math.min(c01((t - a) / 0.2), 1 - c01((t - (b - 0.2)) / 0.2) * (b < T.end ? 1 : 0));
  if (o <= 0) return null;
  const u = i === 0 ? 1 : ease((t - a) / 0.6);
  return <div style={{position: 'absolute', top: 226, left: i === 2 ? 24 : 50, right: i === 2 ? 24 : 50, textAlign: 'center', opacity: o}}>
    <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 70, lineHeight: 1.75, color: '#F2C04E', filter: AR_PUFF,
      clipPath: `inset(-40% 0 -40% ${(100 - 100 * u).toFixed(2)}%)`}}>{ar}</div>
    <div style={{fontFamily: SANS, fontSize: i === 2 ? (QURAN_ON_SCREEN ? 49 : 60) : 56, lineHeight: 1.16, color: '#F7EFE3', marginTop: 22, whiteSpace: i === 2 ? 'nowrap' : undefined, filter: 'url(#yarnSoft) drop-shadow(0 4px 4px #000000cc)',
      clipPath: `inset(-40% ${(100 - 100 * u).toFixed(2)}% -40% 0)`, transform: `translateY(${(8 * (1 - u)).toFixed(1)}px)`}}>{rich(en)}</div>
    {refText ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, color: '#FFE7A6', marginTop: 10, opacity: c01((t - a - 0.6) / 0.4),
      textShadow: '0 2px 3px #000000, 0 0 14px #000000cc, 0 0 28px #000000aa'}}>{refText}</div> : null}
  </div>;
};
const SoftDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>
  <filter id="yarnSoft" x="-5%" y="-30%" width="110%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves={2} seed={11} result="fib"/>
    <feDisplacementMap in="SourceGraphic" in2="fib" scale={2.2} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>;

// ---- the scene at time t -----------------------------------------------------------------------------------------------------
export const Scene: React.FC<{t: number}> = ({t}) => {
  const s1 = ease((t - T.door) / 0.5), s2 = ease((t - T.out) / 0.5);
  return <AbsoluteFill>
    {s1 < 1 && <Street t={t}/>}
    {s1 > 0 && t < T.inside + 0.5 && <AbsoluteFill style={{clipPath: `inset(0 ${(100 - 100 * s1).toFixed(2)}% 0 0)`}}><DoorIn t={t}/></AbsoluteFill>}
    {t >= T.inside - 0.05 && s2 < 1 && <Inside t={t}/>}
    {s2 > 0 && <AbsoluteFill style={{clipPath: `inset(0 ${(100 - 100 * s2).toFixed(2)}% 0 0)`}}><DoorOut t={t}/></AbsoluteFill>}
    <Seam t={t} u={s1}/>
    <Seam t={t} u={s2}/>
    <Flood t={t}/>
  </AbsoluteFill>;
};

export const Captions: React.FC<{t: number}> = ({t}) => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #08060Add 0px, #08060Aaa 540px, #08060A00 760px)', opacity: 0.55 + 0.45 * c01((t - T.inside + 0.2) / 0.4)}}/>
  <CapLine t={t} i={0} ar={TX.hook[0].ar} en={TX.hook[0].en}/>
  <CapLine t={t} i={1} ar={TX.hook[1].ar} en={TX.hook[1].en}/>
  {QURAN_ON_SCREEN ? <CapLine t={t} i={2} ar={TX.quranAr} en={'And seek help through [patience] and [prayer].'} refText={TX.quranRef}/>
    : <CapLine t={t} i={2} ar={TX.restAr} en={TX.restEn}/>}
</>;

export const RefugeKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return <AbsoluteFill style={{background: '#0B1330', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/><ArDefs/><SoftDefs/>
    <Scene t={t}/>
    <Captions t={t}/>
    {/* a soft vignette */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #00000000 55%, #00000066 100%)'}}/>
  </AbsoluteFill>;
};
