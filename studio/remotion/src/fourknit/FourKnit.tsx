// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Say each one 10 times"
// (reference DfuFl02h2dr by @dhikrnest, 45.73 s, job 0aeeb99aef7f) rebuilt in knitted yarn. Same audio (a soft pad, a bead tick
// on every count, a chime after every tenth; no voice: the owner's Lamia voice says each dhikr, mixed by voice.py) and the same
// flow on the reference clock: four sets of 10 (SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah), each bead
// travelling over the top of the ring and landing on the audio tick (onsets measured to the millisecond: 1.400 + 0.85 k,
// 12.250 + 0.85 k, 23.100 + 0.85 k, 33.950 + 1.00 k; the reference counter steps on the same frames), "N of 10" in the centre,
// gold rings on the tenth, a colour change between sets, a fade at the end.
// Knitted, its own scene: a sunlit knitted window nook (GPT Image 2) whose round braided window IS the tasbih ring. The view
// through it moves through the day, one time of day per set, in the reference's own colour story (pearl dawn, emerald midday,
// amber afternoon, sapphire evening), with crocheted beads of five shades per set.
// Over the reference: frame 0 is a closed knitted curtain carrying the hook; the curtains swing open onto the dawn, sun rays
// burst into the room, the yarn string draws itself round the window and the beads drop on it before the first count (the wow);
// the beads roll as they travel, puff a little yarn on landing, the tenth sends stitched gold rings and pompoms out and the
// whole string cascades back over the top in the next set's colour; the English meaning under every line, a progress bead per
// set, and the reference caption's call to action held to the last frame.
// Arabic: texts.json, cut out of quran.com / Tanzil and Sahih Muslim 2137 (sunnah.com) by text.py, checked code point by code point.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Needle, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import TX from './texts.json';
import G from './geom.json';

export const FPS = 30, FRAMES = 1372;                       // 45.733 s, the reference length
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
const R2D = Math.PI / 180;

// ---- the reference clock ------------------------------------------------------------------------------------------------
export const TICKS = [0, 1, 2, 3].map((g) => Array.from({length: 10}, (_, k) => [1.4, 12.25, 23.1, 33.95][g] + (g === 3 ? 1.0 : 0.85) * k));
export const CHIME = [9.353, 20.202, 31.053, 43.252];       // the chime after every tenth (audio onsets)
export const RESET = [10.05, 20.9, 31.75];                   // the string cascades back in the next set's colour
const TRAVEL = 0.53;                                         // the reference bead leaves 16 frames before its tick
const FADE = [44.5, 45.73];                                  // the reference fades out here
const CTA_T = 43.5;

export const SETS = [
  {key: 'sub', ar: TX.sub, tr: 'SubhanAllah', en: 'Glory be to Allah', bead: 'pearl',
    ink: '#4A2440', mid: '#9B5A7E', light: '#FFF3EC', glow: '#FFC9B0', num: '#4A2440', halo: '#FFF6EE'},
  {key: 'hamd', ar: TX.hamd, tr: 'Alhamdulillah', en: 'All praise is for Allah', bead: 'emerald',
    ink: '#0F4A39', mid: '#2F8F6C', light: '#ECFFF6', glow: '#8FE9C0', num: '#0D3F31', halo: '#F2FFF8'},
  {key: 'akbar', ar: TX.akbar, tr: 'Allahu Akbar', en: 'Allah is the Greatest', bead: 'amber',
    ink: '#5E2A0B', mid: '#C46A1E', light: '#FFF1DE', glow: '#FFC266', num: '#55250A', halo: '#FFF5E6'},
  {key: 'tahlil', ar: TX.tahlil, tr: 'La ilaha illallah', en: 'There is no god but Allah', bead: 'sapphire',
    ink: '#18245E', mid: '#3F5BC9', light: '#E8EEFF', glow: '#9DB4FF', num: '#FFF2D2', halo: '#18245E'},
];

// ---- layout (1080 x 1920; text only between y 222 and 1500, none right of x 950 below y 1000) -------------------------------
export const CX = G.cx, CY = G.cy, RIN = G.rIn;
export const RB = RIN - 62;                                  // the bead string runs just inside the braided frame
export const BD = 76;                                        // bead size
const DEL = 2 * Math.asin((BD / 2 + 2) / RB) / R2D;          // one bead slot, degrees
const GAP = DEL * 0.85;                                      // room for the tassel knot at 6 o'clock
const thR = (i: number) => 180 - GAP - i * DEL;              // right stack, slot 0 at the bottom (degrees clockwise from 12)
const thL = (j: number) => 180 + GAP + j * DEL;              // left stack
const pos = (th: number, r = RB) => ({x: CX + r * Math.sin(th * R2D), y: CY - r * Math.cos(th * R2D)});

/** which set is on screen at time t (switches in the middle of each cascade) */
export const setAt = (t: number) => (t >= RESET[2] + 0.55 ? 3 : t >= RESET[1] + 0.55 ? 2 : t >= RESET[0] + 0.55 ? 1 : 0);
/** counts done in set g at time t */
export const countAt = (g: number, t: number) => TICKS[g].filter((x) => t >= x).length;
const lastTick = (t: number) => { let l = -9; for (const s of TICKS) for (const x of s) if (t >= x) l = x; return l; };

type B = {th: number; set: number; v: number; s: number; glow: number; spin: number};
const variant = (slot: number, g: number) => (slot * 3 + g * 2) % 5;

/** every bead's place on the ring at time t: a pure function of the clock */
const beadsAt = (t: number): B[] => {
  const out: B[] = [];
  // the cascade back after sets 1-3: the left stack, top first, travels over the top to the right stack, bottom first
  for (let g = 0; g < 3; g++) {
    const t0 = RESET[g];
    if (t >= t0 && t < t0 + 1.3) {
      for (let r = 0; r < 10; r++) {
        const p = inout((t - t0 - r * 0.07) / 0.55);
        const a = thL(9 - r), b = thR(r) + 360, th = a + (b - a) * p;
        const passed = th >= 360;                                 // recoloured at 12 o'clock
        out.push({th, set: passed ? g + 1 : g, v: passed ? variant(r, g + 1) : variant(9 - r, g), s: 1 + 0.25 * pulse(th / 360 - 0.97, 0.06),
          glow: passed ? pulse(t - t0 - r * 0.07 - 0.27, 0.4) : 0, spin: (th - a) * (RB / (BD / 2))});
      }
      return out;
    }
  }
  const g = setAt(t);
  const c = countAt(g, t);
  const k = c + 1;                                                // the next count
  const moving = k <= 10 && t >= TICKS[g][k - 1] - TRAVEL;
  for (let i = 0; i < 10 - c; i++) {
    if (moving && i === 10 - k) continue;
    out.push({th: thR(i), set: g, v: variant(i, g), s: 1, glow: 0, spin: 0});
  }
  for (let j = 0; j < c; j++) {
    const tl = TICKS[g][j], d = t - tl;
    const settle = j === c - 1 ? -3.2 * Math.exp(-d * 11) * Math.sin(d * 30) : 0;   // a small bounce on landing
    const squash = j === c - 1 ? pulse(d, 0.18) : 0;
    out.push({th: thL(j) + settle, set: g, v: variant(9 - j, g), s: 1 - 0.1 * squash, glow: c === 10 ? 1 : 0.6 * pulse(d, 0.4), spin: 0});
  }
  if (moving) {
    const p = inout((t - (TICKS[g][k - 1] - TRAVEL)) / TRAVEL);
    const a = thR(10 - k), b = thL(k - 1) - 360, th = a + (b - a) * p;
    out.push({th, set: g, v: variant(10 - k, g), s: 1 + 0.12 * Math.sin(Math.PI * p), glow: 0.35 * Math.sin(Math.PI * p), spin: (th - a) * (RB / (BD / 2))});
  }
  return out;
};

export const BEAD_SRC = (set: number, v: number) => staticFile(`parts/bead_${SETS[set].bead}${v}.png`);

const Beads: React.FC<{t: number}> = ({t}) => {
  // opening: the beads drop onto the string from above, top bead first
  const intro = t < 1.0;
  const bs = beadsAt(t);
  const end = ease((t - CHIME[3]) / 0.6);
  return <>{bs.map((b, n) => {
    let {x, y} = pos(b.th);
    let o = 1, sc = b.s;
    if (intro) {
      const slot = Math.round((180 - GAP - b.th) / DEL);          // right stack slot
      const d = springy(t - 0.3 - (9 - slot) * 0.028, 1.35);
      if (d <= 0) return null;
      y -= (1 - Math.min(1, d)) * 220; o = c01(d * 3); sc *= 0.5 + 0.5 * Math.min(1.15, d);
    }
    const P = SETS[b.set];
    const glowC = end > 0 ? '#FFC64A' : P.glow;
    const gl = Math.max(b.glow, end);
    return <Img key={n} src={BEAD_SRC(b.set, b.v)} style={{position: 'absolute', left: x - BD / 2, top: y - BD / 2, width: BD, height: BD, opacity: o,
      transform: `rotate(${b.spin + n * 37}deg) scale(${sc})`,
      filter: `drop-shadow(0 0 2px ${P.light}) drop-shadow(0 6px 5px #2a160c88)${gl > 0.03 ? ` drop-shadow(0 0 ${6 + 16 * gl}px ${glowC})` : ''}`}}/>;
  })}</>;
};

// ---- the string and the tassel ----------------------------------------------------------------------------------------
export const StringRing: React.FC<{t: number}> = ({t}) => {
  const draw = ease((t - 0.25) / 0.6), c = 2 * Math.PI * RB;
  const g = setAt(t), end = ease((t - CHIME[3]) / 0.6);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <g transform={`rotate(90 ${CX} ${CY})`}>
      <circle cx={CX} cy={CY} r={RB} fill="none" stroke="#3b2414" strokeOpacity={0.35} strokeWidth={9} strokeDasharray={`${c * draw} ${c}`}
        transform={`translate(0 4)`} style={{filter: 'blur(3px)'}}/>
      <circle cx={CX} cy={CY} r={RB} fill="none" stroke="#E9C67A" strokeWidth={6} strokeDasharray={`${c * draw} ${c}`} style={{filter: 'url(#yarn)'}}/>
      <circle cx={CX} cy={CY} r={RB} fill="none" stroke={end > 0 ? '#FFD86A' : SETS[g].mid} strokeOpacity={0.85} strokeWidth={2.4}
        strokeDasharray={draw >= 1 ? '9 7' : `${c * draw} ${c}`} strokeDashoffset={-t * 18}/>
    </g>
  </svg>;
};

export const Tassel: React.FC<{t: number}> = ({t}) => {
  const p = springy(t - 0.62, 1.2);
  if (p <= 0) return null;
  const sway = 5 * Math.sin(t * 1.6) * 0.5 + 9 * Math.exp(-(t - 0.62) * 2.5) * Math.sin((t - 0.62) * 9);
  const lt = lastTick(t), jig = 3 * Math.exp(-(t - lt) * 9) * Math.sin((t - lt) * 40) * (lt > 0 ? 1 : 0);
  const W = 104, H = 230;
  return <div style={{position: 'absolute', left: CX - W / 2, top: CY + RB - 26, width: W, height: H, transformOrigin: '50% 8%',
    transform: `rotate(${sway + jig}deg) scale(${Math.min(1, p)})`, filter: 'drop-shadow(0 8px 7px #2a160c77)'}}>
    <Img src={staticFile('parts/tassel.png')} style={{width: W, height: H, objectFit: 'contain'}}/>
  </div>;
};

// ---- the view through the window (one time of day per set) ---------------------------------------------------------------
const SKY_W = (RIN + 10) / 0.42;
const skyMix = (t: number) => [0, 1, 2].map((g) => inout((t - RESET[g] - 0.05) / 1.1));
export const Sky: React.FC<{t: number}> = ({t}) => {
  const m = skyMix(t);
  const op = [1, m[0], m[1], m[2]];
  return <div style={{position: 'absolute', left: CX - RIN - 6, top: CY - RIN - 6, width: 2 * RIN + 12, height: 2 * RIN + 12, borderRadius: '50%', overflow: 'hidden',
    background: '#F4C9B8'}}>
    {op.map((o, i) => o > 0.001 ? <Img key={i} src={staticFile(`sky${i + 1}.jpg`)} style={{position: 'absolute', left: RIN + 6 - SKY_W / 2, top: RIN + 6 - SKY_W / 2,
      width: SKY_W, height: SKY_W, opacity: o, transform: `scale(${1.02 + 0.03 * c01((t - [0, RESET[0], RESET[1], RESET[2]][i]) / 11)})`}}/> : null)}
    {/* the evening moon breathes */}
    <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: m[2] * (0.25 + 0.1 * Math.sin(t * 1.3)) + 0.4 * ease((t - CHIME[3]) / 0.8),
      background: 'radial-gradient(circle at 30% 28%, #FFF0C8aa 0%, #FFF0C800 34%)'}}/>
    {/* soft vignette inside the frame for the counter */}
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(closest-side, #00000000 70%, #00000030 100%)'}}/>
  </div>;
};

// the room's colour per time of day, masked to the room (the sky keeps its own colours)
const GRADES = [
  {c: '#FFD2C2', o: 0.32, mode: 'multiply'},
  {c: '#F1FFF6', o: 0.18, mode: 'multiply'},
  {c: '#FFC98E', o: 0.38, mode: 'multiply'},
  {c: '#9AA9DE', o: 0.5, mode: 'multiply'},
] as const;
export const Room: React.FC<{t: number}> = ({t}) => {
  const m = skyMix(t);
  const w = [1 - m[0], m[0] - m[1], m[1] - m[2], m[2]];
  const mask = {WebkitMaskImage: `url(${staticFile('room.png')})`, WebkitMaskSize: '1080px 1920px', maskImage: `url(${staticFile('room.png')})`, maskSize: '1080px 1920px'};
  return <>
    <Img src={staticFile('room.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    {GRADES.map((gr, i) => w[i] > 0.002 ? <AbsoluteFill key={i} style={{...mask, background: gr.c, opacity: gr.o * w[i], mixBlendMode: gr.mode}}/> : null)}
    {/* light from the window on the wall, in the colour of the hour */}
    <AbsoluteFill style={{...mask, mixBlendMode: 'screen', opacity: 0.55 - 0.25 * m[2],
      background: `radial-gradient(circle at ${CX}px ${CY}px, ${['#FFD9B8', '#F4FFE8', '#FFCF7A', '#AFC0FF'][setAt(t)]}88 ${RIN * 0.9}px, #00000000 ${RIN * 2.1}px)`}}/>
  </>;
};

// ---- the opening: sun rays and the curtains --------------------------------------------------------------------------------
const Rays: React.FC<{t: number; t0: number; col: string; power?: number}> = ({t, t0, col, power = 1}) => {
  const d = t - t0;
  if (d < 0 || d > 3.2) return null;
  const o = c01(d / 0.25) * (1 - c01((d - 1.2) / 2.0)) * power;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: o}}>
    <defs><radialGradient id={`ray${t0}`} cx={CX} cy={CY} r={1300} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={col} stopOpacity={0.95}/><stop offset="0.35" stopColor={col} stopOpacity={0.35}/><stop offset="1" stopColor={col} stopOpacity={0}/></radialGradient></defs>
    <g filter="url(#soft14)">
      {Array.from({length: 14}, (_, k) => { const a = (k / 14) * 360 + d * 6 + 7, w = 5 + 4 * random(`rw${k}`);
        const p1 = pos(a - w, 1500), p2 = pos(a + w, 1500);
        return <path key={k} d={`M ${CX} ${CY} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`} fill={`url(#ray${t0})`} opacity={0.45 + 0.4 * random(`ro${k}`)}/>; })}
    </g>
  </svg>;
};

const Curtains: React.FC<{t: number}> = ({t}) => {
  const p = inout((t - 0.12) / 0.85);
  if (p >= 1) return null;
  const W = 640;
  const panel = (side: -1 | 1) => {
    const x = side < 0 ? -60 - p * 560 : 500 + p * 560;
    return <div style={{position: 'absolute', left: x, top: -40, width: W, height: 2000, transformOrigin: side < 0 ? '0% 0%' : '100% 0%',
      transform: `scaleX(${1 - 0.45 * p}) skewX(${side * 3 * Math.sin(p * Math.PI)}deg)`, filter: 'drop-shadow(0 0 26px #1b0f0acc)'}}>
      <Img src={staticFile('parts/curtain.png')} style={{width: W, height: 2000, objectFit: 'fill', transform: side > 0 ? 'scaleX(-1)' : undefined}}/>
    </div>;
  };
  const slit = c01(p * 6) * (1 - c01((p - 0.5) / 0.5));
  return <>
    <div style={{position: 'absolute', left: 540 - 60 - 300 * p, width: 120 + 600 * p, top: 0, height: 1920, mixBlendMode: 'screen', opacity: slit,
      background: 'linear-gradient(90deg, #FFE2B000 0%, #FFE9C0ee 50%, #FFE2B000 100%)'}}/>
    {panel(-1)}{panel(1)}
  </>;
};

// ---- the hook: big on the closed curtain at frame 0, then it settles under the handle and stays -------------------------------
const Hook: React.FC<{t: number}> = ({t}) => {
  const p = inout((t - 0.22) / 0.75);
  const big = 1 - p;
  const top = interpolate(p, [0, 1], [700, 276]);
  const fs = interpolate(p, [0, 1], [104, 40]);
  return <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', zIndex: 8}}>
    <div style={{fontFamily: SERIF, fontSize: fs, lineHeight: 1.04, color: big > 0.65 ? '#FFF4E2' : '#4A2E22',
      textShadow: big > 0.65 ? '0 4px 10px #00000099' : '0 1px 0 #FFF6EC, 0 0 14px #FFF3E6',
      filter: big > 0.65 ? 'url(#yarn) drop-shadow(0 4px 3px #1b0f0acc)' : 'url(#yarn)'}}>
      {big > 0.65 ? <>Say each one<br/><span style={{...gold(t, 0.4), WebkitTextStroke: '2px #E7B040'}}>10 times</span></>
        : <>Say each one <span style={{color: '#8A4B0C', WebkitTextStroke: '0.6px #8A4B0C'}}>10 times</span></>}
    </div>
    {big > 0.65 ? <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: '#F6E3C4', marginTop: 18, opacity: c01((big - 0.65) / 0.3), textShadow: '0 2px 6px #000000aa'}}>
      SubhanAllah · Alhamdulillah · Allahu Akbar · La ilaha illallah</div> : null}
  </div>;
};

export const Handle: React.FC<{top: number; endP?: number}> = ({top, endP = 0}) => <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 9}}>
  <span style={{display: 'inline-block', position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontSize: 33, color: '#5B3A2A', letterSpacing: 1,
    paddingBottom: 4, borderBottom: '3px dashed #C9973F', textShadow: '0 1px 0 #FFF6EC, 0 0 10px #FFF3E6'}}>
    @heal.ingthroughquran
    <span style={{position: 'absolute', left: 0, bottom: -3, height: 0, width: `${100 * endP}%`, borderBottom: '4px dashed #E8A92A', filter: 'drop-shadow(0 0 5px #FFC64A)'}}/>
  </span>
</div>;

// ---- four progress beads, one per set ---------------------------------------------------------------------------------
const Progress: React.FC<{t: number; top: number}> = ({t, top}) => {
  const g = setAt(t);
  return <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, zIndex: 7}}>
    {SETS.map((s, i) => {
      const done = t >= CHIME[i], cur = i === g && !done;
      const pop = pulse(t - CHIME[i], 0.45);
      const appear = springy(t - 0.75 - 0.08 * i, 1.3);
      return <div key={i} style={{width: 40, height: 40, position: 'relative', transform: `scale(${appear * (1 + 0.45 * pop + (cur ? 0.08 * Math.sin(t * 4) : 0))})`,
        opacity: done || cur ? 1 : 0.5, filter: `${done || cur ? '' : 'saturate(0.4) '}drop-shadow(0 3px 3px #2a160c66)${done ? ' drop-shadow(0 0 9px #FFC64A)' : ''}`}}>
        <Img src={BEAD_SRC(i, 0)} style={{width: 40, height: 40}}/>
        {done ? <svg width={40} height={40} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={20} cy={20} r={24} fill="none" stroke="#E8A92A" strokeWidth={2.5} strokeDasharray="4 3"/></svg> : null}
      </div>;
    })}
  </div>;
};

// ---- the dhikr line: stitched in right to left by the needle, the meaning under it --------------------------------------
const Line: React.FC<{t: number; start: number; end: number; s: (typeof SETS)[number]}> = ({t, start, end, s}) => {
  if (t < start || t > end + 0.3) return null;
  const d = t - start, rv = ease(d / 0.42), X = rv >= 1 ? 0 : 90 - 90 * rv;
  const out = interpolate(t, [end, end + 0.25], [1, 0], clamp);
  const trIn = ease((d - 0.12) / 0.3);
  const beat = pulse(t - lastTick(t), 0.35);
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 368, textAlign: 'center', opacity: out, transform: `translateY(${-20 * (1 - out)}px)`,
      filter: out < 1 ? `blur(${(1 - out) * 5}px)` : undefined}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 104, lineHeight: 1.55, color: s.ink, clipPath: `inset(-40% 0 -40% ${X}%)`, WebkitTextStroke: `1.5px ${s.ink}`,
        filter: `url(#yarn) drop-shadow(0 0 ${10 + 10 * beat}px ${s.halo}) drop-shadow(0 3px 2px #2a160c55)`}}>{s.ar}</div>
      <div style={{opacity: trIn, transform: `translateY(${(1 - trIn) * 14}px)`, marginTop: 18}}>
        <div style={{fontFamily: SERIF, fontSize: 46, lineHeight: 1.05, color: s.ink, textShadow: `0 0 12px ${s.halo}, 0 1px 0 #FFFFFF99`}}>{s.tr}</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 31, lineHeight: 1.3, color: s.mid, textShadow: `0 0 10px ${s.halo}`}}>{s.en}</div>
      </div>
    </div>
    {rv < 1 ? <Needle x={1080 * X / 100} y={462} o={interpolate(d, [0, 0.05, 0.36, 0.42], [0, 1, 1, 0], clamp)}/> : null}
  </>;
};

// ---- the counter in the window ---------------------------------------------------------------------------------------------
const Counter: React.FC<{t: number}> = ({t}) => {
  const g = setAt(t), s = SETS[g];
  const n = countAt(g, t);
  const lt = lastTick(t), pop = pulse(t - lt, 0.28);
  const ten = n === 10 && t < (RESET[g] ?? 99) + 0.4;
  const appear = springy(t - 0.7, 1.3);
  const cta = ease((t - CTA_T) / 0.5);
  const swap = [0, 1, 2].reduce((m, i) => Math.max(m, pulse(t - RESET[i] - 0.3, 0.5)), 0);
  return <div style={{position: 'absolute', left: CX - 220, top: CY - 150, width: 440, textAlign: 'center', opacity: (1 - cta) * (1 - 0.7 * swap),
    transform: `scale(${appear * (1 + 0.22 * pop) * (1 - 0.15 * cta)})`}}>
    <div style={{fontFamily: SERIF, fontSize: 220, lineHeight: 1, ...(ten ? gold(t, 0.5) : {color: s.num}), WebkitTextStroke: ten ? '3px #E7B040' : `3px ${s.num}`,
      filter: `url(#yarn) drop-shadow(0 0 14px ${s.halo}) drop-shadow(0 0 4px ${s.halo}) drop-shadow(0 5px 4px #00000055)`}}>{n}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, lineHeight: 1, marginTop: -8, color: s.num, textShadow: `0 0 10px ${s.halo}, 0 0 4px ${s.halo}`}}>of 10</div>
  </div>;
};

// ---- the tenth: stitched gold rings and pompoms ---------------------------------------------------------------------------
const POM = ['#F7BD45', '#FFE9B0', '#F2A6BC', '#7FC8C2', '#F59A7A', '#FBF1DC', '#9CC8F2', '#B6D77A'];
export const Burst: React.FC<{t: number; t0: number; x: number; y: number; n: number; cols?: string[]; power?: number; seed: string; size?: number}> =
  ({t, t0, x, y, n, cols = POM, power = 1, seed, size = 1}) => {
    const d = t - t0;
    if (d < 0 || d > 2.2) return null;
    return <>{Array.from({length: n}, (_, j) => {
      const a = (j / n) * Math.PI * 2 + random(`${seed}a${j}`) * 0.5, v = (420 + 380 * random(`${seed}v${j}`)) * power;
      const k = 3.2, dist = (v / k) * (1 - Math.exp(-k * d));
      const px = x + Math.cos(a) * dist, py = y + Math.sin(a) * dist * 0.85 + 260 * d * d;
      const sz = (12 + 14 * random(`${seed}s${j}`)) * size, o = c01(d / 0.06) * (1 - c01((d - 1.0) / 0.9));
      const c = cols[j % cols.length];
      return <div key={j} style={{position: 'absolute', left: px - sz / 2, top: py - sz / 2, width: sz, height: sz, borderRadius: '50%', opacity: o,
        background: `radial-gradient(circle at 35% 30%, #ffffffcc 0%, ${c} 38%, ${c} 70%, #00000044 100%)`, boxShadow: `0 0 ${sz * 0.5}px ${c}aa, 0 3px 4px #00000055`}}/>;
    })}</>;
  };

const Rings: React.FC<{t: number; t0: number; big?: number}> = ({t, t0, big = 1}) => {
  const d = t - t0;
  if (d < 0 || d > 1.8) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {[0, 0.28].map((lag, k) => { const u = c01((d - lag) / 1.3); if (u <= 0) return null;
      return <circle key={k} cx={CX} cy={CY} r={RB + 40 + 190 * big * ease(u)} fill="none" stroke="#E8A92A" strokeWidth={5 * (1 - u) + 1.5}
        strokeDasharray="14 9" opacity={(1 - u) * 0.95} style={{filter: 'drop-shadow(0 0 8px #FFC64A)'}}/>; })}
  </svg>;
};

// small puffs where a bead lands
const Puff: React.FC<{t: number}> = ({t}) => {
  const g = setAt(t), c = countAt(g, t);
  if (c === 0) return null;
  const tl = TICKS[g][c - 1], d = t - tl;
  if (d > 0.7) return null;
  const p = pos(thL(c - 1), RB);
  return <Burst t={t} t0={tl} x={p.x} y={p.y} n={6} power={0.18} size={0.5} seed={`p${g}-${c}`} cols={[SETS[g].glow, SETS[g].light, '#F7D27A']}/>;
};

// floating motes in the light (day) and twinkles (evening)
const Motes: React.FC<{t: number; f: number}> = ({t, f}) => <>{Array.from({length: 26}, (_, k) => {
  const life = 240 + random(`ml${k}`) * 220, ph = (f + random(`mp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`mp${k}`) * life) / life);
  const x = 80 + random(`mx${k}-${gen}`) * 920 + Math.sin(u * 5 + k) * 30, y = 1640 - u * 1250, sz = 2.5 + random(`ms${k}`) * 4;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: '#FFF1CF',
    boxShadow: `0 0 ${3 * sz}px ${sz}px #F6D27A55`, opacity: c01(t / 1.2) * Math.sin(Math.PI * u) * (0.35 + 0.3 * Math.sin(f / 9 + k))}}/>;
})}</>;

/** the call to action from the reference caption, held to the last frame */
const Cta: React.FC<{t: number}> = ({t}) => {
  const p = springy(t - CTA_T, 1.2);
  if (p <= 0) return null;
  return <div style={{position: 'absolute', left: CX - 330, width: 660, top: CY - 112, display: 'flex', justifyContent: 'center', zIndex: 9}}>
    <div style={{padding: '20px 40px 24px', borderRadius: 40, background: 'linear-gradient(180deg, #FFF8EE, #F7E6CF)', border: '4px dashed #D79A2E',
      boxShadow: '0 12px 26px #2a160c66, 0 0 26px #FFC64A88', transform: `translateY(${(1 - Math.min(1, p)) * 30}px) scale(${0.7 + 0.3 * Math.min(1.05, p)})`, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontSize: 56, lineHeight: 1.05, color: '#3A2416'}}>Save it for</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, lineHeight: 1.1, color: '#9A5B12'}}>after your next prayer</div>
    </div>
  </div>;
};

export const Filters: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="soft14" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={14}/></filter>
  </defs>
</svg>;

export const FourKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const cam = 1 + 0.07 * (1 - ease(t / 1.4)) + 0.02 * c01((t - 1.4) / 42);
  const fade = ease((t - FADE[0]) / (FADE[1] - FADE[0]));
  const g = setAt(t);
  const lineStart = [0.85, RESET[0] + 0.55, RESET[1] + 0.55, RESET[2] + 0.55];
  const lineEnd = [RESET[0] + 0.3, RESET[1] + 0.3, RESET[2] + 0.3, 999];
  return <AbsoluteFill style={{background: '#2a1a12', overflow: 'hidden'}}>
    <YarnDefs/>
    <Filters/>
    <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: `${CX}px ${CY}px`}}>
      <Sky t={t}/>
      <Room t={t}/>
      <Motes t={t} f={f}/>
      <Rays t={t} t0={0.35} col="#FFD9A0" power={1}/>
      {RESET.map((x, i) => <Rays key={i} t={t} t0={x + 0.2} col={['#E9FFE0', '#FFC874', '#C9D6FF'][i]} power={0.55}/>)}
      <StringRing t={t}/>
      <Tassel t={t}/>
      <Beads t={t}/>
      <Puff t={t}/>
      {CHIME.map((x, i) => <Rings key={i} t={t} t0={x - 0.25} big={i === 3 ? 1.4 : 1}/>)}
      <Counter t={t}/>
    </AbsoluteFill>
    {CHIME.map((x, i) => <Burst key={i} t={t} t0={x - 0.2} x={CX} y={CY - RB} n={i === 3 ? 40 : 22} seed={`c${i}`} power={i === 3 ? 1.4 : 0.9} size={i === 3 ? 1.1 : 0.9}
      cols={i === 3 ? ['#F7BD45', '#FFE9B0', '#F2A6BC', '#7FC8C2', '#9CC8F2', '#B6D77A'] : [SETS[i].glow, SETS[i].light, '#F7BD45', SETS[i].mid]}/>)}
    {/* the end dims the room, the call to action and the handle stay bright */}
    <AbsoluteFill style={{background: '#1A1230', opacity: 0.55 * fade}}/>
    <Curtains t={t}/>
    <Handle top={226} endP={c01((t - CHIME[3]) / 1.2)}/>
    <Hook t={t}/>
    <Progress t={t} top={332}/>
    {SETS.map((s, i) => <Line key={i} t={t} start={lineStart[i]} end={lineEnd[i]} s={s}/>)}
    <Cta t={t}/>
    {g < 0 ? null : null}
  </AbsoluteFill>;
};
