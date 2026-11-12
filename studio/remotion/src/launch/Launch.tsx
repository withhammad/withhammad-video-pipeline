// LAUNCH reel (job e08dc5238b3e): twelve things Claude Fable 5.2 can do. Split screen (page recording on top, presenter
// below) for the hook and the ending; a full-screen "#NN TITLE" card before each item; item bodies are a real page
// recording in a floating card with the voice over it. Every time below is a spoken-word time from the recorded
// narration (voice/words.json), in seconds. Marker boxes come from OCR of the recorded frames (marks.json).
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import marks from './marks.json';

export type Word = {text: string; startMs: number; endMs: number};
export type LaunchProps = {words: Word[]};
type Box = number[];
const M = marks as unknown as Record<string, Record<string, Box[]>>;

const FPS = 30, SEAM = 840, OFF = 232;
const LIME = '#C6FF01', MARK = '#FFD60A', R = '#E5484D', G = '#3DDC84', B = '#4C8DFF', INK = '#0a0f1e', MUTED = '#93a0bf', CARD = '#111a2e', LINE = '#2a3657';
const sans = 'Inter', capf = 'Montserrat', serif = 'Newsreader';
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
type Dir = 'l' | 'r' | 'u' | 'd' | 'none';
const slide = (t: number, s: number, dir: Dir, w: number, h: number) => {
  const q = 1 - eo(pr(t, s, 0.3));
  return dir === 'none' ? undefined : `translate(${dir === 'l' ? -q * w : dir === 'r' ? q * w : 0}px,${dir === 'u' ? -q * h : dir === 'd' ? q * h : 0}px)`;
};

// ------------------------------------------------------------------ shared pieces
const PanelBg: React.FC<{tone?: string}> = ({tone = '#16224a'}) => <AbsoluteFill style={{background: `radial-gradient(120% 90% at 80% 10%,${tone},${INK} 62%)`}}>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)', backgroundSize: '60px 60px'}} />
</AbsoluteFill>;
const Top: React.FC<React.PropsWithChildren<{s: number; e: number; dir: Dir; z: number}>> = ({s, e, dir, z, children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden', zIndex: z, transform: slide(t, s, dir, 1080, SEAM)}}>{children}</div>;
};
const Full: React.FC<React.PropsWithChildren<{s: number; e: number; z: number}>> = ({s, e, z, children}) => {
  const t = useT(); if (t < s || t >= e) return null;
  return <AbsoluteFill style={{zIndex: z, overflow: 'hidden'}}>{children}</AbsoluteFill>;
};
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = LIME, color = '#111', size = 30, style}) =>
  <div style={{display: 'inline-block', background: bg, color, fontFamily: sans, fontWeight: 800, fontSize: size, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', boxShadow: '0 10px 26px #00000066', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string}> = ({size = 36, color = G}) => <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke="#06210f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Chrome: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: OFF, background: 'linear-gradient(#05070f,#0d1326)', borderBottom: `2px solid ${LINE}`}} />;
const Shot: React.FC<{name: string; vt: number; w?: number; h?: number; style?: React.CSSProperties}> = ({name, vt, w = 1080, h = 840, style}) =>
  <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, ...style}} /></Freeze>;
const Clip: React.FC<React.PropsWithChildren> = ({children}) => <div style={{position: 'absolute', left: 0, top: OFF, width: 1080, height: SEAM - OFF, overflow: 'hidden'}}>{children}</div>;
const Source: React.FC<{children: string; top?: number}> = ({children, top = 250}) => <div style={{position: 'absolute', right: 40, top, background: '#0a0f1ee6', color: '#dfe6f5', fontFamily: sans, fontWeight: 700, fontSize: 22, padding: '8px 16px', borderRadius: 10}}>{children}</div>;

// ------------------------------------------------------------------ presenter (hook 0-14.03 and ending 139.66-end of the narration)
// avatar.mp4 is 720x1280. Split scenes: scale 1.25 (900x1600) so the hair starts at y 930 and the chin stays above y 1500.
const avT = (t: number) => t < 100 ? Math.min(t, 14.0) : 14.03 + Math.max(0, t - 139.66);
const Presenter: React.FC = () => {
  const t = useT(), fade = 'linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)';
  if (t >= 14.4 && t < 139.6) return null;
  return <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1080, overflow: 'hidden', background: '#c9b08f'}}>
    <Freeze frame={Math.round(cl(avT(t), 0, 20.04) * FPS)}>
      <OffthreadVideo muted src={A('avatar.mp4')} style={{position: 'absolute', left: -135, top: -426, width: 1350, height: 2400, filter: 'blur(34px)'}} />
      <OffthreadVideo muted src={A('avatar.mp4')} style={{position: 'absolute', left: 90, top: -104, width: 900, height: 1600, maskImage: fade, WebkitMaskImage: fade}} />
    </Freeze>
  </div>;
};

// ------------------------------------------------------------------ hook: top panel scenes
const EssayScene: React.FC = () => {
  // recording: cursor to the date 0.5-1.0, yellow box on the headline 1.03-2.6, zoom 2.8-3.57 (stopped part way so the author's name stays in view)
  const t = useT(), vt = mapT(t, [[0, 0.45], [0.6, 1.05], [2.1, 2.55], [2.6, 2.8], [3.3, 3.08]]);
  return <><Clip><Shot name="h_essay" vt={vt} /></Clip><Chrome />
    <div style={{position: 'absolute', right: 40, top: 262, transform: `scale(${pop(t, 2.7)})`, transformOrigin: '100% 0'}}><Pill size={30}>HIS ESSAY · SEPT 2026</Pill></div>
  </>;
};
// The launch post's own preview loop (muted, plays in the page). In the recording the video sits at x 63-1016, y 47-583:
// scaled 1.133 it fills the panel. From 5.3 s: a hand sets down the puzzle cube, the arms reach in, then the bottle cap.
const RobotScene: React.FC = () => {
  const t = useT(), k = 1080 / 953;
  return <><Clip><Shot name="h_robot" vt={5.3 + (t - 4.3)} w={1080 * k} h={840 * k} style={{left: -63 * k, top: -47 * k}} /></Clip><Chrome />
    <Source>Video: Anthropic · launch post, 9 Nov 2026</Source>
  </>;
};
const HeroScene: React.FC = () => {
  const t = useT(), vt = mapT(t, [[8.6, 0.5], [10.4, 1.7]]);
  return <><Clip><Shot name="h_hero" vt={vt} /></Clip><Chrome /></>;
};
const NAMES = ['VISION', 'ROBOTS', 'SPEED', 'ADVISOR', 'ORCHESTRATOR', 'AGENT TEAMS', 'LONG RUNS', 'COMPUTER USE', 'FINANCE', 'SELF-CHECK', 'HONESTY', 'FEWER BLOCKS'];
const Grid: React.FC<{at: number; names?: boolean; hop?: number}> = ({at, names = false, hop = -1}) => {
  const t = useT();
  return <>{NAMES.map((name, i) => { const on = hop === i, s = pop(t, at + i * 0.065, 0.3);
    return <div key={i} style={{position: 'absolute', left: 70 + (i % 4) * 240, top: 330 + Math.floor(i / 4) * 150, width: 220, height: 130, borderRadius: 22, background: on ? LIME : CARD, border: `3px solid ${on ? LIME : LINE}`,
      transform: `scale(${s * (on ? 1.08 : 1)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px #00000055'}}>
      <div style={{fontFamily: capf, fontWeight: 900, fontSize: names ? 56 : 72, lineHeight: 1, letterSpacing: -2}}><span style={{color: on ? '#11111199' : '#ffffffb3'}}>#</span><span style={{color: on ? '#111' : LIME}}>{String(i + 1).padStart(2, '0')}</span></div>
      {names && <div style={{marginTop: 8, fontFamily: sans, fontWeight: 800, fontSize: 19, letterSpacing: 1, color: on ? '#111' : '#c9d3ee'}}>{name}</div>}
    </div>; })}</>;
};
const TwelveScene: React.FC = () => {
  const t = useT();
  return <><PanelBg tone="#1b2552" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 252, textAlign: 'center', fontFamily: sans, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: '#fff', opacity: pr(t, 11.0, 0.15)}}><span style={{color: LIME}}>12</span> WILD THINGS</div>
    <Grid at={11.5} />
  </>;
};
const QuestionScene: React.FC = () => {
  const t = useT(), order = [4, 9, 1, 6, 11, 2, 7, 0, 10, 5, 3, 8], hop = t < 139.95 ? -1 : order[Math.floor((t - 139.95) / 0.115) % 12];
  return <><PanelBg tone="#1b2552" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 252, textAlign: 'center', fontFamily: sans, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: '#fff'}}>WHICH <span style={{color: LIME}}>ONE</span>?</div>
    <Grid at={130} names hop={hop} />
  </>;
};
const Heart: React.FC<{x: number; delay: number; t: number; color: string}> = ({x, delay, t, color}) => { const p = pr(t, 143.0 + delay, 1.6); if (p <= 0 || p >= 1) return null;
  return <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: x + Math.sin(p * 7 + delay * 9) * 22, top: 760 - p * 430, opacity: Math.min(1, 4 * p) * (1 - p), transform: `scale(${0.7 + p * 0.6})`}}><path fill={color} d="M12 21s-7.5-4.6-9.6-9.3C.9 8.200 2.800 4.500 6.400 4.500c2 0 3.400 1 4.300 2.300l1.300 1.800 1.300-1.800c.9-1.300 2.300-2.300 4.300-2.300 3.600 0 5.500 3.700 4 7.200C19.500 16.400 12 21 12 21z" /></svg>; };
const CtaScene: React.FC = () => {
  const t = useT(), typed = 'LAUNCH'.slice(0, Math.floor(pr(t, 142.42, 0.45) * 6.99)), dm = eo(pr(t, 143.34, 0.35));
  return <><PanelBg tone="#2a2350" />
    <div style={{position: 'absolute', left: 50, top: 276, width: 980, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxShadow: '0 20px 50px #00000066'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 84, height: 84, borderRadius: 42, objectFit: 'cover'}} />
      <div style={{flex: 1, marginLeft: 22, fontFamily: sans, fontWeight: 800, fontSize: 50, color: typed ? '#111' : '#9aa3b5'}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: B, fontWeight: 500}}>|</span></div>
      <div style={{background: B, color: '#fff', fontFamily: sans, fontWeight: 800, fontSize: 34, padding: '16px 34px', borderRadius: 40, transform: `scale(${1 + 0.12 * (pop(t, 142.95) > 0 ? 1 - eo(pr(t, 142.95, 0.3)) : 0)})`}}>Post</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 424, textAlign: 'center', transform: `scale(${pop(t, 141.5)})`}}><Pill size={44}>FOLLOW + COMMENT LAUNCH</Pill></div>
    {[[170, 0, R], [420, 0.25, '#ff7ab2'], [640, 0.1, R], [860, 0.4, '#ff7ab2'], [300, 0.6, R], [760, 0.75, R]].map(([x, d, c], i) => <Heart key={i} x={x as number} delay={d as number} t={t} color={c as string} />)}
    <div style={{position: 'absolute', left: 60, top: 548 + (1 - dm) * 340, width: 960, height: 236, borderRadius: 30, background: CARD, border: `2px solid ${LINE}`, padding: '22px 28px', boxShadow: '0 20px 50px #00000080'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('avatar_thumb.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}} />
        <span style={{fontFamily: sans, fontWeight: 800, fontSize: 38, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: sans, fontWeight: 700, fontSize: 28, color: MUTED}}>· Direct message</span></div>
      <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 16, background: B, color: '#fff', fontFamily: sans, fontWeight: 700, fontSize: 44, padding: '22px 32px', borderRadius: '8px 30px 30px 30px'}}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.500 1.500" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.500-1.500" /></svg>Your guide: try all 12</div>
    </div>
  </>;
};

// ------------------------------------------------------------------ title cards (#NN + label over a dimmed still of the presenter)
type Item = {n: number; label: string; s: number; num: number; lab: number; e: number; still: string};
const ITEMS: Item[] = [
  {n: 1, label: 'BETTER VISION', s: 14.05, num: 14.3, lab: 15.0, e: 16.1, still: '1.0'},
  {n: 2, label: 'ROBOT CONTROL', s: 26.21, num: 26.46, lab: 27.4, e: 28.46, still: '12.0'},
  {n: 3, label: 'FASTER BY DEFAULT', s: 37.09, num: 37.34, lab: 38.16, e: 39.52, still: '16.0'},
  {n: 4, label: 'ADVISOR MODE', s: 45.67, num: 45.92, lab: 46.67, e: 47.68, still: '4.6'},
  {n: 5, label: 'ORCHESTRATOR MODE', s: 55.15, num: 55.4, lab: 56.2, e: 57.32, still: '9.6'},
  {n: 6, label: 'AGENT TEAMS', s: 65.63, num: 65.88, lab: 66.72, e: 67.7, still: '18.6'},
  {n: 7, label: 'LONG UNATTENDED WORK', s: 76.07, num: 76.32, lab: 77.26, e: 78.74, still: '1.0'},
  {n: 8, label: 'COMPUTER USE', s: 86.07, num: 86.32, lab: 86.94, e: 87.86, still: '12.0'},
  {n: 9, label: 'BUSINESS AND FINANCE WORK', s: 95.31, num: 95.6, lab: 96.6, e: 98.14, still: '16.0'},
  {n: 10, label: 'SELF-CORRECTION', s: 106.41, num: 106.66, lab: 107.34, e: 108.4, still: '4.6'},
  {n: 11, label: 'HONESTY', s: 116.55, num: 116.8, lab: 117.44, e: 118.28, still: '9.6'},
  {n: 12, label: 'FEWER WRONG REFUSALS', s: 125.49, num: 125.74, lab: 126.56, e: 128.04, still: '18.6'},
];
const TitleCard: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), push = 1.02 + 0.05 * pr(t, it.s, it.e - it.s), whip = eo(pr(t, it.lab - 0.02, 0.22)), num = pop(t, it.num - 0.03, 0.3);
  return <AbsoluteFill style={{background: '#000'}}>
    <Img src={A(`still_${it.still}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '50% 30%'}} />
    <AbsoluteFill style={{background: 'radial-gradient(90% 60% at 50% 42%,#05081080,#050810d9)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 925, textAlign: 'center', transform: `translateX(${-(1 - whip) * 700}px) skewX(${-(1 - whip) * 18}deg)`, opacity: whip > 0 ? 1 : 0, filter: `blur(${(1 - whip) * 10}px)`}}>
      <div style={{display: 'inline-block', background: '#fff', color: '#0b0b0b', fontFamily: sans, fontWeight: 800, fontSize: 46, letterSpacing: 0.5, padding: '8px 24px', borderRadius: 12, whiteSpace: 'nowrap', boxShadow: '0 10px 30px #00000080'}}>{it.label}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', fontFamily: capf, fontWeight: 900, fontSize: 250, lineHeight: 1, letterSpacing: -8, transform: `scale(${num})`, transformOrigin: '50% 50%', textShadow: '0 16px 50px #000000aa'}}>
      <span style={{color: '#ffffffb3'}}>#</span><span style={{color: LIME}}>{String(it.n).padStart(2, '0')}</span></div>
  </AbsoluteFill>;
};
// warm light leak that wipes over the cut into each title card
const LightLeak: React.FC = () => {
  const t = useT(), it = ITEMS.find(i => t >= i.s - 0.2 && t < i.s + 0.36); if (!it) return null;
  const p = pr(t, it.s - 0.2, 0.56), a = Math.sin(Math.PI * p);
  return <AbsoluteFill style={{zIndex: 70, mixBlendMode: 'screen', opacity: a, background: `linear-gradient(${100 + p * 40}deg,transparent ${p * 120 - 70}%,#ff5a1f ${p * 120 - 40}%,#ffd24a ${p * 120 - 10}%,#fff6d8 ${p * 120}%,#ffb347 ${p * 120 + 18}%,transparent ${p * 120 + 50}%)`}} />;
};

// ------------------------------------------------------------------ item bodies: a real page recording in a floating card
const CX = 100, CY = 270, CW = 880, CH = 1220;
const BodyBg: React.FC<{it: Item; tone?: string}> = ({it, tone}) => <><PanelBg tone={tone} />
  <div style={{position: 'absolute', left: 149, top: 1546, display: 'flex', gap: 10}}>{ITEMS.map(x => <div key={x.n} style={{width: 56, height: 10, borderRadius: 5, background: x.n === it.n ? LIME : x.n < it.n ? '#c6ff0166' : '#ffffff1f'}} />)}</div>
  <div style={{position: 'absolute', right: CX, top: 222, display: 'flex', alignItems: 'center', gap: 10, background: '#0a0f1ed0', padding: '5px 14px', borderRadius: 9, fontFamily: sans, fontWeight: 800, fontSize: 20, letterSpacing: 2, color: '#e6ecfb'}}>
    <span style={{color: LIME, fontFamily: capf, fontWeight: 900}}>#{String(it.n).padStart(2, '0')}</span>{it.label}</div>
</>;
// zoom + origin are in card pixels; children (markers) are placed in recording pixels and move with the page
const Page: React.FC<React.PropsWithChildren<{name: string; vt: number; zoom?: number; ox?: number; oy?: number; src: string; bg?: string}>> = ({name, vt, zoom = 1, ox = 440, oy = 500, src, bg = '#faf9f5', children}) =>
  <div style={{position: 'absolute', left: CX, top: CY, width: CW, height: CH, borderRadius: 30, overflow: 'hidden', background: bg, boxShadow: '0 30px 70px #00000080', border: `2px solid ${LINE}`}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 880, height: 1250, transform: `scale(${zoom})`, transformOrigin: `${ox}px ${oy}px`}}>
      <Shot name={name} vt={vt} w={880} h={1250} />{children}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, background: 'linear-gradient(transparent,#0a0f1ecc 62%,#0a0f1ef2)'}} />
    <div style={{position: 'absolute', left: 22, bottom: 20, background: '#0a0f1ee6', color: '#dfe6f5', fontFamily: sans, fontWeight: 700, fontSize: 22, padding: '7px 14px', borderRadius: 10}}>{src}</div>
  </div>;
// yellow marker that sweeps over the words, line by line, starting on the spoken word
const Mark: React.FC<{r?: Box[]; at: number; dur?: number; until?: number}> = ({r, at, dur = 0.5, until = 1e9}) => {
  const t = useT(); if (!r || t < at || t >= until) return null;
  const total = r.reduce((n, b) => n + b[2], 0); let done = 0;
  return <>{r.map((b, i) => { const s = at + dur * done / total, d = Math.max(0.05, dur * b[2] / total); done += b[2];
    return <div key={i} style={{position: 'absolute', left: b[0] - 6, top: b[1] + b[3] / 2 - 23, height: 46, width: (b[2] + 12) * eo(pr(t, s, d)), background: MARK, opacity: 0.5, borderRadius: 7, mixBlendMode: 'multiply'}} />; })}</>;
};
// ring around one table cell
const Ring: React.FC<{r?: Box[]; at: number; color?: string}> = ({r, at, color = R}) => {
  const t = useT(), s = pop(t, at, 0.3); if (!r || s <= 0) return null;
  const b = r[0];
  return <div style={{position: 'absolute', left: b[0] - 20, top: b[1] - 22, width: b[2] + 40, height: b[3] + 44, border: `6px solid ${color}`, borderRadius: 18, transform: `scale(${s})`, boxShadow: '0 0 0 3px #ffffffcc'}} />;
};
// stat tile over the lower part of the card
const Stat: React.FC<{at: number; big: string; label: string; sub?: string; subAt?: number; top?: number; size?: number; pre?: string}> = ({at, big, label, sub, subAt = 0, top = 1050, size = 150, pre}) => {
  const t = useT(), s = pop(t, at, 0.36); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: 140, top, width: 800, height: 220, borderRadius: 30, background: '#0c1222f5', border: `3px solid ${LIME}`, boxShadow: '0 24px 60px #000000a0', transform: `scale(${s})`, display: 'flex', alignItems: 'center', padding: '0 34px', gap: 28}}>
    <div>{pre && <div style={{fontFamily: sans, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: MUTED, marginBottom: 2}}>{pre}</div>}
      <div style={{fontFamily: capf, fontWeight: 900, fontSize: pre ? size * 0.86 : size, lineHeight: 1, color: LIME, letterSpacing: -5, whiteSpace: 'nowrap'}}>{big}</div></div>
    <div style={{fontFamily: sans, color: '#fff'}}>
      <div style={{fontWeight: 800, fontSize: 38, lineHeight: 1.15}}>{label}</div>
      {sub && <div style={{marginTop: 10, fontWeight: 700, fontSize: 34, color: MUTED, opacity: pr(t, subAt, 0.15), transform: `translateX(${(1 - eo(pr(t, subAt, 0.25))) * 30}px)`}}>{sub}</div>}
    </div>
  </div>;
};
const Chip: React.FC<React.PropsWithChildren<{at: number; x: number; y: number; bg?: string; color?: string; size?: number; until?: number}>> = ({at, x, y, bg, color, size = 32, until = 1e9, children}) => {
  const t = useT(), s = pop(t, at); if (s <= 0 || t >= until) return null;
  return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: '0 50%'}}><Pill bg={bg} color={color} size={size}>{children}</Pill></div>;
};

const SRC = 'Source: anthropic.com · launch post, 9 Nov 2026';
// key times inside each recording (30 fps copies in render-public/x), from the frame-difference scans in shots/scan/
const S = {
  chart: {b: 2.07, h0: 2.1, h1: 3.6}, unity: {b: 48.57}, robot: {p: 1.57, cube: 9.75}, faster: {b: 2.03}, advisor: {b: 2.0}, docs: {b: 2.07}, orch: {b: 1.97},
  agents: {p: 1.57, s0: 3.57, s1: 4.9}, uber: {b: 48.57}, cu: {a: 1.5, s0: 2.8, s1: 4.5}, osworld: {b: 2.07}, box: {h: 47.1, s0: 47.33, s1: 48.63}, hw: {p: 1.6, pcb: 10.05},
  three: {b: 2.03}, cognition: {b: 48.57}, blocks: {b: 2.07}, robust: {b: 2.03}, avail: {b: 2.03},
};
// the page arrives on the tail of its recorded scroll, then rests
// (b = the frame where the recorded scroll stops; the cursor then parks beside the text for 'after' seconds)
const arrive = (t: number, s: number, b: number, tail = 0.5, after = 0.9): number => mapT(t, [[s, b - tail], [s + tail + after, b + after]]);
const push = (t: number, s: number, e: number, k = 0.05) => 1 + k * pr(t, s, e - s);

const Body1: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), unity = t >= 22.5;
  return <><BodyBg it={it} />
    {!unity ? <Page name="b01_chart" vt={t < 19.5 ? arrive(t, 16.1, S.chart.b, 0.5, 0) : mapT(t, [[19.5, S.chart.h0], [21.3, S.chart.h1]])} src={SRC}>
        <Ring r={M.b01_chart?.a} at={18.62} /><Ring r={M.b01_chart?.b} at={21.5} color="#111" /></Page>
      : <Page name="b01_unity" vt={arrive(t, 22.5, S.unity.b)} zoom={push(t, 22.5, 26.2)} oy={400} src={SRC}>
        <Mark r={M.b01_unity?.co} at={22.62} dur={0.25} /><Mark r={M.b01_unity?.a} at={23.66} dur={2.0} /></Page>}
    {!unity && <Stat at={18.62} big="73%" label="on Anthropic's chart test" sub="up from 45%" subAt={21.3} />}
  </>;
};
const Body2: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), vid = t >= 30.35 && t < 33.2;
  // the in-page preview loop: a hand sets down the puzzle cube (9.9 s), the gripper is on the bottle cap from 11.5 s
  const vt = t < 30.35 ? arrive(t, 28.46, S.robot.p) : vid ? S.robot.cube + (t - 30.35) : S.robot.p + 0.9;
  return <><BodyBg it={it} tone="#17304a" />
    <Page name="b02_robot" vt={vt} zoom={t >= 33.2 ? push(t, 33.2, 37.1) : 1} oy={360} src={vid ? 'Video: Anthropic · launch post, 9 Nov 2026' : SRC}>
      {!vid && <Mark r={M.b02_robot?.a} at={29.22} dur={0.7} until={30.35} />}
      {!vid && <Mark r={M.b02_robot?.b} at={34.14} dur={2.3} />}
    </Page>
    {vid && <Chip at={30.92} x={150} y={1110} size={38}>PUZZLE CUBE</Chip>}
    {vid && <Chip at={32.46} x={510} y={1110} size={38} bg="#fff">BOTTLE CAP</Chip>}
  </>;
};
const Body3: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), price = t >= 43.3, s = pop(t, 43.3, 0.36);
  return <><BodyBg it={it} tone="#2a2350" />
    <Page name="b03_faster" vt={arrive(t, 39.52, S.faster.b)} src={SRC}>
      <Mark r={M.b03_faster?.a} at={40.3} dur={1.3} /><Mark r={M.b03_faster?.b} at={43.4} dur={1.0} /></Page>
    {!price && <Stat at={40.66} pre="UP TO" big="30%" label="faster output" sub="than Fable 5.1" subAt={41.8} />}
    {price && <div style={{position: 'absolute', left: 140, top: 1050, width: 800, height: 220, borderRadius: 30, background: '#0c1222f5', border: `3px solid ${LIME}`, boxShadow: '0 24px 60px #000000a0', transform: `scale(${s})`}}>
      <div style={{position: 'absolute', left: 36, top: 24, fontFamily: sans, fontWeight: 800, fontSize: 24, letterSpacing: 3, color: MUTED}}>API PRICE · PER MILLION TOKENS</div>
      <div style={{position: 'absolute', left: 36, top: 70, display: 'flex', gap: 64}}>{[['Input', '$10', '$8'], ['Output', '$50', '$40']].map(([k, was, now]) => <div key={k}>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 30, color: '#dfe6f5'}}>{k}</div>
        <div style={{fontFamily: capf, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap'}}><span style={{fontSize: 46, color: MUTED, textDecoration: 'line-through'}}>{was}</span> <span style={{fontSize: 84, color: LIME, letterSpacing: -3}}>{now}</span></div></div>)}</div>
      <div style={{position: 'absolute', right: 16, top: -46, transform: `scale(${pop(t, 44.4)}) rotate(-6deg)`}}><div style={{background: LIME, color: '#111', fontFamily: capf, fontWeight: 900, fontSize: 72, lineHeight: 1, padding: '10px 24px', borderRadius: 22, boxShadow: '0 14px 30px #00000080'}}>-20%</div></div>
    </div>}
  </>;
};
const AdvisorDiagram: React.FC = () => {
  const t = useT(), up = eo(pr(t, 50.5, 0.4)), down = eo(pr(t, 52.0, 0.4)), work = Math.floor(cl((t - 50.35) / 0.28, 0, 8));
  return <div style={{position: 'absolute', left: CX, top: CY, width: CW, height: CH, borderRadius: 30, overflow: 'hidden', background: '#0c1222', border: `2px solid ${LINE}`, boxShadow: '0 30px 70px #00000080'}}>
    <div style={{position: 'absolute', left: 180, top: 110, width: 520, height: 210, borderRadius: 34, background: '#141c33', border: `4px solid ${LIME}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${1 + 0.06 * (up >= 1 ? 1 - eo(pr(t, 50.9, 0.4)) : 0)})`, boxShadow: up >= 1 ? `0 0 60px ${LIME}55` : undefined}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: capf, fontWeight: 900, fontSize: 70, color: '#fff', letterSpacing: -2}}><Img src={A('claude-mark.svg')} style={{width: 58, height: 58}} />Fable 5.2</div>
      <div style={{fontFamily: sans, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: LIME, marginTop: 6}}>THE ADVISOR</div>
    </div>
    <svg width={880} height={1220} style={{position: 'absolute', inset: 0}}>
      <path d="M340 690V340" stroke={LIME} strokeWidth={8} strokeLinecap="round" strokeDasharray={350} strokeDashoffset={350 * (1 - up)} fill="none" />
      {up >= 1 && <path d="M318 368L340 336L362 368" stroke={LIME} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      <path d="M540 340V690" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeDasharray="350" strokeDashoffset={350 * (1 - down)} fill="none" />
      {down >= 1 && <path d="M518 662L540 694L562 662" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
    <div style={{position: 'absolute', left: 66, top: 478, transform: `scale(${pop(t, 50.72)})`, transformOrigin: '100% 50%'}}><Pill size={30}>CALLS FABLE</Pill></div>
    <div style={{position: 'absolute', left: 572, top: 478, transform: `scale(${pop(t, 51.78)})`, transformOrigin: '0 50%'}}><Pill size={28} bg="#fff">HARD DECISIONS</Pill></div>
    <div style={{position: 'absolute', left: 60, top: 700, width: 760, height: 250, borderRadius: 34, background: '#141c33', border: `3px solid ${LINE}`, padding: '26px 34px'}}>
      <div style={{fontFamily: sans, fontWeight: 900, fontSize: 46, color: '#fff'}}>Cheaper Claude model</div>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 30, color: MUTED, marginTop: 4}}>Haiku · Sonnet · Opus <span style={{color: '#dfe6f5'}}>does the everyday work</span></div>
      <div style={{display: 'flex', gap: 14, marginTop: 26}}>{Array.from({length: 8}, (_, i) => <div key={i} style={{width: 72, height: 44, borderRadius: 12, background: i < work ? G : '#1c2742', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {i < work && <svg width={26} height={26} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#06210f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}</div>)}</div>
    </div>
  </div>;
};
const Body4: React.FC<{it: Item}> = ({it}) => {
  const t = useT();
  return <><BodyBg it={it} tone="#1b2552" />
    {t < 50.35 ? <Page name="b04_advisor" vt={arrive(t, 47.68, S.advisor.b)} src={SRC}><Mark r={M.b04_advisor?.a} at={48.0} dur={2.0} /></Page>
      : t < 52.7 ? <AdvisorDiagram />
      : <Page name="b04_docs" vt={mapT(t, [[52.7, S.docs.b], [53.0, S.docs.b + 0.4], [55.15, S.docs.b + 1.5]])} src="Source: code.claude.com/docs · advisor"><Mark r={M.b04_docs?.a} at={53.1} dur={1.6} /></Page>}
  </>;
};
const Body5: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), lanes: [string, number][] = [['Research', 62.52], ['Writing', 63.28], ['Data', 63.82]], s = pop(t, 62.34, 0.36);
  return <><BodyBg it={it} tone="#10304a" />
    <Page name="b05_orch" vt={arrive(t, 57.32, S.orch.b)} zoom={push(t, 57.32, 65.6, 0.06)} oy={520} src={SRC}><Mark r={M.b05_orch?.a} at={60.06} dur={1.9} /></Page>
    <Chip at={59.44} x={150} y={1120} size={38} until={62.34}>FABLE = THE MANAGER</Chip>
    {s > 0 && <div style={{position: 'absolute', left: 140, top: 1020, width: 800, height: 262, borderRadius: 30, background: '#0c1222f5', border: `3px solid ${LIME}`, boxShadow: '0 24px 60px #000000a0', transform: `scale(${s})`, padding: '20px 30px'}}>
      {lanes.map(([name, at], i) => { const p = cl(mapT(t, [[at, 0], [65.2 + i * 0.08, 1]])), done = p >= 1;
        return <div key={name} style={{display: 'flex', alignItems: 'center', gap: 20, height: 74, opacity: 0.35 + 0.65 * pr(t, at - 0.05, 0.12)}}>
          <div style={{width: 200, fontFamily: sans, fontWeight: 800, fontSize: 40, color: '#fff'}}>{name}</div>
          <div style={{flex: 1, height: 22, borderRadius: 11, background: '#1c2742', overflow: 'hidden'}}><div style={{width: `${100 * p}%`, height: '100%', borderRadius: 11, background: done ? G : LIME}} /></div>
          <div style={{width: 44, transform: `scale(${done ? pop(t, 65.2 + i * 0.08, 0.25) : 0})`}}><Tick size={44} /></div>
        </div>; })}
    </div>}
  </>;
};
const Body6: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), dots = t >= 68.3 && t < 71.86, ds = pop(t, 68.3, 0.36);
  const vt = t < 73.2 ? arrive(t, 67.7, S.agents.p) : mapT(t, [[73.2, S.agents.s0], [74.0, S.agents.s1], [76.1, S.agents.s1 + 2.1]]);
  return <><BodyBg it={it} tone="#2a2350" />
    <Page name="b06_agents" vt={vt} src={t >= 74 ? 'Video: Anthropic · launch post, 9 Nov 2026' : SRC}>{t < 73.2 && <Mark r={M.b06_agents?.a} at={71.86} dur={0.8} />}</Page>
    {dots && <div style={{position: 'absolute', left: 140, top: 1050, width: 800, height: 220, borderRadius: 30, background: '#0c1222f5', border: `3px solid ${LIME}`, boxShadow: '0 24px 60px #000000a0', transform: `scale(${ds})`, display: 'flex', alignItems: 'center', padding: '0 30px', gap: 26}}>
      <div style={{width: 120, height: 120, borderRadius: 60, background: LIME, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Img src={A('claude-mark.svg')} style={{width: 70, height: 70, filter: 'brightness(0)'}} /></div>
      <div><div style={{display: 'grid', gridTemplateColumns: 'repeat(14,28px)', gap: 10}}>{Array.from({length: 42}, (_, i) => <div key={i} style={{width: 28, height: 28, borderRadius: 14, background: t >= 68.44 + ((i * 7) % 42) * 0.03 ? G : '#1c2742'}} />)}</div>
        <div style={{marginTop: 14, fontFamily: sans, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: '#fff', opacity: pr(t, 69.2, 0.15)}}>SUB-AGENTS IN PARALLEL</div></div>
    </div>}
    <Stat at={72.4} big="1,000+" size={124} label="sub-agents" sub="in 8 days" subAt={75.12} />
  </>;
};
const Body7: React.FC<{it: Item}> = ({it}) => {
  const t = useT();
  return <><BodyBg it={it} tone="#17304a" />
    <Page name="b07_uber" vt={arrive(t, 78.74, S.uber.b)} zoom={push(t, 78.74, 86.1)} oy={420} src={SRC}>
      <Mark r={M.b07_uber?.works} at={79.02} dur={1.9} until={82.4} /><Mark r={M.b07_uber?.co} at={81.52} dur={0.25} /><Mark r={M.b07_uber?.role} at={81.76} dur={0.4} />
      <Mark r={M.b07_uber?.audit} at={82.66} dur={1.2} /><Mark r={M.b07_uber?.fix} at={85.0} dur={0.6} /></Page>
    <Chip at={79.78} x={150} y={1130} size={38} until={81.4}>HOURS, UNATTENDED</Chip>
  </>;
};
const Body8: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), os = t >= 91.8;
  return <><BodyBg it={it} tone="#1b2552" />
    {!os ? <Page name="b08_cu" vt={mapT(t, [[87.86, S.cu.a], [90.5, S.cu.a], [90.5, S.cu.s0], [91.2, S.cu.s1]])} src="Source: support.claude.com · computer use" bg="#fff">
        {t < 90.5 && <Mark r={M.b08_cu?.a} at={88.18} dur={2.0} />}{t >= 91.2 && <Mark r={M.b08_cu?.beta} at={91.25} dur={0.4} />}</Page>
      : <Page name="b08_osworld" vt={t < 92.6 ? arrive(t, 91.8, S.osworld.b, 0.5, 0) : mapT(t, [[92.6, S.osworld.b + 0.03], [95.3, S.osworld.b + 1.6]])} src={SRC}><Ring r={M.b08_osworld?.a} at={94.2} /></Page>}
    {!os && ([['CLICKS', 88.18, 150], ['TYPES', 88.84, 400], ['SCROLLS', 89.4, 630]] as [string, number, number][]).map(([x, at, left], i) => <Chip key={x} at={at} x={left} y={1130} size={38} bg={i === 1 ? '#fff' : LIME} until={90.6}>{x}</Chip>)}
    {os && <Stat at={94.2} big="89%" label="OSWorld 2.1" sub="computer-use benchmark" subAt={94.2} />}
  </>;
};
const Body9: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), vt = mapT(t, [[98.14, S.box.h], [99.2, S.box.h], [99.2, S.box.s0], [100.3, S.box.s1]]);
  return <><BodyBg it={it} tone="#10304a" />
    <Page name="b09_box" vt={vt} zoom={push(t, 100.3, 106.4)} oy={520} src={SRC}>
      {t >= 100.3 && <><Mark r={M.b09_box?.a} at={100.4} dur={0.7} /><Mark r={M.b09_box?.loan} at={102.2} dur={0.8} /><Mark r={M.b09_box?.b} at={103.4} dur={2.6} /><Mark r={M.b09_box?.co} at={102.06} dur={0.2} /></>}
    </Page>
  </>;
};
const Body10: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), vid = t >= 112.7 && t < 114.05;
  return <><BodyBg it={it} tone="#2a2350" />
    {t < 110.5 ? <Page name="b07_uber" vt={S.uber.b + 0.9} zoom={push(t, 108.4, 110.5, 0.07)} oy={560} src={SRC}><Mark r={M.b07_uber?.self} at={108.64} dur={1.3} /></Page>
      : t < 114.05 ? <Page name="b10_hw" vt={vid ? S.hw.pcb + (t - 112.7) : arrive(t, 110.5, S.hw.p)} src={vid ? 'Video: Anthropic · launch post, 9 Nov 2026' : SRC}>
        {!vid && <Mark r={M.b10_hw?.a} at={111.0} dur={1.5} />}</Page>
      : <Page name="b10_three" vt={arrive(t, 114.05, S.three.b, 0.3)} src={SRC}><Mark r={M.b10_three?.a} at={114.2} dur={1.8} /></Page>}
    {t >= 114.05 && <Chip at={114.3} x={150} y={1130} size={40}>ALL 3 WORKED</Chip>}
  </>;
};
const Body11: React.FC<{it: Item}> = ({it}) => {
  const t = useT();
  return <><BodyBg it={it} tone="#17304a" />
    <Page name="b11_cognition" vt={arrive(t, 118.28, S.cognition.b)} zoom={push(t, 118.28, 125.5, 0.06)} oy={400} src={SRC}>
      <Mark r={M.b11_cognition?.a} at={119.2} dur={2.4} /><Mark r={M.b11_cognition?.co} at={122.52} dur={0.3} /><Mark r={M.b11_cognition?.b} at={123.46} dur={1.6} /></Page>
  </>;
};
const Body12: React.FC<{it: Item}> = ({it}) => {
  const t = useT(), robust = t >= 131.72;
  return <><BodyBg it={it} tone="#1b2552" />
    {!robust ? <Page name="b12_blocks" vt={arrive(t, 128.04, S.blocks.b)} src={SRC}><Mark r={M.b12_blocks?.a} at={128.58} dur={2.4} /></Page>
      : <Page name="b12_robust" vt={arrive(t, 131.72, S.robust.b, 0.35)} zoom={push(t, 131.72, 134.8)} oy={440} src={SRC}><Mark r={M.b12_robust?.a} at={132.04} dur={2.3} /></Page>}
    {!robust && <Stat at={128.88} pre="ABOUT" big="55%" label="fewer blocks" sub="than Fable 5.1" subAt={130.72} />}
  </>;
};
const Payoff: React.FC = () => {
  const t = useT(), box: React.CSSProperties = {width: 56, height: 56, borderRadius: 14, background: '#1c2742', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0};
  const tiles: [string, number, React.ReactNode][] = [
    ['Claude apps', 136.88, <Img key="a" src={A('claude-app-icon.png')} style={{width: 56, height: 56, borderRadius: 14}} />],
    ['Claude Code', 137.62, <div key="b" style={{...box, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 28, color: LIME}}>{'>_'}</div>],
    ['AWS · Google Cloud · Azure', 138.82, <div key="c" style={box}><svg width={40} height={40} viewBox="0 0 24 24"><path d="M7 17.500h10a3.500 3.500 0 0 0 .5-6.960 5 5 0 0 0-9.700-1.200A4.100 4.100 0 0 0 7 17.500z" fill="#fff" /></svg></div>],
  ];
  return <><PanelBg tone="#17304a" />
    <div style={{position: 'absolute', right: CX, top: 222, background: '#0a0f1ed0', padding: '5px 14px', borderRadius: 9, fontFamily: sans, fontWeight: 800, fontSize: 20, letterSpacing: 2, color: LIME}}>LIVE NOW</div>
    <Page name="b13_avail" vt={arrive(t, 134.8, S.avail.b)} src={SRC}><Mark r={M.b13_avail?.a} at={138.6} dur={0.9} /></Page>
    <Chip at={135.92} x={150} y={946} size={42}>PAID PLANS</Chip>
    {tiles.map(([name, at, icon], i) => <div key={name} style={{position: 'absolute', left: 140, top: 1034 + i * 88, width: 800, height: 80, borderRadius: 22, background: '#0c1222f5', border: `3px solid ${LIME}`, transform: `scale(${pop(t, at)})`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px 0 14px', boxShadow: '0 16px 40px #000000a0'}}>
      {icon}<div style={{fontFamily: sans, fontWeight: 900, fontSize: 40, color: '#fff', whiteSpace: 'nowrap'}}>{name}</div>
      <div style={{marginLeft: 'auto', display: 'flex'}}><Tick size={42} /></div>
    </div>)}
  </>;
};
const BODIES: React.FC<{it: Item}>[] = [Body1, Body2, Body3, Body4, Body5, Body6, Body7, Body8, Body9, Body10, Body11, Body12];

// ------------------------------------------------------------------ captions
// hook: big serif italic line + a small sans line that joins on its word, on a soft black band across the seam
const HOOKS: [number, number, string, string, number][] = [
  [0, 1.36, "Anthropic's CEO", '', 0], [1.36, 4.3, 'told the world', 'to slow down AI', 2.6],
  [4.3, 6.5, 'Two months later', 'his company launched', 5.5], [6.5, 8.6, 'Most capable', 'models yet', 7.42],
];
const HookText: React.FC = () => {
  const t = useT(); if (t >= 8.6) return null;
  const h = HOOKS.find(([s, e]) => t >= s && t < e); if (!h) return null;
  const [s, , big, small, at] = h, a = t < 0.1 ? 1 : pr(t, s, 0.08);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 640, height: 360, zIndex: 44, background: 'linear-gradient(transparent,#000000d0 34%,#000000d0 70%,transparent)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 92, textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontWeight: 500, fontSize: 112, lineHeight: 1.1, letterSpacing: -2, color: '#fff', opacity: a, whiteSpace: 'nowrap'}}>{big}</div>
    {small && <div style={{position: 'absolute', left: 0, right: 0, top: 222, textAlign: 'center', fontFamily: sans, fontWeight: 600, fontSize: 42, color: '#fff', opacity: pr(t, at, 0.08)}}>{small}</div>}
  </div>;
};
// body: [first word, last word, text]. One boxed line, phrase-synced, sentence case. On the seam in split scenes, y 70% on full-frame scenes.
const CHUNKS: [number, number, string][] = [
  [20, 24, 'Fable and Mythos 5.2!'], [25, 27, 'Here are 12'], [28, 29, 'wild things'], [30, 32, 'Fable can do!'],
  [36, 38, 'It reads charts'], [39, 41, 'far more accurately:'], [42, 43, '73%'], [44, 45, "on Anthropic's"], [46, 47, 'chart test,'], [48, 50, 'up from 45.'],
  [51, 52, 'Unity says'], [53, 55, 'it can rebuild'], [56, 57, 'an experience'], [58, 61, 'from a visual reference.'],
  [65, 67, 'It can guide'], [68, 70, 'real robot arms'], [71, 75, 'to solve a puzzle cube'], [76, 80, 'or unscrew a bottle cap.'],
  [81, 83, 'And it handles'], [84, 85, 'robot tasks'], [86, 88, 'it was never'], [89, 91, 'explicitly trained on.'],
  [96, 97, 'Answers arrive'], [98, 102, 'up to 30% faster'], [103, 106, 'than the last Fable.'], [107, 110, 'And the API price'], [111, 114, 'dropped 20%, too.'],
  [118, 121, 'A cheaper Claude model'], [122, 125, 'does the everyday work'], [126, 128, 'and calls Fable'], [129, 130, 'only for the'], [131, 132, 'hard decisions,'],
  [133, 135, 'so the expert'], [136, 137, 'steps in'], [138, 140, 'only when needed.'],
  [144, 146, 'Now flip it:'], [147, 150, 'Fable becomes the manager'], [151, 154, 'and hands simpler tasks'], [155, 157, 'to smaller models,'],
  [158, 159, 'so research,'], [160, 163, 'writing and data work'], [164, 167, 'run side by side.'],
  [171, 173, 'It can run'], [174, 176, 'a whole team'], [177, 179, 'of sub-agents'], [180, 181, 'in parallel.'],
  [182, 184, 'In one experiment,'], [185, 187, 'over a thousand'], [188, 190, 'built a working'], [191, 191, 'prototype'], [192, 193, 'operating system'], [194, 196, 'in eight days.'],
  [201, 203, 'It keeps working'], [204, 205, 'for hours'], [206, 208, 'after you leave.'], [209, 211, 'An Uber engineer'], [212, 215, 'ran a ten-hour'], [216, 217, 'security audit,'],
  [218, 221, 'and it came back'], [222, 225, 'with the fixes ready.'],
  [229, 230, 'It clicks,'], [231, 231, 'types'], [232, 233, 'and scrolls'], [234, 236, 'like a person.'], [237, 240, "It's still a beta,"], [241, 244, 'but on a tough'],
  [245, 247, 'computer-use benchmark'], [248, 249, 'it scored'], [250, 250, '89%.'],
  [256, 258, 'It reads reports'], [259, 260, 'and spreadsheets'], [261, 263, 'and catches numbers'], [264, 267, "that don't add up."],
  [268, 271, 'On one loan file,'], [272, 273, 'it flagged'], [274, 275, 'salary deposits'], [276, 278, "that didn't match"], [279, 281, 'the bank balance.'],
  [285, 286, 'It catches'], [287, 291, 'more of its own mistakes.'], [292, 294, 'Asked to design'], [295, 297, 'three electronic gadgets,'],
  [298, 300, 'it delivered boards'], [301, 303, 'that all worked'], [304, 306, 'without a single'], [307, 308, 'electrical fix.'],
  [311, 314, 'Testers say it admits'], [315, 317, '"I don\'t know"'], [318, 319, 'instead of'], [320, 322, 'making things up.'],
  [323, 325, 'One at Cognition'], [326, 328, 'said it admitted'], [329, 331, 'its own estimate'], [332, 333, 'was wrong.'],
  [338, 340, 'It blocks about'], [341, 343, '55% fewer'], [344, 344, 'requests'], [345, 348, 'than the last Fable,'], [349, 350, 'with safeguards'], [351, 352, 'Anthropic says'], [353, 356, 'are just as robust.'],
  [357, 359, "And it's live"], [360, 362, 'on paid plans'], [363, 366, 'in the Claude apps,'], [367, 368, 'Claude Code'], [369, 372, 'and the major clouds.'],
  [373, 377, 'Which one blew your mind?'], [378, 379, 'Follow me'], [380, 382, 'and comment LAUNCH,'], [383, 386, "and I'll send you"], [387, 388, 'my guide'], [389, 392, 'to try all twelve!'],
];
const FIX: Record<number, number> = {285: 108.5, 357: 134.98};   // two words the transcript starts too early (checked against the audio)
const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const t = useT();
  const cut = (s: number, e: number) => Math.min(e, ...[14.05, 139.66].filter(x => x > s));   // a caption never crosses into the next layout
  const times = CHUNKS.map(([a, b]) => { const s = (FIX[a] ?? words[a].startMs / 1000) - 0.04; return [s, cut(s, words[b].endMs / 1000 + 0.3)]; });
  const i = times.findIndex(([s, e], k) => t >= s && t < Math.min(e, k + 1 < times.length ? times[k + 1][0] : 1e9));
  if (i < 0) return null;
  const split = t < 14.05 || t >= 139.66;
  return <div style={{position: 'absolute', left: 0, right: 0, top: (split ? SEAM : 1344) - 36, zIndex: 45, textAlign: 'center'}}>
    <div style={{display: 'inline-block', background: '#000000a3', borderRadius: 13, padding: '0 24px', height: 72, lineHeight: '72px', fontFamily: capf, fontWeight: 600, fontSize: 46, color: '#fff', whiteSpace: 'nowrap'}}>{CHUNKS[i][2]}</div>
  </div>;
};

export const Launch: React.FC<LaunchProps> = ({words}) => {
  const body = (n: number): [number, number] => [ITEMS[n - 1].e, n < 12 ? ITEMS[n].s : 134.8];
  return <AbsoluteFill style={{background: INK, fontFamily: sans, overflow: 'hidden'}}>
    <Top s={0} e={4.3} dir="none" z={1}><EssayScene /></Top>
    <Top s={4.3} e={8.6} dir="r" z={2}><RobotScene /></Top>
    <Top s={8.6} e={10.95} dir="u" z={3}><HeroScene /></Top>
    <Top s={10.95} e={14.05} dir="l" z={4}><TwelveScene /></Top>
    <Top s={139.66} e={141.35} dir="none" z={5}><QuestionScene /></Top>
    <Top s={141.35} e={999} dir="l" z={6}><CtaScene /></Top>
    <Presenter />
    <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 3, height: 6, background: '#05070f', zIndex: 8}} />

    {BODIES.map((Body, i) => <Full key={i} s={body(i + 1)[0]} e={body(i + 1)[1]} z={20}><Body it={ITEMS[i]} /></Full>)}
    <Full s={134.8} e={139.66} z={20}><Payoff /></Full>

    {ITEMS.map(it => <Full key={it.n} s={it.s} e={it.e} z={60}><TitleCard it={it} /></Full>)}
    <LightLeak />
    <div style={{position: 'absolute', left: 60, top: 222, zIndex: 80, background: '#0a0f1ed0', color: '#e6ecfb', fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '6px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <HookText />
    <Captions words={words} />
  </AbsoluteFill>;
};
