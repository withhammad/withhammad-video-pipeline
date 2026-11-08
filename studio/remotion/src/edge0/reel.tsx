import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/fonts';
import type {Caption} from '@remotion/captions';
import rawCaptions from './captions.json';

const INK = '#12111f';
const CREAM = '#f2efdf';
const CYAN = '#29d4e7';
const TEAL = '#087e8a';
const GOLD = '#f8cf55';
const FPS = 30;
const ready = Promise.all([
  loadFont({family: 'EdgeCondensed', url: staticFile('fonts/anton-latin-400-normal.ttf'), weight: '400'}),
  loadFont({family: 'EdgeSans', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'}),
  loadFont({family: 'EdgeSans', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'}),
]);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const asset = (name: string) => staticFile(`edge0/${name}`);

// Cuts follow word boundaries. The question stays readable for 1.8 seconds.
export const scenes = [
  {id: 'hook', at: 0, end: 2.73, light: false},
  {id: 'memory', at: 2.73, end: 7.23, light: true},
  {id: 'gpu', at: 7.23, end: 9.53, light: false},
  {id: 'question', at: 9.53, end: 11.4, light: true},
  {id: 'experts', at: 11.4, end: 14.93, light: false},
  {id: 'router', at: 14.93, end: 17.37, light: false},
  {id: 'overlap', at: 17.37, end: 19.67, light: false},
  {id: 'phone', at: 19.67, end: 22.43, light: true},
  {id: 'stars', at: 22.43, end: 24.5, light: false},
  {id: 'free', at: 24.5, end: 26.53, light: true},
  {id: 'cta', at: 26.53, end: 30, light: false},
] as const;

const Title: React.FC<{children: React.ReactNode; light?: boolean; size?: number; top?: number}> = ({children, light, size = 100, top = 270}) =>
  <div data-text="headline" style={{position: 'absolute', left: 70, top, width: 940, textAlign: 'center', fontFamily: 'EdgeCondensed', fontSize: size, lineHeight: 1.08, color: light ? INK : CREAM}}>{children}</div>;
const Accent: React.FC<{children: React.ReactNode; light?: boolean}> = ({children, light}) => <span style={{color: light ? TEAL : CYAN}}>{children}</span>;
const Label: React.FC<{children: React.ReactNode; top: number; light?: boolean; size?: number}> = ({children, top, light, size = 32}) =>
  <div data-text="label" style={{position: 'absolute', left: 80, width: 920, top, textAlign: 'center', fontSize: size, color: light ? INK : CREAM, lineHeight: 1.35}}>{children}</div>;

const Owl: React.FC<{phase?: number; x?: number; top?: number; width?: number}> = ({phase = 0, x = 275, top = 1110, width = 530}) => {
  const frame = useCurrentFrame();
  // Four 2 s Blender performances: idle, point, curious shrug, wave. Never a TTS avatar.
  const n = phase * 60 + (frame % 60) + 1;
  return <Img src={asset(`owl/frame-${String(n).padStart(4, '0')}.png`)} style={{position: 'absolute', left: x, top, width, height: width * 16 / 9}}/>;
};

const captionPages: Caption[][] = [];
let current: Caption[] = [];
for (const token of rawCaptions as Caption[]) {
  const text = current.map(c => c.text).join('') + token.text;
  if (current.length && !token.text.trim().startsWith('-') && (text.length > 34 || token.startMs - current[0].startMs > 1350)) {
    captionPages.push(current); current = [];
  }
  current.push(token);
  if (/[.!?]$/.test(token.text.trim())) {captionPages.push(current); current = [];}
}
if (current.length) captionPages.push(current);

const Captions: React.FC<{linkedin?: boolean}> = ({linkedin}) => {
  const ms = useCurrentFrame() / FPS * 1000;
  if (linkedin && ms >= 26530) return null;
  const page = captionPages.find((p, i) => ms >= p[0].startMs && ms < (captionPages[i + 1]?.[0].startMs ?? 30000));
  if (!page) return null;
  return <div data-text="captions" style={{position: 'absolute', left: 74, top: 1100, width: 850, minHeight: 92, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20}}>
    <div style={{background: INK, borderRadius: 20, padding: '18px 26px', boxShadow: '0 8px 30px #0004', fontSize: 48, lineHeight: 1.2, fontWeight: 800, textAlign: 'center', color: CREAM}}>
      {page.map((w, i) => <span key={w.startMs} style={{color: ms >= w.startMs && ms < w.endMs ? CYAN : CREAM}}>{i === 0 ? w.text.trim() : w.text.trim().startsWith('-') ? w.text.trim() : ` ${w.text.trim()}`}</span>)}
    </div>
  </div>;
};

const Grid: React.FC<{time: number; storage?: boolean}> = ({time, storage}) => {
  const tick = Math.floor(time * 3);
  return <>
    <div style={{position: 'absolute', left: 100, top: 530, display: 'grid', gridTemplateColumns: 'repeat(8, 66px)', gap: 12}}>
      {Array.from({length: 48}, (_, i) => {
        const active = (i + tick * 7) % 13 === 0 || (i + tick * 3) % 19 === 0;
        return <div key={i} style={{width: 66, height: 66, borderRadius: 12, background: active ? CYAN : '#191927', border: `2px solid ${active ? CYAN : '#343343'}`, boxShadow: active ? '0 0 25px #29d4e780' : 'none', scale: active ? 1.04 : 1}}/>;
      })}
    </div>
    {storage && <>
      <Img src={asset('ssd.png')} style={{position: 'absolute', left: 710, top: 610, width: 300, rotate: '-14deg', translate: `${40 * (1 - ease((time - 13.1) / .35))}px 0`}}/>
      {Array.from({length: 7}, (_, i) => {
        const p = (time * .8 + i / 7) % 1;
        return <div key={i} style={{position: 'absolute', left: 810 - 170 * p, top: 730 - 70 * Math.sin(p * Math.PI), width: 10, height: 10, borderRadius: 10, background: CYAN, opacity: Math.sin(p * Math.PI)}}/>;
      })}
      <Label top={1005} size={29}>~23 GB checkpoint on storage · only selected experts active</Label>
    </>}
  </>;
};

export const Edge0: React.FC<{linkedin?: boolean}> = ({linkedin = false}) => {
  const [handle] = useState(() => delayRender('Edge0 licensed fonts'));
  useEffect(() => {ready.then(() => continueRender(handle));}, [handle]);
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const scene = scenes.find(s => t >= s.at && t < s.end) ?? scenes[scenes.length - 1];
  const local = t - scene.at;
  const enter = ease(local / .3);
  const light = scene.light;
  return <AbsoluteFill style={{background: light ? CREAM : INK, fontFamily: 'EdgeSans', color: light ? INK : CREAM, overflow: 'hidden'}}>
    <style>{`* { box-sizing: border-box; }`}</style>
    <AbsoluteFill style={{opacity: light ? .16 : .33, backgroundImage: `radial-gradient(${light ? '#b6b2a1' : '#373548'} 1px, transparent 1px)`, backgroundSize: '36px 36px'}}/>
    <Audio src={asset(linkedin ? 'mix-linkedin.wav' : 'mix.wav')}/>

    {scene.id === 'hook' && <>
      <Title><span style={{fontSize: 88}}>THIS REPO RUNS</span><br/>A <Accent>35B</Accent> MODEL</Title>
      <div style={{position: 'absolute', left: 80, top: 600, width: 920, height: 330, background: '#1d1c2a', border: '2px solid #393747', borderRadius: 30, boxShadow: '0 25px 55px #0005', translate: `0 ${25 * (1 - ease(t / .35))}px`}}>
        <Img src={asset('repo-header.png')} style={{position: 'absolute', left: 20, top: 17, width: 880, height: 100, objectFit: 'contain'}}/>
        <div style={{position: 'absolute', left: 40, right: 35, top: 138, fontSize: 37, lineHeight: 1.4}}>Predictive expert streaming<br/>for local AI inference</div>
        <div style={{position: 'absolute', left: 40, top: 264, fontSize: 29, color: '#c0bdc9'}}>Python <span style={{color: GOLD, marginLeft: 35}}>★ 9K+</span><span style={{marginLeft: 35}}>Apache-2.0</span></div>
      </div>
      <Owl phase={2}/>
    </>}

    {scene.id === 'memory' && <>
      <Title light size={90}>ABOUT THREE GIGS<br/><Accent light>OF ACTIVE MEMORY</Accent></Title>
      <div data-text="memory" style={{position: 'absolute', top: 515, left: 60, width: 960, textAlign: 'center', fontFamily: 'EdgeCondensed', fontSize: 205, lineHeight: 1.1}}>{(2.9 * ease((t - 2.73) / (3.407 - 2.73))).toFixed(1)} <span style={{fontSize: 132}}>GiB</span></div>
      <Label top={774} light size={34}>Peak active allocation · M4 Pro benchmark</Label>
      {t >= 5.03 && <div style={{position: 'absolute', top: 862, left: 100, width: 880}}>
        <div style={{height: 20, borderRadius: 20, background: '#d2cebf'}}><div style={{height: 20, width: `${12.08 * ease((t - 5.03) / .4)}%`, borderRadius: 20, background: TEAL}}/></div>
        <div data-text="memory-caveat" style={{display: 'flex', justifyContent: 'space-between', marginTop: 24, fontSize: 34, fontWeight: 800}}><span>2.9 GiB active</span><span>24 GB test Mac</span></div>
        <div style={{marginTop: 28, textAlign: 'center', fontSize: 34, color: TEAL}}>Extra RAM is still required</div>
      </div>}
      <Owl phase={1}/>
    </>}

    {scene.id === 'gpu' && <>
      <Title size={91}>THE FULL MODEL<br/>NEEDS <Accent>MORE SPACE</Accent></Title>
      <Img src={asset('gpu.png')} style={{position: 'absolute', left: 95, top: 550, width: 890, translate: `${-180 * (1 - enter)}px 0`, rotate: `${-6 * (1 - enter)}deg`, opacity: enter}}/>
      <Owl phase={2} x={300} width={510}/>
    </>}

    {scene.id === 'question' && <>
      <Title light size={155} top={485}>THE TRICK?</Title>
      <div style={{position: 'absolute', left: 440, top: 740, width: 200, height: 200, borderRadius: 110, border: `14px solid ${TEAL}`, rotate: `${-20 + 9 * Math.sin(local * 3)}deg`}}><div style={{width: 110, height: 18, background: TEAL, position: 'absolute', left: 150, top: 180, rotate: '45deg', borderRadius: 20}}/></div>
      <Owl phase={2} x={255} top={1055} width={580}/>
    </>}

    {scene.id === 'experts' && <>
      <Title size={91}>{t < 13.13 ? <>ONLY THE EXPERTS<br/><Accent>IT NEEDS</Accent></> : <>WEIGHTS WAIT<br/>ON YOUR <Accent>SSD</Accent></>}</Title>
      <Grid time={t} storage={t >= 13.13}/>
      {t < 13.13 && <Label top={1010} size={32}>Selected experts enter active memory</Label>}
      <Owl phase={1}/>
    </>}

    {scene.id === 'router' && <>
      <Title size={91}>A TRAINED <Accent>ROUTER</Accent><br/>PREDICTS WHAT’S NEXT</Title>
      {[
        ['PYTHON', 'ling.py', 'python/src/edge0/engine/'],
        ['MACOS / NATIVE', 'prerouter.cpp', 'macos/crates/engine-native/src/'],
        ['IOS / SWIFT', 'LingPrerouter.swift', 'ios/Sources/Edge0MLX/'],
      ].map(([label, file, path], i) => <div key={file} style={{position: 'absolute', left: 85, top: 550 + i * 155, width: 910, height: 137, borderRadius: 20, background: '#1e1d2c', border: '2px solid #393646', padding: '18px 28px', opacity: ease((local - i * .12) / .22), translate: `${35 * (1 - ease((local - i * .12) / .22))}px 0`}}>
        <div style={{fontSize: 20, color: '#aaa5ba', letterSpacing: 3}}>{label}</div>
        <div style={{fontSize: 36, color: CYAN, fontWeight: 800, marginTop: 6}}>{file}</div>
        <div style={{fontSize: 23, color: '#d2cfdc', marginTop: 5}}>{path}</div>
      </div>)}
      <Owl phase={1}/>
    </>}

    {scene.id === 'overlap' && <>
      <Title size={102}>IT LOADS<br/>WHILE IT <Accent>THINKS</Accent></Title>
      {[0, 1].map(row => <div key={row} style={{position: 'absolute', left: 85, top: 565 + row * 195, width: 910, overflow: 'hidden'}}>
        <div style={{fontSize: 30, color: row ? CYAN : CREAM, marginBottom: 20}}>{row ? 'READ FROM STORAGE' : 'COMPUTE'}</div>
        <div style={{display: 'flex', gap: 18, width: 1600, translate: `${-((local * 105) % 226)}px 0`}}>{Array.from({length: 7}, (_, i) => <div key={i} style={{width: 208, flexShrink: 0, height: 105, borderRadius: 12, background: row ? CYAN : CREAM, color: INK, display: 'grid', placeItems: 'center', fontFamily: 'EdgeCondensed', fontSize: 44}}>STEP {i + 1 + row}</div>)}</div>
      </div>)}
      <Label top={1005} size={30}>Predict ahead → overlap reads with computation</Label>
      <Owl phase={1}/>
    </>}

    {scene.id === 'phone' && <>
      <Title light size={98}>PHONE VERSIONS<br/><Accent light>ARE REAL</Accent></Title>
      {[
        ['ANDROID · 8B MODEL', '8 GB+ phone RAM', 'Official Android setup guide'],
        ['ANDROID · 35B MODEL', '12 GB+ phone RAM', 'Storage and device limits still apply'],
      ].map(([tag, title, sub], i) => <div key={tag} style={{position: 'absolute', left: 85, top: 550 + i * 230, width: 910, height: 195, background: '#fffef7', border: '1px solid #dedbcc', borderRadius: 22, boxShadow: '0 15px 30px #2222', padding: '28px 34px', rotate: `${i ? 1.5 : -1.5}deg`, translate: `${(i ? 90 : -90) * (1 - ease((local - i * .16) / .35))}px 0`}}>
        <div style={{color: TEAL, fontSize: 25, fontWeight: 800}}>{tag}</div>
        <div style={{fontSize: 48, fontWeight: 800, marginTop: 12}}>{title}</div>
        <div style={{fontSize: 27, marginTop: 12, color: '#615f56'}}>{sub}</div>
      </div>)}
      <Owl phase={2}/>
    </>}

    {scene.id === 'stars' && <>
      <div data-text="stars" style={{position: 'absolute', left: 70, top: 475, width: 940, textAlign: 'center', fontFamily: 'EdgeCondensed', fontSize: 230, lineHeight: 1}}>{Math.round(9000 * ease((t - 22.43) / .337)).toLocaleString('en-US')}+</div>
      <Label top={770} size={54}>STARS IN <span style={{color: CYAN}}>TWO MONTHS</span></Label>
      <Label top={900} size={29}>GitHub · checked 8 November 2026</Label>
      {Array.from({length: 6}, (_, i) => <div key={i} style={{position: 'absolute', left: 130 + i * 150, top: 420 + Math.sin(i * 2 + local * 3) * 35, fontSize: 42, color: GOLD, rotate: `${local * 25}deg`}}>✦</div>)}
      <Owl phase={3} x={275}/>
    </>}

    {scene.id === 'free' && <>
      <div style={{position: 'absolute', left: 100, top: 545, width: 360, fontFamily: 'EdgeCondensed', fontSize: 160, textAlign: 'center'}}>$$$<div style={{position: 'absolute', left: 0, right: 0, top: 110, height: 15, background: '#df4260', rotate: '-5deg', scale: `${enter} 1`}}/></div>
      <div style={{position: 'absolute', left: 540, top: 550, width: 440, textAlign: 'center', border: `10px solid ${TEAL}`, color: TEAL, fontFamily: 'EdgeCondensed', fontSize: 137, padding: '12px 0', rotate: '-7deg', scale: .8 + .2 * enter}}>FREE</div>
      <Label top={850} light size={43}>OPEN-SOURCE CODE · APACHE-2.0</Label>
      <Label top={962} light size={34}>Hardware and storage are still required</Label>
      <Owl phase={1}/>
    </>}

    {scene.id === 'cta' && <>
      <Title size={100}>{linkedin ? 'GET THE SETUP GUIDE' : 'COMMENT'}</Title>
      <div data-text="keyword" style={{position: 'absolute', left: 210, top: 460, width: 660, height: 240, borderRadius: 135, background: CYAN, color: INK, display: 'grid', placeItems: 'center', fontFamily: 'EdgeCondensed', fontSize: 160, boxShadow: '0 0 90px #29d4e733', scale: .92 + .08 * ease(local / .27)}}>EDGE</div>
      <Label top={790} size={44}>{linkedin ? 'Full guide linked in the post' : 'I’LL SEND YOU THE FULL SETUP'}</Label>
      <Label top={900} size={36}><span style={{color: CYAN}}>WITHHAMMAD</span> · Local AI, explained</Label>
      <Owl phase={3} x={245} top={1080} width={580}/>
    </>}

    <Captions linkedin={linkedin}/>
    <div data-text="brand" style={{position: 'absolute', left: 70, top: 1438, fontSize: 24, fontWeight: 800, letterSpacing: 2, opacity: .7, color: light ? INK : CREAM}}>WITHHAMMAD</div>
  </AbsoluteFill>;
};
