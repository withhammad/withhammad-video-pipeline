import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ReelCover} from './ReelCover';
import {glowJobs, LOGO} from './glowCovers';
import {FONT} from './tokens';

// The guide-document carousel, a 1:1 copy of the AI Central template (docs/profile-seo/ref-aicentral/README.md)
// in our colours: paper page, header bar (logo | guide title | arrow), footer bar (free guides at withhammad.com),
// one item per page with a torn-paper number badge, two bullets, a real screenshot and a "Start ... here" callout.
// 1080x1350, the same pixels for Instagram (4:5) and the LinkedIn PDF.

const PAPER = '#F3F1EC', INK = '#0E1320', NAVY = '#06122E', BLUE = '#1F5EFF', GREY = '#8A8F99';
const W = 1080, H = 1350;

type Rich = string; // "*word*" -> blue
export type GuidePage =
  | {kind: 'cover'; line1: string; line2: string; sub: string; hero: string; sticker?: string; ghost?: string}
  | {kind: 'promise'; title: Rich; setup: {label: string; url: string}; get: string; shot: string; callout?: string}
  | {kind: 'item'; n: number; title: string; what: string; bestFor: string; shot: string; callout: string; meta: string}
  | {kind: 'more'; title: Rich; sub: string; items: {title: string; meta: string}[]}
  | {kind: 'library'; title: string; sub: string; rows: {level: string; guides: {job: string; title: string}[]}[]}
  | {kind: 'cta'; line1: string; line2: string; sub: string; bullets: string[]; stamp1: string; stamp2: string};
export type GuideDocProps = {pages: GuidePage[]; index: number; docTitle: string; footUrl?: string};

const sans = (size: number, weight = 800, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({fontFamily: FONT.sans, fontSize: size, fontWeight: weight, color: INK, lineHeight: 1.08, letterSpacing: size > 60 ? -2 : -0.3, ...extra});

const rich = (text: Rich) => text.split(/(\*[^*]+\*)/).map((p, i) =>
  p.startsWith('*') ? <span key={i} style={{color: BLUE}}>{p.slice(1, -1)}</span> : <React.Fragment key={i}>{p}</React.Fragment>);

const src = (s: string) => (s.startsWith('http') || s.startsWith('data:') ? s : staticFile(s));

// deterministic rough edge for the torn-paper badge and the stamp
const torn = (seed: number, steps = 18, amp = 2.6) => {
  let x = seed * 9301 + 49297;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const pts: string[] = [];
  const edge = (fx: (t: number) => [number, number]) => { for (let i = 0; i < steps; i++) { const [a, b] = fx(i / steps); pts.push(`${a}% ${b}%`); } };
  edge(t => [t * 100, rnd() * amp]);
  edge(t => [100 - rnd() * amp, t * 100]);
  edge(t => [100 - t * 100, 100 - rnd() * amp]);
  edge(t => [rnd() * amp, 100 - t * 100]);
  return `polygon(${pts.join(',')})`;
};

const Paper: React.FC = () => <>
  <AbsoluteFill style={{background: PAPER}}/>
  <AbsoluteFill style={{background: 'radial-gradient(circle at 18% 22%, rgba(0,0,0,.035), transparent 40%), radial-gradient(circle at 82% 70%, rgba(0,0,0,.04), transparent 45%), radial-gradient(circle at 60% 12%, rgba(255,255,255,.6), transparent 35%)'}}/>
  <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0"/></filter>
    <rect width={W} height={H} filter="url(#grain)"/>
  </svg>
</>;

const Arrow: React.FC<{size?: number}> = ({size = 34}) =>
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="square"/></svg>;

const Wordmark: React.FC<{size?: number; invert?: boolean}> = ({size = 22, invert}) =>
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.35, padding: `${size * 0.3}px ${size * 0.5}px`, border: `2px solid ${NAVY}`,
    background: invert ? NAVY : '#fff'}}>
    <div style={{width: size * 1.05, height: size * 1.05, background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...sans(size * 0.8, 900, {color: '#fff', letterSpacing: 0})}}>W</div>
    <div style={sans(size, 900, {color: invert ? '#fff' : NAVY, letterSpacing: 1})}>WITHHAMMAD</div>
  </div>;

const Header: React.FC<{title: string}> = ({title}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top: 22, height: 56, display: 'flex', alignItems: 'stretch', gap: 12, padding: '0 26px',
    borderTop: `2px solid ${NAVY}`, borderBottom: `2px solid ${NAVY}`, paddingTop: 4, paddingBottom: 4}}>
    <div style={{display: 'flex', alignItems: 'center'}}><Wordmark size={18}/></div>
    <div style={{flex: 1, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <span style={sans(22, 700, {color: '#fff', textDecoration: 'underline', textUnderlineOffset: 4})}>{title}</span></div>
    <div style={{width: 64, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Arrow size={30}/></div>
  </div>;

const Footer: React.FC<{url: string}> = ({url}) =>
  <div style={{position: 'absolute', left: 0, right: 0, top: 1262, height: 62}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 14, height: 34, background: BLUE}}/>
    <div style={{position: 'relative', margin: '0 auto', width: 'fit-content', display: 'flex', alignItems: 'stretch', height: 62, border: `2px solid ${NAVY}`}}>
      <div style={{background: '#fff', padding: '0 22px', display: 'flex', alignItems: 'center', ...sans(24, 600, {letterSpacing: 0.5})}}>FREE AI GUIDES DAILY AT</div>
      <div style={{background: NAVY, padding: '0 22px', display: 'flex', alignItems: 'center', ...sans(24, 800, {color: '#fff', textDecoration: 'underline', textUnderlineOffset: 4, letterSpacing: 0.5})}}>{url}</div>
      <div style={{background: '#fff', width: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `2px solid ${NAVY}`}}>
        <svg width={34} height={34} viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7" stroke={NAVY} strokeWidth={2.6} fill="none" strokeLinecap="square"/></svg></div>
    </div>
  </div>;

const Badge: React.FC<{n: number}> = ({n}) =>
  <div style={{width: 200, height: 210, transform: 'rotate(-4deg)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.25))'}}>
    <div style={{position: 'absolute', inset: 0, background: '#fff', clipPath: torn(n + 3, 16, 3.4)}}/>
    <div style={{position: 'absolute', inset: 12, background: BLUE, clipPath: torn(n + 11, 14, 2.2), display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 0 0 4px rgba(0,0,0,.08)'}}>
      <span style={sans(n > 9 ? 120 : 150, 900, {color: '#fff', WebkitTextStroke: `5px ${NAVY}`, paintOrder: 'stroke', letterSpacing: -4})}>{n}</span>
    </div>
  </div>;

const Dot: React.FC = () => <div style={{width: 26, height: 26, borderRadius: 13, background: BLUE, flex: 'none', marginTop: 10,
  boxShadow: `inset -3px -3px 0 rgba(0,0,0,.18)`}}/>;

const Bullet: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 38}) =>
  <div style={{display: 'flex', gap: 22, alignItems: 'flex-start'}}><Dot/><div style={sans(size, 500, {lineHeight: 1.22, letterSpacing: -0.4, color: '#3A4150'})}>{children}</div></div>;

const Shot: React.FC<{src: string; width: number; height: number; callout?: string}> = ({src: s, width, height, callout}) =>
  <div style={{position: 'relative', width, height: height + 40}}>
    <div style={{width, height, borderRadius: 18, overflow: 'hidden', border: `3px solid ${INK}`, boxShadow: '0 18px 40px rgba(14,19,32,.22)', background: '#fff'}}>
      <Img src={src(s)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left'}}/></div>
    {callout ? <div style={{position: 'absolute', right: -14, bottom: 0, display: 'flex', alignItems: 'center', gap: 14, background: '#fff',
      border: `3px solid ${INK}`, borderRadius: 40, padding: '14px 28px', boxShadow: '0 8px 18px rgba(0,0,0,.18)'}}>
      <div style={{width: 34, height: 34, background: '#D97757', WebkitMaskImage: `url(${LOGO.claude.mask})`, maskImage: `url(${LOGO.claude.mask})`,
        WebkitMaskSize: 'contain', maskSize: 'contain'}}/>
      <span style={sans(32, 500, {letterSpacing: -0.3})}><span style={{color: BLUE, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 5}}>
        {callout.split(' ')[0]}</span> {callout.split(' ').slice(1).join(' ')}</span>
      <svg width={40} height={40} viewBox="0 0 24 24" style={{position: 'absolute', left: -26, bottom: -26}}>
        <path d="M5 3l14 7-6 2 4 7-3 1.5-4-7-5 4z" fill="#fff" stroke={INK} strokeWidth={1.6} strokeLinejoin="round"/></svg>
    </div> : null}
  </div>;

const Cover: React.FC<{p: Extract<GuidePage, {kind: 'cover'}>}> = ({p}) => <>
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.5}}>
    <defs><pattern id="g" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0H0V54" fill="none" stroke="rgba(6,18,46,.07)" strokeWidth={1.5}/></pattern></defs>
    <rect width={W} height={H} fill="url(#g)"/></svg>
  <div style={{position: 'absolute', top: 54, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><Wordmark size={30}/></div>
  <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center'}}>
    <div style={sans(148, 900, {letterSpacing: -5})}>{p.line1}</div>
    <div style={sans(148, 900, {letterSpacing: -5, color: BLUE, marginTop: 4})}>{p.line2}</div>
    <div style={sans(40, 500, {marginTop: 26, color: '#2B3140', letterSpacing: -0.5})}>{p.sub}</div>
  </div>
  {p.ghost ? <div style={{position: 'absolute', left: 0, right: 0, bottom: -70, textAlign: 'center', ...sans(330, 900, {color: 'transparent',
    WebkitTextStroke: `3px rgba(6,18,46,.16)`, letterSpacing: -12})}}>{p.ghost}</div> : null}
  <div style={{position: 'absolute', left: 300, top: 640, width: 480, height: 480, transform: 'rotate(-9deg)', borderRadius: 110,
    background: 'linear-gradient(150deg, #F0A07F 0%, #D97757 45%, #B4532F 100%)', boxShadow: '0 40px 70px rgba(80,30,10,.45), inset 0 -18px 0 rgba(0,0,0,.18), inset 0 14px 0 rgba(255,255,255,.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{width: 300, height: 300, background: '#fff', WebkitMaskImage: `url(${src(p.hero)})`, maskImage: `url(${src(p.hero)})`, WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', filter: 'drop-shadow(0 6px 0 rgba(0,0,0,.2))'}}/>
  </div>
  {p.sticker ? <div style={{position: 'absolute', left: 120, top: 980, transform: 'rotate(-12deg)', background: '#fff', border: `4px solid ${NAVY}`, borderRadius: 18,
    padding: '18px 26px', boxShadow: '0 16px 30px rgba(0,0,0,.25)'}}>
    <div style={{background: BLUE, padding: '6px 14px', ...sans(26, 900, {color: '#fff', letterSpacing: 1})}}>{p.sticker}</div>
    <div style={{height: 10, width: 200, background: '#D6DBE6', marginTop: 14, borderRadius: 5}}/>
    <div style={{height: 10, width: 150, background: '#D6DBE6', marginTop: 10, borderRadius: 5}}/>
  </div> : null}
</>;

const Promise_: React.FC<{p: Extract<GuidePage, {kind: 'promise'}>}> = ({p}) =>
  <div style={{position: 'absolute', left: 110, right: 110, top: 170}}>
    <div style={sans(78, 800)}>{rich(p.title)}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 44}}>
      <Bullet size={36}><b>The setup is inside:</b> <span style={{textDecoration: 'underline', textUnderlineOffset: 5}}>{p.setup.url}</span></Bullet>
      <Bullet size={36}><b>What you get:</b> {p.get}</Bullet>
    </div>
    <div style={{marginTop: 54}}><Shot src={p.shot} width={860} height={520} callout={p.callout}/></div>
  </div>;

const Item: React.FC<{p: Extract<GuidePage, {kind: 'item'}>}> = ({p}) =>
  <div style={{position: 'absolute', left: 100, right: 100, top: 150}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
      <div style={{position: 'relative', width: 200, height: 210, flex: 'none'}}><Badge n={p.n}/></div>
      <div style={sans(p.title.length > 20 ? 72 : 88, 800)}>{p.title}</div>
    </div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 48, paddingLeft: 10}}>
      <Bullet>{p.what}</Bullet>
      <Bullet><b style={{color: INK, fontWeight: 900}}>Best for:</b> {p.bestFor}</Bullet>
    </div>
    <div style={{position: 'absolute', top: 470, left: 10}}><Shot src={p.shot} width={860} height={480} callout={p.callout}/></div>
    <div style={{position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', ...sans(30, 500, {color: GREY, letterSpacing: 0})}}>{p.meta}</div>
  </div>;

const More: React.FC<{p: Extract<GuidePage, {kind: 'more'}>}> = ({p}) =>
  <div style={{position: 'absolute', left: 110, right: 110, top: 170}}>
    <div style={sans(84, 800)}>{rich(p.title)}</div>
    <div style={sans(36, 500, {marginTop: 18, color: '#2B3140'})}>{p.sub}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40}}>
      {p.items.map((it, i) => <Bullet key={i} size={33}><b>{it.title}</b><br/><span style={{color: GREY, fontSize: 26}}>{it.meta}</span></Bullet>)}
    </div>
  </div>;

const Book: React.FC<{job: string}> = ({job}) => {
  const g = glowJobs.find(j => j.job === job);
  if (!g) throw new Error(`no glow cover for ${job}`);
  const w = 132, scale = w / 1080;
  return <div style={{width: w, height: 1920 * scale * 0.72, overflow: 'hidden', borderRadius: 6, boxShadow: '6px 8px 0 rgba(6,18,46,.25), 0 10px 20px rgba(0,0,0,.25)',
    border: `2px solid ${NAVY}`, position: 'relative'}}>
    <div style={{width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: -1920 * scale * 0.06}}>
      <ReelCover {...g.cover}/></div></div>;
};

const Library: React.FC<{p: Extract<GuidePage, {kind: 'library'}>}> = ({p}) => {
  const bar = [`#7FA6FF`, BLUE, NAVY];
  return <div style={{position: 'absolute', left: 80, right: 80, top: 120, bottom: 110, background: '#FBFAF7', border: `3px solid ${NAVY}`, borderRadius: 22,
    padding: '34px 44px', boxShadow: '0 20px 40px rgba(0,0,0,.18)'}}>
    <div style={sans(72, 900)}>{p.title}</div>
    <div style={sans(26, 600, {letterSpacing: 6, color: GREY, marginTop: 10})}>{p.sub}</div>
    {p.rows.map((r, i) => <div key={i} style={{marginTop: 26}}>
      <div style={{background: bar[i % 3], borderRadius: 8, padding: '10px 18px', display: 'flex', justifyContent: 'space-between'}}>
        <span style={sans(30, 800, {color: '#fff'})}>{r.level}</span>
        <span style={sans(22, 800, {color: '#fff', textDecoration: 'underline', alignSelf: 'center'})}>SEE ALL &gt;&gt;&gt;</span></div>
      <div style={{display: 'flex', gap: 30, marginTop: 18}}>
        {r.guides.map(gd => <div key={gd.job} style={{flex: 1, display: 'flex', gap: 18, alignItems: 'center'}}>
          <div style={{flex: 1}}>
            <div style={sans(28, 800, {lineHeight: 1.12})}>{gd.title}</div>
            <div style={{marginTop: 12, display: 'inline-block', background: BLUE, padding: '5px 12px', ...sans(20, 800, {color: '#fff', textDecoration: 'underline'})}}>Free guide</div>
          </div>
          <Book job={gd.job}/></div>)}
      </div></div>)}
  </div>;
};

const Cta: React.FC<{p: Extract<GuidePage, {kind: 'cta'}>}> = ({p}) =>
  <div style={{position: 'absolute', left: 110, right: 90, top: 210}}>
    <div style={sans(82, 800)}>{p.line1}<br/>{p.line2}</div>
    <div style={sans(54, 400, {marginTop: 34, color: '#2B3140'})}>{p.sub}</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 20, marginTop: 44}}>{p.bullets.map((b, i) => <Bullet key={i} size={42}>{b}</Bullet>)}</div>
    <div style={{marginTop: 90, marginLeft: -30, width: 920, transform: 'rotate(-2.5deg)', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.25))'}}>
      <div style={{background: NAVY, padding: 8, clipPath: torn(7, 22, 2)}}>
        <div style={{background: BLUE, clipPath: torn(19, 22, 1.6), padding: '34px 30px', textAlign: 'center'}}>
          <div style={sans(52, 800, {color: '#fff'})}>{p.stamp1}</div>
          <div style={sans(p.stamp2.length > 22 ? 42 : 52, 900, {color: '#fff', textDecoration: 'underline', textUnderlineOffset: 8, marginTop: 6})}>{p.stamp2}</div>
        </div></div></div>
  </div>;

export const GuideDoc: React.FC<GuideDocProps> = ({pages, index, docTitle, footUrl = 'WITHHAMMAD.COM/RESOURCES'}) => {
  const p = pages[index];
  return <AbsoluteFill style={{width: W, height: H, overflow: 'hidden'}}>
    <Paper/>
    {p.kind === 'cover' ? <Cover p={p}/> : <Header title={docTitle}/>}
    {p.kind === 'promise' ? <Promise_ p={p}/> : null}
    {p.kind === 'item' ? <Item p={p}/> : null}
    {p.kind === 'more' ? <More p={p}/> : null}
    {p.kind === 'library' ? <Library p={p}/> : null}
    {p.kind === 'cta' ? <Cta p={p}/> : null}
    {p.kind === 'cover' ? null : <Footer url={footUrl}/>}
  </AbsoluteFill>;
};
