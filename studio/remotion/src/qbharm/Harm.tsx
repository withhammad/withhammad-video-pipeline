// PRIVATE (owner's Islamic account "Quran Beat", @quranbeat; never posted from the business accounts): the "Has harm touched
// you?" reel (reference DfsFqEpxneY by @hous_semai2719, job qb-DfsFqEpxneY, 26.4 s, one continuous AI-animated shot over a
// trimmed recitation of Yunus 10:107, first half; here the WHOLE ayah by Mishary Alafasy, owner's pick 2026-11-16 "Find
// full recitation") rebuilt in the reference's own look: a soft stylised-3D bedroom at night, a big
// open window on a rain storm, a candle and a phone on the bedside table, the listener in bed with a broken heart floating
// above his head that is mended and then glows while the recitation plays. The reference's listener (a ball-headed doodle
// figure) is the owner here, a stylised-3D likeness from his headshot (GPT Image 2 --ref), in four poses: sad, reaching for
// the phone; eyes closed, hand on his heart; hands clasped, at peace; looking up at the window with a small smile. No prophet
// is in this story or on screen. The owner is also in the "Quran Beat" chip and on the end-card pill.
// Audio: Alafasy's 10:107 (everyayah.com Alafasy_128kbps/010107.mp3) after 1 s of silence, untouched: no cut, no speed or
// pitch change, no music; gain, a lookahead-compensated safety limiter and app.audio.master only, after the render (finish.py).
// Text: texts.json from text.py (quran.com text_uthmani = Tanzil letters and harakat; Sahih International), shown phrase by
// phrase as the reciter says it.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import TX from './texts.json';
import {DIS, GLOW_FULL, GLOW_START, HOOK_END, MEND, MEND_START, PH, POSE, REC_END_F, TOTAL_F} from './timing';

export const FPS = 30, FRAMES = TOTAL_F;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const GOLD = '#F4D58D';
const SHADOW = '0 3px 8px #000000e8, 0 0 30px #000000b0, 0 0 2px #000';

// frame geometry (1080x1920; the stills are fitted to cover it): the window's sky, the heart above his head, the candle flame
// and the phone, measured on the stills
const SKY = {x: 160, y: 205, w: 755, h: 810};
export const HEART = {x: 300, y: 965, w: 200};
const CANDLE = {x: 1026, y: 1400}, PHONE = {x: 842, y: 1532};

const n1 = (k: string, f: number) => random(`${k}-${f}`) * 2 - 1;

// the rain outside, falling on top of the painted rain, clipped to the window
const Rain: React.FC<{f: number}> = ({f}) => <div style={{position: 'absolute', left: SKY.x, top: SKY.y, width: SKY.w, height: SKY.h,
  overflow: 'hidden'}}>
  {Array.from({length: 70}, (_, k) => {
    const r = (s: string) => random(`rain${k}${s}`), len = 40 + r('l') * 70, sp = 38 + r('v') * 26, per = (SKY.h + len) / sp;
    const u = ((f + r('p') * per) % per) / per, x = r('x') * SKY.w, y = -len + u * (SKY.h + len);
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: 1.6, height: len, transform: 'rotate(6deg)',
      background: 'linear-gradient(180deg, #C8D8FF00, #C8D8FF70)', opacity: 0.35 + r('o') * 0.4}}/>;
  })}
</div>;

// candle flame light and the phone's screen while the recitation plays
const Lights: React.FC<{f: number}> = ({f}) => {
  const fl = 0.85 + 0.1 * Math.sin(f / 3.1) + 0.06 * n1('fl', Math.floor(f / 2));
  const ph = interpolate(f, [60, 90], [0.25, 1], clamp) * (0.8 + 0.2 * Math.sin(f / 9));
  return <>
    <div style={{position: 'absolute', left: CANDLE.x - 260, top: CANDLE.y - 260, width: 520, height: 520, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #FFC46A70, #FFB04A28 45%, #FFB04A00)', mixBlendMode: 'screen', opacity: fl}}/>
    <div style={{position: 'absolute', left: PHONE.x - 150, top: PHONE.y - 70, width: 300, height: 140, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #9CC8FF60, #9CC8FF00)', mixBlendMode: 'screen', opacity: ph}}/>
  </>;
};

// the heart above his head: broken (two halves, apart, wobbling), the halves close, a pop and it is mended (the bandage),
// then a warm glow that grows and breathes; it lights the room around it
export const Heart: React.FC<{f: number; size?: number; still?: 'broken' | 'mended'}> = ({f, size = HEART.w, still}) => {
  const bob = Math.sin(f / 22) * 7;
  const k = size / 1117, H = 925 * k;                  // the broken heart's sprite box, scaled
  const mended = still ? still === 'mended' : f >= MEND;
  const close = still ? 0 : ease((f - MEND_START) / (MEND - MEND_START));
  const gap = (1 - close) * (10 + 3 * Math.sin(f / 9)), rot = (1 - close) * (4 + 1.5 * Math.sin(f / 13));
  const pop = mended && !still ? 1 + 0.18 * Math.exp(-Math.max(0, f - MEND) / 5) * Math.cos(Math.max(0, f - MEND) / 2.2) : 1;
  const flash = mended && !still ? Math.exp(-Math.max(0, f - MEND) / 4) : 0;
  const glow = still === 'mended' ? 1 : still ? 0
    : interpolate(f, [GLOW_START, GLOW_FULL], [0, 0.6], clamp) + interpolate(f, [GLOW_FULL, GLOW_FULL + 30], [0, 0.4], clamp);
  const breathe = 1 + 0.06 * Math.sin(f / 14);
  const mw = 1066 * k, mh = 980 * k;
  return <div style={{position: 'absolute', left: HEART.x - size / 2, top: HEART.y - H / 2 + bob, width: size, height: H}}>
    {glow > 0 ? <div style={{position: 'absolute', left: size / 2 - size * 1.6, top: H / 2 - size * 1.6, width: size * 3.2, height: size * 3.2,
      borderRadius: '50%', background: 'radial-gradient(closest-side, #FFB27AE0, #FF8A5A80 40%, #FF7A4A00)', mixBlendMode: 'screen',
      opacity: glow, transform: `scale(${(0.7 + 0.3 * glow) * breathe})`}}/> : null}
    {flash > 0.02 ? <div style={{position: 'absolute', left: size / 2 - size, top: H / 2 - size, width: size * 2, height: size * 2,
      borderRadius: '50%', border: `${4 * flash}px solid #FFE7C0`, opacity: flash, transform: `scale(${1.6 - 0.6 * flash})`,
      boxShadow: '0 0 30px #FFD9A0'}}/> : null}
    {mended
      ? <Img src={staticFile('hearts/h-mended.png')} style={{position: 'absolute', left: (size - mw) / 2, top: (H - mh) / 2, width: mw, height: mh,
        transform: `scale(${pop})`, filter: `drop-shadow(0 8px 14px #00000080) brightness(${1 + 0.12 * glow + 0.5 * flash})`}}/>
      : <>
        <Img src={staticFile('hearts/h-half-l.png')} style={{position: 'absolute', left: -gap, top: 0, width: size, height: H,
          transformOrigin: '50% 100%', transform: `rotate(${-rot}deg)`, filter: 'drop-shadow(0 8px 14px #00000080) saturate(0.85) brightness(0.92)'}}/>
        <Img src={staticFile('hearts/h-half-r.png')} style={{position: 'absolute', left: gap, top: 0, width: size, height: H,
          transformOrigin: '50% 100%', transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 8px 14px #00000080) saturate(0.85) brightness(0.92)'}}/>
      </>}
    {/* sparkles at the mend */}
    {!still && f >= MEND && f < MEND + 26 ? Array.from({length: 12}, (_, i) => {
      const u = (f - MEND) / 26, a = (i / 12) * Math.PI * 2 + random(`sp${i}`), d = size * (0.45 + 0.6 * ease(u) + random(`sd${i}`) * 0.2);
      const s = 7 + random(`ss${i}`) * 7;
      return <div key={i} style={{position: 'absolute', left: size / 2 + Math.cos(a) * d - s / 2, top: H / 2 + Math.sin(a) * d - s / 2,
        width: s, height: s, borderRadius: '50%', background: '#FFF1D0', boxShadow: '0 0 12px #FFD08A', opacity: 1 - u}}/>;
    }) : null}
  </div>;
};

// the room lit by the glowing heart (warm light falling on him, the bed and the wall)
const HeartLight: React.FC<{f: number}> = ({f}) => {
  const g = interpolate(f, [GLOW_START, GLOW_FULL], [0, 0.55], clamp) + interpolate(f, [GLOW_FULL, GLOW_FULL + 30], [0, 0.3], clamp);
  if (g <= 0) return null;
  return <div style={{position: 'absolute', left: HEART.x - 650, top: HEART.y - 520, width: 1300, height: 1200, borderRadius: '50%',
    background: 'radial-gradient(closest-side, #FFB07860, #FF9A6024 50%, #FF9A6000)', mixBlendMode: 'screen', opacity: g * (1 + 0.08 * Math.sin(f / 14))}}/>;
};

const Still: React.FC<{src: string; o?: number}> = ({src, o = 1}) => <Img src={staticFile(src)} style={{position: 'absolute', inset: 0,
  width: 1080, height: 1920, objectFit: 'cover', opacity: o}}/>;

// the whole picture: one continuous shot with a slow push in towards him and the heart; poses dissolve into each other
const Picture: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  POSE.forEach(([, a], k) => { if (f >= a) i = k; });
  const [src] = POSE[i], next = POSE[i + 1], prev = POSE[i - 1];
  let under: string | null = null, over: string | null = null, o = 0;
  if (prev && f < POSE[i][1] + DIS / 2) { under = prev[0]; o = (f - (POSE[i][1] - DIS / 2)) / DIS; }
  else if (next && f >= next[1] - DIS / 2) { over = next[0]; o = (f - (next[1] - DIS / 2)) / DIS; }
  const u = Math.min(1, f / FRAMES), z = 1.0 + 0.075 * (u * u * (3 - 2 * u) * 0.4 + u * 0.6);
  return <AbsoluteFill style={{transformOrigin: '34% 52%', transform: `scale(${z})`}}>
    {under ? <><Still src={under}/><Still src={src} o={o}/></> : over ? <><Still src={src}/><Still src={over} o={o}/></> : <Still src={src}/>}
    <Rain f={f}/>
    <Lights f={f}/>
    <HeartLight f={f}/>
    <Heart f={f}/>
  </AbsoluteFill>;
};

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;
const Finish: React.FC<{f: number}> = ({f}) => <>
  <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
    mixBlendMode: 'overlay', opacity: 0.13}}/>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 78% at 50% 48%, #00000000 58%, #05070cb0 100%)'}}/>
</>;

// the creator chip: his real face, the account name and its handle
export const Chip: React.FC = () => <div style={{position: 'absolute', left: 46, top: 238, height: 82, display: 'flex', alignItems: 'center',
  gap: 16, padding: '0 28px 0 7px', borderRadius: 42, background: '#0000006a', border: '1.5px solid #FFFFFF40'}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 68, height: 68, borderRadius: 34, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div style={{display: 'flex', flexDirection: 'column', lineHeight: 1.08}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#FFFFFF', letterSpacing: 0.3, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 23, color: '#FFFFFFd8', letterSpacing: 0.4, textShadow: '0 1px 3px #000000aa'}}>@quranbeat</div>
  </div>
</div>;

// A waqf sign standing after a space (the «ۖ» after «هُوَ», the «ۚ» after «لِفَضْلِهِۦ», as quran.com writes them) has no base
// letter, so the font floats it high and to the left of the word. Only its position is moved (CSS, inside the same span as
// its space, so it is shaped exactly as before) to sit above the end of the word, as in the mushaf. The characters are
// unchanged: the rendered string is P.ar code point for code point.
const WAQF = /( [ۖ-ۜ])$/;
export const WaqfText: React.FC<{ar: string}> = ({ar}) => {
  const m = ar.match(WAQF);
  if (!m) return <>{ar}</>;
  const jeem = m[1].endsWith('ۚ');   // the small jeem stands taller in Amiri Quran: brought lower, onto the word's end
  return <>{ar.slice(0, -m[1].length)}<span style={{position: 'relative', top: jeem ? '0.5em' : '0.26em', left: jeem ? '0.34em' : '0.24em'}}>{m[1]}</span></>;
};

// one phrase on screen while it is recited, in the window's dark sky: the surah label, the Uthmani text and its English
const PhraseText: React.FC<{i: number; f: number}> = ({i, f}) => {
  const [id, a, b] = PH[i], P = TX.phrases.find((p) => p.id === id)!;
  const eIn = ease((f - a) / 8), out = interpolate(f, [b - 6, b], [1, 0], clamp);
  const o = eIn * out, dy = (1 - eIn) * 12, bl = eIn < 1 ? (1 - eIn) * 5 : 0;
  return <div style={{position: 'absolute', left: 110, width: 860, top: 585, textAlign: 'center', opacity: o, transform: `translateY(${dy}px)`,
    filter: bl ? `blur(${bl}px)` : undefined}}>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 25, letterSpacing: 3, color: GOLD, textShadow: SHADOW}}>YUNUS {P.key}</div>
    <div dir="rtl" style={{marginTop: 2, fontFamily: AR, fontSize: 66, lineHeight: 1.9, color: '#FFF6E4', textShadow: SHADOW}}><WaqfText ar={P.ar}/>{P.last ? <span style={{fontSize: 58, marginRight: 14}}>{TX.ayah.end}</span> : null}</div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 38, lineHeight: 1.26, color: '#F3EADA', textShadow: SHADOW, marginTop: 26}}>{P.en}</div>
  </div>;
};

export const HOOK: [string, string, string] = ['HAS HARM TOUCHED YOU?', 'JUST', 'LISTEN'];
export const END = {l1: 'NONE CAN REMOVE IT', l2: 'EXCEPT', box: 'HIM',
  quote: 'there is no remover of it except Him; and if He intends for you good, then there is no repeller of His bounty.',
  src: 'Yunus 10:107 · Sahih International'};

export const Harm: React.FC = () => {
  const f = useCurrentFrame();
  const hookO = interpolate(f, [HOOK_END - 6, HOOK_END], [1, 0], clamp);
  const R = REC_END_F;
  const e = ease((f - R - 2) / 9), eQ = ease((f - R - 14) / 9), eRef = ease((f - R - 20) / 9), ePill = ease((f - R - 28) / 9);
  const dim = interpolate(f, [R - 4, R + 10], [0, 0.45], clamp);
  const pi = PH.findIndex(([, a, b]) => f >= a - 1 && f < b);
  return <AbsoluteFill style={{background: '#07090f', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <Picture f={f}/>
    <Finish f={f}/>
    {/* a soft dark pool in the sky behind the text */}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 52% 17% at 50% 34%, #000000a0 0%, #00000060 55%, #00000000 100%)'}}/>
    {dim > 0 ? <AbsoluteFill style={{background: '#000', opacity: dim}}/> : null}
    <Chip/>
    {f < HOOK_END ? <div style={{position: 'absolute', left: 60, width: 960, top: 340, textAlign: 'center', opacity: hookO}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 58, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[0]}</div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 10}}>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 58, letterSpacing: '0.02em', color: '#FFF6E4', whiteSpace: 'nowrap', textShadow: SHADOW}}>{HOOK[1]}</span>
        <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 58, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
          background: GOLD, padding: '0 22px 6px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{HOOK[2]}</span>
      </div>
    </div> : null}
    {pi >= 0 ? <PhraseText i={pi} f={f}/> : null}
    {f >= R ? <>
      <div style={{position: 'absolute', left: 60, width: 960, top: 360, textAlign: 'center', opacity: e, transform: `translateY(${(1 - e) * 16}px)`,
        filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 72, lineHeight: 1.1, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l1}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 12}}>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 72, letterSpacing: '0.03em', color: '#FFF3D6', textShadow: SHADOW, whiteSpace: 'nowrap'}}>{END.l2}</span>
          <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 72, letterSpacing: '0.03em', color: '#1A1007', whiteSpace: 'nowrap',
            background: GOLD, padding: '0 24px 6px', borderRadius: 10, boxShadow: '0 4px 16px #000000a0'}}>{END.box}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 120, width: 840, top: 572, textAlign: 'center', opacity: eQ}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 34, lineHeight: 1.26, color: GOLD, textShadow: SHADOW}}>“…{END.quote}”</div>
      </div>
      <div style={{position: 'absolute', left: 90, width: 900, top: 716, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 25, letterSpacing: 0.8, color: '#F1E8D6', textShadow: '0 2px 6px #000000e0'}}>{END.src}</div>
      <div style={{position: 'absolute', left: 0, width: 1080, top: 766, display: 'flex', justifyContent: 'center', opacity: ePill,
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
