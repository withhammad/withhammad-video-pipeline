import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Audio, Composition, Img, interpolate, registerRoot, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// Private gift (owner 2026-11-07): the first 26 Beautiful Names, one per recited beat, embroidered onto a knitted
// crochet frame. Timings come from the reference reel's name changes (2.47 s apart, first at 0.5 s).
//   npx remotion render src/gift/index.tsx KnitNames out.mp4

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
const THREADS = [['#5E77A8', '#7E96C4', '#4B6291'], ['#9A7BB8', '#B79AD0', '#7F62A0']];
const LIGHTS: [number, number][] = [[300, 420], [540, 300], [780, 420], [170, 760], [910, 760], [150, 1150], [930, 1150],
  [320, 1420], [760, 1420], [540, 1520], [250, 560], [830, 560], [540, 1660], [120, 960], [960, 960]];

loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Bold.ttf'), weight: '700'});
loadFont({family: 'Amiri', url: staticFile('fonts/Amiri-Regular.ttf'), weight: '400'});

// One name, embroidered: a running-stitch outline draws on, then the satin-stitch fill (diagonal thread pattern)
// fades in with a soft spring, the whole patch casting a raised shadow on the linen.
const Name: React.FC<{i: number; local: number; dur: number}> = ({i, local, dur}) => {
  const {fps} = useVideoConfig();
  const [ar, en] = NAMES[i];
  const [base, light, dark] = THREADS[i % 2];
  const draw = interpolate(local, [0, 0.55 * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fill = interpolate(local, [0.3 * fps, 0.8 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pop = spring({frame: local - 0.25 * fps, fps, config: {damping: 13, stiffness: 120, mass: 0.7}});
  const out = interpolate(local, [dur - 0.35 * fps, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = (0.86 + 0.14 * pop) * interpolate(out, [0, 1], [0.94, 1]);
  const sub = interpolate(local, [0.6 * fps, 1.0 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * out;
  const reveal = interpolate(local, [0, 0.7 * fps], [100, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const satin = `repeating-linear-gradient(-38deg, ${light} 0px, ${light} 3px, ${base} 3px, ${base} 6.5px, ${dark} 6.5px, ${dark} 8px)`;
  return <AbsoluteFill style={{opacity: out, transform: `scale(${scale})`, transformOrigin: '540px 860px'}}>
    <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', direction: 'rtl',
      clipPath: `inset(0 0 0 ${reveal}%)`, filter: 'drop-shadow(0 6px 3px rgba(60,40,30,.35)) drop-shadow(0 1px 0 rgba(255,250,240,.7))'}}>
      <span style={{fontFamily: 'Al Nile', fontWeight: 700, fontSize: 190, lineHeight: 1.6, color: 'transparent',
        backgroundImage: satin, WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextStroke: `${2 + 2 * (1 - fill)}px #E8C98E`, opacity: 0.55 + 0.45 * fill}}>{ar}</span>
    </div>
    <div style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center', opacity: sub, fontFamily: 'Amiri',
      fontSize: 54, letterSpacing: 2, color: dark, textShadow: '0 2px 1px rgba(255,250,240,.7)'}}>{en}</div>
  </AbsoluteFill>;
};

export const KnitNames: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const idx = START.findIndex((s, k) => t >= s && (k === START.length - 1 || t < START[k + 1]));
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.07]);
  const intro = interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateRight: 'clamp'});
  const outro = interpolate(frame, [durationInFrames - fps, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'});
  return <AbsoluteFill style={{background: '#4E6390', opacity: Math.min(intro, outro)}}>
    <Img src={staticFile('gift/frame.png')} style={{position: 'absolute', width: 1080, height: 1920, objectFit: 'cover',
      transform: `scale(${zoom})`}}/>
    {LIGHTS.map(([x, y], k) => {
      const tw = 0.45 + 0.55 * Math.pow(Math.sin(frame / (11 + (k % 5) * 3) + k * 1.7) * 0.5 + 0.5, 3);
      return <div key={k} style={{position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,236,170,.95) 0%, rgba(255,214,120,.45) 22%, rgba(255,200,100,0) 70%)',
        opacity: tw, mixBlendMode: 'screen'}}/>;
    })}
    {idx >= 0 && <Name key={idx} i={idx} local={frame - Math.round(START[idx] * fps)}
      dur={Math.round(((idx < START.length - 1 ? START[idx + 1] : durationInFrames / fps) - START[idx]) * fps)}/>}
    <Audio src={staticFile('gift/audio.m4a')}/>
  </AbsoluteFill>;
};

const Root: React.FC = () => <Composition id="KnitNames" component={KnitNames} durationInFrames={Math.round(64.4 * FPS)}
  fps={FPS} width={1080} height={1920}/>;
registerRoot(Root);
