// NET reel panels, practice version (job 45a6c16a7ad3). Owner: "Practice version". No live-answer tool, no stealth
// mode, nothing read during a real interview. Practice = Claude as a mock interviewer from the real job post.
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const ORANGE = '#e8794f', GREEN = '#3ddc84', RED = '#ff6b6b', INK = '#14161d', CARD = '#1d2029', LINE = '#2c303c', MUTE = '#8b90a0', SKY = '#7cc4ff', GOLD = '#ffd166';
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
const Box: React.FC<{a: number; children: React.ReactNode; border?: string}> = ({a, children, border = LINE}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`, background: CARD, border: `2px solid ${border}`, borderRadius: 20, padding: '20px 24px', marginBottom: 14}}>{children}</div>;

export const Why: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.why} to={c.prac} kicker="LIVE AI ANSWERS IN A REAL INTERVIEW?">
  <Box a={ap(t, c.why + 0.1)} border={RED}><div style={{fontSize: 40, fontWeight: 800}}>🚫 Many companies don't allow it</div></Box>
  <div style={{fontSize: 30, color: MUTE, margin: '18px 0 12px', opacity: ap(t, c.shows)}}>And interviewers notice:</div>
  <div style={{display: 'flex', gap: 14}}>{[[c.read, '👀 you read'], [c.pause, '⏸ you pause'], [c.away, '↗ you look away']].map(([at, s]) =>
    <div key={s as string} style={{flex: 1, opacity: ap(t, at as number), transform: `scale(${0.9 + 0.1 * ap(t, at as number)})`, background: '#2a1d1f', border: '2px solid #5a2f33', borderRadius: 18, padding: '18px 12px', textAlign: 'center', fontSize: 30, fontWeight: 800}}>{s}</div>)}</div>
</Frame>;

export const Practice: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const typed = 'Here is the job post for the role I interview for in 1 hour: [paste]. Interview me like their hiring manager.';
  const n = Math.floor(interpolate(t, [c.paste, c.paste + 1.8], [0, typed.length], clamp));
  return <Frame t={t} from={c.prac} to={c.fb} kicker="THE FREE WAY: PRACTICE WITH CLAUDE">
    <Box a={ap(t, c.prac + 0.1)} border={GREEN}><div style={{fontSize: 22, color: MUTE, marginBottom: 8}}>your message</div><div style={{fontSize: 30, lineHeight: 1.35}}>{typed.slice(0, n)}<span style={{opacity: n < typed.length && Math.floor(t * 3) % 2 ? 1 : 0}}>▍</span></div></Box>
    {[[c.one, '1', 'One question at a time'], [c.beh, '2', 'Behavioral, then technical'], [c.real, '3', 'Like the real thing']].map(([at, k, s]) =>
      <Box key={k as string} a={ap(t, at as number)}><div style={{display: 'flex', gap: 16, alignItems: 'center'}}><div style={{width: 50, height: 50, borderRadius: 25, background: SKY, color: INK, fontWeight: 800, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{k}</div><div style={{fontSize: 34, fontWeight: 800}}>{s}</div></div></Box>)}
  </Frame>;
};

export const Feedback: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.fb} to={c.rehearse} kicker="AFTER EACH ANSWER, CLAUDE TELLS YOU">
  {[[c.landed, '✅', 'What landed', GREEN], [c.vague, '⚠️', 'What was vague', GOLD], [c.stronger, '✍️', 'A stronger version', SKY]].map(([at, i, s, col]) =>
    <Box key={s as string} a={ap(t, at as number)} border={col as string}><div style={{fontSize: 44, fontWeight: 800}}>{i} {s}</div></Box>)}
</Frame>;

export const Rehearse: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.rehearse} to={c.person} kicker="THEN REHEARSE">
  {[[c.rehearse + 0.2, '🗣️', 'Say your best answers out loud'], [c.twice, '🔁', 'Twice'], [c.short, '⏱️', 'Short, with one real number each']].map(([at, i, s]) =>
    <Box key={s as string} a={ap(t, at as number)}><div style={{fontSize: 40, fontWeight: 800}}>{i} {s}</div></Box>)}
</Frame>;

export const Person: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.person} to={c.end} kicker="THE POINT">
  <div style={{marginTop: 120, textAlign: 'center', fontFamily: SERIF, fontSize: 92, lineHeight: 1.1, opacity: ap(t, c.hired, 0.4), transform: `scale(${0.92 + 0.08 * ap(t, c.hired, 0.4)})`}}>They hired a <span style={{color: GREEN, fontStyle: 'italic'}}>person</span>,<br />not a screen.</div>
  <div style={{marginTop: 60, textAlign: 'center', fontSize: 40, fontWeight: 800, color: ORANGE, opacity: ap(t, c.fifty)}}>⏳ 50 minutes left. Start.</div>
</Frame>;

export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  const mins = Math.max(0, 60 - Math.floor(t * 1.5));
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>INTERVIEW IN</div>
    <div style={{fontFamily: SERIF, fontSize: 130, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 8}}>0:{String(mins).padStart(2, '0')}:00</div>
  </div>;
};
