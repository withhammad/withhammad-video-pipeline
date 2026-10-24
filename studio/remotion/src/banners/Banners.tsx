import React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

// Channel banners in the WITHHAMMAD reel-cover system (SkillSpector cover: teal glow on near-black, faint binary
// rain, real product marks on tilted tiles, the cut-out face, a 2-line hook in heavy white caps with line 2 in a
// red box). One component per platform canvas; every text block sits inside that platform's safe zone.
loadFont({family: 'BnInter', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'BnInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'BnInter', url: staticFile('fonts/inter-latin-900-normal.woff2'), weight: '900'});
loadFont({family: 'BnDoto', url: staticFile('fonts/doto-latin-500-normal.woff2'), weight: '500'});

const f = (s: string) => staticFile('banners/' + s);
const SANS = 'BnInter, Arial, sans-serif';
const C = {ink: '#090A0A', glow: '#0E3B44', glowMid: '#0A1F24', mint: '#5FE1D6', teal: '#2DD4BF', red: '#FF3231', dim: 'rgba(255,255,255,.78)'};

type Rect = {x: number; y: number; w: number; h: number};

// ---- background: glow + binary rain + light bars, sized to any canvas ----
const Backdrop: React.FC<{w: number; h: number; glowX?: number; glowY?: number; bars: [number, number, number, number][]}> = ({w, h, glowX = 50, glowY = 50, bars}) => {
  const rows = Math.ceil(h / 40), cols = Math.ceil(w / 40);
  return <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 55% 60% at ${glowX}% ${glowY}%, ${C.glow} 0%, ${C.glowMid} 45%, ${C.ink} 82%)`}}/>
    <AbsoluteFill style={{fontFamily: 'BnDoto, Menlo, monospace', fontSize: 34, lineHeight: '40px', color: C.mint, opacity: 0.07, whiteSpace: 'pre', padding: 20}}>
      {Array.from({length: rows}, (_, i) => <div key={i}>{Array.from({length: cols}, (_, j) => (random(`bn${i}-${j}`) > 0.5 ? '1' : '0')).join(' ')}</div>)}
    </AbsoluteFill>
    {bars.map(([x, y, bw, bh], i) => <div key={i} style={{position: 'absolute', left: x, top: y, width: bw, height: bh, background: C.teal, opacity: 0.12}}/>)}
  </AbsoluteFill>;
};

// ---- real product marks on app-icon tiles ----
type Mark = 'claude' | 'openai' | 'ollama' | 'hf' | 'github' | 'n8n';
const TILE: Record<Mark, {bg: string; src: string; pad: number}> = {
  claude: {bg: '', src: 'claude-tile.png', pad: 0},
  openai: {bg: 'linear-gradient(160deg, #1B1B1B, #000)', src: 'openai-white.svg', pad: 0.2},
  ollama: {bg: 'linear-gradient(160deg, #FFFFFF, #E9ECEF)', src: 'ollama.svg', pad: 0.2},
  hf: {bg: 'linear-gradient(160deg, #FFD21E, #FFB000)', src: 'huggingface.svg', pad: 0.18},
  github: {bg: 'linear-gradient(160deg, #2B3137, #0D1117)', src: 'github-white.svg', pad: 0.2},
  n8n: {bg: 'linear-gradient(160deg, #FF6D8A, #EA4B71)', src: 'n8n-white.svg', pad: 0.2},
};
const Tile: React.FC<{mark: Mark; x: number; y: number; size: number; rot: number}> = ({mark, x, y, size, rot}) => {
  const t = TILE[mark];
  return <div style={{position: 'absolute', left: x, top: y, width: size, height: size, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 18px 36px rgba(0,0,0,.6))'}}>
    {t.bg ? <div style={{width: size, height: size, borderRadius: size * 0.24, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img src={f(t.src)} style={{width: size * (1 - 2 * t.pad), height: size * (1 - 2 * t.pad)}}/></div>
      : <Img src={f(t.src)} style={{width: size, height: size}}/>}
  </div>;
};

// ---- the cut-out face: cover_cut3 (1080x1920 RGBA, warm smile). Head top sits at ~248 px of the source. ----
const Face: React.FC<{x: number; headTop: number; scale: number; fadeAt?: number}> = ({x, headTop, scale, fadeAt}) => {
  const top = headTop - 230 * scale;
  return <div style={{position: 'absolute', left: x - 540 * scale, top, width: 1080 * scale, height: 1920 * scale,
    // The matte runs to the frame's left, right and bottom edges at chest height: dissolve the torso so no straight edge shows.
    WebkitMaskImage: `radial-gradient(ellipse 46% ${fadeAt ?? 34}% at 50% 28%, #000 62%, transparent 100%)`}}>
    <Img src={f('cover_cut3.png')} style={{width: 1080 * scale, height: 1920 * scale}}/></div>;
};

// ---- the hook: line 1 plain white caps, line 2 in the red box ----
const Hook: React.FC<{x: number; y: number; l1: string; l2: string; size: number; align?: 'left' | 'center'}> = ({x, y, l1, l2, size, align = 'left'}) =>
  <div style={{position: 'absolute', left: x, top: y, display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'center', fontFamily: SANS, fontWeight: 900, letterSpacing: -size * 0.02, color: '#fff', lineHeight: 1}}>
    <div style={{fontSize: size, textShadow: '0 6px 20px rgba(0,0,0,.7)', whiteSpace: 'nowrap'}}>{l1}</div>
    <div style={{marginTop: size * 0.14, background: C.red, borderRadius: size * 0.14, padding: `${size * 0.06}px ${size * 0.26}px ${size * 0.08}px`, fontSize: size, whiteSpace: 'nowrap', marginLeft: align === 'left' ? -size * 0.04 : 0}}>{l2}</div>
  </div>;

const Kicker: React.FC<{x: number; y: number; text: string; size: number}> = ({x, y, text, size}) =>
  <div style={{position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 800, fontSize: size, letterSpacing: size * 0.18, color: C.mint, whiteSpace: 'nowrap'}}>{text}</div>;

const Sub: React.FC<{x: number; y: number; size: number; children: React.ReactNode}> = ({x, y, size, children}) =>
  <div style={{position: 'absolute', left: x, top: y, fontFamily: SANS, fontWeight: 600, fontSize: size, color: C.dim, whiteSpace: 'nowrap'}}>{children}</div>;

const Url: React.FC = () => <span style={{color: '#fff', fontWeight: 800}}>withhammad.com/resources</span>;

const Guide: React.FC<{r: Rect; color: string; label: string}> = ({r, color, label}) =>
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, border: `4px dashed ${color}`, boxSizing: 'border-box'}}>
    <div style={{position: 'absolute', left: 8, top: 4, fontFamily: SANS, fontWeight: 800, fontSize: 26, color}}>{label}</div></div>;

// ================= YouTube 2560x1440 =================
// Safe area for text and logos on every device: the centred 1546x423 (YouTube: 1235x338 at the 2048x1152 minimum).
// Desktop shows the full width at the safe height (y 508-931); TV shows everything; phones show the safe area only.
export const YT_SAFE: Rect = {x: 507, y: 508, w: 1546, h: 423};
export const YT_DESKTOP: Rect = {x: 0, y: 508, w: 2560, h: 423};
export const YouTubeBanner: React.FC<{guides?: boolean}> = ({guides}) => {
  const S = YT_SAFE;
  return <AbsoluteFill>
    <Backdrop w={2560} h={1440} glowX={42} glowY={50} bars={[[260, 470, 900, 12], [1500, 960, 700, 8], [80, 1010, 620, 10]]}/>
    {/* desktop/TV wings (outside the phone crop): big tilted marks, the cover's tile look */}
    <Tile mark="openai" x={150} y={560} size={250} rot={-12}/>
    <Tile mark="ollama" x={2140} y={545} size={250} rot={10}/>
    {/* TV-only extras */}
    <Tile mark="github" x={150} y={1060} size={200} rot={8}/>
    <Tile mark="n8n" x={1980} y={160} size={200} rot={-8}/>
    <Tile mark="hf" x={430} y={190} size={200} rot={-6}/>
    {/* inside the safe area: face, kicker, hook, line, marks */}
    <Face x={S.x + 225} headTop={S.y + 18} scale={0.43}/>
    <Kicker x={S.x + 470} y={S.y + 28} size={34} text="CLAUDE CODE · AI AGENTS · LOCAL LLMS"/>
    <Hook x={S.x + 470} y={S.y + 84} l1="A NEW AI BUILD" l2="EVERY DAY" size={104}/>
    <Sub x={S.x + 470} y={S.y + 352} size={36}>Tested by hand · free guide: <Url/></Sub>
    <Tile mark="claude" x={S.x + 1340} y={S.y + 120} size={170} rot={10}/>
    {guides ? <><Guide r={YT_DESKTOP} color="#FFD400" label="desktop 2560x423"/><Guide r={S} color="#FF3231" label="all devices 1546x423"/></> : null}
  </AbsoluteFill>;
};

// ================= X header 1500x500 =================
// The profile photo covers about x 15-150 / y 380-530 on desktop and a larger share bottom-left on phones; phones also
// trim top and bottom (~60 px each). Text lives in x 470-1200, y 70-430; the face sits right.
export const X_SAFE: Rect = {x: 470, y: 70, w: 960, h: 360};
export const X_AVATAR: Rect = {x: 0, y: 330, w: 330, h: 170};
export const XHeader: React.FC<{guides?: boolean}> = ({guides}) => <AbsoluteFill>
  <Backdrop w={1500} h={500} glowX={70} glowY={50} bars={[[60, 120, 380, 8], [860, 450, 520, 10]]}/>
  <Tile mark="claude" x={110} y={70} size={170} rot={-12}/>
  <Tile mark="openai" x={300} y={190} size={120} rot={9}/>
  <Tile mark="ollama" x={1362} y={318} size={104} rot={10}/>
  <Face x={1230} headTop={92} scale={0.36} fadeAt={40}/>
  <Kicker x={470} y={98} size={22} text="CLAUDE CODE · AI AGENTS · LOCAL LLMS"/>
  <Hook x={470} y={140} l1="A NEW AI BUILD" l2="EVERY DAY" size={76}/>
  <Sub x={470} y={352} size={26}>Free guide for each one: <Url/></Sub>
  {guides ? <><Guide r={X_SAFE} color="#FF3231" label="text zone"/><Guide r={X_AVATAR} color="#FFD400" label="avatar"/></> : null}
</AbsoluteFill>;

// ================= LinkedIn 1584x396 =================
// Desktop puts the round profile photo over the lower-left (about x 20-260, y 200-396 at this size); the mobile app
// crops the sides slightly and centres the avatar lower-left too. Text in x 560-1420; the face on the right.
export const LI_SAFE: Rect = {x: 470, y: 40, w: 1060, h: 316};
export const LI_AVATAR: Rect = {x: 0, y: 190, w: 300, h: 206};
export const LinkedInBanner: React.FC<{guides?: boolean}> = ({guides}) => <AbsoluteFill>
  <Backdrop w={1584} h={396} glowX={72} glowY={50} bars={[[40, 60, 360, 8], [880, 360, 540, 8]]}/>
  <Tile mark="claude" x={110} y={36} size={150} rot={-12}/>
  <Tile mark="openai" x={310} y={70} size={104} rot={9}/>
  <Face x={1340} headTop={56} scale={0.31}/>
  <Kicker x={480} y={64} size={20} text="AI AGENTS · RAG · MCP · CLAUDE CODE"/>
  <Hook x={480} y={100} l1="AI AGENTS THAT" l2="ACTUALLY SHIP" size={66}/>
  <Sub x={480} y={292} size={23}>Builds, tests and free guides: <Url/></Sub>
  {guides ? <><Guide r={LI_SAFE} color="#FF3231" label="text zone"/><Guide r={LI_AVATAR} color="#FFD400" label="avatar"/></> : null}
</AbsoluteFill>;
