import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Lemo-Opuscar reel (job b95794dc72cf): @v.i.s.h.ai's edit in the same order (analysis/visual.md): split screen with
// film b-roll on top and the face below, frosted white headline cards, one-word caption pills on the seam, glass
// checklists, step pills 01/02/03, a comment-keyword ending. Film b-roll = LemoLab's own demo films (CC BY 4.0, credited
// on screen). Polish over the reference: correct facts (66 styles, Claude Code plugin, real install commands), larger
// type, WITHHAMMAD navy/blue accents, every overlay held long enough to read. Timing: data.json (build-reel.py).
loadFont({family: 'OpInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'OpInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'OpInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'OpMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'OpMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'OpInter, Arial, sans-serif', MONO = 'OpMono, Menlo, monospace';
const NAVY = '#0B1020', INK = '#10131C', BLUE = '#3D7BFF', SKY = '#8FB4FF', GREEN = '#2BD576', RED = '#FF4D4D', CLAY = '#D97757';
const SEAM = 900;            // split screen: film/recording above, face below (reference ~47/53)
const file = (s: string) => staticFile('opuscar/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 14, stiffness: 190}}));
const blurIn = (f: number, at: number, n = 5) => ({filter: `blur(${(1 - ease(ramp(f, at, at + n))) * 10}px)`, opacity: ramp(f, at, at + n)});

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const SPLIT = new Set(['title', 'repo', 'allown', 'montage', 'install', 'terminal', 'prompt', 'output']);
const FACE = new Set(['nomodel', 'complete', 'own', 'boom', 'caveat', 'cta', 'simple']);

// ---------------------------------------------------------------- face (HeyGen take; placeholder face while stand-in)
const Take: React.FC<{y?: number; scale?: number; blur?: number}> = ({y = 0, scale = 1, blur = 0}) =>
  <AbsoluteFill style={{transform: `translateY(${y}px) scale(${scale})`, transformOrigin: '50% 27%', filter: blur ? `blur(${blur}px)` : undefined}}>
    <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/></AbsoluteFill>;

const Brand: React.FC<{top: number}> = ({top}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.7)', textShadow: '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>;

// ---------------------------------------------------------------- film b-roll (LemoLab demo films, CC BY 4.0)
type Shot = {film: string; in: number; from: number};
const Credit: React.FC<{h: number}> = ({h}) =>
  <div style={{position: 'absolute', right: 150, top: h - 52, fontFamily: SANS, fontWeight: 600, fontSize: 20, color: 'rgba(255,255,255,.82)',
    background: 'rgba(0,0,0,.45)', padding: '5px 12px', borderRadius: 8}}>Demo films: LemoLab · CC BY 4.0</div>;

// Each Films shot is mounted from its own start so the in-point plays from the cut: wrap with a frame offset.
const FilmPanel: React.FC<{list: Shot[]; f: number; h: number}> = ({list, f, h}) => {
  const k = list.reduce((a, s, i) => (f >= s.from ? i : a), 0), s = list[k];
  const nxt = list[k + 1]?.from ?? s.from + 120, z = 1 + 0.05 * ramp(f, s.from, nxt);
  const sc = Math.max(1080 / 1600, h / 900), w = 1600 * sc * z, hh = 900 * sc * z;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: h, overflow: 'hidden', background: '#000'}}>
    <div style={{position: 'absolute', left: (1080 - w) / 2, top: (h - hh) / 2, width: w, height: hh}}>
      <FilmFrame s={s}/></div>
    <Credit h={h}/>
  </div>;
};
// One shot of a film, playing from its in-point on the frame the shot starts
const FilmFrame: React.FC<{s: Shot}> = ({s}) =>
  <Sequence key={s.film + s.from} from={s.from} layout="none">
    <OffthreadVideo src={file(s.film + '.mp4')} muted startFrom={Math.round(s.in * FPS)} style={{width: '100%', height: '100%'}}/></Sequence>;

// ---------------------------------------------------------------- shared UI
const Card: React.FC<{f: number; at: number; kicker: string; big: string; sub?: React.ReactNode; top: number; size?: number; dark?: boolean}> =
  ({f, at, kicker, big, sub, top, size = 120, dark}) => {
    const p = pop(f, at), b = blurIn(f, at, 6);
    return <div style={{position: 'absolute', left: 70, right: 70, top, display: 'flex', justifyContent: 'center', transform: `scale(${0.86 + 0.14 * p})`, ...b}}>
      <div style={{background: dark ? 'rgba(20,24,38,.86)' : 'rgba(250,250,252,.94)', borderRadius: 40, padding: '30px 54px 36px', textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,.35)', border: dark ? '1.5px solid rgba(143,180,255,.3)' : '1px solid rgba(255,255,255,.8)'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: dark ? SKY : '#4A5068'}}>{kicker}</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: size, letterSpacing: -size * 0.035, lineHeight: 1.02, color: dark ? '#fff' : INK, whiteSpace: 'nowrap', marginTop: 6}}>{big}</div>
        {sub ? <div style={{marginTop: 14}}>{sub}</div> : null}
      </div></div>;
  };

const Chip: React.FC<{f: number; at: number; text: string; icon?: 'check' | 'x' | 'code' | 'none'; strike?: number; light?: boolean; size?: number}> =
  ({f, at, text, icon = 'check', strike, light, size = 40}) => {
    const p = pop(f, at), s = strike ? ease(ramp(f, strike, strike + 8)) : 0;
    if (f < at) return null;
    return <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, background: light ? '#fff' : 'rgba(18,22,36,.9)', border: light ? 'none' : '1.5px solid rgba(143,180,255,.3)',
      borderRadius: 999, padding: icon === 'none' ? '14px 32px' : '12px 30px 12px 14px', transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2), boxShadow: '0 12px 30px rgba(0,0,0,.35)', position: 'relative'}}>
      {icon !== 'none' ? <Tick kind={icon} size={size + 4}/> : null}
      <span style={{fontFamily: SANS, fontWeight: 800, fontSize: size, color: light ? INK : '#fff', whiteSpace: 'nowrap'}}>{text}</span>
      {s > 0 ? <div style={{position: 'absolute', left: 70, top: '50%', height: 5, width: `calc((100% - 96px) * ${s})`, background: RED, borderRadius: 3}}/> : null}
    </div>;
  };
const Tick: React.FC<{kind: string; size?: number; on?: number}> = ({kind, size = 40, on = 1}) => <div style={{width: size, height: size, borderRadius: size, flex: 'none',
  background: kind === 'x' ? RED : kind === 'code' ? '#2A3350' : on ? BLUE : 'rgba(255,255,255,.12)', border: on ? 'none' : '2px solid rgba(255,255,255,.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * on})`}}>
  {kind === 'code' ? <span style={{fontFamily: MONO, fontWeight: 700, fontSize: size * 0.42, color: SKY}}>{'</>'}</span>
    : <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 20 20">{kind === 'x'
      ? <path d="M5 5 L15 15 M15 5 L5 15" stroke="#fff" strokeWidth={3.2} strokeLinecap="round"/>
      : <path d="M4 10.5 L8.5 15 L16 5.5" stroke="#fff" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={on}/>}</svg>}</div>;

// Glass checklist: rows tick on their spoken word (reference "ALL ON ITS OWN" / "CLAUDE DOES IT ALL").
const Checklist: React.FC<{f: number; title: string; rows: [string, number][]; x: number; y: number; w: number}> = ({f, title, rows, x, y, w}) => {
  const p = pop(f, rows[0][1] - 4);
  return <div style={{position: 'absolute', left: x, top: y, width: w, background: 'rgba(14,18,30,.78)', backdropFilter: 'blur(14px)', borderRadius: 30,
    border: '1.5px solid rgba(143,180,255,.28)', padding: '26px 32px', boxShadow: '0 20px 50px rgba(0,0,0,.45)', transform: `translateY(${(1 - p) * 40}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, letterSpacing: 6, color: SKY, marginBottom: 14}}>{title}</div>
    {rows.map(([t, a], i) => {
      const on = ease(ramp(f, a, a + 6));
      return <div key={i} style={{display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0', opacity: 0.45 + 0.55 * on}}>
        <Tick kind="check" size={42} on={on}/>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#fff', whiteSpace: 'nowrap'}}>{t}</span></div>;
    })}</div>;
};

const StepPill: React.FC<{f: number; at: number; n: string; text: string; y?: number}> = ({f, at, n, text, y = 236}) => {
  const p = pop(f, at);
  return <div style={{position: 'absolute', left: 60, top: y, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(250,250,252,.95)', borderRadius: 999,
    padding: '10px 30px 10px 10px', boxShadow: '0 12px 30px rgba(0,0,0,.4)', transform: `translateX(${(1 - p) * -50}px)`, opacity: Math.min(1, p * 2)}}>
    <div style={{width: 56, height: 56, borderRadius: 28, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
    <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 38, color: INK, whiteSpace: 'nowrap'}}>{text}</span></div>;
};

const Stage: React.FC<{children?: React.ReactNode}> = ({children}) => <AbsoluteFill style={{background: NAVY, overflow: 'hidden'}}>
  <AbsoluteFill style={{background: `radial-gradient(circle 900px at 540px 1300px, rgba(61,123,255,.28), rgba(11,16,32,0) 70%), radial-gradient(circle 700px at 100px 150px, rgba(61,123,255,.14), rgba(11,16,32,0) 70%)`}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(143,180,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(143,180,255,.06) 1px, transparent 1px)',
    backgroundSize: '72px 72px', maskImage: 'radial-gradient(circle 900px at 540px 900px, #000 30%, transparent 80%)'}}/>
  {children}<Brand top={1490}/></AbsoluteFill>;

// Floating browser window holding a real recording (reference scenes 4, 9, 18)
const Window: React.FC<{f: number; from: number; url: string; children: React.ReactNode; top?: number; h?: number}> = ({f, from, url, children, top = 300, h = 1000}) => {
  const p = pop(f, from);
  return <div style={{position: 'absolute', left: 60, top, width: 960, height: h, borderRadius: 30, overflow: 'hidden', background: '#0d1117', boxShadow: '0 40px 90px rgba(0,0,0,.55)',
    border: '1.5px solid rgba(143,180,255,.25)', transform: `translateY(${(1 - p) * 80}px) scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, p * 2)}}>
    <div style={{height: 64, background: '#161b26', display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px'}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}}/>)}
      <div style={{marginLeft: 18, flex: 1, background: '#0d1117', borderRadius: 12, padding: '8px 18px', fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#9aa4b8'}}>{url}</div></div>
    <div style={{position: 'relative', width: 960, height: h - 64, overflow: 'hidden'}}>{children}</div></div>;
};

// A recording clip that starts playing (from startS) on the unit's first frame
const Clip: React.FC<{src: string; from: number; startS?: number; style?: React.CSSProperties}> = ({src, from, startS = 0, style}) =>
  <Sequence key={src + from} from={from} layout="none">
    <OffthreadVideo src={file(src)} muted startFrom={Math.round(startS * FPS)} style={style}/></Sequence>;

// ---------------------------------------------------------------- scenes
const Split: React.FC<{u: Unit; f: number; top: React.ReactNode; children?: React.ReactNode}> = ({top, children}) => <AbsoluteFill style={{background: '#000'}}>
  <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1920 - SEAM, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: -SEAM, width: 1080, height: 1920}}><Take y={SEAM - 215 + 30}/></div>
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 70%, rgba(0,0,0,.4) 100%)'}}/>
  </div>
  <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden'}}>{top}</div>
  <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 3, height: 6, background: '#000'}}/>
  <Brand top={1730}/>
  {children}
</AbsoluteFill>;

const Title: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = f - u.from, cnt = Math.round(interpolate(n, [0, 40], [43, 66], clamp));
  return <Split u={u} f={f} top={<FilmPanel list={D.shots.title} f={f} h={SEAM}/>}>
    <div style={{position: 'absolute', left: 60, top: 236, background: 'rgba(14,18,30,.8)', borderRadius: 999, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 14, height: 14, borderRadius: 7, background: GREEN}}/><span style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#fff'}}>Made 100% in code</span></div>
    <div style={{position: 'absolute', left: 80, right: 80, top: 360, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(250,250,252,.95)', borderRadius: 40, padding: '28px 50px 34px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.45)'}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 8, color: '#4A5068'}}>CLAUDE CODE CAN NOW MAKE</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: -6, lineHeight: 1.0, color: INK, whiteSpace: 'nowrap'}}>Short Films</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 38, color: '#4A5068', marginTop: 4}}>in <b style={{color: BLUE, fontWeight: 900}}>{cnt}</b> different film styles</div>
      </div></div>
  </Split>;
};

const NoModel: React.FC<{u: Unit; f: number}> = ({u, f}) => <>
  <Take/><Brand top={1500}/>
  <Card f={f} at={D.beats.nomodel - 4} kicker="YOU DON'T NEED A" big="Video Model" top={930} size={116}
    sub={<Chip f={f} at={D.beats.nomodel + 6} text="Every frame is code" icon="code" size={34}/>}/>
</>;

const Repo: React.FC<{u: Unit; f: number}> = ({u, f}) => <Split u={u} f={f}
  top={<div style={{position: 'absolute', inset: 0, background: '#0d1117'}}><div style={{position: 'absolute', left: -20, top: 120, width: 1080 * 2, height: 1350 * 2, transform: `scale(${1 + 0.05 * ramp(f, u.from, u.to)})`, transformOrigin: '15% 12%'}}>
    <Clip src="r_repo.mp4" from={u.from} startS={0.4} style={{width: 2160, height: 2700}}/></div></div>}/>;

const Readme: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [mit, plug, lab] = D.beats.readme;
  return <Stage>
    <Window f={f} from={u.from} url="github.com/lemomo-ai/lemo-opuscar" top={250} h={820}>
      <div style={{position: 'absolute', left: 0, top: -120, width: 960, height: 1200}}>
        <Clip src="r_repo.mp4" from={u.from} startS={4.6} style={{width: 960, height: 1200}}/></div>
    </Window>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1100, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, padding: '0 60px'}}>
      <Chip f={f} at={plug} text="Claude Code plugin" icon="code"/>
      <Chip f={f} at={mit} text="Free · MIT license" icon="check"/>
      <Chip f={f} at={lab} text="by LemoLab" icon="none" light/>
    </div>
  </Stage>;
};

const OneLine: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.oneline, prompt = 'Make me a film about my product launch';
  const typed = prompt.slice(0, Math.max(0, Math.floor((f - a) * 30 / FPS)));
  const arrow = ease(ramp(f, b - 16, b - 4));
  return <Stage>
    <div style={{position: 'absolute', left: 0, right: 0, top: 470, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 9, color: SKY, ...blurIn(f, u.from)}}>ONE LINE IN</div>
    <div style={{position: 'absolute', left: 90, right: 90, top: 540, background: '#161b2a', borderRadius: 26, border: '2px solid rgba(143,180,255,.35)', padding: '30px 34px',
      fontFamily: MONO, fontWeight: 500, fontSize: 38, color: '#fff', ...blurIn(f, u.from)}}><span style={{color: CLAY}}>{'> '}</span>{typed}<span style={{opacity: (f >> 3) % 2 ? 1 : 0.2, color: SKY}}>▍</span></div>
    <svg style={{position: 'absolute', left: 500, top: 690}} width={80} height={220}><path d={`M40 10 L40 ${10 + 170 * arrow}`} stroke={SKY} strokeWidth={6} strokeLinecap="round"/>
      {arrow > 0.95 ? <path d="M18 160 L40 186 L62 160" stroke={SKY} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round"/> : null}</svg>
    <Card f={f} at={b} kicker="OUT COMES" big="A finished film" top={930} size={100}/>
  </Stage>;
};

const AllOwn: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const t = D.beats.allown;
  return <Split u={u} f={f} top={<FilmPanel list={D.shots.allown} f={f} h={SEAM}/>}>
    <Checklist f={f} title="ALL ON ITS OWN" x={60} y={250} w={640} rows={[['Every frame in code', t[0]], ['Score written', t[1]], ['Voiceover generated', t[2]], ['Sound effects added', t[3]]]}/>
  </Split>;
};

const Complete: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.complete;
  return <><Take/><Brand top={1500}/>
    <Card f={f} at={a - 3} kicker="WHAT YOU GET BACK" big="Complete film" top={920} size={118}
      sub={<Chip f={f} at={b} text="Not just a clip" icon="x" strike={b + 10} size={34}/>}/></>;
};

const Gallery: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const n = Math.round(interpolate(f, [u.from + 4, D.beats.gallery + 6], [52, 66], clamp));
  return <Stage>
    <Window f={f} from={u.from} url="lemomo-ai.github.io/lemo-opuscar" top={430} h={900}>
      <div style={{position: 'absolute', left: 0, top: -40, width: 960, height: 1200}}><Clip src="r_gallery.mp4" from={u.from} startS={2.2} style={{width: 960, height: 1200}}/></div>
    </Window>
    <div style={{position: 'absolute', left: 0, right: 0, top: 225, display: 'flex', justifyContent: 'center', ...blurIn(f, u.from)}}>
      <div style={{background: 'rgba(250,250,252,.96)', borderRadius: 30, padding: '12px 46px 18px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,.45)'}}>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 112, color: INK, letterSpacing: -4, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{n}</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 6, color: '#4A5068'}}>READY-MADE STYLES</div></div></div>
  </Stage>;
};

const CATS = ['Print', 'Graphic design', 'Cinema', 'Games', 'Anime', '3D'];
const Montage: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const k = D.beats.montage.reduce((a: number, t: number, i: number) => (f >= t ? i : a), 0);
  const at = D.beats.montage[k], p = pop(f, at);
  return <Split u={u} f={f} top={<FilmPanel list={D.shots.montage} f={f} h={SEAM}/>}>
    <div style={{position: 'absolute', left: 60, top: 236, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: '0 50%', background: 'rgba(250,250,252,.95)', borderRadius: 999, padding: '10px 30px',
      fontFamily: SANS, fontWeight: 900, fontSize: 40, color: INK, boxShadow: '0 10px 30px rgba(0,0,0,.4)'}}>{CATS[k]}</div>
    <div style={{position: 'absolute', right: 150, top: 236, background: 'rgba(14,18,30,.8)', borderRadius: 18, padding: '8px 20px', fontFamily: MONO, fontWeight: 700, fontSize: 34, color: '#fff'}}>
      {String(k + 1).padStart(2, '0')} / 06</div>
  </Split>;
};

const Own: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.own, p = pop(f, a), q = pop(f, b - 4);
  return <><Take/><Brand top={1500}/>
    <div style={{position: 'absolute', left: 60, top: 960, background: 'rgba(250,250,252,.95)', borderRadius: 34, padding: '24px 38px', boxShadow: '0 20px 50px rgba(0,0,0,.4)',
      transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: '0 0', opacity: Math.min(1, p * 2)}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 6, color: '#4A5068'}}>TAKE</div>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 68, color: INK, letterSpacing: -2}}>Any style</div>
      <div style={{opacity: Math.min(1, q * 2), marginTop: 6}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 6, color: '#4A5068'}}>→ MAKE IT</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 68, color: BLUE, letterSpacing: -2}}>Your own</div></div>
    </div></>;
};

const Simple: React.FC<{u: Unit; f: number}> = ({u, f}) => <>
  <Take blur={interpolate(f - u.from, [0, 8], [0, 22], clamp)} scale={1.06}/>
  <AbsoluteFill style={{background: 'rgba(8,10,18,.45)'}}/>
  <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', ...blurIn(f, u.from + 2, 7)}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 9, color: 'rgba(255,255,255,.85)'}}>SETUP IS</div>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, letterSpacing: -6, color: '#fff', lineHeight: 1.05}}>Super simple</div>
    <div style={{display: 'inline-block', marginTop: 18, background: '#fff', color: INK, borderRadius: 999, padding: '10px 34px', fontFamily: SANS, fontWeight: 900, fontSize: 38, transform: `scale(${pop(f, D.beats.simple)})`}}>3 steps</div>
  </div><Brand top={1500}/></>;

const Install: React.FC<{u: Unit; f: number}> = ({u, f}) => <Split u={u} f={f}
  top={<div style={{position: 'absolute', inset: 0, background: '#0d1117'}}><div style={{position: 'absolute', left: -200, top: -330, width: 1080 * 1.5, height: 1350 * 1.5,
    transform: `scale(${1 + 0.05 * ramp(f, u.from, u.to)})`, transformOrigin: '30% 50%'}}>
    <Clip src="r_install.mp4" from={u.from} startS={2.6} style={{width: 1620, height: 2025}}/></div></div>}>
  <StepPill f={f} at={u.from + 2} n="01" text="Copy the install commands"/>
</Split>;

const CMDS = ['claude plugin marketplace add lemomo-ai/lemo-opuscar', 'claude plugin install lemo-opuscar@lemolab'];
const Terminal: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a] = D.beats.terminal, per = Math.max(10, Math.floor((u.to - a - 8) / 2));
  return <Split u={u} f={f} top={<div style={{position: 'absolute', inset: 0, background: '#0b0e15', padding: '320px 44px 0'}}>
    <div style={{background: '#11151f', borderRadius: 24, border: '1.5px solid rgba(143,180,255,.22)', padding: '28px 34px', minHeight: 480, boxShadow: '0 20px 50px rgba(0,0,0,.5)'}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 28, color: '#6b7489', marginBottom: 20}}>Terminal · ~/projects</div>
      {CMDS.map((c, i) => {
        const t0 = a + i * per, shown = f >= t0 ? c.slice(0, Math.floor((f - t0) * c.length / (per * 0.6))) : '';
        const done = f >= t0 + per * 0.75;
        return f >= t0 ? <div key={i} style={{fontFamily: MONO, fontWeight: 500, fontSize: 42, color: '#fff', lineHeight: 1.4, marginBottom: 22, wordBreak: 'break-all'}}>
          <span style={{color: GREEN}}>$ </span>{shown}{done ? <span style={{color: GREEN}}>  ✓</span> : null}</div> : null;
      })}
    </div></div>}>
    <StepPill f={f} at={u.from + 2} n="02" text="Paste in your terminal"/>
  </Split>;
};

const Boom: React.FC<{u: Unit; f: number}> = ({u, f}) => <>
  <Take scale={1.14}/><Brand top={1500}/>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center'}}>
    <Chip f={f} at={D.beats.installed} text="Installed" light size={56}/></div></>;

const PROMPT = 'Make me a film about Claude Code in the 60s spy title style';
const Prompt: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.prompt;
  const typed = PROMPT.slice(0, Math.max(0, Math.round(interpolate(f, [a, b - 4], [0, PROMPT.length], clamp))));
  return <Split u={u} f={f} top={<div style={{position: 'absolute', inset: 0, background: '#0b0e15', padding: '320px 44px 0'}}>
    <div style={{background: '#11151f', borderRadius: 24, border: '1.5px solid rgba(143,180,255,.22)', padding: '24px 30px', boxShadow: '0 20px 50px rgba(0,0,0,.5)'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18}}><span style={{color: CLAY, fontSize: 34}}>✻</span>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff'}}>Claude Code</span>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 22, color: '#6b7489', marginLeft: 'auto'}}>lemo-opuscar skill</span></div>
      <div style={{border: '2px solid rgba(143,180,255,.35)', borderRadius: 16, padding: '22px 26px', fontFamily: MONO, fontWeight: 500, fontSize: 46, color: '#fff', lineHeight: 1.35, minHeight: 330}}>
        <span style={{color: CLAY}}>{'> '}</span>{typed}<span style={{opacity: (f >> 3) % 2 ? 1 : 0.2, color: SKY}}>▍</span></div>
    </div></div>}>
    <StepPill f={f} at={u.from + 2} n="03" text="Type what you want"/>
  </Split>;
};

const Output: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const t = D.beats.output;
  return <Split u={u} f={f} top={<FilmPanel list={D.shots.output} f={f} h={SEAM}/>}>
    <Checklist f={f} title="CLAUDE DOES IT ALL" x={60} y={236} w={600} rows={[['Writes the story', t[0]], ['Draws every shot', t[1]], ['Scores the music', t[2]], ['Adds the SFX', t[3]], ['Hands you the film', t[4]]]}/>
  </Split>;
};

const USES = ['Launch videos', 'Explainers', 'Product teasers', 'Styles you could never draw by hand'];
const UseCases: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const k = D.beats.usecases.reduce((a: number, t: number, i: number) => (f >= t ? i : a), 0), p = pop(f, D.beats.usecases[k]);
  return <Stage>
    <Window f={f} from={u.from} url="your-film.mp4" top={560} h={64 + 540}>
      <div style={{position: 'absolute', inset: 0}}><FilmPanelWide list={D.shots.usecases} f={f}/></div>
    </Window>
    <div style={{position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(250,250,252,.96)', borderRadius: 999, padding: '14px 40px', fontFamily: SANS, fontWeight: 900, fontSize: k === 3 ? 40 : 54, color: INK,
        transform: `scale(${0.8 + 0.2 * p})`, boxShadow: '0 16px 40px rgba(0,0,0,.45)', whiteSpace: 'nowrap'}}>{USES[k]}</div></div>
  </Stage>;
};
const FilmPanelWide: React.FC<{list: Shot[]; f: number}> = ({list, f}) => {
  const k = list.reduce((a, s, i) => (f >= s.from ? i : a), 0), s = list[k];
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}><FilmFrame s={s}/>
    <div style={{position: 'absolute', right: 14, bottom: 12, fontFamily: SANS, fontWeight: 600, fontSize: 18, color: 'rgba(255,255,255,.85)', background: 'rgba(0,0,0,.45)', padding: '4px 10px', borderRadius: 8}}>Demo films: LemoLab · CC BY 4.0</div></div>;
};

const Caveat: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [paid, time, love, worth] = D.beats.caveat;
  return <><Take/><Brand top={1500}/>
    {f < love - 2 ? <div style={{position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
      <Chip f={f} at={paid} text="Runs on a paid Claude plan" icon="check" size={38}/>
      <Chip f={f} at={time} text="About 30-60 min per film" icon="check" size={38}/></div>
      : <Card f={f} at={love - 2} kicker="FOR CREATORS" big="New formats" top={930} size={112}
        sub={<Chip f={f} at={worth} text="One tool worth a look →" icon="none" light size={32}/>}/>}
  </>;
};

const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, dm} = D.beats.cta, word = 'FILM', up = pop(f, type - 4);
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - type) * 10 / FPS) + 1)));
  const d = pop(f, dm), card = pop(f, dm + 8);
  return <><Take/><Brand top={1500}/>
    <div style={{position: 'absolute', left: 70, right: 160, top: 880, transform: `translateY(${(1 - up) * 400}px)`, opacity: Math.min(1, up * 2), background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 62, height: 62, borderRadius: 31, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: f >= type ? 900 : 600, fontSize: 48, color: f >= type ? NAVY : '#8e8e93'}}>
        {f >= type ? typed : 'Add a comment…'}{f >= type && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= dm ? <div style={{position: 'absolute', left: 110, top: 1036, transform: `scale(${d})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: NAVY}}>Here's the Lemo-Opuscar link 🎬</div> : null}
    {f >= dm + 8 ? <div style={{position: 'absolute', left: 110, top: 1116, width: 760, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 88, height: 88, borderRadius: 18, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 30, color: BLUE}}>66</div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: NAVY}}>Setup + first film prompt</div>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources</div></div></div> : null}
  </>;
};

// ---------------------------------------------------------------- captions: one word, caps; keywords on a white pill
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c || u.kind === 'cta' && f >= D.beats.cta.type - 4) return null;
  const y = SPLIT.has(u.kind) ? SEAM : FACE.has(u.kind) ? 1405 : 1405;
  const p = ease(ramp(f, c.from, c.from + 4));
  return <div style={{position: 'absolute', left: 0, right: 0, top: y, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center'}}>
    <div style={{background: c.emph ? '#fff' : 'rgba(10,12,20,.62)', color: c.emph ? INK : '#fff', borderRadius: 16, padding: '6px 22px 8px', fontFamily: SANS, fontWeight: 900,
      fontSize: 66, letterSpacing: -1, lineHeight: 1.1, filter: `blur(${(1 - p) * 6}px)`, opacity: 0.3 + 0.7 * p, transform: `scale(${0.94 + 0.06 * p})`, whiteSpace: 'nowrap'}}>{c.text}</div></div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  const S: Record<string, React.FC<{u: Unit; f: number}>> = {title: Title, nomodel: NoModel, repo: Repo, readme: Readme, oneline: OneLine, allown: AllOwn,
    complete: Complete, gallery: Gallery, montage: Montage, own: Own, simple: Simple, install: Install, terminal: Terminal, boom: Boom, prompt: Prompt,
    output: Output, usecases: UseCases, caveat: Caveat, cta: Cta};
  const Scene = S[u.kind];
  return <AbsoluteFill style={{background: NAVY, fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    <Scene u={u} f={f}/>
    <Captions f={f} u={u}/>
    {D.standin ? <div style={{position: 'absolute', top: 150, right: 40, background: RED, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 26, padding: '8px 16px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div> : null}
  </AbsoluteFill>;
};
