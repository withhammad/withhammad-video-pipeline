// Private video for the owner's wife (never posted from our accounts): the reference's Salawat counter
// (Khayr Studio, De_os4rvGIO: 20 counts, one bead every 1.6 s from 1.0 s) rebuilt in a knitted-yarn look.
// The scene and every part are GPT Image 2 knitted artwork (job 9aa507dd49fd/knit); text, motion and the counter are here.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, T0 = 1.0, STEP = 1.6, COUNT = 20, DURATION = 35.1;
export const countAt = (t: number) => Math.max(0, Math.min(COUNT, Math.floor((t - T0) / STEP) + 1));
export type SalawatProps = {arabicFont: string; handle: string; parts: boolean};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const SERIF = 'KnitSerif, Georgia, serif';
const IVORY = '#FFF8EA', CREAM = '#F3E6CC', BLUSH = '#F6D3D6', THREAD = '#B89B6A';
const P = (n: string) => staticFile('parts/' + n + '.png');

// Satin-stitch text: a fine diagonal thread texture clipped to the glyphs, raised with soft shadows.
const satin = (base: string, hi: string, lo: string): React.CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(115deg, ${hi} 0px, ${base} 1.4px, ${lo} 2.8px, ${base} 4.2px)`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
  filter: 'drop-shadow(0 1.5px 0 #8C7650) drop-shadow(0 4px 6px #2F4A4466)',
});

// Bead string on a gentle wave: trough under the counter at x 540.
const S = 92, WAVE_Y = 622, AMP = 74;
const waveY = (x: number) => WAVE_Y + AMP * Math.cos(((x - 540) / 1080) * 2 * Math.PI);

const Scene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.03 * (t / DURATION);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile('scene.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: '50% 72%'}}/>
    {/* sun breathing glow */}
    <div style={{position: 'absolute', left: 956 - 190, top: 98 - 190, width: 380, height: 380, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #FFE6A055, #FFE6A000)', opacity: 0.6 + 0.4 * Math.sin(t * 1.3)}}/>
    {/* water shimmer */}
    {Array.from({length: 14}, (_, i) => {
      const y = 1748 + (i % 7) * 24, x = ((random(`wx${i}`) * 1080 + t * (20 + 14 * random(`ws${i}`))) % 1200) - 60;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 90 + 60 * random(`ww${i}`), height: 4, borderRadius: 4,
        background: '#FFF8E6', opacity: 0.18 + 0.16 * Math.sin(t * 2 + i)}}/>;
    })}
  </AbsoluteFill>;
};

// Fairy lights twinkle over the lit windows and garlands of the knitted mosque.
const LIGHTS: [number, number][] = [[118, 1090], [962, 1090], [300, 1355], [780, 1355], [540, 1320], [400, 1440], [680, 1440],
  [205, 1555], [875, 1555], [540, 1560], [330, 1650], [750, 1650], [120, 1500], [960, 1500], [470, 1215], [610, 1215]];
const Twinkle: React.FC<{t: number}> = ({t}) => <>{LIGHTS.map(([x, y], i) => {
  const o = 0.35 + 0.65 * Math.max(0, Math.sin(t * (1.6 + random(`tf${i}`) * 1.8) + random(`tp${i}`) * 6));
  return <div key={i} style={{position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: '50%',
    background: 'radial-gradient(closest-side, #FFF2C2ee, #FFD27a55 45%, #FFD27a00)', opacity: o}}/>;
})}</>;

const Sparkles: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 26}, (_, i) => {
  const life = 120 + random(`sl${i}`) * 90, ph = (f + random(`sp${i}`) * life) % life, k = ph / life;
  const gen = Math.floor((f + random(`sp${i}`) * life) / life);
  const x = random(`sx${i}-${gen}`) * 1080, y = 240 + random(`sy${i}-${gen}`) * 1300 - k * 80;
  const s = 6 + random(`ss${i}`) * 8, o = Math.sin(Math.PI * k) * 0.9;
  return <svg key={i} width={s * 2} height={s * 2} viewBox="-1 -1 2 2" style={{position: 'absolute', left: x - s, top: y - s, opacity: o}}>
    <path d="M0 -1 L0.22 -0.22 L1 0 L0.22 0.22 L0 1 L-0.22 0.22 L-1 0 L-0.22 -0.22 Z" fill="#FFF0C8"/></svg>;
})}</>;

const Cloud: React.FC<{t: number; parts: boolean}> = ({t, parts}) => parts ? <>
  <Img src={P('cloud_b')} style={{position: 'absolute', left: -300 + t * 22, top: 128, width: 220, filter: 'drop-shadow(0 6px 6px #2F4A4444)'}}/>
  <Img src={P('cloud_a')} style={{position: 'absolute', left: 1100 - t * 16, top: 150, width: 210, filter: 'drop-shadow(0 6px 6px #2F4A4444)'}}/>
</> : null;

const Butterflies: React.FC<{t: number; parts: boolean}> = ({t, parts}) => {
  if (!parts) return null;
  const B: [string, number, number, number, number, number][] = [   // name, start s, period s, y0, amplitude, size
    ['butterfly_pink', 0, 15, 820, 140, 92], ['butterfly_coral', 5.5, 17, 560, 120, 78], ['butterfly_pink', 12, 14, 1180, 110, 70],
    ['butterfly_coral', 19, 16, 175, 60, 80], ['butterfly_pink', 25, 13, 980, 130, 76]];
  return <>{B.map(([n, s, per, y0, amp, size], i) => {
    const u = (t - s) / per; if (u < 0 || u > 1) return null;
    const dir = i % 2 ? -1 : 1, x = dir > 0 ? -120 + u * 1320 : 1200 - u * 1320, y = y0 + amp * Math.sin(u * Math.PI * 2.2) - 60 * u;
    const flap = 0.35 + 0.65 * Math.abs(Math.cos(t * 9 + i)), tilt = 18 * Math.cos(u * Math.PI * 2.2) * dir;
    // each wing is one half of the image, hinged on the body and turned about the vertical axis
    const ang = (1 - flap) * 70, h = size * (n === 'butterfly_pink' ? 944 / 1375 : 850 / 1278);
    const wing = (side: 'l' | 'r') => <Img src={P(n)} style={{position: 'absolute', left: 0, top: 0, width: size, height: h,
      clipPath: side === 'l' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)', transformOrigin: '50% 50%',
      transform: `rotateY(${side === 'l' ? ang : -ang}deg)`}}/>;
    return <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - h / 2, width: size, height: h, perspective: 600,
      transform: `rotate(${tilt + (dir > 0 ? 20 : -20)}deg)`, filter: 'drop-shadow(0 6px 6px #2F4A4455)'}}>{wing('l')}{wing('r')}</div>;
  })}</>;
};

const Beads: React.FC<{f: number; parts: boolean}> = ({f, parts}) => {
  const t = f / FPS, c = countAt(t);
  const tk = T0 + (c - 1) * STEP, move = c === 0 ? 1 : ease(interpolate(t, [tk, tk + 0.5], [0, 1], clamp));
  const shift = c - 1 + move;
  const items: React.ReactNode[] = [], string: [number, number][] = [];
  for (let k = 0; k <= COUNT + 1; k++) {
    const x = 540 + (k - Math.max(0, shift)) * S;
    if (x < -90 || x > 1170) continue;
    const y = waveY(x); string.push([x, y]);
    const imam = k === 0 || k === COUNT + 1, near = Math.max(0, 1 - Math.abs(x - 540) / S);
    const active = k === c && c > 0;
    const r = (imam ? 44 : 34) * (1 + 0.38 * near);
    const src = imam ? 'imam' : active ? 'bead_coral' : 'bead_teal';
    // the head bead (imam) image is bead + gold cap + tassel: 517 x 1621, bead centre at 29 % of its height
    const iw = 2.0 * r, ih = iw * 1621 / 517;
    items.push(parts && imam
      ? <Img key={k} src={P(src)} style={{position: 'absolute', left: x - iw / 2, top: y - 0.29 * ih, width: iw, filter: 'drop-shadow(0 5px 6px #2F4A4466)'}}/>
      : parts
      ? <Img key={k} src={P(src)} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r,
          filter: `${active ? '' : 'brightness(1.32) saturate(0.85) '}drop-shadow(0 5px 6px #1F3A3488)${active ? ` drop-shadow(0 0 ${14 + 12 * near}px #FFD9A8)` : ''}`}}/>
      : <div key={k} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: imam || active ? '#E8907E' : '#6FA49A'}}/>);
  }
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <polyline points={string.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={THREAD} strokeWidth={5} strokeLinecap="round" opacity={0.9}/>
      <polyline points={string.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#F6E7C6" strokeWidth={2} strokeDasharray="6 7" opacity={0.85}/></svg>
    {items}
  </>;
};

const Counter: React.FC<{f: number; parts: boolean}> = ({f, parts}) => {
  const t = f / FPS, c = countAt(t), done = c >= COUNT;
  const tk = T0 + (c - 1) * STEP, p = c === 0 ? 0 : spring({frame: f - Math.round(tk * FPS), fps: FPS, config: {damping: 10, stiffness: 170}});
  const D = 224, glow = done ? 0.5 + 0.5 * Math.sin((t - tk) * 3) : 0;
  return <div style={{position: 'absolute', left: 540 - D / 2, top: 900 - D / 2, width: D, height: D,
    transform: `scale(${1 + 0.06 * Math.sin(Math.PI * Math.min(1, p))})`, filter: `drop-shadow(0 8px 10px #2F4A4466) drop-shadow(0 0 ${6 + 22 * glow}px #FFE3A8${done ? 'dd' : '00'})`}}>
    {parts ? <Img src={P('medallion')} style={{position: 'absolute', inset: 0, width: D, height: D}}/>
      : <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: CREAM}}/>}
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 6}}>
      <div style={{fontFamily: SERIF, fontSize: 92, lineHeight: 0.95, ...satin('#B85F63', '#E9A3A0', '#8E4246'), transform: `scale(${1 + 0.16 * p - 0.16 * Math.min(1, p)})`}}>{c}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, marginTop: 2, ...satin('#7C8F7F', '#A8B9A9', '#5D6F60')}}>/ 20</div>
    </div>
  </div>;
};

export const SalawatKnit: React.FC<SalawatProps> = ({arabicFont, handle, parts}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const intro = ease(interpolate(t, [0, 0.9], [0, 1], clamp));
  const tEnd = T0 + (COUNT - 1) * STEP + 0.5, outro = ease(interpolate(t, [tEnd, tEnd + 0.9], [0, 1], clamp));
  const fadeOut = interpolate(t, [DURATION - 0.7, DURATION], [0, 1], clamp);
  return <AbsoluteFill style={{background: '#3C5F59'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <Scene t={t}/>
    <Twinkle t={t}/>
    <Cloud t={t} parts={parts}/>
    <div style={{position: 'absolute', top: 268, left: 0, right: 0, textAlign: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 18}px)`}}>
      <div dir="rtl" style={{fontFamily: arabicFont, fontWeight: 700, fontSize: 118, lineHeight: 1.35, ...satin(IVORY, '#FFFFFF', '#E8D6B4')}}>صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ</div>
      {parts ? <Img src={P('divider')} style={{width: 420, marginTop: 4, filter: 'drop-shadow(0 3px 3px #2F4A4455)'}}/> : <div style={{height: 30}}/>}
      <div style={{fontFamily: SERIF, fontSize: 58, letterSpacing: 1, marginTop: 4, ...satin(IVORY, '#FFFFFF', '#E3D0AE')}}>Sallallahu ‘alayhi wa sallam</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 37, marginTop: 4, ...satin(BLUSH, '#FFE9EA', '#E3B2B6')}}>May Allah’s peace and blessings be upon him</div>
    </div>
    <Beads f={f} parts={parts}/>
    <Counter f={f} parts={parts}/>
    <Butterflies t={t} parts={parts}/>
    <Sparkles f={f}/>
    <div style={{position: 'absolute', left: 40, right: 40, top: 1680, height: 190, borderRadius: 100, opacity: outro * 0.95,
      background: 'radial-gradient(closest-side, #2A4641f5, #2A464100)'}}/>
    <div style={{position: 'absolute', top: 1708, left: 0, right: 0, textAlign: 'center', opacity: outro, transform: `translateY(${(1 - outro) * 16}px)`}}>
      <div dir="rtl" style={{fontFamily: arabicFont, fontWeight: 700, fontSize: 66, lineHeight: 1.3, ...satin(IVORY, '#FFFFFF', '#E8D6B4')}}>تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, ...satin(BLUSH, '#FFE9EA', '#E3B2B6')}}>May Allah accept it from us and from you</div>
    </div>
    <div style={{position: 'absolute', left: 540 - 260, top: 1838, width: 520, height: 70, opacity: intro}}>
      {parts ? <Img src={P('ribbon')} style={{position: 'absolute', left: -20, top: -24, width: 560, height: 118, objectFit: 'contain'}}/> : null}
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 36, letterSpacing: 1,
        ...satin('#93404C', '#BE6672', '#6E2B35'), filter: 'drop-shadow(0 1px 0 #FFFFFF99)'}}>{handle}</div>
    </div>
    <AbsoluteFill style={{background: '#14201E', opacity: Math.max(1 - intro, fadeOut)}}/>
  </AbsoluteFill>;
};
