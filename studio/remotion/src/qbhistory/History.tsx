// PRIVATE (owner's Islamic account "Quran Beat"; never posted from the business accounts): the "Great history" reel
// (reference DdCATZoihlm by @1simli, job 74b41f76e079, 16.4 s, 1440x1080 B&W film montage over the "Haydara" chant)
// rebuilt in the reference's own look: black-and-white 1950s-epic film stills with grain, flicker and gate weave, hard
// cuts on the drum.
// RED LINES kept: no prophet is shown in any form (the reference showed Musa, Ibrahim and Yunus, AS, and the builders
// of the Ka'bah). Every story is told through the sea, the ark, the fire, the stones, the whale and the gourd vine, and
// the serpent; crowds and magicians only from behind or far off. The owner appears as the modern viewer in the opening
// shot (before the chant starts, so the chant's first-person lines never play over his face) and in the creator chip.
// Audio: the reference's own track, untouched (gain only; mastered after the render).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';

export const FPS = 30, FRAMES = 492; // 16.4 s; the reference is 16.417 s
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
export const SERIF = '"QBSerif", "Source Serif 4", Georgia, serif', SANS = '"QBSans", Inter, Helvetica, sans-serif';

// Cuts sit on the kick drum (0.305 s + n x 0.5145 s, measured on the reference), at the frame holding the onset.
// Lines of the chant (Whisper on the reference): L1 2.30-5.40, L2 5.90-9.40, L3 9.95-12.62, L4 12.94-16.10.
// The cuts at 5.43, 9.53 and 12.63 fall in the breaths between lines.
type Fx = 'spray' | 'rain' | 'embers' | 'dust' | 'mist' | 'none';
export type Shot = {src: string; from: number; to: number; z0: number; z1: number; ox: number; oy: number;
  x0?: number; x1?: number; y0?: number; y1?: number; sway?: number; fx: Fx; punch?: number; fog?: boolean; focus?: boolean};
export const SHOTS: Shot[] = [
  {src: 'shots/s00-him.jpg', from: 0, to: 70, z0: 1.02, z1: 1.13, ox: 50, oy: 36, y0: 0, y1: -14, fx: 'mist', punch: 0},
  {src: 'shots/s01-split.jpg', from: 70, to: 101, z0: 1.02, z1: 1.12, ox: 50, oy: 45, fx: 'spray', punch: 0.07},
  {src: 'shots/s02-ark.jpg', from: 101, to: 132, z0: 1.10, z1: 1.16, ox: 50, oy: 50, sway: 1.6, fx: 'rain'},
  {src: 'shots/s03-path.jpg', from: 132, to: 163, z0: 1.02, z1: 1.14, ox: 50, oy: 42, fx: 'mist'},
  {src: 'shots/s04-fire.jpg', from: 163, to: 194, z0: 1.04, z1: 1.12, ox: 50, oy: 50, fx: 'embers'},
  {src: 'shots/s05-kaaba.jpg', from: 194, to: 224, z0: 1.12, z1: 1.04, ox: 50, oy: 50, fx: 'dust'},
  {src: 'shots/s06-whale.jpg', from: 224, to: 271, z0: 1.06, z1: 1.12, ox: 50, oy: 50, x0: 18, x1: -18, fx: 'mist'},
  {src: 'shots/s07-ropes.jpg', from: 271, to: 286, z0: 1.05, z1: 1.10, ox: 50, oy: 60, fx: 'dust', punch: 0.06},
  {src: 'shots/s08-arkfog.jpg', from: 286, to: 348, z0: 1.08, z1: 1.16, ox: 50, oy: 50, sway: 1.2, fx: 'rain', fog: true, punch: 0},
  {src: 'shots/s09-gourd.jpg', from: 348, to: 379, z0: 1.05, z1: 1.12, ox: 50, oy: 60, fx: 'mist', focus: true},
  {src: 'shots/s10-coil.jpg', from: 379, to: 440, z0: 1.04, z1: 1.14, ox: 50, oy: 58, fx: 'dust'},
  {src: 'shots/s11-rise.jpg', from: 440, to: FRAMES, z0: 1.06, z1: 1.14, ox: 50, oy: 50, y0: 14, y1: -10, fx: 'dust', punch: 0.05},
];

// one deterministic value per frame (and channel) in -1..1
const n1 = (k: string, f: number) => random(`${k}-${f}`) * 2 - 1;

const Particles: React.FC<{fx: Fx; f: number; seed: string}> = ({fx, f, seed}) => {
  if (fx === 'none') return null;
  const N = fx === 'rain' ? 70 : fx === 'embers' ? 46 : fx === 'spray' ? 26 : fx === 'dust' ? 34 : 22;
  return <>{Array.from({length: N}, (_, k) => {
    const r = (s: string) => random(`${seed}${fx}${k}${s}`);
    if (fx === 'rain') { // fast slanted streaks
      const life = 9 + r('l') * 6, u = ((f + r('p') * life) % life) / life;
      const x = r('x') * 1300 - 120 + u * 120, y = -200 + u * 2300;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: 2, height: 90 + r('h') * 70, background: '#FFFFFF',
        opacity: 0.18 + r('o') * 0.18, transform: 'rotate(14deg)', borderRadius: 2}}/>;
    }
    if (fx === 'embers') { // sparks rising and flickering
      const life = 34 + r('l') * 30, ph = (f + r('p') * life) % life, u = ph / life;
      const x = 160 + r('x') * 760 + Math.sin(u * 6 + k) * 30, y = 1500 - u * 1400, s = 3 + r('s') * 5;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFFFFF',
        boxShadow: `0 0 ${4 * s}px ${s}px #FFFFFFaa`, opacity: Math.sin(Math.PI * u) * (0.55 + 0.45 * Math.sin(f / 2 + k))}}/>;
    }
    if (fx === 'spray') { // wind-blown sea spray, right to left
      const life = 26 + r('l') * 22, u = ((f + r('p') * life) % life) / life;
      const x = 1180 - u * 1400, y = 300 + r('y') * 1100 + Math.sin(u * 5 + k) * 40, s = 10 + r('s') * 22;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s * 4, height: s, borderRadius: '50%',
        background: 'radial-gradient(closest-side, #FFFFFFaa, #FFFFFF00)', filter: 'blur(3px)', opacity: Math.sin(Math.PI * u) * (0.2 + r('o') * 0.3)}}/>;
    }
    if (fx === 'dust') { // slow drifting motes in the light
      const life = 90 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
      const x = r('x') * 1080 + u * 160 - 80, y = 250 + r('y') * 1500 - u * 120, s = 2 + r('s') * 4;
      return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFFFFF',
        boxShadow: `0 0 ${3 * s}px #FFFFFF88`, opacity: Math.sin(Math.PI * u) * (0.3 + r('o') * 0.35)}}/>;
    }
    // mist: big soft drifting blobs
    const life = 140 + r('l') * 80, u = ((f + r('p') * life) % life) / life;
    const x = -300 + r('x') * 1200 + u * 260, y = 400 + r('y') * 1300, s = 260 + r('s') * 300;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s * 1.8, height: s, borderRadius: '50%',
      background: 'radial-gradient(closest-side, #FFFFFF44, #FFFFFF00)', opacity: Math.sin(Math.PI * u) * 0.38}}/>;
  })}</>;
};

const Picture: React.FC<{s: Shot; f: number}> = ({s, f}) => {
  const k = f - s.from, len = s.to - s.from, u = k / len;
  const z = s.z0 + (s.z1 - s.z0) * u, x = (s.x0 ?? 0) + ((s.x1 ?? 0) - (s.x0 ?? 0)) * u, y = (s.y0 ?? 0) + ((s.y1 ?? 0) - (s.y0 ?? 0)) * u;
  // a short punch on the cut (lands with the kick), and a decaying shake on the drop
  const punch = 1 + (s.punch ?? 0.035) * Math.exp(-k / 3.5);
  const shake = s.from === 70 ? 12 * Math.exp(-k / 6) : (s.punch ?? 0) > 0.05 ? 5 * Math.exp(-k / 5) : 0;
  const sx = shake * n1('sx', f), sy = shake * n1('sy', f);
  const rot = (s.sway ?? 0) * Math.sin(f / 9), bob = (s.sway ?? 0) * 9 * Math.sin(f / 11 + 1);
  const blur = s.focus ? interpolate(k, [0, 12], [7, 0], clamp) : 0;
  return <AbsoluteFill>
    <Img src={staticFile(s.src)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, objectFit: 'cover',
      transform: `translate(${x + sx}px, ${y + sy + bob}px) scale(${z * punch}) rotate(${rot}deg)`, transformOrigin: `${s.ox}% ${s.oy}%`,
      filter: `grayscale(1) contrast(1.14)${blur ? ` blur(${blur}px)` : ''}`}}/>
    {s.fog ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 120% 90% at 50% 55%, #EDEDED 30%, #D8D8D8 100%)',
      opacity: interpolate(k, [0, 20], [0.7, 0], clamp)}}/> : null}
    <Particles fx={s.fx} f={f} seed={s.src}/>
  </AbsoluteFill>;
};

// static film grain tile (SVG turbulence) shifted to a new random offset every frame
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="300" height="300" filter="url(#n)"/></svg>')}")`;

const FilmLook: React.FC<{f: number}> = ({f}) => {
  const specks = Array.from({length: 7}, (_, k) => {
    if (random(`sp${k}-${f}`) > 0.45) return null;
    const x = random(`spx${k}-${f}`) * 1080, y = random(`spy${k}-${f}`) * 1920, s = 2 + random(`sps${k}-${f}`) * 5;
    return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s * (0.6 + random(`spa${k}-${f}`)),
      borderRadius: '50%', background: random(`spc${k}-${f}`) > 0.5 ? '#000000' : '#FFFFFF', opacity: 0.55}}/>;
  });
  const scratch = random(`scr-${Math.floor(f / 3)}`) > 0.8;
  return <>
    <AbsoluteFill style={{backgroundImage: GRAIN, backgroundPosition: `${Math.floor(random(`gx${f}`) * 300)}px ${Math.floor(random(`gy${f}`) * 300)}px`,
      mixBlendMode: 'overlay', opacity: 0.5}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 72% at 50% 50%, #00000000 45%, #000000b8 100%)'}}/>
    <AbsoluteFill style={{background: '#000', opacity: 0.025 + 0.025 * (n1('fl', f) + 1) / 2}}/>
    {specks}
    {scratch ? <div style={{position: 'absolute', left: 120 + random(`scx-${Math.floor(f / 3)}`) * 840, top: 0, width: 1.5, height: 1920,
      background: '#FFFFFF', opacity: 0.18}}/> : null}
  </>;
};

// the creator chip: his real face and the account name, where the reference's frame carries nothing
export const Chip: React.FC<{opacity?: number}> = ({opacity = 1}) => <div style={{position: 'absolute', left: 46, top: 238, height: 76,
  display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px 0 6px', borderRadius: 40, background: '#0000005c',
  border: '1.5px solid #FFFFFF40', opacity}}>
  <Img src={staticFile('face-chip.jpg')} style={{width: 64, height: 64, borderRadius: 32, border: '2px solid #FFFFFFd0', objectFit: 'cover'}}/>
  <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 31, color: '#FFFFFF', letterSpacing: 0.3, textShadow: '0 1px 3px #000000aa'}}>Quran Beat</div>
</div>;

const BigLines: React.FC<{lines: string[]; top: number; size: number; o: number; dy: number; blur: number}> = ({lines, top, size, o, dy, blur}) =>
  <div style={{position: 'absolute', left: 90, width: 860, top, textAlign: 'center', opacity: o, transform: `translateY(${dy}px)`,
    filter: blur ? `blur(${blur}px)` : undefined}}>
    {lines.map((l, k) => <div key={k} style={{fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.12, letterSpacing: '0.035em',
      color: '#F5F2EA', textShadow: '0 3px 8px #000000e0, 0 0 34px #000000b0', whiteSpace: 'nowrap'}}>{l}</div>)}
  </div>;

export const HOOK = ['QURAN STORIES', 'THAT GIVE CHILLS'];
export const END = ['EVERY STORY HERE', 'IS IN THE QURAN'];
export const REFS = '26:63 · 11:42 · 21:69 · 2:127 · 37:145 · 20:70';

export const History: React.FC = () => {
  const f = useCurrentFrame();
  const shot = SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
  const weave = {x: 1.2 * n1('wx', Math.floor(f / 2)), y: 1.6 * n1('wy', Math.floor(f / 2))};
  // hook: sharp on frame 0, out with the drop
  const hookO = interpolate(f, [62, 70], [1, 0], clamp);
  // end card: in on the breath before the last line (frame 379), held to the last frame
  const e = ease((f - 379) / 9), eRef = ease((f - 388) / 9), ePill = ease((f - 396) / 9);
  return <AbsoluteFill style={{background: '#050505', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <AbsoluteFill style={{transform: `translate(${weave.x}px, ${weave.y}px)`}}>
      <Picture s={shot} f={f}/>
    </AbsoluteFill>
    <FilmLook f={f}/>
    {/* soft dark bands behind the text so it reads on bright sky and spray */}
    {f < 70 ? <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 12% at 50% 1250px, #000000a0 0%, #00000000 100%)', opacity: hookO}}/> : null}
    {f >= 379 ? <AbsoluteFill style={{background: 'linear-gradient(180deg, #000000b0 0%, #00000070 26%, #00000000 40%, #00000000 62%, #00000090 78%, #00000000 92%)', opacity: e}}/> : null}
    <Chip/>
    {f < 70 ? <BigLines lines={HOOK} top={1160} size={80} o={hookO} dy={0} blur={0}/> : null}
    {f >= 379 ? <>
      <BigLines lines={END} top={330} size={78} o={e} dy={(1 - e) * 16} blur={(1 - e) * 6}/>
      <div style={{position: 'absolute', left: 130, width: 780, top: 1300, textAlign: 'center', opacity: eRef, fontFamily: SANS, fontWeight: 600,
        fontSize: 32, letterSpacing: 1.5, color: '#E9E5DC', textShadow: '0 2px 6px #000000e0'}}>{REFS}</div>
      <div style={{position: 'absolute', left: 0, width: 1040, top: 1372, display: 'flex', justifyContent: 'center', opacity: ePill,
        transform: `translateY(${(1 - ePill) * 12}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 34px 14px 14px', borderRadius: 44, background: '#F5F2EA',
          boxShadow: '0 6px 24px #000000a0'}}>
          <Img src={staticFile('face-chip.jpg')} style={{width: 58, height: 58, borderRadius: 29, objectFit: 'cover'}}/>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 1.2, color: '#0B0B0B'}}>FOLLOW QURAN BEAT</div>
        </div>
      </div>
    </> : null}
  </AbsoluteFill>;
};
