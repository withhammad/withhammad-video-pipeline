import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// SkillSpector reel (job d61788123d13): the reference's four layouts (split with the head breaking out of a rounded face
// card, tight full face, clean white/beige graphics, dark screen cards with a blue marker), its three caption styles
// and the same graphics in the same order, rebuilt here with official NVIDIA / Claude Code marks. Timing: data.json.
loadFont({family: 'SkInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'SkInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'SkInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'SkSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'SkDoto', url: staticFile('fonts/doto-latin-500-normal.woff2'), weight: '500'});

const D: any = data;
const FPS = 30;
const SANS = 'SkInter, Arial, sans-serif', SERIF = 'SkSerif, Georgia, serif', MONO = 'Menlo, ui-monospace, monospace', DOTO = 'SkDoto, Menlo, monospace';
const BEIGE = '#E2D8C9', SLATE = '#262934', ORANGE = '#D97757', RED = '#E5484D', GREEN = '#30A46C', MINT = '#7FE8E2', BLUE = '#2F6FED', INK = '#141414';
const file = (s: string) => staticFile('skill/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 11, stiffness: 160}}));

type Unit = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// Face card: the take at 0.72 with the hair top at y 1010 (reference 52.5 %), the card's top edge at 1230 (64 %) and only
// the matted head (take_head.webm, RVM alpha) above it.
const S = 0.72, TAKE_W = 1080 * S, TAKE_H = 1920 * S, TAKE_X = (1080 - TAKE_W) / 2, TAKE_Y = 909, CARD_Y = 1230;
const SPLITS: Record<string, string> = {banner: SLATE, grid: BEIGE, nvidia: '#000', pipeline: '#fff', gauge: '#fff'};
const FULLFACE = new Set(['face', 'punch', 'flash', 'cta']);

const Clip: React.FC<{u: Unit; src: string; start?: number; style: React.CSSProperties; transparent?: boolean}> = ({u, src, start = 0, style, transparent}) =>
  <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
    <OffthreadVideo src={file(src)} muted transparent={transparent} trimBefore={Math.round(start * FPS)} style={style}/>
  </Sequence>;

const SplitFace: React.FC = () => <>
  <div style={{position: 'absolute', left: TAKE_X, top: CARD_Y, width: TAKE_W, height: 1920 - CARD_Y + 120, borderRadius: 110, overflow: 'hidden'}}>
    <OffthreadVideo src={file('take.mp4')} muted style={{position: 'absolute', left: 0, top: TAKE_Y - CARD_Y, width: TAKE_W, height: TAKE_H}}/>
    <div style={{position: 'absolute', left: 60, top: 40, fontFamily: SANS, fontWeight: 800, fontSize: 18, letterSpacing: 6, color: '#ffffffcc', textShadow: '0 1px 6px #0006'}}>WITHHAMMAD</div>
  </div>
  <div style={{position: 'absolute', left: TAKE_X, top: TAKE_Y, width: TAKE_W, height: CARD_Y - TAKE_Y + 1, overflow: 'hidden'}}>
    <OffthreadVideo src={file('take_head.webm')} muted transparent style={{position: 'absolute', left: 0, top: 0, width: TAKE_W, height: 520 * S}}/>
  </div>
</>;

const FullFace: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const scale = u.kind === 'punch' ? 1.12 : 1;
  const n = f - u.from;
  const flash = u.kind === 'flash' ? Math.max(0, Math.sin(Math.min(1, n / 6) * Math.PI) * 0.85, n >= 3 && n < 9 ? Math.sin((n - 3) / 6 * Math.PI) * 0.6 : 0) : 0;
  return <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 37%'}}>
      <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920}}/>
    </AbsoluteFill>
    {flash > 0 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse at 70% 30%, #FFE29A, #FFB347 45%, transparent 80%)', opacity: flash, mixBlendMode: 'screen'}}/> : null}
    <div style={{position: 'absolute', left: 48, top: 1250, fontFamily: SANS, fontWeight: 800, fontSize: 18, letterSpacing: 6, color: '#ffffffb3', textShadow: '0 1px 6px #0007'}}>WITHHAMMAD</div>
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- graphics (top panel y 140-770 on splits)

const Banner: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const chars = '#@%&*+=-:;<>/\\|[]{}()01$?!';
  const row = (i: number) => Array.from({length: 26}, (_, j) => chars[Math.floor(random(`r${i}-${j}-${Math.floor(f / 2)}`) * chars.length)]).join('');
  const lock1 = f >= u.claude, lock2 = f >= u.code;
  return <AbsoluteFill style={{background: SLATE}}>
    <div style={{position: 'absolute', top: 210, left: 0, right: 0, textAlign: 'center', fontFamily: MONO, fontSize: 34, lineHeight: '48px', color: ORANGE, opacity: lock2 ? 0.12 : lock1 ? 0.3 : 0.6, whiteSpace: 'pre'}}>
      {Array.from({length: 9}, (_, i) => <div key={i}>{row(i)}</div>)}</div>
    <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: DOTO, fontWeight: 500, fontSize: 196, lineHeight: '190px', letterSpacing: 6, color: ORANGE}}>
      <div style={{opacity: lock1 ? 1 : 0, transform: `scale(${lock1 ? 0.96 + 0.04 * ramp(f, u.claude, u.claude + 4) : 1})`}}>CLAUDE</div>
      <div style={{opacity: lock2 ? 1 : 0}}>CODE</div></div>
  </AbsoluteFill>;
};

const FileIcon: React.FC<{label: string; kind: 'zip' | 'doc' | 'folder'; selected?: boolean; size?: number}> = ({label, kind, selected, size = 150}) =>
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: size + 120}}>
    <svg width={size} height={size} viewBox="0 0 100 100">
      {kind === 'folder' ? <><path d="M8 26 h30 l8 8 h46 v54 h-84z" fill="#4A90E2"/><path d="M8 38 h84 v50 h-84z" fill="#6AA8F0"/></>
        : <><path d="M22 8 h40 l18 18 v66 h-58z" fill="#fff" stroke="#C9C1B3" strokeWidth={2}/><path d="M62 8 v18 h18" fill="#EDE6DA" stroke="#C9C1B3" strokeWidth={2}/>
          {kind === 'zip' ? <><rect x={46} y={12} width={8} height={40} fill="#8D8D8D"/>{[16, 24, 32, 40].map(y => <rect key={y} x={y % 16 ? 42 : 50} y={y} width={8} height={5} fill="#5E5E5E"/>)}<rect x={40} y={52} width={20} height={14} rx={3} fill="#5E5E5E"/></>
            : <>{[40, 50, 60, 70].map(y => <rect key={y} x={32} y={y} width={y === 70 ? 24 : 36} height={4} rx={2} fill="#B9B0A2"/>)}</>}</>}
    </svg>
    <div style={{marginTop: 10, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: selected ? '#fff' : INK, background: selected ? BLUE : 'transparent', padding: '4px 12px', borderRadius: 8, whiteSpace: 'nowrap'}}>{label}</div>
  </div>;

const Files: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const items: [string, 'doc' | 'folder'][] = [['SKILL.md', 'doc'], ['scripts/', 'folder'], ['references/', 'folder']];
  const cursor = interpolate(f, [u.from, u.click - 4], [0, 1], clamp), ripple = f - u.click;
  return <AbsoluteFill style={{background: BEIGE}}>
    <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 20}}>
      {items.map(([label, kind], i) => {
        const p = pop(f, u.click + i * 3);
        return <div key={label} style={{transform: `translateY(${(1 - p) * 120}px) scale(${p})`, opacity: Math.min(1, p * 2)}}><FileIcon label={label} kind={kind} size={190}/></div>;
      })}
    </div>
    <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <FileIcon label="seo-audit-skill.zip" kind="zip" selected={f >= u.select} size={210}/></div>
    {ripple >= 0 && ripple < 14 ? [0, 4].map(d => <div key={d} style={{position: 'absolute', left: 590 - 40 - (ripple - d) * 4, top: 790 - 40 - (ripple - d) * 4, width: 80 + (ripple - d) * 8, height: 80 + (ripple - d) * 8,
      borderRadius: 999, border: `3px solid ${BLUE}`, opacity: ripple >= d ? 1 - (ripple - d) / 10 : 0}}/>) : null}
    <svg width={56} height={70} viewBox="0 0 16 20" style={{position: 'absolute', left: 860 - cursor * 270, top: 1000 - cursor * 210}}>
      <path d="M1 1 L1 16 L5 12 L8 19 L11 18 L8 11 L14 11 Z" fill="#fff" stroke="#000" strokeWidth={1.2}/></svg>
  </AbsoluteFill>;
};

const Breach: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const settle = 1.1 - 0.1 * ease(ramp(f, u.from, u.from + 10)), red = ramp(f, u.red, u.red + 12);
  const screen = `rgb(${Math.round(247 - 33 * red)},${Math.round(214 - 174 * red)},${Math.round(214 - 174 * red)})`;
  const open = ramp(f, u.lock, u.lock + 6), leak = ramp(f, u.leak, u.leak + 14), stamp = pop(f, u.stamp);
  const glitch = f >= u.leak && f < u.leak + 12;
  return <AbsoluteFill style={{background: '#fff'}}>
    <div style={{position: 'absolute', left: 160, top: 300, width: 760, transform: `scale(${settle})`, transformOrigin: '50% 40%'}}>
      <div style={{width: 760, height: 470, borderRadius: 26, background: '#1E1E1E', padding: 18}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 12, background: screen, overflow: 'hidden'}}>
          <svg width={150} height={170} viewBox="0 0 30 34" style={{position: 'absolute', left: 287, top: 70}}>
            <path d={`M8 15 V9 a7 7 0 0 1 14 0 ${open > 0.5 ? 'V6' : 'V15'}`} transform={`translate(0 ${-open * 4})`} fill="none" stroke="#fff" strokeWidth={3}/>
            <rect x={4} y={15} width={22} height={17} rx={3} fill="#fff"/><circle cx={15} cy={23} r={2.5} fill={screen}/></svg>
          <div style={{position: 'absolute', left: 60 + leak * 700, top: 300, fontFamily: MONO, fontSize: 40, color: '#fff', opacity: 1 - leak * 0.6, whiteSpace: 'nowrap'}}>API_KEY=sk-••••••••••</div>
          {glitch ? [80, 210, 360].map((y, i) => <div key={y} style={{position: 'absolute', left: -20 + random(`g${i}${f}`) * 80, top: y, width: 760, height: 10 + i * 4, background: i % 2 ? '#00E5FF' : '#FF2D55', opacity: 0.7}}/>) : null}
        </div>
      </div>
      <div style={{width: 140, height: 70, margin: '0 auto', background: '#2A2A2A'}}/><div style={{width: 320, height: 18, margin: '0 auto', borderRadius: 9, background: '#2A2A2A'}}/>
    </div>
    {f >= u.stamp ? <div style={{position: 'absolute', top: 430, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${1.6 - 0.6 * stamp}) rotate(-6deg)`, opacity: Math.min(1, stamp * 2)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: RED, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 64, padding: '14px 34px', borderRadius: 14, boxShadow: '0 20px 50px rgba(229,72,77,.45)'}}>
        <svg width={64} height={58} viewBox="0 0 24 22"><path d="M12 1 L23 21 H1 Z" fill="#fff"/><rect x={11} y={7} width={2.4} height={8} fill={RED}/><rect x={11} y={16.5} width={2.4} height={2.4} fill={RED}/></svg>
        KEYS EXPOSED</div></div> : null}
  </AbsoluteFill>;
};

const Grid: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, sweep = ramp(f, u.sweep, u.sweep + 27), flagged = f >= u.flag;
  const pct = f < u.count ? 0 : 26.1 * ease(ramp(f, u.count, u.count + 24));
  return <AbsoluteFill style={{background: BEIGE}}>
    <div style={{position: 'absolute', top: 240, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 28, color: '#8A7F70'}}>{flagged ? 'vulnerability found' : 'scanning 31,132 marketplace skills...'}</div>
    <div style={{position: 'absolute', left: 150, top: 290, width: 780, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12}}>
      {Array.from({length: 24}, (_, i) => {
        const bad = i === 9 && flagged;
        return <div key={i} style={{height: 70, borderRadius: 10, background: bad ? RED : '#fff', border: `2px solid ${bad ? RED : '#D6CCBC'}`, opacity: ramp(n, i, i + 5),
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '0 14px'}}>
          {bad ? <svg width={36} height={32} viewBox="0 0 24 22" style={{alignSelf: 'center'}}><path d="M12 1 L23 21 H1 Z" fill="#fff"/><rect x={11} y={7} width={2.4} height={8} fill={RED}/><rect x={11} y={16.5} width={2.4} height={2.4} fill={RED}/></svg>
            : [70, 90, 50].map(w => <div key={w} style={{height: 5, width: `${w}%`, borderRadius: 3, background: '#E2D8C9'}}/>)}</div>;
      })}
      {sweep > 0 && sweep < 1 ? <div style={{position: 'absolute', left: -10, right: -10, top: `${sweep * 100}%`, height: 6, background: RED, boxShadow: `0 0 24px ${RED}`}}/> : null}
    </div>
    {f >= u.count ? <div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 96, lineHeight: 1, color: RED}}>{pct.toFixed(1)}%</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 30, color: INK, marginTop: 6}}>had at least one vulnerability</div>
      <div style={{display: 'inline-block', marginTop: 10, fontFamily: SANS, fontWeight: 600, fontSize: 22, color: '#6B6256', background: '#F2EBE0', borderRadius: 999, padding: '6px 16px'}}>Liu et al. · arXiv 2601.10338 · Jan 2026</div>
    </div> : null}
  </AbsoluteFill>;
};

const Flip: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const rot = 180 * ease(ramp(f, u.flip, u.flip + 12)), back = rot > 90, pill = pop(f, u.pill);
  const pct = f < u.count ? 0 : 5.2 * ease(ramp(f, u.count, u.count + 20));
  const face = (front: boolean) => <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: front ? '#fff' : '#FFF1F1', border: `3px solid ${front ? '#E7E2DA' : RED}`,
    boxShadow: front ? '0 24px 60px rgba(0,0,0,.12)' : '0 0 80px rgba(229,72,77,.45)', backfaceVisibility: 'hidden', transform: front ? 'none' : 'rotateY(180deg)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
    {front ? <><svg width={120} height={120} viewBox="0 0 24 24"><path d="M13 2 L4 14 h7 l-1 8 9-12 h-7z" fill="#F5B300"/></svg>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>content-writer</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: '#8A7F70'}}>SKILL</div>
      <div style={{fontSize: 40, color: '#F5B300', letterSpacing: 4}}>★★★★★</div>
      <div style={{position: 'absolute', top: -22, right: -22, width: 64, height: 64, borderRadius: 99, background: GREEN, color: '#fff', fontSize: 38, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS}}>✓</div></>
      : <><svg width={150} height={136} viewBox="0 0 24 22"><path d="M12 1 L23 21 H1 Z" fill={RED}/><rect x={11} y={7} width={2.4} height={8} fill="#fff"/><rect x={11} y={16.5} width={2.4} height={2.4} fill="#fff"/></svg>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>content-writer</div>
        <div style={{position: 'absolute', top: -22, right: -22, width: 64, height: 64, borderRadius: 99, background: RED, color: '#fff', fontSize: 40, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS}}>!</div></>}
  </div>;
  return <AbsoluteFill style={{background: '#fff'}}>
    <div style={{position: 'absolute', left: 280, top: 200, width: 520, height: 600, perspective: 1400}}>
      <div style={{position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)`}}>{face(true)}{face(false)}</div>
      {back && f >= u.pill ? <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - pill) * -60}px)`, opacity: Math.min(1, pill * 2)}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff', background: RED, borderRadius: 999, padding: '10px 26px'}}>LIKELY MALICIOUS</div></div> : null}
    </div>
    {f >= u.count ? <div style={{position: 'absolute', top: 840, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 112, lineHeight: 1, color: RED}}>{pct.toFixed(1)}%</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, color: '#6B6256', marginTop: 6}}>high-severity red flags, not confirmed malware</div>
      <div style={{display: 'inline-block', marginTop: 10, fontFamily: SANS, fontWeight: 600, fontSize: 22, color: '#6B6256', background: '#F2EBE0', borderRadius: 999, padding: '6px 16px'}}>Liu et al. · arXiv 2601.10338 · Jan 2026</div>
    </div> : null}
  </AbsoluteFill>;
};

const Nvidia: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const wipe = ease(ramp(f, u.wipe, u.wipe + 12));
  return <AbsoluteFill style={{background: '#000'}}>
    <div style={{position: 'absolute', left: 150, top: 380, width: 780, height: 144, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>
      <Img src={file('nvidia-logo-white.svg')} style={{width: 780, height: 144}}/></div>
  </AbsoluteFill>;
};

const ScreenCard: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, crop = u.cropTop || 0;
  const isDocs = u.src.startsWith('R02');
  const recW = isDocs ? 1620 : 1080, recH = isDocs ? 2322 : 1548;
  const fade = ramp(n, 0, 6), zoomBlur = isDocs ? (1 - ramp(n, 0, 4)) * 12 : 0;
  const push = isDocs ? 1 + 0.3 * ease(ramp(f, u.push, u.push + 12)) : 1 + 0.06 * ramp(n, 0, u.to - u.from);
  const cardW = 980, k = cardW / recW, cardH = Math.min(1160, (recH - crop * (recW / 1080)) * k);
  const bg = <Clip u={u} src={u.src} start={u.srcStart} style={{width: 1080 * 1.25, height: recH * 1080 / recW * 1.25, marginLeft: -135, marginTop: -100, filter: 'blur(20px) brightness(0.45)'}}/>;
  const pop2 = (at: number) => pop(f, at);
  return <AbsoluteFill style={{background: '#0D1117', overflow: 'hidden'}}>
    {bg}
    <div style={{position: 'absolute', left: (1080 - cardW) / 2, top: 236, width: cardW, height: cardH, borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.55)',
      opacity: 0.4 + 0.6 * fade, filter: zoomBlur ? `blur(${zoomBlur}px)` : 'none'}}>
      <div style={{transform: `scale(${push})`, transformOrigin: isDocs ? '0% 30%' : '50% 20%', width: cardW, height: cardH}}>
        <Clip u={u} src={u.src} start={u.srcStart} style={{position: 'absolute', top: -crop * (recW / 1080) * k, width: cardW, height: recH * k}}/></div>
    </div>
    {u.apache ? <div style={{position: 'absolute', right: 70, top: 252, transform: `scale(${pop2(u.apache)})`, fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', background: BLUE, borderRadius: 999, padding: '10px 28px', boxShadow: '0 12px 30px rgba(0,0,0,.4)'}}>Apache-2.0</div> : null}
    {u.claude ? <div style={{position: 'absolute', left: 160, top: 1080, transform: `scale(${pop2(u.claude)})`, width: 320, height: 250, borderRadius: 40, background: '#1F1F1F', boxShadow: '0 20px 50px rgba(0,0,0,.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16}}>
      <Img src={file('claude-code-mascot.png')} style={{width: 180, imageRendering: 'pixelated'}}/>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: '#fff'}}>Claude Code</div></div> : null}
    {u.codex ? <div style={{position: 'absolute', right: 160, top: 1080, transform: `scale(${pop2(u.codex)})`, width: 320, height: 250, borderRadius: 40, background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 96, color: INK, lineHeight: 1}}>&gt;_</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, color: INK}}>Codex</div></div> : null}
  </AbsoluteFill>;
};

const Pipeline: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, cmd = 'skillspector scan ./my-new-skill', typed = cmd.slice(0, Math.max(0, Math.floor((f - u.scan) * 1.6)));
  const passed = f >= u.pass, dot1 = ramp(f, u.scan, u.scan + 12), dot2 = ramp(f, u.reach, u.reach + 10), check = pop(f, u.reach + 10);
  const prog = ramp(f, u.scan + 6, u.pass);
  return <AbsoluteFill style={{background: '#fff'}}>
    <div style={{position: 'absolute', top: 300, left: 40, width: 220, height: 280, borderRadius: 18, background: '#FAF8F4', border: '2px solid #E4DDD0', padding: 18, opacity: ramp(n, 0, 5)}}>
      <svg width={70} height={84} viewBox="0 0 100 120"><path d="M10 6 h56 l24 24 v84 h-80z" fill="#fff" stroke="#C9C1B3" strokeWidth={4}/></svg>
      <div style={{fontFamily: MONO, fontSize: 24, color: INK, marginTop: 10}}>my-new-skill/</div>
      <div style={{fontFamily: MONO, fontSize: 20, color: '#8A7F70', marginTop: 6}}>SKILL.md{'\n'}</div><div style={{fontFamily: MONO, fontSize: 20, color: '#8A7F70'}}>scripts/</div></div>
    <div style={{position: 'absolute', top: 260, left: 300, width: 480, height: 360, borderRadius: 24, background: '#fff', border: `4px solid ${passed ? GREEN : '#E4DDD0'}`,
      boxShadow: passed ? '0 0 60px rgba(48,164,108,.35)' : '0 20px 50px rgba(0,0,0,.08)', padding: 26, opacity: ramp(n, 2, 7)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <svg width={40} height={46} viewBox="0 0 20 23"><path d="M10 1 L19 5 V11 C19 17 14 21 10 22 C6 21 1 17 1 11 V5 Z" fill={passed ? GREEN : '#2A2A2A'}/></svg>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>SkillSpector</div></div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 8}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 20, color: '#8A7F70'}}>powered by</div>
        <Img src={file('nvidia-logo-black.svg')} style={{height: 26}}/></div>
      <div style={{fontFamily: MONO, fontSize: 22, color: INK, background: '#F4F1EA', borderRadius: 10, padding: '10px 12px', marginTop: 18, minHeight: 30}}>$ {typed}</div>
      <div style={{marginTop: 18, height: 12, borderRadius: 6, background: '#EEE9DF', overflow: 'hidden'}}><div style={{width: `${prog * 100}%`, height: '100%', background: passed ? GREEN : BLUE}}/></div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: passed ? GREEN : '#8A7F70', marginTop: 14}}>{passed ? '✓ no red flags found' : f >= u.scan ? 'scanning...' : 'waiting for a skill...'}</div>
    </div>
    <div style={{position: 'absolute', top: 330, left: 820, width: 220, height: 220, borderRadius: 32, background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: ramp(n, 4, 9)}}>
      <div style={{fontFamily: DOTO, fontWeight: 500, fontSize: 46, lineHeight: '50px', color: ORANGE, textAlign: 'center'}}>CLAUDE<br/>CODE</div>
      {f >= u.reach + 10 ? <div style={{position: 'absolute', top: -20, right: -20, width: 64, height: 64, borderRadius: 99, background: GREEN, color: '#fff', fontSize: 38, fontWeight: 900, fontFamily: SANS,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${check})`}}>✓</div> : null}</div>
    <div style={{position: 'absolute', top: 440, left: 262, width: 36, height: 4, background: '#E4DDD0'}}/><div style={{position: 'absolute', top: 440, left: 782, width: 36, height: 4, background: '#E4DDD0'}}/>
    {f >= u.scan && dot1 < 1 ? <div style={{position: 'absolute', top: 432, left: 250 + dot1 * 70, width: 20, height: 20, borderRadius: 99, background: RED}}/> : null}
    {f >= u.reach && dot2 < 1 ? <div style={{position: 'absolute', top: 432, left: 775 + dot2 * 55, width: 20, height: 20, borderRadius: 99, background: GREEN}}/> : null}
  </AbsoluteFill>;
};

const Gauge: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const sweep = f < u.swing ? 0 : f < u.swing + 30 ? 100 * Math.sin(ramp(f, u.swing, u.swing + 30) * Math.PI) : 0;
  const settled = f >= u.safe, score = settled ? D.scans.safe_skill.score : Math.round(sweep);
  const ang = -180 + (settled ? D.scans.safe_skill.score : sweep) * 1.8;
  const arc = (a: number, b: number, color: string) => {
    const p = (v: number) => [280 + 230 * Math.cos(Math.PI * (1 - v / 100)), 290 - 230 * Math.sin(Math.PI * (1 - v / 100))];
    const [x1, y1] = p(a), [x2, y2] = p(b);
    return <path d={`M${x1} ${y1} A230 230 0 0 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={46}/>;
  };
  return <AbsoluteFill style={{background: '#fff'}}>
    <div style={{position: 'absolute', top: 232, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#5E5A52', background: '#F4F1EA', borderRadius: 999, padding: '8px 22px'}}>✓ safe_skill · scanned by SkillSpector · --no-llm</div></div>
    <div style={{position: 'absolute', top: 292, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 6, color: '#8A7F70'}}>RISK SCORE</div>
    <svg width={560} height={330} style={{position: 'absolute', left: 260, top: 330}}>
      {arc(0, 20, GREEN)}{arc(20.5, 50, '#F5A524')}{arc(50.5, 100, RED)}
      <g transform={`rotate(${ang} 280 290)`}><rect x={280} y={284} width={190} height={12} rx={6} fill={INK}/></g><circle cx={280} cy={290} r={22} fill={INK}/>
      <text x={60} y={325} fontFamily="SkInter" fontWeight={700} fontSize={20} fill={GREEN}>LOW</text>
      <text x={235} y={30} fontFamily="SkInter" fontWeight={700} fontSize={20} fill="#C98A10">CAUTION</text>
      <text x={400} y={325} fontFamily="SkInter" fontWeight={700} fontSize={20} fill={RED}>DO NOT INSTALL</text>
    </svg>
    <div style={{position: 'absolute', top: 672, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 90, lineHeight: 1, color: settled ? GREEN : INK}}>
      {score}<span style={{fontSize: 44, color: '#8A7F70'}}>/100</span></div>
    {settled ? <div style={{position: 'absolute', top: 772, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 30, color: GREEN, opacity: ramp(f, u.safe, u.safe + 4)}}>LOW · no red flags found</div> : null}
  </AbsoluteFill>;
};

// ---------------------------------------------------------------- captions and lockups

const CAP: Record<string, [number, 'A' | 'B' | 'C', string]> = {   // kind -> [y centre, style, colour]
  banner: [930, 'A', '#fff'], grid: [930, 'A', INK], nvidia: [930, 'A', '#fff'], pipeline: [930, 'A', INK], gauge: [930, 'A', INK],
  files: [1300, 'B', INK], breach: [1270, 'B', INK], flip: [1270, 'B', INK], screen: [1440, 'B', '#fff'],
  face: [1400, 'A', '#fff'], punch: [1460, 'C', MINT], flash: [1400, 'A', '#fff'], cta: [1160, 'A', '#fff'],
};
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  if (u.kind === 'flash' && f >= u.free) return null;             // the "$ free $" lockup carries it
  if (u.kind === 'cta' && /comment/.test(c.text)) return null;     // the CTA lockup carries it
  const [y, style, color] = CAP[u.kind] || [1400, 'A', '#fff'];
  const p = ease(ramp(f, c.from, c.from + 3));
  const dark = color === '#fff' || color === MINT;
  const base: React.CSSProperties = style === 'B'
    ? {fontFamily: SERIF, fontStyle: 'italic', fontSize: 92, textTransform: 'uppercase', letterSpacing: 1, WebkitTextStroke: `1.4px ${color}`, color}
    : {fontFamily: SANS, fontWeight: 800, fontSize: style === 'C' ? 74 : 66, color, letterSpacing: -0.5};
  return <div style={{position: 'absolute', top: y - 50, left: 30, right: 30, textAlign: 'center', lineHeight: '100px', whiteSpace: 'nowrap', opacity: p, transform: `scale(${0.9 + 0.1 * p})`,
    ...base, textShadow: style === 'C' ? `0 0 26px ${MINT}99, 0 2px 8px #000a` : dark ? '0 3px 14px rgba(0,0,0,.55)' : 'none'}}>{c.text}</div>;
};

const FreeLockup: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  if (u.kind !== 'flash' || f < u.free) return null;
  const p = pop(f, u.free);
  return <div style={{position: 'absolute', top: 1360, left: 0, right: 0, textAlign: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: '#fff', textShadow: '0 3px 14px #000a', marginBottom: -22}}>it's</div>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 124, color: '#76FB93', textShadow: '0 0 28px rgba(118,251,147,.65), 0 3px 10px #0008'}}>$ free $</div></div>;
};

const CtaLockup: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  if (u.kind !== 'cta' || f < u.comment) return null;
  const shrink = ease(ramp(f, u.scan, u.scan + 8)), key = ease(ramp(f, u.scan, u.scan + 6));
  return <div style={{position: 'absolute', top: 1300, left: 0, right: 0, textAlign: 'center'}}>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 120 - 52 * shrink, color: '#fff', textShadow: '0 3px 14px #000a', lineHeight: 1, transform: `translateY(${-40 * shrink}px)`}}>comment</div>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 136, color: '#8BFDF9', opacity: key, textShadow: '0 0 30px rgba(139,253,249,.6), 0 3px 10px #0009', lineHeight: 1.05}}>“SCAN”</div></div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: '#000', fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {FULLFACE.has(u.kind) ? <FullFace u={u} f={f}/> : null}
    {u.kind === 'banner' ? <Banner u={u} f={f}/> : null}
    {u.kind === 'files' ? <Files u={u} f={f}/> : null}
    {u.kind === 'breach' ? <Breach u={u} f={f}/> : null}
    {u.kind === 'grid' ? <Grid u={u} f={f}/> : null}
    {u.kind === 'flip' ? <Flip u={u} f={f}/> : null}
    {u.kind === 'nvidia' ? <Nvidia u={u} f={f}/> : null}
    {u.kind === 'screen' ? <ScreenCard u={u} f={f}/> : null}
    {u.kind === 'pipeline' ? <Pipeline u={u} f={f}/> : null}
    {u.kind === 'gauge' ? <Gauge u={u} f={f}/> : null}
    {SPLITS[u.kind] ? <SplitFace/> : null}
    <Captions f={f} u={u}/>
    <FreeLockup u={u} f={f}/>
    <CtaLockup u={u} f={f}/>
  </AbsoluteFill>;
};
