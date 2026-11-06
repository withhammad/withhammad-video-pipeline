import React, {useLayoutEffect, useRef} from 'react';
import {CW, CH, FLOOR, OFFICE, Prim, EnvPrim, rig, rectP, circP, ellP, polyP} from './scene';

// The ten looks. Each is a pure function of time t (seconds since the style came on), so a Remotion render is
// deterministic. Style names follow the reference's list (corrected spelling: "Hologram", "Anime Cel").
export const STYLE_NAMES = ['Hologram', 'Cyberpunk Neon', 'Paper Cutout', 'Isometric', 'Blueprint', 'Thermal Cam', 'Anime Cel',
  'ASCII Terminal', 'Watercolor', 'Claymation'];

type Pal = Partial<Record<string, string>>;
const byDepth = (p: Prim[], d: number) => p.filter(x => x.depth === d);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Draw env + figure with fill colours from `pal`, optional stroke. Figure parts drawn back-to-front.
const Draw: React.FC<{env?: EnvPrim[]; fig: Prim[]; pal: Pal; stroke?: string; sw?: number; fillOp?: number; envFilter?: string; figFilter?: string; noEnv?: string[]}> =
  ({env = OFFICE, fig, pal, stroke, sw = 2, fillOp = 1, envFilter, figFilter, noEnv = []}) => <>
    <g filter={envFilter}>{env.filter(e => !noEnv.includes(e.part)).map((e, i) => e.part === 'hand'
      ? <path key={i} d={e.d} stroke={pal.hand || stroke || '#333'} strokeWidth={4} strokeLinecap="round" fill="none"/>
      : <path key={i} d={e.d} fill={pal[e.part] || 'none'} fillOpacity={fillOp} stroke={stroke} strokeWidth={sw}/>)}</g>
    <g filter={figFilter}>{[0, 1, 2].map(d => byDepth(fig, d).map((p, i) =>
      <path key={d + '-' + i} d={p.d} fill={pal[p.part] || 'none'} fillOpacity={fillOp} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>))}</g>
  </>;

const Svg: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) =>
  <svg viewBox={`0 0 ${CW} ${CH}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{display: 'block', background: bg}}>{children}</svg>;

const Mono: React.FC<{x: number; y: number; size?: number; fill: string; anchor?: 'start' | 'end' | 'middle'; children: React.ReactNode; op?: number}> =
  ({x, y, size = 13, fill, anchor = 'start', children, op = 1}) =>
    <text x={x} y={y} fontFamily="ASMono, Menlo, monospace" fontSize={size} fill={fill} textAnchor={anchor} opacity={op} letterSpacing={1}>{children}</text>;

// 1 ---------------------------------------------------------------- Hologram
const Hologram: React.FC<{t: number; id: string}> = ({t, id}) => {
  const fig = rig(t), C = '#5FF3FF', flick = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 13);
  return <Svg bg="#02070D">
    <defs>
      <filter id={`hg${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <pattern id={`hs${id}`} width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="rgba(95,243,255,.10)"/></pattern>
      <radialGradient id={`hr${id}`}><stop offset="0" stopColor="#5FF3FF" stopOpacity=".55"/><stop offset="1" stopColor="#5FF3FF" stopOpacity="0"/></radialGradient>
    </defs>
    {Array.from({length: 13}, (_, i) => <line key={i} x1={CW / 2} y1={FLOOR - 40} x2={-400 + i * 112} y2={CH} stroke="rgba(95,243,255,.22)" strokeWidth={1}/>)}
    {Array.from({length: 6}, (_, i) => { const y = FLOOR + Math.pow(i / 5, 1.6) * (CH - FLOOR); return <line key={'h' + i} x1={0} y1={y} x2={CW} y2={y} stroke="rgba(95,243,255,.2)"/>; })}
    <g opacity={0.45}><Draw fig={[]} pal={{}} stroke={C} sw={1.4} noEnv={['floor', 'pot', 'leaf']}/></g>
    <ellipse cx={fig.length ? 150 + 150 * Math.min(1, t / 1.6) + 10 : 0} cy={FLOOR + 6} rx={92} ry={20} fill={`url(#hr${id})`}/>
    <ellipse cx={160 + 150 * Math.min(1, t / 1.6)} cy={FLOOR + 6} rx={92} ry={20} fill="none" stroke={C} strokeWidth={2} opacity={0.8}/>
    <g opacity={flick} filter={`url(#hg${id})`}><Draw env={[]} fig={fig} pal={{skin: C, hair: C, shirt: C, pants: C, shoe: C, box: C, tie: C}} fillOp={0.14} stroke={C} sw={2.2}/></g>
    <rect width={CW} height={CH} fill={`url(#hs${id})`}/>
    <rect y={((t * 260) % (CH + 120)) - 120} width={CW} height={70} fill="rgba(95,243,255,.07)"/>
    <Mono x={24} y={40} fill={C}>SUBJECT_07 // WALK_CYCLE</Mono>
    <Mono x={24} y={60} fill={C} op={0.7}>{`TRACK ${(t * 1.2).toFixed(2)}m  CONF 0.98`}</Mono>
  </Svg>;
};

// 2 ---------------------------------------------------------------- Cyberpunk Neon
const Cyber: React.FC<{t: number; id: string}> = ({t, id}) => {
  const fig = rig(t), M = '#FF2BD6', Cy = '#22F0FF';
  const scene = (refl = false) => <>
    <g filter={`url(#cn${id})`}>
      <path d={rectP(290, 200, 210, 150, 8)} fill="none" stroke={M} strokeWidth={4}/>
      {[[318, 60], [366, 92], [414, 72], [462, 118]].map(([x, h], i) => <path key={i} d={rectP(x, 330 - h, 26, h)} fill="none" stroke={M} strokeWidth={3}/>)}
      <path d={rectP(36, 150, 210, 250, 6)} fill="none" stroke={Cy} strokeWidth={3}/>
      <path d={rectP(372, 532, 124, 80, 6)} fill="#170326" stroke={Cy} strokeWidth={3}/>
      <path d={rectP(340, 634, 190, 18, 4)} fill="#170326" stroke={M} strokeWidth={3}/>
      {!refl && <text x={142} y={128} fill={M} fontFamily="ASSans, Arial" fontWeight={900} fontSize={34} textAnchor="middle" opacity={Math.sin(t * 9) > -0.8 ? 1 : 0.25}>OPEN 24/7</text>}
    </g>
    <g filter={`url(#cr${id})`}><Draw env={[]} fig={fig} pal={{skin: '#2A1240', hair: '#12051F', shirt: '#24103A', pants: '#160A28', shoe: '#0A0414', box: '#2A1240', tie: M}} stroke={refl ? M : Cy} sw={2.4}/></g>
  </>;
  return <Svg bg="linear-gradient(#000,#000)">
    <defs>
      <linearGradient id={`cb${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0A0018"/><stop offset="1" stopColor="#2A0640"/></linearGradient>
      <filter id={`cn${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id={`cr${id}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id={`cf${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".45"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
      <mask id={`cm${id}`}><rect y={FLOOR} width={CW} height={CH - FLOOR} fill={`url(#cf${id})`}/></mask>
    </defs>
    <rect width={CW} height={CH} fill={`url(#cb${id})`}/>
    <rect y={FLOOR} width={CW} height={CH - FLOOR} fill="#07000F"/>
    {scene()}
    <g mask={`url(#cm${id})`}><g transform={`translate(0 ${2 * FLOOR}) scale(1 -1)`}>{scene(true)}</g></g>
    <line x1={0} y1={FLOOR} x2={CW} y2={FLOOR} stroke={Cy} strokeWidth={3} filter={`url(#cn${id})`}/>
  </Svg>;
};

// 3 ---------------------------------------------------------------- Paper Cutout (stepped at 10 fps, jitter per step)
const Paper: React.FC<{t: number; id: string}> = ({t, id}) => {
  const step = Math.floor(t * 10), ts = step / 10, j = (k: number) => (rnd(step * 7 + k) - 0.5) * 2.4;
  return <Svg bg="#E9DCC0">
    <defs>
      <filter id={`pt${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.22  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <filter id={`ps${id}`} x="-10%" y="-10%" width="130%" height="130%"><feDropShadow dx="5" dy="7" stdDeviation="3" floodColor="#3B2A12" floodOpacity=".38"/></filter>
    </defs>
    <rect width={CW} height={CH} fill="#F1E6CC"/>
    <rect width={CW} height={CH} fill="#000" filter={`url(#pt${id})`}/>
    <g transform={`rotate(${j(1) * 0.4} 270 480)`}>
      <Draw fig={[]} pal={{floor: '#C99A62', window: '#FFFFFF', pane: '#A9D8F0', board: '#FFFDF6', bar: '#E2533A', clock: '#FFFFFF', hand: '#333', monitor: '#3E4A5C', screen: '#7FC6E8', desk: '#8C5A2E', pot: '#C2643A', leaf: '#4E9A4A'}} envFilter={`url(#ps${id})`}/>
    </g>
    <g transform={`translate(${j(2)} ${j(3)}) rotate(${j(4) * 0.8} 260 600)`}>
      <Draw env={[]} fig={rig(ts)} pal={{skin: '#F2C29B', hair: '#4A2E1C', shirt: '#FFFFFF', pants: '#2D3E66', shoe: '#2A1C14', box: '#C99A62', tie: '#D2402F'}} figFilter={`url(#ps${id})`}/>
    </g>
  </Svg>;
};

// 4 ---------------------------------------------------------------- Isometric
const ISO = (x: number, y: number, z: number) => [270 + (x - y) * 0.866, 560 + (x + y) * 0.5 - z];
const isoBox = (x: number, y: number, z: number, w: number, d: number, h: number, top: string, left: string, right: string, k: string) => {
  const P = (a: number, b: number, c: number) => ISO(a, b, c);
  return <g key={k}>
    <path d={polyP([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={left}/>
    <path d={polyP([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} fill={right}/>
    <path d={polyP([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={top}/>
  </g>;
};
const Iso: React.FC<{t: number}> = ({t}) => {
  const u = Math.min(1, t / 1.8), px = -150 + 300 * u, [fx, fy] = ISO(px, 60, 0);
  const fig = rig(t, {x0: fx, x1: fx, s: 0.62, cy: fy - FLOOR});
  return <Svg bg="#F5EFFB"><g transform="translate(270 500) scale(0.82) translate(-270 -540)">
    {isoBox(-220, -220, -16, 440, 440, 16, '#FFFFFF', '#E3D9F2', '#D3C6EA', 'floor')}
    {isoBox(-220, -220, 0, 440, 8, 220, '#F0E9FA', '#E8DFF6', '#EFE7FA', 'wallL')}
    {Array.from({length: 7}, (_, i) => <path key={'g' + i} d={`M${ISO(-220 + i * 73, -220, 0).join(' ')}L${ISO(-220 + i * 73, 220, 0).join(' ')}`} stroke="#EBE3F6" strokeWidth={1.5}/>)}
    {isoBox(-160, -200, 0, 120, 60, 70, '#FFFFFF', '#E7E1F0', '#D9D0E8', 'desk1')}
    {isoBox(-130, -195, 70, 60, 10, 48, '#4B4F6B', '#5A5F7E', '#3C405A', 'mon1')}
    {isoBox(40, -200, 0, 120, 60, 70, '#FFFFFF', '#E7E1F0', '#D9D0E8', 'desk2')}
    {isoBox(70, -195, 70, 60, 10, 48, '#4B4F6B', '#5A5F7E', '#3C405A', 'mon2')}
    <path d={polyP([ISO(-104, -194, 86), ISO(-84, -194, 86), ISO(-84, -194, 104), ISO(-104, -194, 104)])} fill="#4FD1A5"/>
    {isoBox(150, 120, 0, 40, 40, 40, '#F7B8A8', '#E89A88', '#D9806D', 'pot')}
    <circle cx={ISO(170, 140, 70)[0]} cy={ISO(170, 140, 70)[1]} r={28} fill="#5CC98F"/>
    <circle cx={ISO(160, 128, 92)[0]} cy={ISO(160, 128, 92)[1]} r={20} fill="#4AB57B"/>
    {isoBox(-200, 100, 0, 50, 50, 22, '#F7C66B', '#E6A94A', '#D2923A', 'crate')}
    <path d={polyP([ISO(-150, -219, 120), ISO(-60, -219, 120), ISO(-60, -219, 180), ISO(-150, -219, 180)])} fill="#D9F2E6"/>
    <path d={polyP([ISO(-140, -219, 150), ISO(-120, -219, 162), ISO(-96, -219, 140), ISO(-70, -219, 168)])} fill="none" stroke="#4FD1A5" strokeWidth={3}/>
    <ellipse cx={fx + 8} cy={fy + 2} rx={40} ry={12} fill="rgba(90,70,140,.18)"/>
    <Draw env={[]} fig={fig} pal={{skin: '#F4C7A8', hair: '#3A2C55', shirt: '#FFFFFF', pants: '#4A3FB8', shoe: '#2C2550', box: '#F7C66B', tie: '#4FD1A5'}} stroke="#3A2C55" sw={1.2}/>
  </g></Svg>;
};

// 5 ---------------------------------------------------------------- Blueprint
const Blueprint: React.FC<{t: number; id: string}> = ({t, id}) => {
  const fig = rig(t), W = '#E8F1FF', hx = 160 + 150 * Math.min(1, t / 1.6);
  return <Svg bg="#0E3B80">
    <defs>
      <pattern id={`bs${id}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(232,241,255,.10)" strokeWidth={1}/></pattern>
      <pattern id={`bl${id}`} width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="rgba(232,241,255,.22)" strokeWidth={1.2}/></pattern>
    </defs>
    <rect width={CW} height={CH} fill={`url(#bs${id})`}/><rect width={CW} height={CH} fill={`url(#bl${id})`}/>
    <Draw fig={[]} pal={{}} stroke={W} sw={1.6} noEnv={['floor']}/>
    <line x1={0} y1={FLOOR} x2={CW} y2={FLOOR} stroke={W} strokeWidth={2}/>
    <g strokeDasharray="6 5"><line x1={hx - 70} y1={FLOOR - 352} x2={hx + 120} y2={FLOOR - 352} stroke={W} opacity={0.6}/></g>
    <line x1={hx - 60} y1={FLOOR - 352} x2={hx - 60} y2={FLOOR} stroke={W} strokeWidth={1.2}/>
    <path d={`M${hx - 66} ${FLOOR - 340}L${hx - 60} ${FLOOR - 352}L${hx - 54} ${FLOOR - 340}M${hx - 66} ${FLOOR - 12}L${hx - 60} ${FLOOR}L${hx - 54} ${FLOOR - 12}`} stroke={W} fill="none"/>
    <Mono x={hx - 70} y={FLOOR - 176} fill={W} anchor="end">H 1.80 m</Mono>
    <Draw env={[]} fig={fig} pal={{}} stroke={W} sw={2}/>
    <g transform="translate(316 862)"><rect width={204} height={78} fill="none" stroke={W}/><line x1={0} y1={30} x2={204} y2={30} stroke={W}/>
      <Mono x={10} y={21} fill={W} size={12}>DWG 05 · WALK CYCLE</Mono><Mono x={10} y={52} fill={W} size={11}>SCALE 1:20</Mono><Mono x={10} y={68} fill={W} size={11} op={0.7}>{`FRAME ${String(Math.floor(t * 30)).padStart(3, '0')}`}</Mono></g>
  </Svg>;
};

// 6 ---------------------------------------------------------------- Thermal Cam
const Thermal: React.FC<{t: number; id: string}> = ({t, id}) => {
  const fig = rig(t), hx = 160 + 150 * Math.min(1, t / 1.6);
  return <Svg bg="#16032C">
    <defs>
      <linearGradient id={`tb${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A0436"/><stop offset=".7" stopColor="#3B0A6E"/><stop offset="1" stopColor="#5A1580"/></linearGradient>
      <radialGradient id={`th${id}`} cx={hx + 10} cy={FLOOR - 300} r={240} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#FFF6C8"/><stop offset=".22" stopColor="#FFD23A"/><stop offset=".5" stopColor="#FF6A00"/><stop offset=".8" stopColor="#E0153A"/><stop offset="1" stopColor="#A0105E"/></radialGradient>
      <linearGradient id={`ts${id}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#1A0436"/><stop offset=".35" stopColor="#7A1A9A"/><stop offset=".6" stopColor="#FF3A3A"/><stop offset=".85" stopColor="#FFC21A"/><stop offset="1" stopColor="#FFFBE0"/></linearGradient>
      <filter id={`tf${id}`}><feGaussianBlur stdDeviation="3.5"/></filter>
    </defs>
    <rect width={CW} height={CH} fill={`url(#tb${id})`}/>
    <g filter={`url(#tf${id})`}>
      <Draw fig={[]} pal={{floor: '#2B0752', window: '#240650', pane: '#30086A', board: '#2A0758', bar: '#4A0F7A', clock: '#2A0758', hand: '#4A0F7A', monitor: '#7A1A8A', screen: '#C0306A', desk: '#36096A', pot: '#2E0860', leaf: '#3C0C70'}}/>
      <Draw env={[]} fig={fig} pal={{skin: `url(#th${id})`, hair: '#FF7A10', shirt: `url(#th${id})`, pants: '#E0303A', shoe: '#9A1066', box: '#5A1590', tie: `url(#th${id})`}}/>
    </g>
    <rect x={500} y={180} width={14} height={420} fill={`url(#ts${id})`} rx={3}/>
    <Mono x={496} y={176} fill="#FFF" size={12} anchor="end">38.2°</Mono><Mono x={496} y={612} fill="#FFF" size={12} anchor="end">18.4°</Mono>
    <g stroke="#FFF" strokeWidth={1.5} opacity={0.85}><path d={`M${hx - 12} ${FLOOR - 330}h24M${hx} ${FLOOR - 342}v24`}/><rect x={hx - 40} y={FLOOR - 370} width={80} height={80} fill="none" strokeDasharray="10 50"/></g>
    <Mono x={hx + 46} y={FLOOR - 360} fill="#FFF" size={14}>{(36.6 + 0.2 * Math.sin(t * 3)).toFixed(1) + '°C'}</Mono>
    <Mono x={24} y={40} fill="#FFF" size={13}>● REC  IR-CAM 02</Mono>
    <Mono x={24} y={CH - 26} fill="#FFF" size={12} op={0.8}>{`MAX 38.2°C  MIN 18.4°C  ${String(Math.floor(t * 30)).padStart(4, '0')}`}</Mono>
  </Svg>;
};

// 7 ---------------------------------------------------------------- Anime Cel (flat fills + hard shadow + ink line + speed lines)
const Anime: React.FC<{t: number; id: string}> = ({t, id}) => {
  const fig = rig(t), K = '#1A1420';
  return <Svg bg="#BFE6FF">
    <defs><clipPath id={`ac${id}`}><path d={rectP(36, 150, 210, 250, 6)}/></clipPath></defs>
    <rect width={CW} height={CH} fill="#FFF3DD"/>
    <g clipPath={`url(#ac${id})`}><rect x={36} y={150} width={210} height={250} fill="#7CC8FF"/><ellipse cx={110} cy={250} rx={60} ry={22} fill="#FFF"/><ellipse cx={190} cy={330} rx={50} ry={18} fill="#FFF"/></g>
    <Draw fig={[]} pal={{floor: '#E7B57A', board: '#FFFFFF', bar: '#FF6B6B', clock: '#FFFFFF', hand: K, monitor: '#4E5A78', screen: '#9BE3FF', desk: '#B97A44', pot: '#E46A3D', leaf: '#5DBB5A'}} stroke={K} sw={2.5} noEnv={['window', 'pane']}/>
    <path d={rectP(36, 150, 210, 250, 6)} fill="none" stroke={K} strokeWidth={3}/>
    {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={FLOOR + 14 + i * 18} x2={CW} y2={FLOOR + 14 + i * 18} stroke="#CF9A5E" strokeWidth={2}/>)}
    {Math.floor(t * 6) % 2 === 0 && Array.from({length: 16}, (_, i) => { const a = (i / 16) * 2 * Math.PI, r0 = 330 + rnd(i + Math.floor(t * 6)) * 60; return <line key={'s' + i} x1={270 + Math.cos(a) * r0} y1={470 + Math.sin(a) * r0} x2={270 + Math.cos(a) * 700} y2={470 + Math.sin(a) * 700} stroke={K} strokeWidth={2 + rnd(i) * 4} opacity={0.18}/>; })}
    <Draw env={[]} fig={fig} pal={{skin: '#FFD9BC', hair: '#5A3420', shirt: '#FFFFFF', pants: '#3C4F8C', shoe: '#2A1A14', box: '#E9B36A', tie: '#E8434F'}} stroke={K} sw={3}/>
    <g opacity={0.22}>{fig.filter(p => p.depth === 1 && p.part === 'shirt').map((p, i) => <path key={i} d={p.d} fill="#6A7AB0" transform="translate(14 0)" clipPath="none"/>)}</g>
  </Svg>;
};

// 8 ---------------------------------------------------------------- ASCII Terminal (scene rasterised to a char grid)
const RAMP = ' .:-=+*#%@';
const Ascii: React.FC<{t: number}> = ({t}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const COLS = 66, ROWS = 92, cw = CW / COLS, ch = (CH - 70) / ROWS;
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const off = document.createElement('canvas'); off.width = COLS; off.height = ROWS;
    const o = off.getContext('2d')!; o.fillStyle = '#000'; o.fillRect(0, 0, COLS, ROWS);
    o.save(); o.scale(COLS / CW, ROWS / (CH - 70)); o.translate(0, -30);
    const shade: Record<string, string> = {floor: '#222', window: '#555', pane: '#2a2a2a', board: '#666', bar: '#bbb', clock: '#777', monitor: '#777', screen: '#999', desk: '#888', pot: '#666', leaf: '#999'};
    OFFICE.forEach(e => { if (e.part === 'hand') return; o.fillStyle = shade[e.part] || '#444'; o.fill(new Path2D(e.d)); });
    const fs: Record<string, string> = {skin: '#fff', hair: '#ddd', shirt: '#eee', pants: '#bbb', shoe: '#999', box: '#d0d0d0', tie: '#fff'};
    [0, 1, 2].forEach(d => rig(t).filter(p => p.depth === d).forEach(p => { o.fillStyle = fs[p.part]; o.fill(new Path2D(p.d)); }));
    o.restore();
    const px = o.getImageData(0, 0, COLS, ROWS).data;
    const c = cv.getContext('2d')!; const S = 2; cv.width = CW * S; cv.height = CH * S; c.scale(S, S);
    c.fillStyle = '#020B04'; c.fillRect(0, 0, CW, CH);
    c.font = `700 ${ch * 1.02}px ASMono, Menlo, monospace`; c.textBaseline = 'top';
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const v = px[(y * COLS + x) * 4] / 255; if (v < 0.05) continue;
      const k = Math.min(RAMP.length - 1, Math.floor(v * RAMP.length));
      c.fillStyle = `rgba(${60 + 120 * v},${255},${90 + 80 * v},${0.35 + 0.65 * v})`;
      c.fillText(RAMP[k], x * cw, 36 + y * ch);
    }
    c.fillStyle = 'rgba(80,255,120,.85)'; c.font = '500 13px ASMono, Menlo, monospace';
    c.fillText(`user@claude:~$ render --style ascii --frame ${String(Math.floor(t * 30)).padStart(3, '0')}`, 14, 12);
    c.fillText(`[ OK ] ${COLS}x${ROWS} cells   ${Math.round(30)} fps`, 14, CH - 24);
    for (let y = 0; y < CH; y += 3) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, y, CW, 1); }
  });
  return <canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}}/>;
};

// 9 ---------------------------------------------------------------- Watercolor
const Water: React.FC<{t: number; id: string}> = ({t, id}) => {
  const seed = Math.floor(t * 8) % 3;
  return <Svg bg="#F7F1E5">
    <defs>
      <filter id={`wp${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.52  0 0 0 0 0.38  0 0 0 .16 0"/></filter>
      <filter id={`ww${id}`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed={seed + 2} result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.2"/></filter>
      <filter id={`we${id}`} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={seed + 5} result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>
    </defs>
    <rect width={CW} height={CH} filter={`url(#wp${id})`}/>
    <g filter={`url(#ww${id})`} opacity={0.95}>
      <Draw fig={[]} pal={{floor: '#D9B48A', window: '#FFFFFF', pane: '#A8CDE6', board: '#FBF7EE', bar: '#E58C6E', clock: '#FFFFFF', hand: '#6A5A4A', monitor: '#7C8798', screen: '#B9DDEF', desk: '#B7895C', pot: '#D07A55', leaf: '#86B97A'}} fillOp={0.85}/>
      <Draw env={[]} fig={rig(t)} pal={{skin: '#F2C7A4', hair: '#7A5236', shirt: '#E9F0FA', pants: '#6E86B8', shoe: '#5A4636', box: '#D8A86E', tie: '#D96A5A'}} fillOp={0.95}/>
    </g>
    <g filter={`url(#we${id})`} opacity={0.5}><Draw env={[]} fig={rig(t)} pal={{}} stroke="#5A4A3A" sw={1.4}/></g>
  </Svg>;
};

// 10 ---------------------------------------------------------------- Claymation (12 fps, boil, glossy rounded forms)
const Clay: React.FC<{t: number; id: string}> = ({t, id}) => {
  const step = Math.floor(t * 12), ts = step / 12;
  const g = (k: string, a: string, b: string) => <radialGradient id={`${k}${id}`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor={a}/><stop offset="1" stopColor={b}/></radialGradient>;
  return <Svg bg="#E9D3B0">
    <defs>
      {g('ks', '#FFD9B8', '#C8845A')}{g('kh', '#8A5A3A', '#3A2214')}{g('kc', '#E8F3FF', '#8FB0D8')}{g('kp', '#9A6A4A', '#4A2E1E')}
      {g('kb', '#F05050', '#A01818')}{g('kd', '#D6A26E', '#8A5A30')}{g('kf', '#F2DDBB', '#C9A77A')}{g('kl', '#7BC86A', '#2F7A2A')}
      <filter id={`kk${id}`} x="-10%" y="-10%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed={step % 4} result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/><feDropShadow dx="4" dy="8" stdDeviation="5" floodColor="#4A2E14" floodOpacity=".35"/></filter>
    </defs>
    <rect width={CW} height={CH} fill="#F3E4C8"/>
    <g filter={`url(#kk${id})`}>
      <Draw fig={[]} pal={{floor: `url(#kf${id})`, window: '#FFFFFF', pane: '#BFE0F2', board: '#FFFFFF', bar: '#E2533A', clock: '#FFFFFF', hand: '#3A2214', monitor: '#4A5060', screen: '#9AD0EE', desk: `url(#kd${id})`, pot: `url(#kb${id})`, leaf: `url(#kl${id})`}}/>
      <Draw env={[]} fig={rig(ts)} pal={{skin: `url(#ks${id})`, hair: `url(#kh${id})`, shirt: `url(#kc${id})`, pants: `url(#kp${id})`, shoe: '#2A180E', box: `url(#kb${id})`, tie: '#C02020'}}/>
    </g>
    <ellipse cx={170} cy={200} rx={120} ry={60} fill="#fff" opacity={0.05}/>
  </Svg>;
};

export const StyleCard: React.FC<{i: number; t: number; id: string}> = ({i, t, id}) => {
  switch (i) {
    case 0: return <Hologram t={t} id={id}/>;
    case 1: return <Cyber t={t} id={id}/>;
    case 2: return <Paper t={t} id={id}/>;
    case 3: return <Iso t={t}/>;
    case 4: return <Blueprint t={t} id={id}/>;
    case 5: return <Thermal t={t} id={id}/>;
    case 6: return <Anime t={t} id={id}/>;
    case 7: return <Ascii t={t}/>;
    case 8: return <Water t={t} id={id}/>;
    default: return <Clay t={t} id={id}/>;
  }
};
export {ellP, circP};
