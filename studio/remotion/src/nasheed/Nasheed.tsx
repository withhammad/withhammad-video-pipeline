// PRIVATE (owner's other account; never posted from the business accounts): the "Mustafa Mustafa" nasheed reel
// (reference DezHdivsald by Muhammad Fahad Qadri, job 54442587c2b2, 39.2 s) rebuilt with pictures of the owner in dua at
// Masjid an-Nabawi instead of the reference's Green Dome footage. Same audio, same Arabic lines at the same times (read
// off the reference at 4 fps), same dip to dark on the second "Mustafa", same switch to a daylight wall for the last
// line. No branding, no handle, no call to action.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {staticFile} from 'remotion';
import {AR, UR} from '../asmaknit/AsmaKnit';
import {Motes, Picture, Shot} from '../dua/Dua';

export const FPS = 30, DURATION = 39.16;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

// [start (write-in begins), end, text]. "ﷺ" is drawn in Naskh (Nastaliq has no glyph for it).
export const LINES: [number, number, string][] = [
  [0.0, 1.3, 'مصطفى ﷺ'],
  [1.75, 3.0, 'مصطفى ﷺ'],
  [3.0, 5.95, 'مَنبعٌ للصفاء'],
  [6.05, 9.25, 'سيّدُ الأنبياء'],
  [9.25, 12.75, 'مِشعلٌ في الوفا'],
  [12.75, 16.0, 'كان في عطفهِ'],
  [16.0, 19.0, 'لليتامى دِفا'],
  [19.0, 22.5, 'حنّ قلبي لهُ'],
  [22.5, 25.75, 'فاض شوقاً إليه'],
  [25.75, 29.0, 'ليس أرجو سوى'],
  [29.0, 32.5, 'شربةً من يديه'],
  [32.5, 36.0, 'الصلاةُ عليه'],
  [36.25, 38.75, 'والسلامُ عليه'],
];

// y = centre of the line for that shot (over sky or dome, never over the face); x = centre in px.
type NShot = Shot & {band?: string}; // band: alpha (hex) of the dark band behind the line
export const SHOTS: NShot[] = [
  {src: 'shots/s1-wide.jpg', from: 0, to: 6.0, y: 470, z0: 1.08, z1: 1.18, rot: 3, ox: 50, oy: 45, l: 30, r: 520},
  {src: 'shots/s2-hands.jpg', from: 6.0, to: 12.9, y: 300, z0: 1.05, z1: 1.13, rot: 0, ox: 50, oy: 30},
  {src: 'shots/s3-medium.jpg', from: 12.9, to: 19.2, y: 380, z0: 1.04, z1: 1.12, rot: 0, ox: 50, oy: 55},
  {src: 'shots/s4-face.jpg', from: 19.2, to: 25.85, y: 320, z0: 1.07, z1: 1.02, rot: 0, ox: 50, oy: 0},
  {src: 'shots/s5-gaze.jpg', from: 25.85, to: 32.55, y: 400, z0: 1.04, z1: 1.12, rot: 0, ox: 50, oy: 40},
  {src: 'shots/s6-moon.jpg', from: 32.55, to: 36.05, y: 560, z0: 1.10, z1: 1.18, rot: -3, ox: 50, oy: 50},
  {src: 'shots/s7-dawn.jpg', from: 36.05, to: DURATION, y: 430, z0: 1.04, z1: 1.10, rot: 0, ox: 50, oy: 60, band: 'cc'},
];

const Line: React.FC<{t: number; l: [number, number, string]; s: NShot}> = ({t, l: [a, b, txt], s}) => {
  if (t < a - 0.05 || t > b + 0.3) return null;
  const w = ease((t - a) / 0.6), out = interpolate(t, [b - 0.05, b + 0.25], [1, 0], clamp);
  const [word, saw] = txt.includes('ﷺ') ? [txt.replace(' ﷺ', ''), true] : [txt, false];
  const breathe = 1 + 0.012 * Math.sin(t * 1.5);
  return <div style={{position: 'absolute', left: s.l ?? 0, right: s.r ?? 0, top: s.y, transform: `translateY(-50%) scale(${breathe})`,
    textAlign: 'center', opacity: out, filter: `blur(${(1 - out) * 6}px)`}}>
    {/* written in right to left, like the reference's hand-lettered reveal */}
    <div dir="rtl" style={{display: 'inline-block', fontFamily: UR, fontSize: 104, lineHeight: 1.9, color: '#FFFFFF',
      clipPath: `inset(-30% 0 -30% ${(1 - w) * 100}%)`, textShadow: '0 3px 6px #000000cc, 0 0 26px #000000aa, 0 0 40px #FFF3D044'}}>
      {word}{saw ? <span style={{fontFamily: AR, fontSize: 92, marginRight: 18, color: '#F3DDA0'}}> ﷺ</span> : null}</div>
  </div>;
};

export const Nasheed: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  const dip = interpolate(t, [1.25, 1.55, 2.75, 3.1], [0, 0.88, 0.88, 0], clamp);
  const fadeIn = interpolate(t, [0, 0.3], [1, 0], clamp), fadeOut = interpolate(t, [DURATION - 0.6, DURATION], [0, 1], clamp);
  const lineShot = (l: [number, number, string]) => SHOTS.find((s) => l[0] + 0.1 >= s.from && l[0] + 0.1 < s.to) ?? shot;
  return <AbsoluteFill style={{background: '#05070A', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    {SHOTS.map((s, k) => <Picture key={k} s={s} t={t}/>)}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 40%, #000000a0 100%)'}}/>
    <AbsoluteFill style={{background: `radial-gradient(ellipse ${shot.l ? 46 : 62}% 9% at ${shot.l ? ((shot.l + 1080 - (shot.r ?? 0)) / 2 / 10.8) : 50}% ${shot.y}px, #000000${shot.band ?? '90'} 0%, #00000000 100%)`}}/>
    {t < 36 ? <Motes f={f}/> : null}
    <AbsoluteFill style={{background: '#000', opacity: dip}}/>
    {LINES.map((l, k) => <Line key={k} t={t} l={l} s={lineShot(l)}/>)}
    <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}}/>
  </AbsoluteFill>;
};
