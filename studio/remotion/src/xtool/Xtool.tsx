// XTOOL reel (job 442c9f68fb5e). Split screen like the reference: a demo panel on top (1080x840), the presenter
// below for the two to-camera lines (hook, ending) and a word-timed statement zone for the voice-only middle.
// Every time below is a spoken-word time from the recorded narration (voice/words.json), in seconds.
import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

export type Word = {text: string; startMs: number; endMs: number};
export type XtoolProps = {words: Word[]; stars: number};

const FPS = 30, SEAM = 840;
const Y = '#FFE066', R = '#E5484D', G = '#3DDC84', B = '#4C8DFF', INK = '#0a0f1e', MUTED = '#93a0bf', CARD = '#111a2e', LINE = '#2a3657';
const mono = 'JetBrains Mono', sans = 'Inter';
const A = (n: string) => staticFile('x/' + n);
const useT = () => useCurrentFrame() / FPS;
const cl = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const eo = (n: number) => 1 - Math.pow(1 - cl(n), 3);
const pr = (t: number, s: number, d: number) => cl((t - s) / d);
const pop = (t: number, s: number, d = 0.34) => { const x = pr(t, s, d); if (x <= 0) return 0; const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const mapT = (t: number, pts: [number, number][]) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};
type Dir = 'l' | 'r' | 'u' | 'd' | 'none';
const slide = (t: number, s: number, dir: Dir, w: number, h: number) => {
  const q = 1 - eo(pr(t, s, 0.3));
  return dir === 'none' ? undefined : `translate(${dir === 'l' ? -q * w : dir === 'r' ? q * w : 0}px,${dir === 'u' ? -q * h : dir === 'd' ? q * h : 0}px)`;
};

// ------------------------------------------------------------------ shared pieces
const PanelBg: React.FC<{tone?: string}> = ({tone = '#16224a'}) => <AbsoluteFill style={{background: `radial-gradient(120% 90% at 80% 10%,${tone},${INK} 62%)`}}>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)', backgroundSize: '60px 60px'}} />
</AbsoluteFill>;
const Top: React.FC<React.PropsWithChildren<{s: number; e: number; dir: Dir; z: number}>> = ({s, e, dir, z, children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden', zIndex: z, transform: slide(t, s, dir, 1080, SEAM)}}>{children}</div>;
};
const Bot: React.FC<React.PropsWithChildren<{s: number; e: number; dir: Dir; z: number}>> = ({s, e, dir, z, children}) => {
  const t = useT(); if (t < s || t >= e + 0.32) return null;
  return <div style={{position: 'absolute', left: 0, top: SEAM, width: 1080, height: 1080, overflow: 'hidden', zIndex: z, transform: slide(t, s, dir, 1080, 1080)}}>{children}</div>;
};
const Pill: React.FC<React.PropsWithChildren<{bg?: string; color?: string; size?: number; style?: React.CSSProperties}>> = ({children, bg = Y, color = '#111', size = 30, style}) =>
  <div style={{display: 'inline-block', background: bg, color, fontWeight: 800, fontSize: size, padding: `${size * 0.32}px ${size * 0.7}px`, borderRadius: size, letterSpacing: 0.5, whiteSpace: 'nowrap', ...style}}>{children}</div>;
const Tick: React.FC<{size?: number; color?: string}> = ({size = 36, color = G}) => <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={color} /><path d="M6.5 12.5l3.6 3.6 7.2-7.6" fill="none" stroke="#06210f" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const Win: React.FC<React.PropsWithChildren<{x: number; y: number; w: number; h: number; title: string; icon?: React.ReactNode; style?: React.CSSProperties}>> = ({x, y, w, h, title, icon, children, style}) =>
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: '#0c1222', border: `2px solid ${LINE}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 60px #00000066', ...style}}>
    <div style={{height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', background: '#141c33', borderBottom: `1px solid ${LINE}`}}>
      {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: 15, height: 15, borderRadius: 9, background: c}} />)}
      <div style={{marginLeft: 12, display: 'flex', alignItems: 'center', gap: 10, fontFamily: sans, fontWeight: 700, fontSize: 24, color: '#c9d3ee'}}>{icon}{title}</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 56, bottom: 0}}>{children}</div>
  </div>;
const KW = '#ff7ab2', TY = '#6bdfff', PL = '#e6ecfb', ST = '#ffd479';
type Seg = [string, string];
const SWIFT: Seg[][] = [
  [['import', KW], [' SwiftUI', TY]],
  [],
  [['struct', KW], [' MenuView', TY], [': ', PL], ['View', TY], [' {', PL]],
  [['  var', KW], [' body: ', PL], ['some', KW], [' View', TY], [' {', PL]],
  [['    List', TY], ['(menu) { item ', PL], ['in', KW]],
  [['      Text', TY], ['(item.name)', PL]],
  [['    }', PL]],
  [['  }', PL]],
  [['}', PL]],
];
const Code: React.FC<{p: number; size: number; lines?: Seg[][]}> = ({p, size, lines = SWIFT}) => {
  const total = lines.reduce((n, l) => n + l.reduce((m, s) => m + s[0].length, 0) + 1, 0);
  let left = Math.floor(cl(p) * total);
  return <div style={{fontFamily: mono, fontWeight: 500, fontSize: size, lineHeight: 1.42, whiteSpace: 'pre'}}>
    {lines.map((l, i) => { const out = l.map((s, k) => { const n = Math.max(0, Math.min(left, s[0].length)); left -= n; return <span key={k} style={{color: s[1]}}>{s[0].slice(0, n)}</span>; }); left = Math.max(0, left - 1);
      return <div key={i} style={{height: size * 1.42}}>{out}</div>; })}
  </div>;
};
const ICONS = ['#34c759', '#0a84ff', '#ff9f0a', '#ff375f', '#5e5ce6', '#64d2ff', '#ffd60a', '#30d158', '#bf5af2', '#ff453a', '#8e8e93'];
const Phone: React.FC<{x: number; y: number; w: number; land: number; toast?: number}> = ({x, y, w, land, toast = 0}) => {
  const h = w * 1.95, pad = w * 0.035, cell = (w - pad * 2 - w * 0.12) / 4, ic = cell * 0.78;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: w * 0.17, background: '#07080c', border: '3px solid #3a3f52', boxShadow: '0 30px 60px #00000080'}}>
    <div style={{position: 'absolute', inset: pad, borderRadius: w * 0.14, overflow: 'hidden', background: 'linear-gradient(165deg,#1b2f7a,#6d3fd1 52%,#f08a4b)'}}>
      <div style={{position: 'absolute', left: '50%', top: w * 0.035, width: w * 0.3, height: w * 0.085, marginLeft: -w * 0.15, borderRadius: w * 0.05, background: '#000'}} />
      <div style={{position: 'absolute', left: w * 0.06, right: w * 0.06, top: w * 0.2, display: 'flex', flexWrap: 'wrap'}}>
        {ICONS.map((c, i) => <div key={i} style={{width: cell, height: cell * 1.12, display: 'flex', justifyContent: 'center'}}><div style={{width: ic, height: ic, borderRadius: ic * 0.24, background: c, opacity: 0.92}} /></div>)}
        <div style={{width: cell, height: cell * 1.12, display: 'flex', justifyContent: 'center'}}>
          <div style={{width: ic, height: ic, borderRadius: ic * 0.24, background: 'linear-gradient(135deg,#ff7a3d,#ffd15c)', transform: `scale(${land})`, boxShadow: land > 0 ? `0 0 ${ic * 0.9}px ${ic * 0.25}px #ffd15ccc` : undefined,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans, fontWeight: 900, fontSize: ic * 0.62, color: '#fff'}}>M</div>
        </div>
      </div>
      {toast > 0 && <div style={{position: 'absolute', left: w * 0.08, right: w * 0.08, bottom: w * 0.1, padding: `${w * 0.035}px 0`, borderRadius: w * 0.06, background: '#0b1a12ee', border: `2px solid ${G}`, color: G, fontFamily: sans, fontWeight: 800,
        fontSize: w * 0.085, textAlign: 'center', transform: `scale(${toast})`}}>Installed</div>}
    </div>
  </div>;
};
const WinLogo: React.FC<{size: number}> = ({size}) => <div style={{width: size, height: size, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: size * 0.07}}>{[0, 1, 2, 3].map(i => <div key={i} style={{background: '#19a8f5'}} />)}</div>;
const OFF = 262;
const Chrome: React.FC = () => <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: OFF, background: 'linear-gradient(#05070f,#0d1326)', borderBottom: `2px solid ${LINE}`}} />;
const Shot: React.FC<{name: string; vt: number}> = ({name, vt}) => <Freeze frame={Math.max(0, Math.round(vt * FPS))}><OffthreadVideo muted src={A(name + '.mp4')} style={{position: 'absolute', left: 0, top: OFF, width: 1080, height: SEAM}} /></Freeze>;
const Source: React.FC<{children: string}> = ({children}) => <div style={{position: 'absolute', right: 40, top: 220, background: '#1a2340', color: '#dfe6f5', fontFamily: sans, fontWeight: 700, fontSize: 22, padding: '8px 16px', borderRadius: 10}}>{children}</div>;

// ------------------------------------------------------------------ presenter (hook 0-7.04 and ending 35.27-end of the narration)
const Avatar: React.FC = () => {
  const t = useT();
  const a = t < 20 ? Math.min(t, 7.0) : 7.04 + Math.max(0, t - 35.27);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#7b7f86'}}>
    <Freeze frame={Math.round(cl(a, 0, 10.05) * FPS)}>
      <OffthreadVideo muted src={A('avatar.mp4')} style={{position: 'absolute', left: -110, top: -320, width: 1300, height: 2311, filter: 'blur(26px) brightness(.8)'}} />
      <OffthreadVideo muted src={A('avatar.mp4')} style={{position: 'absolute', left: 54, top: -188, width: 972, height: 1728}} />
    </Freeze>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: 'linear-gradient(#0a0f1e99,transparent)'}} />
  </div>;
};

// ------------------------------------------------------------------ top panel scenes
const HookScene: React.FC = () => {
  const t = useT();
  return <><PanelBg />
    <Win x={40} y={270} w={640} h={490} title="Claude" icon={<Img src={A('claude-mark.svg')} style={{width: 26, height: 26}} />}>
      <div style={{padding: '14px 22px'}}><Code p={0.3 + 0.7 * pr(t, 0, 1.3)} size={25} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, background: '#070b16', borderTop: `1px solid ${LINE}`, padding: '10px 22px', fontFamily: mono, fontSize: 25, color: '#e6ecfb'}}>
        <div><span style={{color: G}}>$ </span>{'xtool dev'.slice(0, Math.floor(pr(t, 0.7, 0.5) * 9))}</div>
        <div style={{display: 'flex', gap: 18, marginTop: 6, fontSize: 21, color: MUTED}}>{['Build', 'Sign', 'Install'].map((x, i) => <span key={x} style={{opacity: pr(t, 1.25 + i * 0.2, 0.12), color: G}}>✓ {x}</span>)}</div>
      </div>
    </Win>
    <Phone x={722} y={264} w={272} land={pop(t, 1.75)} />
    <div style={{position: 'absolute', left: 706, top: 650, transform: `scale(${pop(t, 0.35)}) rotate(-4deg)`}}><Pill size={28}>NO MAC NEEDED</Pill></div>
  </>;
};
const bez = (p: number, a: [number, number], c: [number, number], b: [number, number]) => [(1 - p) * (1 - p) * a[0] + 2 * (1 - p) * p * c[0] + p * p * b[0], (1 - p) * (1 - p) * a[1] + 2 * (1 - p) * p * c[1] + p * p * b[1]];
const XcodeScene: React.FC = () => {
  const t = useT(), cut = pr(t, 4.08, 0.28), arc = eo(pr(t, 4.62, 0.6)), pt = bez(arc, [195, 420], [540, 196], [885, 350]);
  const shake = cut > 0 && cut < 1 ? Math.sin(t * 90) * 7 : 0;
  return <><PanelBg tone="#1b2552" />
    <div style={{position: 'absolute', left: 60, top: 284, fontFamily: sans, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: t < 4.6 ? MUTED : Y}}>{t < 4.6 ? 'THE USUAL ROUTE' : 'WITH XTOOL'}</div>
    <svg width={1080} height={SEAM} style={{position: 'absolute', inset: 0}}>
      <path d="M340 535H420M660 535H780" stroke={cut > 0 ? '#4a5576' : '#aab6d6'} strokeWidth={6} strokeDasharray="14 12" fill="none" />
      <path d="M195 420Q540 196 885 350" stroke={Y} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={900} strokeDashoffset={900 * (1 - arc)} />
    </svg>
    <div style={{position: 'absolute', left: 50, top: 420, width: 290, height: 230, borderRadius: 26, background: '#0c1222', border: `2px solid ${LINE}`, padding: 24}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: sans, fontWeight: 700, fontSize: 30, color: '#c9d3ee'}}><Img src={A('claude-mark.svg')} style={{width: 34, height: 34}} />Swift code</div>
      {[190, 230, 150, 210].map((w, i) => <div key={i} style={{height: 14, width: w, borderRadius: 7, marginTop: 18, background: [KW, TY, PL, ST][i], opacity: 0.8}} />)}
    </div>
    <div style={{position: 'absolute', left: 420, top: 415, width: 240, height: 240, borderRadius: 56, background: 'linear-gradient(160deg,#3aa0ff,#1160d6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      filter: `grayscale(${cut}) brightness(${1 - 0.45 * cut})`, transform: `translateX(${shake}px)`}}><Img src={A('si-xcode.svg')} style={{width: 150, height: 150, filter: 'invert(1)'}} /></div>
    <div style={{position: 'absolute', left: 420, top: 664, width: 240, textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 34, color: '#c9d3ee', opacity: 1 - pr(t, 4.4, 0.1)}}>Xcode</div>
    <svg width={280} height={280} style={{position: 'absolute', left: 400, top: 395}}>
      <path d="M34 34L246 246" stroke={R} strokeWidth={26} strokeLinecap="round" strokeDasharray={310} strokeDashoffset={310 * (1 - pr(t, 4.08, 0.14))} />
      <path d="M246 34L34 246" stroke={R} strokeWidth={26} strokeLinecap="round" strokeDasharray={310} strokeDashoffset={310 * (1 - pr(t, 4.22, 0.14))} />
    </svg>
    <div style={{position: 'absolute', left: 340, top: 662, width: 400, textAlign: 'center', transform: `scale(${pop(t, 4.46)})`}}><Pill bg={R} color="#fff" size={36}>NOT NEEDED</Pill></div>
    <Phone x={784} y={350} w={200} land={pop(t, 5.12)} toast={pop(t, 5.2)} />
    {arc > 0 && arc < 1 && <div style={{position: 'absolute', left: pt[0] - 110, top: pt[1] - 32}}><Pill size={30} style={{fontFamily: mono}}>xtool dev</Pill></div>}
    <div style={{position: 'absolute', left: 50, top: 748, fontFamily: sans, fontWeight: 600, fontSize: 26, color: MUTED, opacity: pr(t, 4.7, 0.3)}}>SDK: one-time Xcode.xip download from Apple</div>
  </>;
};
const PriceScene: React.FC = () => {
  const t = useT(), land = 6.3, s = pop(t, 5.84, 0.4) * (t < land ? 1 : 1 + 0.12 * (1 - eo(pr(t, land, 0.35))));
  return <><PanelBg tone="#2a2350" />
    <div style={{position: 'absolute', left: 0, right: 0, top: 276, textAlign: 'center', fontFamily: sans, fontWeight: 800, fontSize: 38, letterSpacing: 8, color: MUTED}}>TOOL PRICE</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 312, textAlign: 'center', fontFamily: sans, fontWeight: 900, fontSize: 360, lineHeight: 1, color: '#fff', transform: `scale(${s})`}}>$<span style={{color: Y}}>0</span></div>
    <div style={{position: 'absolute', left: 300, top: 680, height: 14, borderRadius: 7, background: Y, width: 480 * eo(pr(t, land, 0.3))}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 716, display: 'flex', gap: 22, justifyContent: 'center'}}>
      <div style={{transform: `scale(${pop(t, 6.45)})`}}><Pill bg="#fff" size={34}>OPEN SOURCE</Pill></div>
      <div style={{transform: `scale(${pop(t, 6.6)})`}}><Pill size={34}>MIT LICENCE</Pill></div>
    </div>
  </>;
};
const HLX = 26, HLY = 470, HLW = 534;
const GithubScene: React.FC = () => {
  const t = useT(), vt = mapT(t, [[7.04, 2.93], [9.05, 2.93], [10.0, 4.06], [12.7, 6.7]]), hl = eo(pr(t, 7.9, 0.45)), box = pop(t, 10.05, 0.3);
  return <><Chrome /><Shot name="03_github_repo" vt={vt} />
    {t < 9.05 && <div style={{position: 'absolute', left: HLX, top: OFF + HLY, height: 50, width: HLW * hl, background: '#ffd60a55', borderRadius: 8, mixBlendMode: 'multiply'}} />}
    {box > 0 && <div style={{position: 'absolute', left: 14, top: OFF + 392, width: 352, height: 84, border: `7px solid ${R}`, borderRadius: 20, transform: `scale(${box})`, boxShadow: '0 0 0 2000px #0a0f1e26'}} />}
    <Source>github.com/xtool-org/xtool</Source>
  </>;
};
const ChatScene: React.FC = () => {
  const t = useT(), reply = 'Done. Created 3 Swift files:';
  return <><PanelBg tone="#3a2418" />
    <Win x={40} y={270} w={1000} h={514} title="Claude" icon={<Img src={A('claude-mark.svg')} style={{width: 26, height: 26}} />}>
      <div style={{position: 'absolute', right: 30, top: 22, maxWidth: 760, background: '#27324f', color: '#fff', fontFamily: sans, fontWeight: 600, fontSize: 40, lineHeight: 1.25, padding: '22px 30px', borderRadius: '28px 28px 6px 28px',
        transform: `scale(${pop(t, 12.72)})`, transformOrigin: '100% 100%'}}>Write a SwiftUI menu app for my café</div>
      <div style={{position: 'absolute', left: 30, top: 186, display: 'flex', gap: 16, opacity: pr(t, 13.25, 0.1)}}>
        <Img src={A('claude-mark.svg')} style={{width: 46, height: 46, marginTop: 4}} />
        <div><div style={{fontFamily: sans, fontWeight: 600, fontSize: 40, color: '#e6ecfb'}}>{reply.slice(0, Math.floor(pr(t, 13.3, 0.5) * reply.length))}</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18}}>{['CafeApp.swift', 'MenuView.swift', 'MenuItem.swift'].map((f, i) => <div key={f} style={{display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${pop(t, 13.86 + i * 0.2)})`, transformOrigin: '0 50%'}}>
            <div style={{width: 40, height: 40, borderRadius: 10, background: '#F05138', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Img src={A('si-swift.svg')} style={{width: 26, height: 26, filter: 'invert(1)'}} /></div>
            <span style={{fontFamily: mono, fontWeight: 500, fontSize: 34, color: '#e6ecfb'}}>{f}</span><Tick size={30} /></div>)}</div></div>
      </div>
    </Win>
  </>;
};
const PlugScene: React.FC = () => {
  const t = useT(), z = 1 + 0.05 * pr(t, 15.1, 2.2), fade = 'linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)';
  return <><Img src={A('install-scene.png')} style={{position: 'absolute', left: -200, top: -100, width: 1480, height: 1105, filter: 'blur(40px) brightness(.55)'}} />
    <Img src={A('install-scene.png')} style={{position: 'absolute', left: 42, top: 182, width: 996, height: 744, transform: `scale(${z})`, transformOrigin: '50% 70%', maskImage: fade, WebkitMaskImage: fade}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: 'linear-gradient(#0a0f1e,#0a0f1e 55%,transparent)'}} />
    <div style={{position: 'absolute', left: 70, top: 706, transform: `scale(${pop(t, 15.6)})`}}><Pill size={32}>USB CABLE</Pill></div>
  </>;
};
const TutorialScene: React.FC = () => {
  const t = useT(), vt = mapT(t, [[17.0, 0.45], [17.55, 1.22], [18.4, 2.72], [19.7, 3.85]]);
  return <><Chrome /><Shot name="06_xtool_dev_tutorial" vt={vt} />
    <div style={{position: 'absolute', right: 40, top: 276, transform: `scale(${pop(t, 17.42)})`, transformOrigin: '100% 50%'}}><Pill size={34}>1 COMMAND</Pill></div>
    <div style={{position: 'absolute', left: 40, top: 424, transform: `scale(${pop(t, 18.6)})`, transformOrigin: '0 50%'}}><Pill bg="#fff" size={30}>after a one-time setup</Pill></div>
    <Source>xtool.sh · tutorial</Source>
  </>;
};
const BuildScene: React.FC = () => {
  const t = useT(), rows: [string, number][] = [['Building', 19.9], ['Signing', 20.72], ['Installing', 21.2]];
  return <><PanelBg tone="#10304a" />
    <Win x={40} y={270} w={650} h={494} title="Terminal">
      <div style={{padding: '22px 28px', fontFamily: mono, fontSize: 38, color: '#e6ecfb'}}>
        <div><span style={{color: G}}>$ </span>xtool dev</div>
        {rows.map(([x, at]) => <div key={x} style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 22, opacity: 0.25 + 0.75 * pr(t, at - 0.05, 0.1)}}>
          <span style={{width: 300, color: t >= at ? '#fff' : MUTED, fontWeight: t >= at ? 700 : 500}}>{x}{t >= at ? '' : '...'}</span>
          <div style={{transform: `scale(${pop(t, at + 0.12)})`}}><Tick size={40} /></div></div>)}
        <div style={{marginTop: 34, height: 16, borderRadius: 8, background: '#1c2742', overflow: 'hidden'}}><div style={{height: '100%', width: `${100 * cl(mapT(t, [[19.7, 0.04], [19.9, 0.2], [20.72, 0.55], [21.2, 0.8], [21.8, 1]]))}%`, background: '#ff9a7a', borderRadius: 8}} /></div>
      </div>
    </Win>
    <Phone x={736} y={264} w={268} land={pop(t, 22.3)} toast={pop(t, 22.5)} />
  </>;
};
const PlatformScene: React.FC = () => {
  const t = useT(), x = mapT(t, [[24.45, 60], [25.6, 60], [26.3, -60], [27, -60]]);
  return <><Img src={A('linux-windows-scene.png')} style={{position: 'absolute', left: -22, top: 0, width: 1125, height: SEAM, transform: `scale(1.14) translateX(${x}px)`, transformOrigin: '50% 60%'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: 'linear-gradient(#0a0f1ecc,transparent)'}} />
    <div style={{position: 'absolute', left: 300 + x, top: 590, transform: `scale(${pop(t, 25.2)})`}}><Tick size={84} /></div>
    <div style={{position: 'absolute', left: 760 + x, top: 590, transform: `scale(${pop(t, 26.3)})`}}><Tick size={84} /></div>
  </>;
};
const WslScene: React.FC = () => {
  const t = useT(), z = 1 + 0.06 * pr(t, 26.5, 1.2), h = eo(pr(t, 26.86, 0.3));
  return <><div style={{position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: '65% 80%'}}>
    <Img src={A('wsl.png')} style={{position: 'absolute', left: 0, top: OFF, width: 1080, height: SEAM}} />
    <div style={{position: 'absolute', left: 500, top: OFF + 436, height: 52, width: 362 * h, background: '#ffd60a66', border: `4px solid ${Y}`, borderRadius: 10, opacity: h > 0 ? 1 : 0}} />
    </div><Chrome /><Source>xtool.sh · install guide</Source></>;
};
const MacScene: React.FC = () => {
  const t = useT(), st = pr(t, 28.5, 0.2), sc = st <= 0 ? 0 : 2.4 - 1.4 * eo(st), sh = st > 0 && pr(t, 28.7, 0.25) < 1 ? Math.sin(t * 110) * 5 : 0;
  return <><PanelBg tone="#3b1620" />
    <div style={{position: 'absolute', left: 240, top: 282, width: 600, transform: `translate(${sh}px,0)`, filter: `grayscale(${st}) brightness(${1 - 0.35 * st})`}}>
      <div style={{width: 520, height: 330, margin: '0 auto', borderRadius: 22, background: 'linear-gradient(160deg,#2b3350,#141a30)', border: '8px solid #c7cdd9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={A('si-apple.svg')} style={{width: 110, height: 110, filter: 'invert(1)'}} /></div>
      <div style={{width: 600, height: 28, borderRadius: '4px 4px 22px 22px', background: 'linear-gradient(#dfe3ea,#9aa1b0)'}} />
    </div>
    <div style={{position: 'absolute', left: 60, top: 290}}><Pill bg="#fff" size={36}>Mac</Pill></div>
    <div style={{position: 'absolute', left: 90, top: 548, width: 900, textAlign: 'center', transform: `scale(${sc}) rotate(-8deg)`}}>
      <div style={{display: 'inline-block', fontFamily: sans, fontWeight: 900, fontSize: 100, whiteSpace: 'nowrap', color: '#fff', background: R, padding: '10px 44px', borderRadius: 26, border: '8px solid #fff', letterSpacing: 2, boxShadow: '0 20px 50px #00000080'}}>NOT NEEDED</div></div>
  </>;
};
const CostScene: React.FC<{dollars: number}> = ({dollars}) => {
  const t = useT(), second = t >= 32.75;
  const card = (left: number, on: boolean): React.CSSProperties => ({position: 'absolute', left, top: 274, width: 475, height: 506, borderRadius: 30, background: CARD, border: `3px solid ${on ? Y : LINE}`, padding: '34px 30px', textAlign: 'center', opacity: on ? 1 : 0.45});
  return <><PanelBg tone="#17304a" />
    <div style={{...card(50, !second), transform: `scale(${pop(t, 29.7)})`}}>
      <div style={{fontFamily: sans, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: MUTED}}>TEST ON YOUR IPHONE</div>
      <div style={{fontFamily: sans, fontWeight: 900, fontSize: 230, lineHeight: 1.22, color: Y}}>$0</div>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 44, color: '#fff'}}>Free Apple ID</div>
    </div>
    <div style={{...card(555, second), transform: `scale(${pop(t, 32.78)})`}}>
      <div style={{fontFamily: sans, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: MUTED}}>PUBLISH ON APP STORE</div>
      <div style={{fontFamily: sans, fontWeight: 900, fontSize: 196, lineHeight: 1.43, color: '#fff', letterSpacing: -4}}>${dollars}</div>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 40, color: '#fff'}}>a year, paid to Apple</div>
    </div>
  </>;
};
const Heart: React.FC<{x: number; delay: number; t: number; color: string}> = ({x, delay, t, color}) => { const p = pr(t, 36.3 + delay, 1.6); if (p <= 0 || p >= 1) return null;
  return <svg width={54} height={54} viewBox="0 0 24 24" style={{position: 'absolute', left: x + Math.sin(p * 7 + delay * 9) * 22, top: 760 - p * 430, opacity: Math.min(1, 4 * p) * (1 - p), transform: `scale(${0.7 + p * 0.6})`}}><path fill={color} d="M12 21s-7.5-4.6-9.6-9.3C.9 8.200 2.800 4.500 6.400 4.500c2 0 3.400 1 4.300 2.300l1.300 1.800 1.300-1.800c.9-1.300 2.300-2.300 4.300-2.300 3.600 0 5.500 3.700 4 7.200C19.500 16.400 12 21 12 21z" /></svg>; };
const CtaScene: React.FC = () => {
  const t = useT(), typed = 'XTOOL'.slice(0, Math.floor(pr(t, 36.24, 0.5) * 5.99)), dm = eo(pr(t, 37.25, 0.35));
  return <><PanelBg tone="#2a2350" />
    <div style={{position: 'absolute', left: 50, top: 276, width: 980, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 16px', boxShadow: '0 20px 50px #00000066'}}>
      <Img src={A('avatar_thumb.jpg')} style={{width: 84, height: 84, borderRadius: 42, objectFit: 'cover'}} />
      <div style={{flex: 1, marginLeft: 22, fontFamily: sans, fontWeight: 800, fontSize: 50, color: typed ? '#111' : '#9aa3b5'}}>{typed || 'Add a comment...'}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: B, fontWeight: 500}}>|</span></div>
      <div style={{background: B, color: '#fff', fontFamily: sans, fontWeight: 800, fontSize: 34, padding: '16px 34px', borderRadius: 40, transform: `scale(${1 + 0.12 * (pop(t, 36.85) > 0 ? 1 - eo(pr(t, 36.85, 0.3)) : 0)})`}}>Post</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 424, textAlign: 'center', transform: `scale(${pop(t, 35.5)})`}}><Pill size={44}>FOLLOW + COMMENT XTOOL</Pill></div>
    {[[170, 0, R], [420, 0.25, '#ff7ab2'], [640, 0.1, R], [860, 0.4, '#ff7ab2'], [300, 0.6, R], [760, 0.75, R]].map(([x, d, c], i) => <Heart key={i} x={x as number} delay={d as number} t={t} color={c as string} />)}
    <div style={{position: 'absolute', left: 60, top: 548 + (1 - dm) * 340, width: 960, height: 236, borderRadius: 30, background: CARD, border: `2px solid ${LINE}`, padding: '22px 28px', boxShadow: '0 20px 50px #00000080'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}><Img src={A('avatar_thumb.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}} />
        <span style={{fontFamily: sans, fontWeight: 800, fontSize: 38, color: '#fff'}}>withhammad.ai</span><span style={{fontFamily: sans, fontWeight: 700, fontSize: 28, color: MUTED}}>· Direct message</span></div>
      <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 16, background: B, color: '#fff', fontFamily: sans, fontWeight: 700, fontSize: 44, padding: '22px 32px', borderRadius: '8px 30px 30px 30px'}}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.500 1.500" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.500-1.500" /></svg>Your xtool setup guide</div>
    </div>
  </>;
};

// ------------------------------------------------------------------ bottom zone (voice-only middle)
const ZoneBg: React.FC = () => <AbsoluteFill style={{background: `linear-gradient(${INK},#0d1430 60%,#0a0f1e)`}}><div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 6, background: Y}} />
  <div style={{position: 'absolute', left: 60, top: 742, fontFamily: mono, fontWeight: 700, fontSize: 150, color: '#ffffff0a', whiteSpace: 'nowrap', letterSpacing: -4}}>$ xtool dev</div></AbsoluteFill>;
const StarsZone: React.FC<{stars: number}> = ({stars}) => {
  const t = useT(), n = Math.round(stars * eo(pr(t, 9.95, 1.1)));
  return <><ZoneBg />
    <div style={{position: 'absolute', left: 76, top: 78, fontFamily: sans, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: MUTED, opacity: pr(t, 7.3, 0.2)}}>IT IS CALLED</div>
    <div style={{position: 'absolute', left: 70, top: 96, fontFamily: sans, fontWeight: 900, fontSize: 210, lineHeight: 1.1, color: '#fff', letterSpacing: -6, transform: `scale(${pop(t, 7.78)})`, transformOrigin: '0 60%'}}>xtool</div>
    <div style={{position: 'absolute', left: 76, top: 336, display: 'flex', gap: 18}}>
      <div style={{transform: `scale(${pop(t, 8.9)})`, transformOrigin: '0 50%'}}><Pill size={34}>OPEN SOURCE</Pill></div>
      <div style={{transform: `scale(${pop(t, 9.24)})`, transformOrigin: '0 50%'}}><Pill bg="#fff" size={34}>MIT</Pill></div>
    </div>
    <div style={{position: 'absolute', left: 76, top: 436, display: 'flex', alignItems: 'center', gap: 22, opacity: pr(t, 9.9, 0.15)}}>
      <svg width={120} height={120} viewBox="0 0 24 24"><path fill={Y} d="M12 2.200l2.950 6.300 6.850.850-5.050 4.700 1.350 6.800L12 17.450 5.900 20.850l1.350-6.800L2.200 9.350l6.850-.850z" /></svg>
      <div style={{fontFamily: sans, fontWeight: 900, fontSize: 168, lineHeight: 1, color: Y, fontVariantNumeric: 'tabular-nums', letterSpacing: -4}}>{n.toLocaleString('en-US')}</div>
    </div>
    <div style={{position: 'absolute', left: 80, top: 612, display: 'flex', alignItems: 'center', gap: 14, fontFamily: sans, fontWeight: 700, fontSize: 36, color: '#dfe6f5', opacity: pr(t, 11.05, 0.2)}}><Img src={A('si-github.svg')} style={{width: 40, height: 40, filter: 'invert(1)'}} />stars on GitHub <span style={{color: MUTED, fontWeight: 600}}>· 12 Nov 2026</span></div>
  </>;
};
const CodeZone: React.FC = () => {
  const t = useT();
  return <><ZoneBg />
    <Win x={60} y={70} w={880} h={590} title="MenuView.swift" icon={<div style={{width: 30, height: 30, borderRadius: 8, background: '#F05138', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Img src={A('si-swift.svg')} style={{width: 20, height: 20, filter: 'invert(1)'}} /></div>}>
      <div style={{padding: '22px 30px'}}><Code p={pr(t, 12.9, 1.9)} size={36} /></div>
    </Win>
  </>;
};
const StepsZone: React.FC = () => {
  const t = useT(), act = t < 17.15 ? 0 : t < 19.75 ? 1 : 2;
  const Row: React.FC<React.PropsWithChildren<{i: number; at: number}>> = ({i, at, children}) => { const on = act === i, done = act > i;
    return <div style={{position: 'absolute', left: 60, top: 68 + i * 196, width: 880, height: 176, borderRadius: 30, background: on ? '#18233f' : 'transparent', border: `3px solid ${on ? Y : LINE}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 28,
      opacity: (on || done ? 1 : 0.5) * pr(t, at, 0.2), transform: `scale(${on ? 1 : 0.97})`}}>
      <div style={{width: 92, height: 92, borderRadius: 46, flexShrink: 0, background: done ? G : on ? Y : 'transparent', border: done || on ? 'none' : `3px solid ${LINE}`, color: done || on ? '#111' : MUTED, fontFamily: sans, fontWeight: 900, fontSize: 52, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{done ? '✓' : i + 1}</div>
      <div style={{fontFamily: sans, color: '#fff'}}>{children}</div></div>; };
  const big: React.CSSProperties = {fontWeight: 800, fontSize: 58, lineHeight: 1.1}, sub: React.CSSProperties = {fontWeight: 600, fontSize: 34, color: MUTED, marginTop: 8};
  return <><ZoneBg />
    <Row i={0} at={15.15}><div style={big}>Plug in your iPhone</div><div style={sub}>USB cable, any computer</div></Row>
    <Row i={1} at={15.3}><div style={big}>Run one command</div><div style={{...sub, fontFamily: mono, color: Y, fontSize: 36}}><span style={{color: G}}>$ </span>{'xtool dev'.slice(0, Math.floor(pr(t, 18.45, 0.45) * 9))}</div></Row>
    <Row i={2} at={15.45}><div style={{...big, display: 'flex', gap: 20}}>{([['Builds', 19.9], ['Signs', 20.72], ['Installs', 21.2]] as [string, number][]).map(([x, at]) => <span key={x} style={{color: t >= at ? Y : '#6b7694', transform: `scale(${t >= at ? 1 + 0.18 * (1 - eo(pr(t, at, 0.3))) : 1})`, display: 'inline-block'}}>{x}</span>)}</div>
      <div style={{...sub, color: t >= 22.06 ? '#fff' : MUTED}}>on your home screen</div></Row>
  </>;
};
const PlatformZone: React.FC = () => {
  const t = useT();
  const Card: React.FC<{top: number; at: number; title: string; cmd: string; icon: React.ReactNode}> = ({top, at, title, cmd, icon}) => { const on = t >= at;
    return <div style={{position: 'absolute', left: 60, top, width: 880, height: 262, borderRadius: 34, background: on ? '#18233f' : CARD, border: `3px solid ${on ? Y : LINE}`, display: 'flex', alignItems: 'center', gap: 34, padding: '0 36px',
      opacity: on ? 1 : 0.5, transform: `scale(${on ? 1 + 0.05 * (1 - eo(pr(t, at, 0.35))) : 0.97})`}}>
      <div style={{width: 168, height: 168, borderRadius: 36, background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
      <div><div style={{fontFamily: sans, fontWeight: 900, fontSize: 68, color: '#fff', lineHeight: 1.05}}>{title}</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 16}}><span style={{fontFamily: mono, fontWeight: 500, fontSize: 34, color: Y, background: '#0a0f1e', padding: '8px 18px', borderRadius: 12}}>{cmd}</span>
          <div style={{transform: `scale(${pop(t, at + 0.15)})`}}><Tick size={48} /></div></div></div></div>; };
  return <><ZoneBg />
    <Card top={72} at={25.16} title="Linux" cmd="$ xtool dev" icon={<Img src={A('si-linux.svg')} style={{width: 118, height: 118}} />} />
    <Card top={364} at={26.22} title="Windows (WSL)" cmd="wsl$ xtool dev" icon={<WinLogo size={104} />} />
  </>;
};
const NoMacZone: React.FC = () => {
  const t = useT();
  return <><ZoneBg />
    <div style={{position: 'absolute', left: 76, top: 96, fontFamily: sans, fontWeight: 800, fontSize: 56, color: MUTED, opacity: pr(t, 27.6, 0.2)}}>You don't need</div>
    <div style={{position: 'absolute', left: 70, top: 150, fontFamily: sans, fontWeight: 900, fontSize: 250, lineHeight: 1.1, color: '#fff', letterSpacing: -6, transform: `scale(${pop(t, 28.62)})`, transformOrigin: '0 60%'}}>a Mac
      <div style={{position: 'absolute', left: 4, top: 268, height: 20, borderRadius: 10, background: Y, width: 720 * eo(pr(t, 28.85, 0.25))}} /></div>
    <div style={{position: 'absolute', left: 80, top: 500, fontFamily: sans, fontWeight: 700, fontSize: 44, color: '#dfe6f5', opacity: pr(t, 29.0, 0.2)}}>Linux or Windows is enough</div>
  </>;
};
const LimitsZone: React.FC = () => {
  const t = useT(), rows: [string, number, string][] = [['Test on your own iPhone', 29.82, G], ['Installs last 7 days', 30.7, Y], ['3 apps per device', 31.5, Y], ['App Store: $99 a year', 32.9, R]];
  return <><ZoneBg />{rows.map(([x, at, c], i) => <div key={x} style={{position: 'absolute', left: 60, top: 70 + i * 148, width: 880, height: 126, borderRadius: 28, background: CARD, border: `3px solid ${t >= at ? c : LINE}`, display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px',
    transform: `scale(${pop(t, at)})`, transformOrigin: '0 50%'}}>
    <div style={{width: 26, height: 70, borderRadius: 13, background: c}} /><span style={{fontFamily: sans, fontWeight: 800, fontSize: 52, color: '#fff'}}>{x}</span></div>)}</>;
};
const WildPart: React.FC = () => {
  const t = useT(), s = 23.3, e = 24.46; if (t < s || t >= e) return null;
  const p = eo(pr(t, s + 0.02, 0.2)), out = pr(t, e - 0.14, 0.14);
  return <AbsoluteFill style={{zIndex: 50, background: `radial-gradient(circle at 50% 46%,#3b2a05,${INK} 62%)`, opacity: 1 - out}}>
    {Array.from({length: 18}, (_, i) => <div key={i} style={{position: 'absolute', left: 540, top: 880, width: 6, height: 1500, marginLeft: -3, background: `linear-gradient(transparent 22%,${Y}55 60%,transparent)`, transformOrigin: '50% 0', transform: `rotate(${i * 20 + t * 40}deg)`}} />)}
    <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: sans, fontWeight: 900, color: '#fff', transform: `scale(${(2.2 - 1.2 * p) * (1 + 0.5 * out)}) rotate(-4deg)`, opacity: Math.min(1, p * 2), filter: `blur(${(1 - p) * 14}px)`}}>
      <div style={{fontSize: 84, letterSpacing: 10}}>THE</div>
      <div style={{fontSize: 268, lineHeight: 0.95, color: Y, letterSpacing: -6}}>WILD</div>
      <div style={{fontSize: 268, lineHeight: 0.95, letterSpacing: -6}}>PART</div>
    </div>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------ hook banners and captions
const Banners: React.FC = () => {
  const t = useT(); if (t >= 2.5) return null;
  const out = eo(pr(t, 2.3, 0.2)), s = 1 + 0.07 * (1 - eo(pr(t, 0, 0.25)));
  return <div style={{position: 'absolute', left: 0, right: 0, top: 764, zIndex: 40, textAlign: 'center', transform: `scale(${s})`}}>
    <div style={{transform: `translateX(${out * 1200}px)`}}><div style={{display: 'inline-block', background: R, color: '#fff', fontFamily: sans, fontWeight: 900, fontSize: 60, letterSpacing: 0.5, padding: '14px 34px', borderRadius: 16, boxShadow: '0 12px 30px #00000066'}}>BUILD IPHONE APPS, NO MAC</div></div>
    <div style={{transform: `translateX(${-out * 1200}px)`, marginTop: -4}}><div style={{display: 'inline-block', background: Y, color: '#111', fontFamily: sans, fontWeight: 800, fontSize: 44, padding: '10px 30px', borderRadius: 14, boxShadow: '0 12px 30px #00000066'}}>Free, open-source tool</div></div>
  </div>;
};
// [first word, last word, text]; *...* marks the yellow keywords. Chunks follow the recorded word indices.
const CHUNKS: [number, number, string][] = [
  [6, 8, 'YOU CAN NOW'], [9, 11, 'BUILD *IPHONE APPS*'], [12, 13, '*WITHOUT* XCODE'], [14, 16, 'AND THE TOOL'], [17, 18, 'COSTS *NOTHING*'],
  [19, 21, "IT'S CALLED *XTOOL*"], [22, 23, '*OPEN SOURCE*'], [24, 26, 'WITH *15,000*'], [27, 29, 'STARS ON *GITHUB*'],
  [30, 32, 'HAVE *CLAUDE* WRITE'], [33, 35, 'THE *SWIFT CODE*'], [36, 38, 'FOR *YOUR APP*'],
  [39, 41, 'PLUG YOUR *IPHONE*'], [42, 44, 'INTO YOUR COMPUTER'], [45, 47, 'RUN *ONE COMMAND*'], [48, 49, '*XTOOL DEV*'],
  [50, 52, 'AND IT *BUILDS*'], [53, 53, '*SIGNS*'], [54, 55, 'AND *INSTALLS*'], [56, 57, 'THE APP'], [58, 61, 'ON YOUR *HOME SCREEN*'],
  [65, 68, 'IT RUNS ON *LINUX*'], [69, 71, 'AND ON *WINDOWS*'], [72, 73, 'THROUGH *WSL*'], [74, 77, "SO YOU DON'T NEED"], [78, 79, 'A *MAC*'],
  [80, 83, 'A *FREE* APPLE ID'], [84, 85, 'COVERS *TESTING*'], [86, 89, 'ON YOUR *OWN PHONE*'], [90, 92, 'THE *APP STORE*'], [93, 94, 'STILL NEEDS'], [95, 97, "APPLE'S *PAID PROGRAM*"],
  [98, 100, '*FOLLOW* ME AND'], [101, 102, 'COMMENT *XTOOL*'], [103, 106, 'FOR THE *SETUP GUIDE*'],
];
const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const t = useT();
  const times = CHUNKS.map(([a, b]) => [words[a].startMs / 1000 - 0.04, words[b].endMs / 1000 + 0.3]);
  const i = times.findIndex(([s, e], k) => t >= s && t < Math.min(e, k + 1 < times.length ? times[k + 1][0] : 1e9));
  if (i < 0) return null;
  const parts = CHUNKS[i][2].split('*'), s = 1 + 0.06 * (1 - eo(pr(t, times[i][0], 0.1)));
  return <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 44, zIndex: 45, textAlign: 'center'}}>
    <div style={{display: 'inline-block', background: '#141313', borderRadius: 14, padding: '0 26px', height: 88, lineHeight: '88px', fontFamily: 'Doto', fontWeight: 900, fontSize: 62, letterSpacing: 1, color: '#fff', whiteSpace: 'nowrap',
      boxShadow: '0 8px 24px #00000080', transform: `scale(${s})`}}>{parts.map((x, k) => <span key={k} style={{color: k % 2 ? Y : undefined}}>{x}</span>)}</div>
  </div>;
};

export const Xtool: React.FC<XtoolProps> = ({words, stars}) => {
  const t = useT();
  return <AbsoluteFill style={{background: INK, fontFamily: sans, overflow: 'hidden'}}>
    <Top s={0} e={2.42} dir="none" z={1}><HookScene /></Top>
    <Top s={2.42} e={5.3} dir="r" z={2}><XcodeScene /></Top>
    <Top s={5.3} e={7.04} dir="u" z={3}><PriceScene /></Top>
    <Top s={7.04} e={12.62} dir="l" z={4}><GithubScene /></Top>
    <Top s={12.62} e={15.1} dir="r" z={5}><ChatScene /></Top>
    <Top s={15.1} e={17.0} dir="u" z={6}><PlugScene /></Top>
    <Top s={17.0} e={19.62} dir="l" z={7}><TutorialScene /></Top>
    <Top s={19.62} e={24.45} dir="r" z={8}><BuildScene /></Top>
    <Top s={24.45} e={26.55} dir="none" z={9}><PlatformScene /></Top>
    <Top s={26.55} e={27.6} dir="l" z={10}><WslScene /></Top>
    <Top s={27.6} e={29.6} dir="r" z={11}><MacScene /></Top>
    <Top s={29.6} e={35.2} dir="u" z={12}><CostScene dollars={t < 32.78 ? 0 : Math.round(99 * eo(pr(t, 32.9, 0.9)))} /></Top>
    <Top s={35.2} e={99} dir="l" z={13}><CtaScene /></Top>

    <Bot s={0} e={7.02} dir="none" z={1}><Avatar /></Bot>
    <Bot s={7.02} e={12.62} dir="d" z={2}><StarsZone stars={stars} /></Bot>
    <Bot s={12.62} e={15.1} dir="r" z={3}><CodeZone /></Bot>
    <Bot s={15.1} e={24.45} dir="l" z={4}><StepsZone /></Bot>
    <Bot s={24.45} e={27.6} dir="none" z={5}><PlatformZone /></Bot>
    <Bot s={27.6} e={29.6} dir="r" z={6}><NoMacZone /></Bot>
    <Bot s={29.6} e={34.95} dir="l" z={7}><LimitsZone /></Bot>
    <Bot s={34.95} e={99} dir="d" z={8}><Avatar /></Bot>

    <div style={{position: 'absolute', left: 0, right: 0, top: SEAM - 3, height: 6, background: '#05070f', zIndex: 30}} />
    <div style={{position: 'absolute', left: 60, top: 220, zIndex: 46, background: '#0a0f1ed0', color: '#e6ecfb', fontWeight: 800, fontSize: 20, letterSpacing: 4, padding: '7px 14px', borderRadius: 9}}>WITHHAMMAD</div>
    <WildPart />
    <Banners />
    <Captions words={words} />
  </AbsoluteFill>;
};
