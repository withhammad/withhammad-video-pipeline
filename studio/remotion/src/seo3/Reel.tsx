import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// 3 open-source SEO plugins for Claude Code (job f34ba51f84d9). Same 18 shots as @nick_saraev's reel DdZPRfiStXv
// (analysis/visual.md), in the same visual system: white / beige / grey-vignette canvases, coral Claude accent, pixel
// repo names, condensed italic serif captions over graphics and bold sans captions over the face, face in a rounded
// bottom card on the split shots and punched in on the full shots. Fixed vs the reference: prices from the vendors'
// own pages (Nov 2026), OpenSEO's real data cost, honest "better shot" instead of a citation promise, the real repos.
// Real recordings: openseo.so (product screenshot), github.com/Auriti-Labs/geo-optimizer-skill (GEO audit report).
loadFont({family: 'SInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'SInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'SInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'SSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'SPixel', url: staticFile('fonts/press-start-2p-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'SMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'SMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'SInter, Arial, sans-serif', SERIF = 'SSerif, Georgia, serif', PIXEL = 'SPixel, monospace', MONO = 'SMono, Menlo, monospace';
const INK = '#141414', CORAL = '#D97757', BEIGE = '#E6DCC8', GREY = '#8A8A8A', RED = '#E5342B', GREEN = '#2EA44F', TERM = '#14161C';
const file = (s: string) => staticFile('seo3/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 14, stiffness: 190}}));
const rise = (f: number, at: number, n = 8) => ({opacity: ramp(f, at, at + n * 0.6), transform: `translateY(${(1 - ease(ramp(f, at, at + n))) * 40}px)`,
  filter: `blur(${(1 - ease(ramp(f, at, at + n))) * 8}px)`});

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const FACE = new Set(['face1', 'face2', 'face3', 'face4', 'face5', 'cta']);
const SPLIT = new Set(['hook', 'ranks', 'rivals', 'geo']);

// ---------------------------------------------------------------- face (placeholder look until the HeyGen take lands)
const Take: React.FC<{scale?: number}> = ({scale = 1}) =>
  <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 30%'}}>
    <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/></AbsoluteFill>;

// Bottom face card of the split shots: rounded top corners, face framed head-and-shoulders (reference 0-2.3 s etc.)
const FaceCard: React.FC = () => <div style={{position: 'absolute', left: 40, right: 40, top: 1000, bottom: -40, borderRadius: 64, overflow: 'hidden',
  boxShadow: '0 -10px 40px rgba(0,0,0,.12)'}}>
  <div style={{position: 'absolute', left: -40, top: -180, width: 1080, height: 1920, transform: 'scale(.82)', transformOrigin: '50% 0'}}><Take/></div></div>;

const Brand: React.FC<{dark?: boolean; top?: number}> = ({dark, top = 1800}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7,
    color: dark ? 'rgba(20,20,20,.38)' : 'rgba(255,255,255,.72)', textShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>;

const Logo: React.FC<{src: string; size: number; color?: string; style?: React.CSSProperties}> = ({src, size, color, style}) => color
  ? <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${file(src)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', ...style}}/>
  : <Img src={file(src)} style={{width: size, height: size, objectFit: 'contain', ...style}}/>;
const GoogleG: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 48 48">
  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/>
  <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/>
  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>;
const Ahrefs: React.FC<{size: number}> = ({size}) => <div style={{fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.04, lineHeight: 1}}>
  <span style={{color: '#FF8800'}}>a</span><span style={{color: '#054ADA'}}>hrefs</span></div>;
const Yoast: React.FC<{size: number}> = ({size}) => <div style={{display: 'flex', alignItems: 'center', gap: size * 0.2}}>
  <Logo src="si-yoast.svg" size={size * 0.9} color="#A61E69"/><span style={{fontFamily: SANS, fontWeight: 900, fontSize: size, color: '#A61E69', letterSpacing: -size * 0.03}}>yoast</span></div>;
const Semrush: React.FC<{w: number}> = ({w}) => <Img src={file('semrush-word.svg')} style={{width: w}}/>;

// ---------------------------------------------------------------- captions
// A: bold sans over the face and the splits (white on face, black on the white split band); one or two words.
// B: condensed italic serif caps over the full graphics, the previous chunk ghosting up and out.
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const i = D.captions.findIndex((x: any) => f >= x.from && f < x.to);
  if (i < 0 || u.kind === 'cta') return null;
  const c = D.captions[i], p = ease(ramp(f, c.from, c.from + 4));
  if (FACE.has(u.kind) || SPLIT.has(u.kind)) {
    const onFace = FACE.has(u.kind), gold = /audits|\$10|month/i.test(c.text) && u.kind === 'face5';
    return <div style={{position: 'absolute', left: 0, right: 0, top: onFace ? 1130 : 905, display: 'flex', justifyContent: 'center', transform: `scale(${0.92 + 0.08 * p})`, opacity: p}}>
      <div style={{fontFamily: gold ? SERIF : SANS, fontStyle: gold ? 'italic' : 'normal', fontWeight: gold ? 400 : 800, fontSize: gold ? 108 : 84, letterSpacing: gold ? 0 : -2,
        color: onFace || u.kind === 'geo' ? '#fff' : INK, whiteSpace: 'nowrap', textShadow: onFace ? '0 4px 18px rgba(0,0,0,.45)' : 'none',
        ...(gold ? {background: 'linear-gradient(180deg,#FFE3A3,#E0A24E)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.45))'} : {})}}>{c.text}</div></div>;
  }
  const prev = i > 0 && D.captions[i - 1].from >= u.from ? D.captions[i - 1] : null;
  const accent = /three|rank|first|second|third/i.test(c.text);
  const serif = (t: string, o: number, y: number, blur: number, col = INK) => <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center',
    fontFamily: SERIF, fontStyle: 'italic', fontSize: 122, letterSpacing: -2, color: col, opacity: o, filter: `blur(${blur}px)`, whiteSpace: 'nowrap', textTransform: 'uppercase'}}>{t}</div>;
  const y = u.kind === 'cite' ? 1330 : 1270;
  return <>{prev ? serif(prev.text, 0.18 * (1 - p), y - 120 * p, 4 * p) : null}
    {serif(c.text, p, y + (1 - p) * 30, (1 - p) * 8, accent ? CORAL : INK)}</>;
};

// ---------------------------------------------------------------- shots
const Canvas: React.FC<{bg: string; children?: React.ReactNode}> = ({bg, children}) => <AbsoluteFill style={{background: bg}}>{children}<Brand dark/></AbsoluteFill>;
const Vignette = 'radial-gradient(ellipse 620px 900px at 50% 46%, #FFFFFF 30%, #D9D9D9 70%, #A9A9A9 100%)';

// 1. Hook: the three paid tools, their yearly list price counting up, struck through, then the real cost of the stack.
const PRICE = 3335; // Semrush SEO $139/mo + Ahrefs Lite $129/mo, monthly billing, x12 + Yoast Premium $118.80/yr (Nov 2026)
const Hook: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {tools} = D.beats.hook, strike = tools - 2, n = Math.round(PRICE * ease(ramp(f, 2, tools - 12)));
  const s = ease(ramp(f, strike, strike + 8)), after = f >= tools + 6;
  return <AbsoluteFill style={{background: '#fff'}}>
    <FaceCard/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 235, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
      {[<Semrush key="s" w={420}/>, <Ahrefs key="a" size={104}/>, <Yoast key="y" size={90}/>].map((el, k) =>
        <div key={k} style={{position: 'relative', opacity: 1 - 0.55 * s, ...rise(f, k * 3, 10)}}>{el}
          <div style={{position: 'absolute', left: -12, right: -12, top: '52%', height: 6, background: RED, borderRadius: 3, transform: `scaleX(${s})`, transformOrigin: '0 50%'}}/></div>)}
      <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 900, fontSize: 200, letterSpacing: -8, lineHeight: 1, color: after ? GREEN : s > 0 ? RED : INK, fontVariantNumeric: 'tabular-nums'}}>
        ${after ? '120' : n.toLocaleString('en-US')}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: GREY}}>{after ? 'PER YEAR · OPEN-SOURCE STACK' : 'PER YEAR'}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1880, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 17, color: 'rgba(255,255,255,.75)'}}>
      List prices, monthly billing, Nov 2026 · $120 = OpenSEO data at $10/mo, plus your Claude plan</div>
  </AbsoluteFill>;
};

// 2. Plugin installer: three numbered arrows into the Claude Code plugin file icon, progress bar fills.
const Plugins: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {three} = D.beats.plugins, bar = ease(ramp(f, u.from + 4, u.to - 4));
  return <Canvas bg={BEIGE}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', gap: 120}}>
      {['1', '2', '3'].map((t, k) => <div key={t} style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: CORAL, transform: `translateY(${k === 1 ? -40 : 0}px)`,
        ...rise(f, three + k * 3, 8)}}>{t}</div>)}</div>
    <svg width={1080} height={300} style={{position: 'absolute', left: 0, top: 440}}>{[[330, 90, 470, 230], [540, 50, 540, 220], [750, 90, 610, 230]].map(([x1, y1, x2, y2], k) => {
      const q = ease(ramp(f, three + k * 3 + 2, three + k * 3 + 10));
      return <line key={k} x1={x1} y1={y1} x2={x1 + (x2 - x1) * q} y2={y1 + (y2 - y1) * q} stroke={INK} strokeWidth={4} strokeLinecap="round"/>;
    })}</svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', ...rise(f, u.from, 8)}}>
      <svg width={170} height={190} viewBox="0 0 170 190"><rect x={42} y={6} width={118} height={150} rx={14} fill="none" stroke={INK} strokeWidth={7}/>
        <rect x={10} y={34} width={118} height={150} rx={14} fill={BEIGE} stroke={INK} strokeWidth={7}/>
        <path d="M52 88 L36 108 L52 128 M86 88 L102 108 L86 128 M76 82 L62 134" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 66, color: INK, marginTop: 18, letterSpacing: -1.5}}>Claude Code</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7, color: '#6E6658'}}>PLUGIN INSTALLER</div>
      <div style={{width: 620, height: 14, borderRadius: 7, background: 'rgba(20,20,20,.12)', marginTop: 34, overflow: 'hidden'}}>
        <div style={{width: `${bar * 100}%`, height: '100%', background: INK}}/></div>
      <div style={{width: 620, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontWeight: 500, fontSize: 22, color: '#6E6658', marginTop: 10}}>
        <span>{bar < 1 ? 'installing plugins…' : '3 plugins installed ✓'}</span><span>{Math.round(bar * 3)}/3</span></div>
    </div>
  </Canvas>;
};

const Face: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const kind = u.kind;
  return <><Take scale={1.12}/><Brand top={1500}/>
    {kind === 'face3' ? <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center', ...rise(f, D.beats.face3, 8)}}>
      <div style={{background: '#fff', borderRadius: 999, padding: '14px 34px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 14px 34px rgba(0,0,0,.35)'}}>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 44, color: GREEN}}>↑</span>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>#11 → page one</span></div></div> : null}
    {kind === 'face5' ? <div style={{position: 'absolute', left: 0, right: 0, top: 1310, display: 'flex', justifyContent: 'center', ...rise(f, D.beats.face5.ten - 2, 8)}}>
      <div style={{background: 'rgba(16,16,16,.82)', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 999, padding: '14px 34px', fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#fff'}}>
        Code is free · data ≈ <span style={{color: '#FFD27A'}}>$10/mo</span></div></div> : null}
  </>;
};

// 4. Detective mascot over a terminal doing an SEO run.
const RUN = [['✓', 'Crawled', '248 pages'], ['✓', 'Pulled', '1,932 keywords'], ['✓', 'Mapped', '3,414 backlinks']];
const Terminal: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const cmd = 'seo audit mysite.com', typed = cmd.slice(0, Math.floor((f - u.from) * 1.4));
  const t0 = u.from + Math.ceil(cmd.length / 1.4) + 2;
  return <Canvas bg={BEIGE}>
    <div style={{position: 'absolute', left: 140, top: 440, width: 800, height: 520, background: TERM, borderRadius: 26, boxShadow: '0 30px 70px rgba(0,0,0,.3)', padding: '24px 34px', ...rise(f, u.from, 6)}}>
      <div style={{display: 'flex', gap: 10, marginBottom: 26}}>{['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}}/>)}
        <span style={{marginLeft: 'auto', marginRight: 'auto', fontFamily: MONO, fontSize: 20, color: '#6b7280'}}>claude · seo</span></div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 34, color: '#fff'}}><span style={{color: CORAL}}>› </span>{typed}<span style={{opacity: (f >> 3) % 2 ? 1 : 0.2}}>▍</span></div>
      {RUN.map(([a, b, c], k) => f >= t0 + k * 6 ? <div key={k} style={{fontFamily: MONO, fontWeight: 500, fontSize: 30, color: '#C9CED8', marginTop: 18, ...rise(f, t0 + k * 6, 5)}}>
        <span style={{color: '#3FD68A'}}>{a} </span>{b} <b style={{color: '#fff'}}>{c}</b></div> : null)}
    </div>
    {/* Claude Code mascot in a detective hat, peeking over the window */}
    <div style={{position: 'absolute', left: 430, top: 300 + (1 - ease(ramp(f, u.from + 2, u.from + 12))) * 150, width: 220, height: 170, zIndex: -0}}>
      <Img src={file('mascot.png')} style={{position: 'absolute', left: 0, top: 30, width: 220}}/>
      <svg width={220} height={80} style={{position: 'absolute', left: 0, top: -26}}><rect x={44} y={42} width={132} height={14} fill="#4A3A2A"/><rect x={70} y={6} width={80} height={40} rx={4} fill="#5B4632"/><rect x={70} y={30} width={80} height={8} fill="#2B211A"/></svg>
    </div>
  </Canvas>;
};

// 5/10/15. GitHub tile title cards with the repo name typing on in coral pixels.
const Tile: React.FC<{u: Unit; f: number; ord: string; name: string; sub?: string; at: number}> = ({u, f, ord, name, sub, at}) => {
  const p = pop(f, u.from), typed = name.slice(0, Math.max(0, Math.floor((f - at + 2) / 2.5)));
  return <Canvas bg={Vignette}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 128, color: CORAL, opacity: 0.85, ...rise(f, u.from, 7)}}>{ord}</div>
    <div style={{position: 'absolute', left: 300, top: 530, width: 480, height: 480, borderRadius: 106, background: '#fff', boxShadow: '0 30px 70px rgba(0,0,0,.22), inset 0 -4px 0 rgba(0,0,0,.05)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${0.8 + 0.2 * p})`}}>
      <Logo src="si-github.svg" size={210} color="#000"/>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 86, color: '#000', letterSpacing: -2}}>GitHub</div></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', fontFamily: PIXEL, fontSize: name.length > 6 ? 96 : 140, color: CORAL, opacity: 0.88,
      textShadow: '6px 6px 0 rgba(217,119,87,.25)', whiteSpace: 'nowrap'}}>{typed}</div>
    {sub ? <div style={{position: 'absolute', left: 0, right: 0, top: name.length > 6 ? 1180 : 1225, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 38, letterSpacing: 22,
      color: GREY, opacity: ramp(f, at + name.length * 2.5, at + name.length * 2.5 + 6)}}>{sub}</div> : null}
  </Canvas>;
};

// 6. Search Console -> access toggle -> Claude.
const Gsc: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const on = ease(ramp(f, D.beats.gsc.google - 2, D.beats.gsc.google + 6)), line = ease(ramp(f, u.from + 4, D.beats.gsc.google));
  return <Canvas bg="#fff">
    <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', ...rise(f, u.from, 6)}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, marginBottom: 24}}>Google Search Console</div>
      <Logo src="si-googlesearchconsole.svg" size={170} color="#4285F4"/></div>
    <div style={{position: 'absolute', left: 538, top: 520, width: 4, height: 300 * line, background: INK}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, opacity: line}}>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 8, color: GREY}}>ACCESS</span>
      <div style={{width: 130, height: 70, borderRadius: 35, background: on > 0.5 ? GREEN : '#D0D0D0', position: 'relative', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.15)'}}>
        <div style={{position: 'absolute', top: 7, left: 7 + 60 * on, width: 56, height: 56, borderRadius: 28, background: '#fff', boxShadow: '0 3px 8px rgba(0,0,0,.25)'}}/></div>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 8, color: on > 0.5 ? GREEN : '#C8C8C8'}}>{on > 0.5 ? 'READ-ONLY' : 'OFF'}</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 830, display: 'flex', flexDirection: 'column', alignItems: 'center', ...rise(f, D.beats.gsc.console, 7)}}>
      <Logo src="claude-mark.svg" size={170}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, marginTop: 14}}>Claude</div></div>
  </Canvas>;
};

// 8. Your keywords sitting just off page one (positions 11-13), the content-opportunities idea of mcp-gsc.
const KW = ['ai seo tools', 'free keyword research', 'backlink checker'];
const FAR = ['seo audit checklist', 'what is a backlink', 'meta description length', 'keyword research guide', 'how to rank on google', 'internal linking', 'seo for beginners', 'local seo tips', 'site speed seo', 'on page seo'];
const Ranks: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const scroll = ease(ramp(f, u.from, D.beats.ranks.off)) * 330, hl = ramp(f, D.beats.ranks.off, D.beats.ranks.off + 8);
  return <AbsoluteFill style={{background: '#fff'}}>
    <FaceCard/>
    <div style={{position: 'absolute', left: 110, right: 110, top: 70, height: 780, overflow: 'hidden', maskImage: 'linear-gradient(180deg, transparent, #000 25%, #000 100%)'}}>
      <div style={{transform: `translateY(${-scroll}px)`, paddingTop: 120}}>
        {FAR.map((t, k) => <div key={t} style={{display: 'flex', gap: 26, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#B5B5B5', height: 54, alignItems: 'center'}}>
          <span style={{width: 70, color: '#CFCFCF'}}>#{k + 1}</span>{t}</div>)}
        <div style={{borderTop: `3px solid ${INK}`, margin: '10px 0 14px', textAlign: 'right', fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 5, color: INK, paddingTop: 6}}>END OF PAGE 1</div>
        {KW.map((t, k) => <div key={t} style={{display: 'flex', gap: 26, alignItems: 'center', height: 70, margin: '6px 0', padding: '0 18px', borderRadius: 12,
          background: `rgba(217,119,87,${0.12 * hl})`, fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK, ...rise(f, D.beats.ranks.off + k * 4, 6)}}>
          <span style={{width: 76, color: CORAL}}>#{11 + k}</span>{t}<span style={{marginLeft: 'auto', fontSize: 24, color: CORAL}}>↑ {k + 1} away</span></div>)}
        <div style={{marginTop: 22, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK, ...rise(f, D.beats.ranks.one, 6)}}>
          <span style={{color: CORAL}}>✻</span> 3 keywords within reach</div>
      </div></div>
  </AbsoluteFill>;
};

// 12. The two tools it replaces.
const Rivals: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const sem = f >= D.beats.rivals.semrush - 3;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg,#F4F6F8,#FFFFFF)'}}>
    <FaceCard/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300}}>
      {sem ? <div key="s" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, ...rise(f, D.beats.rivals.semrush - 3, 6)}}>
        <Logo src="si-semrush.svg" size={190} color="#FF642D"/><Semrush w={560}/></div>
        : <div key="a" style={rise(f, u.from, 6)}><Ahrefs size={210}/></div>}
    </div>
  </AbsoluteFill>;
};

// 13. OpenSEO: the real product screenshot from openseo.so in a floating window, slow push.
const OpenSeo: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const z = 1 + 0.08 * ramp(f, u.from, u.to);
  return <Canvas bg="#fff">
    <div style={{position: 'absolute', left: 40, top: 300, width: 1000, height: 640, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.22)', border: '1px solid #E4E4E4', ...rise(f, u.from, 6)}}>
      <div style={{position: 'absolute', left: -480, top: -410, width: 1920, height: 1200, transform: `scale(${0.98 * z})`, transformOrigin: '50% 45%'}}>
        <Sequence from={u.from} layout="none"><OffthreadVideo src={file('r_openseo_home.mp4')} muted startFrom={Math.round(6.0 * FPS)} playbackRate={0.25} style={{width: 1920, height: 1200}}/></Sequence></div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 980, display: 'flex', justifyContent: 'center', gap: 14}}>
      {[['Keyword research', D.beats.openseo.kw], ['Rank tracking', D.beats.openseo.rank], ['Backlinks', D.beats.openseo.links]].map(([t, a]: any) =>
        <div key={t} style={{background: INK, color: '#fff', borderRadius: 999, padding: '10px 24px', fontFamily: SANS, fontWeight: 800, fontSize: 28, ...rise(f, a, 5)}}>{t}</div>)}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 245, textAlign: 'center', fontFamily: MONO, fontWeight: 500, fontSize: 24, color: GREY}}>openseo.so · open source, MIT</div>
  </Canvas>;
};

// 16. GEO audit: the real command, then the tool's own published report (README, geoready.dev audit).
const GEOCMD = 'uvx --from geo-optimizer-skill geo audit --url https://yoursite.com';
const Geo: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const typed = GEOCMD.slice(0, Math.floor((f - u.from) * 3.2)), done = f - u.from > GEOCMD.length / 3.2 + 4;
  return <AbsoluteFill style={{background: TERM}}>
    <FaceCard/>
    <div style={{position: 'absolute', left: 50, right: 50, top: 150, fontFamily: MONO, fontWeight: 500, fontSize: 30, color: '#E6E6E6', lineHeight: 1.4, wordBreak: 'break-all'}}>
      <span style={{color: '#3FD68A'}}>$ </span>{typed}{!done ? <span style={{opacity: (f >> 3) % 2 ? 1 : 0.2}}>▍</span> : null}</div>
    {done ? <div style={{position: 'absolute', left: 70, top: 290, width: 940, height: 600, borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)', ...rise(f, u.from + GEOCMD.length / 3.2 + 4, 6)}}>
      <div style={{position: 'absolute', left: -70, top: -600, width: 1080, height: 1350}}>
        <Sequence from={u.from} layout="none"><OffthreadVideo src={file('r_geo_repo.mp4')} muted startFrom={Math.round(6.2 * FPS)} playbackRate={0.2} style={{width: 1080, height: 1350}}/></Sequence></div>
      <div style={{position: 'absolute', right: 12, bottom: 10, background: 'rgba(0,0,0,.6)', color: '#fff', fontFamily: SANS, fontWeight: 600, fontSize: 18, padding: '4px 10px', borderRadius: 8}}>
        Sample report from the repo README</div></div> : null}
  </AbsoluteFill>;
};

// 17. Cited-by table: the three AI engines slide from competitor rows onto your site.
const ROWS = ['competitor-a.com', 'yoursite.com', 'competitor-b.com', 'competitor-c.com'];
const Cite: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const b = D.beats.cite, move = ease(ramp(f, b.shot - 4, b.citing + 4)), you = ramp(f, b.shot, b.citing + 6);
  const icons: [React.ReactNode, number, number][] = [
    [<Logo key="o" src="openai.svg" size={72} color="#000"/>, 0, b.chatgpt], [<Logo key="c" src="claude-mark.svg" size={72}/>, 2, b.claude], [<GoogleG key="g" size={68}/>, 3, b.google]];
  return <Canvas bg="#fff">
    <div style={{position: 'absolute', left: 120, right: 120, top: 330, display: 'flex', fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 6, color: '#BDBDBD'}}>
      <span>SOURCE</span><span style={{marginLeft: 'auto'}}>CITED BY</span></div>
    {ROWS.map((r, k) => <div key={r} style={{position: 'absolute', left: 100, right: 100, top: 400 + k * 130, height: 104, borderRadius: 16, display: 'flex', alignItems: 'center', padding: '0 20px',
      background: k === 1 ? `rgba(66,133,244,${0.1 * you})` : 'transparent', fontFamily: SANS, fontWeight: k === 1 ? 800 : 600, fontSize: 48,
      color: k === 1 ? `rgb(${Math.round(150 - 125 * you)},${Math.round(150 - 50 * you)},${Math.round(150 + 60 * you)})` : `rgba(20,20,20,${1 - 0.65 * move})`,
      textDecoration: k === 1 && you > 0.5 ? 'underline' : 'none', ...rise(f, u.from + k * 2, 6)}}>{r}</div>)}
    {icons.map(([el, row, at], k) => {
      const show = ramp(f, at - 2, at + 4), x0 = 820, y0 = 400 + row * 130 + 16, x1 = 620 + k * 96, y1 = 400 + 130 + 16;
      return <div key={k} style={{position: 'absolute', left: x0 + (x1 - x0) * move, top: y0 + (y1 - y0) * move, opacity: show, transform: `scale(${0.6 + 0.4 * show})`}}>{el}</div>;
    })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 30, color: GREY, opacity: ramp(f, b.citing, b.citing + 8)}}>
      A better shot, not a guarantee: no tool can promise an AI citation</div>
  </Canvas>;
};

// 18. CTA: the gold italic "comment" over the face, the keyword in quotes (reference ending), plus our comment box.
const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {rank, send} = D.beats.cta, p = pop(f, u.from), q = pop(f, rank - 2), d = pop(f, send);
  const gold = {background: 'linear-gradient(180deg,#FFE3A3,#E0A24E)', WebkitBackgroundClip: 'text', color: 'transparent'} as const;
  return <><Take scale={1.12}/><Brand top={1500}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1080, textAlign: 'center', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,.5))'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, lineHeight: 0.9, transform: `scale(${0.85 + 0.15 * p})`, ...gold}}>comment</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: -4, lineHeight: 1, transform: `scale(${q})`, ...gold}}>“RANK”</div></div>
    {f >= send ? <div style={{position: 'absolute', left: 110, right: 110, top: 1390, transform: `scale(${d})`, background: '#fff', borderRadius: 26, padding: '16px 22px',
      display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 14px 34px rgba(0,0,0,.35)'}}>
      <div style={{width: 64, height: 64, borderRadius: 16, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Logo src="si-github.svg" size={40} color="#fff"/></div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: INK}}>All 3 repos + setup steps</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#6b6b6b'}}>sent to your DMs · withhammad.com</div></div></div> : null}
  </>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f), k = u.kind;
  let scene: React.ReactNode;
  if (k === 'hook') scene = <Hook u={u} f={f}/>;
  else if (k === 'plugins') scene = <Plugins u={u} f={f}/>;
  else if (FACE.has(k) && k !== 'cta') scene = <Face u={u} f={f}/>;
  else if (k === 'terminal') scene = <Terminal u={u} f={f}/>;
  else if (k === 'first') scene = <Tile u={u} f={f} ord="The first" name="GSC" sub="MCP" at={D.beats.first}/>;
  else if (k === 'gsc') scene = <Gsc u={u} f={f}/>;
  else if (k === 'ranks') scene = <Ranks u={u} f={f}/>;
  else if (k === 'second') scene = <Tile u={u} f={f} ord="The second" name="OPEN" sub="SEO" at={D.beats.second}/>;
  else if (k === 'rivals') scene = <Rivals u={u} f={f}/>;
  else if (k === 'openseo') scene = <OpenSeo u={u} f={f}/>;
  else if (k === 'third') scene = <Tile u={u} f={f} ord="The third" name="GEO" sub="OPTIMIZER" at={D.beats.third}/>;
  else if (k === 'geo') scene = <Geo u={u} f={f}/>;
  else if (k === 'cite') scene = <Cite u={u} f={f}/>;
  else scene = <Cta u={u} f={f}/>;
  return <AbsoluteFill style={{background: '#fff', fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {scene}
    <Captions f={f} u={u}/>
    {D.standin ? <div style={{position: 'absolute', top: 150, right: 40, background: RED, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 26, padding: '8px 16px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div> : null}
  </AbsoluteFill>;
};
