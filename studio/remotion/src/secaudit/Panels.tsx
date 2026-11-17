// Security-audit reel panels (job 0215fbca0f39). Facts from github.com/cloudflare/security-audit-skill (MIT):
// a finder agent hunts for issues, a fresh verifier agent tries to disprove each one. We did not run it, so the
// report panel shows example finding types, labelled as examples, not a made-up count.
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', MONO = 'CpMono, Menlo, monospace', SERIF = 'CpSerif, Georgia, serif';
const ORANGE = '#f38020', GREEN = '#3ddc84', RED = '#ff6b6b', INK = '#0d1117', CARD = '#161b22', LINE = '#30363d', MUTE = '#8b949e', SKY = '#58a6ff', GOLD = '#ffd166';
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

// GitHub-style repo card (our own drawing, not a screenshot)
export const Repo: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.repo} to={c.agents} kicker="A SECOND OPINION">
  <Box a={ap(t, c.repo + 0.1)}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{width: 64, height: 64, borderRadius: 14, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>☁️</div>
      <div style={{fontSize: 34, color: SKY}}>cloudflare / <b>security-audit-skill</b></div>
    </div>
    <div style={{display: 'flex', gap: 12, marginTop: 18, opacity: ap(t, c.open)}}>
      {['Public', 'MIT license', 'Agent skill'].map((s) => <div key={s} style={{fontSize: 24, color: MUTE, border: `2px solid ${LINE}`, borderRadius: 20, padding: '4px 16px'}}>{s}</div>)}
    </div>
  </Box>
  <div style={{marginTop: 50, textAlign: 'center', fontFamily: SERIF, fontSize: 76, lineHeight: 1.1, opacity: ap(t, c.open, 0.4)}}>Open source.<br /><span style={{color: GREEN, fontStyle: 'italic'}}>On GitHub.</span></div>
</Frame>;

export const Agents: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const strike = ap(t, c.wrong + 0.35, 0.3);
  return <Frame t={t} from={c.agents} to={c.install} kicker="HOW IT WORKS: TWO AGENTS">
    <Box a={ap(t, c.agents + 0.1)} border={GOLD}><div style={{fontSize: 40, fontWeight: 800}}>🔎 Agent 1 hunts for problems</div></Box>
    <div style={{display: 'flex', gap: 12, margin: '6px 0 18px', opacity: ap(t, c.agents + 0.6)}}>
      {['finding A', 'finding B', 'finding C'].map((s, i) => <div key={s} style={{flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 26, padding: '12px 0', borderRadius: 14, background: '#1f1a12', border: `2px solid ${i === 1 ? (strike > 0.5 ? RED : '#5a4a22') : '#5a4a22'}`, color: i === 1 && strike > 0.5 ? MUTE : '#fff', textDecoration: i === 1 && strike > 0.5 ? 'line-through' : 'none'}}>{s}</div>)}
    </div>
    <Box a={ap(t, c.fresh)} border={SKY}><div style={{fontSize: 40, fontWeight: 800}}>🧪 A fresh agent tries to prove each one wrong</div></Box>
    <div style={{marginTop: 18, fontSize: 32, color: MUTE, textAlign: 'center', opacity: ap(t, c.wrong + 0.5)}}>Can't disprove it? It stays on the list. <span style={{color: RED}}>Disproved? It's cut.</span></div>
  </Frame>;
};

export const Install: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const cmd = 'npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit';
  const n = Math.floor(interpolate(t, [c.install + 0.2, c.install + 1.9], [0, cmd.length], clamp));
  return <Frame t={t} from={c.install} to={c.report} kicker="INSTALL IT (ONE COMMAND)">
    <div style={{background: '#010409', border: `2px solid ${LINE}`, borderRadius: 20, padding: '22px 26px', fontFamily: MONO, fontSize: 34, lineHeight: 1.45, minHeight: 300, opacity: ap(t, c.install + 0.05)}}>
      <span style={{color: GREEN}}>$ </span>{cmd.slice(0, n)}<span style={{opacity: n < cmd.length && Math.floor(t * 3) % 2 ? 1 : 0}}>▍</span>
      <div style={{color: MUTE, marginTop: 18, opacity: ap(t, c.installIt)}}>then ask your coding agent for a security audit</div>
    </div>
    <div style={{marginTop: 40, textAlign: 'center', fontSize: 34, fontWeight: 800, color: GOLD, opacity: ap(t, c.installIt + 0.3)}}>💡 Run it more than once: each run can catch different things</div>
  </Frame>;
};

export const Report: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.report} to={c.solo} kicker="AUDIT REPORT">
  <div style={{fontFamily: SERIF, fontSize: 70, lineHeight: 1.05, opacity: ap(t, c.report + 0.1)}}>Every problem <span style={{color: GREEN, fontStyle: 'italic'}}>double-checked</span></div>
  <div style={{marginTop: 30}}>
    {[[c.f1, 'Secret key in client code'], [c.f2, 'Missing auth check'], [c.f3, 'Unsafe redirect']].map(([at, s]) =>
      <Box key={s as string} a={ap(t, at as number)} border="#5a2f33"><div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><div style={{fontSize: 34, fontWeight: 800}}>⚠️ {s}</div><div style={{fontSize: 24, color: GREEN, fontWeight: 800}}>✓ verified</div></div></Box>)}
  </div>
  <div style={{fontSize: 22, color: MUTE, textAlign: 'center', marginTop: 8, opacity: ap(t, c.f1)}}>Example finding types · your report depends on your code</div>
</Frame>;

export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  const s = Math.max(0, 15 * 3600 - Math.floor(t * 9));
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: ORANGE, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>LAUNCH IN</div>
    <div style={{fontFamily: SERIF, fontSize: 130, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 8}}>{hh}:{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
  </div>;
};
