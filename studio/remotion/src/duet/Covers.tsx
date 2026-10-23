import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

loadFont({family: 'DuetCoverSans', url: staticFile('fonts/inter-latin-800-normal.woff2'), weight: '800'});
loadFont({family: 'DuetCoverSans', url: staticFile('fonts/inter-latin-600-normal.woff2'), weight: '600'});
loadFont({family: 'DuetCoverDisplay', url: staticFile('fonts/instrument-serif-latin-400-normal.woff2'), weight: '400'});
loadFont({family: 'DuetCoverDisplay', url: staticFile('fonts/instrument-serif-latin-400-italic.woff2'), weight: '400', style: 'italic'});
const file = (s: string) => staticFile('duet/' + s);
const BLUE = '#4A78F0';

// The reel's canvas: near-black, faint 60 px grid, coral glow, vignette.
const Canvas: React.FC<{glowY?: number}> = ({glowY = 1100}) => <>
  <AbsoluteFill style={{background: '#0A0A0A'}}/>
  <AbsoluteFill style={{backgroundImage: 'linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)', backgroundSize: '60px 60px'}}/>
  <AbsoluteFill style={{background: `radial-gradient(circle at 540px ${glowY}px, #d9775a44, transparent 520px)`}}/>
</>;

// The take's frame, faded into the canvas so only the head and shoulders remain.
const Face: React.FC<{src: string; top: number; scale: number}> = ({src, top, scale}) => {
  const w = 1080 * scale, h = 1920 * scale;
  return <Img src={file(src)} style={{position: 'absolute', left: 540 - w / 2, top, width: w, height: h,
    WebkitMaskImage: 'radial-gradient(ellipse 52% 40% at 50% 34%, #000 62%, transparent 100%)'}}/>;
};

const Box: React.FC<React.PropsWithChildren<{size: number}>> = ({size, children}) => (
  <span style={{position: 'relative', display: 'inline-block', padding: `0 ${size * 0.14}px ${size * 0.06}px`, background: '#9FB6E5', border: `6px solid ${BLUE}`, color: '#0D182C',
    fontFamily: 'DuetCoverDisplay', fontStyle: 'italic', fontSize: size, lineHeight: 1.05, boxShadow: '0 16px 50px #0009'}}>{children}
    {[0, 1].map((k) => <span key={k} style={{position: 'absolute', width: 26, height: 26, borderRadius: 26, background: '#fff', border: `6px solid ${BLUE}`, ...(k ? {right: -16, bottom: -16} : {left: -16, top: -16})}}/>)}
  </span>
);

const Lockup: React.FC<{icon: number; text: number}> = ({icon, text}) => (
  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: icon * 0.22}}>
    <Img src={file('claude-duet-icon.svg')} style={{width: icon, height: icon, borderRadius: icon * 0.225, boxShadow: '0 10px 40px #0008'}}/>
    <span style={{fontFamily: 'DuetCoverDisplay', fontSize: text, color: '#F6F3EC', letterSpacing: -1, lineHeight: 1}}>Claude Duet</span>
  </div>
);

// A: the reference's cover (the Claude Duet lockup with its "Research preview" pill on the dark grid), plus Hammad.
export const CoverA: React.FC = () => <AbsoluteFill>
  <Canvas glowY={560}/>
  <Face src="cover-smile.png" top={560} scale={0.92}/>
  <div style={{position: 'absolute', top: 440, left: 0, right: 0}}><Lockup icon={190} text={170}/></div>
  <div style={{position: 'absolute', top: 668, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: 'DuetCoverSans', fontWeight: 600, fontSize: 40, color: '#F2F2F2', background: '#161616', border: '2px solid #2C2C2C', borderRadius: 999, padding: '14px 32px'}}>Research preview</div></div>
</AbsoluteFill>;

// B/C: click-first (owner rule 2026-10-23): two big lines with the punch word boxed in the reel's selection box,
// the strongest face big and whole inside the 1:1 crop, the lockup under it, nothing small.
const ClickFirst: React.FC<{face: string}> = ({face}) => <AbsoluteFill>
  <Canvas glowY={1150}/>
  <Face src={face} top={604} scale={0.92}/>
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #0A0A0Af2 0%, #0A0A0Ad9 25%, #0A0A0A00 37%)'}}/>
  <div style={{position: 'absolute', top: 452, left: 0, right: 0, textAlign: 'center', fontFamily: 'DuetCoverSans', fontWeight: 800, color: '#fff', letterSpacing: -4, lineHeight: 1, textShadow: '0 8px 40px #000'}}>
    <div style={{fontSize: 106}}>Claude messages</div>
    <div style={{fontSize: 118, marginTop: 24}}>you <Box size={160}>first</Box></div>
  </div>
  <div style={{position: 'absolute', top: 1518, left: 0, right: 0}}><Lockup icon={80} text={74}/></div>
</AbsoluteFill>;
export const CoverB: React.FC = () => <ClickFirst face="cover-surprise.png"/>;
export const CoverC: React.FC = () => <ClickFirst face="cover-smile.png"/>;
