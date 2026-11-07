import React from 'react';
import {AbsoluteFill, Img, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// K2 Horizon reel (job 619b40c30868): @talcai.io's edit rebuilt beat for beat (analysis/visual.md). Stacked split screen
// the whole way: a cream "field note" paper collage on top (40%), the face below (60%) with word-build captions and a
// yellow active word. Same scenes in the same order: 3 quick b-roll cuts, FREE AI MODELS note, it's called K2 HORIZON +
// the site hero, the model-size ladder, HOW CAN IT HELP YOU?, the Deploy panel + NO LICENSE FEES, the glass-box section,
// Get started + Apache 2.0. Swapped: the news footage of UAE leaders (CC Abu Dhabi photos instead, credited), "13T tokens"
// (wrong, dropped), the chat-app URL (chat.ifm.ai), a comment-keyword ending (the reference has none).
// Face: take.mp4 pre-cut to a JPEG frame sequence (public/k2horizon/face, top 1380 px) by build-reel.py: the
// OffthreadVideo decoder kept dropping under load. Site stills: ifm.ai/k2 captured 2026-11-06. Timing: data.json (build-reel.py), every element lands on its spoken word.
loadFont({family: 'K2Inter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'K2Inter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'K2Inter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'K2Mono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'K2Mono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'K2Hand', url: staticFile('fonts/caveat-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'K2Serif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});

const D: any = data;
const FPS = 30;
const SANS = 'K2Inter, Arial, sans-serif', MONO = 'K2Mono, Menlo, monospace', HAND = 'K2Hand, cursive', SERIF = 'K2Serif, Georgia, serif';
const PAPER = '#EFEBE2', INK = '#15161A', RED = '#D93A2B', YEL = '#FFD21F', TEAL = '#2B5161';
const TOP = 768;                                   // paper panel height (reference ~40%)
const file = (s: string) => staticFile('k2horizon/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 210}}));

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// ---------------------------------------------------------------- paper primitives
const Paper: React.FC = () => <AbsoluteFill style={{background: PAPER}}>
  <svg width={1080} height={TOP} style={{position: 'absolute', opacity: 0.55}}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4}/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0.22 0"/></filter>
    <rect width={1080} height={TOP} filter="url(#grain)"/></svg>
</AbsoluteFill>;

// a stuck-on item: pops in with a small rotation settle, optional strip of masking tape on top
const Stuck: React.FC<{f: number; at: number; x: number; y: number; w: number; h?: number; rot?: number; tape?: boolean; children: React.ReactNode; from?: 'drop' | 'left' | 'right'}> =
  ({f, at, x, y, w, h, rot = 0, tape, children, from = 'drop'}) => {
    if (f < at) return null;
    const p = pop(f, at);
    const dx = from === 'left' ? (1 - p) * -160 : from === 'right' ? (1 - p) * 160 : 0, dy = from === 'drop' ? (1 - p) * -40 : 0;
    return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translate(${dx}px, ${dy}px) rotate(${rot + (1 - p) * 5}deg) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 2.5)}}>
      {children}
      {tape ? <div style={{position: 'absolute', left: '50%', top: -22, width: 150, height: 44, marginLeft: -75, background: 'rgba(222,212,186,.78)', transform: 'rotate(-4deg)', boxShadow: '0 1px 3px rgba(0,0,0,.12)'}}/> : null}
    </div>;
  };
const Shot: React.FC<{src: string; filter?: string; pad?: number}> = ({src, filter, pad = 0}) =>
  <div style={{background: '#fff', padding: pad, boxShadow: '0 10px 26px rgba(40,30,10,.22)', lineHeight: 0}}>
    <Img src={file(src)} style={{width: '100%', display: 'block', filter}}/></div>;

const Hand: React.FC<{f: number; at: number; x: number; y: number; text: string; size?: number; color?: string; rot?: number; font?: string; w?: number}> =
  ({f, at, x, y, text, size = 46, color = INK, rot = -2, font = HAND, w = 900}) => {
    if (f < at) return null;
    const n = Math.ceil(text.length * ease(ramp(f, at, at + Math.max(6, text.length * 0.7))));  // written on letter by letter
    return <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: font, fontSize: size, color, transform: `rotate(${rot}deg)`, whiteSpace: 'nowrap', lineHeight: 1}}>
      {text.slice(0, n)}</div>;
  };
const Mono: React.FC<{f: number; at: number; x: number; y: number; text: string; size?: number; color?: string; chip?: boolean}> =
  ({f, at, x, y, text, size = 24, color = '#4C4A44', chip = true}) => {
    if (f < at) return null;
    const o = ramp(f, at, at + 6);
    return <div style={{position: 'absolute', left: x, top: y, fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: 1.5, color, opacity: o,
      background: chip ? 'rgba(255,255,255,.55)' : undefined, padding: chip ? '6px 12px' : 0, transform: `translateY(${(1 - o) * 10}px)`}}>{text}</div>;
  };
const Title: React.FC<{f: number; at: number; x: number; y: number; text: string; size?: number}> = ({f, at, x, y, text, size = 96}) => {
  if (f < at) return null;
  const p = pop(f, at);
  return <div style={{position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.03, color: INK,
    transform: `translateY(${(1 - p) * -30}px)`, opacity: Math.min(1, p * 2.5), whiteSpace: 'nowrap', lineHeight: 1}}>{text}</div>;
};
// hand-drawn red loop round something, drawn on over ~10 frames
const Loop: React.FC<{f: number; at: number; cx: number; cy: number; rx: number; ry: number; seed?: number; w?: number}> = ({f, at, cx, cy, rx, ry, seed = 1, w = 6}) => {
  if (f < at) return null;
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2.15 - 0.4, j = 1 + (random(`l${seed}${i}`) - 0.5) * 0.05;
    pts.push(`${cx + Math.cos(t) * rx * j},${cy + Math.sin(t) * ry * j}`);
  }
  const p = ease(ramp(f, at, at + 11));
  return <svg width={1080} height={TOP} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <polyline points={pts.join(' ')} fill="none" stroke={RED} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/></svg>;
};
const Arrow: React.FC<{f: number; at: number; d: string; head: [number, number, number]}> = ({f, at, d, head}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + 10)), [hx, hy, ang] = head;
  return <svg width={1080} height={TOP} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <path d={d} fill="none" stroke={RED} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/>
    {p > 0.95 ? <path d="M -22 -12 L 0 0 L -22 12" fill="none" stroke={RED} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${hx} ${hy}) rotate(${ang})`}/> : null}
  </svg>;
};
const Stamp: React.FC<{f: number; at: number; x: number; y: number; text: string; size?: number; rot?: number}> = ({f, at, x, y, text, size = 40, rot = -3}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + 5));
  return <div style={{position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: 2, color: RED, border: `4px solid ${RED}`,
    padding: '4px 14px', transform: `rotate(${rot}deg) scale(${1.5 - 0.5 * p})`, opacity: p, background: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap'}}>{text}</div>;
};
const Specks: React.FC<{f: number; at: number; x: number; y: number; w: number; h: number; n?: number}> = ({f, at, x, y, w, h, n = 26}) =>
  <>{Array.from({length: n}).map((_, i) => {
    const o = ramp(f, at + i * 0.6, at + i * 0.6 + 4);
    return <div key={i} style={{position: 'absolute', left: x + random(`sx${i}${x}`) * w, top: y + random(`sy${i}${y}`) * h, width: 5 + random(`ss${i}`) * 5, height: 5 + random(`ss${i}`) * 5,
      borderRadius: 9, background: '#5D584C', opacity: o * 0.55}}/>;
  })}</>;
const Check: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + 8));
  return <svg width={70} height={60} style={{position: 'absolute', left: x, top: y}}><path d="M 6 32 L 24 50 L 64 8" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/></svg>;
};
const Flag: React.FC = () => <svg width={300} height={190} viewBox="0 0 300 190" style={{display: 'block'}}>
  <rect x={0} y={0} width={80} height={190} fill="#EF3340"/><rect x={80} y={0} width={220} height={63.3} fill="#00843D"/>
  <rect x={80} y={63.3} width={220} height={63.4} fill="#FFFFFF"/><rect x={80} y={126.7} width={220} height={63.3} fill="#000"/></svg>;
const Watch: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + 12));
  return <svg width={90} height={130} style={{position: 'absolute', left: x, top: y}}>
    <path d="M 30 4 L 30 30 M 60 4 L 60 30 M 30 100 L 30 126 M 60 100 L 60 126 M 22 30 h 46 a 8 8 0 0 1 8 8 v 54 a 8 8 0 0 1 -8 8 h -46 a 8 8 0 0 1 -8 -8 v -54 a 8 8 0 0 1 8 -8 z M 45 50 L 45 66 L 56 72"
      fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/></svg>;
};

// ---------------------------------------------------------------- the top-panel scenes, in the reference's order
const BROLL = [
  {src: 'broll1.jpg', credit: 'Photo: Clint Ian Pinto · CC BY-SA 4.0', ox: 0.18, oy: 0.55},
  {src: 'broll2.jpg', credit: 'Photo: Wadiia · CC BY-SA 4.0', ox: 0.45, oy: 0.4},
  {src: 'broll3.jpg', credit: 'Photo: Guilhem Vellut · CC BY 2.0', ox: 0.5, oy: 0.45},
];
const Broll: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const cuts: number[] = D.beats.broll, k = cuts.reduce((a, c, i) => (f >= c ? i : a), 0), s = BROLL[k];
  const end = cuts[k + 1] ?? u.to, z = 1.06 + 0.08 * ramp(f, cuts[k], end);
  return <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
    <Img src={file(s.src)} style={{position: 'absolute', width: 1080, height: TOP, objectFit: 'cover', objectPosition: `${s.ox * 100}% ${s.oy * 100}%`, transform: `scale(${z})`, transformOrigin: `${s.ox * 100}% ${s.oy * 100}%`}}/>
    <div style={{position: 'absolute', right: 18, bottom: 16, fontFamily: SANS, fontWeight: 600, fontSize: 19, color: 'rgba(255,255,255,.85)', background: 'rgba(0,0,0,.4)', padding: '4px 10px', borderRadius: 6}}>{s.credit}</div>
  </AbsoluteFill>;
};

const Note: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.note;
  return <>
    <Mono f={f} at={u.from} x={70} y={44} text="FIELD NOTE 01 / K2 HORIZON" size={24}/>
    <Stuck f={f} at={u.from} x={110} y={130} w={300} rot={-3} tape><div style={{boxShadow: '0 10px 26px rgba(40,30,10,.25)', border: '8px solid #fff'}}><Flag/></div></Stuck>
    <Stuck f={f} at={u.from + 3} x={560} y={120} w={430} rot={2.5} tape><Shot src="flagship.jpg" pad={10} filter="grayscale(1) contrast(1.6) brightness(1.05)"/></Stuck>
    <Title f={f} at={u.from + 2} x={84} y={430} text="FREE AI MODELS" size={104}/>
    <Loop f={f} at={b.ellipse} cx={490} cy={482} rx={440} ry={78} seed={2}/>
    <Hand f={f} at={b.uae} x={150} y={565} text="from the UAE" size={64} color={RED} font={SERIF} rot={0}/>
    <svg width={1080} height={TOP} style={{position: 'absolute', left: 0, top: 0}}><path d="M 110 668 C 400 662 640 672 720 664" stroke="#57534A" strokeWidth={4} fill="none" strokeLinecap="round"
      pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(ramp(f, b.anyone - 6, b.anyone + 4))}/></svg>
    <Hand f={f} at={b.anyone} x={720} y={625} text="anyone can use them!" size={52}/>
    <Specks f={f} at={u.from} x={480} y={500} w={560} h={200} n={14}/>
  </>;
};

const Called: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.called;
  return <>
    <Hand f={f} at={u.from} x={90} y={52} text="it's called" size={56} color={RED} font={SERIF} rot={0}/>
    <Title f={f} at={b.title} x={84} y={118} text="K2 HORIZON" size={104}/>
    <svg width={1080} height={TOP} style={{position: 'absolute', left: 0, top: 0}}><path d="M 90 250 C 300 244 520 250 690 246" stroke="#6E7A5C" strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(ramp(f, b.title + 4, b.title + 14))}/></svg>
    <Stuck f={f} at={u.from + 2} x={800} y={40} w={240} rot={5} tape><Shot src="flagship.jpg" pad={8} filter="saturate(1.1)"/></Stuck>
    <Stuck f={f} at={b.card} x={200} y={318} w={740} rot={-1} from="right" tape><Shot src="hero.png" pad={14}/></Stuck>
    <Arrow f={f} at={b.arrow} d="M 300 262 C 360 330 470 300 560 300" head={[560, 300, -8]}/>
    <Mono f={f} at={b.footer - 10} x={150} y={660} text="MBZUAI · INSTITUTE OF FOUNDATION MODELS · ABU DHABI" size={24}/>
    <Specks f={f} at={u.from} x={760} y={380} w={300} h={260} n={12}/>
  </>;
};

const SIZES = ['0.9B', '3.7B', '7B', '32B', '36B', '375B'];
const Sizes: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.sizes, xs = [70, 225, 380, 500, 650, 800], ws = [130, 130, 96, 126, 126, 210];
  return <>
    <Stuck f={f} at={u.from} x={60} y={56} w={960} rot={-0.6} tape><Shot src="lineup.png" pad={8}/></Stuck>
    {SIZES.map((s, i) => {
      const at = b.chips[i];
      if (f < at) return null;
      const p = pop(f, at), big = i === 5;
      return <div key={s} style={{position: 'absolute', left: xs[i], top: big ? 300 : 316, width: ws[i], height: big ? 120 : 90, background: '#fff', borderRadius: 10,
        boxShadow: '0 6px 16px rgba(40,30,10,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: big ? 66 : 42, color: INK,
        transform: `translateY(${(1 - p) * 30}px) scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2.5)}}>{s}</div>;
    })}
    <Loop f={f} at={b.circle} cx={905} cy={360} rx={140} ry={88} seed={7}/>
    <Hand f={f} at={b.circle + 4} x={760} y={232} text="375B parameters · flagship" size={38} color={RED} rot={-3}/>
    <Watch f={f} at={b.watch} x={86} y={470}/>
    <Hand f={f} at={b.watch} x={190} y={505} text="built for watches & glasses" size={50} rot={-2}/>
    <Stamp f={f} at={b.stamps[0]} x={90} y={640} text="CODING" size={42} rot={-3}/>
    <Stamp f={f} at={b.stamps[1]} x={370} y={640} text="REASONING" size={42} rot={2}/>
    <Stamp f={f} at={b.stamps[2]} x={720} y={640} text="AI AGENTS" size={42} rot={-2}/>
    <Specks f={f} at={u.from} x={640} y={440} w={400} h={180} n={14}/>
  </>;
};

const Help: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const p = pop(f, u.from);
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 84, letterSpacing: -2, color: INK,
      transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 2.5)}}>HOW CAN IT HELP YOU<span style={{fontFamily: HAND, color: RED, fontSize: 130, marginLeft: 8}}>?</span></div>
    <Specks f={f} at={u.from} x={80} y={120} w={920} h={540} n={30}/>
  </>;
};

const Deploy: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.deploy;
  return <>
    <Stuck f={f} at={u.from} x={120} y={180} w={720} rot={-1.5} from="left" tape><Shot src="deploy.jpg" pad={10}/></Stuck>
    <Stamp f={f} at={b.stamp} x={70} y={48} text="NO LICENSE FEES" size={50} rot={-3}/>
    <Check f={f} at={b.check} x={800} y={70}/>
    <Hand f={f} at={b.check + 3} x={760} y={140} text="$0 to download" size={50} rot={-4}/>
    <Stuck f={f} at={b.logo} x={650} y={470} w={380} rot={3} tape>
      <div style={{background: '#fff', padding: '34px 26px 30px', boxShadow: '0 10px 26px rgba(40,30,10,.22)'}}>
        <Img src={file('ifmlogo.png')} style={{width: '100%', display: 'block'}}/>
        <div style={{fontFamily: MONO, fontSize: 15, color: '#8A877F', marginTop: 16}}>ifm.ai · Abu Dhabi</div></div></Stuck>
    <Mono f={f} at={b.panel + 6} x={120} y={660} text="HUGGING FACE · OLLAMA · VLLM · SGLANG" size={24}/>
  </>;
};

const Glass: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.glass;
  return <>
    <Stuck f={f} at={u.from} x={130} y={120} w={700} rot={-1} tape><Shot src="glassbox.jpg" pad={10}/></Stuck>
    <Stuck f={f} at={b.note} x={700} y={50} w={330} rot={3} tape>
      <div style={{background: '#F7F5EE', padding: '22px 26px', boxShadow: '0 10px 26px rgba(40,30,10,.22)'}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 18, color: '#555'}}>K2 Horizon</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, lineHeight: 1.1, color: INK, marginTop: 6}}>Every artifact.<br/>Fully open.</div></div></Stuck>
    <Loop f={f} at={b.lens} cx={640} cy={390} rx={72} ry={72} seed={5} w={7}/>
    <Arrow f={f} at={b.lens + 4} d="M 692 442 L 760 512" head={[760, 512, 45]}/>
    <Hand f={f} at={b.lens + 2} x={700} y={560} text="inspect, reproduce, extend" size={46} rot={-3}/>
    <Mono f={f} at={b.label} x={150} y={660} text="TRAINING CODE + DATA · OPEN" size={24}/>
  </>;
};

const Start: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.start;
  return <>
    <Stuck f={f} at={u.from} x={70} y={140} w={680} rot={-1} tape><Shot src="getstarted.jpg" pad={10}/></Stuck>
    <Mono f={f} at={b.url} x={770} y={70} text="CHAT.IFM.AI" size={36} color={RED}/>
    <Arrow f={f} at={b.url + 2} d="M 560 300 C 680 250 760 190 820 128" head={[820, 128, -55]}/>
    <Stuck f={f} at={b.apache} x={640} y={420} w={390} rot={-3}>
      <div style={{background: '#fff', border: `5px solid ${INK}`, padding: '14px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 64, color: INK, boxShadow: '0 8px 20px rgba(0,0,0,.2)', whiteSpace: 'nowrap'}}>Apache 2.0</div></Stuck>
    <Hand f={f} at={b.biz} x={690} y={565} text="free for business use" size={46} rot={-2}/>
    <Hand f={f} at={b.here} x={760} y={640} text="START HERE" size={58} color={RED} rot={-3}/>
  </>;
};

// our ending: a clean comment box types the keyword, then the DM card answers (call-to-action skill)
const Cta: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.cta, kw = 'K2', n = Math.min(kw.length, Math.max(0, Math.floor((f - b.type) / 4) + 1));
  const box = pop(f, u.from), dm = pop(f, b.dm);
  return <>
    <Hand f={f} at={u.from} x={90} y={56} text="want the links?" size={56} color={RED} font={SERIF} rot={0}/>
    <div style={{position: 'absolute', left: 90, right: 90, top: 150, background: '#fff', borderRadius: 26, padding: '26px 30px', boxShadow: '0 12px 30px rgba(40,30,10,.2)',
      display: 'flex', alignItems: 'center', gap: 22, transform: `translateY(${(1 - box) * 40}px)`, opacity: Math.min(1, box * 2.5)}}>
      <div style={{width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg,#8FB4FF,#3D7BFF)'}}/>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: f >= b.type ? INK : '#9A978F', flex: 1}}>{f >= b.type ? kw.slice(0, n) : 'Add a comment…'}
        {f >= b.type && (f % 20) < 12 ? <span style={{color: '#3D7BFF'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: f >= b.type + 10 ? '#3D7BFF' : '#B9C9EE'}}>Post</div></div>
    <Loop f={f} at={b.type + 8} cx={250} cy={214} rx={110} ry={62} seed={9}/>
    {f >= b.dm ? <div style={{position: 'absolute', left: 150, right: 90, top: 360, background: '#fff', borderRadius: 26, padding: '24px 30px', boxShadow: '0 12px 30px rgba(40,30,10,.2)',
      transform: `translateY(${(1 - dm) * 80}px)`, opacity: Math.min(1, dm * 2.5)}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#777', letterSpacing: 1}}>MESSAGE · WITHHAMMAD</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, marginTop: 8}}>Here are your K2 Horizon links 👇</div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 26, color: TEAL, marginTop: 10}}>chat.ifm.ai · Ollama · Hugging Face</div></div> : null}
  </>;
};

const SCENES: Record<string, React.FC<{f: number; u: Unit}>> = {note: Note, called: Called, sizes: Sizes, help: Help, deploy: Deploy, glass: Glass, start: Start, cta: Cta};

// ---------------------------------------------------------------- face + captions
const faceZoom = (f: number) => {          // mild punch-ins on the reference's jump-cut beats
  const b = D.beats;
  if (f >= b.cta.type) return 1.1;
  if (f >= b.start.apache) return 1.0;
  if (f >= b.start.url) return 1.08;
  if (f >= b.sizes.circle && f < D.units.find((u: Unit) => u.kind === 'help').from) return 1.08;
  return 1.0;
};
const Face: React.FC<{f: number}> = ({f}) => {
  const z = faceZoom(f);
  return <div style={{position: 'absolute', left: 0, top: TOP, width: 1080, height: 1920 - TOP, overflow: 'hidden', background: '#1a1a1a'}}>
    <div style={{position: 'absolute', left: 0, top: -170, width: 1080, height: 1920, transform: `scale(${z})`, transformOrigin: '50% 30%'}}>
      <Img src={file(`face/${String(Math.min(f + 1, D.faceFrames)).padStart(4, '0')}.jpg`)} style={{width: 1080, height: 1380, display: 'block'}}/></div>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)'}}/>
  </div>;
};
type Cap = {text: string; from: number; to: number; g: number};
const Captions: React.FC<{f: number}> = ({f}) => {
  const caps: Cap[] = D.captions, cur = caps.findIndex((c) => f >= c.from && f < c.to);
  if (cur < 0) return null;
  const g = caps[cur].g, words = caps.filter((c, i) => c.g === g && i <= cur);
  return <div style={{position: 'absolute', left: 90, right: 90, top: 1490, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 60, lineHeight: 1.18, color: '#fff',
    textShadow: '0 3px 12px rgba(0,0,0,.65), 0 1px 3px rgba(0,0,0,.8)'}}>
    {words.map((w, i) => <span key={i} style={{color: i === words.length - 1 ? YEL : '#fff'}}>{w.text}{i < words.length - 1 ? ' ' : ''}</span>)}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f), Scene = SCENES[u.kind];
  return <AbsoluteFill style={{background: '#000'}}>
    <Face f={f}/>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: TOP, overflow: 'hidden'}}>
      {u.kind === 'broll' ? <Broll f={f} u={u}/> : <><Paper/>{Scene ? <Scene f={f} u={u}/> : null}</>}
    </div>
    <div style={{position: 'absolute', left: 0, top: TOP - 2, width: 1080, height: 4, background: 'rgba(0,0,0,.25)'}}/>
    <div style={{position: 'absolute', right: 34, top: TOP + 26, fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.75)', textShadow: '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>
    {D.standin ? <div style={{position: 'absolute', left: 34, top: TOP + 20, fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', background: 'rgba(217,58,43,.92)', padding: '8px 14px', borderRadius: 8}}>
      STAND-IN VOICE · NOT FOR POSTING<div style={{fontWeight: 600, fontSize: 18, opacity: 0.9}}>placeholder face · lips not synced</div></div> : null}
    <Captions f={f}/>
    <Audio src={file('voice.wav')}/>
  </AbsoluteFill>;
};
