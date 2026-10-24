import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Dubai $150K reel (job d24ed130c3d9): the reference's edit in the same beat order (Vaibhav Sisinty, DemQVYbgmmX,
// analysis/spec.md B1-B11): waterfront hook with a $150,000 count-up and two-tier captions, then the atrium for the rest
// with the official championship pages as splits (R1 hero, R3 categories, R5 timeline, R6 register form), in-house panels
// (launch, apps -> agents, how it works, Agent of the Year, the $750,000 FAQ line), the category roll, the register button
// and the comment-keyword ending. Timing: data.json (build-reel.py in the job).
loadFont({family: 'DbInter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'DbInter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'DbInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'DbInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'DbSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});

const D: any = data;
const FPS = 30;
const SANS = 'DbInter, Arial, sans-serif', SERIF = 'DbSerif, Georgia, serif';
const BLUE = '#2F7BFF', CAP_BLUE = '#5B9BFF', NAVY = '#0A1230', INK = '#111111', GOLD = '#FFD25A', RED = '#FF3B30';
const PURPLE = 'linear-gradient(135deg, #2A1E6B 0%, #6B2FA8 55%, #C2408F 100%)';
const file = (s: string) => staticFile('dubai/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 12, stiffness: 170}}));
const usd = (v: number) => '$' + Math.round(v).toLocaleString('en-US');

type Unit = {kind: string; from: number; to: number; [k: string]: any};
type Ov = {kind: string; from: number; to: number; [k: string]: any};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];

// The take (and its RVM matte) on the output clock: one silent pause is cut at D.cut.at (the look change).
const Take: React.FC<{alpha?: boolean; style: React.CSSProperties}> = ({alpha, style}) => {
  const src = file(alpha ? 'take_alpha.webm' : 'take.mp4');
  return <>
    <Sequence from={0} durationInFrames={D.cut.at} layout="none"><OffthreadVideo src={src} muted transparent={alpha} style={style}/></Sequence>
    <Sequence from={D.cut.at} layout="none"><OffthreadVideo src={src} muted transparent={alpha} trimBefore={D.cut.at + D.cut.skip} style={style}/></Sequence>
  </>;
};

const Brand: React.FC<{top: number; left?: number}> = ({top, left = 48}) =>
  <div style={{position: 'absolute', left, top, fontFamily: SANS, fontWeight: 800, fontSize: 20, letterSpacing: 6, color: '#ffffffb8', textShadow: '0 1px 6px #0008'}}>WITHHAMMAD</div>;

// ---------------------------------------------------------------- base layouts
const Face: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const z = u.push ? (u.zoom - 0.06) + 0.06 * ease(ramp(f, u.from, u.to)) : u.zoom || 1;   // progressive punch-in
  return <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
    <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 30%'}}>
      <Take style={{width: 1080, height: 1920}}/>
    </AbsoluteFill>
    <Brand top={1440}/>
  </AbsoluteFill>;
};

const LOGOS: Record<string, {src: string; w: number; h: number; bg: string}> = {
  champ: {src: 'champ_logo_alpha.png', w: 300, h: 100, bg: '#fff'},
  chamber: {src: 'dc_chamber_digital_white.png', w: 150, h: 65, bg: NAVY},
};
const S = 0.72, TAKE_W = 1080 * S, TAKE_X = (1080 - TAKE_W) / 2, TAKE_Y = 1010, CARD_Y = 1340;
const PANEL = {x: 60, y: 330, w: 960, h: 670};
const Split: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from;
  const enter = ease(ramp(n, 0, 8));
  const logo = u.logo ? LOGOS[u.logo] : null;
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: 'scale(1.18)', filter: 'blur(30px) brightness(0.5) saturate(0.9)'}}><Take style={{width: 1080, height: 1920}}/></AbsoluteFill>
    <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y + (1 - enter) * 60, width: PANEL.w, height: PANEL.h, borderRadius: 28, overflow: 'hidden',
      background: u.src ? '#fff' : NAVY, boxShadow: '0 30px 80px rgba(0,0,0,.5)', opacity: enter}}>
      {u.src ? <Rec u={u}/> : <Panel u={u} f={f}/>}
      {u.roll ? <Roll f={f}/> : null}
    </div>
    {logo ? <div style={{position: 'absolute', left: PANEL.x + PANEL.w - logo.w - 100, top: PANEL.y - 46, background: logo.bg, borderRadius: 999,
      padding: '16px 34px', boxShadow: '0 10px 30px rgba(0,0,0,.35)', opacity: enter, display: 'flex', alignItems: 'center'}}>
      <Img src={file(logo.src)} style={{width: logo.w, height: logo.h, objectFit: 'contain'}}/></div> : null}
    <div style={{position: 'absolute', left: TAKE_X, top: CARD_Y, width: TAKE_W, height: 1920 - CARD_Y + 120, borderRadius: 110, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: TAKE_Y - CARD_Y, width: TAKE_W, height: 1920 * S}}><Take style={{width: TAKE_W, height: 1920 * S}}/></div>
    </div>
    <div style={{position: 'absolute', left: TAKE_X, top: TAKE_Y, width: TAKE_W, height: CARD_Y - TAKE_Y + 1, overflow: 'hidden'}}>
      <Take alpha style={{position: 'absolute', left: 0, top: 0, width: TAKE_W, height: 1920 * S}}/>
    </div>
  </AbsoluteFill>;
};

const Rec: React.FC<{u: Unit}> = ({u}) => {
  const k = PANEL.h / u.h, recW = 1080 * k, recH = 1800 * k;
  return <Sequence from={u.from} durationInFrames={u.to - u.from} layout="none">
    <OffthreadVideo src={file(u.src)} muted trimBefore={Math.round(u.srcStart * FPS)} playbackRate={u.rate || 1}
      style={{position: 'absolute', left: (PANEL.w - recW) / 2, top: -u.y0 * k, width: recW, height: recH}}/></Sequence>;
};

// ---------------------------------------------------------------- in-house panels (inside the split card, 960 x 670)
const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = '#ffffffb0'}) =>
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 4, color}}>{children}</div>;
const Source: React.FC<{children: React.ReactNode}> = ({children}) =>
  <div style={{position: 'absolute', left: 48, bottom: 30, fontFamily: SANS, fontWeight: 500, fontSize: 22, color: '#ffffff80'}}>{children}</div>;

const Panel: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const G = D.gfx;
  if (u.gfx === 'launch') {
    const a = pop(f, u.from + 2), b = pop(f, G.launch.name), c = pop(f, G.launch.title);
    return <AbsoluteFill style={{background: `radial-gradient(circle at 80% 10%, #3B2A8A, ${NAVY} 70%)`, padding: '54px 48px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: a}}>
        <Kicker>LAUNCHED 7 OCT 2026</Kicker>
        <div style={{background: '#fff', borderRadius: 18, padding: '10px 18px'}}><Img src={file('champ_logo_alpha.png')} style={{width: 230, height: 76, objectFit: 'contain'}}/></div>
      </div>
      <div style={{marginTop: 70, fontFamily: SANS, fontWeight: 500, fontSize: 34, color: '#ffffffb0', opacity: b}}>Launched by</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, lineHeight: 1.05, color: '#fff', transform: `translateX(${(1 - b) * -80}px)`, opacity: b}}>
        H.H. Sheikh Hamdan<br/>bin Mohammed</div>
      <div style={{marginTop: 26, display: 'inline-block', alignSelf: 'flex-start', background: BLUE, borderRadius: 999, padding: '12px 30px', fontFamily: SANS, fontWeight: 900,
        fontSize: 40, color: '#fff', boxShadow: `0 0 40px ${BLUE}99`, transform: `scale(${0.7 + 0.3 * c})`, transformOrigin: '0 50%', opacity: c}}>CROWN PRINCE OF DUBAI</div>
      <Source>Organised by Dubai Chamber of Digital Economy</Source>
    </AbsoluteFill>;
  }
  if (u.gfx === 'apps') {
    const s = ease(ramp(f, G.apps.strike, G.apps.strike + 8)), ag = pop(f, G.apps.agents);
    const tiles: [string, string][] = [['15,500+', 'ENTRIES'], ['153', 'COUNTRIES'], ['140+', 'APPS LAUNCHED']];
    const pan = -30 * ramp(f, u.from, u.to);
    return <AbsoluteFill style={{background: `linear-gradient(160deg, #141C44, ${NAVY})`, padding: '48px 48px'}}>
      <div style={{position: 'relative', alignSelf: 'flex-start'}}>
        <Kicker>CREATE APPS CHAMPIONSHIP · 3 EDITIONS</Kicker>
        <div style={{position: 'absolute', left: -6, top: 14, height: 6, width: `${s * 104}%`, background: RED, borderRadius: 3}}/></div>
      <div style={{display: 'flex', gap: 22, marginTop: 34, transform: `translateX(${pan}px)`, opacity: 1 - 0.55 * s}}>
        {tiles.map(([v, l], i) => { const p = pop(f, u.from + 3 + i * 4);
          return <div key={i} style={{flex: 1, background: '#ffffff12', border: '2px solid #ffffff24', borderRadius: 24, padding: '28px 20px', transform: `translateY(${(1 - p) * 40}px)`, opacity: p}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff'}}>{v}</div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: '#ffffff99', marginTop: 6}}>{l}</div></div>; })}
      </div>
      <div style={{marginTop: 46, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * ag})`, opacity: Math.min(1, ag * 2)}}>
        <div style={{background: PURPLE, borderRadius: 999, padding: '20px 46px', fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff',
          boxShadow: '0 0 60px #C2408F88'}}>2026: AI AGENTS</div></div>
      <Source>Create Apps figures: Emirates 24|7, 7 Oct 2026</Source>
    </AbsoluteFill>;
  }
  if (u.gfx === 'steps') {
    const steps: [string, string, string][] = [['01', 'IDENTIFY', 'a real problem'], ['02', 'BUILD', 'an AI agent'], ['03', 'VALIDATE', 'that it solves it']];
    return <AbsoluteFill style={{background: `linear-gradient(160deg, #141C44, ${NAVY})`, padding: '48px 48px'}}>
      <Kicker>HOW THE CHAMPIONSHIP WORKS</Kicker>
      <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 30}}>
        {steps.map(([n, t, b], i) => { const p = pop(f, G.steps[i]);
          return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 26, background: p > 0.5 && i === G.steps.filter((x: number) => f >= x).length - 1 ? '#2F7BFF26' : '#ffffff10',
            border: `2px solid ${i === G.steps.filter((x: number) => f >= x).length - 1 ? BLUE : '#ffffff22'}`, borderRadius: 24, padding: '20px 28px',
            transform: `translateX(${(1 - p) * 120}px)`, opacity: Math.min(1, p * 2)}}>
            <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 48, color: BLUE, width: 80}}>{n}</div>
            <div><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 46, color: '#fff'}}>{t}</div>
              <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 32, color: '#ffffffb0'}}>{b}</div></div></div>; })}
      </div>
    </AbsoluteFill>;
  }
  if (u.gfx === 'year') {
    const title = 'DUBAI AI AGENT OF THE YEAR', n = Math.max(0, Math.min(title.length, Math.floor((f - G.year.title) * 1.6)));
    const glitch = f >= G.year.title && f < G.year.title + 12 && (f % 3 === 0) ? (random(f) - 0.5) * 18 : 0;
    const one = pop(f, G.year.one);
    return <AbsoluteFill style={{background: NAVY}}>
      <Img src={file('ai_mark.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55,
        transform: `scale(${1.05 + 0.05 * ramp(f, u.from, u.to)})`}}/>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #0A123088 0%, #0A1230ee 75%)'}}/>
      <div style={{position: 'absolute', left: 48, top: 48, transform: `scale(${one})`, transformOrigin: '0 0', background: '#ffffff1f', border: '2px solid #ffffff40',
        borderRadius: 999, padding: '10px 24px', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: '#fff'}}>1 of the 4 category winners</div>
      <div style={{position: 'absolute', left: 48, right: 48, bottom: 140, fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.02, color: '#fff',
        textShadow: `${glitch}px 0 0 #C2408F, ${-glitch}px 0 0 ${BLUE}`}}>{title.slice(0, n)}<span style={{opacity: n < title.length ? 1 : 0, color: BLUE}}>|</span></div>
      <div style={{position: 'absolute', left: 48, bottom: 70, fontFamily: SANS, fontWeight: 700, fontSize: 32, color: GOLD, opacity: ramp(f, G.year.title + 30, G.year.title + 38)}}>
        + extra funding on top</div>
    </AbsoluteFill>;
  }
  if (u.gfx === 'faq') {
    const open = ease(ramp(f, G.faq.open, G.faq.open + 10)), k = ease(ramp(f, G.faq.count, G.faq.land));
    const land = pop(f, G.faq.land);
    return <AbsoluteFill style={{background: '#fff', padding: '46px 48px'}}>
      <Kicker color="#5B6175">OFFICIAL FAQ · DUBAICHAMBERDIGITAL.COM</Kicker>
      <div style={{marginTop: 26, borderTop: '2px solid #E3E5EC', borderBottom: '2px solid #E3E5EC', padding: '22px 0'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 38, color: '#1B2550'}}>
          What grants are available?
          <svg width={36} height={36} viewBox="0 0 24 24" style={{transform: `rotate(${180 * open}deg)`}}><path d="m6 9 6 6 6-6" stroke="#1B2550" strokeWidth={2.5} fill="none"/></svg></div>
        <div style={{overflow: 'hidden', height: 80 * open}}>
          <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 500, fontSize: 34, color: '#3A4154', background: `rgba(47,123,255,${0.14 * land})`, borderRadius: 8, padding: '4px 8px',
            display: 'inline-block'}}>"A total of USD 750,000 in grants is available."</div></div>
      </div>
      <div style={{marginTop: 34, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 150, lineHeight: 1, color: NAVY, fontVariantNumeric: 'tabular-nums',
        transform: `scale(${1 + 0.06 * land - 0.06 * ramp(f, G.faq.land + 4, G.faq.land + 12)})`}}>{usd(750000 * k)}</div>
      <div style={{marginTop: 10, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: BLUE, opacity: land}}>IN GRANTS, IN TOTAL</div>
    </AbsoluteFill>;
  }
  return null;
};

// Slot-machine category roll over the R3 recording (reference 35.1-40.2 s).
const CATS = ['BEST SOCIETAL AI AGENT', 'BEST PERSONAL AI AGENT', 'BEST BUSINESS AI AGENT', 'BEST YOUTH AI AGENT'];
const Roll: React.FC<{f: number}> = ({f}) => {
  const at = D.gfx.roll;
  const idx = at.slice(0, 4).filter((x: number) => f >= x).length - 1;
  if (idx < 0) return null;
  const k = ease(ramp(f, at[idx], at[idx] + 6));
  const u21 = pop(f, at[4]);
  return <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, background: 'linear-gradient(180deg, #0A123000, #0A1230f0 40%)'}}>
    <div style={{position: 'absolute', left: 40, bottom: 44, height: 84, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: BLUE}}>{idx + 1}/4</div>
      <div style={{position: 'relative', height: 84, width: 680, overflow: 'hidden'}}>
        {idx > 0 ? <div style={{position: 'absolute', top: -84 * k + 14, fontFamily: SANS, fontWeight: 900, fontSize: 50, color: '#fff', whiteSpace: 'nowrap'}}>{CATS[idx - 1]}</div> : null}
        <div style={{position: 'absolute', top: 84 * (1 - k) + 14, fontFamily: SANS, fontWeight: 900, fontSize: 50, color: '#fff', whiteSpace: 'nowrap'}}>{CATS[idx]}</div></div></div>
    {u21 > 0 ? <div style={{position: 'absolute', right: 40, bottom: 140, transform: `scale(${u21})`, background: GOLD, borderRadius: 999, padding: '10px 26px',
      fontFamily: SANS, fontWeight: 900, fontSize: 38, color: INK}}>UNDER 21</div> : null}
  </div>;
};

// ---------------------------------------------------------------- overlays
const Money: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), k = ease(ramp(f, o.from, o.land)), l = pop(f, o.land);
  return <div style={{position: 'absolute', top: 760, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, p * 2),
    transform: `scale(${0.6 + 0.4 * p})`}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 190, lineHeight: 1, letterSpacing: -4, color: GOLD, fontVariantNumeric: 'tabular-nums',
      textShadow: '0 4px 0 #B8862A, 0 10px 0 #7A5512, 0 18px 40px rgba(0,0,0,.6)', transform: `scale(${1 + 0.08 * l - 0.08 * ramp(f, o.land + 4, o.land + 12)})`}}>{usd(o.value * k)}</div>
    <div style={{marginTop: 22, background: '#000', padding: '8px 22px', fontFamily: SANS, fontWeight: 900, fontSize: 40, letterSpacing: 1, color: '#fff', opacity: l}}>{o.sub.toUpperCase()}</div>
    <div style={{marginTop: 10, fontFamily: SANS, fontWeight: 700, fontSize: 26, color: '#ffffffd0', textShadow: '0 2px 8px #000a', opacity: l}}>{o.aed}</div>
  </div>;
};

const Rain: React.FC<{o: Ov; f: number}> = ({o, f}) => <>{Array.from({length: 26}, (_, i) => {
  const n = f - o.from - random(`d${i}`) * 18, x = random(`x${i}`) * 1080, sp = 26 + random(`s${i}`) * 18;
  if (n < 0) return null;
  const y = -120 + n * sp, r = (random(`r${i}`) - 0.5) * 80 + n * (random(`w${i}`) - 0.5) * 8;
  return <div key={i} style={{position: 'absolute', left: x, top: y, width: 120, height: 56, borderRadius: 6, background: 'linear-gradient(135deg, #3E8E4E, #2B6B39)',
    border: '3px solid #A7D3A0', transform: `rotate(${r}deg) rotateX(${n * 12}deg)`, opacity: 1 - ramp(f, o.to - 8, o.to), boxShadow: '0 6px 14px rgba(0,0,0,.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: '#D9F0D2'}}>$</div>;
})}</>;

const Burst: React.FC<{o: Ov; f: number}> = ({o, f}) => <>{Array.from({length: 18}, (_, i) => {
  const n = f - o.from;
  if (n < 0) return null;
  const a = (i / 18) * Math.PI * 2 + random(`a${i}`) * 0.3, d = ease(Math.min(1, n / 20)) * (260 + random(`d${i}`) * 160);
  return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * d - 55, top: 560 + Math.sin(a) * d * 0.8 - 25, width: 110, height: 50, borderRadius: 6,
    background: 'linear-gradient(135deg, #3E8E4E, #2B6B39)', border: '3px solid #A7D3A0', transform: `rotate(${a * 57 + n * 6}deg)`, opacity: 1 - ramp(f, o.to - 10, o.to),
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 28, color: '#D9F0D2'}}>$</div>;
})}</>;

// Two-tier hook captions (reference 0-8.5 s): small white setup line over a big white italic serif line, y 60-67 %.
const Hook: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const k = o.phrases.filter((p: any) => f >= p.at).length - 1;
  if (k < 0) return null;
  const p = o.phrases[k], a = pop(f, p.at), b = pop(f, p.at + 3);
  return <div style={{position: 'absolute', top: 1150, left: 60, width: 880, textAlign: 'center', textShadow: '0 3px 14px rgba(0,0,0,.7), 0 0 3px rgba(0,0,0,.5)'}}>
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 46, color: '#fff', opacity: a, transform: `translateY(${(1 - a) * 16}px)`}}>{p.small}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 112, lineHeight: 1.0, color: '#fff', opacity: b, transform: `scale(${0.85 + 0.15 * b})`}}>{p.big}</div>
  </div>;
};

const Flash: React.FC<{o: Ov; f: number}> = ({o, f}) =>
  <AbsoluteFill style={{background: '#fff', opacity: 1 - Math.abs((f - (o.from + o.to) / 2) / ((o.to - o.from) / 2 + 0.01))}}/>;

const Place: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from);
  return <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `translateY(${(1 - p) * -30}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 999, padding: '14px 32px', boxShadow: '0 10px 28px rgba(0,0,0,.35)',
      fontFamily: SANS, fontWeight: 900, fontSize: 42, color: INK}}>
      <svg width={40} height={40} viewBox="0 0 24 24" fill={RED}><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"/></svg>
      {o.text}</div></div>;
};

const CHIP_ICONS: Record<string, React.ReactNode> = {
  check: <path d="M20 6 9 17l-5-5"/>,
  cap: <><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
};
const Chip: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from);
  const top = o.slot === undefined ? 260 : 250 + o.slot * 110;
  return <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 16, background: BLUE, borderRadius: 999, padding: '14px 34px', boxShadow: `0 0 40px ${BLUE}aa, 0 10px 28px rgba(0,0,0,.35)`,
      fontFamily: SANS, fontWeight: 900, fontSize: 46, color: '#fff'}}>
      <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">{CHIP_ICONS[o.icon]}</svg>
      {o.text}</div></div>;
};

const Strike: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), s = ease(ramp(f, o.strikeAt + 4, o.strikeAt + 12));
  return <div style={{position: 'absolute', top: 260, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{position: 'relative', background: '#fff', borderRadius: 18, padding: '14px 34px', fontFamily: SANS, fontWeight: 900, fontSize: 56, color: INK,
      boxShadow: '0 10px 28px rgba(0,0,0,.35)'}}>
      <span style={{fontFamily: 'Menlo, monospace', color: BLUE}}>{'</>'}</span> {o.text}
      <div style={{position: 'absolute', left: -10, top: '48%', width: `${s * 106}%`, height: 14, borderRadius: 7, background: RED, transform: 'rotate(-6deg)', transformOrigin: '0 50%'}}/></div></div>;
};

const Register: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const p = pop(f, o.from), c = pop(f, o.closeAt);
  const shine = ((f - o.from) % 45) / 45;
  return <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
    <div style={{position: 'relative', overflow: 'hidden', background: BLUE, borderRadius: 999, padding: '26px 64px', transform: `scale(${p})`,
      boxShadow: `0 0 60px ${BLUE}cc, 0 14px 34px rgba(0,0,0,.4)`, display: 'flex', alignItems: 'center', gap: 22, fontFamily: SANS, fontWeight: 900, fontSize: 62, color: '#fff'}}>
      REGISTER NOW
      <div style={{display: 'flex'}}>{[0, 1, 2].map(i => <svg key={i} width={34} height={44} viewBox="0 0 24 24" style={{marginLeft: -10, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5 - i * 0.7)),
        transform: `translateX(${Math.sin(f / 5 - i * 0.7) * 4}px)`}}><path d="m9 6 6 6-6 6" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round"/></svg>)}</div>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + shine * 160}%`, width: '22%', background: 'linear-gradient(90deg, #ffffff00, #ffffff70, #ffffff00)',
        transform: 'skewX(-20deg)'}}/></div>
    <div style={{background: '#fff', borderRadius: 999, padding: '10px 28px', fontFamily: SANS, fontWeight: 800, fontSize: 36, color: INK, transform: `scale(${c})`,
      boxShadow: '0 8px 22px rgba(0,0,0,.3)'}}>Closes January 2027</div>
  </div>;
};

// call-to-action skill, ending A: a clean copy of the native comment box types the keyword, then the DM + link card.
const Cta: React.FC<{o: Ov; f: number}> = ({o, f}) => {
  const up = pop(f, o.from), word = 'AGENT';
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - o.typeAt) * 8 / FPS) + 1)));
  const dm = pop(f, o.dmAt), card = pop(f, o.dmAt + 9);
  return <>
    <div style={{position: 'absolute', left: 70, right: 150, top: 1110, transform: `translateY(${(1 - up) * 500}px)`, background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.4)', padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 22}}>
      <Img src={file('avatar_face.jpg')} style={{width: 72, height: 72, borderRadius: 99}}/>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: typed && f >= o.typeAt ? 800 : 500, fontSize: 44, color: f >= o.typeAt ? INK : '#8e8e93'}}>
        {f >= o.typeAt ? typed : 'Add a comment…'}{f >= o.typeAt && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= o.dmAt ? <div style={{position: 'absolute', left: 120, top: 1300, transform: `scale(${dm})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: INK}}>Here's how to enter, step by step</div> : null}
    {f >= o.dmAt + 9 ? <div style={{position: 'absolute', left: 120, top: 1384, width: 640, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 84, height: 84, borderRadius: 16, background: '#fff', border: '2px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={file('champ_mark_alpha.png')} style={{width: 70, height: 50, objectFit: 'contain'}}/></div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: INK}}>How to enter + idea checklist</div>
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 22, color: '#6b6b6b'}}>withhammad.com/resources/dubai-ai-agents…</div></div></div> : null}
  </>;
};

const Overlays: React.FC<{f: number; u: Unit}> = ({f, u}) => <>{D.overlays.filter((o: Ov) => f >= o.from && f < o.to).map((o: Ov, i: number) => {
  const onFace = u.kind === 'face';
  switch (o.kind) {
    case 'money': return onFace ? <Money key={i} o={o} f={f}/> : null;
    case 'rain': return <Rain key={i} o={o} f={f}/>;
    case 'burst': return onFace ? <Burst key={i} o={o} f={f}/> : null;
    case 'hook': return <Hook key={i} o={o} f={f}/>;
    case 'flash': return <Flash key={i} o={o} f={f}/>;
    case 'place': return onFace ? <Place key={i} o={o} f={f}/> : null;
    case 'chip': return onFace ? <Chip key={i} o={o} f={f}/> : null;
    case 'strike': return onFace ? <Strike key={i} o={o} f={f}/> : null;
    case 'register': return onFace ? <Register key={i} o={o} f={f}/> : null;
    case 'cta': return <Cta key={i} o={o} f={f}/>;
    default: return null;
  }
})}</>;

// ---------------------------------------------------------------- captions: word-by-word build (spoken white, next 45 %)
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const cta = D.overlays.some((o: Ov) => o.kind === 'cta' && f >= o.from && f < o.to);
  const y = u.kind === 'split' ? 1068 : cta ? 960 : 1300;
  const size = u.kind === 'split' ? 62 : 76;
  const lines: any[][] = [[]];
  c.words.forEach((w: any) => { lines[lines.length - 1].push(w); if (w.br) lines.push([]); });
  return <div style={{position: 'absolute', left: 40, right: 130, top: y, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: SANS, fontWeight: 800,
    fontSize: size, lineHeight: 1.12, letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.5)'}}>
    <div style={{display: 'inline-block', background: 'rgba(0,0,0,.55)', borderRadius: 18, padding: '10px 26px'}}>
    {lines.filter(l => l.length).map((l, i) => <div key={i} style={{whiteSpace: 'nowrap'}}>{l.map((w: any, j: number) =>
      <span key={j} style={{color: f >= w.at ? (w.emph ? CAP_BLUE : '#fff') : 'rgba(255,255,255,.45)'}}>{j ? ' ' : ''}{w.text}</span>)}</div>)}</div></div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  return <AbsoluteFill style={{background: '#000', fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    {u.kind === 'face' ? <Face u={u} f={f}/> : null}
    {u.kind === 'split' ? <Split u={u} f={f}/> : null}
    <Overlays f={f} u={u}/>
    <Captions f={f} u={u}/>
  </AbsoluteFill>;
};
