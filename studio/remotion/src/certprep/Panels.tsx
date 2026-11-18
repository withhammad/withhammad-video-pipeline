// Claude certification reel panels (job cert-0040c2b7). Facts checked 18 Nov 2026 on Anthropic's live pages:
// Academy courses are free (Claude 101: 13 lessons, 2.5 hr; Building with the Claude API: 67 lessons, 9 hr);
// CCAR-F exam guide v1.1: 60 questions, 120 minutes, pass 720/1,000, 12 sample questions with explanations;
// exam $125 at Pearson, only for Claude Partner Network organisations; membership is free for any organisation
// bringing Claude to market. Screens are real screenshots (studio/remotion/public/guides/claude-certification/shots).
import React from 'react';
import {Img, interpolate, staticFile} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const CLAY = '#d97757', GREEN = '#3ddc84', INK = '#0d1117', CARD = '#161b22', LINE = '#30363d', MUTE = '#8b949e', SKY = '#58a6ff', GOLD = '#ffd166';
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
const ap = (t: number, at: number, d = 0.28) => ease((t - at) / d);
const shot = (n: string) => staticFile(`guides/claude-certification/shots/${n}.png`);
export type Cue = Record<string, number>;

const Frame: React.FC<{t: number; from: number; to: number; kicker: string; children: React.ReactNode}> = ({t, from, to, kicker, children}) => {
  if (t < from - 0.05 || t > to) return null;
  const a = interpolate(t, [from, from + 0.3, to - 0.2, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 150, left: 50, right: 50, height: 820, borderRadius: 34, background: INK, border: `2px solid ${LINE}`,
    boxShadow: '0 30px 80px rgba(0,0,0,.55)', padding: '28px 32px', fontFamily: F, color: '#fff', opacity: a, transform: `scale(${0.95 + 0.05 * ease((t - from) / 0.3)})`, transformOrigin: '50% 0%', overflow: 'hidden'}}>
    <div style={{fontSize: 22, letterSpacing: 2, fontWeight: 800, color: SKY, marginBottom: 18}}>{kicker}</div>
    {children}
  </div>;
};
const Chip: React.FC<{a: number; children: React.ReactNode; color?: string}> = ({a, children, color = LINE}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 12}px)`, fontSize: 28, fontWeight: 800, border: `2px solid ${color}`, borderRadius: 30, padding: '8px 20px', background: CARD}}>{children}</div>;
const Shot: React.FC<{a: number; src: string; h?: number; pos?: string}> = ({a, src, h = 330, pos = '50% 0%'}) =>
  <div style={{opacity: a, transform: `translateY(${(1 - a) * 16}px)`, borderRadius: 18, overflow: 'hidden', border: `2px solid ${LINE}`, height: h, background: '#fff'}}>
    <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos}} />
  </div>;
const Free: React.FC<{a: number}> = ({a}) => <div style={{opacity: a, transform: `scale(${0.6 + 0.4 * a}) rotate(-6deg)`, display: 'inline-block', background: GREEN, color: INK, fontWeight: 900, fontSize: 30, padding: '6px 18px', borderRadius: 12}}>FREE</div>;

export const Academy: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.academy} to={c.docs} kicker="STEP 1 · ANTHROPIC ACADEMY">
  {[[c.c101, 'academy-claude-101', 'Claude 101', '13 lessons · 2.5 hr'], [c.api, 'academy-api', 'Building with the Claude API', '67 lessons · 9 hr']].map(([at, img, name, meta]) =>
    <div key={img as string} style={{marginBottom: 22, opacity: ap(t, at as number)}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
        <div style={{fontSize: 36, fontWeight: 800}}>{name}</div><Free a={ap(t, (at as number) + 0.2)} />
      </div>
      <Shot a={ap(t, at as number)} src={shot(img as string)} h={250} />
      <div style={{fontSize: 24, color: MUTE, marginTop: 8}}>{meta}</div>
    </div>)}
</Frame>;

export const Docs: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.docs} to={c.guide} kicker="STEP 2 · THE DOCS">
  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
    {[[c.mcp, 'docs-mcp', 'MCP'], [c.skills, 'docs-skills', 'Agent Skills'], [c.apiDocs, 'docs-api', 'Claude API']].map(([at, img, name], i) =>
      <div key={img as string} style={{gridColumn: i === 2 ? '1 / span 2' : undefined, opacity: ap(t, at as number)}}>
        <div style={{fontSize: 32, fontWeight: 800, marginBottom: 8}}>{name}</div>
        <Shot a={ap(t, at as number)} src={shot(img as string)} h={i === 2 ? 250 : 230} />
      </div>)}
  </div>
  <div style={{marginTop: 22, textAlign: 'center', fontSize: 30, color: MUTE, opacity: ap(t, c.apiDocs + 0.3)}}>All free, all on Anthropic&apos;s own docs</div>
</Frame>;

export const Guide: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.guide} to={c.elig} kicker="STEP 3 · THE OFFICIAL EXAM GUIDE (FREE PDF)">
  <Shot a={ap(t, c.guide + 0.05)} src={shot('guide-cover')} h={250} />
  <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22}}>
    <Chip a={ap(t, c.q60)} color={GOLD}>60 questions</Chip>
    <Chip a={ap(t, c.q60 + 0.25)} color={GOLD}>120 minutes</Chip>
    <Chip a={ap(t, c.q60 + 0.5)}>Pass: 720 / 1,000</Chip>
  </div>
  <div style={{marginTop: 26, fontFamily: SERIF, fontSize: 64, lineHeight: 1.08, opacity: ap(t, c.samples, 0.4)}}>+ 12 sample questions,<br /><span style={{color: GREEN, fontStyle: 'italic'}}>answers explained</span></div>
</Frame>;

export const Eligibility: React.FC<{t: number; c: Cue}> = ({t, c}) => <Frame t={t} from={c.elig} to={c.solo} kicker="WHO CAN BOOK THE EXAM">
  <Shot a={ap(t, c.elig + 0.05)} src={shot('exam-page')} h={300} pos="50% 30%" />
  <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22}}>
    <Chip a={ap(t, c.elig + 0.3)} color={GOLD}>$125 at Pearson</Chip>
    <Chip a={ap(t, c.partner)} color={CLAY}>Claude Partner Network companies only</Chip>
  </div>
  <div style={{marginTop: 30, padding: '20px 24px', borderRadius: 20, border: `2px solid ${GREEN}`, background: '#0f2418', opacity: ap(t, c.joinFree)}}>
    <div style={{fontSize: 36, fontWeight: 800}}>Joining the network: <span style={{color: GREEN}}>free</span></div>
    <div style={{fontSize: 26, color: MUTE, marginTop: 6}}>for organisations bringing Claude to market</div>
  </div>
</Frame>;

// Hook: a paid-course receipt (no invented price: the amount is redacted, as in "Don't ask.")
export const Hook: React.FC<{t: number; to: number}> = ({t, to}) => {
  if (t > to) return null;
  const a = interpolate(t, [0, 0.25, to - 0.3, to], [0, 1, 1, 0], clamp);
  return <div style={{position: 'absolute', top: 130, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, fontFamily: F}}>
    <div style={{background: CLAY, color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: 3, padding: '6px 16px', borderRadius: 8}}>CLAUDE CERTIFICATION</div>
    <div style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.5)', marginTop: 10}}>Paid for prep?</div>
  </div>;
};
