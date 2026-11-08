import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import type {Caption} from '@remotion/captions';
import {fontsReady} from '../fonts';
import rawCaptions from './captions.json';
import avatarMap from './avatar-map.json';
import retime from './retime.json';

const BLUE = '#079aea';
const INK = '#151d23';
const asset = (name: string) => staticFile(`fiverepos/${name}`);
const ease = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const captions = rawCaptions as Caption[];
const oldTime = (seconds: number) => {
  const points = retime.anchors;
  let i = 0;
  while (i < points.length - 2 && points[i + 1][0] < seconds) i++;
  const a = points[i], b = points[i + 1];
  return a[1] + clamp((seconds - a[0]) / Math.max(.001, b[0] - a[0]), 0, 1) * (b[1] - a[1]);
};
// Existing reference edit clock; speech-aligned mapping retimes it to the approved REFERRAL v4 take.
export const scenes = [
  {id: 'hook', at: 0, end: 4.4, light: true},
  {id: 'one', at: 4.4, end: 5.667, light: true},
  {id: 'opencode', at: 5.667, end: 8.933, light: false},
  {id: 'models', at: 8.933, end: 11.033, light: false},
  {id: 'two', at: 11.033, end: 12.533, light: true},
  {id: 'voice', at: 12.533, end: 18.167, light: true},
  {id: 'three', at: 18.167, end: 19.567, light: true},
  {id: 'seo', at: 19.567, end: 27.1, light: false},
  {id: 'four', at: 27.1, end: 28.733, light: true},
  {id: 'maus', at: 28.733, end: 30.933, light: true},
  {id: 'agents', at: 30.933, end: 33.267, light: false},
  {id: 'picker', at: 33.267, end: 35.433, light: false},
  {id: 'compare', at: 35.433, end: 38.333, light: false},
  {id: 'five', at: 38.333, end: 39.667, light: true},
  {id: 'replica', at: 39.667, end: 45.4, light: true},
  {id: 'cta', at: 45.4, end: 49, light: false},
] as const;

const pages: Caption[][] = [];
let page: Caption[] = [];
for (const w of captions) {
  const text = [...page, w].map(x => x.text.trim()).join(' ');
  if (page.length && (scenes.findIndex(x => oldTime(w.startMs / 1000) >= x.at && oldTime(w.startMs / 1000) < x.end) !== scenes.findIndex(x => oldTime(page[0].startMs / 1000) >= x.at && oldTime(page[0].startMs / 1000) < x.end) || text.length > 24 || w.startMs - page[0].startMs > 980 || page.length >= 4)) {pages.push(page); page = [];}
  page.push(w);
  if (/[.!?;:]$/.test(w.text.trim())) {pages.push(page); page = [];}
}
if (page.length) pages.push(page);

const CaptionLine: React.FC<{light: boolean; top: number; linkedin: boolean; cta?: boolean}> = ({light, top, linkedin}) => {
  const ms = useCurrentFrame() / 30 * 1000;
  if (linkedin && ms >= retime.ctaStart * 1000) return null;
  const p = pages.find((p, i) => ms >= p[0].startMs && ms < (pages[i + 1]?.[0].startMs ?? retime.durationSeconds * 1000));
  if (!p) return null;
  return <div data-text="captions" style={{position: 'absolute', zIndex: 30, left: 65, width: 885, top, textAlign: 'center', fontWeight: 800, fontSize: 58, lineHeight: 1.12, color: light ? INK : '#fff', textShadow: light ? '0 2px 1px #fff' : '0 3px 18px #000a'}}>
    {p.map((w, i) => {
      const active = ms >= w.startMs && ms < w.endMs;
      const emph = /repos|free|VoiceStudio|ElevenLabs|OpenCode|OpenSEO|OpenMausBot|Replica|REPO|Claude|DeepSeek|costs|branding/i.test(w.text);
      return <span key={`${w.startMs}-${w.text}-${i}`} style={{color: active ? (light ? '#0078bd' : '#62d2ff') : 'inherit', fontFamily: active && emph ? 'Instrument Serif' : 'Inter', fontStyle: active && emph ? 'italic' : 'normal', fontWeight: active && emph ? 400 : 800}}>{i ? ' ' : ''}{w.text.trim()}</span>;
    })}
  </div>;
};

const clips: Record<string, {frames: number; trim?: number; ratio: number}> = {
  opencode: {frames: 104, trim: 12, ratio: 354 / 452}, models: {frames: 93, trim: 20, ratio: 354 / 452},
  voice: {frames: 192, trim: 24, ratio: 354 / 452}, seo: {frames: 192, trim: 30, ratio: 514 / 460},
  maus: {frames: 66, trim: 12, ratio: 354 / 452}, agents: {frames: 45, ratio: 514 / 460},
  picker: {frames: 42, ratio: 514 / 460}, compare: {frames: 30, ratio: 514 / 460}, replica: {frames: 134, trim: 24, ratio: 354 / 452},
};
const Panel: React.FC<{name: string; at: number; end: number; top?: number; width?: number; still?: boolean}> = ({name, at, end, top = 265, width = 920, still}) => {
  const t = oldTime(useCurrentFrame() / 30);
  const c = clips[name];
  const f = Math.round(clamp((t - at) / Math.max(.1, end - at), 0, 1) * (c.frames - (c.trim ?? 0) - 2));
  const en = ease((t - at) / .17);
  return <div style={{position: 'absolute', top, left: (1080 - width) / 2, width, height: Math.round(width * c.ratio), overflow: 'hidden', borderRadius: 15, boxShadow: '0 0 0 3px #079aea88,0 22px 38px #0003', transform: `translateY(${16 * (1 - en)}px) scale(${.985 + .015 * en})`}}>
    {still ? <Img src={asset(`${name}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : <Freeze frame={f}><OffthreadVideo src={asset(`${name}.mp4`)} startFrom={c.trim ?? 0} muted style={{width: '100%', height: '100%', objectFit: 'cover'}}/></Freeze>}
  </div>;
};

const Presenter: React.FC<{full?: boolean; hold?: number}> = ({full, hold}) => {
  const frame = useCurrentFrame();
  const t = retime.pictureOldSeconds[Math.min(frame, retime.pictureOldSeconds.length - 1)];
  const seg = avatarMap.find(x => t >= x.start - .001 && t < x.end + .001) ?? avatarMap[avatarMap.length - 1];
  // The selected source offset is set after the 30 fps bilabial filmstrip review.
  const sourceTime = seg.avatar_start + clamp(t - seg.start, 0, seg.end - seg.start);
  const k = clamp(Math.round((hold ?? (sourceTime - .1)) * 30), 0, 642);
  const name = String(k).padStart(5, '0');
  if (full) return <Img src={asset(`presenter/p/${name}.jpg`)} style={{position: 'absolute', left: -54, top: -110, width: 1188, height: 2112}}/>;
  // Same frame for the room and the head cutout; the head breaks the blue card edge.
  const left = 150, top = 985, width = 780, height = 1387;
  return <>
    <div style={{position: 'absolute', left: 44, top: 1320, width: 992, height: 700, background: 'linear-gradient(110deg,#858780,#787a74)', overflow: 'hidden', border: '5px solid #3a60eb', borderRadius: 24, boxShadow: '0 0 18px #2e85ff88'}}>
      <Img src={asset(`presenter/c/${name}.png`)} style={{position: 'absolute', left: left - 49, top: top - 1325, width, height}}/>
    </div>
    <div style={{position: 'absolute', left: 44, top: 980, width: 992, height: 345, overflow: 'hidden', pointerEvents: 'none'}}>
      <Img src={asset(`presenter/c/${name}.png`)} style={{position: 'absolute', left: left - 44, top: top - 980, width, height}}/>
    </div>
  </>;
};

const Chapter: React.FC<{n: number; name: string; clip: string; at: number; end: number}> = ({n, name, clip, at, end}) => {
  const t = oldTime(useCurrentFrame() / 30);
  const panelWidth = clips[clip].ratio > 1 ? 620 : 900;
  return <>
    <div data-text="chapter" style={{position: 'absolute', left: 70, width: 940, top: 235, textAlign: 'center'}}>
      <div style={{fontSize: 68, fontWeight: 800, letterSpacing: -3}}>Repo Number</div>
      <div style={{display: 'inline-block', color: 'white', background: BLUE, fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 94, padding: '0 24px 6px', lineHeight: 1.14, marginTop: 23, boxShadow: '0 6px 0 #d7e5ec', transform: `scale(${.92 + .08 * ease((t - at) / .18)})`}}>{['', 'One', 'Two', 'Three', 'Four', 'Five'][n]}</div>
    </div>
    <Panel name={clip} at={at} end={end} top={560} width={panelWidth} still/>
    <div data-text="repo-name" style={{position: 'absolute', top: 560 + panelWidth * clips[clip].ratio + 28, left: 50, width: 980, textAlign: 'center', fontSize: name.length > 9 ? 55 : 68, fontWeight: 800, letterSpacing: -2}}>{name}</div>
  </>;
};

export const FiveReposV4: React.FC<{linkedin?: boolean}> = ({linkedin = false}) => {
  const [handle] = useState(() => delayRender('Five repos fonts'));
  useEffect(() => {fontsReady.then(() => continueRender(handle));}, [handle]);
  const t = oldTime(useCurrentFrame() / 30);
  const s = scenes.find(x => t >= x.at && t < x.end) ?? scenes[scenes.length - 1];
  const split = ['hook', 'voice', 'maus', 'replica'].includes(s.id);
  const chapters: Record<string, [number, string, string]> = {one: [1,'OpenCode','opencode'],two: [2,'VoiceStudio','voice'],three: [3,'OpenSEO','seo'],four: [4,'OpenMausBot','agents'],five: [5,'Replica','replica']};
  return <AbsoluteFill style={{fontFamily: 'Inter', color: INK, overflow: 'hidden', background: s.light ? '#f2f6f5' : 'radial-gradient(ellipse at 50% 42%,#62686b 0%,#2b2c2d 48%,#101112 83%)'}}>
    <style>{`* {box-sizing:border-box}`}</style>
    {s.light && <AbsoluteFill style={{opacity: .23, backgroundImage: 'repeating-linear-gradient(117deg,transparent 0px,transparent 37px,#dae9ed 38px,#f8fbfc 39px),radial-gradient(ellipse at 10% 15%,#a8d5e5,transparent 60%)'}}/>}
    <Audio src={staticFile(`fiverepos-v4/${linkedin ? 'mix-linkedin.wav' : 'mix.wav'}`)}/>
    {s.id === 'cta' && <Presenter full hold={linkedin ? 469 / 30 : undefined}/>}
    {split && <Presenter/>}
    {s.id === 'hook' && <>
      <div data-text="hook" style={{position: 'absolute', top: 228, width: 1080, textAlign: 'center', fontWeight: 800, fontSize: 74, lineHeight: 1.12, letterSpacing: -3}}>Stop Paying For<br/><span style={{display: 'inline-block', fontFamily: 'Instrument Serif', fontStyle: 'italic', fontWeight: 400, color: 'white', background: BLUE, padding: '3px 27px 10px', marginTop: 15, fontSize: 92, letterSpacing: -2}}>These AI Tools</span></div>
      <div style={{position: 'absolute', top: 510, left: 93, width: 894, background: '#fff', border: '3px solid #3b7ba7', borderRadius: 18, padding: '18px 26px', boxShadow: '0 10px 25px #07304628'}}>
        {['Claude Code','ElevenLabs','Ahrefs / Semrush','Agent subscriptions','App subscriptions'].map((name, i) => <div key={name} style={{height: 66, display: 'flex', alignItems: 'center', gap: 20, borderBottom: i < 4 ? '1px solid #dce4e8' : 'none', position: 'relative', fontSize: 34, fontWeight: 600}}>
          <div style={{width: 34, height: 34, borderRadius: 7, background: ['#cf795c','#171c24','#ff7a1a','#4c91c7','#2c8ab4'][i]}}/>{name}
          <div style={{position: 'absolute', height: 5, left: 52, top: 33, width: `${clamp((t - 1.4 - i * .15) / .18, 0, 1) * 690}px`, background: '#ed4e4e', rotate: '-3deg', borderRadius: 4}}/>
        </div>)}
        {t >= 2.4 && <div data-text="hook-count" style={{position: 'absolute', inset: '42px 105px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#162832f5', borderRadius: 19, color: 'white', fontSize: 48, boxShadow: '0 12px 25px #0004', transform: `scale(${.92 + .08 * ease((t - 2.4) / .18)})`}}><span style={{fontSize: 112, fontWeight: 800, color: '#65d7ff'}}>5</span>open-source repos</div>}
      </div>
    </>}
    {chapters[s.id] && <Chapter n={chapters[s.id][0]} name={chapters[s.id][1]} clip={chapters[s.id][2]} at={s.at} end={s.end}/>}
    {s.id === 'opencode' && <><Panel name="opencode" at={s.at} end={s.end}/><div style={{position: 'absolute', top: 1090, left: 350, width: 380, padding: '18px 20px', borderRadius: 16, color: '#dd8768', background: '#191b1c', textAlign: 'center', fontSize: 53, lineHeight: 1.1, fontWeight: 800, rotate: '-3deg'}}>CLAUDE<br/>CODE<div style={{position: 'absolute', top: 70, left: 10, width: 360, height: 7, background: '#e34c48', rotate: '-7deg'}}/></div></>}
    {s.id === 'models' && <><Panel name="models" at={s.at} end={s.end}/><div data-text="model-cost" style={{position: 'absolute', left: 85, top: 1085, width: 910, textAlign: 'center', color: 'white', fontSize: 34}}>Selected free models · availability changes</div></>}
    {s.id === 'voice' && <Panel name="voice" at={s.at} end={s.end} top={285}/>}
    {s.id === 'seo' && <><Panel name="seo" at={s.at} end={25.0} top={245} width={900}/>{t >= 25 && <div data-text="cost-note" style={{position: 'absolute', left: 120, top: 1205, width: 840, background: '#132632', border: '2px solid #67cfff', color: 'white', padding: 18, fontSize: 39, fontWeight: 800, textAlign: 'center', borderRadius: 14}}>Free code · paid data</div>}</>}
    {s.id === 'maus' && <Panel name="maus" at={s.at} end={s.end} top={285}/>}
    {['agents','picker','compare'].includes(s.id) && <><Panel name={s.id} at={s.at} end={s.end} top={265} width={900}/>{t >= 36.6 && <div data-text="model-cost" style={{position: 'absolute', left: 130, top: 1265, width: 820, background: '#132632', border: '2px solid #67cfff', color: 'white', fontSize: 35, textAlign: 'center', borderRadius: 12, padding: 14}}>Model costs still apply</div>}</>}
    {s.id === 'replica' && <Panel name="replica" at={s.at} end={s.end} top={285}/>}
    {s.id === 'cta' && <>
      <AbsoluteFill style={{background: 'linear-gradient(transparent 48%,#071b3080 78%,#071b30aa)'}}/>
      <div data-text="cta" style={{position: 'absolute', left: 90, top: 1135, width: 850, textAlign: 'center', fontWeight: 800, color: 'white', fontSize: 76, textShadow: '0 4px 30px #0008'}}>{linkedin ? <>Full guide<br/><span style={{color:'#78dcff'}}>Link in post</span></> : <>Comment <span style={{background: BLUE, padding: '2px 18px 8px', borderRadius: 10}}>REPO</span></>}</div>
    </>}
    <CaptionLine light={s.light} top={split ? 1070 : s.id === 'cta' ? 1390 : chapters[s.id] ? 1390 : 1390} linkedin={linkedin} cta={s.id === 'cta'}/>
    <div data-text="brand" style={{position: 'absolute', right: 135, top: 1470, fontSize: 23, letterSpacing: 3, color: s.light && !split ? '#27536c' : '#ffffffb8', fontWeight: 600}}>WITHHAMMAD</div>
  </AbsoluteFill>;
};
