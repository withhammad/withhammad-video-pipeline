// LOCAL AI reel panels (job 154b32644087). Our own test on the owner's Mac (M1 Pro, 16 GB), 17 Nov 2026:
// qwen3:1.7b (1.4 GB) wrote a 3-sentence email in 7.5 s at 64.8 tokens/s, 100% GPU; qwen3.6 (23 GB) did not finish
// loading within 180 s. GPU price: RTX 5090 street price about $6-7k in Nov 2026 (launch $1,999).
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const ORANGE = '#e8794f', GREEN = '#3ddc84', RED = '#ff6b6b', INK = '#14161d', CARD = '#1d2029', LINE = '#2c303c', MUTE = '#8b90a0', SKY = '#7cc4ff';
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const ap = (t: number, at: number, d = 0.28) => ease((t - at) / d);
export type Cue = Record<string, number>;

const Frame: React.FC<{t: number; from: number; to: number; kicker: string; children: React.ReactNode}> = ({t, from, to, kicker, children}) => {
  if (t < from - 0.05 || t > to) return null;
  const a = interpolate(t, [from, from + 0.3, to - 0.2, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 150, left: 50, right: 50, height: 820, borderRadius: 34, background: INK, border: `2px solid ${LINE}`,
    boxShadow: '0 30px 80px rgba(0,0,0,.55)', padding: '28px 32px', fontFamily: F, color: '#fff', opacity: a, transform: `scale(${0.95 + 0.05 * ease((t - from) / 0.3)})`, transformOrigin: '50% 0%', overflow: 'hidden'}}>
    <div style={{fontSize: 20, letterSpacing: 2, fontWeight: 800, color: SKY, marginBottom: 18}}>{kicker}</div>
    {children}
  </div>;
};
const Box: React.FC<{a: number; children: React.ReactNode; border?: string; bg?: string}> = ({a, children, border = LINE, bg = CARD}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`, background: bg, border: `2px solid ${border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 14}}>{children}</div>;

export const Where: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.where} to={c.offline} kicker="WHERE THE AI RUNS">
  <Box a={ap(t, c.where + 0.2)}><div style={{fontSize: 30, color: MUTE}}>Normally</div><div style={{fontSize: 44, fontWeight: 800, marginTop: 6}}>💬 → ☁️ data center</div><div style={{fontSize: 26, color: MUTE, marginTop: 6}}>like streaming a movie</div></Box>
  <Box a={ap(t, c.local)} border={GREEN}><div style={{fontSize: 30, color: GREEN}}>Local AI</div><div style={{fontSize: 44, fontWeight: 800, marginTop: 6}}>⬇️ onto your laptop</div><div style={{fontSize: 26, color: MUTE, marginTop: 6}}>like downloading the movie</div></Box>
  <div style={{display: 'flex', gap: 14, opacity: ap(t, c.local + 1.2)}}><Box a={1}><div style={{fontSize: 32, fontWeight: 800}}>✈️ works offline</div></Box><Box a={1} border={GREEN}><div style={{fontSize: 32, fontWeight: 800}}>🔒 stays private</div></Box></div>
</Frame>;

export const Offline: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.offline} to={c.how} kicker="WHY PEOPLE WANT IT">
  <Box a={ap(t, c.offline + 0.1)}><div style={{fontSize: 46, fontWeight: 800}}>✈️ Works offline</div><div style={{fontSize: 26, color: MUTE, marginTop: 6}}>even on a plane</div></Box>
  <Box a={ap(t, c.private)} border={GREEN}><div style={{fontSize: 46, fontWeight: 800}}>🔒 Never leaves your laptop</div><div style={{fontSize: 26, color: MUTE, marginTop: 6}}>what you type stays on your machine</div></Box>
</Frame>;

export const How: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.how} to={c.test} kicker="HOW TO GET ONE">
  {[[c.dl, '1', 'Download Ollama', 'free'], [c.pick, '2', 'Pick a small model', 'Gemma 4 · Qwen 3'], [c.cloud, '3', 'Skip anything tagged “cloud”', 'those run on their servers']].map(([at, n, a, b]) =>
    <Box key={n as string} a={ap(t, at as number)} border={n === '3' ? ORANGE : LINE}><div style={{display: 'flex', gap: 18, alignItems: 'center'}}>
      <div style={{width: 56, height: 56, borderRadius: 28, background: n === '3' ? ORANGE : SKY, color: INK, fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{n}</div>
      <div><div style={{fontSize: 38, fontWeight: 800}}>{a}</div><div style={{fontSize: 24, color: MUTE, marginTop: 4}}>{b}</div></div></div></Box>)}
</Frame>;

export const Test: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const bar = interpolate(t, [c.small, c.small + 1.2], [0, 1], clamp);
  return <Frame t={t} from={c.test} to={c.gpu} kicker="WE TESTED IT · MACBOOK PRO M1 PRO · 16 GB">
    <Box a={ap(t, c.small)} border={GREEN}><div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}><div style={{fontSize: 38, fontWeight: 800}}>Small model · 1.4 GB</div><div style={{fontSize: 40}}>✅</div></div>
      <div style={{fontSize: 26, color: MUTE, marginTop: 4}}>qwen3:1.7b · 3-sentence email</div>
      <div style={{height: 14, borderRadius: 7, background: '#2a2e3a', marginTop: 14}}><div style={{width: `${bar * 100}%`, height: 14, borderRadius: 7, background: GREEN}} /></div>
      <div style={{fontSize: 34, fontWeight: 800, marginTop: 12, color: GREEN}}>7.5 seconds · 65 tokens/s</div></Box>
    <Box a={ap(t, c.big)} border={RED}><div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}><div style={{fontSize: 38, fontWeight: 800}}>Big model · 23 GB</div><div style={{fontSize: 40}}>❌</div></div>
      <div style={{fontSize: 26, color: MUTE, marginTop: 4}}>qwen3.6 · bigger than the laptop's memory</div>
      <div style={{fontSize: 34, fontWeight: 800, marginTop: 12, color: RED}}>didn't load in 3 minutes</div></Box>
  </Frame>;
};

export const Gpu: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const m = Math.round(30 * ap(t, c.plan, 1.2));
  return <Frame t={t} from={c.gpu} to={c.who} kicker="“I'LL JUST BUY A BETTER COMPUTER”">
    <Box a={ap(t, c.gpu + 0.3)} border={ORANGE}><div style={{fontSize: 28, color: MUTE}}>Top gaming graphics card, street price now</div><div style={{fontSize: 96, fontWeight: 800, color: ORANGE}}>~$6,000</div></Box>
    <Box a={ap(t, c.plan)}><div style={{fontSize: 28, color: MUTE}}>…or a $200/month AI plan for</div><div style={{fontSize: 96, fontWeight: 800}}>{m} months</div>
      <div style={{fontSize: 26, color: GREEN, marginTop: 6, opacity: ap(t, c.newest)}}>and the newest models, first</div></Box>
  </Frame>;
};

export const Who: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.who} to={c.end} kicker="WHO LOCAL AI IS FOR">
  {[[c.who + 0.1, '🔒', 'Files that can’t leave the room'], [c.own, '💻', 'You already own a strong computer'], [c.tinker, '🛠️', 'You love to tinker']].map(([at, i, s]) =>
    <Box key={s as string} a={ap(t, at as number)} border={GREEN}><div style={{fontSize: 36, fontWeight: 800}}>{i} {s}</div></Box>)}
  <div style={{opacity: ap(t, c.rest), marginTop: 10, fontSize: 32, lineHeight: 1.35}}><span style={{color: SKY, fontWeight: 800}}>Everyone else:</span> small private stuff locally, a paid plan for the big jobs.</div>
</Frame>;

export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: SKY, color: INK, fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>LOCAL AI</div>
    <div style={{fontFamily: SERIF, fontSize: 104, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 8}}>AI on your laptop</div>
    <div style={{fontSize: 40, fontWeight: 800, color: GREEN, marginTop: 8, opacity: ap(t, 1.2)}}>free · offline · private?</div>
  </div>;
};
