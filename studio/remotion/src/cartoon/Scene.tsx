import React from 'react';

// The cartoon inside the reel (job 4a606d94c5cd), drawn entirely in SVG code: a felt-and-paper village with a little
// blue elephant. `night` 0..1 relights it (the "make it night" beat), `layers` picks which paper layers to draw (the
// exploded-layer beat renders each layer in its own plane), `t` is seconds for the walk cycle and twinkle.
// Our own drawing: same kind of scene as the reference (felt elephant, village, temple, tree, diyas), no copied art.

export const VB = {w: 1600, h: 900};
const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const STITCH = {strokeDasharray: '10 9', strokeWidth: 3, fill: 'none', strokeLinecap: 'round' as const};

export type Pose = 'walk' | 'wave' | 'trumpet' | 'sit' | 'sleep';
export const Elephant: React.FC<{t: number; pose?: Pose; night?: number; scale?: number; x?: number; y?: number; walking?: boolean}> =
  ({t, pose = 'walk', night = 0, scale = 1, x = 0, y = 0, walking = true}) => {
    const ph = walking ? t * 2 * Math.PI * 1.6 : 0;
    const bob = walking ? Math.abs(Math.sin(ph)) * -6 : 0;
    const body = mix('#8EA6D9', '#5C6FA8', night * 0.7), dark = mix('#6F86BE', '#45558A', night * 0.7);
    const ear = mix('#A8BDEA', '#6E80B8', night * 0.7), pink = mix('#F3A7B5', '#B47A93', night * 0.6);
    const sit = pose === 'sit' || pose === 'sleep';
    const trunkUp = pose === 'wave' || pose === 'trumpet';
    const leg = (lx: number, a: number, back = false) =>
      <g transform={`translate(${lx} 70) rotate(${sit ? (back ? 70 : 0) : Math.sin(ph + a) * 16})`}>
        <rect x={-22} y={-10} width={44} height={sit && back ? 60 : 92} rx={20} fill={back ? dark : body}/>
        <rect x={-22} y={sit && back ? 40 : 72} width={44} height={20} rx={10} fill={mix('#EADCC4', '#9D93A6', night * 0.6)}/>
      </g>;
    return <g transform={`translate(${x} ${y + bob + (sit ? 40 : 0)}) scale(${scale})`}>
      <ellipse cx={0} cy={sit ? 128 : 168} rx={170} ry={18} fill="rgba(40,30,20,.18)"/>
      {leg(-95, Math.PI, true)}{leg(60, 0, true)}
      <path d="M-160 -10 q-40 10 -48 50" stroke={dark} strokeWidth={10} fill="none" strokeLinecap="round"/>
      <circle cx={-208} cy={44} r={9} fill={dark}/>
      <ellipse cx={0} cy={0} rx={165} ry={118} fill={body}/>
      <ellipse cx={0} cy={0} rx={150} ry={104} stroke="rgba(255,255,255,.55)" {...STITCH}/>
      {/* saddle blanket: red felt, gold trim, tassels */}
      <path d="M-100 -100 Q0 -130 100 -100 L110 30 Q0 55 -110 30 Z" fill={mix('#D8473C', '#9C3A45', night * 0.5)}/>
      <path d="M-100 -100 Q0 -130 100 -100 L110 30 Q0 55 -110 30 Z" stroke={mix('#F4C24D', '#C9A048', night * 0.5)} {...STITCH} strokeDasharray="0" strokeWidth={8}/>
      <path d="M-80 -70 Q0 -95 80 -70 L86 8 Q0 30 -86 8 Z" stroke="rgba(255,236,170,.85)" {...STITCH}/>
      {[-90, -45, 0, 45, 90].map((tx) => <g key={tx}><line x1={tx} y1={38} x2={tx} y2={58} stroke="#F4C24D" strokeWidth={4}/><circle cx={tx} cy={62} r={7} fill="#F4C24D"/></g>)}
      <circle cx={0} cy={-38} r={18} fill="#F4C24D"/><circle cx={0} cy={-38} r={8} fill="#2F7DD1"/>
      {leg(-40, Math.PI / 2)}{leg(110, -Math.PI / 2)}
      {/* head */}
      <g transform={`translate(150 -55) rotate(${pose === 'trumpet' ? -12 : 0})`}>
        <path d={trunkUp ? 'M70 10 C120 10 130 -60 165 -95' : `M70 10 C110 40 105 ${110 + Math.sin(ph) * 6} 130 ${130 + Math.sin(ph) * 8}`}
          stroke={body} strokeWidth={42} fill="none" strokeLinecap="round"/>
        <path d={trunkUp ? 'M70 10 C120 10 130 -60 165 -95' : `M70 10 C110 40 105 ${110 + Math.sin(ph) * 6} 130 ${130 + Math.sin(ph) * 8}`}
          stroke="rgba(255,255,255,.45)" {...STITCH}/>
        <circle cx={0} cy={0} r={100} fill={body}/>
        <ellipse cx={-55} cy={-5} rx={70} ry={88} fill={ear} transform={`rotate(${pose === 'wave' ? -18 + Math.sin(t * 9) * 10 : Math.sin(ph) * 4} -20 -40)`}/>
        <ellipse cx={-55} cy={0} rx={44} ry={60} fill={pink} transform={`rotate(${pose === 'wave' ? -18 + Math.sin(t * 9) * 10 : Math.sin(ph) * 4} -20 -40)`}/>
        <ellipse cx={-55} cy={-5} rx={62} ry={80} stroke="rgba(255,255,255,.6)" {...STITCH} transform={`rotate(${Math.sin(ph) * 4} -20 -40)`}/>
        {pose === 'sleep' || (Math.floor(t * 10) % 37 === 0)
          ? <path d="M30 -28 q14 10 28 0" stroke="#1E2240" strokeWidth={6} fill="none" strokeLinecap="round"/>
          : <g><circle cx={44} cy={-28} r={14} fill="#1E2240"/><circle cx={49} cy={-33} r={5} fill="#fff"/></g>}
        <ellipse cx={60} cy={8} rx={14} ry={9} fill={pink} opacity={0.8}/>
        {pose !== 'sleep' && <path d="M58 40 q22 6 30 -8" stroke="#F7F1E3" strokeWidth={9} fill="none" strokeLinecap="round"/>}
      </g>
      {pose === 'sleep' && <text x={240} y={-170} fontFamily="CtFredoka" fontSize={60} fill={mix('#3D4A7A', '#E8ECFF', night)}>z z</text>}
      {pose === 'trumpet' && [0, 1, 2].map((k) => <path key={k} d={`M${330 + k * 26} ${-190 - k * 14} l18 -10`} stroke="#F4C24D" strokeWidth={7} strokeLinecap="round"/>)}
    </g>;
  };

const Hut: React.FC<{x: number; y: number; s?: number; night: number; wall: string; roof: string}> = ({x, y, s = 1, night, wall, roof}) =>
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-60} y={-70} width={120} height={80} rx={6} fill={mix(wall, '#6B5E7A', night * 0.6)}/>
    <rect x={-14} y={-40} width={28} height={50} rx={10} fill={mix('#7A4E2C', '#3A2A30', night * 0.5)}/>
    <rect x={-48} y={-50} width={22} height={20} rx={4} fill={mix('#6B4A2E', '#FFD27A', night)}/>
    <path d="M-80 -66 L0 -130 L80 -66 Z" fill={mix(roof, '#5B4655', night * 0.6)}/>
    <path d="M-62 -76 L0 -124 L62 -76" stroke="rgba(255,240,200,.55)" {...STITCH}/>
    <rect x={-60} y={-70} width={120} height={80} rx={6} stroke="rgba(255,255,255,.35)" {...STITCH}/>
  </g>;

const Temple: React.FC<{x: number; y: number; night: number; t: number}> = ({x, y, night, t}) => {
  const c = mix('#F0D7A6', '#8C7C93', night * 0.6), c2 = mix('#E3BE7E', '#77677E', night * 0.6);
  return <g transform={`translate(${x} ${y})`}>
    <rect x={-80} y={-90} width={160} height={90} fill={c2}/>
    <path d="M-60 -90 Q-50 -260 0 -300 Q50 -260 60 -90 Z" fill={c}/>
    {[-140, -190, -235].map((yy, i) => <line key={yy} x1={-50 + i * 10} y1={yy} x2={50 - i * 10} y2={yy} stroke="rgba(150,100,60,.5)" strokeWidth={5}/>)}
    <path d="M-60 -90 Q-50 -260 0 -300 Q50 -260 60 -90" stroke="rgba(255,255,255,.55)" {...STITCH}/>
    <rect x={-22} y={-60} width={44} height={60} rx={20} fill={mix('#8A5A34', '#FFC86B', night)}/>
    <line x1={0} y1={-300} x2={0} y2={-350} stroke="#7A4E2C" strokeWidth={5}/>
    <path d={`M0 -350 L${44 + Math.sin(t * 5) * 6} ${-338 + Math.cos(t * 5) * 3} L0 -326 Z`} fill="#F07A2A"/>
  </g>;
};

const Tree: React.FC<{x: number; y: number; night: number; t: number}> = ({x, y, night, t}) => {
  const g1 = mix('#6FA85A', '#2F4F4E', night * 0.75), g2 = mix('#86BE6C', '#3B5F5A', night * 0.75);
  const sway = Math.sin(t * 1.4) * 2;
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-16 0 L-10 -170 L10 -170 L16 0 Z" fill={mix('#8A5A34', '#4A3434', night * 0.6)}/>
    <g transform={`rotate(${sway} 0 -170)`}>
      <circle cx={-70} cy={-210} r={80} fill={g1}/><circle cx={60} cy={-220} r={85} fill={g1}/><circle cx={0} cy={-290} r={95} fill={g2}/>
      <circle cx={0} cy={-290} r={80} stroke="rgba(255,255,255,.4)" {...STITCH}/>
      <circle cx={60} cy={-220} r={70} stroke="rgba(255,255,255,.35)" {...STITCH}/>
    </g>
  </g>;
};

const Diya: React.FC<{x: number; y: number; night: number; t: number; k: number}> = ({x, y, night, t, k}) =>
  <g transform={`translate(${x} ${y})`}>
    {night > 0.05 && <circle cx={0} cy={-24} r={46} fill="#FFC861" opacity={0.35 * night * (0.85 + 0.15 * Math.sin(t * 9 + k))}/>}
    <path d="M-26 -6 Q0 22 26 -6 Z" fill="#C2622D"/>
    <path d={`M0 -8 Q${-9 + Math.sin(t * 11 + k) * 2} -26 0 -40 Q9 -26 0 -8 Z`} fill="#FFB43A"/>
  </g>;

// Layer ids: 0 sky, 1 hills, 2 village, 3 foreground (path, elephant, diyas)
export const Scene: React.FC<{t: number; night?: number; layers?: number[]; pose?: Pose; walking?: boolean; ex?: number; id?: string}> =
  ({t, night = 0, layers = [0, 1, 2, 3], pose = 'walk', walking = true, ex, id = 'a'}) => {
    const has = (n: number) => layers.includes(n);
    const skyTop = mix('#BFE0F0', '#141B44', night), skyBot = mix('#F8E2BE', '#4A3F7E', night);
    const exX = ex ?? (VB.w * 0.55 + Math.sin(t * 0.5) * 60);
    return <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width="100%" height="100%" style={{display: 'block'}}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={skyTop}/><stop offset="1" stopColor={skyBot}/></linearGradient>
        <filter id={`grain${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4}/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.10 0"/></filter>
        <filter id={`soft${id}`}><feDropShadow dx="0" dy="6" stdDeviation="5" floodOpacity="0.22"/></filter>
      </defs>
      {has(0) && <g>
        <rect width={VB.w} height={VB.h} fill={`url(#sky${id})`}/>
        <g opacity={1 - night}><circle cx={1250} cy={150} r={70} fill="#FFCF4A"/><circle cx={1250} cy={150} r={92} fill="#FFCF4A" opacity={0.25}/></g>
        <g opacity={night}>
          <circle cx={300} cy={140} r={58} fill="#FFF3C8"/><circle cx={325} cy={125} r={52} fill={skyTop}/>
          {Array.from({length: 26}, (_, i) => {
            const sx = (i * 397) % VB.w, sy = 40 + ((i * 211) % 300), tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
            return <path key={i} transform={`translate(${sx} ${sy}) scale(${0.6 + tw * 0.5})`} d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill="#FFE9A8" opacity={0.6 + 0.4 * tw}/>;
          })}
          <g transform={`translate(1180 170) rotate(${t * 40})`}><path d="M0 -34 L9 -9 L34 0 L9 9 L0 34 L-9 9 L-34 0 L-9 -9 Z" fill="#FFD95A"/></g>
          <circle cx={1180} cy={170} r={60} fill="#FFD95A" opacity={0.25 + 0.1 * Math.sin(t * 4)}/>
        </g>
        {[[200 + t * 12, 230], [900 + t * 8, 120], [1400 + t * 10, 280]].map(([cx, cy], i) => {
          const xx = ((cx % 1900) + 1900) % 1900 - 150;
          return <g key={i} transform={`translate(${xx} ${cy})`} opacity={1 - night * 0.7}>
            <ellipse cx={0} cy={0} rx={70} ry={26} fill="#fff"/><circle cx={-20} cy={-18} r={28} fill="#fff"/><circle cx={22} cy={-12} r={22} fill="#fff"/>
            <ellipse cx={0} cy={-4} rx={60} ry={20} stroke="rgba(180,190,210,.8)" {...STITCH} strokeWidth={2.5}/></g>;
        })}
      </g>}
      {has(1) && <g filter={`url(#soft${id})`}>
        <path d="M0 520 C200 420 380 470 560 430 C760 380 960 470 1160 420 C1340 380 1480 440 1600 420 L1600 900 L0 900 Z" fill={mix('#BFD3A0', '#3F4E62', night * 0.8)}/>
        <path d="M0 520 C200 420 380 470 560 430 C760 380 960 470 1160 420 C1340 380 1480 440 1600 420" stroke="rgba(255,255,255,.5)" {...STITCH}/>
        <path d="M0 590 C240 520 430 560 650 530 C900 495 1100 560 1320 525 C1450 505 1540 520 1600 515 L1600 900 L0 900 Z" fill={mix('#9FC17E', '#344A4F', night * 0.8)}/>
      </g>}
      {has(2) && <g filter={`url(#soft${id})`}>
        <Hut x={170} y={600} s={0.95} night={night} wall="#E8C796" roof="#B4743E"/>
        <Hut x={360} y={590} s={0.8} night={night} wall="#DDB383" roof="#9C6334"/>
        <Temple x={760} y={600} night={night} t={t}/>
        <Hut x={560} y={600} s={0.9} night={night} wall="#EBCFA0" roof="#B4743E"/>
        <Hut x={1030} y={605} s={0.85} night={night} wall="#E2BC8B" roof="#A86A38"/>
        <Tree x={1360} y={640} night={night} t={t}/>
      </g>}
      {has(3) && <g>
        <path d="M0 640 C400 610 1200 610 1600 640 L1600 900 L0 900 Z" fill={mix('#B9CF8E', '#2F4148', night * 0.8)}/>
        <path d="M0 720 C400 690 1200 690 1600 720 L1600 800 C1200 770 400 770 0 800 Z" fill={mix('#EAD7AE', '#6E6577', night * 0.7)}/>
        <path d="M0 760 C400 730 1200 730 1600 760" stroke={mix('#C9A774', '#9A8DA8', night)} {...STITCH}/>
        <g filter={`url(#soft${id})`}><Elephant t={t} pose={pose} night={night} scale={0.74} x={exX} y={650} walking={walking}/></g>
        {[[120, 850], [480, 860], [1120, 862], [1480, 850]].map(([dx, dy], k) => <Diya key={k} x={dx} y={dy} night={night} t={t} k={k}/>)}
        {[[260, 690], [1250, 700], [700, 880]].map(([fx, fy], k) => <g key={k} transform={`translate(${fx} ${fy})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-10} rx={7} ry={12} fill={k % 2 ? '#F49AB0' : '#FFD45A'} transform={`rotate(${a})`}/>)}
          <circle r={6} fill="#E77A2E"/></g>)}
      </g>}
      {has(0) && has(3) && <rect width={VB.w} height={VB.h} filter={`url(#grain${id})`} opacity={0.9}/>}
    </svg>;
  };
