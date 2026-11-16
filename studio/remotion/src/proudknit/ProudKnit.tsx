// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Don't be proud".
// The reference De6-fTIo_S0 by @abduvaseeq (21.5 s) rebuilt in knitted yarn with 2D MOTION GRAPHICS ONLY (no Blender, owner rule).
// Same flow on the reference's own clock, same soundtrack (untouched: the spoken Arabic of Shaykh Ibn al-Uthaymin's commentary
// with the reference's own soft pad, whooshes and closing chime; it is not Quran, nothing is added over it):
//   0.00-1.95  WEALTH: the faceless knitted doll stands proud on a mound of knitted gold coins, holding one up; the mound
//              crumbles into gold fluff on the wind
//   1.95-3.70  BEAUTY: he poses at a gold cable-knit mirror; the mirror blows away
//   3.70-5.20  BODY: a gold muscle body; it blows away
//   5.20-6.85  CHILDREN: two little dolls hold his hands; they fade to gold dust
//   6.85-8.45  MANSIONS: a gold knitted palace rises behind him, then goes
//   8.45-9.55  CARS: a gold knitted car rolls in, headlights on, then goes
//   9.55-12.4  THIS WORLDLY LIFE, EVER: a gold city rises, he reaches for the sun; the wind strips it all, the sky burns to sunset,
//              he bows his head
//  12.4-13.85  RATHER: a stitched seam sweeps the dusk away to a dark night; a knitted hand reaches up from the dark
//  13.85-16.2  IF ALLAH GRANTS YOU SUCCESS IN ATTAINING PIETY: a beam of light comes down; he walks into it; a gold heart glows
//  16.2-21.5   THEN THAT IS FROM ALLAH'S BOUNTY UPON YOU: he kneels, then goes down into sujood in the light; knitted flowers grow
//              around him, motes rise on the reference's chime (~19.0 s)
// Every part is knitwork: GPT Image 2 plates and doll / prop sprites (gen.sh), keyed by prep.py. One generic faceless doll; no
// prophet, no named person. The Arabic line is set in Amiri Quran and never goes through the yarn displacement filter (text.py
// checks every line against the printed commentary).
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {AR_PUFF, ArDefs} from '../lanternknit/LanternKnit';
import SPR from './sprites.json';
import TX from './texts.json';

export const FPS = 30, FRAMES = 645;             // 21.5 s (the reference: 21.50 s video and audio)
export const SANS = 'KnitSans, sans-serif', SERIF = 'KnitSerif, serif', AR = 'AmiriQ, "Amiri Quran", serif';
const SP = SPR as unknown as Record<string, [number, number]>;

// ---- helpers -----------------------------------------------------------------------------------------------------------------
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => Math.min(c01((t - a) / fi), 1 - c01((t - (b - fo)) / fo));

// ---- the clock (s): beats on the reference's caption changes and the speaker's words (Whisper, energy onsets) ----------------
export const B = {wealth: 0, beauty: 1.95, body: 3.7, kids: 5.2, home: 6.85, car: 8.45, world: 9.55, wind: 11.15, night: 12.4,
  hand: 12.6, beam: 13.85, walk: 14.15, heart: 15.2, kneel: 16.3, sujood: 17.25, bloom: 18.3, chime: 19.0, end: 21.5};
// the dissolves: each worldly thing blows away a little before the next word
const GONE = {coins: 1.42, mirror: 3.2, flex: 4.75, kids: 6.38, home: 8.02, car: 9.2};
// captions: [in, out]
export const CAP: [number, number][] = [[0, 1.85], [2.05, 3.6], [3.85, 5.15], [5.2, 6.75], [6.95, 8.45], [8.5, 9.5], [9.55, 12.3],
  [12.65, 13.75], [13.8, 15.15], [15.15, 16.15], [16.2, 21.5]];

// ---- the stage ---------------------------------------------------------------------------------------------------------------
export const GY = 905;                           // the ground line under the doll's feet
const DOLL = 300;                                // the standing doll's drawn height
// drawn height per pose (measured on the keyed sprites so every pose is the same doll size)
const H: Record<string, number> = {man_stand: DOLL, man_proud: 297, man_admire: 303, man_flex: 300, man_front: 298, child: 170,
  man_reach: 268, man_bow: 263, man_heart: DOLL, man_kneel: 185, man_sujood: 110,
  coins: 170, mirror: 380, car: 170, mansion: 430, city: 600, hand: 760};

/** a sprite: (x, y) is the bottom centre, h the drawn height */
export const Sprite: React.FC<{n: string; x: number; y: number; h?: number; flip?: boolean; rot?: number; o?: number; origin?: string;
  filter?: string; style?: React.CSSProperties}> = ({n, x, y, h = H[n], flip, rot = 0, o = 1, origin = '50% 100%', filter, style}) => {
  const [w0, h0] = SP[n] ?? [1, 1];
  const w = (h * w0) / h0;
  if (o <= 0.001) return null;
  return <Img src={staticFile(`sprites/${n}.png`)} style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, opacity: o,
    transformOrigin: origin, transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
    filter: filter ?? 'drop-shadow(0 8px 8px #00000077)', ...style}}/>;
};
export const spriteW = (n: string, h = H[n]) => { const [w0, h0] = SP[n] ?? [1, 1]; return (h * w0) / h0; };

/** a worldly thing blowing away: it fades, blurs, brightens and drifts with the wind */
const gone = (t: number, t0: number, d = 0.5): {o: number; style: React.CSSProperties} => {
  const u = c01((t - t0) / d);
  return {o: 1 - ease(u), style: {transform: `translate(${40 * u}px, ${-12 * u}px)`}};
};
const goneFilter = (t: number, t0: number, d = 0.5) => {
  const u = c01((t - t0) / d);
  return `drop-shadow(0 8px 8px #00000077) blur(${(5 * u).toFixed(2)}px) brightness(${(1 + 0.8 * u).toFixed(2)})`;
};

/** gold wool fluff and sequins carried off by the wind from a box (x, y = top-left) at t0 */
const Dust: React.FC<{t: number; t0: number; x: number; y: number; w: number; h: number; n?: number; seed: string; dur?: number; wind?: number}> =
  ({t, t0, x, y, w, h, n = 70, seed, dur = 1.5, wind = 380}) => {
  const d = t - t0;
  if (d < 0 || d > dur + 0.5) return null;
  return <>{Array.from({length: n}, (_, k) => {
    const dk = d - 0.4 * random(`${seed}d${k}`);
    if (dk < 0 || dk > dur) return null;
    const x0 = x + w * random(`${seed}x${k}`), y0 = y + h * random(`${seed}y${k}`);
    const vx = wind * (0.4 + 0.9 * random(`${seed}v${k}`)), vy = -(40 + 150 * random(`${seed}u${k}`));
    const px = x0 + vx * dk + 14 * Math.sin(dk * 7 + k), py = y0 + vy * dk + 10 * Math.sin(dk * 5 + k * 1.7);
    const s = 3 + 8 * random(`${seed}s${k}`), o = c01(dk / 0.08) * (1 - Math.pow(dk / dur, 2));
    const sequin = k % 4 === 0;
    return <div key={k} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: sequin ? s * 0.55 : s, borderRadius: sequin ? 2 : '50%',
      opacity: o, transform: sequin ? `rotate(${(k * 47 + dk * 400) % 360}deg)` : undefined,
      background: sequin ? '#FFE08A' : 'radial-gradient(closest-side, #FFF4C8, #F2C04E 55%, #F2C04E00)', boxShadow: sequin ? '0 0 6px #FFC84C' : undefined}}/>;
  })}</>;
};

/** slow wool fluff over the whole scene (the reference's floating dots), two depths for parallax */
const Fluff: React.FC<{t: number; tint: string; n?: number; depth?: number}> = ({t, tint, n = 22, depth = 1}) => <>{Array.from({length: n}, (_, k) => {
  const x = ((random(`fx${depth}${k}`) * 1180 + t * depth * (8 + 12 * random(`fs${k}`))) % 1180) - 50;
  const y = ((random(`fy${depth}${k}`) * 1100 - t * depth * (6 + 8 * random(`fv${k}`))) % 1100 + 1100) % 1100 + 80;
  const s = (3 + 6 * random(`fz${depth}${k}`)) * depth;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', opacity: 0.25 + 0.35 * random(`fo${k}`),
    background: `radial-gradient(closest-side, ${tint}, ${tint}00)`}}/>;
})}</>;

/** a gold running stitch drawn across the ground line on every beat (the stitch transition) */
const Stitch: React.FC<{t: number; t0: number; y?: number}> = ({t, t0, y = GY + 34}) => {
  const d = t - t0;
  if (d < 0 || d > 0.9) return null;
  const u = ease(d / 0.4), o = 1 - c01((d - 0.45) / 0.45);
  const x1 = 60 + 960 * u;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    <path d={`M 60 ${y} L ${x1} ${y}`} stroke="#3A2A12" strokeWidth={9} strokeDasharray="22 14" strokeLinecap="round" fill="none"/>
    <path d={`M 60 ${y - 1} L ${x1} ${y - 1}`} stroke="#F2C04E" strokeWidth={5} strokeDasharray="22 14" strokeLinecap="round" fill="none"/>
    <circle cx={x1} cy={y} r={7} fill="#FFF4C8" opacity={u < 1 ? 1 : 0} style={{filter: 'drop-shadow(0 0 8px #FFC84C)'}}/>
  </svg>;
};

// ---- DUSK: the worldly things ------------------------------------------------------------------------------------------------
const Wealth: React.FC<{t: number}> = ({t}) => {
  if (t > B.beauty + 0.1) return null;
  const rise = ease(t / 0.35);
  const sink = ease((t - GONE.coins) / 0.5);           // the mound collapses under him
  const ch = H.coins * (1 - 0.85 * sink);
  const cw = spriteW('coins');
  const top = GY + 26 - ch * 0.86;                     // the top of the mound where his feet stand
  const g = gone(t, GONE.coins, 0.55);
  const feet = lerp(top, GY, sink);
  const pose = t < GONE.coins + 0.25 ? 'man_proud' : 'man_stand';
  return <>
    <Img src={staticFile('sprites/coins.png')} style={{position: 'absolute', left: 540 - cw / 2, top: GY + 26 - ch, width: cw, height: ch, opacity: g.o * (0.7 + 0.3 * rise),
      filter: goneFilter(t, GONE.coins, 0.55), transform: `scale(${0.92 + 0.08 * rise})`, transformOrigin: '50% 100%'}}/>
    <Dust t={t} t0={GONE.coins} x={540 - cw / 2} y={GY + 26 - H.coins} w={cw} h={H.coins} n={110} seed="coin"/>
    <Sprite n={pose} x={540 + (pose === 'man_proud' ? 14 : 0)} y={feet} o={1 - c01((t - B.beauty + 0.05) / 0.15)}/>
  </>;
};
const Beauty: React.FC<{t: number}> = ({t}) => {
  if (t < B.beauty - 0.1 || t > B.body + 0.1) return null;
  const inn = ease((t - B.beauty) / 0.35), out = 1 - c01((t - B.body + 0.05) / 0.15);
  const mx = 690, mh = H.mirror, mw = spriteW('mirror');
  const g = gone(t, GONE.mirror, 0.55);
  // the glass: an ellipse in the middle of the frame (the sprite's oval opening)
  const gx = mx, gy = GY - mh * 0.56, rx = mw * 0.3, ry = mh * 0.33;
  return <>
    <div style={{opacity: g.o * inn, ...g.style, position: 'absolute', inset: 0}}>
      <Sprite n="mirror" x={mx} y={GY + 6} filter={goneFilter(t, GONE.mirror, 0.55)}/>
      {/* his reflection, flipped, dimmed, inside the glass */}
      <div style={{position: 'absolute', left: gx - rx, top: gy - ry, width: 2 * rx, height: 2 * ry, borderRadius: '50%', overflow: 'hidden',
        background: 'radial-gradient(closest-side, #8E8C92, #4A4850)', opacity: 0.9}}>
        <Sprite n="man_admire" x={rx + 8} y={2 * ry + 30} h={H.man_admire * 0.62} flip filter="brightness(1.3) sepia(0.6)"/>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, #FFFFFF00 30%, #FFFFFF33 45%, #FFFFFF00 60%)',
          transform: `translateX(${-120 + 240 * c01((t - B.beauty - 0.3) / 1.2)}px)`}}/>
      </div>
    </div>
    <Dust t={t} t0={GONE.mirror} x={mx - mw / 2} y={GY - mh} w={mw} h={mh} n={90} seed="mir"/>
    <Sprite n="man_admire" x={430} y={GY} o={out * c01((t - B.beauty + 0.1) / 0.15)}/>
  </>;
};
const Body: React.FC<{t: number}> = ({t}) => {
  if (t < B.body - 0.1 || t > B.kids + 0.1) return null;
  const pump = ease((t - B.body) / 0.3);
  const fw = spriteW('man_flex');
  return <>
    <Sprite n="man_flex" x={540} y={GY} h={H.man_flex * (0.82 + 0.18 * pump) * (1 + 0.012 * Math.sin(t * 9))}
      o={pump * gone(t, GONE.flex, 0.5).o} filter={goneFilter(t, GONE.flex, 0.5)}/>
    <Dust t={t} t0={GONE.flex} x={540 - fw / 2} y={GY - H.man_flex} w={fw} h={H.man_flex * 0.7} n={100} seed="flex"/>
    <Sprite n="man_stand" x={540} y={GY} o={c01((t - GONE.flex - 0.1) / 0.3) * (1 - c01((t - B.kids + 0.05) / 0.15))}/>
  </>;
};
const Kids: React.FC<{t: number}> = ({t}) => {
  if (t < B.kids - 0.1 || t > B.home + 0.1) return null;
  const inn = ease((t - B.kids) / 0.4);
  const g = gone(t, GONE.kids, 0.5);
  const hop = (k: number) => 6 * Math.abs(Math.sin((t - B.kids) * 6 + k));
  return <>
    <Sprite n="child" x={lerp(330, 392, inn)} y={GY - hop(0) * g.o} flip o={inn * g.o} filter={goneFilter(t, GONE.kids)}/>
    <Sprite n="child" x={lerp(750, 688, inn)} y={GY - hop(1.3) * g.o} o={inn * g.o} filter={goneFilter(t, GONE.kids)}/>
    <Dust t={t} t0={GONE.kids} x={350} y={GY - H.child} w={90} h={H.child} n={40} seed="k1"/>
    <Dust t={t} t0={GONE.kids} x={650} y={GY - H.child} w={90} h={H.child} n={40} seed="k2"/>
    <Sprite n={t < GONE.kids + 0.3 ? 'man_front' : 'man_stand'} x={540} y={GY} o={1 - c01((t - B.home + 0.05) / 0.15)}/>
  </>;
};
const Home: React.FC<{t: number}> = ({t}) => {
  if (t < B.home - 0.1 || t > B.car + 0.1) return null;
  const up = ease((t - B.home) / 0.55);
  const mw = spriteW('mansion');
  const g = gone(t, GONE.home, 0.55);
  return <>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: GY + 22, overflow: 'hidden'}}>
      <Sprite n="mansion" x={540} y={GY + 22 + 140 * (1 - up)} o={g.o * c01(up * 3)} filter={goneFilter(t, GONE.home, 0.55)} style={g.style}/>
    </div>
    <Dust t={t} t0={GONE.home} x={540 - mw / 2} y={GY - H.mansion} w={mw} h={H.mansion} n={140} seed="home"/>
    <Sprite n={t < GONE.home + 0.3 ? 'man_front' : 'man_stand'} x={540} y={GY + 6} o={1 - c01((t - B.car + 0.05) / 0.15)}/>
  </>;
};
const Car: React.FC<{t: number}> = ({t}) => {
  if (t < B.car - 0.1 || t > B.world + 0.1) return null;
  const u = ease((t - B.car) / 0.55);
  const cx = lerp(1350, 430, u), cw = spriteW('car');
  const g = gone(t, GONE.car, 0.45);
  const bob = u < 1 ? 2 * Math.sin(t * 40) : 0;
  return <>
    <div style={{opacity: g.o, position: 'absolute', inset: 0, ...g.style}}>
      {/* headlight beams to the left */}
      <div style={{position: 'absolute', left: cx - cw / 2 - 260, top: GY - H.car * 0.55, width: 300, height: 90, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #FFF4C8aa, #FFE08A33 60%, #FFE08A00)', filter: 'blur(6px)', opacity: 0.6 + 0.4 * Math.sin(t * 3)}}/>
      <Sprite n="car" x={cx} y={GY + 10 + bob} filter={goneFilter(t, GONE.car, 0.45)}/>
    </div>
    <Dust t={t} t0={GONE.car} x={430 - cw / 2} y={GY - H.car} w={cw} h={H.car} n={110} seed="car"/>
    <Sprite n="man_stand" x={790} y={GY} flip o={1 - c01((t - B.world + 0.05) / 0.15)}/>
  </>;
};
const World: React.FC<{t: number}> = ({t}) => {
  if (t < B.world - 0.1 || t > B.night + 0.6) return null;
  const up = ease((t - B.world) / 0.6);
  const cw = spriteW('city');
  const g = gone(t, B.wind, 0.9);
  const bowed = t > B.wind + 0.45;
  return <>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: GY + 22, overflow: 'hidden'}}>
      <Sprite n="city" x={600} y={GY + 22 + 200 * (1 - up)} o={g.o * c01(up * 3)} filter={goneFilter(t, B.wind, 0.9)} style={g.style}/>
    </div>
    <Dust t={t} t0={B.wind} x={600 - cw / 2} y={GY - H.city} w={cw} h={H.city} n={260} seed="city" dur={1.8} wind={460}/>
    <Sprite n={bowed ? 'man_bow' : 'man_reach'} x={bowed ? 330 : 345} y={GY + 4} flip={!bowed} o={c01((t - B.world + 0.1) / 0.15)}/>
  </>;
};

// the sky burns to sunset as the world blows away
const Sunset: React.FC<{t: number}> = ({t}) => {
  const u = ease((t - B.wind) / 1.0);
  if (u <= 0) return null;
  return <>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #2A0E0A00 0%, #8A2A1488 50%, #C2512455 62%, #00000000 75%)', opacity: u, mixBlendMode: 'screen'}}/>
    <div style={{position: 'absolute', left: 240 - 60, top: lerp(260, GY - 70, u), width: 120, height: 120, borderRadius: '50%', opacity: 0.85 * u,
      background: 'radial-gradient(closest-side, #FFB27A, #E2643A 70%, #E2643A00)', boxShadow: '0 0 80px 30px #E2643A55'}}/>
  </>;
};

// ---- NIGHT: the hand, the beam, the heart, the sujood ----------------------------------------------------------------------------
const BX = 560;                                  // the beam's centre line
const Beam: React.FC<{t: number}> = ({t}) => {
  const grow = ease((t - B.beam) / 0.7);
  if (grow <= 0) return null;
  const fl = 0.9 + 0.1 * Math.sin(t * 4.3) + 0.05 * Math.sin(t * 11);
  const boost = 1 + 0.35 * c01((t - B.sujood) / 1.2);
  const bottom = GY + 30;
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: fl}}>
      <defs>
        <linearGradient id="pkbeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE9B0" stopOpacity={0.15}/><stop offset="0.6" stopColor="#FFD878" stopOpacity={0.35 * boost}/>
          <stop offset="1" stopColor="#FFF2CC" stopOpacity={0.6 * boost}/>
        </linearGradient>
        <filter id="pkblur"><feGaussianBlur stdDeviation={16}/></filter>
        {/* the beam comes down: a soft-edged mask, its lower edge feathered over 160 px */}
        <linearGradient id="pkfade" x1="0" y1={0} x2={0} y2={1920} gradientUnits="userSpaceOnUse">
          <stop offset={Math.max(0, (bottom + 160) * grow - 160) / 1920} stopColor="#fff"/>
          <stop offset={((bottom + 160) * grow) / 1920} stopColor="#000"/>
        </linearGradient>
        <mask id="pkclip" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}><rect x={0} y={0} width={1080} height={1920} fill="url(#pkfade)"/></mask>
      </defs>
      <g mask="url(#pkclip)">
        <polygon points={`${BX - 110},0 ${BX + 110},0 ${BX + 190},${bottom} ${BX - 190},${bottom}`} fill="url(#pkbeam)" filter="url(#pkblur)"/>
        <polygon points={`${BX - 34},0 ${BX + 34},0 ${BX + 60},${bottom} ${BX - 60},${bottom}`} fill="#FFF4D6" opacity={0.28 * boost} filter="url(#pkblur)"/>
        {/* knitted rays: thin yarn strands down the beam */}
        {[-80, -40, 10, 55, 95].map((dx, k) => <line key={k} x1={BX + dx * 0.6} y1={0} x2={BX + dx * 1.4} y2={bottom} stroke="#FFE7A6"
          strokeWidth={2} strokeDasharray="10 8" opacity={0.25 + 0.15 * Math.sin(t * 2 + k)}/>)}
      </g>
      <ellipse cx={BX} cy={bottom} rx={240 * grow} ry={36} fill="#FFD36A" opacity={0.6 * c01((t - B.beam - 0.5) / 0.4) * boost} filter="url(#pkblur)"/>
    </svg>
  </>;
};
const BeamMotes: React.FC<{t: number}> = ({t}) => {
  const d = t - B.beam - 0.4;
  if (d < 0) return null;
  const chime = c01((t - B.chime) / 0.3);
  return <>{Array.from({length: 46}, (_, k) => {
    const life = 2 + random(`ml${k}`) * 1.6, t0 = random(`mt${k}`) * 2;
    if (d < t0) return null;
    const a = ((d - t0) % life + life) % life;
    const late = k >= 28;                         // the extra motes rise on the chime
    if (late && chime <= 0) return null;
    const x = BX + (random(`mx${k}`) - 0.5) * (late ? 380 : 300) + 14 * Math.sin(a * 3 + k);
    const y = GY + 10 - a * (late ? 220 : 120) * (0.6 + 0.6 * random(`mv${k}`));
    const s = 4 + 7 * random(`ms${k}`), o = Math.sin(Math.PI * a / life) * c01(d / 0.5) * (late ? chime : 1);
    return <div key={k} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', opacity: o,
      background: 'radial-gradient(closest-side, #FFFBE8, #FFD36A 55%, #FFD36A00)'}}/>;
  })}</>;
};
const Hand: React.FC<{t: number}> = ({t}) => {
  const o = win(t, B.hand, B.beam + 0.2, 0.4, 0.5);
  if (o <= 0) return null;
  const u = ease((t - B.hand) / 0.9);
  const hw = spriteW('hand');
  return <Sprite n="hand" x={hw / 2 - 60} y={1920 + 260 - 470 * u} o={o} filter="drop-shadow(0 0 30px #00000099) brightness(0.9)"/>;
};
/** the doll in the night: walks into the beam, hand on heart, kneels, sujood */
const Worshipper: React.FC<{t: number}> = ({t}) => {
  if (t < B.night) return null;
  // far and small in the dark before the beam, then he walks into it
  const walkU = ease((t - B.walk) / 0.95);
  const x = lerp(250, BX, walkU);
  const walking = t > B.walk && t < B.walk + 0.95;
  const bob = walking ? 4 * Math.abs(Math.sin((t - B.walk) * 10)) : 0;
  const lit = c01((t - B.walk - 0.6) / 0.5);
  const glow = `drop-shadow(0 8px 8px #00000077) drop-shadow(0 0 ${(18 * lit).toFixed(1)}px #FFD27Acc) brightness(${(0.7 + 0.45 * lit).toFixed(2)})`;
  const o = c01((t - B.night - 0.3) / 0.4);
  // pose crossfades
  const xk = c01((t - B.kneel) / 0.25), xs = c01((t - B.sujood) / 0.3);
  const pose = (n: string, w: number) => w > 0 ? <Sprite key={n} n={n} x={n === 'man_sujood' ? BX - 8 : n === 'man_kneel' ? BX - 10 : x} y={GY + 6 - (n === 'man_stand' || n === 'man_heart' ? bob : 0)} o={o * w} filter={glow}/> : null;
  const standW = t < B.heart ? 1 : 0, heartW = t >= B.heart ? 1 - xk : 0;
  return <>
    {pose('man_stand', standW * (t < B.heart ? 1 : 0))}
    {pose('man_heart', heartW)}
    {pose('man_kneel', xk * (1 - xs))}
    {pose('man_sujood', xs)}
  </>;
};
/** piety: a glowing heart and a gold yarn ring that opens around his chest */
const Heart: React.FC<{t: number}> = ({t}) => {
  const d = t - B.heart;
  if (d < 0 || t > B.kneel + 0.3) return null;
  const o = c01(d / 0.2) * (1 - c01((t - B.kneel) / 0.3));
  const cx = BX + 12, cy = GY - DOLL * 0.62;
  const r = 40 + 70 * ease(d / 0.6);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    <circle cx={cx} cy={cy} r={r} stroke="#F2C04E" strokeWidth={4} strokeDasharray="14 9" fill="none" opacity={1 - 0.5 * c01((d - 0.6) / 0.6)}
      transform={`rotate(${d * 40} ${cx} ${cy})`}/>
    <circle cx={cx} cy={cy} r={22 + 4 * Math.sin(d * 7)} fill="#FFD36A" opacity={0.55} style={{filter: 'blur(10px)'}}/>
  </svg>;
};
/** knitted flowers and grass tufts growing out from him on both sides */
const Bloom: React.FC<{t: number}> = ({t}) => {
  const d = t - B.bloom;
  if (d < 0) return null;
  const items = Array.from({length: 26}, (_, k) => {
    const side = k % 2 ? 1 : -1, i = Math.floor(k / 2);
    const x = BX + side * (150 + i * 30 + 14 * random(`bx${k}`));
    return {k, x, delay: i * 0.08 + 0.1 * random(`bd${k}`), h: 24 + 34 * random(`bh${k}`), flower: random(`bf${k}`) > 0.35,
      col: ['#FFF4DC', '#F2C04E', '#FFE08A', '#F7D9C4'][k % 4]};
  });
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    {items.map(({k, x, delay, h, flower, col}) => {
      const u = ease((d - delay) / 0.5);
      if (u <= 0) return null;
      const top = GY + 18 - h * u;
      const sway = 3 * Math.sin(t * 2 + k);
      return <g key={k}>
        <path d={`M ${x} ${GY + 20} Q ${x + sway} ${(GY + 20 + top) / 2} ${x + sway * 1.5} ${top}`} stroke="#6F7A3A" strokeWidth={5} strokeLinecap="round" fill="none"/>
        <path d={`M ${x} ${GY + 20} Q ${x + sway} ${(GY + 20 + top) / 2} ${x + sway * 1.5} ${top}`} stroke="#A3AE5A" strokeWidth={2} strokeDasharray="4 4" fill="none"/>
        {!flower && <path d={`M ${x - 10} ${GY + 20} Q ${x - 12} ${GY + 6 - 10 * u} ${x - 16} ${GY - 4 - 8 * u}`} stroke="#7F8A44" strokeWidth={4} strokeLinecap="round" fill="none"/>}
        {flower && <g transform={`translate(${x + sway * 1.5} ${top}) scale(${u})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-8} rx={6} ry={9} fill={col} stroke="#00000033" strokeWidth={1}
            transform={`rotate(${a + t * 8})`}/>)}
          <circle cx={0} cy={0} r={5} fill="#C48A26"/>
        </g>}
      </g>;
    })}
  </svg>;
};

/** the dusk -> night seam: a stitched zigzag sweeps left to right, the night is on its left */
const Seam: React.FC<{t: number; u: number}> = ({t, u}) => {
  if (u <= 0 || u >= 1) return null;
  const x = 1080 * u;
  const pts: string[] = [];
  for (let k = 0; k <= 64; k++) pts.push(`${(x + (k % 2 ? 12 : -12)).toFixed(1)} ${k * 30}`);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <polyline points={pts.join(' ')} stroke="#3A2A12" strokeWidth={9} fill="none"/>
    <polyline points={pts.join(' ')} stroke="#F2C04E" strokeWidth={5} fill="none" style={{filter: 'drop-shadow(0 0 10px #FFC84C)'}}/>
    <rect x={x - 4} y={0} width={8} height={1920} fill="#FFF4C8" opacity={0.3 + 0.2 * Math.sin(t * 30)}/>
  </svg>;
};

// ---- captions: one Arabic line + the English line, per beat --------------------------------------------------------------------
const rich = (s: string) => {
  // [word] = coral (the reference's red accent), {word} = gold with a yarn underline
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]|\{([^}]+)\}|([^[{]+)/g;
  let m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m[1]) parts.push(<span key={k++} style={{color: '#F08A6E'}}>{m[1]}</span>);
    else if (m[2]) parts.push(<span key={k++} style={{color: '#F7C556', textDecoration: 'underline', textDecorationThickness: 5, textUnderlineOffset: 10,
      textDecorationStyle: 'dashed'}}>{m[2]}</span>);
    else parts.push(<span key={k++}>{m[3]}</span>);
  }
  return parts;
};
const Caption: React.FC<{t: number; i: number}> = ({t, i}) => {
  const [a, b] = CAP[i];
  const last = i === CAP.length - 1;
  // the first line is the hook: already on screen on frame 0 (half drawn), so a sound-off viewer reads it at once
  const o = i === 0 ? 1 - c01((t - (b - 0.22)) / 0.22) : last ? c01((t - a) / 0.2) : win(t, a, b, 0.18, 0.22);
  if (o <= 0) return null;
  const u = i === 0 ? 1 : ease((t - a) / 0.55);
  const L = TX.lines[i];
  return <div style={{position: 'absolute', top: 1190, left: 140, right: 140, textAlign: 'center', opacity: o}}>
    <div dir="rtl" lang="ar" style={{fontFamily: AR, fontSize: 66, lineHeight: 1.55, color: '#F2C04E', filter: AR_PUFF,
      clipPath: `inset(-40% 0 -40% ${100 - 100 * u}%)`}}>{L.ar}</div>
    <div style={{fontFamily: SANS, fontSize: 60, lineHeight: 1.16, color: '#F7EFE3', marginTop: 4, filter: 'url(#yarnSoft) drop-shadow(0 4px 4px #000000cc)',
      clipPath: `inset(-40% ${100 - 100 * u}% -40% 0)`, transform: `translateY(${8 * (1 - u)}px)`}}>{rich(L.en)}</div>
  </div>;
};
/** a gentler fibre filter for the English body text (the title filter #yarn would blur 64 px words) */
const SoftDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>
  <filter id="yarnSoft" x="-5%" y="-30%" width="110%" height="160%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves={2} seed={11} result="fib"/>
    <feDisplacementMap in="SourceGraphic" in2="fib" scale={2.2} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>;

// ---- the scene at a scene time ts ---------------------------------------------------------------------------------------------------
export const Scene: React.FC<{ts: number; t: number}> = ({ts, t}) => {
  const seam = ease((ts - B.night) / 0.55);
  // a slow push on every beat and a slower drift of the plate (parallax: plate < props < fluff)
  const beats = [B.wealth, B.beauty, B.body, B.kids, B.home, B.car, B.world, B.night, B.beam, B.kneel];
  let b0 = 0;
  for (const b of beats) if (ts >= b) b0 = b;
  const push = 1 + 0.035 * inout((ts - b0) / 2.2) + (ts >= B.sujood ? 0.05 * inout((ts - B.sujood) / 3.5) : 0);
  const drift = 10 * Math.sin(t * 0.35);
  const dusk = <AbsoluteFill>
    <Img src={staticFile('plates/dusk.jpg')} style={{position: 'absolute', left: -43 + drift * 0.5, top: -170, width: 1080 * 1.08, height: 1920 * 1.08}}/>
    <Sunset t={ts}/>
    <Fluff t={t} tint="#F2C04E" n={18} depth={0.7}/>
    <AbsoluteFill style={{transformOrigin: `540px ${GY}px`, transform: `scale(${push})`}}>
      <Wealth t={ts}/><Beauty t={ts}/><Body t={ts}/><Kids t={ts}/><Home t={ts}/><Car t={ts}/><World t={ts}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFE7A6" n={10} depth={1.6}/>
  </AbsoluteFill>;
  const night = <AbsoluteFill>
    <Img src={staticFile('plates/night.jpg')} style={{position: 'absolute', left: -43 - drift * 0.5, top: -170, width: 1080 * 1.08, height: 1920 * 1.08,
      filter: `brightness(${0.75 + 0.25 * c01((ts - B.beam) / 1)})`}}/>
    <Fluff t={t} tint="#E8E2D6" n={22} depth={0.6}/>
    <AbsoluteFill style={{transformOrigin: `${BX}px ${GY}px`, transform: `scale(${push})`}}>
      <Beam t={ts}/>
      <Bloom t={ts}/>
      <Worshipper t={ts}/>
      <Heart t={ts}/>
      <BeamMotes t={ts}/>
    </AbsoluteFill>
    <Fluff t={t} tint="#FFF1CC" n={8} depth={1.5}/>
    <Hand t={ts}/>
  </AbsoluteFill>;
  return <AbsoluteFill>
    {seam < 1 && dusk}
    {seam > 0 && <AbsoluteFill style={{clipPath: `inset(0 ${(100 - 100 * seam).toFixed(2)}% 0 0)`}}>{night}</AbsoluteFill>}
    <Seam t={t} u={seam}/>
    {[B.beauty, B.body, B.kids, B.home, B.car, B.world, B.beam, B.kneel].map((b) => <Stitch key={b} t={ts} t0={b - 0.05}/>)}
  </AbsoluteFill>;
};

export const ProudKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return <AbsoluteFill style={{background: '#120E0A', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/><ArDefs/><SoftDefs/>
    <Scene ts={t} t={t}/>
    {/* the text bed: the ground fades to near black under the captions, like the reference */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 1000px, #0B0907c8 1160px, #0B0907e0 1520px, #0B090700 1800px)'}}/>
    {CAP.map((_, i) => <Caption key={i} t={t} i={i}/>)}
    {/* a fade in from black on frame 0 would hide the hook: the first frame already shows the doll on the gold */}
  </AbsoluteFill>;
};
