// Cream comment-keyword end card (reference: serif headline types in, comment box types the keyword, heart fills).
import React from 'react';
import {interpolate} from 'remotion';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const HEAD = 'Follow + comment ';
const TAIL = ' for the searches and prompt';
export const EndCard: React.FC<{t: number}> = ({t}) => {
  const total = HEAD.length + 4 + TAIL.length;
  const n = Math.floor(interpolate(t, [0.25, 1.5], [0, total], clamp));
  const h = HEAD.slice(0, n), k = 'JOBS'.slice(0, Math.max(0, n - HEAD.length)), tl = TAIL.slice(0, Math.max(0, n - HEAD.length - 4));
  const typed = 'JOBS'.slice(0, Math.floor(interpolate(t, [1.7, 2.5], [0, 4], clamp)));
  const heart = interpolate(t, [2.7, 2.9], [0, 1], clamp);
  const logoS = interpolate(t, [0, 0.35], [0.6, 1], {...clamp, easing: (x) => 1 - Math.pow(1 - x, 3)});
  return (
    <div style={{position: 'absolute', inset: 0, background: '#f4efe6', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(60,40,20,.13) 2px, transparent 2.5px)', backgroundSize: '34px 34px'}} />
      <div style={{position: 'absolute', left: 140, top: 520, width: 800, height: 800, borderRadius: 400, background: 'radial-gradient(circle, rgba(244,170,130,.55), rgba(244,170,130,0) 70%)'}} />
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{transform: `scale(${logoS})`, width: 118, height: 118, borderRadius: 30, background: '#1c1a17', color: '#f4efe6', fontFamily: 'CpInter', fontWeight: 800, fontSize: 30, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(0,0,0,.18)'}}>WH</div>
        <div style={{marginTop: 54, width: 860, minHeight: 230, textAlign: 'center', fontFamily: 'CpSerif', fontSize: 82, lineHeight: 1.08, color: '#26211b'}}>
          {h}<span style={{fontStyle: 'italic', color: '#c8603e'}}>{k}</span>{tl}
        </div>
        <div style={{marginTop: 46, width: 560, height: 96, borderRadius: 48, background: '#fff', border: '3px solid #26211b', display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18, boxShadow: '0 10px 0 #26211b'}}>
          <div style={{width: 52, height: 52, borderRadius: 26, background: 'linear-gradient(135deg,#e2683a,#f2b07a)'}} />
          <div style={{flex: 1, fontFamily: 'CpInter', fontWeight: 800, fontSize: 40, color: '#26211b', letterSpacing: 1}}>{typed}<span style={{opacity: Math.floor(t * 2.4) % 2 && typed.length < 4 ? 1 : 0}}>|</span></div>
          <svg width="44" height="40" viewBox="0 0 24 22"><path d="M12 21s-9-5.6-9-12A5 5 0 0 1 12 6a5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill={heart > 0.5 ? '#e0313f' : 'none'} stroke={heart > 0.5 ? '#e0313f' : '#26211b'} strokeWidth="2" transform={`scale(${1 + Math.sin(heart * Math.PI) * 0.25})`} style={{transformOrigin: '12px 11px'}} /></svg>
        </div>
        <div style={{marginTop: 40, fontFamily: 'CpMono', fontSize: 34, color: '#26211b', border: '2.5px solid #26211b', borderRadius: 30, padding: '8px 26px'}}>@withhammad.ai</div>
      </div>
      <div style={{position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', fontFamily: 'CpInter', fontWeight: 500, fontSize: 22, color: 'rgba(38,33,27,.45)'}}>Not affiliated with Anthropic</div>
    </div>
  );
};
