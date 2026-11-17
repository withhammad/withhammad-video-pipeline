// IPO reel (job c1be587e1d6a): our own 3D dialogue on the Anthropic IPO, same 3-part beats as the owner-sent reference.
// Educational only. Lines run on the snappy dialogue clock from build_data.py (no reference clock).
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, ShotState, Cam} from './Stage';
import {Hook, Part1, Part2, Part3, Cue} from './Panels';
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
  p1: at(7), pop: at(8), sell: at(8, 0.42), rich: at(8, 0.62), piece: at(10),
  p2: at(11), broker: at(11, 0.35), section: at(12), cash: at(12, 0.32), request: at(12, 0.72), confirm: at(13), tap: at(15),
  p3: at(17, 0.45), real: at(18), dates: at(18, 0.35), one: at(19), swing: at(20), nfa: at(20, 0.6), owner: at(22),
  end: at(23),
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
  wide: {pos: [0.2, 3.9, 11.5], look: [0.2, 2.1, -1.5], fov: 46},
};
const push = (a: Cam, k: number, amt = 0.06): Cam => ({...a, fov: a.fov * (1 - amt * ease(k))});
// acting per line (dialogue rule: punch-in on every reply, hyped human beats, hops for the bot)
const HYPED = new Set([16, 23]); const SHOCK = new Set([9, 14, 21]);
const BOY_CAM: Record<number, string> = {1: 'boyCU', 2: 'boyTight', 3: 'boyCU', 4: 'boyTight', 9: 'boyCU', 14: 'boyTight', 16: 'boyLow', 21: 'boyCU', 23: 'boyCU'};
const panelOn = (t: number) => t >= C.p1 - 0.1 && t < C.end;
function shot(t: number): ShotState {
  const l = lineAt(t) ?? LINES[0];
  if (panelOn(t)) { // two-shot under the panel: both characters visible, speaker acts
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
    const b: any = {mouth: speech('YOU', t), blink: blinkAt(t, 0.7), lookY: -0.1};
    if (l.id <= 4) { b.brow = -0.2; b.smile = 0.2; }
    if (SHOCK.has(l.id)) { b.brow = 0.6; b.smile = -0.3; b.headNod = hit * 0.06; }
    if (HYPED.has(l.id)) { b.brow = -0.8; b.smile = 0.85; b.blink = 0; b.headNod = -speech('YOU', t) * 0.1 - hit * 0.08; b.headTilt = Math.sin(t * 7) * 0.06; }
    if (l.id === 16) b.armUp = ease(k * 3);
    return {morning: false, cam: push(CAM[BOY_CAM[l.id] ?? 'boyCU'], k, 0.05), boy: b, bot: null};
  }
  const happy = [10, 15, 22].includes(l.id), sure = [18].includes(l.id), warn = [19, 20].includes(l.id);
  const m: any = {talk: speech('CLAUDE', t), eyes: happy ? 'happy' : warn ? 'line' : sure ? 'tall' : 'open', hop: hit * 0.45, squash: speech('CLAUDE', t) * 0.5, tilt: Math.sin(t * 8) * speech('CLAUDE', t) * 0.08};
  if (l.id === 22) m.eyes = t > l.start + l.dur * 0.55 ? 'wink' : 'happy';
  return {morning: false, cam: push([5, 6, 17].includes(l.id) ? CAM.botTight : CAM.botCU, k, 0.06), boy: null, bot: m};
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
  const total = (data as any).total as number;
  const endIn = interpolate(t, [C.end, C.end + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // during the three parts the scene slides down under the panel (reference layout: panel top, scene bottom)
  const slide = interpolate(t, [C.p1 - 0.25, C.p1 + 0.15, C.end - 0.2, C.end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0c1330'}}>
      <AbsoluteFill style={{transform: `translateY(${ease(slide) * 560}px)`}}><Stage at={shot} /></AbsoluteFill>
      <AbsoluteFill style={{opacity: slide, background: 'linear-gradient(#0c1330 0%, #0c1330 52%, rgba(12,19,48,0) 60%)'}} />
      <Hook t={t} to={C.p1 - 0.1} />
      <Part1 t={t} c={C} />
      <Part2 t={t} c={C} />
      <Part3 t={t} c={C} />
      <Caption t={t} />
      {t >= C.end && <AbsoluteFill style={{opacity: endIn}}><EndCard t={t - C.end} /></AbsoluteFill>}
      <div style={{position: 'absolute', bottom: 34, right: 34, fontFamily: 'CpInter', fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,.55)', opacity: t < C.end ? 1 : 0}}>Not financial advice</div>
      <Audio src={staticFile('ipo/mix.wav')} />
      {void total}
    </AbsoluteFill>
  );
};
