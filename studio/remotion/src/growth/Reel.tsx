import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// "Claude just killed Instagram" reel (job 0f869c3f2de7), rebuilt from @nateherkai's reel in the same order:
// split screen (graphic on top, face below) and full-screen app mocks, hard cuts every ~1.6 s, ALL-CAPS boxed captions
// with a green second line, full-face punch-ins on the turn and the CTA, comment-keyword ending.
// Polish over the reference: the real tool (Jakeschincariol/instagram-agent-skill, MIT) instead of an unrelated repo,
// correct numbers (13 skills, 26 scored hook formulas), "drafts" replies (it does not post), our own covers on the wall.
const ff = (family: string, file: string, weight = '400', style = 'normal') => loadFont({family, url: staticFile('fonts/' + file), weight, style});
ff('GwInter', 'inter-latin-600-normal.woff2', '600'); ff('GwInter', 'inter-latin-800-normal.woff2', '800'); ff('GwInter', 'inter-latin-900-normal.woff2', '900');
ff('GwSerif', 'instrument-serif-latin-400-italic.woff2', '400', 'italic'); ff('GwMono', 'jetbrains-mono-latin-500-normal.woff2', '500');

const D: any = data;
const FPS = 30, W = 1080, H = 1920, SEAM = 900;
const SANS = 'GwInter, Arial, sans-serif', MONO = 'GwMono, Menlo, monospace';
const INK = '#0E1220', GREEN = '#3DDC97', RED = '#E53935', CLAY = '#D97757', IG = 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number, d = 13) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: d, stiffness: 200}}));
const file = (s: string) => staticFile('growth/' + s);
const mark = (name: string, size: number, color: string) => <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${staticFile('glow/si-' + name + '.svg')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}}/>;

// The revision can use its own take and voice files, preserving previous exports and source assets.
const Face: React.FC<{mode: 'split' | 'full'; f: number; at: number; zoom?: number}> = ({mode, f, at, zoom = 1}) => {
  const punch = mode === 'full' ? 1.06 + 0.06 * ease(ramp(f, at, at + 6)) : 1;
  const style: React.CSSProperties = mode === 'split'
    ? {position: 'absolute', left: 0, top: SEAM - 40, width: W, height: H - SEAM + 40, overflow: 'hidden'}
    : {position: 'absolute', inset: 0, overflow: 'hidden'};
  return <div style={style}><div style={{position: 'absolute', left: 0, top: mode === 'split' ? -330 : 0, width: W, height: H, transform: `scale(${punch * zoom})`, transformOrigin: '50% 33%'}}>
    <OffthreadVideo src={D.takeFile ? staticFile(D.takeFile) : file('take.mp4')} muted style={{width: W, height: H, objectFit: 'cover'}}/></div></div>;
};
const Top: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#F2F3F5'}) =>
  <div style={{position: 'absolute', left: 0, top: 0, width: W, height: SEAM, overflow: 'hidden', background: bg}}>{children}</div>;
const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <div style={{background: '#fff', borderRadius: 28, boxShadow: '0 18px 50px rgba(14,18,32,.14)', fontFamily: SANS, color: INK, ...style}}>{children}</div>;
const Avatar: React.FC<{s?: number}> = ({s = 56}) => <div style={{width: s, height: s, borderRadius: s, background: 'linear-gradient(160deg,#1B2B5E,#0A1230)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 900, fontSize: s * 0.42, flex: 'none'}}>W</div>;

// ------------------------------------------------------------------ scenes
const Fight: React.FC<{t: number}> = ({t}) => {
  if (D.blenderHook) return <Top bg="#0B1220"><OffthreadVideo src={staticFile(D.blenderHook)} muted
    style={{position: 'absolute', width: 1512, height: 2688, left: -216, top: -800, objectFit: 'cover'}}/></Top>;
  // Claude cube vs Instagram cube in a ring, the Claude one lands the punch on "killed"
  const hit = ease(ramp(t, 24, 30)), shake = t > 28 && t < 40 ? Math.sin(t * 2.4) * 8 : 0, push = 1 + 0.08 * ramp(t, 0, 60);
  const cube = (bg: string, inner: React.ReactNode, x: number, rot: number, sc: number) =>
    <div style={{position: 'absolute', left: x, top: 230, width: 300, height: 300, borderRadius: 64, background: bg, transform: `rotate(${rot}deg) scale(${sc})`,
      boxShadow: '0 30px 80px rgba(0,0,0,.45), inset 0 -18px 0 rgba(0,0,0,.18), inset 0 10px 0 rgba(255,255,255,.25)', display: 'grid', placeItems: 'center'}}>{inner}</div>;
  return <Top bg="radial-gradient(ellipse at 50% 30%, #3A2A5E 0%, #120C24 75%)">
    <div style={{position: 'absolute', inset: 0, transform: `scale(${push}) translateX(${shake}px)`}}>
      {/* ring ropes + crowd lights */}
      {[560, 620, 680].map((y) => <div key={y} style={{position: 'absolute', left: -20, right: -20, top: y, height: 10, borderRadius: 6, background: 'linear-gradient(90deg,#E53935,#fff,#1D6FD8)', opacity: 0.85}}/>)}
      {Array.from({length: 26}, (_, i) => <div key={i} style={{position: 'absolute', left: (i * 97) % 1080, top: 40 + ((i * 53) % 160), width: 10, height: 10, borderRadius: 9, background: '#fff', opacity: 0.25 + 0.25 * Math.sin((t + i * 5) / 6)}}/>)}
      {cube(`linear-gradient(160deg, #E8875F, ${CLAY})`, mark('claude', 170, '#fff'), 150 + hit * 120, -8 + hit * 14, 1)}
      {cube(IG, mark('instagram', 160, '#fff'), 630 + hit * 60, 8 + hit * 22, 1 - 0.12 * hit)}
      {hit > 0.6 && <div style={{position: 'absolute', left: 520, top: 300, width: 200, height: 200, transform: `scale(${pop(t, 28, 9)})`}}>
        <svg width={200} height={200} viewBox="-100 -100 200 200">{Array.from({length: 12}, (_, i) => {const a = (i / 12) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 95} y2={Math.sin(a) * 95} stroke="#FFD60A" strokeWidth={10} strokeLinecap="round"/>;})}</svg></div>}
    </div></Top>;
};
const Repo: React.FC<{t: number; src: string; full?: boolean}> = ({t, src, full}) => {
  const icon = pop(t, 4);
  const box = full ? {top: 0, height: H} : {top: 0, height: SEAM};
  return <div style={{position: 'absolute', left: 0, width: W, overflow: 'hidden', background: '#0D1117', ...box}}>
    <div style={{position: 'absolute', left: 0, top: full ? 280 : -60, width: W, transform: `scale(${1 + 0.04 * ramp(t, 0, 60)})`, transformOrigin: '50% 0'}}>
      <OffthreadVideo src={file(src)} muted style={{width: W, height: 1350}}/></div>
    <div style={{position: 'absolute', left: W / 2 - 90, top: full ? 140 : 110, width: 180, height: 180, borderRadius: 40, background: '#fff', transform: `scale(${icon})`,
      boxShadow: '0 20px 60px rgba(0,0,0,.5)', display: 'grid', placeItems: 'center'}}>{mark('instagram', 110, '#D62976')}</div>
  </div>;
};
const SKILLS = ['ig-reel', 'ig-viral', 'ig-caption', 'ig-carousel', 'ig-story', 'ig-profile', 'ig-plan', 'ig-human', 'ig-comment', 'ig-reply', 'ig-dm', 'ig-repurpose', 'ig-audit'];
const Skills: React.FC<{t: number}> = ({t}) =>
  <AbsoluteFill style={{background: '#F5F6F8'}}>
    <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 92, color: INK, letterSpacing: -3, transform: `scale(${pop(t, 2)})`}}>
      13 <span style={{color: CLAY}}>different</span> skills</div>
    <div style={{position: 'absolute', top: 410, left: 50, right: 50, display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center'}}>
      {SKILLS.map((s, i) => {const p = pop(t, 6 + i * 1.5); return <div key={s} style={{transform: `scale(${p})`, width: 310, height: 110, borderRadius: 24, background: '#fff', whiteSpace: 'nowrap',
        boxShadow: '0 10px 30px rgba(14,18,32,.10)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px', fontFamily: MONO, fontSize: 27, color: INK}}>
        <div style={{width: 54, height: 54, borderRadius: 14, background: IG, display: 'grid', placeItems: 'center', flex: 'none'}}>{mark('instagram', 32, '#fff')}</div>/{s}</div>;})}
    </div></AbsoluteFill>;
const Wall: React.FC<{t: number}> = ({t}) => {
  const drift = t * 1.2;
  return <Top bg="#0B0F1C">
    <div style={{position: 'absolute', left: -40, top: -60 - drift, display: 'grid', gridTemplateColumns: 'repeat(4, 290px)', gap: 12, transform: 'rotate(-6deg)'}}>
      {Array.from({length: 16}, (_, i) => <Img key={i} src={file(`wall/c${(i % 9) + 1}.jpg`)} style={{width: 290, height: 515, objectFit: 'cover', borderRadius: 16, opacity: 0.85}}/>)}</div>
    <div style={{position: 'absolute', left: W / 2 - 130, top: 300, width: 260, height: 260, borderRadius: 64, background: IG, display: 'grid', placeItems: 'center',
      transform: `scale(${pop(t, 3, 10)})`, boxShadow: '0 30px 80px rgba(0,0,0,.6)'}}>{mark('instagram', 160, '#fff')}</div>
  </Top>;
};
const POST = 'Most people do not have a content problem. They have a hook problem. Here is how I fix yours.';
const Composer: React.FC<{t: number}> = ({t}) => {
  const n = Math.floor(ramp(t, 6, 50) * POST.length);
  return <AbsoluteFill style={{background: '#EEF0F3'}}>
    <Card style={{position: 'absolute', left: 90, right: 90, top: 330, padding: 36}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 36}}><span>New reel</span><span style={{color: '#8A90A6'}}>✕</span></div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 26}}><Avatar/><div><div style={{fontWeight: 800, fontSize: 30}}>withhammad.ai</div><div style={{fontSize: 24, color: '#8A90A6'}}>Hook from /ig-reel</div></div>
        <div style={{marginLeft: 'auto', background: 'linear-gradient(90deg,#FA7E1E,#D62976)', color: '#fff', fontWeight: 800, fontSize: 24, padding: '8px 16px', borderRadius: 30, transform: `scale(${pop(t, 22)})`}}>26 hook formulas</div></div>
      <div style={{marginTop: 30, fontSize: 38, lineHeight: 1.4, minHeight: 230}}>{POST.slice(0, n)}<span style={{opacity: t % 14 < 7 ? 1 : 0}}>|</span></div>
      <div style={{display: 'flex', justifyContent: 'flex-end'}}><div style={{background: '#E9ECF2', color: '#8A90A6', fontWeight: 800, fontSize: 26, padding: '12px 26px', borderRadius: 14}}>Share</div></div>
    </Card></AbsoluteFill>;
};
const REPLY = 'This is the part everyone skips 👆';
const Replies: React.FC<{t: number}> = ({t}) => {
  const n = Math.floor(ramp(t, 4, 26) * REPLY.length), sent = t > 30;
  return <Top bg="#EEF0F3"><Card style={{position: 'absolute', left: 90, right: 90, top: 110, padding: 30}}>
    <div style={{height: 300, borderRadius: 18, background: 'linear-gradient(160deg,#DDE3EE,#C9D1E0)'}}/>
    <div style={{display: 'flex', gap: 22, marginTop: 18, fontSize: 40}}>♡ 💬 ➤</div>
    <div style={{fontWeight: 800, fontSize: 28, marginTop: 6}}>1,248 likes</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, background: '#F3F5F8', borderRadius: 40, padding: '12px 14px'}}>
      <Avatar s={50}/><div style={{flex: 1, fontSize: 30}}>{REPLY.slice(0, n)}</div>
      <div style={{width: 56, height: 56, borderRadius: 30, background: sent ? GREEN : '#2F6BFF', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 900}}>{sent ? '✓' : '➤'}</div></div>
    <div style={{fontSize: 22, color: '#8A90A6', marginTop: 10}}>Draft from /ig-reply · you hit send</div>
  </Card></Top>;
};
const Profile: React.FC<{t: number}> = ({t}) => {
  const bars = [['Hook', 0.87], ['Bio', 0.74], ['Grid', 0.81]] as const;
  return <Top bg="#EEF0F3"><Card style={{position: 'absolute', left: 90, right: 90, top: 100, padding: 34}}>
    <div style={{height: 12, borderRadius: 8, background: IG}}/>
    <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 24}}><Avatar s={110}/><div><div style={{fontWeight: 900, fontSize: 40}}>withhammad.ai</div><div style={{fontSize: 26, color: '#4A5068'}}>AI agents & Claude Code</div></div></div>
    <div style={{marginTop: 26, fontWeight: 800, fontSize: 26, color: '#8A90A6'}}>/ig-profile score</div>
    {bars.map(([k, v], i) => {const p = ease(ramp(t, 4 + i * 4, 20 + i * 4)); return <div key={k} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 16}}>
      <div style={{width: 90, fontWeight: 800, fontSize: 28}}>{k}</div><div style={{flex: 1, height: 18, borderRadius: 10, background: '#E9ECF2'}}><div style={{width: `${v * 100 * p}%`, height: '100%', borderRadius: 10, background: 'linear-gradient(90deg,#FA7E1E,#D62976)'}}/></div>
      <div style={{width: 80, textAlign: 'right', fontWeight: 900, fontSize: 28, color: '#D62976'}}>{Math.round(v * 100 * p)}%</div></div>;})}
  </Card></Top>;
};
const Calendar: React.FC<{t: number}> = ({t}) =>
  <AbsoluteFill style={{background: '#EEF0F3'}}><Card style={{position: 'absolute', left: 110, right: 110, top: 360, padding: 34}}>
    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 38}}><span>November</span><span style={{fontSize: 24, color: '#8A90A6', fontWeight: 700}}>/ig-plan</span></div>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginTop: 22, textAlign: 'center'}}>
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{fontSize: 24, color: '#8A90A6', fontWeight: 800}}>{d}</div>)}
      {Array.from({length: 28}, (_, i) => {const day = i + 1, wk = day >= 9 && day <= 15, on = wk && t > 4 + (day - 9) * 3;
        return <div key={i} style={{height: 64, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 800, background: on ? 'linear-gradient(135deg,#FA7E1E,#D62976)' : wk ? '#F3E6EE' : 'transparent', color: on ? '#fff' : INK}}>{day}</div>;})}
    </div></Card></AbsoluteFill>;
const Viral: React.FC<{t: number}> = ({t}) => {
  const g = t < 10 ? Math.sin(t * 3) * 10 : 0;  // glitch shake on entry
  return <AbsoluteFill style={{background: '#F5F6F8', alignItems: 'center'}}>
    <div style={{marginTop: 400, transform: `scale(${pop(t, 0, 9)}) translateX(${g}px)`, textAlign: 'center'}}>
      <div style={{width: 320, height: 320, borderRadius: 72, background: IG, display: 'grid', placeItems: 'center', margin: '0 auto', boxShadow: `${-g}px 0 0 rgba(0,255,255,.5), ${g}px 0 0 rgba(255,0,80,.5), 0 30px 80px rgba(214,41,118,.35)`}}>
        <svg width={170} height={170} viewBox="0 0 24 24"><path d="M3 17 L9 11 L13 15 L21 7" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 7 H21 V13" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 64, color: INK, marginTop: 40}}>/ig-viral</div></div></AbsoluteFill>;
};
const Grid: React.FC<{t: number}> = ({t}) => {
  const views = ['1.2M', '84K', '96K', '310K', '52K', '41K'];
  return <Top bg="#0B0F1C"><div style={{position: 'absolute', left: 60, right: 60, top: 60, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16}}>
    {views.map((v, i) => {const top = i === 0 && t > 10; return <div key={i} style={{position: 'relative', height: 380, borderRadius: 18, overflow: 'hidden', transform: `scale(${pop(t, i * 2)})`,
      outline: top ? `8px solid ${GREEN}` : 'none'}}>
      <Img src={file(`wall/c${i + 2}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: top ? 'none' : 'brightness(.6)'}}/>
      <div style={{position: 'absolute', left: 12, bottom: 12, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 30, textShadow: '0 2px 8px #000'}}>▶ {v}</div>
      {top && <div style={{position: 'absolute', right: 10, top: 10, background: GREEN, color: INK, fontFamily: SANS, fontWeight: 900, fontSize: 24, padding: '6px 12px', borderRadius: 10, transform: `scale(${pop(t, 10)})`}}>TOP · 23×</div>}
    </div>;})}</div></Top>;
};
const Checks: React.FC<{t: number}> = ({t}) => {
  const items = ['Hook in 1 second', 'Twist at 3 seconds', 'Payoff, then loop'];
  return <Top bg="#EEF0F3"><div style={{position: 'absolute', left: 80, top: 120, width: 300, height: 540, borderRadius: 22, overflow: 'hidden', outline: `8px solid ${GREEN}`}}>
      <Img src={file('wall/c2.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></div>
    <div style={{position: 'absolute', left: 430, top: 200}}>{items.map((s, i) => {const p = pop(t, 4 + i * 6); return <div key={s} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 40, transform: `translateX(${(1 - p) * 60}px)`, opacity: Math.min(1, p)}}>
      <div style={{width: 54, height: 54, borderRadius: 30, background: GREEN, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 32}}>✓</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK}}>{s}</div></div>;})}</div></Top>;
};
const SCRIPT_LINES = ['TITLE: "Why your reels stall at 300 views"', '', 'HOOK (0-1s): "Your first second is a wall."', 'OPEN LOOP (1-3s): "Here is the one line that fixed mine..."', 'BODY: 3 beats, one per cut', 'PAYOFF + LOOP: back to the first frame'];
const Chat: React.FC<{t: number}> = ({t}) => {
  const chars = Math.floor(ramp(t, 2, 46) * SCRIPT_LINES.join('\n').length);
  let left = chars;
  return <AbsoluteFill style={{background: '#1E1F24'}}>
    <div style={{position: 'absolute', left: 80, right: 80, top: 260, fontFamily: MONO, fontSize: 34, lineHeight: 1.6, color: '#E6E8EF'}}>
      <div style={{color: CLAY, marginBottom: 24}}>✻ Claude · /ig-reel</div>
      {SCRIPT_LINES.map((l, i) => {const s = l.slice(0, Math.max(0, left)); left -= l.length + 1; return <div key={i} style={{minHeight: 54, color: /^HOOK|^OPEN|^PAYOFF/.test(l) ? GREEN : undefined}}>{s}</div>;})}
    </div></AbsoluteFill>;
};
const Wonder: React.FC<{t: number}> = ({t}) => {
  // the blank-page moment: an empty composer with a blinking cursor over the face
  return <Top bg="#EEF0F3"><Card style={{position: 'absolute', left: 120, right: 120, top: 160, padding: 34, transform: `rotate(-2deg) scale(${pop(t, 0)})`}}>
    <div style={{fontWeight: 800, fontSize: 34}}>New reel</div>
    <div style={{marginTop: 26, height: 260, borderRadius: 16, background: '#F3F5F8', padding: 24, fontSize: 40, color: '#B9BFCC'}}>Write a caption…<span style={{color: INK, opacity: t % 14 < 7 ? 1 : 0}}>|</span></div>
    <div style={{marginTop: 18, fontSize: 30, color: RED, fontWeight: 800}}>Last post: 9 days ago</div>
  </Card></Top>;
};
const Research: React.FC<{t: number}> = ({t}) => {
  const lines = ['> /ig-viral niche:"AI agents"', 'reading 40 reels you saved…', 'median views per account: 18K', '3 outliers at 12×, 9×, 7×', 'formula: "number + payoff" hook'];
  return <Top bg="#11131A"><div style={{position: 'absolute', left: 60, right: 60, top: 70, borderRadius: 20, background: '#191C25', padding: 30, fontFamily: MONO, fontSize: 32, lineHeight: 1.6, color: '#C9D1E0', boxShadow: '0 20px 60px rgba(0,0,0,.5)'}}>
    <div style={{display: 'flex', gap: 10, marginBottom: 16}}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 16, height: 16, borderRadius: 9, background: c}}/>)}<span style={{marginLeft: 12, color: '#7E8AA8', fontSize: 24}}>Claude Code</span></div>
    {lines.map((l, i) => <div key={i} style={{opacity: ramp(t, 2 + i * 6, 6 + i * 6), color: i === 0 ? CLAY : i === 4 ? GREEN : undefined}}>{l}</div>)}</div></Top>;
};
const Idea: React.FC<{t: number}> = ({t}) => {
  const hooks = ['"I let Claude run my Instagram for a week."', '"13 skills, zero excuses."', '"Your next reel is already written."'];
  return <Top bg="#11131A"><div style={{position: 'absolute', left: 60, right: 60, top: 80, fontFamily: SANS, color: '#E6E8EF'}}>
    <div style={{fontWeight: 900, fontSize: 40}}>Tomorrow's reel: 3 hooks, scored</div>
    {hooks.map((h, i) => {const p = pop(t, 3 + i * 5); return <div key={i} style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 30, transform: `translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p)}}>
      <div style={{width: 50, height: 50, borderRadius: 12, background: i === 0 ? GREEN : '#2A2F3D', color: i === 0 ? INK : '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 26, flex: 'none'}}>{[92, 81, 77][i]}</div>
      <div style={{fontSize: 34, lineHeight: 1.3}}>{h}</div></div>;})}</div></Top>;
};
const Cta: React.FC<{t: number}> = ({t}) => {
  const word = 'GROWTH', n = Math.floor(ramp(t, 3, 14) * word.length), sent = t > 17, note = pop(t, 22);
  return <>
    <div style={{position: 'absolute', left: 90, right: 90, top: 1180, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(20,22,30,.86)', borderRadius: 60, padding: '16px 18px',
      transform: `scale(${pop(t, 0)})`, boxShadow: '0 20px 50px rgba(0,0,0,.4)'}}>
      <Avatar s={64}/><div style={{flex: 1, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', letterSpacing: 2}}>{word.slice(0, n)}<span style={{opacity: !sent && t % 14 < 7 ? 1 : 0}}>|</span></div>
      <div style={{width: 76, height: 76, borderRadius: 40, background: sent ? GREEN : '#7B61FF', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 40, fontWeight: 900}}>{sent ? '✓' : '↑'}</div></div>
    {note > 0 && <div style={{position: 'absolute', left: 90, right: 90, top: 240, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,.96)', borderRadius: 26, padding: '18px 22px',
      transform: `translateY(${(1 - note) * -60}px)`, boxShadow: '0 20px 50px rgba(0,0,0,.3)'}}>
      <div style={{width: 64, height: 64, borderRadius: 16, background: IG, display: 'grid', placeItems: 'center'}}>{mark('instagram', 40, '#fff')}</div>
      <div style={{fontFamily: SANS}}><div style={{fontWeight: 900, fontSize: 30, color: INK}}>withhammad.ai</div><div style={{fontSize: 28, color: '#4A5068'}}>Here you go! The 13-skill setup 👇</div></div></div>}
  </>;
};

// ------------------------------------------------------------------ captions: ALL CAPS chunks, dark box, green second line
const Captions: React.FC<{f: number; y: number}> = ({f, y}) => {
  const c = D.caps.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const p = pop(f, c.from, 16), words = c.text.replace(/[.,!?]$/, '').split(' ');
  const split = words.length >= 3 ? 2 : words.length >= 2 ? 1 : words.length;
  const l1 = words.slice(0, split).join(' '), l2 = words.slice(split).join(' ');
  const red = /TODAY|WONDERING/.test(c.text);
  return <div style={{position: 'absolute', left: 50, right: 50, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transform: `scale(${0.85 + 0.15 * p})`}}>
    <div style={{background: 'rgba(28,30,38,.72)', borderRadius: 16, padding: '6px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 62, color: '#fff', letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{l1}</div>
    {l2 && <div style={{background: 'rgba(28,30,38,.72)', borderRadius: 16, padding: '4px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 66, color: red ? '#FF6B6B' : GREEN, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{l2}</div>}
  </div>;
};

const LAYOUT: Record<string, 'split' | 'full' | 'face'> = {fight: 'split', repo: 'full', skills: 'full', wall: 'split', composer: 'full', replies: 'split', profile: 'split',
  calendar: 'full', crazy: 'face', viral: 'full', grid: 'split', checks: 'split', chat: 'full', voice: 'face', wonder: 'split', research: 'split', idea: 'split', free: 'split', cta: 'face'};
export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const s = D.scenes.find((x: any) => f >= x.from && f < x.to) || D.scenes[D.scenes.length - 1];
  const t = f - s.from, lay = LAYOUT[s.key];
  const top = ({fight: <Fight t={t}/>, repo: <Repo t={t} src="repo.mp4" full/>, skills: <Skills t={t}/>, wall: <Wall t={t}/>, composer: <Composer t={t}/>, replies: <Replies t={t}/>,
    profile: <Profile t={t}/>, calendar: <Calendar t={t}/>, viral: <Viral t={t}/>, grid: <Grid t={t}/>, checks: <Checks t={t}/>, chat: <Chat t={t}/>, wonder: <Wonder t={t}/>,
    research: <Research t={t}/>, idea: <Idea t={t}/>, free: <Repo t={t} src="mit.mp4"/>} as Record<string, React.ReactNode>)[s.key];
  const capY = lay === 'split' ? SEAM - 60 : lay === 'face' ? 1270 : 1180;
  return <AbsoluteFill style={{background: '#000'}}>
    {(lay === 'split' || lay === 'face') && <Face mode={lay === 'split' ? 'split' : 'full'} f={f} at={s.from}/>}
    {lay !== 'face' && <Sequence from={s.from} layout="none">{top}</Sequence>}
    {s.key === 'cta' && <Cta t={t}/>}
    {s.key !== 'cta' && <Captions f={f} y={capY}/>}
    <div style={{position: 'absolute', right: 40, top: lay === 'split' ? SEAM + 30 : 1640, fontFamily: SANS, fontWeight: 900, fontSize: 24, letterSpacing: 5, color: 'rgba(255,255,255,.6)', textShadow: '0 2px 8px rgba(0,0,0,.6)'}}>WITHHAMMAD</div>
    <Audio src={D.voiceFile ? staticFile(D.voiceFile) : file('voice.wav')}/>
  </AbsoluteFill>;
};
