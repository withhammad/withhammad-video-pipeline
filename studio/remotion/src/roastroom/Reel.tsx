import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Roast Room reel (job 23519e29c243): the reference's beats in the same order (Nate Herk, LinkedIn, analysis/spec.md),
// re-cut from his 16:9 desktop demo into a 9:16 reel. One recording card at a time (our own recordings of the real
// Roast Room replaying its shipped example council, and the real GitHub pages), a crop that drifts inside each unit and
// a new crop every 2-4 s, a section pill, word-by-word captions, the scores and seat counts on their words, and the
// comment-keyword ending. Timing: data.json (build-reel.py in the job).
loadFont({family: 'RrInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'RrInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'RrInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'RrArchivo', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});

const D: any = data;
const FPS = 30;
const SANS = 'RrInter, Arial, sans-serif', BIG = 'RrArchivo, RrInter, Arial, sans-serif';
const MONO = 'Menlo, ui-monospace, monospace';
const YELLOW = '#FFD60A', BLUE = '#2E7BFF', INK = '#0B1020', NAVY = '#070B16';
const file = (s: string) => staticFile('roastroom/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 12, stiffness: 170}}));

type Unit = {from: number; to: number; src: string; srcStart: number; rate: number; crop: number[]; crop2: number[]; label: string | null; cta: boolean};
type Ov = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

const PANEL = {x: 40, y: 400, w: 1000, h: 880};

// The recording card: the source (1080 px wide) is scaled so the crop [x, y, w] fills the panel; the crop eases
// from `crop` to `crop2` over the unit (slow push-in or pan), and the card rises in at each cut.
const Card: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, k = ease(ramp(n, 0, u.to - u.from));
  const [x, y, w] = u.crop.map((v, i) => v + (u.crop2[i] - v) * k);
  const s = PANEL.w / w;
  const srcH = u.src.startsWith('g_agents') ? 1620 : 1080;
  const enter = u.from === 0 ? 1 : ease(ramp(n, 0, 7));   // frame 0 is the hook: no fade-in
  return <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y + (1 - enter) * 40, width: PANEL.w, height: PANEL.h, borderRadius: 30,
    overflow: 'hidden', background: '#0d1424', boxShadow: `0 30px 90px rgba(0,0,0,.6), 0 0 0 2px rgba(46,123,255,.35), 0 0 60px rgba(46,123,255,.18)`,
    opacity: Math.min(1, 0.4 + enter)}}>
    <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
      <OffthreadVideo src={file(u.src)} muted trimBefore={Math.round(u.srcStart * FPS)} playbackRate={u.rate || 1}
        style={{position: 'absolute', left: -x * s, top: -y * s, width: 1080 * s, height: srcH * s}}/></Sequence>
  </div>;
};

const Backdrop: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{background: NAVY}}>
  <AbsoluteFill style={{background: `radial-gradient(circle 900px at 540px ${820 + 40 * Math.sin(f / 90)}px, rgba(46,123,255,.30), rgba(7,11,22,0) 70%)`}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
    backgroundSize: '60px 60px', maskImage: 'radial-gradient(circle 800px at 540px 860px, #000 30%, transparent 75%)'}}/>
</AbsoluteFill>;

const Brand: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, top: 1298, textAlign: 'center', fontFamily: SANS, fontWeight: 800,
  fontSize: 22, letterSpacing: 7, color: '#ffffff80'}}>WITHHAMMAD</div>;

// Section pill above the card; it pops when the label changes.
const Label: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  if (!u.label) return null;
  const first = D.units.find((x: Unit) => x.label === u.label && x.to > u.from - 1 && x.from <= u.from && !D.units.some((y: Unit) => y.label === u.label && y.to === x.from));
  const p = pop(f, first ? first.from : u.from);
  return <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: BLUE, borderRadius: 999, padding: '14px 38px', fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 2, color: '#fff',
      boxShadow: '0 0 40px rgba(46,123,255,.65), 0 10px 26px rgba(0,0,0,.4)'}}>{u.label}</div></div>;
};

// ---------------------------------------------------------------- overlays
const Hook: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const b = pop(f, 6), out = ramp(f, o.to - 6, o.to);
  return <div style={{position: 'absolute', top: 232, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 1 - out}}>
    <div style={{fontFamily: BIG, fontSize: 84, lineHeight: 1, color: '#fff', textShadow: '0 6px 24px rgba(0,0,0,.6)'}}>{o.line1}</div>
    <div style={{background: BLUE, borderRadius: 999, padding: '8px 34px', fontFamily: BIG, fontSize: 52, lineHeight: 1.05, color: '#fff',
      boxShadow: '0 0 50px rgba(46,123,255,.7)', transform: `scale(${f < 6 ? 1 : 0.92 + 0.08 * b})`}}>{o.line2}</div></div>;
};

const Note: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), out = ramp(f, o.to - 5, o.to);
  return <div style={{position: 'absolute', top: PANEL.y + PANEL.h - 90, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(1, p * 2) * (1 - out)}}>
    <div style={{background: 'rgba(7,11,22,.86)', border: '2px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '10px 28px', fontFamily: SANS,
      fontWeight: 800, fontSize: 30, color: '#fff'}}>{o.text}</div></div>;
};

const Score: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), k = ease(ramp(f, o.at, o.at + 18));
  const v = (o.value * k).toFixed(o.value % 1 ? 1 : 0);
  const left = o.opt === 'B';
  const good = o.value >= 5;
  return <div style={{position: 'absolute', top: PANEL.y + 470, left: left ? 70 : 500, width: 430, transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: good ? '#0F2A1A' : '#2A1214', border: `4px solid ${good ? '#34D17A' : '#FF5A5F'}`, borderRadius: 30, padding: '18px 26px',
      boxShadow: `0 0 40px ${good ? 'rgba(52,209,122,.45)' : 'rgba(255,90,95,.4)'}, 0 16px 40px rgba(0,0,0,.5)`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#ffffffd0'}}>Option {o.opt} · {o.label}</div>
      <div style={{fontFamily: BIG, fontSize: 120, lineHeight: 1, color: good ? '#34D17A' : '#FF5A5F', fontVariantNumeric: 'tabular-nums'}}>{v}<span style={{fontSize: 50, color: '#ffffff90'}}> /10</span></div>
    </div></div>;
};

const Seats: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.at);
  const n = Math.round(7 + 5 * ease(ramp(f, o.at, o.at + 20)));
  return <>
    <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
      <span style={{fontFamily: BIG, fontSize: 120, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(46,123,255,.8)'}}>{n}</span>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 56, color: '#ffffffc0', marginLeft: 18}}>SEATS</span></div>
    <div style={{position: 'absolute', top: PANEL.y + 500, left: 40, right: 40, display: 'flex', justifyContent: 'center', gap: 12}}>
      {o.faces.map(([key, name, at]: [string, string, number]) => {
        const q = pop(f, at);
        return <div key={key} style={{width: 150, transform: `translateY(${(1 - q) * 80}px) scale(${0.5 + 0.5 * q})`, opacity: Math.min(1, q * 2),
          background: 'rgba(7,11,22,.92)', border: '3px solid rgba(46,123,255,.8)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 0 30px rgba(46,123,255,.5)'}}>
          <Img src={file(`${key}.webp`)} style={{width: 150, height: 150, objectFit: 'cover', objectPosition: '50% 20%', display: 'block'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: '#fff', textAlign: 'center', padding: '6px 0 8px'}}>{name}</div></div>;
      })}</div>
  </>;
};

const Chip: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from);
  const top = PANEL.y + 40 + (o.second ? 170 : o.third ? 340 : 0);
  return <div style={{position: 'absolute', top, right: 70, transform: `translateX(${(1 - p) * 200}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{background: 'rgba(7,11,22,.94)', border: `3px solid ${YELLOW}`, borderRadius: 24, padding: '14px 28px', boxShadow: '0 0 34px rgba(255,214,10,.35), 0 14px 34px rgba(0,0,0,.5)'}}>
      <div style={{fontFamily: o.text.startsWith('--') ? MONO : SANS, fontWeight: 900, fontSize: 46, color: YELLOW}}>{o.text}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#ffffffc0'}}>{o.sub}</div></div></div>;
};

// call-to-action skill, ending A: a clean comment box types the keyword, then the DM and the link card.
const Cta: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const up = pop(f, o.from), word = 'ROAST';
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - o.typeAt) * 8 / FPS) + 1)));
  const dm = pop(f, o.dmAt), card = pop(f, o.dmAt + 9);
  return <>
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: Math.min(1, up * 2), fontFamily: BIG, fontSize: 84, color: '#fff',
      textShadow: '0 6px 24px rgba(0,0,0,.6)'}}>Comment <span style={{color: YELLOW}}>ROAST</span></div>
    <div style={{position: 'absolute', left: 70, right: 150, top: 900, transform: `translateY(${(1 - up) * 500}px)`, background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.5)', padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
      <div style={{width: 72, height: 72, borderRadius: 99, background: `linear-gradient(160deg, ${BLUE}, #0B3FB0)`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: '#fff'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: f >= o.typeAt ? 800 : 600, fontSize: 46, color: f >= o.typeAt ? INK : '#8e8e93'}}>
        {f >= o.typeAt ? typed : 'Add a comment…'}{f >= o.typeAt && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= o.dmAt ? <div style={{position: 'absolute', left: 110, top: 1060, transform: `scale(${dm})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: INK}}>Here's the Roast Room setup</div> : null}
    {f >= o.dmAt + 9 ? <div style={{position: 'absolute', left: 110, top: 1144, width: 760, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 84, height: 84, borderRadius: 16, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BIG, fontSize: 40, color: '#fff'}}>7</div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK}}>Roast Room setup guide</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources/roast-room</div></div></div> : null}
  </>;
};

const Overlays: React.FC<{f: number}> = ({f}) => <>{D.overlays.filter((o: Ov) => f >= o.from && f < o.to).map((o: Ov, i: number) => {
  switch (o.kind) {
    case 'hook': return <Hook key={i} o={o} f={f}/>;
    case 'note': return <Note key={i} o={o} f={f}/>;
    case 'score': return <Score key={i} o={o} f={f}/>;
    case 'seats': return <Seats key={i} o={o} f={f}/>;
    case 'chip': return <Chip key={i} o={o} f={f}/>;
    case 'cta': return <Cta key={i} o={o} f={f}/>;
    default: return null;
  }
})}</>;

// ---------------------------------------------------------------- captions: word-by-word build (spoken white, next 45 %)
const Captions: React.FC<{f: number}> = ({f}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const lines: any[][] = [[]];
  c.words.forEach((w: any) => { lines[lines.length - 1].push(w); if (w.br) lines.push([]); });
  return <div style={{position: 'absolute', left: 40, right: 40, top: 1405, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: SANS, fontWeight: 900,
    fontSize: 66, lineHeight: 1.1, letterSpacing: -0.5, textShadow: '0 2px 10px rgba(0,0,0,.7)'}}>
    {lines.filter(l => l.length).map((l, i) => <div key={i} style={{whiteSpace: 'nowrap'}}>{l.map((w: any, j: number) =>
      <span key={j} style={{color: f >= w.at ? (w.emph ? YELLOW : '#fff') : 'rgba(255,255,255,.4)'}}>{j ? ' ' : ''}{w.text}</span>)}</div>)}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: NAVY, fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    <Backdrop f={f}/>
    {u.cta
      ? <AbsoluteFill style={{filter: 'blur(14px) brightness(.55)'}}><Card u={u} f={f}/></AbsoluteFill>
      : <Card u={u} f={f}/>}
    {u.cta ? null : <Label f={f} u={u}/>}
    {u.cta ? null : <Brand/>}
    <Overlays f={f}/>
    <Captions f={f}/>
  </AbsoluteFill>;
};
