// COURSE reel (job 593b74fe4824, comment keyword COURSE): Andrew Ng's free-to-audit Agentic AI course on DeepLearning.AI.
// Voice-over edit after the replication spec (analysis/spec.md): line-art hook, real course-page recordings under a seam
// headline, a name card, five faceless module cards, the details card, a comment-keyword end card. Every time below is a
// spoken-word time from the recorded narration (voice/words.json), in seconds. Every figure on screen was read on the live
// course page on 14 Nov 2026 (9h55m, 31 Video Lessons = 170 min of video, 8 Graded Assignments PRO).
// Presenter: optional. With `avatar` (a video under the public dir whose time 0 = narration 0 for SLOTS.hook and which
// continues with SLOTS.ending) beats 1-3 and 10 become split screens, beat 4 and the CTA show the face; without it every
// slot uses a full-frame motion-graphic or screen-recording variant.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type CourseProps = {words: Word[]; avatar?: string; avatarTop?: number; avatarTone?: string};
// Presenter slots in narration seconds, cut in the pauses: window A = beats 1-4 (to "You'll keep up."), B = beats 10-11.
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 15.46], ending: [42.6, 51.15]};

const FPS = 30, ACC = '#2F8CFF', RED = '#FF5A4E', INK = '#0C0C0C', GREY = '#8D929B', RULE = '#3A3D44', TXT = '#F2F4F8';
const ui = 'Inter', mono = 'JetBrains Mono';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const eio = (n: number) => { const x = cl(n); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.32) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.0; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const mapT = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};
// Blur + fade in over 0.2 s from `at` (at < 0: already on, e.g. the hook on frame 0).
const fade = (t: number, at: number): React.CSSProperties => { if (at < 0) return {}; const p = eo(pr(t, at, 0.2)); return {opacity: p, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined}; };
// Estimated width in em of Inter 800, slightly generous, to keep a centred line inside x 130-950.
const em = (s: string) => { let u = 0; for (const c of s) u += c === ' ' ? 0.27 : '.,:;\'!|'.includes(c) ? 0.31 : '()'.includes(c) ? 0.37 : c === '→' ? 0.95
  : /[A-Z]/.test(c) ? ('MW'.includes(c) ? 0.94 : 'IJ'.includes(c) ? 0.35 : 0.73) : /[0-9~+=?]/.test(c) ? 0.66 : 'mw'.includes(c) ? 0.92 : 'iljtf'.includes(c) ? 0.35 : 0.61; return u; };
const fit = (s: string, size: number, maxW: number) => Math.min(size, maxW / em(s));

// Cut points (hard cuts, each just before the first word of a clause).
const C = {s2: 2.98, s3: 4.85, s4: 6.06, s5: 8.12, s6: 10.0, s7: 13.05, s8: 15.46, s9: 16.88, s10: 22.88, s11: 27.25, s12: 32.76, s13: 38.55,
  s14: SLOTS.ending[0], s15: 47.52, s16: 47.85, s17: 48.95};

// ------------------------------------------------------------------ shared pieces
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number}>> = ({s, e, z, children}) => {
  const t = useT(); if (t < s || t >= e) return null;
  return <AbsoluteFill style={{zIndex: z, overflow: 'hidden'}}>{children}</AbsoluteFill>;
};
const Grain: React.FC<{id: string; h?: number}> = ({id, h = 1920}) => <svg width={1080} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: 0.08, mixBlendMode: 'screen'}}>
  <filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
  <rect width="100%" height="100%" filter={`url(#${id})`} /></svg>;
const CardBg: React.FC<{id: string}> = ({id}) => <AbsoluteFill style={{background: 'radial-gradient(80% 55% at 50% 42%,#232323,#0C0C0C 100%)'}}><Grain id={id} /></AbsoluteFill>;
const Tick: React.FC<{size: number; color?: string; ink?: string}> = ({size, color = ACC, ink = '#fff'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
  <circle cx="12" cy="12" r="11" fill={color} /><path d="M6.6 12.4l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Cross: React.FC<{size: number; p?: number}> = ({size, p = 1}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
  <path d="M5 5L19 19" stroke={RED} strokeWidth="3.2" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - cl(p * 2)} />
  <path d="M19 5L5 19" stroke={RED} strokeWidth="3.2" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - cl(p * 2 - 1)} /></svg>;
// One real recording (1080x960 file) in the 1080x960 panel; `vt` is the time inside the file, set by a time map so each
// highlight lands on its spoken word.
// Without a presenter the panel is an 880 px window (y 232-1112) over the file, moved by `oy`, so the headline below it
// never lands on page text; with a presenter it is a 684 px window at y 226-910 (no page text above y 220) over the seam.
type Win = {y: number; h: number; oy: number};
const Rec: React.FC<React.PropsWithChildren<{name: string; vt: number; win: Win; zoom?: number; fx?: number; fy?: number}>> = ({name, vt, win, zoom = 1, fx = 540, fy = 480, children}) =>
  <div style={{position: 'absolute', left: 0, top: win.y, width: 1080, height: win.h, overflow: 'hidden', background: '#1b1060'}}>
    <div style={{position: 'absolute', left: 0, top: -win.oy, width: 1080, height: 960}}>
      <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, transform: `scale(${zoom})`, transformOrigin: `${fx}px ${fy}px`}} /></Freeze>
      {children}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, background: `linear-gradient(transparent,${INK})`}} />
  </div>;

// ------------------------------------------------------------------ seam headline (keyword line on the split shots)
type Seg = [string, string, number?];   // text, colour, appear time (default: the item's start)
type HL = {s: number; e: number; small?: string; smallAt?: number; big: Seg[]; size?: number; below?: string; belowAt?: number; belowColor?: string; belowSize?: number; icon?: string; tickAt?: number};
const Headline: React.FC<{items: HL[]; seam: number; band: boolean}> = ({items, seam, band}) => {
  const t = useT(), it = items.find(h => t >= h.s && t < h.e); if (!it) return null;
  const text = it.big.map(b => b[0]).join(''), size = fit(text + (it.icon ? 'MM' : '') + (it.tickAt !== undefined ? 'MM' : ''), it.size ?? 97, 800);
  const bigTop = 194 - size * 0.56, bs = it.belowSize ?? 34;
  return <div style={{position: 'absolute', left: 0, right: 0, top: seam - 190, height: 380, zIndex: 40}}>
    {band && <div style={{position: 'absolute', left: 0, right: 0, top: 50, height: 280, background: 'linear-gradient(transparent,#000000cc 30%,#000000cc 70%,transparent)'}} />}
    {it.small && <div style={{position: 'absolute', left: 0, right: 0, top: bigTop - 54, textAlign: 'center', fontFamily: ui, fontWeight: 700, fontSize: 40, lineHeight: '50px', color: '#fff', ...fade(t, it.smallAt ?? it.s)}}>{it.small}</div>}
    <div style={{position: 'absolute', left: 0, right: 0, top: bigTop, height: size * 1.12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size * 0.2, fontFamily: ui, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -1, whiteSpace: 'nowrap'}}>
      {it.icon && <Img src={A(it.icon)} style={{width: size * 0.86, height: size * 0.86, ...fade(t, it.big[0][2] ?? it.s)}} />}
      <span>{it.big.map(([x, c, at], k) => <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', color: c, ...fade(t, at ?? it.s)}}>{x}</span>)}</span>
      {it.tickAt !== undefined && <div style={{transform: `scale(${pop(t, it.tickAt)})`}}><Tick size={size * 0.8} /></div>}
    </div>
    {it.below && <div style={{position: 'absolute', left: 0, right: 0, top: bigTop + size * 1.12 + 8, textAlign: 'center', fontFamily: ui, fontWeight: bs > 40 ? 800 : 600, fontSize: bs, lineHeight: 1.2,
      color: it.belowColor ?? '#dfe3ea', ...fade(t, it.belowAt ?? it.s)}}>{it.below}</div>}
  </div>;
};

// ------------------------------------------------------------------ beat 1: the line-art hook (prompts -> AI agents)
const FS = 1.5;
const Figure: React.FC<{x: number; y: number; happy: boolean}> = ({x, y, happy}) => <g transform={`translate(${x} ${y}) scale(${FS})`} stroke="#E9EAEC" strokeWidth={4.5} strokeLinecap="round" fill="none">
  <circle cx={0} cy={-136} r={26} /><path d="M0 -110V-56M0 -56L-22 0M0 -56L22 0" />
  <path d={happy ? 'M0 -96L-38 -142M0 -96L38 -142' : 'M0 -96L-28 -60M0 -96L28 -60'} />
  <circle cx={-9} cy={-140} r={2.6} fill="#E9EAEC" stroke="none" /><circle cx={9} cy={-140} r={2.6} fill="#E9EAEC" stroke="none" />
  <path d={happy ? 'M-11 -127Q0 -114 11 -127' : 'M-10 -121Q0 -130 10 -121'} strokeWidth={3.5} /></g>;
const HookArt: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => {
  const t = useT(), curve = eo(pr(t, 1.66, 0.8)), hop = eo(pr(t, 2.16, 0.45)), gone = 1 - pr(t, 2.16, 0.2), rays = eo(pr(t, 2.55, 0.32));
  const fx = lerp(250, 860, hop), fy = lerp(556, 262, hop) - Math.sin(hop * Math.PI) * 150, label = eo(pr(t, 0.72, 0.25)), hx = 860, hy = 262 - 136 * FS;
  return <svg width={w} height={h} viewBox="0 -60 1000 700" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', left: x, top: y}}>
    <path d="M120 40V560H940" stroke="#4A4C52" strokeWidth={4} fill="none" strokeLinecap="round" />
    {curve > 0.003 && <path d="M130 548C430 540 700 450 860 262" stroke={ACC} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - curve} />}
    <g opacity={gone}>
      <path d="M196 262a30 30 0 0 1 11-55a42 42 0 0 1 78-8a30 30 0 0 1 14 63z" fill="none" stroke="#A3A6AD" strokeWidth={4.5} strokeLinejoin="round" />
      {[0, 1, 2].map(i => { const d = ((t * 1.7 + i * 0.37) % 1) * 18; return <path key={i} d={`M${222 + i * 28} ${268 + d}l-6 16`} stroke={ACC} strokeWidth={4.5} strokeLinecap="round" opacity={1 - d / 24} />; })}
      <text x={330} y={360} fontFamily={ui} fontWeight={800} fontSize={96} fill={ACC}>?</text>
    </g>
    <text x={250} y={614} textAnchor="middle" fontFamily={ui} fontWeight={600} fontSize={42} fill="#9A9DA4" opacity={label * gone}>chatbot prompts</text>
    {rays > 0 && Array.from({length: 9}, (_, i) => { const a = (i / 9) * Math.PI * 2 + t * 0.6, r1 = 62 + 8 * rays, r2 = 62 + 44 * rays;
      return <path key={i} d={`M${hx + Math.cos(a) * r1} ${hy + Math.sin(a) * r1}L${hx + Math.cos(a) * r2} ${hy + Math.sin(a) * r2}`} stroke={ACC} strokeWidth={6} strokeLinecap="round" opacity={rays} />; })}
    <Figure x={fx} y={fy} happy={hop > 0.55} />
    <text x={740} y={150} textAnchor="end" fontFamily={ui} fontWeight={800} fontSize={60} fill={ACC} style={fade(t, 2.4)}>AI agents</text>
  </svg>;
};
const HookScene: React.FC<{face: boolean}> = ({face}) => <><CardBg id="g-hook" />
  <div style={{position: 'absolute', left: 0, right: 0, top: 296, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 100, lineHeight: '100px', letterSpacing: -2, color: '#fff', whiteSpace: 'nowrap'}}>AGENTIC <span style={{color: ACC}}>AI</span></div>
  {face ? <HookArt x={40} y={404} w={1000} h={470} /> : <HookArt x={25} y={422} w={1030} h={720} />}</>;

// ------------------------------------------------------------------ beat 3: colour card and name card
const ColourCard: React.FC<{tone: string}> = ({tone}) => {
  const t = useT();
  return <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 40%,${tone},#0a1124 100%)`}}><Grain id="g-col" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 150, lineHeight: '160px', letterSpacing: -4, color: '#fff'}}>Agentic AI</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 780, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 72, lineHeight: '86px', color: '#fff', ...fade(t, 6.52)}}>on <span style={{color: '#5AA5FF'}}>DeepLearning.AI</span></div>
  </AbsoluteFill>;
};
const NameBox: React.FC<{y: number; at: number; off: number; role: string; org: string}> = ({y, at, off, role, org}) => {
  const t = useT(), d = eo(pr(t, at, 0.36)), on = t >= at && t < off, c = on ? ACC : '#fff', hs = pop(t, at + 0.26, 0.24);
  if (t < at) return null;
  const X = 190, W = 700, H = 190;
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={X} y={y} width={W} height={H} fill="none" stroke={on ? ACC : '#9EA2AA'} strokeWidth={3.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - d} />
      {[[X, y], [X + W, y], [X, y + H], [X + W, y + H]].map(([cx, cy], i) => <rect key={i} x={cx - 9} y={cy - 9} width={18} height={18} fill={INK} stroke={on ? ACC : '#9EA2AA'} strokeWidth={3.5}
        transform={`translate(${cx} ${cy}) scale(${hs}) translate(${-cx} ${-cy})`} />)}
    </svg>
    <div style={{position: 'absolute', left: X, width: W, top: y + 22, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 40, lineHeight: '48px', color: GREY, ...fade(t, at + 0.1)}}>{role}</div>
    <div style={{position: 'absolute', left: X, width: W, top: y + 74, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 76, lineHeight: '88px', color: c, letterSpacing: -1, ...fade(t, at + 0.1)}}>{org}</div>
  </>;
};
const NameCard: React.FC = () => {
  const t = useT();
  return <><CardBg id="g-name" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 140, lineHeight: '160px', color: '#fff', letterSpacing: -3, ...fade(t, C.s6)}}>Andrew Ng</div>
    <NameBox y={706} at={10.22} off={11.54} role="founder" org="DeepLearning.AI" />
    <NameBox y={952} at={11.54} off={99} role="co-founder" org="Coursera" />
  </>;
};

// ------------------------------------------------------------------ beat 4: the five-module list
const MODS = ['agentic workflows', 'reflection', 'tool use', 'evals', 'planning & multi-agent'];
const Brackets: React.FC<{x: number; y: number; w: number; h: number; color?: string}> = ({x, y, w, h, color = '#5B5F67'}) => {
  const L = 26;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}><path fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="square"
    d={`M${x} ${y + L}V${y}H${x + L}M${x + w - L} ${y}H${x + w}V${y + L}M${x + w} ${y + h - L}V${y + h}H${x + w - L}M${x + L} ${y + h}H${x}V${y + h - L}`} /></svg>;
};
const ListCard: React.FC = () => {
  const t = useT();
  return <><CardBg id="g-list" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 372, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 124, lineHeight: '136px', color: '#fff', letterSpacing: -3, ...fade(t, 15.74)}}><span style={{color: ACC}}>5</span> modules</div>
    {MODS.map((m, i) => { const at = 15.86 + i * 0.1, p = eo(pr(t, at, 0.16)), y = 576 + i * 150; if (p <= 0) return null;
      return <div key={m} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: p, transform: `translateY(${(1 - p) * 26}px)`}}>
        <Brackets x={130} y={y} w={820} h={122} />
        <div style={{position: 'absolute', left: 178, top: y + 35, fontFamily: mono, fontWeight: 700, fontSize: 46, lineHeight: '52px', color: ACC}}>{String(i + 1).padStart(2, '0')}</div>
        <div style={{position: 'absolute', left: 278, top: y + 30, fontFamily: ui, fontWeight: 600, fontSize: 54, lineHeight: '62px', color: '#fff', whiteSpace: 'nowrap'}}>{m}</div>
      </div>; })}
  </>;
};

// ------------------------------------------------------------------ beats 5-9: the module cards (content fills y 400-1380)
const Header: React.FC<{n: string; at: number; titleAt: number; children: React.ReactNode}> = ({n, at, titleAt, children}) => {
  const t = useT();
  return <>
    <div style={{position: 'absolute', left: 140, top: 300, fontFamily: mono, fontWeight: 700, fontSize: 54, lineHeight: '64px', color: ACC, ...fade(t, at)}}>{n}</div>
    <div style={{position: 'absolute', left: 236, top: 296, fontFamily: ui, fontWeight: 600, fontSize: 58, lineHeight: '70px', color: TXT, letterSpacing: -0.5, whiteSpace: 'nowrap', ...fade(t, titleAt)}}>{children}</div>
    <div style={{position: 'absolute', left: 140, top: 388, width: 800 * eo(pr(t, at, 0.4)), height: 3, background: RULE}} />
  </>;
};
const Label: React.FC<{x: number; y: number; at: number; size?: number; color?: string; w?: number; align?: 'left' | 'center' | 'right'; weight?: number; children: React.ReactNode}> = ({x, y, at, size = 40, color = TXT, w, align = 'center', weight = 600, children}) => {
  const t = useT();
  return <div style={{position: 'absolute', left: w ? x - (align === 'center' ? w / 2 : align === 'right' ? w : 0) : x, top: y, width: w, textAlign: align, fontFamily: ui, fontWeight: weight, fontSize: size, lineHeight: 1.2, color, whiteSpace: 'nowrap', ...fade(t, at)}}>{children}</div>;
};
const Pill: React.FC<{x: number; y: number; at: number; w: number; children: React.ReactNode}> = ({x, y, at, w, children}) => {
  const t = useT();
  return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${pop(t, at, 0.3)})`, transformOrigin: '100% 50%'}}>
    <div style={{width: w, textAlign: 'center', border: `3px solid ${ACC}`, color: ACC, borderRadius: 32, fontFamily: ui, fontWeight: 800, fontSize: 34, lineHeight: '58px'}}>{children}</div></div>;
};
const Card01: React.FC = () => {
  const t = useT(), arc = eo(pr(t, 17.62, 0.34)), ang = Math.PI - (Math.PI * 0.86) * eio(pr(t, 19.5, 1.2)), cx = 540, cy = 900, r = 300;
  const big = pop(t, 20.76), split = eo(pr(t, 21.78, 0.16)), nd = eo(pr(t, 19.12, 0.15));
  return <><CardBg id="g-c1" /><Header n="01" at={16.95} titleAt={17.05}>agentic workflows</Header>
    <Label x={540} y={462} w={900} at={19.12} size={54} weight={700}>how much freedom?</Label>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {arc > 0.003 && <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#55585F" strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - arc} />}
      {Array.from({length: 7}, (_, i) => { const a = Math.PI - (i / 6) * Math.PI; return <path key={i} d={`M${cx + Math.cos(a) * (r - 44)} ${cy - Math.sin(a) * (r - 44)}L${cx + Math.cos(a) * (r - 26)} ${cy - Math.sin(a) * (r - 26)}`} stroke="#6B6E75" strokeWidth={5} strokeLinecap="round" opacity={eo(pr(t, 18.2 + i * 0.04, 0.2))} />; })}
      {nd > 0 && <><path d={`M${cx} ${cy}L${cx + Math.cos(ang) * (r - 66)} ${cy - Math.sin(ang) * (r - 66)}`} stroke={ACC} strokeWidth={12} strokeLinecap="round" opacity={nd} />
        <circle cx={cx} cy={cy} r={20} fill={ACC} opacity={nd} /></>}
    </svg>
    <Label x={250} y={928} w={200} at={18.24} size={42} color={GREY}>low</Label>
    <Label x={830} y={928} w={200} at={18.36} size={42} color={GREY}>high</Label>
    {big > 0 && split < 1 && <div style={{position: 'absolute', left: 330, top: 1040, width: 420, height: 140, border: '3.5px solid #fff', borderRadius: 22, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ui, fontWeight: 700, fontSize: 60, color: '#fff', transform: `scale(${big * (1 - 0.3 * split)})`, opacity: 1 - split}}>big job</div>}
    {[0, 1, 2, 3].map(i => { const p = pop(t, 21.82 + i * 0.1, 0.28), last = i === 3 && t >= 22.04; if (p <= 0) return null;
      return <div key={i} style={{position: 'absolute', left: 120 + i * 205, top: 1020 + i * 88, width: 200, height: 100, borderRadius: 16, border: `3.5px solid ${last ? ACC : '#C9CCD2'}`, background: last ? ACC : 'transparent', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 700, fontSize: 44, color: '#fff', transform: `scale(${p})`}}>step {i + 1}</div>; })}
  </>;
};
const DW = 330, DH = 440;
const Doc: React.FC<{x: number; y: number; at: number; color: string; lines: string[]}> = ({x, y, at, color, lines}) => {
  const t = useT(), d = eo(pr(t, at, 0.36));
  if (t < at) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <path d={`M${x} ${y}H${x + DW - 64}L${x + DW} ${y + 64}V${y + DH}H${x}Z M${x + DW - 64} ${y}V${y + 64}H${x + DW}`} fill="#ffffff08" stroke={color} strokeWidth={4.5} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - d} />
    {lines.map((c, i) => { const p = eo(pr(t, at + 0.12 + i * 0.05, 0.2)), w = [200, 240, 180, 230, 150][i];
      return <rect key={i} x={x + 44} y={y + 110 + i * 62} width={w * p} height={16} rx={8} fill={c} />; })}
  </svg>;
};
const Card02: React.FC = () => {
  const t = useT(), arrow = eo(pr(t, 26.22, 0.3)), badge = pop(t, 26.68, 0.3), Y = 560;
  return <><CardBg id="g-c2" /><Header n="02" at={22.95} titleAt={23.08}>reflection</Header>
    <Label x={285} y={470} w={460} at={24.86} size={48} color={RED} weight={700}>checks itself</Label>
    <Doc x={120} y={Y} at={23.62} color="#D6D8DC" lines={['#6A6D74', '#6A6D74', '#6A6D74', '#6A6D74', '#6A6D74']} />
    {[[24.78, 1], [25.16, 3]].map(([at, i]) => { const p = pr(t, at, 0.22); if (p <= 0) return null;
      return <div key={i} style={{position: 'absolute', left: 382, top: Y + 110 + i * 62 - 28, transform: `scale(${1 + 0.4 * (1 - eo(p))})`}}><Cross size={72} p={p} /></div>; })}
    <Label x={285} y={1028} w={300} at={25.64} size={48}>draft</Label>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {arrow > 0.003 && <path d="M468 760Q546 610 624 760" fill="none" stroke={ACC} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - arrow} />}
      {arrow >= 1 && <path d="M600 726L626 764L582 760" fill="none" stroke={ACC} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
    <Doc x={630} y={Y} at={26.36} color={ACC} lines={[ACC, ACC, ACC, ACC, ACC]} />
    {badge > 0 && <div style={{position: 'absolute', left: 870, top: Y - 44, transform: `scale(${badge})`}}><Tick size={90} /></div>}
    <Label x={795} y={1028} w={340} at={26.5} size={48} color={ACC} weight={700}>improved</Label>
  </>;
};
const NR = 104;
const Node: React.FC<{x: number; y: number; at: number; children: React.ReactNode}> = ({x, y, at, children}) => {
  const t = useT(), s = pop(t, at, 0.3); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: x - NR, top: y - NR, width: NR * 2, height: NR * 2, borderRadius: NR, border: '3.5px solid #D6D8DC', background: '#17181c', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`}}>{children}</div>;
};
const Wire: React.FC<{x1: number; y1: number; x2: number; y2: number; at: number}> = ({x1, y1, x2, y2, at}) => {
  const t = useT(), d = eo(pr(t, at, 0.28)); if (d <= 0) return null;
  const k = ((t - at) * 0.9) % 1;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <path d={`M${x1} ${y1}L${lerp(x1, x2, d)} ${lerp(y1, y2, d)}`} stroke="#6B6E75" strokeWidth={5} strokeDasharray="12 12" />
    {d >= 1 && <circle cx={lerp(x1, x2, k)} cy={lerp(y1, y2, k)} r={11} fill={ACC} />}
  </svg>;
};
const Card03: React.FC = () => {
  const t = useT(), chip = pop(t, 28.04, 0.32);
  return <><CardBg id="g-c3" /><Header n="03" at={27.3} titleAt={27.42}>tool use</Header>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>{[[240, 590], [840, 590], [540, 1170]].map(([x, y], i) =>
      <circle key={i} cx={x} cy={y} r={NR - 2} fill="none" stroke="#4A4D54" strokeWidth={3.5} strokeDasharray="10 12" opacity={eo(pr(t, 27.62 + i * 0.08, 0.25))} />)}</svg>
    <Wire x1={540} y1={880} x2={240} y2={590} at={28.96} /><Wire x1={540} y1={880} x2={840} y2={590} at={30.12} /><Wire x1={540} y1={880} x2={540} y2={1170} at={31.26} />
    <Node x={240} y={590} at={29.1}><svg width={112} height={112} viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth={1.6}><circle cx="12" cy="12" r="9.5" /><ellipse cx="12" cy="12" rx="4.2" ry="9.5" /><path d="M2.5 12h19M4 7h16M4 17h16" /></svg></Node>
    <Label x={240} y={712} w={300} at={29.22} size={50} weight={700}>APIs</Label>
    <Node x={840} y={590} at={30.2}><span style={{fontFamily: mono, fontWeight: 700, fontSize: 64, color: ACC}}>{'</>'}</span></Node>
    <Label x={840} y={712} w={320} at={30.3} size={50} weight={700}>run code</Label>
    <Node x={540} y={1170} at={31.32}><Img src={A('mcp-white.svg')} style={{width: 112, height: 112}} /></Node>
    <Label x={540} y={1290} w={420} at={31.82} size={50} weight={700} color={ACC}>MCP intro</Label>
    {chip > 0 && <div style={{position: 'absolute', left: 410, top: 800, width: 260, height: 160, borderRadius: 38, background: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ui, fontWeight: 900, fontSize: 88, color: '#fff', transform: `scale(${chip})`, boxShadow: `0 0 70px ${ACC}66`}}>AI</div>}
  </>;
};
const ROWS4: [string, number, boolean][] = [['search step', 35.6, true], ['summarize step', 35.82, true], ['tool call', 36.3, false], ['final answer', 36.55, true]];
const CostBox: React.FC<{x: number; at: number; label: string}> = ({x, at, label}) => {
  const t = useT(), d = eo(pr(t, at, 0.3)), shrink = eio(pr(t, at + 0.2, 0.55)), bh = 190 - 120 * shrink; if (d <= 0) return null;
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <rect x={x} y={990} width={340} height={340} fill="none" stroke="#9EA2AA" strokeWidth={3.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - d} />
      <rect x={x + 92} y={1300 - bh} width={96} height={bh} fill={ACC} opacity={d} />
      <path d={`M${x + 254} ${1110}V${1280}M${x + 228} ${1252}L${x + 254} ${1284}L${x + 280} ${1252}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={eo(pr(t, at + 0.2, 0.2))} />
    </svg>
    <Label x={x + 170} y={1010} w={300} at={at} size={50} weight={700}>{label}</Label>
  </>;
};
const Card04: React.FC = () => {
  const t = useT(), ev = t >= 34.72, evs = 1 + 0.18 * (ev ? 1 - eo(pr(t, 34.72, 0.3)) : 0);
  return <><CardBg id="g-c4" /><Header n="04" at={32.84} titleAt={32.9}><span style={{display: 'inline-block', color: ev ? ACC : TXT, transform: `scale(${evs})`, transformOrigin: '0 60%'}}>evals</span>: test your agent</Header>
    <Pill x={620} y={414} at={33.46} w={320}>my must-watch</Pill>
    {ROWS4.map(([name, at, ok], i) => { const y = 510 + i * 110, show = eo(pr(t, 32.92 + i * 0.08, 0.2)), done = t >= at, bad = !ok && done;
      return <div key={name} style={{position: 'absolute', left: 0, top: 0, opacity: show}}>
        <div style={{position: 'absolute', left: 150, top: y, fontFamily: ui, fontWeight: 600, fontSize: 52, lineHeight: '64px', color: bad ? RED : TXT, whiteSpace: 'nowrap'}}>{name}</div>
        <div style={{position: 'absolute', left: 860, top: y + 2}}>{!done ? <div style={{width: 60, height: 60, borderRadius: 30, border: '3.5px solid #55585F', boxSizing: 'border-box'}} />
          : ok ? <div style={{transform: `scale(${pop(t, at, 0.28)})`}}><Tick size={60} /></div> : <Cross size={60} p={pr(t, at, 0.2)} />}</div>
      </div>; })}
    <Label x={420} y={738} at={36.36} size={42} color={RED} align="left" weight={700}>{'← breaks here'}</Label>
    <CostBox x={150} at={37.12} label="cost" /><CostBox x={590} at={37.82} label="lag" />
  </>;
};
const AS = 1.4;
const Agent: React.FC<{x: number; at: number; name: string}> = ({x, at, name}) => {
  const t = useT(), s = pop(t, at, 0.3) * AS; if (s <= 0) return null;
  return <><svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <g transform={`translate(${x} 1010) scale(${s}) translate(${-x} -950)`} stroke="#E9EAEC" strokeWidth={4} strokeLinecap="round" fill="none">
      <circle cx={x} cy={842} r={22} /><path d={`M${x} 864V912M${x} 912L${x - 18} 950M${x} 912L${x + 18} 950M${x} 878L${x - 22} 904M${x} 878L${x + 22} 904`} /></g></svg>
    <Label x={x} y={1030} w={300} at={at} size={46} weight={700}>{name}</Label></>;
};
const Bubble: React.FC<{x: number; at: number}> = ({x, at}) => {
  const t = useT(), s = pop(t, at, 0.3); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: x - 66, top: 780, width: 132, height: 76, borderRadius: 22, border: '3.5px solid #D6D8DC', background: '#17181c', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transform: `scale(${s})`}}>
    {[0, 1, 2].map(i => <div key={i} style={{width: 13, height: 13, borderRadius: 7, background: '#fff', opacity: 0.4 + 0.6 * (Math.floor(t * 6 + i) % 3 === 0 ? 1 : 0)}} />)}</div>;
};
const Card05: React.FC = () => {
  const t = useT(), ghost = eo(pr(t, 39.3, 0.3)), pl = t >= 40.16, plk = 1 + 0.08 * (pl ? 1 - eo(pr(t, 40.16, 0.3)) : 0), talk = t >= 41.62;
  return <><CardBg id="g-c5" /><Header n="05" at={38.62} titleAt={38.7}>planning & multi-agent</Header>
    <Pill x={700} y={414} at={39.24} w={240}>advanced</Pill>
    <div style={{position: 'absolute', left: 340, top: 520, width: 400, height: 136, border: `3.5px ${pl ? 'solid' : 'dashed'} ${pl ? ACC : '#5B5F67'}`, borderRadius: 14, boxSizing: 'border-box', opacity: ghost, transform: `scale(${plk})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 800, fontSize: 60, color: ACC}}>{pl && <span style={fade(t, 40.16)}>planner</span>}</div>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {[[220, 40.8], [540, 40.96], [860, 41.12]].map(([x, at]) => { const d = eo(pr(t, at, 0.25)); return d > 0 && <path key={x} d={`M540 656L${lerp(540, x, d)} ${lerp(656, 846, d)}`} stroke="#6B6E75" strokeWidth={4} />; })}
      {talk && [[250, 510], [570, 830]].map(([a, b], i) => { const k = ((t - 41.62) * 0.8 + i * 0.5) % 1, x = i ? lerp(b, a, k) : lerp(a, b, k);
        return <g key={i}><path d={`M${a} 960H${b}`} stroke={ACC} strokeWidth={3.5} opacity={0.6} /><circle cx={x} cy={960} r={11} fill={ACC} /></g>; })}
    </svg>
    <Agent x={220} at={40.8} name="research" /><Agent x={540} at={40.96} name="code" /><Agent x={860} at={41.12} name="review" />
    <Bubble x={380} at={41.62} /><Bubble x={700} at={41.8} />
    <Label x={540} y={1190} w={900} at={41.9} size={58} weight={800} color={ACC}>agents talk to each other</Label>
  </>;
};

// ------------------------------------------------------------------ beats 10-11: details card, whip, comment-keyword end card
const DetailsShot: React.FC<{win: Win}> = ({win}) => {
  const t = useT(), vt = mapT(t, [[42.6, 0.5], [43.72, 0.56], [44.0, 0.85], [45.05, 2.55], [45.4, 2.95], [47.52, 5.2]]), pill = pop(t, 43.92, 0.3) * (1 - pr(t, 45.12, 0.12));
  return <Rec name="r4_details_card" vt={vt} win={win} zoom={1 + 0.03 * pr(t, 42.6, 4.9)} fx={0} fy={320}>
    {pill > 0 && <div style={{position: 'absolute', left: 672, top: 284, transform: `scale(${pill})`, transformOrigin: '0 50%'}}>
      <div style={{background: ACC, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 42, lineHeight: '70px', padding: '0 24px', borderRadius: 35, whiteSpace: 'nowrap', boxShadow: '0 8px 24px #0006'}}>= 2 h 50 min</div></div>}
  </Rec>;
};
const Avatar: React.FC<{src: string; top: number; scale?: number}> = ({src, top, scale = 1}) => {
  const t = useT(), a = t < SLOTS.ending[0] ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
  return <Freeze frame={Math.round(a * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover', transform: `scale(${scale})`, transformOrigin: '50% 40%'}} /></Freeze>;
};
const COMMENT = 'COURSE';
const EndCard: React.FC<{avatar?: string; faceY: number}> = ({avatar, faceY}) => {
  const t = useT(), s0 = avatar ? C.s17 : C.s16, k = eio(pr(t, s0, 0.4)), foot = eo(pr(t, s0 + 0.2, 0.3));
  const IX = 43, IY = 236, IW = 994, IH = 640, sc = lerp(1, avatar ? IW / 1080 : 0.72, k), inLeft = avatar ? 0 : lerp(0, (IW - 1080 * 0.72) / 2, k);
  const typeAt = Math.max(48.34, s0 + 0.3), typed = COMMENT.slice(0, Math.floor(pr(t, typeAt, 0.5) * (COMMENT.length + 0.99))), sent = typeAt + 0.56;
  const ell = eo(pr(t, typeAt + 0.06, 0.5)), dm = eo(pr(t, Math.max(49.3, s0 + 0.5), 0.36)), link = eo(pr(t, Math.max(49.64, s0 + 0.7), 0.25));
  const inTop = avatar ? lerp(0, -(faceY * sc - IH * 0.46), k) : lerp(0, -262 * 0.72, k);
  return <><AbsoluteFill style={{background: INK}}><Grain id="g-end" /></AbsoluteFill>
    <div style={{position: 'absolute', left: lerp(0, IX, k), top: lerp(0, IY, k), width: lerp(1080, IW, k), height: lerp(1920, IH, k), borderRadius: 36 * k, overflow: 'hidden', background: INK, boxShadow: k > 0 ? '0 0 0 2px #2a2d33' : undefined}}>
      <div style={{position: 'absolute', left: inLeft, top: inTop, width: 1080, height: 1920, transform: `scale(${sc})`, transformOrigin: '0 0'}}>
        {avatar ? <Avatar src={avatar} top={0} /> : <Freeze frame={Math.round(2.97 * FPS)}><HookScene face={false} /></Freeze>}
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: foot, transform: `translateY(${(1 - foot) * 40}px)`}}>
      <div style={{position: 'absolute', left: 60, top: 898, display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 78, height: 78, borderRadius: 39, padding: 4, background: `conic-gradient(${ACC},#7cc0ff,${ACC})`}}><Img src={A('avatar_thumb.jpg')} style={{width: 70, height: 70, borderRadius: 35, objectFit: 'cover', border: `3px solid ${INK}`, boxSizing: 'border-box'}} /></div>
        <span style={{fontFamily: ui, fontWeight: 800, fontSize: 40, color: '#fff'}}>withhammad.ai</span></div>
      <div style={{position: 'absolute', left: 760, top: 906, width: 180, height: 62, borderRadius: 14, border: '3px solid #d9dce2', boxSizing: 'border-box', fontFamily: ui, fontWeight: 700, fontSize: 30, lineHeight: '56px', color: '#fff', textAlign: 'center'}}>Follow</div>
      <div style={{position: 'absolute', left: 60, top: 994, fontFamily: ui, fontWeight: 600, fontSize: 33, color: '#cfd3da', whiteSpace: 'nowrap'}}>Agentic AI course by Andrew Ng, free to watch</div>
    </div>
    <div style={{position: 'absolute', left: 60, top: 1056, width: 880, height: 104, borderRadius: 52, background: '#16181d', border: '2px solid #3a3e47', boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 14px', opacity: foot}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 72, height: 72, borderRadius: 36, objectFit: 'cover'}} />
      <div style={{flex: 1, marginLeft: 22, fontFamily: ui, fontWeight: typed ? 800 : 500, fontSize: typed ? 52 : 38, letterSpacing: typed ? 2 : 0, color: typed ? '#fff' : '#7d828c', whiteSpace: 'nowrap'}}>{typed || 'Add a comment...'}
        <span style={{color: ACC, fontWeight: 400, opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>|</span></div>
      <div style={{width: 72, height: 72, borderRadius: 36, background: t >= sent ? ACC : '#2a2e36', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.22 * (t >= sent ? 1 - eo(pr(t, sent, 0.3)) : 0)})`}}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round"><path d="M21.5 2.5L10.5 13.5M21.5 2.5l-7 19-4-8-8-4z" /></svg></div>
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <path d="M520 1036C760 1030 986 1060 978 1112C970 1170 700 1186 480 1182C230 1178 30 1164 34 1108C38 1056 260 1036 560 1034" fill="none" stroke={ACC} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ell} />
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1196, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 46, lineHeight: '54px', color: ACC, ...fade(t, Math.max(48.98, s0 + 0.62))}}>comment COURSE</div>
    {dm > 0 && <div style={{position: 'absolute', left: 60, top: 1268 + (1 - dm) * 70, width: 880, height: 222, borderRadius: 30, background: '#111a2e', border: '2px solid #2a3657', boxSizing: 'border-box', padding: '18px 26px', opacity: dm}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}><Img src={A('avatar_thumb.jpg')} style={{width: 48, height: 48, borderRadius: 24, objectFit: 'cover'}} />
        <span style={{fontFamily: ui, fontWeight: 800, fontSize: 32, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: ui, fontWeight: 600, fontSize: 26, color: '#9aa3b5'}}>· Direct message</span></div>
      <div style={{marginTop: 12, display: 'inline-block', background: ACC, color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 34, lineHeight: '44px', padding: '10px 22px', borderRadius: '8px 26px 26px 26px', whiteSpace: 'nowrap'}}>Here is the course + how to watch free</div>
      <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, opacity: link, transform: `translateY(${(1 - link) * 12}px)`}}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9cc6ff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>
        <span style={{fontFamily: mono, fontWeight: 500, fontSize: 25, color: '#9cc6ff', whiteSpace: 'nowrap'}}>withhammad.com/resources/agentic-ai-course</span></div>
    </div>}
  </>;
};
const CommentPulse: React.FC = () => {
  const t = useT(), s = pop(t, 47.9, 0.3), beat = 1 + 0.08 * Math.max(0, Math.sin((t - 47.9) * 9)) * (1 - pr(t, 48.6, 0.3));
  return <div style={{position: 'absolute', left: 864 - 60, top: 1056 - 60, width: 120, height: 120, transform: `scale(${s * beat})`}}>
    <svg width={120} height={120} viewBox="0 0 24 24"><path d="M12 3c5 0 9 3.4 9 7.6s-4 7.6-9 7.6c-1 0-2-.1-2.9-.4L4.5 20l1.1-3.9C4 14.7 3 12.8 3 10.6 3 6.4 7 3 12 3z" fill={ACC} stroke="#fff" strokeWidth={1.2} /></svg></div>;
};

// ------------------------------------------------------------------ captions: 2-3 words, lower case as spoken, proper nouns kept
const CHUNKS: [number, number][] = [[0, 2], [3, 5], [6, 8], [9, 11], [12, 14], [15, 17], [18, 19], [20, 21], [22, 23], [24, 25], [26, 27], [28, 30], [31, 33], [34, 36], [37, 38],
  [39, 41], [42, 44], [45, 46], [47, 49], [50, 52], [53, 54], [55, 56], [57, 59], [60, 62], [63, 65], [66, 67], [68, 69], [70, 72], [73, 74], [75, 77], [78, 78],
  [79, 80], [81, 82], [83, 84], [85, 86], [87, 88], [89, 90], [91, 92], [93, 94], [95, 97], [98, 98], [99, 100], [101, 103], [104, 105], [106, 107], [108, 109],
  [110, 111], [112, 113], [114, 115], [116, 117], [118, 120]];
const KEEP = new Set(['Agentic', 'AI', 'DeepLearning.AI', 'Andrew', 'Ng', 'Coursera', 'Python', 'APIs', 'MCP', 'COURSE', "I'll"]);
const word = (w: string) => { const s = w.replace(/[?!.,:]+$/, ''); return KEEP.has(s) ? s : s.toLowerCase(); };
const Captions: React.FC<{words: Word[]; inInset: boolean}> = ({words, inInset}) => {
  const t = useT(), st = CHUNKS.map(([a]) => words[a].startMs / 1000 - 0.04);
  const i = CHUNKS.findIndex(([, b], k) => t >= st[k] && t < Math.min(words[b].endMs / 1000 + 0.5, k + 1 < CHUNKS.length ? st[k + 1] : 99));
  if (i < 0) return null;
  const [a, b] = CHUNKS[i], text = words.slice(a, b + 1).map(w => word(w.text)).join(' ');
  return <div style={{position: 'absolute', left: 0, right: 0, top: inInset ? 780 : 1417, zIndex: 45, textAlign: 'center'}}>
    <span style={{display: 'inline-block', background: '#000000bf', borderRadius: 10, padding: '10px 16px', fontFamily: ui, fontWeight: 600, fontSize: 44, lineHeight: '53px', color: '#fff', whiteSpace: 'nowrap'}}>{text}</span></div>;
};

// ------------------------------------------------------------------ the edit
export const Course: React.FC<CourseProps> = ({words, avatar, avatarTop = -250, avatarTone = '#2a2f3a'}) => {
  const t = useT(), face = !!avatar, SEAM = face ? 960 : 1232;
  const W = (oy: number, foy: number): Win => face ? {y: 226, h: 684, oy: foy} : {y: 232, h: 880, oy};
  const base: HL[] = [
    {s: 0, e: C.s2, big: [['build ', '#fff', -1], ['AI agents', ACC, -1]], size: 97},
    {s: 1.24, e: C.s2, big: [['prompts', '#fff', 1.24], [' → ', ACC, 1.62], ['AI agents', ACC, 1.86]], size: 97},
    {s: C.s2, e: C.s3, small: 'this course is', smallAt: 3.06, big: [['free to watch', ACC, 3.74]], below: 'free to audit: videos + forum (free account)', belowAt: 3.98},
    {s: C.s3, e: C.s4, big: [['Agentic AI', '#fff', 5.2]]},
    ...(face ? [{s: C.s4, e: C.s5, big: [['Agentic AI', '#fff', -1]] as Seg[], below: 'on DeepLearning.AI', belowAt: 6.52, belowColor: ACC, belowSize: 52}] : []),
    {s: C.s5, e: C.s6, small: 'your teacher', smallAt: 8.21, big: [['Andrew Ng', ACC, 9.1]]},
    ...(face ? [] : [{s: C.s7, e: 14.5, small: 'comfortable with', smallAt: 13.16, big: [['Python?', ACC, 13.72]] as Seg[], icon: 'python-yellow.svg'},
      {s: 14.5, e: C.s8, small: 'comfortable with Python?', smallAt: -1, big: [["you'll keep up", '#fff', 14.5]] as Seg[], tickAt: 14.78}]),
    {s: C.s14, e: 45.4, small: 'self-paced', smallAt: 42.88, big: [['~3 h of video', ACC, 43.72]]},
    {s: 45.4, e: C.s16, small: 'certificate + graded labs', smallAt: 45.4, big: [['paid (Pro)', ACC, 46.7]]},
  ];
  const items = base.map((h, k) => k === 0 ? {...h, e: base[1].s} : h);
  const split = face && (t < C.s6 || (t >= C.s14 && t < C.s16));
  return <AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    <Scene s={0} e={C.s2} z={1}>{face ? <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden'}}><HookScene face /></div> : <HookScene face={false} />}</Scene>
    <Scene s={C.s2} e={C.s3} z={2}><Rec name="r1_hero_punch" win={W(150, 270)} vt={mapT(t, [[2.98, 0.2], [3.38, 0.55], [3.78, 0.95], [4.85, 2.0]])} /></Scene>
    <Scene s={C.s3} e={C.s4} z={3}><Rec name="r2_title_highlight" win={W(40, 200)} vt={mapT(t, [[4.85, 0.62], [6.06, 1.85]])} /></Scene>
    <Scene s={C.s4} e={C.s5} z={4}>{face ? <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, background: avatarTone}} /> : <ColourCard tone="#16295a" />}</Scene>
    <Scene s={C.s5} e={C.s6} z={5}><Rec name="r3_video_card" win={W(40, 150)} vt={mapT(t, [[8.12, 0.3], [9.1, 0.82], [10.0, 1.9]])} /></Scene>
    <Scene s={C.s6} e={C.s7} z={6}><NameCard /></Scene>
    <Scene s={C.s7} e={C.s8} z={7}>{avatar ? <Avatar src={avatar} top={0} scale={1 + 0.04 * pr(t, C.s7, C.s8 - C.s7)} />
      : <Rec name="r6_who_python" win={W(40, 250)} vt={mapT(t, [[13.05, 0.9], [13.76, 1.3], [15.46, 2.62]])} zoom={1 + 0.04 * pr(t, 13.05, 2.4)} fx={540} fy={420} />}</Scene>
    <Scene s={C.s8} e={C.s9} z={8}><ListCard /></Scene>
    <Scene s={C.s9} e={C.s10} z={9}><Card01 /></Scene>
    <Scene s={C.s10} e={C.s11} z={10}><Card02 /></Scene>
    <Scene s={C.s11} e={C.s12} z={11}><Card03 /></Scene>
    <Scene s={C.s12} e={C.s13} z={12}><Card04 /></Scene>
    <Scene s={C.s13} e={C.s14} z={13}><Card05 /></Scene>
    <Scene s={C.s14} e={C.s15} z={14}><DetailsShot win={W(140, 140)} /></Scene>
    <Scene s={C.s15} e={C.s16} z={15}><Rec name="r5_details_whip" win={W(40, 100)} vt={mapT(t, [[47.52, 0.2], [47.85, 0.6]])} /></Scene>
    {avatar && <Scene s={C.s16} e={C.s17} z={16}><Avatar src={avatar} top={0} /><CommentPulse /></Scene>}
    <Scene s={avatar ? C.s17 : C.s16} e={99} z={17}><EndCard avatar={avatar} faceY={307 - avatarTop} /></Scene>
    {split && <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', zIndex: 20}}><Avatar src={avatar!} top={avatarTop} /></div>}
    {split && <div style={{position: 'absolute', left: 0, right: 0, top: 957, height: 6, background: '#050505', zIndex: 21}} />}
    <Headline items={items} seam={SEAM} band={face} />
    <div style={{position: 'absolute', left: 60, top: 226, zIndex: 46, background: '#0a0f1ed0', color: '#e6ecfb', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <Captions words={words} inInset={t >= (avatar ? C.s17 : C.s16)} />
  </AbsoluteFill>;
};
