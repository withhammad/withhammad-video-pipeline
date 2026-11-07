import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Audio, Composition, Img, interpolate, registerRoot, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Private gift v2 (owner 2026-11-07: "it should be moving"): every knitted piece is its own layer and animates —
// the lace arch builds in, flowers bloom and sway, the moon and star swing, bows flutter, wool fluff floats, and a
// needle stitches each of the 26 Names on its recited beat.
//   npx remotion render src/gift/live.tsx KnitNamesLive out.mp4

loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'});
const FPS = 30;
const START = [0.5, 3.1, 5.7, 8.1, 10.6, 13.1, 15.5, 18.0, 20.5, 22.9, 25.4, 27.9, 30.3, 32.8, 35.3, 37.7, 40.2, 42.7,
  45.1, 47.6, 50.1, 52.5, 55.0, 57.5, 59.9, 62.4];
const NAMES: [string, string][] = [
  ['الرَّحْمَنُ', 'Ar-Rahman'], ['الرَّحِيمُ', 'Ar-Rahim'], ['الْمَلِكُ', 'Al-Malik'], ['الْقُدُّوسُ', 'Al-Quddus'],
  ['السَّلَامُ', 'As-Salam'], ['الْمُؤْمِنُ', "Al-Mu'min"], ['الْمُهَيْمِنُ', 'Al-Muhaymin'], ['الْعَزِيزُ', 'Al-Aziz'],
  ['الْجَبَّارُ', 'Al-Jabbar'], ['الْمُتَكَبِّرُ', 'Al-Mutakabbir'], ['الْخَالِقُ', 'Al-Khaliq'], ['الْبَارِئُ', "Al-Bari'"],
  ['الْمُصَوِّرُ', 'Al-Musawwir'], ['الْغَفَّارُ', 'Al-Ghaffar'], ['الْقَهَّارُ', 'Al-Qahhar'], ['الْوَهَّابُ', 'Al-Wahhab'],
  ['الرَّزَّاقُ', 'Ar-Razzaq'], ['الْفَتَّاحُ', 'Al-Fattah'], ['الْعَلِيمُ', 'Al-Alim'], ['الْقَابِضُ', 'Al-Qabid'],
  ['الْبَاسِطُ', 'Al-Basit'], ['الْخَافِضُ', 'Al-Khafid'], ['الرَّافِعُ', "Ar-Rafi'"], ['الْمُعِزُّ', "Al-Mu'izz"],
  ['الْمُذِلُّ', 'Al-Mudhill'], ['السَّمِيعُ', "As-Sami'"],
];
const THREADS = [['#5E77A8', '#8AA2CE', '#465D8C'], ['#9A7BB8', '#BFA3D8', '#7A5E9C']];
const P = (n: string) => staticFile(`gift/parts/${n}.png`);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// A knitted piece: blooms in on its cue with a spring, then sways and breathes around its anchor forever.
const Piece: React.FC<{src: string; x: number; y: number; w: number; at: number; sway?: number; flip?: boolean;
  anchor?: string; phase?: number; swing?: boolean}> = ({src, x, y, w, at, sway = 3, flip, anchor = '50% 50%', phase = 0, swing}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const pop = spring({frame: f - at * fps, fps, config: {damping: 11, stiffness: 90, mass: 0.8}});
  const t = f / fps + phase;
  const rot = swing ? Math.sin(t * 1.3) * sway * 2.2 : Math.sin(t * 0.9) * sway + (1 - pop) * (flip ? 40 : -40);
  const breathe = 1 + Math.sin(t * 1.7) * 0.025;
  return <Img src={src} style={{position: 'absolute', left: x - w / 2, top: y, width: w, transformOrigin: anchor,
    transform: `scale(${(flip ? -1 : 1) * pop * breathe}, ${pop * breathe}) rotate(${rot}deg)`, opacity: Math.min(1, pop * 1.4),
    filter: 'drop-shadow(0 10px 8px rgba(30,30,60,.35))'}}/>;
};

const Fluff: React.FC = () => {
  const f = useCurrentFrame();
  return <>{Array.from({length: 22}, (_, k) => {
    const sp = 0.6 + (k % 5) * 0.25, x = (k * 197) % 1080, y = 1920 - ((f * sp + k * 131) % 2100);
    const sz = 6 + (k % 4) * 4;
    return <div key={k} style={{position: 'absolute', left: x + Math.sin(f / 30 + k) * 30, top: y, width: sz, height: sz,
      borderRadius: '50%', background: k % 3 ? 'rgba(255,248,235,.85)' : 'rgba(214,190,235,.85)', filter: 'blur(1.5px)'}}/>;
  })}</>;
};

const LIGHTS: [number, number][] = [[300, 470], [540, 360], [780, 470], [190, 760], [890, 760], [170, 1100], [910, 1100],
  [330, 1380], [750, 1380], [540, 1470], [250, 600], [830, 600], [150, 930], [930, 930]];

// The needle: a silver needle at the stitching edge pulling a gold thread behind it.
const Needle: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => <svg width={140} height={140}
  style={{position: 'absolute', left: x - 20, top: y - 110, opacity: o, overflow: 'visible', filter: 'drop-shadow(0 4px 3px rgba(0,0,0,.35))'}}>
  <path d="M20 110 C 60 90, 90 60, 120 10" stroke="#E8C98E" strokeWidth={3} fill="none"/>
  <line x1={12} y1={118} x2={70} y2={40} stroke="#D9DEE6" strokeWidth={6} strokeLinecap="round"/>
  <ellipse cx={66} cy={46} rx={4} ry={8} transform="rotate(37 66 46)" fill="none" stroke="#8C93A0" strokeWidth={2}/>
</svg>;

const Name: React.FC<{i: number; local: number; dur: number}> = ({i, local, dur}) => {
  const {fps} = useVideoConfig();
  const [ar, en] = NAMES[i];
  const [base, light, dark] = THREADS[i % 2];
  const stitch = interpolate(local, [0, 1.0 * fps], [0, 1], clamp);
  const out = interpolate(local, [dur - 0.3 * fps, dur], [1, 0], clamp);
  const pop = spring({frame: local - 0.9 * fps, fps, config: {damping: 9, stiffness: 140}});
  const glow = 0.3 + 0.3 * Math.sin(local / 6);
  const satin = `repeating-linear-gradient(-38deg, ${light} 0px, ${light} 3px, ${base} 3px, ${base} 6.5px, ${dark} 6.5px, ${dark} 8px)`;
  const left = 260, right = 820, edge = right - (right - left) * stitch;
  const sub = interpolate(local, [1.0 * fps, 1.4 * fps], [0, 1], clamp) * out;
  return <AbsoluteFill style={{opacity: out, transform: `scale(${(1 + 0.04 * pop - 0.04) * interpolate(out, [0, 1], [0.9, 1])})`,
    transformOrigin: '540px 980px'}}>
    <div style={{position: 'absolute', top: 770, width: '100%', textAlign: 'center', direction: 'rtl',
      clipPath: `inset(0 0 0 ${(edge / 1080) * 100}%)`,
      filter: `drop-shadow(0 6px 3px rgba(60,40,30,.35)) drop-shadow(0 0 ${18 * glow}px rgba(255,230,170,.8))`}}>
      <span style={{fontFamily: 'Al Nile', fontWeight: 700, fontSize: 190, lineHeight: 1.6, color: 'transparent',
        backgroundImage: satin, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextStroke: '3px #E8C98E'}}>{ar}</span>
    </div>
    <Needle x={edge} y={980 + Math.sin(local / 2) * 40} o={stitch < 1 ? 1 : interpolate(local, [fps, 1.2 * fps], [1, 0], clamp)}/>
    <div style={{position: 'absolute', top: 1140, width: '100%', textAlign: 'center', opacity: sub, fontFamily: 'Amiri',
      fontSize: 56, letterSpacing: 3, color: dark, textShadow: '0 2px 1px rgba(255,250,240,.7)'}}>{en}</div>
    {[...Array(10)].map((_, k) => {
      const a = (k / 10) * Math.PI * 2, d = interpolate(local, [fps, 1.8 * fps], [0, 260], clamp);
      const o = interpolate(local, [fps, 1.1 * fps, 1.8 * fps], [0, 1, 0], clamp);
      return <div key={k} style={{position: 'absolute', left: 540 + Math.cos(a) * d - 9, top: 980 + Math.sin(a) * d * 0.7 - 6,
        width: 18, height: 12, borderRadius: '50%', opacity: o, transform: `rotate(${a}rad)`,
        background: k % 2 ? '#F2C6D8' : '#D2BDEB'}}/>;
    })}
  </AbsoluteFill>;
};

// The footer band from the owner's reference: an embroidered linen strip with a lilac scalloped edge and the two handles.
const Footer: React.FC = () => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const k = spring({frame: f - 1.2 * fps, fps, config: {damping: 14, stiffness: 80}});
  const scallop = 'radial-gradient(circle at 14px 0, #B89BD3 12px, transparent 13px)';
  return <div style={{position: 'absolute', left: 30, top: 1790, width: 1020, height: 104, transform: `translateY(${(1 - k) * 160}px)`,
    opacity: k, borderRadius: 10, background: 'repeating-linear-gradient(0deg, #F4EAD8 0 3px, #EFE3CE 3px 6px)',
    boxShadow: '0 -4px 14px rgba(20,25,60,.35), inset 0 0 0 4px #E7D6BC', display: 'flex', alignItems: 'center',
    justifyContent: 'center'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: -12, height: 14, backgroundImage: scallop, backgroundSize: '28px 14px'}}/>
    <div style={{position: 'absolute', left: 14, right: 14, top: 10, bottom: 10, border: '3px dashed #C9A97A', borderRadius: 8}}/>
    <div style={{fontFamily: 'Amiri', fontSize: 46, color: '#4B6291', letterSpacing: 0.5, textShadow: '0 2px 1px rgba(255,250,240,.8)',
      whiteSpace: 'nowrap'}}>@heal.ingthroughquran&nbsp;&nbsp;|&nbsp;&nbsp;@eternalhidayah01</div>
  </div>;
};

export const KnitNamesLive: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const idx = START.findIndex((s, k) => t >= s && (k === START.length - 1 || t < START[k + 1]));
  const arch = spring({frame, fps, config: {damping: 14, stiffness: 70}});
  const cam = 1.03 + 0.02 * Math.sin(t * 0.35);
  const outro = interpolate(frame, [durationInFrames - fps, durationInFrames], [1, 0], clamp);
  return <AbsoluteFill style={{background: '#4E6390', opacity: outro}}>
    <AbsoluteFill style={{transform: `scale(${cam}) rotate(${Math.sin(t * 0.25) * 0.6}deg)`}}>
      <Img src={P('bg')} style={{position: 'absolute', width: 1080, height: 1920, objectFit: 'cover',
        transform: `translate(${Math.sin(t * 0.2) * 12}px, ${Math.cos(t * 0.17) * 10}px) scale(1.05)`}}/>
      <Img src={P('arch')} style={{position: 'absolute', left: 50, top: 300, width: 980, height: 1300, objectFit: 'fill',
        transform: `scale(${0.7 + 0.3 * arch}) rotate(${(1 - arch) * -6}deg)`, opacity: arch,
        filter: 'drop-shadow(0 18px 18px rgba(20,25,60,.45))'}}/>
      {LIGHTS.map(([x, y], k) => {
        const tw = 0.4 + 0.6 * Math.pow(Math.sin(frame / (9 + (k % 5) * 3) + k * 1.7) * 0.5 + 0.5, 3);
        return <div key={k} style={{position: 'absolute', left: x - 36, top: y - 36, width: 72, height: 72, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,236,170,.95) 0%, rgba(255,214,120,.45) 22%, rgba(255,200,100,0) 70%)',
          opacity: tw * arch, mixBlendMode: 'screen'}}/>;
      })}
      <Piece src={P('moon')} x={160} y={-20} w={230} at={0.4} sway={3} anchor="50% 0%" swing/>
      <Piece src={P('moon')} x={920} y={-40} w={210} at={0.55} sway={3} anchor="50% 0%" swing flip phase={1.3}/>
      <Piece src={P('sprig')} x={270} y={170} w={190} at={0.3} sway={2} phase={0.4}/>
      <Piece src={P('sprig')} x={810} y={170} w={190} at={0.35} sway={2} flip phase={1.1}/>
      <Piece src={P('bow')} x={540} y={130} w={300} at={0.2} sway={2.5}/>
      <Piece src={P('flower_blue')} x={95} y={960} w={180} at={0.6} phase={0.2}/>
      <Piece src={P('flower_blue')} x={985} y={960} w={180} at={0.65} flip phase={0.9}/>
      <Piece src={P('rose_lilac')} x={130} y={1240} w={290} at={0.75} phase={0.5}/>
      <Piece src={P('rose_lilac')} x={950} y={1240} w={290} at={0.8} flip phase={1.4}/>
      <Piece src={P('flower_pink')} x={400} y={1640} w={130} at={0.95} phase={2.1}/>
      <Piece src={P('flower_pink')} x={680} y={1640} w={130} at={1.0} flip phase={0.7}/>
      <Piece src={P('rose_cream')} x={210} y={1520} w={280} at={0.85} phase={1.7}/>
      <Piece src={P('rose_cream')} x={870} y={1520} w={280} at={0.9} flip phase={0.3}/>
      <Piece src={P('bow')} x={540} y={1610} w={240} at={1.05} sway={2.5} phase={2.4}/>
      <Footer/>
      <Fluff/>
      {idx >= 0 && <Name key={idx} i={idx} local={frame - Math.round(START[idx] * fps)}
        dur={Math.round(((idx < START.length - 1 ? START[idx + 1] : durationInFrames / fps) - START[idx]) * fps)}/>}
    </AbsoluteFill>
    <Audio src={staticFile('gift/audio.m4a')}/>
  </AbsoluteFill>;
};

registerRoot(() => <Composition id="KnitNamesLive" component={KnitNamesLive} durationInFrames={Math.round(64.4 * FPS)}
  fps={FPS} width={1080} height={1920}/>);
