// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Halal always wins".
// The reference DfGSMztq49_ by @muzbuild (12.05 s) rebuilt in knitted yarn with 2D MOTION GRAPHICS ONLY (no Blender, owner rule).
// Same flow on the reference's own clock, same soundtrack (untouched: the recitation of al-Mu'minun 23:35-37 and the reference's
// own ticks and crash boom; nothing added over it):
//   0.00-1.00  CAREER. Two knitted dolls at the foot of a knitted tower: HARAM walks into the elevator ("SHORTCUT"), HALAL
//              walks to the stairs
//   1.00-3.90  the elevator shoots up to floor 60 while the stairs doll climbs floor by floor
//   3.90-8.05  the elevator waits at the top, the cable starts to fray; the climber keeps going
//   8.05-8.57  the yarn cable snaps, the cabin falls and crashes on the reference's boom (8.57 s): felt dust, the counter goes to a
//              red 0, the doll sits dazed in the wreck
//   8.57-9.85  the climber speeds up (with Allah's help things become easier: the caption), reaches the roof at floor 60
//   9.45-11.6  "Every floor you climb / in halal is yours." The roof door swings open on warm light, a beam of gold and motes
//  11.5-12.07  a felt dust wipe back to the opening frame, so the reel loops like the reference
// Every part is knitwork: GPT Image 2 plates and amigurumi doll sprites (gen.sh), keyed by prep.py; generic people only. The
// Arabic labels «حَرَام» / «حَلَال» are set in Amiri Quran and never go through the yarn displacement filter (text.py checks them).
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {AR_PUFF, ArDefs} from '../lanternknit/LanternKnit';
import {Burst, ThreadDefs} from '../tadbeerknit/TadbeerKnit';
import SPR from './sprites.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = 362;             // 12.067 s (the reference: 12.051 s, its audio 12.05 s)
export const SANS = 'KnitSans, sans-serif', SERIF = 'KnitSerif, serif', AR = 'AmiriQ, "Amiri Quran", serif';
const SP = SPR as unknown as Record<string, [number, number]>;

// ---- helpers -----------------------------------------------------------------------------------------------------------------
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const bell = (t: number, c: number, w: number) => Math.max(0, 1 - Math.abs(t - c) / w);
type P = [number, number];

// ---- the reference clock (s) ---------------------------------------------------------------------------------------------------
export const T = {walkIn: [0.25, 0.8], rise: [1.0, 3.9], fray: 7.3, snap: 8.05, crash: 257 / 30, roof: 9.55, face: 9.95, line1: 9.3,
  line2: 9.55, door: 9.9, wipe: 11.45, swap: 11.75};

// ---- the tower: sprite 918x1237, measured on the keyed sprite (prep.py); bottom = the ground line --------------------------------
export const GY = 1370, S = 0.743, TW = 918 * S, X0 = 540 - TW / 2;
export const tx = (sx: number) => X0 + sx * S, ty = (sy: number) => GY - (1237 - sy) * S;
const SHAFT_X = tx(165);                         // the shaft's centre line (the winch drum, the cable, the cabin)
const WINCH: P = [tx(165), ty(176)];
const CAB_W = 90, CAB_H = (CAB_W * 1473) / 755;  // the knitted cabin
const CAB_BOTTOM0 = GY - 3, CAB_BOTTOM1 = ty(205) + CAB_H;    // at the ground / under the winch box
const DOLL = 140;                                // a standing doll's height
const KH = DOLL / 1444, KR = DOLL / 1633;       // px per source px, halal and haram dolls
// the halal path: ground, then the top of the stair rail (four flights), then the roof beside the door
const STAIRS: P[] = [[455, 1196], [834, 941], [462, 690], [840, 434], [452, 178]];
const ROOF: P = [548, 160];

// ---- a sprite: (x, y) is the bottom centre, h the drawn height -------------------------------------------------------------------
export const Sprite: React.FC<{n: string; x: number; y: number; h: number; flip?: boolean; rot?: number; o?: number; origin?: string;
  shadow?: boolean; style?: React.CSSProperties}> = ({n, x, y, h, flip, rot = 0, o = 1, origin = '50% 100%', shadow = true, style}) => {
  const [w0, h0] = SP[n];
  const w = (h * w0) / h0;
  if (o <= 0) return null;
  return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o,
    transformOrigin: origin, transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
    filter: shadow ? 'drop-shadow(0 6px 6px #00000066)' : undefined, ...style}}/>;
};
const doll = (n: string) => (n.startsWith('halal') ? SP[n][1] * KH : SP[n][1] * KR);

// ---- the elevator ----------------------------------------------------------------------------------------------------------------
/** the cabin's bottom y and its tilt at time t */
export const cabin = (t: number): {y: number; rot: number; fall: boolean; crashed: boolean} => {
  if (t < T.rise[0]) return {y: CAB_BOTTOM0, rot: 0, fall: false, crashed: false};
  if (t < T.snap) {
    const u = inout((t - T.rise[0]) / (T.rise[1] - T.rise[0]));
    const shiver = t > T.fray ? Math.sin(t * 90) * 1.6 * c01((t - T.fray) / 0.6) : 0;
    return {y: lerp(CAB_BOTTOM0, CAB_BOTTOM1, u) + shiver, rot: t > T.fray ? Math.sin(t * 57) * 1.2 * c01((t - T.fray) / 0.7) : 0, fall: false, crashed: false};
  }
  if (t < T.crash) {
    const u = (t - T.snap) / (T.crash - T.snap);
    return {y: lerp(CAB_BOTTOM1, CAB_BOTTOM0, u * u), rot: 3 * u, fall: true, crashed: false};
  }
  const d = t - T.crash;
  const bounce = -14 * Math.exp(-d * 9) * Math.abs(Math.sin(d * 20));
  return {y: CAB_BOTTOM0 + 4 + bounce, rot: 13 * ease(d / 0.18), fall: false, crashed: true};
};
/** 0..60 on the haram counter */
const haramFloor = (t: number) => {
  const c = cabin(t);
  if (c.crashed) return 0;
  return Math.round((60 * (CAB_BOTTOM0 - c.y)) / (CAB_BOTTOM0 - CAB_BOTTOM1));
};

const Cable: React.FC<{t: number}> = ({t}) => {
  const c = cabin(t);
  const top = c.y - CAB_H + 6;
  const fray = c01((t - T.fray) / (T.snap - T.fray));
  const strand = (d: string, w: number, o = 1) => <g opacity={o}>
    <path d={d} stroke="#3B3A40" strokeWidth={w + 3} fill="none" strokeLinecap="round"/>
    <path d={d} stroke="#CFCBC6" strokeWidth={w} fill="none" strokeLinecap="round"/>
    <path d={d} stroke="#FFFFFF" strokeWidth={w * 0.4} strokeDasharray="5 7" fill="none" strokeLinecap="round" opacity={0.7}/>
  </g>;
  const [wx, wy] = WINCH;
  if (t < T.snap) {
    // one cable; from the fray onwards a few strands bulge out of it near the middle, wider and wider
    const mid = (wy + top) / 2;
    const bul = 7 * fray * (1 + 0.3 * Math.sin(t * 40));
    return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {strand(`M ${wx} ${wy} L ${wx} ${top}`, 5)}
      {fray > 0 && <>
        {strand(`M ${wx} ${mid - 40} Q ${wx - bul} ${mid} ${wx} ${mid + 40}`, 2, fray)}
        {strand(`M ${wx} ${mid - 30} Q ${wx + bul * 1.3} ${mid + 4} ${wx} ${mid + 34}`, 2, fray)}
      </>}
    </svg>;
  }
  // snapped: the top half recoils and swings from the winch as a wavy yarn end, the bottom end trails the cabin and then flops
  const d = t - T.snap;
  const upLen = lerp(260, 150, ease(d / 0.5));
  const amp = 16 * Math.exp(-d * 1.4) + 4;
  const pts: string[] = [];
  for (let k = 0; k <= 16; k++) {
    const s = k / 16;
    pts.push(`${(wx + amp * s * Math.sin(s * 9 - d * 7)).toFixed(1)} ${(wy + upLen * s).toFixed(1)}`);
  }
  const low: string[] = [];
  const lowLen = c.crashed ? 70 : 90;
  for (let k = 0; k <= 10; k++) {
    const s = k / 10;
    const sway = c.crashed ? 30 * s * s : 8 * s * Math.sin(s * 6 + d * 30);
    low.push(`${(SHAFT_X + sway).toFixed(1)} ${(top - (c.crashed ? lowLen * (1 - 0.6 * s) * s : lowLen * s)).toFixed(1)}`);
  }
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {strand('M ' + pts.join(' L '), 4)}
    {strand('M ' + low.join(' L '), 4)}
  </svg>;
};

const Elevator: React.FC<{t: number}> = ({t}) => {
  const c = cabin(t);
  const inCab = t >= T.walkIn[1];
  // the haram doll: walks in from the left, waits smug in the cabin; after the crash he sits dazed beside the wreck
  let dollEl: React.ReactNode = null;
  if (!inCab) {
    const u = c01((t - T.walkIn[0]) / (T.walkIn[1] - T.walkIn[0]));
    const x = lerp(tx(18), SHAFT_X, u);
    const walking = u > 0 && u < 1;
    const n = walking && Math.floor(t * 7) % 2 === 0 ? 'haram2' : walking ? 'haram1' : 'haram1';
    dollEl = <Sprite n={walking ? n : 'haram1'} x={x} y={GY - 2 - (walking ? 3 * Math.abs(Math.sin(t * 22)) : 0)} h={doll(walking ? n : 'haram1')}/>;
  }
  const cabEl = <Sprite n="cabin" x={SHAFT_X} y={c.y} h={CAB_H} rot={c.rot} origin="50% 100%"/>;
  const inner = inCab && !c.crashed
    ? <Sprite n={c.fall ? 'haram3' : 'haram1'} x={SHAFT_X} y={c.y - 12 - (c.fall ? 24 : 0)} h={c.fall ? doll('haram3') * 0.92 : doll('haram1') * 0.93}
      rot={c.rot + (c.fall ? 8 * Math.sin(t * 30) : 0)} shadow={false}/>
    : null;
  const wreck = c.crashed ? <Sprite n="haram3" x={SHAFT_X + 30} y={GY + 2} h={doll('haram3') * 0.95} rot={-4 + 3 * Math.exp(-(t - T.crash) * 6) * Math.sin((t - T.crash) * 30)}/> : null;
  return <>
    <Cable t={t}/>
    {cabEl}
    {inner}
    {wreck}
    {dollEl}
  </>;
};

// ---- the stairs doll -------------------------------------------------------------------------------------------------------------
const FLOOR_KEYS: P[] = [[0.8, 0], [2.0, 2], [4.0, 5], [6.0, 9], [7.9, 20], [8.7, 40], [9.2, 54], [T.roof, 60]];
/** monotone smooth interpolation of the reference's own counter readings */
export const halalFloor = (t: number) => {
  if (t <= FLOOR_KEYS[0][0]) return 0;
  for (let i = 1; i < FLOOR_KEYS.length; i++) {
    const [t1, f1] = FLOOR_KEYS[i], [t0, f0] = FLOOR_KEYS[i - 1];
    if (t <= t1) { const u = (t - t0) / (t1 - t0); return f0 + (f1 - f0) * (u * u * (3 - 2 * u) * 0.5 + u * 0.5); }
  }
  return 60;
};
const halalPos = (t: number): {p: P; dir: number; dist: number} => {
  // dist: the path length walked so far (for the stride), dir: +1 right, -1 left
  const g0: P = [tx(300), GY - 2], g1: P = [tx(STAIRS[0][0]) - 8, GY - 2];
  const toC = (p: P): P => [tx(p[0]), ty(p[1])];
  const flights = STAIRS.map(toC);
  const flightLen = flights.slice(1).map((p, i) => Math.hypot(p[0] - flights[i][0], p[1] - flights[i][1]));
  const groundLen = g1[0] - g0[0];
  if (t < T.walkIn[1]) {
    const u = c01((t - 0.1) / (T.walkIn[1] - 0.1));
    return {p: [lerp(g0[0], g1[0], u), GY - 2], dir: 1, dist: groundLen * u};
  }
  const f = halalFloor(t);
  if (t < T.roof) {
    const q = Math.min(3.9999, f / 15), i = Math.floor(q), u = q - i;
    const a = flights[i], b = flights[i + 1];
    // the first 6% of the first flight steps up from the ground onto the rail
    const p: P = i === 0 && u < 0.06 ? [lerp(g1[0], lerp(a[0], b[0], 0.06), u / 0.06), lerp(GY - 2, lerp(a[1], b[1], 0.06), u / 0.06)] : [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
    const dist = groundLen + flightLen.slice(0, i).reduce((s, x) => s + x, 0) + flightLen[i] * u;
    return {p, dir: b[0] > a[0] ? 1 : -1, dist};
  }
  const r = toC(ROOF), top = flights[4];
  const u = c01((t - T.roof) / 0.35);
  return {p: [lerp(top[0], r[0], u), lerp(top[1], r[1], u)], dir: 1, dist: groundLen + flightLen.reduce((s, x) => s + x, 0) + Math.hypot(r[0] - top[0], r[1] - top[1]) * u};
};
const Climber: React.FC<{t: number}> = ({t}) => {
  const {p, dir, dist} = halalPos(t);
  const moving = t > 0.1 && t < T.roof + 0.35;
  const phase = dist / 34;
  let n = 'halal1';
  if (moving) n = Math.floor(phase) % 2 === 0 ? (t < T.walkIn[1] ? 'halal3' : 'halal2') : 'halal3';
  if (t >= T.face) n = 'halal4';
  const bob = moving ? 3 * Math.abs(Math.sin(Math.PI * phase)) : 0;
  const glow = c01((t - T.door) / 0.6);
  return <Sprite n={n} x={p[0]} y={p[1] - bob} h={doll(n)} flip={dir < 0 && n !== 'halal4'}
    style={glow > 0 ? {filter: `drop-shadow(0 6px 6px #00000066) drop-shadow(0 0 ${14 * glow}px #FFD27Acc)`} : undefined}/>;
};

// ---- the roof door, the light beam, motes ------------------------------------------------------------------------------------------
const DOOR = {x: tx(409), y: ty(19), w: 103 * S, h: 168 * S};
const Door: React.FC<{t: number}> = ({t}) => {
  const o = ease((t - T.door) / 0.45);
  if (o <= 0) return null;
  const fl = 0.92 + 0.08 * Math.sin(t * 13);
  return <>
    <div style={{position: 'absolute', left: DOOR.x + 5, top: DOOR.y + 4, width: DOOR.w - 10, height: DOOR.h - 6, opacity: o * fl,
      background: 'linear-gradient(180deg, #FFF6D8 0%, #FFE08A 45%, #FFC14A 100%)', boxShadow: `0 0 ${40 * o}px ${12 * o}px #FFC84C99`}}/>
    {/* the knitted door leaf swings in on its left hinge */}
    <Img src={staticFile('sprites/door.png')} style={{position: 'absolute', left: DOOR.x, top: DOOR.y, width: DOOR.w, height: DOOR.h,
      transformOrigin: '0% 50%', transform: `perspective(400px) rotateY(${-68 * o}deg)`, filter: `brightness(${1 + 0.25 * o})`}}/>
  </>;
};
const Beam: React.FC<{t: number}> = ({t}) => {
  const o = ease((t - T.door - 0.15) / 0.7) * (0.85 + 0.15 * Math.sin(t * 5));
  if (o <= 0) return null;
  const cx = DOOR.x + DOOR.w / 2 + 40;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: o}}>
    <defs>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD878" stopOpacity={0.05}/><stop offset="0.55" stopColor="#FFCB55" stopOpacity={0.45}/>
        <stop offset="1" stopColor="#FFE9A8" stopOpacity={0.75}/>
      </linearGradient>
      <filter id="bblur"><feGaussianBlur stdDeviation={18}/></filter>
    </defs>
    <polygon points={`${cx - 150},0 ${cx + 190},0 ${cx + 150},${DOOR.y + DOOR.h} ${cx - 110},${DOOR.y + DOOR.h}`} fill="url(#beam)" filter="url(#bblur)"/>
    <ellipse cx={cx} cy={DOOR.y + DOOR.h} rx={260} ry={34} fill="#FFD36A" opacity={0.55} filter="url(#bblur)"/>
  </svg>;
};
const Motes: React.FC<{t: number}> = ({t}) => {
  const d = t - T.door;
  if (d < 0) return null;
  const cx = DOOR.x + DOOR.w / 2 + 40, by = DOOR.y + DOOR.h;
  return <>{Array.from({length: 34}, (_, k) => {
    const life = 1.6 + random(`ml${k}`) * 1.2, t0 = random(`mt${k}`) * 1.6;
    const a = ((d - t0) % life + life) % life;
    if (d < t0) return null;
    const x = cx + (random(`mx${k}`) - 0.5) * 360 + 18 * Math.sin(a * 3 + k);
    const y = by + 30 - a * (90 + 80 * random(`mv${k}`));
    const s = 5 + 8 * random(`ms${k}`), o = Math.sin(Math.PI * a / life) * c01(d / 0.4);
    return <div key={k} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
      background: 'radial-gradient(closest-side, #FFFBE8, #FFD36A 55%, #FFD36A00)'}}/>;
  })}</>;
};
/** slow wool fluff drifting over the whole night, like the reference's floating dots */
const Fluff: React.FC<{t: number}> = ({t}) => <>{Array.from({length: 26}, (_, k) => {
  const x = ((random(`fx${k}`) * 1180 + t * (6 + 10 * random(`fs${k}`))) % 1180) - 50;
  const y = ((random(`fy${k}`) * 1500 + t * (10 + 14 * random(`fv${k}`))) % 1500) + 120;
  const s = 4 + 7 * random(`fz${k}`);
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', opacity: 0.22 + 0.25 * random(`fo${k}`),
    background: 'radial-gradient(closest-side, #F3ECE0, #F3ECE000)'}}/>;
})}</>;

// ---- the counters, the sign, the labels ------------------------------------------------------------------------------------------
const Panel: React.FC<{x: number; y: number; w: number; h: number; n: number; tone: 'cream' | 'red' | 'gold'; glow?: number; flash?: number}> =
  ({x, y, w, h, n, tone, glow = 0, flash = 0}) => {
  const col = tone === 'red' ? '#FF6A55' : tone === 'gold' ? '#FFD46A' : '#F4ECDD';
  const rim = tone === 'gold' ? '#E7B040' : tone === 'red' ? '#C9483B' : '#8F8A94';
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 22,
    background: tone === 'gold' ? `linear-gradient(180deg, #4A3712 0%, #2B2010 100%)` : 'linear-gradient(180deg, #2C2A33 0%, #1B1A20 100%)',
    boxShadow: `0 10px 22px #00000088, inset 0 0 0 5px ${rim}, 0 0 ${50 * glow}px ${10 * glow}px #FFC84C88, 0 0 ${40 * flash}px ${8 * flash}px #FF4A3A99`,
    filter: 'url(#yarnPatch)'}}>
    <div style={{position: 'absolute', inset: 9, borderRadius: 16, border: `3px dashed ${rim}cc`}}/>
    <div style={{position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 18, letterSpacing: 6,
      color: tone === 'cream' ? '#CFC8D2' : col}}>FLOOR</div>
    <div style={{position: 'absolute', top: 29, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 44, lineHeight: 1.1, color: col,
      textShadow: `0 3px 3px #000000aa${glow ? `, 0 0 ${18 * glow}px #FFD46A` : ''}`, fontVariantNumeric: 'tabular-nums'}}>{n}</div>
  </div>;
};
const Counters: React.FC<{t: number}> = ({t}) => {
  const hf = haramFloor(t), c = cabin(t);
  const falling = t >= T.snap;
  const flash = c.crashed ? Math.exp(-(t - T.crash) * 3) : 0;
  const lf = Math.floor(halalFloor(t)), at = t >= T.roof;
  const glow = c01((t - T.roof) / 0.4);
  return <>
    <Panel x={196} y={462} w={212} h={86} n={hf} tone={falling ? 'red' : 'cream'} flash={flash}/>
    <Panel x={662} y={462} w={212} h={86} n={at ? 60 : lf} tone={at ? 'gold' : 'cream'} glow={glow}/>
  </>;
};
const Sign: React.FC = () => <div style={{position: 'absolute', left: SHAFT_X - 128, top: ty(980) - 24, width: 226, height: 48, whiteSpace: 'nowrap', borderRadius: 12,
  background: '#2A1416', boxShadow: 'inset 0 0 0 4px #E5533D, 0 6px 12px #00000088', filter: 'url(#yarnPatch)', textAlign: 'center',
  fontFamily: SANS, fontSize: 26, lineHeight: '48px', letterSpacing: 3, color: '#FF7A62'}}>SHORTCUT ▲</div>;

const Labels: React.FC<{t: number}> = ({t}) => {
  const win = c01((t - T.roof) / 0.5), lose = c01((t - T.crash) / 0.3);
  return <>
    {([['HARAM', TX.labelHaramAr, SHAFT_X, '#FF6A55', lose], ['HALAL', TX.labelHalalAr, tx(645), '#FFD46A', win]] as const).map(([en, ar, x, col, g]) =>
      <div key={en} style={{position: 'absolute', left: x - 200, width: 400, top: 1372, textAlign: 'center'}}>
        <div style={{position: 'absolute', left: 200 - 128, width: 236, top: -6, height: 118, borderRadius: 28, background: 'linear-gradient(180deg, #1D1A24d8, #15131Bd8)',
          boxShadow: `0 8px 16px #00000077, inset 0 0 0 4px ${col}55`, filter: 'url(#yarnPatch)'}}/>
        <div style={{position: 'relative', fontFamily: SANS, fontSize: 44, letterSpacing: 7, lineHeight: 1, color: col, filter: 'url(#yarn)',
          textShadow: `0 3px 2px #00000099${g ? `, 0 0 ${26 * g}px ${col}` : ''}`}}>{en}</div>
        <div dir="rtl" lang="ar" style={{position: 'relative', fontFamily: AR, fontSize: 50, lineHeight: 1.25, marginTop: -2, color: col, filter: AR_PUFF}}>{ar}</div>
      </div>)}
  </>;
};

// ---- text over the scene ---------------------------------------------------------------------------------------------------------
const Title: React.FC<{t: number}> = ({t}) => <div style={{position: 'absolute', top: 226, left: 0, right: 0, textAlign: 'center'}}>
  <span style={{fontFamily: SANS, fontSize: 82, letterSpacing: 22, paddingLeft: 22, lineHeight: 1, filter: 'url(#yarn) drop-shadow(0 4px 3px #000000aa) drop-shadow(0 0 18px #FFC84C55)',
    ...gold(t, 0.35)}}>CAREER</span>
</div>;
const Stitched: React.FC<{t: number; t0: number; top: number; children: React.ReactNode}> = ({t, t0, top, children}) => {
  const u = ease((t - t0) / 0.5);
  if (u <= 0) return null;
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 54, lineHeight: 1.12, color: '#F7EFE3',
    textShadow: '0 3px 5px #000000cc, 0 0 16px #00000088', clipPath: `inset(-30% ${100 - 100 * u}% -30% 0)`, transform: `translateY(${6 * (1 - u)}px)`}}>
    {children}
  </div>;
};
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - c01((t - (T.line1 - 0.35)) / 0.3);
  if (o <= 0) return null;
  return <div style={{position: 'absolute', top: 324, left: 0, right: 0, textAlign: 'center', opacity: o, fontFamily: SERIF, fontStyle: 'italic', fontSize: 58,
    color: '#F7EFE3', textShadow: '0 3px 5px #000000cc'}}>the shortcut or the stairs?</div>;
};

// ---- the closing dust wipe -------------------------------------------------------------------------------------------------------------
const Wipe: React.FC<{t: number}> = ({t}) => {
  const k = bell(t, T.swap, 0.3);
  if (k <= 0) return null;
  return <>
    {Array.from({length: 16}, (_, i) => {
      const R = 300 + 260 * random(`wr${i}`);
      const x = -100 + 1280 * random(`wx${i}`) + 120 * (t - T.wipe), y = 300 + 1500 * random(`wy${i}`) - 260 * (t - T.wipe);
      return <div key={i} style={{position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', opacity: Math.min(1, k * 1.5),
        background: 'radial-gradient(closest-side, #D9CFC0f0 0%, #CFC4B4aa 55%, #CFC4B400 100%)', filter: 'blur(6px)'}}/>;
    })}
    <AbsoluteFill style={{background: '#CDC2B2', opacity: Math.min(0.97, k * 1.25)}}/>
  </>;
};

// ---- the scene at a scene time ts (the camera, the plate, the tower and everything on it) ----------------------------------------------
export const Scene: React.FC<{ts: number; t: number}> = ({ts, t}) => {
  const d = ts - T.crash;
  const sh = d > 0 && d < 0.45 ? 14 * Math.pow(1 - d / 0.45, 2) : 0;
  const shx = sh * Math.sin(d * 97), shy = sh * Math.cos(d * 71);
  const push = 1 + 0.02 * inout(ts / 11.5);
  return <AbsoluteFill style={{transformOrigin: '540px 1450px', transform: `translate(${shx}px, ${shy}px) scale(${push})`}}>
    <Img src={staticFile('plates/night.jpg')} style={{position: 'absolute', left: -65, top: -226 + 3 * Math.sin(t * 0.6), width: 1080 * 1.12, height: 1920 * 1.12}}/>
    <Fluff t={t}/>
    <Img src={staticFile('sprites/tower.png')} style={{position: 'absolute', left: X0, top: GY - 1237 * S, width: TW, height: 1237 * S,
      filter: 'drop-shadow(0 14px 20px #00000088)'}}/>
    <Beam t={ts}/>
    <Door t={ts}/>
    <Sign/>
    <Elevator t={ts}/>
    <Climber t={ts}/>
    {ts > T.crash && <Burst t={ts} t0={T.crash} x={SHAFT_X} y={GY - 10} w={170} n={34} cols={['#B9AFA3', '#8E857C', '#D8CDBE', '#E5533D']}
      seed="crash" up={620} size={14} dur={1.0} clouds={7} cloud="#CFC4B4" spread={520}/>}
    <Motes t={ts}/>
    <Counters t={ts}/>
    <Labels t={ts}/>
  </AbsoluteFill>;
};

export const HalalKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const ts = t < T.swap ? t : 0;                 // after the dust wipe peaks, the opening frame comes back (a loop)
  const end = t < T.swap ? 1 : 0;
  return <AbsoluteFill style={{background: '#0E1430', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/><ArDefs/><ThreadDefs/>
    <Scene ts={ts} t={t}/>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #0B0F2499 0px, #0B0F2444 420px, #0B0F2400 560px)', pointerEvents: 'none'}}/>
    <Title t={t}/>
    {end ? <>
      <Stitched t={t} t0={T.line1} top={302}>Every floor you climb</Stitched>
      <Stitched t={t} t0={T.line2} top={362}>in halal is <span style={{color: '#FFD46A', textShadow: '0 3px 5px #000000cc, 0 0 20px #FFC84C99'}}>yours.</span></Stitched>
    </> : null}
    <Hook t={end ? t : 0}/>
    <Wipe t={t}/>
  </AbsoluteFill>;
};
