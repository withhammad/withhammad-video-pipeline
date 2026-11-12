// OPENHIGGS reel (job 3410ea61e3cc, comment keyword OPEN). Voice-only edit: real screen recordings (the GitHub repo, the hosted
// Open Generative AI app at muapi.ai/open-generative-ai, the MuAPI pricing page) in a browser card plus motion graphics, with a
// word-timed headline above the card. Every time below is a spoken-word time from the recorded narration (words.json), in seconds.
// Every figure and name on screen was read on 12 Nov 2026 (job analysis/facts.md and the STATUS.md section of that day).
// Presenter: optional. With `avatar` (a video under the public dir, clip time 0 = hook start, the ending follows at 3.85 s) the hook
// and the ending show the presenter full-frame under the same overlays; without it (the final) both are full-frame motion graphics.
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type OpenHiggsProps = {words: Word[]; stars: number; avatar?: string; avatarTop?: number};
// Presenter slots in narration seconds: the first sentence and the last one (voice/camera_manifest.json).
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 3.85], ending: [59.67, 62.75]};

const FPS = 30, WX = 100, WW = 840, BAR = 54, HEAD = 272, CARD = 500;
const INK = '#07060f', VIO = '#7B61FF', LIL = '#B9A5FF', GREEN = '#3DDC84', AMBER = '#FFB020', TXT = '#17151f', MUTED = '#a7a3c4';
const GRAD = 'linear-gradient(92deg,#D3C5FF 0%,#A48EFF 48%,#FF8AD8 100%)', GRADL = 'linear-gradient(92deg,#6A4DFF 0%,#8B5CF6 50%,#D946B8 100%)';
const FIRE = 'linear-gradient(180deg,#FFF6C2 0%,#FFC23D 42%,#FF6A1F 100%)';
const sans = 'Poppins', serif = 'Playfair Display', ui = 'Inter', mono = 'JetBrains Mono';
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
const WordsCtx = createContext<Word[]>([]);
const useWT = () => { const w = useContext(WordsCtx); return (i: number) => w[Math.min(i, w.length - 1)].startMs / 1000; };
type Dir = 'l' | 'r' | 'u' | 'd' | 'none';

// ------------------------------------------------------------------ shared pieces
// A full-frame shot. Hard cut with a small settle by default; a direction slides it in over the previous shot.
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; dir?: Dir}>> = ({s, e, z, dir = 'none', children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  const q = 1 - eo(pr(t, s, 0.3)), k = s > 0 ? 1 + 0.03 * (1 - eo(pr(t, s, 0.22))) : 1;
  const tr = dir === 'none' ? `scale(${k})` : `translate(${dir === 'l' ? -q * 1080 : dir === 'r' ? q * 1080 : 0}px,${dir === 'u' ? -q * 1920 : dir === 'd' ? q * 1920 : 0}px)`;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'hidden', zIndex: z, transform: tr}}>{children}</div>;
};
const Dark: React.FC<{at?: string; tone?: string}> = ({at = '50% 34%', tone = '#2e2380'}) => <AbsoluteFill style={{background: `radial-gradient(90% 58% at ${at},${tone} 0%,#120e33 46%,${INK} 82%)`}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#ffffff16 1.5px,transparent 1.7px)', backgroundSize: '40px 40px'}} /></AbsoluteFill>;
const Light: React.FC = () => <AbsoluteFill style={{background: '#fbf9ff', overflow: 'hidden'}}>
  <div style={{position: 'absolute', left: -260, top: 160, width: 820, height: 820, borderRadius: '50%', background: '#ffcfe9', filter: 'blur(140px)', opacity: 0.85}} />
  <div style={{position: 'absolute', left: 520, top: 1020, width: 860, height: 860, borderRadius: '50%', background: '#ffe0c2', filter: 'blur(150px)', opacity: 0.85}} />
  <div style={{position: 'absolute', left: 300, top: 560, width: 620, height: 620, borderRadius: '50%', background: '#e3dcff', filter: 'blur(150px)', opacity: 0.7}} />
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#17151f12 1.4px,transparent 1.6px)', backgroundSize: '40px 40px'}} /></AbsoluteFill>;
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = VIO, color = '#fff', size = 30, style}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.35, background: bg, color, fontFamily: ui, fontWeight: 800, fontSize: size, padding: `${size * 0.3}px ${size * 0.62}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string; ink?: string}> = ({size = 36, color = GREEN, ink = '#06210f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Lock: React.FC = () => <svg width={18} height={18} viewBox="0 0 24 24" style={{flexShrink: 0}}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="#7d8799" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#7d8799" strokeWidth="2.4" /></svg>;
const Folder: React.FC<{size: number; color?: string}> = ({size, color = VIO}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><path d="M2.5 6.5a2 2 0 0 1 2-2h4.6l2 2.2h8.4a2 2 0 0 1 2 2v9.8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z" fill={color} /><path d="M2.5 9.5h19" stroke="#ffffff66" strokeWidth="1.2" /></svg>;
const Star: React.FC<{size: number; color?: string}> = ({size, color = AMBER}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><path d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z" fill={color} /></svg>;
const Flame: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
  <defs><linearGradient id="fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FF4D1F" /><stop offset=".55" stopColor="#FF9A1F" /><stop offset="1" stopColor="#FFD84A" /></linearGradient></defs>
  <path d="M12 1.8c.8 3.2-1.4 4.9-2.9 6.8C7.6 10.5 6.5 12.3 6.5 14.8A5.6 5.6 0 0 0 12 20.6a5.6 5.6 0 0 0 5.5-5.8c0-2.6-1.3-4.3-2.4-5.6.1 1.6-.5 2.8-1.6 3.4.4-3.9-.4-7.6-1.5-10.6z" fill="url(#fl)" />
  <path d="M12 12.4c-1.6 1.5-2.4 2.6-2.4 4a2.4 2.4 0 0 0 4.8 0c0-1.4-.8-2.5-2.4-4z" fill="#FFF3B0" /></svg>;

// The recordings: CSS viewport size, length in seconds and the URL shown in the card's address bar.
const REC: Record<string, {w: number; h: number; d: number; url: string}> = {
  gh_name: {w: 430, h: 450, d: 7.97, url: 'github.com/Anil-matcha/Open-Generative-AI'},
  gh_about: {w: 430, h: 450, d: 6.63, url: 'github.com/Anil-matcha/Open-Generative-AI'},
  gh_clone: {w: 430, h: 450, d: 7.63, url: 'github.com/Anil-matcha/Open-Generative-AI'},
  app_home: {w: 600, h: 630, d: 4.97, url: 'muapi.ai/open-generative-ai/image'},
  app_apikey: {w: 600, h: 630, d: 50.73, url: 'muapi.ai/open-generative-ai/cinema'},
  app_image: {w: 600, h: 630, d: 50.97, url: 'muapi.ai/open-generative-ai/image'},
  app_video_kling: {w: 600, h: 630, d: 96.87, url: 'muapi.ai/open-generative-ai/video'},
  app_video_veo: {w: 600, h: 630, d: 96.63, url: 'muapi.ai/open-generative-ai/video'},
  app_video_runway: {w: 600, h: 630, d: 96.6, url: 'muapi.ai/open-generative-ai/video'},
  app_lipsync: {w: 600, h: 630, d: 4.07, url: 'muapi.ai/open-generative-ai/lipsync'},
  app_cinema_home: {w: 600, h: 630, d: 3.97, url: 'muapi.ai/open-generative-ai/cinema'},
  app_demo_image: {w: 600, h: 630, d: 6.13, url: 'muapi.ai/open-generative-ai/image'},
  app_demo_video: {w: 600, h: 630, d: 6.2, url: 'muapi.ai/open-generative-ai/video'},
  muapi_price: {w: 600, h: 630, d: 7.77, url: 'muapi.ai/pricing'},
};
const KCtx = createContext(1);
// Browser card around a real recording, 840 px wide. `vt` is the time inside the recording, set by an explicit time map so a
// highlight lands on its spoken word. visCss / oyCss crop the page (CSS px); zoom punches in around (fxCss, fyCss).
const Browser: React.FC<React.PropsWithChildren<{rec: string; vt: number; y?: number; visCss?: number; oyCss?: number; zoom?: number; fxCss?: number; fyCss?: number;
  glow?: string; url?: React.ReactNode; badge?: React.ReactNode; blur?: number; style?: React.CSSProperties}>> =
  ({rec, vt, y = CARD, visCss, oyCss = 0, zoom = 1, fxCss, fyCss, glow = '#8f7bff55', url, badge, blur = 0, style, children}) => {
  const r = REC[rec], k = WW / r.w, visH = (visCss ?? r.h) * k, f = Math.round(cl(vt, 0, r.d - 0.1) * FPS);
  return <div style={{position: 'absolute', left: WX, top: y, width: WW, height: BAR + visH, borderRadius: 30, overflow: 'hidden', background: '#000', boxShadow: `0 0 0 2px #ffffff26,0 40px 90px #0009,0 0 150px ${glow}`, ...style}}>
    <div style={{height: BAR, background: '#16151d', display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', position: 'relative'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, flexShrink: 0}} />)}
      <div style={{marginLeft: 12, flex: 1, height: 34, borderRadius: 17, background: '#0a0a10', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontWeight: 500, fontSize: 20, color: '#cfd3ea', whiteSpace: 'nowrap', overflow: 'hidden'}}><Lock />{url ?? r.url}</div>
      {badge}
    </div>
    <div style={{position: 'absolute', left: 0, top: BAR, width: WW, height: visH, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: r.h * k, transform: `translateY(${-oyCss * k}px) scale(${zoom})`, transformOrigin: `${(fxCss ?? r.w / 2) * k}px ${(fyCss ?? r.h / 2) * k + oyCss * k}px`}}>
        <Freeze frame={f}><OffthreadVideo muted src={A(rec + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: r.h * k, filter: blur > 0 ? `blur(${blur}px) brightness(${1 - blur / 40})` : undefined}} /></Freeze>
        <KCtx.Provider value={k}>{children}</KCtx.Provider>
      </div>
    </div>
  </div>;
};
// Violet outline laid over a recording on its spoken word (rectangle in the recording's CSS px).
const Mark: React.FC<{x: number; y: number; w: number; h: number; at: number; out?: number; r?: number}> = ({x, y, w, h, at, out, r = 14}) => {
  const t = useT(), k = useContext(KCtx); if (t < at || (out !== undefined && t >= out)) return null;
  const p = eo(pr(t, at, 0.2));
  return <div style={{position: 'absolute', left: x * k - 7, top: y * k - 7, width: w * k + 14, height: h * k + 14, borderRadius: r, border: `5px solid ${LIL}`, background: '#9D86FF1f',
    boxShadow: '0 0 0 3px #7B61FF66,0 0 40px #9D86FFcc', opacity: p, transform: `scale(${1 + 0.1 * (1 - p)})`}} />;
};
const Foot: React.FC<{children: React.ReactNode; dark?: boolean; at?: number}> = ({children, dark = true, at = -1}) => {
  const t = useT(), p = eo(pr(t, at, 0.3)); if (t < at) return null;
  return <div style={{position: 'absolute', left: WX, width: WW, top: 1450, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 26, lineHeight: '34px', color: dark ? '#c9c5e6' : '#4b4766', opacity: p, transform: `translateY(${(1 - p) * 12}px)`}}>{children}</div>;
};

// ------------------------------------------------------------------ the headline: Poppins words, the key words in italic Playfair
// A group is one or two lines; each word blurs in on its spoken word; the group is replaced when the next one starts.
// Line = [index of the first spoken word, text]; *...* marks the accent; "word@n" pins a word to spoken word n (later words follow).
type HLine = [number, string];
type HGroup = {at: number; lines: HLine[]};
type Tok = {segs: {s: string; e: boolean}[]; idx: number};
const parseLine = ([start, text]: HLine): Tok[] => {
  let idx = start - 1, emph = false;
  return text.split(' ').map(raw => {
    const m = raw.match(/@(\d+)/); let s = raw.replace(/@\d+/, '');
    idx = m ? Number(m[1]) : idx + 1;
    const segs: {s: string; e: boolean}[] = []; let buf = '';
    for (const c of s) { if (c === '*') { if (buf) segs.push({s: buf, e: emph}); buf = ''; emph = !emph; } else buf += c; }
    if (buf) segs.push({s: buf, e: emph}); s = '';
    return {segs, idx};
  });
};
const units = (toks: Tok[]) => toks.reduce((u, tk) => u + 0.3 + tk.segs.reduce((v, sg) => v + [...sg.s].reduce((w, c) => w + (sg.e ? ('mw'.includes(c) ? 0.8 : 'ilj.,\'!'.includes(c) ? 0.32 : c === c.toUpperCase() && c !== c.toLowerCase() ? 0.72 : 0.52) * 1.16
  : ('MW'.includes(c) ? 0.95 : 'mw'.includes(c) ? 0.86 : 'ilj.,\'!:'.includes(c) ? 0.28 : c === c.toUpperCase() && c !== c.toLowerCase() ? 0.7 : 0.58)), 0), 0), -0.3);
const Headline: React.FC<{groups: HGroup[]; dark?: boolean; s: number; e: number; top?: number; base?: number}> = ({groups, dark = true, s, e, top = HEAD, base = 76}) => {
  const t = useT(), T = useWT(); if (t < s || t >= e) return null;
  const st = groups.map(g => T(g.at) - 0.06); let k = -1;
  st.forEach((x, i) => { if (t >= x) k = i; });
  if (k < 0) return null;
  const g0 = st[k];
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 40}}>
    {groups[k].lines.map((ln, li) => { const toks = parseLine(ln), size = Math.min(base, 860 / Math.max(1, units(toks)));
      return <div key={li} style={{height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size * 0.26, whiteSpace: 'nowrap'}}>
        {toks.map((tk, ti) => { const wt = T(tk.idx) - 0.05, stat = wt < g0, p = stat ? 1 : eo(pr(t, wt, 0.24));
          return <span key={ti} style={{display: 'inline-block', opacity: t < wt && !stat ? 0 : p, filter: p < 1 ? `blur(${(1 - p) * 11}px)` : undefined, transform: `translateY(${(1 - p) * 18}px)`}}>
            {tk.segs.map((sg, si) => sg.e
              ? <span key={si} style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 600, fontSize: size * 1.16, lineHeight: 1, backgroundImage: dark ? GRAD : GRADL, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.06em 0.1em', letterSpacing: -0.5}}>{sg.s}</span>
              : <span key={si} style={{fontFamily: sans, fontWeight: 600, fontSize: size, lineHeight: 1, color: dark ? '#fff' : TXT, letterSpacing: -0.5, textShadow: dark ? '0 6px 24px #000a' : undefined}}>{sg.s}</span>)}
          </span>; })}
      </div>; })}
  </div>;
};

// ------------------------------------------------------------------ presenter (only when the `avatar` prop is set)
const Avatar: React.FC<{src: string; phase: 'hook' | 'ending'; top: number}> = ({src, phase, top}) => {
  const t = useT(), a = phase === 'hook' ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#20242c'}}>
    <Freeze frame={Math.round(a * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover'}} /></Freeze>
  </div>;
};

// ------------------------------------------------------------------ beat 1: the hook. "Higgsfield, but / open source" from frame 0; on "insane!" the pill burns away
const PW = 800, PX = 140, PY = 286, PH = 116;
const FlameTongue: React.FC<{x: number; h: number; seed: number; t: number}> = ({x, h, seed, t}) => {
  const fl = 1 + 0.16 * Math.sin(t * 31 + seed * 7) + 0.08 * Math.sin(t * 53 + seed * 3), sk = 6 * Math.sin(t * 19 + seed * 5), w = h * 0.5;
  return <svg width={w} height={h * 1.2} viewBox="0 0 20 40" preserveAspectRatio="none" style={{position: 'absolute', left: x - w / 2, top: PY + PH - h * 1.2 + 26, transform: `scaleY(${fl}) skewX(${sk}deg)`, transformOrigin: '50% 100%', mixBlendMode: 'screen'}}>
    <defs><linearGradient id={`ft${seed}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#FFF4B8" /><stop offset=".3" stopColor="#FFB52E" /><stop offset=".7" stopColor="#FF4E1A" stopOpacity=".85" /><stop offset="1" stopColor="#FF2A00" stopOpacity="0" /></linearGradient></defs>
    <path d="M10 0C12 9 18 15 18 25a8 8 0 0 1-16 0C2 16 9 11 10 0z" fill={`url(#ft${seed})`} /></svg>;
};
const HookTitle: React.FC<{face: boolean}> = ({face}) => {
  const t = useT(), b0 = 2.66, b1 = 3.42, front = -40 + (PW + 80) * eo(pr(t, b0, b1 - b0)), burning = t >= b0, gone = pr(t, b1, 0.35);
  const L = (at: number) => 1 + 0.06 * (t >= at ? 1 - eo(pr(t, at, 0.3)) : 0);
  const clipLeft = burning ? cl(front, 0, PW) : 0;
  return <>
    {face && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 780, background: 'linear-gradient(#07060fee,#07060f99 60%,transparent)'}} />}
    {/* what the fire leaves behind */}
    {burning && <div style={{position: 'absolute', left: PX, top: PY - 14, width: PW, height: PH + 28, display: 'flex', justifyContent: 'center', alignItems: 'center', clipPath: `inset(0 ${PW - clipLeft}px 0 0)`}}>
      <span style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 132, lineHeight: 1, backgroundImage: FIRE, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.08em 0.12em',
        filter: `drop-shadow(0 0 ${18 + 10 * Math.sin(t * 23)}px #FF7A1Acc)`, transform: `scale(${1 + 0.05 * (1 - eo(pr(t, 3.0, 0.4)))})`}}>insane!</span></div>}
    {/* the pill */}
    <div style={{position: 'absolute', left: PX, top: PY, width: PW, height: PH, transform: `scale(${L(1.96)})`, clipPath: burning ? `inset(0 0 0 ${clipLeft}px round 30px)` : undefined}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 30, background: '#fff', boxShadow: '0 18px 50px #0007', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
        <span style={{fontFamily: ui, fontWeight: 900, fontSize: 78, letterSpacing: -2, color: '#0d0b1a'}}>Higgsfield, but</span><Flame size={70} /></div>
      {burning && <div style={{position: 'absolute', left: clipLeft - 4, top: 0, width: 46, height: PH, background: 'linear-gradient(90deg,#ff8a2a,#7a2a08 45%,#2a1206cc 70%,transparent)', filter: 'blur(3px)'}} />}
    </div>
    {/* flames on the burn front, then dying down */}
    {burning && t < b1 + 0.5 && Array.from({length: 9}, (_, j) => { const x = PX + clipLeft - j * 30 + 10, h = (150 - j * 12) * (0.55 + 0.45 * rnd(j, 1)) * (1 - gone);
      return x > PX - 30 && x < PX + PW + 30 && h > 4 ? <FlameTongue key={j} x={x} h={h} seed={j} t={t} /> : null; })}
    {burning && Array.from({length: 34}, (_, i) => { const s0 = b0 + rnd(i, 2) * (b1 - b0 + 0.25), p = pr(t, s0, 0.8 + rnd(i, 3) * 0.5); if (p <= 0 || p >= 1) return null;
      const x0 = PX - 40 + (PW + 80) * eo(pr(s0, b0, b1 - b0)), sz = 4 + rnd(i, 4) * 6;
      return <div key={i} style={{position: 'absolute', left: x0 + Math.sin(p * 6 + i) * 26 + (rnd(i, 5) - 0.5) * 60, top: PY + PH * 0.6 - p * (220 + rnd(i, 6) * 200), width: sz, height: sz, borderRadius: sz,
        background: i % 3 ? '#FFB347' : '#FF5A1F', boxShadow: '0 0 12px #FF8A2A', opacity: (1 - p) * Math.min(1, p * 6)}} />; })}
    {/* line two */}
    <div style={{position: 'absolute', left: 0, right: 0, top: PY + PH + 10, textAlign: 'center', transform: `scale(${L(0.42) * L(0.74)})`}}>
      <span style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 158, lineHeight: '176px', backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.08em 0.14em', letterSpacing: -2,
        filter: 'drop-shadow(0 8px 30px #000c)'}}>open source</span></div>
  </>;
};
const RepoChip: React.FC<{at: number; y: number}> = ({at, y}) => {
  const t = useT(), s = pop(t, at, 0.32); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', transform: `scale(${s})`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, background: '#0d0c16e8', border: '2px solid #ffffff2a', borderRadius: 40, padding: '10px 14px 10px 18px', boxShadow: '0 14px 40px #0008'}}>
      <Img src={A('si-github.svg')} style={{width: 38, height: 38, filter: 'invert(1)'}} />
      <span style={{fontFamily: mono, fontWeight: 700, fontSize: 28, color: '#fff'}}>Anil-matcha/Open-Generative-AI</span>
      <Pill bg={GREEN} color="#06210f" size={22}>MIT</Pill></div></div>;
};
const LeakFlash: React.FC<{at: number}> = ({at}) => {
  const t = useT(), p = pr(t, at - 0.24, 0.5); if (p <= 0 || p >= 1) return null;
  const o = Math.sin(p * Math.PI);
  return <AbsoluteFill style={{zIndex: 60, pointerEvents: 'none', mixBlendMode: 'screen', opacity: o, background: `radial-gradient(70% 50% at ${20 + 60 * p}% 40%,#ffd1f0,#b58cff 40%,transparent 75%)`}} />;
};
const HookScene: React.FC<{face: boolean}> = ({face}) => {
  const t = useT(), e = eo(pr(t, 0, 1.3));
  return <>{!face && <><Dark tone="#3a2896" at="50% 46%" />
    <div style={{position: 'absolute', inset: 0, perspective: 1800}}>
      <Browser rec="app_home" vt={0.5} y={690} visCss={490} glow="#9D86FF77" style={{transform: `rotateX(${14 * (1 - e)}deg) translateY(${40 * (1 - e)}px) scale(${0.95 + 0.05 * e})`, transformOrigin: '50% 0%'}} />
    </div>
    <RepoChip at={1.02} y={1300} /></>}
    <HookTitle face={face} /></>;
};

// ------------------------------------------------------------------ beat 2: renamed (old URL typed, it lands on the new repo)
const OLD = 'Open-Higgsfield-AI', NEW = 'Open-Generative-AI', BASE = 'github.com/Anil-matcha/';
const NameScene: React.FC = () => {
  const t = useT(), n = Math.floor(pr(t, 4.2, 0.8) * (BASE.length + OLD.length + 0.99)), loaded = t >= 5.3, sw = t >= 7.1;
  const url = !sw ? <span>{(BASE + OLD).slice(0, n)}<span style={{color: LIL, opacity: Math.floor(t * 4) % 2 ? 1 : 0.2}}>|</span></span>
    : <span>{BASE}{t < 7.4 ? <span style={{color: '#ff7b7b', textDecoration: 'line-through'}}>{OLD}</span> : <span style={{color: '#fff', fontWeight: 700}}>{NEW.slice(0, Math.floor(pr(t, 7.4, 0.36) * (NEW.length + 0.99)))}</span>}</span>;
  const vt = mapT(t, [[5.3, 0.1], [7.7, 1.3], [7.8, 1.5], [8.62, 2.7], [8.63, 3.4], [8.9, 4.75], [9.0, 4.95], [9.34, 5.5]]);
  return <><Dark />
    <Browser rec="gh_name" vt={vt} url={url} glow="#9D86FF55" blur={loaded ? 16 * (1 - eo(pr(t, 5.3, 0.3))) : 16}
      badge={<div style={{position: 'absolute', right: 16, top: 9, transform: `scale(${pop(t, 7.5, 0.3)})`}}><Pill size={20}>RENAMED</Pill></div>}>
      {t < 5.6 && <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${100 * eo(pr(t, 4.6, 0.75))}%`, background: '#4493f8', opacity: 1 - pr(t, 5.35, 0.2), boxShadow: '0 0 16px #4493f8'}} />}
    </Browser>
  </>;
};
// ------------------------------------------------------------------ beat 3: the app itself costs nothing (MIT licence, stars)
const MitScene: React.FC<{stars: number}> = ({stars}) => {
  const t = useT(), vt = mapT(t, [[9.34, 1.37], [10.82, 1.5], [10.92, 1.75], [11.16, 3.2], [11.26, 3.75], [11.62, 4.3]]), a = pop(t, 10.92, 0.3), b = pop(t, 11.22, 0.3);
  return <><Light />
    <Browser rec="gh_about" vt={vt} visCss={330} glow="#7B61FF44" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1240, display: 'flex', justifyContent: 'center', gap: 26}}>
      <div style={{transform: `scale(${a})`}}><Pill bg="#0f1a14" color="#fff" size={40} style={{border: `3px solid ${GREEN}`, boxShadow: '0 16px 40px #06210f44'}}><Tick size={46} />MIT license</Pill></div>
      <div style={{transform: `scale(${b})`}}><Pill bg="#1a1530" color="#fff" size={40} style={{border: `3px solid ${AMBER}`, boxShadow: '0 16px 40px #2a1a0044', fontVariantNumeric: 'tabular-nums'}}><Star size={44} />{(stars * eo(pr(t, 11.24, 0.34))).toFixed(1)}k stars</Pill></div>
    </div>
  </>;
};
// ------------------------------------------------------------------ beat 4: an entire creative studio inside one app
const CHIPS: [string, number][] = [['Image', 12.36], ['Video', 12.84], ['Lip Sync', 13.32], ['Cinema Studio', 13.68], ['and more', 13.94]];
const StudioScene: React.FC = () => {
  const t = useT(), fly = ei(pr(t, 14.36, 0.42)), glow = pop(t, 14.74, 0.4);
  return <><Dark tone="#2b2f8f" />
    <Browser rec="app_home" vt={mapT(t, [[11.62, 0.3], [15.2, 3.7]])} visCss={480} glow={`#9D86FF${glow > 0 ? 'cc' : '55'}`} style={{transform: `scale(${1 + 0.03 * (glow > 0 ? Math.sin(Math.PI * pr(t, 14.74, 0.4)) : 0)})`}} />
    {CHIPS.map(([name, at], i) => { const s = pop(t, at, 0.3); if (s <= 0 || fly >= 1) return null;
      const row = i < 3 ? 0 : 1, rowItems = row ? CHIPS.slice(3) : CHIPS.slice(0, 3), j = row ? i - 3 : i, ws = rowItems.map(([nm]) => 52 + nm.length * 21), gap = 22;
      const total = ws.reduce((x, y) => x + y, 0) + gap * (ws.length - 1), x0 = 540 - total / 2 + ws.slice(0, j).reduce((x, y) => x + y + gap, 0), y0 = 1250 + row * 94;
      const x = x0 + (540 - ws[j] / 2 - x0) * fly, y = y0 + (860 - y0) * fly;
      return <div key={name} style={{position: 'absolute', left: x, top: y, width: ws[j], height: 72, borderRadius: 36, background: name === 'and more' ? '#ffffff14' : '#ffffff', color: name === 'and more' ? '#e8e4ff' : TXT,
        border: name === 'and more' ? '2px dashed #ffffff55' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 600, fontSize: 32, boxShadow: '0 12px 30px #0008',
        transform: `scale(${s * (1 - 0.7 * fly)})`, opacity: 1 - fly * fly}}>{name}</div>; })}
  </>;
};
// ------------------------------------------------------------------ beat 5: here's the setup
const SetupScene: React.FC = () => {
  const t = useT(), T = useWT(), w = (i: number) => eo(pr(t, T(i) - 0.05, 0.24));
  return <><Light />
    <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 96, color: TXT, letterSpacing: -1}}>
      {["Here's", 'the'].map((x, i) => <span key={x} style={{display: 'inline-block', margin: '0 14px', opacity: w(38 + i), filter: `blur(${(1 - w(38 + i)) * 10}px)`, transform: `translateY(${(1 - w(38 + i)) * 18}px)`}}>{x}</span>)}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', opacity: w(40), filter: `blur(${(1 - w(40)) * 12}px)`, transform: `scale(${0.9 + 0.1 * w(40)})`}}>
      <span style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 210, lineHeight: '240px', backgroundImage: GRADL, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.1em 0.12em'}}>setup.</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1040, display: 'flex', justifyContent: 'center', gap: 40}}>
      {[1, 2, 3].map((n, i) => <div key={n} style={{width: 120, height: 120, borderRadius: 60, background: TXT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 70, transform: `scale(${pop(t, 15.98 + i * 0.12, 0.3)})`, boxShadow: '0 16px 40px #2a1f5c44'}}>{n}</div>)}</div>
  </>;
};
// ------------------------------------------------------------------ beats 6 to 9: the three steps
const STEPS = ['Download', 'Install', 'Run'];
const Tracker: React.FC<{step: number}> = ({step}) => <div style={{position: 'absolute', left: 0, right: 0, top: 1452, display: 'flex', justifyContent: 'center', gap: 14, zIndex: 41}}>
  {STEPS.map((s, i) => <div key={s} style={{display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 20px 0 8px', borderRadius: 22, background: i === step ? VIO : '#15141cdd', border: `2px solid ${i === step ? VIO : '#ffffff22'}`,
    fontFamily: ui, fontWeight: 700, fontSize: 22, color: i <= step ? '#fff' : '#8d89a8'}}>
    {i < step ? <Tick size={30} /> : <div style={{width: 30, height: 30, borderRadius: 15, background: i === step ? '#fff' : '#ffffff1a', color: i === step ? VIO : '#8d89a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900}}>{i + 1}</div>}
    {s}</div>)}</div>;
const Step1Repo: React.FC = () => {
  const t = useT(), vt = mapT(t, [[16.5, 1.43], [17.36, 1.6], [17.5, 1.85], [17.86, 2.9], [17.87, 5.3], [18.7, 5.95]]);
  return <><Dark />
    <Browser rec="gh_clone" vt={vt} glow="#9D86FF55"><Mark x={40} y={166} w={350} h={26} at={18.16} r={10} /></Browser>
  </>;
};
const Step1Folder: React.FC = () => {
  const t = useT(), grab = eo(pr(t, 19.3, 0.62)), drop = t >= 19.96, ok = pop(t, 20.02, 0.32);
  const cx = 540 + (0 - 0) * grab, cy = 660 + (1056 - 660) * grab;
  return <><Light />
    <div style={{position: 'absolute', left: 120, top: 820, width: 840, height: 470, borderRadius: 40, background: '#17161d', boxShadow: `0 30px 80px #2a1f5c55${drop ? `,0 0 0 4px ${VIO},0 0 90px #7B61FF88` : ''}`}}>
      <div style={{position: 'absolute', left: 36, top: 30, display: 'flex', alignItems: 'center', gap: 18}}><Img src={A('claude-mark.svg')} style={{width: 54, height: 54, transform: `rotate(${t * 30}deg)`}} />
        <span style={{fontFamily: sans, fontWeight: 600, fontSize: 42, color: '#fff'}}>Claude Code</span></div>
      <div style={{position: 'absolute', left: 36, top: 116, width: 768, height: 320, borderRadius: 26, border: `4px dashed ${drop ? LIL : '#ffffff33'}`, background: drop ? '#7B61FF18' : 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 34, boxSizing: 'border-box'}}>
        {drop ? <div style={{display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${ok})`, fontFamily: ui, fontWeight: 800, fontSize: 34, color: '#fff'}}><Tick size={44} />Folder opened</div>
          : <span style={{fontFamily: ui, fontWeight: 600, fontSize: 32, color: '#8d89a8'}}>Open a folder</span>}</div>
    </div>
    <div style={{position: 'absolute', left: cx - 290, top: cy - 52, width: 580, height: 104, borderRadius: 30, background: '#fff', display: 'flex', alignItems: 'center', gap: 18, padding: '0 30px', boxSizing: 'border-box',
      boxShadow: `0 ${18 + 20 * Math.sin(Math.PI * grab)}px 50px #2a1f5c55`, transform: `scale(${pop(t, 18.7, 0.3) * (1 + 0.05 * Math.sin(Math.PI * grab))}) rotate(${-3 * Math.sin(Math.PI * grab)}deg)`}}>
      <Folder size={58} /><span style={{fontFamily: mono, fontWeight: 700, fontSize: 38, color: TXT}}>Open-Generative-AI</span></div>
    <svg width={64} height={64} viewBox="0 0 24 24" style={{position: 'absolute', left: cx + 150 - 8 * (1 - pr(t, 19.0, 0.3)) * 30, top: cy + 10 + (1 - eo(pr(t, 18.9, 0.4))) * 160, opacity: pr(t, 18.9, 0.2) * (1 - pr(t, 20.1, 0.3)), filter: 'drop-shadow(0 4px 6px #0005)'}}>
      <path d="M4 2l16 9-7 2-3 7z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  </>;
};
const ClaudeBox: React.FC<{y: number; text: string; at: number; dur: number; send: number}> = ({y, text, at, dur, send}) => {
  const t = useT(), typed = text.slice(0, Math.floor(pr(t, at, dur) * (text.length + 0.99))), sent = t >= send;
  return <div style={{position: 'absolute', left: WX, top: y, width: WW, height: 300, borderRadius: 40, background: '#1c1b22', border: '2px solid #34323d', boxShadow: '0 30px 80px #0008'}}>
    <div style={{position: 'absolute', left: 34, top: 28, display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('claude-mark.svg')} style={{width: 48, height: 48}} />
      <span style={{fontFamily: sans, fontWeight: 600, fontSize: 36, color: '#fff'}}>Claude Code</span></div>
    <div style={{position: 'absolute', left: 34, right: 140, top: 140, fontFamily: ui, fontWeight: 600, fontSize: 60, color: typed ? '#fff' : '#6f6b85', whiteSpace: 'nowrap'}}>{typed || 'Ask Claude Code'}
      <span style={{color: LIL, fontWeight: 400, opacity: Math.floor(t * 4) % 2 ? 1 : 0.15}}>|</span></div>
    <div style={{position: 'absolute', right: 32, bottom: 30, width: 92, height: 92, borderRadius: 46, background: typed ? VIO : '#3a3842', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${1 + 0.24 * (sent ? 1 - eo(pr(t, send, 0.34)) : 0)})`, boxShadow: sent ? '0 0 50px #7B61FFaa' : undefined}}>
      <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg></div>
  </div>;
};
const README_STEPS = ['git clone --recurse-submodules', 'npm run setup', 'npm run dev'];
const Step2Install: React.FC = () => {
  const t = useT();
  return <><Dark tone="#3b2a7a" />
    <ClaudeBox y={540} text="install this" at={22.5} dur={0.5} send={23.12} />
    <div style={{position: 'absolute', left: WX, top: 900, width: WW, height: 440, borderRadius: 36, background: '#ffffff0d', border: '2px solid #ffffff1f', opacity: pr(t, 21.2, 0.25)}}>
      <div style={{position: 'absolute', left: 36, top: 30, fontFamily: ui, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: MUTED}}>THE README'S STEPS</div>
      {README_STEPS.map((c, i) => { const s = pop(t, 21.3 + i * 0.26, 0.3);
        return <div key={c} style={{position: 'absolute', left: 36, top: 84 + i * 84, display: 'flex', alignItems: 'center', gap: 20, transform: `scale(${s})`, transformOrigin: '0 50%'}}>
          <div style={{width: 52, height: 52, borderRadius: 16, background: VIO, color: '#fff', fontFamily: ui, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
          <span style={{fontFamily: mono, fontWeight: 700, fontSize: 34, color: '#fff'}}>{c}</span></div>; })}
      <div style={{position: 'absolute', left: 36, top: 352, fontFamily: ui, fontWeight: 600, fontSize: 26, color: MUTED, opacity: pr(t, 22.2, 0.3)}}>Needs Node.js 18+ (README prerequisites)</div>
    </div>
  </>;
};
const Step3Key: React.FC = () => {
  const t = useT(), vt = mapT(t, [[23.47, 0.9], [24.48, 1.55], [24.6, 1.95], [25.2, 2.4], [25.21, 47.7], [25.44, 48.55], [25.95, 49.4]]);
  return <><Dark tone="#24307a" />
    <Browser rec="app_apikey" vt={vt} zoom={1 + 0.3 * eo(pr(t, 24.62, 0.5))} fxCss={300} fyCss={300} glow="#9D86FF55" />
  </>;
};
const Step3Run: React.FC = () => {
  const t = useT(), s = pop(t, 27.82, 0.34);
  return <><Light />
    <ClaudeBox y={560} text="run the app" at={27.12} dur={0.48} send={27.72} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', justifyContent: 'center', transform: `scale(${s})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, background: '#101716', border: `3px solid ${GREEN}`, borderRadius: 44, padding: '20px 34px', boxShadow: '0 20px 50px #06210f44'}}>
        <div style={{width: 22, height: 22, borderRadius: 11, background: GREEN, boxShadow: `0 0 ${12 + 8 * Math.sin(t * 9)}px ${GREEN}`}} />
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 36, color: '#fff'}}>npm run dev</span>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 36, color: GREEN}}>localhost:3000</span></div></div>
  </>;
};
const DoneScene: React.FC = () => {
  const t = useT(), T = useWT(), a = eo(pr(t, T(74) - 0.05, 0.22)), b = pop(t, T(75) - 0.03, 0.36);
  return <><Dark tone="#4b2a9a" at="50% 44%" />
    {Array.from({length: 14}, (_, i) => <div key={i} style={{position: 'absolute', left: 540, top: 840, width: 6, height: 1400, marginLeft: -3, background: 'linear-gradient(transparent 24%,#B9A5FF44 62%,transparent)', transformOrigin: '50% 0', transform: `rotate(${i * 25.7 + t * 30}deg)`}} />)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 600, textAlign: 'center', whiteSpace: 'nowrap'}}>
      <span style={{display: 'inline-block', fontFamily: sans, fontWeight: 600, fontSize: 150, color: '#fff', opacity: a, filter: `blur(${(1 - a) * 10}px)`, marginRight: 30, letterSpacing: -3}}>That's</span>
      <span style={{display: 'inline-block', fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 200, lineHeight: '220px', backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 0.1em 0.1em', transform: `scale(${b})`}}>it!</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 950, display: 'flex', justifyContent: 'center', gap: 22}}>
      {STEPS.map((s, i) => <div key={s} style={{display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff12', border: '2px solid #ffffff30', borderRadius: 40, padding: '12px 26px 12px 14px', transform: `scale(${pop(t, 28.3 + i * 0.1, 0.3)})`,
        fontFamily: ui, fontWeight: 800, fontSize: 34, color: '#fff'}}><Tick size={44} />{s}</div>)}</div>
  </>;
};
// ------------------------------------------------------------------ beats 10 to 12: Image Studio, Video (Kling, Veo, Runway), Lip Sync
const ImageScene: React.FC = () => {
  const t = useT(), vt = mapT(t, [[28.85, 0.25], [31.25, 1.4], [31.4, 1.62], [33.6, 2.6]]), z = 1 + 0.22 * eo(pr(t, 31.62, 0.5));
  return <><Dark tone="#173d7a" />
    <Browser rec="app_image" vt={vt} zoom={z} fxCss={290} fyCss={330} glow="#4dd0ff44">
      <Mark x={119} y={409} w={342} h={59} at={32.04} out={33.0} /><Mark x={119} y={281} w={342} h={56} at={33.0} /></Browser>
  </>;
};
const VIDEO_ROWS: [string, number, [number, number, number, number]][] = [['app_video_kling', 35.54, [119, 238, 342, 58]], ['app_video_veo', 36.12, [119, 306, 342, 60]], ['app_video_runway', 36.7, [119, 279, 342, 60]]];
const VideoScene: React.FC = () => {
  const t = useT(), i = t < 36.12 ? 0 : t < 36.7 ? 1 : 2, [rec, at, box] = VIDEO_ROWS[i];
  const vt = i > 0 ? 96.0 : mapT(t, [[33.6, 0.85], [34.7, 1.3], [34.84, 1.7], [35.5, 1.9], [35.52, 60.0]]);
  return <><Light />
    <Browser rec={rec} vt={vt} glow="#7B61FF44"><Mark x={box[0]} y={box[1]} w={box[2]} h={box[3]} at={at} /></Browser>
  </>;
};
const LipScene: React.FC = () => {
  const t = useT();
  return <><Dark tone="#5a2a7a" />
    <Browser rec="app_lipsync" vt={mapT(t, [[37.24, 0.2], [40.87, 3.9]])} glow="#ff8ad855">
      <Mark x={36} y={384} w={130} h={31} at={38.36} out={40.1} r={20} /><Mark x={32} y={551} w={536} h={48} at={40.1} r={28} /></Browser>
    <Foot at={38.9}>Only use a face you own or have permission to use</Foot>
  </>;
};
// ------------------------------------------------------------------ beat 13: Cinema Studio (the app page, then the four picks it offers)
const CinemaHome: React.FC = () => {
  const t = useT(), z = 1 + 0.12 * eo(pr(t, 42.3, 0.6));
  return <><Dark tone="#123a5a" />
    <Browser rec="app_cinema_home" vt={mapT(t, [[40.87, 0.3], [43.3, 3.2]])} zoom={z} fxCss={300} fyCss={330} glow="#22d3ee44">
      <Mark x={204} y={300} w={192} h={32} at={42.3} r={10} /></Browser>
  </>;
};
// Option names as the app and its README list them (Camera, Lens, Focal length, Aperture); the first value is the app's default.
const TILES: [string, string, string, number][] = [['CAMERA', 'Modular 8K Digital', 'Full-Frame Cine Digital', 44.0], ['LENS', 'Creative Tilt Lens', 'Classic Anamorphic', 45.02],
  ['FOCAL LENGTH', '35mm', '50mm', 45.58], ['APERTURE', 'f/1.4', 'f/1.4', 46.0]];
const CinemaPick: React.FC = () => {
  const t = useT();
  return <><Dark tone="#123a5a" at="50% 50%" />
    {TILES.map(([label, a, b, at], i) => { const x = WX + (i % 2) * 430, y = 540 + Math.floor(i / 2) * 330, on = t >= at, sw = eo(pr(t, at, 0.3)), s = pop(t, 43.36 + i * 0.08, 0.3);
      return <div key={label} style={{position: 'absolute', left: x, top: y, width: 410, height: 300, borderRadius: 34, background: on ? '#1c1640' : '#13121c', border: `4px solid ${on ? LIL : '#ffffff1c'}`,
        boxShadow: on ? '0 0 0 3px #7B61FF55,0 0 60px #9D86FF77' : '0 20px 50px #0008', transform: `scale(${s * (1 + 0.04 * (on ? 1 - sw : 0))})`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 30, top: 28, fontFamily: ui, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: on ? LIL : MUTED}}>{label}</div>
        <div style={{position: 'absolute', left: 30, right: 30, top: 96, height: 160, overflow: 'hidden'}}>
          {[a, b].map((v, k) => <div key={k} style={{position: 'absolute', left: 0, right: 0, top: (k - (a === b ? 0 : sw)) * 160, height: 160, display: 'flex', alignItems: 'center',
            fontFamily: v.length < 7 ? serif : sans, fontStyle: v.length < 7 ? 'italic' : 'normal', fontWeight: v.length < 7 ? 700 : 600, fontSize: v.length < 7 ? 96 : 44, lineHeight: 1.12, color: '#fff'}}>{v}</div>)}</div>
        {on && <div style={{position: 'absolute', right: 22, top: 22, transform: `scale(${pop(t, at, 0.3)})`}}><Tick size={40} color={LIL} ink="#1c1640" /></div>}
      </div>; })}
    <div style={{position: 'absolute', left: WX, top: 1220, width: WW, height: 110, borderRadius: 30, background: '#ffffff10', border: '2px solid #ffffff26', display: 'flex', alignItems: 'center', gap: 20, padding: '0 30px', boxSizing: 'border-box',
      opacity: pr(t, 45.9, 0.3), transform: `translateY(${(1 - eo(pr(t, 45.9, 0.3))) * 24}px)`}}>
      <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={LIL} strokeWidth={2.4} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      <span style={{fontFamily: ui, fontWeight: 700, fontSize: 32, color: '#fff'}}>Your picks are added to the prompt</span></div>
  </>;
};
// ------------------------------------------------------------------ beat 14: the perfume ad, typed in the real app; then an illustration of image to video
const DemoImage: React.FC = () => {
  const t = useT();
  return <><Light />
    <Browser rec="app_demo_image" vt={mapT(t, [[46.72, 0.5], [47.1, 0.9], [48.76, 3.5], [49.0, 4.1]])} glow="#7B61FF44"><Mark x={22} y={426} w={496} h={34} at={48.5} r={12} /></Browser>
  </>;
};
const DemoVideo: React.FC = () => {
  const t = useT();
  return <><Light />
    <Browser rec="app_demo_video" vt={mapT(t, [[49.0, 0.6], [49.2, 0.9], [50.9, 3.55], [51.42, 4.6]])} glow="#7B61FF44"><Mark x={22} y={380} w={500} h={34} at={50.84} r={12} /></Browser>
  </>;
};
const Bottle: React.FC<{w: number; turn?: number}> = ({w, turn = 0}) => {
  const sx = 1 - 0.16 * Math.abs(Math.sin(turn)), sh = 30 + 40 * (0.5 + 0.5 * Math.sin(turn));
  return <svg width={w} height={w * 1.7} viewBox="0 0 100 170" style={{display: 'block', overflow: 'visible'}}>
    <defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#050507" /><stop offset=".5" stopColor="#1c1c24" /><stop offset="1" stopColor="#050507" /></linearGradient>
      <linearGradient id="au" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6420" /><stop offset=".45" stopColor="#F2D38A" /><stop offset="1" stopColor="#8a6420" /></linearGradient>
      <radialGradient id="st" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#3a3a40" /><stop offset="1" stopColor="#141418" /></radialGradient></defs>
    <ellipse cx="50" cy="160" rx="48" ry="9" fill="url(#st)" />
    <g transform={`translate(50 0) scale(${sx} 1) translate(-50 0)`}>
      <rect x="39" y="4" width="22" height="20" rx="3" fill="url(#au)" /><rect x="35" y="22" width="30" height="9" rx="2" fill="#0c0c10" stroke="url(#au)" strokeWidth="1.5" />
      <path d="M30 31h40c8 0 14 7 14 15v96c0 9-6 15-15 15H31c-9 0-15-6-15-15V46c0-8 6-15 14-15z" fill="url(#gl)" stroke="#33333d" strokeWidth="1.2" />
      <path d={`M${sh} 40c-3 30-3 70 0 108`} stroke="#ffffff" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d={`M${sh + 9} 44c-2 26-2 58 0 96`} stroke="#F2D38A" strokeOpacity=".25" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="26" y="86" width="48" height="26" rx="2" fill="none" stroke="url(#au)" strokeWidth="1.8" /><rect x="34" y="96" width="32" height="2.4" rx="1.2" fill="url(#au)" />
    </g></svg>;
};
const SameApp: React.FC = () => {
  const t = useT(), win = pop(t, 51.44, 0.34), arrow = eo(pr(t, 51.9, 0.3)), vid = pop(t, 52.12, 0.32), tab = t >= 52.12 ? 1 : 0, prog = pr(t, 52.2, 0.8);
  return <><Dark tone="#3a2470" />
    <div style={{position: 'absolute', left: WX, top: 520, width: WW, height: 820, borderRadius: 34, background: '#0e0d15', border: '2px solid #ffffff22', boxShadow: '0 40px 90px #000a,0 0 140px #9D86FF44', transform: `scale(${win})`, overflow: 'hidden'}}>
      <div style={{height: 64, background: '#16151d', display: 'flex', alignItems: 'center', gap: 9, padding: '0 22px'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
        <span style={{marginLeft: 16, fontFamily: ui, fontWeight: 700, fontSize: 26, color: '#e8e4ff'}}>Open Generative AI</span>
        <div style={{marginLeft: 'auto'}}><Pill bg="#ffffff14" color="#d8d3f5" size={20} style={{border: '1px solid #ffffff33'}}>Illustration</Pill></div></div>
      <div style={{display: 'flex', gap: 16, padding: '24px 30px 0'}}>
        {['Image', 'Video'].map((n, i) => <div key={n} style={{fontFamily: ui, fontWeight: 800, fontSize: 28, padding: '10px 26px', borderRadius: 26, background: i === tab ? VIO : '#ffffff10', color: i === tab ? '#fff' : '#a7a3c4'}}>{n}</div>)}</div>
      {[0, 1].map(k => { const x = 30 + k * 420, s = k ? vid : pop(t, 51.6, 0.3);
        return <div key={k} style={{position: 'absolute', left: x, top: 170, width: 360, height: 560, borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(80% 60% at 50% 40%,#5a3a18,#1a0f08 70%)', transform: `scale(${s})`, border: '2px solid #ffffff1a'}}>
          <div style={{position: 'absolute', left: 95, top: 120, transform: k ? `translateY(${Math.sin(t * 2) * 4}px) scale(${1 + 0.05 * pr(t, 52.1, 0.9)})` : undefined}}><Bottle w={170} turn={k ? (t - 52.1) * 2.4 : 0} /></div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(transparent,#2a1a0c)'}} />
          {k === 1 && Array.from({length: 7}, (_, i) => <div key={i} style={{position: 'absolute', left: 60 + i * 38 + Math.sin(t * 1.5 + i) * 20, top: 380 - ((t * 30 + i * 40) % 140), width: 70, height: 70, borderRadius: 35, background: '#ffffff', opacity: 0.06, filter: 'blur(12px)'}} />)}
          <div style={{position: 'absolute', left: 20, top: 18}}><Pill bg="#000a" color="#fff" size={20}>{k ? 'VIDEO' : 'IMAGE'}</Pill></div>
          {k === 1 && <><div style={{position: 'absolute', left: 140, top: 230, width: 80, height: 80, borderRadius: 40, background: '#0008', border: '2px solid #fff8', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - pr(t, 52.3, 0.3)}}>
            <svg width={34} height={34} viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="#fff" /></svg></div>
            <div style={{position: 'absolute', left: 20, right: 20, bottom: 22, height: 8, borderRadius: 4, background: '#ffffff26'}}><div style={{width: `${100 * prog}%`, height: '100%', borderRadius: 4, background: LIL}} /></div></>}
        </div>; })}
      <svg width={80} height={60} viewBox="0 0 80 60" style={{position: 'absolute', left: 384, top: 420, opacity: arrow}}><path d={`M6 30H${6 + 60 * arrow}`} stroke={LIL} strokeWidth={7} strokeLinecap="round" />
        {arrow > 0.9 && <path d="M52 16l16 14-16 14" fill="none" stroke={LIL} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}</svg>
    </div>
  </>;
};
// ------------------------------------------------------------------ beats 15 and 16: the app is free, the models are not; the real price list
const FreeScene: React.FC = () => {
  const t = useT(), ent = eo(pr(t, 53.06, 0.4)), a = eo(pr(t, 54.3, 0.3)), b = eo(pr(t, 55.42, 0.3)), stamp = pop(t, 56.08, 0.3), shake = t >= 56.08 && t < 56.4 ? Math.sin(t * 80) * 6 * (1 - pr(t, 56.08, 0.32)) : 0;
  const card = (k: number, lit: number): React.CSSProperties => ({position: 'absolute', left: WX + k * 430, top: 560, width: 410, height: 600, borderRadius: 40, boxSizing: 'border-box', padding: '40px 34px',
    opacity: ent * (0.32 + 0.68 * lit), transform: `translateY(${(1 - ent) * 60}px) scale(${0.96 + 0.04 * lit + 0.05 * Math.sin(Math.PI * lit)})`, filter: lit < 1 ? `saturate(${0.3 + 0.7 * lit})` : undefined});
  const hid = (lit: number): React.CSSProperties => ({filter: `blur(${(1 - lit) * 14}px)`, opacity: 0.25 + 0.75 * lit});
  return <><Dark tone="#2a2a6a" />
    <div style={{...card(0, a), background: '#0f1a14', border: `4px solid ${GREEN}`, boxShadow: '0 30px 70px #000a,0 0 80px #3DDC8433'}}>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: '#9fe6bf'}}>THE APP</div>
      <div style={{...hid(a), fontFamily: sans, fontWeight: 700, fontSize: 170, lineHeight: '200px', color: GREEN, marginTop: 40, letterSpacing: -4}}>$0</div>
      <div style={{...hid(a), fontFamily: ui, fontWeight: 700, fontSize: 32, lineHeight: 1.3, color: '#fff', marginTop: 30}}>Free and open source</div>
      <div style={{...hid(a), fontFamily: ui, fontWeight: 600, fontSize: 26, color: '#9fe6bf', marginTop: 14}}>MIT license</div>
      {a > 0 && <div style={{position: 'absolute', right: 26, top: 26, transform: `scale(${pop(t, 54.3, 0.3)})`}}><Tick size={56} /></div>}</div>
    <div style={{...card(1, b), background: '#1d1608', border: `4px solid ${AMBER}`, boxShadow: '0 30px 70px #000a,0 0 80px #FFB02033', translate: `${shake}px 0`}}>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: '#ffd68a'}}>THE MODELS</div>
      <div style={{...hid(b), fontFamily: sans, fontWeight: 700, fontSize: 104, lineHeight: '200px', color: AMBER, marginTop: 40, letterSpacing: -2}}>Paid</div>
      <div style={{...hid(b), fontFamily: ui, fontWeight: 700, fontSize: 32, lineHeight: 1.3, color: '#fff', marginTop: 30}}>Billed per generation</div>
      <div style={{...hid(b), fontFamily: ui, fontWeight: 600, fontSize: 26, color: '#ffd68a', marginTop: 14}}>by MuAPI</div>
      {stamp > 0 && <div style={{position: 'absolute', left: 50, top: 476, transform: `scale(${stamp}) rotate(-8deg)`, border: '6px solid #FF5A5F', color: '#FF5A5F', fontFamily: ui, fontWeight: 900, fontSize: 52, padding: '4px 22px', borderRadius: 16, letterSpacing: 2, background: '#1d1608'}}>NOT FREE</div>}
    </div>
  </>;
};
const PRICES: [string, string, number][] = [['flux-schnell', '$0.003 per generation', 57.36], ['veo3-fast-text-to-video', '$0.6 per generation', 58.64]];
const PriceScene: React.FC = () => {
  const t = useT(), vt = mapT(t, [[56.48, 0.3], [56.9, 0.47], [57.3, 1.67], [57.36, 2.05], [58.2, 3.4], [58.6, 4.45], [58.66, 4.6], [59.67, 5.9]]);
  return <><Light />
    <Browser rec="muapi_price" vt={vt} visCss={405} glow="#7B61FF44" />
    {PRICES.map(([m, p, at], i) => { const s = pop(t, at, 0.32);
      return <div key={m} style={{position: 'absolute', left: WX, top: 1150 + i * 110, width: WW, height: 92, borderRadius: 26, background: '#17151f', display: 'flex', alignItems: 'center', padding: '0 28px', boxSizing: 'border-box',
        transform: `scale(${s})`, boxShadow: '0 16px 40px #2a1f5c33', border: `3px solid ${AMBER}`}}>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 28, color: '#fff'}}>{m}</span>
        <span style={{marginLeft: 'auto', fontFamily: ui, fontWeight: 800, fontSize: 30, color: AMBER}}>{p}</span></div>; })}
    <Foot dark={false} at={56.6}>muapi.ai/pricing, read 12 Nov 2026</Foot>
  </>;
};
// ------------------------------------------------------------------ beat 17: follow, comment OPEN, the DM with the link
const Heart: React.FC<{x: number; delay: number; base: number}> = ({x, delay, base}) => { const t = useT(), p = pr(t, 61.44 + delay, 1.3); if (p <= 0 || p >= 1) return null;
  return <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: x + Math.sin(p * 7 + delay * 9) * 22, top: base - p * 380, opacity: Math.min(1, 4 * p) * (1 - p), transform: `scale(${0.7 + p * 0.6})`}}><path fill={delay * 10 % 2 < 1 ? '#FF5A5F' : '#ff7ab2'} d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.8 4.5 6.4 4.5c2 0 3.4 1 4.3 2.3l1.3 1.8 1.3-1.8c.9-1.3 2.3-2.3 4.3-2.3 3.6 0 5.5 3.7 4 7.2C19.5 16.4 12 21 12 21z" /></svg>; };
const CommentBox: React.FC<{y: number}> = ({y}) => {
  const t = useT(), typed = 'OPEN'.slice(0, Math.floor(pr(t, 60.9, 0.4) * 4.99));
  return <div style={{position: 'absolute', left: WX, top: y, width: WW, height: 124, borderRadius: 62, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
    <Img src={A('avatar_thumb.jpg')} style={{width: 90, height: 90, borderRadius: 45, objectFit: 'cover'}} />
    <div style={{flex: 1, marginLeft: 22, fontFamily: typed ? sans : ui, fontWeight: typed ? 700 : 600, fontSize: typed ? 56 : 42, color: typed ? '#111' : '#9aa3b5', letterSpacing: typed ? 3 : 0}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: VIO, fontWeight: 500}}>|</span></div>
    <div style={{background: VIO, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '18px 34px', borderRadius: 44, transform: `scale(${1 + 0.14 * (t >= 61.4 ? 1 - eo(pr(t, 61.4, 0.3)) : 0)})`}}>Post</div>
  </div>;
};
const DmCard: React.FC<{y: number}> = ({y}) => {
  const t = useT(), dm = eo(pr(t, 61.84, 0.36));
  return <div style={{position: 'absolute', left: WX, top: y + (1 - dm) * 80, width: WW, height: 230, borderRadius: 34, background: '#13112a', border: '2px solid #3a3466', padding: '22px 28px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000c', opacity: dm}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('avatar_thumb.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}} />
      <span style={{fontFamily: ui, fontWeight: 800, fontSize: 36, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: ui, fontWeight: 700, fontSize: 28, color: MUTED}}>· Direct message</span></div>
    <div style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 16, background: VIO, color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 40, padding: '18px 28px', borderRadius: '8px 30px 30px 30px', whiteSpace: 'nowrap'}}>
      <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>Open Generative AI: the link</div>
  </div>;
};
const CtaScene: React.FC<{face: boolean}> = ({face}) => {
  const t = useT(), n = Math.floor(pr(t, 60.9, 0.4) * 4.99), on = t >= 60.06;
  return <>{!face && <Dark tone="#3a2896" at="50% 40%" />}
    {face && <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 560, background: 'linear-gradient(#07060fee,transparent)'}} />}
    {face && <div style={{position: 'absolute', left: 0, right: 0, top: 1000, height: 920, background: 'linear-gradient(transparent,#07060fd8 40%)'}} />}
    {!face && <>
      <div style={{position: 'absolute', left: WX, top: 500, width: WW, height: 130, borderRadius: 44, background: '#13112af0', border: '2px solid #3a3466', display: 'flex', alignItems: 'center', padding: '0 22px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
        <Img src={A('avatar_thumb.jpg')} style={{width: 92, height: 92, borderRadius: 46, objectFit: 'cover', border: `4px solid ${LIL}`}} />
        <span style={{marginLeft: 22, fontFamily: ui, fontWeight: 800, fontSize: 42, color: '#fff', letterSpacing: -0.5}}>withhammad.ai</span>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, background: on ? '#1d1a3a' : VIO, border: `3px solid ${on ? LIL : VIO}`, color: on ? LIL : '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '14px 24px', borderRadius: 40,
          transform: `scale(${1 + 0.2 * (on ? 1 - eo(pr(t, 60.06, 0.32)) : 0)})`}}>{on ? 'Following' : 'Follow'}{on && <Tick size={34} color={LIL} ink="#1d1a3a" />}</div></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', whiteSpace: 'nowrap'}}>
        {'OPEN'.split('').map((c, i) => <span key={i} style={{display: 'inline-block', fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 250, lineHeight: '270px', padding: '0 0.04em',
          ...(i < n ? {backgroundImage: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 40px #B9A5FF88)'} : {color: 'transparent', WebkitTextStroke: '3px #ffffff40'}),
          transform: `scale(${i < n ? 1 + 0.2 * (1 - eo(pr(t, 60.9 + i * 0.1, 0.25))) : 1})`}}>{c}</span>)}</div></>}
    {!face && t < 61.9 && <div style={{position: 'absolute', left: WX, top: 1110, width: WW, height: 230, borderRadius: 34, border: '4px dashed #ffffff30', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22,
      opacity: 1 - pr(t, 61.84, 0.06)}}>
      <svg width={84} height={84} viewBox="0 0 24 24" style={{opacity: 0.45 + 0.25 * Math.sin(t * 6), transform: `translate(${Math.sin(t * 3) * 8}px,${-Math.sin(t * 3) * 8}px)`}}><path d="M21.5 2.5L10.5 13.5M21.5 2.5l-7 19-4-8-8-4z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
      <span style={{fontFamily: ui, fontWeight: 700, fontSize: 34, color: '#ffffff80'}}>The link lands in your DMs</span></div>}
    {(!face || t < 61.84) && <CommentBox y={face ? 1180 : 960} />}
    {face ? (t >= 61.84 && <DmCard y={1180} />) : <><DmCard y={1110} />
      {[[170, 0], [420, 0.25], [640, 0.1], [860, 0.4], [300, 0.6], [760, 0.75]].map(([x, d], i) => <Heart key={i} x={x} delay={d} base={940} />)}</>}
  </>;
};

// ------------------------------------------------------------------ the headlines (word indices follow words.json)
const H = {
  name: [{at: 10, lines: [[10, 'It used to be called'], [15, '*Open Higgsfield AI*']]}, {at: 18, lines: [[18, "Now it's"], [20, '*Open Generative AI*']]}],
  mit: [{at: 23, lines: [[23, 'And the app itself'], [27, 'costs *nothing*']]}],
  studio: [{at: 29, lines: [[29, 'You get an entire'], [33, '*creative studio*']]}, {at: 35, lines: [[35, 'inside *one app*']]}],
  s1a: [{at: 41, lines: [[41, 'First, download'], [43, 'the *GitHub repo*']]}],
  s1b: [{at: 46, lines: [[46, 'and open the folder'], [50, 'in *Claude Code*']]}],
  s2: [{at: 53, lines: [[53, 'Then tell'], [55, '*Claude Code*']]}, {at: 57, lines: [[57, '"*install this*"']]}],
  s3a: [{at: 59, lines: [[59, 'After that, drop in'], [63, 'your *API key*']]}],
  s3b: [{at: 66, lines: [[66, 'and ask Claude Code'], [70, 'to *run the app*']]}],
  image: [{at: 76, lines: [[76, 'In the'], [78, '*Image Studio*']]}, {at: 80, lines: [[80, 'you generate and'], [83, '*edit images*']]}, {at: 85, lines: [[85, 'with *Nano Banana*'], [88, 'and *Flux*']]}],
  video: [{at: 90, lines: [[90, 'Next, create videos'], [93, 'with *Kling*']]}, {at: 95, lines: [[90, 'Next, create videos'], [93, 'with *Veo*@95']]}, {at: 96, lines: [[90, 'Next, create videos'], [93, 'with *Runway*@97']]}],
  lip: [{at: 98, lines: [[98, 'Or turn your own'], [102, '*portrait*']]}, {at: 103, lines: [[103, 'into a *talking video*'], [107, 'with *Lip Sync*']]}],
  cin: [{at: 110, lines: [[110, 'But my favourite is'], [114, '*Cinema Studio*']]}],
  pick: [{at: 116, lines: [[116, 'You pick *camera* angles'], [120, 'and *lenses*']]}, {at: 122, lines: [[122, 'for *cinematic* shots']]}],
  demo1: [{at: 125, lines: [[125, 'I prompted a'], [128, '*luxury perfume ad*']]}],
  demo2: [{at: 131, lines: [[131, 'then animated the image'], [135, 'into a *product video*']]}],
  same: [{at: 139, lines: [[139, 'all in the *same app*']]}],
  free: [{at: 144, lines: [[144, '*One thing:*']]}, {at: 146, lines: [[146, 'the app is *free*,'], [150, 'the models are *not*']]}],
  price: [{at: 154, lines: [[154, 'You pay'], [156, '*per generation*']]}, {at: 158, lines: [[158, 'so check the *price* first']]}],
  cta: [{at: 163, lines: [[163, 'Follow me and'], [166, 'comment *OPEN*']]}, {at: 168, lines: [[168, "and I'll send you"], [172, 'the *link!*']]}],
} satisfies Record<string, HGroup[]>;
// Shot boundaries (cuts in the pauses between sentences), and which shots sit on the light canvas.
const C = {h0: SLOTS.hook[1], name: 9.34, mit: 11.62, studio: 15.2, setup: 16.5, s1a: 18.7, s1b: 20.65, s2: 23.47, s3a: 25.95, s3b: 27.94, done: 28.85, image: 33.6, video: 37.24,
  lip: 40.87, cin: 43.3, pick: 46.72, demo1: 49.0, demo2: 51.42, same: 53.0, free: 56.48, price: SLOTS.ending[0]};
const HEADS: [HGroup[], number, number, boolean][] = [[H.name, C.h0, C.name, true], [H.mit, C.name, C.mit, false], [H.studio, C.mit, C.studio, true], [H.s1a, C.setup, C.s1a, true], [H.s1b, C.s1a, C.s1b, false],
  [H.s2, C.s1b, C.s2, true], [H.s3a, C.s2, C.s3a, true], [H.s3b, C.s3a, C.s3b, false], [H.image, C.done, C.image, true], [H.video, C.image, C.video, false], [H.lip, C.video, C.lip, true],
  [H.cin, C.lip, C.cin, true], [H.pick, C.cin, C.pick, true], [H.demo1, C.pick, C.demo1, false], [H.demo2, C.demo1, C.demo2, false], [H.same, C.demo2, C.same, true], [H.free, C.same, C.free, true],
  [H.price, C.free, C.price, false], [H.cta, C.price, 99, true]];

export const OpenHiggs: React.FC<OpenHiggsProps> = ({words, stars, avatar, avatarTop = 0}) => {
  const t = useT(), face = !!avatar;
  return <WordsCtx.Provider value={words}><AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    <Scene s={0} e={C.h0} z={1}>{avatar && <Avatar src={avatar} phase="hook" top={avatarTop} />}<HookScene face={face} /></Scene>
    <Scene s={C.h0} e={C.name} z={2}><NameScene /></Scene>
    <Scene s={C.name} e={C.mit} z={3} dir="u"><MitScene stars={stars} /></Scene>
    <Scene s={C.mit} e={C.studio} z={4}><StudioScene /></Scene>
    <Scene s={C.studio} e={C.setup} z={5} dir="r"><SetupScene /></Scene>
    <Scene s={C.setup} e={C.s1a} z={6}><Step1Repo /></Scene>
    <Scene s={C.s1a} e={C.s1b} z={7} dir="u"><Step1Folder /></Scene>
    <Scene s={C.s1b} e={C.s2} z={8} dir="r"><Step2Install /></Scene>
    <Scene s={C.s2} e={C.s3a} z={9}><Step3Key /></Scene>
    <Scene s={C.s3a} e={C.s3b} z={10} dir="u"><Step3Run /></Scene>
    <Scene s={C.s3b} e={C.done} z={11}><DoneScene /></Scene>
    <Scene s={C.done} e={C.image} z={12}><ImageScene /></Scene>
    <Scene s={C.image} e={C.video} z={13} dir="l"><VideoScene /></Scene>
    <Scene s={C.video} e={C.lip} z={14}><LipScene /></Scene>
    <Scene s={C.lip} e={C.cin} z={15}><CinemaHome /></Scene>
    <Scene s={C.cin} e={C.pick} z={16}><CinemaPick /></Scene>
    <Scene s={C.pick} e={C.demo1} z={17} dir="u"><DemoImage /></Scene>
    <Scene s={C.demo1} e={C.demo2} z={18} dir="l"><DemoVideo /></Scene>
    <Scene s={C.demo2} e={C.same} z={19}><SameApp /></Scene>
    <Scene s={C.same} e={C.free} z={20}><FreeScene /></Scene>
    <Scene s={C.free} e={C.price} z={21} dir="u"><PriceScene /></Scene>
    <Scene s={C.price} e={99} z={22}>{avatar && <Avatar src={avatar} phase="ending" top={avatarTop} />}<CtaScene face={face} /></Scene>
    {HEADS.map(([g, s, e, dark], i) => <Headline key={i} groups={g} s={s} e={e} dark={dark} />)}
    {t >= C.setup && t < C.s3b && <Tracker step={t < C.s1b ? 0 : t < C.s2 ? 1 : 2} />}
    <LeakFlash at={C.h0} />
    <div style={{position: 'absolute', left: WX, top: 222, zIndex: 46, background: '#0d0b1ad0', color: '#ece8ff', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
  </AbsoluteFill></WordsCtx.Provider>;
};
