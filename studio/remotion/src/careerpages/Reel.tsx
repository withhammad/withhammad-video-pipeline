// Career-pages reel (job d463f2086d47): exact rebuild of @10x.with.ai DfIchJfTiR9 as a 3D dialogue.
import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage, ShotState, Cam} from './Stage';
import {Google, Results, Schedule, LatestRun, Notice} from './Panels';
import {EndCard} from './EndCard';
import data from './data.json';
import './fonts';

type Line = {id: number; who: string; text: string; start: number; dur: number; env: number[]};
const LINES = data.lines as Line[];
const FPS = 30;
const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: number[], b: number[], k: number) => a.map((v, i) => lerp(v, b[i], k)) as [number, number, number];

function speech(who: string, t: number) {
  for (const l of LINES) if (l.who === who && t >= l.start && t < l.start + l.dur + 0.05) {
    const i = Math.floor((t - l.start) * FPS); const e = l.env[Math.min(l.env.length - 1, i)] ?? 0;
    const e2 = l.env[Math.min(l.env.length - 1, i + 1)] ?? e; return (e + e2) / 2;
  }
  return 0;
}
function blinkAt(t: number, seed = 0) { // natural blinks every ~2.8-4 s, 0.15 s long
  const p = (t + seed) % 3.4; return p < 0.15 ? Math.sin((p / 0.15) * Math.PI) : 0;
}
// camera presets
const C: Record<string, Cam> = {
  boyCU: {pos: [0, 3.15, 4.9], look: [0, 2.55, -2.35], fov: 33},
  boyTight: {pos: [0, 3.15, 4.4], look: [0, 2.7, -2.35], fov: 30},
  boyLow: {pos: [0, 2.4, 4.6], look: [0, 3.9, -2.35], fov: 36},
  botCU: {pos: [-1.6, 1.35, 7.4], look: [-2.3, 0.8, 1.0], fov: 26},
  botTight: {pos: [-1.7, 1.25, 6.3], look: [-2.3, 0.8, 1.0], fov: 26},
  botLow: {pos: [-1.6, 1.2, 8.4], look: [-2.3, 2.1, 1.0], fov: 34},
  wide: {pos: [0.2, 3.9, 11.5], look: [0.2, 2.1, -1.5], fov: 46},
  wideIn: {pos: [0.2, 3.7, 9.8], look: [0.2, 2.2, -1.5], fov: 46},
  close: {pos: [0.5, 3.5, 8.2], look: [0.3, 2.5, -1.8], fov: 40},
};
const push = (a: Cam, k: number, amt = 0.06): Cam => ({...a, fov: a.fov * (1 - amt * k)});

type Shot = {from: number; to: number; at: (t: number, k: number) => ShotState};
const night = false;
const boyTalk = (t: number) => ({mouth: speech('YOU', t), blink: blinkAt(t, 0.7)});
const botTalk = (t: number) => ({talk: speech('CLAUDE', t)});
const SHOTS: Shot[] = [
  {from: 0, to: 2.47, at: (t, k) => ({morning: night, cam: push(C.boyCU, k, 0.03), boy: {...boyTalk(t), brow: -0.55, smile: -0.4, lookY: -0.3}, bot: null})},
  {from: 2.47, to: 4.2, at: (t, k) => ({morning: night, cam: push(C.boyTight, k, 0.03), boy: {...boyTalk(t), brow: -0.7, smile: -0.6, blink: Math.max(0.35, blinkAt(t, 0.7)), lookY: -0.4}, bot: null})},
  {from: 4.2, to: 5.43, at: (t, k) => ({morning: night, cam: C.botCU, boy: null, bot: {...botTalk(t), eyes: 'open', hop: Math.max(0, Math.sin(k * Math.PI * 1.0)) * 0.5 * (k < 0.4 ? 1 : 0)}})},
  {from: 5.43, to: 8.43, at: (t, k) => ({morning: night, cam: push(C.boyCU, k, 0.04), boy: {...boyTalk(t), blink: Math.max(0.45, blinkAt(t)), brow: -0.2, smile: -0.5, headTilt: 0.06}, bot: null})},
  {from: 8.43, to: 9.57, at: (t, k) => ({morning: night, cam: push(C.botCU, k, 0.05), boy: null, bot: {...botTalk(t), eyes: 'line'}})},
  {from: 9.57, to: 10.9, at: (t, k) => ({morning: night, cam: push(C.botTight, k, 0.04), boy: null, bot: {...botTalk(t), eyes: 'line', tilt: 0.05}})},
  {from: 10.9, to: 13.5, at: (t, k) => ({morning: night, cam: {...C.wide, pos: lerp3(C.wide.pos, C.wideIn.pos, ease(k))}, boy: {typing: 1, blink: blinkAt(t), lookY: -0.4}, bot: {...botTalk(t), eyes: 'tall', lookX: 0.5}})},
  {from: 13.5, to: 15.03, at: (t, k) => ({morning: night, cam: push(C.close, k, 0.04), boy: {typing: 0.2, brow: -0.6, smile: -0.5, lookX: -0.6, blink: blinkAt(t)}, bot: {...botTalk(t), eyes: 'tall', lookX: 0.5}})},
  {from: 15.03, to: 17.47, at: (t, k) => ({morning: night, cam: push(C.boyCU, k, 0.03), boy: {...boyTalk(t), armUp: ease(k * 4), brow: 0.7, blink: 0.75, smile: -0.6, headNod: 0.08}, bot: null})},
  {from: 17.47, to: 18.33, at: (t, k) => ({morning: night, cam: C.botCU, boy: null, bot: {...botTalk(t), eyes: 'happy', hop: Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.7, squash: k > 0.62 && k < 0.75 ? 1 : 0}})},
  {from: 18.33, to: 23.43, at: (t, k) => ({morning: night, cam: push(C.botLow, k, 0.04), boy: null, bot: {...botTalk(t), eyes: 'open', lookX: 0.2}})},
  {from: 23.43, to: 25.77, at: (t, k) => ({morning: night, cam: push(C.boyLow, k, 0.03), boy: {...boyTalk(t), lookY: 1, brow: 0.0, mouth: Math.max(speech('YOU', t), 0.25), blink: blinkAt(t, 1.5)}, bot: null})},
  {from: 25.77, to: 27.63, at: (t, k) => ({morning: night, cam: {...C.wide, pos: lerp3(C.wideIn.pos, C.close.pos, ease(k) * 0.4)}, boy: {typing: 1, lookY: -0.4, blink: blinkAt(t)}, bot: {...botTalk(t), eyes: 'open', lookX: 0.5}})},
  {from: 27.63, to: 30.37, at: (t, k) => ({morning: night, cam: push(C.botLow, k, 0.03), boy: null, bot: {...botTalk(t), eyes: 'open'}})},
  {from: 30.37, to: 31.17, at: (t) => ({morning: night, cam: C.boyCU, boy: {...boyTalk(t), brow: -0.3, lookY: 0.5, lookX: -0.5, headTilt: -0.08}, bot: null})},
  {from: 31.17, to: 32.1, at: (t, k) => ({morning: night, cam: push(C.botCU, k, 0.03), boy: null, bot: {...botTalk(t), eyes: 'open'}})},
  {from: 32.1, to: 34.2, at: (t, k) => ({morning: night, cam: push(C.botTight, k, 0.04), boy: null, bot: {...botTalk(t), eyes: k > 0.45 ? 'wink' : 'open', tilt: k > 0.45 ? 0.08 : 0}})},
  {from: 34.2, to: 35.47, at: (t, k) => ({morning: true, cam: push(C.wideIn, k, 0.03), boy: {phone: 1, lookY: -0.6, blink: blinkAt(t)}, bot: {eyes: 'sleep', squash: 0.3}})},
  {from: 35.47, to: 36.77, at: (t, k) => ({morning: true, cam: C.boyLow, boy: {...boyTalk(t), phone: 1, lookY: 0.3, brow: -0.6 + k * 0.6, smile: k > 0.5 ? 0.9 : 0, mouth: speech('YOU', t)}, bot: null})},
  {from: 36.77, to: 38.13, at: (t) => ({morning: true, cam: C.botCU, boy: null, bot: {...botTalk(t), eyes: 'happy'}})},
  {from: 38.13, to: 44.95, at: (t, k) => ({morning: true, cam: push(C.botCU, Math.min(1, k * 3), 0.08), boy: null, bot: {...botTalk(t), eyes: t > 38.8 ? 'sleep' : 'happy', squash: t > 38.8 ? 0.3 : 0}})},
];
const shotAt = (t: number) => SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
const stageAt = (t: number) => { const s = shotAt(t); return s.at(t, (t - s.from) / (s.to - s.from)); };

const Caption: React.FC<{t: number}> = ({t}) => {
  const l = LINES.find((x) => x.who !== 'CTA' && t >= x.start - 0.05 && t < (LINES[LINES.indexOf(x) + 1]?.start ?? 99) - 0.05 && t < x.start + x.dur + 1.0);
  if (!l || t > 40.3) return null;
  const a = l.id === 1 ? 1 : interpolate(t - l.start, [-0.05, 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(a, [0, 1], [10, 0]);
  const you = l.who === 'YOU';
  return (
    <div style={{position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, transform: `translateY(${y}px)`}}>
      <div style={{background: you ? '#5b8bd0' : '#d9775a', color: '#fff', fontFamily: 'CpInter', fontWeight: 800, fontSize: 25, letterSpacing: 4, padding: '5px 14px 4px', borderRadius: 8, marginBottom: 12, boxShadow: '0 2px 10px rgba(0,0,0,.25)'}}>{you ? 'YOU' : 'CLAUDE'}</div>
      <div style={{background: 'rgba(14,14,20,0.62)', color: '#fff', fontFamily: 'CpInter', fontWeight: 800, fontSize: 54, lineHeight: 1.18, padding: '14px 30px 16px', borderRadius: 20, maxWidth: 860, textAlign: 'center', backdropFilter: 'blur(6px)'}}>{l.text}</div>
    </div>
  );
};

const Zz: React.FC<{t: number; from: number}> = ({t, from}) => {
  if (t < from) return null;
  return <>{[0, 1].map((i) => { const p = ((t - from) * 0.7 + i * 0.5) % 1; return <div key={i} style={{position: 'absolute', left: 700 + i * 70 + p * 40, top: 1120 - i * 90 - p * 160, fontFamily: 'CpInter', fontWeight: 800, fontSize: 90 - i * 22, color: '#fff', opacity: Math.sin(p * Math.PI), textShadow: '0 4px 20px rgba(0,0,0,.25)'}}>Z</div>; })}</>;
};

const StandIn: React.FC = () => (
  <div style={{position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#ffd400', color: '#111', fontFamily: 'CpInter', fontWeight: 800, fontSize: 26, letterSpacing: 2, padding: '8px 18px', borderRadius: 8}}>STAND-IN VOICE · NOT FOR POSTING</div>
  </div>
);

export const Reel: React.FC<{standIn?: boolean}> = ({standIn = true}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const end = t >= 40.33;
  const endIn = interpolate(t, [40.33, 40.75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const loopOut = interpolate(t, [44.6, 44.95], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#0c1330'}}>
      <Stage at={(tt) => (tt >= 44.6 ? SHOTS[0].at(0, 0) : stageAt(tt))} />
      {/* panels */}
      <Google t={t} from={18.33} to={23.43} />
      <Results t={t} from={23.43} to={25.77} />
      <Schedule t={t} from={25.77} to={27.63} toggleAt={26.5} />
      <LatestRun t={t} from={27.63} to={30.37} />
      <Notice t={t} from={34.45} to={36.77} />
      <Zz t={t} from={38.8} />
      <Caption t={t} />
      {end && <AbsoluteFill style={{opacity: endIn * (1 - loopOut)}}><EndCard t={t - 40.33} /></AbsoluteFill>}
      {standIn && <StandIn />}
      <Audio src={staticFile('careerpages/mix.wav')} />
    </AbsoluteFill>
  );
};
void spring; void Easing;
