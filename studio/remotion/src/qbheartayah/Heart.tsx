// PRIVATE (owner's Islamic account "Quran Beat"; never posted from the business accounts): the "Heart and ayah" reel
// (reference DfU-34WRzIF by @hous_semai2719, job qb-DfU-34WRzIF, 25.6 s, one locked top-down 3D shot of a figure in bed
// at night: a broken heart on his chest, he taps the glowing phone, the recitation starts, he folds his hands on his
// heart, it mends under a plaster, and he lies at peace to the end) rebuilt in the reference's own soft 3D-film look,
// with the owner as the listener in the bed (a modern man, never anyone from the Quranic story).
// Audio: the reference's own track (the phone tap, then al-Hijr 15:97-98 by one reciter, no music), untouched: no cut,
// no speed or pitch change; gain, an idle limiter and app.audio.master only, after the render (finish.py). Nothing is
// added under or after the recitation; the 3.3 s end card after it is silent.
// Text: texts.json from text.py (quran.com text_uthmani = Tanzil letters and harakat; Sahih International).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import TX from './texts.json';

export const FPS = 30, FRAMES = 870;   // 29.0 s: the reference track (0-25.66 s) + a 3.3 s silent end card
export const REC_END = 770;           // first frame after the track (it decodes to 25.659 s)
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const smooth = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const GOLD = '#F4D58D';

// Track (10 ms RMS envelope): the phone tap at 1.63 s | 15:97 1.95-14.33 s | pause | 15:98 16.13-25.2 s, room tail to 25.66.
export const TAP = 49;
// The plates, all one locked top-down camera (GPT Image 2 edits of s1, so the bed, window and phone stay put); the
// reference's beats: sad, eyes open, hand on the phone (0-2.0 s) | eyes close, hands fold on the heart (2.0-3.5 s) |
// the heart mends under a plaster (3.5-4.3 s) | arms back at his sides, a soft smile, at peace (5.3 s to the end).
type Plate = {src: string; at: number; fade: number};
const PLATES: Plate[] = [
  {src: 'shots/s1-sad.jpg', at: 0, fade: 0},
  {src: 'shots/s2-hands.jpg', at: 60, fade: 18},
  {src: 'shots/s3-mended.jpg', at: 108, fade: 16},
  {src: 'shots/s4-peace.jpg', at: 158, fade: 22},
];
export const MEND = 112;                         // the mend: a warm burst from the heart
const HEART = {x: 597, y: 866};                  // the heart on his chest, frame coordinates (same in every plate)
const PHONE0 = {x: 243, y: 1393}, PHONE1 = {x: 243, y: 1457};   // phone screen centre in s1-s3 and in s4
const WIN = {x: 1004, y: 378, w: 76, h: 1066};   // the window on the right (snow behind the glass)

// slow camera: a gentle push toward his face over the whole reel, plus a breath
const camera = (f: number) => {
  const u = f / FRAMES;
  const z = 1.0 + 0.075 * smooth(u) + 0.004 * Math.sin((f / FPS) * Math.PI * 2 / 4.2);
  return {z, ox: 52, oy: 34};
};

const Snow: React.FC<{f: number}> = ({f}) => <div style={{position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h,
  overflow: 'hidden', mixBlendMode: 'screen'}}>
  {Array.from({length: 46}, (_, k) => {
    const r = (s: string) => random(`snow${k}${s}`);
    const life = 120 + r('l') * 120, u = ((f + r('p') * life) % life) / life;
    const x = r('x') * WIN.w + Math.sin(u * 6 + k) * 6, y = -20 + u * (WIN.h + 40), s = 1.6 + r('s') * 2.6;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#EAF2FF',
      opacity: 0.35 + r('o') * 0.45}}/>;
  })}
</div>;

// dust motes drifting in the moonlight
const Motes: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 22}, (_, k) => {
  const r = (s: string) => random(`mote${k}${s}`);
  const life = 200 + r('l') * 160, u = ((f + r('p') * life) % life) / life;
  const x = 180 + r('x') * 820 - u * 90, y = 260 + r('y') * 1300 + u * 60, s = 2 + r('s') * 2.5;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#DCE8FF',
    boxShadow: `0 0 ${3 * s}px #BFD4FF88`, opacity: Math.sin(Math.PI * u) * (0.18 + r('o') * 0.3)}}/>;
})}</>;

// the phone: a warm glow that breathes, and the tap (a flash and one ripple) when the recitation is started
const PhoneGlow: React.FC<{f: number}> = ({f}) => {
  const p = f < PLATES[3].at ? PHONE0 : PHONE1;
  const k = f - TAP, flash = k >= 0 ? Math.exp(-k / 6) : 0;
  const o = 0.32 + 0.06 * Math.sin(f / 9) + 0.55 * flash;
  const ring = k >= 0 && k < 26 ? k / 26 : -1;
  return <>
    <div style={{position: 'absolute', left: p.x - 260, top: p.y - 200, width: 520, height: 400, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FFD9A0 0%, #FFB86A66 35%, #FFB86A00 100%)', opacity: o}}/>
    {ring >= 0 ? <div style={{position: 'absolute', left: p.x - 60 - ring * 160, top: p.y - 40 - ring * 110, width: 120 + ring * 320,
      height: 80 + ring * 220, borderRadius: '50%', border: `${3 - ring * 2}px solid #FFE7BE`, opacity: (1 - ring) * 0.8,
      boxShadow: '0 0 18px #FFD9A0aa', mixBlendMode: 'screen'}}/> : null}
  </>;
};

// the heart: a cold dim glow while broken, then the mend (a warm burst, a ring and sparks), then a slow heartbeat glow
const HeartGlow: React.FC<{f: number}> = ({f}) => {
  const k = f - MEND;
  const healed = smooth(k / 20);
  const beatT = (f / FPS) * (64 / 60), ph = beatT - Math.floor(beatT);
  const beat = Math.exp(-ph * 9) + 0.6 * Math.exp(-Math.max(0, ph - 0.18) * 11) * (ph > 0.18 ? 1 : 0);
  const glow = healed * (0.30 + 0.22 * beat);
  const burst = k >= 0 ? Math.exp(-k / 9) : 0;
  const ring = k >= 0 && k < 30 ? k / 30 : -1;
  return <>
    <div style={{position: 'absolute', left: HEART.x - 220, top: HEART.y - 200, width: 440, height: 400, borderRadius: '50%', mixBlendMode: 'screen',
      background: 'radial-gradient(closest-side, #FF8A7A 0%, #FF5A5A55 40%, #FF5A5A00 100%)', opacity: glow + 0.9 * burst}}/>
    {burst > 0.01 ? <div style={{position: 'absolute', left: HEART.x - 360, top: HEART.y - 360, width: 720, height: 720, borderRadius: '50%',
      mixBlendMode: 'screen', background: 'radial-gradient(closest-side, #FFF1C8 0%, #FFD58A55 30%, #FFD58A00 100%)', opacity: burst * 0.85}}/> : null}
    {ring >= 0 ? <div style={{position: 'absolute', left: HEART.x - 50 - ring * 260, top: HEART.y - 50 - ring * 260, width: 100 + ring * 520,
      height: 100 + ring * 520, borderRadius: '50%', border: `${4 - ring * 3}px solid #FFE3A6`, opacity: (1 - ring) * 0.75,
      boxShadow: '0 0 24px #FFD58Aaa', mixBlendMode: 'screen'}}/> : null}
    {k >= 0 && k < 40 ? Array.from({length: 18}, (_, i) => {
      const r = (s: string) => random(`spark${i}${s}`), a = r('a') * Math.PI * 2, v = 5 + r('v') * 9, u = k / 40;
      const x = HEART.x + Math.cos(a) * v * k, y = HEART.y + Math.sin(a) * v * k - 0.05 * k * k, s = 3 + r('s') * 4;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFF4D6',
        boxShadow: `0 0 ${4 * s}px ${s}px #FFD58A99`, opacity: 1 - u}}/>;
    }) : null}
  </>;
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

const Scene: React.FC<{f: number}> = ({f}) => {
  const {z, ox, oy} = camera(f);
  return <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ox}% ${oy}%`}}>
    {PLATES.map((p, i) => {
      const o = i === 0 ? 1 : smooth((f - p.at) / p.fade);
      if (o <= 0) return null;
      return <AbsoluteFill key={p.src} style={{opacity: o}}>
        <Img src={staticFile(p.src)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
          filter: 'saturate(1.02) contrast(1.04)'}}/>
      </AbsoluteFill>;
    })}
    <Snow f={f}/>
    {/* cold moonlight falling in from the window */}
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.5 + 0.05 * Math.sin(f / 40),
      background: 'linear-gradient(250deg, #9DB8FF22 0%, #9DB8FF10 30%, #9DB8FF00 55%)'}}/>
    <PhoneGlow f={f}/>
    <HeartGlow f={f}/>
    <Motes f={f}/>
  </AbsoluteFill>;
};

const Finish: React.FC<{f: number}> = ({f}) => <>
  <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
    mixBlendMode: 'overlay', opacity: 0.16}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 75% at 50% 44%, #00000000 55%, #05070c99 100%)'}}/>
</>;

// the creator chip: his real face, the account name and handle
export const Chip: React.FC<{opacity?: number}> = ({opacity = 1}) => <div style={{position: 'absolute', left: 46, top: 236, height: 80,
  display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px 0 7px', borderRadius: 42, background: '#0000006a',
  border: '1.5px solid #FFFFFF40', opacity}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 66, height: 66, borderRadius: 33, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 29, color: '#FFFFFF', letterSpacing: 0.3, lineHeight: 1.1, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: '#FFFFFFcc', letterSpacing: 0.3, lineHeight: 1.15}}>@quranbeat</div>
  </div>
</div>;

const SHADOW = '0 3px 8px #000000e8, 0 0 30px #000000b0, 0 0 2px #000';
const TOP = 1150;   // text block: y 1150-1490 (inside the safe zone: below 220, above 1500, left of x 950)

// one ayah on screen while it is recited: the surah label, the Uthmani text (Amiri Quran) and Sahih International
export const AYAH_WIN: [number, number][] = [[57, 478], [478, REC_END]];
export const AyahText: React.FC<{i: number; f: number}> = ({i, f}) => {
  const [a, b] = AYAH_WIN[i], A = TX.ayat[i];
  const eIn = ease((f - a) / 9), out = i === AYAH_WIN.length - 1 ? interpolate(f, [b - 2, b + 6], [1, 0], clamp) : interpolate(f, [b - 6, b], [1, 0], clamp);
  const o = eIn * out, dy = (1 - eIn) * 14, bl = eIn < 1 ? (1 - eIn) * 6 : 0;
  return <div style={{position: 'absolute', left: 110, width: 820, top: TOP + 20, textAlign: 'center', opacity: o, transform: `translateY(${dy}px)`,
    filter: bl ? `blur(${bl}px)` : undefined}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 25, letterSpacing: 3, color: GOLD, textShadow: SHADOW}}>AL-HIJR {A.key}</div>
    <div dir="rtl" style={{marginTop: 4, fontFamily: AR, fontSize: 56, lineHeight: 1.9, color: '#FFF8EC', textShadow: SHADOW, whiteSpace: 'nowrap'}}>
      {A.ar}<span style={{fontSize: 50, marginRight: 14}}>{A.end}</span></div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 38, lineHeight: 1.26, color: '#F3EEE4', textShadow: SHADOW, marginTop: 14}}>{A.en}</div>
  </div>;
};

export const HOOK: [string, string, string] = ['YOUR HEART MAY BREAK', 'BUT ONE AYAH', 'HEALS IT'];
export const END = {l1: 'WHEN YOUR CHEST FEELS TIGHT', l2: 'PRAISE HIM AND', box: 'PROSTRATE', src: 'Al-Hijr 15:97-98 · Sahih International'};

export const Heart: React.FC = () => {
  const f = useCurrentFrame();
  const hookIn = ease(f / 4), hookO = interpolate(f, [52, 58], [1, 0], clamp) * (f === 0 ? 1 : hookIn);
  const e = ease((f - REC_END - 2) / 9), eRef = ease((f - REC_END - 14) / 9), ePill = ease((f - REC_END - 22) / 9);
  const ai = AYAH_WIN.findIndex(([a, b]) => f >= a && f < b + 6);
  return <AbsoluteFill style={{background: '#06080d', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <Scene f={f}/>
    <Finish f={f}/>
    {/* a soft dark band behind the text over the blanket */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 54%, #00000099 60%, #000000b0 70%, #00000099 78%, #00000000 84%)',
      opacity: f >= REC_END ? 1 + 0.25 * e : 1}}/>
    <Chip/>
    {f < 58 ? <div style={{position: 'absolute', left: 90, width: 850, top: TOP + 60, textAlign: 'center', opacity: hookO}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, letterSpacing: '0.02em', color: '#FFF8EC', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[0]}</div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 16}}>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, letterSpacing: '0.02em', color: '#FFF8EC', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[1]}</span>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, letterSpacing: '0.03em', color: '#2A0A0A', whiteSpace: 'nowrap',
          background: GOLD, padding: '2px 22px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{HOOK[2]}</span>
      </div>
    </div> : null}
    {ai >= 0 ? <AyahText i={ai} f={f}/> : null}
    {f >= REC_END ? <>
      <div style={{position: 'absolute', left: 60, width: 880, top: TOP + 10, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * 16}px)`,
        filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 46, lineHeight: 1.1, letterSpacing: '0.02em', color: '#FFF8EC', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l1}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16}}>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 50, letterSpacing: '0.02em', color: '#FFF8EC', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l2}</span>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 50, letterSpacing: '0.03em', color: '#2A0A0A', whiteSpace: 'nowrap',
            background: GOLD, padding: '2px 20px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{END.box}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 60, width: 880, top: TOP + 172, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 27, letterSpacing: 0.8, color: '#F1E8D6', textShadow: '0 2px 6px #000000e0'}}>{END.src}</div>
      <div style={{position: 'absolute', left: 60, width: 880, top: TOP + 232, display: 'flex', justifyContent: 'center', opacity: ePill,
        transform: `translateY(${(1 - ePill) * 12}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 32px 12px 12px', borderRadius: 44, background: GOLD,
          boxShadow: '0 6px 24px #000000a0'}}>
          <Img src={staticFile('face-chip.jpg')} style={{width: 56, height: 56, borderRadius: 28, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 31, letterSpacing: 1.2, color: '#2A0A0A'}}>FOLLOW @QURANBEAT</div>
        </div>
      </div>
    </> : null}
  </AbsoluteFill>;
};
