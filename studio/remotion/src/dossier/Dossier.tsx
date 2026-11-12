// DOSSIER reel (job 4a300e0907a4, comment keyword DOSSIER). Voice-only edit: real screen recordings of dossier.aien.me and
// github.com/AienTech/dossier (recorded 12 Nov 2026; avatars and the issue author's handle removed before recording), the
// project's own README screenshots (demo data, Jane Doe is made up) and motion graphics; boxed captions under the picture.
// Every time below is a spoken-word time from the recorded narration (voice/words.json, fixed by hand against script.txt).
// Presenter: optional. With `avatar` (a video under the public dir; clip time 0 = hook start, the ending follows directly at
// 2.55 s, see SLOTS) the hook becomes a split screen (README on top, presenter below, title on the seam) and the ending a
// full-frame presenter with the comment box. Without it (the final: owner 12 Nov, no presenter clip) both are full-frame
// motion graphics.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type DossierProps = {words: Word[]; stars: number; avatar?: string; avatarTop?: number};
// Presenter slots in narration seconds (voice/camera_manifest.json), cut in the pauses around the first and the last lines.
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 2.55], ending: [73.0, 80.51]};

const FPS = 30, SEAM = 864, WX = 100, WW = 840, BAR = 52, CAP = 1288, RECH = 879;   // recordings: 1290x1350 shown 840 wide
const INK = '#0b0a0d', ROSE = '#ff4d6d', PINK = '#ff8fab', GOLD = '#FFD166', GREEN = '#4ADE80', BLUE = '#3B82F6', MAROON = '#8a3324';
const CREAM = '#f1ece2', DARK = '#1d1c1a', MUTED = '#9aa3b5';
const sans = 'Google Sans', serif = 'Instrument Serif', disp = 'Montserrat', ui = 'Inter', mono = 'JetBrains Mono';
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
const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
type Dir = 'l' | 'r' | 'u' | 'd' | 'none';

// ------------------------------------------------------------------ shared pieces
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; dir?: Dir}>> = ({s, e, z, dir = 'none', children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  const q = 1 - eo(pr(t, s, 0.3)), k = s > 0 ? 1 + 0.03 * (1 - eo(pr(t, s, 0.22))) : 1;
  const tr = dir === 'none' ? `scale(${k})` : `translate(${dir === 'l' ? -q * 1080 : dir === 'r' ? q * 1080 : 0}px,${dir === 'u' ? -q * 1920 : dir === 'd' ? q * 1920 : 0}px)`;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'hidden', zIndex: z, transform: tr}}>{children}</div>;
};
const Glow: React.FC<{tone: string; at?: string}> = ({tone, at = '50% 36%'}) => <AbsoluteFill style={{background: `radial-gradient(95% 62% at ${at},${tone},${INK} 74%)`}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#ffffff1a 1.6px,transparent 1.8px)', backgroundSize: '38px 38px'}} /></AbsoluteFill>;
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = GOLD, color = '#1d1400', size = 30, style}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.4, background: bg, color, fontFamily: disp, fontWeight: 900, fontSize: size, lineHeight: 1.15, padding: `${size * 0.3}px ${size * 0.66}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string; ink?: string}> = ({size = 36, color = GREEN, ink = '#06210f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Lens: React.FC<{size: number; color?: string}> = ({size, color = '#111'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke={color} strokeWidth="2.6" /><path d="M15.6 15.6L21 21" stroke={color} strokeWidth="3" strokeLinecap="round" /></svg>;
const Lock: React.FC<{size?: number; color?: string}> = ({size = 18, color = '#7d8799'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill={color} /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth="2.4" /></svg>;
const HEART = 'M12 21s-7.5-4.6-9.6-9.3C.9 8.2 2.8 4.5 6.4 4.5c2 0 3.4 1 4.3 2.3L12 8.6l1.3-1.8c.9-1.3 2.3-2.3 4.3-2.3 3.6 0 5.5 3.7 4 7.2C19.5 16.4 12 21 12 21z';
const Heart: React.FC<{size: number; color?: string; glow?: boolean}> = ({size, color = ROSE, glow}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0, overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${size * 0.16}px ${color})` : undefined}}><path d={HEART} fill={color} /></svg>;
const Plane: React.FC<{size: number; color?: string}> = ({size, color = '#fff'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><path d="M21.5 2.5L10.5 13.5M21.5 2.5l-7 19-4-8-8-4z" fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>;
const Person: React.FC<{size: number; tint: string}> = ({size, tint}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}><circle cx="12" cy="12" r="12" fill={tint} /><circle cx="12" cy="9.4" r="4" fill="#ffffffd0" /><path d="M4.6 20.2c1.4-3.6 4.2-5.4 7.4-5.4s6 1.8 7.4 5.4" fill="#ffffffd0" /></svg>;
const Hearts: React.FC<{at: number; x0: number; x1: number; base: number; n?: number; rise?: number}> = ({at, x0, x1, base, n = 9, rise = 440}) => {
  const t = useT();
  return <>{Array.from({length: n}, (_, i) => { const p = pr(t, at + rnd(i, 1) * 0.5, 1.4); if (p <= 0 || p >= 1) return null;
    return <div key={i} style={{position: 'absolute', left: x0 + rnd(i, 2) * (x1 - x0) + Math.sin(p * 7 + i) * 20, top: base - p * rise, opacity: Math.min(1, 4 * p) * (1 - p), transform: `scale(${0.7 + p * 0.6})`}}>
      <Heart size={30 + rnd(i, 3) * 40} color={i % 2 ? ROSE : PINK} /></div>; })}</>;
};
// Browser window around a real recording. `vt` is the time inside the recording, set by an explicit time map so a highlight
// lands on its spoken word. `oy` scrolls the recording up inside the window (display px); zoom stays within 1.75 of 3x footage.
const Browser: React.FC<React.PropsWithChildren<{url: string; name: string; vt: number; y?: number; visH?: number; zoom?: number; fx?: number; fy?: number; oy?: number; glow?: string}>> =
  ({url, name, vt, y = 300, visH = 860, zoom = 1, fx = 420, fy = 300, oy = 0, glow = '#ffffff22', children}) =>
  <div style={{position: 'absolute', left: WX, top: y, width: WW, height: BAR + visH, borderRadius: 28, overflow: 'hidden', background: '#000', boxShadow: `0 0 0 2px #2c313c,0 40px 90px #000d,0 0 140px ${glow}`}}>
    <div style={{height: BAR, background: '#14171d', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, flexShrink: 0}} />)}
      <div style={{marginLeft: 14, flex: 1, height: 34, borderRadius: 17, background: '#090b0f', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontWeight: 500, fontSize: 20, color: '#c9d3ee', whiteSpace: 'nowrap', overflow: 'hidden'}}><Lock />{url}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: BAR, width: WW, height: visH, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: -oy, width: WW, height: RECH, transform: `scale(${zoom})`, transformOrigin: `${fx}px ${fy}px`}}>
        <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: WW, height: RECH}} /></Freeze>
      </div>
      {children}
    </div>
  </div>;
// A recording on a glow background: the standard voice-over shot.
const Shot: React.FC<React.PropsWithChildren<{name: string; url: string; map: [number, number][]; tone: string; zoom?: number; fx?: number; fy?: number; oy?: number}>> = ({name, url, map, tone, zoom, fx, fy, oy, children}) => {
  const t = useT();
  return <><Glow tone={tone} /><Browser url={url} name={name} vt={mapT(t, map)} glow={tone} zoom={zoom} fx={fx} fy={fy} oy={oy} />{children}</>;
};
// A pill that pops on its word over the lower part of the window (centred, kept inside x 130-950).
const Chip: React.FC<React.PropsWithChildren<{at: number; y?: number; bg?: string; color?: string; size?: number; rot?: number; out?: number}>> = ({at, y = 1100, bg = GOLD, color = '#1d1400', size = 36, rot = -2, out = 99, children}) => {
  const t = useT(), s = pop(t, at, 0.32) * (1 - eo(pr(t, out, 0.2))); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', zIndex: 30, transform: `scale(${s}) rotate(${rot}deg)`}}><Pill bg={bg} color={color} size={size} style={{boxShadow: '0 16px 40px #000a'}}>{children}</Pill></div>;
};
// Count-up card over the lower part of a window: the figure runs toward the value read on the live page.
const Counter: React.FC<{value: number; from: number; dur: number; at: number; label: string; x?: number; w?: number; size?: number}> = ({value, from, dur, at, label, x = 150, w = 740, size = 112}) => {
  const t = useT(), s = pop(t, at, 0.3); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: x, top: 1012, width: w, height: 186, borderRadius: 32, background: '#06120bf2', border: `3px solid ${GREEN}`, boxShadow: `0 20px 60px #000c,0 0 80px ${GREEN}40`, transform: `scale(${s})`, textAlign: 'center', zIndex: 30}}>
    <div style={{fontFamily: disp, fontWeight: 900, fontSize: size, lineHeight: '124px', color: GREEN, letterSpacing: -2, fontVariantNumeric: 'tabular-nums'}}>{fmt(value * eo(pr(t, from, dur)))}</div>
    <div style={{fontFamily: ui, fontWeight: 700, fontSize: 27, color: '#e6ecfb', marginTop: 2}}>{label}</div>
  </div>;
};
// Words that fade up on their spoken times; `c` colours a word.
const Words: React.FC<{items: [number, string, string?][]; style: React.CSSProperties}> = ({items, style}) => {
  const t = useT();
  return <div style={style}>{items.map(([at, w, c], i) => { const p = eo(pr(t, at - 0.08, 0.2));
    return <React.Fragment key={i}>{i > 0 ? ' ' : ''}<span style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 26}px)`, color: c}}>{w}</span></React.Fragment>; })}</div>;
};
const fitSerif = (s: string, max: number, room = 940) => Math.min(max, room / (s.length * 0.42));
const Rays: React.FC<{color: string; y?: number}> = ({color, y = 820}) => { const t = useT();
  return <>{Array.from({length: 16}, (_, i) => <div key={i} style={{position: 'absolute', left: 540, top: y, width: 6, height: 1500, marginLeft: -3, background: `linear-gradient(transparent 24%,${color} 62%,transparent)`, transformOrigin: '50% 0', transform: `rotate(${i * 22.5 + t * 26}deg)`}} />)}</>; };
// Title system (a): white geometric sans line, then a larger italic serif line, word by word.
const TitleCard: React.FC<{l1: [number, string][]; l2: [number, string, string?][]; tone: string; accent: string; s: number}> = ({l1, l2, tone, accent, s}) => {
  const t = useT(), p = eo(pr(t, s, 0.35)), size = fitSerif(l2.map(x => x[1]).join(' '), 178);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 44%,${tone},${INK} 66%)`}}>
    <Rays color={accent + '30'} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 640 - size * 0.5, textAlign: 'center', transform: `scale(${1.08 - 0.08 * p})`}}>
      <Words items={l1} style={{fontFamily: sans, fontWeight: 500, fontSize: 80, lineHeight: '100px', color: '#fff', textShadow: '0 6px 24px #000a'}} />
      <Words items={l2} style={{fontFamily: serif, fontStyle: 'italic', fontSize: size, lineHeight: `${size * 1.02}px`, color: accent, letterSpacing: -1, textShadow: '0 8px 30px #000b'}} />
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ presenter (only when the `avatar` prop is set)
const Avatar: React.FC<{src: string; phase: 'hook' | 'ending'; top: number}> = ({src, phase, top}) => {
  const t = useT(), a = phase === 'hook' ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#20242c'}}>
    <Freeze frame={Math.round(a * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover'}} /></Freeze>
  </div>;
};

// ------------------------------------------------------------------ beat 1: hook "This is the purest form of love!" (0-2.55)
const HookTitle: React.FC<{top: number; k?: number}> = ({top, k = 1}) => {
  const t = useT(), s0 = 1 + 0.05 * (1 - eo(pr(t, 0, 0.35))), hit = (at: number) => 1 + 0.07 * (t >= at ? 1 - eo(pr(t, at, 0.3)) : 0);
  const big: React.CSSProperties = {fontFamily: serif, fontStyle: 'italic', fontSize: 170 * k, lineHeight: `${158 * k}px`, letterSpacing: -2, textShadow: '0 8px 30px #000c'};
  return <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', transform: `scale(${s0})`, transformOrigin: '50% 0'}}>
    <div style={{fontFamily: sans, fontWeight: 500, fontSize: 76 * k, lineHeight: `${92 * k}px`, color: '#fff', textShadow: '0 6px 24px #000c'}}>This is the</div>
    <div style={{...big, color: '#fff', transform: `scale(${hit(0.7)})`}}>purest form</div>
    <div style={{...big, color: ROSE, transform: `scale(${hit(1.86)})`}}>of love!</div>
  </div>;
};
const HookShot: React.FC<{y: number; visH: number}> = ({y, visH}) => {
  const t = useT(), p = eo(pr(t, 0, 2.5));
  return <div style={{position: 'absolute', inset: 0, transform: `scale(${0.95 + 0.05 * p}) rotate(${-1.8 + 1.0 * p}deg)`, transformOrigin: `540px ${y + 300}px`}}>
    <Browser url="github.com/AienTech/dossier" name="r01_readme" vt={mapT(t, [[0, 1.7], [2.6, 3.7]])} y={y} visH={visH} glow="#ff4d6d55" /></div>;
};
const BigHeart: React.FC<{x: number; y: number; size: number}> = ({x, y, size}) => {
  const t = useT(), burst = t >= 1.86 ? 1 + 0.32 * (1 - eo(pr(t, 1.86, 0.4))) : 1, beat = 1 + 0.06 * Math.max(0, Math.sin(t * 8.5));
  return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${(0.85 + 0.15 * eo(pr(t, 0, 0.3))) * burst * beat}) rotate(10deg)`}}><Heart size={size} glow /></div>;
};
const HookFull: React.FC = () => <><Glow tone="#5a1028" at="50% 28%" /><HookShot y={760} visH={640} /><HookTitle top={262} />
  <BigHeart x={742} y={636} size={210} /><Hearts at={1.9} x0={560} x1={900} base={700} /></>;

// ------------------------------------------------------------------ beat 2: story (2.55-9.10)
const JOBS: [string, string][] = [['Product Designer', '#FF6B6B'], ['Data Analyst', '#4CC9F0'], ['Project Manager', '#FFD166'], ['UX Researcher', '#06D6A0'], ['Marketing Lead', '#B388FF'], ['Operations Manager', '#FF9F1C']];
const Spinner: React.FC<{size: number; color?: string}> = ({size, color = MAROON}) => { const t = useT();
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', transform: `rotate(${t * 400}deg)`}}><circle cx="12" cy="12" r="9" fill="none" stroke="#00000018" strokeWidth="3" /><path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" /></svg>; };
const Hourglass: React.FC<{size: number}> = ({size}) => { const t = useT(), f = (t * 1.1) % 1, rot = f > 0.8 ? (f - 0.8) / 0.2 * 180 : 0;
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', transform: `rotate(${rot}deg)`}}><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    <path d={`M8.5 ${4 + 4 * Math.min(1, f / 0.8)}h7l-3.5 ${6 - 4 * Math.min(1, f / 0.8)}z`} fill={GOLD} /><path d={`M12 ${20 - 5 * Math.min(1, f / 0.8)}l4 ${5 * Math.min(1, f / 0.8)}H8z`} fill={GOLD} /></svg>; };
const StuckScene: React.FC = () => {
  const t = useT(), s = SLOTS.hook[1], off = Math.max(0, t - s) * 330, row = 156, typed = 'jobs'.slice(0, Math.floor(pr(t, s + 0.12, 0.4) * 4.99));
  const fade = 'linear-gradient(transparent,#000 10%,#000 82%,transparent)';
  return <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 30%,#2a3566,#0b0d18 72%)'}}>
    <div style={{position: 'absolute', left: WX, top: 300, width: WW, height: 900, borderRadius: 40, background: '#f6f4ef', overflow: 'hidden', boxShadow: '0 40px 90px #000c'}}>
      <div style={{position: 'absolute', left: 36, right: 36, top: 34, height: 100, borderRadius: 50, background: '#fff', border: '3px solid #d9d3c7', display: 'flex', alignItems: 'center', gap: 18, padding: '0 30px', boxSizing: 'border-box'}}>
        <Lens size={46} color={DARK} /><span style={{fontFamily: ui, fontWeight: 600, fontSize: 46, color: DARK}}>{typed}<span style={{opacity: Math.floor(t * 4) % 2 ? 1 : 0.2, color: MAROON}}>|</span></span>
        <div style={{marginLeft: 'auto'}}><Spinner size={54} /></div></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 160, bottom: 0, overflow: 'hidden', maskImage: fade, WebkitMaskImage: fade}}>
        {Array.from({length: 7}, (_, k) => { const i = k + Math.floor(off / row), y = k * row - (off % row), [job, tint] = JOBS[i % JOBS.length];
          return <div key={i} style={{position: 'absolute', left: 36, right: 36, top: y, height: row - 22, borderRadius: 26, background: '#fff', border: '2px solid #e4ded2', display: 'flex', alignItems: 'center', gap: 24, padding: '0 26px', boxSizing: 'border-box'}}>
            <div style={{width: 76, height: 76, borderRadius: 20, background: tint, flexShrink: 0}} />
            <div style={{flex: 1}}><div style={{fontFamily: ui, fontWeight: 800, fontSize: 36, color: DARK, letterSpacing: -0.5}}>{job}</div>
              <div style={{width: 260 - (i % 3) * 40, height: 14, borderRadius: 7, background: '#e7e1d5', marginTop: 12}} /></div>
            <div style={{fontFamily: ui, fontWeight: 700, fontSize: 28, color: DARK, border: `2px solid ${DARK}`, borderRadius: 30, padding: '10px 26px'}}>Apply</div>
          </div>; })}
      </div>
    </div>
    <div style={{position: 'absolute', left: 836, top: 238, width: 128, height: 128, borderRadius: 64, background: MAROON, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px #000a', transform: `scale(${pop(t, s + 0.3, 0.3)})`}}><Hourglass size={78} /></div>
  </AbsoluteFill>;
};
const BuiltScene: React.FC = () => {
  const t = useT(), s = 4.47, draw = eo(pr(t, s, 0.55)), on = eo(pr(t, 4.98, 0.35)), spark = pr(t, 5.6, 0.6);
  return <AbsoluteFill style={{background: 'linear-gradient(165deg,#f6f1e7,#ddd3c1)'}}>
    <div style={{opacity: on, filter: `blur(${(1 - on) * 14}px)`}}>
      <Browser url="dossier.aien.me" name="r02_hero" vt={mapT(t, [[4.47, 0.4], [5.08, 1.35], [5.9, 2.35], [6.25, 3.05], [6.62, 4.02], [7.25, 4.8]])} glow="#8a332433" /></div>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 1 - on * 0.85}}><rect x={WX} y={300} width={WW} height={BAR + 860} rx={28} fill="none" stroke={MAROON} strokeWidth={5} strokeDasharray={3500} strokeDashoffset={3500 * (1 - draw)} /></svg>
    {spark > 0 && spark < 1 && Array.from({length: 10}, (_, i) => { const a = i / 10 * Math.PI * 2, r = 60 + 220 * eo(spark);
      return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * r - 9, top: 640 + Math.sin(a) * r * 0.7 - 9, width: 18, height: 18, borderRadius: 9, background: i % 2 ? GOLD : MAROON, opacity: 1 - spark}} />; })}
  </AbsoluteFill>;
};
const FAN: [string, string, number][] = [['Senior Product Designer', 'Ledgerly', 7.78], ['Design Systems Lead', 'Oaken Studio', 8.42], ['Product Designer, Mobile', 'Kestrel Maps', 8.1]];
const ResumeFan: React.FC = () => {
  const t = useT(), spread = eo(pr(t, 7.3, 0.4)), W = 520, H = 504;
  const pos = [{dx: -190, r: -8}, {dx: 190, r: 8}, {dx: 0, r: 0}];
  return <AbsoluteFill style={{background: 'linear-gradient(165deg,#f6f1e7,#ddd3c1)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 286, textAlign: 'center', transform: `scale(${pop(t, 7.25, 0.3)})`}}><Pill bg={DARK} color="#fff" size={34}>Base resume</Pill></div>
    {pos.map((p, i) => <div key={i} style={{position: 'absolute', left: 540 - W / 2 + p.dx * spread, top: 440 + Math.abs(p.r) * 3 * spread, width: W, transform: `rotate(${p.r * spread}deg)`, zIndex: i === 2 ? 3 : 1}}>
      <div style={{width: W, height: H, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 60px #5b4b2a55', border: '2px solid #e6e0d4', opacity: i === 2 ? 1 : spread}}><Img src={A('resume_doc.jpg')} style={{width: W, height: H, objectFit: 'cover'}} /></div></div>)}
    {FAN.map((f, i) => { const tag = pop(t, f[2], 0.3); if (tag <= 0) return null;   // job tags sit above all cards, side ones at the outer corners
      const at: React.CSSProperties = i === 0 ? {left: 70, transformOrigin: '0 100%'} : i === 1 ? {right: 70, transformOrigin: '100% 100%'} : {left: 0, right: 0, textAlign: 'center'};
      return <div key={'tag' + i} style={{position: 'absolute', top: i === 2 ? 392 : 412, zIndex: 5, transform: `scale(${tag})`, ...at}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: MAROON, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 26, padding: '12px 22px', borderRadius: 30, boxShadow: '0 10px 24px #0006', whiteSpace: 'nowrap'}}><Tick size={30} color="#fff" ink={MAROON} />{f[1]}</div></div>; })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 23, color: '#6b6458'}}>README screens · demo data, Jane Doe is made up</div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beat 3: twist "The crazy part: he made it free, and you can use it too!" (9.10-12.95)
const FreeScene: React.FC = () => {
  const t = useT(), late = t >= 11.62, l2 = late ? 'use it too!' : 'he made it free,', size = fitSerif(l2, 150);
  return <><Glow tone="#0f3a26" at="50% 24%" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 262, textAlign: 'center'}}>
      {late ? <Words items={[[11.7, 'and'], [11.82, 'you'], [11.98, 'can']]} style={{fontFamily: sans, fontWeight: 500, fontSize: 76, lineHeight: '96px', color: '#fff'}} />
        : <Words items={[[9.24, 'The'], [9.44, 'crazy'], [9.68, 'part:']]} style={{fontFamily: sans, fontWeight: 500, fontSize: 76, lineHeight: '96px', color: '#fff'}} />}
      {late ? <Words items={[[12.1, 'use'], [12.28, 'it'], [12.44, 'too!', GREEN]]} style={{fontFamily: serif, fontStyle: 'italic', fontSize: size, lineHeight: `${size}px`, color: '#fff', letterSpacing: -1}} />
        : <Words items={[[10.36, 'he'], [10.6, 'made'], [10.78, 'it'], [11.02, 'free,', GREEN]]} style={{fontFamily: serif, fontStyle: 'italic', fontSize: size, lineHeight: `${size}px`, color: '#fff', letterSpacing: -1}} />}
    </div>
    <Browser url="dossier.aien.me" name="r03_free" vt={mapT(t, [[9.1, 0.9], [10.98, 1.6], [11.75, 3.1], [12.15, 4.9], [12.95, 5.9]])} y={580} visH={600} oy={170} glow="#4ADE8044" />
    <Chip at={12.2} y={1130} bg={GREEN} color="#06210f" size={36}>AGPL-3.0 · free software</Chip>
  </>;
};
const LightLeak: React.FC<{at: number}> = ({at}) => {
  const t = useT(), p = pr(t, at - 0.22, 0.5); if (p <= 0 || p >= 1) return null;
  const a = Math.sin(p * Math.PI);
  return <AbsoluteFill style={{zIndex: 44, mixBlendMode: 'screen', opacity: a, background: `radial-gradient(70% 50% at ${20 + 60 * p}% 42%,#ffc078,#ff5a7acc 42%,#ff5a7a00 78%)`}} />;
};

// ------------------------------------------------------------------ beats 4 and 5: name, the pain (12.95-18.15)
const NameScene: React.FC = () => {
  const t = useT(), icon = pop(t, 12.96, 0.4), word = eo(pr(t, 13.62, 0.4));
  return <AbsoluteFill style={{background: `radial-gradient(80% 50% at 50% 38%,#fbf8f2,${CREAM} 60%,#ddd3c1)`}}>
    <div style={{position: 'absolute', left: 390, top: 330, width: 300, height: 300, transform: `scale(${icon}) rotate(${(1 - eo(pr(t, 12.96, 0.4))) * -12}deg)`, filter: 'drop-shadow(0 30px 40px #3b2a1a55)'}}><Img src={A('dossier-icon.svg')} style={{width: 300, height: 300}} /></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 676, textAlign: 'center', fontFamily: serif, fontSize: 230, lineHeight: '230px', color: DARK, letterSpacing: -3, clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`}}>Dossier</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 940, textAlign: 'center', opacity: pr(t, 13.9, 0.3)}}><span style={{fontFamily: mono, fontWeight: 700, fontSize: 36, color: MAROON, background: '#fff', borderRadius: 18, padding: '10px 26px', border: '2px solid #e2dacb'}}>dossier.aien.me</span></div>
  </AbsoluteFill>;
};
const Clock: React.FC<{size: number; speed: number; s: number}> = ({size, speed, s}) => { const t = useT(), a = Math.max(0, t - s) * 360 * speed;
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}><circle cx="12" cy="12" r="10.5" fill="#fff" stroke={DARK} strokeWidth="1.5" />
    {Array.from({length: 12}, (_, i) => <path key={i} d="M12 2.6v1.6" stroke={DARK} strokeWidth="1" transform={`rotate(${i * 30} 12 12)`} />)}
    <path d="M12 12V5.6" stroke={MAROON} strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${a} 12 12)`} /><path d="M12 12V8" stroke={DARK} strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${a / 12} 12 12)`} /><circle cx="12" cy="12" r="1.2" fill={DARK} /></svg>; };
const PainScene: React.FC = () => {
  const t = useT(), s = 14.9, cyc = 0.6, k = Math.max(0, (t - s - 0.12) / cyc), n = Math.min(JOBS.length - 1, Math.floor(k)), f = k - Math.floor(k);
  const ages = pr(t, 16.9, 0.4), lines = [300, 250, 280, 200, 270, 230, 180, 250];
  return <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 40%,${ages > 0 ? '#5a1418' : '#4a1418'},${INK} 74%)`}}>
    <div style={{position: 'absolute', left: 470, top: 250, transform: `scale(${(0.9 + 0.1 * eo(pr(t, s, 0.3))) * (1 + 0.25 * ages)})`, transformOrigin: '70px 70px'}}><Clock size={140} speed={0.6 + 5 * ages} s={s} /></div>
    <div style={{position: 'absolute', left: 120, top: 470, width: 380, height: 520, borderRadius: 24, background: '#fff', boxShadow: '0 30px 60px #000a', padding: '34px 30px', boxSizing: 'border-box'}}>
      <div style={{fontFamily: ui, fontWeight: 800, fontSize: 30, color: DARK}}>Resume</div>
      <div style={{width: 200, height: 12, borderRadius: 6, background: '#c9bfae', marginTop: 12}} />
      {lines.map((w, i) => { const d = i * 0.04, wipe = f < 0.4 ? 1 - cl((f - d) / 0.25) : cl((f - 0.4 - d) / 0.45);
        return <div key={i} style={{width: w * (k < 1 ? 1 : wipe), height: 14, borderRadius: 7, background: i % 3 === 0 ? '#d8a79a' : '#e2ddd3', marginTop: 24}} />; })}
      {k >= 1 && f >= 0.4 && <div style={{position: 'absolute', left: 30 + 280 * cl((f - 0.4) / 0.5), top: 140 + 38 * Math.floor(cl((f - 0.4) / 0.55) * 8), width: 4, height: 26, background: MAROON}} />}
    </div>
    <svg width={90} height={90} viewBox="0 0 24 24" style={{position: 'absolute', left: 495, top: 690, transform: `rotate(${(t - s) * 280}deg)`}}><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" /><path d="M17.9 2.6l-.2 3.9-3.9-.2M6.1 21.4l.2-3.9 3.9.2" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    {Array.from({length: n + 1}, (_, i) => { const land = i === n ? eo(cl(f / 0.35)) : 1, [job, tint] = JOBS[i];
      return <div key={i} style={{position: 'absolute', left: 580 + (1 - land) * 520 - (n - i) * 10, top: 470 + (n - i) * 14, width: 360, height: 500, borderRadius: 24, background: '#fff', boxShadow: '0 30px 60px #000a', padding: '34px 30px', boxSizing: 'border-box', transform: `rotate(${(i % 2 ? 2 : -2) * (n - i + 1) * 0.7}deg)`, opacity: i < n - 2 ? 0 : 1}}>
        <div style={{width: 74, height: 74, borderRadius: 18, background: tint}} />
        <div style={{fontFamily: ui, fontWeight: 800, fontSize: 34, lineHeight: 1.15, color: DARK, marginTop: 22, letterSpacing: -0.5}}>{job}</div>
        {[260, 220, 280, 180, 240].map((w, j) => <div key={j} style={{width: w, height: 12, borderRadius: 6, background: '#e7e1d5', marginTop: 20}} />)}
      </div>; })}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beats 6 and 7: how it works, what it writes (18.15-32.40)
const SITE = 'dossier.aien.me', REPO = 'github.com/AienTech/dossier', ISSUE = 'github.com/AienTech/dossier/issues/13';
const DOCS: [string, number][] = [['Tailored resume', 27.28], ['Cover letter', 28.4], ['Email', 29.22]];
const DocList: React.FC = () => { const t = useT(); if (t < 27.2) return null;
  return <div style={{position: 'absolute', left: 130, top: 1000, width: 470, padding: '20px 26px', borderRadius: 28, background: '#111a2ef0', border: '2px solid #2a3657', boxShadow: '0 20px 50px #000c', zIndex: 30, transform: `scale(${pop(t, 27.2, 0.3)})`, transformOrigin: '0 100%'}}>
    {DOCS.map(([d, at]) => <div key={d} style={{display: 'flex', alignItems: 'center', gap: 18, height: 56, opacity: t >= at - 0.05 ? 1 : 0.28}}>
      <div style={{transform: `scale(${t >= at - 0.05 ? pop(t, at - 0.05, 0.3) : 1})`}}>{t >= at - 0.05 ? <Tick size={40} /> : <div style={{width: 40, height: 40, borderRadius: 20, border: '3px solid #4a5576', boxSizing: 'border-box'}} />}</div>
      <span style={{fontFamily: ui, fontWeight: 800, fontSize: 36, color: '#fff'}}>{d}</span></div>)}
  </div>;
};
// Count-up badges beside the two tile headings of the recording ("Twelve resume themes", "Documents in 21 languages").
const NumberBadges: React.FC = () => { const t = useT();
  const badge = (y: number, v: number, at: number) => { const s = pop(t, at, 0.32); if (s <= 0) return null;
    return <div style={{position: 'absolute', left: 764, top: y, width: 156, height: 156, borderRadius: 78, background: GOLD, boxShadow: `0 16px 40px #000b,0 0 60px ${GOLD}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) rotate(-6deg)`, zIndex: 30,
      fontFamily: disp, fontWeight: 900, fontSize: 88, color: '#1d1400', fontVariantNumeric: 'tabular-nums'}}>{Math.round(v * eo(pr(t, at + 0.02, 0.45)))}</div>; };
  return <>{badge(512, 12, 30.06)}{badge(978, 21, 31.14)}</>;
};

// ------------------------------------------------------------------ beat 9: the board (41.40-45.40), the project's README screenshot
// board.jpg: applications.png cropped to the column headers and cards (2660x960 source px), shown at k = 0.8125.
const BoardScene: React.FC = () => {
  const t = useT(), H = 780, k = H / 960, W = Math.round(2660 * k), pan = eo(pr(t, 44.18, 0.62)) * (W - WW), z = 1 + 0.05 * eo(pr(t, 41.4, 2.6));
  const ring = (x0: number, x1: number, at: number) => { const s = pop(t, at, 0.3); if (s <= 0) return null;   // source px of a column header
    return <div style={{position: 'absolute', left: x0 * k - 10, top: 160 * k - 14, width: (x1 - x0) * k + 20, height: 66 * k + 28, border: `6px solid ${GOLD}`, borderRadius: 18, transform: `scale(${s})`, boxShadow: `0 0 30px ${GOLD}88`}} />; };
  return <><Glow tone="#2a1f5c" />
    <div style={{position: 'absolute', left: WX, top: 300, width: WW, height: BAR + H, borderRadius: 28, overflow: 'hidden', background: '#f3f1ec', boxShadow: '0 0 0 2px #2c313c,0 40px 90px #000d,0 0 140px #8f7bff44'}}>
      <div style={{height: BAR, background: '#14171d', display: 'flex', alignItems: 'center', gap: 9, padding: '0 20px'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
        <div style={{marginLeft: 14, fontFamily: mono, fontWeight: 500, fontSize: 20, color: '#c9d3ee', whiteSpace: 'nowrap'}}>README screenshot · demo data</div></div>
      <div style={{position: 'absolute', left: 0, top: BAR, width: WW, height: H, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -pan, top: 0, width: W, height: H, transform: `scale(${z})`, transformOrigin: `${pan + 420}px 300px`}}>
          <Img src={A('board.jpg')} style={{width: W, height: H}} />
          {ring(18, 521, 43.98)}{ring(2146, 2647, 44.84)}
        </div>
      </div>
    </div></>;
};

// ------------------------------------------------------------------ beat 9-10: local model, open source and stars (45.40-55.30)
const Laptop: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}><rect x="4" y="4.5" width="16" height="11" rx="1.6" fill="#111a2e" stroke="#fff" strokeWidth="1.4" /><path d="M2 18.5h20l-1.5 1.8h-17z" fill="#fff" />
  <rect x="9.6" y="9.4" width="4.8" height="3.8" rx=".7" fill={GREEN} /><path d="M10.7 9.4V8.3a1.3 1.3 0 0 1 2.6 0v1.1" fill="none" stroke={GREEN} strokeWidth="1" /></svg>;
const RepoScene: React.FC<{stars: number}> = ({stars}) => {
  // punch in on the licence row for "open source", then cut (in the pause at 52.35) to a push onto the star counter
  const t = useT(), star = t >= 52.35, z = star ? 1 + 0.7 * eo(pr(t, 52.42, 0.55)) : 1 + 0.32 * eo(pr(t, 51.25, 0.4));
  return <><Glow tone="#1d2f6b" /><Browser url={REPO} name="r10_repo" vt={mapT(t, [[49.5, 0.2], [50.9, 0.83], [51.55, 1.85], [52.35, 3.0], [52.92, 3.9], [55.3, 6.4]])} zoom={z} fx={star ? 107 : 177} fy={star ? 527 : 310} glow="#4C8DFF44" />
    <Counter value={stars} at={52.92} from={52.95} dur={0.8} label="GitHub stars · read 12 Nov 2026" /></>;
};

// ------------------------------------------------------------------ beat 11: the twist (55.30-68.40)
const Eye: React.FC = () => <svg width={84} height={84} viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="12" cy="12" r="3.2" fill="#fff" /></svg>;
const Check: React.FC = () => <svg width={84} height={84} viewBox="0 0 24 24"><rect x="4" y="3" width="13" height="17" rx="2" fill="none" stroke="#fff" strokeWidth="1.8" /><path d="M7.5 8h6M7.5 11.5h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><circle cx="17.5" cy="17" r="4.5" fill={GREEN} /><path d="M15.4 17.1l1.5 1.5 2.7-2.9" fill="none" stroke="#06210f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const STEPS: [string, number, React.ReactNode, string][] = [['You read it', 65.98, <Eye key="e" />, '#4C8DFF'], ['You check it', 66.74, <Check key="c" />, '#22B8A7'], ['You hit send', 67.52, <Plane key="p" size={78} />, BLUE]];
const ThreeSteps: React.FC = () => {
  const t = useT();
  return <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 35%,#16224a,#07090d 72%)'}}>
    {STEPS.map(([label, at, icon, tone], i) => { const s = pop(t, at - 0.08, 0.32), y = 330 + i * 250, done = t >= at + 0.32, fly = i === 2 ? pr(t, 67.78, 0.5) : 0;
      if (s <= 0) return <div key={i} style={{position: 'absolute', left: WX, top: y, width: WW, height: 210, borderRadius: 36, border: '3px dashed #2a3657', boxSizing: 'border-box'}} />;
      return <div key={i} style={{position: 'absolute', left: WX, top: y, width: WW, height: 210, borderRadius: 36, background: '#111a2e', border: `3px solid ${done ? GREEN : '#2a3657'}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 34, padding: '0 34px', transform: `scale(${s})`, boxShadow: '0 20px 50px #000a'}}>
        <div style={{position: 'relative', width: 140, height: 140, borderRadius: 34, background: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{icon}
          {fly > 0 && fly < 1 && <div style={{position: 'absolute', left: 30 + fly * 130, top: 30 - fly * 130, opacity: 1 - fly, transform: `scale(${1 - 0.4 * fly})`}}><Plane size={80} /></div>}</div>
        <span style={{fontFamily: disp, fontWeight: 900, fontSize: 70, color: '#fff', letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{label}</span>
        <div style={{marginLeft: 'auto', transform: `scale(${pop(t, at + 0.32, 0.3)})`}}><Tick size={66} /></div>
      </div>; })}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beat 12: the honest part (68.40-73.00)
const PhoneX: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', overflow: 'visible'}}><rect x="6" y="2" width="12" height="20" rx="2.6" fill="#111a2e" stroke="#fff" strokeWidth="1.4" /><path d="M10.5 4.4h3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
  <circle cx="18" cy="18" r="5.4" fill={ROSE} /><path d="M15.8 15.8l4.4 4.4M20.2 15.8l-4.4 4.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>;

// ------------------------------------------------------------------ beat 13: payoff "Someone you love ... Send them this!" (73.00-77.10)
const Calendar: React.FC<{s: number}> = ({s}) => { const t = useT(), f = Math.max(0, t - s) / 0.22, n = Math.floor(f), p = f - n;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 150, height: 160}}>
    <div style={{position: 'absolute', left: 0, top: 18, width: 150, height: 142, borderRadius: 22, background: '#fff', boxShadow: '0 16px 30px #0008'}} />
    <div style={{position: 'absolute', left: 0, top: 18, width: 150, height: 42, borderRadius: '22px 22px 0 0', background: ROSE}} />
    {[36, 104].map(x => <div key={x} style={{position: 'absolute', left: x, top: 6, width: 12, height: 32, borderRadius: 6, background: DARK}} />)}
    {[0, 1, 2].map(r => [0, 1, 2, 3].map(c => <div key={`${r}${c}`} style={{position: 'absolute', left: 18 + c * 30, top: 76 + r * 26, width: 20, height: 14, borderRadius: 4, background: (r * 4 + c + n) % 5 === 0 ? '#ffc2cf' : '#ece7de'}} />))}
    {t >= s && n < 6 && <div style={{position: 'absolute', left: 0, top: 18, width: 150, height: 142, borderRadius: 22, background: '#fff', transformOrigin: '50% 0', transform: `perspective(400px) rotateX(${p * 100}deg)`, opacity: 1 - p}} />}
  </div>;
};
const ShareScene: React.FC = () => {
  const t = useT(), heart = pop(t, 73.82, 0.45), sel = t >= 76.16, press = t >= 76.3 && t < 76.5, sent = t >= 76.5, fly = pr(t, 76.45, 0.6);
  return <AbsoluteFill style={{background: 'radial-gradient(90% 55% at 50% 26%,#6a1430,#0b0a0d 74%)'}}>
    <div style={{position: 'absolute', left: 430, top: 262, transform: `scale(${(0.55 + 0.45 * heart) * (1 + 0.06 * Math.max(0, Math.sin(t * 8.5)))})`, opacity: 0.4 + 0.6 * Math.min(1, heart)}}><Heart size={220} glow /></div>
    <Hearts at={73.9} x0={330} x1={760} base={460} n={8} rise={280} />
    <div style={{position: 'absolute', left: 760, top: 300, transform: `scale(${pop(t, 74.3, 0.3)}) rotate(6deg)`}}><Calendar s={74.6} /></div>
    <div style={{position: 'absolute', left: WX, top: 600, width: WW, height: 620, borderRadius: 40, background: '#141821', border: '2px solid #2a3142', boxShadow: '0 30px 80px #000c', transform: `translateY(${(1 - eo(pr(t, 73.1, 0.4))) * 90}px)`, opacity: eo(pr(t, 73.1, 0.3))}}>
      <div style={{position: 'absolute', left: 40, top: 34, display: 'flex', alignItems: 'center', gap: 18}}><Plane size={44} /><span style={{fontFamily: ui, fontWeight: 800, fontSize: 42, color: '#fff'}}>Send to</span></div>
      <div style={{position: 'absolute', left: 40, top: 128, width: 760, display: 'flex', flexWrap: 'wrap', gap: '30px 38px'}}>
        {['#8f7bff', '#22B8A7', '#FF9F1C', '#4C8DFF', '#F472B6', '#06D6A0', '#FF6B6B', '#FFD166'].map((c, i) => { const on = sel && i === 0;
          return <div key={c} style={{position: 'relative', width: 152, height: 152, borderRadius: 76, boxShadow: on ? `0 0 0 6px ${BLUE}` : undefined, transform: `scale(${on ? 1 + 0.1 * (1 - eo(pr(t, 76.16, 0.3))) : 1})`}}>
            <Person size={152} tint={c} />{on && <div style={{position: 'absolute', right: -6, bottom: -6}}><Tick size={54} color={BLUE} ink="#fff" /></div>}</div>; })}
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 34, height: 104, borderRadius: 52, background: sent ? GREEN : BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, transform: `scale(${press ? 0.94 : 1})`}}>
        <span style={{fontFamily: ui, fontWeight: 800, fontSize: 46, color: sent ? '#06210f' : '#fff'}}>{sent ? 'Sent' : 'Send'}</span>{sent ? <Tick size={46} color="#06210f" ink={GREEN} /> : <Plane size={40} />}</div>
    </div>
    {fly > 0 && fly < 1 && <div style={{position: 'absolute', left: 540 + fly * 420, top: 1150 - fly * 820, transform: `rotate(${-10 + fly * 20}deg) scale(${1.4 - fly * 0.6})`, opacity: 1 - fly * fly}}><Plane size={110} /></div>}
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beat 14: CTA "Follow me and comment DOSSIER, and I'll send you the setup guide!" (77.10-end)
const Monogram: React.FC<{size: number}> = ({size}) => <div style={{width: size, height: size, borderRadius: size / 2, background: 'linear-gradient(135deg,#3B82F6,#1d2f6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: disp, fontWeight: 900, fontSize: size * 0.5, color: '#fff', flexShrink: 0}}>W</div>;
const CommentBox: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const t = useT(), typed = 'DOSSIER'.slice(0, Math.floor(pr(t, 78.28, 0.56) * 7.99));
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: 128, borderRadius: 64, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
    <Person size={92} tint="#9aa3b5" />
    <div style={{flex: 1, marginLeft: 22, fontFamily: typed ? disp : ui, fontWeight: typed ? 900 : 600, fontSize: typed ? 56 : 44, color: typed ? '#111' : '#9aa3b5', letterSpacing: typed ? 2 : 0}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: BLUE, fontWeight: 500}}>|</span></div>
    <div style={{background: BLUE, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '18px 36px', borderRadius: 44, transform: `scale(${1 + 0.14 * (t >= 78.95 ? 1 - eo(pr(t, 78.95, 0.3)) : 0)})`}}>Post</div>
  </div>;
};
const DmCard: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const t = useT(), dm = eo(pr(t, 79.3, 0.36));
  return <div style={{position: 'absolute', left: x, top: y + (1 - dm) * 80, width: w, height: 236, borderRadius: 34, background: '#111a2e', border: '2px solid #2a3657', padding: '22px 28px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000c', opacity: dm}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Monogram size={58} /><span style={{fontFamily: ui, fontWeight: 700, fontSize: 32, color: MUTED}}>Direct message</span></div>
    <div style={{marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 16, background: BLUE, color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 42, padding: '20px 30px', borderRadius: '8px 30px 30px 30px', whiteSpace: 'nowrap'}}>
      <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>Your Dossier setup guide</div>
  </div>;
};
const CtaScene: React.FC = () => {
  const t = useT(), n = Math.floor(pr(t, 78.28, 0.56) * 7.99), on = t >= 77.34;
  return <><Glow tone="#12357a" at="50% 40%" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, transform: `scale(${0.92 + 0.08 * eo(pr(t, 77.1, 0.3))})`}}>
      <Monogram size={124} />
      <div style={{display: 'flex', alignItems: 'center', gap: 14, background: on ? '#1c2742' : BLUE, border: on ? `3px solid ${GREEN}` : `3px solid ${BLUE}`, color: on ? GREEN : '#fff', fontFamily: ui, fontWeight: 800, fontSize: 48, padding: '20px 40px', borderRadius: 60,
        transform: `scale(${1 + 0.2 * (on ? 1 - eo(pr(t, 77.34, 0.32)) : 0)})`}}>{on ? 'Following' : 'Follow'}{on && <Tick size={46} color={GREEN} />}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: disp, fontWeight: 900, fontSize: 170, lineHeight: '200px', letterSpacing: 2, whiteSpace: 'nowrap'}}>
      {'DOSSIER'.split('').map((c, i) => <span key={i} style={{display: 'inline-block', color: i < n ? '#fff' : 'transparent', WebkitTextStroke: i < n ? undefined : '3px #ffffff40', transform: `scale(${i < n ? 1 + 0.2 * (1 - eo(pr(t, 78.28 + i * 0.07, 0.25))) : 1})`, textShadow: i < n ? `0 0 50px ${BLUE}aa` : undefined}}>{c}</span>)}</div>
    <CommentBox x={WX} y={782} w={WW} />
    <div style={{position: 'absolute', left: WX, top: 986, width: WW, height: 236, borderRadius: 34, border: '4px dashed #ffffff30', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - pr(t, 79.3, 0.2)}}>
      <div style={{opacity: 0.35 + 0.25 * Math.sin(t * 6), transform: `translate(${Math.sin(t * 3) * 8}px,${-Math.sin(t * 3) * 8}px)`}}><Plane size={110} /></div></div>
    <DmCard x={WX} y={986} w={WW} />
  </>;
};

// ------------------------------------------------------------------ captions: system (b), sentence-case phrases in a charcoal box
// [first word, last word, text]; word indices follow words.json. Title scenes (hook, the two "crazy part" lines, the twist,
// the honest part, read/check/send) carry the spoken words themselves and have no box.
const GROUPS: [number, number, string][] = [
  [7, 10, 'His wife was stuck'], [11, 12, 'job hunting,'], [13, 18, 'so he built her an app'], [19, 22, 'that writes her resume'], [23, 25, 'for every job'], [26, 28, 'she applies to.'],
  [42, 44, "It's called Dossier."], [45, 47, 'Rewriting a resume'], [48, 50, 'for every job'], [51, 52, 'takes ages.'],
  [53, 56, 'Here, you fill in'], [57, 59, 'your profile once.'], [60, 61, 'You paste'], [62, 64, 'a job posting,'], [65, 67, 'or let Dossier'], [68, 70, 'search job listings'], [71, 72, 'for you.'],
  [73, 74, 'It reads'], [75, 78, 'what the company wants'], [79, 80, 'and writes'], [81, 83, 'a tailored resume,'], [84, 86, 'a cover letter'], [87, 89, 'and the email,'], [90, 92, 'in twelve designs'], [93, 95, 'and twenty-one languages.'],
  [101, 102, 'By default,'], [103, 106, 'it never invents experience.'], [107, 109, 'If the job'], [110, 113, 'asks for a skill'], [114, 116, "you don't have,"], [117, 119, 'it shows you'], [120, 122, 'the gap instead.'],
  [123, 126, 'It tracks every application'], [127, 129, 'on a board,'], [130, 133, 'from draft to offer.'],
  [134, 136, 'And with a'], [137, 139, 'local AI model,'], [140, 142, 'your data never'], [143, 145, 'leaves your laptop.'],
  [146, 150, 'Once it worked for her,'], [151, 153, 'he made it'], [154, 155, 'open source.'], [156, 159, 'Over 5,000 developers'], [160, 162, 'have starred it.'],
  [167, 168, 'A stranger'], [169, 172, 'asked him to stop'], [173, 174, 'sharing it,'], [175, 177, 'saying it would'], [178, 179, 'flood companies'], [180, 182, 'with AI resumes.'],
  [183, 185, 'He said no,'], [186, 187, 'because Dossier'], [188, 191, 'never applies for anyone.'],
  [204, 207, 'Setup takes some patience,'], [208, 210, "and it's not"], [211, 212, 'for phones.'],
  [213, 215, 'Someone you love'], [216, 219, 'has been job hunting'], [220, 221, 'for months.'], [222, 224, 'Send them this!'],
  [225, 227, 'Follow me and'], [228, 229, 'comment DOSSIER,'], [230, 233, "and I'll send you"], [234, 236, 'the setup guide!'],
];
export const CUTS = [2.55, 4.47, 7.25, 9.1, 12.95, 14.9, 18.15, 20.45, 21.88, 24.5, 26.4, 28.62, 29.62, 32.4, 34.1, 37.05, 41.4, 45.4, 49.5, 55.3, 56.95, 61.85, 63.0, 65.6, 68.4, 69.95, 71.35, 73.0, 77.1, 99];
const Captions: React.FC<{words: Word[]; avatar: boolean}> = ({words, avatar}) => {
  const t = useT(), st = GROUPS.map(g => words[g[0]].startMs / 1000 - 0.04);
  const i = GROUPS.findIndex((g, k) => { const e0 = words[g[1]].endMs / 1000, cut = CUTS.find(c => c > e0 - 0.05) ?? 99;
    return t >= st[k] && t < Math.min(e0 + 0.4, cut, k + 1 < GROUPS.length ? st[k + 1] : 99); });
  if (i < 0) return null;
  const text = GROUPS[i][2], size = Math.min(54, 740 / (text.length * 0.62)), s = 1 + 0.06 * (1 - eo(pr(t, st[i], 0.12)));
  return <div style={{position: 'absolute', left: 0, right: 0, top: avatar && t >= SLOTS.ending[0] ? 1040 : CAP, zIndex: 45, textAlign: 'center'}}>
    <div style={{display: 'inline-block', background: '#161519eb', borderRadius: 16, padding: '0 26px', height: 84, lineHeight: '84px', fontFamily: disp, fontWeight: 700, fontSize: size, color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 10px 30px #0007', transform: `scale(${s})`}}>{text}</div>
  </div>;
};

export const Dossier: React.FC<DossierProps> = ({words, stars, avatar, avatarTop = -250}) => {
  const t = useT(), H0 = SLOTS.hook[1], E0 = SLOTS.ending[0];
  return <AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    {avatar ? <Scene s={0} e={H0} z={1}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden'}}><Glow tone="#5a1028" at="50% 50%" /><HookShot y={262} visH={300} /><BigHeart x={800} y={232} size={150} /><HookTitle top={628} k={0.56} /></div>
      <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1920 - SEAM, overflow: 'hidden'}}><Avatar src={avatar} phase="hook" top={avatarTop} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 3, height: 6, background: '#05070f'}} />
    </Scene> : <Scene s={0} e={H0} z={1}><HookFull /></Scene>}
    <Scene s={H0} e={4.47} z={2}><StuckScene /></Scene>
    <Scene s={4.47} e={7.25} z={3} dir="r"><BuiltScene /></Scene>
    <Scene s={7.25} e={9.1} z={4}><ResumeFan /></Scene>
    <Scene s={9.1} e={12.95} z={5} dir="u"><FreeScene /></Scene>
    <Scene s={12.95} e={14.9} z={6}><NameScene /></Scene>
    <Scene s={14.9} e={18.15} z={7}><PainScene /></Scene>
    <Scene s={18.15} e={20.45} z={8} dir="l"><Shot name="r06a_profile" url={SITE} tone="#2a1f5c" map={[[18.15, 1.0], [19.3, 1.95], [20.0, 3.1], [20.45, 3.6]]}><Chip at={19.74} y={1110}>ONCE</Chip></Shot></Scene>
    <Scene s={20.45} e={21.88} z={9}><Shot name="r06b_paste" url={SITE} tone="#123a4a" map={[[20.45, 1.3], [20.72, 1.8], [21.88, 3.0]]} /></Scene>
    <Scene s={21.88} e={24.5} z={10}><Shot name="r06c_findjobs" url={SITE} tone="#0f3a26" map={[[21.88, 2.3], [24.5, 4.0]]}><Chip at={23.3} y={1110} bg={GREEN} color="#06210f" size={33}>via JSearch, Adzuna or FreeHire</Chip></Shot></Scene>
    <Scene s={24.5} e={26.4} z={11} dir="r"><Shot name="r07a_reads" url={SITE} tone="#3a2a10" map={[[24.5, 1.2], [24.9, 1.7], [26.0, 3.05], [26.4, 3.4]]} /></Scene>
    <Scene s={26.4} e={28.62} z={12}><Shot name="r07b_tailored" url={SITE} tone="#4a1f2a" map={[[26.4, 1.2], [26.92, 1.7], [27.9, 3.05], [28.62, 4.6]]}><DocList /></Shot></Scene>
    <Scene s={28.62} e={29.62} z={13}><Shot name="r07c_email" url={SITE} tone="#123a4a" map={[[28.62, 2.0], [29.2, 2.62], [29.62, 3.0]]}><DocList /></Shot></Scene>
    <Scene s={29.62} e={32.4} z={14}><Shot name="r07d_themes_langs" url={SITE} tone="#2a1f5c" map={[[29.62, 2.3], [30.95, 3.3], [31.14, 3.65], [32.4, 5.0]]} /><NumberBadges /></Scene>
    <Scene s={32.4} e={34.1} z={15}><TitleCard s={32.4} tone="#4a2c00" accent={GOLD} l1={[[32.74, 'But'], [32.88, "here's"]]} l2={[[33.08, 'the'], [33.22, 'crazy'], [33.46, 'part:']]} /></Scene>
    <Scene s={34.1} e={37.05} z={16}><Shot name="r08a_never" url={SITE} tone="#4a2c00" map={[[34.1, 1.55], [34.6, 1.75], [36.6, 3.4], [37.05, 3.9]]}><Chip at={34.4} y={1110}>ON BY DEFAULT</Chip></Shot></Scene>
    <Scene s={37.05} e={41.4} z={17}><Shot name="r08b_gap" url={SITE} tone="#4a1018" map={[[37.05, 1.6], [37.6, 1.85], [37.95, 3.05], [38.9, 5.4], [41.4, 7.7]]}><Chip at={40.42} y={1110} bg={ROSE} color="#fff" size={44}>THE GAP</Chip></Shot></Scene>
    <Scene s={41.4} e={45.4} z={18} dir="u"><BoardScene /></Scene>
    <Scene s={45.4} e={49.5} z={19}><Shot name="r09b_local" url={SITE} tone="#0f3a26" map={[[45.4, 2.3], [46.0, 2.75], [47.85, 3.3], [47.92, 3.42], [49.5, 5.9]]}><Chip at={46.3} y={1110} bg={GREEN} color="#06210f">Ollama or LM Studio</Chip>
      <div style={{position: 'absolute', left: 760, top: 980, zIndex: 31, transform: `scale(${pop(t, 48.78, 0.32)})`}}><Laptop size={150} /></div></Shot></Scene>
    <Scene s={49.5} e={55.3} z={20} dir="l"><RepoScene stars={stars} /></Scene>
    <Scene s={55.3} e={56.95} z={21}><TitleCard s={55.3} tone="#5a1018" accent={ROSE} l1={[[55.62, 'Then'], [55.84, 'came']]} l2={[[56.1, 'the'], [56.28, 'twist.']]} /></Scene>
    <Scene s={56.95} e={61.85} z={22}><Shot name="r11_issue" url={ISSUE} tone="#3a1020" map={[[56.95, 0.9], [57.3, 1.2], [58.15, 1.6], [59.05, 3.0], [59.15, 3.6], [59.68, 5.0], [61.85, 7.5]]}><Chip at={57.2} y={1110} bg="#e6ecfb" color="#111a2e" size={32}>GitHub issue #13 · 26 Oct 2026</Chip></Shot></Scene>
    <Scene s={61.85} e={63.0} z={23}><Shot name="r11b_no" url={ISSUE} tone="#1d2f6b" map={[[61.85, 1.5], [62.42, 2.05], [63.0, 2.7]]}><Chip at={62.44} y={1100} bg={ROSE} color="#fff" size={60} rot={-5}>HE SAID NO</Chip></Shot></Scene>
    <Scene s={63.0} e={65.6} z={24}><Shot name="r11c_applies" url={ISSUE} tone="#1d2f6b" map={[[63.0, 1.4], [63.8, 2.0], [65.6, 4.5]]} /></Scene>
    <Scene s={65.6} e={68.4} z={25} dir="u"><ThreeSteps /></Scene>
    <Scene s={68.4} e={69.95} z={26}><TitleCard s={68.4} tone="#123a4a" accent="#7fdcff" l1={[[68.74, 'The']]} l2={[[68.86, 'honest'], [69.08, 'part:']]} /></Scene>
    <Scene s={69.95} e={71.35} z={27}><Shot name="r12a_install" url={SITE} tone="#3a2a10" map={[[69.95, 47.4], [70.3, 48.05], [71.35, 50.0]]}><Chip at={70.5} y={1110} size={30}>No Mac app yet: Mac runs it in Docker</Chip></Shot></Scene>
    <Scene s={71.35} e={E0} z={28}><Shot name="r12b_phones" url={SITE} tone="#4a1018" map={[[71.35, 1.6], [71.92, 2.3], [73.0, 3.7]]}>
      <div style={{position: 'absolute', left: 770, top: 560, zIndex: 31, transform: `scale(${pop(t, 72.28, 0.32)}) rotate(-6deg)`}}><PhoneX size={170} /></div></Shot></Scene>
    {avatar ? <Scene s={E0} e={99} z={29}><Avatar src={avatar} phase="ending" top={0} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, height: 1020, background: 'linear-gradient(transparent,#07090dd0 44%)'}} />
      {t >= 77.1 && (t < 79.3 ? <CommentBox x={70} y={1262} w={870} /> : <DmCard x={70} y={1254} w={870} />)}</Scene>
      : <><Scene s={E0} e={77.1} z={29} dir="u"><ShareScene /></Scene><Scene s={77.1} e={99} z={30}><CtaScene /></Scene></>}
    <LightLeak at={12.95} />
    <div style={{position: 'absolute', left: WX, top: 226, zIndex: 46, background: '#0a0f1ed0', color: '#e6ecfb', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <Captions words={words} avatar={!!avatar} />
  </AbsoluteFill>;
};
