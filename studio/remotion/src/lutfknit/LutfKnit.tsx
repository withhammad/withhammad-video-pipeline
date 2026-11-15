// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Grace of Allah" (لطف الله),
// the reference DfsTrK5or6t by @taddbeer_fx (28.5 s, job 82bcabef818a) rebuilt in knitted yarn. Same flow, same five near misses
// on the reference's clock, same soundtrack (wordless music and impact sounds; no recitation, so no Quran text over it):
//   1  0.00-5.33  a farmer naps against a wall of hay bales; his radio drops off the fence post, he gets up to fetch it, walks
//                 off, and the wall collapses where he sat (a real 3D knitted Blender plate with a rigid-body collapse)
//   2  5.33-11.2  a man asleep on the sofa; his glass falls and shatters, he gets up and leaves, the ceiling fan crashes onto the sofa
//   3 11.2-17.07  a mechanic under a car on stands; a spanner clatters down by his head, he rolls out, the car drops
//   4 17.07-22.8  a woman cooking; the light goes out, she goes to check, the pressure cooker explodes behind her
//   5 22.8-28.5   a boy on his phone; his keys slip off, he bends to pick them up, a bundle of beams lands where he would have been
// The reference shows the unseen care as a ghostly hand. Here it is a single gold thread (never a hand, never a figure): it
// slips in, loops the radio, the glass, the spanner, the lamp cord and the keys, gives one tug and is gone; on the last frame
// it circles the boy ("it surrounds you"). Every scene is a knitted diorama with its own palette; the people are amigurumi dolls
// (GPT Image 2) in stop-motion poses. On screen all the way: «لطف الله» / Grace of Allah and her handle; from the fifth story,
// the caption's own line «عناية الله لا تراها، لكنها تحيط بك» with its English. Arabic is never put through the yarn displacement filter.
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import G from './geom.json';
import SPR from './sprites.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = 855;            // 28.5 s (the reference: 854 frames, its audio 28.49 s)
export const SERIF = 'KnitSerif, serif';
export const ARB = 'AmiriB, Amiri, serif';
const SP = SPR as unknown as Record<string, [number, number]>;

// ---- the reference clock (s) -------------------------------------------------------------------------------------------
export const V2 = 160 / 30, V3 = 336 / 30, V4 = 512 / 30, V5 = 684 / 30, V5B = 730 / 30, V5C = 835 / 30;
const CUT1 = G.cut;                              // Blender shot 2 starts (frame 107)
const LAND1 = 146 / 30;                          // the bales' thump (4.90 s in the audio)

// ---- helpers -----------------------------------------------------------------------------------------------------------
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const easeIn = (x: number) => Math.pow(c01(x), 2.2);
export const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
const pop = (t: number, ts: number) => (t < ts ? 0 : 0.07 * Math.exp(-(t - ts) * 12) * Math.cos((t - ts) * 42));
const shake = (t: number, t0: number, amp: number, dur = 0.4): [number, number] => {
  const d = t - t0;
  if (d < 0 || d > dur) return [0, 0];
  const k = amp * Math.pow(1 - d / dur, 2);
  return [k * Math.sin(d * 97), k * Math.cos(d * 71)];
};
type P = [number, number];

// ---- a knitted doll or prop: (x, y) is the bottom centre, h the drawn height ------------------------------------------------
export const Sprite: React.FC<{n: string; x: number; y: number; h: number; flip?: boolean; rot?: number; o?: number; sq?: number;
  sh?: number; dark?: number; origin?: string; clip?: string}> = ({n, x, y, h, flip, rot = 0, o = 1, sq = 0, sh = 0, dark = 0, origin = '50% 100%', clip}) => {
  const [w0, h0] = SP[n];
  const w = (h * w0) / h0;
  if (o <= 0) return null;
  return <>
    {sh > 0 && <div style={{position: 'absolute', left: x - w * 0.55, top: y - h * 0.04, width: w * 1.1, height: Math.max(18, h * 0.08), borderRadius: '50%',
      background: 'radial-gradient(closest-side, #1A0D05aa, #1A0D0500)', opacity: sh * o}}/>}
    <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o, transformOrigin: origin,
      transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * (1 + sq)}, ${1 - sq})`, clipPath: clip,
      filter: `${dark ? `brightness(${1 - dark}) ` : ''}drop-shadow(0 8px 10px #00000050)`}}/>
  </>;
};

// ---- the gold thread: a twisted gold yarn that slips in, loops its target and is drawn back ----------------------------------
const catmull = (pts: P[], n = 10): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push([0, 1].map((j) => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)) as P);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
export const loop = (cx: number, cy: number, r: number, a0 = -90, turns = 1.15, squash = 0.75): P[] =>
  Array.from({length: 13}, (_, k) => { const a = ((a0 + (360 * turns * k) / 12) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * squash * Math.sin(a)] as P; });

export const ThreadDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>
  <filter id="tglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={7}/></filter>
  <filter id="tply" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="yarnPatch" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8 0.12" numOctaves={2} seed={9} result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale={4} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>;

/** a = tail, b = head, as fractions of the path length */
export const Thread: React.FC<{pts: P[]; a?: number; b: number; o?: number; w?: number; t: number}> = ({pts, a = 0, b, o = 1, w = 8, t}) => {
  if (b <= a + 0.002 || o <= 0) return null;
  const sm = catmull(pts);
  const L = [0];
  for (let i = 1; i < sm.length; i++) L.push(L[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
  const T = L[L.length - 1], A = a * T, B = b * T;
  const at = (s: number): P => {
    let i = 1;
    while (i < L.length - 1 && L[i] < s) i++;
    const u = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    return [lerp(sm[i - 1][0], sm[i][0], u), lerp(sm[i - 1][1], sm[i][1], u)];
  };
  const sub: P[] = [at(A)];
  for (let i = 0; i < sm.length; i++) if (L[i] > A && L[i] < B) sub.push(sm[i]);
  sub.push(at(B));
  const d = 'M ' + sub.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
  const [hx, hy] = sub[sub.length - 1];
  const tw = 0.5 + 0.5 * Math.sin(t * 30);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o, pointerEvents: 'none'}}>
    <path d={d} stroke="#FFC94D" strokeWidth={w + 16} opacity={0.42} filter="url(#tglow)" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <g filter="url(#tply)">
      <path d={d} stroke="#C98B22" strokeWidth={w + 2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} stroke="#F6C452" strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} stroke="#FFF3C8" strokeWidth={w * 0.38} strokeDasharray="7 11" strokeDashoffset={-t * 60} fill="none" strokeLinecap="round" opacity={0.9}/>
    </g>
    <circle cx={hx} cy={hy} r={18 + 6 * tw} fill="#FFE9A8" opacity={0.35} filter="url(#tglow)"/>
    <path d={`M ${hx} ${hy - 22} L ${hx + 5} ${hy - 5} L ${hx + 22} ${hy} L ${hx + 5} ${hy + 5} L ${hx} ${hy + 22} L ${hx - 5} ${hy + 5} L ${hx - 22} ${hy} L ${hx - 5} ${hy - 5} Z`}
      fill="#FFF8DC" opacity={0.75 + 0.25 * tw} transform={`rotate(${t * 90} ${hx} ${hy})`}/>
  </svg>;
};

/** gold sparkles around a point for a short while */
const Sparkles: React.FC<{t: number; t0: number; x: number; y: number; r?: number; n?: number; dur?: number; seed: string}> = ({t, t0, x, y, r = 90, n = 12, dur = 0.8, seed}) => {
  const d = t - t0;
  if (d < 0 || d > dur) return null;
  return <>{Array.from({length: n}, (_, k) => {
    const a = random(`${seed}a${k}`) * Math.PI * 2, rr = r * (0.3 + 0.9 * ease(d / dur)) * (0.5 + 0.5 * random(`${seed}r${k}`));
    const s = 8 + 14 * random(`${seed}s${k}`), o = Math.sin(Math.PI * c01(d / dur)) * (0.6 + 0.4 * Math.sin(d * 40 + k));
    return <div key={k} style={{position: 'absolute', left: x + rr * Math.cos(a) - s / 2, top: y + rr * Math.sin(a) - s / 2, width: s, height: s, opacity: o,
      background: 'radial-gradient(closest-side, #FFFBE8 0%, #FFD86B 45%, #FFD86B00 100%)', transform: `rotate(45deg)`, borderRadius: '30%'}}/>;
  })}</>;
};

/** a burst of wool: pompoms and yarn bits thrown up and falling back, plus soft fluff clouds */
export const Burst: React.FC<{t: number; t0: number; x: number; y: number; w: number; n?: number; cols: string[]; seed: string; up?: number;
  size?: number; dur?: number; clouds?: number; cloud?: string; spread?: number}> = ({t, t0, x, y, w, n = 40, cols, seed, up = 900, size = 26, dur = 1.1, clouds = 6, cloud = '#F4E9D6', spread = 700}) => {
  const d = t - t0;
  if (d < 0 || d > dur + 0.6) return null;
  return <>
    {Array.from({length: clouds}, (_, k) => {
      const cx = x + (random(`${seed}cx${k}`) - 0.5) * w, R = (90 + 120 * random(`${seed}cr${k}`)) * (0.4 + 1.1 * ease(d / 0.9));
      const o = 0.85 * (1 - c01((d - 0.3) / (dur + 0.2)));
      return <div key={`c${k}`} style={{position: 'absolute', left: cx - R, top: y - R * 0.9 - 60 * ease(d / 1.2), width: 2 * R, height: 1.6 * R, borderRadius: '50%', opacity: 0.75 * o,
        background: `radial-gradient(closest-side, ${cloud}cc 0%, ${cloud}77 45%, ${cloud}00 100%)`, filter: 'blur(4px)'}}/>;
    })}
    {Array.from({length: n}, (_, k) => {
      const dk = d - 0.09 * random(`${seed}d${k}`);           // staggered launch, so the bits never start as one row
      if (dk < 0 || dk > dur) return null;
      const x0 = x + (random(`${seed}x${k}`) - 0.5) * w, y0 = y + (random(`${seed}y${k}`) - 0.6) * 90;
      const vx = (random(`${seed}v${k}`) - 0.5) * spread, vy = -up * (0.35 + 0.65 * random(`${seed}u${k}`));
      const px = x0 + vx * dk, py = y0 + vy * dk + 0.5 * 2600 * dk * dk;
      const s = size * (0.45 + 1.1 * random(`${seed}s${k}`)), c = cols[k % cols.length], o = c01(dk / 0.04) * (1 - Math.pow(dk / dur, 3));
      const yarnBit = k % 3 === 0;
      return yarnBit
        ? <div key={k} style={{position: 'absolute', left: px - s, top: py - 3, width: 2 * s, height: 6, borderRadius: 3, background: c, opacity: o,
          transform: `rotate(${(random(`${seed}q${k}`) * 360 + dk * 500) % 360}deg)`, boxShadow: '0 1px 2px #00000055'}}/>
        : <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
          background: `radial-gradient(circle at 35% 30%, #ffffff40 0%, ${c} 38%, ${c} 100%)`, boxShadow: '0 2px 3px #00000055'}}/>;
    })}
  </>;
};

// ---- text: the label, her handle and the closing line ---------------------------------------------------------------------
const Patch: React.FC<{top: number; w: number; h: number; o?: number}> = ({top, w, h, o = 1}) => <div style={{position: 'absolute', top, left: 540 - w / 2, width: w, height: h,
  opacity: o, borderRadius: h / 2.2, background: 'linear-gradient(180deg, #3A1D3Fe6 0%, #2A1530e6 100%)', boxShadow: '0 10px 24px #00000066, inset 0 0 0 5px #5B3463',
  filter: 'url(#yarnPatch)'}}>
  <div style={{position: 'absolute', inset: 10, borderRadius: h / 2.6, border: '3px dashed #E2B04Fcc'}}/>
</div>;

export const Label: React.FC<{t: number; top?: number; s?: number}> = ({t, top = 252, s = 1}) => {
  const shimmer = ((t * 0.35) % 1) * 300 - 100;
  return <div style={{position: 'absolute', left: 0, right: 0, top, height: 200 * s, zIndex: 20}}>
    <Patch top={0} w={520 * s} h={196 * s}/>
    {/* the Arabic: Amiri Bold, gold, drop shadows only (no displacement filter: it would shift the letters) */}
    <div dir="rtl" style={{position: 'absolute', top: 2 * s, left: 0, right: 0, textAlign: 'center', fontFamily: ARB, fontWeight: 700, fontSize: 96 * s, lineHeight: 1.25,
      color: '#FFD46A', textShadow: '0 3px 0 #8A5A12, 0 6px 10px #000000aa, 0 0 26px #FFC84C66'}}>
      <span style={{backgroundImage: `linear-gradient(100deg, #E9A93A 0%, #FFD46A ${shimmer - 25}%, #FFF6D6 ${shimmer}%, #FFD46A ${shimmer + 25}%, #E9A93A 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: `${30 * s}px ${30 * s}px`}}>{TX.labelAr}</span>
    </div>
    <div style={{position: 'absolute', top: 124 * s, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 50 * s, lineHeight: 1,
      color: '#FBEFD8', textShadow: '0 3px 4px #000000aa'}}>{TX.labelEn}</div>
  </div>;
};

export const Handle: React.FC<{top: number; o?: number}> = ({top, o = 1}) => <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 20, opacity: o}}>
  <span style={{display: 'inline-block', fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: '#FFF3DA', letterSpacing: 1, padding: '4px 22px 8px',
    borderRadius: 30, background: '#2A1530b0', textShadow: '0 2px 3px #000000aa', borderBottom: '3px dashed #E2B04F'}}>@heal.ingthroughquran</span>
</div>;

const Line: React.FC<{t: number; t0: number; top: number}> = ({t, t0, top}) => {
  const d = t - t0;
  if (d < 0) return null;
  const rv = ease(d / 0.7), en = ease((d - 0.35) / 0.5);
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 20}}>
    <Patch top={0} w={960} h={176} o={ease(d / 0.3)}/>
    <div dir="rtl" style={{position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', fontFamily: ARB, fontWeight: 700, fontSize: 60, lineHeight: 1.45,
      color: '#FFF3DA', textShadow: '0 3px 6px #000000cc, 0 0 18px #FFC84C44', clipPath: `inset(-20% 0 -20% ${100 - 100 * rv}%)`}}>{TX.lineAr}</div>
    <div style={{position: 'absolute', top: 104, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, lineHeight: 1.1,
      color: '#FFD878', opacity: en, transform: `translateY(${8 * (1 - en)}px)`, textShadow: '0 2px 4px #000000cc'}}>{TX.lineEn}</div>
  </div>;
};

// =========================================================================================================================
// 1  the hay bales (Blender plate, frames 0-159)
// =========================================================================================================================
const S1: React.FC<{f: number; t: number}> = ({f, t}) => {
  const fr = Math.min(159, f);
  const seat = G.seat[fr], ppu = seat[2];
  const radio = G.radio[Math.min(fr, 26)];
  const [sx, sy] = shake(t, LAND1, 26, 0.5);
  const intro = 1 + 0.07 * (1 - ease(t / 0.7));         // the opening glides in
  let farmer: React.ReactNode = null;
  if (fr < CUT1) {
    const br = 0.01 * Math.sin(t * 3.2);
    if (t < 1.55) farmer = <Sprite n="farmer1" x={seat[0] + 0.05 * ppu} y={seat[1] + 0.05 * ppu} h={1.12 * ppu} sq={br} sh={0.9}/>;
    else if (t < 2.6) farmer = <Sprite n="farmer2" x={seat[0] + 0.22 * ppu} y={seat[1] + 0.05 * ppu} h={1.05 * ppu} sq={pop(t, 1.55) + br} sh={0.9}
      rot={-3 * ease((t - 1.9) / 0.5)}/>;
    else if (t < 3.0) farmer = <Sprite n="farmer3" x={seat[0] + 0.15 * ppu} y={seat[1] + 0.12 * ppu} h={1.62 * ppu} sq={pop(t, 2.6)} sh={0.9}/>;
    else {
      const u = seg(t, 3.0, CUT1 / 30);
      farmer = <Sprite n="farmer4" x={seat[0] + (0.3 + 1.6 * u) * ppu} y={seat[1] + (0.12 + 0.25 * u) * ppu - 10 * Math.abs(Math.sin(t * 9))} h={(1.58 + 0.12 * u) * ppu}
        sq={pop(t, 3.0)} sh={0.9}/>;
    }
  } else {
    const ex = G.exit[fr], u = seg(fr, CUT1, CUT1 + 9);
    if (u < 1) farmer = <Sprite n="farmer4" x={lerp(860, 1260, u)} y={ex[1] + 20 - 8 * Math.abs(Math.sin(t * 9))} h={1.6 * ex[2]} sh={0.7}/>;
  }
  // the thread: in from the top right, loops the radio, one tug (the radio wobbles off at frame 21) and back up
  const head = t < 1.0 ? ease(t / 0.62) : 1 - inout((t - 1.0) / 0.55);
  const tpts: P[] = [[1180, 260], [1000, 470], [radio[0] + 120, radio[1] - 160], ...loop(radio[0], radio[1] - 10, 0.2 * radio[2], -60)];
  const dark = 0;
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${intro})`, transformOrigin: '540px 1300px'}}>
    <Img src={staticFile(`blender/f${String(fr).padStart(4, '0')}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {farmer}
    {fr < 60 && <Thread pts={tpts} b={head} t={t} o={1 - seg(t, 1.45, 1.6)}/>}
    <Sparkles t={t} t0={0.55} x={radio[0]} y={radio[1]} r={110} n={14} seed="s1r"/>
    <Burst t={t} t0={41 / 30} x={G.radio[41][0]} y={G.radio[41][1] + 30} w={120} n={14} cols={['#C9A57A', '#E9D8B8', '#D23A33']} seed="b1r" up={500} size={18}
      dur={0.7} clouds={3} cloud="#D9C3A0"/>
    <Burst t={t} t0={LAND1} x={G.seat[146][0] - 60} y={G.seat[146][1] + 10} w={700} n={46} cols={['#E9C25A', '#F2D47E', '#CB9136', '#B5322E', '#F6EBD0']}
      seed="b1w" up={1100} size={30} dur={1.0} clouds={8} cloud="#CDB78A"/>
    {dark > 0 && <AbsoluteFill style={{background: '#000', opacity: dark}}/>}
  </AbsoluteFill>;
};

// =========================================================================================================================
// 2  the ceiling fan (5.33-11.2 s)
// =========================================================================================================================
const FAN_CRACK = 10.15, FAN_FALL = 10.33, FAN_LAND = 10.68;
const Fan: React.FC<{t: number}> = ({t}) => {
  if (t >= FAN_LAND) return null;
  const spinRate = t < FAN_FALL ? 430 : lerp(430, 180, seg(t, FAN_FALL, FAN_LAND));
  const ang = (t - V2) * spinRate;
  let dy = 0, tx = 56, ty = 0, sc = 1;
  if (t >= FAN_CRACK) { const u = t - FAN_CRACK; dy += 22 * ease(u / 0.06); ty = 9 * Math.sin(u * 45) * Math.exp(-u * 5); tx += 5 * Math.sin(u * 37); }
  if (t >= FAN_FALL) { const u = seg(t, FAN_FALL, FAN_LAND); dy += 640 * easeIn(u); tx = lerp(tx, 36, u); ty += 22 * u; sc = 1 + 0.25 * u; }
  const W = 760, cx = 540, cy = 612 + dy;
  return <>
    <div style={{position: 'absolute', left: cx - 13, top: 270 + dy, width: 26, height: cy - dy - 270 + 10, borderRadius: 10,
      background: 'linear-gradient(90deg, #4B2C17, #8A5A35 45%, #4B2C17)', boxShadow: '0 4px 8px #00000055'}}/>
    <div style={{position: 'absolute', left: cx - W / 2, top: cy - W / 2, width: W, height: W, perspective: '1300px'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${sc}) rotateX(${tx}deg) rotateY(${ty}deg)`, transformStyle: 'preserve-3d'}}>
        {[0, 7, 14].map((lag, k) => <Img key={k} src={staticFile('sprites/fan.png')} style={{position: 'absolute', inset: 0, width: W, height: W * 1093 / 1155,
          transform: `rotate(${ang - lag}deg)`, opacity: [1, 0.45, 0.25][k], filter: k === 0 ? 'drop-shadow(0 18px 14px #00000066)' : undefined}}/>)}
      </div>
    </div>
  </>;
};

const Crack: React.FC<{t: number}> = ({t}) => {
  if (t < FAN_CRACK || t >= FAN_LAND) return null;
  const u = ease((t - FAN_CRACK) / 0.12);
  return <svg width={1080} height={600} style={{position: 'absolute', left: 0, top: 0}}>
    <ellipse cx={540} cy={262} rx={110 * u} ry={46 * u} fill="#3B2418" opacity={0.92}/>
    {Array.from({length: 9}, (_, k) => { const x = 455 + k * 21, L = (40 + 60 * random(`ck${k}`)) * u;
      return <path key={k} d={`M ${x} 258 q ${8 * Math.sin(k)} ${L / 2} ${4 * Math.cos(k)} ${L}`} stroke={['#F4D8C0', '#E7A9A0', '#F7E8D6'][k % 3]} strokeWidth={6} fill="none" strokeLinecap="round"/>; })}
  </svg>;
};

const S2: React.FC<{t: number}> = ({t}) => {
  const after = t >= FAN_LAND;
  const [sx, sy] = shake(t, FAN_LAND, 28, 0.5);
  const push = 1 + 0.05 * seg(t, V2, V3) + 0.025 * ease((t - FAN_LAND) / 0.2) * (1 - seg(t, FAN_LAND + 0.2, V3));
  // the glass: looped and tugged off the side table, shatters on the rug at 6.87 s
  const GL = {x: 108, y: 1250};
  const gFall = seg(t, 6.6, 6.87);
  const gx = t < 6.4 ? GL.x : lerp(GL.x, GL.x + 34, seg(t, 6.4, 6.6)) + 60 * gFall, gy = GL.y + (t < 6.6 ? 0 : 330 * easeIn(gFall));
  const grot = t < 6.4 ? 0 : 18 * seg(t, 6.4, 6.6) + 140 * gFall;
  const thHead = t < 6.5 ? ease(seg(t, 5.38, 5.95)) : 1 - inout(seg(t, 6.5, 7.0));
  const tpts: P[] = [[-80, 640], [170, 820], [GL.x + 70, GL.y - 230], ...loop(GL.x, GL.y - 70, 62, 200)];
  let man: React.ReactNode = null;
  if (t < 7.83) {
    const stir = t > 7.15 ? 2.2 * Math.sin((t - 7.15) * 20) * Math.exp(-(t - 7.15) * 2) : 0;
    man = <Sprite n="man1" x={600} y={1272} h={196} rot={stir} sq={0.012 * Math.sin(t * 3)}/>;
  } else if (t < 8.6) man = <Sprite n="man2" x={480} y={1500} h={540} sq={pop(t, 7.83)} sh={0.8}/>;
  else if (t < 9.55) {
    const u = seg(t, 8.6, 9.55);
    man = <Sprite n="man3" x={lerp(430, -140, ease(u))} y={lerp(1540, 2010, u) - 12 * Math.abs(Math.sin(t * 8))} h={lerp(620, 1200, u)} sq={pop(t, 8.6)} sh={0.8}/>;
  } else if (t >= 10.82) {
    const u = ease(seg(t, 10.82, 11.05));
    man = <Sprite n="man4" x={lerp(-260, 120, u)} y={1960} h={1050} sq={pop(t, 10.82)}/>;
  }
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: '540px 1150px'}}>
    <Img src={staticFile(`plates/${after ? 'livingafter' : 'living'}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {/* warm window light breathing */}
    <div style={{position: 'absolute', left: 700, top: 500, width: 600, height: 900, mixBlendMode: 'screen', opacity: 0.22 + 0.05 * Math.sin(t * 1.3),
      background: 'radial-gradient(closest-side, #FFE2A8, #FFE2A800)'}}/>
    <Crack t={t}/>
    {!after && man}
    {t < 6.87 && <Sprite n="glass" x={gx} y={gy} h={118} rot={grot}/>}
    <Burst t={t} t0={6.87} x={GL.x + 60} y={GL.y + 330} w={120} n={20} cols={['#9FE0E6', '#CFF3F5', '#5FC2CC', '#FFFFFF']} seed="b2g" up={600} size={16} dur={0.7} clouds={0}/>
    <Sparkles t={t} t0={6.84} x={GL.x + 60} y={GL.y + 320} r={90} n={10} seed="s2g" dur={0.5}/>
    <Thread pts={tpts} b={thHead} t={t}/>
    <Sparkles t={t} t0={5.9} x={GL.x} y={GL.y - 70} r={100} n={12} seed="s2t"/>
    <Fan t={t}/>
    {after && man}
    <Burst t={t} t0={FAN_LAND} x={560} y={1250} w={760} n={50} cols={['#F4D8C0', '#2B6E6A', '#F2B33D', '#E8705A', '#F7EEDC']} seed="b2f" up={1000} size={28} dur={1.0}
      clouds={8} cloud="#F3E6D4"/>
  </AbsoluteFill>;
};

// =========================================================================================================================
// 3  the car on stands (11.2-17.07 s)
// =========================================================================================================================
const CAR_DROP = 15.66, CAR_LAND = 15.84, CLANK = 12.83;
const S3: React.FC<{t: number}> = ({t}) => {
  const [sx, sy] = shake(t, CAR_LAND, 30, 0.5);
  const [kx, ky] = shake(t, CLANK, 8, 0.2);
  const whip = Math.sin(Math.PI * seg(t, 12.97, 13.2));
  const push = 1 + 0.05 * seg(t, V3, V4) + 0.07 * whip;
  const CW = 1060, CH = CW * 813 / 1473, LIFT = 150;
  const rock = t > 15.12 && t < CAR_DROP ? 0.9 * Math.sin((t - 15.12) * 38) : 0;
  const drop = t < CAR_DROP ? 0 : easeIn(seg(t, CAR_DROP, CAR_LAND));
  const bounce = t > CAR_LAND ? -14 * Math.exp(-(t - CAR_LAND) * 9) * Math.abs(Math.sin((t - CAR_LAND) * 30)) : 0;
  const carBottom = 1668 - LIFT * (1 - drop) + bounce;
  const standFall = seg(t, CAR_DROP - 0.04, CAR_DROP + 0.14);
  // the spanner: on the shelf, looped and tugged, falls by his head with a clank
  const SPN = {x: 780, y: 652};
  const sFall = seg(t, 12.45, CLANK);
  const spx = t < 12.25 ? SPN.x : lerp(SPN.x, SPN.x - 30, seg(t, 12.25, 12.45)) + (300 - SPN.x) * sFall;
  const spy = t < 12.45 ? SPN.y : SPN.y + (1735 - SPN.y) * easeIn(sFall) - (t > CLANK ? 40 * Math.exp(-(t - CLANK) * 9) * Math.abs(Math.sin((t - CLANK) * 22)) : 0);
  const sprot = t < 12.25 ? -24 : t < CLANK ? -24 - 420 * sFall : 72;
  const thHead = t < 12.35 ? ease(seg(t, 11.3, 11.95)) : 1 - inout(seg(t, 12.35, 12.9));
  const tpts: P[] = [[1180, 330], [1010, 470], [SPN.x + 110, SPN.y - 200], ...loop(SPN.x, SPN.y - 60, 70, -40)];
  let mech: React.ReactNode = null;
  if (t < 13.12) mech = <Sprite n="mech1" x={520} y={1712} h={420} rot={t > CLANK ? 2 * Math.sin((t - CLANK) * 30) * Math.exp(-(t - CLANK) * 6) : 0}/>;
  else if (t < 14.15) mech = <Sprite n="mech2" x={lerp(640, 800, ease(seg(t, 13.12, 13.9)))} y={1772} h={470} sq={pop(t, 13.12)} sh={0.8}/>;
  else if (t < CAR_LAND) mech = <Sprite n="mech3" x={872} y={1815} h={830} sq={pop(t, 14.15) + 0.008 * Math.sin(t * 3)} sh={0.8}/>;
  else mech = <Sprite n="mech4" x={860} y={1820} h={860} sq={pop(t, CAR_LAND)} sh={0.8}/>;
  const under = t < 14.15;
  return <AbsoluteFill style={{transform: `translate(${sx + kx}px, ${sy + ky}px) scale(${push})`, transformOrigin: '540px 1400px', filter: whip > 0.05 ? `blur(${5 * whip}px)` : undefined}}>
    <Img src={staticFile('plates/garage.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {/* the work lamp glows */}
    <div style={{position: 'absolute', left: 330, top: 260, width: 420, height: 420, mixBlendMode: 'screen', opacity: 0.4 + 0.05 * Math.sin(t * 7),
      background: 'radial-gradient(closest-side, #FFE6A6, #FFE6A600)'}}/>
    {under && mech}
    {[{x: 300, y: 1690, s: -1}, {x: 805, y: 1640, s: 1}].map((st, k) => <Sprite key={k} n={k ? 'standR' : 'standL'} x={st.x} y={st.y} h={330}
      rot={st.s * 78 * easeIn(standFall)} o={1 - seg(t, CAR_LAND + 0.25, CAR_LAND + 0.5)} sh={0.6}/>)}
    {/* the car: a soft contact shadow, then the body (rocking before it drops) */}
    <div style={{position: 'absolute', left: 120, top: 1610, width: 860, height: 90, borderRadius: '50%', background: 'radial-gradient(closest-side, #1A0D05aa, #1A0D0500)',
      opacity: 0.5 + 0.5 * drop}}/>
    <Sprite n="car" x={540} y={carBottom} h={CH} rot={rock} origin="50% 80%"/>
    {!under && mech}
    {t < 14.2 && <Sprite n="spanner" x={spx} y={spy} h={128} rot={sprot} origin="50% 50%"/>}
    <Sparkles t={t} t0={CLANK - 0.03} x={300} y={1700} r={80} n={10} seed="s3c" dur={0.5}/>
    <Thread pts={tpts} b={thHead} t={t}/>
    <Sparkles t={t} t0={11.9} x={SPN.x} y={SPN.y - 60} r={100} n={12} seed="s3t"/>
    <Burst t={t} t0={CAR_LAND} x={520} y={1650} w={980} n={50} cols={['#B8A99A', '#E3D7C6', '#6E85A8', '#F2B33D', '#D9CDBB']} seed="b3c" up={800} size={26} dur={1.0}
      clouds={10} cloud="#E6DCCB"/>
  </AbsoluteFill>;
};

// =========================================================================================================================
// 4  the kitchen (17.07-22.8 s)
// =========================================================================================================================
const LIGHT_OFF = 18.02, BOOM = 21.2;
const Steam: React.FC<{t: number; x: number; y: number; k0: number; amt: number}> = ({t, x, y, k0, amt}) => <>{Array.from({length: 16}, (_, k) => {
  const per = 1.6 + 0.8 * random(`st${k}`), u = ((t + per * random(`sp${k}`)) % per) / per;
  const s = (30 + 60 * random(`ss${k}`)) * (0.5 + u) * (0.6 + 0.6 * amt);
  const o = Math.sin(Math.PI * u) * (0.35 + 0.55 * amt) * (k < 6 + 10 * amt ? 1 : 0);
  return <div key={k} style={{position: 'absolute', left: x + (random(`sx${k}`) - 0.5) * 60 + 50 * u * Math.sin(k + t) - s / 2, top: y - (240 + 260 * amt) * u - s / 2,
    width: s, height: s, borderRadius: '50%', opacity: o * k0, background: 'radial-gradient(circle at 40% 35%, #FFFFFF 0%, #F4F1EA 55%, #F4F1EA00 100%)'}}/>;
})}</>;

const S4: React.FC<{t: number}> = ({t}) => {
  const boom = t >= BOOM;
  const off = t >= LIGHT_OFF && !boom ? ease((t - LIGHT_OFF) / 0.08) : 0;
  const [sx, sy] = shake(t, BOOM, 34, 0.55);
  const push = 1 + 0.05 * seg(t, V4, V5);
  const LAMP = {x: 642, y: 236};
  const thHead = t < 17.85 ? ease(seg(t, 17.2, 17.75)) : 1 - inout(seg(t, 17.85, 18.35));
  const tpts: P[] = [[1180, 60], [960, 150], [LAMP.x + 80, LAMP.y - 90], ...loop(LAMP.x, LAMP.y, 36, -30)];
  let w: React.ReactNode = null;
  if (t < 18.15) w = <Sprite n="woman1" x={470} y={1730} h={990} sq={0.006 * Math.sin(t * 3)} rot={1.2 * Math.sin(t * 5)} sh={0.8}/>;
  else if (t < 19.2) w = <Sprite n="woman2" x={480} y={1730} h={980} sq={pop(t, 18.15)} sh={0.8}/>;
  else if (t < 20.45) {
    const u = seg(t, 19.2, 20.3);
    w = <Sprite n="woman3" x={lerp(560, 955, ease(u))} y={lerp(1730, 1450, u) - 8 * Math.abs(Math.sin(t * 8))} h={lerp(960, 720, u)} o={1 - seg(t, 20.05, 20.45)} sq={pop(t, 19.2)} sh={0.6}/>;
  } else if (t >= 21.72) {
    const u = ease(seg(t, 21.72, 21.95));
    w = <Sprite n="woman4" x={968} y={1452} h={730} o={u} sq={pop(t, 21.72)} sh={0.5}/>;
  }
  const steamAmt = boom ? 0 : seg(t, 19.0, 21.1);
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: '540px 1200px'}}>
    <Img src={staticFile(`plates/${boom ? 'kitchenafter' : 'kitchen'}.jpg`)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {/* the lamp's glow (off while the light is out) */}
    <div style={{position: 'absolute', left: LAMP.x - 330, top: LAMP.y - 80, width: 660, height: 560, mixBlendMode: 'screen', opacity: (0.45 + 0.04 * Math.sin(t * 9)) * (1 - off),
      background: 'radial-gradient(closest-side, #FFD27A, #FFD27A00)'}}/>
    {!boom && <Steam t={t} x={150} y={905} k0={1} amt={steamAmt}/>}
    {w}
    {/* the light goes out: night blue over everything but the moonlit window and the blue flame */}
    {off > 0 && <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: off,
      background: 'radial-gradient(ellipse 300px 380px at 690px 700px, #C3CCF4 0%, #6672B8 55%, #4D5799 100%)'}}/>}
    {off > 0 && <div style={{position: 'absolute', left: 40, top: 1080, width: 260, height: 140, mixBlendMode: 'screen', opacity: 0.7 * off,
      background: 'radial-gradient(closest-side, #4F8BFF, #4F8BFF00)'}}/>}
    {off > 0 && !boom && <Steam t={t} x={150} y={905} k0={0.55} amt={steamAmt}/>}
    {/* the boom: an orange flash, wool and stew bits */}
    {boom && <div style={{position: 'absolute', left: -300, top: 400, width: 1100, height: 1200, mixBlendMode: 'screen', opacity: 0.9 * Math.exp(-(t - BOOM) * 6),
      background: 'radial-gradient(closest-side, #FFF1B0 0%, #FF9A3D 35%, #FF6A2D00 100%)'}}/>}
    <Burst t={t} t0={BOOM} x={180} y={980} w={260} n={56} cols={['#F28A2E', '#E0452B', '#F7C548', '#FFF3E0', '#B8321E']} seed="b4" up={1300} size={26} dur={1.1}
      clouds={9} cloud="#FBF5EC" spread={1300}/>
    <Thread pts={tpts} b={thHead} t={t}/>
    <Sparkles t={t} t0={17.7} x={LAMP.x} y={LAMP.y} r={90} n={12} seed="s4t"/>
  </AbsoluteFill>;
};

// =========================================================================================================================
// 5  the street (22.8-28.5 s): a close shot behind the boy, the wide street, his face
// =========================================================================================================================
const KEYS_TUG = 23.55, BEAM_DROP = 25.83, BEAM_LAND = 26.53;
const S5a: React.FC<{t: number}> = ({t}) => {
  const step = Math.sin((t - V5) * 2 * Math.PI * 1.8);
  const h = lerp(1680, 1560, seg(t, V5, V5B)), x = 470, y = 2150 - 14 * Math.abs(step);
  const w = (h * SP.boy1b[0]) / SP.boy1b[1];
  const kx0 = x - w / 2 + 0.69 * w, ky0 = y - h + 0.585 * h;
  const ku = seg(t, KEYS_TUG, KEYS_TUG + 0.55);
  const kx = t < KEYS_TUG ? kx0 : kx0 + 210 * ease(ku) - 60 * ku, ky = t < KEYS_TUG ? ky0 : ky0 - 60 * Math.sin(Math.PI * ku * 0.6) + 820 * easeIn(ku);
  const thHead = t < KEYS_TUG + 0.08 ? ease(seg(t, 22.95, 23.45)) : 1 - inout(seg(t, KEYS_TUG + 0.08, KEYS_TUG + 0.55));
  const tpts: P[] = [[1180, 760], [1000, 980], [kx0 + 140, ky0 - 120], ...loop(kx0, ky0 + 40, 58, -20)];
  return <AbsoluteFill>
    <AbsoluteFill style={{transform: 'scale(1.5)', transformOrigin: '600px 1560px'}}>
      <Img src={staticFile('plates/street.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, filter: 'blur(3px)'}}/>
    </AbsoluteFill>
    <Sprite n="boy1b" x={x} y={y} h={h} rot={1.4 * step}/>
    <Sprite n="keys" x={kx} y={ky + 70} h={150} rot={t < KEYS_TUG ? 4 * Math.sin(t * 6) : 4 + 260 * ku} origin="50% 10%"/>
    <Thread pts={tpts} b={thHead} t={t}/>
    <Sparkles t={t} t0={23.35} x={kx0} y={ky0 + 40} r={110} n={14} seed="s5k"/>
  </AbsoluteFill>;
};

const S5b: React.FC<{t: number}> = ({t}) => {
  const [sx, sy] = shake(t, BEAM_LAND, 30, 0.55);
  const push = 1 + 0.04 * seg(t, V5B, V5C);
  const BH = 400, BW = (BH * SP.beams[0]) / SP.beams[1], BX = 700, BTOP = 724;   // hangs below the text, on long cables from the crane
  const sway = 1.3 * Math.sin(t * 2.1);
  const fall = seg(t, BEAM_DROP, BEAM_LAND);
  const landed = t >= BEAM_LAND;
  const bounce = landed ? -18 * Math.exp(-(t - BEAM_LAND) * 8) * Math.abs(Math.sin((t - BEAM_LAND) * 26)) : 0;
  const fallY = (1555 - (BTOP + BH)) * easeIn(fall) + bounce;   // the beams' bottom lands at y 1555
  let boy: React.ReactNode = null;
  if (t < 24.78) boy = <Sprite n="boy1b" x={600} y={1612 - 6 * Math.abs(Math.sin(t * 11))} h={560} sh={0.7}/>;
  else if (t < 26.22) boy = <Sprite n="boy2" x={590} y={1622} h={455} sq={pop(t, 24.78)} sh={0.7}/>;
  else if (t < 26.68) { const u = seg(t, 26.22, 26.62); boy = <Sprite n="boy3" x={lerp(590, 440, ease(u))} y={1632 - 60 * Math.sin(Math.PI * u)} h={520} flip sq={pop(t, 26.22)} sh={0.6}/>; }
  else boy = <Sprite n="boy4" x={420} y={1660} h={470} sq={pop(t, 26.68)} sh={0.7}/>;
  return <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`, transformOrigin: '600px 1400px'}}>
    <Img src={staticFile('plates/street.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {/* the crane's two cables down to the hook; the hook and the upper cables stay; the bundle and the cut cable ends fall */}
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {[-7, 7].map((dx, k) => <line key={k} x1={706 + dx} y1={150} x2={BX + dx * 0.6 + Math.sin(sway * Math.PI / 180) * -40} y2={BTOP + 18} stroke="#4A4250" strokeWidth={6} strokeLinecap="round"/>)}
    </svg>
    <div style={{position: 'absolute', left: BX - BW / 2, top: BTOP, width: BW, height: BH, transformOrigin: '50% 0%', transform: `rotate(${sway}deg)`}}>
      <Img src={staticFile('sprites/beams.png')} style={{position: 'absolute', inset: 0, width: BW, height: BH, clipPath: t >= BEAM_DROP ? 'inset(0 0 66% 0)' : undefined}}/>
    </div>
    {t < 25.6 && <Sprite n="keys" x={700} y={1640} h={46} rot={70}/>}
    {boy}
    <div style={{position: 'absolute', left: BX - BW / 2, top: BTOP + fallY, width: BW, height: BH, transformOrigin: '50% 100%',
      transform: `rotate(${t < BEAM_DROP ? sway : lerp(sway, -6, fall)}deg) scale(${1 + 0.12 * fall})`}}>
      <Img src={staticFile('sprites/beams.png')} style={{position: 'absolute', inset: 0, width: BW, height: BH, clipPath: t >= BEAM_DROP ? 'inset(34% 0 0 0)' : 'inset(100% 0 0 0)',
        filter: 'drop-shadow(0 14px 12px #00000066)'}}/>
    </div>
    {landed && <div style={{position: 'absolute', left: BX - BW * 0.6, top: 1520, width: BW * 1.2, height: 70, borderRadius: '50%', background: 'radial-gradient(closest-side, #1A0D0599, #1A0D0500)'}}/>}
    <Burst t={t} t0={BEAM_LAND} x={BX} y={1540} w={620} n={50} cols={['#C9B8A6', '#EDE3D3', '#D9A445', '#8E8698', '#F6EFE4']} seed="b5" up={900} size={26} dur={1.0}
      clouds={10} cloud="#EEE5D8"/>
  </AbsoluteFill>;
};

const S5c: React.FC<{t: number}> = ({t}) => {
  const d = t - V5C;
  const ring = ease(d / 0.5);
  const pts: P[] = Array.from({length: 25}, (_, k) => { const a = ((-100 + (k / 24) * 372) * Math.PI) / 180; return [540 + 430 * Math.cos(a), 1240 + 470 * Math.sin(a)] as P; });
  return <AbsoluteFill style={{transform: `scale(${1 + 0.05 * ease(d / 0.66)})`, transformOrigin: '540px 1150px'}}>
    <Img src={staticFile('boyclose.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    <Thread pts={pts} b={ring} t={t} w={9}/>
    <Sparkles t={t} t0={V5C + 0.05} x={540} y={1240} r={480} n={18} seed="s5c" dur={0.7}/>
  </AbsoluteFill>;
};

// =========================================================================================================================
export const Scene: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  if (f < 160) return <S1 f={f} t={t}/>;
  if (f < 336) return <S2 t={t}/>;
  if (f < 512) return <S3 t={t}/>;
  if (f < 684) return <S4 t={t}/>;
  if (f < 730) return <S5a t={t}/>;
  if (f < 835) return <S5b t={t}/>;
  return <S5c t={t}/>;
};

export const LutfKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return <AbsoluteFill style={{background: '#1C1020', overflow: 'hidden'}}>
    <ThreadDefs/>
    <Scene f={f}/>
    {/* a soft top vignette keeps the label readable on every plate */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #120A1A88 0px, #120A1A33 520px, #120A1A00 760px)', pointerEvents: 'none'}}/>
    <Label t={t}/>
    <Handle top={462}/>
    <Line t={t} t0={V5B + 0.15} top={528}/>
  </AbsoluteFill>;
};
