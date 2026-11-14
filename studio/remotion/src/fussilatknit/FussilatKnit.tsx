// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): the Fussilat 41:30 reminder
// (reference DeGg0zZO3Fh by @skardu_to_islamabad, 14.1 s, job 9b168b3f7c02) rebuilt in knitted yarn. Same audio, untouched
// (an Urdu voice reads the meaning of Quran 41:30 over a soft pad, 0.55-13.84 s: Fateh Muhammad Jalandhari's Urdu with «اللہ»
// and «ہے»), the same single shot (the camera holds on the foot of the Soq Valley waterfall for 3 s, then tilts up the falls
// to the ridge and the sky) and the same line on screen ("Allah" + an anatomical heart, near the top, the whole time).
// Knitted: a crochet diorama of the valley (GPT Image 2, a 1:3 panorama): a waterfall of white and aqua yarn strands into a
// crocheted turquoise pool, cable-knit cliffs in slate, plum and rust, knitted pines, crochet wildflowers, a knitted dawn sky.
// Over the reference: frame 0 is the valley in undyed wool under the reference caption's own promise ("Don't fear, don't
// grieve… Paradise awaits"); a gold thread drops down the falls and, on the first spoken word, splashes into the pool: the
// colour pours out of the pool in a ripple of dye over the whole valley and the yarn waterfall starts to flow (the wow).
// The full ayah sits on screen in Uthmani script and fills with gold stitch by stitch, phrase by phrase, as its meaning is
// spoken; the Urdu is stitched word by word on the frame it is said, with Sahih International's English under it.
// "farishte utrenge" (the angels descend): shafts of light slide down from the sky with falling sparks; light only, no figures.
// "na khauf karo" / "na ghamnaak ho" (do not fear / do not grieve): the two grey mist banks dissolve, one on each phrase.
// "bahisht" (Paradise): the camera reaches the ridge, a knitted rainbow stitches itself across the falls and crochet flowers
// bloom on the ledges; "khushi manao" (rejoice): everything turns gold.
// Text: texts.json, checked by text.py (Tanzil quran-uthmani = quran.com text_uthmani; Sahih International; Jalandhari).
import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {YarnDefs} from '../asmaknit/AsmaKnit';
import {Burst, Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import {YarnLite, goldFill} from '../hayyuknit/HayyuKnit';
import TX from './texts.json';

export const FPS = 30, FRAMES = 423;           // 14.1 s: the reference's length (423 frames; its audio decodes to 14.096 s)
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
export const UR = 'Nastaliq, serif';
const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
export const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
export const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));

// ---- the reference clock: every Urdu word (Whisper medium word times, snapped to the pauses of the 44.1 kHz track) --------
export const UR_T: [number, number][] = [
  [0.55, 0.78], [0.78, 1.02], [1.02, 1.08], [1.08, 1.32], [1.32, 1.48], [1.48, 1.74], [1.74, 2.38], [2.38, 2.76], [2.76, 2.88],
  [3.40, 3.60], [3.60, 3.72], [3.72, 3.86], [3.86, 4.02], [4.02, 4.36], [4.36, 4.58],
  [4.98, 5.22], [5.22, 5.48], [5.48, 5.96], [5.96, 6.38], [6.38, 6.45],
  [6.80, 7.02], [7.02, 7.34], [7.34, 7.44], [7.86, 8.04], [8.04, 8.32], [8.32, 8.56], [8.56, 8.81],
  [9.11, 9.30], [9.30, 9.48], [9.48, 9.92], [9.92, 10.12],
  [10.45, 10.72], [10.72, 11.09], [11.27, 11.42], [11.42, 11.64], [11.64, 11.74], [11.74, 11.86], [11.86, 12.04], [12.04, 12.36],
  [12.36, 12.54], [12.54, 12.90], [12.90, 12.96], [13.12, 13.42], [13.42, 13.84],
];
// each Arabic phrase (texts.json arPhrases) fills over the span in which its meaning is spoken
const AR_SPAN: [number, number][] = [[0.55, 2.88], [3.40, 4.58], [4.98, 6.45], [7.86, 8.81], [9.11, 10.12], [10.45, 13.84]];
export const PAGE_T = [0.42, 3.12, 4.92, 6.70, 10.28];   // Urdu + English caption pages (each held >= 1.5 s once sharp)
export const VOICE = UR_T[0][0];
const ALLAH_W = UR_T[7][0];                    // «اللہ»
const DESCEND = UR_T[17][0];                   // «فرشتے»
const FEAR = UR_T[25][0], GRIEF = UR_T[29][0]; // «خوف», «غمناک»
const JANNAH = UR_T[32][0];                    // «بہشت»
const REJOICE = UR_T[42][0];                   // «خوشی»
const HOOK_OUT = 2.98;

/** per-word Arabic stitch times: each phrase's span shared out by letter count (harakat do not count) */
const letters = (w: string) => [...w].filter((c) => /[ء-يٱ]/.test(c)).length;
export const AR_T: [number, number][] = (() => {
  const out: [number, number][] = [];
  TX.arPhrases.forEach(([a, b], p) => {
    const [s, e] = AR_SPAN[p], ws = TX.arWords.slice(a, b), tot = ws.reduce((x, w) => x + letters(w), 0);
    let acc = 0;
    ws.forEach((w) => { const t0 = s + ((e - s) * acc) / tot; acc += letters(w); out.push([t0, s + ((e - s) * acc) / tot]); });
  });
  return out;
})();

// ---- the scene: the panorama is 1080 x 3240; the camera holds on the pool, then tilts up like the reference ---------------
export const BG_H = 3240, Y0 = BG_H - 1920;
export const panY = (t: number) => Y0 * (1 - inout((t - 3.0) / 10.4));
const camZ = (t: number) => (t < VOICE ? 1.14 + 0.01 * (t / VOICE) : 1 + 0.15 * (1 - ease((t - VOICE) / 1.9)));
const CAM_O = {x: 540, y: 1380};
const IMPACT = {x: 548, y: 2545};              // where the yarn falls meet the pool (bg px)
const RIPPLE_MAX = 1750;
const rippleR = (t: number) => (t < VOICE ? 0 : RIPPLE_MAX * Math.pow(c01((t - VOICE) / 1.85), 1.15));   // ~1.6 s to the frame corners

export const PAL = {gold: '#F6C552', cream: '#FBEFD8', teal: '#2BB3B1', aqua: '#9FE0E6', rose: '#F28CAB', saffron: '#F7B733',
  violet: '#9B7BE0', sage: '#9CCB7A', coral: '#F59A7A', periwinkle: '#8FA8F0'};

// the falls' outline in bg px (measured on the white yarn column of the panorama)
const FALL: [number, number, number][] = [[372, 500, 612], [671, 455, 622], [969, 446, 644], [1267, 425, 640], [1566, 398, 655],
  [1864, 402, 662], [2013, 372, 696], [2162, 350, 718], [2330, 330, 760], [2470, 318, 790]];
const fallAt = (y: number) => {
  for (let k = 1; k < FALL.length; k++) if (FALL[k][0] >= y) {
    const [y0, l0, r0] = FALL[k - 1], [y1, l1, r1] = FALL[k], u = (y - y0) / (y1 - y0);
    return [l0 + (l1 - l0) * u, r0 + (r1 - r0) * u];
  }
  return [FALL[FALL.length - 1][1], FALL[FALL.length - 1][2]];
};
const STRAND_COLS = ['#FFFFFF', '#EAF7FB', '#C4EAF0', '#A6DCE6', '#E2ECF6', '#F4F1FF', '#D2F2EE'];
const STRANDS = Array.from({length: 60}, (_, k) => {
  const u = 0.04 + 0.92 * random(`su${k}`), w = 2 + 3.4 * random(`sw${k}`);
  const pts: string[] = [];
  for (let y = 380, n = 0; y <= 2470; y += 70, n++) {
    const [l, r] = fallAt(y);
    const x = l + (r - l) * u + 5 * Math.sin(y / 160 + k * 1.7);
    pts.push(`${n ? 'L' : 'M'} ${x.toFixed(1)} ${y}`);
  }
  const dash = 90 + 160 * random(`sd${k}`), gap = 50 + 120 * random(`sg${k}`);
  return {d: pts.join(' '), w, c: STRAND_COLS[k % STRAND_COLS.length], o: 0.2 + 0.3 * random(`so${k}`), dash, gap,
    v: 520 + 360 * random(`sv${k}`), ph: 400 * random(`sp${k}`)};
});

const Falls: React.FC<{t: number}> = ({t}) => {
  // flow starts as the gold thread lands; before that the strands hang still
  const d = t - VOICE, run = d < 0 ? 0 : d < 0.6 ? (d * d) / 1.2 : d - 0.3;
  return <svg width={1080} height={BG_H} style={{position: 'absolute', left: 0, top: 0}}>
    <g filter="url(#strandFuzz)">
      {STRANDS.map((s, k) => <path key={k} d={s.d} stroke={s.c} strokeWidth={s.w} strokeLinecap="round" fill="none" opacity={s.o * c01(d / 0.4 + 0.25)}
        strokeDasharray={`${s.dash.toFixed(0)} ${s.gap.toFixed(0)}`} strokeDashoffset={-(s.ph + s.v * run)}/>)}
    </g>
  </svg>;
};

/** white bouclé spray where the falls land: pompoms hop up and fall back, on a loop */
const Spray: React.FC<{t: number}> = ({t}) => {
  const on = c01((t - VOICE) / 0.3);
  if (on <= 0) return null;
  return <>{Array.from({length: 46}, (_, k) => {
    const per = 0.8 + 0.6 * random(`pp${k}`), u = ((t + per * random(`pq${k}`)) % per) / per;
    const x0 = 360 + 420 * random(`px${k}`), y0 = 2470 + 90 * random(`py${k}`);
    const vx = (random(`pv${k}`) - 0.5) * 180, h = 80 + 170 * random(`ph${k}`);
    const x = x0 + vx * u, y = y0 - h * 4 * u * (1 - u);
    const s = 9 + 16 * random(`ps${k}`), c = ['#FFFFFF', '#EAF7FB', '#C4EAF0', '#FFFFFF'][k % 4];
    return <div key={k} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', opacity: on * Math.sin(Math.PI * u) * 0.95,
      background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 45%, #b9d6dd 100%)`, boxShadow: '0 2px 3px #00000033'}}/>;
  })}</>;
};

/** the undyed valley, cut away by the ripple of dye that runs out of the pool */
const RawWool: React.FC<{t: number}> = ({t}) => {
  const R = rippleR(t);
  if (R >= RIPPLE_MAX - 1) return null;
  const edge = 120;
  const mask = `radial-gradient(circle at ${IMPACT.x}px ${IMPACT.y}px, transparent ${Math.max(0, R - edge)}px, black ${R}px)`;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: BG_H, WebkitMaskImage: mask, maskImage: mask}}>
    <Img src={staticFile('bg_raw.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: BG_H}}/>
  </div>;
};
const DYE = [PAL.teal, PAL.rose, PAL.saffron, PAL.violet, PAL.sage];
const DyeRing: React.FC<{t: number}> = ({t}) => {
  const R = rippleR(t), d = t - VOICE;
  if (d < 0 || d > 2.1) return null;
  const fade = 1 - c01((d - 1.3) / 0.8);
  return <svg width={1080} height={BG_H} style={{position: 'absolute', left: 0, top: 0}}>
    {DYE.map((c, k) => <circle key={k} cx={IMPACT.x} cy={IMPACT.y} r={Math.max(1, R - 18 - k * 15)} fill="none" stroke={c} strokeWidth={11}
      strokeDasharray="20 9" strokeLinecap="round" opacity={0.9 * fade} filter="url(#ringFuzz)"/>)}
    <circle cx={IMPACT.x} cy={IMPACT.y} r={Math.max(1, R - 40)} fill="none" stroke="#FFE7A8" strokeWidth={90} opacity={0.35 * fade} filter="url(#soft14)"
      style={{mixBlendMode: 'screen'}}/>
  </svg>;
};

/** the opening: a gold thread drops down the falls (screen px, over the veil) and lands in the pool on the first word */
const Thread: React.FC<{t: number; x: number; y: number}> = ({t, x, y: yEnd}) => {
  const a = 0.04;
  if (t < a || t > VOICE + 0.45) return null;
  const u = c01((t - a) / (VOICE - a)), y = -40 + (yEnd + 40) * Math.pow(u, 1.35);
  const o = 1 - c01((t - VOICE) / 0.3);
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
    <line x1={x} y1={-60} x2={x} y2={y} stroke="#FFC94D" strokeWidth={14} strokeLinecap="round" opacity={0.55} filter="url(#soft6)"/>
    <line x1={x} y1={-60} x2={x} y2={y} stroke="#FFE08A" strokeWidth={5} strokeLinecap="round"/>
    <line x1={x} y1={-60} x2={x} y2={y} stroke="#FFF8E0" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="7 5"/>
    <circle cx={x} cy={y} r={26} fill="#FFD66B" opacity={0.7} filter="url(#soft9)"/>
    <circle cx={x} cy={y} r={10} fill="#FFE9A8"/>
    <circle cx={x - 3} cy={y - 3} r={4} fill="#FFFFFF"/>
  </svg>;
};

/** the sun over the ridge: warm glow that swells on Paradise and turns gold at the end */
const Sun: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const j = ease((t - JANNAH) / 1.2);
  const o = 0.35 + 0.35 * j + 0.3 * endG + 0.05 * Math.sin(t * 2);
  return <div style={{position: 'absolute', left: 537 - 520, top: 300 - 520, width: 1040, height: 1040, borderRadius: '50%', mixBlendMode: 'screen', opacity: Math.min(1, o),
    background: 'radial-gradient(closest-side, #FFF2C4dd 0%, #FFD27A88 30%, #FFB45A33 60%, #FFB45A00 100%)'}}/>;
};

/** «بہشت»: a knitted rainbow (GPT Image 2 part) arches over the falls, swept in from its left foot to its right (bg px) */
export const RB = {x: 40, y: 1160, w: 1000, h: 501, cx: 500, cy: 470};   // box, and the arch's centre inside it
export const Rainbow: React.FC<{t: number; endG: number; p?: number}> = ({t, endG, p: forced}) => {
  const p = forced ?? inout((t - JANNAH) / 1.4);
  if (p <= 0) return null;
  const R = 760, pts: string[] = [`${RB.cx}px ${RB.cy + 60}px`, `${RB.cx - R}px ${RB.cy + 60}px`];
  for (let i = 0; i <= 40; i++) { const a = Math.PI + Math.PI * p * (i / 40); pts.push(`${(RB.cx + R * Math.cos(a)).toFixed(1)}px ${(RB.cy + R * Math.sin(a)).toFixed(1)}px`); }
  if (p >= 0.999) pts.push(`${RB.cx + R}px ${RB.cy + 60}px`);
  const glow = pulse(t - JANNAH - 1.2, 0.8);
  return <div style={{position: 'absolute', left: RB.x, top: RB.y, width: RB.w, height: RB.h, clipPath: p >= 0.999 ? undefined : `polygon(${pts.join(', ')})`,
    filter: `drop-shadow(0 10px 14px #000000aa) drop-shadow(0 0 ${10 + 26 * glow + 22 * endG}px #FFE3A0${endG > 0 ? 'cc' : '88'})`}}>
    <Img src={staticFile('parts/rainbow.png')} style={{width: RB.w, height: RB.h, transform: `scale(${1 + 0.02 * glow})`, transformOrigin: '50% 100%'}}/>
  </div>;
};
/** the sweep's leading edge: a gold needle-glow running along the arch while it is stitched */
export const RainbowEdge: React.FC<{t: number}> = ({t}) => {
  const p = inout((t - JANNAH) / 1.4);
  if (p <= 0.01 || p >= 0.99) return null;
  const a = Math.PI + Math.PI * p, r0 = 230, r1 = 500;
  const x0 = RB.x + RB.cx + r0 * Math.cos(a), y0 = RB.y + RB.cy + r0 * Math.sin(a), x1 = RB.x + RB.cx + r1 * Math.cos(a), y1 = RB.y + RB.cy + r1 * Math.sin(a);
  return <svg width={1080} height={BG_H} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#FFD66B" strokeWidth={22} strokeLinecap="round" opacity={0.6} filter="url(#soft9)"/>
    <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#FFF6D8" strokeWidth={4} strokeLinecap="round" strokeDasharray="10 7"/>
  </svg>;
};

/** crochet wildflowers bloom along the ledges on the words of the Paradise line (bg px) */
const LEDGE: [number, number, number, number][] = [   // x, y, size, flower: round the rainbow's feet and below it, clear of the text
  [70, 1090, 64, 0], [880, 1085, 58, 2], [160, 1215, 58, 3], [945, 1200, 62, 1], [62, 1340, 56, 4], [960, 1330, 56, 5],
  [110, 1760, 66, 1], [975, 1765, 62, 0], [270, 1850, 58, 2], [810, 1855, 60, 3]];
const Flowers: React.FC<{t: number}> = ({t}) => <>{LEDGE.map(([x, y, s, f], k) => {
  const p = springy(t - (JANNAH + 0.25 + 0.27 * k), 1.25);
  if (p <= 0) return null;
  return <Img key={k} src={staticFile(`parts/flower${f}.png`)} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s,
    transform: `scale(${p}) rotate(${(1 - p) * -140 + 7 * Math.sin(t * 1.2 + k)}deg)`, filter: 'drop-shadow(0 5px 5px #000000aa)'}}/>;
})}</>;

// ---- screen-space light ------------------------------------------------------------------------------------------------
/** «فرشتے اتریں گے»: rays of light reach down from the sky one after another, with falling sparks; light only, no figures */
const BEAMS = [[250, 14, 190], [110, 27, 140], [830, -14, 190], [970, -27, 140], [420, 6, 120], [660, -6, 120]] as const;   // top x, tilt, width
const Descend: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const d = t - (DESCEND - 0.5);
  if (d < 0) return null;
  return <>
    {BEAMS.map(([x, rot, w], k) => {
      const dk = d - 0.14 * k;
      if (dk < 0) return null;
      const reach = 2300 * ease(dk / 1.1);                 // how far down the ray has reached
      const o = (0.5 * c01(dk / 0.25) * (1 - 0.6 * c01((dk - 1.8) / 2.0)) + 0.1 * endG) * (0.85 + 0.15 * Math.sin(t * 2.1 + k * 1.3));
      const mask = `linear-gradient(180deg, black 0px, black ${Math.max(0, reach - 260)}px, transparent ${reach}px)`;
      return <div key={k} style={{position: 'absolute', left: x - w / 2, top: -180, width: w, height: 2300, mixBlendMode: 'screen', opacity: o,
        transform: `rotate(${rot}deg)`, transformOrigin: '50% 0%', filter: 'blur(22px)', WebkitMaskImage: mask, maskImage: mask,
        background: 'linear-gradient(90deg, #FFD98A00 0%, #FFE7B0aa 30%, #FFF4D6 50%, #FFE7B0aa 70%, #FFD98A00 100%)'}}/>;
    })}
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
      {Array.from({length: 44}, (_, k) => {
        const t0 = 2.0 * random(`ft${k}`), u = d - t0;
        if (u < 0 || u > 3.2) return null;
        const x = 50 + 980 * random(`fx${k}`) + 18 * Math.sin(u * 2 + k), y = -20 + u * (260 + 220 * random(`fv${k}`));
        const s = 6 + 10 * random(`fs${k}`), o = c01(u / 0.3) * (1 - c01((u - 2.4) / 0.8)) * (0.65 + 0.35 * Math.sin(t * 7 + k));
        const pts = Array.from({length: 8}, (_, i) => { const a = (i * Math.PI) / 4, r = i % 2 ? s * 0.3 : s; return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
        return <g key={k}><circle cx={x} cy={y} r={s * 1.4} fill="#FFD98A" opacity={o * 0.35} filter="url(#soft6)"/><polygon points={pts} fill="#FFF4D2" opacity={o}/></g>;
      })}
    </svg>
  </>;
};

/** two grey mohair mist banks drift in with "aur kahenge"; one dissolves on «خوف», the other on «غمناک» */
const MIST: [number, number, number][] = [[1130, FEAR, -1], [1340, GRIEF, 1]];
const Mist: React.FC<{t: number}> = ({t}) => <>{MIST.map(([y, tOut, dir], k) => {
  const inn = ease((t - 6.55 - 0.15 * k) / 0.7), out = ease((t - tOut) / 0.65);
  const o = inn * (1 - out);
  if (o <= 0) return null;
  return <React.Fragment key={k}>{Array.from({length: 14}, (_, j) => {
    const w = 260 + 200 * random(`mw${k}${j}`), h = 110 + 90 * random(`mh${k}${j}`), v = 10 + 26 * random(`mv${k}${j}`);
    const x = -170 + j * 95 + 50 * random(`mx${k}${j}`) + dir * (v * (t - 6.5) + (90 + 120 * random(`mo${k}${j}`)) * out);
    const yy = y - 120 + 200 * random(`my${k}${j}`) - 40 * out * random(`mu${k}${j}`);
    return <div key={j} style={{position: 'absolute', left: x - w / 2 + w / 2, top: yy - h / 2, width: w, height: h, borderRadius: '50%',
      opacity: o * (0.5 + 0.35 * random(`mq${k}${j}`)), transform: `scale(${1 + 0.35 * out})`, filter: 'blur(10px)',
      background: 'radial-gradient(closest-side, #E1E5EC 0%, #C3CAD5aa 45%, #C3CAD522 80%, #C3CAD500 100%)'}}/>;
  })}</React.Fragment>;
})}</>;
const MistSparks: React.FC<{t: number}> = ({t}) => <>{MIST.map(([y, tOut], k) => <Burst key={k} t={t} t0={tOut + 0.05} x={540} y={y} n={18} seed={`mist${k}`}
  power={0.7} size={0.6} cols={['#FFFFFF', '#FFF0C2', '#C4EAF0', '#FFE19A']}/>)}</>;

/** foreground: a knitted leafy branch hangs in at the right edge as the camera climbs (it moves faster: parallax) */
const Leaves: React.FC<{t: number}> = ({t}) => {
  const climb = Y0 - panY(t);
  if (climb < 300) return null;
  const y = -1500 + 1.42 * climb, sway = 2.2 * Math.sin(t * 1.1);
  return <>
    <Img src={staticFile('parts/leaf0.png')} style={{position: 'absolute', left: 968, top: y, width: 190, height: 887, transform: `scaleY(-1) rotate(${sway}deg)`,
      transformOrigin: '50% 100%', filter: 'drop-shadow(-6px 10px 10px #00000088) saturate(1.05)'}}/>
    <Img src={staticFile('parts/leaf1.png')} style={{position: 'absolute', left: -88, top: y + 760, width: 170, height: 748, transform: `scaleY(-1) rotate(${-sway}deg)`,
      transformOrigin: '50% 100%', filter: 'drop-shadow(6px 10px 10px #00000088) brightness(0.9)'}}/>
  </>;
};

// ---- text -------------------------------------------------------------------------------------------------------------
/** a word stitched in from its right edge (Arabic script) over its span */
const Word: React.FC<{w: string; t: number; a: number; b: number; font: string; size: number; lit: React.CSSProperties; ghost: React.CSSProperties;
  lh: number; gap: number; glow: string; done?: number; yarn?: string}> = ({w, t, a, b, font, size, lit, ghost, lh, gap, glow, done = 0, yarn = 'yarnA'}) => {
  const p = ease((t - a) / Math.max(0.2, b - a));
  const pop = pulse(t - a, 0.42);
  const pv = size * 0.75, ph = size * 0.45;
  return <span style={{position: 'relative', display: 'inline-block', marginLeft: gap, fontFamily: font, fontSize: size, lineHeight: lh, transform: `translateY(${-5 * pop}px)`}}>
    <span style={ghost}>{w}</span>
    {p > 0 ? <span style={{position: 'absolute', left: -ph, right: -ph, top: -pv, bottom: -pv, padding: `${pv}px ${ph}px`, clipPath: `inset(0 0 0 ${100 - 100 * p}%)`, ...lit,
      filter: `url(#${yarn}) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 8px 12px #00000088) drop-shadow(0 0 ${8 + 18 * pop + 12 * done}px ${glow})`}}>{w}</span> : null}
  </span>;
};

export const AYAH = {top: 400, size: 60, pitch: 108};
const Ayah: React.FC<{t: number; endG: number; on: number}> = ({t, endG, on}) => {
  const ghost: React.CSSProperties = {color: '#F1E4C8', opacity: 0.5, textShadow: '0 2px 4px #000000cc'};
  return <div style={{opacity: on}}>
    {TX.arLines.map(([a, b], li) => <div key={li} dir="rtl" style={{position: 'absolute', top: AYAH.top + li * AYAH.pitch, left: 0, right: 0, textAlign: 'center', whiteSpace: 'nowrap'}}>
      {TX.arWords.slice(a, b).map((w, n) => {
        const k = a + n;
        return <Word key={k} w={w} t={t} a={AR_T[k][0]} b={AR_T[k][1]} font={AR} size={AYAH.size} lh={1.7} gap={n === b - a - 1 ? 0 : AYAH.size * 0.24}
          lit={{...goldFill(t + k * 0.09), WebkitTextStroke: '1.1px #E3AC45'}} ghost={ghost} glow={`#FFC85A${endG > 0 ? 'cc' : '77'}`} done={endG} yarn="yarnU"/>;
      })}
      {li === 2 ? <span style={{fontFamily: AR, fontSize: AYAH.size * 0.9, lineHeight: 1.7, marginRight: AYAH.size * 0.28, display: 'inline-block',
        ...(t >= AR_SPAN[5][1] ? {...goldFill(t), WebkitTextStroke: '1px #E3AC45'} : {color: '#F1E4C8', opacity: 0.55}), filter: 'drop-shadow(0 2px 3px #000000cc)'}}>۝٣٠</span> : null}
    </div>)}
    <div style={{position: 'absolute', top: AYAH.top + 3 * AYAH.pitch + 6, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}>
      <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 27, color: '#F6E3BC', textShadow: '0 2px 3px #000000cc', letterSpacing: 0.5}}>
        Surah Fussilat 41:30 · tr. Sahih International</span>
      <span style={{width: 60, borderTop: '2px dashed #D9A847'}}/>
    </div>
  </div>;
};

export const CAP = {top: 778, size: 44, pitch: 74};
const Captions: React.FC<{t: number; endG: number}> = ({t, endG}) => {
  const ghost: React.CSSProperties = {color: '#F3E6CC', opacity: 0.42, textShadow: '0 2px 4px #000000aa'};
  return <>{TX.urPages.map((lines, pg) => {
    const a = PAGE_T[pg], b = pg < 4 ? PAGE_T[pg + 1] : 99;
    if (t < a - 0.01 || t > b + 0.22) return null;
    const i = ease((t - a) / 0.28), o = 1 - ease((t - b) / 0.22);
    const enTop = CAP.top + lines.length * CAP.pitch + 10;
    const lit = (k: number): React.CSSProperties => (endG > 0 && pg === 4
      ? {...goldFill(t + k * 0.1), WebkitTextStroke: '0.7px #E3AC45'} : {color: '#FFF4DE', textShadow: '0 2px 3px #00000099'});
    return <div key={pg} style={{opacity: i * o, transform: `translateY(${(1 - i) * 12 - (1 - o) * 10}px)`, filter: o < 1 ? `blur(${(1 - o) * 4}px)` : undefined}}>
      {lines.map(([wa, wb], li) => <div key={li} dir="rtl" style={{position: 'absolute', top: CAP.top + li * CAP.pitch, left: 0, right: 0, height: CAP.pitch,
        display: 'flex', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap'}}>
        {TX.urWords.slice(wa, wb).map((w, n) => {
          const k = wa + n;
          return <Word key={k} w={w} t={t} a={UR_T[k][0]} b={UR_T[k][1]} font={UR} size={CAP.size} lh={1.65} gap={n === wb - wa - 1 ? 0 : 9} yarn="yarnU"
            lit={lit(k)} ghost={ghost} glow={endG > 0 ? '#FFC85Acc' : '#F4B53F66'} done={pg === 4 ? endG : 0}/>;
        })}
      </div>)}
      <div style={{position: 'absolute', top: enTop, left: 90, right: 90, textAlign: 'center', fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, lineHeight: 1.18,
        color: pg === 4 && endG > 0 ? '#FFE3A0' : '#F6E7C8', textShadow: '0 2px 4px #000000cc', opacity: ease((t - a - 0.12) / 0.3)}}>{TX.en[pg]}</div>
    </div>;
  })}</>;
};

/** the reference's line: "Allah" and the anatomical heart, in yarn; the heart beats, and leaps on «اللہ» */
const beat = (t: number) => { const u = (t % 1.05) / 1.05; return pulse(u, 0.14) + 0.6 * pulse(u - 0.17, 0.14); };
export const AllahLine: React.FC<{t: number; endG: number; top: number}> = ({t, endG, top}) => {
  const leap = pulse(t - ALLAH_W, 0.5), sc = 1 + 0.05 * beat(t) + 0.16 * leap;
  return <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
    <span style={{fontFamily: SERIF, fontSize: 84, lineHeight: 1, ...goldFill(t * 0.6, 0.35), WebkitTextStroke: '1.4px #E7B040',
      filter: `url(#yarnA) drop-shadow(0 3px 2px #1A0A04cc) drop-shadow(0 10px 14px #00000099) drop-shadow(0 0 ${12 + 26 * leap + 14 * endG}px #FFC85A99)`}}>Allah</span>
    <Img src={staticFile('parts/heart.png')} style={{width: 64, height: 93, transform: `scale(${sc}) rotate(${-6 + 4 * leap}deg)`,
      filter: `drop-shadow(0 6px 6px #000000aa) drop-shadow(0 0 ${6 + 18 * leap + 10 * beat(t)}px #FF5A6Aaa)`}}/>
  </div>;
};

/** frame 0: the reference caption's promise on a knitted ribbon, until the first phrase has been said */
const Hook: React.FC<{t: number}> = ({t}) => {
  const o = 1 - ease((t - HOOK_OUT) / 0.3);
  if (o <= 0) return null;
  return <div style={{position: 'absolute', top: 1296, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o,
    transform: `translateY(${18 * (1 - o)}px) scale(${1 - 0.04 * (1 - o)})`, filter: o < 1 ? `blur(${(1 - o) * 4}px)` : undefined}}>
    <div style={{padding: '14px 46px 18px', borderRadius: 44, background: 'linear-gradient(180deg, #1C3550f2, #0F2238f2)', border: '3px dashed #E2B45A',
      boxShadow: '0 10px 24px #000000aa, 0 0 22px #F6C55244', textAlign: 'center'}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 54, lineHeight: 1.1, color: '#FBEFD8', textShadow: '0 2px 4px #000000cc', whiteSpace: 'nowrap'}}>
        Don&apos;t fear, don&apos;t grieve…</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, lineHeight: 1.12, ...goldFill(t, 0.5), WebkitTextStroke: '1px #E3AC45',
        filter: 'drop-shadow(0 3px 3px #000000cc)', whiteSpace: 'nowrap'}}>Paradise awaits</div>
    </div>
  </div>;
};

/** filters this reel adds: the yarn fuzz on the flowing strands and on the dye ring */
const Defs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}><defs>
  <filter id="strandFuzz" x="-5%" y="-2%" width="110%" height="104%" colorInterpolationFilters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.09 0.012" numOctaves={2} seed={11} result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation={0.7}/>
  </filter>
  <filter id="ringFuzz" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves={1} seed={4} result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</defs></svg>;

export const Scene: React.FC<{t: number; endG: number; Y: number; z: number}> = ({t, endG, Y, z}) =>
  <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${CAM_O.x}px ${CAM_O.y}px`}}>
    <div style={{position: 'absolute', left: 0, top: -Y, width: 1080, height: BG_H}}>
      <Img src={staticFile('bg.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: BG_H}}/>
      <Sun t={t} endG={endG}/>
      <Falls t={t}/>
      <Spray t={t}/>
      <Rainbow t={t} endG={endG}/>
      <RainbowEdge t={t}/>
      <Flowers t={t}/>
      <RawWool t={t}/>
      <DyeRing t={t}/>
    </div>
  </AbsoluteFill>;

export const FussilatKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const endG = ease((t - REJOICE) / 0.5);
  const Y = panY(t), z = camZ(t);
  // the rainy grey of the reference lifts on "don't fear / don't grieve", the light warms on Paradise
  const grey = 1 - ease((t - FEAR) / 2.0);
  const impactY = CAM_O.y + (IMPACT.y - Y - CAM_O.y) * z;
  return <AbsoluteFill style={{background: '#0C1A26', overflow: 'hidden'}}>
    <Audio src={staticFile('audio.wav')}/>
    <YarnDefs/>
    <YarnLite/>
    <Filters/>
    <Defs/>
    <Scene t={t} endG={endG} Y={Y} z={z}/>
    <AbsoluteFill style={{background: '#5A6B80', mixBlendMode: 'multiply', opacity: 0.22 * grey * c01(t / 0.6 + 0.3)}}/>
    <Mist t={t}/>
    <Leaves t={t}/>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 45% at 50% 22%, #FFD98A 0%, #FFD98A00 100%)', mixBlendMode: 'screen', opacity: 0.35 * endG}}/>
    {/* calm the falls behind the text block */}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #07121Fd0 0px, #07121Fc4 300px, #07121Fb0 760px, #07121F70 960px, #07121F00 1130px)'}}/>

    <Descend t={t} endG={endG}/>
    <Thread t={t} x={IMPACT.x} y={impactY}/>
    <Burst t={t} t0={VOICE} x={IMPACT.x} y={impactY} n={34} seed="splash" power={1.15} cols={[PAL.teal, PAL.aqua, '#FFFFFF', PAL.rose, PAL.saffron, PAL.violet, PAL.sage]}/>
    <MistSparks t={t}/>
    <Burst t={t} t0={REJOICE + 0.02} x={540} y={1250} n={40} seed="rejoice" power={1.3} size={1.05}
      cols={[PAL.gold, '#FFE9B0', PAL.saffron, PAL.rose, PAL.cream, PAL.teal]}/>

    <Handle top={222} endP={c01((t - REJOICE) / 0.6)}/>
    <AllahLine t={t} endG={endG} top={282}/>
    <Ayah t={t} endG={endG} on={ease((t - 0.18) / 0.35)}/>
    <Captions t={t} endG={endG}/>
    <Hook t={t}/>
  </AbsoluteFill>;
};
