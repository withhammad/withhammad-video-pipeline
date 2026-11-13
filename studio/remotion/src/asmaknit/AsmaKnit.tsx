// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from our accounts): the reference chant of Asma-ul-Husna
// (shabbir_hussain_sahib, DfZCSsTALA2, 36.3 s) rebuilt as a knitted night: a crochet shrine with a golden yarn dome (GPT Image 2),
// each Name stitched in by a needle in puffy cream wool with the reference's Urdu meaning, every "Allah" in gold yarn that lights
// the dome, and a knitted tasbih that gains one gold bead per Name. Item starts measured frame by frame from the reference.
// Job 6503bc107f3a.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, DURATION = 36.3;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const back = (x: number) => { const c = 1.9, u = Math.min(1, Math.max(0, x)) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const AR = '"DecoType Naskh", "Al Nile", serif', UR = 'Nastaliq, serif';
const ALLAH = 'اللهُ';

type Item = {k: 'n' | 'a' | 'end'; s: number; e: number; ar?: string; ur?: string; i?: number};
const NAMES: [number, string, string][] = [
  [0.03, 'الرَّحْمٰنُ', 'بڑا مہربان'], [1.70, 'الرَّحِيْمُ', 'نہایت رحم کرنے والا'], [3.13, 'الْمَلِكُ', 'بادشاہ'],
  [4.73, 'الْقُدُّوْسُ', 'نہایت پاکیزہ'], [6.03, 'السَّلَامُ', 'سلامتی والا'], [7.77, 'الْمُؤْمِنُ', 'امن دینے والا'],
  [9.23, 'الْمُهَيْمِنُ', 'محافظ، نگہبان'], [10.63, 'الْعَزِيْزُ', 'عزت دینے والا'], [12.30, 'الْجَبَّارُ', 'جبر کرنے والا'],
  [13.53, 'الْمُتَكَبِّرُ', 'بڑائی اور بزرگی والا'], [15.07, 'الْخَالِقُ', 'پیدا کرنے والا'], [16.50, 'الْبَارِئُ', 'درست بنانے والا'],
  [18.43, 'الْمُصَوِّرُ', 'صورت دینے والا'], [21.20, 'الْغَفَّارُ', 'بخشنے والا'], [22.97, 'الْقَهَّارُ', 'غالب آنے والا'],
  [24.47, 'الْوَهَّابُ', 'بے لوث بخشش دینے والا'], [25.93, 'الرَّزَّاقُ', 'رزق دینے والا'], [27.40, 'الْفَتَّاحُ', 'مشکلوں کو حل کرنے والا'],
];
const ALLAHS = [0.90, 2.33, 3.83, 5.50, 6.87, 8.37, 9.90, 11.53, 12.93, 14.53, 15.67, 17.13, 22.03, 23.60, 25.23, 26.67];
const END = 31.07;
const ITEMS: Item[] = (() => {
  const raw: Item[] = [...NAMES.map(([s, ar, ur], i) => ({k: 'n' as const, s, e: 0, ar, ur, i})), ...ALLAHS.map(s => ({k: 'a' as const, s, e: 0})),
    {k: 'end', s: END, e: DURATION + 1}];
  raw.sort((x, y) => x.s - y.s);
  raw.forEach((it, j) => { if (it.k !== 'end') it.e = raw[j + 1].s; });
  raw.forEach(it => { if (it.k === 'a' && it.s === 17.13) it.e = 17.93; if (it.k === 'n' && it.i === 17) it.e = 30.53; });
  return raw;
})();
// camera whips in the reference's two hard transitions
const WHIPS: [number, number][] = [[17.93, 18.43], [30.53, 31.07]];

const LIGHTS: [number, number, number][] = [[94, 54, 1], [270, 58, 0.8], [411, 30, 1], [524, 64, 0.9], [646, 26, 1], [752, 70, 0.9], [872, 30, 1], [985, 68, 0.9],
  [22, 403, 0.8], [66, 418, 0.8], [1058, 396, 0.8], [40, 858, 0.7], [76, 868, 0.7], [1062, 850, 0.7],
  [395, 1504, 0.7], [698, 1504, 0.7], [125, 1543, 0.7], [183, 1547, 0.6], [872, 1538, 0.7], [957, 1544, 0.6],
  [131, 1722, 0.6], [287, 1722, 0.6], [503, 1690, 0.7], [579, 1700, 0.7], [793, 1722, 0.6], [949, 1721, 0.6]];

// gold metallic yarn with a light sweep
const gold = (t: number, speed = 0.5): React.CSSProperties => {
  const p = ((t * speed) % 1) * 300 - 100;
  return {backgroundImage: `linear-gradient(100deg, #C48A26 0%, #F2C04E ${p - 28}%, #FFF4C8 ${p}%, #F2C04E ${p + 28}%, #C48A26 100%)`,
    WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextStroke: '4px #E7B040'};
};
const PUFF = 'url(#yarn) drop-shadow(0 3px 2px #2A0508cc) drop-shadow(0 12px 18px #00000099)';

const YarnDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="yarn" x="-8%" y="-30%" width="116%" height="160%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.85 0.06" numOctaves={2} seed={7} result="fib"/>
      <feDisplacementMap in="SourceGraphic" in2="fib" scale={5} xChannelSelector="R" yChannelSelector="G" result="fuzzy"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.22 1.5" numOctaves={1} seed={3} result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.04  1.7 0 0 0 -0.78" result="grainA"/>
      <feComposite in="grainA" in2="fuzzy" operator="in" result="grainIn"/>
      <feGaussianBlur in="fuzzy" stdDeviation={2.4} result="soft"/>
      <feSpecularLighting in="soft" surfaceScale={5} specularConstant={0.85} specularExponent={16} lightingColor="#FFF4DC" result="spec">
        <feDistantLight azimuth={235} elevation={48}/>
      </feSpecularLighting>
      <feComposite in="spec" in2="fuzzy" operator="in" result="specIn"/>
      <feMerge><feMergeNode in="fuzzy"/><feMergeNode in="grainIn"/><feMergeNode in="specIn"/></feMerge>
    </filter>
  </defs>
</svg>;

// a silver needle trailing a gold thread, its tip at (x, y)
const Needle: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => <svg width={300} height={120} viewBox="0 0 300 120"
  style={{position: 'absolute', left: x - 8, top: y - 60, opacity: o, overflow: 'visible', filter: 'drop-shadow(0 4px 4px #00000088)'}}>
  <defs><linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="0.5" stopColor="#C9CED6"/><stop offset="1" stopColor="#6E7580"/></linearGradient></defs>
  <path d="M150 52 C 200 30, 240 90, 300 60" stroke="#F2C55C" strokeWidth={4} fill="none" strokeLinecap="round"/>
  <g transform="rotate(-14 8 60)"><path d="M8 60 L150 54 Q160 60 150 66 Z" fill="url(#steel)"/>
    <ellipse cx={143} cy={60} rx={6} ry={2} fill="#3A2A2A"/></g>
</svg>;

// knitted tasbih: one bead lights gold per Name
const Tasbih: React.FC<{t: number; lit: number; cur: number; all: number}> = ({t, lit, cur, all}) => {
  const n = 18, pts = Array.from({length: n}, (_, j) => { const u = j / (n - 1), x = 170 + u * 740, v = (x - 540) / 370; return [x, 968 + 46 * (1 - v * v)]; });
  return <>
    <svg width={1080} height={1100} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={`M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')}`} stroke="#E3B65A" strokeWidth={2.5} fill="none" opacity={0.7}/>
    </svg>
    {pts.map(([x, y], j) => {
      const on = j < lit, isCur = j === cur, pop = isCur ? 1 + 0.35 * Math.max(0, 1 - (t - NAMES[j][0]) / 0.35) : 1;
      const wave = all > 0 ? 0.5 + 0.5 * Math.sin(t * 6 - j * 0.6) : 0, r = 15 * pop;
      return <div key={j} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
        background: on ? 'radial-gradient(circle at 35% 30%, #FFF4C8, #F0BE4E 45%, #9A6414 100%)' : 'radial-gradient(circle at 35% 30%, #FBF1DE, #D9C29A 55%, #8F7652 100%)',
        boxShadow: on ? `0 0 ${10 + 18 * (isCur ? 1 : wave * all)}px ${3 + 4 * wave * all}px #FFCF6Aaa, 0 3px 4px #0000008a` : '0 3px 4px #0000008a',
        filter: 'url(#yarn)'}}/>;
    })}
  </>;
};

const Sparks: React.FC<{f: number}> = ({f}) => <>{Array.from({length: 26}, (_, k) => {
  const life = 220 + random(`sl${k}`) * 160, ph = (f + random(`sp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`sp${k}`) * life) / life);
  const x = 140 + random(`sx${k}-${gen}`) * 800 + Math.sin(u * 5 + k) * 30, y = 1150 - u * 1000, s = 3 + random(`ss${k}`) * 5;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7A6',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A88`, opacity: Math.sin(Math.PI * u) * (0.45 + 0.4 * Math.sin(f / 7 + k))}}/>;
})}</>;

export const AsmaKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const it = ITEMS.reduce<Item | null>((cur, x) => (t >= x.s ? x : cur), null);
  // dome lights up on every Allah, strongest on the final kalima
  const lastA = ALLAHS.reduce((k, s) => (t >= s ? s : k), -9);
  const domePulse = Math.max(0, 1 - (t - lastA) / 0.9) * (t - lastA >= 0 ? 1 : 0) + (t >= END ? 0.7 + 0.3 * Math.sin((t - END) * 2.2) : 0);
  const whip = WHIPS.reduce((m, [a, b]) => Math.max(m, t >= a && t <= b ? Math.sin(Math.PI * (t - a) / (b - a)) : 0), 0);
  const push = 1 + 0.05 * (t / DURATION) + (t >= END ? -0.03 * ease((t - END) / 4) : 0);
  const nameIdx = NAMES.reduce((k, [s], j) => (t >= s ? j : k), -1);
  const fade = interpolate(t, [DURATION - 0.5, DURATION], [0, 1], clamp);

  let block: React.ReactNode = null, needle: React.ReactNode = null, burst: React.ReactNode = null;
  if (it && it.k !== 'end' && t < it.e) {
    const d = t - it.s, out = interpolate(t, [it.e - 0.1, it.e], [1, 0], clamp), long = it.e - it.s > 2;
    const drift = long ? 1 + 0.05 * (d / (it.e - it.s)) : 1;
    if (it.k === 'n') {
      const rv = ease(d / 0.34), X = rv >= 1 ? 0 : 84 - 68 * rv;
      const mIn = ease((d - 0.16) / 0.25);
      block = <div style={{position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', opacity: out,
        transform: `scale(${(1.05 - 0.05 * ease(d / 0.4)) * drift * (0.94 + 0.06 * out)})`, filter: `blur(${(1 - out) * 6}px)`}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 268, lineHeight: 1.45, color: '#FBF1DC', WebkitTextStroke: '5px #FBF1DC', clipPath: `inset(-40% 0 -40% ${X}%)`, filter: PUFF}}>{it.ar}</div>
        <div dir="rtl" style={{fontFamily: UR, fontWeight: 700, fontSize: 62, lineHeight: 1.8, marginTop: -40, color: '#F6D99B', opacity: mIn,
          transform: `translateY(${(1 - mIn) * 18}px)`, textShadow: '0 2px 2px #2A0508, 0 0 16px #2A0508cc'}}>{it.ur}</div>
      </div>;
      if (rv < 1) needle = <Needle x={1080 * X / 100} y={640} o={interpolate(d, [0, 0.05, 0.28, 0.34], [0, 1, 1, 0], clamp)}/>;
    } else {
      const p = back(d / 0.32), o = Math.min(1, d / 0.08) * out;
      block = <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: o, transform: `scale(${(1.3 - 0.3 * p) * (0.94 + 0.06 * out)})`,
        filter: `blur(${(1 - out) * 6}px)`}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 370, lineHeight: 1.45, ...gold(t), filter: `${PUFF} drop-shadow(0 0 ${20 + 26 * Math.max(0, 1 - d / 0.5)}px #FFC64A99)`}}>{ALLAH}</div>
      </div>;
      const r = ease(d / 0.55) * 300;
      burst = <>{Array.from({length: 14}, (_, j) => { const a = (j / 14) * Math.PI * 2 + 0.2;
        return <div key={j} style={{position: 'absolute', left: 540 + Math.cos(a) * r - 6, top: 650 + Math.sin(a) * r * 0.7 - 6, width: 12, height: 12, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FFFBE8, #FFD670 55%, #E0A030)', boxShadow: '0 0 14px 5px #FFC64A99', opacity: Math.max(0, 1 - d / 0.55)}}/>; })}</>;
    }
  }
  if (t >= END) {
    const d = t - END, rv = ease(d / 0.9), X = rv >= 1 ? 0 : 92 - 84 * rv, mIn = ease((d - 0.7) / 0.6);
    block = <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', transform: `scale(${1.04 - 0.04 * ease(d / 1.2)})`}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 192, lineHeight: 1.6, clipPath: `inset(-40% 0 -40% ${X}%)`, ...gold(t, 0.35),
        filter: `${PUFF} drop-shadow(0 0 30px #FFC64A88)`}}>لَا إِلٰهَ إِلَّا اللهُ</div>
      <div dir="rtl" style={{fontFamily: UR, fontWeight: 700, fontSize: 58, lineHeight: 1.8, marginTop: -14, color: '#F6D99B', opacity: mIn,
        transform: `translateY(${(1 - mIn) * 18}px)`, textShadow: '0 2px 2px #2A0508, 0 0 16px #2A0508cc'}}>اللہ کے سوا کوئی معبود نہیں</div>
    </div>;
    if (rv < 1) needle = <Needle x={1080 * X / 100} y={640} o={interpolate(d, [0, 0.08, 0.8, 0.9], [0, 1, 1, 0], clamp)}/>;
  }

  return <AbsoluteFill style={{background: '#1A0306', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <YarnDefs/>
    <AbsoluteFill style={{transform: `scale(${push * (1 + 0.16 * whip)})`, transformOrigin: '50% 62%', filter: whip > 0 ? `blur(${whip * 7}px) brightness(${1 + 0.35 * whip})` : undefined}}>
      <Img src={staticFile('scene.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      {/* golden glow over the dome on every Allah */}
      <div style={{position: 'absolute', left: 540 - 420, top: 1320 - 360, width: 840, height: 720, borderRadius: '50%', mixBlendMode: 'screen',
        background: 'radial-gradient(closest-side, #FFD67A 0%, #FFB83A66 40%, #FF9A2A00 100%)', opacity: 0.18 + 0.55 * Math.min(1, domePulse)}}/>
      {/* fairy lights twinkle */}
      {LIGHTS.map(([x, y, w], k) => { const tw = 0.55 + 0.45 * Math.sin(t * (2.2 + random(`lw${k}`) * 2.5) + k * 1.7);
        const s = 46 * w; return <div key={k} style={{position: 'absolute', left: x - s, top: y - s, width: 2 * s, height: 2 * s, borderRadius: '50%', mixBlendMode: 'screen',
          background: 'radial-gradient(closest-side, #FFE3A0, #FFB54A55 45%, #FF9A2A00)', opacity: tw * (0.75 + 0.25 * Math.min(1, domePulse))}}/>; })}
      {/* soft vignette keeps the text area calm */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 36% at 50% 34%, #12010355 0%, #12010300 100%)'}}/>
    </AbsoluteFill>
    <Sparks f={f}/>
    <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{fontFamily: 'KnitSerif, serif', fontStyle: 'italic', fontSize: 36, color: '#F6E3BC', letterSpacing: 1, paddingBottom: 6,
        borderBottom: '3px dashed #D9A847', textShadow: '0 2px 3px #000000aa'}}>@heal.ingthroughquran</span>
    </div>
    <Tasbih t={t} lit={nameIdx + 1} cur={nameIdx} all={t >= END ? ease((t - END) / 1.2) : 0}/>
    {burst}
    {block}
    {needle}
    <AbsoluteFill style={{background: '#000', opacity: fade}}/>
  </AbsoluteFill>;
};
