import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Video, Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Claude Duet reel (job 955ed21d2fc4): a scene-for-scene rebuild of the reference's motion graphics (dark grid,
// top kinetic captions with a selection box, dark / light / dark blocks joined by two circle irises), with the real
// logos and Anthropic's own demo screens, and Hammad in the bottom band. Timing lives in data.json (build-reel.py).
const fonts: [string, string, string, string?][] = [
  ['DuetSans', 'inter-latin-400-normal', '400'], ['DuetSans', 'inter-latin-500-normal', '500'],
  ['DuetSans', 'inter-latin-600-normal', '600'], ['DuetSans', 'inter-latin-700-normal', '700'],
  ['DuetSans', 'inter-latin-800-normal', '800'], ['DuetDisplay', 'instrument-serif-latin-400-normal', '400'],
  ['DuetDisplay', 'instrument-serif-latin-400-italic', '400', 'italic'], ['DuetText', 'source-serif-4-latin-400-normal', '400'],
];
fonts.forEach(([family, file, weight, style]) => loadFont({family, url: staticFile(`fonts/${file}.woff2`), weight, style: style || 'normal'}));

const D: any = data;
const A: Record<string, number> = D.a;
const FPS = 30, W = 1080, H = 1920;
const SANS = 'DuetSans', DISPLAY = 'DuetDisplay', TEXT = 'DuetText';
const CORAL = '#D9775A', LAV = '#CDCBDE', BLUE = '#4A78F0';
const file = (s: string) => staticFile('duet/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const inout = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const pop = (f: number, at: number, damping = 12) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping, stiffness: 170}}));
// Blur-in used for every entrance in the reference: blur 14 px -> 0, opacity 0 -> 1.
const blurIn = (f: number, at: number, len = 6) => {
  const p = ease(ramp(f, at, at + len));
  return {opacity: p, filter: p < 1 ? `blur(${(1 - p) * 14}px)` : undefined};
};
const blurOut = (f: number, at: number, len = 5) => {
  const p = ramp(f, at, at + len);
  return p > 0 ? {opacity: 1 - p, filter: `blur(${p * 14}px)`} : {};
};

// ---------------------------------------------------------------- canvas, irises

const Canvas: React.FC<{light?: boolean; glow?: [number, number]}> = ({light, glow = [540, 900]}) => (
  <AbsoluteFill style={{background: light ? '#EFEFEB' : '#0A0A0A'}}>
    <AbsoluteFill style={{backgroundImage: `linear-gradient(${light ? '#0000000b' : '#ffffff09'} 1px, transparent 1px), linear-gradient(90deg, ${light ? '#0000000b' : '#ffffff09'} 1px, transparent 1px)`, backgroundSize: '60px 60px'}}/>
    {light ? null : <AbsoluteFill style={{background: `radial-gradient(circle at ${glow[0]}px ${glow[1]}px, #d9775a2e, transparent 430px)`}}/>}
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 46%, transparent 52%, ${light ? '#00000014' : '#000000b0'})`}}/>
  </AbsoluteFill>
);

// A circle grows from (x, y) and reveals `children` (the next block) over `len` frames.
const Iris: React.FC<React.PropsWithChildren<{f: number; at: number; x: number; y: number; len?: number}>> = ({f, at, x, y, len = 7, children}) => {
  if (f < at) return null;
  const r = 6 + inout(ramp(f, at, at + len)) * 2300;
  return <AbsoluteFill style={{clipPath: `circle(${r}px at ${x}px ${y}px)`}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- shared bits

const Squircle: React.FC<{src: string; size: number; style?: React.CSSProperties; bg?: string; pad?: number}> = ({src, size, style, bg, pad = 0}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.225, overflow: 'hidden', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>
    <Img src={file(src)} style={{width: size - pad * 2, height: size - pad * 2, objectFit: 'contain'}}/>
  </div>
);

const DuetIcon: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.225, boxShadow: `0 ${size * 0.06}px ${size * 0.25}px #0007`, ...style}}>
    <Img src={file('claude-duet-icon.svg')} style={{width: size, height: size, display: 'block'}}/>
  </div>
);

const Pill: React.FC<React.PropsWithChildren<{dark?: boolean; size?: number; style?: React.CSSProperties}>> = ({dark, size = 30, style, children}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.35, padding: `${size * 0.42}px ${size * 0.7}px`, borderRadius: 999, fontFamily: SANS, fontWeight: 600, fontSize: size,
    background: dark ? '#161616' : '#F5F4F0', color: dark ? '#F2F2F2' : '#151515', border: `1.5px solid ${dark ? '#2C2C2C' : '#E2E0DA'}`, boxShadow: '0 10px 30px #0006', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

const Check: React.FC<{size: number; p: number}> = ({size, p}) => (
  <div style={{width: size, height: size, borderRadius: size, background: '#22A447', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`, boxShadow: '0 6px 16px #22a44755'}}>
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p)}/></svg>
  </div>
);

// ---------------------------------------------------------------- captions (top band)

type Part = {t: string; s: 'b' | 'r' | 'i'; at: number};
type Tok = {parts: Part[]; box?: boolean};
type Cap = {from: number; to: number; lines: Tok[][]};
const CAP_SIZE = 62;

const PartView: React.FC<{p: Part; f: number; light: boolean; inBox: boolean; first: boolean}> = ({p, f, light, inBox, first}) => {
  const st = inBox ? p.at - 3 : p.at; // a boxed word is already half-sharp when its box snaps on
  const e = ease(ramp(f, st, st + 5));
  const serif = p.s === 'i';
  const color = inBox ? (light ? '#0D182C' : '#C8D8F8') : p.s === 'r' ? (light ? '#6B6B6B' : '#8E8E8E') : light ? '#111111' : '#FFFFFF';
  return <span style={{display: 'inline-block', marginLeft: first ? 0 : serif ? 12 : 15, fontFamily: serif ? DISPLAY : SANS, fontStyle: serif ? 'italic' : 'normal',
    fontWeight: serif ? 400 : p.s === 'b' ? 600 : 400, fontSize: serif ? CAP_SIZE * 1.24 : CAP_SIZE, lineHeight: 1, color, letterSpacing: serif ? 0 : -0.6,
    opacity: e, filter: e < 1 ? `blur(${(1 - e) * 10}px)` : undefined, transform: `translateY(${(1 - e) * 6}px)`}}>{p.t}</span>;
};

const Captions: React.FC<{f: number; light: (f: number) => boolean}> = ({f, light}) => {
  const c: Cap | undefined = D.caps.find((g: Cap) => f >= g.from && f < g.to);
  if (!c) return null;
  const lt = light(f);
  const out = ramp(f, c.to - 5, c.to);
  const n = c.lines.length;
  return <div style={{position: 'absolute', left: 0, right: 0, top: 322 - n * 44, opacity: 1 - out, filter: out > 0 ? `blur(${out * 12}px)` : undefined}}>
    {c.lines.map((line, li) => <div key={li} style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', height: 88}}>
      {line.map((tok, ti) => {
        if (f < tok.parts[0].at - (tok.box ? 2 : 1)) return null;
        if (!tok.box) return tok.parts.filter((p) => f >= p.at - 1).map((p, pi) => <PartView key={`${ti}-${pi}`} p={p} f={f} light={lt} inBox={false} first={ti === 0 && pi === 0}/>);
        const at = tok.parts[0].at - 2, b = ease(ramp(f, at, at + 4));
        return <span key={ti} style={{position: 'relative', display: 'inline-block', marginLeft: ti === 0 ? 0 : 14, padding: '6px 12px 8px', transform: `scale(${0.96 + 0.04 * b})`,
          background: light(f) ? '#9FB6E5' : '#141E31', border: `3px solid ${BLUE}`}}>
          {tok.parts.filter((p) => f >= p.at - 3).map((p, pi) => <PartView key={pi} p={p} f={f} light={lt} inBox first={pi === 0}/>)}
          {[[-8, -8], [null, null]].map(([x, y], k) => <span key={k} style={{position: 'absolute', width: 13, height: 13, borderRadius: 13, background: '#fff', border: `3px solid ${BLUE}`,
            left: x === null ? undefined : x, top: y === null ? undefined : y, right: x === null ? -8 : undefined, bottom: y === null ? -8 : undefined}}/>)}
        </span>;
      })}
    </div>)}
  </div>;
};

// ---------------------------------------------------------------- B1-B3: icon, lockup, versus (one continuous morph)

const Intro: React.FC<{f: number}> = ({f}) => {
  const toLock = inout(ramp(f, A.lockup, A.lockup + 9)), toVs = inout(ramp(f, A.versus, A.versus + 10));
  // icon: centre hero -> left of the lockup -> small lockup at the top
  const ix = mix(mix(540, 225, toLock), 351, toVs), iy = mix(mix(860, 900, toLock), 650, toVs), is = mix(mix(340, 178, toLock), 106, toVs);
  const wm = ramp(f, A.lockup + 2, A.lockup + 9); // wordmark reveal
  const wx = mix(350, 425, toVs), wy = mix(900, 650, toVs), ws = mix(132, 78, toVs);
  const rings = 1 - toLock;
  const pills = 1 - ramp(f, A.lockup, A.lockup + 6);
  const tile = (at: number, x: number, logo: React.ReactNode, name: string, by: string) => {
    const p = pop(f, at, 13);
    return <div style={{position: 'absolute', left: x, top: 912 + (1 - p) * 90, width: 390, height: 388, opacity: Math.min(1, p * 1.4), borderRadius: 30, background: '#151515', border: '1.5px solid #262626', boxShadow: '0 30px 70px #000a',
      display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 46}}>
      {logo}
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: '#fff', marginTop: 36}}>{name}</div>
      <div style={{fontFamily: SANS, fontWeight: 400, fontSize: 27, color: '#8E8E8E', marginTop: 8}}>{by}</div>
    </div>;
  };
  const vs = ramp(f, A.versus + 4, A.versus + 12);
  return <AbsoluteFill style={blurOut(f, A.built - 5)}>
    {rings > 0 ? [200, 290, 430].map((r, k) => {
      const pulse = 1 + 0.035 * Math.sin((f / FPS) * Math.PI * 2 * 0.9 - k * 1.2);
      return <div key={k} style={{position: 'absolute', left: 540 - r * pulse, top: 860 - r * pulse, width: 2 * r * pulse, height: 2 * r * pulse, borderRadius: '50%', opacity: rings * (0.85 - k * 0.18),
        border: `${k === 2 ? 3 : 4}px solid #c4644a`, boxShadow: `0 0 ${24 + k * 10}px #d9775a55, inset 0 0 ${20 + k * 8}px #d9775a33`}}/>;
    }) : null}
    <DuetIcon size={is} style={{position: 'absolute', left: ix - is / 2, top: iy - is / 2}}/>
    {rings > 0 ? <div style={{position: 'absolute', left: ix + is / 2 - 46, top: iy - is / 2 - 24, width: 72, height: 72, borderRadius: 72, background: '#E5484D', border: '5px solid #0A0A0A',
      opacity: rings, transform: `scale(${pop(f, 3, 10)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 38, color: '#fff'}}>1</div> : null}
    {pills > 0 ? <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, opacity: pills}}>
      <div style={{transform: `scale(${pop(f, A.anthropic + 2)})`}}><Pill dark size={32}><Img src={file('anthropic-mark.svg')} style={{height: 26, filter: 'invert(1)'}}/>Anthropic</Pill></div>
      <div style={{transform: `scale(${pop(f, A.unveiled)})`}}><Pill size={32}><span style={{width: 14, height: 14, borderRadius: 14, background: '#34C759'}}/>Just announced</Pill></div>
    </div> : null}
    <div style={{position: 'absolute', left: wx, top: wy - ws * 0.62, fontFamily: DISPLAY, fontSize: ws, color: '#F6F3EC', letterSpacing: -1, whiteSpace: 'nowrap',
      opacity: wm, filter: wm < 1 ? `blur(${(1 - wm) * 12}px)` : undefined, clipPath: `inset(0 ${(1 - wm) * 100}% 0 0)`}}>Claude Duet</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: mix(1006, 708, toVs), display: 'flex', justifyContent: 'center', opacity: ramp(f, A.lockup + 6, A.lockup + 12), transform: `scale(${mix(1, 0.62, toVs)})`}}>
      <Pill dark size={26}>Research preview</Pill></div>
    {vs > 0 ? <>
      <div style={{position: 'absolute', top: 860, left: 150, width: 270 * vs, height: 2, background: '#3a3a3a'}}/>
      <div style={{position: 'absolute', top: 860, right: 150, width: 270 * vs, height: 2, background: '#3a3a3a'}}/>
      <div style={{position: 'absolute', top: 790, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 120, color: CORAL, opacity: vs, filter: `blur(${(1 - vs) * 10}px)`}}>VS</div>
    </> : null}
    {tile(A.grok1, 90, <Squircle src="grok-bot-app-icon.png" size={176}/>, 'Grok Bot', 'by xAI')}
    {tile(A.dots1, 600, <div style={{width: 300, height: 176, borderRadius: 40, background: '#000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={file('openai-dots-wordmark.png')} style={{width: 280}}/></div>, 'OpenAI dots', 'by OpenAI')}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B3: notification

const Notif: React.FC<{f: number}> = ({f}) => {
  const exp = pop(f, A.reach, 14);
  return <AbsoluteFill style={{...blurIn(f, A.built - 4), ...blurOut(f, A.each - 4)}}>
    <div style={{position: 'absolute', left: 90, top: 720, width: 900, height: 370, borderRadius: 30, background: LAV, boxShadow: '0 40px 90px #000b', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 792, height: 182, borderRadius: 44, background: '#E9E7F0', boxShadow: '0 8px 30px #0002', transform: `scale(${0.55 + 0.45 * exp})`, opacity: Math.min(1, exp * 1.5),
        display: 'flex', alignItems: 'center', padding: '0 34px', gap: 26}}>
        <Img src={file('claude-duet-icon.svg')} style={{width: 84, height: 84, borderRadius: 19}}/>
        <div style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS}}><span style={{fontWeight: 600, fontSize: 33, color: '#151515'}}>Claude Duet</span><span style={{fontSize: 28, color: '#8a8a8a'}}>now</span></div>
          <div style={{fontFamily: SANS, fontSize: 30, color: '#222', lineHeight: 1.3, marginTop: 4}}>Morning, Maya. 5 things in progress and 2 that need you.</div>
        </div>
      </div>
    </div>
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B4: phone with the morning brief

const Phone: React.FC<{f: number}> = ({f}) => {
  const scroll = inout(ramp(f, A.each + 4, A.then - 6)) * 470;
  const icon = (at: number, x: number, src: string) => {
    const p = pop(f, at, 11);
    return <div style={{position: 'absolute', left: x - 60, top: 1212, transform: `scale(${p})`, opacity: Math.min(1, p * 2)}}>
      <Squircle src={src} size={120} bg="#fff" pad={21} style={{boxShadow: '0 16px 40px #0009'}}/>
      <div style={{position: 'absolute', right: -6, top: -6, width: 28, height: 28, borderRadius: 28, background: '#34C759', border: '4px solid #0A0A0A'}}/>
    </div>;
  };
  return <AbsoluteFill style={{...blurIn(f, A.each - 4), ...blurOut(f, A.then - 4)}}>
    <div style={{position: 'absolute', left: 180, top: 500, width: 720, height: 690, borderRadius: 30, background: LAV, overflow: 'hidden', boxShadow: '0 40px 90px #000b'}}>
      <div style={{position: 'absolute', left: 50, top: 34 - scroll, width: 620, padding: 12, borderRadius: 74, background: '#111'}}>
        <Img src={file('phone_brief.png')} style={{width: 596, display: 'block', borderRadius: 62}}/>
      </div>
    </div>
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <Pill dark size={28}><svg width={26} height={26} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke={CORAL} strokeWidth="2.4"/><path d="M3 10h18M8 3v4M16 3v4" stroke={CORAL} strokeWidth="2.4"/></svg>
        <span>8:00 AM</span><span style={{fontWeight: 400, color: '#9a9a9a'}}>· morning brief</span></Pill></div>
    {icon(A.gmail, 330, 'gmail.svg')}
    {icon(A.slack, 540, 'slack.svg')}
    {icon(A.calendar, 750, 'google-calendar-2020.svg')}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B5: reaches out, quiet until needed

const Split: React.FC<{f: number}> = ({f}) => {
  const bell = pop(f, A.needed, 10), tag = pop(f, A.needed + 3, 12);
  const ring = ramp(f, A.needed, A.needed + 22);
  const rows = ['Promo · 20% off this weekend', 'Newsletter · weekly digest', 'Thread · 14 new replies'];
  return <AbsoluteFill style={{...blurIn(f, A.then - 4), ...blurOut(f, A.it - 4)}}>
    <div style={{position: 'absolute', left: 90, top: 580, width: 900, height: 480, borderRadius: 28, overflow: 'hidden', background: LAV, boxShadow: '0 40px 90px #000b'}}>
      <div style={{position: 'absolute', left: 44, top: 170, fontFamily: TEXT, fontSize: 58, lineHeight: 1.12, color: '#1B1B1F', letterSpacing: -1}}>It reaches out<br/>before you ask</div>
      <div style={{position: 'absolute', left: 500, top: 0, width: 400, height: 480, background: '#111', padding: '0 0 0 12px'}}>
        <div style={{width: 388, height: 480, overflow: 'hidden', background: '#F6F5F2'}}>
          <Img src={file('phone_chicago.png')} style={{width: 388, display: 'block', transform: `translateY(${-90 - inout(ramp(f, A.then, A.it)) * 140}px)`}}/>
        </div>
      </div>
    </div>
    <div style={{position: 'absolute', left: 900, top: 528, width: 120, height: 120}}>
      {ring > 0 && ring < 1 ? <div style={{position: 'absolute', inset: -60 * ring, borderRadius: '50%', border: `3px solid ${CORAL}`, opacity: 1 - ring}}/> : null}
      <div style={{width: 120, height: 120, borderRadius: 120, background: CORAL, transform: `scale(${bell})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 36px #d9775a66'}}>
        <svg width={56} height={56} viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4L6 16z" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round"/><path d="M10 20.5a2 2 0 0 0 4 0" stroke="#fff" strokeWidth={2.2} fill="none"/></svg></div>
    </div>
    <div style={{position: 'absolute', left: 120, top: 552, transform: `scale(${tag})`, transformOrigin: 'left center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, background: '#E07A5F', color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 32, padding: '14px 26px', borderRadius: 999, boxShadow: '0 10px 30px #0007'}}>
        <svg width={28} height={28} viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4L6 16z" fill="none" stroke="#fff" strokeWidth={2.4}/></svg>Needs you</div></div>
    {rows.map((r, k) => {
      const at = A.quiet + k * 3, v = ease(ramp(f, at, at + 6)), strike = ease(ramp(f, A.until + k * 3, A.until + k * 3 + 7));
      return <div key={k} style={{position: 'absolute', left: 150, top: 1100 + k * 66, width: 780, height: 54, borderRadius: 16, background: '#141414', border: '1px solid #1f1f1f', opacity: v * (1 - 0.45 * strike),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', fontFamily: SANS, fontSize: 27, color: '#7a7a7a'}}>
        <span style={{position: 'relative'}}>{r}<span style={{position: 'absolute', left: 0, top: '52%', height: 2.5, width: `${strike * 100}%`, background: '#8a8a8a'}}/></span><span style={{color: '#5a5a5a'}}>can wait</span></div>;
    })}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B6: builds (thread -> dashboard -> forecast -> web app -> laptop)

const Thread: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{...blurIn(f, A.it - 4), ...blurOut(f, A.dashboards - 3)}}>
    <div style={{position: 'absolute', left: 116, top: 600, width: 848, height: 590, borderRadius: 28, overflow: 'hidden', background: LAV, boxShadow: '0 40px 90px #000b'}}>
      <div style={{position: 'absolute', left: 30, top: 0, width: 788, height: 590, background: '#111', padding: '0 14px'}}>
        <div style={{width: 760, height: 590, overflow: 'hidden', background: '#F6F5F2'}}>
          <Img src={file('phone_thread.png')} style={{width: 820, display: 'block', transform: `translate(-30px, ${-500 - inout(ramp(f, A.it, A.dashboards)) * 110}px)`}}/>
        </div>
      </div>
    </div>
  </AbsoluteFill>
);

const KPI: React.FC<{label: string; value: number; fmt: (v: number) => string; sub: string; p: number}> = ({label, value, fmt, sub, p}) => (
  <div style={{background: '#F7F6F3', borderRadius: 18, padding: '22px 24px', height: 168}}>
    <div style={{fontFamily: SANS, fontSize: 21, color: '#5a5a5a'}}>{label}</div>
    <div style={{fontFamily: TEXT, fontSize: 70, color: '#151515', letterSpacing: -2, lineHeight: 1.15}}>{fmt(value * (0.93 + 0.07 * p))}</div>
    <div style={{fontFamily: SANS, fontSize: 18, color: '#7a7a7a'}}>{sub}</div>
  </div>
);

const Builds: React.FC<{f: number}> = ({f}) => {
  const dash = ease(ramp(f, A.dashboards - 2, A.dashboards + 6)), tick = ease(ramp(f, A.dashboards, A.dashboards + 22));
  const fc = pop(f, A.sales, 14), web = pop(f, A.web, 14);
  const back = (p: number, depth: number) => ({transform: `translateY(${-depth * 70 * p}px) scale(${1 - 0.07 * depth * p})`, filter: `brightness(${1 - 0.45 * p})`});
  const toLap = inout(ramp(f, A.in1, A.in1 + 9));
  const draw = ramp(f, A.sales + 2, A.sales + 20);
  const pts = [[0, 120], [60, 104], [110, 112], [170, 84], [230, 92], [290, 60], [350, 70], [410, 40]];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0] * 1.6} ${p[1]}`).join(' ');
  return <AbsoluteFill style={{opacity: 1 - toLap, transform: `scale(${1 - 0.35 * toLap}) translateY(${toLap * 120}px)`}}>
    {/* dashboard card */}
    <div style={{position: 'absolute', left: 140, top: 560, width: 800, height: 660, opacity: dash, ...(fc > 0 ? back(Math.min(1, fc), web > 0 ? 1 + Math.min(1, web) : 1) : {})}}>
      <div style={{width: 800, height: 660, borderRadius: 28, background: '#111', padding: '0 16px', boxShadow: '0 40px 90px #000b'}}>
        <div style={{width: 768, height: 660, background: '#FBFAF7', padding: '40px 34px'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
            <KPI label="Revenue this week" value={528} fmt={(v) => `$${Math.round(v)}K`} sub="+9% vs last year" p={tick}/>
            <KPI label="Cash" value={2.1} fmt={(v) => `$${v.toFixed(1)}M`} sub="14 months of runway" p={tick}/>
            <KPI label="Cafés" value={11} fmt={(v) => `+${Math.round(v)}%`} sub="Same-café sales" p={tick}/>
            <KPI label="Subscriptions" value={4200} fmt={(v) => Math.round(v).toLocaleString('en-US')} sub="+38 this week" p={tick}/>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 34, fontFamily: SANS}}>
            <svg width={40} height={40} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="#333" strokeWidth="1.8"/><path d="M7 15l3-3 3 2 4-5" fill="none" stroke="#333" strokeWidth="1.8"/></svg>
            <div><div style={{fontSize: 30, color: '#151515', fontWeight: 500}}>Marlo Pulse</div><div style={{fontSize: 22, color: '#7a7a7a'}}>Updated now</div></div>
          </div>
        </div>
      </div>
    </div>
    {/* forecast card */}
    {fc > 0 ? <div style={{position: 'absolute', left: 130, top: 700 + (1 - fc) * 160, width: 820, opacity: Math.min(1, fc * 1.5), ...(web > 0 ? back(Math.min(1, web), 1) : {})}}>
      <div style={{borderRadius: 26, background: '#161616', border: '1.5px solid #2a2a2a', padding: '26px 30px', boxShadow: '0 30px 70px #000c'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS}}>
          <div style={{width: 52, height: 52, borderRadius: 14, background: '#8a4a3a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><svg width={30} height={30} viewBox="0 0 24 24"><path d="M4 16l5-5 4 3 7-7" fill="none" stroke="#fff" strokeWidth="2.2"/></svg></div>
          <span style={{fontWeight: 600, fontSize: 34, color: '#f2f2f2'}}>Sales forecast</span><span style={{fontSize: 26, color: '#7a7a7a'}}>next 90 days</span>
          <span style={{marginLeft: 'auto', fontSize: 24, fontWeight: 600, color: '#3DD56D', background: '#11301b', padding: '6px 14px', borderRadius: 999}}>↑ +11%</span>
        </div>
        <svg width={760} height={150} style={{marginTop: 18}}>
          <path d={path} fill="none" stroke="#f0f0f0" strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, draw * 1.25)}/>
          <path d={`M${410 * 1.6} 40 L${470 * 1.6} 18`} fill="none" stroke={CORAL} strokeWidth={4} strokeDasharray="10 9" opacity={ramp(draw, 0.8, 1)}/>
          <circle cx={470 * 1.6} cy={18} r={9} fill={CORAL} opacity={ramp(draw, 0.95, 1)}/>
        </svg>
      </div>
    </div> : null}
    {/* web app window */}
    {web > 0 ? <div style={{position: 'absolute', left: 130, top: 780 + (1 - web) * 200, width: 820, opacity: Math.min(1, web * 1.5)}}>
      <div style={{borderRadius: 26, background: '#141414', border: '1.5px solid #2b2b2b', overflow: 'hidden', boxShadow: '0 40px 90px #000d'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid #232323'}}>
          {['#555', '#555', '#555'].map((c, k) => <span key={k} style={{width: 14, height: 14, borderRadius: 14, background: c}}/>)}
          <div style={{flex: 1, margin: '0 20px', background: '#1f1f1f', borderRadius: 999, padding: '8px 0', textAlign: 'center', fontFamily: SANS, fontSize: 24, color: '#b5b5b5'}}>🔒 marlo · order ahead</div>
          <span style={{fontFamily: SANS, fontSize: 22, fontWeight: 600, color: '#3DD56D', background: '#11301b', padding: '4px 12px', borderRadius: 999}}>● Live</span>
        </div>
        <div style={{padding: '28px 34px 34px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}><span style={{width: 44, height: 44, borderRadius: 10, background: '#E07A5F'}}/><span style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#eee'}}>Marlo</span></div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 50, color: '#f5f5f5', marginTop: 26, letterSpacing: -1}}>Order ahead, skip the line.</div>
          <div style={{height: 12, width: 520, background: '#232323', borderRadius: 6, marginTop: 20}}/><div style={{height: 12, width: 420, background: '#232323', borderRadius: 6, marginTop: 12}}/>
          <div style={{display: 'flex', gap: 16, marginTop: 28}}>
            {[['Cold brew', '$4.50', '#5a3a28,#2e1d14'], ['Oat latte', '$5.25', '#c8a07c,#8a6448'], ['Croissant', '$3.75', '#e8b45a,#b98132']].map(([n, p, g]) => <div key={n} style={{flex: 1, borderRadius: 16, overflow: 'hidden', background: '#1c1c1c'}}>
              <div style={{height: 110, background: `linear-gradient(160deg, ${g})`}}/><div style={{padding: '12px 14px', fontFamily: SANS}}><div style={{fontSize: 24, fontWeight: 600, color: '#eee'}}>{n}</div><div style={{fontSize: 20, color: '#888'}}>{p}</div></div></div>)}
          </div>
          <div style={{display: 'inline-block', marginTop: 26, background: '#E07A5F', color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 26, padding: '14px 30px', borderRadius: 999}}>Order now</div>
        </div>
      </div>
    </div> : null}
  </AbsoluteFill>;
};

const Laptop: React.FC<{f: number}> = ({f}) => {
  const p = ease(ramp(f, A.in1 + 2, A.in1 + 10));
  const off = ramp(f, A.sleeps, A.sleeps + 4), done = ramp(f, A.sleeps + 6, A.sleeps + 10);
  const bar = ramp(f, A.in1 + 4, A.sleeps + 10);
  return <AbsoluteFill style={{opacity: p}}>
    <div style={{position: 'absolute', left: 134, top: 520 + (1 - p) * -40, width: 812, height: 150, borderRadius: 30, background: '#151515', border: '1.5px solid #2a2a2a', boxShadow: '0 30px 70px #000b',
      display: 'flex', alignItems: 'center', gap: 24, padding: '0 30px'}}>
      <DuetIcon size={92}/>
      <div style={{flex: 1, fontFamily: SANS}}>
        <div><span style={{fontWeight: 600, fontSize: 34, color: '#f4f4f4'}}>Claude Duet</span><span style={{fontSize: 26, color: '#8a8a8a', marginLeft: 14}}>☁ its own cloud computer</span></div>
        <div style={{fontSize: 28, fontWeight: 600, marginTop: 8, color: done > 0.5 ? '#3DD56D' : '#bdbdbd'}}>{done > 0.5 ? 'Task finished · sent for review' : 'Still working on your forecast…'}</div>
        <div style={{height: 5, borderRadius: 5, background: '#2a2a2a', marginTop: 10}}><div style={{height: 5, borderRadius: 5, width: `${bar * 100}%`, background: done > 0.5 ? '#3DD56D' : '#777'}}/></div>
      </div>
      {done > 0 ? <Check size={52} p={done}/> : <div style={{width: 46, height: 46, borderRadius: 46, border: '5px solid #333', borderTopColor: '#bbb', transform: `rotate(${f * 18}deg)`}}/>}
    </div>
    <div style={{position: 'absolute', left: 188, top: 760 + (1 - p) * 60, width: 704}}>
      <div style={{width: 704, height: 440, borderRadius: '26px 26px 0 0', background: '#1c1c1c', border: '3px solid #333', padding: 16}}>
        <div style={{width: '100%', height: '100%', borderRadius: 10, overflow: 'hidden', background: '#000', position: 'relative'}}>
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1b1b1b,#101010)', opacity: 1 - off, padding: 30, transform: `scaleY(${1 - off * 0.96})`, filter: `brightness(${1 + off * 2})`}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#eee'}}>Order ahead, skip the line.</div>
            <div style={{display: 'flex', gap: 12, marginTop: 24}}>{['#5a3a28', '#c8a07c', '#e8b45a'].map((c) => <div key={c} style={{flex: 1, height: 130, borderRadius: 12, background: c}}/>)}</div>
            <div style={{width: 160, height: 44, borderRadius: 999, background: '#E07A5F', marginTop: 24}}/>
          </div>
        </div>
      </div>
      <div style={{width: 820, height: 26, marginLeft: -58, borderRadius: '0 0 22px 22px', background: 'linear-gradient(#3a3a3a,#1e1e1e)'}}/>
    </div>
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B7: prices (light block)

const priceRoll = (f: number, at: number, to: number) => Math.round(to * ease(ramp(f, at - 10, at + 6)));
const PriceCard: React.FC<{f: number; x: number; top: number; scale: number; dim: number; logo: React.ReactNode; name: string; label: string; price: number; at: number; plus?: boolean; inAt: number}> =
  ({f, x, top, scale, dim, logo, name, label, price, at, plus, inAt}) => {
    const e = blurIn(f, inAt, 7);
    return <div style={{position: 'absolute', left: x, top, width: 400, transformOrigin: 'top left', transform: `scale(${scale})`, ...e, opacity: (e.opacity as number) * (1 - 0.45 * dim)}}>
      <div style={{background: '#fff', borderRadius: 34, boxShadow: '0 24px 60px #00000016, 0 2px 6px #0000000c', padding: '40px 30px 34px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {logo}
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: '#111', marginTop: 22}}>{name}</div>
        <div style={{height: 1.5, width: '100%', background: '#ECEAE4', margin: '22px 0 20px'}}/>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 20, letterSpacing: 4, color: '#6B6B6B'}}>{label}</div>
        <div style={{display: 'flex', alignItems: 'baseline', marginTop: 8, fontFamily: SANS}}>
          <span style={{fontWeight: 800, fontSize: 92, color: '#111', letterSpacing: -2}}>${priceRoll(f, at, price)}</span>
          {plus ? <span style={{fontWeight: 800, fontSize: 70, color: '#E5484D', opacity: ramp(f, at, at + 4)}}>+</span> : null}
          <span style={{fontSize: 30, color: '#6B6B6B', marginLeft: 8}}>/mo</span>
        </div>
      </div>
    </div>;
  };

const Prices: React.FC<{f: number}> = ({f}) => {
  const up = inout(ramp(f, A.and2, A.and2 + 10));
  const card = pop(f, A.and2 + 3, 15);
  const tile = (src: string, top: string, big: string, at: number) => <div style={{flex: 1, background: '#fff', borderRadius: 26, boxShadow: '0 10px 30px #0000000f', padding: '22px 22px', display: 'flex', alignItems: 'center', gap: 18}}>
    <Squircle src={src} size={92}/>
    <div style={{flex: 1, fontFamily: SANS}}><div style={{fontSize: 24, color: '#6B6B6B'}}>{top}</div><div style={{fontWeight: 700, fontSize: 52, color: '#111', lineHeight: 1}}>{big}</div></div>
    <Check size={64} p={pop(f, at, 11)}/>
  </div>;
  return <AbsoluteFill>
    <PriceCard f={f} x={mix(90, 222, up)} top={mix(690, 470, up)} scale={mix(1, 0.64, up)} dim={up} inAt={A.dots2} at={A.hundred} price={100} plus name="OpenAI dots" label="LAUNCHED ON"
      logo={<div style={{width: 300, height: 168, borderRadius: 40, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}><Img src={file('openai-dots-wordmark.png')} style={{width: 282}}/></div>}/>
    <PriceCard f={f} x={mix(590, 600, up)} top={mix(690, 470, up)} scale={mix(1, 0.64, up)} dim={up} inAt={A.grok2} at={A.thirty} price={30} name="Grok Bot" label="NOW FROM"
      logo={<Squircle src="grok-bot-app-icon.png" size={168}/>}/>
    {card > 0 ? <div style={{position: 'absolute', left: 100, top: 860 + (1 - card) * 220, width: 880, opacity: Math.min(1, card * 1.6), background: '#F8F6F0', borderRadius: 36, boxShadow: '0 30px 80px #00000022', padding: '36px 36px 40px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
        <Img src={file('claude-duet-icon.svg')} style={{width: 112, height: 112, borderRadius: 26}}/>
        <div><div style={{fontFamily: DISPLAY, fontSize: 76, color: '#111', lineHeight: 1}}>Claude Duet</div>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, background: '#E3F3E6', color: '#1E7B3A', fontFamily: SANS, fontWeight: 600, fontSize: 26, padding: '6px 16px', borderRadius: 999, transform: `scale(${pop(f, A.included, 12)})`, transformOrigin: 'left center'}}>✓ Included in your plan</div></div>
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 32}}>{tile('claude-app-icon.png', 'Claude', 'Pro', A.pro)}{tile('claude-app-icon.png', 'Claude', 'Max', A.twenty)}</div>
    </div> : null}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B8: model

const Model: React.FC<{f: number}> = ({f}) => {
  const icon = blurIn(f, A.and3, 8), ring = ramp(f, A.and3 + 4, A.opus);
  const toOpus = inout(ramp(f, A.opus, A.opus + 8));
  const big = ramp(f, A.five2, A.five2 + 5);
  const toGauge = inout(ramp(f, A.which, A.which + 10));
  const sweep = ease(ramp(f, A.which + 4, A.leading + 4));
  const lead = ramp(f, A.leading, A.leading + 5);
  const iconSize = mix(240, 120, toOpus), iconY = mix(900, 600, toOpus);
  const R = 300, ang = Math.PI * (1 - 0.94 * sweep);
  return <AbsoluteFill style={blurOut(f, A.right - 4)}>
    <div style={{position: 'absolute', left: 540 - iconSize / 2, top: iconY - iconSize / 2, width: iconSize, height: iconSize, opacity: (icon.opacity as number) * (1 - toGauge), filter: icon.filter}}>
      <Squircle src="claude-app-icon.png" size={iconSize} style={{boxShadow: '0 0 120px #ff8a3d66'}}/>
      {toOpus < 1 ? <svg width={iconSize + 90} height={iconSize + 90} style={{position: 'absolute', left: -45, top: -45, opacity: 1 - toOpus}}>
        <circle cx={(iconSize + 90) / 2} cy={(iconSize + 90) / 2} r={(iconSize + 70) / 2} fill="none" stroke="#3a2a1a" strokeWidth={6}/>
        <circle cx={(iconSize + 90) / 2} cy={(iconSize + 90) / 2} r={(iconSize + 70) / 2} fill="none" stroke="#E9A13B" strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring}
          transform={`rotate(-90 ${(iconSize + 90) / 2} ${(iconSize + 90) / 2})`} strokeLinecap="round"/></svg> : null}
    </div>
    {/* big type, then a boxed label above the gauge */}
    {f >= A.opus + 4 ? <div style={{position: 'absolute', left: 0, right: 0, top: mix(840, 560, toGauge), display: 'flex', justifyContent: 'center', ...blurIn(f, A.opus + 4, 6)}}>
      <div style={{position: 'relative', padding: `${mix(4, 2, toGauge)}px ${mix(30, 18, toGauge)}px`, background: '#141E31', border: `3px solid ${BLUE}`, fontFamily: DISPLAY, fontSize: mix(230, 110, toGauge), lineHeight: 1.05, color: '#F4EFE6'}}>
        Opus <span style={{color: CORAL, opacity: f >= A.five2 ? 1 : 0.0, filter: big < 1 ? `blur(${(1 - big) * 10}px)` : undefined}}>5.5</span>
        {[0, 1].map((k) => <span key={k} style={{position: 'absolute', width: 16, height: 16, borderRadius: 16, background: '#fff', border: `3px solid ${BLUE}`, ...(k ? {right: -10, bottom: -10} : {left: -10, top: -10})}}/>)}
      </div>
    </div> : null}
    {f >= A.opus ? <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 32, color: '#8E8E8E', ...blurIn(f, A.five2 + 4), opacity: (1 - toGauge) * ramp(f, A.five2 + 4, A.five2 + 10)}}>
      The model behind <span style={{color: '#fff', fontWeight: 600}}>Claude Duet</span></div> : null}
    {toGauge > 0 ? <div style={{position: 'absolute', left: 130, top: 760 + (1 - toGauge) * 120, width: 820, height: 560, opacity: toGauge, borderRadius: 30, background: '#141414', border: '1.5px solid #262626', boxShadow: '0 30px 80px #000c', padding: '30px 34px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS}}><Squircle src="claude-app-icon.png" size={50}/><span style={{fontWeight: 600, fontSize: 32, color: '#f2f2f2'}}>Claude Opus 5.5</span><span style={{fontSize: 26, color: '#7a7a7a'}}>· model strength</span></div>
      <svg width={760} height={420} style={{position: 'absolute', left: 30, top: 110}}>
        <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#D9775A"/><stop offset="1" stopColor="#F0B13E"/></linearGradient></defs>
        {Array.from({length: 13}).map((_, k) => {
          const a = Math.PI * (1 - k / 12), r1 = R + 26, r2 = R + 42;
          return <line key={k} x1={380 + r1 * Math.cos(a)} y1={360 - r1 * Math.sin(a)} x2={380 + r2 * Math.cos(a)} y2={360 - r2 * Math.sin(a)} stroke="#3a3a3a" strokeWidth={3}/>;
        })}
        <path d={`M ${380 - R} 360 A ${R} ${R} 0 0 1 ${380 + R} 360`} fill="none" stroke="#262626" strokeWidth={30} strokeLinecap="round"/>
        <path d={`M ${380 - R} 360 A ${R} ${R} 0 0 1 ${380 + R} 360`} fill="none" stroke="url(#g)" strokeWidth={30} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - 0.94 * sweep}
          style={{filter: 'drop-shadow(0 0 14px #f0a13e88)'}}/>
        <circle cx={380 + R * Math.cos(ang)} cy={360 - R * Math.sin(ang)} r={16} fill="#fff" opacity={sweep > 0.02 ? 1 : 0}/>
      </svg>
      <Img src={file('claude-mark.svg')} style={{position: 'absolute', left: 410 - 40, top: 200, width: 80, height: 80, opacity: toGauge}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: DISPLAY, fontStyle: 'italic', fontSize: 86, color: '#F4EFE6'}}>
        <span style={{position: 'absolute', left: 0, right: 0, opacity: 1 - lead, filter: `blur(${lead * 10}px)`}}>Frontier</span>
        <span style={{position: 'absolute', left: 0, right: 0, opacity: lead, filter: `blur(${(1 - lead) * 10}px)`}}>Leading model</span></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 430, textAlign: 'center', fontFamily: SANS, fontSize: 27, color: '#8a8a8a'}}>Anthropic's own words · Sep 22, 2026</div>
    </div> : null}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B9: waitlist

const Cursor: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
    {click > 0 && click < 1 ? <div style={{position: 'absolute', left: -50 * click, top: -50 * click, width: 100 * click, height: 100 * click, borderRadius: '50%', border: `3px solid ${BLUE}`, opacity: 1 - click}}/> : null}
    <svg width={46} height={58} viewBox="0 0 23 29" style={{position: 'absolute', left: -4, top: -2, filter: 'drop-shadow(0 4px 8px #0008)'}}>
      <path d="M2 2 L2 24 L8 18.5 L12 27 L16 25.3 L12 17 L20 17 Z" fill="#111" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round"/></svg>
  </div>
);

const Waitlist: React.FC<{f: number}> = ({f}) => {
  const clickAt = A.so - 6;
  const cx = mix(980, 600, ease(ramp(f, clickAt - 14, clickAt))), cy = mix(1300, 880, ease(ramp(f, clickAt - 14, clickAt)));
  const press = f >= clickAt ? 1 - 0.04 * Math.sin(Math.PI * ramp(f, clickAt, clickAt + 6)) : 1;
  return <AbsoluteFill style={{...blurIn(f, A.right - 4), ...blurOut(f, A.so + 2)}}>
    <div style={{position: 'absolute', left: 110, top: 660, width: 860, height: 380, borderRadius: 32, background: LAV, boxShadow: '0 40px 90px #000b', transform: `scale(${press})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 24, color: '#333', background: '#F4F3F7', border: '1.5px solid #c9c7d6', padding: '6px 16px', borderRadius: 10}}>Research preview</div>
      <div style={{fontFamily: TEXT, fontSize: 70, lineHeight: 1.14, color: '#17171A', textAlign: 'center', marginTop: 22, letterSpacing: -1.2}}>Join the waitlist and<br/>help us shape it</div>
    </div>
    <div style={{position: 'absolute', top: 1110, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, A.waitlist, 12)})`}}>
      <Pill size={34}><svg width={28} height={28} viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="none" stroke="#111" strokeWidth="2.2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#111" strokeWidth="2.2"/></svg>Waitlist only</Pill></div>
    <div style={{position: 'absolute', top: 1206, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, A.usonly, 12)})`}}>
      <Pill dark size={34}>US · Pro &amp; Max first</Pill></div>
    {f >= clickAt - 14 ? <Cursor x={cx} y={cy} click={ramp(f, clickAt, clickAt + 10)}/> : null}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- B10: comment-keyword CTA (Hammad's own profile)

const Cta: React.FC<{f: number}> = ({f}) => {
  const follow = A.so + 6, field = A.so + 12, sendAt = A.duet3 + 14, banner = A.guide - 2;
  const typed = 'DUET'.slice(0, Math.max(0, Math.min(4, Math.floor((f - A.duet3) / 3) + 1)));
  const posted = f >= sendAt + 2, reply = f >= A.send;
  // [arrive frame, x, y, travel frames]
  const path: [number, number, number, number][] = [[A.so, 980, 1340, 0], [follow, 540, 762, 6], [field, 560, 1278, 6], [sendAt, 922, 1278, 8]];
  let cx = path[0][1], cy = path[0][2];
  for (let k = 1; k < path.length; k++) {
    const p = ease(ramp(f, path[k][0] - path[k][3], path[k][0]));
    if (f >= path[k][0] - path[k][3]) { cx = mix(path[k - 1][1], path[k][1], p); cy = mix(path[k - 1][2], path[k][2], p); }
  }
  const clickP = [follow, field, sendAt].map((t) => ramp(f, t, t + 10)).find((v) => v > 0 && v < 1) || 0;
  const bp = pop(f, banner, 14);
  return <AbsoluteFill style={blurIn(f, A.so - 2, 7)}>
    {bp > 0 ? <div style={{position: 'absolute', left: 120, top: 380 + (1 - bp) * -160, width: 840, opacity: Math.min(1, bp * 1.5), borderRadius: 30, background: '#1A1A1A', border: '1.5px solid #2c2c2c', boxShadow: '0 24px 60px #000c',
      display: 'flex', alignItems: 'center', gap: 22, padding: '20px 24px', zIndex: 3}}>
      <Img src={file('hammad_avatar.jpg')} style={{width: 84, height: 84, borderRadius: 84, objectFit: 'cover'}}/>
      <div style={{flex: 1, fontFamily: SANS}}><div><span style={{fontWeight: 600, fontSize: 30, color: '#f2f2f2'}}>with.hammad</span><span style={{fontSize: 26, color: '#8a8a8a'}}> · now</span></div>
        <div style={{fontSize: 24, color: '#6EA8FF', textDecoration: 'underline', marginTop: 6, whiteSpace: 'nowrap'}}>withhammad.com/resources/claude-duet</div></div>
      <div style={{width: 128, height: 84, borderRadius: 14, background: '#F7F6F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2}}>
        <Img src={file('claude-duet-icon.svg')} style={{width: 30, height: 30, borderRadius: 7}}/><span style={{fontFamily: DISPLAY, fontSize: 22, color: '#111'}}>Claude Duet</span></div>
    </div> : null}
    <div style={{position: 'absolute', left: 120, top: 540, width: 840, borderRadius: 32, background: '#141414', border: '1.5px solid #242424', padding: '24px 34px', boxShadow: '0 30px 80px #000c'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div style={{width: 124, height: 124, borderRadius: 124, padding: 4, background: 'linear-gradient(135deg,#333,#555)'}}><Img src={file('hammad_avatar.jpg')} style={{width: 116, height: 116, borderRadius: 116, objectFit: 'cover'}}/></div>
        <div style={{fontFamily: SANS}}><div style={{fontWeight: 700, fontSize: 44, color: '#f4f4f4'}}>with.hammad</div><div style={{fontWeight: 500, fontSize: 30, color: '#d6d6d6', marginTop: 4}}>Hammad Yousuf | AI Automation</div>
          <div style={{fontSize: 25, color: '#8a8a8a', marginTop: 6}}>AI agents & marketing automation · Dubai</div></div>
      </div>
      <div style={{marginTop: 18, height: 62, borderRadius: 16, background: f >= follow ? '#262626' : '#0095F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 32, color: '#fff'}}>
        {f >= follow ? 'Following ⌄' : 'Follow'}</div>
    </div>
    <div style={{position: 'absolute', left: 120, top: 830 + (1 - ease(ramp(f, A.so + 4, A.so + 14))) * 200, width: 840, height: 505, borderRadius: 32, background: '#121212', border: '1.5px solid #222', padding: '18px 34px', overflow: 'hidden'}}>
      <div style={{width: 70, height: 6, borderRadius: 6, background: '#3a3a3a', margin: '0 auto'}}/>
      <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 32, color: '#f2f2f2', marginTop: 14}}>Comments</div>
      {[0, 1].map((k) => <div key={k} style={{display: 'flex', gap: 18, marginTop: k ? 18 : 26, opacity: posted ? 0.5 : 1}}><div style={{width: 48, height: 48, borderRadius: 48, background: '#222'}}/>
        <div><div style={{width: 160, height: 12, borderRadius: 6, background: '#262626'}}/><div style={{width: 380, height: 12, borderRadius: 6, background: '#222', marginTop: 10}}/></div></div>)}
      {posted ? <div style={{marginTop: 20, ...blurIn(f, sendAt + 2, 4)}}>
        <div style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}><div style={{width: 48, height: 48, borderRadius: 48, border: '2px solid #444'}}/>
          <div><div style={{fontFamily: SANS, fontSize: 22, color: '#8a8a8a'}}>you · now</div><div style={{display: 'inline-block', marginTop: 6, background: '#fff', color: '#111', fontFamily: SANS, fontWeight: 700, fontSize: 30, padding: '4px 14px', borderRadius: 10}}>DUET</div></div></div>
        {reply ? <div style={{display: 'flex', gap: 14, alignItems: 'center', marginTop: 14, marginLeft: 60, ...blurIn(f, A.send, 4)}}><Img src={file('hammad_avatar.jpg')} style={{width: 46, height: 46, borderRadius: 46, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS}}><div style={{fontSize: 22, color: '#8a8a8a'}}><b style={{color: '#ddd'}}>with.hammad</b> · now</div><div style={{fontSize: 28, color: '#eee'}}>Sent! Check your DMs</div></div></div> : null}
      </div> : null}
      <div style={{position: 'absolute', left: 34, right: 34, bottom: 22, height: 70, borderRadius: 999, background: '#1e1e1e', display: 'flex', alignItems: 'center', padding: '0 12px 0 28px', fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#fff'}}>
        <span style={{flex: 1}}>{f >= A.duet3 && !posted ? typed : ''}{f >= field && !posted && Math.floor(f / 8) % 2 === 0 ? <span style={{color: BLUE}}>|</span> : null}</span>
        <div style={{width: 52, height: 52, borderRadius: 52, background: '#2F5BEA'}}/></div>
    </div>
    {f < banner + 20 ? <Cursor x={cx} y={cy} click={clickP}/> : null}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- presenter (bottom band)

const Presenter: React.FC = () => {
  const P = D.presenter;
  const take = <Video src={file('take.mp4')} muted style={{position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h}}/>;
  return <>
    <div style={{position: 'absolute', left: P.cardX, top: P.cardTop, width: P.cardW, height: H - P.cardTop + 80, borderRadius: 64, overflow: 'hidden', border: '1.5px solid #ffffff1f', boxShadow: '0 -20px 70px #000a', background: '#0b0b0b'}}>
      <div style={{position: 'absolute', left: -P.cardX, top: -P.cardTop, width: W, height: H}}>{take}</div>
    </div>
    {/* the head breaks out above the card's top edge */}
    <div style={{position: 'absolute', left: P.cardX, top: 0, width: P.cardW, height: P.cardTop + 2, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -P.cardX, top: 0, width: W, height: H}}>
        <OffthreadVideo src={file('cutout.webm')} muted transparent style={{position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h}}/>
      </div>
    </div>
  </>;
};

// ---------------------------------------------------------------- reel

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const isLight = (t: number) => t >= A.iris1 + 3 && t < A.iris2 + 3;
  const dark = (glow?: [number, number]) => <Canvas glow={glow}/>;
  const scene = (from: number, to: number, node: React.ReactNode) => (f >= from && f < to ? node : null);
  return <AbsoluteFill style={{background: '#0A0A0A', overflow: 'hidden'}}>
    {f < A.iris1 + 8 ? <AbsoluteFill>
      {dark(f < A.built ? [540, 860] : [540, 920])}
      {scene(0, A.built + 2, <Intro f={f}/>)}
      {scene(A.built - 6, A.each + 2, <Notif f={f}/>)}
      {scene(A.each - 6, A.then + 2, <Phone f={f}/>)}
      {scene(A.then - 6, A.it + 2, <Split f={f}/>)}
      {scene(A.it - 6, A.dashboards + 2, <Thread f={f}/>)}
      {scene(A.dashboards - 2, A.in1 + 12, <Builds f={f}/>)}
      {scene(A.in1, A.iris1 + 8, <Laptop f={f}/>)}
    </AbsoluteFill> : null}
    {f >= A.iris1 && f < A.iris2 + 8 ? <Iris f={f} at={A.iris1} x={540} y={980}>
      <Canvas light/>
      <Prices f={f}/>
    </Iris> : null}
    {f >= A.iris2 ? <Iris f={f} at={A.iris2} x={430} y={1160}>
      {dark()}
      {scene(A.iris2, A.right + 2, <Model f={f}/>)}
      {scene(A.right - 6, A.so + 8, <Waitlist f={f}/>)}
      {scene(A.so - 2, D.frames, <Cta f={f}/>)}
    </Iris> : null}
    <Captions f={f} light={isLight}/>
    <Presenter/>
    <Audio src={file('voice.wav')}/>
    {D.sfx ? D.sfx.map((s: any, k: number) => <Sequence key={k} from={s.at} layout="none"><Audio src={file(`sfx/${s.name}.wav`)} volume={s.vol ?? 0.5}/></Sequence>) : null}
  </AbsoluteFill>;
};
