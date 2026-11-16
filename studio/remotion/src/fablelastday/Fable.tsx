// "Fable 5.2 goes paid tonight: do this first" — WITHHAMMAD's own animated infographic (1080x1350, 11 s seamless loop).
// Own layout in the glow-grid system (navy + #1F5EFF), own prompts. Facts checked 2026-11-16:
// - Fable 5.2's free week on Pro ends Mon 16 Nov, 11:59 pm PT; after that Fable on Pro bills to usage credits.
// - /advisor <alias> is a built-in Claude Code command; Opus 5.x as main model accepts Fable as advisor
//   (code.claude.com/docs/en/advisor). Personal skills live in ~/.claude/skills/<name>/SKILL.md.
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';

export const FPS = 30;
export const LOOP = 330; // 11 s
const W = 1080, H = 1350;
const SANS = 'FLSans, Inter, system-ui, sans-serif';
const MONO = 'FLMono, Menlo, monospace';
const BLUE = '#1F5EFF', BLUE_HI = '#4D86FF';

export const PROMPT_A = 'My free week with you ends tonight. Teach Claude Opus to work the way you do. Write a skill called fable-playbook: what you ask before you start, how you split a task into small steps, and the checks you run before you call it done. Save it in ~/.claude/skills/fable-playbook/.';
export const PROMPT_B = "Run this task with the fable-playbook skill: <your task>. Before you begin, list the playbook steps you will follow. Consult the advisor before you commit to a plan, and again before you say it's done.";

// ---------- timeline (seconds) ----------
const TYPE_A = [0.6, 4.1];
const HANDOFF = [4.2, 5.4];
const TYPE_B = [5.5, 8.7];
const FADE_BACK = [10.3, 11.0]; // cross-fade to the frame-0 state: seamless loop
const STEPS: [number, number][] = [[0.3, 1.6], [1.6, 4.1], [4.1, 5.4], [5.4, 6.5], [6.5, 7.6], [7.6, 9.4]];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ramp = (t: number, [a, b]: number[]) => clamp((t - a) / (b - a));
const env = (t: number, a: number, b: number) =>
  interpolate(t, [a, a + 0.15, b - 0.15, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// ---------- background: navy, blue glow, grid ----------
const Bg: React.FC<{t: number}> = ({t}) => (
  <AbsoluteFill style={{background: '#050A1C'}}>
    <AbsoluteFill style={{background: `radial-gradient(70% 38% at 50% 8%, rgba(31,94,255,0.42), rgba(31,94,255,0) 70%),
      radial-gradient(60% 30% at 50% 100%, rgba(31,94,255,0.30), rgba(31,94,255,0) 70%)`}}/>
    <AbsoluteFill style={{
      backgroundImage: 'linear-gradient(rgba(120,160,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,255,0.09) 1px, transparent 1px)',
      backgroundSize: '54px 54px', backgroundPosition: `0 ${(t / 11) * 54}px`,
      WebkitMaskImage: 'radial-gradient(85% 70% at 50% 45%, #000 40%, transparent 100%)'}}/>
  </AbsoluteFill>
);

// ---------- pieces ----------
const LogoTile: React.FC<{bg: string; glow: string; size?: number}> = ({bg, glow, size = 66}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.27, background: bg, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 34px ${glow}, inset 0 1px 0 rgba(255,255,255,0.35)`}}>
    <div style={{width: size * 0.6, height: size * 0.6, background: '#fff',
      WebkitMaskImage: `url(${staticFile('si-claude.svg')})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}}/>
  </div>
);
const Code: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{fontFamily: MONO, fontSize: 19, fontWeight: 500, color: '#CFE0FF', background: 'rgba(31,94,255,0.22)', border: '1px solid rgba(77,134,255,0.55)',
    borderRadius: 8, padding: '1px 8px', whiteSpace: 'nowrap'}}>{children}</span>
);

type Step = {k: number; title: React.ReactNode; sub: React.ReactNode};
const StepRow: React.FC<{s: Step; hl: number}> = ({s, hl}) => (
  <div style={{position: 'relative', height: 72, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', margin: '0 8px'}}>
    <div style={{position: 'absolute', inset: '2px 0', borderRadius: 14, border: `2px solid ${BLUE_HI}`, background: 'rgba(31,94,255,0.16)',
      boxShadow: '0 0 26px rgba(31,94,255,0.55)', opacity: hl}}/>
    <div style={{position: 'relative', width: 34, height: 34, borderRadius: 99, background: BLUE, color: '#fff', fontWeight: 800, fontSize: 18,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: `0 0 ${10 + 14 * hl}px ${BLUE}`}}>{s.k}</div>
    <div style={{position: 'relative'}}>
      <div style={{fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: '28px'}}>{s.title}</div>
      <div style={{fontSize: 16, fontWeight: 600, color: 'rgba(214,224,255,0.72)', lineHeight: '21px'}}>{s.sub}</div>
    </div>
  </div>
);

const Terminal: React.FC<{label: string; text: string; typed: number; t: number; done: string; doneAt: number}> = ({label, text, typed, t, done, doneAt}) => {
  const ok = clamp((t - doneAt) / 0.3);
  const n = Math.round(text.length * typed);
  const cursor = typed > 0 && typed < 1 ? 1 : 0;
  return (
    <div style={{margin: '0 18px', height: 330, borderRadius: 16, background: 'rgba(4,8,22,0.92)', border: '1px solid rgba(120,160,255,0.28)', overflow: 'hidden'}}>
      <div style={{height: 38, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid rgba(120,160,255,0.16)'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 11, height: 11, borderRadius: 9, background: c}}/>)}
        <span style={{marginLeft: 10, fontFamily: MONO, fontSize: 14, color: 'rgba(214,224,255,0.6)'}}>claude · {label}</span>
      </div>
      <div style={{padding: '12px 16px', fontFamily: MONO, fontSize: 18.5, lineHeight: '28px', color: 'rgba(214,224,255,0.42)', whiteSpace: 'pre-wrap'}}>
        <span style={{color: BLUE_HI, fontWeight: 700}}>&gt; </span>
        <span style={{color: '#F2F6FF'}}>{text.slice(0, n)}</span>
        <span style={{display: 'inline-block', width: 10, height: 21, verticalAlign: -4, background: BLUE_HI, opacity: cursor, marginRight: -10}}/>
        <span>{text.slice(n)}</span>
        <div style={{marginTop: 12, opacity: ok, transform: `translateY(${(1 - ok) * 6}px)`, color: '#7CF0A8', fontWeight: 500}}>{done}</div>
      </div>
    </div>
  );
};

const Card: React.FC<{x: number; kicker: string; kickerColor: string; model: string; tile: React.ReactNode; badge: string; children: React.ReactNode; glow: number}> =
  ({x, kicker, kickerColor, model, tile, badge, children, glow}) => (
    <div style={{position: 'absolute', left: x, top: 430, width: 485, height: 712, borderRadius: 28, background: 'linear-gradient(170deg, rgba(20,32,72,0.92), rgba(9,15,38,0.94))',
      border: `1.5px solid rgba(77,134,255,${0.3 + 0.45 * glow})`, boxShadow: `0 0 ${30 + 40 * glow}px rgba(31,94,255,${0.18 + 0.3 * glow})`}}>
      <div style={{height: 104, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px'}}>
        {tile}
        <div>
          <div style={{fontSize: 17, fontWeight: 800, letterSpacing: 3, color: kickerColor}}>{kicker}</div>
          <div style={{fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -0.8, lineHeight: '42px'}}>{model}</div>
        </div>
        <div style={{flex: 1}}/>
        <span style={{fontSize: 14, fontWeight: 800, letterSpacing: 1.5, color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 99, padding: '5px 12px'}}>{badge}</span>
      </div>
      {children}
    </div>
  );

// ---------- content in the 1080x1350 space ----------
export const Content: React.FC<{t: number}> = ({t}) => {
  const hl = STEPS.map(([a, b]) => env(t, a, b));
  const ta = ramp(t, TYPE_A), tb = ramp(t, TYPE_B);
  const h = Easing.inOut(Easing.cubic)(ramp(t, HANDOFF));
  const leftGlow = Math.max(...hl.slice(0, 3)), rightGlow = Math.max(...hl.slice(3));
  const pulse = 0.5 - 0.5 * Math.cos((t / 1.1) * Math.PI * 2); // 10 pulses per loop, 0 at t=0
  const arc = Math.sin(h * Math.PI);
  const tokX = interpolate(h, [0, 1], [80, 700]), tokY = 1176 - arc * 22;
  return (
    <AbsoluteFill style={{fontFamily: SANS}}>
      {/* kicker */}
      <div style={{position: 'absolute', top: 44, width: W, display: 'flex', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '9px 22px', borderRadius: 99, background: 'rgba(255,60,60,0.12)',
          border: '1.5px solid rgba(255,90,90,0.55)', color: '#FFD9D9', fontSize: 21, fontWeight: 800, letterSpacing: 3.5}}>
          <div style={{width: 12, height: 12, borderRadius: 9, background: '#FF4D4D', boxShadow: `0 0 ${8 + 10 * pulse}px #FF4D4D`, opacity: 0.55 + 0.45 * pulse}}/>
          FREE WEEK ENDS TONIGHT
        </div>
      </div>
      {/* headline: white line + blue pill */}
      <div style={{position: 'absolute', top: 104, width: W, textAlign: 'center', color: '#fff', fontSize: 70, fontWeight: 900, letterSpacing: -2.2,
        textShadow: '0 4px 30px rgba(31,94,255,0.45)'}}>Fable 5.2 goes paid tonight</div>
      <div style={{position: 'absolute', top: 196, width: W, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: `linear-gradient(180deg, ${BLUE_HI}, ${BLUE})`, color: '#fff', fontSize: 74, fontWeight: 900, letterSpacing: -2,
          padding: '4px 40px 10px', borderRadius: 999, boxShadow: `0 0 ${50 + 20 * pulse}px rgba(31,94,255,0.75), inset 0 1px 0 rgba(255,255,255,0.4)`}}>Do this first.</div>
      </div>
      {/* deadline row */}
      <div style={{position: 'absolute', top: 330, width: W, display: 'flex', justifyContent: 'center', gap: 14}}>
        {[
          <><svg width={24} height={24} viewBox="0 0 24 24"><circle cx={12} cy={12} r={10} fill="none" stroke={BLUE_HI} strokeWidth={2.2}/>
            <path d="M12 6.5 V12 L15.5 14" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"/></svg>
            Mon 16 Nov · <span style={{color: BLUE_HI}}>11:59 pm PT</span></>,
          <>Then Fable on Pro uses <span style={{color: '#FFC27A'}}>usage credits</span></>,
        ].map((c, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 16, background: 'rgba(20,32,72,0.75)',
            border: '1px solid rgba(77,134,255,0.35)', color: '#fff', fontSize: 21, fontWeight: 700}}>{c}</div>
        ))}
      </div>

      <Card x={40} kicker="TONIGHT" kickerColor="#FFB08A" model="Fable 5.2" badge="FREE" glow={leftGlow}
        tile={<LogoTile bg="linear-gradient(160deg, #E0845F 0%, #C9623D 100%)" glow="rgba(255,138,91,0.7)"/>}>
        <StepRow hl={hl[0]} s={{k: 1, title: <>Type <Code>/model fable</Code></>, sub: 'Free until 11:59 pm PT tonight.'}}/>
        <StepRow hl={hl[1]} s={{k: 2, title: 'Paste Prompt A', sub: 'Fable writes down how it works.'}}/>
        <StepRow hl={hl[2]} s={{k: 3, title: 'Check the skill saved', sub: '~/.claude/skills/fable-playbook'}}/>
        <div style={{height: 14}}/>
        <Terminal label="Prompt A → Fable" text={PROMPT_A} typed={ta} t={t} done="✓ Wrote fable-playbook/SKILL.md" doneAt={4.15}/>
      </Card>

      <Card x={555} kicker="FROM TUESDAY" kickerColor="#9DBBFF" model="Opus 5.5" badge="YOUR PLAN" glow={rightGlow}
        tile={<LogoTile bg={`linear-gradient(160deg, ${BLUE_HI} 0%, #0B3FB0 100%)`} glow="rgba(31,94,255,0.8)"/>}>
        <StepRow hl={hl[3]} s={{k: 4, title: <>Type <Code>/model opus</Code></>, sub: 'Opus does the everyday work.'}}/>
        <StepRow hl={hl[4]} s={{k: 5, title: <>Type <Code>/advisor fable</Code></>, sub: 'On call for big decisions. Bills to credits.'}}/>
        <StepRow hl={hl[5]} s={{k: 6, title: 'Paste Prompt B', sub: 'Put your real task in <your task>.'}}/>
        <div style={{height: 14}}/>
        <Terminal label="Prompt B → Opus" text={PROMPT_B} typed={tb} t={t} done="● Advising · Fable 5.2" doneAt={8.8}/>
      </Card>

      {/* handoff rail */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <path d="M80 1176 L1000 1176" stroke="rgba(120,160,255,0.3)" strokeWidth={2} strokeDasharray="6 8"/>
        <path d={`M80 1176 L${tokX + 120} 1176`} stroke={BLUE_HI} strokeWidth={2.5} opacity={h > 0 ? 0.9 : 0}/>
        <circle cx={1000} cy={1176} r={6} fill={h >= 1 ? BLUE_HI : 'rgba(120,160,255,0.45)'}/>
      </svg>
      <div style={{position: 'absolute', left: tokX, top: tokY - 24, height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px 0 12px',
        borderRadius: 14, background: 'linear-gradient(180deg, #FFFFFF, #E4ECFF)', boxShadow: `0 0 ${24 + 30 * arc}px rgba(31,94,255,0.8)`,
        transform: `rotate(${arc * -3}deg)`}}>
        <svg width={22} height={27} viewBox="0 0 22 27"><path d="M1 1 H14 L21 8 V26 H1 Z" fill={BLUE}/><path d="M14 1 V8 H21" fill="#9DBBFF"/></svg>
        <span style={{fontFamily: MONO, fontSize: 19, fontWeight: 700, color: '#0B1A40'}}>fable-playbook</span>
        <span style={{fontSize: 14, fontWeight: 800, color: BLUE}}>SKILL.md</span>
      </div>
      <div style={{position: 'absolute', left: 80, top: 1206, fontSize: 17, fontWeight: 700, color: 'rgba(214,224,255,0.7)'}}>Tonight: Fable writes the playbook</div>
      <div style={{position: 'absolute', right: 80, top: 1206, fontSize: 17, fontWeight: 700, color: 'rgba(214,224,255,0.7)'}}>Tuesday: Opus follows it</div>

      {/* footer */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 1258, height: 64, display: 'flex', alignItems: 'center', gap: 14}}>
        <Img src={staticFile('face.jpg')} style={{width: 56, height: 56, borderRadius: 99, border: `2.5px solid ${BLUE_HI}`, boxShadow: '0 0 18px rgba(31,94,255,0.7)'}}/>
        <div style={{lineHeight: 1.1}}>
          <div style={{fontSize: 24, fontWeight: 800, color: '#fff'}}>Hammad</div>
          <div style={{fontSize: 17, fontWeight: 600, color: 'rgba(214,224,255,0.7)'}}>@with.hammad</div>
        </div>
        <div style={{flex: 1}}/>
        <div style={{fontSize: 20, fontWeight: 900, letterSpacing: 6, color: '#fff'}}>WITH<span style={{color: BLUE_HI}}>HAMMAD</span></div>
      </div>
    </AbsoluteFill>
  );
};

const Layer: React.FC<{t: number; scale: number; x: number; y: number}> = ({t, scale, x, y}) => (
  <AbsoluteFill>
    <Bg t={t}/>
    <div style={{position: 'absolute', left: x, top: y, width: W, height: H, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <Content t={t}/>
    </div>
  </AbsoluteFill>
);

export const FableLastDay: React.FC<{scale?: number; x?: number; y?: number}> = ({scale = 1, x = 0, y = 0}) => {
  const t = (useCurrentFrame() % LOOP) / FPS;
  const back = interpolate(t, FADE_BACK, [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  return (
    <AbsoluteFill style={{backgroundColor: '#050A1C'}}>
      {/* both layers sit in opacity groups so text rasterises the same on every frame (no shimmer at the loop seam) */}
      <AbsoluteFill style={{opacity: 0.999}}><Layer t={t} scale={scale} x={x} y={y}/></AbsoluteFill>
      {back > 0 && <AbsoluteFill style={{opacity: back}}><Layer t={0} scale={scale} x={x} y={y}/></AbsoluteFill>}
    </AbsoluteFill>
  );
};

// 9:16 hook (transparent), overlaid on the first ~2.2 s of the vertical cut with ffmpeg
export const Hook: React.FC = () => (
  <AbsoluteFill style={{fontFamily: SANS, alignItems: 'center', justifyContent: 'center', background: 'rgba(5,10,28,0.9)'}}>
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, marginTop: -60}}>
      <div style={{color: '#fff', fontSize: 94, fontWeight: 900, letterSpacing: -2.5, textAlign: 'center', lineHeight: 1.05,
        textShadow: '0 6px 30px rgba(0,0,0,0.6)'}}>FABLE 5.2 GOES<br/>PAID TONIGHT</div>
      <div style={{background: `linear-gradient(180deg, ${BLUE_HI}, ${BLUE})`, color: '#fff', fontSize: 82, fontWeight: 900, letterSpacing: -2,
        padding: '10px 36px 14px', borderRadius: 999, boxShadow: '0 0 60px rgba(31,94,255,0.8)'}}>DO THIS FIRST</div>
    </div>
  </AbsoluteFill>
);
