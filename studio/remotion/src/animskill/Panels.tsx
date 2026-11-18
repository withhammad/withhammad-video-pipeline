// Cartoon-skill reel panels (job cartoon-DfzyKKrMf_i). Facts checked 18 Nov 2026 via the GitHub API + README:
// github.com/mromidev/claude-animated-shorts, MIT, 4,059 stars (4.1k), installs to ~/.claude/skills/cartoon-3d-short;
// needs Remotion with @remotion/three, Node, Python 3, ffmpeg; style formula measured from 20 reference shorts
// (38 reference frames, 7 measured reports). Repo/README screens are real screenshots (public/animskill/shots).
import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif', MONO = 'CpMono, Menlo, monospace';
const CLAY = '#d97757', GREEN = '#3ddc84', INK = '#0d1117', CARD = '#161b22', LINE = '#30363d', MUTE = '#8b949e', SKY = '#58a6ff', GOLD = '#ffd166';
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const ap = (t: number, at: number, d = 0.28) => ease((t - at) / d);
const shot = (n: string) => staticFile(`animskill/shots/${n}.png`);
const type = (s: string, t: number, at: number, cps = 32) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));
export type Cue = Record<string, number>;

const Frame: React.FC<{t: number; from: number; to: number; kicker: string; children: React.ReactNode}> = ({t, from, to, kicker, children}) => {
  if (t < from - 0.05 || t > to) return null;
  const a = interpolate(t, [from, from + 0.3, to - 0.2, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 150, left: 50, right: 50, height: 820, borderRadius: 34, background: INK, border: `2px solid ${LINE}`,
    boxShadow: '0 30px 80px rgba(0,0,0,.55)', padding: '28px 32px', fontFamily: F, color: '#fff', opacity: a, transform: `scale(${0.95 + 0.05 * ease((t - from) / 0.3)})`, transformOrigin: '50% 0%', overflow: 'hidden'}}>
    <div style={{fontSize: 22, letterSpacing: 2, fontWeight: 800, color: SKY, marginBottom: 18}}>{kicker}</div>
    {children}
  </div>;
};
const Chip: React.FC<{a: number; children: React.ReactNode; color?: string; size?: number}> = ({a, children, color = LINE, size = 30}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 12}px)`, fontSize: size, fontWeight: 800, border: `2px solid ${color}`, borderRadius: 30, padding: '8px 20px', background: CARD}}>{children}</div>;
const Shot: React.FC<{a: number; src: string; h?: number; pos?: string}> = ({a, src, h = 330, pos = '50% 0%'}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 16}px)`, borderRadius: 18, overflow: 'hidden', border: `2px solid ${LINE}`, height: h, background: '#fff'}}>
    <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
  </div>;
const Term: React.FC<{title: string; children: React.ReactNode; a?: number}> = ({title, children, a = 1}) =>
  <div style={{opacity: a, borderRadius: 20, border: `2px solid ${LINE}`, background: '#0a0d12', overflow: 'hidden'}}>
    <div style={{display: 'flex', gap: 10, alignItems: 'center', padding: '14px 18px', background: CARD, borderBottom: `2px solid ${LINE}`}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
      <div style={{marginLeft: 12, fontFamily: MONO, fontSize: 20, color: MUTE}}>{title}</div>
    </div>
    <div style={{padding: '22px 24px', fontFamily: MONO, fontSize: 30, lineHeight: 1.45, color: '#e6edf3', minHeight: 150}}>{children}</div>
  </div>;
const Caret: React.FC<{t: number}> = ({t}) => <span style={{opacity: Math.floor(t * 2.4) % 2 ? 1 : 0, color: GREEN}}>▌</span>;

export const Repo: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.repo} to={c.code} kicker="FREE CLAUDE SKILL · ON GITHUB">
  <Shot a={ap(t, c.repo + 0.05)} src={shot('repo-top')} h={430} pos="50% 30%" />
  <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 26}}>
    <Chip a={ap(t, c.stars)} color={GOLD} size={40}>★ 4,000+ stars</Chip>
    <Chip a={ap(t, c.stars + 0.25)} color={GREEN} size={40}>MIT · free</Chip>
  </div>
  <div style={{marginTop: 26, fontSize: 26, color: MUTE, opacity: ap(t, c.stars + 0.5)}}>github.com/mromidev/claude-animated-shorts</div>
</Frame>;

const CODE = ['const world = makeTown(scene);', 'const hero = drawCharacter("soldier");', 'camera.glide(path, {ease: "inOut"});', 'mix(music, sfx, {duck: voice});'];
export const Code: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.code} to={c.step1} kicker="EVERY FRAME IS DRAWN IN CODE · ON YOUR COMPUTER">
  <Term title="story.ts" a={ap(t, c.code + 0.05)}>
    {CODE.map((l, i) => <div key={i} style={{opacity: ap(t, c.code + 0.25 + i * 0.35, 0.2)}}><span style={{color: MUTE}}>{i + 1} </span>{type(l, t, c.code + 0.25 + i * 0.35, 60)}</div>)}
  </Term>
  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 26}}>
    {[[c.chars, '2D characters', '🧍'], [c.world, 'Colourful 3D world', '🏘️'], [c.cams, 'Gliding cameras', '🎥'], [c.music, 'Music & sound', '🎵']].map(([at, label, ic]) =>
      <div key={label as string} style={{opacity: ap(t, at as number), transform: `scale(${0.85 + 0.15 * ap(t, at as number)})`, background: CARD, border: `2px solid ${LINE}`, borderRadius: 20, padding: '20px 22px', fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 14}}>
        <span style={{fontSize: 40}}>{ic}</span>{label}</div>)}
  </div>
  <div style={{marginTop: 22, textAlign: 'center', fontSize: 28, color: GOLD, fontWeight: 800, opacity: ap(t, c.music + 0.3)}}>No AI video generator</div>
</Frame>;

const Step: React.FC<{n: number}> = ({n}) => <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 22}}>
  <div style={{width: 54, height: 54, borderRadius: 27, background: CLAY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900}}>{n}</div>
  <div style={{fontSize: 30, fontWeight: 800, letterSpacing: 3}}>STEP</div></div>;

export const Step1: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.step1} to={c.step2} kicker="DOWNLOAD THE SKILL">
  <Step n={1} />
  <Term title="~ terminal">
    <div><span style={{color: GREEN}}>$ </span>{type('cd ~/.claude/skills', t, c.step1 + 0.3, 40)}</div>
    {t > c.clone && <div><span style={{color: GREEN}}>$ </span>{type('git clone github.com/mromidev/claude-animated-shorts cartoon-3d-short', t, c.clone, 45)}<Caret t={t} /></div>}
  </Term>
  <div style={{marginTop: 28, fontSize: 30, color: MUTE, opacity: ap(t, c.clone + 0.8)}}>Lands in <span style={{color: '#fff', fontFamily: MONO}}>~/.claude/skills/cartoon-3d-short</span></div>
  <div style={{marginTop: 26}}><Shot a={ap(t, c.clone + 1.0)} src={shot('readme-install')} h={250} pos="0% 15%" /></div>
</Frame>;

export const Step2: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.step2} to={c.step3} kicker="INSTALL THE TOOLS">
  <Step n={2} />
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12}}>
    {[['Remotion', '#4a8cff', c.remotion], ['Node', '#5fa04e', c.node], ['Python', '#f2c94c', c.python], ['FFmpeg', '#3ddc84', c.ffmpeg]].map(([n, col, at]) =>
      <div key={n as string} style={{opacity: ap(t, at as number), transform: `translateY(${(1 - ap(t, at as number)) * 20}px)`, background: CARD, border: `2px solid ${col}`, borderRadius: 20, padding: '24px 6px', textAlign: 'center', fontSize: 30, fontWeight: 800}}>
        <div style={{width: 44, height: 44, borderRadius: 12, background: col as string, margin: '0 auto 14px'}} />{n}</div>)}
  </div>
  <div style={{marginTop: 28}}><Shot a={ap(t, c.ffmpeg + 0.2)} src={shot('readme-install')} h={300} pos="0% 40%" /></div>
</Frame>;

const PROMPT = 'Use the cartoon short skill and make a short about the Titanic';
export const Step3: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.step3} to={c.pipe} kicker="TELL CLAUDE">
  <Step n={3} />
  <Term title="Claude Code">
    <div><span style={{color: CLAY}}>&gt; </span>{type(PROMPT, t, c.prompt, 40)}<Caret t={t} /></div>
    {t > c.prompt + PROMPT.length / 40 + 0.2 && <div style={{marginTop: 14, color: CLAY, fontSize: 26}}>● Skill(cartoon-3d-short)</div>}
  </Term>
  <div style={{marginTop: 30, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'}}>
    {['Topic & facts', 'Script', 'Voice', 'Shot plan', 'Stills', 'Render'].map((k, i) => {
      const at0 = c.prompt + PROMPT.length / 40 + 0.3 + i * 0.12;
      return <React.Fragment key={k}><Chip a={ap(t, at0, 0.2)} size={28} color={i === 5 ? GREEN : LINE}>{k}</Chip>{i < 5 && <span style={{color: MUTE, fontSize: 28, opacity: ap(t, at0, 0.2)}}>→</span>}</React.Fragment>;
    })}
  </div>
  <div style={{marginTop: 20, fontSize: 24, color: MUTE, opacity: ap(t, c.prompt + PROMPT.length / 40 + 1.1)}}>The order in the skill's SKILL.md (from its README)</div>
</Frame>;

export const Pipe: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.pipe} to={c.check} kicker="CLAUDE DOES THE REST">
  {[[c.story, 'Writes the story'], [c.shots, 'Plans every shot'], [c.render, 'Renders it'], [c.mix, 'Mixes the sound']].map(([at, label]) =>
    <div key={label as string} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 22, opacity: ap(t, at as number), transform: `translateX(${(1 - ap(t, at as number)) * -30}px)`,
      background: CARD, border: `2px solid ${LINE}`, borderRadius: 22, padding: '26px 28px'}}>
      <div style={{width: 58, height: 58, borderRadius: 29, background: GREEN, color: INK, fontSize: 38, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ap(t, (at as number) + 0.15)})`}}>✓</div>
      <div style={{fontSize: 44, fontWeight: 800}}>{label}</div>
    </div>)}
  <div style={{marginTop: 10, textAlign: 'center', fontFamily: SERIF, fontSize: 52, fontStyle: 'italic', color: GOLD, opacity: ap(t, c.mix + 0.35)}}>55–70 s vertical shorts</div>
</Frame>;

export const Check: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.check} to={c.end} kicker="IT CHECKS ITS OWN FRAMES">
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10}}>
    {Array.from({length: 20}, (_, i) => {
      const a = ap(t, c.check + 0.15 + i * 0.06, 0.18);
      const hue = (i * 37) % 360;
      return <div key={i} style={{opacity: a, transform: `scale(${0.7 + 0.3 * a})`, height: 112, borderRadius: 12, border: `2px solid ${LINE}`,
        background: `linear-gradient(160deg, hsl(${hue},55%,42%), hsl(${(hue + 40) % 360},50%,22%))`, display: 'flex', alignItems: 'flex-end', padding: 8, fontFamily: MONO, fontSize: 18, color: 'rgba(255,255,255,.85)'}}>{String(i + 1).padStart(2, '0')}</div>;
    })}
  </div>
  <div style={{marginTop: 26, display: 'flex', alignItems: 'baseline', gap: 18, opacity: ap(t, c.twenty)}}>
    <div style={{fontFamily: SERIF, fontSize: 120, lineHeight: 1, color: GOLD}}>20</div>
    <div style={{fontSize: 34, fontWeight: 800}}>reference shorts<br /><span style={{color: MUTE, fontSize: 26, fontWeight: 500}}>38 frames · 7 measured reports</span></div>
  </div>
  <div style={{marginTop: 22, opacity: ap(t, c.style)}}>
    {[['Colour', 0.92], ['Lighting', 0.86], ['Depth', 0.9], ['Ink lines', 0.88]].map(([k, v], i) => <div key={k as string} style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10}}>
      <div style={{width: 150, fontSize: 26, color: MUTE}}>{k}</div>
      <div style={{flex: 1, height: 16, borderRadius: 8, background: CARD}}><div style={{height: 16, borderRadius: 8, background: GREEN, width: `${(v as number) * 100 * ease((t - c.style - i * 0.1) / 0.5)}%`}} /></div>
    </div>)}
    <div style={{fontSize: 30, fontWeight: 800, color: GREEN, marginTop: 8}}>Style stays consistent</div>
  </div>
</Frame>;

// Hook over his close-up: the reference's "animated story shorts / with Claude" title pills.
export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 130, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: CLAY, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>MADE BY CLAUDE</div>
    <div style={{fontFamily: SERIF, fontSize: 100, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 10, textAlign: 'center', whiteSpace: 'nowrap'}}>Cartoon shorts, <span style={{fontStyle: 'italic', color: GOLD}}>free</span></div>
  </div>;
};
