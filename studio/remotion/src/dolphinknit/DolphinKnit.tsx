// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): the golden-dolphin salawat
// reel. The reference DfwI-C2tUw9 (Ikram Azad, an AI video of a golden dolphin marked «الله» leaping in slow motion) rebuilt
// as a real 3D knitted plate (studio/blender/dolphinknit/build.py) on the reference's own 10 s clock and under its own sung
// salawat (kept exactly as recorded). On top: her handle all the way, a two-line English hook from frame 0, and once the dolphin has gone back into the sea (7.3 s,
// during the nasheed's «صلى عليك الله»), the salawat of Sahih al-Bukhari 3370 with its English. The nasheed's own words are
// not drawn (their source could not be verified).
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import TX from './texts.json';

export const FPS = 30, FRAMES = 302;           // 10.07 s (the reference: 10.0 s video, 10.05 s audio)
export const SERIF = 'KnitSerif, serif';
export const ARB = 'AmiriQ, serif';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const T_TEXT = 7.3;

export const Handle: React.FC<{top: number; o?: number}> = ({top, o = 1}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: o}}>
    <span style={{width: 60, borderTop: '3px dashed #F2D58A'}}/>
    <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: '#FFF6E2', textShadow: '0 2px 6px #00000099, 0 0 18px #00000055'}}>
      @heal.ingthroughquran</span>
    <span style={{width: 60, borderTop: '3px dashed #F2D58A'}}/>
  </div>;

export const Salawat: React.FC<{t: number; top: number; size?: number}> = ({t, top, size = 118}) => {
  const words = TX.salawatAr.split(' ');
  return <div style={{position: 'absolute', left: 40, right: 40, top, textAlign: 'center'}}>
    <div dir="rtl" style={{fontFamily: ARB, fontSize: size, lineHeight: 1.55, color: '#FFE08A',
      textShadow: '0 4px 0 #6A3E08, 0 8px 18px #000000aa, 0 0 34px #FFC84C88'}}>
      {words.map((w, i) => { const u = ease((t - i * 0.22) / 0.55);
        return <span key={i} style={{display: 'inline-block', opacity: u, filter: `blur(${(1 - u) * 10}px)`,
          transform: `translateY(${(1 - u) * 26}px)`, margin: '0 0.12em'}}>{w}</span>; })}
    </div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: size * 0.43, lineHeight: 1.15, marginTop: size * 0.6, color: '#FFF6E2',
      opacity: ease((t - 1.0) / 0.6), textShadow: '0 2px 6px #000000cc, 0 0 22px #00000066'}}>{TX.salawatEn}</div>
  </div>;
};

export const DolphinKnit: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return <AbsoluteFill style={{background: '#0E1E33'}}>
    <Img src={staticFile(`blender/f${String(f).padStart(4, '0')}.jpg`)} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}/>
    {t >= T_TEXT - 0.2 && <AbsoluteFill style={{background: 'linear-gradient(180deg, #0B1A2E88 0px, #0B1A2E55 520px, #0B1A2E00 760px)',
      opacity: ease((t - T_TEXT + 0.2) / 0.8)}}/>}
    <Handle top={230}/>
    {t < T_TEXT + 0.3 && <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic',
      fontSize: 70, lineHeight: 1.08, color: '#FFF6E2', opacity: 1 - ease((t - T_TEXT + 0.4) / 0.6),
      textShadow: '0 3px 8px #000000aa, 0 0 26px #00000066'}}>It's Friday<br/><span style={{color: '#FFE08A'}}>send salawat on the Prophet</span></div>}
    {t >= T_TEXT && <Salawat t={t - T_TEXT} top={330}/>}
  </AbsoluteFill>;
};
