import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Rubber World reel (job 8bcf01ad1b0f): rebuild of @morrow.studio3d DfDF_diPhmi, beat for beat (analysis/spec.md).
// The 3D plate is our own Blender 5.2 render (blender/main.py, Eevee): voxel guy (beard = Hammad), Claude box,
// night grid stage, a city that builds itself, the Times Square rubber payoff. This layer adds what the reference
// draws in 2D: speaker-coloured captions (guy white, Claude salmon, one yellow keyword), step headers with the
// 5-dash progress, the terminal, check, sources, code, render and cost cards, and the comment-keyword ending.
// Wrong facts fixed: no unverifiable view counts, "almost nobody" instead of "nobody", 5 steps (not "7 prompts"),
// cost = Blender free + Claude Code on a Pro plan, the real frame count and render time of THIS video.
loadFont({family: 'RwInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'RwInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'RwInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'RwMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'RwMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'RwInter, Arial, sans-serif', MONO = 'RwMono, Menlo, monospace';
const YEL = '#FFD21F', SALMON = '#F2A88A', CAP_C = '#FFD9C7', GREEN = '#2BD576', RED = '#FF4D4D', GLASS = 'rgba(12,16,40,0.78)';
const file = (s: string) => staticFile('rubberworld/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 200}}));
const S = (n: string): [number, number] => D.shots[n];
const inShot = (f: number, ...ns: string[]) => ns.some((n) => f >= S(n)[0] && f < S(n)[1]);
const T = (s: number) => Math.round(s * FPS);
const lineStart = (i: number) => T(D.lines[i].start);
const wordAt = (line: number, w: string) => {
  const x = D.words.find((q: any) => q.line === line && q.w.toLowerCase().replace(/[.,?!]/g, '') === w);
  return x ? T(x.s) : lineStart(line);
};
const shadow = '0 3px 10px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.6)';

// ---------------------------------------------------------------- header pill (+ 5-step progress)
const HEAD: {shots: string[]; a: string; b: string; step?: number; from?: () => number; to?: () => number}[] = [
  {shots: ['wide_panel', 'close_shock'], a: 'CLAUDE MADE ', b: 'THIS'},
  {shots: ['back_panel', 'wall'], a: '56 VIDEOS · ', b: 'ALL CODE'},
  {shots: ['close_how'], a: 'NOBODY SHOWS YOU ', b: 'HOW'},
  {shots: ['claude_s1', 'laptop_ots'], a: 'STEP 1 · ', b: 'ONE LINE', step: 1},
  {shots: ['two_mid'], a: 'STEP 1 · ', b: 'IT CHECKS WHO POSTED IT', step: 1, to: () => lineStart(9) - 4},
  {shots: ['two_mid'], a: 'STEP 2 · ', b: 'SOURCES', step: 2, from: () => lineStart(9) - 4},
  {shots: ['floor_high'], a: 'STEP 3 · ', b: 'NOT AI VIDEO', step: 3},
  {shots: ['city_grow'], a: 'STEP 3 · ', b: "IT'S CODE", step: 3},
  {shots: ['city_cars', 'close_cant'], a: '352 ', b: 'CARS'},
  {shots: ['claude_never'], a: 'YOU NEVER WRITE ', b: 'THE CODE'},
  {shots: ['claude_s4'], a: 'STEP 4 · ', b: 'IT FIXES ITS OWN WORK', step: 4},
  {shots: ['laptop_s5'], a: 'STEP 5 · ', b: 'YOUR LAPTOP RENDERS IT', step: 5},
  {shots: ['close_cost'], a: 'THE ', b: 'COST'},
  {shots: ['claude_cost', 'close_thatsit'], a: '$0 ', b: 'EXTRA SOFTWARE'},
  {shots: ['claude_steps'], a: '5 ', b: 'STEPS'},
  {shots: ['close_cta', 'wide_end'], a: 'FULL TUTORIAL → ', b: 'COMMENT WORLD'},
];
const Header: React.FC<{f: number}> = ({f}) => {
  const h = HEAD.find((x) => inShot(f, ...x.shots) && (!x.from || f >= x.from()) && (!x.to || f < x.to()));
  if (!h) return null;
  const st = Math.max(S(h.shots[0])[0], h.from ? h.from() : 0);
  const p = pop(f, st);
  return <div style={{position: 'absolute', top: 232, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
    transform: `translateY(${(1 - p) * -30}px)`, opacity: Math.min(1, p * 1.5)}}>
    <div style={{background: 'rgba(8,10,26,0.72)', borderRadius: 18, padding: '14px 28px', fontFamily: SANS, fontWeight: 900,
      fontSize: 40, letterSpacing: 0.5, color: '#fff', textShadow: shadow}}>{h.a}<span style={{color: YEL}}>{h.b}</span></div>
    {h.step ? <div style={{display: 'flex', gap: 10, marginTop: 14}}>{[1, 2, 3, 4, 5].map((i) =>
      <div key={i} style={{width: 46, height: 8, borderRadius: 4, background: i <= h.step! ? YEL : 'rgba(255,255,255,0.22)',
        transform: i === h.step ? `scaleX(${ease(ramp(f, st + 4, st + 14))})` : undefined}}/>)}</div> : null}
  </div>;
};

// ---------------------------------------------------------------- captions: 1-3 word phrases, speaker colour, one yellow keyword
const KEY = ['six', 'claude', 'millions', 'you', 'fifty-five', 'code', 'how', 'one', 'line', 'rubber', 'searched', 'nobody\'s',
  'two', 'fact', 'video', 'world', 'times', 'square', 'three', 'fifty-two', "can't", 'never', 'four', 'fix', 'five', 'blender',
  'seventeen', 'cost', 'free', 'pro', 'steps', 'world,', 'tutorial'];
const phrases = (() => {
  const out: {ws: any[]; s: number; e: number; who: string}[] = [];
  let cur: any[] = [];
  const flush = () => { if (cur.length) out.push({ws: cur, s: cur[0].s, e: cur[cur.length - 1].e, who: cur[0].who}); cur = []; };
  for (const w of D.words) {
    if (cur.length && (cur[0].line !== w.line)) flush();
    cur.push(w);
    if (/[.,?!]$/.test(w.w) || cur.length >= 3) flush();
  }
  flush();
  return out;
})();
const Captions: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const ph = phrases.find((p, i) => t >= p.s - 0.05 && t < (phrases[i + 1] ? Math.min(phrases[i + 1].s - 0.05, p.e + 0.6) : p.e + 0.6));
  if (!ph) return null;
  const k = ph.ws.find((w) => KEY.includes(w.w.toLowerCase().replace(/[.,?!]/g, '')));
  const at = T(ph.s - 0.05);
  const p = ease(ramp(f, at, at + 4));
  return <div style={{position: 'absolute', top: 1270, left: 130, right: 130, textAlign: 'center', WebkitTextStroke: '14px rgba(10,10,24,0.92)', paintOrder: 'stroke fill', fontFamily: SANS, fontWeight: 900,
    fontSize: 74, lineHeight: 1.1, color: ph.who === 'G' ? '#fff' : CAP_C, textShadow: shadow, letterSpacing: -0.5,
    transform: `scale(${0.9 + 0.1 * p})`, opacity: p}}>
    {ph.ws.map((w, i) => <span key={i} style={{color: w === k ? YEL : undefined}}>{w.w.replace(/[.,]$/, '')}{i < ph.ws.length - 1 ? ' ' : ''}</span>)}
  </div>;
};

// ---------------------------------------------------------------- cards
const Card: React.FC<{top: number; at: number; w?: number; children: React.ReactNode; label?: string}> = ({top, at, w = 900, children, label}) => {
  const f = useCurrentFrame(); const p = pop(f, at);
  return <div style={{position: 'absolute', top, left: (1080 - w) / 2, width: w, background: GLASS, border: '1.5px solid rgba(255,255,255,0.14)',
    borderRadius: 26, padding: '26px 34px', boxShadow: '0 20px 60px rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
    transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, p * 1.4)}}>
    {label ? <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', marginBottom: 16}}>{label}</div> : null}
    {children}
  </div>;
};
const Row: React.FC<{f: number; at: number; left: React.ReactNode; badge: string; color: string; strike?: boolean}> = ({f, at, left, badge, color, strike}) => {
  const p = ease(ramp(f, at, at + 6));
  return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0', opacity: p,
    transform: `translateX(${(1 - p) * -30}px)`, fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#fff'}}>
    <span style={{textDecoration: strike ? 'line-through' : undefined, opacity: strike ? 0.55 : 1}}>{left}</span>
    <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color, border: `2px solid ${color}`, borderRadius: 10, padding: '6px 12px',
      transform: `scale(${pop(f, at + 6)})`}}>{badge}</span>
  </div>;
};
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const Overlays: React.FC<{f: number}> = ({f}) => {
  const els: React.ReactNode[] = [];
  // 1. 3:12 AM + last video card
  if (inShot(f, 'close_sad', 'close_punch')) {
    const p = pop(f, 14);
    els.push(<div key="am" style={{position: 'absolute', top: 232, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{background: 'rgba(8,10,26,0.6)', borderRadius: 40, padding: '10px 26px', fontFamily: SANS, fontWeight: 800, fontSize: 38, color: '#fff'}}>3:12 AM</div>
      <div style={{marginTop: 22, background: GLASS, borderRadius: 22, padding: '16px 34px', textAlign: 'center', transform: `scale(${p})`,
        border: '1.5px solid rgba(255,255,255,0.14)'}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: 'rgba(255,255,255,0.6)'}}>YOUR LAST VIDEO</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, color: '#fff'}}><span style={{color: RED}}>▶</span> 6 views</div>
      </div></div>);
  }
  // 2. the big screen: views pill rolls, lands on "millions"
  if (inShot(f, 'wide_panel')) {
    const a = S('wide_panel')[0] + 6, b = wordAt(2, 'millions');
    const n = 1000 * Math.pow(2600, ease(ramp(f, a, b)));
    const landed = f >= b;
    els.push(<div key="pill" style={{position: 'absolute', top: 330, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#fff', borderRadius: 50, padding: '14px 40px', fontFamily: SANS, fontWeight: 900, fontSize: 56, color: '#111',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)', transform: `scale(${landed ? 1 + 0.12 * (1 - ramp(f, b, b + 8)) : 1})`}}>
        <span style={{color: RED}}>▶ </span>{landed ? 'millions of views' : fmt(n)}</div></div>);
  }
  // 3. the wall: 0 -> 56 videos
  if (inShot(f, 'wall')) {
    const [a, b] = S('wall');
    els.push(<div key="wallc" style={{position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900,
      color: YEL, fontSize: 150, textShadow: shadow, lineHeight: 1}}>{Math.round(56 * ease(ramp(f, a + 2, b - 10)))}
      <div style={{fontSize: 40, color: '#fff', letterSpacing: 4}}>VIDEOS · EVERY FRAME CODE</div></div>);
  }
  // 4. terminal: the one line, typed on the spoken words
  if (inShot(f, 'laptop_ots')) {
    const full = 'What if all rubber disappeared for 5 seconds?';
    const a = wordAt(7, 'what'), b = T(D.lines[7].end);
    const n = Math.round(full.length * ramp(f, a, b));
    els.push(<Card key="term" top={340} at={S('laptop_ots')[0]} label="● ● ●   claude">
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 38, color: '#fff', lineHeight: 1.35, minHeight: 104}}>
        <span style={{color: SALMON}}>&gt; </span>{full.slice(0, n)}<span style={{opacity: f % 16 < 8 ? 1 : 0, color: YEL}}>▌</span></div></Card>);
  }
  // 5. premise check, then sources
  if (inShot(f, 'two_mid')) {
    const s9 = lineStart(9) - 4;
    if (f < s9) {
      const a = lineStart(8);
      els.push(<Card key="chk" top={360} at={S('two_mid')[0]} label="PREMISE CHECK · BEFORE A SINGLE WORD">
        <Row f={f} at={a + 4} left="What if all rubber disappeared?" badge="RARE ✓" color={GREEN}/>
        <Row f={f} at={a + 22} left="What if NYC had a tsunami?" badge="OVERDONE ✗" color={RED}/>
        <Row f={f} at={a + 40} left={<span style={{color: YEL}}>→ go with the rare one</span>} badge="PICK" color={YEL}/>
      </Card>);
    } else {
      els.push(<Card key="src" top={360} at={s9} label="EVERY NUMBER GETS A SOURCE">
        <Row f={f} at={wordAt(9, 'source')} left="Tire rubber: 60% synthetic" badge="MICHELIN ✓" color={GREEN}/>
        <Row f={f} at={wordAt(9, 'every')} left="NYC has 13,587 yellow cabs" badge="NYC TLC ✓" color={GREEN}/>
        <Row f={f} at={wordAt(9, 'fact')} left="“Tires are pure rubber”" badge="NO SOURCE ✗" color={RED} strike/>
      </Card>);
    }
  }
  // 6. NOT AI VIDEO stamp
  if (inShot(f, 'floor_high')) {
    const a = wordAt(11, 'not');
    const p = f < a ? 0 : spring({frame: f - a, fps: FPS, config: {damping: 9, stiffness: 260}});
    const shake = f >= a && f < a + 8 ? Math.sin(f * 3) * (8 - (f - a)) : 0;
    els.push(<div key="stamp" style={{position: 'absolute', top: 360, left: 0, right: 0, display: 'flex', justifyContent: 'center',
      transform: `translateX(${shake}px)`}}>
      <div style={{border: `8px solid ${RED}`, color: RED, borderRadius: 18, padding: '10px 34px', fontFamily: SANS, fontWeight: 900, fontSize: 96,
        transform: `rotate(-8deg) scale(${f < a ? 0 : 2.2 - 1.2 * p})`, opacity: f < a ? 0 : Math.min(1, p * 2),
        background: 'rgba(40,0,0,0.35)', textShadow: shadow}}>AI VIDEO ✗</div></div>);
  }
  // 7. the code card: Blender python, typed while the city rises
  if (inShot(f, 'city_grow')) {
    const code = ['import bpy', 'city = build_city(blocks=100, cars=352)', 'street = build_street("times square")',
      'for car in street.cars:', '    car.tires.vanish(at=0.85)', 'render(fps=30, size=(1080, 1920))'];
    const [a, b] = S('city_grow');
    const total = code.join('\n').length; const n = Math.round(total * ramp(f, a + 2, b - 6));
    let left = n;
    els.push(<Card key="code" top={340} at={a} label="SCENE.PY · WRITTEN BY CLAUDE">
      {code.map((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length + 1;
        return <div key={i} style={{fontFamily: MONO, fontWeight: 500, fontSize: 30, color: '#d8def5', whiteSpace: 'pre', lineHeight: 1.45, minHeight: 43}}>
          {s.split(/(\d+|"[^"]*"?)/).map((p, j) => <span key={j} style={{color: /^\d/.test(p) ? YEL : p.startsWith('"') ? '#9be59b' : undefined}}>{p}</span>)}
        </div>; })}
    </Card>);
  }
  // 8. car counter + phone inset of the real render
  if (inShot(f, 'city_cars')) {
    const [a, b] = S('city_cars'); const c = Math.round(352 * ramp(f, a + 3, b - 8));
    const p = pop(f, a + 6);
    els.push(<div key="cars">
      <div style={{position: 'absolute', top: 360, left: 60, background: GLASS, borderRadius: 18, padding: '10px 22px'}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,0.6)', letterSpacing: 3}}>CARS</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 84, color: YEL, lineHeight: 1}}>{c}</div></div>
      <div style={{position: 'absolute', top: 350, right: 60, width: 300, height: 560, borderRadius: 40, border: '10px solid #0a0a10',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', transform: `translateY(${(1 - p) * 80}px) rotate(${4 - 4 * p}deg)`, opacity: p}}>
        <Img src={file('street.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></div>
      <div style={{position: 'absolute', top: 922, right: 60, width: 300, textAlign: 'center', fontFamily: MONO, fontSize: 22, color: '#fff', opacity: p}}>the real render</div>
    </div>);
  }
  // 9. frame check: two of our real frames, the two real problems fixed in this build
  if (inShot(f, 'claude_s4')) {
    const a = S('claude_s4')[0]; const chk = wordAt(15, 'check'); const fix = wordAt(15, 'fix');
    const thumb = (src: string, note: string, x: number) => <div style={{position: 'relative', width: 390}}>
      <Img src={file(src)} style={{width: 390, height: 300, objectFit: 'cover', borderRadius: 14, display: 'block'}}/>
      <div style={{position: 'absolute', left: x, top: 90, width: 150, height: 110, borderRadius: '50%', border: `5px solid ${f >= fix ? GREEN : RED}`,
        opacity: ramp(f, chk, chk + 6), transform: `scale(${pop(f, chk)})`}}/>
      <div style={{marginTop: 10, fontFamily: SANS, fontWeight: 800, fontSize: 26, color: f >= fix ? GREEN : RED, opacity: ramp(f, chk + 4, chk + 10)}}>
        {f >= fix ? 'FIXED ✓' : note}</div></div>;
    els.push(<Card key="qa" top={340} at={a} label="IT CHECKS ITS OWN FRAMES">
      <div style={{display: 'flex', gap: 24}}>{thumb('fix_crop.jpg', 'head cropped', 120)}{thumb('fix_block.jpg', 'screen blocked', 120)}</div>
    </Card>);
  }
  // 10. render progress: this video's real frame count and render time
  if (inShot(f, 'laptop_s5')) {
    const [a, b] = S('laptop_s5'); const p = ease(ramp(f, a + 4, b - 6));
    const mins = D.render.minutes * p;
    els.push(<Card key="rnd" top={340} at={a} label={`RENDERING · BLENDER 5.2 · ON THIS MAC`}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14, fontFamily: SANS, fontWeight: 900, color: '#fff'}}>
        <span style={{fontSize: 84, color: YEL}}>{fmt(D.render.frames * p)}</span>
        <span style={{fontSize: 34, opacity: 0.8}}>/ {fmt(D.render.frames)} frames</span></div>
      <div style={{height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)', marginTop: 12}}>
        <div style={{height: 14, borderRadius: 7, width: `${p * 100}%`, background: YEL}}/></div>
      <div style={{fontFamily: MONO, fontSize: 28, color: '#fff', marginTop: 12, display: 'flex', justifyContent: 'space-between'}}>
        <span>{Math.floor(mins / 60)}:{String(Math.floor(mins % 60)).padStart(2, '0')} h</span>
        <span style={{color: YEL}}>~{Math.round(D.render.minutes / 60)} h · shared Mac</span></div>
    </Card>);
  }
  // 11. cost
  if (inShot(f, 'claude_cost')) {
    const a = S('claude_cost')[0]; const pro = wordAt(18, 'claude');
    els.push(<Card key="cost" top={340} at={a} w={820}>
      <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 150, color: GREEN, lineHeight: 1}}>$0</div>
      <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#fff', marginTop: 10}}>Blender · free, open source</div>
      <div style={{textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, color: SALMON, marginTop: 10, opacity: ramp(f, pro, pro + 6)}}>
        Claude Code · included in Claude Pro ($20/mo)</div>
    </Card>);
  }
  // 12. five steps
  if (inShot(f, 'claude_steps')) {
    const a = wordAt(20, 'five'); const p = pop(f, a);
    els.push(<div key="five" style={{position: 'absolute', top: 340, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 900,
      color: YEL, fontSize: 260, lineHeight: 1, textShadow: shadow, transform: `scale(${p})`}}>5
      <div style={{fontSize: 44, color: '#fff', letterSpacing: 6}}>STEPS</div></div>);
  }
  // 13. payoff title + countdown
  if (inShot(f, 'street')) {
    const gone = T(D.payoff.start + 0.85);
    const left = Math.max(0, (gone - f) / FPS);
    els.push(<div key="pay">
      <div style={{position: 'absolute', top: 340, left: 70, right: 70, textAlign: 'center', fontFamily: SANS, fontWeight: 900, fontSize: 70,
        color: '#fff', textShadow: shadow, lineHeight: 1.12}}>What if all <span style={{color: YEL}}>rubber</span> disappeared for 5 seconds?</div>
      <div style={{position: 'absolute', top: 600, left: 70, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#fff', textShadow: shadow}}>
        {f < gone ? 'RUBBER DISAPPEARS IN' : 'RUBBER'}
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 60, color: f < gone ? '#fff' : RED}}>{f < gone ? `${left.toFixed(1)} s` : 'GONE'}</div></div>
    </div>);
  }
  // 14. ending: comment box types WORLD, then the DM card
  if (inShot(f, 'close_cta', 'wide_end')) {
    const a = S('close_cta')[0]; const kw = 'WORLD'; const t0 = wordAt(21, 'comment');
    const n = Math.round(kw.length * ramp(f, t0 + 4, t0 + 16));
    const dm = S('wide_end')[0] + 4; const pd = pop(f, dm);
    els.push(<div key="cta">
      <div style={{position: 'absolute', top: 600, left: 110, right: 110, background: '#fff', borderRadius: 60, padding: '22px 34px',
        display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${pop(f, a + 2)})`, boxShadow: '0 16px 50px rgba(0,0,0,0.45)'}}>
        <div style={{width: 56, height: 56, borderRadius: 28, background: YEL}}/>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 52, color: '#111'}}>{kw.slice(0, n)}<span style={{opacity: f % 16 < 8 && n < kw.length ? 1 : 0}}>|</span></div>
        <div style={{marginLeft: 'auto', fontFamily: SANS, fontWeight: 800, fontSize: 34, color: n >= kw.length ? '#3D7BFF' : '#bbb'}}>Post</div></div>
      <div style={{position: 'absolute', top: 760, left: 150, right: 150, background: GLASS, borderRadius: 26, padding: '20px 28px',
        border: '1.5px solid rgba(255,255,255,0.18)', transform: `translateY(${(1 - pd) * 40}px)`, opacity: pd}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,0.6)', letterSpacing: 2}}>DM · WITHHAMMAD</div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: '#fff', marginTop: 6}}>Here's the full tutorial → <span style={{color: YEL}}>Rubber World</span></div></div>
    </div>);
  }
  return <>{els}</>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background: '#0c1238'}}>
    <OffthreadVideo src={file('plate.mp4')} style={{width: 1080, height: 1920}} muted/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,20,0.45) 100%)'}}/>
    <Overlays f={f}/>
    <Header f={f}/>
    <Captions f={f}/>
    <div style={{position: 'absolute', top: 1470, left: 60, fontFamily: SANS, fontWeight: 900, fontSize: 22,
      letterSpacing: 6, color: 'rgba(255,255,255,0.5)', textShadow: shadow}}>WITHHAMMAD</div>
    {D.standin ? <div style={{position: 'absolute', top: 40, right: 36, background: RED, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 24,
      padding: '8px 16px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div> : null}
    <Audio src={file('mix.wav')}/>
  </AbsoluteFill>;
};
