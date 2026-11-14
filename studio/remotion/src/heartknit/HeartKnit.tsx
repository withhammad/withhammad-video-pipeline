// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "طَهِّرْ قَلْبَكَ" (reference
// DfsZE5Suibx by @ghafer.20.4, 103.2 s, job 1d798e8340fc) rebuilt in knitted yarn. Same audio and the same structure: 100
// "Astaghfirullah" counts on the reference clock (the counter steps exactly on every whole second, 1 to 100, measured
// frame by frame), one tasbih bead slides off the string on each count, and the blackened heart comes clean bit by bit
// until it is fully red at 100. Knitted: a crocheted anatomical heart under a layer of tangled black wool that comes off
// stitch by stitch (chevron knit cells, from the aorta down, with a few islands that open later), felted beads on a gold
// thread, a crochet doily for the pedestal, a running-stitch mihrab and puffy yarn lettering. Added over the reference:
// the heart beats on the audio's heartbeat (lub at +0.05 s, dub at +0.27 s) and beats harder as it heals, the dropped
// beads bounce on the doily, a warm light fills each freed stitch, the English meaning under both Arabic lines, all text
// above the Reels caption area, and a gold ending with her handle stitched in.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Needle, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {CD, CELLS, CH, CW, SRC_H, SRC_W} from './cells';

export const FPS = 30, DURATION = 103.2;
const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriB, "DecoType Naskh", serif';   // Amiri Bold: clean tashkeel and the shadda + dagger alef on Allah
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n: number) => String(n).split('').map((d) => AR_DIGITS[Number(d)]).join('');

export const TITLE = 'طَهِّرْ قَلْبَكَ';
export const DHIKR = 'أَسْتَغْفِرُ اللّٰهَ';

// layout (1080 x 1920); everything that reads sits between y 230 and 1500
export const HEART = {w: 420, x: 540 - 210, y: 500};
const S = HEART.w / SRC_W;
const DOILY = {cx: 540, cy: 1150, w: 580};
const END_T = 100;

export const countAt = (t: number) => Math.min(100, Math.max(0, Math.floor(t + 1e-6)));
// beads slide one slot per count with a little springy overshoot
const spring = (x: number) => (x <= 0 ? 0 : x > 0.9 ? 1 : 1 - Math.exp(-x * 13) * Math.cos(x * 17));
const smoothCount = (t: number) => { const k = countAt(t); return k === 0 ? 0 : k - 1 + spring(t - k); };
const pulse = (x: number, w = 0.22) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
/** heart scale on the audio's heartbeat; stronger as the heart heals */
export const beatAt = (t: number) => {
  const k = countAt(t);
  if (k < 1 || t > END_T + 0.6) return 0;
  const x = t - k, amp = 0.008 + 0.03 * (k / 100) + (k === 100 ? 0.02 : 0);
  return amp * (pulse(x - 0.04) + 0.6 * pulse(x - 0.26));
};

const CELL_T = CELLS.map(([x, y, k, d]) => ({x, y, k, at: k + d, r: random(`c${x}-${y}`)}));
const chevron = `0,0 ${CW / 2},${CD} ${CW},0 ${CW},${CH} ${CW / 2},${CH + CD} 0,${CH}`;
const chevronPct = `polygon(0% 0%, 50% ${(100 * CD) / (CH + CD)}%, 100% 0%, 100% ${(100 * CH) / (CH + CD)}%, 50% 100%, 0% ${(100 * CH) / (CH + CD)}%)`;

/** Local filters: frayed edges for the wool layer, a soft blur for light. */
export const HeartDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="fray" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={11} result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={9}/></filter>
  </defs>
</svg>;

/** The crocheted heart under its tangled black wool. `pieces` draws the bits that fall off. */
export const Heart: React.FC<{t: number; pieces?: boolean}> = ({t, pieces = true}) => {
  const revealed = CELL_T.filter((c) => t >= c.at);
  const fresh = revealed.filter((c) => t - c.at < 0.8);
  const falling = pieces ? CELL_T.filter((c) => t >= c.at && t - c.at < 1.25) : [];
  const allClean = revealed.length === CELL_T.length;
  return <div style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H}}>
    <Img src={staticFile('parts/heart.png')} style={{position: 'absolute', left: 0, top: 0, width: SRC_W, height: SRC_H}}/>
    {/* warm light fills each freed stitch */}
    <svg width={SRC_W} height={SRC_H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', overflow: 'visible'}}>
      <g filter="url(#soft)">
        {fresh.map((c, n) => <polygon key={n} points={chevron} transform={`translate(${c.x} ${c.y})`} fill="#FFC870"
          opacity={0.75 * Math.pow(1 - (t - c.at) / 0.8, 1.5)}/>)}
      </g>
    </svg>
    {allClean ? null : <svg width={SRC_W} height={SRC_H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <mask id="wool" maskUnits="userSpaceOnUse" x={-40} y={-80} width={SRC_W + 80} height={SRC_H + 160}>
          <rect x={-40} y={-80} width={SRC_W + 80} height={SRC_H + 160} fill="white"/>
          {revealed.map((c, n) => <polygon key={n} points={chevron} transform={`translate(${c.x} ${c.y})`} fill="black" stroke="black"
            strokeWidth={5} strokeLinejoin="round"/>)}
        </mask>
      </defs>
      <g filter="url(#fray)"><g mask="url(#wool)"><image href={staticFile('parts/dark.png')} width={SRC_W} height={SRC_H}/></g></g>
    </svg>}
    {falling.map((c, n) => {
      const tau = t - c.at, r1 = random(`v${c.x}${c.y}`), r2 = random(`w${c.x}${c.y}`);
      const vx = (r1 - 0.5) * 240 + (c.x + CW / 2 - SRC_W / 2) * 0.5, vy = -120 - 140 * r2, g = 2700;
      const dx = vx * tau, dy = vy * tau + 0.5 * g * tau * tau, fallen = Math.max(0, dy);
      // it lifts towards the camera first (bigger, lit rim, long shadow), then drops away and fades
      const lift = Math.sin(Math.PI * c01(tau / 0.5)), o = 1 - c01((fallen - 380) / 650), rot = (r2 - 0.5) * 420 * tau;
      const sc = 1 + 0.32 * c01(tau / 0.18) - 0.2 * c01((tau - 0.3) / 0.9);
      return <div key={n} style={{position: 'absolute', left: c.x, top: c.y, width: CW, height: CH + CD, opacity: o,
        transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${sc})`,
        filter: `url(#fray) brightness(${1.35 + 0.5 * lift}) drop-shadow(0 0 1.5px #9A948B) drop-shadow(0 ${14 + 16 * lift}px 10px #000000cc)`}}>
        <div style={{position: 'absolute', inset: 0, clipPath: chevronPct, backgroundImage: `url(${staticFile('parts/dark.png')})`,
          backgroundSize: `${SRC_W}px ${SRC_H}px`, backgroundPosition: `${-c.x}px ${-c.y}px`}}/>
        {c.r < 0.45 ? <svg width={CW + 40} height={CH + 60} style={{position: 'absolute', left: -20, top: -10, overflow: 'visible'}}>
          <path d={`M ${20 + CW * 0.3} ${CH * 0.6} C ${CW * (0.1 + c.r)} ${CH + 20}, ${CW + 30} ${CH * 0.2}, ${CW * 0.9} ${CH + 44}`}
            stroke="#8A847C" strokeWidth={5} fill="none" strokeLinecap="round" style={{filter: 'url(#yarn)'}}/>
        </svg> : null}
      </div>;
    })}
  </div>;
};

/** Running-stitch mihrab in gold yarn; p = how much is stitched in (0..1). */
export const Arch: React.FC<{p: number; o?: number}> = ({p, o = 1}) => {
  const L = ['M 112 1330 L 112 860 C 112 690, 360 560, 540 470', 'M 968 1330 L 968 860 C 968 690, 720 560, 540 470',
    'M 146 1330 L 146 870 C 146 712, 375 592, 540 506', 'M 934 1330 L 934 870 C 934 712, 705 592, 540 506'];
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    <defs>
      <linearGradient id="archfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stopColor="white"/><stop offset="0.7" stopColor="white" stopOpacity={0}/></linearGradient>
      <mask id="archmask" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
        <rect width={1080} height={1920} fill="url(#archfade)"/>
      </mask>
      <mask id="archdraw" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
        {L.map((d, k) => <path key={k} d={d} pathLength={1} stroke="white" strokeWidth={16} fill="none" strokeDasharray="1 1" strokeDashoffset={1 - p}/>)}
      </mask>
    </defs>
    <g mask="url(#archmask)"><g mask="url(#archdraw)" style={{filter: 'url(#yarn)'}}>
      {L.map((d, k) => <path key={k} d={d} pathLength={1000} stroke={k < 2 ? '#D9AE5C' : '#B98E45'} strokeWidth={k < 2 ? 4.5 : 3.2}
        fill="none" strokeDasharray="11 7" strokeLinecap="round" opacity={k < 2 ? 0.62 : 0.4}/>)}
    </g></g>
  </svg>;
};

// tasbih thread: from the end E (where beads drop) out past the right edge
const SP = 44, BEAD = 42;
const quad = (e: [number, number], c: [number, number], f: [number, number], u: number): [number, number] =>
  [(1 - u) ** 2 * e[0] + 2 * (1 - u) * u * c[0] + u * u * f[0], (1 - u) ** 2 * e[1] + 2 * (1 - u) * u * c[1] + u * u * f[1]];
const threadPts = (e: [number, number]) => {
  const c: [number, number] = [920, e[1] + 22], f: [number, number] = [1150, 430];
  const pts: {x: number; y: number; s: number}[] = []; let s = 0, px = e[0], py = e[1];
  for (let k = 0; k <= 120; k++) { const [x, y] = quad(e, c, f, k / 120); s += Math.hypot(x - px, y - py); pts.push({x, y, s}); px = x; py = y; }
  return pts;
};
const atLen = (pts: {x: number; y: number; s: number}[], s: number) => {
  for (let k = 1; k < pts.length; k++) if (pts[k].s >= s) { const a = pts[k - 1], b = pts[k], u = (s - a.s) / Math.max(1e-6, b.s - a.s);
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u}; }
  return pts[pts.length - 1];
};
const E0: [number, number] = [752, 524];

const Bead: React.FC<{x: number; y: number; i: number; rot: number; o?: number}> = ({x, y, i, rot, o = 1}) =>
  <Img src={staticFile(`parts/bead${(i % 5) + 1}.png`)} style={{position: 'absolute', left: x - BEAD / 2, top: y - BEAD / 2, width: BEAD, height: BEAD,
    opacity: o, transform: `rotate(${rot}deg)`, filter: 'saturate(0.8) hue-rotate(8deg) brightness(0.95) drop-shadow(0 4px 4px #000000aa)'}}/>;

/** Felted tasbih: one bead per count slides off the gold thread, drops, bounces on the doily and rolls away. */
export const Tasbih: React.FC<{t: number; falling?: boolean}> = ({t, falling = true}) => {
  const k = countAt(t), x = t - Math.max(1, k);
  const flick = k >= 1 ? 12 * Math.exp(-x * 5) * Math.sin(x * 15) : 0;
  const e: [number, number] = [E0[0] + 2 * Math.sin(t * 0.9), E0[1] + 3 * Math.sin(t * 1.1) + flick];
  const pts = threadPts(e), cs = smoothCount(t), total = pts[pts.length - 1].s;
  const d = pts.map((p, n) => `${n ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const onString: React.ReactNode[] = [];
  for (let i = Math.max(0, Math.floor(cs)); i < 100; i++) {
    const s = (i - cs) * SP;
    if (s < -0.5) continue; if (s > total + BEAD) break;
    const p = atLen(pts, s); onString.push(<Bead key={i} x={p.x} y={p.y - 2} i={i} rot={i * 37 + s * 0.8}/>);
  }
  const drops: React.ReactNode[] = [];
  if (falling) for (let i = Math.max(0, k - 3); i < k; i++) {
    const tau = t - (i + 1); if (tau < 0) continue;
    const vx = 70 + 30 * random(`bx${i}`), vy0 = -90, g = 2400, floor = DOILY.cy - 8;
    const tLand = (-vy0 + Math.sqrt(vy0 * vy0 + 2 * g * (floor - E0[1]))) / g;
    let bx = E0[0] + vx * tau, by: number, o = 1;
    if (tau < tLand) by = E0[1] + vy0 * tau + 0.5 * g * tau * tau;
    else { const u = tau - tLand, v = 0.36 * (vy0 + g * tLand); by = floor - (v * u - 0.5 * g * u * u); if (by > floor) by = floor;
      bx = E0[0] + vx * tLand + 140 * u; o = 1 - c01((u - 0.25) / 0.35); }
    if (o > 0) drops.push(<Bead key={`f${i}`} x={bx} y={by} i={i} rot={i * 37 + tau * 400} o={o}/>);
  }
  return <>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={d} stroke="#E0B65E" strokeWidth={4} fill="none" strokeLinecap="round" style={{filter: 'url(#yarn) drop-shadow(0 3px 3px #00000099)'}}/>
      {/* frayed thread end */}
      <path d={`M ${e[0]} ${e[1]} l -10 7 M ${e[0]} ${e[1]} l -12 1 M ${e[0]} ${e[1]} l -8 10`} stroke="#E0B65E" strokeWidth={2} fill="none" strokeLinecap="round"/>
    </svg>
    {onString}
    {drops}
  </>;
};

const Motes: React.FC<{f: number; o: number}> = ({f, o}) => <>{Array.from({length: 26}, (_, k) => {
  const life = 260 + random(`ml${k}`) * 200, ph = (f + random(`mp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`mp${k}`) * life) / life);
  const x = 90 + random(`mx${k}-${gen}`) * 900 + Math.sin(u * 5 + k) * 26, y = 1450 - u * 1150, s = 2.5 + random(`ms${k}`) * 4;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7B0',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A55`, opacity: o * Math.sin(Math.PI * u) * (0.35 + 0.3 * Math.sin(f / 9 + k))}}/>;
})}</>;

/** 10 knit stitches, one turns gold for every ten counts (right to left). */
export const StitchRow: React.FC<{t: number; y: number}> = ({t, y}) => {
  const k = countAt(t);
  return <svg width={1080} height={60} style={{position: 'absolute', left: 0, top: y - 30, overflow: 'visible'}}>
    {Array.from({length: 10}, (_, j) => {
      const cx = 540 + (4.5 - j) * 40, done = k >= 10 * (j + 1), part = done ? 1 : j === Math.floor(k / 10) ? (k % 10) / 10 : 0;
      const pop = done ? 1 + 0.35 * pulse(t - 10 * (j + 1), 0.4) : 1;
      const fill = done ? 'url(#stgold)' : '#3E4A44';
      return <g key={j} transform={`translate(${cx} 30) scale(${pop})`} style={{filter: done ? 'url(#yarn) drop-shadow(0 0 6px #FFC64A88)' : 'url(#yarn)'}}>
        <ellipse cx={-6} cy={0} rx={6.5} ry={14} transform="rotate(-28)" fill={fill} stroke={done ? '#F6D27C' : '#7F8C7F'} strokeWidth={1.5}/>
        <ellipse cx={6} cy={0} rx={6.5} ry={14} transform="rotate(28)" fill={fill} stroke={done ? '#F6D27C' : '#7F8C7F'} strokeWidth={1.5}/>
        {part > 0 ? <ellipse cx={-6} cy={0} rx={6.5 * part} ry={14 * part} transform="rotate(-28)" fill="#C9A04A" opacity={0.6}/> : null}
      </g>;
    })}
    <defs><linearGradient id="stgold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0B8"/><stop offset="0.5" stopColor="#E9B347"/><stop offset="1" stopColor="#9C6A1C"/></linearGradient></defs>
  </svg>;
};

export const Handle: React.FC<{t: number; top: number; endP?: number}> = ({t, top, endP = 0}) => {
  const s = 1 + 0.1 * ease(endP);
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', zIndex: 6}}>
    <span style={{display: 'inline-block', position: 'relative', fontFamily: SERIF, fontStyle: 'italic', fontSize: 36, color: '#F6E3BC', letterSpacing: 1,
      paddingBottom: 6, borderBottom: '3px dashed #D9A847', transform: `scale(${s})`,
      textShadow: `0 2px 3px #000000aa, 0 0 ${18 * ease(endP)}px #FFC64A${Math.round(170 * ease(endP)).toString(16).padStart(2, '0')}`}}>
      @heal.ingthroughquran
      {/* gold re-stitch of the underline at the end */}
      <span style={{position: 'absolute', left: 0, bottom: -3, height: 0, width: `${100 * endP}%`, borderBottom: '4px dashed #FFD877',
        filter: 'drop-shadow(0 0 6px #FFC64A)'}}/>
    </span>
  </div>;
};

export const HeartKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const k = countAt(t), prog = k / 100;
  const beat = beatAt(t);
  const bob = 7 * Math.sin(t * 0.85), tilt = 0.7 * Math.sin(t * 0.47);
  const end = ease((t - END_T - 0.05) / 0.9), endHandle = c01((t - 100.35) / 1.0);
  const archP = ease((t - 0.1) / 1.5);
  const push = 1 + 0.03 * (t / DURATION);
  const popN = 1 + 0.22 * pulse(t - k, 0.3) * (k > 0 ? 1 : 0);
  const glowO = 0.12 + 0.42 * prog + 0.35 * end + 2.5 * beat;
  const needleX = 540 - 210 + 420 * endHandle;
  return <AbsoluteFill style={{background: '#0B1716', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <YarnDefs/>
    <HeartDefs/>
    <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 47%'}}>
      <Img src={staticFile('bg.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 55% at 50% 45%, #0B171600 35%, #050B0Bcc 100%)'}}/>
      <Arch p={archP}/>
      <Motes f={f} o={0.6 + 0.4 * prog}/>
      {/* warm light behind the heart grows as it heals */}
      <div style={{position: 'absolute', left: 540 - 520, top: 820 - 560, width: 1040, height: 1120, borderRadius: '50%', mixBlendMode: 'screen',
        opacity: Math.min(1, glowO), background: 'radial-gradient(closest-side, #E0603A88 0%, #C8402A44 40%, #8A2A1A00 100%)'}}/>
      <div style={{position: 'absolute', left: 540 - 600, top: 820 - 600, width: 1200, height: 1200, borderRadius: '50%', mixBlendMode: 'screen',
        opacity: end * (0.75 + 0.15 * Math.sin((t - END_T) * 2)), background: 'radial-gradient(closest-side, #FFE6A8 0%, #FFC2584d 40%, #FF9A2A00 100%)'}}/>
      {/* crochet doily pedestal + the heart's soft shadow on it */}
      <Img src={staticFile('parts/doily.png')} style={{position: 'absolute', left: DOILY.cx - DOILY.w / 2, top: DOILY.cy - 42, width: DOILY.w, height: 84,
        objectFit: 'fill', filter: 'brightness(0.66) drop-shadow(0 8px 10px #000000aa)'}}/>
      <div style={{position: 'absolute', left: DOILY.cx - 210 + 0.6 * bob, top: DOILY.cy - 30, width: 420, height: 52, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #000000aa, #00000000)', transform: `scale(${1 - bob / 140})`}}/>
      {/* the heart */}
      <div style={{position: 'absolute', left: HEART.x, top: HEART.y + bob, width: SRC_W, height: SRC_H, transformOrigin: '0 0',
        transform: `scale(${S}) rotate(${tilt}deg)`}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + beat})`, transformOrigin: '50% 58%',
          filter: `drop-shadow(0 26px 30px #000000bb) brightness(${1 + 1.6 * beat + 0.08 * end})`}}>
          <Heart t={t}/>
        </div>
      </div>
      {/* ending: a ring of gold fluff bursts from the healed heart */}
      {t >= END_T ? Array.from({length: 22}, (_, j) => {
        const a = (j / 22) * Math.PI * 2 + 0.3, d = t - END_T - 0.05, r = ease(d / 1.3) * (360 + 80 * random(`er${j}`));
        const o = Math.max(0, 1 - d / 1.6) * c01(d / 0.1);
        return <div key={j} style={{position: 'absolute', left: 540 + Math.cos(a) * r - 7, top: 830 + Math.sin(a) * r * 0.9 - 7, width: 14, height: 14,
          borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFFBE8, #FFD670 55%, #E0A030)', boxShadow: '0 0 14px 5px #FFC64A99', opacity: o}}/>;
      }) : null}
      <Tasbih t={t}/>
    </AbsoluteFill>

    {/* text: handle, title + meaning, dhikr + meaning, counter, stitch row */}
    <Handle t={t} top={218} endP={endHandle}/>
    {endHandle > 0 && endHandle < 1 ? <Needle x={needleX} y={272} o={interpolate(endHandle, [0, 0.08, 0.9, 1], [0, 1, 1, 0], clamp)}/> : null}
    <div style={{position: 'absolute', left: 0, right: 0, top: 288, textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 104, lineHeight: 1.5, ...gold(t, 0.2), WebkitTextStroke: '1.5px #E7B040', filter: PUFF}}>{TITLE}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, lineHeight: 1, marginTop: 2, color: '#F2DDB0', textShadow: '0 2px 3px #000000aa'}}>
        Purify your heart</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center'}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 88, lineHeight: 1.55, transform: `scale(${1 + 0.6 * beat})`,
        ...(end > 0 ? {...gold(t, 0.4), WebkitTextStroke: '1px #E7B040', filter: `${PUFF} drop-shadow(0 0 ${22 * end}px #FFC64A99)`}
          : {color: '#FBF1DC', WebkitTextStroke: '1px #FBF1DC', filter: `${PUFF} drop-shadow(0 0 ${60 * beat}px #FFD98A)`})}}>{DHIKR}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 31, lineHeight: 1, marginTop: 6, color: '#E6D2A8', textShadow: '0 2px 3px #000000aa'}}>
        Astaghfirullah · I seek Allah’s forgiveness</div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1352, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 22,
      fontFamily: AR, fontSize: 54, lineHeight: 1.3, textShadow: '0 2px 3px #000000aa'}}>
      <span style={{color: '#D9C9A4'}}>{arNum(100)}</span>
      <span style={{color: '#B99A5C', fontSize: 46}}>/</span>
      <span style={{display: 'inline-block', minWidth: 70, textAlign: 'center', transform: `scale(${popN})`,
        ...(k === 100 ? {...gold(t, 0.4), WebkitTextStroke: '1.5px #E7B040'} : {color: '#FFE3A0'}), filter: PUFF}}>{arNum(k)}</span>
    </div>
    <StitchRow t={t} y={1456}/>
  </AbsoluteFill>;
};
