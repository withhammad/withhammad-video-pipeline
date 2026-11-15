// PRIVATE (owner's Islamic account "Quran Beat"; never posted from the business accounts): the "Pharaoh called it magic"
// reel (reference DeMsfousL09 by @a.zuzz, job 2ace628477ab, 49.0 s, a 16:9 cinematic AI strip in a 720x1280 frame over a
// recitation of ash-Shu'ara 26:32-40) rebuilt in the reference's own photoreal epic look, full-frame vertical.
// RED LINES kept: no prophet is shown in any form. The reference showed Musa (AS) as a hooded man from behind, his hand
// and arm on the staff and on the serpent, and Harun (AS) beside him; here the staff lies alone on the floor, the white
// hand of 26:33 is only a white light from outside the frame on the onlookers' faces, and every other shot is Pharaoh, his
// court, the messengers, the magicians and the crowd. The magicians fall into sajdah only in the tail, faces hidden.
// The owner appears as the modern viewer in the opening shot (modern clothes, never as anyone in the story) and in the chip.
// Audio: the reference's own track (recitation + its sound design), untouched: no cut, no speed or pitch change; gain, an
// idle limiter and app.audio.master only, after the render (finish.py). Nothing is added under or after the recitation.
// Text: texts.json from text.py (quran.com text_uthmani = Tanzil letters and harakat; Sahih International).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import TX from './texts.json';

export const FPS = 30, FRAMES = 1575;   // 52.5 s: the recitation (0-49.02 s) + a 3.5 s end card after it
export const REC_END = 1471;           // first frame after the recitation (the audio decodes to 49.019 s)
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';

// The recitation (Whisper large-v3 word timings, refined on the 250-3000 Hz envelope; the reverb never lets it fall silent,
// so every cut sits in the dip between two words): 26:32 0.00 | 26:33 5.31 | 26:34 11.15 | 26:35 17.47 | 26:36 24.40 |
// 26:37 30.57 | 26:38 34.23 | 26:39 38.91 | 26:40 43.13-49.02. Sound design in the track: the staff's crack at 1.20 s and a
// low boom at 2.10 s (the staff turns), rumble to ~10 s.
type Fx = 'dust' | 'embers' | 'sand' | 'mist' | 'none';
export type Shot = {src: string; from: number; to: number; z0: number; z1: number; ox: number; oy: number;
  x0?: number; x1?: number; y0?: number; y1?: number; fx: Fx[]; torch?: boolean; dis?: number; punch?: number; shake?: number;
  white?: boolean; boom?: number; rays?: boolean};
export const SHOTS: Shot[] = [
  {src: 'shots/s00-him.jpg', from: 0, to: 55, z0: 1.05, z1: 1.12, ox: 30, oy: 30, x0: 8, x1: -4, fx: ['embers'], torch: true},
  {src: 'shots/s01-staff.jpg', from: 55, to: 92, z0: 1.06, z1: 1.12, ox: 30, oy: 62, fx: ['dust'], torch: true, boom: 63},
  {src: 'shots/s02-serpent.jpg', from: 92, to: 159, z0: 1.14, z1: 1.04, ox: 72, oy: 30, y0: 30, y1: -10, fx: ['dust', 'embers'], torch: true, punch: 0.08, shake: 12},
  {src: 'shots/s03-light.jpg', from: 159, to: 237, z0: 1.03, z1: 1.10, ox: 70, oy: 50, x0: 14, x1: -10, fx: ['dust'], white: true, punch: 0.04},
  {src: 'shots/s04-eyes.jpg', from: 237, to: 335, z0: 1.04, z1: 1.13, ox: 50, oy: 38, fx: ['dust'], white: true},
  {src: 'shots/s05-council.jpg', from: 335, to: 416, z0: 1.10, z1: 1.03, ox: 50, oy: 30, fx: ['embers'], torch: true, dis: 8},
  {src: 'shots/s06-pharaoh.jpg', from: 416, to: 524, z0: 1.03, z1: 1.13, ox: 45, oy: 25, fx: ['embers'], torch: true},
  {src: 'shots/s08-chiefs.jpg', from: 524, to: 606, z0: 1.04, z1: 1.11, ox: 60, oy: 40, x0: -12, x1: 10, fx: ['dust'], torch: true, dis: 8},
  {src: 'shots/s07-land.jpg', from: 606, to: 664, z0: 1.12, z1: 1.04, ox: 50, oy: 45, y0: -16, y1: 6, fx: ['dust'], rays: true},
  {src: 'shots/s09-ask.jpg', from: 664, to: 732, z0: 1.04, z1: 1.11, ox: 50, oy: 30, fx: ['embers'], torch: true},
  {src: 'shots/s10-viziers.jpg', from: 732, to: 805, z0: 1.11, z1: 1.04, ox: 50, oy: 30, fx: ['embers'], torch: true, dis: 8},
  {src: 'shots/s11-riders.jpg', from: 805, to: 917, z0: 1.04, z1: 1.14, ox: 50, oy: 45, fx: ['sand'], rays: true, punch: 0.04, shake: 5},
  {src: 'shots/s12-nile.jpg', from: 917, to: 977, z0: 1.10, z1: 1.03, ox: 50, oy: 50, x0: 12, x1: -12, fx: ['mist'], dis: 8},
  {src: 'shots/s13-bundles.jpg', from: 977, to: 1027, z0: 1.30, z1: 1.36, ox: 50, oy: 8, fx: ['dust']},   // the crop keeps the amulets at the bottom edge (an ankh) out
  {src: 'shots/s14-assembly.jpg', from: 1027, to: 1104, z0: 1.12, z1: 1.04, ox: 50, oy: 40, fx: ['dust'], rays: true, dis: 8},
  {src: 'shots/s15-sun.jpg', from: 1104, to: 1167, z0: 1.03, z1: 1.10, ox: 50, oy: 35, y0: 10, y1: -10, fx: ['dust'], rays: true},
  {src: 'shots/s16-crier.jpg', from: 1167, to: 1231, z0: 1.04, z1: 1.12, ox: 50, oy: 30, fx: ['dust'], rays: true, dis: 8},
  {src: 'shots/s17-streets.jpg', from: 1231, to: 1294, z0: 1.12, z1: 1.04, ox: 50, oy: 60, y0: -14, y1: 10, fx: ['sand']},
  {src: 'shots/s18-arena.jpg', from: 1294, to: 1364, z0: 1.03, z1: 1.11, ox: 50, oy: 50, fx: ['sand'], rays: true, dis: 8},
  {src: 'shots/s19-ropes.jpg', from: 1364, to: REC_END, z0: 1.04, z1: 1.15, ox: 50, oy: 62, fx: ['sand']},
  {src: 'shots/s20-sajdah.jpg', from: REC_END, to: FRAMES, z0: 1.12, z1: 1.04, ox: 50, oy: 60, fx: ['dust'], rays: true, punch: 0.05},
];
// the staff's crack (1.20 s) and the boom of the turn (2.10 s)
export const HITS = [36, 63];

const n1 = (k: string, f: number) => random(`${k}-${f}`) * 2 - 1;

const Particles: React.FC<{fx: Fx; f: number; seed: string}> = ({fx, f, seed}) => {
  if (fx === 'none') return null;
  const N = fx === 'sand' ? 36 : fx === 'embers' ? 26 : fx === 'mist' ? 16 : 32;
  return <>{Array.from({length: N}, (_, k) => {
    const r = (s: string) => random(`${seed}${fx}${k}${s}`);
    if (fx === 'sand') { // wind-blown sand streaks, low in the frame
      const life = 18 + r('l') * 16, u = ((f + r('p') * life) % life) / life;
      const x = -300 + u * 1700, y = 900 + r('y') * 1000 + Math.sin(u * 4 + k) * 30, w = 50 + r('w') * 120;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: w, height: 3 + r('h') * 4, borderRadius: 6, filter: 'blur(2px)',
        background: 'linear-gradient(90deg, #EBD3A400, #F2DDB2aa, #EBD3A400)', opacity: Math.sin(Math.PI * u) * (0.15 + r('o') * 0.22)}}/>;
    }
    if (fx === 'embers') { // torch sparks drifting up
      const life = 60 + r('l') * 50, u = ((f + r('p') * life) % life) / life;
      const x = 80 + r('x') * 920 + Math.sin(u * 5 + k) * 26, y = 1750 - u * 1400, s = 2.5 + r('s') * 3.5;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFCF7A',
        boxShadow: `0 0 ${4 * s}px ${s}px #FF9F3a88`, opacity: Math.sin(Math.PI * u) * (0.45 + 0.4 * Math.sin(f / 3 + k))}}/>;
    }
    if (fx === 'mist') { // slow river mist
      const life = 160 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
      const x = -400 + r('x') * 1200 + u * 300, y = 700 + r('y') * 1100, s = 260 + r('s') * 300;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s * 1.8, height: s, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #FFF3DD3a, #FFF3DD00)', opacity: Math.sin(Math.PI * u) * 0.4}}/>;
    }
    // dust: slow glowing motes in the light
    const life = 90 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
    const x = r('x') * 1080 + u * 160 - 80, y = 200 + r('y') * 1600 - u * 140, s = 2 + r('s') * 3.5;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFF1D2',
      boxShadow: `0 0 ${3 * s}px #FFE3A888`, opacity: Math.sin(Math.PI * u) * (0.28 + r('o') * 0.38)}}/>;
  })}</>;
};

// slow sweeping god rays
const Rays: React.FC<{f: number; o: number}> = ({f, o}) => <AbsoluteFill style={{opacity: o, mixBlendMode: 'screen',
  background: `repeating-conic-gradient(from ${-24 + Math.sin(f / 70) * 4}deg at 58% -8%, #FFE6B000 0deg, #FFE6B01c 3deg, #FFE6B000 7deg, #FFE6B000 11deg)`,
  maskImage: 'linear-gradient(180deg, #000 0%, #000a 40%, #0000 80%)', WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000a 40%, #0000 80%)'}}/>;

// a ring of dust thrown off the floor when the staff turns (centred on the staff in s01)
const DustRing: React.FC<{f: number; at: number}> = ({f, at}) => {
  const k = f - at; if (k < 0 || k > 24) return null;
  const u = k / 24;
  return <>{Array.from({length: 30}, (_, i) => {
    const r = (s: string) => random(`ring${i}${s}`), a = Math.PI * (1.05 + r('a') * 0.9), v = 26 + r('v') * 30;
    const x = 360 + Math.cos(a) * v * k * 1.4, y = 1420 + Math.sin(a) * v * k * 0.45, s = 40 + r('s') * 70 + k * 6;
    return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s * 0.6, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #D9C29Aa0, #D9C29A00)', filter: 'blur(4px)', opacity: (1 - u) * 0.7}}/>;
  })}</>;
};

const Picture: React.FC<{s: Shot; f: number}> = ({s, f}) => {
  const k = f - s.from, len = s.to - s.from, u = Math.min(1, Math.max(0, k / len));
  const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  const z = s.z0 + (s.z1 - s.z0) * e, x = (s.x0 ?? 0) + ((s.x1 ?? 0) - (s.x0 ?? 0)) * e, y = (s.y0 ?? 0) + ((s.y1 ?? 0) - (s.y0 ?? 0)) * e;
  const kk = Math.max(0, k);
  let punch = 1 + (s.punch ?? 0) * Math.exp(-kk / 4), flash = 0, shake = (s.shake ?? 0) * Math.exp(-kk / 7);
  // the staff's crack and boom: a jolt, a punch and a warm flash on the frame
  for (const h of HITS) if (f >= h && f < h + 14 && f >= s.from && f < s.to) {
    const d = f - h, big = h === 63 ? 1 : 0.45;
    punch += 0.05 * big * Math.exp(-d / 3); flash += 0.22 * big * Math.exp(-d / 2.5); shake += 16 * big * Math.exp(-d / 4);
  }
  if (s.punch) flash += 0.14 * Math.exp(-kk / 2.5);
  // torchlight flicker on interior shots
  const flick = s.torch ? 0.035 * (Math.sin(f / 2.3) * 0.5 + Math.sin(f / 5.1 + 1) * 0.3 + n1(`fl${s.src}`, f) * 0.2) : 0;
  const sx = shake * n1(`sx${s.src}`, f), sy = shake * n1(`sy${s.src}`, f);
  return <AbsoluteFill>
    <Img src={staticFile(s.src)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
      transformOrigin: `${s.ox}% ${s.oy}%`, transform: `translate(${x + sx}px, ${y + sy}px) scale(${z * punch})`,
      filter: `saturate(1.04) contrast(1.06) brightness(${1 + flash + flick})`}}/>
    {s.white ? <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.55 + 0.2 * Math.sin(f / 6) * Math.exp(-kk / 40) + 0.45 * Math.exp(-kk / 5),
      background: s.src.includes('s03') ? 'radial-gradient(ellipse 70% 90% at -8% 45%, #FFFFFF 0%, #FFFFFFb0 30%, #FFFFFF00 75%)'
        : 'radial-gradient(ellipse 120% 60% at 50% -10%, #FFFFFFa0 0%, #FFFFFF00 70%)'}}/> : null}
    {s.rays ? <Rays f={f} o={0.85}/> : null}
    {s.fx.map((fx) => <Particles key={fx} fx={fx} f={f} seed={s.src}/>)}
    {s.boom ? <DustRing f={f} at={s.boom}/> : null}
  </AbsoluteFill>;
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

// film finish: one grade for every shot (warm highlights, teal shadows), grain and a vignette
const Finish: React.FC<{f: number}> = ({f}) => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #2A4A5218 0%, #00000000 40%, #3A2A1218 100%)', mixBlendMode: 'soft-light'}}/>
  <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
    mixBlendMode: 'overlay', opacity: 0.2}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 46%, #00000000 52%, #120a0499 100%)'}}/>
</>;

// the creator chip: his real face and the account name
export const Chip: React.FC<{opacity?: number}> = ({opacity = 1}) => <div style={{position: 'absolute', left: 46, top: 238, height: 76,
  display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px 0 6px', borderRadius: 40, background: '#0000005c',
  border: '1.5px solid #FFFFFF40', opacity}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 64, height: 64, borderRadius: 32, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 31, color: '#FFFFFF', letterSpacing: 0.3, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
</div>;

const SHADOW = '0 3px 8px #000000e8, 0 0 30px #000000b0, 0 0 2px #000';
export const GOLD = '#F4D58D';

// one ayah on screen while it is recited: the surah label, the Uthmani text (Amiri Quran) and Sahih International
export const AYAH_WIN: [number, number][] = [[74, 159], [159, 335], [335, 524], [524, 732], [732, 917], [917, 1027], [1027, 1167],
  [1167, 1294], [1294, REC_END]];
export const AyahText: React.FC<{i: number; f: number}> = ({i, f}) => {
  const [a, b] = AYAH_WIN[i], A = TX.ayat[i];
  const eIn = ease((f - a) / 7), out = i === AYAH_WIN.length - 1 ? 1 : interpolate(f, [b - 4, b], [1, 0], clamp);
  const o = eIn * out, dy = (1 - eIn) * 12, bl = eIn < 1 ? (1 - eIn) * 5 : 0;
  return <div style={{position: 'absolute', left: 100, width: 830, top: 1040, textAlign: 'center', opacity: o, transform: `translateY(${dy}px)`,
    filter: bl ? `blur(${bl}px)` : undefined}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 25, letterSpacing: 3, color: GOLD, textShadow: SHADOW}}>
      ASH-SHU&apos;ARA {A.key}</div>
    <div dir="rtl" style={{marginTop: 6}}>
      {A.arLines.map((l: string, k: number) => <div key={k} style={{fontFamily: AR, fontSize: 54, lineHeight: 1.86, color: '#FFF6E4', textShadow: SHADOW,
        whiteSpace: 'nowrap'}}>{l}{k === A.arLines.length - 1 ? <span style={{fontSize: 48, marginRight: 14}}>{A.end}</span> : null}</div>)}
    </div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 37, lineHeight: 1.26, color: '#F3EADA', textShadow: SHADOW, marginTop: 20}}>{A.en}</div>
  </div>;
};

export const HOOK: [string, string, string] = ['PHARAOH SAW A MIRACLE', 'AND CALLED IT', 'MAGIC'];
export const END = {l1: 'THEY CAME TO WIN', l2: 'THEY FELL IN', box: 'SAJDAH', quote: TX.en46, src: 'Ash-Shu\'ara 26:41-46 · Sahih International'};

export const Magic: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, SHOTS.findIndex((s) => f >= s.from && f < s.to));
  const cur = SHOTS[i], prev = SHOTS[i - 1], next = SHOTS[i + 1];
  // dissolves centred on the cut, dis frames long (only at calm cuts between ayat)
  let under: Shot | null = null, over: Shot | null = null, overO = 0;
  if (cur.dis && prev && f < cur.from + cur.dis / 2) { under = prev; overO = (f - (cur.from - cur.dis / 2)) / cur.dis; }
  else if (next?.dis && f >= next.from - next.dis / 2) { over = next; overO = (f - (next.from - next.dis / 2)) / next.dis; }
  const hookO = interpolate(f, [70, 76], [1, 0], clamp);
  const e = ease((f - REC_END - 4) / 9), eQ = ease((f - REC_END - 16) / 9), eRef = ease((f - REC_END - 22) / 9), ePill = ease((f - REC_END - 30) / 9);
  const ai = AYAH_WIN.findIndex(([a, b]) => f >= a - 1 && f < b);
  return <AbsoluteFill style={{background: '#120b05', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    {under ? <><Picture s={under} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={cur} f={f}/></AbsoluteFill></>
      : over ? <><Picture s={cur} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={over} f={f}/></AbsoluteFill></>
      : <Picture s={cur} f={f}/>}
    <Finish f={f}/>
    {/* a soft dark band behind the text so it reads on bright sand, sky and the white light */}
    {f < REC_END ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 50%, #000000a8 58%, #000000c0 70%, #000000a0 78%, #00000000 88%)'}}/> : null}
    {f >= REC_END ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #000000c8 0%, #000000a8 30%, #00000060 44%, #00000000 56%)', opacity: e}}/> : null}
    <Chip/>
    {f < 76 ? <div style={{position: 'absolute', left: 100, width: 830, top: 1150, textAlign: 'center', opacity: hookO}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 60, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[0]}</div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 14}}>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 60, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[1]}</span>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 60, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
          background: GOLD, padding: '2px 22px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{HOOK[2]}</span>
      </div>
    </div> : null}
    {ai >= 0 ? <AyahText i={ai} f={f}/> : null}
    {f >= REC_END ? <>
      <div style={{position: 'absolute', left: 60, width: 960, top: 330, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * 16}px)`,
        filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 80, lineHeight: 1.1, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l1}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 14}}>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 80, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l2}</span>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 76, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
            background: GOLD, padding: '2px 22px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{END.box}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 110, width: 860, top: 576, textAlign: 'center', opacity: eQ}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 40, lineHeight: 1.25, color: GOLD, textShadow: SHADOW}}>“{END.quote}”</div>
      </div>
      <div style={{position: 'absolute', left: 90, width: 900, top: 692, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 27, letterSpacing: 0.8, color: '#F1E8D6', textShadow: '0 2px 6px #000000e0'}}>{END.src}</div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 768, display: 'flex', justifyContent: 'center', opacity: ePill,
        transform: `translateY(${(1 - ePill) * 12}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 34px 14px 14px', borderRadius: 44, background: GOLD,
          boxShadow: '0 6px 24px #000000a0'}}>
          <Img src={staticFile('face-chip.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 1.2, color: '#1A1007'}}>FOLLOW QURAN BEAT</div>
        </div>
      </div>
    </> : null}
  </AbsoluteFill>;
};
