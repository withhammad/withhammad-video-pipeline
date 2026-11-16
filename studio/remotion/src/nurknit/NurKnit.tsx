// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Light upon light".
// The reference DfrckxNMKVN by @ruwaq.co (46.4 s, flat 2D vector animation of Ayat an-Nur) rebuilt in knitted yarn with 2D MOTION
// GRAPHICS ONLY (no Blender, owner rule). Same soundtrack, untouched: the recitation of the whole of an-Nur 24:35 (one reciter,
// long hall reverb, nothing laid over it). Every image of the ayah lands on its recited word (the word clock is Whisper's, see
// text.py), and the reference's theme, "light comes to you, and you can pass it on", closes it:
//    0.00- 3.02  SKY      a dark knitted night; a point of light opens at «نُورُ» and yarn rays light the heavens and the earth
//    3.02- 7.62  NICHE    a dark knitted wall with an empty niche (مِشْكَوٰة); the lamp appears in it on «مِصْبَاحٌ»
//    7.62-10.12  LAMP     push into the niche: the lamp in its glass, a highlight sweeps the glass on «زُجَاجَةٍ»
//   10.12-14.26  STAR     the glass turns pearly white and shines like a star (كَوْكَبٌ دُرِّىٌّ), rays wheel out
//   14.26-22.50  OLIVE    a stitch seam opens on the knitted olive tree; the olives glow gold on «مُّبَـٰرَكَةٍ», a drop of oil runs
//                         down; a warm light comes from the east (right) and fades, then from the west (left) and fades
//   22.50-28.46  OIL      the oil bowl in the dark glows by itself; a small flame comes near and never touches it
//   28.51-31.04  NUR      «نُّورٌ عَلَىٰ نُورٍ»: the lamp again, two rings of light stacked one on the other
//   31.04-34.46  ROOM     a dark knitted room: a beam from the window lights her lantern on «لِنُورِهِۦ»
//   34.46-38.88  PASS     she passes the flame to the man beside her, he turns and passes it to the child; each keeps theirs
//   38.88-46.40  ALL      pull out to the night hills: lanterns light up one by one and rise as stars; "Light comes to you.
//                         And you can pass it on."
// Every part is knitwork: GPT Image 2 plates and sprites (gen.sh), keyed by prep.py. Generic amigurumi dolls with simple
// embroidered faces; no prophet, no named person. The ayah is set in Amiri Quran and never goes through a displacement filter.
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import SPR from './sprites.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = 1392;            // 46.4 s (the reference: 46.41 s)
export const SANS = 'KnitSans, sans-serif', SERIF = 'KnitSerif, serif', AR = 'AmiriQ, "Amiri Quran", serif';
const SP = SPR as unknown as Record<string, [number, number]>;
type Card = {ar: string[]; mark: string; w: [number, number][]; t0: number; t1: number; en: string};
const CARDS = TX.cards as unknown as Card[];

// ---- helpers -----------------------------------------------------------------------------------------------------------------
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const win = (t: number, a: number, b: number, f = 0.4) => Math.min(c01((t - a) / f), 1 - c01((t - (b - f)) / f));
const W = (i: number, k: number) => CARDS[i].w[k][0];   // the start of word k of card i (s)

// ---- the clock (s), on the recited words ---------------------------------------------------------------------------------------
export const T = {
  nur: W(0, 1), niche: CARDS[1].t0, misbah: W(1, 4), lamp: CARDS[2].t0, zujaja: W(2, 2), star: CARDS[3].t0, kawkab: W(3, 2),
  olive: CARDS[4].t0, mubaraka: W(4, 3), east: W(5, 2), west: W(5, 4), oil: CARDS[6].t0, yudi: W(6, 2), nar: W(6, 6),
  nur2: CARDS[7].t0, nur3: W(7, 2), room: CARDS[8].t0, linurihi: W(8, 2), pass: 34.46, amthal: W(9, 2), nas: W(9, 3),
  all: CARDS[10].t0, end: CARDS[10].t1, fin: FRAMES / FPS,
};

/** a sprite: (x, y) is the bottom centre, h the drawn height */
const Sprite: React.FC<{n: string; x: number; y: number; h: number; o?: number; flip?: boolean; filter?: string}> = ({n, x, y, h, o = 1, flip, filter}) => {
  const [w0, h0] = SP[n] ?? [1, 1];
  const w = (h * w0) / h0;
  if (o <= 0.001) return null;
  return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o,
    transform: flip ? 'scaleX(-1)' : undefined, filter: filter ?? 'drop-shadow(0 10px 8px #00000088)'}}/>;
};
const sw = (n: string, h: number) => { const [w0, h0] = SP[n] ?? [1, 1]; return (h * w0) / h0; };

const Glow: React.FC<{x: number; y: number; r: number; o: number; c?: string; c2?: string}> = ({x, y, r, o, c = '#FFE6A8', c2 = '#FFB84A'}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', mixBlendMode: 'screen', opacity: Math.min(1, o),
    background: `radial-gradient(closest-side, ${c}ee, ${c2}66 45%, ${c2}00)`}}/>;

/** knitted light rays: dashed yarn strands and soft wedges wheeling slowly out of (x, y) */
const Rays: React.FC<{t: number; x: number; y: number; o: number; len?: number; n?: number; col?: string; spin?: number; seed?: string}> =
  ({t, x, y, o, len = 1400, n = 18, col = '#FFE7A6', spin = 4, seed = 'r'}) => {
  if (o <= 0) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: Math.min(1, o)}}>
    <defs><radialGradient id={`rg${seed}`} cx={x} cy={y} r={len} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={col} stopOpacity={0.55}/><stop offset="1" stopColor={col} stopOpacity={0}/></radialGradient>
      <filter id={`rb${seed}`}><feGaussianBlur stdDeviation={6}/></filter></defs>
    {Array.from({length: n}, (_, k) => {
      const a = (k / n) * Math.PI * 2 + (t * spin * Math.PI) / 180 + random(`${seed}${k}`) * 0.12;
      const l = len * (0.6 + 0.4 * random(`${seed}l${k}`)), wd = 0.035 + 0.03 * random(`${seed}w${k}`);
      const p = (d: number, aa: number) => `${(x + Math.cos(aa) * d).toFixed(1)},${(y + Math.sin(aa) * d).toFixed(1)}`;
      return <g key={k}>
        <polygon points={`${p(10, a - wd * 3)} ${p(l, a - wd)} ${p(l, a + wd)} ${p(10, a + wd * 3)}`} fill={`url(#rg${seed})`} filter={`url(#rb${seed})`}/>
        <line x1={x + Math.cos(a) * 30} y1={y + Math.sin(a) * 30} x2={x + Math.cos(a) * l * 0.8} y2={y + Math.sin(a) * l * 0.8} stroke={col}
          strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-t * 40} opacity={0.5}/>
      </g>;
    })}
  </svg>;
};

/** slow wool fluff over the scene */
const Fluff: React.FC<{t: number; tint: string; n?: number; depth?: number; seed?: string; o?: number}> = ({t, tint, n = 22, depth = 1, seed = 'f', o = 1}) => <>{Array.from({length: n}, (_, k) => {
  const x = ((random(`${seed}x${depth}${k}`) * 1180 + t * depth * (8 + 12 * random(`${seed}s${k}`))) % 1180) - 50;
  const y = ((random(`${seed}y${depth}${k}`) * 1900 - t * depth * (10 + 10 * random(`${seed}v${k}`))) % 1900 + 1900) % 1900 + 10;
  const s = (3 + 6 * random(`${seed}z${depth}${k}`)) * depth;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', opacity: o * (0.25 + 0.4 * random(`${seed}o${k}`)),
    background: `radial-gradient(closest-side, ${tint}, ${tint}00)`}}/>;
})}</>;

/** gold motes rising from a point */
const Motes: React.FC<{t: number; x: number; y: number; o: number; spread?: number; n?: number; seed?: string; rise?: number}> = ({t, x, y, o, spread = 300, n = 30, seed = 'm', rise = 220}) => {
  if (o <= 0) return null;
  return <>{Array.from({length: n}, (_, k) => {
    const life = 1.8 + random(`${seed}l${k}`) * 1.6, ph = random(`${seed}p${k}`) * life;
    const a = ((t + ph) % life) / life;
    const px = x + (random(`${seed}x${k}`) - 0.5) * spread + 16 * Math.sin(a * 5 + k);
    const py = y - a * rise * (0.6 + 0.7 * random(`${seed}v${k}`));
    const s = 4 + 7 * random(`${seed}s${k}`);
    return <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%', opacity: o * Math.sin(Math.PI * a),
      background: 'radial-gradient(closest-side, #FFFBE8, #FFD36A 55%, #FFD36A00)'}}/>;
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
const Wipe: React.FC<{u: number; children: React.ReactNode}> = ({u, children}) => u <= 0 ? null :
  <AbsoluteFill style={{clipPath: u >= 1 ? undefined : `inset(0 ${(100 - 100 * u).toFixed(2)}% 0 0)`}}>{children}</AbsoluteFill>;

/** a felt flame (teardrop) that flickers */
const Flame: React.FC<{t: number; x: number; y: number; s?: number; o?: number}> = ({t, x, y, s = 1, o = 1}) => {
  if (o <= 0) return null;
  const f = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29 + 1);
  return <svg width={80 * s} height={120 * s} viewBox="-40 -100 80 120" style={{position: 'absolute', left: x - 40 * s, top: y - 100 * s, opacity: o, overflow: 'visible',
    filter: 'drop-shadow(0 0 14px #FFB84Acc)'}}>
    <g transform={`scale(${0.95 + 0.05 * Math.sin(t * 11)} ${f}) rotate(${3 * Math.sin(t * 7)})`}>
      <path d="M0 -90 C 18 -55 30 -30 26 -8 C 22 12 -22 12 -26 -8 C -30 -30 -18 -55 0 -90 Z" fill="#F29A2E" stroke="#B85E18" strokeWidth={3}/>
      <path d="M0 -60 C 10 -40 16 -24 13 -10 C 10 2 -10 2 -13 -10 C -16 -24 -10 -40 0 -60 Z" fill="#FFE07A"/>
      <path d="M -8 -20 L 0 -12 L 8 -20" stroke="#FFF6D0" strokeWidth={2.5} fill="none"/>
    </g>
  </svg>;
};

// ---- plate geometry (1080 x 1920; tuned on the prepped plates) ------------------------------------------------------------------
const NICHE = {dy: -110, sillY: 1385, cx: 540, cy: 900};        // the niche plate is drawn 110 px higher; the sill and the niche centre
const LAMP_H = 520;
const OLIVE = {dy: 150, cx: 540, cy: 960, baseY: 1540};          // the olive plate drawn 150 px lower: canopy centre, trunk base
const ROOM_FLOOR = 1470;
// the lamp sprite's flame and glass centre (fraction of the sprite height from the top), measured on the keyed sprite
const LAMP_GLASS = 0.52;

const Plate: React.FC<{n: string; dy?: number; scale?: number; ox?: number; oy?: number; filter?: string; bg?: string}> = ({n, dy = 0, scale = 1, ox = 540, oy = 960, filter, bg = '#0A0E14'}) =>
  <AbsoluteFill style={{background: bg}}>
    <AbsoluteFill style={{transformOrigin: `${ox}px ${oy}px`, transform: `scale(${scale})`}}>
      <Img src={staticFile(`plates/${n}.jpg`)} style={{position: 'absolute', left: 0, top: dy, width: 1080, height: 1920, filter}}/>
    </AbsoluteFill>
  </AbsoluteFill>;

// ---- SKY (0 - 3.02, and the closing 38.88 - 46.4) ------------------------------------------------------------------------------
const Sky: React.FC<{t: number}> = ({t}) => {
  const open = ease((t - T.nur + 0.15) / 0.9);
  const lit = c01((t - T.nur) / 1.8);
  return <AbsoluteFill>
    <Plate n="sky" scale={1.04 + 0.03 * inout(t / 3.5)} oy={1300} filter={`brightness(${(0.6 + 0.55 * lit).toFixed(2)})`}/>
    <Rays t={t} x={540} y={700} o={open} len={1500} n={20} seed="sky"/>
    <Glow x={540} y={700} r={120 + 380 * open} o={0.25 + open}/>
    <div style={{position: 'absolute', left: 540 - 16, top: 700 - 16, width: 32, height: 32, borderRadius: '50%', background: '#FFFBEA',
      boxShadow: '0 0 40px 18px #FFE7A6', transform: `scale(${(0.3 + 0.9 * ease((t + 0.6) / 1)).toFixed(2)})`}}/>
    {/* the earth catches the light: a warm wash over the hills */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFD27A00 50%, #FFD27A44 75%, #FFD27A00 100%)', mixBlendMode: 'screen', opacity: lit}}/>
    <Motes t={t} x={540} y={1500} o={lit} spread={1000} n={30} seed="sk" rise={500}/>
  </AbsoluteFill>;
};

// ---- NICHE + LAMP + STAR (3.02 - 14.26), one camera ----------------------------------------------------------------------------
const Niche: React.FC<{t: number}> = ({t}) => {
  // camera: a slow push, then into the niche for "the lamp is within glass", deeper for the star
  const push = 1.0 + 0.04 * c01((t - T.niche) / 4) + 0.75 * inout((t - (T.lamp - 0.25)) / 0.9) + 0.25 * inout((t - T.star) / 3.5);
  const lampIn = ease((t - T.misbah + 0.1) / 0.6);
  const lampY = NICHE.sillY;
  const gy = lampY - LAMP_H * (1 - LAMP_GLASS);
  const star = ease((t - T.kawkab + 0.5) / 0.9);         // the glass turns pearly white
  const whiteGlass = c01((t - T.star) / 1.5);
  const sweep = c01((t - T.zujaja) / 0.8);
  const dark = c01((t - T.star - 0.3) / 1.2);             // the wall sinks into the night as the star shines
  return <AbsoluteFill>
    <AbsoluteFill style={{transformOrigin: `${NICHE.cx}px ${gy}px`, transform: `scale(${push})`}}>
      <Plate n="niche" dy={NICHE.dy} filter={`brightness(${(0.75 + 0.45 * lampIn - 0.6 * dark).toFixed(2)})`}/>
      <Glow x={NICHE.cx} y={gy} r={420} o={lampIn * (0.7 + 0.1 * Math.sin(t * 5))}/>
      <Sprite n="lamp" x={NICHE.cx} y={lampY + 30 * (1 - lampIn)} h={LAMP_H} o={lampIn}
        filter={`drop-shadow(0 12px 10px #00000099) drop-shadow(0 0 ${(20 + 40 * whiteGlass).toFixed(0)}px #FFE7A6) brightness(${(1 + 0.35 * whiteGlass).toFixed(2)})`}/>
      {/* the highlight sweeping across the glass on «زُجَاجَةٍ» */}
      {sweep > 0 && sweep < 1 && <div style={{position: 'absolute', left: NICHE.cx - 150 + 300 * sweep - 20, top: gy - 150, width: 40, height: 300, borderRadius: 20,
        background: 'linear-gradient(90deg, #FFFFFF00, #FFFFFFcc, #FFFFFF00)', transform: 'rotate(18deg)', mixBlendMode: 'screen', opacity: Math.sin(Math.PI * sweep)}}/>}
      <AbsoluteFill style={{background: '#050814', opacity: 0.7 * dark}}/>
      {/* the pearly star */}
      <Rays t={t} x={NICHE.cx} y={gy} o={star} len={900} n={10} col="#F4F6FF" spin={14} seed="st"/>
      <Glow x={NICHE.cx} y={gy} r={140 + 260 * star} o={star} c="#FFFFFF" c2="#CFE0FF"/>
      <Motes t={t} x={NICHE.cx} y={gy + 120} o={lampIn * 0.8} spread={340} n={22} seed="nm" rise={260}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={12} depth={1.2} seed="nf" o={0.7}/>
  </AbsoluteFill>;
};

// ---- OLIVE (14.26 - 22.50) ---------------------------------------------------------------------------------------------------
const Olive: React.FC<{t: number}> = ({t}) => {
  const d = t - T.olive;
  const push = 1.02 + 0.06 * inout(d / 8.2);
  const bless = ease((t - T.mubaraka + 0.2) / 0.8);
  const east = win(t, T.east - 0.4, T.west - 0.15, 0.5), west = win(t, T.west - 0.4, CARDS[6].t0 + 0.1, 0.5);
  // a drop of oil runs from the canopy down the trunk to the ground
  const dropU = c01((t - T.mubaraka - 0.3) / 1.4);
  const olives = Array.from({length: 16}, (_, k) => [OLIVE.cx + (random(`ox${k}`) - 0.5) * 560, OLIVE.cy + (random(`oy${k}`) - 0.5) * 300]);
  return <AbsoluteFill>
    <AbsoluteFill style={{transformOrigin: `${OLIVE.cx}px ${OLIVE.baseY}px`, transform: `scale(${push})`}}>
      <Plate n="olive" dy={OLIVE.dy} bg="#1C2048"/>
      <AbsoluteFill style={{background: `linear-gradient(180deg, #1C2048 0px, #1C2048 ${OLIVE.dy}px, #1C204800 ${OLIVE.dy + 80}px)`}}/>
      {/* east (right) and west (left) suns: each comes and goes; the tree belongs to neither */}
      <Glow x={1080} y={OLIVE.baseY - 220} r={520} o={east * 0.9} c="#FFD9A0" c2="#FF9A40"/>
      <Glow x={0} y={OLIVE.baseY - 220} r={520} o={west * 0.9} c="#FFD9A0" c2="#FF9A40"/>
      <Glow x={OLIVE.cx} y={OLIVE.cy} r={460} o={0.35 * bless + 0.15 * Math.sin(t * 2)}/>
      {olives.map(([x, y], k) => {
        const on = ease((t - T.mubaraka - 0.05 * k) / 0.4);
        return <Glow key={k} x={x} y={y} r={26 + 8 * Math.sin(t * 3 + k)} o={on * 0.95} c="#FFF4C8" c2="#F2C04E"/>;
      })}
      {dropU > 0 && dropU < 1 && <div style={{position: 'absolute', left: OLIVE.cx - 9 + 10 * Math.sin(dropU * 6), top: lerp(OLIVE.cy + 80, OLIVE.baseY - 10, dropU * dropU) - 14,
        width: 18, height: 26, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: 'radial-gradient(circle at 40% 35%, #FFF4C8, #E9A92A 60%, #9A6510)',
        boxShadow: '0 0 18px #F2C04E'}}/>}
      <Motes t={t} x={OLIVE.cx} y={OLIVE.cy + 120} o={bless} spread={600} n={26} seed="om" rise={320}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={14} depth={1.1} seed="of" o={0.6}/>
  </AbsoluteFill>;
};

// ---- OIL (22.50 - 28.46) -----------------------------------------------------------------------------------------------------
const Oil: React.FC<{t: number}> = ({t}) => {
  const d = t - T.oil;
  const push = 1.0 + 0.1 * inout(d / 6);
  const glow = ease((t - (W(6, 1) - 0.2)) / 2.4);       // from «زَيْتُهَا», strongest on «يُضِىٓءُ» and after
  const bx = 540, by = 1260, bh = 340;
  // the flame comes near on «وَلَوْ لَمْ تَمْسَسْهُ» and never touches; it backs off on «نَارٌ»
  const near = ease((t - W(6, 3)) / 1.4) * (1 - ease((t - T.nar - 0.1) / 0.8));
  const fx = lerp(1150, 860, near);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 62%, #2A1C10 0%, #0B0806 60%, #050403 100%)'}}>
    <AbsoluteFill style={{transformOrigin: `${bx}px ${by}px`, transform: `scale(${push})`}}>
      {/* a knitted cloth under the bowl */}
      <Img src={staticFile('plates/room.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: 0.35, filter: 'brightness(0.5)'}}/>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 64%, #00000000 20%, #000000cc 70%)'}}/>
      <Glow x={bx} y={by - bh * 0.55} r={200 + 380 * glow} o={glow}/>
      <Sprite n="bowl" x={bx} y={by} h={bh} filter={`drop-shadow(0 12px 10px #000000aa) brightness(${(0.55 + 0.75 * glow).toFixed(2)}) drop-shadow(0 0 ${(30 * glow).toFixed(0)}px #FFD27A)`}/>
      <Motes t={t} x={bx} y={by - bh * 0.6} o={glow} spread={300} n={36} seed="oi" rise={520}/>
      <Rays t={t} x={bx} y={by - bh * 0.6} o={glow * 0.55} len={700} n={14} spin={3} seed="oil"/>
      <Flame t={t} x={fx} y={by - bh * 0.5} s={1.1} o={near > 0.01 ? 1 : 0}/>
    </AbsoluteFill>
  </AbsoluteFill>;
};

// ---- NUR: light upon light (28.51 - 31.04) -------------------------------------------------------------------------------------
const Nur: React.FC<{t: number}> = ({t}) => {
  const r1 = ease((t - T.nur2 + 0.1) / 1.0), r2 = ease((t - T.nur3 + 0.1) / 1.0);
  const cx = 540, cy = 1020, lh = 560;
  const gy = cy;
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #1A1408 0%, #070604 70%)'}}>
    <Glow x={cx} y={gy} r={300 + 300 * r1} o={0.5 + 0.5 * r1}/>
    <Glow x={cx} y={gy} r={200 + 700 * r2} o={r2} c="#FFFFFF" c2="#FFE7A6"/>
    {[r1, r2].map((r, k) => r > 0 && <div key={k} style={{position: 'absolute', left: cx - (180 + 260 * r + 90 * k), top: gy - (180 + 260 * r + 90 * k),
      width: 2 * (180 + 260 * r + 90 * k), height: 2 * (180 + 260 * r + 90 * k), borderRadius: '50%', border: '6px dashed #FFE7A6', opacity: 0.8 * r,
      transform: `rotate(${(t * (k ? -12 : 9)).toFixed(1)}deg)`, boxShadow: '0 0 30px #FFD27A88, inset 0 0 30px #FFD27A55'}}/>)}
    <Rays t={t} x={cx} y={gy} o={0.4 + 0.6 * r2} len={1300} n={22} spin={6} seed="nr"/>
    <Sprite n="lamp" x={cx} y={gy + lh * (1 - LAMP_GLASS)} h={lh} filter="drop-shadow(0 0 40px #FFE7A6) brightness(1.3)"/>
    <Motes t={t} x={cx} y={gy + 200} o={1} spread={700} n={40} seed="nu" rise={700}/>
  </AbsoluteFill>;
};

// ---- ROOM + PASS (31.04 - 38.88) -------------------------------------------------------------------------------------------------
const DOLL_H = 600, CHILD_H = 450;
const handOf = (n: string, x: number, y: number, h: number, flip: boolean) => {
  const [fx, fy] = (SP[`${n}_hand`] as unknown as [number, number]) ?? [0.9, 0.42];
  const w = sw(n, h);
  const hx = x - w / 2 + w * fx;
  return {x: flip ? 2 * x - hx : hx, y: y - h + h * fy};
};
/** a lantern resting on a doll's hands; lit 0..1 */
const Lantern: React.FC<{t: number; x: number; y: number; lit: number; h?: number; seed: string}> = ({t, x, y, lit, h = 170, seed}) => <>
  <Glow x={x} y={y - h * 0.5} r={150 + 160 * lit} o={lit * (0.85 + 0.1 * Math.sin(t * 6 + seed.length))}/>
  <Sprite n="lantern" x={x} y={y + 14} h={h} filter={`drop-shadow(0 8px 6px #00000099) brightness(${(0.4 + 0.75 * lit).toFixed(2)}) saturate(${(0.5 + 0.6 * lit).toFixed(2)}) drop-shadow(0 0 ${(24 * lit).toFixed(0)}px #FFD27A)`}/>
</>;
/** a flame mote that arcs from (x0, y0) to (x1, y1) over u 0..1 */
const Spark: React.FC<{u: number; x0: number; y0: number; x1: number; y1: number}> = ({u, x0, y0, x1, y1}) => {
  if (u <= 0 || u >= 1) return null;
  const e = inout(u), x = lerp(x0, x1, e), y = lerp(y0, y1, e) - 220 * Math.sin(Math.PI * e);
  return <>
    {Array.from({length: 8}, (_, k) => { const b = Math.max(0, e - k * 0.025), px = lerp(x0, x1, b), py = lerp(y0, y1, b) - 220 * Math.sin(Math.PI * b);
      return <div key={k} style={{position: 'absolute', left: px - (14 - k), top: py - (14 - k), width: 2 * (14 - k), height: 2 * (14 - k), borderRadius: '50%', opacity: 0.8 - k * 0.09,
        background: 'radial-gradient(closest-side, #FFFBE8, #FFC24A 60%, #FFC24A00)'}}/>; })}
    <Glow x={x} y={y} r={90} o={1}/>
  </>;
};
const Room: React.FC<{t: number}> = ({t}) => {
  const d = t - T.room;
  const push = 1.0 + 0.06 * inout(d / 7.8);
  const ax = 300, bx = 640, cx = 900;
  const beam = win(t, T.linurihi - 0.9, T.pass + 0.6, 0.6);
  const litA = ease((t - T.linurihi - 0.1) / 0.5);
  const others = ease((t - (T.room + 1.2)) / 1.2);            // the man and the child step out of the dark
  // A -> B, then B turns and B -> C (each keeps the light they had)
  const s1 = c01((t - (T.amthal - 1.0)) / 0.9), litB = ease((t - (T.amthal - 0.1)) / 0.4);
  const turn = c01((t - (T.amthal + 0.35)) / 0.2);           // B turns to face the child
  const s2 = c01((t - (T.nas - 0.75)) / 0.8), litC = ease((t - (T.nas + 0.05)) / 0.4);
  const flipB = turn < 0.5;
  const sqB = turn > 0 && turn < 1 ? 1 - 0.5 * Math.sin(Math.PI * turn) : 1;
  const hA = handOf('doll_a', ax, ROOM_FLOOR, DOLL_H, false);
  const hB = handOf('doll_b', bx, ROOM_FLOOR, DOLL_H, flipB);
  const hC = handOf('doll_c', cx, ROOM_FLOOR, CHILD_H, true);
  const warm = 0.2 * litA + 0.25 * litB + 0.25 * litC;
  const dim = (k: number) => `drop-shadow(0 10px 8px #00000088) brightness(${(0.35 + 0.75 * k).toFixed(2)})`;
  return <AbsoluteFill>
    <AbsoluteFill style={{transformOrigin: `600px ${ROOM_FLOOR}px`, transform: `scale(${push})`}}>
      <Plate n="room" filter={`brightness(${(0.55 + 0.9 * warm).toFixed(2)})`}/>
      {/* the beam from the window to her lantern */}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: beam}}>
        <defs><linearGradient id="nkbeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C8" stopOpacity={0.75}/><stop offset="1" stopColor="#FFF1C8" stopOpacity={0.15}/></linearGradient>
          <filter id="nkbb"><feGaussianBlur stdDeviation={18}/></filter></defs>
        <polygon points={`120,420 300,420 ${hA.x + 80},${hA.y} ${hA.x - 80},${hA.y}`} fill="url(#nkbeam)" filter="url(#nkbb)"/>
        {[0, 1, 2].map((k) => <line key={k} x1={170 + 50 * k} y1={430} x2={hA.x - 40 + 40 * k} y2={hA.y - 40} stroke="#FFE7A6" strokeWidth={3} strokeDasharray="12 9" strokeDashoffset={-t * 60} opacity={0.6}/>)}
      </svg>
      <Glow x={hA.x} y={hA.y} r={500} o={0.25 * litA}/>
      <Sprite n="doll_a" x={ax} y={ROOM_FLOOR} h={DOLL_H} filter={dim(0.35 + 0.65 * Math.max(beam, litA))}/>
      <Lantern t={t} x={hA.x - 20} y={hA.y + 4} lit={litA} seed="a"/>
      <AbsoluteFill style={{opacity: others}}>
        <div style={{position: 'absolute', left: bx, top: 0, width: 0, height: 0}}/>
        <div style={{position: 'absolute', left: bx - sw('doll_b', DOLL_H) / 2, top: ROOM_FLOOR - DOLL_H, width: sw('doll_b', DOLL_H), height: DOLL_H,
          transform: `scaleX(${(flipB ? -1 : 1) * sqB})`}}>
          <Img src={staticFile('sprites/doll_b.png')} style={{width: '100%', height: '100%', filter: dim(0.2 + 0.8 * litB)}}/>
        </div>
        <Lantern t={t} x={hB.x + (flipB ? 20 : -20)} y={hB.y + 4} lit={litB} seed="bb"/>
        <Sprite n="doll_c" x={cx} y={ROOM_FLOOR} h={CHILD_H} flip filter={dim(0.2 + 0.8 * litC)}/>
        <Lantern t={t} x={hC.x + 16} y={hC.y + 4} lit={litC} h={140} seed="ccc"/>
      </AbsoluteFill>
      <Spark u={s1} x0={hA.x - 20} y0={hA.y - 60} x1={hB.x + 20} y1={hB.y - 60}/>
      <Spark u={s2} x0={hB.x - 20} y0={hB.y - 60} x1={hC.x + 16} y1={hC.y - 50}/>
      <Motes t={t} x={600} y={ROOM_FLOOR - 300} o={warm * 1.5} spread={900} n={30} seed="rm" rise={400}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={12} depth={1.2} seed="rf" o={0.6}/>
  </AbsoluteFill>;
};

// ---- ALL: the lanterns become stars (38.88 - 46.4) -----------------------------------------------------------------------------
const LANTERNS = Array.from({length: 26}, (_, k) => ({x: 70 + random(`lx${k}`) * 940, y: 1180 + random(`ly${k}`) * 380, d: Math.abs(random(`lx${k}`) - 0.5) * 2.4 + random(`ld${k}`) * 0.6}));
const All: React.FC<{t: number}> = ({t}) => {
  const d = t - T.all;
  const pull = 1.25 - 0.22 * inout(d / 4.5);
  const dawn = c01((t - T.end) / 2.5);
  return <AbsoluteFill>
    <AbsoluteFill style={{transformOrigin: '540px 1300px', transform: `scale(${pull})`}}>
      <Plate n="sky" filter={`brightness(${(0.7 + 0.35 * dawn).toFixed(2)})`}/>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFD27A00 55%, #FFC86A55 80%, #FFC86A00 100%)', mixBlendMode: 'screen', opacity: dawn}}/>
      {LANTERNS.map((l, k) => {
        const on = ease((d - 0.3 - l.d) / 0.5);
        const rise = c01((d - 2.6 - l.d * 0.8) / 3.5);
        const y = lerp(l.y, 780 + random(`sy${k}`) * 380, inout(rise));
        const s = lerp(1, 0.35, rise);
        return <React.Fragment key={k}>
          <Glow x={l.x} y={y} r={(46 + 10 * Math.sin(t * 4 + k)) * (1 + rise)} o={on} c={rise > 0.6 ? '#FFFFFF' : '#FFE6A8'}/>
          <div style={{position: 'absolute', left: l.x - 9 * s, top: y - 9 * s, width: 18 * s, height: 18 * s, borderRadius: '50%', opacity: on,
            background: 'radial-gradient(closest-side, #FFFBE8, #FFC24A 70%, #FFC24A00)'}}/>
        </React.Fragment>;
      })}
      <Rays t={t} x={540} y={700} o={0.5 * dawn} len={1500} n={20} seed="end"/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={16} depth={1.2} seed="af" o={0.6}/>
  </AbsoluteFill>;
};

// ---- the scene at time t: stitch seams between the beats ---------------------------------------------------------------------
const SEAMS = [T.niche, T.olive, T.oil, T.nur2, T.room, T.all].map((s) => s - 0.2);
const sU = (t: number, i: number) => ease((t - SEAMS[i]) / 0.55);
export const Scene: React.FC<{t: number}> = ({t}) => {
  const u = SEAMS.map((_, i) => sU(t, i));
  return <AbsoluteFill>
    {u[0] < 1 && <Sky t={t}/>}
    {t > SEAMS[0] && u[1] < 1 && <Wipe u={u[0]}><Niche t={t}/></Wipe>}
    {t > SEAMS[1] && u[2] < 1 && <Wipe u={u[1]}><Olive t={t}/></Wipe>}
    {t > SEAMS[2] && u[3] < 1 && <Wipe u={u[2]}><Oil t={t}/></Wipe>}
    {t > SEAMS[3] && u[4] < 1 && <Wipe u={u[3]}><Nur t={t}/></Wipe>}
    {t > SEAMS[4] && u[5] < 1 && <Wipe u={u[4]}><Room t={t}/></Wipe>}
    {t > SEAMS[5] && <Wipe u={u[5]}><All t={t}/></Wipe>}
    {u.map((v, i) => <Seam key={i} t={t} u={v}/>)}
  </AbsoluteFill>;
};

// ---- the ayah, word by word (top band, inside the safe zone) -------------------------------------------------------------------
const rich = (s: string, o = 1) => s.split(/(\*[^*]+\*)/).filter(Boolean).map((p, k) => p.startsWith('*')
  ? <span key={k} style={{color: '#F7C556'}}>{p.slice(1, -1)}</span> : <span key={k} style={{opacity: o}}>{p}</span>);
export const cardSpan = (i: number): [number, number] => {
  const a = i === 0 ? 0 : CARDS[i].t0 - 0.12;
  const b = i < CARDS.length - 1 ? CARDS[i + 1].t0 - 0.12 : T.end + 0.5;
  return [a, b];
};
const MARK_DY = 38;                              // Amiri Quran sets the waqf signs high above the line; drawn a bit lower, next to the last word
const CardView: React.FC<{t: number; i: number}> = ({t, i}) => {
  const [a, b] = cardSpan(i);
  const c = CARDS[i];
  const inU = i === 0 ? 1 : ease((t - a) / 0.35);
  const o = Math.min(inU, 1 - c01((t - (b - 0.18)) / 0.18));
  if (o <= 0) return null;
  return <div style={{position: 'absolute', top: 262, left: 40, right: 40, textAlign: 'center', opacity: o, transform: `translateY(${(10 * (1 - inU)).toFixed(1)}px)`}}>
    <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: c.ar.length > 5 ? 70 : 78, lineHeight: 1.85, filter: 'drop-shadow(0 3px 2px #000000dd) drop-shadow(0 0 16px #000000aa)'}}>
      {c.ar.map((w, k) => {
        const [s] = c.w[k];
        const now = t >= s - 0.04 && (k === c.ar.length - 1 ? t < c.t1 + 0.4 : t < c.w[k + 1][0] - 0.04);
        const past = t >= s - 0.04;
        return <React.Fragment key={k}><span style={{color: now ? '#F7C556' : past ? '#FBF3E4' : '#FBF3E499',
          textShadow: now ? '0 0 22px #F2B53C99' : undefined}}>{w}</span>{k === c.ar.length - 1 && c.mark ? <span style={{display: 'inline-block', transform: `translateY(${MARK_DY}px)`,
          color: past ? '#E8C987' : '#E8C98799'}}>{'\u00A0' + c.mark}</span> : null}{' '}</React.Fragment>;
      })}
    </div>
    <div style={{fontFamily: SANS, fontSize: 46, lineHeight: 1.2, color: '#F7EFE3', marginTop: 8, padding: '0 30px', filter: 'url(#yarnSoft) drop-shadow(0 3px 3px #000000dd)'}}>
      {rich(c.en)}
    </div>
  </div>;
};
const Label: React.FC<{t: number}> = ({t}) => <div style={{position: 'absolute', top: 226, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 32,
  letterSpacing: 6, color: '#E8C987', opacity: 1 - c01((t - T.end - 0.3) / 0.5), textShadow: '0 2px 3px #000000'}}>SURAH AN-NUR · 24:35</div>;
const EndCard: React.FC<{t: number}> = ({t}) => {
  const u1 = ease((t - T.end - 0.5) / 0.7), u2 = ease((t - T.end - 1.6) / 0.7);
  if (u1 <= 0) return null;
  return <><AbsoluteFill style={{background: 'linear-gradient(180deg, #06050A00 200px, #06050Acc 330px, #06050Acc 600px, #06050A00 760px)', opacity: u1}}/><div style={{position: 'absolute', top: 360, left: 40, right: 40, textAlign: 'center', fontFamily: SANS, color: '#FBF3E4',
    filter: 'url(#yarnSoft) drop-shadow(0 4px 4px #000000dd) drop-shadow(0 0 20px #000000aa)'}}>
    <div style={{fontSize: 76, lineHeight: 1.1, opacity: u1, transform: `translateY(${(14 * (1 - u1)).toFixed(1)}px)`}}>{TX.endEn[0]}</div>
    <div style={{fontSize: 76, lineHeight: 1.1, marginTop: 16, opacity: u2, transform: `translateY(${(14 * (1 - u2)).toFixed(1)}px)`}}>{rich(TX.endEn[1])}</div>
  </div></>;
};
const SoftDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>
  <filter id="yarnSoft" x="-5%" y="-30%" width="110%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves={2} seed={11} result="fib"/>
    <feDisplacementMap in="SourceGraphic" in2="fib" scale={2.2} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>;

export const Captions: React.FC<{t: number}> = ({t}) => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #06050Aee 0px, #06050Ab0 560px, #06050A00 820px)'}}/>
  <Label t={t}/>
  {CARDS.map((_, i) => <CardView key={i} t={t} i={i}/>)}
  <EndCard t={t}/>
</>;

export const NurKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return <AbsoluteFill style={{background: '#0A0E14', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/><ArDefs/><SoftDefs/>
    <Scene t={t}/>
    <Captions t={t}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #00000000 55%, #00000066 100%)'}}/>
  </AbsoluteFill>;
};
