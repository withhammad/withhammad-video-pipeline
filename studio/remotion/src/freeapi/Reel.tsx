// FREE-API reel (job 8d98760c9650): the free AI API options that still work (17 Nov 2026), merged from two owner-sent refs.
// The famous GitHub list (cheahjs/free-llm-api-resources) now returns 404, and Apinex failed our fact-check, so neither is
// promoted. Footage = recordings of each provider's official page. His HeyGen voice clone (1234, free minutes).
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import words from './words.json';

type W = {text: string; startMs: number; endMs: number};
const WORDS = words as W[];
export const FPS = 30;
export const TOTAL = 36.8;
const F = 'CpInter, -apple-system, Arial', SERIF = 'CpSerif, Georgia, serif';
const BLUE = '#3d8bff', SKY = '#7cc4ff', INK = '#070b1a', GREEN = '#3ddc84', RED = '#ff6b6b';
const cl = (x: number) => Math.max(0, Math.min(1, x));
const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const pop = (t: number, at: number, d = 0.3) => { const x = cl((t - at) / d); if (x <= 0) return 0; const c = 2.0; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const w = (i: number) => WORDS[i].startMs / 1000;

type Scene = {from: number; to: number; clip: string; dur: number; kind: '3d' | 'rec'; url?: string; zoom?: [number, number]; start?: number};
const S: Scene[] = [
  {from: 4.0, to: 7.0, clip: 'r1_dead', dur: 6.88, kind: 'rec', url: 'github.com/cheahjs/free-llm-api-resources'},
  {from: 8.25, to: 13.15, clip: 'r2_openrouter', dur: 7.56, kind: 'rec', url: 'openrouter.ai/docs/api-reference/limits', zoom: [1.0, 1.1]},
  {from: 13.15, to: 18.85, clip: 'r3_aistudio', dur: 7.0, kind: 'rec', url: 'ai.google.dev/gemini-api/docs/pricing', zoom: [1.0, 1.08]},
  {from: 18.85, to: 21.85, clip: 'r4_groq', dur: 6.88, kind: 'rec', url: 'console.groq.com/docs/rate-limits'},
  {from: 21.85, to: 24.6, clip: 'r5_nvidia', dur: 5.32, kind: 'rec', url: 'build.nvidia.com'},
  {from: 24.6, to: 27.9, clip: 'r6_ollama', dur: 6.88, kind: 'rec', url: 'ollama.com'},
];
const CTA = 32.8;

const Clip: React.FC<{s: Scene}> = ({s}) => {
  const t = useCurrentFrame() / FPS; const len = s.to - s.from;
  const st = s.start ?? 0; const rate = Math.min(1, (s.dur - st) / len); const sf = Math.round(st * FPS);
  const z = s.zoom ? s.zoom[0] + (s.zoom[1] - s.zoom[0]) * eo(t / len) : 1;
  const inA = cl(t / 0.18);
  if (s.kind === '3d') return <AbsoluteFill style={{opacity: inA}}><OffthreadVideo muted src={staticFile(`freeapi/${s.clip}.mp4`)} playbackRate={rate} /></AbsoluteFill>;
  return <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 18%, #16306e, ${INK} 66%)`, opacity: inA}}>
    <div style={{position: 'absolute', left: 40, top: 300, width: 1000, height: 1250 + 64, borderRadius: 30, overflow: 'hidden', background: '#fff',
      boxShadow: `0 40px 90px #000a, 0 0 120px ${BLUE}33`, transform: `scale(${0.96 + 0.04 * eo(t / 0.3)})`}}>
      <div style={{height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', background: '#e9edf5', borderBottom: '1px solid #cfd6e4'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <div style={{flex: 1, marginLeft: 14, height: 40, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 18px', fontFamily: F, fontWeight: 600, fontSize: 24, color: '#3b4660'}}>{s.url}</div>
      </div>
      <div style={{width: 1000, height: 1250, overflow: 'hidden'}}>
        <div style={{transform: `scale(${z})`, transformOrigin: '50% 30%'}}><OffthreadVideo muted src={staticFile(`freeapi/${s.clip}.mp4`)} startFrom={sf} playbackRate={rate} style={{width: 1000}} /></div>
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
  const card = (from: number, to: number) => t >= from && t < to;
  const bg = (a: number) => <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 25%, #16306e, ${INK} 70%)`, opacity: a}} />;
  return <>
    {card(0, 4.0) && <>{bg(1)}<div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center', fontFamily: F, color: '#fff'}}>
      <div style={{fontSize: 74, fontWeight: 800, lineHeight: 1.05}}>Stop paying for<br />AI API keys</div>
      <div style={{display: 'inline-block', marginTop: 40, background: GREEN, color: INK, fontWeight: 800, fontSize: 150, padding: '6px 50px', borderRadius: 40, transform: `scale(${pop(t, 0.6)}) rotate(-4deg)`}}>$0</div>
      <div style={{marginTop: 40, fontSize: 46, fontWeight: 800, color: SKY, opacity: eo((t - 2.3) / 0.3)}}>the legit free ones</div></div></>}
    {card(4.0, 7.0) && <Row top={150}><Chip t={t} at={w(14)} bg="#fff">the famous GitHub list</Chip><Chip t={t} at={w(19)} bg={RED} color="#fff">404: link is dead</Chip></Row>}
    {card(7.0, 8.25) && <>{bg(1)}<div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontSize: 120, color: '#fff', transform: `scale(${0.9 + 0.1 * eo((t - 7) / 0.3)})`}}>What still works</div></>}
    {card(8.25, 13.15) && <Row top={150}><Chip t={t} at={w(26)} bg="#fff">OpenRouter</Chip><Chip t={t} at={w(29)} bg={SKY}>50 / day free</Chip><Chip t={t} at={w(34)} bg={GREEN}>1,000 / day after $10</Chip></Row>}
    {card(13.15, 18.85) && <Row top={150}><Chip t={t} at={w(40)} bg="#fff">Google AI Studio</Chip><Chip t={t} at={w(43)} bg={GREEN}>Gemini free tier</Chip><Chip t={t} at={w(48)} bg={RED} color="#fff">free prompts improve their products</Chip></Row>}
    {card(18.85, 21.85) && <Row top={150}><Chip t={t} at={w(57)} bg="#fff">Groq</Chip><Chip t={t} at={w(58)} bg={SKY}>⚡ very fast</Chip><Chip t={t} at={w(61)} bg={GREEN}>free daily limits</Chip></Row>}
    {card(21.85, 24.6) && <Row top={150}><Chip t={t} at={w(64)} bg="#fff">NVIDIA build</Chip><Chip t={t} at={w(67)} bg={GREEN}>free endpoints to prototype</Chip></Row>}
    {card(24.6, 27.9) && <Row top={150}><Chip t={t} at={w(77)} bg="#fff">Ollama</Chip><Chip t={t} at={w(79)} bg={GREEN}>runs on your computer</Chip><Chip t={t} at={w(75)} bg={SKY}>fully private</Chip></Row>}
    {card(27.9, CTA) && <>{bg(1)}<div style={{position: 'absolute', top: 420, left: 70, right: 70, fontFamily: F, color: '#fff', textAlign: 'center'}}>
      <div style={{fontSize: 120}}>🚩</div>
      <div style={{fontSize: 64, fontWeight: 800, marginTop: 10, transform: `scale(${pop(t, w(88))})`}}>"Claude, 40× cheaper"</div>
      <div style={{marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, fontSize: 40, fontWeight: 800, opacity: eo((t - w(93)) / 0.3)}}>
        <span style={{background: '#fff', color: INK, padding: '10px 22px', borderRadius: 20}}>your code</span><span>→</span><span style={{background: RED, padding: '10px 22px', borderRadius: 20}}>unknown proxy</span></div></div></>}
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
      {chunk.map((x, k) => <span key={k} style={{color: ms >= x.startMs ? (/free|API|dead|catch|private|cheaper|Claude/i.test(x.text) ? SKY : '#fff') : '#ffffff66'}}>{x.text.replace(/[.,]$/, '')}</span>)}
    </div></div>;
};

const Cta: React.FC<{t: number}> = ({t}) => {
  const k = t - CTA; if (k < 0) return null;
  const typed = 'API'.slice(0, Math.floor(cl((k - 0.35) / 0.5) * 3)); const dm = pop(k, 1.4);
  return <AbsoluteFill style={{background: `radial-gradient(110% 70% at 50% 30%, #16306e, ${INK} 70%)`, opacity: eo(k / 0.25), fontFamily: F}}>
    <div style={{position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', color: '#fff'}}>
      <div style={{fontFamily: SERIF, fontSize: 100, lineHeight: 1}}>Comment</div>
      <div style={{margin: '40px auto 0', width: 760, height: 120, borderRadius: 60, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 34px', gap: 20}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${BLUE}, ${SKY})`}} />
        <div style={{flex: 1, textAlign: 'left', color: INK, fontWeight: 800, fontSize: 60, letterSpacing: 3}}>{typed}<span style={{opacity: typed.length < 3 && Math.floor(k * 3) % 2 ? 1 : 0}}>|</span></div>
      </div>
      <div style={{margin: '60px auto 0', width: 820, transform: `scale(${dm})`, background: '#ffffff12', border: '2px solid #ffffff30', borderRadius: 30, padding: '26px 30px', textAlign: 'left', display: 'flex', gap: 22, alignItems: 'center'}}>
        <div style={{width: 80, height: 80, borderRadius: 40, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 34}}>WH</div>
        <div><div style={{fontSize: 30, color: SKY, fontWeight: 700}}>@withhammad.ai · DM</div><div style={{fontSize: 40, fontWeight: 800, marginTop: 4}}>The full free-API list + setup →</div></div>
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
    <Audio src={staticFile('freeapi/mix.wav')} />
  </AbsoluteFill>;
};
