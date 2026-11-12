// Website intro video for withhammad.com (job site-intro-20261112): the owner's presenter take with word-timed cards.
// One design, two formats: 'wide' 1920x1080 (cards left, presenter card right) and 'tall' 1080x1920 (cards on top, presenter
// below). Colours and fonts follow the site's own tokens (void / amber, Geist + Martian Mono). Times are spoken-word times.
import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type Fmt = 'wide' | 'tall';
export type SiteIntroProps = {words: Word[]; fmt: Fmt; poster?: boolean};

const FPS = 30;
const VOID = '#0A0D12', PANEL = '#10141b', PANEL2 = '#161b24', LINE = '#2a3242', INK = '#e8eaed', DIM = '#99a1ae', AMBER = '#FFB224', AMBERHI = '#ffc85c', OK = '#3ecf8e';
const sans = 'Geist', mono = 'Martian Mono';
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.36) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const rise = (t: number, s: number, d = 0.35): React.CSSProperties => ({opacity: pr(t, s, d * 0.7), transform: `translateY(${(1 - eo(pr(t, s, d))) * 26}px)`});

const Tick: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={OK} /><path d="M6.500 12.500l3.600 3.600 7.200-7.600" fill="none" stroke="#05281a" strokeWidth="2.800" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Label: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => <div style={{fontFamily: mono, fontWeight: 500, fontSize: 24, letterSpacing: 3, color: AMBER, ...style}}>{children}</div>;
const Card: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => <div style={{position: 'absolute', background: PANEL, border: `2px solid ${LINE}`, borderRadius: 24, ...style}}>{children}</div>;
const Glyph: React.FC<{kind: number}> = ({kind}) => <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#1a1200" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
  {kind === 0 && <path d="M4 20V11M10 20V5M16 20v-7M21 20H3" />}
  {kind === 1 && <><circle cx="10.500" cy="10.500" r="6" /><path d="M15 15l5 5" /></>}
  {kind === 2 && <path d="M21 3L3 10.500l7 2.500 2.500 7L21 3zM10 13l4-4" />}
  {kind === 3 && <><path d="M7 3h8l4 4v14H7z" /><path d="M10 12h6M10 16h6" /></>}
</svg>;

// ------------------------------------------------------------------ the five word-timed sections, drawn in a 1000 x 520 box
const Sec: React.FC<React.PropsWithChildren<{s: number; e: number}>> = ({s, e, children}) => {
  const t = useT(); if (t < s || t >= e) return null;
  const o = Math.min(pr(t, s, 0.25), 1 - pr(t, e - 0.22, 0.22));
  return <div style={{position: 'absolute', inset: 0, opacity: o, transform: `translateY(${(1 - eo(pr(t, s, 0.35))) * 30 - eo(pr(t, e - 0.22, 0.22)) * 24}px)`}}>{children}</div>;
};
const Hello: React.FC = () => {
  const t = useT(), w1: [string, number, boolean][] = [['I', 1.72, false], ['build', 1.92, false], ['AI', 2.18, true], ['agents', 2.6, true]], w2: [string, number][] = [['that', 3.0], ['run', 3.26], ['your', 3.48], ['marketing', 3.66], ['for you', 4.02]];
  return <>
    <Label style={rise(t, 0.1)}>AI IMPLEMENTATION SPECIALIST · DUBAI</Label>
    <div style={{position: 'absolute', left: 0, top: 58, fontFamily: sans, fontWeight: 800, fontSize: 86, color: INK, letterSpacing: -2, transform: `scale(${pop(t, 0.02)})`, transformOrigin: '0 60%'}}>Hi, I'm Hammad</div>
    <div style={{position: 'absolute', left: 0, top: 182, fontFamily: sans, fontWeight: 800, fontSize: 124, lineHeight: 1.05, letterSpacing: -4, whiteSpace: 'nowrap'}}>
      {w1.map(([x, at, hot]) => <span key={x} style={{display: 'inline-block', marginRight: 26, color: hot ? AMBER : INK, ...rise(t, at - 0.05, 0.3)}}>{x}</span>)}</div>
    <div style={{position: 'absolute', left: 328, top: 322, height: 12, borderRadius: 6, background: AMBER, width: 520 * eo(pr(t, 2.7, 0.35))}} />
    <div style={{position: 'absolute', left: 0, top: 372, fontFamily: sans, fontWeight: 700, fontSize: 66, letterSpacing: -1, whiteSpace: 'nowrap'}}>
      {w2.map(([x, at]) => <span key={x} style={{display: 'inline-block', marginRight: 18, color: x === 'for you' ? AMBERHI : DIM, ...rise(t, at - 0.05, 0.3)}}>{x}</span>)}</div>
  </>;
};
const Agents: React.FC = () => {
  const t = useT(), items: [string, number][] = [['Media buying', 5.18], ['SEO', 5.94], ['Sales outreach', 6.8], ['Quoting', 7.88]], on = t >= 8.78;
  return <>
    <Label style={rise(t, 5.05)}>AGENTS THAT RUN IT FOR YOU</Label>
    {items.map(([x, at], i) => <Card key={x} style={{left: (i % 2) * 510, top: 56 + Math.floor(i / 2) * 160, width: 490, height: 140, display: 'flex', alignItems: 'center', gap: 20, padding: '0 22px', transform: `scale(${pop(t, at - 0.04)})`,
      borderColor: t >= at && t < at + 0.7 ? AMBER : LINE}}>
      <div style={{width: 80, height: 80, borderRadius: 20, background: AMBER, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Glyph kind={i} /></div>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 46, color: INK, letterSpacing: -1, whiteSpace: 'nowrap'}}>{x}</div></Card>)}
    <Card style={{left: 0, top: 388, width: 1000, height: 124, display: 'flex', alignItems: 'center', gap: 26, padding: '0 34px', background: PANEL2, borderColor: on ? OK : LINE, transform: `scale(${pop(t, 8.74)})`}}>
      <div style={{width: 30, height: 30, borderRadius: 15, background: OK, boxShadow: `0 0 0 ${8 + 8 * Math.abs(Math.sin(t * 4))}px ${OK}33`}} />
      <div style={{fontFamily: sans, fontWeight: 800, fontSize: 56, color: INK, letterSpacing: -1, whiteSpace: 'nowrap'}}>Working around the clock</div>
      <div style={{marginLeft: 'auto', fontFamily: mono, fontWeight: 700, fontSize: 40, color: OK}}>24/7</div></Card>
  </>;
};
const Stat: React.FC<{left: number; num: number; sign: string; color: string; numAt: number; label: string; labelAt: number; sub: string; subAt: number; up: boolean}> = ({left, num, sign, color, numAt, label, labelAt, sub, subAt, up}) => {
  const t = useT(), n = Math.round(num * eo(pr(t, numAt, 0.75))), grow = eo(pr(t, numAt - 1.1, 1.4));
  return <Card style={{left, top: 62, width: 490, height: 450, padding: '26px 30px', transform: `scale(${pop(t, labelAt - 0.25)})`, borderColor: t >= numAt ? color : LINE}}>
    <div style={{fontFamily: sans, fontWeight: 700, fontSize: 40, lineHeight: 1.15, color: INK, height: 96}}>{label}</div>
    <div style={{fontFamily: sans, fontWeight: 800, fontSize: 150, lineHeight: 1.25, letterSpacing: -6, whiteSpace: 'nowrap', color, opacity: pr(t, numAt - 0.05, 0.12), fontVariantNumeric: 'tabular-nums'}}>{sign}{n}%</div>
    <div style={{fontFamily: mono, fontWeight: 500, fontSize: 26, color: DIM, opacity: pr(t, subAt, 0.25)}}>{sub}</div>
    <div style={{position: 'absolute', left: 30, right: 30, bottom: 26, height: 64, display: 'flex', alignItems: 'flex-end', gap: 12}}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => { const h = up ? 0.3 + 0.7 * (i / 6) : 1 - 0.75 * (i / 6); return <div key={i} style={{flex: 1, borderRadius: 6, background: i === 6 ? color : LINE, height: `${100 * h * cl(grow * 1.6 - i * 0.09)}%`}} />; })}</div>
  </Card>;
};
const Results: React.FC = () => {
  const t = useT();
  return <>
    <Label style={rise(t, 10.55)}>GOOGLE ADS AGENT · MEASURED RESULT</Label>
    <Stat left={0} num={18} sign="+" color={AMBER} numAt={13.28} label="Return on ad spend" labelAt={10.95} sub="in one quarter" subAt={14.3} up />
    <Stat left={510} num={75} sign="−" color={OK} numAt={17.3} label="Manual optimisation time" labelAt={15.7} sub="less hands-on work" subAt={17.9} up={false} />
  </>;
};
const Real: React.FC = () => {
  const t = useT(), rows: [string, number, string][] = [['Real', 20.38, INK], ['Live', 20.98, INK], ['Free to try', 21.58, AMBER]];
  return <>
    <div style={{fontFamily: sans, fontWeight: 700, fontSize: 58, color: DIM, letterSpacing: -1, ...rise(t, 18.95)}}>Everything on this site is</div>
    {rows.map(([x, at, c], i) => <div key={x} style={{position: 'absolute', left: 0, top: 104 + i * 138, display: 'flex', alignItems: 'center', gap: 30, transform: `scale(${pop(t, at - 0.04)})`, transformOrigin: '0 50%'}}>
      <Tick size={92} /><span style={{fontFamily: sans, fontWeight: 800, fontSize: 116, lineHeight: 1, letterSpacing: -4, color: c}}>{x}</span>
      {x === 'Live' && <span style={{width: 26, height: 26, borderRadius: 13, background: OK, boxShadow: `0 0 0 ${6 + 8 * Math.abs(Math.sin(t * 5))}px ${OK}33`}} />}</div>)}
  </>;
};
const Start: React.FC = () => {
  const t = useT(), steps: [string, number][] = [['Pick an agent', 22.76], ['Run it', 23.58], ['Book a call', 25.12]];
  return <>
    <Label style={rise(t, 22.7)}>HOW TO START</Label>
    {steps.map(([x, at], i) => { const last = i === 2, lit = t >= at;
      return <Card key={x} style={{left: i * 340, top: 62, width: 320, height: 270, padding: '26px 28px', background: last && lit ? AMBER : PANEL, borderColor: lit ? AMBER : LINE, transform: `scale(${pop(t, at - 0.04) * (last && lit ? 1 + 0.03 * Math.sin(t * 6) : 1)})`}}>
        <div style={{width: 66, height: 66, borderRadius: 33, background: last && lit ? '#1a1200' : PANEL2, border: `2px solid ${last && lit ? '#1a1200' : AMBER}`, color: last && lit ? AMBER : AMBER, fontFamily: mono, fontWeight: 700, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
        <div style={{marginTop: 30, fontFamily: sans, fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: -2, color: last && lit ? '#1a1200' : INK}}>{x}</div></Card>; })}
    <div style={{position: 'absolute', left: 0, top: 372, fontFamily: sans, fontWeight: 700, fontSize: 54, color: DIM, letterSpacing: -1, ...rise(t, 24.3)}}>When you're ready, <span style={{color: INK}}>talk to me.</span></div>
  </>;
};
const Stage: React.FC = () => <div style={{position: 'absolute', left: 0, top: 0, width: 1000, height: 520}}>
  <Sec s={0} e={4.98}><Hello /></Sec>
  <Sec s={4.98} e={10.5}><Agents /></Sec>
  <Sec s={10.5} e={18.72}><Results /></Sec>
  <Sec s={18.72} e={22.62}><Real /></Sec>
  <Sec s={22.62} e={99}><Start /></Sec>
</div>;

// ------------------------------------------------------------------ captions: phrase chunks, the spoken word in amber
const chunks = (words: Word[]) => { const out: number[][] = []; let cur: number[] = [];
  words.forEach((w, i) => { cur.push(i); const x = w.text.trim(); if (/[.,!?]$/.test(x) || cur.length >= 4 || (words[i + 1] && words[i + 1].startMs - w.endMs > 350)) { out.push(cur); cur = []; } });
  if (cur.length) out.push(cur); return out; };
const Captions: React.FC<{words: Word[]; align: 'left' | 'center'; size: number}> = ({words, align, size}) => {
  const ms = useT() * 1000, cs = React.useMemo(() => chunks(words), [words]);
  const k = cs.findIndex((c, i) => ms >= words[c[0]].startMs - 40 && ms < Math.min(words[c[c.length - 1]].endMs + 350, i + 1 < cs.length ? words[cs[i + 1][0]].startMs - 40 : 1e9));
  if (k < 0) return null;
  return <div style={{textAlign: align}}><div style={{display: 'inline-block', background: '#05070bee', border: `2px solid ${LINE}`, borderRadius: size * 0.36, padding: `${size * 0.26}px ${size * 0.5}px`, fontFamily: sans, fontWeight: 700, fontSize: size, lineHeight: 1.1, color: INK, whiteSpace: 'nowrap'}}>
    {cs[k].map((i, n) => <span key={i} style={{color: ms >= words[i].startMs && ms < words[i].endMs + 60 ? AMBER : undefined}}>{words[i].text.trim().replace(/\.$/, '')}{n < cs[k].length - 1 ? ' ' : ''}</span>)}</div></div>;
};

const Bg: React.FC<{glow: string}> = ({glow}) => <AbsoluteFill style={{background: `radial-gradient(${glow},#FFB22422,transparent 70%),${VOID}`}}>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff07 1px,transparent 1px),linear-gradient(90deg,#ffffff07 1px,transparent 1px)', backgroundSize: '64px 64px'}} /></AbsoluteFill>;
const Brand: React.FC<{x: number; y: number}> = ({x, y}) => <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 12, fontFamily: mono, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: INK}}><span style={{width: 12, height: 12, borderRadius: 6, background: AMBER}} />WITHHAMMAD</div>;
const Take: React.FC<{style: React.CSSProperties; still?: boolean}> = ({style, still}) => { const f = still ? 18 : Math.min(useCurrentFrame(), 783); return <Freeze frame={f}><OffthreadVideo muted src={staticFile('x/avatar.mp4')} style={style} /></Freeze>; };

export const SiteIntro: React.FC<SiteIntroProps> = ({words, fmt, poster}) => {
  if (fmt === 'wide') return <AbsoluteFill style={{background: VOID, overflow: 'hidden'}}>
    <Bg glow="60% 80% at 82% 50%" />
    <Brand x={96} y={70} />
    <div style={{position: 'absolute', left: 96, top: 196, width: 1000, height: 520, transform: 'scale(1.12)', transformOrigin: '0 0'}}><Stage /></div>
    {!poster && <div style={{position: 'absolute', left: 96, top: 868, width: 1120}}><Captions words={words} align="left" size={46} /></div>}
    <div style={{position: 'absolute', left: 1296, top: 54, width: 546, height: 972, borderRadius: 34, overflow: 'hidden', border: `3px solid ${AMBER}`, boxShadow: `0 0 90px #FFB22440, 0 40px 80px #000000aa`, background: '#222'}}>
      <Take still={poster} style={{position: 'absolute', left: 0, top: 0, width: 546, height: 972, objectFit: 'cover'}} /></div>
  </AbsoluteFill>;
  return <AbsoluteFill style={{background: VOID, overflow: 'hidden'}}>
    <Bg glow="90% 40% at 50% 22%" />
    <Brand x={60} y={226} />
    <div style={{position: 'absolute', left: 50, top: 282, width: 1000, height: 520, transform: 'scale(0.98)', transformOrigin: '0 0'}}><Stage /></div>
    <div style={{position: 'absolute', left: 0, top: 840, width: 1080, height: 1080, overflow: 'hidden', background: '#2a2520', borderTop: `4px solid ${AMBER}`}}>
      <Take still={poster} style={{position: 'absolute', left: -110, top: -330, width: 1300, height: 2311, filter: 'blur(26px) brightness(.8)'}} />
      <Take still={poster} style={{position: 'absolute', left: 54, top: -150, width: 972, height: 1728}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 110, background: 'linear-gradient(#0A0D12aa,transparent)'}} /></div>
    {!poster && <div style={{position: 'absolute', left: 0, right: 0, top: 800}}><Captions words={words} align="center" size={50} /></div>}
  </AbsoluteFill>;
};
