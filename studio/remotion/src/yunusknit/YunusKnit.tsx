// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): the story of Yunus (AS) in
// the three darknesses (reference DfsOaK8h_rq by @rofydaesam, 57.0 s, job c56517eb2544) rebuilt in knitted yarn. Same audio,
// untouched (as-Saffat 37:139-146 recited, after the reference's whale call and splash), the same flow of shots on the same
// clock: the storm and the whale, the ship, the laden ship, the lots, the storm, the swallow, the deep, the belly, the shore and
// the gourd vine. The picture is a Blender plate (studio/blender/yunusknit/build.py, EEVEE): everything is knitwork, and NO
// PROPHET IS SHOWN in any form (no figure, back, silhouette, hand or shadow): only the knitted night, sea, ship and cargo,
// the lots, the whale, the darkness and the light of the dawn.
// Over the reference: frame 0 carries the hook in yarn ("Three darknesses / and one thing saved him"); the whale breaches out of
// a knitted sea under Fair Isle stars on the whale's call and crashes on the splash; 37:144 counts the three darknesses
// outward (the belly, the sea, the night: the caption's own three), each labelled; on «فَنَبَذْنَـٰهُ» they part as three
// knitted curtains onto the dawn; on «وَأَنۢبَتْنَا» a crochet gourd vine grows over the sand.
// Text: texts.json, built and checked by text.py (quran.com text_uthmani = tanzil.net Uthmani, code point for code point;
// Sahih International; the word clock from Whisper large-v3 per recited phrase and the voice-band envelope). Each ayah is
// stitched in gold word by word on the reciter's clock. Arabic gets the yarn light without the displacement filter.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, OffthreadVideo, continueRender, delayRender, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {ArDefs} from '../lanternknit/LanternKnit';
import {Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import TX from './texts.json';

export const FPS = 30, FRAMES = 1712;
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
export const smooth = (x: number) => { const u = c01(x); return u * u * (3 - 2 * u); };
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
export const AR_THREAD = 'url(#yarnAr) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 8px 14px #00000099)';

// the shot clock (the same numbers build.py reads from timing.json)
export const CUTS = {OPEN: 0, A139: 5.733, A140: 10.8, A141a: 17.067, A141b: 18.867, A142: 22.533, A143: 27.333, A144a: 32.4,
  A144b: 35.0, A144c: 37.2, A145: 40.433, A146: 48.467};
const FLASHES: [number, number][] = [[0.30, 0.22], [3.78, 0.18], [CUTS.A141b + 0.35, 0.25], [25.3 - 2.4, 0.2], [CUTS.A141b + 2.3, 0.2]];
type Ayah = 139 | 140 | 141 | 142 | 143 | 144 | 145 | 146;
const AYAT = TX.ayat as Ayah[];
const K = (a: Ayah) => String(a) as keyof typeof TX.words;
const clock = (a: Ayah) => TX.clock[K(a)] as [number, number][];
const toArabicDigits = (n: number) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
/** when each ayah block is on screen: from just before its first word to just before the next ayah's first word */
export const SPANS: [Ayah, number, number][] = AYAT.map((a, i) => {
  const s = clock(a)[0][0] - 0.3, e = i + 1 < AYAT.length ? clock(AYAT[i + 1])[0][0] - 0.3 : FRAMES / FPS + 1;
  return [a, s, e];
});
export const HOOK_OUT = clock(139)[0][0] - 0.65;

/** a word stitched in from its right edge over its recited span; the ghost of the word waits underneath */
const Word: React.FC<{w: string; t: number; a: number; b: number; size: number; gap: number; k: number}> = ({w, t, a, b, size, gap, k}) => {
  const p = ease((t - a) / Math.max(0.25, b - a));
  const pop = pulse(t - a, 0.45);
  const pv = size * 0.75, ph = size * 0.45;
  return <span style={{position: 'relative', display: 'inline-block', marginLeft: gap, fontFamily: AR, fontSize: size, lineHeight: 1.7,
    transform: `translateY(${-5 * pop}px)`}}>
    <span style={{color: '#F1E6D0', opacity: 0.55, textShadow: '0 2px 4px #000000cc'}}>{w}</span>
    {p > 0 ? <span style={{position: 'absolute', left: -ph, right: -ph, top: -pv, bottom: -pv, padding: `${pv}px ${ph}px`, clipPath: `inset(0 0 0 ${100 - 100 * p}%)`,
      color: '#F7C552', WebkitTextStroke: '1px #E3AC45',
      filter: `${AR_THREAD} drop-shadow(0 0 ${8 + 20 * pop}px #FFC85A88)`}}>{w}</span> : null}
  </span>;
};

export const AYAH = {top: 318, size: 68, pitch: 116};
export const AyahBlock: React.FC<{a: Ayah; t: number; o: number; still?: boolean}> = ({a, t, o, still = false}) => {
  const ws = TX.words[K(a)], ck = clock(a), lines = TX.lines[K(a)] as [number, number][];
  const en = TX.en[K(a)];
  const tt = still ? 999 : t;
  const enO = still ? 1 : ease((t - (ck[0][0] - 0.1)) / 0.4);
  const high = a === 143 ? en.split('exalt Allāh') : null;
  return <div style={{opacity: o}}>
    {lines.map(([x, y], li) => <div key={li} dir="rtl" lang="ar" style={{position: 'absolute', top: AYAH.top + li * AYAH.pitch, left: 120, right: 120,
      textAlign: 'center', whiteSpace: 'nowrap'}}>
      {ws.slice(x, y).map((w, n) => {
        const k = x + n;
        return <Word key={k} w={w} t={tt} a={ck[k][0]} b={ck[k][1]} size={AYAH.size} gap={n === y - x - 1 && li === 0 ? 0 : AYAH.size * 0.24} k={k}/>;
      })}
      {li === lines.length - 1 ? <span style={{fontFamily: AR, fontSize: AYAH.size * 0.9, lineHeight: 1.7, display: 'inline-block',
        ...(tt >= ck[ck.length - 1][1] - 0.2 ? {color: '#F7C552', WebkitTextStroke: '1px #E3AC45'} : {color: '#F1E6D0', opacity: 0.6}),
        filter: 'drop-shadow(0 2px 3px #000000cc)'}}>{'۝' + toArabicDigits(a)}</span> : null}
    </div>)}
    <div style={{position: 'absolute', top: AYAH.top + 2 * AYAH.pitch + 18, left: 150, right: 150, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic',
      fontSize: 36, lineHeight: 1.2, color: '#F8EDD6', textShadow: '0 2px 4px #000000dd, 0 0 14px #00000088', opacity: enO}}>
      {high ? <>{high[0]}<span style={{color: '#FFD77A', textShadow: '0 2px 4px #000000dd, 0 0 14px #FFB84288'}}>exalt Allāh</span>{high[1]}</> : en}
    </div>
    <div style={{position: 'absolute', top: AYAH.top + 2 * AYAH.pitch + 124, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
      gap: 14, opacity: enO}}>
      <span style={{width: 56, borderTop: '2px dashed #D9A847'}}/>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 26, color: '#F6E3BC', textShadow: '0 2px 3px #000000cc', letterSpacing: 0.5}}>
        As-Saffat 37:{a} · Sahih International</span>
      <span style={{width: 56, borderTop: '2px dashed #D9A847'}}/>
    </div>
  </div>;
};

const Ayat: React.FC<{t: number}> = ({t}) => <>{SPANS.map(([a, s, e]) => {
  if (t < s - 0.01 || t > e + 0.3) return null;
  const i = ease((t - s) / 0.3), o = 1 - ease((t - e) / 0.3);
  return <div key={a} style={{opacity: i * o, transform: `translateY(${(1 - i) * 10 - (1 - o) * 8}px)`, filter: o < 1 ? `blur(${(1 - o) * 4}px)` : undefined}}>
    <AyahBlock a={a} t={t} o={1}/>
  </div>;
})}</>;

/** frame 0: the hook in yarn, two lines, until the reciter begins */
export const Hook: React.FC<{t: number; top?: number; still?: boolean}> = ({t, top = 360, still = false}) => {
  const o = still ? 1 : 1 - ease((t - HOOK_OUT) / 0.35);
  if (o <= 0) return null;
  const sway = still ? 0 : Math.sin(t * 1.3) * 1.2;
  return <div style={{position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: o, transform: `translateY(${(1 - o) * -14}px)`}}>
    <div style={{fontFamily: SERIF, fontSize: 112, lineHeight: 1.0, ...gold(t, 0.25), WebkitTextStroke: '2px #E7B040',
      filter: 'url(#yarn) drop-shadow(0 4px 3px #1A0A04cc) drop-shadow(0 12px 20px #000000aa) drop-shadow(0 0 22px #FFC85A66)',
      transform: `rotate(${sway * 0.4}deg)`}}>Three darknesses</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, lineHeight: 1.15, marginTop: 10, color: '#FBF1DE',
      textShadow: '0 3px 5px #000000dd, 0 0 18px #000000aa', filter: 'url(#yarn)'}}>and one thing saved him</div>
  </div>;
};

/** 37:144, counted outward: the belly of the fish, the sea, the night (Ibn Mas'ud on «ٱلظُّلُمَـٰتِ» of 21:87, in Tafsir Ibn Kathir;
 * the reference caption's three darknesses) */
const DARK = [['the belly of the fish', CUTS.A144a], ['the sea', CUTS.A144b], ['the night', CUTS.A144c]] as const;
const Darkness: React.FC<{t: number}> = ({t}) => {
  const on = t >= CUTS.A144a - 0.05 && t < CUTS.A145 + 0.3;
  if (!on) return null;
  const out = 1 - ease((t - CUTS.A145) / 0.3);
  const k = t >= CUTS.A144c ? 2 : t >= CUTS.A144b ? 1 : 0;
  const t0 = DARK[k][1], p = ease((t - t0 - 0.15) / 0.45);
  return <div style={{position: 'absolute', top: 1150, left: 0, right: 0, textAlign: 'center', opacity: out}}>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: '#E9DCC4', letterSpacing: 3, textShadow: '0 2px 4px #000000cc',
      opacity: ease((t - CUTS.A144a - 0.1) / 0.4)}}>THREE DARKNESSES</div>
    <div style={{display: 'flex', justifyContent: 'center', gap: 22, marginTop: 14}}>
      {[0, 1, 2].map((j) => {
        const lit = j < k || (j === k && p > 0);
        const s = j === k ? 1 + 0.25 * pulse(t - t0 - 0.15, 0.5) : 1;
        return <div key={j} style={{width: 64, height: 64, borderRadius: '50%', border: '3px dashed #D9A847', transform: `scale(${s})`,
          background: lit ? 'radial-gradient(circle at 35% 30%, #3B3570, #16123A 70%)' : '#00000055',
          boxShadow: lit ? '0 0 16px #FFC85A55, 0 4px 8px #000000aa' : '0 4px 8px #00000066',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 40, color: lit ? '#FFE3A0' : '#9C94B8'}}>{j + 1}</div>;
      })}
    </div>
    <div style={{fontFamily: SERIF, fontSize: 58, lineHeight: 1.1, marginTop: 14, color: '#FBF1DE', opacity: p, transform: `translateY(${(1 - p) * 12}px)`,
      textShadow: '0 3px 5px #000000dd, 0 0 18px #000000aa', filter: 'url(#yarn)'}}>{DARK[k][0]}</div>
  </div>;
};

/** the closing ask, under the last ayah, held to the last frame */
const ENDLINE = 54.85;
const EndLine: React.FC<{t: number}> = ({t}) => {
  const p = ease((t - ENDLINE) / 0.5);
  if (p <= 0) return null;
  return <div style={{position: 'absolute', top: 1330, left: 140, right: 140, textAlign: 'center', opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
    <div style={{display: 'inline-block', padding: '12px 30px 16px', borderRadius: 40, background: 'linear-gradient(180deg, #2A1F45ee, #1A1430ee)',
      border: '3px dashed #E2B45A', boxShadow: '0 10px 24px #000000aa, 0 0 22px #F6C55244'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, lineHeight: 1.15, color: '#FBEFD8'}}>Share it with someone</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 42, lineHeight: 1.15, ...gold(t, 0.3)}}>in their own darkness</div>
    </div>
  </div>;
};

// ---- light on top of the plate ------------------------------------------------------------------------------------------
type Geom = {whale_head: ([number, number] | null)[]; lantern: ([number, number] | null)[]; moon: ([number, number] | null)[]; sun: ([number, number] | null)[]};
const useGeom = (): Geom | null => {
  const [g, setG] = useState<Geom | null>(null);
  const [h] = useState(() => delayRender('geom'));
  useEffect(() => { fetch(staticFile('geom.json')).then((r) => r.json()).then((j) => { setG(j); continueRender(h); }); }, [h]);
  return g;
};
const Glow: React.FC<{p: [number, number] | null | undefined; r: number; col: string; o: number}> = ({p, r, col, o}) => p ?
  <div style={{position: 'absolute', left: p[0] - r, top: p[1] - r, width: 2 * r, height: 2 * r, borderRadius: '50%', mixBlendMode: 'screen', opacity: o,
    background: `radial-gradient(closest-side, ${col} 0%, ${col}66 35%, ${col}00 100%)`}}/> : null;

const inShot = (t: number, a: keyof typeof CUTS, b: keyof typeof CUTS | null) => t >= CUTS[a] && (b === null || t < CUTS[b]);

/** knitted rain: short slanted yarn strands, in the storm shots */
const Rain: React.FC<{t: number; o: number}> = ({t, o}) => o <= 0 ? null : <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: o}}>
  {Array.from({length: 90}, (_, k) => {
    const sp = 1500 + 700 * random(`rs${k}`), x0 = 1300 * random(`rx${k}`) - 100, ph = random(`rp${k}`);
    const y = ((t * sp + ph * 2400) % 2400) - 240, x = x0 - 0.28 * y, L = 40 + 50 * random(`rl${k}`);
    return <line key={k} x1={x} y1={y} x2={x - 0.28 * L} y2={y + L} stroke={k % 3 ? '#D9DCF5' : '#BFC6F0'} strokeWidth={2 + 2 * random(`rw${k}`)}
      strokeLinecap="round" strokeDasharray="6 4" opacity={0.35 + 0.35 * random(`ro${k}`)}/>;
  })}
</svg>;

/** soft shafts of light reaching down through the water */
const Shafts: React.FC<{t: number; o: number}> = ({t, o}) => o <= 0 ? null : <>{[[180, 12, 160], [430, 4, 120], [700, -8, 190], [930, -14, 140]].map(([x, r, w], k) =>
  <div key={k} style={{position: 'absolute', left: x - w / 2, top: -200, width: w, height: 2200, transform: `rotate(${r + 2 * Math.sin(t * 0.5 + k)}deg)`,
    transformOrigin: '50% 0%', mixBlendMode: 'screen', filter: 'blur(26px)', opacity: o * (0.22 + 0.1 * Math.sin(t * 1.3 + k * 2)),
    background: 'linear-gradient(180deg, #CFF6FFcc 0%, #9FE6F066 40%, #9FE6F000 85%)'}}/>)}</>;

/** a slow Ken Burns push per shot; in the opening a punch-in towards the breaching whale, with a kick on the splash */
const SHOT_T = Object.values(CUTS);
const kenBurns = (t: number, g: Geom | null, f: number) => {
  let i = 0;
  for (let k = 0; k < SHOT_T.length; k++) if (t >= SHOT_T[k]) i = k;
  const a = SHOT_T[i], b = i + 1 < SHOT_T.length ? SHOT_T[i + 1] : FRAMES / FPS;
  const u = c01((t - a) / (b - a));
  if (i === 0) {
    const w = g?.whale_head?.[f];
    const s = 1.04 + 0.16 * smooth((t - 0.5) / 1.8) - 0.06 * smooth((t - 3.6) / 1.6) + 0.02 * pulse(t - 3.8, 0.35);
    return {s, x: w ? Math.min(900, Math.max(180, w[0])) : 600, y: w ? Math.min(1300, Math.max(700, w[1])) : 1000};
  }
  return {s: 1.0 + 0.05 * smooth(u), x: 540, y: i % 2 ? 900 : 1100};
};

/** at each hard cut a row of gold running stitches sweeps across the frame */
const HARD = [CUTS.A139, CUTS.A140, CUTS.A141a, CUTS.A141b, CUTS.A142, CUTS.A143, CUTS.A145, CUTS.A146];
const StitchWipe: React.FC<{t: number}> = ({t}) => {
  const c = HARD.find((x) => t >= x - 0.12 && t < x + 0.3);
  if (c === undefined) return null;
  const u = c01((t - (c - 0.12)) / 0.42), x = -200 + 1480 * smooth(u), o = Math.sin(Math.PI * u);
  return <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.85 * o, mixBlendMode: 'screen'}}>
    {[0, 1, 2].map((k) => <line key={k} x1={x - 260 - 40 * k} y1={-40} x2={x + 120 - 40 * k} y2={1960} stroke={k === 1 ? '#FFE7A8' : '#E3AC45'}
      strokeWidth={k === 1 ? 7 : 4} strokeDasharray="22 14" strokeLinecap="round" filter="url(#soft2)"/>)}
  </svg>;
};

/** warm wool motes drifting up in the dawn light */
const Motes: React.FC<{t: number}> = ({t}) => <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
  {Array.from({length: 40}, (_, k) => {
    const sp = 30 + 50 * random(`ms${k}`), x = 1080 * random(`mx${k}`) + 30 * Math.sin(t * 0.7 + k), y = 1920 - ((t * sp + 1920 * random(`my${k}`)) % 1920);
    const r = 2 + 4 * random(`mr${k}`);
    return <circle key={k} cx={x} cy={y} r={r} fill="#FFE2A8" opacity={(0.25 + 0.35 * random(`mo${k}`)) * c01((t - CUTS.A145 - 1.5) / 1.0)}/>;
  })}
</svg>;

export const YunusKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const g = useGeom();
  const fl = FLASHES.reduce((v, [t0, d]) => (t >= t0 && t <= t0 + d ? Math.max(v, (1 - (t - t0) / d) * 0.8) : v), 0);
  const rain = inShot(t, 'A140', 'A143') ? (t < CUTS.A141a ? 0.45 : t < CUTS.A141b ? 0.3 : 0.75) : 0;
  const under = inShot(t, 'A143', 'A144a') ? 1 : inShot(t, 'A144b', 'A144c') ? 0.45 : 0;
  // passes through black: into the belly (the whale's flank fills the lens), and between the three darknesses
  const dip = (tc: number, a: number, b: number) => (t < tc ? smooth((t - (tc - a)) / a) : 1 - smooth((t - tc) / b));
  const black = Math.max(dip(CUTS.A144a, 0.32, 0.4), dip(CUTS.A144b, 0.22, 0.3), dip(CUTS.A144c, 0.22, 0.3));
  const kb = kenBurns(t, g, f);
  const night = t < CUTS.A143 || inShot(t, 'A144c', 'A145');
  const dawn = t >= CUTS.A145;
  return <AbsoluteFill style={{background: '#0B0E24', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/>
    <ArDefs/>
    <Filters/>
    <div style={{position: 'absolute', inset: 0, transform: `scale(${kb.s})`, transformOrigin: `${kb.x}px ${kb.y}px`}}>
      <OffthreadVideo src={staticFile('plate.mp4')} muted style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
    </div>
    {g ? <>
      {night && !inShot(t, 'A141a', 'A141b') ? <Glow p={g.moon[f]} r={150} col="#FFF1CC" o={0.55}/> : null}
      {inShot(t, 'OPEN', 'A143') && !inShot(t, 'A141a', 'A141b') ? <Glow p={g.lantern[f]} r={46} col="#FFB54A" o={0.8 + 0.2 * Math.sin(t * 9)}/> : null}
      {dawn ? <Glow p={g.sun[f]} r={330} col="#FFD08A" o={0.5}/> : null}
    </> : null}
    <Shafts t={t} o={under}/>
    <Rain t={t} o={rain}/>
    {fl > 0 ? <AbsoluteFill style={{background: '#E8E2FF', mixBlendMode: 'screen', opacity: 0.35 * fl}}/> : null}
    {/* calm the top band behind the ayah, keep the corners soft */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #05061Ad0 0px, #05061Ab0 230px, #05061A90 560px, #05061A55 760px, #05061A00 900px)'}}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 50%, #00000000 60%, #00000066 100%)'}}/>
    <StitchWipe t={t}/>
    {dawn ? <Motes t={t}/> : null}
    {black > 0 ? <AbsoluteFill style={{background: '#020208', opacity: black}}/> : null}
    <Handle top={226} endP={c01((t - ENDLINE) / 0.6)}/>
    <Hook t={t}/>
    <Ayat t={t}/>
    <Darkness t={t}/>
    <EndLine t={t}/>
  </AbsoluteFill>;
};
