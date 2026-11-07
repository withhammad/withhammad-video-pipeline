import React from 'react';
import {AbsoluteFill, Img, Loop, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Referral reel (job 33d9c1e97156): @ashutoshwithclaude's skit in the same order and layout (analysis/visual.md):
// full-frame room scene with a person and a Claude character, two-tier top captions (speaker pill + one serif line,
// white for the person, yellow for Claude), a dark STEP n/4 card over the top half from 13 s with UI mock-ups that move
// on the spoken word, hard camera cuts wide / person close-up / Claude close-up, silent comment-keyword end card.
// Changes vs the reference: Hammad's face (approved white-shirt look) instead of the 3D character, our own Claude orb,
// WITHHAMMAD branding, keyword REFERRAL, corrected facts (Jobvite ~40% of hires not "half"; the CSV has no start dates,
// you check them on the profile; real LinkedIn export path; "bots break LinkedIn's rules"), larger readable UI text.
loadFont({family: 'RfInter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'RfInter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'RfInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'RfInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'RfSerif', url: staticFile('fonts/source-serif-4-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'RfEmoji', url: staticFile('fonts/noto-color-emoji-400-normal.woff2'), weight: '400'});

const D: any = data;
const FPS = 30;
const SANS = 'RfInter, Arial, sans-serif, RfEmoji', SERIF = 'RfSerif, Georgia, serif', EMO = 'RfEmoji';
const INK = '#17150F', CREAM = '#FBF8F1', CHAR = '#1E1B16', YEL = '#F2C14E', CLAY = '#D97757', RED = '#E5484D', GREEN = '#2FA866',
  LI = '#0A66C2', GREY = '#8A8478', LINE = '#E7E1D3';
const file = (s: string) => staticFile('referrals/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 200}}));
const vis = (f: number, at: number) => ({opacity: Math.min(1, pop(f, at) * 2), transform: `scale(${0.8 + 0.2 * pop(f, at)})`});

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const shotAt = (f: number) => D.shots.reduce((a: any, s: any) => (f >= s.from ? s : a), D.shots[0]);
const claudeTalking = (f: number) => D.speaking.some((w: any) => w.spk === 'C' && f >= w.from - 1 && f <= w.to + 1);
const CARD = new Set(['step1', 'step2', 'step3', 'step4', 'guard', 'payoff']);
const STEP: Record<string, [number, string]> = {step1: [1, 'Why referrals'], step2: [2, "Find who's hiring"], step3: [3, 'Read them first'],
  step4: [4, 'Write it their way'], guard: [4, 'Write it their way'], payoff: [4, 'Write it their way']};

// ================================================================= scene: room, Hammad, Claude orb
const Orb: React.FC<{f: number; size: number; talk: boolean; smile: boolean}> = ({f, size, talk, smile}) => {
  const blink = f % 96 < 4, bob = Math.sin(f / 18) * size * 0.02;
  const bars = [0, 1, 2, 3, 4, 5, 6].map(i => talk ? 0.25 + 0.75 * Math.abs(Math.sin(f * 0.55 + i * 1.7) * Math.cos(f * 0.23 + i)) : 0.12);
  return <div style={{width: size, height: size, transform: `translateY(${bob}px)`, position: 'relative'}}>
    <svg width={size} height={size} viewBox="0 0 200 200" style={{position: 'absolute', overflow: 'visible'}}>
      <defs>
        <radialGradient id="orbG" cx="38%" cy="30%" r="75%"><stop offset="0" stopColor="#F2A07E"/><stop offset=".55" stopColor={CLAY}/><stop offset="1" stopColor="#8E4128"/></radialGradient>
        <radialGradient id="visG" cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#2A2622"/><stop offset="1" stopColor="#0B0A09"/></radialGradient>
      </defs>
      <ellipse cx="100" cy="196" rx="54" ry="7" fill="rgba(0,0,0,.25)"/>
      <ellipse cx="100" cy="104" rx="98" ry="22" fill="none" stroke="rgba(255,226,200,.55)" strokeWidth="1.6" transform="rotate(-8 100 104)"/>
      <circle cx="100" cy="100" r="80" fill="url(#orbG)"/>
      <ellipse cx="72" cy="52" rx="26" ry="14" fill="rgba(255,255,255,.28)" transform="rotate(-25 72 52)"/>
      <rect x="40" y="70" width="120" height="74" rx="34" fill="url(#visG)"/>
      {smile
        ? <><path d="M66 102 Q78 90 90 102" stroke={YEL} strokeWidth="6" fill="none" strokeLinecap="round"/><path d="M110 102 Q122 90 134 102" stroke={YEL} strokeWidth="6" fill="none" strokeLinecap="round"/></>
        : <><rect x="64" y={blink ? 97 : 90} width="26" height={blink ? 3 : 13} rx="5" fill={YEL}/><rect x="110" y={blink ? 97 : 90} width="26" height={blink ? 3 : 13} rx="5" fill={YEL}/></>}
      {bars.map((h, i) => <rect key={i} x={79 + i * 6.6} y={126 - 9 * h} width="4" height={18 * h} rx="2" fill={YEL} opacity={0.95}/>)}
      <path d="M100 6 L100 20" stroke="#8E4128" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="100" cy="5" r="6" fill={YEL}/>
    </svg>
    <Img src={staticFile('glow/si-claude.svg')} style={{position: 'absolute', left: size * 0.455, top: size * 0.21, width: size * 0.09, height: size * 0.09, filter: 'invert(1)', opacity: 0.85}}/>
  </div>;
};

const Take: React.FC<{style: React.CSSProperties}> = ({style}) =>
  <Loop durationInFrames={Math.round(64 * FPS)}><AbsoluteFill style={style}>
    <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920}}/></AbsoluteFill></Loop>;

// face of the take sits at (540, 560) in its 1080x1920 frame
const place = (s: number, fx: number, fy: number): React.CSSProperties =>
  ({transformOrigin: '0 0', transform: `translate(${fx - 540 * s}px, ${fy - 560 * s}px) scale(${s})`});

const Scene: React.FC<{f: number}> = ({f}) => {
  const u = unitAt(f), sh = shotAt(f), card = CARD.has(u.kind), talk = claudeTalking(f);
  const smile = u.kind === 'payoff' && f >= D.beats.payoff.open;
  const nextFrom = D.shots.find((s: any) => s.from > sh.from)?.from ?? sh.from + 90;
  const push = 1 + 0.035 * ramp(f, sh.from, nextFrom);   // slow push inside every shot, hard cut between shots
  const fy = card ? 1460 : 760;
  let take: React.CSSProperties, orb = {x: 0, y: 0, s: 0}, blur = 0;
  if (sh.kind === 'wide') { take = place(1.12 * push, 390, fy); orb = {x: 820, y: fy + (card ? 60 : 120), s: card ? 250 : 300}; }
  else if (sh.kind === 'cuH') take = place(1.62 * push, 540, fy + (card ? 40 : 80));
  else { take = place(1.5, -60, fy); blur = 16; orb = {x: 540, y: fy + 40, s: (card ? 470 : 600) * push}; }
  return <AbsoluteFill style={{background: '#2b2018', overflow: 'hidden'}}>
    <Take style={{...place(2.2, 540, 700), filter: 'blur(36px) brightness(.8)'}}/>
    <Take style={{...take, filter: blur ? `blur(${blur}px) brightness(.85)` : undefined,
      maskImage: sh.kind === 'wide' ? 'linear-gradient(90deg, #000 78%, transparent 100%)' : undefined}}/>
    {orb.s ? <div style={{position: 'absolute', left: orb.x - orb.s / 2, top: orb.y - orb.s / 2}}><Orb f={f} size={orb.s} talk={talk} smile={smile}/></div> : null}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,14,8,.55) 0%, rgba(20,14,8,0) 16%, rgba(20,14,8,0) 82%, rgba(20,14,8,.45) 100%)'}}/>
  </AbsoluteFill>;
};

// ================================================================= shared UI bits
const Person: React.FC<{c: string; s?: number}> = ({c, s = 30}) => <svg width={s} height={s * 1.15} viewBox="0 0 20 23">
  <circle cx="10" cy="6" r="5" fill={c}/><path d="M1 23 Q1 12 10 12 Q19 12 19 23 Z" fill={c}/></svg>;
const Avatar: React.FC<{name: string; c: string; s?: number}> = ({name, c, s = 64}) => <div style={{width: s, height: s, borderRadius: s, background: c, flex: 'none',
  color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: s * 0.38, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{name}</div>;
const Stamp: React.FC<{f: number; at: number; text: string; c: string; rot?: number; size?: number; style?: React.CSSProperties}> = ({f, at, text, c, rot = -8, size = 38, style}) => {
  if (f < at) return null;
  const p = pop(f, at);
  return <div style={{position: 'absolute', ...style, transform: `rotate(${rot}deg) scale(${2.2 - 1.2 * p})`, opacity: Math.min(1, p * 2),
    border: `5px solid ${c}`, color: c, borderRadius: 12, padding: '4px 18px', fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: 2, background: 'rgba(255,255,255,.85)'}}>{text}</div>;
};
const Sample: React.FC<{style?: React.CSSProperties}> = ({style}) => <div style={{position: 'absolute', right: 26, bottom: 18, fontFamily: SANS, fontWeight: 700, fontSize: 20,
  letterSpacing: 2, color: GREY, ...style}}>SAMPLE DATA</div>;
const Cursor: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => <div style={{position: 'absolute', left: x, top: y, transform: `scale(${1 - 0.15 * click})`}}>
  <svg width="44" height="52" viewBox="0 0 22 26"><path d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.6 15.2 L17 15 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/></svg></div>;

// ================================================================= STEP card (dark header, cream body)
const CX = 40, CY = 300, CW = 1000, CH = 880;
const StepCard: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const [n, title] = STEP[u.kind];
  const first = D.units.find((x: Unit) => STEP[x.kind]?.[0] === n) as Unit;   // card slides in once per step
  const p = pop(f, first.from);
  return <div style={{position: 'absolute', left: CX, top: CY, width: CW, height: CH, borderRadius: 36, background: CHAR, padding: 18,
    boxShadow: '0 30px 80px rgba(0,0,0,.5)', transform: `translateY(${(1 - p) * 80}px) scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '6px 10px 0'}}>
      <div style={{background: YEL, color: INK, fontFamily: SANS, fontWeight: 900, fontSize: 24, letterSpacing: 2, borderRadius: 10, padding: '6px 14px'}}>STEP {n}/4</div>
      <div style={{display: 'flex', gap: 10, flex: 1}}>{[1, 2, 3, 4].map(i => <div key={i} style={{flex: 1, height: 10, borderRadius: 5,
        background: i < n ? YEL : i === n ? `linear-gradient(90deg, ${YEL} ${100 * Math.min(1, 0.3 + ramp(f, first.from, first.from + 300))}%, rgba(255,255,255,.18) 0)` : 'rgba(255,255,255,.18)'}}/>)}</div>
    </div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: '#fff', padding: '14px 10px 16px', letterSpacing: -0.5}}>{title}</div>
    <div style={{position: 'relative', height: CH - 18 * 2 - 128, background: CREAM, borderRadius: 24, overflow: 'hidden'}}>
      {u.kind === 'step1' ? <Step1 f={f}/> : u.kind === 'step2' ? <Step2 f={f}/> : u.kind === 'step3' ? <Step3 f={f}/> : <Step4 f={f} u={u}/>}
    </div></div>;
};

// ---- STEP 1: 100 applicants, 7 referred, ~40% of hires; then the two lines
const REF = [13, 27, 38, 52, 66, 71, 89];
const Step1: React.FC<{f: number}> = ({f}) => {
  const b = D.beats.step1, lanes = f >= b.lanes, k = ramp(f, b.forty, b.forty + 24), pct = Math.round(40 * ease(k));
  if (!lanes) return <div style={{padding: '28px 40px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK}}>100 applicants</div>
      {f >= b.seven + 10 ? <div style={{...vis(f, b.seven + 10), background: CLAY, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 28, borderRadius: 999, padding: '6px 20px'}}>7 referred</div> : null}
    </div>
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: '10px 6px', marginTop: 22}}>
      {Array.from({length: 100}, (_, i) => {
        const on = REF.indexOf(i), lit = on >= 0 && f >= b.seven + on * 2;
        return <div key={i} style={{opacity: ramp(f, i * 0.25, i * 0.25 + 6), transform: lit ? `scale(${1 + 0.25 * (1 - ramp(f, b.seven + on * 2, b.seven + on * 2 + 8))})` : undefined}}>
          <Person c={lit ? CLAY : '#CFC8BA'} s={34}/></div>;
      })}
    </div>
    <div style={{marginTop: 34, opacity: ramp(f, b.forty - 8, b.forty)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 800, fontSize: 32, color: INK}}>
        <span>Share of hires from referrals</span><span style={{color: CLAY, opacity: k > 0 ? 1 : 0}}>~{pct}%</span></div>
      <div style={{height: 34, borderRadius: 17, background: LINE, marginTop: 14, overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${CLAY}, #F09A72)`, borderRadius: 17}}/></div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 22, color: GREY, marginTop: 12}}>Source: Jobvite data (via social-hire.com) · older study</div>
    </div></div>;
  const q = ramp(f, b.lanes, b.lanes + 18);
  const Lane: React.FC<{y: number; label: string; c: string; sub: string; n: number; door: string; dc: string; speed: number}> = ({y, label, c, sub, n, door, dc, speed}) =>
    <div style={{position: 'absolute', left: 34, right: 34, top: y, height: 230, borderRadius: 22, background: '#fff', border: `2px solid ${LINE}`, opacity: q}}>
      <div style={{position: 'absolute', left: 24, top: 18, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{background: c, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 24, letterSpacing: 2, borderRadius: 8, padding: '4px 12px'}}>{label}</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: GREY}}>{sub}</div></div>
      <div style={{position: 'absolute', left: 24, top: 96, display: 'flex', gap: n > 5 ? 4 : 40, transform: `translateX(${speed * ((f - b.lanes) % 60) / 60}px)`}}>
        {Array.from({length: n}, (_, i) => <Person key={i} c={n > 5 ? '#BDB5A6' : CLAY} s={n > 5 ? 34 : 46}/>)}</div>
      <div style={{position: 'absolute', right: 24, top: 60, width: 120, height: 150, borderRadius: '14px 14px 0 0', background: dc, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: SANS, fontWeight: 900, fontSize: 24, color: '#fff'}}>{door}</div>
    </div>;
  return <>
    <Lane y={40} label="APPLY" c="#6F6A60" sub="200 applications · 0 replies" n={16} door="CLOSED" dc="#5B5750" speed={6}/>
    <Lane y={300} label="REFERRAL" c={CLAY} sub="someone vouches for you" n={3} door="HIRED" dc={GREEN} speed={60}/>
    <Stamp f={f} at={b.wrong} text="WRONG LINE" c={RED} size={52} style={{left: 250, top: 130}}/>
    {f >= b.yes ? <div style={{position: 'absolute', left: 0, right: 0, top: 570, textAlign: 'center', ...vis(f, b.yes)}}>
      <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: INK}}>200 applications in the slow line</span></div> : null}
  </>;
};

// ---- STEP 2: export connections (real path), Claude sorts managers, YOU check the start date on each profile
const Step2: React.FC<{f: number}> = ({f}) => {
  const b = D.beats.step2;
  if (f < b.sort) {
    const rows = ['Data privacy', 'Download your data', 'Connections', 'Request archive'];
    const clicks = [b.download, b.download + 14, b.connections, b.connections + 16];
    const k = clicks.reduce((a, c, i) => (f >= c ? i : a), 0);
    const cy = 150 + k * 112 + 30, prevY = 150 + Math.max(0, k - 1) * 112 + 30, m = ease(ramp(f, clicks[k] - 8, clicks[k]));
    return <div style={{padding: '26px 34px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 54, height: 54, borderRadius: 10, background: LI, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>in</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK}}>Settings &amp; Privacy</div></div>
      {rows.map((r, i) => {
        const done = f >= clicks[i], isBtn = i === 3;
        return <div key={r} style={{marginTop: 22, height: 90, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 20, padding: '0 26px',
          background: isBtn ? (done ? LI : '#fff') : done ? '#EAF2FB' : '#fff', border: `2px solid ${done ? LI : LINE}`, opacity: ramp(f, b.download - 20 + i * 4, b.download - 10 + i * 4)}}>
          {isBtn ? null : <div style={{width: 40, height: 40, borderRadius: 20, background: done ? LI : LINE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i === 2 && done ? '✓' : i + 1}</div>}
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: isBtn && done ? '#fff' : INK, flex: 1, textAlign: isBtn ? 'center' : 'left'}}>{r}</span>
          {isBtn ? null : <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 34, color: GREY}}>›</span>}
        </div>;
      })}
      {f >= clicks[3] + 8 ? <div style={{position: 'absolute', left: 300, top: 590, ...vis(f, clicks[3] + 8), display: 'flex', alignItems: 'center', gap: 14, background: '#fff',
        border: `2px solid ${GREEN}`, borderRadius: 999, padding: '10px 26px', fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK}}>
        <span style={{color: GREEN}}>✓</span> Connections.csv</div> : null}
      <Cursor x={820} y={prevY + (cy - prevY) * m} click={f >= clicks[k] && f < clicks[k] + 5 ? 1 : 0}/>
    </div>;
  }
  const people = [['SM', 'Sara Malik', 'Engineering Manager · Northbeam AI', '#4F7BD9', 'New role · 2 mo', GREEN],
    ['DR', 'Daniel Reyes', 'Head of ML · Vectory', '#8A63D2', 'Promoted · 6 wk', GREEN],
    ['PN', 'Priya Nair', 'AI Platform Lead · Lumen Labs', '#D9822B', '4 yrs in role', GREY],
    ['TB', 'Tom Becker', 'Eng Manager · Fieldstone AI', '#2E9E8F', 'New role · 1 mo', GREEN]];
  return <div style={{padding: '22px 30px'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <Img src={staticFile('glow/si-claude.svg')} style={{width: 40, height: 40, filter: 'invert(52%) sepia(52%) saturate(640%) hue-rotate(332deg)'}}/>
      <span style={{fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: INK}}>Claude</span></div>
    <div style={{marginTop: 14, background: '#EFEADF', borderRadius: 18, padding: '14px 20px', fontFamily: SANS, fontWeight: 600, fontSize: 26, color: INK, display: 'flex', gap: 12, alignItems: 'center', opacity: ramp(f, b.sort, b.sort + 8)}}>
      <span style={{background: '#fff', borderRadius: 10, padding: '4px 12px', fontWeight: 800, fontSize: 22, border: `1.5px solid ${LINE}`}}>Connections.csv</span>
      Which of these manage teams at AI companies?</div>
    {people.map(([ini, name, role, c, tag, tc], i) => {
      const at = b.sort + 10 + i * 6, checked = f >= b.months + i * 5;
      return <div key={name} style={{marginTop: 14, height: 98, background: '#fff', borderRadius: 18, border: `2px solid ${LINE}`, display: 'flex', alignItems: 'center', gap: 18, padding: '0 20px',
        opacity: ramp(f, at, at + 6), transform: `translateY(${(1 - ease(ramp(f, at, at + 8))) * 20}px)`}}>
        <Avatar name={ini} c={c} s={60}/>
        <div style={{flex: 1}}><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK}}>{name}</div>
          <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: GREY}}>{role}</div></div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, borderRadius: 999, padding: '8px 16px', whiteSpace: 'nowrap',
          background: checked ? (tc === GREEN ? '#E3F5EA' : '#EFEDE8') : f >= b.check ? '#FFF3D6' : '#F4F1EA', color: checked ? tc : f >= b.check ? '#A27200' : GREY}}>
          {checked ? tag : f >= b.check ? 'Check start date ↗' : 'Manager'}</div>
      </div>;
    })}
    <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 600, fontSize: 21, color: GREY, opacity: ramp(f, b.check, b.check + 10)}}>
      The export has no start dates. You check them on each profile.</div>
    {f >= b.teams ? <div style={{position: 'absolute', left: 0, right: 0, top: 268, display: 'flex', justifyContent: 'center', ...vis(f, b.teams)}}>
      <div style={{background: INK, color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 32, borderRadius: 16, padding: '14px 26px', boxShadow: '0 14px 30px rgba(0,0,0,.3)'}}>
        New manager = new team = <span style={{color: YEL}}>open roles</span></div></div> : null}
    {f >= b.meetings ? <div style={{position: 'absolute', right: 40, top: 130, ...vis(f, b.meetings), fontFamily: EMO, fontSize: 64}}>📅📅📅</div> : null}
    <Sample/>
  </div>;
};

// ---- STEP 3: paste their posts, four styles, posts stamped
const STYLES: [string, string, string, string][] = [['DRIVER', 'Short. Results first.', '⚡', RED], ['INFLUENCER', 'Big energy. Emojis.', '⭐', '#D9A400'],
  ['STEADY', 'Warm. Team first.', '💚', GREEN], ['ANALYST', 'Detailed. Data first.', '📊', LI]];
const Post: React.FC<{ini: string; c: string; name: string; role: string; text: React.ReactNode; style?: React.CSSProperties}> = ({ini, c, name, role, text, style}) =>
  <div style={{background: '#fff', borderRadius: 20, border: `2px solid ${LINE}`, padding: '20px 24px', position: 'relative', ...style}}>
    <div style={{display: 'flex', gap: 16, alignItems: 'center'}}><Avatar name={ini} c={c} s={56}/>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK}}>{name}</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 21, color: GREY}}>{role}</div></div></div>
    <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 29, color: INK, marginTop: 14, lineHeight: 1.3}}>{text}</div></div>;
const Step3: React.FC<{f: number}> = ({f}) => {
  const b = D.beats.step3;
  if (f < b.posts) {
    const scan = ((f - b.paste) % 50) / 50;
    return <div style={{padding: '24px 30px'}}>
      <div style={{position: 'relative', opacity: ramp(f, b.paste, b.paste + 8)}}>
        <Post ini="SM" c="#4F7BD9" name="Sara Malik" role="Engineering Manager · Northbeam AI" text="How we cut our AI app's response time in half, step by step, with the numbers. A thread 🧵"/>
        {f < b.four ? <div style={{position: 'absolute', left: 0, right: 0, top: 30 + scan * 170, height: 4, background: RED, boxShadow: `0 0 18px ${RED}`}}/> : null}
      </div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: GREY, marginTop: 10, textAlign: 'center', opacity: ramp(f, b.paste + 6, b.paste + 14)}}>
        You paste the posts in. Claude reads the style.</div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20}}>
        {STYLES.map(([t, d, e, c], i) => {
          const at = b.four - 6 + i * 6;
          return f < at ? <div key={t}/> : <div key={t} style={{...vis(f, at), background: '#fff', borderRadius: 18, borderLeft: `10px solid ${c}`, padding: '18px 20px', boxShadow: '0 6px 16px rgba(0,0,0,.08)'}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 30, color: c, letterSpacing: 1}}><span style={{fontFamily: EMO}}>{e}</span> {t}</div>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 25, color: INK, marginTop: 4}}>{d}</div></div>;
        })}</div>
      <Sample/></div>;
  }
  return <div style={{padding: '30px 30px'}}>
    <div style={{position: 'relative', ...vis(f, b.posts)}}>
      <Post ini="TB" c="#E06C3C" name="Tyler Brooks" role="Growth Lead · Zapwise" text={<>WE JUST SHIPPED!!! <span style={{fontFamily: EMO}}>🚀🚀🚀🚀🚀</span> Who's ready?!</>}/>
      <Stamp f={f} at={b.rocket + 8} text="INFLUENCER" c="#C99700" style={{right: 24, top: 18}}/></div>
    <div style={{position: 'relative', marginTop: 26, ...vis(f, b.posts + 6)}}>
      <Post ini="RK" c="#4F7BD9" name="Rachel Kim" role="Staff Engineer · Vectory" text="Our RAG answers got 31% more accurate. We measured three things first. Here's each one, with the data. (thread)"/>
      <Stamp f={f} at={b.analyst} text="ANALYST" c={LI} style={{right: 24, top: 18}}/></div>
    <Sample/></div>;
};

// ---- STEP 4: write it their way; then guardrail; then the reply
const AFTER = "Loved your thread on halving response time. I hit the same latency wall on a small AI app. Could I ask you two quick questions?";
const Step4: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const b = D.beats.step4, g = D.beats.guard, py = D.beats.payoff;
  if (u.kind === 'step4' && f < b.beg) return <div style={{padding: '30px 30px'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: GREY, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10}}>
      <div style={{width: 34, height: 34, borderRadius: 6, background: LI, color: '#fff', fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>in</div>Feed</div>
    <div style={{position: 'relative', ...vis(f, b.sara)}}>
      <Post ini="SM" c="#4F7BD9" name="Sara Malik" role="Engineering Manager · Northbeam AI" text={<>How we cut our AI app's response time in half (a thread) <span style={{fontFamily: EMO}}>🧵</span></>}/>
      <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10}}>{[0.95, 0.88, 0.7].map((w, i) =>
        <div key={i} style={{height: 18, width: `${w * 100}%`, borderRadius: 9, background: '#DCE6F3', opacity: ramp(f, b.threads + i * 4, b.threads + i * 4 + 6)}}/>)}</div>
      <Stamp f={f} at={b.threads} text="ANALYST" c={LI} style={{right: 24, top: 18}}/></div>
    <Sample/></div>;
  if (u.kind === 'step4' && f < b.point) {
    const chars = Math.floor(AFTER.length * ramp(f, b.ask, b.ask + 70));
    return <div style={{padding: '30px 26px', display: 'flex', gap: 20}}>
      <div style={{flex: 1, background: '#fff', borderRadius: 20, border: `2px solid ${LINE}`, padding: 22, position: 'relative', height: 560}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 26, color: RED, letterSpacing: 2}}>✕ BEFORE</div>
        <div style={{marginTop: 22, background: '#EFEDE8', borderRadius: 16, padding: '16px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 30, color: INK}}>Hi. Can you refer me?</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: GREY, marginTop: 10, textAlign: 'right'}}>Seen</div>
        <div style={{position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: RED, opacity: ramp(f, b.beg, b.beg + 10)}}>no reply</div></div>
      <div style={{flex: 1.25, background: '#fff', borderRadius: 20, border: `3px solid ${f >= b.ask ? GREEN : LINE}`, padding: 22, height: 560, opacity: ramp(f, b.ask - 6, b.ask)}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 26, color: GREEN, letterSpacing: 2}}>✓ AFTER</div>
        <div style={{marginTop: 22, background: '#E3F5EA', borderRadius: 16, padding: '16px 18px', fontFamily: SANS, fontWeight: 700, fontSize: 28, color: INK, lineHeight: 1.32, minHeight: 60}}>
          {AFTER.slice(0, chars)}<span style={{opacity: chars < AFTER.length && f % 16 < 8 ? 1 : 0}}>|</span></div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 21, color: GREY, marginTop: 12}}>Drafted with Claude · sent by you</div></div>
    </div>;
  }
  if (u.kind === 'step4') {
    const steps: [string, number, string][] = [['Question', b.q, '?'], ['Reply', b.r1, '↩'], ['Chat', b.r2, '💬'], ['Referral', b.ref, '★']];
    return <div style={{padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
      {steps.map(([t, at, ic], i) => {
        const last = i === 3, on = f >= at;
        return <React.Fragment key={t}>
          {i ? <div style={{fontSize: 34, color: GREY, opacity: on ? 1 : 0.2, fontFamily: SANS}}>↓</div> : null}
          <div style={{width: 520, height: 104, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, transform: `scale(${on ? 0.85 + 0.15 * pop(f, at) : 0.9})`,
            background: last && on ? GREEN : '#fff', border: `3px solid ${on ? (last ? GREEN : INK) : LINE}`, opacity: on ? 1 : 0.35,
            fontFamily: SANS, fontWeight: 900, fontSize: 40, color: last && on ? '#fff' : INK}}>
            <span style={{fontFamily: i === 2 ? EMO : SANS}}>{ic}</span>{t}</div></React.Fragment>;
      })}</div>;
  }
  // guard + payoff
  const banned = f >= g.bans, bar = ease(ramp(f, g.send + 6, g.bans - 2));
  const tiles: [string, string, number][] = [['✍️', 'Claude writes', g.write], ['👆', 'You send', g.you], ['🗓️', 'A few a day', g.few]];
  return <div style={{padding: '34px 30px'}}>
    {!banned ? <div style={{...vis(f, g.send), background: '#fff', borderRadius: 22, border: `2px solid ${LINE}`, padding: '26px 28px'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK}}><span style={{fontFamily: EMO}}>🤖</span> Auto-send to every manager</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: GREY, marginTop: 6}}>Sent: {Math.max(5, Math.round(500 * bar))} / 500</div>
      <div style={{height: 26, borderRadius: 13, background: LINE, marginTop: 16, overflow: 'hidden'}}><div style={{height: '100%', width: `${Math.max(1, 100 * bar)}%`, background: LI}}/></div>
    </div> : <div style={{...vis(f, g.bans), background: '#FDECEC', border: `3px solid ${RED}`, borderRadius: 22, padding: '22px 28px', textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 38, color: RED}}><span style={{fontFamily: EMO}}>⛔</span> Bots break LinkedIn's rules</div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: INK, marginTop: 8}}>Automated tools can get your account restricted · User Agreement 8.2</div></div>}
    <div style={{display: 'flex', gap: 16, marginTop: 26}}>{tiles.map(([e, t, at]) => f < at ? <div key={t} style={{flex: 1}}/> :
      <div key={t} style={{flex: 1, ...vis(f, at), background: '#fff', borderRadius: 20, border: `2px solid ${LINE}`, padding: '20px 10px', textAlign: 'center'}}>
        <div style={{fontFamily: EMO, fontSize: 54}}>{e}</div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK, marginTop: 6}}>{t}</div></div>)}</div>
    {u.kind === 'payoff' ? <div style={{marginTop: 26, ...vis(f, py.wait), background: '#fff', borderRadius: 22, border: `2px solid ${LI}`, padding: '18px 22px', boxShadow: '0 12px 30px rgba(10,102,194,.18)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 800, fontSize: 22, color: LI}}><span>Messaging</span><span style={{color: GREY}}>now</span></div>
      <div style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 10}}><Avatar name="SM" c="#4F7BD9" s={56}/>
        <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: INK}}>Sara Malik</div>
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: INK}}>Sure! Happy to help. Free Thursday?</div></div></div>
      <Sample style={{bottom: 6}}/></div> : null}
  </div>;
};

// ================================================================= hook + twist overlays (no card yet)
const HookCards: React.FC<{f: number}> = ({f}) => {
  const b = D.beats.hook, t = D.beats.twist;
  const n = Math.round(160 + 40 * ease(ramp(f, b.card, b.card + 24)));
  return <>
    {f >= b.card && f < D.units[1].from ? <div style={{position: 'absolute', left: 60, top: 330, width: 560, ...vis(f, b.card), transformOrigin: '0 0', background: '#fff', borderRadius: 28,
      padding: '24px 32px', boxShadow: '0 24px 60px rgba(0,0,0,.4)', display: 'flex', gap: 34, alignItems: 'flex-end'}}>
      <div><div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: GREY}}>Applied</div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 120, color: INK, lineHeight: 1}}>{n}</div></div>
      <div style={{width: 2, alignSelf: 'stretch', background: LINE}}/>
      <div style={{position: 'relative'}}><div style={{fontFamily: SANS, fontWeight: 700, fontSize: 28, color: GREY}}>Interviews</div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 120, color: RED, lineHeight: 1}}>0</div>
        <Stamp f={f} at={b.zero} text="ZERO" c={RED} size={30} rot={-12} style={{left: 70, top: 70}}/></div>
    </div> : null}
    {f >= b.hired && f < D.units[1].from ? <div style={{position: 'absolute', right: 50, top: 640, width: 560, ...vis(f, b.hired), background: '#fff', borderRadius: 24, padding: '20px 24px', boxShadow: '0 24px 60px rgba(0,0,0,.4)'}}>
      <div style={{display: 'flex', gap: 16, alignItems: 'center'}}><Avatar name="OK" c="#2E9E8F" s={60}/>
        <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, color: INK}}>Omar Khan</div><div style={{fontFamily: SANS, fontWeight: 600, fontSize: 22, color: GREY}}>Applied to 0 jobs</div></div></div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK, marginTop: 12}}><span style={{fontFamily: EMO}}>🎉</span> Starting a new position as Frontend Engineer!</div></div> : null}
    {f >= t.div && unitAt(f).kind === 'twist' && f < t.div + 70 ? <div style={{position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center', ...vis(f, t.div)}}>
      <div style={{background: CHAR, borderRadius: 18, padding: '16px 30px', fontFamily: 'Menlo, monospace', fontWeight: 700, fontSize: 44, color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.45)'}}>
        {'<div>'} centered? <span style={{color: RED}}>✗</span></div></div> : null}
    {unitAt(f).kind === 'payoff' && f >= D.beats.payoff.open ? <div style={{position: 'absolute', left: 390 - 170, top: 1180, width: 340, textAlign: 'center', ...vis(f, D.beats.payoff.open)}}>
      <span style={{background: GREEN, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 30, letterSpacing: 2, borderRadius: 999, padding: '10px 24px'}}>#OPENTOWORK</span></div> : null}
  </>;
};

// ================================================================= captions: speaker pill + one serif line
const Captions: React.FC<{f: number}> = ({f}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c || f >= D.voiceEnd) return null;
  const k = ease(ramp(f, c.from, c.from + 4)), col = c.spk === 'C' ? YEL : '#fff';
  return <div style={{position: 'absolute', left: 40, right: 40, top: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
    <div style={{background: 'rgba(52,36,22,.88)', borderRadius: 10, padding: '6px 16px', fontFamily: SANS, fontWeight: 900, fontSize: 24, letterSpacing: 4, color: col}}>{c.spk === 'C' ? 'CLAUDE' : 'HAMMAD'}</div>
    <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 68, lineHeight: 1.08, color: col, textAlign: 'center', textShadow: '0 3px 14px rgba(0,0,0,.75), 0 1px 3px rgba(0,0,0,.6)',
      opacity: k, filter: `blur(${(1 - k) * 6}px)`, transform: `translateY(${(1 - k) * 8}px)`}}>{c.text}</div></div>;
};

// ================================================================= end card (silent, like the reference) + keyword
const EndCard: React.FC<{f: number}> = ({f}) => {
  const at = D.beats.cta.from, kw = 'REFERRAL', typed = kw.slice(0, Math.floor(kw.length * ramp(f, at + 22, at + 46)));
  return <AbsoluteFill style={{background: 'radial-gradient(circle 900px at 540px 760px, #1D2742 0%, #0B1020 70%)', alignItems: 'center'}}>
    <div style={{marginTop: 300, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 76, lineHeight: 1.12, ...vis(f, at)}}>
      <div style={{color: '#fff'}}>Which type is your</div><div style={{color: YEL}}>dream manager?</div></div>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, width: 900, marginTop: 70}}>
      {STYLES.map(([t, d, e, c], i) => <div key={t} style={{background: '#fff', borderRadius: 22, borderLeft: `12px solid ${c}`, padding: '22px 24px',
        transform: `translateX(${(1 - ease(ramp(f, at + 4 + i * 4, at + 16 + i * 4))) * -700}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 34, color: c}}><span style={{fontFamily: EMO}}>{e}</span> {t}</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 26, color: INK, marginTop: 4}}>{d}</div></div>)}</div>
    <div style={{marginTop: 90, display: 'flex', alignItems: 'center', gap: 20, fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff', ...vis(f, at + 18)}}>
      Comment <span style={{background: YEL, color: INK, borderRadius: 16, padding: '4px 22px', minWidth: 330, textAlign: 'center'}}>{typed || ' '}</span></div>
    <div style={{marginTop: 26, fontFamily: SANS, fontWeight: 700, fontSize: 36, color: 'rgba(255,255,255,.85)', opacity: ramp(f, at + 46, at + 54)}}>and I'll send you all 4 message templates</div>
    <div style={{position: 'absolute', bottom: 300, fontFamily: SANS, fontWeight: 800, fontSize: 32, color: 'rgba(255,255,255,.7)', opacity: ramp(f, at + 54, at + 62)}}>Follow for the next one</div>
  </AbsoluteFill>;
};

const Brand: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7,
  color: 'rgba(255,255,255,.72)', textShadow: '0 2px 8px rgba(0,0,0,.6)'}}>WITHHAMMAD</div>;
const StandIn: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, top: 24, display: 'flex', justifyContent: 'center'}}>
  <div style={{background: 'rgba(229,72,77,.92)', color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 22, letterSpacing: 3, borderRadius: 8, padding: '5px 14px'}}>STAND-IN VOICE · NOT FOR POSTING</div></div>;

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: '#000'}}>
    <Audio src={file('voice.wav')}/>
    {u.kind === 'cta' ? <EndCard f={f}/> : <>
      <Scene f={f}/>
      <HookCards f={f}/>
      {CARD.has(u.kind) ? <StepCard f={f} u={u}/> : null}
      <Captions f={f}/>
    </>}
    <Brand/>
    {D.standin ? <StandIn/> : null}
  </AbsoluteFill>;
};
