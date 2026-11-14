// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Ya Hayyu Ya Qayyum"
// (reference Dfplq8Oy8ZL by @narjisstoryteller, 10.13 s, job dfe321795a86) rebuilt in knitted yarn. Same audio, unchanged
// (the narrator says the dua «يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ» 0.22-3.08 s, then its Urdu meaning and plea 3.42-9.90 s over a soft
// pad) and the same lines on screen: the Arabic on top, the Urdu under it, a lamp on a table below.
// Knitted: a crocheted still life (GPT Image 2): a saffron-and-copper crochet fanoos lantern with eight-pointed-star windows,
// a crocheted plant in a jute basket and a lace doily on a terracotta knitted cloth, against a deep teal knitted wall.
// The reference's fairy figurine is left out on purpose: no figures, only objects and light.
// Over the reference: frame 0 opens on the reference caption's own hook ("Jab kuch samajh na aaye… bas yahi keh do") in a
// dark room; on the first «يَا» the lantern lights, a wave of warm light runs out over the knitted room and the lantern's star
// windows throw star-shaped light on the wall (the wow). Every Arabic and Urdu word fills in gold stitch by stitch on the
// frame it is said (Whisper word times, snapped to the audio's pauses), with the Roman Urdu under each line and the English
// meaning under the Arabic. "Zinda, hamesha rehne wale" (Ever-Living) makes crochet flowers bloom on the plant one by one;
// "teri rehmat" (Your mercy) swells the lantern light and sends warm motes drifting down; on "durust kar de" (set it right)
// the tangled knot of yarn at the end of the plea spins out into one neat ball; on "Ameen" everything turns gold.
// Text: texts.json, checked by text.py (Arabic cut out of sunnah.com Tirmidhi 3524, Urdu checked against Whisper).
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {Burst, Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import TX from './texts.json';

export const FPS = 30, FRAMES = 304;          // 10.13 s, the reference length
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const UR = 'Nastaliq, serif';
const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));

// ---- the reference clock (seconds; Whisper medium word times snapped to the audio's pauses) ----------------------------
export const AR_T: [number, number][] = [[0.22, 0.46], [0.57, 0.92], [0.96, 1.14], [1.24, 1.78], [1.84, 2.52], [2.52, 3.08]];
export const UR_T: [number, number][][] = [
  [[3.42, 3.66], [3.66, 4.14], [4.14, 4.30], [4.30, 4.76], [4.76, 5.08], [5.08, 5.36]],      // اے زندہ اور ہمیشہ رہنے والے،
  [[5.46, 5.72], [5.72, 6.08], [6.08, 6.22], [6.22, 6.64], [6.64, 7.02], [7.02, 7.10]],      // تیری رحمت سے فریاد کرتا ہوں،
  [[7.48, 7.82], [7.82, 8.18], [8.18, 8.40], [8.40, 8.78], [8.78, 9.00], [9.00, 9.10]],      // میرے سارے کام درست کر دے،
];
export const AMEEN: [number, number] = [9.44, 9.90];
const IGNITE = AR_T[0][0];                     // the lantern lights on the first «يَا»
const MERCY = UR_T[1][1][0];                   // رحمت
const DURUST = UR_T[2][3][0];                  // درست
const HOOK_OUT = 3.18;

// ---- layout (1080 x 1920; all text between y 222 and 1030, nothing right of x 950 below y 1000) -------------------------
export const DY = 210;                         // the scene's offset in bg.jpg (prep.py)
export const L = {x: 325, y: 1282 + DY};       // the lantern's light (centre of the star windows)
export const PAL = {saffron: '#F4B53F', teal: '#2C8C8A', terracotta: '#C8613F', blush: '#F2A7B5', cream: '#FBEFD8', sage: '#9DBB86', gold: '#F6C552'};

export const goldFill = (t: number, speed = 0.45): React.CSSProperties => {
  const p = ((t * speed) % 1) * 300 - 100;
  return {backgroundImage: `linear-gradient(100deg, #C9862A 0%, #F4BE4E ${p - 30}%, #FFF3C4 ${p}%, #F4BE4E ${p + 30}%, #C9862A 100%)`,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};
};

/** the yarn texture of asmaknit's #yarn filter with a gentler displacement, so harakat and Nastaliq dots stay sharp */
const yarnFilter = (id: string, scale: number) => <filter key={id} id={id} x="-8%" y="-30%" width="116%" height="160%" colorInterpolationFilters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.85 0.06" numOctaves={2} seed={7} result="fib"/>
  <feDisplacementMap in="SourceGraphic" in2="fib" scale={scale} xChannelSelector="R" yChannelSelector="G" result="fuzzy"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.22 1.5" numOctaves={1} seed={3} result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.04  1.7 0 0 0 -0.78" result="grainA"/>
  <feComposite in="grainA" in2="fuzzy" operator="in" result="grainIn"/>
  <feGaussianBlur in="fuzzy" stdDeviation={1.6} result="soft"/>
  <feSpecularLighting in="soft" surfaceScale={4} specularConstant={0.8} specularExponent={16} lightingColor="#FFF4DC" result="spec">
    <feDistantLight azimuth={235} elevation={48}/>
  </feSpecularLighting>
  <feComposite in="spec" in2="fuzzy" operator="in" result="specIn"/>
  <feMerge><feMergeNode in="fuzzy"/><feMergeNode in="grainIn"/><feMergeNode in="specIn"/></feMerge>
</filter>;
export const YarnLite: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>{[yarnFilter('yarnA', 2.6), yarnFilter('yarnU', 1.4)]}</defs></svg>;

/** a word that is stitched in from its right edge (Arabic script) over its spoken span */
const Word: React.FC<{w: string; t: number; a: number; b: number; font: string; size: number; lit: React.CSSProperties; ghost: React.CSSProperties;
  lh: number; gap: number; glow: string; done?: number; yarn?: string}> = ({w, t, a, b, font, size, lit, ghost, lh, gap, glow, done = 0, yarn = 'yarnA'}) => {
  const p = ease((t - a) / Math.max(0.2, b - a));
  const pop = pulse(t - a, 0.42);
  const X = 100 - 100 * p;
  // the lit copy gets a padded box: background-clip:text only paints inside the box, and Arabic overhangs it (a final meem's
  // tail, harakat, Nastaliq descenders); the padding keeps every glyph inside while the text stays exactly on the ghost
  const pv = size * 0.7, ph = size * 0.45;
  return <span style={{position: 'relative', display: 'inline-block', marginLeft: gap, fontFamily: font, fontSize: size, lineHeight: lh, transform: `translateY(${-6 * pop}px)`}}>
    <span style={{...ghost}}>{w}</span>
    <span style={{position: 'absolute', left: -ph, right: -ph, top: -pv, bottom: -pv, padding: `${pv}px ${ph}px`, clipPath: `inset(0 0 0 ${X}%)`, ...lit,
      filter: `url(#${yarn}) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 10px 14px #00000088) drop-shadow(0 0 ${10 + 22 * pop + 16 * done}px ${glow})`}}>{w}</span>
  </span>;
};

// ---- the dua: two Arabic lines, the English meaning under them ---------------------------------------------------------
const Dua: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const W = TX.words;
  const ghost: React.CSSProperties = {color: '#EADBBB', opacity: 0.5, textShadow: '0 3px 4px #00000099'};
  const lit = (k: number): React.CSSProperties => ({...goldFill(t + k * 0.12), WebkitTextStroke: '1.4px #E3AC45'});
  const line = (ks: number[], size: number, top: number) => <div dir="rtl" style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', whiteSpace: 'nowrap'}}>
    {ks.map((k, n) => <Word key={k} w={W[k]} t={t} a={AR_T[k][0]} b={AR_T[k][1]} font={AR} size={size} lh={1.55} gap={n === ks.length - 1 ? 0 : size * 0.26}
      lit={lit(k)} ghost={ghost} glow={`#FFC85A${endG > 0 ? 'cc' : '77'}`} done={endG}/>)}
  </div>;
  const en = ease((t - 1.15) / 0.5);
  return <>
    {line([0, 1, 2, 3], 114, 264)}
    {line([4, 5], 96, 440)}
    <div style={{position: 'absolute', top: 650, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 31, lineHeight: 1.2,
      color: '#F6E7C8', opacity: en, transform: `translateY(${(1 - en) * 10}px)`, textShadow: '0 2px 4px #000000cc'}}>
      O Ever-Living, O Sustainer of all, by Your mercy I seek help</div>
  </>;
};

// ---- the frame-0 hook (the reference caption's own words), giving way to the Urdu at 3.2 s ------------------------------
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - ease((t - HOOK_OUT) / 0.3);
  if (o <= 0) return null;
  const l2 = 1;
  return <div style={{position: 'absolute', top: 744, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${-14 * (1 - o)}px)`,
    filter: o < 1 ? `blur(${(1 - o) * 4}px)` : undefined}}>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, lineHeight: 1.12, color: '#FBEFD8', textShadow: '0 3px 5px #000000cc'}}>Jab kuch samajh na aaye…</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, lineHeight: 1.12, opacity: l2, ...goldFill(t), WebkitTextStroke: '1px #E3AC45',
      filter: 'drop-shadow(0 3px 4px #000000cc)'}}>bas yahi keh do</div>
  </div>;
};

// ---- the Urdu: three lines stitched word by word, Roman Urdu under each; a knot at the end becomes a neat ball ------------
const Knot: React.FC<{t: number}> = ({t}) => {
  const d = t - DURUST;
  const spin = d < 0 ? 6 * Math.sin(t * 3.1) : 6 * Math.sin(DURUST * 3.1) + 540 * inout(d / 0.55);
  const knotS = d < 0 ? 1 + 0.04 * Math.sin(t * 5) : 1 - inout(d / 0.5);
  const ball = springy(d - 0.28, 1.25);
  const amen = pulse(t - AMEEN[0], 0.6);
  return <span style={{position: 'relative', display: 'inline-block', width: 112, height: 112, marginRight: 4, verticalAlign: 'middle'}}>
    {knotS > 0.01 ? <Img src={staticFile('parts/tangle.png')} style={{position: 'absolute', inset: 0, width: 112, height: 112,
      transform: `rotate(${spin}deg) scale(${knotS})`, filter: 'drop-shadow(0 6px 6px #000000aa)'}}/> : null}
    {ball > 0 ? <Img src={staticFile('parts/ball_saffron.png')} style={{position: 'absolute', left: 6, top: 9, width: 100, height: 97,
      transform: `scale(${ball * (1 + 0.18 * amen)}) rotate(${(1 - c01(ball)) * -90}deg)`,
      filter: `drop-shadow(0 6px 6px #000000aa) drop-shadow(0 0 ${8 + 26 * pulse(d - 0.28, 0.5) + 20 * amen}px #FFC85A)`}}/> : null}
  </span>;
};

const Urdu: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const on = ease((t - (HOOK_OUT + 0.06)) / 0.3);
  if (on <= 0) return null;
  const ghost: React.CSSProperties = {color: '#F3E6CC', opacity: 0.42, textShadow: '0 2px 4px #000000aa'};
  const lit = (k: number): React.CSSProperties => (endG > 0
    ? {...goldFill(t + k * 0.1), WebkitTextStroke: '0.8px #E3AC45'}
    : {color: '#FFF4DE', textShadow: '0 2px 3px #00000099'});
  const ROW = 110, TOP = 692;
  return <div style={{opacity: on}}>
    {TX.ur.map((s, li) => {
      const words = s.split(' ');
      const start = UR_T[li][0][0];
      const rIn = ease((t - start) / 0.35), cur = t >= start && (li === 2 || t < UR_T[li + 1][0][0]);
      return <div key={li} style={{position: 'absolute', top: TOP + li * ROW, left: 0, right: 0, textAlign: 'center'}}>
        <div dir="rtl" style={{whiteSpace: 'nowrap', height: 86, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          {words.map((w, k) => <Word key={k} w={w} t={t} a={UR_T[li][k][0]} b={UR_T[li][k][1]} font={UR} size={50} lh={1.7} gap={k === words.length - 1 && li < 2 ? 0 : 9} yarn="yarnU"
            lit={lit(k)} ghost={ghost} glow={endG > 0 ? '#FFC85Acc' : '#F4B53F66'} done={endG}/>)}
          {li === 2 ? <>
            <Word w={TX.ameen} t={t} a={AMEEN[0]} b={AMEEN[1]} font={UR} size={50 * (1 + 0.1 * ease((t - AMEEN[0]) / 0.4))} lh={1.7} gap={24} yarn="yarnU"
              lit={{...goldFill(t + 0.3), WebkitTextStroke: '0.8px #E3AC45'}} ghost={ghost} glow="#FFC85Aee" done={endG}/>
            <Knot t={t}/>
          </> : null}
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 27, lineHeight: 1.1, marginTop: -2, color: cur || endG > 0 ? '#F7D9A0' : '#E9D8B8',
          opacity: (0.35 + 0.65 * rIn) * (cur || endG > 0 ? 1 : 0.8), textShadow: '0 2px 4px #000000cc'}}>
          {TX.roman[li]}{li === 2 ? <span style={{opacity: 0.35 + 0.65 * ease((t - AMEEN[0]) / 0.3), color: endG > 0 ? '#FFD772' : undefined}}> {TX.romanAmeen}</span> : null}
        </div>
      </div>;
    })}
  </div>;
};

// ---- light: the dark room before the lantern lights, the light wave, the lantern glow, star light on the wall ----------
const R_MAX = 2300;
export const lightR = (t: number) => (t < IGNITE ? 0 : R_MAX * ease((t - IGNITE) / 1.15));
const flick = (t: number, k = 0) => 0.86 + 0.08 * Math.sin(t * 9.3 + k) * Math.sin(t * 3.7 + 2 * k) + 0.06 * Math.sin(t * 17 + k * 3);

const Dark: React.FC<{t: number}> = ({t}) => {
  const R = lightR(t);
  if (R >= R_MAX - 1) return null;
  const edge = 160;
  const mask = `radial-gradient(circle at ${L.x}px ${L.y}px, transparent ${Math.max(0, R - edge)}px, black ${R}px)`;
  return <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask}}>
    <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, filter: 'brightness(0.24) saturate(0.45) hue-rotate(-8deg)'}}/>
    <AbsoluteFill style={{background: '#06142A', opacity: 0.35, mixBlendMode: 'multiply'}}/>
  </div>;
};

const Wave: React.FC<{t: number}> = ({t}) => {
  const R = lightR(t), d = t - IGNITE;
  if (d < 0 || d > 1.4) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    <circle cx={L.x} cy={L.y} r={Math.max(1, R - 70)} fill="none" stroke="#FFC978" strokeWidth={70 + 60 * (1 - d)} opacity={0.5 * (1 - c01(d / 1.3))} filter="url(#soft14)"/>
    <circle cx={L.x} cy={L.y} r={Math.max(1, R - 80)} fill="none" stroke="#FFF1C9" strokeWidth={6} opacity={0.6 * (1 - c01(d / 1.0))} filter="url(#soft6)"
      strokeDasharray="22 14"/>
  </svg>;
};

export const LanternGlow: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const d = t - IGNITE;
  const ember = 0.22 + 0.06 * Math.sin(t * 11);
  const lit = d < 0 ? 0 : ease(d / 0.25);
  const flash = pulse(d, 0.55);
  const mercy = pulse(t - MERCY, 1.2);
  const o = (ember * (1 - lit) + lit * (0.55 + 0.18 * mercy + 0.15 * endG)) * flick(t);
  return <>
    <div style={{position: 'absolute', left: L.x - 420, top: L.y - 420, width: 840, height: 840, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: Math.min(1, o + 0.55 * flash), background: 'radial-gradient(closest-side, #FFD996cc 0%, #FFB45A55 35%, #FF8A2A00 100%)'}}/>
    <div style={{position: 'absolute', left: L.x - 150, top: L.y - 170, width: 300, height: 340, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: Math.min(1, (0.35 + 0.25 * mercy + 0.2 * endG) * lit * flick(t, 2) + 0.7 * flash + 0.5 * ember * (1 - lit)),
      background: 'radial-gradient(closest-side, #FFF6D8 0%, #FFD27Aaa 45%, #FFB45A00 100%)'}}/>
  </>;
};

// eight-pointed stars of light thrown by the lantern's windows onto the knitted wall
const STARS = (() => {
  const out: {x: number; y: number; s: number; r: number; d: number}[] = [];
  for (let k = 0; k < 60 && out.length < 24; k++) {
    const a = -Math.PI * (0.08 + 0.9 * random(`sa${k}`)), dist = 300 + 620 * random(`sd${k}`);
    const x = L.x + Math.cos(a) * dist * 1.25, y = L.y + Math.sin(a) * dist;
    if (x < 30 || x > 1050 || y < 250 || y > 1090 + DY) continue;
    if (x > 470 && y > 870 + DY) continue;                                 // not on the plant
    out.push({x, y, s: 26 + 46 * random(`ss${k}`), r: 360 * random(`sr${k}`), d: Math.hypot(x - L.x, y - L.y)});
  }
  return out;
})();
const star8 = (s: number) => {
  const p: string[] = [];
  for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? s * 0.5 : s; p.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`); }
  return p.join(' ');
};
export const StarLight: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const R = lightR(t);
  if (R <= 0) return null;
  const turn = 5 * Math.sin((t - IGNITE) * 0.5);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    <g transform={`rotate(${turn} ${L.x} ${L.y})`} filter="url(#soft2)">
      {STARS.map((s, k) => {
        const on = c01((R - s.d) / 180);
        if (on <= 0) return null;
        const o = on * (0.2 + 0.1 * Math.sin(t * 2.2 + k)) * flick(t, k) * (1 + 0.6 * pulse(t - MERCY, 1.2) + 0.5 * endG) * (1 + 1.6 * pulse(t - IGNITE - s.d / 2000, 0.5));
        return <polygon key={k} points={star8(s.s * (0.85 + 0.15 * on))} transform={`translate(${s.x} ${s.y}) rotate(${s.r + t * 4})`} fill="#FFD48A" opacity={Math.min(0.75, o)}/>;
      })}
    </g>
  </svg>;
};

/** "teri rehmat": warm motes drift down through the room */
const Mercy: React.FC<{t: number}> = ({t}) => {
  const d = t - MERCY + 0.3;
  if (d < 0) return null;
  return <>{Array.from({length: 34}, (_, k) => {
    const t0 = 1.6 * random(`mt${k}`), u = d - t0;
    if (u < 0) return null;
    const x = 40 + 1000 * random(`mx${k}`) + 30 * Math.sin(u * 1.3 + k), y = 220 + 260 * random(`my${k}`) + u * (70 + 50 * random(`mv${k}`));
    const s = 4 + 6 * random(`ms${k}`);
    const o = c01(u / 0.4) * (0.55 + 0.35 * Math.sin(t * 3 + k));
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7B0', opacity: o,
      boxShadow: `0 0 ${3 * s}px ${s * 0.8}px #F6C75A66`}}/>;
  })}</>;
};

/** "zinda ... hamesha rehne wale": crochet flowers bloom on the plant, one per word */
export const PLANT_BLOOMS: [number, number, number, number][] = [   // x, y, size, bloom index
  [575, 1045 + DY, 70, 0], [712, 942 + DY, 62, 1], [870, 918 + DY, 66, 2], [640, 1178 + DY, 58, 3], [800, 1090 + DY, 60, 5], [930, 1210 + DY, 56, 4]];
export const Blooms: React.FC<{t: number; all?: boolean}> = ({t, all = false}) => <>{PLANT_BLOOMS.map(([x, y, s, b], k) => {
  const t0 = UR_T[0][Math.min(5, k)][0] + (k === 5 ? 0.12 : 0);
  const p = all ? 1 : springy(t - t0, 1.3);
  if (p <= 0) return null;
  return <Img key={k} src={staticFile(`parts/bloom${b}.png`)} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s,
    transform: `scale(${p}) rotate(${(1 - p) * -140 + 6 * Math.sin(t * 1.3 + k)}deg)`, filter: 'drop-shadow(0 5px 5px #000000aa)'}}/>;
})}</>;

export const HayyuKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const endG = ease((t - AMEEN[0]) / 0.45);
  // camera: starts close on the dark lantern, springs back as it lights, then a slow push
  const pull = t < IGNITE ? 0 : ease((t - IGNITE) / 1.2);
  const cam = 1.13 - 0.122 * pull + 0.025 * c01((t - 1.4) / 8.7) + 0.012 * endG;   // never under 1.008: no edge shows
  const sway = 0.6 * Math.sin(t * 0.7);
  return <AbsoluteFill style={{background: '#071C1E', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/>
    <YarnLite/>
    <Filters/>
    <AbsoluteFill style={{transform: `scale(${cam}) rotate(${sway * 0.15}deg)`, transformOrigin: `${L.x + 120}px ${L.y - 380}px`}}>
      <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      <StarLight t={t} endG={endG}/>
      <Blooms t={t}/>
      <LanternGlow t={t} endG={endG}/>
      <Dark t={t}/>
      <Wave t={t}/>
      {/* calm the wall behind the text */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 72% 30% at 50% 33%, #03141699 0%, #03141600 100%)'}}/>
      <Mercy t={t}/>
    </AbsoluteFill>
    <Burst t={t} t0={IGNITE + 0.04} x={L.x} y={L.y - 40} n={30} seed="ignite" power={1.1}
      cols={[PAL.saffron, PAL.blush, PAL.teal, PAL.cream, PAL.terracotta, PAL.sage, '#FFE9B0']}/>
    <Burst t={t} t0={AMEEN[0] + 0.02} x={L.x} y={L.y - 150} n={36} seed="ameen" power={1.25} size={1.05}
      cols={[PAL.gold, '#FFE9B0', PAL.saffron, PAL.blush, PAL.cream, PAL.teal]}/>

    <Handle top={222} endP={c01((t - AMEEN[0]) / 0.6)}/>
    <Dua t={t} endG={endG}/>
    <Hook t={t}/>
    <Urdu t={t} endG={endG}/>
  </AbsoluteFill>;
};
