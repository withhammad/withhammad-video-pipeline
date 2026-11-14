// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "وقِّف وسبِّح" (reference
// DfncZKDIZge by Dr-Rafat Khanfar, @drkhanfar, 79.5 s, job 808c92b7fc32) rebuilt in knitted yarn. Same audio (gain + limiter
// only), same structure and clock, measured frame by frame: intro 0-2.67 s, count k on frame 90 + 18 (k - 1) (every 0.6 s,
// on the audio's tick), a line at every tenth count and at 55, 100 on 62.4 s, the light burst and "1000" at 63.03 s, the
// hadith (Sahih Muslim 2698) from 66.43 s, the comment card from 73.8 s and the fade at 78.93 s.
// Knitted: a felted-wool tasbih of 100 beads lying on a plum knitted blanket; every count dyes the next undyed bead in its
// colour, ten colours round the ring so the tasbih ends as a full rainbow; a crochet medallion holds the counter (its yarn
// takes the colour of the beads being counted); a knitted scroll ("your record") gains a gold stitch per count, glows as it
// fills, and at the end unrolls to carry the hadith. All Arabic comes from text.ts (built and checked by text.py).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import * as T from './text';

export const FPS = 30, DURATION = 79.5;
export const AR = 'AmiriB, serif', EN = 'KnitSerif, serif', NUM = 'Fredoka, sans-serif';
// Arabic is never run through the yarn displacement filter: it would move the harakat. Light text gets a puffy shadow,
// ink on the cream crochet gets an embossed one.
export const PUFF_AR = 'drop-shadow(0 3px 2px #2A0508cc) drop-shadow(0 10px 16px #00000099)';
export const INK = 'drop-shadow(0 1.5px 0 #FFFFFFAA) drop-shadow(0 2px 3px #3A0F3055)';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inOut = (x: number) => { const u = c01(x); return u * u * (3 - 2 * u); };
const fade = (t: number, a: number, b: number, c = 1e9, d = 1e9) => Math.min(c01((t - a) / (b - a)), 1 - c01((t - c) / (d - c)));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.sin((Math.PI * x) / w));
/** springy pop 0 -> 1 with a small overshoot */
const spring = (x: number) => (x <= 0 ? 0 : x > 1.2 ? 1 : 1 - Math.exp(-x * 9) * Math.cos(x * 15));

// --- the reference clock (frames at 30 fps) -------------------------------------------------------------------------
export const countAtF = (f: number) => (f < 90 ? 0 : Math.min(100, Math.floor((f - 90) / 18) + 1));
export const countT = (k: number) => 3 + 0.6 * (k - 1);
export const TL = {introOut: 2.67, countIn: 2.67, burst: 63.03, hadith: 66.43, e1: 67.2, h2: 68.43, e2: 69.03, hadithOut: 73.47,
  end: 73.8, send: 74.83, follow: 76.03, black: 78.93};

// ten yarn colours round the ring (bead image, the deep yarn for the counter, the light for the glow)
export const COLS: {bead: string; deep: string; glow: string}[] = [
  {bead: 'red', deep: '#B0122B', glow: '#FF4D5E'}, {bead: 'orange', deep: '#C9520A', glow: '#FF9A3D'},
  {bead: 'mustard', deep: '#A87400', glow: '#FFD24A'}, {bead: 'lime', deep: '#4F8A0C', glow: '#B6F04A'},
  {bead: 'emerald', deep: '#0C7337', glow: '#3FE08A'}, {bead: 'turquoise', deep: '#0B7C80', glow: '#4FF0E6'},
  {bead: 'sky', deep: '#1675B8', glow: '#6CC8FF'}, {bead: 'royal', deep: '#1F3BA8', glow: '#6F8BFF'},
  {bead: 'violet', deep: '#6A28AE', glow: '#C08BFF'}, {bead: 'fuchsia', deep: '#A8146E', glow: '#FF6FC8'},
];
export const groupOf = (k: number) => Math.min(9, Math.max(0, Math.floor((k - 1) / 10)));

// --- layout (1080 x 1920; everything that reads sits between y 180 and 1500) -----------------------------------------
export const RING = {cx: 540, cy: 860, r: 350, bead: 26};
const MED = 618;                                     // crochet medallion diameter
const SCROLL = {w: 1020, h: 1467, top: 310, bot: 1170, px0: 142, px1: 866};   // scroll.png geometry (page between top and bot)

/** slot 0 is the imam bead at the top; bead i sits in slot i + 1, counter-clockwise (as the reference fills) */
export const beadXY = (i: number, cx = RING.cx, cy = RING.cy, r = RING.r, rot = 0) => {
  const a = -Math.PI / 2 - ((i + 1) * 2 * Math.PI) / 101 + rot;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

export const TasbihDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={10}/></filter>
    <linearGradient id="goldthread" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#F7D37A"/><stop offset="0.5" stopColor="#C8902E"/><stop offset="1" stopColor="#F2C45E"/>
    </linearGradient>
  </defs>
</svg>;

/** The felted tasbih: undyed beads take their colour count by count. lit = beads coloured; t drives pops and shimmer. */
export const Ring: React.FC<{t: number; lit: number; cx?: number; cy?: number; scale?: number; rot?: number; build?: number;
  glowAll?: number; litAt?: (i: number) => number}> = ({t, lit, cx = RING.cx, cy = RING.cy, scale = 1, rot = 0, build = 1, glowAll = 0, litAt}) => {
  const r = RING.r * scale, size = RING.bead * scale;
  const beads: React.ReactNode[] = [], glows: React.ReactNode[] = [];
  for (let i = 0; i < 100; i++) {
    const [x, y] = beadXY(i, cx, cy, r, rot);
    const appear = spring(c01((build * 1.25 - i / 100) / 0.25) * 1.2);          // the ring threads itself in (intro)
    if (appear <= 0.001) continue;
    const g = COLS[Math.floor(i / 10)], on = i < lit;
    const tOn = litAt ? litAt(i) : countT(i + 1), dt = t - tOn;
    const pop = on ? 1 + 0.75 * Math.exp(-dt * 7) * Math.max(0, Math.cos(dt * 11)) : 1;
    // shimmer runs along a finished group of ten at its milestone
    const grp = Math.floor(i / 10), mt = t - countT(10 * (grp + 1)), shimmer = on && lit >= 10 * (grp + 1) ? pulse(mt - 0.04 * (i % 10), 0.35) : 0;
    const s = size * appear * (pop + 0.25 * shimmer + 0.12 * glowAll * (0.5 + 0.5 * Math.sin(t * 5 - i * 0.35)));
    const dye = on ? c01(dt / 0.22) : 0;
    const rotB = random(`rb${i}`) * 360;
    beads.push(<div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, transform: `rotate(${rotB}deg)`,
      filter: 'drop-shadow(0 3px 2.5px #12021099)'}}>
      {dye < 1 ? <Img src={staticFile('parts/bead-cream.png')} style={{position: 'absolute', inset: 0, width: s, height: s, filter: 'brightness(0.82) saturate(0.7)'}}/> : null}
      {dye > 0 ? <Img src={staticFile(`parts/bead-${g.bead}.png`)} style={{position: 'absolute', inset: 0, width: s, height: s, opacity: dye}}/> : null}
    </div>);
    const flash = on ? Math.exp(-dt * 4) : 0, gl = Math.max(flash, 0.55 * shimmer, glowAll * 0.6);
    if (gl > 0.02) glows.push(<div key={`g${i}`} style={{position: 'absolute', left: x - 34 * scale, top: y - 34 * scale, width: 68 * scale, height: 68 * scale,
      borderRadius: '50%', background: `radial-gradient(closest-side, ${g.glow}, ${g.glow}00)`, opacity: gl, mixBlendMode: 'screen'}}/>);
  }
  // the gold thread under the beads
  const ring = <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: c01(build * 2)}}>
    <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#goldthread)" strokeWidth={3 * scale} style={{filter: 'url(#yarn)'}}
      strokeDasharray={`${2 * Math.PI * r * c01(build * 1.25)} 99999`} transform={`rotate(-90 ${cx} ${cy}) scale(1 -1) translate(0 ${-2 * cy})`}/>
  </svg>;
  return <>{ring}{glows}{beads}</>;
};

/** imam bead + tassel lying on the blanket at the top of the ring */
export const Tassel: React.FC<{cx?: number; cy?: number; scale?: number; o?: number; sway?: number}> = ({cx = RING.cx, cy = RING.cy, scale = 1, o = 1, sway = 0}) => {
  const h = 115 * scale, w = h * 386 / 1443, top = cy - RING.r * scale;
  // flipped so the imam bead (the top 8 % of the image) sits on the ring and the strands lie outward, leaning right
  return <div style={{position: 'absolute', left: cx - w / 2, top: top - 0.92 * h, width: w, height: h, opacity: o,
    transform: `rotate(${28 + sway}deg)`, transformOrigin: '50% 92%', filter: 'drop-shadow(0 4px 4px #12021099)'}}>
    <Img src={staticFile('parts/tassel.png')} style={{width: w, height: h, transform: 'scaleY(-1)'}}/>
  </div>;
};

/** crochet medallion that holds the counter */
export const Medallion: React.FC<{cx?: number; cy?: number; scale?: number; glow?: number; children?: React.ReactNode}> = ({cx = RING.cx, cy = RING.cy, scale = 1, glow = 0, children}) => {
  const d = MED * scale;
  return <div style={{position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d}}>
    <Img src={staticFile('parts/medallion.png')} style={{position: 'absolute', inset: 0, width: d, height: d,
      filter: `drop-shadow(0 18px 22px #12021099) brightness(${0.97 + 0.12 * glow})`}}/>
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(closest-side, #FFF6DE00 55%, #3A0F3022 100%)'}}/>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${scale})`}}>{children}</div>
  </div>;
};

/** gold running stitches written into the scroll: n of 100, ten rows of ten, right to left */
const Stitches: React.FC<{n: number; t: number; o?: number}> = ({n, t, o = 1}) => <svg width={SCROLL.w} height={SCROLL.h}
  style={{position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible'}}>
  {Array.from({length: Math.min(100, Math.ceil(n))}, (_, i) => {
    const row = Math.floor(i / 10), col = i % 10, x = 790 - col * 64, y = 380 + row * 78;
    const born = countT(i + 1), p = c01((t - born) / 0.18), hot = Math.exp(-Math.max(0, t - born) * 3);
    return <g key={i} transform={`translate(${x} ${y}) scale(${p})`} opacity={p}>
      <path d="M -22 -16 L 0 14 L 22 -16" stroke={hot > 0.2 ? '#FFF1B8' : '#E3AE3E'} strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </g>;
  })}
</svg>;

/** The knitted scroll. open: 0 rolled shut .. 1 open; page: displayed page height in source px; children = text on the page */
export const Scroll: React.FC<{x: number; y: number; sx: number; sy: number; open?: number; page?: number; stitches?: number; t: number;
  glow?: number; stitchO?: number; children?: React.ReactNode}> = ({x, y, sx, sy, open = 1, page = SCROLL.bot - SCROLL.top, stitches = 0, t, glow = 0, stitchO = 1, children}) => {
  const midH = page * open, topH = SCROLL.top, botH = SCROLL.h - SCROLL.bot, H = topH + midH + botH;
  const src = `url(${staticFile('parts/scroll.png')})`;
  return <div style={{position: 'absolute', left: x - (SCROLL.w * sx) / 2, top: y - (H * sy) / 2, width: SCROLL.w, height: H,
    transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
    {glow > 0 ? <div style={{position: 'absolute', left: SCROLL.px0 - 160, top: -60, width: SCROLL.px1 - SCROLL.px0 + 320, height: H + 120, borderRadius: '40%',
      background: 'radial-gradient(closest-side, #FFE29A, #FFC24A66 45%, #FFB02A00)', opacity: glow, mixBlendMode: 'screen', filter: 'blur(6px)'}}/> : null}
    <div style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 22px 26px #12021099)'}}>
      {/* page (stretched to its displayed height), then the two rolls over it */}
      <div style={{position: 'absolute', left: 0, top: topH - 2, width: SCROLL.w, height: midH + 4, backgroundImage: src,
        backgroundSize: `${SCROLL.w}px ${(SCROLL.h * midH) / (SCROLL.bot - SCROLL.top)}px`,
        backgroundPosition: `0 ${(-SCROLL.top * midH) / (SCROLL.bot - SCROLL.top)}px`}}/>
      <div style={{position: 'absolute', left: 0, top: 0, width: SCROLL.w, height: topH, backgroundImage: src, backgroundSize: `${SCROLL.w}px ${SCROLL.h}px`}}/>
      <div style={{position: 'absolute', left: 0, top: topH + midH, width: SCROLL.w, height: botH, backgroundImage: src,
        backgroundSize: `${SCROLL.w}px ${SCROLL.h}px`, backgroundPosition: `0 ${-SCROLL.bot}px`}}/>
    </div>
    {stitches > 0 && stitchO > 0 ? <div style={{position: 'absolute', left: 0, top: (topH - SCROLL.top), width: SCROLL.w, height: SCROLL.h,
      transform: `scaleY(${midH / (SCROLL.bot - SCROLL.top)})`, transformOrigin: `0 ${SCROLL.top}px`, filter: 'url(#yarn) drop-shadow(0 0 10px #FFC64A)'}}>
      <Stitches n={stitches} t={t} o={stitchO}/></div> : null}
    {children ? <div style={{position: 'absolute', left: SCROLL.px0, top: topH, width: SCROLL.px1 - SCROLL.px0, height: midH,
      transform: `scale(${1 / sx}, ${1 / sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: (SCROLL.px1 - SCROLL.px0) * sx, height: midH * sy}}>{children}</div>
    </div> : null}
  </div>;
};

const Motes: React.FC<{f: number; o: number}> = ({f, o}) => <>{Array.from({length: 24}, (_, k) => {
  const life = 260 + random(`ml${k}`) * 200, ph = (f + random(`mp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`mp${k}`) * life) / life);
  const x = 80 + random(`mx${k}-${gen}`) * 920 + Math.sin(u * 5 + k) * 26, y = 1500 - u * 1250, s = 2.5 + random(`ms${k}`) * 4;
  const c = k % 3 === 0 ? COLS[Math.floor(random(`mc${k}`) * 10)].glow : '#FFE7B0';
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: c,
    boxShadow: `0 0 ${3 * s}px ${s}px ${c}55`, opacity: o * Math.sin(Math.PI * u) * (0.35 + 0.3 * Math.sin(f / 9 + k))}}/>;
})}</>;

/** her handle with a rainbow running-stitch underline */
export const Handle: React.FC<{top: number; o?: number; endP?: number}> = ({top, o = 1, endP = 0}) =>
  <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, zIndex: 6}}>
    <span style={{display: 'inline-block', position: 'relative', fontFamily: EN, fontStyle: 'italic', fontSize: 38, color: '#F8E9CC', letterSpacing: 1,
      paddingBottom: 10, textShadow: `0 2px 3px #000000aa, 0 0 ${16 * endP}px #FFD47A`}}>
      @heal.ingthroughquran
      <svg width="100%" height={8} viewBox="0 0 100 8" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: 0, overflow: 'visible'}}>
        {COLS.map((c, j) => <line key={j} x1={j * 10 + 1.5} x2={j * 10 + 8.5} y1={4} y2={4} stroke={c.glow} strokeWidth={4} strokeLinecap="round"
          vectorEffect="non-scaling-stroke" style={{filter: 'url(#yarn)'}}/>)}
      </svg>
    </span>
  </div>;

/** one Arabic line + its English line */
const Pair: React.FC<{ar: string; en: string; top: number; o?: number; arSize?: number; enSize?: number; arColor?: string; enColor?: string;
  y?: number; pad?: number; arStyle?: React.CSSProperties}> = ({ar, en, top, o = 1, arSize = 52, enSize = 34, arColor = '#FBF1DC', enColor = '#F2C76A', y = 0, pad = 120, arStyle}) =>
  <div style={{position: 'absolute', left: pad, right: pad, top, textAlign: 'center', opacity: o, transform: `translateY(${y}px)`}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: arSize, lineHeight: 1.45, color: arColor, filter: PUFF_AR, textWrap: 'balance', ...arStyle} as React.CSSProperties}>{ar}</div>
    <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: enSize, lineHeight: 1.1, color: enColor, textShadow: '0 2px 3px #000000aa', textWrap: 'balance'} as React.CSSProperties}>{en}</div>
  </div>;

export const puffNum = (size: number, color: string, stroke = color): React.CSSProperties => ({fontFamily: NUM, fontSize: size, lineHeight: 1,
  color, WebkitTextStroke: `2px ${stroke}`, filter: 'url(#yarn) drop-shadow(0 3px 2px #2A050899) drop-shadow(0 8px 10px #00000055)'});

export const TasbihKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const k = countAtF(f);
  const kt = k > 0 ? t - countT(k) : 0;                                    // time since this count
  const g = COLS[groupOf(Math.max(1, k))];
  // phases
  const intro = 1 - inOut((t - TL.introOut) / 0.25);                      // the intro goes first, the counter follows
  const countO = inOut((t - 2.8) / 0.3) * (1 - inOut((t - 62.95) / 0.25));
  const burst = t - TL.burst;
  const bloom = t >= TL.burst ? Math.exp(-Math.max(0, burst) * 1.6) * c01(burst / 0.12) : 0;
  const thousand = fade(t, 63.12, 63.5, TL.hadith, 66.9);
  const toHadith = inOut((t - TL.hadith) / 0.45);                         // ring + medallion leave
  const endIn = inOut((t - TL.end) / 0.4);
  const ringO = t < TL.end ? 1 - toHadith : endIn;
  const black = c01((t - TL.black) / 0.4);
  const push = 1 + 0.035 * (t / DURATION);
  const prog = k / 100;

  // ring: intro small and undyed, grows a touch as the count starts; spins slowly after 100; back for the end card
  const ringScale = t < 3.2 ? 0.86 + 0.14 * inOut((t - TL.introOut) / 0.43) : t < TL.hadith ? 1 + 0.03 * ease(burst / 0.6) - 0.06 * toHadith
    : 0.92 + 0.08 * endIn;
  const ringCy = t < TL.end ? RING.cy : 800;
  const spin = t > 62.4 ? (t - 62.4) * 0.09 : 0;
  const build = ease((t - 0.37) / 0.5);
  const glowAll = t >= TL.burst ? Math.max(0.35, bloom) : 0;
  // scroll: small icon at the top while counting; flies down and unrolls to carry the hadith; rolls up at 73.47
  const fly = inOut((t - TL.hadith) / 0.42), unroll = inOut((t - 66.68) / 0.45), rollUp = inOut((t - TL.hadithOut) / 0.33);
  const SMALL = {x: 456, y: 354, s: 0.105}, BIG = {x: 540, y: 982, sx: 1.04, sy: 0.84};
  const pageBig = 1080;
  const sc = {x: interpolate(fly, [0, 1], [SMALL.x, BIG.x]), y: interpolate(fly, [0, 1], [SMALL.y, BIG.y]),
    sx: interpolate(fly, [0, 1], [SMALL.s, BIG.sx]) * (1 - 0.15 * rollUp), sy: interpolate(fly, [0, 1], [SMALL.s, BIG.sy]) * (1 - 0.15 * rollUp)};
  const scrollOpen = t < TL.hadith ? 1 : t < 66.68 ? 1 - 0.85 * fly : t < TL.hadithOut ? 0.15 + 0.85 * unroll : 1 - rollUp;
  const scrollPage = t < TL.hadith ? SCROLL.bot - SCROLL.top : interpolate(unroll, [0, 1], [SCROLL.bot - SCROLL.top, pageBig]);
  const scrollO = t < 62.9 ? inOut((t - TL.countIn) / 0.43) : 1 - c01((t - TL.hadithOut - 0.15) / 0.18);
  const scrollGlow = t < TL.hadith ? 0.12 + 0.75 * prog * prog + 0.6 * bloom : 0.35 * (1 - unroll);
  const textO = fade(t, 66.95, 67.2, TL.hadithOut, TL.hadithOut + 0.2);

  // the counter's colour follows the beads
  const numColor = k === 0 ? '#B07A12' : g.deep;
  const numPop = k > 0 ? 1 + 0.28 * Math.exp(-kt * 9) * Math.cos(kt * 13) : 1;
  const msg = T.MSGS.find(([c]) => k >= c && t >= countT(c) && t < countT(c) + (c === 55 ? 2.33 : 2.4));
  const msgO = msg ? fade(t, countT(msg[0]) + 0.03, countT(msg[0]) + 0.23, countT(msg[0]) + (msg[0] === 55 ? 2.15 : 2.22), countT(msg[0]) + (msg[0] === 55 ? 2.33 : 2.4)) : 0;
  const sayO = fade(t, 1.87, 2.03, 7.3, 7.5);

  return <AbsoluteFill style={{background: '#1A0619', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/>
    <TasbihDefs/>
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 45%'}}>
      <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 58% at 50% 45%, #2A0A2600 30%, #12030FCC 100%)'}}/>
      {/* warm light behind the tasbih; it grows as the record fills, the burst floods it gold */}
      <div style={{position: 'absolute', left: 540 - 600, top: ringCy - 600, width: 1200, height: 1200, borderRadius: '50%', mixBlendMode: 'screen',
        opacity: Math.min(1, 0.25 + 0.45 * prog + 0.8 * bloom) * ringO, background: `radial-gradient(closest-side, ${g.glow}55 0%, #FFB45A33 45%, #FF9A2A00 100%)`}}/>
      <Motes f={f} o={0.5 + 0.5 * prog}/>
      {ringO > 0.001 ? <div style={{position: 'absolute', inset: 0, opacity: ringO}}>
        <Tassel cy={ringCy} scale={ringScale} sway={1.5 * Math.sin(t * 0.8)} o={inOut((t - TL.introOut) / 0.43)}/>
        <Ring t={t} lit={t < TL.end ? k : 100} cy={ringCy} scale={ringScale} rot={spin} build={t < TL.end ? build : 1} glowAll={t < TL.end ? glowAll : 0.35}/>
        <div style={{position: 'absolute', inset: 0, opacity: t < 1 ? ease((t - 0.3) / 0.25) : 1, transform: `scale(${t < 1 ? 0.92 + 0.08 * ease((t - 0.3) / 0.4) : 1})`,
          transformOrigin: `540px ${ringCy}px`}}>
        <Medallion cy={ringCy} scale={ringScale} glow={bloom + (t >= TL.end ? 0.3 : 0)}>
          {/* intro: 1000 good deeds before this video ends */}
          {intro > 0.001 ? <div style={{opacity: intro * c01((t - 0.37) / 0.13), textAlign: 'center', transform: `scale(${0.85 + 0.15 * ease((t - 0.37) / 0.4)})`}}>
            <div style={{...puffNum(190, '#C68A12', '#9A6408'), ...{}}}>1000</div>
            <div dir="rtl" style={{fontFamily: AR, fontSize: 50, lineHeight: 1.5, marginTop: 10, color: '#4A1240', filter: INK}}>{T.INTRO_SUB}</div>
            <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 33, lineHeight: 1, color: '#8A5A1A'}}>good deeds before this video ends</div>
          </div> : null}
          {/* counting */}
          {countO > 0.001 && t < TL.burst + 0.2 ? <div style={{position: 'absolute', opacity: countO, textAlign: 'center'}}>
            <div style={{...puffNum(196, numColor), transform: `scale(${numPop})`, marginTop: -16, marginBottom: 6}}>{Math.max(1, k)}</div>
            <div dir="rtl" style={{fontFamily: AR, fontSize: 76, lineHeight: 1.9, marginTop: -2, color: '#4A1240', WebkitTextStroke: '0.5px #4A1240', filter: INK}}>{T.DHIKR}</div>
            <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 36, lineHeight: 1, marginTop: -10, color: '#8A5A1A'}}>SubhanAllah</div>
          </div> : null}
          {/* 1000 good deeds */}
          {thousand > 0.001 ? <div style={{position: 'absolute', opacity: thousand, textAlign: 'center', transform: `scale(${0.7 + 0.3 * spring((t - 63.12) / 0.5)})`}}>
            <div style={{...puffNum(210, '#C68A12', '#9A6408'), filter: 'url(#yarn) drop-shadow(0 0 18px #FFD36A) drop-shadow(0 6px 8px #00000055)'}}>1000</div>
            <div dir="rtl" style={{fontFamily: AR, fontSize: 72, lineHeight: 1.5, color: '#4A1240', filter: INK}}>{T.HASANA}</div>
          </div> : null}
          {/* end card */}
          {t >= TL.end ? <div style={{position: 'absolute', opacity: c01((t - TL.end) / 0.37), textAlign: 'center'}}>
            <div dir="rtl" style={{fontFamily: AR, fontSize: 44, lineHeight: 1.5, color: '#6A3A5E', filter: INK}}>{T.COMMENT}</div>
            <div dir="rtl" style={{fontFamily: AR, fontSize: 100, lineHeight: 1.75, color: '#4A1240', WebkitTextStroke: '0.8px #4A1240',
              filter: `${INK} drop-shadow(0 0 ${10 + 6 * Math.sin(t * 3)}px #FFD36A)`}}>{T.DHIKR}</div>
            <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 40, lineHeight: 1, color: '#8A5A1A'}}>Comment “SubhanAllah”</div>
          </div> : null}
        </Medallion>
        </div>
      </div> : null}

      {/* light burst at 100: gold bloom + felted beads flung out of the ring */}
      {t >= TL.burst && t < TL.burst + 2.6 ? <>
        <div style={{position: 'absolute', left: 540 - 700, top: RING.cy - 700, width: 1400, height: 1400, borderRadius: '50%', mixBlendMode: 'screen',
          opacity: bloom, background: 'radial-gradient(closest-side, #FFF6D8 0%, #FFD36A99 35%, #FF9A2A00 100%)'}}/>
        {Array.from({length: 64}, (_, j) => {
          // felt beads spring off the ring, each from its own colour, outward and up, then fall
          const b = Math.floor(random(`bb${j}`) * 100), [bx, by] = beadXY(b, RING.cx, RING.cy, RING.r * 1.03, spin);
          const a = Math.atan2(by - RING.cy, bx - RING.cx) + (random(`ba${j}`) - 0.5) * 0.5, v = 380 + 620 * random(`bv${j}`), d = burst, gy = 1300;
          const x = bx + Math.cos(a) * v * d, y = by + Math.sin(a) * v * d - 380 * d + 0.5 * gy * d * d;
          const s = 16 + 20 * random(`bs${j}`), o = c01(d / 0.05) * (1 - c01((d - 1.0) / 1.1));
          const c = COLS[Math.floor(b / 10)].bead;
          return <Img key={j} src={staticFile(`parts/bead-${c}.png`)} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: o,
            transform: `rotate(${d * 500 * (random(`br${j}`) - 0.5)}deg)`, filter: 'drop-shadow(0 3px 3px #00000088)'}}/>;
        })}
      </> : null}

      {/* the knitted scroll: your record */}
      {scrollO > 0.001 ? <div style={{position: 'absolute', inset: 0, opacity: scrollO}}>
        <Scroll x={sc.x} y={sc.y} sx={sc.sx} sy={sc.sy} open={scrollOpen} page={scrollPage} t={t} stitches={t < TL.hadith + 0.3 ? k : 0}
          stitchO={1 - fly} glow={scrollGlow}>
          {textO > 0.001 ? <HadithPage t={t} o={textO}/> : null}
        </Scroll>
      </div> : null}
    </AbsoluteFill>

    {/* ---- text ---- */}
    <Handle top={224} o={1 - black}/>
    {/* intro */}
    {intro > 0.001 ? <div style={{position: 'absolute', inset: 0, opacity: intro}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 284, textAlign: 'center', transform: `scale(${1.06 - 0.06 * ease(t / 0.5)})`}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 112, lineHeight: 1.45, ...gold(t, 0.3), WebkitTextStroke: '0px transparent',
          filter: `drop-shadow(0 0 1.2px #8A5A08) ${PUFF_AR}`}}>{T.TITLE}</div>
        <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 42, lineHeight: 1, marginTop: 10, color: '#F6D99B', textShadow: '0 2px 3px #000000aa'}}>
          Stop &amp; say SubhanAllah…</div>
      </div>
      <Pair ar={T.CAN_REACH} en="Can you reach 100?" top={1180} o={fade(t, 1.0, 1.13)} arSize={54} enSize={36}/>
      {/* the reference shows this label for 1.27 s; it comes in 0.28 s earlier so it holds the 1.5 s reading time */}
      <Pair ar={T.HADITH_LABEL} en="Authentic hadith · Sahih Muslim" top={1304} o={fade(t, 1.12, 1.25)} arSize={32} enSize={24} arColor="#F2C76A" enColor="#D9C3D2"/>
    </div> : null}
    <Pair ar={`${T.SAY} ${T.DHIKR}`} en="Say “SubhanAllah” at every click" top={1392 - 54 * inOut((t - TL.introOut) / 0.43)} o={sayO} arSize={46} enSize={32}/>
    {/* counting: your record, good deeds, the lines */}
    <div style={{position: 'absolute', inset: 0, opacity: countO}}>
      <div style={{position: 'absolute', left: 524, top: 300, textAlign: 'left'}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 46, lineHeight: 1.3, color: '#F6D99B', filter: PUFF_AR, textAlign: 'left'}}>{T.RECORD}</div>
        <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 30, lineHeight: 1, color: '#E8D2DD'}}>Your record</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1234, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26}}>
        <div style={{...puffNum(78, '#F6C451', '#E7A93A'), minWidth: 190, textAlign: 'right', transform: `scale(${1 + 0.18 * Math.exp(-kt * 8) * (k > 0 ? 1 : 0)})`,
          transformOrigin: '70% 50%'}}>{10 * k}</div>
        <div style={{width: 3, height: 70, background: 'repeating-linear-gradient(180deg, #E7B040 0 9px, transparent 9px 15px)', borderRadius: 2}}/>
        <div style={{minWidth: 190, textAlign: 'left'}}>
          <div dir="rtl" style={{fontFamily: AR, fontSize: 42, lineHeight: 1.3, color: '#F2E2EA', filter: PUFF_AR, textAlign: 'left'}}>{T.DEEDS}</div>
          <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 28, lineHeight: 1, color: '#D9C3D2'}}>Good deeds</div>
        </div>
      </div>
    </div>
    {msg ? <Pair ar={msg[1]} en={msg[2]} top={1338} o={msgO * countO} arSize={48} enSize={33} y={10 * (1 - ease((t - countT(msg[0])) / 0.3))}/> : null}
    {/* 1000: congratulations */}
    <Pair ar={T.CONGRATS} en="Congratulations… 1,000 good deeds, by Allah’s will" top={1244} o={thousand} arSize={50} enSize={32} pad={60}/>
    {/* end card, under the ring */}
    {t >= TL.end ? <>
      <Pair ar={T.SEND} en="Send it to someone you love… you share their reward" top={1166} o={fade(t, TL.send, TL.send + 0.3)} arSize={46} enSize={31} pad={60}/>
      <div dir="rtl" style={{position: 'absolute', left: 0, right: 0, top: 1282, textAlign: 'center', fontFamily: AR, fontSize: 32, lineHeight: 1.5,
        color: '#D9C3D2', opacity: fade(t, TL.send, TL.send + 0.3)}}>«{T.H3}» · {T.MUSLIM}</div>
      <FollowPill t={t} o={fade(t, TL.follow, TL.follow + 0.27)}/>
    </> : null}
    {/* fade to black */}
    <AbsoluteFill style={{background: '#000', opacity: black}}/>
  </AbsoluteFill>;
};

/** the hadith on the open scroll */
const HadithPage: React.FC<{t: number; o: number}> = ({t, o}) => {
  const e1 = fade(t, TL.e1, TL.e1 + 0.3), h2 = fade(t, TL.h2, TL.h2 + 0.37), e2 = fade(t, TL.e2, TL.e2 + 0.5);
  const ink = '#3E0E36', en = '#5E3F22', bal = {textWrap: 'balance'} as React.CSSProperties;
  return <div style={{position: 'absolute', inset: 0, padding: '6px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', opacity: o, textAlign: 'center'}}>
    <div style={{position: 'absolute', inset: '-10px 0', background: 'radial-gradient(ellipse 60% 55% at 50% 50%, #FFF9EAcc, #FFF9EA66 70%, #FFF9EA00)'}}/>
    <div style={{position: 'relative'}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 44, lineHeight: 1.5, color: '#8A5A1A', filter: INK}}>{T.PROMISE}</div>
      <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 30, lineHeight: 1.1, color: en}}>This is the Prophet’s <span style={{fontFamily: AR, fontStyle: 'normal'}}>{T.SAW}</span> promise. He said:</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 56, lineHeight: 1.8, color: ink, marginTop: 14, filter: INK, ...bal}}>«{T.H1}»</div>
      <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 32, lineHeight: 1.15, color: en, opacity: e1, ...bal}}>“Is any of you unable to earn a thousand good deeds every day?”</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 60, lineHeight: 1.8, color: '#8C1238', marginTop: 16, opacity: h2, filter: INK, ...bal,
        transform: `scale(${0.94 + 0.06 * ease((t - TL.h2) / 0.4)})`}}>«{T.H2}»</div>
      <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 32, lineHeight: 1.15, color: en, opacity: e2, ...bal}}>
        “He glorifies Allah a hundred times, and a thousand good deeds are recorded for him, or a thousand sins are wiped away”</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 38, lineHeight: 1.5, color: '#9A6410', marginTop: 12, opacity: e2, filter: INK}}>{T.RAWAHU}</div>
      <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 26, lineHeight: 1, color: en, opacity: e2}}>Sahih Muslim 2698</div>
    </div>
  </div>;
};

/** knitted follow pill with her handle */
const FollowPill: React.FC<{t: number; o: number}> = ({t, o}) => {
  const p = spring((t - TL.follow) / 0.5);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 1344, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '10px 40px 14px', borderRadius: 60, transform: `scale(${0.8 + 0.2 * p})`,
      background: 'linear-gradient(180deg, #F4C65A, #D89A28)', border: '4px dashed #FFF0C2', boxShadow: '0 10px 22px #000000aa, inset 0 -6px 10px #9A5A1255',
      }}>
      <span style={{fontFamily: EN, fontStyle: 'italic', fontSize: 36, color: '#3E0E36'}}>@heal.ingthroughquran</span>
      <span dir="rtl" style={{fontFamily: AR, fontSize: 40, lineHeight: 1.4, color: '#3E0E36'}}>{T.FOLLOW} +</span>
    </div>
    <div style={{fontFamily: EN, fontStyle: 'italic', fontSize: 30, marginTop: 10, color: '#F6D99B', textShadow: '0 2px 3px #000000aa'}}>Follow for more</div>
  </div>;
};
