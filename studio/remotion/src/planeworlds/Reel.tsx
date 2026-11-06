import React from 'react';
import {AbsoluteFill, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';
import {WORLDS, W, H, ramp, ease, type WorldKey} from './worlds';
import {Plane} from './plane';

// "10 Claude animation styles" reel (job 990543b928c4), rebuilt from @anylancer's paper-plane reel in the same order:
// white title card with a 1-10 list and a phone -> push into the phone -> ten worlds, each with its own title type,
// n/10 progress and a caption pill -> "the best part" back on the title card (no editor / no After Effects, pick a style,
// paste a script, Claude builds it) -> comment-keyword ending -> site plug -> "which world first?" grid.
// Polish over the reference: every world is real code (this file + worlds.tsx), the plane stays one continuous object
// through whip transitions, the chalk forces are labelled correctly, names spelled right (Zack D. Films, Dan Koe),
// larger caption type held for the whole phrase, WITHHAMMAD branding only. Timing: data.json (build-reel.py).
const ff = (family: string, file: string, weight = '400', style = 'normal') => loadFont({family, url: staticFile('fonts/' + file), weight, style});
ff('PwInter', 'inter-latin-500-normal.woff2', '500'); ff('PwInter', 'inter-latin-700-normal.woff2', '700');
ff('PwInter', 'inter-latin-800-normal.woff2', '800'); ff('PwInter', 'inter-latin-900-normal.woff2', '900');
ff('PwSerif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic');
ff('PwPixel', 'press-start-2p-latin-400-normal.woff2'); ff('PwChalk', 'schoolbell-latin-400-normal.woff2');
ff('PwComic', 'bangers-latin-400-normal.woff2'); ff('PwRusso', 'russo-one-latin-400-normal.woff2');
ff('PwSoft', 'fredoka-latin-700-normal.woff2', '700'); ff('PwTitan', 'titan-one-latin-400-normal.woff2');
ff('PwMono', 'jetbrains-mono-latin-500-normal.woff2', '500');

const D: any = data;
const FPS = 30;
const SANS = 'PwInter, Arial, sans-serif', MONO = 'PwMono, Menlo, monospace';
const INK = '#0E1220', CLAY = '#D97757', BLUE = '#2F6BFF', GREEN = '#22C55E', RED = '#EF4444';
const pop = (f: number, at: number, d = 14) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: d, stiffness: 190}}));
const fadeIn = (f: number, at: number, n = 6) => ({opacity: ramp(f, at, at + n), filter: `blur(${(1 - ease(ramp(f, at, at + n))) * 8}px)`});

// ------------------------------------------------------------------------------------------- world headers (per style)
const HEAD: Record<WorldKey, React.CSSProperties> = {
  pixel: {fontFamily: 'PwPixel', fontSize: 72, textTransform: 'uppercase', color: '#FFE14D', textShadow: '6px 6px 0 #1B2A4A, -3px -3px 0 #1B2A4A, 3px -3px 0 #1B2A4A, -3px 3px 0 #1B2A4A'},
  chalk: {fontFamily: 'PwChalk', fontSize: 104, color: '#F4F1E8', textShadow: '0 0 2px rgba(255,255,255,.6)'},
  glow: {fontFamily: SANS, fontWeight: 500, fontSize: 84, color: '#FFD27A', letterSpacing: 2, textShadow: '0 0 18px rgba(242,182,64,.85), 0 0 40px rgba(242,182,64,.45)'},
  ps2: {fontFamily: 'PwRusso', fontSize: 100, fontStyle: 'italic', color: '#EDEBFF', letterSpacing: 1, textShadow: '0 4px 0 #6C66B0, 0 10px 24px rgba(20,10,60,.5)'},
  comic: {fontFamily: 'PwComic', fontSize: 140, textTransform: 'uppercase', color: '#FFD60A', letterSpacing: 3, WebkitTextStroke: '5px #111', textShadow: '7px 7px 0 #E63946', transform: 'rotate(-3deg)'},
  flat: {fontFamily: SANS, fontWeight: 800, fontSize: 70, color: '#fff', background: '#F25F5C', padding: '10px 34px', borderRadius: 999},
  koe: {fontFamily: SANS, fontWeight: 500, fontSize: 64, color: '#fff', letterSpacing: 1, textTransform: 'lowercase'},
  cgi: {fontFamily: SANS, fontWeight: 700, fontSize: 70, color: '#fff', letterSpacing: 18, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(10,30,70,.35)'},
  lego: {fontFamily: 'PwTitan', fontSize: 84, color: '#fff', background: '#D0312D', padding: '14px 34px 8px', borderRadius: 10, boxShadow: 'inset 0 -10px 0 rgba(0,0,0,.2), 0 10px 0 #9B1F1C'},
  zack: {fontFamily: 'PwSoft', fontWeight: 700, fontSize: 104, color: '#fff', textShadow: '0 6px 0 #9DB0C4, 0 14px 22px rgba(20,50,90,.35)'},
};
const Header: React.FC<{i: number; t: number}> = ({i, t}) => {
  const w = WORLDS[i], p = pop(t, 2);
  return <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
    <div style={{...HEAD[w.key], transform: `${HEAD[w.key].transform ?? ''} scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.5), whiteSpace: 'nowrap'}}>
      {w.key === 'koe' ? '· ' : ''}{w.name}</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(10,14,30,.42)', padding: '8px 20px', borderRadius: 999, opacity: ramp(t, 4, 10)}}>
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff'}}>{i + 1}/10</span>
      {Array.from({length: 10}, (_, k) => <span key={k} style={{width: 10, height: 10, borderRadius: 9, background: k <= i ? '#FFB547' : 'rgba(255,255,255,.35)', transform: `scale(${k === i ? 1 + 0.5 * pop(t, 6) - 0.5 * ramp(t, 12, 18) : 1})`}}/>)}
    </div>
  </div>;
};

// A world at full 1080x1920: background, optional header, optional plane (used full screen, in the phone and in the grid).
const PLANE_X = 410, PLANE_Y = 920;
const planePose = (key: WorldKey, t: number, cue: number) => {
  let x = PLANE_X + Math.sin(t / 26) * 18, y = PLANE_Y + Math.sin(t / 14) * 14, r = Math.sin(t / 20) * 3, s = 1.3;
  if (key === 'zack' && cue > 0) {const k = ease(ramp(cue, 10, 34)); x += k * 260; y += k * 120; r += k * 14; s = 1.3 - 0.35 * k;}
  return {x, y, r, s};
};
export const WorldView: React.FC<{i: number; t: number; cue?: number; header?: boolean; plane?: boolean}> = ({i, t, cue = -999, header = true, plane = true}) => {
  const w = WORLDS[i], C = w.C, p = planePose(w.key, t, cue);
  return <AbsoluteFill style={{width: W, height: H, overflow: 'hidden'}}>
    <C t={t} cue={cue}/>
    {plane && <div style={{position: 'absolute', left: p.x, top: p.y, transform: `rotate(${p.r}deg) scale(${p.s})`}}><Plane style={w.key} t={t}/></div>}
    {header && <Header i={i} t={t}/>}
  </AbsoluteFill>;
};
const Scaled: React.FC<{s: number; x: number; y: number; children: React.ReactNode; radius?: number; shadow?: boolean}> = ({s, x, y, children, radius = 0, shadow}) =>
  <div style={{position: 'absolute', left: x, top: y, width: W * s, height: H * s, overflow: 'hidden', borderRadius: radius,
    boxShadow: shadow ? '0 30px 70px rgba(14,18,32,.28), 0 0 0 10px #10131C' : undefined}}>
    <div style={{width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0', position: 'relative'}}>{children}</div></div>;

// ------------------------------------------------------------------------------------------- white title card
const Canvas: React.FC = () => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #FFFFFF 0%, #EEF1F6 70%, #E4E8F0 100%)'}}>
  <svg width={W} height={H} style={{position: 'absolute'}}><defs><pattern id="dotg" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#C9D0DC"/></pattern></defs><rect width={W} height={H} fill="url(#dotg)" opacity={0.6}/></svg>
</AbsoluteFill>;
// The Claude mark inlined (simple-icons path) so it is drawn on frame 0, not after a CSS mask image loads.
const CLAUDE_D = 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z';
const ClaudeMark: React.FC<{size: number; color?: string}> = ({size, color = CLAY}) =>
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'inline-block'}}><path d={CLAUDE_D} fill={color}/></svg>;
const Title: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at);
  return <div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', transform: `translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.4)}}>
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 132, color: INK, letterSpacing: -6}}>10</span>
      <span style={{fontFamily: 'PwSerif', fontStyle: 'italic', fontSize: 138, color: CLAY, letterSpacing: -2}}>Claude</span>
      <ClaudeMark size={84}/></div>
    <div style={{marginTop: -18}}><span style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'italic', fontSize: 92, color: INK, letterSpacing: -3}}>Animation</span>
      <span style={{fontFamily: SANS, fontWeight: 500, fontSize: 92, color: INK, letterSpacing: -3}}> styles</span></div>
    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: '#4A5068', marginTop: 4}}>(To Go <span style={{borderBottom: `5px solid ${CLAY}`}}>Viral</span>)</div>
  </div>;
};
const LIST_Y = 640;
const List: React.FC<{f: number; fill: number; checks?: number; pick?: number; fade?: number}> = ({f, fill, checks = -1, pick = -1, fade = 1}) =>
  <div style={{position: 'absolute', left: 70, top: LIST_Y, opacity: fade}}>
    {WORLDS.map((w, k) => {
      const shown = ramp(f, fill + k * 3, fill + k * 3 + 6), ck = checks >= 0 ? pop(f, checks + k * 2) : 0, picked = pick >= 0 && k === 4 ? ramp(f, pick, pick + 6) : 0;
      return <div key={w.key} style={{display: 'flex', alignItems: 'center', gap: 14, height: 72, fontFamily: SANS, fontSize: 38, color: INK,
        background: picked ? `rgba(217,119,87,${0.16 * picked})` : 'transparent', borderRadius: 14, padding: '0 14px', marginLeft: -14, width: 410}}>
        {ck > 0 ? <span style={{width: 34, height: 34, borderRadius: 20, background: GREEN, color: '#fff', fontWeight: 900, fontSize: 24, display: 'grid', placeItems: 'center', transform: `scale(${ck})`}}>✓</span>
          : <span style={{width: 34, fontWeight: 800, color: '#8A90A6'}}>{k + 1})</span>}
        <span style={{fontWeight: 700, opacity: shown, transform: `translateX(${(1 - shown) * -16}px)`}}>{w.name}</span>
      </div>;
    })}
  </div>;
const PHONE = {s: 0.42, x: 560, y: 572};
const Phone: React.FC<{children: React.ReactNode; k?: number}> = ({children, k = 0}) => {
  // k: 0 = phone on the title card, 1 = full screen (the push into the world)
  const e = ease(k), s = PHONE.s + (1 - PHONE.s) * e, x = PHONE.x * (1 - e), y = PHONE.y * (1 - e);
  return <Scaled s={s} x={x} y={y} radius={46 * (1 - e)} shadow={k < 1}>{children}</Scaled>;
};

// ------------------------------------------------------------------------------------------- captions
const ACCENT = new Set(['claude', 'viral', 'ten', 'different', 'every', '16-bit', 'itself', 'gold', '2003', 'whoosh', 'brands', 'deep', 'light', 'reflections',
  'brick', '3d', 'explainer', 'editor', 'effects', 'style', 'script', 'code', 'plane', 'free', 'guide', 'withhammad.com', 'first', 'renders', 'mood', 'game']);
const Captions: React.FC<{f: number; dark?: boolean}> = ({f, dark}) => {
  const c = D.caps.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const p = pop(f, c.from, 16);
  return <div style={{position: 'absolute', left: 60, right: 60, top: 1388, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: dark ? 'rgba(14,18,32,.9)' : '#FFFFFF', borderRadius: 26, padding: '16px 30px', boxShadow: '0 14px 40px rgba(0,0,0,.25)',
      transform: `scale(${0.88 + 0.12 * p})`, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900}}>
      {c.words.map((w: any, i: number) => {
        // karaoke like the reference: spoken = ink, the word being said = accent, upcoming = light grey; key words stay accent
        const raw = w.w.replace(/[,.?!]$/, ''), on = f >= w.f, next = c.words[i + 1]?.f ?? c.to, active = on && f < next, acc = ACCENT.has(raw.toLowerCase());
        return <span key={i} style={{fontFamily: SANS, fontWeight: 900, fontSize: 58, letterSpacing: -1.5, lineHeight: 1.1,
          color: !on ? (dark ? 'rgba(255,255,255,.34)' : '#B9BFCC') : active || acc ? CLAY : dark ? '#fff' : INK}}>{raw}</span>;
      })}
    </div></div>;
};

// ------------------------------------------------------------------------------------------- the best part
const Strike: React.FC<{f: number; at: number; text: string; y: number}> = ({f, at, text, y}) => {
  const p = pop(f, at), s = ease(ramp(f, at + 8, at + 16));
  return <div style={{position: 'absolute', left: 60, top: y, transform: `scale(${p})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff', borderRadius: 22, padding: '18px 26px', boxShadow: '0 14px 34px rgba(14,18,32,.14)'}}>
    <span style={{width: 40, height: 40, borderRadius: 22, background: RED, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 26}}>✕</span>
    <span style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 42, color: INK}}>{text}
      <span style={{position: 'absolute', left: -4, top: '52%', height: 6, width: `${s * 104}%`, background: RED, borderRadius: 4}}/></span>
  </div>;
};
const PROMPT = "a paper plane flies through ten worlds, then lands in a kid's hand.";
const ClaudeCard: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at), n = Math.floor(ramp(f, at + 10, at + 42) * PROMPT.length);
  return <div style={{position: 'absolute', left: 50, top: 700, width: 470, transform: `scale(${p})`, transformOrigin: 'left top', background: '#fff', borderRadius: 30,
    padding: '26px 28px', boxShadow: '0 24px 60px rgba(14,18,32,.18)', fontFamily: SANS}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}><ClaudeMark size={34}/><span style={{fontWeight: 800, fontSize: 30, color: INK}}>Claude Code</span></div>
    <div style={{display: 'inline-block', marginTop: 18, background: '#FCEEE8', color: CLAY, fontFamily: MONO, fontSize: 30, padding: '6px 14px', borderRadius: 10}}>/comic-art</div>
    <div style={{marginTop: 16, fontSize: 30, lineHeight: 1.35, color: INK}}><b>Script:</b> {PROMPT.slice(0, n)}<span style={{opacity: f % 16 < 8 ? 1 : 0}}>▍</span></div>
  </div>;
};
const CODE = [
  ['k', 'export const '], ['f', 'Comic'], ['p', ' = ({t, cue}) => {'],
  ['n', ''], ['p', '  const s = t * 3;'], ['n', ''], ['c', '  // halftone dots, ink outlines, a big WHOOSH'], ['n', ''],
  ['p', '  <'], ['k', 'pattern'], ['p', ' id="half" …>'], ['n', ''], ['p', '  {blds.map(b => <'], ['k', 'rect'], ['p', ' stroke="#111" …/>)}'], ['n', ''],
  ['p', '  {boom > 0 && <'], ['k', 'text'], ['p', '>WHOOSH!</'], ['k', 'text'], ['p', '>}'],
] as const;
const CodeCard: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at);
  const col: Record<string, string> = {k: '#FF8FAB', f: '#7CC4FF', p: '#E6E9F2', c: '#7E8AA8'};
  const lines: React.ReactNode[][] = [[]];
  CODE.forEach(([k, s], i) => (k === 'n' ? lines.push([]) : lines[lines.length - 1].push(<span key={i} style={{color: col[k]}}>{s}</span>)));
  return <div style={{position: 'absolute', left: 50, right: 50, top: 980, transform: `translateY(${(1 - p) * 80}px)`, opacity: Math.min(1, p * 1.5), background: '#0F1424',
    borderRadius: 28, padding: '22px 30px 26px', boxShadow: '0 30px 70px rgba(14,18,32,.35)'}}>
    <div style={{display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center'}}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 16, height: 16, borderRadius: 9, background: c}}/>)}
      <span style={{fontFamily: MONO, fontSize: 24, color: '#7E8AA8', marginLeft: 14}}>planeworlds/worlds.tsx · the real file behind this video</span></div>
    {lines.map((l, i) => <div key={i} style={{fontFamily: MONO, fontSize: 28, lineHeight: 1.45, whiteSpace: 'pre', opacity: ramp(f, at + 4 + i * 2, at + 8 + i * 2)}}>{l}</div>)}
  </div>;
};

// ------------------------------------------------------------------------------------------- CTA, plug, end grid
const CommentCard: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at), word = 'PLANE', n = Math.floor(ramp(f, at + 6, at + 20) * word.length), heart = pop(f, at + 24, 9);
  return <div style={{position: 'absolute', left: 90, right: 90, top: 520, transform: `scale(${p})`, background: '#fff', borderRadius: 30, padding: '26px 30px',
    boxShadow: '0 24px 60px rgba(14,18,32,.16)', display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS}}>
    <div style={{width: 74, height: 74, borderRadius: 40, background: 'linear-gradient(135deg, #FFB36B, #F5743B)'}}/>
    <div style={{flex: 1}}><div style={{fontSize: 26, color: '#8A90A6', fontWeight: 700}}>@you · just now</div>
      <div style={{fontSize: 60, fontWeight: 900, color: CLAY, letterSpacing: 1}}>{word.slice(0, n)}<span style={{color: INK, opacity: n < 5 && f % 14 < 7 ? 1 : 0}}>|</span></div></div>
    <div style={{fontSize: 54, color: RED, transform: `scale(${heart})`}}>♥</div>
  </div>;
};
const DmCard: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at);
  return <div style={{position: 'absolute', left: 90, right: 90, top: 740, transform: `translateY(${(1 - p) * 40}px)`, opacity: Math.min(1, p * 1.5), background: '#fff', borderRadius: 30,
    padding: '24px 30px', boxShadow: '0 24px 60px rgba(14,18,32,.16)', display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS}}>
    <div style={{width: 74, height: 74, borderRadius: 40, background: 'linear-gradient(160deg, #1B2B5E, #0A1230)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 34}}>W</div>
    <div><div style={{fontSize: 28, fontWeight: 800, color: INK}}>withhammad <span style={{color: '#8A90A6', fontWeight: 600}}>· DM</span></div>
      <div style={{fontSize: 34, fontWeight: 700, color: INK}}>Sent! Your free style pack 📦</div></div>
  </div>;
};
const PackCards: React.FC<{f: number; at: number; guide: number}> = ({f, at, guide}) => {
  const p = pop(f, at), g = pop(f, guide);
  const rows = ['SKILL.md', 'styles/ · 10 looks', 'examples/ · Remotion code', 'render + export steps'];
  return <>
    <div style={{position: 'absolute', left: 90, top: 960, width: 520, transform: `rotate(-3deg) scale(${p})`, background: '#fff', borderRadius: 26, padding: '26px 30px',
      boxShadow: '0 24px 60px rgba(14,18,32,.18)', fontFamily: SANS}}>
      <div style={{fontSize: 34, fontWeight: 900, color: INK}}>📁 claude-animation-styles</div>
      {rows.map((r, i) => <div key={r} style={{fontFamily: MONO, fontSize: 28, color: '#4A5068', marginTop: 12, opacity: ramp(f, at + 6 + i * 4, at + 10 + i * 4)}}>{r}</div>)}
    </div>
    <div style={{position: 'absolute', left: 590, top: 990, width: 320, height: 370, transform: `rotate(4deg) scale(${g})`, background: '#fff', borderRadius: 22,
      boxShadow: '0 24px 60px rgba(14,18,32,.2)', fontFamily: SANS, padding: 24, overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: 16, top: 16, background: RED, color: '#fff', fontWeight: 900, fontSize: 22, padding: '4px 10px', borderRadius: 8}}>PDF</div>
      <div style={{fontWeight: 900, fontSize: 30, color: INK, marginTop: 40}}>Step-by-step guide</div>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{height: 12, borderRadius: 6, background: '#E4E8F0', marginTop: 18, width: `${90 - (i % 3) * 18}%`}}/>)}
    </div>
  </>;
};
const Plug: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = pop(f, at), u = pop(f, at + 10);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1B2B5E 0%, #0A1230 70%)', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 100, letterSpacing: 14, color: '#fff', transform: `scale(${0.8 + 0.2 * p})`, opacity: p, marginTop: -200}}>WITHHAMMAD</div>
    <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, color: '#AFC2F0', marginTop: 34, opacity: ramp(f, at + 6, at + 12)}}>More builds like this</div>
    <div style={{marginTop: 40, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 60, padding: '20px 48px', borderRadius: 999,
      transform: `scale(${u})`, boxShadow: '0 0 60px rgba(47,107,255,.6)'}}>withhammad.com</div>
  </AbsoluteFill>;
};
const EndGrid: React.FC<{f: number; at: number}> = ({f, at}) => {
  const s = 0.146, tw = W * s, th = H * s, gx = 18, x0 = (W - (5 * tw + 4 * gx)) / 2;
  return <>
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 82, lineHeight: 1.05, color: INK, letterSpacing: -3, ...fadeIn(f, at)}}>
      Which world are you<br/>flying to <span style={{color: CLAY}}>first?</span></div>
    {WORLDS.map((w, k) => {
      const r = Math.floor(k / 5), c = k % 5, p = pop(f, at + 4 + k * 2);
      return <div key={w.key} style={{position: 'absolute', left: x0 + c * (tw + gx), top: 560 + r * (th + 90), transform: `scale(${p})`}}>
        <Scaled s={s} x={0} y={0} radius={20}><WorldView i={k} t={f - at + 40} cue={w.key === 'zack' ? 60 : 40} header={false}/></Scaled>
        <div style={{position: 'absolute', left: -10, top: -12, width: 46, height: 46, borderRadius: 26, background: INK, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 24, border: '3px solid #fff'}}>{k + 1}</div>
        <div style={{width: tw, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 22, color: '#4A5068', marginTop: 10, whiteSpace: 'nowrap'}}>{w.name}</div>
      </div>;
    })}
    <div style={{position: 'absolute', top: 1340, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, at + 26)})`}}>
      <div style={{background: INK, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 46, padding: '18px 40px', borderRadius: 999}}>Comment your number ↓</div></div>
    <div style={{position: 'absolute', top: 1470, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 9, color: '#4A5068', opacity: ramp(f, at + 30, at + 38)}}>WITHHAMMAD</div>
  </>;
};

// ------------------------------------------------------------------------------------------- main
const worldAt = (f: number) => D.worlds.reduce((a: number, w: any, i: number) => (f >= w.from ? i : a), 0);
const WHIP = 8;
export const Reel: React.FC = () => {
  const f = useCurrentFrame(), U = D.units, B = D.beats;
  const inU = (k: string) => f >= U[k][0] && f < U[k][1];
  let body: React.ReactNode = null, darkCaps = false, caps = true;

  if (inU('intro')) {
    // the phone cycles through the worlds while the list fills, then pushes into Pixel Art
    const cyc = f < B.listFill ? 0 : f < B.follow ? Math.min(9, Math.floor((f - B.listFill) / ((B.follow - B.listFill) / 10))) : 0;
    const push = ease(ramp(f, U.intro[1] - 14, U.intro[1]));
    body = <><Canvas/><div style={{opacity: 1 - push}}><Title f={f} at={-30}/><List f={f} fill={B.listFill}/></div>
      <Phone k={push}><WorldView i={cyc} t={f} cue={60} header={push > 0.6}/></Phone></>;
  } else if (inU('worlds')) {
    const i = worldAt(f), w = D.worlds[i], t = f - w.from, cue = f - w.cue;
    const prev = i > 0 && t < WHIP ? i - 1 : -1, k = ease(t / WHIP);
    const out = ease(ramp(f, U.worlds[1] - 14, U.worlds[1])); // the last world pulls back into the phone
    const p = planePose(WORLDS[i].key, t, cue);
    const scene = <>
      {prev >= 0 && <div style={{position: 'absolute', inset: 0, transform: `translateX(${-k * W}px)`, filter: `blur(${Math.sin(k * Math.PI) * 14}px)`}}>
        <WorldView i={prev} t={f - D.worlds[prev].from} cue={f - D.worlds[prev].cue} plane={false}/></div>}
      <div style={{position: 'absolute', inset: 0, transform: prev >= 0 ? `translateX(${(1 - k) * W}px)` : undefined, filter: prev >= 0 ? `blur(${Math.sin(k * Math.PI) * 14}px)` : undefined}}>
        <WorldView i={i} t={t} cue={cue} plane={false}/></div>
      {/* one continuous plane on top; it restyles mid-whip with a small pop */}
      <div style={{position: 'absolute', left: p.x, top: p.y, transform: `rotate(${p.r}deg) scale(${p.s * (1 + (prev >= 0 ? 0.12 * Math.sin(k * Math.PI) : 0))})`}}>
        <Plane style={(prev >= 0 && k < 0.5 ? WORLDS[prev] : WORLDS[i]).key} t={t}/></div>
    </>;
    body = out > 0 ? <><Canvas/><Title f={f} at={U.worlds[1] - 14}/><Phone k={1 - out}>{scene}</Phone></> : scene;
    darkCaps = WORLDS[i].key === 'koe' || WORLDS[i].key === 'glow';
  } else if (inU('best')) {
    const at = U.best[0];
    const listFade = 1 - ramp(f, B.noEditor - 6, B.noEditor) + ramp(f, B.pick - 6, B.pick) - ramp(f, B.paste - 4, B.paste);
    const building = f >= B.claudeWrites;
    const bk = ramp(f, B.claudeWrites, B.claudeWrites + 40);
    const phoneWorld = building ? 4 : f >= B.pick ? 4 : 9;
    body = <><Canvas/><Title f={f} at={at - 30}/>
      <List f={f} fill={-100} checks={at} pick={B.pick} fade={Math.max(0, Math.min(1, listFade))}/>
      {f < B.pick && <><Strike f={f} at={B.noEditor} text="Video editor" y={760}/><Strike f={f} at={B.noAE} text="After Effects" y={900}/></>}
      {f >= B.paste && f < B.everyCode + 4 && <ClaudeCard f={f} at={B.paste}/>}
      <div style={{opacity: f >= B.everyCode ? 1 - ramp(f, B.everyCode, B.everyCode + 6) * 0.0 : 1}}>
        <Phone><div style={{opacity: building ? 0.25 + 0.75 * bk : 1}}><WorldView i={phoneWorld} t={f - at + 60} cue={building ? f - B.claudeWrites - 10 : 60}/></div>
          {building && bk < 1 && <div style={{position: 'absolute', left: 140, right: 140, top: 1500, height: 70, borderRadius: 40, background: 'rgba(14,18,32,.82)', overflow: 'hidden'}}>
            <div style={{width: `${bk * 100}%`, height: '100%', background: CLAY}}/>
            <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff'}}>Rendering… {Math.round(bk * 100)}%</div></div>}
        </Phone></div>
      {f >= B.everyCode && <CodeCard f={f} at={B.everyCode}/>}
    </>;
  } else if (inU('cta')) {
    const at = U.cta[0];
    body = <><Canvas/>
      <div style={{position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.05, letterSpacing: -3, color: INK, ...fadeIn(f, at - 4)}}>
        Want all <span style={{color: CLAY}}>10 styles?</span></div>
      <CommentCard f={f} at={at}/><DmCard f={f} at={B.dm}/><PackCards f={f} at={B.pack} guide={B.guide - 6}/>
      {/* the plane carries the DM in */}
      {(() => {const k = ease(ramp(f, B.dm - 14, B.dm + 2)); return k < 1 ? <div style={{position: 'absolute', left: 1100 - k * 900, top: 640 + Math.sin(k * Math.PI) * -120, transform: 'scale(.6) rotate(-170deg) scaleY(-1)'}}><Plane style="flat" t={f}/></div> : null;})()}
    </>;
  } else if (inU('plug')) {
    body = <Plug f={f} at={U.plug[0]}/>; darkCaps = true;
  } else {
    body = <><Canvas/><EndGrid f={f} at={U.end[0]}/></>; caps = false;
  }

  return <AbsoluteFill style={{background: '#000'}}>
    {body}
    {caps && <Captions f={f} dark={darkCaps}/>}
    {D.standin && <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(200,30,30,.88)', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 3, padding: '8px 20px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div></div>}
    <Audio src={staticFile(D.audio)}/>
  </AbsoluteFill>;
};
