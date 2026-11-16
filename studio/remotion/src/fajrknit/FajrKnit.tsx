// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): the Fajr "needle and candle"
// reminder (reference DfQMDFSufy_ by @kaynlkhir, 28.35 s, job wife-DfQMDFSufy_) rebuilt in knitted yarn, 2D motion graphics only
// (no Blender). Same audio, untouched, and the same clock (beats.json, measured on the reference's own track): long ago an old man
// pushes a needle into his candle (the tap at 1.53 s) and lies down; the wax melts down to it, the needle drops onto the brass
// dish (12.98 s, bounce 13.37 s) and wakes him for Fajr (cut 15.43 s); today (cut 18.33 s) four phones buzz on the blanket
// (the reference's five vibration bursts) and the young man sleeps on; then Sahih Muslim 725a.
// "1760" from the reference is not verifiable, so the label says LONG AGO. A generic old man, never a prophet.
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Needle as SewNeedle, YarnDefs} from '../asmaknit/AsmaKnit';
import BT from './beats.json';
import META from './meta.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = BT.frames;
export const [C1, C2, C3] = BT.cuts;
export const ARQ = 'AmiriQ, serif', ROUND = 'Fredoka, sans-serif', SERIF = 'KnitSerif, serif';
export const INK = '#4A1E10', CLAY = '#B85A2E', CREAM = '#FFF3DC', GOLD = '#F2C04E';
export const PUFF = 'url(#yarn) drop-shadow(0 3px 2px #1A0804cc) drop-shadow(0 10px 16px #000000aa)';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const v = c01(x); return v * v * (3 - 2 * v); };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const spring = (x: number) => (x <= 0 ? 0 : x > 1.4 ? 1 : 1 - Math.exp(-x * 8) * Math.cos(x * 12));
type M = {w: number; h: number; hand?: {x: number; y: number}};
const SP = META as unknown as Record<string, M>;

export const Sprite: React.FC<{n: string; x: number; y: number; h: number; o?: number; rot?: number; origin?: string; style?: React.CSSProperties}> =
  ({n, x, y, h, o = 1, rot = 0, origin = '50% 100%', style}) => {
    const w = (h * SP[n].w) / SP[n].h;
    return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: o,
      transform: `rotate(${rot}deg)`, transformOrigin: origin, ...style}}/>;
  };

// --- the candle on its brass dish --------------------------------------------------------------------------------------
export const CX = 260, CW = 180, CH = (CW * SP.candle.h) / SP.candle.w, CBOT = 1380, NY = 1188;
const CAP = 0.28 * CH;                                        // wick and drip collar ride down as the wax melts
const WAX = 0.07 * CH;                                        // wax surface below the sprite top
export const topY = (t: number) => {
  const t0 = CBOT - CH, met = NY - WAX - 2;                   // met: the wax surface reaches the needle
  if (t < C1) return lerp(t0, t0 + 40, t / C1);
  if (t < BT.drop) return lerp(t0 + 40, met, inout((t - C1) / (BT.drop - 0.05 - C1)));
  return met + Math.min(26, (t - BT.drop) * 5);
};
const Flame: React.FC<{t: number; x: number; y: number; s?: number; fast?: number}> = ({t, x, y, s = 1, fast = 1}) => {
  const k = t * fast;
  const fl = 1 + 0.07 * Math.sin(k * 13) + 0.05 * Math.sin(k * 29 + 1) + 0.04 * (random(`fl${Math.floor(k * 12)}`) - 0.5);
  const sk = 4 * Math.sin(k * 5.3) + 2 * Math.sin(k * 11);
  return <>
    <div style={{position: 'absolute', left: x - 420 * s, top: y - 460 * s, width: 840 * s, height: 840 * s, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFD27A88, #FF9A3A33 45%, #FF9A3A00)', opacity: 0.75 + 0.25 * (fl - 1) * 5}}/>
    <svg width={80 * s} height={130 * s} viewBox="0 0 80 130" style={{position: 'absolute', left: x - 40 * s, top: y - 118 * s, overflow: 'visible',
      transform: `scaleY(${fl}) skewX(${sk}deg)`, transformOrigin: '50% 92%', filter: 'blur(0.6px)'}}>
      <defs><radialGradient id="fg" cx="50%" cy="75%" r="65%"><stop offset="0" stopColor="#FFFFFF"/><stop offset="0.35" stopColor="#FFF0B0"/>
        <stop offset="0.7" stopColor="#FFB040"/><stop offset="1" stopColor="#FF7A1A" stopOpacity="0"/></radialGradient></defs>
      <path d="M40 4 C 52 40, 68 70, 62 96 C 58 116, 22 116, 18 96 C 12 70, 28 40, 40 4 Z" fill="url(#fg)"/>
      <ellipse cx={40} cy={102} rx={9} ry={12} fill="#6A8CFF" opacity={0.55}/>
    </svg>
  </>;
};
export const Candle: React.FC<{t: number; fast?: number}> = ({t, fast = 1}) => {
  const top = topY(t), bodyTop = top + CAP, bodyH = CBOT - bodyTop, k = CW / SP.candle.w;
  const pool = lerp(110, 170, c01((t - C1) / (BT.drop - C1)));
  return <>
    <Sprite n="plate" x={CX - 230} y={CBOT - 82} h={(460 * SP.plate.h) / SP.plate.w}/>
    <div style={{position: 'absolute', left: CX - pool, top: CBOT - 22, width: pool * 2, height: 40, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #FFF6E0, #EADBB8 70%, #EADBB800)', filter: 'url(#yarn)'}}/>
    <div style={{position: 'absolute', left: CX - CW / 2, top: bodyTop, width: CW, height: bodyH, overflow: 'hidden'}}>
      <Img src={staticFile('sprites/candle.png')} style={{position: 'absolute', left: 0, top: bodyH - CH, width: CW, height: CH}}/>
    </div>
    <div style={{position: 'absolute', left: CX - CW / 2, top, width: CW, height: CAP + 24, overflow: 'hidden',
      WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 72%, #0000 100%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 72%, #0000 100%)'}}>
      <Img src={staticFile('sprites/candle.png')} style={{position: 'absolute', left: 0, top: 0, width: CW, height: SP.candle.h * k}}/>
    </div>
    <Flame t={t} x={CX + 1} y={top + 0.05 * CH} fast={fast}/>
  </>;
};

// --- the needle: pushed into the wax, then dropped onto the dish -------------------------------------------------------
const NL = 250;
export const needlePose = (t: number) => {
  // tip x, y, rotation (deg); the eye is NL to the right of the tip
  if (t < BT.needle) { const p = c01((t - 0.55) / (BT.needle - 0.55)); return {x: lerp(372, 222, p * p), y: NY, r: 0}; }
  if (t < BT.drop) return {x: 222, y: NY, r: 0};
  const restY = CBOT + 30, restX = 205;
  const HIT = BT.drop + 0.14;
  if (t < HIT) { const p = (t - BT.drop) / 0.14; return {x: lerp(222, restX, p), y: lerp(NY, restY, p * p), r: lerp(0, -9, p)}; }
  if (t < BT.bounce) { const p = (t - HIT) / (BT.bounce - HIT); return {x: restX + 6 * p, y: restY - 30 * 4 * p * (1 - p), r: -9 + 12 * Math.sin(p * Math.PI)}; }
  const p = c01((t - BT.bounce) / 0.4);
  return {x: restX + 6, y: restY, r: -9 + 6 * (1 - p) * Math.sin(p * 18) + 6 * p};
};
export const SteelNeedle: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) =>
  <svg width={NL + 20} height={30} viewBox={`0 0 ${NL + 20} 30`} style={{position: 'absolute', left: x, top: y - 15, overflow: 'visible',
    transform: `rotate(${r}deg)`, transformOrigin: `${NL / 2}px 15px`, filter: 'drop-shadow(0 3px 3px #000000aa)'}}>
    <defs><linearGradient id="stl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="0.5" stopColor="#B9C0CA"/>
      <stop offset="1" stopColor="#5E6670"/></linearGradient></defs>
    <path d={`M0 15 L${NL - 14} 11 Q${NL} 15 ${NL - 14} 19 Z`} fill="url(#stl)"/>
    <ellipse cx={NL - 16} cy={15} rx={7} ry={2} fill="#2A1A10"/>
    <path d={`M${NL - 8} 15 C ${NL + 20} 0, ${NL + 30} 30, ${NL + 60} 18`} stroke="#C9302C" strokeWidth={3.5} fill="none" strokeLinecap="round"/>
  </svg>;
const Ting: React.FC<{t: number; t0: number; x: number; y: number; big?: number}> = ({t, t0, x, y, big = 1}) => {
  const p = (t - t0) / 0.7;
  if (p < 0 || p > 1) return null;
  return <>{[0, 0.18, 0.36].map((d, i) => { const q = c01((p - d) / (1 - d)); if (q <= 0) return null;
    const r = (40 + 260 * ease(q)) * big;
    return <div key={i} style={{position: 'absolute', left: x - r, top: y - r * 0.42, width: 2 * r, height: 0.84 * r, borderRadius: '50%',
      border: `${5 - 3 * q}px dashed ${GOLD}`, opacity: (1 - q) * 0.9, filter: 'drop-shadow(0 0 8px #FFD36A)'}}/>; })}
    {Array.from({length: 10}, (_, j) => { const a = -Math.PI * (0.1 + 0.8 * random(`tg${t0}${j}`)), d = (30 + 160 * ease(p)) * big;
      return <div key={`s${j}`} style={{position: 'absolute', left: x + Math.cos(a) * d - 5, top: y + Math.sin(a) * d - 5 + 140 * p * p, width: 10, height: 10,
        borderRadius: '50%', background: 'radial-gradient(circle, #FFFBE0, #FFC24A 60%, #FFC24A00)', opacity: 1 - p}}/>; })}
  </>;
};

// --- floating warm motes -----------------------------------------------------------------------------------------------
const Motes: React.FC<{t: number; x: number; y: number; n?: number; col?: string; spread?: number}> = ({t, x, y, n = 14, col = '#FFD88A', spread = 420}) =>
  <>{Array.from({length: n}, (_, i) => { const r = random(`m${i}`), ph = (t * (0.05 + 0.05 * r) + random(`mp${i}`)) % 1;
    return <div key={i} style={{position: 'absolute', left: x + (random(`mx${i}`) - 0.5) * spread + 30 * Math.sin(t * 0.7 + i), top: y - ph * 700,
      width: 5 + 6 * r, height: 5 + 6 * r, borderRadius: '50%', background: col, opacity: 0.55 * Math.sin(Math.PI * ph), filter: 'blur(1.5px)'}}/>; })}</>;

// --- the old man's room ------------------------------------------------------------------------------------------------
const cam = (t: number) => {
  // returns scale and the translation that puts the focus point at the target on screen (transform-origin 0 0)
  let s = 1, f = {x: 540, y: 1100}, g = {x: 540, y: 1100};
  if (t < C1) s = lerp(1, 1.06, t / C1);
  else if (t < C2) { s = lerp(1.8, 1.98, (t - C1) / (C2 - C1)); f = {x: 300, y: 1230}; g = {x: 420, y: 1060}; }
  else { s = lerp(1.04, 1.0, inout((t - C2) / (C3 - C2))); }
  let sx = 0, sy = 0;
  for (const h of [BT.drop + 0.14, BT.bounce]) { const d = t - h; if (d >= 0 && d < 0.35) { const a = (h === BT.bounce ? 4 : 9) * (1 - d / 0.35);
    sx += a * Math.sin(d * 90); sy += a * Math.cos(d * 70); } }
  return {s, tx: g.x - s * f.x + sx, ty: g.y - s * f.y + sy};
};
const OLD_H = 560;
export const RoomScene: React.FC<{t: number}> = ({t}) => {
  const c = cam(t), np = needlePose(t), close = t >= C1 && t < C2, dawn = t >= C2 ? inout((t - C2) / 2.4) : 0;
  const ks = OLD_H / SP.oldsit.h, hand = SP.oldsit.hand!;
  const eyeX = np.x + NL - 10;
  const lean = t < BT.needle ? 0 : -18 * ease((t - BT.needle - 0.4) / 1.2);
  const sitX = eyeX + 4 - hand.x * ks + lean, sitY = NY - hand.y * ks + (t < BT.needle ? 0 : 4 * ease((t - BT.needle - 0.4) / 1.2));
  const sitO = 1 - c01((t - 4.7) / 0.7), sleepO = c01((t - 4.95) / 0.7);
  const breathe = 1 + 0.012 * Math.sin(t * 2.2);
  const startle = t > BT.drop + 0.14 && t < C2 ? spring((t - BT.drop - 0.14) / 0.6) : 0;
  const prayIn = t >= C2 ? spring((t - C2) / 0.7) : 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#140A06'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${c.tx}px, ${c.ty}px) scale(${c.s})`}}>
      <Img src={staticFile('room.jpg')} style={{position: 'absolute', left: -20, top: -20, width: 1120, height: 1990, filter: close ? 'blur(2.2px)' : 'none',
        transform: `translateX(${-6 * Math.sin(t * 0.3)}px)`}}/>
      {/* night grade: dark navy everywhere but the candle's pool of light; it lifts toward dawn */}
      <div style={{position: 'absolute', inset: -400, mixBlendMode: 'multiply',
        background: `radial-gradient(circle at ${CX + 400}px ${topY(t) + 400}px, #FFFFFF 0px, #FFE2B0 ${180 + 40 * dawn}px, ${dawn > 0 ? '#8C88A8' : '#343A66'} ${760 + 500 * dawn}px, #1C1E3A 1500px)`}}/>
      {/* dawn through the shutter gap */}
      {dawn > 0 ? <>
        <div style={{position: 'absolute', left: 220, top: 380, width: 44, height: 440, background: 'linear-gradient(180deg, #9FC2FF, #FFD7A8)', opacity: dawn, filter: 'blur(6px)', mixBlendMode: 'screen'}}/>
        <div style={{position: 'absolute', left: 120, top: 420, width: 900, height: 1500, opacity: 0.5 * dawn, mixBlendMode: 'screen', filter: 'blur(18px)',
          background: 'linear-gradient(160deg, #FFE0B8aa 0%, #FFE0B800 60%)', clipPath: 'polygon(14% 0, 20% 0, 100% 78%, 62% 100%)'}}/>
        <Motes t={t} x={520} y={1300} n={12} col="#FFF0D0" spread={500}/>
      </> : null}
      {sleepO > 0 && t < C2 ? <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${startle * -6}px, ${-14 * Math.sin(startle * Math.PI)}px)`}}>
        <Sprite n="oldsleep" x={468} y={1592 - 300 * breathe} h={300 * breathe} o={sleepO}/></div> : null}
      {sitO > 0 ? <Sprite n="oldsit" x={sitX} y={sitY} h={OLD_H} o={sitO} rot={lean * 0.12} origin="60% 100%"/> : null}
      {t >= C2 ? <Sprite n="oldpray" x={640 - (720 * SP.oldpray.w / SP.oldpray.h) / 2} y={1610 - 720 * (0.97 + 0.03 * prayIn)} h={720 * (0.97 + 0.03 * prayIn)}
        rot={0.6 * Math.sin(t * 1.3)}/> : null}
      <Candle t={t} fast={close ? 1.8 : 1}/>
      <SteelNeedle x={np.x} y={np.y} r={np.r}/>
      <Ting t={t} t0={BT.drop + 0.14} x={np.x + NL / 2} y={CBOT + 30} big={0.8}/>
      <Ting t={t} t0={BT.bounce} x={np.x + NL / 2} y={CBOT + 30} big={0.55}/>
      {t < C2 ? <Motes t={t} x={CX} y={topY(t) - 20} n={10} spread={260}/> : null}
      {sleepO > 0 && t < BT.drop ? <Zzz t={t} x={560} y={1300} o={sleepO}/> : null}
    </div>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #00000000 55%, #00000088 100%)'}}/>
  </AbsoluteFill>;
};
const Zzz: React.FC<{t: number; x: number; y: number; o?: number; col?: string}> = ({t, x, y, o = 1, col = CREAM}) =>
  <>{[0, 1, 2].map((i) => { const ph = (t * 0.45 + i / 3) % 1;
    return <div key={i} style={{position: 'absolute', left: x + 70 * ph + 10 * Math.sin(t * 2 + i), top: y - 200 * ph, fontFamily: ROUND, fontSize: 38 + 34 * ph,
      color: col, opacity: o * Math.sin(Math.PI * ph) * 0.9, filter: PUFF}}>z</div>; })}</>;

// --- today: the bedroom and four buzzing phones ------------------------------------------------------------------------
export const PHONES = [{x: 250, y: 640, r: -18}, {x: 760, y: 560, r: 14}, {x: 430, y: 930, r: 6}, {x: 860, y: 1010, r: -10}];
const PH_W = 112, PH_H = (PH_W * SP.phone.h) / SP.phone.w;
export const buzzing = (t: number) => BT.buzz.some(([a, b]) => t >= a && t <= b);
const Bell: React.FC = () => <svg width={40} height={40} viewBox="0 0 40 40"><path d="M20 5 C12 5 10 12 10 18 L10 25 L6 29 L34 29 L30 25 L30 18 C30 12 28 5 20 5 Z" fill="#2B3A6A"/>
  <circle cx={20} cy={33} r={3.5} fill="#2B3A6A"/></svg>;
export const Phone: React.FC<{t: number; i: number; p: {x: number; y: number; r: number}}> = ({t, i, p}) => {
  const on = buzzing(t), phs = i * 1.7;
  const dx = on ? 6 * Math.sin(t * 2 * Math.PI * 23 + phs) : 0, dr = on ? 2.5 * Math.sin(t * 2 * Math.PI * 17 + phs) : 0;
  const lit = t >= C3 + 0.6 + i * 0.1 ? 1 : 0;
  return <div style={{position: 'absolute', left: p.x - PH_W / 2 + dx, top: p.y - PH_H / 2, width: PH_W, height: PH_H, transform: `rotate(${p.r + dr}deg)`}}>
    {lit ? <div style={{position: 'absolute', left: -120, top: -120, width: PH_W + 240, height: PH_H + 240, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #BFD8FFaa, #BFD8FF00)', opacity: on ? 0.9 : 0.45}}/> : null}
    <Img src={staticFile('sprites/phone.png')} style={{position: 'absolute', inset: 0, width: PH_W, height: PH_H, filter: 'drop-shadow(0 6px 6px #00000088)'}}/>
    <div style={{position: 'absolute', left: PH_W * 0.12, top: PH_H * 0.09, width: PH_W * 0.76, height: PH_H * 0.82, borderRadius: 10, opacity: lit ? (on ? 1 : 0.8) : 0,
      background: 'linear-gradient(180deg, #F4F8FF, #C9DCFF)', boxShadow: '0 0 18px #CFE0FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <Bell/>
      <div style={{fontFamily: ROUND, fontSize: 30, color: '#2B3A6A', letterSpacing: 1}}>5:10</div>
    </div>
    {on ? [-1, 1].map((s) => <svg key={s} width={60} height={PH_H} style={{position: 'absolute', left: s < 0 ? -58 : PH_W - 2, top: 0, overflow: 'visible'}}>
      {[0, 1].map((k) => <path key={k} d={s < 0 ? `M${44 - k * 18} ${PH_H * 0.3} Q${30 - k * 18} ${PH_H / 2} ${44 - k * 18} ${PH_H * 0.7}` :
        `M${16 + k * 18} ${PH_H * 0.3} Q${30 + k * 18} ${PH_H / 2} ${16 + k * 18} ${PH_H * 0.7}`} stroke="#E6EEFF" strokeWidth={5} fill="none" strokeLinecap="round"
        strokeDasharray="10 8" opacity={0.6 + 0.4 * Math.sin(t * 40 + k)}/>)}
    </svg>) : null}
  </div>;
};
export const BedScene: React.FC<{t: number}> = ({t}) => {
  const u = t - C3, s = lerp(1.0, 1.07, c01(u / 10)), br = 1 + 0.006 * Math.sin(t * 1.9);
  const shake = buzzing(t) ? 1.2 * Math.sin(t * 2 * Math.PI * 23) : 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#0A1022'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '520px 700px', transform: `translateX(${shake}px) scale(${s})`}}>
      <Img src={staticFile('bedroom.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${br})`, transformOrigin: '520px 300px'}}/>
      <AbsoluteFill style={{mixBlendMode: 'multiply', background: 'radial-gradient(circle at 140px 120px, #FFFFFF 0px, #C8CCE8 300px, #4A5C90 900px, #26305A 1500px)'}}/>
      {PHONES.map((p, i) => <Phone key={i} t={t} i={i} p={p}/>)}
      <Zzz t={t} x={600} y={250} o={0.9} col="#DCE6FF"/>
    </div>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #00000000 55%, #00000099 100%)'}}/>
  </AbsoluteFill>;
};

// --- text --------------------------------------------------------------------------------------------------------------
/** a block stitched in by a needle running left to right (right to left for Arabic) */
export const Stitch: React.FC<{t: number; t0: number; out?: number; y: number; rtl?: boolean; dur?: number; children: React.ReactNode}> =
  ({t, t0, out = Infinity, y, rtl = false, dur = 0.6, children}) => {
    if (t < t0 || t > out + 0.3) return null;
    const p = t0 <= 0 ? 1 : ease((t - t0) / dur), o = 1 - c01((t - out) / 0.3), X = 100 * (1 - p);
    return <>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o,
        clipPath: rtl ? `inset(-40% 0 -40% ${X}%)` : `inset(-40% ${X}% -40% 0)`}}>{children}</div>
      {p > 0 && p < 1 ? <SewNeedle x={rtl ? 1080 * (1 - p) : 1080 * p} y={y + 50} o={Math.sin(Math.PI * p)}/> : null}
    </>;
  };
const Line: React.FC<{children: React.ReactNode; size?: number; col?: string}> = ({children, size = 66, col = CREAM}) =>
  <div style={{display: 'inline-block', maxWidth: 880, fontFamily: SERIF, fontStyle: 'italic', fontSize: size, lineHeight: 1.12, color: col,
    textShadow: '0 2px 2px #000000cc, 0 6px 18px #000000cc'}}>{children}</div>;
export const Label: React.FC<{children: React.ReactNode; col?: string}> = ({children, col = GOLD}) =>
  <div style={{fontFamily: ROUND, fontSize: 92, letterSpacing: 10, color: col, filter: PUFF, lineHeight: 1}}>{children}</div>;

/** the running-stitch seam that opens each new scene from left to right */
const Seam: React.FC<{t: number; t0: number; children: React.ReactNode}> = ({t, t0, children}) => {
  const p = inout((t - t0) / 0.42);
  if (t < t0) return null;
  const x = 1080 * p;
  return <>
    <div style={{position: 'absolute', inset: 0, clipPath: p >= 1 ? 'none' : `polygon(0 0, ${x + 60}px 0, ${x - 60}px 1920px, 0 1920px)`}}>{children}</div>
    {p < 1 ? <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={x + 60} y1={0} x2={x - 60} y2={1920} stroke={GOLD} strokeWidth={9} strokeDasharray="34 22" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
    </svg> : null}
    {p < 1 ? <SewNeedle x={x} y={960} o={1}/> : null}
  </>;
};

export const FajrScene: React.FC<{t: number}> = ({t}) => {
  const room = <RoomScene t={t}/>;
  return <>
    {t < C3 + 0.5 ? room : null}
    {t >= C3 ? <Seam t={t} t0={C3}><BedScene t={t}/></Seam> : null}
  </>;
};

export const FajrKnit: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const end = 23.6;
  return <AbsoluteFill style={{background: '#000'}}>
    <YarnDefs/>
    <FajrScene t={t}/>
    {/* the old man's story, top third */}
    {t < C3 ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #000000aa 0px, #00000055 520px, #00000000 760px)'}}/> : null}
    <Stitch t={t} t0={0} out={C3 - 0.2} y={262}><Label>LONG AGO</Label></Stitch>
    <Stitch t={t} t0={0} out={4.6} y={392}><Line>No alarm clock…<br/>just a needle and a candle</Line></Stitch>
    <Stitch t={t} t0={4.9} out={C1 - 0.25} y={392}><Line>He pushed the needle into the wax,<br/>and went to sleep.</Line></Stitch>
    <Stitch t={t} t0={C1 + 0.15} out={BT.drop - 0.05} y={392}><Line>When the wax melted down to it…</Line></Stitch>
    <Stitch t={t} t0={BT.drop + 0.12} out={C3 - 0.2} y={392}><Line>…the needle dropped,<br/>and woke him for <span style={{color: GOLD}}>Fajr</span>.</Line></Stitch>
    {/* today, bottom block (his face is at the top of the bedroom) */}
    {t >= C3 ? <AbsoluteFill style={{background: `linear-gradient(0deg, #000000cc 0px, #00000088 ${560}px, #00000000 ${820}px)`, opacity: c01((t - C3) / 0.4)}}/> : null}
    <Stitch t={t} t0={C3 + 0.2} out={end - 0.25} y={1240}><Label col="#BFD8FF">TODAY</Label></Stitch>
    <Stitch t={t} t0={BT.buzz[0][0] - 0.1} out={BT.buzz[2][0] - 0.2} y={1370}><Line>We have 4 phones buzzing…</Line></Stitch>
    <Stitch t={t} t0={BT.buzz[2][0]} out={end - 0.25} y={1370}><Line size={74}>…and we don&apos;t wake.</Line></Stitch>
    {t >= end ? <EndCard t={t} t0={end}/> : null}
  </AbsoluteFill>;
};

/** Sahih Muslim 725a, exactly as on sunnah.com (texts.json, checked by text.py) */
const EndCard: React.FC<{t: number; t0: number}> = ({t, t0}) => {
  const p = ease((t - t0) / 0.5);
  return <>
    <AbsoluteFill style={{background: '#06091Acc', opacity: p}}/>
    <div style={{position: 'absolute', left: 70, right: 70, top: 470, height: 900, borderRadius: 46, background: CREAM, opacity: p,
      transform: `translateY(${30 * (1 - p)}px) scale(${0.97 + 0.03 * p})`, boxShadow: `0 20px 50px #000000aa, inset 0 0 0 14px ${CREAM}, inset 0 0 0 19px ${CLAY}`,
      outline: `5px dashed ${CLAY}`, outlineOffset: -30}}/>
    <Stitch t={t} t0={t0 + 0.35} y={540}><div style={{fontFamily: ROUND, fontSize: 34, letterSpacing: 6, color: CLAY}}>THE PROPHET <span style={{fontFamily: ARQ, letterSpacing: 0, fontSize: 40}}>ﷺ</span> SAID</div></Stitch>
    <Stitch t={t} t0={t0 + 0.7} y={640} rtl dur={0.9}><div dir="rtl" style={{fontFamily: ARQ, fontSize: 70, lineHeight: 1.9, color: INK, padding: '0 40px', whiteSpace: 'nowrap',
      WebkitTextStroke: `1px ${INK}`}}>{TX.hadithAr}</div></Stitch>
    <Stitch t={t} t0={t0 + 1.5} y={1000}><div style={{padding: '0 150px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, lineHeight: 1.15, color: INK}}>
      “{TX.hadithEn}”</div></Stitch>
    <Stitch t={t} t0={t0 + 2.0} y={1240}><div style={{fontFamily: ROUND, fontSize: 32, letterSpacing: 3, color: CLAY}}>{TX.hadithRef.toUpperCase()}</div></Stitch>
    <div style={{position: 'absolute', top: 1430, left: 0, right: 0, textAlign: 'center', opacity: c01((t - t0 - 2.3) / 0.5)}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: CREAM, paddingBottom: 8, borderBottom: `4px dashed ${GOLD}`}}>@heal.ingthroughquran</span>
    </div>
  </>;
};
