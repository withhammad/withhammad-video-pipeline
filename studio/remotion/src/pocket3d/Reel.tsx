// Pocket-3D dialogue reel (job df71c9d45658): the HyperFrames/Three.js picture + the reference's caption system
// (one sentence card, bold white Poppins, centre of the lower half) + the comment-keyword ending + the mix.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import D from './data.json';

const FONT = 'Poppins';
const fontsReady = Promise.all([
  loadFont({family: FONT, url: staticFile('pocket3d/poppins-700.woff2'), weight: '700'}),
  loadFont({family: FONT, url: staticFile('pocket3d/poppins-600.woff2'), weight: '600'}),
]);

type Card = {text: string; s: number; e: number};
const CARDS = D.cards as Card[];
const CTA_LINE = D.lines[9];          // "Just comment 3D below..."

const Caption: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const c = CARDS.find(x => t >= x.s && t < x.e);
  if (!c || (t >= D.montage[0] && t < D.montage[1])) return null;   // reference: no main caption over the 2x2 grid
  const f = (t - c.s) * fps;
  const pop = spring({frame: f, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});
  const parts = c.text.split(new RegExp(`(\\b${D.keyword}\\b)`));
  return <div style={{position: 'absolute', left: 80, right: 80, top: 1130, display: 'flex', justifyContent: 'center'}}>
    <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 47, lineHeight: 1.2, color: '#fff', textAlign: 'center', letterSpacing: -0.3,
      textShadow: '0 3px 0 rgba(0,0,0,0.55), 0 0 18px rgba(0,0,0,0.6)', transform: `scale(${0.94 + 0.06 * pop})`, opacity: Math.min(1, f / 2 + 0.3)}}>
      {parts.map((p, i) => p === D.keyword
        ? <span key={i} style={{background: '#F06A24', color: '#fff', padding: '0 12px', borderRadius: 10, textShadow: 'none'}}>{p}</span>
        : <span key={i}>{p}</span>)}
    </div>
  </div>;
};

// Instagram-style comment box that types the keyword while Claude says it, then a DM bubble (call-to-action skill)
const CommentCTA: React.FC<{t: number; fps: number}> = ({t, fps}) => {
  const s = CTA_LINE.s + 0.5, e = D.end - 0.9;
  if (t < s || t > e) return null;
  const k = (t - s) * fps;
  const inn = spring({frame: k, fps, config: {damping: 16, stiffness: 180}});
  const out = interpolate(t, [e - 0.3, e], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const typed = D.keyword.slice(0, Math.max(0, Math.min(D.keyword.length, Math.floor((k - 8) / 5) + 1)));
  const sent = k > 8 + D.keyword.length * 5 + 10;
  const dm = spring({frame: k - (8 + D.keyword.length * 5 + 24), fps, config: {damping: 15, stiffness: 170}});
  return <div style={{position: 'absolute', left: 90, right: 90, top: 250, opacity: out, transform: `translateY(${(1 - inn) * -40}px)`}}>
    <div style={{background: 'rgba(18,18,24,0.92)', borderRadius: 26, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18,
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)', opacity: inn}}>
      <div style={{width: 58, height: 58, borderRadius: 29, background: 'linear-gradient(135deg,#F06A24,#ffb36b)', flexShrink: 0}}/>
      <div style={{flex: 1, fontFamily: FONT, fontWeight: 600, fontSize: 34, color: typed ? '#fff' : 'rgba(255,255,255,0.45)'}}>
        {typed || 'Add a comment…'}{!sent && typed.length < D.keyword.length && Math.floor(k / 8) % 2 === 0 ? '|' : ''}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 30, color: sent ? 'rgba(77,163,255,0.45)' : '#4DA3FF'}}>{sent ? 'Posted' : 'Post'}</div>
    </div>
    {dm > 0.01 && <div style={{marginTop: 22, marginLeft: 120, background: 'linear-gradient(135deg,#7b4dff,#d04dff)', borderRadius: 30, padding: '20px 28px',
      fontFamily: FONT, fontWeight: 600, fontSize: 31, color: '#fff', transform: `scale(${dm})`, transformOrigin: 'left top', boxShadow: '0 10px 40px rgba(0,0,0,0.45)'}}>
      Here's your 3D video guide 👇<br/><span style={{opacity: 0.85, fontSize: 27}}>withhammad.com/resources</span>
    </div>}
  </div>;
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const t = frame / fps;
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => { fontsReady.then(() => continueRender(h)); }, [h]);
  const brand = interpolate(t, [D.lines[11].s, D.lines[11].s + 0.4, D.end - 0.9, D.end - 0.5], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('pocket3d/picture.mp4')} muted style={{width: 1080, height: 1920}}/>
    <Caption t={t} fps={fps}/>
    <CommentCTA t={t} fps={fps}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1440, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#fff', opacity: brand * 0.9}}>WITHHAMMAD</div>
    {D.standin && <div style={{position: 'absolute', left: 0, right: 0, top: 60, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#D32F2F', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: 2, padding: '8px 20px', borderRadius: 10}}>STAND-IN VOICE · NOT FOR POSTING</div></div>}
    <Audio src={staticFile('pocket3d/voice.wav')}/>
  </AbsoluteFill>;
};
