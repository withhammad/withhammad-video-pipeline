// PRIVATE (for the owner's wife, @heal.ingthroughquran; never posted from the business accounts): "Three jars, one calm heart"
// (reference DftMLTpt2CO by @roadtojannahfirdaus, 95.3 s, job 2fe6dca9a831) rebuilt in knitted yarn. Same flow on the reference
// clock, measured frame by frame: a tasbih slides in, then 33 x SubhanAllah, 33 x Alhamdulillah, 33 x Allahu Akbar, one bead per
// count rolling off the string, glancing off a deflector and dropping into its vessel (the counter steps on the frames where
// the reference counter steps), the dhikr line changing with each set, the imam bead and tassel at 99, a closing card, a CTA
// and a fade. The reference's music stays underneath; a soft female voice (Lamia) says each phrase (voice.py).
// Knitted and changed on purpose (owner brief: "replace the jars with something surprising and Islamic, make it a wow"): the
// three glass jars become three crochet fanoos lanterns standing on the sill of a knitted Moroccan riad arch; each bead that
// falls in is a felted temari bead that lights the lantern a little more (turquoise, coral, saffron). The wooden deflector is a
// crochet crescent. The sky in the arch is knitted too and turns from Maghrib dusk to night across the 99 counts, so the
// lanterns become the light of the room. Wow at 99: the three lanterns flare one after another, their light rises out of the
// crowns as sparks that become crochet stars across the night sky, and eight-pointed star light spills onto the wall.
// The reference's closing line is replaced by Quran 2:152, the verse its caption quotes («فَٱذْكُرُونِىٓ أَذْكُرْكُمْ ...», Uthmani,
// quran.com = Tanzil) with Sahih International's English. All Arabic comes from texts.json (built and checked by text.py).
import React from 'react';
import {AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {Needle, PUFF, YarnDefs, gold} from '../asmaknit/AsmaKnit';
import {Burst, Filters, Handle} from '../tasbeehknit/TasbeehKnit';
import TX from './texts.json';

export const FPS = 30, FRAMES = 2859;
export const SERIF = 'KnitSerif, serif';
export const AR = 'AmiriQ, "Amiri Quran", serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** puffy yarn light and grain for Arabic WITHOUT the fibre displacement of #yarn: every mark stays where the font puts it */
export const AR_PUFF = 'url(#yarnAr) drop-shadow(0 3px 2px #2A0508cc) drop-shadow(0 12px 18px #00000099)';
export const ArDefs: React.FC = () => <svg width={0} height={0} style={{position: 'absolute'}}>
  <defs>
    <filter id="yarnAr" x="-8%" y="-30%" width="116%" height="160%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.22 1.5" numOctaves={1} seed={3} result="grain"/>
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0 0.04  1.7 0 0 0 -0.78" result="grainA"/>
      <feComposite in="grainA" in2="SourceGraphic" operator="in" result="grainIn"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation={2.4} result="soft"/>
      <feSpecularLighting in="soft" surfaceScale={5} specularConstant={0.85} specularExponent={16} lightingColor="#FFF4DC" result="spec">
        <feDistantLight azimuth={235} elevation={48}/>
      </feSpecularLighting>
      <feComposite in="spec" in2="SourceGraphic" operator="in" result="specIn"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="grainIn"/><feMergeNode in="specIn"/></feMerge>
    </filter>
  </defs>
</svg>;
export const c01 = (x: number) => Math.min(1, Math.max(0, x));
export const ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const inout = (x: number) => { const u = c01(x); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
/** spring 0 -> 1 with an overshoot; k = stiffness */
const springy = (x: number, k = 1) => (x <= 0 ? 0 : x * k > 1.2 ? 1 : 1 - Math.exp(-x * k * 7) * Math.cos(x * k * 11));
const pulse = (x: number, w = 0.25) => (x < 0 || x > w ? 0 : Math.pow(Math.sin((Math.PI * x) / w), 2));
const mix = (a: string, b: string, u: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * c01(u))).join(',')})`;
};

// ---- the reference clock: frames where the reference counter steps (diff of its "n / 99" digits, 30 fps) -----------------
export const SETS = [
  [59, 85, 110, 136, 161, 186, 212, 237, 263, 288, 313, 339, 364, 390, 415, 440, 466, 491, 516, 541, 567, 592, 618, 643, 668, 694, 719,
    744, 769, 795, 820, 846, 870],
  [936, 962, 987, 1012, 1038, 1063, 1088, 1114, 1139, 1164, 1190, 1215, 1241, 1266, 1291, 1316, 1342, 1367, 1392, 1418, 1443, 1469, 1494,
    1519, 1544, 1570, 1596, 1620, 1646, 1671, 1697, 1722, 1747],
  [1838, 1864, 1889, 1915, 1940, 1965, 1991, 2016, 2042, 2067, 2092, 2118, 2143, 2169, 2194, 2219, 2245, 2270, 2295, 2320, 2346, 2371, 2397,
    2422, 2447, 2473, 2498, 2523, 2548, 2574, 2599, 2625, 2650],
];
export const ALL = SETS.flat();                       // 99 counts
const HEAD = [893, 1783];                             // the header says "Dhikr 2 of 3" / "3 of 3"
const TEXT_SW = [886, 1775];                          // the dhikr line crossfades (886-903, 1775-1793)
export const END_TEXT = 2657, COMPLETE = 2665, CTA = 2719, FADE = 2833;
const HOOK_END = 46;                                  // the opening hook hands over to the first dhikr line
const DROP = 24, LAND = 1;                            // a bead leaves the string 24 frames before its count, lands 1 before

export const PHASE = [
  {name: 'tq', main: '#3CC4C0', deep: '#127A78', light: '#D2F6F2', glow: '#52E6DC', tr: 'SubhanAllah', en: 'Glory be to Allah', ar: TX.sub},
  {name: 'co', main: '#F2826F', deep: '#B4473B', light: '#FFDCD2', glow: '#FF8F78', tr: 'Alhamdulillah', en: 'All praise is due to Allah', ar: TX.hamd},
  {name: 'go', main: '#F5B83D', deep: '#A86B0E', light: '#FFE8A8', glow: '#FFC54C', tr: 'Allahu Akbar', en: 'Allah is the Greatest', ar: TX.akbar},
];

export const setCount = (g: number, f: number) => SETS[g].filter((x) => f >= x).length;
export const total = (f: number) => ALL.filter((x) => f >= x).length;
export const setAt = (f: number) => (f >= HEAD[1] ? 2 : f >= HEAD[0] ? 1 : 0);

// ---- layout (1080 x 1920; text between y 222 and 1480, none right of x 950 below y 1000) -------------------------------------
export const LH = 500, LT = 848;                                       // lanterns: display height, top (feet on the sill at 1348)
export const LX = [285, 540, 795];
const LSRC = [464, 464, 465];                                          // frame PNG widths at 1024 px tall (prep.py layout.json)
const WIN = [[0.2694, 0.7306, 0.4688, 0.7725], [0.2672, 0.7328, 0.4688, 0.7725], [0.2667, 0.7312, 0.4688, 0.7725]];
export const LW = LSRC.map((w) => (LH * w) / 1024);
const win = (g: number) => {
  const [x0, x1, y0, y1] = WIN[g], L = LX[g] - LW[g] / 2;
  return {x0: L + x0 * LW[g], x1: L + x1 * LW[g], y0: LT + y0 * LH, y1: LT + y1 * LH};
};
export const OPEN = {x0: 151, x1: 928, y0: 195, y1: 1294};             // the arch opening (sky), prep.py layout.json

// the pile inside each lantern: rows of 5 and 4 (hex packing), filled left to right, then right to left
const BI = 20;
const pileSlot = (g: number, n: number) => {
  const w = win(g), cx = (w.x0 + w.x1) / 2;
  let r = 0, k = n;
  while (k >= (r % 2 ? 4 : 5)) { k -= r % 2 ? 4 : 5; r++; }
  const cols = r % 2 ? 4 : 5, j = r % 4 >= 2 ? cols - 1 - k : k;
  return {x: cx + (j - (cols - 1) / 2) * 20.6 + (random(`px${g}-${n}`) - 0.5) * 2.4,
    y: w.y1 - 12 - r * 17.4 + (random(`py${g}-${n}`) - 0.5) * 2, rot: random(`pr${g}-${n}`) * 360};
};

// ---- the tasbih string: a Catmull-Rom curve from its end E (s = 0) up and away to the left edge ---------------------------
const CTRL: [number, number][] = [[540, 692], [470, 689], [380, 679], [280, 662], [170, 640], [60, 616], [-60, 590], [-180, 562]];
const STRING = (() => {
  const pts: {x: number; y: number; s: number}[] = [];
  let s = 0, px = CTRL[0][0], py = CTRL[0][1];
  for (let k = 0; k < CTRL.length - 1; k++) {
    const p0 = CTRL[Math.max(0, k - 1)], p1 = CTRL[k], p2 = CTRL[k + 1], p3 = CTRL[Math.min(CTRL.length - 1, k + 2)];
    for (let j = 0; j < 24; j++) {
      const u = j / 24, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      const x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1]);
      s += Math.hypot(x - px, y - py); pts.push({x, y, s}); px = x; py = y;
    }
  }
  return pts;
})();
const S_END = STRING[STRING.length - 1].s;
const atLen = (s: number) => {
  if (s <= 0) return STRING[0];
  for (let k = 1; k < STRING.length; k++) if (STRING[k].s >= s) {
    const a = STRING[k - 1], b = STRING[k], u = (s - a.s) / Math.max(1e-6, b.s - a.s);
    return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, s};
  }
  return STRING[STRING.length - 1];
};
const STRING_D = STRING.filter((_, k) => k % 2 === 0).map((p, n) => `${n ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const SP = 33, BS = 30, S0 = 17;                                       // slot spacing, bead size on the string, slot 0 at s = 17
const beadSrc = (i: number) => staticFile(`parts/bead_${PHASE[Math.min(2, Math.floor(i / 33))].name}${i % 5}.png`);
/** slots the string has advanced: each drop pulls the string one slot in 5 frames; the intro slides the beads in from the left */
const advance = (f: number) => ALL.reduce((a, F) => a + ease((f - (F - DROP)) / 5), 0) - 15 * (1 - ease((f - 4) / 34));

// ---- the crescent deflector: right of the drop for set 1 (bounce left), left of it for sets 2 and 3 (bounce right) -------------
const CRES = [{x: 590, y: 768, rot: 16}, {x: 484, y: 768, rot: -12}, {x: 484, y: 768, rot: -26}];
const CONTACT = [{x: 531, y: 734}, {x: 526, y: 716}, {x: 526, y: 716}];
const CH = 118, CW = (CH * 492) / 559, MOON_X = 826;
const MOON = {x: 826, y: 690, rot: -22};
const crescentPose = (f: number) => {
  const sw = (a: number) => springy((f - a) / FPS, 1.1);
  const k1 = sw(HEAD[0]), k2 = sw(HEAD[1]);
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  let x = lerp(CRES[0].x, CRES[1].x, k1), rot = lerp(CRES[0].rot, CRES[1].rot, k1);
  x = lerp(x, CRES[2].x, k2); rot = lerp(rot, CRES[2].rot, k2);
  // every hit: a damped wobble
  for (const F of ALL) { const d = (f - (F - DROP + 6)) / FPS; if (d >= 0 && d < 1.2) rot += 7 * Math.exp(-d * 5) * Math.sin(d * 24) * (setAt(F) === 0 ? 1 : -1); }
  // at 99 it rises over the right lantern and becomes the moon of the night sky
  const m = inout((f - COMPLETE - 6) / 45), y = CRES[0].y + 4 * Math.sin(f / 37);
  return {x: lerp(x, MOON.x, m), y: lerp(y, MOON.y, m) - 22 * Math.sin(Math.PI * m), rot: lerp(rot, MOON.rot, m), sc: 1 + 0.14 * m};
};

// ---- one bead's flight: string end -> crescent -> lantern crown -> its place in the pile --------------------------------------
const G = 3600;
const flight = (i: number, f: number) => {
  const F = ALL[i], g = Math.floor(i / 33), n = i % 33, D = F - DROP;
  if (f < D || f >= F - LAND) return null;
  const s0 = atLen(S0), C = CONTACT[g], K = {x: LX[g], y: LT + 40}, P = pileSlot(g, n);
  const t = f - D;
  if (t < 6) { const u = t / 6; return {x: s0.x + (C.x - s0.x) * u, y: s0.y + (C.y - s0.y) * u * u, s: BS - 2 * u, rot: t * 9}; }
  if (t < 16) {
    const T = 10 / FPS, tau = (t - 6) / FPS, vy = (K.y - C.y - 0.5 * G * T * T) / T;
    return {x: C.x + (K.x - C.x) * ((t - 6) / 10), y: C.y + vy * tau + 0.5 * G * tau * tau, s: BS - 2 - 6 * ((t - 6) / 10), rot: t * 14};
  }
  const u = (t - 16) / (DROP - LAND - 16);
  return {x: K.x + (P.x - K.x) * inout(u), y: K.y + (P.y - K.y) * u * u, s: 22 - 2 * u, rot: t * 14};
};

// ---- the sky in the arch: Maghrib dusk to night across the counting, knitted --------------------------------------------------
const SKY = [
  ['#3B3A7C', '#8E6A9E', '#F0A47A'],
  ['#272B66', '#4F4A88', '#B9697C'],
  ['#111842', '#1A2558', '#2A3A72'],
];
export const dusk = (f: number) => inout((f - 45) / (COMPLETE - 45));
export const Sky: React.FC<{u: number}> = ({u}) => {
  const k = u < 0.5 ? 0 : 1, v = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
  const c = [0, 1, 2].map((j) => mix(SKY[k][j], SKY[k + 1][j], v));
  return <div style={{position: 'absolute', left: OPEN.x0 - 4, top: OPEN.y0 - 4, width: OPEN.x1 - OPEN.x0 + 8, height: OPEN.y1 - OPEN.y0 + 8, overflow: 'hidden',
    background: `linear-gradient(180deg, ${c[0]} 0%, ${c[0]} 18%, ${c[1]} 62%, ${c[2]} 100%)`}}>
    <Img src={staticFile('knit.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 781, height: 1388, mixBlendMode: 'soft-light', opacity: 0.95}}/>
    <Img src={staticFile('knit.jpg')} style={{position: 'absolute', left: 0, top: 0, width: 781, height: 1388, mixBlendMode: 'multiply', opacity: 0.18}}/>
  </div>;
};

// stars that come out as night falls (crochet stars inside the opening), and the ones the lanterns send up at 99; none behind
// text (a star behind a Latin letter reads as an accent) or in front of a lantern or the moon
const TEXT_BOX: [number, number, number, number][] = [[340, 740, 212, 314], [150, 930, 300, 645], [300, 780, 712, 790], [MOON_X - 75, MOON_X + 75, 610, 770]];
const skyPoint = (seed: string) => {
  for (let k = 0; k < 200; k++) {
    const x = OPEN.x0 + 22 + random(`${seed}x${k}`) * (OPEN.x1 - OPEN.x0 - 44), y = 215 + random(`${seed}y${k}`) * 860;
    const inArch = y >= 585 || Math.hypot(x - 540, y - 585) < 370;
    const nearText = TEXT_BOX.some(([x0, x1, y0, y1]) => x > x0 - 14 && x < x1 + 14 && y > y0 - 14 && y < y1 + 14);
    const nearLantern = y > 830 && LX.some((lx) => Math.abs(x - lx) < 128);
    if (inArch && !nearText && !nearLantern) return {x, y};
  }
  return {x: 200, y: 700};
};
const STARS = Array.from({length: 22}, (_, k) => ({...skyPoint(`st${k}`), s: 14 + random(`ss${k}`) * 12, at: 0.25 + 0.7 * (k / 22),
  src: ['star_cr', 'star_go', 'star_cr', 'star_tq'][k % 4]}));
const RISE = Array.from({length: 24}, (_, k) => {
  const g = k % 3, p = skyPoint(`rise${k}`);
  return {g, x: p.x, y: p.y, t0: COMPLETE + 4 + g * 4 + Math.floor(k / 3) * 3, dur: 30 + random(`rd${k}`) * 16, s: 16 + random(`rs${k}`) * 14};
});
const Stars: React.FC<{f: number; u: number}> = ({f, u}) => <>
  {STARS.map((st, k) => { const p = springy((u - st.at) * 6, 1); if (p <= 0) return null;
    const tw = 0.6 + 0.4 * Math.sin(f / (11 + (k % 5) * 3) + k);
    return <Img key={k} src={staticFile(`parts/${st.src}.png`)} style={{position: 'absolute', left: st.x - st.s / 2, top: st.y - st.s / 2, width: st.s, height: st.s,
      opacity: Math.min(1, p) * (0.55 + 0.45 * tw), transform: `scale(${p}) rotate(${f * 0.4 + k * 30}deg)`, filter: `drop-shadow(0 0 ${4 + 5 * tw}px #FFF1C9)`}}/>; })}
  {RISE.map((r, k) => {
    const d = (f - r.t0) / r.dur; if (d < 0) return null;
    const from = {x: LX[r.g], y: LT + 30}, P = PHASE[r.g];
    if (d < 1) {
      const e = inout(d), x = from.x + (r.x - from.x) * e + Math.sin(d * 9 + k) * 18 * (1 - d), y = from.y + (r.y - from.y) * e;
      return <div key={k} style={{position: 'absolute', left: x - 5, top: y - 5, width: 10, height: 10, borderRadius: '50%', background: '#FFF6DA',
        boxShadow: `0 0 12px 5px ${P.glow}, 0 0 26px 8px ${P.glow}88`, opacity: 0.4 + 0.6 * d}}/>;
    }
    const p = springy((f - r.t0 - r.dur) / FPS, 1.4), tw = 0.65 + 0.35 * Math.sin(f / 9 + k);
    return <Img key={k} src={staticFile(`parts/star_${['tq', 'cr', 'go'][r.g]}.png`)} style={{position: 'absolute', left: r.x - r.s / 2, top: r.y - r.s / 2, width: r.s,
      height: r.s, transform: `scale(${p * (1 + 0.6 * pulse((f - r.t0 - r.dur) / FPS, 0.3))}) rotate(${f * 0.5 + k * 40}deg)`,
      filter: `drop-shadow(0 0 ${6 + 6 * tw}px ${P.glow})`}}/>;
  })}
</>;

// ---- lanterns ------------------------------------------------------------------------------------------------------------------
/** how lit lantern g is (0..1, 1/33 per bead) and its flash on the last landing */
export const level = (g: number, f: number) => SETS[g].reduce((a, F) => a + ease((f - (F - LAND)) / 8), 0) / 33;
const flash = (g: number, f: number) => SETS[g].reduce((m, F) => Math.max(m, pulse((f - (F - LAND)) / FPS, 0.4)), 0);

export const Halo: React.FC<{g: number; f: number; u: number; boost?: number}> = ({g, f, u, boost = 0}) => {
  const lv = Math.min(1, level(g, f) + boost), P = PHASE[g], w = win(g), cy = (w.y0 + w.y1) / 2, fl = flash(g, f);
  const R = 170 + 170 * lv + 30 * fl;
  return <>
    <div style={{position: 'absolute', left: LX[g] - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: (0.08 + 0.62 * lv + 0.25 * fl) * (0.6 + 0.4 * u), background: `radial-gradient(closest-side, ${P.glow}cc 0%, ${P.glow}44 45%, ${P.glow}00 100%)`}}/>
    <div style={{position: 'absolute', left: LX[g] - 175, top: 1322, width: 350, height: 70, borderRadius: '50%', mixBlendMode: 'screen',
      opacity: 0.85 * lv * (0.5 + 0.5 * u) + 0.2 * fl, background: `radial-gradient(closest-side, ${P.light}dd 0%, ${P.glow}66 50%, ${P.glow}00 100%)`}}/>
  </>;
};

export const Lantern: React.FC<{g: number; f: number; u: number; boost?: number; z: number; flyers?: boolean}> = ({g, f, u, boost = 0, z, flyers = true}) => {
  const P = PHASE[g], lv = Math.min(1, level(g, f) + boost), fl = flash(g, f), left = LX[g] - LW[g] / 2;
  const box: React.CSSProperties = {position: 'absolute', left, top: LT, width: LW[g], height: LH};
  const mask = (src: string): React.CSSProperties => ({WebkitMaskImage: `url(${staticFile(src)})`, WebkitMaskSize: '100% 100%', maskImage: `url(${staticFile(src)})`, maskSize: '100% 100%'});
  const w = win(g), cyRel = ((w.y0 + w.y1) / 2 - LT) / LH * 100;
  const landed = SETS[g].map((F, n) => ({F, n})).filter(({F}) => f >= F - LAND);
  const beadGlow = 0.25 + 0.75 * lv;
  return <div style={{position: 'absolute', inset: 0, zIndex: z}}>
    {/* inside the lantern: smoky glass, lit from the pile */}
    <div style={{...box, ...mask(`parts/hole${g}.png`), background: '#1B1530'}}/>
    <div style={{...box, ...mask(`parts/hole${g}.png`), opacity: Math.min(1, 0.1 + 0.9 * lv + 0.3 * fl),
      background: `radial-gradient(ellipse 55% 40% at 50% ${cyRel + 10}%, #FFFBEA 0%, ${P.light} 22%, ${P.main} 55%, ${P.deep} 100%)`}}/>
    {/* the pile of felted beads, seen through the front window */}
    <div style={{position: 'absolute', inset: 0, ...{WebkitMaskImage: `url(${staticFile(`parts/win${g}.png`)})`, maskImage: `url(${staticFile(`parts/win${g}.png`)})`},
      WebkitMaskSize: `${LW[g]}px ${LH}px`, maskSize: `${LW[g]}px ${LH}px`, WebkitMaskPosition: `${left}px ${LT}px`, maskPosition: `${left}px ${LT}px`,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat'}}>
      {landed.map(({F, n}) => {
        const p = pileSlot(g, n), d = (f - (F - LAND)) / FPS, sq = d < 0.3 ? 1 - 0.18 * pulse(d, 0.18) : 1, hop = d < 0.3 ? -3 * pulse(d - 0.06, 0.2) : 0;
        return <Img key={n} src={beadSrc(g * 33 + n)} style={{position: 'absolute', left: p.x - BI / 2, top: p.y - BI / 2 + hop, width: BI, height: BI,
          transform: `rotate(${p.rot}deg) scale(${1 / sq}, ${sq})`,
          filter: `brightness(${0.85 + 0.45 * beadGlow + 0.6 * pulse(d, 0.35)}) drop-shadow(0 0 ${3 + 5 * beadGlow}px ${P.glow})`}}/>;
      })}
    </div>
    {/* the bead in flight goes behind the crown and the frame */}
    {flyers ? SETS[g].map((F, n) => { const q = flight(g * 33 + n, f); if (!q) return null;
      return <Img key={`f${n}`} src={beadSrc(g * 33 + n)} style={{position: 'absolute', left: q.x - q.s / 2, top: q.y - q.s / 2, width: q.s, height: q.s,
        transform: `rotate(${q.rot}deg)`, filter: 'drop-shadow(0 5px 4px #00000088)'}}/>; }) : null}
    <Img src={staticFile(`parts/lantern${g}.png`)} style={{...box, filter: `brightness(${0.66 + 0.34 * (1 - u) + 0.42 * lv + 0.2 * fl}) drop-shadow(0 12px 12px #000000aa)` +
      (lv > 0.02 ? ` drop-shadow(0 0 ${4 + 16 * lv + 10 * fl}px ${P.glow}${lv > 0.5 ? 'cc' : '88'})` : '')}}/>
    {/* a glint where each bead lands */}
    {landed.length && f - (landed[landed.length - 1].F - LAND) < 12 ? (() => { const L = landed[landed.length - 1], p = pileSlot(g, L.n), d = (f - (L.F - LAND)) / FPS;
      return <div style={{position: 'absolute', left: p.x - 22, top: p.y - 22, width: 44, height: 44, borderRadius: '50%', mixBlendMode: 'screen',
        opacity: pulse(d, 0.38), background: `radial-gradient(closest-side, #FFFFFF 0%, ${P.glow}aa 40%, ${P.glow}00 100%)`}}/>; })() : null}
  </div>;
};

// ---- the string and its beads, the imam bead and tassel at the end -------------------------------------------------------------
const Tasbih: React.FC<{f: number}> = ({f}) => {
  const away = inout((f - COMPLETE) / 40), a = advance(f) - 24 * away, out: React.ReactNode[] = [], fade = 1 - away;
  for (let i = Math.max(0, Math.floor(a) - 1); i <= 99; i++) {
    if (i < 99 && f >= ALL[i] - DROP) continue;                  // already falling or in a lantern
    const s = S0 + (i - a) * SP;
    if (s > S_END + BS) break;
    const q = atLen(Math.max(S0, s));
    if (s > S_END - 4) continue;
    if (i === 99) {                                              // the imam bead with its tassel hangs from the end
      const sway = 4 * Math.sin(f / 21) + 10 * Math.exp(-Math.max(0, f - 2631) / 20) * Math.sin(Math.max(0, f - 2631) / 4);
      out.push(<Img key="tassel" src={staticFile('parts/tassel.png')} style={{position: 'absolute', left: q.x - 30, top: q.y - 22, width: 60, height: 151,
        transform: `rotate(${sway}deg)`, transformOrigin: '50% 15%', filter: 'drop-shadow(0 6px 5px #00000099)'}}/>);
      continue;
    }
    out.push(<Img key={i} src={beadSrc(i)} style={{position: 'absolute', left: q.x - BS / 2, top: q.y - 1 - BS / 2, width: BS, height: BS,
      transform: `rotate(${-s * 1.6 + i * 37}deg)`, filter: 'drop-shadow(0 5px 4px #00000099)'}}/>);
  }
  return <div style={{position: 'absolute', inset: 0}}>
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: fade}}>
      <path d={STRING_D} stroke="#E9C987" strokeWidth={4} fill="none" strokeLinecap="round" style={{filter: 'url(#yarn) drop-shadow(0 3px 3px #00000099)'}}/>
      <circle cx={CTRL[0][0]} cy={CTRL[0][1]} r={5} fill="#F2C55C" stroke="#A8741E" strokeWidth={1.5}/>
    </svg>
    {out}
  </div>;
};

const Crescent: React.FC<{f: number; glow: number}> = ({f, glow}) => {
  const c = crescentPose(f), hit = ALL.reduce((m, F) => Math.max(m, pulse((f - (F - DROP + 6)) / FPS, 0.3)), 0);
  return <Img src={staticFile('parts/crescent.png')} style={{position: 'absolute', left: c.x - CW / 2, top: c.y - CH / 2, width: CW, height: CH,
    transform: `rotate(${c.rot}deg) scale(${c.sc * (1 + 0.05 * hit)})`, filter: `drop-shadow(0 8px 8px #00000099) drop-shadow(0 0 ${6 + 10 * hit + 16 * glow}px #FFE3A0${glow > 0.3 ? 'cc' : '77'})`}}/>;
};

// ---- text -----------------------------------------------------------------------------------------------------------------------
const Header: React.FC<{f: number}> = ({f}) => {
  const g = setAt(f), n = total(f), done = f >= COMPLETE, P = done ? PHASE[2] : PHASE[g];
  const last = ALL.filter((x) => f >= x).pop() ?? -99, pop = 1 + 0.18 * pulse((f - last) / FPS, 0.28);
  return <div style={{position: 'absolute', top: 268, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 6}}>
    <div style={{padding: '5px 26px 8px', borderRadius: 40, background: 'linear-gradient(180deg, #2C2560ee, #1B1745ee)', border: `2.5px dashed ${P.main}`,
      boxShadow: `0 6px 14px #00000088, 0 0 14px ${P.glow}55`, fontFamily: SERIF, fontSize: 28, lineHeight: 1.1, color: '#FFF3DA', whiteSpace: 'nowrap',
      letterSpacing: 1.5}}>
      {done ? 'COMPLETE' : `DHIKR ${g + 1} OF 3`} · <span style={{display: 'inline-block', color: P.light, transform: `scale(${pop})`}}>{n}</span> / 99
    </div>
  </div>;
};

/** one dhikr block: the Arabic stitched in right to left by the needle, the transliteration and meaning under it */
const Dhikr: React.FC<{f: number; g: number; a: number; b: number; stitch?: boolean}> = ({f, g, a, b, stitch = false}) => {
  if (f < a || f > b + 18) return null;
  const P = PHASE[g], inn = stitch ? 1 : ease((f - a) / 17), out = 1 - ease((f - b) / 17);
  const rv = stitch ? ease((f - a) / 13) : 1, X = 100 - 100 * rv;
  const last = ALL.filter((x) => f >= x).pop() ?? -99, beat = pulse((f - last) / FPS, 0.35);
  return <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 312, textAlign: 'center', opacity: Math.min(inn, out), zIndex: 5,
      transform: `translateY(${(1 - inn) * 18 - (1 - out) * 18}px)`, filter: out < 1 || inn < 1 ? `blur(${(1 - Math.min(inn, out)) * 4}px)` : undefined}}>
      <div dir="rtl" style={{fontFamily: AR, fontSize: 96, lineHeight: 1.5, color: P.light, WebkitTextStroke: `2px ${P.main}`, clipPath: `inset(-40% 0 -40% ${X}%)`,
        filter: `${AR_PUFF} drop-shadow(0 0 ${16 + 26 * beat}px ${P.glow}88)`}}>{P.ar}</div>
      <div style={{fontFamily: SERIF, fontSize: 46, lineHeight: 1, marginTop: 16, color: '#FFF3DA', textShadow: '0 3px 4px #000000cc'}}>{P.tr}</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, lineHeight: 1.25, color: P.light, textShadow: '0 2px 3px #000000cc'}}>{P.en}</div>
    </div>
    {stitch && rv < 1 ? <Needle x={1080 * X / 100} y={392} o={interpolate(f - a, [0, 2, 11, 13], [0, 1, 1, 0], clamp)}/> : null}
  </>;
};

const Hook: React.FC<{f: number}> = ({f}) => {
  if (f > HOOK_END + 14) return null;
  const out = 1 - ease((f - HOOK_END) / 12);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 322, textAlign: 'center', opacity: out, zIndex: 5, transform: `scale(${1 + 0.06 * (1 - out)})`}}>
    <div style={{fontFamily: SERIF, fontSize: 92, lineHeight: 1.02, ...gold(f / FPS, 0.5), WebkitTextStroke: '2px #E7B040', filter: `${PUFF} drop-shadow(0 0 20px #FFC64A55)`}}>
      Three lanterns,</div>
    <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 70, lineHeight: 1.1, color: '#FFF3DA', textShadow: '0 3px 5px #000000cc'}}>one calm heart</div>
  </div>;
};

const EndCard: React.FC<{f: number}> = ({f}) => {
  if (f < END_TEXT) return null;
  const a = ease((f - END_TEXT) / 16), r1 = ease((f - END_TEXT) / 26), r2 = ease((f - END_TEXT - 14) / 26), en = ease((f - END_TEXT - 30) / 16);
  const t = f / FPS;
  return <div style={{position: 'absolute', left: 0, right: 0, top: 308, textAlign: 'center', opacity: a, zIndex: 5}}>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 82, lineHeight: 1.45, ...gold(t, 0.35), WebkitTextStroke: '1.5px #E7B040', clipPath: `inset(-40% 0 -40% ${100 - 100 * r1}%)`,
      filter: `${AR_PUFF} drop-shadow(0 0 24px #FFC64A77)`}}>{TX.ayah_a}</div>
    <div dir="rtl" style={{fontFamily: AR, fontSize: 60, lineHeight: 1.5, marginTop: -8, color: '#FFF3DA', WebkitTextStroke: '1px #FFF3DA',
      clipPath: `inset(-40% 0 -40% ${100 - 100 * r2}%)`, filter: 'drop-shadow(0 3px 3px #000000cc)'}}>{TX.ayah_b}</div>
    <div style={{opacity: en, transform: `translateY(${(1 - en) * 12}px)`}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, lineHeight: 1.2, color: '#FFF3DA', textShadow: '0 2px 4px #000000dd', margin: '10px 170px 0'}}>
        “{TX.ayah_en}”</div>
      <div style={{fontFamily: SERIF, fontSize: 24, lineHeight: 1.2, marginTop: 6, color: '#F6D58A', letterSpacing: 1, textShadow: '0 2px 3px #000000cc'}}>
        Quran 2:152 · Sahih International</div>
    </div>
  </div>;
};

const CtaPill: React.FC<{f: number}> = ({f}) => {
  if (f < CTA) return null;
  const i = springy((f - CTA) / FPS, 1.3), o = c01((f - CTA) / 4);
  return <div style={{position: 'absolute', left: 0, right: 0, top: 724, display: 'flex', justifyContent: 'center', opacity: o, zIndex: 6}}>
    <div style={{padding: '7px 30px 10px', borderRadius: 40, background: 'linear-gradient(180deg, #F8EBD2, #EBD5AE)', border: '3px dashed #B8742B',
      boxShadow: '0 8px 18px #000000aa, 0 0 22px #FFC64A66', transform: `translateY(${(1 - i) * 26}px) scale(${0.7 + 0.3 * i})`,
      fontFamily: SERIF, fontStyle: 'italic', fontSize: 33, lineHeight: 1.1, color: '#4A2A1C', whiteSpace: 'nowrap'}}>✦ Save it for after your salah ✦</div>
  </div>;
};

/** the felt tags on the sill: name and count per lantern */
export const Tag: React.FC<{g: number; f: number; allDone?: boolean}> = ({g, f, allDone = false}) => {
  const P = PHASE[g], n = setCount(g, f), done = n >= 33, active = setAt(f) === g && !done;
  const last = SETS[g].filter((x) => f >= x).pop() ?? -99, pop = 1 + 0.25 * pulse((f - last) / FPS, 0.28);
  const finish = springy((f - SETS[g][32]) / FPS, 1.3);
  return <div style={{position: 'absolute', left: LX[g] - 92, width: 184, top: 1398, textAlign: 'center', zIndex: 6,
    transform: `scale(${active ? 1.05 : 1})`, opacity: active || done || allDone ? 1 : 0.8}}>
    <div style={{display: 'inline-block', padding: '3px 14px 6px', borderRadius: 14, background: done ? `linear-gradient(180deg, ${P.light}, #F6EAD3)` : '#F6EAD3',
      border: `2.5px dashed ${active || done ? P.deep : '#A88B6A'}`, boxShadow: `0 5px 10px #00000099${done ? `, 0 0 ${10 + 10 * pulse((f - SETS[g][32]) / FPS, 0.5)}px ${P.glow}` : ''}`}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 25, lineHeight: 1.05, color: '#3E2418'}}>{P.tr}</div>
      <div style={{fontFamily: SERIF, fontSize: 23, lineHeight: 1.05, color: done ? P.deep : '#5A3A28'}}>
        <span style={{display: 'inline-block', transform: `scale(${pop})`}}>{n}</span> / 33{done ? <span style={{display: 'inline-block', marginLeft: 6,
          transform: `scale(${finish})`, color: P.deep}}>✓</span> : null}</div>
    </div>
  </div>;
};

// eight-pointed star light thrown on the wall under the sill at 99
const STAR8 = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.62 : r; pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`); }
  return pts.join(' ');
};
const WALL_STARS = Array.from({length: 14}, (_, k) => ({x: 90 + (k % 7) * 150 + (Math.floor(k / 7) % 2) * 75, y: 1600 + Math.floor(k / 7) * 140, r: 36 + random(`ws${k}`) * 14, g: k % 3}));
const WallLight: React.FC<{f: number}> = ({f}) => {
  const o = ease((f - COMPLETE - 6) / 24);
  if (o <= 0) return null;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen', opacity: 0.55 * o}}>
    {WALL_STARS.map((s, k) => <polygon key={k} points={STAR8(s.x, s.y + 6 * Math.sin(f / 30 + k), s.r * (0.8 + 0.2 * ease((f - COMPLETE - 6 - k * 2) / 14)))}
      fill={PHASE[s.g].glow} opacity={0.45 + 0.15 * Math.sin(f / 13 + k)} filter="url(#soft2)"/>)}
  </svg>;
};

export const LanternKnit: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, u = dusk(f);
  const g = setAt(f);
  const end = ease((f - COMPLETE) / 24);
  const flare = (k: number) => pulse((f - COMPLETE - k * 4) / FPS, 0.6);
  const cam = 1 + 0.03 * c01(f / FRAMES) + 0.025 * end;
  // the reference fades out over its last 0.9 s; here only the scene dims, so the verse and the CTA hold to the last frame
  const fadeOut = 1 - 0.5 * inout((f - FADE) / (FRAMES - 1 - FADE));
  const order = [0, 1, 2].sort((a, b) => (a === g ? 1 : 0) - (b === g ? 1 : 0));
  return <AbsoluteFill style={{background: '#120F2C', overflow: 'hidden'}}>
    <YarnDefs/>
    <ArDefs/>
    <Filters/>
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '540px 1150px', opacity: fadeOut}}>
        <Sky u={u}/>
        <Stars f={f} u={u}/>
        <Img src={staticFile('bg.png')} style={{position: 'absolute', inset: 0, width: 1080, height: 1920,
          filter: `brightness(${1 - 0.45 * u}) saturate(${1 - 0.1 * u})`}}/>
        {/* night settles on the room: a cool wash that the lantern light cuts through */}
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 70%, #1B1D4A00 0%, #1B1D4A66 100%)', opacity: u}}/>
        <WallLight f={f}/>
        {[0, 1, 2].map((k) => <Halo key={k} g={k} f={f} u={u} boost={0.3 * flare(k)}/>)}
        {order.map((k, z) => <Lantern key={k} g={k} f={f} u={u} boost={0.25 * flare(k)} z={z + 1}/>)}
        <div style={{position: 'absolute', inset: 0, zIndex: 4}}>
          <Tasbih f={f}/>
          <Crescent f={f} glow={end}/>
        </div>
      </AbsoluteFill>
      {/* pompom bursts: each completed lantern, and all three at 99 */}
      <div style={{position: 'absolute', inset: 0, zIndex: 5}}>
        {[0, 1, 2].map((k) => <Burst key={k} t={t} t0={(SETS[k][32] - LAND) / FPS} x={LX[k]} y={LT + 150} n={16} seed={`set${k}`} power={0.6} size={0.85}
          cols={[PHASE[k].main, PHASE[k].light, '#F5B83D', PHASE[k].deep]}/>)}
        {[0, 1, 2].map((k) => <Burst key={`e${k}`} t={t} t0={(COMPLETE + k * 4) / FPS} x={LX[k]} y={LT + 120} n={18} seed={`end${k}`} power={0.9} size={0.95}
          cols={[PHASE[k].main, PHASE[k].light, '#FFE8A8', '#FBF1DC']}/>)}
      </div>
      <Handle top={222} endP={c01((f - COMPLETE) / 30)}/>
      <Header f={f}/>
      <Hook f={f}/>
      <Dhikr f={f} g={0} a={HOOK_END} b={TEXT_SW[0]} stitch/>
      <Dhikr f={f} g={1} a={TEXT_SW[0]} b={TEXT_SW[1]}/>
      <Dhikr f={f} g={2} a={TEXT_SW[1]} b={END_TEXT}/>
      <EndCard f={f}/>
      <CtaPill f={f}/>
      {[0, 1, 2].map((k) => <Tag key={k} g={k} f={f} allDone={f >= COMPLETE}/>)}
    </AbsoluteFill>
  </AbsoluteFill>;
};
