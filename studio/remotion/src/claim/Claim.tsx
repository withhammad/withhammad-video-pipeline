// CLAIM reel (job 2a1cb8d3ad49, comment keyword CLAIM): Businesses in ChatGPT (OpenAI, beta, 10 Nov 2026). Voice-over
// edit after the replication spec (analysis/spec.md): real recordings of OpenAI's public announcement, landing and help
// pages and Google's Business Profile page, plus motion graphics. The claim flow itself (chatgpt.com/business-hub) needs
// the owner's ChatGPT login, so it is shown as clearly tagged illustrations of the steps the public help page lists.
// Every time below is a spoken-word time of the TIGHT narration (voice/narration_tight.wav, voice/words_tight.json), in s.
// Facts on screen were re-read on 14 Nov 2026: openai.com announcement (1.2 billion weekly users; Business Agents for
// eligible ecommerce and online service businesses in the US), the help article (claim reviewed by email, then Persona ID
// check), Digiday 10 Nov 2026 (Business Hub and agents free for now).
// Presenter: optional. With `avatar` (a video under the public dir whose time 0 = tight-narration 0, playing SLOTS.hook and
// then continuing straight into SLOTS.ending) beats 1-4 become split screens with the "in Dubai?" gag on the face, and
// beats 13-14 a full-frame presenter; without it every slot uses a full-frame motion-graphic variant.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type ClaimProps = {words: Word[]; avatar?: string; avatarTop?: number};
// Presenter windows in tight-narration seconds, cut in the pauses on sentence boundaries: A = beats 1-4 (to "in Dubai?"),
// B = beats 13-14 ("Only claim a business you own..." to "All set!").
export const SLOTS: {hook: [number, number]; ending: [number, number]} = {hook: [0, 13.9], ending: [42.77, 48.95]};

const FPS = 30, ACC = '#3D8BFF', GREEN = '#2ED47A', RED = '#FF4B4B', YEL = '#FFD60A', PURP = '#9B7BFF', INK = '#0B0D12', GREY = '#8D929B';
const ui = 'Inter', mono = 'JetBrains Mono';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.3) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.0; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
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

// Cut points (hard cuts in the pauses, just before the first word of a clause).
const C = {s2: 3.27, s3: 7.0, s4: 10.17, gag: 13.3, s5: SLOTS.hook[1], s6: 16.9, s6b: 20.1, s7: 22.1, s8: 24.0, s9: 26.37, s10: 31.73, s11: 35.87, s11b: 37.43,
  s12: 39.43, s13: SLOTS.ending[0], s13b: 44.42, s14: 48.17};

// ------------------------------------------------------------------ shared pieces
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; dir?: 'l' | 'r' | 'u' | 'none'}>> = ({s, e, z, dir = 'none', children}) => {
  const t = useT(); if (t < s || t >= e + 0.3) return null;
  const q = 1 - eo(pr(t, s, 0.26)), k = s > 0 && dir === 'none' ? 1 + 0.025 * (1 - eo(pr(t, s, 0.22))) : 1;
  const tr = dir === 'none' ? `scale(${k})` : `translate(${dir === 'l' ? -q * 1080 : dir === 'r' ? q * 1080 : 0}px,${dir === 'u' ? q * 500 : 0}px)`;
  return <AbsoluteFill style={{zIndex: z, overflow: 'hidden', transform: tr, opacity: dir === 'u' ? 1 - q : 1}}>{children}</AbsoluteFill>;
};
const Grain: React.FC<{id: string}> = ({id}) => <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: 0.07, mixBlendMode: 'screen'}}>
  <filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
  <rect width="100%" height="100%" filter={`url(#${id})`} /></svg>;
const Bg: React.FC<{id: string; tone?: string; at?: string}> = ({id, tone = '#16224a', at = '50% 30%'}) => <AbsoluteFill style={{background: `radial-gradient(95% 60% at ${at},${tone},${INK} 72%)`}}>
  <AbsoluteFill style={{backgroundImage: 'radial-gradient(#ffffff14 1.5px,transparent 1.7px)', backgroundSize: '40px 40px'}} /><Grain id={id} /></AbsoluteFill>;
const Tick: React.FC<{size: number; color?: string; ink?: string}> = ({size, color = GREEN, ink = '#06210f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
  <circle cx="12" cy="12" r="11" fill={color} /><path d="M6.6 12.4l3.6 3.6 7.2-7.6" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Check: React.FC<{size: number; color?: string}> = ({size, color = '#06101f'}) => <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = YEL, color = '#111', size = 32, style}) =>
  <div style={{display: 'inline-block', background: bg, color, fontFamily: ui, fontWeight: 900, fontSize: size, lineHeight: `${size * 1.15}px`, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tag: React.FC<{children: string; style?: React.CSSProperties}> = ({children, style}) => <div style={{position: 'absolute', background: '#ffffff1f', border: '2px solid #ffffff40', color: '#e9edf5', fontFamily: ui, fontWeight: 800,
  fontSize: 22, letterSpacing: 3, padding: '6px 14px', borderRadius: 10, textTransform: 'uppercase', ...style}}>{children}</div>;
const Chip: React.FC<{children: string; style?: React.CSSProperties}> = ({children, style}) => <div style={{position: 'absolute', background: '#0d1220e6', border: '1.5px solid #3a4258', color: '#dfe6f5',
  fontFamily: ui, fontWeight: 700, fontSize: 22, padding: '6px 14px', borderRadius: 10, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Lock: React.FC = () => <svg width={20} height={20} viewBox="0 0 24 24" style={{flexShrink: 0}}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="#7d8799" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#7d8799" strokeWidth="2.4" /></svg>;
const Logo: React.FC<{name: string; size: number; white?: boolean}> = ({name, size, white = true}) => <Img src={A(name)} style={{width: size, height: size, display: 'block', filter: white ? 'invert(1)' : undefined}} />;

// One real recording (1080x960 file) in a browser card: shown at the card width (1000 px = 0.926x), `vt` is the time inside
// the file, set by a time map so each highlight lands on its spoken word. Children draw over the visible page area.
type Box = {x: number; y: number; w: number; visH: number};
const BAR = 52;
const Card: React.FC<React.PropsWithChildren<{box: Box; url: string; name: string; vt: number; oy?: number; zoom?: number; fx?: number; fy?: number; src?: string; glow?: string}>> =
  ({box, url, name, vt, oy = 0, zoom = 1, fx = 540, fy = 300, src, glow = '#3D8BFF2a', children}) => {
    const k = box.w / 1080;
    return <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: BAR + box.visH, borderRadius: 26, overflow: 'hidden', background: '#000', boxShadow: `0 0 0 2px #2c313c,0 30px 80px #000c,0 0 120px ${glow}`}}>
      <div style={{height: BAR, background: '#15181f', display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c, flexShrink: 0}} />)}
        <div style={{marginLeft: 12, flex: 1, height: 34, borderRadius: 17, background: '#090b0f', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', fontFamily: mono, fontWeight: 500, fontSize: 20, color: '#c9d3ee', whiteSpace: 'nowrap', overflow: 'hidden'}}><Lock />{url}</div>
      </div>
      <div style={{position: 'absolute', left: 0, top: BAR, width: box.w, height: box.visH, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: -oy, width: box.w, height: 960 * k, transform: `scale(${zoom})`, transformOrigin: `${fx * k}px ${fy * k}px`}}>
          <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: 0, width: box.w, height: 960 * k}} /></Freeze>
        </div>
        {children}
      </div>
      {src && <Chip style={{right: 16, bottom: 14}}>{src}</Chip>}
    </div>;
  };

// ------------------------------------------------------------------ keyword line under the card (the seam headline)
type Seg = [string, string, number?];   // text, colour, appear time (default: the item's start)
type HL = {s: number; e: number; small?: string; smallAt?: number; big: Seg[]; size?: number; below?: string; belowAt?: number; belowColor?: string; belowSize?: number; icon?: string; iconAt?: number};
const Headline: React.FC<{items: HL[]; cy: number; band: boolean}> = ({items, cy, band}) => {
  const t = useT(), it = items.find(h => t >= h.s && t < h.e); if (!it) return null;
  const text = it.big.map(b => b[0]).join(''), size = fit(text + (it.icon ? 'MM' : ''), it.size ?? 92, 800);
  const bigTop = 190 - size * 0.56, bs = it.belowSize ?? 32;
  return <div style={{position: 'absolute', left: 0, right: 0, top: cy - 190, height: 380, zIndex: 40}}>
    {band && <div style={{position: 'absolute', left: 0, right: 0, top: 60, height: 260, background: 'linear-gradient(transparent,#000000cc 30%,#000000cc 70%,transparent)'}} />}
    {it.small && <div style={{position: 'absolute', left: 0, right: 0, top: bigTop - 54, textAlign: 'center', fontFamily: ui, fontWeight: 700, fontSize: 40, lineHeight: '50px', color: '#fff', ...fade(t, it.smallAt ?? it.s)}}>{it.small}</div>}
    <div style={{position: 'absolute', left: 0, right: 0, top: bigTop, height: size * 1.12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: size * 0.2, fontFamily: ui, fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: -1, whiteSpace: 'nowrap'}}>
      {it.icon && <div style={{width: size * 0.9, height: size * 0.9, borderRadius: size * 0.22, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', ...fade(t, it.iconAt ?? it.s)}}><Logo name={it.icon} size={size * 0.6} white={false} /></div>}
      <span>{it.big.map(([x, c, at], k) => <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', color: c, ...fade(t, at ?? it.s)}}>{x}</span>)}</span>
    </div>
    {it.below && <div style={{position: 'absolute', left: 0, right: 0, top: bigTop + size * 1.12 + 10, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: bs, lineHeight: 1.25,
      color: it.belowColor ?? '#dfe3ea', ...fade(t, it.belowAt ?? it.s)}}>{it.below}</div>}
  </div>;
};

// ------------------------------------------------------------------ beat 1: hook banners (on screen from frame 0)
const Banners: React.FC<{cy: number}> = ({cy}) => {
  const t = useT(); if (t >= C.s2) return null;
  const s = 1 + 0.04 * (1 - eo(pr(t, 0, 0.3))), out = eo(pr(t, C.s2 - 0.2, 0.2)), k1 = t >= 0.64 ? 1 + 0.05 * (1 - eo(pr(t, 0.64, 0.3))) : 1, k2 = t >= 2.16 ? 1 + 0.04 * (1 - eo(pr(t, 2.16, 0.3))) : 1;
  return <div style={{position: 'absolute', left: 0, right: 0, top: cy - 120, zIndex: 41, textAlign: 'center', transform: `scale(${s}) translateY(${out * 40}px)`, opacity: 1 - out}}>
    <div style={{transform: `scale(${k1})`}}><div style={{display: 'inline-block', background: '#fff', color: '#0a0a0a', fontFamily: ui, fontWeight: 900, fontSize: 64, lineHeight: '78px', letterSpacing: 1,
      padding: '10px 34px', borderRadius: 22, boxShadow: '0 14px 34px #000a'}}>LAUNCHED 10 NOV</div></div>
    <div style={{transform: `scale(${k2})`, marginTop: 10}}><div style={{display: 'inline-block', background: RED, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 56, lineHeight: '70px',
      padding: '8px 32px', borderRadius: 18, boxShadow: '0 14px 34px #000a'}}>Businesses in ChatGPT</div></div>
  </div>;
};

// ------------------------------------------------------------------ beat 3: the number (count-up lands on "billion")
const NumberCard: React.FC<{bare?: boolean}> = ({bare}) => {
  const t = useT(), lit = pr(t, 7.13, 0.25), n = 1.2 * eo(pr(t, 7.3, 0.62)), land = t >= 7.92 ? 1 + 0.08 * (1 - eo(pr(t, 7.92, 0.3))) : 1, arrow = eo(pr(t, 7.05, 0.3));
  const tile = (logo: string, label: string, on: number, at: number) => <div style={{width: 250, textAlign: 'center', ...fade(t, at)}}>
    <div style={{width: 170, height: 170, margin: '0 auto', borderRadius: 44, background: on > 0.5 ? '#0f1a33' : '#14171f', border: `4px solid ${on > 0 ? ACC : '#3a3f4b'}`,
      boxShadow: on > 0 ? `0 0 ${80 * on}px ${ACC}88` : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Logo name={logo} size={92} /></div>
    <div style={{marginTop: 16, fontFamily: ui, fontWeight: 800, fontSize: 40, color: on > 0 ? '#fff' : '#b8bdc8'}}>{label}</div></div>;
  return <>{!bare && <Bg id="g-num" tone="#132650" />}
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 60}}>
      {tile('si-google.svg', 'Google', 0, -1)}
      <svg width={150} height={60} viewBox="0 0 150 60" style={{marginTop: -50}}><path d={`M10 30H${10 + 110 * arrow}`} stroke={ACC} strokeWidth={8} strokeLinecap="round" />{arrow >= 1 && <path d="M104 12L130 30L104 48" fill="none" stroke={ACC} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />}</svg>
      {tile('si-openai.svg', 'ChatGPT', lit, -1)}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 650, textAlign: 'center', fontFamily: ui, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', transform: `scale(${land})`, opacity: pr(t, 7.28, 0.08)}}>
      <span style={{fontSize: 290, lineHeight: '300px', letterSpacing: -10, fontVariantNumeric: 'tabular-nums'}}>{n.toFixed(1)}</span>
      <span style={{fontSize: 110, marginLeft: 26, color: ACC, letterSpacing: -3, ...fade(t, 7.85)}}>billion</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 975, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 50, lineHeight: '62px', color: '#fff', ...fade(t, 8.29)}}>
      people use ChatGPT <span style={{color: t >= 9.21 ? YEL : '#fff'}}>every week</span></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1075, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 30, color: GREY, ...fade(t, 8.6)}}>Source: OpenAI, 10 Nov 2026</div>
  </>;
};

// ------------------------------------------------------------------ beat 4: the chat mock-up and the "in Dubai?" beat
const QS: [string, number][] = [['Best CRM for a small agency?', 10.27], ['Best abaya store online?', 11.19], ['Best AI marketer in Dubai?', 12.31]];
const ChatCard: React.FC<{bare?: boolean}> = ({bare}) => {
  const t = useT();
  return <>{!bare && <Bg id="g-chat" tone="#1b2140" />}
    <div style={{position: 'absolute', left: 60, top: 300, width: 960, height: 1000, borderRadius: 36, background: '#14161c', border: '2px solid #2c3140', boxShadow: '0 30px 80px #000c', overflow: 'hidden'}}>
      <Tag style={{right: 24, top: 22}}>Illustration</Tag>
      <div style={{position: 'absolute', left: 36, top: 26, fontFamily: ui, fontWeight: 700, fontSize: 30, color: '#9aa3b5'}}>What people ask</div>
      {QS.map(([q, at], i) => { const s = pop(t, at, 0.3), hot = i === 2 && t >= 13.33;
        return s > 0 && <div key={q} style={{position: 'absolute', right: 70, top: 160 + i * 200, transform: `scale(${s})`, transformOrigin: '100% 50%'}}>
          <div style={{background: hot ? ACC : '#2b2f3a', color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 50, lineHeight: '62px', padding: '26px 38px', borderRadius: '36px 36px 8px 36px', whiteSpace: 'nowrap'}}>{q}</div></div>; })}
      <div style={{position: 'absolute', left: 36, right: 70, bottom: 40, height: 120, borderRadius: 60, background: '#1f222b', border: '2px solid #353a48', display: 'flex', alignItems: 'center', padding: '0 36px',
        fontFamily: ui, fontWeight: 500, fontSize: 40, color: '#7d8494'}}>Ask anything<span style={{color: ACC, marginLeft: 4, opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>|</span></div>
    </div>
  </>;
};
const DubaiGag: React.FC = () => {
  const t = useT(), p = eo(pr(t, C.gag, 0.18)), sh = Math.sin(t * 70) * 6 * (1 - pr(t, C.gag, 0.3));
  return <AbsoluteFill style={{background: 'radial-gradient(80% 60% at 50% 45%,#f4f4f4,#bdbdbd)'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, C.gag + 0.04, 0.28)})`}}>
      <svg width={150} height={150} viewBox="0 0 24 24"><path d="M12 2.5c-3.9 0-7 3-7 6.9 0 5.2 7 12.1 7 12.1s7-6.9 7-12.1c0-3.9-3.1-6.9-7-6.9z" fill="#111" /><circle cx="12" cy="9.4" r="2.7" fill="#f4f4f4" /></svg></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 650, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 210, lineHeight: '230px', letterSpacing: -6, color: '#0a0a0a',
      transform: `translateX(${sh}px) scale(${1.3 - 0.3 * p}) rotate(-3deg)`, opacity: Math.min(1, p * 2)}}>in Dubai?</div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ beat 5: the address bar (typed as it is said)
const URL_TEXT = 'chatgpt.com/business-hub';
const AddressBar: React.FC = () => {
  const t = useT(), n = Math.floor(mapT(t, [[14.38, 0], [15.0, 7], [15.06, 7], [15.6, 11], [15.74, 11], [15.9, 12], [16.31, 12], [16.78, 24]]) + 0.001), focus = pr(t, 16.31, 0.2), enter = pop(t, 16.82, 0.26);
  const z = 1 + 0.05 * eo(pr(t, 14.3, 2.4));
  return <><Bg id="g-bar" tone="#16224a" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: ui, fontWeight: 700, fontSize: 40, color: '#9aa3b5', ...fade(t, 14.01)}}>in your browser</div>
    <div style={{position: 'absolute', left: 70, top: 480, width: 940, height: 150, borderRadius: 75, background: '#1b1e26', border: `4px solid ${focus > 0 ? ACC : '#353a48'}`, boxShadow: focus > 0 ? `0 0 0 ${10 * focus}px ${ACC}33,0 30px 80px #000c` : '0 30px 80px #000c',
      display: 'flex', alignItems: 'center', padding: '0 40px', boxSizing: 'border-box', transform: `scale(${z})`}}>
      <svg width={40} height={40} viewBox="0 0 24 24" style={{flexShrink: 0}}><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="#9aa3b5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#9aa3b5" strokeWidth="2.4" /></svg>
      <div style={{marginLeft: 26, fontFamily: mono, fontWeight: 700, fontSize: 52, color: '#fff', whiteSpace: 'nowrap'}}>
        <span>{URL_TEXT.slice(0, Math.min(n, 11))}</span><span style={{color: '#8fd0ff'}}>{URL_TEXT.slice(11, n)}</span>
        <span style={{color: ACC, fontWeight: 500, opacity: n < 24 || Math.floor(t * 3) % 2 ? 1 : 0}}>|</span></div>
    </div>
    {enter > 0 && <div style={{position: 'absolute', left: 770, top: 690, width: 200, height: 96, borderRadius: 20, background: '#262a34', border: '3px solid #4a5163', borderBottomWidth: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ui, fontWeight: 800, fontSize: 36, color: '#fff', transform: `scale(${enter})`}}>Enter</div>}
    <div style={{position: 'absolute', left: 90, top: 900, width: 840, ...fade(t, 15.1)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 84, height: 84, borderRadius: 24, background: '#14171f', border: '3px solid #3a3f4b', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Logo name="si-openai.svg" size={50} /></div>
        <div><div style={{fontFamily: ui, fontWeight: 800, fontSize: 46, color: '#fff'}}>Business Hub</div>
          <div style={{fontFamily: ui, fontWeight: 600, fontSize: 30, color: '#b8bdc8', marginTop: 4}}>sign in with your ChatGPT account first</div></div>
      </div>
    </div>
  </>;
};

// ------------------------------------------------------------------ beat 6: the claim steps (illustration of the help page's steps)
const STEP_AT = [16.95, 18.1, 19.06];
const StepDots: React.FC<{active: number}> = ({active}) => <div style={{position: 'absolute', right: 36, top: 30, display: 'flex', gap: 12}}>
  {[0, 1, 2, 3].map(i => <div key={i} style={{width: 46, height: 46, borderRadius: 23, background: i < active ? GREEN : i === active ? ACC : '#262a34', color: i <= active ? '#06101f' : '#7d8494',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 900, fontSize: 24}}>{i < active ? <Check size={26} /> : i + 1}</div>)}</div>;
const Steps: React.FC = () => {
  const t = useT(), step = t < STEP_AT[1] ? 0 : t < STEP_AT[2] ? 1 : 2, q = 1 - eo(pr(t, STEP_AT[step], 0.24));
  const name = 'WithHammad'.slice(0, Math.floor(pr(t, 17.0, 0.7) * 10.99)), dom = 'withhammad.com'.slice(0, Math.floor(pr(t, 19.3, 0.5) * 14.99));
  const title = ['Search your business', 'Pick how to verify', 'Add your domain'][step];
  const opts: [string, string][] = [['Business phone', 'M7 3h10v18H7z'], ['Business email', 'M3 6h18v12H3zM3 6l9 7 9-7'], ['Website domain', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'], ['Shopify store', 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2']];
  return <><Bg id="g-steps" tone="#13284a" />
    <div style={{position: 'absolute', left: 60, top: 300, width: 960, height: 980, borderRadius: 36, background: '#14161c', border: '2px solid #2c3140', boxShadow: '0 30px 80px #000c', overflow: 'hidden'}}>
      <Tag style={{left: 30, top: 34}}>Illustration</Tag><StepDots active={step} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 980, transform: `translateX(${q * 300}px)`, opacity: 1 - q}}>
        <div style={{position: 'absolute', left: 40, top: 140, display: 'flex', alignItems: 'center', gap: 20}}>
          <div style={{width: 76, height: 76, borderRadius: 38, background: ACC, color: '#fff', fontFamily: ui, fontWeight: 900, fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{step + 1}</div>
          <div style={{fontFamily: ui, fontWeight: 800, fontSize: 60, color: '#fff', letterSpacing: -1}}>{title}</div></div>
        {step === 0 && <>
          <div style={{position: 'absolute', left: 40, top: 300, width: 850, height: 130, borderRadius: 24, background: '#1f222b', border: `3px solid ${ACC}`, display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box'}}>
            <svg width={46} height={46} viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.6" fill="none" stroke="#9aa3b5" strokeWidth="2.6" /><path d="M15.6 15.6L21 21" stroke="#9aa3b5" strokeWidth="3" strokeLinecap="round" /></svg>
            <span style={{marginLeft: 20, fontFamily: ui, fontWeight: 700, fontSize: 52, color: name ? '#fff' : '#7d8494'}}>{name || 'Business name'}</span>
            <span style={{color: ACC, opacity: Math.floor(t * 3) % 2 ? 1 : 0, fontFamily: ui, fontSize: 52}}>|</span></div>
          <div style={{position: 'absolute', left: 40, top: 500, width: 850, height: 170, borderRadius: 24, background: '#202634', border: '2px solid #3a4258', display: 'flex', alignItems: 'center', padding: '0 30px', gap: 24,
            boxSizing: 'border-box', transform: `scale(${pop(t, 17.62, 0.28)})`}}>
            <div style={{width: 84, height: 84, borderRadius: 42, objectFit: 'cover', background: '#2b3346', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 900, fontSize: 40, color: '#fff'}}>W</div>
            <div><div style={{fontFamily: ui, fontWeight: 800, fontSize: 44, color: '#fff'}}>WithHammad</div><div style={{fontFamily: mono, fontWeight: 500, fontSize: 30, color: '#9aa3b5', marginTop: 2}}>withhammad.com</div></div></div>
        </>}
        {step === 1 && opts.map(([o, d], i) => { const pick = i === 2 && t >= 18.31, s = eo(pr(t, 18.1 + i * 0.05, 0.2));
          return <div key={o} style={{position: 'absolute', left: 40, top: 280 + i * 150, width: 850, height: 124, borderRadius: 22, background: pick ? '#16294d' : '#1f222b', border: `3px solid ${pick ? ACC : '#353a48'}`, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', padding: '0 26px', gap: 22, opacity: s, transform: `scale(${pick ? 1 + 0.04 * (1 - eo(pr(t, 18.31, 0.3))) : 1})`}}>
            <div style={{width: 36, height: 36, borderRadius: 18, border: `4px solid ${pick ? ACC : '#7d8494'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>{pick && <div style={{width: 16, height: 16, borderRadius: 8, background: ACC}} />}</div>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={pick ? '#fff' : '#9aa3b5'} strokeWidth={1.8} strokeLinejoin="round"><path d={d} /></svg>
            <span style={{fontFamily: ui, fontWeight: 700, fontSize: 48, color: pick ? '#fff' : '#c7ccd6'}}>{o}</span></div>; })}
        {step === 2 && <>
          <div style={{position: 'absolute', left: 40, top: 290, fontFamily: ui, fontWeight: 700, fontSize: 36, color: '#9aa3b5'}}>Website domain</div>
          <div style={{position: 'absolute', left: 40, top: 345, width: 850, height: 130, borderRadius: 24, background: '#1f222b', border: `3px solid ${ACC}`, display: 'flex', alignItems: 'center', padding: '0 30px', boxSizing: 'border-box'}}>
            <span style={{fontFamily: mono, fontWeight: 700, fontSize: 54, color: '#fff'}}>{dom}</span><span style={{color: ACC, opacity: Math.floor(t * 3) % 2 ? 1 : 0, fontFamily: mono, fontSize: 54}}>|</span></div>
          <div style={{position: 'absolute', left: 40, top: 540, display: 'flex', alignItems: 'center', gap: 16, ...fade(t, 19.62)}}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={YEL} strokeWidth={2.2} strokeLinecap="round"><path d="M12 4v12M6 10l6 6 6-6M5 20h14" /></svg>
            <span style={{fontFamily: ui, fontWeight: 700, fontSize: 38, color: '#e6ecfb'}}>next: one TXT record in your DNS</span></div>
          <div style={{position: 'absolute', left: 40, top: 630, width: 850, borderRadius: 22, background: '#1a1d25', border: '2px dashed #4a5163', padding: '18px 28px', boxSizing: 'border-box', ...fade(t, 19.75)}}>
            {['Type', 'Name or host', 'Value'].map((k, i) => <div key={k} style={{display: 'flex', alignItems: 'center', height: 70}}>
              <span style={{width: 280, fontFamily: ui, fontWeight: 700, fontSize: 34, color: '#9aa3b5'}}>{k}</span>
              {i === 0 ? <span style={{fontFamily: mono, fontWeight: 700, fontSize: 40, color: '#fff'}}>TXT</span>
                : <div style={{width: i === 1 ? 220 : 440, height: 30, borderRadius: 8, background: 'repeating-linear-gradient(90deg,#6b7180 0 18px,#4a5060 18px 30px)', filter: 'blur(4px)'}} />}</div>)}
          </div>
        </>}
      </div>
    </div>
  </>;
};

// ------------------------------------------------------------------ beat 7: verified + submitted (illustration)
const Result: React.FC = () => {
  const t = useT(), v = pop(t, 22.23, 0.32), sub = pop(t, 23.15, 0.3);
  return <><Bg id="g-res" tone="#123a2a" />
    <div style={{position: 'absolute', left: 60, top: 300, width: 960, height: 980, borderRadius: 36, background: '#14161c', border: '2px solid #2c3140', boxShadow: '0 30px 80px #000c', overflow: 'hidden'}}>
      <Tag style={{left: 30, top: 34}}>Illustration</Tag><StepDots active={4} />
      <div style={{position: 'absolute', left: 40, top: 170, display: 'flex', alignItems: 'center', gap: 20}}>
        <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#9aa3b5" strokeWidth={1.6}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
        <span style={{fontFamily: mono, fontWeight: 700, fontSize: 54, color: '#fff'}}>withhammad.com</span></div>
      {v > 0 && <div style={{position: 'absolute', left: 40, top: 320, display: 'flex', alignItems: 'center', gap: 22, background: '#0f2e1f', border: `3px solid ${GREEN}`, borderRadius: 60, padding: '18px 40px 18px 22px',
        transform: `scale(${v})`, transformOrigin: '0 50%', boxShadow: `0 0 60px ${GREEN}55`}}><Tick size={88} /><span style={{fontFamily: ui, fontWeight: 900, fontSize: 72, color: GREEN}}>Domain verified</span></div>}
      {sub > 0 && <div style={{position: 'absolute', left: 40, top: 560, transform: `scale(${sub})`, transformOrigin: '0 50%'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <svg width={64} height={64} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
          <span style={{fontFamily: ui, fontWeight: 900, fontSize: 64, color: '#fff'}}>Claim submitted</span></div>
        <div style={{marginTop: 22, display: 'inline-block', background: '#262a34', color: '#c7ccd6', fontFamily: ui, fontWeight: 700, fontSize: 36, padding: '14px 24px', borderRadius: 16}}>OpenAI reviews it and replies by email</div>
      </div>}
    </div>
  </>;
};

// ------------------------------------------------------------------ beat 8: good news, bad news
const NewsCard: React.FC = () => {
  const t = useT();
  const block = (y: number, at: number, n: string, label: string, bg: string) => { const s = pop(t, at, 0.3); if (s <= 0) return null;
    return <div style={{position: 'absolute', left: 90, top: y, width: 900, height: 230, borderRadius: 40, background: bg, transform: `scale(${s}) rotate(${n === '1' ? -2 : 2}deg)`, boxShadow: '0 30px 70px #000a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34}}>
      <div style={{width: 110, height: 110, borderRadius: 55, background: '#0b0d12', color: '#fff', fontFamily: ui, fontWeight: 900, fontSize: 66, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
      <span style={{fontFamily: ui, fontWeight: 900, fontSize: 112, color: '#0b0d12', letterSpacing: -2}}>{label}</span></div>; };
  const ghost = (y: number, at: number) => t < at && <div style={{position: 'absolute', left: 90, top: y, width: 900, height: 230, borderRadius: 40, border: '4px dashed #ffffff33', boxSizing: 'border-box'}} />;
  return <><Bg id="g-news" tone="#2a2350" />{ghost(550, 24.79)}{ghost(860, 25.59)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 390, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 80, color: '#fff', ...fade(t, 24.11)}}>Now:</div>
    {block(550, 24.79, '1', 'GOOD NEWS', GREEN)}{block(860, 25.59, '2', 'BAD NEWS', RED)}
  </>;
};

// ------------------------------------------------------------------ beat 9: the Business Agent
const AgentCard: React.FC = () => {
  const t = useT();
  return <><Bg id="g-agent" tone="#152a5c" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', transform: `scale(${pop(t, 26.38, 0.3)})`}}><Pill bg={GREEN} size={34}>GOOD NEWS</Pill></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 104, lineHeight: '116px', color: ACC, letterSpacing: -3, transform: `scale(${pop(t, 27.3, 0.32)})`}}>Business Agent</div>
    <div style={{position: 'absolute', left: 60, top: 540, width: 960, height: 420, borderRadius: 36, background: '#14161c', border: '2px solid #2c3140', overflow: 'hidden', ...fade(t, 28.38)}}>
      <Tag style={{right: 24, top: 20}}>Example</Tag>
      {pop(t, 29.06) > 0 && <div style={{position: 'absolute', right: 30, top: 90, transform: `scale(${pop(t, 29.06)})`, transformOrigin: '100% 50%'}}>
        <div style={{background: '#2b2f3a', color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 40, lineHeight: '50px', padding: '18px 30px', borderRadius: '30px 30px 8px 30px', whiteSpace: 'nowrap'}}>Can I return an item I bought on sale?</div></div>}
      {pop(t, 29.64) > 0 && <div style={{position: 'absolute', left: 30, top: 220, transform: `scale(${pop(t, 29.64)})`, transformOrigin: '0 50%'}}>
        <div style={{fontFamily: ui, fontWeight: 700, fontSize: 26, color: '#9aa3b5', marginBottom: 8}}>Business Agent · AI</div>
        <div style={{background: ACC, color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 40, lineHeight: '50px', padding: '18px 30px', borderRadius: '8px 30px 30px 30px', whiteSpace: 'nowrap'}}>Answers from your return policy</div></div>}
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', transform: `scale(${pop(t, 30.4, 0.3)})`}}><Pill bg={PURP} color="#fff" size={36}>ANSWERS + LINKS TO YOUR SITE</Pill></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1112, textAlign: 'center', fontFamily: ui, fontWeight: 700, fontSize: 34, color: '#d7dbe3', ...fade(t, 30.9)}}>no purchases or bookings in the chat</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1164, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 24, color: GREY, ...fade(t, 31.0)}}>help.openai.com, Business Hub help article</div>
  </>;
};

// ------------------------------------------------------------------ beat 11b: comment CLAIM
const COMMENT = 'CLAIM';
const DmCard: React.FC<{x: number; y: number; w: number; at: number}> = ({x, y, w, at}) => {
  const t = useT(), dm = eo(pr(t, at, 0.36)); if (dm <= 0) return null;
  return <div style={{position: 'absolute', left: x, top: y + (1 - dm) * 80, width: w, borderRadius: 32, background: '#111a2e', border: '2px solid #2a3657', padding: '20px 26px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000c', opacity: dm}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}><Img src={A('avatar_thumb.jpg')} style={{width: 54, height: 54, borderRadius: 27, objectFit: 'cover'}} />
      <span style={{fontFamily: ui, fontWeight: 800, fontSize: 34, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: ui, fontWeight: 600, fontSize: 26, color: '#9aa3b5'}}>· Direct message</span></div>
    <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 14, background: ACC, color: '#fff', fontFamily: ui, fontWeight: 700, fontSize: 40, padding: '16px 28px', borderRadius: '8px 28px 28px 28px', whiteSpace: 'nowrap'}}>
      <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>Your claim checklist</div>
  </div>;
};
const CommentCard: React.FC = () => {
  const t = useT(), typed = COMMENT.slice(0, Math.floor(pr(t, 37.9, 0.4) * (COMMENT.length + 0.99))), sent = 38.42;
  return <><Bg id="g-cmt" tone="#12357a" at="50% 40%" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 168, lineHeight: '190px', letterSpacing: 4, whiteSpace: 'nowrap'}}>
      {COMMENT.split('').map((c, i) => <span key={i} style={{display: 'inline-block', color: i < typed.length ? '#fff' : 'transparent', WebkitTextStroke: i < typed.length ? undefined : '3px #ffffff40',
        transform: `scale(${i < typed.length ? 1 + 0.2 * (1 - eo(pr(t, 37.9 + i * 0.08, 0.25))) : 1})`, textShadow: i < typed.length ? `0 0 50px ${ACC}aa` : undefined}}>{c}</span>)}</div>
    <div style={{position: 'absolute', left: 60, top: 620, width: 960, height: 128, borderRadius: 64, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 92, height: 92, borderRadius: 46, objectFit: 'cover'}} />
      <div style={{flex: 1, marginLeft: 22, fontFamily: ui, fontWeight: typed ? 900 : 600, fontSize: typed ? 58 : 44, color: typed ? '#111' : '#9aa3b5', letterSpacing: typed ? 2 : 0}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: ACC, fontWeight: 500}}>|</span></div>
      <div style={{background: ACC, color: '#fff', fontFamily: ui, fontWeight: 800, fontSize: 34, padding: '18px 36px', borderRadius: 44, transform: `scale(${1 + 0.16 * (t >= sent ? 1 - eo(pr(t, sent, 0.3)) : 0)})`}}>Post</div>
    </div>
    <DmCard x={60} y={830} w={880} at={38.62} />
  </>;
};

// ------------------------------------------------------------------ beat 12: the review path (step bar under the help page)
const PATH: [string, number][] = [['Claim', 40.59], ['Review', 41.03], ['ID check', 42.19], ['Blue check', 99]];
const PathBar: React.FC<{cy: number}> = ({cy}) => {
  const t = useT(), X0 = 200, X1 = 840, fill = mapT(t, [[40.4, 0], [40.6, 0], [41.03, 1 / 3], [42.0, 1 / 3], [42.19, 2 / 3]]);
  return <div style={{position: 'absolute', left: 0, top: cy - 80, width: 1080, height: 200, zIndex: 40, ...fade(t, 39.6)}}>
    <div style={{position: 'absolute', left: X0, top: 40, width: X1 - X0, height: 10, borderRadius: 5, background: '#2a2f3a'}} />
    <div style={{position: 'absolute', left: X0, top: 40, width: (X1 - X0) * fill, height: 10, borderRadius: 5, background: YEL}} />
    {PATH.map(([label, at], i) => { const x = lerp(X0, X1, i / 3), on = t >= at;
      return <div key={label}>
        <div style={{position: 'absolute', left: x - 30, top: 15, width: 60, height: 60, borderRadius: 30, background: on ? YEL : '#1b1e26', border: `4px solid ${on ? YEL : '#4a5163'}`, boxSizing: 'border-box',
          transform: `scale(${on ? 1 + 0.25 * (1 - eo(pr(t, at, 0.3))) : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ui, fontWeight: 900, fontSize: 26, color: '#111'}}>{on && <Check size={30} />}</div>
        <div style={{position: 'absolute', left: x - 110, top: 92, width: 220, textAlign: 'center', fontFamily: ui, fontWeight: 800, fontSize: 32, color: on ? '#fff' : '#7d8494', whiteSpace: 'nowrap'}}>{label}</div></div>; })}
  </div>;
};

// ------------------------------------------------------------------ beat 13: the safe rule, follow, DM; beat 14: all set
const RuleCard: React.FC = () => {
  const t = useT(), own = t >= 44.01 ? 1 + 0.14 * (1 - eo(pr(t, 44.01, 0.3))) : 1;
  return <><Bg id="g-rule" tone="#3a2a05" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, 42.87, 0.3)})`}}>
      <svg width={190} height={190} viewBox="0 0 24 24"><path d="M12 2.5l8 3v6.2c0 4.7-3.3 8.3-8 9.8-4.7-1.5-8-5.1-8-9.8V5.5z" fill={YEL} /><path d="M8.2 12.2l2.7 2.7 5-5.3" fill="none" stroke="#2a1800" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 630, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 84, lineHeight: '96px', color: '#fff', letterSpacing: -2, ...fade(t, 42.87)}}>Only claim a business</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 740, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 170, lineHeight: '190px', color: YEL, letterSpacing: -5, transform: `scale(${own})`, ...fade(t, 43.79)}}>you own</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 965, textAlign: 'center', fontFamily: ui, fontWeight: 600, fontSize: 36, color: '#c7ccd6', ...fade(t, 44.05)}}>or are authorized to represent</div>
  </>;
};
const FollowCard: React.FC = () => {
  const t = useT(), on = t >= 44.67, glow = t >= 46.79 ? 1 : 0;
  return <><Bg id="g-follow" tone="#12357a" />
    <div style={{position: 'absolute', left: 60, top: 340, width: 960, height: 150, borderRadius: 44, background: '#0c1730f0', border: '2px solid #2a3657', display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', boxShadow: '0 20px 50px #000a'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 104, height: 104, borderRadius: 52, objectFit: 'cover', border: `4px solid ${ACC}`}} />
      <span style={{marginLeft: 22, fontFamily: ui, fontWeight: 800, fontSize: 46, color: '#fff'}}>withhammad.ai</span>
      <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, background: on ? '#1c2742' : ACC, border: `3px solid ${on ? GREEN : ACC}`, color: on ? GREEN : '#fff', fontFamily: ui, fontWeight: 800, fontSize: 36,
        padding: '14px 26px', borderRadius: 40, transform: `scale(${1 + 0.2 * (on ? 1 - eo(pr(t, 44.67, 0.32)) : 0)})`}}>{on ? 'Following' : 'Follow'}{on && <Tick size={36} />}</div>
    </div>
    <div style={{position: 'absolute', left: 70, top: 570, width: 880, ...fade(t, 45.28)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <svg width={72} height={72} viewBox="0 0 24 24" fill={YEL}><path d="M12 22a2.5 2.5 0 0 0 2.4-1.8H9.6A2.5 2.5 0 0 0 12 22zm7-5.5l-1.5-1.8V10a5.5 5.5 0 0 0-4.3-5.4V3.5a1.2 1.2 0 0 0-2.4 0v1.1A5.5 5.5 0 0 0 6.5 10v4.7L5 16.5V18h14z" /></svg>
        <span style={{fontFamily: ui, fontWeight: 800, fontSize: 50, color: '#fff'}}>I'll post the day</span></div>
      <div style={{marginTop: 18, fontFamily: ui, fontWeight: 900, fontSize: 72, lineHeight: '84px', color: '#fff', letterSpacing: -1, ...fade(t, 46.05)}}>Business Agents open</div>
      <div style={{marginTop: 6, display: 'inline-block', fontFamily: ui, fontWeight: 900, fontSize: 72, lineHeight: '84px', color: YEL, letterSpacing: -1, transform: `scale(${glow ? 1 + 0.08 * (1 - eo(pr(t, 46.79, 0.3))) : 1})`, transformOrigin: '0 50%', ...fade(t, 46.79)}}>outside the US</div>
    </div>
    <DmCard x={60} y={940} w={880} at={46.3} />
  </>;
};
const EndCard: React.FC = () => {
  const t = useT();
  return <><Bg id="g-end" tone="#123a2a" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center', transform: `scale(${pop(t, 48.24, 0.3)})`}}><Tick size={220} /></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 750, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 150, lineHeight: '170px', color: '#fff', letterSpacing: -4, transform: `scale(${pop(t, 48.3, 0.3)})`}}>All set!</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 975, textAlign: 'center', ...fade(t, 48.5)}}><Pill size={36}>COMMENT CLAIM</Pill></div>
  </>;
};

// ------------------------------------------------------------------ presenter (only when the `avatar` prop is set)
const clipTime = (t: number) => t < SLOTS.ending[0] ? cl(t, 0, SLOTS.hook[1] - 0.04) : SLOTS.hook[1] + Math.max(0, t - SLOTS.ending[0]);
const Avatar: React.FC<{src: string; top: number; scale?: number; gray?: boolean}> = ({src, top, scale = 1, gray}) => {
  const t = useT();
  return <Freeze frame={Math.round(clipTime(t) * FPS)}><OffthreadVideo muted src={staticFile(src)} style={{position: 'absolute', left: 0, top, width: 1080, height: 1920, objectFit: 'cover', transform: `scale(${scale})`, transformOrigin: '50% 38%',
    filter: gray ? 'grayscale(1) contrast(1.1)' : undefined}} /></Freeze>;
};
// Places a full-frame design (content between y0 and y1) into the top split panel.
const Fit: React.FC<React.PropsWithChildren<{y0: number; y1: number; Y0?: number; Y1?: number}>> = ({y0, y1, Y0 = 236, Y1 = 930, children}) => {
  const s = (Y1 - Y0) / (y1 - y0);
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${540 * (1 - s)}px,${Y0 - y0 * s}px) scale(${s})`, transformOrigin: '0 0'}}>{children}</div></div>;
};

// ------------------------------------------------------------------ captions: white bold sentence case, soft shadow, no box
// [first word, last word, override text]; word indices follow voice/words_tight.json.
const CHUNKS: [number, number, string?][] = [[8, 11], [12, 15], [16, 20, '1.2 billion people'], [21, 24], [25, 26], [27, 29], [30, 32],
  [35, 39, 'Go to chatgpt.com'], [40, 42, '/business-hub'], [43, 45], [46, 47], [48, 50], [51, 53], [54, 56], [57, 57], [58, 59],
  [66, 70], [71, 74], [75, 78], [79, 82], [83, 85], [86, 90], [91, 95], [96, 97], [98, 100], [101, 102], [103, 106], [107, 110],
  [111, 114], [115, 116], [117, 119], [120, 123], [124, 125], [126, 128], [129, 130]];
const HIDE: [number, number][] = [[0, C.s2], [C.s3, C.s4], [C.gag, C.s5], [C.s8, C.s9]];
const clean = (w: string) => w.replace(/[.,:]+$/, '');
const Captions: React.FC<{words: Word[]; top: number; hideEnd: boolean}> = ({words, top, hideEnd}) => {
  const t = useT(); if (HIDE.some(([a, b]) => t >= a && t < b) || (hideEnd && t >= C.s13)) return null;
  const st = CHUNKS.map(([a]) => words[a].startMs / 1000 - 0.04);
  const i = CHUNKS.findIndex(([, b], k) => t >= st[k] && t < Math.min(words[b].endMs / 1000 + 0.45, k + 1 < CHUNKS.length ? st[k + 1] : 99));
  if (i < 0) return null;
  const [a, b, over] = CHUNKS[i], text = over ?? words.slice(a, b + 1).map(w => clean(w.text)).join(' '), size = fit(text, 62, 820), s = 1 + 0.05 * (1 - eo(pr(t, st[i], 0.12)));
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 45, textAlign: 'center', transform: `scale(${s})`}}>
    <span style={{display: 'inline-block', fontFamily: ui, fontWeight: 800, fontSize: size, lineHeight: '74px', color: '#fff', whiteSpace: 'nowrap', letterSpacing: -0.5,
      textShadow: '0 3px 6px #000b,0 8px 30px #000d'}}>{text}</span></div>;
};

// ------------------------------------------------------------------ the edit
export const Claim: React.FC<ClaimProps> = ({words, avatar, avatarTop = -250}) => {
  const t = useT(), face = !!avatar, inHook = face && t < SLOTS.hook[1], inEnd = face && t >= SLOTS.ending[0];
  const box: Box = inHook ? {x: 40, y: 270, w: 1000, visH: 520} : {x: 40, y: 280, w: 1000, visH: 658};
  const HY = inHook ? 884 : 1150, split = inHook && t < C.gag;
  const items: HL[] = [
    {s: C.s2, e: 4.99, big: [['Business Profile', '#fff', 3.61]], icon: 'si-google.svg', iconAt: 3.61, size: 80, below: 'your free listing on Google Search and Maps', belowAt: 4.1},
    {s: 4.99, e: C.s3, small: 'same idea, for ChatGPT', smallAt: 4.99, big: [['Businesses in ChatGPT', ACC, 5.41]], icon: 'si-openai.svg', iconAt: 5.41, size: 80},
    {s: C.s6b, e: C.s7, small: 'step 4', smallAt: 20.1, big: [['TXT record', YEL, 21.27]], below: 'copy it into your DNS, then press Verify domain', belowAt: 20.67},
    {s: C.s10, e: C.s11, small: 'Business Agents', smallAt: 32.61, big: [['US only', RED, 33.57]], below: 'eligible ecommerce + online service businesses', belowAt: 34.07},
    {s: C.s11, e: C.s11b, small: 'cost to claim', smallAt: 35.97, big: [['$0 for now', GREEN, 36.52]], below: 'Digiday, 10 Nov 2026 · paid later not ruled out', belowAt: 36.9, belowSize: 28},
  ];
  return <AbsoluteFill style={{background: INK, fontFamily: ui, overflow: 'hidden'}}>
    {/* beats 1-4 (presenter slot A) */}
    <Scene s={0} e={C.s2} z={1}>{face ? null : <Bg id="g-h" tone="#16224a" />}
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.05 * eo(pr(t, 0, C.s2))})`, transformOrigin: `540px ${box.y + BAR + box.visH}px`}}>
        <Card box={box} url="openai.com/index/introducing-businesses-chatgpt" name="r01_announce" vt={mapT(t, [[0, 0.42], [3.27, 3.5]])} src="openai.com" /></div></Scene>
    <Scene s={C.s2} e={C.s3} z={2}>{face ? null : <Bg id="g-g" tone="#16304a" />}
      <Card box={box} url="business.google.com/en-all/business-profile" name="r02_google" vt={mapT(t, [[3.27, 0.4], [3.61, 0.95], [4.87, 2.3], [7.0, 2.85]])} src="business.google.com" glow="#ffffff22" /></Scene>
    <Scene s={C.s3} e={C.s4} z={3}>{face ? <><Bg id="g-num" tone="#132650" /><Fit y0={330} y1={1120}><NumberCard bare /></Fit></> : <NumberCard />}</Scene>
    <Scene s={C.s4} e={C.gag} z={4}>{face ? <><Bg id="g-chat" tone="#1b2140" /><Fit y0={290} y1={1310}><ChatCard bare /></Fit></> : <ChatCard />}</Scene>
    <Scene s={C.gag} e={C.s5} z={5}>{avatar ? <Avatar src={avatar} top={0} scale={1 + 0.08 * pr(t, C.gag, C.s5 - C.gag)} gray /> : <DubaiGag />}</Scene>
    {/* beats 5-12: motion graphics and recordings in every mode */}
    <Scene s={C.s5} e={C.s6} z={6}><AddressBar /></Scene>
    <Scene s={C.s6} e={C.s6b} z={7} dir="l"><Steps /></Scene>
    <Scene s={C.s6b} e={C.s7} z={8}><Bg id="g-h6" tone="#13284a" />
      <Card box={box} url="help.openai.com/.../setting-up-your-business-on-chatgpt" name="r06_verify_domain_help" vt={mapT(t, [[20.1, 2.5], [20.4, 3.1], [22.1, 4.9]])} src="help.openai.com" glow="#ffffff22" /></Scene>
    <Scene s={C.s7} e={C.s8} z={9}><Result /></Scene>
    <Scene s={C.s8} e={C.s9} z={10} dir="u"><NewsCard /></Scene>
    <Scene s={C.s9} e={C.s10} z={11}><AgentCard /></Scene>
    <Scene s={C.s10} e={C.s11} z={12}><Bg id="g-us" tone="#4a1014" />
      <Card box={box} url="openai.com/index/introducing-businesses-chatgpt" name="r10_us_only" vt={mapT(t, [[31.73, 1.05], [32.0, 1.45], [35.87, 3.2]])} src="openai.com" glow="#FF4B4B44">
        <div style={{position: 'absolute', left: 24, top: 592, transform: `scale(${pop(t, 31.89, 0.3)}) rotate(-4deg)`, transformOrigin: '0 50%'}}><Pill bg={RED} color="#fff" size={40}>BAD NEWS</Pill></div></Card></Scene>
    <Scene s={C.s11} e={C.s11b} z={13}><Bg id="g-free" tone="#0f3a26" />
      <Card box={box} url="openai.com/business/businesses-in-chatgpt" name="r05_landing" vt={mapT(t, [[35.87, 2.7], [37.43, 4.3]])} oy={110} src="openai.com" glow="#2ED47A44">
        <div style={{position: 'absolute', left: 560, top: 420, transform: `scale(${pop(t, 36.52, 0.32)}) rotate(-8deg)`, transformOrigin: '50% 50%'}}>
          <div style={{border: `8px solid ${GREEN}`, color: GREEN, background: '#06210fe0', fontFamily: ui, fontWeight: 900, fontSize: 92, lineHeight: '100px', padding: '8px 34px', borderRadius: 24, letterSpacing: 4}}>FREE</div></div></Card></Scene>
    <Scene s={C.s11b} e={C.s12} z={14} dir="r"><CommentCard /></Scene>
    <Scene s={C.s12} e={C.s13} z={15}><Bg id="g-beta" tone="#3a2f05" />
      <Card box={box} url="help.openai.com/.../setting-up-your-business-on-chatgpt" name="r12_review_persona_help" vt={mapT(t, [[39.43, 1.0], [40.85, 1.55], [41.43, 2.7], [41.71, 3.15], [42.19, 4.0], [42.77, 4.7]])} src="help.openai.com" glow="#FFD60A33">
        <div style={{position: 'absolute', right: 24, top: 20, transform: `scale(${pop(t, 39.81, 0.3)}) rotate(4deg)`, transformOrigin: '100% 50%'}}><Pill size={38}>IN BETA</Pill></div></Card></Scene>
    {/* beats 13-14 (presenter slot B) */}
    {avatar ? <Scene s={C.s13} e={99} z={16}>
      <Avatar src={avatar} top={0} scale={t < 44.01 ? 1 : t < 44.67 ? 1.15 : t < 46.79 ? 1.3 : t < C.s14 ? 1.15 : 1.3} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1100, height: 820, background: 'linear-gradient(transparent,#0b0d12c0 50%)'}} />
      {t < C.s14 && <DmCard x={60} y={1040} w={880} at={46.17} />}
    </Scene> : <>
      <Scene s={C.s13} e={C.s13b} z={16}><RuleCard /></Scene>
      <Scene s={C.s13b} e={C.s14} z={17} dir="l"><FollowCard /></Scene>
      <Scene s={C.s14} e={99} z={18}><EndCard /></Scene>
    </>}
    {split && <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', zIndex: 20, background: '#20242c'}}><Avatar src={avatar!} top={avatarTop} /></div>}
    {split && <div style={{position: 'absolute', left: 0, right: 0, top: 957, height: 6, background: '#050505', zIndex: 21}} />}
    {(!face || t < SLOTS.ending[0]) && <Headline items={items} cy={HY} band={inHook} />}
    {(!face || t < C.gag) && <Banners cy={face ? 965 : 1150} />}
    {t >= C.s12 && t < C.s13 && <PathBar cy={1150} />}
    {t >= C.gag && t < C.s5 && face && <div style={{position: 'absolute', left: 0, right: 0, top: 1300, zIndex: 45, textAlign: 'center', fontFamily: ui, fontWeight: 900, fontSize: 110, color: '#fff', textShadow: '0 6px 30px #000'}}>in Dubai?</div>}
    <div style={{position: 'absolute', left: 60, top: 226, zIndex: 46, background: '#0a0f1ed0', color: '#e6ecfb', fontFamily: ui, fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <Captions words={words} top={inHook ? 990 : inEnd ? 1290 : 1386} hideEnd={!face} />
  </AbsoluteFill>;
};
