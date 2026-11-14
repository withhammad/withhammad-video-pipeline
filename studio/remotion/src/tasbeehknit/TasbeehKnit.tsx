// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Tasbeeh Fatimah, a path to
// peace" (reference Dfg3MbGOjXE by @noovessa, 101.33 s, job 14977f878767) rebuilt in knitted yarn. Same audio (an instrumental pad,
// a bead tick on every count and a bell at every gate; no voice, no recitation) and the same flow on the reference clock: title
// and Bismillah, then 33 x SubhanAllah, 33 x Alhamdulillah, 34 x Allahu Akbar, each count on the frame where the reference counter
// steps (measured frame by frame), a gate that opens after each set, and "ma sha Allah, Tasbeeh complete" at 100.
// Knitted: a crochet night diorama (GPT Image 2) with a mosque whose windows light up gate by gate, felted tasbih beads on a yarn
// string that roll one slot per count into a crocheted counter medallion, three knitted mihrab gates with stitch progress, and
// colour per set (lavender, marigold, rose, then gold). Wow moments: the scene knits itself in stitch by stitch from the counter
// in the first second while the medallion springs up in a burst of pompoms, the beads drop onto the string and the gates swing
// in; at 100 every bead turns gold, the whole mosque and the lanterns light, crochet flowers bloom and gold pompoms burst.
// Arabic: texts.json, cut out of quran.com / Tanzil and Sahih Muslim 2137 by text.py (checked code point by code point).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Needle, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import TX from './texts.json';

export const FPS = 30, FRAMES = 3040;
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
/** spring 0 -> 1 with an overshoot; k = stiffness */
const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));

// ---- the reference clock (frames where the reference counter steps) -----------------------------------------------------
const seq = (a: number[]) => a;
const P1 = seq([95, 123, 152, 180, 207, 235, 263, 292, 319, 347, 376, 403, 431, 459, 487, 515, 543, 571, 599, 627, 655, 683, 711, 739, 767,
  795, 823, 851, 879, 907, 935, 963, 991]);
const P2 = seq([1063, 1091, 1119, 1147, 1175, 1203, 1231, 1259, 1287, 1315, 1343, 1371, 1399, 1427, 1455, 1483, 1511, 1539, 1567, 1595, 1623,
  1651, 1679, 1707, 1735, 1763, 1791, 1819, 1847, 1875, 1903, 1931, 1959]);
const P3 = seq([2013, 2041, 2069, 2097, 2125, 2153, 2181, 2209, 2237, 2265, 2293, 2321, 2349, 2377, 2405, 2433, 2461, 2489, 2517, 2545, 2573,
  2601, 2629, 2657, 2685, 2713, 2741, 2769, 2797, 2825, 2853, 2881, 2909, 2937]);
export const SETS = [P1, P2, P3];
export const N = [33, 33, 34];
const RESET = [1035, 1986];                   // the reference counter goes back to 0 for the next set
export const END_F = 2982;                    // 100
const GATE_T = [33.28, 65.46, 98.14];         // the gate bells (audio onsets)
const TEXT_T = [2.45, 34.62, 66.32, 99.4];   // dhikr line changes (reference: SubhanAllah 2.4-2.7, Alhamdulillah 34.7, Allahu Akbar 66.4, ma sha Allah 99.75)
// gate labels sit just above the counter medallion, each held at least 1.5 s after it is sharp
const PILL: [number, number, string][] = [[33.38, 35.05, 'Gate 1 opened'], [65.56, 67.25, 'Gate 2 opened'], [97.9, 99.6, 'All gates opened']];

export const PHASE = [
  {name: 'lav', main: '#C9B5F4', deep: '#7B5FD0', light: '#EFE7FF', glow: '#B79CFF'},
  {name: 'gold', main: '#F7BD45', deep: '#C47F12', light: '#FFE9B0', glow: '#FFC64A'},
  {name: 'rose', main: '#F2A6BC', deep: '#C25A7E', light: '#FFE3EB', glow: '#FF9DBB'},
];
const DHIKR = [
  {ar: TX.sub, tr: 'Subhan Allah', en: 'Glory be to Allah'},
  {ar: TX.hamd, tr: 'Alhamdulillah', en: 'All praise is for Allah'},
  {ar: TX.akbar, tr: 'Allahu Akbar', en: 'Allah is the Greatest'},
];

/** counts done in set g at frame f */
export const setCount = (g: number, f: number) => SETS[g].filter((x) => f >= x).length;
export const phaseAt = (f: number) => (f >= END_F ? 3 : f >= RESET[1] ? 2 : f >= RESET[0] ? 1 : 0);
const lastCountT = (f: number) => { let t = -9; for (const s of SETS) for (const x of s) if (f >= x) t = x / FPS; if (f >= END_F) t = END_F / FPS; return t; };

// ---- layout (1080 x 1920; every line of text sits between y 222 and 1500, none right of x 950 below y 1000) -------------------
export const O = {x: 560, y: 1360};          // the counter medallion (felt disc on the path, below the mosque)
const MED = 250;                              // medallion size
const WINDOWS = [645, 697, 752, 806, 855];   // mosque windows (x centre), top 1128, bottom 1180
const WIN_LIT = [33.3, 65.5, 98.15, 65.5, 33.3];   // gate 1 lights the outer pair, gate 2 the inner pair, gate 3 the middle
const LANTERNS: [number, number, number][] = [[963, 1190, 33.3], [731, 1320, 65.5], [491, 1232, 98.15]];
export const GATES = {y: 380, w: 232, h: 300, gap: 30};
export const gateX = (g: number) => 540 - (3 * GATES.w + 2 * GATES.gap) / 2 + g * (GATES.w + GATES.gap);

// ---- the tasbih string: a Catmull-Rom curve from inside the medallion, round the left and out to the right edge ------------
const CTRL: [number, number][] = [[O.x - 70, O.y + 35], [420, 1412], [362, 1365], [352, 1288], [400, 1226], [500, 1204], [620, 1212],
  [720, 1238], [840, 1262], [960, 1250], [1060, 1226], [1170, 1204], [1280, 1190]];
const STRING = (() => {
  const pts: {x: number; y: number; s: number}[] = [];
  let s = 0, px = CTRL[0][0], py = CTRL[0][1];
  for (let k = 0; k < CTRL.length - 1; k++) {
    const p0 = CTRL[Math.max(0, k - 1)], p1 = CTRL[k], p2 = CTRL[k + 1], p3 = CTRL[Math.min(CTRL.length - 1, k + 2)];
    for (let j = 0; j < 24; j++) {
      const u = j / 24, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      const x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1]);
      s += Math.hypot(x - px, y - py); pts.push({x, y, s}); px = x; py = y;
    }
  }
  pts.push({x: CTRL[CTRL.length - 1][0], y: CTRL[CTRL.length - 1][1], s: s + Math.hypot(CTRL[CTRL.length - 1][0] - px, CTRL[CTRL.length - 1][1] - py)});
  return pts;
})();
export const atLen = (s: number) => {
  if (s <= 0) return STRING[0];
  for (let k = 1; k < STRING.length; k++) if (STRING[k].s >= s) {
    const a = STRING[k - 1], b = STRING[k], u = (s - a.s) / Math.max(1e-6, b.s - a.s);
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s};
  }
  return STRING[STRING.length - 1];
};
export const S_RIM = STRING.find((p) => Math.hypot(p.x - O.x, p.y - O.y) > MED * 0.47)!.s;
export const SP = 46, BEAD = 44;
export const STRING_D = STRING.filter((_, k) => k % 2 === 0).map((p, n) => `${n ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** how many slots the string has rolled: one per count with a springy overshoot, plus a whoosh at each set change and at 100 */
const ALL_T = [...P1, ...P2, ...P3].map((x) => x / FPS);
const WHOOSH: [number, number, number][] = [[RESET[0] / FPS, 0.55, 7], [RESET[1] / FPS, 0.55, 7], [END_F / FPS, 0.9, 12]];
const roll = (t: number) => ALL_T.reduce((a, tc) => a + springy(t - tc, 1.15), 0) + WHOOSH.reduce((a, [t0, d, n]) => a + n * inout((t - t0) / d), 0);
/** which set colour a bead at slot p has at time t (the change runs outward from the medallion) */
const beadPhase = (t: number, p: number) => {
  let ph = 0;
  [RESET[0] / FPS, RESET[1] / FPS, END_F / FPS].forEach((t0, k) => { if (t - t0 > 0.03 * Math.max(0, p)) ph = k + 1; });
  return ph;
};
const BEAD_SRC = (ph: number, i: number) => staticFile(`parts/bead_${['lav', 'gold', 'rose', 'gold'][ph]}${((i % 5) + 5) % 5}.png`);

const Beads: React.FC<{t: number; f: number}> = ({t}) => {
  const r = roll(t), first = Math.floor(r) - 2, out: React.ReactNode[] = [];
  const intro = t < 1.5;
  for (let i = first; i < first + 30; i++) {
    const p = i - r;                                    // slot from the rim: 0 = just outside the medallion
    const s = S_RIM + SP * 0.5 + p * SP;
    if (s > STRING[STRING.length - 1].s + BEAD || s < S_RIM - SP * 1.2) continue;
    const q = atLen(s), ph = beadPhase(t, p);
    // entering the medallion: shrink and fade under its rim
    const enter = c01((S_RIM + SP * 0.15 - s) / (SP * 1.1));
    // intro: each bead drops onto the string with a bounce, from the medallion outward
    const t0 = 0.42 + 0.032 * Math.max(0, p), drop = intro ? springy(t - t0, 1.3) : 1;
    if (drop <= 0) continue;
    // colour change pop
    const tSw = [RESET[0] / FPS, RESET[1] / FPS, END_F / FPS].map((x) => x + 0.03 * Math.max(0, p));
    const pop = tSw.reduce((m, x) => Math.max(m, pulse(t - x, 0.28)), 0) * (t >= END_F / FPS ? 1.6 : 1);
    const sc = (1 - 0.55 * enter) * (1 + 0.25 * pop) * Math.min(1, 0.4 + 0.6 * drop);
    const y = q.y - 2 - (1 - drop) * 140;
    const glowC = ph === 3 ? '#FFC64A' : PHASE[ph].glow;
    out.push(<Img key={i} src={BEAD_SRC(ph, i)} style={{position: 'absolute', left: q.x - BEAD / 2, top: y - BEAD / 2, width: BEAD, height: BEAD,
      opacity: (1 - enter) * c01(drop * 3), transform: `rotate(${i * 47 - s * 1.1}deg) scale(${sc})`,
      filter: `drop-shadow(0 5px 4px #0000009a)${pop > 0.05 || ph === 3 ? ` drop-shadow(0 0 ${8 + 14 * pop}px ${glowC})` : ''}`}}/>);
  }
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: c01((t - 0.36) / 0.25)}}>
      <path d={STRING_D} stroke="#E8C77A" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeDasharray={intro ? `${2400 * ease((t - 0.36) / 0.7)} 4000` : undefined}
        style={{filter: 'url(#yarn) drop-shadow(0 3px 3px #00000099)'}}/>
    </svg>
    {out}
  </>;
};

// ---- the opening: the diorama knits itself in, stitch by stitch, outward from the medallion -----------------------------
const CW = 48, CH = 40, CD = 14;
const CELLS = (() => {
  const c: {x: number; y: number; at: number}[] = [];
  for (let j = -1; j < 1920 / CH + 1; j++) for (let i = 0; i < 1080 / CW; i++) {
    const x = i * CW, y = j * CH, d = Math.hypot(x + CW / 2 - O.x, y + CH / 2 - O.y);
    c.push({x, y, at: -0.2 + 0.95 * (d / 1500) + 0.14 * (random(`cell${i}-${j}`) - 0.5)});
  }
  return c;
})();
const KNIT_END = 0.98;
const chevron = `0,0 ${CW / 2},${CD} ${CW},0 ${CW},${CH} ${CW / 2},${CH + CD} 0,${CH}`;

const KnitIn: React.FC<{t: number}> = ({t}) => {
  if (t > KNIT_END + 0.4) return null;
  const done = CELLS.filter((c) => t >= c.at), fresh = done.filter((c) => t - c.at < 0.4);
  return <>
    {t < KNIT_END ? <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <mask id="unknit" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect width={1080} height={1920} fill="white"/>
          {done.map((c, n) => <polygon key={n} points={chevron} transform={`translate(${c.x} ${c.y})`} fill="black" stroke="black" strokeWidth={4} strokeLinejoin="round"/>)}
        </mask>
      </defs>
      {/* the not-yet-knitted ghost of the scene: dark, cold, flat */}
      <g mask="url(#unknit)">
        <image href={staticFile('bg.jpg')} width={1080} height={1920} style={{filter: 'brightness(0.34) saturate(0.45) blur(1.5px)'}}/>
      </g>
    </svg> : null}
    {/* warm light in each new stitch */}
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
      <g filter="url(#soft9)">
        {fresh.map((c, n) => <polygon key={n} points={chevron} transform={`translate(${c.x} ${c.y})`} fill="#FFD48A"
          opacity={0.55 * Math.pow(1 - (t - c.at) / 0.4, 1.6)}/>)}
      </g>
    </svg>
  </>;
};

// ---- pompoms (yarn balls) burst --------------------------------------------------------------------------------------
const POM_COLS = ['#C9B5F4', '#F7BD45', '#F2A6BC', '#7FC8C2', '#F59A7A', '#FBF1DC', '#9CC8F2', '#B6D77A'];
export const Burst: React.FC<{t: number; t0: number; x: number; y: number; n: number; cols?: string[]; power?: number; seed: string; size?: number}> =
  ({t, t0, x, y, n, cols = POM_COLS, power = 1, seed, size = 1}) => {
    const d = t - t0;
    if (d < 0 || d > 2.2) return null;
    return <>{Array.from({length: n}, (_, j) => {
      const a = (j / n) * Math.PI * 2 + random(`${seed}a${j}`) * 0.5, v = (420 + 380 * random(`${seed}v${j}`)) * power;
      // drag + gravity
      const k = 3.2, dist = (v / k) * (1 - Math.exp(-k * d));
      const px = x + Math.cos(a) * dist, py = y + Math.sin(a) * dist * 0.85 + 260 * d * d;
      const s = (12 + 14 * random(`${seed}s${j}`)) * size, o = c01(d / 0.06) * (1 - c01((d - 1.0) / 0.9));
      const c = cols[j % cols.length];
      return <div key={j} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
        transform: `rotate(${d * 400 * (random(`${seed}r${j}`) - 0.5)}deg)`,
        background: `radial-gradient(circle at 35% 30%, #ffffffcc 0%, ${c} 38%, ${c} 70%, #00000044 100%)`,
        boxShadow: `0 0 ${s * 0.5}px ${c}aa, 0 3px 4px #00000066`}}/>;
    })}</>;
  };

// ---- mosque windows and lanterns ------------------------------------------------------------------------------------
const winPath = (cx: number) => { const w = 15, top = 1128, bot = 1180; return `M ${cx - w} ${bot} L ${cx - w} ${top + 18} Q ${cx - w} ${top + 4} ${cx} ${top - 6} Q ${cx + w} ${top + 4} ${cx + w} ${top + 18} L ${cx + w} ${bot} Z`; };
export const MosqueLights: React.FC<{t: number; end: number; all?: boolean}> = ({t, end, all = false}) => {
  const lit = (t0: number) => (all ? 1 : ease((t - t0) / 0.5));
  const flick = (k: number) => 0.88 + 0.12 * Math.sin(t * (5 + k) + k * 2) * Math.sin(t * 2.3 + k);
  return <>
    {/* dome glow at the end */}
    <div style={{position: 'absolute', left: 745 - 300, top: 1010 - 260, width: 600, height: 520, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: 0.42 * end, background: 'radial-gradient(closest-side, #FFD98Acc 0%, #FFB54A55 45%, #FF9A2A00 100%)'}}/>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="winGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF2C2"/><stop offset="0.55" stopColor="#FFC65A"/><stop offset="1" stopColor="#E98A2A"/></linearGradient>
      </defs>
      {WINDOWS.map((x, k) => { const l = Math.max(lit(WIN_LIT[k]), end); if (l <= 0) return null;
        return <g key={k} opacity={l * flick(k)}>
          <path d={winPath(x)} fill="url(#winGold)" style={{mixBlendMode: 'screen'}} filter="url(#soft2)"/>
          <ellipse cx={x} cy={1158} rx={44} ry={52} fill="#FFC65A" opacity={0.35 + 0.25 * end} filter="url(#soft14)" style={{mixBlendMode: 'screen'}}/>
        </g>; })}
      {LANTERNS.map(([x, y, t0], k) => { const l = Math.max(lit(t0), end); if (l <= 0) return null;
        return <g key={k} opacity={l * flick(k + 5)} style={{mixBlendMode: 'screen'}}>
          <ellipse cx={x} cy={y} rx={13} ry={16} fill="#FFE7A6" filter="url(#soft2)"/>
          <circle cx={x} cy={y} r={58} fill="#FFB54A" opacity={0.42} filter="url(#soft14)"/>
        </g>; })}
    </svg>
  </>;
};

// ---- the three knitted gates ---------------------------------------------------------------------------------------
export const Gate: React.FC<{g: number; t: number; count: number; active: number; open: number; drop: number; allGold?: boolean}> =
  ({g, t, count, active, open, drop, allGold = false}) => {
    const x = gateX(g), n = N[g], P = PHASE[g], d = DHIKR[g];
    const isActive = active === g, done = count >= n;
    const dots = Math.floor((count * 11) / n);
    const flash = pulse(t - GATE_T[g], 0.6) * (open > 0 ? 1 : 0);
    const swing = drop < 1 ? 0 : 0;
    const dy = (1 - drop) * -170, rot = (1 - c01(drop)) * (g - 1) * 14 + 4 * Math.sin((t - 0.6 - 0.12 * g) * 9) * Math.exp(-(t - 0.6 - 0.12 * g) * 3.2) * (t > 0.6 ? 1 : 0);
    const dim = isActive || done || active === 3 ? 1 : 0.62;
    const sc = (isActive ? 1.04 : 1) * (1 + 0.07 * flash);
    return <div style={{position: 'absolute', left: x, top: GATES.y, width: GATES.w, height: GATES.h, opacity: c01(drop * 2.5) * (0.55 + 0.45 * dim),
      transform: `translateY(${dy + swing}px) rotate(${rot}deg) scale(${sc})`, transformOrigin: '50% 0%',
      filter: `drop-shadow(0 10px 12px #000000aa)${isActive || flash > 0 || allGold ? ` drop-shadow(0 0 ${10 + 26 * flash + (allGold ? 12 : 0)}px ${allGold ? '#FFC64A' : P.glow}${isActive ? 'cc' : '88'})` : ''}`}}>
      <Img src={staticFile(`parts/gate${g}.png`)} style={{position: 'absolute', inset: 0, width: GATES.w, height: GATES.h, objectFit: 'fill'}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 78, textAlign: 'center'}}>
        <div style={{fontFamily: SERIF, fontSize: 50, lineHeight: 1, ...(done ? gold(t + g, 0.4) : {color: P.light}), WebkitTextStroke: done ? '1px #E7B040' : undefined,
          filter: 'url(#yarn) drop-shadow(0 2px 2px #000000aa)'}}>{n}</div>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 38, lineHeight: 1.7, marginTop: 2, color: '#FBF1DC', filter: 'drop-shadow(0 2px 2px #000000aa)'}}>{d.ar}</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 21, lineHeight: 1, marginTop: -4, color: P.light, opacity: 0.92}}>{d.tr}</div>
        {/* 11 knit stitches fill as the set is counted */}
        <svg width={GATES.w} height={30} style={{display: 'block', margin: '10px auto 0', overflow: 'visible'}}>
          {Array.from({length: 11}, (_, j) => {
            const cx = GATES.w / 2 + (j - 5) * 16.5, on = j < dots;
            const popJ = on ? 1 + 0.5 * pulse(t - (SETS[g][Math.min(n - 1, Math.ceil(((j + 1) * n) / 11) - 1)] ?? 0) / FPS, 0.3) : 1;
            const fill = on ? (allGold ? '#F6C552' : P.main) : '#2A2E5A';
            return <g key={j} transform={`translate(${cx} 15) scale(${popJ})`}>
              <ellipse cx={-3} cy={0} rx={2.7} ry={8.5} transform="rotate(-20)" fill={fill} stroke={on ? P.light : '#5B5F8F'} strokeWidth={1}/>
              <ellipse cx={3} cy={0} rx={2.7} ry={8.5} transform="rotate(20)" fill={fill} stroke={on ? P.light : '#5B5F8F'} strokeWidth={1}/>
            </g>;
          })}
        </svg>
        <div style={{fontFamily: SERIF, fontSize: 22, lineHeight: 1, marginTop: 4, color: '#E9E2F6'}}>{Math.min(count, n)} / {n}</div>
      </div>
      {open > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: 16, mixBlendMode: 'screen', opacity: 0.55 * flash,
        background: `radial-gradient(closest-side, ${P.light} 0%, ${P.glow}55 50%, transparent 100%)`}}/> : null}
    </div>;
  };

// ---- the counter medallion ----------------------------------------------------------------------------------------------
export const Medallion: React.FC<{t: number; f: number}> = ({t, f}) => {
  const ph = phaseAt(f), g = Math.min(ph, 2);
  const shown = ph === 3 ? 100 : setCount(g, f);
  const lc = lastCountT(f), dc = t - lc;
  const appear = springy(t - 0.3, 1.25);
  const beat = (ph === 3 ? 1.6 : 1) * pulse(dc, 0.3);
  // tint crossfade at each set change and at 100
  const blend = (t0: number) => ease((t - t0) / 0.35);
  const layers = [
    {src: 'orb_lav', o: 1},
    {src: 'orb_gold', o: blend(RESET[0] / FPS) * (1 - blend(RESET[1] / FPS))},
    {src: 'orb_rose', o: blend(RESET[1] / FPS) * (1 - blend(END_F / FPS))},
    {src: 'orb_gold', o: blend(END_F / FPS)},
  ];
  const P = ph === 3 ? {main: '#F7BD45', deep: '#B9770F', light: '#FFE9B0', glow: '#FFC64A'} : PHASE[g];
  // progress ring: a stitched yarn arc that fills with the set and drains at the reset
  const n = ph === 3 ? 100 : N[g];
  const fill = Math.min(1, SETS[g].reduce((a, x) => a + springy(t - x / FPS, 1.1), 0) / n);
  const drain = ph >= 1 && ph < 3 ? 1 - ease((t - RESET[ph - 1] / FPS) / 0.45) : 0;
  const prog = ph === 3 ? 1 : Math.max(fill, drain);
  const R = 146, circ = 2 * Math.PI * R;
  const numPop = 1 + 0.3 * pulse(dc, 0.28);
  const end = ease((t - END_F / FPS) / 0.6);
  return <div style={{position: 'absolute', left: O.x - 200, top: O.y - 200, width: 400, height: 400, transform: `scale(${appear * (1 + 0.035 * beat)})`}}>
    {/* soft light pool under and behind */}
    <div style={{position: 'absolute', left: -80, top: -80, width: 560, height: 560, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: 0.45 + 0.35 * beat + 0.4 * end, background: `radial-gradient(closest-side, ${P.glow}aa 0%, ${P.glow}33 45%, transparent 100%)`}}/>
    <svg width={400} height={400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <circle cx={200} cy={200} r={R} stroke="#FBF1DC" strokeOpacity={0.3} strokeWidth={7} fill="none" strokeDasharray="10 7" style={{filter: 'url(#yarn)'}}/>
      <circle cx={200} cy={200} r={R} stroke={P.main} strokeWidth={11} fill="none" strokeLinecap="round" transform={`rotate(-90 200 200)`}
        strokeDasharray={`${circ * prog} ${circ}`} style={{filter: `url(#yarn) drop-shadow(0 0 ${6 + 10 * beat}px ${P.glow})`}}/>
    </svg>
    {layers.map((l, k) => l.o > 0.001 ? <Img key={k} src={staticFile(`parts/${l.src}.png`)} style={{position: 'absolute', left: 200 - MED / 2, top: 200 - MED / 2,
      width: MED, height: MED, opacity: l.o, filter: 'drop-shadow(0 12px 14px #000000b0)'}}/> : null)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 200 - 62, textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontSize: shown >= 100 ? 84 : 96, lineHeight: 1, color: '#2B2350', WebkitTextStroke: '2.2px #2B2350', transform: `scale(${numPop})`,
        filter: 'url(#yarn) drop-shadow(0 2px 1px #ffffff88)'}}>{shown}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 28, lineHeight: 1, marginTop: 4, color: '#4A3F70'}}>{ph === 3 ? 'pearls' : `/ ${n}`}</div>
    </div>
  </div>;
};

// ---- small things --------------------------------------------------------------------------------------------------
const STARS: [number, number, number][] = [[151, 426, 1], [901, 445, 1], [654, 789, 1], [72, 760, 0.7], [1010, 760, 0.8], [118, 600, 0.6],
  [980, 620, 0.6], [520, 905, 0.6], [470, 1010, 0.5], [1030, 1000, 0.6], [60, 1080, 0.6]];
export const Twinkles: React.FC<{t: number; boost: number}> = ({t, boost}) => <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
  {STARS.map(([x, y, s], k) => { const tw = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(t * (0.9 + random(`tw${k}`) * 1.4) + k)), 3);
    const r = (9 + 7 * tw) * s * (1 + 0.4 * boost);
    return <g key={k} opacity={Math.min(1, tw * (0.7 + 0.5 * boost))} style={{mixBlendMode: 'screen'}}>
      <path d={`M ${x - r} ${y} L ${x + r} ${y} M ${x} ${y - r} L ${x} ${y + r}`} stroke="#FFF1C9" strokeWidth={2.2} strokeLinecap="round"/>
      <circle cx={x} cy={y} r={3 * s} fill="#FFF6DA"/>
      <circle cx={x} cy={y} r={14 * s} fill="#FFE29A" opacity={0.35} filter="url(#soft6)"/>
    </g>; })}
</svg>;

const Motes: React.FC<{f: number; o: number}> = ({f, o}) => <>{Array.from({length: 24}, (_, k) => {
  const life = 260 + random(`ml${k}`) * 200, ph = (f + random(`mp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`mp${k}`) * life) / life);
  const x = 60 + random(`mx${k}-${gen}`) * 960 + Math.sin(u * 5 + k) * 26, y = 1700 - u * 1300, s = 2.5 + random(`ms${k}`) * 4;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7B0',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A55`, opacity: o * Math.sin(Math.PI * u) * (0.35 + 0.3 * Math.sin(f / 9 + k))}}/>;
})}</>;

/** at 100 a wreath of crochet flowers blooms round the medallion, clockwise from the top */
export const Blooms: React.FC<{t: number; t0: number}> = ({t, t0}) => <>{Array.from({length: 12}, (_, k) => {
  const p = springy(t - t0 - 0.055 * k, 1.25); if (p <= 0) return null;
  const a = -Math.PI / 2 + (k / 12) * Math.PI * 2, r = 172, s = k % 2 ? 58 : 74;
  const x = O.x + Math.cos(a) * r, y = O.y + Math.sin(a) * r;
  return <Img key={k} src={staticFile(`parts/bloom${[0, 4, 1, 5, 2, 3][k % 6]}.png`)} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s,
    transform: `scale(${p}) rotate(${(1 - p) * -120 + 8 * Math.sin(t * 1.1 + k)}deg)`, filter: 'drop-shadow(0 6px 6px #000000aa)'}}/>;
})}</>;

export const Handle: React.FC<{top: number; endP?: number}> = ({top, endP = 0}) => {
  const s = 1 + 0.08 * ease(endP);
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 6}}>
    <span style={{display: 'inline-block', position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: '#F6E3BC', letterSpacing: 1,
      paddingBottom: 5, borderBottom: '3px dashed #D9A847', transform: `scale(${s})`,
      textShadow: `0 2px 3px #000000aa, 0 0 ${18 * ease(endP)}px #FFC64A${Math.round(170 * ease(endP)).toString(16).padStart(2, '0')}`}}>
      @heal.ingthroughquran
      <span style={{position: 'absolute', left: 0, bottom: -3, height: 0, width: `${100 * endP}%`, borderBottom: '4px dashed #FFD877', filter: 'drop-shadow(0 0 6px #FFC64A)'}}/>
    </span>
  </div>;
};

export const Title: React.FC<{t: number; top: number; big?: number}> = ({t, top, big = 1}) => <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center'}}>
  <div style={{fontFamily: SERIF, fontSize: 64 * big, lineHeight: 1, ...gold(t, 0.22), WebkitTextStroke: `${1.2 * big}px #E7B040`, filter: PUFF}}>Tasbeeh Fatimah</div>
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 4 * big}}>
    <span style={{width: 70 * big, borderTop: '2px dashed #C9A35A'}}/>
    <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 27 * big, color: '#EADBF5', textShadow: '0 2px 3px #000000aa'}}>a path to peace</span>
    <span style={{width: 70 * big, borderTop: '2px dashed #C9A35A'}}/>
  </div>
</div>;

/** One big dhikr line: stitched in right to left by the needle, the meaning under it. */
const Line: React.FC<{t: number; start: number; end: number; ar: string; tr: string; en: string; style: React.CSSProperties; sub?: React.ReactNode; enO?: number; trDelay?: number; gap?: number}> =
  ({t, start, end, ar, tr, en, style, sub, enO = 1, trDelay = 0.12, gap = 10}) => {
    if (t < start || t > end + 0.25) return null;
    const d = t - start, rv = ease(d / 0.42), X = rv >= 1 ? 0 : 90 - 90 * rv;
    const out = interpolate(t, [end, end + 0.22], [1, 0], clamp);
    const trIn = ease((d - trDelay) / 0.3);
    return <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 674, textAlign: 'center', opacity: out, transform: `translateY(${-24 * (1 - out)}px)`, filter: out < 1 ? `blur(${(1 - out) * 5}px)` : undefined}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 106, lineHeight: 1.5, clipPath: `inset(-40% 0 -40% ${X}%)`, ...style}}>{ar}</div>
        <div style={{opacity: trIn, transform: `translateY(${(1 - trIn) * 14}px)`, marginTop: gap}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, lineHeight: 1.05, color: '#FBF1DC', textShadow: '0 2px 3px #000000cc'}}>{tr}</div>
          <div style={{fontFamily: SERIF, fontSize: 29, lineHeight: 1.2, color: '#E6DAF2', textShadow: '0 2px 3px #000000cc', opacity: enO}}>{en}</div>
          {sub}
        </div>
      </div>
      {rv < 1 ? <Needle x={1080 * X / 100} y={774} o={interpolate(d, [0, 0.05, 0.36, 0.42], [0, 1, 1, 0], clamp)}/> : null}
    </>;
  };

const Pill: React.FC<{t: number; a: number; b: number; text: string; col: string}> = ({t, a, b, text, col}) => {
  if (t < a || t > b + 0.3) return null;
  const i = springy(t - a, 1.4), o = c01((t - a) / 0.12) * (1 - c01((t - b) / 0.25));
  return <div style={{position: 'absolute', left: O.x - 540, right: 540 - O.x, top: 1146, display: 'flex', justifyContent: 'center', opacity: o, zIndex: 4}}>
    <div style={{padding: '6px 30px 9px', borderRadius: 40, background: 'linear-gradient(180deg, #2A2457, #1A1640)', border: `3px dashed ${col}`,
      boxShadow: `0 8px 18px #000000aa, 0 0 18px ${col}66`, transform: `translateY(${(1 - i) * 26}px) scale(${0.7 + 0.3 * i})`,
      fontFamily: SERIF, fontStyle: 'italic', fontSize: 31, lineHeight: 1.1, color: '#FFF4DA', whiteSpace: 'nowrap'}}>✦ {text} ✦</div>
  </div>;
};

export const Filters: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="soft2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={2}/></filter>
    <filter id="soft6" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={6}/></filter>
    <filter id="soft9" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9}/></filter>
    <filter id="soft14" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={14}/></filter>
  </defs>
</svg>;

export const TasbeehKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const ph = phaseAt(f), endT = END_F / FPS;
  const end = ease((t - endT) / 0.8);
  const counts = [0, 1, 2].map((g) => setCount(g, f));
  const open = GATE_T.map((x) => (t >= x ? 1 : 0));
  // scene camera: a pull-back reveal in the first 1.3 s, then a slow push toward the medallion
  const cam = 1 + 0.1 * (1 - ease(t / 1.3)) + 0.03 * c01((t - 1.3) / (FRAMES / FPS - 1.3)) + 0.012 * end;
  const lastC = lastCountT(f);
  const P = ph === 3 ? PHASE[1] : PHASE[ph];
  const endHandle = c01((t - 99.9) / 1.0);
  return <AbsoluteFill style={{background: '#120E2A', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <YarnDefs/>
    <Filters/>
    <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: `${O.x}px ${O.y - 160}px`}}>
      <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      {/* calm the sky behind the text block */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 30% at 50% 30%, #0E0A2466 0%, #0E0A2400 100%)'}}/>
      {/* moon glow breathes */}
      <div style={{position: 'absolute', left: 355 - 240, top: 955 - 240, width: 480, height: 480, borderRadius: '50%', mixBlendMode: 'screen',
        opacity: 0.32 + 0.1 * Math.sin(t * 0.8) + 0.2 * end, background: 'radial-gradient(closest-side, #FFF1C2aa 0%, #FFE09A33 50%, #FFE09A00 100%)'}}/>
      <MosqueLights t={t} end={end}/>
      <Twinkles t={t} boost={end}/>
      <Motes f={f} o={0.5 + 0.5 * end}/>
      <Beads t={t} f={f}/>
      <Medallion t={t} f={f}/>
      <Blooms t={t} t0={endT + 0.15}/>
      <KnitIn t={t}/>
    </AbsoluteFill>

    {/* bursts sit above the scene */}
    <Burst t={t} t0={0.3} x={O.x} y={O.y} n={28} seed="open" power={1.15}/>
    {GATE_T.map((x, g) => <Burst key={g} t={t} t0={x} x={gateX(g) + GATES.w / 2} y={GATES.y + GATES.h / 2} n={16} seed={`g${g}`} power={0.55} size={0.8}
      cols={[PHASE[g].main, PHASE[g].light, '#F7BD45', PHASE[g].deep]}/>)}
    <Burst t={t} t0={endT} x={O.x} y={O.y} n={40} seed="end" power={1.5} size={1.15} cols={['#F7BD45', '#FFE9B0', '#C9B5F4', '#F2A6BC', '#7FC8C2', '#F59A7A']}/>
    <Burst t={t} t0={endT + 0.35} x={750} y={1000} n={22} seed="end2" power={0.9} cols={['#F7BD45', '#FFE9B0', '#FFD06A']}/>
    {lastC > 0 && ph < 3 ? <Burst t={t} t0={lastC} x={O.x} y={O.y - 110} n={5} seed={`c${Math.round(lastC * 30)}`} power={0.22} size={0.55}
      cols={[P.main, P.light]}/> : null}

    {/* text: handle, title, gates, dhikr, pills */}
    <Handle top={222} endP={endHandle}/>
    <Title t={t} top={272}/>
    {[0, 1, 2].map((g) => <Gate key={g} g={g} t={t} count={counts[g]} active={ph} open={open[g]} drop={springy(t - 0.55 - 0.13 * g, 1.1)} allGold={end > 0.5}/>)}

    <Line t={t} start={0.32} end={TEXT_T[0] - 0.1} ar={TX.bism} tr="Count with me" en="33 · 33 · 34" gap={32}
      style={{color: '#FBF1DC', WebkitTextStroke: '2px #FBF1DC', filter: `${PUFF} drop-shadow(0 0 22px #FFFFFF44)`}}/>
    {DHIKR.map((d, g) => <Line key={g} t={t} start={TEXT_T[g]} end={TEXT_T[g + 1] - 0.08} ar={d.ar} tr={d.tr} en={d.en}
      style={{color: PHASE[g].light, WebkitTextStroke: `2px ${PHASE[g].main}`, filter: `${PUFF} drop-shadow(0 0 ${18 + 30 * pulse(t - lastC, 0.35)}px ${PHASE[g].glow}88)`}}/>)}
    <Line t={t} start={TEXT_T[3]} end={999} ar={TX.masha} tr="Tasbeeh complete" en="Small beads… big peace" trDelay={0.08}
      style={{...gold(t, 0.35), WebkitTextStroke: '2px #E7B040', filter: `${PUFF} drop-shadow(0 0 30px #FFC64A99)`}}
      sub={<div style={{display: 'flex', justifyContent: 'center', gap: 26, marginTop: 12}}>{[0, 1, 2].map((k) => {
        const p = springy(t - TEXT_T[3] - 0.3 - 0.12 * k, 1.3);
        return <span key={k} style={{fontSize: 40, lineHeight: 1, color: '#FFD45E', display: 'inline-block', transform: `scale(${p}) rotate(${(1 - p) * 120}deg)`,
          textShadow: '0 0 14px #FFC64A, 0 2px 2px #000000aa'}}>✦</span>; })}</div>}/>
    {PILL.map(([a, b, s], k) => <Pill key={k} t={t} a={a} b={b} text={s} col={k === 2 ? '#F7BD45' : PHASE[k].main}/>)}
  </AbsoluteFill>;
};
