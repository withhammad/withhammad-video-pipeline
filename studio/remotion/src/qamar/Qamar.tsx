// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from our accounts): the nasheed "Qamarun sayyiduna
// an-Nabi qamarun, wa jameelun sayyiduna an-Nabi wa jameel" (reference @shahed_horanieh, Dfpbo93N88F, 26.6 s) rebuilt as a
// knitted Madinah: a crochet Green Dome at night where a knitted full moon rises on "qamar", then a golden-hour courtyard
// with lace umbrellas for "wa jameel". Text timings measured from the reference at 4 fps. Job 41e989e6b6e8.
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {AR, Needle, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';

export const FPS = 30, DURATION = 26.6;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const T = {sub1: 7.8, switch: 13.2, sub2: 19.9, out: 25.9};
// arch lamps measured on scene-night.jpg (bright-pixel clusters)
const LIGHTS_NIGHT: [number, number][] = [[272, 1770], [454, 1767], [643, 1772], [885, 1723], [637, 1479], [751, 1521], [808, 1522], [859, 1474], [273, 1824], [449, 1825], [636, 1828]];

const Stars: React.FC<{f: number; o: number}> = ({f, o}) => <>{Array.from({length: 34}, (_, k) => {
  const x = 120 + random(`sx${k}`) * 840, y = 300 + random(`sy${k}`) * 750, s = 3 + random(`ss${k}`) * 4;
  const tw = 0.35 + 0.65 * Math.abs(Math.sin(f / (14 + random(`st${k}`) * 20) + k));
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFF4D0',
    boxShadow: `0 0 ${3 * s}px ${s}px #F7DFA055`, opacity: o * tw}}/>;
})}</>;

const Dust: React.FC<{f: number; o: number}> = ({f, o}) => <>{Array.from({length: 30}, (_, k) => {
  const life = 200 + random(`dl${k}`) * 160, ph = (f + random(`dp${k}`) * life) % life, u = ph / life, gen = Math.floor((f + random(`dp${k}`) * life) / life);
  const x = 120 + random(`dx${k}-${gen}`) * 840 + Math.sin(u * 5 + k) * 30, y = 1500 - u * 1100, s = 3 + random(`ds${k}`) * 5;
  return <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: '#FFE7A6',
    boxShadow: `0 0 ${3 * s}px ${s}px #F6C75A88`, opacity: o * Math.sin(Math.PI * u) * (0.45 + 0.4 * Math.sin(f / 7 + k))}}/>;
})}</>;

/** A big word stitched in right to left by the needle, with a soft subtitle under it. */
const Line: React.FC<{t: number; start: number; end: number; word: string; sub: string; subAt: number; goldWord?: boolean}> =
  ({t, start, end, word, sub, subAt, goldWord}) => {
    if (t < start - 0.05 || t > end + 0.3) return null;
    const d = t - start, rv = ease(d / 0.55), X = rv >= 1 ? 0 : 78 - 56 * rv;
    const out = interpolate(t, [end - 0.25, end], [1, 0], clamp);
    const s = ease((t - subAt) / 0.7);
    const breathe = 1 + 0.015 * Math.sin(t * 1.6);
    return <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: out, filter: `blur(${(1 - out) * 6}px)`,
        transform: `scale(${(1.06 - 0.06 * ease(d / 0.6)) * breathe})`}}>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 290, lineHeight: 1.45, clipPath: `inset(-40% 0 -40% ${X}%)`,
          ...(goldWord ? {...gold(t, 0.4), filter: `${PUFF} drop-shadow(0 0 30px #FFC64A99)`}
            : {color: '#FBF1DC', WebkitTextStroke: '5px #FBF1DC', filter: `${PUFF} drop-shadow(0 0 26px #FFFFFF55)`})}}>{word}</div>
        <div dir="rtl" style={{fontFamily: AR, fontSize: 92, lineHeight: 1.5, marginTop: -60, opacity: s, transform: `translateY(${(1 - s) * 20}px)`,
          ...(goldWord ? {color: '#FBF1DC', WebkitTextStroke: '2px #FBF1DC'} : {...gold(t, 0.3)}), filter: PUFF}}>{sub}</div>
      </div>
      {rv < 1 && t >= start ? <Needle x={1080 * X / 100} y={760} o={interpolate(d, [0, 0.08, 0.45, 0.55], [0, 1, 1, 0], clamp)}/> : null}
    </>;
  };

export const Qamar: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const golden = ease(interpolate(t, [T.switch - 0.35, T.switch + 0.45], [0, 1], clamp));
  const flash = Math.max(0, 1 - Math.abs(t - T.switch) / 0.45);
  const pushN = 1.0 + 0.06 * Math.min(1, t / T.switch), pushG = 1.06 - 0.05 * Math.min(1, (t - T.switch) / (DURATION - T.switch));
  const moonRise = ease(interpolate(t, [0.2, 6.5], [0, 1], clamp));
  const moonY = 660 - 260 * moonRise, moonO = ease(interpolate(t, [0, 0.45], [0, 1], clamp)) * (1 - golden);
  const fade = interpolate(t, [T.out, DURATION], [0, 1], clamp);
  return <AbsoluteFill style={{background: '#0A1028', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.m4a')}/>
    <YarnDefs/>
    {/* night: crochet Green Dome, the moon rises behind it */}
    <AbsoluteFill style={{opacity: 1 - golden}}>
      <Img src={staticFile('scene-night.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${pushN})`, transformOrigin: '50% 75%'}}/>
      <Stars f={f} o={1}/>
      <div style={{position: 'absolute', left: 780 - 260, top: moonY - 260, width: 520, height: 520, borderRadius: '50%', mixBlendMode: 'screen', opacity: moonO * 0.7,
        background: 'radial-gradient(closest-side, #FFF6D8 0%, #F7E3A355 45%, #F7E3A300 100%)'}}/>
      <Img src={staticFile('parts/moon.png')} style={{position: 'absolute', left: 780 - 150, top: moonY - 150, width: 300, height: 300, objectFit: 'contain', opacity: moonO,
        transform: `rotate(${-6 + 4 * Math.sin(t * 0.4)}deg)`, filter: 'drop-shadow(0 0 30px #FFF2C8aa)'}}/>
      {LIGHTS_NIGHT.map(([x, y], k) => <div key={k} style={{position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: '50%', mixBlendMode: 'screen',
        background: 'radial-gradient(closest-side, #FFE3A0, #FFB54A44 50%, #FF9A2A00)', opacity: 0.5 + 0.4 * Math.sin(t * (2 + k * 0.3) + k)}}/>)}
    </AbsoluteFill>
    {/* golden hour: lace umbrellas and lanterns */}
    <AbsoluteFill style={{opacity: golden}}>
      <Img src={staticFile('scene-golden.jpg')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${pushG})`, transformOrigin: '50% 70%'}}/>
      <div style={{position: 'absolute', left: -200, top: 1100 - 700, width: 1480, height: 1400, borderRadius: '50%', mixBlendMode: 'screen', opacity: 0.35 + 0.1 * Math.sin(t * 1.3),
        background: 'radial-gradient(closest-side, #FFD27A 0%, #FFB45A44 45%, #FF9A2A00 100%)'}}/>
      <Dust f={f} o={1}/>
    </AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 30% at 50% 38%, #0a102855 0%, #0a102800 100%)'}}/>
    {/* plum halo behind the gold word on the bright sunset sky */}
    <AbsoluteFill style={{opacity: golden * 0.55, background: 'radial-gradient(ellipse 58% 20% at 50% 41%, #3A0F24cc 0%, #3A0F2400 100%)'}}/>
    {/* faint giant word drifting behind, like the reference's ghost letters */}
    <div dir="rtl" style={{position: 'absolute', left: -120, right: -120, top: 360, textAlign: 'center', fontFamily: AR, fontSize: 520, lineHeight: 1.3,
      ...gold(t, 0.15), opacity: 0.14 * Math.min(1, t / 3), transform: `translateX(${Math.sin(t * 0.25) * 60}px)`, filter: 'blur(1px)'}}>
      {t < T.switch ? 'قَمَرٌ' : 'جَمِيلٌ'}</div>
    <Line t={t} start={0.05} end={T.switch} word="قَمَرٌ" sub="سَيِّدُنا النَّبِيُّ قَمَرٌ" subAt={T.sub1}/>
    <Line t={t} start={T.switch} end={DURATION + 1} word="وَجَمِيلٌ" sub="وَجَمِيلٌ سَيِّدُنا النَّبِيُّ" subAt={T.sub2} goldWord/>
    <AbsoluteFill style={{background: '#FFF4D8', opacity: flash * 0.35, mixBlendMode: 'screen'}}/>
    <div style={{position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center', zIndex: 5}}>
      <span style={{fontFamily: 'KnitSerif, serif', fontStyle: 'italic', fontSize: 36, color: '#F6E3BC', letterSpacing: 1, paddingBottom: 6,
        borderBottom: '3px dashed #D9A847', textShadow: '0 2px 3px #000000aa'}}>@heal.ingthroughquran</span>
    </div>
    <AbsoluteFill style={{background: '#050608', opacity: fade}}/>
  </AbsoluteFill>;
};
