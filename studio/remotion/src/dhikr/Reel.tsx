import React from 'react';
import {AbsoluteFill, interpolate, random, spring, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {loadFont} from '@remotion/fonts';

// Astaghfirullah tasbih counter (job b2c3e829b379), the reference's layout and timing (zyvastudio._, De4Py-1NccM):
// rainy night sky, moon behind clouds, the dhikr in Arabic with its transliteration and meaning, a string of glowing
// beads riding a wave that moves one bead per count, gold dividers after 33 and 66, the imam bead with its tassel at
// both ends, a ring counter 0 -> 100 with a +1 pop, and the closing du'a. Our own drawing, sound bed and handle.
loadFont({family: 'DkAmiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'});
loadFont({family: 'DkAmiri', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '700'});
loadFont({family: 'DkSerif', url: staticFile('fonts/source-serif-4-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'DkInter', url: staticFile('fonts/inter-latin-500-normal.woff2'), weight: '500'});
loadFont({family: 'DkInter', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});

export const FPS = 30;
export const T0 = 1.0, STEP = 0.885, COUNT = 100;            // count k lands at T0 + (k - 1) * STEP seconds
export const END_S = 94.9;
const AR = 'DkAmiri, "Geeza Pro", serif', SERIF = 'DkSerif, Georgia, serif', SANS = 'DkInter, Arial, sans-serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);
export const countAt = (t: number) => Math.max(0, Math.min(COUNT, Math.floor((t - T0) / STEP) + 1));

// Bead string: bead k sits at X0 + (k - c) * S on a fixed sine wave (trough under the counter at x 540).
const S = 94, X0 = 635, WAVE_Y = 1066, AMP = 108;
const waveY = (x: number) => WAVE_Y + AMP * Math.cos(((x - 540) / 1080) * 2 * Math.PI);

const Sky: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  return <AbsoluteFill style={{background: 'linear-gradient(180deg, #0B1A2A 0%, #102538 45%, #133048 70%, #0A1724 100%)'}}>
    {[[120, 260, 520, 0.55], [640, 180, 600, 0.5], [300, 520, 700, 0.35], [820, 470, 520, 0.4]].map(([x, y, w, o], i) =>
      <div key={i} style={{position: 'absolute', left: x - w / 2 + Math.sin(t / 9 + i) * 40, top: y - w / 4, width: w, height: w / 2, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #2A4A66, #2A4A6600)', opacity: o, filter: 'blur(30px)'}}/>)}
    <div style={{position: 'absolute', left: 829 - 150, top: 332 - 150, width: 300, height: 300, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #ffffff40, #ffffff00)'}}/>
    <div style={{position: 'absolute', left: 829 - 60, top: 332 - 60, width: 120, height: 120, borderRadius: '50%',
      background: 'radial-gradient(circle at 40% 38%, #FFFFFF 0%, #E9EEF2 55%, #BFC9D2 100%)', boxShadow: '0 0 60px 20px #ffffff30',
      opacity: 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(t / 7))}}>
      {[[30, 40, 14], [70, 62, 10], [48, 78, 8]].map(([x, y, r], i) =>
        <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: '#C9D2DA80'}}/>)}</div>
    <div style={{position: 'absolute', left: 829 - 260 + Math.sin(t / 6) * 60, top: 330, width: 520, height: 120, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #1E3A55dd, #1E3A5500)', filter: 'blur(14px)'}}/>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <path d="M0 1566 C 180 1530 320 1548 470 1540 C 640 1530 760 1556 900 1544 C 980 1538 1040 1548 1080 1552 L1080 1580 L0 1580 Z" fill="#0A1520" opacity={0.95}/>
      <defs><linearGradient id="wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C3A52"/><stop offset="0.5" stopColor="#14293B"/><stop offset="1" stopColor="#0B1824"/></linearGradient></defs>
      <rect x={0} y={1578} width={1080} height={342} fill="url(#wt)"/>
    </svg>
    {Array.from({length: 40}, (_, i) => {   // ripples on the water
      const life = 40 + random(`rl${i}`) * 30, ph = (f + random(`rp${i}`) * life) % life, k = ph / life;
      const x = random(`rx${i}-${Math.floor((f + random(`rp${i}`) * life) / life)}`) * 1080, y = 1600 + random(`ry${i}-${Math.floor((f + random(`rp${i}`) * life) / life)}`) * 300;
      return <div key={i} style={{position: 'absolute', left: x - 40 * k, top: y - 6 * k, width: 80 * k, height: 12 * k, borderRadius: '50%',
        border: '2px solid #A9CBE0', opacity: 0.6 * (1 - k)}}/>;
    })}
  </AbsoluteFill>;
};

const Rain: React.FC<{f: number}> = ({f}) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
  {Array.from({length: 90}, (_, i) => {
    const sp = 38 + random(`s${i}`) * 22, len = 40 + random(`l${i}`) * 50, cycle = 2100 / sp;
    const ph = (f + random(`p${i}`) * cycle) % cycle, gen = Math.floor((f + random(`p${i}`) * cycle) / cycle);
    const x = random(`x${i}-${gen}`) * 1200 - 60, y = -100 + ph * sp;
    return <line key={i} x1={x} y1={y} x2={x - len * 0.18} y2={y + len} stroke="#B9D3E6" strokeWidth={1.6 + random(`w${i}`) * 1.2}
      opacity={0.18 + random(`o${i}`) * 0.25} strokeLinecap="round"/>;
  })}
</svg>;

const Bead: React.FC<{x: number; y: number; r: number; gold?: boolean; glow?: number; tassel?: boolean}> = ({x, y, r, gold, glow = 0, tassel}) => <>
  {tassel ? <svg width={60} height={130} viewBox="0 0 60 130" style={{position: 'absolute', left: x - 30, top: y + r * 0.6}}>
    <defs><linearGradient id="ts" x1="0" x2="1"><stop offset="0" stopColor="#B8C4CC"/><stop offset="0.5" stopColor="#F4F7F9"/><stop offset="1" stopColor="#9FADB7"/></linearGradient></defs>
    <rect x={24} y={0} width={12} height={22} rx={4} fill="#D9B45A"/><path d="M22 22 L38 22 L52 126 L8 126 Z" fill="url(#ts)"/></svg> : null}
  <div style={{position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
    background: gold ? 'radial-gradient(circle at 35% 30%, #FFF4C8 0%, #F2C24F 35%, #B9831E 80%, #7A5410 100%)'
      : 'radial-gradient(circle at 35% 30%, #E9FDFF 0%, #6FE0F2 30%, #1FA6C9 70%, #0E5F80 100%)',
    boxShadow: `0 4px 10px #00000060, 0 0 ${10 + 30 * glow}px ${4 + 10 * glow}px ${gold ? '#F2C24F' : '#4FD8F0'}${glow ? 'aa' : '44'}`}}/>
</>;

const Beads: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS, c = countAt(t);
  const tk = T0 + (c - 1) * STEP, move = c === 0 ? 1 : ease(interpolate(t, [tk, tk + 0.45], [0, 1], clamp));
  const shift = c - 1 + move;   // continuous: beads slide one spacing per count
  const pop = c === 0 ? 0 : spring({frame: f - Math.round(tk * FPS), fps: FPS, config: {damping: 10, stiffness: 160}});
  const items: React.ReactNode[] = [];
  const string: [number, number][] = [];
  for (let k = 0; k <= COUNT + 1; k++) {
    const x = X0 + (k - Math.max(0, shift)) * S;
    if (x < -80 || x > 1160) continue;
    const y = waveY(x);
    string.push([x, y]);
    const imam = k === 0 || k === COUNT + 1, gold = imam || k === 33 || k === 66;
    const near = Math.max(0, 1 - Math.abs(x - 540) / S);
    const r = (imam ? 52 : gold ? 34 : 38) * (1 + 0.32 * near);
    items.push(<Bead key={k} x={x} y={y} r={r} gold={gold} glow={near} tassel={imam}/>);
  }
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <polyline points={string.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#BFE9F5" strokeWidth={2} opacity={0.6}/></svg>
    <div style={{position: 'absolute', left: 540 - 125, top: waveY(540) - 125, width: 250, height: 250, borderRadius: '50%',
      border: '2px solid #8FD9EE55', background: 'radial-gradient(closest-side, #4FD8F026, #4FD8F000)', transform: `scale(${1 + 0.06 * pop})`}}/>
    {items}
    {c > 0 && c <= COUNT ? <div style={{position: 'absolute', left: 540 + 92, top: waveY(540) - 150 - 30 * ease(interpolate(t, [tk, tk + 0.6], [0, 1], clamp)),
      fontFamily: SANS, fontWeight: 800, fontSize: 40, color: '#CFEFFA', opacity: interpolate(t, [tk, tk + 0.15, tk + 0.6, tk + 0.8], [0, 1, 1, 0], clamp)}}>+1</div> : null}
  </>;
};

const Counter: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS, c = countAt(t), done = c >= COUNT;
  const tk = T0 + (c - 1) * STEP, p = c === 0 ? 0 : spring({frame: f - Math.round(tk * FPS), fps: FPS, config: {damping: 11, stiffness: 180}});
  const R = 104, circ = 2 * Math.PI * R, frac = c / COUNT;
  const glow = done ? 0.6 + 0.4 * Math.sin((t - tk) * 3) : 0;
  return <div style={{position: 'absolute', left: 540 - 130, top: 1417 - 130, width: 260, height: 260}}>
    <svg width={260} height={260} viewBox="0 0 260 260" style={{position: 'absolute', inset: 0, filter: `drop-shadow(0 0 ${8 + 18 * glow}px #6FA8FF${done ? 'cc' : '66'})`}}>
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4FD8F0"/><stop offset="1" stopColor="#9C7BFF"/></linearGradient></defs>
      <circle cx={130} cy={130} r={R} fill="#0B1A2Acc" stroke="#ffffff22" strokeWidth={9}/>
      <circle cx={130} cy={130} r={R} fill="none" stroke="url(#rg)" strokeWidth={9} strokeLinecap="round"
        strokeDasharray={`${circ * frac} ${circ}`} transform="rotate(-90 130 130)"/></svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 92, lineHeight: 1, color: c ? '#fff' : '#ffffff55', transform: `scale(${1 + 0.12 * p - 0.12 * Math.min(1, p)})`}}>{c}</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 28, color: '#ffffff99', marginTop: 6}}>/ 100</div></div>
  </div>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const intro = ease(interpolate(t, [0, 0.8], [0, 1], clamp));
  const tEnd = T0 + (COUNT - 1) * STEP + 0.6, outro = ease(interpolate(t, [tEnd, tEnd + 1.0], [0, 1], clamp));
  return <AbsoluteFill style={{background: '#0B1A2A'}}>
    <Audio src={staticFile('dhikr/bed.wav')}/>
    <Sky f={f}/>
    <div style={{position: 'absolute', top: 450, left: 0, right: 0, textAlign: 'center', opacity: intro, transform: `translateY(${(1 - intro) * 20}px)`}}>
      <div dir="rtl" style={{fontFamily: AR, fontWeight: 700, fontSize: 168, lineHeight: 1.25, color: '#F2F6FA', textShadow: '0 4px 24px #00000080'}}>أَسْتَغْفِرُ ٱللَّٰهَ</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 6}}>
        <div style={{width: 150, height: 2, background: 'linear-gradient(90deg, #ffffff00, #ffffffaa)'}}/>
        <div style={{width: 12, height: 12, background: '#7FD3EA', transform: 'rotate(45deg)'}}/>
        <div style={{width: 150, height: 2, background: 'linear-gradient(90deg, #ffffffaa, #ffffff00)'}}/></div>
      <div style={{fontFamily: SERIF, fontSize: 66, letterSpacing: 2, color: '#E6EEF4', marginTop: 10}}>Astaghfirullah</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 34, color: '#C9D6E0', marginTop: 4}}>I seek forgiveness from Allah</div>
    </div>
    <Beads f={f}/>
    <Rain f={f}/>
    <Counter f={f}/>
    <div style={{position: 'absolute', top: 1592, left: 0, right: 0, textAlign: 'center', opacity: outro, transform: `translateY(${(1 - outro) * 16}px)`}}>
      <div dir="rtl" style={{fontFamily: AR, fontWeight: 700, fontSize: 70, color: '#F2F6FA', textShadow: '0 3px 14px #000a'}}>تَقَبَّلَ ٱللَّٰهُ مِنَّا وَمِنكُمْ</div>
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 30, color: '#D5E1EA', marginTop: 2}}>May Allah accept it from us and from you</div>
    </div>
    <div style={{position: 'absolute', top: 1772, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: '#ffffffc0'}}>WITHHAMMAD</div>
  </AbsoluteFill>;
};
