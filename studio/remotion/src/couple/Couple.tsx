// PRIVATE (owner and his wife, never posted from our accounts): the reference's Urdu love lines (calligraphy.official.20020,
// Dfj5l1cvtCA, 26.2 s) over a pencil sketch of the two of them (GPT Image 2 from his photos), with his clip of her as a polaroid.
// Line starts measured from the reference's red text (0.5 s grid). Job c421b39c46e0.
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, DURATION = 26.2;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const UR = 'Nastaliq, serif';
const LINES: [number, string][] = [
  [0.5, 'اے شریکِ حیات'], [3.5, 'اے میری دل رُبا'], [6.5, 'اے میری ہمسفر'], [8.5, 'اے میری ملکہ'], [11.5, 'آپ سے روز و شب'],
  [14.0, 'آپ سے میرا دِن'], [16.0, 'آپ ہو میرے سنگ'], [20.0, 'پھر مجھے کیسا غم'], [22.0, 'اے میری جانِ جاں'], [24.5, 'اے میری جانِ من'],
];

const Heart: React.FC<{x: number; y: number; s: number; c: string; o: number}> = ({x, y, s, c, o}) =>
  <svg width={s} height={s} viewBox="0 0 24 24" style={{position: 'absolute', left: x - s / 2, top: y - s / 2, opacity: o}}>
    <path fill={c} d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.8 4.5 6.4 4.5c2 0 3.4 1 4.3 2.3L12 8.6l1.3-1.8c.9-1.3 2.3-2.3 4.3-2.3 3.6 0 5.5 3.7 4 7.2C19.5 16.4 12 21 12 21z"/></svg>;

const Rings: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  <svg width={s * 1.6} height={s} viewBox="0 0 40 24" style={{position: 'absolute', left: x - s * 0.8, top: y - s / 2}}>
    <circle cx="14" cy="13" r="8" fill="none" stroke="#D9A93A" strokeWidth="3"/><circle cx="26" cy="13" r="8" fill="none" stroke="#E8C25A" strokeWidth="3"/>
    <path d="M12 4 l2 -3 l2 3 z" fill="#CFE8FF"/></svg>;

export const Couple: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const reveal = ease(interpolate(t, [0.3, 4.0], [0, 1], clamp));
  const i = LINES.reduce((k, [s], j) => (t >= s ? j : k), -1);
  const fade = interpolate(t, [DURATION - 0.8, DURATION], [0, 1], clamp);
  const beat = 1 + 0.08 * Math.max(0, Math.sin(t * Math.PI * 1.6));
  const pol = ease(interpolate(t, [19.4, 20.4], [0, 1], clamp));
  return <AbsoluteFill style={{background: '#2B2016'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <Img src={staticFile('scene.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920,
      transform: `scale(${1 + 0.035 * (t / DURATION)})`, transformOrigin: '50% 75%'}}/>
    {/* the sketch is drawn in: a paper-coloured veil clears from the top-left over the first seconds */}
    <AbsoluteFill style={{background: `linear-gradient(160deg, #F1E3C800 ${reveal * 120 - 20}%, #EEDDBEf2 ${reveal * 120}%)`}}/>
    {/* warm light drifting across the paper */}
    <div style={{position: 'absolute', left: -300 + (t / DURATION) * 700, top: 200, width: 700, height: 1500, transform: 'rotate(20deg)',
      background: 'linear-gradient(90deg, #FFE9B800, #FFE9B826, #FFE9B800)'}}/>
    {/* title */}
    <div style={{position: 'absolute', top: 140, left: 0, right: 0, textAlign: 'center', opacity: ease(interpolate(t, [0.2, 1.2], [0, 1], clamp))}}>
      <div dir="rtl" style={{fontFamily: '"DecoType Naskh", serif', fontSize: 90, color: '#2E2318', lineHeight: 1.2}}>أنتِ الحياة</div>
      <div dir="rtl" style={{fontFamily: UR, fontSize: 40, color: '#3A2C1E', marginTop: -10}}>تم میری زندگی ہو</div>
    </div>
    {/* the current line grows from small to full size, like the reference, dark red with a white outline */}
    {i >= 0 ? (() => {
      const [s, text] = LINES[i], next = i + 1 < LINES.length ? LINES[i + 1][0] : DURATION;
      const g = ease(interpolate(t, [s, s + Math.min(1.6, (next - s) * 0.6)], [0, 1], clamp));
      const out = interpolate(t, [next - 0.25, next], [1, 0], clamp);
      return <div dir="rtl" style={{position: 'absolute', top: 318, left: 0, right: 0, textAlign: 'center', fontFamily: UR, fontWeight: 700,
        fontSize: 104, lineHeight: 1.9, color: '#8E1B22',
        textShadow: ['-2px -2px', '2px -2px', '-2px 2px', '2px 2px', '0 3px', '0 -3px', '3px 0', '-3px 0'].map(o => `${o} 0 #FFF6EE`).join(', '),
        transform: `scale(${0.35 + 0.65 * g})`, opacity: Math.min(1, g * 3) * out,
        filter: 'drop-shadow(0 4px 6px #3A1A1066)'}}>{text}</div>;
    })() : null}
    {/* hearts and rings under the line */}
    <div style={{opacity: ease(interpolate(t, [1.0, 1.8], [0, 1], clamp))}}>
      <Heart x={480} y={528} s={36 * beat} c="#F07AA8" o={1}/><Heart x={540} y={525} s={46 * beat} c="#E0233A" o={1}/>
      <Rings x={606} y={528} s={36}/>
    </div>
    {Array.from({length: 10}, (_, k) => {   // small hearts floating up
      const life = 150, ph = (f + k * 37) % life, u = ph / life, gen = Math.floor((f + k * 37) / life);
      return <Heart key={k} x={120 + random(`hx${k}-${gen}`) * 840} y={1500 - u * 900} s={22 + random(`hs${k}`) * 18}
        c={k % 2 ? '#F07AA8' : '#E0233A'} o={0.55 * Math.sin(Math.PI * u)}/>;
    })}
    {/* his clip of her as a polaroid, from the 'phir mujhe kaisa gham' line to the end */}
    {pol > 0 ? <div style={{position: 'absolute', left: 520, top: 1420 + (1 - pol) * 380, width: 470, padding: '18px 18px 70px', background: '#FBF7EF',
      boxShadow: '0 18px 40px #00000066', transform: `rotate(${6 - 2 * pol}deg)`, opacity: pol}}>
      <Sequence from={Math.round(19.4 * FPS)} layout="none">
        <OffthreadVideo muted src={staticFile('clip.mp4')} playbackRate={0.55} style={{width: 434, height: 244, objectFit: 'cover', display: 'block'}}/>
      </Sequence>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontFamily: UR, fontSize: 34, color: '#8E1B22'}}>میری ملکہ</div>
    </div> : null}
    <AbsoluteFill style={{background: '#1E160F', opacity: Math.max(fade, 1 - ease(interpolate(t, [0, 0.6], [0, 1], clamp)))}}/>
  </AbsoluteFill>;
};
