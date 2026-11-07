import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';
import data from './data.json';

// Game-dev skills reel (job 7f7f39548dd4): @nick_saraev's DfZGREyvPUX edit in the same 14 scenes (analysis/visual.md): pale split
// title over game b-roll, dark floating GitHub cards with the 77 tile, 2x2 engine tiles, router line, Claude Code terminal,
// face punch-in, catalog scroll, stacked gameplay cards, art-direction asset sheet, warm game shot, "make it exist" builder
// panels, store pages, comment CTA. Face = the HeyGen take (white-shirt look) laid on the voice clock (take/take.mp4).
// Fixes: App Store -> Steam + itch.io (the repo has steam-publish and itch-publish, no App Store skill); "AAA studio" ->
// "belongs in the same game"; our own 3D (Blender 5.2) and real engine footage instead of unattributed gameplay.
loadFont({family: 'GsInter', url: staticFile('fonts/inter-latin-700-normal.woff2'), weight: '700'});
loadFont({family: 'GsInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'GsInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'GsSerif', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
loadFont({family: 'GsMono', url: staticFile('fonts/jetbrains-mono-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'GsMono', url: staticFile('fonts/jetbrains-mono-latin-700-normal.woff2'), weight: '700'});

const D: any = data;
const FPS = 30;
const SANS = 'GsInter, Arial, sans-serif', SERIF = 'GsSerif, Georgia, serif', MONO = 'GsMono, Menlo, monospace';
const NAVY = '#0B1020', INK = '#151821', BLUE = '#2F7BF0', SKY = '#7FB2FF', GREEN = '#2BD576', CLAY = '#D97757', PAPER = '#EEF1F6', ORANGE = '#FF9A3D';
const file = (s: string) => staticFile('gameskills/' + s);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const pop = (f: number, at: number) => (f < at ? 0 : spring({frame: f - at, fps: FPS, config: {damping: 13, stiffness: 190}}));

type Unit = {kind: string; from: number; to: number};
const unitAt = (f: number): Unit => D.units.find((u: Unit) => f >= u.from && f < u.to) || D.units[D.units.length - 1];
const PALE = new Set(['title', 'router', 'terminal', 'assets']);
const FACE = new Set(['punch', 'cta']);

const Take: React.FC<{scale?: number}> = ({scale = 1}) =>
  <AbsoluteFill style={{transform: `scale(${scale})`, transformOrigin: '50% 22%'}}>
    <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/></AbsoluteFill>;

const Brand: React.FC<{dark?: boolean}> = ({dark}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top: 186, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 22, letterSpacing: 7,
    color: dark ? 'rgba(21,24,33,.55)' : 'rgba(255,255,255,.75)', textShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,.5)'}}>WITHHAMMAD</div>;

const Logo: React.FC<{src: string; size: number; color: string}> = ({src, size, color}) =>
  <div style={{width: size, height: size, background: color, WebkitMaskImage: `url(${file(src)})`, maskImage: `url(${file(src)})`,
    WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', flex: 'none'}}/>;

const Clip: React.FC<{src: string; from: number; startS?: number; style?: React.CSSProperties}> = ({src, from, startS = 0, style}) =>
  <Sequence key={src + from} from={from} layout="none">
    <OffthreadVideo src={file(src)} muted startFrom={Math.round(startS * FPS)} style={style}/></Sequence>;

const Win: React.FC<{f: number; from: number; title: string; x?: number; y: number; w: number; h: number; children: React.ReactNode; dark?: boolean}> =
  ({f, from, title, x, y, w, h, children, dark = true}) => {
    const p = pop(f, from);
    return <div style={{position: 'absolute', left: x ?? (1080 - w) / 2, top: y, width: w, height: h, borderRadius: 28, overflow: 'hidden', background: dark ? '#0d1117' : '#fff',
      boxShadow: '0 40px 90px rgba(0,0,0,.45), 0 0 0 2px rgba(127,178,255,.5), 0 0 40px rgba(47,123,240,.35)',
      transform: `translateY(${(1 - p) * 60}px) scale(${0.93 + 0.07 * p})`, opacity: Math.min(1, p * 2)}}>
      <div style={{height: 54, background: dark ? '#161b26' : '#F3F4F7', display: 'flex', alignItems: 'center', gap: 11, padding: '0 22px'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}}/>)}
        <div style={{marginLeft: 16, flex: 1, background: dark ? '#0d1117' : '#fff', borderRadius: 10, padding: '6px 16px', fontFamily: SANS, fontWeight: 700, fontSize: 21,
          color: dark ? '#9aa4b8' : '#5b6170', whiteSpace: 'nowrap', overflow: 'hidden'}}>{title}</div></div>
      <div style={{position: 'relative', width: w, height: h - 54, overflow: 'hidden'}}>{children}</div></div>;
  };

const Dark: React.FC<{bg: React.ReactNode; children: React.ReactNode}> = ({bg, children}) => <AbsoluteFill style={{background: '#06080D', overflow: 'hidden'}}>
  <AbsoluteFill style={{filter: 'blur(46px) brightness(.42) saturate(1.3)', transform: 'scale(1.25)'}}>{bg}</AbsoluteFill>
  <AbsoluteFill style={{background: 'radial-gradient(circle 900px at 540px 1500px, rgba(47,123,240,.2), rgba(6,8,13,0) 70%)'}}/>
  {children}<Brand/></AbsoluteFill>;

// Pale split: header + card on paper, the face (HeyGen take) in a rounded card at the bottom
const FACE_TOP = 1170;
const Pale: React.FC<{children: React.ReactNode; header?: boolean}> = ({children, header}) => <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
  <AbsoluteFill style={{background: 'radial-gradient(circle 700px at 900px 200px, rgba(47,123,240,.12), rgba(238,241,246,0) 70%), radial-gradient(circle 600px at 120px 900px, rgba(217,119,87,.08), rgba(238,241,246,0) 70%)'}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(21,24,33,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(21,24,33,.045) 1px, transparent 1px)', backgroundSize: '64px 64px'}}/>
  <div style={{position: 'absolute', left: 90, right: 90, top: FACE_TOP, bottom: -40, borderRadius: 44, overflow: 'hidden', boxShadow: '0 20px 60px rgba(21,24,33,.25)'}}>
    <div style={{position: 'absolute', left: (900 - 1080 * 0.9) / 2, top: -150, width: 1080, height: 1920, transform: 'scale(0.9)', transformOrigin: '0 0'}}>
      <OffthreadVideo src={file('take.mp4')} muted style={{width: 1080, height: 1920, objectFit: 'cover'}}/></div></div>
  {header ? <Header/> : null}<Brand dark/>
  {children}</AbsoluteFill>;

const Gamepad: React.FC<{size: number}> = ({size}) => <svg width={size} height={size} viewBox="0 0 48 48"><rect x="2" y="12" width="44" height="26" rx="13" fill="#FF3B3B"/>
  <rect x="11" y="22" width="12" height="4" rx="2" fill="#fff"/><rect x="15" y="18" width="4" height="12" rx="2" fill="#fff"/><circle cx="32" cy="22" r="2.6" fill="#fff"/><circle cx="37" cy="27" r="2.6" fill="#fff"/></svg>;

const Header: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center'}}>
  <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: INK}}>Claude Code Now Builds</div>
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 10}}>
    <Img src={file('claude-code-mascot.png')} style={{width: 64, height: 64, objectFit: 'contain'}}/>
    <div style={{background: BLUE, borderRadius: 18, padding: '4px 30px 10px', boxShadow: '0 12px 30px rgba(47,123,240,.35)'}}>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 78, color: '#fff', lineHeight: 1}}>Full Video Games</span></div>
    <Gamepad size={64}/></div></div>;

const Stills: React.FC<{f: number; list: [string, number][]; w: number; h: number; push?: [number, number]; pos?: string}> = ({f, list, w, h, push, pos}) => <>
  {list.map(([src, at], i) => {
    const o = i === 0 ? 1 : ramp(f, at, at + 5);
    const z = push ? 1 + 0.08 * ramp(f, push[0], push[1]) : 1;
    return f >= at || i === 0 ? <Img key={src + i} src={file(src)} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'cover', objectPosition: pos, opacity: o, transform: `scale(${z})`}}/> : null;
  })}</>;

// Gameplay sources (all ours or official engine demos): Blender alley push (ours), Phaser's official platformer tutorial game
const Platformer: React.FC<{from: number; w: number; h: number; startS?: number}> = ({from, w, h, startS = 0.5}) =>
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#1f6fbf'}}>
    <div style={{position: 'absolute', left: 0, top: -h * 0.22, width: w, height: h * 1.35}}>
      <Clip src="g_platformer.mp4" from={from} startS={startS} style={{width: w * 1.0, height: h * 1.35, objectFit: 'cover', objectPosition: '50% 100%'}}/></div>
    <div style={{position: 'absolute', right: 12, bottom: 10, fontFamily: SANS, fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.45)', padding: '4px 10px', borderRadius: 8}}>Phaser · official tutorial game</div></div>;

// ---------------------------------------------------------------- scenes
const Title: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.title;
  return <Pale header><Win f={f} from={u.from - 20} title={f < a ? 'Blender 5.2 · neon-alley.blend' : f < b ? 'Phaser · platformer' : 'Blender 5.2 · neon-alley.blend'} y={430} w={980} h={640}>
    {f < a ? <Img src={file('stage5_textures.png')} style={{width: 980, height: 586, objectFit: 'cover', transform: `scale(${1.02 + 0.05 * ramp(f, 0, a)})`}}/>
      : f < b ? <Platformer from={a} w={980} h={586}/>
      : <Clip src="alley_push.mp4" from={b} style={{width: 980, height: 586, objectFit: 'cover'}}/>}
  </Win></Pale>;
};

const RepoBg = <Img src={file('stage4_lighting.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>;
const Repo: React.FC<{u: Unit; f: number}> = ({u, f}) => <Dark bg={RepoBg}>
  <Win f={f} from={u.from} title="github.com/gamedev-skills/awesome-gamedev-agent-skills" y={300} w={960} h={1000}>
    <div style={{position: 'absolute', left: 0, top: -50, width: 960, height: 1200}}><Clip src="r_repo.mp4" from={u.from} startS={0.3} style={{width: 960, height: 1200}}/></div></Win>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1318, display: 'flex', justifyContent: 'center', gap: 12}}>
    {[['Apache-2.0', u.from + 6], ['~7.5k stars', u.from + 12], ['Since Jun 2026 · updated Oct 28', u.from + 18]].map(([t, a]) => f >= (a as number) ?
      <div key={t as string} style={{background: 'rgba(250,250,252,.95)', borderRadius: 999, padding: '8px 16px', fontFamily: SANS, fontWeight: 800, fontSize: 23, color: INK, transform: `scale(${pop(f, a as number)})`}}>{t}</div> : null)}</div>
</Dark>;

const Readme: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {n77} = D.beats.readme, n = Math.round(interpolate(f, [n77, n77 + 14], [0, 77], clamp)), s = pop(f, n77 - 3), out = ramp(f, u.to - 8, u.to);
  return <Dark bg={RepoBg}>
    <Win f={f} from={u.from - 30} title="github.com/gamedev-skills/awesome-gamedev-agent-skills" y={300} w={960} h={1000}>
      <div style={{position: 'absolute', left: 0, top: -50, width: 960, height: 1200}}><Clip src="r_repo.mp4" from={u.from} startS={3.4} style={{width: 960, height: 1200}}/></div></Win>
    {f >= n77 - 3 ? <div style={{position: 'absolute', left: 300, top: 420, width: 480, padding: '10px 0 20px', background: 'rgba(14,18,30,.92)', borderRadius: 40, textAlign: 'center',
      boxShadow: '0 0 0 2px rgba(127,178,255,.5), 0 30px 70px rgba(0,0,0,.6)', transform: `scale(${(0.5 + 0.5 * s) * (1 - 0.3 * out)}) rotate(${(1 - s) * -8}deg)`, opacity: 1 - out}}>
      <div style={{fontFamily: SANS, fontWeight: 900, fontSize: 230, lineHeight: 1, letterSpacing: -8, fontVariantNumeric: 'tabular-nums',
        background: 'linear-gradient(180deg,#FFFFFF 0%, #9CC4FF 100%)', WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 30px rgba(47,123,240,.7))'}}>{n}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 8, color: SKY}}>GAME-DEV SKILLS</div></div> : null}
  </Dark>;
};

const ENG: [string, string, string][] = [['si-unrealengine.svg', 'UNREAL ENGINE', '#0E1128'], ['si-unity.svg', 'Unity', '#000000'], ['si-godotengine.svg', 'GODOT', '#478CBF'], ['si-html5.svg', 'Web · HTML5', '#E34F26']];
const Engines: React.FC<{u: Unit; f: number}> = ({u, f}) => <Dark bg={RepoBg}>
  <div style={{position: 'absolute', left: 120, top: 360, width: 840, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
    {ENG.map(([src, name, col], i) => {
      const at = D.beats.engines[i] - 2, p = pop(f, at);
      return <div key={name} style={{height: 400, borderRadius: 34, background: f >= at ? '#fff' : 'rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
        boxShadow: f >= at ? '0 0 0 3px rgba(127,178,255,.6), 0 24px 60px rgba(0,0,0,.5)' : 'none', transform: `scale(${f >= at ? 0.85 + 0.15 * p : 1})`}}>
        {f >= at ? <><Logo src={src} size={150} color={col}/><div style={{fontFamily: SANS, fontWeight: 900, fontSize: 40, color: col === '#000000' ? INK : col}}>{name}</div></> : null}</div>;
    })}</div>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 28, color: 'rgba(255,255,255,.75)', opacity: ramp(f, D.beats.engines[3], D.beats.engines[3] + 8)}}>
    + Bevy · pygame · LÖVE · Defold · Roblox · Ebitengine (12 engines)</div>
</Dark>;

const Router: React.FC<{u: Unit; f: number}> = ({u, f}) => <Pale>
  <Win f={f} from={u.from} title="README · How the router picks skills" y={300} w={980} h={780} dark={false}>
    <div style={{position: 'absolute', inset: 0, background: '#fff', padding: '44px 54px'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: '#59606e'}}>How the router picks skills</div>
      <div style={{height: 2, background: '#e6e8ec', margin: '18px 0 30px'}}/>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 112, lineHeight: 1.12, color: INK, letterSpacing: -3}}>
        <span style={{background: `linear-gradient(90deg, rgba(127,178,255,.55) ${ramp(f, D.beats.router, D.beats.router + 14) * 100}%, transparent 0)`}}>You never name a skill.</span></div>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 30, color: '#59606e', marginTop: 34}}>Detects your engine · reads your request · loads only what fits</div>
    </div></Win></Pale>;

const TerminalScene: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, router, load, skip} = D.beats.terminal, PROMPT = 'add a double jump to my Godot player';
  const n = Math.round(interpolate(f, [type, router - 4], [0, PROMPT.length], clamp)), typed = PROMPT.slice(0, n);
  const hl = (s: string) => f >= skip ? s.replace(/(double jump|Godot)/g, '§$1§') : s;
  const parts = hl(typed).split('§');
  return <Pale><Win f={f} from={u.from} title="Claude Code — ~/my-platformer" y={300} w={980} h={780}>
    <div style={{position: 'absolute', inset: 0, padding: '30px 38px', fontFamily: MONO, fontSize: 34, color: '#e6e9ef', lineHeight: 1.55}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, border: `2px solid ${CLAY}`, borderRadius: 16, padding: '14px 22px', marginBottom: 26}}>
        <Img src={file('claude-code-mascot.png')} style={{width: 56, height: 56, objectFit: 'contain'}}/>
        <span style={{fontWeight: 700, fontSize: 30}}><span style={{color: CLAY}}>✻</span> Welcome to Claude Code!</span></div>
      <div><span style={{color: '#6b7489'}}>{'> '}</span>{parts.map((p, i) => <span key={i} style={i % 2 ? {background: 'rgba(47,123,240,.6)', borderRadius: 6} : undefined}>{p}</span>)}
        {f < router ? <span style={{opacity: (f >> 3) % 2 ? 1 : 0.2, color: SKY}}>▍</span> : null}</div>
      {f >= router ? <div style={{marginTop: 22, opacity: ramp(f, router, router + 5)}}><span style={{color: GREEN}}>●</span> <b>Skill</b>(router)</div> : null}
      {f >= router + 4 && f < load ? <div style={{color: '#5b6375', filter: 'blur(1.5px)', fontSize: 28}}>{['unity-csharp', 'unreal-blueprints', 'phaser-scenes', 'bevy-ecs', 'roguelike'][Math.floor((f - router) / 3) % 5]} …</div> : null}
      {f >= load ? <div style={{marginTop: 6, opacity: ramp(f, load, load + 5)}}>&nbsp;&nbsp;⎿ Loading <span style={{background: 'rgba(47,123,240,.5)', padding: '0 8px', borderRadius: 6}}>godot-2d-movement</span> + <span style={{background: 'rgba(47,123,240,.5)', padding: '0 8px', borderRadius: 6}}>platformer</span></div> : null}
      {f >= skip ? <div style={{color: '#8a93a6', opacity: ramp(f, skip, skip + 5)}}>&nbsp;&nbsp;&nbsp;&nbsp;skipping the other 75 skills</div> : null}
    </div></Win></Pale>;
};

const Punch: React.FC<{u: Unit; f: number}> = ({u, f}) => <><Take scale={1.32 + 0.04 * ramp(f, u.from, u.to)}/><Brand/></>;

const Catalog: React.FC<{u: Unit; f: number}> = ({u, f}) => <Dark bg={RepoBg}>
  <Win f={f} from={u.from} title="README · Catalog — 77 skills across 9 categories" y={300} w={960} h={1000}>
    <div style={{position: 'absolute', left: 0, top: -40, width: 960, height: 1200}}><Clip src="r_catalog.mp4" from={u.from} startS={2.1} style={{width: 960, height: 1200}}/></div></Win>
</Dark>;

const STACK = ['Player movement', 'Platformer', 'Mechanics', 'Art direction'];
const Stack: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const b = D.beats.stack;
  const card = (i: number) => {
    const at = b[i] - 4, p = ease(ramp(f, at, at + 7));
    const content = i === 0 ? <Clip src="alley_push.mp4" from={at} style={{width: 900, height: 300, objectFit: 'cover'}}/>
      : i === 1 ? <Platformer from={at} w={900} h={300} startS={1.5}/>
      : i === 2 ? <Platformer from={at} w={900} h={300} startS={3.2}/>
      : <div style={{display: 'flex', height: 300}}>{['pillar.png', 'hero.png', 'crates.png'].map(s => <Img key={s} src={file(s)} style={{width: 300, height: 300, objectFit: 'cover'}}/>)}</div>;
    return f >= at ? <div key={i} style={{position: 'absolute', left: 90, top: 300 + i * 270, width: 900, height: 300, borderRadius: 24, overflow: 'hidden',
      boxShadow: '0 0 0 2px rgba(127,178,255,.55), 0 24px 60px rgba(0,0,0,.55)', transform: `translateX(${(1 - p) * 1100}px)`, filter: `blur(${(1 - p) * 8}px)`}}>
      {content}<div style={{position: 'absolute', left: 16, top: 14, background: 'rgba(6,8,13,.75)', borderRadius: 999, padding: '6px 18px', fontFamily: SANS, fontWeight: 800, fontSize: 26, color: '#fff'}}>{STACK[i]}</div></div> : null;
  };
  return <Dark bg={RepoBg}>{[0, 1, 2, 3].map(card)}</Dark>;
};

const Assets: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b, c] = D.beats.assets;
  return <Pale><Win f={f} from={u.from - 4} title="create-game-assets · one art direction" y={300} w={980} h={780} dark={false}>
    <Stills f={f} w={980} h={726} list={[['pillar.png', 0], ['hero.png', b - 2], ['crates.png', c - 2]]} push={[u.from, u.to]}/>
    <div style={{position: 'absolute', left: 18, bottom: 16, display: 'flex', gap: 10}}>{['Same palette', 'Same light', 'Same scale'].map((t, i) =>
      <div key={t} style={{background: 'rgba(255,255,255,.92)', borderRadius: 999, padding: '6px 16px', fontFamily: SANS, fontWeight: 800, fontSize: 22, color: INK, opacity: ramp(f, a + i * 5, a + i * 5 + 5)}}>{t}</div>)}</div>
    <div style={{position: 'absolute', right: 16, bottom: 16, fontFamily: SANS, fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.45)', padding: '4px 10px', borderRadius: 8}}>Made in Blender 5.2</div>
  </Win></Pale>;
};

const Warm: React.FC<{u: Unit; f: number}> = ({u, f}) => <Dark bg={<Img src={file('stage5_textures.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>}>
  <div style={{position: 'absolute', left: 140, top: 300, width: 800, height: 1000, borderRadius: 30, overflow: 'hidden', boxShadow: '0 0 0 2px rgba(127,178,255,.6), 0 40px 90px rgba(0,0,0,.6)'}}>
    <Img src={file('stage5_textures.png')} style={{width: 800, height: 1000, objectFit: 'cover', transform: `scale(${1.05 + 0.08 * ramp(f, u.from, u.to)})`}}/></div>
</Dark>;

const Builder: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [a, b] = D.beats.builder, second = f >= b - 4, p = ease(ramp(f, b - 4, b + 4));
  const panel = (label: string, child: React.ReactNode, x: number) => <div style={{position: 'absolute', left: x, top: 330, width: 900, height: 900, borderRadius: 28, overflow: 'hidden', background: '#0f1630',
    boxShadow: '0 0 0 2px rgba(127,178,255,.5), 0 30px 80px rgba(0,0,0,.6)'}}>
    <div style={{height: 120, display: 'flex', alignItems: 'center', padding: '0 34px', fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: '#fff'}}>{label}</div>
    <div style={{position: 'absolute', left: 24, right: 24, top: 120, bottom: 24, borderRadius: 18, overflow: 'hidden'}}>{child}</div></div>;
  return <Dark bg={RepoBg}>
    {panel('make it exist…', <Platformer from={u.from} w={852} h={756} startS={2}/>, 90 - p * 1000)}
    {second ? panel('…then make it good', <Clip src="alley_push.mp4" from={b - 4} style={{width: 852, height: 756, objectFit: 'cover'}}/>, 90 + (1 - p) * 1000) : null}
  </Dark>;
};

const Stores: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const [steam, itch] = D.beats.stores;
  const box = (at: number) => ({outline: f >= at ? `4px solid ${ORANGE}` : 'none', outlineOffset: -4, boxShadow: f >= at ? `0 0 30px ${ORANGE}` : 'none'});
  return <Dark bg={RepoBg}>
    <Win f={f} from={u.from} title="partner.steamgames.com · steam-publish skill" y={280} w={960} h={560}>
      <div style={{position: 'absolute', left: 0, top: -60, width: 960, height: 1200}}><Clip src="r_steam.mp4" from={u.from} startS={0.5} style={{width: 960, height: 1200}}/></div>
      <div style={{position: 'absolute', inset: 0, ...box(steam)}}/></Win>
    <Win f={f} from={u.from + 6} title="github.com/itchio/butler · itch-publish skill" y={880} w={960} h={520}>
      <div style={{position: 'absolute', left: 0, top: -200, width: 960, height: 1200}}><Clip src="r_itch.mp4" from={u.from} startS={1.6} style={{width: 960, height: 1200}}/></div>
      <div style={{position: 'absolute', inset: 0, ...box(itch)}}/></Win>
    {[[steam, 'si-steam.svg', 300], [itch, 'si-itchdotio.svg', 900]].map(([at, src, y]) => f >= (at as number) ?
      <div key={src as string} style={{position: 'absolute', right: 150, top: y as number, width: 92, height: 92, borderRadius: 22, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${pop(f, at as number)})`, boxShadow: '0 12px 30px rgba(0,0,0,.5)'}}><Logo src={src as string} size={60} color={src === 'si-steam.svg' ? '#171a21' : '#FA5C5C'}/></div> : null)}
  </Dark>;
};

const Cta: React.FC<{u: Unit; f: number}> = ({u, f}) => {
  const {type, dm} = D.beats.cta, word = 'GAME', up = pop(f, type - 6);
  const typed = word.slice(0, Math.max(0, Math.min(word.length, Math.floor((f - type) * 12 / FPS) + 1)));
  const d = pop(f, dm), card = pop(f, dm + 8);
  return <><Take scale={1.1}/><Brand/>
    <div style={{position: 'absolute', left: 70, right: 160, top: 1110, transform: `translateY(${(1 - up) * 400}px)`, opacity: Math.min(1, up * 2), background: '#fff', borderRadius: 36,
      boxShadow: '0 20px 50px rgba(0,0,0,.45)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{width: 62, height: 62, borderRadius: 31, background: BLUE, color: '#fff', fontFamily: SANS, fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>W</div>
      <div style={{flex: 1, fontFamily: SANS, fontWeight: f >= type ? 900 : 700, fontSize: 48, color: f >= type ? NAVY : '#8e8e93'}}>
        {f >= type ? typed : 'Add a comment…'}{f >= type && typed.length < word.length ? <span style={{color: '#0095F6'}}>|</span> : null}</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: typed.length === word.length ? '#0095F6' : '#B2DFFC'}}>Post</div></div>
    {f >= dm ? <div style={{position: 'absolute', left: 110, top: 1266, transform: `scale(${d})`, transformOrigin: '0 0', background: '#EFEFEF', borderRadius: 30,
      padding: '14px 26px', fontFamily: SANS, fontWeight: 700, fontSize: 32, color: NAVY}}>Here are the game-dev skills</div> : null}
    {f >= dm + 8 ? <div style={{position: 'absolute', left: 110, top: 1346, width: 760, transform: `scale(${card})`, transformOrigin: '0 0', background: '#fff', borderRadius: 24,
      boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', gap: 18, padding: 14}}>
      <div style={{width: 88, height: 88, borderRadius: 18, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Gamepad size={60}/></div>
      <div><div style={{fontFamily: SANS, fontWeight: 800, fontSize: 30, color: NAVY}}>77 game-dev skills + setup</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 24, color: '#6b6b6b'}}>withhammad.com/resources</div></div></div> : null}
  </>;
};

// ---------------------------------------------------------------- captions: karaoke phrase (upcoming words dim), accent words blue / serif
const Captions: React.FC<{f: number; u: Unit}> = ({f, u}) => {
  const c = D.captions.find((x: any) => f >= x.from && f < x.to);
  if (!c || (u.kind === 'cta' && f >= D.beats.cta.type - 6)) return null;
  const pale = PALE.has(u.kind);
  const y = pale ? 1120 : FACE.has(u.kind) ? 1300 : u.kind === 'stack' ? 1440 : 1440;
  return <div style={{position: 'absolute', left: 40, right: 40, top: y, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center', gap: 16}}>
    {c.words.map((w: any, i: number) => {
      const on = f >= w.at, p = ease(ramp(f, w.at, w.at + 4));
      const col = !on ? (pale ? 'rgba(21,24,33,.25)' : 'rgba(255,255,255,.3)') : w.accent ? (pale ? BLUE : SKY) : pale ? INK : '#fff';
      return <span key={i} style={{fontFamily: w.serif ? SERIF : SANS, fontStyle: w.serif ? 'italic' : 'normal', fontWeight: w.serif ? 400 : 800, fontSize: w.serif ? 78 : 64,
        letterSpacing: w.serif ? 0 : -1, color: col, lineHeight: 1.1, whiteSpace: 'nowrap', transform: `scale(${on ? 0.96 + 0.04 * p : 0.96})`,
        textShadow: pale ? 'none' : on && w.accent ? '0 0 22px rgba(47,123,240,.7), 0 3px 12px rgba(0,0,0,.6)' : '0 3px 12px rgba(0,0,0,.6)'}}>{w.t}</span>;
    })}</div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), u = unitAt(f);
  const S: Record<string, React.FC<{u: Unit; f: number}>> = {title: Title, repo: Repo, readme: Readme, engines: Engines, router: Router, terminal: TerminalScene,
    punch: Punch, catalog: Catalog, stack: Stack, assets: Assets, warm: Warm, builder: Builder, stores: Stores, cta: Cta};
  const Scene = S[u.kind];
  return <AbsoluteFill style={{background: NAVY, fontFamily: SANS}}>
    <Audio src={file('voice.wav')}/>
    <Scene u={u} f={f}/>
    <Captions f={f} u={u}/>
  </AbsoluteFill>;
};
