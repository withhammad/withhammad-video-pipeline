import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import data from './data.json';
import {Elephant, Pose, Scene} from './Scene';
import './fonts';

// Cartoon-in-code reel (job 4a606d94c5cd). @techstackbro's reel (DfP6Oe8SOk_) beat for beat: peach-to-blue paper sky,
// a tilted cartoon player, count-up pills, red hand-drawn strikes, a code flip, chat -> story/characters/scenes cards,
// exploded paper layers, audio track stack, "make it night" relight, copy-paste catch, comment-keyword ending, and a
// cartoon presenter bottom-left with speech-bubble karaoke captions. Swapped: the presenter is Hammad (approved look,
// cartoon), his voice, WITHHAMMAD, keyword CARTOON, and the facts (real HyperFrames star count instead of an
// unverifiable views claim; a length chip instead of a fake 1:00:00 timer). The cartoon itself is drawn in code (Scene).

const D: any = data;
const FPS = 30;
const F = 'CtFredoka, Arial Rounded MT Bold, sans-serif', SERIF = 'CtSerif, Georgia, serif', HAND = 'CtHand, cursive', MONO = 'CtMono, Menlo, monospace';
const INK = '#1C1B22', CORAL = '#E5533D', PURPLE = '#7C5CF0', ORANGE = '#FF8A3D', CLAUDE = '#D97757', YT = '#FF0033';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (s: number, a: number, b: number) => interpolate(s, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const pop = (f: number, at: number, cfg = {damping: 12, stiffness: 180}) => (f < at * FPS ? 0 : spring({frame: f - at * FPS, fps: FPS, config: cfg}));
const T = (i: number) => D.words[i].s, E = (i: number) => D.words[i].e;
const END = D.voiceEnd as number;

// beat starts (word index -> seconds)
const B2 = T(9), B3 = T(20), B4 = T(30), B5 = T(42), B6 = T(51), B7 = T(59), B8 = T(67), B9 = T(79);
const NIGHT_AT = T(66);
const nightAt = (s: number) => io(ramp(s, NIGHT_AT, NIGHT_AT + 0.85)) * (1 - ramp(s, B8 + 0.9, B8 + 1.5));

// ---------------------------------------------------------------- background: paper sky, clouds, stars
const Bg: React.FC<{s: number}> = ({s}) => {
  const n = nightAt(s);
  const top = n > 0 ? `color-mix(in srgb, #F6C9AE ${100 - n * 70}%, #B7799E)` : '#F6C9AE';
  const bot = n > 0 ? `color-mix(in srgb, #BFD3EC ${100 - n * 70}%, #6E6AA8)` : '#BFD3EC';
  return <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, #EFD3C6 45%, ${bot} 100%)`}}>
    {[[120, 260, 0.6], [820, 380, 0.45], [300, 1120, 0.5], [900, 1020, 0.4], [60, 760, 0.35]].map(([x, y, sp], i) => {
      const xx = ((x + s * 18 * sp) % 1260) - 120;
      return <div key={i} style={{position: 'absolute', left: xx, top: y, width: 150, height: 54, borderRadius: 40, background: 'rgba(255,255,255,.85)',
        border: '3px dashed rgba(170,180,205,.8)', boxShadow: '0 6px 14px rgba(120,90,80,.12)'}}/>;
    })}
    {Array.from({length: 22}, (_, i) => {
      const x = (i * 263) % 1040 + 20, y = (i * 389) % 1500 + 120, tw = 0.5 + 0.5 * Math.sin(s * 2.4 + i);
      const c = ['#F4B740', '#E5533D', '#7C8CF0', '#9C6BE0', '#F49AB0'][i % 5];
      return i % 3 === 0
        ? <div key={i} style={{position: 'absolute', left: x, top: y + Math.sin(s + i) * 8, width: 16, height: 16, borderRadius: 8, background: c, opacity: 0.55 + 0.3 * tw}}/>
        : <svg key={i} width={30} height={30} style={{position: 'absolute', left: x, top: y + Math.sin(s * 0.8 + i) * 10, opacity: 0.5 + 0.4 * tw, transform: `scale(${0.7 + 0.4 * tw})`}}>
          <path d="M15 1 L18.5 11.5 L29 15 L18.5 18.5 L15 29 L11.5 18.5 L1 15 L11.5 11.5 Z" fill={c}/></svg>;
    })}
  </AbsoluteFill>;
};

const Sparkles: React.FC<{f: number; at: number; x: number; y: number; r?: number}> = ({f, at, x, y, r = 90}) => {
  const k = ramp(f / FPS, at, at + 0.55);
  if (k <= 0 || k >= 1) return null;
  return <>{Array.from({length: 8}, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.3, d = r * ease(k);
    return <svg key={i} width={34} height={34} style={{position: 'absolute', left: x + Math.cos(a) * d - 17, top: y + Math.sin(a) * d - 17, opacity: 1 - k, transform: `scale(${1.2 - k * 0.6}) rotate(${k * 90}deg)`}}>
      <path d="M17 1 L21 13 L33 17 L21 21 L17 33 L13 21 L1 17 L13 13 Z" fill={['#F4B740', '#E5533D', PURPLE, '#3FB6E8'][i % 4]}/></svg>;
  })}</>;
};

// hand-drawn red X
const Strike: React.FC<{f: number; at: number; w: number; h: number}> = ({f, at, w, h}) => {
  const a = ease(ramp(f / FPS, at, at + 0.22)), b = ease(ramp(f / FPS, at + 0.16, at + 0.38));
  const L = Math.hypot(w, h) + 20;
  return <svg width={w + 40} height={h + 40} style={{position: 'absolute', left: -20, top: -20, overflow: 'visible'}}>
    <path d={`M8 10 Q${w / 2} ${h / 2 + 8} ${w + 30} ${h + 28}`} stroke={CORAL} strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - a)}/>
    <path d={`M${w + 28} 8 Q${w / 2 + 6} ${h / 2} 10 ${h + 30}`} stroke={CORAL} strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - b)}/>
  </svg>;
};

const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties}> = ({children, bg = '#fff', color = INK, size = 44, style}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, background: bg, color, fontFamily: F, fontWeight: 700, fontSize: size, padding: `${size * 0.28}px ${size * 0.6}px`,
    borderRadius: 999, border: `4px solid ${INK}`, boxShadow: `5px 6px 0 ${INK}`, whiteSpace: 'nowrap', ...style}}>{children}</div>;

const ClaudeMark: React.FC<{size: number; color?: string}> = ({size, color = CLAUDE}) =>
  <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${staticFile('glow/si-claude.svg')})`, maskImage: `url(${staticFile('glow/si-claude.svg')})`,
    WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center'}}/>;
const YtMark: React.FC<{h: number}> = ({h}) =>
  <svg width={h * 1.42} height={h} viewBox="0 0 142 100"><rect width={142} height={100} rx={26} fill={YT}/><path d="M56 28 L98 50 L56 72 Z" fill="#fff"/></svg>;

// ---------------------------------------------------------------- the tilted cartoon player
const Window: React.FC<{w: number; children: React.ReactNode; title?: React.ReactNode; dark?: boolean; footer?: React.ReactNode}> = ({w, children, title, dark, footer}) =>
  <div style={{width: w, background: dark ? '#1D1F2B' : '#FBF7EF', borderRadius: 22, overflow: 'hidden', border: `3px solid ${dark ? '#0E0F16' : '#E6DCCB'}`,
    boxShadow: '0 30px 60px rgba(90,50,40,.28), 0 6px 0 rgba(90,60,40,.12)'}}>
    <div style={{height: 54, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', background: dark ? '#262938' : '#F2EADC'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}}/>)}
      <div style={{marginLeft: 8, display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 24, color: dark ? '#9AA3C7' : '#7A6F60'}}>{title}</div>
    </div>
    {children}
    {footer}
  </div>;

const Player: React.FC<{s: number; w: number; night: number; scene?: React.ReactNode; tc?: string; prog?: number}> = ({s, w, night, scene, tc, prog}) => {
  const h = w * 9 / 16;
  return <Window w={w} title={<YtMark h={26}/>} footer={
    <div style={{height: 46, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', background: '#FBF7EF'}}>
      <div style={{flex: 1, height: 8, borderRadius: 4, background: '#E2D8C8'}}><div style={{width: `${(prog ?? (s % 20) / 20) * 100}%`, height: 8, borderRadius: 4, background: YT, position: 'relative'}}>
        <div style={{position: 'absolute', right: -9, top: -6, width: 20, height: 20, borderRadius: 10, background: YT}}/></div></div>
      <div style={{fontFamily: MONO, fontSize: 22, color: '#6B6255'}}>{tc ?? `0:00:${String(Math.floor(s % 60)).padStart(2, '0')}`}</div>
    </div>}>
    <div style={{width: w, height: h, position: 'relative', overflow: 'hidden'}}>{scene ?? <Scene t={s} night={night}/>}</div>
  </Window>;
};

// film-leader countdown (first 1.3 s, as in the reference)
const Leader: React.FC<{s: number}> = ({s}) => {
  const n = 3 - Math.floor(s / 0.42), k = (s % 0.42) / 0.42;
  return <AbsoluteFill style={{background: 'repeating-conic-gradient(from 0deg, #F3C6A8 0deg 12deg, #FBE6D6 12deg 24deg)', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={300} height={300} style={{position: 'absolute'}}><circle cx={150} cy={150} r={130} fill="none" stroke="rgba(60,40,30,.25)" strokeWidth={6}/>
      <path d={`M150 150 L150 20 A130 130 0 ${k > 0.5 ? 1 : 0} 1 ${150 + 130 * Math.sin(k * 2 * Math.PI)} ${150 - 130 * Math.cos(k * 2 * Math.PI)} Z`} fill="rgba(60,40,30,.18)"/></svg>
    <div style={{width: 220, height: 220, borderRadius: 110, background: '#FFF8EE', border: `6px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, color: INK, lineHeight: 1}}>{Math.max(1, n)}</div>
  </AbsoluteFill>;
};

// code card (the player flips to it on "builds it all in code")
const CODE = [
  ['c', '<!-- moti.html · one full scene -->'],
  ['t', '<div class="sky" data-night="0">'],
  ['t', '  <div class="sun"></div>'],
  ['t', '  <div class="clouds" data-count="3">'],
  ['t', '<div class="village paper">'],
  ['t', '  <div class="hut"></div>  <div class="temple"></div>'],
  ['t', '<div class="elephant walk felt"'],
  ['a', '     data-speed="1.6"></div>'],
];
const CodeCard: React.FC<{w: number; s: number; at: number}> = ({w, s, at}) => {
  const chars = Math.max(0, (s - at) * 190);
  let used = 0;
  return <Window w={w} dark title={<span>moti.html</span>}>
    <div style={{height: w * 9 / 16 + 46, padding: '26px 30px', fontFamily: MONO, fontSize: w * 0.031, lineHeight: 1.6, color: '#E6E8F5', boxSizing: 'border-box'}}>
      {CODE.map(([k, line], i) => {
        const vis = line.slice(0, Math.max(0, Math.min(line.length, chars - used))); used += line.length;
        const col = k === 'c' ? '#7F8AB8' : '#E6E8F5';
        return <div key={i} style={{color: col, whiteSpace: 'pre', minHeight: '1.6em'}}>{vis.split(/(".*?")/).map((p, j) => <span key={j} style={{color: p.startsWith('"') ? '#F2A65A' : /class|data-/.test(p) ? col : col}}>{p}</span>)}</div>;
      })}
    </div>
  </Window>;
};

// ---------------------------------------------------------------- presenter (cartoon Hammad, approved look)
const POSES: [number, string][] = [[0, 'ok'], [B2, 'point'], [T(23), 'shrug'], [B4, 'peace'], [B5, 'point'], [B6, 'shrug'], [B7, 'point'], [B8, 'shrug'], [T(75), 'point'], [B9, 'wave'], [END + 0.05, 'thumbs']];
const Presenter: React.FC<{f: number}> = ({f}) => {
  const s = f / FPS;
  const k = POSES.reduce((a, p, i) => (s >= p[0] ? i : a), 0);
  let pose = POSES[k][1];
  const m = D.mouth[f] ?? 0;
  if (pose === 'point' && m < 0.22) pose = 'point_closed';
  const p = pop(f, POSES[k][0], {damping: 11, stiffness: 260});
  const end = ease(ramp(s, END, END + 0.55));
  const size = 660 + 240 * end, left = -50 + (540 - 330 - 120 - (-50)) * end * 1.0 + (end > 0 ? -20 * end : 0), top = 1920 - size + 6 - 180 * end;
  const sc = pose === 'shrug' ? 1.0 : 1;
  const breathe = 1 + Math.sin(s * 2.2) * 0.006, talk = 1 + m * 0.012;
  return <div style={{position: 'absolute', left: end > 0 ? interpolate(end, [0, 1], [-50, 90]) : left, top, width: size, height: size,
    transform: `scale(${(0.94 + 0.06 * p) * breathe * sc}) scaleY(${talk})`, transformOrigin: '50% 100%'}}>
    <Img src={staticFile(`cartoon/pose_${pose}.png`)} style={{width: '100%', height: '100%', filter: 'drop-shadow(0 14px 18px rgba(90,50,40,.25))'}}/>
  </div>;
};

// speech-bubble karaoke captions (reference caption system)
const Bubble: React.FC<{f: number}> = ({f}) => {
  const s = f / FPS;
  if (s >= END + 0.1) return null;
  const pg = D.pages.find((p: any) => s >= p.s - 0.05 && s < p.e) ?? (s < D.pages[0].s ? D.pages[0] : null);
  if (!pg) return null;
  const inK = pop(f, pg.s - 0.05, {damping: 14, stiffness: 320});
  return <div style={{position: 'absolute', left: 455, top: 1330, width: 490, display: 'flex', transform: `scale(${0.9 + 0.1 * inK})`, transformOrigin: '0% 50%'}}>
    <div style={{position: 'relative', background: '#fff', border: `4px solid ${INK}`, borderRadius: 22, boxShadow: `5px 6px 0 ${INK}`, padding: '16px 26px',
      fontFamily: F, fontWeight: 700, fontSize: 46, lineHeight: 1.15, color: INK, maxWidth: 490}}>
      <svg width={40} height={40} style={{position: 'absolute', left: -34, top: 26}}><path d="M38 4 L4 20 L38 34" fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round"/><rect x={36} y={6} width={8} height={26} fill="#fff"/></svg>
      {pg.w.map((i: number) => {
        const w = D.words[i], on = s >= w.s - 0.02;
        const txt = w.t.replace(/[.,:!]$/, '');
        return <span key={i} style={{marginRight: 12, display: 'inline-block', color: on ? (w.k ? '#fff' : INK) : '#B9B6C2', background: on && w.k ? PURPLE : 'transparent',
          borderRadius: 12, padding: w.k ? '0 10px' : 0}}>{txt}</span>;
      })}
    </div>
  </div>;
};

// ---------------------------------------------------------------- beat helpers
const Headline: React.FC<{f: number; at: number; out: number; l1: React.ReactNode; l2?: React.ReactNode; kicker?: string; top?: number}> = ({f, at, out, l1, l2, kicker, top = 210}) => {
  const s = f / FPS, a = at <= 0 ? 1 : ease(ramp(s, at, at + 0.3)), o = ramp(s, out, out + 0.3);
  if (s < at || o >= 1) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: top - 40 * o, textAlign: 'center', opacity: a * (1 - o), transform: `translateY(${(1 - a) * 30}px)`}}>
    {kicker && <div style={{fontFamily: F, fontWeight: 700, fontSize: 30, letterSpacing: 10, color: CORAL, marginBottom: 12}}>✻ {kicker}</div>}
    <div style={{fontFamily: F, fontWeight: 700, fontSize: 80, color: INK, lineHeight: 1.05}}>{l1}</div>
    {l2 && <div style={{fontFamily: F, fontWeight: 700, fontSize: 84, color: INK, lineHeight: 1.1, marginTop: 4}}>{l2}</div>}
  </div>;
};
const Acc: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, color: CORAL, fontSize: '1.15em'}}>{children}</span>;
const TypeWords: React.FC<{s: number; parts: [string, number][]}> = ({s, parts}) =>
  <>{parts.map(([t, at], i) => <span key={i} style={{opacity: s >= at ? 1 : 0, display: 'inline-block', transform: `translateY(${s >= at ? 0 : 20}px)`}}>{t}&nbsp;</span>)}</>;

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

// ---------------------------------------------------------------- the reel
export const Reel: React.FC<{fo?: number}> = ({fo}) => {
  const cf = useCurrentFrame(), f = fo ?? cf, s = f / FPS;
  const loopK = fo === undefined ? ramp(cf, D.frames - 11, D.frames - 1) : 0;
  const night = nightAt(s);

  // player placement per beat (centre x, centre y, width, tilt)
  type P = {x: number; y: number; w: number; r: number; o: number};
  const keys: [number, P][] = [
    [0, {x: 540, y: 860, w: 880, r: -4, o: 1}],
    [B2 - 0.1, {x: 540, y: 860, w: 880, r: -4, o: 1}],
    [B2 + 0.5, {x: 540, y: 560, w: 640, r: 3, o: 1}],
    [B3 - 0.2, {x: 540, y: 560, w: 640, r: 3, o: 1}],
    [B3 + 0.3, {x: 540, y: 790, w: 840, r: -3, o: 1}],
    [B4 - 0.1, {x: 540, y: 790, w: 840, r: -3, o: 1}],
    [B4 + 0.35, {x: -500, y: 760, w: 700, r: -12, o: 0}],
    [B5 - 0.35, {x: -500, y: 760, w: 700, r: -12, o: 0}],
    [B5 + 0.05, {x: 540, y: 760, w: 880, r: -2, o: 1}],
    [B6 - 0.1, {x: 540, y: 760, w: 880, r: -2, o: 1}],
    [B6 + 0.35, {x: 540, y: 560, w: 760, r: 2, o: 1}],
    [B7 - 0.1, {x: 540, y: 560, w: 760, r: 2, o: 1}],
    [B7 + 0.35, {x: 540, y: 740, w: 880, r: -2, o: 1}],
    [B8 + 0.55, {x: 540, y: 740, w: 880, r: -2, o: 1}],
    [B8 + 0.95, {x: 1600, y: 700, w: 700, r: 12, o: 0}],
  ];
  const kk = keys.reduce((a, k, i) => (s >= k[0] ? i : a), 0);
  const [t0, p0] = keys[kk], [t1, p1] = keys[Math.min(kk + 1, keys.length - 1)];
  const q = t1 > t0 ? io(ramp(s, t0, t1)) : 0;
  const P: P = {x: p0.x + (p1.x - p0.x) * q, y: p0.y + (p1.y - p0.y) * q, w: p0.w + (p1.w - p0.w) * q, r: p0.r + (p1.r - p0.r) * q, o: p0.o + (p1.o - p0.o) * q};
  const ph = P.w * 9 / 16 + 100;

  // 3D flip to code (B3) and exploded layers (B5)
  const flipIn = io(ramp(s, T(25) - 0.15, T(25) + 0.3)), flipOut = io(ramp(s, E(29) + 0.15, E(29) + 0.55));
  const flip = (flipIn - flipOut) * 180;
  const ex = io(ramp(s, T(42) - 0.1, T(42) + 0.6)) * (1 - io(ramp(s, T(46) - 0.1, T(46) + 0.5)));

  const showPlayer = P.o > 0.01 && s < B8 + 1.0;
  const playerScene = s < 1.3 ? <Leader s={s}/> : undefined;
  // length chip (hook): our episode length is a number in code; rolls to 10:00 = the length set in the prompt
  const roll = ease(ramp(s, 1.35, T(8) + 0.2));
  const tcRoll = `${Math.floor(roll * 10)}:${String(Math.floor((roll * 600) % 60)).padStart(2, '0')}`;

  return <AbsoluteFill style={{overflow: 'hidden'}}>
    {fo === undefined && <Sequence from={Math.round(D.lead * FPS)} layout="none"><Audio src={staticFile('cartoon/voice.wav')}/></Sequence>}
    <Bg s={s}/>
    <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', fontFamily: 'CtInter', fontWeight: 800, fontSize: 24, letterSpacing: 9, color: 'rgba(60,40,50,.55)'}}>WITHHAMMAD</div>

    {/* B1 hook headline (typed word by word from frame 0) */}
    <Headline f={f} at={0} out={B2 - 0.1} kicker="YOUTUBE" top={290}
      l1={<TypeWords s={s} parts={[['Claude', 0], ['Code', 0], ['for', T(7)], ['YouTube', T(8)]]}/>}
      l2={s >= T(4) - 0.1 ? <span><Acc>full cartoon</Acc> <span style={{opacity: s >= T(6) ? 1 : 0}}>episodes</span></span> : <span>&nbsp;</span>}/>

    {/* the player */}
    {showPlayer && <div style={{position: 'absolute', left: P.x - P.w / 2, top: P.y - ph / 2, width: P.w, opacity: P.o, perspective: 2200}}>
      <div style={{transform: `rotate(${P.r}deg) rotateY(${flip}deg)`, transformStyle: 'preserve-3d', position: 'relative'}}>
        <div style={{backfaceVisibility: 'hidden'}}>
          {ex > 0.001
            ? <div style={{width: P.w, height: ph, position: 'relative', perspective: 1600}}>
              {[0, 1, 2, 3].map((L) => <div key={L} style={{position: 'absolute', left: 0, top: 54, width: P.w, height: P.w * 9 / 16, borderRadius: 18, overflow: 'hidden',
                transform: `translateY(${(1.5 - L) * -150 * ex}px) translateX(${(L - 1.5) * 40 * ex}px) rotateX(${38 * ex}deg) rotateZ(${-6 * ex}deg) scale(${1 - 0.18 * ex})`,
                boxShadow: ex > 0.1 ? '0 18px 40px rgba(60,40,30,.25)' : undefined, background: L === 0 ? undefined : 'transparent'}}>
                <Scene t={s} night={night} layers={[L]} id={`L${L}`}/></div>)}
            </div>
            : <Player s={s} w={P.w} night={night} scene={playerScene} tc={s < B2 + 0.5 ? undefined : undefined} prog={s < 1.3 ? 0 : undefined}/>}
        </div>
        <div style={{position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden'}}>
          {flip > 1 && <CodeCard w={P.w} s={s} at={T(25)}/>}
        </div>
      </div>
      {/* length chip over the player (hook) */}
      {s > 1.35 && s < B2 + 0.3 && <div style={{position: 'absolute', left: P.w * 0.08, top: 100, transform: `rotate(-4deg) scale(${pop(f, 1.35)})`, opacity: 1 - ramp(s, B2, B2 + 0.3)}}>
        <Pill size={66} style={{fontFamily: MONO, fontWeight: 700, gap: 22}}><YtMark h={52}/>{tcRoll}<span style={{fontFamily: F, fontSize: 30, color: '#7A6F60'}}>episode</span></Pill>
      </div>}
      {/* code chip during the night relight (B7) */}
      {s > T(64) && s < B8 + 0.1 && <div style={{position: 'absolute', right: -10, top: 6, transform: `scale(${pop(f, T(64))}) rotate(3deg)`}}>
        <div style={{fontFamily: MONO, fontSize: 32, background: '#1D1F2B', color: '#E6E8F5', padding: '10px 18px', borderRadius: 12, border: `3px solid ${INK}`}}>
          data-night = <span style={{color: '#F2A65A'}}>{(night).toFixed(1)}</span></div></div>}
    </div>}

    {/* B2 proof: real, checkable numbers (replaces the reference's unverifiable 60,000 views / 3,000 comments) */}
    {s > B2 && s < B3 + 0.3 && (() => {
      const o = 1 - ramp(s, B3 - 0.1, B3 + 0.25);
      const stars = 80121 * ease(ramp(s, T(16) - 0.1, E(19)));
      return <div style={{position: 'absolute', left: 0, right: 0, top: 860, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: o}}>
        <div style={{transform: `scale(${pop(f, T(14) - 0.05)}) rotate(-2deg)`}}>
          <Pill size={40} bg="#1D1F2B" color="#fff" style={{fontFamily: MONO}}><svg width={36} height={36} viewBox="0 0 24 24"><path fill="#fff" d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>heygen-com/hyperframes</Pill></div>
        <div style={{transform: `scale(${pop(f, T(16) - 0.1)})`}}>
          <Pill size={72}><span style={{fontSize: 64}}>⭐</span><span style={{fontFamily: MONO, fontWeight: 700}}>{fmt(stars)}</span><span style={{color: PURPLE, fontSize: 46}}>GitHub stars</span></Pill></div>
        <div style={{transform: `scale(${pop(f, T(19))}) rotate(2deg)`}}>
          <Pill size={44} bg="#E9F8EE"><span style={{color: '#1F8A4C'}}>✓ free</span><span style={{color: '#7A6F60'}}>· Apache-2.0 licence</span></Pill></div>
        <div style={{fontFamily: MONO, fontSize: 24, color: '#6B6255', background: 'rgba(255,255,255,.75)', padding: '6px 16px', borderRadius: 999, opacity: ramp(s, T(19), T(19) + 0.3)}}>github.com · checked 7 Nov 2026</div>
        <Sparkles f={f} at={E(19) - 0.1} x={540} y={140} r={260}/>
      </div>;
    })()}

    {/* B3: "animator" struck, Claude badge */}
    {s > B3 - 0.1 && s < B4 + 0.2 && <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', gap: 40, opacity: 1 - ramp(s, B4 - 0.1, B4 + 0.2)}}>
      <div style={{position: 'relative', transform: `scale(${pop(f, B3 - 0.1)}) rotate(-3deg)`}}>
        <Pill size={58}><span style={{fontSize: 46}}>✏️</span>animator</Pill>
        <div style={{position: 'absolute', left: 0, top: 0}}><Strike f={f} at={T(21) + 0.05} w={330} h={90}/></div>
      </div>
      <div style={{transform: `scale(${pop(f, T(23) - 0.05)}) rotate(${(1 - pop(f, T(23) - 0.05)) * -90 + 6}deg)`}}>
        <Pill size={50} style={{gap: 14}}><ClaudeMark size={52}/>Claude Code</Pill></div>
    </div>}

    {/* B4: chat card -> story / characters / every scene */}
    {s > B4 && s < B5 + 0.2 && (() => {
      const o = 1 - ramp(s, B5 - 0.15, B5 + 0.15);
      const chatIn = pop(f, B4 + 0.05), note = io(ramp(s, T(33) - 0.15, E(33) + 0.1));
      const card = (at: number) => pop(f, at, {damping: 13, stiffness: 170});
      const story = card(T(37) - 0.1), chars = card(T(39) - 0.1), scenes = card(T(40) - 0.05);
      return <div style={{position: 'absolute', inset: 0, opacity: o}}>
        <div style={{position: 'absolute', left: 250, top: 250, transform: `scale(${chatIn}) rotate(-2deg)`}}>
          <Window w={580} title={<span style={{fontFamily: F}}>Claude</span>}>
            <div style={{padding: '30px 30px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
              <ClaudeMark size={74}/>
              <div style={{fontFamily: SERIF, fontSize: 52, color: INK}}>What should we make today?</div>
              <div style={{width: '100%', height: 84, borderRadius: 18, border: '2px solid #E2D8C8', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', boxSizing: 'border-box', justifyContent: 'space-between'}}>
                <span style={{fontFamily: F, fontSize: 30, color: note > 0.95 ? INK : '#B9B0A2'}}>{note > 0.95 ? 'a little elephant + a fallen star' : 'Ask Claude Code…'}</span>
                <div style={{width: 50, height: 50, borderRadius: 25, background: CLAUDE, color: '#fff', fontFamily: F, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>↑</div>
              </div>
            </div>
          </Window>
        </div>
        {note < 0.97 && <div style={{position: 'absolute', left: 120 + 160 * note, top: 470 - 110 * note, width: 250, padding: 18, background: '#FFE36E', boxShadow: '4px 8px 14px rgba(90,60,30,.25)',
          transform: `rotate(${-8 + 6 * note}deg) scale(${(1 - 0.5 * note) * pop(f, T(30))})`, fontFamily: HAND, fontSize: 38, lineHeight: 1.05, color: INK}}>a little elephant + a fallen star ⭐</div>}
        {/* story page */}
        <div style={{position: 'absolute', left: 20, top: 640, width: 380, height: 520, background: '#FFFDF6', borderRadius: 10, boxShadow: '0 20px 40px rgba(90,60,40,.25)',
          transform: `translateY(${(1 - story) * 400}px) rotate(${-6 + (1 - story) * -10}deg)`, opacity: Math.min(1, story * 2),
          backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 46px, #C9DDF0 46px 48px)', borderLeft: '4px solid #F2A3A3'}}>
          <div style={{position: 'absolute', left: -14, top: -22}}><Pill size={34} bg={CORAL} color="#fff">story</Pill></div>
          <div style={{fontFamily: HAND, fontSize: 52, color: INK, padding: '40px 0 0 34px', lineHeight: 1}}>Moti and the<br/>Fallen Star</div>
          <svg width={360} height={300} style={{position: 'absolute', left: 30, top: 170}}>
            {[0, 1, 2, 3, 4].map((i) => {
              const k = ramp(s, T(37) + 0.1 + i * 0.25, T(37) + 0.35 + i * 0.25);
              return <path key={i} d={`M0 ${20 + i * 48} ${Array.from({length: 13}, (_, j) => `q12 ${j % 2 ? 14 : -14} 24 0`).join(' ')}`} stroke={INK} strokeWidth={4} fill="none"
                strokeDasharray={420} strokeDashoffset={420 * (1 - k) + (i === 4 ? 160 : 0)}/>;
            })}
          </svg>
        </div>
        {/* character sheet */}
        <div style={{position: 'absolute', left: 420, top: 600, width: 530, height: 330, background: '#FFFDF6', borderRadius: 16, boxShadow: '0 20px 40px rgba(90,60,40,.25)',
          transform: `translateX(${(1 - chars) * 600}px) rotate(${3 + (1 - chars) * 12}deg)`, opacity: Math.min(1, chars * 2)}}>
          <div style={{position: 'absolute', right: -10, top: -24}}><Pill size={34} bg="#3F7DE8" color="#fff">characters</Pill></div>
          <svg viewBox="0 0 1200 700" width={530} height={312}>
            {(['walk', 'wave', 'trumpet', 'sit', 'sleep'] as Pose[]).map((p, i) => {
              const cx = 200 + (i % 3) * 400, cy = i < 3 ? 210 : 520;
              return <g key={p}><Elephant t={s} pose={p} scale={0.55} x={cx - 40} y={cy - 40} walking={p === 'walk'}/>
                <text x={cx} y={cy + 115} textAnchor="middle" fontFamily="CtHand" fontSize={56} fill="#5B5246">{p}</text></g>;
            })}
          </svg>
        </div>
        {/* storyboard: every scene */}
        <div style={{position: 'absolute', left: 420, top: 960, width: 530, height: 330, background: '#FFFDF6', borderRadius: 16, boxShadow: '0 20px 40px rgba(90,60,40,.25)',
          transform: `translateY(${(1 - scenes) * 600}px) rotate(${-2 + (1 - scenes) * -8}deg)`, opacity: Math.min(1, scenes * 2), padding: 20, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
          <div style={{position: 'absolute', left: -12, top: -26}}><Pill size={34} bg={ORANGE} color="#fff">every scene</Pill></div>
          {[0, 0.15, 0.35, 0.6, 0.85, 1].map((n, i) => <div key={i} style={{borderRadius: 8, overflow: 'hidden', border: '2px solid #D9CDB8', height: 132, opacity: ramp(s, T(41) - 0.1 + i * 0.07, T(41) + i * 0.07)}}>
            <Scene t={1 + i * 1.7} night={n} walking={false} ex={400 + i * 170} id={`sb${i}`}/></div>)}
        </div>
      </div>;
    })()}

    {/* B5: exploded paper layers + labels, then "video AI" struck */}
    {s > B5 && s < B6 + 0.2 && (() => {
      const o = 1 - ramp(s, B6 - 0.1, B6 + 0.2);
      const lab = (txt: string, at: number, x: number, y: number, side: 'l' | 'r') => {
        const p = pop(f, at), lo = 1 - ramp(s, T(46) - 0.1, T(46) + 0.3);
        return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${p})`, opacity: lo, transformOrigin: side === 'l' ? '100% 50%' : '0% 50%'}}>
          <Pill size={38} style={{fontFamily: F}}>{txt}</Pill></div>;
      };
      return <div style={{position: 'absolute', inset: 0, opacity: o}}>
        {lab('paper layers', T(42) + 0.1, 60, 420, 'l')}
        {lab('felt stitches', T(43), 600, 1010, 'r')}
        {lab('twinkling stars ✨', T(44), 560, 400, 'r')}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: ramp(s, T(46) + 0.2, T(46) + 0.4)}}>
          <div style={{transform: `scale(${pop(f, T(46) + 0.2)})`}}><Pill size={46} bg="#1D1F2B" color="#fff" style={{fontFamily: MONO}}>&lt;/&gt; all HTML + CSS</Pill></div></div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative', transform: `scale(${pop(f, T(48) - 0.15)}) rotate(2deg)`}}>
            <Pill size={56}>🎬 video AI</Pill>
            <div style={{position: 'absolute', left: 0, top: 0}}><Strike f={f} at={T(49)} w={330} h={90}/></div>
          </div></div>
      </div>;
    })()}

    {/* B6: audio track stack */}
    {s > B6 && s < B7 + 0.2 && (() => {
      const o = 1 - ramp(s, B7 - 0.1, B7 + 0.2);
      const bar = (i: number, at: number, label: string, icon: string, col: string, extra?: React.ReactNode) => {
        const k = io(ramp(s, at - 0.15, at + 0.25));
        return <div style={{position: 'absolute', left: 90 + (1 - k) * -900, top: 900 + i * 128, width: 850, height: 100, transform: `rotate(${-2 + i * 1.5}deg)`, display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 260}}><Pill size={38}>{label} {icon}</Pill></div>
          <div style={{flex: 1, height: 84, borderRadius: 20, background: col, border: `4px solid ${INK}`, boxShadow: `5px 6px 0 ${INK}`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', overflow: 'hidden'}}>
            {Array.from({length: 34}, (_, j) => <div key={j} style={{width: 7, borderRadius: 4, background: 'rgba(255,255,255,.9)',
              height: 10 + Math.abs(Math.sin(j * 1.7 + s * (6 + i * 2))) * 52 * (i === 1 ? 0.6 : 1)}}/>)}
            {extra}
          </div></div>;
      };
      return <div style={{position: 'absolute', inset: 0, opacity: o}}>
        {bar(0, T(54) - 0.1, 'narrator', '🎙', '#E5533D')}
        {bar(1, T(55), 'music', '♪', '#3F7DE8')}
        {bar(2, T(57), 'sound FX', '🔔', ORANGE, <div style={{position: 'absolute', right: 40, display: 'flex', gap: 10}}>
          {['ding!', 'pop!', 'whoosh'].map((c, j) => <div key={c} style={{transform: `scale(${pop(f, T(58) + j * 0.15)})`, background: '#FFE36E', borderRadius: 999, padding: '4px 14px', fontFamily: F, fontSize: 26, border: `3px solid ${INK}`}}>{c}</div>)}</div>)}
      </div>;
    })()}

    {/* B7: "Want a change?" + prompt bar "make it night" */}
    <Headline f={f} at={B7 - 0.05} out={B8 - 0.3} top={290} l1={<span>Want a <Acc>change?</Acc></span>}/>
    {s > T(62) - 0.3 && s < B8 + 0.1 && (() => {
      const txt = 'make it night', n = Math.floor(txt.length * ramp(s, T(64) - 0.05, E(66) - 0.05));
      const sent = s > E(66) - 0.05;
      return <div style={{position: 'absolute', left: 90, top: 1050, width: 900, transform: `scale(${pop(f, T(62) - 0.3)})`, opacity: 1 - ramp(s, B8 - 0.1, B8 + 0.1)}}>
        <div style={{height: 104, borderRadius: 26, background: '#fff', border: `4px solid ${INK}`, boxShadow: `5px 6px 0 ${INK}`, display: 'flex', alignItems: 'center', padding: '0 20px 0 28px', gap: 18}}>
          <ClaudeMark size={46}/>
          <div style={{flex: 1, fontFamily: F, fontSize: 48, color: INK}}>{txt.slice(0, n)}<span style={{opacity: sent || Math.floor(s * 3) % 2 ? 0 : 1, color: CLAUDE}}>|</span></div>
          <div style={{width: 70, height: 70, borderRadius: 35, background: sent ? CORAL : '#E8E1D6', color: '#fff', fontFamily: F, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${sent ? 1 + 0.25 * (1 - ramp(s, E(66) - 0.05, E(66) + 0.25)) : 1})`}}>↑</div>
        </div></div>;
    })()}

    {/* B8: one catch — copy-paste templates are not paid; tell your own story */}
    {s > B8 && s < B9 + 0.2 && (() => {
      const o = 1 - ramp(s, B9 - 0.1, B9 + 0.2);
      const fan = io(ramp(s, T(69) - 0.2, T(69) + 0.4)), grey = ramp(s, T(73), T(74));
      const story = io(ramp(s, T(75) - 0.1, T(75) + 0.5));
      const coin = pop(f, T(70) - 0.1), slash = ease(ramp(s, T(71) - 0.05, T(71) + 0.25));
      return <div style={{position: 'absolute', inset: 0, opacity: o}}>
        <Headline f={f} at={B8 + 0.3} out={B9 - 0.1} top={280} kicker="ONE CATCH" l1={<span>copy-paste <Acc>templates</Acc></span>}/>
        <div style={{position: 'absolute', left: 540, top: 820, opacity: (1 - story) * ramp(s, B8 + 0.8, B8 + 1.1)}}>
          {Array.from({length: 7}, (_, i) => {
            const a = (i - 3) * 9.5 * fan;
            return <div key={i} style={{position: 'absolute', left: -180, top: -120, width: 360, transformOrigin: '50% 260%', transform: `rotate(${a}deg)`, filter: `grayscale(${grey}) brightness(${1 - grey * 0.1})`}}>
              <div style={{background: '#fff', borderRadius: 14, border: `3px solid ${INK}`, overflow: 'hidden', boxShadow: '0 10px 20px rgba(60,40,30,.2)'}}>
                <div style={{height: 202}}><Scene t={2} night={0} walking={false} id={`fan${i}`}/></div>
                <div style={{fontFamily: F, fontSize: 26, padding: '6px 12px', color: INK}}>Elephant Song #{i + 1} (template)</div>
              </div></div>;
          })}
        </div>
        <div style={{position: 'absolute', left: 540 - 85, top: 1090, transform: `scale(${coin})`, opacity: 1 - story}}>
          <div style={{width: 170, height: 170, borderRadius: 85, background: 'radial-gradient(circle at 35% 30%, #FFE58A, #F2B636)', border: `5px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: 100, color: '#8A5A12'}}>$</div>
          <svg width={220} height={220} style={{position: 'absolute', left: -25, top: -25}}><line x1={20} y1={200} x2={20 + 180 * slash} y2={200 - 180 * slash} stroke={CORAL} strokeWidth={16} strokeLinecap="round"/></svg>
          <div style={{position: 'absolute', left: 180, top: 50, transform: `scale(${pop(f, T(71) + 0.1)}) rotate(-6deg)`}}><Pill size={36} bg={CORAL} color="#fff">not monetised</Pill></div>
        </div>
        {story > 0 && <div style={{position: 'absolute', left: 540 - 430, top: 560, width: 860, height: 520, transform: `scale(${0.6 + 0.4 * story}) rotate(${(1 - story) * -8}deg)`, opacity: story, display: 'flex', borderRadius: 14,
          boxShadow: '0 26px 50px rgba(90,60,40,.3)', overflow: 'hidden', border: `4px solid ${INK}`}}>
          <div style={{flex: 1, background: '#FFFDF6', padding: 34, fontFamily: HAND, fontSize: 56, color: INK, lineHeight: 1.05, backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 56px, #E7DCC8 56px 58px)'}}>Moti and the<br/>Fallen Star<div style={{fontSize: 38, marginTop: 30, color: '#6B6255'}}>Moti finds a star that fell into the village…</div></div>
          <div style={{flex: 1, background: '#FFFDF6', borderLeft: '3px solid #E2D6C2', padding: 20}}><div style={{borderRadius: 10, overflow: 'hidden', height: 240}}><Scene t={s} night={1} id="book"/></div>
            <div style={{fontFamily: HAND, fontSize: 40, color: '#6B6255', marginTop: 18}}>…and walks it home.</div></div>
          <div style={{position: 'absolute', left: 300, top: 440, transform: `rotate(-4deg) scale(${pop(f, T(76))})`}}><Pill size={44} bg={ORANGE} color="#fff">⭐ your own story</Pill></div>
        </div>}
      </div>;
    })()}

    {/* B9: follow + comment CARTOON + DM card */}
    {s > B9 - 0.1 && (() => {
      const endK = ease(ramp(s, END, END + 0.5));
      const fol = pop(f, B9 - 0.1), clicked = s > T(80) + 0.05;
      const kw = 'CARTOON', n = Math.ceil(kw.length * ramp(s, T(82), E(83)));
      const dm = pop(f, T(86) - 0.1);
      const top = 330 - 70 * endK;
      return <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, transform: `scale(${1 - 0.12 * endK})`, transformOrigin: '50% 0%'}}>
        <div style={{transform: `scale(${fol})`, position: 'relative'}}>
          <Pill size={44} style={{gap: 20}}>
            <div style={{width: 64, height: 64, borderRadius: 32, overflow: 'hidden', border: `3px solid ${INK}`, background: '#F6C9AE'}}><Img src={staticFile('cartoon/pose_thumbs.png')} style={{width: 120, marginLeft: -28, marginTop: -14}}/></div>
            @withhammad.ai
            <div style={{background: clicked ? '#EFEAF8' : '#4F7CFF', color: clicked ? INK : '#fff', borderRadius: 999, padding: '6px 22px', fontSize: 34, border: `3px solid ${INK}`}}>{clicked ? 'Following ✓' : 'Follow'}</div>
          </Pill>
          {!clicked && <svg width={60} height={70} style={{position: 'absolute', right: 40 - 40 * (1 - ramp(s, B9 - 0.1, T(80))), top: 60 + 60 * (1 - ramp(s, B9 - 0.1, T(80)))}}><path d="M6 4 L6 52 L18 40 L28 62 L36 58 L26 37 L44 37 Z" fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round"/></svg>}
          <Sparkles f={f} at={T(80) + 0.05} x={520} y={50} r={120}/>
        </div>
        <div style={{transform: `scale(${pop(f, T(81))}) rotate(-1.5deg)`, background: '#fff', borderRadius: 34, border: `5px solid ${INK}`, boxShadow: `8px 10px 0 ${INK}`, padding: '34px 70px 30px', textAlign: 'center'}}>
          <div style={{fontFamily: F, fontSize: 84, color: INK, lineHeight: 1}}>Comment</div>
          <div style={{marginTop: 18, display: 'inline-block', background: CORAL, color: '#fff', fontFamily: F, fontSize: 92, padding: '6px 44px', borderRadius: 999, border: `5px solid ${INK}`, minWidth: 420}}>
            “{kw.slice(0, n)}<span style={{opacity: n < kw.length ? 1 : 0}}>|</span>”</div>
          <svg viewBox="0 0 1200 220" width={560} height={102} style={{display: 'block', margin: '16px auto 0'}}>
            {[0, 1, 2, 3, 4].map((i) => <Elephant key={i} t={s + i * 0.3} pose={i === 2 ? 'trumpet' : 'walk'} scale={0.34} x={130 + i * 240} y={80} walking/>)}
          </svg>
          <Sparkles f={f} at={E(83)} x={330} y={150} r={220}/>
        </div>
        <div style={{transform: `scale(${dm}) rotate(1.5deg)`}}>
          <Pill size={42} bg="#FFF6E8"><span>📩</span>full guide in your DMs</Pill></div>
      </div>;
    })()}

    <Presenter f={f}/>
    <Bubble f={f}/>
    {loopK > 0 && <AbsoluteFill style={{opacity: loopK}}><Reel fo={0}/></AbsoluteFill>}
  </AbsoluteFill>;
};
