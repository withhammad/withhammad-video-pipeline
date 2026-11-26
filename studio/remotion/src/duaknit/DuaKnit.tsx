// Private knitted "Dua for a child slow to speak" reel (DUA-KNIT) for the owner's wife (@heal.ingthroughquran). 2D motion
// graphics only (no Blender): GPT Image 2 knitted plates + code-set Arabic (Amiri Quran) so every mark is exact. Silent render,
// as the reference is silent (she adds an Instagram sound). Never posted from the business accounts.
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {DUAS, HANDLE, Dua} from './texts';

export const FPS = 30;
export const COVER_S = 3.4, DUA_S = 4.2;
export const FRAMES = Math.round((COVER_S + DUA_S * DUAS.length) * FPS);
export const SANS = 'KnitSans, sans-serif', SERIF = 'KnitSerif, serif', AR = 'AmiriQ, "Amiri Quran", serif';
const INK = '#5A3414', SOFT = '#7A5634';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const rise = (t: number, at: number, d = 0.55) => {
  const p = interpolate(t, [at, at + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  return {opacity: p, transform: `translateY(${(1 - p) * 26}px)`} as React.CSSProperties;
};

export const CoverScene: React.FC<{t: number; still?: boolean}> = ({t, still = false}) => {
  const z = still ? 1.02 : 1.02 + t * 0.012;
  return <AbsoluteFill style={{background: '#EFE3CF', overflow: 'hidden'}}>
    <AbsoluteFill style={{transform: `scale(${z})`}}>
      <Img src={staticFile('plates/cover.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
      <div style={{position: 'absolute', left: 907 - 120, width: 240, top: 1050, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic',
        fontSize: 64, color: INK, ...(still ? {} : rise(t, 0.9, 0.5))}}>Mama</div>
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', ...(still ? {} : rise(t, 0.05, 0.6))}}>
      <div style={{fontFamily: SANS, fontSize: 112, lineHeight: 1.02, letterSpacing: 2, color: '#6B3A12',
        filter: 'url(#yarn) drop-shadow(0 3px 2px #FFF6E6aa) drop-shadow(0 8px 14px #5A341455)'}}>DUA FOR A CHILD<br/>SLOW TO SPEAK</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, lineHeight: 1.15, color: INK, marginTop: 22, padding: '0 90px'}}>4 duas for the mama waiting<br/>for that first word</div>
    </div>
  </AbsoluteFill>;
};

const DuaScene: React.FC<{d: Dua; t: number}> = ({d, t}) => {
  const z = 1.02 + t * 0.008;
  return <AbsoluteFill style={{background: '#EFE3CF', overflow: 'hidden'}}>
    <Img src={staticFile('plates/plate.png')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`}}/>
    <div style={{position: 'absolute', left: 110, right: 110, top: 470, textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontSize: 42, letterSpacing: 6, color: SOFT, ...rise(t, 0.05)}}>DUA {d.n} OF 4</div>
      <div dir="rtl" style={{fontFamily: AR, fontSize: d.ar.length > 2 ? 74 : 84, color: INK, marginTop: 34,
        filter: 'url(#yarnAr) drop-shadow(0 2px 1px #FFF6E688)', ...rise(t, 0.2, 0.7)}}>
        {d.ar.map((l, i) => { const h = d.n === 4 ? (i === 2 ? 170 : 150) : d.ar.length > 2 ? 124 : 140;
          return <div key={l} style={{height: h, lineHeight: `${h}px`, whiteSpace: 'nowrap'}}>{l}</div>; })}
      </div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, lineHeight: 1.25, color: SOFT, marginTop: 30, ...rise(t, 0.55)}}>{d.tr}</div>
      <div style={{fontFamily: SERIF, fontSize: 47, lineHeight: 1.25, color: INK, marginTop: 26, ...rise(t, 0.75)}}>“{d.en}”</div>
      <div style={{fontFamily: SANS, fontSize: 32, lineHeight: 1.3, color: SOFT, marginTop: 26, ...rise(t, 0.9)}}>{d.src}</div>
      <div style={{display: 'inline-block', marginTop: 26, padding: '14px 30px', borderRadius: 40, border: '3px dashed #B88A57',
        background: '#F7EEDDcc', fontFamily: SANS, fontSize: 34, color: INK, ...rise(t, 1.05)}}>{d.tip}</div>
    </div>
  </AbsoluteFill>;
};

export const DuaKnit: React.FC = () => {
  const f = useCurrentFrame(), s = f / FPS;
  const idx = s < COVER_S ? -1 : Math.min(DUAS.length - 1, Math.floor((s - COVER_S) / DUA_S));
  const t = idx < 0 ? s : s - COVER_S - idx * DUA_S;
  const fadeIn = interpolate(t, [0, 0.25], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#EFE3CF'}}>
    <YarnDefs/><ArDefs/>
    <AbsoluteFill style={{opacity: idx < 0 ? 1 : fadeIn}}>{idx < 0 ? <CoverScene t={t}/> : <DuaScene d={DUAS[idx]} t={t}/>}</AbsoluteFill>
    {idx >= 0 && <div style={{position: 'absolute', left: 0, right: 0, top: 1600, textAlign: 'center', fontFamily: SANS, fontSize: 34, color: SOFT}}>{HANDLE}</div>}
  </AbsoluteFill>;
};
