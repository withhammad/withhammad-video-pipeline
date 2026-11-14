// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "The Islamic calendar
// months" (reference DceDi0tNenx by @samastoryworld, job 94e4bc8a3dc5, 13.7 s) rebuilt in knitted yarn.
// Same flow as the reference: the 12 months in a ring around a crescent and a calendar, lit one after another on the
// measured times, then the 3x4 grid with a small scene under each month. Two errors in the reference are fixed:
// month 8 was spelt "رمعبان" and Ramadan was missing from the ring.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {AR, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';

export const FPS = 30, DURATION = 13.7;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };
const out = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const SERIF = 'KnitSerif, serif';

export const MONTHS: [string, string][] = [
  ['مُحَرَّم', 'Muharram'], ['صَفَر', 'Safar'], ['رَبِيعُ الأَوَّل', "Rabi' al-Awwal"], ['رَبِيعُ الآخِر', "Rabi' al-Ākhir"],
  ['جُمَادَى الأُولَى', 'Jumādā al-Ūlā'], ['جُمَادَى الآخِرَة', 'Jumādā al-Ākhirah'], ['رَجَب', 'Rajab'], ['شَعْبَان', "Sha'bān"],
  ['رَمَضَان', 'Ramadan'], ['شَوَّال', 'Shawwal'], ['ذُو القَعْدَة', "Dhū al-Qa'dah"], ['ذُو الحِجَّة', 'Dhū al-Ḥijjah'],
];
// ring highlights measured on the reference at 4 fps: [month index, from, to]
const RING_HL: [number, number, number][] = [[0, 0.25, 1.85], [1, 1.85, 3.1], [2, 3.1, 3.85], [3, 3.85, 4.25], [4, 4.25, 4.65], [5, 4.65, 5.0], [6, 5.0, 5.35]];
const T_GRID = 5.25, T_MOVE = 0.65, T_WAVE = 6.1, WAVE = 0.6;

const C = {x: 540, y: 1095}, RX = 402, RY = 530;
// 12 points evenly spaced by arc length (not by angle), clockwise from the top, so no two patches overlap
const RING_PTS = (() => {
  const N = 2000, pts: {x: number; y: number; s: number}[] = [];
  let s = 0, px = 0, py = 0;
  for (let k = 0; k <= N; k++) {
    const a = -Math.PI / 2 + (k / N) * Math.PI * 2, x = C.x + RX * Math.cos(a), y = C.y + RY * Math.sin(a);
    if (k) s += Math.hypot(x - px, y - py); pts.push({x, y, s}); px = x; py = y;
  }
  return Array.from({length: 12}, (_, i) => { const target = (s * i) / 12; return pts.find((p) => p.s >= target) ?? pts[0]; });
})();
const ring = (i: number) => RING_PTS[i];
const grid = (i: number) => ({x: [190, 540, 890][i % 3], y: 600 + Math.floor(i / 3) * 330});
const RING_W = 232, RING_H = 148, GRID_W = 300, GRID_H = 176;

const Badge: React.FC<{i: number; t: number; lit: number}> = ({i, t, lit}) => {
  const m = interpolate(t, [T_GRID + 0.03 * i, T_GRID + 0.03 * i + T_MOVE], [0, 1], clamp);
  const r = ring(i), g = grid(i), k = ease(m);
  const x = r.x + (g.x - r.x) * k, y = r.y + (g.y - r.y) * k;
  const w = RING_W + (GRID_W - RING_W) * k, h = RING_H + (GRID_H - RING_H) * k;
  const pop = out((t - 0.02 * i) / 0.35);
  const s = (0.6 + 0.4 * pop) * (1 + 0.1 * lit);
  const [ar, en] = MONTHS[i];
  return <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: pop, transform: `scale(${s})`,
    zIndex: lit > 0.05 ? 3 : 2}}>
    <div style={{position: 'absolute', inset: -14, borderRadius: 40, opacity: lit, background: 'radial-gradient(closest-side, #FFD87A99, #FFB23A33 70%, #FFB23A00)',
      filter: 'blur(6px)'}}/>
    <Img src={staticFile('parts/badge.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill',
      filter: `drop-shadow(0 8px 10px #00000099) brightness(${1 + 0.18 * lit})`}}/>
    <div style={{position: 'absolute', left: '50%', top: -22, width: 50, height: 50, marginLeft: -25, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, #FFE7A0, #E2A93A 55%, #9C6A1C)', boxShadow: '0 3px 6px #00000088, inset 0 0 0 3px #F6D27C',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 30, color: '#2A1606', filter: 'url(#yarn)'}}>{i + 1}</div>
    <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: h * 0.12, textAlign: 'center', fontFamily: AR, fontSize: 52 + 6 * k,
      lineHeight: 1.45, color: '#FBF1DC', WebkitTextStroke: '1.5px #FBF1DC', filter: PUFF, whiteSpace: 'nowrap'}}>{ar}</div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: h * 0.13, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 27 + 3 * k,
      color: '#F2C463', filter: 'url(#yarn)', whiteSpace: 'nowrap', textShadow: '0 2px 3px #00000099'}}>{en}</div>
  </div>;
};

const Stars: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 26}, (_, k) => {
  const x = 60 + random(`hx${k}`) * 960, y = 340 + random(`hy${k}`) * 1380, s = 2 + random(`hs${k}`) * 4;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7B0',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A55`, opacity: 0.25 + 0.5 * Math.abs(Math.sin(f / (16 + random(`hp${k}`) * 18) + k))}}/>;
})}</>;

export const Hijri: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const ringLit = (i: number) => RING_HL.reduce((a, [k, s, e]) => k === i ? Math.max(a, Math.min(out((t - s) / 0.18), 1 - out((t - e) / 0.18))) : a, 0);
  const waveLit = (i: number) => { const s = T_WAVE + i * WAVE; return Math.max(0, Math.min(out((t - s) / 0.15), 1 - out((t - s - WAVE) / 0.25))) * 0.75; };
  const centerO = 1 - out((t - T_GRID) / 0.4), centerS = 1 - 0.25 * out((t - T_GRID) / 0.5);
  const intro = out(t / 0.4);
  return <AbsoluteFill style={{background: '#0B1230', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <YarnDefs/>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
      transform: `scale(${1.04 - 0.03 * (t / DURATION)})`}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 55%, #0B123000 30%, #050818aa 100%)'}}/>
    <Stars f={f}/>
    {/* title */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 392, textAlign: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 20}px)`}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 60, ...gold(t, 0.35), WebkitTextStroke: '2px #E7B040', filter: PUFF}}>
        The Islamic calendar months</div>
      <div style={{margin: '6px auto 0', width: 520, height: 0, borderTop: '4px dashed #D9A847', opacity: 0.9}}/>
    </div>
    {/* ring centre: knitted crescent + calendar, "12 Hijri months" */}
    <div style={{position: 'absolute', left: C.x - 290, top: C.y - 290, width: 580, height: 580, opacity: centerO * intro,
      transform: `scale(${centerS * (0.94 + 0.06 * intro)}) rotate(${Math.sin(t * 0.8) * 1.2}deg)`}}>
      <svg width={580} height={580} style={{position: 'absolute', inset: 0}}>
        <ellipse cx={290} cy={290} rx={278} ry={278} fill="none" stroke="#D9A847" strokeWidth={4} strokeDasharray="14 16" opacity={0.75}
          transform={`rotate(${t * 8} 290 290)`} style={{filter: 'url(#yarn)'}}/>
      </svg>
      <Img src={staticFile('parts/center.png')} style={{position: 'absolute', inset: 40, width: 500, height: 500, objectFit: 'contain',
        filter: 'drop-shadow(0 10px 14px #000000aa)'}}/>
      {/* the knitted calendar page (measured: x 221-471, y 209-391 in this box): soften the dots under the label */}
      <div style={{position: 'absolute', left: 226, top: 214, width: 240, height: 172, borderRadius: 14,
        background: 'radial-gradient(ellipse 70% 72% at 50% 50%, #101A45f2 55%, #101A4500 100%)'}}/>
      <div style={{position: 'absolute', left: 221, top: 206, width: 250, textAlign: 'center'}}>
        <div style={{fontFamily: AR, fontSize: 96, lineHeight: 1.05, ...gold(t, 0.4), WebkitTextStroke: '2px #E7B040', filter: PUFF}}>١٢</div>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 38, lineHeight: 1.3, color: '#FBF1DC', filter: PUFF}}>شَهْرًا هِجْرِيًّا</div>
      </div>
    </div>
    {/* little knitted scenes under each month in the grid */}
    {MONTHS.map((_, i) => { const g = grid(i), o = out((t - T_GRID - 0.35 - 0.04 * i) / 0.4);
      return o > 0 ? <Img key={`d${i}`} src={staticFile(`parts/d${i + 1}.png`)} style={{position: 'absolute', left: g.x - 105, top: g.y + 94, width: 210, height: 112,
        objectFit: 'contain', opacity: o, transform: `translateY(${(1 - o) * 16}px)`, filter: 'drop-shadow(0 6px 6px #00000088)'}}/> : null; })}
    {MONTHS.map((_, i) => <Badge key={i} i={i} t={t} lit={t < T_GRID + T_MOVE ? ringLit(i) : waveLit(i)}/>)}
    {/* her handle, in place of the reference's */}
    <div style={{position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', opacity: intro}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: '#F6E3BC', letterSpacing: 1, paddingBottom: 6,
        borderBottom: '3px dashed #D9A847', textShadow: '0 2px 3px #000000aa'}}>@heal.ingthroughquran</span>
    </div>
  </AbsoluteFill>;
};
