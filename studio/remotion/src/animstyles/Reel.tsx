import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';
import {StyleCard, STYLE_NAMES} from './Styles';

// "10 Claude Animation Styles" (job 6a48be151b7a), rebuilt from @tonistelk's reel in the same layout and order:
// starfield, title "10 Claude* / Animation styles" on top, numbered list on the left that fills in as each name is
// said (current number coral, current name bold white), a 9:16 card on the right showing the same office-walk shot in
// that style, wiped in from the right; then a 3+3 grid with "Comment ANIMATE for the prompts" between the rows.
// Polish over the reference: every style is a real animation built from a prompt (no stills), "Hologram"/"Anime Cel"
// spelled right, larger card and type, honest subtitle ("all built with Claude" instead of "To Go Viral").
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'ASSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'ASMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'ASMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30, CORAL = '#E07B57', SANS = 'ASSans, Arial, sans-serif', SERIF = 'ASSerif, Georgia, serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 15, stiffness: 170}}));
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

const Stars: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #1E1E22 0%, #0B0B0D 55%, #050506 100%)'}}>
  {Array.from({length: 120}, (_, i) => {
    const x = rnd(i) * 1080, y = (rnd(i + 500) * 1920 - f * (0.15 + rnd(i + 900) * 0.35) + 1920) % 1920, r = 1 + rnd(i + 200) * 2.2;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / 20 + i));
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: '#fff', opacity: tw * 0.55}}/>;
  })}
</AbsoluteFill>;

const ClaudeMark: React.FC<{size: number; spin: number}> = ({size, spin}) => <div style={{width: size, height: size, display: 'inline-block', marginLeft: 10, transform: `rotate(${spin}deg)`,
  background: CORAL, WebkitMaskImage: `url(${staticFile('glow/si-claude.svg')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}}/>;

const Title: React.FC<{f: number; op: number}> = ({f, op}) => <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', color: '#fff', opacity: op}}>
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, height: 112}}>
    <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 104, letterSpacing: -3}}>10</span>
    <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 118, color: CORAL, lineHeight: 1}}>Claude</span>
    <ClaudeMark size={74} spin={f * 0.6}/>
  </div>
  <div style={{marginTop: 4, fontSize: 96, letterSpacing: -2.5, lineHeight: 1.05}}>
    <span style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'italic', display: 'inline-block', transform: 'skewX(-8deg)'}}>Animation</span>
    <span style={{fontFamily: SANS, fontWeight: 500}}> styles</span>
  </div>
  <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 38, color: 'rgba(255,255,255,.78)'}}>(each one built from a single prompt)</div>
</div>;

const LIST_TOP = 640, ROW = 80;
const List: React.FC<{f: number; cur: number; op: number}> = ({f, cur, op}) => <div style={{position: 'absolute', left: 50, top: LIST_TOP, opacity: op}}>
  {STYLE_NAMES.map((n, i) => {
    const at = D.styles[i], on = f >= at, active = i === cur, p = ease(ramp(f, at, at + 6));
    return <div key={i} style={{height: ROW, display: 'flex', alignItems: 'center', fontFamily: SANS, fontSize: 40, whiteSpace: 'nowrap'}}>
      <span style={{width: 74, fontWeight: 700, color: active ? CORAL : '#fff', opacity: active ? 1 : 0.92}}>{i + 1})</span>
      {on && <span style={{fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,.62)', opacity: p, transform: `translateX(${(1 - p) * -18}px)`, display: 'inline-block'}}>{n}</span>}
    </div>;
  })}
</div>;

const CARD = {x: 470, y: 572, w: 520, h: 924};
const Card: React.FC<{f: number; children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <div style={{position: 'absolute', overflow: 'hidden', borderRadius: 28, boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,255,255,.14)', background: '#000', ...style}}>{children}</div>;

// main card: current style, the incoming one wipes in from the right over 8 frames with a soft light edge
const MainCard: React.FC<{f: number}> = ({f}) => {
  const k = D.styles.reduce((a: number, s: number, i: number) => (f >= s ? i : a), 0);
  const prev = Math.max(0, k - 1), at = D.styles[k], w = k === 0 ? 1 : ease(ramp(f, at, at + 8));
  const tOf = (i: number) => (f - (i === 0 ? 0 : D.styles[i])) / FPS;
  return <Card f={f} style={{left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h}}>
    {w < 1 && <div style={{position: 'absolute', inset: 0}}><StyleCard i={prev} t={tOf(prev)} id={`m${prev}`}/></div>}
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${(1 - w) * 100}%)`}}><StyleCard i={k} t={tOf(k)} id={`m${k}`}/></div>
    {w < 1 && <div style={{position: 'absolute', top: 0, bottom: 0, left: `${(1 - w) * 100}%`, width: 6, marginLeft: -3, background: 'rgba(255,255,255,.9)', boxShadow: '0 0 30px 8px rgba(255,255,255,.5)'}}/>}
  </Card>;
};

// ending: 3 + 3 grid, comment line between the rows (the reference's layout)
const GRID = [0, 1, 2, 6, 5, 9];
const Ending: React.FC<{f: number}> = ({f}) => {
  const c = D.cta, cw = 316, chh = 562, gap = 24, x0 = (1080 - (3 * cw + 2 * gap)) / 2;
  const kwP = pop(f, D.keyword);
  return <>
    {GRID.map((s, j) => {
      const row = j < 3 ? 0 : 1, col = j % 3, p = pop(f, c + j * 2);
      const top = row === 0 ? 170 : 1010;
      return <Card key={j} f={f} style={{left: x0 + col * (cw + gap), top, width: cw, height: chh, transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.4)}}>
        <StyleCard i={s} t={(f - c) / FPS + 0.4} id={`e${j}`}/></Card>;
    })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 772, textAlign: 'center', color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 70, lineHeight: 1.08, letterSpacing: -1.5,
      opacity: ramp(f, c + 2, c + 8), transform: `translateY(${(1 - ease(ramp(f, c + 2, c + 10))) * 20}px)`}}>
      <div>Comment <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 92, color: CORAL, display: 'inline-block', transform: `scale(${1 + 0.12 * kwP * Math.max(0, 1 - (f - D.keyword) / 20)})`}}>“ANIMATE”</span></div>
      <div style={{fontWeight: 700, fontSize: 60}}>for all 10 prompts</div>
    </div>
  </>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const out = ease(ramp(f, D.cta - 4, D.cta + 6));
  const cur = D.styles.reduce((a: number, s: number, i: number) => (f >= s ? i : a), -1);
  return <AbsoluteFill style={{background: '#070708'}}>
    <Stars f={f}/>
    <Title f={f} op={1 - out}/>
    <List f={f} cur={cur} op={1 - out}/>
    {f < D.cta + 6 && <div style={{opacity: 1 - out, transform: `scale(${1 - 0.06 * out})`, transformOrigin: '75% 55%', position: 'absolute', inset: 0}}><MainCard f={f}/></div>}
    {f >= D.cta - 2 && <Ending f={f}/>}
    <div style={{position: 'absolute', left: 54, top: 1462, fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.5)', opacity: 1 - out}}>WITHHAMMAD</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 956, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.5)', opacity: ramp(f, D.cta + 6, D.cta + 14)}}>WITHHAMMAD</div>
    {D.standin && <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#D32F2F', color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: '8px 20px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div></div>}
    <Audio src={staticFile('animstyles/voice.wav')}/>
  </AbsoluteFill>;
};

// Preview: all ten styles at time t, for checking the looks
export const Sheet: React.FC<{t: number}> = ({t}) => <AbsoluteFill style={{background: '#111', display: 'flex', flexWrap: 'wrap', gap: 10, padding: 10}}>
  {STYLE_NAMES.map((n, i) => <div key={i} style={{width: 378, height: 672, position: 'relative', overflow: 'hidden', borderRadius: 12}}>
    <StyleCard i={i} t={t} id={`s${i}`}/>
    <div style={{position: 'absolute', left: 8, top: 640, color: '#fff', background: 'rgba(0,0,0,.6)', fontFamily: SANS, fontSize: 20, padding: '2px 8px'}}>{n}</div></div>)}
</AbsoluteFill>;
