// Claude certification reel (job cert-0040c2b7): he paid for a prep course, Claude walks the free official path
// (Academy, docs, exam guide + sample questions), then the $125 partner-only exam. Human = owner likeness v2.1.
// Lines run on the snappy dialogue clock from build_data.py.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, ShotState, Cam} from '../secaudit/Stage';
import type {Note} from '../secaudit/world';
import {Hook, Academy, Docs, Guide, Eligibility, Cue} from './Panels';
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
  academy: at(4, 0.15), c101: at(4, 0.3), api: at(4, 0.6),
  docs: at(5), mcp: at(5, 0.3), skills: at(5, 0.5), apiDocs: at(5, 0.75),
  guide: at(6), q60: at(6, 0.35), samples: at(6, 0.72),
  elig: at(8), partner: at(8, 0.5), joinFree: at(10),
  solo: at(11) - 0.1,
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
const BOY_CAM: Record<number, string> = {1: 'boyCU', 3: 'boyTight', 7: 'boyCU', 9: 'boyCU', 11: 'boyTight', 12: 'boyCU'};
const NOTES: Note[] = [['CLAUDE 101', '#f08a5a', -3.6, 3.6, -0.2], ['EXAM', '#3ddc84', 3.7, 3.4, 0.15], ['STUDY', '#f2d04a', 3.2, 5.0, -0.1]];
const panelOn = (t: number) => t >= C.academy - 0.1 && t < C.solo;
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
    if ([1, 7, 12].includes(l.id)) { b.brow = -0.8; b.smile = 0.85; b.blink = 0; b.headNod = -s * 0.1 - hit * 0.08; b.headTilt = Math.sin(t * 7) * 0.06; }
    if (l.id === 3) { b.brow = 0.5; b.smile = -0.2; b.headNod = 0.08 * ease(k * 2); b.lookX = 0.4; } // "Don't ask." (sheepish, looks away)
    if (l.id === 9) { b.brow = 0.4; b.smile = 0; b.headTilt = 0.12 * ease(k * 3); } // "And joining that costs?"
    if (l.id === 11) { b.brow = 0.7; b.smile = -0.35; b.headNod = hit * 0.06; } // "So I paid for the only thing that's free?"
    return {morning: false, cam: push(CAM[BOY_CAM[l.id] ?? 'boyCU'], k, 0.05), boy: b, bot: null};
  }
  const s = speech('CLAUDE', t);
  const eyes = l.id === 4 ? 'happy' : [2].includes(l.id) ? 'tall' : 'open';
  const m: any = {talk: s, eyes, hop: hit * 0.45, squash: s * 0.5, tilt: Math.sin(t * 8) * s * 0.08};
  if (l.id === 10) m.eyes = 'wink';
  return {morning: false, cam: push([2, 10].includes(l.id) ? CAM.botTight : CAM.botCU, k, l.id === 2 ? 0.08 : 0.06), boy: null, bot: m};
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
  const slide = interpolate(t, [C.academy - 0.35, C.academy + 0.05, C.solo - 0.2, C.solo + 0.1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0c1330'}}>
      <AbsoluteFill style={{transform: `translateY(${ease(slide) * 560}px)`}}><Stage at={shot} notes={NOTES} /></AbsoluteFill>
      <AbsoluteFill style={{opacity: slide, background: 'linear-gradient(#0c1330 0%, #0c1330 52%, rgba(12,19,48,0) 60%)'}} />
      <Hook t={t} to={C.academy - 0.1} />
      <Academy t={t} c={C} /><Docs t={t} c={C} /><Guide t={t} c={C} /><Eligibility t={t} c={C} />
      <Caption t={t} />
      {t >= C.end && <AbsoluteFill style={{opacity: endIn}}><EndCard t={t - C.end} /></AbsoluteFill>}
    </AbsoluteFill>
  );
};
