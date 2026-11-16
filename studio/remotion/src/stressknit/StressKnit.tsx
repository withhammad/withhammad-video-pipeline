// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Read this to remove your
// stress" (reference DfWnDR6T1YX by @lelahmenjauh, 99.6 s, job wife-DfWnDR6T1YX) rebuilt in knitted yarn, 2D motion graphics
// only (no Blender). Same audio, untouched, and the same clock (beats.json: the frame each Name card appears in the reference).
// A crocheted doily dial walks through the 99 Names in the order of Jami` at-Tirmidhi 3507 (Al-Ahad #67 from Quran 112:1, see
// text.py); a knitting needle points at each Name, an amber yarn stitch runs round the dial, the STRESS meter (ten yarn-wrapped
// segments) drains from 100 to calm, and the little oil lamp in the middle grows warmer. Then a stitch seam opens the ending:
// a knitted young woman (from behind, generic, never a prophet) sits by the lamp: "Feeling tired? Come closer to Him."
// Every Arabic word is Amiri Quran and never goes through the yarn displacement filter, so no mark moves.
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Needle as SewNeedle, YarnDefs} from '../asmaknit/AsmaKnit';
import BT from './beats.json';
import META from './meta.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = BT.frames;
export const S = BT.starts, END = BT.end;
export const ARQ = 'AmiriQ, serif', LAT = 'AmiriL, serif', ROUND = 'Fredoka, sans-serif', SERIF = 'KnitSerif, serif';
export const CREAM = '#FFF3DC', GOLD = '#F2C04E', AMBER = '#F08A2E', NAVY = '#0B1230';
export const PUFF = 'url(#yarn) drop-shadow(0 3px 2px #050814cc) drop-shadow(0 10px 16px #000000aa)';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const v = c01(x); return v * v * (3 - 2 * v); };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const back = (x: number) => { const c = 1.6, u = c01(x) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
type M = {w: number; h: number};
const SP = META as unknown as Record<string, M>;
type Name = {n: number; ar: string; tr: string; en: string; src: string};
const NAMES = TX.names as Name[];

/** how many Names have started at t (0..99) and the time since the current one started */
export const at = (t: number) => {
  let k = 0;
  while (k < S.length && S[k] <= t) k++;
  return {k, u: k ? t - S[k - 1] : t};
};
const angleOf = (i: number) => -90 + (i * 360) / 99;            // label i (0-based), degrees, 0 = 3 o'clock
/** the needle's angle: steps to each new Name with a small overshoot */
const needleAngle = (t: number) => {
  const {k, u} = at(t);
  if (k <= 1) return angleOf(0);
  return lerp(angleOf(k - 2), angleOf(k - 1), back(u / 0.3));
};
/** stress value shown on the meter: 100 before the first Name, 0 after the 99th */
export const stress = (t: number) => Math.round(100 - (100 * at(t).k) / 99);
const progress = (t: number) => at(t).k / 99;

export const Sprite: React.FC<{n: string; x: number; y: number; h: number; o?: number; rot?: number; style?: React.CSSProperties}> =
  ({n, x, y, h, o = 1, rot = 0, style}) => {
    const w = (h * SP[n].w) / SP[n].h;
    return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o,
      transform: `rotate(${rot}deg)`, ...style}}/>;
  };

// --- the room behind everything: slow parallax drift, twinkling felt stars, a grade that warms as the stress drains ----------
export const Room: React.FC<{t: number}> = ({t}) => {
  const p = progress(t), s = 1.06 + 0.04 * (t / 100);
  return <AbsoluteFill style={{overflow: 'hidden', background: NAVY}}>
    <Img src={staticFile('room.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '540px 800px',
      transform: `translate(${-8 * Math.sin(t * 0.21)}px, ${-12 * Math.sin(t * 0.17)}px) scale(${s})`}}/>
    {Array.from({length: 16}, (_, i) => { const x = 60 + random(`sx${i}`) * 960, y = 40 + random(`sy${i}`) * 1840;
      const tw = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * (0.8 + random(`st${i}`)) + i * 2.1), 3);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 6, height: 6, borderRadius: '50%', background: '#FFE7B0',
        boxShadow: '0 0 10px 3px #FFD27A88', opacity: 0.55 * tw}}/>; })}
    <AbsoluteFill style={{mixBlendMode: 'soft-light', background: `radial-gradient(circle at 540px 820px, #FFB45A${Math.round(40 + 120 * p).toString(16)} 0px, #00000000 900px)`}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #00000000 50%, #000000a8 100%)'}}/>
  </AbsoluteFill>;
};

// --- floating warm motes from the lamp ----------------------------------------------------------------------------------------
export const Motes: React.FC<{t: number; x: number; y: number; n?: number; spread?: number; rise?: number; o?: number}> =
  ({t, x, y, n = 16, spread = 360, rise = 760, o = 1}) =>
    <>{Array.from({length: n}, (_, i) => { const r = random(`m${i}`), ph = (t * (0.06 + 0.06 * r) + random(`mp${i}`)) % 1;
      return <div key={i} style={{position: 'absolute', left: x + (random(`mx${i}`) - 0.5) * spread + 26 * Math.sin(t * 0.7 + i), top: y - ph * rise,
        width: 5 + 6 * r, height: 5 + 6 * r, borderRadius: '50%', background: '#FFD88A', opacity: o * 0.6 * Math.sin(Math.PI * ph), filter: 'blur(1.4px)'}}/>; })}</>;

// --- the lamp: sprite + breathing glow; brighter as the stress drains, a soft pulse on every Name ------------------------------
const LAMP_H = 210;
export const Lamp: React.FC<{t: number; x: number; y: number; h?: number; boost?: number}> = ({t, x, y, h = LAMP_H, boost = 0}) => {
  const {k, u} = at(t);
  const pulse = k ? Math.exp(-u * 5) : 0;
  const fl = 1 + 0.05 * Math.sin(t * 11) + 0.04 * Math.sin(t * 23 + 1) + 0.03 * (random(`fl${Math.floor(t * 10)}`) - 0.5);
  const g = Math.min(1.6, 0.45 + 0.55 * progress(t) + 0.25 * pulse + boost) * fl;
  const fy = y - h * 0.24;                                      // the felt flame sits a quarter of the way down the sprite
  return <>
    <div style={{position: 'absolute', left: x - 330 * g, top: fy - 330 * g, width: 660 * g, height: 660 * g, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFD27Acc, #FF9A3A44 45%, #FF9A3A00)', opacity: 0.85}}/>
    <Sprite n="lamp" x={x} y={y} h={h} style={{filter: `drop-shadow(0 8px 10px #000000aa) brightness(${0.85 + 0.25 * g})`}}/>
    <div style={{position: 'absolute', left: x - 28, top: fy - 40, width: 56, height: 70, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFFBE0, #FFC24A88 60%, #FFC24A00)', opacity: 0.5 + 0.4 * g, transform: `scaleY(${fl})`}}/>
  </>;
};

// --- the dial ---------------------------------------------------------------------------------------------------------------
export const DX = 540, DY = 820, DOILY = 750;
const R_IN = 206, R_STITCH = 184, R_TIP = 358;
const Ring: React.FC<{t: number}> = ({t}) => {
  const {k} = at(t);
  return <svg width={1080} height={1600} viewBox="-540 -800 1080 1600" style={{position: 'absolute', left: DX - 540, top: DY - 800, overflow: 'visible'}}>
    {NAMES.map((nm, i) => {
      const a = angleOf(i), left = a > 90 && a < 270, cur = i === k - 1, past = i < k - 1;
      const col = cur ? '#FFFFFF' : past ? GOLD : CREAM, op = cur ? 1 : past ? 0.92 : 0.32;
      return <text key={i} transform={left ? `rotate(${a + 180}) translate(${-R_IN}, 0)` : `rotate(${a}) translate(${R_IN}, 0)`}
        textAnchor={left ? 'end' : 'start'} dominantBaseline="middle" fontFamily={LAT} fontSize={cur ? 15.5 : 13.2} fill={col} opacity={op}
        style={cur ? {filter: 'drop-shadow(0 0 6px #FFC24A)'} : undefined}>{nm.tr}</text>;
    })}
  </svg>;
};
/** amber yarn stitched round the dial from 12 o'clock to the needle */
const Stitches: React.FC<{t: number}> = ({t}) => {
  const a = needleAngle(t) + 90;
  if (a <= 0.5) return null;
  const rad = (d: number) => ((d - 90) * Math.PI) / 180, r = R_STITCH;
  const x1 = r * Math.cos(rad(a)), y1 = r * Math.sin(rad(a));
  const d = `M 0 ${-r} A ${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  return <svg width={600} height={600} viewBox="-300 -300 600 600" style={{position: 'absolute', left: DX - 300, top: DY - 300, overflow: 'visible'}}>
    <path d={d} stroke="#00000066" strokeWidth={13} fill="none" strokeDasharray="20 11" strokeLinecap="round" transform="translate(2 4)"/>
    <path d={d} stroke={AMBER} strokeWidth={11} fill="none" strokeDasharray="20 11" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
  </svg>;
};
/** the knitting needle: knob at the centre side, tip at the current Name; gold sparks fly off the tip on every new Name */
const Hand: React.FC<{t: number}> = ({t}) => {
  const a = needleAngle(t), {k, u} = at(t), L = R_TIP - 140, h = (L * SP.needle.h) / SP.needle.w;
  const rad = (a * Math.PI) / 180, tx = DX + Math.cos(rad) * R_TIP, ty = DY + Math.sin(rad) * R_TIP;
  return <>
    <div style={{position: 'absolute', left: DX, top: DY - h / 2, width: L, height: h, transformOrigin: `0px ${h / 2}px`,
      transform: `rotate(${a}deg) translateX(140px)`, filter: 'drop-shadow(0 4px 4px #000000aa) drop-shadow(0 0 10px #FFB04A88)'}}>
      <Img src={staticFile('sprites/needle.png')} style={{width: L, height: h}}/>
    </div>
    {k && u < 0.6 ? Array.from({length: 9}, (_, j) => { const q = u / 0.6, b = rad + (random(`sp${k}${j}`) - 0.5) * 2.2, dd = 20 + 90 * ease(q) * (0.5 + random(`sd${k}${j}`));
      return <div key={j} style={{position: 'absolute', left: tx + Math.cos(b) * dd - 4, top: ty + Math.sin(b) * dd - 4 + 30 * q * q, width: 8, height: 8, borderRadius: '50%',
        background: 'radial-gradient(circle, #FFFBE0, #FFC24A 60%, #FFC24A00)', opacity: 1 - q}}/>; }) : null}
  </>;
};
export const Dial: React.FC<{t: number}> = ({t}) => {
  const fy = 5 * Math.sin(t * 0.6), sweep = (t * 9) % 360;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${3 * Math.sin(t * 0.4)}px, ${fy}px)`}}>
    <Sprite n="doily" x={DX} y={DY} h={DOILY} style={{filter: 'drop-shadow(0 18px 30px #000000cc)'}}/>
    {/* a slow light sweep across the wool */}
    <div style={{position: 'absolute', left: DX - DOILY / 2, top: DY - DOILY / 2, width: DOILY, height: DOILY, borderRadius: '50%', mixBlendMode: 'screen',
      background: `conic-gradient(from ${sweep}deg, #FFE2B000 0deg, #FFE2B022 30deg, #FFE2B000 70deg, #FFE2B000 360deg)`}}/>
    <Ring t={t}/>
    <Stitches t={t}/>
    <Hand t={t}/>
    <Lamp t={t} x={DX} y={DY + 6}/>
    <Motes t={t} x={DX} y={DY - 80} n={12} spread={200} rise={520}/>
  </div>;
};

// --- top: title and the STRESS meter ------------------------------------------------------------------------------------------
export const Label: React.FC<{children: React.ReactNode; col?: string; size?: number; ls?: number}> = ({children, col = GOLD, size = 64, ls = 8}) =>
  <div style={{fontFamily: ROUND, fontSize: size, letterSpacing: ls, color: col, filter: PUFF, lineHeight: 1}}>{children}</div>;
export const Meter: React.FC<{t: number; y: number}> = ({t, y}) => {
  const v = stress(t), calm = at(t).k >= 99, X = 150, W = 780, Hh = 46, seg = (W - 18) / 10;
  const {k, u} = at(t), bump = k ? Math.exp(-u * 6) : 0;
  return <div style={{position: 'absolute', left: 0, top: y, width: 1080, height: 120}}>
    <div style={{position: 'absolute', left: X, top: 0, fontFamily: ROUND, fontSize: 28, letterSpacing: 6, color: CREAM, opacity: 0.85}}>STRESS</div>
    <div style={{position: 'absolute', right: 1080 - X - W, top: -4, fontFamily: ROUND, fontSize: calm ? 34 : 36, letterSpacing: 2,
      color: calm ? '#9FE0C8' : AMBER, transform: `scale(${1 + 0.12 * bump})`, transformOrigin: '100% 50%'}}>{calm ? 'calm' : v}</div>
    <div style={{position: 'absolute', left: X, top: 46, width: W, height: Hh, borderRadius: 24, background: '#0A1028cc',
      boxShadow: `inset 0 0 0 4px #2B3A6A, 0 6px 14px #00000088`, outline: '3px dashed #3E5088', outlineOffset: -11}}/>
    {Array.from({length: 10}, (_, i) => { const f = c01((v - i * 10) / 10);
      if (f <= 0) return null;
      return <div key={i} style={{position: 'absolute', left: X + 9 + i * seg + 3, top: 46 + 8, width: (seg - 6) * f, height: Hh - 16, borderRadius: 12,
        background: `repeating-linear-gradient(115deg, ${AMBER} 0 7px, #C4621C 7px 10px, #FFB25A 10px 13px)`, filter: 'url(#yarn)'}}/>; })}
  </div>;
};

// --- bottom: the current Name -------------------------------------------------------------------------------------------------
const NameCard: React.FC<{t: number}> = ({t}) => {
  const {k, u} = at(t);
  if (!k || t >= END + 0.1) return null;
  const nm = NAMES[k - 1], p = ease(u / 0.24), q = ease((u - 0.05) / 0.3);
  const long = nm.ar.length > 14;
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1200, textAlign: 'center', fontFamily: ROUND, fontSize: 30, letterSpacing: 3, color: CREAM, opacity: 0.75}}>
      {k} / 99</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1226, textAlign: 'center', clipPath: `inset(-40% 0 -40% ${100 * (1 - p)}%)`}}>
      <div dir="rtl" style={{display: 'inline-block', fontFamily: ARQ, fontSize: long ? 76 : 92, lineHeight: '140px', color: GOLD, whiteSpace: 'nowrap',
        textShadow: '0 2px 2px #000000cc, 0 0 22px #FFB04A66, 0 8px 18px #000000aa'}}>{nm.ar}</div>
    </div>
    {/* a running stitch drawn under the Name, right to left like the Arabic */}
    <svg width={520} height={14} style={{position: 'absolute', left: 280, top: 1360}}>
      <line x1={520} y1={7} x2={520 - 520 * p} y2={7} stroke={AMBER} strokeWidth={6} strokeDasharray="18 10" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1384, textAlign: 'center', opacity: q, transform: `translateY(${10 * (1 - q)}px)`}}>
      <div style={{fontFamily: LAT, fontSize: 50, lineHeight: 1.1, color: CREAM, textShadow: '0 3px 10px #000'}}>{nm.tr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, lineHeight: 1.15, color: '#E9D9BC', marginTop: 2, textShadow: '0 3px 10px #000'}}>{nm.en}</div>
    </div>
  </>;
};

// --- the stitch seam that opens the ending ------------------------------------------------------------------------------------
const Seam: React.FC<{t: number; t0: number; children: React.ReactNode}> = ({t, t0, children}) => {
  if (t < t0) return null;
  const p = inout((t - t0) / 0.5), x = 1080 * p;
  return <>
    <div style={{position: 'absolute', inset: 0, clipPath: p >= 1 ? 'none' : `polygon(0 0, ${x + 60}px 0, ${x - 60}px 1920px, 0 1920px)`}}>{children}</div>
    {p < 1 ? <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={x + 60} y1={0} x2={x - 60} y2={1920} stroke={GOLD} strokeWidth={9} strokeDasharray="34 22" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
    </svg> : null}
    {p < 1 ? <SewNeedle x={x} y={960} o={1}/> : null}
  </>;
};
const Ending: React.FC<{t: number}> = ({t}) => {
  const u = t - END, a = ease((u - 0.5) / 0.6), b = ease((u - 1.6) / 0.6), c = ease((u - 2.7) / 0.6), girl = ease((u - 0.2) / 0.8);
  return <AbsoluteFill>
    <Room t={t}/>
    <AbsoluteFill style={{background: 'radial-gradient(circle at 765px 1080px, #FFB45A22 0px, #00000000 700px)'}}/>
    <Lamp t={t} x={765} y={1150} h={230} boost={0.35 + 0.08 * Math.sin(u * 1.6)}/>
    <Motes t={t} x={740} y={1090} n={18} spread={420} rise={700}/>
    <Sprite n="girl" x={480} y={1075 + 30 * (1 - girl)} h={440} o={girl} style={{filter: 'drop-shadow(0 10px 14px #000000aa)'}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: a, transform: `translateY(${16 * (1 - a)}px)`}}>
      <Label size={84} ls={6}>Feeling tired?</Label></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 450, textAlign: 'center', opacity: b, transform: `translateY(${16 * (1 - b)}px)`}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 76, color: CREAM, textShadow: '0 3px 12px #000'}}>Come <span style={{color: GOLD}}>closer</span> to Him.</div></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center', opacity: c}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: '#E9D9BC', textShadow: '0 3px 10px #000'}}>Slowly. That door is never locked.</div>
      <div style={{display: 'inline-block', marginTop: 18, fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: CREAM, paddingBottom: 6, borderBottom: `4px dashed ${GOLD}`}}>
        @heal.ingthroughquran</div>
    </div>
  </AbsoluteFill>;
};

export const DialScene: React.FC<{t: number}> = ({t}) => {
  const {k} = at(t);
  const hint = k < 4 ? 'Stressed? Pause and follow His 99 Names to the end' : 'Finish the dhikr. Say each Name in your heart.';
  return <AbsoluteFill>
    <Room t={t}/>
    <Dial t={t}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center'}}><Label size={58}>ASMA-UL-HUSNA</Label></div>
    <Meter t={t} y={300}/>
    <NameCard t={t}/>
    <div style={{position: 'absolute', left: 90, right: 90, top: 400, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic',
      fontSize: k < 4 ? 40 : 32, lineHeight: 1.15, color: k < 4 ? CREAM : '#CFC2AA', textShadow: '0 3px 10px #000'}}>{hint}</div>
  </AbsoluteFill>;
};

export const StressKnit: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <AbsoluteFill style={{background: '#000'}}>
    <YarnDefs/>
    {t < END + 0.6 ? <DialScene t={t}/> : null}
    <Seam t={t} t0={END}><Ending t={t}/></Seam>
  </AbsoluteFill>;
};
