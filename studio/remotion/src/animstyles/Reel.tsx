import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';
import {StyleCard, STYLE_NAMES} from './Styles';

// "10 Claude Animation Styles" (job 6a48be151b7a), rebuilt from @tonistelk's reel in the same layout and order:
// starfield, title "10 Claude* / Animation styles" on top, numbered list on the left that fills in as each name is
// said (current number coral, current name bold white), a 9:16 card on the right showing the same office-walk shot in
// that style, wiped in from the right; then a 3+3 grid with "Comment ANIMATE for the prompts" between the rows.
// Exact copy (PIPELINE_PROMPT 5b): same beats on the reference's own clock (data.json), same texts; only the voice,
// WITHHAMMAD and the keyword (ANIMATE) change. Every style is our own animation of the same scene.
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'ASSans', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'ASSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'ASMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'ASMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30, CORAL = '#E07B57', SANS = 'ASSans, Arial, sans-serif', SERIF = 'ASSerif, Georgia, serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 15, stiffness: 170}}));
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };

const Stars: React.FC<{f: number}> = ({f}) => <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, #1E1E22 0%, #0B0B0D 55%, #050506 100%)'}}>
  {Array.from({length: 120}, (_, i) => {
    const x = rnd(i) * 1080, y = (rnd(i + 500) * 1920 - f * (0.15 + rnd(i + 900) * 0.35) + 1920) % 1920, r = 1 + rnd(i + 200) * 2.2;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / 20 + i));
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: r, background: '#fff', opacity: tw * 0.55}}/>;
  })}
</AbsoluteFill>;

// Claude mark inline (simple-icons path, same file as glow/si-claude.svg) so it is there on frame 0
const CLAUDE_D = 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z';
const ClaudeMark: React.FC<{size: number; spin: number}> = ({size, spin}) => <svg viewBox="0 0 24 24" width={size} height={size} style={{marginLeft: 10, transform: `rotate(${spin}deg)`}}><path d={CLAUDE_D} fill={CORAL}/></svg>;

const Title: React.FC<{f: number; op: number}> = ({f, op}) => <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', color: '#fff', opacity: op}}>
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, height: 112}}>
    <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 104, letterSpacing: -3}}>10</span>
    <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 118, color: CORAL, lineHeight: 1}}>Claude</span>
    <ClaudeMark size={74} spin={f * 0.6}/>
  </div>
  <div style={{marginTop: 4, fontSize: 96, letterSpacing: -2.5, lineHeight: 1.05}}>
    <span style={{fontFamily: SANS, fontWeight: 900, fontStyle: 'italic', display: 'inline-block', transform: 'skewX(-8deg)'}}>Animation</span>
    <span style={{fontFamily: SANS, fontWeight: 500}}> styles</span>
  </div>
  <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 500, fontSize: 38, color: 'rgba(255,255,255,.78)'}}>(To Go Viral)</div>
</div>;

const LIST_TOP = 640, ROW = 80;
const List: React.FC<{f: number; cur: number; op: number}> = ({f, cur, op}) => <div style={{position: 'absolute', left: 50, top: LIST_TOP, opacity: op}}>
  {STYLE_NAMES.map((n, i) => {
    const at = D.styles[i], on = f >= at, active = i === cur, p = at === 0 ? 1 : ease(ramp(f, at, at + 6));
    return <div key={i} style={{height: ROW, display: 'flex', alignItems: 'center', fontFamily: SANS, fontSize: 40, whiteSpace: 'nowrap'}}>
      <span style={{width: 74, fontWeight: 700, color: active ? CORAL : '#fff', opacity: active ? 1 : 0.92}}>{i + 1})</span>
      {on && <span style={{fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,.62)', opacity: p, transform: `translateX(${(1 - p) * -18}px)`, display: 'inline-block'}}>{n}</span>}
    </div>;
  })}
</div>;

const CARD = {x: 470, y: 572, w: 520, h: 924};
const Card: React.FC<{f: number; children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <div style={{position: 'absolute', overflow: 'hidden', borderRadius: 28, boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 0 1.5px rgba(255,255,255,.14)', background: '#000', ...style}}>{children}</div>;

// main card: current style, the incoming one wipes in from the right over 8 frames with a soft light edge
const MainCard: React.FC<{f: number}> = ({f}) => {
  const k = D.styles.reduce((a: number, s: number, i: number) => (f >= s ? i : a), 0);
  const prev = Math.max(0, k - 1), at = D.styles[k], w = k === 0 ? 1 : ramp(f, at, at + 4);
  const tOf = (i: number) => (f - (i === 0 ? 0 : D.styles[i])) / FPS;
  return <Card f={f} style={{left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h}}>
    {w < 1 && <div style={{position: 'absolute', inset: 0, transform: `translateX(${-w * 100}%)`}}><StyleCard i={prev} t={tOf(prev)} id={`m${prev}`}/></div>}
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${(1 - w) * 100}%)`}}><StyleCard i={k} t={tOf(k)} id={`m${k}`}/></div>
  </Card>;
};

// ending: 3 + 3 grid, comment line between the rows (the reference's layout)
const GRID = [0, 1, 2, 6, 5, 9];
const Ending: React.FC<{f: number}> = ({f}) => {
  const c = D.cta, cw = 316, chh = 562, gap = 24, x0 = (1080 - (3 * cw + 2 * gap)) / 2;
  const kwP = pop(f, c + 8);
  return <>
    {GRID.map((s, j) => {
      const row = j < 3 ? 0 : 1, col = j % 3, p = pop(f, c + j * 2);
      const top = row === 0 ? 170 : 1010;
      return <Card key={j} f={f} style={{left: x0 + col * (cw + gap), top, width: cw, height: chh, transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.4)}}>
        <StyleCard i={s} t={(f - c) / FPS + 0.4} id={`e${j}`}/></Card>;
    })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 772, textAlign: 'center', color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 70, lineHeight: 1.08, letterSpacing: -1.5,
      opacity: ramp(f, c, c + 4)}}>
      <div>Comment <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 92, color: CORAL, display: 'inline-block', transform: `scale(${1 + 0.12 * kwP * Math.max(0, 1 - (f - c - 8) / 20)})`}}>“ANIMATE”</span></div>
      <div style={{fontWeight: 700, fontSize: 60}}>for the Prompts</div>
    </div>
  </>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const out = ramp(f, D.fade, D.cta);
  const cur = D.styles.reduce((a: number, s: number, i: number) => (f >= s ? i : a), -1);
  return <AbsoluteFill style={{background: '#070708'}}>
    <Stars f={f}/>
    <Title f={f} op={1 - out}/>
    <List f={f} cur={cur} op={1 - out}/>
    {f < D.cta && <div style={{opacity: 1 - out, position: 'absolute', inset: 0}}><MainCard f={f}/></div>}
    {f >= D.cta && <Ending f={f}/>}
    <div style={{position: 'absolute', left: 54, top: 1462, fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.5)', opacity: 1 - out}}>WITHHAMMAD</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 956, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 7, color: 'rgba(255,255,255,.5)', opacity: ramp(f, D.cta + 4, D.cta + 10)}}>WITHHAMMAD</div>
    {D.standin && <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#D32F2F', color: '#fff', fontFamily: SANS, fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: '8px 20px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div></div>}
    <Audio src={staticFile('animstyles/voice.wav')}/>
  </AbsoluteFill>;
};

// Preview: all ten styles at time t, for checking the looks
export const Sheet: React.FC<{t: number}> = ({t}) => <AbsoluteFill style={{background: '#111', display: 'flex', flexWrap: 'wrap', gap: 10, padding: 10}}>
  {STYLE_NAMES.map((n, i) => <div key={i} style={{width: 378, height: 672, position: 'relative', overflow: 'hidden', borderRadius: 12}}>
    <StyleCard i={i} t={t} id={`s${i}`}/>
    <div style={{position: 'absolute', left: 8, top: 640, color: '#fff', background: 'rgba(0,0,0,.6)', fontFamily: SANS, fontSize: 20, padding: '2px 8px'}}>{n}</div></div>)}
</AbsoluteFill>;
