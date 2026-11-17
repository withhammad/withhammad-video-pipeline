// Security-audit reel (job 0215fbca0f39): launch tomorrow, Claude only checked its own code, second opinion with
// Cloudflare's open-source security-audit skill (finder + fresh verifier). Human = owner likeness (approved 17 Nov).
// Lines run on the snappy dialogue clock from build_data.py.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, ShotState, Cam} from './Stage';
import {Hook, Repo, Agents, Install, Report, Cue} from './Panels';
import {EndCard} from './EndCard';
import data from './data.json';
import './fonts';

type Line = {id: number; who: string; text: string; start: number; dur: number; env: number[]};
const LINES = data.lines as Line[];
const FPS = 30;
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3));
const L = (id: number) => LINES.find((l) => l.id === id)!;
const at = (id: number, k = 0) => L(id).start + L(id).dur * k;
const C: Cue = {
  repo: at(6, 0.4), open: at(6, 0.72),
  agents: at(7), fresh: at(7, 0.45), wrong: at(7, 0.75),
  install: at(8), installIt: at(8, 0.72),
  report: at(9), f1: at(9, 0.35), f2: at(9, 0.55), f3: at(9, 0.75),
  solo: at(10) - 0.1,
  end: at(12),
};
const lineAt = (t: number) => { let cur: Line | null = null; for (const l of LINES) if (t >= l.start - 0.05) cur = l; return cur; };
function speech(who: string, t: number) {
  for (const l of LINES) if ((l.who === who || (who === 'YOU' && l.who === 'CTA')) && t >= l.start && t < l.start + l.dur + 0.05) {
    const i = Math.floor((t - l.start) * FPS); const e = l.env[Math.min(l.env.length - 1, i)] ?? 0;
    const e2 = l.env[Math.min(l.env.length - 1, i + 1)] ?? e; return (e + e2) / 2;
  }
  return 0;
}
const blinkAt = (t: number, seed = 0) => { const p = (t + seed) % 3.4; return p < 0.15 ? Math.sin((p / 0.15) * Math.PI) : 0; };
const CAM: Record<string, Cam> = {
  boyCU: {pos: [0, 3.15, 4.9], look: [0, 2.55, -2.35], fov: 33},
  boyTight: {pos: [0, 3.15, 4.4], look: [0, 2.7, -2.35], fov: 30},
  boyLow: {pos: [0, 2.4, 4.6], look: [0, 3.9, -2.35], fov: 36},
  botCU: {pos: [-1.6, 1.35, 7.4], look: [-2.3, 0.8, 1.0], fov: 26},
  botTight: {pos: [-1.7, 1.25, 6.3], look: [-2.3, 0.8, 1.0], fov: 26},
};
const push = (a: Cam, k: number, amt = 0.06): Cam => ({...a, fov: a.fov * (1 - amt * ease(k))});
const BOY_CAM: Record<number, string> = {1: 'boyCU', 3: 'boyTight', 5: 'boyCU', 8: 'boyCU', 10: 'boyTight', 12: 'boyCU'};
const panelOn = (t: number) => t >= C.repo - 0.1 && t < C.solo;
function shot(t: number): ShotState {
  const l = lineAt(t) ?? LINES[0];
  if (panelOn(t)) { // two-shot under the panel
    const s0 = shotSolo(t, l); const kk = Math.min(1, (t - l.start) / Math.max(0.3, l.dur + 0.2));
    const cam: Cam = l.who === 'CLAUDE' ? {pos: [-1.1, 1.7, 8.2], look: [-2.1, 1.05, 0.6], fov: 34} : {pos: [0.6, 3.1, 8.9], look: [0.4, 2.6, -1.8], fov: 38};
    return {morning: false, cam: push(cam, kk, 0.05), boy: s0.boy ?? {mouth: 0, blink: blinkAt(t, 0.7), lookX: -0.5, lookY: -0.2, smile: 0.2},
      bot: s0.bot ?? {talk: 0, eyes: 'open', lookX: 0.5}};
  }
  return shotSolo(t, l);
}
function shotSolo(t: number, l: Line): ShotState {
  const k = Math.min(1, (t - l.start) / Math.max(0.3, l.dur + 0.2));
  const hit = Math.max(0, 1 - (t - l.start) / 0.35);
  if (l.who !== 'CLAUDE') {
    const s = speech('YOU', t); const b: any = {mouth: s, blink: blinkAt(t, 0.7), lookY: -0.1};
    if ([1, 8, 12].includes(l.id)) { b.brow = -0.8; b.smile = 0.85; b.blink = 0; b.headNod = -s * 0.1 - hit * 0.08; b.headTilt = Math.sin(t * 7) * 0.06; }
    if ([3, 5].includes(l.id)) { b.brow = 0.6; b.smile = -0.3; b.headNod = hit * 0.06; } // "your OWN code?" / "that's the problem"
    if (l.id === 10) { b.brow = 0.4; b.smile = 0; b.headTilt = 0.12 * ease(k * 3); }
    return {morning: false, cam: push(CAM[BOY_CAM[l.id] ?? 'boyCU'], k, 0.05), boy: b, bot: null};
  }
  const s = speech('CLAUDE', t);
  const eyes = l.id === 4 ? 'happy' : l.id === 11 ? 'line' : [2].includes(l.id) ? 'tall' : 'open';
  const m: any = {talk: s, eyes, hop: hit * 0.45, squash: s * 0.5, tilt: Math.sin(t * 8) * s * 0.08};
  if (l.id === 2) m.eyes = 'wink';
  if (l.id === 11) { m.hop = 0; m.tilt = -0.12 * ease(k * 2); }
  return {morning: false, cam: push([2, 4].includes(l.id) ? CAM.botTight : CAM.botCU, k, l.id === 11 ? 0.08 : 0.06), boy: null, bot: m};
}

const Caption: React.FC<{t: number}> = ({t}) => {
  const l = LINES.find((x) => x.who !== 'CTA' && t >= x.start - 0.05 && t < (LINES[LINES.indexOf(x) + 1]?.start ?? 99) - 0.05 && t < x.start + x.dur + 0.8);
  if (!l || t >= C.end) return null;
  const a = l.id === 1 ? 1 : interpolate(t - l.start, [-0.05, 0.18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const you = l.who === 'YOU';
  const top = panelOn(t) ? 1010 : 1180;
  return (
    <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, transform: `translateY(${(1 - a) * 10}px)`}}>
      <div style={{background: you ? '#5b8bd0' : '#d9775a', color: '#fff', fontFamily: 'CpInter', fontWeight: 800, fontSize: 24, letterSpacing: 4, padding: '5px 14px 4px', borderRadius: 8, marginBottom: 10}}>{you ? 'HAMMAD' : 'CLAUDE'}</div>
      <div style={{background: 'rgba(14,14,20,0.66)', color: '#fff', fontFamily: 'CpInter', fontWeight: 800, fontSize: 50, lineHeight: 1.16, padding: '12px 28px 14px', borderRadius: 20, maxWidth: 900, textAlign: 'center'}}>{l.text}</div>
    </div>
  );
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const endIn = interpolate(t, [C.end, C.end + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const slide = interpolate(t, [C.repo - 0.35, C.repo + 0.05, C.solo - 0.2, C.solo + 0.1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0c1330'}}>
      <AbsoluteFill style={{transform: `translateY(${ease(slide) * 560}px)`}}><Stage at={shot} /></AbsoluteFill>
      <AbsoluteFill style={{opacity: slide, background: 'linear-gradient(#0c1330 0%, #0c1330 52%, rgba(12,19,48,0) 60%)'}} />
      <Hook t={t} to={C.repo - 0.1} />
      <Repo t={t} c={C} /><Agents t={t} c={C} /><Install t={t} c={C} /><Report t={t} c={C} />
      <Caption t={t} />
      {t >= C.end && <AbsoluteFill style={{opacity: endIn}}><EndCard t={t - C.end} /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
