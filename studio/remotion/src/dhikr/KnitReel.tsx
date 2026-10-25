import React from 'react';
import {AbsoluteFill, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {COUNT, FPS, STEP, T0, countAt} from './Reel';

// The same Astaghfirullah tasbih counter in a knitted / crochet yarn look (owner, 2026-10-25; style reference
// DeunwnrtpC5): knit-stitch yarn backgrounds, a crochet flower arch around a cream knitted panel, yarn-ball beads with
// wound-thread stripes, gold crochet dividers and tassels, a woven counter ring. Everything drawn here (SVG + fibre noise).
const AR = 'DkAmiri, "Geeza Pro", serif', SERIF = 'DkSerif, Georgia, serif', SANS = 'DkInter, Arial, sans-serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
const S = 94, X0 = 635, WAVE_Y = 1066, AMP = 108;
const waveY = (x: number) => WAVE_Y + AMP * Math.cos(((x - 540) / 1080) * 2 * Math.PI);

const KNITS: [string, string, string, string][] = [
  ['knitNavy', '#2C4266', '#18263C', '#6A88B8'], ['knitCream', '#F3E6D2', '#D9C09C', '#FFFBF2'],
  ['knitPink', '#E7B3BD', '#C98292', '#FBE1E6'], ['knitSage', '#B5C8A6', '#8AA278', '#DCE8D0'], ['knitGold', '#EBC15C', '#C2902E', '#FFE7A6'],
];

// Shared SVG defs: knit-stitch tiles (rows of V stitches) and a fibre-noise filter for the yarn feel.
const Defs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    {KNITS.map(([id, base, dark, light]) =>
      <pattern key={id} id={id} width={44} height={36} patternUnits="userSpaceOnUse">
        <rect width={44} height={36} fill={dark}/>
        <path d="M3 1 C 3 14, 11 27, 21 35 C 22 24, 16 9, 3 1 Z" fill={base} stroke={dark} strokeWidth={1.2}/>
        <path d="M41 1 C 41 14, 33 27, 23 35 C 22 24, 28 9, 41 1 Z" fill={base} stroke={dark} strokeWidth={1.2}/>
        <path d="M6 5 C 8 15, 13 23, 19 30" stroke={light} strokeWidth={2.4} fill="none" opacity={0.8} strokeLinecap="round"/>
        <path d="M38 5 C 36 15, 31 23, 25 30" stroke={light} strokeWidth={2.4} fill="none" opacity={0.8} strokeLinecap="round"/>
        <path d="M5 12 C 9 13, 12 16, 14 19 M39 12 C 35 13, 32 16, 30 19" stroke={dark} strokeWidth={1} fill="none" opacity={0.6}/>
      </pattern>)}
    <filter id="fibre" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85 0.3" numOctaves={2} seed={4} result="n"/>
      <feColorMatrix in="n" type="saturate" values="0" result="g"/>
      <feComponentTransfer in="g" result="g2"><feFuncA type="linear" slope={0.5}/></feComponentTransfer>
      <feComposite in="g2" in2="SourceGraphic" operator="in" result="tex"/>
      <feBlend in="SourceGraphic" in2="tex" mode="multiply"/>
    </filter>
    <radialGradient id="ballShade" cx="38%" cy="32%" r="70%">
      <stop offset="0" stopColor="#ffffff" stopOpacity={0.55}/><stop offset="0.45" stopColor="#ffffff" stopOpacity={0}/>
      <stop offset="1" stopColor="#000000" stopOpacity={0.35}/></radialGradient>
  </defs>
</svg>;

// Crochet rose: concentric scalloped rings, darker towards the centre.
const Rose: React.FC<{x: number; y: number; r: number; c: [string, string, string]; rot?: number}> = ({x, y, r, c, rot = 0}) => {
  const ring = (rr: number, n: number) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, a2 = ((i + 0.5) / n) * Math.PI * 2;
      const p = [x + rr * Math.cos(a), y + rr * Math.sin(a)], q = [x + rr * 1.25 * Math.cos(a2), y + rr * 1.25 * Math.sin(a2)];
      d += i === 0 ? `M${p[0]} ${p[1]}` : ` Q${q[0]} ${q[1]} ${p[0]} ${p[1]}`;
    }
    return d + 'Z';
  };
  return <g transform={`rotate(${rot} ${x} ${y})`} filter="url(#fibre)">
    <path d={ring(r, 7)} fill={c[0]} stroke={c[1]} strokeWidth={2}/>
    <path d={ring(r * 0.66, 6)} fill={c[1]} stroke={c[2]} strokeWidth={2}/>
    <path d={ring(r * 0.36, 5)} fill={c[2]}/>
    <circle cx={x} cy={y} r={r * 0.12} fill="#FFF3D6"/>
    {Array.from({length: 18}, (_, i) => { const a = (i / 18) * Math.PI * 2;
      return <path key={i} d={`M${x + r * 0.45 * Math.cos(a)} ${y + r * 0.45 * Math.sin(a)} L${x + r * 1.05 * Math.cos(a)} ${y + r * 1.05 * Math.sin(a)}`}
        stroke={c[2]} strokeWidth={1.4} opacity={0.45} strokeDasharray="3 3"/>; })}
  </g>;
};
const Leaf: React.FC<{x: number; y: number; s: number; rot: number}> = ({x, y, s, rot}) =>
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} filter="url(#fibre)">
    <path d="M0 0 C 18 -16, 46 -14, 60 0 C 46 14, 18 16, 0 0 Z" fill="#8FAE7E" stroke="#6E8C5E" strokeWidth={2}/>
    <path d="M4 0 L 56 0" stroke="#6E8C5E" strokeWidth={2}/>
    {[12, 24, 36, 48].map(i => <path key={i} d={`M${i} 0 L ${i + 6} -7 M${i} 0 L ${i + 6} 7`} stroke="#A9C49A" strokeWidth={1.5}/>)}
  </g>;
const ROSES: [string, string, string][] = [['#F2C4CC', '#E29AA8', '#C9707F'], ['#C9D8EE', '#9FB8DD', '#7C97C6'],
  ['#D9C9EC', '#B9A2DA', '#9A7FC4'], ['#FFF1DC', '#F3D9B1', '#E3BF89']];

const Backdrop: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <rect width={1080} height={1920} fill="url(#knitNavy)" filter="url(#fibre)"/>
    <rect width={1080} height={1920} fill="url(#vig)"/>
    <defs><radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity={0}/><stop offset="1" stopColor="#000" stopOpacity={0.45}/></radialGradient>
      <radialGradient id="warm" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#FFD9A0" stopOpacity={0.55}/><stop offset="1" stopColor="#FFD9A0" stopOpacity={0}/></radialGradient></defs>
    {Array.from({length: 26}, (_, i) => {   // yarn stars (little crochet crosses) twinkling
      const x = 60 + random(`sx${i}`) * 960, y = 120 + random(`sy${i}`) * 1250, s = 7 + random(`ss${i}`) * 7;
      const o = 0.45 + 0.45 * Math.sin(t * 1.4 + i);
      return <g key={i} opacity={o} stroke="#F6E7B9" strokeWidth={3.2} strokeLinecap="round">
        <path d={`M${x - s} ${y} L${x + s} ${y} M${x} ${y - s} L${x} ${y + s}`}/></g>;
    })}
    {/* crochet crescent + star on yarn strings, upper left; lantern upper right */}
    <g transform={`rotate(${Math.sin(t * 0.9) * 3} 150 0)`}>
      <line x1={150} y1={0} x2={150} y2={150} stroke="#E8D6A8" strokeWidth={3}/>
      <path d="M150 150 a72 72 0 1 0 60 112 a58 58 0 1 1 -60 -112 Z" fill="url(#knitGold)" stroke="#C99A3A" strokeWidth={3} filter="url(#fibre)"/>
      <line x1={250} y1={0} x2={250} y2={110} stroke="#E8D6A8" strokeWidth={3}/>
      <path d="M250 110 l10 22 24 3 -18 16 5 24 -21 -12 -21 12 5 -24 -18 -16 24 -3 Z" fill="url(#knitGold)" stroke="#C99A3A" strokeWidth={2.5} filter="url(#fibre)"/>
    </g>
    <g transform={`rotate(${Math.sin(t * 0.8 + 1) * 3} 930 0)`}>
      <line x1={930} y1={0} x2={930} y2={120} stroke="#E8D6A8" strokeWidth={3}/>
      <circle cx={930} cy={230} r={150} fill="url(#warm)" opacity={0.75 + 0.25 * Math.sin(t * 2.3)}/>
      <path d="M890 140 L970 140 L985 175 L875 175 Z" fill="url(#knitGold)" filter="url(#fibre)"/>
      <rect x={880} y={175} width={100} height={110} rx={14} fill="#FFE7B0" stroke="#D9A848" strokeWidth={6} filter="url(#fibre)"/>
      {[905, 930, 955].map(x => <line key={x} x1={x} y1={178} x2={x} y2={282} stroke="#D9A848" strokeWidth={4}/>)}
      <path d="M875 285 L985 285 L965 312 L895 312 Z" fill="url(#knitGold)" filter="url(#fibre)"/>
      <path d="M922 312 L938 312 L946 370 L914 370 Z" fill="#E7A7B4"/>
    </g>
    {/* knitted blanket at the bottom with pearls and little roses */}
    <path d="M0 1560 C 200 1530 360 1580 540 1556 C 720 1532 880 1584 1080 1550 L1080 1920 L0 1920 Z" fill="url(#knitPink)" filter="url(#fibre)"/>
    <path d="M0 1700 C 220 1670 400 1720 600 1696 C 800 1672 940 1716 1080 1690 L1080 1920 L0 1920 Z" fill="url(#knitCream)" filter="url(#fibre)"/>
    <path d="M0 1830 C 240 1806 420 1846 640 1826 C 840 1808 960 1838 1080 1820 L1080 1920 L0 1920 Z" fill="url(#knitSage)" filter="url(#fibre)"/>
    {Array.from({length: 22}, (_, i) => { const x = 20 + i * 49, y = 1556 + 14 * Math.sin(i * 0.9);
      return <circle key={i} cx={x} cy={y} r={9} fill="#FFF8EE" stroke="#E2D2BC" strokeWidth={1.5}/>; })}
    <Rose x={70} y={1620} r={50} c={ROSES[0]} rot={10}/><Rose x={1010} y={1610} r={46} c={ROSES[2]} rot={-14}/>
    <Rose x={140} y={1860} r={38} c={ROSES[1]}/><Rose x={950} y={1870} r={40} c={ROSES[0]} rot={20}/>
  </svg>;
};

// The cream knitted panel framed by a crochet flower arch (holds the dhikr, like the reference's framed panel).
const Arch: React.FC = () => {
  const L = 120, R = 960, T = 300, B = 900, rx = (R - L) / 2;
  const d = `M${L} ${B} L${L} ${T + rx * 0.55} A${rx} ${rx * 0.55} 0 0 1 ${R} ${T + rx * 0.55} L${R} ${B} Z`;
  const flowers: [number, number, number, number][] = [];
  for (let i = 0; i <= 16; i++) {   // along the arch outline
    const a = Math.PI + (i / 16) * Math.PI, x = 540 + rx * Math.cos(a), y = T + rx * 0.55 + rx * 0.55 * Math.sin(a);
    flowers.push([x, y, 30 + (i % 3) * 8, i % 4]);
  }
  for (let y = T + rx * 0.55 + 70; y < B; y += 95) { flowers.push([L, y, 32, (y / 95) % 4 | 0]); flowers.push([R, y + 40, 32, ((y / 95) + 2) % 4 | 0]); }
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <path d={d} fill="url(#knitCream)" filter="url(#fibre)" stroke="#D9C2A0" strokeWidth={10}/>
    <path d={d} fill="none" stroke="#FFF7EA" strokeWidth={3} strokeDasharray="8 10" transform="translate(0 0) scale(1)" opacity={0.8}/>
    {flowers.map(([x, y], i) => <Leaf key={`l${i}`} x={x} y={y} s={0.75} rot={(i * 47) % 360}/>)}
    {flowers.map(([x, y, r, c], i) => <Rose key={i} x={x} y={y} r={r} c={ROSES[c]} rot={i * 23}/>)}
    {flowers.map(([x, y], i) => i % 2 ? <circle key={`p${i}`} cx={x + 34} cy={y - 26} r={7} fill="#FFF8EE" stroke="#E2D2BC"/> : null)}
  </svg>;
};

// Yarn-ball bead: knit texture fill, wound-thread arcs, shading; gold crochet dividers and the imam bead with a tassel.
const Ball: React.FC<{x: number; y: number; r: number; kind: 'blue' | 'gold'; glow: number; tassel?: boolean; id: number}> = ({x, y, r, kind, glow, tassel, id}) => {
  const base = kind === 'gold' ? '#E8B94E' : '#8FCFE0', line = kind === 'gold' ? '#C08A2A' : '#5DA8C2', hi = kind === 'gold' ? '#FFE3A0' : '#D6F2F8';
  const rot = (id * 37) % 180;
  return <g>
    {tassel ? <g filter="url(#fibre)">{Array.from({length: 9}, (_, i) =>
      <path key={i} d={`M${x - 4 + i} ${y + r * 0.8} C ${x - 10 + i * 2.5} ${y + r + 40}, ${x - 16 + i * 4} ${y + r + 80}, ${x - 18 + i * 4.5} ${y + r + 120}`}
        stroke={i % 2 ? '#F4D9DE' : '#E9B9C2'} strokeWidth={4} fill="none" strokeLinecap="round"/>)}
      <rect x={x - 12} y={y + r * 0.7} width={24} height={16} rx={6} fill="#E8B94E"/></g> : null}
    {glow > 0 ? <circle cx={x} cy={y} r={r * 1.5} fill={kind === 'gold' ? '#FFD98A' : '#BFEFFF'} opacity={0.35 * glow}/> : null}
    <circle cx={x} cy={y} r={r} fill={base} filter="url(#fibre)"/>
    <g transform={`rotate(${rot} ${x} ${y})`} stroke={line} strokeWidth={2.4} fill="none" opacity={0.9}>
      {[-0.6, -0.3, 0, 0.3, 0.6].map(k => <ellipse key={k} cx={x} cy={y} rx={r * 0.98} ry={Math.abs(k) * r * 0.9 + r * 0.08} transform={`rotate(${k * 60} ${x} ${y})`}/>)}
    </g>
    <g transform={`rotate(${rot + 70} ${x} ${y})`} stroke={hi} strokeWidth={1.6} fill="none" opacity={0.7}>
      {[-0.4, 0.15, 0.55].map(k => <path key={k} d={`M${x - r * 0.9} ${y + k * r} Q ${x} ${y + k * r - r * 0.25} ${x + r * 0.9} ${y + k * r}`}/>)}
    </g>
    <circle cx={x} cy={y} r={r} fill="url(#ballShade)"/>
  </g>;
};

const Beads: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS, c = countAt(t);
  const tk = T0 + (c - 1) * STEP, move = c === 0 ? 1 : ease(interpolate(t, [tk, tk + 0.45], [0, 1], clamp));
  const shift = Math.max(0, c - 1 + move);
  const pop = c === 0 ? 0 : spring({frame: f - Math.round(tk * FPS), fps: FPS, config: {damping: 10, stiffness: 160}});
  const pts: [number, number][] = [], balls: React.ReactNode[] = [];
  for (let k = 0; k <= COUNT + 1; k++) {
    const x = X0 + (k - shift) * S;
    if (x < -90 || x > 1170) continue;
    const y = waveY(x); pts.push([x, y]);
    const imam = k === 0 || k === COUNT + 1, gold = imam || k === 33 || k === 66, near = Math.max(0, 1 - Math.abs(x - 540) / S);
    balls.push(<Ball key={k} id={k} x={x} y={y} r={(imam ? 52 : gold ? 36 : 40) * (1 + 0.3 * near)} kind={gold ? 'gold' : 'blue'} glow={near} tassel={imam}/>);
  }
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#F1E3C6" strokeWidth={5} strokeDasharray="10 4" filter="url(#fibre)"/>
    <circle cx={540} cy={waveY(540)} r={128 * (1 + 0.05 * pop)} fill="none" stroke="#F6E7B9" strokeWidth={4} strokeDasharray="3 9" strokeLinecap="round" opacity={0.75}/>
    {balls}
    {c > 0 && c <= COUNT ? <text x={632} y={waveY(540) - 150 - 30 * ease(interpolate(t, [tk, tk + 0.6], [0, 1], clamp))} fontFamily={SANS} fontWeight={800} fontSize={42}
      fill="#FFE9B8" stroke="#7A5420" strokeWidth={1.5} opacity={interpolate(t, [tk, tk + 0.15, tk + 0.6, tk + 0.8], [0, 1, 1, 0], clamp)}>+1</text> : null}
  </svg>;
};

const Counter: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS, c = countAt(t), done = c >= COUNT;
  const tk = T0 + (c - 1) * STEP, p = c === 0 ? 0 : spring({frame: f - Math.round(tk * FPS), fps: FPS, config: {damping: 11, stiffness: 180}});
  const R = 104, circ = 2 * Math.PI * R, glow = done ? 0.5 + 0.5 * Math.sin((t - tk) * 3) : 0;
  return <div style={{position: 'absolute', left: 540 - 130, top: 1417 - 130, width: 260, height: 260}}>
    <svg width={260} height={260} viewBox="0 0 260 260" style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${6 + 16 * glow}px #FFD98A${done ? 'cc' : '55'})`}}>
      <circle cx={130} cy={130} r={R + 10} fill="url(#knitCream)" filter="url(#fibre)" stroke="#D9C2A0" strokeWidth={4}/>
      <circle cx={130} cy={130} r={R} fill="none" stroke="#E9D9BF" strokeWidth={14}/>
      <circle cx={130} cy={130} r={R} fill="none" stroke="#E7A3B1" strokeWidth={14} strokeDasharray={`${circ * c / COUNT} ${circ}`} transform="rotate(-90 130 130)"
        filter="url(#fibre)"/>
      <circle cx={130} cy={130} r={R} fill="none" stroke="#FFF2F4" strokeWidth={2} strokeDasharray="5 7" opacity={0.8}/></svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 88, lineHeight: 1, color: c ? '#5A3E2B' : '#5A3E2B66', transform: `scale(${1 + 0.12 * p - 0.12 * Math.min(1, p)})`}}>{c}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#8A6E58', marginTop: 4}}>/ 100</div></div>
  </div>;
};

export const KnitReel: React.FC<{cover?: boolean}> = ({cover}) => {
  const f = useCurrentFrame(), t = f / FPS;
  const intro = ease(interpolate(t, [0, 0.8], [0, 1], clamp));
  const tEnd = T0 + (COUNT - 1) * STEP + 0.6, outro = ease(interpolate(t, [tEnd, tEnd + 1.0], [0, 1], clamp));
  return <AbsoluteFill style={{background: '#22344D'}}>
    <Audio src={staticFile('dhikr/bed.wav')}/>
    <Defs/>
    <Backdrop f={f}/>
    <Arch/>
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 20}px)`}}>
      <div dir="rtl" style={{fontFamily: AR, fontWeight: 700, fontSize: 150, lineHeight: 1.25, color: '#7A3B4A', textShadow: '0 2px 0 #ffffff80'}}>أَسْتَغْفِرُ ٱللَّٰهَ</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 4}}>
        <div style={{width: 130, height: 3, background: 'linear-gradient(90deg, #C9A06A00, #C9A06A)'}}/>
        <div style={{width: 14, height: 14, background: '#E7A3B1', transform: 'rotate(45deg)'}}/>
        <div style={{width: 130, height: 3, background: 'linear-gradient(90deg, #C9A06A, #C9A06A00)'}}/></div>
      <div style={{fontFamily: SERIF, fontSize: 64, letterSpacing: 2, color: '#4E3B2E', marginTop: 8}}>Astaghfirullah</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 32, color: '#7C6553', marginTop: 4}}>I seek forgiveness from Allah</div>
    </div>
    <Beads f={f}/>
    <Counter f={f}/>
    {cover ? <div style={{position: 'absolute', top: 1560, left: 70, right: 70, textAlign: 'center', borderRadius: 46,
      padding: '18px 20px 22px', boxShadow: '0 10px 28px #0006'}}>
      <svg width={940} height={190} style={{position: 'absolute', left: 0, top: 0, borderRadius: 46}}><rect width={940} height={190} rx={46} fill="url(#knitPink)" filter="url(#fibre)"/>
        <rect x={10} y={10} width={920} height={170} rx={38} fill="none" stroke="#FFF2F4" strokeWidth={4} strokeDasharray="10 9"/></svg>
      <div style={{position: 'relative', fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 5, color: '#FFFFFF', textShadow: '0 2px 6px #9A4A5A'}}>SAY IT WITH ME</div>
      <div style={{position: 'relative', fontFamily: SERIF, fontSize: 104, lineHeight: 1.05, color: '#FFFFFF', textShadow: '0 3px 10px #9A4A5A'}}>100 times</div>
    </div> : null}
    <div style={{position: 'absolute', top: 1588, left: 120, right: 120, textAlign: 'center', opacity: cover ? 0 : outro, transform: `translateY(${(1 - outro) * 16}px)`,
      background: '#FFF6EAe6', borderRadius: 40, padding: '10px 20px 14px', boxShadow: '0 6px 18px #0004'}}>
      <div dir="rtl" style={{fontFamily: AR, fontWeight: 700, fontSize: 64, color: '#7A3B4A'}}>تَقَبَّلَ ٱللَّٰهُ مِنَّا وَمِنكُمْ</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#5A4636'}}>May Allah accept it from us and from you</div>
    </div>
    <div style={{position: 'absolute', top: 1780, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 6,
      color: '#5A4636'}}>WITHHAMMAD</div>
  </AbsoluteFill>;
};
