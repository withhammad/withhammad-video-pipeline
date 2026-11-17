// PHONE reel (job 94d5af0523c0): mirroir-mcp lets Claude Code use a real iPhone through macOS iPhone Mirroring.
// Our own version of an owner-sent topic: his HeyGen voice clone (hammadbhat1234, free minutes), Blender 3D iPhone shots,
// real recordings of the official repo and site. Facts checked 17 Nov 2026 against github.com/jfarcand/mirroir-mcp.
// Policy: docs/VIDEO_PIPELINE_POLICY.md. The 0-3.4 s hook can be swapped for a 5-8 s avatar clip when credits allow.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import words from './words.json';

type W = {text: string; startMs: number; endMs: number};
const WORDS = words as W[];
export const FPS = 30;
export const TOTAL = 31.6;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const BLUE = '#3d8bff', SKY = '#7cc4ff', INK = '#070b1a', GREEN = '#3ddc84', RED = '#ff6b6b';
const cl = (x: number) => Math.max(0, Math.min(1, x));
const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const pop = (t: number, at: number, d = 0.3) => { const x = cl((t - at) / d); if (x <= 0) return 0; const c = 2.0; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const w = (i: number) => WORDS[i].startMs / 1000;

type Scene = {from: number; to: number; clip: string; dur: number; kind: '3d' | 'rec'; url?: string; zoom?: [number, number]; start?: number};
const S: Scene[] = [
  {from: 0, to: 3.4, clip: '3d_tap', dur: 3.0, kind: '3d'},
  {from: 3.4, to: 7.55, clip: 'r1_site', dur: 4.84, kind: 'rec', url: 'mirroir.dev'},
  {from: 7.55, to: 13.1, clip: 'r3_nojail', dur: 5.32, kind: 'rec', url: 'github.com/jfarcand/mirroir-mcp'},
  {from: 13.1, to: 16.65, clip: 'r4_gif', dur: 5.64, kind: 'rec', url: 'github.com/jfarcand/mirroir-mcp', zoom: [1.0, 1.08], start: 1.0},
  {from: 16.65, to: 18.25, clip: 'r5_install', dur: 5.2, kind: 'rec', url: 'github.com/jfarcand/mirroir-mcp', start: 1.6},
  {from: 18.25, to: 21.4, clip: '3d_tap', dur: 3.0, kind: '3d'},
  {from: 21.4, to: 24.95, clip: 'r6_chess', dur: 5.12, kind: 'rec', url: 'github.com/jfarcand/mirroir-mcp', zoom: [1.0, 1.08]},
  {from: 24.95, to: 28.75, clip: '3d_lock', dur: 3.0, kind: '3d'},
];
const CTA = 28.75;

const Clip: React.FC<{s: Scene}> = ({s}) => {
  const t = useCurrentFrame() / FPS; const len = s.to - s.from;
  const st = s.start ?? 0; const rate = Math.min(1, (s.dur - st) / len); const sf = Math.round(st * FPS);
  const z = s.zoom ? s.zoom[0] + (s.zoom[1] - s.zoom[0]) * eo(t / len) : 1;
  const inA = cl(t / 0.18);
  if (s.kind === '3d') return <AbsoluteFill style={{opacity: inA}}><OffthreadVideo muted src={staticFile(`phone/${s.clip}.mp4`)} playbackRate={rate} /></AbsoluteFill>;
  return <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 18%, #16306e, ${INK} 66%)`, opacity: inA}}>
    <div style={{position: 'absolute', left: 40, top: 300, width: 1000, height: 1250 + 64, borderRadius: 30, overflow: 'hidden', background: '#fff',
      boxShadow: `0 40px 90px #000a, 0 0 120px ${BLUE}33`, transform: `scale(${0.96 + 0.04 * eo(t / 0.3)})`}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#e9edf5', borderBottom: '1px solid #cfd6e4'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <div style={{flex: 1, marginLeft: 14, height: 40, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', fontFamily: F, fontWeight: 600, fontSize: 24, color: '#3b4660'}}>{s.url}</div>
      </div>
      <div style={{width: 1000, height: 1250, overflow: 'hidden'}}>
        <div style={{transform: `scale(${z})`, transformOrigin: '50% 30%'}}><OffthreadVideo muted src={staticFile(`phone/${s.clip}.mp4`)} startFrom={sf} playbackRate={rate} style={{width: 1000}} /></div>
      </div>
    </div>
  </AbsoluteFill>;
};

const Chip: React.FC<{t: number; at: number; children: React.ReactNode; bg?: string; color?: string; size?: number}> = ({t, at, children, bg = '#ffffff', color = INK, size = 40}) => {
  const p = pop(t, at); if (p <= 0) return null;
  return <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, background: bg, color, fontFamily: F, fontWeight: 800, fontSize: size, padding: `${size * 0.32}px ${size * 0.7}px`,
    borderRadius: size, boxShadow: '0 12px 30px #0007', transform: `scale(${p})`, whiteSpace: 'nowrap'}}>{children}</div>;
};
const Row: React.FC<{top: number; children: React.ReactNode}> = ({top, children}) => <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', padding: '0 40px'}}>{children}</div>;

const Overlays: React.FC<{t: number}> = ({t}) => {
  const hookA = t < 3.4 ? cl(1 - (t - 3.1) / 0.3) : 0;
  const typed = 'npx -y mirroir-mcp install'; const n = Math.floor(cl((t - 16.86) / 0.9) * typed.length);
  const ask = 'Add a dentist appointment next Tuesday at 2pm'; const an = Math.floor(cl((t - 18.6) / 1.4) * ask.length);
  return <>
    {t < 3.4 && <div style={{position: 'absolute', top: 150, left: 0, right: 0, textAlign: 'center', opacity: hookA}}>
      <div style={{fontFamily: F, fontWeight: 800, fontSize: 82, color: '#fff', lineHeight: 1.02, textShadow: '0 6px 30px #000c'}}>Claude Code</div>
      <div style={{display: 'inline-block', marginTop: 14, background: BLUE, color: '#fff', fontFamily: F, fontWeight: 800, fontSize: 70, padding: '6px 30px', borderRadius: 22, boxShadow: `0 0 50px ${BLUE}aa`, transform: `scale(${pop(t, 0.5)})`}}>uses your iPhone</div>
    </div>}
    {t >= 3.4 && t < 7.55 && <Row top={150}><Chip t={t} at={w(11) - 0.1}>mirroir-mcp</Chip><Chip t={t} at={w(13)} bg={GREEN}>free</Chip><Chip t={t} at={w(15)} bg={SKY}>open source · Apache-2.0</Chip></Row>}
    {t >= 7.55 && t < 13.1 && <Row top={150}><Chip t={t} at={w(22)} bg={SKY}>iPhone Mirroring on your Mac</Chip><Chip t={t} at={w(27)} bg={RED} color="#fff">✕ jailbreak</Chip><Chip t={t} at={w(29)} bg={RED} color="#fff">✕ Xcode</Chip><Chip t={t} at={w(30)} bg="#fff">nothing on the phone</Chip></Row>}
    {t >= 13.1 && t < 16.65 && <Row top={150}><Chip t={t} at={w(36)} bg="#fff">reads the screen</Chip><Chip t={t} at={w(40)} bg={BLUE} color="#fff">taps</Chip><Chip t={t} at={w(41)} bg={BLUE} color="#fff">swipes</Chip><Chip t={t} at={w(43)} bg={BLUE} color="#fff">types</Chip></Row>}
    {t >= 16.65 && t < 18.25 && <Row top={170}><div style={{background: '#0d1117', color: '#e6edf3', fontFamily: 'CpMono, Menlo, monospace', fontSize: 44, padding: '22px 30px', borderRadius: 20, border: `2px solid ${BLUE}`, boxShadow: `0 0 50px ${BLUE}66`}}>
      <span style={{color: GREEN}}>$ </span>{typed.slice(0, n)}<span style={{opacity: Math.floor(t * 3) % 2 ? 1 : 0}}>▍</span></div></Row>}
    {t >= 18.25 && t < 21.4 && <div style={{position: 'absolute', top: 150, left: 60, right: 60, display: 'flex', gap: 18, alignItems: 'flex-start', opacity: eo((t - 18.4) / 0.25)}}>
      <div style={{width: 76, height: 76, borderRadius: 20, background: '#d97757', color: '#fff', fontFamily: F, fontWeight: 800, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>✳</div>
      <div style={{background: '#ffffffee', color: INK, fontFamily: F, fontWeight: 700, fontSize: 44, lineHeight: 1.2, padding: '20px 26px', borderRadius: 24}}>{ask.slice(0, an)}</div></div>}
    {t >= 21.4 && t < 24.95 && <Row top={150}><Chip t={t} at={w(64)} bg="#fff">test your own app</Chip><Chip t={t} at={w(67)} bg={GREEN}>real device</Chip><Chip t={t} at={w(73)} bg={SKY}>hand off the boring stuff</Chip></Row>}
    {t >= 24.95 && t < CTA && <Row top={150}><Chip t={t} at={w(78)} bg={GREEN}>read-only by default</Chip><Chip t={t} at={w(84)} bg={RED} color="#fff">🔒 block Wallet + bank apps</Chip></Row>}
  </>;
};

// caption groups: up to 3 words, always breaking after sentence or clause punctuation
const CHUNKS: [number, number][] = (() => { const out: [number, number][] = []; let st = 0;
  WORDS.forEach((x, i) => { if (i + 1 - st >= 3 || /[.,!?]$/.test(x.text) || i === WORDS.length - 1) { out.push([st, i + 1]); st = i + 1; } }); return out; })();
const Captions: React.FC<{t: number}> = ({t}) => {
  if (t >= CTA) return null;
  const ms = t * 1000; let i = WORDS.findIndex((x) => x.startMs > ms) - 1; if (i < 0) i = ms > 0 ? WORDS.length - 1 : 0;
  const ci = CHUNKS.findIndex((c) => i >= c[0] && i < c[1]); const chunk = ci < 0 ? [] : WORDS.slice(CHUNKS[ci][0], CHUNKS[ci][1]);
  if (!chunk.length || ms > chunk[chunk.length - 1].endMs + 400) return null;
  return <div style={{position: 'absolute', top: 1560, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{background: '#000000b0', borderRadius: 22, padding: '14px 26px', fontFamily: F, fontWeight: 800, fontSize: 64, display: 'flex', gap: 18}}>
      {chunk.map((x, k) => <span key={k} style={{color: ms >= x.startMs ? (/iPhone|Claude|PHONE|phone|jailbreak|Xcode|free|Wallet/i.test(x.text) ? SKY : '#fff') : '#ffffff66'}}>{x.text.replace(/[.,]$/, '')}</span>)}
    </div></div>;
};

const Cta: React.FC<{t: number}> = ({t}) => {
  const k = t - CTA; if (k < 0) return null;
  const typed = 'PHONE'.slice(0, Math.floor(cl((k - 0.35) / 0.6) * 5)); const dm = pop(k, 1.4);
  return <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 30%, #16306e, ${INK} 70%)`, opacity: eo(k / 0.25), fontFamily: F}}>
    <div style={{position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', color: '#fff'}}>
      <div style={{fontFamily: SERIF, fontSize: 100, lineHeight: 1}}>Comment</div>
      <div style={{margin: '40px auto 0', width: 760, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 34px', gap: 20}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${BLUE}, ${SKY})`}} />
        <div style={{flex: 1, textAlign: 'left', color: INK, fontWeight: 800, fontSize: 60, letterSpacing: 3}}>{typed}<span style={{opacity: typed.length < 5 && Math.floor(k * 3) % 2 ? 1 : 0}}>|</span></div>
      </div>
      <div style={{margin: '60px auto 0', width: 820, transform: `scale(${dm})`, background: '#ffffff12', border: '2px solid #ffffff30', borderRadius: 30, padding: '26px 30px', textAlign: 'left', display: 'flex', gap: 22, alignItems: 'center'}}>
        <div style={{width: 80, height: 80, borderRadius: 40, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 34}}>WH</div>
        <div><div style={{fontSize: 30, color: SKY, fontWeight: 700}}>@withhammad.ai · DM</div><div style={{fontSize: 40, fontWeight: 800, marginTop: 4}}>The full mirroir-mcp setup →</div></div>
      </div>
    </div>
  </AbsoluteFill>;
};

export const Reel: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <AbsoluteFill style={{background: INK}}>
    {S.map((s, i) => <Sequence key={i} from={Math.round(s.from * FPS)} durationInFrames={Math.round((s.to - s.from) * FPS)}><Clip s={s} /></Sequence>)}
    <Overlays t={t} />
    <Captions t={t} />
    <Cta t={t} />
    <Audio src={staticFile('phone/mix.wav')} />
  </AbsoluteFill>;
};
