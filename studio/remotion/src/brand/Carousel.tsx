import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {DarkBg} from './Backgrounds';
import {FitLine} from './Fit';
import {ReelCover, ReelCoverProps, Tile, TileView} from './ReelCover';
import {ACCENT, AccentName, COLOR, FONT, RADIUS, SAFE_4x5, SHADOW, TYPE} from './tokens';

// Carousel system, 1080x1350 (Instagram 4:5 carousel and LinkedIn document pages, same pixels).
// Every slide: the dark-variant background, WITHHAMMAD top-left, page counter top-right, one idea, big type,
// the accent box for the punch. Content inside SAFE_4x5 (80 px in, so the IG 3:4 grid crop never touches it).

export type Platform = 'instagram' | 'linkedin';
type Tone = 'good' | 'warn' | 'bad' | 'dim' | 'plain';
const TONE: Record<Tone, string> = {good: COLOR.teal, warn: COLOR.amber, bad: COLOR.red, dim: COLOR.faint, plain: COLOR.white};

export type SlideData =
  | {kind: 'cover'; cover: ReelCoverProps; offset?: number}
  | {kind: 'stat'; kicker: string; value: string; label: string; sub?: string; source: string}
  | {kind: 'step'; n: number; of?: number; title: string; body: string; code?: string; chips?: {text: string; tone: Tone}[]}
  | {kind: 'compare'; title: string; before: Side; after: Side; note?: string}
  | {kind: 'quote'; quote: string; by: string}
  | {kind: 'terminal'; title: string; cmd: string; lines: {text: string; tone?: Tone}[]; source?: string}
  | {kind: 'logos'; kicker: string; title: string; logos: {tile?: Tile; src?: string; w?: number; clip?: string; label: string}[]; note?: string}
  | {kind: 'end'; headline: string; keyword?: string; link?: string; sub: string; face?: string; faceFrame?: {width: number; left: number; top: number}};
type Side = {label: string; name: string; value: string; verdict: string; tone: Tone};

export type CarouselProps = {slides: SlideData[]; index: number; platform: Platform; accent?: AccentName};

const X = SAFE_4x5.x, Wd = SAFE_4x5.w;
const sans = (size: number, weight = 900, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({fontFamily: FONT.sans, fontWeight: weight, fontSize: size, color: COLOR.white, ...extra});
const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) =>
  <div style={sans(TYPE.kicker.size, 800, {letterSpacing: TYPE.kicker.tracking, color: color ?? COLOR.mint, textTransform: 'uppercase'})}>{children}</div>;
const Title: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = TYPE.slideTitle.size}) =>
  <div style={sans(size, 900, {letterSpacing: TYPE.slideTitle.tracking, lineHeight: 1.05, textTransform: 'uppercase'})}>{children}</div>;
const Body: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) =>
  <div style={sans(TYPE.slideBody.size, 600, {lineHeight: TYPE.slideBody.lineHeight, color: color ?? COLOR.dim})}>{children}</div>;
const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({children, bg, color, size = 26}) =>
  <div style={{display: 'inline-block', ...sans(size, 700, {color: color ?? COLOR.dim}), background: bg ?? 'rgba(255,255,255,.08)', borderRadius: RADIUS.pill, padding: '8px 20px'}}>{children}</div>;
const Box: React.FC<{children: React.ReactNode; accent: string}> = ({children, accent}) =>
  <span style={{background: accent, borderRadius: RADIUS.box, padding: '0 .2em', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>;
// Mono advance is 0.602 em (Menlo); the longest argument must fit the 856 px inner width, so long URLs never split.
const codeSize = (code: string, max = 34) => Math.min(max, Math.floor(856 / (Math.max(...code.split(' ').map(t => t.length + 2)) * 0.61)));
const Code: React.FC<{children: string; size?: number}> = ({children, size = codeSize(children)}) =>
  <div style={{fontFamily: FONT.mono, fontSize: size, lineHeight: 1.4, color: COLOR.white, background: '#05080A', border: `2px solid ${COLOR.panelLine}`,
    borderRadius: RADIUS.panel, padding: '28px 32px', overflowWrap: 'anywhere'}}><span style={{color: COLOR.teal}}>$ </span>
    {/* wrap only between arguments (never inside "--flag"); a single token longer than a line may still break */}
    {children.split(' ').map((t, i) => <React.Fragment key={i}>{i ? ' ' : ''}<span style={{whiteSpace: t.length > 24 ? 'normal' : 'nowrap'}}>{t}</span></React.Fragment>)}</div>;

/** Splits "text with *punch* words" so the starred part sits in the accent box. */
const punch = (s: string, accent: string) => s.split('*').map((part, i) => i % 2 ? <Box key={i} accent={accent}>{part}</Box> : <React.Fragment key={i}>{part}</React.Fragment>);

const Chrome: React.FC<{index: number; total: number; last: boolean; cover?: boolean}> = ({index, total, last, cover}) => <>
  {cover ? null : <><div style={{position: 'absolute', left: X, top: 64, ...sans(TYPE.brand.size, 800, {letterSpacing: TYPE.brand.tracking, color: 'rgba(255,255,255,.8)'})}}>WITHHAMMAD</div>
  <div style={{position: 'absolute', right: X, top: 60, ...sans(26, 800, {color: COLOR.faint, letterSpacing: 2})}}>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div></>}
  {last ? null : <div style={{position: 'absolute', right: X, bottom: 64, ...sans(26, 800, {letterSpacing: 4, color: COLOR.white}), background: 'rgba(255,255,255,.1)',
    borderRadius: RADIUS.pill, padding: '12px 26px'}}>SWIPE →</div>}
</>;

// Content sits between the header (y 130) and the swipe pill (y 1200), vertically centred so no slide has a dead half.
const Content: React.FC<{top?: number; children: React.ReactNode; gap?: number}> = ({top = 140, children, gap = 36}) =>
  <div style={{position: 'absolute', left: X, top, width: Wd, bottom: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap}}>{children}</div>;

const Slide: React.FC<{s: SlideData; platform: Platform; accent: string}> = ({s, platform, accent}) => {
  switch (s.kind) {
    case 'cover': return null;
    case 'stat': return <Content gap={28}>
      <Kicker>{s.kicker}</Kicker>
      <div style={{fontFamily: FONT.display, fontSize: TYPE.stat.size, letterSpacing: TYPE.stat.tracking, lineHeight: 0.95, color: COLOR.white}}>
        <FitLine size={TYPE.stat.size} maxWidth={Wd}>{s.value}</FitLine></div>
      <Title size={64}>{punch(s.label, accent)}</Title>
      {s.sub ? <Body>{s.sub}</Body> : null}
      <div style={{marginTop: 20}}><Pill>{s.source}</Pill></div>
    </Content>;
    case 'step': return <Content>
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{...sans(96, 900, {letterSpacing: -3}), background: accent, borderRadius: RADIUS.box, padding: '4px 26px', lineHeight: 1.1}}>{String(s.n).padStart(2, '0')}</div>
        <Kicker>{s.of ? `Step ${s.n} of ${s.of}` : `Step ${s.n}`}</Kicker></div>
      <Title>{punch(s.title, accent)}</Title>
      <Body>{s.body}</Body>
      {s.code ? <Code>{s.code}</Code> : null}
      {s.chips ? <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>{s.chips.map(c =>
        <div key={c.text} style={{...sans(44, 900, {color: COLOR.white}), borderLeft: `14px solid ${TONE[c.tone]}`, background: COLOR.panel, borderRadius: 18, padding: '18px 28px'}}>{c.text}</div>)}</div> : null}
    </Content>;
    case 'compare': {
      const side = (d: Side) => <div style={{background: COLOR.panel, border: `3px solid ${TONE[d.tone]}`, borderRadius: RADIUS.panel, padding: '30px 36px',
        display: 'flex', alignItems: 'center', gap: 32}}>
        <div style={{flex: 1}}>
          <Kicker color={TONE[d.tone]}>{d.label}</Kicker>
          <div style={{fontFamily: FONT.mono, fontSize: 38, color: COLOR.white, marginTop: 14}}>{d.name}</div>
          <div style={{display: 'inline-block', marginTop: 18, ...sans(36, 900), background: TONE[d.tone], color: d.tone === 'good' ? '#04211D' : COLOR.white,
            borderRadius: RADIUS.box, padding: '6px 20px'}}>{d.verdict}</div></div>
        <div style={{fontFamily: FONT.display, fontSize: 130, color: TONE[d.tone], letterSpacing: -4, lineHeight: 1}}>{d.value}</div></div>;
      return <Content gap={28}>
        <Title size={72}>{punch(s.title, accent)}</Title>
        {side(s.before)}{side(s.after)}
        {s.note ? <Body>{s.note}</Body> : null}
      </Content>;
    }
    case 'quote': return <Content gap={30}>
      <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 260, lineHeight: 1, color: accent, height: 110, marginBottom: -40}}>“</div>
      <div style={{fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 96, lineHeight: 1.08, color: COLOR.white}}>{s.quote}</div>
      <div style={{width: 120, height: 8, background: accent, borderRadius: 4}}/>
      <Body>{s.by}</Body>
    </Content>;
    case 'terminal': return <Content gap={28}>
      <Title size={72}>{punch(s.title, accent)}</Title>
      <div style={{background: '#05080A', border: `2px solid ${COLOR.panelLine}`, borderRadius: RADIUS.panel, overflow: 'hidden', boxShadow: SHADOW.card}}>
        <div style={{height: 56, background: '#141A1C', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px'}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 20, height: 20, borderRadius: 10, background: c}}/>)}</div>
        <div style={{padding: '24px 30px 30px', fontFamily: FONT.mono, fontSize: 30, lineHeight: 1.42, whiteSpace: 'pre', color: COLOR.white}}>
          <div><span style={{color: COLOR.teal}}>$ </span>{s.cmd}</div>
          {s.lines.map((l, i) => <div key={i} style={{color: TONE[l.tone ?? 'plain']}}>{l.text}</div>)}</div></div>
      {s.source ? <Pill>{s.source}</Pill> : null}
    </Content>;
    case 'logos': return <Content gap={40}>
      <Kicker>{s.kicker}</Kicker>
      <Title>{punch(s.title, accent)}</Title>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20}}>{s.logos.map(l =>
        <div key={l.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, width: Wd / s.logos.length}}>
          <div style={{height: 220, display: 'flex', alignItems: 'center', filter: SHADOW.tile}}>
            {l.tile ? <TileView tile={l.tile} size={200}/> : <Img src={l.src as string} style={{width: l.w ?? 260, clipPath: l.clip}}/>}</div>
          <div style={sans(30, 800, {color: COLOR.dim})}>{l.label}</div></div>)}</div>
      {s.note ? <div style={{marginTop: 30}}><Body>{s.note}</Body></div> : null}
    </Content>;
    case 'end': return <>
      {s.face ? <div style={{position: 'absolute', left: (1080 - 380) / 2, top: 150, width: 380, height: 380, borderRadius: 190, overflow: 'hidden',
        background: `radial-gradient(circle at 50% 40%, ${COLOR.glow}, ${COLOR.ink})`, border: `6px solid ${accent}`}}>
        <Img src={s.face} style={{position: 'absolute', ...(s.faceFrame ?? {width: 480, left: -50, top: -40})}}/></div> : null}
      <div style={{position: 'absolute', left: X, width: Wd, top: s.face ? 580 : 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, textAlign: 'center'}}>
        <Title size={76}>{s.headline}</Title>
        {platform === 'instagram' && s.keyword ? <>
          <div style={sans(56, 900, {textTransform: 'uppercase'})}>Comment</div>
          <FitLine size={200} maxWidth={Wd} boxStyle={{fontFamily: FONT.sans, fontWeight: 900, color: COLOR.white, background: accent, borderRadius: RADIUS.box,
            padding: '0 .22em', letterSpacing: -4, lineHeight: 1.12}}>{s.keyword}</FitLine></> : null}
        {platform === 'linkedin' && s.link ? <>
          <div style={sans(48, 900, {textTransform: 'uppercase'})}>Free guide, no sign-up</div>
          <div style={{...sans(44, 800), background: accent, borderRadius: RADIUS.box, padding: '16px 28px', textAlign: 'center'}}>{s.link.split('/').map((part, i) => <React.Fragment key={i}>{i ? '/' : ''}<wbr/>{part}</React.Fragment>)}</div></> : null}
        <Body>{s.sub}</Body></div>
    </>;
  }
};

export const CarouselSlide: React.FC<CarouselProps> = ({slides, index, platform, accent = 'red'}) => {
  const s = slides[index];
  const a = ACCENT[accent];
  const last = index === slides.length - 1;
  if (s.kind === 'cover') {
    const off = s.offset ?? 230;  // cover slide = the reel cover's 4:5 window, nudged up; no header (no small text on covers)
    return <AbsoluteFill style={{background: COLOR.ink, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: -off, width: 1080, height: 1920}}><ReelCover {...s.cover}/></div>
      <Chrome index={index} total={slides.length} last={last} cover/>
    </AbsoluteFill>;
  }
  return <AbsoluteFill style={{background: COLOR.ink, overflow: 'hidden'}}>
    <DarkBg height={1350} glowY={30} bars={false} rain={0.045} seed={`s${index}`}/>
    <Slide s={s} platform={platform} accent={a}/>
    <Chrome index={index} total={slides.length} last={last}/>
  </AbsoluteFill>;
};
