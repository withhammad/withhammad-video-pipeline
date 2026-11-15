// PRIVATE (owner's Islamic account "Quran Beat"; never posted from the business accounts): "Khalid's letter" reel
// (reference DfXGrQbuao7 by @allmaxz_98, job 9c7bf4378ac0, 35.6 s, 1916x1078 AI anime battle scene over an Arabic
// dramatized reading of Khalid ibn al-Walid's letter to the marzbans of Persia, then a cavalry charge) rebuilt in the
// reference's own anime look, vertical, with English subtitles of the letter.
// RED LINES kept: Khalid (RA) and every Muslim rider are faceless (from behind, backlit silhouettes, or the face out of
// frame); no prophet is shown or named on screen. The owner appears as the modern reader of the letter in the opening
// shot (modern clothes, reading the parchment; never as Khalid) and in the creator chip.
// Audio: the reference's own stereo track, untouched (no music added; gain/limiter/master only, after the render).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, FRAMES = 1068; // 35.6 s; the reference audio is 35.598 s
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';

// Voice (Whisper large-v3 + spectrogram): Bismillah 0.05-1.6 | min Khalid ibn al-Walid 1.9-3.17 | ila marazibat Faris
// 3.3-5.0 | salamun 'ala man ittaba'a al-huda 5.2-7.15 | fa-imma an tuslimu 7.5-9.4 | wa-imma al-jizya 9.8-10.85 |
// wa-imma al-harb 11.1-12.2 | wa-illa fa-wallahi 12.43-14.17 | la-qad ji'tukum bi-rijal 14.43-16.6 | yuhibbuna al-mawt
// 16.9-18.43 | kama tuhibbuna antum al-hayah 18.83-21.1 | (music drop 21.43) Allahu Akbar 21.45-23.3 | ila al-amam
// 25.63-26.35 | taqaddamu 30.0-30.7 | Allahu Akbar 31.35-33.55, then a held choir/pad note. Drum grid after the drop: 22.13 s + n x 0.60 s.
// Narration cuts sit in the pauses between phrases (fog-of-sand dissolves); action cuts are hard, on the drum or on the
// shout's first frame.
type Fx = 'sand' | 'dust' | 'embers' | 'speed' | 'none';
export type Shot = {src: string; from: number; to: number; z0: number; z1: number; ox: number; oy: number;
  x0?: number; x1?: number; y0?: number; y1?: number; fx: Fx[]; rays?: boolean; dis?: number; punch?: number;
  shake?: number; smear?: [number, number]; sparks?: number[]};
export const SHOTS: Shot[] = [
  {src: 'shots/s00-him.jpg', from: 0, to: 96, z0: 1.04, z1: 1.12, ox: 42, oy: 30, x0: 10, x1: -6, fx: ['dust'], rays: true},
  {src: 'shots/s01-armies.jpg', from: 96, to: 217, z0: 1.16, z1: 1.04, ox: 50, oy: 72, y0: -40, y1: 10, fx: ['dust', 'sand'], rays: true, dis: 10},
  {src: 'shots/s02-back.jpg', from: 217, to: 288, z0: 1.04, z1: 1.13, ox: 46, oy: 55, x0: -14, x1: 10, fx: ['sand'], dis: 8},
  {src: 'shots/s03-marzuban.jpg', from: 288, to: 369, z0: 1.12, z1: 1.03, ox: 50, oy: 32, fx: ['dust'], dis: 8},
  {src: 'shots/s04-ranks.jpg', from: 369, to: 428, z0: 1.03, z1: 1.11, ox: 50, oy: 60, x0: 12, x1: -12, fx: ['sand'], dis: 8},
  {src: 'shots/s05-hilt.jpg', from: 428, to: 500, z0: 1.05, z1: 1.14, ox: 62, oy: 70, fx: ['dust'], dis: 8},
  {src: 'shots/s06-ridge.jpg', from: 500, to: 552, z0: 1.10, z1: 1.03, ox: 62, oy: 40, x0: 16, x1: -16, fx: ['dust'], rays: true, dis: 8},
  {src: 'shots/s07-tent.jpg', from: 552, to: 642, z0: 1.03, z1: 1.13, ox: 50, oy: 32, fx: ['embers'], dis: 8},
  {src: 'shots/s08-sword.jpg', from: 642, to: 701, z0: 1.16, z1: 1.06, ox: 50, oy: 40, fx: ['dust', 'sand'], rays: true, punch: 0.09, shake: 14},
  {src: 'shots/s09-hooves.jpg', from: 701, to: 769, z0: 1.06, z1: 1.18, ox: 50, oy: 60, x0: 22, x1: -22, fx: ['sand', 'speed'], punch: 0.07, shake: 9, smear: [26, 0]},
  {src: 'shots/s10-charge.jpg', from: 769, to: 844, z0: 1.05, z1: 1.20, ox: 50, oy: 55, fx: ['sand', 'speed'], punch: 0.08, shake: 10, smear: [0, 18]},
  {src: 'shots/s11-clash.jpg', from: 844, to: 898, z0: 1.10, z1: 1.16, ox: 55, oy: 50, x0: -14, x1: 8, fx: ['sand'], punch: 0.07, shake: 12, sparks: [844, 862, 880]},
  {src: 'shots/s12-aerial.jpg', from: 898, to: 1008, z0: 1.04, z1: 1.14, ox: 50, oy: 50, y0: 20, y1: -20, fx: ['dust'], punch: 0.06, shake: 6},
  {src: 'shots/s13-dusk.jpg', from: 1008, to: FRAMES, z0: 1.10, z1: 1.04, ox: 50, oy: 75, fx: ['dust'], rays: true, punch: 0.03},
];
// drum hits after the drop (frames): small zoom and exposure pulses keep the charge on the beat
export const BEATS = Array.from({length: 24}, (_, n) => Math.round((22.13 + 0.6 * n) * FPS)).filter((b) => b >= 642 && b < FRAMES);

const n1 = (k: string, f: number) => random(`${k}-${f}`) * 2 - 1;

const Particles: React.FC<{fx: Fx; f: number; seed: string}> = ({fx, f, seed}) => {
  if (fx === 'none') return null;
  const N = fx === 'sand' ? 40 : fx === 'speed' ? 34 : fx === 'embers' ? 30 : 32;
  return <>{Array.from({length: N}, (_, k) => {
    const r = (s: string) => random(`${seed}${fx}${k}${s}`);
    if (fx === 'sand') { // wind-blown sand streaks, left to right, low in the frame
      const life = 16 + r('l') * 14, u = ((f + r('p') * life) % life) / life;
      const x = -300 + u * 1700, y = 700 + r('y') * 1250 + Math.sin(u * 4 + k) * 30, w = 60 + r('w') * 140;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: w, height: 4 + r('h') * 5, borderRadius: 6, filter: 'blur(2px)',
        background: 'linear-gradient(90deg, #F3D9A400, #F7E2B5aa, #F3D9A400)', opacity: Math.sin(Math.PI * u) * (0.18 + r('o') * 0.25)}}/>;
    }
    if (fx === 'speed') { // radial speed lines from the centre of the frame
      const life = 7 + r('l') * 6, u = ((f + r('p') * life) % life) / life, a = r('a') * Math.PI * 2;
      const d0 = 380 + u * 900, len = 140 + r('w') * 260;
      return <div key={k} style={{position: 'absolute', left: 540 + Math.cos(a) * d0, top: 960 + Math.sin(a) * d0, width: len, height: 2.5,
        background: 'linear-gradient(90deg, #FFFFFF00, #FFFFFFb0)', transformOrigin: '0 50%', transform: `rotate(${a}rad)`,
        opacity: Math.sin(Math.PI * u) * 0.55}}/>;
    }
    if (fx === 'embers') { // warm lamp motes drifting up
      const life = 60 + r('l') * 50, u = ((f + r('p') * life) % life) / life;
      const x = 120 + r('x') * 840 + Math.sin(u * 5 + k) * 26, y = 1700 - u * 1300, s = 3 + r('s') * 4;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFD27A',
        boxShadow: `0 0 ${4 * s}px ${s}px #FFB34488`, opacity: Math.sin(Math.PI * u) * (0.5 + 0.4 * Math.sin(f / 3 + k))}}/>;
    }
    // dust: slow glowing motes in the light
    const life = 90 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
    const x = r('x') * 1080 + u * 180 - 90, y = 200 + r('y') * 1600 - u * 140, s = 2 + r('s') * 4;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFF1D2',
      boxShadow: `0 0 ${3 * s}px #FFE3A888`, opacity: Math.sin(Math.PI * u) * (0.3 + r('o') * 0.4)}}/>;
  })}</>;
};

// slow sweeping god rays over the painted ones
const Rays: React.FC<{f: number; o: number}> = ({f, o}) => <AbsoluteFill style={{opacity: o, mixBlendMode: 'screen',
  background: `repeating-conic-gradient(from ${-28 + Math.sin(f / 70) * 4}deg at 62% -6%, #FFE6B000 0deg, #FFE6B022 3deg, #FFE6B000 7deg, #FFE6B000 11deg)`,
  maskImage: 'linear-gradient(180deg, #000 0%, #000a 45%, #0000 85%)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000a 45%, #0000 85%)'}}/>;

const Sparks: React.FC<{f: number; at: number; seed: string}> = ({f, at, seed}) => {
  const k0 = f - at; if (k0 < 0 || k0 > 14) return null;
  return <>{Array.from({length: 26}, (_, k) => {
    const r = (s: string) => random(`${seed}${at}${k}${s}`), a = -Math.PI * (0.1 + r('a') * 1.1), v = 18 + r('v') * 34;
    const x = 600 + Math.cos(a) * v * k0, y = 860 + Math.sin(a) * v * k0 + 1.4 * k0 * k0;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: 22 + r('w') * 26, height: 3, borderRadius: 2, background: '#FFE9A8',
      boxShadow: '0 0 10px 3px #FFB347aa', transformOrigin: '0 50%', transform: `rotate(${a}rad)`, opacity: 1 - k0 / 14}}/>;
  })}
    <AbsoluteFill style={{background: 'radial-gradient(circle at 56% 45%, #FFF4D2 0%, #FFD58A55 10%, #00000000 34%)', opacity: Math.max(0, 1 - k0 / 5), mixBlendMode: 'screen'}}/>
  </>;
};

const Picture: React.FC<{s: Shot; f: number}> = ({s, f}) => {
  const k = f - s.from, len = s.to - s.from, u = Math.min(1, Math.max(0, k / len));
  const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65; // a soft ease on the Ken Burns
  const z = s.z0 + (s.z1 - s.z0) * e, x = (s.x0 ?? 0) + ((s.x1 ?? 0) - (s.x0 ?? 0)) * e, y = (s.y0 ?? 0) + ((s.y1 ?? 0) - (s.y0 ?? 0)) * e;
  const kk = Math.max(0, k);
  // the punch lands on the cut, then a small pulse on every drum hit inside the shot
  let punch = 1 + (s.punch ?? 0) * Math.exp(-kk / 4);
  let flash = 0;
  for (const b of BEATS) if (b > s.from && b < s.to && f >= b && f < b + 8) { punch += 0.018 * Math.exp(-(f - b) / 2.5); flash += 0.10 * Math.exp(-(f - b) / 2); }
  if (s.punch) flash += 0.16 * Math.exp(-kk / 2.5);
  const shake = (s.shake ?? 0) * (0.35 + 0.65 * Math.exp(-kk / 6));
  const sx = shake * n1(`sx${s.src}`, f), sy = shake * n1(`sy${s.src}`, f);
  const base: React.CSSProperties = {position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
    transformOrigin: `${s.ox}% ${s.oy}%`, filter: `saturate(1.08) contrast(1.05) brightness(${1 + flash})`};
  const tf = (dx: number, dy: number) => `translate(${x + sx + dx}px, ${y + sy + dy}px) scale(${z * punch})`;
  return <AbsoluteFill>
    <Img src={staticFile(s.src)} style={{...base, transform: tf(0, 0)}}/>
    {s.smear ? [1, 2].map((m) => <Img key={m} src={staticFile(s.src)} style={{...base, transform: tf(s.smear![0] * m * 0.5, s.smear![1] * m * 0.5),
      opacity: 0.28 / m}}/>) : null}
    {s.rays ? <Rays f={f} o={0.9}/> : null}
    {s.fx.map((fx) => <Particles key={fx} fx={fx} f={f} seed={s.src}/>)}
    {(s.sparks ?? []).map((a) => <Sparks key={a} f={f} at={a} seed={s.src}/>)}
  </AbsoluteFill>;
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

const Finish: React.FC<{f: number}> = ({f}) => <>
  <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
    mixBlendMode: 'overlay', opacity: 0.22}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 48%, #00000000 52%, #1a0f0599 100%)'}}/>
</>;

// the creator chip: his real face and the account name
export const Chip: React.FC<{opacity?: number}> = ({opacity = 1}) => <div style={{position: 'absolute', left: 46, top: 238, height: 76,
  display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px 0 6px', borderRadius: 40, background: '#0000005c',
  border: '1.5px solid #FFFFFF40', opacity}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 64, height: 64, borderRadius: 32, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 31, color: '#FFFFFF', letterSpacing: 0.3, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
</div>;

const SHADOW = '0 3px 8px #000000e8, 0 0 30px #000000b0, 0 0 2px #000';
// the letter, in English, line by line as it is read (each line held at least 1.5 s after it is sharp, so a line can run
// up to 0.4 s into the next phrase)
export type Sub = {from: number; to: number; lines: {t: string; at: number}[]};
export const SUBS: Sub[] = [
  {from: 96, to: 153, lines: [{t: 'To the governors of Persia:', at: 96}]},
  {from: 153, to: 217, lines: [{t: 'Peace be upon whoever', at: 153}, {t: 'follows the guidance.', at: 153}]},
  {from: 222, to: 384, lines: [{t: 'Accept Islam,', at: 222}, {t: 'or pay the jizyah,', at: 291}, {t: 'or it is war.', at: 330}]},
  {from: 384, to: 438, lines: [{t: 'Otherwise, by Allah,', at: 384}]},
  {from: 438, to: 500, lines: [{t: 'I have come to you', at: 438}, {t: 'with men', at: 438}]},
  {from: 504, to: 642, lines: [{t: 'who love death', at: 504}, {t: 'as you love life.', at: 562}]},
];
const Subtitle: React.FC<{s: Sub; f: number}> = ({s, f}) => {
  const out = interpolate(f, [s.to - 3, s.to], [1, 0], clamp);
  return <div style={{position: 'absolute', left: 90, width: 860, top: 1190, textAlign: 'center'}}>
    {s.lines.map((l, k) => { const e = ease((f - l.at) / 6); return f < l.at ? null :
      <div key={k} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 62, lineHeight: 1.16, color: '#FFF6E4', textShadow: SHADOW,
        opacity: e * out, transform: `translateY(${(1 - e) * 14}px)`, filter: e < 1 ? `blur(${(1 - e) * 5}px)` : undefined, whiteSpace: 'nowrap'}}>{l.t}</div>; })}
  </div>;
};

// the battle cries, big, on their first frame
export const CRIES = [{t: 'ALLAHU AKBAR!', from: 642, to: 701, size: 102}, {t: 'FORWARD!', from: 769, to: 844, size: 136}, {t: 'ADVANCE!', from: 898, to: 952, size: 130}];
const Cry: React.FC<{c: typeof CRIES[number]; f: number}> = ({c, f}) => {
  const k = f - c.from, e = ease(k / 5), out = interpolate(f, [c.to - 4, c.to], [1, 0], clamp);
  const sh = 6 * Math.exp(-k / 5);
  return <div style={{position: 'absolute', left: 60, width: 920, top: 820, textAlign: 'center', opacity: out,
    transform: `translate(${sh * n1('cx', f)}px, ${sh * n1('cy', f)}px) scale(${1.25 - 0.25 * e})`}}>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: c.size, letterSpacing: '0.04em', color: '#FFF3D6', whiteSpace: 'nowrap',
      textShadow: '0 5px 12px #000000f0, 0 0 44px #000000c0, 0 0 70px #C9781E80'}}>{c.t}</div>
  </div>;
};

export const HOOK: [string, string, string] = ['BEFORE THE', 'CHARGE,', 'KHALID (RA) WROTE:'];
export const END = {name: ['KHALID IBN', 'AL-WALID (RA)'], quote: '“A sword amongst the swords of Allah”', src: 'Sahih al-Bukhari 4262',
  letter: 'Letter: al-Tabari, Tarikh, 12 AH / 633 CE'};
export const END_AT = 952;

export const Khalid: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, SHOTS.findIndex((s) => f >= s.from && f < s.to));
  const cur = SHOTS[i], prev = SHOTS[i - 1], next = SHOTS[i + 1];
  // dissolves: centred on the cut, D frames long, with a warm sand haze at the middle
  let under: Shot | null = null, over: Shot | null = null, overO = 0, haze = 0;
  if (cur.dis && prev && f < cur.from + cur.dis / 2) { under = prev; overO = (f - (cur.from - cur.dis / 2)) / cur.dis; haze = 1 - Math.abs(f - cur.from) / (cur.dis / 2); }
  else if (next?.dis && f >= next.from - next.dis / 2) { over = next; overO = (f - (next.from - next.dis / 2)) / next.dis; haze = 1 - Math.abs(f - next.from) / (next.dis / 2); }
  const hookO = interpolate(f, [90, 96], [1, 0], clamp);
  const e = ease((f - END_AT) / 9), eQ = ease((f - END_AT - 9) / 9), eRef = ease((f - END_AT - 16) / 9), ePill = ease((f - END_AT - 22) / 9);
  return <AbsoluteFill style={{background: '#120b05', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    {under ? <><Picture s={under} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={cur} f={f}/></AbsoluteFill></>
      : over ? <><Picture s={cur} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={over} f={f}/></AbsoluteFill></>
      : <Picture s={cur} f={f}/>}
    {haze > 0 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 110% 80% at 50% 60%, #F2D7A6 20%, #D9B47A 100%)', opacity: 0.32 * haze}}/> : null}
    <Finish f={f}/>
    {/* soft dark band behind the subtitles and the hook so they read on bright sand and sky */}
    {f < 642 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 14% at 50% 1290px, #000000a8 0%, #00000000 100%)'}}/> : null}
    {f >= END_AT ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #000000c0 0%, #000000a0 34%, #00000060 45%, #00000000 56%)', opacity: e}}/> : null}
    <Chip/>
    {f < 96 ? <div style={{position: 'absolute', left: 90, width: 860, top: 1150, textAlign: 'center', opacity: hookO}}>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 68, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[0]}</span>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
          background: '#F4D58D', padding: '4px 20px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{HOOK[1]}</span>
      </div>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 70, letterSpacing: '0.03em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW, marginTop: 14}}>{HOOK[2]}</div>
    </div> : null}
    {SUBS.filter((s) => f >= s.from && f < s.to).map((s) => <Subtitle key={s.from} s={s} f={f}/>)}
    {CRIES.filter((c) => f >= c.from && f < c.to).map((c) => <Cry key={c.from} c={c} f={f}/>)}
    {f >= END_AT ? <>
      <div style={{position: 'absolute', left: 90, width: 900, top: 330, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * 16}px)`,
        filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
        {END.name.map((l) => <div key={l} style={{fontFamily: SERIF, fontWeight: 700, fontSize: 88, lineHeight: 1.08, letterSpacing: '0.04em',
          color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{l}</div>)}
      </div>
      <div style={{position: 'absolute', left: 90, width: 900, top: 560, textAlign: 'center', opacity: eQ}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: '#F4D58D', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.quote}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 1.2, color: '#F1E8D6', textShadow: SHADOW, marginTop: 10}}>{END.src}</div>
      </div>
      <div style={{position: 'absolute', left: 90, width: 900, top: 668, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 28, letterSpacing: 0.8, color: '#F1E8D6', textShadow: '0 2px 6px #000000e0'}}>{END.letter}</div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 740, display: 'flex', justifyContent: 'center', opacity: ePill,
        transform: `translateY(${(1 - ePill) * 12}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 34px 14px 14px', borderRadius: 44, background: '#F4D58D',
          boxShadow: '0 6px 24px #000000a0'}}>
          <Img src={staticFile('face-chip.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 1.2, color: '#1A1007'}}>FOLLOW QURAN BEAT</div>
        </div>
      </div>
    </> : null}
  </AbsoluteFill>;
};
