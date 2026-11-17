// IPO reel panels (job c1be587e1d6a). Educational only: facts from CNBC 10 Nov + Yahoo Finance / Motley Fool 16 Nov 2026
// (825M shares, $70-78 range, prices Nov 18, Nasdaq "ANT" from Nov 19, subject to clearance). No buy/sell call.
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial';
const ORANGE = '#e8794f', GREEN = '#3ddc84', RED = '#ff6b6b', INK = '#14161d', CARD = '#1d2029', LINE = '#2c303c', MUTE = '#8b90a0';
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const ap = (t: number, at: number, d = 0.28) => ease((t - at) / d);

export type Cue = Record<string, number>; // named moments (s, reel clock)

const Tabs: React.FC<{t: number; c: Cue; part: number}> = ({t, c, part}) => {
  const names = ['WHAT PEOPLE SAY', 'HOW TO GET IN', 'REAL OR CAP?'];
  return <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
    {names.map((n, i) => {
      const done = (i === 0 && t > c.p2) || (i === 1 && t > c.p3);
      const on = i + 1 === part;
      return <div key={n} style={{flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 12, fontSize: 19, fontWeight: 800, letterSpacing: 1,
        background: on ? ORANGE : done ? '#283a30' : '#262a35', color: on ? '#fff' : done ? GREEN : MUTE, border: `1.5px solid ${on ? ORANGE : LINE}`}}>{done ? '✓ ' : ''}{n}</div>;
    })}
  </div>;
};

const Frame: React.FC<{t: number; from: number; to: number; children: React.ReactNode}> = ({t, from, to, children}) => {
  const a = interpolate(t, [from, from + 0.3, to - 0.25, to], [0, 1, 1, 0], clamp);
  const s = interpolate(t, [from, from + 0.3], [0.94, 1], {...clamp, easing: ease});
  return <div style={{position: 'absolute', top: 150, left: 50, right: 50, height: 820, borderRadius: 34, background: INK, border: `2px solid ${LINE}`,
    boxShadow: '0 30px 80px rgba(0,0,0,.55)', padding: '26px 30px', fontFamily: F, color: '#fff', opacity: a, transform: `scale(${s})`, transformOrigin: '50% 0%', overflow: 'hidden'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, fontSize: 18, color: MUTE, fontWeight: 700, letterSpacing: 2}}>
      <span>ANTHROPIC IPO · EXPLAINED</span><span style={{color: '#ffd166'}}>NOT FINANCIAL ADVICE</span>
    </div>
    {children}
  </div>;
};

const Chart: React.FC<{k: number; sell: number}> = ({k, sell}) => {
  const pts = [[0, 150], [120, 148], [220, 140], [300, 70], [380, 40], [460, 95], [560, 60], [640, 120], [740, 80]];
  const n = Math.max(2, Math.ceil(k * pts.length));
  const d = pts.slice(0, n).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  return <svg width="760" height="190" viewBox="0 0 760 190" style={{display: 'block'}}>
    <line x1="0" y1="150" x2="760" y2="150" stroke={LINE} strokeDasharray="6 8" />
    <text x="6" y="176" fill={MUTE} fontSize="17" fontFamily={F}>IPO price</text>
    <text x="250" y="186" fill={MUTE} fontSize="17" fontFamily={F}>day one</text>
    <path d={d} fill="none" stroke={GREEN} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
    <g opacity={sell} transform={`translate(560,18) scale(${0.8 + sell * 0.2})`}>
      <rect width="130" height="54" rx="27" fill={ORANGE} /><text x="65" y="36" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800" fontFamily={F}>SELL</text>
    </g>
  </svg>;
};

// PART 1: what people say
export const Part1: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  if (t < c.p1 - 0.1 || t > c.p2) return null;
  const tag = ap(t, c.p1 + 0.5), lock = ap(t, c.p1 + 1.6), chart = interpolate(t, [c.pop, c.pop + 1.2], [0, 1], clamp);
  const sell = ap(t, c.sell), rich = ap(t, c.rich), slice = ap(t, c.piece, 0.5);
  return <Frame t={t} from={c.p1 - 0.1} to={c.p2}>
    <Tabs t={t} c={c} part={1} />
    <div style={{fontSize: 26, color: MUTE, marginBottom: 14}}>The story going around</div>
    <div style={{display: 'flex', gap: 16, marginBottom: 18}}>
      <div style={{opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`, background: CARD, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: '14px 20px'}}>
        <div style={{fontSize: 17, color: MUTE, fontWeight: 700}}>IPO PRICE RANGE</div><div style={{fontSize: 46, fontWeight: 800}}>$70–$78</div></div>
      <div style={{opacity: lock, transform: `translateY(${(1 - lock) * 14}px)`, background: CARD, border: `1.5px solid ${LINE}`, borderRadius: 18, padding: '14px 20px'}}>
        <div style={{fontSize: 17, color: MUTE, fontWeight: 700}}>WHEN</div><div style={{fontSize: 34, fontWeight: 800, marginTop: 6}}>🔒 Before it trades</div></div>
    </div>
    <div style={{background: CARD, borderRadius: 18, padding: '16px 18px', border: `1.5px solid ${LINE}`, opacity: t > c.pop - 0.2 ? 1 : 0}}>
      <Chart k={chart} sell={sell} />
      <div style={{fontSize: 34, fontWeight: 800, marginTop: 8, opacity: rich, color: '#ffd166'}}>“You're rich”… that's the story.</div>
    </div>
    <div style={{position: 'absolute', left: 30, right: 30, bottom: 26, display: 'flex', alignItems: 'center', gap: 20, opacity: slice}}>
      <svg width="110" height="110" viewBox="-55 -55 110 110"><circle r="50" fill={ORANGE} /><path d="M0,0 L50,0 A50,50 0 0,0 49.9,-3 Z" fill="#fff" /></svg>
      <div style={{fontSize: 30, fontWeight: 800}}>Your piece: <span style={{color: ORANGE}}>tiny</span></div>
    </div>
  </Frame>;
};

const STEPS: [string, string][] = [['broker', 'Check your broker offers IPO access'], ['section', 'Find the IPO section'], ['cash', 'Add cash before the price is set'],
  ['request', 'Request your shares'], ['confirm', 'Confirm when it prices']];
// PART 2: how to get in (no broker named: access varies by broker and country)
export const Part2: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  if (t < c.p2 || t > c.p3) return null;
  const tap = ap(t, c.tap, 0.2);
  return <Frame t={t} from={c.p2} to={c.p3}>
    <Tabs t={t} c={c} part={2} />
    <div style={{fontSize: 26, color: MUTE, marginBottom: 14}}>From your phone, if your broker offers it</div>
    <div style={{display: 'flex', gap: 22}}>
      <div style={{width: 250, height: 470, borderRadius: 36, background: '#0b0c10', border: '3px solid #3a3f4d', padding: '22px 16px', flexShrink: 0}}>
        <div style={{fontSize: 16, color: MUTE, fontWeight: 700}}>IPO ACCESS</div>
        <div style={{marginTop: 10, background: CARD, borderRadius: 14, padding: 12}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 800}}><span>ANT</span><span style={{color: GREEN, fontSize: 16}}>NOV 19</span></div>
          <div style={{fontSize: 15, color: MUTE}}>Anthropic · $70–$78</div>
        </div>
        <div style={{marginTop: 14, fontSize: 15, color: MUTE}}>Cash</div>
        <div style={{height: 10, borderRadius: 5, background: '#2a2e3a', marginTop: 6}}><div style={{width: `${ap(t, c.cash, 0.6) * 100}%`, height: 10, borderRadius: 5, background: GREEN}} /></div>
        <div style={{marginTop: 18, borderRadius: 16, padding: '12px 0', textAlign: 'center', fontSize: 18, fontWeight: 800,
          background: t > c.request ? GREEN : ORANGE, color: t > c.request ? '#08240f' : '#fff'}}>{t > c.confirm ? 'Requested ✓' : 'Request shares'}</div>
        <div style={{marginTop: 26, display: 'flex', justifyContent: 'center'}}>
          <div style={{width: 70, height: 70, borderRadius: 35, border: `3px solid ${ORANGE}`, transform: `scale(${1 + tap * 0.6})`, opacity: tap > 0 ? 1 - tap : 0}} />
        </div>
      </div>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 12}}>
        {STEPS.map(([k, s], i) => {
          const a = ap(t, c[k] - 0.1), done = t > c[k] + 0.35;
          return <div key={k} style={{opacity: a, transform: `translateX(${(1 - a) * 20}px)`, display: 'flex', gap: 12, alignItems: 'center', background: CARD, borderRadius: 14,
            padding: '16px 18px', border: `1.5px solid ${done ? '#2f6b47' : LINE}`, fontSize: 28, fontWeight: 700}}>
            <span style={{width: 34, height: 34, borderRadius: 17, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800,
              background: done ? GREEN : '#2a2e3a', color: done ? '#08240f' : MUTE}}>{done ? '✓' : i + 1}</span>{s}</div>;
        })}
        <div style={{marginTop: 4, fontSize: 24, color: MUTE, opacity: ap(t, c.confirm + 0.4)}}>No broker on the phone. No suit. Just a tap.</div>
      </div>
    </div>
  </Frame>;
};

// PART 3: real or cap
export const Part3: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  if (t < c.p3 || t > c.end) return null;
  const real = ap(t, c.real, 0.22), cal = ap(t, c.dates), one = ap(t, c.one), swing = ap(t, c.swing), nfa = ap(t, c.nfa), owner = ap(t, c.owner, 0.5);
  const bar = interpolate(t, [c.owner, c.owner + 1.0], [0, 1], clamp);
  return <Frame t={t} from={c.p3} to={c.end}>
    <Tabs t={t} c={c} part={3} />
    {t < c.real && <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: 'CpSerif', fontSize: 120, color: '#fff', opacity: ap(t, c.p3 + 0.05),
      transform: `scale(${0.9 + ap(t, c.p3 + 0.05) * 0.1})`}}>Real or cap?</div>}
    <div style={{display: 'flex', gap: 18, alignItems: 'center', marginBottom: 20, minHeight: 140}}>
      <div style={{opacity: real, transform: `scale(${1.6 - real * 0.6}) rotate(-4deg)`, background: GREEN, color: '#08240f', fontSize: 74, fontWeight: 800, padding: '8px 30px', borderRadius: 18, letterSpacing: 2}}>REAL</div>
      <div style={{opacity: cal, display: 'flex', gap: 12}}>
        {[['NOV 18', 'prices'], ['NOV 19', 'trades as ANT']].map(([d, l]) => <div key={d} style={{background: CARD, border: `1.5px solid ${LINE}`, borderRadius: 16, padding: '10px 16px', textAlign: 'center'}}>
          <div style={{fontSize: 30, fontWeight: 800, color: ORANGE}}>{d}</div><div style={{fontSize: 17, color: MUTE}}>{l}</div></div>)}
      </div>
    </div>
    <div style={{fontSize: 21, color: MUTE, marginBottom: 14, opacity: cal}}>825M shares · $70–$78 range · still subject to regulatory clearance</div>
    {[[one, '⚠️', 'You might get 1 share. Or none.'], [swing, '📉', 'Day-one prices swing hard, both ways.']].map(([a, i, s], k) =>
      <div key={k} style={{opacity: a as number, transform: `translateX(${(1 - (a as number)) * 20}px)`, display: 'flex', gap: 14, alignItems: 'center', background: '#2a1d1f',
        border: '1.5px solid #5a2f33', borderRadius: 14, padding: '16px 20px', fontSize: 31, fontWeight: 700, marginBottom: 12}}><span>{i as string}</span>{s as string}</div>)}
    <div style={{opacity: nfa, marginTop: 6, fontSize: 28, fontWeight: 800, color: '#ffd166'}}>Not financial advice. Check what your broker offers.</div>
    <div style={{position: 'absolute', left: 30, right: 30, bottom: 26, opacity: owner}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 20, color: MUTE, fontWeight: 700}}><span>825,000,000 shares</span><span>yours: 1 (maybe)</span></div>
      <div style={{height: 22, borderRadius: 11, background: '#2a2e3a', marginTop: 8, overflow: 'hidden'}}><div style={{width: `${bar * 100}%`, height: 22, background: ORANGE, borderRadius: 11}} /></div>
      <div style={{marginTop: 10, fontSize: 30, fontWeight: 800}}>Owner: <span style={{color: ORANGE}}>a very small one</span></div>
    </div>
  </Frame>;
};

// Hook title card over the 3D scene
export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  const range = ap(t, 1.2);
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>ANTHROPIC</div>
    <div style={{fontFamily: 'CpSerif', fontSize: 150, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)'}}>IPO</div>
    <div style={{display: 'flex', gap: 12, opacity: range, transform: `translateY(${(1 - range) * 12}px)`}}>
      <span style={{background: 'rgba(14,14,20,.7)', color: '#fff', fontWeight: 800, fontSize: 30, padding: '8px 16px', borderRadius: 12}}>$70–$78</span>
      <span style={{background: 'rgba(14,14,20,.7)', color: GREEN, fontWeight: 800, fontSize: 30, padding: '8px 16px', borderRadius: 12}}>NOV 19 · ANT</span>
    </div>
  </div>;
};
