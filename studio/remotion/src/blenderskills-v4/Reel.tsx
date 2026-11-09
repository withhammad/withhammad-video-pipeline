import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Blender Skills reel (job 3f33678db749): @nick_saraev's edit in the same order (analysis/visual.md): a pale split layout
// (card over the face), dark floating cards over a blurred copy of themselves, a face punch-in on "free", the real
// website / README / SKILL.md / add-on pages, a Claude Code prompt, and the long build composite where seven todos tick
// on their words while the Blender viewport grows from blockout to the finished neon alley. Every 3D frame is ours,
// rendered in real Blender 5.2 (job blender/alley.py), not the reference's renders. Polish over the reference: the add-on
// named right (MCP for Blender), the paid-plan and save-your-file caveat, a comment-box + DM ending, WITHHAMMAD accents.
loadFont({family: 'BsInter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'BsInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'BsInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'BsSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'BsMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'BsMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'BsInter, Arial, sans-serif', SERIF = 'BsSerif, Georgia, serif', MONO = 'BsMono, Menlo, monospace';
const NAVY = '#0B1020', INK = '#151821', BLUE = '#2F7BF0', SKY = '#7FB2FF', GREEN = '#2BD576', CLAY = '#D97757', PAPER = '#EEF1F6';
const file = (s: string) => staticFile('blenderskills/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 190}}));

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const PALE = new Set(['title', 'blender', 'prompt']);
const FACE = new Set(['free', 'caveat', 'cta']);

// The v4 edit never reuses the old draft's unrelated mouth movements.
// Only --avatar-ready enables the verified, mapped take. Slate is internal review only.
const FaceMedia: React.FC = () => D.avatarReady
  ? <OffthreadVideo src={file(D.takeFile)} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/>
  : <AbsoluteFill style={{background: 'linear-gradient(145deg,#212b42,#0b1020)', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: '#9caecb', fontFamily: SANS, fontSize: 32, textAlign: 'center', padding: 70}}>Presenter render pending<br/>Narration review in progress</div>
    </AbsoluteFill>;

const Take: React.FC<{y?: number; scale?: number}> = ({y = 0, scale = 1}) =>
  <AbsoluteFill style={{transform: `translateY(${y}px) scale(${scale})`, transformOrigin: '50% 27%'}}>
    <FaceMedia/></AbsoluteFill>;

const Brand: React.FC<{top: number; dark?: boolean}> = ({top, dark}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7,
    color: dark ? 'rgba(21,24,33,.55)' : 'rgba(255,255,255,.72)', textShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>;

const Logo: React.FC<{src: string; size: number; color: string}> = ({src, size, color}) =>
  <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${file(src)})`, maskImage: `url(${file(src)})`,
    WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', flex: 'none'}}/>;

// A recording clip that starts playing (from startS) on frame `from`
const Clip: React.FC<{src: string; from: number; startS?: number; style?: React.CSSProperties}> = ({src, from, startS = 0, style}) =>
  <Sequence key={src + from} from={from} layout="none">
    <OffthreadVideo src={file(src)} muted startFrom={Math.round(startS * FPS)} style={style}/></Sequence>;

// Window chrome: macOS traffic lights + url / title
const Win: React.FC<{f: number; from: number; title: string; x?: number; y: number; w: number; h: number; light?: boolean; children: React.ReactNode}> =
  ({f, from, title, x, y, w, h, light, children}) => {
    const p = pop(f, from);
    return <div style={{position: 'absolute', left: x ?? (1080 - w) / 2, top: y, width: w, height: h, borderRadius: 28, overflow: 'hidden',
      background: light ? '#fff' : '#0d1117', boxShadow: '0 40px 90px rgba(0,0,0,.45), 0 0 0 2px rgba(127,178,255,.45), 0 0 40px rgba(47,123,240,.35)',
      transform: `translateY(${(1 - p) * 60}px) scale(${0.93 + 0.07 * p})`, opacity: Math.min(1, p * 2)}}>
      <div style={{height: 56, background: light ? '#F3F4F7' : '#161b26', display: 'flex', alignItems: 'center', gap: 11, padding: '0 22px'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}}/>)}
        <div style={{marginLeft: 16, flex: 1, background: light ? '#fff' : '#0d1117', borderRadius: 10, padding: '6px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 21,
          color: light ? '#5b6170' : '#9aa4b8', whiteSpace: 'nowrap', overflow: 'hidden'}}>{title}</div></div>
      <div style={{position: 'relative', width: w, height: h - 56, overflow: 'hidden'}}>{children}</div></div>;
  };

// Dark layout: a blurred, dimmed copy of the card content fills the frame behind the floating card
const Dark: React.FC<{bg: React.ReactNode; children: React.ReactNode}> = ({bg, children}) => <AbsoluteFill style={{background: '#06080D', overflow: 'hidden'}}>
  <AbsoluteFill style={{filter: 'blur(46px) brightness(.45) saturate(1.3)', transform: 'scale(1.25)'}}>{bg}</AbsoluteFill>
  <AbsoluteFill style={{background: 'radial-gradient(circle 900px at 540px 1500px, rgba(47,123,240,.22), rgba(6,8,13,0) 70%)'}}/>
  {children}<Brand top={226}/></AbsoluteFill>;

// Pale split layout: header + card on paper, the face in a rounded card at the bottom
const FACE_TOP = 1170;
const Pale: React.FC<{children: React.ReactNode}> = ({children}) => <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
  <AbsoluteFill style={{background: 'radial-gradient(circle 700px at 900px 200px, rgba(47,123,240,.12), rgba(238,241,246,0) 70%), radial-gradient(circle 600px at 120px 900px, rgba(217,119,87,.08), rgba(238,241,246,0) 70%)'}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(21,24,33,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(21,24,33,.045) 1px, transparent 1px)', backgroundSize: '64px 64px'}}/>
  <div style={{position: 'absolute', left: 90, right: 90, top: FACE_TOP, bottom: -40, borderRadius: 44, overflow: 'hidden', boxShadow: '0 20px 60px rgba(21,24,33,.25)'}}>
    <div style={{position: 'absolute', left: (900 - 1080 * 0.84) / 2, top: -126, width: 1080, height: 1920, transform: 'scale(0.84)', transformOrigin: '0 0'}}>
      <FaceMedia/></div></div>
  <Header/><Brand top={226} dark/>
  {children}</AbsoluteFill>;

const Header: React.FC = () => {
  const p = 1, q = 1;  // hook readable on frame 0 (video-check)
  return <div style={{position: 'absolute', left: 0, right: 0, top: 270, textAlign: 'center'}}>
    <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: INK, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 20}px)`}}>Claude Code Now Runs</div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 10, transform: `scale(${0.8 + 0.2 * q})`, opacity: Math.min(1, q * 2)}}>
      <Logo src="si-claude.svg" size={58} color={CLAY}/>
      <div style={{background: BLUE, borderRadius: 18, padding: '4px 30px 10px', boxShadow: '0 12px 30px rgba(47,123,240,.35)'}}>
        <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 78, color: '#fff', lineHeight: 1}}>Blender for you</span></div>
      <Logo src="si-blender.svg" size={58} color="#EA7600"/></div></div>;
};
const PaleCard: React.FC<{f: number; from: number; children: React.ReactNode; title: string; h?: number}> = ({f, from, children, title, h = 610}) =>
  <Win f={f} from={from} title={title} y={460} w={980} h={h}>{children}</Win>;

// Crossfading stills (Blender renders) with a slow push
const Stills: React.FC<{f: number; list: [string, number][]; w: number; h: number; push?: [number, number]}> = ({f, list, w, h, push}) => <>
  {list.map(([src, at], i) => {
    const o = i === 0 ? 1 : ramp(f, at, at + 6);
    const z = push ? 1 + 0.08 * ramp(f, push[0], push[1]) : 1;
    return f >= at || i === 0 ? <Img key={src + i} src={file(src)} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover', opacity: o, transform: `scale(${z})`}}/> : null;
  })}</>;

// ---------------------------------------------------------------- scenes
const Title: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [run, build, d3] = D.beats.title;
  return <Pale><PaleCard f={f} from={u.from - 20} title="Blender 5.2 · alley.blend">
    <Stills f={f} w={980} h={584} push={[u.from, u.to]} list={[['stage0_blockout.png', 0], ['stage1_characters.png', run], ['stage2_props.png', build], ['stage3_environment.png', d3]]}/>
  </PaleCard></Pale>;
};

const Renders: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [tex, anim, desc] = D.beats.renders;
  const k = f >= desc ? 2 : f >= anim ? 1 : 0;
  const card = (blur: boolean) => k === 0 ? <Img src={file('stage5_textures.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + 0.06 * ramp(f, tex, anim)})`}}/>
    : k === 1 ? (blur ? <Img src={file('stage5_textures.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> :
      <Clip src="alley_push.mp4" from={anim} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>)
      : <Img src={file('gui_7.png')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '40% 50%', transform: `scale(${1.02 + 0.05 * ramp(f, desc, u.to)})`}}/>;
  const p = pop(f, [tex, anim, desc][k] - 2);
  return <Dark bg={card(true)}>
    <div style={{position: 'absolute', left: 60, top: 360, width: 960, height: 760, borderRadius: 30, overflow: 'hidden', boxShadow: '0 0 0 2px rgba(127,178,255,.6), 0 0 50px rgba(47,123,240,.45), 0 40px 90px rgba(0,0,0,.6)',
      transform: `scale(${0.95 + 0.05 * p})`}}>{card(false)}</div>
    <div style={{position: 'absolute', left: 84, top: 384, background: 'rgba(6,8,13,.7)', borderRadius: 999, padding: '6px 18px', display: 'flex', gap: 10, alignItems: 'center'}}>
      <Logo src="si-blender.svg" size={26} color="#EA7600"/><span style={{fontFamily: SANS, fontWeight: 800, fontSize: 22, color: '#fff'}}>Rendered in Blender</span></div>
  </Dark>;
};

const Free: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const z = 1.18 + 0.06 * ramp(f, u.from, u.to), p = pop(f, D.beats.free - 2);
  return <><Take scale={z}/><Brand top={226}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1110, textAlign: 'center', transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2)}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 210, letterSpacing: -8, color: '#fff', lineHeight: 1,
        textShadow: '0 0 30px rgba(80,200,255,.9), 0 0 80px rgba(47,123,240,.8), 0 6px 20px rgba(0,0,0,.5)'}}>FREE</div>
      <div style={{display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18, maxWidth: 800}}>{['Skills: free · MIT', 'Blender: free', 'Claude usage costs'].map((t, i) =>
        <div key={t} style={{background: 'rgba(250,250,252,.95)', borderRadius: 999, padding: '8px 20px', fontFamily: SANS, fontWeight: 800, fontSize: 27, color: INK,
          opacity: ramp(f, D.beats.free + 4 + i * 4, D.beats.free + 8 + i * 4)}}>{t}</div>)}</div></div></>;
};

const Site: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const rec = <Clip src="r_site.mp4" from={u.from} startS={1.4} style={{width: 960, height: 1200}}/>;
  return <Dark bg={<Img src={file('stage5_textures.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}>
    <Win f={f} from={u.from} title="blender-skills.vercel.app" y={300} w={960} h={1000}>{rec}</Win></Dark>;
};

const Repo: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {free, open, n94, pro} = D.beats.repo;
  // The number settles exactly when "94" starts, not half a second after it.
  const n = Math.round(94 * ease(ramp(f, n94 - 24, n94))), s = pop(f, n94 - 24);
  return <Dark bg={<Img src={file('stage5_textures.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}>
    <Win f={f} from={u.from} title="github.com/arjun988/blender-skills" y={300} w={960} h={1000}>
      <div style={{position: 'absolute', left: 0, top: -60, width: 960, height: 1200, transform: `scale(${1 + 0.05 * ramp(f, u.from, u.to)})`, transformOrigin: '50% 30%'}}>
        <Clip src="r_repo.mp4" from={u.from} startS={1.6} style={{width: 960, height: 1200}}/></div></Win>
    {f >= n94 - 24 ? <div style={{position: 'absolute', left: 340, top: 360, width: 400, padding: '14px 0 18px', background: 'rgba(14,18,30,.92)', borderRadius: 34, textAlign: 'center',
      boxShadow: '0 0 0 2px rgba(127,178,255,.5), 0 30px 70px rgba(0,0,0,.6)', transform: `scale(${0.5 + 0.5 * s}) rotate(${(1 - s) * -8}deg)`}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 150, color: '#fff', lineHeight: 1, letterSpacing: -5, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 30px rgba(47,123,240,.8)'}}>{n}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 8, color: SKY}}>SKILLS</div></div> : null}
    <div style={{position: 'absolute', left: 60, right: 150, top: 1318, display: 'flex', justifyContent: 'center', gap: 12}}>
      {[['Free · MIT', free], ['Open source', open], ['Coding agents', pro]].map(([t, a]) => f >= (a as number) ?
        <div key={t as string} style={{background: 'rgba(250,250,252,.95)', borderRadius: 999, padding: '9px 20px', fontFamily: SANS, fontWeight: 800, fontSize: 26, color: INK,
          transform: `scale(${pop(f, a as number)})`}}>{t}</div> : null)}</div>
  </Dark>;
};

const BlenderScene: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {mcp, connects} = D.beats.blender;
  const showMcp = f >= mcp - 2;
  return <Pale>
    <PaleCard f={f} from={u.from} title={showMcp ? 'github.com/ahujasid/mcp-for-blender' : 'Blender 5.2'}>
      {showMcp ? <div style={{position: 'absolute', left: 0, top: -40, width: 980, height: 1225}}><Clip src="r_mcp.mp4" from={mcp - 2} startS={2.0} style={{width: 980, height: 1225}}/></div>
        : <Img src={file('gui_2.png')} style={{width: 980, height: 584, objectFit: 'cover', objectPosition: '30% 40%', transform: `scale(${1.15 + 0.1 * ramp(f, u.from, mcp)})`}}/>}
    </PaleCard>
    {f >= connects ? <div style={{position: 'absolute', left: 0, right: 0, top: 1020, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, background: INK, borderRadius: 999, padding: '12px 30px', transform: `scale(${pop(f, connects)})`, boxShadow: '0 16px 40px rgba(21,24,33,.35)'}}>
        <Logo src="si-claude.svg" size={40} color={CLAY}/><span style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, color: '#fff'}}>Claude Code</span>
        <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 36, color: GREEN}}>⇄</span>
        <span style={{fontFamily: SANS, fontWeight: 900, fontSize: 36, color: '#fff'}}>Blender</span><Logo src="si-blender.svg" size={40} color="#EA7600"/>
        </div></div> : null}
  </Pale>;
};

const PROMPT = 'Build me a cyberpunk alley for Unreal Engine';
const Prompt: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, hi, unreal} = D.beats.prompt;
  const n = Math.max(0, Math.round(interpolate(f, [type, unreal + 12], [0, PROMPT.length], clamp))), typed = PROMPT.slice(0, n);
  const a = PROMPT.indexOf('cyberpunk alley'), b = a + 'cyberpunk alley'.length, hl = f >= hi + 10;
  const seg = (s: string, on: boolean) => <span style={on ? {background: 'rgba(47,123,240,.55)', borderRadius: 6} : undefined}>{s}</span>;
  return <Pale><PaleCard f={f} from={u.from} title="Claude Code · ~/games/neon-alley">
    <div style={{position: 'absolute', inset: 0, background: '#0d1117', padding: '34px 40px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, border: `2px solid ${CLAY}`, borderRadius: 18, padding: '20px 28px'}}>
        <Logo src="si-claude.svg" size={64} color={CLAY}/>
        <div><div style={{fontFamily: MONO, fontWeight: 700, fontSize: 34, color: '#fff'}}><span style={{color: CLAY}}>✻</span> Welcome to Claude Code!</div>
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 22, color: '#6b7489'}}>blender-skills · MCP: blender connected</div></div></div>
      <div style={{marginTop: 26, border: '2px solid rgba(127,178,255,.35)', borderRadius: 16, padding: '22px 26px', fontFamily: MONO, fontWeight: 500, fontSize: 44, color: '#fff', lineHeight: 1.4, minHeight: 260}}>
        <span style={{color: '#6b7489'}}>{'> '}</span>{seg(typed.slice(0, a), false)}{seg(typed.slice(a, b), hl)}{seg(typed.slice(b), false)}
        <span style={{opacity: (f >> 3) % 2 ? 1 : 0.2, color: SKY}}>▍</span></div>
    </div></PaleCard></Pale>;
};

const Director: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {over} = D.beats.director;
  return <Dark bg={<Img src={file('stage4_lighting.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}>
    <Win f={f} from={u.from} title="blender-skills/.claude/skills/blender-director/SKILL.md" y={300} w={960} h={1000}>
      <div style={{position: 'absolute', left: 0, top: -40, width: 960, height: 1200}}><Clip src="r_director.mp4" from={u.from} startS={0.9} style={{width: 960, height: 1200}}/></div></Win>
    {f >= over ? <div style={{position: 'absolute', left: 0, right: 0, top: 1318, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(250,250,252,.95)', borderRadius: 999, padding: '10px 28px', fontFamily: SANS, fontWeight: 800, fontSize: 32, color: INK, transform: `scale(${pop(f, over)})`}}>
        The orchestrator: plans, then delegates</div></div> : null}
  </Dark>;
};

const TODOS: [string, string, string][] = [['Build the characters', 'character-artist', 'char'], ['Build the props', 'prop-artist', 'props'],
  ['Build the environment', 'environment-artist', 'env'], ['Add lighting', 'lighting', 'light'], ['Add textures', 'texture-workflow', 'tex'],
  ['Optimize for the game', 'asset-optimization', 'opt'], ['Export to Unreal Engine', 'unreal-export', 'exp']];
const Build: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const b = D.beats.build, starts = TODOS.map(t => b[t[2]]), dones = [...starts.slice(1), b.check];
  const nDone = dones.filter(d => f >= d).length;
  const stills: [string, number][] = [['stage0_blockout.png', 0], ['stage1_characters.png', dones[0]], ['stage2_props.png', dones[1]],
    ['stage3_environment.png', dones[2]], ['stage4_lighting.png', dones[3]], ['stage5_textures.png', dones[4]]];
  const final = f >= dones[5];
  const viewport = <>
    <Stills f={f} w={880} h={550} list={stills}/>
    {final ? <Clip src="alley_push.mp4" from={dones[5]} style={{position: 'absolute', inset: 0, width: 880, height: 550, objectFit: 'cover'}}/> : null}</>;
  return <Dark bg={<Img src={file(stills[Math.min(nDone, 5)][0])} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}>
    <Win f={f} from={u.from} title="Blender 5.2 · Claude Code (blender-director)" x={60} y={282} w={880} h={1090}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 880, height: 550, overflow: 'hidden', background: '#000'}}>{viewport}
        <div style={{position: 'absolute', left: 16, top: 14, fontFamily: MONO, fontWeight: 500, fontSize: 20, color: 'rgba(255,255,255,.8)'}}>Camera Perspective · {['blockout', 'characters', 'props', 'environment', 'lighting', 'textures', 'optimized', 'exported'][Math.min(nDone, 7)]}</div></div>
      <div style={{position: 'absolute', left: 0, top: 550, width: 880, height: 484, background: '#0d1117', padding: '18px 26px', boxSizing: 'border-box', borderTop: '1px solid #232a38'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}><Logo src="si-claude.svg" size={30} color={CLAY}/>
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff'}}>Claude Code</span>
          <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 20, color: '#6b7489', marginLeft: 'auto'}}>blender-director</span></div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 8}}><span style={{color: GREEN}}>●</span> Update Todos</div>
        {TODOS.map(([t, skill], i) => {
          const visible = f >= b.plan + i * 2, done = f >= dones[i], active = !done && f >= starts[i];
          if (!visible) return null;
          const d = ease(ramp(f, dones[i], dones[i] + 6));
          return <div key={t} style={{display: 'flex', alignItems: 'center', gap: 14, height: 48, padding: '0 10px', borderRadius: 8,
            background: active ? 'rgba(47,123,240,.22)' : done ? `rgba(43,213,118,${0.1 * (1 - d)})` : 'transparent'}}>
            <div style={{width: 28, height: 28, borderRadius: 6, border: `2px solid ${done ? GREEN : active ? SKY : '#4a5368'}`, background: done ? GREEN : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${done ? 0.8 + 0.2 * d : 1})`}}>
              {done ? <svg width={18} height={18} viewBox="0 0 20 20"><path d="M4 10.5 L8.5 15 L16 5.5" stroke="#06080D" strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> : null}</div>
            <span style={{fontFamily: MONO, fontWeight: active ? 700 : 500, fontSize: 25, color: done ? '#96a4ba' : '#fff', textDecoration: done ? 'line-through' : 'none', flex: 1}}>{t}</span>
            <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 18, color: active ? SKY : '#96a4ba'}}>{skill}</span></div>;
        })}</div>
    </Win></Dark>;
};

const Caveat: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {paid, code, save} = D.beats.caveat;
  const row = (t: string, at: number, icon: string, light?: boolean) => f >= at ? <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, background: light ? '#fff' : 'rgba(14,18,30,.9)',
    border: light ? 'none' : '1.5px solid rgba(127,178,255,.35)', borderRadius: 999, padding: '12px 30px 12px 14px', transform: `scale(${0.7 + 0.3 * pop(f, at)})`, boxShadow: '0 12px 30px rgba(0,0,0,.35)'}}>
    <div style={{width: 46, height: 46, borderRadius: 23, background: light ? GREEN : '#F5A524', color: '#06080D', fontFamily: SANS, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
    <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: light ? INK : '#fff', whiteSpace: 'nowrap'}}>{t}</span></div> : null;
  return <><Take/><Brand top={226}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 8, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.6)', opacity: ramp(f, u.from, u.from + 6)}}>HEADS UP</div>
      {row('Claude Code needs a paid plan', paid, '!')}
      {row('It runs real code in Blender', code, '!')}
      {row('Save your file first', save, '✓', true)}</div></>;
};

const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, dm} = D.beats.cta, word = 'BLENDER', up = pop(f, type - 6);
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - type) * 16 / FPS) + 1)));
  const d = pop(f, dm), card = pop(f, dm + 8);
  return <><Take/><Brand top={226}/>
    <div style={{position: 'absolute', left: 70, right: 160, top: 1110, transform: `translateY(${(1 - up) * 400}px)`, opacity: Math.min(1, up * 2), background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 62, height: 62, borderRadius: 31, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: f >= type ? 900 : 700, fontSize: 48, color: f >= type ? NAVY : '#8e8e93'}}>
        {f >= type ? typed : 'Add a comment…'}{f >= type && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= dm ? <div style={{position: 'absolute', left: 110, top: 1266, transform: `scale(${d})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: NAVY}}>Here's the full Blender setup</div> : null}
    {f >= dm + 8 ? <div style={{position: 'absolute', left: 110, top: 1346, width: 760, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 88, height: 88, borderRadius: 18, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Logo src="si-blender.svg" size={52} color="#EA7600"/></div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: NAVY}}>Blender + Claude Code setup</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources</div></div></div> : null}
  </>;
};

// ---------------------------------------------------------------- captions: 1-3 word phrase built word by word, accent words blue
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c) return null;
  const pale = PALE.has(u.kind);
  const y = pale ? 1120 : FACE.has(u.kind) ? 1000 : 1430;
  return <div style={{position: 'absolute', left: 60, right: 150, top: y, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', gap: 14}}>
    {c.words.filter((w: any) => f >= w.at).map((w: any, i: number) => {
      const p = ease(ramp(f, w.at, w.at + 4));
      const col = w.accent ? (pale ? BLUE : SKY) : pale ? INK : '#fff';
      return <span key={i} style={{fontFamily: w.serif ? SERIF : SANS, fontStyle: w.serif ? 'italic' : 'normal', fontWeight: w.serif ? 400 : 800, fontSize: w.serif ? 72 : 60,
        letterSpacing: w.serif ? 0 : -1, color: col, lineHeight: 1.1, whiteSpace: 'nowrap', filter: `blur(${(1 - p) * 6}px)`, opacity: p,
        textShadow: pale ? 'none' : w.accent ? '0 0 22px rgba(47,123,240,.7), 0 3px 12px rgba(0,0,0,.6)' : '0 3px 12px rgba(0,0,0,.6)'}}>{w.t}</span>;
    })}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  const S: Record<string, React.FC<{u: Unit; f: number}>> = {title: Title, renders: Renders, free: Free, site: Site, repo: Repo, blender: BlenderScene,
    prompt: Prompt, director: Director, build: Build, caveat: Caveat, cta: Cta};
  const Scene = S[u.kind];
  return <AbsoluteFill style={{background: NAVY, fontFamily: SANS}}>
    <Audio src={file(D.voiceFile)}/>
    <Scene u={u} f={f}/>
    <Captions f={f} u={u}/>
    {!D.avatarReady ? <div style={{position: 'absolute', top: 80, right: 40, background: '#293751', color: '#fff', fontFamily: SANS, fontWeight: 800, fontSize: 24, padding: '8px 16px', borderRadius: 10}}>INTERNAL EDIT · PRESENTER PENDING</div> : null}
  </AbsoluteFill>;
};
