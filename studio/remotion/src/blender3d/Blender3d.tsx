// BLENDER reel (job b270e26281f7): 5 AI tools that make 3D way easier. Our own version of a competitor topic:
// own script, own design, real repo recordings in place of the reference's cartoon mock-ups.
// Presenter only on the two to-camera lines (hook 0-3.45 s, ending 36.45 s-end); the middle is voice over
// full-frame repo recordings with word-timed overlays. Times are spoken-word times from voice/words.json.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type BlenderProps = {words: Word[]};

const FPS = 30, SEAM = 980, AV_OFFSET = 0.8; // HeyGen take starts speaking 0.80 s in (measured on both lines)
const INK = '#070b1a', BLUE = '#3d8bff', SKY = '#7cc4ff', WHITE = '#f4f7ff', MUTED = '#8f9cc0', LINE = '#26345e', ORANGE = '#f5792a', GREEN = '#3ddc84';
const sans = 'Inter', mono = 'JetBrains Mono', serif = 'Instrument Serif';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.34) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

// ---------------------------------------------------------------- beat clock (seconds)
export const B = {
  hookEnd: 3.45,
  t1: 3.45, t1what: 5.85, t2: 10.0, t2what: 12.0, t3: 18.25, t3what: 22.0, t4: 25.3, t4what: 26.95, t5: 29.5, t5what: 31.75,
  cta: 36.45,
};

// ---------------------------------------------------------------- shared pieces
const Bg: React.FC<{tone?: string}> = ({tone = '#16306e'}) => <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 18%,${tone},${INK} 66%)`}}>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff07 1px,transparent 1px),linear-gradient(90deg,#ffffff07 1px,transparent 1px)', backgroundSize: '72px 72px'}} />
</AbsoluteFill>;
const Chip: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = '#ffffff14', color = WHITE, size = 30, style}) =>
  <div style={{display: 'inline-flex', alignItems: 'center', gap: size * 0.4, background: bg, color, fontFamily: sans, fontWeight: 700, fontSize: size, padding: `${size * 0.34}px ${size * 0.7}px`, borderRadius: size * 1.2, border: `2px solid ${bg === '#ffffff14' ? '#ffffff26' : bg}`, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number}> = ({size = 36}) => <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={GREEN} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke="#06210f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const LoopIcon: React.FC<{size: number; color?: string}> = ({size, color = WHITE}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
  <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>;

type Tool = {n: number; name: string; tile: React.ReactNode; tileBg: string; chips: string[]};
const tileImg = (src: string, size: number, opts: {invert?: boolean; round?: boolean} = {}) =>
  <Img src={A(src)} style={{width: size, height: size, borderRadius: opts.round ? size / 2 : 0, filter: opts.invert ? 'invert(1)' : undefined, objectFit: 'cover'}} />;
const TOOLS: Tool[] = [
  {n: 1, name: 'MCP for Blender', tileBg: ORANGE, tile: tileImg('si-blender.svg', 0, {invert: true}), chips: ['MIT', '34.6k stars']},
  {n: 2, name: 'Blender Skills', tileBg: '#1f2a4d', tile: null, chips: ['MIT', '28 skills']},
  {n: 3, name: 'Hunyuan3D 2.1', tileBg: '#ffffff', tile: null, chips: ['Tencent', 'open weights']},
  {n: 4, name: 'UniRig', tileBg: '#000000', tile: null, chips: ['MIT', 'SIGGRAPH 2025']},
  {n: 5, name: 'dream-loop', tileBg: '#6d3fd1', tile: null, chips: ['MIT', 'agent skill']},
];
const ToolTile: React.FC<{i: number; size: number}> = ({i, size}) => {
  const bg = TOOLS[i].tileBg, inner = size * 0.62;
  const icon = [
    <Img key={0} src={A('si-blender.svg')} style={{width: inner, height: inner, filter: 'invert(1)'}} />,
    <div key={1} style={{position: 'relative', width: inner, height: inner}}><Img src={A('si-blender.svg')} style={{width: inner * 0.8, height: inner * 0.8, filter: 'invert(1)'}} />
      <div style={{position: 'absolute', right: -inner * 0.08, bottom: -inner * 0.04, background: BLUE, color: '#fff', fontFamily: mono, fontWeight: 700, fontSize: inner * 0.22, padding: `${inner * 0.03}px ${inner * 0.07}px`, borderRadius: inner * 0.08}}>.md</div></div>,
    <Img key={2} src={A('gh-Tencent-Hunyuan.png')} style={{width: size * 0.82, height: size * 0.82, borderRadius: size}} />,
    <Img key={3} src={A('gh-VAST-AI-Research.png')} style={{width: size, height: size}} />,
    <LoopIcon key={4} size={inner} />,
  ][i];
  return <div style={{width: size, height: size, borderRadius: size * 0.26, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    boxShadow: `0 ${size * 0.12}px ${size * 0.3}px #00000080, 0 0 ${size * 0.5}px ${BLUE}44`, border: '3px solid #ffffff22'}}>{icon}</div>;
};

// Recording inside a browser card. vt = clip time.
const Rec: React.FC<{name: string; vt: number; x?: number; y?: number; w?: number; url: string; zoom?: number; origin?: string}> = ({name, vt, x = 60, y = 360, w = 960, url, zoom = 1, origin = '50% 0%'}) => {
  const h = w * 1350 / 1080;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h + 64, borderRadius: 30, overflow: 'hidden', background: '#fff', boxShadow: `0 40px 90px #000000aa, 0 0 0 2px ${LINE}, 0 0 120px ${BLUE}33`}}>
    <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#e9edf5', borderBottom: '1px solid #cfd6e4'}}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
      <div style={{flex: 1, marginLeft: 14, height: 40, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', fontFamily: sans, fontWeight: 600, fontSize: 24, color: '#3b4660'}}>{url}</div>
    </div>
    <div style={{position: 'absolute', left: 0, top: 64, width: w, height: h, overflow: 'hidden'}}>
      <div style={{width: w, height: h, transform: `scale(${zoom})`, transformOrigin: origin}}>
        <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{width: w, height: h}} /></Freeze>
      </div>
    </div>
  </div>;
};

// Tool header: number badge + serif name + chips, lands on the spoken name.
const Header: React.FC<{i: number; at: number; s: number}> = ({i, at, s}) => {
  const t = useT(), tool = TOOLS[i], p = pop(t, Math.max(s, at - 0.12), 0.32);
  return <div style={{position: 'absolute', left: 60, right: 60, top: 150, height: 190, display: 'flex', alignItems: 'center', gap: 30}}>
    <div style={{transform: `scale(${pop(t, s, 0.3)})`}}><ToolTile i={i} size={150} /></div>
    <div style={{flex: 1}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 18, transform: `translateX(${(1 - eo(pr(t, s, 0.3))) * 40}px)`, opacity: pr(t, s, 0.15)}}>
        <span style={{fontFamily: sans, fontWeight: 900, fontSize: 44, color: SKY, letterSpacing: 2}}>#{tool.n}</span>
        <span style={{fontFamily: serif, fontStyle: 'italic', fontSize: 96, lineHeight: 1, color: WHITE, transform: `scale(${p || 0.001})`, transformOrigin: '0 70%', display: 'inline-block', whiteSpace: 'nowrap'}}>{tool.name}</span>
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 14}}>{tool.chips.map((c, k) => <div key={c} style={{transform: `scale(${pop(t, at + 0.25 + k * 0.12)})`, transformOrigin: '0 50%'}}><Chip size={28} bg={k === 0 ? BLUE : '#ffffff14'}>{c}</Chip></div>)}</div>
    </div>
  </div>;
};
const Scene: React.FC<React.PropsWithChildren<{s: number; e: number; z: number; dir?: 'l' | 'r' | 'u' | 'none'}>> = ({s, e, z, dir = 'l', children}) => {
  const t = useT(); if (t < s || t >= e + 0.3) return null;
  const q = 1 - eo(pr(t, s, 0.3)), tr = dir === 'none' ? undefined : `translate(${dir === 'l' ? q * 1080 : dir === 'r' ? -q * 1080 : 0}px,${dir === 'u' ? q * 1920 : 0}px)`;
  return <AbsoluteFill style={{zIndex: z, transform: tr, overflow: 'hidden'}}>{children}</AbsoluteFill>;
};
const Badge: React.FC<{at: number; x: number; y: number; children: React.ReactNode; bg?: string; color?: string; size?: number; rot?: number}> = ({at, x, y, children, bg = BLUE, color = '#fff', size = 34, rot = -3}) => {
  const t = useT(), s = pop(t, at); if (s <= 0) return null;
  return <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s}) rotate(${rot}deg)`, transformOrigin: '0 50%', zIndex: 20}}><Chip bg={bg} color={color} size={size} style={{boxShadow: '0 14px 34px #00000088'}}>{children}</Chip></div>;
};

// ---------------------------------------------------------------- presenter
const Avatar: React.FC<{top: number; h: number}> = ({top, h}) => {
  const t = useT(), a = t < 20 ? Math.min(t, B.hookEnd) : B.hookEnd + Math.max(0, t - B.cta);
  const w = h * 720 / 1280 * 1.0, W = Math.max(1080, w), H = W * 1280 / 720;
  return <div style={{position: 'absolute', left: 0, top, width: 1080, height: h, overflow: 'hidden', background: '#2b3346'}}>
    <Freeze frame={Math.round((cl(a, 0, 6.63) + AV_OFFSET) * FPS)}>
      <OffthreadVideo muted src={A('avatar.mp4')} style={{position: 'absolute', left: (1080 - W) / 2, top: -H * 0.13, width: W, height: H}} />
    </Freeze>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 90, background: `linear-gradient(${INK},transparent)`}} />
  </div>;
};

// ---------------------------------------------------------------- scenes
const HookTop: React.FC = () => {
  const t = useT();
  const fan = (i: number) => { const p = eo(pr(t, 0.15 + i * 0.12, 0.45)), ang = (i - 2) * 11 * p, dx = (i - 2) * 170 * p, dy = Math.abs(i - 2) * 26 * p;
    return {transform: `translate(${dx}px,${dy}px) rotate(${ang}deg) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 3)}; };
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden'}}><Bg />
    <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center', fontFamily: sans, fontWeight: 900, color: WHITE, lineHeight: 1}}>
      <div style={{fontSize: 118, letterSpacing: -3}}>5 AI tools that</div>
      <div style={{marginTop: 18, display: 'inline-flex', alignItems: 'baseline', gap: 26}}>
        <span style={{fontSize: 118, letterSpacing: -3}}>make 3D</span>
        <span style={{fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 132, color: '#fff', background: BLUE, padding: '0 28px 8px', borderRadius: 26, boxShadow: `0 0 60px ${BLUE}aa`,
          transform: `scale(${t < 0.05 ? 1 : 1 + 0.08 * Math.sin(pr(t, 2.08, 0.6) * Math.PI)})`, display: 'inline-block'}}>way easier</span>
      </div>
    </div>
    <div style={{position: 'absolute', left: 540 - 85, top: 590}}>{[0, 1, 2, 3, 4].map(i => <div key={i} style={{position: 'absolute', left: 0, top: 0, ...fan(i)}}><ToolTile i={i} size={170} /></div>)}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center', transform: `scale(${pop(t, 1.1)})`}}><Chip size={32}>Modeling · rigging · animation</Chip></div>
  </div>;
};
const T1Name: React.FC = () => { const t = useT(); const vt = (t - B.t1) * 1.2;
  return <><Bg /><Header i={0} at={4.3} s={B.t1} /><Rec name="r1_mcp_header" vt={vt} url="github.com/ahujasid/mcp-for-blender" />
    <Badge at={4.95} x={600} y={1520} bg="#1b2550" size={30}>formerly blender-mcp</Badge></>; };
const PROMPT = 'Build a snowy cabin at night with a warm lamp';
const T1What: React.FC = () => {
  const t = useT(), vt = 5.6 + (t - B.t1what) * 1.4, typed = PROMPT.slice(0, Math.floor(pr(t, 5.95, 1.0) * PROMPT.length));
  const build = pr(t, 7.66, 1.4);
  return <><Bg tone="#3a2a12" /><Header i={0} at={-1} s={B.t1what - 0.01} /><Rec name="r2_mcp_features" vt={vt} url="github.com/ahujasid/mcp-for-blender#features" y={560} w={820} x={130} />
    <div style={{position: 'absolute', left: 60, top: 380, width: 960, height: 150, borderRadius: 34, background: '#0c1430', border: `3px solid ${BLUE}`, boxShadow: `0 0 50px ${BLUE}55`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', zIndex: 5}}>
      <Img src={A('claude-mark.svg')} style={{width: 64, height: 64}} />
      <div style={{flex: 1, fontFamily: sans, fontWeight: 600, fontSize: 38, color: WHITE, lineHeight: 1.2}}>{typed}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: SKY}}>|</span></div>
    </div>
    <div style={{position: 'absolute', left: 120, top: 1500, display: 'flex', alignItems: 'center', gap: 18, zIndex: 6, transform: `scale(${pop(t, 7.66)})`, transformOrigin: '0 50%'}}>
      <Chip bg="#0c1430" size={34}><Img src={A('claude-mark.svg')} style={{width: 36, height: 36}} />Claude</Chip>
      <div style={{width: 160, height: 10, borderRadius: 5, background: '#ffffff22', overflow: 'hidden'}}><div style={{height: '100%', width: `${100 * build}%`, background: ORANGE}} /></div>
      <Chip bg={ORANGE} size={34}><Img src={A('si-blender.svg')} style={{width: 34, height: 34, filter: 'invert(1)'}} />{build < 1 ? 'building...' : 'Built in Blender'}</Chip>
      {build >= 1 && <div style={{transform: `scale(${pop(t, 9.1)})`}}><Tick size={54} /></div>}
    </div></>;
};
const T2Name: React.FC = () => { const t = useT(); return <><Bg tone="#123060" /><Header i={1} at={10.96} s={B.t2} /><Rec name="r3a_skills_title" vt={(t - B.t2) * 1.1} url="github.com/EL4CTEO/blender-skills" /></>; };
const T2What: React.FC = () => {
  const t = useT(), vt = (t - B.t2what) * 1.55, n = Math.round(28 * eo(pr(t, 12.1, 0.8)));
  const rows: [string, number][] = [['modeling', 13.74], ['rigging', 14.42], ['real workflow', 16.32]];
  return <><Bg tone="#123060" /><Header i={1} at={-1} s={B.t2what - 0.01} /><Rec name="r3b_skills_table" vt={vt} url="github.com/EL4CTEO/blender-skills#skills" y={560} w={820} x={130} />
    <div style={{position: 'absolute', left: 70, top: 380, display: 'flex', alignItems: 'center', gap: 22, zIndex: 5}}>
      <span style={{fontFamily: sans, fontWeight: 900, fontSize: 130, lineHeight: 1, color: WHITE, fontVariantNumeric: 'tabular-nums', letterSpacing: -4}}>{n}</span>
      <span style={{fontFamily: sans, fontWeight: 800, fontSize: 46, color: SKY, lineHeight: 1.05}}>agent<br />skills</span>
    </div>
    <div style={{position: 'absolute', right: 70, top: 386, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', zIndex: 5}}>
      {rows.map(([x, at]) => <div key={x} style={{transform: `scale(${pop(t, at)})`, transformOrigin: '100% 50%', display: 'flex', alignItems: 'center', gap: 10}}><Chip bg="#0c1430" size={30}>{x}</Chip><Tick size={40} /></div>)}
    </div>
    <Badge at={17.0} x={150} y={1560} bg="#e5484d" size={34}>no more guessing</Badge></>;
};
const T3Name: React.FC = () => {
  const t = useT(), p = eo(pr(t, B.t3, 0.5));
  return <><Bg tone="#0d3a7a" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', transform: `scale(${0.7 + 0.3 * p})`, opacity: p}}>
      <div style={{display: 'inline-block', transform: `rotate(${(1 - p) * -90}deg)`}}><Img src={A('gh-Tencent-Hunyuan.png')} style={{width: 380, height: 380, borderRadius: 190, boxShadow: `0 0 120px ${BLUE}aa`}} /></div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 160, textAlign: 'center', fontFamily: sans, fontWeight: 900, fontSize: 44, color: SKY, letterSpacing: 4, opacity: pr(t, B.t3, 0.2)}}>#3</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontSize: 150, color: WHITE, lineHeight: 1, transform: `scale(${pop(t, 19.1)})`}}>Hunyuan3D 2.1</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 990, display: 'flex', gap: 18, justifyContent: 'center'}}>
      <div style={{transform: `scale(${pop(t, 21.22)})`}}><Chip size={36} bg={BLUE}>by Tencent</Chip></div>
      <div style={{transform: `scale(${pop(t, 21.4)})`}}><Chip size={36}>open weights</Chip></div>
    </div></>;
};
const T3What: React.FC = () => {
  const t = useT(), vt = (t - B.t3what) * 1.8;
  const step = (i: number, label: string, at: number) => <div style={{display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${pop(t, at)})`}}>
    <div style={{width: 170, height: 170, borderRadius: 28, background: '#0c1430', border: `3px solid ${t >= at ? BLUE : LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 92}}>{['📷', '🧊'][i]}</div>
    <div style={{fontFamily: sans, fontWeight: 800, fontSize: 40, color: WHITE, width: 200}}>{label}</div></div>;
  return <><Bg tone="#0d3a7a" /><Header i={2} at={-1} s={B.t3what - 0.01} /><Rec name="r4_hunyuan" vt={vt} url="huggingface.co/spaces/tencent/Hunyuan3D-2.1" y={600} w={800} x={140} />
    <div style={{position: 'absolute', left: 60, top: 380, right: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5}}>
      {step(0, '1 photo in', 22.12)}
      <div style={{fontSize: 70, color: SKY, opacity: pr(t, 23.0, 0.2)}}>→</div>
      {step(1, 'textured 3D out', 23.46)}
    </div>
    <Badge at={24.4} x={110} y={1560} bg="#1b2550" size={30}>free demo on Hugging Face</Badge></>;
};
const T4Name: React.FC = () => { const t = useT(); return <><Bg tone="#2a2a2a" /><Header i={3} at={26.34} s={B.t4} /><Rec name="r5a_unirig_title" vt={(t - B.t4) * 1.0} url="github.com/VAST-AI-Research/UniRig" /></>; };
const T4What: React.FC = () => {
  const t = useT(), vt = (t - B.t4what) * 1.6;
  return <><Bg tone="#2a2a2a" /><Header i={3} at={-1} s={B.t4what - 0.01} /><Rec name="r5b_unirig_gifs" vt={vt} url="github.com/VAST-AI-Research/UniRig" />
    <Badge at={28.06} x={80} y={1470} bg={ORANGE} size={36}>skeleton + skin weights</Badge>
    <Badge at={28.78} x={560} y={1560} bg={GREEN} color="#06210f" size={36} rot={3}>ready to animate</Badge></>;
};
const T5Name: React.FC = () => { const t = useT(); return <><Bg tone="#2d1a5c" /><Header i={4} at={31.12} s={B.t5} /><Rec name="r6a_dream_title" vt={(t - B.t5) * 1.0} url="github.com/achimala/dream-loop" /></>; };
const T5What: React.FC = () => {
  const t = useT(), vt = (t - B.t5what) * 1.5, R = 210, cx = 540, cy = 1210;
  const nodes: [string, number][] = [['Render', 33.28], ['Critic checks', 32.5], ['Fix it', 34.2]];
  const loops = t < 35.24 ? 1 : t < 35.92 ? 2 : 3, ang = (t - 32.0) * 2.4;
  return <><Bg tone="#2d1a5c" /><Header i={4} at={-1} s={B.t5what - 0.01} /><Rec name="r6b_dream_steps" vt={vt} url="github.com/achimala/dream-loop" w={960} y={380} />
    <div style={{position: 'absolute', left: cx - R - 110, top: cy - R - 110, width: (R + 110) * 2, height: (R + 110) * 2, borderRadius: R + 110, background: '#0b0f22ee', boxShadow: '0 30px 80px #000000aa', transform: `scale(${pop(t, 31.84)})`, zIndex: 6}}>
      <svg width={(R + 110) * 2} height={(R + 110) * 2} style={{position: 'absolute', inset: 0}}><circle cx={R + 110} cy={R + 110} r={R} stroke="#6d3fd1" strokeWidth={10} fill="none" strokeDasharray="18 14" />
        <circle cx={R + 110 + R * Math.cos(ang)} cy={R + 110 + R * Math.sin(ang)} r={18} fill={SKY} /></svg>
      {nodes.map(([x, at], k) => { const a = -Math.PI / 2 + k * 2 * Math.PI / 3; return <div key={x} style={{position: 'absolute', left: R + 110 + R * Math.cos(a) - 120, top: R + 110 + R * Math.sin(a) - 34, width: 240, textAlign: 'center'}}>
        <Chip bg={t >= at ? '#6d3fd1' : '#1b2550'} size={30}>{x}</Chip></div>; })}
      <div style={{position: 'absolute', left: 0, right: 0, top: R + 110 - 60, textAlign: 'center', fontFamily: sans, fontWeight: 900, color: WHITE}}>
        <div style={{fontSize: 26, letterSpacing: 4, color: MUTED}}>LOOP</div><div style={{fontSize: 96, lineHeight: 1, transform: `scale(${1 + 0.15 * (1 - eo(pr(t, loops === 2 ? 35.24 : loops === 3 ? 35.92 : 32, 0.3)))})`}}>{loops}</div></div>
    </div></>;
};
const CtaTop: React.FC = () => {
  const t = useT(), typed = 'BLENDER'.slice(0, Math.floor(pr(t, 36.86, 0.4) * 7.99)), dm = eo(pr(t, 37.7, 0.35));
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden'}}><Bg />
    <div style={{position: 'absolute', left: 0, right: 0, top: 190, textAlign: 'center', fontFamily: sans, fontWeight: 900, fontSize: 64, color: WHITE}}>Want the setup for all 5?</div>
    <div style={{position: 'absolute', left: 50, top: 320, width: 980, height: 124, borderRadius: 62, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', boxShadow: '0 20px 50px #00000088'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 88, height: 88, borderRadius: 44, objectFit: 'cover'}} />
      <div style={{flex: 1, marginLeft: 22, fontFamily: sans, fontWeight: 800, fontSize: 54, color: typed ? '#111' : '#9aa3b5'}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: BLUE, fontWeight: 500}}>|</span></div>
      <div style={{background: BLUE, color: '#fff', fontFamily: sans, fontWeight: 800, fontSize: 36, padding: '16px 36px', borderRadius: 40, transform: `scale(${1 + 0.12 * (t > 37.3 ? 1 - eo(pr(t, 37.3, 0.3)) : 0)})`}}>Post</div>
    </div>
    <div style={{position: 'absolute', left: 60, top: 500 + (1 - dm) * 400, opacity: dm, width: 960, height: 240, borderRadius: 32, background: '#0c1430', border: `2px solid ${LINE}`, padding: '24px 30px', boxShadow: '0 20px 50px #00000088'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('avatar_thumb.jpg')} style={{width: 60, height: 60, borderRadius: 30, objectFit: 'cover'}} />
        <span style={{fontFamily: sans, fontWeight: 800, fontSize: 38, color: WHITE}}>with.hammad</span><span style={{fontFamily: sans, fontWeight: 700, fontSize: 28, color: MUTED}}>· Direct message</span></div>
      <div style={{marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 16, background: BLUE, color: '#fff', fontFamily: sans, fontWeight: 700, fontSize: 42, padding: '20px 30px', borderRadius: '8px 30px 30px 30px'}}>
        <Img src={A('si-blender.svg')} style={{width: 40, height: 40, filter: 'invert(1)'}} />Your 3D AI tools setup guide</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 790, textAlign: 'center', transform: `scale(${pop(t, 36.62)})`}}><Chip size={34} bg={ORANGE}>Comment BLENDER</Chip></div>
  </div>;
};

// ---------------------------------------------------------------- captions
// [first word, last word, text]; *...* = accent words. Display spellings differ from the TTS spellings.
const CHUNKS: [number, number, string][] = [
  [8, 9, 'NUMBER *ONE*'], [10, 12, '*MCP FOR BLENDER*'], [13, 15, 'TYPE A SCENE'], [16, 18, 'IN *PLAIN ENGLISH*'], [19, 21, '*CLAUDE* BUILDS IT'], [22, 25, 'RIGHT INSIDE *BLENDER*'],
  [26, 27, 'NUMBER *TWO*'], [28, 29, '*BLENDER SKILLS*'], [30, 32, '*28* AGENT SKILLS'], [33, 36, 'FROM *MODELING* TO *RIGGING*'], [37, 40, 'SO YOUR AGENT FOLLOWS'], [41, 43, 'A *REAL WORKFLOW*'], [44, 46, 'INSTEAD OF GUESSING'],
  [47, 48, 'NUMBER *THREE*'], [49, 53, '*HUNYUAN3D 2.1*'], [54, 55, 'FROM *TENCENT*'], [56, 58, '*ONE PHOTO* IN'], [59, 63, 'A *TEXTURED 3D MODEL* OUT'],
  [64, 65, 'NUMBER *FOUR*'], [66, 66, '*UNIRIG*'], [67, 70, 'IT GIVES YOUR MODEL'], [71, 72, 'A *SKELETON*'], [73, 75, '*READY TO ANIMATE*'],
  [76, 78, 'AND NUMBER *FIVE*'], [79, 79, '*DREAM-LOOP*'], [80, 82, 'A *CRITIC AGENT*'], [83, 85, 'CHECKS EVERY *RENDER*'], [86, 89, 'AND SENDS *FIXES* BACK'], [90, 92, '*LOOP AFTER LOOP*'],
  [93, 94, 'COMMENT *BLENDER*'], [95, 99, "AND I'LL SEND YOU"], [100, 103, 'THE *SETUP* FOR ALL FIVE'],
];
const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const t = useT();
  const times = CHUNKS.map(([a, b]) => [words[a].startMs / 1000 - 0.04, words[b].endMs / 1000 + 0.3]);
  const i = times.findIndex(([s, e], k) => t >= s && t < Math.min(e, k + 1 < times.length ? times[k + 1][0] : 1e9));
  if (i < 0) return null;
  const [a] = CHUNKS[i], split = t >= B.cta, top = split ? SEAM - 52 : 1700;
  const parts = CHUNKS[i][2].split('*'), s = 1 + 0.06 * (1 - eo(pr(t, times[i][0], 0.1)));
  // karaoke: words not yet spoken are dimmed
  let wi = a; const spoken = (txt: string) => txt.split(' ').filter(Boolean).map(w => { const on = t >= words[Math.min(wi, CHUNKS[i][1])].startMs / 1000 - 0.03; wi++; return [w, on] as [string, boolean]; });
  return <div style={{position: 'absolute', left: 0, right: 0, top, zIndex: 45, textAlign: 'center'}}>
    <div style={{display: 'inline-block', background: '#070b1ae8', border: `2px solid ${LINE}`, borderRadius: 22, padding: '10px 30px', fontFamily: sans, fontWeight: 900, fontSize: 64, letterSpacing: 0.5, color: WHITE, whiteSpace: 'nowrap',
      boxShadow: '0 10px 30px #00000099', transform: `scale(${s})`}}>
      {parts.map((x, k) => spoken(x).map(([w, on], j) => <span key={k + '-' + j} style={{color: k % 2 ? SKY : WHITE, opacity: on ? 1 : 0.35}}>{w}{' '}</span>))}
    </div>
  </div>;
};

export const Blender3d: React.FC<BlenderProps> = ({words}) => {
  const t = useT();
  return <AbsoluteFill style={{background: INK, fontFamily: sans, overflow: 'hidden'}}>
    {t < B.hookEnd + 0.3 && <><HookTop /><Avatar top={SEAM} h={1920 - SEAM} /></>}
    <Scene s={B.t1} e={B.t1what} z={2}><T1Name /></Scene>
    <Scene s={B.t1what} e={B.t2} z={3} dir="none"><T1What /></Scene>
    <Scene s={B.t2} e={B.t2what} z={4}><T2Name /></Scene>
    <Scene s={B.t2what} e={B.t3} z={5} dir="none"><T2What /></Scene>
    <Scene s={B.t3} e={B.t3what} z={6} dir="u"><T3Name /></Scene>
    <Scene s={B.t3what} e={B.t4} z={7} dir="none"><T3What /></Scene>
    <Scene s={B.t4} e={B.t4what} z={8}><T4Name /></Scene>
    <Scene s={B.t4what} e={B.t5} z={9} dir="none"><T4What /></Scene>
    <Scene s={B.t5} e={B.t5what} z={10}><T5Name /></Scene>
    <Scene s={B.t5what} e={B.cta} z={11} dir="none"><T5What /></Scene>
    <Scene s={B.cta} e={99} z={12} dir="u"><CtaTop /><Avatar top={SEAM} h={1920 - SEAM} /></Scene>
    <div style={{position: 'absolute', left: 60, top: 90, zIndex: 46, background: '#070b1ad0', color: WHITE, fontWeight: 800, fontSize: 22, letterSpacing: 5, padding: '8px 16px', borderRadius: 10}}>WITHHAMMAD</div>
    <Captions words={words} />
  </AbsoluteFill>;
};
