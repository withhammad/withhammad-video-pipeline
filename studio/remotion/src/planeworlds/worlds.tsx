import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';

// Ten worlds for the paper-plane reel (job 990543b928c4). Every world is drawn in code (SVG + CSS) at 1080x1920.
// Each takes t = frames since the world appeared (it keeps scrolling for parallax) and `cue` = frames since its
// second spoken beat (used for the chalk forces, the comic WHOOSH, the Dan Koe orbit and the Zack D. catch).
export type WorldProps = {t: number; cue?: number};
export const W = 1080, H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ramp = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
export const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const rnd = (seed: number) => {const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x);};
// wrap a scrolling x into [-m, W+m)
const wrap = (x: number, span: number, m = 0) => ((((x + m) % span) + span) % span) - m;

const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) =>
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, ...style}}>{children}</svg>;

// ------------------------------------------------------------------------------------------------ 1. PIXEL ART
const PX = 12; // one "pixel"
const pixelCloud = [
  '..XXXX......', '.XXXXXXX.XX.', 'XXXXXXXXXXXX', '.XXXXXXXXXX.'];
const PixelSprite: React.FC<{rows: string[]; x: number; y: number; c: Record<string, string>; p?: number}> = ({rows, x, y, c, p = PX}) =>
  <g>{rows.flatMap((r, j) => [...r].map((ch, i) => (c[ch] ? <rect key={i + '-' + j} x={x + i * p} y={y + j * p} width={p} height={p} fill={c[ch]}/> : null)))}</g>;
export const Pixel: React.FC<WorldProps> = ({t}) => {
  const bands = ['#3E8EF0', '#4D9AF2', '#5EA7F4', '#70B4F6', '#83C1F8', '#97CDF9', '#ADD9FB'];
  const cols = ['#F25C8F', '#FFD23F', '#2EC4B6', '#5E60CE', '#FF8C42', '#43AA8B'];
  const bld = (layer: number) => Array.from({length: 14}, (_, i) => {
    const w = (layer ? 132 : 96) + Math.floor(rnd(i * 7 + layer) * 3) * 24, h = (layer ? 520 : 300) + Math.floor(rnd(i * 3 + layer * 11) * 8) * 48;
    return {w, h, c: layer ? cols[i % cols.length] : '#6FA8DC', i};
  });
  const far = bld(0), near = bld(1);
  const row = (list: ReturnType<typeof bld>, speed: number, base: number, win: boolean) => {
    let x0 = 0; const span = list.reduce((a, b) => a + b.w + 12, 0);
    return list.map((b) => {
      const x = wrap(x0 - t * speed, span, 200); x0 += b.w + 12;
      const top = base - b.h;
      return <g key={b.i}>
        <rect x={Math.round(x / PX) * PX} y={top} width={b.w} height={b.h} fill={b.c}/>
        <rect x={Math.round(x / PX) * PX} y={top} width={b.w} height={PX} fill="rgba(255,255,255,.35)"/>
        {win && Array.from({length: Math.floor((b.h - 60) / 48)}, (_, r) => Array.from({length: Math.floor((b.w - 24) / 36)}, (_, k) =>
          <rect key={r + '-' + k} x={Math.round(x / PX) * PX + 18 + k * 36} y={top + 36 + r * 48} width={24} height={24}
            fill={rnd(b.i * 100 + r * 10 + k) > 0.3 ? '#FFF6C2' : 'rgba(0,0,0,.28)'}/>))}
      </g>;
    });
  };
  return <AbsoluteFill style={{background: bands[0]}}><Svg style={{shapeRendering: 'crispEdges'}}>
    {bands.map((c, i) => <rect key={c} x={0} y={i * 160} width={W} height={160} fill={c}/>)}
    <rect x={0} y={1120} width={W} height={800} fill={bands[6]}/>
    {/* pixel sun */}
    <PixelSprite x={820} y={250} c={{X: '#FFE14D', o: '#FFB627'}} rows={['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXo', 'XXXXXXoo', '.XXXXoo.', '..oooo..']} p={18}/>
    {[0, 1, 2, 3].map((i) => <PixelSprite key={i} rows={pixelCloud} x={wrap(120 + i * 330 - t * (0.6 + i * 0.15), W + 300, 200)} y={420 + (i % 2) * 140 + i * 30} c={{X: '#FFFFFF'}} p={i % 2 ? 12 : 16}/>)}
    {row(far, 1.6, 1500, false)}
    {row(near, 3.2, 1920, true)}
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 2. CHALKBOARD
const chalk = 'url(#chalk)';
export const Chalk: React.FC<WorldProps> = ({t, cue = -999}) => {
  const draw = (start: number, len = 40) => 1 - ease(ramp(t, start, start + len));
  const house = (x: number, w: number, h: number, peak: boolean, i: number) => {
    const y = 1640 - h;
    const d = peak ? `M${x} 1640 V${y + 60} L${x + w / 2} ${y} L${x + w} ${y + 60} V1640` : `M${x} 1640 V${y} H${x + w} V1640`;
    const wins = Array.from({length: Math.floor((h - 80) / 90)}, (_, r) => [0, 1].map((k) => `M${x + 22 + k * (w / 2 - 6)} ${y + 80 + r * 90} h${w / 2 - 40} v48 h-${w / 2 - 40} Z`).join(' ')).join(' ');
    return <g key={i}>
      <path d={d} pathLength={1} strokeDasharray={1} strokeDashoffset={draw(i * 4, 36)} fill="none" stroke="#F4F1E8" strokeWidth={5} filter={chalk}/>
      <path d={wins} fill="none" stroke="#F4F1E8" strokeWidth={3.5} opacity={ramp(t, i * 4 + 20, i * 4 + 34) * 0.85} filter={chalk}/>
    </g>;
  };
  const city = [[20, 150, 300, true], [190, 120, 420, false], [330, 170, 360, true], [520, 110, 520, false], [650, 160, 330, true], [830, 120, 460, false], [960, 140, 300, true]] as const;
  const arrow = (x1: number, y1: number, x2: number, y2: number, col: string, label: string, lx: number, ly: number, at: number) => {
    const p = ease(ramp(cue, at, at + 10));
    const a = Math.atan2(y2 - y1, x2 - x1), hx = x1 + (x2 - x1) * p, hy = y1 + (y2 - y1) * p;
    return <g opacity={p > 0 ? 1 : 0} filter={chalk}>
      <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={col} strokeWidth={7} strokeLinecap="round"/>
      <path d={`M${hx - 30 * Math.cos(a - 0.5)} ${hy - 30 * Math.sin(a - 0.5)} L${hx} ${hy} L${hx - 30 * Math.cos(a + 0.5)} ${hy - 30 * Math.sin(a + 0.5)}`} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round"/>
      <text x={lx} y={ly} fill={col} fontFamily="PwChalk" fontSize={60} opacity={ramp(cue, at + 6, at + 12)}>{label}</text>
    </g>;
  };
  const sunR = 1 - ease(ramp(t, 10, 40));
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #3D6150 0%, #2C4A3C 60%, #1F3A2E 100%)'}}><Svg>
    <defs>
      <filter id="chalk"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale={4}/></filter>
      <filter id="board"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={9}/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .06 0"/></filter>
    </defs>
    <rect width={W} height={H} filter="url(#board)"/>
    {/* clouds + sun */}
    <path d="M60 560 q40 -50 90 -20 q30 -50 90 -10 q60 0 50 40 H60" pathLength={1} strokeDasharray={1} strokeDashoffset={draw(4)} fill="none" stroke="#F4F1E8" strokeWidth={4} filter={chalk}/>
    <path d="M760 500 q40 -50 90 -20 q30 -50 90 -10 q60 0 50 40 H760" pathLength={1} strokeDasharray={1} strokeDashoffset={draw(8)} fill="none" stroke="#F4F1E8" strokeWidth={4} filter={chalk}/>
    <circle cx={850} cy={760} r={56} pathLength={1} strokeDasharray={1} strokeDashoffset={sunR} fill="none" stroke="#F7E27A" strokeWidth={6} filter={chalk}/>
    {Array.from({length: 10}, (_, i) => {const a = (i / 10) * Math.PI * 2; return <line key={i} x1={850 + Math.cos(a) * 80} y1={760 + Math.sin(a) * 80} x2={850 + Math.cos(a) * 112} y2={760 + Math.sin(a) * 112} stroke="#F7E27A" strokeWidth={5} opacity={ramp(t, 30 + i, 34 + i)} filter={chalk}/>;})}
    {/* dashed flight path drawing in behind the plane */}
    <path d="M-40 1000 C 180 960, 300 1010, 470 985" fill="none" stroke="#F4F1E8" strokeWidth={5} strokeDasharray="26 22" opacity={ramp(t, 6, 18)} filter={chalk}/>
    {city.map(([x, w, h, p], i) => house(x, w, h, p, i))}
    <path d="M0 1642 H1080" pathLength={1} strokeDasharray={1} strokeDashoffset={draw(0, 30)} stroke="#F4F1E8" strokeWidth={6} filter={chalk}/>
    {/* the four forces on a paper plane (lift up, weight down, thrust forward, drag back) */}
    {arrow(540, 940, 540, 760, '#F7E27A', 'LIFT', 570, 800, 0)}
    {arrow(560, 1060, 560, 1240, '#F59AB0', 'WEIGHT', 590, 1230, 6)}
    {arrow(680, 1000, 860, 1000, '#F7B267', 'THRUST', 700, 960, 12)}
    {arrow(380, 1000, 210, 1000, '#F59AB0', 'DRAG', 200, 960, 18)}
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 3. GLOW SKETCH
export const Glow: React.FC<WorldProps> = ({t}) => {
  const s = t * 2.2;
  const bridge = (ox: number) => {
    const dots: React.ReactNode[] = [];
    const towers = [ox, ox + 620];
    towers.forEach((tx, k) => {
      for (let y = 1180; y < 1720; y += 16) dots.push(<circle key={`t${k}-${y}`} cx={tx} cy={y} r={3.4}/>, <circle key={`u${k}-${y}`} cx={tx + 40} cy={y} r={3.4}/>);
    });
    for (let x = ox - 300; x <= ox + 960; x += 14) {
      const local = x < ox ? (x - (ox - 300)) / 300 : x > ox + 660 ? 1 - (x - (ox + 660)) / 300 : null;
      const u = (x - (ox + 330)) / 310, cy = local !== null ? 1180 + (1 - local) * 380 : 1180 + 330 * (1 - u * u);
      dots.push(<circle key={`c${x}`} cx={x} cy={cy} r={3}/>);
      dots.push(<circle key={`d${x}`} cx={x} cy={1560} r={2.6} opacity={0.7}/>);
      if ((x - ox) % 42 === 0 && x > ox && x < ox + 620) for (let y = cy + 20; y < 1560; y += 22) dots.push(<circle key={`h${x}-${y}`} cx={x} cy={y} r={1.8} opacity={0.55}/>);
    }
    return dots;
  };
  const ox = wrap(220 - s, 1700, 900);
  const lit = ramp(t, 0, 24);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, #17120A 0%, #050403 70%)'}}><Svg>
    <defs><filter id="gglow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx={880} cy={640} r={60} fill="none" stroke="#E9C46A" strokeWidth={2} strokeDasharray="2 10" opacity={0.6 * lit}/>
    <g fill="#F2C14E" filter="url(#gglow)" opacity={lit}>{bridge(ox)}{bridge(ox + 1700)}</g>
    {/* reflection */}
    <g fill="#F2C14E" opacity={0.18 * lit} transform="translate(0 3460) scale(1 -1)" style={{filter: 'blur(3px)'}}>{bridge(ox)}</g>
    {/* the glowing trail of dots behind the plane */}
    <g fill="#FFD27A" filter="url(#gglow)">{Array.from({length: 26}, (_, i) => <circle key={i} cx={470 - i * 22} cy={985 + Math.sin((t - i * 2) / 9) * 10} r={4 - i * 0.12} opacity={1 - i / 26}/>)}</g>
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 4. PS2 STYLE
export const Ps2: React.FC<WorldProps> = ({t}) => {
  const s = t * 2.4;
  const mountains = (off: number, base: number, h: number, col1: string, col2: string, k: number) => {
    const pts: React.ReactNode[] = [];
    for (let i = -1; i < 7; i++) {
      const x = wrap(i * 260 - off, 260 * 7, 300), hh = h * (0.6 + rnd(i + k * 13) * 0.5);
      pts.push(<polygon key={`a${k}${i}`} points={`${x - 170},${base} ${x},${base - hh} ${x + 10},${base}`} fill={col1}/>);
      pts.push(<polygon key={`b${k}${i}`} points={`${x},${base - hh} ${x + 170},${base} ${x + 10},${base}`} fill={col2}/>);
    }
    return pts;
  };
  const towers = Array.from({length: 12}, (_, i) => ({w: 150 + rnd(i * 5) * 110, h: 380 + rnd(i * 9) * 520, depth: i % 3, i}));
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #2B2F7A 0%, #5B5BB0 45%, #9C93D0 62%, #8C86B8 100%)'}}><Svg>
    <defs>
      <pattern id="ps2win" width="28" height="34" patternUnits="userSpaceOnUse"><rect width="28" height="34" fill="#5A4E6E"/><rect x="5" y="6" width="16" height="18" fill="#2A2240"/><rect x="5" y="6" width="8" height="9" fill="#8E7FA8" opacity=".5"/></pattern>
      <pattern id="ps2win2" width="28" height="34" patternUnits="userSpaceOnUse"><rect width="28" height="34" fill="#6E6488"/><rect x="5" y="6" width="16" height="18" fill="#332A4E"/></pattern>
      <pattern id="checker" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="120" height="120" fill="#5D5980"/><rect width="60" height="60" fill="#6B6790"/><rect x="60" y="60" width="60" height="60" fill="#6B6790"/></pattern>
      <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B7AFDF" stopOpacity="0"/><stop offset="1" stopColor="#B7AFDF" stopOpacity=".75"/></linearGradient>
    </defs>
    {/* hexagon "sun", the low-poly kind */}
    <polygon points="880,380 940,415 940,485 880,520 820,485 820,415" fill="#E9E6FF" opacity={0.92}/>
    {mountains(s * 0.2, 1240, 380, '#7B79C2', '#5F5DA6', 1)}
    {mountains(s * 0.35, 1300, 260, '#6D6AAF', '#54518F', 2)}
    <rect x={0} y={1290} width={W} height={630} fill="url(#checker)" transform={`translate(${-(s % 120)} 0)`}/>
    {towers.map((b) => {
      const x = wrap(b.i * 175 - s * (0.7 + b.depth * 0.25), 175 * 12, 300), base = 1500 + b.depth * 120, top = base - b.h;
      return <g key={b.i} opacity={0.75 + b.depth * 0.1}>
        <rect x={x} y={top} width={b.w} height={b.h} fill={b.depth % 2 ? 'url(#ps2win)' : 'url(#ps2win2)'}/>
        <polygon points={`${x + b.w},${top} ${x + b.w + 40},${top + 26} ${x + b.w + 40},${base} ${x + b.w},${base}`} fill="#3E3558"/>
        <polygon points={`${x},${top} ${x + 40},${top - 26} ${x + b.w + 40},${top - 26} ${x + b.w},${top}`} fill="#9A90BE"/>
      </g>;
    })}
    <rect x={0} y={900} width={W} height={1020} fill="url(#fog)"/>
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 5. COMIC ART
export const Comic: React.FC<WorldProps> = ({t, cue = -999}) => {
  const s = t * 3;
  const cloud = (x: number, y: number, k: number, sc = 1) => <g key={k} transform={`translate(${x} ${y}) scale(${sc})`}>
    <path d="M0 60 q-10 -50 40 -55 q20 -45 75 -25 q40 -30 75 10 q50 0 40 50 q20 30 -20 40 H10 q-40 -5 -10 -20Z" fill="#fff" stroke="#111" strokeWidth={7} strokeLinejoin="round"/></g>;
  const cols = ['#E63946', '#1D6FD8', '#F6C90E', '#E63946', '#1D6FD8', '#F6C90E', '#2A9D8F'];
  const blds = Array.from({length: 12}, (_, i) => ({w: 130 + rnd(i * 3) * 90, h: 300 + rnd(i * 7) * 380, c: cols[i % cols.length], i}));
  const boom = cue >= 0 ? ease(ramp(cue, 0, 7)) : 0;
  return <AbsoluteFill style={{background: '#7CC6F2'}}><Svg>
    <defs><pattern id="half" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="11" cy="11" r="4.2" fill="#5AAFE6"/></pattern>
      <pattern id="half2" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="8" cy="8" r="3" fill="rgba(0,0,0,.22)"/></pattern></defs>
    <rect width={W} height={H} fill="url(#half)"/>
    {[0, 1, 2, 3, 4].map((i) => cloud(wrap(i * 300 - s * 0.5, 1500, 300), 430 + (i % 3) * 120, i, 1 + (i % 2) * 0.3))}
    {/* speed lines behind the plane */}
    {[0, 1, 2, 3].map((i) => <line key={i} x1={wrap(380 - i * 40 - (t * 18) % 60, 2000, 0) - 180} y1={950 + i * 28} x2={wrap(380 - i * 40 - (t * 18) % 60, 2000, 0)} y2={950 + i * 28} stroke="#111" strokeWidth={8} strokeLinecap="round"/>)}
    {blds.map((b) => {
      const x = wrap(b.i * 170 - s, 170 * 12, 300), top = 1660 - b.h;
      return <g key={b.i}>
        <rect x={x} y={top} width={b.w} height={b.h} fill={b.c} stroke="#111" strokeWidth={7}/>
        <rect x={x} y={top} width={b.w} height={b.h} fill="url(#half2)"/>
        <line x1={x + b.w * 0.5} y1={top} x2={x + b.w * 0.5} y2={top - 40} stroke="#111" strokeWidth={5}/><circle cx={x + b.w * 0.5} cy={top - 44} r={8} fill="#E63946" stroke="#111" strokeWidth={4}/>
        {Array.from({length: Math.floor((b.h - 50) / 70)}, (_, r) => Array.from({length: Math.floor((b.w - 20) / 44)}, (_, k) =>
          <rect key={r + '-' + k} x={x + 16 + k * 44} y={top + 30 + r * 70} width={28} height={40} fill="#fff" stroke="#111" strokeWidth={4}/>))}
      </g>;
    })}
    <rect x={0} y={1660} width={W} height={260} fill="#2B2D42"/><rect x={0} y={1656} width={W} height={10} fill="#111"/>
    {Array.from({length: 8}, (_, i) => <rect key={i} x={wrap(i * 180 - s * 1.2, 1440, 200)} y={1780} width={90} height={14} fill="#F6C90E"/>)}
    {boom > 0 && <g transform={`translate(700 840) scale(${boom * (1 + 0.04 * Math.sin(cue / 2))}) rotate(-8)`}>
      <polygon points="0,-190 50,-80 170,-120 110,-20 230,30 100,60 140,180 20,100 -60,200 -70,80 -210,110 -110,10 -220,-80 -80,-70 -100,-190" fill="#FFD60A" stroke="#111" strokeWidth={9} strokeLinejoin="round"/>
      <text x={0} y={30} textAnchor="middle" fontFamily="PwComic" fontSize={110} fill="#E63946" stroke="#111" strokeWidth={5} paintOrder="stroke">WHOOSH!</text>
    </g>}
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 6. FLAT VECTOR
export const Flat: React.FC<WorldProps> = ({t}) => {
  const s = t * 2;
  const blds = Array.from({length: 10}, (_, i) => ({w: 90 + rnd(i * 4) * 70, h: 220 + rnd(i * 6) * 300, i}));
  const tree = (x: number, y: number, k: number, sc = 1) => <g key={k} transform={`translate(${x} ${y}) scale(${sc})`}><rect x={-6} y={0} width={12} height={60} rx={4} fill="#3E6B48"/><ellipse cx={0} cy={-20} rx={44} ry={62} fill="#2F9E5B"/><ellipse cx={-14} cy={-36} rx={18} ry={26} fill="#4CC07A" opacity={0.7}/></g>;
  const by = 960 + Math.sin(t / 22) * 18;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #5DB6F0 0%, #A6DBFA 70%, #D6EFFD 100%)'}}><Svg>
    <circle cx={190} cy={620} r={110} fill="#FFC93C"/>
    {[0, 1, 2].map((i) => <g key={i} transform={`translate(${wrap(200 + i * 420 - s * 0.4, 1400, 300)} ${470 + i * 70})`}><rect x={0} y={20} width={220} height={40} rx={20} fill="#fff"/><circle cx={70} cy={22} r={40} fill="#fff"/><circle cx={130} cy={14} r={50} fill="#fff"/></g>)}
    {blds.map((b) => {const x = wrap(b.i * 115 - s * 0.7, 1150, 200), top = 1330 - b.h; return <g key={b.i}><rect x={x} y={top} width={b.w} height={b.h} fill="#F4F7FB"/><rect x={x + b.w * 0.6} y={top} width={b.w * 0.4} height={b.h} fill="#DCE6F2"/>
      {Array.from({length: Math.floor((b.h - 40) / 50)}, (_, r) => <rect key={r} x={x + 14} y={top + 24 + r * 50} width={b.w - 28} height={18} rx={4} fill="#BFD3EA"/>)}</g>;})}
    {/* striped hot-air balloon */}
    <g transform={`translate(${wrap(820 - s * 0.3, 1500, 300)} ${by})`}>
      <path d="M0 -150 C 95 -150, 110 -40, 30 30 L-30 30 C -110 -40, -95 -150, 0 -150Z" fill="#F25F5C"/>
      <path d="M0 -150 C 35 -150, 45 -40, 12 30 L-12 30 C -45 -40, -35 -150, 0 -150Z" fill="#fff"/>
      <line x1={-24} y1={30} x2={-16} y2={70} stroke="#7A5C3E" strokeWidth={3}/><line x1={24} y1={30} x2={16} y2={70} stroke="#7A5C3E" strokeWidth={3}/>
      <rect x={-22} y={70} width={44} height={34} rx={6} fill="#B5835A"/></g>
    <path d={`M0 1360 C 260 1250, 520 1330, 1080 1270 V1920 H0Z`} fill="#7ED492"/>
    <path d={`M0 1470 C 300 1380, 700 1520, 1080 1420 V1920 H0Z`} fill="#4FBF73"/>
    <path d={`M0 1600 C 360 1520, 640 1660, 1080 1580 V1920 H0Z`} fill="#38A35C"/>
    <path d={`M0 1720 C 300 1680, 700 1760, 1080 1700 V1920 H0Z`} fill="#F7E8B5"/>
    {[0, 1, 2, 3, 4, 5].map((i) => tree(wrap(i * 200 - s * 1.2, 1200, 120), 1500 + (i % 2) * 70, i, 1 + (i % 3) * 0.15))}
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 7. DAN KOE STYLE
export const Koe: React.FC<WorldProps> = ({t, cue = -999}) => {
  const fig = ramp(t, 8, 22), orbit = ease(ramp(cue, 0, 30));
  const stars = Array.from({length: 40}, (_, i) => ({x: rnd(i) * W, y: 300 + rnd(i + 50) * 1100, r: 1 + rnd(i + 99) * 1.6}));
  return <AbsoluteFill style={{background: '#000'}}><Svg>
    {stars.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" opacity={0.25 + 0.25 * Math.sin((t + i * 7) / 12)}/>)}
    <line x1={60} y1={1560} x2={1020} y2={1560} stroke="#fff" strokeWidth={2.5} strokeDasharray="2 14" strokeLinecap="round"/>
    {/* the small figure looking up at the plane */}
    <g stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" opacity={fig}>
      <circle cx={300} cy={1300} r={16} fill="#fff"/>
      <line x1={300} y1={1318} x2={300} y2={1440}/><line x1={300} y1={1440} x2={270} y2={1555}/><line x1={300} y1={1440} x2={330} y2={1555}/>
      <line x1={300} y1={1350} x2={262} y2={1420}/><line x1={300} y1={1350} x2={355} y2={1270}/>
    </g>
    {/* orbit drawn in dots around the plane */}
    <circle cx={540} cy={985} r={230} fill="none" stroke="#fff" strokeWidth={2.4} pathLength={1} strokeDasharray={`${orbit} 1`} transform="rotate(-90 540 985)"/>
    <circle cx={540} cy={985} r={300} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="1 18" strokeLinecap="round" opacity={orbit * 0.6}/>
    {orbit > 0 && [0, 1].map((k) => {const a = (cue / 30) * Math.PI + k * Math.PI; return <circle key={k} cx={540 + Math.cos(a) * 300} cy={985 + Math.sin(a) * 300} r={6} fill="#fff"/>;})}
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 8. CGI MOTION
export const Cgi: React.FC<WorldProps> = ({t}) => {
  const s = t * 0.8;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #2E5E9E 0%, #6E9BCB 30%, #C9D9E6 50%, #F3D9B1 56%, #F7E3C4 57%)'}}>
    <Svg>
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9C8D8"/><stop offset=".25" stopColor="#6F8FB5"/><stop offset="1" stopColor="#1C3A66"/></linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFF4DA" stopOpacity="1"/><stop offset=".3" stopColor="#FFE2A8" stopOpacity=".7"/><stop offset="1" stopColor="#FFD08A" stopOpacity="0"/></radialGradient>
        <filter id="haze"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <ellipse cx={560} cy={1085} rx={520} ry={150} fill="url(#sun)"/>
      <g filter="url(#haze)" fill="#5D6E86" opacity={0.85}>
        <path d={`M${-100 - (s % 400)} 1090 l120 -34 l90 18 l140 -46 l160 62 Z`}/>
        <path d={`M${560 - (s % 400)} 1090 l140 -40 l110 22 l90 -16 l170 34 Z`}/>
        <path d={`M${980 - (s % 400)} 1090 l140 -40 l110 22 l90 -16 l170 34 Z`}/>
      </g>
      <rect x={0} y={1090} width={W} height={830} fill="url(#sea)"/>
      {/* sun streak on the water */}
      {Array.from({length: 18}, (_, i) => <rect key={i} x={480 - i * 6 + Math.sin((t + i * 13) / 6) * 20} y={1100 + i * 22} width={160 + i * 14} height={3 + i * 0.3} rx={2} fill="#FFF1D2" opacity={0.55 - i * 0.025}/>)}
      {Array.from({length: 26}, (_, i) => <rect key={'w' + i} x={wrap(rnd(i) * W - t * (1 + rnd(i + 3)), W + 200, 100)} y={1150 + rnd(i + 9) * 700} width={60 + rnd(i + 4) * 140} height={2.5} rx={1} fill="#fff" opacity={0.18}/>)}
    </Svg>
  </AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 9. LEGO STYLE
const Stud: React.FC<{x: number; y: number; c: string; r?: number}> = ({x, y, c, r = 14}) =>
  <g><ellipse cx={x} cy={y + 5} rx={r} ry={r * 0.45} fill="rgba(0,0,0,.22)"/><rect x={x - r} y={y - 6} width={r * 2} height={10} fill={c}/><ellipse cx={x} cy={y - 6} rx={r} ry={r * 0.45} fill={c} style={{filter: 'brightness(1.25)'}}/></g>;
const Brick: React.FC<{x: number; y: number; w: number; h: number; c: string; studs?: boolean}> = ({x, y, w, h, c, studs = true}) =>
  <g><rect x={x} y={y} width={w} height={h} fill={c}/><rect x={x} y={y} width={w} height={6} fill="rgba(255,255,255,.28)"/><rect x={x} y={y + h - 6} width={w} height={6} fill="rgba(0,0,0,.18)"/>
    {studs && Array.from({length: Math.max(1, Math.round(w / 40))}, (_, i) => <Stud key={i} x={x + (i + 0.5) * (w / Math.max(1, Math.round(w / 40)))} y={y} c={c}/>)}</g>;
export const Lego: React.FC<WorldProps> = ({t}) => {
  const s = t * 2.2;
  const hill = (cx: number, base: number, k: number) => [0, 1, 2, 3, 4].map((r) => <Brick key={k + '-' + r} x={cx - 260 + r * 52} y={base - (r + 1) * 46} w={520 - r * 104} h={46} c={r % 2 ? '#3FA34D' : '#48B556'}/>);
  const house = (x: number, k: number, roof: string) => <g key={k}>
    <Brick x={x} y={1430} w={180} h={70} c="#F5F5F0" studs={false}/><Brick x={x} y={1500} w={180} h={70} c="#ECECE6" studs={false}/>
    <rect x={x + 70} y={1500} width={40} height={70} fill="#7A4A26"/><rect x={x + 18} y={1446} width={40} height={36} fill="#7FC8F8"/><rect x={x + 122} y={1446} width={40} height={36} fill="#7FC8F8"/>
    <Brick x={x - 14} y={1384} w={208} h={46} c={roof}/><Brick x={x + 24} y={1340} w={132} h={44} c={roof}/></g>;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #4FA6EE 0%, #8DC8F5 60%, #BFE2FA 100%)'}}><Svg>
    {[0, 1, 2].map((i) => <g key={i} transform={`translate(${wrap(150 + i * 450 - s * 0.3, 1400, 300)} ${470 + i * 90})`}><Brick x={0} y={30} w={240} h={40} c="#FFFFFF"/><Brick x={50} y={-10} w={140} h={40} c="#FFFFFF"/></g>)}
    {[0, 1, 2, 3].map((i) => <g key={i}>{hill(wrap(i * 420 - s * 0.6, 1680, 400), 1390, i)}</g>)}
    <rect x={0} y={1386} width={W} height={534} fill="#2E9A3F"/>
    {Array.from({length: 7}, (_, r) => Array.from({length: 30}, (_, k) => <Stud key={r + '-' + k} x={wrap(k * 40 - s * 1.4 + (r % 2) * 20, 1200, 40)} y={1420 + r * 72} c="#36A847" r={12}/>))}
    {[0, 1, 2].map((i) => house(wrap(i * 420 + 60 - s * 1.4, 1260, 220), i, ['#D0312D', '#E8A33D', '#2F6BD8'][i]))}
    {/* a minifig-sized tower of stacked bricks */}
    <g transform={`translate(${wrap(820 - s * 1.4, 1260, 220)} 0)`}>{['#D0312D', '#F2CD37', '#2F6BD8', '#3FA34D', '#D0312D', '#F2CD37'].map((c, i) => <Brick key={i} x={0} y={1520 - i * 44} w={80} h={44} c={c}/>)}</g>
  </Svg></AbsoluteFill>;
};

// ------------------------------------------------------------------------------------------------ 10. ZACK D. FILMS (soft 3D)
const Soft: React.FC<{cx: number; cy: number; r: number; c: string; hi?: string}> = ({cx, cy, r, c, hi = '#ffffff'}) =>
  <g><ellipse cx={cx + r * 0.1} cy={cy + r * 0.95} rx={r * 0.9} ry={r * 0.22} fill="rgba(30,60,30,.25)"/>
    <circle cx={cx} cy={cy} r={r} fill={c}/><circle cx={cx} cy={cy} r={r} fill="url(#softShade)"/><ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.35} ry={r * 0.25} fill={hi} opacity={0.35}/></g>;
export const Zack: React.FC<WorldProps> = ({t, cue = -999}) => {
  const s = t * 1.6;
  const kid = ease(ramp(cue, 0, 18));
  const house = (x: number, k: number, wall: string, roof: string) => <g key={k} transform={`translate(${x} 0)`}>
    <ellipse cx={95} cy={1478} rx={120} ry={20} fill="rgba(30,60,30,.22)"/>
    <rect x={0} y={1300} width={190} height={180} rx={26} fill={wall}/><rect x={0} y={1300} width={190} height={180} rx={26} fill="url(#softSide)"/>
    <path d="M-20 1316 Q95 1180 210 1316 Q95 1290 -20 1316Z" fill={roof}/><path d="M-20 1316 Q95 1180 210 1316 Q95 1290 -20 1316Z" fill="url(#softShade)"/>
    <rect x={30} y={1350} width={46} height={46} rx={12} fill="#BFE6FF"/><rect x={110} y={1390} width={50} height={90} rx={18} fill="#A86B4A"/></g>;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #7EC8F5 0%, #B6E1FA 55%, #DFF3FD 100%)'}}><Svg>
    <defs>
      <radialGradient id="softShade" cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".28"/><stop offset=".6" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".28"/></radialGradient>
      <linearGradient id="softSide" x1="0" y1="0" x2="1" y2="0"><stop offset=".6" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".18"/></linearGradient>
      <radialGradient id="hill" cx=".4" cy=".2" r=".9"><stop offset="0" stopColor="#B6EB9A"/><stop offset=".7" stopColor="#78C766"/><stop offset="1" stopColor="#5DAE52"/></radialGradient>
    </defs>
    {[0, 1, 2].map((i) => {const x = wrap(120 + i * 430 - s * 0.3, 1300, 300), y = 600 + i * 70; return <g key={i}><Soft cx={x} cy={y} r={52} c="#FFFFFF" hi="#fff"/><Soft cx={x + 60} cy={y - 24} r={66} c="#FFFFFF"/><Soft cx={x + 130} cy={y} r={48} c="#FFFFFF"/></g>;})}
    <ellipse cx={300} cy={1520} rx={720} ry={300} fill="url(#hill)"/>
    <ellipse cx={980} cy={1580} rx={620} ry={300} fill="url(#hill)"/>
    {[0, 1, 2].map((i) => house(wrap(i * 380 + 40 - s, 1140, 260), i, ['#F5B7C5', '#C9B8F2', '#FFE0A8'][i], ['#E8735A', '#8E7BE0', '#F08A4B'][i]))}
    {[0, 1, 2, 3].map((i) => {const x = wrap(i * 300 + 240 - s * 1.2, 1200, 120); return <g key={i}><rect x={x - 10} y={1460} width={20} height={70} rx={8} fill="#9C6B4A"/><Soft cx={x} cy={1420} r={64} c="#4DBA5C"/></g>;})}
    <ellipse cx={540} cy={1880} rx={900} ry={260} fill="#8ED17A"/>
    {/* the kid who catches the plane at the end */}
    {kid > 0 && <g transform={`translate(700 ${2100 - kid * 920}) scale(1.3)`}>
      <ellipse cx={0} cy={380} rx={150} ry={30} fill="rgba(30,60,30,.25)"/>
      <rect x={-120} y={150} width={240} height={240} rx={90} fill="#E8414B"/><rect x={-120} y={150} width={240} height={240} rx={90} fill="url(#softShade)"/>
      <circle cx={0} cy={40} r={130} fill="#F2BE97"/><circle cx={0} cy={40} r={130} fill="url(#softShade)"/>
      <path d="M-130 30 Q-120 -110 0 -96 Q120 -110 130 30 Q100 -40 0 -40 Q-100 -40 -130 30Z" fill="#5A3A28"/>
      <ellipse cx={-44} cy={50} rx={13} ry={18} fill="#2B1B12"/><ellipse cx={44} cy={50} rx={13} ry={18} fill="#2B1B12"/>
      <path d="M-40 100 Q0 132 40 100" stroke="#8A3B2A" strokeWidth={9} fill="none" strokeLinecap="round"/>
      <circle cx={-80} cy={92} r={18} fill="#F28C8C" opacity={0.5}/><circle cx={80} cy={92} r={18} fill="#F28C8C" opacity={0.5}/>
      <rect x={90} y={-60 + (1 - kid) * 120} width={64} height={190} rx={32} fill="#F2BE97" transform="rotate(18 120 40)"/>
    </g>}
  </Svg></AbsoluteFill>;
};

export const WORLDS = [
  {key: 'pixel', name: 'Pixel Art', C: Pixel},
  {key: 'chalk', name: 'Chalkboard', C: Chalk},
  {key: 'glow', name: 'Glow Sketch', C: Glow},
  {key: 'ps2', name: 'PS2 Style', C: Ps2},
  {key: 'comic', name: 'Comic Art', C: Comic},
  {key: 'flat', name: 'Flat Vector', C: Flat},
  {key: 'koe', name: 'Dan Koe Style', C: Koe},
  {key: 'cgi', name: 'CGI Motion', C: Cgi},
  {key: 'lego', name: 'Lego Style', C: Lego},
  {key: 'zack', name: 'Zack D. Films', C: Zack},
] as const;
export type WorldKey = typeof WORLDS[number]['key'];
