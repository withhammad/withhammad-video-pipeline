import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {Video, Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// "Line animations that come alive under your cursor" (job e5c7bfbcd56c, reference DemnYE2vTUg): the reference's
// split / GitHub / dark-card / face rhythm rebuilt on our take. Every unit, caption word and overlay is timed on the
// spoken word in data.json (build-reel.py in the job). Layout numbers come from analysis/spec.md section 4.
const fonts: [string, string, string, string?][] = [
  ['HLSans', 'inter-latin-600-normal', '600'], ['HLSans', 'inter-latin-800-normal', '800'], ['HLSans', 'inter-latin-900-normal', '900'],
  ['HLSerif', 'source-serif-4-latin-700-italic', '700', 'italic'], ['HLBlack', 'archivo-black-latin-400-normal', '400'],
];
fonts.forEach(([family, f, weight, style]) => loadFont({family, url: staticFile(`fonts/${f}.woff2`), weight, style: style || 'normal'}));

const D: any = data;
const FPS = 30;
const BLUE = '#0585FC', ACC = '#2186EF', NUM = '#0884F7', INK = '#111112', ICE = '#9FD3FF';
const file = (s: string) => staticFile('hairline/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = Easing.out(Easing.cubic);
type U = {id: string; layout: string; from: number; to: number; rec?: string; recAt?: number; rate?: number; [k: string]: any};
const units: U[] = D.units;
const unitAt = (f: number) => units.find((u) => f >= u.from && f < u.to) || units[units.length - 1];
// Layouts render inside their unit's Sequence; Off carries the unit's start so the take keeps its own clock across cuts.
const Off = React.createContext(0);
const useAbs = () => useCurrentFrame() + React.useContext(Off);

// ---------------------------------------------------------------- geometry per layout (spec section 4)
type G = {card: {x: number; y: number; w: number; bar: number}; cap: number; dark: boolean;
  pres?: {x0: number; x1: number; top: number; bottom?: number; hairTop: number; headW: number; r: number}};
const GEO: Record<string, G> = {
  split_hdr: {card: {x: 40, y: 452, w: 1000, bar: 64}, cap: 1280, dark: false, pres: {x0: 140, x1: 940, top: 1430, hairTop: 1368, headW: 280, r: 120}},
  split: {card: {x: 40, y: 110, w: 1000, bar: 64}, cap: 964, dark: false, pres: {x0: 120, x1: 960, top: 1160, hairTop: 1070, headW: 330, r: 120}},
  split_tall: {card: {x: 40, y: 110, w: 1000, bar: 64}, cap: 1204, dark: false, pres: {x0: 160, x1: 920, top: 1400, hairTop: 1310, headW: 270, r: 110}},
  github: {card: {x: 40, y: 190, w: 1000, bar: 64}, cap: 1390, dark: false},   // light GitHub on a light canvas, as the reference
  dark: {card: {x: 80, y: 130, w: 920, bar: 60}, cap: 1234, dark: true, pres: {x0: 375, x1: 705, top: 1390, bottom: 1700, hairTop: 1325, headW: 170, r: 70}},
  face: {card: {x: 0, y: 0, w: 1080, bar: 0}, cap: 0, dark: true},
};

// ---------------------------------------------------------------- shared pieces
// SVG blur filters for whips (horizontal) and fast scroll tails (vertical); one filter id per unit
const Blur: React.FC<{id: string; x: number; y: number}> = ({id, x, y}) =>
  <svg width={0} height={0} style={{position: 'absolute'}}><filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`}/></filter></svg>;

// A recording: the video from recAt at its rate, its last frame underneath in case the unit outlasts it
const Rec: React.FC<{name: string; at: number; rate?: number; w: number; h: number; top?: number}> = ({name, at, rate = 1, w, h, top = 0}) =>
  <div style={{position: 'absolute', left: 0, top, width: w, height: h}}>
    <Img src={file(`rec/${name}_last.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
    <Video src={file(`rec/${name}.mp4`)} trimBefore={Math.round(at * FPS)} playbackRate={rate} muted
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}}/>
  </div>;

const Bar: React.FC<{dark: boolean; h: number; url: string}> = ({dark, h, url}) =>
  <div style={{height: h, display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', background: dark ? '#1f2329' : '#F2F4F7',
    borderBottom: `1px solid ${dark ? '#30363d' : '#E3E7ED'}`}}>
    {['#ff5f57', '#febc2e', '#28c840'].map((c) => <i key={c} style={{width: 16, height: 16, borderRadius: 8, background: c, flex: 'none'}}/>)}
    <div style={{marginLeft: 14, flex: 1, height: h - 22, borderRadius: 10, background: dark ? '#0d1117' : 'white', display: 'flex', alignItems: 'center',
      padding: '0 18px', font: `600 ${h > 60 ? 26 : 24}px HLSans`, color: dark ? '#8b949e' : '#5B6270', whiteSpace: 'nowrap', overflow: 'hidden',
      textOverflow: 'ellipsis'}}>{url}</div>
  </div>;

// The presenter: RVM cut-out inside a squircle filled with the take's own background (blurred); the head breaks out
// of the squircle's top edge. Runs on the take's clock (Off).
const Presenter: React.FC<{p: NonNullable<G['pres']>; dark: boolean}> = ({p, dark}) => {
  const P = D.presenter, s = p.headW / P.head_w, w = P.w * s, h = P.h * s;
  const left = (p.x0 + p.x1) / 2 - P.cx * s, top = p.hairTop - P.hair_top * s;
  const off = React.useContext(Off);
  return <>
    <div style={{position: 'absolute', left: p.x0, top: p.top, width: p.x1 - p.x0, height: (p.bottom ?? 2220) - p.top, borderRadius: p.r, overflow: 'hidden',
      boxShadow: dark ? '0 20px 50px rgba(0,0,0,.55)' : '0 24px 60px rgba(16,24,40,.16)', border: `2px solid ${dark ? 'rgba(255,255,255,.14)' : 'rgba(5,133,252,.25)'}`}}>
      <Img src={file('take_bg.jpg')} style={{position: 'absolute', left: left - p.x0 - 40, top: top - p.top - 40, width: w + 80, height: h + 80,
        filter: 'blur(22px) saturate(1.1)', objectFit: 'cover'}}/>
    </div>
    <div style={{position: 'absolute', left, top, width: w, height: h,
      clipPath: `inset(0px ${Math.max(0, left + w - p.x1)}px ${Math.max(0, top + h - (p.bottom ?? 2220))}px ${Math.max(0, p.x0 - left)}px round 0px 0px ${p.r}px ${p.r}px)`,
      filter: 'drop-shadow(0 10px 24px rgba(0,0,0,.28))'}}>
      <OffthreadVideo src={file('take_alpha.webm')} trimBefore={off} muted transparent style={{width: '100%', height: '100%'}}/>
    </div>
  </>;
};

const LightBg: React.FC = () => {
  const f = useCurrentFrame(), drift = (f / FPS) * 6;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg,#EAF3F9,#F7FBFD)', overflow: 'hidden'}}>
    {[-200, 260, 720].map((x, i) => <div key={i} style={{position: 'absolute', left: x + drift, top: -300, width: 140 + i * 40, height: 2600,
      background: 'white', opacity: 0.18, filter: 'blur(40px)', transform: 'rotate(28deg)'}}/>)}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- the card layouts
const Unit: React.FC<{u: U}> = ({u}) => {
  const f = useAbs(), t = f - u.from, g = GEO[u.layout];
  if (u.layout === 'face') return <Face u={u}/>;
  const k = g.card.w / 1080;
  const tall = u.layout === 'split_tall';
  const srcH = u.rec && /R0[3-7]|R10|R04b/.test(u.rec) && !/R04a/.test(u.rec) ? 1120 : 760;
  const contentH = tall ? Math.round((u.crop[1] - u.crop[0]) * k) : Math.round(srcH * k);
  const cardH = contentH + g.card.bar;
  // entries: whip / pan (horizontal blur), scroll tail (vertical blur), settle (scale), slow push
  const wn = u.whipIn || u.panIn || 0, wp = wn ? interpolate(t, [0, wn], [0, 1], {...clamp, easing: out}) : 1;
  const dx = wn ? (1 - wp) * (u.whipIn ? 900 : 520) : 0;
  const hb = wn ? (1 - wp) * 26 : 0;
  const vb = u.vblurIn ? interpolate(t, [0, u.vblurIn], [16, 0], clamp)
    : u.segB?.vblur ? interpolate(f - u.segB.from, [-2, 0, u.segB.vblur], [0, 16, 0], clamp) : 0;   // blur over a join inside a scroll
  const settle = u.settle ? interpolate(t, [0, 10], [u.settle, 1], {...clamp, easing: out}) : 1;
  const push = u.push ? interpolate(t, [0, u.to - u.from], [1, 1.04], clamp) : 1;
  const fid = `b_${u.id}`;
  const bg = g.dark ? <AbsoluteFill style={{background: 'radial-gradient(90% 70% at 50% 40%,#3A3A3D,#121214)'}}/> : <LightBg/>;
  const sB = u.segB, inB = sB && f >= sB.from;
  return <AbsoluteFill>
    {bg}
    <Blur id={fid} x={hb} y={vb}/>
    <div style={{position: 'absolute', left: g.card.x, top: g.card.y, width: g.card.w, height: cardH, borderRadius: 28, overflow: 'hidden',
      background: g.dark ? '#0d1117' : 'white', transform: `translateX(${dx}px) scale(${settle})`,
      border: g.dark ? '1px solid #30363d' : '2px solid rgba(5,133,252,.35)',
      boxShadow: g.dark ? '0 30px 70px rgba(0,0,0,.6)' : '0 24px 60px rgba(16,24,40,.14)', filter: hb || vb ? `url(#${fid})` : undefined}}>
      <Bar dark={g.dark} h={g.card.bar} url={u.url}/>
      <div style={{position: 'relative', width: g.card.w, height: contentH, overflow: 'hidden', transform: `scale(${push})`, transformOrigin: '50% 45%'}}>
        {!inB && <Rec name={u.rec!} at={u.recAt!} rate={u.rate} w={g.card.w} h={srcH * k} top={tall ? -u.crop[0] * k : 0}/>}
        {inB && <Sequence from={sB.from - u.from} layout="none">
          <Rec name={u.rec!} at={sB.recAt} rate={sB.rate || 1} w={g.card.w} h={srcH * k} top={tall ? -u.crop[0] * k : 0}/></Sequence>}
        {u.circles && <Circles u={u} k={k}/>}
        {u.marker && <Marker u={u} k={k}/>}
        {u.cursor && <Cursor u={u} k={k}/>}
      </div>
    </div>
    {u.layout === 'split_hdr' && <Header/>}
    {g.pres && <Presenter p={g.pres} dark={g.dark}/>}
  </AbsoluteFill>;
};

// U05: hand-drawn blue ellipses around rule numbers 01-04, then a marker sweep over row 10 (take px -> card px)
const Circles: React.FC<{u: U; k: number}> = ({u, k}) => {
  const f = useAbs(), c = u.circles, y0 = u.crop[0];
  return <svg style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
    {c.cy.map((cy: number, i: number) => {
      const p = interpolate(f, [c.at + i * c.stagger, c.at + i * c.stagger + 7], [0, 1], {...clamp, easing: out});
      const rx = c.rx * k, ry = c.ry * k, x = c.cx * k, y = (cy - y0) * k;
      const d = `M ${x + rx * 0.9} ${y - ry * 0.55} A ${rx} ${ry} -6 1 0 ${x + rx * 0.98} ${y + ry * 0.2} L ${x + rx * 1.05} ${y - ry * 0.75}`;
      return p > 0 ? <path key={i} d={d} pathLength={1} fill="none" stroke={ACC} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={1} strokeDashoffset={1 - p}/> : null;
    })}
  </svg>;
};
const Marker: React.FC<{u: U; k: number}> = ({u, k}) => {
  const f = useAbs(), m = u.marker, p = interpolate(f, [m.at, m.at + 9], [0, 1], {...clamp, easing: out});
  return p > 0 ? <div style={{position: 'absolute', left: m.x0 * k - 8, top: (m.y0 - u.crop[0]) * k - 6, width: (m.x1 - m.x0) * k * p + 16,
    height: (m.y1 - m.y0) * k + 12, borderRadius: 8, background: 'rgba(33,134,239,.25)'}}/> : null;
};
// U10: the recorder's arrow (black, white stroke) following the demo page's tour, keyframes in take px
const Cursor: React.FC<{u: U; k: number}> = ({u, k}) => {
  const f = useAbs(), kf: number[][] = u.cursor;
  if (f < kf[0][0]) return null;
  const fs = kf.map((x) => x[0]);
  const x = interpolate(f, fs, kf.map((p) => p[1]), {...clamp, easing: Easing.inOut(Easing.cubic)}) * k;
  const y = interpolate(f, fs, kf.map((p) => p[2]), {...clamp, easing: Easing.inOut(Easing.cubic)}) * k;
  return <svg width={40} height={58} viewBox="0 0 20 29" style={{position: 'absolute', left: x, top: y, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))'}}>
    <path d="M1 1 L1 22 L6.2 17.2 L9.8 25.6 L13 24.2 L9.5 16 L16.4 16 Z" fill="#111" stroke="white" strokeWidth={1.6} strokeLinejoin="round"/></svg>;
};

// U01-U02 header: "Line Animations" over the blue box "That Come Alive" (fully composed on frame 0, a light sweep runs once)
const Header: React.FC = () => {
  const f = useCurrentFrame() + React.useContext(Off);
  const sweep = interpolate(f, [8, 30], [-200, 1080], clamp);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 226, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <div style={{font: '800 86px HLSans', letterSpacing: -1, color: INK, lineHeight: 1.08}}>Line Animations</div>
    <div style={{position: 'relative', marginTop: 8, width: 820, height: 112, borderRadius: 16, background: BLUE, overflow: 'hidden',
      display: 'grid', placeItems: 'center', boxShadow: '0 14px 34px rgba(5,133,252,.28)'}}>
      <span style={{font: 'italic 700 80px HLSerif', color: 'white', lineHeight: 1}}>That Come Alive</span>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: sweep, width: 120, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)',
        transform: 'skewX(-18deg)'}}/>
    </div>
  </div>;
};

// ---------------------------------------------------------------- face + CTA (U11)
const Face: React.FC<{u: U}> = ({u}) => {
  const f = useAbs(), P = D.presenter, c = D.cta;
  const base = 1.18, S = f >= c.lines && f < c.punchOut ? base * 1.08 : base;   // 0 ms punch-in on "LINES", back on "DM"
  const oy = P.hair_top + 0.6 * P.head_w;
  const chin = oy + (P.hair_top + 1.14 * P.head_w - oy) * S;   // chin ~ hair top + 1.14 head widths (measured on the matte)
  const stackTop = Math.min(Math.max(chin + 50, 960), 1500 - 470);   // DM card + comment + LINES end by y 1500
  const word = (at: number, dur = 5) => ({p: interpolate(f, [at, at + dur], [0, 1], {...clamp, easing: out})});
  const cm = word(c.comment), ln = word(c.lines, 6), dm = word(c.dm + 2, 8);
  return <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${S})`, transformOrigin: `${P.cx}px ${oy}px`}}>
      <Video src={file('take.mp4')} trimBefore={React.useContext(Off)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(180deg,transparent 45%,rgba(0,0,0,.38) 75%,rgba(0,0,0,.5))'}}/>
    {/* DM card lands on "DM"; before it, the spoken words sit in its place */}
    {f >= c.dm + 2 ? <div style={{position: 'absolute', left: 150, width: 780, top: stackTop + (1 - dm.p) * 50, opacity: dm.p, display: 'flex', gap: 22,
      alignItems: 'center', background: 'white', borderRadius: 30, padding: '20px 26px', boxShadow: '0 18px 40px rgba(0,0,0,.35)'}}>
      <div style={{width: 92, height: 92, borderRadius: 24, background: BLUE, display: 'grid', placeItems: 'center', flex: 'none'}}>
        <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></div>
      <div style={{minWidth: 0}}>
        <div style={{font: '800 40px HLSans', color: INK, letterSpacing: -0.5}}>Hairline setup guide</div>
        <div style={{font: '600 28px HLSans', color: '#5B6270', marginTop: 4}}>Install command + embed snippet</div>
        <div style={{font: '600 24px HLSans', color: ACC, marginTop: 4}}>withhammad.com</div></div>
    </div> : <SmallCaps top={stackTop + 50}/>}
    <div style={{position: 'absolute', left: 0, right: 0, top: stackTop + 190, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{font: 'italic 700 110px HLSerif', color: 'white', lineHeight: 1, opacity: cm.p, filter: `blur(${(1 - cm.p) * 12}px)`,
        transform: `translateY(${(1 - cm.p) * 10}px)`, textShadow: '0 4px 16px rgba(0,0,0,.45)'}}>comment</div>
      {f >= c.lines && <div style={{marginTop: -4, font: '400 155px HLBlack', lineHeight: 1.05, letterSpacing: 1,
        transform: `scale(${1.25 - 0.25 * ln.p})`, filter: `blur(${(1 - ln.p) * 10}px) drop-shadow(0 0 28px rgba(33,134,239,.65))`}}>
        <span style={{background: `linear-gradient(180deg,${ICE},${ACC})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'}}>
          {'“' + D.keyword + '”'}</span></div>}
    </div>
  </AbsoluteFill>;
};
const SmallCaps: React.FC<{top: number}> = ({top}) => {
  const f = useCurrentFrame(), c = D.caps.find((x: any) => f >= x.from && f < x.to);
  if (!c || unitAt(f).layout !== 'face') return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', font: '800 56px HLSans', color: 'white',
    textShadow: '0 4px 16px rgba(0,0,0,.5)'}}>
    {c.words.map((w: any, i: number) => <span key={i} style={{opacity: f >= w.at ? 1 : 0}}>{(i ? ' ' : '') + w.t}</span>)}</div>;
};

// ---------------------------------------------------------------- captions: one centred line, words blur in on their word
const Captions: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f), g = GEO[u.layout];
  const c = D.caps.find((x: any) => f >= x.from && f < x.to);
  if (!c || u.layout === 'face') return null;
  const chars = c.words.map((w: any) => w.t).join(' ').length;
  const size = Math.min(92, Math.floor((g.cap > 1000 ? 820 : 980) / (chars * 0.6)));   // x <= 950 beside the IG buttons
  const tall = u.layout === 'split_tall';
  const y = tall ? g.cap : g.cap;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y - size * 0.62, display: 'flex', justifyContent: 'center', gap: size * 0.26,
    whiteSpace: 'nowrap'}}>
    {c.words.map((w: any, i: number) => {
      const t = f - w.at, p = c === D.caps[0] ? 1 : interpolate(t, [0, 5], [0, 1], {...clamp, easing: out});   // frame 0: first line fully on
      const glitch = /[gG]/.test(w.s) && t >= 0 && t < 3 ? 8 * (1 - t / 3) : 0;
      const serif = /[sG]/.test(w.s), num = w.s === 'n';
      const color = g.dark ? (serif || num ? ICE : 'white') : (serif ? ACC : num ? NUM : INK);
      const shadow = [g.dark ? '0 4px 16px rgba(0,0,0,.45)' : '', g.dark && serif ? '0 0 18px rgba(33,134,239,.55)' : '',
        glitch ? `${glitch}px 0 rgba(255,0,80,.7), ${-glitch}px 0 rgba(0,200,255,.7)` : ''].filter(Boolean).join(', ');
      return <span key={i} style={{font: serif ? `italic 700 ${size * 1.04}px HLSerif` : `${num ? 900 : 800} ${size}px HLSans`,
        letterSpacing: serif ? 0 : -size * 0.01, color, opacity: p, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined,
        transform: `translateY(${(1 - p) * 10}px)`, textShadow: shadow || undefined, lineHeight: 1.2}}>{w.t}</span>;
    })}
  </div>;
};

export const Reel: React.FC = () => <AbsoluteFill style={{background: '#000', fontFamily: 'HLSans'}}>
  <Audio src={file('voice.wav')}/>
  {units.map((x) => <Sequence key={x.id} from={x.from} durationInFrames={x.to - x.from}>
    <Off.Provider value={x.from}><Unit u={x}/></Off.Provider></Sequence>)}
  <Captions/>
</AbsoluteFill>;
