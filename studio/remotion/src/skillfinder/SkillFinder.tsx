// SKILLFINDER reel (job abedb4efa2df, comment keyword LIBRARY). Voice-over edit: real skills.sh / GitHub screen
// recordings in a browser window plus motion graphics, captions under the object. Every time below is a spoken-word
// time from the recorded narration (voice/words.json), in seconds. Every number on screen was read on 12 Nov 2026.
// Presenter: optional. With `avatar` (a video under the public dir whose time 0 = narration 0 for the hook and which
// continues with the ending, see SLOTS) the hook becomes a split screen and the ending a full-frame presenter with the
// comment overlay; without it both are full-frame motion graphics.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type SkillFinderProps = {words: Word[]; skillsTotal: number; installs: number; avatar?: string; avatarTop?: number};
// Presenter slots in narration seconds, cut in the middle of the pauses around the first and the last sentence.
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 6.41], ending: [37.04, 40.83]};

const FPS = 30, SEAM = 864, WX = 110, WW = 860, BAR = 56, CAP = 1262;
const MINT = '#2EE6B5', GREEN = '#4ADE80', RED = '#FF5A5F', AMBER = '#FFB020', INK = '#07090d', MUTED = '#9aa3b5', CLAUDE = '#D97757';
const disp = 'Montserrat', serif = 'Playfair Display', ui = 'Inter', mono = 'JetBrains Mono', pix = 'Pixelify Sans';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const ei = (n: number) => Math.pow(cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.34) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mapT = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};
const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
type Dir = 'l' | 'r' | 'u' | 'd' | 'none';

// ------------------------------------------------------------------ shared pieces
// A full-frame shot. Hard cut by default (with a small settle); a direction slides it in over the previous shot.
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; dir?: Dir; h?: number}>> = ({s, e, z, dir = 'none', h = 1920, children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  const q = 1 - eo(pr(t, s, 0.3)), k = s > 0 ? 1 + 0.03 * (1 - eo(pr(t, s, 0.22))) : 1;
  const tr = dir === 'none' ? `scale(${k})` : `translate(${dir === 'l' ? -q * 1080 : dir === 'r' ? q * 1080 : 0}px,${dir === 'u' ? -q * h : dir === 'd' ? q * h : 0}px)`;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden', zIndex: z, transform: tr}}>{children}</div>;
};
const Glow: React.FC<{tone: string; at?: string}> = ({tone, at = '50% 36%'}) => <AbsoluteFill style={{background: `radial-gradient(95% 62% at ${at},${tone},${INK} 74%)`}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#ffffff1a 1.6px,transparent 1.8px)', backgroundSize: '38px 38px'}} /></AbsoluteFill>;
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; font?: string; style?: React.CSSProperties}>> = ({children, bg = MINT, color = '#06281f', size = 30, font = disp, style}) =>
  <div style={{display: 'inline-block', background: bg, color, fontFamily: font, fontWeight: 900, fontSize: size, padding: `${size * 0.3}px ${size * 0.66}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string; ink?: string}> = ({size = 36, color = GREEN, ink = '#06210f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Lens: React.FC<{size: number; color?: string; fill?: string}> = ({size, color = '#111', fill = 'none'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="10.5" cy="10.5" r="6.6" fill={fill} stroke={color} strokeWidth="2.6" /><path d="M15.6 15.6L21 21" stroke={color} strokeWidth="3" strokeLinecap="round" /></svg>;
const Lock: React.FC = () => <svg width={18} height={18} viewBox="0 0 24 24" style={{flexShrink: 0}}><rect x="4.500" y="10.500" width="15" height="10.500" rx="2.500" fill="#7d8799" /><path d="M8 10.500V7.500a4 4 0 0 1 8 0v3" fill="none" stroke="#7d8799" strokeWidth="2.400" /></svg>;
// Browser window around a real recording (1290x1350, shown at 860x900: a zoom up to 1.5 stays at native pixels).
// `vt` is the time inside the recording, set by an explicit time map so a highlight lands on its spoken word.
const Browser: React.FC<React.PropsWithChildren<{url: string; name: string; vt: number; y?: number; visH?: number; zoom?: number; fx?: number; fy?: number; glow?: string}>> = ({url, name, vt, y = 276, visH = 900, zoom = 1, fx = 430, fy = 300, glow = '#2EE6B533', children}) =>
  <div style={{position: 'absolute', left: WX, top: y, width: WW, height: BAR + visH, borderRadius: 28, overflow: 'hidden', background: '#000', boxShadow: `0 0 0 2px #2c313c,0 40px 90px #000d,0 0 140px ${glow}`}}>
    <div style={{height: BAR, background: '#14171d', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, flexShrink: 0}} />)}
      <div style={{marginLeft: 14, flex: 1, height: 36, borderRadius: 18, background: '#090b0f', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontWeight: 500, fontSize: 21, color: '#c9d3ee', whiteSpace: 'nowrap', overflow: 'hidden'}}><Lock />{url}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: BAR, width: WW, height: visH, overflow: 'hidden'}}>
      <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: 900, transform: `scale(${zoom})`, transformOrigin: `${fx}px ${fy}px`}} /></Freeze>
      {children}
    </div>
  </div>;
// Count-up card laid over the lower part of a window: the figure runs toward the value read on the live page.
const Counter: React.FC<{value: number; from: number; dur: number; at: number; label: string}> = ({value, from, dur, at, label}) => {
  const t = useT(), s = pop(t, at, 0.3); if (s <= 0) return null;
  return <><div style={{position: 'absolute', left: WX, top: 880, width: WW, height: 352, borderRadius: '0 0 28px 28px', background: 'linear-gradient(transparent,#000 38%)', opacity: pr(t, at, 0.2)}} />
  <div style={{position: 'absolute', left: 150, top: 1010, width: 780, height: 190, borderRadius: 32, background: '#06120bf2', border: `3px solid ${GREEN}`, boxShadow: `0 20px 60px #000c,0 0 80px ${GREEN}40`, transform: `scale(${s})`, textAlign: 'center'}}>
    <div style={{fontFamily: disp, fontWeight: 900, fontSize: 112, lineHeight: '124px', color: GREEN, letterSpacing: -2, fontVariantNumeric: 'tabular-nums'}}>{fmt(value * eo(pr(t, from, dur)))}</div>
    <div style={{fontFamily: ui, fontWeight: 700, fontSize: 28, color: '#e6ecfb', marginTop: 2}}>{label}</div>
  </div></>;
};

// ------------------------------------------------------------------ presenter (only when the `avatar` prop is set)
const Avatar: React.FC<{src: string; phase: 'hook' | 'ending'; top: number}> = ({src, phase, top}) => {
  const t = useT(), a = phase === 'hook' ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#20242c'}}>
    <Freeze frame={Math.round(a * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover'}} /></Freeze>
  </div>;
};

// ------------------------------------------------------------------ beat 1: hook (rank 1 on the real leaderboard, then the swarm)
const HookTitle: React.FC = () => {
  const t = useT(), L = (at: number) => 1 + 0.06 * (t >= at ? 1 - eo(pr(t, at, 0.3)) : 0), s0 = 1 + 0.05 * (1 - eo(pr(t, 0, 0.3)));
  const cap: React.CSSProperties = {position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: disp, fontWeight: 900, fontSize: 88, lineHeight: '96px', color: '#fff', letterSpacing: 0.5, textShadow: '0 6px 24px #000c'};
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${s0})`, transformOrigin: '50% 460px'}}>
    <div style={{...cap, top: 292, transform: `scale(${L(0.74)})`}}>THE MOST USEFUL</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 368, textAlign: 'center', fontFamily: serif, fontWeight: 700, fontSize: 158, lineHeight: '172px', color: MINT, letterSpacing: -2, textShadow: '0 6px 30px #000c', transform: `scale(${L(1.86)})`}}>claude skill</div>
    <div style={{...cap, top: 540, transform: `scale(${L(2.44)})`}}>ON THE PLANET?</div>
  </div>;
};
const RankShot: React.FC<{y: number; visH: number}> = ({y, visH}) => {
  const t = useT();
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${0.965 + 0.035 * eo(pr(t, 0, 1.2))})`, transformOrigin: `540px ${y + 300}px`}}>
    <Browser url="skills.sh" name="r1_rank1" vt={mapT(t, [[0, 1.66], [0.25, 1.95], [0.5, 2.15], [1.4, 2.8]])} y={y} visH={visH} glow="#2EE6B544" /></div>;
};
const SWARM = ['grill-me', 'hyperframes', 'agent-browser', 'media-use', 'frontend-design', 'ui-taste', 'prototype', 'triage', 'domain-modeling', 'codebase-design',
  'diagnosing-bugs', 'code-review', 'research', 'teach', 'copywriting', 'seo-audit', 'implement', 'wayfinder', 'to-spec', 'lark-doc'];
const TINTS = ['#FF6B6B', '#FFD166', '#06D6A0', '#4CC9F0', '#B388FF', '#FF9F1C', '#F472B6', '#A3E635'];
const Swarm: React.FC<{top: number; big: boolean; total: number}> = ({top, big, total}) => {
  const t = useT(), ts = big ? 140 : 108, y0 = top + ts + (big ? 54 : 50), pitch = big ? 112 : 76, ch = big ? 62 : 50, cy = y0 + (4 * pitch + ch) / 2;
  const typed = 'SKILLS'.slice(0, Math.floor(pr(t, 1.2, 0.36) * 6.99)), card = pop(t, 2.5, 0.36), tag = pop(t, 2.8, 0.3);
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: top + 4, textAlign: 'center', fontFamily: pix, fontWeight: 700, fontSize: ts, lineHeight: `${ts}px`, color: '#fff', letterSpacing: 6, textShadow: `0 0 34px ${MINT}66`}}>{typed}<span style={{opacity: typed.length < 6 ? 1 : 0, color: MINT}}>_</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: top + ts + 6, textAlign: 'center', fontFamily: mono, fontWeight: 500, fontSize: big ? 28 : 23, color: MUTED, opacity: pr(t, 1.6, 0.2)}}>{fmt(total)} skills on skills.sh</div>
    {SWARM.map((name, i) => { const c = i % 4, r = Math.floor(i / 4), w = 205, x1 = 70 + c * 220 + (rnd(i, 1) - 0.5) * 14, y1 = y0 + r * pitch + (rnd(i, 2) - 0.5) * 16;
      const a = eo(pr(t, 1.22 + rnd(i, 3) * 0.3, 0.42)), k = ei(pr(t, 2.18 + rnd(i, 4) * 0.14, 0.34)); if (k >= 1) return null;
      const x = x1 + (1 - a) * (c < 2 ? -1 : 1) * (760 + rnd(i, 5) * 300), bob = Math.sin(t * 5 + i) * 5;
      return <div key={i} style={{position: 'absolute', left: x + (540 - w / 2 - x) * k, top: y1 + bob + (cy - ch / 2 - y1) * k, width: w, height: ch, borderRadius: 16, background: TINTS[i % 8], color: '#111', fontFamily: mono, fontWeight: 700, fontSize: 21,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px #0009', transform: `scale(${1 - 0.8 * k}) rotate(${(rnd(i, 6) - 0.5) * 8 * (1 - k)}deg)`, opacity: 1 - k * k}}>{name}</div>; })}
    <div style={{position: 'absolute', left: big ? 150 : 200, top: cy - (big ? 128 : 92), width: big ? 780 : 680, height: big ? 256 : 184, borderRadius: 44, background: 'linear-gradient(160deg,#ffffff30,#ffffff12)', border: '3px solid #ffffff66', boxShadow: `0 30px 80px #000c,0 0 110px ${MINT}55`,
      transform: `scale(${card})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26}}>
      <div style={{width: big ? 132 : 92, height: big ? 132 : 92, borderRadius: 34, background: MINT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Lens size={big ? 88 : 60} color="#06281f" /></div>
      <div><div style={{fontFamily: ui, fontWeight: 900, fontSize: big ? 100 : 70, lineHeight: 1.05, color: '#fff', letterSpacing: -2}}>find-skills</div>
        <div style={{fontFamily: mono, fontWeight: 500, fontSize: big ? 34 : 25, color: '#d5dcec', marginTop: 4}}>vercel-labs/skills</div></div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: cy - (big ? 214 : 158), textAlign: 'center', transform: `scale(${tag}) rotate(-4deg)`}}><Pill size={big ? 46 : 33}>#1 on skills.sh</Pill></div>
  </>;
};

// ------------------------------------------------------------------ beat 2: the twist (task cards, each gets the top result of today's skills.sh search)
const TASKS: [string, string, string, React.ReactNode][] = [
  ['Write content', 'copywriting', '#FF8A65', <path key="p" d="M5 19l3.600-.800L19 7.800 16.200 5 5.800 15.400z" fill="#fff" />],
  ['Build an app', 'frontend-design', '#7C9BFF', <g key="g" fill="#fff"><rect x="5" y="5" width="6" height="6" rx="1.500" /><rect x="13" y="5" width="6" height="6" rx="1.500" /><rect x="5" y="13" width="6" height="6" rx="1.500" /><rect x="13" y="13" width="6" height="6" rx="1.500" /></g>],
  ['Research something', 'research', '#22B8A7', <g key="g" fill="none" stroke="#fff" strokeWidth="2.400" strokeLinecap="round"><circle cx="11" cy="11" r="5.500" /><path d="M15.200 15.200L19.500 19.500" /></g>],
  ['Fix this bug', 'diagnosing-bugs', '#F472B6', <g key="g" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinecap="round"><ellipse cx="12" cy="13" rx="4.200" ry="5.200" fill="#fff" /><path d="M9.500 7.500L8 5.500M14.500 7.500L16 5.500M7.800 11H5M7.800 14.500H5M16.200 11H19M16.200 14.500H19" /></g>],
  ['Edit my video', 'hyperframes', '#FFB020', <g key="g" fill="#fff"><rect x="4.500" y="6.500" width="15" height="11" rx="2.500" /><path d="M10.500 9.500l4.200 2.500-4.200 2.500z" fill="#FFB020" /></g>],
];
const LAND = [3.86, 4.3, 4.74, 5.14, 5.5];
const Tasks: React.FC<{top: number; h: number}> = ({top, h}) => {
  const t = useT(), pitch = h / 5, chh = pitch - 16, f = Math.min(40, pitch * 0.25), tf = Math.min(26, pitch * 0.185), ic = pitch * 0.5, yc = (i: number) => top + i * pitch + chh / 2;
  const seg = LAND.findIndex(x => t < x), i1 = seg < 0 ? 4 : seg, p = seg < 0 ? 1 : seg === 0 ? eo(pr(t, 3.56, 0.3)) : eo(pr(t, LAND[i1] - 0.3, 0.3));
  const ya = i1 === 0 ? top - 150 : yc(i1 - 1), mx = 700 + (i1 === 0 ? (1 - p) * 300 : 0), my = ya + (yc(i1) - ya) * p - Math.sin(p * Math.PI) * 46, out = eo(pr(t, 5.86, 0.3));
  return <>
    {TASKS.map(([task, skill, tone, glyph], i) => { const on = pop(t, LAND[i] + 0.1, 0.3), end = t >= 5.88 ? 1 + 0.25 * (1 - eo(pr(t, 5.88 + i * 0.04, 0.3))) : 1;
      return <div key={task} style={{position: 'absolute', left: WX, top: top + i * pitch, width: WW, height: chh, borderRadius: chh * 0.24, background: '#fff', boxShadow: '0 14px 34px #5b4b8a33', display: 'flex', alignItems: 'center', padding: `0 ${chh * 0.17}px`,
        transform: `translateX(${(1 - eo(pr(t, 3.52 + i * 0.05, 0.3))) * (i % 2 ? 1100 : -1100)}px)`, border: on > 0 ? '3px solid #19c37d' : '3px solid #fff'}}>
        <div style={{width: ic, height: ic, borderRadius: ic * 0.3, background: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><svg width={ic * 0.72} height={ic * 0.72} viewBox="0 0 24 24">{glyph}</svg></div>
        <div style={{marginLeft: chh * 0.14, fontFamily: ui, fontWeight: 800, fontSize: f, color: '#17151f', whiteSpace: 'nowrap', letterSpacing: -0.5}}>{task}</div>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: tf * 0.36, background: '#15141b', borderRadius: tf * 1.2, padding: `${tf * 0.38}px ${tf * 0.56}px ${tf * 0.38}px ${tf * 0.7}px`, transform: `scale(${on})`, transformOrigin: '100% 50%'}}>
          <span style={{fontFamily: mono, fontWeight: 700, fontSize: tf, color: '#fff', whiteSpace: 'nowrap'}}>{skill}</span><div style={{transform: `scale(${end})`}}><Tick size={tf * 1.2} /></div></div>
      </div>; })}
    <div style={{position: 'absolute', left: mx - 66 + out * 520, top: my - 66 - out * 60, width: 132, height: 132, transform: `rotate(${-12 + 10 * Math.sin(p * Math.PI)}deg)`, filter: 'drop-shadow(0 12px 16px #0006)', opacity: 1 - out}}><Lens size={132} color="#111" fill="#ffffffb8" /></div>
  </>;
};
const Pastel: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(165deg,#e7deff,#ffe6d8 52%,#d3f8ea)'}} />;

// ------------------------------------------------------------------ beat 3: who built it, and the search-engine card
const VercelCard: React.FC = () => {
  const t = useT(), on = pr(t, 7.4, 0.16), p = t < 7.4 ? 0.62 : 0.62 + 0.38 * pop(t, 7.4, 0.4), drift = pr(t, 7.4, 1.3), chip = pop(t, 7.9, 0.32);
  return <AbsoluteFill style={{background: 'radial-gradient(80% 50% at 50% 44%,#1b1e26,#000 70%)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', fontFamily: disp, fontWeight: 800, fontSize: 42, letterSpacing: 7, color: '#c5ccdb', transform: `translateY(${(1 - eo(pr(t, 6.41, 0.3))) * 40}px)`}}>BUILT BY AN ENGINEER AT</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 650, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 44, opacity: 0.3 + 0.7 * on, transform: `translateX(${-36 * eo(drift)}px) scale(${p * (1 + 0.05 * drift)})`}}>
      <Img src={A('si-vercel.svg')} style={{width: 170, height: 170, filter: 'invert(1)'}} />
      <span style={{fontFamily: disp, fontWeight: 900, fontSize: 140, lineHeight: '230px', letterSpacing: 2, color: '#fff'}}>VERCEL</span>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 950, display: 'flex', justifyContent: 'center', transform: `scale(${chip})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, background: '#12151c', border: '2px solid #343a48', borderRadius: 40, padding: '18px 34px 18px 20px'}}>
        <div style={{width: 62, height: 62, borderRadius: 18, background: MINT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Lens size={42} color="#06281f" /></div>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 44, color: '#fff'}}>find-skills</span><span style={{fontFamily: ui, fontWeight: 600, fontSize: 36, color: MUTED}}>by Andrew Qu</span></div>
    </div>
  </AbsoluteFill>;
};
const MATCHES: [string, string, string][] = [['seo-audit', 'coreyhaines31/marketingskills', '252.9K'], ['ai-seo', 'coreyhaines31/marketingskills', '163.3K'], ['firecrawl-seo-audit', 'firecrawl/firecrawl-workflows', '32.3K']];
const EngineCard: React.FC<{total: number}> = ({total}) => {
  const t = useT(), q = 'seo'.slice(0, Math.floor(pr(t, 8.68, 0.26) * 3.99)), run = pr(t, 8.94, 0.9), found = t >= 10.0;
  return <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 30%,#fbf7ec,#ece5d3)'}}>
    <div style={{position: 'absolute', left: WX, top: 300, width: WW, height: 912, borderRadius: 44, background: '#fff', boxShadow: '0 30px 80px #6b5d3540', transform: `scale(${0.94 + 0.06 * eo(pr(t, 8.6, 0.3))})`}}>
      <div style={{position: 'absolute', left: 44, top: 36, fontFamily: ui, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: '#8d8672'}}>SKILLS NEEDED FOR</div>
      <div style={{position: 'absolute', right: 44, top: 38, fontFamily: ui, fontWeight: 600, fontSize: 23, color: '#a39c88'}}>skills.sh search · 12 Nov 2026</div>
      <div style={{position: 'absolute', left: 44, top: 84, width: 772, height: 104, borderRadius: 28, border: '3px solid #17151f', display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', boxSizing: 'border-box'}}>
        <Lens size={50} color="#17151f" /><span style={{fontFamily: mono, fontWeight: 700, fontSize: 56, color: '#17151f'}}>{q}<span style={{color: '#19c37d', opacity: Math.floor(t * 4) % 2 ? 1 : 0.2}}>|</span></span></div>
      <div style={{position: 'absolute', left: 44, top: 222, fontFamily: ui, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: found ? '#19a36b' : '#8d8672'}}>{found ? 'SEARCHED' : 'SEARCHING'}</div>
      <div style={{position: 'absolute', left: 40, top: 252, fontFamily: disp, fontWeight: 900, fontSize: 112, lineHeight: '128px', color: '#17151f', letterSpacing: -3, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>{fmt(total * eo(run))}<span style={{fontFamily: ui, fontWeight: 800, fontSize: 46, letterSpacing: 0, marginLeft: 18, color: '#6b6558'}}>skills</span></div>
      <div style={{position: 'absolute', left: 44, top: 392, width: 772, height: 12, borderRadius: 6, background: '#efe9da', overflow: 'hidden'}}><div style={{width: `${100 * eo(run)}%`, height: '100%', background: '#19c37d', borderRadius: 6}} /></div>
      <div style={{position: 'absolute', left: 44, top: 440, fontFamily: ui, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: '#8d8672'}}>TOP MATCHES</div>
      {MATCHES.map(([name, src, n], i) => { const at = [10.08, 10.32, 10.58][i], s = pop(t, at, 0.3);
        return <div key={name} style={{position: 'absolute', left: 44, top: 492 + i * 134, width: 772, height: 116, borderRadius: 26, background: '#f6f2e7', boxSizing: 'border-box'}}>
          {s <= 0 ? <><div style={{position: 'absolute', left: 30, top: 28, width: 300 - i * 40, height: 22, borderRadius: 11, background: '#e6dfcd'}} /><div style={{position: 'absolute', left: 30, top: 68, width: 420, height: 16, borderRadius: 8, background: '#ece6d6'}} /></>
            : <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 30px', transform: `scale(${s})`}}>
              <div style={{width: 54, height: 54, borderRadius: 27, background: '#17151f', color: '#fff', fontFamily: disp, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i + 1}</div>
              <div style={{marginLeft: 22}}><div style={{fontFamily: ui, fontWeight: 800, fontSize: 42, lineHeight: 1.1, color: '#17151f', letterSpacing: -0.5}}>{name}</div><div style={{fontFamily: mono, fontWeight: 500, fontSize: 23, color: '#857e6b', marginTop: 4}}>{src}</div></div>
              <div style={{marginLeft: 'auto', textAlign: 'right'}}><div style={{fontFamily: mono, fontWeight: 700, fontSize: 40, color: '#17151f'}}>{n}</div><div style={{fontFamily: ui, fontWeight: 600, fontSize: 20, color: '#857e6b'}}>installs</div></div>
            </div>}
        </div>; })}
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beats 4 to 6: the directory, the old way, tell Claude, three examples
const DirectoryShot: React.FC<{total: number}> = ({total}) => {
  const t = useT();
  return <><Glow tone="#0f3a26" /><Browser url="skills.sh" name="r2_directory_scroll" vt={mapT(t, [[11.27, 1.0], [11.5, 1.3], [12.62, 2.6], [12.74, 2.9], [14.41, 5.6]])} glow="#4ADE8044" />
    <Counter value={total} at={12.72} from={12.78} dur={0.72} label="skills listed on skills.sh · 12 Nov 2026" /></>;
};
const HuntShot: React.FC = () => {
  const t = useT(), sh = Math.sin(t * 46) * 5 * (1 - pr(t, 15.3, 1.4));
  return <><Glow tone="#4a1014" /><div style={{position: 'absolute', inset: 0, transform: `translate(${sh}px,0) rotate(${Math.sin(t * 7) * 0.5}deg)`}}>
    <Browser url="github.com/search?q=claude+skills" name="r3_github_hunt" vt={mapT(t, [[14.41, 0.5], [16.8, 4.55]])} glow="#FF5A5F55" /></div>
    <AbsoluteFill style={{background: 'radial-gradient(70% 50% at 50% 42%,transparent 52%,#c8102e88 100%)'}} />
    <div style={{position: 'absolute', left: 150, top: 1096, transform: `scale(${pop(t, 15.24, 0.3)}) rotate(-3deg)`, transformOrigin: '0 50%'}}><Pill bg={RED} color="#fff" size={44}>114K REPOS ON GITHUB</Pill></div></>;
};
const ASK = 'Find me a skill for writing content';
const TellClaude: React.FC = () => {
  const t = useT(), typed = ASK.slice(0, Math.floor(pr(t, 17.22, 1.3) * (ASK.length + 0.99))), sent = pop(t, 18.58, 0.3);
  return <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 30%,#fbf3ea,#eee6d8)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, transform: `scale(${0.9 + 0.1 * eo(pr(t, 16.8, 0.3))})`}}>
      <Img src={A('claude-mark.svg')} style={{width: 190, height: 190, transform: `rotate(${t * 26}deg)`}} /><span style={{fontFamily: disp, fontWeight: 900, fontSize: 132, letterSpacing: 2, color: '#1f1e1d'}}>CLAUDE</span></div>
    <div style={{position: 'absolute', left: WX, top: 640, width: WW, height: 380, borderRadius: 44, background: '#fff', border: '3px solid #e3dccb', boxShadow: '0 30px 80px #6b5d3540', boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', left: 44, top: 40, right: 44, fontFamily: ui, fontWeight: 600, fontSize: 58, lineHeight: 1.22, color: typed ? '#1f1e1d' : '#a59e8c', letterSpacing: -0.5}}>{typed || 'Ask Claude'}<span style={{color: CLAUDE, fontWeight: 500, opacity: Math.floor(t * 4) % 2 ? 1 : 0.15}}>|</span></div>
      <div style={{position: 'absolute', left: 40, bottom: 34, width: 76, height: 76, borderRadius: 38, border: '3px solid #d9d2c0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 500, fontSize: 56, color: '#8d8672', lineHeight: 1}}>+</div>
      <div style={{position: 'absolute', right: 40, bottom: 34, width: 84, height: 84, borderRadius: 42, background: CLAUDE, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.22 * (sent > 0 ? 1 - eo(pr(t, 18.58, 0.34)) : 0)})`}}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5.500 11.500L12 5l6.500 6.500" /></svg></div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1070, display: 'flex', justifyContent: 'center', transform: `scale(${sent})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#17151f', borderRadius: 44, padding: '16px 32px 16px 18px'}}>
        <div style={{width: 58, height: 58, borderRadius: 18, background: MINT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Lens size={40} color="#06281f" /></div>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 42, color: '#fff'}}>find-skills</span><Tick size={48} /></div>
    </div>
  </AbsoluteFill>;
};
const Flash: React.FC<{name: string; url: string; s: number; tone: string}> = ({name, url, s, tone}) => {
  const t = useT();
  return <><Glow tone={tone} /><Browser url={url} name={name} vt={mapT(t, [[s, 0.62], [s + 0.24, 1.0], [s + 1.2, 1.7]])} zoom={1 + 0.03 * pr(t, s, 1.2)} fx={430} fy={200} glow={tone} /></>;
};

// ------------------------------------------------------------------ beat 7: search, most installed, into your setup
const SearchShot: React.FC = () => {
  const t = useT();
  return <><Glow tone="#2a1f5c" /><Browser url="skills.sh/?q=copywriting" name="r5_search" vt={mapT(t, [[22.25, 0.72], [22.52, 1.0], [23.16, 2.3], [23.3, 2.75], [23.52, 3.08], [23.9, 3.5]])} glow="#8f7bff55" /></>;
};
const RESULTS: [string, string, string, number][] = [['copywriting', 'coreyhaines31/marketingskills', '252.8K', 252.8], ['antislop-copywriting', 'miqdadbadjuber/anti-slop', '8.7K', 8.7],
  ['copywriting', 'kostja94/marketing-skills', '4.0K', 4.0], ['copywriting-hooks', 'samber/cc-skills', '6.5K', 6.5]];
const ResultsCard: React.FC = () => {
  const t = useT(), pick = pr(t, 24.4, 0.2), dim = pr(t, 25.2, 0.3);
  return <AbsoluteFill style={{background: 'linear-gradient(165deg,#ece6ff,#cabcff)'}}>
    <div style={{position: 'absolute', left: WX, top: 296, width: WW, height: 96, borderRadius: 48, background: '#15141b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, fontWeight: 700, fontSize: 40, color: '#fff', boxShadow: '0 20px 50px #4a3b8a55',
      transform: `scale(${0.9 + 0.1 * eo(pr(t, 23.9, 0.25))})`}}><span style={{color: GREEN, marginRight: 16}}>$</span>npx skills find "copywriting"</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 408, textAlign: 'center', fontFamily: ui, fontWeight: 700, fontSize: 24, color: '#5d5580'}}>skills.sh search · 12 Nov 2026</div>
    {RESULTS.map(([name, src, n, v], i) => { const s = pop(t, 23.94 + i * 0.09, 0.3), top1 = i === 0, bar = eo(pr(t, 24.2 + i * 0.06, 0.5));
      return <div key={i} style={{position: 'absolute', left: WX, top: 456 + i * 188, width: WW, height: 168, borderRadius: 32, background: '#fff', boxSizing: 'border-box', border: `6px solid ${top1 && pick > 0 ? '#19c37d' : '#fff'}`, boxShadow: top1 && pick > 0 ? '0 20px 60px #19c37d66' : '0 14px 34px #4a3b8a33',
        transform: `scale(${s * (top1 ? 1 + 0.035 * pick : 1 - 0.03 * dim)})`, opacity: top1 ? 1 : 1 - 0.45 * dim, display: 'flex', alignItems: 'center', padding: '0 34px'}}>
        <div style={{fontFamily: disp, fontWeight: 900, fontSize: 54, color: top1 ? '#19c37d' : '#b9afe6', width: 56}}>{i + 1}</div>
        <div><div style={{fontFamily: ui, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: '#17151f', letterSpacing: -0.5}}>{name}</div>
          <div style={{fontFamily: mono, fontWeight: 500, fontSize: 24, color: '#6b6880', marginTop: 4}}>{src}</div>
          <div style={{width: 430, height: 12, borderRadius: 6, background: '#ece8fa', marginTop: 12, overflow: 'hidden'}}><div style={{width: `${Math.max(2.5, v / 252.8 * 100) * bar}%`, height: '100%', borderRadius: 6, background: top1 ? '#19c37d' : '#a99ce8'}} /></div></div>
        <div style={{marginLeft: 'auto', textAlign: 'right'}}><div style={{fontFamily: mono, fontWeight: 700, fontSize: 48, color: '#17151f'}}>{n}</div><div style={{fontFamily: ui, fontWeight: 600, fontSize: 22, color: '#6b6880'}}>installs</div></div>
        {top1 && <div style={{position: 'absolute', right: -18, top: -22, transform: `scale(${pop(t, 24.74, 0.3)})`}}><Tick size={68} color="#19c37d" ink="#fff" /></div>}
      </div>; })}
  </AbsoluteFill>;
};
const CMD = ['npx skills add', 'coreyhaines31/marketingskills@copywriting', '-g -y'];
const SetupCard: React.FC = () => {
  const t = useT(), n = Math.floor(pr(t, 26.56, 0.75) * (CMD.join('').length + 0.99)), fly = eo(pr(t, 27.24, 0.6)), done = pop(t, 28.02, 0.32);
  let left = n;
  return <AbsoluteFill style={{background: 'linear-gradient(165deg,#e79068,#c75f3c)'}}>
    <div style={{position: 'absolute', left: WX, top: 300, width: WW, height: 300, borderRadius: 30, background: '#16110e', boxShadow: '0 30px 70px #5a230f99', overflow: 'hidden', transform: `translateY(${(1 - eo(pr(t, 26.5, 0.3))) * 60}px)`}}>
      <div style={{height: 54, background: '#231b16', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px'}}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
        <span style={{marginLeft: 12, fontFamily: ui, fontWeight: 700, fontSize: 23, color: '#cbbfb6'}}>Terminal</span></div>
      <div style={{padding: '26px 34px', fontFamily: mono, fontWeight: 500, fontSize: 31, lineHeight: '58px', color: '#f6efe9', whiteSpace: 'pre'}}>
        {CMD.map((l, i) => { const k = Math.max(0, Math.min(left, l.length)); left -= k; return <div key={i} style={{height: 58}}>{i === 0 && <span style={{color: GREEN}}>$ </span>}<span style={{color: i === 1 ? '#ffd9a8' : undefined, fontWeight: i === 1 ? 700 : 500}}>{l.slice(0, k)}</span></div>; })}
      </div>
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><path d="M540 616V830" stroke="#fff" strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" opacity={0.75} /></svg>
    <div style={{position: 'absolute', left: 300, top: 820, width: 480, height: 324}}>
      <svg width={480} height={324} viewBox="0 0 400 270"><path d="M24 40a24 24 0 0 1 24-24h96l34 36h174a24 24 0 0 1 24 24v154a24 24 0 0 1-24 24H48a24 24 0 0 1-24-24z" fill="#2b1c14" /><path d="M24 96h352v134a24 24 0 0 1-24 24H48a24 24 0 0 1-24-24z" fill="#3a271c" /></svg>
      <Img src={A('si-claude.svg')} style={{position: 'absolute', left: 176, top: 146, width: 128, height: 128, filter: 'invert(1)', opacity: 0.92}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1140, textAlign: 'center'}}><span style={{display: 'inline-block', fontFamily: mono, fontWeight: 700, fontSize: 42, color: '#fff', background: '#16110e', borderRadius: 18, padding: '8px 28px'}}>~/.claude/skills</span></div>
    <div style={{position: 'absolute', left: 390, top: 626 + 250 * fly, width: 300, height: 176, borderRadius: 24, background: '#fff', boxShadow: '0 18px 40px #5a230f88', transform: `scale(${(1 - 0.4 * fly) * pop(t, 26.9, 0.3)})`, opacity: 1 - ei(pr(t, 27.76, 0.16)), textAlign: 'center'}}>
      <div style={{fontFamily: mono, fontWeight: 700, fontSize: 38, color: '#17151f', marginTop: 36}}>copywriting</div><div style={{fontFamily: mono, fontWeight: 500, fontSize: 28, color: '#8a7f77', marginTop: 8}}>SKILL.md</div></div>
    <div style={{position: 'absolute', left: 724, top: 786, transform: `scale(${done})`}}><Tick size={104} color="#fff" ink="#c75f3c" /></div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beats 8 and 9: the install count, rank 1, the one rule
const InstallsShot: React.FC<{installs: number}> = ({installs}) => {
  const t = useT();
  return <><Glow tone="#0f3a26" /><Browser url="skills.sh/vercel-labs/skills/find-skills" name="r6_installs" vt={mapT(t, [[28.65, 0.95], [29.22, 1.77], [29.46, 2.05], [31.16, 4.0]])} zoom={1 + 0.5 * eo(pr(t, 29.36, 0.6))} fx={36} fy={350} glow="#4ADE8044" />
    <Counter value={installs} at={29.4} from={29.44} dur={0.72} label="installs · counted by anonymous CLI telemetry" /></>;
};
const TopShot: React.FC = () => {
  const t = useT();
  return <><Glow tone="#0d2f4a" /><Browser url="skills.sh" name="r1b_scrollup" vt={mapT(t, [[31.16, 1.3], [31.8, 2.4], [31.96, 2.75], [32.24, 3.25], [33.17, 4.3]])} glow="#2EE6B544" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1052, textAlign: 'center', transform: `scale(${pop(t, 32.2, 0.32)}) rotate(-3deg)`}}><Pill size={64} style={{boxShadow: '0 20px 50px #000c'}}>#1 ALL TIME</Pill></div></>;
};
const RuleCard: React.FC = () => {
  const t = useT(), p = eo(pr(t, 33.2, 0.22)), st = (2.1 - 1.1 * p);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 44%,#4a2c00,${INK} 64%)`}}>
    {Array.from({length: 16}, (_, i) => <div key={i} style={{position: 'absolute', left: 540, top: 840, width: 6, height: 1500, marginLeft: -3, background: `linear-gradient(transparent 24%,${AMBER}44 62%,transparent)`, transformOrigin: '50% 0', transform: `rotate(${i * 22.5 + t * 30}deg)`}} />)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, 33.2, 0.3)})`}}>
      <svg width={170} height={170} viewBox="0 0 24 24"><path d="M12 2.500l8 3v6.200c0 4.700-3.300 8.300-8 9.800-4.700-1.500-8-5.100-8-9.800V5.500z" fill={AMBER} /><path d="M8.200 12.200l2.700 2.700 5-5.300" fill="none" stroke="#2a1800" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', fontFamily: disp, fontWeight: 900, transform: `scale(${st}) rotate(-4deg)`, opacity: Math.min(1, p * 2.5), filter: `blur(${(1 - p) * 12}px)`}}>
      <div style={{fontSize: 262, lineHeight: '250px', color: AMBER, letterSpacing: -6}}>ONE</div><div style={{fontSize: 262, lineHeight: '250px', color: '#fff', letterSpacing: -6}}>RULE</div></div>
  </AbsoluteFill>;
};
const AuditShot: React.FC = () => {
  const t = useT(), z = 1 + 0.22 * eo(pr(t, 34.6, 0.5)) * (1 - eo(pr(t, 35.56, 0.4)));
  return <><Glow tone="#4a2c00" /><Browser url="skills.sh/vercel-labs/skills/find-skills" name="r7_audit" vt={mapT(t, [[34.18, 1.15], [34.5, 1.67], [34.74, 1.95], [35.58, 3.3], [35.68, 3.57], [36.1, 4.17], [36.3, 4.7], [36.56, 5.0], [37.04, 6.0]])} zoom={z} fx={20} fy={200} glow="#FFB02055">
    <div style={{position: 'absolute', left: 452, top: 178, transform: `scale(${pop(t, 34.86, 0.3) * (1 - pr(t, 35.5, 0.12))})`, transformOrigin: '0 50%'}}><Pill bg={AMBER} color="#2a1800" size={30}>WHO PUBLISHED IT</Pill></div>
    <div style={{position: 'absolute', left: 420, top: 416, transform: `scale(${pop(t, 36.34, 0.3)})`, transformOrigin: '0 50%'}}><Pill bg={AMBER} color="#2a1800" size={30}>THEN THE AUDITS</Pill></div>
  </Browser></>;
};

// ------------------------------------------------------------------ beat 10: comment LIBRARY
const Heart: React.FC<{x: number; delay: number; base: number}> = ({x, delay, base}) => { const t = useT(), p = pr(t, 39.02 + delay, 1.5); if (p <= 0 || p >= 1) return null;
  return <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: x + Math.sin(p * 7 + delay * 9) * 22, top: base - p * 420, opacity: Math.min(1, 4 * p) * (1 - p), transform: `scale(${0.7 + p * 0.6})`}}><path fill={delay * 10 % 2 < 1 ? RED : '#ff7ab2'} d="M12 21s-7.500-4.600-9.600-9.300C.900 8.200 2.800 4.500 6.400 4.500c2 0 3.400 1 4.300 2.300l1.300 1.800 1.300-1.800c.900-1.300 2.300-2.300 4.300-2.300 3.600 0 5.500 3.700 4 7.200C19.500 16.400 12 21 12 21z" /></svg>; };
const CommentBox: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const t = useT(), typed = 'LIBRARY'.slice(0, Math.floor(pr(t, 38.3, 0.56) * 7.99));
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: 128, borderRadius: 64, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
    <Img src={A('avatar_thumb.jpg')} style={{width: 92, height: 92, borderRadius: 46, objectFit: 'cover'}} />
    <div style={{flex: 1, marginLeft: 22, fontFamily: typed ? disp : ui, fontWeight: typed ? 900 : 600, fontSize: typed ? 58 : 44, color: typed ? '#111' : '#9aa3b5', letterSpacing: typed ? 2 : 0}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: '#3B82F6', fontWeight: 500}}>|</span></div>
    <div style={{background: '#3B82F6', color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '18px 36px', borderRadius: 44, transform: `scale(${1 + 0.14 * (t >= 38.98 ? 1 - eo(pr(t, 38.98, 0.3)) : 0)})`}}>Post</div>
  </div>;
};
const DmCard: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const t = useT(), dm = eo(pr(t, 39.3, 0.36));
  return <div style={{position: 'absolute', left: x, top: y + (1 - dm) * 80, width: w, height: 236, borderRadius: 34, background: '#111a2e', border: '2px solid #2a3657', padding: '22px 28px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000c', opacity: dm}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('avatar_thumb.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}} />
      <span style={{fontFamily: ui, fontWeight: 800, fontSize: 38, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: ui, fontWeight: 700, fontSize: 28, color: MUTED}}>· Direct message</span></div>
    <div style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 16, background: '#3B82F6', color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 44, padding: '20px 30px', borderRadius: '8px 30px 30px 30px', whiteSpace: 'nowrap'}}>
      <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.500 1.500" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.500-1.500" /></svg>Your find-skills setup</div>
  </div>;
};
const CtaScene: React.FC = () => {
  const t = useT(), n = Math.floor(pr(t, 38.3, 0.56) * 7.99), on = t >= 37.44;
  return <><Glow tone="#12357a" at="50% 40%" />
    <div style={{position: 'absolute', left: WX, top: 290, width: WW, height: 144, borderRadius: 44, background: '#0c1730f0', border: '2px solid #2a3657', display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 100, height: 100, borderRadius: 50, objectFit: 'cover', border: `4px solid ${MINT}`}} />
      <span style={{marginLeft: 22, fontFamily: ui, fontWeight: 800, fontSize: 44, color: '#fff', letterSpacing: -0.5}}>withhammad.ai</span>
      <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, background: on ? '#1c2742' : '#3B82F6', border: on ? `3px solid ${MINT}` : '3px solid #3B82F6', color: on ? MINT : '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '14px 24px', borderRadius: 40,
        transform: `scale(${1 + 0.2 * (on ? 1 - eo(pr(t, 37.44, 0.32)) : 0)})`}}>{on ? 'Following' : 'Follow'}{on && <Tick size={34} color={MINT} />}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 506, textAlign: 'center', fontFamily: disp, fontWeight: 900, fontSize: 176, lineHeight: '200px', letterSpacing: 2, whiteSpace: 'nowrap'}}>
      {'LIBRARY'.split('').map((c, i) => <span key={i} style={{display: 'inline-block', color: i < n ? '#fff' : 'transparent', WebkitTextStroke: i < n ? undefined : '3px #ffffff40', transform: `scale(${i < n ? 1 + 0.2 * (1 - eo(pr(t, 38.3 + i * 0.07, 0.25))) : 1})`, textShadow: i < n ? `0 0 50px ${MINT}88` : undefined}}>{c}</span>)}</div>
    <CommentBox x={WX} y={782} w={WW} />
    <div style={{position: 'absolute', left: WX, top: 986, width: WW, height: 236, borderRadius: 34, border: '4px dashed #ffffff30', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - pr(t, 39.3, 0.2)}}>
      <svg width={110} height={110} viewBox="0 0 24 24" style={{opacity: 0.35 + 0.25 * Math.sin(t * 6), transform: `translate(${Math.sin(t * 3) * 8}px,${-Math.sin(t * 3) * 8}px)`}}><path d="M21.500 2.500L10.500 13.500M21.500 2.500l-7 19-4-8-8-4z" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinejoin="round" strokeLinecap="round" /></svg></div>
    {[[170, 0], [420, 0.25], [640, 0.1], [860, 0.4], [300, 0.6], [760, 0.75]].map(([x, d], i) => <Heart key={i} x={x} delay={d} base={770} />)}
    <DmCard x={WX} y={986} w={WW} />
  </>;
};

// ------------------------------------------------------------------ captions: Montserrat Black caps, a serif key noun, mint / green / red accents
// A group is one or two stacked lines; each line appears on its first word, the group clears when the next one starts.
// Marks: *mint*  ^green^ (numbers)  !red! (loss words)  _serif lowercase_ (key noun). Word indices follow voice/words.json.
type Line = [number, number, string];
const HOOK_GROUPS: Line[][] = [[[0, 5, 'THE MOST USEFUL'], [6, 7, '_claude skill_']], [[8, 10, 'ON THE PLANET?']]];
const GROUPS: Line[][] = [
  [[11, 13, 'A SKILL THAT'], [14, 14, '*FINDS*']], [[15, 16, '*OTHER SKILLS*'], [17, 18, '_for you_']],
  [[25, 28, 'AND IT WORKS LIKE'], [29, 31, '*A SEARCH ENGINE*']], [[32, 34, 'FOR _claude skills_']],
  [[35, 36, 'IT SEARCHES'], [37, 38, 'A _directory_']], [[39, 40, 'OF OVER'], [41, 43, '^A MILLION SKILLS^']],
  [[44, 46, 'SO INSTEAD OF'], [47, 48, '!HUNTING AROUND!']], [[49, 52, 'FOR THE _right one_']],
  [[53, 54, 'YOU JUST'], [55, 56, '*TELL CLAUDE*']], [[57, 58, "WHAT YOU'RE"], [59, 61, 'TRYING _to do_']],
  [[62, 63, 'WRITE CONTENT']], [[64, 66, '*BUILD AN APP*']], [[67, 68, '_research something_']],
  [[69, 70, 'IT SEARCHES'], [71, 72, '*THE DIRECTORY*']], [[73, 74, 'SHOWS THE'], [75, 76, '*MOST INSTALLED*']], [[77, 78, 'SKILLS FOR'], [79, 80, '_that task_']],
  [[81, 83, 'AND ADDS THEM'], [84, 85, '*STRAIGHT INTO*']], [[86, 87, '^YOUR SETUP^']],
  [[88, 90, 'IT HAS PASSED'], [91, 93, '^4 MILLION INSTALLS^']], [[94, 96, 'THE *MOST INSTALLED*'], [97, 99, '_skill of all_']],
  [[102, 103, 'CHECK WHO'], [104, 106, '*PUBLISHED A SKILL*']], [[107, 108, 'BEFORE YOU'], [109, 110, '*INSTALL IT*']],
  [[111, 113, 'FOLLOW ME AND'], [114, 115, 'COMMENT *LIBRARY*']], [[116, 119, "AND I'LL SEND YOU"], [120, 122, 'THE *FULL SETUP*']],
];
const CUTS = [3.52, 6.41, 8.6, 11.27, 14.41, 16.8, 19.08, 20.24, 21.16, 22.25, 23.9, 26.5, 28.65, 31.16, 33.17, 34.18, 37.04, 99];
const LIGHT: [number, number][] = [[3.52, 6.41], [8.6, 11.27], [16.8, 19.08], [23.9, 28.65]];
const MARK: Record<string, string> = {'*': MINT, '^': GREEN, '!': RED};
const WIDE = 'MW', MID = 'OQGCDAVNUHKXY&', THIN = "I1'.,:!";
const units = (s: string) => { let u = 0, ser = false;   // estimated width in em of the caps size, to fit a line into the safe width
  for (const c of s) { if (c === '_') { ser = !ser; continue; } if (c in MARK) continue;
    u += ser ? (c === ' ' ? 0.3 : 'mw'.includes(c) ? 0.98 : 'iljt'.includes(c) ? 0.42 : 0.66) : c === ' ' ? 0.32 : WIDE.includes(c) ? 1.02 : MID.includes(c) ? 0.84 : THIN.includes(c) ? 0.4 : 0.74; }
  return u; };
const CapLine: React.FC<{text: string; box: boolean; s: number}> = ({text, box, s}) => {
  const size = Math.min(82, 740 / (units(text) * 1.04)), out: React.ReactNode[] = []; let buf = '', mode = '';
  const flush = (k: number) => { if (!buf) return; out.push(mode === '_' ? <span key={k} style={{fontFamily: serif, fontWeight: 700, fontSize: size * 1.3, letterSpacing: -1}}>{buf}</span> : <span key={k} style={{color: MARK[mode]}}>{buf}</span>); buf = ''; };
  [...text].forEach((c, k) => { if (c === '_' || c in MARK) { flush(k); mode = mode === c ? '' : c; } else buf += c; }); flush(text.length);
  return <div style={{height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{display: 'inline-block', whiteSpace: 'nowrap', fontFamily: disp, fontWeight: 900, fontSize: size, lineHeight: '92px', height: 92, color: '#fff', letterSpacing: 0.5, transform: `scale(${s})`,
      ...(box ? {background: '#16161cec', borderRadius: 18, padding: '0 26px', boxShadow: '0 10px 30px #0005'} : {textShadow: '0 4px 0 #0008,0 10px 30px #000'})}}>{out}</div></div>;
};
const Captions: React.FC<{words: Word[]; avatar: boolean}> = ({words, avatar}) => {
  const t = useT(), all = (avatar ? HOOK_GROUPS : []).concat(GROUPS);
  const st = all.map(g => words[g[0][0]].startMs / 1000 - 0.04);
  const i = all.findIndex((g, k) => { const last = g[g.length - 1], e0 = words[last[1]].endMs / 1000, cut = CUTS.find(c => c > e0 - 0.05) ?? 99;
    return t >= st[k] && t < Math.min(e0 + 0.4, cut, k + 1 < all.length ? st[k + 1] : 99); });
  if (i < 0) return null;
  const top = avatar && t < SLOTS.hook[1] ? SEAM - 96 : avatar && t >= SLOTS.ending[0] ? 1040 : CAP, box = (avatar && (t < SLOTS.hook[1] || t >= SLOTS.ending[0])) || LIGHT.some(([a, b]) => t >= a && t < b);
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 45}}>
    {all[i].map((l, k) => { const at = words[l[0]].startMs / 1000 - 0.04; return t < at ? null : <CapLine key={k} text={l[2]} box={box} s={1 + 0.08 * (1 - eo(pr(t, at, 0.12)))} />; })}
  </div>;
};

export const SkillFinder: React.FC<SkillFinderProps> = ({words, skillsTotal, installs, avatar, avatarTop = -250}) => {
  const t = useT(), face = !!avatar, H0 = SLOTS.hook[1], E0 = SLOTS.ending[0];
  return <AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    {avatar ? <>
      <Scene s={0} e={1.2} z={1} h={SEAM}><Glow tone="#16224a" at="50% 60%" /><RankShot y={268} visH={SEAM - 268 - BAR} /></Scene>
      <Scene s={1.2} e={3.52} z={2} h={SEAM}><Glow tone="#16224a" at="50% 60%" /><Swarm top={252} big={false} total={skillsTotal} /></Scene>
      <Scene s={3.52} e={H0} z={3} h={SEAM}><Pastel /><Tasks top={272} h={500} /></Scene>
      {t < H0 + 0.32 && <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1056, overflow: 'hidden', zIndex: 4}}><Avatar src={avatar} phase="hook" top={avatarTop} /></div>}
      {t < H0 && <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 3, height: 6, background: '#05070f', zIndex: 4}} />}
    </> : <>
      <Scene s={0} e={1.2} z={1}><Glow tone="#16224a" at="50% 58%" /><RankShot y={668} visH={756} /><HookTitle /></Scene>
      <Scene s={1.2} e={3.52} z={2}><Glow tone="#16224a" at="50% 58%" /><Swarm top={668} big total={skillsTotal} /><HookTitle /></Scene>
      <Scene s={3.52} e={H0} z={3}><Pastel /><Tasks top={290} h={930} /></Scene>
    </>}
    <Scene s={H0} e={8.6} z={5}><VercelCard /></Scene>
    <Scene s={8.6} e={11.27} z={6} dir="u"><EngineCard total={skillsTotal} /></Scene>
    <Scene s={11.27} e={14.41} z={7}><DirectoryShot total={skillsTotal} /></Scene>
    <Scene s={14.41} e={16.8} z={8}><HuntShot /></Scene>
    <Scene s={16.8} e={19.08} z={9} dir="r"><TellClaude /></Scene>
    <Scene s={19.08} e={20.24} z={10}><Flash name="r4a_copywriting" url="skills.sh/coreyhaines31/marketingskills/copywriting" s={19.08} tone="#5a2a16" /></Scene>
    <Scene s={20.24} e={21.16} z={11} dir="r"><Flash name="r4b_frontend_design" url="skills.sh/anthropics/skills/frontend-design" s={20.24} tone="#1d2f6b" /></Scene>
    <Scene s={21.16} e={22.25} z={12} dir="r"><Flash name="r4c_research" url="skills.sh/mattpocock/skills/research" s={21.16} tone="#0f4a43" /></Scene>
    <Scene s={22.25} e={23.9} z={13}><SearchShot /></Scene>
    <Scene s={23.9} e={26.5} z={14} dir="u"><ResultsCard /></Scene>
    <Scene s={26.5} e={28.65} z={15} dir="l"><SetupCard /></Scene>
    <Scene s={28.65} e={31.16} z={16}><InstallsShot installs={installs} /></Scene>
    <Scene s={31.16} e={33.17} z={17}><TopShot /></Scene>
    <Scene s={33.17} e={34.18} z={18}><RuleCard /></Scene>
    <Scene s={34.18} e={E0} z={19}><AuditShot /></Scene>
    <Scene s={E0} e={99} z={20}>{avatar ? <><Avatar src={avatar} phase="ending" top={0} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, height: 1020, background: 'linear-gradient(transparent,#07090dd0 44%)'}} />
      {t < 39.3 ? <CommentBox x={70} y={1262} w={870} /> : <DmCard x={70} y={1254} w={870} />}</> : <CtaScene />}</Scene>
    <div style={{position: 'absolute', left: WX, top: 226, zIndex: 46, background: '#0a0f1ed0', color: '#e6ecfb', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <Captions words={words} avatar={face} />
  </AbsoluteFill>;
};
