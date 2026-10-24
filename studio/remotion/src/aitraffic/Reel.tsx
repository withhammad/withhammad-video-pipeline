import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// AI-traffic reel (job b55491077ab1): the reference's edit in the same order (Allie K Miller, YouTube Short MxmzqsoaeDY,
// analysis/visual.md): hook card, ChatGPT tile, 2x / 3x struck out, yellow 4.4x, sticker pops, maroon phone cut-away with
// the speaker cut-out transition, background swap, chat overlay, maroon form cut-away, name tag, word-by-word captions.
// Ours adds the real recordings from the spec as splits (Semrush study, GA4 help x2, AI check), step pills, a source on
// the stat and the comment-keyword ending. Timing: data.json (build-reel.py in the job).
loadFont({family: 'AtInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'AtInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'AtInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'AtArchivo', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'AtSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'AtInter, Arial, sans-serif', BIG = 'AtArchivo, AtInter, Arial, sans-serif', SERIF = 'AtSerif, Georgia, serif';
const MONO = 'Menlo, ui-monospace, monospace';
const YELLOW = '#FFD60A', RED = '#FF3B30', INK = '#111111';
const file = (s: string) => staticFile('aitraffic/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 12, stiffness: 170}}));

type Unit = {kind: string; from: number; to: number; [k: string]: any};
type Ov = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// The take (and its RVM matte) on the output clock: one silent pause is cut at D.cut.at.
const Take: React.FC<{alpha?: boolean; style: React.CSSProperties}> = ({alpha, style}) => {
  const src = file(alpha ? 'take_alpha.webm' : 'take.mp4');
  return <>
    <Sequence from={0} durationInFrames={D.cut.at} layout="none"><OffthreadVideo src={src} muted transparent={alpha} style={style}/></Sequence>
    <Sequence from={D.cut.at} layout="none"><OffthreadVideo src={src} muted transparent={alpha} trimBefore={D.cut.at + D.cut.skip} style={style}/></Sequence>
  </>;
};

const Brand: React.FC<{top: number; left?: number}> = ({top, left = 48}) =>
  <div style={{position: 'absolute', left, top, fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 6, color: '#ffffffb8', textShadow: '0 1px 6px #0008'}}>WITHHAMMAD</div>;

// ---------------------------------------------------------------- base layouts
const Face: React.FC<{u: Unit}> = ({u}) => <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
  <AbsoluteFill style={{transform: `scale(${u.zoom || 1})`, transformOrigin: '50% 32%'}}>
    <Take style={{width: 1080, height: 1920}}/>
  </AbsoluteFill>
  {u.from >= D.cut.at ? null : <Brand top={1440}/>}
</AbsoluteFill>;

const LOGOS: Record<string, [string, number, number]> = {semrush: ['semrush.svg', 200, 27], ga: ['google-analytics.svg', 200, 69]};
const S = 0.72, TAKE_W = 1080 * S, TAKE_X = (1080 - TAKE_W) / 2, TAKE_Y = 1010, CARD_Y = 1340;
const PANEL = {x: 60, y: 330, w: 960, h: 670};
const Split: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, k = PANEL.h / u.h, recW = 1080 * k, recH = 1800 * k;
  const enter = ease(ramp(n, 0, 8));
  const logo = u.logo ? LOGOS[u.logo] : null;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: 'scale(1.18)', filter: 'blur(30px) brightness(0.5) saturate(0.9)'}}><Take style={{width: 1080, height: 1920}}/></AbsoluteFill>
    <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y + (1 - enter) * 60, width: PANEL.w, height: PANEL.h, borderRadius: 28, overflow: 'hidden',
      background: u.src.startsWith('r4') ? '#f6f5f1' : '#fff', boxShadow: '0 30px 80px rgba(0,0,0,.5)', opacity: enter}}>
      <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
        <OffthreadVideo src={file(u.src)} muted trimBefore={Math.round(u.srcStart * FPS)} playbackRate={u.rate || 1}
          style={{position: 'absolute', left: (PANEL.w - recW) / 2, top: -u.y0 * k, width: recW, height: recH}}/></Sequence>
    </div>
    {logo ? <div style={{position: 'absolute', left: PANEL.x + PANEL.w - logo[1] - 60, top: PANEL.y - 44, background: '#fff', borderRadius: 999,
      padding: '18px 34px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', opacity: enter, display: 'flex', alignItems: 'center'}}>
      <Img src={file(logo[0])} style={{width: logo[1], height: logo[2]}}/></div> : null}
    <div style={{position: 'absolute', left: TAKE_X, top: CARD_Y, width: TAKE_W, height: 1920 - CARD_Y + 120, borderRadius: 110, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: TAKE_Y - CARD_Y, width: TAKE_W, height: 1920 * S}}><Take style={{width: TAKE_W, height: 1920 * S}}/></div>
    </div>
    <div style={{position: 'absolute', left: TAKE_X, top: TAKE_Y, width: TAKE_W, height: CARD_Y - TAKE_Y + 1, overflow: 'hidden'}}>
      <Take alpha style={{position: 'absolute', left: 0, top: 0, width: TAKE_W, height: 1920 * S}}/>
    </div>
  </AbsoluteFill>;
};

// Maroon cut-away: the speaker is cut out over the backdrop, then the recording rises in (reference 21.5 s and 53.7 s).
const Cut: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from;
  const phone = !!u.phone;
  const sc = phone ? 1.12 : 1, top = phone ? -224 : -150, left = (1080 - 1080 * sc) / 2;
  const gx = 540, gy = phone ? top + 0.3 * 1800 * sc : top + 0.2 * 1800, gr = (phone ? 1371 : 1538) * sc;
  const c0 = phone ? '#4a1626' : '#3a1420';
  const rise = pop(f, u.from + 7), speaker = 1 - ramp(n, 9, 16);
  return <AbsoluteFill style={{background: `radial-gradient(circle ${gr}px at ${gx}px ${gy}px, ${c0}, #14070b)`, overflow: 'hidden'}}>
    {speaker > 0 ? <AbsoluteFill style={{opacity: speaker, transform: `scale(${1 - 0.06 * ramp(n, 0, 16)})`, transformOrigin: '50% 60%'}}>
      <Take alpha style={{width: 1080, height: 1920}}/></AbsoluteFill> : null}
    <div style={{position: 'absolute', left, top, width: 1080 * sc, height: 1800 * sc, transform: `translateY(${(1 - rise) * 900}px)`, opacity: Math.min(1, rise * 3)}}>
      <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
        <OffthreadVideo src={file(u.src)} muted trimBefore={Math.round(u.srcStart * FPS)} playbackRate={u.rate || 1} style={{width: 1080 * sc, height: 1800 * sc}}/></Sequence>
    </div>
  </AbsoluteFill>;
};

// Background swap (reference 28.4 s: speaker keyed over a plant wall with a laptop). Ours: a clean RVM cut-out over a
// sharp drawn home-office plate with a laptop showing a plain search-results page, light matched from the left.
const Leaf: React.FC<{x: number; y: number; r: number; s: number; c: string}> = ({x, y, r, s, c}) =>
  <svg width={260 * s} height={300 * s} viewBox="0 0 260 300" style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg)`}}>
    <defs><linearGradient id={`lg${c}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c}/><stop offset="1" stopColor="#1F4A26"/></linearGradient></defs>
    <path d="M130 290 C40 250 0 160 30 80 C60 20 120 0 130 0 C140 0 200 20 230 80 C260 160 220 250 130 290Z" fill={`url(#lg${c})`}/>
    {[60, 110, 160, 210].map(yy => <path key={yy} d={`M130 ${yy + 40} L${yy % 100 ? 40 : 220} ${yy}`} stroke="#EFE6D6" strokeWidth={14} opacity={0.9}/>)}
    <path d="M130 290 L130 20" stroke="#2f5a32" strokeWidth={5}/></svg>;
const Swap: React.FC = () => <AbsoluteFill style={{overflow: 'hidden', background: '#EFE6D6'}}>
  <AbsoluteFill style={{filter: 'blur(5px)', transform: 'scale(1.02)'}}>
    <AbsoluteFill style={{background: 'linear-gradient(100deg, #FBF5EA 0%, #F0E6D4 45%, #E2D5BF 100%)'}}/>
    <div style={{position: 'absolute', left: 30, top: 120, width: 360, height: 1060, borderRadius: 8, background: 'linear-gradient(180deg, #FFFFFF, #F7F1E4)',
      boxShadow: 'inset 0 0 0 16px #E6DBC6, 0 0 160px 60px rgba(255,250,236,.9)'}}>
      <div style={{position: 'absolute', left: 16, top: 16, right: 16, bottom: 16, background: 'linear-gradient(180deg, #CFE2EC 0%, #E9F0EA 50%, #CFDDBF 100%)', opacity: 0.6}}/>
      <div style={{position: 'absolute', left: 164, top: 16, width: 32, bottom: 16, background: '#E6DBC6'}}/></div>
    <div style={{position: 'absolute', right: -80, top: 140, width: 560, height: 760}}>
      {[[200, 0, -20, 1.3, '#4C8A52'], [40, 150, -55, 1.25, '#3F7A46'], [250, 260, 25, 1.4, '#356B3C'], [90, 420, -35, 1.3, '#467F4B']]
        .map(([x, y, r, sz, c], i) => <Leaf key={i} x={x as number} y={y as number} r={r as number} s={sz as number} c={c as string}/>)}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1040, bottom: 0, background: 'linear-gradient(180deg, #CDAA7F, #B08A60)'}}/>
  </AbsoluteFill>
  <div style={{position: 'absolute', left: 735, top: 760, width: 380, height: 260, borderRadius: 16, background: '#2B2D31', padding: 10, transform: 'perspective(900px) rotateY(-22deg)',
    boxShadow: '0 24px 50px rgba(0,0,0,.35)', filter: 'blur(1.2px)'}}>
    <div style={{width: '100%', height: '100%', borderRadius: 7, background: '#fff', padding: '16px 18px', boxSizing: 'border-box'}}>
      <div style={{height: 24, borderRadius: 12, border: '2px solid #DADCE0', marginBottom: 14}}/>
      {[0, 1, 2, 3].map(i => <div key={i} style={{marginBottom: 12}}>
        <div style={{width: 110, height: 6, background: '#C7CBD1', borderRadius: 3, marginBottom: 5}}/>
        <div style={{width: 230 - i * 18, height: 11, background: '#1A0DAB', borderRadius: 3, marginBottom: 5, opacity: 0.85}}/>
        <div style={{width: 300, height: 6, background: '#E1E3E6', borderRadius: 3}}/></div>)}</div></div>
  <div style={{position: 'absolute', left: 700, top: 1015, width: 460, height: 30, background: '#A2A5AB', borderRadius: '0 0 26px 26px', transform: 'perspective(900px) rotateY(-22deg)', filter: 'blur(1.2px)'}}/>
  <Take alpha style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}/>
  <Brand top={1440}/>
</AbsoluteFill>;

// ---------------------------------------------------------------- overlays
const ICONS: Record<string, React.ReactNode> = {
  bot: <><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  funnel: <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  megaphone: <><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
};
const sideX = (side: string, size: number) => (side === 'left' ? 70 : 1080 - 70 - size);

const Icon: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), size = 160;
  return <div style={{position: 'absolute', left: sideX(o.side, size), top: o.y ?? 250, width: size, height: size, borderRadius: 999, background: YELLOW,
    boxShadow: '0 12px 30px rgba(0,0,0,.35)', transform: `scale(${p})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <svg width={92} height={92} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{ICONS[o.icon]}</svg>
    {o.icon === 'funnel' ? <div style={{position: 'absolute', right: -6, bottom: -6, width: 62, height: 62, borderRadius: 99, background: '#fff', border: `4px solid ${YELLOW}`,
      fontFamily: SANS, fontWeight: 900, fontSize: 40, color: '#1E8E3E', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>$</div> : null}
  </div>;
};

const Tile: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), size = 180;
  return <div style={{position: 'absolute', left: sideX(o.side, size), top: 250, width: size, height: size, borderRadius: 40, background: '#fff',
    boxShadow: '0 14px 34px rgba(0,0,0,.35)', transform: `scale(${p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
    <Img src={file(o.img)} style={{width: 100, height: 100}}/>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, color: INK}}>{o.label}</div></div>;
};

const Hook: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const out = ramp(f, o.to - 5, o.to);
  return <div style={{position: 'absolute', top: 1110, left: 0, right: 140, display: 'flex', justifyContent: 'flex-end', opacity: 1 - out,
    transform: `scale(${1 + 0.025 * ramp(f, 0, o.to)})`}}>
    <div style={{background: '#fff', borderRadius: 12, padding: '22px 40px', boxShadow: '0 16px 40px rgba(0,0,0,.35)', textAlign: 'center',
      fontFamily: SERIF, fontWeight: 700, fontSize: 54, lineHeight: 1.2, color: INK}}>
      <div><span style={{letterSpacing: 1}}>MARKETERS:</span>{o.line1.replace('MARKETERS:', '')}</div><div>{o.line2}</div></div></div>;
};

const Mult: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), s = ease(ramp(f, o.strike, o.strike + 6));
  return <div style={{position: 'absolute', top: 228, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{position: 'relative', fontFamily: BIG, fontSize: 210, lineHeight: 1, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,.55)'}}>{o.text}
      {f >= o.strike ? <div style={{position: 'absolute', left: -20, top: '52%', width: `${(s * 100) + 15}%`, height: 22, borderRadius: 11, background: RED,
        transform: 'rotate(-14deg)', transformOrigin: '0 50%', boxShadow: '0 4px 12px rgba(0,0,0,.35)'}}/> : null}</div></div>;
};

const Stat: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), k = ease(ramp(f, o.from, o.land));
  const v = (1 + 3.4 * k).toFixed(1);
  const chip = pop(f, o.land);
  return <>
    <div style={{position: 'absolute', top: 226, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.5 + 0.5 * p})`, opacity: Math.min(1, p * 2),
      fontFamily: BIG, fontSize: 250, lineHeight: 1, color: YELLOW, textShadow: '0 8px 28px rgba(0,0,0,.55)', fontVariantNumeric: 'tabular-nums'}}>{v}x</div>
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: chip}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff', background: 'rgba(17,17,17,.78)', borderRadius: 999, padding: '10px 26px',
        display: 'flex', alignItems: 'center', gap: 14}}>
        <Img src={file('semrush-white.svg')} style={{height: 26, width: 195}}/><span style={{opacity: 0.7}}>|</span>conversion vs organic · Jul 2025</div></div>
  </>;
};

const Chat: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), r = pop(f, o.reply);
  const typed = o.a.slice(0, Math.max(0, Math.floor((f - o.reply) * 1.4)));
  return <div style={{position: 'absolute', top: 236, left: 110, width: 860, transform: `translateY(${(1 - p) * -40}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: 'rgba(28,28,30,.92)', borderRadius: 26, padding: '16px 26px', boxShadow: '0 12px 30px rgba(0,0,0,.35)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: SANS, fontWeight: 600, fontSize: 22, color: '#ffffffa0'}}>
        <Img src={file('chatgpt.svg')} style={{width: 24, height: 24, filter: 'invert(1)'}}/>ChatGPT</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#fff', marginTop: 4}}>{o.q}</div></div>
    {f >= o.dots && f < o.reply ? <div style={{marginTop: 12, marginLeft: 330, width: 110, height: 52, borderRadius: 26, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
      {[0, 1, 2].map(i => <div key={i} style={{width: 12, height: 12, borderRadius: 6, background: '#888', opacity: 0.4 + 0.6 * Math.abs(Math.sin((f / 6) + i))}}/>)}</div> : null}
    {f >= o.reply ? <div style={{marginTop: 12, marginLeft: 60, marginRight: 60, background: '#fff', borderRadius: 24, padding: '14px 24px', transform: `scale(${0.9 + 0.1 * r})`,
      fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK, minHeight: 41}}>{typed}</div> : null}
  </div>;
};

const Pill: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from);
  return <div style={{position: 'absolute', top: 236, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * -30}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: YELLOW, borderRadius: 999, padding: '14px 36px', fontFamily: SANS, fontWeight: 900, fontSize: 44, color: INK, boxShadow: '0 10px 28px rgba(0,0,0,.35)'}}>{o.text}</div></div>;
};

const Chip: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from);
  return <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: '#fff', borderRadius: 22, padding: '16px 30px', boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 20}}>
      <Img src={file('google-analytics.svg')} style={{width: 150, height: 52}}/>
      <div><div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: '#5f6368'}}>{o.label}</div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: INK}}>{o.text}</div></div></div></div>;
};

const Name: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const a = pop(f, o.from), b = pop(f, o.from + 4), out = ramp(f, o.to - 4, o.to);
  return <div style={{position: 'absolute', top: 1170, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 1 - out}}>
    <div style={{background: '#fff', padding: '8px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 58, color: INK, transform: `translateX(${(1 - a) * -120}px)`, opacity: a}}>HAMMAD YOUSUF</div>
    <div style={{background: YELLOW, padding: '8px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 40, color: INK, transform: `translateX(${(1 - b) * 120}px)`, opacity: b}}>AI MARKETING AUTOMATION · DUBAI</div></div>;
};

// call-to-action skill, ending A: a clean copy of the native comment box types the keyword, then the DM + link card.
const Cta: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const up = pop(f, o.from), word = 'AITRAFFIC';
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - o.typeAt) * 8 / FPS) + 1)));
  const dm = pop(f, o.dmAt), card = pop(f, o.dmAt + 9);
  return <>
    <div style={{position: 'absolute', left: 70, right: 150, top: 1110, transform: `translateY(${(1 - up) * 500}px)`, background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.4)', padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
      <Img src={file('avatar_face.jpg')} style={{width: 72, height: 72, borderRadius: 99}}/>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: typed && f >= o.typeAt ? 800 : 600, fontSize: 44, color: f >= o.typeAt ? INK : '#8e8e93'}}>
        {f >= o.typeAt ? typed : 'Add a comment…'}{f >= o.typeAt && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= o.dmAt ? <div style={{position: 'absolute', left: 120, top: 1300, transform: `scale(${dm})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: INK}}>Here's my AI traffic setup guide</div> : null}
    {f >= o.dmAt + 9 ? <div style={{position: 'absolute', left: 120, top: 1384, width: 640, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 84, height: 84, borderRadius: 16, background: YELLOW, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BIG, fontSize: 30, color: INK}}>4.4x</div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK}}>AI traffic setup guide</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources/ai-traffic-ga4</div></div></div> : null}
  </>;
};

const FACEISH = new Set(['face', 'swap']);
const Overlays: React.FC<{f: number; u: Unit}> = ({f, u}) => <>{D.overlays.filter((o: Ov) => f >= o.from && f < o.to).map((o: Ov, i: number) => {
  const onFace = FACEISH.has(u.kind);
  switch (o.kind) {
    case 'hook': return <Hook key={i} o={o} f={f}/>;
    case 'tile': return onFace ? <Tile key={i} o={o} f={f}/> : null;
    case 'icon': return onFace ? <Icon key={i} o={o} f={f}/> : null;
    case 'mult': return onFace ? <Mult key={i} o={o} f={f}/> : null;
    case 'stat': return onFace ? <Stat key={i} o={o} f={f}/> : null;
    case 'chat': return onFace ? <Chat key={i} o={o} f={f}/> : null;
    case 'chip': return onFace ? <Chip key={i} o={o} f={f}/> : null;
    case 'pill': return <Pill key={i} o={o} f={f}/>;
    case 'name': return <Name key={i} o={o} f={f}/>;
    case 'cta': return <Cta key={i} o={o} f={f}/>;
    default: return null;
  }
})}</>;

// ---------------------------------------------------------------- captions: word-by-word build (spoken white, next 45 %)
const CAPY: Record<string, number> = {face: 1300, swap: 1300, split: 1068, cut: 1300};
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const y = u.kind === 'cut' && u.phone ? 1410 : CAPY[u.kind] ?? 1300;
  const size = u.kind === 'split' ? 62 : 76;
  const lines: any[][] = [[]];
  c.words.forEach((w: any) => { lines[lines.length - 1].push(w); if (w.br) lines.push([]); });
  return <div style={{position: 'absolute', left: 40, right: 40, top: y, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: SANS, fontWeight: 800,
    fontSize: size, lineHeight: 1.12, letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,.55), 0 0 2px rgba(0,0,0,.4)'}}>
    {lines.filter(l => l.length).map((l, i) => <div key={i} style={{whiteSpace: 'nowrap'}}>{l.map((w: any, j: number) =>
      <span key={j} style={{color: f >= w.at ? (w.emph ? YELLOW : '#fff') : 'rgba(255,255,255,.45)'}}>{j ? ' ' : ''}{w.text}</span>)}</div>)}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: '#000', fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {u.kind === 'face' ? <Face u={u}/> : null}
    {u.kind === 'split' ? <Split u={u} f={f}/> : null}
    {u.kind === 'cut' ? <Cut u={u} f={f}/> : null}
    {u.kind === 'swap' ? <Swap/> : null}
    <Overlays f={f} u={u}/>
    <Captions f={f} u={u}/>
  </AbsoluteFill>;
};
