import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Chamber AI Hub reel (job 762cf7fb383a), copying @talcai.io's edit (analysis/visual.md): split screen, a cream "paper"
// top panel (~40 %) with heavy black keyword titles, orange accent words, a hand-drawn red ring and tilted taped
// screenshots of the real site, the presenter below; full-frame face beats; one full-frame site recording; a CTA.
// Fixes over the reference: real site screenshots only (no invented agent cards), "for Dubai Chambers members",
// public prices (AED 270-839/month + credits), claims attributed to Dubai Chambers, a comment keyword on screen.
loadFont({family: 'DhBlack', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'DhInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'DhInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'DhHand', url: staticFile('fonts/caveat-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'DhMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30, TOP = 760;
const BLACK = 'DhBlack, Arial Black, sans-serif', SANS = 'DhInter, Arial, sans-serif', HAND = 'DhHand, cursive', MONO = 'DhMono, monospace';
const INK = '#141414', ORANGE = '#F26A1B', RED = '#E1251B', NAVY = '#0B1F3A', PAPER = '#F2ECDF';
const file = (s: string) => staticFile('dubaihub/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 12, stiffness: 200}}));
type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// ---------------------------------------------------------------- presenter
const Take: React.FC<{y?: number; scale?: number}> = ({y = 0, scale = 1}) => D.take
  ? <AbsoluteFill style={{transform: `translateY(${y}px) scale(${scale})`, transformOrigin: '50% 25%'}}>
      <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/></AbsoluteFill>
  : <AbsoluteFill style={{background: '#333'}}/>;
const Brand: React.FC<{top: number; dark?: boolean}> = ({top, dark}) => <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SANS,
  fontWeight: 800, fontSize: 22, letterSpacing: 7, color: dark ? 'rgba(20,20,20,.55)' : 'rgba(255,255,255,.75)', textShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>;

// ---------------------------------------------------------------- paper panel pieces
const Paper: React.FC<{children?: React.ReactNode; h?: number}> = ({children, h = TOP}) => <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden', background: PAPER}}>
  <svg width="1080" height={h} style={{position: 'absolute', inset: 0, opacity: 0.35}}><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.55 0"/></filter><rect width="1080" height={h} filter="url(#n)"/></svg>
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0) 50%, rgba(120,95,60,.18) 100%)'}}/>
  {children}</div>;

const Title: React.FC<{f: number; at: number; text: string; color?: string; size?: number; x?: number; y: number; align?: 'left' | 'center'}> = ({f, at, text, color = INK, size = 92, x = 60, y, align = 'left'}) => {
  const p = pop(f, at);
  return f < at ? null : <div style={{position: 'absolute', left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, top: y, textAlign: align, fontFamily: BLACK, fontSize: size, lineHeight: 0.95,
    color, letterSpacing: -1, transform: `scale(${0.82 + 0.18 * p})`, transformOrigin: align === 'center' ? '50% 50%' : '0 50%', opacity: Math.min(1, p * 1.6), whiteSpace: 'nowrap'}}>{text}</div>;
};
const Note: React.FC<{f: number; at: number; text: string; x?: number; y: number; color?: string; size?: number; align?: 'left' | 'center'}> = ({f, at, text, x = 64, y, color = ORANGE, size = 54, align = 'left'}) =>
  f < at ? null : <div style={{position: 'absolute', left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, textAlign: align, top: y, fontFamily: HAND, fontSize: size, color,
    clipPath: `inset(0 ${100 - 100 * ease(ramp(f, at, at + 14))}% 0 0)`}}>{text}</div>;
// hand-drawn red ring around a word
const Ring: React.FC<{f: number; at: number; x: number; y: number; w: number; h: number}> = ({f, at, x, y, w, h}) => {
  const p = ease(ramp(f, at, at + 12)), L = 2.2 * Math.PI * Math.max(w, h);
  return f < at ? null : <svg style={{position: 'absolute', left: x - 20, top: y - 16, overflow: 'visible'}} width={w + 40} height={h + 32}>
    <path d={`M ${w * 0.1 + 20} ${h * 0.15 + 16} C ${w * 0.55} ${-6}, ${w + 46} ${h * 0.05}, ${w + 34} ${h * 0.55 + 16} S ${w * 0.55} ${h + 40}, ${18} ${h * 0.62 + 16} S ${w * 0.3} ${4}, ${w * 0.62} ${10}`}
      stroke={RED} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)}/></svg>;
};
// tilted screenshot with tape strips
const Taped: React.FC<{f: number; at: number; src: string; x: number; y: number; w: number; rot?: number; crop?: [number, number, number, number]}> = ({f, at, src, x, y, w, rot = -2, crop}) => {
  const p = pop(f, at);
  if (f < at) return null;
  const [cx, cy, cw, ch] = crop || [0, 0, 1080, 1350], h = w * ch / cw;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot}deg) translateY(${(1 - p) * 60}px)`, opacity: Math.min(1, p * 2),
    boxShadow: '0 14px 30px rgba(60,40,10,.28)', background: '#fff', padding: 6}}>
    <div style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}>
      <Img src={file(src)} style={{position: 'absolute', left: -cx * (w - 12) / cw, top: -cy * (w - 12) / cw, width: 1080 * (w - 12) / cw}}/></div>
    {[[-22, 'left'], [-22, 'right']].map(([t, side], i) => <div key={i} style={{position: 'absolute', top: t as number, [side as string]: 30, width: 110, height: 40,
      background: 'rgba(235,225,190,.85)', transform: `rotate(${i ? 6 : -7}deg)`, boxShadow: '0 1px 3px rgba(0,0,0,.12)'}}/>)}
  </div>;
};
const Tag: React.FC<{f: number; at: number; text: string}> = ({f, at, text}) => f < at ? null :
  <div style={{display: 'inline-block', fontFamily: MONO, fontWeight: 700, fontSize: 30, color: INK, border: `3px solid ${INK}`, padding: '4px 12px', margin: '0 10px 10px 0',
    background: '#fff', transform: `scale(${0.7 + 0.3 * pop(f, at)})`}}>{text}</div>;

// ---------------------------------------------------------------- layouts
const Split: React.FC<{top: React.ReactNode}> = ({top}) => <AbsoluteFill style={{background: '#000'}}>
  <div style={{position: 'absolute', left: 0, top: TOP, width: 1080, height: 1920 - TOP, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: -TOP, width: 1080, height: 1920}}><Take y={TOP - 260}/></div></div>
  {top}
  <div style={{position: 'absolute', left: 0, right: 0, top: TOP - 2, height: 4, background: 'rgba(0,0,0,.4)'}}/>
  <Brand top={1720}/>
</AbsoluteFill>;
const Face: React.FC<{children?: React.ReactNode; scale?: number}> = ({children, scale = 1}) => <AbsoluteFill style={{background: '#000'}}><Take scale={scale}/><Brand top={1560}/>{children}</AbsoluteFill>;

const RecTop: React.FC<{src: string; from: number; startS: number; h?: number; y?: number; zoom?: [number, number]; origin?: string}> = ({src, from, startS, h = TOP, y = 0, zoom = [1, 1], origin = '50% 20%'}) => {
  const f = useCurrentFrame(), z = interpolate(f, [from, from + 60], zoom, clamp);
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden', background: NAVY}}>
    <div style={{position: 'absolute', left: 0, top: -y, width: 1080, height: 1350, transform: `scale(${z})`, transformOrigin: origin}}>
      <Sequence from={from} layout="none"><OffthreadVideo src={file(src)} muted startFrom={Math.round(startS * FPS)} style={{width: 1080, height: 1350}}/></Sequence></div></div>;
};

// ---------------------------------------------------------------- scenes
const Hook: React.FC<{u: Unit; f: number}> = ({u, f}) => <Split top={<>
  <RecTop src="r_hero.mp4" from={u.from} startS={6.6} zoom={[1.3, 1]} origin="0% 20%"/>
  <div style={{position: 'absolute', right: 40, top: 236, background: ORANGE, color: '#fff', fontFamily: BLACK, fontSize: 38, padding: '6px 18px', transform: 'rotate(-3deg)'}}>NEW IN DUBAI</div>
</>}/>;

const Press: React.FC<{u: Unit; f: number}> = ({u, f}) => <Split top={<>
  <RecTop src="r_hero.mp4" from={u.from} startS={11.5} y={260}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,31,58,.15), rgba(11,31,58,.75))'}}/>
  <div style={{position: 'absolute', left: 70, right: 70, top: 300, background: '#1B4E8C', borderRadius: 18, padding: '26px 30px', boxShadow: '0 20px 40px rgba(0,0,0,.4)',
    transform: `scale(${0.9 + 0.1 * pop(f, u.from + 2)})`, opacity: Math.min(1, pop(f, u.from + 2) * 2)}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#fff', lineHeight: 1.15}}>Dubai Chambers launches world's first chamber-led Agentic AI marketplace</div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,.75)', marginTop: 12}}>Dubai Chambers announcement · 26 Oct 2026 · "world's first" is its own claim</div></div>
</>}/>;

const Ready: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [rm, adm] = D.beats.ready;
  return <Split top={<Paper>
    <Title f={f} at={u.from} text="READY-TO-USE" y={250} size={70}/>
    <Title f={f} at={rm} text="AI AGENTS" color={ORANGE} y={335} size={104}/>
    <Ring f={f} at={rm + 8} x={58} y={335} w={560} h={100}/>
    <Note f={f} at={adm} text="for admin + operations work" y={490}/>
    <Taped f={f} at={u.from + 6} src="hero.png" x={680} y={420} w={360} rot={4} crop={[0, 60, 1080, 700]}/>
  </Paper>}/>;
};

const TAGS = ['COMPLIANCE', 'PROCUREMENT', 'OPERATIONS', 'FINANCE', 'SALES', 'HR', 'LOGISTICS'];
const Agents22: React.FC<{u: Unit; f: number}> = ({u, f}) => <Split top={<Paper>
  <Title f={f} at={u.from} text="22 AI AGENTS" y={238} size={70}/>
  <Title f={f} at={u.from + 10} text="7 AREAS" color={ORANGE} x={600} y={238} size={70}/>
  <Taped f={f} at={u.from + 6} src="sectors.png" x={60} y={350} w={560} rot={-2} crop={[0, 120, 1080, 900]}/>
  <div style={{position: 'absolute', left: 650, top: 360, width: 400}}>{TAGS.map((t, i) => <Tag key={t} f={f} at={D.beats.tags[i]} text={t}/>)}</div>
  <div style={{position: 'absolute', left: 60, top: 712, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: 'rgba(20,20,20,.6)'}}>Figures per Dubai Chambers launch release · aihub.dubaichambers.com</div>
</Paper>}/>;

const Plan100: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [hund, two] = D.beats.plan100, n = Math.round(interpolate(f, [hund - 4, hund + 14], [22, 100], clamp));
  return <Split top={<Paper>
    <div style={{position: 'absolute', left: 60, top: 230, fontFamily: BLACK, fontSize: 200, color: ORANGE, lineHeight: 1, letterSpacing: -4}}>{n}</div>
    <Note f={f} at={hund + 6} text="agents planned" x={70} y={440} size={64} color={INK}/>
    <Note f={f} at={two} text="over the next 2 years" x={70} y={510} size={54}/>
    <Ring f={f} at={hund + 14} x={50} y={240} w={330} h={190}/>
    <Taped f={f} at={u.from + 4} src="smes.png" x={520} y={250} w={510} rot={3} crop={[0, 40, 1080, 640]}/>
  </Paper>}/>;
};

const Site: React.FC<{u: Unit; f: number}> = ({u, f}) => <AbsoluteFill style={{background: '#fff'}}>
  <div style={{position: 'absolute', left: 0, top: 285, width: 1080, height: 1350, transform: `scale(${1 + 0.04 * ramp(f, u.from, u.to)})`}}>
    <Sequence from={u.from} layout="none"><OffthreadVideo src={file('r_smes.mp4')} muted startFrom={Math.round(3.6 * FPS)} style={{width: 1080, height: 1350}}/></Sequence></div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center'}}>
    <span style={{background: ORANGE, color: '#fff', fontFamily: BLACK, fontSize: 40, padding: '6px 20px'}}>REAL AGENTS ON THE HUB</span></div>
  <Brand top={1660} dark/>
</AbsoluteFill>;

const Sandbox: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [sb, free] = D.beats.sandbox;
  return <Split top={<Paper>
    <Title f={f} at={Math.min(sb - 2, u.from + 2)} text="SANDBOX" y={250} size={140} align="center"/>
    <Ring f={f} at={Math.min(sb + 8, u.from + 12)} x={250} y={250} w={580} h={140}/>
    <Note f={f} at={Math.min(sb + 10, u.from + 14)} text="try an agent before you activate it" y={420} align="center"/>
    <Taped f={f} at={free - 4} src="hero.png" x={200} y={510} w={680} rot={-2} crop={[60, 330, 980, 160]}/>
    <div style={{position: 'absolute', right: 40, top: 712, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: 'rgba(20,20,20,.6)'}}>Per Dubai Chambers · starter credits are complimentary</div>
  </Paper>}/>;
};

const Paid: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [pp] = D.beats.paid;
  return <Split top={<Paper>
    <Title f={f} at={Math.min(pp - 2, u.from + 2)} text="PAID PACKAGES" y={236} size={92} align="center"/>
    <Note f={f} at={pp + 8} text="from AED 270/month + usage credits" y={340} align="center" size={56}/>
    <Taped f={f} at={pp + 4} src="pricing_15.png" x={80} y={420} w={920} rot={-1.5} crop={[30, 690, 1020, 290]}/>
  </Paper>}/>;
};

const FaceBeat: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const i = D.units.filter((x: Unit) => x.kind === 'face').findIndex((x: Unit) => x.from === u.from);
  const [ar, adm] = D.beats.face_langs;
  return <Face scale={i % 2 ? 1.08 : 1}>
    {f >= ar && f < u.to ? <div style={{position: 'absolute', left: 0, right: 0, top: 980, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
      {[['ARABIC + ENGLISH', ar], ['ADMIN PORTAL FOR YOUR TEAM', adm]].map(([t, a], k) => f >= (a as number) ? <div key={k} style={{background: PAPER, color: INK, fontFamily: BLACK,
        fontSize: 46, padding: '8px 22px', transform: `rotate(${k ? 2 : -2}deg) scale(${0.8 + 0.2 * pop(f, a as number)})`, boxShadow: '0 10px 24px rgba(0,0,0,.35)'}}>{t}</div> : null)}
    </div> : null}
  </Face>;
};

const Hosted: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [h, sep] = D.beats.hosted;
  const flagP = ease(ramp(f, u.from, u.from + 12));
  return <Split top={<Paper>
    <div style={{position: 'absolute', left: 90, top: 250, width: 8, height: 400, background: '#6b5b45'}}/>
    <div style={{position: 'absolute', left: 98, top: 258, width: 220 * flagP, height: 130, overflow: 'hidden', boxShadow: '0 6px 14px rgba(0,0,0,.2)'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 60, height: 130, background: '#EF3340'}}/>
      <div style={{position: 'absolute', left: 60, top: 0, width: 160, height: 44, background: '#009739'}}/>
      <div style={{position: 'absolute', left: 60, top: 44, width: 160, height: 43, background: '#fff'}}/>
      <div style={{position: 'absolute', left: 60, top: 87, width: 160, height: 43, background: '#000'}}/></div>
    <Title f={f} at={h - 2} text="HOSTED" x={380} y={250} size={100}/>
    <Title f={f} at={h + 6} text="IN THE UAE" color={ORANGE} x={380} y={350} size={100}/>
    <Ring f={f} at={h + 16} x={370} y={350} w={600} h={100}/>
    {['COMPANY A', 'COMPANY B', 'COMPANY C'].map((c, i) => <div key={c} style={{position: 'absolute', left: 380 + i * 215, top: 520, width: 190, height: 120, background: NAVY, color: '#fff',
      fontFamily: MONO, fontWeight: 700, fontSize: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      transform: `scale(${pop(f, sep - 6 + i * 6)})`, boxShadow: '0 8px 18px rgba(0,0,0,.3)'}}><span style={{fontSize: 40}}>🔒</span>{c}</div>)}
    <div style={{position: 'absolute', right: 40, top: 712, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: 'rgba(20,20,20,.6)'}}>Illustration · each company's data kept separate (per Dubai Chambers)</div>
  </Paper>}/>;
};

const EndCard: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [dub, easy] = D.beats.endcard;
  return <Split top={<Paper>
    <Taped f={f} at={u.from} src="steps.png" x={660} y={330} w={370} rot={3} crop={[20, 90, 1040, 760]}/>
    <Title f={f} at={u.from + 2} text="CHAMBER" y={250} size={88}/>
    <Title f={f} at={u.from + 6} text="AI HUB" color={ORANGE} y={345} size={118}/>
    <Ring f={f} at={easy} x={58} y={345} w={400} h={118}/>
    <Note f={f} at={dub} text="for Dubai Chambers members" y={530} size={56}/>
    <Note f={f} at={easy + 6} text="UAE Pass + trade licence to sign up" y={600} size={44} color={INK}/>
  </Paper>}/>;
};

const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, dm} = D.beats.cta, word = 'DUBAI', up = pop(f, type - 4);
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - type) * 10 / FPS) + 1)));
  return <Face>
    <div style={{position: 'absolute', left: 70, right: 160, top: 930, transform: `translateY(${(1 - up) * 400}px)`, opacity: Math.min(1, up * 2), background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 62, height: 62, borderRadius: 31, background: ORANGE, color: '#fff', fontFamily: BLACK, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: f >= type ? INK : '#8e8e93'}}>{f >= type ? typed : 'Add a comment…'}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= dm ? <div style={{position: 'absolute', left: 110, top: 1086, transform: `scale(${pop(f, dm)})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 800, fontSize: 32, color: INK}}>Here's the Chamber AI Hub link 🇦🇪</div> : null}
  </Face>;
};

// Keyword captions: the reference has no word-by-word subtitles; its kinetic titles are the captions (kept as is).
export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  const S: Record<string, React.FC<{u: Unit; f: number}>> = {hook: Hook, press: Press, ready: Ready, agents22: Agents22, face: FaceBeat, plan100: Plan100, site: Site,
    sandbox: Sandbox, paid: Paid, hosted: Hosted, endcard: EndCard, cta: Cta};
  const Scene = S[u.kind];
  return <AbsoluteFill style={{background: '#000'}}>
    <Audio src={file('voice.wav')}/>
    <Scene u={u} f={f}/>
  </AbsoluteFill>;
};
