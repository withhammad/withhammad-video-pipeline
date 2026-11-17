// WEDDING reel panels (job 89e38db8d358). Only numbers from the public record are drawn as data:
// Austin Lau's X post (5 May 2026) and Business Insider via Storyboard18 / Shopifreaks: 161,015 messages over 4,340 days
// (12 years), 8,602 photos, 28,757 emojis, "I love you" 1,795 times, she sent 57%, peak 2016 (32,000+, college),
// dropped after moving in, busiest about 9 pm (Mondays), angry face = emoji #2, 3M+ views, "Best of luck mate" ->
// "I'm cooked brother". Everything else in these cards is layout, labelled as such. His wife is not named anywhere.
import React from 'react';
import {interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const PAPER = '#f6f0e4', INK = '#2a231c', MUTE = '#8b7f70', GOLD = '#c9963b', ROSE = '#d9775a', LINE = '#e3d8c6';
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const ap = (t: number, at: number, d = 0.28) => ease((t - at) / d);
export type Cue = Record<string, number>;

const Card: React.FC<{t: number; from: number; to: number; kicker: string; title: string; children: React.ReactNode}> = ({t, from, to, kicker, title, children}) => {
  if (t < from - 0.05 || t > to) return null;
  const a = interpolate(t, [from, from + 0.28, to - 0.2, to], [0, 1, 1, 0], clamp);
  const s = interpolate(t, [from, from + 0.28], [0.95, 1], {...clamp, easing: ease});
  return <div style={{position: 'absolute', top: 150, left: 50, right: 50, height: 820, borderRadius: 34, background: PAPER, border: `2px solid ${LINE}`,
    boxShadow: '0 30px 80px rgba(0,0,0,.55)', padding: '28px 34px', fontFamily: F, color: INK, opacity: a, transform: `scale(${s})`, transformOrigin: '50% 0%', overflow: 'hidden'}}>
    <div style={{fontSize: 18, letterSpacing: 2, fontWeight: 800, color: ROSE}}>{kicker}</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, marginTop: 6, marginBottom: 22}}>{title}</div>
    {children}
  </div>;
};
const count = (t: number, at: number, to: number, d = 0.9) => Math.round(to * ease((t - at) / d)).toLocaleString('en-US');
const Stat: React.FC<{t: number; at: number; n: number; label: string; big?: boolean}> = ({t, at, n, label, big}) => {
  const a = ap(t, at - 0.05); if (a <= 0) return <div style={{flex: 1}} />;
  return <div style={{flex: 1, background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 18, padding: '16px 20px', opacity: a, transform: `translateY(${(1 - a) * 12}px)`}}>
    <div style={{fontSize: big ? 64 : 48, fontWeight: 800, letterSpacing: -1}}>{count(t, at, n)}</div><div style={{fontSize: 22, color: MUTE, marginTop: 2}}>{label}</div></div>;
};

export const Post: React.FC<{t: number; c: Cue}> = ({t, c}) =>
  <Card t={t} from={c.post} to={c.receipts} kicker="ON X · 5 MAY 2026" title="He used Claude for his wedding">
    <div style={{background: '#fff', borderRadius: 20, border: `1.5px solid ${LINE}`, padding: '22px 24px'}}>
      <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: '#d9cbb6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 26}}>AL</div>
        <div><div style={{fontSize: 28, fontWeight: 800}}>Austin Lau</div><div style={{fontSize: 22, color: MUTE}}>works at Anthropic</div></div>
      </div>
      <div style={{fontSize: 30, lineHeight: 1.35, marginTop: 18}}>Got married. Had <b>Claude Code</b> analyze <span style={{background: '#f8e6b0'}}>12 years of iMessages</span> with his wife, then <b>Claude Design</b> built a site for the guests.</div>
      <div style={{fontSize: 18, color: MUTE, marginTop: 14}}>our summary of his public post</div>
    </div>
  </Card>;

export const Receipts: React.FC<{t: number; c: Cue}> = ({t, c}) =>
  <Card t={t} from={c.receipts} to={c.who} kicker="EVERYTHING, COUNTED" title="The receipts">
    <div style={{display: 'flex', gap: 16, marginBottom: 16}}><Stat t={t} at={c.msgs} n={161015} label="messages" big /></div>
    <div style={{display: 'flex', gap: 16, marginBottom: 16}}><Stat t={t} at={c.msgs + 0.4} n={4340} label="days" /><Stat t={t} at={c.msgs + 0.7} n={12} label="years" /></div>
    <div style={{display: 'flex', gap: 16, marginBottom: 16}}><Stat t={t} at={c.photos} n={8602} label="photos" /><Stat t={t} at={c.emojis} n={28757} label="emojis" /></div>
    <div style={{display: 'flex', gap: 16}}><div style={{flex: 1, display: 'flex'}}>{t > c.love - 0.05 ? <div style={{flex: 1, background: '#fbe3dc', border: `2px solid ${ROSE}`, borderRadius: 18, padding: '16px 20px', opacity: ap(t, c.love)}}>
      <div style={{fontSize: 56, fontWeight: 800, color: ROSE}}>❤ {count(t, c.love + 0.3, 1795, 1.4)}</div><div style={{fontSize: 22, color: MUTE}}>"I love you"</div></div> : null}</div></div>
  </Card>;

export const Who: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const k = ap(t, c.her, 0.8);
  return <Card t={t} from={c.who} to={c.site} kicker="WHO TEXTS MORE" title="Who texts more?">
    <div style={{display: 'flex', height: 90, borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${LINE}`}}>
      <div style={{width: `${50 + 7 * k}%`, background: GOLD, color: '#fff', fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', paddingLeft: 22}}>Her</div>
      <div style={{flex: 1, background: '#4a4038', color: '#fff', fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 22}}>Him</div>
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 64, fontWeight: 800, opacity: k}}><span style={{color: GOLD}}>57%</span><span style={{color: '#4a4038'}}>43%</span></div>
    <div style={{marginTop: 30, fontFamily: SERIF, fontStyle: 'italic', fontSize: 44, color: MUTE, opacity: ap(t, c.reply)}}>…so he was the one replying.</div>
  </Card>;
};

export const Shape: React.FC<{t: number; c: Cue}> = ({t, c}) =>
  <Card t={t} from={c.site} to={c.heat} kicker="CLAUDE DESIGN BUILT THE SITE" title="The shape of us">
    <div style={{fontSize: 26, color: MUTE, marginBottom: 18, opacity: ap(t, c.site + 0.4)}}>A website for the wedding guests: big numbers, a chart by year, a heatmap.</div>
    <div style={{display: 'flex', gap: 16}}>
      <div style={{flex: 1, background: '#fff', border: `2px solid ${GOLD}`, borderRadius: 20, padding: '20px 22px', opacity: ap(t, c.peak), transform: `translateY(${(1 - ap(t, c.peak)) * 14}px)`}}>
        <div style={{fontSize: 22, color: MUTE, fontWeight: 700}}>PEAK YEAR</div><div style={{fontSize: 70, fontWeight: 800, color: GOLD}}>2016</div>
        <div style={{fontSize: 26}}>32,000+ messages</div><div style={{fontSize: 22, color: MUTE}}>college years</div></div>
      <div style={{flex: 1, background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 20, padding: '20px 22px', opacity: ap(t, c.drop), transform: `translateY(${(1 - ap(t, c.drop)) * 14}px)`}}>
        <div style={{fontSize: 22, color: MUTE, fontWeight: 700}}>THEN</div><div style={{fontSize: 70, fontWeight: 800}}>↓</div>
        <div style={{fontSize: 26}}>dropped once they moved in</div></div>
    </div>
  </Card>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const Heat: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const hi = ap(t, c.nine, 0.35);
  return <Card t={t} from={c.heat} to={c.emoji} kicker="THE HEATMAP" title="Our week">
    <div style={{display: 'grid', gridTemplateColumns: '70px repeat(24, 1fr)', gap: 4, alignItems: 'center'}}>
      {DAYS.map((d, r) => <React.Fragment key={d}><div style={{fontSize: 20, color: MUTE}}>{d}</div>
        {Array.from({length: 24}).map((_, h) => { const peak = r === 0 && h === 21;
          return <div key={h} style={{height: 46, borderRadius: 5, background: peak ? `rgba(217,119,90,${0.25 + 0.75 * hi})` : '#ece3d3', outline: peak && hi > 0.5 ? `3px solid ${ROSE}` : 'none', transform: peak ? `scale(${1 + 0.35 * Math.sin(Math.min(1, hi) * Math.PI)})` : 'none'}} />; })}</React.Fragment>)}
    </div>
    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 18, color: MUTE, marginTop: 8, paddingLeft: 74}}><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
    <div style={{marginTop: 26, fontSize: 40, fontWeight: 800, opacity: hi}}>Busiest hour: <span style={{color: ROSE}}>9 pm</span>, especially Mondays</div>
    <div style={{marginTop: 10, fontSize: 18, color: MUTE}}>Only the peak is from the published data; the grid is layout.</div>
  </Card>;
};

export const Emoji: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const two = ap(t, c.angry, 0.3);
  return <Card t={t} from={c.emoji} to={c.views} kicker="THE EMOJI PAGE" title="Our emoji vocabulary">
    {[1, 2, 3, 4].map((n) => <div key={n} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px', marginBottom: 12, borderRadius: 16,
      background: n === 2 && two > 0 ? `rgba(217,119,90,${0.2 * two})` : '#fff', border: `1.5px solid ${n === 2 && two > 0.5 ? ROSE : LINE}`, transform: n === 2 ? `scale(${1 + 0.04 * two})` : 'none'}}>
      <div style={{fontSize: 30, fontWeight: 800, color: MUTE, width: 50}}>#{n}</div>
      <div style={{fontSize: 56}}>{n === 2 && two > 0 ? '😡' : '❔'}</div>
      <div style={{flex: 1, height: 18, borderRadius: 9, background: '#ece3d3'}} />
      {n === 2 && <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: ROSE, opacity: two}}>the angry face</div>}
    </div>)}
    <div style={{marginTop: 6, fontSize: 18, color: MUTE}}>Only #2 was made public.</div>
  </Card>;
};

export const Views: React.FC<{t: number; c: Cue}> = ({t, c}) => {
  const v = ap(t, c.views + 0.1, 0.9);
  return <Card t={t} from={c.views} to={c.end} kicker="THEN THE INTERNET SAW IT" title="3 million views later">
    <div style={{fontSize: 120, fontWeight: 800, letterSpacing: -3}}>{(3 * v).toFixed(1)}M+</div>
    <div style={{fontSize: 24, color: MUTE, marginTop: -6}}>views on his post</div>
    <div style={{marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{alignSelf: 'flex-start', background: '#fff', border: `1.5px solid ${LINE}`, borderRadius: 24, padding: '16px 24px', fontSize: 34, opacity: ap(t, c.luck), transform: `translateY(${(1 - ap(t, c.luck)) * 12}px)`}}>best of luck mate</div>
      <div style={{alignSelf: 'flex-end', background: '#2a7fff', color: '#fff', borderRadius: 24, padding: '16px 24px', fontSize: 34, fontWeight: 700, opacity: ap(t, c.cooked), transform: `translateY(${(1 - ap(t, c.cooked)) * 12}px)`}}>I'm cooked brother</div>
    </div>
  </Card>;
};

export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: ROSE, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>JUST MARRIED</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 8}}>161,015 texts</div>
    <div style={{fontSize: 34, fontWeight: 800, color: '#fff', marginTop: 8, opacity: ap(t, 1.0)}}>one wedding website</div>
  </div>;
};
