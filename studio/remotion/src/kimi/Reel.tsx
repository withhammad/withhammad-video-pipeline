import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Kimi K3 reel (job c6e60a58849b): the reference's cream editorial split (visual on top, serif labels, plain boxed captions,
// presenter card at the bottom with the head popping out of it), full-bleed b-roll beats and real page recordings.
// Timing lives in data.json (build-reel.py); layout tokens follow analysis/spec.md.
loadFont({family: 'KimiInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'KimiInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'KimiInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'KimiSerif', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'KimiSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'KimiArchivo', url: staticFile('fonts/archivo-black-latin-400-normal.woff2'), weight: '400'});

const D: any = data;
const FPS = 30;
const CREAM = '#F0EDE2', CHIP = '#F7F3EA', ORANGE = '#D0602C', SALMON = '#F3D8CF', INK = '#111111', GREY = '#8A8478', TRACK = '#E4DED0';
const SERIF = 'KimiSerif, Georgia, serif', SANS = 'KimiInter, Arial, sans-serif', MONO = 'Menlo, ui-monospace, monospace';
const SHADOW = '0 18px 48px rgba(40,30,10,.12)';
const file = (s: string) => staticFile('kimi/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

// Presenter: the take at 0.55 (hair top at y 1133), framed by a card exactly the take's width so the shirt meets the card
// edge; above the card's top edge only the matted head (take_head.webm, RVM alpha) shows, so the head pops out.
const S = 0.55, TAKE_W = 1080 * S, TAKE_H = 1920 * S, TAKE_X = (1080 - TAKE_W) / 2, TAKE_Y = 1001, CARD_Y = 1380;

type Unit = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const FACE_OFF = new Set(['broll', 'fullrec', 'wall', 'hours']);

// ---------------------------------------------------------------- shared pieces

const Clip: React.FC<{u: Unit; src: string; start?: number; style: React.CSSProperties; transparent?: boolean}> = ({u, src, start = 0, style, transparent}) =>
  <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
    <OffthreadVideo src={file(src)} muted transparent={transparent} trimBefore={Math.round(start * FPS)} style={style}/>
  </Sequence>;

const Pop: React.FC<React.PropsWithChildren<{f: number; at: number; style?: React.CSSProperties; dur?: number}>> = ({f, at, style, dur = 4, children}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + dur));
  return <div style={{...style, opacity: p, transform: `${style?.transform || ''} scale(${0.92 + 0.08 * p})`}}>{children}</div>;
};

// Orange serif number + black serif unit under a visual card (the reference's label row).
const Label: React.FC<{f: number; top: number; num?: React.ReactNode; numAt?: number; unit?: string; unitAt?: number; sub?: string; subAt?: number; size?: number}> =
  ({f, top, num, numAt = 0, unit, unitAt = 0, sub, subAt = 0, size = 120}) =>
  <div style={{position: 'absolute', left: 60, right: 60, top, display: 'flex', alignItems: 'baseline', gap: 22, fontFamily: SERIF, lineHeight: 1}}>
    {num != null && f >= numAt ? <span style={{fontSize: size, color: ORANGE, opacity: ramp(f, numAt, numAt + 3)}}>{num}</span> : null}
    {unit && f >= unitAt ? <span style={{fontSize: size * 0.55, color: INK, opacity: ramp(f, unitAt, unitAt + 4)}}>{unit}</span> : null}
    {sub && f >= subAt ? <span style={{fontSize: size * 0.45, color: GREY, opacity: ramp(f, subAt, subAt + 4)}}>{sub}</span> : null}
  </div>;

const Chip: React.FC<React.PropsWithChildren<{f: number; at: number; top: number; left?: number}>> = ({f, at, top, left, children}) => {
  if (f < at) return null;
  const p = ease(ramp(f, at, at + 4));
  return <div style={{position: 'absolute', top, left: left ?? 0, right: left == null ? 0 : undefined, display: 'flex', justifyContent: left == null ? 'center' : 'flex-start'}}>
    <div style={{background: CHIP, borderRadius: 32, padding: '22px 44px 26px', boxShadow: '0 20px 50px rgba(0,0,0,.25)', opacity: p, transform: `scale(${0.85 + 0.15 * p})`, fontFamily: SERIF, fontSize: 110, lineHeight: 1, color: INK, whiteSpace: 'nowrap', textAlign: 'center'}}>{children}</div></div>;
};

const Presenter: React.FC = () => <>
  <div style={{position: 'absolute', left: TAKE_X, top: CARD_Y, width: TAKE_W, height: 1920 - CARD_Y + 60, borderRadius: 44, overflow: 'hidden', boxShadow: SHADOW, background: '#9fd3e0'}}>
    <OffthreadVideo src={file('take.mp4')} muted style={{position: 'absolute', left: 0, top: TAKE_Y - CARD_Y, width: TAKE_W, height: TAKE_H}}/>
    <div style={{position: 'absolute', left: 30, top: 26, fontFamily: SANS, fontWeight: 800, fontSize: 19, letterSpacing: 6, color: '#ffffffd9', textShadow: '0 1px 6px #0007'}}>WITHHAMMAD</div>
  </div>
  <div style={{position: 'absolute', left: TAKE_X, top: TAKE_Y, width: TAKE_W, height: CARD_Y - TAKE_Y + 1, overflow: 'hidden'}}>
    <OffthreadVideo src={file('take_head.webm')} muted transparent style={{position: 'absolute', left: 0, top: 0, width: TAKE_W, height: 760 * S}}/>
  </div>
</>;

const CAP_Y: Record<string, number> = {broll: 1363, fullrec: 1340, wall: 1344, hours: 1210};
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const y = CAP_Y[u.kind] ?? 1046, n = f - c.from;
  const g = Math.round(interpolate(n, [0, 3], [170, 255], clamp));
  return <div style={{position: 'absolute', top: y - 36, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 60, letterSpacing: -0.6, lineHeight: '72px', height: 72, padding: '0 10px', background: '#2A2A2A',
      color: `rgb(${g},${g},${g})`, whiteSpace: 'nowrap', boxShadow: '2px 2px 3px rgba(0,0,0,.45)'}}>{c.text}</div></div>;
};

// ---------------------------------------------------------------- units

const Hook: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, k3 = spring({frame: f - u.k3, fps: FPS, config: {damping: 12}});
  return <AbsoluteFill>
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Clip u={u} src="hook_bg.mp4" style={{width: 1080, height: 1920, transform: 'scale(1.08)', filter: `blur(${interpolate(n, [0, 30], [18, 6], clamp)}px)`}}/>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(5,11,26,.55) 100%)'}}/>
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 250, top: 300, width: 580, height: 180, background: 'rgba(255,255,255,.74)', backdropFilter: 'blur(12px)', borderRadius: 28,
      boxShadow: '0 24px 60px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
      <Img src={file('kimi-mark.png')} style={{height: 84}}/>
      <span style={{fontFamily: SERIF, fontSize: 104, color: INK, lineHeight: 1}}>Kimi</span>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 104, lineHeight: 1, color: ORANGE, opacity: f >= u.k3 ? 1 : 0, transform: `scale(${f >= u.k3 ? 0.7 + 0.3 * k3 : 0.7})`, display: 'inline-block'}}>K3</span>
    </div>
  </AbsoluteFill>;
};

// Two-line hook title, frame 0 to 3.0 s (it stays over the cut into the first recording, like the reference).
const HookTitle: React.FC<{f: number}> = ({f}) => {
  if (f >= 3 * FPS) return null;
  const line = (text: string, y: number) => <div style={{position: 'absolute', top: y - 40, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 64, lineHeight: '80px', height: 80, padding: '0 16px', background: '#262626', color: '#fff', letterSpacing: -0.8, whiteSpace: 'nowrap'}}>{text}</div></div>;
  return <>{line('2.78T model', 832)}{line('8 GB RAM, no GPU', 914)}</>;
};

const Rec: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const TOP = 210, fit = Math.min(1, 600 / (u.h * 960 / 1080)), w = 960 * fit, h = u.h * w / 1080, x = (1080 - w) / 2, bottom = TOP + h, k = w / 1080;
  let num: React.ReactNode = u.num;
  if (u.count) {
    const [a, b, suffix, dp] = u.count;
    num = (a + (b - a) * ease(ramp(f, u.numAt, u.numAt + 21))).toFixed(dp) + suffix;
  }
  const swapped = u.swap && f >= u.swap[1];
  return <AbsoluteFill style={{background: CREAM}}>
    {u.credit ? <div style={{position: 'absolute', top: bottom + 160, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 32, color: INK, background: '#fff', border: `2px solid ${TRACK}`, borderRadius: 999, padding: '8px 26px'}}>kimi-k3-in-c · Fareed Khan · Apache-2.0</div></div> : null}
    <div style={{position: 'absolute', left: x, top: TOP, width: w, height: h, borderRadius: 28, overflow: 'hidden', background: '#fff', boxShadow: SHADOW}}>
      <Clip u={u} src={u.src} start={u.srcStart} style={{width: w, height: h}}/>
      {u.sweep && f >= u.sweep.at ? <div style={{position: 'absolute', left: u.sweep.x * k, top: u.sweep.y * k, height: u.sweep.h * k,
        width: u.sweep.w * k * ease(ramp(f, u.sweep.at, u.sweep.at + 9)), background: SALMON, opacity: 0.85, mixBlendMode: 'multiply', borderRadius: 6}}/> : null}
    </div>
    {swapped ? <Label f={f} top={bottom + 22} num={u.swap[0]} numAt={u.swap[1]} size={bottom > 800 ? 100 : 120}/>
      : <Label f={f} top={bottom + 22} num={num} numAt={u.numAt} unit={u.unit} unitAt={u.unitAt} sub={u.sub} subAt={u.subAt} size={bottom > 800 ? 100 : 120}/>}
  </AbsoluteFill>;
};

const Broll: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const parts: [string, number, boolean][] = u.chip || [];
  const first = parts.length ? parts[0][1] : u.to;
  const text = (t: string, at: number, orange: boolean, i: number) => {
    if (f < at) return null;
    let s = t;
    if (u.countTo && i === 0) s = String(Math.round(u.countTo * ease(ramp(f, at, at + 18))));
    return <span key={i} style={{color: orange ? ORANGE : INK, opacity: ramp(f, at, at + 2)}}>{s}</span>;
  };
  return <AbsoluteFill style={{background: '#000'}}>
    <Clip u={u} src={u.src} style={{width: 1080, height: 1920}}/>
    <Chip f={f} at={first} top={890}>
      {parts.map(([t, at, orange], i) => text(t, at, orange, i))}
      {u.line2 && f >= u.line2[1] ? <span style={{opacity: ramp(f, u.line2[1], u.line2[1] + 2)}}>{u.line2[0]}</span> : null}
      {u.line3 && f >= u.line3[1] ? <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: GREY, marginTop: 14, opacity: ramp(f, u.line3[1], u.line3[1] + 3)}}>{u.line3[0]}</div> : null}
    </Chip>
  </AbsoluteFill>;
};

const FlipIcon: React.FC = () => <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
  <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/></svg>;

const Rule: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const out = ramp(f, u.outline, u.outline + 12), strike = ramp(f, u.strike, u.strike + 8);
  const per = 2 * (960 + 480);
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 60, top: 210, width: 960, height: 480, borderRadius: 28, overflow: 'hidden', boxShadow: SHADOW}}>
      <Clip u={u} src="server.mp4" style={{width: 960, height: 540, marginTop: -30}}/>
    </div>
    <svg width={980} height={500} style={{position: 'absolute', left: 50, top: 200}}>
      <rect x={10} y={10} width={960} height={480} rx={28} fill="none" stroke={ORANGE} strokeWidth={7} strokeDasharray={per} strokeDashoffset={per * (1 - out)}/></svg>
    <Pop f={f} at={u.flip} style={{position: 'absolute', left: 900, top: 232, width: 96, height: 96, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: SHADOW}}>
      <FlipIcon/></Pop>
    <div style={{position: 'absolute', left: 60, top: 728, fontFamily: SERIF, fontSize: 104, lineHeight: 1, color: INK, whiteSpace: 'nowrap'}}>
      {f >= u.big ? <span style={{opacity: ramp(f, u.big, u.big + 3)}}>Big models </span> : null}
      {f >= u.need ? <span style={{position: 'relative', opacity: ramp(f, u.need, u.need + 3), color: f >= u.strike ? GREY : INK}}>= huge memory
        <span style={{position: 'absolute', left: 0, top: '55%', height: 8, width: `${strike * 100}%`, background: ORANGE, borderRadius: 4}}/></span> : null}
    </div>
  </AbsoluteFill>;
};

const FullRec: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const k = 900 / 1080, row = 67.5 * k, row1 = 102 * k;
  const dim = Math.max(u.dim, u.from + Math.round((2.5 - u.srcStart) * FPS));
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 90, top: 220, width: 900, height: 990, borderRadius: 28, overflow: 'hidden', background: '#fff', boxShadow: SHADOW}}>
      <Clip u={u} src={u.src} start={u.srcStart} style={{width: 900, height: 990}}/>
      {f >= dim ? <>
        <div style={{position: 'absolute', left: 0, right: 0, top: row1, height: row * 2, background: SALMON, mixBlendMode: 'multiply', opacity: ramp(f, dim, dim + 4)}}/>
        <div style={{position: 'absolute', left: 0, right: 0, top: row1 + row * 2, bottom: 0, background: '#fff', opacity: 0.7 * ramp(f, dim, dim + 6)}}/></> : null}
    </div>
    <Chip f={f} at={u.chipAt} top={1140} left={70}><span style={{color: ORANGE}}>96</span> shards</Chip>
  </AbsoluteFill>;
};

const Ring: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const pct = f < u.countAt ? 0 : 93 * ease(ramp(f, u.countAt, u.countAt + 24)), r = 150, c = 2 * Math.PI * r;
  return <AbsoluteFill style={{background: CREAM}}>
    <svg width={380} height={380} style={{position: 'absolute', left: 350, top: 230}}>
      <circle cx={190} cy={190} r={r} fill="none" stroke={TRACK} strokeWidth={24}/>
      <circle cx={190} cy={190} r={r} fill="none" stroke={ORANGE} strokeWidth={24} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 190 190)"/></svg>
    <div style={{position: 'absolute', left: 350, top: 230, width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 96, color: INK}}>{Math.round(pct)}%</div>
    {f >= u.of ? <div style={{position: 'absolute', top: 650, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 72, color: GREY, opacity: ramp(f, u.of, u.of + 5)}}>of the 1.56 TB file</div> : null}
  </AbsoluteFill>;
};

// 96 squares, one per safetensors shard; 8 survive and become the 8 GB.
const SURVIVORS = new Set([5, 18, 30, 43, 51, 66, 77, 90]);
const Collapse: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const fade = ramp(f, u.runs, u.runs + 10), eight = spring({frame: f - u.eight, fps: FPS, config: {damping: 13}}), gb = ramp(f, u.gb, u.gb + 5);
  const gather = ramp(f, u.eight - 6, u.eight + 2);
  return <AbsoluteFill style={{background: CREAM}}>
    {f >= u.tb ? <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 120, color: INK, opacity: ramp(f, u.tb, u.tb + 4) * (1 - gb)}}>1.56 TB</div> : null}
    <div style={{position: 'absolute', left: 127, top: 380, width: 826, height: 546}}>
      {Array.from({length: 96}, (_, i) => {
        const r = Math.floor(i / 12), c = i % 12, on = ramp(f, u.tb + r * 4, u.tb + r * 4 + 4), keep = SURVIVORS.has(i);
        if (on <= 0) return null;
        const x = c * 70, y = r * 70, dx = (413 - 28 - x) * gather, dy = (273 - 28 - y) * gather;
        const op = keep ? on * (1 - gather) : on * (1 - fade);
        return <div key={i} style={{position: 'absolute', left: x + (keep ? dx : 0), top: y + (keep ? dy + Math.sin(i) * 30 * fade * (1 - gather) : 0), width: 56, height: 56, borderRadius: 12,
          background: keep && fade > 0 ? ORANGE : INK, opacity: op}}/>;
      })}
    </div>
    {f >= u.eight ? <div style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 380, lineHeight: 1, color: ORANGE, transform: `scale(${0.4 + 0.6 * eight})`}}>
      8<span style={{fontSize: 170, color: INK, opacity: gb}}> GB</span></div> : null}
    {f >= u.gb ? <div style={{position: 'absolute', left: 240, top: 790, width: 600, height: 110, borderRadius: 14, background: '#2b2b2b', opacity: gb, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px'}}>
      {Array.from({length: 8}, (_, i) => <div key={i} style={{width: 50, height: 66, borderRadius: 6, background: f >= u.gb + i * 2 ? ORANGE : '#555'}}/>)}</div> : null}
  </AbsoluteFill>;
};

// Generated token ids from the engine's README ('The capital of France is' -> ' Paris.", ...'): identical at every RAM budget.
const IDS = [17374, 20829, 10, 427, 414, 1008, 606, 142957];
const Same: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const check = spring({frame: f - u.check, fps: FPS, config: {damping: 10}}), card = ease(ramp(f, u.from, u.from + 5));
  const row = (label: string, i: number) => {
    const at = i === 0 ? u.more : u.rows;
    return <div style={{marginBottom: 22, opacity: ramp(f, at, at + 3)}}>
      <div style={{fontFamily: SERIF, fontSize: 54, lineHeight: 1, color: INK, marginBottom: 10}}>{label}</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        {IDS.map((id, j) => <div key={j} style={{fontFamily: MONO, fontSize: 28, color: '#4a463e', background: '#ECE7DC', borderRadius: 10, padding: '10px 10px',
          opacity: ramp(f, at + j, at + j + 2)}}>{id}</div>)}
        {i === 1 && f >= u.check ? <div style={{marginLeft: 6, width: 58, height: 58, borderRadius: 99, background: ORANGE, color: '#fff', fontSize: 34, fontWeight: 900, fontFamily: SANS,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${check})`}}>✓</div> : null}
      </div>
    </div>;
  };
  return <AbsoluteFill>
    <AbsoluteFill style={{overflow: 'hidden'}}><Clip u={u} src="code.mp4" style={{width: 1080, height: 1920, transform: 'scale(1.06)', filter: 'blur(5px)'}}/>
      <AbsoluteFill style={{background: 'rgba(8,18,48,.35)'}}/></AbsoluteFill>
    <div style={{position: 'absolute', left: 70, top: 200, width: 940, height: 600, background: '#F8F6EE', borderRadius: 28, boxShadow: '0 30px 80px rgba(0,0,0,.4)',
      padding: '34px 44px', opacity: card, transform: `scale(${0.96 + 0.04 * card})`}}>
      <div style={{fontFamily: SERIF, fontSize: 84, color: '#9a948a', textAlign: 'center', marginBottom: 18}}>Same answer</div>
      {row('8 GB', 0)}{row('224 GB', 1)}
      {f >= u.check ? <div style={{fontFamily: SERIF, fontSize: 72, color: ORANGE, textAlign: 'center', marginTop: 4, opacity: ramp(f, u.check, u.check + 4)}}>byte for byte</div> : null}
    </div>
  </AbsoluteFill>;
};

const Catch: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, slow = u.slow + 18;
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 90, top: 280, width: 900, height: 190, borderRadius: 24, background: '#FAF8F2', boxShadow: SHADOW, padding: '34px 44px'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: GREY}}>The catch</div>
      <div style={{position: 'relative', marginTop: 34, height: 16, borderRadius: 8, background: TRACK}}>
        <div style={{position: 'absolute', left: `${interpolate(n, [0, 48], [0.5, 2.5], clamp)}%`, top: -8, width: 32, height: 32, borderRadius: 99, background: ORANGE}}/></div>
    </div>
    {f >= slow ? <div style={{position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 150, color: INK, opacity: ramp(f, slow, slow + 6)}}>Brutally slow</div> : null}
  </AbsoluteFill>;
};

const Hours: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const p = spring({frame: f - u.from, fps: FPS, config: {damping: 14}});
  return <AbsoluteFill style={{background: '#000'}}>
    <AbsoluteFill style={{overflow: 'hidden'}}><Clip u={u} src="green.mp4" style={{width: 1080, height: 1920, transform: 'scale(1.05)', filter: 'blur(4px)'}}/></AbsoluteFill>
    <div style={{position: 'absolute', left: 170, top: 620, width: 740, height: 440, borderRadius: 28, background: '#fff', boxShadow: '0 30px 80px rgba(0,0,0,.45)', transform: `scale(${0.8 + 0.2 * p})`, opacity: p,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <svg width={110} height={110} viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/></svg>
      {f >= u.hours ? <div style={{fontFamily: SERIF, fontSize: 120, lineHeight: 1, color: INK, opacity: ramp(f, u.hours, u.hours + 4)}}>Hours</div> : <div style={{height: 120}}/>}
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 40, color: GREY, opacity: ramp(f, u.note, u.note + 5)}}>1.56 TB ≈ 3.5 h at 1 Gbps</div>
    </div>
  </AbsoluteFill>;
};

const Terminal: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, prompt = '> The capital of France is', typed = prompt.slice(0, Math.floor(n * 18 / FPS) + 2);
  const secs = Math.round(949 * ramp(f, u.clock, u.clockEnd)), mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  const pill = (text: string, at: number) => f >= at ? <div style={{display: 'inline-block', marginRight: 16, marginTop: 18, fontFamily: SANS, fontWeight: 600, fontSize: 32, color: '#F2C6B2',
    border: `2px solid ${ORANGE}`, borderRadius: 999, padding: '8px 22px', opacity: ramp(f, at, at + 4)}}>{text}</div> : null;
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 60, top: 220, width: 960, height: 620, borderRadius: 26, background: '#1C1A17', boxShadow: '0 24px 60px rgba(0,0,0,.3)', padding: '30px 40px'}}>
      <div style={{display: 'flex', gap: 12}}>{['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 22, height: 22, borderRadius: 99, background: c}}/>)}</div>
      <div style={{fontFamily: MONO, fontSize: 40, color: '#EDE8DD', marginTop: 40}}>{typed}<span style={{opacity: n % 16 < 8 ? 1 : 0, color: ORANGE}}>▍</span></div>
      <div>{pill('● Jetson Orin Nano · 8 GB', u.jetson)}{pill('experts on an HDD', u.hdd)}</div>
      {f >= u.clock ? <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 50}}>
        <svg width={64} height={64} viewBox="0 0 50 50" style={{transform: `rotate(${n * 12}deg)`}}><circle cx={25} cy={25} r={20} fill="none" stroke={ORANGE} strokeWidth={6} strokeDasharray="90 40" strokeLinecap="round"/></svg>
        <div style={{fontFamily: MONO, fontSize: 92, color: ORANGE}}>{mm}:{ss}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: '#9b958a'}}>waiting for word 1…</div></div> : null}
    </div>
  </AbsoluteFill>;
};

const Drive: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const bar = ease(ramp(f, u.from, u.to - 6));
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 210, top: 230, width: 660, height: 400, borderRadius: 30, background: '#FAF8F2', border: `5px solid ${INK}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 44}}>
      <svg width={170} height={130} viewBox="0 0 24 18" fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 9H2"/><path d="M5.5 2.5L2 9v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9l-3.5-6.5A2 2 0 0 0 16.7 1.5H7.3a2 2 0 0 0-1.8 1z"/>
        <circle cx={6} cy={13} r={0.6} fill={INK}/><circle cx={9.5} cy={13} r={0.6} fill={INK}/></svg>
      <div style={{width: 520, height: 34, borderRadius: 17, background: TRACK, overflow: 'hidden'}}><div style={{width: `${bar * 100}%`, height: '100%', background: ORANGE, borderRadius: 17}}/></div>
    </div>
    <Label f={f} top={680} num="15 min 49 s" numAt={u.numAt} unit="for one word" unitAt={u.unitAt} size={120}/>
  </AbsoluteFill>;
};

const TOOLS = [['S01_ollama.png', 'Ollama', 'cloud only', '0 0 600 800'], ['S02_lmstudio.png', 'LM Studio', 'cloud only', '0 250 600 800'],
  ['S03_llamacpp_pr.png', 'llama.cpp', '~600 GB memory', '0 40 600 800']];
// Each card shows the part of the tool's own Kimi K3 page that carries its status, at half size; the first card is up on
// the unit's first frame so the top zone is never empty.
const Tools: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const dim = f >= u.proof ? 1 - 0.6 * ramp(f, u.proof, u.proof + 6) : 1, proof = spring({frame: f - u.proof, fps: FPS, config: {damping: 13}});
  return <AbsoluteFill style={{background: CREAM}}>
    {TOOLS.map(([src, name, status, box], i) => {
      const at = i === 0 ? u.from : u.cards[i];
      if (f < at) return null;
      const p = spring({frame: f - at, fps: FPS, config: {damping: 14}}), [x, y, w] = box.split(' ').map(Number), k = 300 / w;
      return <div key={src} style={{position: 'absolute', left: 60 + i * 330, top: 220, width: 300, opacity: dim * Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)`}}>
        <div style={{position: 'relative', width: 300, height: 400, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: SHADOW}}>
          <Img src={file(src)} style={{position: 'absolute', left: -x * k, top: -y * k, width: 1080 * k, height: 1400 * k}}/></div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: INK, marginTop: 16, textAlign: 'center'}}>{name}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: ORANGE, textAlign: 'center'}}>{status}</div></div>;
    })}
    {f >= u.proof ? <div style={{position: 'absolute', top: 810, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: INK, transform: `scale(${0.6 + 0.4 * proof})`}}>proof of concept</div> : null}
  </AbsoluteFill>;
};

const Wall: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const slide = ease(ramp(f, u.moved, u.moved + 10));
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', left: 140, top: 300, width: 800}}>
      {Array.from({length: 7}, (_, r) => <div key={r} style={{display: 'flex', gap: 8, marginBottom: 8, marginLeft: r % 2 ? -50 : 0, opacity: ramp(f, u.build + (6 - r) * 6, u.build + (6 - r) * 6 + 5)}}>
        {Array.from({length: r % 2 ? 6 : 5}, (_, c) => <div key={c} style={{width: 152, height: 70, borderRadius: 10, background: (r + c) % 2 ? '#DCD2BF' : '#CFC4AE', border: '2px solid #BDB29A'}}/>)}</div>)}
    </div>
    {f >= u.moved ? <div style={{position: 'absolute', left: 300 - (1 - slide) * 500, top: 300 + 6 * 78, width: 240, height: 70, borderRadius: 10, background: ORANGE,
      boxShadow: '0 10px 24px rgba(160,60,20,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {f >= u.disk ? <span style={{fontFamily: SERIF, fontSize: 60, color: '#fff', opacity: ramp(f, u.disk, u.disk + 4)}}>disk</span> : null}</div> : null}
    <div style={{position: 'absolute', top: 900, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 140, color: INK}}>Memory wall</div>
  </AbsoluteFill>;
};

const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const p = ease(ramp(f, u.from, u.from + 18));
  return <AbsoluteFill style={{background: CREAM}}>
    <div style={{position: 'absolute', top: 650 - 190, left: 0, right: 0, textAlign: 'center', fontFamily: 'KimiArchivo, Arial Black, sans-serif', color: '#000', fontSize: 150, lineHeight: 1.08,
      transform: `scale(${0.3 + 0.7 * p})`, opacity: Math.min(1, p * 3)}}>COMMENT<br/>“BYTES”</div>
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- reel

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: CREAM, fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {u.kind === 'hook' ? <Hook u={u} f={f}/> : null}
    {u.kind === 'rec' ? <Rec u={u} f={f}/> : null}
    {u.kind === 'drive' ? <Drive u={u} f={f}/> : null}
    {u.kind === 'broll' ? <Broll u={u} f={f}/> : null}
    {u.kind === 'rule' ? <Rule u={u} f={f}/> : null}
    {u.kind === 'fullrec' ? <FullRec u={u} f={f}/> : null}
    {u.kind === 'ring' ? <Ring u={u} f={f}/> : null}
    {u.kind === 'collapse' ? <Collapse u={u} f={f}/> : null}
    {u.kind === 'same' ? <Same u={u} f={f}/> : null}
    {u.kind === 'catch' ? <Catch u={u} f={f}/> : null}
    {u.kind === 'hours' ? <Hours u={u} f={f}/> : null}
    {u.kind === 'terminal' ? <Terminal u={u} f={f}/> : null}
    {u.kind === 'tools' ? <Tools u={u} f={f}/> : null}
    {u.kind === 'wall' ? <Wall u={u} f={f}/> : null}
    {u.kind === 'cta' ? <Cta u={u} f={f}/> : null}
    {FACE_OFF.has(u.kind) ? null : <Presenter/>}
    <HookTitle f={f}/>
    <Captions f={f} u={u}/>
  </AbsoluteFill>;
};
