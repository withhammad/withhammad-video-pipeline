import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';

// OpenAI dots explainer (batch 2026-10-27 #16, reference: imnaveedsarwar's LinkedIn video, job dots-20261027).
// Same 7 scenes, layout, timing and characters as the reference, in our own words, with the owner's name.
// Characters are OpenAI's official dot art (openai.com/index/introducing-dots), credited on the end card.
// Facts (OpenAI, 29 Sep 2026): always-on agents in ChatGPT, powered by GPT-6 Astra, each with its own cloud computer
// and browser, connected apps, and decisions that need you come back for approval.
loadFont({family: 'DtHead', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'DtInter', url: staticFile('fonts/inter-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'DtInter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'DtInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'DtInter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'DtInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'DtMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'DtHand', url: staticFile('fonts/caveat-latin-500-normal.woff2'), weight: '500'});

export const FPS = 30;
export const W = 1080, H = 1350;
// Scene starts in seconds (measured off the reference), last one ends at END_S.
export const SCENES = [0, 5.0, 10.3, 16.3, 25.3, 33.3, 38.8];
export const END_S = 44.5;

const HEAD = 'DtHead, "Arial Black", sans-serif', SANS = 'DtInter, Inter, Arial, sans-serif';
const MONO = 'DtMono, Menlo, monospace', HAND = 'DtHand, cursive';
const INK = '#0E0F1A', BLUE = '#1F5BFF', GREY = '#5B6075', GREEN = '#16A34A', MUTE = '#C9CCDA';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const char = (n: string) => staticFile(`dots/${n}.png`);

const useT = () => useCurrentFrame() / FPS;
// Spring progress for something that starts at `at` seconds (small settle at the end).
const useSp = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (at: number, damping = 14, mass = 0.7) => spring({frame: f - at * fps, fps, config: {damping, mass, stiffness: 140}});
};
const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const mix = (a: string, b: string, k: number) => {
  const p = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};

// ------------------------------------------------------------------ chrome shared by every scene
const Background: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(160deg, #E3E8FC 0%, #EEF0FB 45%, #F3F1FA 100%)'}}>
  <div style={{position: 'absolute', left: -200, top: -260, width: 900, height: 700, borderRadius: '50%',
    background: 'radial-gradient(closest-side, #D3DCFF, #D3DCFF00)'}}/>
  <div style={{position: 'absolute', right: -260, bottom: -200, width: 900, height: 800, borderRadius: '50%',
    background: 'radial-gradient(closest-side, #ECE4FA, #ECE4FA00)'}}/>
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.025}}>
    {Array.from({length: 9}, (_, r) => Array.from({length: 4}, (_, c) =>
      <text key={`${r}-${c}`} x={c * 320 - (r % 2) * 160} y={r * 170 + 60} transform={`rotate(-24 ${c * 320} ${r * 170})`}
        fontFamily={SANS} fontWeight={700} fontSize={22} letterSpacing={6} fill={INK}>WITHHAMMAD</text>))}
  </svg>
</AbsoluteFill>;

const Progress: React.FC<{t: number}> = ({t}) => <div style={{position: 'absolute', left: 33, right: 33, top: 16, display: 'flex', gap: 9}}>
  {SCENES.map((s, i) => {
    const e = i + 1 < SCENES.length ? SCENES[i + 1] : END_S;
    const k = lin(t, s, e);
    return <div key={i} style={{flex: 1, height: 4, borderRadius: 2, background: '#0E0F1A1F', overflow: 'hidden'}}>
      <div style={{width: `${k * 100}%`, height: '100%', background: '#1B1D2B'}}/></div>;
  })}
</div>;

const Header: React.FC<{n: number}> = ({n}) => <>
  <div style={{position: 'absolute', left: 50, top: 50, fontFamily: SANS, color: INK}}>
    <span style={{fontWeight: 800, fontSize: 27}}>{String(n).padStart(2, '0')}</span>
    <span style={{fontWeight: 500, fontSize: 17, color: GREY}}> / 07</span>
  </div>
  <div style={{position: 'absolute', right: 50, top: 40, display: 'flex', alignItems: 'center', gap: 14}}>
    <div style={{textAlign: 'right', fontFamily: SANS}}>
      <div style={{fontWeight: 600, fontSize: 21, color: INK}}>Hammad Yousuf</div>
      <div style={{fontWeight: 500, fontSize: 16, color: GREY}}>AI Implementation Specialist</div>
    </div>
    <div style={{width: 50, height: 50, borderRadius: 25, background: 'linear-gradient(140deg, #4C7BFF, #1F5BFF)', color: '#fff',
      fontFamily: SANS, fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 12px #1F5BFF40'}}>HY</div>
  </div>
</>;

const Credit: React.FC<{x: number; y: number; align?: 'left' | 'right'}> = ({x, y, align = 'left'}) =>
  <div style={{position: 'absolute', [align]: x, top: y, fontFamily: SANS, fontWeight: 500, fontSize: 17, color: '#A3A8BE'}}>© WITHHAMMAD</div>;

// Headline: words go from pale to ink in order, each rising a little (the reference's word-by-word reveal).
type Line = {text: string; blue?: boolean; blueWords?: number[]};
const Headline: React.FC<{lines: Line[]; size: number; top: number; at?: number; per?: number; left?: number; lh?: number}> =
  ({lines, size, top, at = 0.1, per = 0.11, left = 50, lh = 1.0}) => {
    const t = useT();
    let w = 0;
    return <div style={{position: 'absolute', left, top, fontFamily: HEAD, fontSize: size, lineHeight: lh, letterSpacing: -0.5}}>
      {lines.map((l, i) => <div key={i} style={{whiteSpace: 'nowrap'}}>
        {l.text.split(' ').map((word, j) => {
          const k = lin(t, at + w * per, at + w * per + 0.28);
          w += 1;
          return <span key={j} style={{display: 'inline-block', marginRight: '0.24em', color: mix(MUTE, l.blue || l.blueWords?.includes(j) ? BLUE : INK, k),
            opacity: 0.25 + 0.75 * k, transform: `translateY(${(1 - k) * 14}px)`}}>{word}</span>;
        })}
      </div>)}
    </div>;
  };

const FadeUp: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number}> = ({at, children, style, dy = 18}) => {
  const t = useT();
  const k = lin(t, at, at + 0.4);
  const e = 1 - Math.pow(1 - k, 3);
  return <div style={{position: 'absolute', opacity: e, transform: `translateY(${(1 - e) * dy}px)`, ...style}}>{children}</div>;
};

// Glass panel arrival: blur 20 -> 0 and scale 0.94 -> 1 on a spring.
const Panel: React.FC<{at: number; style: React.CSSProperties; children?: React.ReactNode}> = ({at, style, children}) => {
  const sp = useSp();
  const k = sp(at, 16);
  return <div style={{position: 'absolute', background: '#FFFFFF', borderRadius: 22, border: '1.5px solid #FFFFFF',
    boxShadow: '0 1px 2px #1B1F3B14, 0 10px 30px #3A47A21F', opacity: Math.min(1, k * 1.4),
    transform: `scale(${0.94 + 0.06 * k})`, filter: `blur(${(1 - Math.min(1, k)) * 20}px)`, ...style}}>{children}</div>;
};

const Character: React.FC<{src: string; x: number; y: number; w: number; at: number; from?: [number, number]; flip?: boolean; bob?: number; rot?: number}> =
  ({src, x, y, w, at, from = [0, 220], flip, bob = 0, rot = 0}) => {
    const t = useT();
    const sp = useSp();
    const k = sp(at, 11, 0.8);
    const b = Math.sin((t - at) * 2.2 + x) * bob;
    return <Img src={char(src)} style={{position: 'absolute', left: x + from[0] * (1 - k), top: y + from[1] * (1 - k) + b, width: w,
      opacity: Math.min(1, k * 2.5),
      transform: `${flip ? 'scaleX(-1) ' : ''}rotate(${rot + Math.sin((t - at) * 1.6) * 2}deg)`, filter: 'drop-shadow(0 12px 18px #3A3F6A30)'}}/>;
  };

const Check: React.FC<{at: number; size?: number; color?: string; style?: React.CSSProperties}> = ({at, size = 34, color = BLUE, style}) => {
  const sp = useSp();
  const k = sp(at, 9, 0.5);
  return <div style={{position: 'absolute', width: size, height: size, borderRadius: size / 2, background: color, border: '3px solid #fff',
    boxShadow: '0 3px 8px #0003', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k})`, ...style}}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth={3.4}
      fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
  </div>;
};

// Generic app glyphs (our own drawings, not product logos).
type Glyph = 'mail' | 'doc' | 'sheet' | 'cloud' | 'chat' | 'cal' | 'globe' | 'shield';
const GlyphIcon: React.FC<{g: Glyph; c: string; size: number; radius?: number}> = ({g, c, size, radius = 0.28}) => {
  const p: Record<Glyph, React.ReactNode> = {
    mail: <><rect x={4} y={6} width={16} height={12} rx={2.2} stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M4.8 7.2L12 12.6l7.2-5.4" stroke="#fff" strokeWidth={1.9} fill="none"/></>,
    doc: <><rect x={6} y={4} width={12} height={16} rx={2} stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M9 9h6M9 12.5h6M9 16h4" stroke="#fff" strokeWidth={1.7}/></>,
    sheet: <><rect x={4.5} y={5} width={15} height={14} rx={2} stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M4.5 10h15M4.5 14.5h15M10 5v14" stroke="#fff" strokeWidth={1.6}/></>,
    cloud: <path d="M7.5 18h9.3a3.7 3.7 0 00.4-7.4 5.2 5.2 0 00-10-1.1A4.3 4.3 0 007.5 18z" fill="#fff"/>,
    chat: <><path d="M5 6.5h14a1.5 1.5 0 011.5 1.5v7.5A1.5 1.5 0 0119 17h-8l-4 3v-3H5a1.5 1.5 0 01-1.5-1.5V8A1.5 1.5 0 015 6.5z" stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M8 11.8h8" stroke="#fff" strokeWidth={1.8}/></>,
    cal: <><rect x={4.5} y={6} width={15} height={13.5} rx={2} stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M4.5 10.2h15M8.5 4v4M15.5 4v4" stroke="#fff" strokeWidth={1.8}/></>,
    globe: <><circle cx={12} cy={12} r={7.6} stroke="#fff" strokeWidth={1.8} fill="none"/><path d="M4.6 12h14.8M12 4.4c2.6 2.4 2.6 12.8 0 15.2M12 4.4c-2.6 2.4-2.6 12.8 0 15.2" stroke="#fff" strokeWidth={1.5} fill="none"/></>,
    shield: <><path d="M12 3.8l7 2.6v5.2c0 4.4-3 7.6-7 8.8-4-1.2-7-4.4-7-8.8V6.4z" stroke="#fff" strokeWidth={1.9} fill="none"/><path d="M9 12l2.2 2.2L15.2 10" stroke="#fff" strokeWidth={1.9} fill="none"/></>,
  };
  return <div style={{width: size, height: size, borderRadius: size * radius, background: `linear-gradient(160deg, ${c}, ${c}dd)`,
    boxShadow: `inset 0 1px 0 #ffffff55, 0 3px 8px ${c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24">{p[g]}</svg></div>;
};

const Cursor: React.FC<{x: number; y: number; press?: number}> = ({x, y, press = 0}) =>
  <svg width={34} height={40} viewBox="0 0 17 20" style={{position: 'absolute', left: x, top: y, transform: `scale(${1 - press * 0.15})`,
    transformOrigin: '0 0', filter: 'drop-shadow(0 2px 3px #0005)'}}>
    <path d="M1 1l14 9-6.2 1.4L12 18l-2.6 1.2-3.1-6.6L1 16.5z" fill="#111" stroke="#fff" strokeWidth={1.3} strokeLinejoin="round"/>
  </svg>;

// ------------------------------------------------------------------ 01: agents change how work gets done
const STICKIES: {text: string; x: number; y: number; w: number; rot: number; bg: string}[] = [
  {text: 'Update CRM', x: 173, y: 745, w: 240, rot: -6, bg: '#FFE58F'},
  {text: 'Answer emails', x: 618, y: 712, w: 285, rot: 6, bg: '#FFC9D6'},
  {text: 'Chase leads', x: 205, y: 905, w: 240, rot: 8, bg: '#CDEFC4'},
  {text: 'Build report', x: 612, y: 878, w: 265, rot: -4, bg: '#C9DBFF'},
  {text: 'Book meeting', x: 248, y: 1068, w: 285, rot: -5, bg: '#FFD9AE'},
  {text: 'Research', x: 640, y: 1045, w: 205, rot: 5, bg: '#FFE58F'},
];
const Scene1: React.FC = () => {
  const sp = useSp();
  return <>
    <Headline size={92} top={140} lines={[{text: 'AI AGENTS ARE'}, {text: 'REWRITING HOW'}, {text: 'WORK GETS DONE.', blue: true}]} per={0.1}/>
    <FadeUp at={1.05} style={{left: 52, top: 432}}><div style={{width: 60, height: 6, background: INK, borderRadius: 3}}/></FadeUp>
    <FadeUp at={1.15} style={{left: 50, top: 470, fontFamily: SANS, fontSize: 34, lineHeight: 1.3}}>
      <div style={{fontWeight: 600, color: INK}}>More than a chat reply.</div>
      <div style={{fontWeight: 400, color: '#343849'}}>Real work, carried to the finish.</div>
    </FadeUp>
    <Credit x={50} y={640} align="right"/>
    {STICKIES.map((s, i) => {
      const k = sp(1.45 + i * 0.17, 10, 0.6);
      return <div key={i} style={{position: 'absolute', left: s.x, top: s.y, width: s.w, height: 104, background: s.bg, borderRadius: 6,
        transform: `rotate(${s.rot}deg) scale(${k})`, opacity: Math.min(1, k * 2), boxShadow: '0 10px 18px #4A4F7A30, inset 0 -6px 0 #00000010',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HAND, fontSize: 44, color: '#34364A'}}>
        {s.text}
        <Check at={2.75 + i * 0.16} size={42} style={{right: -16, top: -18}}/>
      </div>;
    })}
    <Character src="felipe_blue" x={-38} y={1108} w={250} at={2.3} from={[-120, 160]} rot={8}/>
  </>;
};

// ------------------------------------------------------------------ 02: you are the glue between apps
const FLOW: {name: string; sub: string; g: Glyph; c: string; x: number; y: number}[] = [
  {name: 'Inbox', sub: 'Read emails, spot requests', g: 'mail', c: '#EF4444', x: 76, y: 540},
  {name: 'Docs', sub: 'Write and update files', g: 'doc', c: '#3B82F6', x: 594, y: 540},
  {name: 'CRM', sub: 'Log records and notes', g: 'cloud', c: '#0EA5E9', x: 594, y: 730},
  {name: 'Spreadsheets', sub: 'Track and crunch numbers', g: 'sheet', c: '#16A34A', x: 76, y: 730},
  {name: 'Team chat', sub: 'Post updates, gather replies', g: 'chat', c: '#8B5CF6', x: 76, y: 920},
  {name: 'Follow-ups', sub: 'Schedule and chase replies', g: 'cal', c: '#F59E0B', x: 594, y: 920},
];
const CW = 410, CH = 128;
const Scene2: React.FC = () => {
  const t = useT();
  const hop0 = 1.6, hop = 0.62;          // the request reaches card i at hop0 + i * hop
  const i = Math.max(0, Math.min(FLOW.length - 1, Math.floor((t - hop0) / hop)));
  const k = Math.max(0, Math.min(1, ((t - hop0) - i * hop) / 0.4));
  const a = FLOW[i], b = FLOW[Math.min(FLOW.length - 1, i + 1)];
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const moving = t >= hop0 && i < FLOW.length - 1;
  const px = (moving ? a.x + (b.x - a.x) * e : a.x) + 250, py = (moving ? a.y + (b.y - a.y) * e : a.y) + CH - 12;
  const count = t < hop0 ? 0 : Math.min(5, Math.floor((t - hop0) / hop + 0.35));
  const at = (j: number) => 0.9 + j * 0.12;
  const arrows: [number, number, number, number][] = [[486, 604, 594, 604], [799, 668, 799, 730], [594, 794, 486, 794], [281, 858, 281, 920], [486, 984, 594, 984]];
  return <>
    <Headline size={86} top={140} lines={[{text: 'YOU ARE THE'}, {text: 'HUMAN GLUE.', blue: true}]} per={0.12}/>
    <FadeUp at={0.75} style={{left: 50, top: 330, width: 900, fontFamily: SANS, fontSize: 31, lineHeight: 1.35, color: '#343849'}}>
      Requests bounce between apps, tabs and reminders, and you carry every one by hand.</FadeUp>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {arrows.map(([x1, y1, x2, y2], j) => <g key={j} opacity={lin(t, at(j) + 0.3, at(j) + 0.6)}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8D93AE" strokeWidth={2.2} strokeDasharray="7 7"/>
        <circle cx={x2} cy={y2} r={4} fill="#8D93AE"/></g>)}
    </svg>
    {FLOW.map((c, j) => {
      const active = t >= hop0 + j * hop - 0.05 && t < hop0 + (j + 1) * hop && j <= i;
      return <Panel key={j} at={at(j)} style={{left: c.x, top: c.y, width: CW, height: CH, display: 'flex', alignItems: 'center', gap: 22,
        padding: '0 26px', boxSizing: 'border-box', border: active ? `2.5px solid ${BLUE}` : '1.5px solid #fff'}}>
        <GlyphIcon g={c.g} c={c.c} size={58}/>
        <div style={{fontFamily: SANS}}><div style={{fontWeight: 600, fontSize: 28, color: INK}}>{c.name}</div>
          <div style={{fontWeight: 400, fontSize: 19, color: GREY, marginTop: 4}}>{c.sub}</div></div>
      </Panel>;
    })}
    {t >= hop0 && <div style={{position: 'absolute', left: px - 150, top: py, padding: '7px 16px', borderRadius: 20, background: '#FFF4CC',
      border: '1.5px solid #F2CC5B', fontFamily: SANS, fontWeight: 600, fontSize: 19, color: '#8A5A00', whiteSpace: 'nowrap',
      boxShadow: '0 4px 10px #C9A23A40', opacity: lin(t, hop0, hop0 + 0.2)}}>▤ Client request</div>}
    {t >= hop0 && <Cursor x={px + 28} y={py + 10}/>}
    <Credit x={76} y={1128}/>
    <FadeUp at={1.3} style={{right: 76, top: 1126, fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: count ? '#E5383B' : '#8D93AE'}}>
      HANDOFFS BY HAND: {count}</FadeUp>
  </>;
};

// ------------------------------------------------------------------ 03: meet OpenAI dots
const Scene3: React.FC = () => {
  const t = useT();
  const sp = useSp();
  const ask = 'Get my weekly client update ready';
  const typed = ask.slice(0, Math.max(0, Math.floor((t - 2.0) / 0.045)));
  const sent = t >= 3.95;
  const reply = lin(t, 4.3, 4.7);
  const heart = sp(1.0, 9, 0.6);
  return <>
    <Headline size={92} top={150} lines={[{text: 'SAY HELLO TO'}, {text: 'OPENAI dots.', blueWords: [1]}]} per={0.12}/>
    <FadeUp at={0.85} style={{left: 50, top: 370, width: 560, fontFamily: SANS, fontSize: 30, lineHeight: 1.35, color: '#343849'}}>
      Always-on AI agents inside ChatGPT, running on GPT-6 Astra.</FadeUp>
    <Character src="todd_frog" x={560} y={448} w={240} at={1.4} from={[0, 160]}/>
    <Character src="alfred_yellow" x={790} y={436} w={215} at={1.6} from={[0, 160]}/>
    <Panel at={0.5} style={{left: 71, top: 616, width: 936, height: 594, display: 'flex', overflow: 'hidden'}}>
      <div style={{width: 292, background: '#F6F7FB', borderRight: '1px solid #ECEEF5', padding: '28px 20px', boxSizing: 'border-box', fontFamily: SANS, position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 28, color: INK}}>
          <div style={{width: 18, height: 18, borderRadius: 9, background: BLUE}}/>dots</div>
        <div style={{marginTop: 22, border: '1px solid #E3E6F0', background: '#fff', borderRadius: 14, padding: '9px 14px', fontSize: 19, color: BLUE, fontWeight: 500}}>+ New dot</div>
        <div style={{marginTop: 14, background: '#E8EDFF', borderRadius: 14, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center'}}>
          <Img src={char('jojo_heart')} style={{width: 40}}/>
          <div><div style={{fontWeight: 600, fontSize: 20, color: INK}}>Jojo</div>
            <div style={{fontSize: 15, color: GREEN}}>● Always on</div></div></div>
        <div style={{position: 'absolute', left: 20, bottom: 24, fontSize: 17, color: GREY}}>⊕ Create a dot</div>
      </div>
      <div style={{flex: 1, position: 'relative', fontFamily: SANS}}>
        <div style={{position: 'absolute', left: 22, top: 22, display: 'flex', gap: 8, alignItems: 'center', fontSize: 19, fontWeight: 600, color: INK}}>
          <Img src={char('jojo_heart')} style={{width: 26}}/>Jojo</div>
        <Img src={char('jojo_heart')} style={{position: 'absolute', left: 322 - 95, top: 90 + Math.sin(t * 2.4) * 5, width: 190,
          transform: `scale(${heart})`, filter: 'drop-shadow(0 14px 16px #C0268A40)'}}/>
        <div style={{position: 'absolute', left: 0, right: 0, top: 318, textAlign: 'center'}}>
          {reply > 0
            ? <span style={{display: 'inline-block', padding: '9px 18px', borderRadius: 16, background: '#EAF0FF', color: BLUE, fontSize: 20,
              opacity: reply, transform: `translateY(${(1 - reply) * 10}px)`}}>On it. I'll update you as I go.</span>
            : <span style={{color: GREY, fontSize: 21, opacity: sent ? 0 : 1}}>How can I help you today?</span>}
        </div>
        <div style={{position: 'absolute', left: 24, right: 24, top: 392, height: 72, borderRadius: 36, border: `1.5px solid ${typed && !sent ? '#B9C6F5' : '#E3E6F0'}`,
          display: 'flex', alignItems: 'center', padding: '0 12px 0 24px', fontSize: 21, color: typed && !sent ? INK : '#A3A8BE'}}>
          <span style={{flex: 1}}>{sent ? '' : (typed || 'Message your dot...')}{!sent && typed && Math.floor(t * 2.5) % 2 ? '|' : ''}</span>
          <div style={{width: 48, height: 48, borderRadius: 24, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, transform: `scale(${1 + 0.18 * Math.max(0, 1 - Math.abs(t - 3.9) / 0.15)})`}}>→</div>
        </div>
        <div style={{position: 'absolute', left: 24, top: 486, display: 'flex', gap: 10}}>
          {['⌕ Search', '◉ Browse', '▦ Use my apps'].map((s) => <div key={s} style={{padding: '7px 14px', borderRadius: 14, border: '1px solid #E3E6F0', fontSize: 16, color: GREY}}>{s}</div>)}
        </div>
      </div>
    </Panel>
    <Credit x={73} y={1236} align="right"/>
  </>;
};

// ------------------------------------------------------------------ 04: one goal, every step done
const APPS: {name: string; g: Glyph; c: string}[] = [
  {name: 'Email', g: 'mail', c: '#EF4444'}, {name: 'Web', g: 'globe', c: '#4B5563'}, {name: 'Sheets', g: 'sheet', c: '#16A34A'},
  {name: 'Docs', g: 'doc', c: '#3B82F6'}, {name: 'CRM', g: 'cloud', c: '#0EA5E9'}, {name: 'Slack', g: 'chat', c: '#8B5CF6'},
];
const STEPS: {text: string; app: number}[] = [
  {text: 'Scanning the inbox', app: 0}, {text: 'Checking the web', app: 1}, {text: 'Crunching the numbers', app: 2},
  {text: 'Writing the client update', app: 3}, {text: 'Logging CRM notes', app: 4}, {text: 'Drafting the Slack post', app: 5},
];
const Scene4: React.FC = () => {
  const t = useT();
  const sp = useSp();
  const s0 = 1.6, ds = 0.75, run = 1.0;   // step i starts at s0 + i * ds and fills for `run` seconds
  const done = t >= s0 + 5 * ds + run;
  const heart = sp(1.1, 9, 0.6);
  return <>
    <Headline size={88} top={140} lines={[{text: 'ONE GOAL IN.'}, {text: 'EVERY STEP DONE.', blue: true}]} per={0.12}/>
    <FadeUp at={0.7} style={{left: 50, top: 330, width: 900, fontFamily: SANS, fontSize: 30, lineHeight: 1.35, color: '#343849'}}>
      Your dot runs on its own cloud computer, with its own browser and the apps you connect.</FadeUp>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {APPS.map((_, i) => <line key={i} x1={71 + i * 159 + 70} y1={630} x2={540} y2={760} stroke="#9AA3C7" strokeWidth={2} strokeDasharray="6 7"
        opacity={lin(t, 1.0 + i * 0.06, 1.4 + i * 0.06)}/>)}
    </svg>
    {APPS.map((a, i) => {
      const k = sp(0.8 + i * 0.08, 12, 0.6);
      return <div key={i} style={{position: 'absolute', left: 71 + i * 159, top: 470, width: 140, height: 150, background: '#fff', borderRadius: 20,
        boxShadow: '0 8px 22px #3A47A21F', transform: `scale(${k})`, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12, fontFamily: SANS, fontWeight: 500, fontSize: 21, color: INK}}>
        <GlyphIcon g={a.g} c={a.c} size={62}/>{a.name}
        <Check at={s0 + STEPS.findIndex((s) => s.app === i) * ds + run} size={36} color={GREEN} style={{right: -10, top: -12}}/>
      </div>;
    })}
    <Img src={char('jojo_heart')} style={{position: 'absolute', left: 540 - 95, top: 680 + Math.sin(t * 2.4) * 6, width: 190,
      transform: `scale(${heart})`, filter: 'drop-shadow(0 14px 16px #C0268A40)'}}/>
    <Panel at={1.2} style={{left: 71, top: 880, width: 936, height: 300, padding: '26px 30px', boxSizing: 'border-box', fontFamily: SANS}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <GlyphIcon g="cloud" c={BLUE} size={40}/><span style={{fontWeight: 600, fontSize: 25, color: INK, flex: 1}}>Cloud computer</span>
        <span style={{padding: '6px 14px', borderRadius: 14, fontSize: 17, fontWeight: 600, background: done ? '#E3F7E9' : '#EAF0FF', color: done ? GREEN : BLUE}}>
          ● {done ? 'All steps done' : 'Working'}</span>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 40, rowGap: 22, marginTop: 26}}>
        {STEPS.map((s, n) => {
          const k = lin(t, s0 + n * ds, s0 + n * ds + run);
          const vis = lin(t, s0 + n * ds - 0.15, s0 + n * ds + 0.1);
          return <div key={n} style={{display: 'flex', alignItems: 'center', gap: 12, opacity: vis}}>
            <GlyphIcon g={APPS[s.app].g} c={APPS[s.app].c} size={30}/>
            <div style={{flex: 1}}>
              <div style={{fontSize: 19, color: INK}}>{s.text}{k < 1 ? '...' : ''}</div>
              <div style={{height: 5, borderRadius: 3, background: '#EEF0F6', marginTop: 8}}>
                <div style={{width: `${k * 100}%`, height: '100%', borderRadius: 3, background: k < 1 ? BLUE : GREEN}}/></div>
            </div>
            <div style={{width: 28, height: 28, position: 'relative'}}><Check at={s0 + n * ds + run} size={28} color={GREEN} style={{left: 0, top: 0, border: 'none'}}/></div>
          </div>;
        })}
      </div>
    </Panel>
    <Credit x={73} y={1238}/>
    <FadeUp at={6.4} style={{right: 70, top: 1200, fontFamily: HAND, fontSize: 38, lineHeight: 1.0, color: '#3B3F55', transform: 'rotate(-3deg)', textAlign: 'right'}}>
      Runs in the background,<br/>across your apps.</FadeUp>
  </>;
};

// ------------------------------------------------------------------ 05: you log off, it keeps going
const DONE: {title: string; sub: string}[] = [
  {title: 'Research done', sub: 'Pulled the latest client activity'},
  {title: 'Draft written', sub: 'Highlights and key numbers'},
  {title: 'CRM notes logged', sub: 'Next steps saved for you'},
  {title: 'Follow-up email ready', sub: 'Waiting for your OK to send'},
];
const Scene5: React.FC = () => {
  const t = useT();
  const r0 = 1.4, dr = 0.7;
  const click = 5.0;
  const approved = t >= click + 0.08;
  const cur = lin(t, 4.2, click - 0.1);
  const ce = 1 - Math.pow(1 - cur, 3);
  const press = Math.max(0, 1 - Math.abs(t - click) / 0.1);
  return <>
    <Headline size={88} top={150} lines={[{text: 'YOU LOG OFF.'}, {text: 'IT KEEPS GOING.', blue: true}]} per={0.12}/>
    <FadeUp at={0.7} style={{left: 50, top: 340, width: 680, fontFamily: SANS, fontSize: 30, lineHeight: 1.35, color: '#343849'}}>
      It works after the chat closes, and saves the big calls for your approval.</FadeUp>
    <Character src="alfred_yellow" x={800} y={404} w={190} at={1.2} from={[0, 140]}/>
    <Panel at={0.6} style={{left: 73, top: 532, width: 934, height: 418, padding: '26px 32px', boxSizing: 'border-box', fontFamily: SANS}}>
      <div style={{display: 'flex', alignItems: 'center'}}>
        <span style={{flex: 1, fontWeight: 600, fontSize: 27, color: INK}}>Weekly client update</span>
        <span style={{padding: '6px 14px', borderRadius: 14, background: '#F2F4F8', fontSize: 17, color: '#3B3F55'}}>
          <span style={{color: GREEN}}>●</span> You're away · your dot is working</span>
      </div>
      <div style={{height: 1, background: '#ECEEF5', margin: '20px 0 8px'}}/>
      {DONE.map((d, i) => {
        const at = r0 + i * dr;
        const vis = lin(t, at - 0.35, at - 0.1);
        return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, height: 76, opacity: vis}}>
          <div style={{width: 36, height: 36, position: 'relative'}}>
            {t < at && <div style={{position: 'absolute', inset: 3, borderRadius: 15, border: '3px solid #D6DAE8', borderTopColor: BLUE,
              transform: `rotate(${t * 540}deg)`}}/>}
            <Check at={at} size={36} color={GREEN} style={{left: 0, top: 0, border: 'none'}}/>
          </div>
          <div><div style={{fontWeight: 600, fontSize: 25, color: INK}}>{d.title}</div>
            <div style={{fontSize: 18, color: GREY, marginTop: 2}}>{d.sub}</div></div>
        </div>;
      })}
    </Panel>
    <Panel at={r0 + 4 * dr} style={{left: 73, top: 978, width: 934, height: 138, padding: '0 26px', boxSizing: 'border-box', display: 'flex',
      alignItems: 'center', gap: 22, fontFamily: SANS, border: `2.5px solid ${approved ? '#3CC46B' : '#DCE2F6'}`}}>
      <GlyphIcon g="shield" c={BLUE} size={66}/>
      <div style={{flex: 1}}><div style={{fontWeight: 600, fontSize: 26, color: INK}}>Approve before it sends</div>
        <div style={{fontSize: 19, color: GREY, marginTop: 3}}>Nothing goes out without you</div></div>
      <div style={{padding: '14px 24px', borderRadius: 14, background: '#F2F4F8', fontSize: 21, fontWeight: 500, color: INK}}>Edit</div>
      <div style={{padding: '14px 26px', borderRadius: 14, background: approved ? '#22B45A' : BLUE, fontSize: 21, fontWeight: 600, color: '#fff',
        transform: `scale(${1 - press * 0.06})`}}>{approved ? '✓ Approved' : 'Approve'}</div>
    </Panel>
    {t >= 4.2 && t < 6.2 && <Cursor x={1100 + (840 - 1100) * ce} y={1240 + (1060 - 1240) * ce} press={press}/>}
    <FadeUp at={click + 0.3} style={{left: 76, top: 1136, fontFamily: SANS, fontSize: 23, fontWeight: 500, color: '#169A4A'}}>
      ✓ Email sent and CRM updated, only after your OK.</FadeUp>
    <Character src="iggy_headphones" x={-70} y={1150} w={220} at={1.0} from={[-140, 120]} rot={10}/>
    <Credit x={73} y={1250} align="right"/>
  </>;
};

// ------------------------------------------------------------------ 06: the quote
const Scene6: React.FC = () => <>
  <FadeUp at={0.05} style={{left: 66, top: 150, fontFamily: HEAD, fontSize: 190, lineHeight: 1, color: '#B9C5F2'}}>“</FadeUp>
  <Headline size={84} top={370} lh={1.04} per={0.13} lines={[{text: 'QUIT AUTOMATING'}, {text: 'SINGLE TASKS.'}]}/>
  <Headline size={84} top={570} lh={1.04} per={0.13} at={0.7} lines={[{text: 'HAND OVER THE', blue: true}, {text: 'WHOLE WORKFLOW.', blue: true}]}/>
  <FadeUp at={1.6} style={{left: 52, top: 800, fontFamily: SANS}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18}}><div style={{width: 40, height: 5, background: INK}}/>
      <span style={{fontWeight: 700, fontSize: 34, color: INK}}>Hammad Yousuf</span></div>
    <div style={{marginLeft: 58, marginTop: 4, fontSize: 25, color: BLUE, fontWeight: 500}}>AI Implementation Specialist</div>
  </FadeUp>
  <Credit x={52} y={950}/>
  <Character src="todd_frog" x={455} y={1112} w={290} at={1.9} from={[0, 260]}/>
  <Character src="alfred_yellow" x={760} y={1124} w={270} at={2.1} from={[0, 260]}/>
</>;

// ------------------------------------------------------------------ 07: end card
const Scene7: React.FC = () => {
  const t = useT();
  const sp = useSp();
  const heart = sp(0.25, 9, 0.6);
  return <>
    <Img src={char('jojo_heart')} style={{position: 'absolute', left: 540 - 112, top: 210 + Math.sin(t * 2.4) * 7, width: 224,
      transform: `scale(${heart})`, filter: 'drop-shadow(0 18px 18px #C0268A40)'}}/>
    <FadeUp at={0.6} style={{left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: SANS}}>
      <div style={{fontWeight: 800, fontSize: 74, color: INK, letterSpacing: -1}}>Hammad Yousuf</div>
      <div style={{fontWeight: 600, fontSize: 32, color: BLUE, marginTop: 6}}>AI Implementation Specialist</div>
      <div style={{fontSize: 29, color: '#4A4F66', marginTop: 18, lineHeight: 1.35}}>I help businesses hand whole<br/>workflows to AI agents, end to end.</div>
    </FadeUp>
    <Panel at={1.2} style={{left: 120, top: 800, width: 840, height: 92, borderRadius: 46, display: 'flex', alignItems: 'center', padding: '0 14px 0 30px',
      boxSizing: 'border-box', gap: 16, fontFamily: SANS}}>
      <GlyphIcon g="chat" c={BLUE} size={36} radius={0.3}/>
      <span style={{flex: 1, fontWeight: 600, fontSize: 28, color: INK}}>Which workflow would you hand off first?</span>
      <div style={{width: 62, height: 62, borderRadius: 31, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30}}>→</div>
    </Panel>
    <FadeUp at={1.6} style={{left: 0, right: 0, top: 922, textAlign: 'center', fontFamily: SANS, fontSize: 26, color: GREY}}>
      Tell me in the comments. Comment <b style={{color: INK}}>DOTS</b> for my free guide.</FadeUp>
    <FadeUp at={1.9} style={{left: 0, right: 0, top: 1010, textAlign: 'center', fontFamily: MONO, fontSize: 30, color: INK}}>withhammad.com</FadeUp>
    <FadeUp at={2.2} style={{left: 0, right: 0, top: 1196, textAlign: 'center', fontFamily: SANS, fontSize: 17, color: '#8D93AE', lineHeight: 1.6}}>
      © 2026 WITHHAMMAD. All rights reserved.<br/>dots characters © OpenAI · Not affiliated with OpenAI</FadeUp>
    <Character src="felipe_blue" x={-60} y={540} w={210} at={0.5} from={[-180, 0]} rot={10}/>
    <Character src="iggy_headphones" x={930} y={560} w={190} at={0.6} from={[180, 0]} flip rot={-6}/>
    <Character src="todd_frog" x={50} y={1150} w={240} at={0.8} from={[0, 220]}/>
    <Character src="alfred_yellow" x={830} y={1158} w={210} at={0.9} from={[0, 220]}/>
  </>;
};

const SCENE_COMPONENTS = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7];

// Each scene leaves with a short fade and lift; the next headline reveals over the shared canvas.
const SceneWrap: React.FC<{len: number; children: React.ReactNode; last: boolean}> = ({len, children, last}) => {
  const f = useCurrentFrame();
  const out = last ? 0 : lin(f / FPS, len - 0.28, len);
  return <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-out * 24}px)`}}>{children}</AbsoluteFill>;
};

export const DotsCanvas: React.FC<{tall?: boolean}> = ({tall}) => {
  const t = useT();
  return <AbsoluteFill style={{width: W, height: H, overflow: tall ? 'visible' : 'hidden'}}>
    {!tall && <Background/>}
    {SCENE_COMPONENTS.map((C, i) => {
      const s = SCENES[i], e = i + 1 < SCENES.length ? SCENES[i + 1] : END_S;
      const from = Math.round(s * FPS), len = Math.round(e * FPS) - from;
      return <Sequence key={i} from={from} durationInFrames={len} layout="none">
        <SceneWrap len={len / FPS} last={i === SCENE_COMPONENTS.length - 1}>
          {i < 6 && <Header n={i + 1}/>}
          <C/>
        </SceneWrap>
      </Sequence>;
    })}
    <Progress t={t}/>
  </AbsoluteFill>;
};

// 4:5 for LinkedIn and the Instagram feed; 9:16 puts the same canvas in the middle of a taller frame for Reels,
// TikTok and Shorts (the background runs on above and below it).
export const DotsReel: React.FC = () => <DotsCanvas/>;
export const DotsTall: React.FC = () => <AbsoluteFill>
  <div style={{position: 'absolute', inset: 0, transform: `scale(1, ${1920 / H})`, transformOrigin: '0 0', width: W, height: H}}><Background/></div>
  <div style={{position: 'absolute', left: 0, top: (1920 - H) / 2, width: W, height: H}}><DotsCanvas tall/></div>
</AbsoluteFill>;
