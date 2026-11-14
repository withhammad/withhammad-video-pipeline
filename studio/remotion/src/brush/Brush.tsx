// BRUSH reel (job 821164afb6b1, comment keyword BRUSH): Claude Code paints hand-drawn animations. Voice-over edit.
// Every time below is a spoken-word time from the recorded narration (words.json), in seconds.
// Every painting on screen (x/r1..r12.mp4) was written by Claude in Claude Code with ClaudeAnimationBase (p5.js +
// p5.brush) and rendered by the kit's own renderer in headless Chrome on the GPU (job work/paint_log.md). The GitHub
// pages are real recordings made on 14 Nov 2026. Figures (2,970 stars, 288 forks, Pro $20 / $17 a month) were read
// that day from api.github.com and claude.com/pricing.
// Presenter: optional. With `avatar` (a video under the public dir whose time 0 = narration 0 for the hook and which
// continues with the ending, see SLOTS) the hook becomes a split screen then a full-frame presenter, and the ending a
// full-frame presenter under the keyword; without it both are full-frame paintings and motion graphics.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type BrushProps = {words: Word[]; stars: number; forks: number; avatar?: string; avatarTop?: number};
// Presenter slots in narration seconds, cut in the middle of the pauses after "...draw a line!" and before "Want the kit?".
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 4.73], ending: [43.37, 46.4]};

const FPS = 30, SEAM = 812;
const INK = '#141118', PAPER = '#F3EBDC', YEL = '#F3D010', CLAY = '#D97757', GREEN = '#4ADE80', RED = '#E5484D', MUTED = '#a39cae';
const disp = 'Montserrat', anton = 'Anton', ui = 'Inter', mono = 'JetBrains Mono';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.34) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mapT = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
// Length in seconds of each painting clip (24 fps renders).
const LEN: Record<string, number> = {r1: 6, r2: 6, r3: 6, r4: 3, r5: 3, r6: 2.5, r7: 2.5, r8: 3, r9: 2, r10: 5, r11: 3, r12: 2};

// ------------------------------------------------------------------ shared pieces
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; h?: number}>> = ({s, e, z, h = 1920, children}) => {
  const t = useT(); if (t < s || t >= e) return null;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden', zIndex: z}}>{children}</div>;
};
// One painting clip at clip time ct. Full frame by default; in a box it covers the box, centred on clip point (540, fy).
const Paint: React.FC<{id: string; ct: number; w?: number; h?: number; fy?: number; zoom?: number}> = ({id, ct, w = 1080, h = 1920, fy = 960, zoom = 1}) => {
  const s = Math.max(w / 1080, h / 1920) * zoom, top = cl(h / 2 - fy * s, h - 1920 * s, 0);
  return <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: PAPER}}>
    <Freeze frame={Math.round(cl(ct, 0, LEN[id] - 1 / 24) * FPS)}><OffthreadVideo muted src={A(id + '.mp4')} style={{position: 'absolute', left: (w - 1080 * s) / 2, top, width: 1080 * s, height: 1920 * s}} /></Freeze>
  </div>;
};
const Studio: React.FC<{tone?: string}> = ({tone = '#3a2330'}) => <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 38%,${tone},${INK} 72%)`}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#ffffff12 1.4px,transparent 1.6px)', backgroundSize: '36px 36px'}} /></AbsoluteFill>;
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; font?: string; style?: React.CSSProperties}>> = ({children, bg = YEL, color = '#17130f', size = 30, font = disp, style}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.35, background: bg, color, fontFamily: font, fontWeight: 900, fontSize: size, padding: `${size * 0.3}px ${size * 0.66}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string; ink?: string}> = ({size = 36, color = GREEN, ink = '#06210f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Star: React.FC<{size: number; color: string}> = ({size, color}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><path fill={color} d="M12 2.200l2.950 6.300 6.850.850-5.050 4.700 1.350 6.800L12 17.450 5.900 20.850l1.350-6.800L2.200 9.350l6.850-.850z" /></svg>;
const Lock: React.FC = () => <svg width={18} height={18} viewBox="0 0 24 24" style={{flexShrink: 0}}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="#7d8799" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#7d8799" strokeWidth="2.4" /></svg>;
const Icon: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => <Img src={A('claude-app-icon.png')} style={{width: size, height: size, borderRadius: size * 0.225, display: 'block', flexShrink: 0, ...style}} />;
const Dots: React.FC = () => <>{['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, flexShrink: 0}} />)}</>;
// A window frame: title bar (dots + title or url) over a content area.
const Win: React.FC<React.PropsWithChildren<{x: number; y: number; w: number; h: number; title: React.ReactNode; url?: boolean; light?: boolean; style?: React.CSSProperties}>> = ({x, y, w, h, title, url, light, style, children}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, overflow: 'hidden', background: light ? '#fbf8f2' : '#0f0d13', boxShadow: '0 0 0 2px #2c2833,0 40px 90px #000c', ...style}}>
    <div style={{height: 56, background: light ? '#e9e3d8' : '#1d1a22', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px'}}><Dots />
      {url ? <div style={{marginLeft: 14, flex: 1, height: 36, borderRadius: 18, background: '#0b0a0e', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontWeight: 500, fontSize: 21, color: '#cfd3e6', whiteSpace: 'nowrap', overflow: 'hidden'}}><Lock />{title}</div>
        : <div style={{marginLeft: 14, flex: 1, textAlign: 'center', marginRight: 60, fontFamily: ui, fontWeight: 700, fontSize: 22, color: light ? '#6d6577' : '#a8a2b4', whiteSpace: 'nowrap', overflow: 'hidden'}}>{title}</div>}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 56, bottom: 0, overflow: 'hidden'}}>{children}</div>
  </div>;
// A real screen recording (1080x1120) inside a window, frozen at recording time vt; zoom pushes in toward (fx, fy).
const Rec: React.FC<{name: string; vt: number; w: number; zoom?: number; fx?: number; fy?: number}> = ({name, vt, w, zoom = 1, fx = 0, fy = 0}) =>
  <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: w, height: w * 1120 / 1080, transform: `scale(${zoom})`, transformOrigin: `${fx}px ${fy}px`}} /></Freeze>;

// ------------------------------------------------------------------ presenter (only when the `avatar` prop is set)
const Avatar: React.FC<{src: string; phase: 'hook' | 'ending'; top: number}> = ({src, phase, top}) => {
  const t = useT(), a = phase === 'hook' ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#20242c'}}>
    <Freeze frame={Math.round(a * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover'}} /></Freeze>
  </div>;
};

// ------------------------------------------------------------------ beat 1: the hook (on screen from frame 0)
const HookTitle: React.FC<{top: number}> = ({top}) => {
  const t = useT(); if (t >= 2.66) return null;
  const k = (at: number) => 1 + 0.07 * (t >= at ? 1 - eo(pr(t, at, 0.28)) : 0), out = eo(pr(t, 2.42, 0.22));
  const box: React.CSSProperties = {display: 'inline-flex', alignItems: 'center', gap: 22, fontFamily: disp, fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 16px 40px #0007', borderRadius: 18};
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 40, textAlign: 'center', opacity: 1 - out, transform: `translateY(${-out * 40}px)`}}>
    <div style={{transform: `scale(${k(0)})`}}><div style={{...box, background: INK, color: '#fff', fontSize: 84, padding: '12px 34px 12px 18px'}}><Icon size={92} />CLAUDE CODE</div></div>
    <div style={{marginTop: 14, transform: `scale(${k(0.62)})`}}><div style={{...box, background: INK, color: '#fff', fontSize: 70, padding: '8px 34px'}}>CAN PAINT</div></div>
    <div style={{marginTop: 14, transform: `scale(${k(1.16)})`}}><div style={{...box, background: YEL, color: '#17130f', fontSize: 54, padding: '12px 30px'}}>HAND-DRAWN ANIMATIONS</div></div>
  </div>;
};
const HookPaintings: React.FC<{h: number; fy: number}> = ({h, fy}) => {
  const t = useT();
  return t < 0.74 ? <Paint id="r1" ct={4.4 + t} h={h} fy={fy} /> : t < 1.6 ? <Paint id="r4" ct={0.2 + t - 0.74} h={h} fy={fy} /> : <Paint id="r5" ct={0.1 + t - 1.6} h={h} fy={fy + 120} />;
};

// ------------------------------------------------------------------ beat 3: the kit on GitHub, then Claude Code
const GithubTop: React.FC<{stars: number; forks: number}> = ({stars, forks}) => {
  const t = useT(), z = 1 + 0.07 * eo(pr(t, 4.76, 2.1)), chip = pop(t, 6.2, 0.32);
  return <><Studio tone="#2b2f3a" />
    <Win x={90} y={292} w={900} h={956} title="github.com/JohnHeibel/ClaudeAnimationBase" url light>
      <Rec name="gh_top" vt={mapT(t, [[4.73, 0.2], [6.46, 0.5], [6.5, 0.86], [6.92, 1.4]])} w={900} zoom={z} fx={450} fy={500} />
    </Win>
    {chip > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1186, display: 'flex', justifyContent: 'center', transform: `scale(${chip})`, zIndex: 3}}>
      <Pill bg="#17151c" color="#fff" size={34} font={ui} style={{border: '2px solid #3a3644', boxShadow: '0 16px 40px #000a'}}>
        <Star size={34} color={YEL} /><span style={{fontVariantNumeric: 'tabular-nums'}}>{fmt(stars * eo(pr(t, 6.24, 0.6)))}</span><span style={{fontWeight: 700, color: MUTED}}>stars</span>
        <span style={{color: '#5d5868'}}>·</span><span>{forks}</span><span style={{fontWeight: 700, color: MUTED}}>forks</span></Pill></div>}
  </>;
};
const PENCIL = <svg viewBox="0 0 150 26" width={300} height={52} style={{display: 'block'}}><polygon points="0,13 22,4 22,22" fill="#E9C8A0" /><polygon points="0,13 8,10 8,16" fill="#2B2724" />
  <rect x="22" y="4" width="104" height="18" fill="#F2B640" /><rect x="22" y="4" width="104" height="6" fill="#F7CB62" /><rect x="126" y="4" width="10" height="18" fill="#B9B9B9" /><rect x="136" y="4" width="14" height="18" rx="4" fill="#E58F8F" /></svg>;
const IconTile: React.FC = () => {
  const t = useT(), ct = t - 6.92, k = eo(pr(ct, 0.15, 0.6)), tipX = 780 - 456 * k, s = 0.94 + 0.06 * eo(pr(t, 6.92, 0.3));
  return <><Paint id="r12" ct={ct} />
    <div style={{position: 'absolute', left: 330, top: 690, transform: `scale(${s})`, filter: 'drop-shadow(0 22px 34px #5a3c2040)'}}><Icon size={420} /></div>
    <div style={{position: 'absolute', left: tipX - 4, top: 1166, transform: 'rotate(-8deg)', transformOrigin: '0 50%', opacity: pr(ct, 0.05, 0.1)}}>{PENCIL}</div>
  </>;
};

// ------------------------------------------------------------------ beats 4 and 5: the setup
const STEPS: [string, number][] = [['Clone it', 10.38], ['Open Claude Code', 11.09], ['Describe your scene', 12.25]];
const Setup: React.FC = () => {
  const t = useT(), url = 'https://github.com/JohnHeibel/ClaudeAnimationBase', l1 = 'git clone', l3 = 'cd ClaudeAnimationBase && claude';
  const n1 = Math.floor(pr(t, 10.38, 0.34) * (l1.length + url.length + 0.99)), n3 = Math.floor(pr(t, 11.1, 0.5) * (l3.length + 0.99));
  const cur = (on: boolean) => <span style={{opacity: on && Math.floor(t * 4) % 2 ? 1 : 0, color: CLAY}}>▍</span>;
  return <><Studio tone="#3b2a22" />
    <div style={{position: 'absolute', left: 90, top: 286, fontFamily: disp, fontWeight: 900, fontSize: 92, color: '#fff', letterSpacing: 1, transform: `scale(${pop(t, 9.16, 0.36)})`, transformOrigin: '0 50%'}}>THE <span style={{color: YEL}}>SETUP</span></div>
    {STEPS.map(([label, at], i) => { const on = t >= at, show = pop(t, 9.4 + i * 0.1, 0.3);
      return <div key={label} style={{position: 'absolute', left: 90, top: 420 + i * 104, height: 88, display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${show * (on ? 1 + 0.06 * (1 - eo(pr(t, at, 0.3))) : 1)})`, transformOrigin: '0 50%', opacity: on ? 1 : 0.42}}>
        <div style={{width: 72, height: 72, borderRadius: 36, background: on ? YEL : 'transparent', border: on ? 'none' : '3px solid #5d5868', color: on ? '#17130f' : MUTED, fontFamily: disp, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
        <div style={{fontFamily: ui, fontWeight: 800, fontSize: 52, color: '#fff', whiteSpace: 'nowrap'}}>{label}</div>
        {i === 1 && <Icon size={60} style={{opacity: on ? 1 : 0.5}} />}
      </div>; })}
    <Win x={70} y={780} w={940} h={330} title="Terminal">
      <div style={{padding: '26px 30px', fontFamily: mono, fontWeight: 500, fontSize: 29, lineHeight: '50px', color: '#efeaf6', whiteSpace: 'pre'}}>
        <div><span style={{color: GREEN}}>~ % </span>{l1.slice(0, n1)}{n1 <= l1.length && cur(t < 10.38 || n1 < l1.length)}</div>
        <div style={{color: '#ffd9a8', fontWeight: 700}}>{'  '}{url.slice(0, Math.max(0, n1 - l1.length))}{n1 > l1.length && t < 10.8 && cur(true)}</div>
        <div style={{color: MUTED, opacity: t >= 10.78 ? 1 : 0}}>Cloning into 'ClaudeAnimationBase'...</div>
        <div style={{opacity: t >= 10.9 ? 1 : 0}}><span style={{color: GREEN}}>~ % </span>{l3.slice(0, n3)}{t >= 10.9 && cur(true)}</div>
      </div>
    </Win>
  </>;
};

// ------------------------------------------------------------------ beats 5 and 6: describe your scene (three prompts) over their paintings
const PREFIX = 'Read ANIMATION_GUIDE.md, then paint ';
// [first word, last word, clear time, painting, clip-time map, focus y]
const PROMPTS: [number, number, number][] = [[37, 42, 16.4], [43, 47, 18.55], [48, 51, 99]];
const typed = (words: Word[], a: number, b: number, t: number) => {
  let s = ''; for (let i = a; i <= b; i++) { const w = words[i], st = w.startMs / 1000 - 0.03, en = Math.max(st + 0.12, w.endMs / 1000 - 0.05), txt = w.text.replace(/[,.!?:]+$/, '');
    if (t < st) break; s += (i > a ? ' ' : '') + txt.slice(0, Math.ceil(pr(t, st, en - st) * txt.length)); }
  return s;
};
const Prompt: React.FC<{words: Word[]}> = ({words}) => {
  const t = useT(), p = eo(pr(t, 13.72, 0.36)), k = PROMPTS.findIndex(([, , clr]) => t < clr), [a, b] = PROMPTS[Math.max(0, k)];
  const text = t < 13.9 ? '' : typed(words, a, b, t).toLowerCase(), wy = 560 - 270 * p, wh = 430 - 90 * p;
  const pid = t < 16.4 ? 'r1' : t < 18.55 ? 'r2' : 'r3', ct = pid === 'r1' ? 0.15 + (t - 13.95) * 1.3 : pid === 'r2' ? 0.35 + (t - 16.4) : 0.05 + (t - 18.55) * 1.2, fy = pid === 'r1' ? 930 : pid === 'r2' ? 880 : 1120;
  return <><Studio tone="#2e2440" />
    {p > 0 && <div style={{position: 'absolute', left: 70, top: 690 + (1 - p) * 700, width: 940, height: 640, borderRadius: 28, overflow: 'hidden', boxShadow: '0 0 0 2px #2c2833,0 40px 90px #000c'}}>
      <Paint id={pid} ct={ct} w={940} h={640} fy={fy} />
      <div style={{position: 'absolute', left: 18, top: 18, background: '#141118d8', color: '#e9e4f2', fontFamily: mono, fontWeight: 500, fontSize: 21, padding: '6px 12px', borderRadius: 8}}>out/clips/{pid}.mp4</div></div>}
    <Win x={70} y={wy} w={940} h={wh} title="claude · ~/ClaudeAnimationBase">
      <div style={{position: 'absolute', left: 26, right: 26, top: 24, bottom: 24, border: '2px solid #4a4455', borderRadius: 16, padding: '18px 22px', fontFamily: mono, fontWeight: 500, fontSize: 34, lineHeight: '48px', color: '#f4f0fa'}}>
        <span style={{color: CLAY, fontWeight: 700}}>&gt; </span><span style={{color: MUTED}}>{PREFIX}</span><span style={{fontWeight: 700}}>{text}</span><span style={{color: CLAY, opacity: Math.floor(t * 4) % 2 ? 1 : 0.15}}>▍</span>
      </div>
    </Win>
    {t < 13.9 && <div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center', transform: `scale(${pop(t, 12.46, 0.32) * (1 - p)})`}}><Pill size={40}>describe your scene</Pill></div>}
  </>;
};

// ------------------------------------------------------------------ beat 7: what Claude painted
const TILES: [string, number, string, number][] = [['r1', 4.6, 'a pencil skyline that draws itself', 930], ['r2', 2.4, 'a charcoal falcon taking off', 1300], ['r3', 3.0, 'a watercolour desert sunset', 1150],
  ['r6', 0.6, '', 1250], ['r10', 1.5, '', 1000], ['r9', 0.2, '', 1050]];
const Gallery: React.FC = () => {
  const t = useT(), lt = t - 21.0, dy = -36 * eo(pr(t, 21.0, 1.8));
  return <AbsoluteFill style={{background: '#E7E1F3'}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(#b9aedb55 1.5px,transparent 1.5px),linear-gradient(90deg,#b9aedb55 1.5px,transparent 1.5px)', backgroundSize: '54px 54px'}} />
    <div style={{position: 'absolute', left: 90, top: 280, fontFamily: mono, fontWeight: 700, fontSize: 24, color: '#4b3f6e', letterSpacing: 0.5, opacity: pr(t, 21.05, 0.2)}}>10 paintings · 1080x1920 · 24 fps · ClaudeAnimationBase</div>
    {TILES.map(([id, c0, cap, fy], i) => { const s = pop(t, 21.08 + i * 0.09, 0.3), x = 85 + (i % 2) * 480, y = 330 + Math.floor(i / 2) * 340 + dy, ct = id === 'r9' ? (c0 + lt) % 2 : c0 + lt;
      return <div key={id} style={{position: 'absolute', left: x, top: y, width: 430, height: 310, background: '#fff', borderRadius: 14, padding: 10, boxSizing: 'border-box', boxShadow: '0 16px 36px #4b3f6e33', transform: `scale(${s}) rotate(${(i % 2 ? 1 : -1) * 0.8}deg)`}}>
        <div style={{position: 'relative', width: 410, height: 290, borderRadius: 6, overflow: 'hidden'}}><Paint id={id} ct={ct} w={410} h={290} fy={fy} zoom={1.25} />
          {cap && <div style={{position: 'absolute', left: 8, bottom: 8, background: '#141118d8', color: '#fff', fontFamily: mono, fontWeight: 500, fontSize: 17, padding: '5px 9px', borderRadius: 7, whiteSpace: 'nowrap'}}>{cap}</div>}</div>
      </div>; })}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beat 9: eleven brushes
const BRUSHES = ['pen', 'rotring', '2B', 'HB', '2H', 'cpencil', 'pastel', 'crayon', 'charcoal', 'spray', 'marker'];
const BrushChart: React.FC = () => {
  const t = useT(), ct = t - 28.15;
  return <><Paint id="r11" ct={ct} />
    <div style={{position: 'absolute', left: 90, top: 282, fontFamily: mono, fontWeight: 700, fontSize: 48, color: '#1F1E1C', transform: `scale(${pop(t, 28.36, 0.34)})`, transformOrigin: '0 50%'}}>p5.brush <span style={{color: '#A0522D'}}>· 11 brushes</span></div>
    {BRUSHES.map((n, i) => { const at = 28.15 + 0.15 + i * 0.12, hl = (i >= 2 && i <= 4 && t >= 30.06) || (i === 8 && t >= 30.44), hat = i === 8 ? 30.44 : 30.06;
      return <div key={n} style={{position: 'absolute', left: 80, top: 425 + i * 86 - 25, height: 50, display: 'flex', alignItems: 'center', transform: `scale(${pop(t, at, 0.26) * (hl ? 1 + 0.12 * (1 - eo(pr(t, hat, 0.3))) : 1)})`, transformOrigin: '0 50%'}}>
        <div style={{background: hl ? YEL : '#1F1E1C', color: hl ? '#17130f' : '#F4EFE4', fontFamily: mono, fontWeight: 700, fontSize: 27, padding: '7px 16px', borderRadius: 10}}>{n}</div></div>; })}
  </>;
};

// ------------------------------------------------------------------ beat 10: no video model, Claude writes code, the browser paints every frame
const NoModel: React.FC = () => {
  const t = useT(), x = eo(pr(t, 33.6, 0.3)), dim = pr(t, 33.62, 0.3);
  return <><Studio tone="#2a2a3a" />
    <div style={{position: 'absolute', left: 240, top: 400, width: 600, height: 560, borderRadius: 40, background: '#1f1c26', border: '3px solid #3a3644', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34,
      transform: `scale(${(0.92 + 0.08 * eo(pr(t, 33.15, 0.3))) * (1 - 0.04 * dim)})`, filter: `grayscale(${dim}) brightness(${1 - 0.35 * dim})`}}>
      <svg width={260} height={190} viewBox="0 0 26 19"><rect x="0.5" y="0.5" width="25" height="18" rx="2.5" fill="#6b5bd6" /><g fill="#1f1c26">{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} x={2 + i * 4} y="1.6" width="2" height="1.6" rx=".4" />)}{[0, 1, 2, 3, 4, 5].map(i => <rect key={'b' + i} x={2 + i * 4} y="15.8" width="2" height="1.6" rx=".4" />)}</g><path d="M10.5 6.2l6 3.3-6 3.3z" fill="#fff" /></svg>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 54, color: '#fff'}}>AI video model</div>
    </div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}><path d="M260 980L820 380" stroke={RED} strokeWidth={34} strokeLinecap="round" strokeDasharray={830} strokeDashoffset={830 * (1 - x)} /></svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', transform: `scale(${pop(t, 33.82, 0.34)}) rotate(-5deg)`}}>
      <div style={{display: 'inline-block', fontFamily: disp, fontWeight: 900, fontSize: 78, color: '#fff', background: RED, padding: '8px 40px', borderRadius: 24, border: '7px solid #fff', boxShadow: '0 20px 50px #000a'}}>NO VIDEO MODEL</div></div>
  </>;
};
// The real lines 356-365 of work/ClaudeAnimationBase/src/scenes/withhammad_brush.js (the pencil line under the icon).
const CODE = ['  LOOPS.r12 = t => {', '    const k = easeOut(seg(t, .15, .75));', '    if (k <= 0) return;', "    boilSeed('line');", '    const P = [];', '    for (let j = 0; j <= 8; j++)',
  '      P.push([780 - j * 57, 1190 + 4 * Math.sin(j * 1.1) + j * 1.2]);', '    const Q = partial(P, k);', "    if (Q.length >= 2) inkLine(Q, 2.2, '#2B2724', '2B', .5);", '  };'];
const KW = /^(const|let|for|if|return)$/;
const colour = (s: string) => { const out: React.ReactNode[] = []; let last = 0; const re = /('[^']*'|\b\d*\.?\d+\b|\b(?:const|let|for|if|return)\b)/g; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) { if (m.index > last) out.push(s.slice(last, m.index)); const v = m[0]; out.push(<span key={m.index} style={{color: v.startsWith("'") ? '#9be29b' : KW.test(v) ? '#ff8fb8' : '#ffc66d'}}>{v}</span>); last = m.index + v.length; }
  out.push(s.slice(last)); return out; };
const CodeShot: React.FC = () => {
  const t = useT(), total = CODE.reduce((n, l) => n + l.length + 1, 0); let left = Math.floor(pr(t, 35.08, 0.95) * total);
  return <><Studio tone="#2d2238" />
    <Win x={70} y={300} w={940} h={640} title="src/scenes/withhammad_brush.js">
      <div style={{padding: '22px 0', fontFamily: mono, fontWeight: 500, fontSize: 20, lineHeight: '54px', color: '#ece8f4', whiteSpace: 'pre'}}>
        {CODE.map((l, i) => { const n = Math.max(0, Math.min(left, l.length)); left = Math.max(0, left - l.length - 1);
          return <div key={i} style={{display: 'flex'}}><span style={{width: 56, textAlign: 'right', color: '#5d5868', marginRight: 16, flexShrink: 0}}>{356 + i}</span><span>{colour(l.slice(0, n))}</span></div>; })}
      </div>
    </Win>
    <div style={{position: 'absolute', left: 0, right: 0, top: 990, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, 35.3, 0.32)})`}}>
      <Pill bg="#1d1a22" color="#fff" size={36} font={ui} style={{border: '2px solid #3a3644'}}><Icon size={52} />written in Claude Code</Pill></div>
  </>;
};
const BrowserPaint: React.FC = () => {
  const t = useT(), ct = 1.4 + (t - 36.22) * 1.1, frame = Math.min(144, Math.floor(ct * 24) + 1), strip = pop(t, 37.04, 0.3), slide = (t - 37.04) * 120;
  return <><Studio tone="#23303e" />
    <Win x={110} y={286} w={860} h={860} title="file:///…/ClaudeAnimationBase/studio.html?render" url>
      <Paint id="r3" ct={ct} w={860} h={804} fy={1080} />
      <div style={{position: 'absolute', left: 16, bottom: 16, background: '#141118e0', color: '#fff', fontFamily: mono, fontWeight: 700, fontSize: 26, padding: '8px 14px', borderRadius: 10, fontVariantNumeric: 'tabular-nums'}}>
        <span style={{color: MUTED, fontWeight: 500}}>headless Chrome · frame </span>{frame}<span style={{color: MUTED, fontWeight: 500}}> / 144</span></div>
    </Win>
    {strip > 0 && <div style={{position: 'absolute', left: 0, top: 1176, width: 1080, height: 150, overflow: 'hidden', transform: `scale(${strip})`}}>
      {Array.from({length: 9}, (_, i) => { const x = 40 + i * 150 - (slide % 150); return <div key={i} style={{position: 'absolute', left: x, top: 8, width: 132, height: 132, borderRadius: 10, overflow: 'hidden', border: '3px solid #f3ebdc'}}>
        <Paint id="r3" ct={Math.max(0, ct - (8 - i) * 0.25)} w={132} h={132} fy={1080} /></div>; })}</div>}
  </>;
};

// ------------------------------------------------------------------ beat 11: free and MIT, commercial use, only Claude Code is paid
const MitCard: React.FC = () => {
  const t = useT(), z = 1 + 0.16 * eo(pr(t, 38.3, 2.2)), ok = pop(t, 40.5, 0.32);
  return <AbsoluteFill style={{background: '#000'}}>
    <div style={{position: 'absolute', left: 70, top: 300, width: 940, height: 760, borderRadius: 28, overflow: 'hidden', background: '#fff'}}>
      <Rec name="gh_mit" vt={mapT(t, [[38.25, 0.3], [39.08, 0.6], [39.12, 0.86], [41.55, 2.4]])} w={940} zoom={z} fx={240} fy={336} /></div>
    {ok > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', justifyContent: 'center', transform: `scale(${ok})`}}><Pill bg={GREEN} color="#06210f" size={44}><Tick size={46} color="#06210f" ink={GREEN} />COMMERCIAL USE OK</Pill></div>}
    <div style={{position: 'absolute', left: 170, width: 740, top: 1212, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 26, lineHeight: 1.35, color: '#8d879a', opacity: pr(t, 38.6, 0.3)}}>MIT covers the code. Clawd is Anthropic's mascot: use your own characters.</div>
  </AbsoluteFill>;
};
const Price: React.FC = () => {
  const t = useT(), a = pop(t, 41.58, 0.3), b = pop(t, 41.84, 0.3), paid = pop(t, 42.9, 0.34);
  const card: React.CSSProperties = {position: 'absolute', left: 70, width: 940, borderRadius: 34, background: '#1d1a22', border: '3px solid #3a3644', boxSizing: 'border-box', padding: '30px 36px'};
  return <><Studio tone="#3a2a1e" />
    <div style={{...card, top: 300, height: 250, transform: `scale(${a})`}}>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: MUTED}}>THE KIT</div>
      <div style={{fontFamily: ui, fontWeight: 900, fontSize: 46, color: '#fff', marginTop: 10}}>ClaudeAnimationBase</div>
      <div style={{fontFamily: ui, fontWeight: 700, fontSize: 32, color: MUTED, marginTop: 6}}>+ p5.brush · both MIT</div>
      <div style={{position: 'absolute', right: 36, top: 84}}><Pill bg={GREEN} color="#06210f" size={50}>FREE</Pill></div>
    </div>
    <div style={{...card, top: 590, height: 400, transform: `scale(${b})`, border: `3px solid ${paid > 0 ? CLAY : '#3a3644'}`}}>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 28, letterSpacing: 4, color: MUTED}}>THE TOOL</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 16}}><Icon size={96} /><span style={{fontFamily: ui, fontWeight: 900, fontSize: 64, color: '#fff'}}>Claude Code</span></div>
      <div style={{fontFamily: ui, fontWeight: 700, fontSize: 34, color: '#e8e3f0', marginTop: 24}}>Needs a paid Claude plan (or API billing)</div>
      <div style={{fontFamily: ui, fontWeight: 600, fontSize: 30, color: MUTED, marginTop: 8}}>Pro: $20 a month, or $17 billed yearly</div>
      {paid > 0 && <div style={{position: 'absolute', right: 36, top: 40, transform: `scale(${paid}) rotate(-6deg)`}}><Pill bg={CLAY} color="#fff" size={50}>PAID</Pill></div>}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center', fontFamily: mono, fontWeight: 500, fontSize: 24, color: '#7d7789', opacity: pr(t, 42.0, 0.3)}}>claude.com/pricing · checked 14 Nov 2026</div>
  </>;
};

// ------------------------------------------------------------------ beat 12: comment BRUSH
const KEY = '"BRUSH"';
const Keyword: React.FC = () => {
  const t = useT(), n = Math.floor(pr(t, 44.8, 0.15) * (KEY.length + 0.99));
  if (n <= 0) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: 1190 - 120, height: 240, zIndex: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: anton, fontSize: 190, lineHeight: '240px', color: '#fff', letterSpacing: 4,
    textShadow: '0 8px 30px #000b,0 2px 6px #0008', whiteSpace: 'pre'}}>{KEY.split('').map((c, i) => <span key={i} style={{opacity: i < n ? 1 : 0}}>{c}</span>)}</div>;
};
const CommentBox: React.FC<{y: number}> = ({y}) => {
  const t = useT(), typed = 'BRUSH'.slice(0, Math.floor(pr(t, 44.6, 0.22) * 5.99)), post = t >= 44.98 ? 1 + 0.14 * (1 - eo(pr(t, 44.98, 0.3))) : 1;
  return <div style={{position: 'absolute', left: 90, top: y, width: 900, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 14px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a', transform: `scale(${pop(t, 43.9, 0.32)})`}}>
    <div style={{width: 88, height: 88, borderRadius: 44, background: '#d9d4e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><svg width={52} height={52} viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="4.2" fill="#8d879a" /><path d="M4 20.5c.8-4.300 4-6.500 8-6.500s7.200 2.200 8 6.500z" fill="#8d879a" /></svg></div>
    <div style={{flex: 1, marginLeft: 22, fontFamily: typed ? disp : ui, fontWeight: typed ? 900 : 600, fontSize: typed ? 54 : 40, color: typed ? '#111' : '#9a95a6', letterSpacing: typed ? 2 : 0}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: '#3B82F6', fontWeight: 500}}>|</span></div>
    <div style={{background: '#3B82F6', color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '16px 34px', borderRadius: 44, transform: `scale(${post})`}}>Post</div>
  </div>;
};
const Cta: React.FC<{face: boolean}> = ({face}) => {
  const t = useT();
  return <>{!face && <><Paint id="r3" ct={5.0 + (t - 43.37) * 0.3} /><AbsoluteFill style={{background: 'linear-gradient(#141118b0,#14111840 40%,#14111890 70%,#141118c0)'}} /></>}
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: disp, fontWeight: 900, fontSize: 96, color: '#fff', textShadow: '0 8px 30px #000a', transform: `scale(${pop(t, 43.62, 0.34)})`}}>WANT THE <span style={{color: YEL}}>KIT?</span></div>
    <CommentBox y={480} />
  </>;
};

// ------------------------------------------------------------------ captions: Montserrat ExtraBold, sentence case, word by word
// Lines are [first word, last word]; the newest word is yellow and turns white when the next one lands; emphasis words stay yellow.
type Block = {lines: [number, number][]; em: number[]};
const HOOK_BLOCKS: Block[] = [{lines: [[0, 1], [2, 3]], em: [0, 1]}, {lines: [[4, 4], [5, 5]], em: [4]}];
const BLOCKS: Block[] = [
  {lines: [[6, 8], [9, 11]], em: [8, 9]}, {lines: [[12, 15], [16, 18]], em: [16, 17, 18]}, {lines: [[19, 22], [23, 24]], em: [21, 22, 24]}, {lines: [[25, 27]], em: [27]},
  {lines: [[28, 29], [30, 32]], em: [28, 31, 32]}, {lines: [[33, 34], [35, 36]], em: [34]}, {lines: [[37, 39], [40, 42]], em: [38]}, {lines: [[43, 45], [46, 47]], em: [44]},
  {lines: [[48, 49], [50, 51]], em: [49]}, {lines: [[52, 54], [55, 55]], em: [54, 55]}, {lines: [[56, 57], [58, 58]], em: [58]}, {lines: [[59, 60], [61, 62]], em: [59, 60, 62]},
  {lines: [[63, 65], [66, 67]], em: [64]}, {lines: [[68, 70], [71, 73]], em: [68, 71, 73]}, {lines: [[74, 78], [79, 80]], em: [79, 80]}, {lines: [[81, 82], [83, 84]], em: [82, 83, 84]},
  {lines: [[85, 87]], em: [87]}, {lines: [[88, 90], [91, 92]], em: [91, 92]}, {lines: [[93, 95], [96, 96]], em: [94, 96]}, {lines: [[97, 99]], em: [97]},
  {lines: [[100, 102], [103, 104]], em: [104]}, {lines: [[105, 107]], em: []}, {lines: [[110, 113]], em: []},
];
// Light backgrounds under the caption zone: the caption block gets a dark plate there.
const LIGHT: [number, number][] = [[0, 4.73], [6.92, 9.12], [21.0, 33.15]];
const CAP_Y = 1426, LINE = 62;
const Captions: React.FC<{words: Word[]; face: boolean}> = ({words, face}) => {
  const t = useT(), all = (face ? HOOK_BLOCKS : []).concat(BLOCKS), S = (i: number) => words[i].startMs / 1000 - 0.04;
  const k = all.findIndex((b, i) => { const first = b.lines[0][0], last = b.lines[b.lines.length - 1][1], next = i + 1 < all.length ? S(all[i + 1].lines[0][0]) - 0.02 : 99;
    return t >= S(first) && t < Math.min(words[last].endMs / 1000 + 0.5, next); });
  if (k < 0) return null;
  const b = all[k], first = b.lines[0][0], last = b.lines[b.lines.length - 1][1];
  let newest = first; for (let i = first; i <= last; i++) if (t >= S(i)) newest = i;
  const plate = LIGHT.some(([a, z]) => t >= a && t < z) || (face && (t < SLOTS.hook[1] || t >= SLOTS.ending[0]));
  const top = CAP_Y - (b.lines.length * LINE) / 2;
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 45, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: plate ? '6px 26px 8px' : 0, borderRadius: 18, background: plate ? '#141118e6' : 'transparent', boxShadow: plate ? '0 10px 30px #0005' : undefined}}>
      {b.lines.map(([a, z], li) => <div key={li} style={{height: LINE, lineHeight: `${LINE}px`, whiteSpace: 'nowrap', fontFamily: disp, fontWeight: 800, fontSize: 54, letterSpacing: 0.2, textShadow: plate ? undefined : '0 3px 0 #0007,0 8px 24px #000c'}}>
        {Array.from({length: z - a + 1}, (_, j) => { const i = a + j, on = t >= S(i);
          return <span key={i} style={{opacity: on ? 1 : 0, color: on && (b.em.includes(i) || i === newest) ? YEL : '#fff'}}>{(j ? ' ' : '') + words[i].text}</span>; })}
      </div>)}
    </div>
  </div>;
};

export const Brush: React.FC<BrushProps> = ({words, stars, forks, avatar, avatarTop = -120}) => {
  const t = useT(), face = !!avatar, H0 = SLOTS.hook[1], E0 = SLOTS.ending[0];
  return <AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    {avatar ? <>
      <Scene s={0} e={2.7} z={1} h={SEAM}><HookPaintings h={SEAM} fy={760} /></Scene>
      {t < 2.7 && <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1920 - SEAM, overflow: 'hidden', zIndex: 2}}><Avatar src={avatar} phase="hook" top={avatarTop} /></div>}
      <Scene s={2.7} e={H0} z={3}><Avatar src={avatar} phase="hook" top={0} /></Scene>
      <HookTitle top={262} />
    </> : <>
      <Scene s={0} e={2.7} z={1}><HookPaintings h={1920} fy={960} /></Scene>
      <Scene s={2.7} e={H0} z={3}><Paint id="r1" ct={0.35 + (t - 2.7) * 1.3} /></Scene>
      <HookTitle top={292} />
    </>}
    <Scene s={H0} e={6.92} z={5}><GithubTop stars={stars} forks={forks} /></Scene>
    <Scene s={6.92} e={7.95} z={6}><IconTile /></Scene>
    <Scene s={7.95} e={8.62} z={7}><Paint id="r6" ct={1.45 + t - 7.95} /></Scene>
    <Scene s={8.62} e={9.12} z={8}><Paint id="r7" ct={0.95 + t - 8.62} /></Scene>
    <Scene s={9.12} e={12.55} z={9}><Setup /></Scene>
    <Scene s={12.55} e={21.0} z={10}><Prompt words={words} /></Scene>
    <Scene s={21.0} e={22.78} z={11}><Gallery /></Scene>
    <Scene s={22.78} e={24.42} z={12}><Paint id="r2" ct={1.8 + t - 22.78} /></Scene>
    <Scene s={24.42} e={25.48} z={13}><Paint id="r3" ct={2.4 + t - 24.42} /></Scene>
    <Scene s={25.48} e={25.62} z={14}><Paint id="r5" ct={0.5 + t - 25.48} /></Scene>
    <Scene s={25.62} e={26.66} z={15}><Paint id="r8" ct={mapT(t, [[25.62, 0.9], [25.92, 1.2], [26.12, 1.5], [26.66, 1.82]])} /></Scene>
    <Scene s={26.66} e={28.1} z={16}><Paint id="r9" ct={(t - 26.66 + 0.3) % 2} /></Scene>
    <Scene s={28.1} e={30.95} z={17}><BrushChart /></Scene>
    <Scene s={30.95} e={33.15} z={18}><Paint id="r10" ct={0.3 + t - 30.95} /></Scene>
    <Scene s={33.15} e={35.05} z={19}><NoModel /></Scene>
    <Scene s={35.05} e={36.22} z={20}><CodeShot /></Scene>
    <Scene s={36.22} e={38.25} z={21}><BrowserPaint /></Scene>
    <Scene s={38.25} e={41.55} z={22}><MitCard /></Scene>
    <Scene s={41.55} e={E0} z={23}><Price /></Scene>
    <Scene s={E0} e={99} z={24}>{avatar ? <><Avatar src={avatar} phase="ending" top={0} /><AbsoluteFill style={{background: 'linear-gradient(#14111880,transparent 34%,transparent 60%,#14111899)'}} /></> : null}<Cta face={face} /></Scene>
    <Keyword />
    <div style={{position: 'absolute', left: 90, top: 226, zIndex: 46, background: '#141118d0', color: '#ece8f4', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <Captions words={words} face={face} />
  </AbsoluteFill>;
};
