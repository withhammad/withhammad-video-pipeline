import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Claude 2.0 concepts reel (job cd157c0bece4): the reference's edit in the same order (Nate Herk, LinkedIn
// 7522077985169039360, analysis/visual.md + spec.md): 6-weeks card, 5.5 family marquee, a montage of what shipped (real
// recordings of Anthropic's pages, top-left pills), face with chips, the 25-concepts map, Part 1 "The brain", the /model
// picker, three model cards, release-date chips, Fable, the team analogy, then receipts (official prices) and our
// MODELS comment ending. WITHHAMMAD navy/blue stage instead of the reference's charcoal/teal. Timing: data.json
// (build-reel.py in the job: every beat starts on a spoken word).
loadFont({family: 'CzInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'CzInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'CzInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'CzSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'CzMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'CzMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'CzInter, Arial, sans-serif', SERIF = 'CzSerif, Georgia, serif', MONO = 'CzMono, Menlo, monospace';
const NAVY = '#0B1020', PANEL = '#141A2E', BLUE = '#3D7BFF', SKY = '#8FB4FF', GREY = '#8A93A6', RED = '#FF4D4D', YELLOW = '#FFD60A';
const file = (s: string) => staticFile('claude20/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 180}}));

type Unit = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// ---------------------------------------------------------------- shared pieces
const Stage: React.FC<{children?: React.ReactNode}> = ({children}) => <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
  <AbsoluteFill style={{background: `radial-gradient(circle 900px at 540px 1500px, rgba(61,123,255,.30), rgba(11,16,32,0) 70%),
    radial-gradient(circle 700px at 120px 200px, rgba(61,123,255,.14), rgba(11,16,32,0) 70%)`}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(143,180,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(143,180,255,.06) 1px, transparent 1px)',
    backgroundSize: '72px 72px', maskImage: 'radial-gradient(circle 900px at 540px 900px, #000 30%, transparent 80%)'}}/>
  {children}
</AbsoluteFill>;

const Brand: React.FC<{top?: number}> = ({top = 1468}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.62)'}}>WITHHAMMAD</div>;

// Top-left context pill (reference: dark pill, 1.2 % of width; ours 40 px). A leading /command renders in blue mono.
const Pill: React.FC<{text: string; f: number; from: number; cmd?: string}> = ({text, f, from, cmd}) => {
  const p = pop(f, from + 2);
  return <div style={{position: 'absolute', left: 60, top: 236, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(20,26,46,.9)', border: '1.5px solid rgba(143,180,255,.28)',
    borderRadius: 22, padding: '14px 26px', boxShadow: '0 10px 30px rgba(0,0,0,.4)', transform: `translateX(${(1 - p) * -40}px)`, opacity: Math.min(1, p * 2), maxWidth: 960}}>
    {cmd ? <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 38, color: SKY}}>{cmd}</span> : null}
    <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#fff', lineHeight: 1.15}}>{text}</span></div>;
};

const Icon: React.FC<{kind: string; size?: number}> = ({kind, size = 40}) => <div style={{width: size, height: size, borderRadius: size, flex: 'none',
  background: kind === 'x' ? RED : BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
  <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 20 20">{kind === 'x'
    ? <path d="M5 5 L15 15 M15 5 L5 15" stroke="#fff" strokeWidth={3.2} strokeLinecap="round"/>
    : <path d="M4 10.5 L8.5 15 L16 5.5" stroke="#fff" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>}</svg></div>;

// ---------------------------------------------------------------- face (HeyGen take), framing A wide / B tight
const Take: React.FC<{style?: React.CSSProperties}> = ({style}) => D.take
  ? <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover', ...style}}/>
  : <AbsoluteFill style={{background: '#222', color: '#888', fontFamily: SANS, fontSize: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>TAKE</AbsoluteFill>;
const Face: React.FC<{u: Unit}> = ({u}) => <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
  <AbsoluteFill style={{transform: u.framing === 'B' ? 'scale(1.2) translateX(-40px)' : 'scale(1.0)', transformOrigin: '50% 30%'}}><Take/></AbsoluteFill>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)'}}/>
  <Brand/>
</AbsoluteFill>;

const Chips: React.FC<{f: number}> = ({f}) => {
  const live = D.chips.filter((c: any) => f >= c.at && f < c.to);
  return <div style={{position: 'absolute', left: 60, right: 60, bottom: 1920 - 1330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
    {live.map((c: any, i: number) => {
      const p = pop(f, c.at), s = c.strikeAt ? ease(ramp(f, c.strikeAt, c.strikeAt + 8)) : 0;
      return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(20,26,46,.92)', border: '1.5px solid rgba(143,180,255,.3)', borderRadius: 24,
        padding: '14px 28px 14px 16px', transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2) * (1 - 0.35 * s), boxShadow: '0 12px 32px rgba(0,0,0,.45)', position: 'relative'}}>
        <Icon kind={c.icon}/>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff', whiteSpace: 'nowrap'}}>{c.text}</span>
        {s > 0 ? <div style={{position: 'absolute', left: 76, top: '50%', height: 5, width: `calc((100% - 100px) * ${s})`, background: RED, borderRadius: 3}}/> : null}
      </div>;
    })}</div>;
};

// ---------------------------------------------------------------- 0: "THE LAST 6 weeks of Claude updates" (readable on frame 0)
const Title: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, b = 6 * (1 - ease(ramp(n, 0, 12))), s = 1.04 - 0.04 * ease(ramp(n, 0, 20));
  return <Stage>
    <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', filter: `blur(${b}px)`, transform: `scale(${s})`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, letterSpacing: 14, color: SKY}}>THE LAST</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 230, letterSpacing: -8, color: '#fff', lineHeight: 1, margin: '10px 0 30px', whiteSpace: 'nowrap'}}>6 weeks</div>
      <div style={{background: BLUE, borderRadius: 999, padding: '16px 44px', fontFamily: SANS, fontWeight: 800, fontSize: 56, color: '#fff'}}>of Claude updates</div>
    </AbsoluteFill>
    <Pill text="The last 6 weeks" f={f} from={u.from}/>
  </Stage>;
};

// ---------------------------------------------------------------- 1: the 5.5 family marquee
const Family: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, x = 140 - n * 9;
  const M = [['Opus 5.5', 'Sep 22'], ['Sonnet 5.5', 'Sep 28'], ['Haiku 5.5', 'Oct 7']];
  return <Stage>
    <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 44, color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: RED}}/>The Claude 5.5 family</div>
    <div style={{position: 'absolute', top: 730, left: x, display: 'flex', gap: 110, whiteSpace: 'nowrap'}}>
      {M.map(([m, d], i) => <div key={i} style={{opacity: ramp(n, i * 4, i * 4 + 8)}}>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 150, color: '#fff', letterSpacing: -3}}>{m}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: GREY, marginTop: 8}}>released {d}</div></div>)}
    </div>
    <Pill text="3 new models" f={f} from={u.from}/>
  </Stage>;
};

// ---------------------------------------------------------------- real recordings in a rounded panel
const P = {x: 60, y: 330, w: 880, h: 1000};
const Rec: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, k = P.w / 1080, enter = ease(ramp(n, 0, 9)), push = 1 + 0.035 * ramp(n, 0, u.to - u.from);
  const box = (x0: number, x1: number, y0: number, y1: number, at: number, c = YELLOW) => {
    const a = ease(ramp(f, at, at + 6));
    return a > 0 ? <div style={{position: 'absolute', left: x0 * k - 8, top: (y0 - u.y0) * k - 6, width: (x1 - x0) * k + 16, height: (y1 - y0) * k + 12, borderRadius: 12,
      border: `5px solid ${c}`, background: 'rgba(255,214,10,.10)', opacity: a, transform: `scale(${1.1 - 0.1 * a})`}}/> : null;
  };
  return <Stage>
    <div style={{position: 'absolute', left: P.x + (1 - enter) * 700, top: P.y, width: P.w, height: P.h, borderRadius: 30, overflow: 'hidden', background: '#1a1a19',
      boxShadow: '0 40px 90px rgba(0,0,0,.6), 0 0 0 1.5px rgba(143,180,255,.25)'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${push})`, transformOrigin: '50% 40%'}}>
        <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
          <OffthreadVideo src={file(u.src)} muted trimBefore={Math.round(u.srcStart * FPS)} playbackRate={u.rate || 1}
            style={{position: 'absolute', left: 0, top: -u.y0 * k, width: P.w, height: 1800 * k}}/></Sequence>
        {u.boxes ? <>{box(486, 700, 566, 628, D.beats.prow[0])}{box(722, 905, 566, 628, D.beats.prow[1])}</> : null}
      </div>
    </div>
    <Pill text={u.pill} f={f} from={u.from}/>
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- 25 concepts across 5 parts
const PARTS = ['The brain', 'Where you use it', 'What it makes', 'What it knows about you', 'Working on its own'];
const Map25: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const c = D.beats.map25_count, count = Math.round(interpolate(f, [c, c + 16], [8, 25], clamp));
  return <Stage>
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 100, color: '#fff', letterSpacing: -3}}><span style={{color: BLUE}}>{f < c ? 8 : count}</span> Claude concepts</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: GREY, marginTop: 10}}>in plain English, across 5 parts</div>
    </div>
    {PARTS.map((p, i) => {
      const at = D.beats.map25_parts + i * 5, lit = ease(ramp(f, at, at + 6)), y = 560 + i * 165, x = i % 2 ? 250 : 70;
      const show = ease(ramp(f, u.from + i * 3, u.from + i * 3 + 8));
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 700, height: 135, opacity: show, transform: `translateY(${(1 - show) * 40}px)`,
        borderRadius: 28, background: `rgba(20,26,46,${0.75 + 0.2 * lit})`, border: `3px solid ${lit ? `rgba(61,123,255,${0.3 + 0.7 * lit})` : 'rgba(143,180,255,.2)'}`,
        boxShadow: lit ? `0 0 ${50 * lit}px rgba(61,123,255,.55)` : 'none', display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px'}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 62, color: lit > 0.5 ? BLUE : GREY}}>{i + 1}</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#fff'}}>{p}</div></div>;
    })}
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- Part 1: the brain
const Part1: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, rise = ease(ramp(n, 0, 12)), m = pop(f, D.beats.part1_models);
  const nodes = [['START', 160], ['1', 360], ['2', 560], ['3', 760], ['4', 960]];
  return <Stage>
    <div style={{position: 'absolute', top: 470 + (1 - rise) * 80, left: 0, right: 0, textAlign: 'center', opacity: rise}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, letterSpacing: 12, color: SKY}}>PART 1</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 170, color: '#fff', letterSpacing: -5}}>The brain</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: GREY}}>what Claude actually runs on</div>
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d="M160 1100 L960 1100" stroke="rgba(143,180,255,.35)" strokeWidth={6} strokeDasharray="4 22" strokeLinecap="round"/>
      <path d={`M160 1100 L${160 + 200 * ease(ramp(n, 8, 30))} 1100`} stroke={BLUE} strokeWidth={8} strokeLinecap="round"/>
    </svg>
    {nodes.map(([t, x], i) => <div key={i} style={{position: 'absolute', left: (x as number) - 50, top: 1050, width: 100, height: 100, borderRadius: 50,
      background: i === 1 ? BLUE : PANEL, border: '3px solid rgba(143,180,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, fontWeight: 900, fontSize: i ? 44 : 22, color: '#fff', boxShadow: i === 1 ? '0 0 40px rgba(61,123,255,.7)' : 'none'}}>{t}</div>)}
    <div style={{position: 'absolute', left: 360 - 140, top: 1190, width: 280, textAlign: 'center', transform: `scale(${m})`, opacity: Math.min(1, m * 2)}}>
      <div style={{display: 'inline-block', background: '#fff', borderRadius: 18, padding: '14px 30px', fontFamily: SANS, fontWeight: 900, fontSize: 52, color: NAVY}}>Models</div></div>
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- /model picker (Claude Code), text as on the reference's screen
const ROWS = [
  ['1. Default (recommended)', 'Opus 5.5', ' · Best for everyday, complex tasks'],
  ['2. Opus', 'Opus 5.5', ' · Best for everyday, complex tasks'],
  ['3. Fable', 'Fable 5.1', ' · Most capable for your hardest and longest-running tasks'],
  ['4. Sonnet', 'Sonnet 5.5', ' · Efficient for routine tasks'],
];
const Picker: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, fable = u.mode === 'fable';
  const sel = fable ? (f < D.beats.fable_move ? 0 : f < D.beats.fable_move + 5 ? 1 : 2) : 0;
  const zoom = 1 + 0.12 * ease(ramp(n, 0, u.to - u.from));
  const boxA = ease(ramp(n, 10, 18));
  const T = 34, L = 50;
  return <Stage>
    <div style={{position: 'absolute', left: 40, top: 360, width: 1000, height: 940, borderRadius: 26, background: '#0E1117', boxShadow: '0 40px 90px rgba(0,0,0,.6), 0 0 0 1.5px rgba(143,180,255,.22)',
      overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: fable ? '30% 52%' : '35% 48%'}}>
      <div style={{height: 54, background: '#161A22', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 24}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}}/>)}
        <div style={{marginLeft: 20, fontFamily: MONO, fontSize: 22, color: GREY}}>claude</div></div>
      <div style={{padding: '30px 40px', fontFamily: MONO, fontWeight: 500, fontSize: T, lineHeight: 1.5, color: '#C9CED8'}}>
        <div style={{color: '#fff'}}><span style={{color: SKY}}>&gt;</span> /model</div>
        <div style={{height: 3, background: '#A9B4FF', margin: '22px 0 20px', width: '78%'}}/>
        <div style={{color: '#B9C2FF', fontWeight: 700}}>Select model</div>
        <div style={{fontSize: 26, color: '#9AA1AE', marginBottom: 22}}>Switch between Claude models. Your pick becomes the default for new sessions.</div>
        <div style={{position: 'relative', borderRadius: 18, margin: '0 -20px', padding: '10px 20px', outline: !fable && boxA > 0 ? `5px solid rgba(61,123,255,${boxA})` : 'none',
          boxShadow: !fable && boxA > 0 ? `0 0 40px rgba(61,123,255,${0.5 * boxA})` : 'none'}}>
        {ROWS.map(([a, b, c], i) => {
          const on = i === sel;
          const hl = fable ? (i === 2 && f >= D.beats.fable_move + 10 ? ease(ramp(f, D.beats.fable_move + 10, D.beats.fable_move + 16)) : 0) : 0;
          return <div key={i} style={{display: 'flex', flexDirection: 'column', marginBottom: 10, position: 'relative', borderRadius: 14, margin: '0 -16px 10px', padding: '4px 16px',
            outline: hl ? `5px solid rgba(61,123,255,${hl})` : 'none', boxShadow: hl ? `0 0 40px rgba(61,123,255,${0.5 * hl})` : 'none'}}>
            <div style={{whiteSpace: 'nowrap'}}><span style={{color: on ? '#B9C2FF' : 'transparent'}}>❯ </span>
              <span style={{color: on ? '#B9C2FF' : i === 1 ? '#5FD38D' : '#fff', fontWeight: 700}}>{a}{i === 1 ? ' ✓' : ''}</span></div>
            <div style={{paddingLeft: L, fontSize: 28, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              <span style={{color: b.startsWith('Opus') ? '#F28B6B' : '#C9CED8'}}>{b}</span><span>{c}</span></div>
          </div>;
        })}
        <div style={{paddingLeft: L, color: '#7D8594', fontSize: 28}}>… +1 model</div></div>
        <div style={{marginTop: 22, fontSize: 28}}><span style={{color: RED}}>●</span> High effort (default) <span style={{color: '#59606C'}}>←/→ to adjust</span></div>
      </div>
    </div>
    <Pill text={u.pill} cmd="/model" f={f} from={u.from}/>
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- three main models
const CARDS = [['Haiku 5.5', 'Fastest, cheapest', 'M10 4 L4 20 L16 20 Z'], ['Sonnet 5.5', 'The everyday workhorse', 'M4 8 H20 V20 H4 Z M8 4 H16 V8'], ['Opus 5.5', 'Big, long, messy jobs', 'M12 3 A9 9 0 1 0 12.01 3 M12 7 V12 L15 15']];
const Cards: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [h, s, o, tag] = D.beats.cards, lit = [h, s, o];
  const t = pop(f, tag);
  return <Stage>
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 96, color: '#fff', letterSpacing: -3}}>
      Three main <span style={{color: BLUE}}>models</span></div>
    {CARDS.map(([name, desc, icon], i) => {
      const on = ease(ramp(f, lit[i], lit[i] + 6)), cur = f >= lit[i] && (i === 2 || f < lit[i + 1]);
      return <div key={i} style={{position: 'absolute', left: 90, width: 850, top: 520 + i * 260, height: 230, borderRadius: 34,
        background: `rgba(20,26,46,${0.6 + 0.35 * on})`, border: `3px solid ${cur ? BLUE : 'rgba(143,180,255,.22)'}`, opacity: 0.55 + 0.45 * on,
        boxShadow: cur ? '0 0 60px rgba(61,123,255,.45)' : 'none', display: 'flex', alignItems: 'center', gap: 40, padding: '0 50px', transform: `scale(${cur ? 1.03 : 1})`}}>
        <div style={{width: 120, height: 120, borderRadius: 30, background: on > 0.5 ? BLUE : '#26304A', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
          <svg width={64} height={64} viewBox="0 0 24 24"><path d={icon} stroke="#fff" strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round"/></svg></div>
        <div><div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 76, color: '#fff'}}>{name}</div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: on > 0.5 ? SKY : GREY}}>{desc}</div></div>
        {i === 2 && t > 0 ? <div style={{position: 'absolute', left: 230, top: -34, background: YELLOW, borderRadius: 16, padding: '10px 22px', fontFamily: SANS, fontWeight: 900,
          fontSize: 34, color: NAVY, transform: `scale(${t}) rotate(3deg)`}}>Anthropic's default pick</div> : null}
      </div>;
    })}
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- receipts: half the price, then the routing rule
const Compare: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const b = D.beats.compare[1];
  const card = (x: number, name: string, inp: number, out: number, win: boolean, at: number) => {
    const p = pop(f, at), k = ease(ramp(f, at + 4, at + 22));
    return <div style={{position: 'absolute', left: x, top: 640, width: 410, height: 520, borderRadius: 36, background: PANEL, opacity: Math.min(1, p * 2),
      transform: `translateY(${(1 - p) * 60}px)`, border: `3px solid ${win && f >= b ? BLUE : 'rgba(143,180,255,.22)'}`,
      boxShadow: win && f >= b ? '0 0 70px rgba(61,123,255,.55)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 60, color: '#fff'}}>{name}</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, color: win ? BLUE : '#fff', letterSpacing: -5}}>${Math.round(inp * k)}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 36, color: GREY}}>in · ${Math.round(out * k)} out</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, color: GREY, marginTop: 10}}>per million tokens</div></div>;
  };
  return <Stage>
    <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 92, color: '#fff', letterSpacing: -3, lineHeight: 1.05}}>
      Same tokens,<br/><span style={{color: BLUE}}>half the price</span></div>
    {card(70, 'Sonnet 5.5', 2, 10, true, u.from)}
    {card(540, 'Opus 5.5', 4, 20, false, u.from + 3)}
    <div style={{position: 'absolute', top: 1200, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 30, color: GREY}}>Source: Anthropic models overview, Nov 2026</div>
    <Brand/>
  </Stage>;
};

const Rule: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.rule;
  const row = (y: number, at: number, k: string, m: string, art: React.ReactNode) => {
    const p = pop(f, at);
    return <div style={{position: 'absolute', left: 70, width: 870, top: y, height: 400, borderRadius: 36, background: PANEL, border: '2px solid rgba(143,180,255,.25)',
      opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 300}px)`, padding: '40px 50px', boxSizing: 'border-box'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: GREY}}>{k}</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 84, color: '#fff', letterSpacing: -2}}>→ <span style={{color: BLUE}}>{m}</span></div>
      <div style={{position: 'absolute', left: 50, right: 50, bottom: 40, height: 110}}>{art}</div></div>;
  };
  const guide = <div style={{display: 'flex', gap: 16}}>{[0, 1, 2, 3].map(i => <div key={i} style={{width: 150, height: 104, borderRadius: 12, background: '#1F2740', padding: 14, boxSizing: 'border-box'}}>
    {[0, 1, 2].map(j => <div key={j} style={{height: 10, borderRadius: 5, background: j ? '#3A4566' : SKY, width: `${[80, 100, 60][j]}%`, marginBottom: 12}}/>)}</div>)}</div>;
  const plan = <div style={{position: 'relative', height: 110}}>
    {['Days 1-30', 'Days 31-60', 'Days 61-90'].map((t, i) => <div key={i} style={{position: 'absolute', left: i * 240, top: i * 30, width: 290, height: 44, borderRadius: 10,
      background: i === 2 ? BLUE : '#2A3560', fontFamily: SANS, fontWeight: 800, fontSize: 24, color: '#fff', padding: '8px 16px', boxSizing: 'border-box'}}>{t}</div>)}</div>;
  return <Stage>
    <div style={{position: 'absolute', top: 280, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 80, color: '#fff', letterSpacing: -2}}>
      My <span style={{color: BLUE}}>routing rule</span></div>
    {row(460, a, 'Clear brief, like a resource guide', 'Sonnet 5.5', guide)}
    {row(910, b, 'Vague goal, like a 90-day plan', 'Opus 5.5', plan)}
    <Brand/>
  </Stage>;
};

// ---------------------------------------------------------------- call-to-action: comment box types MODELS, then the DM card
const Cta: React.FC<{f: number}> = ({f}) => {
  const {type, dm} = D.beats.cta, word = 'MODELS', up = pop(f, type - 6);
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - type) * 9 / FPS) + 1)));
  const d = pop(f, dm), card = pop(f, dm + 8);
  return <>
    <div style={{position: 'absolute', left: 70, right: 150, top: 1010, transform: `translateY(${(1 - up) * 500}px)`, background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', padding: '24px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
      <div style={{width: 64, height: 64, borderRadius: 32, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: f >= type ? 900 : 600, fontSize: 46, color: f >= type ? NAVY : '#8e8e93'}}>
        {f >= type ? typed : 'Add a comment…'}{f >= type && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= dm ? <div style={{position: 'absolute', left: 110, top: 1170, transform: `scale(${d})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: NAVY}}>Here's your Claude cheat sheet</div> : null}
    {f >= dm + 8 ? <div style={{position: 'absolute', left: 110, top: 1252, width: 760, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 88, height: 88, borderRadius: 18, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: BLUE}}>25</div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: NAVY}}>Which model, which plan, what's free</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources</div></div></div> : null}
  </>;
};

// ---------------------------------------------------------------- captions: phrase by phrase, spoken word white, next 45 %
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const y = 1405;
  return <div style={{position: 'absolute', left: 40, right: 40, top: y, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: SANS, fontWeight: 900,
    fontSize: 60, lineHeight: 1.12, letterSpacing: -0.5, textShadow: '0 3px 10px rgba(0,0,0,.7), 0 0 2px rgba(0,0,0,.5)', whiteSpace: 'nowrap'}}>
    {c.words.map((w: any, j: number) => <span key={j} style={{color: f >= w.at ? (w.emph ? SKY : '#fff') : 'rgba(255,255,255,.45)'}}>{j ? ' ' : ''}{w.text}</span>)}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  const last = u === D.units[D.units.length - 1];
  return <AbsoluteFill style={{background: NAVY, fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {u.kind === 'title' ? <Title u={u} f={f}/> : null}
    {u.kind === 'family' ? <Family u={u} f={f}/> : null}
    {u.kind === 'rec' ? <Rec u={u} f={f}/> : null}
    {u.kind === 'face' ? <Face u={u}/> : null}
    {u.kind === 'map25' ? <Map25 u={u} f={f}/> : null}
    {u.kind === 'part1' ? <Part1 u={u} f={f}/> : null}
    {u.kind === 'picker' ? <Picker u={u} f={f}/> : null}
    {u.kind === 'cards' ? <Cards u={u} f={f}/> : null}
    {u.kind === 'compare' ? <Compare u={u} f={f}/> : null}
    {u.kind === 'rule' ? <Rule u={u} f={f}/> : null}
    {u.kind === 'face' && !last ? <Chips f={f}/> : null}
    {last ? <Cta f={f}/> : null}
    <Captions f={f} u={u}/>
    {D.standin ? <div style={{position: 'absolute', top: 90, right: 40, background: RED, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 26, padding: '8px 16px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div> : null}
  </AbsoluteFill>;
};
