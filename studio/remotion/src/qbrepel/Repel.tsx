// PRIVATE (owner's Islamic account "Quran Beat", @quranbeat; never posted from the business accounts): the "Repel evil with
// good" reel (reference DfjoL3UIbxN by @hajja.eftikar, job 698c00a0a0e2, 31.1 s, 540x960 AI cartoon over a recitation of
// Fussilat 41:34-35) rebuilt in the reference's own look: hand-drawn cartoon characters (clean line art, cel shading, big
// round glasses) composited on photoreal old-Damascus streets (black-and-cream ablaq stone, ivy, carved wooden doors).
// The same story in the same order: a grumpy neighbour dumps rubbish at the door; the man at that door sweeps it up and
// leaves a gift basket at the neighbour's door; the neighbour is moved; later he falls in the street and the same man helps
// him up, and they end as friends. The reference's kind neighbour is the creator's own persona (her profile picture), so
// here the kind neighbour is the owner (a cartoon of his face, from his headshot); the grumpy neighbour is an old man.
// No prophet or Sahabi is in this story. The owner is also in the "Quran Beat" chip and on the end-card pill.
// Audio: the reference's own stereo track (the recitation), untouched: no cut, no speed or pitch change; gain, a
// lookahead-compensated safety limiter and app.audio.master only, after the render (finish.py). Nothing is added.
// Text: texts.json from text.py (quran.com text_uthmani = Tanzil letters and harakat; Sahih International), shown phrase
// by phrase as the reciter says it (the phrases rejoin to the full ayah).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import TX from './texts.json';
import {CUT, HOOK_END, PH, REC_END_F, TOTAL_F} from './timing';

export const FPS = 30, FRAMES = TOTAL_F;
export const REC_END = REC_END_F;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';

type Fx = 'dust' | 'leaves' | 'puff' | 'none';
export type Shot = {src: string; from: number; to: number; z0: number; z1: number; ox: number; oy: number;
  x0?: number; x1?: number; y0?: number; y1?: number; fx: Fx[]; sun?: boolean; dis?: number; punch?: number; shake?: number};
// cut frames (all in the dips between words, see timing.ts)
const C = CUT;
export const SHOTS: Shot[] = [
  {src: 'shots/s01-dump.jpg', from: 0, to: C[0], z0: 1.04, z1: 1.12, ox: 40, oy: 62, x0: 6, x1: -4, fx: ['dust'], sun: true, punch: 0.05, shake: 8},
  {src: 'shots/s02-trash.jpg', from: C[0], to: C[1], z0: 1.12, z1: 1.04, ox: 60, oy: 62, x0: -10, x1: 8, fx: ['dust'], sun: true},
  {src: 'shots/s03-open.jpg', from: C[1], to: C[2], z0: 1.03, z1: 1.11, ox: 50, oy: 40, fx: ['dust'], sun: true, punch: 0.03},
  {src: 'shots/s04-calm.jpg', from: C[2], to: C[3], z0: 1.05, z1: 1.14, ox: 55, oy: 30, fx: ['dust'], sun: true},
  {src: 'shots/s05-sweep.jpg', from: C[3], to: C[4], z0: 1.12, z1: 1.04, ox: 35, oy: 70, x0: -8, x1: 8, fx: ['dust'], sun: true, dis: 6},
  {src: 'shots/s06-basket.jpg', from: C[4], to: C[5], z0: 1.04, z1: 1.10, ox: 50, oy: 50, x0: 14, x1: -10, fx: ['leaves', 'dust'], sun: true},
  {src: 'shots/s07-place.jpg', from: C[5], to: C[6], z0: 1.10, z1: 1.03, ox: 45, oy: 70, fx: ['dust'], sun: true, dis: 10},
  {src: 'shots/s08-peek.jpg', from: C[6], to: C[7], z0: 1.03, z1: 1.11, ox: 60, oy: 30, fx: ['dust'], sun: true},
  {src: 'shots/s09-hold.jpg', from: C[7], to: C[8], z0: 1.04, z1: 1.12, ox: 40, oy: 30, fx: ['dust'], sun: true},
  {src: 'shots/s10-moved.jpg', from: C[8], to: C[9], z0: 1.22, z1: 1.28, ox: 50, oy: 0, y0: -300, y1: -340, fx: ['dust'], sun: true},   // face lifted clear of the text
  {src: 'shots/s11-fall.jpg', from: C[9], to: C[10], z0: 1.36, z1: 1.30, ox: 60, oy: 0, y0: -540, y1: -500, fx: ['puff', 'leaves'], sun: true, punch: 0.06, shake: 12, dis: 10},   // his face lifted clear of the text
  {src: 'shots/s12-help.jpg', from: C[10], to: C[11], z0: 1.03, z1: 1.10, ox: 70, oy: 45, x0: 10, x1: -8, fx: ['leaves', 'dust'], sun: true},
  {src: 'shots/s13-lift.jpg', from: C[11], to: C[12], z0: 1.10, z1: 1.03, ox: 55, oy: 40, fx: ['leaves', 'dust'], sun: true},
  {src: 'shots/s14-friends.jpg', from: C[12], to: FRAMES, z0: 1.03, z1: 1.12, ox: 50, oy: 30, fx: ['dust', 'leaves'], sun: true},
];

const n1 = (k: string, f: number) => random(`${k}-${f}`) * 2 - 1;

const Particles: React.FC<{fx: Fx; f: number; seed: string; at: number}> = ({fx, f, seed, at}) => {
  if (fx === 'none') return null;
  if (fx === 'puff') { // the dust thrown up by the fall, from the knees and hands at the start of the shot
    const k = f - at; if (k < 0 || k > 30) return null;
    const u = k / 30;
    return <>{Array.from({length: 26}, (_, i) => {
      const r = (s: string) => random(`puff${i}${s}`), a = Math.PI * (1.0 + r('a') * 1.0), v = 10 + r('v') * 18;
      const x = 650 + Math.cos(a) * v * k * 1.3, y = 1400 + Math.sin(a) * v * k * 0.35, s = 50 + r('s') * 80 + k * 5;
      return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s * 0.6, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #D8C7A6a0, #D8C7A600)', filter: 'blur(4px)', opacity: (1 - u) * 0.75}}/>;
    })}</>;
  }
  const N = fx === 'leaves' ? 7 : 30;
  return <>{Array.from({length: N}, (_, k) => {
    const r = (s: string) => random(`${seed}${fx}${k}${s}`);
    if (fx === 'leaves') { // a few ivy leaves drifting down through the light
      const life = 110 + r('l') * 70, u = ((f + r('p') * life) % life) / life;
      const x = r('x') * 1080 + Math.sin(u * 6 + k) * 60, y = -60 + u * 2000, s = 18 + r('s') * 16, rot = u * 540 * (r('d') > 0.5 ? 1 : -1);
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s * 0.7, borderRadius: '60% 0 60% 0',
        background: k % 3 ? '#6E8B3D' : '#A3923F', transform: `rotate(${rot}deg) scaleX(${Math.cos(u * 9 + k)})`,
        opacity: Math.sin(Math.PI * u) * 0.75, filter: 'blur(0.6px)', boxShadow: '0 2px 3px #00000040'}}/>;
    }
    // dust: slow glowing motes in the sunlight
    const life = 90 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
    const x = r('x') * 1080 + u * 160 - 80, y = 200 + r('y') * 1600 - u * 140, s = 2 + r('s') * 3.5;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFF1D2',
      boxShadow: `0 0 ${3 * s}px #FFE3A888`, opacity: Math.sin(Math.PI * u) * (0.25 + r('o') * 0.35)}}/>;
  })}</>;
};

// a slow warm sun flare drifting across the frame (late-afternoon light through the alley)
const Sun: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{mixBlendMode: 'screen', opacity: 0.32 + 0.06 * Math.sin(f / 40),
  background: `radial-gradient(ellipse 70% 45% at ${88 - (f % 600) / 600 * 20}% ${4 + Math.sin(f / 90) * 3}%, #FFD99Aa0 0%, #FFC06A30 45%, #FFC06A00 75%)`}}/>;

const Picture: React.FC<{s: Shot; f: number}> = ({s, f}) => {
  const k = f - s.from, len = s.to - s.from, u = Math.min(1, Math.max(0, k / len));
  const e = u * u * (3 - 2 * u) * 0.35 + u * 0.65;
  const z = s.z0 + (s.z1 - s.z0) * e, x = (s.x0 ?? 0) + ((s.x1 ?? 0) - (s.x0 ?? 0)) * e, y = (s.y0 ?? 0) + ((s.y1 ?? 0) - (s.y0 ?? 0)) * e;
  const kk = Math.max(0, k);
  const punch = 1 + (s.punch ?? 0) * Math.exp(-kk / 4), shake = (s.shake ?? 0) * Math.exp(-kk / 6);
  const flash = s.punch ? 0.10 * Math.exp(-kk / 2.5) : 0;
  const sx = shake * n1(`sx${s.src}`, f), sy = shake * n1(`sy${s.src}`, f);
  return <AbsoluteFill>
    <Img src={staticFile(s.src)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
      transformOrigin: `${s.ox}% ${s.oy}%`, transform: `translate(${x + sx}px, ${y + sy}px) scale(${z * punch})`,
      filter: `saturate(1.05) contrast(1.05) brightness(${1 + flash})`}}/>
    {s.sun ? <Sun f={f}/> : null}
    {s.fx.map((fx) => <Particles key={fx} fx={fx} f={f} seed={s.src} at={s.from}/>)}
  </AbsoluteFill>;
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

// film finish: one warm grade for every shot, grain and a soft vignette
const Finish: React.FC<{f: number}> = ({f}) => <>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFE2B014 0%, #00000000 40%, #3A221018 100%)', mixBlendMode: 'soft-light'}}/>
  <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
    mixBlendMode: 'overlay', opacity: 0.16}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 75% at 50% 46%, #00000000 55%, #1a0e0688 100%)'}}/>
</>;

// the creator chip: his real face, the account name and its handle
export const Chip: React.FC<{opacity?: number}> = ({opacity = 1}) => <div style={{position: 'absolute', left: 46, top: 238, height: 82,
  display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px 0 7px', borderRadius: 42, background: '#0000005c',
  border: '1.5px solid #FFFFFF40', opacity}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 68, height: 68, borderRadius: 34, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.08}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#FFFFFF', letterSpacing: 0.3, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 23, color: '#FFFFFFd8', letterSpacing: 0.4, textShadow: '0 1px 3px #000000aa'}}>@quranbeat</div>
  </div>
</div>;

const SHADOW = '0 3px 8px #000000e8, 0 0 30px #000000b0, 0 0 2px #000';
export const GOLD = '#F4D58D';

// A waqf sign standing after a space (here the «ۚ» after «ٱلسَّيِّئَةُ», as quran.com writes it) has no base letter, so the
// font puts it high and to the left of the word, floating. Only its position is moved (CSS, inside the same span as its
// space, so it is shaped exactly as before): it sits above the end of the word, as in the mushaf. The characters are
// unchanged: the rendered string is P.ar code point for code point.
const WAQF = /( [\u06D6-\u06DC])$/;
export const WaqfText: React.FC<{ar: string}> = ({ar}) => {
  const m = ar.match(WAQF);
  if (!m) return <>{ar}</>;
  return <>{ar.slice(0, -m[1].length)}<span style={{position: 'relative', top: '0.26em', left: '0.24em'}}>{m[1]}</span></>;
};

// one phrase on screen while it is recited: the surah label, the Uthmani text (Amiri Quran) and its Sahih International part
export const PhraseText: React.FC<{i: number; f: number}> = ({i, f}) => {
  const [id, a, b] = PH[i], P = TX.phrases.find((p) => p.id === id)!;
  const same = i > 0 && PH[i - 1][0] === id;          // a repeated phrase stays put, it only pulses
  const eIn = same ? 1 : ease((f - a) / 7);
  const next = PH[i + 1], keep = next && next[0] === id;
  const out = keep ? 1 : interpolate(f, [b - 5, b], [1, 0], clamp);
  const o = eIn * out, dy = (1 - eIn) * 12, bl = eIn < 1 ? (1 - eIn) * 5 : 0;
  const glow = same ? Math.exp(-Math.max(0, f - a) / 10) : 0;
  const end = P.last ? TX.ayat[String(P.n) as '34' | '35'].end : null;
  return <div style={{position: 'absolute', left: 100, width: 830, top: 1100, textAlign: 'center', opacity: o, transform: `translateY(${dy}px)`,
    filter: bl ? `blur(${bl}px)` : undefined}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 25, letterSpacing: 3, color: GOLD, textShadow: SHADOW}}>FUSSILAT {P.key}</div>
    <div dir="rtl" style={{marginTop: 4, fontFamily: AR, fontSize: 64, lineHeight: 1.8, color: '#FFF6E4',
      textShadow: glow ? `${SHADOW}, 0 0 ${24 * glow}px #FFD98A` : SHADOW}}>
      <WaqfText ar={P.ar}/>{end ? <span style={{fontSize: 56, marginRight: 14}}>{end}</span> : null}
    </div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 38, lineHeight: 1.26, color: '#F3EADA', textShadow: SHADOW, marginTop: 14}}>{P.en}</div>
  </div>;
};

export const HOOK: [string, string, string] = ['HE THREW TRASH AT MY DOOR', 'SO I SENT HIM', 'A GIFT'];
export const END = {l1: 'REPEL EVIL', l2: 'WITH WHAT IS', box: 'BETTER',
  quote: 'the one whom between you and him is enmity [will become] as though he was a devoted friend.',
  src: 'Fussilat 41:34 · Sahih International'};

export const Repel: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, SHOTS.findIndex((s) => f >= s.from && f < s.to));
  const cur = SHOTS[i], prev = SHOTS[i - 1], next = SHOTS[i + 1];
  // dissolves centred on the cut, dis frames long (only at calm cuts)
  let under: Shot | null = null, over: Shot | null = null, overO = 0;
  if (cur.dis && prev && f < cur.from + cur.dis / 2) { under = prev; overO = (f - (cur.from - cur.dis / 2)) / cur.dis; }
  else if (next?.dis && f >= next.from - next.dis / 2) { over = next; overO = (f - (next.from - next.dis / 2)) / next.dis; }
  const hookO = interpolate(f, [HOOK_END - 6, HOOK_END], [1, 0], clamp);
  const e = ease((f - REC_END - 4) / 9), eQ = ease((f - REC_END - 16) / 9), eRef = ease((f - REC_END - 22) / 9), ePill = ease((f - REC_END - 30) / 9);
  const pi = PH.findIndex(([, a, b]) => f >= a - 1 && f < b);
  return <AbsoluteFill style={{background: '#160d06', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    {under ? <><Picture s={under} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={cur} f={f}/></AbsoluteFill></>
      : over ? <><Picture s={cur} f={f}/><AbsoluteFill style={{opacity: overO}}><Picture s={over} f={f}/></AbsoluteFill></>
      : <Picture s={cur} f={f}/>}
    <Finish f={f}/>
    {/* a soft dark band behind the text so it reads on the bright stone and paving */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 51%, #000000a0 58%, #000000c0 70%, #000000a8 80%, #00000000 90%)'}}/>
    {f < HOOK_END ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #00000000 12%, #00000088 20%, #00000088 29%, #00000000 37%)', opacity: hookO}}/> : null}
    <Chip/>
    {f < HOOK_END ? <div style={{position: 'absolute', left: 90, width: 850, top: 400, textAlign: 'center', opacity: hookO}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 56, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[0]}</div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 14}}>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 56, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[1]}</span>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 56, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
          background: GOLD, padding: '2px 22px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{HOOK[2]}</span>
      </div>
    </div> : null}
    {pi >= 0 ? <PhraseText i={pi} f={f}/> : null}
    {f >= REC_END ? <>
      <div style={{position: 'absolute', left: 60, width: 960, top: 1010, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * 16}px)`,
        filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 76, lineHeight: 1.1, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l1}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 12}}>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 76, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l2}</span>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 72, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
            background: GOLD, padding: '2px 22px 8px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{END.box}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 110, width: 860, top: 1218, textAlign: 'center', opacity: eQ}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 34, lineHeight: 1.24, color: GOLD, textShadow: SHADOW}}>“…{END.quote}”</div>
      </div>
      <div style={{position: 'absolute', left: 90, width: 900, top: 1338, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 25, letterSpacing: 0.8, color: '#F1E8D6', textShadow: '0 2px 6px #000000e0'}}>{END.src}</div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 1392, display: 'flex', justifyContent: 'center', opacity: ePill,
        transform: `translateY(${(1 - ePill) * 12}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 32px 12px 12px', borderRadius: 44, background: GOLD,
          boxShadow: '0 6px 24px #000000a0'}}>
          <Img src={staticFile('face-chip.jpg')} style={{width: 54, height: 54, borderRadius: 27, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 1.2, color: '#1A1007'}}>FOLLOW QURAN BEAT</div>
        </div>
      </div>
    </> : null}
  </AbsoluteFill>;
};
