// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Istighfar x100" (reference
// Dft1ZqUtnGS by @roadtojannahfirdaus, 84.4 s, job wife-Dft1ZqUtnGS) rebuilt in knitted yarn, 2D motion graphics only (no
// Blender). Same audio, same structure, same clock: 100 counts at the reference's own counter times (counts.json, measured
// frame by frame), a man carries a bowl of sins on his back, every istighfar knocks one sin out, he stands straighter every 20,
// and at 100 he lets the bowl go and walks on lighter; then Nuh 71:10.
// Knitted: a GPT Image 2 knitted dawn desert, an amigurumi doll in five carrying poses (a generic man, never a prophet), a
// crocheted walnut bowl heaped with 100 felted dark wool balls, a felted gold tasbih strand that feeds one bead per count,
// a running-stitch counter ring and puffy yarn lettering. Over the reference: parallax (sky drift, dunes, a foreground ridge
// that scrolls faster as he gets lighter), a warm light that grows with every 20, rising wool motes, knocked sins that
// dissolve into gold dust, and stitch-needle wipes on every text change.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Needle, YarnDefs} from '../asmaknit/AsmaKnit';
import CT from './counts.json';
import META from './meta.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = CT.frames, DURATION = CT.duration;
export const T: number[] = CT.T;
export const END = T[99];
export const ARQ = 'AmiriQ, serif';
export const ROUND = 'Fredoka, sans-serif';
export const SERIF = 'KnitSerif, serif';
export const INK = '#5E2414', CLAY = '#B85A2E', CREAM = '#FFF6E6';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const v = c01(x); return v * v * (3 - 2 * v); };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const spring = (x: number) => (x <= 0 ? 0 : x > 1.2 ? 1 : 1 - Math.exp(-x * 9) * Math.cos(x * 13));
export const PUFF = `url(#yarn) drop-shadow(0 2px 1px #4A1A0Acc) drop-shadow(0 9px 12px #7A3A1055)`;

export const countAt = (t: number) => { let k = 0; while (k < 100 && T[k] <= t + 1e-6) k++; return k; };
const FALL = 0.3;                                         // a bead falls for 0.3 s and lands on the count's own time

// --- the doll: five carrying poses, lighter every 20; display heights grow as he straightens ---------------------------
type Pose = 'man1' | 'man2' | 'man3' | 'man4' | 'man5' | 'free';
export const POSES: Pose[] = ['man1', 'man2', 'man3', 'man5', 'man4'];
const HEIGHT: Record<Pose, number> = {man1: 560, man2: 577, man3: 595, man5: 632, man4: 651, free: 670};
export const BOWL_CX = 470, FEET = 1660;
type Geom = {left: number; top: number; w: number; h: number; x0: number; x1: number; y: number};
export const geom = (p: Pose, cx = BOWL_CX, feet = FEET): Geom => {
  const m = (META as unknown as Record<string, {w: number; h: number; rim?: {x0: number; x1: number; y: number}}>)[p];
  const s = HEIGHT[p] / m.h, rim = m.rim ?? {x0: m.w * 0.3, x1: m.w * 0.7, y: 0};
  const left = cx - s * (rim.x0 + rim.x1) / 2, top = feet - s * m.h;
  return {left, top, w: s * m.w, h: s * m.h, x0: left + s * rim.x0, x1: left + s * rim.x1, y: top + s * rim.y};
};
const mix = (a: Geom, b: Geom, p: number): Geom => ({left: lerp(a.left, b.left, p), top: lerp(a.top, b.top, p), w: lerp(a.w, b.w, p),
  h: lerp(a.h, b.h, p), x0: lerp(a.x0, b.x0, p), x1: lerp(a.x1, b.x1, p), y: lerp(a.y, b.y, p)});

// --- 100 felted sins heaped in the bowl (unit = rim width; v up from the opening's centre line) ---------------------------
const ROWS = [13, 12, 12, 11, 11, 10, 9, 8, 7, 5, 2];
const D = 1 / 13.4;
type Ball = {u: number; v: number; s: number; p: number; rot: number; row: number; at: number};
export const BALLS: Ball[] = (() => {
  const out: Omit<Ball, 'at'>[] = [];
  ROWS.forEach((n, r) => { for (let i = 0; i < n; i++) {
    const j = (k: string) => random(`b${r}-${i}-${k}`) - 0.5;
    out.push({u: (i - (n - 1) / 2) * D + j('u') * 0.16 * D , v: r * 0.42 * D + j('v') * 0.1 * D,
      s: 1 + j('s') * 0.16, p: Math.floor(random(`b${r}-${i}-p`) * 9), rot: j('r') * 360, row: r});
  } });
  // knocked out from the top down: count k removes order[k-1]
  const order = out.map((b, i) => ({i, key: b.row + random(`o${i}`) * 0.9})).sort((a, b) => b.key - a.key);
  const at: number[] = []; order.forEach((o, n) => { at[o.i] = n + 1; });
  return out.map((b, i) => ({...b, at: at[i]}));
})();
const ballPos = (b: Ball, g: Geom) => { const W = g.x1 - g.x0; return {x: (g.x0 + g.x1) / 2 + b.u * W, y: g.y + 0.06 * W - b.v * W, d: D * W * b.s}; };

/** the pile: balls still in the bowl, clipped behind the bowl's front lip, plus the ones being knocked out */
export const Pile: React.FC<{t: number; g: Geom; k: number; knock?: boolean}> = ({t, g, k, knock = true}) => {
  const W = g.x1 - g.x0, cy = g.y + 0.06 * W, rx = W * 0.49, ry = 0.055 * W, cx = (g.x0 + g.x1) / 2;
  const clip = `path('M ${cx - rx} -200 L ${cx + rx} -200 L ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} Z')`;
  const sitting = BALLS.filter((b) => b.at > k).sort((a, b) => b.row - a.row);
  const flying = knock ? BALLS.filter((b) => b.at <= k && t - T[b.at - 1] < 1.1) : [];
  return <>
    <div style={{position: 'absolute', inset: 0, clipPath: clip}}>
      {sitting.map((b, n) => { const p = ballPos(b, g);
        return <Img key={n} src={staticFile(`pebbles/p${b.p}.png`)} style={{position: 'absolute', left: p.x - p.d / 2, top: p.y - p.d / 2,
          width: p.d, height: p.d, transform: `rotate(${b.rot}deg)`, filter: 'drop-shadow(0 3px 3px #00000066)'}}/>; })}
    </div>
    {flying.map((b, n) => {
      const p = ballPos(b, g), tau = t - T[b.at - 1], side = b.u >= 0 ? 1 : -1, r1 = random(`f${b.at}`);
      const dx = side * (260 + 240 * r1) * tau, dy = (-520 - 200 * r1) * tau + 0.5 * 2400 * tau * tau;
      const dust = c01((tau - 0.25) / 0.6);
      return <React.Fragment key={n}>
        <Img src={staticFile(`pebbles/p${b.p}.png`)} style={{position: 'absolute', left: p.x - p.d / 2 + dx, top: p.y - p.d / 2 + dy, width: p.d, height: p.d,
          opacity: 1 - dust, transform: `rotate(${b.rot + side * 500 * tau}deg) scale(${1 - 0.5 * dust})`,
          filter: `drop-shadow(0 4px 4px #00000066) sepia(${dust}) brightness(${1 + 2.2 * dust})`}}/>
        {Array.from({length: 7}, (_, j) => { const a = (j / 7) * Math.PI * 2 + r1 * 3, rr = 18 + 70 * ease(dust);
          return dust > 0 && dust < 1 ? <div key={j} style={{position: 'absolute', left: p.x + dx + Math.cos(a) * rr - 4, top: p.y + dy + Math.sin(a) * rr - 4 - 40 * dust,
            width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle, #FFF6D0, #FFC24A 60%, #FFC24A00)',
            opacity: 1 - dust, boxShadow: '0 0 10px 3px #FFC24A88'}}/> : null; })}
      </React.Fragment>;
    })}
  </>;
};

// --- the felted gold tasbih strand that feeds one bead per count -------------------------------------------------------
const P0 = {x: -80, y: 766}, PC = {x: 210, y: 790}, P2 = {x: BOWL_CX - 20, y: 884};
const qb = (u: number) => ({x: (1 - u) ** 2 * P0.x + 2 * (1 - u) * u * PC.x + u * u * P2.x, y: (1 - u) ** 2 * P0.y + 2 * (1 - u) * u * PC.y + u * u * P2.y});
const SAMPLES = Array.from({length: 401}, (_, i) => qb(i / 400));
const CUM = SAMPLES.reduce<number[]>((a, p, i) => { a.push(i ? a[i - 1] + Math.hypot(p.x - SAMPLES[i - 1].x, p.y - SAMPLES[i - 1].y) : 0); return a; }, []);
const LEN = CUM[400];
const atLen = (s: number) => { if (s <= 0) return SAMPLES[0]; let i = CUM.findIndex((c) => c >= s); if (i < 0) i = 400;
  const a = CUM[i - 1] ?? 0, f = i ? (s - a) / (CUM[i] - a) : 0; const p = SAMPLES[Math.max(0, i - 1)], q = SAMPLES[i];
  return {x: lerp(p.x, q.x, f), y: lerp(p.y, q.y, f)}; };
const SP = 58, BEAD = 54;
const BeadImg: React.FC<{x: number; y: number; s?: number; glow?: number; o?: number}> = ({x, y, s = 1, glow = 0, o = 1}) =>
  <Img src={staticFile('bead.png')} style={{position: 'absolute', left: x - (BEAD * s) / 2, top: y - (BEAD * s) / 2, width: BEAD * s, height: BEAD * s, opacity: o,
    filter: `drop-shadow(0 4px 3px #6A3A0A66)${glow > 0 ? ` drop-shadow(0 0 ${14 * glow}px #FFD36A)` : ''}`}}/>;

export const Strand: React.FC<{t: number; o?: number; still?: boolean}> = ({t, o = 1, still = false}) => {
  const k = countAt(t);
  const nextDrop = k < 100 ? T[k] - FALL : Infinity;
  const dropped = k + (t >= nextDrop ? 1 : 0);            // beads that have left the strand
  const lastDrop = dropped > 0 ? T[dropped - 1] - FALL : -9;
  const shift = still ? 1 : spring((t - lastDrop - 0.05) / 0.32);   // the strand slides one bead forward after each drop
  const left = 100 - dropped;
  const beads = [];
  for (let j = 0; j < Math.min(left, 13); j++) {
    const s = LEN - (j + 1 - shift) * SP;
    if (s < -SP) break;
    const p = atLen(s);
    beads.push(<BeadImg key={`b${dropped + j}`} x={p.x} y={p.y} glow={j === 0 ? 0.6 + 0.4 * Math.sin(t * 6) : 0}/>);
  }
  const fall = k < 100 && t >= nextDrop ? c01((t - nextDrop) / FALL) : -1;
  return <div style={{position: 'absolute', inset: 0, opacity: o}}>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={`M ${P0.x} ${P0.y} Q ${PC.x} ${PC.y} ${P2.x} ${P2.y}`} stroke="#B07A2A" strokeWidth={5} fill="none" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
      <circle cx={P2.x} cy={P2.y} r={7} fill="#C9922F"/>
    </svg>
    {beads.reverse()}
    {fall >= 0 ? <FallingBead t={t} k={k} f={fall}/> : null}
  </div>;
};
/** the bead on its way down to the sin it knocks out (count k+1) */
const FallingBead: React.FC<{t: number; k: number; f: number}> = ({k, f}) => {
  const target = BALLS.find((b) => b.at === k + 1)!;
  const g = poseGeom(T[k]);
  const p = ballPos(target, g);
  const x = lerp(P2.x, p.x, f), y = lerp(P2.y, p.y - p.d * 0.6, f * f);
  return <>
    <div style={{position: 'absolute', left: x - 9, top: P2.y, width: 18, height: Math.max(0, y - P2.y), opacity: 0.35 * (1 - f),
      background: 'linear-gradient(180deg, #FFE08A00, #FFE08A)', filter: 'blur(4px)'}}/>
    <BeadImg x={x} y={y} glow={1}/>
  </>;
};

// which pose at time t (and the cross-fade into the next one, 0.4 s after counts 20, 40, 60, 80)
export const stageAt = (t: number) => {
  for (let s = 4; s >= 1; s--) { const t0 = T[s * 20 - 1] + 0.08; if (t >= t0) return {s, p: inout((t - t0) / 0.4)}; }
  return {s: 0, p: 1};
};
export const poseGeom = (t: number) => { const {s, p} = stageAt(t); return s === 0 ? geom(POSES[0]) : mix(geom(POSES[s - 1]), geom(POSES[s]), p); };

// --- text helpers ---------------------------------------------------------------------------------------------------
/** a text block that is stitched in by a needle running right to left (Arabic) or left to right */
const Stitch: React.FC<{t: number; t0: number; dur?: number; rtl?: boolean; y: number; children: React.ReactNode; out?: number; needle?: boolean}> =
  ({t, t0, dur = 0.7, rtl = false, y, children, out = Infinity, needle = true}) => {
    if (t < t0 || t > out + 0.35) return null;
    const p = t0 <= 0 ? 1 : ease((t - t0) / dur), o = 1 - c01((t - out) / 0.35);
    const X = 100 * (1 - p);
    const nx = rtl ? 1080 * (1 - p) : 1080 * p;
    return <>
      <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: o,
        clipPath: rtl ? `inset(-40% 0 -40% ${X}%)` : `inset(-40% ${X}% -40% 0)`}}>{children}</div>
      {needle && p > 0 && p < 1 ? <Needle x={nx} y={y + 60} o={Math.sin(Math.PI * p)}/> : null}
    </>;
  };

export const Handle: React.FC<{top: number; o?: number}> = ({top, o = 1}) =>
  <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o}}>
    <span style={{display: 'inline-block', fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: INK, letterSpacing: 1, paddingBottom: 8,
      borderBottom: `4px dashed ${CLAY}`, textShadow: '0 1px 0 #FFF6E6'}}>@heal.ingthroughquran</span>
  </div>;

export const Chip: React.FC<{k: number; done?: boolean; y?: number}> = ({k, done = false, y = 296}) =>
  <div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{padding: '12px 34px', borderRadius: 50, background: CREAM, border: `4px dashed ${CLAY}`, boxShadow: '0 6px 14px #7A3A1033, inset 0 0 0 4px #FFF6E6',
      fontFamily: ROUND, fontSize: 32, letterSpacing: 7, color: INK, whiteSpace: 'nowrap'}}>
      {done ? 'COMPLETE' : 'ISTIGHFAR'} · <span style={{color: CLAY}}>{k}</span> / 100
    </div>
  </div>;

/** the running-stitch counter ring */
export const Counter: React.FC<{t: number; k: number; cx?: number; cy?: number; o?: number; sc?: number}> = ({t, k, cx = 868, cy = 836, o = 1, sc = 1}) => {
  const r = 92, C = 2 * Math.PI * r, last = k > 0 ? T[k - 1] : -9;
  const pop = Math.exp(-Math.max(0, t - last) * 7) * (t >= last ? 1 : 0);
  const full = k === 100 ? c01((t - END) / 0.5) : 0;
  return <div style={{position: 'absolute', left: cx - 120, top: cy - 120, width: 240, height: 240, opacity: o, transform: `scale(${sc * (1 + 0.07 * pop)})`}}>
    <div style={{position: 'absolute', inset: 6, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #FFFBF0, #F6E6CA)',
      boxShadow: `0 10px 22px #7A3A1044, 0 0 ${40 * full + 18 * pop}px ${12 * full}px #FFD36A${full > 0 ? 'aa' : '66'}`}}/>
    <svg width={240} height={240} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <circle cx={120} cy={120} r={r} fill="none" stroke="#E6CFA6" strokeWidth={14} strokeDasharray="12 7" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
      <circle cx={120} cy={120} r={r} fill="none" stroke={full > 0 ? '#E0A53A' : CLAY} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${(C * k) / 100} ${C}`}
        transform="rotate(-90 120 120)" style={{filter: 'url(#yarn)'}}/>
      <circle cx={120} cy={120} r={r + 13} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="6 8" opacity={0.55}/>
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 60, textAlign: 'center', fontFamily: ROUND, fontSize: 92, lineHeight: 1, color: INK, filter: PUFF}}>{k}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 158, textAlign: 'center', fontFamily: ROUND, fontSize: 26, color: '#8A5A3A'}}>/ 100</div>
  </div>;
};

// rising wool motes in the dawn light
const MOTES = Array.from({length: 36}, (_, i) => ({x: random(`mx${i}`) * 1080, y: random(`my${i}`) * 1920, s: 3 + random(`ms${i}`) * 6,
  v: 10 + random(`mv${i}`) * 26, w: random(`mw${i}`) * 6.28}));
const Motes: React.FC<{t: number; boost?: number}> = ({t, boost = 0}) => <>
  {MOTES.map((m, i) => { const y = ((m.y - t * m.v * (1 + boost)) % 1920 + 1920) % 1920, x = m.x + Math.sin(t * 0.6 + m.w) * 24;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: m.s, height: m.s, borderRadius: '50%', background: '#FFF4D6',
      opacity: (0.35 + 0.35 * Math.sin(t * 1.7 + m.w)) * (0.7 + 0.6 * boost), boxShadow: `0 0 ${m.s * 2}px #FFE3A0`}}/>; })}
</>;

// --- the scene (also used by the cover) -------------------------------------------------------------------------------
export const Scene: React.FC<{t: number; light: number}> = ({t, light}) => <>
  {/* sky + dunes plate drifts slowly (far layer) */}
  <Img src={staticFile('plate.jpg')} style={{position: 'absolute', left: -40 - t * 0.6, top: -60 + Math.sin(t * 0.2) * 6,
    width: 1180, height: 2098}}/>
  {/* the sun behind the dunes grows warmer as he gets lighter */}
  <div style={{position: 'absolute', left: 540 - 700, top: 1080 - 600, width: 1400, height: 1000, borderRadius: '50%', mixBlendMode: 'screen',
    background: 'radial-gradient(closest-side, #FFE6A8, #FFC26A55 45%, #FFB04A00)', opacity: 0.25 + 0.6 * light}}/>
  {/* calm the sky under the lettering */}
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFF3DEb0 0px, #FFF3DE80 560px, #FFF3DE00 900px)'}}/>
</>;
const Front: React.FC<{travel: number}> = ({travel}) => {
  const w = 1300, h = 332, x = -((travel % w) + w) % w;
  return <>{[0, 1].map((j) => <Img key={j} src={staticFile('sprites/front.png')} style={{position: 'absolute', left: x + j * w - 2, top: 1688, width: w + 4, height: h}}/>)}</>;
};

export const Man: React.FC<{pose: Pose; g?: Geom; o?: number; bob?: number; tilt?: number; squash?: number}> = ({pose, g = geom(pose), o = 1, bob = 0, tilt = 0, squash = 0}) =>
  <Img src={staticFile(`sprites/${pose}.png`)} style={{position: 'absolute', left: g.left, top: g.top - bob, width: g.w, height: g.h, opacity: o,
    transformOrigin: '50% 100%', transform: `rotate(${tilt}deg) scaleY(${1 - squash})`}}/>;

export const IstighfarKnit: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const k = countAt(t);
  const {s: stage, p: sp} = stageAt(t);
  const released = t >= END + 0.45;
  const rel = c01((t - END - 0.45) / 0.35);
  const lightness = released ? 1 : (stage + sp) / 5;
  // walking: period shortens and the bob eases as he gets lighter; the ground scrolls faster
  let travel = 0; { const steps = 120; for (let i = 0; i < steps; i++) { const tt = (t * i) / steps; travel += (tt >= END + 0.45 ? 95 : 22 + 16 * stageAt(tt).s) * (t / steps); } }
  const period = released ? 0.62 : 1.15 - 0.1 * (stage + sp);
  const ph = (t / period) * Math.PI * 2;
  const bob = (released ? 7 : 4 + 2 * (4 - stage)) * Math.abs(Math.sin(ph));
  const tilt = (released ? 1.2 : 0.8) * Math.sin(ph);
  const last = k > 0 ? T[k - 1] : -9, hit = t >= last ? Math.exp(-(t - last) * 12) : 0;
  const g0 = poseGeom(t);
  const g = {...g0, top: g0.top - bob, y: g0.y - bob};
  const noteTop = released ? 972 : Math.max(860, Math.min(972, g0.y - 215));   // above the bowl's rim once he stands taller

  // the bowl, let go at 100: it tips back off his shoulders, turns over and lands behind him, then slides away with the ground
  const bowlM = META.bowl as {w: number; h: number};
  const gb = geom('man4');
  const bw = (gb.x1 - gb.x0) * 0.92, bh = (bw * bowlM.h) / bowlM.w;
  const bt = t - (END + 0.45), fallT = 0.75;
  const bx = (gb.x0 + gb.x1) / 2 - 230 * c01(bt / fallT) - (bt > fallT ? (travel - travelAt(END + 0.45 + fallT)) : 0);
  const by = bt < fallT ? lerp(gb.y + bh * 0.5, FEET - bh * 0.5 + 6, Math.pow(c01(bt / fallT), 2)) - 160 * Math.sin(Math.PI * c01(bt / fallT)) : FEET - bh * 0.5 + 6
    - (bt > fallT && bt < fallT + 0.3 ? 26 * Math.sin(Math.PI * (bt - fallT) / 0.3) : 0);
  const brot = -180 * ease(bt / fallT);

  // text timeline
  const swap = END + 0.7;              // dhikr -> "Taqabbal Allahu minna wa minkum"
  const ayahIn = END + 3.4;            // Nuh 71:10 (the transliteration above holds 1.6 s sharp first)
  const MILE: Record<number, string> = {1: 'a little lighter', 2: 'lighter still', 3: 'standing taller', 4: 'almost free'};
  const mileT = stage > 0 ? T[stage * 20 - 1] : -9, mileOn = stage > 0 && t - mileT < 1.9 && !released;

  return <AbsoluteFill style={{background: '#F6DDB8', overflow: 'hidden'}}>
    <YarnDefs/>
    <Scene t={t} light={lightness}/>
    <Motes t={t} boost={released ? rel : 0}/>
    {/* ground shadow */}
    <div style={{position: 'absolute', left: BOWL_CX - 260, top: FEET - 26, width: 520, height: 52, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #6A3A1A55, #6A3A1A00)'}}/>
    {/* the doll: carrying poses, cross-faded every 20, then free */}
    {!released || rel < 1 ? (() => {
      if (stage === 0) return <Man pose="man1" g={geom('man1')} bob={bob} tilt={tilt} squash={0.014 * hit} o={1 - rel}/>;
      const a = POSES[stage - 1], b = POSES[stage];
      return <>
        {sp < 1 ? <Man pose={a} g={geom(a)} bob={bob} tilt={tilt} o={(1 - sp) * (1 - rel)}/> : null}
        <Man pose={b} g={geom(b)} bob={bob} tilt={tilt} squash={0.012 * hit} o={sp * (1 - rel)}/>
      </>;
    })() : null}
    {released ? <Man pose="free" g={geom('free', BOWL_CX + 40)} bob={bob} tilt={tilt} o={rel}/> : null}
    {!released ? <Pile t={t} g={g} k={k}/> : null}
    {t >= END + 0.45 && bx > -bw ? <Img src={staticFile('sprites/bowl.png')} style={{position: 'absolute', left: bx - bw / 2, top: by - bh / 2, width: bw, height: bh,
      transform: `rotate(${brot}deg)`, filter: 'drop-shadow(0 8px 8px #00000044)'}}/> : null}
    {/* a ring of light on every 20, a burst at 100 */}
    {stage > 0 && t - mileT < 1.2 && !released ? <Burst t={t - mileT} x={BOWL_CX} y={g.y - 40} n={16} r={260}/> : null}
    {t >= END + 0.45 ? <Burst t={t - END - 0.45} x={BOWL_CX + 40} y={FEET - 380} n={28} r={460} big/> : null}
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: released ? 0.55 * rel : 0,
      background: `radial-gradient(ellipse 46% 30% at ${(BOWL_CX + 40) / 10.8}% 72%, #FFE7A8, #FFE7A800)`}}/>
    <Front travel={travel * 1.6}/>

    {/* lettering */}
    <Handle top={222}/>
    <Chip k={k} done={k === 100}/>
    <Stitch t={t} t0={0} y={326} rtl out={swap - 0.3} needle={false}>
      <div dir="rtl" style={{fontFamily: ARQ, fontSize: 132, lineHeight: 1.9, color: INK, WebkitTextStroke: `1.5px ${INK}`, filter: PUFF,
        transform: `scale(${1 + 0.035 * hit})`}}>{TX.dhikrAr}</div>
    </Stitch>
    <Stitch t={t} t0={swap} y={340} rtl>
      <div dir="rtl" style={{fontFamily: ARQ, fontSize: 104, lineHeight: 2.1, color: INK, WebkitTextStroke: `1.2px ${INK}`, filter: PUFF}}>{TX.endAr}</div>
    </Stitch>
    <Stitch t={t} t0={0} y={620} out={swap - 0.3} needle={false}>
      <div style={{fontFamily: ROUND, fontSize: 72, lineHeight: 1.1, letterSpacing: 3, color: INK, filter: PUFF}}>{TX.dhikrTr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, lineHeight: 1.2, color: '#7A4A2E'}}>
        I seek forgiveness from <span style={{color: CLAY}}>Allah</span></div>
    </Stitch>
    <Stitch t={t} t0={swap} y={620} out={ayahIn - 0.4}>
      <div style={{fontFamily: ROUND, fontSize: 56, lineHeight: 1.1, color: INK, filter: PUFF}}>{TX.endTr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, lineHeight: 1.3, color: '#7A4A2E'}}>{TX.endEn}</div>
    </Stitch>
    <Strand t={t} o={1 - c01((t - END) / 0.6)}/>
    <Counter t={t} k={k} o={1 - c01((t - ayahIn + 0.4) / 0.4)}/>
    {/* the side note: "Lighten your load", a word on every 20, then "Walk on, lighter" */}
    <SideNote o={(mileOn ? 0 : 1) * (t > swap ? 0 : 1)} title={'Lighten your\nload'} sub={'every istighfar\nknocks a sin away'} top={noteTop}/>
    {mileOn ? <SideNote o={c01((t - mileT) / 0.25) * (1 - c01((t - mileT - 1.6) / 0.3))} title={`${stage * 20} down`} sub={MILE[stage]} gold top={noteTop}/> : null}
    {t > swap && t < ayahIn + 0.4 ? <SideNote o={c01((t - swap) / 0.3) * (1 - c01((t - ayahIn) / 0.4))} title={'Walk on,\nlighter'} sub={'100 istighfar,\nand the bowl is empty'} gold/> : null}
    {t >= ayahIn ? <Ayah t={t - ayahIn}/> : null}
  </AbsoluteFill>;
};

// travel distance at time t (same integral as in the composition)
const travelAt = (t: number) => { let d = 0; const steps = 120; for (let i = 0; i < steps; i++) { const tt = (t * i) / steps; d += (tt >= END + 0.45 ? 95 : 22 + 16 * stageAt(tt).s) * (t / steps); } return d; };

const SideNote: React.FC<{o: number; title: string; sub: string; gold?: boolean; top?: number}> = ({o, title, sub, gold, top = 972}) => o <= 0 ? null :
  <div style={{position: 'absolute', left: 50, top, width: 300, textAlign: 'left', opacity: o, transform: `translateY(${(1 - o) * 14}px)`}}>
    <div style={{fontFamily: ROUND, fontSize: 40, lineHeight: 1.05, color: gold ? CLAY : INK, whiteSpace: 'pre-line', filter: PUFF}}>{title}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, marginTop: 8, color: '#7A4A2E', whiteSpace: 'pre-line'}}>{sub}</div>
  </div>;

const Burst: React.FC<{t: number; x: number; y: number; n: number; r: number; big?: boolean}> = ({t, x, y, n, r, big}) => {
  const d = big ? 1.6 : 1.0;
  if (t < 0 || t > d) return null;
  const p = ease(t / d), o = 1 - c01(t / d);
  return <>
    <div style={{position: 'absolute', left: x - r * p, top: y - r * p * 0.7, width: 2 * r * p, height: 1.4 * r * p, borderRadius: '50%',
      border: `${big ? 6 : 4}px dashed #FFD36A`, opacity: o * 0.9, filter: 'url(#yarn) drop-shadow(0 0 10px #FFD36A)'}}/>
    {Array.from({length: n}, (_, j) => { const a = (j / n) * Math.PI * 2 + 0.3, rr = r * p * (0.8 + 0.3 * random(`br${j}`));
      return <div key={j} style={{position: 'absolute', left: x + Math.cos(a) * rr - 6, top: y + Math.sin(a) * rr * 0.7 - 6 - 60 * p, width: 12, height: 12,
        borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFFBE8, #FFD670 55%, #E0A030)', boxShadow: '0 0 14px 5px #FFC64A99', opacity: o}}/>; })}
  </>;
};

/** Nuh 71:10 on a cream felt card, stitched in */
export const Ayah: React.FC<{t: number}> = ({t}) => {
  const o = ease(t / 0.6), p = ease(t / 1.0), en = ease((t - 0.9) / 0.6);
  return <div style={{position: 'absolute', left: 60, right: 60, top: 640, opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
    <div style={{position: 'relative', padding: '18px 34px 30px', borderRadius: 34, background: '#FFF7EAee', border: `4px dashed ${CLAY}`,
      boxShadow: '0 14px 30px #7A3A1040, inset 0 0 0 6px #FFF7EA', textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: ARQ, fontSize: 64, lineHeight: 2.15, color: INK, clipPath: `inset(-40% 0 -40% ${100 * (1 - p)}%)`}}>{TX.ayahAr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, lineHeight: 1.25, color: '#6A3A22', opacity: en}}>{TX.ayahEn}</div>
      <div style={{fontFamily: ROUND, fontSize: 26, letterSpacing: 4, marginTop: 14, color: CLAY, opacity: en}}>{TX.ayahRef.toUpperCase()} · {TX.ayahNote.toUpperCase()}</div>
    </div>
  </div>;
};
